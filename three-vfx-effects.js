const ThreeVFXEffects = (function () {
    'use strict';

    function rn(a, b) { return a + Math.random() * (b - a); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function _cfg() {
        return (typeof CONFIG !== 'undefined') ? CONFIG : { tileSize: 128, tileGap: 0, boardPadding: 2 };
    }

    function tilePx(tx, ty) {
        var cfg = _cfg();
        var ts = cfg.tileSize || 128;
        var gap = cfg.tileGap || 0;
        var pad = cfg.boardPadding || 2;
        return { x: pad + tx * (ts + gap) + ts / 2, y: pad + ty * (ts + gap) + ts / 2 };
    }

    function tileZ(tx, ty) {
        if (typeof state === 'undefined') return 0;
        if (typeof window._getElevationPx !== 'function') return 0;
        var ix = Math.round(tx), iy = Math.round(ty);
        var baseH = (state.boardHeights && state.boardHeights[iy]) ? state.boardHeights[iy][ix] : 0;
        if (baseH == null && typeof getHeightAt === 'function') baseH = getHeightAt(ix, iy);
        baseH = baseH || 0;
        var z = baseH !== 0 ? window._getElevationPx(baseH) : 0;
        if (typeof getObjectAt === 'function') {
            var obj = getObjectAt(ix, iy);
            if (obj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[obj] && OBJECT_RULES[obj].roofWalkable) {
                var oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                if (oSpr && oSpr._roofZPx > 0) z += oSpr._roofZPx;
            }
        }
        return z;
    }

    function unitSurfaceZ(tx, ty) {
        var terrainZ = tileZ(tx, ty);
        if (typeof state === 'undefined' || !Array.isArray(state.units)) return terrainZ;
        if (typeof window._getElevationPx !== 'function') return terrainZ;
        var ix = Math.round(tx), iy = Math.round(ty);

        var u = null;
        for (var i = 0; i < state.units.length; i++) {
            var c = state.units[i];
            if (c.dead || c._dying) continue;
            if (c.x === ix && c.y === iy) { u = c; break; }

            if (c._isBoss && c._bossSize === 2 &&
                (ix === c.x || ix === c.x + 1) && (iy === c.y || iy === c.y + 1)) { u = c; break; }
        }
        if (!u || u.z == null) return terrainZ;
        var groundH = 0;
        if (typeof getHeightAt === 'function') groundH = getHeightAt(ix, iy) || 0;

        if (u.z > groundH) {
            return window._getElevationPx(u.z);
        }
        return terrainZ;
    }

    function unitZBoost() {
        /* Torso anchor: unit billboards are ~1 tile tall standing on the
           surface, so projectiles/beams/bolts aim mid-body. This is a fixed
           world-space offset — the old diorama-tilt-dependent boost made the
           aim height change with the camera angle (near the feet when viewed
           top-down, mid-air at cinematic tilts). */
        var ts = _cfg().tileSize || 128;
        return ts * 0.45;
    }

    function _suppressed() {
        if (typeof state === 'undefined') return true;
        if (state.devAutoSim) return true;
        if (state.animationsDisabled) return true;
        if (state.phase !== 'battle') return true;
        return false;
    }

    function _catOff(cat) {
        if (typeof state !== 'undefined' && state.particleSettings && state.particleSettings[cat] === false) return true;
        return false;
    }

    function _canSpawn() {
        return window.ThreeVFX && window.ThreeVFX.isActive();
    }

    function _spawn(opts) {
        return window.ThreeVFX.spawn(opts);
    }

    var _THEME_MAP = {
        fire:      { core: 'flame-hot',    trail: 'ember',       burst: 'explosion-orange', ring: 'target-ring' },
        ice:       { core: 'frost-crystal', trail: 'ice-shard',  burst: 'frost-mist',       ring: 'target-ring-blue' },
        lightning: { core: 'spark-elec',    trail: 'lightning',   burst: 'spark-blue',       ring: 'stun-ring' },
        divine:    { core: 'divine-sparkle', trail: 'holy-light', burst: 'holy-pillar',      ring: 'halo-ring' },
        unholy:    { core: 'dark-flame',    trail: 'void-mist',  burst: 'psi-pulse',        ring: 'target-ring' },
        tech:      { core: 'plasma',        trail: 'spark-elec', burst: 'emp-arc',          ring: 'target-ring-blue' },
        alien:     { core: 'ufo-glow',      trail: 'acid-green', burst: 'poison-bubble',    ring: 'target-ring-green' },
        anomaly:   { core: 'psi-pulse',     trail: 'laser-pink', burst: 'void-mist',        ring: 'target-ring' },
        human:     { core: 'flash',         trail: 'ember',      burst: 'dust-puff',        ring: 'target-ring' },
        heal:      { core: 'heal-cross',    trail: 'heal-glow',  burst: 'divine-sparkle',   ring: 'target-ring-green' },
        poison:    { core: 'poison-bubble', trail: 'poison-mist', burst: 'acid-green',      ring: 'target-ring-green' },
    };

    function _resolveTheme(spellType, spellId, spellName) {
        var s = ((spellId || '') + (spellName || '')).toLowerCase();
        if (/fire|flame|inferno|burn|blaze|scorch|ember|magma|lava|solar|corona/.test(s)) return _THEME_MAP.fire;
        if (/ice|frost|blizzard|freeze|cryo|cold|glacial|frozen|chill/.test(s)) return _THEME_MAP.ice;
        if (/lightning|thunder|bolt|shock|electr|chain|static|spark|emp/.test(s)) return _THEME_MAP.lightning;
        if (/poison|toxic|venom|acid|plague/.test(s)) return _THEME_MAP.poison;
        if (/heal|restore|mend|rejuv|sanctuary|tidal|blessing/.test(s)) return _THEME_MAP.heal;
        return _THEME_MAP[spellType] || _THEME_MAP.human;
    }

    var _projEffects = [];

    function projectile(fromTx, fromTy, toTx, toTy, spellType, spellId, spellName, fromZ, toZ, travelMs) {
        if (_suppressed() || _catOff('projectiles') || !_canSpawn()) return;

        var ts = _cfg().tileSize || 128;
        var from = tilePx(fromTx, fromTy);
        var to = tilePx(toTx, toTy);
        var fz = (fromZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(fromZ) : unitSurfaceZ(fromTx, fromTy);
        var tz = (toZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(toZ) : unitSurfaceZ(toTx, toTy);

        var boost = unitZBoost();
        fz += boost;
        tz += boost;

        var dx = to.x - from.x, dy = to.y - from.y, dz = tz - fz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        var durMs = (travelMs > 0) ? travelMs : Math.max(200, (dist / 550) * 1000);

        var theme = _resolveTheme(spellType, spellId, spellName);

        _projEffects.push({
            from: { x: from.x, y: from.y, z: fz },
            to: { x: to.x, y: to.y, z: tz },
            dx: dx / dist, dy: dy / dist, dz: dz / dist,
            dist: dist,
            durMs: durMs,
            elapsed: 0,
            hit: false,
            theme: theme,
            spawnAcc: 0,
            ts: ts
        });
    }

    function _tickProjectiles(dt) {
        var dtMs = dt * 1000;
        for (var i = _projEffects.length - 1; i >= 0; i--) {
            var e = _projEffects[i];
            e.elapsed += dtMs;
            var p = Math.min(e.elapsed / e.durMs, 1);

            var hx = lerp(e.from.x, e.to.x, p);
            var hy = lerp(e.from.y, e.to.y, p);
            var hz = lerp(e.from.z, e.to.z, p);

            if (p < 1) {

                e.spawnAcc += dtMs;
                while (e.spawnAcc >= 8) {
                    e.spawnAcc -= 8;

                    _spawn({
                        x: hx + rn(-3, 3), y: hy + rn(-3, 3), z: hz + rn(-3, 3),
                        mode: 'billboard', sprite: e.theme.core,
                        ml: 100 + rn(0, 60),
                        size0: e.ts * 0.08 + rn(0, e.ts * 0.04),
                        size1: 0,
                        opacity0: 1, opacity1: 0,
                    });

                    _spawn({
                        x: hx + rn(-6, 6), y: hy + rn(-6, 6), z: hz + rn(-4, 4),
                        vx: -e.dx * rn(20, 60) + rn(-15, 15),
                        vy: -e.dy * rn(20, 60) + rn(-15, 15),
                        vz: -e.dz * rn(10, 30) + rn(-10, 10),
                        mode: 'billboard', sprite: e.theme.trail,
                        ml: 200 + rn(0, 300),
                        size0: e.ts * 0.04 + rn(0, e.ts * 0.03),
                        size1: 0,
                        opacity0: 0.7 + rn(0, 0.3), opacity1: 0,
                        drag: 1.5,
                    });
                }
            }

            if (p >= 1 && !e.hit) {
                e.hit = true;
                var tx = e.to.x, ty = e.to.y, tz2 = e.to.z;

                for (var j = 0; j < 6; j++) {
                    _spawn({
                        x: tx + rn(-4, 4), y: ty + rn(-4, 4), z: tz2 + rn(-4, 4),
                        mode: 'billboard', sprite: 'flash',
                        ml: 80 + rn(0, 40),
                        size0: e.ts * 0.15 + rn(0, e.ts * 0.08),
                        size1: e.ts * 0.02,
                        opacity0: 1, opacity1: 0,
                    });
                }

                for (var k = 0; k < 35; k++) {
                    var ang = rn(0, 6.28);
                    var elev = rn(-0.5, 1.0);
                    var spd = rn(40, 180);
                    _spawn({
                        x: tx + rn(-5, 5), y: ty + rn(-5, 5), z: tz2 + rn(-3, 3),
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        vz: elev * spd * 0.5,
                        mode: 'billboard', sprite: e.theme.burst,
                        ml: 180 + rn(0, 350),
                        size0: e.ts * 0.04 + rn(0, e.ts * 0.05),
                        size1: 0,
                        opacity0: 0.6 + rn(0, 0.4), opacity1: 0,
                        drag: 2.0,
                        gravity: -20,
                    });
                }

                _spawn({
                    x: tx, y: ty, z: tz2 - unitZBoost(),
                    mode: 'world', sprite: e.theme.ring,
                    ml: 600,
                    size0: e.ts * 0.3, size1: e.ts * 1.2,
                    opacity0: 0.8, opacity1: 0,
                });
            }

            if (e.elapsed > e.durMs + 500) {
                _projEffects.splice(i, 1);
            }
        }
    }

    var _beamEffects = [];

    function beam(fromTx, fromTy, toTx, toTy, spellType, spellId, spellName, fromZ, toZ) {
        if (_suppressed() || _catOff('projectiles') || !_canSpawn()) return;

        var ts = _cfg().tileSize || 128;
        var from = tilePx(fromTx, fromTy);
        var to = tilePx(toTx, toTy);
        var boost = unitZBoost();
        var fz = ((fromZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(fromZ) : unitSurfaceZ(fromTx, fromTy)) + boost;
        var tz = ((toZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(toZ) : unitSurfaceZ(toTx, toTy)) + boost;

        var dx = to.x - from.x, dy = to.y - from.y, dz = tz - fz;
        var lenXY = Math.sqrt(dx * dx + dy * dy);
        var len3D = Math.sqrt(lenXY * lenXY + dz * dz) || 1;

        var theme = _resolveTheme(spellType, spellId, spellName);

        var yawDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        var pitchDeg = -Math.atan2(dz, lenXY) * 180 / Math.PI;
        var midX = (from.x + to.x) / 2;
        var midY = (from.y + to.y) / 2;
        var midZ = (fz + tz) / 2;

        _spawn({
            x: midX, y: midY, z: midZ,
            mode: 'beam', sprite: theme.core,
            ml: 350,
            w0: len3D, w1: len3D,
            h0: ts * 0.12, h1: ts * 0.04,
            opacity0: 1, opacity1: 0,
            beamYawDeg: yawDeg, beamPitchDeg: pitchDeg,
        });
        _spawn({
            x: midX, y: midY, z: midZ,
            mode: 'beam', sprite: theme.trail,
            ml: 400,
            w0: len3D, w1: len3D,
            h0: ts * 0.22, h1: ts * 0.08,
            opacity0: 0.5, opacity1: 0,
            beamYawDeg: yawDeg, beamPitchDeg: pitchDeg,
        });

        var nx = dx / len3D, ny = dy / len3D, nz = dz / len3D;

        var px = -ny, py = nx;
        var steps = Math.max(6, Math.floor(len3D / 15));
        for (var s = 0; s < steps; s++) {
            var t = s / steps;
            var bx = from.x + dx * t;
            var by = from.y + dy * t;
            var bz = fz + dz * t;
            for (var j = 0; j < 3; j++) {
                var side = (Math.random() > 0.5 ? 1 : -1);
                _spawn({
                    x: bx + px * side * rn(3, 12) + rn(-3, 3),
                    y: by + py * side * rn(3, 12) + rn(-3, 3),
                    z: bz + rn(-5, 5),
                    vx: px * side * rn(20, 60),
                    vy: py * side * rn(20, 60),
                    vz: rn(-20, 20),
                    mode: 'billboard', sprite: theme.burst,
                    ml: 150 + rn(0, 250),
                    size0: ts * 0.03 + rn(0, ts * 0.03),
                    size1: 0,
                    opacity0: 0.65, opacity1: 0,
                    drag: 2.5,
                });
            }
        }

        _spawn({
            x: to.x, y: to.y, z: tz,
            mode: 'billboard', sprite: 'flash',
            ml: 200,
            size0: ts * 0.2, size1: ts * 0.05,
            opacity0: 1, opacity1: 0,
        });

        _spawn({
            x: from.x, y: from.y, z: fz,
            mode: 'billboard', sprite: 'flash',
            ml: 120,
            size0: ts * 0.12, size1: ts * 0.03,
            opacity0: 0.9, opacity1: 0,
        });
    }

    function aoe(centerTx, centerTy, spellType, spellId, spellName, centerZ) {
        if (_suppressed() || _catOff('aoe') || !_canSpawn()) return;

        var ts = _cfg().tileSize || 128;
        var c = tilePx(centerTx, centerTy);
        var z = (centerZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(centerZ) : unitSurfaceZ(centerTx, centerTy);

        var theme = _resolveTheme(spellType, spellId, spellName);

        for (var f = 0; f < 8; f++) {
            _spawn({
                x: c.x + rn(-4, 4), y: c.y + rn(-4, 4), z: z + unitZBoost() + rn(-3, 3),
                mode: 'billboard', sprite: 'flash',
                ml: 80 + rn(0, 50),
                size0: ts * 0.18 + rn(0, ts * 0.1),
                size1: ts * 0.02,
                opacity0: 1, opacity1: 0,
            });
        }

        for (var i = 0; i < 70; i++) {
            var ang = rn(0, 6.28);
            var elev = rn(-0.3, 0.8);
            var spd = rn(50, 250);
            var isSpark = Math.random() < 0.25;
            _spawn({
                x: c.x + rn(-6, 6), y: c.y + rn(-6, 6), z: z + rn(-3, 3),
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                vz: elev * spd * 0.6,
                mode: 'billboard',
                sprite: isSpark ? theme.trail : theme.burst,
                ml: 200 + rn(0, 450),
                size0: isSpark ? ts * 0.02 + rn(0, ts * 0.02) : ts * 0.05 + rn(0, ts * 0.06),
                size1: 0,
                opacity0: isSpark ? 1 : 0.55 + rn(0, 0.45),
                opacity1: 0,
                drag: 2.0,
                gravity: -15,
            });
        }

        _spawn({
            x: c.x, y: c.y, z: z + 1,
            mode: 'world', sprite: theme.ring,
            ml: 800,
            size0: ts * 0.2, size1: ts * 2.5,
            opacity0: 0.85, opacity1: 0,
        });

        _spawn({
            x: c.x, y: c.y, z: z + 1,
            mode: 'world', sprite: 'shockwave',
            ml: 600,
            size0: ts * 0.4, size1: ts * 1.8,
            opacity0: 0.6, opacity1: 0,
        });
    }

    var _zoneSpawnAcc = 0;
    var _ZONE_RATE_MS = 33;

    function _tickPersistentZones(dt) {
        if (!_canSpawn()) return;
        if (typeof state === 'undefined' || !state._activeZones || !state._activeZones.length) return;
        if (state.devAutoSim || state.animationsDisabled) return;
        if (_catOff('zones')) return;

        var ts = _cfg().tileSize || 128;
        var gap = _cfg().tileGap || 0;

        _zoneSpawnAcc += dt * 1000;
        if (_zoneSpawnAcc < _ZONE_RATE_MS) return;

        while (_zoneSpawnAcc >= _ZONE_RATE_MS) {
            _zoneSpawnAcc -= _ZONE_RATE_MS;

            for (var zi = 0; zi < state._activeZones.length; zi++) {
                var zone = state._activeZones[zi];
                var center = tilePx(zone.x, zone.y);
                var baseZ = tileZ(zone.x, zone.y);
                var R = ((zone.radius || 1) + 0.5) * (ts + gap);
                var isHeal = zone.type === 'heal';

                /* ── Smoke Screen: a real billowing smoke bank that fills the
                   whole zone in 3D and lingers for the zone's full duration.
                   Several large, ground-hugging puffs per tick (dark, opaque,
                   normal-blended 'smoke' sprite) instead of a thin wisp. ── */
                if (zone.smokeConcealment) {
                    for (var sp = 0; sp < 3; sp++) {
                        var sAng = rn(0, 6.2832);
                        var sRad = Math.sqrt(Math.random()) * R;   // uniform disc fill
                        _spawn({
                            _zone: true,
                            x: center.x + Math.cos(sAng) * sRad,
                            y: center.y + Math.sin(sAng) * sRad,
                            z: baseZ + rn(2, ts * 0.45),
                            vx: Math.cos(sAng) * rn(-3, 3),
                            vy: Math.sin(sAng) * rn(-3, 3),
                            vz: rn(3, 14),
                            mode: 'billboard', sprite: 'smoke',
                            ml: 1000 + rn(0, 700),
                            size0: ts * 0.06 + rn(0, ts * 0.05),
                            size1: ts * 0.16,
                            opacity0: 0.5 + rn(0, 0.22), opacity1: 0,
                            drag: 1.1,
                            gravity: -3,
                        });
                    }
                    continue;
                }

                var rx = rn(-R, R), ry = rn(-R, R);
                if (rx * rx + ry * ry > R * R) continue;

                if (isHeal) {

                    var name = (zone.spellName || '').toLowerCase();
                    var sprite = 'heal-cross';
                    if (/tidal|water|ocean|wave|sea|aqua|temporal.*tide/.test(name)) sprite = 'wave-1';
                    else if (/sanctuary/.test(name)) sprite = 'divine-sparkle';

                    _spawn({
                        _zone: true,
                        x: center.x + rx, y: center.y + ry,
                        z: baseZ + rn(2, 10),
                        vx: rn(-3, 3), vy: rn(-3, 3),
                        vz: rn(15, 35),
                        mode: 'billboard', sprite: sprite,
                        ml: 500 + rn(0, 500),
                        size0: ts * 0.02 + rn(0, ts * 0.02),
                        size1: 0,
                        opacity0: 0.35 + rn(0, 0.25), opacity1: 0,
                        drag: 0.8,
                        gravity: -8,
                    });

                    if (Math.random() < 0.15) {
                        _spawn({
                            _zone: true,
                            x: center.x + rn(-R * 0.7, R * 0.7),
                            y: center.y + rn(-R * 0.7, R * 0.7),
                            z: baseZ + rn(5, 15),
                            vx: rn(-2, 2), vy: rn(-2, 2),
                            vz: rn(25, 50),
                            mode: 'billboard', sprite: 'holy-light',
                            ml: 300 + rn(0, 200),
                            size0: ts * 0.03 + rn(0, ts * 0.03),
                            size1: 0,
                            opacity0: 0.7, opacity1: 0,
                            drag: 1.2,
                            gravity: -12,
                        });
                    }
                } else {

                    var dName = (zone.spellName || '').toLowerCase();
                    var dSprite = 'void-mist';
                    if (/cold|frost|ice|chill|cryo/.test(dName)) dSprite = 'frost-mist';
                    else if (/poison|toxic|acid/.test(dName)) dSprite = 'poison-mist';

                    _spawn({
                        _zone: true,
                        x: center.x + rx, y: center.y + ry,
                        z: baseZ + rn(10, 25),
                        vx: rn(-5, 5), vy: rn(-5, 5),
                        vz: rn(-20, -5),
                        mode: 'billboard', sprite: dSprite,
                        ml: 400 + rn(0, 450),
                        size0: ts * 0.025 + rn(0, ts * 0.025),
                        size1: ts * 0.005,
                        opacity0: 0.3 + rn(0, 0.2), opacity1: 0,
                        drag: 1.0,
                        gravity: 8,
                    });

                    if (Math.random() < 0.12) {
                        var wa = rn(0, 6.28);
                        _spawn({
                            _zone: true,
                            x: center.x + Math.cos(wa) * R * 0.6,
                            y: center.y + Math.sin(wa) * R * 0.6,
                            z: baseZ + rn(5, 20),
                            vx: Math.cos(wa) * rn(-8, 8),
                            vy: Math.sin(wa) * rn(-8, 8),
                            vz: rn(-12, -3),
                            mode: 'billboard', sprite: 'smoke',
                            ml: 350 + rn(0, 250),
                            size0: ts * 0.03 + rn(0, ts * 0.02),
                            size1: ts * 0.01,
                            opacity0: 0.4, opacity1: 0,
                            drag: 1.5,
                            gravity: 5,
                        });
                    }
                }
            }
        }
    }

    function startTornado3D() {  }
    function stopTornado3D()  {  }
    function isTornado3DActive() { return false; }

    function startSandstorm3D() {  }
    function stopSandstorm3D()  {  }
    function isSandstorm3DActive() { return false; }

    function tick(dt) {
        _tickProjectiles(dt);
        _tickBolts(dt);
        _tickPersistentZones(dt);
    }

    function clear() {
        _projEffects.length = 0;
        _boltEffects.length = 0;
        _zoneSpawnAcc = 0;
        stopTornado3D();
        stopSandstorm3D();
    }

    var _EFX_DATA = {"E":{"fire1_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1500,"z":1,"s0":96,"s1":112,"o0":0.9},{"s":"flash","l":220,"s0":96,"s1":28},{"n":18,"s":"ember","l":[400,700],"o":6,"vx":150,"vy":150,"vz":[40,180],"g":380,"dr":1.5,"s0":[10,16],"s1":2},{"n":4,"d":100,"m":"y-locked","s":"smoke","l":[900,1400],"o":18,"vz":[25,50],"dr":0.4,"s0":[44,58],"s1":110,"o0":0.65}]},"fire2_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1800,"z":1,"s0":120,"s1":140,"o0":0.95},{"s":"flash","l":320,"z":6,"s0":140,"s1":40},{"n":35,"s":"ember","l":[500,850],"o":8,"vx":220,"vy":220,"vz":[60,240],"g":380,"dr":1.4,"s0":[10,18],"s1":2},{"n":6,"d":30,"a":"floor","m":"y-locked","s":"flame","l":[400,600],"o":22,"w0":18,"w1":8,"h0":28,"h1":70},{"n":8,"d":120,"m":"y-locked","s":"smoke","l":[1000,1500],"o":22,"vz":[30,55],"dr":0.4,"s0":[54,72],"s1":140,"o0":0.7}]},"wallOfFire_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":2800,"z":1,"s0":120,"s1":140,"o0":0.95},{"a":"floor","m":"world","s":"fire-glow","l":1500,"z":2,"s0":124,"s1":150,"o0":0.85},{"a":"floor","m":"y-locked","s":"flame","l":1000,"w0":110,"w1":92,"h0":50,"h1":72,"o0":0.55},{"a":"floor","m":"y-locked","s":"flame","l":1400,"w0":78,"w1":40,"h0":100,"h1":210,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame-hot","l":1200,"w0":36,"w1":16,"h0":78,"h1":170},{"n":3,"d":30,"a":"floor","m":"y-locked","s":"flame","l":[800,1200],"o":26,"w0":[22,32],"w1":[10,18],"h0":[42,68],"h1":[90,140],"o0":0.95},{"n":3,"d":420,"a":"floor","m":"y-locked","s":"flame","l":[600,950],"o":28,"w0":[18,28],"w1":[8,14],"h0":[36,58],"h1":[80,125],"o0":0.9},{"n":6,"d":100,"a":"floor","m":"y-locked","s":"flame","l":[220,480],"o":34,"w0":[8,14],"w1":[4,8],"h0":[14,24],"h1":[38,65]},{"n":4,"d":720,"a":"floor","m":"y-locked","s":"flame","l":[200,420],"o":32,"w0":[8,14],"w1":[4,8],"h0":[12,22],"h1":[32,55],"o0":0.95},{"n":14,"a":"floor","s":"ember","l":[400,780],"z":10,"o":18,"vx":140,"vy":140,"vz":[40,180],"g":340,"dr":1.4,"s0":[10,16],"s1":2},{"n":8,"d":350,"a":"floor","s":"ember","l":[300,600],"z":14,"o":16,"vx":110,"vy":110,"vz":[50,160],"g":360,"dr":1.4,"s0":[8,14],"s1":2},{"n":5,"d":750,"a":"floor","s":"ember","l":[250,500],"z":12,"o":14,"vx":90,"vy":90,"vz":[40,130],"g":360,"dr":1.4,"s0":[6,12],"s1":2},{"n":8,"d":50,"a":"floor","s":"ember","l":[700,1300],"z":22,"o":20,"vx":40,"vy":40,"vz":[180,380],"g":80,"dr":1,"s0":[4,8],"s1":1},{"n":5,"d":500,"a":"floor","s":"ember","l":[600,1100],"z":20,"o":18,"vx":30,"vy":30,"vz":[200,360],"g":80,"dr":1,"s0":[3,6],"s1":1},{"n":3,"d":200,"a":"floor","m":"y-locked","s":"smoke","l":[900,1300],"o":20,"z":60,"vz":[28,50],"dr":0.45,"s0":[50,70],"s1":130,"o0":0.6},{"n":3,"d":600,"a":"floor","m":"y-locked","s":"smoke","l":[800,1200],"o":22,"z":65,"vz":[30,50],"dr":0.45,"s0":[46,66],"s1":120,"o0":0.55},{"n":2,"d":1000,"a":"floor","m":"y-locked","s":"smoke","l":[700,1100],"o":20,"z":70,"vz":[25,45],"dr":0.45,"s0":[42,62],"s1":110,"o0":0.5}]},"meteor_descent":{"dsm":700,"tm":800,"ar":1,"ite":"meteor_impact_tile","ice":"meteor_impact_center","ts":"target-ring","L":[{"s":"flash","l":700,"s0":220,"s1":220,"o0":0.7,"o1":0.9,"_d":{"fromZ":720,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":700,"s0":130,"s1":100,"o1":1,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":22,"jitter":14,"msRange":[350,650],"sizeRange":[12,20]}}}]},"meteor_impact_tile":{"L":[{"m":"world","s":"scorch","l":2200,"z":1,"s0":116,"s1":138,"o0":0.92},{"m":"y-locked","s":"flame","l":1000,"w0":48,"w1":18,"h0":56,"h1":130},{"n":4,"d":40,"m":"y-locked","s":"flame","l":[500,800],"o":24,"w0":18,"w1":8,"h0":28,"h1":70},{"n":28,"s":"ember","l":[450,850],"z":14,"o":12,"vx":220,"vy":220,"vz":[60,240],"g":400,"dr":1.4,"s0":[10,18],"s1":2},{"n":5,"d":120,"m":"y-locked","s":"smoke","l":[1000,1500],"o":24,"z":22,"vz":[30,60],"dr":0.4,"s0":[54,76],"s1":150,"o0":0.7}]},"meteor_impact_center":{"sk":"hard","L":[{"s":"flash","l":420,"z":30,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":480,"o0":0.9}]},"radiantBolt_descent":{"dsm":380,"tm":280,"ar":0,"ice":"radiantBolt_impact","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":380,"w0":60,"w1":80,"h0":800,"h1":200,"o1":0.9,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":380,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}}]},"radiantBolt_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":80,"s1":240},{"s":"flash","l":280,"s0":140,"s1":36},{"n":22,"s":"divine-sparkle","l":[500,900],"o":6,"vx":180,"vy":180,"vz":[60,220],"g":100,"dr":1.2,"s0":[10,18],"s1":2},{"n":10,"d":80,"s":"holy-light","l":[900,1400],"o":14,"z":6,"vx":40,"vy":40,"vz":[80,180],"g":-40,"dr":0.8,"s0":[8,14],"s1":1,"o0":0.9}]},"judgment_descent":{"dsm":400,"tm":500,"ar":1,"ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":400,"w0":110,"w1":140,"h0":1000,"h1":280,"o1":0.92,"_d":{"fromZ":1000,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":400,"s0":260,"s1":300,"o1":0.95,"_d":{"fromZ":1000,"toZ":null,"ease":"easeIn"}}]},"judgment_impact_tile":{"L":[{"m":"world","s":"halo-ring","l":1400,"z":1,"s0":100,"s1":160,"o0":0.9},{"m":"y-locked","s":"holy-pillar","l":700,"w0":44,"w1":22,"h0":80,"h1":180},{"n":16,"s":"divine-sparkle","l":[450,800],"z":12,"o":14,"vx":200,"vy":200,"vz":[50,220],"g":120,"dr":1.3,"s0":[10,16],"s1":2},{"n":5,"d":100,"s":"holy-light","l":[800,1200],"z":20,"o":18,"vx":40,"vy":40,"vz":[100,200],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.9}]},"judgment_impact_center":{"sk":"hard","L":[{"s":"flash","l":460,"z":30,"s0":280,"s1":70},{"m":"world","s":"shockwave","l":720,"z":2,"s0":60,"s1":520,"o0":0.9},{"d":30,"m":"world","s":"halo-ring","l":1100,"z":3,"s0":120,"s1":460,"o0":0.85}]},"nuke_descent":{"dsm":900,"tm":950,"ar":2,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":500,"durationMs":1000,"delayMs":80,"trailCount":8},"L":[{"s":"flash","l":900,"s0":280,"s1":260,"o0":0.8,"o1":0.95,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"nuclear-missile","l":900,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":135,"_d":{"fromZ":880,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":20,"jitter":10,"msRange":[400,700],"sizeRange":[14,24]}}},{"s":"meteor","l":900,"z":-2,"s0":170,"s1":130,"o0":0.6,"o1":0.8,"_d":{"fromZ":885,"toZ":null,"ease":"easeIn","trail":{"sprite":"explosion-orange","rateMs":25,"jitter":18,"msRange":[350,600],"sizeRange":[14,22]}}}]},"nuke_impact_tile":{"L":[{"m":"world","s":"scorch","l":2400,"z":1,"s0":122,"s1":150,"o0":0.92},{"m":"y-locked","s":"flame","l":1100,"w0":52,"w1":20,"h0":70,"h1":150},{"n":24,"s":"explosion-orange","l":[450,800],"z":16,"o":14,"vx":240,"vy":240,"vz":[70,250],"g":380,"dr":1.4,"s0":[12,22],"s1":3},{"n":6,"d":140,"m":"y-locked","s":"smoke","l":[1100,1600],"o":26,"z":24,"vz":[40,70],"dr":0.4,"s0":[56,80],"s1":170,"o0":0.75}]},"nuke_impact_center":{"sk":"hard","L":[{"s":"flash","l":500,"z":30,"s0":320,"s1":80},{"m":"world","s":"shockwave","l":850,"z":2,"s0":80,"s1":720,"o0":0.95},{"d":60,"m":"y-locked","s":"plasma","l":1600,"w0":70,"w1":120,"h0":200,"h1":460,"o0":0.95},{"d":120,"s":"explosion-orange","l":1500,"z":380,"s0":220,"s1":540},{"n":8,"d":200,"s":"explosion-orange","l":[900,1300],"z":360,"o":80,"vx":120,"vy":120,"vz":[-20,60],"g":60,"dr":0.7,"s0":[80,140],"s1":[40,80],"o0":0.9}]},"empBurst_descent":{"dsm":320,"tm":320,"ar":2,"ite":"empBurst_impact_tile","ice":"empBurst_impact_center","ts":"target-ring-blue","L":[{"m":"y-locked","s":"plasma","l":320,"w0":70,"w1":100,"h0":700,"h1":200,"o1":0.9,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":320,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}}]},"empBurst_impact_tile":{"L":[{"n":14,"s":"spark-elec","l":[350,650],"z":14,"o":10,"vx":180,"vy":180,"vz":[60,220],"g":280,"dr":1.5,"s0":[8,14],"s1":1},{"n":2,"d":40,"s":"emp-arc","l":[220,380],"z":18,"o":6,"w0":[60,100],"w1":[40,70],"h0":6,"h1":1}]},"empBurst_impact_center":{"sk":"normal","L":[{"s":"flash","l":360,"z":24,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":680,"z":2,"s0":70,"s1":620,"o0":0.9},{"n":12,"d":30,"s":"emp-arc","l":[300,500],"z":22,"o":18,"vx":220,"vy":220,"vz":[40,120],"g":60,"dr":1,"w0":[80,140],"w1":[50,90],"h0":7,"h1":1}]},"raceCosmicSlam_descent":{"dsm":240,"tm":200,"ar":1,"ite":"raceCosmicSlam_impact_tile","ice":"raceCosmicSlam_impact_center","ts":"target-ring","L":[{"s":"meteor","l":240,"s0":110,"s1":80,"o1":1,"_d":{"fromZ":600,"toZ":null,"ease":"easeIn","trail":{"sprite":"dust-puff","rateMs":20,"jitter":12,"msRange":[300,500],"sizeRange":[14,22]}}}]},"raceCosmicSlam_impact_tile":{"L":[{"m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":120,"o0":0.78},{"n":6,"s":"dust-puff","l":[800,1300],"z":20,"o":16,"vx":140,"vy":140,"vz":[40,120],"g":-20,"dr":0.6,"s0":[44,70],"s1":140,"o0":0.75},{"n":14,"s":"debris","l":[400,700],"z":10,"o":10,"vx":220,"vy":220,"vz":[80,240],"g":600,"dr":1.6,"s0":[6,12],"s1":2},{"n":8,"s":"ember","l":[350,600],"z":12,"o":12,"vx":160,"vy":160,"vz":[60,180],"g":420,"dr":1.5,"s0":[8,14],"s1":2}]},"raceCosmicSlam_impact_center":{"sk":"hard","L":[{"s":"flash","l":380,"z":20,"s0":220,"s1":50},{"m":"world","s":"shockwave","l":720,"z":2,"s0":70,"s1":540,"o0":0.95},{"n":3,"d":60,"s":"dust-puff","l":[1100,1500],"z":30,"o":12,"vz":[40,80],"dr":0.5,"s0":[100,130],"s1":240,"o0":0.8}]},"raceInfernalDecree_descent":{"dsm":450,"tm":450,"ar":1,"ite":"raceInfernalDecree_impact_tile","ice":"raceInfernalDecree_impact_center","ts":"target-ring","L":[{"m":"y-locked","s":"dark-flame","l":450,"w0":90,"w1":120,"h0":900,"h1":240,"o1":0.9,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":450,"s0":170,"s1":130,"o1":0.85,"_d":{"fromZ":880,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":22,"jitter":16,"msRange":[400,700],"sizeRange":[14,22]}}}]},"raceInfernalDecree_impact_tile":{"L":[{"m":"world","s":"scorch","l":2400,"z":1,"s0":118,"s1":140,"o0":0.96},{"m":"y-locked","s":"dark-flame","l":1100,"w0":48,"w1":22,"h0":70,"h1":160},{"n":4,"d":50,"m":"y-locked","s":"dark-flame","l":[500,800],"o":22,"w0":18,"w1":8,"h0":30,"h1":70},{"n":26,"s":"ember","l":[450,800],"z":14,"o":12,"vx":200,"vy":200,"vz":[60,220],"g":400,"dr":1.4,"s0":[10,16],"s1":2},{"n":5,"d":130,"m":"y-locked","s":"smoke","l":[1000,1500],"o":24,"z":22,"vz":[25,55],"dr":0.4,"s0":[54,76],"s1":150,"o0":0.75}]},"raceInfernalDecree_impact_center":{"sk":"normal","L":[{"s":"flash","l":420,"z":30,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":480,"o0":0.9},{"n":16,"d":80,"s":"ember","l":[600,1000],"z":60,"o":28,"vx":80,"vy":80,"vz":[-120,-40],"g":360,"dr":1.2,"s0":[8,14],"s1":2}]},"divineIntervention_descent":{"dsm":380,"tm":280,"ar":0,"ice":"divineIntervention_impact","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":380,"w0":44,"w1":60,"h0":700,"h1":180,"o1":0.9,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":380,"s0":140,"s1":180,"o1":0.95,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}}]},"divineIntervention_impact":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":90,"s1":220},{"s":"flash","l":320,"s0":120,"s1":30,"o0":0.9},{"n":14,"s":"heal-cross","l":[600,1000],"o":8,"vx":120,"vy":120,"vz":[40,180],"g":60,"dr":1.4,"s0":[10,16],"s1":2},{"n":8,"d":100,"s":"holy-light","l":[1000,1500],"o":14,"z":6,"vx":30,"vy":30,"vz":[60,160],"g":-30,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85}]},"raceStarDecree_descent":{"dsm":600,"tm":400,"ar":1,"ite":"raceStarDecree_impact_tile","ice":"raceStarDecree_impact_center","ts":"target-ring-green","L":[{"m":"y-locked","s":"plasma","l":600,"w0":90,"w1":140,"h0":950,"h1":280,"o1":0.92,"_d":{"fromZ":950,"toZ":null,"ease":"easeIn"}},{"s":"psi-pulse","l":600,"s0":240,"s1":280,"o1":0.95,"_d":{"fromZ":950,"toZ":null,"ease":"easeIn"}}]},"raceStarDecree_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":2000,"z":1,"s0":110,"s1":138,"o0":0.85},{"n":16,"s":"psi-pulse","l":[500,850],"z":14,"o":14,"vx":200,"vy":200,"vz":[60,220],"g":200,"dr":1.3,"s0":[10,18],"s1":2},{"m":"y-locked","s":"plasma","l":900,"w0":44,"w1":22,"h0":80,"h1":180}]},"raceStarDecree_impact_center":{"sk":"hard","L":[{"s":"psi-pulse","l":480,"z":30,"s0":280,"s1":80},{"m":"world","s":"shockwave","l":720,"z":2,"s0":80,"s1":540,"o0":0.9},{"d":30,"m":"world","s":"target-ring-green","l":1100,"z":3,"s0":140,"s1":480,"o0":0.85}]},"thunder1_descent":{"dsm":380,"tm":320,"ar":0,"ice":"thunder1_impact","ts":"target-ring-blue","L":[{"m":"y-locked","s":"lightning","l":380,"w0":30,"w1":18,"h0":800,"h1":200,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"spark-blue","l":380,"s0":160,"s1":220,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}}]},"thunder1_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":2,"s0":80,"s1":200},{"s":"flash","l":240,"s0":140,"s1":36},{"n":20,"s":"spark-blue","l":[400,800],"o":6,"vx":200,"vy":200,"vz":[60,220],"g":200,"dr":1.4,"s0":[10,18],"s1":2},{"n":3,"d":40,"s":"emp-arc","l":[250,400],"z":14,"o":10,"w0":[70,110],"w1":[40,70],"h0":6,"h1":1}]},"thunder1_chain_hop":{"L":[{"s":"spark-blue","l":320,"s0":100,"s1":30},{"n":12,"s":"spark-blue","l":[350,650],"o":6,"vx":160,"vy":160,"vz":[40,180],"g":200,"dr":1.4,"s0":[8,14],"s1":2},{"n":2,"d":30,"s":"emp-arc","l":[200,350],"z":14,"o":8,"w0":[50,80],"w1":[30,50],"h0":5,"h1":1}]},"raceDivineJudgment_descent":{"dsm":400,"tm":500,"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":400,"w0":80,"w1":120,"h0":900,"h1":240,"o1":0.92,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":400,"s0":220,"s1":260,"o1":0.95,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}}]},"raceSolarCorona_descent":{"dsm":360,"tm":420,"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":360,"w0":60,"w1":100,"h0":820,"h1":200,"o1":0.9,"_d":{"fromZ":820,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":360,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":820,"toZ":null,"ease":"easeIn"}}]},"electroDart_impact":{"L":[{"s":"flash","l":180,"s0":70,"s1":22},{"n":10,"s":"spark-elec","l":[300,550],"o":6,"vx":140,"vy":140,"vz":[40,160],"g":240,"dr":1.6,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[200,320],"z":10,"o":8,"w0":[50,80],"w1":[30,55],"h0":5,"h1":1}]},"taser_impact":{"sk":"normal","L":[{"s":"flash","l":280,"z":4,"s0":140,"s1":36},{"n":22,"s":"spark-elec","l":[400,750],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":260,"dr":1.4,"s0":[9,16],"s1":2},{"n":3,"d":40,"s":"emp-arc","l":[280,450],"z":14,"o":12,"w0":[80,120],"w1":[50,80],"h0":7,"h1":1},{"a":"floor","m":"world","s":"stun-ring","l":520,"z":3,"s0":60,"s1":200},{"d":140,"a":"floor","m":"world","s":"stun-ring","l":520,"z":3,"s0":60,"s1":180,"o0":0.9},{"d":280,"a":"floor","m":"world","s":"stun-ring","l":480,"z":3,"s0":50,"s1":160,"o0":0.8}]},"knifeThrow_impact":{"L":[{"s":"flash","l":160,"s0":55,"s1":18,"o0":0.95},{"n":10,"s":"steel-spark","l":[180,320],"z":4,"o":6,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.6,"w0":[12,22],"w1":[4,10],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[400,700],"o":5,"vx":140,"vy":140,"vz":[30,140],"g":420,"dr":1.5,"s0":[6,12],"s1":1}]},"shoot_impact":{"L":[{"s":"muzzle-flash","l":140,"s0":60,"s1":16},{"n":6,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[30,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,650],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,10],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,32],"s1":[50,70],"o0":0.55}]},"doubleShot_impact":{"L":[{"s":"muzzle-flash","l":160,"s0":70,"s1":18},{"n":7,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,140],"g":320,"dr":1.6,"w0":[12,20],"w1":[4,8],"h0":3,"h1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[24,34],"s1":[54,74],"o0":0.55}]},"headshot_impact":{"sk":"normal","L":[{"s":"muzzle-flash","l":200,"z":2,"s0":90,"s1":22},{"n":6,"s":"steel-spark","l":[220,380],"z":4,"o":6,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.5,"w0":[14,24],"w1":[5,10],"h0":3,"h1":1},{"n":14,"d":20,"s":"blood-fleck","l":[500,850],"o":7,"vx":170,"vy":170,"vz":[50,180],"g":460,"dr":1.4,"s0":[8,14],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,850],"o":14,"vz":[20,45],"dr":0.5,"s0":[26,36],"s1":[60,82],"o0":0.6}]},"precisionShot_impact":{"L":[{"s":"muzzle-flash","l":140,"s0":65,"s1":14},{"n":4,"s":"steel-spark","l":[200,340],"z":4,"o":5,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.6,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,640],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,700],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,30],"s1":[50,68],"o0":0.5}]},"deadEye_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":70,"s1":90,"o0":0.85},{"s":"muzzle-flash","l":240,"z":4,"s0":120,"s1":30},{"d":50,"s":"muzzle-flash","l":200,"z":6,"s0":80,"s1":20,"o0":0.85},{"n":9,"s":"steel-spark","l":[250,420],"z":4,"o":7,"vx":220,"vy":220,"vz":[60,200],"g":320,"dr":1.5,"w0":[14,26],"w1":[5,10],"h0":3,"h1":1},{"n":16,"d":20,"s":"blood-fleck","l":[550,950],"o":8,"vx":190,"vy":190,"vz":[60,200],"g":460,"dr":1.4,"s0":[8,15],"s1":1},{"n":5,"d":30,"s":"debris","l":[500,800],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":520,"dr":1.4,"s0":[6,11],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[700,1000],"o":16,"vz":[25,50],"dr":0.5,"s0":[32,44],"s1":[70,100],"o0":0.65}]},"kneecapShot_impact":{"L":[{"a":"floor","s":"muzzle-flash","l":160,"z":18,"s0":55,"s1":14},{"n":4,"a":"floor","s":"steel-spark","l":[180,320],"z":12,"o":6,"vx":150,"vy":150,"vz":[20,80],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":9,"d":20,"a":"floor","s":"blood-fleck","l":[450,750],"z":8,"o":7,"vx":140,"vy":140,"vz":[20,90],"g":480,"dr":1.5,"s0":[6,11],"s1":1},{"n":2,"d":25,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[60,88],"o0":0.6}]},"shieldBash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":8,"s":"steel-spark","l":[200,380],"z":4,"o":7,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.5,"w0":[14,22],"w1":[5,10],"h0":3,"h1":1},{"a":"floor","m":"world","s":"shockwave","l":480,"z":2,"s0":40,"s1":160,"o0":0.8},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[28,40],"s1":[60,90],"o0":0.65}]},"dragonSlash_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":60,"s1":80,"o0":0.7},{"s":"flash","l":240,"s0":110,"s1":28},{"n":5,"s":"flame","l":[380,600],"z":4,"o":18,"vx":120,"vy":80,"vz":[30,100],"g":80,"dr":0.8,"w0":[16,28],"w1":[8,14],"h0":[22,36],"h1":[10,18]},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":7,"vx":170,"vy":170,"vz":[50,180],"g":460,"dr":1.4,"s0":[8,14],"s1":1}]},"guardSlash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":7,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":7,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,800],"o":14,"vz":[20,45],"dr":0.5,"s0":[26,36],"s1":[56,80],"o0":0.6}]},"sneakSlash_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":6,"s":"steel-spark","l":[120,240],"z":4,"o":4,"vx":200,"vy":60,"vz":[20,80],"g":180,"dr":1.8,"w0":[14,24],"w1":[4,8],"h0":3,"h1":1},{"n":5,"s":"dark-flame","l":[350,600],"z":6,"o":14,"vx":130,"vy":100,"vz":[40,130],"g":120,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[8,13],"s1":1}]},"improvise_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":460,"z":2,"s0":36,"s1":140,"o0":0.75},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":3,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":18,"vz":[25,50],"dr":0.5,"s0":[28,40],"s1":[60,90],"o0":0.6}]},"reallyGoodPunch_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":38,"s1":150,"o0":0.8},{"n":2,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,850],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[58,84],"o0":0.65},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"cannonBlast_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":130,"o0":0.9},{"s":"explosion-orange","l":360,"z":4,"s0":110,"s1":180},{"n":4,"d":30,"s":"explosion-orange","l":[320,500],"z":6,"o":12,"vx":120,"vy":120,"vz":[40,140],"g":200,"dr":1.2,"s0":[40,64],"s1":[12,22],"o0":0.95},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":320,"o0":0.9},{"n":8,"d":30,"s":"debris","l":[500,850],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":520,"dr":1.4,"s0":[8,14],"s1":1},{"n":3,"d":120,"m":"y-locked","s":"smoke","l":[1100,1600],"o":20,"vz":[30,55],"dr":0.4,"s0":[48,64],"s1":[120,160],"o0":0.7}]},"anchorToss_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":640,"z":2,"s0":50,"s1":240,"o0":0.85},{"n":4,"d":20,"a":"floor","m":"y-locked","s":"dust-puff","l":[800,1200],"o":22,"vz":[30,60],"dr":0.45,"s0":[32,48],"s1":[70,110],"o0":0.7},{"n":6,"d":30,"s":"debris","l":[550,900],"o":8,"vx":170,"vy":170,"vz":[60,200],"g":540,"dr":1.4,"s0":[8,14],"s1":1}]},"boardingRush_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"s":"explosion-orange","l":320,"z":4,"s0":80,"s1":140},{"a":"floor","m":"world","s":"shockwave","l":540,"z":2,"s0":42,"s1":200,"o0":0.8},{"n":4,"d":30,"s":"debris","l":[450,750],"o":7,"vx":160,"vy":160,"vz":[50,160],"g":520,"dr":1.4,"s0":[7,12],"s1":1},{"n":7,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,50],"dr":0.5,"s0":[28,38],"s1":[60,86],"o0":0.6}]},"psychosis_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":240,"s0":90,"s1":24},{"a":"floor","m":"world","s":"psi-pulse","l":520,"z":2,"s0":50,"s1":200,"o0":0.85},{"d":120,"a":"floor","m":"world","s":"psi-pulse","l":580,"z":2,"s0":50,"s1":220,"o0":0.75},{"n":5,"d":30,"m":"y-locked","s":"void-mist","l":[1000,1500],"o":18,"vz":[25,50],"dr":0.4,"s0":[38,56],"s1":[80,120],"o0":0.7},{"n":6,"s":"psi-pulse","l":[350,600],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":180,"dr":1.4,"s0":[8,14],"s1":1}]},"mindShatter_impact":{"sk":"hard","L":[{"s":"psi-pulse","l":320,"z":4,"s0":140,"s1":36},{"a":"floor","m":"world","s":"psi-pulse","l":620,"z":2,"s0":70,"s1":320,"o0":0.9},{"d":130,"a":"floor","m":"world","s":"psi-pulse","l":640,"z":2,"s0":70,"s1":300,"o0":0.85},{"d":260,"a":"floor","m":"world","s":"psi-pulse","l":600,"z":2,"s0":60,"s1":280,"o0":0.75},{"n":8,"d":40,"m":"y-locked","s":"void-mist","l":[1200,1800],"o":22,"vz":[25,55],"dr":0.4,"s0":[46,70],"s1":[100,150],"o0":0.75},{"n":14,"s":"psi-pulse","l":[400,750],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":220,"dr":1.4,"s0":[10,18],"s1":1}]},"kineticHurl_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"psi-pulse","l":440,"z":2,"s0":50,"s1":180,"o0":0.8},{"n":6,"s":"debris","l":[400,700],"o":7,"vx":170,"vy":170,"vz":[50,170],"g":500,"dr":1.4,"s0":[7,12],"s1":1},{"n":3,"d":30,"m":"y-locked","s":"void-mist","l":[800,1200],"o":16,"vz":[25,45],"dr":0.4,"s0":[34,48],"s1":[70,100],"o0":0.6}]},"exorcism_impact":{"sk":"normal","L":[{"s":"flash","l":240,"s0":100,"s1":28},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.85},{"n":16,"s":"divine-sparkle","l":[450,800],"o":6,"vx":160,"vy":160,"vz":[60,200],"g":100,"dr":1.3,"s0":[9,16],"s1":2},{"n":7,"d":80,"s":"holy-light","l":[800,1200],"o":12,"z":6,"vx":40,"vy":40,"vz":[70,160],"g":-40,"dr":0.8,"s0":[8,13],"s1":1,"o0":0.9}]},"lifeDrain_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":14,"vx":130,"vy":100,"vz":[50,140],"g":80,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[8,13],"s1":1}]},"lifeDrain_drainHop":{"L":[{"n":2,"s":"dark-flame","l":[200,350],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,80],"g":40,"dr":1,"w0":[10,14],"w1":[4,7],"h0":[12,18],"h1":[5,9],"o0":0.85},{"n":3,"s":"blood-fleck","l":[180,320],"o":5,"vx":70,"vy":70,"vz":[30,80],"g":380,"dr":1.6,"s0":[4,8],"s1":1,"o0":0.9}]},"ricochet1_impact":{"L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":12,"s":"spark-blue","l":[300,550],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":4,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[40,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDemonicClaw_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":2,"s":"dark-flame","l":[320,500],"z":6,"o":10,"vx":90,"vy":80,"vz":[40,110],"g":120,"dr":0.9,"w0":[14,22],"w1":[6,10],"h0":[18,28],"h1":[8,14],"o0":0.9},{"n":7,"d":20,"s":"blood-fleck","l":[400,680],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceSmite_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"n":7,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,32],"s1":[50,70],"o0":0.55}]},"racePounce_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[56,80],"o0":0.6}]},"raceNinefoldScratch_impact":{"L":[{"s":"flash","l":140,"s0":55,"s1":16,"o0":0.9},{"n":5,"s":"steel-spark","l":[160,280],"z":4,"o":5,"vx":150,"vy":150,"vz":[30,130],"g":320,"dr":1.6,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":4,"d":20,"s":"blood-fleck","l":[340,580],"o":5,"vx":130,"vy":130,"vz":[30,120],"g":440,"dr":1.5,"s0":[6,10],"s1":1}]},"raceLastStand_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":82,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[24,34],"s1":[54,78],"o0":0.6}]},"raceHeroicLeap_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":480,"z":2,"s0":38,"s1":160,"o0":0.75},{"n":5,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,140],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[58,84],"o0":0.6}]},"raceTailWhip_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":10,"s":"spark-blue","l":[280,500],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,13],"s1":1},{"n":4,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[40,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,640],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1}]},"raceBorrowedClaw_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"n":14,"s":"spark-blue","l":[320,560],"o":7,"vx":180,"vy":180,"vz":[40,180],"g":240,"dr":1.5,"s0":[9,15],"s1":1},{"n":6,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1}]},"raceInfectiousBite_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":4,"s":"dark-flame","l":[350,550],"z":6,"o":12,"vx":110,"vy":90,"vz":[40,120],"g":100,"dr":0.9,"w0":[16,24],"w1":[7,12],"h0":[20,30],"h1":[9,15],"o0":0.92},{"n":10,"d":20,"s":"blood-fleck","l":[450,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":2,"d":80,"m":"y-locked","s":"smoke","l":[900,1300],"o":16,"vz":[25,50],"dr":0.4,"s0":[38,54],"s1":[90,130],"o0":0.55}]},"raceWeighTheHeart_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[380,600],"z":6,"o":14,"vx":120,"vy":100,"vz":[40,130],"g":100,"dr":0.9,"w0":[18,26],"w1":[8,13],"h0":[22,32],"h1":[10,16],"o0":0.92},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBoneToss_impact":{"L":[{"s":"flash","l":160,"s0":60,"s1":16,"o0":0.9},{"n":7,"s":"debris","l":[450,750],"o":7,"vx":160,"vy":160,"vz":[50,160],"g":480,"dr":1.4,"s0":[7,13],"s1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,700],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,30],"s1":[50,68],"o0":0.5}]},"raceGoreCharge_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":1,"s0":55,"s1":75,"o0":0.65},{"s":"flash","l":220,"s0":95,"s1":26},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":16,"vx":130,"vy":100,"vz":[40,130],"g":90,"dr":0.85,"w0":[18,28],"w1":[8,14],"h0":[22,32],"h1":[10,16],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[460,760],"o":7,"vx":160,"vy":160,"vz":[50,170],"g":460,"dr":1.4,"s0":[8,13],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,38],"s1":[58,86],"o0":0.6}]},"raceVoidContract_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":100,"s1":28},{"n":7,"s":"dark-flame","l":[440,700],"z":6,"o":16,"vx":140,"vy":110,"vz":[50,150],"g":90,"dr":0.9,"w0":[20,30],"w1":[9,14],"h0":[24,36],"h1":[10,18],"o0":0.95},{"n":14,"d":20,"s":"blood-fleck","l":[480,800],"o":7,"vx":160,"vy":160,"vz":[50,180],"g":440,"dr":1.4,"s0":[8,14],"s1":1}]},"raceSoulSuck_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":14,"vx":130,"vy":100,"vz":[50,140],"g":80,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":11,"d":20,"s":"blood-fleck","l":[440,740],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1}]},"raceLifetap_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":80,"s1":22},{"n":4,"s":"dark-flame","l":[380,600],"z":6,"o":12,"vx":120,"vy":100,"vz":[40,130],"g":90,"dr":0.9,"w0":[16,24],"w1":[7,12],"h0":[20,30],"h1":[9,15],"o0":0.9},{"n":9,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceMandibleStrike_impact":{"L":[{"s":"flash","l":140,"s0":55,"s1":16,"o0":0.9},{"n":7,"s":"psi-pulse","l":[240,420],"o":5,"vx":150,"vy":150,"vz":[40,140],"g":220,"dr":1.5,"s0":[7,12],"s1":1},{"n":5,"d":20,"s":"blood-fleck","l":[340,560],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDreamSiphon_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":220,"s0":85,"s1":24},{"n":10,"s":"psi-pulse","l":[350,620],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":180,"dr":1.4,"s0":[8,13],"s1":1},{"n":4,"d":30,"m":"y-locked","s":"void-mist","l":[900,1300],"o":18,"vz":[25,50],"dr":0.4,"s0":[36,52],"s1":[80,120],"o0":0.65}]},"raceVenomFang_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"n":8,"s":"psi-pulse","l":[320,560],"o":6,"vx":150,"vy":150,"vz":[40,150],"g":220,"dr":1.4,"s0":[8,13],"s1":1},{"n":11,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":3,"d":60,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,45],"dr":0.4,"s0":[32,46],"s1":[70,100],"o0":0.6}]},"racePrismBurst_impact":{"L":[{"s":"flash","l":200,"s0":75,"s1":22},{"n":12,"s":"divine-sparkle","l":[380,650],"o":6,"vx":150,"vy":150,"vz":[50,180],"g":100,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"d":60,"s":"holy-light","l":[700,1100],"o":10,"z":6,"vx":40,"vy":40,"vz":[60,140],"g":-40,"dr":0.8,"s0":[7,12],"s1":1,"o0":0.85}]},"raceDivineSmite_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":95,"s1":26},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":45,"s1":140,"o0":0.8},{"n":12,"s":"divine-sparkle","l":[380,660],"o":6,"vx":150,"vy":150,"vz":[60,180],"g":100,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,800],"o":14,"vz":[25,45],"dr":0.5,"s0":[24,32],"s1":[54,76],"o0":0.55}]},"raceCrashLoop_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":14,"s":"spark-elec","l":[350,600],"o":7,"vx":180,"vy":180,"vz":[50,180],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":3,"d":30,"s":"emp-arc","l":[240,380],"z":12,"o":10,"w0":[70,110],"w1":[40,70],"h0":6,"h1":1},{"n":3,"d":30,"s":"debris","l":[400,650],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.95}]},"dreamSiphon_drainHop":{"L":[{"n":2,"s":"psi-pulse","l":[200,350],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,80],"g":40,"dr":1,"s0":[6,10],"s1":1,"o0":0.85},{"m":"y-locked","s":"void-mist","l":[300,500],"o":6,"vz":[20,40],"dr":0.5,"s0":[14,22],"s1":[30,48],"o0":0.6}]},"plasmaGun_beam":{"cm":90,"bs":"plasma","bt":16,"bhs":"flash","bm":300,"ite":"plasmaGun_impact_tile","ice":null,"ls":false,"sk":"normal"},"plasmaGun_impact_tile":{"L":[{"s":"flash","l":220,"s0":72,"s1":18,"o0":0.95},{"n":8,"s":"spark-elec","l":[280,520],"z":6,"o":8,"vx":150,"vy":150,"vz":[50,180],"g":260,"dr":1.6,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[180,280],"z":10,"o":4,"w0":[40,70],"w1":[25,45],"h0":5,"h1":1,"o0":0.95}]},"raceHellmouth_beam":{"cm":110,"bs":"dark-flame","bt":26,"bhs":"flame","bm":360,"ite":"raceHellmouth_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceHellmouth_impact_tile":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":800,"z":2,"s0":96,"s1":116,"o0":0.75},{"a":"floor","m":"y-locked","s":"dark-flame","l":460,"w0":62,"w1":44,"h0":84,"h1":130,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame","l":380,"w0":34,"w1":18,"h0":60,"h1":100,"o0":0.85},{"n":8,"s":"ember","l":[320,600],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,160],"g":280,"dr":1.5,"s0":[7,12],"s1":1}]},"raceFormicAcid_beam":{"cm":80,"bs":"acid-green","bt":18,"bhs":"acid-green","bm":320,"ite":"raceFormicAcid_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceFormicAcid_impact_tile":{"L":[{"s":"acid-green","l":220,"s0":72,"s1":22,"o0":0.95},{"n":9,"s":"acid-green","l":[320,580],"z":4,"o":8,"vx":140,"vy":140,"vz":[30,150],"g":320,"dr":1.5,"s0":[8,14],"s1":2},{"n":2,"d":60,"m":"y-locked","s":"acid-green","l":[700,1100],"o":14,"vz":[15,35],"dr":0.5,"s0":[22,30],"s1":[55,75],"o0":0.55}]},"raceSonicBreaker_beam":{"cm":80,"bs":"spark-blue","bt":22,"bhs":"flash","bm":300,"ite":"raceSonicBreaker_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceSonicBreaker_impact_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":480,"z":2,"s0":40,"s1":140,"o0":0.85},{"s":"spark-blue","l":220,"s0":60,"s1":16},{"n":6,"s":"spark-blue","l":[280,500],"z":6,"o":6,"vx":130,"vy":130,"vz":[40,130],"g":260,"dr":1.5,"s0":[6,11],"s1":1}]},"raceHeatRay_beam":{"cm":120,"bs":"heat-ray","bt":18,"bhs":"explosion-orange","bm":360,"ite":"raceHeatRay_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceHeatRay_impact_tile":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":800,"z":2,"s0":88,"s1":110,"o0":0.85},{"s":"heat-ray","l":240,"s0":72,"s1":20},{"n":8,"s":"ember","l":[320,580],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,150],"g":280,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBalefulGaze_beam":{"cm":130,"bs":"psi-pulse","bt":22,"bhs":"psi-pulse","bm":380,"ite":"raceBalefulGaze_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceBalefulGaze_impact_tile":{"L":[{"s":"psi-pulse","l":250,"s0":78,"s1":22},{"n":2,"d":40,"m":"y-locked","s":"void-mist","l":[600,1000],"o":12,"vz":[15,40],"dr":0.4,"s0":[26,36],"s1":[60,80],"o0":0.7},{"n":5,"s":"psi-pulse","l":[300,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,130],"g":220,"dr":1.4,"s0":[6,10],"s1":1}]},"raceEntropicBeam_beam":{"cm":100,"bs":"psi-pulse","bt":20,"bhs":"psi-pulse","bm":340,"ite":"raceEntropicBeam_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceEntropicBeam_impact_tile":{"L":[{"s":"psi-pulse","l":220,"s0":64,"s1":18},{"n":6,"s":"spark-blue","l":[320,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[40,160],"g":240,"dr":1.5,"s0":[6,10],"s1":1},{"n":2,"d":40,"m":"y-locked","s":"void-mist","l":[600,950],"o":10,"vz":[15,35],"dr":0.4,"s0":[20,28],"s1":[50,70],"o0":0.6}]},"raceLaserBeam_beam":{"cm":70,"bs":"laser-pink","bt":12,"bhs":"flash","bm":280,"ite":"raceLaserBeam_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceLaserBeam_impact_tile":{"L":[{"s":"flash","l":200,"s0":64,"s1":16},{"n":8,"s":"laser-pink","l":[280,520],"z":4,"o":6,"vx":150,"vy":150,"vz":[40,160],"g":260,"dr":1.6,"s0":[6,10],"s1":1},{"n":4,"s":"ember","l":[240,420],"z":6,"o":4,"vx":120,"vy":120,"vz":[50,140],"g":320,"dr":1.5,"s0":[5,9],"s1":1}]},"broadside_aoe":{"ar":1,"sh":"square","ite":"broadside_impact_tile","ice":"broadside_impact_center"},"broadside_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":2,"s0":70,"s1":100,"o0":0.7},{"s":"explosion-orange","l":360,"s0":64,"s1":32},{"n":3,"d":60,"m":"y-locked","s":"smoke","l":[700,1100],"o":14,"vz":[25,50],"dr":0.4,"s0":[30,44],"s1":[70,100],"o0":0.65},{"n":6,"s":"debris","l":[350,650],"z":4,"o":8,"vx":130,"vy":130,"vz":[60,180],"g":360,"dr":1.4,"s0":[4,8],"s1":1}]},"broadside_impact_center":{"sk":"hard","L":[{"s":"flash","l":280,"z":16,"s0":220,"s1":60},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":80,"s1":600,"o0":0.9},{"s":"explosion-orange","l":480,"z":8,"s0":140,"s1":60},{"a":"floor","m":"world","s":"dust-puff","l":1400,"z":2,"s0":140,"s1":240,"o0":0.8}]},"raceChassisSlan_aoe":{"ar":1,"ite":"raceChassisSlan_impact_tile","ice":"raceChassisSlan_impact_center"},"raceChassisSlan_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":60,"s1":92,"o0":0.75},{"s":"flash","l":200,"s0":48,"s1":16,"o0":0.9},{"n":6,"s":"debris","l":[350,600],"z":4,"o":8,"vx":120,"vy":120,"vz":[60,170],"g":380,"dr":1.5,"s0":[4,8],"s1":1},{"n":3,"s":"spark-elec","l":[200,380],"z":6,"o":6,"vx":100,"vy":100,"vz":[40,100],"g":280,"dr":1.4,"s0":[5,8],"s1":1}]},"raceChassisSlan_impact_center":{"sk":"hard","L":[{"s":"flash","l":240,"z":14,"s0":180,"s1":40},{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":70,"s1":480,"o0":0.9},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":110,"s1":220,"o0":0.85}]},"raceEMPGrenade_aoe":{"ar":1,"ite":"raceEMPGrenade_impact_tile","ice":"raceEMPGrenade_impact_center"},"raceEMPGrenade_impact_tile":{"L":[{"n":10,"s":"spark-elec","l":[300,580],"z":10,"o":8,"vx":150,"vy":150,"vz":[50,180],"g":240,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[200,320],"z":14,"o":6,"w0":[50,90],"w1":[30,60],"h0":5,"h1":1}]},"raceEMPGrenade_impact_center":{"sk":"normal","L":[{"s":"flash","l":300,"z":18,"s0":180,"s1":50},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":60,"s1":480,"o0":0.85},{"n":8,"s":"emp-arc","l":[260,440],"z":18,"o":14,"vx":180,"vy":180,"vz":[40,100],"g":60,"dr":1,"w0":[70,120],"w1":[40,70],"h0":6,"h1":1}]},"raceMortarSalvo_aoe":{"ar":1,"ite":"raceMortarSalvo_impact_tile","ice":"raceMortarSalvo_impact_center","mi":{"sprite":"missile","w":128,"h":128,"flyMs":450,"arcHeight":250,"gravity":900,"stagger":50,"trailCount":4}},"raceMortarSalvo_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":2,"s0":80,"s1":110,"o0":0.85},{"s":"explosion-orange","l":380,"s0":80,"s1":36},{"n":8,"s":"debris","l":[400,700],"z":4,"o":10,"vx":160,"vy":160,"vz":[80,220],"g":380,"dr":1.3,"s0":[5,10],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"smoke","l":[900,1300],"o":16,"vz":[30,55],"dr":0.4,"s0":[34,50],"s1":[80,120],"o0":0.7}]},"raceMortarSalvo_impact_center":{"sk":"hard","L":[{"s":"flash","l":300,"z":18,"s0":260,"s1":70},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":90,"s1":640,"o0":0.95},{"s":"explosion-orange","l":540,"z":10,"s0":160,"s1":70},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":160,"s1":260,"o0":0.85}]},"overgrowth_aoe":{"ar":1,"ite":"overgrowth_impact_tile","ice":"overgrowth_impact_center"},"overgrowth_impact_tile":{"L":[{"a":"floor","m":"y-locked","s":"vine-green","l":720,"w0":30,"w1":18,"h0":60,"h1":130,"o0":0.95},{"n":6,"s":"vine-green","l":[380,600],"z":4,"o":8,"vx":110,"vy":110,"vz":[50,150],"g":200,"dr":1.3,"s0":[6,11],"s1":2},{"a":"floor","m":"world","s":"vine-green","l":1000,"z":2,"s0":60,"s1":100,"o0":0.5}]},"overgrowth_impact_center":{"sk":"normal","L":[{"a":"floor","m":"y-locked","s":"vine-green","l":850,"w0":70,"w1":40,"h0":100,"h1":200},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":70,"s1":480,"o0":0.7},{"n":8,"d":40,"s":"vine-green","l":[500,800],"z":8,"o":14,"vx":140,"vy":140,"vz":[50,170],"g":150,"dr":1,"s0":[6,12],"s1":2}]},"raceEarthshaker_aoe":{"ar":1,"ite":"raceEarthshaker_impact_tile","ice":"raceEarthshaker_impact_center"},"raceEarthshaker_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":70,"s1":110,"o0":0.8},{"n":7,"s":"debris","l":[400,700],"z":4,"o":10,"vx":140,"vy":140,"vz":[70,200],"g":400,"dr":1.3,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"fire-glow","l":400,"z":2,"s0":50,"s1":80,"o0":0.4}]},"raceEarthshaker_impact_center":{"sk":"hard","L":[{"s":"flash","l":240,"z":12,"s0":180,"s1":40,"o0":0.95},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":80,"s1":560,"o0":0.95},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":130,"s1":260,"o0":0.85}]},"raceGlitterburst_aoe":{"ar":1,"ite":"raceGlitterburst_impact_tile","ice":"raceGlitterburst_impact_center"},"raceGlitterburst_impact_tile":{"L":[{"n":6,"s":"divine-sparkle","l":[400,700],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,140],"g":200,"dr":1.4,"s0":[5,10],"s1":1},{"n":4,"d":30,"s":"spark-blue","l":[350,600],"z":8,"o":8,"vx":100,"vy":100,"vz":[50,130],"g":180,"dr":1.4,"s0":[4,8],"s1":1},{"n":4,"d":60,"s":"laser-pink","l":[380,620],"z":8,"o":8,"vx":100,"vy":100,"vz":[50,130],"g":180,"dr":1.4,"s0":[4,8],"s1":1}]},"raceGlitterburst_impact_center":{"sk":"soft","L":[{"s":"flash","l":260,"z":14,"s0":130,"s1":30,"o0":0.95},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":60,"s1":280,"o0":0.8},{"n":6,"s":"divine-sparkle","l":[400,700],"z":12,"o":12,"vx":160,"vy":160,"vz":[60,170],"g":160,"dr":1.2,"s0":[6,12],"s1":1}]},"raceSignalPulse_aoe":{"ar":1,"ite":"raceSignalPulse_impact_tile","ice":"raceSignalPulse_impact_center"},"raceSignalPulse_impact_tile":{"L":[{"s":"psi-pulse","l":280,"s0":70,"s1":22,"o0":0.95},{"n":5,"s":"spark-elec","l":[320,550],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,140],"g":240,"dr":1.5,"s0":[6,10],"s1":1},{"d":40,"s":"emp-arc","l":[180,280],"z":10,"o":4,"w0":[40,70],"w1":[25,45],"h0":4,"h1":1,"o0":0.95}]},"raceSignalPulse_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":350,"z":14,"s0":180,"s1":40},{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":360,"o0":0.9},{"n":6,"s":"emp-arc","l":[240,400],"z":14,"o":12,"vx":160,"vy":160,"vz":[40,100],"g":80,"dr":1,"w0":[60,110],"w1":[35,60],"h0":5,"h1":1}]},"raceTremorStomp_aoe":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"raceTremorStomp_impact_center"},"raceTremorStomp_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":58,"s1":96,"o0":0.7},{"n":5,"s":"debris","l":[320,550],"z":4,"o":8,"vx":110,"vy":110,"vz":[50,150],"g":380,"dr":1.4,"s0":[4,8],"s1":1}]},"raceTremorStomp_impact_center":{"sk":"normal","L":[{"s":"flash","l":220,"z":10,"s0":140,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":60,"s1":400,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":110,"s1":200,"o0":0.75}]},"raceBatSwarm_aoe":{"ar":1,"ite":"raceBatSwarm_impact_tile","ice":"raceBatSwarm_impact_center"},"raceBatSwarm_impact_tile":{"L":[{"n":2,"m":"y-locked","s":"void-mist","l":[600,900],"o":14,"vz":[20,60],"dr":0.4,"s0":[30,44],"s1":[60,90],"o0":0.85},{"n":10,"s":"blood-fleck","l":[400,750],"z":8,"o":10,"vx":160,"vy":160,"vz":[40,130],"g":80,"dr":1,"s0":[4,8],"s1":1,"o0":0.95},{"s":"dark-flame","l":280,"z":2,"s0":50,"s1":24,"o0":0.8},{"n":2,"d":50,"s":"bat-1","l":[500,900],"z":12,"o":12,"vx":180,"vy":140,"vz":[30,120],"g":30,"dr":0.6,"s0":[20,28],"s1":[8,12]},{"n":2,"d":100,"s":"bat-2","l":[600,950],"z":16,"o":14,"vx":200,"vy":160,"vz":[50,140],"g":20,"dr":0.5,"s0":[18,26],"s1":[6,10]},{"d":70,"s":"bat-3","l":[550,850],"z":10,"o":10,"vx":150,"vy":170,"vz":[40,110],"g":40,"dr":0.7,"s0":[22,30],"s1":[8,14]},{"d":120,"s":"bat-4","l":[650,1000],"z":14,"o":16,"vx":190,"vy":150,"vz":[60,130],"g":25,"dr":0.55,"s0":[20,28],"s1":[7,11]}]},"raceBatSwarm_impact_center":{"sk":"soft","L":[{"n":2,"m":"y-locked","s":"void-mist","l":[800,1200],"o":18,"vz":[30,70],"dr":0.3,"s0":[50,70],"s1":[110,150],"o0":0.9},{"n":14,"s":"blood-fleck","l":[500,850],"z":14,"o":16,"vx":220,"vy":220,"vz":[60,180],"g":60,"dr":0.9,"s0":[5,10],"s1":1},{"n":3,"d":30,"s":"bat-1","l":[600,1100],"z":20,"o":18,"vx":240,"vy":200,"vz":[70,200],"g":20,"dr":0.5,"s0":[24,32],"s1":[10,14]},{"n":3,"d":60,"s":"bat-3","l":[700,1200],"z":18,"o":20,"vx":260,"vy":220,"vz":[80,190],"g":15,"dr":0.45,"s0":[22,30],"s1":[8,12]},{"n":2,"d":90,"s":"bat-2","l":[650,1050],"z":22,"o":16,"vx":200,"vy":240,"vz":[60,170],"g":25,"dr":0.55,"s0":[26,34],"s1":[10,16]},{"n":2,"d":110,"s":"bat-4","l":[750,1150],"z":24,"o":22,"vx":230,"vy":210,"vz":[90,210],"g":18,"dr":0.5,"s0":[24,32],"s1":[9,13]}]},"raceDarkDominion_aoe":{"ar":1,"ite":"raceDarkDominion_impact_tile","ice":"raceDarkDominion_impact_center"},"raceDarkDominion_impact_tile":{"L":[{"a":"floor","m":"y-locked","s":"dark-flame","l":520,"w0":50,"w1":30,"h0":70,"h1":130,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame","l":420,"w0":24,"w1":14,"h0":50,"h1":90,"o0":0.85},{"a":"floor","m":"world","s":"scorch","l":1500,"z":2,"s0":80,"s1":110,"o0":0.85},{"n":7,"s":"ember","l":[320,600],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,150],"g":280,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDarkDominion_impact_center":{"sk":"hard","L":[{"s":"flash","l":300,"z":16,"s0":240,"s1":60},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":70,"s1":540,"o0":0.9},{"a":"floor","m":"y-locked","s":"dark-flame","l":700,"w0":90,"w1":50,"h0":130,"h1":230},{"n":2,"d":60,"m":"y-locked","s":"void-mist","l":[900,1300],"o":14,"vz":[20,50],"dr":0.4,"s0":[40,56],"s1":[90,130],"o0":0.75}]},"raceDarkLullaby_aoe":{"ar":1,"ite":"raceDarkLullaby_impact_tile","ice":"raceDarkLullaby_impact_center"},"raceDarkLullaby_impact_tile":{"L":[{"n":3,"m":"y-locked","s":"void-mist","l":[900,1400],"o":12,"vz":[10,30],"dr":0.6,"s0":[25,38],"s1":[60,90],"o0":0.7},{"s":"dark-flame","l":380,"z":4,"s0":50,"s1":28,"o0":0.7},{"n":3,"d":60,"s":"ember","l":[400,700],"z":6,"o":8,"vx":60,"vy":60,"vz":[10,50],"g":80,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.7}]},"raceDarkLullaby_impact_center":{"sk":"soft","L":[{"s":"flash","l":350,"z":12,"s0":160,"s1":40,"o0":0.7},{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":70,"s1":320,"o0":0.6},{"n":2,"m":"y-locked","s":"void-mist","l":[1100,1500],"o":16,"vz":[10,30],"dr":0.5,"s0":[55,75],"s1":[110,150],"o0":0.8}]},"raceDemonicRoar_aoe":{"ar":2,"ite":"raceDemonicRoar_impact_tile","ice":"raceDemonicRoar_impact_center"},"raceDemonicRoar_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":90,"o0":0.55},{"s":"dark-flame","l":320,"z":4,"s0":44,"s1":22,"o0":0.75}]},"raceDemonicRoar_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":900,"o0":0.95},{"a":"floor","m":"y-locked","s":"dark-flame","l":600,"w0":80,"w1":40,"h0":120,"h1":210,"o0":0.95},{"a":"floor","m":"y-locked","s":"flame","l":500,"w0":40,"w1":20,"h0":80,"h1":150,"o0":0.85},{"s":"flash","l":260,"z":14,"s0":180,"s1":40,"o0":0.95}]},"raceNightmarePulse_aoe":{"ar":1,"ite":"raceNightmarePulse_impact_tile","ice":"raceNightmarePulse_impact_center"},"raceNightmarePulse_impact_tile":{"L":[{"s":"psi-pulse","l":300,"s0":64,"s1":22,"o0":0.95},{"n":2,"d":30,"m":"y-locked","s":"void-mist","l":[700,1100],"o":12,"vz":[15,40],"dr":0.5,"s0":[28,40],"s1":[55,80],"o0":0.7},{"n":5,"s":"psi-pulse","l":[300,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,130],"g":220,"dr":1.4,"s0":[5,9],"s1":1}]},"raceNightmarePulse_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":380,"z":14,"s0":200,"s1":50},{"a":"floor","m":"world","s":"target-ring-green","l":700,"z":2,"s0":70,"s1":460,"o0":0.85},{"n":3,"m":"y-locked","s":"void-mist","l":[1000,1400],"o":16,"vz":[20,50],"dr":0.4,"s0":[45,60],"s1":[100,140],"o0":0.8}]},"raceWebSnare_aoe":{"ar":1,"ite":"raceWebSnare_impact_tile","ice":"raceWebSnare_impact_center"},"raceWebSnare_impact_tile":{"L":[{"s":"flash","l":200,"s0":50,"s1":14,"o0":0.8},{"n":4,"s":"steel-spark","l":[350,600],"z":4,"o":8,"vx":100,"vy":100,"vz":[30,100],"g":180,"dr":1.5,"s0":[4,8],"s1":1,"o0":0.95},{"d":30,"a":"floor","m":"world","s":"dust-puff","l":1000,"z":2,"s0":60,"s1":100,"o0":0.55},{"d":60,"s":"spider-1","l":[500,850],"z":6,"o":10,"vx":120,"vy":120,"vz":[20,80],"g":200,"dr":1.2,"s0":[18,24],"s1":[8,12]}]},"raceWebSnare_impact_center":{"sk":"soft","L":[{"s":"flash","l":280,"z":12,"s0":140,"s1":36,"o0":0.9},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":60,"s1":320,"o0":0.75},{"n":8,"s":"steel-spark","l":[400,700],"z":8,"o":12,"vx":150,"vy":150,"vz":[40,100],"g":120,"dr":1.3,"s0":[4,8],"s1":1},{"n":2,"d":40,"s":"spider-1","l":[600,1000],"z":10,"o":14,"vx":180,"vy":160,"vz":[30,100],"g":160,"dr":0.9,"s0":[24,32],"s1":[10,14]},{"d":80,"s":"spider-1","l":[700,1100],"z":14,"o":16,"vx":200,"vy":180,"vz":[50,130],"g":140,"dr":0.8,"s0":[28,36],"s1":[12,16]}]},"raceWebSnare_webOverlay":{"L":[{"a":"floor","m":"world","s":"spiderweb-1","l":2000,"z":3,"s0":136,"s1":136,"o0":0.8},{"n":2,"d":100,"a":"floor","m":"world","s":"steel-spark","l":[800,1200],"z":4,"o":12,"s0":[6,10],"s1":2,"o0":0.5}]},"raceDimensionalWeb_aura":{"ar":1,"sh":"square","ite":"raceDimensionalWeb_burst_tile","ice":"raceDimensionalWeb_burst_center","ps":"void-mist","pm":600,"ph":180,"ph1":240,"pw0":60,"pw1":110,"po0":0.65},"raceDimensionalWeb_burst_tile":{"L":[{"a":"floor","m":"world","s":"spiderweb-1","l":8000,"z":3,"s0":136,"s1":136,"o0":0.7},{"a":"floor","m":"world","s":"void-mist","l":1100,"z":2,"s0":50,"s1":100,"o0":0.5},{"n":3,"s":"steel-spark","l":[350,600],"z":4,"o":8,"vx":80,"vy":80,"vz":[20,70],"g":160,"dr":1.5,"s0":[4,7],"s1":1,"o0":0.9},{"d":50,"s":"spider-1","l":[500,800],"z":6,"o":8,"vx":100,"vy":100,"vz":[15,60],"g":200,"dr":1.3,"s0":[16,22],"s1":[7,11]}]},"raceDimensionalWeb_burst_center":{"L":[{"s":"flash","l":260,"z":12,"s0":120,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":300,"o0":0.7},{"n":2,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,50],"dr":0.4,"s0":[40,56],"s1":[90,130],"o0":0.7},{"n":6,"s":"steel-spark","l":[400,700],"z":8,"o":14,"vx":140,"vy":140,"vz":[30,90],"g":100,"dr":1.2,"s0":[4,8],"s1":1},{"n":3,"d":30,"s":"spider-1","l":[600,1050],"z":12,"o":16,"vx":200,"vy":180,"vz":[40,120],"g":150,"dr":0.85,"s0":[26,34],"s1":[10,14]},{"n":2,"d":70,"s":"spider-1","l":[700,1150],"z":16,"o":18,"vx":220,"vy":200,"vz":[60,150],"g":130,"dr":0.75,"s0":[28,38],"s1":[12,16]}]},"raceTitanStep_aoe":{"ar":1,"ite":"raceTitanStep_impact_tile","ice":"raceTitanStep_impact_center"},"raceTitanStep_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":65,"s1":105,"o0":0.75},{"s":"flash","l":220,"s0":50,"s1":16,"o0":0.9},{"n":6,"s":"debris","l":[380,650],"z":4,"o":8,"vx":130,"vy":130,"vz":[70,180],"g":380,"dr":1.4,"s0":[5,9],"s1":1}]},"raceTitanStep_impact_center":{"sk":"hard","L":[{"s":"flash","l":280,"z":14,"s0":220,"s1":56},{"a":"floor","m":"world","s":"shockwave","l":720,"z":2,"s0":80,"s1":580,"o0":0.95},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":140,"s1":260,"o0":0.85}]},"raceDustDevil_aoe":{"ar":1,"ite":"raceDustDevil_impact_tile","ice":"raceDustDevil_impact_center"},"raceDustDevil_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":90,"o0":0.65},{"n":4,"s":"debris","l":[300,500],"z":4,"o":6,"vx":60,"vy":60,"vz":[20,60],"g":80,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.85}]},"raceDustDevil_impact_center":{"sk":"normal","L":[{"a":"floor","m":"y-locked","s":"dust-puff","l":1100,"w0":100,"w1":80,"h0":160,"h1":240,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":360,"o0":0.75},{"n":8,"s":"debris","l":[500,850],"z":10,"o":16,"vx":100,"vy":100,"vz":[60,140],"g":40,"dr":0.8,"s0":[4,8],"s1":1,"o0":0.95}]},"raceGravityWell_aoe":{"ar":1,"ite":"raceGravityWell_impact_tile","ice":"raceGravityWell_impact_center"},"raceGravityWell_impact_tile":{"L":[{"s":"psi-pulse","l":260,"s0":50,"s1":16,"o0":0.85},{"d":30,"m":"y-locked","s":"void-mist","l":[600,900],"o":10,"vz":[10,30],"dr":0.6,"s0":[22,32],"s1":[50,70],"o0":0.55},{"n":3,"s":"psi-pulse","l":[280,480],"z":4,"o":6,"vx":40,"vy":40,"vz":[10,50],"g":30,"dr":1.8,"s0":[4,7],"s1":1,"o0":0.9}]},"raceGravityWell_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":500,"z":14,"s0":200,"s1":60},{"a":"floor","m":"world","s":"target-ring-green","l":900,"z":2,"s0":80,"s1":240,"o0":0.9},{"a":"floor","m":"y-locked","s":"void-mist","l":1200,"w0":110,"w1":70,"h0":140,"h1":220,"o0":0.85}]},"raceTractorBeam_column":{"L":[{"a":"floor","m":"world","s":"ring-1","l":900,"z":160,"w0":24,"w1":24,"h0":24,"h1":24,"o0":0.9},{"d":70,"a":"floor","m":"world","s":"ring-2","l":830,"z":136,"w0":32,"w1":32,"h0":32,"h1":32,"o0":0.9},{"d":140,"a":"floor","m":"world","s":"ring-3","l":760,"z":112,"w0":42,"w1":42,"h0":42,"h1":42,"o0":0.9},{"d":210,"a":"floor","m":"world","s":"ring-4","l":690,"z":84,"w0":56,"w1":56,"h0":56,"h1":56,"o0":0.9},{"d":280,"a":"floor","m":"world","s":"ring-5","l":620,"z":56,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":350,"a":"floor","m":"world","s":"ring-6","l":550,"z":28,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":420,"a":"floor","m":"world","s":"ring-7","l":480,"z":4,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":140,"a":"floor","m":"y-locked","s":"psi-pulse","l":800,"w0":40,"w1":28,"h0":90,"h1":120,"o0":0.7},{"n":2,"d":200,"a":"floor","s":"void-mist","l":[600,900],"z":20,"o":16,"vz":[15,40],"dr":0.3,"s0":[20,34],"s1":[50,70],"o0":0.6},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":50,"s1":90,"o0":0.7},{"n":3,"d":100,"a":"floor","s":"psi-pulse","l":[300,500],"z":[20,80],"o":8,"vz":[-30,30],"vx":30,"vy":30,"dr":0.8,"s0":[6,12],"s1":[2,4],"o0":0.9}]},"raceTractorBeam_step":{"L":[{"a":"floor","m":"world","s":"ring-5","l":320,"z":4,"w0":40,"w1":72,"h0":40,"h1":72,"o0":0.8},{"d":40,"a":"floor","m":"world","s":"ring-6","l":280,"z":6,"w0":36,"w1":68,"h0":36,"h1":68,"o0":0.7},{"n":2,"a":"floor","s":"psi-pulse","l":[200,350],"z":[10,60],"o":6,"vz":[20,50],"dr":0.9,"s0":[5,10],"s1":[2,4],"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":300,"z":2,"s0":30,"s1":60,"o0":0.5}]},"raceTractorBeam_arrive":{"L":[{"a":"floor","s":"flash","l":250,"z":8,"s0":50,"s1":16,"o0":0.9},{"a":"floor","m":"world","s":"ring-7","l":400,"z":3,"w0":50,"w1":90,"h0":50,"h1":90,"o0":0.9},{"d":60,"a":"floor","m":"world","s":"ring-6","l":350,"z":5,"w0":44,"w1":80,"h0":44,"h1":80,"o0":0.8},{"n":3,"d":30,"a":"floor","s":"psi-pulse","l":[250,450],"z":[6,40],"o":8,"vx":50,"vy":50,"vz":[15,40],"dr":1,"s0":[5,10],"s1":[2,4],"o0":0.9},{"d":60,"a":"floor","s":"void-mist","l":[400,700],"z":6,"o":8,"vz":[8,20],"dr":0.4,"s0":[16,24],"s1":[36,52],"o0":0.5}]},"racAbductionBeam_impact":{"sk":"soft","L":[{"a":"floor","s":"ufo","l":2000,"z":280,"w0":256,"w1":256,"h0":256,"h1":256,"_vz":-30,"g":0,"dr":1.2,"o0":0.85},{"d":120,"a":"floor","m":"world","s":"ring-1","l":1600,"z":170,"w0":28,"w1":28,"h0":28,"h1":28,"o0":0.9},{"d":190,"a":"floor","m":"world","s":"ring-2","l":1530,"z":144,"w0":36,"w1":36,"h0":36,"h1":36,"o0":0.9},{"d":260,"a":"floor","m":"world","s":"ring-3","l":1460,"z":118,"w0":48,"w1":48,"h0":48,"h1":48,"o0":0.9},{"d":330,"a":"floor","m":"world","s":"ring-4","l":1390,"z":90,"w0":62,"w1":62,"h0":62,"h1":62,"o0":0.9},{"d":400,"a":"floor","m":"world","s":"ring-5","l":1320,"z":62,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":470,"a":"floor","m":"world","s":"ring-6","l":1250,"z":32,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":540,"a":"floor","m":"world","s":"ring-7","l":1180,"z":6,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":680,"a":"floor","m":"world","s":"ring-5","l":900,"z":8,"w0":80,"w1":74,"h0":80,"h1":74,"o0":0.85},{"d":820,"a":"floor","m":"world","s":"ring-6","l":800,"z":10,"w0":78,"w1":72,"h0":78,"h1":72,"o0":0.8},{"d":960,"a":"floor","m":"world","s":"ring-7","l":700,"z":6,"w0":76,"w1":70,"h0":76,"h1":70,"o0":0.75},{"d":500,"s":"flash","l":350,"z":10,"s0":100,"s1":30},{"d":500,"a":"floor","m":"y-locked","s":"psi-pulse","l":1200,"w0":50,"w1":30,"h0":110,"h1":160,"o0":0.8},{"n":3,"d":300,"a":"floor","s":"void-mist","l":[900,1400],"z":30,"o":20,"vz":[20,60],"dr":0.3,"s0":[24,40],"s1":[60,90],"o0":0.65},{"d":100,"a":"floor","m":"world","s":"target-ring-green","l":1800,"z":2,"s0":60,"s1":110,"o0":0.75},{"n":3,"d":550,"s":"emp-arc","l":[250,450],"z":6,"o":10,"vx":80,"vy":80,"vz":[20,60],"dr":1.5,"w0":[18,30],"w1":4,"h0":[4,8],"h1":1,"o0":0.95},{"n":4,"d":550,"a":"floor","s":"psi-pulse","l":[500,800],"z":[4,20],"o":12,"vz":[80,160],"dr":0.2,"s0":[4,9],"s1":[1,3],"o0":0.9},{"n":3,"d":480,"a":"floor","s":"dust-puff","l":[350,550],"z":2,"o":10,"vx":50,"vy":50,"vz":[10,30],"g":60,"dr":0.8,"s0":[6,12],"s1":[18,30],"o0":0.5}]},"raceProbe_impact":{"L":[{"a":"floor","m":"world","s":"ring-4","l":600,"z":3,"w0":30,"w1":80,"h0":30,"h1":80,"o0":0.9},{"d":120,"a":"floor","m":"world","s":"ring-5","l":500,"z":4,"w0":40,"w1":100,"h0":40,"h1":100,"o0":0.7},{"d":240,"a":"floor","m":"world","s":"ring-6","l":450,"z":5,"w0":50,"w1":120,"h0":50,"h1":120,"o0":0.5},{"a":"floor","s":"ufo","l":600,"z":200,"w0":160,"w1":140,"h0":160,"h1":140,"o0":0.35},{"s":"psi-pulse","l":400,"z":8,"s0":50,"s1":20,"o0":0.9},{"n":3,"d":60,"s":"emp-arc","l":[200,400],"z":4,"o":6,"vx":100,"vy":100,"vz":[10,40],"dr":1.8,"w0":[14,24],"w1":3,"h0":[3,6],"h1":1,"o0":0.9},{"d":80,"s":"void-mist","l":[500,800],"z":4,"o":8,"vz":[10,30],"dr":0.5,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceImplant_impact":{"L":[{"a":"floor","m":"world","s":"ring-1","l":400,"z":3,"w0":16,"w1":40,"h0":16,"h1":40,"o0":0.9},{"d":80,"a":"floor","m":"world","s":"ring-2","l":350,"z":4,"w0":24,"w1":56,"h0":24,"h1":56,"o0":0.8},{"d":160,"a":"floor","m":"world","s":"ring-3","l":300,"z":5,"w0":32,"w1":70,"h0":32,"h1":70,"o0":0.65},{"d":100,"s":"flash","l":200,"z":4,"s0":30,"s1":10,"o0":0.85},{"n":4,"d":120,"s":"spark-elec","l":[200,400],"z":4,"o":6,"vx":60,"vy":60,"vz":[10,30],"g":40,"dr":1.2,"s0":[3,7],"s1":1,"o0":0.95},{"d":60,"s":"psi-pulse","l":300,"z":6,"s0":24,"s1":8,"o0":0.7},{"d":200,"s":"void-mist","l":[400,650],"z":6,"o":4,"vz":[12,25],"dr":0.5,"s0":[10,16],"s1":[28,42],"o0":0.45}]},"raceWarOfTheWorlds_deploy":{"L":[{"a":"floor","s":"ufo","l":2200,"z":320,"w0":256,"w1":256,"h0":256,"h1":256,"_vz":-40,"g":0,"dr":1,"o0":0.9},{"d":200,"a":"floor","m":"world","s":"ring-1","l":1400,"z":160,"w0":24,"w1":24,"h0":24,"h1":24,"o0":0.85},{"d":280,"a":"floor","m":"world","s":"ring-2","l":1320,"z":134,"w0":32,"w1":32,"h0":32,"h1":32,"o0":0.85},{"d":360,"a":"floor","m":"world","s":"ring-3","l":1240,"z":108,"w0":42,"w1":42,"h0":42,"h1":42,"o0":0.85},{"d":440,"a":"floor","m":"world","s":"ring-4","l":1160,"z":80,"w0":56,"w1":56,"h0":56,"h1":56,"o0":0.85},{"d":520,"a":"floor","m":"world","s":"ring-5","l":1080,"z":52,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":600,"a":"floor","m":"world","s":"ring-6","l":1000,"z":26,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":680,"a":"floor","m":"world","s":"ring-7","l":920,"z":4,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":820,"a":"floor","m":"world","s":"ring-5","l":700,"z":6,"w0":70,"w1":64,"h0":70,"h1":64,"o0":0.8},{"d":960,"a":"floor","m":"world","s":"ring-6","l":600,"z":8,"w0":68,"w1":62,"h0":68,"h1":62,"o0":0.75},{"d":1100,"a":"floor","m":"world","s":"ring-7","l":500,"z":4,"w0":66,"w1":60,"h0":66,"h1":60,"o0":0.7},{"n":4,"d":750,"a":"floor","s":"dust-puff","l":[400,700],"z":2,"o":12,"vx":80,"vy":80,"vz":[20,60],"g":120,"dr":1,"s0":[10,18],"s1":[24,40],"o0":0.7},{"d":700,"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":40,"s1":100,"o0":0.8},{"d":250,"a":"floor","m":"y-locked","s":"psi-pulse","l":1200,"w0":36,"w1":24,"h0":80,"h1":110,"o0":0.65},{"n":2,"d":350,"a":"floor","s":"void-mist","l":[700,1100],"z":16,"o":14,"vz":[10,35],"dr":0.4,"s0":[18,30],"s1":[45,65],"o0":0.55}]},"raceWhirlpool_aoe":{"ar":1,"ite":"raceWhirlpool_impact_tile","ice":"raceWhirlpool_impact_center"},"raceWhirlpool_impact_tile":{"L":[{"a":"floor","m":"world","s":"wave-1","l":1400,"z":3,"s0":64,"s1":64,"o0":0.85},{"n":5,"s":"spark-blue","l":[350,600],"z":6,"o":8,"vx":110,"vy":110,"vz":[40,130],"g":280,"dr":1.5,"s0":[5,9],"s1":1,"o0":0.95},{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":110,"o0":0.65}]},"raceWhirlpool_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"wave-1","l":1800,"z":4,"s0":96,"s1":96,"o0":0.9},{"s":"spark-blue","l":320,"z":12,"s0":160,"s1":40},{"a":"floor","m":"y-locked","s":"spark-blue","l":900,"w0":80,"w1":50,"h0":130,"h1":200,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-blue","l":850,"z":2,"s0":70,"s1":360,"o0":0.85},{"n":2,"d":50,"m":"y-locked","s":"void-mist","l":[800,1100],"o":14,"vz":[20,40],"dr":0.4,"s0":[40,56],"s1":[80,110],"o0":0.5}]},"heal1_aura":{"ar":0,"sh":"square","ice":"heal1_burst_center","ps":"holy-pillar","pm":520,"ph":200,"pw0":56,"pw1":90,"ph1":240,"po0":0.85},"heal1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":80,"s1":200},{"s":"heal-glow","l":600,"z":4,"s0":160,"s1":60},{"s":"flash","l":280,"z":8,"s0":110,"s1":30,"o0":0.85},{"n":10,"s":"heal-cross","l":[550,900],"o":8,"vx":100,"vy":100,"vz":[60,160],"g":30,"dr":1.2,"s0":[10,16],"s1":2},{"n":6,"d":120,"s":"holy-light","l":[900,1300],"o":14,"z":6,"vx":25,"vy":25,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85}]},"cleanse_aura":{"ar":0,"sh":"square","ice":"cleanse_burst_center","ps":"holy-pillar","pm":380,"ph":220,"pw0":44,"pw1":70,"ph1":260,"po0":1},"cleanse_burst_center":{"L":[{"s":"flash","l":240,"z":10,"s0":140,"s1":30},{"s":"heal-glow","l":420,"z":4,"s0":120,"s1":40,"o0":0.95},{"n":16,"s":"divine-sparkle","l":[400,700],"o":6,"vx":140,"vy":140,"vz":[60,200],"g":20,"dr":1.4,"s0":[8,14],"s1":1},{"n":4,"d":60,"s":"holy-light","l":[600,900],"o":10,"z":8,"vx":30,"vy":30,"vz":[80,160],"g":-40,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.9}]},"revive1_aura":{"ar":0,"sh":"square","ice":"revive1_burst_center","ps":"holy-pillar","pm":900,"ph":320,"pw0":70,"pw1":120,"ph1":380,"po0":1},"revive1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1400,"z":2,"s0":100,"s1":320},{"d":60,"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":280,"o0":0.5},{"s":"heal-glow","l":900,"z":6,"s0":220,"s1":70},{"s":"flash","l":360,"z":12,"s0":160,"s1":40},{"n":14,"s":"heal-cross","l":[700,1100],"o":10,"vx":130,"vy":130,"vz":[80,200],"g":20,"dr":1.2,"s0":[12,18],"s1":2},{"n":12,"d":140,"s":"holy-light","l":[1100,1700],"o":18,"z":4,"vx":30,"vy":30,"vz":[80,200],"g":-40,"dr":0.65,"s0":[8,14],"s1":1,"o0":0.9}]},"fortify_aura":{"ar":0,"sh":"square","ice":"fortify_burst_center","ps":"holy-pillar","pm":320,"ph":180,"pw0":50,"pw1":80,"ph1":200,"po0":0.85},"fortify_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":70,"s1":180,"o0":0.95},{"s":"shield-blue","l":700,"z":4,"s0":60,"s1":140,"o0":0.9},{"d":40,"s":"shield-blue","l":520,"z":4,"s0":30,"s1":100},{"s":"flash","l":200,"z":10,"s0":100,"s1":30,"o0":0.85},{"n":5,"d":60,"s":"holy-light","l":[600,900],"o":12,"z":6,"vx":25,"vy":25,"vz":[50,130],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"healingSeed_aura":{"ar":0,"sh":"square","ice":"healingSeed_burst_center"},"healingSeed_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":130,"o0":0.85},{"a":"floor","s":"heal-glow","l":500,"z":12,"s0":80,"s1":28,"o0":0.9},{"n":6,"a":"floor","s":"divine-sparkle","l":[400,700],"z":4,"o":8,"vx":50,"vy":50,"vz":[60,140],"g":-20,"dr":0.9,"s0":[6,10],"s1":1,"o0":0.95},{"n":4,"d":80,"a":"floor","s":"vine-green","l":[500,800],"z":6,"o":6,"vx":40,"vy":40,"vz":[40,100],"g":20,"dr":1.1,"s0":[6,12],"s1":1,"o0":0.85}]},"_buff_div_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":60,"s1":150,"o0":0.85},{"s":"heal-glow","l":480,"z":4,"s0":100,"s1":36,"o0":0.85},{"s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.85},{"n":8,"s":"divine-sparkle","l":[450,750],"o":6,"vx":100,"vy":100,"vz":[60,160],"g":30,"dr":1.2,"s0":[7,12],"s1":1},{"n":5,"d":100,"s":"holy-light","l":[800,1100],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"_buff_human_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":130,"o0":0.65},{"s":"flash","l":200,"z":8,"s0":80,"s1":22,"o0":0.85},{"n":9,"s":"steel-spark","l":[400,700],"o":8,"vx":110,"vy":110,"vz":[50,160],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"smoke","l":[700,1000],"o":12,"vz":[25,50],"dr":0.5,"s0":[20,32],"s1":[50,80],"o0":0.5},{"n":4,"d":60,"a":"floor","s":"dust-puff","l":[500,800],"z":4,"o":10,"vx":40,"vy":40,"vz":[40,100],"g":20,"dr":0.9,"s0":[8,14],"s1":2,"o0":0.6}]},"_buff_tech_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":170,"o0":0.95},{"s":"flash","l":200,"z":8,"s0":90,"s1":24,"o0":0.9},{"n":12,"s":"spark-elec","l":[400,700],"o":8,"vx":130,"vy":130,"vz":[60,200],"g":40,"dr":1.2,"s0":[5,10],"s1":1},{"n":3,"d":40,"s":"emp-arc","l":[180,320],"z":8,"o":14,"vx":60,"vy":60,"vz":[30,80],"dr":1.5,"s0":[12,20],"s1":2},{"n":4,"d":100,"s":"spark-elec","l":[700,1000],"o":14,"z":6,"vx":20,"vy":20,"vz":[70,150],"g":-30,"dr":0.7,"s0":[4,7],"s1":1,"o0":0.85}]},"camouflage_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":70,"s1":160,"o0":0.55},{"n":5,"m":"y-locked","s":"smoke","l":[900,1400],"o":14,"vz":[20,50],"dr":0.4,"s0":[30,44],"s1":[70,110],"o0":0.6},{"n":5,"d":60,"a":"floor","s":"dust-puff","l":[800,1200],"z":6,"o":16,"vx":50,"vy":50,"vz":[30,70],"g":15,"dr":0.8,"s0":[10,18],"s1":2,"o0":0.5}]},"raceSiegeMode_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":90,"s1":220,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":70,"s1":240,"o0":0.6},{"s":"flash","l":260,"z":10,"s0":110,"s1":30},{"n":10,"s":"steel-spark","l":[400,700],"o":10,"vx":130,"vy":130,"vz":[50,160],"g":100,"dr":1.3,"s0":[6,11],"s1":1},{"n":6,"d":60,"s":"spark-elec","l":[500,850],"z":6,"o":12,"vx":60,"vy":60,"vz":[50,130],"g":30,"dr":1.1,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":120,"m":"y-locked","s":"smoke","l":[800,1100],"o":16,"vz":[25,55],"dr":0.5,"s0":[26,38],"s1":[60,100],"o0":0.55}]},"protect1_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":60,"pw1":90,"po0":0.9},"overclock_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":56,"pw1":100,"po0":1},"raceWishGranted_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":800,"ph":280,"ph1":340,"pw0":70,"pw1":120,"po0":1},"racePerchForm_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":480,"ph":170,"ph1":190,"pw0":70,"pw1":100,"po0":0.85},"camouflage_aura":{"ar":0,"ice":"camouflage_burst_center","ps":"buff-aura","pm":380,"ph":160,"ph1":200,"pw0":50,"pw1":90,"po0":0.55},"steadyAim_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":360,"ph":170,"ph1":200,"pw0":44,"pw1":70,"po0":0.85},"jackOfAll_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":56,"pw1":90,"po0":0.9},"raceIronBulwark_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":700,"ph":200,"ph1":230,"pw0":70,"pw1":110,"po0":0.95},"raceBlackBudget_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":56,"pw1":90,"po0":0.9},"raceOverclock_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":56,"pw1":100,"po0":1},"raceOvercalculate_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":460,"ph":200,"ph1":240,"pw0":40,"pw1":70,"po0":0.9},"raceSiegeMode_aura":{"ar":0,"ice":"raceSiegeMode_burst_center","ps":"buff-aura","pm":520,"ph":180,"ph1":210,"pw0":80,"pw1":120,"po0":1},"raceIronGuard_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":600,"ph":190,"ph1":220,"pw0":64,"pw1":100,"po0":0.95},"_buff_alien_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":60,"s1":180,"o0":0.9},{"s":"psi-pulse","l":520,"z":4,"s0":110,"s1":40,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.85},{"n":8,"s":"psi-pulse","l":[450,750],"o":8,"vx":110,"vy":110,"vz":[60,180],"g":20,"dr":1.3,"s0":[8,14],"s1":2},{"n":4,"d":60,"m":"y-locked","s":"void-mist","l":[800,1200],"o":14,"vz":[25,60],"dr":0.5,"s0":[24,36],"s1":[60,100],"o0":0.55}]},"_buff_unholy_burst_center":{"L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":2,"s0":70,"s1":170,"o0":0.65},{"s":"dark-flame","l":500,"z":4,"s0":120,"s1":40,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":70,"s1":18,"o0":0.55},{"n":9,"s":"blood-fleck","l":[400,700],"o":8,"vx":100,"vy":100,"vz":[50,160],"g":60,"dr":1.3,"s0":[5,10],"s1":1},{"n":5,"d":80,"s":"dark-flame","l":[700,1000],"o":12,"z":4,"vx":22,"vy":22,"vz":[60,140],"g":-25,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85},{"n":3,"d":100,"m":"y-locked","s":"void-mist","l":[800,1100],"o":14,"vz":[20,50],"dr":0.5,"s0":[28,40],"s1":[60,100],"o0":0.5}]},"_buff_anomaly_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":850,"z":2,"s0":60,"s1":170,"o0":0.7},{"s":"vine-green","l":500,"z":4,"s0":110,"s1":36,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":80,"s1":22,"o0":0.85},{"n":10,"s":"blood-fleck","l":[400,700],"o":8,"vx":120,"vy":120,"vz":[60,180],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":6,"d":60,"s":"acid-green","l":[500,800],"o":10,"vx":80,"vy":80,"vz":[50,140],"g":20,"dr":1.2,"s0":[6,12],"s1":1,"o0":0.9},{"n":4,"d":100,"s":"vine-green","l":[700,1000],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-25,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"raceWildResilience_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":230,"o0":0.95},{"s":"heal-glow","l":700,"z":4,"s0":160,"s1":55},{"d":40,"s":"vine-green","l":550,"z":4,"s0":130,"s1":40,"o0":0.7},{"s":"flash","l":240,"z":10,"s0":100,"s1":24,"o0":0.9},{"n":12,"s":"vine-green","l":[600,1000],"o":10,"vx":130,"vy":130,"vz":[70,180],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":60,"s":"blood-fleck","l":[500,800],"o":10,"vx":100,"vy":100,"vz":[50,140],"g":60,"dr":1.3,"s0":[5,9],"s1":1,"o0":0.95},{"n":6,"d":120,"s":"heal-cross","l":[800,1200],"o":14,"z":6,"vx":25,"vy":25,"vz":[60,150],"g":-30,"dr":0.7,"s0":[8,14],"s1":1,"o0":0.9}]},"raceAdrenalineRush_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":950,"z":2,"s0":50,"s1":150,"o0":0.7},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":60,"s1":160,"o0":0.7},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.9},{"s":"flash","l":220,"z":10,"s0":110,"s1":28},{"n":8,"s":"steel-spark","l":[400,700],"o":8,"vx":110,"vy":110,"vz":[60,160],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":5,"d":60,"s":"heal-cross","l":[500,800],"o":8,"vx":80,"vy":80,"vz":[50,140],"g":30,"dr":1.2,"s0":[7,11],"s1":1,"o0":0.95}]},"raceChitinArmor_aura":{"ar":0,"ice":"_buff_alien_burst_center","ps":"buff-aura","pm":500,"ph":180,"ph1":210,"pw0":50,"pw1":80,"po0":0.9},"raceTimeSurge_aura":{"ar":0,"ice":"_buff_alien_burst_center","ps":"buff-aura","pm":800,"ph":240,"ph1":300,"pw0":48,"pw1":90,"po0":1},"raceAbyssalWings_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":650,"ph":220,"ph1":250,"pw0":80,"pw1":130,"po0":0.95},"raceHellfireCrown_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":750,"ph":280,"ph1":340,"pw0":56,"pw1":100,"po0":1},"racePhaseShift_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":420,"ph":170,"ph1":210,"pw0":56,"pw1":110,"po0":0.6},"raceBloodRitual_aura":{"ar":0,"ice":"_buff_anomaly_burst_center","ps":"buff-aura","pm":680,"ph":210,"ph1":240,"pw0":72,"pw1":120,"po0":0.95},"raceWildResilience_aura":{"ar":0,"ice":"raceWildResilience_burst_center","ps":"buff-aura","pm":850,"ph":260,"ph1":320,"pw0":70,"pw1":120,"po0":1},"raceAdrenalineRush_aura":{"ar":0,"ice":"raceAdrenalineRush_burst_center","ps":"buff-aura","pm":480,"ph":190,"ph1":220,"pw0":56,"pw1":90,"po0":0.95},"healAll_aura":{"ar":0,"ice":"healAll_burst_center"},"healAll_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":140,"o0":0.85},{"s":"heal-glow","l":500,"z":4,"s0":110,"s1":38,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":80,"s1":22,"o0":0.8},{"n":6,"s":"heal-cross","l":[500,800],"o":8,"vx":90,"vy":90,"vz":[50,140],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":4,"d":100,"s":"holy-light","l":[700,1000],"o":10,"z":6,"vx":20,"vy":20,"vz":[50,120],"g":-25,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.8}]},"raceAbsolution_aura":{"ar":0,"ice":"raceAbsolution_burst_center"},"raceAbsolution_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":160,"o0":0.9},{"s":"heal-glow","l":540,"z":4,"s0":120,"s1":40},{"s":"flash","l":240,"z":8,"s0":100,"s1":26,"o0":0.95},{"n":10,"s":"divine-sparkle","l":[500,850],"o":8,"vx":110,"vy":110,"vz":[60,170],"g":25,"dr":1.3,"s0":[7,12],"s1":1},{"n":5,"s":"heal-cross","l":[500,800],"o":8,"vx":80,"vy":80,"vz":[50,130],"g":25,"dr":1.2,"s0":[7,12],"s1":1},{"n":5,"d":100,"s":"holy-light","l":[800,1100],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"raceTidalBlessing_aura":{"ar":1,"sh":"square","ite":"raceTidalBlessing_burst_tile","ice":"raceTidalBlessing_burst_center","ps":"buff-aura","pm":600,"ph":220,"ph1":260,"pw0":70,"pw1":110,"po0":0.85},"raceTidalBlessing_burst_tile":{"L":[{"a":"floor","m":"world","s":"void-mist","l":1200,"z":2,"s0":50,"s1":110,"o0":0.5},{"a":"floor","s":"heal-glow","l":500,"z":10,"s0":60,"s1":24,"o0":0.65},{"a":"floor","m":"world","s":"wave-1","l":1800,"z":3,"s0":64,"s1":64,"o0":0.85},{"n":2,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[600,900],"o":10,"vz":[20,50],"dr":0.5,"s0":[16,24],"s1":[36,60],"o0":0.45}]},"raceTidalBlessing_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":240,"o0":0.8},{"a":"floor","s":"heal-glow","l":700,"z":14,"s0":130,"s1":46,"o0":0.95},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28,"o0":0.85},{"a":"floor","m":"world","s":"wave-1","l":2000,"z":3,"s0":96,"s1":96,"o0":0.9},{"n":3,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[900,1300],"o":12,"vz":[30,70],"dr":0.4,"s0":[32,50],"s1":[70,120],"o0":0.55}]},"raceSanctuary_aura":{"ar":1,"sh":"square","ite":"raceSanctuary_burst_tile","ice":"raceSanctuary_burst_center","ps":"buff-aura","pm":750,"ph":280,"ph1":340,"pw0":70,"pw1":120,"po0":1},"raceSanctuary_burst_tile":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":40,"s1":110,"o0":0.75},{"a":"floor","s":"heal-glow","l":600,"z":10,"s0":70,"s1":26,"o0":0.85},{"n":4,"a":"floor","s":"divine-sparkle","l":[500,800],"z":6,"o":8,"vx":50,"vy":50,"vz":[40,110],"g":0,"dr":1.1,"s0":[6,10],"s1":1,"o0":0.95},{"n":2,"d":80,"a":"floor","s":"holy-light","l":[700,1000],"o":10,"z":4,"vx":15,"vy":15,"vz":[40,110],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"raceSanctuary_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":90,"s1":260,"o0":0.95},{"a":"floor","s":"heal-glow","l":800,"z":14,"s0":140,"s1":50},{"a":"floor","s":"flash","l":280,"z":14,"s0":130,"s1":32},{"n":12,"a":"floor","s":"divine-sparkle","l":[600,1000],"z":6,"o":10,"vx":110,"vy":110,"vz":[70,180],"g":20,"dr":1.2,"s0":[8,14],"s1":1},{"n":8,"d":100,"a":"floor","s":"holy-light","l":[1000,1400],"o":14,"z":4,"vx":22,"vy":22,"vz":[70,160],"g":-35,"dr":0.65,"s0":[7,12],"s1":1,"o0":0.9}]},"_aoeShield_alien_burst_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":900,"z":2,"s0":50,"s1":130,"o0":0.75},{"s":"psi-pulse","l":500,"z":4,"s0":70,"s1":26,"o0":0.75},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.7}]},"_aoeShield_div_burst_tile":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":140,"o0":0.8},{"s":"heal-glow","l":500,"z":4,"s0":70,"s1":26,"o0":0.7},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.75},{"n":2,"d":80,"s":"holy-light","l":[600,900],"o":8,"z":4,"vx":18,"vy":18,"vz":[40,100],"g":-25,"dr":0.7,"s0":[4,8],"s1":1,"o0":0.8}]},"_aoeShield_tech_burst_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":2,"s0":50,"s1":140,"o0":0.85},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.75},{"n":3,"s":"spark-elec","l":[350,600],"z":4,"o":8,"vx":80,"vy":80,"vz":[40,100],"g":30,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95},{"d":40,"s":"emp-arc","l":220,"z":8,"o":10,"s0":16,"s1":2,"o0":0.85}]},"bubble_aura":{"ar":1,"sh":"square","ite":"_aoeShield_alien_burst_tile","ice":"bubble_burst_center","ps":"buff-aura","pm":700,"ph":280,"ph1":340,"pw0":50,"pw1":90,"po0":0.95},"bubble_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":1200,"z":2,"s0":90,"s1":280,"o0":0.9},{"s":"shield-blue","l":1000,"z":8,"s0":140,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":90,"s1":220},{"s":"psi-pulse","l":600,"z":12,"s0":120,"s1":40,"o0":0.75},{"s":"flash","l":260,"z":14,"s0":120,"s1":30,"o0":0.95},{"n":10,"s":"psi-pulse","l":[500,900],"o":10,"vx":120,"vy":120,"vz":[70,180],"g":20,"dr":1.2,"s0":[7,13],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,60],"dr":0.5,"s0":[30,44],"s1":[70,110],"o0":0.5}]},"raceRunicWard_aura":{"ar":0,"ice":"raceRunicWard_burst_center","ps":"buff-aura","pm":520,"ph":200,"ph1":240,"pw0":44,"pw1":80,"po0":0.95},"raceRunicWard_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":1000,"z":2,"s0":70,"s1":180,"o0":0.95},{"s":"shield-blue","l":800,"z":6,"s0":80,"s1":160,"o0":0.85},{"d":30,"s":"shield-blue","l":600,"z":8,"s0":50,"s1":120},{"s":"psi-pulse","l":500,"z":10,"s0":90,"s1":32,"o0":0.85},{"s":"flash","l":220,"z":12,"s0":100,"s1":26,"o0":0.95},{"n":4,"d":40,"s":"emp-arc","l":[200,350],"z":8,"o":16,"vx":30,"vy":30,"vz":[30,70],"dr":1.5,"s0":[14,22],"s1":2},{"n":6,"s":"psi-pulse","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[50,130],"g":20,"dr":1.3,"s0":[5,9],"s1":1,"o0":0.95}]},"raceHolyBulwark_aura":{"ar":1,"sh":"square","ite":"_aoeShield_div_burst_tile","ice":"raceHolyBulwark_burst_center","ps":"buff-aura","pm":720,"ph":280,"ph1":340,"pw0":60,"pw1":100,"po0":1},"raceHolyBulwark_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":90,"s1":280,"o0":0.95},{"s":"shield-blue","l":1000,"z":8,"s0":150,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":100,"s1":220},{"s":"heal-glow","l":700,"z":12,"s0":140,"s1":50,"o0":0.85},{"s":"flash","l":280,"z":14,"s0":130,"s1":32},{"n":10,"s":"divine-sparkle","l":[550,950],"o":10,"vx":120,"vy":120,"vz":[70,180],"g":25,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":100,"s":"holy-light","l":[900,1300],"o":14,"z":6,"vx":22,"vy":22,"vz":[70,160],"g":-35,"dr":0.65,"s0":[6,11],"s1":1,"o0":0.9}]},"raceLuminousShield_aura":{"ar":0,"ice":"raceLuminousShield_burst_center","ps":"buff-aura","pm":600,"ph":260,"ph1":320,"pw0":48,"pw1":88,"po0":1},"raceLuminousShield_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":200,"o0":0.95},{"s":"shield-blue","l":900,"z":6,"s0":90,"s1":180,"o0":0.9},{"d":30,"s":"shield-blue","l":700,"z":8,"s0":55,"s1":130},{"s":"heal-glow","l":600,"z":10,"s0":110,"s1":40,"o0":0.9},{"s":"flash","l":320,"z":12,"s0":120,"s1":32},{"d":120,"s":"flash","l":240,"z":14,"s0":80,"s1":22,"o0":0.9},{"n":14,"s":"divine-sparkle","l":[500,900],"o":10,"vx":130,"vy":130,"vz":[80,200],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":5,"d":80,"s":"holy-light","l":[800,1200],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,150],"g":-30,"dr":0.7,"s0":[5,10],"s1":1,"o0":0.9}]},"raceFirewallProtocol_aura":{"ar":1,"sh":"square","ite":"_aoeShield_tech_burst_tile","ice":"raceFirewallProtocol_burst_center","ps":"buff-aura","pm":680,"ph":260,"ph1":320,"pw0":56,"pw1":100,"po0":1},"raceFirewallProtocol_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":1100,"z":2,"s0":90,"s1":280,"o0":0.95},{"s":"shield-blue","l":1000,"z":8,"s0":140,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":90,"s1":220},{"s":"flash","l":260,"z":14,"s0":120,"s1":30},{"n":12,"s":"spark-elec","l":[500,850],"o":10,"vx":130,"vy":130,"vz":[70,180],"g":30,"dr":1.2,"s0":[6,11],"s1":1},{"n":5,"d":50,"s":"emp-arc","l":[200,380],"z":10,"o":20,"vx":60,"vy":60,"vz":[40,100],"dr":1.5,"s0":[14,22],"s1":2},{"n":5,"d":100,"s":"spark-elec","l":[800,1100],"o":14,"z":6,"vx":22,"vy":22,"vz":[60,150],"g":-30,"dr":0.7,"s0":[4,8],"s1":1,"o0":0.9}]},"_warCry_burst_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":35,"s1":90,"o0":0.55},{"s":"flash","l":180,"z":6,"s0":55,"s1":14,"o0":0.7},{"n":2,"s":"steel-spark","l":[300,500],"o":8,"vx":60,"vy":60,"vz":[40,100],"g":60,"dr":1.3,"s0":[4,7],"s1":1,"o0":0.95}]},"_warCry_burst_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":360,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":80,"s1":220,"o0":0.7},{"s":"flash","l":280,"z":12,"s0":140,"s1":36},{"n":12,"s":"steel-spark","l":[450,750],"o":10,"vx":130,"vy":130,"vz":[60,180],"g":90,"dr":1.3,"s0":[5,10],"s1":1},{"n":3,"d":60,"m":"y-locked","s":"dust-puff","l":[800,1200],"o":14,"vz":[25,55],"dr":0.5,"s0":[26,38],"s1":[60,100],"o0":0.55},{"n":5,"d":100,"s":"holy-light","l":[700,1000],"o":14,"z":6,"vx":20,"vy":20,"vz":[60,140],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"warCry_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":60,"pw1":100,"po0":0.95},"raceRallyCommand_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":700,"ph":240,"ph1":280,"pw0":76,"pw1":130,"po0":1},"raceVOXBroadcast_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":750,"ph":300,"ph1":360,"pw0":44,"pw1":80,"po0":1},"placeBomb_aoe":{"ar":1,"sh":"square","ite":"placeBomb_impact_tile","ice":"placeBomb_impact_center"},"placeBomb_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1500,"z":2,"s0":80,"s1":130,"o0":0.85},{"s":"explosion-orange","l":380,"s0":72,"s1":36},{"d":90,"s":"flash","l":180,"z":6,"s0":80,"s1":24,"o0":0.75},{"n":4,"d":80,"m":"y-locked","s":"smoke","l":[1100,1700],"o":16,"vz":[30,60],"dr":0.35,"s0":[32,50],"s1":[90,140],"o0":0.75},{"n":8,"s":"debris","l":[400,750],"z":4,"o":10,"vx":150,"vy":150,"vz":[70,210],"g":400,"dr":1.4,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":70,"s1":140,"o0":0.7}]},"placeBomb_impact_center":{"sk":"hard","L":[{"s":"flash","l":320,"z":18,"s0":260,"s1":70},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":90,"s1":680,"o0":0.95},{"s":"explosion-orange","l":560,"z":10,"s0":170,"s1":70},{"d":130,"s":"flash","l":220,"z":14,"s0":140,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1600,"z":2,"s0":160,"s1":280,"o0":0.85},{"n":10,"s":"ember","l":[350,700],"z":8,"o":10,"vx":200,"vy":200,"vz":[80,220],"g":320,"dr":1.3,"s0":[5,9],"s1":1}]},"raceColdSpot_aura":{"ar":1,"sh":"square","ite":"raceColdSpot_burst_tile","ice":"raceColdSpot_burst_center","ps":"shield-blue","pm":580,"ph":210,"ph1":260,"pw0":64,"pw1":100,"po0":0.75},"raceColdSpot_burst_tile":{"L":[{"a":"floor","m":"world","s":"shield-blue","l":1200,"z":2,"s0":50,"s1":110,"o0":0.55},{"a":"floor","m":"world","s":"void-mist","l":1000,"z":2,"s0":40,"s1":90,"o0":0.45},{"n":3,"a":"floor","s":"divine-sparkle","l":[500,850],"z":6,"o":9,"vx":40,"vy":40,"vz":[30,80],"g":-20,"dr":1.1,"s0":[5,9],"s1":1,"o0":0.85}]},"raceColdSpot_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":220,"o0":0.6},{"a":"floor","s":"shield-blue","l":750,"z":14,"s0":130,"s1":50,"o0":0.85},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28,"o0":0.7},{"n":10,"a":"floor","s":"divine-sparkle","l":[550,950],"z":6,"o":12,"vx":110,"vy":110,"vz":[70,160],"g":-10,"dr":1.2,"s0":[7,13],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[900,1300],"o":14,"vz":[40,80],"dr":0.45,"s0":[30,50],"s1":[70,120],"o0":0.5}]},"raceHostileTakeover_aura":{"ar":2,"sh":"square","ite":"raceHostileTakeover_burst_tile","ice":"raceHostileTakeover_burst_center","ps":"dark-flame","pm":720,"ph":260,"ph1":320,"pw0":80,"pw1":130,"po0":0.95},"raceHostileTakeover_burst_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":2,"s0":60,"s1":110,"o0":0.7},{"a":"floor","s":"dark-flame","l":480,"z":8,"s0":56,"s1":24,"o0":0.9},{"a":"floor","m":"world","s":"void-mist","l":1300,"z":2,"s0":50,"s1":110,"o0":0.55},{"n":3,"a":"floor","s":"blood-fleck","l":[400,700],"z":4,"o":8,"vx":70,"vy":70,"vz":[30,90],"g":220,"dr":1.3,"s0":[4,8],"s1":1}]},"raceHostileTakeover_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1300,"z":2,"s0":100,"s1":360,"o0":0.75},{"s":"dark-flame","l":720,"z":12,"s0":170,"s1":70},{"s":"flash","l":280,"z":16,"s0":150,"s1":36,"o0":0.7},{"n":14,"s":"blood-fleck","l":[500,900],"z":6,"o":12,"vx":160,"vy":160,"vz":[60,200],"g":320,"dr":1.3,"s0":[5,10],"s1":1},{"n":4,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[1000,1500],"o":14,"vz":[40,80],"dr":0.4,"s0":[40,60],"s1":[90,150],"o0":0.7},{"n":6,"d":100,"s":"ember","l":[800,1200],"o":14,"z":6,"vx":30,"vy":30,"vz":[60,140],"g":-30,"dr":0.8,"s0":[6,11],"s1":1,"o0":0.85}]},"raceDeadAir_aura":{"ar":1,"sh":"square","ite":"raceDeadAir_burst_tile","ice":"raceDeadAir_burst_center","ps":"spark-elec","pm":460,"ph":200,"ph1":220,"pw0":36,"pw1":60,"po0":0.85},"raceDeadAir_burst_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":5,"s":"spark-elec","l":[180,350],"z":4,"o":12,"vx":60,"vy":60,"vz":[20,70],"g":80,"dr":1.6,"s0":[3,6],"s1":1},{"d":60,"s":"flash","l":140,"z":6,"s0":50,"s1":14,"o0":0.55}]},"raceDeadAir_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":70,"s1":220,"o0":0.55},{"s":"flash","l":220,"z":14,"s0":130,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":120,"s1":220,"o0":0.75},{"n":12,"s":"spark-elec","l":[200,420],"z":6,"o":14,"vx":130,"vy":130,"vz":[40,130],"g":120,"dr":1.5,"s0":[4,8],"s1":1},{"n":6,"d":180,"s":"spark-elec","l":[150,320],"z":6,"o":10,"vx":80,"vy":80,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.9}]},"_eorHpRegen_aura":{"ar":0,"sh":"square","ice":"_eorHpRegen_burst_center"},"_eorHpRegen_burst_center":{"L":[{"s":"heal-glow","l":450,"z":4,"s0":110,"s1":36,"o0":0.85},{"s":"flash","l":200,"z":8,"s0":70,"s1":18,"o0":0.6},{"n":4,"d":40,"s":"heal-cross","l":[450,750],"o":6,"vx":60,"vy":60,"vz":[40,110],"g":20,"dr":1.2,"s0":[8,13],"s1":1}]},"_eorMpRegen_aura":{"ar":0,"sh":"square","ice":"_eorMpRegen_burst_center"},"_eorMpRegen_burst_center":{"L":[{"s":"shield-blue","l":450,"z":4,"s0":100,"s1":32,"o0":0.8},{"s":"flash","l":200,"z":8,"s0":65,"s1":16,"o0":0.55},{"n":4,"d":40,"s":"spark-blue","l":[450,750],"o":6,"vx":55,"vy":55,"vz":[40,110],"g":10,"dr":1.2,"s0":[7,11],"s1":1}]},"wildGrowth_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":1,"s0":60,"s1":140,"o0":0.7},{"a":"floor","s":"heal-glow","l":700,"z":4,"s0":70,"s1":30,"o0":0.7},{"n":8,"a":"floor","s":"vine-green","l":[350,650],"z":6,"o":14,"vx":50,"vy":50,"vz":[80,180],"g":220,"dr":1.2,"s0":[6,11],"s1":[10,16]},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":5,"d":250,"a":"floor","s":"vine-green","l":[350,600],"z":4,"o":16,"vx":40,"vy":40,"vz":[50,130],"g":180,"dr":1.3,"s0":[5,9],"s1":[9,14],"o0":0.95},{"n":4,"d":100,"a":"floor","s":"divine-sparkle","l":[400,700],"z":8,"o":10,"vx":60,"vy":60,"vz":[40,110],"g":-20,"dr":1.1,"s0":[4,8],"s1":1,"o0":0.9}]},"buildBridge_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":70,"s1":160,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.8},{"n":10,"a":"floor","s":"debris","l":[450,800],"z":6,"o":12,"vx":130,"vy":130,"vz":[80,200],"g":360,"dr":1.4,"s0":[6,11],"s1":1},{"n":5,"d":60,"a":"floor","s":"spark-elec","l":[180,320],"z":10,"o":10,"vx":90,"vy":90,"vz":[40,130],"g":200,"dr":1.5,"s0":[3,6],"s1":1},{"n":2,"d":80,"a":"floor","m":"y-locked","s":"smoke","l":[600,1000],"o":12,"vz":[20,40],"dr":0.45,"s0":[22,36],"s1":[50,80],"o0":0.5}]},"raceBrimstone_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1800,"z":1,"s0":90,"s1":130,"o0":0.95},{"a":"floor","m":"world","s":"fire-glow","l":1400,"z":2,"s0":100,"s1":140,"o0":0.85},{"a":"floor","m":"y-locked","s":"flame-hot","l":600,"w0":50,"w1":18,"h0":90,"h1":160},{"n":3,"d":40,"a":"floor","m":"y-locked","s":"dark-flame","l":[500,900],"o":22,"w0":[24,36],"w1":[10,18],"h0":[60,90],"h1":[100,160],"o0":0.95},{"n":12,"a":"floor","s":"ember","l":[400,750],"z":8,"o":14,"vx":140,"vy":140,"vz":[70,200],"g":340,"dr":1.3,"s0":[6,11],"s1":1},{"n":2,"d":350,"a":"floor","m":"y-locked","s":"dark-flame","l":[400,700],"o":18,"w0":[18,28],"w1":[8,14],"h0":[40,70],"h1":[70,120],"o0":0.85},{"n":3,"d":100,"a":"floor","m":"y-locked","s":"smoke","l":[900,1300],"o":14,"vz":[30,60],"dr":0.4,"s0":[30,46],"s1":[80,130],"o0":0.7}]},"raceCallOfTheDeep_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1300,"z":1,"s0":60,"s1":180,"o0":0.8},{"a":"floor","m":"world","s":"void-mist","l":1600,"z":2,"s0":70,"s1":130,"o0":0.65},{"a":"floor","m":"world","s":"shield-blue","l":1100,"z":2,"s0":70,"s1":120,"o0":0.55},{"n":8,"a":"floor","s":"spark-blue","l":[500,850],"z":6,"o":14,"vx":50,"vy":50,"vz":[50,130],"g":80,"dr":1.4,"s0":[5,9],"s1":1},{"n":3,"d":80,"a":"floor","m":"y-locked","s":"void-mist","l":[800,1200],"o":14,"vz":[25,55],"dr":0.4,"s0":[28,42],"s1":[60,100],"o0":0.55},{"d":380,"a":"floor","m":"world","s":"halo-ring","l":900,"z":1,"s0":70,"s1":150,"o0":0.55}]},"teleport_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":200},"teleport_disperse":{"L":[{"s":"flash","l":220,"z":8,"s0":110,"s1":28,"o0":0.9},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,750],"o":12,"vz":[40,80],"dr":0.5,"s0":[24,36],"s1":[50,80],"o0":0.65},{"n":8,"s":"divine-sparkle","l":[350,600],"z":4,"o":10,"vx":120,"vy":120,"vz":[50,140],"g":60,"dr":1.4,"s0":[6,11],"s1":1},{"n":5,"d":60,"s":"spark-blue","l":[400,700],"z":6,"o":8,"vx":60,"vy":60,"vz":[40,110],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"teleport_arrive":{"L":[{"s":"flash","l":240,"z":10,"s0":140,"s1":30},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":12,"vz":[40,80],"dr":0.5,"s0":[24,36],"s1":[50,80],"o0":0.7},{"n":10,"s":"divine-sparkle","l":[400,700],"z":4,"o":12,"vx":130,"vy":130,"vz":[60,150],"g":50,"dr":1.3,"s0":[6,12],"s1":1},{"n":6,"d":60,"s":"spark-blue","l":[450,750],"z":6,"o":8,"vx":70,"vy":70,"vz":[50,120],"g":-10,"dr":1.2,"s0":[5,10],"s1":1}]},"voidRush_teleport":{"de":"voidRush_disperse","ae":"voidRush_arrive","adm":220},"voidRush_disperse":{"L":[{"s":"flash","l":220,"z":8,"s0":120,"s1":28,"o0":0.85},{"n":3,"a":"floor","m":"y-locked","s":"void-mist","l":[600,950],"o":12,"vz":[40,90],"dr":0.4,"s0":[32,48],"s1":[70,110],"o0":0.8},{"a":"floor","m":"y-locked","s":"dark-flame","l":480,"w0":48,"w1":20,"h0":70,"h1":140,"o0":0.85},{"n":8,"s":"spark-blue","l":[400,700],"z":4,"o":12,"vx":110,"vy":110,"vz":[50,140],"g":40,"dr":1.3,"s0":[6,10],"s1":1}]},"voidRush_arrive":{"L":[{"s":"flash","l":280,"z":12,"s0":180,"s1":36},{"a":"floor","m":"world","s":"shockwave","l":620,"z":2,"s0":80,"s1":420,"o0":0.85},{"n":3,"a":"floor","m":"y-locked","s":"void-mist","l":[650,1000],"o":14,"vz":[40,90],"dr":0.4,"s0":[32,48],"s1":[80,120],"o0":0.85},{"s":"dark-flame","l":500,"z":8,"s0":110,"s1":50,"o0":0.95},{"n":12,"s":"spark-blue","l":[450,750],"z":4,"o":14,"vx":150,"vy":150,"vz":[60,180],"g":60,"dr":1.3,"s0":[7,12],"s1":1}]},"raceShadowStep_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":180},"raceShadowStep_disperse":{"L":[{"s":"dark-flame","l":380,"z":6,"s0":100,"s1":36},{"n":2,"a":"floor","m":"world","s":"void-mist","l":900,"z":2,"s0":50,"s1":100,"o0":0.7},{"n":4,"s":"blood-fleck","l":[300,550],"z":4,"o":9,"vx":80,"vy":80,"vz":[30,100],"g":240,"dr":1.4,"s0":[4,8],"s1":1}]},"raceShadowStep_arrive":{"L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":22,"o0":0.7},{"s":"dark-flame","l":420,"z":6,"s0":110,"s1":40},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":10,"vz":[40,80],"dr":0.45,"s0":[22,34],"s1":[50,80],"o0":0.7},{"n":6,"s":"blood-fleck","l":[350,600],"z":4,"o":10,"vx":100,"vy":100,"vz":[40,120],"g":260,"dr":1.4,"s0":[4,9],"s1":1}]},"racePhaseWalk_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":200},"racePhaseWalk_disperse":{"L":[{"s":"flash","l":200,"z":8,"s0":110,"s1":26},{"s":"emp-arc","l":320,"z":6,"s0":90,"s1":32,"o0":0.95},{"n":10,"s":"spark-elec","l":[180,380],"z":4,"o":10,"vx":130,"vy":130,"vz":[40,130],"g":80,"dr":1.6,"s0":[4,8],"s1":1}]},"racePhaseWalk_arrive":{"L":[{"s":"flash","l":220,"z":10,"s0":130,"s1":30},{"s":"emp-arc","l":360,"z":6,"s0":110,"s1":40},{"n":12,"s":"spark-elec","l":[200,420],"z":4,"o":12,"vx":150,"vy":150,"vz":[50,150],"g":80,"dr":1.5,"s0":[4,9],"s1":1},{"n":5,"d":150,"s":"spark-elec","l":[120,280],"z":4,"o":8,"vx":70,"vy":70,"vz":[30,100],"g":80,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.9}]},"raceShedSkin_teleport":{"de":"raceShedSkin_disperse","ae":"raceShedSkin_arrive","adm":220},"raceShedSkin_disperse":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":60,"s1":130,"o0":0.75},{"a":"floor","m":"world","s":"void-mist","l":900,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":6,"s":"vine-green","l":[400,700],"z":4,"o":10,"vx":80,"vy":80,"vz":[30,100],"g":200,"dr":1.3,"s0":[5,10],"s1":1}]},"raceShedSkin_arrive":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":110,"o0":0.65},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":10,"vz":[30,70],"dr":0.5,"s0":[22,32],"s1":[50,75],"o0":0.6},{"n":4,"d":30,"s":"divine-sparkle","l":[400,650],"z":6,"o":8,"vx":50,"vy":50,"vz":[40,110],"g":-10,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.9}]},"raceNimbleDodge_teleport":{"de":"raceNimbleDodge_disperse","ae":"raceNimbleDodge_arrive","adm":220},"raceNimbleDodge_disperse":{"L":[{"s":"flash","l":180,"z":8,"s0":100,"s1":24},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":55,"s1":110,"o0":0.7},{"n":5,"s":"spark-elec","l":[160,300],"z":4,"o":8,"vx":100,"vy":100,"vz":[30,100],"g":100,"dr":1.5,"s0":[3,6],"s1":1}]},"raceNimbleDodge_arrive":{"L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":18,"o0":0.75},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":45,"s1":90,"o0":0.55},{"n":4,"s":"spark-elec","l":[120,240],"z":4,"o":7,"vx":70,"vy":70,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,5],"s1":1,"o0":0.9}]},"deployTurret_aura":{"ar":0,"sh":"square","ice":"deployTurret_burst_center"},"deployTurret_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":130,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":40,"s1":100,"o0":0.7},{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.85},{"n":5,"d":40,"a":"floor","s":"spark-elec","l":[180,340],"z":6,"o":8,"vx":90,"vy":90,"vz":[40,110],"g":160,"dr":1.5,"s0":[3,6],"s1":1},{"n":4,"a":"floor","s":"debris","l":[300,500],"z":4,"o":6,"vx":70,"vy":70,"vz":[50,130],"g":280,"dr":1.4,"s0":[3,6],"s1":1}]},"siegeTurret_aura":{"ar":0,"sh":"square","ice":"siegeTurret_burst_center"},"siegeTurret_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":180,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":70,"s1":160,"o0":0.85},{"a":"floor","s":"flash","l":240,"z":12,"s0":120,"s1":30},{"d":200,"a":"floor","s":"flash","l":180,"z":8,"s0":80,"s1":20,"o0":0.75},{"n":8,"d":40,"a":"floor","s":"spark-elec","l":[200,400],"z":6,"o":10,"vx":110,"vy":110,"vz":[50,140],"g":180,"dr":1.5,"s0":[4,7],"s1":1},{"n":7,"a":"floor","s":"debris","l":[350,600],"z":4,"o":8,"vx":90,"vy":90,"vz":[60,160],"g":320,"dr":1.4,"s0":[4,8],"s1":1}]},"fiveGTower_aura":{"ar":0,"sh":"square","ice":"fiveGTower_burst_center","ps":"buff-aura","pm":700,"ph":280,"ph1":340,"pw0":36,"pw1":60,"po0":0.95},"fiveGTower_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":240,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":40,"s1":100,"o0":0.55},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28},{"a":"floor","s":"emp-arc","l":420,"z":10,"s0":100,"s1":50,"o0":0.95},{"n":12,"a":"floor","s":"spark-elec","l":[220,420],"z":6,"o":14,"vx":160,"vy":160,"vz":[40,120],"g":100,"dr":1.5,"s0":[4,8],"s1":1},{"d":180,"a":"floor","s":"emp-arc","l":380,"z":6,"s0":80,"s1":36,"o0":0.7}]},"shootout_impact":{"L":[{"a":"floor","m":"world","s":"scorch","l":900,"z":2,"s0":36,"s1":70,"o0":0.75},{"s":"muzzle-flash","l":200,"z":4,"s0":90,"s1":26},{"s":"flash","l":160,"z":8,"s0":70,"s1":16,"o0":0.9},{"n":6,"s":"steel-spark","l":[200,380],"z":4,"o":8,"vx":130,"vy":130,"vz":[50,140],"g":240,"dr":1.4,"s0":[4,7],"s1":1},{"d":30,"m":"y-locked","s":"smoke","l":650,"o":6,"vz":[30,50],"dr":0.5,"s0":26,"s1":60,"o0":0.55}]},"requiem_impact":{"L":[{"a":"floor","m":"world","s":"scorch","l":1000,"z":2,"s0":40,"s1":80,"o0":0.85},{"s":"dark-flame","l":380,"z":6,"s0":90,"s1":36},{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.8},{"n":6,"s":"blood-fleck","l":[300,550],"z":4,"o":9,"vx":100,"vy":100,"vz":[40,130],"g":260,"dr":1.4,"s0":[4,8],"s1":1},{"n":2,"d":60,"m":"y-locked","s":"void-mist","l":[500,800],"o":8,"vz":[25,55],"dr":0.5,"s0":[18,28],"s1":[40,70],"o0":0.5}]},"raceDreadAura_impact":{"L":[{"s":"dark-flame","l":300,"z":6,"s0":70,"s1":26,"o0":0.95},{"s":"flash","l":160,"z":8,"s0":56,"s1":14,"o0":0.7},{"n":4,"s":"blood-fleck","l":[220,400],"z":4,"o":7,"vx":70,"vy":70,"vz":[30,100],"g":240,"dr":1.4,"s0":[3,6],"s1":1}]},"raceDreadAura_aura":{"ar":2,"sh":"square","ite":"raceDreadAura_aura_tile","ice":"raceDreadAura_aura_center","ps":"dark-flame","pm":680,"ph":240,"ph1":290,"pw0":70,"pw1":110,"po0":0.95},"raceDreadAura_aura_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":2,"s0":40,"s1":85,"o0":0.6},{"a":"floor","m":"world","s":"void-mist","l":1000,"z":2,"s0":36,"s1":80,"o0":0.5},{"a":"floor","s":"dark-flame","l":380,"z":6,"s0":40,"s1":16,"o0":0.85}]},"raceDreadAura_aura_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":80,"s1":320,"o0":0.85},{"s":"dark-flame","l":600,"z":12,"s0":150,"s1":60},{"s":"flash","l":250,"z":14,"s0":130,"s1":30,"o0":0.75},{"n":12,"s":"blood-fleck","l":[400,750],"z":6,"o":12,"vx":160,"vy":160,"vz":[50,180],"g":320,"dr":1.3,"s0":[5,9],"s1":1},{"n":3,"d":80,"a":"floor","m":"y-locked","s":"void-mist","l":[800,1200],"o":12,"vz":[35,70],"dr":0.45,"s0":[30,46],"s1":[70,120],"o0":0.65}]},"raceHowl_impact":{"L":[{"s":"flash","l":180,"z":8,"s0":75,"s1":18,"o0":0.85},{"n":5,"s":"spark-elec","l":[160,300],"z":4,"o":8,"vx":100,"vy":100,"vz":[40,110],"g":100,"dr":1.5,"s0":[3,6],"s1":1},{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":32,"s1":70,"o0":0.5}]},"raceHowl_aura":{"ar":2,"sh":"square","ite":"raceHowl_aura_tile","ice":"raceHowl_aura_center","ps":"buff-aura","pm":480,"ph":220,"ph1":260,"pw0":60,"pw1":100,"po0":1},"raceHowl_aura_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":30,"s1":75,"o0":0.6},{"n":2,"a":"floor","s":"spark-elec","l":[150,280],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,6],"s1":1}]},"raceHowl_aura_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":320,"o0":0.9},{"s":"flash","l":240,"z":14,"s0":160,"s1":36},{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":110,"s1":240,"o0":0.7},{"n":14,"s":"spark-elec","l":[200,380],"z":6,"o":14,"vx":180,"vy":180,"vz":[40,130],"g":120,"dr":1.5,"s0":[4,8],"s1":1},{"d":200,"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":100,"s1":280,"o0":0.55}]},"raceFractalNeedle_impact":{"L":[{"s":"flash","l":220,"z":10,"s0":110,"s1":26},{"s":"laser-pink","l":380,"z":6,"s0":80,"s1":32},{"n":8,"s":"divine-sparkle","l":[350,600],"z":6,"o":9,"vx":130,"vy":130,"vz":[60,160],"g":60,"dr":1.3,"s0":[5,9],"s1":1},{"d":40,"a":"floor","m":"y-locked","s":"void-mist","l":600,"o":10,"vz":[25,50],"dr":0.45,"s0":28,"s1":64,"o0":0.6},{"d":100,"s":"laser-pink","l":200,"z":8,"s0":50,"s1":18,"o0":0.75}]},"warpRune_aura":{"ar":0,"sh":"square","ice":"warpRune_burst_center"},"warpRune_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":30,"s1":110,"o0":0.7},{"a":"floor","s":"flash","l":200,"z":10,"s0":75,"s1":18,"o0":0.85},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,750],"o":8,"vz":[25,50],"dr":0.5,"s0":[20,30],"s1":[44,68],"o0":0.6},{"n":6,"a":"floor","s":"divine-sparkle","l":[400,700],"z":6,"o":8,"vx":50,"vy":50,"vz":[30,90],"g":-10,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95},{"n":4,"d":60,"a":"floor","s":"spark-blue","l":[400,650],"z":6,"o":7,"vx":40,"vy":40,"vz":[30,90],"g":-10,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.95}]},"_nexusChannelP1_aura":{"ar":0,"sh":"square","ice":"_nexusChannelP1_burst_center","ps":"shield-blue","pm":500,"ph":200,"ph1":240,"pw0":48,"pw1":72,"po0":0.85},"_nexusChannelP1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":550,"z":1,"s0":30,"s1":110,"o0":0.7},{"s":"flash","l":200,"z":6,"s0":60,"s1":14,"o0":0.7},{"n":5,"d":30,"s":"spark-blue","l":[400,650],"o":8,"vx":50,"vy":50,"vz":[50,120],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"_nexusChannelP2_aura":{"ar":0,"sh":"square","ice":"_nexusChannelP2_burst_center","ps":"flame","pm":500,"ph":200,"ph1":240,"pw0":48,"pw1":72,"po0":0.85},"_nexusChannelP2_burst_center":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":550,"z":1,"s0":30,"s1":110,"o0":0.7},{"s":"flash","l":200,"z":6,"s0":60,"s1":14,"o0":0.7},{"n":5,"d":30,"s":"ember","l":[400,650],"o":8,"vx":50,"vy":50,"vz":[50,120],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"_nexusProgressP1_aura":{"ar":0,"sh":"square","ice":"_nexusProgressP1_burst_center"},"_nexusProgressP1_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":600,"z":2,"s0":90,"s1":28,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":4,"s0":60,"s1":12,"o0":0.85},{"n":5,"d":20,"a":"floor","s":"spark-blue","l":[350,550],"z":4,"o":6,"vx":35,"vy":35,"vz":[20,70],"g":-10,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","s":"divine-sparkle","l":[400,600],"z":6,"o":6,"vx":30,"vy":30,"vz":[30,80],"g":-10,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95}]},"_nexusProgressP2_aura":{"ar":0,"sh":"square","ice":"_nexusProgressP2_burst_center"},"_nexusProgressP2_burst_center":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":600,"z":2,"s0":90,"s1":28,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":4,"s0":60,"s1":12,"o0":0.85},{"n":5,"d":20,"a":"floor","s":"ember","l":[350,550],"z":4,"o":6,"vx":35,"vy":35,"vz":[20,70],"g":-10,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","s":"spark-elec","l":[400,600],"z":6,"o":6,"vx":30,"vy":30,"vz":[30,80],"g":-10,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95}]},"_ice_impact_tile":{"L":[{"n":6,"a":"floor","s":"ice-shard","l":[300,550],"z":4,"o":10,"vx":100,"vy":100,"vz":[60,160],"g":280,"dr":1.4,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"target-ring-blue","l":650,"z":2,"s0":50,"s1":110,"o0":0.6}]},"_ice_impact_center":{"sk":"normal","L":[{"a":"floor","s":"flash","l":250,"z":10,"s0":120,"s1":30},{"a":"floor","s":"spark-blue","l":400,"z":8,"s0":140,"s1":40,"o0":0.9},{"n":10,"a":"floor","s":"ice-shard","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[80,200],"g":300,"dr":1.3,"s0":[6,12],"s1":1},{"n":2,"d":60,"a":"floor","m":"y-locked","s":"frost-mist","l":[700,1000],"o":14,"vz":[15,35],"dr":0.4,"s0":[35,50],"s1":[70,100],"o0":0.5}]},"_earth_impact_tile":{"L":[{"n":5,"a":"floor","s":"rock-debris","l":[300,550],"z":4,"o":10,"vx":90,"vy":90,"vz":[70,180],"g":320,"dr":1.5,"s0":[5,11],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":50,"s1":110,"o0":0.55}]},"_earth_impact_center":{"sk":"hard","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":100,"s1":24,"o0":0.9},{"n":12,"a":"floor","s":"rock-debris","l":[300,600],"z":4,"o":10,"vx":150,"vy":150,"vz":[80,220],"g":350,"dr":1.2,"s0":[6,14],"s1":2},{"n":3,"a":"floor","s":"debris","l":[400,700],"z":2,"o":12,"vx":100,"vy":100,"vz":[60,160],"g":380,"dr":1.1,"s0":[8,14],"s1":3,"o0":0.9},{"a":"floor","m":"world","s":"dust-puff","l":1000,"z":1,"s0":60,"s1":180,"o0":0.6}]},"_water_impact_tile":{"L":[{"n":5,"a":"floor","s":"wave-1","l":[300,550],"z":4,"o":10,"vx":90,"vy":90,"vz":[50,140],"g":260,"dr":1.4,"s0":[5,10],"s1":2,"o0":0.9},{"a":"floor","m":"world","s":"target-ring-blue","l":650,"z":2,"s0":50,"s1":100,"o0":0.55}]},"_water_impact_center":{"sk":"normal","L":[{"a":"floor","s":"spark-blue","l":350,"z":10,"s0":130,"s1":35},{"n":8,"a":"floor","s":"wave-1","l":[300,600],"z":4,"o":8,"vx":130,"vy":130,"vz":[60,180],"g":280,"dr":1.3,"s0":[6,12],"s1":2},{"a":"floor","m":"y-locked","s":"spark-blue","l":800,"w0":70,"w1":45,"h0":110,"h1":170,"o0":0.75}]},"_poison_impact_tile":{"L":[{"n":5,"a":"floor","s":"poison-bubble","l":[350,600],"z":4,"o":10,"vx":70,"vy":70,"vz":[30,100],"g":180,"dr":1.2,"s0":[5,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"acid-green","l":600,"z":2,"s0":50,"s1":100,"o0":0.5}]},"_poison_impact_center":{"sk":false,"L":[{"a":"floor","s":"acid-green","l":400,"z":8,"s0":100,"s1":35,"o0":0.9},{"n":10,"a":"floor","s":"poison-bubble","l":[300,600],"z":4,"o":10,"vx":110,"vy":110,"vz":[30,120],"g":160,"dr":1,"s0":[6,12],"s1":3,"o0":0.9},{"n":2,"d":80,"a":"floor","m":"y-locked","s":"smoke","l":[700,1000],"o":12,"vz":[20,50],"dr":0.4,"s0":[30,45],"s1":[65,90],"o0":0.45}]},"_sand_impact_tile":{"L":[{"n":8,"a":"floor","s":"sand-particle","l":[300,600],"z":4,"o":12,"vx":120,"vy":120,"vz":[40,120],"g":200,"dr":1,"s0":[4,8],"s1":1,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":60,"s1":120,"o0":0.5}]},"sharedFlashFreeze_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":1,"s0":50,"s1":130,"o0":0.7},{"a":"floor","s":"spark-blue","l":550,"z":4,"s0":70,"s1":28,"o0":0.8},{"n":7,"a":"floor","s":"ice-shard","l":[300,600],"z":6,"o":12,"vx":60,"vy":60,"vz":[80,180],"g":240,"dr":1.3,"s0":[5,10],"s1":[8,14]},{"a":"floor","m":"y-locked","s":"frost-mist","l":[600,800],"o":10,"vz":[15,30],"dr":0.5,"s0":[25,40],"s1":[55,80],"o0":0.4}]},"sharedRampart_tile":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.8},{"n":8,"a":"floor","s":"rock-debris","l":[250,550],"z":4,"o":12,"vx":70,"vy":70,"vz":[100,220],"g":320,"dr":1.2,"s0":[6,13],"s1":2},{"n":2,"a":"floor","s":"debris","l":[350,600],"z":2,"o":10,"vx":80,"vy":80,"vz":[60,140],"g":360,"dr":1.1,"s0":[8,14],"s1":3,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":1,"s0":50,"s1":130,"o0":0.6}]},"sharedFissure_tile":{"sk":"hard","L":[{"a":"floor","s":"flash","l":180,"z":10,"s0":90,"s1":22,"o0":0.85},{"n":10,"a":"floor","s":"rock-debris","l":[250,600],"z":4,"o":14,"vx":130,"vy":130,"vz":[100,260],"g":350,"dr":1.1,"s0":[5,14],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":1,"s0":70,"s1":200,"o0":0.65},{"n":2,"d":50,"a":"floor","s":"dark-flame","l":[600,900],"o":8,"vz":[30,80],"g":-20,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.6}]},"sharedScorchedEarth_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":80,"s1":120,"o0":0.8},{"n":6,"a":"floor","s":"ember","l":[300,600],"z":4,"o":12,"vx":80,"vy":80,"vz":[60,150],"g":250,"dr":1.3,"s0":[5,10],"s1":2},{"n":2,"d":50,"a":"floor","m":"y-locked","s":"smoke","l":[700,1000],"o":10,"vz":[20,50],"dr":0.4,"s0":[30,45],"s1":[65,95],"o0":0.5}]},"sharedPoisonSwamp_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"acid-green","l":700,"z":2,"s0":50,"s1":110,"o0":0.55},{"n":6,"a":"floor","s":"poison-bubble","l":[350,650],"z":4,"o":12,"vx":50,"vy":50,"vz":[30,100],"g":160,"dr":1.1,"s0":[5,10],"s1":3,"o0":0.85},{"d":60,"a":"floor","m":"y-locked","s":"smoke","l":[600,900],"o":10,"vz":[15,35],"dr":0.4,"s0":[28,40],"s1":[55,80],"o0":0.4}]},"sharedTerraform_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":1,"s0":55,"s1":130,"o0":0.65},{"a":"floor","s":"heal-glow","l":600,"z":4,"s0":65,"s1":28,"o0":0.65},{"n":6,"a":"floor","s":"vine-green","l":[300,600],"z":6,"o":12,"vx":45,"vy":45,"vz":[70,160],"g":200,"dr":1.2,"s0":[5,10],"s1":[9,14]},{"n":3,"d":80,"a":"floor","s":"divine-sparkle","l":[400,650],"z":8,"o":10,"vx":50,"vy":50,"vz":[40,100],"g":-20,"dr":1,"s0":[4,7],"s1":1,"o0":0.85}]},"sharedMaelstrom_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"target-ring-blue","l":800,"z":2,"s0":60,"s1":140,"o0":0.7},{"n":8,"a":"floor","s":"wave-1","l":[300,600],"z":4,"o":12,"vx":80,"vy":80,"vz":[50,150],"g":260,"dr":1.3,"s0":[6,12],"s1":2,"o0":0.9},{"a":"floor","m":"y-locked","s":"spark-blue","l":700,"w0":60,"w1":40,"h0":90,"h1":150,"o0":0.65}]},"sharedSacredGeometry_tile":{"sk":false,"L":[{"a":"floor","s":"flash","l":220,"z":10,"s0":80,"s1":22,"o0":0.85},{"a":"floor","s":"laser-pink","l":400,"z":6,"s0":65,"s1":28,"o0":0.8},{"n":6,"a":"floor","s":"divine-sparkle","l":[300,550],"z":6,"o":10,"vx":60,"vy":60,"vz":[80,170],"g":220,"dr":1.3,"s0":[5,10],"s1":[8,14]}]},"sharedGothicRampart_tile":{"sk":"normal","L":[{"n":6,"a":"floor","s":"rock-debris","l":[250,500],"z":4,"o":10,"vx":60,"vy":60,"vz":[80,180],"g":300,"dr":1.3,"s0":[5,11],"s1":2},{"n":2,"a":"floor","s":"dark-flame","l":[400,650],"z":2,"o":8,"vz":[30,70],"g":-15,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.5},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":1,"s0":45,"s1":110,"o0":0.55}]},"sharedZigguratProtocol_tile":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":8,"a":"floor","s":"rock-debris","l":[250,550],"z":4,"o":12,"vx":70,"vy":70,"vz":[100,220],"g":320,"dr":1.2,"s0":[6,13],"s1":2},{"n":3,"a":"floor","s":"spark-elec","l":[350,550],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,100],"g":-10,"dr":1,"s0":[4,7],"s1":1,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":850,"z":1,"s0":50,"s1":120,"o0":0.55}]},"sharedTidalSurge_beam":{"bs":"wave-1","bw":36,"bm":280,"bo0":0.9,"bo1":0,"ls":false},"sharedTidalSurge_impact_tile":{"L":[{"n":6,"s":"wave-1","l":[300,550],"z":4,"o":8,"vx":110,"vy":110,"vz":[40,120],"g":260,"dr":1.4,"s0":[5,10],"s1":2,"o0":0.9},{"a":"floor","m":"world","s":"target-ring-blue","l":600,"z":2,"s0":50,"s1":100,"o0":0.55}]},"raceShockwaveClap_beam":{"bs":"shockwave","bw":40,"bm":250,"bo0":0.85,"bo1":0},"raceShockwaveClap_impact_tile":{"L":[{"s":"shockwave","l":400,"z":6,"s0":120,"s1":40,"o0":0.8},{"n":4,"a":"floor","s":"dust-puff","l":[350,600],"z":2,"o":10,"vx":100,"vy":100,"vz":[30,80],"g":200,"dr":1.4,"s0":[8,14],"s1":[20,30],"o0":0.5}]},"raceDragonfire_beam":{"bs":"flame","bw":40,"bm":300,"bo0":1,"bo1":0,"ls":true},"raceDragonfire_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1300,"z":1,"s0":80,"s1":110,"o0":0.85},{"n":8,"s":"ember","l":[300,600],"z":4,"o":8,"vx":120,"vy":120,"vz":[50,160],"g":300,"dr":1.4,"s0":[5,10],"s1":2},{"n":2,"d":40,"m":"y-locked","s":"smoke","l":[600,900],"o":12,"vz":[20,45],"dr":0.4,"s0":[25,38],"s1":[50,75],"o0":0.45}]},"raceAtomicBreath_beam":{"bs":"flame-hot","bw":44,"bm":320,"bo0":1,"bo1":0,"ls":true},"raceAtomicBreath_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":90,"s1":120,"o0":0.9},{"s":"flash","l":200,"z":10,"s0":110,"s1":28},{"n":10,"s":"ember","l":[300,600],"z":4,"o":10,"vx":140,"vy":140,"vz":[60,180],"g":320,"dr":1.3,"s0":[5,12],"s1":2},{"n":3,"d":60,"m":"y-locked","s":"smoke","l":[700,1000],"o":14,"vz":[25,55],"dr":0.4,"s0":[30,45],"s1":[60,90],"o0":0.5}]},"raceWingGust_aoe":{"ar":1,"ite":"raceWingGust_impact_tile","ice":"raceWingGust_impact_center"},"raceWingGust_impact_tile":{"L":[{"n":3,"s":"dust-puff","l":[350,600],"z":2,"o":10,"vx":120,"vy":120,"vz":[30,80],"g":150,"dr":1,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceWingGust_impact_center":{"sk":"normal","L":[{"s":"shockwave","l":500,"z":6,"s0":60,"s1":280,"o0":0.8},{"n":6,"s":"dust-puff","l":[300,600],"z":2,"o":12,"vx":160,"vy":160,"vz":[20,60],"g":100,"dr":0.8,"s0":[12,20],"s1":[30,50],"o0":0.55}]},"raceCataclysmStomp_aoe":{"ar":2,"ite":"raceTremorStomp_impact_tile","ice":"_earth_impact_center"},"raceTidalSlam_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"racePrimalRoar_aoe":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"raceTremorStomp_impact_tile"},"raceAvalancheSlam_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"_ice_impact_center"},"raceCrowStorm_aoe":{"ar":1,"ite":"raceBatSwarm_impact_tile","ice":"raceBatSwarm_impact_tile"},"raceDeafeningWail_aoe":{"ar":1,"ite":"raceSonicBreaker_impact_tile","ice":"raceSonicBreaker_impact_tile"},"raceDepthCharge_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"raceSkyscraperToss_aoe":{"ar":1,"ite":"_earth_impact_tile","ice":"_earth_impact_center"},"raceRiptide_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"sharedVortexSlam_aoe":{"ar":1,"ite":"raceWhirlpool_impact_tile","ice":"raceWhirlpool_impact_center"},"raceThunderclap_descent":{"ar":1,"sh":"cross","ite":"thunder1_impact","ice":"thunder1_impact","_d":[{"sprite":"lightning","count":1,"w":40,"h":400,"fallMs":180,"opacity0":1,"opacity1":0}]},"raceFallenGrace_descent":{"ar":1,"sh":"cross","ite":"raceDarkDominion_impact_tile","ice":"raceDarkDominion_impact_tile","_d":[{"sprite":"dark-flame","count":1,"w":36,"h":360,"fallMs":200,"opacity0":1,"opacity1":0}]},"raceWrathOfTheWatchers_descent":{"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","_d":[{"sprite":"holy-light","count":1,"w":38,"h":380,"fallMs":190,"opacity0":1,"opacity1":0}]},"raceArtilleryStrike_descent":{"ar":1,"tm":700,"dsm":500,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":420,"durationMs":850,"delayMs":60,"trailCount":6},"L":[{"s":"missile","l":500,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":135,"_d":{"fromZ":600,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":18,"jitter":8,"msRange":[350,550],"sizeRange":[10,20]}}},{"s":"flash","l":500,"z":-2,"s0":140,"s1":120,"o0":0.5,"o1":0.7,"_d":{"fromZ":610,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":500,"z":-1,"s0":80,"s1":60,"o0":0.5,"o1":0.7,"_d":{"fromZ":605,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":30,"jitter":10,"msRange":[250,450],"sizeRange":[8,14]}}}]},"raceCataclysmDecree_descent":{"ar":1,"ite":"raceInfernalDecree_impact_tile","ice":"raceInfernalDecree_impact_center","_d":[{"sprite":"dark-flame","count":1,"w":34,"h":60,"fallMs":380,"opacity0":1,"opacity1":0.8,"trail":{"sprite":"ember","count":2,"size0":8,"size1":20,"ml":350,"opacity0":0.8,"opacity1":0}}]},"raceProphecyOfDisaster_descent":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"_earth_impact_center","_d":[{"sprite":"ember","count":1,"w":28,"h":45,"fallMs":360,"opacity0":1,"opacity1":0.8,"trail":{"sprite":"smoke","count":2,"size0":8,"size1":24,"ml":350,"opacity0":0.5,"opacity1":0}}]},"sharedNuke_descent":{"ar":2,"tm":850,"dsm":700,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":480,"durationMs":950,"delayMs":60,"trailCount":7},"L":[{"s":"flash","l":700,"s0":260,"s1":240,"o0":0.75,"o1":0.9,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"nuclear-missile","l":700,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":135,"_d":{"fromZ":780,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":18,"jitter":12,"msRange":[400,650],"sizeRange":[14,22]}}},{"s":"meteor","l":700,"z":-2,"s0":140,"s1":110,"o0":0.5,"o1":0.75,"_d":{"fromZ":785,"toZ":null,"ease":"easeIn","trail":{"sprite":"explosion-orange","rateMs":28,"jitter":16,"msRange":[300,550],"sizeRange":[12,20]}}}]},"raceSpectralPassage_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":200},"raceVoidStep_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":200},"raceMistForm_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":220},"raceCryptidVanish_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":220},"raceCorpseCrawl_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":220},"raceDeepDive_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":220},"raceEject_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":220},"raceShadowInfiltration_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":200},"_rockThrow_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26,"o0":0.9},{"n":8,"s":"rock-debris","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[60,180],"g":340,"dr":1.3,"s0":[5,12],"s1":2},{"n":2,"s":"debris","l":[350,600],"z":2,"o":8,"vx":90,"vy":90,"vz":[50,130],"g":360,"dr":1.1,"s0":[7,12],"s1":3,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":1,"s0":55,"s1":140,"o0":0.55}]},"raceJurassicJaw_impact":{"sk":"hard","L":[{"s":"flash","l":180,"z":10,"s0":110,"s1":28},{"n":8,"s":"blood-fleck","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[50,160],"g":60,"dr":1.2,"s0":[5,10],"s1":1},{"n":3,"s":"steel-spark","l":[250,450],"z":6,"o":6,"vx":120,"vy":120,"vz":[40,120],"g":300,"dr":1.5,"s0":[4,8],"s1":1}]},"_slashMelee_impact":{"sk":"normal","L":[{"s":"flash","l":180,"z":10,"s0":90,"s1":24,"o0":0.9},{"n":6,"s":"steel-spark","l":[250,500],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,140],"g":300,"dr":1.5,"s0":[4,8],"s1":1},{"n":4,"s":"blood-fleck","l":[350,600],"z":2,"o":6,"vx":100,"vy":100,"vz":[30,110],"g":60,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.9}]},"_heavyPunch_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":110,"s1":30},{"s":"shockwave","l":400,"z":4,"s0":80,"s1":200,"o0":0.7},{"n":6,"s":"steel-spark","l":[250,500],"z":6,"o":8,"vx":150,"vy":150,"vz":[40,140],"g":320,"dr":1.4,"s0":[4,9],"s1":1},{"n":2,"a":"floor","s":"dust-puff","l":[500,700],"z":2,"o":8,"vx":80,"vy":80,"vz":[20,50],"g":100,"dr":1,"s0":[10,16],"s1":[24,36],"o0":0.45}]},"raceTaserBolt_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.9},{"n":6,"s":"spark-elec","l":[250,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[30,100],"g":200,"dr":1.5,"s0":[4,8],"s1":1},{"s":"spark-blue","l":350,"z":4,"s0":60,"s1":20,"o0":0.7}]},"raceRecursiveLoop_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.85},{"s":"plasma","l":380,"z":6,"s0":80,"s1":30,"o0":0.85},{"n":5,"s":"spark-elec","l":[300,550],"z":4,"o":6,"vx":100,"vy":100,"vz":[30,100],"g":180,"dr":1.4,"s0":[4,8],"s1":1,"o0":0.9}]},"raceDarkJustice_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26},{"n":6,"s":"dark-flame","l":[300,550],"z":4,"o":8,"vx":130,"vy":130,"vz":[40,130],"g":60,"dr":1.2,"s0":[5,10],"s1":1,"o0":0.9},{"n":4,"s":"steel-spark","l":[250,500],"z":6,"o":6,"vx":110,"vy":110,"vz":[30,100],"g":280,"dr":1.5,"s0":[4,8],"s1":1}]},"raceAmbushLunge_impact":{"sk":"hard","L":[{"s":"flash","l":180,"z":10,"s0":100,"s1":26},{"n":5,"s":"blood-fleck","l":[300,550],"z":4,"o":6,"vx":120,"vy":120,"vz":[40,140],"g":60,"dr":1.2,"s0":[5,9],"s1":1},{"n":4,"s":"steel-spark","l":[250,500],"z":6,"o":6,"vx":110,"vy":110,"vz":[30,100],"g":280,"dr":1.5,"s0":[3,7],"s1":1,"o0":0.9}]},"raceStonefall_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26,"o0":0.9},{"n":7,"s":"rock-debris","l":[300,600],"z":4,"o":8,"vx":130,"vy":130,"vz":[50,160],"g":330,"dr":1.3,"s0":[5,11],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":850,"z":1,"s0":50,"s1":130,"o0":0.55}]},"raceMjolnirsEcho_impact":{"sk":"hard","L":[{"s":"flash","l":220,"z":10,"s0":110,"s1":28},{"s":"lightning","l":300,"z":8,"s0":80,"s1":30,"o0":0.9},{"n":6,"s":"spark-elec","l":[250,500],"z":6,"o":8,"vx":140,"vy":140,"vz":[40,130],"g":240,"dr":1.4,"s0":[4,9],"s1":1},{"n":3,"s":"steel-spark","l":[300,500],"z":4,"o":6,"vx":100,"vy":100,"vz":[30,90],"g":300,"dr":1.5,"s0":[3,7],"s1":1,"o0":0.9}]},"racePhotonScatter_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":24,"o0":0.9},{"s":"holy-light","l":350,"z":6,"s0":70,"s1":26,"o0":0.85},{"n":5,"s":"divine-sparkle","l":[300,550],"z":4,"o":6,"vx":120,"vy":120,"vz":[40,120],"g":200,"dr":1.3,"s0":[4,8],"s1":1}]},"raceDragonfear_impact":{"sk":"normal","L":[{"s":"dark-flame","l":350,"z":6,"s0":70,"s1":25,"o0":0.85},{"n":4,"s":"ember","l":[300,550],"z":4,"o":6,"vx":100,"vy":100,"vz":[40,120],"g":260,"dr":1.4,"s0":[4,8],"s1":1,"o0":0.9},{"d":50,"m":"y-locked","s":"void-mist","l":600,"o":10,"vz":[15,35],"dr":0.5,"s0":20,"s1":50,"o0":0.4}]},"raceDrainingEmbrace_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26},{"n":6,"s":"dark-flame","l":[300,600],"z":4,"o":8,"vx":100,"vy":100,"vz":[40,130],"g":60,"dr":1.2,"s0":[5,10],"s1":1,"o0":0.9},{"n":4,"s":"blood-fleck","l":[350,600],"z":2,"o":6,"vx":80,"vy":80,"vz":[30,100],"g":60,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.9}]},"raceGhoulishBite_impact":{"sk":"normal","L":[{"s":"flash","l":180,"z":10,"s0":85,"s1":22,"o0":0.85},{"n":5,"s":"blood-fleck","l":[300,550],"z":4,"o":6,"vx":110,"vy":110,"vz":[40,130],"g":60,"dr":1.2,"s0":[4,9],"s1":1},{"n":3,"s":"poison-bubble","l":[400,650],"z":2,"o":8,"vx":50,"vy":50,"vz":[20,60],"g":140,"dr":1,"s0":[4,8],"s1":2,"o0":0.7}]},"raceKissOfDecay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":24,"o0":0.9},{"n":5,"s":"dark-flame","l":[300,550],"z":4,"o":6,"vx":90,"vy":90,"vz":[30,110],"g":60,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.85},{"n":4,"s":"poison-bubble","l":[350,600],"z":2,"o":8,"vx":60,"vy":60,"vz":[20,70],"g":140,"dr":1,"s0":[4,8],"s1":2,"o0":0.75}]},"_buff_unholy_aura":{"ar":0,"ice":"_buff_unholy_burst_center"},"_buff_divine_aura":{"ar":0,"ice":"_buff_div_burst_center"},"_buff_tech_aura":{"ar":0,"ice":"_buff_tech_burst_center"},"_buff_anomaly_aura":{"ar":0,"ice":"_buff_anomaly_burst_center"},"_buff_human_aura":{"ar":0,"ice":"_buff_human_burst_center"},"_selfHeal_unholy_aura":{"ar":0,"ice":"_selfHeal_unholy_burst_center"},"_selfHeal_unholy_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":180,"o0":0.75},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.8},{"d":30,"s":"dark-flame","l":400,"z":4,"s0":90,"s1":30,"o0":0.5},{"s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":6,"s":"blood-fleck","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[50,140],"g":60,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.8}]},"_selfHeal_tech_aura":{"ar":0,"ice":"_selfHeal_tech_burst_center"},"_selfHeal_tech_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":180,"o0":0.75},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.8},{"d":30,"s":"spark-blue","l":400,"z":4,"s0":90,"s1":30,"o0":0.6},{"s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":5,"s":"spark-elec","l":[400,700],"o":8,"vx":70,"vy":70,"vz":[40,110],"g":180,"dr":1.3,"s0":[4,7],"s1":1,"o0":0.85}]},"raceTinfoilFortress_aura":{"ar":0,"ice":"_aoeShield_tech_burst_tile"},"raceTinkersContraption_aura":{"ar":0,"ice":"_aoeShield_tech_burst_tile"},"raceSwarmSignal_aura":{"ar":0,"ice":"_warCry_burst_tile"},"_zoneDebuff_ice_aura":{"ar":1,"sh":"square","ice":"_ice_impact_center","ite":"_ice_impact_tile"},"_zoneDebuff_dark_aura":{"ar":1,"sh":"square","ice":"raceDarkDominion_impact_tile"},"_zoneDebuff_smoke_aura":{"ar":1,"sh":"square","ice":"raceDeadAir_burst_center"},"_zoneHeal_water_aura":{"ar":1,"sh":"square","ice":"raceTidalBlessing_burst_tile"},"_zoneHeal_nature_aura":{"ar":1,"sh":"square","ice":"raceSanctuary_burst_tile"},"_deployTurret_generic_aura":{"ar":0,"ice":"deployTurret_burst_center"},"_deployObject_aura":{"ar":0,"ice":"_deployObject_burst"},"_deployObject_burst":{"L":[{"a":"floor","s":"flash","l":180,"z":8,"s0":60,"s1":18,"o0":0.7},{"a":"floor","m":"world","s":"dust-puff","l":600,"z":2,"s0":40,"s1":90,"o0":0.45},{"n":4,"a":"floor","s":"smoke","l":[300,550],"z":4,"o":10,"vx":50,"vy":50,"vz":[30,80],"g":120,"dr":1.2,"s0":[6,10],"s1":[14,22],"o0":0.4}]},"racePsychicBarrier_aura":{"ar":0,"ice":"racePsychicBarrier_burst"},"racePsychicBarrier_burst":{"L":[{"s":"psi-pulse","l":350,"z":10,"s0":110,"s1":30,"o0":0.9},{"a":"floor","m":"world","s":"target-ring","l":700,"z":2,"s0":40,"s1":120,"o0":0.7},{"n":3,"d":50,"s":"spark-pink","l":[250,450],"z":6,"o":8,"vx":60,"vy":60,"vz":[20,60],"g":80,"dr":1.5,"s0":[4,7],"s1":1,"o0":0.85}]},"raceShieldWall_aura":{"ar":0,"ice":"raceShieldWall_burst"},"raceShieldWall_burst":{"L":[{"s":"flash","l":300,"z":8,"s0":80,"s1":20,"o0":0.8},{"a":"floor","m":"world","s":"target-ring","l":600,"z":2,"s0":50,"s1":100,"o0":0.6}]},"raceMushroomRing_aura":{"ar":1,"ice":"raceMushroomRing_burst"},"raceMushroomRing_burst":{"L":[{"a":"floor","s":"flash","l":300,"z":6,"s0":100,"s1":30,"o0":0.6},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":60,"s1":200,"o0":0.7},{"n":6,"d":80,"a":"floor","s":"sparkle","l":[400,700],"z":4,"o":12,"vx":40,"vy":40,"vz":[15,45],"g":30,"dr":0.8,"s0":[4,8],"s1":2,"o0":0.8}]},"raceContainmentField_tile":{"sk":"soft","L":[{"a":"floor","s":"flash","l":250,"z":10,"s0":80,"s1":20,"o0":0.85},{"a":"floor","m":"y-locked","s":"plasma","l":600,"w0":40,"w1":20,"h0":80,"h1":120,"o0":0.7},{"n":4,"d":30,"a":"floor","s":"spark-blue","l":[200,400],"z":8,"o":6,"vx":80,"vy":80,"vz":[30,80],"g":150,"dr":1.4,"s0":[3,6],"s1":1,"o0":0.9}]},"_turretBlast_beam":{"cm":60,"bs":"plasma","bt":10,"bhs":"flash","bm":220,"ite":"_turretBlast_impact","ice":null,"ls":false,"sk":null},"_turretBlast_impact":{"L":[{"s":"flash","l":180,"s0":56,"s1":12,"o0":0.9},{"n":6,"s":"spark-elec","l":[220,400],"z":4,"o":6,"vx":120,"vy":120,"vz":[40,140],"g":220,"dr":1.4,"s0":[5,10],"s1":1}]},"_heal_burst":{"L":[{"n":24,"a":"floor","s":"heal-cross","l":[500,900],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"n":18,"d":300,"a":"floor","s":"heal-cross","l":[400,700],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.7},{"d":350,"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.6},{"d":700,"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.5},{"a":"floor","m":"world","s":"heal-cross","l":1200,"z":1,"s0":80,"s1":100,"o0":0.4}]},"_mana_burst":{"L":[{"n":24,"a":"floor","s":"spark-blue","l":[500,900],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"n":18,"d":300,"a":"floor","s":"spark-blue","l":[400,700],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.7},{"d":350,"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.6},{"d":700,"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.5},{"a":"floor","m":"world","s":"spark-blue","l":1200,"z":1,"s0":80,"s1":100,"o0":0.4}]},"_buff_burst":{"L":[{"s":"flash","l":180,"s0":64,"s1":20},{"n":15,"s":"divine-sparkle","l":[300,500],"o":6,"vx":10,"vy":10,"vz":[80,140],"dr":0.4,"s0":[5,8],"s1":2,"o0":0.9},{"n":20,"a":"floor","s":"divine-sparkle","l":[600,1000],"o":26,"z":[5,40],"vx":40,"vy":40,"vz":[-10,15],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.7},{"a":"floor","m":"world","s":"target-ring-gold","l":500,"z":2,"s0":24,"s1":90,"o0":0.7}]},"_status_poison":{"L":[{"n":16,"m":"y-locked","s":"smoke","l":[600,1000],"o":16,"vz":[20,45],"dr":0.3,"s0":[18,32],"s1":50,"o0":0.6,"tR":0.2,"tG":0.85,"tB":0.35},{"n":20,"s":"ember","l":[300,600],"o":8,"vx":60,"vy":60,"vz":[-20,40],"g":-80,"dr":1.2,"s0":[7,12],"s1":2,"o0":0.8,"tR":0.3,"tG":0.9,"tB":0.4},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":1,"s0":40,"s1":80,"o0":0.5}]},"_status_burn":{"L":[{"n":14,"s":"ember","l":[400,800],"o":14,"vx":30,"vy":30,"vz":[15,50],"g":-120,"dr":0.8,"s0":[4,8],"s1":1,"o0":0.8},{"n":4,"m":"y-locked","s":"flame","l":[350,600],"o":10,"z":[-5,5],"w0":[8,14],"w1":[4,8],"h0":[14,22],"h1":[30,50],"o0":0.9},{"n":3,"d":200,"m":"y-locked","s":"smoke","l":[700,1100],"o":12,"z":10,"vz":[20,40],"dr":0.3,"s0":[20,34],"s1":55,"o0":0.5}]},"_status_stun":{"L":[{"s":"flash","l":150,"s0":40,"s1":12},{"n":18,"s":"spark-elec","l":[250,500],"o":20,"z":[0,6],"vx":40,"vy":40,"vz":[-5,10],"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"stun-ring","l":350,"z":35,"s0":10,"s1":70,"o0":0.8}]},"_status_slow":{"L":[{"n":15,"s":"spark-blue","l":[350,650],"o":18,"z":[5,20],"vx":10,"vy":10,"vz":[-60,-30],"g":200,"dr":0.4,"s0":[4,8],"s1":1,"o0":0.8},{"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":100,"s1":20,"o0":0.6},{"n":15,"s":"spark-blue","l":[250,450],"o":24,"vx":-50,"vy":-50,"vz":[-10,30],"dr":1.2,"s0":[5,9],"s1":2,"o0":0.7}]},"_status_bleed":{"L":[{"n":12,"s":"blood-fleck","l":[300,600],"o":6,"vx":80,"vy":80,"vz":[-20,20],"g":300,"dr":1,"s0":[5,10],"s1":2,"o0":0.9},{"n":8,"d":100,"s":"blood-fleck","l":[400,800],"o":12,"vx":15,"vy":15,"vz":[-5,10],"g":400,"dr":0.4,"s0":[4,8],"s1":2,"o0":0.8}]},"_status_silence":{"L":[{"n":24,"s":"psi-pulse","l":[200,350],"o":40,"vx":-100,"vy":-100,"vz":[-10,10],"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85},{"d":100,"s":"flash","l":160,"s0":48,"s1":14,"o0":0.8},{"n":6,"d":200,"s":"psi-pulse","l":[400,700],"o":10,"vx":15,"vy":15,"vz":[-8,8],"dr":0.5,"s0":[4,7],"s1":2,"o0":0.5}]},"_levelUp_burst":{"L":[{"s":"flash","l":140,"s0":80,"s1":24},{"n":35,"a":"floor","s":"divine-sparkle","l":[500,900],"o":12,"vx":10,"vy":10,"vz":[100,180],"dr":0.4,"g":-150,"s0":[6,10],"s1":2,"o0":0.9},{"n":25,"d":200,"a":"floor","s":"divine-sparkle","l":[400,700],"o":20,"vx":20,"vy":20,"vz":[60,120],"dr":0.5,"s0":[4,7],"s1":1,"o0":0.7},{"d":100,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.8},{"d":350,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.65},{"d":550,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.5},{"n":16,"d":300,"a":"floor","s":"divine-sparkle","l":[600,1200],"o":28,"z":[10,50],"vx":35,"vy":35,"vz":[-5,10],"dr":0.4,"s0":[5,9],"s1":2,"o0":0.7},{"a":"floor","m":"world","s":"target-ring-gold","l":1600,"z":1,"s0":100,"s1":120,"o0":0.35}]},"_blood_normal":{"L":[{"n":6,"s":"blood-fleck","l":[250,450],"o":4,"vx":80,"vy":80,"vz":[-20,40],"g":180,"dr":0.6,"s0":[4,8],"s1":2,"o0":0.9}]},"_blood_critical":{"L":[{"n":14,"s":"blood-fleck","l":[300,600],"o":6,"vx":120,"vy":120,"vz":[-30,60],"g":200,"dr":0.5,"s0":[5,11],"s1":2,"o0":0.95},{"n":3,"s":"blood-mist","l":[400,700],"o":6,"vx":20,"vy":20,"vz":[5,25],"dr":1,"s0":[18,28],"s1":40,"o0":0.5},{"n":4,"d":60,"s":"blood-fleck","l":[400,700],"o":8,"vx":50,"vy":50,"vz":[30,70],"g":300,"dr":0.3,"s0":[3,6],"s1":1,"o0":0.85}]},"_blood_super_effective":{"L":[{"n":18,"s":"blood-fleck","l":[300,650],"o":8,"vx":150,"vy":150,"vz":[-40,80],"g":200,"dr":0.45,"s0":[5,12],"s1":2,"o0":0.95},{"n":4,"s":"blood-mist","l":[450,800],"o":10,"vx":30,"vy":30,"vz":[10,30],"dr":0.8,"s0":[22,36],"s1":50,"o0":0.55},{"d":80,"a":"floor","m":"world","s":"blood-splat","l":1400,"z":1,"s0":40,"s1":60,"o0":0.6},{"n":6,"d":40,"s":"blood-fleck","l":[500,800],"o":6,"vx":70,"vy":70,"vz":[40,90],"g":300,"dr":0.3,"s0":[3,7],"s1":1,"o0":0.85}]},"_blood_killing_blow":{"L":[{"n":24,"s":"blood-fleck","l":[350,750],"o":10,"vx":200,"vy":200,"vz":[-50,100],"g":220,"dr":0.4,"s0":[6,14],"s1":2},{"n":5,"s":"blood-mist","l":[500,900],"o":12,"vx":35,"vy":35,"vz":[10,40],"dr":0.7,"s0":[28,44],"s1":60,"o0":0.6},{"d":60,"a":"floor","m":"world","s":"blood-splat","l":2000,"z":1,"s0":50,"s1":80,"o0":0.7},{"n":10,"d":30,"s":"blood-fleck","l":[600,1000],"o":8,"vx":90,"vy":90,"vz":[60,130],"g":320,"dr":0.25,"s0":[3,8],"s1":1,"o0":0.9},{"n":10,"d":200,"s":"blood-fleck","l":[300,550],"o":14,"vx":160,"vy":160,"vz":[-20,50],"g":250,"dr":0.5,"s0":[4,10],"s1":2,"o0":0.8},{"d":300,"a":"floor","m":"world","s":"blood-splat","l":1800,"z":1,"s0":30,"s1":50,"o0":0.5}]},"_blood_resist":{"L":[{"n":3,"s":"blood-fleck","l":[200,350],"o":3,"vx":50,"vy":50,"vz":[-10,25],"g":150,"dr":0.8,"s0":[3,6],"s1":1,"o0":0.7}]},"_death_burst":{"L":[{"s":"flash","l":160,"s0":56,"s1":18,"o0":0.7},{"n":40,"s":"debris","l":[400,900],"o":8,"vx":160,"vy":160,"vz":[-30,80],"g":200,"dr":0.8,"s0":[5,10],"s1":2,"o0":0.8},{"n":4,"d":50,"m":"y-locked","s":"smoke","l":[800,1200],"o":14,"vz":[15,35],"dr":0.3,"s0":[28,44],"s1":70,"o0":0.5},{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":70,"s1":90,"o0":0.5}]},"_dash_burst":{"L":[{"n":12,"a":"floor","s":"flash","l":[200,400],"o":8,"z":[5,25],"vx":40,"vy":40,"vz":[-5,15],"dr":2,"s0":[4,8],"s1":1,"o0":0.7},{"n":6,"a":"floor","m":"y-locked","s":"dust-puff","l":[400,700],"o":12,"vz":[8,20],"dr":0.5,"s0":[16,28],"s1":44,"o0":0.5}]},"_teleport_vanish":{"L":[{"n":18,"s":"spark-elec","l":[200,350],"o":36,"vx":-120,"vy":-120,"vz":[-10,10],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.8},{"d":150,"s":"flash","l":120,"s0":60,"s1":16}]},"_teleport_arrive":{"L":[{"n":18,"s":"spark-elec","l":[250,450],"o":6,"vx":120,"vy":120,"vz":[10,50],"dr":1,"s0":[5,9],"s1":2,"o0":0.8},{"a":"floor","m":"world","s":"shockwave","l":350,"z":2,"s0":16,"s1":90,"o0":0.7},{"s":"flash","l":160,"s0":50,"s1":16,"o0":0.9}]},"_zone_debuff_cast":{"L":[{"n":8,"a":"floor","s":"flash","l":[120,180],"o":6,"z":[2,12],"s0":[20,36],"s1":6,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":20,"s1":200,"o0":0.6},{"n":20,"a":"floor","s":"psi-pulse","l":[350,700],"o":40,"z":[15,40],"vx":20,"vy":20,"vz":[-30,15],"g":80,"dr":0.5,"s0":[4,8],"s1":1,"o0":0.65}]},"_zone_heal_cast":{"L":[{"n":8,"a":"floor","s":"flash","l":[120,180],"o":6,"z":[2,12],"s0":[20,36],"s1":6,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":500,"z":2,"s0":20,"s1":200,"o0":0.6},{"n":20,"a":"floor","s":"heal-cross","l":[350,700],"o":40,"vx":15,"vy":15,"vz":[30,70],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.7}]},"_combo_explosion":{"sk":"hard","L":[{"s":"flash","l":300,"s0":120,"s1":36},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":260,"o0":0.8},{"n":40,"s":"ember","l":[400,800],"o":10,"vx":200,"vy":200,"vz":[40,200],"g":300,"dr":1.2,"s0":[8,16],"s1":2},{"n":6,"d":150,"m":"y-locked","s":"smoke","l":[800,1400],"o":24,"vz":[20,50],"dr":0.3,"s0":[40,64],"s1":110,"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":120,"s1":150,"o0":0.7}]},"raceStunRay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20},{"n":14,"s":"spark-elec","l":[300,550],"o":8,"vx":170,"vy":170,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":3,"d":20,"s":"stun-ring","l":[500,800],"z":15,"o":6,"s0":[20,35],"s1":[50,70],"o0":0.8},{"n":5,"d":30,"s":"plasma","l":[250,450],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":180,"dr":1.2,"s0":[6,10],"s1":1,"o0":0.9}]},"raceSpaceDisco_aoe":{"ar":2,"ite":"raceSpaceDisco_impact_tile","ice":"raceSpaceDisco_impact_center","sk":"normal"},"raceSpaceDisco_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":10,"s0":50,"s1":15},{"n":8,"a":"floor","s":"spark-pink","l":[250,500],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":200,"dr":1.3,"s0":[6,12],"s1":1}]},"raceSpaceDisco_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":260,"o0":0.9},{"n":12,"s":"laser-pink","l":[300,600],"z":8,"o":10,"vx":200,"vy":200,"vz":[50,180],"g":160,"dr":1.2,"s0":[8,16],"s1":1}]},"racePlasmaWhip_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"laser-pink","l":[280,500],"o":7,"vx":160,"vy":160,"vz":[40,140],"g":200,"dr":1.4,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"ember","l":[350,600],"o":5,"vx":100,"vy":100,"vz":[30,100],"g":60,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceCorrosiveSplash_aoe":{"ar":1,"ite":"raceCorrosiveSplash_impact_tile","ice":"raceCorrosiveSplash_impact_center","sk":"normal"},"raceCorrosiveSplash_impact_tile":{"L":[{"n":3,"a":"floor","s":"inkblot","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[20,80],"g":400,"dr":1.5,"s0":[16,28],"s1":[8,14],"o0":0.9},{"n":5,"a":"floor","s":"acid-green","l":[250,500],"z":3,"o":6,"vx":100,"vy":100,"vz":[20,80],"g":300,"dr":1.4,"s0":[6,12],"s1":1},{"n":3,"d":40,"a":"floor","s":"poison-bubble","l":[500,800],"o":5,"vz":[15,40],"g":20,"dr":0.6,"s0":[8,14],"s1":[18,28],"o0":0.7}]},"raceCorrosiveSplash_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":80,"s1":140,"o0":0.7},{"n":6,"s":"inkblot","l":[300,600],"z":5,"o":12,"vx":160,"vy":160,"vz":[40,140],"g":350,"dr":1.3,"s0":[20,36],"s1":[10,18],"o0":0.95},{"n":8,"d":10,"s":"acid-green","l":[300,550],"z":3,"o":10,"vx":180,"vy":180,"vz":[40,160],"g":240,"dr":1.4,"s0":[8,14],"s1":1}]},"raceAbsorb_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"inkblot","l":[350,650],"o":8,"vx":120,"vy":120,"vz":[20,100],"g":280,"dr":1.4,"s0":[14,24],"s1":[6,12],"o0":0.9},{"n":6,"d":20,"s":"dark-flame","l":[300,550],"z":5,"o":6,"vx":80,"vy":80,"vz":[30,100],"g":60,"dr":0.8,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":4,"d":50,"s":"heal-glow","l":[400,700],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[6,10],"s1":1,"o0":0.8}]},"raceMitosisSplit_aura":{"ar":0,"ice":"raceMitosisSplit_burst","ps":"dark-flame","pm":450,"ph":160,"pw0":50,"pw1":80,"ph1":200,"po0":0.7},"raceMitosisSplit_burst":{"L":[{"n":10,"s":"inkblot","l":[350,650],"o":10,"vx":200,"vy":200,"vz":[40,160],"g":350,"dr":2,"s0":[18,32],"s1":[8,14],"o0":0.9},{"n":6,"d":30,"s":"acid-green","l":[300,500],"z":5,"o":6,"vx":100,"vy":100,"vz":[20,80],"g":100,"dr":1,"s0":[6,10],"s1":1,"o0":0.8}]},"raceToxicNova_aoe":{"ar":2,"ite":"raceToxicNova_impact_tile","ice":"raceToxicNova_impact_center","sk":"hard"},"raceToxicNova_impact_tile":{"L":[{"n":4,"a":"floor","s":"inkblot","l":[300,600],"o":6,"vx":80,"vy":80,"vz":[15,60],"g":350,"dr":1.5,"s0":[14,24],"s1":[6,12],"o0":0.85},{"n":6,"d":10,"a":"floor","s":"poison-bubble","l":[400,700],"z":3,"o":5,"vz":[20,60],"g":40,"dr":0.6,"s0":[6,12],"s1":[16,24],"o0":0.7}]},"raceToxicNova_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":300,"o0":0.8},{"n":10,"s":"inkblot","l":[300,600],"z":5,"o":15,"vx":220,"vy":220,"vz":[50,180],"g":300,"dr":1.3,"s0":[22,40],"s1":[10,20],"o0":0.95}]},"raceQuake_aoe":{"ar":2,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceQuake_impact_tile":{"L":[{"n":3,"a":"floor","s":"rock-debris","l":[300,550],"o":6,"vx":120,"vy":120,"vz":[40,140],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.95},{"n":2,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":5,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.6}]},"raceQuake_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":280,"o0":0.85},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":80,"s1":150,"o0":0.7},{"n":8,"a":"floor","s":"rock-debris","l":[300,600],"z":5,"o":12,"vx":200,"vy":200,"vz":[60,200],"g":500,"dr":1.3,"s0":[10,18],"s1":1,"o0":0.95}]},"raceRamCharge_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":90,"s1":22},{"n":8,"a":"floor","s":"smoke","l":[350,650],"o":10,"vx":160,"vy":160,"vz":[20,80],"g":20,"dr":0.6,"s0":[14,24],"s1":[35,55],"o0":0.6},{"n":6,"d":10,"s":"steel-spark","l":[250,450],"o":6,"vx":180,"vy":180,"vz":[40,160],"g":350,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":4,"d":20,"a":"floor","s":"debris","l":[400,650],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.95}]},"raceExhaustCloud_aura":{"ar":1,"ice":"raceExhaustCloud_burst","ps":"smoke","pm":500,"ph":140,"pw0":60,"pw1":100,"ph1":180,"po0":0.5},"raceExhaustCloud_burst":{"L":[{"n":10,"a":"floor","s":"smoke","l":[300,600],"o":12,"vx":100,"vy":100,"vz":[15,50],"g":10,"dr":0.5,"s0":[16,28],"s1":[40,65],"o0":0.5},{"n":4,"d":20,"a":"floor","s":"spark-elec","l":[250,450],"z":5,"o":6,"vx":80,"vy":80,"vz":[20,60],"g":200,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceRoboPunch_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":80,"s1":20},{"n":10,"s":"steel-spark","l":[250,500],"o":7,"vx":180,"vy":180,"vz":[50,180],"g":350,"dr":1.6,"w0":[10,20],"w1":[4,8],"h0":3,"h1":1},{"n":3,"d":20,"s":"debris","l":[350,600],"o":5,"vx":130,"vy":130,"vz":[40,130],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.9}]},"raceMissileBarrage_aoe":{"ar":1,"ite":"raceMissileBarrage_impact_tile","ice":"raceMissileBarrage_impact_center","sk":"hard"},"raceMissileBarrage_impact_tile":{"L":[{"a":"floor","s":"explosion-orange","l":350,"z":5,"s0":45,"s1":15},{"n":4,"a":"floor","s":"steel-spark","l":[200,400],"z":3,"o":5,"vx":140,"vy":140,"vz":[40,130],"g":350,"dr":1.5,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":2,"d":20,"a":"floor","s":"smoke","l":[350,600],"o":5,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.5}]},"raceMissileBarrage_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":240,"o0":0.9},{"s":"explosion-orange","l":400,"z":10,"s0":80,"s1":30}]},"raceIceSpear_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":12,"s":"ice-shard","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":250,"dr":1.5,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"frost-mist","l":[350,600],"z":5,"o":6,"vz":[10,40],"dr":0.6,"s0":[12,20],"s1":[25,40],"o0":0.6}]},"raceDiamondDust_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"raceDiamondDust_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":250,"o0":0.85},{"n":14,"s":"ice-shard","l":[300,550],"z":8,"o":12,"vx":200,"vy":200,"vz":[60,200],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":8,"d":20,"s":"divine-sparkle","l":[400,700],"z":12,"o":10,"vz":[20,60],"dr":0.6,"s0":[5,10],"s1":1,"o0":0.9}]},"raceAbsoluteZero_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":100,"s1":25},{"n":18,"s":"ice-shard","l":[280,550],"o":10,"vx":220,"vy":220,"vz":[60,220],"g":200,"dr":1.3,"s0":[10,18],"s1":1},{"n":8,"d":10,"s":"frost-mist","l":[350,650],"z":8,"o":8,"vz":[10,40],"dr":0.5,"s0":[16,28],"s1":[35,55],"o0":0.6},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":200,"o0":0.8}]},"raceUnstoppableCharge_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":90,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":220,"o0":0.85},{"n":8,"a":"floor","s":"rock-debris","l":[300,550],"o":10,"vx":180,"vy":180,"vz":[50,180],"g":500,"dr":1.4,"s0":[8,16],"s1":1,"o0":0.95},{"n":5,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,40],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.5}]},"raceBrutalSlam_aoe":{"ar":1,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceKiBlast_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":200,"o0":0.9},{"s":"flash","l":280,"s0":130,"s1":32},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":22,"s":"holy-light","l":[400,800],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":120,"dr":1.2,"s0":[10,18],"s1":2},{"n":10,"d":60,"s":"ember","l":[700,1200],"o":12,"z":6,"vx":40,"vy":40,"vz":[80,200],"g":-40,"dr":0.7,"s0":[7,13],"s1":1,"o0":0.9},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":60,"s1":100,"o0":0.6}]},"raceFlurryOfBlows_impact":{"L":[{"s":"flash","l":160,"s0":70,"s1":18},{"n":10,"s":"holy-light","l":[200,450],"o":6,"vx":180,"vy":180,"vz":[40,160],"g":250,"dr":1.5,"s0":[8,14],"s1":1},{"n":6,"s":"steel-spark","l":[180,380],"o":5,"vx":160,"vy":160,"vz":[30,120],"g":300,"dr":1.6,"s0":[5,10],"s1":1},{"n":4,"d":10,"s":"blood-fleck","l":[250,450],"o":4,"vx":100,"vy":100,"vz":[20,90],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceKiWave_beam":{"cm":350,"bs":"holy-light","bt":52,"bhs":"flash","bm":280,"ite":"raceKiWave_impact_tile","ls":true,"sk":"hard"},"raceKiWave_impact_tile":{"L":[{"a":"floor","s":"flash","l":200,"z":8,"s0":70,"s1":18},{"a":"floor","m":"world","s":"halo-ring","l":500,"z":2,"s0":30,"s1":120,"o0":0.7},{"n":12,"a":"floor","s":"holy-light","l":[300,600],"z":5,"o":8,"vx":160,"vy":160,"vz":[40,160],"g":180,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"d":30,"a":"floor","s":"ember","l":[500,800],"z":3,"o":5,"vx":40,"vy":40,"vz":[60,140],"g":-30,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.85}]},"raceDragonFist_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":220,"o0":0.9},{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":220,"o0":0.85},{"s":"flash","l":300,"s0":140,"s1":36},{"n":20,"s":"holy-light","l":[400,800],"o":10,"vx":220,"vy":220,"vz":[60,240],"g":150,"dr":1.2,"s0":[10,18],"s1":2},{"n":8,"d":20,"s":"flame","l":[400,700],"o":10,"vx":60,"vy":60,"vz":[80,220],"g":-40,"dr":0.5,"s0":[10,18],"s1":[20,34],"o0":0.8},{"n":10,"d":60,"s":"ember","l":[700,1200],"o":12,"z":6,"vx":50,"vy":50,"vz":[100,260],"g":-40,"dr":0.5,"s0":[7,13],"s1":2,"o0":0.9},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":80,"s1":130,"o0":0.7}]},"raceExcaliburStrike_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":100,"s1":25},{"n":14,"s":"divine-sparkle","l":[280,520],"o":8,"vx":200,"vy":200,"vz":[50,180],"g":180,"dr":1.2,"s0":[8,16],"s1":1},{"n":6,"d":10,"s":"ember","l":[300,550],"z":5,"o":6,"vx":120,"vy":120,"vz":[30,100],"g":60,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9},{"s":"holy-pillar","l":600,"z":20,"s0":30,"s1":80,"o0":0.8}]},"raceHolyAvenger_cross":{"cm":300,"bs":"divine-sparkle","bt":36,"bhs":"flash","bm":350,"ite":"raceHolyAvenger_impact_tile","ls":false,"sk":"hard"},"raceHolyAvenger_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":8,"s0":50,"s1":15},{"n":8,"a":"floor","s":"divine-sparkle","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":180,"dr":1.2,"s0":[7,12],"s1":1}]},"raceChestPound_aoe":{"ar":1,"ite":"raceChestPound_impact_tile","ice":"raceChestPound_impact_center","sk":"normal"},"raceChestPound_impact_tile":{"L":[{"n":3,"a":"floor","s":"dust-puff","l":[300,550],"o":6,"vx":100,"vy":100,"vz":[15,50],"g":60,"dr":0.6,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceChestPound_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":220,"o0":0.8},{"n":6,"a":"floor","s":"rock-debris","l":[300,550],"z":5,"o":10,"vx":160,"vy":160,"vz":[40,160],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.9}]},"racePrimalSmash_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":90,"s1":22},{"n":6,"a":"floor","s":"rock-debris","l":[300,550],"o":8,"vx":160,"vy":160,"vz":[50,180],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.95},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":60,"s1":120,"o0":0.6},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceGroundSlam_aoe":{"ar":2,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceBullRush_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":35,"s1":200,"o0":0.8},{"n":6,"a":"floor","s":"dust-puff","l":[350,600],"o":8,"vx":140,"vy":140,"vz":[15,50],"g":40,"dr":0.5,"s0":[12,22],"s1":[30,50],"o0":0.5},{"n":5,"d":10,"s":"blood-fleck","l":[300,550],"o":6,"vx":140,"vy":140,"vz":[30,130],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceGore_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"blood-fleck","l":[250,500],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":420,"dr":1.5,"s0":[7,13],"s1":1},{"n":3,"d":20,"s":"blood-mist","l":[350,600],"z":5,"o":6,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[25,40],"o0":0.5},{"n":3,"d":10,"s":"poison-bubble","l":[400,650],"z":3,"o":4,"vz":[15,40],"g":30,"dr":0.6,"s0":[5,9],"s1":[12,18],"o0":0.7}]},"raceLabyrinthRoar_aoe":{"ar":2,"ite":"raceLabyrinthRoar_impact_tile","ice":"raceLabyrinthRoar_impact_center","sk":"normal"},"raceLabyrinthRoar_impact_tile":{"L":[{"n":2,"a":"floor","s":"dust-puff","l":[300,550],"o":5,"vx":80,"vy":80,"vz":[10,40],"g":40,"dr":0.5,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceLabyrinthRoar_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":260,"o0":0.8},{"n":6,"s":"dark-flame","l":[300,550],"z":8,"o":10,"vx":150,"vy":150,"vz":[30,100],"g":40,"dr":0.6,"s0":[12,20],"s1":[25,40],"o0":0.6}]},"raceSoulDrain_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"dark-flame","l":[300,560],"o":8,"vx":140,"vy":140,"vz":[30,120],"g":40,"dr":0.7,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":6,"d":20,"s":"void-mist","l":[350,600],"z":5,"o":6,"vz":[15,50],"dr":0.5,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":4,"d":40,"s":"heal-glow","l":[500,800],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[5,9],"s1":1,"o0":0.7}]},"raceBoneBarrage_aoe":{"ar":1,"ite":"raceBoneBarrage_impact_tile","ice":"raceBoneBarrage_impact_center","sk":"normal"},"raceBoneBarrage_impact_tile":{"L":[{"n":4,"a":"floor","s":"debris","l":[250,500],"o":6,"vx":120,"vy":120,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,12],"s1":1,"o0":0.9},{"n":2,"d":20,"a":"floor","s":"dark-flame","l":[350,550],"z":3,"o":4,"vz":[10,30],"dr":0.6,"s0":[8,14],"s1":[16,26],"o0":0.5}]},"raceBoneBarrage_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":35,"s1":220,"o0":0.7},{"s":"dark-flame","l":400,"z":15,"s0":40,"s1":80,"o0":0.7}]},"racePlaguefield_aura":{"ar":1,"ice":"racePlaguefield_burst","ps":"poison-bubble","pm":500,"ph":120,"pw0":50,"pw1":90,"ph1":160,"po0":0.6},"racePlaguefield_burst":{"L":[{"n":10,"a":"floor","s":"poison-bubble","l":[350,700],"o":12,"vx":100,"vy":100,"vz":[10,40],"g":20,"dr":0.5,"s0":[8,16],"s1":[20,35],"o0":0.6},{"n":6,"d":20,"a":"floor","s":"dark-flame","l":[300,550],"z":3,"o":10,"vz":[5,25],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.4}]},"raceDeathGaze_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":12,"s":"psi-pulse","l":[280,520],"o":8,"vx":170,"vy":170,"vz":[40,160],"g":180,"dr":1.3,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"void-mist","l":[350,600],"z":5,"o":6,"vz":[10,40],"dr":0.6,"s0":[10,18],"s1":[22,36],"o0":0.6}]},"racePsychicBeam_beam":{"cm":260,"bs":"psi-pulse","bt":34,"bhs":"flash","bm":300,"ite":"racePsychicBeam_impact_tile","ls":false,"sk":"normal"},"racePsychicBeam_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":8,"a":"floor","s":"psi-pulse","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":180,"dr":1.3,"s0":[7,12],"s1":1}]},"raceHailMary_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20},{"n":8,"s":"dust-puff","l":[300,550],"o":7,"vx":150,"vy":150,"vz":[30,120],"g":100,"dr":0.8,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":4,"d":10,"a":"floor","s":"debris","l":[250,450],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":450,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceBulletPass_beam":{"cm":200,"bs":"ember","bt":28,"bhs":"flash","bm":240,"ite":"raceBulletPass_impact_tile","ls":false,"sk":"normal"},"raceBulletPass_impact_tile":{"L":[{"a":"floor","s":"flash","l":140,"z":6,"s0":40,"s1":12},{"n":5,"a":"floor","s":"dust-puff","l":[200,400],"z":3,"o":5,"vx":100,"vy":100,"vz":[20,80],"g":80,"dr":0.7,"s0":[8,14],"s1":[18,28],"o0":0.5}]},"raceSpikeTheBall_aoe":{"ar":1,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"racePrecisionShot_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":6,"s":"steel-spark","l":[220,420],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":300,"dr":1.5,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":5,"d":10,"s":"blood-fleck","l":[280,500],"o":4,"vx":100,"vy":100,"vz":[20,90],"g":420,"dr":1.5,"s0":[5,9],"s1":1}]},"raceArrowRain_aoe":{"ar":1,"ite":"raceArrowRain_impact_tile","ice":"raceArrowRain_impact_center","sk":"normal"},"raceArrowRain_impact_tile":{"L":[{"n":3,"a":"floor","s":"steel-spark","l":[200,400],"z":[20,60],"o":6,"vx":30,"vy":30,"vz":[-120,-60],"g":200,"dr":0.8,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":2,"d":40,"a":"floor","s":"dust-puff","l":[350,550],"o":4,"vz":[5,15],"dr":0.5,"s0":[8,14],"s1":[18,28],"o0":0.5}]},"raceArrowRain_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":200,"o0":0.6}]},"raceLumpOfCoal_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"ember","l":[280,500],"o":7,"vx":150,"vy":150,"vz":[30,120],"g":120,"dr":1,"s0":[7,12],"s1":1},{"n":4,"d":10,"a":"floor","s":"debris","l":[300,500],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":500,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceBlizzardPresent_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"sharedSummonBlizzard_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"sentaiRedSlash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":10,"s":"ember","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":120,"dr":1,"s0":[8,14],"s1":1},{"n":4,"d":10,"s":"blood-fleck","l":[300,500],"o":5,"vx":110,"vy":110,"vz":[20,90],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"sentaiBlueWave_beam":{"cm":250,"bs":"wave-1","bt":34,"bhs":"flash","bm":300,"ite":"sentaiBlueWave_impact_tile","ls":false,"sk":"normal"},"sentaiBlueWave_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":8,"a":"floor","s":"wave-1","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":200,"dr":1.3,"s0":[7,12],"s1":1}]},"sentaiYellowThunder_aoe":{"ar":1,"ite":"sentaiYellowThunder_impact_tile","ice":"sentaiYellowThunder_impact_center","sk":"hard"},"sentaiYellowThunder_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":8,"s0":50,"s1":15},{"n":6,"a":"floor","s":"spark-elec","l":[250,450],"z":5,"o":6,"vx":140,"vy":140,"vz":[30,120],"g":240,"dr":1.5,"s0":[7,12],"s1":1}]},"sentaiYellowThunder_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":240,"o0":0.85},{"n":3,"s":"emp-arc","l":[300,500],"z":12,"o":10,"w0":[60,100],"w1":[30,60],"h0":6,"h1":1}]},"sentaiMegazordBlast_aoe":{"ar":2,"ite":"sentaiYellowThunder_impact_tile","ice":"sentaiMegazordBlast_impact_center","sk":"hard"},"sentaiMegazordBlast_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":320,"o0":0.9},{"s":"explosion-orange","l":450,"z":15,"s0":100,"s1":35},{"n":10,"s":"spark-elec","l":[300,550],"z":8,"o":12,"vx":220,"vy":220,"vz":[60,200],"g":200,"dr":1.3,"s0":[8,16],"s1":1}]},"sentaiTeamStrike_impact":{"L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":4,"s":"spark-pink","l":[200,400],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":250,"dr":1.5,"s0":[6,10],"s1":1},{"n":4,"s":"spark-blue","l":[220,420],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":250,"dr":1.5,"s0":[6,10],"s1":1},{"n":3,"d":10,"s":"blood-fleck","l":[280,480],"o":4,"vx":100,"vy":100,"vz":[20,80],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceTendrilStrike_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"inkblot","l":[300,550],"o":8,"vx":160,"vy":160,"vz":[30,130],"g":300,"dr":1.4,"s0":[14,24],"s1":[6,12],"o0":0.9},{"n":4,"d":10,"s":"poison-bubble","l":[350,600],"z":3,"o":5,"vz":[15,40],"g":30,"dr":0.6,"s0":[5,9],"s1":[12,18],"o0":0.7},{"n":4,"d":20,"s":"blood-fleck","l":[280,500],"o":5,"vx":120,"vy":120,"vz":[20,90],"g":420,"dr":1.5,"s0":[5,9],"s1":1}]},"raceSymbioticDrain_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"inkblot","l":[300,600],"o":8,"vx":130,"vy":130,"vz":[20,100],"g":280,"dr":1.4,"s0":[16,28],"s1":[6,12],"o0":0.9},{"n":4,"d":30,"s":"dark-flame","l":[350,580],"z":5,"o":6,"vz":[15,50],"dr":0.7,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":3,"d":50,"s":"heal-glow","l":[500,800],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[5,9],"s1":1,"o0":0.7}]},"raceWebLaunch_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":6,"s":"inkblot","l":[250,500],"o":7,"vx":140,"vy":140,"vz":[30,110],"g":300,"dr":1.5,"s0":[12,22],"s1":[5,10],"o0":0.85},{"n":3,"d":20,"s":"void-mist","l":[350,580],"z":3,"o":5,"vz":[10,30],"dr":0.5,"s0":[10,16],"s1":[22,35],"o0":0.5}]},"raceSymbioteArmor_aura":{"ar":0,"ice":"raceSymbioteArmor_burst","ps":"dark-flame","pm":400,"ph":150,"pw0":45,"pw1":75,"ph1":190,"po0":0.6},"raceSymbioteArmor_burst":{"L":[{"n":8,"s":"inkblot","l":[300,600],"o":8,"vx":120,"vy":120,"vz":[20,80],"g":300,"dr":2,"s0":[16,28],"s1":[8,14],"o0":0.85},{"n":4,"d":20,"s":"void-mist","l":[350,580],"z":5,"o":5,"vz":[10,30],"dr":0.5,"s0":[10,16],"s1":[22,35],"o0":0.5}]},"raceValkyrieSpear_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":10,"s":"divine-sparkle","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":180,"dr":1.2,"s0":[8,14],"s1":1},{"n":5,"d":10,"s":"blood-fleck","l":[300,520],"o":5,"vx":120,"vy":120,"vz":[20,100],"g":420,"dr":1.5,"s0":[5,9],"s1":1},{"s":"holy-pillar","l":500,"z":18,"s0":25,"s1":65,"o0":0.7}]},"raceRealityPulse_aoe":{"ar":1,"ite":"raceRealityPulse_impact_tile","ice":"raceRealityPulse_impact_center","sk":"normal"},"raceRealityPulse_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":6,"a":"floor","s":"psi-pulse","l":[250,450],"z":5,"o":6,"vx":120,"vy":120,"vz":[30,100],"g":160,"dr":1.2,"s0":[7,12],"s1":1},{"n":3,"d":20,"a":"floor","s":"divine-sparkle","l":[350,550],"z":8,"o":5,"vz":[15,40],"dr":0.6,"s0":[5,8],"s1":1,"o0":0.8}]},"raceRealityPulse_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":260,"o0":0.85},{"s":"psi-pulse","l":400,"z":15,"s0":50,"s1":100,"o0":0.8}]},"raceJudgmentBeam_beam":{"cm":320,"bs":"divine-sparkle","bt":42,"bhs":"flash","bm":380,"ite":"raceHolyAvenger_impact_tile","ls":true,"sk":"hard"},"raceGravityBoots_teleport":{"de":"raceGravityBoots_dispersal","ae":"raceGravityBoots_arrival","adm":200},"raceGravityBoots_dispersal":{"L":[{"a":"floor","m":"world","s":"shockwave","l":400,"z":2,"s0":30,"s1":160,"o0":0.9},{"n":14,"s":"laser-pink","l":[300,600],"o":8,"vx":180,"vy":180,"vz":[60,200],"g":-30,"dr":1,"s0":[8,14],"s1":1},{"n":6,"s":"spark-pink","l":[200,450],"z":5,"o":5,"vz":[40,120],"g":-50,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"raceGravityBoots_arrival":{"L":[{"s":"flash","l":250,"s0":100,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":20,"s1":180,"o0":0.85},{"n":10,"a":"floor","s":"laser-pink","l":[250,500],"o":6,"vx":100,"vy":100,"vz":[20,80],"g":200,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBoulderHurl_impact":{"sk":"hard","L":[{"s":"flash","l":180,"s0":80,"s1":20,"o0":0.9},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":12,"s":"rock-debris","l":[300,600],"o":10,"vx":200,"vy":200,"vz":[60,200],"g":500,"dr":1.3,"s0":[10,18],"s1":2},{"n":6,"d":30,"a":"floor","s":"dust-puff","l":[500,900],"o":10,"vz":[15,45],"dr":0.4,"s0":[18,30],"s1":[40,70],"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":70,"s1":110,"o0":0.7}]},"raceStoneSkin_aura":{"ar":0,"ice":"raceStoneSkin_burst"},"raceStoneSkin_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":160,"o0":0.8},{"s":"shield-blue","l":800,"z":8,"s0":60,"s1":110,"o0":0.7},{"n":14,"a":"floor","s":"rock-debris","l":[600,1100],"o":8,"vx":30,"vy":30,"vz":[100,280],"g":-60,"dr":0.6,"s0":[8,14],"s1":[4,8],"o0":0.9},{"n":4,"d":50,"s":"dust-puff","l":[500,800],"o":10,"vz":[10,30],"dr":0.5,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceAvalancheSmash_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":110,"s1":28},{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":240,"o0":0.9},{"n":16,"s":"rock-debris","l":[300,650],"o":12,"vx":220,"vy":220,"vz":[80,240],"g":500,"dr":1.2,"s0":[12,20],"s1":2},{"n":8,"d":40,"a":"floor","s":"dust-puff","l":[600,1100],"o":14,"vz":[20,60],"dr":0.4,"s0":[20,36],"s1":[50,80],"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":140,"o0":0.8}]},"raceNitroBoost_aura":{"ar":0,"ice":"raceNitroBoost_burst"},"raceNitroBoost_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":140,"o0":0.8},{"s":"flash","l":200,"s0":80,"s1":20},{"n":16,"s":"spark-blue","l":[400,800],"o":8,"vx":40,"vy":40,"vz":[100,300],"g":-30,"dr":0.5,"s0":[8,14],"s1":[3,6]},{"n":8,"d":20,"a":"floor","s":"flame","l":[350,650],"o":12,"vx":60,"vy":60,"vz":[-20,-60],"g":0,"dr":0.8,"s0":[10,16],"s1":[20,30],"o0":0.8},{"n":4,"d":40,"a":"floor","s":"smoke","l":[600,1000],"o":10,"vz":[-10,-30],"dr":0.3,"s0":[16,24],"s1":[40,60],"o0":0.4}]},"raceFrostThrone_aura":{"ar":0,"ice":"raceFrostThrone_burst"},"raceFrostThrone_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":200,"o0":0.9},{"s":"flash","l":300,"s0":120,"s1":30},{"n":20,"a":"floor","s":"ice-shard","l":[500,1000],"o":6,"vx":30,"vy":30,"vz":[120,320],"g":-40,"dr":0.5,"s0":[8,16],"s1":[4,8]},{"n":8,"d":40,"s":"frost-mist","l":[700,1200],"o":14,"vz":[10,40],"dr":0.3,"s0":[20,36],"s1":[50,80],"o0":0.6},{"n":6,"d":80,"s":"divine-sparkle","l":[600,1000],"z":10,"o":10,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9}]},"raceThickHide_aura":{"ar":0,"ice":"raceThickHide_burst"},"raceThickHide_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.75},{"s":"shield-blue","l":700,"z":6,"s0":70,"s1":120,"o0":0.65},{"n":10,"a":"floor","s":"rock-debris","l":[500,900],"o":6,"vx":20,"vy":20,"vz":[80,240],"g":-50,"dr":0.5,"s0":[6,12],"s1":[3,6],"o0":0.85},{"n":5,"d":30,"s":"dust-puff","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.45}]},"raceBodyCheck_impact":{"sk":"hard","L":[{"s":"flash","l":180,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":8,"s":"steel-spark","l":[250,480],"o":8,"vx":180,"vy":180,"vz":[40,150],"g":300,"dr":1.5,"s0":[7,13],"s1":1},{"n":5,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,35],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.55}]},"raceRampage_aura":{"ar":0,"ice":"raceRampage_burst"},"raceRampage_burst":{"L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":200,"o0":0.85},{"s":"flash","l":250,"s0":100,"s1":26},{"n":18,"s":"ember","l":[400,900],"o":8,"vx":60,"vy":60,"vz":[100,300],"g":-40,"dr":0.5,"s0":[8,14],"s1":[3,6]},{"n":8,"d":20,"s":"flame","l":[300,600],"o":10,"vx":40,"vy":40,"vz":[60,180],"g":-30,"dr":0.6,"s0":[10,18],"s1":[20,34],"o0":0.8},{"n":6,"d":60,"s":"dark-flame","l":[500,900],"o":6,"vz":[40,120],"g":-20,"dr":0.4,"s0":[12,20],"s1":[24,40],"o0":0.7}]},"raceKiCharge_aura":{"ar":0,"ice":"raceKiCharge_burst"},"raceKiCharge_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":40,"s1":220,"o0":0.9},{"d":150,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":200,"o0":0.7},{"s":"flash","l":350,"s0":130,"s1":34},{"n":22,"a":"floor","s":"holy-light","l":[600,1200],"o":8,"vx":30,"vy":30,"vz":[150,400],"g":-60,"dr":0.4,"s0":[10,18],"s1":[4,8]},{"n":8,"d":20,"a":"floor","s":"dust-puff","l":[500,900],"o":12,"vx":100,"vy":100,"vz":[20,60],"g":60,"dr":0.6,"s0":[14,22],"s1":[30,50],"o0":0.5},{"n":10,"d":40,"s":"ember","l":[400,800],"z":5,"o":6,"vx":50,"vy":50,"vz":[80,240],"g":-40,"dr":0.5,"s0":[6,10],"s1":2,"o0":0.9}]},"raceInstantTransmission_teleport":{"de":"raceInstantTransmission_dispersal","ae":"raceInstantTransmission_arrival","adm":100},"raceInstantTransmission_dispersal":{"L":[{"s":"flash","l":120,"s0":120,"s1":30},{"n":10,"s":"holy-light","l":[150,350],"o":6,"vx":200,"vy":200,"vz":[40,160],"g":0,"dr":2,"s0":[8,14],"s1":1}]},"raceInstantTransmission_arrival":{"L":[{"s":"flash","l":150,"s0":110,"s1":28},{"a":"floor","m":"world","s":"shockwave","l":350,"z":2,"s0":20,"s1":140,"o0":0.8},{"n":12,"s":"holy-light","l":[200,400],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":100,"dr":1.8,"s0":[7,12],"s1":1}]},"raceRoyalDecree_aura":{"ar":2,"ite":"raceRoyalDecree_tile","ice":"raceRoyalDecree_center"},"raceRoyalDecree_tile":{"L":[{"n":6,"s":"divine-sparkle","l":[400,700],"z":5,"o":6,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9}]},"raceRoyalDecree_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":50,"s1":260,"o0":0.9},{"d":120,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":220,"o0":0.7},{"s":"flash","l":300,"s0":120,"s1":30},{"s":"holy-pillar","l":800,"z":20,"s0":30,"s1":80,"o0":0.8},{"n":16,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":160,"vy":160,"vz":[60,200],"g":-30,"dr":0.8,"s0":[8,14],"s1":2}]},"raceKnightsOath_teleport":{"de":"raceKnightsOath_dispersal","ae":"raceKnightsOath_arrival","adm":200},"raceKnightsOath_dispersal":{"L":[{"s":"flash","l":200,"s0":90,"s1":22},{"s":"holy-pillar","l":500,"z":15,"s0":20,"s1":60,"o0":0.8},{"n":10,"s":"divine-sparkle","l":[300,600],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":-20,"dr":1,"s0":[7,12],"s1":1}]},"raceKnightsOath_arrival":{"L":[{"s":"flash","l":220,"s0":100,"s1":26},{"a":"floor","m":"world","s":"halo-ring","l":600,"z":2,"s0":30,"s1":160,"o0":0.85},{"n":12,"s":"divine-sparkle","l":[250,500],"o":5,"vx":100,"vy":100,"vz":[30,100],"g":140,"dr":1.5,"s0":[7,12],"s1":1}]},"raceApeFury_aura":{"ar":0,"ice":"raceApeFury_burst"},"raceApeFury_burst":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":40,"s1":220,"o0":0.85},{"s":"flash","l":280,"s0":110,"s1":28},{"n":16,"s":"ember","l":[500,1000],"o":10,"vx":60,"vy":60,"vz":[120,340],"g":-50,"dr":0.4,"s0":[9,16],"s1":[4,7]},{"n":6,"d":30,"s":"flame","l":[400,700],"o":12,"vx":40,"vy":40,"vz":[80,200],"g":-30,"dr":0.5,"s0":[12,20],"s1":[22,36],"o0":0.75},{"n":6,"d":20,"a":"floor","s":"dust-puff","l":[500,900],"o":12,"vx":100,"vy":100,"vz":[20,50],"g":60,"dr":0.6,"s0":[16,26],"s1":[35,55],"o0":0.5}]},"raceHornToss_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":170,"o0":0.8},{"n":6,"s":"blood-fleck","l":[250,500],"o":6,"vx":160,"vy":160,"vz":[60,180],"g":400,"dr":1.5,"s0":[7,13],"s1":1},{"n":4,"s":"steel-spark","l":[200,400],"o":5,"vx":180,"vy":180,"vz":[40,140],"g":300,"dr":1.6,"s0":[6,10],"s1":1},{"n":4,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,35],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.5}]},"raceCurseOfDecay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18,"o0":0.8},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":160,"o0":0.7},{"n":14,"s":"void-mist","l":[400,800],"o":8,"vx":80,"vy":80,"vz":[30,100],"g":-20,"dr":0.4,"s0":[12,22],"s1":[30,50],"o0":0.7},{"n":8,"d":20,"s":"poison-bubble","l":[350,650],"o":6,"vx":100,"vy":100,"vz":[40,140],"g":-30,"dr":0.8,"s0":[6,12],"s1":2,"o0":0.9}]},"raceDeathPact_aura":{"ar":0,"ice":"raceDeathPact_burst"},"raceDeathPact_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.8},{"s":"flash","l":250,"s0":90,"s1":22,"o0":0.8},{"n":14,"s":"dark-flame","l":[500,1000],"o":8,"vx":40,"vy":40,"vz":[100,280],"g":-50,"dr":0.4,"s0":[10,18],"s1":[4,8],"o0":0.9},{"n":8,"d":30,"s":"void-mist","l":[600,1100],"o":12,"vz":[20,60],"dr":0.3,"s0":[18,30],"s1":[40,65],"o0":0.6},{"n":6,"d":60,"a":"floor","s":"blood-fleck","l":[300,600],"o":6,"vx":40,"vy":40,"vz":[60,160],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceDarkResurrection_aura":{"ar":0,"ice":"raceDarkResurrection_burst"},"raceDarkResurrection_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"flash","l":300,"s0":110,"s1":28,"o0":0.9},{"s":"holy-pillar","l":900,"z":20,"s0":28,"s1":70,"o0":0.7},{"n":18,"a":"floor","s":"dark-flame","l":[600,1200],"o":8,"vx":30,"vy":30,"vz":[120,350],"g":-60,"dr":0.4,"s0":[10,18],"s1":[4,8],"o0":0.9},{"n":8,"d":40,"s":"void-mist","l":[700,1200],"o":14,"vz":[20,60],"dr":0.3,"s0":[20,34],"s1":[45,70],"o0":0.6},{"n":6,"d":80,"s":"blood-fleck","l":[400,800],"o":5,"vx":40,"vy":40,"vz":[60,180],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.85}]},"raceOmniVision_aura":{"ar":0,"ice":"raceOmniVision_burst"},"raceOmniVision_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"psi-pulse","l":500,"z":10,"s0":60,"s1":130,"o0":0.8},{"n":12,"s":"psi-pulse","l":[400,800],"o":6,"vx":80,"vy":80,"vz":[40,140],"g":-30,"dr":0.6,"s0":[8,14],"s1":2,"o0":0.9},{"n":6,"d":40,"s":"divine-sparkle","l":[500,900],"z":8,"o":10,"vx":60,"vy":60,"vz":[30,100],"g":-20,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"racePupilShield_aura":{"ar":0,"ice":"racePupilShield_burst"},"racePupilShield_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.8},{"s":"shield-blue","l":900,"z":8,"s0":60,"s1":120,"o0":0.75},{"s":"psi-pulse","l":600,"z":12,"s0":50,"s1":100,"o0":0.7},{"n":10,"d":20,"s":"psi-pulse","l":[400,700],"o":6,"vx":50,"vy":50,"vz":[30,100],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.8}]},"raceBlitz_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":90,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":200,"o0":0.85},{"n":8,"s":"steel-spark","l":[250,500],"o":8,"vx":200,"vy":200,"vz":[50,170],"g":350,"dr":1.5,"s0":[8,14],"s1":1},{"n":6,"d":10,"s":"dust-puff","l":[400,700],"o":8,"vz":[15,40],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.55}]},"raceAudible_aura":{"ar":2,"ite":"raceAudible_tile","ice":"raceAudible_center"},"raceAudible_tile":{"L":[{"n":4,"s":"sparkle","l":[300,600],"z":5,"o":6,"vx":60,"vy":60,"vz":[30,100],"g":-20,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceAudible_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":30,"s1":260,"o0":0.8},{"s":"flash","l":250,"s0":100,"s1":26},{"n":14,"s":"sparkle","l":[400,800],"o":8,"vx":100,"vy":100,"vz":[60,180],"g":-30,"dr":0.6,"s0":[7,12],"s1":2}]},"raceEndZoneDance_aura":{"ar":0,"ice":"raceEndZoneDance_burst"},"raceEndZoneDance_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":180,"o0":0.8},{"s":"flash","l":250,"s0":90,"s1":22},{"n":16,"s":"sparkle","l":[400,900],"o":10,"vx":120,"vy":120,"vz":[80,250],"g":-20,"dr":0.5,"s0":[6,12],"s1":2},{"n":6,"d":40,"s":"holy-light","l":[500,800],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,120],"g":-15,"dr":0.6,"s0":[8,14],"s1":[3,6],"o0":0.85}]},"raceStealFromRich_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":70,"s1":18},{"n":6,"s":"steel-spark","l":[200,400],"o":6,"vx":160,"vy":160,"vz":[40,140],"g":300,"dr":1.5,"s0":[6,11],"s1":1},{"n":8,"d":10,"s":"divine-sparkle","l":[300,600],"z":5,"o":6,"vx":120,"vy":120,"vz":[40,140],"g":160,"dr":1.2,"s0":[6,10],"s1":1,"o0":0.9},{"n":3,"d":10,"s":"blood-fleck","l":[250,450],"o":4,"vx":100,"vy":100,"vz":[20,80],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceForestAmbush_aura":{"ar":0,"ice":"raceForestAmbush_burst"},"raceForestAmbush_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":140,"o0":0.7},{"n":12,"a":"floor","s":"vine-green","l":[500,1000],"o":8,"vx":40,"vy":40,"vz":[80,240],"g":-30,"dr":0.5,"s0":[8,14],"s1":[3,6],"o0":0.85},{"n":6,"d":30,"s":"dust-puff","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.4},{"n":4,"d":50,"s":"sparkle","l":[600,900],"z":8,"o":6,"vz":[20,60],"g":-15,"dr":0.6,"s0":[5,8],"s1":1,"o0":0.8}]},"raceGiftOfHealing_aura":{"ar":0,"ice":"raceGiftOfHealing_burst"},"raceGiftOfHealing_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":600,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":20,"s1":50,"o0":0.85},{"n":14,"s":"sparkle","l":[500,1000],"o":10,"vx":80,"vy":80,"vz":[60,200],"g":-30,"dr":0.5,"s0":[6,12],"s1":2},{"n":6,"d":40,"s":"divine-sparkle","l":[400,700],"z":8,"o":8,"vz":[30,100],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceNaughtyList_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20,"o0":0.9},{"n":12,"s":"dark-flame","l":[300,600],"o":8,"vx":140,"vy":140,"vz":[40,150],"g":160,"dr":1.2,"s0":[8,14],"s1":2,"o0":0.9},{"n":6,"d":10,"s":"ember","l":[250,500],"z":5,"o":5,"vx":100,"vy":100,"vz":[30,100],"g":60,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.85},{"n":4,"d":20,"s":"void-mist","l":[500,800],"o":6,"vz":[15,40],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceChristmasSpirit_aura":{"ar":0,"ice":"raceChristmasSpirit_burst"},"raceChristmasSpirit_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":60,"s1":280,"o0":0.9},{"s":"heal-glow","l":700,"z":6,"s0":120,"s1":50,"o0":0.85},{"n":20,"s":"sparkle","l":[500,1200],"o":14,"vx":120,"vy":120,"vz":[60,250],"g":-25,"dr":0.4,"s0":[7,14],"s1":2},{"n":8,"d":40,"s":"divine-sparkle","l":[600,1000],"z":10,"o":10,"vx":80,"vy":80,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.9}]},"raceSleighDash_teleport":{"de":"raceSleighDash_dispersal","ae":"raceSleighDash_arrival","adm":200},"raceSleighDash_dispersal":{"L":[{"s":"flash","l":180,"s0":90,"s1":22},{"n":12,"s":"sparkle","l":[300,600],"o":8,"vx":160,"vy":160,"vz":[60,200],"g":-20,"dr":0.8,"s0":[7,12],"s1":1},{"n":4,"d":10,"a":"floor","s":"frost-mist","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceSleighDash_arrival":{"L":[{"s":"flash","l":200,"s0":100,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":450,"z":2,"s0":20,"s1":160,"o0":0.8},{"n":14,"s":"sparkle","l":[250,550],"o":6,"vx":120,"vy":120,"vz":[30,120],"g":100,"dr":1.2,"s0":[7,12],"s1":1},{"n":4,"d":20,"a":"floor","s":"frost-mist","l":[350,600],"o":8,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.45}]},"raceChooserOfSlain_aura":{"ar":0,"ice":"raceChooserOfSlain_burst"},"raceChooserOfSlain_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"flash","l":320,"s0":120,"s1":30},{"s":"holy-pillar","l":800,"z":20,"s0":30,"s1":80,"o0":0.85},{"n":16,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":100,"vy":100,"vz":[80,260],"g":-40,"dr":0.5,"s0":[8,14],"s1":2},{"n":8,"d":60,"s":"holy-light","l":[700,1200],"z":8,"o":8,"vz":[60,180],"g":-30,"dr":0.4,"s0":[6,12],"s1":[3,6],"o0":0.9}]},"raceShieldMaiden_aura":{"ar":0,"ice":"raceShieldMaiden_burst"},"raceShieldMaiden_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":170,"o0":0.85},{"s":"shield-blue","l":900,"z":8,"s0":60,"s1":120,"o0":0.8},{"s":"flash","l":200,"s0":80,"s1":20,"o0":0.9},{"n":12,"s":"divine-sparkle","l":[400,800],"o":6,"vx":60,"vy":60,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"raceNordicWarcry_aura":{"ar":2,"ite":"raceNordicWarcry_tile","ice":"raceNordicWarcry_center"},"raceNordicWarcry_tile":{"L":[{"n":5,"s":"divine-sparkle","l":[400,700],"z":5,"o":5,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceNordicWarcry_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":30,"s1":260,"o0":0.85},{"d":130,"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":220,"o0":0.65},{"s":"flash","l":280,"s0":110,"s1":28},{"n":14,"s":"divine-sparkle","l":[400,800],"o":10,"vx":140,"vy":140,"vz":[60,200],"g":-30,"dr":0.7,"s0":[7,12],"s1":2}]},"raceCosmicSight_aura":{"ar":0,"ice":"raceCosmicSight_burst"},"raceCosmicSight_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"psi-pulse","l":600,"z":12,"s0":60,"s1":140,"o0":0.8},{"d":120,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":200,"o0":0.65},{"n":14,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":80,"vy":80,"vz":[60,200],"g":-30,"dr":0.5,"s0":[8,14],"s1":2},{"n":8,"d":40,"s":"psi-pulse","l":[400,800],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85}]},"raceTemporalShift_teleport":{"de":"raceTemporalShift_dispersal","ae":"raceTemporalShift_arrival","adm":250},"raceTemporalShift_dispersal":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":600,"z":2,"s0":60,"s1":200,"o0":0.9},{"s":"psi-pulse","l":400,"z":10,"s0":80,"s1":160,"o0":0.8},{"n":12,"s":"divine-sparkle","l":[350,700],"o":8,"vx":120,"vy":120,"vz":[50,180],"g":0,"dr":1,"s0":[8,14],"s1":1},{"n":6,"d":20,"s":"void-mist","l":[500,900],"o":10,"vz":[20,50],"dr":0.3,"s0":[16,26],"s1":[35,55],"o0":0.5}]},"raceTemporalShift_arrival":{"L":[{"s":"flash","l":250,"s0":110,"s1":28},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":180,"o0":0.85},{"s":"psi-pulse","l":500,"z":10,"s0":50,"s1":110,"o0":0.8},{"n":14,"s":"divine-sparkle","l":[300,600],"o":6,"vx":100,"vy":100,"vz":[30,120],"g":100,"dr":1.2,"s0":[7,12],"s1":1}]},"raceAstralBarrier_aura":{"ar":0,"ice":"raceAstralBarrier_burst"},"raceAstralBarrier_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"shield-blue","l":1000,"z":8,"s0":60,"s1":130,"o0":0.8},{"s":"psi-pulse","l":700,"z":12,"s0":50,"s1":110,"o0":0.7},{"n":10,"d":20,"s":"divine-sparkle","l":[500,900],"o":8,"vx":60,"vy":60,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"sentaiBlackGuard_aura":{"ar":0,"ice":"sentaiBlackGuard_burst"},"sentaiBlackGuard_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"flash","l":250,"s0":90,"s1":24,"o0":0.9},{"s":"shield-blue","l":800,"z":8,"s0":60,"s1":120,"o0":0.75},{"n":14,"s":"steel-spark","l":[500,900],"o":8,"vx":40,"vy":40,"vz":[80,240],"g":-40,"dr":0.5,"s0":[7,12],"s1":[3,6],"o0":0.9},{"n":6,"d":40,"s":"void-mist","l":[600,1000],"o":10,"vz":[15,45],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"sentaiPinkHeal_aura":{"ar":0,"ice":"sentaiPinkHeal_burst"},"sentaiPinkHeal_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":600,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":20,"s1":50,"o0":0.85},{"n":16,"s":"spark-pink","l":[500,1000],"o":10,"vx":100,"vy":100,"vz":[60,200],"g":-25,"dr":0.5,"s0":[7,13],"s1":2},{"n":8,"d":40,"s":"divine-sparkle","l":[400,800],"z":8,"o":8,"vz":[40,120],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"sentaiGreenArrow_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":20},{"n":14,"s":"vine-green","l":[280,520],"o":8,"vx":180,"vy":180,"vz":[40,180],"g":140,"dr":1,"s0":[8,15],"s1":1},{"n":8,"d":20,"s":"sparkle","l":[300,600],"o":5,"vx":100,"vy":100,"vz":[20,100],"g":80,"dr":0.8,"s0":[5,10],"s1":1,"o0":0.9}]},"sentaiTeamStrike_impact_v2":{"L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":3,"s":"ember","l":[200,400],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-blue","l":[220,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"vine-green","l":[200,400],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-elec","l":[200,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-pink","l":[220,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1}]},"sentaiMegazordBlast_impact_center_v2":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":340,"o0":0.9},{"s":"explosion-orange","l":500,"z":15,"s0":110,"s1":40},{"n":4,"s":"ember","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-blue","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"vine-green","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-elec","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-pink","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1}]},"sharedGlacialTomb_descent":{"dsm":600,"tm":300,"ts":"target-ring-blue","tsz":100,"L":[{"s":"frost-crystal","l":400,"s0":50,"s1":70,"o1":0.7},{"n":6,"s":"frost-mist","l":[300,500],"o":5,"vx":40,"vy":40,"vz":[15,60],"g":-30,"dr":0.4,"s0":[10,18],"s1":[25,40],"o0":0.6}],"ie":"sharedGlacialTomb_impact"},"sharedGlacialTomb_impact":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":5,"s0":80,"s1":20},{"n":12,"a":"floor","s":"frost-crystal","l":[250,500],"z":5,"o":6,"vx":180,"vy":180,"vz":[40,180],"g":200,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":30,"a":"floor","s":"frost-mist","l":[400,700],"z":3,"o":8,"vx":60,"vy":60,"vz":[10,40],"g":-15,"dr":0.3,"s0":[16,28],"s1":[35,55],"o0":0.5},{"a":"floor","m":"world","s":"halo-ring","l":600,"z":1,"s0":30,"s1":160,"o0":0.7}]},"raceGiftOfHealing_aura_v2":{"ar":0,"ice":"raceGiftOfHealing_burst_v2"},"raceGiftOfHealing_burst_v2":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":700,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":22,"s1":50,"o0":0.85},{"n":16,"s":"frost-crystal","l":[600,1200],"z":20,"o":14,"vx":50,"vy":50,"vz":[-30,-80],"g":30,"dr":0.3,"s0":[5,10],"s1":[3,6],"o0":0.9},{"n":8,"d":40,"s":"divine-sparkle","l":[400,800],"z":8,"o":8,"vz":[40,120],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceChristmasSpirit_aura_v2":{"ar":0,"ice":"raceChristmasSpirit_burst_v2"},"raceChristmasSpirit_burst_v2":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":60,"s1":250,"o0":0.9},{"s":"heal-glow","l":800,"z":8,"s0":120,"s1":50,"o0":0.85},{"s":"heal-cross","l":800,"z":20,"s0":28,"s1":60,"o0":0.9},{"n":24,"s":"frost-crystal","l":[700,1400],"z":25,"o":20,"vx":80,"vy":80,"vz":[-40,-100],"g":25,"dr":0.25,"s0":[6,12],"s1":[3,7],"o0":0.9},{"n":12,"d":30,"s":"divine-sparkle","l":[500,1000],"z":10,"o":12,"vz":[50,150],"g":-20,"dr":0.5,"s0":[5,10],"s1":1,"o0":0.9}]},"raceSleighDash_teleport_v2":{"de":"_sleighDash_dispersal","ae":"_sleighDash_arrival","adm":220},"_sleighDash_dispersal":{"L":[{"s":"flash","l":200,"s0":70,"s1":20},{"n":14,"s":"frost-crystal","l":[300,600],"z":5,"o":6,"vx":160,"vy":160,"vz":[40,160],"g":100,"dr":0.8,"s0":[6,12],"s1":1},{"n":4,"s":"frost-mist","l":[300,500],"o":8,"vz":[10,40],"dr":0.3,"s0":[14,24],"s1":[30,50],"o0":0.5}]},"_sleighDash_arrival":{"L":[{"s":"flash","l":180,"s0":60,"s1":16},{"n":12,"s":"frost-crystal","l":[400,800],"z":8,"o":10,"vx":40,"vy":40,"vz":[-20,-60],"g":30,"dr":0.4,"s0":[6,11],"s1":[3,6],"o0":0.9},{"n":4,"d":40,"s":"frost-mist","l":[400,700],"o":6,"vz":[5,20],"dr":0.3,"s0":[12,20],"s1":[25,45],"o0":0.4}]},"raceBlizzardPresent_aoe_v2":{"ar":1,"ite":"raceBlizzardPresent_impact_tile_v2","ice":"raceBlizzardPresent_impact_center","sk":"normal"},"raceBlizzardPresent_impact_tile_v2":{"L":[{"a":"floor","s":"flash","l":150,"z":5,"s0":45,"s1":12},{"n":8,"a":"floor","s":"frost-crystal","l":[250,500],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,140],"g":150,"dr":1,"s0":[6,12],"s1":1},{"n":3,"d":20,"a":"floor","s":"frost-mist","l":[350,600],"z":2,"o":5,"vz":[10,30],"dr":0.3,"s0":[14,22],"s1":[30,50],"o0":0.4}]},"raceBlizzardPresent_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":200,"o0":0.7},{"n":10,"s":"frost-crystal","l":[400,800],"z":15,"o":12,"vx":60,"vy":60,"vz":[-30,-80],"g":25,"dr":0.3,"s0":[8,14],"s1":[4,8],"o0":0.9}]},"raceLumpOfCoal_impact_v2":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18},{"n":10,"s":"dark-flame","l":[280,500],"o":7,"vx":150,"vy":150,"vz":[40,160],"g":120,"dr":1,"s0":[9,15],"s1":2},{"n":6,"s":"rock-debris","l":[300,550],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":400,"dr":1.5,"s0":[7,12],"s1":1},{"n":3,"d":20,"s":"scorch","l":[400,650],"o":6,"vz":[15,50],"dr":0.5,"s0":[14,22],"s1":[28,45],"o0":0.4}]},"raceNaughtyList_impact_v2":{"sk":"soft","L":[{"s":"flash","l":180,"s0":60,"s1":16,"o0":0.8},{"n":8,"s":"dark-flame","l":[300,550],"o":6,"vx":80,"vy":80,"vz":[40,140],"g":-20,"dr":0.5,"s0":[8,14],"s1":[16,28],"o0":0.6},{"n":4,"d":10,"s":"rock-debris","l":[250,450],"o":5,"vx":100,"vy":100,"vz":[20,80],"g":350,"dr":1.5,"s0":[5,9],"s1":1,"o0":0.9}]},"_dark_shadow_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18,"o0":0.9},{"n":10,"s":"dark-flame","l":[300,600],"o":7,"vx":100,"vy":100,"vz":[50,180],"g":-30,"dr":0.5,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":5,"d":30,"s":"void-mist","l":[400,750],"o":8,"vx":40,"vy":40,"vz":[20,60],"g":-15,"dr":0.3,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"_dark_debuff_impact":{"sk":"soft","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.7},{"n":8,"s":"void-mist","l":[400,800],"o":6,"vx":40,"vy":40,"vz":[30,100],"g":-20,"dr":0.4,"s0":[10,18],"s1":[22,38],"o0":0.5},{"n":6,"d":20,"s":"dark-flame","l":[350,650],"o":5,"vx":60,"vy":60,"vz":[40,120],"g":-25,"dr":0.5,"s0":[8,14],"s1":[14,24],"o0":0.6}]},"_buff_dark_aura":{"ar":0,"ice":"_buff_dark_burst"},"_buff_dark_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":160,"o0":0.7},{"m":"y-locked","s":"buff-aura","l":900,"w0":30,"w1":50,"h0":100,"h1":160,"o0":0.7},{"n":10,"a":"floor","s":"dark-flame","l":[500,900],"o":8,"vx":30,"vy":30,"vz":[80,220],"g":-25,"dr":0.4,"s0":[10,18],"s1":[18,30],"o0":0.6},{"n":6,"d":40,"s":"void-mist","l":[600,1000],"o":10,"vz":[15,50],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.45}]},"_rangedShot_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":10,"s":"steel-spark","l":[200,400],"o":5,"vx":180,"vy":180,"vz":[30,140],"g":300,"dr":1.5,"s0":[5,10],"s1":1},{"n":3,"d":10,"s":"dust-puff","l":[300,500],"o":4,"vx":50,"vy":50,"vz":[10,40],"g":50,"dr":0.5,"s0":[10,16],"s1":[20,35],"o0":0.5}]},"raceBoneToss_impact_v2":{"sk":"normal","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.9},{"n":8,"s":"debris","l":[200,400],"o":5,"vx":170,"vy":170,"vz":[30,140],"g":350,"dr":1.5,"s0":[6,11],"s1":1},{"n":4,"d":15,"s":"void-mist","l":[300,550],"o":5,"vz":[15,50],"dr":0.5,"s0":[10,16],"s1":[22,36],"o0":0.35}]},"raceKiBlast_impact_v2":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":12,"s":"ember","l":[250,480],"o":7,"vx":180,"vy":180,"vz":[40,180],"g":100,"dr":0.8,"s0":[8,14],"s1":1},{"n":4,"d":10,"s":"fire-glow","l":[300,550],"o":5,"vx":60,"vy":60,"vz":[20,60],"g":-20,"dr":0.4,"s0":[12,20],"s1":[24,40],"o0":0.5}]},"raceHexOfAgony_impact":{"sk":"soft","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.7},{"n":6,"s":"poison-bubble","l":[350,650],"o":6,"vx":50,"vy":50,"vz":[40,120],"g":-15,"dr":0.4,"s0":[6,12],"s1":[10,18],"o0":0.7},{"n":6,"d":20,"s":"dark-flame","l":[400,700],"o":5,"vx":40,"vy":40,"vz":[30,100],"g":-20,"dr":0.5,"s0":[8,14],"s1":[16,28],"o0":0.5},{"n":4,"d":30,"s":"void-mist","l":[450,800],"o":8,"vz":[10,40],"dr":0.3,"s0":[14,22],"s1":[28,48],"o0":0.4}]},"_psychic_dark_impact":{"sk":"soft","L":[{"s":"psi-pulse","l":300,"s0":70,"s1":120,"o0":0.6},{"n":8,"s":"void-mist","l":[400,800],"o":8,"vx":30,"vy":30,"vz":[20,70],"g":-15,"dr":0.3,"s0":[12,20],"s1":[25,42],"o0":0.45},{"n":5,"d":20,"s":"spark-pink","l":[300,550],"o":5,"vx":80,"vy":80,"vz":[30,100],"g":-20,"dr":0.5,"s0":[6,10],"s1":1,"o0":0.8}]},"raceShadowBind_impact":{"sk":"soft","L":[{"a":"floor","m":"world","s":"halo-ring","l":500,"z":1,"s0":20,"s1":120,"o0":0.6},{"n":10,"a":"floor","s":"void-mist","l":[500,900],"z":-5,"o":8,"vx":20,"vy":20,"vz":[50,150],"g":-30,"dr":0.4,"s0":[8,14],"s1":[18,30],"o0":0.55},{"n":6,"d":30,"s":"dark-flame","l":[400,700],"o":5,"vx":40,"vy":40,"vz":[20,80],"g":-20,"dr":0.5,"s0":[7,12],"s1":[14,22],"o0":0.5}]},"_dark_mark_impact":{"sk":"soft","L":[{"a":"floor","m":"world","s":"halo-ring","l":600,"z":1,"s0":25,"s1":110,"o0":0.7},{"n":8,"s":"dark-flame","l":[350,650],"o":6,"vx":50,"vy":50,"vz":[40,130],"g":-25,"dr":0.5,"s0":[8,14],"s1":[16,26],"o0":0.6},{"n":4,"d":30,"s":"void-mist","l":[450,750],"o":7,"vz":[10,40],"dr":0.3,"s0":[12,20],"s1":[26,44],"o0":0.4}]},"_eldritch_gaze_impact":{"sk":"soft","L":[{"s":"flash","l":250,"z":10,"s0":50,"s1":12,"o0":0.8},{"n":8,"s":"void-mist","l":[400,800],"o":8,"vx":30,"vy":30,"vz":[15,55],"g":-10,"dr":0.3,"s0":[12,20],"s1":[25,42],"o0":0.45},{"n":5,"d":20,"s":"dark-flame","l":[350,600],"o":5,"vx":50,"vy":50,"vz":[30,100],"g":-20,"dr":0.5,"s0":[7,12],"s1":[14,22],"o0":0.55}]}},"S":{"fire1":{"impact":"fire1_impact"},"fire2":{"impact":"fire2_impact"},"wallOfFire":{"wall":"wallOfFire_tile"},"meteor":{"descent":"meteor_descent","impact":"meteor_impact_tile"},"radiantBolt":{"descent":"radiantBolt_descent","impact":"radiantBolt_impact"},"judgment":{"descent":"judgment_descent","impact":"judgment_impact_tile"},"nuke":{"descent":"nuke_descent","impact":"nuke_impact_tile"},"empBurst":{"descent":"empBurst_descent","impact":"empBurst_impact_tile"},"raceCosmicSlam":{"descent":"raceCosmicSlam_descent","impact":"raceCosmicSlam_impact_tile"},"raceInfernalDecree":{"descent":"raceInfernalDecree_descent","impact":"raceInfernalDecree_impact_tile"},"divineIntervention":{"descent":"divineIntervention_descent","impact":"divineIntervention_impact"},"raceStarDecree":{"descent":"raceStarDecree_descent","impact":"raceStarDecree_impact_tile"},"thunder1":{"descent":"thunder1_descent","impact":"thunder1_impact","chain":"thunder1_chain_hop"},"raceDivineJudgment":{"descent":"raceDivineJudgment_descent","impact":"judgment_impact_tile"},"raceSolarCorona":{"descent":"raceSolarCorona_descent","impact":"judgment_impact_tile"},"electroDart":{"impact":"electroDart_impact"},"taser":{"impact":"taser_impact"},"knifeThrow":{"impact":"knifeThrow_impact"},"shoot":{"impact":"shoot_impact"},"doubleShot":{"impact":"doubleShot_impact"},"headshot":{"impact":"headshot_impact"},"precisionShot":{"impact":"precisionShot_impact"},"deadEye":{"impact":"deadEye_impact"},"kneecapShot":{"impact":"kneecapShot_impact"},"shieldBash":{"impact":"shieldBash_impact"},"dragonSlash":{"impact":"dragonSlash_impact"},"guardSlash":{"impact":"guardSlash_impact"},"sneakSlash":{"impact":"sneakSlash_impact"},"improvise":{"impact":"improvise_impact"},"reallyGoodPunch":{"impact":"reallyGoodPunch_impact"},"cannonBlast":{"impact":"cannonBlast_impact"},"anchorToss":{"impact":"anchorToss_impact"},"boardingRush":{"impact":"boardingRush_impact"},"psychosis":{"impact":"psychosis_impact"},"mindShatter":{"impact":"mindShatter_impact"},"kineticHurl":{"impact":"kineticHurl_impact"},"exorcism":{"impact":"exorcism_impact"},"ricochet1":{"impact":"ricochet1_impact"},"lifeDrain":{"impact":"lifeDrain_impact","drainHop":"lifeDrain_drainHop"},"raceDemonicClaw":{"impact":"raceDemonicClaw_impact"},"raceSmite":{"impact":"raceSmite_impact"},"racePounce":{"impact":"racePounce_impact"},"raceNinefoldScratch":{"impact":"raceNinefoldScratch_impact"},"raceLastStand":{"impact":"raceLastStand_impact"},"raceHeroicLeap":{"impact":"raceHeroicLeap_impact"},"raceTailWhip":{"impact":"raceTailWhip_impact"},"raceBorrowedClaw":{"impact":"raceBorrowedClaw_impact"},"raceInfectiousBite":{"impact":"raceInfectiousBite_impact"},"raceWeighTheHeart":{"impact":"raceWeighTheHeart_impact"},"raceBoneToss":{"impact":"raceBoneToss_impact_v2"},"raceGoreCharge":{"impact":"raceGoreCharge_impact"},"raceVoidContract":{"impact":"raceVoidContract_impact","drainHop":"lifeDrain_drainHop"},"raceSoulSuck":{"impact":"raceSoulSuck_impact","drainHop":"lifeDrain_drainHop"},"raceLifetap":{"impact":"raceLifetap_impact","drainHop":"lifeDrain_drainHop"},"raceMandibleStrike":{"impact":"raceMandibleStrike_impact"},"raceDreamSiphon":{"impact":"raceDreamSiphon_impact","drainHop":"dreamSiphon_drainHop"},"raceVenomFang":{"impact":"raceVenomFang_impact"},"racePrismBurst":{"impact":"racePrismBurst_impact"},"raceDivineSmite":{"impact":"raceDivineSmite_impact"},"raceCrashLoop":{"impact":"raceCrashLoop_impact"},"plasmaGun":{"beam":"plasmaGun_beam","impact":"plasmaGun_impact_tile"},"raceHellmouth":{"beam":"raceHellmouth_beam","impact":"raceHellmouth_impact_tile"},"raceFormicAcid":{"beam":"raceFormicAcid_beam","impact":"raceFormicAcid_impact_tile"},"raceSonicBreaker":{"beam":"raceSonicBreaker_beam","impact":"raceSonicBreaker_impact_tile"},"raceHeatRay":{"beam":"raceHeatRay_beam","impact":"raceHeatRay_impact_tile"},"raceBalefulGaze":{"beam":"raceBalefulGaze_beam","impact":"raceBalefulGaze_impact_tile"},"raceEntropicBeam":{"beam":"raceEntropicBeam_beam","impact":"raceEntropicBeam_impact_tile"},"raceLaserBeam":{"beam":"raceLaserBeam_beam","impact":"raceLaserBeam_impact_tile"},"broadside":{"aoe":"broadside_aoe","impact":"broadside_impact_tile"},"raceChassisSlan":{"aoe":"raceChassisSlan_aoe","impact":"raceChassisSlan_impact_tile"},"raceEMPGrenade":{"aoe":"raceEMPGrenade_aoe","impact":"raceEMPGrenade_impact_tile"},"raceMortarSalvo":{"aoe":"raceMortarSalvo_aoe","impact":"raceMortarSalvo_impact_tile"},"overgrowth":{"aoe":"overgrowth_aoe","impact":"overgrowth_impact_tile"},"raceEarthshaker":{"aoe":"raceEarthshaker_aoe","impact":"raceEarthshaker_impact_tile"},"raceGlitterburst":{"aoe":"raceGlitterburst_aoe","impact":"raceGlitterburst_impact_tile"},"raceSignalPulse":{"aoe":"raceSignalPulse_aoe","impact":"raceSignalPulse_impact_tile"},"raceTremorStomp":{"aoe":"raceTremorStomp_aoe","impact":"raceTremorStomp_impact_tile"},"raceBatSwarm":{"aoe":"raceBatSwarm_aoe","impact":"raceBatSwarm_impact_tile"},"raceDarkDominion":{"aoe":"raceDarkDominion_aoe","impact":"raceDarkDominion_impact_tile"},"raceDarkLullaby":{"aoe":"raceDarkLullaby_aoe","impact":"raceDarkLullaby_impact_tile"},"raceDemonicRoar":{"aoe":"raceDemonicRoar_aoe","impact":"raceDemonicRoar_impact_tile"},"raceNightmarePulse":{"aoe":"raceNightmarePulse_aoe","impact":"raceNightmarePulse_impact_tile"},"raceWebSnare":{"aoe":"raceWebSnare_aoe","impact":"raceWebSnare_impact_tile","webOverlay":"raceWebSnare_webOverlay"},"raceTitanStep":{"aoe":"raceTitanStep_aoe","impact":"raceTitanStep_impact_tile"},"raceDustDevil":{"aoe":"raceDustDevil_aoe","impact":"raceDustDevil_impact_tile"},"raceGravityWell":{"aoe":"raceGravityWell_aoe","impact":"raceGravityWell_impact_tile"},"raceWhirlpool":{"aoe":"raceWhirlpool_aoe","impact":"raceWhirlpool_impact_tile"},"heal1":{"aura":"heal1_aura"},"cleanse":{"aura":"cleanse_aura"},"revive1":{"aura":"revive1_aura"},"fortify":{"aura":"fortify_aura"},"healingSeed":{"aura":"healingSeed_aura"},"protect1":{"aura":"protect1_aura"},"overclock":{"aura":"overclock_aura"},"raceWishGranted":{"aura":"raceWishGranted_aura"},"racePerchForm":{"aura":"racePerchForm_aura"},"camouflage":{"aura":"camouflage_aura"},"steadyAim":{"aura":"steadyAim_aura"},"jackOfAll":{"aura":"jackOfAll_aura"},"raceIronBulwark":{"aura":"raceIronBulwark_aura"},"raceBlackBudget":{"aura":"raceBlackBudget_aura"},"raceOverclock":{"aura":"raceOverclock_aura"},"raceOvercalculate":{"aura":"raceOvercalculate_aura"},"raceSiegeMode":{"aura":"raceSiegeMode_aura"},"raceIronGuard":{"aura":"raceIronGuard_aura"},"raceChitinArmor":{"aura":"raceChitinArmor_aura"},"raceTimeSurge":{"aura":"raceTimeSurge_aura"},"raceAbyssalWings":{"aura":"raceAbyssalWings_aura"},"raceHellfireCrown":{"aura":"raceHellfireCrown_aura"},"racePhaseShift":{"aura":"racePhaseShift_aura"},"raceBloodRitual":{"aura":"raceBloodRitual_aura"},"raceWildResilience":{"aura":"raceWildResilience_aura"},"raceAdrenalineRush":{"aura":"raceAdrenalineRush_aura"},"healAll":{"aura":"healAll_aura"},"raceAbsolution":{"aura":"raceAbsolution_aura"},"raceTidalBlessing":{"aura":"raceTidalBlessing_aura"},"raceSanctuary":{"aura":"raceSanctuary_aura"},"bubble":{"aura":"bubble_aura"},"raceRunicWard":{"aura":"raceRunicWard_aura"},"raceHolyBulwark":{"aura":"raceHolyBulwark_aura"},"raceLuminousShield":{"aura":"raceLuminousShield_aura"},"raceFirewallProtocol":{"aura":"raceFirewallProtocol_aura"},"warCry":{"aura":"warCry_aura"},"raceRallyCommand":{"aura":"raceRallyCommand_aura"},"raceVOXBroadcast":{"aura":"raceVOXBroadcast_aura"},"racePsychicBarrier":{"aura":"racePsychicBarrier_aura"},"raceShieldWall":{"aura":"raceShieldWall_aura"},"raceMushroomRing":{"aura":"raceMushroomRing_aura"},"placeBomb":{"aoe":"placeBomb_aoe"},"raceColdSpot":{"aura":"raceColdSpot_aura"},"raceHostileTakeover":{"aura":"raceHostileTakeover_aura"},"raceDeadAir":{"aura":"raceDeadAir_aura"},"raceDimensionalWeb":{"aura":"raceDimensionalWeb_aura"},"_eorHpRegen":{"aura":"_eorHpRegen_aura"},"_eorMpRegen":{"aura":"_eorMpRegen_aura"},"wildGrowth":{"wall":"wildGrowth_tile"},"buildBridge":{"wall":"buildBridge_tile"},"raceBrimstone":{"wall":"raceBrimstone_tile"},"raceCallOfTheDeep":{"wall":"raceCallOfTheDeep_tile"},"teleport":{"teleport":"teleport_teleport"},"voidRush":{"teleport":"voidRush_teleport"},"raceShadowStep":{"teleport":"raceShadowStep_teleport"},"racePhaseWalk":{"teleport":"racePhaseWalk_teleport"},"raceShedSkin":{"teleport":"raceShedSkin_teleport"},"raceNimbleDodge":{"teleport":"raceNimbleDodge_teleport"},"deployTurret":{"aura":"deployTurret_aura"},"siegeTurret":{"aura":"siegeTurret_aura"},"fiveGTower":{"aura":"fiveGTower_aura"},"shootout":{"impact":"shootout_impact"},"requiem":{"impact":"requiem_impact"},"raceDreadAura":{"impact":"raceDreadAura_impact","aura":"raceDreadAura_aura"},"raceHowl":{"impact":"raceHowl_impact","aura":"raceHowl_aura"},"raceFractalNeedle":{"impact":"raceFractalNeedle_impact"},"warpRune":{"aura":"warpRune_aura"},"_nexusChannelP1":{"aura":"_nexusChannelP1_aura"},"_nexusChannelP2":{"aura":"_nexusChannelP2_aura"},"_nexusProgressP1":{"aura":"_nexusProgressP1_aura"},"_nexusProgressP2":{"aura":"_nexusProgressP2_aura"},"sharedFlashFreeze":{"wall":"sharedFlashFreeze_tile"},"sharedRampart":{"wall":"sharedRampart_tile"},"sharedFissure":{"wall":"sharedFissure_tile"},"sharedScorchedEarth":{"wall":"sharedScorchedEarth_tile"},"sharedPoisonSwamp":{"wall":"sharedPoisonSwamp_tile"},"sharedTerraform":{"wall":"sharedTerraform_tile"},"sharedMaelstrom":{"wall":"sharedMaelstrom_tile"},"sharedSacredGeometry":{"wall":"sharedSacredGeometry_tile"},"sharedGothicRampart":{"wall":"sharedGothicRampart_tile"},"sharedZigguratProtocol":{"wall":"sharedZigguratProtocol_tile"},"raceSacredGeometry":{"wall":"sharedSacredGeometry_tile"},"raceGothicRampart":{"wall":"sharedGothicRampart_tile"},"raceZigguratProtocol":{"wall":"sharedZigguratProtocol_tile"},"raceContainmentField":{"wall":"raceContainmentField_tile"},"sharedTidalSurge":{"beam":"sharedTidalSurge_beam","impact":"sharedTidalSurge_impact_tile"},"raceShockwaveClap":{"beam":"raceShockwaveClap_beam","impact":"raceShockwaveClap_impact_tile"},"raceDragonfire":{"beam":"raceDragonfire_beam","impact":"raceDragonfire_impact_tile"},"raceAtomicBreath":{"beam":"raceAtomicBreath_beam","impact":"raceAtomicBreath_impact_tile"},"raceWingGust":{"aoe":"raceWingGust_aoe","impact":"raceWingGust_impact_tile"},"raceCataclysmStomp":{"aoe":"raceCataclysmStomp_aoe"},"raceTidalSlam":{"aoe":"raceTidalSlam_aoe"},"racePrimalRoar":{"aoe":"racePrimalRoar_aoe"},"raceAvalancheSlam":{"aoe":"raceAvalancheSlam_aoe"},"raceCrowStorm":{"aoe":"raceCrowStorm_aoe"},"raceDeafeningWail":{"aoe":"raceDeafeningWail_aoe"},"raceDepthCharge":{"aoe":"raceDepthCharge_aoe"},"raceSkyscraperToss":{"aoe":"raceSkyscraperToss_aoe"},"raceRiptide":{"aoe":"raceRiptide_aoe"},"sharedVortexSlam":{"aoe":"sharedVortexSlam_aoe"},"raceThunderclap":{"descent":"raceThunderclap_descent","impact":"thunder1_impact"},"raceFallenGrace":{"descent":"raceFallenGrace_descent","impact":"raceDarkDominion_impact_tile"},"raceWrathOfTheWatchers":{"descent":"raceWrathOfTheWatchers_descent","impact":"judgment_impact_tile"},"raceArtilleryStrike":{"descent":"raceArtilleryStrike_descent","impact":"nuke_impact_tile"},"raceCataclysmDecree":{"descent":"raceCataclysmDecree_descent","impact":"raceInfernalDecree_impact_tile"},"raceProphecyOfDisaster":{"descent":"raceProphecyOfDisaster_descent","impact":"raceTremorStomp_impact_tile"},"sharedNuke":{"descent":"sharedNuke_descent","impact":"nuke_impact_tile"},"raceSpectralPassage":{"teleport":"raceSpectralPassage_teleport"},"raceVoidStep":{"teleport":"raceVoidStep_teleport"},"raceMistForm":{"teleport":"raceMistForm_teleport"},"raceCryptidVanish":{"teleport":"raceCryptidVanish_teleport"},"raceCorpseCrawl":{"teleport":"raceCorpseCrawl_teleport"},"raceDeepDive":{"teleport":"raceDeepDive_teleport"},"raceEject":{"teleport":"raceEject_teleport"},"raceShadowInfiltration":{"teleport":"raceShadowInfiltration_teleport"},"raceBoulderHurl":{"impact":"raceBoulderHurl_impact"},"raceStoneThrow":{"impact":"_rockThrow_impact"},"raceJurassicJaw":{"impact":"raceJurassicJaw_impact"},"raceSyntheticBlade":{"impact":"_slashMelee_impact"},"raceSavageRend":{"impact":"_slashMelee_impact"},"raceRocketFist":{"impact":"_heavyPunch_impact"},"raceHydraulicPunch":{"impact":"_heavyPunch_impact"},"raceTaserBolt":{"impact":"raceTaserBolt_impact"},"raceRecursiveLoop":{"impact":"raceRecursiveLoop_impact"},"raceDarkJustice":{"impact":"raceDarkJustice_impact"},"raceAmbushLunge":{"impact":"raceAmbushLunge_impact"},"raceStonefall":{"impact":"raceStonefall_impact"},"raceMjolnirsEcho":{"impact":"raceMjolnirsEcho_impact"},"racePhotonScatter":{"impact":"racePhotonScatter_impact"},"raceDragonfear":{"impact":"raceDragonfear_impact"},"raceDrainingEmbrace":{"impact":"raceDrainingEmbrace_impact","drainHop":"lifeDrain_drainHop"},"raceGhoulishBite":{"impact":"raceGhoulishBite_impact","drainHop":"lifeDrain_drainHop"},"raceKissOfDecay":{"impact":"raceKissOfDecay_impact","drainHop":"lifeDrain_drainHop"},"raceBloodFrenzy":{"aura":"_buff_dark_aura"},"raceInnerDemon":{"aura":"_buff_dark_aura"},"raceConspiracyOfScales":{"aura":"_buff_unholy_aura"},"raceThroneOfCinders":{"aura":"_buff_dark_aura"},"raceBloodThrall":{"impact":"_dark_mark_impact"},"raceInvulnerable":{"aura":"_buff_divine_aura"},"raceProphecyFulfilled":{"aura":"_buff_divine_aura"},"raceRapture":{"aura":"_buff_divine_aura"},"raceWingsOfMercy":{"aura":"_buff_divine_aura"},"racePixieDustTrail":{"aura":"_buff_divine_aura"},"raceMimicry":{"aura":"_buff_anomaly_aura"},"raceNanocloud":{"aura":"_buff_tech_aura"},"raceReassemble":{"aura":"_selfHeal_unholy_aura"},"raceSelfRepairProtocol":{"aura":"_selfHeal_tech_aura"},"raceCarrionFeast":{"aura":"_selfHeal_unholy_aura"},"raceTinfoilFortress":{"aura":"raceTinfoilFortress_aura"},"raceTinkersContraption":{"aura":"raceTinkersContraption_aura"},"raceSwarmSignal":{"aura":"raceSwarmSignal_aura"},"raceBlizzardZone":{"aura":"_zoneDebuff_ice_aura"},"raceDarkMiasma":{"aura":"_zoneDebuff_dark_aura"},"sharedSmokeScreen":{"aura":"_zoneDebuff_smoke_aura"},"raceHealingTide":{"aura":"_zoneHeal_water_aura"},"raceSacredGrove":{"aura":"_zoneHeal_nature_aura"},"sharedGlacialTomb":{"descent":"sharedGlacialTomb_descent","impact":"sharedGlacialTomb_impact"},"sharedWardOfThorns":{"aura":"_deployObject_aura"},"raceBoneWall":{"aura":"_deployObject_aura"},"raceTeslaTrap":{"aura":"_deployObject_aura"},"raceTotemDrop":{"aura":"_deployObject_aura"},"raceOrichalcumBarrier":{"aura":"_deployObject_aura"},"sharedSummonBlizzard":{"aura":"_zoneDebuff_ice_aura","aoe":"sharedSummonBlizzard_aoe"},"sharedSummonBloodRain":{"aura":"_buff_unholy_aura"},"sharedSummonSandstorm":{"aura":"_deployObject_aura"},"sharedCallLightning":{"aura":"_buff_anomaly_aura"},"raceFrostbite":{"impact":"_ice_impact_tile"},"racePetrifyingGaze":{"impact":"_rockThrow_impact"},"raceSporeCloud":{"impact":"_poison_impact_tile"},"raceDigitalPlague":{"impact":"raceTaserBolt_impact"},"raceTimeDistortion":{"impact":"raceRecursiveLoop_impact"},"raceEntomb":{"impact":"_ice_impact_center"},"raceDoomMark":{"impact":"raceDarkJustice_impact"},"raceHexOfShattering":{"impact":"raceDarkJustice_impact"},"raceGrapplingHook":{"teleport":"raceEject_teleport"},"raceAbduct":{"teleport":"raceVoidStep_teleport"},"raceTongueGrab":{"teleport":"raceCryptidVanish_teleport"},"sharedTremorStep":{"teleport":"raceEject_teleport"},"raceTractorBeam":{"pull":"raceTractorBeam_column"},"raceAbductionBeam":{"impact":"racAbductionBeam_impact"},"raceProbe":{"impact":"raceProbe_impact"},"raceImplant":{"impact":"raceImplant_impact"},"raceWarOfTheWorlds":{"aura":"raceWarOfTheWorlds_deploy"},"raceStunRay":{"impact":"raceStunRay_impact"},"raceSpaceDisco":{"aoe":"raceSpaceDisco_aoe"},"raceGravityBoots":{"teleport":"raceGravityBoots_teleport"},"raceCharmBeam":{"impact":"raceStunRay_impact"},"racePlasmaWhip":{"impact":"racePlasmaWhip_impact"},"raceCorrosiveSplash":{"aoe":"raceCorrosiveSplash_aoe"},"raceAbsorb":{"impact":"raceAbsorb_impact","drainHop":"lifeDrain_drainHop"},"raceMitosisSplit":{"aura":"raceMitosisSplit_aura"},"raceOozeTrail":{"wall":"raceCorrosiveSplash_impact_tile"},"raceToxicNova":{"aoe":"raceToxicNova_aoe"},"raceStoneSkin":{"aura":"raceStoneSkin_aura"},"raceQuake":{"aoe":"raceQuake_aoe"},"raceAvalancheSmash":{"impact":"raceAvalancheSmash_impact"},"raceRamCharge":{"impact":"raceRamCharge_impact"},"raceExhaustCloud":{"aura":"raceExhaustCloud_aura"},"raceRoboPunch":{"impact":"raceRoboPunch_impact"},"raceMissileBarrage":{"aoe":"raceMissileBarrage_aoe"},"raceNitroBoost":{"aura":"raceNitroBoost_aura"},"raceIceSpear":{"impact":"raceIceSpear_impact"},"raceFrostThrone":{"aura":"raceFrostThrone_aura"},"raceDiamondDust":{"aoe":"raceDiamondDust_aoe"},"raceAbsoluteZero":{"impact":"raceAbsoluteZero_impact"},"raceUnstoppableCharge":{"impact":"raceUnstoppableCharge_impact"},"raceBrutalSlam":{"aoe":"raceBrutalSlam_aoe"},"raceThickHide":{"aura":"raceThickHide_aura"},"raceBodyCheck":{"impact":"raceBodyCheck_impact"},"raceRampage":{"aura":"raceRampage_aura"},"raceKiBlast":{"impact":"raceKiBlast_impact_v2"},"raceFlurryOfBlows":{"impact":"raceFlurryOfBlows_impact"},"raceKiCharge":{"aura":"raceKiCharge_aura"},"raceKiWave":{"beam":"raceKiWave_beam"},"raceDragonFist":{"impact":"raceDragonFist_impact"},"raceInstantTransmission":{"teleport":"raceInstantTransmission_teleport"},"raceExcaliburStrike":{"impact":"raceExcaliburStrike_impact"},"raceRoyalDecree":{"aura":"raceRoyalDecree_aura"},"raceHolyAvenger":{"beam":"raceHolyAvenger_cross"},"raceKnightsOath":{"teleport":"raceKnightsOath_teleport"},"raceChestPound":{"aoe":"raceChestPound_aoe"},"racePrimalSmash":{"impact":"racePrimalSmash_impact"},"raceBoulderThrow":{"impact":"raceBoulderHurl_impact"},"raceApeFury":{"aura":"raceApeFury_aura"},"raceGroundSlam":{"aoe":"raceGroundSlam_aoe"},"raceBullRush":{"impact":"raceBullRush_impact"},"raceGore":{"impact":"raceGore_impact"},"raceLabyrinthRoar":{"aoe":"raceLabyrinthRoar_aoe"},"raceMazeWard":{"wall":"raceQuake_impact_tile"},"raceHornToss":{"impact":"raceHornToss_impact"},"raceSoulDrain":{"impact":"raceSoulDrain_impact","drainHop":"lifeDrain_drainHop"},"raceBoneBarrage":{"aoe":"raceBoneBarrage_aoe"},"raceCurseOfDecay":{"impact":"_dark_shadow_impact"},"raceDeathPact":{"aura":"_buff_dark_aura"},"racePlaguefield":{"aura":"racePlaguefield_aura"},"raceDarkResurrection":{"aura":"raceDarkResurrection_aura"},"raceDeathGaze":{"impact":"raceDeathGaze_impact"},"raceOmniVision":{"aura":"raceOmniVision_aura"},"racePsychicBeam":{"beam":"racePsychicBeam_beam"},"raceHypnoticPulse":{"impact":"raceDeathGaze_impact"},"racePupilShield":{"aura":"racePupilShield_aura"},"raceHailMary":{"impact":"raceHailMary_impact"},"raceBulletPass":{"beam":"raceBulletPass_beam"},"raceBlitz":{"impact":"raceBlitz_impact"},"raceAudible":{"aura":"raceAudible_aura"},"raceSpikeTheBall":{"aoe":"raceSpikeTheBall_aoe"},"raceEndZoneDance":{"aura":"raceEndZoneDance_aura"},"racePrecisionShot":{"impact":"racePrecisionShot_impact"},"raceArrowRain":{"aoe":"raceArrowRain_aoe"},"raceStealFromRich":{"impact":"raceStealFromRich_impact"},"raceForestAmbush":{"aura":"raceForestAmbush_aura"},"raceSplittingArrow":{"impact":"racePrecisionShot_impact"},"raceGiftOfHealing":{"aura":"raceGiftOfHealing_aura_v2"},"raceLumpOfCoal":{"impact":"raceLumpOfCoal_impact_v2"},"raceNaughtyList":{"impact":"raceNaughtyList_impact_v2"},"raceChristmasSpirit":{"aura":"raceChristmasSpirit_aura_v2"},"raceSleighDash":{"teleport":"raceSleighDash_teleport_v2"},"raceBlizzardPresent":{"aoe":"raceBlizzardPresent_aoe_v2"},"sentaiRedSlash":{"impact":"sentaiRedSlash_impact"},"sentaiBlueWave":{"beam":"sentaiBlueWave_beam"},"sentaiBlackGuard":{"aura":"sentaiBlackGuard_aura"},"sentaiGreenArrow":{"impact":"sentaiGreenArrow_impact"},"sentaiYellowThunder":{"aoe":"sentaiYellowThunder_aoe"},"sentaiPinkHeal":{"aura":"sentaiPinkHeal_aura"},"sentaiTeamStrike":{"impact":"sentaiTeamStrike_impact_v2"},"sentaiMegazordBlast":{"aoe":"sentaiMegazordBlast_aoe","impact":"sentaiMegazordBlast_impact_center_v2"},"raceTendrilStrike":{"impact":"raceTendrilStrike_impact"},"raceSymbioticDrain":{"impact":"raceSymbioticDrain_impact","drainHop":"lifeDrain_drainHop"},"raceWebLaunch":{"impact":"raceWebLaunch_impact"},"raceSymbioteArmor":{"aura":"raceSymbioteArmor_aura"},"racePredatorLeap":{"impact":"raceTendrilStrike_impact"},"raceValkyrieSpear":{"impact":"raceValkyrieSpear_impact"},"raceDivineSwoop":{"impact":"raceValkyrieSpear_impact"},"raceChooserOfSlain":{"aura":"raceChooserOfSlain_aura"},"raceShieldMaiden":{"aura":"raceShieldMaiden_aura"},"raceNordicWarcry":{"aura":"raceNordicWarcry_aura"},"raceCosmicSight":{"aura":"raceCosmicSight_aura"},"raceRealityPulse":{"aoe":"raceRealityPulse_aoe"},"raceTemporalShift":{"teleport":"raceTemporalShift_teleport"},"raceJudgmentBeam":{"beam":"raceJudgmentBeam_beam"},"raceAstralBarrier":{"aura":"raceAstralBarrier_aura"},"_turretBlast":{"beam":"_turretBlast_beam"},"raceContract":{"impact":"_dark_mark_impact"},"raceCanopicCurse":{"impact":"_dark_mark_impact"},"raceVassalage":{"impact":"_dark_mark_impact"},"raceInfernalConscription":{"impact":"_dark_mark_impact"},"raceShadowBind":{"impact":"raceShadowBind_impact"},"racePossession":{"impact":"_psychic_dark_impact"},"raceCharm":{"impact":"_psychic_dark_impact"},"raceBrainwash":{"impact":"_psychic_dark_impact"},"raceHexOfAgony":{"impact":"raceHexOfAgony_impact"},"raceBlackPhillipsGaze":{"impact":"_eldritch_gaze_impact"},"raceRedEyes":{"impact":"_eldritch_gaze_impact"},"raceDarkFeather":{"impact":"_dark_shadow_impact"},"raceCurseOfMisfortune":{"impact":"_dark_debuff_impact"},"raceMemoryLeak":{"impact":"_dark_debuff_impact"},"raceBlueScreen":{"impact":"_dark_debuff_impact"},"raceHighNoon":{"impact":"_rangedShot_impact"},"raceHeadshot":{"impact":"_rangedShot_impact"},"raceClassifiedWeapon":{"impact":"_rangedShot_impact"},"raceSuppressiveFire":{"beam":"plasmaGun_beam","impact":"_rangedShot_impact"},"raceFanTheHammer":{"aoe":"raceChassisSlan_aoe","impact":"_rangedShot_impact"},"racePredictiveModel":{"impact":"raceProbe_impact"},"raceSpotterMark":{"impact":"raceProbe_impact"},"raceDeneuralizer":{"impact":"_dark_debuff_impact"},"raceExecutiveOrder":{"impact":"_dark_debuff_impact"},"raceSandglassPrison":{"impact":"_dark_debuff_impact"},"racePermafrost":{"impact":"raceAbsoluteZero_impact"},"raceSirenSong":{"impact":"_psychic_dark_impact"},"raceNeuralHack":{"impact":"raceTaserBolt_impact"},"raceManaShield":{"aura":"_buff_unholy_aura"},"raceConcealedPosition":{"aura":"camouflage_aura"},"raceSpiritWalk":{"teleport":"raceShadowStep_teleport"},"raceAgentVanish":{"teleport":"raceNimbleDodge_teleport"},"raceTumbleweed":{"teleport":"raceEject_teleport"},"raceSkinSwap":{"teleport":"raceVoidStep_teleport"},"raceDimensionalFold":{"teleport":"raceVoidStep_teleport"},"raceInkCloud":{"aura":"_zoneDebuff_dark_aura"},"raceWhiteout":{"aura":"_zoneDebuff_ice_aura"},"raceFilibuster":{"aura":"_zoneDebuff_smoke_aura"},"raceHeatDeath":{"aura":"_zoneDebuff_dark_aura"},"raceTemporalTide":{"aura":"raceTidalBlessing_aura"},"raceCorruptedSanctuary":{"aura":"raceSanctuary_aura"},"raceShamblingHorde":{"aura":"_deployObject_aura"},"raceStuffedDouble":{"aura":"_deployObject_aura"},"raceCatsCradle":{"aura":"_deployObject_aura"},"raceLucidTrap":{"aura":"_deployObject_aura"},"racePhantomDouble":{"aura":"_deployObject_aura"},"raceCloneDecoy":{"aura":"_deployObject_aura"},"racePowderKeg":{"aura":"_deployObject_aura"},"raceFlashbangMine":{"aura":"_deployObject_aura"},"raceGravePassage":{"aura":"_deployObject_aura"},"raceTunnelNetwork":{"aura":"_deployObject_aura"},"raceClockworkTurret":{"aura":"deployTurret_aura"},"raceOathOfValor":{"aura":"warCry_aura"},"raceTelepathicLink":{"aura":"raceSwarmSignal_aura"},"raceCrystalBall":{"aura":"_buff_anomaly_aura"},"raceTarotDraw":{"aura":"_buff_anomaly_aura"},"raceImprovise":{"aura":"_buff_anomaly_aura"},"raceDivineLight":{"aura":"heal1_aura"},"raceHerbalRemedy":{"aura":"cleanse_aura"},"raceSpiritChannel":{"aura":"cleanse_aura"},"raceAyahuascaRetreat":{"aura":"raceWildResilience_aura"},"raceArcaneBlast":{"aoe":"raceGlitterburst_aoe","impact":"raceGlitterburst_impact_tile"},"raceOvercharge":{"aoe":"raceEMPGrenade_aoe","impact":"raceEMPGrenade_impact_tile"},"raceMindCrush":{"impact":"mindShatter_impact"},"raceChainLightning":{"impact":"thunder1_impact","chain":"thunder1_chain_hop"}}};

var _EFX_SHORT = {n:'count',d:'delayMs',a:'anchor',m:'mode',s:'sprite',l:'ml',z:'z',o:'offsetXY',vx:'vxRange',vy:'vyRange',vz:'vzRange',g:'gravity',dr:'drag',s0:'size0',s1:'size1',o0:'opacity0',o1:'opacity1',w0:'w0',w1:'w1',h0:'h0',h1:'h1','_d':'_descent',sr:'spriteRot',tR:'_tintR',tG:'_tintG',tB:'_tintB','_vz':'vz'};
var _EFX_LAYER_DEF = {count:1,delayMs:0,anchor:'torso',mode:'billboard',z:0,opacity0:1,opacity1:0};
var _EFX_ESK = {sk:'shake',ice:'impactCenterEffect',ite:'impactTileEffect',ar:'aoeRadius',ps:'pillarSprite',pm:'pillarMs',ph:'pillarH',ph1:'pillarH1',pw0:'pillarW0',pw1:'pillarW1',po0:'pillarOpacity0',po1:'pillarOpacity1',sh:'shape',de:'dispersalEffect',ae:'arrivalEffect',adm:'arrivalDelayMs',bs:'beamSprite',bm:'beamMs',ls:'leaveScorch',dsm:'descentMs',tm:'telegraphMs',ts:'telegraphSprite',cm:'chargeMs',bt:'beamThickness',bhs:'beamHeadSprite','_d':'_descent',bw:'beamWidth',bo0:'beamOpacity0',bo1:'beamOpacity1',fo:'flyover',mi:'missiles',tsz:'telegraphSize',ie:'impactEffect'};

function _hydrateEffects() {
    var E = _EFX_DATA.E, out = {};
    for (var id in E) {
        var ce = E[id], eff = {};
        for (var k in ce) {
            if (k === 'L') {
                eff.layers = ce.L.map(function(cl) {
                    var layer = {};
                    for (var dk in _EFX_LAYER_DEF) layer[dk] = _EFX_LAYER_DEF[dk];
                    for (var sk in cl) {
                        var lk = _EFX_SHORT[sk] || sk;
                        layer[lk] = cl[sk];
                    }
                    return layer;
                });
            } else {
                var ek = _EFX_ESK[k] || k;
                eff[ek] = ce[k];
            }
        }
        if (eff.pillarOpacity1 === undefined && eff.pillarOpacity0 !== undefined) eff.pillarOpacity1 = 0;
        out[id] = eff;
    }
    return out;
}
var EFFECTS = _hydrateEffects();
var SPELL_MAP = _EFX_DATA.S;

    /* ─── BOLT EFFECT DEFINITIONS ────────────────────────────────────
       These are config objects read by _fireBoltMapped(), NOT layer-based
       effects. They define the core/trail/burst sprites for each bolt type.
       Shared bolt configs are reused by many spells via SPELL_MAP entries.
       ──────────────────────────────────────────────────────────────── */
    var _BOLT_DEFS = {
        /* TIER 1 — Energy bolts */
        _bolt_fire:     { boltCore: 'flame-hot',     boltTrail: 'ember',        boltBurst: 'explosion-orange', boltRing: 'target-ring',       boltCoreSize: 0.30, boltTrailSize: 0.10, boltBurstCount: 40 },
        _bolt_ice:      { boltCore: 'frost-crystal',  boltTrail: 'ice-shard',   boltBurst: 'frost-mist',       boltRing: 'target-ring-blue',  boltCoreSize: 0.26, boltTrailSize: 0.09, boltBurstCount: 34 },
        _bolt_elec:     { boltCore: 'spark-elec',     boltTrail: 'lightning',    boltBurst: 'spark-blue',       boltRing: 'stun-ring',         boltCoreSize: 0.24, boltTrailSize: 0.08, boltBurstCount: 30 },
        _bolt_divine:   { boltCore: 'divine-sparkle', boltTrail: 'holy-light',  boltBurst: 'divine-sparkle',   boltRing: 'halo-ring',         boltCoreSize: 0.28, boltTrailSize: 0.10, boltBurstCount: 36 },
        _bolt_unholy:   { boltCore: 'dark-flame',     boltTrail: 'void-mist',   boltBurst: 'blood-fleck',      boltRing: 'target-ring',       boltCoreSize: 0.26, boltTrailSize: 0.09, boltBurstCount: 34 },
        _bolt_psi:      { boltCore: 'psi-pulse',      boltTrail: 'void-mist',   boltBurst: 'psi-pulse',        boltRing: 'target-ring',       boltCoreSize: 0.26, boltTrailSize: 0.09, boltBurstCount: 30 },
        _bolt_tech:     { boltCore: 'plasma',         boltTrail: 'spark-elec',  boltBurst: 'emp-arc',          boltRing: 'target-ring-blue',  boltCoreSize: 0.24, boltTrailSize: 0.08, boltBurstCount: 30 },
        _bolt_alien:    { boltCore: 'ufo-glow',       boltTrail: 'acid-green',  boltBurst: 'psi-pulse',        boltRing: 'target-ring-green', boltCoreSize: 0.26, boltTrailSize: 0.09, boltBurstCount: 30 },
        _bolt_holy:     { boltCore: 'holy-pillar',    boltTrail: 'divine-sparkle', boltBurst: 'holy-light',    boltRing: 'halo-ring',         boltCoreSize: 0.30, boltTrailSize: 0.10, boltBurstCount: 38 },
        _bolt_plasma:   { boltCore: 'laser-pink',     boltTrail: 'spark-pink',  boltBurst: 'laser-pink',       boltRing: 'target-ring',       boltCoreSize: 0.24, boltTrailSize: 0.08, boltBurstCount: 30 },
        _bolt_ki:       { boltCore: 'holy-light',     boltTrail: 'ember',       boltBurst: 'holy-light',       boltRing: 'halo-ring',         boltCoreSize: 0.45, boltTrailSize: 0.14, boltTrailRate: 5, boltBurstCount: 45 },
        _bolt_poison:   { boltCore: 'poison-bubble',  boltTrail: 'acid-green',  boltBurst: 'poison-bubble',    boltRing: 'target-ring-green', boltCoreSize: 0.22, boltTrailSize: 0.08, boltBurstCount: 28 },
        _bolt_inkblot:  { boltCore: 'inkblot',        boltTrail: 'void-mist',   boltBurst: 'inkblot',          boltRing: 'target-ring',       boltCoreSize: 0.26, boltTrailSize: 0.09, boltBurstCount: 30 },
        /* TIER 2 — Debuff bolts (subtler, dimmer) */
        _bolt_curse:    { boltCore: 'dark-flame',     boltTrail: 'void-mist',   boltBurst: 'void-mist',        boltRing: 'target-ring',       boltCoreSize: 0.20, boltTrailSize: 0.07, boltBurstCount: 22, boltHeadGlow: true },
        _bolt_glitch:   { boltCore: 'spark-elec',     boltTrail: 'emp-arc',     boltBurst: 'spark-elec',       boltRing: 'target-ring-blue',  boltCoreSize: 0.20, boltTrailSize: 0.07, boltBurstCount: 22 },
        /* TIER 3 — Physical projectiles */
        _bolt_bullet:   { boltCore: 'muzzle-flash',   boltTrail: 'steel-spark', boltBurst: 'steel-spark',      boltRing: 'target-ring',       boltCoreSize: 0.14, boltTrailSize: 0.05, boltTrailRate: 5, boltBurstCount: 20 },
        _bolt_arrow:    { boltCore: 'steel-spark',     boltTrail: 'dust-puff',  boltBurst: 'steel-spark',      boltRing: 'target-ring',       boltCoreSize: 0.14, boltTrailSize: 0.05, boltTrailRate: 6, boltBurstCount: 18 },
        _bolt_rock:     { boltCore: 'rock-debris',     boltTrail: 'dust-puff',  boltBurst: 'rock-debris',      boltRing: 'target-ring',       boltCoreSize: 0.22, boltTrailSize: 0.07, boltBurstCount: 24 },
        _bolt_bone:     { boltCore: 'debris',          boltTrail: 'void-mist',  boltBurst: 'debris',           boltRing: 'target-ring',       boltCoreSize: 0.20, boltTrailSize: 0.07, boltBurstCount: 22 },
        _bolt_football: { boltCore: 'rock-debris',     boltTrail: 'dust-puff',  boltBurst: 'dust-puff',        boltRing: 'target-ring',       boltCoreSize: 0.20, boltTrailSize: 0.05, boltTrailRate: 4, boltBurstCount: 16, boltHeadGlow: false },
    };

    /* Register bolt defs into EFFECTS so _fireBoltMapped can look them up */
    for (var bk in _BOLT_DEFS) { EFFECTS[bk] = _BOLT_DEFS[bk]; }

    /* ─── SPELL_MAP BOLT WIRING ──────────────────────────────────────
       Add "bolt" intent to every spell that should use the bolt projectile
       system instead of the generic projectile(). The bolt key points to
       a _BOLT_DEFS entry (now in EFFECTS).
       ──────────────────────────────────────────────────────────────── */
    var _BOLT_WIRING = {
        /* TIER 1 — Class spells: energy bolts */
        fire1:           '_bolt_fire',
        fire2:           '_bolt_fire',
        electroDart:     '_bolt_elec',
        taser:           '_bolt_elec',
        psychosis:       '_bolt_psi',
        mindShatter:     '_bolt_psi',
        exorcism:        '_bolt_divine',
        kineticHurl:     '_bolt_psi',
        lifeDrain:       '_bolt_unholy',
        ricochet1:       '_bolt_elec',

        /* TIER 1 — Race abilities: energy bolts */
        raceDivineSmite:      '_bolt_divine',
        raceCrashLoop:        '_bolt_tech',
        raceRecursiveLoop:    '_bolt_tech',
        raceTaserBolt:        '_bolt_elec',
        raceStunRay:          '_bolt_elec',
        racePlasmaWhip:       '_bolt_plasma',
        raceKiBlast:          '_bolt_ki',
        raceIceSpear:         '_bolt_ice',
        raceAbsoluteZero:     '_bolt_ice',
        racePrismBurst:       '_bolt_divine',
        raceDeathGaze:        '_bolt_psi',
        raceHypnoticPulse:    '_bolt_psi',
        raceMjolnirsEcho:     '_bolt_elec',
        racePhotonScatter:    '_bolt_divine',
        raceFractalNeedle:    '_bolt_plasma',
        raceLumpOfCoal:       '_bolt_rock',
        raceChainLightning:   '_bolt_elec',
        raceWeighTheHeart:    '_bolt_unholy',
        raceStonefall:        '_bolt_rock',
        raceDarkJustice:      '_bolt_unholy',
        raceMindCrush:        '_bolt_psi',
        raceCharmBeam:        '_bolt_psi',
        raceValkyrieSpear:    '_bolt_divine',
        raceDivineSwoop:      '_bolt_divine',
        raceWebLaunch:        '_bolt_inkblot',
        raceTendrilStrike:    '_bolt_inkblot',

        /* Drain bolts */
        raceVoidContract:     '_bolt_unholy',
        raceSoulSuck:         '_bolt_unholy',
        raceLifetap:          '_bolt_unholy',
        raceSoulDrain:        '_bolt_unholy',
        raceDreamSiphon:      '_bolt_psi',
        raceSymbioticDrain:   '_bolt_inkblot',
        raceAbsorb:           '_bolt_inkblot',
        raceDrainingEmbrace:  '_bolt_unholy',
        raceGhoulishBite:     '_bolt_poison',
        raceKissOfDecay:      '_bolt_poison',

        /* TIER 2 — Debuff bolts */
        racePossession:       '_bolt_curse',
        raceCharm:            '_bolt_curse',
        raceBrainwash:        '_bolt_curse',
        raceContract:         '_bolt_curse',
        raceBloodThrall:      '_bolt_curse',
        raceVassalage:        '_bolt_curse',
        raceInfernalConscription: '_bolt_curse',
        raceCanopicCurse:     '_bolt_curse',
        raceShadowBind:       '_bolt_curse',
        raceRedEyes:          '_bolt_curse',
        raceBlackPhillipsGaze:'_bolt_curse',
        raceHexOfAgony:       '_bolt_curse',
        raceCurseOfDecay:     '_bolt_curse',
        raceCurseOfMisfortune:'_bolt_curse',
        raceSirenSong:        '_bolt_psi',
        raceMemoryLeak:       '_bolt_glitch',
        raceBlueScreen:       '_bolt_glitch',
        raceNeuralHack:       '_bolt_glitch',
        raceDeneuralizer:     '_bolt_glitch',
        racePermafrost:       '_bolt_ice',
        raceNaughtyList:      '_bolt_unholy',
        raceStealFromRich:    '_bolt_divine',
        raceExecutiveOrder:   '_bolt_curse',
        racePredictiveModel:  '_bolt_tech',
        raceSpotterMark:      '_bolt_tech',
        raceSandglassPrison:  '_bolt_curse',
        raceDarkFeather:      '_bolt_curse',

        /* TIER 3 — Physical projectiles */
        shoot:                '_bolt_bullet',
        doubleShot:           '_bolt_bullet',
        precisionShot:        '_bolt_bullet',
        headshot:             '_bolt_bullet',
        deadEye:              '_bolt_bullet',
        kneecapShot:          '_bolt_bullet',
        shootout:             '_bolt_bullet',
        requiem:              '_bolt_bullet',
        knifeThrow:           '_bolt_arrow',
        raceHighNoon:         '_bolt_bullet',
        raceHeadshot:         '_bolt_bullet',
        raceClassifiedWeapon: '_bolt_bullet',
        racePrecisionShot:    '_bolt_arrow',
        raceSplittingArrow:   '_bolt_arrow',
        sentaiGreenArrow:     '_bolt_arrow',
        raceBoneToss:         '_bolt_bone',
        raceBoulderHurl:      '_bolt_rock',
        raceBoulderThrow:     '_bolt_rock',
        raceStoneThrow:       '_bolt_rock',
        raceHailMary:         '_bolt_rock',
        /* AoE spells that fire a travel projectile to center tile */
        raceArcaneBlast:      '_bolt_unholy',
        raceOvercharge:       '_bolt_elec',
        raceMindCrush:        '_bolt_psi',
    };

    for (var spId in _BOLT_WIRING) {
        if (!SPELL_MAP[spId]) SPELL_MAP[spId] = {};
        SPELL_MAP[spId].bolt = _BOLT_WIRING[spId];
    }

    if (typeof window !== 'undefined') {
        window.VFX3D_EFFECTS = EFFECTS;
        window.VFX3D_SPELL_MAP = SPELL_MAP;
    }

    function hasMapping(spellId, intent) {
        if (!spellId || !intent) return false;
        return !!(SPELL_MAP[spellId] && SPELL_MAP[spellId][intent]);
    }

    function _rangePick(v) {
        if (Array.isArray(v)) return rn(v[0], v[1]);
        return v;
    }

    function _spawnEffect(effectDef, anchor) {
        if (!effectDef) return;
        if (!_canSpawn()) return;
        if (!effectDef.layers) {
            console.warn('[ThreeVFXEffects] _spawnEffect called on def without layers — likely a wrapper/config object:', effectDef);
            return;
        }

        var centerPx = tilePx(anchor.tx, anchor.ty);
        var baseZFloor = unitSurfaceZ(anchor.tx, anchor.ty);
        var baseZTorso = baseZFloor + unitZBoost();

        for (var li = 0; li < effectDef.layers.length; li++) {
            var layer = effectDef.layers[li];
            var count = layer.count || 1;
            if (layer.delayMs && layer.delayMs > 0) {
                (function(l, c, cpx, zf, zt) {
                    window.setTimeout(function() { _emitLayer(l, c, cpx, zf, zt); }, l.delayMs);
                })(layer, count, centerPx, baseZFloor, baseZTorso);
            } else {
                _emitLayer(layer, count, centerPx, baseZFloor, baseZTorso);
            }
        }

        if (effectDef.shake && typeof window.shakeBoard === 'function') {
            window.shakeBoard(effectDef.shake);
        }
    }

    function _emitLayer(layer, count, centerPx, baseZFloor, baseZTorso) {
        var baseZ = (layer.anchor === 'torso') ? baseZTorso : baseZFloor;
        for (var i = 0; i < count; i++) {
            var offXY = layer.offsetXY || 0;
            var ox = offXY ? rn(-offXY, offXY) : 0;
            var oy = offXY ? rn(-offXY, offXY) : 0;

            var vxR = layer.vxRange;
            var vyR = layer.vyRange;
            var vzR = layer.vzRange;
            var vx = vxR != null ? (Array.isArray(vxR) ? rn(vxR[0], vxR[1]) : rn(-vxR, vxR)) : 0;
            var vy = vyR != null ? (Array.isArray(vyR) ? rn(vyR[0], vyR[1]) : rn(-vyR, vyR)) : 0;
            var vz = vzR != null ? (Array.isArray(vzR) ? rn(vzR[0], vzR[1]) : rn(-vzR, vzR)) : 0;

            var opts = {
                x: centerPx.x + ox,
                y: centerPx.y + oy,
                z: baseZ + (_rangePick(layer.z) || 0),
                vx: vx, vy: vy, vz: vz,
                ml: _rangePick(layer.ml),
                gravity: layer.gravity || 0,
                drag: layer.drag || 0,
                mode: layer.mode || 'billboard',
                sprite: layer.sprite || 'ember',
                opacity0: layer.opacity0 != null ? layer.opacity0 : 1,
                opacity1: layer.opacity1 != null ? layer.opacity1 : 0,
            };

            if (layer.w0 != null || layer.h0 != null) {
                opts.w0 = _rangePick(layer.w0 != null ? layer.w0 : (layer.size0 || 16));
                opts.w1 = _rangePick(layer.w1 != null ? layer.w1 : (layer.size1 != null ? layer.size1 : opts.w0));
                opts.h0 = _rangePick(layer.h0 != null ? layer.h0 : (layer.size0 || 16));
                opts.h1 = _rangePick(layer.h1 != null ? layer.h1 : (layer.size1 != null ? layer.size1 : opts.h0));
            } else {
                opts.size0 = _rangePick(layer.size0 != null ? layer.size0 : 16);
                opts.size1 = _rangePick(layer.size1 != null ? layer.size1 : opts.size0);
            }

            if (layer._descent) opts.descent = layer._descent;
            if (layer.spriteRot != null) opts.spriteRot = layer.spriteRot;

            _spawn(opts);
        }
    }

    function fire(intent, spellId, params) {
        if (_suppressed()) return;
        if (!hasMapping(spellId, intent)) return;
        var effectId = SPELL_MAP[spellId][intent];
        var effectDef = EFFECTS[effectId];
        if (!effectDef) return;

        if (intent === 'descent')  { _fireDescent(spellId, params); return; }
        if (intent === 'wall')     { _fireWall(spellId, params); return; }
        if (intent === 'chain')    { _fireChain(spellId, params); return; }
        if (intent === 'beam')     { _fireBeamMapped(spellId, params); return; }
        if (intent === 'bolt')     { _fireBoltMapped(spellId, params); return; }
        if (intent === 'aoe')      { _fireAoeMapped(spellId, params); return; }
        if (intent === 'aura')     { _fireAura(spellId, params); return; }
        if (intent === 'teleport') { _fireTeleport(spellId, params); return; }

        if (_catOff('spells')) return;
        _spawnEffect(effectDef, { tx: params.tx, ty: params.ty });

        if (_spell3DGeometry[spellId] && intent === 'impact') {
            _spell3DGeometry[spellId](params.tx, params.ty);
        }

        if (window.ThreeLightning && intent === 'impact' &&
            /electro|taser|shock|emp|spark|thunder|lightning|tesla|crashLoop|signalPulse|deadAir|mjolnir|yellowThunder|chainLightning|callLightning|overcharge/i.test(spellId)) {
            var _zapCfg = _cfg();
            var _zapTs = _zapCfg.tileSize || 128;
            var _zapCount = /taser|chainLightning/i.test(spellId) ? 3 : 2;
            for (var _zi = 0; _zi < _zapCount; _zi++) {
                (function(idx) {
                    window.setTimeout(function() {
                        if (typeof state !== 'undefined' && state.devAutoSim && !state._devSimShowAnims) return;
                        var _zc = tilePx(params.tx, params.ty);
                        var _zz = unitSurfaceZ(params.tx, params.ty);
                        var _ub = unitZBoost();
                        var _pad = _zapCfg.boardPadding || 2;
                        var SLAB = 3;

                        var _arcLen = _zapTs * (0.4 + Math.random() * 0.5);
                        var _angle = Math.random() * Math.PI * 2;
                        var _fromW = {
                            x: _zc.x - _pad,
                            y: (_zz + _ub) + SLAB,
                            z: _zc.y - _pad,
                        };
                        var _toW = {
                            x: _fromW.x + Math.cos(_angle) * _arcLen,
                            y: _fromW.y + (Math.random() - 0.5) * _arcLen * 0.4,
                            z: _fromW.z + Math.sin(_angle) * _arcLen,
                        };
                        ThreeLightning.bolt(_fromW, _toW, {
                            segments: 6,
                            jitter: 0.4,
                            branchChance: 0.1,
                            branchDepth: 0,
                            coreWidth: 3,
                            glowWidth: 8,
                            durationMs: 160 + Math.random() * 80,
                            color: 0x88ccff,
                            glowColor: 0x4488ff,
                        });
                    }, idx * 40);
                })(_zi);
            }
        }
    }

    function _fireUtility(effectId, params) {
        if (_suppressed()) return;
        var effectDef = EFFECTS[effectId];
        if (!effectDef) return;
        _spawnEffect(effectDef, { tx: params.tx, ty: params.ty });
    }

    function fireHeal(tx, ty) {
        if (_suppressed() || _catOff('healing')) return;
        _fireUtility('_heal_burst', { tx: tx, ty: ty });
    }

    function fireMana(tx, ty) {
        if (_suppressed() || _catOff('healing')) return;
        _fireUtility('_mana_burst', { tx: tx, ty: ty });
    }

    function fireBuff(tx, ty) {
        if (_suppressed() || _catOff('buffs')) return;
        _fireUtility('_buff_burst', { tx: tx, ty: ty });
    }

    var _statusEffectMap = {
        poison:  '_status_poison',
        burn:    '_status_burn',
        stun:    '_status_stun',
        slow:    '_status_slow',
        bleed:   '_status_bleed',
        silence: '_status_silence',
    };

    function fireStatus(statusId, tx, ty) {
        if (_suppressed() || _catOff('status')) return;
        var effectId = _statusEffectMap[statusId];
        if (!effectId) return;
        _fireUtility(effectId, { tx: tx, ty: ty });
    }

    function fireLevelUp(tx, ty) {
        if (_suppressed() || _catOff('levelUp')) return;
        _fireUtility('_levelUp_burst', { tx: tx, ty: ty });
    }

    function fireDeath(tx, ty) {
        if (_suppressed() || _catOff('death')) return;
        _fireUtility('_death_burst', { tx: tx, ty: ty });
    }

    var _bloodEffectMap = {
        normal:          '_blood_normal',
        critical:        '_blood_critical',
        super_effective: '_blood_super_effective',
        killing_blow:    '_blood_killing_blow',
        resist:          '_blood_resist',
    };

    function fireBlood(tx, ty, tier) {
        if (_suppressed()) return;
        var effectId = _bloodEffectMap[tier] || _bloodEffectMap.normal;
        _fireUtility(effectId, { tx: tx, ty: ty });
    }

    function fireDash(fromTx, fromTy, toTx, toTy) {
        if (_suppressed()) return;
        _fireUtility('_dash_burst', { tx: fromTx, ty: fromTy });
    }

    function fireTeleportLegacy(fromTx, fromTy, toTx, toTy) {
        if (_suppressed()) return;
        _fireUtility('_teleport_vanish', { tx: fromTx, ty: fromTy });
        window.setTimeout(function() {
            _fireUtility('_teleport_arrive', { tx: toTx, ty: toTy });
        }, 250);
    }

    function fireZone(centerTx, centerTy, radius, type) {
        if (_suppressed() || _catOff('zones')) return;
        var effectId = (type === 'heal') ? '_zone_heal_cast' : '_zone_debuff_cast';
        _fireUtility(effectId, { tx: centerTx, ty: centerTy });
    }

    function fireCombo(unitATx, unitATy, unitBTx, unitBTy, targetTx, targetTy) {
        if (_suppressed() || _catOff('combos')) return;
        var _spawnConverge = function(fromTx, fromTy, delayMs) {
            window.setTimeout(function() {
                var fromPx = tilePx(fromTx, fromTy);
                var toPx   = tilePx(targetTx, targetTy);
                var dx = toPx.x - fromPx.x, dy = toPx.y - fromPx.y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                var speed = 400;
                var travelMs = (dist / speed) * 1000;
                for (var i = 0; i < 10; i++) {
                    (function(idx) {
                        window.setTimeout(function() {
                            _spawn({
                                x: fromPx.x + rn(-8, 8), y: fromPx.y + rn(-8, 8),
                                z: unitSurfaceZ(fromTx, fromTy) + unitZBoost(),
                                vx: (dx / dist) * speed + rn(-30, 30),
                                vy: (dy / dist) * speed + rn(-30, 30),
                                vz: rn(-10, 30),
                                ml: travelMs * 0.9,
                                drag: 0.2,
                                mode: 'billboard', sprite: 'ember',
                                size0: rn(6, 12), size1: 2,
                                opacity0: 1, opacity1: 0,
                            });
                        }, idx * 30);
                    })(i);
                }
            }, delayMs);
        };
        _spawnConverge(unitATx, unitATy, 0);
        _spawnConverge(unitBTx, unitBTy, 60);

        var fromPxA = tilePx(unitATx, unitATy);
        var toPx = tilePx(targetTx, targetTy);
        var dxA = toPx.x - fromPxA.x, dyA = toPx.y - fromPxA.y;
        var distA = Math.sqrt(dxA * dxA + dyA * dyA) || 1;
        var arrivalMs = Math.round((distA / 400) * 1000) + 150;

        window.setTimeout(function() {
            _fireUtility('_combo_explosion', { tx: targetTx, ty: targetTy });
        }, arrivalMs);
    }

    function _buildTileOffsets(shape, aoeRadius) {
        var out = [];
        if (shape === 'cross') {
            out.push({ dx: 0, dy: 0 });
            for (var i = 1; i <= aoeRadius; i++) {
                out.push({ dx: i, dy: 0 }, { dx: -i, dy: 0 }, { dx: 0, dy: i }, { dx: 0, dy: -i });
            }
        } else {
            for (var dy = -aoeRadius; dy <= aoeRadius; dy++) {
                for (var dx = -aoeRadius; dx <= aoeRadius; dx++) {
                    out.push({ dx: dx, dy: dy });
                }
            }
        }
        return out;
    }

    function _fireDescent(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;

        var tx = params.tx, ty = params.ty;
        var cfg2 = _cfg();
        var ts = cfg2.tileSize || 128;

        var descentEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].descent;
        if (!descentEffectId) return;
        var descentDef = EFFECTS[descentEffectId];
        if (!descentDef) return;

        var aoeRadius = (params.aoeRadius != null)
            ? params.aoeRadius
            : (descentDef.aoeRadius != null ? descentDef.aoeRadius : 0);
        var telegraphMs = descentDef.telegraphMs || 800;
        var descentMs = descentDef.descentMs || 700;
        var telegraphSprite = descentDef.telegraphSprite || 'target-ring';
        var impactTileEffectId = descentDef.impactTileEffect;
        var impactCenterEffectId = descentDef.impactCenterEffect;
        var shape = descentDef.shape || 'square';

        var tileOffsets = _buildTileOffsets(shape, aoeRadius);

        for (var i = 0; i < tileOffsets.length; i++) {
            var off = tileOffsets[i];
            var ttx = tx + off.dx, tty = ty + off.dy;
            var c = tilePx(ttx, tty);
            var bz = tileZ(ttx, tty);
            _spawn({
                x: c.x, y: c.y, z: bz + 1,
                mode: 'world', sprite: telegraphSprite,
                ml: Math.max(850, telegraphMs + 50),
                size0: ts * 0.9, size1: ts * 0.95,
                opacity0: 0.85, opacity1: 0.1,
            });
        }

        if (descentDef.flyover) {
            var fo = descentDef.flyover;
            var targetPx = tilePx(tx, ty);
            var targetZ = tileZ(tx, ty);
            var flyZ = targetZ + (fo.altitude || 400);
            var flyMs = fo.durationMs || 900;
            var spriteW = fo.w || 256;
            var spriteH = fo.h || 256;
            var flyRight = Math.random() < 0.5;
            var dirX = flyRight ? 1 : -1;
            var bwFn = (typeof bw === 'function') ? bw() : 16;
            var boardW = bwFn * (ts + (cfg2.tileGap || 0));
            var traverseDist = boardW * 1.6;
            var startX = targetPx.x - dirX * traverseDist * 0.5;
            var startY = targetPx.y;
            var speed = traverseDist / (flyMs / 1000);
            var fVx = dirX * speed;
            var spriteRotDeg = flyRight ? 90 : -90;
            var flyDelay = fo.delayMs != null ? fo.delayMs : Math.max(0, telegraphMs * 0.15);
            window.setTimeout(function() {
                if (_suppressed()) return;
                _spawn({
                    x: startX, y: startY, z: flyZ,
                    vx: fVx, vy: 0, vz: 0,
                    mode: 'world',
                    sprite: fo.sprite || 'f22',
                    ml: flyMs,
                    w0: spriteW, w1: spriteW,
                    h0: spriteH, h1: spriteH,
                    opacity0: 0.95, opacity1: 0.3,
                    gravity: 0, drag: 0,
                    spriteRot: spriteRotDeg,
                });
                if (fo.trail !== false) {
                    var trailCount = fo.trailCount || 6;
                    var trailInterval = flyMs * 0.6 / trailCount;
                    for (var ti = 0; ti < trailCount; ti++) {
                        (function(idx) {
                            window.setTimeout(function() {
                                if (_suppressed()) return;
                                var elapsed = (idx * trailInterval) / 1000;
                                var jx = startX + fVx * elapsed;
                                _spawn({
                                    x: jx + rn(-6, 6), y: startY + rn(-6, 6), z: flyZ - rn(5, 15),
                                    mode: 'billboard', sprite: 'smoke',
                                    ml: rn(500, 800),
                                    size0: rn(18, 28), size1: rn(50, 80),
                                    opacity0: 0.5, opacity1: 0,
                                    vz: rn(10, 30), drag: 0.4,
                                });
                            }, idx * trailInterval);
                        })(ti);
                    }
                }
            }, flyDelay);
        }

        window.setTimeout(function() {
            if (_suppressed()) return;
            _spawnEffect(descentDef, { tx: tx, ty: ty });

            if (spellId === 'meteor' && _spell3DGeometry.meteor) {
                _spell3DGeometry.meteor(tx, ty, aoeRadius, descentMs, telegraphMs);
            }

            if (spellId !== 'meteor' && _spell3DGeometry[spellId]) {
                _spell3DGeometry[spellId](tx, ty);
            }

            if (window.ThreeLightning && /thunder|lightning|emp|callLightning|yellowThunder|sentaiYellowThunder/i.test(spellId)) {

                for (var li = 0; li < tileOffsets.length; li++) {
                    (function(off, delay) {
                        window.setTimeout(function() {
                            if (typeof state !== 'undefined' && state.devAutoSim && !state._devSimShowAnims) return;
                            ThreeLightning.strikeFromSky(tx + off.dx, ty + off.dy, {
                                durationMs: Math.max(200, descentMs * 0.85),
                                segments: 14,
                                jitter: 0.3,
                                branchChance: off.dx === 0 && off.dy === 0 ? 0.4 : 0.2,
                                branchDepth: 1,
                                coreWidth: off.dx === 0 && off.dy === 0 ? 7 : 4,
                                glowWidth: off.dx === 0 && off.dy === 0 ? 20 : 12,
                                skyHeight: 650,
                            });
                        }, delay);
                    })(tileOffsets[li], li === 0 ? 0 : 30 + li * 45);
                }
            }

            window.setTimeout(function() {
                if (_suppressed()) return;

                if (spellId === 'nuke' && _spell3DGeometry.nuke) {
                    _spell3DGeometry.nuke(tx, ty, aoeRadius);
                }

                if (spellId === 'nuke' || spellId === 'sharedNuke') {
                    _spawnExplosionRing3D(tx, ty, aoeRadius, {
                        color: 0xff6633, innerColor: 0xffaa44,
                        radiusScale: 0.8, opacity: 0.45, expandMs: 500,
                    });
                } else if (spellId === 'meteor') {
                    _spawnExplosionRing3D(tx, ty, aoeRadius, {
                        color: 0xff4400, innerColor: 0xff8833,
                        radiusScale: 0.65, opacity: 0.4, expandMs: 400,
                    });
                } else if (spellId === 'raceCosmicSlam') {
                    _spawnExplosionRing3D(tx, ty, aoeRadius, {
                        color: 0xcc44ff, innerColor: 0xee88ff,
                        radiusScale: 0.7, opacity: 0.4, expandMs: 450,
                    });
                } else if (spellId === 'raceInfernalDecree') {
                    _spawnExplosionRing3D(tx, ty, aoeRadius, {
                        color: 0x9632b4, innerColor: 0xcc66dd,
                        radiusScale: 0.7, opacity: 0.35, expandMs: 450,
                    });
                }

                _emitAoeBursts(tileOffsets, tx, ty, impactTileEffectId, impactCenterEffectId, aoeRadius);
            }, descentMs);
        }, telegraphMs);
    }

    function _emitAoeBursts(tileOffsets, tx, ty, impactTileEffectId, impactCenterEffectId, aoeRadius) {
        var tileEffect = impactTileEffectId ? EFFECTS[impactTileEffectId] : null;
        var centerEffect = impactCenterEffectId ? EFFECTS[impactCenterEffectId] : null;
        for (var i = 0; i < tileOffsets.length; i++) {
            (function(off) {
                var ttx = tx + off.dx, tty = ty + off.dy;
                var isCenter = (off.dx === 0 && off.dy === 0);
                var stagger = isCenter ? 0 : 40 + (Math.abs(off.dx) + Math.abs(off.dy)) * 35;
                window.setTimeout(function() {
                    if (_suppressed()) return;
                    if (tileEffect && aoeRadius > 0) {
                        _spawnEffect(tileEffect, { tx: ttx, ty: tty });
                    } else if (tileEffect && aoeRadius === 0 && !centerEffect) {
                        _spawnEffect(tileEffect, { tx: ttx, ty: tty });
                    }
                    if (isCenter && centerEffect) {
                        _spawnEffect(centerEffect, { tx: ttx, ty: tty });
                    }
                }, stagger);
            })(tileOffsets[i]);
        }
    }

    function _fireWall(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        if (!params) return;
        var wallEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].wall;
        if (!wallEffectId) return;
        var wallDef = EFFECTS[wallEffectId];
        if (!wallDef) return;
        var tiles = params.tiles || [];
        var stagger = params.staggerMs != null ? params.staggerMs : 80;
        for (var i = 0; i < tiles.length; i++) {
            (function(t) {
                window.setTimeout(function() {
                    if (_suppressed()) return;
                    _spawnEffect(wallDef, { tx: t.x, ty: t.y });
                }, i * stagger);
            })(tiles[i]);
        }

        if (_spell3DGeometry[spellId] && tiles.length > 0) {

            var cx = 0, cy = 0;
            for (var gi = 0; gi < tiles.length; gi++) {
                cx += tiles[gi].x; cy += tiles[gi].y;
            }
            cx = Math.round(cx / tiles.length);
            cy = Math.round(cy / tiles.length);
            _spell3DGeometry[spellId](cx, cy);
        }

        var shake = (wallDef.shake !== undefined) ? wallDef.shake : 'normal';
        if (shake && tiles.length > 0 && typeof window.shakeBoard === 'function') {
            window.shakeBoard(shake);
        }
    }

    function _fireChain(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        var chain = (params && params.chain) || [];
        if (chain.length === 0) return;
        var stagger = params.staggerMs != null ? params.staggerMs : 140;
        var includePrimary = !!params.includePrimary;
        var hopEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].chain;
        var hopDef = hopEffectId ? EFFECTS[hopEffectId] : null;
        if (!hopDef) return;
        var startIdx = includePrimary ? 0 : 1;
        for (var i = startIdx; i < chain.length; i++) {
            (function(tile, prevTile, delay) {
                window.setTimeout(function() {
                    if (_suppressed()) return;
                    _spawnEffect(hopDef, { tx: tile.x, ty: tile.y });

                    if (window.ThreeLightning && prevTile) {
                        ThreeLightning.chainBolt(prevTile.x, prevTile.y, tile.x, tile.y, {
                            durationMs: 200,
                            segments: 8,
                            jitter: 0.28,
                            branchChance: 0.15,
                            branchDepth: 1,
                            coreWidth: 4,
                            glowWidth: 12,
                            color: 0x88ccff,
                            glowColor: 0x4488ff,
                        });
                    }
                }, delay);
            })(chain[i], i > 0 ? chain[i - 1] : (includePrimary ? null : chain[0]), (i - startIdx) * stagger);
        }
    }

    function _fireBeamMapped(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        if (!params) return;

        var beamEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].beam;
        if (!beamEffectId) return;
        var beamDef = EFFECTS[beamEffectId];
        if (!beamDef) return;

        var cfg2 = _cfg();
        var ts = cfg2.tileSize || 128;
        var fromX = params.fromX | 0;
        var fromY = params.fromY | 0;
        var dx = params.dx | 0;
        var dy = params.dy | 0;
        var range = params.range | 0;

        var hitTiles = params.hitTiles;
        if (!hitTiles || !hitTiles.length) {
            hitTiles = [];
            var cx = fromX + dx, cy = fromY + dy;
            for (var i = 0; i < range; i++) {
                hitTiles.push({ x: cx, y: cy });
                cx += dx; cy += dy;
            }
        }
        if (hitTiles.length === 0) return;

        var chargeMs        = beamDef.chargeMs != null ? beamDef.chargeMs : 80;
        var beamMs          = beamDef.beamMs != null ? beamDef.beamMs : 280;
        var beamSprite      = beamDef.beamSprite || 'plasma';
        var beamThickness   = beamDef.beamThickness || 14;
        var beamHeadSprite  = beamDef.beamHeadSprite || null;
        var impactTileId    = beamDef.impactTileEffect || null;
        var impactCenterId  = beamDef.impactCenterEffect || null;
        var leaveScorch     = !!beamDef.leaveScorch;
        var shake           = beamDef.shake;

        if (chargeMs > 0) {
            var cPx = tilePx(fromX, fromY);
            var cZT = unitSurfaceZ(fromX, fromY) + unitZBoost();
            _spawn({
                x: cPx.x, y: cPx.y, z: cZT,
                mode: 'billboard', sprite: 'flash',
                ml: chargeMs + 60,
                size0: ts * 0.45, size1: ts * 0.12,
                opacity0: 0.95, opacity1: 0,
            });
        }

        window.setTimeout(function() {
            if (_suppressed()) return;

            if (shake && typeof window.shakeBoard === 'function') {
                window.shakeBoard(shake);
            }

            var _casterPx = tilePx(fromX, fromY);
            var _casterZTorso = unitSurfaceZ(fromX, fromY) + unitZBoost();
            var _lastTile = hitTiles[hitTiles.length - 1];
            var _terminalPx = tilePx(_lastTile.x, _lastTile.y);
            var _terminalZTorso = unitSurfaceZ(_lastTile.x, _lastTile.y) + unitZBoost();

            var _bdx = _terminalPx.x - _casterPx.x;
            var _bdy = _terminalPx.y - _casterPx.y;
            var _bdz = _terminalZTorso - _casterZTorso;
            var _lenXY = Math.sqrt(_bdx * _bdx + _bdy * _bdy);
            var _len3D = Math.sqrt(_lenXY * _lenXY + _bdz * _bdz);
            var _beamYawDeg = Math.atan2(_bdy, _bdx) * 180 / Math.PI;
            var _beamPitchDeg = -Math.atan2(_bdz, _lenXY) * 180 / Math.PI;
            var _midX = (_casterPx.x + _terminalPx.x) / 2;
            var _midY = (_casterPx.y + _terminalPx.y) / 2;
            var _midZ = (_casterZTorso + _terminalZTorso) / 2;

            _spawn({
                x: _midX, y: _midY, z: _midZ,
                mode: 'beam', sprite: beamSprite,
                ml: beamMs,
                w0: _len3D, w1: _len3D,
                h0: beamThickness * 1.8, h1: beamThickness * 1.2,
                opacity0: 0.55, opacity1: 0,
                beamYawDeg: _beamYawDeg, beamPitchDeg: _beamPitchDeg,
            });

            _spawn({
                x: _midX, y: _midY, z: _midZ,
                mode: 'beam', sprite: beamSprite,
                ml: beamMs,
                w0: _len3D, w1: _len3D,
                h0: beamThickness, h1: beamThickness * 0.5,
                opacity0: 1, opacity1: 0,
                beamYawDeg: _beamYawDeg, beamPitchDeg: _beamPitchDeg,
            });

            for (var i = 0; i < hitTiles.length; i++) {
                var t = hitTiles[i];
                if (impactTileId && EFFECTS[impactTileId]) {
                    _spawnEffect(EFFECTS[impactTileId], { tx: t.x, ty: t.y });
                }
                if (leaveScorch) {
                    var c = tilePx(t.x, t.y);
                    var zFloor = tileZ(t.x, t.y);
                    _spawn({
                        x: c.x, y: c.y, z: zFloor + 1,
                        mode: 'world', sprite: 'scorch',
                        ml: 2400,
                        size0: ts * 0.85, size1: ts * 0.95,
                        opacity0: 0.85, opacity1: 0,
                    });
                }
            }

            if (beamHeadSprite && hitTiles.length > 0) {
                var last = hitTiles[hitTiles.length - 1];
                var lc = tilePx(last.x, last.y);
                var lzT = unitSurfaceZ(last.x, last.y) + unitZBoost();
                _spawn({
                    x: lc.x, y: lc.y, z: lzT,
                    mode: 'billboard', sprite: beamHeadSprite,
                    ml: 240,
                    size0: ts * 0.5, size1: ts * 0.15,
                    opacity0: 1, opacity1: 0,
                });
            }

            if (impactCenterId && EFFECTS[impactCenterId]
                && typeof state !== 'undefined' && Array.isArray(state.units)) {
                var firstHit = null;
                for (var j = 0; j < hitTiles.length; j++) {
                    var ht = hitTiles[j];
                    var u = state.units.find(function(u) {
                        return !u.dead && !u._dying && u.x === ht.x && u.y === ht.y;
                    });
                    if (u) { firstHit = ht; break; }
                }
                if (firstHit) {
                    _spawnEffect(EFFECTS[impactCenterId], { tx: firstHit.x, ty: firstHit.y });
                }
            }
        }, chargeMs);
    }

    /* ─── BOLT SYSTEM ────────────────────────────────────────────────────
       A bright energy projectile that travels from caster to target with
       spell-specific core/trail/burst sprites. Mapped via SPELL_MAP bolt
       entries. Falls through to generic projectile() if no mapping exists.
       ──────────────────────────────────────────────────────────────────── */
    var _boltEffects = [];

    function _fireBoltMapped(spellId, params) {
        if (_catOff('projectiles') || !_canSpawn()) return;
        if (!params) return;

        var boltEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].bolt;
        if (!boltEffectId) return;
        var boltDef = EFFECTS[boltEffectId];
        if (!boltDef) return;

        var ts = (_cfg().tileSize || 128);
        var fromTx = params.fromX, fromTy = params.fromY;
        var toTx = params.toX, toTy = params.toY;

        var from = tilePx(fromTx, fromTy);
        var to = tilePx(toTx, toTy);
        var fz = (params.fromZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(params.fromZ) : unitSurfaceZ(fromTx, fromTy);
        var tz = (params.toZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(params.toZ) : unitSurfaceZ(toTx, toTy);

        var boost = unitZBoost();
        fz += boost; tz += boost;

        var dx = to.x - from.x, dy = to.y - from.y, dz = tz - fz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        var flyMs = params.flyMs > 0 ? params.flyMs : Math.max(180, (dist / 600) * 1000);

        /* Extract bolt config from effect definition */
        var coreSprite   = boltDef.boltCore    || 'flash';
        var trailSprite  = boltDef.boltTrail   || 'ember';
        var burstSprite  = boltDef.boltBurst   || 'flash';
        var ringSprite   = boltDef.boltRing    || 'target-ring';
        var coreSize     = boltDef.boltCoreSize  || 0.14;
        var trailSize    = boltDef.boltTrailSize || 0.05;
        var trailRate    = boltDef.boltTrailRate || 7;
        var burstCount   = boltDef.boltBurstCount || 30;
        var headGlow     = boltDef.boltHeadGlow !== false;
        var shake        = boltDef.shake || null;

        /* Muzzle flash at caster */
        _spawn({
            x: from.x, y: from.y, z: fz,
            mode: 'billboard', sprite: 'flash',
            ml: 160,
            size0: ts * 0.30, size1: ts * 0.06,
            opacity0: 0.95, opacity1: 0,
        });

        _boltEffects.push({
            from: { x: from.x, y: from.y, z: fz },
            to: { x: to.x, y: to.y, z: tz },
            dx: dx / dist, dy: dy / dist, dz: dz / dist,
            dist: dist,
            durMs: flyMs,
            elapsed: 0,
            hit: false,
            coreSprite: coreSprite,
            trailSprite: trailSprite,
            burstSprite: burstSprite,
            ringSprite: ringSprite,
            coreSize: coreSize,
            trailSize: trailSize,
            trailRate: trailRate,
            burstCount: burstCount,
            headGlow: headGlow,
            shake: shake,
            spawnAcc: 0,
            ts: ts,
            toTx: toTx,
            toTy: toTy,
            spellId: spellId,
        });
    }

    /* ── fireBoltDirect: fire a bolt using a preset key directly (for unit overrides) ── */
    function fireBoltDirect(presetKey, params) {
        if (_catOff('projectiles') || !_canSpawn()) return;
        if (!params || !presetKey) return;

        var boltDef = EFFECTS[presetKey];
        if (!boltDef) return;

        var ts = (_cfg().tileSize || 128);
        var fromTx = params.fromX, fromTy = params.fromY;
        var toTx = params.toX, toTy = params.toY;

        var from = tilePx(fromTx, fromTy);
        var to = tilePx(toTx, toTy);
        var fz = (params.fromZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(params.fromZ) : unitSurfaceZ(fromTx, fromTy);
        var tz = (params.toZ != null && typeof window._getElevationPx === 'function')
            ? window._getElevationPx(params.toZ) : unitSurfaceZ(toTx, toTy);

        var boost = unitZBoost();
        fz += boost; tz += boost;

        var dx = to.x - from.x, dy = to.y - from.y, dz = tz - fz;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        var flyMs = params.flyMs > 0 ? params.flyMs : Math.max(180, (dist / 600) * 1000);

        var coreSprite   = boltDef.boltCore    || 'flash';
        var trailSprite  = boltDef.boltTrail   || 'ember';
        var burstSprite  = boltDef.boltBurst   || 'flash';
        var ringSprite   = boltDef.boltRing    || 'target-ring';
        var coreSize     = boltDef.boltCoreSize  || 0.14;
        var trailSize    = boltDef.boltTrailSize || 0.05;
        var trailRate    = boltDef.boltTrailRate || 7;
        var burstCount   = boltDef.boltBurstCount || 30;
        var headGlow     = boltDef.boltHeadGlow !== false;

        /* Muzzle flash at caster */
        _spawn({
            x: from.x, y: from.y, z: fz,
            mode: 'billboard', sprite: 'flash',
            ml: 160,
            size0: ts * 0.30, size1: ts * 0.06,
            opacity0: 0.95, opacity1: 0,
        });

        _boltEffects.push({
            from: { x: from.x, y: from.y, z: fz },
            to: { x: to.x, y: to.y, z: tz },
            dx: dx / dist, dy: dy / dist, dz: dz / dist,
            dist: dist,
            durMs: flyMs,
            elapsed: 0,
            hit: false,
            coreSprite: coreSprite,
            trailSprite: trailSprite,
            burstSprite: burstSprite,
            ringSprite: ringSprite,
            coreSize: coreSize,
            trailSize: trailSize,
            trailRate: trailRate,
            burstCount: burstCount,
            headGlow: headGlow,
            shake: null,
            spawnAcc: 0,
            ts: ts,
            toTx: toTx,
            toTy: toTy,
            spellId: null,
        });
    }

    function _tickBolts(dt) {
        var dtMs = dt * 1000;
        for (var i = _boltEffects.length - 1; i >= 0; i--) {
            var e = _boltEffects[i];
            e.elapsed += dtMs;
            var p = Math.min(e.elapsed / e.durMs, 1);

            var hx = lerp(e.from.x, e.to.x, p);
            var hy = lerp(e.from.y, e.to.y, p);
            var hz = lerp(e.from.z, e.to.z, p);

            if (p < 1) {
                /* ── Head glow (large bright core) ── */
                if (e.headGlow) {
                    e.spawnAcc += dtMs;
                    while (e.spawnAcc >= e.trailRate) {
                        e.spawnAcc -= e.trailRate;

                        /* Bright core particle */
                        _spawn({
                            x: hx + rn(-2, 2), y: hy + rn(-2, 2), z: hz + rn(-2, 2),
                            mode: 'billboard', sprite: e.coreSprite,
                            ml: 80 + rn(0, 40),
                            size0: e.ts * e.coreSize + rn(0, e.ts * 0.04),
                            size1: e.ts * 0.02,
                            opacity0: 1, opacity1: 0,
                        });

                        /* Inner white-hot flash */
                        _spawn({
                            x: hx, y: hy, z: hz,
                            mode: 'billboard', sprite: 'flash',
                            ml: 60 + rn(0, 30),
                            size0: e.ts * (e.coreSize * 0.7) + rn(0, e.ts * 0.02),
                            size1: 0,
                            opacity0: 0.9, opacity1: 0,
                        });

                        /* Trail particles (drift backward) */
                        _spawn({
                            x: hx + rn(-5, 5), y: hy + rn(-5, 5), z: hz + rn(-3, 3),
                            vx: -e.dx * rn(30, 80) + rn(-20, 20),
                            vy: -e.dy * rn(30, 80) + rn(-20, 20),
                            vz: -e.dz * rn(15, 40) + rn(-12, 12),
                            mode: 'billboard', sprite: e.trailSprite,
                            ml: 180 + rn(0, 250),
                            size0: e.ts * e.trailSize + rn(0, e.ts * 0.03),
                            size1: 0,
                            opacity0: 0.8 + rn(0, 0.2), opacity1: 0,
                            drag: 1.8,
                        });
                    }
                }
            }

            /* ── Impact burst ── */
            if (p >= 1 && !e.hit) {
                e.hit = true;
                var tx = e.to.x, ty = e.to.y, tz2 = e.to.z;

                /* Bright flash */
                for (var j = 0; j < 4; j++) {
                    _spawn({
                        x: tx + rn(-3, 3), y: ty + rn(-3, 3), z: tz2 + rn(-3, 3),
                        mode: 'billboard', sprite: 'flash',
                        ml: 100 + rn(0, 50),
                        size0: e.ts * 0.32 + rn(0, e.ts * 0.12),
                        size1: e.ts * 0.04,
                        opacity0: 1, opacity1: 0,
                    });
                }

                /* Burst particles */
                for (var k = 0; k < e.burstCount; k++) {
                    var ang = rn(0, 6.28);
                    var elev = rn(-0.4, 0.9);
                    var spd = rn(60, 250);
                    _spawn({
                        x: tx + rn(-4, 4), y: ty + rn(-4, 4), z: tz2 + rn(-3, 3),
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        vz: elev * spd * 0.5,
                        mode: 'billboard', sprite: e.burstSprite,
                        ml: 200 + rn(0, 400),
                        size0: e.ts * 0.09 + rn(0, e.ts * 0.07),
                        size1: 0,
                        opacity0: 0.7 + rn(0, 0.3), opacity1: 0,
                        drag: 2.2,
                        gravity: -25,
                    });
                }

                /* Ground ring */
                _spawn({
                    x: tx, y: ty, z: tz2 - unitZBoost(),
                    mode: 'world', sprite: e.ringSprite,
                    ml: 650,
                    size0: e.ts * 0.4, size1: e.ts * 1.4,
                    opacity0: 0.85, opacity1: 0,
                });

                /* Screen shake if configured */
                if (e.shake && typeof window.shakeBoard === 'function') {
                    window.shakeBoard(e.shake);
                }

                /* Fire the spell's normal impact VFX if it also has one */
                if (SPELL_MAP[e.spellId] && SPELL_MAP[e.spellId].impact) {
                    var impDef = EFFECTS[SPELL_MAP[e.spellId].impact];
                    if (impDef) {
                        _spawnEffect(impDef, { tx: e.toTx, ty: e.toTy });
                    }
                }
            }

            if (e.elapsed > e.durMs + 600) {
                _boltEffects.splice(i, 1);
            }
        }
    }

    function _fireAoeMapped(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        if (!params) return;

        var aoeEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].aoe;
        if (!aoeEffectId) return;
        var aoeDef = EFFECTS[aoeEffectId];
        if (!aoeDef) return;

        var tx = params.tx, ty = params.ty;
        if (tx == null || ty == null) return;

        var aoeRadius = (params.aoeRadius != null)
            ? params.aoeRadius
            : (aoeDef.aoeRadius != null ? aoeDef.aoeRadius : 0);
        var shape = aoeDef.shape || 'square';
        var tileOffsets = _buildTileOffsets(shape, aoeRadius);

        if (aoeDef.missiles && params.cx != null && params.cy != null) {
            var m = aoeDef.missiles;
            var casterPx = tilePx(params.cx, params.cy);
            var casterZ = unitSurfaceZ(params.cx, params.cy) + unitZBoost();
            var cfg2 = _cfg();
            var ts = cfg2.tileSize || 128;
            for (var i = 0; i < tileOffsets.length; i++) {
                (function(off, idx) {
                    var ttx = tx + off.dx, tty = ty + off.dy;
                    var targetPx = tilePx(ttx, tty);
                    var targetElev = tileZ(ttx, tty);
                    var dxPx = targetPx.x - casterPx.x;
                    var dyPx = targetPx.y - casterPx.y;
                    var dist = Math.sqrt(dxPx * dxPx + dyPx * dyPx) || 1;
                    var flyMs = m.flyMs || 350;
                    var stagger = (m.stagger || 40) * (Math.abs(off.dx) + Math.abs(off.dy));
                    var arcZ = (m.arcHeight || 200);
                    window.setTimeout(function() {
                        if (_suppressed()) return;
                        var spriteW = m.w || 128;
                        var spriteH = m.h || 128;
                        var speed = dist / (flyMs / 1000);
                        var vxMs = (dxPx / dist) * speed;
                        var vyMs = (dyPx / dist) * speed;
                        var tSec = flyMs / 1000;
                        var gravMs = (m.gravity || 800);
                        var startZ = casterZ + 40;
                        var endZ = targetElev + 10;
                        var vzInit = (endZ - startZ + 0.5 * gravMs * tSec * tSec) / tSec + arcZ / tSec;
                        _spawn({
                            x: casterPx.x, y: casterPx.y, z: startZ,
                            vx: vxMs, vy: vyMs, vz: vzInit,
                            mode: 'billboard',
                            sprite: m.sprite || 'missile',
                            ml: flyMs,
                            w0: spriteW, w1: spriteW,
                            h0: spriteH, h1: spriteH,
                            opacity0: 1, opacity1: 1,
                            gravity: gravMs, drag: 0,
                            trackHeading: true,
                            headingOffset: 45,
                        });
                        if (m.trail !== false) {
                            var trailCount = m.trailCount || 4;
                            var trailInterval = flyMs * 0.7 / trailCount;
                            for (var ti = 0; ti < trailCount; ti++) {
                                (function(tIdx) {
                                    window.setTimeout(function() {
                                        if (_suppressed()) return;
                                        var elapsed = (tIdx * trailInterval) / 1000;
                                        var mx = casterPx.x + vxMs * elapsed;
                                        var my = casterPx.y + vyMs * elapsed;
                                        var mz = startZ + vzInit * elapsed - 0.5 * gravMs * elapsed * elapsed;
                                        _spawn({
                                            x: mx + rn(-4, 4), y: my + rn(-4, 4), z: mz + rn(-4, 4),
                                            mode: 'billboard', sprite: 'smoke',
                                            ml: rn(300, 500),
                                            size0: rn(8, 14), size1: rn(20, 35),
                                            opacity0: 0.45, opacity1: 0,
                                            vz: rn(10, 25), drag: 0.5,
                                        });
                                    }, tIdx * trailInterval);
                                })(ti);
                            }
                        }
                    }, stagger);
                })(tileOffsets[i], i);
            }
        }

        if (_spell3DGeometry[spellId]) {
            _spell3DGeometry[spellId](tx, ty, aoeRadius);
        }

        if (aoeDef.missiles && params.cx != null) {
            var impactDelay = (aoeDef.missiles.flyMs || 350);
            window.setTimeout(function() {
                if (_suppressed()) return;
                _emitAoeBursts(tileOffsets, tx, ty,
                    aoeDef.impactTileEffect, aoeDef.impactCenterEffect, aoeRadius);
            }, impactDelay);
        } else {
            _emitAoeBursts(tileOffsets, tx, ty,
                aoeDef.impactTileEffect, aoeDef.impactCenterEffect, aoeRadius);
        }

        if (window.ThreeLightning &&
            /emp|thunder|lightning|yellowThunder|sentaiYellowThunder|overcharge|signalPulse|deadAir/i.test(spellId)) {
            var _aoeLightDelay = (aoeDef.missiles && params.cx != null) ? (aoeDef.missiles.flyMs || 350) : 0;
            for (var _ali = 0; _ali < tileOffsets.length; _ali++) {
                (function(off, idx) {
                    window.setTimeout(function() {
                        if (typeof state !== 'undefined' && state.devAutoSim && !state._devSimShowAnims) return;
                        ThreeLightning.strikeFromSky(tx + off.dx, ty + off.dy, {
                            durationMs: 250,
                            segments: 12,
                            jitter: 0.3,
                            branchChance: off.dx === 0 && off.dy === 0 ? 0.35 : 0.15,
                            branchDepth: 1,
                            coreWidth: off.dx === 0 && off.dy === 0 ? 6 : 4,
                            glowWidth: off.dx === 0 && off.dy === 0 ? 18 : 11,
                            skyHeight: 600,
                        });
                    }, _aoeLightDelay + idx * 35);
                })(tileOffsets[_ali], _ali);
            }
        }
    }

    var _activeBubbleDomes = [];

    function _spawnBubbleDome(tx, ty, aoeRadius) {
        var scene = window.ThreeVFX && window.ThreeVFX._getScene
            ? window.ThreeVFX._getScene() : null;
        if (!scene) return;

        var cfg = _cfg();
        var ts  = cfg.tileSize || 128;
        var pad = cfg.boardPadding || 2;
        var SLAB = 3;

        var footprint = (aoeRadius * 2 + 1) * ts;
        var domeRadius = footprint * 0.55;
        var domeHeight = domeRadius * 0.75;

        var center = tilePx(tx, ty);
        var worldX = center.x - pad;
        var worldZ = center.y - pad;
        var floorY = unitSurfaceZ(tx, ty) + SLAB;

        var geo = new THREE.SphereGeometry(
            1, 32, 16,
            0, Math.PI * 2,
            0, Math.PI * 0.5
        );

        var matOuter = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x32aa50),
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var domeOuter = new THREE.Mesh(geo, matOuter);
        domeOuter.scale.set(0.01, 0.01, 0.01);
        domeOuter.position.set(worldX, floorY, worldZ);
        domeOuter.renderOrder = 150;
        scene.add(domeOuter);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x64ff96),
            transparent: true,
            opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var domeInner = new THREE.Mesh(geo, matInner);
        domeInner.scale.set(0.01, 0.01, 0.01);
        domeInner.position.set(worldX, floorY, worldZ);
        domeInner.renderOrder = 151;
        scene.add(domeInner);

        var wfGeo = new THREE.SphereGeometry(
            1, 12, 6,
            0, Math.PI * 2,
            0, Math.PI * 0.5
        );
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ffbb),
            transparent: true,
            opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var domeWire = new THREE.Mesh(wfGeo, matWire);
        domeWire.scale.set(0.01, 0.01, 0.01);
        domeWire.position.set(worldX, floorY, worldZ);
        domeWire.renderOrder = 152;
        scene.add(domeWire);

        var startTime = performance.now();
        var expandMs   = 350;
        var holdMs     = 800;
        var fadeMs     = 500;
        var totalMs    = expandMs + holdMs + fadeMs;

        var outerScale = domeRadius;
        var innerScale = domeRadius * 0.92;
        var wireScale  = domeRadius * 1.03;

        var ySquash = domeHeight / domeRadius;

        var entry = { domeOuter: domeOuter, domeInner: domeInner, domeWire: domeWire,
                      matOuter: matOuter, matInner: matInner, matWire: matWire,
                      geo: geo, wfGeo: wfGeo, done: false };
        _activeBubbleDomes.push(entry);

        function animate() {
            if (entry.done) return;
            var elapsed = performance.now() - startTime;
            if (elapsed >= totalMs) {

                scene.remove(domeOuter); scene.remove(domeInner); scene.remove(domeWire);
                matOuter.dispose(); matInner.dispose(); matWire.dispose();
                geo.dispose(); wfGeo.dispose();
                entry.done = true;
                var idx = _activeBubbleDomes.indexOf(entry);
                if (idx >= 0) _activeBubbleDomes.splice(idx, 1);
                return;
            }

            var t, s, opacity;

            if (elapsed < expandMs) {

                t = elapsed / expandMs;
                var ease = 1 - Math.pow(1 - t, 3);
                s = ease;
                opacity = ease * 0.9;
            } else if (elapsed < expandMs + holdMs) {

                t = (elapsed - expandMs) / holdMs;
                var pulse = 1 + 0.03 * Math.sin(t * Math.PI * 4);
                s = pulse;
                opacity = 0.9;
            } else {

                t = (elapsed - expandMs - holdMs) / fadeMs;
                var fadeEase = 1 - t;
                s = 1 + t * 0.1;
                opacity = 0.9 * fadeEase;
            }

            domeOuter.scale.set(outerScale * s, outerScale * s * ySquash, outerScale * s);
            matOuter.opacity = opacity * 0.28;

            domeInner.scale.set(innerScale * s, innerScale * s * ySquash, innerScale * s);
            matInner.opacity = opacity * 0.18;

            var wireRot = elapsed * 0.0004;
            domeWire.scale.set(wireScale * s, wireScale * s * ySquash, wireScale * s);
            domeWire.rotation.y = wireRot;
            matWire.opacity = opacity * 0.35;

            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

    var _active3DGeom = [];

    function _getVFXScene() {
        return window.ThreeVFX && window.ThreeVFX._getScene
            ? window.ThreeVFX._getScene() : null;
    }

    function _worldPos(tx, ty) {
        var cfg2 = _cfg();
        var ts  = cfg2.tileSize || 128;
        var pad = cfg2.boardPadding || 2;
        var SLAB = 3;
        var center = tilePx(tx, ty);
        return {
            x: center.x - pad,
            z: center.y - pad,
            y: unitSurfaceZ(tx, ty) + SLAB,
            ts: ts
        };
    }

    function _animate3D(entry, totalMs, tickFn) {
        var startTime = performance.now();
        _active3DGeom.push(entry);
        function loop() {
            if (entry.done) return;
            var elapsed = performance.now() - startTime;
            if (elapsed >= totalMs) {
                _cleanup3D(entry);
                return;
            }
            tickFn(elapsed, totalMs);
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    function _cleanup3D(entry) {
        if (entry.done) return;
        entry.done = true;
        var scene = _getVFXScene();
        if (entry.meshes) {
            for (var i = 0; i < entry.meshes.length; i++) {
                if (scene) scene.remove(entry.meshes[i]);
                if (entry.meshes[i].material) entry.meshes[i].material.dispose();
                if (entry.meshes[i].geometry) entry.meshes[i].geometry.dispose();
            }
        }
        var idx = _active3DGeom.indexOf(entry);
        if (idx >= 0) _active3DGeom.splice(idx, 1);
    }

    function _addMesh(scene, geo, mat, pos, renderOrder) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(0.01, 0.01, 0.01);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.renderOrder = renderOrder || 150;
        scene.add(mesh);
        return mesh;
    }

    function _spawnDome3D(tx, ty, aoeRadius, opts) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var domeRadius = footprint * (opts.radiusScale || 0.55);
        var domeHeight = domeRadius * (opts.heightRatio || 0.75);
        var ySquash = domeHeight / domeRadius;

        var geo = new THREE.SphereGeometry(1, opts.segments || 32, opts.rings || 16,
            0, Math.PI * 2, 0, Math.PI * 0.5);

        var matOuter = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.outerColor || 0xffffff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var domeOuter = _addMesh(scene, geo, matOuter, wp, 150);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.innerColor || 0xffffff),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var domeInner = _addMesh(scene, geo, matInner, wp, 151);

        var wfSeg = opts.wireSegments || 12;
        var wfRings = opts.wireRings || 6;
        var wfGeo = new THREE.SphereGeometry(1, wfSeg, wfRings,
            0, Math.PI * 2, 0, Math.PI * 0.5);
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.wireColor || opts.innerColor || 0xffffff),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var domeWire = _addMesh(scene, wfGeo, matWire, wp, 152);

        var outerScale = domeRadius;
        var innerScale = domeRadius * 0.92;
        var wireScale  = domeRadius * 1.03;

        var expandMs = opts.expandMs || 350;
        var holdMs   = opts.holdMs   || 800;
        var fadeMs   = opts.fadeMs   || 500;
        var totalMs  = expandMs + holdMs + fadeMs;

        var outerOpacity = opts.outerOpacity != null ? opts.outerOpacity : 0.28;
        var innerOpacity = opts.innerOpacity != null ? opts.innerOpacity : 0.18;
        var wireOpacity  = opts.wireOpacity  != null ? opts.wireOpacity  : 0.35;
        var wireRotSpeed = opts.wireRotSpeed != null ? opts.wireRotSpeed : 0.0004;

        var entry = { meshes: [domeOuter, domeInner, domeWire], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                var ease = 1 - Math.pow(1 - t, 3);
                s = ease; opacity = ease * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.03 * Math.sin(t * Math.PI * 4);
                opacity = 0.9;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 + t * 0.1;
                opacity = 0.9 * (1 - t);
            }

            domeOuter.scale.set(outerScale * s, outerScale * s * ySquash, outerScale * s);
            matOuter.opacity = opacity * outerOpacity;

            domeInner.scale.set(innerScale * s, innerScale * s * ySquash, innerScale * s);
            matInner.opacity = opacity * innerOpacity;

            domeWire.scale.set(wireScale * s, wireScale * s * ySquash, wireScale * s);
            domeWire.rotation.y = elapsed * wireRotSpeed;
            matWire.opacity = opacity * wireOpacity;
        });
    }

    function _spawnGravityWell3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var coneRadius = footprint * 0.5;
        var coneHeight = coneRadius * 1.2;

        var coneGeo = new THREE.ConeGeometry(1, 1, 24, 1, true);

        var matVortex = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x6622aa),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var cone = new THREE.Mesh(coneGeo, matVortex);
        cone.scale.set(0.01, 0.01, 0.01);

        cone.rotation.x = Math.PI;
        cone.position.set(wp.x, wp.y + coneHeight * 0.5, wp.z);
        cone.renderOrder = 150;
        scene.add(cone);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xcc44ff),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var coneInner = new THREE.Mesh(coneGeo, matInner);
        coneInner.scale.set(0.01, 0.01, 0.01);
        coneInner.rotation.x = Math.PI;
        coneInner.position.set(wp.x, wp.y + coneHeight * 0.5, wp.z);
        coneInner.renderOrder = 151;
        scene.add(coneInner);

        var ringGeo = new THREE.TorusGeometry(1, 0.08, 8, 24);
        var matRing = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaa66ff),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring = new THREE.Mesh(ringGeo, matRing);
        ring.scale.set(0.01, 0.01, 0.01);
        ring.position.set(wp.x, wp.y + coneHeight, wp.z);
        ring.rotation.x = Math.PI * 0.5;
        ring.renderOrder = 152;
        scene.add(ring);

        var expandMs = 300, holdMs = 700, fadeMs = 500;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [cone, coneInner, ring], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.04 * Math.sin(t * Math.PI * 6);
                opacity = 0.9;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 - t * 0.3; opacity = 0.9 * (1 - t);
            }

            var spin = elapsed * 0.003;

            cone.scale.set(coneRadius * s, coneHeight * s, coneRadius * s);
            cone.rotation.y = spin;
            matVortex.opacity = opacity * 0.25;

            coneInner.scale.set(coneRadius * s * 0.8, coneHeight * s * 0.9, coneRadius * s * 0.8);
            coneInner.rotation.y = -spin * 1.5;
            matInner.opacity = opacity * 0.18;

            var ringPulse = 1 + 0.06 * Math.sin(elapsed * 0.012);
            ring.scale.set(coneRadius * s * ringPulse, coneRadius * s * ringPulse, coneRadius * s * ringPulse);
            ring.rotation.z = spin * 2;
            matRing.opacity = opacity * 0.4;
        });
    }

    function _spawnWhirlpool3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var torusRadius = footprint * 0.45;
        var tubeRadius = torusRadius * 0.25;

        var torusGeo = new THREE.TorusGeometry(1, 0.25, 12, 32);
        var matTorus = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x2288cc),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var torus = new THREE.Mesh(torusGeo, matTorus);
        torus.scale.set(0.01, 0.01, 0.01);
        torus.position.set(wp.x, wp.y + 4, wp.z);
        torus.rotation.x = Math.PI * 0.5;
        torus.renderOrder = 150;
        scene.add(torus);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x66ccff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var torusInner = new THREE.Mesh(torusGeo, matInner);
        torusInner.scale.set(0.01, 0.01, 0.01);
        torusInner.position.set(wp.x, wp.y + 6, wp.z);
        torusInner.rotation.x = Math.PI * 0.5;
        torusInner.renderOrder = 151;
        scene.add(torusInner);

        var wfGeo = new THREE.TorusGeometry(1, 0.15, 6, 16);
        var matWf = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaddff),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var torusWf = new THREE.Mesh(wfGeo, matWf);
        torusWf.scale.set(0.01, 0.01, 0.01);
        torusWf.position.set(wp.x, wp.y + 2, wp.z);
        torusWf.rotation.x = Math.PI * 0.5;
        torusWf.renderOrder = 152;
        scene.add(torusWf);

        var expandMs = 300, holdMs = 600, fadeMs = 500;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [torus, torusInner, torusWf], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.03 * Math.sin(t * Math.PI * 4);
                opacity = 0.9;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 + t * 0.05; opacity = 0.9 * (1 - t);
            }

            var spin = elapsed * 0.004;

            torus.scale.set(torusRadius * s, torusRadius * s, tubeRadius * s);
            torus.rotation.z = spin;
            matTorus.opacity = opacity * 0.35;

            var innerS = s * 0.65;
            torusInner.scale.set(torusRadius * innerS, torusRadius * innerS, tubeRadius * innerS * 0.8);
            torusInner.rotation.z = -spin * 1.6;
            matInner.opacity = opacity * 0.25;

            torusWf.scale.set(torusRadius * s * 1.1, torusRadius * s * 1.1, tubeRadius * s * 0.6);
            torusWf.rotation.z = spin * 2.2;
            matWf.opacity = opacity * 0.3;
        });
    }

    function _spawnAbductionBeam3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var beamHeight = ts * 3;
        var topRadius = ts * 0.15;
        var bottomRadius = ts * 0.6;

        var coneGeo = new THREE.CylinderGeometry(topRadius / bottomRadius, 1, 1, 16, 1, true);

        var matBeam = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x44ff88),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var beam = new THREE.Mesh(coneGeo, matBeam);
        beam.scale.set(0.01, 0.01, 0.01);
        beam.position.set(wp.x, wp.y + beamHeight * 0.5, wp.z);
        beam.renderOrder = 148;
        scene.add(beam);

        var matCore = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaffcc),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var beamCore = new THREE.Mesh(coneGeo, matCore);
        beamCore.scale.set(0.01, 0.01, 0.01);
        beamCore.position.set(wp.x, wp.y + beamHeight * 0.5, wp.z);
        beamCore.renderOrder = 149;
        scene.add(beamCore);

        var expandMs = 250, holdMs = 1200, fadeMs = 400;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [beam, beamCore], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.02 * Math.sin(t * Math.PI * 6);
                opacity = 1;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1; opacity = 1 - t;
            }

            var wobble = Math.sin(elapsed * 0.008) * 0.02;

            beam.scale.set(bottomRadius * s, beamHeight * s, bottomRadius * s);
            beam.rotation.y = elapsed * 0.001;
            beam.rotation.z = wobble;
            matBeam.opacity = opacity * 0.2;

            beamCore.scale.set(bottomRadius * s * 0.5, beamHeight * s, bottomRadius * s * 0.5);
            beamCore.rotation.y = -elapsed * 0.0015;
            beamCore.rotation.z = -wobble;
            matCore.opacity = opacity * 0.15;
        });
    }

    function _spawnNukeCloud3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;

        var stemRadius = footprint * 0.12;
        var stemHeight = footprint * 0.9;
        var capRadius  = footprint * 0.4;
        var capHeight  = capRadius * 0.6;

        var stemGeo = new THREE.CylinderGeometry(0.7, 1, 1, 12, 1, true);
        var matStem = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xff6600),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var stem = new THREE.Mesh(stemGeo, matStem);
        stem.scale.set(0.01, 0.01, 0.01);
        stem.position.set(wp.x, wp.y + stemHeight * 0.5, wp.z);
        stem.renderOrder = 153;
        scene.add(stem);

        var capGeo = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var matCap = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xff4400),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var cap = new THREE.Mesh(capGeo, matCap);
        cap.scale.set(0.01, 0.01, 0.01);
        cap.position.set(wp.x, wp.y + stemHeight, wp.z);
        cap.renderOrder = 154;
        scene.add(cap);

        var matCapGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xffaa44),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var capGlow = new THREE.Mesh(capGeo, matCapGlow);
        capGlow.scale.set(0.01, 0.01, 0.01);
        capGlow.position.set(wp.x, wp.y + stemHeight, wp.z);
        capGlow.renderOrder = 155;
        scene.add(capGlow);

        var collarGeo = new THREE.TorusGeometry(1, 0.3, 8, 20);
        var matCollar = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xff8833),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var collar = new THREE.Mesh(collarGeo, matCollar);
        collar.scale.set(0.01, 0.01, 0.01);
        collar.position.set(wp.x, wp.y + stemHeight * 0.85, wp.z);
        collar.rotation.x = Math.PI * 0.5;
        collar.renderOrder = 156;
        scene.add(collar);

        var riseMs = 600, holdMs = 800, fadeMs = 600;
        var totalMs = riseMs + holdMs + fadeMs;

        var entry = { meshes: [stem, cap, capGlow, collar], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity, rise;
            if (elapsed < riseMs) {
                t = elapsed / riseMs;
                s = 1 - Math.pow(1 - t, 2);
                rise = s;
                opacity = s;
            } else if (elapsed < riseMs + holdMs) {
                t = (elapsed - riseMs) / holdMs;
                s = 1 + 0.05 * Math.sin(t * Math.PI * 3);
                rise = 1;
                opacity = 1;
            } else {
                t = (elapsed - riseMs - holdMs) / fadeMs;
                s = 1 + t * 0.15;
                rise = 1 + t * 0.1;
                opacity = 1 - t;
            }

            stem.scale.set(stemRadius * s, stemHeight * rise, stemRadius * s);
            stem.position.y = wp.y + stemHeight * rise * 0.5;
            matStem.opacity = opacity * 0.3;

            var capS = s * (elapsed < riseMs ? s : 1);
            cap.scale.set(capRadius * capS, capHeight * capS, capRadius * capS);
            cap.position.y = wp.y + stemHeight * rise;
            matCap.opacity = opacity * 0.25;

            capGlow.scale.set(capRadius * capS * 0.85, capHeight * capS * 0.85, capRadius * capS * 0.85);
            capGlow.position.y = wp.y + stemHeight * rise;
            matCapGlow.opacity = opacity * 0.18;

            collar.scale.set(stemRadius * s * 2, stemRadius * s * 2, stemRadius * s * 0.5);
            collar.position.y = wp.y + stemHeight * rise * 0.85;
            matCollar.opacity = opacity * 0.22;
        });
    }

    function _spawnMeteorSphere3D(tx, ty, descentMs, telegraphMs) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var meteorRadius = ts * 0.45;
        var startZ = wp.y + 900;
        var endZ = wp.y;

        var rockGeo = new THREE.IcosahedronGeometry(1, 1);
        var posAttr = rockGeo.getAttribute('position');
        for (var vi = 0; vi < posAttr.count; vi++) {
            var vx = posAttr.getX(vi);
            var vy = posAttr.getY(vi);
            var vz = posAttr.getZ(vi);
            var noise = 1 + 0.2 * Math.sin(vx * 8.1 + vy * 12.3) * Math.cos(vz * 6.2 + vx * 4.1);
            posAttr.setXYZ(vi, vx * noise, vy * noise, vz * noise);
        }
        posAttr.needsUpdate = true;
        rockGeo.computeVertexNormals();

        var rockTex = _getRocks4Texture();
        var matRock = new THREE.MeshBasicMaterial({
            map: rockTex,
            transparent: false,
            depthWrite: true,
        });
        var rock = new THREE.Mesh(rockGeo, matRock);
        rock.scale.set(0.01, 0.01, 0.01);
        rock.position.set(wp.x, startZ, wp.z);
        rock.renderOrder = 160;
        scene.add(rock);

        var glowGeo = new THREE.SphereGeometry(1, 12, 8);
        var matGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xff4400),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var glow = new THREE.Mesh(glowGeo, matGlow);
        glow.scale.set(0.01, 0.01, 0.01);
        glow.position.set(wp.x, startZ, wp.z);
        glow.renderOrder = 159;
        scene.add(glow);

        var matCore = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xffcc44),
            transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var core = new THREE.Mesh(glowGeo, matCore);
        core.scale.set(0.01, 0.01, 0.01);
        core.position.set(wp.x, startZ, wp.z);
        core.renderOrder = 161;
        scene.add(core);

        var totalMs = descentMs || 700;
        var entry = { meshes: [rock, glow, core], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t = elapsed / totalMs;

            var easeIn = t * t;
            var currentY = startZ + (endZ - startZ) * easeIn;

            var opacity = Math.min(1, t * 3);
            var pulse = 1 + 0.08 * Math.sin(elapsed * 0.02);

            rock.position.y = currentY;
            rock.scale.set(meteorRadius * pulse, meteorRadius * pulse, meteorRadius * pulse);
            rock.rotation.x = elapsed * 0.004;
            rock.rotation.z = elapsed * 0.003;
            rock.rotation.y = elapsed * 0.002;

            var glowScale = meteorRadius * pulse * 1.35;
            glow.position.y = currentY;
            glow.scale.set(glowScale, glowScale, glowScale);
            matGlow.opacity = opacity * 0.25;

            var coreScale = meteorRadius * pulse * 0.65;
            core.position.y = currentY;
            core.scale.set(coreScale, coreScale, coreScale);
            matCore.opacity = opacity * 0.35;
        });
    }

    function _spawnContainmentField3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var cageRadius = ts * 0.55;
        var cageHeight = cageRadius * 1.4;
        var ySquash = cageHeight / cageRadius;

        var sphereGeo = new THREE.SphereGeometry(1, 8, 6);
        var matCage = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x28a0be),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var cage = new THREE.Mesh(sphereGeo, matCage);
        cage.scale.set(0.01, 0.01, 0.01);
        cage.position.set(wp.x, wp.y + cageHeight * 0.5, wp.z);
        cage.renderOrder = 150;
        scene.add(cage);

        var matGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x66ddff),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var glow = new THREE.Mesh(sphereGeo, matGlow);
        glow.scale.set(0.01, 0.01, 0.01);
        glow.position.set(wp.x, wp.y + cageHeight * 0.5, wp.z);
        glow.renderOrder = 151;
        scene.add(glow);

        var fineGeo = new THREE.SphereGeometry(1, 16, 10);
        var matFine = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x44ccee),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var fineWire = new THREE.Mesh(fineGeo, matFine);
        fineWire.scale.set(0.01, 0.01, 0.01);
        fineWire.position.set(wp.x, wp.y + cageHeight * 0.5, wp.z);
        fineWire.renderOrder = 152;
        scene.add(fineWire);

        var expandMs = 250, holdMs = 900, fadeMs = 400;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [cage, glow, fineWire], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;

                var flicker = 1 + 0.08 * Math.sin(elapsed * 0.03) * Math.sin(elapsed * 0.07);
                s = flicker;
                opacity = 0.9 * flicker;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 - t * 0.2; opacity = 0.9 * (1 - t);
            }

            cage.scale.set(cageRadius * s, cageRadius * s * ySquash, cageRadius * s);
            cage.rotation.y = elapsed * 0.0008;
            cage.rotation.z = Math.sin(elapsed * 0.002) * 0.05;
            matCage.opacity = opacity * 0.5;

            glow.scale.set(cageRadius * s * 0.95, cageRadius * s * ySquash * 0.95, cageRadius * s * 0.95);
            matGlow.opacity = opacity * 0.12;

            fineWire.scale.set(cageRadius * s * 1.05, cageRadius * s * ySquash * 1.05, cageRadius * s * 1.05);
            fineWire.rotation.y = -elapsed * 0.0012;
            matFine.opacity = opacity * 0.2;
        });
    }

    function _spawnMushroomRing3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var ringRadius = footprint * 0.45;

        var torusGeo = new THREE.TorusGeometry(1, 0.12, 8, 32);
        var matRing = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x44cc66),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring = new THREE.Mesh(torusGeo, matRing);
        ring.scale.set(0.01, 0.01, 0.01);
        ring.position.set(wp.x, wp.y + 3, wp.z);
        ring.rotation.x = Math.PI * 0.5;
        ring.renderOrder = 148;
        scene.add(ring);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ff99),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ringInner = new THREE.Mesh(torusGeo, matInner);
        ringInner.scale.set(0.01, 0.01, 0.01);
        ringInner.position.set(wp.x, wp.y + 5, wp.z);
        ringInner.rotation.x = Math.PI * 0.5;
        ringInner.renderOrder = 149;
        scene.add(ringInner);

        var expandMs = 400, holdMs = 600, fadeMs = 500;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [ring, ringInner], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.03 * Math.sin(t * Math.PI * 3);
                opacity = 0.9;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1; opacity = 0.9 * (1 - t);
            }

            ring.scale.set(ringRadius * s, ringRadius * s, ringRadius * s * 0.12);
            ring.rotation.z = elapsed * 0.0005;
            matRing.opacity = opacity * 0.35;

            ringInner.scale.set(ringRadius * s * 0.7, ringRadius * s * 0.7, ringRadius * s * 0.1);
            ringInner.rotation.z = -elapsed * 0.0008;
            matInner.opacity = opacity * 0.25;
        });
    }

    function _spawnWardOfThorns3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var ringRadius = ts * 0.45;

        var torusGeo = new THREE.TorusGeometry(1, 0.2, 6, 16);
        var matThorns = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x669933),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var thorns = new THREE.Mesh(torusGeo, matThorns);
        thorns.scale.set(0.01, 0.01, 0.01);
        thorns.position.set(wp.x, wp.y + ts * 0.15, wp.z);
        thorns.rotation.x = Math.PI * 0.5;
        thorns.renderOrder = 148;
        scene.add(thorns);

        var wfGeo = new THREE.TorusGeometry(1, 0.3, 4, 12);
        var matWf = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x99cc44),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var wf = new THREE.Mesh(wfGeo, matWf);
        wf.scale.set(0.01, 0.01, 0.01);
        wf.position.set(wp.x, wp.y + ts * 0.15, wp.z);
        wf.rotation.x = Math.PI * 0.5;
        wf.renderOrder = 149;
        scene.add(wf);

        var expandMs = 300, holdMs = 500, fadeMs = 400;
        var totalMs = expandMs + holdMs + fadeMs;

        var entry = { meshes: [thorns, wf], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3); opacity = s * 0.9;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1; opacity = 0.9;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1; opacity = 0.9 * (1 - t);
            }

            thorns.scale.set(ringRadius * s, ringRadius * s, ringRadius * s * 0.2);
            matThorns.opacity = opacity * 0.4;

            wf.scale.set(ringRadius * s * 1.1, ringRadius * s * 1.1, ringRadius * s * 0.3);
            wf.rotation.z = elapsed * 0.0003;
            matWf.opacity = opacity * 0.3;
        });
    }

    var _boulderTexCache = null;
    var _rocks4TexCache = null;
    var _iceTexCache = null;
    var _woodTexCache = null;
    var _forestTexCache = null;

    function _loadCachedTex(url) {
        var loader = new THREE.TextureLoader();
        var tex = loader.load(url);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    function _getBoulderTexture() {
        if (_boulderTexCache) return _boulderTexCache;
        _boulderTexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/rock.png');
        return _boulderTexCache;
    }
    function _getRocks4Texture() {
        if (_rocks4TexCache) return _rocks4TexCache;
        _rocks4TexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/rocks_4.png');
        return _rocks4TexCache;
    }
    function _getIceTexture() {
        if (_iceTexCache) return _iceTexCache;
        _iceTexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/ice.png');
        return _iceTexCache;
    }
    function _getWoodTexture() {
        if (_woodTexCache) return _woodTexCache;
        _woodTexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/wood.png');
        return _woodTexCache;
    }
    function _getForestTexture() {
        if (_forestTexCache) return _forestTexCache;
        _forestTexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/forest.png');
        return _forestTexCache;
    }

    function _spawnBoulderProjectile3D(fromTx, fromTy, toTx, toTy, travelMs) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp0 = _worldPos(fromTx, fromTy);
        var wp1 = _worldPos(toTx, toTy);
        var ts  = wp0.ts;

        var rockRadius = ts * 0.22;

        var baseGeo = new THREE.IcosahedronGeometry(1, 1);
        var posAttr = baseGeo.getAttribute('position');
        for (var vi = 0; vi < posAttr.count; vi++) {
            var vx = posAttr.getX(vi);
            var vy = posAttr.getY(vi);
            var vz = posAttr.getZ(vi);

            var noise = 1 + 0.25 * Math.sin(vx * 7.3 + vy * 11.1) * Math.cos(vz * 5.7 + vx * 3.2);
            posAttr.setXYZ(vi, vx * noise, vy * noise, vz * noise);
        }
        posAttr.needsUpdate = true;
        baseGeo.computeVertexNormals();

        var rockTex = _getBoulderTexture();
        var matRock = new THREE.MeshBasicMaterial({
            map: rockTex,
            transparent: false,
            depthWrite: true,
        });
        var rock = new THREE.Mesh(baseGeo, matRock);
        rock.scale.set(rockRadius, rockRadius, rockRadius);

        var boost = unitZBoost();
        rock.position.set(wp0.x, wp0.y + boost, wp0.z);
        rock.renderOrder = 160;
        scene.add(rock);

        var shadowGeo = new THREE.CircleGeometry(rockRadius * 0.7, 8);
        var shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.3,
            depthWrite: false, side: THREE.DoubleSide,
        });
        var shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(wp0.x, wp0.y + 2, wp0.z);
        shadow.renderOrder = 140;
        scene.add(shadow);

        var durMs = travelMs || 520;
        var entry = { meshes: [rock, shadow], done: false };

        var dx = wp1.x - wp0.x, dz = wp1.z - wp0.z;
        var flatDist = Math.sqrt(dx * dx + dz * dz);
        var arcPeak = Math.max(ts * 1.5, flatDist * 0.4);

        _animate3D(entry, durMs, function(elapsed) {
            var t = Math.min(elapsed / durMs, 1);

            var cx = wp0.x + (wp1.x - wp0.x) * t;
            var cz = wp0.z + (wp1.z - wp0.z) * t;

            var baseY = wp0.y + boost + (wp1.y + boost - (wp0.y + boost)) * t;
            var arc = arcPeak * 4 * t * (1 - t);
            var cy = baseY + arc;

            rock.position.set(cx, cy, cz);

            rock.rotation.x = elapsed * 0.006;
            rock.rotation.z = elapsed * 0.004;
            rock.rotation.y = elapsed * 0.003;

            var groundY = wp0.y + (wp1.y - wp0.y) * t;
            shadow.position.set(cx, groundY + 2, cz);
            var heightAboveGround = cy - groundY;
            var shadowScale = Math.max(0.3, 1 - heightAboveGround / (arcPeak * 2));
            shadow.scale.set(shadowScale, shadowScale, shadowScale);
            shadowMat.opacity = 0.3 * shadowScale;
        });
    }

    function _buildHurricaneVortex3D(worldX, worldY, worldZ, ts) {
        var scene = _getVFXScene();
        if (!scene) return null;

        var vortexH  = ts * 3.2;
        var botR     = ts * 0.15;
        var topR     = ts * 1.2;

        var group = new THREE.Group();
        group.position.set(worldX, worldY, worldZ);

        var funnelGeo = new THREE.CylinderGeometry(topR, botR, vortexH, 24, 8, true);
        var matFunnel = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x5588bb),
            transparent: true, opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var funnel = new THREE.Mesh(funnelGeo, matFunnel);
        funnel.position.y = vortexH / 2;
        funnel.renderOrder = 145;
        group.add(funnel);

        var innerGeo = new THREE.CylinderGeometry(topR * 0.7, botR * 0.5, vortexH * 0.95, 20, 6, true);
        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ccff),
            transparent: true, opacity: 0.12,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var inner = new THREE.Mesh(innerGeo, matInner);
        inner.position.y = vortexH / 2;
        inner.renderOrder = 146;
        group.add(inner);

        var wireGeo = new THREE.CylinderGeometry(topR * 1.05, botR * 1.1, vortexH * 1.02, 12, 4, true);
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaddff),
            transparent: true, opacity: 0.2,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var wire = new THREE.Mesh(wireGeo, matWire);
        wire.position.y = vortexH / 2;
        wire.renderOrder = 147;
        group.add(wire);

        var mouthGeo = new THREE.TorusGeometry(topR, topR * 0.06, 8, 24);
        var matMouth = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x99bbdd),
            transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var mouth = new THREE.Mesh(mouthGeo, matMouth);
        mouth.rotation.x = Math.PI / 2;
        mouth.position.y = vortexH;
        mouth.renderOrder = 148;
        group.add(mouth);

        var dustGeo = new THREE.TorusGeometry(ts * 0.5, ts * 0.08, 6, 16);
        var matDust = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xbbaa88),
            transparent: true, opacity: 0.2,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var dust = new THREE.Mesh(dustGeo, matDust);
        dust.rotation.x = Math.PI / 2;
        dust.position.y = 4;
        dust.renderOrder = 144;
        group.add(dust);

        scene.add(group);

        return {
            group: group,
            funnel: funnel, matFunnel: matFunnel,
            inner: inner, matInner: matInner,
            wire: wire, matWire: matWire,
            mouth: mouth, matMouth: matMouth,
            dust: dust, matDust: matDust,
            vortexH: vortexH, topR: topR, botR: botR, ts: ts,
            birthTime: performance.now(),
        };
    }

    function _tickHurricaneVortex(vortex, now) {
        var elapsed = now - vortex.birthTime;
        var spin = elapsed * 0.002;

        vortex.funnel.rotation.y = spin;
        var pulse = 1 + 0.04 * Math.sin(elapsed * 0.003);
        vortex.matFunnel.opacity = 0.18 * pulse;

        vortex.inner.rotation.y = -spin * 1.6;
        vortex.matInner.opacity = 0.12 * (1 + 0.06 * Math.sin(elapsed * 0.005));

        vortex.wire.rotation.y = spin * 2.2;
        vortex.wire.rotation.z = Math.sin(elapsed * 0.0015) * 0.04;
        vortex.matWire.opacity = 0.2 + 0.08 * Math.sin(elapsed * 0.004);

        vortex.mouth.rotation.z = spin * 0.8;
        var mouthPulse = 1 + 0.06 * Math.sin(elapsed * 0.006);
        vortex.mouth.scale.set(mouthPulse, mouthPulse, 1);

        vortex.dust.rotation.z = -spin * 3;
        var dustPulse = 1 + 0.1 * Math.sin(elapsed * 0.008);
        vortex.dust.scale.set(dustPulse, dustPulse, 1);
        vortex.matDust.opacity = 0.2 * dustPulse;
    }

    function _disposeHurricaneVortex(vortex) {
        var scene = _getVFXScene();
        if (scene) scene.remove(vortex.group);

        vortex.group.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    function _buildBlizzardVortex3D(worldX, worldY, worldZ, ts) {
        var scene = _getVFXScene();
        if (!scene) return null;

        var vortexH = ts * 2.5;
        var botR    = ts * 0.1;
        var topR    = ts * 0.8;

        var group = new THREE.Group();
        group.position.set(worldX, worldY, worldZ);

        var funnelGeo = new THREE.CylinderGeometry(topR, botR, vortexH, 20, 6, true);
        var matFunnel = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ccff),
            transparent: true, opacity: 0.14,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var funnel = new THREE.Mesh(funnelGeo, matFunnel);
        funnel.position.y = vortexH / 2;
        funnel.renderOrder = 145;
        group.add(funnel);

        var innerGeo = new THREE.CylinderGeometry(topR * 0.6, botR * 0.4, vortexH * 0.9, 16, 5, true);
        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xcceeFF),
            transparent: true, opacity: 0.1,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var inner = new THREE.Mesh(innerGeo, matInner);
        inner.position.y = vortexH / 2;
        inner.renderOrder = 146;
        group.add(inner);

        var wireGeo = new THREE.CylinderGeometry(topR * 1.02, botR * 1.05, vortexH * 0.98, 10, 3, true);
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaddff),
            transparent: true, opacity: 0.16,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var wire = new THREE.Mesh(wireGeo, matWire);
        wire.position.y = vortexH / 2;
        wire.renderOrder = 147;
        group.add(wire);

        var mouthGeo = new THREE.TorusGeometry(topR, topR * 0.05, 6, 20);
        var matMouth = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xbbddff),
            transparent: true, opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var mouth = new THREE.Mesh(mouthGeo, matMouth);
        mouth.rotation.x = Math.PI / 2;
        mouth.position.y = vortexH;
        mouth.renderOrder = 148;
        group.add(mouth);

        var frostGeo = new THREE.TorusGeometry(ts * 0.45, ts * 0.06, 6, 14);
        var matFrost = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x99bbdd),
            transparent: true, opacity: 0.18,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var frost = new THREE.Mesh(frostGeo, matFrost);
        frost.rotation.x = Math.PI / 2;
        frost.position.y = 4;
        frost.renderOrder = 144;
        group.add(frost);

        var iceTex = _getIceTexture();
        var shards = [];
        var shardCount = 5;
        for (var i = 0; i < shardCount; i++) {
            var shGeo = new THREE.OctahedronGeometry(ts * 0.05, 0);
            var shMat = new THREE.MeshBasicMaterial({
                map: iceTex,
                transparent: true, opacity: 0.7,
                depthWrite: false,
            });
            var sh = new THREE.Mesh(shGeo, shMat);
            sh.renderOrder = 149;
            group.add(sh);
            shards.push({ mesh: sh, angle: (i / shardCount) * Math.PI * 2, yOff: 0.3 + Math.random() * 0.5, orbitR: 0.4 + Math.random() * 0.3 });
        }

        scene.add(group);

        return {
            group: group,
            funnel: funnel, matFunnel: matFunnel,
            inner: inner, matInner: matInner,
            wire: wire, matWire: matWire,
            mouth: mouth, matMouth: matMouth,
            frost: frost, matFrost: matFrost,
            shards: shards,
            vortexH: vortexH, topR: topR, botR: botR, ts: ts,
            birthTime: performance.now(),
        };
    }

    function _tickBlizzardVortex(vortex, now) {
        var elapsed = now - vortex.birthTime;
        var spin = elapsed * 0.0015;

        vortex.funnel.rotation.y = spin;
        var pulse = 1 + 0.03 * Math.sin(elapsed * 0.003);
        vortex.matFunnel.opacity = 0.14 * pulse;

        vortex.inner.rotation.y = -spin * 1.4;
        vortex.matInner.opacity = 0.1 * (1 + 0.05 * Math.sin(elapsed * 0.005));

        vortex.wire.rotation.y = spin * 2;
        vortex.wire.rotation.z = Math.sin(elapsed * 0.0012) * 0.03;
        vortex.matWire.opacity = 0.16 + 0.06 * Math.sin(elapsed * 0.004);

        vortex.mouth.rotation.z = spin * 0.6;
        var mouthPulse = 1 + 0.04 * Math.sin(elapsed * 0.005);
        vortex.mouth.scale.set(mouthPulse, mouthPulse, 1);

        vortex.frost.rotation.z = -spin * 2.5;
        var frostPulse = 1 + 0.08 * Math.sin(elapsed * 0.007);
        vortex.frost.scale.set(frostPulse, frostPulse, 1);
        vortex.matFrost.opacity = 0.18 * frostPulse;

        var h = vortex.vortexH;
        for (var i = 0; i < vortex.shards.length; i++) {
            var sd = vortex.shards[i];
            var t = ((elapsed * 0.001) + sd.angle) % (Math.PI * 2);
            var yNorm = (Math.sin(elapsed * 0.0008 + sd.yOff * 6) * 0.5 + 0.5);
            var shardY = h * 0.15 + h * 0.7 * yNorm;

            var radiusMix = yNorm;
            var orbitR = (vortex.botR + (vortex.topR - vortex.botR) * radiusMix) * sd.orbitR;
            sd.mesh.position.set(Math.cos(t) * orbitR, shardY, Math.sin(t) * orbitR);
            sd.mesh.rotation.x = elapsed * 0.003 + i;
            sd.mesh.rotation.z = elapsed * 0.002 + i * 0.5;
        }
    }

    function _disposeBlizzardVortex(vortex) {
        var scene = _getVFXScene();
        if (scene) scene.remove(vortex.group);
        vortex.group.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    // Brown, dusty single-tile vortex for the sandstorm — same shape as the blizzard
    // vortex but sand-colored, with grit motes instead of ice shards.
    function _buildSandstormVortex3D(worldX, worldY, worldZ, ts) {
        var scene = _getVFXScene();
        if (!scene) return null;

        var vortexH = ts * 2.5;
        var botR    = ts * 0.1;
        var topR    = ts * 0.8;

        var group = new THREE.Group();
        group.position.set(worldX, worldY, worldZ);

        var funnelGeo = new THREE.CylinderGeometry(topR, botR, vortexH, 20, 6, true);
        var matFunnel = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xb08a4f),
            transparent: true, opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var funnel = new THREE.Mesh(funnelGeo, matFunnel);
        funnel.position.y = vortexH / 2;
        funnel.renderOrder = 145;
        group.add(funnel);

        var innerGeo = new THREE.CylinderGeometry(topR * 0.6, botR * 0.4, vortexH * 0.9, 16, 5, true);
        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xc8a866),
            transparent: true, opacity: 0.12,
            side: THREE.BackSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var inner = new THREE.Mesh(innerGeo, matInner);
        inner.position.y = vortexH / 2;
        inner.renderOrder = 146;
        group.add(inner);

        var wireGeo = new THREE.CylinderGeometry(topR * 1.02, botR * 1.05, vortexH * 0.98, 10, 3, true);
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xa67c3c),
            transparent: true, opacity: 0.16,
            wireframe: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var wire = new THREE.Mesh(wireGeo, matWire);
        wire.position.y = vortexH / 2;
        wire.renderOrder = 147;
        group.add(wire);

        var mouthGeo = new THREE.TorusGeometry(topR, topR * 0.05, 6, 20);
        var matMouth = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xc2a060),
            transparent: true, opacity: 0.22,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var mouth = new THREE.Mesh(mouthGeo, matMouth);
        mouth.rotation.x = Math.PI / 2;
        mouth.position.y = vortexH;
        mouth.renderOrder = 148;
        group.add(mouth);

        var dustGeo = new THREE.TorusGeometry(ts * 0.45, ts * 0.08, 6, 14);
        var matDust = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x9c7b45),
            transparent: true, opacity: 0.24,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var frost = new THREE.Mesh(dustGeo, matDust);
        frost.rotation.x = Math.PI / 2;
        frost.position.y = 4;
        frost.renderOrder = 144;
        group.add(frost);

        var shards = [];
        var shardCount = 7;
        for (var i = 0; i < shardCount; i++) {
            var shGeo = new THREE.OctahedronGeometry(ts * 0.04, 0);
            var shMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(0x8a6a3a),
                transparent: true, opacity: 0.65,
                depthWrite: false,
            });
            var sh = new THREE.Mesh(shGeo, shMat);
            sh.renderOrder = 149;
            group.add(sh);
            shards.push({ mesh: sh, angle: (i / shardCount) * Math.PI * 2, yOff: 0.3 + Math.random() * 0.5, orbitR: 0.4 + Math.random() * 0.3 });
        }

        scene.add(group);

        return {
            group: group,
            funnel: funnel, matFunnel: matFunnel,
            inner: inner, matInner: matInner,
            wire: wire, matWire: matWire,
            mouth: mouth, matMouth: matMouth,
            frost: frost, matFrost: matDust,
            shards: shards,
            vortexH: vortexH, topR: topR, botR: botR, ts: ts,
            birthTime: performance.now(),
        };
    }

    function _tickSandstormVortex(vortex, now) {
        _tickBlizzardVortex(vortex, now);
    }

    function _disposeSandstormVortex(vortex) {
        _disposeBlizzardVortex(vortex);
    }

    var _ICE_PROJECTILE_IDS = {
        raceIceSpear: true,
    };

    function hasIceProjectile(spellId) {
        return !!_ICE_PROJECTILE_IDS[spellId];
    }

    function _spawnIceSpearProjectile3D(fromTx, fromTy, toTx, toTy, travelMs) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp0 = _worldPos(fromTx, fromTy);
        var wp1 = _worldPos(toTx, toTy);
        var ts  = wp0.ts;
        var shardLen = ts * 0.3;

        var geo = new THREE.OctahedronGeometry(1, 0);
        var iceTex = _getIceTexture();
        var matIce = new THREE.MeshBasicMaterial({
            map: iceTex,
            transparent: true, opacity: 0.85,
            depthWrite: true,
        });
        var shard = new THREE.Mesh(geo, matIce);

        shard.scale.set(shardLen * 0.4, shardLen, shardLen * 0.4);
        var boost = unitZBoost();
        shard.position.set(wp0.x, wp0.y + boost, wp0.z);
        shard.renderOrder = 160;
        scene.add(shard);

        var glowGeo = new THREE.OctahedronGeometry(1, 0);
        var matGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ccff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var glowShard = new THREE.Mesh(glowGeo, matGlow);
        glowShard.scale.set(shardLen * 0.55, shardLen * 1.2, shardLen * 0.55);
        glowShard.position.set(wp0.x, wp0.y + boost, wp0.z);
        glowShard.renderOrder = 159;
        scene.add(glowShard);

        var shadowGeo = new THREE.CircleGeometry(shardLen * 0.4, 6);
        var shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.2,
            depthWrite: false, side: THREE.DoubleSide,
        });
        var shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(wp0.x, wp0.y + 2, wp0.z);
        shadow.renderOrder = 140;
        scene.add(shadow);

        var durMs = travelMs || 450;
        var entry = { meshes: [shard, glowShard, shadow], done: false };

        var dx = wp1.x - wp0.x, dz = wp1.z - wp0.z;
        var flatDist = Math.sqrt(dx * dx + dz * dz);
        var arcPeak = Math.max(ts * 0.8, flatDist * 0.2);

        var heading = Math.atan2(dz, dx);

        _animate3D(entry, durMs, function(elapsed) {
            var t = Math.min(elapsed / durMs, 1);
            var cx = wp0.x + (wp1.x - wp0.x) * t;
            var cz = wp0.z + (wp1.z - wp0.z) * t;
            var baseY = wp0.y + boost + (wp1.y + boost - (wp0.y + boost)) * t;
            var arc = arcPeak * 4 * t * (1 - t);
            var cy = baseY + arc;

            shard.position.set(cx, cy, cz);
            shard.rotation.y = heading;
            shard.rotation.x = elapsed * 0.008;
            shard.rotation.z = -Math.PI * 0.25;

            glowShard.position.set(cx, cy, cz);
            glowShard.rotation.y = heading;
            glowShard.rotation.x = shard.rotation.x;
            glowShard.rotation.z = shard.rotation.z;
            matGlow.opacity = 0.3 + 0.1 * Math.sin(elapsed * 0.015);

            var groundY = wp0.y + (wp1.y - wp0.y) * t;
            shadow.position.set(cx, groundY + 2, cz);
            var heightAboveGround = cy - groundY;
            var shadowScale = Math.max(0.3, 1 - heightAboveGround / (arcPeak * 2));
            shadow.scale.set(shadowScale, shadowScale, shadowScale);
            shadowMat.opacity = 0.2 * shadowScale;
        });
    }

    function _spawnAbsoluteZero3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var pillarH = ts * 1.8;
        var pillarR = ts * 0.2;

        var pillarGeo = new THREE.CylinderGeometry(0.7, 1, 1, 8, 1, false);
        var iceTex = _getIceTexture();
        var matPillar = new THREE.MeshBasicMaterial({
            map: iceTex,
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            depthWrite: true,
        });
        var pillar = new THREE.Mesh(pillarGeo, matPillar);
        pillar.scale.set(0.01, 0.01, 0.01);
        pillar.position.set(wp.x, wp.y, wp.z);
        pillar.renderOrder = 155;
        scene.add(pillar);

        var matPillarGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x66ccff),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var pillarGlow = new THREE.Mesh(pillarGeo, matPillarGlow);
        pillarGlow.scale.set(0.01, 0.01, 0.01);
        pillarGlow.position.set(wp.x, wp.y, wp.z);
        pillarGlow.renderOrder = 154;
        scene.add(pillarGlow);

        var shards = [];
        var shardMats = [];
        var shardCount = 6;
        for (var si = 0; si < shardCount; si++) {
            var shardGeo = new THREE.OctahedronGeometry(1, 0);
            var matShard = new THREE.MeshBasicMaterial({
                map: iceTex,
                transparent: true, opacity: 0.0,
                depthWrite: true,
            });
            var sh = new THREE.Mesh(shardGeo, matShard);
            sh.scale.set(0.01, 0.01, 0.01);
            sh.position.set(wp.x, wp.y, wp.z);
            sh.renderOrder = 156;
            scene.add(sh);
            shards.push(sh);
            shardMats.push(matShard);
        }

        var frostGeo = new THREE.TorusGeometry(1, 0.08, 6, 16);
        var matFrost = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaddff),
            transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var frostRing = new THREE.Mesh(frostGeo, matFrost);
        frostRing.scale.set(0.01, 0.01, 0.01);
        frostRing.position.set(wp.x, wp.y + 3, wp.z);
        frostRing.rotation.x = Math.PI * 0.5;
        frostRing.renderOrder = 153;
        scene.add(frostRing);

        var allMeshes = [pillar, pillarGlow, frostRing].concat(shards);
        var growMs = 400, holdMs = 500, shatterMs = 500;
        var totalMs = growMs + holdMs + shatterMs;
        var entry = { meshes: allMeshes, done: false };

        var shardAngles = [];
        var shardVY = [];
        for (var sa = 0; sa < shardCount; sa++) {
            shardAngles.push((sa / shardCount) * Math.PI * 2 + Math.random() * 0.4);
            shardVY.push(0.6 + Math.random() * 0.8);
        }

        _animate3D(entry, totalMs, function(elapsed) {
            var frostRadius = ts * 0.6;

            if (elapsed < growMs) {

                var t = elapsed / growMs;
                var ease = 1 - Math.pow(1 - t, 3);

                pillar.scale.set(pillarR * ease, pillarH * ease, pillarR * ease);
                pillar.position.y = wp.y + pillarH * ease * 0.5;
                matPillar.opacity = ease * 0.85;

                pillarGlow.scale.set(pillarR * ease * 1.2, pillarH * ease * 1.05, pillarR * ease * 1.2);
                pillarGlow.position.y = wp.y + pillarH * ease * 0.5;
                matPillarGlow.opacity = ease * 0.2;

                for (var i = 0; i < shardCount; i++) {
                    var shardSize = ts * (0.08 + 0.06 * (i % 3)) * ease;
                    var angle = shardAngles[i];
                    var dist = ts * 0.35 * ease;
                    shards[i].scale.set(shardSize * 0.5, shardSize, shardSize * 0.5);
                    shards[i].position.set(
                        wp.x + Math.cos(angle) * dist,
                        wp.y + pillarH * ease * (0.2 + 0.15 * (i % 3)),
                        wp.z + Math.sin(angle) * dist
                    );
                    shards[i].rotation.set(angle, elapsed * 0.003, angle * 0.5);
                    shardMats[i].opacity = ease * 0.9;
                }

                frostRing.scale.set(frostRadius * ease, frostRadius * ease, frostRadius * ease * 0.3);
                matFrost.opacity = ease * 0.4;
            } else if (elapsed < growMs + holdMs) {

                var t2 = (elapsed - growMs) / holdMs;
                var pulse = 1 + 0.04 * Math.sin(t2 * Math.PI * 6);

                pillar.scale.set(pillarR * pulse, pillarH * pulse, pillarR * pulse);
                pillar.position.y = wp.y + pillarH * pulse * 0.5;
                matPillar.opacity = 0.85;
                matPillarGlow.opacity = 0.2 + 0.05 * Math.sin(t2 * Math.PI * 8);

                for (var j = 0; j < shardCount; j++) {
                    var sp = 1 + 0.06 * Math.sin(t2 * Math.PI * 4 + j);
                    shards[j].rotation.y = elapsed * 0.003;
                    var shSize = ts * (0.08 + 0.06 * (j % 3)) * sp;
                    shards[j].scale.set(shSize * 0.5, shSize, shSize * 0.5);
                }

                frostRing.rotation.z = elapsed * 0.002;
                matFrost.opacity = 0.4 + 0.1 * Math.sin(t2 * Math.PI * 4);
            } else {

                var t3 = (elapsed - growMs - holdMs) / shatterMs;
                var fadeOut = 1 - t3;

                pillar.scale.set(pillarR * (1 + t3 * 0.15), pillarH * (1 + t3 * 0.05), pillarR * (1 + t3 * 0.15));
                matPillar.opacity = fadeOut * 0.85;
                matPillarGlow.opacity = fadeOut * 0.2;

                for (var k = 0; k < shardCount; k++) {
                    var angle2 = shardAngles[k];
                    var outDist = ts * (0.35 + t3 * 1.5);
                    var shY = wp.y + pillarH * (0.2 + 0.15 * (k % 3)) + t3 * ts * shardVY[k];
                    shards[k].position.set(
                        wp.x + Math.cos(angle2) * outDist,
                        shY,
                        wp.z + Math.sin(angle2) * outDist
                    );
                    shards[k].rotation.x = elapsed * 0.008;
                    shards[k].rotation.z = elapsed * 0.006;
                    var shScale = ts * (0.08 + 0.06 * (k % 3)) * fadeOut;
                    shards[k].scale.set(shScale * 0.5, shScale, shScale * 0.5);
                    shardMats[k].opacity = fadeOut * 0.9;
                }

                frostRing.scale.set(frostRadius * (1 + t3 * 0.3), frostRadius * (1 + t3 * 0.3), frostRadius * 0.3);
                matFrost.opacity = fadeOut * 0.4;
            }
        });
    }

    function _spawnBlizzardShards3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var spread = footprint * 0.45;

        var iceTex = _getIceTexture();

        var shards = [];
        var shardMats = [];
        var shardData = [];
        var shardCount = 10;
        for (var i = 0; i < shardCount; i++) {
            var geo = new THREE.OctahedronGeometry(1, 0);
            var mat = new THREE.MeshBasicMaterial({
                map: iceTex,
                transparent: true, opacity: 0.0,
                depthWrite: true,
            });
            var sh = new THREE.Mesh(geo, mat);
            sh.scale.set(0.01, 0.01, 0.01);
            var ox = (Math.random() - 0.5) * spread * 2;
            var oz = (Math.random() - 0.5) * spread * 2;
            sh.position.set(wp.x + ox, wp.y + ts * 3 + Math.random() * ts * 2, wp.z + oz);
            sh.renderOrder = 158;
            scene.add(sh);
            shards.push(sh);
            shardMats.push(mat);
            shardData.push({
                ox: ox, oz: oz,
                startY: wp.y + ts * 3 + Math.random() * ts * 2,
                size: ts * (0.06 + Math.random() * 0.08),
                delay: Math.random() * 300,
                rotSpeed: 0.003 + Math.random() * 0.005,
            });
        }

        var domeGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var matDome = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ccff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var dome = _addMesh(scene, domeGeo, matDome, wp, 150);
        var matDomeGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaeeff),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var domeGlow = _addMesh(scene, domeGeo, matDomeGlow, wp, 151);

        var domeRadius = footprint * 0.5;
        var domeHeight = domeRadius * 0.6;

        var allMeshes = [dome, domeGlow].concat(shards);
        var fallMs = 800, holdMs = 400, fadeMs = 400;
        var totalMs = fallMs + holdMs + fadeMs;
        var entry = { meshes: allMeshes, done: false };

        _animate3D(entry, totalMs, function(elapsed) {

            for (var si = 0; si < shardCount; si++) {
                var sd = shardData[si];
                var shardElapsed = Math.max(0, elapsed - sd.delay);
                var shardT = Math.min(shardElapsed / (fallMs - sd.delay + 200), 1);
                var shardY = sd.startY + (wp.y - sd.startY) * (shardT * shardT);
                shards[si].position.y = shardY;
                shards[si].rotation.x = shardElapsed * sd.rotSpeed;
                shards[si].rotation.z = shardElapsed * sd.rotSpeed * 0.7;
                var shardScale = sd.size * Math.min(1, shardT * 3);
                shards[si].scale.set(shardScale * 0.5, shardScale, shardScale * 0.5);

                var shardOpacity = shardT < 0.1 ? shardT * 10 : (shardT > 0.8 ? (1 - shardT) * 5 : 1);
                shardMats[si].opacity = shardOpacity * 0.85;
            }

            var domeT, domeS, domeOpacity;
            if (elapsed < fallMs) {
                domeT = elapsed / fallMs;
                domeS = 1 - Math.pow(1 - domeT, 3);
                domeOpacity = domeS * 0.7;
            } else if (elapsed < fallMs + holdMs) {
                domeT = (elapsed - fallMs) / holdMs;
                domeS = 1 + 0.03 * Math.sin(domeT * Math.PI * 4);
                domeOpacity = 0.7;
            } else {
                domeT = (elapsed - fallMs - holdMs) / fadeMs;
                domeS = 1 + domeT * 0.1;
                domeOpacity = 0.7 * (1 - domeT);
            }

            dome.scale.set(domeRadius * domeS, domeHeight * domeS, domeRadius * domeS);
            matDome.opacity = domeOpacity * 0.2;

            domeGlow.scale.set(domeRadius * domeS * 0.92, domeHeight * domeS * 0.92, domeRadius * domeS * 0.92);
            matDomeGlow.opacity = domeOpacity * 0.15;
        });
    }

    function _spawnDustDevil3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var vortexH = ts * 1.8;
        var botR = ts * 0.1;
        var topR = ts * 0.6;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);

        var funnelGeo = new THREE.CylinderGeometry(topR, botR, vortexH, 16, 6, true);
        var matFunnel = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xccaa66),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var funnel = new THREE.Mesh(funnelGeo, matFunnel);
        funnel.position.y = vortexH / 2;
        funnel.renderOrder = 145;
        group.add(funnel);

        var innerGeo = new THREE.CylinderGeometry(topR * 0.65, botR * 0.4, vortexH * 0.9, 12, 4, true);
        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xddcc88),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var inner = new THREE.Mesh(innerGeo, matInner);
        inner.position.y = vortexH / 2;
        inner.renderOrder = 146;
        group.add(inner);

        var wireGeo = new THREE.CylinderGeometry(topR * 1.05, botR * 1.1, vortexH * 0.95, 8, 3, true);
        var matWire = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xeedd99),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var wire = new THREE.Mesh(wireGeo, matWire);
        wire.position.y = vortexH / 2;
        wire.renderOrder = 147;
        group.add(wire);

        var dustGeo = new THREE.TorusGeometry(ts * 0.4, ts * 0.06, 6, 12);
        var matDust = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xbb9955),
            transparent: true, opacity: 0.0,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var dust = new THREE.Mesh(dustGeo, matDust);
        dust.rotation.x = Math.PI / 2;
        dust.position.y = 4;
        dust.renderOrder = 144;
        group.add(dust);

        scene.add(group);

        var expandMs = 300, holdMs = 600, fadeMs = 500;
        var totalMs = expandMs + holdMs + fadeMs;

        var allMeshes = [funnel, inner, wire, dust];
        var entry = { meshes: allMeshes, done: false };

        entry._group = group;

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3);
                opacity = s;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.04 * Math.sin(t * Math.PI * 5);
                opacity = 1;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 - t * 0.2;
                opacity = 1 - t;
            }

            var spin = elapsed * 0.004;

            funnel.rotation.y = spin;
            funnel.scale.set(s, s, s);
            matFunnel.opacity = opacity * 0.22;

            inner.rotation.y = -spin * 1.8;
            inner.scale.set(s, s, s);
            matInner.opacity = opacity * 0.15;

            wire.rotation.y = spin * 2.5;
            wire.rotation.z = Math.sin(elapsed * 0.002) * 0.05;
            wire.scale.set(s, s, s);
            matWire.opacity = opacity * 0.2;

            dust.rotation.z = -spin * 3.5;
            var dustPulse = 1 + 0.1 * Math.sin(elapsed * 0.008);
            dust.scale.set(s * dustPulse, s * dustPulse, s);
            matDust.opacity = opacity * 0.25;
        });

        var origCleanup = entry.done;
        var checkInterval = window.setInterval(function() {
            if (entry.done) {
                window.clearInterval(checkInterval);
                if (scene) scene.remove(group);
                group.traverse(function(child) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }, 100);
    }

    function _spawnPortalRing3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var ringRadius = ts * 0.45;

        var torusGeo = new THREE.TorusGeometry(1, 0.12, 12, 24);
        var matTorus = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x4488ff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring = new THREE.Mesh(torusGeo, matTorus);
        ring.scale.set(0.01, 0.01, 0.01);
        ring.position.set(wp.x, wp.y + ts * 0.35, wp.z);
        ring.rotation.x = Math.PI * 0.5;
        ring.renderOrder = 155;
        scene.add(ring);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ccff),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ringInner = new THREE.Mesh(torusGeo, matInner);
        ringInner.scale.set(0.01, 0.01, 0.01);
        ringInner.position.set(wp.x, wp.y + ts * 0.35, wp.z);
        ringInner.rotation.x = Math.PI * 0.5;
        ringInner.renderOrder = 156;
        scene.add(ringInner);

        var wfGeo = new THREE.TorusGeometry(1, 0.06, 6, 12);
        var matWf = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xaaddff),
            transparent: true, opacity: 0.0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ringWf = new THREE.Mesh(wfGeo, matWf);
        ringWf.scale.set(0.01, 0.01, 0.01);
        ringWf.position.set(wp.x, wp.y + ts * 0.35, wp.z);
        ringWf.rotation.x = Math.PI * 0.5;
        ringWf.renderOrder = 157;
        scene.add(ringWf);

        var expandMs = 200, holdMs = 400, fadeMs = 350;
        var totalMs = expandMs + holdMs + fadeMs;
        var entry = { meshes: [ring, ringInner, ringWf], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var t, s, opacity;
            if (elapsed < expandMs) {
                t = elapsed / expandMs;
                s = 1 - Math.pow(1 - t, 3);
                opacity = s;
            } else if (elapsed < expandMs + holdMs) {
                t = (elapsed - expandMs) / holdMs;
                s = 1 + 0.05 * Math.sin(t * Math.PI * 6);
                opacity = 1;
            } else {
                t = (elapsed - expandMs - holdMs) / fadeMs;
                s = 1 + t * 0.15;
                opacity = 1 - t;
            }

            var spin = elapsed * 0.006;

            ring.scale.set(ringRadius * s, ringRadius * s, ringRadius * s * 0.3);
            ring.rotation.z = spin;
            matTorus.opacity = opacity * 0.35;

            var innerS = s * 0.7;
            ringInner.scale.set(ringRadius * innerS, ringRadius * innerS, ringRadius * innerS * 0.25);
            ringInner.rotation.z = -spin * 1.5;
            matInner.opacity = opacity * 0.25;

            ringWf.scale.set(ringRadius * s * 1.15, ringRadius * s * 1.15, ringRadius * s * 0.2);
            ringWf.rotation.z = spin * 2.5;
            matWf.opacity = opacity * 0.3;
        });
    }

    function _spawnOvergrowthTree3D(tx, ty, aoeRadius) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var trunkH = ts * 1.4;
        var trunkR = ts * 0.12;
        var canopyR = ts * 0.55;

        var trunkGeo = new THREE.ConeGeometry(1, 1, 8, 1, false);
        var woodTex = _getWoodTexture();
        var matTrunk = new THREE.MeshBasicMaterial({
            map: woodTex,
            transparent: true, opacity: 0.0,
            depthWrite: true,
        });
        var trunk = new THREE.Mesh(trunkGeo, matTrunk);
        trunk.scale.set(0.01, 0.01, 0.01);
        trunk.position.set(wp.x, wp.y, wp.z);
        trunk.renderOrder = 153;
        scene.add(trunk);

        var canopyGeo = new THREE.SphereGeometry(1, 12, 8);
        var forestTex = _getForestTexture();
        var matCanopy = new THREE.MeshBasicMaterial({
            map: forestTex,
            transparent: true, opacity: 0.0,
            depthWrite: true,
        });
        var canopy = new THREE.Mesh(canopyGeo, matCanopy);
        canopy.scale.set(0.01, 0.01, 0.01);
        canopy.position.set(wp.x, wp.y + trunkH, wp.z);
        canopy.renderOrder = 154;
        scene.add(canopy);

        var matCanopyGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x44aa44),
            transparent: true, opacity: 0.0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var canopyGlow = new THREE.Mesh(canopyGeo, matCanopyGlow);
        canopyGlow.scale.set(0.01, 0.01, 0.01);
        canopyGlow.position.set(wp.x, wp.y + trunkH, wp.z);
        canopyGlow.renderOrder = 155;
        scene.add(canopyGlow);

        var rootGeo = new THREE.TorusGeometry(1, 0.15, 6, 12);
        var matRoot = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x665533),
            transparent: true, opacity: 0.0,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });
        var rootRing = new THREE.Mesh(rootGeo, matRoot);
        rootRing.scale.set(0.01, 0.01, 0.01);
        rootRing.position.set(wp.x, wp.y + 3, wp.z);
        rootRing.rotation.x = Math.PI * 0.5;
        rootRing.renderOrder = 152;
        scene.add(rootRing);

        var growMs = 500, holdMs = 600, fadeMs = 500;
        var totalMs = growMs + holdMs + fadeMs;
        var entry = { meshes: [trunk, canopy, canopyGlow, rootRing], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var rootRadius = ts * 0.4;

            if (elapsed < growMs) {
                var t = elapsed / growMs;
                var ease = 1 - Math.pow(1 - t, 3);

                trunk.scale.set(trunkR * ease, trunkH * ease, trunkR * ease);
                trunk.position.y = wp.y + trunkH * ease * 0.5;
                matTrunk.opacity = ease * 0.9;

                var canopyT = Math.max(0, (t - 0.4) / 0.6);
                var canopyEase = 1 - Math.pow(1 - canopyT, 3);
                var cs = canopyR * canopyEase;
                canopy.scale.set(cs, cs * 0.7, cs);
                canopy.position.y = wp.y + trunkH * ease * 0.85;
                matCanopy.opacity = canopyEase * 0.85;

                canopyGlow.scale.set(cs * 1.1, cs * 0.75, cs * 1.1);
                canopyGlow.position.y = canopy.position.y;
                matCanopyGlow.opacity = canopyEase * 0.15;

                rootRing.scale.set(rootRadius * ease, rootRadius * ease, rootRadius * ease * 0.3);
                matRoot.opacity = ease * 0.35;
            } else if (elapsed < growMs + holdMs) {
                var t2 = (elapsed - growMs) / holdMs;
                var pulse = 1 + 0.03 * Math.sin(t2 * Math.PI * 4);

                trunk.scale.set(trunkR * pulse, trunkH, trunkR * pulse);
                matTrunk.opacity = 0.9;

                var cs2 = canopyR * pulse;
                canopy.scale.set(cs2, cs2 * 0.7, cs2);
                canopy.rotation.y = elapsed * 0.0005;
                matCanopy.opacity = 0.85;
                matCanopyGlow.opacity = 0.15 + 0.05 * Math.sin(t2 * Math.PI * 6);

                rootRing.rotation.z = elapsed * 0.001;
                matRoot.opacity = 0.35;
            } else {
                var t3 = (elapsed - growMs - holdMs) / fadeMs;
                var fadeOut = 1 - t3;

                trunk.scale.set(trunkR * (1 + t3 * 0.1), trunkH * (1 + t3 * 0.05), trunkR * (1 + t3 * 0.1));
                matTrunk.opacity = fadeOut * 0.9;

                var cs3 = canopyR * (1 + t3 * 0.1);
                canopy.scale.set(cs3, cs3 * 0.7, cs3);
                matCanopy.opacity = fadeOut * 0.85;
                matCanopyGlow.opacity = fadeOut * 0.15;

                rootRing.scale.set(rootRadius * (1 + t3 * 0.2), rootRadius * (1 + t3 * 0.2), rootRadius * 0.3);
                matRoot.opacity = fadeOut * 0.35;
            }
        });
    }

    function _spawnExplosionRing3D(tx, ty, aoeRadius, opts) {
        var scene = _getVFXScene();
        if (!scene) return;

        opts = opts || {};
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var footprint = (aoeRadius * 2 + 1) * ts;
        var maxRadius = footprint * (opts.radiusScale || 0.6);

        var torusGeo = new THREE.TorusGeometry(1, 0.15, 8, 24);
        var matRing = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.color || 0xff6633),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring = new THREE.Mesh(torusGeo, matRing);
        ring.scale.set(0.01, 0.01, 0.01);
        ring.position.set(wp.x, wp.y + 4, wp.z);
        ring.rotation.x = Math.PI * 0.5;
        ring.renderOrder = 148;
        scene.add(ring);

        var matInner = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.innerColor || 0xffaa66),
            transparent: true, opacity: 0.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ringInner = new THREE.Mesh(torusGeo, matInner);
        ringInner.scale.set(0.01, 0.01, 0.01);
        ringInner.position.set(wp.x, wp.y + 5, wp.z);
        ringInner.rotation.x = Math.PI * 0.5;
        ringInner.renderOrder = 149;
        scene.add(ringInner);

        var expandMs = opts.expandMs || 450;
        var entry = { meshes: [ring, ringInner], done: false };

        _animate3D(entry, expandMs, function(elapsed) {
            var t = elapsed / expandMs;
            var ease = 1 - Math.pow(1 - t, 2);
            var opacity = 1 - t;

            var r = maxRadius * ease;
            ring.scale.set(r, r, r * 0.15);
            matRing.opacity = opacity * (opts.opacity || 0.4);

            var rInner = maxRadius * ease * 0.75;
            ringInner.scale.set(rInner, rInner, rInner * 0.12);
            matInner.opacity = opacity * ((opts.opacity || 0.4) * 0.7);
        });
    }

    var _BOULDER_SPELL_IDS = {
        raceBoulderHurl: true,
        raceBoulderThrow: true,
        raceStoneThrow: true,
    };

    function hasBoulderProjectile(spellId) {
        return !!_BOULDER_SPELL_IDS[spellId];
    }

    function _spawnGreenArrow3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;

        var shaftGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1, false);
        var matShaft = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x00cc44),
            transparent: true, opacity: 0.0,
            depthWrite: true,
        });
        var shaft = new THREE.Mesh(shaftGeo, matShaft);
        shaft.position.set(wp.x, wp.y, wp.z + ts * 1.5);
        shaft.rotation.x = Math.PI / 2;
        shaft.scale.set(ts * 0.08, ts * 0.6, ts * 0.08);
        shaft.renderOrder = 160;
        scene.add(shaft);

        var headGeo = new THREE.ConeGeometry(1, 2, 4, 1, false);
        var matHead = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x22ff55),
            transparent: true, opacity: 0.0,
            depthWrite: true,
        });
        var head = new THREE.Mesh(headGeo, matHead);
        head.position.set(wp.x, wp.y, wp.z + ts * 1.5);
        head.rotation.x = Math.PI / 2;
        head.scale.set(ts * 0.15, ts * 0.2, ts * 0.15);
        head.renderOrder = 161;
        scene.add(head);

        var glowGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 8, 1, false);
        var matGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x44ff88),
            transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var glow = new THREE.Mesh(glowGeo, matGlow);
        glow.position.set(wp.x, wp.y, wp.z + ts * 1.5);
        glow.rotation.x = Math.PI / 2;
        glow.scale.set(ts * 0.12, ts * 0.5, ts * 0.12);
        glow.renderOrder = 159;
        scene.add(glow);

        var allMeshes = [shaft, head, glow];
        var entry = { meshes: allMeshes, done: false };
        _activeThreeMeshes.push(entry);

        var startZ = wp.z + ts * 3.0;
        var endZ = wp.z + ts * 0.3;
        var startTime = performance.now();
        var descentMs = 350;
        var holdMs = 150;
        var fadeMs = 300;
        var totalMs = descentMs + holdMs + fadeMs;

        function tick() {
            if (entry.done) return;
            var elapsed = performance.now() - startTime;
            var t = Math.min(elapsed / totalMs, 1);

            if (elapsed < descentMs) {

                var dp = elapsed / descentMs;
                var ease = 1 - Math.pow(1 - dp, 2.5);
                var curZ = startZ + (endZ - startZ) * ease;
                shaft.position.z = curZ;
                head.position.z = curZ + ts * 0.3;
                glow.position.z = curZ;
                var fadeIn = Math.min(dp * 3, 1);
                matShaft.opacity = fadeIn * 0.9;
                matHead.opacity = fadeIn;
                matGlow.opacity = fadeIn * 0.4;
            } else if (elapsed < descentMs + holdMs) {

                shaft.position.z = endZ;
                head.position.z = endZ + ts * 0.3;
                glow.position.z = endZ;
                matShaft.opacity = 0.9;
                matHead.opacity = 1;
                matGlow.opacity = 0.4;
            } else {

                var fp = (elapsed - descentMs - holdMs) / fadeMs;
                matShaft.opacity = 0.9 * (1 - fp);
                matHead.opacity = 1 * (1 - fp);
                matGlow.opacity = 0.4 * (1 - fp);

                var sc = 1 + fp * 0.3;
                shaft.scale.set(ts * 0.08 * sc, ts * 0.6, ts * 0.08 * sc);
                head.scale.set(ts * 0.15 * sc, ts * 0.2, ts * 0.15 * sc);
                glow.scale.set(ts * 0.12 * sc * 1.3, ts * 0.5, ts * 0.12 * sc * 1.3);
            }

            if (t >= 1) {
                entry.done = true;
                allMeshes.forEach(function(m) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
                return;
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function _spawnGlacialTombShard3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;

        var shardGeo = new THREE.OctahedronGeometry(1, 0);
        var iceTex = _getIceTexture();
        var matShard = new THREE.MeshBasicMaterial({
            map: iceTex,
            transparent: true, opacity: 0.0,
            depthWrite: true,
        });
        var shard = new THREE.Mesh(shardGeo, matShard);
        shard.scale.set(ts * 0.25, ts * 0.4, ts * 0.25);
        shard.position.set(wp.x, wp.y, wp.z + ts * 3.0);
        shard.renderOrder = 160;
        scene.add(shard);

        var matGlow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x66ccff),
            transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide,
        });
        var shardGlow = new THREE.Mesh(shardGeo, matGlow);
        shardGlow.scale.set(ts * 0.3, ts * 0.48, ts * 0.3);
        shardGlow.position.set(wp.x, wp.y, wp.z + ts * 3.0);
        shardGlow.renderOrder = 159;
        scene.add(shardGlow);

        var ringGeo = new THREE.TorusGeometry(1, 0.15, 8, 24);
        var matRing = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0x88ddff),
            transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        var ring = new THREE.Mesh(ringGeo, matRing);
        ring.scale.set(ts * 0.3, ts * 0.3, ts * 0.3);
        ring.position.set(wp.x, wp.y, wp.z + 1);
        ring.rotation.x = Math.PI / 2;
        ring.renderOrder = 155;
        scene.add(ring);

        var allMeshes = [shard, shardGlow, ring];
        var entry = { meshes: allMeshes, done: false };
        _activeThreeMeshes.push(entry);

        var startZ = wp.z + ts * 3.0;
        var endZ = wp.z + ts * 0.2;
        var startTime = performance.now();
        var descentMs = 450;
        var holdMs = 200;
        var shatterMs = 350;
        var totalMs = descentMs + holdMs + shatterMs;

        function tick() {
            if (entry.done) return;
            var elapsed = performance.now() - startTime;
            var t = Math.min(elapsed / totalMs, 1);
            var now = performance.now();

            shard.rotation.y = now * 0.004;
            shard.rotation.z = now * 0.002;
            shardGlow.rotation.y = shard.rotation.y;
            shardGlow.rotation.z = shard.rotation.z;

            if (elapsed < descentMs) {
                var dp = elapsed / descentMs;
                var ease = 1 - Math.pow(1 - dp, 3);
                var curZ = startZ + (endZ - startZ) * ease;
                shard.position.z = curZ;
                shardGlow.position.z = curZ;
                var fadeIn = Math.min(dp * 2.5, 1);
                matShard.opacity = fadeIn * 0.85;
                matGlow.opacity = fadeIn * 0.35;
                matRing.opacity = fadeIn * 0.5;

                var ringScale = ts * (0.25 + 0.1 * Math.sin(dp * Math.PI * 3));
                ring.scale.set(ringScale, ringScale, ringScale);
            } else if (elapsed < descentMs + holdMs) {
                shard.position.z = endZ;
                shardGlow.position.z = endZ;
                matShard.opacity = 0.85;
                matGlow.opacity = 0.35;
                matRing.opacity = 0.5;
            } else {

                var sp = (elapsed - descentMs - holdMs) / shatterMs;
                matShard.opacity = 0.85 * (1 - sp);
                matGlow.opacity = 0.35 * (1 - sp);
                matRing.opacity = 0.5 * (1 - sp);

                var ssc = 1 + sp * 1.5;
                shard.scale.set(ts * 0.25 * ssc, ts * 0.4 * (1 - sp * 0.5), ts * 0.25 * ssc);
                shardGlow.scale.set(ts * 0.3 * ssc * 1.2, ts * 0.48 * (1 - sp * 0.3), ts * 0.3 * ssc * 1.2);

                var rsc = ts * (0.35 + sp * 0.5);
                ring.scale.set(rsc, rsc, rsc);
            }

            if (t >= 1) {
                entry.done = true;
                allMeshes.forEach(function(m) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
                return;
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    var _spell3DGeometry = {

        bubble:              function(tx, ty, r) { _spawnBubbleDome(tx, ty, r); },
        raceHolyBulwark:     function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xdcaa1e, innerColor: 0xffe066, wireColor: 0xffdd88,
            wireSegments: 10, wireRings: 5,
            outerOpacity: 0.3, innerOpacity: 0.2, wireOpacity: 0.4,
            wireRotSpeed: 0.0003,
        }); },
        raceLuminousShield:  function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xffee88, innerColor: 0xffffcc, wireColor: 0xffdd66,
            segments: 24, rings: 12, wireSegments: 8, wireRings: 4,
            heightRatio: 0.85,
            outerOpacity: 0.25, innerOpacity: 0.15, wireOpacity: 0.3,
            wireRotSpeed: 0.0005,
        }); },
        racePsychicBarrier:  function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xdc3c82, innerColor: 0xff88bb, wireColor: 0xff66aa,
            segments: 20, rings: 10, wireSegments: 10, wireRings: 5,
            radiusScale: 0.45, heightRatio: 0.8,
            outerOpacity: 0.22, innerOpacity: 0.14, wireOpacity: 0.28,
            wireRotSpeed: 0.0006,
        }); },
        raceOrichalcumBarrier: function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xcc9933, innerColor: 0xeebb44, wireColor: 0xddaa22,
            segments: 16, rings: 8, wireSegments: 6, wireRings: 4,
            radiusScale: 0.45, heightRatio: 0.65,
            outerOpacity: 0.35, innerOpacity: 0.22, wireOpacity: 0.45,
            wireRotSpeed: 0.0002,
            expandMs: 400, holdMs: 600, fadeMs: 500,
        }); },
        raceContainmentField: function(tx, ty) { _spawnContainmentField3D(tx, ty); },
        raceShieldWall:      function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xa0a0c3, innerColor: 0xccccee, wireColor: 0xbbbbdd,
            segments: 16, rings: 8, wireSegments: 8, wireRings: 4,
            radiusScale: 0.4, heightRatio: 0.7,
            outerOpacity: 0.3, innerOpacity: 0.18, wireOpacity: 0.35,
            wireRotSpeed: 0.0002,
            expandMs: 300, holdMs: 500, fadeMs: 400,
        }); },
        raceBoneWall:        function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0x998866, innerColor: 0xccaa77, wireColor: 0xbbaa88,
            segments: 10, rings: 6, wireSegments: 5, wireRings: 3,
            radiusScale: 0.4, heightRatio: 0.5,
            outerOpacity: 0.35, innerOpacity: 0.2, wireOpacity: 0.4,
            wireRotSpeed: 0.0001,
            expandMs: 350, holdMs: 400, fadeMs: 400,
        }); },
        raceTeslaTrap:       function(tx, ty) { _spawnContainmentField3D(tx, ty); },
        raceTotemDrop:       function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0xcc6633, innerColor: 0xff9944, wireColor: 0xee8833,
            segments: 8, rings: 6, wireSegments: 6, wireRings: 3,
            radiusScale: 0.35, heightRatio: 1.2,
            outerOpacity: 0.28, innerOpacity: 0.15, wireOpacity: 0.3,
            wireRotSpeed: 0.0003,
            expandMs: 400, holdMs: 500, fadeMs: 500,
        }); },

        raceGravityWell:     function(tx, ty, r) { _spawnGravityWell3D(tx, ty, r); },
        raceWhirlpool:       function(tx, ty, r) { _spawnWhirlpool3D(tx, ty, r); },

        raceDustDevil:       function(tx, ty, r) { _spawnDustDevil3D(tx, ty, r); },

        raceDiamondDust:        function(tx, ty, r) { _spawnBlizzardShards3D(tx, ty, r); },
        raceBlizzardPresent:    function(tx, ty, r) { _spawnBlizzardShards3D(tx, ty, r); },
        sharedSummonBlizzard:   function(tx, ty, r) { _spawnBlizzardShards3D(tx, ty, r); },

        raceAbsoluteZero:    function(tx, ty) { _spawnAbsoluteZero3D(tx, ty); },

        overgrowth:          function(tx, ty, r) { _spawnOvergrowthTree3D(tx, ty, r); },

        raceAbductionBeam:   function(tx, ty) { _spawnAbductionBeam3D(tx, ty); },

        nuke:                function(tx, ty, r) { _spawnNukeCloud3D(tx, ty, r); },
        meteor:              function(tx, ty, r, dm, tm) { _spawnMeteorSphere3D(tx, ty, dm, tm); },

        raceMushroomRing:    function(tx, ty, r) { _spawnMushroomRing3D(tx, ty, r); },
        sharedWardOfThorns:  function(tx, ty) { _spawnWardOfThorns3D(tx, ty); },

        sentaiGreenArrow:    function(tx, ty) { _spawnGreenArrow3D(tx, ty); },
        sharedGlacialTomb:   function(tx, ty) { _spawnGlacialTombShard3D(tx, ty); },
    };

    function _fireAura(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        if (!params) return;

        var auraEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].aura;
        if (!auraEffectId) return;
        var auraDef = EFFECTS[auraEffectId];
        if (!auraDef) return;

        var tx = params.tx, ty = params.ty;
        if (tx == null || ty == null) return;

        var aoeRadius = (params.aoeRadius != null)
            ? params.aoeRadius
            : (auraDef.aoeRadius != null ? auraDef.aoeRadius : 0);
        var shape = auraDef.shape || 'square';
        var tileOffsets = _buildTileOffsets(shape, aoeRadius);

        if (auraDef.pillarSprite) {
            var c = tilePx(tx, ty);
            var zFloor = unitSurfaceZ(tx, ty);
            var pillarH = auraDef.pillarH || 180;
            _spawn({
                x: c.x, y: c.y, z: zFloor,
                mode: 'y-locked',
                sprite: auraDef.pillarSprite,
                ml: auraDef.pillarMs || 700,
                w0: auraDef.pillarW0 != null ? auraDef.pillarW0 : 60,
                w1: auraDef.pillarW1 != null ? auraDef.pillarW1 : 40,
                h0: pillarH,
                h1: auraDef.pillarH1 != null ? auraDef.pillarH1 : pillarH * 1.2,
                opacity0: auraDef.pillarOpacity0 != null ? auraDef.pillarOpacity0 : 0.9,
                opacity1: auraDef.pillarOpacity1 != null ? auraDef.pillarOpacity1 : 0,
            });
        }

        if (_spell3DGeometry[spellId]) {
            _spell3DGeometry[spellId](tx, ty, aoeRadius);
        }

        _emitAoeBursts(tileOffsets, tx, ty,
            auraDef.impactTileEffect, auraDef.impactCenterEffect, aoeRadius);
    }

    function _fireTeleport(spellId, params) {
        if (_catOff('spells')) return;
        if (!_canSpawn()) return;
        if (!params) return;
        var teleEffectId = SPELL_MAP[spellId] && SPELL_MAP[spellId].teleport;
        if (!teleEffectId) return;
        var teleDef = EFFECTS[teleEffectId];
        if (!teleDef) return;
        var fromX = params.fromX, fromY = params.fromY;
        var toX = params.toX, toY = params.toY;
        if (fromX == null || fromY == null || toX == null || toY == null) return;

        var arrivalDelayMs = teleDef.arrivalDelayMs != null ? teleDef.arrivalDelayMs : 200;

        _spawnPortalRing3D(fromX, fromY);

        var dispersalEffectId = teleDef.dispersalEffect;
        if (dispersalEffectId) {
            var dispDef = EFFECTS[dispersalEffectId];
            if (dispDef) _spawnEffect(dispDef, { tx: fromX, ty: fromY });
        }

        var arrivalEffectId = teleDef.arrivalEffect;
        if (arrivalEffectId) {
            var arrDef = EFFECTS[arrivalEffectId];
            if (arrDef) {
                window.setTimeout(function() {
                    if (_suppressed()) return;
                    _spawnEffect(arrDef, { tx: toX, ty: toY });

                    _spawnPortalRing3D(toX, toY);
                }, arrivalDelayMs);
            }
        }
    }

    function getDescentTotalMs(spellId) {
        var id = SPELL_MAP[spellId] && SPELL_MAP[spellId].descent;
        if (!id) return 0;
        var d = EFFECTS[id];
        if (!d) return 0;
        return (d.telegraphMs || 800) + (d.descentMs || 700);
    }
    function getDescentTelegraphMs(spellId) {
        var id = SPELL_MAP[spellId] && SPELL_MAP[spellId].descent;
        if (!id) return 800;
        var d = EFFECTS[id];
        return (d && d.telegraphMs) || 800;
    }
    function getDescentDescentMs(spellId) {
        var id = SPELL_MAP[spellId] && SPELL_MAP[spellId].descent;
        if (!id) return 700;
        var d = EFFECTS[id];
        return (d && d.descentMs) || 700;
    }
    function getMeteorTotalMs()     { return getDescentTotalMs('meteor'); }
    function getMeteorTelegraphMs() { return getDescentTelegraphMs('meteor'); }
    function getMeteorDescentMs()   { return getDescentDescentMs('meteor'); }

    function startRain3D(zones) {
        if (window.ThreeVFX && window.ThreeVFX.startRain3D) {
            window.ThreeVFX.startRain3D(zones);
        }
    }
    function stopRain3D() {
        if (window.ThreeVFX && window.ThreeVFX.stopRain3D) {
            window.ThreeVFX.stopRain3D();
        }
    }
    function isRain3DActive() {
        if (window.ThreeVFX && window.ThreeVFX.isRain3DActive) {
            return window.ThreeVFX.isRain3DActive();
        }
        return false;
    }

    function __playFx(effectId, tx, ty) {
        if (!EFFECTS[effectId]) { console.warn('[ThreeVFXEffects] Unknown effect:', effectId); return; }
        _spawnEffect(EFFECTS[effectId], { tx: tx || 0, ty: ty || 0 });
    }

    var _origClear = clear;
    function clearAll() {
        _origClear();
        if (window.ThreeVFX && window.ThreeVFX.clear) window.ThreeVFX.clear();
    }

    return {

        projectile: projectile,
        beam: beam,
        aoe: aoe,

        tick: tick,
        clear: clearAll,

        startTornado3D: startTornado3D,
        stopTornado3D: stopTornado3D,
        isTornado3DActive: isTornado3DActive,
        startSandstorm3D: startSandstorm3D,
        stopSandstorm3D: stopSandstorm3D,
        isSandstorm3DActive: isSandstorm3DActive,

        fire: fire,
        fireBoltDirect: fireBoltDirect,
        hasMapping: hasMapping,

        fireHeal: fireHeal,
        fireMana: fireMana,
        fireBuff: fireBuff,
        fireStatus: fireStatus,
        fireLevelUp: fireLevelUp,
        fireDeath: fireDeath,
        fireBlood: fireBlood,
        fireDash: fireDash,
        fireTeleportLegacy: fireTeleportLegacy,
        fireZone: fireZone,
        fireCombo: fireCombo,

        getDescentTotalMs: getDescentTotalMs,
        getDescentTelegraphMs: getDescentTelegraphMs,
        getDescentDescentMs: getDescentDescentMs,
        getMeteorTotalMs: getMeteorTotalMs,
        getMeteorTelegraphMs: getMeteorTelegraphMs,
        getMeteorDescentMs: getMeteorDescentMs,

        startRain3D: startRain3D,
        stopRain3D: stopRain3D,
        isRain3DActive: isRain3DActive,

        hasBoulderProjectile: hasBoulderProjectile,
        spawnBoulderProjectile3D: _spawnBoulderProjectile3D,

        hasIceProjectile: hasIceProjectile,
        spawnIceSpearProjectile3D: _spawnIceSpearProjectile3D,

        buildHurricaneVortex3D: _buildHurricaneVortex3D,
        tickHurricaneVortex: _tickHurricaneVortex,
        disposeHurricaneVortex: _disposeHurricaneVortex,

        buildBlizzardVortex3D: _buildBlizzardVortex3D,
        tickBlizzardVortex: _tickBlizzardVortex,
        disposeBlizzardVortex: _disposeBlizzardVortex,

        buildSandstormVortex3D: _buildSandstormVortex3D,
        tickSandstormVortex: _tickSandstormVortex,
        disposeSandstormVortex: _disposeSandstormVortex,

        __playFx: __playFx,

        _EFFECTS: EFFECTS,
        _SPELL_MAP: SPELL_MAP,
    };
})();

window.ThreeVFXEffects = ThreeVFXEffects;

window.__playFx = ThreeVFXEffects.__playFx;
