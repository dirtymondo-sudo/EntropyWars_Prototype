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

                /* ── Smoke Screen: one big, soft, slow smoke cloud filling the
                   whole zone (think a CoD smoke grenade) — NOT a fountain of
                   little puffs. We keep only a small population (~20) of huge,
                   soft, near-static, long-lived puffs; the radial-gradient 'smoke'
                   sprite makes them overlap into a single solid bank that covers
                   the entire zone and lingers for the zone's full duration. ── */
                if (zone.smokeConcealment) {
                    if (Math.random() < 0.2) {
                        var sAng = rn(0, 6.2832);
                        var sRad = Math.sqrt(Math.random()) * R;   // fill the whole disc, edges included
                        _spawn({
                            _zone: true,
                            x: center.x + Math.cos(sAng) * sRad,
                            y: center.y + Math.sin(sAng) * sRad,
                            z: baseZ + rn(0, ts * 0.6),
                            vx: rn(-1, 1),
                            vy: rn(-1, 1),
                            vz: rn(0, 3),
                            mode: 'billboard', sprite: 'smoke',
                            ml: 2800 + rn(0, 1600),
                            size0: ts * 1.1 + rn(0, ts * 0.6),
                            size1: ts * 1.9 + rn(0, ts * 0.6),
                            opacity0: 0.4 + rn(0, 0.2), opacity1: 0,
                            drag: 2.0,
                            gravity: -0.5,
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

    var _EFX_DATA = {"E":{"fire1_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1500,"z":1,"s0":96,"s1":112,"o0":0.9},{"s":"flash","l":220,"s0":96,"s1":28},{"n":18,"s":"ember","l":[400,700],"o":6,"vx":150,"vy":150,"vz":[40,180],"g":380,"dr":1.5,"s0":[10,16],"s1":2},{"n":4,"d":100,"m":"y-locked","s":"smoke","l":[900,1400],"o":18,"vz":[25,50],"dr":0.4,"s0":[44,58],"s1":110,"o0":0.65}]},"fire2_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1800,"z":1,"s0":120,"s1":140,"o0":0.95},{"s":"flash","l":320,"z":6,"s0":140,"s1":40},{"n":35,"s":"ember","l":[500,850],"o":8,"vx":220,"vy":220,"vz":[60,240],"g":380,"dr":1.4,"s0":[10,18],"s1":2},{"n":6,"d":30,"a":"floor","m":"y-locked","s":"flame","l":[400,600],"o":22,"w0":18,"w1":8,"h0":28,"h1":70},{"n":8,"d":120,"m":"y-locked","s":"smoke","l":[1000,1500],"o":22,"vz":[30,55],"dr":0.4,"s0":[54,72],"s1":140,"o0":0.7}]},"wallOfFire_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":2800,"z":1,"s0":120,"s1":140,"o0":0.95},{"a":"floor","m":"world","s":"fire-glow","l":1500,"z":2,"s0":124,"s1":150,"o0":0.85},{"a":"floor","m":"y-locked","s":"flame","l":1000,"w0":110,"w1":92,"h0":50,"h1":72,"o0":0.55},{"a":"floor","m":"y-locked","s":"flame","l":1400,"w0":78,"w1":40,"h0":100,"h1":210,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame-hot","l":1200,"w0":36,"w1":16,"h0":78,"h1":170},{"n":3,"d":30,"a":"floor","m":"y-locked","s":"flame","l":[800,1200],"o":26,"w0":[22,32],"w1":[10,18],"h0":[42,68],"h1":[90,140],"o0":0.95},{"n":3,"d":420,"a":"floor","m":"y-locked","s":"flame","l":[600,950],"o":28,"w0":[18,28],"w1":[8,14],"h0":[36,58],"h1":[80,125],"o0":0.9},{"n":6,"d":100,"a":"floor","m":"y-locked","s":"flame","l":[220,480],"o":34,"w0":[8,14],"w1":[4,8],"h0":[14,24],"h1":[38,65]},{"n":4,"d":720,"a":"floor","m":"y-locked","s":"flame","l":[200,420],"o":32,"w0":[8,14],"w1":[4,8],"h0":[12,22],"h1":[32,55],"o0":0.95},{"n":14,"a":"floor","s":"ember","l":[400,780],"z":10,"o":18,"vx":140,"vy":140,"vz":[40,180],"g":340,"dr":1.4,"s0":[10,16],"s1":2},{"n":8,"d":350,"a":"floor","s":"ember","l":[300,600],"z":14,"o":16,"vx":110,"vy":110,"vz":[50,160],"g":360,"dr":1.4,"s0":[8,14],"s1":2},{"n":5,"d":750,"a":"floor","s":"ember","l":[250,500],"z":12,"o":14,"vx":90,"vy":90,"vz":[40,130],"g":360,"dr":1.4,"s0":[6,12],"s1":2},{"n":8,"d":50,"a":"floor","s":"ember","l":[700,1300],"z":22,"o":20,"vx":40,"vy":40,"vz":[180,380],"g":80,"dr":1,"s0":[4,8],"s1":1},{"n":5,"d":500,"a":"floor","s":"ember","l":[600,1100],"z":20,"o":18,"vx":30,"vy":30,"vz":[200,360],"g":80,"dr":1,"s0":[3,6],"s1":1},{"n":3,"d":200,"a":"floor","m":"y-locked","s":"smoke","l":[900,1300],"o":20,"z":60,"vz":[28,50],"dr":0.45,"s0":[50,70],"s1":130,"o0":0.6},{"n":3,"d":600,"a":"floor","m":"y-locked","s":"smoke","l":[800,1200],"o":22,"z":65,"vz":[30,50],"dr":0.45,"s0":[46,66],"s1":120,"o0":0.55},{"n":2,"d":1000,"a":"floor","m":"y-locked","s":"smoke","l":[700,1100],"o":20,"z":70,"vz":[25,45],"dr":0.45,"s0":[42,62],"s1":110,"o0":0.5}]},"meteor_descent":{"dsm":700,"tm":800,"ar":1,"ite":"meteor_impact_tile","ice":"meteor_impact_center","ts":"target-ring","L":[{"s":"flash","l":700,"s0":220,"s1":220,"o0":0.7,"o1":0.9,"_d":{"fromZ":720,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":700,"s0":130,"s1":100,"o1":1,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":22,"jitter":14,"msRange":[350,650],"sizeRange":[12,20]}}}]},"meteor_impact_tile":{"L":[{"m":"world","s":"scorch","l":2200,"z":1,"s0":116,"s1":138,"o0":0.92},{"m":"y-locked","s":"flame","l":1000,"w0":48,"w1":18,"h0":56,"h1":130},{"n":4,"d":40,"m":"y-locked","s":"flame","l":[500,800],"o":24,"w0":18,"w1":8,"h0":28,"h1":70},{"n":28,"s":"ember","l":[450,850],"z":14,"o":12,"vx":220,"vy":220,"vz":[60,240],"g":400,"dr":1.4,"s0":[10,18],"s1":2},{"n":5,"d":120,"m":"y-locked","s":"smoke","l":[1000,1500],"o":24,"z":22,"vz":[30,60],"dr":0.4,"s0":[54,76],"s1":150,"o0":0.7}]},"meteor_impact_center":{"sk":"hard","L":[{"s":"flash","l":420,"z":30,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":480,"o0":0.9}]},"radiantBolt_descent":{"dsm":380,"tm":280,"ar":0,"ice":"radiantBolt_impact","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":380,"w0":60,"w1":80,"h0":800,"h1":200,"o1":0.9,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":380,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}}]},"radiantBolt_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":80,"s1":240},{"s":"flash","l":280,"s0":140,"s1":36},{"n":22,"s":"divine-sparkle","l":[500,900],"o":6,"vx":180,"vy":180,"vz":[60,220],"g":100,"dr":1.2,"s0":[10,18],"s1":2},{"n":10,"d":80,"s":"holy-light","l":[900,1400],"o":14,"z":6,"vx":40,"vy":40,"vz":[80,180],"g":-40,"dr":0.8,"s0":[8,14],"s1":1,"o0":0.9}]},"judgment_descent":{"dsm":400,"tm":500,"ar":1,"ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":400,"w0":110,"w1":140,"h0":1000,"h1":280,"o1":0.92,"_d":{"fromZ":1000,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":400,"s0":260,"s1":300,"o1":0.95,"_d":{"fromZ":1000,"toZ":null,"ease":"easeIn"}}]},"judgment_impact_tile":{"L":[{"m":"world","s":"halo-ring","l":1400,"z":1,"s0":100,"s1":160,"o0":0.9},{"m":"y-locked","s":"holy-pillar","l":700,"w0":44,"w1":22,"h0":80,"h1":180},{"n":16,"s":"divine-sparkle","l":[450,800],"z":12,"o":14,"vx":200,"vy":200,"vz":[50,220],"g":120,"dr":1.3,"s0":[10,16],"s1":2},{"n":5,"d":100,"s":"holy-light","l":[800,1200],"z":20,"o":18,"vx":40,"vy":40,"vz":[100,200],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.9}]},"judgment_impact_center":{"sk":"hard","L":[{"s":"flash","l":460,"z":30,"s0":280,"s1":70},{"m":"world","s":"shockwave","l":720,"z":2,"s0":60,"s1":520,"o0":0.9},{"d":30,"m":"world","s":"halo-ring","l":1100,"z":3,"s0":120,"s1":460,"o0":0.85}]},"nuke_descent":{"dsm":900,"tm":950,"ar":2,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":500,"durationMs":1000,"delayMs":80,"trailCount":8},"L":[{"s":"flash","l":900,"s0":280,"s1":260,"o0":0.8,"o1":0.95,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"nuclear-missile","l":900,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":225,"_d":{"fromZ":880,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":20,"jitter":10,"msRange":[400,700],"sizeRange":[14,24]}}},{"s":"meteor","l":900,"z":-2,"s0":170,"s1":130,"o0":0.6,"o1":0.8,"_d":{"fromZ":885,"toZ":null,"ease":"easeIn","trail":{"sprite":"explosion-orange","rateMs":25,"jitter":18,"msRange":[350,600],"sizeRange":[14,22]}}}]},"nuke_impact_tile":{"L":[{"m":"world","s":"scorch","l":2400,"z":1,"s0":122,"s1":150,"o0":0.92},{"m":"y-locked","s":"flame","l":1100,"w0":52,"w1":20,"h0":70,"h1":150},{"n":24,"s":"explosion-orange","l":[450,800],"z":16,"o":14,"vx":240,"vy":240,"vz":[70,250],"g":380,"dr":1.4,"s0":[12,22],"s1":3},{"n":6,"d":140,"m":"y-locked","s":"smoke","l":[1100,1600],"o":26,"z":24,"vz":[40,70],"dr":0.4,"s0":[56,80],"s1":170,"o0":0.75}]},"nuke_impact_center":{"sk":"hard","L":[{"s":"flash","l":500,"z":30,"s0":320,"s1":80},{"m":"world","s":"shockwave","l":850,"z":2,"s0":80,"s1":720,"o0":0.95},{"d":60,"m":"y-locked","s":"plasma","l":1600,"w0":70,"w1":120,"h0":200,"h1":460,"o0":0.95},{"d":120,"s":"explosion-orange","l":1500,"z":380,"s0":220,"s1":540},{"n":8,"d":200,"s":"explosion-orange","l":[900,1300],"z":360,"o":80,"vx":120,"vy":120,"vz":[-20,60],"g":60,"dr":0.7,"s0":[80,140],"s1":[40,80],"o0":0.9}]},"empBurst_descent":{"dsm":320,"tm":320,"ar":2,"ite":"empBurst_impact_tile","ice":"empBurst_impact_center","ts":"target-ring-blue","L":[{"m":"y-locked","s":"plasma","l":320,"w0":70,"w1":100,"h0":700,"h1":200,"o1":0.9,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":320,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}}]},"empBurst_impact_tile":{"L":[{"n":14,"s":"spark-elec","l":[350,650],"z":14,"o":10,"vx":180,"vy":180,"vz":[60,220],"g":280,"dr":1.5,"s0":[8,14],"s1":1},{"n":2,"d":40,"s":"emp-arc","l":[220,380],"z":18,"o":6,"w0":[60,100],"w1":[40,70],"h0":6,"h1":1}]},"empBurst_impact_center":{"sk":"normal","L":[{"s":"flash","l":360,"z":24,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":680,"z":2,"s0":70,"s1":620,"o0":0.9},{"n":12,"d":30,"s":"emp-arc","l":[300,500],"z":22,"o":18,"vx":220,"vy":220,"vz":[40,120],"g":60,"dr":1,"w0":[80,140],"w1":[50,90],"h0":7,"h1":1}]},"raceCosmicSlam_descent":{"dsm":240,"tm":200,"ar":1,"ite":"raceCosmicSlam_impact_tile","ice":"raceCosmicSlam_impact_center","ts":"target-ring","L":[{"s":"meteor","l":240,"s0":110,"s1":80,"o1":1,"_d":{"fromZ":600,"toZ":null,"ease":"easeIn","trail":{"sprite":"dust-puff","rateMs":20,"jitter":12,"msRange":[300,500],"sizeRange":[14,22]}}}]},"raceCosmicSlam_impact_tile":{"L":[{"m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":120,"o0":0.78},{"n":6,"s":"dust-puff","l":[800,1300],"z":20,"o":16,"vx":140,"vy":140,"vz":[40,120],"g":-20,"dr":0.6,"s0":[44,70],"s1":140,"o0":0.75},{"n":14,"s":"debris","l":[400,700],"z":10,"o":10,"vx":220,"vy":220,"vz":[80,240],"g":600,"dr":1.6,"s0":[6,12],"s1":2},{"n":8,"s":"ember","l":[350,600],"z":12,"o":12,"vx":160,"vy":160,"vz":[60,180],"g":420,"dr":1.5,"s0":[8,14],"s1":2}]},"raceCosmicSlam_impact_center":{"sk":"hard","L":[{"s":"flash","l":380,"z":20,"s0":220,"s1":50},{"m":"world","s":"shockwave","l":720,"z":2,"s0":70,"s1":540,"o0":0.95},{"n":3,"d":60,"s":"dust-puff","l":[1100,1500],"z":30,"o":12,"vz":[40,80],"dr":0.5,"s0":[100,130],"s1":240,"o0":0.8}]},"raceInfernalDecree_descent":{"dsm":450,"tm":450,"ar":1,"ite":"raceInfernalDecree_impact_tile","ice":"raceInfernalDecree_impact_center","ts":"target-ring","L":[{"m":"y-locked","s":"dark-flame","l":450,"w0":90,"w1":120,"h0":900,"h1":240,"o1":0.9,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":450,"s0":170,"s1":130,"o1":0.85,"_d":{"fromZ":880,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":22,"jitter":16,"msRange":[400,700],"sizeRange":[14,22]}}}]},"raceInfernalDecree_impact_tile":{"L":[{"m":"world","s":"scorch","l":2400,"z":1,"s0":118,"s1":140,"o0":0.96},{"m":"y-locked","s":"dark-flame","l":1100,"w0":48,"w1":22,"h0":70,"h1":160},{"n":4,"d":50,"m":"y-locked","s":"dark-flame","l":[500,800],"o":22,"w0":18,"w1":8,"h0":30,"h1":70},{"n":26,"s":"ember","l":[450,800],"z":14,"o":12,"vx":200,"vy":200,"vz":[60,220],"g":400,"dr":1.4,"s0":[10,16],"s1":2},{"n":5,"d":130,"m":"y-locked","s":"smoke","l":[1000,1500],"o":24,"z":22,"vz":[25,55],"dr":0.4,"s0":[54,76],"s1":150,"o0":0.75}]},"raceInfernalDecree_impact_center":{"sk":"normal","L":[{"s":"flash","l":420,"z":30,"s0":240,"s1":60},{"m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":480,"o0":0.9},{"n":16,"d":80,"s":"ember","l":[600,1000],"z":60,"o":28,"vx":80,"vy":80,"vz":[-120,-40],"g":360,"dr":1.2,"s0":[8,14],"s1":2}]},"divineIntervention_descent":{"dsm":380,"tm":280,"ar":0,"ice":"divineIntervention_impact","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":380,"w0":44,"w1":60,"h0":700,"h1":180,"o1":0.9,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":380,"s0":140,"s1":180,"o1":0.95,"_d":{"fromZ":700,"toZ":null,"ease":"easeIn"}}]},"divineIntervention_impact":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":90,"s1":220},{"s":"flash","l":320,"s0":120,"s1":30,"o0":0.9},{"n":14,"s":"heal-cross","l":[600,1000],"o":8,"vx":120,"vy":120,"vz":[40,180],"g":60,"dr":1.4,"s0":[10,16],"s1":2},{"n":8,"d":100,"s":"holy-light","l":[1000,1500],"o":14,"z":6,"vx":30,"vy":30,"vz":[60,160],"g":-30,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85}]},"raceStarDecree_descent":{"dsm":600,"tm":400,"ar":1,"ite":"raceStarDecree_impact_tile","ice":"raceStarDecree_impact_center","ts":"target-ring-green","L":[{"m":"y-locked","s":"plasma","l":600,"w0":90,"w1":140,"h0":950,"h1":280,"o1":0.92,"_d":{"fromZ":950,"toZ":null,"ease":"easeIn"}},{"s":"psi-pulse","l":600,"s0":240,"s1":280,"o1":0.95,"_d":{"fromZ":950,"toZ":null,"ease":"easeIn"}}]},"raceStarDecree_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":2000,"z":1,"s0":110,"s1":138,"o0":0.85},{"n":16,"s":"psi-pulse","l":[500,850],"z":14,"o":14,"vx":200,"vy":200,"vz":[60,220],"g":200,"dr":1.3,"s0":[10,18],"s1":2},{"m":"y-locked","s":"plasma","l":900,"w0":44,"w1":22,"h0":80,"h1":180}]},"raceStarDecree_impact_center":{"sk":"hard","L":[{"s":"psi-pulse","l":480,"z":30,"s0":280,"s1":80},{"m":"world","s":"shockwave","l":720,"z":2,"s0":80,"s1":540,"o0":0.9},{"d":30,"m":"world","s":"target-ring-green","l":1100,"z":3,"s0":140,"s1":480,"o0":0.85}]},"thunder1_descent":{"dsm":380,"tm":320,"ar":0,"ice":"thunder1_impact","ts":"target-ring-blue","L":[{"m":"y-locked","s":"lightning","l":380,"w0":30,"w1":18,"h0":800,"h1":200,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"spark-blue","l":380,"s0":160,"s1":220,"o1":0.95,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}}]},"thunder1_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":2,"s0":80,"s1":200},{"s":"flash","l":240,"s0":140,"s1":36},{"n":20,"s":"spark-blue","l":[400,800],"o":6,"vx":200,"vy":200,"vz":[60,220],"g":200,"dr":1.4,"s0":[10,18],"s1":2},{"n":3,"d":40,"s":"emp-arc","l":[250,400],"z":14,"o":10,"w0":[70,110],"w1":[40,70],"h0":6,"h1":1}]},"thunder1_chain_hop":{"L":[{"s":"spark-blue","l":320,"s0":100,"s1":30},{"n":12,"s":"spark-blue","l":[350,650],"o":6,"vx":160,"vy":160,"vz":[40,180],"g":200,"dr":1.4,"s0":[8,14],"s1":2},{"n":2,"d":30,"s":"emp-arc","l":[200,350],"z":14,"o":8,"w0":[50,80],"w1":[30,50],"h0":5,"h1":1}]},"raceDivineJudgment_descent":{"dsm":400,"tm":500,"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":400,"w0":80,"w1":120,"h0":900,"h1":240,"o1":0.92,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":400,"s0":220,"s1":260,"o1":0.95,"_d":{"fromZ":900,"toZ":null,"ease":"easeIn"}}]},"raceSolarCorona_descent":{"dsm":360,"tm":420,"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","ts":"target-ring-gold","L":[{"m":"y-locked","s":"holy-pillar","l":360,"w0":60,"w1":100,"h0":820,"h1":200,"o1":0.9,"_d":{"fromZ":820,"toZ":null,"ease":"easeIn"}},{"s":"flash","l":360,"s0":180,"s1":220,"o1":0.95,"_d":{"fromZ":820,"toZ":null,"ease":"easeIn"}}]},"electroDart_impact":{"L":[{"s":"flash","l":180,"s0":70,"s1":22},{"n":10,"s":"spark-elec","l":[300,550],"o":6,"vx":140,"vy":140,"vz":[40,160],"g":240,"dr":1.6,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[200,320],"z":10,"o":8,"w0":[50,80],"w1":[30,55],"h0":5,"h1":1}]},"taser_impact":{"sk":"normal","L":[{"s":"flash","l":280,"z":4,"s0":140,"s1":36},{"n":22,"s":"spark-elec","l":[400,750],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":260,"dr":1.4,"s0":[9,16],"s1":2},{"n":3,"d":40,"s":"emp-arc","l":[280,450],"z":14,"o":12,"w0":[80,120],"w1":[50,80],"h0":7,"h1":1},{"a":"floor","m":"world","s":"stun-ring","l":520,"z":3,"s0":60,"s1":200},{"d":140,"a":"floor","m":"world","s":"stun-ring","l":520,"z":3,"s0":60,"s1":180,"o0":0.9},{"d":280,"a":"floor","m":"world","s":"stun-ring","l":480,"z":3,"s0":50,"s1":160,"o0":0.8}]},"knifeThrow_impact":{"L":[{"s":"flash","l":160,"s0":55,"s1":18,"o0":0.95},{"n":10,"s":"steel-spark","l":[180,320],"z":4,"o":6,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.6,"w0":[12,22],"w1":[4,10],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[400,700],"o":5,"vx":140,"vy":140,"vz":[30,140],"g":420,"dr":1.5,"s0":[6,12],"s1":1}]},"shoot_impact":{"L":[{"s":"muzzle-flash","l":140,"s0":60,"s1":16},{"n":6,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[30,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,650],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,10],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,32],"s1":[50,70],"o0":0.55}]},"doubleShot_impact":{"L":[{"s":"muzzle-flash","l":160,"s0":70,"s1":18},{"n":7,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,140],"g":320,"dr":1.6,"w0":[12,20],"w1":[4,8],"h0":3,"h1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[24,34],"s1":[54,74],"o0":0.55}]},"headshot_impact":{"sk":"normal","L":[{"s":"muzzle-flash","l":200,"z":2,"s0":90,"s1":22},{"n":6,"s":"steel-spark","l":[220,380],"z":4,"o":6,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.5,"w0":[14,24],"w1":[5,10],"h0":3,"h1":1},{"n":14,"d":20,"s":"blood-fleck","l":[500,850],"o":7,"vx":170,"vy":170,"vz":[50,180],"g":460,"dr":1.4,"s0":[8,14],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,850],"o":14,"vz":[20,45],"dr":0.5,"s0":[26,36],"s1":[60,82],"o0":0.6}]},"precisionShot_impact":{"L":[{"s":"muzzle-flash","l":140,"s0":65,"s1":14},{"n":4,"s":"steel-spark","l":[200,340],"z":4,"o":5,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.6,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,640],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,700],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,30],"s1":[50,68],"o0":0.5}]},"deadEye_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":70,"s1":90,"o0":0.85},{"s":"muzzle-flash","l":240,"z":4,"s0":120,"s1":30},{"d":50,"s":"muzzle-flash","l":200,"z":6,"s0":80,"s1":20,"o0":0.85},{"n":9,"s":"steel-spark","l":[250,420],"z":4,"o":7,"vx":220,"vy":220,"vz":[60,200],"g":320,"dr":1.5,"w0":[14,26],"w1":[5,10],"h0":3,"h1":1},{"n":16,"d":20,"s":"blood-fleck","l":[550,950],"o":8,"vx":190,"vy":190,"vz":[60,200],"g":460,"dr":1.4,"s0":[8,15],"s1":1},{"n":5,"d":30,"s":"debris","l":[500,800],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":520,"dr":1.4,"s0":[6,11],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[700,1000],"o":16,"vz":[25,50],"dr":0.5,"s0":[32,44],"s1":[70,100],"o0":0.65}]},"kneecapShot_impact":{"L":[{"a":"floor","s":"muzzle-flash","l":160,"z":18,"s0":55,"s1":14},{"n":4,"a":"floor","s":"steel-spark","l":[180,320],"z":12,"o":6,"vx":150,"vy":150,"vz":[20,80],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":9,"d":20,"a":"floor","s":"blood-fleck","l":[450,750],"z":8,"o":7,"vx":140,"vy":140,"vz":[20,90],"g":480,"dr":1.5,"s0":[6,11],"s1":1},{"n":2,"d":25,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[60,88],"o0":0.6}]},"shieldBash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":8,"s":"steel-spark","l":[200,380],"z":4,"o":7,"vx":180,"vy":180,"vz":[40,160],"g":320,"dr":1.5,"w0":[14,22],"w1":[5,10],"h0":3,"h1":1},{"a":"floor","m":"world","s":"shockwave","l":480,"z":2,"s0":40,"s1":160,"o0":0.8},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[28,40],"s1":[60,90],"o0":0.65}]},"dragonSlash_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":60,"s1":80,"o0":0.7},{"s":"flash","l":240,"s0":110,"s1":28},{"n":5,"s":"flame","l":[380,600],"z":4,"o":18,"vx":120,"vy":80,"vz":[30,100],"g":80,"dr":0.8,"w0":[16,28],"w1":[8,14],"h0":[22,36],"h1":[10,18]},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":7,"vx":170,"vy":170,"vz":[50,180],"g":460,"dr":1.4,"s0":[8,14],"s1":1}]},"guardSlash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":7,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":7,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,800],"o":14,"vz":[20,45],"dr":0.5,"s0":[26,36],"s1":[56,80],"o0":0.6}]},"sneakSlash_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":6,"s":"steel-spark","l":[120,240],"z":4,"o":4,"vx":200,"vy":60,"vz":[20,80],"g":180,"dr":1.8,"w0":[14,24],"w1":[4,8],"h0":3,"h1":1},{"n":5,"s":"dark-flame","l":[350,600],"z":6,"o":14,"vx":130,"vy":100,"vz":[40,130],"g":120,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[8,13],"s1":1}]},"improvise_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":460,"z":2,"s0":36,"s1":140,"o0":0.75},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":3,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":18,"vz":[25,50],"dr":0.5,"s0":[28,40],"s1":[60,90],"o0":0.6}]},"reallyGoodPunch_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":38,"s1":150,"o0":0.8},{"n":2,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,850],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[58,84],"o0":0.65},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"cannonBlast_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":130,"o0":0.9},{"s":"explosion-orange","l":360,"z":4,"s0":110,"s1":180},{"n":4,"d":30,"s":"explosion-orange","l":[320,500],"z":6,"o":12,"vx":120,"vy":120,"vz":[40,140],"g":200,"dr":1.2,"s0":[40,64],"s1":[12,22],"o0":0.95},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":60,"s1":320,"o0":0.9},{"n":8,"d":30,"s":"debris","l":[500,850],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":520,"dr":1.4,"s0":[8,14],"s1":1},{"n":3,"d":120,"m":"y-locked","s":"smoke","l":[1100,1600],"o":20,"vz":[30,55],"dr":0.4,"s0":[48,64],"s1":[120,160],"o0":0.7}]},"anchorToss_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":640,"z":2,"s0":50,"s1":240,"o0":0.85},{"n":4,"d":20,"a":"floor","m":"y-locked","s":"dust-puff","l":[800,1200],"o":22,"vz":[30,60],"dr":0.45,"s0":[32,48],"s1":[70,110],"o0":0.7},{"n":6,"d":30,"s":"debris","l":[550,900],"o":8,"vx":170,"vy":170,"vz":[60,200],"g":540,"dr":1.4,"s0":[8,14],"s1":1}]},"boardingRush_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"s":"explosion-orange","l":320,"z":4,"s0":80,"s1":140},{"a":"floor","m":"world","s":"shockwave","l":540,"z":2,"s0":42,"s1":200,"o0":0.8},{"n":4,"d":30,"s":"debris","l":[450,750],"o":7,"vx":160,"vy":160,"vz":[50,160],"g":520,"dr":1.4,"s0":[7,12],"s1":1},{"n":7,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,50],"dr":0.5,"s0":[28,38],"s1":[60,86],"o0":0.6}]},"psychosis_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":240,"s0":90,"s1":24},{"a":"floor","m":"world","s":"psi-pulse","l":520,"z":2,"s0":50,"s1":200,"o0":0.85},{"d":120,"a":"floor","m":"world","s":"psi-pulse","l":580,"z":2,"s0":50,"s1":220,"o0":0.75},{"n":5,"d":30,"m":"y-locked","s":"void-mist","l":[1000,1500],"o":18,"vz":[25,50],"dr":0.4,"s0":[38,56],"s1":[80,120],"o0":0.7},{"n":6,"s":"psi-pulse","l":[350,600],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":180,"dr":1.4,"s0":[8,14],"s1":1}]},"mindShatter_impact":{"sk":"hard","L":[{"s":"psi-pulse","l":320,"z":4,"s0":140,"s1":36},{"a":"floor","m":"world","s":"psi-pulse","l":620,"z":2,"s0":70,"s1":320,"o0":0.9},{"d":130,"a":"floor","m":"world","s":"psi-pulse","l":640,"z":2,"s0":70,"s1":300,"o0":0.85},{"d":260,"a":"floor","m":"world","s":"psi-pulse","l":600,"z":2,"s0":60,"s1":280,"o0":0.75},{"n":8,"d":40,"m":"y-locked","s":"void-mist","l":[1200,1800],"o":22,"vz":[25,55],"dr":0.4,"s0":[46,70],"s1":[100,150],"o0":0.75},{"n":14,"s":"psi-pulse","l":[400,750],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":220,"dr":1.4,"s0":[10,18],"s1":1}]},"kineticHurl_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"psi-pulse","l":440,"z":2,"s0":50,"s1":180,"o0":0.8},{"n":6,"s":"debris","l":[400,700],"o":7,"vx":170,"vy":170,"vz":[50,170],"g":500,"dr":1.4,"s0":[7,12],"s1":1},{"n":3,"d":30,"m":"y-locked","s":"void-mist","l":[800,1200],"o":16,"vz":[25,45],"dr":0.4,"s0":[34,48],"s1":[70,100],"o0":0.6}]},"exorcism_impact":{"sk":"normal","L":[{"s":"flash","l":240,"s0":100,"s1":28},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.85},{"n":16,"s":"divine-sparkle","l":[450,800],"o":6,"vx":160,"vy":160,"vz":[60,200],"g":100,"dr":1.3,"s0":[9,16],"s1":2},{"n":7,"d":80,"s":"holy-light","l":[800,1200],"o":12,"z":6,"vx":40,"vy":40,"vz":[70,160],"g":-40,"dr":0.8,"s0":[8,13],"s1":1,"o0":0.9}]},"lifeDrain_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":14,"vx":130,"vy":100,"vz":[50,140],"g":80,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[450,750],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[8,13],"s1":1}]},"lifeDrain_drainHop":{"L":[{"n":2,"s":"dark-flame","l":[200,350],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,80],"g":40,"dr":1,"w0":[10,14],"w1":[4,7],"h0":[12,18],"h1":[5,9],"o0":0.85},{"n":3,"s":"blood-fleck","l":[180,320],"o":5,"vx":70,"vy":70,"vz":[30,80],"g":380,"dr":1.6,"s0":[4,8],"s1":1,"o0":0.9}]},"ricochet1_impact":{"L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":12,"s":"spark-blue","l":[300,550],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":4,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[40,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDemonicClaw_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":2,"s":"dark-flame","l":[320,500],"z":6,"o":10,"vx":90,"vy":80,"vz":[40,110],"g":120,"dr":0.9,"w0":[14,22],"w1":[6,10],"h0":[18,28],"h1":[8,14],"o0":0.9},{"n":7,"d":20,"s":"blood-fleck","l":[400,680],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceSmite_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"n":7,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,750],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,32],"s1":[50,70],"o0":0.55}]},"racePounce_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[56,80],"o0":0.6}]},"raceNinefoldScratch_impact":{"L":[{"s":"flash","l":140,"s0":55,"s1":16,"o0":0.9},{"n":5,"s":"steel-spark","l":[160,280],"z":4,"o":5,"vx":150,"vy":150,"vz":[30,130],"g":320,"dr":1.6,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":4,"d":20,"s":"blood-fleck","l":[340,580],"o":5,"vx":130,"vy":130,"vz":[30,120],"g":440,"dr":1.5,"s0":[6,10],"s1":1}]},"raceLastStand_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":82,"s1":22},{"n":6,"s":"steel-spark","l":[200,360],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,22],"w1":[5,10],"h0":3,"h1":1},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[24,34],"s1":[54,78],"o0":0.6}]},"raceHeroicLeap_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":480,"z":2,"s0":38,"s1":160,"o0":0.75},{"n":5,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,140],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,36],"s1":[58,84],"o0":0.6}]},"raceTailWhip_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":10,"s":"spark-blue","l":[280,500],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,13],"s1":1},{"n":4,"s":"steel-spark","l":[180,320],"z":4,"o":5,"vx":150,"vy":150,"vz":[40,130],"g":320,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":5,"d":20,"s":"blood-fleck","l":[380,640],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1}]},"raceBorrowedClaw_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"n":14,"s":"spark-blue","l":[320,560],"o":7,"vx":180,"vy":180,"vz":[40,180],"g":240,"dr":1.5,"s0":[9,15],"s1":1},{"n":6,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":170,"vy":170,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"n":9,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1}]},"raceInfectiousBite_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":20},{"n":4,"s":"dark-flame","l":[350,550],"z":6,"o":12,"vx":110,"vy":90,"vz":[40,120],"g":100,"dr":0.9,"w0":[16,24],"w1":[7,12],"h0":[20,30],"h1":[9,15],"o0":0.92},{"n":10,"d":20,"s":"blood-fleck","l":[450,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":2,"d":80,"m":"y-locked","s":"smoke","l":[900,1300],"o":16,"vz":[25,50],"dr":0.4,"s0":[38,54],"s1":[90,130],"o0":0.55}]},"raceWeighTheHeart_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[380,600],"z":6,"o":14,"vx":120,"vy":100,"vz":[40,130],"g":100,"dr":0.9,"w0":[18,26],"w1":[8,13],"h0":[22,32],"h1":[10,16],"o0":0.92},{"n":8,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBoneToss_impact":{"L":[{"s":"flash","l":160,"s0":60,"s1":16,"o0":0.9},{"n":7,"s":"debris","l":[450,750],"o":7,"vx":160,"vy":160,"vz":[50,160],"g":480,"dr":1.4,"s0":[7,13],"s1":1},{"n":6,"d":20,"s":"blood-fleck","l":[400,680],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[500,700],"o":12,"vz":[20,40],"dr":0.5,"s0":[22,30],"s1":[50,68],"o0":0.5}]},"raceGoreCharge_impact":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":1,"s0":55,"s1":75,"o0":0.65},{"s":"flash","l":220,"s0":95,"s1":26},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":16,"vx":130,"vy":100,"vz":[40,130],"g":90,"dr":0.85,"w0":[18,28],"w1":[8,14],"h0":[22,32],"h1":[10,16],"o0":0.95},{"n":12,"d":20,"s":"blood-fleck","l":[460,760],"o":7,"vx":160,"vy":160,"vz":[50,170],"g":460,"dr":1.4,"s0":[8,13],"s1":1},{"n":2,"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[600,900],"o":16,"vz":[25,45],"dr":0.5,"s0":[26,38],"s1":[58,86],"o0":0.6}]},"raceVoidContract_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":100,"s1":28},{"n":7,"s":"dark-flame","l":[440,700],"z":6,"o":16,"vx":140,"vy":110,"vz":[50,150],"g":90,"dr":0.9,"w0":[20,30],"w1":[9,14],"h0":[24,36],"h1":[10,18],"o0":0.95},{"n":14,"d":20,"s":"blood-fleck","l":[480,800],"o":7,"vx":160,"vy":160,"vz":[50,180],"g":440,"dr":1.4,"s0":[8,14],"s1":1}]},"raceSoulSuck_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":90,"s1":24},{"n":5,"s":"dark-flame","l":[400,650],"z":6,"o":14,"vx":130,"vy":100,"vz":[50,140],"g":80,"dr":0.9,"w0":[18,28],"w1":[8,14],"h0":[22,34],"h1":[10,18],"o0":0.95},{"n":11,"d":20,"s":"blood-fleck","l":[440,740],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1}]},"raceLifetap_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":80,"s1":22},{"n":4,"s":"dark-flame","l":[380,600],"z":6,"o":12,"vx":120,"vy":100,"vz":[40,130],"g":90,"dr":0.9,"w0":[16,24],"w1":[7,12],"h0":[20,30],"h1":[9,15],"o0":0.9},{"n":9,"d":20,"s":"blood-fleck","l":[420,700],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":440,"dr":1.5,"s0":[7,12],"s1":1}]},"raceMandibleStrike_impact":{"L":[{"s":"flash","l":140,"s0":55,"s1":16,"o0":0.9},{"n":7,"s":"psi-pulse","l":[240,420],"o":5,"vx":150,"vy":150,"vz":[40,140],"g":220,"dr":1.5,"s0":[7,12],"s1":1},{"n":5,"d":20,"s":"blood-fleck","l":[340,560],"o":5,"vx":130,"vy":130,"vz":[30,130],"g":440,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDreamSiphon_impact":{"sk":"normal","L":[{"s":"psi-pulse","l":220,"s0":85,"s1":24},{"n":10,"s":"psi-pulse","l":[350,620],"o":6,"vx":160,"vy":160,"vz":[40,160],"g":180,"dr":1.4,"s0":[8,13],"s1":1},{"n":4,"d":30,"m":"y-locked","s":"void-mist","l":[900,1300],"o":18,"vz":[25,50],"dr":0.4,"s0":[36,52],"s1":[80,120],"o0":0.65}]},"raceVenomFang_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"n":8,"s":"psi-pulse","l":[320,560],"o":6,"vx":150,"vy":150,"vz":[40,150],"g":220,"dr":1.4,"s0":[8,13],"s1":1},{"n":11,"d":20,"s":"blood-fleck","l":[440,720],"o":6,"vx":150,"vy":150,"vz":[40,160],"g":440,"dr":1.5,"s0":[7,13],"s1":1},{"n":3,"d":60,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,45],"dr":0.4,"s0":[32,46],"s1":[70,100],"o0":0.6}]},"racePrismBurst_impact":{"L":[{"s":"flash","l":200,"s0":75,"s1":22},{"n":12,"s":"divine-sparkle","l":[380,650],"o":6,"vx":150,"vy":150,"vz":[50,180],"g":100,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"d":60,"s":"holy-light","l":[700,1100],"o":10,"z":6,"vx":40,"vy":40,"vz":[60,140],"g":-40,"dr":0.8,"s0":[7,12],"s1":1,"o0":0.85}]},"raceDivineSmite_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":95,"s1":26},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":45,"s1":140,"o0":0.8},{"n":12,"s":"divine-sparkle","l":[380,660],"o":6,"vx":150,"vy":150,"vz":[60,180],"g":100,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"s":"steel-spark","l":[200,340],"z":4,"o":6,"vx":160,"vy":160,"vz":[40,150],"g":320,"dr":1.5,"w0":[12,20],"w1":[5,9],"h0":3,"h1":1},{"d":30,"a":"floor","m":"y-locked","s":"dust-puff","l":[550,800],"o":14,"vz":[25,45],"dr":0.5,"s0":[24,32],"s1":[54,76],"o0":0.55}]},"raceCrashLoop_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":22},{"n":14,"s":"spark-elec","l":[350,600],"o":7,"vx":180,"vy":180,"vz":[50,180],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":3,"d":30,"s":"emp-arc","l":[240,380],"z":12,"o":10,"w0":[70,110],"w1":[40,70],"h0":6,"h1":1},{"n":3,"d":30,"s":"debris","l":[400,650],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.95}]},"dreamSiphon_drainHop":{"L":[{"n":2,"s":"psi-pulse","l":[200,350],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,80],"g":40,"dr":1,"s0":[6,10],"s1":1,"o0":0.85},{"m":"y-locked","s":"void-mist","l":[300,500],"o":6,"vz":[20,40],"dr":0.5,"s0":[14,22],"s1":[30,48],"o0":0.6}]},"plasmaGun_beam":{"cm":90,"bs":"plasma","bt":16,"bhs":"flash","bm":300,"ite":"plasmaGun_impact_tile","ice":null,"ls":false,"sk":"normal"},"plasmaGun_impact_tile":{"L":[{"s":"flash","l":220,"s0":72,"s1":18,"o0":0.95},{"n":8,"s":"spark-elec","l":[280,520],"z":6,"o":8,"vx":150,"vy":150,"vz":[50,180],"g":260,"dr":1.6,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[180,280],"z":10,"o":4,"w0":[40,70],"w1":[25,45],"h0":5,"h1":1,"o0":0.95}]},"raceHellmouth_beam":{"cm":110,"bs":"dark-flame","bt":26,"bhs":"flame","bm":360,"ite":"raceHellmouth_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceHellmouth_impact_tile":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":800,"z":2,"s0":96,"s1":116,"o0":0.75},{"a":"floor","m":"y-locked","s":"dark-flame","l":460,"w0":62,"w1":44,"h0":84,"h1":130,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame","l":380,"w0":34,"w1":18,"h0":60,"h1":100,"o0":0.85},{"n":8,"s":"ember","l":[320,600],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,160],"g":280,"dr":1.5,"s0":[7,12],"s1":1}]},"raceFormicAcid_beam":{"cm":80,"bs":"acid-green","bt":18,"bhs":"acid-green","bm":320,"ite":"raceFormicAcid_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceFormicAcid_impact_tile":{"L":[{"s":"acid-green","l":220,"s0":72,"s1":22,"o0":0.95},{"n":9,"s":"acid-green","l":[320,580],"z":4,"o":8,"vx":140,"vy":140,"vz":[30,150],"g":320,"dr":1.5,"s0":[8,14],"s1":2},{"n":2,"d":60,"m":"y-locked","s":"acid-green","l":[700,1100],"o":14,"vz":[15,35],"dr":0.5,"s0":[22,30],"s1":[55,75],"o0":0.55}]},"raceSonicBreaker_beam":{"cm":80,"bs":"spark-blue","bt":22,"bhs":"flash","bm":300,"ite":"raceSonicBreaker_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceSonicBreaker_impact_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":480,"z":2,"s0":40,"s1":140,"o0":0.85},{"s":"spark-blue","l":220,"s0":60,"s1":16},{"n":6,"s":"spark-blue","l":[280,500],"z":6,"o":6,"vx":130,"vy":130,"vz":[40,130],"g":260,"dr":1.5,"s0":[6,11],"s1":1}]},"raceHeatRay_beam":{"cm":120,"bs":"heat-ray","bt":18,"bhs":"explosion-orange","bm":360,"ite":"raceHeatRay_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceHeatRay_impact_tile":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":800,"z":2,"s0":88,"s1":110,"o0":0.85},{"s":"heat-ray","l":240,"s0":72,"s1":20},{"n":8,"s":"ember","l":[320,580],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,150],"g":280,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBalefulGaze_beam":{"cm":130,"bs":"psi-pulse","bt":22,"bhs":"psi-pulse","bm":380,"ite":"raceBalefulGaze_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceBalefulGaze_impact_tile":{"L":[{"s":"psi-pulse","l":250,"s0":78,"s1":22},{"n":2,"d":40,"m":"y-locked","s":"void-mist","l":[600,1000],"o":12,"vz":[15,40],"dr":0.4,"s0":[26,36],"s1":[60,80],"o0":0.7},{"n":5,"s":"psi-pulse","l":[300,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,130],"g":220,"dr":1.4,"s0":[6,10],"s1":1}]},"raceEntropicBeam_beam":{"cm":100,"bs":"psi-pulse","bt":20,"bhs":"psi-pulse","bm":340,"ite":"raceEntropicBeam_impact_tile","ice":null,"ls":false,"sk":"normal"},"raceEntropicBeam_impact_tile":{"L":[{"s":"psi-pulse","l":220,"s0":64,"s1":18},{"n":6,"s":"spark-blue","l":[320,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[40,160],"g":240,"dr":1.5,"s0":[6,10],"s1":1},{"n":2,"d":40,"m":"y-locked","s":"void-mist","l":[600,950],"o":10,"vz":[15,35],"dr":0.4,"s0":[20,28],"s1":[50,70],"o0":0.6}]},"raceLaserBeam_beam":{"cm":70,"bs":"laser-pink","bt":12,"bhs":"flash","bm":280,"ite":"raceLaserBeam_impact_tile","ice":null,"ls":true,"sk":"normal"},"raceLaserBeam_impact_tile":{"L":[{"s":"flash","l":200,"s0":64,"s1":16},{"n":8,"s":"laser-pink","l":[280,520],"z":4,"o":6,"vx":150,"vy":150,"vz":[40,160],"g":260,"dr":1.6,"s0":[6,10],"s1":1},{"n":4,"s":"ember","l":[240,420],"z":6,"o":4,"vx":120,"vy":120,"vz":[50,140],"g":320,"dr":1.5,"s0":[5,9],"s1":1}]},"broadside_aoe":{"ar":1,"sh":"square","ite":"broadside_impact_tile","ice":"broadside_impact_center"},"broadside_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":2,"s0":70,"s1":100,"o0":0.7},{"s":"explosion-orange","l":360,"s0":64,"s1":32},{"n":3,"d":60,"m":"y-locked","s":"smoke","l":[700,1100],"o":14,"vz":[25,50],"dr":0.4,"s0":[30,44],"s1":[70,100],"o0":0.65},{"n":6,"s":"debris","l":[350,650],"z":4,"o":8,"vx":130,"vy":130,"vz":[60,180],"g":360,"dr":1.4,"s0":[4,8],"s1":1}]},"broadside_impact_center":{"sk":"hard","L":[{"s":"flash","l":280,"z":16,"s0":220,"s1":60},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":80,"s1":600,"o0":0.9},{"s":"explosion-orange","l":480,"z":8,"s0":140,"s1":60},{"a":"floor","m":"world","s":"dust-puff","l":1400,"z":2,"s0":140,"s1":240,"o0":0.8}]},"raceChassisSlan_aoe":{"ar":1,"ite":"raceChassisSlan_impact_tile","ice":"raceChassisSlan_impact_center"},"raceChassisSlan_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":60,"s1":92,"o0":0.75},{"s":"flash","l":200,"s0":48,"s1":16,"o0":0.9},{"n":6,"s":"debris","l":[350,600],"z":4,"o":8,"vx":120,"vy":120,"vz":[60,170],"g":380,"dr":1.5,"s0":[4,8],"s1":1},{"n":3,"s":"spark-elec","l":[200,380],"z":6,"o":6,"vx":100,"vy":100,"vz":[40,100],"g":280,"dr":1.4,"s0":[5,8],"s1":1}]},"raceChassisSlan_impact_center":{"sk":"hard","L":[{"s":"flash","l":240,"z":14,"s0":180,"s1":40},{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":70,"s1":480,"o0":0.9},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":110,"s1":220,"o0":0.85}]},"raceEMPGrenade_aoe":{"ar":1,"ite":"raceEMPGrenade_impact_tile","ice":"raceEMPGrenade_impact_center"},"raceEMPGrenade_impact_tile":{"L":[{"n":10,"s":"spark-elec","l":[300,580],"z":10,"o":8,"vx":150,"vy":150,"vz":[50,180],"g":240,"dr":1.5,"s0":[7,12],"s1":1},{"n":2,"d":30,"s":"emp-arc","l":[200,320],"z":14,"o":6,"w0":[50,90],"w1":[30,60],"h0":5,"h1":1}]},"raceEMPGrenade_impact_center":{"sk":"normal","L":[{"s":"flash","l":300,"z":18,"s0":180,"s1":50},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":60,"s1":480,"o0":0.85},{"n":8,"s":"emp-arc","l":[260,440],"z":18,"o":14,"vx":180,"vy":180,"vz":[40,100],"g":60,"dr":1,"w0":[70,120],"w1":[40,70],"h0":6,"h1":1}]},"raceMortarSalvo_aoe":{"ar":1,"ite":"raceMortarSalvo_impact_tile","ice":"raceMortarSalvo_impact_center","mi":{"sprite":"missile","w":128,"h":128,"flyMs":450,"arcHeight":250,"gravity":900,"stagger":50,"trailCount":4}},"raceMortarSalvo_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":2,"s0":80,"s1":110,"o0":0.85},{"s":"explosion-orange","l":380,"s0":80,"s1":36},{"n":8,"s":"debris","l":[400,700],"z":4,"o":10,"vx":160,"vy":160,"vz":[80,220],"g":380,"dr":1.3,"s0":[5,10],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"smoke","l":[900,1300],"o":16,"vz":[30,55],"dr":0.4,"s0":[34,50],"s1":[80,120],"o0":0.7}]},"raceMortarSalvo_impact_center":{"sk":"hard","L":[{"s":"flash","l":300,"z":18,"s0":260,"s1":70},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":90,"s1":640,"o0":0.95},{"s":"explosion-orange","l":540,"z":10,"s0":160,"s1":70},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":160,"s1":260,"o0":0.85}]},"overgrowth_aoe":{"ar":1,"ite":"overgrowth_impact_tile","ice":"overgrowth_impact_center"},"overgrowth_impact_tile":{"L":[{"a":"floor","m":"y-locked","s":"vine-green","l":720,"w0":30,"w1":18,"h0":60,"h1":130,"o0":0.95},{"n":6,"s":"vine-green","l":[380,600],"z":4,"o":8,"vx":110,"vy":110,"vz":[50,150],"g":200,"dr":1.3,"s0":[6,11],"s1":2},{"a":"floor","m":"world","s":"vine-green","l":1000,"z":2,"s0":60,"s1":100,"o0":0.5}]},"overgrowth_impact_center":{"sk":"normal","L":[{"a":"floor","m":"y-locked","s":"vine-green","l":850,"w0":70,"w1":40,"h0":100,"h1":200},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":70,"s1":480,"o0":0.7},{"n":8,"d":40,"s":"vine-green","l":[500,800],"z":8,"o":14,"vx":140,"vy":140,"vz":[50,170],"g":150,"dr":1,"s0":[6,12],"s1":2}]},"raceEarthshaker_aoe":{"ar":1,"ite":"raceEarthshaker_impact_tile","ice":"raceEarthshaker_impact_center"},"raceEarthshaker_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":70,"s1":110,"o0":0.8},{"n":7,"s":"debris","l":[400,700],"z":4,"o":10,"vx":140,"vy":140,"vz":[70,200],"g":400,"dr":1.3,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"fire-glow","l":400,"z":2,"s0":50,"s1":80,"o0":0.4}]},"raceEarthshaker_impact_center":{"sk":"hard","L":[{"s":"flash","l":240,"z":12,"s0":180,"s1":40,"o0":0.95},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":80,"s1":560,"o0":0.95},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":130,"s1":260,"o0":0.85}]},"raceGlitterburst_aoe":{"ar":1,"ite":"raceGlitterburst_impact_tile","ice":"raceGlitterburst_impact_center"},"raceGlitterburst_impact_tile":{"L":[{"n":6,"s":"divine-sparkle","l":[400,700],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,140],"g":200,"dr":1.4,"s0":[5,10],"s1":1},{"n":4,"d":30,"s":"spark-blue","l":[350,600],"z":8,"o":8,"vx":100,"vy":100,"vz":[50,130],"g":180,"dr":1.4,"s0":[4,8],"s1":1},{"n":4,"d":60,"s":"laser-pink","l":[380,620],"z":8,"o":8,"vx":100,"vy":100,"vz":[50,130],"g":180,"dr":1.4,"s0":[4,8],"s1":1}]},"raceGlitterburst_impact_center":{"sk":"soft","L":[{"s":"flash","l":260,"z":14,"s0":130,"s1":30,"o0":0.95},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":60,"s1":280,"o0":0.8},{"n":6,"s":"divine-sparkle","l":[400,700],"z":12,"o":12,"vx":160,"vy":160,"vz":[60,170],"g":160,"dr":1.2,"s0":[6,12],"s1":1}]},"raceSignalPulse_aoe":{"ar":1,"ite":"raceSignalPulse_impact_tile","ice":"raceSignalPulse_impact_center"},"raceSignalPulse_impact_tile":{"L":[{"s":"psi-pulse","l":280,"s0":70,"s1":22,"o0":0.95},{"n":5,"s":"spark-elec","l":[320,550],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,140],"g":240,"dr":1.5,"s0":[6,10],"s1":1},{"d":40,"s":"emp-arc","l":[180,280],"z":10,"o":4,"w0":[40,70],"w1":[25,45],"h0":4,"h1":1,"o0":0.95}]},"raceSignalPulse_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":350,"z":14,"s0":180,"s1":40},{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":360,"o0":0.9},{"n":6,"s":"emp-arc","l":[240,400],"z":14,"o":12,"vx":160,"vy":160,"vz":[40,100],"g":80,"dr":1,"w0":[60,110],"w1":[35,60],"h0":5,"h1":1}]},"raceTremorStomp_aoe":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"raceTremorStomp_impact_center"},"raceTremorStomp_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":58,"s1":96,"o0":0.7},{"n":5,"s":"debris","l":[320,550],"z":4,"o":8,"vx":110,"vy":110,"vz":[50,150],"g":380,"dr":1.4,"s0":[4,8],"s1":1}]},"raceTremorStomp_impact_center":{"sk":"normal","L":[{"s":"flash","l":220,"z":10,"s0":140,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":60,"s1":400,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":110,"s1":200,"o0":0.75}]},"raceBatSwarm_aoe":{"ar":1,"ite":"raceBatSwarm_impact_tile","ice":"raceBatSwarm_impact_center"},"raceBatSwarm_impact_tile":{"L":[{"n":2,"m":"y-locked","s":"void-mist","l":[600,900],"o":14,"vz":[20,60],"dr":0.4,"s0":[30,44],"s1":[60,90],"o0":0.85},{"n":10,"s":"blood-fleck","l":[400,750],"z":8,"o":10,"vx":160,"vy":160,"vz":[40,130],"g":80,"dr":1,"s0":[4,8],"s1":1,"o0":0.95},{"s":"dark-flame","l":280,"z":2,"s0":50,"s1":24,"o0":0.8},{"n":2,"d":50,"s":"bat-1","l":[500,900],"z":12,"o":12,"vx":180,"vy":140,"vz":[30,120],"g":30,"dr":0.6,"s0":[20,28],"s1":[8,12]},{"n":2,"d":100,"s":"bat-2","l":[600,950],"z":16,"o":14,"vx":200,"vy":160,"vz":[50,140],"g":20,"dr":0.5,"s0":[18,26],"s1":[6,10]},{"d":70,"s":"bat-3","l":[550,850],"z":10,"o":10,"vx":150,"vy":170,"vz":[40,110],"g":40,"dr":0.7,"s0":[22,30],"s1":[8,14]},{"d":120,"s":"bat-4","l":[650,1000],"z":14,"o":16,"vx":190,"vy":150,"vz":[60,130],"g":25,"dr":0.55,"s0":[20,28],"s1":[7,11]}]},"raceBatSwarm_impact_center":{"sk":"soft","L":[{"n":2,"m":"y-locked","s":"void-mist","l":[800,1200],"o":18,"vz":[30,70],"dr":0.3,"s0":[50,70],"s1":[110,150],"o0":0.9},{"n":14,"s":"blood-fleck","l":[500,850],"z":14,"o":16,"vx":220,"vy":220,"vz":[60,180],"g":60,"dr":0.9,"s0":[5,10],"s1":1},{"n":3,"d":30,"s":"bat-1","l":[600,1100],"z":20,"o":18,"vx":240,"vy":200,"vz":[70,200],"g":20,"dr":0.5,"s0":[24,32],"s1":[10,14]},{"n":3,"d":60,"s":"bat-3","l":[700,1200],"z":18,"o":20,"vx":260,"vy":220,"vz":[80,190],"g":15,"dr":0.45,"s0":[22,30],"s1":[8,12]},{"n":2,"d":90,"s":"bat-2","l":[650,1050],"z":22,"o":16,"vx":200,"vy":240,"vz":[60,170],"g":25,"dr":0.55,"s0":[26,34],"s1":[10,16]},{"n":2,"d":110,"s":"bat-4","l":[750,1150],"z":24,"o":22,"vx":230,"vy":210,"vz":[90,210],"g":18,"dr":0.5,"s0":[24,32],"s1":[9,13]}]},"raceDarkDominion_aoe":{"ar":1,"ite":"raceDarkDominion_impact_tile","ice":"raceDarkDominion_impact_center"},"raceDarkDominion_impact_tile":{"L":[{"a":"floor","m":"y-locked","s":"dark-flame","l":520,"w0":50,"w1":30,"h0":70,"h1":130,"o0":0.92},{"a":"floor","m":"y-locked","s":"flame","l":420,"w0":24,"w1":14,"h0":50,"h1":90,"o0":0.85},{"a":"floor","m":"world","s":"scorch","l":1500,"z":2,"s0":80,"s1":110,"o0":0.85},{"n":7,"s":"ember","l":[320,600],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,150],"g":280,"dr":1.5,"s0":[6,11],"s1":1}]},"raceDarkDominion_impact_center":{"sk":"hard","L":[{"s":"flash","l":300,"z":16,"s0":240,"s1":60},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":70,"s1":540,"o0":0.9},{"a":"floor","m":"y-locked","s":"dark-flame","l":700,"w0":90,"w1":50,"h0":130,"h1":230},{"n":2,"d":60,"m":"y-locked","s":"void-mist","l":[900,1300],"o":14,"vz":[20,50],"dr":0.4,"s0":[40,56],"s1":[90,130],"o0":0.75}]},"raceDarkLullaby_aoe":{"ar":1,"ite":"raceDarkLullaby_impact_tile","ice":"raceDarkLullaby_impact_center"},"raceDarkLullaby_impact_tile":{"L":[{"n":3,"m":"y-locked","s":"void-mist","l":[900,1400],"o":12,"vz":[10,30],"dr":0.6,"s0":[25,38],"s1":[60,90],"o0":0.7},{"s":"dark-flame","l":380,"z":4,"s0":50,"s1":28,"o0":0.7},{"n":3,"d":60,"s":"ember","l":[400,700],"z":6,"o":8,"vx":60,"vy":60,"vz":[10,50],"g":80,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.7}]},"raceDarkLullaby_impact_center":{"sk":"soft","L":[{"s":"flash","l":350,"z":12,"s0":160,"s1":40,"o0":0.7},{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":70,"s1":320,"o0":0.6},{"n":2,"m":"y-locked","s":"void-mist","l":[1100,1500],"o":16,"vz":[10,30],"dr":0.5,"s0":[55,75],"s1":[110,150],"o0":0.8}]},"raceDemonicRoar_aoe":{"ar":2,"ite":"raceDemonicRoar_impact_tile","ice":"raceDemonicRoar_impact_center"},"raceDemonicRoar_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":90,"o0":0.55},{"s":"dark-flame","l":320,"z":4,"s0":44,"s1":22,"o0":0.75}]},"raceDemonicRoar_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":900,"o0":0.95},{"a":"floor","m":"y-locked","s":"dark-flame","l":600,"w0":80,"w1":40,"h0":120,"h1":210,"o0":0.95},{"a":"floor","m":"y-locked","s":"flame","l":500,"w0":40,"w1":20,"h0":80,"h1":150,"o0":0.85},{"s":"flash","l":260,"z":14,"s0":180,"s1":40,"o0":0.95}]},"raceNightmarePulse_aoe":{"ar":1,"ite":"raceNightmarePulse_impact_tile","ice":"raceNightmarePulse_impact_center"},"raceNightmarePulse_impact_tile":{"L":[{"s":"psi-pulse","l":300,"s0":64,"s1":22,"o0":0.95},{"n":2,"d":30,"m":"y-locked","s":"void-mist","l":[700,1100],"o":12,"vz":[15,40],"dr":0.5,"s0":[28,40],"s1":[55,80],"o0":0.7},{"n":5,"s":"psi-pulse","l":[300,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[40,130],"g":220,"dr":1.4,"s0":[5,9],"s1":1}]},"raceNightmarePulse_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":380,"z":14,"s0":200,"s1":50},{"a":"floor","m":"world","s":"target-ring-green","l":700,"z":2,"s0":70,"s1":460,"o0":0.85},{"n":3,"m":"y-locked","s":"void-mist","l":[1000,1400],"o":16,"vz":[20,50],"dr":0.4,"s0":[45,60],"s1":[100,140],"o0":0.8}]},"raceWebSnare_aoe":{"ar":1,"ite":"raceWebSnare_impact_tile","ice":"raceWebSnare_impact_center"},"raceWebSnare_impact_tile":{"L":[{"s":"flash","l":200,"s0":50,"s1":14,"o0":0.8},{"n":4,"s":"steel-spark","l":[350,600],"z":4,"o":8,"vx":100,"vy":100,"vz":[30,100],"g":180,"dr":1.5,"s0":[4,8],"s1":1,"o0":0.95},{"d":30,"a":"floor","m":"world","s":"dust-puff","l":1000,"z":2,"s0":60,"s1":100,"o0":0.55},{"d":60,"s":"spider-1","l":[500,850],"z":6,"o":10,"vx":120,"vy":120,"vz":[20,80],"g":200,"dr":1.2,"s0":[18,24],"s1":[8,12]}]},"raceWebSnare_impact_center":{"sk":"soft","L":[{"s":"flash","l":280,"z":12,"s0":140,"s1":36,"o0":0.9},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":60,"s1":320,"o0":0.75},{"n":8,"s":"steel-spark","l":[400,700],"z":8,"o":12,"vx":150,"vy":150,"vz":[40,100],"g":120,"dr":1.3,"s0":[4,8],"s1":1},{"n":2,"d":40,"s":"spider-1","l":[600,1000],"z":10,"o":14,"vx":180,"vy":160,"vz":[30,100],"g":160,"dr":0.9,"s0":[24,32],"s1":[10,14]},{"d":80,"s":"spider-1","l":[700,1100],"z":14,"o":16,"vx":200,"vy":180,"vz":[50,130],"g":140,"dr":0.8,"s0":[28,36],"s1":[12,16]}]},"raceWebSnare_webOverlay":{"L":[{"a":"floor","m":"world","s":"spiderweb-1","l":2000,"z":3,"s0":136,"s1":136,"o0":0.8},{"n":2,"d":100,"a":"floor","m":"world","s":"steel-spark","l":[800,1200],"z":4,"o":12,"s0":[6,10],"s1":2,"o0":0.5}]},"raceDimensionalWeb_aura":{"ar":1,"sh":"square","ite":"raceDimensionalWeb_burst_tile","ice":"raceDimensionalWeb_burst_center","ps":"void-mist","pm":600,"ph":180,"ph1":240,"pw0":60,"pw1":110,"po0":0.65},"raceDimensionalWeb_burst_tile":{"L":[{"a":"floor","m":"world","s":"spiderweb-1","l":8000,"z":3,"s0":136,"s1":136,"o0":0.7},{"a":"floor","m":"world","s":"void-mist","l":1100,"z":2,"s0":50,"s1":100,"o0":0.5},{"n":3,"s":"steel-spark","l":[350,600],"z":4,"o":8,"vx":80,"vy":80,"vz":[20,70],"g":160,"dr":1.5,"s0":[4,7],"s1":1,"o0":0.9},{"d":50,"s":"spider-1","l":[500,800],"z":6,"o":8,"vx":100,"vy":100,"vz":[15,60],"g":200,"dr":1.3,"s0":[16,22],"s1":[7,11]}]},"raceDimensionalWeb_burst_center":{"L":[{"s":"flash","l":260,"z":12,"s0":120,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":300,"o0":0.7},{"n":2,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,50],"dr":0.4,"s0":[40,56],"s1":[90,130],"o0":0.7},{"n":6,"s":"steel-spark","l":[400,700],"z":8,"o":14,"vx":140,"vy":140,"vz":[30,90],"g":100,"dr":1.2,"s0":[4,8],"s1":1},{"n":3,"d":30,"s":"spider-1","l":[600,1050],"z":12,"o":16,"vx":200,"vy":180,"vz":[40,120],"g":150,"dr":0.85,"s0":[26,34],"s1":[10,14]},{"n":2,"d":70,"s":"spider-1","l":[700,1150],"z":16,"o":18,"vx":220,"vy":200,"vz":[60,150],"g":130,"dr":0.75,"s0":[28,38],"s1":[12,16]}]},"raceTitanStep_aoe":{"ar":1,"ite":"raceTitanStep_impact_tile","ice":"raceTitanStep_impact_center"},"raceTitanStep_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":65,"s1":105,"o0":0.75},{"s":"flash","l":220,"s0":50,"s1":16,"o0":0.9},{"n":6,"s":"debris","l":[380,650],"z":4,"o":8,"vx":130,"vy":130,"vz":[70,180],"g":380,"dr":1.4,"s0":[5,9],"s1":1}]},"raceTitanStep_impact_center":{"sk":"hard","L":[{"s":"flash","l":280,"z":14,"s0":220,"s1":56},{"a":"floor","m":"world","s":"shockwave","l":720,"z":2,"s0":80,"s1":580,"o0":0.95},{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":140,"s1":260,"o0":0.85}]},"raceDustDevil_aoe":{"ar":1,"ite":"raceDustDevil_impact_tile","ice":"raceDustDevil_impact_center"},"raceDustDevil_impact_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":90,"o0":0.65},{"n":4,"s":"debris","l":[300,500],"z":4,"o":6,"vx":60,"vy":60,"vz":[20,60],"g":80,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.85}]},"raceDustDevil_impact_center":{"sk":"normal","L":[{"a":"floor","m":"y-locked","s":"dust-puff","l":1100,"w0":100,"w1":80,"h0":160,"h1":240,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":360,"o0":0.75},{"n":8,"s":"debris","l":[500,850],"z":10,"o":16,"vx":100,"vy":100,"vz":[60,140],"g":40,"dr":0.8,"s0":[4,8],"s1":1,"o0":0.95}]},"raceGravityWell_aoe":{"ar":1,"ite":"raceGravityWell_impact_tile","ice":"raceGravityWell_impact_center"},"raceGravityWell_impact_tile":{"L":[{"s":"psi-pulse","l":260,"s0":50,"s1":16,"o0":0.85},{"d":30,"m":"y-locked","s":"void-mist","l":[600,900],"o":10,"vz":[10,30],"dr":0.6,"s0":[22,32],"s1":[50,70],"o0":0.55},{"n":3,"s":"psi-pulse","l":[280,480],"z":4,"o":6,"vx":40,"vy":40,"vz":[10,50],"g":30,"dr":1.8,"s0":[4,7],"s1":1,"o0":0.9}]},"raceGravityWell_impact_center":{"sk":"normal","L":[{"s":"psi-pulse","l":500,"z":14,"s0":200,"s1":60},{"a":"floor","m":"world","s":"target-ring-green","l":900,"z":2,"s0":80,"s1":240,"o0":0.9},{"a":"floor","m":"y-locked","s":"void-mist","l":1200,"w0":110,"w1":70,"h0":140,"h1":220,"o0":0.85}]},"raceTractorBeam_column":{"L":[{"a":"floor","m":"world","s":"ring-1","l":900,"z":160,"w0":24,"w1":24,"h0":24,"h1":24,"o0":0.9},{"d":70,"a":"floor","m":"world","s":"ring-2","l":830,"z":136,"w0":32,"w1":32,"h0":32,"h1":32,"o0":0.9},{"d":140,"a":"floor","m":"world","s":"ring-3","l":760,"z":112,"w0":42,"w1":42,"h0":42,"h1":42,"o0":0.9},{"d":210,"a":"floor","m":"world","s":"ring-4","l":690,"z":84,"w0":56,"w1":56,"h0":56,"h1":56,"o0":0.9},{"d":280,"a":"floor","m":"world","s":"ring-5","l":620,"z":56,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":350,"a":"floor","m":"world","s":"ring-6","l":550,"z":28,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":420,"a":"floor","m":"world","s":"ring-7","l":480,"z":4,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.9},{"d":140,"a":"floor","m":"y-locked","s":"psi-pulse","l":800,"w0":40,"w1":28,"h0":90,"h1":120,"o0":0.7},{"n":2,"d":200,"a":"floor","s":"void-mist","l":[600,900],"z":20,"o":16,"vz":[15,40],"dr":0.3,"s0":[20,34],"s1":[50,70],"o0":0.6},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":50,"s1":90,"o0":0.7},{"n":3,"d":100,"a":"floor","s":"psi-pulse","l":[300,500],"z":[20,80],"o":8,"vz":[-30,30],"vx":30,"vy":30,"dr":0.8,"s0":[6,12],"s1":[2,4],"o0":0.9}]},"raceTractorBeam_step":{"L":[{"a":"floor","m":"world","s":"ring-5","l":320,"z":4,"w0":40,"w1":72,"h0":40,"h1":72,"o0":0.8},{"d":40,"a":"floor","m":"world","s":"ring-6","l":280,"z":6,"w0":36,"w1":68,"h0":36,"h1":68,"o0":0.7},{"n":2,"a":"floor","s":"psi-pulse","l":[200,350],"z":[10,60],"o":6,"vz":[20,50],"dr":0.9,"s0":[5,10],"s1":[2,4],"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":300,"z":2,"s0":30,"s1":60,"o0":0.5}]},"raceTractorBeam_arrive":{"L":[{"a":"floor","s":"flash","l":250,"z":8,"s0":50,"s1":16,"o0":0.9},{"a":"floor","m":"world","s":"ring-7","l":400,"z":3,"w0":50,"w1":90,"h0":50,"h1":90,"o0":0.9},{"d":60,"a":"floor","m":"world","s":"ring-6","l":350,"z":5,"w0":44,"w1":80,"h0":44,"h1":80,"o0":0.8},{"n":3,"d":30,"a":"floor","s":"psi-pulse","l":[250,450],"z":[6,40],"o":8,"vx":50,"vy":50,"vz":[15,40],"dr":1,"s0":[5,10],"s1":[2,4],"o0":0.9},{"d":60,"a":"floor","s":"void-mist","l":[400,700],"z":6,"o":8,"vz":[8,20],"dr":0.4,"s0":[16,24],"s1":[36,52],"o0":0.5}]},"racAbductionBeam_impact":{"sk":"soft","L":[{"a":"floor","s":"ufo","l":2000,"z":280,"w0":256,"w1":256,"h0":256,"h1":256,"_vz":-30,"g":0,"dr":1.2,"o0":0.85},{"d":120,"a":"floor","m":"world","s":"ring-1","l":1600,"z":170,"w0":28,"w1":28,"h0":28,"h1":28,"o0":0.9},{"d":190,"a":"floor","m":"world","s":"ring-2","l":1530,"z":144,"w0":36,"w1":36,"h0":36,"h1":36,"o0":0.9},{"d":260,"a":"floor","m":"world","s":"ring-3","l":1460,"z":118,"w0":48,"w1":48,"h0":48,"h1":48,"o0":0.9},{"d":330,"a":"floor","m":"world","s":"ring-4","l":1390,"z":90,"w0":62,"w1":62,"h0":62,"h1":62,"o0":0.9},{"d":400,"a":"floor","m":"world","s":"ring-5","l":1320,"z":62,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":470,"a":"floor","m":"world","s":"ring-6","l":1250,"z":32,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":540,"a":"floor","m":"world","s":"ring-7","l":1180,"z":6,"w0":80,"w1":80,"h0":80,"h1":80,"o0":0.9},{"d":680,"a":"floor","m":"world","s":"ring-5","l":900,"z":8,"w0":80,"w1":74,"h0":80,"h1":74,"o0":0.85},{"d":820,"a":"floor","m":"world","s":"ring-6","l":800,"z":10,"w0":78,"w1":72,"h0":78,"h1":72,"o0":0.8},{"d":960,"a":"floor","m":"world","s":"ring-7","l":700,"z":6,"w0":76,"w1":70,"h0":76,"h1":70,"o0":0.75},{"d":500,"s":"flash","l":350,"z":10,"s0":100,"s1":30},{"d":500,"a":"floor","m":"y-locked","s":"psi-pulse","l":1200,"w0":50,"w1":30,"h0":110,"h1":160,"o0":0.8},{"n":3,"d":300,"a":"floor","s":"void-mist","l":[900,1400],"z":30,"o":20,"vz":[20,60],"dr":0.3,"s0":[24,40],"s1":[60,90],"o0":0.65},{"d":100,"a":"floor","m":"world","s":"target-ring-green","l":1800,"z":2,"s0":60,"s1":110,"o0":0.75},{"n":3,"d":550,"s":"emp-arc","l":[250,450],"z":6,"o":10,"vx":80,"vy":80,"vz":[20,60],"dr":1.5,"w0":[18,30],"w1":4,"h0":[4,8],"h1":1,"o0":0.95},{"n":4,"d":550,"a":"floor","s":"psi-pulse","l":[500,800],"z":[4,20],"o":12,"vz":[80,160],"dr":0.2,"s0":[4,9],"s1":[1,3],"o0":0.9},{"n":3,"d":480,"a":"floor","s":"dust-puff","l":[350,550],"z":2,"o":10,"vx":50,"vy":50,"vz":[10,30],"g":60,"dr":0.8,"s0":[6,12],"s1":[18,30],"o0":0.5}]},"raceProbe_impact":{"L":[{"a":"floor","m":"world","s":"ring-4","l":600,"z":3,"w0":30,"w1":80,"h0":30,"h1":80,"o0":0.9},{"d":120,"a":"floor","m":"world","s":"ring-5","l":500,"z":4,"w0":40,"w1":100,"h0":40,"h1":100,"o0":0.7},{"d":240,"a":"floor","m":"world","s":"ring-6","l":450,"z":5,"w0":50,"w1":120,"h0":50,"h1":120,"o0":0.5},{"a":"floor","s":"ufo","l":600,"z":200,"w0":160,"w1":140,"h0":160,"h1":140,"o0":0.35},{"s":"psi-pulse","l":400,"z":8,"s0":50,"s1":20,"o0":0.9},{"n":3,"d":60,"s":"emp-arc","l":[200,400],"z":4,"o":6,"vx":100,"vy":100,"vz":[10,40],"dr":1.8,"w0":[14,24],"w1":3,"h0":[3,6],"h1":1,"o0":0.9},{"d":80,"s":"void-mist","l":[500,800],"z":4,"o":8,"vz":[10,30],"dr":0.5,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceImplant_impact":{"L":[{"a":"floor","m":"world","s":"ring-1","l":400,"z":3,"w0":16,"w1":40,"h0":16,"h1":40,"o0":0.9},{"d":80,"a":"floor","m":"world","s":"ring-2","l":350,"z":4,"w0":24,"w1":56,"h0":24,"h1":56,"o0":0.8},{"d":160,"a":"floor","m":"world","s":"ring-3","l":300,"z":5,"w0":32,"w1":70,"h0":32,"h1":70,"o0":0.65},{"d":100,"s":"flash","l":200,"z":4,"s0":30,"s1":10,"o0":0.85},{"n":4,"d":120,"s":"spark-elec","l":[200,400],"z":4,"o":6,"vx":60,"vy":60,"vz":[10,30],"g":40,"dr":1.2,"s0":[3,7],"s1":1,"o0":0.95},{"d":60,"s":"psi-pulse","l":300,"z":6,"s0":24,"s1":8,"o0":0.7},{"d":200,"s":"void-mist","l":[400,650],"z":6,"o":4,"vz":[12,25],"dr":0.5,"s0":[10,16],"s1":[28,42],"o0":0.45}]},"raceWarOfTheWorlds_deploy":{"L":[{"a":"floor","s":"ufo","l":2200,"z":320,"w0":256,"w1":256,"h0":256,"h1":256,"_vz":-40,"g":0,"dr":1,"o0":0.9},{"d":200,"a":"floor","m":"world","s":"ring-1","l":1400,"z":160,"w0":24,"w1":24,"h0":24,"h1":24,"o0":0.85},{"d":280,"a":"floor","m":"world","s":"ring-2","l":1320,"z":134,"w0":32,"w1":32,"h0":32,"h1":32,"o0":0.85},{"d":360,"a":"floor","m":"world","s":"ring-3","l":1240,"z":108,"w0":42,"w1":42,"h0":42,"h1":42,"o0":0.85},{"d":440,"a":"floor","m":"world","s":"ring-4","l":1160,"z":80,"w0":56,"w1":56,"h0":56,"h1":56,"o0":0.85},{"d":520,"a":"floor","m":"world","s":"ring-5","l":1080,"z":52,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":600,"a":"floor","m":"world","s":"ring-6","l":1000,"z":26,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":680,"a":"floor","m":"world","s":"ring-7","l":920,"z":4,"w0":72,"w1":72,"h0":72,"h1":72,"o0":0.85},{"d":820,"a":"floor","m":"world","s":"ring-5","l":700,"z":6,"w0":70,"w1":64,"h0":70,"h1":64,"o0":0.8},{"d":960,"a":"floor","m":"world","s":"ring-6","l":600,"z":8,"w0":68,"w1":62,"h0":68,"h1":62,"o0":0.75},{"d":1100,"a":"floor","m":"world","s":"ring-7","l":500,"z":4,"w0":66,"w1":60,"h0":66,"h1":60,"o0":0.7},{"n":4,"d":750,"a":"floor","s":"dust-puff","l":[400,700],"z":2,"o":12,"vx":80,"vy":80,"vz":[20,60],"g":120,"dr":1,"s0":[10,18],"s1":[24,40],"o0":0.7},{"d":700,"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":40,"s1":100,"o0":0.8},{"d":250,"a":"floor","m":"y-locked","s":"psi-pulse","l":1200,"w0":36,"w1":24,"h0":80,"h1":110,"o0":0.65},{"n":2,"d":350,"a":"floor","s":"void-mist","l":[700,1100],"z":16,"o":14,"vz":[10,35],"dr":0.4,"s0":[18,30],"s1":[45,65],"o0":0.55}]},"raceWhirlpool_aoe":{"ar":1,"ite":"raceWhirlpool_impact_tile","ice":"raceWhirlpool_impact_center"},"raceWhirlpool_impact_tile":{"L":[{"a":"floor","m":"world","s":"wave-1","l":1400,"z":3,"s0":64,"s1":64,"o0":0.85},{"n":5,"s":"spark-blue","l":[350,600],"z":6,"o":8,"vx":110,"vy":110,"vz":[40,130],"g":280,"dr":1.5,"s0":[5,9],"s1":1,"o0":0.95},{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":110,"o0":0.65}]},"raceWhirlpool_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"wave-1","l":1800,"z":4,"s0":96,"s1":96,"o0":0.9},{"s":"spark-blue","l":320,"z":12,"s0":160,"s1":40},{"a":"floor","m":"y-locked","s":"spark-blue","l":900,"w0":80,"w1":50,"h0":130,"h1":200,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-blue","l":850,"z":2,"s0":70,"s1":360,"o0":0.85},{"n":2,"d":50,"m":"y-locked","s":"void-mist","l":[800,1100],"o":14,"vz":[20,40],"dr":0.4,"s0":[40,56],"s1":[80,110],"o0":0.5}]},"heal1_aura":{"ar":0,"sh":"square","ice":"heal1_burst_center","ps":"holy-pillar","pm":520,"ph":200,"pw0":56,"pw1":90,"ph1":240,"po0":0.85},"heal1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":80,"s1":200},{"s":"heal-glow","l":600,"z":4,"s0":160,"s1":60},{"s":"flash","l":280,"z":8,"s0":110,"s1":30,"o0":0.85},{"n":10,"s":"heal-cross","l":[550,900],"o":8,"vx":100,"vy":100,"vz":[60,160],"g":30,"dr":1.2,"s0":[10,16],"s1":2},{"n":6,"d":120,"s":"holy-light","l":[900,1300],"o":14,"z":6,"vx":25,"vy":25,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85}]},"cleanse_aura":{"ar":0,"sh":"square","ice":"cleanse_burst_center","ps":"holy-pillar","pm":380,"ph":220,"pw0":44,"pw1":70,"ph1":260,"po0":1},"cleanse_burst_center":{"L":[{"s":"flash","l":240,"z":10,"s0":140,"s1":30},{"s":"heal-glow","l":420,"z":4,"s0":120,"s1":40,"o0":0.95},{"n":16,"s":"divine-sparkle","l":[400,700],"o":6,"vx":140,"vy":140,"vz":[60,200],"g":20,"dr":1.4,"s0":[8,14],"s1":1},{"n":4,"d":60,"s":"holy-light","l":[600,900],"o":10,"z":8,"vx":30,"vy":30,"vz":[80,160],"g":-40,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.9}]},"revive1_aura":{"ar":0,"sh":"square","ice":"revive1_burst_center","ps":"holy-pillar","pm":900,"ph":320,"pw0":70,"pw1":120,"ph1":380,"po0":1},"revive1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1400,"z":2,"s0":100,"s1":320},{"d":60,"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":280,"o0":0.5},{"s":"heal-glow","l":900,"z":6,"s0":220,"s1":70},{"s":"flash","l":360,"z":12,"s0":160,"s1":40},{"n":14,"s":"heal-cross","l":[700,1100],"o":10,"vx":130,"vy":130,"vz":[80,200],"g":20,"dr":1.2,"s0":[12,18],"s1":2},{"n":12,"d":140,"s":"holy-light","l":[1100,1700],"o":18,"z":4,"vx":30,"vy":30,"vz":[80,200],"g":-40,"dr":0.65,"s0":[8,14],"s1":1,"o0":0.9}]},"fortify_aura":{"ar":0,"sh":"square","ice":"fortify_burst_center","ps":"holy-pillar","pm":320,"ph":180,"pw0":50,"pw1":80,"ph1":200,"po0":0.85},"fortify_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":70,"s1":180,"o0":0.95},{"s":"shield-blue","l":700,"z":4,"s0":60,"s1":140,"o0":0.9},{"d":40,"s":"shield-blue","l":520,"z":4,"s0":30,"s1":100},{"s":"flash","l":200,"z":10,"s0":100,"s1":30,"o0":0.85},{"n":5,"d":60,"s":"holy-light","l":[600,900],"o":12,"z":6,"vx":25,"vy":25,"vz":[50,130],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"healingSeed_aura":{"ar":0,"sh":"square","ice":"healingSeed_burst_center"},"healingSeed_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":130,"o0":0.85},{"a":"floor","s":"heal-glow","l":500,"z":12,"s0":80,"s1":28,"o0":0.9},{"n":6,"a":"floor","s":"divine-sparkle","l":[400,700],"z":4,"o":8,"vx":50,"vy":50,"vz":[60,140],"g":-20,"dr":0.9,"s0":[6,10],"s1":1,"o0":0.95},{"n":4,"d":80,"a":"floor","s":"vine-green","l":[500,800],"z":6,"o":6,"vx":40,"vy":40,"vz":[40,100],"g":20,"dr":1.1,"s0":[6,12],"s1":1,"o0":0.85}]},"_buff_div_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":60,"s1":150,"o0":0.85},{"s":"heal-glow","l":480,"z":4,"s0":100,"s1":36,"o0":0.85},{"s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.85},{"n":8,"s":"divine-sparkle","l":[450,750],"o":6,"vx":100,"vy":100,"vz":[60,160],"g":30,"dr":1.2,"s0":[7,12],"s1":1},{"n":5,"d":100,"s":"holy-light","l":[800,1100],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"_buff_human_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":130,"o0":0.65},{"s":"flash","l":200,"z":8,"s0":80,"s1":22,"o0":0.85},{"n":9,"s":"steel-spark","l":[400,700],"o":8,"vx":110,"vy":110,"vz":[50,160],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"smoke","l":[700,1000],"o":12,"vz":[25,50],"dr":0.5,"s0":[20,32],"s1":[50,80],"o0":0.5},{"n":4,"d":60,"a":"floor","s":"dust-puff","l":[500,800],"z":4,"o":10,"vx":40,"vy":40,"vz":[40,100],"g":20,"dr":0.9,"s0":[8,14],"s1":2,"o0":0.6}]},"_buff_tech_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":700,"z":2,"s0":60,"s1":170,"o0":0.95},{"s":"flash","l":200,"z":8,"s0":90,"s1":24,"o0":0.9},{"n":12,"s":"spark-elec","l":[400,700],"o":8,"vx":130,"vy":130,"vz":[60,200],"g":40,"dr":1.2,"s0":[5,10],"s1":1},{"n":3,"d":40,"s":"emp-arc","l":[180,320],"z":8,"o":14,"vx":60,"vy":60,"vz":[30,80],"dr":1.5,"s0":[12,20],"s1":2},{"n":4,"d":100,"s":"spark-elec","l":[700,1000],"o":14,"z":6,"vx":20,"vy":20,"vz":[70,150],"g":-30,"dr":0.7,"s0":[4,7],"s1":1,"o0":0.85}]},"camouflage_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":70,"s1":160,"o0":0.55},{"n":5,"m":"y-locked","s":"smoke","l":[900,1400],"o":14,"vz":[20,50],"dr":0.4,"s0":[30,44],"s1":[70,110],"o0":0.6},{"n":5,"d":60,"a":"floor","s":"dust-puff","l":[800,1200],"z":6,"o":16,"vx":50,"vy":50,"vz":[30,70],"g":15,"dr":0.8,"s0":[10,18],"s1":2,"o0":0.5}]},"raceSiegeMode_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":90,"s1":220,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":70,"s1":240,"o0":0.6},{"s":"flash","l":260,"z":10,"s0":110,"s1":30},{"n":10,"s":"steel-spark","l":[400,700],"o":10,"vx":130,"vy":130,"vz":[50,160],"g":100,"dr":1.3,"s0":[6,11],"s1":1},{"n":6,"d":60,"s":"spark-elec","l":[500,850],"z":6,"o":12,"vx":60,"vy":60,"vz":[50,130],"g":30,"dr":1.1,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":120,"m":"y-locked","s":"smoke","l":[800,1100],"o":16,"vz":[25,55],"dr":0.5,"s0":[26,38],"s1":[60,100],"o0":0.55}]},"protect1_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":60,"pw1":90,"po0":0.9},"overclock_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":56,"pw1":100,"po0":1},"raceWishGranted_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":800,"ph":280,"ph1":340,"pw0":70,"pw1":120,"po0":1},"racePerchForm_aura":{"ar":0,"ice":"_buff_div_burst_center","ps":"buff-aura","pm":480,"ph":170,"ph1":190,"pw0":70,"pw1":100,"po0":0.85},"camouflage_aura":{"ar":0,"ice":"camouflage_burst_center","ps":"buff-aura","pm":380,"ph":160,"ph1":200,"pw0":50,"pw1":90,"po0":0.55},"steadyAim_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":360,"ph":170,"ph1":200,"pw0":44,"pw1":70,"po0":0.85},"jackOfAll_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":56,"pw1":90,"po0":0.9},"raceIronBulwark_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":700,"ph":200,"ph1":230,"pw0":70,"pw1":110,"po0":0.95},"raceBlackBudget_aura":{"ar":0,"ice":"_buff_human_burst_center","ps":"buff-aura","pm":600,"ph":200,"ph1":240,"pw0":56,"pw1":90,"po0":0.9},"raceOverclock_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":56,"pw1":100,"po0":1},"raceOvercalculate_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":460,"ph":200,"ph1":240,"pw0":40,"pw1":70,"po0":0.9},"raceSiegeMode_aura":{"ar":0,"ice":"raceSiegeMode_burst_center","ps":"buff-aura","pm":520,"ph":180,"ph1":210,"pw0":80,"pw1":120,"po0":1},"raceIronGuard_aura":{"ar":0,"ice":"_buff_tech_burst_center","ps":"buff-aura","pm":600,"ph":190,"ph1":220,"pw0":64,"pw1":100,"po0":0.95},"_buff_alien_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":60,"s1":180,"o0":0.9},{"s":"psi-pulse","l":520,"z":4,"s0":110,"s1":40,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.85},{"n":8,"s":"psi-pulse","l":[450,750],"o":8,"vx":110,"vy":110,"vz":[60,180],"g":20,"dr":1.3,"s0":[8,14],"s1":2},{"n":4,"d":60,"m":"y-locked","s":"void-mist","l":[800,1200],"o":14,"vz":[25,60],"dr":0.5,"s0":[24,36],"s1":[60,100],"o0":0.55}]},"_buff_unholy_burst_center":{"L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":2,"s0":70,"s1":170,"o0":0.65},{"s":"dark-flame","l":500,"z":4,"s0":120,"s1":40,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":70,"s1":18,"o0":0.55},{"n":9,"s":"blood-fleck","l":[400,700],"o":8,"vx":100,"vy":100,"vz":[50,160],"g":60,"dr":1.3,"s0":[5,10],"s1":1},{"n":5,"d":80,"s":"dark-flame","l":[700,1000],"o":12,"z":4,"vx":22,"vy":22,"vz":[60,140],"g":-25,"dr":0.7,"s0":[6,12],"s1":1,"o0":0.85},{"n":3,"d":100,"m":"y-locked","s":"void-mist","l":[800,1100],"o":14,"vz":[20,50],"dr":0.5,"s0":[28,40],"s1":[60,100],"o0":0.5}]},"_buff_anomaly_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":850,"z":2,"s0":60,"s1":170,"o0":0.7},{"s":"vine-green","l":500,"z":4,"s0":110,"s1":36,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":80,"s1":22,"o0":0.85},{"n":10,"s":"blood-fleck","l":[400,700],"o":8,"vx":120,"vy":120,"vz":[60,180],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":6,"d":60,"s":"acid-green","l":[500,800],"o":10,"vx":80,"vy":80,"vz":[50,140],"g":20,"dr":1.2,"s0":[6,12],"s1":1,"o0":0.9},{"n":4,"d":100,"s":"vine-green","l":[700,1000],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-25,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"raceWildResilience_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":230,"o0":0.95},{"s":"heal-glow","l":700,"z":4,"s0":160,"s1":55},{"d":40,"s":"vine-green","l":550,"z":4,"s0":130,"s1":40,"o0":0.7},{"s":"flash","l":240,"z":10,"s0":100,"s1":24,"o0":0.9},{"n":12,"s":"vine-green","l":[600,1000],"o":10,"vx":130,"vy":130,"vz":[70,180],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":60,"s":"blood-fleck","l":[500,800],"o":10,"vx":100,"vy":100,"vz":[50,140],"g":60,"dr":1.3,"s0":[5,9],"s1":1,"o0":0.95},{"n":6,"d":120,"s":"heal-cross","l":[800,1200],"o":14,"z":6,"vx":25,"vy":25,"vz":[60,150],"g":-30,"dr":0.7,"s0":[8,14],"s1":1,"o0":0.9}]},"raceAdrenalineRush_burst_center":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":950,"z":2,"s0":50,"s1":150,"o0":0.7},{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":60,"s1":160,"o0":0.7},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.9},{"s":"flash","l":220,"z":10,"s0":110,"s1":28},{"n":8,"s":"steel-spark","l":[400,700],"o":8,"vx":110,"vy":110,"vz":[60,160],"g":80,"dr":1.3,"s0":[5,9],"s1":1},{"n":5,"d":60,"s":"heal-cross","l":[500,800],"o":8,"vx":80,"vy":80,"vz":[50,140],"g":30,"dr":1.2,"s0":[7,11],"s1":1,"o0":0.95}]},"raceChitinArmor_aura":{"ar":0,"ice":"_buff_alien_burst_center","ps":"buff-aura","pm":500,"ph":180,"ph1":210,"pw0":50,"pw1":80,"po0":0.9},"raceTimeSurge_aura":{"ar":0,"ice":"_buff_alien_burst_center","ps":"buff-aura","pm":800,"ph":240,"ph1":300,"pw0":48,"pw1":90,"po0":1},"raceAbyssalWings_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":650,"ph":220,"ph1":250,"pw0":80,"pw1":130,"po0":0.95},"raceHellfireCrown_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":750,"ph":280,"ph1":340,"pw0":56,"pw1":100,"po0":1},"racePhaseShift_aura":{"ar":0,"ice":"_buff_unholy_burst_center","ps":"buff-aura","pm":420,"ph":170,"ph1":210,"pw0":56,"pw1":110,"po0":0.6},"raceBloodRitual_aura":{"ar":0,"ice":"_buff_anomaly_burst_center","ps":"buff-aura","pm":680,"ph":210,"ph1":240,"pw0":72,"pw1":120,"po0":0.95},"raceWildResilience_aura":{"ar":0,"ice":"raceWildResilience_burst_center","ps":"buff-aura","pm":850,"ph":260,"ph1":320,"pw0":70,"pw1":120,"po0":1},"raceAdrenalineRush_aura":{"ar":0,"ice":"raceAdrenalineRush_burst_center","ps":"buff-aura","pm":480,"ph":190,"ph1":220,"pw0":56,"pw1":90,"po0":0.95},"healAll_aura":{"ar":0,"ice":"healAll_burst_center"},"healAll_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":140,"o0":0.85},{"s":"heal-glow","l":500,"z":4,"s0":110,"s1":38,"o0":0.95},{"s":"flash","l":220,"z":8,"s0":80,"s1":22,"o0":0.8},{"n":6,"s":"heal-cross","l":[500,800],"o":8,"vx":90,"vy":90,"vz":[50,140],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":4,"d":100,"s":"holy-light","l":[700,1000],"o":10,"z":6,"vx":20,"vy":20,"vz":[50,120],"g":-25,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.8}]},"raceAbsolution_aura":{"ar":0,"ice":"raceAbsolution_burst_center"},"raceAbsolution_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":160,"o0":0.9},{"s":"heal-glow","l":540,"z":4,"s0":120,"s1":40},{"s":"flash","l":240,"z":8,"s0":100,"s1":26,"o0":0.95},{"n":10,"s":"divine-sparkle","l":[500,850],"o":8,"vx":110,"vy":110,"vz":[60,170],"g":25,"dr":1.3,"s0":[7,12],"s1":1},{"n":5,"s":"heal-cross","l":[500,800],"o":8,"vx":80,"vy":80,"vz":[50,130],"g":25,"dr":1.2,"s0":[7,12],"s1":1},{"n":5,"d":100,"s":"holy-light","l":[800,1100],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,140],"g":-30,"dr":0.7,"s0":[6,10],"s1":1,"o0":0.85}]},"raceTidalBlessing_aura":{"ar":1,"sh":"square","ite":"raceTidalBlessing_burst_tile","ice":"raceTidalBlessing_burst_center","ps":"buff-aura","pm":600,"ph":220,"ph1":260,"pw0":70,"pw1":110,"po0":0.85},"raceTidalBlessing_burst_tile":{"L":[{"a":"floor","m":"world","s":"void-mist","l":1200,"z":2,"s0":50,"s1":110,"o0":0.5},{"a":"floor","s":"heal-glow","l":500,"z":10,"s0":60,"s1":24,"o0":0.65},{"a":"floor","m":"world","s":"wave-1","l":1800,"z":3,"s0":64,"s1":64,"o0":0.85},{"n":2,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[600,900],"o":10,"vz":[20,50],"dr":0.5,"s0":[16,24],"s1":[36,60],"o0":0.45}]},"raceTidalBlessing_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":240,"o0":0.8},{"a":"floor","s":"heal-glow","l":700,"z":14,"s0":130,"s1":46,"o0":0.95},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28,"o0":0.85},{"a":"floor","m":"world","s":"wave-1","l":2000,"z":3,"s0":96,"s1":96,"o0":0.9},{"n":3,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[900,1300],"o":12,"vz":[30,70],"dr":0.4,"s0":[32,50],"s1":[70,120],"o0":0.55}]},"raceSanctuary_aura":{"ar":1,"sh":"square","ite":"raceSanctuary_burst_tile","ice":"raceSanctuary_burst_center","ps":"buff-aura","pm":750,"ph":280,"ph1":340,"pw0":70,"pw1":120,"po0":1},"raceSanctuary_burst_tile":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":40,"s1":110,"o0":0.75},{"a":"floor","s":"heal-glow","l":600,"z":10,"s0":70,"s1":26,"o0":0.85},{"n":4,"a":"floor","s":"divine-sparkle","l":[500,800],"z":6,"o":8,"vx":50,"vy":50,"vz":[40,110],"g":0,"dr":1.1,"s0":[6,10],"s1":1,"o0":0.95},{"n":2,"d":80,"a":"floor","s":"holy-light","l":[700,1000],"o":10,"z":4,"vx":15,"vy":15,"vz":[40,110],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"raceSanctuary_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":90,"s1":260,"o0":0.95},{"a":"floor","s":"heal-glow","l":800,"z":14,"s0":140,"s1":50},{"a":"floor","s":"flash","l":280,"z":14,"s0":130,"s1":32},{"n":12,"a":"floor","s":"divine-sparkle","l":[600,1000],"z":6,"o":10,"vx":110,"vy":110,"vz":[70,180],"g":20,"dr":1.2,"s0":[8,14],"s1":1},{"n":8,"d":100,"a":"floor","s":"holy-light","l":[1000,1400],"o":14,"z":4,"vx":22,"vy":22,"vz":[70,160],"g":-35,"dr":0.65,"s0":[7,12],"s1":1,"o0":0.9}]},"_aoeShield_alien_burst_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":900,"z":2,"s0":50,"s1":130,"o0":0.75},{"s":"psi-pulse","l":500,"z":4,"s0":70,"s1":26,"o0":0.75},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.7}]},"_aoeShield_div_burst_tile":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":140,"o0":0.8},{"s":"heal-glow","l":500,"z":4,"s0":70,"s1":26,"o0":0.7},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.75},{"n":2,"d":80,"s":"holy-light","l":[600,900],"o":8,"z":4,"vx":18,"vy":18,"vz":[40,100],"g":-25,"dr":0.7,"s0":[4,8],"s1":1,"o0":0.8}]},"_aoeShield_tech_burst_tile":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":2,"s0":50,"s1":140,"o0":0.85},{"s":"shield-blue","l":700,"z":4,"s0":70,"s1":110,"o0":0.75},{"n":3,"s":"spark-elec","l":[350,600],"z":4,"o":8,"vx":80,"vy":80,"vz":[40,100],"g":30,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95},{"d":40,"s":"emp-arc","l":220,"z":8,"o":10,"s0":16,"s1":2,"o0":0.85}]},"bubble_aura":{"ar":1,"sh":"square","ite":"_aoeShield_alien_burst_tile","ice":"bubble_burst_center","ps":"buff-aura","pm":700,"ph":280,"ph1":340,"pw0":50,"pw1":90,"po0":0.95},"bubble_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":1200,"z":2,"s0":90,"s1":280,"o0":0.9},{"s":"shield-blue","l":1000,"z":8,"s0":140,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":90,"s1":220},{"s":"psi-pulse","l":600,"z":12,"s0":120,"s1":40,"o0":0.75},{"s":"flash","l":260,"z":14,"s0":120,"s1":30,"o0":0.95},{"n":10,"s":"psi-pulse","l":[500,900],"o":10,"vx":120,"vy":120,"vz":[70,180],"g":20,"dr":1.2,"s0":[7,13],"s1":1},{"n":3,"d":80,"m":"y-locked","s":"void-mist","l":[900,1300],"o":16,"vz":[25,60],"dr":0.5,"s0":[30,44],"s1":[70,110],"o0":0.5}]},"raceRunicWard_aura":{"ar":0,"ice":"raceRunicWard_burst_center","ps":"buff-aura","pm":520,"ph":200,"ph1":240,"pw0":44,"pw1":80,"po0":0.95},"raceRunicWard_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-green","l":1000,"z":2,"s0":70,"s1":180,"o0":0.95},{"s":"shield-blue","l":800,"z":6,"s0":80,"s1":160,"o0":0.85},{"d":30,"s":"shield-blue","l":600,"z":8,"s0":50,"s1":120},{"s":"psi-pulse","l":500,"z":10,"s0":90,"s1":32,"o0":0.85},{"s":"flash","l":220,"z":12,"s0":100,"s1":26,"o0":0.95},{"n":4,"d":40,"s":"emp-arc","l":[200,350],"z":8,"o":16,"vx":30,"vy":30,"vz":[30,70],"dr":1.5,"s0":[14,22],"s1":2},{"n":6,"s":"psi-pulse","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[50,130],"g":20,"dr":1.3,"s0":[5,9],"s1":1,"o0":0.95}]},"raceHolyBulwark_aura":{"ar":1,"sh":"square","ite":"_aoeShield_div_burst_tile","ice":"raceHolyBulwark_burst_center","ps":"buff-aura","pm":720,"ph":280,"ph1":340,"pw0":60,"pw1":100,"po0":1},"raceHolyBulwark_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":90,"s1":280,"o0":0.95},{"s":"shield-blue","l":1000,"z":8,"s0":150,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":100,"s1":220},{"s":"heal-glow","l":700,"z":12,"s0":140,"s1":50,"o0":0.85},{"s":"flash","l":280,"z":14,"s0":130,"s1":32},{"n":10,"s":"divine-sparkle","l":[550,950],"o":10,"vx":120,"vy":120,"vz":[70,180],"g":25,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":100,"s":"holy-light","l":[900,1300],"o":14,"z":6,"vx":22,"vy":22,"vz":[70,160],"g":-35,"dr":0.65,"s0":[6,11],"s1":1,"o0":0.9}]},"raceLuminousShield_aura":{"ar":0,"ice":"raceLuminousShield_burst_center","ps":"buff-aura","pm":600,"ph":260,"ph1":320,"pw0":48,"pw1":88,"po0":1},"raceLuminousShield_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":200,"o0":0.95},{"s":"shield-blue","l":900,"z":6,"s0":90,"s1":180,"o0":0.9},{"d":30,"s":"shield-blue","l":700,"z":8,"s0":55,"s1":130},{"s":"heal-glow","l":600,"z":10,"s0":110,"s1":40,"o0":0.9},{"s":"flash","l":320,"z":12,"s0":120,"s1":32},{"d":120,"s":"flash","l":240,"z":14,"s0":80,"s1":22,"o0":0.9},{"n":14,"s":"divine-sparkle","l":[500,900],"o":10,"vx":130,"vy":130,"vz":[80,200],"g":30,"dr":1.2,"s0":[8,14],"s1":1},{"n":5,"d":80,"s":"holy-light","l":[800,1200],"o":12,"z":6,"vx":22,"vy":22,"vz":[60,150],"g":-30,"dr":0.7,"s0":[5,10],"s1":1,"o0":0.9}]},"raceFirewallProtocol_aura":{"ar":1,"sh":"square","ite":"_aoeShield_tech_burst_tile","ice":"raceFirewallProtocol_burst_center","ps":"buff-aura","pm":680,"ph":260,"ph1":320,"pw0":56,"pw1":100,"po0":1},"raceFirewallProtocol_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":1100,"z":2,"s0":90,"s1":280,"o0":0.95},{"s":"shield-blue","l":1000,"z":8,"s0":140,"s1":280,"o0":0.85},{"d":40,"s":"shield-blue","l":800,"z":10,"s0":90,"s1":220},{"s":"flash","l":260,"z":14,"s0":120,"s1":30},{"n":12,"s":"spark-elec","l":[500,850],"o":10,"vx":130,"vy":130,"vz":[70,180],"g":30,"dr":1.2,"s0":[6,11],"s1":1},{"n":5,"d":50,"s":"emp-arc","l":[200,380],"z":10,"o":20,"vx":60,"vy":60,"vz":[40,100],"dr":1.5,"s0":[14,22],"s1":2},{"n":5,"d":100,"s":"spark-elec","l":[800,1100],"o":14,"z":6,"vx":22,"vy":22,"vz":[60,150],"g":-30,"dr":0.7,"s0":[4,8],"s1":1,"o0":0.9}]},"_warCry_burst_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":35,"s1":90,"o0":0.55},{"s":"flash","l":180,"z":6,"s0":55,"s1":14,"o0":0.7},{"n":2,"s":"steel-spark","l":[300,500],"o":8,"vx":60,"vy":60,"vz":[40,100],"g":60,"dr":1.3,"s0":[4,7],"s1":1,"o0":0.95}]},"_warCry_burst_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":900,"z":2,"s0":80,"s1":360,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":80,"s1":220,"o0":0.7},{"s":"flash","l":280,"z":12,"s0":140,"s1":36},{"n":12,"s":"steel-spark","l":[450,750],"o":10,"vx":130,"vy":130,"vz":[60,180],"g":90,"dr":1.3,"s0":[5,10],"s1":1},{"n":3,"d":60,"m":"y-locked","s":"dust-puff","l":[800,1200],"o":14,"vz":[25,55],"dr":0.5,"s0":[26,38],"s1":[60,100],"o0":0.55},{"n":5,"d":100,"s":"holy-light","l":[700,1000],"o":14,"z":6,"vx":20,"vy":20,"vz":[60,140],"g":-30,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"warCry_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":650,"ph":240,"ph1":280,"pw0":60,"pw1":100,"po0":0.95},"raceRallyCommand_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":700,"ph":240,"ph1":280,"pw0":76,"pw1":130,"po0":1},"raceVOXBroadcast_aura":{"ar":3,"sh":"square","ite":"_warCry_burst_tile","ice":"_warCry_burst_center","ps":"buff-aura","pm":750,"ph":300,"ph1":360,"pw0":44,"pw1":80,"po0":1},"placeBomb_aoe":{"ar":1,"sh":"square","ite":"placeBomb_impact_tile","ice":"placeBomb_impact_center"},"placeBomb_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1500,"z":2,"s0":80,"s1":130,"o0":0.85},{"s":"explosion-orange","l":380,"s0":72,"s1":36},{"d":90,"s":"flash","l":180,"z":6,"s0":80,"s1":24,"o0":0.75},{"n":4,"d":80,"m":"y-locked","s":"smoke","l":[1100,1700],"o":16,"vz":[30,60],"dr":0.35,"s0":[32,50],"s1":[90,140],"o0":0.75},{"n":8,"s":"debris","l":[400,750],"z":4,"o":10,"vx":150,"vy":150,"vz":[70,210],"g":400,"dr":1.4,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":70,"s1":140,"o0":0.7}]},"placeBomb_impact_center":{"sk":"hard","L":[{"s":"flash","l":320,"z":18,"s0":260,"s1":70},{"a":"floor","m":"world","s":"shockwave","l":750,"z":2,"s0":90,"s1":680,"o0":0.95},{"s":"explosion-orange","l":560,"z":10,"s0":170,"s1":70},{"d":130,"s":"flash","l":220,"z":14,"s0":140,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1600,"z":2,"s0":160,"s1":280,"o0":0.85},{"n":10,"s":"ember","l":[350,700],"z":8,"o":10,"vx":200,"vy":200,"vz":[80,220],"g":320,"dr":1.3,"s0":[5,9],"s1":1}]},"raceColdSpot_aura":{"ar":1,"sh":"square","ite":"raceColdSpot_burst_tile","ice":"raceColdSpot_burst_center","ps":"shield-blue","pm":580,"ph":210,"ph1":260,"pw0":64,"pw1":100,"po0":0.75},"raceColdSpot_burst_tile":{"L":[{"a":"floor","m":"world","s":"shield-blue","l":1200,"z":2,"s0":50,"s1":110,"o0":0.55},{"a":"floor","m":"world","s":"void-mist","l":1000,"z":2,"s0":40,"s1":90,"o0":0.45},{"n":3,"a":"floor","s":"divine-sparkle","l":[500,850],"z":6,"o":9,"vx":40,"vy":40,"vz":[30,80],"g":-20,"dr":1.1,"s0":[5,9],"s1":1,"o0":0.85}]},"raceColdSpot_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":220,"o0":0.6},{"a":"floor","s":"shield-blue","l":750,"z":14,"s0":130,"s1":50,"o0":0.85},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28,"o0":0.7},{"n":10,"a":"floor","s":"divine-sparkle","l":[550,950],"z":6,"o":12,"vx":110,"vy":110,"vz":[70,160],"g":-10,"dr":1.2,"s0":[7,13],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[900,1300],"o":14,"vz":[40,80],"dr":0.45,"s0":[30,50],"s1":[70,120],"o0":0.5}]},"raceHostileTakeover_aura":{"ar":2,"sh":"square","ite":"raceHostileTakeover_burst_tile","ice":"raceHostileTakeover_burst_center","ps":"dark-flame","pm":720,"ph":260,"ph1":320,"pw0":80,"pw1":130,"po0":0.95},"raceHostileTakeover_burst_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":2,"s0":60,"s1":110,"o0":0.7},{"a":"floor","s":"dark-flame","l":480,"z":8,"s0":56,"s1":24,"o0":0.9},{"a":"floor","m":"world","s":"void-mist","l":1300,"z":2,"s0":50,"s1":110,"o0":0.55},{"n":3,"a":"floor","s":"blood-fleck","l":[400,700],"z":4,"o":8,"vx":70,"vy":70,"vz":[30,90],"g":220,"dr":1.3,"s0":[4,8],"s1":1}]},"raceHostileTakeover_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1300,"z":2,"s0":100,"s1":360,"o0":0.75},{"s":"dark-flame","l":720,"z":12,"s0":170,"s1":70},{"s":"flash","l":280,"z":16,"s0":150,"s1":36,"o0":0.7},{"n":14,"s":"blood-fleck","l":[500,900],"z":6,"o":12,"vx":160,"vy":160,"vz":[60,200],"g":320,"dr":1.3,"s0":[5,10],"s1":1},{"n":4,"d":60,"a":"floor","m":"y-locked","s":"void-mist","l":[1000,1500],"o":14,"vz":[40,80],"dr":0.4,"s0":[40,60],"s1":[90,150],"o0":0.7},{"n":6,"d":100,"s":"ember","l":[800,1200],"o":14,"z":6,"vx":30,"vy":30,"vz":[60,140],"g":-30,"dr":0.8,"s0":[6,11],"s1":1,"o0":0.85}]},"raceDeadAir_aura":{"ar":1,"sh":"square","ite":"raceDeadAir_burst_tile","ice":"raceDeadAir_burst_center","ps":"spark-elec","pm":460,"ph":200,"ph1":220,"pw0":36,"pw1":60,"po0":0.85},"raceDeadAir_burst_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":5,"s":"spark-elec","l":[180,350],"z":4,"o":12,"vx":60,"vy":60,"vz":[20,70],"g":80,"dr":1.6,"s0":[3,6],"s1":1},{"d":60,"s":"flash","l":140,"z":6,"s0":50,"s1":14,"o0":0.55}]},"raceDeadAir_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":70,"s1":220,"o0":0.55},{"s":"flash","l":220,"z":14,"s0":130,"s1":30,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":120,"s1":220,"o0":0.75},{"n":12,"s":"spark-elec","l":[200,420],"z":6,"o":14,"vx":130,"vy":130,"vz":[40,130],"g":120,"dr":1.5,"s0":[4,8],"s1":1},{"n":6,"d":180,"s":"spark-elec","l":[150,320],"z":6,"o":10,"vx":80,"vy":80,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.9}]},"_eorHpRegen_aura":{"ar":0,"sh":"square","ice":"_eorHpRegen_burst_center"},"_eorHpRegen_burst_center":{"L":[{"s":"heal-glow","l":450,"z":4,"s0":110,"s1":36,"o0":0.85},{"s":"flash","l":200,"z":8,"s0":70,"s1":18,"o0":0.6},{"n":4,"d":40,"s":"heal-cross","l":[450,750],"o":6,"vx":60,"vy":60,"vz":[40,110],"g":20,"dr":1.2,"s0":[8,13],"s1":1}]},"_eorMpRegen_aura":{"ar":0,"sh":"square","ice":"_eorMpRegen_burst_center"},"_eorMpRegen_burst_center":{"L":[{"s":"shield-blue","l":450,"z":4,"s0":100,"s1":32,"o0":0.8},{"s":"flash","l":200,"z":8,"s0":65,"s1":16,"o0":0.55},{"n":4,"d":40,"s":"spark-blue","l":[450,750],"o":6,"vx":55,"vy":55,"vz":[40,110],"g":10,"dr":1.2,"s0":[7,11],"s1":1}]},"wildGrowth_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":1,"s0":60,"s1":140,"o0":0.7},{"a":"floor","s":"heal-glow","l":700,"z":4,"s0":70,"s1":30,"o0":0.7},{"n":8,"a":"floor","s":"vine-green","l":[350,650],"z":6,"o":14,"vx":50,"vy":50,"vz":[80,180],"g":220,"dr":1.2,"s0":[6,11],"s1":[10,16]},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":5,"d":250,"a":"floor","s":"vine-green","l":[350,600],"z":4,"o":16,"vx":40,"vy":40,"vz":[50,130],"g":180,"dr":1.3,"s0":[5,9],"s1":[9,14],"o0":0.95},{"n":4,"d":100,"a":"floor","s":"divine-sparkle","l":[400,700],"z":8,"o":10,"vx":60,"vy":60,"vz":[40,110],"g":-20,"dr":1.1,"s0":[4,8],"s1":1,"o0":0.9}]},"buildBridge_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"dust-puff","l":1500,"z":2,"s0":70,"s1":160,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":8,"s0":90,"s1":24,"o0":0.8},{"n":10,"a":"floor","s":"debris","l":[450,800],"z":6,"o":12,"vx":130,"vy":130,"vz":[80,200],"g":360,"dr":1.4,"s0":[6,11],"s1":1},{"n":5,"d":60,"a":"floor","s":"spark-elec","l":[180,320],"z":10,"o":10,"vx":90,"vy":90,"vz":[40,130],"g":200,"dr":1.5,"s0":[3,6],"s1":1},{"n":2,"d":80,"a":"floor","m":"y-locked","s":"smoke","l":[600,1000],"o":12,"vz":[20,40],"dr":0.45,"s0":[22,36],"s1":[50,80],"o0":0.5}]},"raceBrimstone_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1800,"z":1,"s0":90,"s1":130,"o0":0.95},{"a":"floor","m":"world","s":"fire-glow","l":1400,"z":2,"s0":100,"s1":140,"o0":0.85},{"a":"floor","m":"y-locked","s":"flame-hot","l":600,"w0":50,"w1":18,"h0":90,"h1":160},{"n":3,"d":40,"a":"floor","m":"y-locked","s":"dark-flame","l":[500,900],"o":22,"w0":[24,36],"w1":[10,18],"h0":[60,90],"h1":[100,160],"o0":0.95},{"n":12,"a":"floor","s":"ember","l":[400,750],"z":8,"o":14,"vx":140,"vy":140,"vz":[70,200],"g":340,"dr":1.3,"s0":[6,11],"s1":1},{"n":2,"d":350,"a":"floor","m":"y-locked","s":"dark-flame","l":[400,700],"o":18,"w0":[18,28],"w1":[8,14],"h0":[40,70],"h1":[70,120],"o0":0.85},{"n":3,"d":100,"a":"floor","m":"y-locked","s":"smoke","l":[900,1300],"o":14,"vz":[30,60],"dr":0.4,"s0":[30,46],"s1":[80,130],"o0":0.7}]},"raceCallOfTheDeep_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1300,"z":1,"s0":60,"s1":180,"o0":0.8},{"a":"floor","m":"world","s":"void-mist","l":1600,"z":2,"s0":70,"s1":130,"o0":0.65},{"a":"floor","m":"world","s":"shield-blue","l":1100,"z":2,"s0":70,"s1":120,"o0":0.55},{"n":8,"a":"floor","s":"spark-blue","l":[500,850],"z":6,"o":14,"vx":50,"vy":50,"vz":[50,130],"g":80,"dr":1.4,"s0":[5,9],"s1":1},{"n":3,"d":80,"a":"floor","m":"y-locked","s":"void-mist","l":[800,1200],"o":14,"vz":[25,55],"dr":0.4,"s0":[28,42],"s1":[60,100],"o0":0.55},{"d":380,"a":"floor","m":"world","s":"halo-ring","l":900,"z":1,"s0":70,"s1":150,"o0":0.55}]},"teleport_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":200},"teleport_disperse":{"L":[{"s":"flash","l":220,"z":8,"s0":110,"s1":28,"o0":0.9},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,750],"o":12,"vz":[40,80],"dr":0.5,"s0":[24,36],"s1":[50,80],"o0":0.65},{"n":8,"s":"divine-sparkle","l":[350,600],"z":4,"o":10,"vx":120,"vy":120,"vz":[50,140],"g":60,"dr":1.4,"s0":[6,11],"s1":1},{"n":5,"d":60,"s":"spark-blue","l":[400,700],"z":6,"o":8,"vx":60,"vy":60,"vz":[40,110],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"teleport_arrive":{"L":[{"s":"flash","l":240,"z":10,"s0":140,"s1":30},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":12,"vz":[40,80],"dr":0.5,"s0":[24,36],"s1":[50,80],"o0":0.7},{"n":10,"s":"divine-sparkle","l":[400,700],"z":4,"o":12,"vx":130,"vy":130,"vz":[60,150],"g":50,"dr":1.3,"s0":[6,12],"s1":1},{"n":6,"d":60,"s":"spark-blue","l":[450,750],"z":6,"o":8,"vx":70,"vy":70,"vz":[50,120],"g":-10,"dr":1.2,"s0":[5,10],"s1":1}]},"voidRush_teleport":{"de":"voidRush_disperse","ae":"voidRush_arrive","adm":220},"voidRush_disperse":{"L":[{"s":"flash","l":220,"z":8,"s0":120,"s1":28,"o0":0.85},{"n":3,"a":"floor","m":"y-locked","s":"void-mist","l":[600,950],"o":12,"vz":[40,90],"dr":0.4,"s0":[32,48],"s1":[70,110],"o0":0.8},{"a":"floor","m":"y-locked","s":"dark-flame","l":480,"w0":48,"w1":20,"h0":70,"h1":140,"o0":0.85},{"n":8,"s":"spark-blue","l":[400,700],"z":4,"o":12,"vx":110,"vy":110,"vz":[50,140],"g":40,"dr":1.3,"s0":[6,10],"s1":1}]},"voidRush_arrive":{"L":[{"s":"flash","l":280,"z":12,"s0":180,"s1":36},{"a":"floor","m":"world","s":"shockwave","l":620,"z":2,"s0":80,"s1":420,"o0":0.85},{"n":3,"a":"floor","m":"y-locked","s":"void-mist","l":[650,1000],"o":14,"vz":[40,90],"dr":0.4,"s0":[32,48],"s1":[80,120],"o0":0.85},{"s":"dark-flame","l":500,"z":8,"s0":110,"s1":50,"o0":0.95},{"n":12,"s":"spark-blue","l":[450,750],"z":4,"o":14,"vx":150,"vy":150,"vz":[60,180],"g":60,"dr":1.3,"s0":[7,12],"s1":1}]},"raceShadowStep_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":180},"raceShadowStep_disperse":{"L":[{"s":"dark-flame","l":380,"z":6,"s0":100,"s1":36},{"n":2,"a":"floor","m":"world","s":"void-mist","l":900,"z":2,"s0":50,"s1":100,"o0":0.7},{"n":4,"s":"blood-fleck","l":[300,550],"z":4,"o":9,"vx":80,"vy":80,"vz":[30,100],"g":240,"dr":1.4,"s0":[4,8],"s1":1}]},"raceShadowStep_arrive":{"L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":22,"o0":0.7},{"s":"dark-flame","l":420,"z":6,"s0":110,"s1":40},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":10,"vz":[40,80],"dr":0.45,"s0":[22,34],"s1":[50,80],"o0":0.7},{"n":6,"s":"blood-fleck","l":[350,600],"z":4,"o":10,"vx":100,"vy":100,"vz":[40,120],"g":260,"dr":1.4,"s0":[4,9],"s1":1}]},"racePhaseWalk_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":200},"racePhaseWalk_disperse":{"L":[{"s":"flash","l":200,"z":8,"s0":110,"s1":26},{"s":"emp-arc","l":320,"z":6,"s0":90,"s1":32,"o0":0.95},{"n":10,"s":"spark-elec","l":[180,380],"z":4,"o":10,"vx":130,"vy":130,"vz":[40,130],"g":80,"dr":1.6,"s0":[4,8],"s1":1}]},"racePhaseWalk_arrive":{"L":[{"s":"flash","l":220,"z":10,"s0":130,"s1":30},{"s":"emp-arc","l":360,"z":6,"s0":110,"s1":40},{"n":12,"s":"spark-elec","l":[200,420],"z":4,"o":12,"vx":150,"vy":150,"vz":[50,150],"g":80,"dr":1.5,"s0":[4,9],"s1":1},{"n":5,"d":150,"s":"spark-elec","l":[120,280],"z":4,"o":8,"vx":70,"vy":70,"vz":[30,100],"g":80,"dr":1.5,"s0":[3,6],"s1":1,"o0":0.9}]},"raceShedSkin_teleport":{"de":"raceShedSkin_disperse","ae":"raceShedSkin_arrive","adm":220},"raceShedSkin_disperse":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":2,"s0":60,"s1":130,"o0":0.75},{"a":"floor","m":"world","s":"void-mist","l":900,"z":2,"s0":50,"s1":100,"o0":0.55},{"n":6,"s":"vine-green","l":[400,700],"z":4,"o":10,"vx":80,"vy":80,"vz":[30,100],"g":200,"dr":1.3,"s0":[5,10],"s1":1}]},"raceShedSkin_arrive":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":50,"s1":110,"o0":0.65},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,800],"o":10,"vz":[30,70],"dr":0.5,"s0":[22,32],"s1":[50,75],"o0":0.6},{"n":4,"d":30,"s":"divine-sparkle","l":[400,650],"z":6,"o":8,"vx":50,"vy":50,"vz":[40,110],"g":-10,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.9}]},"raceNimbleDodge_teleport":{"de":"raceNimbleDodge_disperse","ae":"raceNimbleDodge_arrive","adm":220},"raceNimbleDodge_disperse":{"L":[{"s":"flash","l":180,"z":8,"s0":100,"s1":24},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":55,"s1":110,"o0":0.7},{"n":5,"s":"spark-elec","l":[160,300],"z":4,"o":8,"vx":100,"vy":100,"vz":[30,100],"g":100,"dr":1.5,"s0":[3,6],"s1":1}]},"raceNimbleDodge_arrive":{"L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":18,"o0":0.75},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":45,"s1":90,"o0":0.55},{"n":4,"s":"spark-elec","l":[120,240],"z":4,"o":7,"vx":70,"vy":70,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,5],"s1":1,"o0":0.9}]},"deployTurret_aura":{"ar":0,"sh":"square","ice":"deployTurret_burst_center"},"deployTurret_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":130,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":2,"s0":40,"s1":100,"o0":0.7},{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.85},{"n":5,"d":40,"a":"floor","s":"spark-elec","l":[180,340],"z":6,"o":8,"vx":90,"vy":90,"vz":[40,110],"g":160,"dr":1.5,"s0":[3,6],"s1":1},{"n":4,"a":"floor","s":"debris","l":[300,500],"z":4,"o":6,"vx":70,"vy":70,"vz":[50,130],"g":280,"dr":1.4,"s0":[3,6],"s1":1}]},"siegeTurret_aura":{"ar":0,"sh":"square","ice":"siegeTurret_burst_center"},"siegeTurret_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":180,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":1300,"z":2,"s0":70,"s1":160,"o0":0.85},{"a":"floor","s":"flash","l":240,"z":12,"s0":120,"s1":30},{"d":200,"a":"floor","s":"flash","l":180,"z":8,"s0":80,"s1":20,"o0":0.75},{"n":8,"d":40,"a":"floor","s":"spark-elec","l":[200,400],"z":6,"o":10,"vx":110,"vy":110,"vz":[50,140],"g":180,"dr":1.5,"s0":[4,7],"s1":1},{"n":7,"a":"floor","s":"debris","l":[350,600],"z":4,"o":8,"vx":90,"vy":90,"vz":[60,160],"g":320,"dr":1.4,"s0":[4,8],"s1":1}]},"fiveGTower_aura":{"ar":0,"sh":"square","ice":"fiveGTower_burst_center","ps":"buff-aura","pm":700,"ph":280,"ph1":340,"pw0":36,"pw1":60,"po0":0.95},"fiveGTower_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":70,"s1":240,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":40,"s1":100,"o0":0.55},{"a":"floor","s":"flash","l":240,"z":14,"s0":110,"s1":28},{"a":"floor","s":"emp-arc","l":420,"z":10,"s0":100,"s1":50,"o0":0.95},{"n":12,"a":"floor","s":"spark-elec","l":[220,420],"z":6,"o":14,"vx":160,"vy":160,"vz":[40,120],"g":100,"dr":1.5,"s0":[4,8],"s1":1},{"d":180,"a":"floor","s":"emp-arc","l":380,"z":6,"s0":80,"s1":36,"o0":0.7}]},"shootout_impact":{"L":[{"a":"floor","m":"world","s":"scorch","l":900,"z":2,"s0":36,"s1":70,"o0":0.75},{"s":"muzzle-flash","l":200,"z":4,"s0":90,"s1":26},{"s":"flash","l":160,"z":8,"s0":70,"s1":16,"o0":0.9},{"n":6,"s":"steel-spark","l":[200,380],"z":4,"o":8,"vx":130,"vy":130,"vz":[50,140],"g":240,"dr":1.4,"s0":[4,7],"s1":1},{"d":30,"m":"y-locked","s":"smoke","l":650,"o":6,"vz":[30,50],"dr":0.5,"s0":26,"s1":60,"o0":0.55}]},"requiem_impact":{"L":[{"a":"floor","m":"world","s":"scorch","l":1000,"z":2,"s0":40,"s1":80,"o0":0.85},{"s":"dark-flame","l":380,"z":6,"s0":90,"s1":36},{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.8},{"n":6,"s":"blood-fleck","l":[300,550],"z":4,"o":9,"vx":100,"vy":100,"vz":[40,130],"g":260,"dr":1.4,"s0":[4,8],"s1":1},{"n":2,"d":60,"m":"y-locked","s":"void-mist","l":[500,800],"o":8,"vz":[25,55],"dr":0.5,"s0":[18,28],"s1":[40,70],"o0":0.5}]},"raceDreadAura_impact":{"L":[{"s":"dark-flame","l":300,"z":6,"s0":70,"s1":26,"o0":0.95},{"s":"flash","l":160,"z":8,"s0":56,"s1":14,"o0":0.7},{"n":4,"s":"blood-fleck","l":[220,400],"z":4,"o":7,"vx":70,"vy":70,"vz":[30,100],"g":240,"dr":1.4,"s0":[3,6],"s1":1}]},"raceDreadAura_aura":{"ar":2,"sh":"square","ite":"raceDreadAura_aura_tile","ice":"raceDreadAura_aura_center","ps":"dark-flame","pm":680,"ph":240,"ph1":290,"pw0":70,"pw1":110,"po0":0.95},"raceDreadAura_aura_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1100,"z":2,"s0":40,"s1":85,"o0":0.6},{"a":"floor","m":"world","s":"void-mist","l":1000,"z":2,"s0":36,"s1":80,"o0":0.5},{"a":"floor","s":"dark-flame","l":380,"z":6,"s0":40,"s1":16,"o0":0.85}]},"raceDreadAura_aura_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":80,"s1":320,"o0":0.85},{"s":"dark-flame","l":600,"z":12,"s0":150,"s1":60},{"s":"flash","l":250,"z":14,"s0":130,"s1":30,"o0":0.75},{"n":12,"s":"blood-fleck","l":[400,750],"z":6,"o":12,"vx":160,"vy":160,"vz":[50,180],"g":320,"dr":1.3,"s0":[5,9],"s1":1},{"n":3,"d":80,"a":"floor","m":"y-locked","s":"void-mist","l":[800,1200],"o":12,"vz":[35,70],"dr":0.45,"s0":[30,46],"s1":[70,120],"o0":0.65}]},"raceHowl_impact":{"L":[{"s":"flash","l":180,"z":8,"s0":75,"s1":18,"o0":0.85},{"n":5,"s":"spark-elec","l":[160,300],"z":4,"o":8,"vx":100,"vy":100,"vz":[40,110],"g":100,"dr":1.5,"s0":[3,6],"s1":1},{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":32,"s1":70,"o0":0.5}]},"raceHowl_aura":{"ar":2,"sh":"square","ite":"raceHowl_aura_tile","ice":"raceHowl_aura_center","ps":"buff-aura","pm":480,"ph":220,"ph1":260,"pw0":60,"pw1":100,"po0":1},"raceHowl_aura_tile":{"L":[{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":30,"s1":75,"o0":0.6},{"n":2,"a":"floor","s":"spark-elec","l":[150,280],"z":4,"o":8,"vx":60,"vy":60,"vz":[30,90],"g":100,"dr":1.5,"s0":[3,6],"s1":1}]},"raceHowl_aura_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":80,"s1":320,"o0":0.9},{"s":"flash","l":240,"z":14,"s0":160,"s1":36},{"a":"floor","m":"world","s":"dust-puff","l":1200,"z":2,"s0":110,"s1":240,"o0":0.7},{"n":14,"s":"spark-elec","l":[200,380],"z":6,"o":14,"vx":180,"vy":180,"vz":[40,130],"g":120,"dr":1.5,"s0":[4,8],"s1":1},{"d":200,"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":100,"s1":280,"o0":0.55}]},"raceFractalNeedle_impact":{"L":[{"s":"flash","l":220,"z":10,"s0":110,"s1":26},{"s":"laser-pink","l":380,"z":6,"s0":80,"s1":32},{"n":8,"s":"divine-sparkle","l":[350,600],"z":6,"o":9,"vx":130,"vy":130,"vz":[60,160],"g":60,"dr":1.3,"s0":[5,9],"s1":1},{"d":40,"a":"floor","m":"y-locked","s":"void-mist","l":600,"o":10,"vz":[25,50],"dr":0.45,"s0":28,"s1":64,"o0":0.6},{"d":100,"s":"laser-pink","l":200,"z":8,"s0":50,"s1":18,"o0":0.75}]},"warpRune_aura":{"ar":0,"sh":"square","ice":"warpRune_burst_center"},"warpRune_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":30,"s1":110,"o0":0.7},{"a":"floor","s":"flash","l":200,"z":10,"s0":75,"s1":18,"o0":0.85},{"n":2,"a":"floor","m":"y-locked","s":"void-mist","l":[500,750],"o":8,"vz":[25,50],"dr":0.5,"s0":[20,30],"s1":[44,68],"o0":0.6},{"n":6,"a":"floor","s":"divine-sparkle","l":[400,700],"z":6,"o":8,"vx":50,"vy":50,"vz":[30,90],"g":-10,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95},{"n":4,"d":60,"a":"floor","s":"spark-blue","l":[400,650],"z":6,"o":7,"vx":40,"vy":40,"vz":[30,90],"g":-10,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.95}]},"_nexusChannelP1_aura":{"ar":0,"sh":"square","ice":"_nexusChannelP1_burst_center","ps":"shield-blue","pm":500,"ph":200,"ph1":240,"pw0":48,"pw1":72,"po0":0.85},"_nexusChannelP1_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":550,"z":1,"s0":30,"s1":110,"o0":0.7},{"s":"flash","l":200,"z":6,"s0":60,"s1":14,"o0":0.7},{"n":5,"d":30,"s":"spark-blue","l":[400,650],"o":8,"vx":50,"vy":50,"vz":[50,120],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"_nexusChannelP2_aura":{"ar":0,"sh":"square","ice":"_nexusChannelP2_burst_center","ps":"flame","pm":500,"ph":200,"ph1":240,"pw0":48,"pw1":72,"po0":0.85},"_nexusChannelP2_burst_center":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":550,"z":1,"s0":30,"s1":110,"o0":0.7},{"s":"flash","l":200,"z":6,"s0":60,"s1":14,"o0":0.7},{"n":5,"d":30,"s":"ember","l":[400,650],"o":8,"vx":50,"vy":50,"vz":[50,120],"g":-20,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.95}]},"_nexusProgressP1_aura":{"ar":0,"sh":"square","ice":"_nexusProgressP1_burst_center"},"_nexusProgressP1_burst_center":{"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":600,"z":2,"s0":90,"s1":28,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":4,"s0":60,"s1":12,"o0":0.85},{"n":5,"d":20,"a":"floor","s":"spark-blue","l":[350,550],"z":4,"o":6,"vx":35,"vy":35,"vz":[20,70],"g":-10,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","s":"divine-sparkle","l":[400,600],"z":6,"o":6,"vx":30,"vy":30,"vz":[30,80],"g":-10,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95}]},"_nexusProgressP2_aura":{"ar":0,"sh":"square","ice":"_nexusProgressP2_burst_center"},"_nexusProgressP2_burst_center":{"L":[{"a":"floor","m":"world","s":"fire-glow","l":600,"z":2,"s0":90,"s1":28,"o0":0.85},{"a":"floor","s":"flash","l":220,"z":4,"s0":60,"s1":12,"o0":0.85},{"n":5,"d":20,"a":"floor","s":"ember","l":[350,550],"z":4,"o":6,"vx":35,"vy":35,"vz":[20,70],"g":-10,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.95},{"n":3,"d":60,"a":"floor","s":"spark-elec","l":[400,600],"z":6,"o":6,"vx":30,"vy":30,"vz":[30,80],"g":-10,"dr":1.2,"s0":[4,7],"s1":1,"o0":0.95}]},"_ice_impact_tile":{"L":[{"n":6,"a":"floor","s":"ice-shard","l":[300,550],"z":4,"o":10,"vx":100,"vy":100,"vz":[60,160],"g":280,"dr":1.4,"s0":[5,10],"s1":1},{"a":"floor","m":"world","s":"target-ring-blue","l":650,"z":2,"s0":50,"s1":110,"o0":0.6}]},"_ice_impact_center":{"sk":"normal","L":[{"a":"floor","s":"flash","l":250,"z":10,"s0":120,"s1":30},{"a":"floor","s":"spark-blue","l":400,"z":8,"s0":140,"s1":40,"o0":0.9},{"n":10,"a":"floor","s":"ice-shard","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[80,200],"g":300,"dr":1.3,"s0":[6,12],"s1":1},{"n":2,"d":60,"a":"floor","m":"y-locked","s":"frost-mist","l":[700,1000],"o":14,"vz":[15,35],"dr":0.4,"s0":[35,50],"s1":[70,100],"o0":0.5}]},"_earth_impact_tile":{"L":[{"n":5,"a":"floor","s":"rock-debris","l":[300,550],"z":4,"o":10,"vx":90,"vy":90,"vz":[70,180],"g":320,"dr":1.5,"s0":[5,11],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":2,"s0":50,"s1":110,"o0":0.55}]},"_earth_impact_center":{"sk":"hard","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":100,"s1":24,"o0":0.9},{"n":12,"a":"floor","s":"rock-debris","l":[300,600],"z":4,"o":10,"vx":150,"vy":150,"vz":[80,220],"g":350,"dr":1.2,"s0":[6,14],"s1":2},{"n":3,"a":"floor","s":"debris","l":[400,700],"z":2,"o":12,"vx":100,"vy":100,"vz":[60,160],"g":380,"dr":1.1,"s0":[8,14],"s1":3,"o0":0.9},{"a":"floor","m":"world","s":"dust-puff","l":1000,"z":1,"s0":60,"s1":180,"o0":0.6}]},"_water_impact_tile":{"L":[{"n":5,"a":"floor","s":"wave-1","l":[300,550],"z":4,"o":10,"vx":90,"vy":90,"vz":[50,140],"g":260,"dr":1.4,"s0":[5,10],"s1":2,"o0":0.9},{"a":"floor","m":"world","s":"target-ring-blue","l":650,"z":2,"s0":50,"s1":100,"o0":0.55}]},"_water_impact_center":{"sk":"normal","L":[{"a":"floor","s":"spark-blue","l":350,"z":10,"s0":130,"s1":35},{"n":8,"a":"floor","s":"wave-1","l":[300,600],"z":4,"o":8,"vx":130,"vy":130,"vz":[60,180],"g":280,"dr":1.3,"s0":[6,12],"s1":2},{"a":"floor","m":"y-locked","s":"spark-blue","l":800,"w0":70,"w1":45,"h0":110,"h1":170,"o0":0.75}]},"_poison_impact_tile":{"L":[{"n":5,"a":"floor","s":"poison-bubble","l":[350,600],"z":4,"o":10,"vx":70,"vy":70,"vz":[30,100],"g":180,"dr":1.2,"s0":[5,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"acid-green","l":600,"z":2,"s0":50,"s1":100,"o0":0.5}]},"_poison_impact_center":{"sk":false,"L":[{"a":"floor","s":"acid-green","l":400,"z":8,"s0":100,"s1":35,"o0":0.9},{"n":10,"a":"floor","s":"poison-bubble","l":[300,600],"z":4,"o":10,"vx":110,"vy":110,"vz":[30,120],"g":160,"dr":1,"s0":[6,12],"s1":3,"o0":0.9},{"n":2,"d":80,"a":"floor","m":"y-locked","s":"smoke","l":[700,1000],"o":12,"vz":[20,50],"dr":0.4,"s0":[30,45],"s1":[65,90],"o0":0.45}]},"_sand_impact_tile":{"L":[{"n":8,"a":"floor","s":"sand-particle","l":[300,600],"z":4,"o":12,"vx":120,"vy":120,"vz":[40,120],"g":200,"dr":1,"s0":[4,8],"s1":1,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":700,"z":2,"s0":60,"s1":120,"o0":0.5}]},"sharedFlashFreeze_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"target-ring-blue","l":900,"z":1,"s0":50,"s1":130,"o0":0.7},{"a":"floor","s":"spark-blue","l":550,"z":4,"s0":70,"s1":28,"o0":0.8},{"n":7,"a":"floor","s":"ice-shard","l":[300,600],"z":6,"o":12,"vx":60,"vy":60,"vz":[80,180],"g":240,"dr":1.3,"s0":[5,10],"s1":[8,14]},{"a":"floor","m":"y-locked","s":"frost-mist","l":[600,800],"o":10,"vz":[15,30],"dr":0.5,"s0":[25,40],"s1":[55,80],"o0":0.4}]},"sharedRampart_tile":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.8},{"n":8,"a":"floor","s":"rock-debris","l":[250,550],"z":4,"o":12,"vx":70,"vy":70,"vz":[100,220],"g":320,"dr":1.2,"s0":[6,13],"s1":2},{"n":2,"a":"floor","s":"debris","l":[350,600],"z":2,"o":10,"vx":80,"vy":80,"vz":[60,140],"g":360,"dr":1.1,"s0":[8,14],"s1":3,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":1,"s0":50,"s1":130,"o0":0.6}]},"sharedFissure_tile":{"sk":"hard","L":[{"a":"floor","s":"flash","l":180,"z":10,"s0":90,"s1":22,"o0":0.85},{"n":10,"a":"floor","s":"rock-debris","l":[250,600],"z":4,"o":14,"vx":130,"vy":130,"vz":[100,260],"g":350,"dr":1.1,"s0":[5,14],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":1100,"z":1,"s0":70,"s1":200,"o0":0.65},{"n":2,"d":50,"a":"floor","s":"dark-flame","l":[600,900],"o":8,"vz":[30,80],"g":-20,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.6}]},"sharedScorchedEarth_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":80,"s1":120,"o0":0.8},{"n":6,"a":"floor","s":"ember","l":[300,600],"z":4,"o":12,"vx":80,"vy":80,"vz":[60,150],"g":250,"dr":1.3,"s0":[5,10],"s1":2},{"n":2,"d":50,"a":"floor","m":"y-locked","s":"smoke","l":[700,1000],"o":10,"vz":[20,50],"dr":0.4,"s0":[30,45],"s1":[65,95],"o0":0.5}]},"sharedPoisonSwamp_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"acid-green","l":700,"z":2,"s0":50,"s1":110,"o0":0.55},{"n":6,"a":"floor","s":"poison-bubble","l":[350,650],"z":4,"o":12,"vx":50,"vy":50,"vz":[30,100],"g":160,"dr":1.1,"s0":[5,10],"s1":3,"o0":0.85},{"d":60,"a":"floor","m":"y-locked","s":"smoke","l":[600,900],"o":10,"vz":[15,35],"dr":0.4,"s0":[28,40],"s1":[55,80],"o0":0.4}]},"sharedTerraform_tile":{"sk":false,"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":1,"s0":55,"s1":130,"o0":0.65},{"a":"floor","s":"heal-glow","l":600,"z":4,"s0":65,"s1":28,"o0":0.65},{"n":6,"a":"floor","s":"vine-green","l":[300,600],"z":6,"o":12,"vx":45,"vy":45,"vz":[70,160],"g":200,"dr":1.2,"s0":[5,10],"s1":[9,14]},{"n":3,"d":80,"a":"floor","s":"divine-sparkle","l":[400,650],"z":8,"o":10,"vx":50,"vy":50,"vz":[40,100],"g":-20,"dr":1,"s0":[4,7],"s1":1,"o0":0.85}]},"sharedMaelstrom_tile":{"sk":"normal","L":[{"a":"floor","m":"world","s":"target-ring-blue","l":800,"z":2,"s0":60,"s1":140,"o0":0.7},{"n":8,"a":"floor","s":"wave-1","l":[300,600],"z":4,"o":12,"vx":80,"vy":80,"vz":[50,150],"g":260,"dr":1.3,"s0":[6,12],"s1":2,"o0":0.9},{"a":"floor","m":"y-locked","s":"spark-blue","l":700,"w0":60,"w1":40,"h0":90,"h1":150,"o0":0.65}]},"sharedSacredGeometry_tile":{"sk":false,"L":[{"a":"floor","s":"flash","l":220,"z":10,"s0":80,"s1":22,"o0":0.85},{"a":"floor","s":"laser-pink","l":400,"z":6,"s0":65,"s1":28,"o0":0.8},{"n":6,"a":"floor","s":"divine-sparkle","l":[300,550],"z":6,"o":10,"vx":60,"vy":60,"vz":[80,170],"g":220,"dr":1.3,"s0":[5,10],"s1":[8,14]}]},"sharedGothicRampart_tile":{"sk":"normal","L":[{"n":6,"a":"floor","s":"rock-debris","l":[250,500],"z":4,"o":10,"vx":60,"vy":60,"vz":[80,180],"g":300,"dr":1.3,"s0":[5,11],"s1":2},{"n":2,"a":"floor","s":"dark-flame","l":[400,650],"z":2,"o":8,"vz":[30,70],"g":-15,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.5},{"a":"floor","m":"world","s":"dust-puff","l":800,"z":1,"s0":45,"s1":110,"o0":0.55}]},"sharedZigguratProtocol_tile":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":8,"a":"floor","s":"rock-debris","l":[250,550],"z":4,"o":12,"vx":70,"vy":70,"vz":[100,220],"g":320,"dr":1.2,"s0":[6,13],"s1":2},{"n":3,"a":"floor","s":"spark-elec","l":[350,550],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,100],"g":-10,"dr":1,"s0":[4,7],"s1":1,"o0":0.8},{"a":"floor","m":"world","s":"dust-puff","l":850,"z":1,"s0":50,"s1":120,"o0":0.55}]},"sharedTidalSurge_beam":{"bs":"wave-1","bw":36,"bm":280,"bo0":0.9,"bo1":0,"ls":false},"sharedTidalSurge_impact_tile":{"L":[{"n":6,"s":"wave-1","l":[300,550],"z":4,"o":8,"vx":110,"vy":110,"vz":[40,120],"g":260,"dr":1.4,"s0":[5,10],"s1":2,"o0":0.9},{"a":"floor","m":"world","s":"target-ring-blue","l":600,"z":2,"s0":50,"s1":100,"o0":0.55}]},"raceShockwaveClap_beam":{"bs":"shockwave","bw":40,"bm":250,"bo0":0.85,"bo1":0},"raceShockwaveClap_impact_tile":{"L":[{"s":"shockwave","l":400,"z":6,"s0":120,"s1":40,"o0":0.8},{"n":4,"a":"floor","s":"dust-puff","l":[350,600],"z":2,"o":10,"vx":100,"vy":100,"vz":[30,80],"g":200,"dr":1.4,"s0":[8,14],"s1":[20,30],"o0":0.5}]},"raceDragonfire_beam":{"bs":"flame","bw":40,"bm":300,"bo0":1,"bo1":0,"ls":true},"raceDragonfire_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1300,"z":1,"s0":80,"s1":110,"o0":0.85},{"n":8,"s":"ember","l":[300,600],"z":4,"o":8,"vx":120,"vy":120,"vz":[50,160],"g":300,"dr":1.4,"s0":[5,10],"s1":2},{"n":2,"d":40,"m":"y-locked","s":"smoke","l":[600,900],"o":12,"vz":[20,45],"dr":0.4,"s0":[25,38],"s1":[50,75],"o0":0.45}]},"raceAtomicBreath_beam":{"bs":"flame-hot","bw":44,"bm":320,"bo0":1,"bo1":0,"ls":true},"raceAtomicBreath_impact_tile":{"L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":90,"s1":120,"o0":0.9},{"s":"flash","l":200,"z":10,"s0":110,"s1":28},{"n":10,"s":"ember","l":[300,600],"z":4,"o":10,"vx":140,"vy":140,"vz":[60,180],"g":320,"dr":1.3,"s0":[5,12],"s1":2},{"n":3,"d":60,"m":"y-locked","s":"smoke","l":[700,1000],"o":14,"vz":[25,55],"dr":0.4,"s0":[30,45],"s1":[60,90],"o0":0.5}]},"raceWingGust_aoe":{"ar":1,"ite":"raceWingGust_impact_tile","ice":"raceWingGust_impact_center"},"raceWingGust_impact_tile":{"L":[{"n":3,"s":"dust-puff","l":[350,600],"z":2,"o":10,"vx":120,"vy":120,"vz":[30,80],"g":150,"dr":1,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceWingGust_impact_center":{"sk":"normal","L":[{"s":"shockwave","l":500,"z":6,"s0":60,"s1":280,"o0":0.8},{"n":6,"s":"dust-puff","l":[300,600],"z":2,"o":12,"vx":160,"vy":160,"vz":[20,60],"g":100,"dr":0.8,"s0":[12,20],"s1":[30,50],"o0":0.55}]},"raceCataclysmStomp_aoe":{"ar":2,"ite":"raceTremorStomp_impact_tile","ice":"_earth_impact_center"},"raceTidalSlam_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"racePrimalRoar_aoe":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"raceTremorStomp_impact_tile"},"raceAvalancheSlam_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"_ice_impact_center"},"raceCrowStorm_aoe":{"ar":1,"ite":"raceBatSwarm_impact_tile","ice":"raceBatSwarm_impact_tile"},"raceDeafeningWail_aoe":{"ar":1,"ite":"raceSonicBreaker_impact_tile","ice":"raceSonicBreaker_impact_tile"},"raceDepthCharge_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"raceSkyscraperToss_aoe":{"ar":1,"ite":"_earth_impact_tile","ice":"_earth_impact_center"},"raceRiptide_aoe":{"ar":1,"ite":"_water_impact_tile","ice":"_water_impact_center"},"sharedVortexSlam_aoe":{"ar":1,"ite":"raceWhirlpool_impact_tile","ice":"raceWhirlpool_impact_center"},"raceThunderclap_descent":{"ar":1,"sh":"cross","ite":"thunder1_impact","ice":"thunder1_impact","_d":[{"sprite":"lightning","count":1,"w":40,"h":400,"fallMs":180,"opacity0":1,"opacity1":0}]},"raceFallenGrace_descent":{"ar":1,"sh":"cross","ite":"raceDarkDominion_impact_tile","ice":"raceDarkDominion_impact_tile","_d":[{"sprite":"dark-flame","count":1,"w":36,"h":360,"fallMs":200,"opacity0":1,"opacity1":0}]},"raceWrathOfTheWatchers_descent":{"ar":2,"sh":"cross","ite":"judgment_impact_tile","ice":"judgment_impact_center","_d":[{"sprite":"holy-light","count":1,"w":38,"h":380,"fallMs":190,"opacity0":1,"opacity1":0}]},"raceArtilleryStrike_descent":{"ar":1,"tm":700,"dsm":500,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":420,"durationMs":850,"delayMs":60,"trailCount":6},"L":[{"s":"missile","l":500,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":135,"_d":{"fromZ":600,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":18,"jitter":8,"msRange":[350,550],"sizeRange":[10,20]}}},{"s":"flash","l":500,"z":-2,"s0":140,"s1":120,"o0":0.5,"o1":0.7,"_d":{"fromZ":610,"toZ":null,"ease":"easeIn"}},{"s":"meteor","l":500,"z":-1,"s0":80,"s1":60,"o0":0.5,"o1":0.7,"_d":{"fromZ":605,"toZ":null,"ease":"easeIn","trail":{"sprite":"ember","rateMs":30,"jitter":10,"msRange":[250,450],"sizeRange":[8,14]}}}]},"raceCataclysmDecree_descent":{"ar":1,"ite":"raceInfernalDecree_impact_tile","ice":"raceInfernalDecree_impact_center","_d":[{"sprite":"dark-flame","count":1,"w":34,"h":60,"fallMs":380,"opacity0":1,"opacity1":0.8,"trail":{"sprite":"ember","count":2,"size0":8,"size1":20,"ml":350,"opacity0":0.8,"opacity1":0}}]},"raceProphecyOfDisaster_descent":{"ar":1,"ite":"raceTremorStomp_impact_tile","ice":"_earth_impact_center","_d":[{"sprite":"ember","count":1,"w":28,"h":45,"fallMs":360,"opacity0":1,"opacity1":0.8,"trail":{"sprite":"smoke","count":2,"size0":8,"size1":24,"ml":350,"opacity0":0.5,"opacity1":0}}]},"sharedNuke_descent":{"ar":2,"tm":850,"dsm":700,"ite":"nuke_impact_tile","ice":"nuke_impact_center","ts":"target-ring-blue","fo":{"sprite":"f22","w":256,"h":256,"altitude":480,"durationMs":950,"delayMs":60,"trailCount":7},"L":[{"s":"flash","l":700,"s0":260,"s1":240,"o0":0.75,"o1":0.9,"_d":{"fromZ":800,"toZ":null,"ease":"easeIn"}},{"s":"nuclear-missile","l":700,"w0":128,"w1":128,"h0":128,"h1":128,"o1":1,"sr":225,"_d":{"fromZ":780,"toZ":null,"ease":"easeIn","trail":{"sprite":"smoke","rateMs":18,"jitter":12,"msRange":[400,650],"sizeRange":[14,22]}}},{"s":"meteor","l":700,"z":-2,"s0":140,"s1":110,"o0":0.5,"o1":0.75,"_d":{"fromZ":785,"toZ":null,"ease":"easeIn","trail":{"sprite":"explosion-orange","rateMs":28,"jitter":16,"msRange":[300,550],"sizeRange":[12,20]}}}]},"raceSpectralPassage_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":200},"raceVoidStep_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":200},"raceMistForm_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":220},"raceCryptidVanish_teleport":{"de":"racePhaseWalk_disperse","ae":"racePhaseWalk_arrive","adm":220},"raceCorpseCrawl_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":220},"raceDeepDive_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":220},"raceEject_teleport":{"de":"teleport_disperse","ae":"teleport_arrive","adm":220},"raceShadowInfiltration_teleport":{"de":"raceShadowStep_disperse","ae":"raceShadowStep_arrive","adm":200},"_rockThrow_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26,"o0":0.9},{"n":8,"s":"rock-debris","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[60,180],"g":340,"dr":1.3,"s0":[5,12],"s1":2},{"n":2,"s":"debris","l":[350,600],"z":2,"o":8,"vx":90,"vy":90,"vz":[50,130],"g":360,"dr":1.1,"s0":[7,12],"s1":3,"o0":0.85},{"a":"floor","m":"world","s":"dust-puff","l":900,"z":1,"s0":55,"s1":140,"o0":0.55}]},"raceJurassicJaw_impact":{"sk":"hard","L":[{"s":"flash","l":180,"z":10,"s0":110,"s1":28},{"n":8,"s":"blood-fleck","l":[300,600],"z":4,"o":8,"vx":140,"vy":140,"vz":[50,160],"g":60,"dr":1.2,"s0":[5,10],"s1":1},{"n":3,"s":"steel-spark","l":[250,450],"z":6,"o":6,"vx":120,"vy":120,"vz":[40,120],"g":300,"dr":1.5,"s0":[4,8],"s1":1}]},"_slashMelee_impact":{"sk":"normal","L":[{"s":"flash","l":180,"z":10,"s0":90,"s1":24,"o0":0.9},{"n":6,"s":"steel-spark","l":[250,500],"z":6,"o":8,"vx":130,"vy":130,"vz":[40,140],"g":300,"dr":1.5,"s0":[4,8],"s1":1},{"n":4,"s":"blood-fleck","l":[350,600],"z":2,"o":6,"vx":100,"vy":100,"vz":[30,110],"g":60,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.9}]},"_heavyPunch_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":110,"s1":30},{"s":"shockwave","l":400,"z":4,"s0":80,"s1":200,"o0":0.7},{"n":6,"s":"steel-spark","l":[250,500],"z":6,"o":8,"vx":150,"vy":150,"vz":[40,140],"g":320,"dr":1.4,"s0":[4,9],"s1":1},{"n":2,"a":"floor","s":"dust-puff","l":[500,700],"z":2,"o":8,"vx":80,"vy":80,"vz":[20,50],"g":100,"dr":1,"s0":[10,16],"s1":[24,36],"o0":0.45}]},"raceTaserBolt_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.9},{"n":6,"s":"spark-elec","l":[250,500],"z":6,"o":8,"vx":120,"vy":120,"vz":[30,100],"g":200,"dr":1.5,"s0":[4,8],"s1":1},{"s":"spark-blue","l":350,"z":4,"s0":60,"s1":20,"o0":0.7}]},"raceRecursiveLoop_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":80,"s1":22,"o0":0.85},{"s":"plasma","l":380,"z":6,"s0":80,"s1":30,"o0":0.85},{"n":5,"s":"spark-elec","l":[300,550],"z":4,"o":6,"vx":100,"vy":100,"vz":[30,100],"g":180,"dr":1.4,"s0":[4,8],"s1":1,"o0":0.9}]},"raceDarkJustice_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26},{"n":6,"s":"dark-flame","l":[300,550],"z":4,"o":8,"vx":130,"vy":130,"vz":[40,130],"g":60,"dr":1.2,"s0":[5,10],"s1":1,"o0":0.9},{"n":4,"s":"steel-spark","l":[250,500],"z":6,"o":6,"vx":110,"vy":110,"vz":[30,100],"g":280,"dr":1.5,"s0":[4,8],"s1":1}]},"raceAmbushLunge_impact":{"sk":"hard","L":[{"s":"flash","l":180,"z":10,"s0":100,"s1":26},{"n":5,"s":"blood-fleck","l":[300,550],"z":4,"o":6,"vx":120,"vy":120,"vz":[40,140],"g":60,"dr":1.2,"s0":[5,9],"s1":1},{"n":4,"s":"steel-spark","l":[250,500],"z":6,"o":6,"vx":110,"vy":110,"vz":[30,100],"g":280,"dr":1.5,"s0":[3,7],"s1":1,"o0":0.9}]},"raceStonefall_impact":{"sk":"hard","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26,"o0":0.9},{"n":7,"s":"rock-debris","l":[300,600],"z":4,"o":8,"vx":130,"vy":130,"vz":[50,160],"g":330,"dr":1.3,"s0":[5,11],"s1":2},{"a":"floor","m":"world","s":"dust-puff","l":850,"z":1,"s0":50,"s1":130,"o0":0.55}]},"raceMjolnirsEcho_impact":{"sk":"hard","L":[{"s":"flash","l":220,"z":10,"s0":110,"s1":28},{"s":"lightning","l":300,"z":8,"s0":80,"s1":30,"o0":0.9},{"n":6,"s":"spark-elec","l":[250,500],"z":6,"o":8,"vx":140,"vy":140,"vz":[40,130],"g":240,"dr":1.4,"s0":[4,9],"s1":1},{"n":3,"s":"steel-spark","l":[300,500],"z":4,"o":6,"vx":100,"vy":100,"vz":[30,90],"g":300,"dr":1.5,"s0":[3,7],"s1":1,"o0":0.9}]},"racePhotonScatter_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":24,"o0":0.9},{"s":"holy-light","l":350,"z":6,"s0":70,"s1":26,"o0":0.85},{"n":5,"s":"divine-sparkle","l":[300,550],"z":4,"o":6,"vx":120,"vy":120,"vz":[40,120],"g":200,"dr":1.3,"s0":[4,8],"s1":1}]},"raceDragonfear_impact":{"sk":"normal","L":[{"s":"dark-flame","l":350,"z":6,"s0":70,"s1":25,"o0":0.85},{"n":4,"s":"ember","l":[300,550],"z":4,"o":6,"vx":100,"vy":100,"vz":[40,120],"g":260,"dr":1.4,"s0":[4,8],"s1":1,"o0":0.9},{"d":50,"m":"y-locked","s":"void-mist","l":600,"o":10,"vz":[15,35],"dr":0.5,"s0":20,"s1":50,"o0":0.4}]},"raceDrainingEmbrace_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":100,"s1":26},{"n":6,"s":"dark-flame","l":[300,600],"z":4,"o":8,"vx":100,"vy":100,"vz":[40,130],"g":60,"dr":1.2,"s0":[5,10],"s1":1,"o0":0.9},{"n":4,"s":"blood-fleck","l":[350,600],"z":2,"o":6,"vx":80,"vy":80,"vz":[30,100],"g":60,"dr":1.3,"s0":[4,8],"s1":1,"o0":0.9}]},"raceGhoulishBite_impact":{"sk":"normal","L":[{"s":"flash","l":180,"z":10,"s0":85,"s1":22,"o0":0.85},{"n":5,"s":"blood-fleck","l":[300,550],"z":4,"o":6,"vx":110,"vy":110,"vz":[40,130],"g":60,"dr":1.2,"s0":[4,9],"s1":1},{"n":3,"s":"poison-bubble","l":[400,650],"z":2,"o":8,"vx":50,"vy":50,"vz":[20,60],"g":140,"dr":1,"s0":[4,8],"s1":2,"o0":0.7}]},"raceKissOfDecay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"z":10,"s0":90,"s1":24,"o0":0.9},{"n":5,"s":"dark-flame","l":[300,550],"z":4,"o":6,"vx":90,"vy":90,"vz":[30,110],"g":60,"dr":1.2,"s0":[5,9],"s1":1,"o0":0.85},{"n":4,"s":"poison-bubble","l":[350,600],"z":2,"o":8,"vx":60,"vy":60,"vz":[20,70],"g":140,"dr":1,"s0":[4,8],"s1":2,"o0":0.75}]},"_buff_unholy_aura":{"ar":0,"ice":"_buff_unholy_burst_center"},"_buff_divine_aura":{"ar":0,"ice":"_buff_div_burst_center"},"_buff_tech_aura":{"ar":0,"ice":"_buff_tech_burst_center"},"_buff_anomaly_aura":{"ar":0,"ice":"_buff_anomaly_burst_center"},"_buff_human_aura":{"ar":0,"ice":"_buff_human_burst_center"},"_selfHeal_unholy_aura":{"ar":0,"ice":"_selfHeal_unholy_burst_center"},"_selfHeal_unholy_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":180,"o0":0.75},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.8},{"d":30,"s":"dark-flame","l":400,"z":4,"s0":90,"s1":30,"o0":0.5},{"s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":6,"s":"blood-fleck","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[50,140],"g":60,"dr":1.2,"s0":[4,8],"s1":1,"o0":0.8}]},"_selfHeal_tech_aura":{"ar":0,"ice":"_selfHeal_tech_burst_center"},"_selfHeal_tech_burst_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":60,"s1":180,"o0":0.75},{"s":"heal-glow","l":550,"z":4,"s0":120,"s1":40,"o0":0.8},{"d":30,"s":"spark-blue","l":400,"z":4,"s0":90,"s1":30,"o0":0.6},{"s":"flash","l":200,"z":10,"s0":80,"s1":20,"o0":0.85},{"n":5,"s":"spark-elec","l":[400,700],"o":8,"vx":70,"vy":70,"vz":[40,110],"g":180,"dr":1.3,"s0":[4,7],"s1":1,"o0":0.85}]},"raceTinfoilFortress_aura":{"ar":0,"ice":"_aoeShield_tech_burst_tile"},"raceTinkersContraption_aura":{"ar":0,"ice":"_aoeShield_tech_burst_tile"},"raceSwarmSignal_aura":{"ar":0,"ice":"_warCry_burst_tile"},"_zoneDebuff_ice_aura":{"ar":1,"sh":"square","ice":"_ice_impact_center","ite":"_ice_impact_tile"},"_zoneDebuff_dark_aura":{"ar":1,"sh":"square","ice":"raceDarkDominion_impact_tile"},"_zoneDebuff_smoke_aura":{"ar":1,"sh":"square","ice":"raceDeadAir_burst_center"},"_zoneHeal_water_aura":{"ar":1,"sh":"square","ice":"raceTidalBlessing_burst_tile"},"_zoneHeal_nature_aura":{"ar":1,"sh":"square","ice":"raceSanctuary_burst_tile"},"_deployTurret_generic_aura":{"ar":0,"ice":"deployTurret_burst_center"},"_deployObject_aura":{"ar":0,"ice":"_deployObject_burst"},"_deployObject_burst":{"L":[{"a":"floor","s":"flash","l":180,"z":8,"s0":60,"s1":18,"o0":0.7},{"a":"floor","m":"world","s":"dust-puff","l":600,"z":2,"s0":40,"s1":90,"o0":0.45},{"n":4,"a":"floor","s":"smoke","l":[300,550],"z":4,"o":10,"vx":50,"vy":50,"vz":[30,80],"g":120,"dr":1.2,"s0":[6,10],"s1":[14,22],"o0":0.4}]},"racePsychicBarrier_aura":{"ar":0,"ice":"racePsychicBarrier_burst"},"racePsychicBarrier_burst":{"L":[{"s":"psi-pulse","l":350,"z":10,"s0":110,"s1":30,"o0":0.9},{"a":"floor","m":"world","s":"target-ring","l":700,"z":2,"s0":40,"s1":120,"o0":0.7},{"n":3,"d":50,"s":"spark-pink","l":[250,450],"z":6,"o":8,"vx":60,"vy":60,"vz":[20,60],"g":80,"dr":1.5,"s0":[4,7],"s1":1,"o0":0.85}]},"raceShieldWall_aura":{"ar":0,"ice":"raceShieldWall_burst"},"raceShieldWall_burst":{"L":[{"s":"flash","l":300,"z":8,"s0":80,"s1":20,"o0":0.8},{"a":"floor","m":"world","s":"target-ring","l":600,"z":2,"s0":50,"s1":100,"o0":0.6}]},"raceMushroomRing_aura":{"ar":1,"ice":"raceMushroomRing_burst"},"raceMushroomRing_burst":{"L":[{"a":"floor","s":"flash","l":300,"z":6,"s0":100,"s1":30,"o0":0.6},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":2,"s0":60,"s1":200,"o0":0.7},{"n":6,"d":80,"a":"floor","s":"sparkle","l":[400,700],"z":4,"o":12,"vx":40,"vy":40,"vz":[15,45],"g":30,"dr":0.8,"s0":[4,8],"s1":2,"o0":0.8}]},"raceContainmentField_tile":{"sk":"soft","L":[{"a":"floor","s":"flash","l":250,"z":10,"s0":80,"s1":20,"o0":0.85},{"a":"floor","m":"y-locked","s":"plasma","l":600,"w0":40,"w1":20,"h0":80,"h1":120,"o0":0.7},{"n":4,"d":30,"a":"floor","s":"spark-blue","l":[200,400],"z":8,"o":6,"vx":80,"vy":80,"vz":[30,80],"g":150,"dr":1.4,"s0":[3,6],"s1":1,"o0":0.9}]},"_turretBlast_beam":{"cm":140,"bs":"laser-red","bt":13,"bhs":"flash","bm":300,"ite":"_turretBlast_impact","ice":null,"ls":false,"sk":null},"_turretBlast_impact":{"L":[{"s":"flash","l":200,"s0":64,"s1":14,"o0":0.95},{"n":8,"s":"laser-red","l":[240,420],"z":4,"o":6,"vx":140,"vy":140,"vz":[40,160],"g":240,"dr":1.5,"w0":[14,22],"w1":[5,9],"h0":3,"h1":1},{"n":5,"s":"ember","l":[240,420],"z":6,"o":5,"vx":120,"vy":120,"vz":[50,150],"g":320,"dr":1.5,"s0":[5,9],"s1":1}]},"_heal_burst":{"L":[{"n":24,"a":"floor","s":"heal-cross","l":[500,900],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"n":18,"d":300,"a":"floor","s":"heal-cross","l":[400,700],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.7},{"d":350,"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.6},{"d":700,"a":"floor","m":"world","s":"target-ring-green","l":400,"z":2,"s0":20,"s1":100,"o0":0.5},{"a":"floor","m":"world","s":"heal-cross","l":1200,"z":1,"s0":80,"s1":100,"o0":0.4}]},"_mana_burst":{"L":[{"n":24,"a":"floor","s":"spark-blue","l":[500,900],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"n":18,"d":300,"a":"floor","s":"spark-blue","l":[400,700],"o":18,"vx":10,"vy":10,"vz":[50,90],"dr":0.4,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.7},{"d":350,"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.6},{"d":700,"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":20,"s1":100,"o0":0.5},{"a":"floor","m":"world","s":"spark-blue","l":1200,"z":1,"s0":80,"s1":100,"o0":0.4}]},"_buff_burst":{"L":[{"s":"flash","l":180,"s0":64,"s1":20},{"n":15,"s":"divine-sparkle","l":[300,500],"o":6,"vx":10,"vy":10,"vz":[80,140],"dr":0.4,"s0":[5,8],"s1":2,"o0":0.9},{"n":20,"a":"floor","s":"divine-sparkle","l":[600,1000],"o":26,"z":[5,40],"vx":40,"vy":40,"vz":[-10,15],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.7},{"a":"floor","m":"world","s":"target-ring-gold","l":500,"z":2,"s0":24,"s1":90,"o0":0.7}]},"_status_poison":{"L":[{"n":16,"m":"y-locked","s":"smoke","l":[600,1000],"o":16,"vz":[20,45],"dr":0.3,"s0":[18,32],"s1":50,"o0":0.6,"tR":0.2,"tG":0.85,"tB":0.35},{"n":20,"s":"ember","l":[300,600],"o":8,"vx":60,"vy":60,"vz":[-20,40],"g":-80,"dr":1.2,"s0":[7,12],"s1":2,"o0":0.8,"tR":0.3,"tG":0.9,"tB":0.4},{"a":"floor","m":"world","s":"target-ring-green","l":800,"z":1,"s0":40,"s1":80,"o0":0.5}]},"_status_burn":{"L":[{"n":14,"s":"ember","l":[400,800],"o":14,"vx":30,"vy":30,"vz":[15,50],"g":-120,"dr":0.8,"s0":[4,8],"s1":1,"o0":0.8},{"n":4,"m":"y-locked","s":"flame","l":[350,600],"o":10,"z":[-5,5],"w0":[8,14],"w1":[4,8],"h0":[14,22],"h1":[30,50],"o0":0.9},{"n":3,"d":200,"m":"y-locked","s":"smoke","l":[700,1100],"o":12,"z":10,"vz":[20,40],"dr":0.3,"s0":[20,34],"s1":55,"o0":0.5}]},"_status_stun":{"L":[{"s":"flash","l":150,"s0":40,"s1":12},{"n":18,"s":"spark-elec","l":[250,500],"o":20,"z":[0,6],"vx":40,"vy":40,"vz":[-5,10],"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85},{"a":"floor","m":"world","s":"stun-ring","l":350,"z":35,"s0":10,"s1":70,"o0":0.8}]},"_status_slow":{"L":[{"n":15,"s":"spark-blue","l":[350,650],"o":18,"z":[5,20],"vx":10,"vy":10,"vz":[-60,-30],"g":200,"dr":0.4,"s0":[4,8],"s1":1,"o0":0.8},{"a":"floor","m":"world","s":"target-ring-blue","l":400,"z":2,"s0":100,"s1":20,"o0":0.6},{"n":15,"s":"spark-blue","l":[250,450],"o":24,"vx":-50,"vy":-50,"vz":[-10,30],"dr":1.2,"s0":[5,9],"s1":2,"o0":0.7}]},"_status_bleed":{"L":[{"n":12,"s":"blood-fleck","l":[300,600],"o":6,"vx":80,"vy":80,"vz":[-20,20],"g":300,"dr":1,"s0":[5,10],"s1":2,"o0":0.9},{"n":8,"d":100,"s":"blood-fleck","l":[400,800],"o":12,"vx":15,"vy":15,"vz":[-5,10],"g":400,"dr":0.4,"s0":[4,8],"s1":2,"o0":0.8}]},"_status_silence":{"L":[{"n":24,"s":"psi-pulse","l":[200,350],"o":40,"vx":-100,"vy":-100,"vz":[-10,10],"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85},{"d":100,"s":"flash","l":160,"s0":48,"s1":14,"o0":0.8},{"n":6,"d":200,"s":"psi-pulse","l":[400,700],"o":10,"vx":15,"vy":15,"vz":[-8,8],"dr":0.5,"s0":[4,7],"s1":2,"o0":0.5}]},"_levelUp_burst":{"L":[{"s":"flash","l":140,"s0":80,"s1":24},{"n":35,"a":"floor","s":"divine-sparkle","l":[500,900],"o":12,"vx":10,"vy":10,"vz":[100,180],"dr":0.4,"g":-150,"s0":[6,10],"s1":2,"o0":0.9},{"n":25,"d":200,"a":"floor","s":"divine-sparkle","l":[400,700],"o":20,"vx":20,"vy":20,"vz":[60,120],"dr":0.5,"s0":[4,7],"s1":1,"o0":0.7},{"d":100,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.8},{"d":350,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.65},{"d":550,"a":"floor","m":"world","s":"target-ring-gold","l":350,"z":2,"s0":16,"s1":120,"o0":0.5},{"n":16,"d":300,"a":"floor","s":"divine-sparkle","l":[600,1200],"o":28,"z":[10,50],"vx":35,"vy":35,"vz":[-5,10],"dr":0.4,"s0":[5,9],"s1":2,"o0":0.7},{"a":"floor","m":"world","s":"target-ring-gold","l":1600,"z":1,"s0":100,"s1":120,"o0":0.35}]},"_blood_normal":{"L":[{"n":6,"s":"blood-fleck","l":[250,450],"o":4,"vx":80,"vy":80,"vz":[-20,40],"g":180,"dr":0.6,"s0":[4,8],"s1":2,"o0":0.9}]},"_blood_critical":{"L":[{"n":14,"s":"blood-fleck","l":[300,600],"o":6,"vx":120,"vy":120,"vz":[-30,60],"g":200,"dr":0.5,"s0":[5,11],"s1":2,"o0":0.95},{"n":3,"s":"blood-mist","l":[400,700],"o":6,"vx":20,"vy":20,"vz":[5,25],"dr":1,"s0":[18,28],"s1":40,"o0":0.5},{"n":4,"d":60,"s":"blood-fleck","l":[400,700],"o":8,"vx":50,"vy":50,"vz":[30,70],"g":300,"dr":0.3,"s0":[3,6],"s1":1,"o0":0.85}]},"_blood_super_effective":{"L":[{"n":18,"s":"blood-fleck","l":[300,650],"o":8,"vx":150,"vy":150,"vz":[-40,80],"g":200,"dr":0.45,"s0":[5,12],"s1":2,"o0":0.95},{"n":4,"s":"blood-mist","l":[450,800],"o":10,"vx":30,"vy":30,"vz":[10,30],"dr":0.8,"s0":[22,36],"s1":50,"o0":0.55},{"d":80,"a":"floor","m":"world","s":"blood-splat","l":1400,"z":1,"s0":40,"s1":60,"o0":0.6},{"n":6,"d":40,"s":"blood-fleck","l":[500,800],"o":6,"vx":70,"vy":70,"vz":[40,90],"g":300,"dr":0.3,"s0":[3,7],"s1":1,"o0":0.85}]},"_blood_killing_blow":{"L":[{"n":24,"s":"blood-fleck","l":[350,750],"o":10,"vx":200,"vy":200,"vz":[-50,100],"g":220,"dr":0.4,"s0":[6,14],"s1":2},{"n":5,"s":"blood-mist","l":[500,900],"o":12,"vx":35,"vy":35,"vz":[10,40],"dr":0.7,"s0":[28,44],"s1":60,"o0":0.6},{"d":60,"a":"floor","m":"world","s":"blood-splat","l":2000,"z":1,"s0":50,"s1":80,"o0":0.7},{"n":10,"d":30,"s":"blood-fleck","l":[600,1000],"o":8,"vx":90,"vy":90,"vz":[60,130],"g":320,"dr":0.25,"s0":[3,8],"s1":1,"o0":0.9},{"n":10,"d":200,"s":"blood-fleck","l":[300,550],"o":14,"vx":160,"vy":160,"vz":[-20,50],"g":250,"dr":0.5,"s0":[4,10],"s1":2,"o0":0.8},{"d":300,"a":"floor","m":"world","s":"blood-splat","l":1800,"z":1,"s0":30,"s1":50,"o0":0.5}]},"_blood_resist":{"L":[{"n":3,"s":"blood-fleck","l":[200,350],"o":3,"vx":50,"vy":50,"vz":[-10,25],"g":150,"dr":0.8,"s0":[3,6],"s1":1,"o0":0.7}]},"_death_burst":{"L":[{"s":"flash","l":160,"s0":56,"s1":18,"o0":0.7},{"n":40,"s":"debris","l":[400,900],"o":8,"vx":160,"vy":160,"vz":[-30,80],"g":200,"dr":0.8,"s0":[5,10],"s1":2,"o0":0.8},{"n":4,"d":50,"m":"y-locked","s":"smoke","l":[800,1200],"o":14,"vz":[15,35],"dr":0.3,"s0":[28,44],"s1":70,"o0":0.5},{"a":"floor","m":"world","s":"scorch","l":1200,"z":1,"s0":70,"s1":90,"o0":0.5}]},"_dash_burst":{"L":[{"n":12,"a":"floor","s":"flash","l":[200,400],"o":8,"z":[5,25],"vx":40,"vy":40,"vz":[-5,15],"dr":2,"s0":[4,8],"s1":1,"o0":0.7},{"n":6,"a":"floor","m":"y-locked","s":"dust-puff","l":[400,700],"o":12,"vz":[8,20],"dr":0.5,"s0":[16,28],"s1":44,"o0":0.5}]},"_teleport_vanish":{"L":[{"n":18,"s":"spark-elec","l":[200,350],"o":36,"vx":-120,"vy":-120,"vz":[-10,10],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.8},{"d":150,"s":"flash","l":120,"s0":60,"s1":16}]},"_teleport_arrive":{"L":[{"n":18,"s":"spark-elec","l":[250,450],"o":6,"vx":120,"vy":120,"vz":[10,50],"dr":1,"s0":[5,9],"s1":2,"o0":0.8},{"a":"floor","m":"world","s":"shockwave","l":350,"z":2,"s0":16,"s1":90,"o0":0.7},{"s":"flash","l":160,"s0":50,"s1":16,"o0":0.9}]},"_zone_debuff_cast":{"L":[{"n":8,"a":"floor","s":"flash","l":[120,180],"o":6,"z":[2,12],"s0":[20,36],"s1":6,"o0":0.85},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":20,"s1":200,"o0":0.6},{"n":20,"a":"floor","s":"psi-pulse","l":[350,700],"o":40,"z":[15,40],"vx":20,"vy":20,"vz":[-30,15],"g":80,"dr":0.5,"s0":[4,8],"s1":1,"o0":0.65}]},"_zone_heal_cast":{"L":[{"n":8,"a":"floor","s":"flash","l":[120,180],"o":6,"z":[2,12],"s0":[20,36],"s1":6,"o0":0.85},{"a":"floor","m":"world","s":"target-ring-green","l":500,"z":2,"s0":20,"s1":200,"o0":0.6},{"n":20,"a":"floor","s":"heal-cross","l":[350,700],"o":40,"vx":15,"vy":15,"vz":[30,70],"dr":0.5,"s0":[5,9],"s1":2,"o0":0.7}]},"_combo_explosion":{"sk":"hard","L":[{"s":"flash","l":300,"s0":120,"s1":36},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":260,"o0":0.8},{"n":40,"s":"ember","l":[400,800],"o":10,"vx":200,"vy":200,"vz":[40,200],"g":300,"dr":1.2,"s0":[8,16],"s1":2},{"n":6,"d":150,"m":"y-locked","s":"smoke","l":[800,1400],"o":24,"vz":[20,50],"dr":0.3,"s0":[40,64],"s1":110,"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":120,"s1":150,"o0":0.7}]},"raceStunRay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20},{"n":14,"s":"spark-elec","l":[300,550],"o":8,"vx":170,"vy":170,"vz":[40,160],"g":240,"dr":1.5,"s0":[8,14],"s1":1},{"n":3,"d":20,"s":"stun-ring","l":[500,800],"z":15,"o":6,"s0":[20,35],"s1":[50,70],"o0":0.8},{"n":5,"d":30,"s":"plasma","l":[250,450],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":180,"dr":1.2,"s0":[6,10],"s1":1,"o0":0.9}]},"raceSpaceDisco_aoe":{"ar":2,"ite":"raceSpaceDisco_impact_tile","ice":"raceSpaceDisco_impact_center","sk":"normal"},"raceSpaceDisco_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":10,"s0":50,"s1":15},{"n":8,"a":"floor","s":"spark-pink","l":[250,500],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":200,"dr":1.3,"s0":[6,12],"s1":1}]},"raceSpaceDisco_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":260,"o0":0.9},{"n":12,"s":"laser-pink","l":[300,600],"z":8,"o":10,"vx":200,"vy":200,"vz":[50,180],"g":160,"dr":1.2,"s0":[8,16],"s1":1}]},"racePlasmaWhip_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"laser-pink","l":[280,500],"o":7,"vx":160,"vy":160,"vz":[40,140],"g":200,"dr":1.4,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"ember","l":[350,600],"o":5,"vx":100,"vy":100,"vz":[30,100],"g":60,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceCorrosiveSplash_aoe":{"ar":1,"ite":"raceCorrosiveSplash_impact_tile","ice":"raceCorrosiveSplash_impact_center","sk":"normal"},"raceCorrosiveSplash_impact_tile":{"L":[{"n":3,"a":"floor","s":"inkblot","l":[400,700],"o":8,"vx":80,"vy":80,"vz":[20,80],"g":400,"dr":1.5,"s0":[16,28],"s1":[8,14],"o0":0.9},{"n":5,"a":"floor","s":"acid-green","l":[250,500],"z":3,"o":6,"vx":100,"vy":100,"vz":[20,80],"g":300,"dr":1.4,"s0":[6,12],"s1":1},{"n":3,"d":40,"a":"floor","s":"poison-bubble","l":[500,800],"o":5,"vz":[15,40],"g":20,"dr":0.6,"s0":[8,14],"s1":[18,28],"o0":0.7}]},"raceCorrosiveSplash_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":80,"s1":140,"o0":0.7},{"n":6,"s":"inkblot","l":[300,600],"z":5,"o":12,"vx":160,"vy":160,"vz":[40,140],"g":350,"dr":1.3,"s0":[20,36],"s1":[10,18],"o0":0.95},{"n":8,"d":10,"s":"acid-green","l":[300,550],"z":3,"o":10,"vx":180,"vy":180,"vz":[40,160],"g":240,"dr":1.4,"s0":[8,14],"s1":1}]},"raceAbsorb_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"inkblot","l":[350,650],"o":8,"vx":120,"vy":120,"vz":[20,100],"g":280,"dr":1.4,"s0":[14,24],"s1":[6,12],"o0":0.9},{"n":6,"d":20,"s":"dark-flame","l":[300,550],"z":5,"o":6,"vx":80,"vy":80,"vz":[30,100],"g":60,"dr":0.8,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":4,"d":50,"s":"heal-glow","l":[400,700],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[6,10],"s1":1,"o0":0.8}]},"raceMitosisSplit_aura":{"ar":0,"ice":"raceMitosisSplit_burst","ps":"dark-flame","pm":450,"ph":160,"pw0":50,"pw1":80,"ph1":200,"po0":0.7},"raceMitosisSplit_burst":{"L":[{"n":10,"s":"inkblot","l":[350,650],"o":10,"vx":200,"vy":200,"vz":[40,160],"g":350,"dr":2,"s0":[18,32],"s1":[8,14],"o0":0.9},{"n":6,"d":30,"s":"acid-green","l":[300,500],"z":5,"o":6,"vx":100,"vy":100,"vz":[20,80],"g":100,"dr":1,"s0":[6,10],"s1":1,"o0":0.8}]},"raceToxicNova_aoe":{"ar":2,"ite":"raceToxicNova_impact_tile","ice":"raceToxicNova_impact_center","sk":"hard"},"raceToxicNova_impact_tile":{"L":[{"n":4,"a":"floor","s":"inkblot","l":[300,600],"o":6,"vx":80,"vy":80,"vz":[15,60],"g":350,"dr":1.5,"s0":[14,24],"s1":[6,12],"o0":0.85},{"n":6,"d":10,"a":"floor","s":"poison-bubble","l":[400,700],"z":3,"o":5,"vz":[20,60],"g":40,"dr":0.6,"s0":[6,12],"s1":[16,24],"o0":0.7}]},"raceToxicNova_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":300,"o0":0.8},{"n":10,"s":"inkblot","l":[300,600],"z":5,"o":15,"vx":220,"vy":220,"vz":[50,180],"g":300,"dr":1.3,"s0":[22,40],"s1":[10,20],"o0":0.95}]},"raceQuake_aoe":{"ar":2,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceQuake_impact_tile":{"L":[{"n":3,"a":"floor","s":"rock-debris","l":[300,550],"o":6,"vx":120,"vy":120,"vz":[40,140],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.95},{"n":2,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":5,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.6}]},"raceQuake_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":280,"o0":0.85},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":80,"s1":150,"o0":0.7},{"n":8,"a":"floor","s":"rock-debris","l":[300,600],"z":5,"o":12,"vx":200,"vy":200,"vz":[60,200],"g":500,"dr":1.3,"s0":[10,18],"s1":1,"o0":0.95}]},"raceRamCharge_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":90,"s1":22},{"n":8,"a":"floor","s":"smoke","l":[350,650],"o":10,"vx":160,"vy":160,"vz":[20,80],"g":20,"dr":0.6,"s0":[14,24],"s1":[35,55],"o0":0.6},{"n":6,"d":10,"s":"steel-spark","l":[250,450],"o":6,"vx":180,"vy":180,"vz":[40,160],"g":350,"dr":1.6,"w0":[10,18],"w1":[4,8],"h0":3,"h1":1},{"n":4,"d":20,"a":"floor","s":"debris","l":[400,650],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.95}]},"raceExhaustCloud_aura":{"ar":1,"ice":"raceExhaustCloud_burst","ps":"smoke","pm":500,"ph":140,"pw0":60,"pw1":100,"ph1":180,"po0":0.5},"raceExhaustCloud_burst":{"L":[{"n":10,"a":"floor","s":"smoke","l":[300,600],"o":12,"vx":100,"vy":100,"vz":[15,50],"g":10,"dr":0.5,"s0":[16,28],"s1":[40,65],"o0":0.5},{"n":4,"d":20,"a":"floor","s":"spark-elec","l":[250,450],"z":5,"o":6,"vx":80,"vy":80,"vz":[20,60],"g":200,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceRoboPunch_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":80,"s1":20},{"n":10,"s":"steel-spark","l":[250,500],"o":7,"vx":180,"vy":180,"vz":[50,180],"g":350,"dr":1.6,"w0":[10,20],"w1":[4,8],"h0":3,"h1":1},{"n":3,"d":20,"s":"debris","l":[350,600],"o":5,"vx":130,"vy":130,"vz":[40,130],"g":500,"dr":1.4,"s0":[6,10],"s1":1,"o0":0.9}]},"raceMissileBarrage_aoe":{"ar":1,"ite":"raceMissileBarrage_impact_tile","ice":"raceMissileBarrage_impact_center","sk":"hard"},"raceMissileBarrage_impact_tile":{"L":[{"a":"floor","s":"explosion-orange","l":350,"z":5,"s0":45,"s1":15},{"n":4,"a":"floor","s":"steel-spark","l":[200,400],"z":3,"o":5,"vx":140,"vy":140,"vz":[40,130],"g":350,"dr":1.5,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":2,"d":20,"a":"floor","s":"smoke","l":[350,600],"o":5,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.5}]},"raceMissileBarrage_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":240,"o0":0.9},{"s":"explosion-orange","l":400,"z":10,"s0":80,"s1":30}]},"raceIceSpear_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":12,"s":"ice-shard","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":250,"dr":1.5,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"frost-mist","l":[350,600],"z":5,"o":6,"vz":[10,40],"dr":0.6,"s0":[12,20],"s1":[25,40],"o0":0.6}]},"raceDiamondDust_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"raceDiamondDust_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":250,"o0":0.85},{"n":14,"s":"ice-shard","l":[300,550],"z":8,"o":12,"vx":200,"vy":200,"vz":[60,200],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":8,"d":20,"s":"divine-sparkle","l":[400,700],"z":12,"o":10,"vz":[20,60],"dr":0.6,"s0":[5,10],"s1":1,"o0":0.9}]},"raceAbsoluteZero_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":100,"s1":25},{"n":18,"s":"ice-shard","l":[280,550],"o":10,"vx":220,"vy":220,"vz":[60,220],"g":200,"dr":1.3,"s0":[10,18],"s1":1},{"n":8,"d":10,"s":"frost-mist","l":[350,650],"z":8,"o":8,"vz":[10,40],"dr":0.5,"s0":[16,28],"s1":[35,55],"o0":0.6},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":200,"o0":0.8}]},"raceUnstoppableCharge_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":90,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":220,"o0":0.85},{"n":8,"a":"floor","s":"rock-debris","l":[300,550],"o":10,"vx":180,"vy":180,"vz":[50,180],"g":500,"dr":1.4,"s0":[8,16],"s1":1,"o0":0.95},{"n":5,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,40],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.5}]},"raceBrutalSlam_aoe":{"ar":1,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceKiBlast_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":200,"o0":0.9},{"s":"flash","l":280,"s0":130,"s1":32},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":22,"s":"holy-light","l":[400,800],"o":8,"vx":200,"vy":200,"vz":[60,220],"g":120,"dr":1.2,"s0":[10,18],"s1":2},{"n":10,"d":60,"s":"ember","l":[700,1200],"o":12,"z":6,"vx":40,"vy":40,"vz":[80,200],"g":-40,"dr":0.7,"s0":[7,13],"s1":1,"o0":0.9},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":60,"s1":100,"o0":0.6}]},"raceFlurryOfBlows_impact":{"L":[{"s":"flash","l":160,"s0":70,"s1":18},{"n":10,"s":"holy-light","l":[200,450],"o":6,"vx":180,"vy":180,"vz":[40,160],"g":250,"dr":1.5,"s0":[8,14],"s1":1},{"n":6,"s":"steel-spark","l":[180,380],"o":5,"vx":160,"vy":160,"vz":[30,120],"g":300,"dr":1.6,"s0":[5,10],"s1":1},{"n":4,"d":10,"s":"blood-fleck","l":[250,450],"o":4,"vx":100,"vy":100,"vz":[20,90],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceKiWave_beam":{"cm":350,"bs":"holy-light","bt":52,"bhs":"flash","bm":280,"ite":"raceKiWave_impact_tile","ls":true,"sk":"hard"},"raceKiWave_impact_tile":{"L":[{"a":"floor","s":"flash","l":200,"z":8,"s0":70,"s1":18},{"a":"floor","m":"world","s":"halo-ring","l":500,"z":2,"s0":30,"s1":120,"o0":0.7},{"n":12,"a":"floor","s":"holy-light","l":[300,600],"z":5,"o":8,"vx":160,"vy":160,"vz":[40,160],"g":180,"dr":1.3,"s0":[8,14],"s1":1},{"n":5,"d":30,"a":"floor","s":"ember","l":[500,800],"z":3,"o":5,"vx":40,"vy":40,"vz":[60,140],"g":-30,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.85}]},"raceDragonFist_impact":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":220,"o0":0.9},{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":220,"o0":0.85},{"s":"flash","l":300,"s0":140,"s1":36},{"n":20,"s":"holy-light","l":[400,800],"o":10,"vx":220,"vy":220,"vz":[60,240],"g":150,"dr":1.2,"s0":[10,18],"s1":2},{"n":8,"d":20,"s":"flame","l":[400,700],"o":10,"vx":60,"vy":60,"vz":[80,220],"g":-40,"dr":0.5,"s0":[10,18],"s1":[20,34],"o0":0.8},{"n":10,"d":60,"s":"ember","l":[700,1200],"o":12,"z":6,"vx":50,"vy":50,"vz":[100,260],"g":-40,"dr":0.5,"s0":[7,13],"s1":2,"o0":0.9},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":80,"s1":130,"o0":0.7}]},"raceExcaliburStrike_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":100,"s1":25},{"n":14,"s":"divine-sparkle","l":[280,520],"o":8,"vx":200,"vy":200,"vz":[50,180],"g":180,"dr":1.2,"s0":[8,16],"s1":1},{"n":6,"d":10,"s":"ember","l":[300,550],"z":5,"o":6,"vx":120,"vy":120,"vz":[30,100],"g":60,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9},{"s":"holy-pillar","l":600,"z":20,"s0":30,"s1":80,"o0":0.8}]},"raceHolyAvenger_cross":{"cm":300,"bs":"divine-sparkle","bt":36,"bhs":"flash","bm":350,"ite":"raceHolyAvenger_impact_tile","ls":false,"sk":"hard"},"raceHolyAvenger_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":8,"s0":50,"s1":15},{"n":8,"a":"floor","s":"divine-sparkle","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":180,"dr":1.2,"s0":[7,12],"s1":1}]},"raceChestPound_aoe":{"ar":1,"ite":"raceChestPound_impact_tile","ice":"raceChestPound_impact_center","sk":"normal"},"raceChestPound_impact_tile":{"L":[{"n":3,"a":"floor","s":"dust-puff","l":[300,550],"o":6,"vx":100,"vy":100,"vz":[15,50],"g":60,"dr":0.6,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceChestPound_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":220,"o0":0.8},{"n":6,"a":"floor","s":"rock-debris","l":[300,550],"z":5,"o":10,"vx":160,"vy":160,"vz":[40,160],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.9}]},"racePrimalSmash_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":90,"s1":22},{"n":6,"a":"floor","s":"rock-debris","l":[300,550],"o":8,"vx":160,"vy":160,"vz":[50,180],"g":500,"dr":1.4,"s0":[8,14],"s1":1,"o0":0.95},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":60,"s1":120,"o0":0.6},{"n":5,"d":20,"s":"blood-fleck","l":[350,600],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceGroundSlam_aoe":{"ar":2,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"raceBullRush_impact":{"sk":"hard","L":[{"s":"flash","l":220,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":35,"s1":200,"o0":0.8},{"n":6,"a":"floor","s":"dust-puff","l":[350,600],"o":8,"vx":140,"vy":140,"vz":[15,50],"g":40,"dr":0.5,"s0":[12,22],"s1":[30,50],"o0":0.5},{"n":5,"d":10,"s":"blood-fleck","l":[300,550],"o":6,"vx":140,"vy":140,"vz":[30,130],"g":420,"dr":1.5,"s0":[6,11],"s1":1}]},"raceGore_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"blood-fleck","l":[250,500],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":420,"dr":1.5,"s0":[7,13],"s1":1},{"n":3,"d":20,"s":"blood-mist","l":[350,600],"z":5,"o":6,"vz":[10,30],"dr":0.5,"s0":[12,20],"s1":[25,40],"o0":0.5},{"n":3,"d":10,"s":"poison-bubble","l":[400,650],"z":3,"o":4,"vz":[15,40],"g":30,"dr":0.6,"s0":[5,9],"s1":[12,18],"o0":0.7}]},"raceLabyrinthRoar_aoe":{"ar":2,"ite":"raceLabyrinthRoar_impact_tile","ice":"raceLabyrinthRoar_impact_center","sk":"normal"},"raceLabyrinthRoar_impact_tile":{"L":[{"n":2,"a":"floor","s":"dust-puff","l":[300,550],"o":5,"vx":80,"vy":80,"vz":[10,40],"g":40,"dr":0.5,"s0":[10,18],"s1":[25,40],"o0":0.5}]},"raceLabyrinthRoar_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":260,"o0":0.8},{"n":6,"s":"dark-flame","l":[300,550],"z":8,"o":10,"vx":150,"vy":150,"vz":[30,100],"g":40,"dr":0.6,"s0":[12,20],"s1":[25,40],"o0":0.6}]},"raceSoulDrain_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"dark-flame","l":[300,560],"o":8,"vx":140,"vy":140,"vz":[30,120],"g":40,"dr":0.7,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":6,"d":20,"s":"void-mist","l":[350,600],"z":5,"o":6,"vz":[15,50],"dr":0.5,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":4,"d":40,"s":"heal-glow","l":[500,800],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[5,9],"s1":1,"o0":0.7}]},"raceBoneBarrage_aoe":{"ar":1,"ite":"raceBoneBarrage_impact_tile","ice":"raceBoneBarrage_impact_center","sk":"normal"},"raceBoneBarrage_impact_tile":{"L":[{"n":4,"a":"floor","s":"debris","l":[250,500],"o":6,"vx":120,"vy":120,"vz":[40,140],"g":500,"dr":1.4,"s0":[6,12],"s1":1,"o0":0.9},{"n":2,"d":20,"a":"floor","s":"dark-flame","l":[350,550],"z":3,"o":4,"vz":[10,30],"dr":0.6,"s0":[8,14],"s1":[16,26],"o0":0.5}]},"raceBoneBarrage_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":35,"s1":220,"o0":0.7},{"s":"dark-flame","l":400,"z":15,"s0":40,"s1":80,"o0":0.7}]},"racePlaguefield_aura":{"ar":1,"ice":"racePlaguefield_burst","ps":"poison-bubble","pm":500,"ph":120,"pw0":50,"pw1":90,"ph1":160,"po0":0.6},"racePlaguefield_burst":{"L":[{"n":10,"a":"floor","s":"poison-bubble","l":[350,700],"o":12,"vx":100,"vy":100,"vz":[10,40],"g":20,"dr":0.5,"s0":[8,16],"s1":[20,35],"o0":0.6},{"n":6,"d":20,"a":"floor","s":"dark-flame","l":[300,550],"z":3,"o":10,"vz":[5,25],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.4}]},"raceDeathGaze_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":12,"s":"psi-pulse","l":[280,520],"o":8,"vx":170,"vy":170,"vz":[40,160],"g":180,"dr":1.3,"s0":[8,14],"s1":1},{"n":4,"d":20,"s":"void-mist","l":[350,600],"z":5,"o":6,"vz":[10,40],"dr":0.6,"s0":[10,18],"s1":[22,36],"o0":0.6}]},"racePsychicBeam_beam":{"cm":260,"bs":"psi-pulse","bt":34,"bhs":"flash","bm":300,"ite":"racePsychicBeam_impact_tile","ls":false,"sk":"normal"},"racePsychicBeam_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":8,"a":"floor","s":"psi-pulse","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":180,"dr":1.3,"s0":[7,12],"s1":1}]},"raceHailMary_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20},{"n":8,"s":"dust-puff","l":[300,550],"o":7,"vx":150,"vy":150,"vz":[30,120],"g":100,"dr":0.8,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":4,"d":10,"a":"floor","s":"debris","l":[250,450],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":450,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceBulletPass_beam":{"cm":200,"bs":"ember","bt":28,"bhs":"flash","bm":240,"ite":"raceBulletPass_impact_tile","ls":false,"sk":"normal"},"raceBulletPass_impact_tile":{"L":[{"a":"floor","s":"flash","l":140,"z":6,"s0":40,"s1":12},{"n":5,"a":"floor","s":"dust-puff","l":[200,400],"z":3,"o":5,"vx":100,"vy":100,"vz":[20,80],"g":80,"dr":0.7,"s0":[8,14],"s1":[18,28],"o0":0.5}]},"raceSpikeTheBall_aoe":{"ar":1,"ite":"raceQuake_impact_tile","ice":"raceQuake_impact_center","sk":"hard"},"racePrecisionShot_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":6,"s":"steel-spark","l":[220,420],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":300,"dr":1.5,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":5,"d":10,"s":"blood-fleck","l":[280,500],"o":4,"vx":100,"vy":100,"vz":[20,90],"g":420,"dr":1.5,"s0":[5,9],"s1":1}]},"raceArrowRain_aoe":{"ar":1,"ite":"raceArrowRain_impact_tile","ice":"raceArrowRain_impact_center","sk":"normal"},"raceArrowRain_impact_tile":{"L":[{"n":3,"a":"floor","s":"steel-spark","l":[200,400],"z":[20,60],"o":6,"vx":30,"vy":30,"vz":[-120,-60],"g":200,"dr":0.8,"w0":[8,14],"w1":[3,6],"h0":3,"h1":1},{"n":2,"d":40,"a":"floor","s":"dust-puff","l":[350,550],"o":4,"vz":[5,15],"dr":0.5,"s0":[8,14],"s1":[18,28],"o0":0.5}]},"raceArrowRain_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":200,"o0":0.6}]},"raceLumpOfCoal_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"ember","l":[280,500],"o":7,"vx":150,"vy":150,"vz":[30,120],"g":120,"dr":1,"s0":[7,12],"s1":1},{"n":4,"d":10,"a":"floor","s":"debris","l":[300,500],"o":5,"vx":120,"vy":120,"vz":[30,100],"g":500,"dr":1.4,"s0":[5,9],"s1":1,"o0":0.8}]},"raceBlizzardPresent_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"sharedSummonBlizzard_aoe":{"ar":1,"ite":"_ice_impact_tile","ice":"raceDiamondDust_impact_center","sk":"normal"},"sentaiRedSlash_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":10,"s":"ember","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":120,"dr":1,"s0":[8,14],"s1":1},{"n":4,"d":10,"s":"blood-fleck","l":[300,500],"o":5,"vx":110,"vy":110,"vz":[20,90],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"sentaiBlueWave_beam":{"cm":250,"bs":"wave-1","bt":34,"bhs":"flash","bm":300,"ite":"sentaiBlueWave_impact_tile","ls":false,"sk":"normal"},"sentaiBlueWave_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":8,"a":"floor","s":"wave-1","l":[250,450],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,120],"g":200,"dr":1.3,"s0":[7,12],"s1":1}]},"sentaiYellowThunder_aoe":{"ar":1,"ite":"sentaiYellowThunder_impact_tile","ice":"sentaiYellowThunder_impact_center","sk":"hard"},"sentaiYellowThunder_impact_tile":{"L":[{"a":"floor","s":"flash","l":160,"z":8,"s0":50,"s1":15},{"n":6,"a":"floor","s":"spark-elec","l":[250,450],"z":5,"o":6,"vx":140,"vy":140,"vz":[30,120],"g":240,"dr":1.5,"s0":[7,12],"s1":1}]},"sentaiYellowThunder_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":240,"o0":0.85},{"n":3,"s":"emp-arc","l":[300,500],"z":12,"o":10,"w0":[60,100],"w1":[30,60],"h0":6,"h1":1}]},"sentaiMegazordBlast_aoe":{"ar":2,"ite":"sentaiYellowThunder_impact_tile","ice":"sentaiMegazordBlast_impact_center","sk":"hard"},"sentaiMegazordBlast_impact_center":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":320,"o0":0.9},{"s":"explosion-orange","l":450,"z":15,"s0":100,"s1":35},{"n":10,"s":"spark-elec","l":[300,550],"z":8,"o":12,"vx":220,"vy":220,"vz":[60,200],"g":200,"dr":1.3,"s0":[8,16],"s1":1}]},"sentaiTeamStrike_impact":{"L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":4,"s":"spark-pink","l":[200,400],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":250,"dr":1.5,"s0":[6,10],"s1":1},{"n":4,"s":"spark-blue","l":[220,420],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":250,"dr":1.5,"s0":[6,10],"s1":1},{"n":3,"d":10,"s":"blood-fleck","l":[280,480],"o":4,"vx":100,"vy":100,"vz":[20,80],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceTendrilStrike_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":8,"s":"inkblot","l":[300,550],"o":8,"vx":160,"vy":160,"vz":[30,130],"g":300,"dr":1.4,"s0":[14,24],"s1":[6,12],"o0":0.9},{"n":4,"d":10,"s":"poison-bubble","l":[350,600],"z":3,"o":5,"vz":[15,40],"g":30,"dr":0.6,"s0":[5,9],"s1":[12,18],"o0":0.7},{"n":4,"d":20,"s":"blood-fleck","l":[280,500],"o":5,"vx":120,"vy":120,"vz":[20,90],"g":420,"dr":1.5,"s0":[5,9],"s1":1}]},"raceSymbioticDrain_impact":{"sk":"normal","L":[{"s":"flash","l":180,"s0":70,"s1":18},{"n":10,"s":"inkblot","l":[300,600],"o":8,"vx":130,"vy":130,"vz":[20,100],"g":280,"dr":1.4,"s0":[16,28],"s1":[6,12],"o0":0.9},{"n":4,"d":30,"s":"dark-flame","l":[350,580],"z":5,"o":6,"vz":[15,50],"dr":0.7,"s0":[8,14],"s1":[18,30],"o0":0.6},{"n":3,"d":50,"s":"heal-glow","l":[500,800],"z":10,"o":5,"vz":[20,60],"dr":0.6,"s0":[5,9],"s1":1,"o0":0.7}]},"raceWebLaunch_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":6,"s":"inkblot","l":[250,500],"o":7,"vx":140,"vy":140,"vz":[30,110],"g":300,"dr":1.5,"s0":[12,22],"s1":[5,10],"o0":0.85},{"n":3,"d":20,"s":"void-mist","l":[350,580],"z":3,"o":5,"vz":[10,30],"dr":0.5,"s0":[10,16],"s1":[22,35],"o0":0.5}]},"raceSymbioteArmor_aura":{"ar":0,"ice":"raceSymbioteArmor_burst","ps":"dark-flame","pm":400,"ph":150,"pw0":45,"pw1":75,"ph1":190,"po0":0.6},"raceSymbioteArmor_burst":{"L":[{"n":8,"s":"inkblot","l":[300,600],"o":8,"vx":120,"vy":120,"vz":[20,80],"g":300,"dr":2,"s0":[16,28],"s1":[8,14],"o0":0.85},{"n":4,"d":20,"s":"void-mist","l":[350,580],"z":5,"o":5,"vz":[10,30],"dr":0.5,"s0":[10,16],"s1":[22,35],"o0":0.5}]},"raceValkyrieSpear_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":10,"s":"divine-sparkle","l":[280,520],"o":7,"vx":170,"vy":170,"vz":[40,160],"g":180,"dr":1.2,"s0":[8,14],"s1":1},{"n":5,"d":10,"s":"blood-fleck","l":[300,520],"o":5,"vx":120,"vy":120,"vz":[20,100],"g":420,"dr":1.5,"s0":[5,9],"s1":1},{"s":"holy-pillar","l":500,"z":18,"s0":25,"s1":65,"o0":0.7}]},"raceRealityPulse_aoe":{"ar":1,"ite":"raceRealityPulse_impact_tile","ice":"raceRealityPulse_impact_center","sk":"normal"},"raceRealityPulse_impact_tile":{"L":[{"a":"floor","s":"flash","l":150,"z":8,"s0":45,"s1":14},{"n":6,"a":"floor","s":"psi-pulse","l":[250,450],"z":5,"o":6,"vx":120,"vy":120,"vz":[30,100],"g":160,"dr":1.2,"s0":[7,12],"s1":1},{"n":3,"d":20,"a":"floor","s":"divine-sparkle","l":[350,550],"z":8,"o":5,"vz":[15,40],"dr":0.6,"s0":[5,8],"s1":1,"o0":0.8}]},"raceRealityPulse_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":260,"o0":0.85},{"s":"psi-pulse","l":400,"z":15,"s0":50,"s1":100,"o0":0.8}]},"raceJudgmentBeam_beam":{"cm":320,"bs":"divine-sparkle","bt":42,"bhs":"flash","bm":380,"ite":"raceHolyAvenger_impact_tile","ls":true,"sk":"hard"},"raceGravityBoots_teleport":{"de":"raceGravityBoots_dispersal","ae":"raceGravityBoots_arrival","adm":200},"raceGravityBoots_dispersal":{"L":[{"a":"floor","m":"world","s":"shockwave","l":400,"z":2,"s0":30,"s1":160,"o0":0.9},{"n":14,"s":"laser-pink","l":[300,600],"o":8,"vx":180,"vy":180,"vz":[60,200],"g":-30,"dr":1,"s0":[8,14],"s1":1},{"n":6,"s":"spark-pink","l":[200,450],"z":5,"o":5,"vz":[40,120],"g":-50,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"raceGravityBoots_arrival":{"L":[{"s":"flash","l":250,"s0":100,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":20,"s1":180,"o0":0.85},{"n":10,"a":"floor","s":"laser-pink","l":[250,500],"o":6,"vx":100,"vy":100,"vz":[20,80],"g":200,"dr":1.5,"s0":[7,12],"s1":1}]},"raceBoulderHurl_impact":{"sk":"hard","L":[{"s":"flash","l":180,"s0":80,"s1":20,"o0":0.9},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":12,"s":"rock-debris","l":[300,600],"o":10,"vx":200,"vy":200,"vz":[60,200],"g":500,"dr":1.3,"s0":[10,18],"s1":2},{"n":6,"d":30,"a":"floor","s":"dust-puff","l":[500,900],"o":10,"vz":[15,45],"dr":0.4,"s0":[18,30],"s1":[40,70],"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1400,"z":1,"s0":70,"s1":110,"o0":0.7}]},"raceStoneSkin_aura":{"ar":0,"ice":"raceStoneSkin_burst"},"raceStoneSkin_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":160,"o0":0.8},{"s":"shield-blue","l":800,"z":8,"s0":60,"s1":110,"o0":0.7},{"n":14,"a":"floor","s":"rock-debris","l":[600,1100],"o":8,"vx":30,"vy":30,"vz":[100,280],"g":-60,"dr":0.6,"s0":[8,14],"s1":[4,8],"o0":0.9},{"n":4,"d":50,"s":"dust-puff","l":[500,800],"o":10,"vz":[10,30],"dr":0.5,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceAvalancheSmash_impact":{"sk":"hard","L":[{"s":"flash","l":250,"s0":110,"s1":28},{"a":"floor","m":"world","s":"shockwave","l":650,"z":2,"s0":40,"s1":240,"o0":0.9},{"n":16,"s":"rock-debris","l":[300,650],"o":12,"vx":220,"vy":220,"vz":[80,240],"g":500,"dr":1.2,"s0":[12,20],"s1":2},{"n":8,"d":40,"a":"floor","s":"dust-puff","l":[600,1100],"o":14,"vz":[20,60],"dr":0.4,"s0":[20,36],"s1":[50,80],"o0":0.6},{"a":"floor","m":"world","s":"scorch","l":1600,"z":1,"s0":90,"s1":140,"o0":0.8}]},"raceNitroBoost_aura":{"ar":0,"ice":"raceNitroBoost_burst"},"raceNitroBoost_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":140,"o0":0.8},{"s":"flash","l":200,"s0":80,"s1":20},{"n":16,"s":"spark-blue","l":[400,800],"o":8,"vx":40,"vy":40,"vz":[100,300],"g":-30,"dr":0.5,"s0":[8,14],"s1":[3,6]},{"n":8,"d":20,"a":"floor","s":"flame","l":[350,650],"o":12,"vx":60,"vy":60,"vz":[-20,-60],"g":0,"dr":0.8,"s0":[10,16],"s1":[20,30],"o0":0.8},{"n":4,"d":40,"a":"floor","s":"smoke","l":[600,1000],"o":10,"vz":[-10,-30],"dr":0.3,"s0":[16,24],"s1":[40,60],"o0":0.4}]},"raceFrostThrone_aura":{"ar":0,"ice":"raceFrostThrone_burst"},"raceFrostThrone_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":200,"o0":0.9},{"s":"flash","l":300,"s0":120,"s1":30},{"n":20,"a":"floor","s":"ice-shard","l":[500,1000],"o":6,"vx":30,"vy":30,"vz":[120,320],"g":-40,"dr":0.5,"s0":[8,16],"s1":[4,8]},{"n":8,"d":40,"s":"frost-mist","l":[700,1200],"o":14,"vz":[10,40],"dr":0.3,"s0":[20,36],"s1":[50,80],"o0":0.6},{"n":6,"d":80,"s":"divine-sparkle","l":[600,1000],"z":10,"o":10,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9}]},"raceThickHide_aura":{"ar":0,"ice":"raceThickHide_burst"},"raceThickHide_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.75},{"s":"shield-blue","l":700,"z":6,"s0":70,"s1":120,"o0":0.65},{"n":10,"a":"floor","s":"rock-debris","l":[500,900],"o":6,"vx":20,"vy":20,"vz":[80,240],"g":-50,"dr":0.5,"s0":[6,12],"s1":[3,6],"o0":0.85},{"n":5,"d":30,"s":"dust-puff","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.45}]},"raceBodyCheck_impact":{"sk":"hard","L":[{"s":"flash","l":180,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":180,"o0":0.8},{"n":8,"s":"steel-spark","l":[250,480],"o":8,"vx":180,"vy":180,"vz":[40,150],"g":300,"dr":1.5,"s0":[7,13],"s1":1},{"n":5,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,35],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.55}]},"raceRampage_aura":{"ar":0,"ice":"raceRampage_burst"},"raceRampage_burst":{"L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":200,"o0":0.85},{"s":"flash","l":250,"s0":100,"s1":26},{"n":18,"s":"ember","l":[400,900],"o":8,"vx":60,"vy":60,"vz":[100,300],"g":-40,"dr":0.5,"s0":[8,14],"s1":[3,6]},{"n":8,"d":20,"s":"flame","l":[300,600],"o":10,"vx":40,"vy":40,"vz":[60,180],"g":-30,"dr":0.6,"s0":[10,18],"s1":[20,34],"o0":0.8},{"n":6,"d":60,"s":"dark-flame","l":[500,900],"o":6,"vz":[40,120],"g":-20,"dr":0.4,"s0":[12,20],"s1":[24,40],"o0":0.7}]},"raceKiCharge_aura":{"ar":0,"ice":"raceKiCharge_burst"},"raceKiCharge_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":40,"s1":220,"o0":0.9},{"d":150,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":200,"o0":0.7},{"s":"flash","l":350,"s0":130,"s1":34},{"n":22,"a":"floor","s":"holy-light","l":[600,1200],"o":8,"vx":30,"vy":30,"vz":[150,400],"g":-60,"dr":0.4,"s0":[10,18],"s1":[4,8]},{"n":8,"d":20,"a":"floor","s":"dust-puff","l":[500,900],"o":12,"vx":100,"vy":100,"vz":[20,60],"g":60,"dr":0.6,"s0":[14,22],"s1":[30,50],"o0":0.5},{"n":10,"d":40,"s":"ember","l":[400,800],"z":5,"o":6,"vx":50,"vy":50,"vz":[80,240],"g":-40,"dr":0.5,"s0":[6,10],"s1":2,"o0":0.9}]},"raceInstantTransmission_teleport":{"de":"raceInstantTransmission_dispersal","ae":"raceInstantTransmission_arrival","adm":100},"raceInstantTransmission_dispersal":{"L":[{"s":"flash","l":120,"s0":120,"s1":30},{"n":10,"s":"holy-light","l":[150,350],"o":6,"vx":200,"vy":200,"vz":[40,160],"g":0,"dr":2,"s0":[8,14],"s1":1}]},"raceInstantTransmission_arrival":{"L":[{"s":"flash","l":150,"s0":110,"s1":28},{"a":"floor","m":"world","s":"shockwave","l":350,"z":2,"s0":20,"s1":140,"o0":0.8},{"n":12,"s":"holy-light","l":[200,400],"o":5,"vx":140,"vy":140,"vz":[30,120],"g":100,"dr":1.8,"s0":[7,12],"s1":1}]},"raceRoyalDecree_aura":{"ar":2,"ite":"raceRoyalDecree_tile","ice":"raceRoyalDecree_center"},"raceRoyalDecree_tile":{"L":[{"n":6,"s":"divine-sparkle","l":[400,700],"z":5,"o":6,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[6,10],"s1":1,"o0":0.9}]},"raceRoyalDecree_center":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":50,"s1":260,"o0":0.9},{"d":120,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":220,"o0":0.7},{"s":"flash","l":300,"s0":120,"s1":30},{"s":"holy-pillar","l":800,"z":20,"s0":30,"s1":80,"o0":0.8},{"n":16,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":160,"vy":160,"vz":[60,200],"g":-30,"dr":0.8,"s0":[8,14],"s1":2}]},"raceKnightsOath_teleport":{"de":"raceKnightsOath_dispersal","ae":"raceKnightsOath_arrival","adm":200},"raceKnightsOath_dispersal":{"L":[{"s":"flash","l":200,"s0":90,"s1":22},{"s":"holy-pillar","l":500,"z":15,"s0":20,"s1":60,"o0":0.8},{"n":10,"s":"divine-sparkle","l":[300,600],"o":6,"vx":140,"vy":140,"vz":[40,140],"g":-20,"dr":1,"s0":[7,12],"s1":1}]},"raceKnightsOath_arrival":{"L":[{"s":"flash","l":220,"s0":100,"s1":26},{"a":"floor","m":"world","s":"halo-ring","l":600,"z":2,"s0":30,"s1":160,"o0":0.85},{"n":12,"s":"divine-sparkle","l":[250,500],"o":5,"vx":100,"vy":100,"vz":[30,100],"g":140,"dr":1.5,"s0":[7,12],"s1":1}]},"raceApeFury_aura":{"ar":0,"ice":"raceApeFury_burst"},"raceApeFury_burst":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":40,"s1":220,"o0":0.85},{"s":"flash","l":280,"s0":110,"s1":28},{"n":16,"s":"ember","l":[500,1000],"o":10,"vx":60,"vy":60,"vz":[120,340],"g":-50,"dr":0.4,"s0":[9,16],"s1":[4,7]},{"n":6,"d":30,"s":"flame","l":[400,700],"o":12,"vx":40,"vy":40,"vz":[80,200],"g":-30,"dr":0.5,"s0":[12,20],"s1":[22,36],"o0":0.75},{"n":6,"d":20,"a":"floor","s":"dust-puff","l":[500,900],"o":12,"vx":100,"vy":100,"vz":[20,50],"g":60,"dr":0.6,"s0":[16,26],"s1":[35,55],"o0":0.5}]},"raceHornToss_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":85,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":500,"z":2,"s0":30,"s1":170,"o0":0.8},{"n":6,"s":"blood-fleck","l":[250,500],"o":6,"vx":160,"vy":160,"vz":[60,180],"g":400,"dr":1.5,"s0":[7,13],"s1":1},{"n":4,"s":"steel-spark","l":[200,400],"o":5,"vx":180,"vy":180,"vz":[40,140],"g":300,"dr":1.6,"s0":[6,10],"s1":1},{"n":4,"d":20,"a":"floor","s":"dust-puff","l":[400,700],"o":8,"vz":[10,35],"dr":0.5,"s0":[12,20],"s1":[30,50],"o0":0.5}]},"raceCurseOfDecay_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18,"o0":0.8},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":160,"o0":0.7},{"n":14,"s":"void-mist","l":[400,800],"o":8,"vx":80,"vy":80,"vz":[30,100],"g":-20,"dr":0.4,"s0":[12,22],"s1":[30,50],"o0":0.7},{"n":8,"d":20,"s":"poison-bubble","l":[350,650],"o":6,"vx":100,"vy":100,"vz":[40,140],"g":-30,"dr":0.8,"s0":[6,12],"s1":2,"o0":0.9}]},"raceDeathPact_aura":{"ar":0,"ice":"raceDeathPact_burst"},"raceDeathPact_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.8},{"s":"flash","l":250,"s0":90,"s1":22,"o0":0.8},{"n":14,"s":"dark-flame","l":[500,1000],"o":8,"vx":40,"vy":40,"vz":[100,280],"g":-50,"dr":0.4,"s0":[10,18],"s1":[4,8],"o0":0.9},{"n":8,"d":30,"s":"void-mist","l":[600,1100],"o":12,"vz":[20,60],"dr":0.3,"s0":[18,30],"s1":[40,65],"o0":0.6},{"n":6,"d":60,"a":"floor","s":"blood-fleck","l":[300,600],"o":6,"vx":40,"vy":40,"vz":[60,160],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceDarkResurrection_aura":{"ar":0,"ice":"raceDarkResurrection_burst"},"raceDarkResurrection_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"flash","l":300,"s0":110,"s1":28,"o0":0.9},{"s":"holy-pillar","l":900,"z":20,"s0":28,"s1":70,"o0":0.7},{"n":18,"a":"floor","s":"dark-flame","l":[600,1200],"o":8,"vx":30,"vy":30,"vz":[120,350],"g":-60,"dr":0.4,"s0":[10,18],"s1":[4,8],"o0":0.9},{"n":8,"d":40,"s":"void-mist","l":[700,1200],"o":14,"vz":[20,60],"dr":0.3,"s0":[20,34],"s1":[45,70],"o0":0.6},{"n":6,"d":80,"s":"blood-fleck","l":[400,800],"o":5,"vx":40,"vy":40,"vz":[60,180],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.85}]},"raceOmniVision_aura":{"ar":0,"ice":"raceOmniVision_burst"},"raceOmniVision_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"psi-pulse","l":500,"z":10,"s0":60,"s1":130,"o0":0.8},{"n":12,"s":"psi-pulse","l":[400,800],"o":6,"vx":80,"vy":80,"vz":[40,140],"g":-30,"dr":0.6,"s0":[8,14],"s1":2,"o0":0.9},{"n":6,"d":40,"s":"divine-sparkle","l":[500,900],"z":8,"o":10,"vx":60,"vy":60,"vz":[30,100],"g":-20,"dr":0.7,"s0":[5,9],"s1":1,"o0":0.85}]},"racePupilShield_aura":{"ar":0,"ice":"racePupilShield_burst"},"racePupilShield_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":160,"o0":0.8},{"s":"shield-blue","l":900,"z":8,"s0":60,"s1":120,"o0":0.75},{"s":"psi-pulse","l":600,"z":12,"s0":50,"s1":100,"o0":0.7},{"n":10,"d":20,"s":"psi-pulse","l":[400,700],"o":6,"vx":50,"vy":50,"vz":[30,100],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.8}]},"raceBlitz_impact":{"sk":"hard","L":[{"s":"flash","l":200,"s0":90,"s1":22},{"a":"floor","m":"world","s":"shockwave","l":550,"z":2,"s0":30,"s1":200,"o0":0.85},{"n":8,"s":"steel-spark","l":[250,500],"o":8,"vx":200,"vy":200,"vz":[50,170],"g":350,"dr":1.5,"s0":[8,14],"s1":1},{"n":6,"d":10,"s":"dust-puff","l":[400,700],"o":8,"vz":[15,40],"dr":0.5,"s0":[14,24],"s1":[35,55],"o0":0.55}]},"raceAudible_aura":{"ar":2,"ite":"raceAudible_tile","ice":"raceAudible_center"},"raceAudible_tile":{"L":[{"n":4,"s":"sparkle","l":[300,600],"z":5,"o":6,"vx":60,"vy":60,"vz":[30,100],"g":-20,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceAudible_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":30,"s1":260,"o0":0.8},{"s":"flash","l":250,"s0":100,"s1":26},{"n":14,"s":"sparkle","l":[400,800],"o":8,"vx":100,"vy":100,"vz":[60,180],"g":-30,"dr":0.6,"s0":[7,12],"s1":2}]},"raceEndZoneDance_aura":{"ar":0,"ice":"raceEndZoneDance_burst"},"raceEndZoneDance_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":180,"o0":0.8},{"s":"flash","l":250,"s0":90,"s1":22},{"n":16,"s":"sparkle","l":[400,900],"o":10,"vx":120,"vy":120,"vz":[80,250],"g":-20,"dr":0.5,"s0":[6,12],"s1":2},{"n":6,"d":40,"s":"holy-light","l":[500,800],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,120],"g":-15,"dr":0.6,"s0":[8,14],"s1":[3,6],"o0":0.85}]},"raceStealFromRich_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":70,"s1":18},{"n":6,"s":"steel-spark","l":[200,400],"o":6,"vx":160,"vy":160,"vz":[40,140],"g":300,"dr":1.5,"s0":[6,11],"s1":1},{"n":8,"d":10,"s":"divine-sparkle","l":[300,600],"z":5,"o":6,"vx":120,"vy":120,"vz":[40,140],"g":160,"dr":1.2,"s0":[6,10],"s1":1,"o0":0.9},{"n":3,"d":10,"s":"blood-fleck","l":[250,450],"o":4,"vx":100,"vy":100,"vz":[20,80],"g":400,"dr":1.5,"s0":[5,9],"s1":1}]},"raceForestAmbush_aura":{"ar":0,"ice":"raceForestAmbush_burst"},"raceForestAmbush_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":140,"o0":0.7},{"n":12,"a":"floor","s":"vine-green","l":[500,1000],"o":8,"vx":40,"vy":40,"vz":[80,240],"g":-30,"dr":0.5,"s0":[8,14],"s1":[3,6],"o0":0.85},{"n":6,"d":30,"s":"dust-puff","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.4},{"n":4,"d":50,"s":"sparkle","l":[600,900],"z":8,"o":6,"vz":[20,60],"g":-15,"dr":0.6,"s0":[5,8],"s1":1,"o0":0.8}]},"raceGiftOfHealing_aura":{"ar":0,"ice":"raceGiftOfHealing_burst"},"raceGiftOfHealing_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":600,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":20,"s1":50,"o0":0.85},{"n":14,"s":"sparkle","l":[500,1000],"o":10,"vx":80,"vy":80,"vz":[60,200],"g":-30,"dr":0.5,"s0":[6,12],"s1":2},{"n":6,"d":40,"s":"divine-sparkle","l":[400,700],"z":8,"o":8,"vz":[30,100],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceNaughtyList_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":75,"s1":20,"o0":0.9},{"n":12,"s":"dark-flame","l":[300,600],"o":8,"vx":140,"vy":140,"vz":[40,150],"g":160,"dr":1.2,"s0":[8,14],"s1":2,"o0":0.9},{"n":6,"d":10,"s":"ember","l":[250,500],"z":5,"o":5,"vx":100,"vy":100,"vz":[30,100],"g":60,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.85},{"n":4,"d":20,"s":"void-mist","l":[500,800],"o":6,"vz":[15,40],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceChristmasSpirit_aura":{"ar":0,"ice":"raceChristmasSpirit_burst"},"raceChristmasSpirit_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1200,"z":2,"s0":60,"s1":280,"o0":0.9},{"s":"heal-glow","l":700,"z":6,"s0":120,"s1":50,"o0":0.85},{"n":20,"s":"sparkle","l":[500,1200],"o":14,"vx":120,"vy":120,"vz":[60,250],"g":-25,"dr":0.4,"s0":[7,14],"s1":2},{"n":8,"d":40,"s":"divine-sparkle","l":[600,1000],"z":10,"o":10,"vx":80,"vy":80,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":1,"o0":0.9}]},"raceSleighDash_teleport":{"de":"raceSleighDash_dispersal","ae":"raceSleighDash_arrival","adm":200},"raceSleighDash_dispersal":{"L":[{"s":"flash","l":180,"s0":90,"s1":22},{"n":12,"s":"sparkle","l":[300,600],"o":8,"vx":160,"vy":160,"vz":[60,200],"g":-20,"dr":0.8,"s0":[7,12],"s1":1},{"n":4,"d":10,"a":"floor","s":"frost-mist","l":[400,700],"o":10,"vz":[10,30],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"raceSleighDash_arrival":{"L":[{"s":"flash","l":200,"s0":100,"s1":26},{"a":"floor","m":"world","s":"shockwave","l":450,"z":2,"s0":20,"s1":160,"o0":0.8},{"n":14,"s":"sparkle","l":[250,550],"o":6,"vx":120,"vy":120,"vz":[30,120],"g":100,"dr":1.2,"s0":[7,12],"s1":1},{"n":4,"d":20,"a":"floor","s":"frost-mist","l":[350,600],"o":8,"vz":[10,30],"dr":0.4,"s0":[12,20],"s1":[28,45],"o0":0.45}]},"raceChooserOfSlain_aura":{"ar":0,"ice":"raceChooserOfSlain_burst"},"raceChooserOfSlain_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"flash","l":320,"s0":120,"s1":30},{"s":"holy-pillar","l":800,"z":20,"s0":30,"s1":80,"o0":0.85},{"n":16,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":100,"vy":100,"vz":[80,260],"g":-40,"dr":0.5,"s0":[8,14],"s1":2},{"n":8,"d":60,"s":"holy-light","l":[700,1200],"z":8,"o":8,"vz":[60,180],"g":-30,"dr":0.4,"s0":[6,12],"s1":[3,6],"o0":0.9}]},"raceShieldMaiden_aura":{"ar":0,"ice":"raceShieldMaiden_burst"},"raceShieldMaiden_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":170,"o0":0.85},{"s":"shield-blue","l":900,"z":8,"s0":60,"s1":120,"o0":0.8},{"s":"flash","l":200,"s0":80,"s1":20,"o0":0.9},{"n":12,"s":"divine-sparkle","l":[400,800],"o":6,"vx":60,"vy":60,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"raceNordicWarcry_aura":{"ar":2,"ite":"raceNordicWarcry_tile","ice":"raceNordicWarcry_center"},"raceNordicWarcry_tile":{"L":[{"n":5,"s":"divine-sparkle","l":[400,700],"z":5,"o":5,"vx":60,"vy":60,"vz":[40,120],"g":-20,"dr":0.8,"s0":[5,9],"s1":1,"o0":0.9}]},"raceNordicWarcry_center":{"L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":30,"s1":260,"o0":0.85},{"d":130,"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":30,"s1":220,"o0":0.65},{"s":"flash","l":280,"s0":110,"s1":28},{"n":14,"s":"divine-sparkle","l":[400,800],"o":10,"vx":140,"vy":140,"vz":[60,200],"g":-30,"dr":0.7,"s0":[7,12],"s1":2}]},"raceCosmicSight_aura":{"ar":0,"ice":"raceCosmicSight_burst"},"raceCosmicSight_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1000,"z":2,"s0":60,"s1":220,"o0":0.9},{"s":"psi-pulse","l":600,"z":12,"s0":60,"s1":140,"o0":0.8},{"d":120,"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":50,"s1":200,"o0":0.65},{"n":14,"s":"divine-sparkle","l":[500,1000],"o":10,"vx":80,"vy":80,"vz":[60,200],"g":-30,"dr":0.5,"s0":[8,14],"s1":2},{"n":8,"d":40,"s":"psi-pulse","l":[400,800],"z":8,"o":8,"vx":50,"vy":50,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.85}]},"raceTemporalShift_teleport":{"de":"raceTemporalShift_dispersal","ae":"raceTemporalShift_arrival","adm":250},"raceTemporalShift_dispersal":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":600,"z":2,"s0":60,"s1":200,"o0":0.9},{"s":"psi-pulse","l":400,"z":10,"s0":80,"s1":160,"o0":0.8},{"n":12,"s":"divine-sparkle","l":[350,700],"o":8,"vx":120,"vy":120,"vz":[50,180],"g":0,"dr":1,"s0":[8,14],"s1":1},{"n":6,"d":20,"s":"void-mist","l":[500,900],"o":10,"vz":[20,50],"dr":0.3,"s0":[16,26],"s1":[35,55],"o0":0.5}]},"raceTemporalShift_arrival":{"L":[{"s":"flash","l":250,"s0":110,"s1":28},{"a":"floor","m":"world","s":"halo-ring","l":700,"z":2,"s0":40,"s1":180,"o0":0.85},{"s":"psi-pulse","l":500,"z":10,"s0":50,"s1":110,"o0":0.8},{"n":14,"s":"divine-sparkle","l":[300,600],"o":6,"vx":100,"vy":100,"vz":[30,120],"g":100,"dr":1.2,"s0":[7,12],"s1":1}]},"raceAstralBarrier_aura":{"ar":0,"ice":"raceAstralBarrier_burst"},"raceAstralBarrier_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"shield-blue","l":1000,"z":8,"s0":60,"s1":130,"o0":0.8},{"s":"psi-pulse","l":700,"z":12,"s0":50,"s1":110,"o0":0.7},{"n":10,"d":20,"s":"divine-sparkle","l":[500,900],"o":8,"vx":60,"vy":60,"vz":[40,140],"g":-20,"dr":0.6,"s0":[6,10],"s1":2,"o0":0.9}]},"sentaiBlackGuard_aura":{"ar":0,"ice":"sentaiBlackGuard_burst"},"sentaiBlackGuard_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"flash","l":250,"s0":90,"s1":24,"o0":0.9},{"s":"shield-blue","l":800,"z":8,"s0":60,"s1":120,"o0":0.75},{"n":14,"s":"steel-spark","l":[500,900],"o":8,"vx":40,"vy":40,"vz":[80,240],"g":-40,"dr":0.5,"s0":[7,12],"s1":[3,6],"o0":0.9},{"n":6,"d":40,"s":"void-mist","l":[600,1000],"o":10,"vz":[15,45],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"sentaiPinkHeal_aura":{"ar":0,"ice":"sentaiPinkHeal_burst"},"sentaiPinkHeal_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":600,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":20,"s1":50,"o0":0.85},{"n":16,"s":"spark-pink","l":[500,1000],"o":10,"vx":100,"vy":100,"vz":[60,200],"g":-25,"dr":0.5,"s0":[7,13],"s1":2},{"n":8,"d":40,"s":"divine-sparkle","l":[400,800],"z":8,"o":8,"vz":[40,120],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"sentaiGreenArrow_impact":{"sk":"normal","L":[{"s":"flash","l":220,"s0":90,"s1":20},{"n":14,"s":"vine-green","l":[280,520],"o":8,"vx":180,"vy":180,"vz":[40,180],"g":140,"dr":1,"s0":[8,15],"s1":1},{"n":8,"d":20,"s":"sparkle","l":[300,600],"o":5,"vx":100,"vy":100,"vz":[20,100],"g":80,"dr":0.8,"s0":[5,10],"s1":1,"o0":0.9}]},"sentaiTeamStrike_impact_v2":{"L":[{"s":"flash","l":180,"s0":65,"s1":18},{"n":3,"s":"ember","l":[200,400],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-blue","l":[220,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"vine-green","l":[200,400],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-elec","l":[200,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1},{"n":3,"s":"spark-pink","l":[220,420],"o":5,"vx":160,"vy":160,"vz":[30,130],"g":280,"dr":1.5,"s0":[6,11],"s1":1}]},"sentaiMegazordBlast_impact_center_v2":{"sk":"hard","L":[{"a":"floor","m":"world","s":"shockwave","l":700,"z":2,"s0":50,"s1":340,"o0":0.9},{"s":"explosion-orange","l":500,"z":15,"s0":110,"s1":40},{"n":4,"s":"ember","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-blue","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"vine-green","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-elec","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1},{"n":4,"s":"spark-pink","l":[300,550],"z":8,"o":12,"vx":240,"vy":240,"vz":[60,220],"g":200,"dr":1.3,"s0":[8,16],"s1":1}]},"sharedGlacialTomb_descent":{"dsm":600,"tm":300,"ts":"target-ring-blue","tsz":100,"L":[{"s":"frost-crystal","l":400,"s0":50,"s1":70,"o1":0.7},{"n":6,"s":"frost-mist","l":[300,500],"o":5,"vx":40,"vy":40,"vz":[15,60],"g":-30,"dr":0.4,"s0":[10,18],"s1":[25,40],"o0":0.6}],"ie":"sharedGlacialTomb_impact"},"sharedGlacialTomb_impact":{"sk":"normal","L":[{"a":"floor","s":"flash","l":200,"z":5,"s0":80,"s1":20},{"n":12,"a":"floor","s":"frost-crystal","l":[250,500],"z":5,"o":6,"vx":180,"vy":180,"vz":[40,180],"g":200,"dr":1.2,"s0":[8,14],"s1":1},{"n":6,"d":30,"a":"floor","s":"frost-mist","l":[400,700],"z":3,"o":8,"vx":60,"vy":60,"vz":[10,40],"g":-15,"dr":0.3,"s0":[16,28],"s1":[35,55],"o0":0.5},{"a":"floor","m":"world","s":"halo-ring","l":600,"z":1,"s0":30,"s1":160,"o0":0.7}]},"raceGiftOfHealing_aura_v2":{"ar":0,"ice":"raceGiftOfHealing_burst_v2"},"raceGiftOfHealing_burst_v2":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":900,"z":2,"s0":50,"s1":180,"o0":0.85},{"s":"heal-glow","l":700,"z":6,"s0":100,"s1":40,"o0":0.8},{"s":"heal-cross","l":700,"z":15,"s0":22,"s1":50,"o0":0.85},{"n":16,"s":"frost-crystal","l":[600,1200],"z":20,"o":14,"vx":50,"vy":50,"vz":[-30,-80],"g":30,"dr":0.3,"s0":[5,10],"s1":[3,6],"o0":0.9},{"n":8,"d":40,"s":"divine-sparkle","l":[400,800],"z":8,"o":8,"vz":[40,120],"g":-20,"dr":0.6,"s0":[5,9],"s1":1,"o0":0.9}]},"raceChristmasSpirit_aura_v2":{"ar":0,"ice":"raceChristmasSpirit_burst_v2"},"raceChristmasSpirit_burst_v2":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":1100,"z":2,"s0":60,"s1":250,"o0":0.9},{"s":"heal-glow","l":800,"z":8,"s0":120,"s1":50,"o0":0.85},{"s":"heal-cross","l":800,"z":20,"s0":28,"s1":60,"o0":0.9},{"n":24,"s":"frost-crystal","l":[700,1400],"z":25,"o":20,"vx":80,"vy":80,"vz":[-40,-100],"g":25,"dr":0.25,"s0":[6,12],"s1":[3,7],"o0":0.9},{"n":12,"d":30,"s":"divine-sparkle","l":[500,1000],"z":10,"o":12,"vz":[50,150],"g":-20,"dr":0.5,"s0":[5,10],"s1":1,"o0":0.9}]},"raceSleighDash_teleport_v2":{"de":"_sleighDash_dispersal","ae":"_sleighDash_arrival","adm":220},"_sleighDash_dispersal":{"L":[{"s":"flash","l":200,"s0":70,"s1":20},{"n":14,"s":"frost-crystal","l":[300,600],"z":5,"o":6,"vx":160,"vy":160,"vz":[40,160],"g":100,"dr":0.8,"s0":[6,12],"s1":1},{"n":4,"s":"frost-mist","l":[300,500],"o":8,"vz":[10,40],"dr":0.3,"s0":[14,24],"s1":[30,50],"o0":0.5}]},"_sleighDash_arrival":{"L":[{"s":"flash","l":180,"s0":60,"s1":16},{"n":12,"s":"frost-crystal","l":[400,800],"z":8,"o":10,"vx":40,"vy":40,"vz":[-20,-60],"g":30,"dr":0.4,"s0":[6,11],"s1":[3,6],"o0":0.9},{"n":4,"d":40,"s":"frost-mist","l":[400,700],"o":6,"vz":[5,20],"dr":0.3,"s0":[12,20],"s1":[25,45],"o0":0.4}]},"raceBlizzardPresent_aoe_v2":{"ar":1,"ite":"raceBlizzardPresent_impact_tile_v2","ice":"raceBlizzardPresent_impact_center","sk":"normal"},"raceBlizzardPresent_impact_tile_v2":{"L":[{"a":"floor","s":"flash","l":150,"z":5,"s0":45,"s1":12},{"n":8,"a":"floor","s":"frost-crystal","l":[250,500],"z":5,"o":6,"vx":130,"vy":130,"vz":[30,140],"g":150,"dr":1,"s0":[6,12],"s1":1},{"n":3,"d":20,"a":"floor","s":"frost-mist","l":[350,600],"z":2,"o":5,"vz":[10,30],"dr":0.3,"s0":[14,22],"s1":[30,50],"o0":0.4}]},"raceBlizzardPresent_impact_center":{"sk":"normal","L":[{"a":"floor","m":"world","s":"shockwave","l":600,"z":2,"s0":40,"s1":200,"o0":0.7},{"n":10,"s":"frost-crystal","l":[400,800],"z":15,"o":12,"vx":60,"vy":60,"vz":[-30,-80],"g":25,"dr":0.3,"s0":[8,14],"s1":[4,8],"o0":0.9}]},"raceLumpOfCoal_impact_v2":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18},{"n":10,"s":"dark-flame","l":[280,500],"o":7,"vx":150,"vy":150,"vz":[40,160],"g":120,"dr":1,"s0":[9,15],"s1":2},{"n":6,"s":"rock-debris","l":[300,550],"o":5,"vx":120,"vy":120,"vz":[30,120],"g":400,"dr":1.5,"s0":[7,12],"s1":1},{"n":3,"d":20,"s":"scorch","l":[400,650],"o":6,"vz":[15,50],"dr":0.5,"s0":[14,22],"s1":[28,45],"o0":0.4}]},"raceNaughtyList_impact_v2":{"sk":"soft","L":[{"s":"flash","l":180,"s0":60,"s1":16,"o0":0.8},{"n":8,"s":"dark-flame","l":[300,550],"o":6,"vx":80,"vy":80,"vz":[40,140],"g":-20,"dr":0.5,"s0":[8,14],"s1":[16,28],"o0":0.6},{"n":4,"d":10,"s":"rock-debris","l":[250,450],"o":5,"vx":100,"vy":100,"vz":[20,80],"g":350,"dr":1.5,"s0":[5,9],"s1":1,"o0":0.9}]},"_dark_shadow_impact":{"sk":"normal","L":[{"s":"flash","l":200,"s0":70,"s1":18,"o0":0.9},{"n":10,"s":"dark-flame","l":[300,600],"o":7,"vx":100,"vy":100,"vz":[50,180],"g":-30,"dr":0.5,"s0":[10,18],"s1":[20,35],"o0":0.7},{"n":5,"d":30,"s":"void-mist","l":[400,750],"o":8,"vx":40,"vy":40,"vz":[20,60],"g":-15,"dr":0.3,"s0":[14,22],"s1":[30,50],"o0":0.5}]},"_dark_debuff_impact":{"sk":"soft","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.7},{"n":8,"s":"void-mist","l":[400,800],"o":6,"vx":40,"vy":40,"vz":[30,100],"g":-20,"dr":0.4,"s0":[10,18],"s1":[22,38],"o0":0.5},{"n":6,"d":20,"s":"dark-flame","l":[350,650],"o":5,"vx":60,"vy":60,"vz":[40,120],"g":-25,"dr":0.5,"s0":[8,14],"s1":[14,24],"o0":0.6}]},"_buff_dark_aura":{"ar":0,"ice":"_buff_dark_burst"},"_buff_dark_burst":{"L":[{"a":"floor","m":"world","s":"halo-ring","l":800,"z":2,"s0":40,"s1":160,"o0":0.7},{"m":"y-locked","s":"buff-aura","l":900,"w0":30,"w1":50,"h0":100,"h1":160,"o0":0.7},{"n":10,"a":"floor","s":"dark-flame","l":[500,900],"o":8,"vx":30,"vy":30,"vz":[80,220],"g":-25,"dr":0.4,"s0":[10,18],"s1":[18,30],"o0":0.6},{"n":6,"d":40,"s":"void-mist","l":[600,1000],"o":10,"vz":[15,50],"dr":0.4,"s0":[14,22],"s1":[30,50],"o0":0.45}]},"_rangedShot_impact":{"sk":"normal","L":[{"s":"flash","l":160,"s0":60,"s1":16},{"n":10,"s":"steel-spark","l":[200,400],"o":5,"vx":180,"vy":180,"vz":[30,140],"g":300,"dr":1.5,"s0":[5,10],"s1":1},{"n":3,"d":10,"s":"dust-puff","l":[300,500],"o":4,"vx":50,"vy":50,"vz":[10,40],"g":50,"dr":0.5,"s0":[10,16],"s1":[20,35],"o0":0.5}]},"raceBoneToss_impact_v2":{"sk":"normal","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.9},{"n":8,"s":"debris","l":[200,400],"o":5,"vx":170,"vy":170,"vz":[30,140],"g":350,"dr":1.5,"s0":[6,11],"s1":1},{"n":4,"d":15,"s":"void-mist","l":[300,550],"o":5,"vz":[15,50],"dr":0.5,"s0":[10,16],"s1":[22,36],"o0":0.35}]},"raceKiBlast_impact_v2":{"sk":"normal","L":[{"s":"flash","l":200,"s0":80,"s1":20},{"n":12,"s":"ember","l":[250,480],"o":7,"vx":180,"vy":180,"vz":[40,180],"g":100,"dr":0.8,"s0":[8,14],"s1":1},{"n":4,"d":10,"s":"fire-glow","l":[300,550],"o":5,"vx":60,"vy":60,"vz":[20,60],"g":-20,"dr":0.4,"s0":[12,20],"s1":[24,40],"o0":0.5}]},"raceHexOfAgony_impact":{"sk":"soft","L":[{"s":"flash","l":180,"s0":55,"s1":14,"o0":0.7},{"n":6,"s":"poison-bubble","l":[350,650],"o":6,"vx":50,"vy":50,"vz":[40,120],"g":-15,"dr":0.4,"s0":[6,12],"s1":[10,18],"o0":0.7},{"n":6,"d":20,"s":"dark-flame","l":[400,700],"o":5,"vx":40,"vy":40,"vz":[30,100],"g":-20,"dr":0.5,"s0":[8,14],"s1":[16,28],"o0":0.5},{"n":4,"d":30,"s":"void-mist","l":[450,800],"o":8,"vz":[10,40],"dr":0.3,"s0":[14,22],"s1":[28,48],"o0":0.4}]},"_psychic_dark_impact":{"sk":"soft","L":[{"s":"psi-pulse","l":300,"s0":70,"s1":120,"o0":0.6},{"n":8,"s":"void-mist","l":[400,800],"o":8,"vx":30,"vy":30,"vz":[20,70],"g":-15,"dr":0.3,"s0":[12,20],"s1":[25,42],"o0":0.45},{"n":5,"d":20,"s":"spark-pink","l":[300,550],"o":5,"vx":80,"vy":80,"vz":[30,100],"g":-20,"dr":0.5,"s0":[6,10],"s1":1,"o0":0.8}]},"raceShadowBind_impact":{"sk":"soft","L":[{"a":"floor","m":"world","s":"halo-ring","l":500,"z":1,"s0":20,"s1":120,"o0":0.6},{"n":10,"a":"floor","s":"void-mist","l":[500,900],"z":-5,"o":8,"vx":20,"vy":20,"vz":[50,150],"g":-30,"dr":0.4,"s0":[8,14],"s1":[18,30],"o0":0.55},{"n":6,"d":30,"s":"dark-flame","l":[400,700],"o":5,"vx":40,"vy":40,"vz":[20,80],"g":-20,"dr":0.5,"s0":[7,12],"s1":[14,22],"o0":0.5}]},"_dark_mark_impact":{"sk":"soft","L":[{"a":"floor","m":"world","s":"halo-ring","l":600,"z":1,"s0":25,"s1":110,"o0":0.7},{"n":8,"s":"dark-flame","l":[350,650],"o":6,"vx":50,"vy":50,"vz":[40,130],"g":-25,"dr":0.5,"s0":[8,14],"s1":[16,26],"o0":0.6},{"n":4,"d":30,"s":"void-mist","l":[450,750],"o":7,"vz":[10,40],"dr":0.3,"s0":[12,20],"s1":[26,44],"o0":0.4}]},"_eldritch_gaze_impact":{"sk":"soft","L":[{"s":"flash","l":250,"z":10,"s0":50,"s1":12,"o0":0.8},{"n":8,"s":"void-mist","l":[400,800],"o":8,"vx":30,"vy":30,"vz":[15,55],"g":-10,"dr":0.3,"s0":[12,20],"s1":[25,42],"o0":0.45},{"n":5,"d":20,"s":"dark-flame","l":[350,600],"o":5,"vx":50,"vy":50,"vz":[30,100],"g":-20,"dr":0.5,"s0":[7,12],"s1":[14,22],"o0":0.55}]}},"S":{"fire1":{"impact":"fire1_impact"},"fire2":{"impact":"fire2_impact"},"wallOfFire":{"wall":"wallOfFire_tile"},"meteor":{"descent":"meteor_descent","impact":"meteor_impact_tile"},"radiantBolt":{"descent":"radiantBolt_descent","impact":"radiantBolt_impact"},"judgment":{"descent":"judgment_descent","impact":"judgment_impact_tile"},"nuke":{"descent":"nuke_descent","impact":"nuke_impact_tile"},"empBurst":{"descent":"empBurst_descent","impact":"empBurst_impact_tile"},"raceCosmicSlam":{"descent":"raceCosmicSlam_descent","impact":"raceCosmicSlam_impact_tile"},"raceInfernalDecree":{"descent":"raceInfernalDecree_descent","impact":"raceInfernalDecree_impact_tile"},"divineIntervention":{"descent":"divineIntervention_descent","impact":"divineIntervention_impact"},"raceStarDecree":{"descent":"raceStarDecree_descent","impact":"raceStarDecree_impact_tile"},"thunder1":{"descent":"thunder1_descent","impact":"thunder1_impact","chain":"thunder1_chain_hop"},"raceDivineJudgment":{"descent":"raceDivineJudgment_descent","impact":"judgment_impact_tile"},"raceSolarCorona":{"descent":"raceSolarCorona_descent","impact":"judgment_impact_tile"},"electroDart":{"impact":"electroDart_impact"},"taser":{"impact":"taser_impact"},"knifeThrow":{"impact":"knifeThrow_impact"},"shoot":{"impact":"shoot_impact"},"doubleShot":{"impact":"doubleShot_impact"},"headshot":{"impact":"headshot_impact"},"precisionShot":{"impact":"precisionShot_impact"},"deadEye":{"impact":"deadEye_impact"},"kneecapShot":{"impact":"kneecapShot_impact"},"shieldBash":{"impact":"shieldBash_impact"},"dragonSlash":{"impact":"dragonSlash_impact"},"guardSlash":{"impact":"guardSlash_impact"},"sneakSlash":{"impact":"sneakSlash_impact"},"improvise":{"impact":"improvise_impact"},"reallyGoodPunch":{"impact":"reallyGoodPunch_impact"},"cannonBlast":{"impact":"cannonBlast_impact"},"anchorToss":{"impact":"anchorToss_impact"},"boardingRush":{"impact":"boardingRush_impact"},"psychosis":{"impact":"psychosis_impact"},"mindShatter":{"impact":"mindShatter_impact"},"kineticHurl":{"impact":"kineticHurl_impact"},"exorcism":{"impact":"exorcism_impact"},"ricochet1":{"impact":"ricochet1_impact"},"lifeDrain":{"impact":"lifeDrain_impact","drainHop":"lifeDrain_drainHop"},"raceDemonicClaw":{"impact":"raceDemonicClaw_impact"},"raceSmite":{"impact":"raceSmite_impact"},"racePounce":{"impact":"racePounce_impact"},"raceNinefoldScratch":{"impact":"raceNinefoldScratch_impact"},"raceLastStand":{"impact":"raceLastStand_impact"},"raceHeroicLeap":{"impact":"raceHeroicLeap_impact"},"raceTailWhip":{"impact":"raceTailWhip_impact"},"raceBorrowedClaw":{"impact":"raceBorrowedClaw_impact"},"raceInfectiousBite":{"impact":"raceInfectiousBite_impact"},"raceWeighTheHeart":{"impact":"raceWeighTheHeart_impact"},"raceBoneToss":{"impact":"raceBoneToss_impact_v2"},"raceGoreCharge":{"impact":"raceGoreCharge_impact"},"raceVoidContract":{"impact":"raceVoidContract_impact","drainHop":"lifeDrain_drainHop"},"raceSoulSuck":{"impact":"raceSoulSuck_impact","drainHop":"lifeDrain_drainHop"},"raceLifetap":{"impact":"raceLifetap_impact","drainHop":"lifeDrain_drainHop"},"raceMandibleStrike":{"impact":"raceMandibleStrike_impact"},"raceDreamSiphon":{"impact":"raceDreamSiphon_impact","drainHop":"dreamSiphon_drainHop"},"raceVenomFang":{"impact":"raceVenomFang_impact"},"racePrismBurst":{"impact":"racePrismBurst_impact"},"raceDivineSmite":{"impact":"raceDivineSmite_impact"},"raceCrashLoop":{"impact":"raceCrashLoop_impact"},"plasmaGun":{"beam":"plasmaGun_beam","impact":"plasmaGun_impact_tile"},"raceHellmouth":{"beam":"raceHellmouth_beam","impact":"raceHellmouth_impact_tile"},"raceFormicAcid":{"beam":"raceFormicAcid_beam","impact":"raceFormicAcid_impact_tile"},"raceSonicBreaker":{"beam":"raceSonicBreaker_beam","impact":"raceSonicBreaker_impact_tile"},"raceHeatRay":{"beam":"raceHeatRay_beam","impact":"raceHeatRay_impact_tile"},"raceBalefulGaze":{"beam":"raceBalefulGaze_beam","impact":"raceBalefulGaze_impact_tile"},"raceEntropicBeam":{"beam":"raceEntropicBeam_beam","impact":"raceEntropicBeam_impact_tile"},"raceLaserBeam":{"beam":"raceLaserBeam_beam","impact":"raceLaserBeam_impact_tile"},"broadside":{"aoe":"broadside_aoe","impact":"broadside_impact_tile"},"raceChassisSlan":{"aoe":"raceChassisSlan_aoe","impact":"raceChassisSlan_impact_tile"},"raceEMPGrenade":{"aoe":"raceEMPGrenade_aoe","impact":"raceEMPGrenade_impact_tile"},"raceMortarSalvo":{"aoe":"raceMortarSalvo_aoe","impact":"raceMortarSalvo_impact_tile"},"overgrowth":{"aoe":"overgrowth_aoe","impact":"overgrowth_impact_tile"},"raceEarthshaker":{"aoe":"raceEarthshaker_aoe","impact":"raceEarthshaker_impact_tile"},"raceGlitterburst":{"aoe":"raceGlitterburst_aoe","impact":"raceGlitterburst_impact_tile"},"raceSignalPulse":{"aoe":"raceSignalPulse_aoe","impact":"raceSignalPulse_impact_tile"},"raceTremorStomp":{"aoe":"raceTremorStomp_aoe","impact":"raceTremorStomp_impact_tile"},"raceBatSwarm":{"aoe":"raceBatSwarm_aoe","impact":"raceBatSwarm_impact_tile"},"raceDarkDominion":{"aoe":"raceDarkDominion_aoe","impact":"raceDarkDominion_impact_tile"},"raceDarkLullaby":{"aoe":"raceDarkLullaby_aoe","impact":"raceDarkLullaby_impact_tile"},"raceDemonicRoar":{"aoe":"raceDemonicRoar_aoe","impact":"raceDemonicRoar_impact_tile"},"raceNightmarePulse":{"aoe":"raceNightmarePulse_aoe","impact":"raceNightmarePulse_impact_tile"},"raceWebSnare":{"aoe":"raceWebSnare_aoe","impact":"raceWebSnare_impact_tile","webOverlay":"raceWebSnare_webOverlay"},"raceTitanStep":{"aoe":"raceTitanStep_aoe","impact":"raceTitanStep_impact_tile"},"raceDustDevil":{"aoe":"raceDustDevil_aoe","impact":"raceDustDevil_impact_tile"},"raceGravityWell":{"aoe":"raceGravityWell_aoe","impact":"raceGravityWell_impact_tile"},"raceWhirlpool":{"aoe":"raceWhirlpool_aoe","impact":"raceWhirlpool_impact_tile"},"heal1":{"aura":"heal1_aura"},"cleanse":{"aura":"cleanse_aura"},"revive1":{"aura":"revive1_aura"},"fortify":{"aura":"fortify_aura"},"healingSeed":{"aura":"healingSeed_aura"},"protect1":{"aura":"protect1_aura"},"overclock":{"aura":"overclock_aura"},"raceWishGranted":{"aura":"raceWishGranted_aura"},"racePerchForm":{"aura":"racePerchForm_aura"},"camouflage":{"aura":"camouflage_aura"},"steadyAim":{"aura":"steadyAim_aura"},"jackOfAll":{"aura":"jackOfAll_aura"},"raceIronBulwark":{"aura":"raceIronBulwark_aura"},"raceBlackBudget":{"aura":"raceBlackBudget_aura"},"raceOverclock":{"aura":"raceOverclock_aura"},"raceOvercalculate":{"aura":"raceOvercalculate_aura"},"raceSiegeMode":{"aura":"raceSiegeMode_aura"},"raceIronGuard":{"aura":"raceIronGuard_aura"},"raceChitinArmor":{"aura":"raceChitinArmor_aura"},"raceTimeSurge":{"aura":"raceTimeSurge_aura"},"raceAbyssalWings":{"aura":"raceAbyssalWings_aura"},"raceHellfireCrown":{"aura":"raceHellfireCrown_aura"},"racePhaseShift":{"aura":"racePhaseShift_aura"},"raceBloodRitual":{"aura":"raceBloodRitual_aura"},"raceWildResilience":{"aura":"raceWildResilience_aura"},"raceAdrenalineRush":{"aura":"raceAdrenalineRush_aura"},"healAll":{"aura":"healAll_aura"},"raceAbsolution":{"aura":"raceAbsolution_aura"},"raceTidalBlessing":{"aura":"raceTidalBlessing_aura"},"raceSanctuary":{"aura":"raceSanctuary_aura"},"bubble":{"aura":"bubble_aura"},"raceRunicWard":{"aura":"raceRunicWard_aura"},"raceHolyBulwark":{"aura":"raceHolyBulwark_aura"},"raceLuminousShield":{"aura":"raceLuminousShield_aura"},"raceFirewallProtocol":{"aura":"raceFirewallProtocol_aura"},"warCry":{"aura":"warCry_aura"},"raceRallyCommand":{"aura":"raceRallyCommand_aura"},"raceVOXBroadcast":{"aura":"raceVOXBroadcast_aura"},"racePsychicBarrier":{"aura":"racePsychicBarrier_aura"},"raceShieldWall":{"aura":"raceShieldWall_aura"},"raceMushroomRing":{"aura":"raceMushroomRing_aura"},"placeBomb":{"aoe":"placeBomb_aoe"},"raceColdSpot":{"aura":"raceColdSpot_aura"},"raceHostileTakeover":{"aura":"raceHostileTakeover_aura"},"raceDeadAir":{"aura":"raceDeadAir_aura"},"raceDimensionalWeb":{"aura":"raceDimensionalWeb_aura"},"_eorHpRegen":{"aura":"_eorHpRegen_aura"},"_eorMpRegen":{"aura":"_eorMpRegen_aura"},"wildGrowth":{"wall":"wildGrowth_tile"},"buildBridge":{"wall":"buildBridge_tile"},"raceBrimstone":{"wall":"raceBrimstone_tile"},"raceCallOfTheDeep":{"wall":"raceCallOfTheDeep_tile"},"teleport":{"teleport":"teleport_teleport"},"voidRush":{"teleport":"voidRush_teleport"},"raceShadowStep":{"teleport":"raceShadowStep_teleport"},"racePhaseWalk":{"teleport":"racePhaseWalk_teleport"},"raceShedSkin":{"teleport":"raceShedSkin_teleport"},"raceNimbleDodge":{"teleport":"raceNimbleDodge_teleport"},"deployTurret":{"aura":"deployTurret_aura"},"siegeTurret":{"aura":"siegeTurret_aura"},"fiveGTower":{"aura":"fiveGTower_aura"},"shootout":{"impact":"shootout_impact"},"requiem":{"impact":"requiem_impact"},"raceDreadAura":{"impact":"raceDreadAura_impact","aura":"raceDreadAura_aura"},"raceHowl":{"impact":"raceHowl_impact","aura":"raceHowl_aura"},"raceFractalNeedle":{"impact":"raceFractalNeedle_impact"},"warpRune":{"aura":"warpRune_aura"},"_nexusChannelP1":{"aura":"_nexusChannelP1_aura"},"_nexusChannelP2":{"aura":"_nexusChannelP2_aura"},"_nexusProgressP1":{"aura":"_nexusProgressP1_aura"},"_nexusProgressP2":{"aura":"_nexusProgressP2_aura"},"sharedFlashFreeze":{"wall":"sharedFlashFreeze_tile"},"sharedRampart":{"wall":"sharedRampart_tile"},"sharedFissure":{"wall":"sharedFissure_tile"},"sharedScorchedEarth":{"wall":"sharedScorchedEarth_tile"},"sharedPoisonSwamp":{"wall":"sharedPoisonSwamp_tile"},"sharedTerraform":{"wall":"sharedTerraform_tile"},"sharedMaelstrom":{"wall":"sharedMaelstrom_tile"},"sharedSacredGeometry":{"wall":"sharedSacredGeometry_tile"},"sharedGothicRampart":{"wall":"sharedGothicRampart_tile"},"sharedZigguratProtocol":{"wall":"sharedZigguratProtocol_tile"},"raceSacredGeometry":{"wall":"sharedSacredGeometry_tile"},"raceGothicRampart":{"wall":"sharedGothicRampart_tile"},"raceZigguratProtocol":{"wall":"sharedZigguratProtocol_tile"},"raceContainmentField":{"wall":"raceContainmentField_tile"},"sharedTidalSurge":{"beam":"sharedTidalSurge_beam","impact":"sharedTidalSurge_impact_tile"},"raceShockwaveClap":{"beam":"raceShockwaveClap_beam","impact":"raceShockwaveClap_impact_tile"},"raceDragonfire":{"beam":"raceDragonfire_beam","impact":"raceDragonfire_impact_tile"},"raceAtomicBreath":{"beam":"raceAtomicBreath_beam","impact":"raceAtomicBreath_impact_tile"},"raceWingGust":{"aoe":"raceWingGust_aoe","impact":"raceWingGust_impact_tile"},"raceCataclysmStomp":{"aoe":"raceCataclysmStomp_aoe"},"raceTidalSlam":{"aoe":"raceTidalSlam_aoe"},"racePrimalRoar":{"aoe":"racePrimalRoar_aoe"},"raceAvalancheSlam":{"aoe":"raceAvalancheSlam_aoe"},"raceCrowStorm":{"aoe":"raceCrowStorm_aoe"},"raceDeafeningWail":{"aoe":"raceDeafeningWail_aoe"},"raceDepthCharge":{"aoe":"raceDepthCharge_aoe"},"raceSkyscraperToss":{"aoe":"raceSkyscraperToss_aoe"},"raceRiptide":{"aoe":"raceRiptide_aoe"},"sharedVortexSlam":{"aoe":"sharedVortexSlam_aoe"},"raceThunderclap":{"descent":"raceThunderclap_descent","impact":"thunder1_impact"},"raceFallenGrace":{"descent":"raceFallenGrace_descent","impact":"raceDarkDominion_impact_tile"},"raceWrathOfTheWatchers":{"descent":"raceWrathOfTheWatchers_descent","impact":"judgment_impact_tile"},"raceArtilleryStrike":{"descent":"raceArtilleryStrike_descent","impact":"nuke_impact_tile"},"raceCataclysmDecree":{"descent":"raceCataclysmDecree_descent","impact":"raceInfernalDecree_impact_tile"},"raceProphecyOfDisaster":{"descent":"raceProphecyOfDisaster_descent","impact":"raceTremorStomp_impact_tile"},"sharedNuke":{"descent":"sharedNuke_descent","impact":"nuke_impact_tile"},"raceSpectralPassage":{"teleport":"raceSpectralPassage_teleport"},"raceVoidStep":{"teleport":"raceVoidStep_teleport"},"raceMistForm":{"teleport":"raceMistForm_teleport"},"raceCryptidVanish":{"teleport":"raceCryptidVanish_teleport"},"raceCorpseCrawl":{"teleport":"raceCorpseCrawl_teleport"},"raceDeepDive":{"teleport":"raceDeepDive_teleport"},"raceEject":{"teleport":"raceEject_teleport"},"raceShadowInfiltration":{"teleport":"raceShadowInfiltration_teleport"},"raceBoulderHurl":{"impact":"raceBoulderHurl_impact"},"raceStoneThrow":{"impact":"_rockThrow_impact"},"raceJurassicJaw":{"impact":"raceJurassicJaw_impact"},"raceSyntheticBlade":{"impact":"_slashMelee_impact"},"raceSavageRend":{"impact":"_slashMelee_impact"},"raceRocketFist":{"impact":"_heavyPunch_impact"},"raceHydraulicPunch":{"impact":"_heavyPunch_impact"},"raceTaserBolt":{"impact":"raceTaserBolt_impact"},"raceRecursiveLoop":{"impact":"raceRecursiveLoop_impact"},"raceDarkJustice":{"impact":"raceDarkJustice_impact"},"raceAmbushLunge":{"impact":"raceAmbushLunge_impact"},"raceStonefall":{"impact":"raceStonefall_impact"},"raceMjolnirsEcho":{"impact":"raceMjolnirsEcho_impact"},"racePhotonScatter":{"impact":"racePhotonScatter_impact"},"raceDragonfear":{"impact":"raceDragonfear_impact"},"raceDrainingEmbrace":{"impact":"raceDrainingEmbrace_impact","drainHop":"lifeDrain_drainHop"},"raceGhoulishBite":{"impact":"raceGhoulishBite_impact","drainHop":"lifeDrain_drainHop"},"raceKissOfDecay":{"impact":"raceKissOfDecay_impact","drainHop":"lifeDrain_drainHop"},"raceBloodFrenzy":{"aura":"_buff_dark_aura"},"raceInnerDemon":{"aura":"_buff_dark_aura"},"raceConspiracyOfScales":{"aura":"_buff_unholy_aura"},"raceThroneOfCinders":{"aura":"_buff_dark_aura"},"raceBloodThrall":{"impact":"_dark_mark_impact"},"raceInvulnerable":{"aura":"_buff_divine_aura"},"raceProphecyFulfilled":{"aura":"_buff_divine_aura"},"raceRapture":{"aura":"_buff_divine_aura"},"raceWingsOfMercy":{"aura":"_buff_divine_aura"},"racePixieDustTrail":{"aura":"_buff_divine_aura"},"raceMimicry":{"aura":"_buff_anomaly_aura"},"raceNanocloud":{"aura":"_buff_tech_aura"},"raceReassemble":{"aura":"_selfHeal_unholy_aura"},"raceSelfRepairProtocol":{"aura":"_selfHeal_tech_aura"},"raceCarrionFeast":{"aura":"_selfHeal_unholy_aura"},"raceTinfoilFortress":{"aura":"raceTinfoilFortress_aura"},"raceTinkersContraption":{"aura":"raceTinkersContraption_aura"},"raceSwarmSignal":{"aura":"raceSwarmSignal_aura"},"raceBlizzardZone":{"aura":"_zoneDebuff_ice_aura"},"raceDarkMiasma":{"aura":"_zoneDebuff_dark_aura"},"sharedSmokeScreen":{"aura":"_zoneDebuff_smoke_aura"},"raceHealingTide":{"aura":"_zoneHeal_water_aura"},"raceSacredGrove":{"aura":"_zoneHeal_nature_aura"},"sharedGlacialTomb":{"descent":"sharedGlacialTomb_descent","impact":"sharedGlacialTomb_impact"},"sharedWardOfThorns":{"aura":"_deployObject_aura"},"raceBoneWall":{"aura":"_deployObject_aura"},"raceTeslaTrap":{"aura":"_deployObject_aura"},"raceTotemDrop":{"aura":"_deployObject_aura"},"raceOrichalcumBarrier":{"aura":"_deployObject_aura"},"sharedSummonBlizzard":{"aura":"_zoneDebuff_ice_aura","aoe":"sharedSummonBlizzard_aoe"},"sharedSummonBloodRain":{"aura":"_buff_unholy_aura"},"sharedSummonSandstorm":{"aura":"_deployObject_aura"},"sharedCallLightning":{"aura":"_buff_anomaly_aura"},"raceFrostbite":{"impact":"_ice_impact_tile"},"racePetrifyingGaze":{"impact":"_rockThrow_impact"},"raceSporeCloud":{"impact":"_poison_impact_tile"},"raceDigitalPlague":{"impact":"raceTaserBolt_impact"},"raceTimeDistortion":{"impact":"raceRecursiveLoop_impact"},"raceEntomb":{"impact":"_ice_impact_center"},"raceDoomMark":{"impact":"raceDarkJustice_impact"},"raceHexOfShattering":{"impact":"raceDarkJustice_impact"},"raceGrapplingHook":{"teleport":"raceEject_teleport"},"raceAbduct":{"teleport":"raceVoidStep_teleport"},"raceTongueGrab":{"teleport":"raceCryptidVanish_teleport"},"sharedTremorStep":{"teleport":"raceEject_teleport"},"raceTractorBeam":{"pull":"raceTractorBeam_column"},"raceAbductionBeam":{"impact":"racAbductionBeam_impact"},"raceProbe":{"impact":"raceProbe_impact"},"raceImplant":{"impact":"raceImplant_impact"},"raceWarOfTheWorlds":{"aura":"raceWarOfTheWorlds_deploy"},"raceStunRay":{"impact":"raceStunRay_impact"},"raceSpaceDisco":{"aoe":"raceSpaceDisco_aoe"},"raceGravityBoots":{"teleport":"raceGravityBoots_teleport"},"raceCharmBeam":{"impact":"raceStunRay_impact"},"racePlasmaWhip":{"impact":"racePlasmaWhip_impact"},"raceCorrosiveSplash":{"aoe":"raceCorrosiveSplash_aoe"},"raceAbsorb":{"impact":"raceAbsorb_impact","drainHop":"lifeDrain_drainHop"},"raceMitosisSplit":{"aura":"raceMitosisSplit_aura"},"raceOozeTrail":{"wall":"raceCorrosiveSplash_impact_tile"},"raceToxicNova":{"aoe":"raceToxicNova_aoe"},"raceStoneSkin":{"aura":"raceStoneSkin_aura"},"raceQuake":{"aoe":"raceQuake_aoe"},"raceAvalancheSmash":{"impact":"raceAvalancheSmash_impact"},"raceRamCharge":{"impact":"raceRamCharge_impact"},"raceExhaustCloud":{"aura":"raceExhaustCloud_aura"},"raceRoboPunch":{"impact":"raceRoboPunch_impact"},"raceMissileBarrage":{"aoe":"raceMissileBarrage_aoe"},"raceNitroBoost":{"aura":"raceNitroBoost_aura"},"raceIceSpear":{"impact":"raceIceSpear_impact"},"raceFrostThrone":{"aura":"raceFrostThrone_aura"},"raceDiamondDust":{"aoe":"raceDiamondDust_aoe"},"raceAbsoluteZero":{"impact":"raceAbsoluteZero_impact"},"raceUnstoppableCharge":{"impact":"raceUnstoppableCharge_impact"},"raceBrutalSlam":{"aoe":"raceBrutalSlam_aoe"},"raceThickHide":{"aura":"raceThickHide_aura"},"raceBodyCheck":{"impact":"raceBodyCheck_impact"},"raceRampage":{"aura":"raceRampage_aura"},"raceKiBlast":{"impact":"raceKiBlast_impact_v2"},"raceFlurryOfBlows":{"impact":"raceFlurryOfBlows_impact"},"raceKiCharge":{"aura":"raceKiCharge_aura"},"raceKiWave":{"beam":"raceKiWave_beam"},"raceDragonFist":{"impact":"raceDragonFist_impact"},"raceInstantTransmission":{"teleport":"raceInstantTransmission_teleport"},"raceExcaliburStrike":{"impact":"raceExcaliburStrike_impact"},"raceRoyalDecree":{"aura":"raceRoyalDecree_aura"},"raceHolyAvenger":{"beam":"raceHolyAvenger_cross"},"raceKnightsOath":{"teleport":"raceKnightsOath_teleport"},"raceChestPound":{"aoe":"raceChestPound_aoe"},"racePrimalSmash":{"impact":"racePrimalSmash_impact"},"raceBoulderThrow":{"impact":"raceBoulderHurl_impact"},"raceApeFury":{"aura":"raceApeFury_aura"},"raceGroundSlam":{"aoe":"raceGroundSlam_aoe"},"raceBullRush":{"impact":"raceBullRush_impact"},"raceGore":{"impact":"raceGore_impact"},"raceLabyrinthRoar":{"aoe":"raceLabyrinthRoar_aoe"},"raceMazeWard":{"wall":"raceQuake_impact_tile"},"raceHornToss":{"impact":"raceHornToss_impact"},"raceSoulDrain":{"impact":"raceSoulDrain_impact","drainHop":"lifeDrain_drainHop"},"raceBoneBarrage":{"aoe":"raceBoneBarrage_aoe"},"raceCurseOfDecay":{"impact":"_dark_shadow_impact"},"raceDeathPact":{"aura":"_buff_dark_aura"},"racePlaguefield":{"aura":"racePlaguefield_aura"},"raceDarkResurrection":{"aura":"raceDarkResurrection_aura"},"raceDeathGaze":{"impact":"raceDeathGaze_impact"},"raceOmniVision":{"aura":"raceOmniVision_aura"},"racePsychicBeam":{"beam":"racePsychicBeam_beam"},"raceHypnoticPulse":{"impact":"raceDeathGaze_impact"},"racePupilShield":{"aura":"racePupilShield_aura"},"raceHailMary":{"impact":"raceHailMary_impact"},"raceBulletPass":{"beam":"raceBulletPass_beam"},"raceBlitz":{"impact":"raceBlitz_impact"},"raceAudible":{"aura":"raceAudible_aura"},"raceSpikeTheBall":{"aoe":"raceSpikeTheBall_aoe"},"raceEndZoneDance":{"aura":"raceEndZoneDance_aura"},"racePrecisionShot":{"impact":"racePrecisionShot_impact"},"raceArrowRain":{"aoe":"raceArrowRain_aoe"},"raceStealFromRich":{"impact":"raceStealFromRich_impact"},"raceForestAmbush":{"aura":"raceForestAmbush_aura"},"raceSplittingArrow":{"impact":"racePrecisionShot_impact"},"raceGiftOfHealing":{"aura":"raceGiftOfHealing_aura_v2"},"raceLumpOfCoal":{"impact":"raceLumpOfCoal_impact_v2"},"raceNaughtyList":{"impact":"raceNaughtyList_impact_v2"},"raceChristmasSpirit":{"aura":"raceChristmasSpirit_aura_v2"},"raceSleighDash":{"teleport":"raceSleighDash_teleport_v2"},"raceBlizzardPresent":{"aoe":"raceBlizzardPresent_aoe_v2"},"sentaiRedSlash":{"impact":"sentaiRedSlash_impact"},"sentaiBlueWave":{"beam":"sentaiBlueWave_beam"},"sentaiBlackGuard":{"aura":"sentaiBlackGuard_aura"},"sentaiGreenArrow":{"impact":"sentaiGreenArrow_impact"},"sentaiYellowThunder":{"aoe":"sentaiYellowThunder_aoe"},"sentaiPinkHeal":{"aura":"sentaiPinkHeal_aura"},"sentaiTeamStrike":{"impact":"sentaiTeamStrike_impact_v2"},"sentaiMegazordBlast":{"aoe":"sentaiMegazordBlast_aoe","impact":"sentaiMegazordBlast_impact_center_v2"},"raceTendrilStrike":{"impact":"raceTendrilStrike_impact"},"raceSymbioticDrain":{"impact":"raceSymbioticDrain_impact","drainHop":"lifeDrain_drainHop"},"raceWebLaunch":{"impact":"raceWebLaunch_impact"},"raceSymbioteArmor":{"aura":"raceSymbioteArmor_aura"},"racePredatorLeap":{"impact":"raceTendrilStrike_impact"},"raceValkyrieSpear":{"impact":"raceValkyrieSpear_impact"},"raceDivineSwoop":{"impact":"raceValkyrieSpear_impact"},"raceChooserOfSlain":{"aura":"raceChooserOfSlain_aura"},"raceShieldMaiden":{"aura":"raceShieldMaiden_aura"},"raceNordicWarcry":{"aura":"raceNordicWarcry_aura"},"raceCosmicSight":{"aura":"raceCosmicSight_aura"},"raceRealityPulse":{"aoe":"raceRealityPulse_aoe"},"raceTemporalShift":{"teleport":"raceTemporalShift_teleport"},"raceJudgmentBeam":{"beam":"raceJudgmentBeam_beam"},"raceAstralBarrier":{"aura":"raceAstralBarrier_aura"},"_turretBlast":{"beam":"_turretBlast_beam","impact":"_turretBlast_impact"},"raceContract":{"impact":"_dark_mark_impact"},"raceCanopicCurse":{"impact":"_dark_mark_impact"},"raceVassalage":{"impact":"_dark_mark_impact"},"raceInfernalConscription":{"impact":"_dark_mark_impact"},"raceShadowBind":{"impact":"raceShadowBind_impact"},"racePossession":{"impact":"_psychic_dark_impact"},"raceCharm":{"impact":"_psychic_dark_impact"},"raceBrainwash":{"impact":"_psychic_dark_impact"},"raceHexOfAgony":{"impact":"raceHexOfAgony_impact"},"raceBlackPhillipsGaze":{"impact":"_eldritch_gaze_impact"},"raceRedEyes":{"impact":"_eldritch_gaze_impact"},"raceDarkFeather":{"impact":"_dark_shadow_impact"},"raceCurseOfMisfortune":{"impact":"_dark_debuff_impact"},"raceMemoryLeak":{"impact":"_dark_debuff_impact"},"raceBlueScreen":{"impact":"_dark_debuff_impact"},"raceHighNoon":{"impact":"_rangedShot_impact"},"raceHeadshot":{"impact":"_rangedShot_impact"},"raceClassifiedWeapon":{"impact":"_rangedShot_impact"},"raceSuppressiveFire":{"beam":"plasmaGun_beam","impact":"_rangedShot_impact"},"raceFanTheHammer":{"aoe":"raceChassisSlan_aoe","impact":"_rangedShot_impact"},"racePredictiveModel":{"impact":"raceProbe_impact"},"raceSpotterMark":{"impact":"raceProbe_impact"},"raceDeneuralizer":{"impact":"_dark_debuff_impact"},"raceExecutiveOrder":{"impact":"_dark_debuff_impact"},"raceSandglassPrison":{"impact":"_dark_debuff_impact"},"racePermafrost":{"impact":"raceAbsoluteZero_impact"},"raceSirenSong":{"impact":"_psychic_dark_impact"},"raceNeuralHack":{"impact":"raceTaserBolt_impact"},"raceManaShield":{"aura":"_buff_unholy_aura"},"raceConcealedPosition":{"aura":"camouflage_aura"},"raceSpiritWalk":{"teleport":"raceShadowStep_teleport"},"raceAgentVanish":{"teleport":"raceNimbleDodge_teleport"},"raceTumbleweed":{"teleport":"raceEject_teleport"},"raceSkinSwap":{"teleport":"raceVoidStep_teleport"},"raceDimensionalFold":{"teleport":"raceVoidStep_teleport"},"raceInkCloud":{"aura":"_zoneDebuff_dark_aura"},"raceWhiteout":{"aura":"_zoneDebuff_ice_aura"},"raceFilibuster":{"aura":"_zoneDebuff_smoke_aura"},"raceHeatDeath":{"aura":"_zoneDebuff_dark_aura"},"raceTemporalTide":{"aura":"raceTidalBlessing_aura"},"raceCorruptedSanctuary":{"aura":"raceSanctuary_aura"},"raceShamblingHorde":{"aura":"_deployObject_aura"},"raceStuffedDouble":{"aura":"_deployObject_aura"},"raceCatsCradle":{"aura":"_deployObject_aura"},"raceLucidTrap":{"aura":"_deployObject_aura"},"racePhantomDouble":{"aura":"_deployObject_aura"},"raceCloneDecoy":{"aura":"_deployObject_aura"},"racePowderKeg":{"aura":"_deployObject_aura"},"raceFlashbangMine":{"aura":"_deployObject_aura"},"raceGravePassage":{"aura":"_deployObject_aura"},"raceTunnelNetwork":{"aura":"_deployObject_aura"},"raceClockworkTurret":{"aura":"deployTurret_aura"},"raceOathOfValor":{"aura":"warCry_aura"},"raceTelepathicLink":{"aura":"raceSwarmSignal_aura"},"raceCrystalBall":{"aura":"_buff_anomaly_aura"},"raceTarotDraw":{"aura":"_buff_anomaly_aura"},"raceImprovise":{"aura":"_buff_anomaly_aura"},"raceDivineLight":{"aura":"heal1_aura"},"raceHerbalRemedy":{"aura":"cleanse_aura"},"raceSpiritChannel":{"aura":"cleanse_aura"},"raceAyahuascaRetreat":{"aura":"raceWildResilience_aura"},"raceArcaneBlast":{"aoe":"raceGlitterburst_aoe","impact":"raceGlitterburst_impact_tile"},"raceOvercharge":{"aoe":"raceEMPGrenade_aoe","impact":"raceEMPGrenade_impact_tile"},"raceMindCrush":{"impact":"mindShatter_impact"},"raceChainLightning":{"impact":"thunder1_impact","chain":"thunder1_chain_hop"}}};

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

/* ─── WALL OF FIRE — hand-authored "real fire" override ──────────────────
   The auto-generated wallOfFire_tile read as a couple of flat flame quads.
   This rebuilds it as a dense, layered, flickering sheet of flame: a warm
   ground glow, many tapered flame tongues of varied width/height spread
   across the whole tile, a bright white-hot core, fast licking tips, rising
   embers and drifting smoke. `_loop`/`_loopMs` (honored by _fireWall) make
   it re-ignite several times so it reads as a sustained roaring wall rather
   than a one-shot puff. Lifetimes overlap the loop interval for continuity. */
EFFECTS['wallOfFire_tile'] = {
    _loop: 8,
    _loopMs: 300,
    layers: [
        /* scorched ground decal */
        { anchor: 'floor', mode: 'world', sprite: 'scorch', ml: 1100, z: 1,
          size0: 120, size1: 140, opacity0: 0.85, opacity1: 0 },
        /* broad warm light pool */
        { anchor: 'floor', mode: 'world', sprite: 'fire-glow', ml: 700, z: 2,
          size0: 132, size1: 156, opacity0: 0.5, opacity1: 0 },
        /* tight bright glow at the base */
        { anchor: 'floor', mode: 'world', sprite: 'fire-glow', ml: 480, z: 3,
          size0: 64, size1: 96, opacity0: 0.85, opacity1: 0 },
        /* main roaring tongues — fill the tile width, tall and tapered */
        { anchor: 'floor', mode: 'y-locked', sprite: 'flame', count: 5, offsetXY: 36,
          ml: [560, 880], w0: [26, 42], w1: [10, 18], h0: [44, 66], h1: [150, 220],
          opacity0: 0.9, opacity1: 0 },
        /* mid-height body flames — denser, narrower */
        { anchor: 'floor', mode: 'y-locked', sprite: 'flame', count: 7, offsetXY: 46,
          ml: [420, 700], w0: [16, 26], w1: [6, 12], h0: [30, 52], h1: [92, 150],
          opacity0: 0.95, opacity1: 0 },
        /* white-hot core up the centre */
        { anchor: 'floor', mode: 'y-locked', sprite: 'flame-hot', count: 3, offsetXY: 22,
          ml: [460, 720], w0: [18, 30], w1: [8, 14], h0: [42, 62], h1: [104, 156],
          opacity0: 1, opacity1: 0 },
        /* fast licking flame tips — flicker, rise slightly */
        { anchor: 'floor', mode: 'y-locked', sprite: 'flame', count: 7, offsetXY: 42,
          ml: [180, 360], w0: [8, 14], w1: [3, 7], h0: [16, 28], h1: [52, 96],
          opacity0: 1, opacity1: 0, vzRange: [20, 70] },
        /* rising embers / sparks */
        { anchor: 'floor', mode: 'billboard', sprite: 'ember', count: 10, offsetXY: 50,
          ml: [500, 900], z: 8, size0: [4, 9], size1: 1,
          vxRange: 90, vyRange: 90, vzRange: [80, 210], gravity: 280, drag: 1.3,
          opacity0: 1, opacity1: 0 },
        /* drifting smoke crown */
        { anchor: 'floor', mode: 'billboard', sprite: 'smoke', count: 2, delayMs: 160,
          ml: [800, 1300], z: 32, size0: [40, 56], size1: [110, 150],
          vzRange: [28, 56], drag: 0.4, opacity0: 0.5, opacity1: 0 },
    ]
};

/* ─── CROP CIRCLE — hand-authored hovering UFO + descending beam ─────────
   raceCropCircle is a kind:'aoe' spell with no telegraph of its own. Mapping
   it as a "descent" routes it through the cinematic ground-view descent camera
   and the descent VFX pipeline (telegraph ring → body → impact bursts). The
   saucer is a real 3D model (_sigUFO3D, spawned via _spell3DGeometry) that
   swoops in and HOVERS high over the target; the BEAM (a stepped column of
   ring sprites + a psi-pulse shaft + the saucer's own tractor cone) travels
   DOWN from the hull to the ground. When the beam lands (impact) the saucer
   blasts off. The actual crop-circle imprint in the ground is produced by
   the spell's terrainDeform when damage resolves. */
EFFECTS['raceCropCircle_descent'] = {
    descentMs: 1100,
    telegraphMs: 500,
    aoeRadius: 2,
    telegraphSprite: 'target-ring-green',
    impactTileEffect: 'raceCropCircle_impact_tile',
    impactCenterEffect: 'raceCropCircle_impact_center',
    shape: 'square',
    layers: [
        /* the saucer itself is a REAL 3D MODEL now — lathe hull, glass dome,
           chasing rim lights, tractor cone — spawned at descent start via
           _spell3DGeometry.raceCropCircle (see the SIGNATURE 3D section).
           The stepped ring column + shaft below stay sprite-based. */
        /* THE BEAM — a stepped ring column that punches DOWN from the hull
           (just under the saucer at ~z300) to the ground; rising delays make
           the leading edge read as descending */
        { delayMs: 60,  anchor: 'floor', mode: 'world', sprite: 'ring-1', ml: 1500, z: 296, w0: 30, w1: 30, h0: 30, h1: 30, opacity0: 0.9 },
        { delayMs: 130, anchor: 'floor', mode: 'world', sprite: 'ring-2', ml: 1430, z: 254, w0: 40, w1: 40, h0: 40, h1: 40, opacity0: 0.9 },
        { delayMs: 200, anchor: 'floor', mode: 'world', sprite: 'ring-3', ml: 1360, z: 212, w0: 52, w1: 52, h0: 52, h1: 52, opacity0: 0.9 },
        { delayMs: 270, anchor: 'floor', mode: 'world', sprite: 'ring-4', ml: 1290, z: 168, w0: 64, w1: 64, h0: 64, h1: 64, opacity0: 0.9 },
        { delayMs: 340, anchor: 'floor', mode: 'world', sprite: 'ring-5', ml: 1220, z: 124, w0: 76, w1: 76, h0: 76, h1: 76, opacity0: 0.9 },
        { delayMs: 410, anchor: 'floor', mode: 'world', sprite: 'ring-6', ml: 1150, z: 78,  w0: 84, w1: 84, h0: 84, h1: 84, opacity0: 0.9 },
        { delayMs: 480, anchor: 'floor', mode: 'world', sprite: 'ring-7', ml: 1080, z: 34,  w0: 88, w1: 88, h0: 88, h1: 88, opacity0: 0.9 },
        { delayMs: 550, anchor: 'floor', mode: 'world', sprite: 'ring-5', ml: 1000, z: 6,   w0: 90, w1: 86, h0: 90, h1: 86, opacity0: 0.9 },
        /* the vertical beam shaft, growing tall as the beam reaches the ground */
        { delayMs: 200, anchor: 'floor', mode: 'y-locked', sprite: 'psi-pulse', ml: 1100, w0: 64, w1: 44, h0: 60, h1: 320, opacity0: 0.8 },
        /* widening green target imprint on the ground */
        { delayMs: 120, anchor: 'floor', mode: 'world', sprite: 'target-ring-green', ml: 1700, z: 2, size0: 60, size1: 150, opacity0: 0.8 },
        /* drifting green haze + rising motes inside the beam */
        { count: 3, delayMs: 350, anchor: 'floor', sprite: 'void-mist', ml: [900, 1400], z: 30, offsetXY: 22, vzRange: [20, 60], drag: 0.3, size0: [24, 40], size1: [60, 90], opacity0: 0.55 },
        { count: 4, delayMs: 600, anchor: 'floor', sprite: 'psi-pulse', ml: [500, 800], z: [4, 20], offsetXY: 14, vzRange: [80, 160], drag: 0.2, size0: [4, 9], size1: [1, 3], opacity0: 0.9 },
    ]
};

EFFECTS['raceCropCircle_impact_tile'] = {
    layers: [
        { anchor: 'floor', mode: 'world', sprite: 'scorch', ml: 2200, z: 1, size0: 110, size1: 132, opacity0: 0.6 },
        { count: 4, anchor: 'floor', sprite: 'dust-puff', ml: [350, 600], z: 2, offsetXY: 12, vxRange: 60, vyRange: 60, vzRange: [10, 40], gravity: 80, drag: 0.9, size0: [8, 14], size1: [22, 36], opacity0: 0.55 },
        { count: 3, anchor: 'floor', sprite: 'void-mist', ml: [500, 900], z: 8, offsetXY: 16, vzRange: [15, 45], drag: 0.4, size0: [14, 22], size1: [38, 58], opacity0: 0.45 },
    ]
};

EFFECTS['raceCropCircle_impact_center'] = {
    shake: 'soft',
    layers: [
        { sprite: 'flash', ml: 360, z: 10, size0: 160, size1: 40 },
        { anchor: 'floor', mode: 'world', sprite: 'target-ring-green', ml: 900, z: 2, size0: 80, size1: 200, opacity0: 0.7 },
    ]
};

SPELL_MAP['raceCropCircle'] = { descent: 'raceCropCircle_descent' };

/* ─── BULLET RAIN (shootout) — tile-targeted suppressing fire ────────────
   Mapped as a "descent" so it routes through the ground-view sky-strike
   camera (tilt up to watch the rounds fall in, then resolve down onto the
   marked tile). The descending body — the actual stream of bullets pouring
   down on the 3×3 — is drawn by _spell3DGeometry.shootout; here we just supply
   the telegraph ring + per-tile spark/dust impacts and the timing the camera
   reads via getDescentTelegraphMs / getDescentDescentMs. */
EFFECTS['shootout_descent'] = {
    telegraphMs: 520,
    descentMs: 680,
    aoeRadius: 1,
    telegraphSprite: 'target-ring',
    impactTileEffect: 'shootout_impact_tile',
    impactCenterEffect: 'shootout_impact_center',
    shape: 'square',
    layers: [],
};

EFFECTS['shootout_impact_tile'] = {
    layers: [
        { count: 5, anchor: 'floor', sprite: 'steel-spark', ml: [200, 340], z: 4, offsetXY: 18,
          vxRange: 80, vyRange: 80, vzRange: [40, 120], gravity: 160, drag: 0.6,
          size0: [6, 12], size1: [1, 3], opacity0: 0.95, opacity1: 0 },
        { count: 3, anchor: 'floor', sprite: 'dust-puff', ml: [300, 520], z: 2, offsetXY: 14,
          vxRange: 50, vyRange: 50, vzRange: [10, 35], gravity: 90, drag: 0.9,
          size0: [8, 14], size1: [20, 32], opacity0: 0.5, opacity1: 0 },
    ]
};

EFFECTS['shootout_impact_center'] = {
    shake: 'soft',
    layers: [
        { sprite: 'muzzle-flash', ml: 240, z: 12, size0: 90, size1: 30, opacity0: 0.9, opacity1: 0 },
        { anchor: 'floor', mode: 'world', sprite: 'target-ring', ml: 700, z: 2, size0: 70, size1: 180, opacity0: 0.6, opacity1: 0 },
    ]
};

SPELL_MAP['shootout'] = { descent: 'shootout_descent' };

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

    /* ── SIGNATURE ARSENAL WIRING ─────────────────────────────────────────
       Cannonball rides the bolt pipeline purely so the 3D carronade learns
       both caster and target — _fireBoltMapped intercepts it before any
       generic bolt is drawn. The bite spells below previously had no impact
       mapping at all, so the jaws hook could never fire; give them one. */
    if (!SPELL_MAP['raceCannonball']) SPELL_MAP['raceCannonball'] = {};
    SPELL_MAP['raceCannonball'].bolt = '_bolt_rock';
    if (!SPELL_MAP['raceFeralDive']) SPELL_MAP['raceFeralDive'] = { impact: 'racePounce_impact' };
    if (!SPELL_MAP['raceLoveBite']) SPELL_MAP['raceLoveBite'] = { impact: 'raceInfectiousBite_impact' };

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

        /* Descent-mapped spells already fire their bespoke 3D geometry from
           the descent pipeline — don't double-fire it on the impact intent. */
        if (_spell3DGeometry[spellId] && intent === 'impact'
            && !(SPELL_MAP[spellId] && SPELL_MAP[spellId].descent)) {
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
                if (typeof playSfx === 'function') playSfx('jetFlyover');
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

                // Big detonation sfx for nuke / meteor / artillery style strikes.
                if (typeof playSfx === 'function'
                    && (spellId === 'nuke' || spellId === 'sharedNuke' || spellId === 'raceArtilleryStrike'
                        || spellId === 'meteor' || spellId === 'raceCosmicSlam' || spellId === 'raceInfernalDecree')) {
                    playSfx('explosion');
                }

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
        /* Sustained walls (e.g. Wall of Fire) re-ignite several times so the
           flames read as a continuous roar instead of a single burst. Each
           re-emission re-randomizes the flame tongues for a live flicker. */
        var loops = Math.max(1, wallDef._loop || 1);
        var loopMs = wallDef._loopMs || 0;
        for (var i = 0; i < tiles.length; i++) {
            (function(t, baseDelay) {
                for (var r = 0; r < loops; r++) {
                    (function(rep) {
                        window.setTimeout(function() {
                            if (_suppressed()) return;
                            _spawnEffect(wallDef, { tx: t.x, ty: t.y });
                        }, baseDelay + rep * loopMs);
                    })(r);
                }
            })(tiles[i], i * stagger);
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

        /* ── SIGNATURE WEAPON RIGS — the bolt intent is the one place that
           knows both caster and target, so the 3D cannon/guns hook in here.
           The cannon replaces the bolt entirely (it flies its own iron ball
           and detonates on landing); the guns are summoned alongside the
           bolt, which stays on as tracer + impact. ─────────────────────── */
        if (spellId === 'raceCannonball') {
            try {
                _sigCannonShot3D(fromTx, fromTy, toTx, toTy, { flyMs: params.flyMs, aoeRadius: 1 });
                return;
            } catch (e) { /* fall through to the generic bolt */ }
        }
        if (_SIG_GUN_FOR[spellId]) {
            try { _sigGunRig3D(_SIG_GUN_FOR[spellId], fromTx, fromTy, toTx, toTy, { flyMs: params.flyMs }); } catch (e) {}
        }

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
        /* params.headGlow lets the caller force the bright traveling head off
           (used by sprite-based projectiles so the PNG stays the visible head). */
        var headGlow     = (params.headGlow != null) ? !!params.headGlow : (boltDef.boltHeadGlow !== false);
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
        var headGlow     = (params.headGlow != null) ? !!params.headGlow : (boltDef.boltHeadGlow !== false);

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
                e.spawnAcc += dtMs;
                while (e.spawnAcc >= e.trailRate) {
                    e.spawnAcc -= e.trailRate;

                    /* ── Bright traveling head (large core + inner white flash).
                       Skipped when headGlow is off — e.g. sprite-based projectiles
                       (bullet.png / knife) where the PNG itself IS the visible head
                       and a bright core sitting on top would wash it out. ── */
                    if (e.headGlow) {
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
                    }

                    /* Trail particles (drift backward) — always spawn so the shot
                       still reads as moving and the sprite gets an enhancing trail. */
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
    var _bulletTexCache = null;

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
    function _getBulletTexture() {
        if (_bulletTexCache) return _bulletTexCache;
        _bulletTexCache = _loadCachedTex('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/projectiles/bullet.png');
        return _bulletTexCache;
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

    /* ── Probe: a grey UFO hovers over the target, drops an abduction beam, and
       extends a metallic probe needle straight down to pierce the victim. All
       built from THREE geometry (no sprites). Pierce lands ~700ms in so battle.js
       can sync damage to it. ── */
    function _spawnProbeDescent3D(tx, ty) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var boost = unitZBoost();

        var hoverY = wp.y + ts * 2.7;       // saucer centre hover height
        var bodyR = ts * 0.55;
        var bodyH = ts * 0.22;
        var pierceY = wp.y + ts * 0.25;     // where the needle tip ends up (in the target)

        var shaftR = ts * 0.035;
        var tipR = ts * 0.075;
        var tipLen = ts * 0.2;

        // Saucer body (grey metal hull)
        var bodyGeo = new THREE.SphereGeometry(1, 20, 12);
        var matBody = new THREE.MeshBasicMaterial({ color: 0x9aa3b2, transparent: true, opacity: 0, depthWrite: true });
        var body = new THREE.Mesh(bodyGeo, matBody);
        body.renderOrder = 160; scene.add(body);

        // Darker metallic equator rim
        var rimGeo = new THREE.TorusGeometry(1, 0.13, 8, 24);
        var matRim = new THREE.MeshBasicMaterial({ color: 0x59626f, transparent: true, opacity: 0, depthWrite: true });
        var rim = new THREE.Mesh(rimGeo, matRim);
        rim.rotation.x = Math.PI / 2; rim.renderOrder = 161; scene.add(rim);

        // Glass cockpit dome
        var domeGeo = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var matDome = new THREE.MeshBasicMaterial({ color: 0x99e0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        var dome = new THREE.Mesh(domeGeo, matDome);
        dome.renderOrder = 162; scene.add(dome);

        // Under-belly glow disc
        var glowGeo = new THREE.CircleGeometry(1, 24);
        var matGlow = new THREE.MeshBasicMaterial({ color: 0x66ffaa, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        var glow = new THREE.Mesh(glowGeo, matGlow);
        glow.rotation.x = -Math.PI / 2; glow.renderOrder = 159; scene.add(glow);

        // Abduction beam cone
        var beamGeo = new THREE.CylinderGeometry(0.18, 1, 1, 20, 1, true);
        var matBeam = new THREE.MeshBasicMaterial({ color: 0x55ff99, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        var beam = new THREE.Mesh(beamGeo, matBeam);
        beam.renderOrder = 158; scene.add(beam);

        // Probe shaft (polished metal)
        var shaftGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
        var matShaft = new THREE.MeshBasicMaterial({ color: 0xc6cdd8, transparent: true, opacity: 0, depthWrite: true });
        var shaft = new THREE.Mesh(shaftGeo, matShaft);
        shaft.renderOrder = 164; scene.add(shaft);

        // Probe tip (sharp cone, points down)
        var tipGeo = new THREE.ConeGeometry(1, 1, 10);
        var matTip = new THREE.MeshBasicMaterial({ color: 0x767f8d, transparent: true, opacity: 0, depthWrite: true });
        var tip = new THREE.Mesh(tipGeo, matTip);
        tip.rotation.x = Math.PI; tip.renderOrder = 165; scene.add(tip);

        // Pierce flash
        var flashGeo = new THREE.SphereGeometry(1, 12, 8);
        var matFlash = new THREE.MeshBasicMaterial({ color: 0xccffdd, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        var flash = new THREE.Mesh(flashGeo, matFlash);
        flash.renderOrder = 166; scene.add(flash);

        var totalMs = 1350;
        var entry = { meshes: [body, rim, dome, glow, beam, shaft, tip, flash], done: false };

        _animate3D(entry, totalMs, function(elapsed) {
            var appearE = Math.min(elapsed / 320, 1); appearE = 1 - Math.pow(1 - appearE, 3);
            var beamT = Math.max(0, Math.min((elapsed - 320) / 230, 1));

            var ext; // probe extension 0 (retracted) .. 1 (fully pierced)
            if (elapsed < 550) ext = 0;
            else if (elapsed < 700) { var s = (elapsed - 550) / 150; ext = s * s; }
            else if (elapsed < 900) ext = 1;
            else { var r = Math.min((elapsed - 900) / 450, 1); ext = 1 - (1 - Math.pow(1 - r, 2)); }

            var fade = elapsed < 900 ? 1 : 1 - Math.min((elapsed - 900) / 450, 1);
            var ascend = elapsed < 900 ? 0 : Math.min((elapsed - 900) / 450, 1) * ts * 0.9;

            var curHoverY = hoverY + ts * 0.6 * (1 - appearE) + ascend;
            var curBottomY = curHoverY - bodyH * 0.5;

            body.position.set(wp.x, curHoverY, wp.z);
            body.scale.set(bodyR, bodyH, bodyR);
            body.rotation.y = elapsed * 0.002;
            matBody.opacity = appearE;

            rim.position.set(wp.x, curHoverY, wp.z);
            rim.scale.set(bodyR * 0.99, bodyR * 0.99, bodyH * 1.3);
            rim.rotation.z = elapsed * 0.002;
            matRim.opacity = appearE;

            dome.position.set(wp.x, curHoverY + bodyH * 0.35, wp.z);
            dome.scale.set(bodyR * 0.45, bodyR * 0.42, bodyR * 0.45);
            matDome.opacity = appearE * 0.5;

            var glowPulse = 1 + 0.18 * Math.sin(elapsed * 0.02);
            glow.position.set(wp.x, curBottomY - 2, wp.z);
            glow.scale.set(bodyR * 0.7 * glowPulse, bodyR * 0.7 * glowPulse, 1);
            matGlow.opacity = appearE * (0.35 + 0.15 * Math.sin(elapsed * 0.02)) * fade;

            var beamLen = Math.max(1, curBottomY - wp.y);
            beam.position.set(wp.x, wp.y + beamLen * 0.5, wp.z);
            beam.scale.set(bodyR * 0.85 * beamT, beamLen, bodyR * 0.85 * beamT);
            beam.rotation.y = elapsed * 0.001;
            matBeam.opacity = beamT * 0.2 * fade;

            // Needle: tip slides from saucer belly down to pierceY
            var tipY = curBottomY - (curBottomY - pierceY) * ext;
            var shaftLen = Math.max(1, curBottomY - (tipY + tipLen));
            shaft.position.set(wp.x, curBottomY - shaftLen * 0.5, wp.z);
            shaft.scale.set(shaftR, shaftLen, shaftR);
            matShaft.opacity = Math.min(1, ext * 6) * fade;

            tip.position.set(wp.x, tipY + tipLen * 0.5, wp.z);
            tip.scale.set(tipR, tipLen, tipR);
            matTip.opacity = Math.min(1, ext * 6) * fade;

            var fl = (elapsed >= 680 && elapsed < 900) ? (1 - Math.abs(elapsed - 760) / 110) : 0;
            fl = Math.max(0, fl);
            var fs = ts * (0.12 + 0.18 * (1 - fl));
            flash.position.set(wp.x, pierceY, wp.z);
            flash.scale.set(fs, fs, fs);
            matFlash.opacity = fl * 0.85;
        });
    }

    /* ── Trunk Throw: hurls an actual tree (the same cone-trunk + sphere-canopy
       geometry the game uses for trees) on a parabolic arc, tumbling end over
       end, from caster to target. ── */
    function _spawnTrunkThrow3D(fromTx, fromTy, toTx, toTy, travelMs) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp0 = _worldPos(fromTx, fromTy);
        var wp1 = _worldPos(toTx, toTy);
        var ts = wp0.ts;
        var boost = unitZBoost();

        var trunkH = ts * 0.95, trunkR = ts * 0.13, canopyR = ts * 0.42;

        var group = new THREE.Group();

        var trunkGeo = new THREE.ConeGeometry(trunkR, trunkH, 8, 1, false);
        var matTrunk = new THREE.MeshBasicMaterial({ map: _getWoodTexture(), transparent: true, opacity: 1, depthWrite: true });
        var trunk = new THREE.Mesh(trunkGeo, matTrunk);
        trunk.position.y = 0;
        group.add(trunk);

        var canopyGeo = new THREE.SphereGeometry(canopyR, 12, 8);
        var matCanopy = new THREE.MeshBasicMaterial({ map: _getForestTexture(), transparent: true, opacity: 1, depthWrite: true });
        var canopy = new THREE.Mesh(canopyGeo, matCanopy);
        canopy.position.y = trunkH * 0.55;
        canopy.scale.set(1, 0.85, 1);
        group.add(canopy);

        group.position.set(wp0.x, wp0.y + boost, wp0.z);
        group.renderOrder = 162;
        scene.add(group);

        var shadowGeo = new THREE.CircleGeometry(canopyR * 0.85, 12);
        var shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
        var shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(wp0.x, wp0.y + 2, wp0.z);
        shadow.renderOrder = 140;
        scene.add(shadow);

        var durMs = travelMs || 550;
        var dx = wp1.x - wp0.x, dz = wp1.z - wp0.z;
        var flatDist = Math.sqrt(dx * dx + dz * dz);
        var arcPeak = Math.max(ts * 1.4, flatDist * 0.45);
        var travelAngle = Math.atan2(dz, dx);

        var entry = { meshes: [group, trunk, canopy, shadow], done: false };

        _animate3D(entry, durMs, function(elapsed) {
            var t = Math.min(elapsed / durMs, 1);

            var cx = wp0.x + (wp1.x - wp0.x) * t;
            var cz = wp0.z + (wp1.z - wp0.z) * t;
            var baseY = (wp0.y + boost) + ((wp1.y + boost) - (wp0.y + boost)) * t;
            var arc = arcPeak * 4 * t * (1 - t);
            var cy = baseY + arc;

            group.position.set(cx, cy, cz);
            group.rotation.set(0, 0, 0);
            group.rotateY(travelAngle);
            group.rotateX(elapsed * 0.012);

            var groundY = wp0.y + (wp1.y - wp0.y) * t;
            shadow.position.set(cx, groundY + 2, cz);
            var h = cy - groundY;
            var ss = Math.max(0.3, 1 - h / (arcPeak * 2));
            shadow.scale.set(ss, ss, ss);
            shadowMat.opacity = 0.3 * ss;
        });
    }

    /* ── Bullet Rain: fires a spray of bullet sprites up into the air from the
       caster; they arc over and rain down onto the target. Call once per target
       so a sweep across enemies reads as a continuous downpour. Bullets land at
       ~landMs so battle.js can match damage to the impact. ── */
    function _spawnBulletRain3D(srcTx, srcTy, toTx, toTy, landMs) {
        var scene = _getVFXScene();
        if (!scene) return;

        var wp0 = _worldPos(srcTx, srcTy);
        var wp1 = _worldPos(toTx, toTy);
        var ts = wp0.ts;
        var boost = unitZBoost();
        var tex = _getBulletTexture();

        var count = 6;
        var dur = landMs || 400;

        for (var i = 0; i < count; i++) {
            (function(idx) {
                window.setTimeout(function() {
                    if (_suppressed()) return;
                    var sc = _getVFXScene();
                    if (!sc) return;

                    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                    var spr = new THREE.Sprite(mat);
                    var sz = ts * 0.22;
                    spr.scale.set(sz, sz, sz);

                    var sx = wp0.x + rn(-ts * 0.15, ts * 0.15);
                    var sz0 = wp0.z + rn(-ts * 0.15, ts * 0.15);
                    var sy = wp0.y + boost;
                    var ex = wp1.x + rn(-ts * 0.32, ts * 0.32);
                    var ez = wp1.z + rn(-ts * 0.32, ts * 0.32);
                    var ey = wp1.y + boost * 0.4;
                    var peak = Math.max(ts * 2.0, Math.abs(ex - sx) * 0.5) + rn(0, ts * 0.6);

                    spr.position.set(sx, sy, sz0);
                    spr.renderOrder = 166;
                    sc.add(spr);

                    var entry = { meshes: [spr], done: false };
                    _animate3D(entry, dur, function(elapsed) {
                        var t = Math.min(elapsed / dur, 1);
                        var cx = sx + (ex - sx) * t;
                        var cz = sz0 + (ez - sz0) * t;
                        var by = sy + (ey - sy) * t;
                        var arc = peak * 4 * t * (1 - t);
                        spr.position.set(cx, by + arc, cz);
                        mat.opacity = t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.15);
                    });
                }, idx * 35);
            })(i);
        }
    }

    /* Bullet Rain (shootout) — tile-targeted AoE. Bullets pour straight DOWN
       from the sky onto every tile of the target area, landing in time with the
       descent camera's tilt-up-then-down beat. Replaces the old self-cast
       barrage where bullets arced off-screen from the caster. */
    function _spawnBulletRainArea3D(tx, ty, aoeRadius, landMs) {
        if (_suppressed()) return;
        var scene = _getVFXScene();
        if (!scene) return;

        var tex = _getBulletTexture();
        var rad = (aoeRadius == null) ? 1 : aoeRadius;
        var dur = landMs || 650;

        var ts = _worldPos(tx, ty).ts;
        var skyH = ts * 4.2;                 // start height above the ground
        var fallMs = Math.max(220, dur * 0.62);
        var bulletsPerTile = 5;

        for (var ddx = -rad; ddx <= rad; ddx++) {
            for (var ddy = -rad; ddy <= rad; ddy++) {
                var wp = _worldPos(tx + ddx, ty + ddy);
                for (var b = 0; b < bulletsPerTile; b++) {
                    (function(wpx, wpy, wpz) {
                        // Stagger each bullet so the volley reads as a sustained
                        // burst rather than a single instant.
                        var stagger = rn(0, dur * 0.5);
                        window.setTimeout(function() {
                            if (_suppressed()) return;
                            var sc = _getVFXScene();
                            if (!sc) return;

                            var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                            var spr = new THREE.Sprite(mat);
                            // Tall, thin streak so it reads as a falling tracer.
                            var w = ts * 0.085, h = ts * 0.34;
                            spr.scale.set(w, h, 1);

                            var landX = wpx + rn(-ts * 0.34, ts * 0.34);
                            var landZ = wpz + rn(-ts * 0.34, ts * 0.34);
                            var landY = wpy + ts * 0.06;
                            var startY = landY + skyH;
                            // Slight near-vertical lean as they come in.
                            var lean = rn(-ts * 0.10, ts * 0.10);
                            var leanZ = rn(-ts * 0.10, ts * 0.10);

                            spr.position.set(landX - lean, startY, landZ - leanZ);
                            spr.renderOrder = 168;
                            sc.add(spr);

                            var entry = { meshes: [spr], done: false };
                            _animate3D(entry, fallMs, function(elapsed) {
                                var t = Math.min(elapsed / fallMs, 1);
                                var te = t * t;          // accelerate like gravity
                                var cy = startY + (landY - startY) * te;
                                var cx = (landX - lean) + lean * te;
                                var cz = (landZ - leanZ) + leanZ * te;
                                spr.position.set(cx, cy, cz);
                                mat.opacity = t < 0.82 ? 1 : Math.max(0, 1 - (t - 0.82) / 0.18);
                            });

                            // Muzzle spark + dust kick where the bullet lands.
                            window.setTimeout(function() {
                                if (_suppressed()) return;
                                _spawn({
                                    x: landX, y: landY + 2, z: landZ,
                                    mode: 'world', sprite: 'steel-spark',
                                    ml: 240, size0: ts * 0.16, size1: ts * 0.02,
                                    opacity0: 0.95, opacity1: 0,
                                    vz: rn(20, 60), gravity: 120, drag: 0.5,
                                });
                            }, fallMs * 0.92);
                        }, stagger);
                    })(wp.x, wp.y, wp.z);
                }
            }
        }
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

    /* ═══════════════════ SIGNATURE 3D SPELL CINEMATICS ═══════════════════
       Over-the-top, anime-style 3D set-pieces for staple spells (FF15 /
       Xenoblade / LoL-ult energy). Built entirely from three.js geometry and
       procedural canvas textures — no new image assets, no new script files.

       The toolkit here (magic circles, shock rings, speed-line bursts, light
       pillars, crescent slashes, screen flash) is the BASE LAYER: future
       spell cinematics should be composed from these pieces the same way the
       hero effects (_sigStandSword3D, _sigStandFist3D, _sigUFO3D) are. Every
       builder is parameterized by color/scale/timing so one builder covers a
       whole family of spells — wire new spells in _spell3DGeometry below.

       Conventions match the older bespoke spawners:
       - world coords via _worldPos(tx, ty)   (x = px-x, z = px-y, y = up)
       - MeshBasicMaterial only (unlit), additive blending + depthWrite:false
         for glows, renderOrder >= 150 so VFX draw over board geometry
       - every effect self-terminates and disposes its geometry/materials;
         cached canvas textures are shared and intentionally never disposed */

    var _sigTexCache = {};
    function _sigTex(key, size, draw) {
        if (_sigTexCache[key]) return _sigTexCache[key];
        var cvs = document.createElement('canvas');
        cvs.width = cvs.height = size;
        draw(cvs.getContext('2d'), size);
        var tex = new THREE.CanvasTexture(cvs);
        _sigTexCache[key] = tex;
        return tex;
    }

    /* deterministic PRNG so cached textures come out identical every run */
    function _sigRand(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    function _sigMagicCircleTex() {
        return _sigTex('sig-magic-circle', 512, function (ctx, S) {
            var c = S / 2, rnd = _sigRand(0xC17C1E);
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = '#ffffff';
            function ring(r, w, alpha) {
                ctx.globalAlpha = alpha; ctx.lineWidth = w;
                ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
            }
            ring(238, 10, 0.9);
            ring(222, 3, 0.8);
            ring(150, 4, 0.7);
            ring(80, 3, 0.55);
            /* hexagram */
            ctx.globalAlpha = 0.65; ctx.lineWidth = 4;
            for (var tri = 0; tri < 2; tri++) {
                ctx.beginPath();
                for (var k = 0; k <= 3; k++) {
                    var a = tri * Math.PI / 3 + k * (Math.PI * 2 / 3) - Math.PI / 2;
                    var x = c + Math.cos(a) * 150, y = c + Math.sin(a) * 150;
                    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            /* radial ticks between the outer rings */
            ctx.globalAlpha = 0.8; ctx.lineWidth = 3;
            for (var t = 0; t < 48; t++) {
                var a2 = t * Math.PI * 2 / 48;
                ctx.beginPath();
                ctx.moveTo(c + Math.cos(a2) * 224, c + Math.sin(a2) * 224);
                ctx.lineTo(c + Math.cos(a2) * 234, c + Math.sin(a2) * 234);
                ctx.stroke();
            }
            /* abstract rune scribbles around the mid band (no font needed) */
            for (var g = 0; g < 24; g++) {
                var ga = g * Math.PI * 2 / 24;
                var gx = c + Math.cos(ga) * 186, gy = c + Math.sin(ga) * 186;
                ctx.save();
                ctx.translate(gx, gy); ctx.rotate(ga + Math.PI / 2);
                ctx.globalAlpha = 0.75; ctx.lineWidth = 2.5;
                for (var st = 0; st < 4; st++) {
                    ctx.beginPath();
                    ctx.moveTo((rnd() - 0.5) * 18, (rnd() - 0.5) * 22);
                    ctx.lineTo((rnd() - 0.5) * 18, (rnd() - 0.5) * 22);
                    ctx.stroke();
                }
                ctx.restore();
            }
            /* orbs on the hexagram points */
            ctx.globalAlpha = 0.9;
            for (var v = 0; v < 6; v++) {
                var va = v * Math.PI / 3 - Math.PI / 2;
                ctx.beginPath();
                ctx.arc(c + Math.cos(va) * 150, c + Math.sin(va) * 150, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });
    }

    function _sigGlowTex() {
        return _sigTex('sig-glow', 128, function (ctx, S) {
            var g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        });
    }

    function _sigRingTex() {
        return _sigTex('sig-ring', 256, function (ctx, S) {
            var g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
            g.addColorStop(0.0, 'rgba(255,255,255,0)');
            g.addColorStop(0.72, 'rgba(255,255,255,0)');
            g.addColorStop(0.82, 'rgba(255,255,255,0.9)');
            g.addColorStop(0.9, 'rgba(255,255,255,0.35)');
            g.addColorStop(1.0, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        });
    }

    function _sigBurstTex() {
        return _sigTex('sig-burst', 256, function (ctx, S) {
            var c = S / 2, rnd = _sigRand(0xB0057);
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            for (var i = 0; i < 26; i++) {
                var a = rnd() * Math.PI * 2;
                var r0 = 18 + rnd() * 30, r1 = r0 + 40 + rnd() * 68;
                ctx.globalAlpha = 0.5 + rnd() * 0.5;
                ctx.lineWidth = 1.5 + rnd() * 3.5;
                ctx.beginPath();
                ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
                ctx.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        });
    }

    function _sigStreakTex() {
        return _sigTex('sig-streak', 128, function (ctx, S) {
            var g = ctx.createLinearGradient(0, 0, S, 0);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        });
    }

    /* crescent arc — thick in the middle, tapering to points, for slashes */
    function _sigCrescentTex() {
        return _sigTex('sig-crescent', 256, function (ctx, S) {
            var c = S / 2;
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            for (var i = 0; i < 40; i++) {
                var t = i / 40;
                var a0 = (-0.62 + 1.24 * t) * Math.PI;
                ctx.globalAlpha = 0.85 * Math.sin(t * Math.PI);
                ctx.lineWidth = 2 + 26 * Math.sin(t * Math.PI);
                ctx.beginPath();
                ctx.arc(c, c, 96, a0, a0 + 0.16);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        });
    }

    /* Pixel terrain-sprite cladding — the SAME recipe the 3D trees/turrets
       use (NearestFilter R2 sprite + flat colour tint) so signature objects
       read in the game's hand-pixelled style. Cached per (file, repeat). */
    var _sigTerrainTexCache = {};
    function _sigTerrainTex(file, repX, repY) {
        var key = file + '|' + (repX || 1) + '|' + (repY || 1);
        if (_sigTerrainTexCache[key]) return _sigTerrainTexCache[key];
        var tex = _loadCachedTex(
            'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/' + file);
        tex.repeat.set(repX || 1, repY || 1);
        _sigTerrainTexCache[key] = tex;
        return tex;
    }

    /* ExtrudeGeometry emits UVs in raw shape-space px — rescale so a terrain
       sprite tiles a sane number of times across the mesh */
    function _sigScaleUVs(geo, sx, sy, ox, oy) {
        var uv = geo.getAttribute('uv');
        if (!uv) return;
        for (var i = 0; i < uv.count; i++) {
            uv.setXY(i, uv.getX(i) * sx + (ox || 0), uv.getY(i) * sy + (oy || 0));
        }
        uv.needsUpdate = true;
    }

    function _sigEaseOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function _sigEaseInCubic(t) { return t * t * t; }
    function _sigEaseOutBack(t) {
        var c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function _sigClamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

    function _sigMat(color, opts) {
        var m = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color != null ? color : 0xffffff),
            transparent: true,
            opacity: 0,
            blending: (opts && opts.normal) ? THREE.NormalBlending : THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        if (opts && opts.map) m.map = opts.map;
        return m;
    }

    function _sigCss(color) {
        return '#' + ('00000' + (color != null ? color : 0xffffff).toString(16)).slice(-6);
    }

    /* self-terminating animation runner for signature groups. Caps the
       number of concurrently live signature effects so multi-hit spam can't
       flood the scene. */
    var _sigActive = 0;
    var _SIG_MAX_ACTIVE = 20;
    function _sigRun(group, totalMs, tick) {
        var scene = _getVFXScene();
        if (!scene) return null;
        if (_sigActive >= _SIG_MAX_ACTIVE) return null;
        _sigActive++;
        scene.add(group);
        var entry = { done: false, group: group };
        var t0 = performance.now();
        function finish() {
            if (entry.done) return;
            entry.done = true;
            _sigActive--;
            scene.remove(group);
            group.traverse(function (o) {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    var mats = Array.isArray(o.material) ? o.material : [o.material];
                    for (var i = 0; i < mats.length; i++) mats[i].dispose();
                }
            });
        }
        function loop() {
            if (entry.done) return;
            var el = performance.now() - t0;
            if (el >= totalMs) { finish(); return; }
            try { tick(el); } catch (e) {
                /* don't die silently — a sig effect vanishing one frame in is
                   otherwise undebuggable */
                try { console.warn('[SIG3D] tick error, killing effect:', e && e.message ? e.message : e); } catch (e2) {}
                finish(); return;
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
        entry.finish = finish;
        return entry;
    }

    /* full-viewport anime impact flash (DOM overlay, additive) */
    var _sigFlashEl = null;
    function _sigScreenFlash(color, ms, peak) {
        try {
            if (typeof document === 'undefined') return;
            if (_catOff('spells')) return;
            if (!_sigFlashEl) {
                _sigFlashEl = document.createElement('div');
                var st = _sigFlashEl.style;
                st.position = 'fixed';
                st.left = '0'; st.top = '0'; st.right = '0'; st.bottom = '0';
                st.pointerEvents = 'none';
                st.zIndex = '9000';
                st.mixBlendMode = 'screen';
                st.opacity = '0';
                document.body.appendChild(_sigFlashEl);
            }
            var el = _sigFlashEl;
            el.style.background = (typeof color === 'string') ? color : _sigCss(color);
            var t0 = performance.now();
            var total = ms || 180;
            var pk = peak != null ? peak : 0.3;
            var attack = Math.min(50, total * 0.25);
            function step() {
                var t = performance.now() - t0;
                if (t >= total) { el.style.opacity = '0'; return; }
                var o = t < attack ? (t / attack) : (1 - (t - attack) / (total - attack));
                el.style.opacity = String(pk * Math.max(0, o));
                requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        } catch (e) { /* cosmetic only */ }
    }

    function _sigShake(kind) {
        if (typeof window.shakeBoard === 'function') window.shakeBoard(kind || 'normal');
    }

    /* burst of sparks/motes through the existing particle pool so the look
       stays consistent with the rest of the VFX */
    function _sigSparks(tx, ty, sprite, n, opts) {
        if (!_canSpawn()) return;
        opts = opts || {};
        var c = tilePx(tx, ty);
        var z = unitSurfaceZ(tx, ty) + (opts.z != null ? opts.z : 6);
        var vxy = opts.vxy != null ? opts.vxy : 220;
        for (var i = 0; i < n; i++) {
            _spawn({
                x: c.x + rn(-8, 8), y: c.y + rn(-8, 8), z: z,
                vx: rn(-1, 1) * vxy,
                vy: rn(-1, 1) * vxy,
                vz: rn(opts.vz0 != null ? opts.vz0 : 60, opts.vz1 != null ? opts.vz1 : 320),
                gravity: opts.gravity != null ? opts.gravity : 420,
                drag: 1.2,
                mode: 'billboard',
                sprite: sprite || 'steel-spark',
                ml: rn(280, 620),
                size0: rn(6, 13), size1: 2,
                opacity0: 1, opacity1: 0,
            });
        }
    }

    /* ── magic circle: spinning double rune-disc, grow → hold → fade ────── */
    function _sigMagicCircle3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return null;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var radius = opts.radiusPx != null ? opts.radiusPx : ts * 1.15;
        var growMs = opts.growMs != null ? opts.growMs : 220;
        var holdMs = opts.holdMs != null ? opts.holdMs : 700;
        var fadeMs = opts.fadeMs != null ? opts.fadeMs : 260;
        var total = growMs + holdMs + fadeMs;
        var peakO = opts.opacity != null ? opts.opacity : 0.85;
        var spin = opts.spin != null ? opts.spin : 0.0016;
        var baseY = opts.height != null ? opts.height : 4;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y + baseY, wp.z);
        if (opts.tiltRad) group.rotation.x = opts.tiltRad;

        var circleTex = _sigMagicCircleTex();
        function disc(mat, order) {
            var holder = new THREE.Group();
            var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.renderOrder = order;
            holder.add(mesh);
            group.add(holder);
            return holder;
        }
        var matA = _sigMat(opts.color != null ? opts.color : 0x88bbff, { map: circleTex });
        var matB = _sigMat(opts.color2 != null ? opts.color2 : (opts.color != null ? opts.color : 0x88bbff), { map: circleTex });
        var discA = disc(matA, opts.renderOrder != null ? opts.renderOrder : 156);
        var discB = disc(matB, (opts.renderOrder != null ? opts.renderOrder : 156) + 1);

        var glowMat = _sigMat(opts.color != null ? opts.color : 0x88bbff, { map: _sigGlowTex() });
        var glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.scale.set(radius * 1.1, radius * 1.1, 1);
        glow.renderOrder = (opts.renderOrder != null ? opts.renderOrder : 156) - 1;
        group.add(glow);

        return _sigRun(group, total, function (el) {
            var s, o;
            if (el < growMs) {
                var t = el / growMs;
                s = Math.max(0.01, _sigEaseOutBack(t)); o = t;
            } else if (el < growMs + holdMs) {
                var t2 = (el - growMs) / holdMs;
                s = 1 + 0.02 * Math.sin(t2 * Math.PI * 6); o = 1;
            } else {
                var t3 = (el - growMs - holdMs) / fadeMs;
                s = 1 + t3 * 0.08; o = 1 - t3;
            }
            discA.rotation.y = el * spin;
            discB.rotation.y = -el * spin * 1.6;
            var sc = radius * s;
            discA.scale.set(sc, sc, sc);
            var sc2 = radius * 0.62 * s;
            discB.scale.set(sc2, sc2, sc2);
            matA.opacity = peakO * o;
            matB.opacity = peakO * 0.8 * o;
            glowMat.opacity = 0.35 * peakO * o;
            if (opts.rise) group.position.y = wp.y + baseY + opts.rise * _sigClamp01(el / total);
        });
    }

    /* ── expanding ground shockwave ring + air-ripple torus ─────────────── */
    function _sigShockRing3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return null;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var r0 = opts.r0 != null ? opts.r0 : ts * 0.2;
        var r1 = opts.r1 != null ? opts.r1 : ts * 1.6;
        var ms = opts.ms != null ? opts.ms : 420;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y + (opts.height != null ? opts.height : 6), wp.z);

        var mat = _sigMat(opts.color, { map: _sigRingTex() });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 158;
        group.add(mesh);

        var tor = null, torMat = null;
        if (opts.torus !== false) {
            torMat = _sigMat(opts.color);
            tor = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 40), torMat);
            tor.rotation.x = -Math.PI / 2;
            tor.renderOrder = 158;
            group.add(tor);
        }

        return _sigRun(group, ms, function (el) {
            var t = _sigClamp01(el / ms);
            var e = _sigEaseOutCubic(t);
            var r = r0 + (r1 - r0) * e;
            mesh.scale.set(r, r, r);
            mat.opacity = (opts.opacity != null ? opts.opacity : 0.9) * (1 - t);
            if (tor) {
                var tr = r * 0.8;
                tor.scale.set(tr, tr, tr);
                torMat.opacity = 0.5 * (1 - t);
            }
        });
    }

    /* ── anime speed-line impact burst ───────────────────────────────────── */
    function _sigSpeedBurst3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return null;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var ms = opts.ms != null ? opts.ms : 240;
        var size = opts.size != null ? opts.size : ts * 1.5;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y + (opts.height != null ? opts.height : ts * 0.45), wp.z);
        var mat = _sigMat(opts.color, { map: _sigBurstTex() });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        /* tip toward the diorama camera so the starburst reads on screen */
        mesh.rotation.x = opts.flat ? -Math.PI / 2 : -0.6;
        mesh.renderOrder = 166;
        group.add(mesh);

        return _sigRun(group, ms, function (el) {
            var t = _sigClamp01(el / ms);
            var s = size * (0.55 + 0.9 * _sigEaseOutCubic(t));
            mesh.scale.set(s, s, s);
            mesh.rotation.z = t * 0.5;
            mat.opacity = 0.95 * (1 - t) * (t < 0.12 ? t / 0.12 : 1);
        });
    }

    /* ── vertical column of light (heaven pillar) ────────────────────────── */
    function _sigLightPillar3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return null;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var h = opts.height != null ? opts.height : 720;
        var r = opts.radius != null ? opts.radius : ts * 0.42;
        var ms = opts.ms != null ? opts.ms : 900;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        var geo = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
        var matOuter = _sigMat(opts.color != null ? opts.color : 0xffe9a8);
        var outer = new THREE.Mesh(geo, matOuter);
        outer.position.y = h / 2; outer.renderOrder = 157;
        group.add(outer);
        var matCore = _sigMat(opts.coreColor != null ? opts.coreColor : 0xffffff);
        var core = new THREE.Mesh(geo.clone(), matCore);
        core.position.y = h / 2; core.renderOrder = 158;
        group.add(core);

        return _sigRun(group, ms, function (el) {
            var t = _sigClamp01(el / ms);
            var grow = _sigEaseOutCubic(_sigClamp01(el / 160));
            var fade = t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
            var breathe = 1 + 0.06 * Math.sin(el * 0.02);
            outer.scale.set(r * grow * breathe, h, r * grow * breathe);
            core.scale.set(r * 0.45 * grow, h, r * 0.45 * grow);
            matOuter.opacity = 0.32 * grow * fade;
            matCore.opacity = 0.5 * grow * fade;
            group.rotation.y = el * 0.001;
        });
    }

    /* ── crescent slash arc sweeping through the target ──────────────────── */
    function _sigCrescentSlash3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return null;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var size = opts.size != null ? opts.size : ts * 1.7;
        var ms = opts.ms != null ? opts.ms : 260;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y + (opts.height != null ? opts.height : ts * 0.5), wp.z);
        group.rotation.y = opts.yaw || 0;
        var mat = _sigMat(opts.color, { map: _sigCrescentTex() });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
        mesh.rotation.x = opts.pitch != null ? opts.pitch : -0.5;
        mesh.renderOrder = 165;
        group.add(mesh);
        var sweep = opts.sweep != null ? opts.sweep : 2.4;

        return _sigRun(group, ms, function (el) {
            var t = _sigClamp01(el / ms);
            var e = _sigEaseOutCubic(t);
            mesh.rotation.z = (opts.roll || 0) + sweep * e * (opts.dir || 1);
            var s = size * (0.7 + 0.5 * e);
            mesh.scale.set(s, s, s);
            mat.opacity = (t < 0.1 ? t / 0.1 : 1 - t * t);
        });
    }

    /* ── runic strip texture — faint glowing script down the fuller ─────── */
    function _sigRuneStripTex() {
        return _sigTex('sig-rune-strip', 128, function (ctx, S) {
            var rnd = _sigRand(0x51A5E5);
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            for (var g = 0; g < 9; g++) {
                var gy = 10 + g * 13;
                ctx.globalAlpha = 0.55 + rnd() * 0.45;
                ctx.lineWidth = 2 + rnd() * 2;
                for (var st = 0; st < 3; st++) {
                    ctx.beginPath();
                    ctx.moveTo(S / 2 + (rnd() - 0.5) * 26, gy + (rnd() - 0.5) * 9);
                    ctx.lineTo(S / 2 + (rnd() - 0.5) * 26, gy + (rnd() - 0.5) * 9);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        });
    }

    /* ── 3D greatsword builder — origin at the blade TIP, blade grows +Y ──
       v2 "apocalyptic anime greatsword": long distal taper with a swelling
       profile (widest ~60% up), ground edge bevels, glowing energy fuller
       with runic script, swept twin-quillon crossguard, wrapped two-hand
       grip with rings, faceted counterweight pommel. Clad in the SAME R2
       pixel terrain sprites as the trees/turrets so it sits in the board's
       art style. Returns {group, setFade, hiltY} — hiltY is the natural
       grip pivot for slash animation. */
    function _sigBuildSword(opts) {
        opts = opts || {};
        var len = opts.len || 260;
        var half = len * 0.052;              /* slim semi-realistic blade */
        var group = new THREE.Group();

        /* blade profile: needle tip → long sweep out → widest at ~58% →
           gentle taper back in → shoulder notch → ricasso into the guard */
        var shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(half * 0.5, len * 0.09, half * 0.86, len * 0.26);
        shape.quadraticCurveTo(half * 1.06, len * 0.58, half * 0.88, len * 0.93);
        shape.lineTo(half * 0.52, len * 0.955);
        shape.lineTo(half * 0.52, len);
        shape.lineTo(-half * 0.52, len);
        shape.lineTo(-half * 0.52, len * 0.955);
        shape.lineTo(-half * 0.88, len * 0.93);
        shape.quadraticCurveTo(-half * 1.06, len * 0.58, -half * 0.86, len * 0.26);
        shape.quadraticCurveTo(-half * 0.5, len * 0.09, 0, 0);
        var bladeGeo = new THREE.ExtrudeGeometry(shape, {
            depth: half * 0.30, bevelEnabled: true, curveSegments: 8,
            bevelThickness: half * 0.30, bevelSize: half * 0.34, bevelSegments: 2,
        });
        bladeGeo.translate(0, 0, -half * 0.15);
        var bladePx = _cfg().tileSize || 128;
        _sigScaleUVs(bladeGeo, 1 / bladePx, 1 / bladePx, 0.5 - (half / bladePx), 0);

        var bladeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.bladeColor != null ? opts.bladeColor : 0xdfe7f2),
            transparent: true, opacity: 1, depthWrite: true,
        });
        if (opts.hologram) {
            bladeMat.blending = THREE.AdditiveBlending;
            bladeMat.depthWrite = false;
        } else {
            /* pixel-sprite blade cladding (metal/gold/obsidian/... terrain) */
            bladeMat.map = _sigTerrainTex(opts.bladeTex || 'metal.png', 1, 1);
        }
        var blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.renderOrder = 160;
        group.add(blade);

        /* tight additive shell hugging the blade = edge glow (no longer a
           fat 2.4x balloon — reads as a honed, humming edge) */
        var glowMat = _sigMat(opts.glowColor != null ? opts.glowColor : 0x88bbff);
        var glowShell = new THREE.Mesh(bladeGeo.clone(), glowMat);
        glowShell.scale.set(1.14, 1.015, 1.7);
        glowShell.renderOrder = 159;
        group.add(glowShell);

        /* energy fuller — a thin glowing groove up the middle of both faces,
           plus a strip of runic script that brightens with glowBoost */
        var fullerMat = _sigMat(opts.glowColor != null ? opts.glowColor : 0x88bbff);
        var runeMat = _sigMat(0xffffff, { map: _sigRuneStripTex() });
        for (var bf = 0; bf < 2; bf++) {
            var zf = (bf === 0 ? 1 : -1) * half * 0.52;
            var fuller = new THREE.Mesh(new THREE.PlaneGeometry(half * 0.28, len * 0.66), fullerMat);
            fuller.position.set(0, len * 0.52, zf);
            if (bf === 1) fuller.rotation.y = Math.PI;
            fuller.renderOrder = 161;
            group.add(fuller);
            var runes = new THREE.Mesh(new THREE.PlaneGeometry(half * 0.9, len * 0.5), runeMat);
            runes.position.set(0, len * 0.55, zf * 1.04);
            if (bf === 1) runes.rotation.y = Math.PI;
            runes.renderOrder = 162;
            group.add(runes);
        }

        var metalColor = opts.guardColor != null ? opts.guardColor : 0xc9a227;
        var guardMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(metalColor),
            transparent: true, opacity: 1, depthWrite: true,
        });
        if (!opts.hologram) guardMat.map = _sigTerrainTex(opts.guardTex || 'metal.png', 1, 1);
        /* stitched-leather wrapped grip (real leather sprite) */
        var wrapMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(opts.gripColor != null ? opts.gripColor : 0xb9a88f),
            transparent: true, opacity: 1, depthWrite: true,
        });
        if (!opts.hologram) wrapMat.map = _sigTerrainTex('leather.png', 1, 1);

        /* swept crossguard: hub block + two down-swept quillons with tips */
        var hubGeo = new THREE.BoxGeometry(half * 1.5, len * 0.045, half * 0.9);
        _sigScaleUVs(hubGeo, 0.5, 0.5, 0.25, 0.25);
        var hub = new THREE.Mesh(hubGeo, guardMat);
        hub.position.y = len * 1.005; hub.renderOrder = 160;
        group.add(hub);
        for (var q = 0; q < 2; q++) {
            var sgn = q === 0 ? 1 : -1;
            var quGeo = new THREE.BoxGeometry(half * 2.3, len * 0.028, half * 0.42);
            _sigScaleUVs(quGeo, 0.5, 0.5, 0.25, 0.25);
            var qu = new THREE.Mesh(quGeo, guardMat);
            qu.position.set(sgn * half * 1.75, len * 0.99, 0);
            qu.rotation.z = sgn * -0.34;      /* swept down toward the blade */
            qu.renderOrder = 160;
            group.add(qu);
            var tipGeo = new THREE.SphereGeometry(half * 0.26, 8, 6);
            _sigScaleUVs(tipGeo, 0.5, 0.5, 0.25, 0.25);
            var qtip = new THREE.Mesh(tipGeo, guardMat);
            qtip.position.set(sgn * half * 2.85, len * 0.99 - half * 1.0 * 0.34, 0);
            qtip.renderOrder = 160;
            group.add(qtip);
        }

        /* two-hand grip with wrap rings */
        var gripGeo = new THREE.CylinderGeometry(half * 0.30, half * 0.36, len * 0.20, 10);
        _sigScaleUVs(gripGeo, 0.5, 0.5, 0.25, 0.25);
        var grip = new THREE.Mesh(gripGeo, wrapMat);
        grip.position.y = len * 1.115; grip.renderOrder = 160;
        group.add(grip);
        for (var wr = 0; wr < 3; wr++) {
            var ringGeo = new THREE.TorusGeometry(half * 0.36, half * 0.075, 6, 12);
            _sigScaleUVs(ringGeo, 0.5, 0.5, 0.25, 0.25);
            var ring = new THREE.Mesh(ringGeo, guardMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = len * (1.055 + wr * 0.055);
            ring.renderOrder = 160;
            group.add(ring);
        }

        /* faceted counterweight pommel + spike */
        var pomGeo = new THREE.SphereGeometry(half * 0.5, 6, 5);
        _sigScaleUVs(pomGeo, 0.5, 0.5, 0.25, 0.25);
        var pommel = new THREE.Mesh(pomGeo, guardMat);
        pommel.position.y = len * 1.235; pommel.renderOrder = 160;
        group.add(pommel);
        var spikeGeo = new THREE.ConeGeometry(half * 0.24, half * 0.9, 6);
        _sigScaleUVs(spikeGeo, 0.5, 0.5, 0.25, 0.25);
        var spike = new THREE.Mesh(spikeGeo, guardMat);
        spike.position.y = len * 1.235 + half * 0.85;
        spike.renderOrder = 160;
        group.add(spike);

        /* guard gem — soul core, front and back */
        var gemMat = _sigMat(opts.glowColor != null ? opts.glowColor : 0x88bbff);
        for (var gz = 0; gz < 2; gz++) {
            var gem = new THREE.Mesh(new THREE.SphereGeometry(half * 0.34, 8, 8), gemMat);
            gem.position.set(0, len * 1.005, (gz === 0 ? 1 : -1) * half * 0.62);
            gem.renderOrder = 162;
            group.add(gem);
        }

        var holoBase = opts.hologram ? 0.42 : 1;
        function setFade(f, glowBoost) {
            bladeMat.opacity = holoBase * f;
            glowMat.opacity = (0.30 + 0.42 * (glowBoost || 0)) * f;
            fullerMat.opacity = (0.5 + 0.5 * (glowBoost || 0)) * f;
            runeMat.opacity = (0.35 + 0.6 * (glowBoost || 0)) * f;
            guardMat.opacity = (opts.hologram ? 0.5 : 1) * f;
            wrapMat.opacity = (opts.hologram ? 0.4 : 1) * f;
            gemMat.opacity = (0.75 + 0.25 * (glowBoost || 0)) * f;
        }
        setFade(0);
        return { group: group, setFade: setFade, hiltY: len * 1.15, bladeGeo: bladeGeo };
    }

    /* ── HERO: "stand summon" greatsword — materializes over the target
       through a floating magic circle, hangs for a beat, then slams down
       with crescent slashes, speed lines, shockwave and screen flash ────── */
    function _sigStandSword3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var len = opts.len != null ? opts.len : ts * 2.1;
        var hoverH = opts.hoverH != null ? opts.hoverH : ts * 2.4;
        var color = opts.glowColor != null ? opts.glowColor : 0x88bbff;

        var summonMs = opts.summonMs != null ? opts.summonMs : 160;
        var holdMs = opts.holdMs != null ? opts.holdMs : 220;
        var plungeMs = opts.plungeMs != null ? opts.plungeMs : 110;
        var lingerMs = opts.lingerMs != null ? opts.lingerMs : 620;
        var fadeMs = opts.fadeMs != null ? opts.fadeMs : 300;
        var total = summonMs + holdMs + plungeMs + lingerMs + fadeMs;
        var embedTilt = opts.embedTilt != null ? opts.embedTilt : 0.16;
        var embedY = -ts * 0.22;

        /* summon circle floating just below where the blade appears */
        _sigMagicCircle3D(tx, ty, {
            color: opts.circleColor != null ? opts.circleColor : color,
            radiusPx: ts * 1.05,
            height: hoverH * 0.92,
            growMs: Math.min(140, summonMs),
            holdMs: summonMs + holdMs + plungeMs,
            fadeMs: 240,
            spin: 0.004,
            opacity: 0.9,
        });
        _sigScreenFlash(_sigCss(color), 160, 0.14);

        var sw = _sigBuildSword({
            len: len,
            glowColor: color,
            bladeColor: opts.bladeColor,
            guardColor: opts.guardColor,
            bladeTex: opts.bladeTex,
            guardTex: opts.guardTex,
            hologram: !!opts.hologram,
        });
        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        group.rotation.y = opts.yaw != null ? opts.yaw : rn(0, Math.PI * 2);
        sw.group.position.y = hoverH;
        group.add(sw.group);

        /* crossed vertical streak planes revealed during the plunge */
        var streakMat = _sigMat(color, { map: _sigStreakTex() });
        var streakA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), streakMat);
        streakA.position.y = hoverH * 0.5;
        streakA.renderOrder = 163;
        group.add(streakA);
        var streakB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), streakMat);
        streakB.position.y = hoverH * 0.5;
        streakB.rotation.y = Math.PI / 2;
        streakB.renderOrder = 163;
        group.add(streakB);
        streakA.scale.set(ts * 0.5, hoverH, 1);
        streakB.scale.set(ts * 0.5, hoverH, 1);

        var impactFired = false;
        _sigRun(group, total, function (el) {
            if (el < summonMs) {
                var t = el / summonMs;
                var s = Math.max(0.01, _sigEaseOutBack(t));
                sw.group.scale.set(s, s, s);
                sw.group.position.y = hoverH + (1 - t) * ts * 0.5;
                sw.group.rotation.y = (1 - t) * 2.4;
                sw.setFade(Math.min(1, t * 1.6), 1 - t);
                streakMat.opacity = 0;
            } else if (el < summonMs + holdMs) {
                var t2 = (el - summonMs) / holdMs;
                sw.group.scale.set(1, 1, 1);
                sw.group.position.y = hoverH + Math.sin(t2 * Math.PI) * ts * 0.18;
                sw.group.rotation.y = 0;
                sw.group.rotation.z = -0.10 * Math.sin(t2 * Math.PI);
                sw.setFade(1, 0.5 + 0.5 * Math.sin(el * 0.02));
                streakMat.opacity = 0;
            } else if (el < summonMs + holdMs + plungeMs) {
                var t3 = (el - summonMs - holdMs) / plungeMs;
                var e = _sigEaseInCubic(t3);
                sw.group.position.y = hoverH - (hoverH - embedY) * e;
                sw.group.rotation.z = embedTilt * e;
                sw.setFade(1, 1);
                streakMat.opacity = 0.75 * t3;
            } else {
                if (!impactFired) {
                    impactFired = true;
                    _sigShake(opts.shake || 'hard');
                    _sigScreenFlash('#ffffff', 130, opts.flashPeak != null ? opts.flashPeak : 0.3);
                    _sigShockRing3D(tx, ty, { color: color, r1: ts * (opts.ringTiles != null ? opts.ringTiles : 1.7) });
                    _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                    _sigCrescentSlash3D(tx, ty, { color: color, yaw: group.rotation.y, dir: 1 });
                    _sigCrescentSlash3D(tx, ty, { color: 0xffffff, yaw: group.rotation.y + 1.2, dir: -1, ms: 300, size: ts * 1.3 });
                    _sigSparks(tx, ty, opts.sparkSprite || 'steel-spark', 22);
                    if (_canSpawn()) {
                        var cpx = tilePx(tx, ty);
                        _spawn({
                            x: cpx.x, y: cpx.y, z: unitSurfaceZ(tx, ty) + 1,
                            mode: 'world', sprite: 'scorch',
                            ml: lingerMs + fadeMs + 400,
                            size0: ts * 0.7, size1: ts * 0.85,
                            opacity0: 0.7, opacity1: 0,
                        });
                    }
                }
                var elL = el - summonMs - holdMs - plungeMs;
                sw.group.rotation.z = embedTilt;
                if (elL < lingerMs) {
                    sw.group.position.y = embedY;
                    streakMat.opacity = Math.max(0, 0.75 - elL / 180);
                    sw.setFade(1, 0.5 + 0.5 * Math.sin(elL * 0.02));
                } else {
                    var t4 = (elL - lingerMs) / fadeMs;
                    sw.group.position.y = embedY + t4 * ts * 0.5;
                    sw.setFade(1 - t4, 0);
                    streakMat.opacity = 0;
                }
            }
        });

        /* dissolve motes as the blade fades back out of existence */
        window.setTimeout(function () {
            if (_suppressed()) return;
            _sigSparks(tx, ty, opts.moteSprite || 'psi-pulse', 10, { vxy: 40, vz0: 40, vz1: 140, gravity: -20 });
        }, summonMs + holdMs + plungeMs + lingerMs);
    }

    /* ── HERO: spectral giant fist — v2: a sculpted stone-golem fist (round
       knuckles, curled segmented fingers, muscled forearm — no more shoebox)
       that COCKS BACK in the sky, then slams down with speed lines, holds
       pressed into the ground, and springs back up and fades ─────────────── */
    function _sigStandFist3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var color = opts.color != null ? opts.color : 0xffd24a;
        var unit = ts * 0.011 * (opts.scale != null ? opts.scale : 1);

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        group.rotation.y = rn(0, Math.PI * 2);

        var fist = new THREE.Group();
        /* colossus fist clad in the dedicated skin sprite (pass rockTex:
           'rock.png' for the old stone-golem look), gold knuckle caps, and a
           faint additive aura shell in the spell colour so it still reads as
           summoned */
        var rockMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.rockTex || 'skin.png', 1, 1),
            color: new THREE.Color(opts.rockTint != null ? opts.rockTint : 0xffffff),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var plateMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.plateTex || 'gold.png', 1, 1),
            color: new THREE.Color(opts.plateTint != null ? opts.plateTint : 0xffffff),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var auraMat = _sigMat(color);
        function part(geo, x, y, z, rx, ry, rz, useMat, sx, sy, sz) {
            var m = new THREE.Mesh(geo, useMat || rockMat);
            m.position.set(x, y, z);
            m.rotation.set(rx || 0, ry || 0, rz || 0);
            if (sx) m.scale.set(sx, sy || sx, sz || sx);
            m.renderOrder = 160;
            fist.add(m);
            var aura = new THREE.Mesh(geo, auraMat);
            aura.position.copy(m.position);
            aura.rotation.copy(m.rotation);
            aura.scale.copy(m.scale).multiplyScalar(1.1);
            aura.renderOrder = 159;
            fist.add(aura);
            return m;
        }
        /* palm — a rounded slab: box core + squashed sphere shells so the
           silhouette reads as flesh-over-stone, not a crate */
        part(new THREE.BoxGeometry(82, 62, 78), 0, 34, 0);
        part(new THREE.SphereGeometry(40, 9, 7), 0, 40, -30, 0, 0, 0, null, 1.15, 0.85, 0.7);
        part(new THREE.SphereGeometry(38, 9, 7), 0, 22, 26, 0, 0, 0, null, 1.12, 0.8, 0.75);
        /* four curled fingers, knuckles DOWN (this fist punches the earth):
           each finger = round knuckle + two angled segments folding under */
        for (var f = 0; f < 4; f++) {
            var fx = -31 + f * 21;
            var fw = (f === 0 || f === 3) ? 0.88 : 1;      /* pinky/index slimmer */
            part(new THREE.SphereGeometry(12.5 * fw, 8, 7), fx, 0, 30);
            part(new THREE.CylinderGeometry(9.5 * fw, 11 * fw, 30, 8), fx, -14, 38, 0.55);
            part(new THREE.SphereGeometry(10 * fw, 8, 6), fx, -25, 46);
            part(new THREE.CylinderGeometry(8 * fw, 9.5 * fw, 26, 8), fx, -28, 32, 1.85);
            /* gold knuckle cap riding the first knuckle */
            part(new THREE.SphereGeometry(9 * fw, 8, 6), fx, -3, 36, 0, 0, 0, plateMat, 1, 0.7, 1);
        }
        /* thumb clamped across the folded fingers */
        part(new THREE.SphereGeometry(13, 8, 7), -50, 22, 18);
        part(new THREE.CylinderGeometry(9, 11.5, 34, 8), -52, 4, 34, 0.9, 0, 0.5);
        part(new THREE.SphereGeometry(9.5, 8, 6), -50, -8, 48);
        /* wrist + muscled forearm rising to the sky: cuff ring, tapered
           bulge, twin tendon ridges */
        part(new THREE.CylinderGeometry(34, 40, 26, 10), 0, 76, 0);
        part(new THREE.TorusGeometry(37, 7, 8, 14), 0, 90, 0, Math.PI / 2, 0, 0, plateMat);
        part(new THREE.CylinderGeometry(44, 34, 110, 10), 0, 150, 0);
        part(new THREE.CylinderGeometry(12, 9, 96, 7), -24, 152, 14, 0, 0, 0.06);
        part(new THREE.CylinderGeometry(12, 9, 96, 7), 24, 152, -12, 0, 0, -0.06);
        fist.scale.set(unit, unit, unit);
        group.add(fist);

        var skyH = opts.skyH != null ? opts.skyH : 700;
        var groundY = ts * 0.42;
        var windMs = opts.windMs != null ? opts.windMs : 200;
        var dropMs = opts.dropMs != null ? opts.dropMs : 130;
        var squashMs = 90;
        var holdMs = opts.holdMs != null ? opts.holdMs : 280;
        var riseMs = opts.riseMs != null ? opts.riseMs : 260;
        var total = windMs + dropMs + squashMs + holdMs + riseMs;

        _sigMagicCircle3D(tx, ty, {
            color: color, radiusPx: ts * 1.2, height: skyH * 0.55,
            growMs: 100, holdMs: windMs + dropMs + holdMs, fadeMs: 220,
            spin: 0.005, opacity: 0.7,
        });

        var impactFired = false;
        _sigRun(group, total, function (el) {
            var vis = 1;
            if (el < windMs) {
                /* wind-up: fade in high, cock back and coil upward slightly */
                var tw = el / windMs;
                var ew = _sigEaseOutCubic(tw);
                fist.position.y = skyH * (0.86 + 0.14 * ew);
                fist.rotation.x = -0.5 * ew;
                fist.scale.set(unit, unit, unit);
                vis = Math.min(1, tw * 2.2);
            } else if (el < windMs + dropMs) {
                var t = (el - windMs) / dropMs;
                fist.position.y = skyH - (skyH - groundY) * _sigEaseInCubic(t);
                fist.rotation.x = -0.5 * (1 - t);
                fist.scale.set(unit, unit * (1 + 0.25 * t), unit);   /* speed-stretch */
                vis = 1;
            } else if (el < windMs + dropMs + squashMs) {
                if (!impactFired) {
                    impactFired = true;
                    _sigShake('hard');
                    _sigScreenFlash(_sigCss(color), 150, opts.flashPeak != null ? opts.flashPeak : 0.3);
                    _sigShockRing3D(tx, ty, { color: color, r1: ts * 2.2, ms: 520 });
                    _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                    _sigSparks(tx, ty, 'dust-puff', 14, { vxy: 160, vz0: 20, vz1: 120, gravity: 160 });
                    _sigSparks(tx, ty, 'rock-debris', 10, { vxy: 240, vz0: 60, vz1: 260, gravity: 420 });
                    _sigSparks(tx, ty, opts.sparkSprite || 'spark-blue', 12);
                }
                var t2 = (el - windMs - dropMs) / squashMs;
                var sq = Math.sin(t2 * Math.PI);
                fist.rotation.x = 0;
                fist.position.y = groundY * (1 - 0.25 * sq);
                fist.scale.set(unit * (1 + 0.12 * sq), unit * (1 - 0.18 * sq), unit * (1 + 0.12 * sq));
            } else if (el < windMs + dropMs + squashMs + holdMs) {
                var elH = el - windMs - dropMs - squashMs;
                fist.position.y = groundY + Math.sin(elH * 0.09) * 1.5;
                fist.scale.set(unit, unit, unit);
            } else {
                var t3 = (el - windMs - dropMs - squashMs - holdMs) / riseMs;
                fist.position.y = groundY + (skyH * 0.7 - groundY) * _sigEaseInCubic(t3);
                vis = 1 - t3;
            }
            rockMat.opacity = vis;
            plateMat.opacity = vis;
            auraMat.opacity = 0.18 * vis;
        });
    }

    /* ═══════════════════════════════════════════════════════════════════
       SIGNATURE ARSENAL — real 3D weapon/anatomy rigs for spell cinematics.
       Everything here follows the tree/turret recipe: R2 pixel terrain
       sprites (NearestFilter) wrapped on sculpted geometry + tight additive
       glow accents, aiming for apocalyptic-dramatic-anime-semi-real.
       ═══════════════════════════════════════════════════════════════════ */

    /* Caster lookup — melee/gun cinematics want to know which direction the
       attack came from. The blitz engine tracks the acting unit; fall back
       to the nearest living unit that isn't standing ON the target tile. */
    function _sigCasterPos(tx, ty) {
        try {
            if (typeof state === 'undefined' || !state.units) return null;
            var u = null;
            if (state._blitzActiveUnitId != null) {
                for (var i = 0; i < state.units.length; i++) {
                    if (state.units[i] && state.units[i].id === state._blitzActiveUnitId) { u = state.units[i]; break; }
                }
            }
            if (!u || u.dead || (u.x === tx && u.y === ty)) {
                var best = null, bd = 1e9;
                for (var j = 0; j < state.units.length; j++) {
                    var v = state.units[j];
                    if (!v || v.dead || (v.x === tx && v.y === ty)) continue;
                    var d = Math.abs(v.x - tx) + Math.abs(v.y - ty);
                    if (d < bd) { bd = d; best = v; }
                }
                u = best;
            }
            return u ? { x: u.x, y: u.y } : null;
        } catch (e) { return null; }
    }
    /* rotation.y that points a +Z-facing object from the caster toward the
       target tile (random if no caster can be found) */
    function _sigYawToward(tx, ty) {
        var c = _sigCasterPos(tx, ty);
        if (!c) return rn(0, Math.PI * 2);
        var dx = tx - c.x, dz = ty - c.y;
        if (!dx && !dz) return rn(0, Math.PI * 2);
        return Math.atan2(dx, dz);
    }

    /* ── HERO: SLASH COMBO — the sword no longer falls out of the sky. A
       spectral greatsword materializes beside the target and rips through
       a chain of real swings: wind-up → arc swipe (with lagging afterimage
       blades + crescent trail + sparks) → snap reposition → next swing,
       ending on a heavier finisher with shockwave/flash. Each swing pivots
       the blade around its grip like a giant invisible swordsman.
       opts.slashes: [{dYaw, dir, tilt, heavy}] — angles are relative to the
       caster→target direction so combos rake across the victim. ─────────── */
    function _sigSlashCombo3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var color = opts.glowColor != null ? opts.glowColor : 0x88bbff;
        var len = opts.len != null ? opts.len : ts * 1.6;
        var baseYaw = opts.yaw != null ? opts.yaw : _sigYawToward(tx, ty);
        var slashes = opts.slashes || [
            { dYaw: 0.5, dir: 1, tilt: 0.5 },
            { dYaw: -0.6, dir: -1, tilt: -0.45 },
            { dYaw: 1.35, dir: 1, tilt: 0.08, heavy: true },
        ];
        var summonMs = opts.summonMs != null ? opts.summonMs : 150;
        var windMs = opts.windMs != null ? opts.windMs : 75;
        var swingMs = opts.swingMs != null ? opts.swingMs : 95;
        var recoverMs = opts.recoverMs != null ? opts.recoverMs : 55;
        var fadeMs = opts.fadeMs != null ? opts.fadeMs : 260;
        var hubH = opts.hubH != null ? opts.hubH : ts * 1.35;

        var sw = _sigBuildSword({
            len: len, glowColor: color,
            bladeColor: opts.bladeColor, guardColor: opts.guardColor,
            bladeTex: opts.bladeTex, guardTex: opts.guardTex,
            hologram: !!opts.hologram,
        });

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);

        /* one holder+pivot per slash; the single sword hops between pivots */
        var holders = [];
        var phases = [];
        var t = summonMs;
        for (var i = 0; i < slashes.length; i++) {
            var sl = slashes[i];
            var holder = new THREE.Group();
            holder.rotation.order = 'YXZ';
            holder.rotation.y = baseYaw + (sl.dYaw || 0);
            holder.rotation.x = sl.tilt || 0;
            holder.visible = false;
            group.add(holder);
            var pivot = new THREE.Group();
            pivot.position.y = hubH;
            holder.add(pivot);
            /* two afterimage blades lagging behind the swing */
            var ghostMatA = _sigMat(color);
            var ghostMatB = _sigMat(color);
            var gpA = new THREE.Group(); gpA.position.y = hubH; holder.add(gpA);
            var gpB = new THREE.Group(); gpB.position.y = hubH; holder.add(gpB);
            var gA = new THREE.Mesh(sw.bladeGeo, ghostMatA);
            gA.position.y = -sw.hiltY; gA.renderOrder = 158; gpA.add(gA);
            var gB = new THREE.Mesh(sw.bladeGeo, ghostMatB);
            gB.position.y = -sw.hiltY; gB.renderOrder = 157; gpB.add(gB);

            var heavy = !!sl.heavy;
            var wMs = windMs * (heavy ? 1.35 : 1);
            var sMs = swingMs * (heavy ? 1.45 : 1);
            var rMs = recoverMs + (heavy ? 170 : 0);
            phases.push({
                idx: i, holder: holder, pivot: pivot,
                gpA: gpA, gpB: gpB, gmA: ghostMatA, gmB: ghostMatB,
                dir: sl.dir || 1, heavy: heavy,
                a0: (sl.dir || 1) * 1.6, a1: -(sl.dir || 1) * 1.35,
                t0: t, tSwing: t + wMs, tHit: t + wMs + sMs, t1: t + wMs + sMs + rMs,
                hitFired: false,
            });
            holders.push(holder);
            t = phases[phases.length - 1].t1;
        }
        var fadeAt = t;
        var total = t + fadeMs;

        /* the sword starts on the first pivot */
        phases[0].pivot.add(sw.group);
        sw.group.position.y = -sw.hiltY;
        var cur = 0;
        phases[0].holder.visible = true;
        phases[0].pivot.rotation.z = phases[0].a0;

        /* upright summon glyph + a breath of light where the blade appears */
        _sigMagicCircle3D(tx, ty, {
            color: opts.circleColor != null ? opts.circleColor : color,
            radiusPx: ts * 0.85, height: hubH * 0.75,
            tiltRad: Math.PI / 2, growMs: Math.min(130, summonMs),
            holdMs: Math.max(120, t - summonMs - 200), fadeMs: 220,
            spin: 0.006, opacity: 0.8,
        });
        _sigScreenFlash(_sigCss(color), 140, 0.10);

        _sigRun(group, total, function (el) {
            /* advance to the phase owning this time slice */
            while (cur < phases.length - 1 && el >= phases[cur].t1) {
                var prevP = phases[cur];
                prevP.holder.visible = false;
                cur++;
                var np = phases[cur];
                np.holder.visible = true;
                np.pivot.add(sw.group);
                sw.group.position.y = -sw.hiltY;
                np.pivot.rotation.z = np.a0;
            }
            var p = phases[cur];

            if (el < summonMs) {
                var tS = el / summonMs;
                var sc = Math.max(0.01, _sigEaseOutBack(tS));
                sw.group.scale.set(sc, sc, sc);
                sw.setFade(Math.min(1, tS * 1.7), 1 - tS);
                p.pivot.rotation.z = p.a0 + 0.6 * (1 - tS) * p.dir;
                p.gmA.opacity = 0; p.gmB.opacity = 0;
                return;
            }
            sw.group.scale.set(1, 1, 1);

            if (el >= fadeAt) {
                var tF = (el - fadeAt) / fadeMs;
                sw.setFade(1 - tF, 0);
                p.gmA.opacity = 0; p.gmB.opacity = 0;
                sw.group.position.y = -sw.hiltY + tF * ts * 0.4;
                return;
            }

            if (el < p.tSwing) {
                /* wind-up: draw back past the start angle, glow charging */
                var tw = _sigClamp01((el - p.t0) / (p.tSwing - p.t0));
                var ew = _sigEaseOutCubic(tw);
                p.pivot.rotation.z = p.a0 + 0.35 * ew * p.dir;
                sw.setFade(1, 0.3 + 0.5 * tw);
                p.gmA.opacity = 0; p.gmB.opacity = 0;
            } else if (el < p.tHit) {
                /* the swing — accelerating rip through the target */
                var tSw = _sigClamp01((el - p.tSwing) / (p.tHit - p.tSwing));
                var e = Math.pow(tSw, 2.1);
                var start = p.a0 + 0.35 * p.dir;
                var ang = start + (p.a1 - start) * e;
                p.pivot.rotation.z = ang;
                /* afterimages trail the blade, brightest mid-swing */
                var vel = Math.sin(Math.min(1, tSw * 1.15) * Math.PI);
                p.gpA.rotation.z = ang + 0.24 * p.dir * vel;
                p.gpB.rotation.z = ang + 0.5 * p.dir * vel;
                p.gmA.opacity = 0.5 * vel;
                p.gmB.opacity = 0.26 * vel;
                sw.setFade(1, 1);
            } else {
                /* impact + recover */
                if (!p.hitFired) {
                    p.hitFired = true;
                    var hYaw = p.holder.rotation.y;
                    _sigCrescentSlash3D(tx, ty, {
                        color: color, yaw: hYaw, dir: p.dir,
                        size: ts * (p.heavy ? 2.2 : 1.6),
                        ms: p.heavy ? 300 : 230,
                        roll: p.holder.rotation.x * 0.6,
                    });
                    _sigSparks(tx, ty, opts.sparkSprite || 'steel-spark', p.heavy ? 22 : 10);
                    if (p.heavy) {
                        _sigShake(opts.shake || 'hard');
                        _sigScreenFlash('#ffffff', 120, opts.flashPeak != null ? opts.flashPeak : 0.26);
                        _sigShockRing3D(tx, ty, { color: color, r1: ts * (opts.ringTiles != null ? opts.ringTiles : 1.7) });
                        _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                        _sigCrescentSlash3D(tx, ty, {
                            color: 0xffffff, yaw: hYaw + 1.1, dir: -p.dir, ms: 300, size: ts * 1.3,
                        });
                        if (_canSpawn()) {
                            var cpx = tilePx(tx, ty);
                            _spawn({
                                x: cpx.x, y: cpx.y, z: unitSurfaceZ(tx, ty) + 1,
                                mode: 'world', sprite: 'scorch',
                                ml: 900, size0: ts * 0.6, size1: ts * 0.8,
                                opacity0: 0.6, opacity1: 0,
                            });
                        }
                    } else {
                        _sigShake('soft');
                    }
                }
                var tR = _sigClamp01((el - p.tHit) / (p.t1 - p.tHit));
                /* small elastic overshoot as the cut stops dead */
                p.pivot.rotation.z = p.a1 - 0.12 * p.dir * Math.sin(tR * Math.PI);
                p.gmA.opacity = Math.max(0, 0.5 * (1 - tR * 2.2));
                p.gmB.opacity = Math.max(0, 0.26 * (1 - tR * 2.2));
                sw.setFade(1, Math.max(0.2, 1 - tR));
            }
        });

        /* dissolve motes as the blade fades back out of existence */
        window.setTimeout(function () {
            if (_suppressed()) return;
            _sigSparks(tx, ty, opts.moteSprite || 'psi-pulse', 10, { vxy: 40, vz0: 40, vz1: 140, gravity: -20 });
        }, fadeAt);
    }

    /* ── crest texture for the knight shield — radiant cross ────────────── */
    function _sigCrestTex() {
        return _sigTex('sig-crest', 128, function (ctx, S) {
            var c = S / 2;
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.28;
            for (var r = 0; r < 12; r++) {
                var a = r * Math.PI / 6;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(c + Math.cos(a) * 18, c + Math.sin(a) * 18);
                ctx.lineTo(c + Math.cos(a) * 52, c + Math.sin(a) * 52);
                ctx.stroke();
            }
            ctx.globalAlpha = 0.95;
            ctx.fillRect(c - 7, c - 44, 14, 88);
            ctx.fillRect(c - 30, c - 20, 60, 14);
            ctx.globalAlpha = 1;
        });
    }

    /* ── 3D heater shield builder — crest faces +Z. Steel face, gold trim
       ring behind, dome boss, rivets, glowing crest emblem. ─────────────── */
    function _sigBuildShield(opts) {
        opts = opts || {};
        var ts = _cfg().tileSize || 128;
        var W = (opts.w != null ? opts.w : ts * 0.95) * (opts.scale || 1);
        var H = W * 1.3;
        var group = new THREE.Group();

        function heaterShape(s) {
            var sh = new THREE.Shape();
            sh.moveTo(-W * 0.5 * s, H * 0.42 * s);
            sh.quadraticCurveTo(0, H * 0.55 * s, W * 0.5 * s, H * 0.42 * s);
            sh.quadraticCurveTo(W * 0.56 * s, -H * 0.05 * s, 0, -H * 0.55 * s);
            sh.quadraticCurveTo(-W * 0.56 * s, -H * 0.05 * s, -W * 0.5 * s, H * 0.42 * s);
            return sh;
        }
        var faceMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.faceTex || 'metal.png', 1, 1),
            color: new THREE.Color(opts.faceColor != null ? opts.faceColor : 0xb9c4d6),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var trimMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.trimTex || 'gold.png', 1, 1),
            color: new THREE.Color(opts.trimColor != null ? opts.trimColor : 0xffe28a),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var faceGeo = new THREE.ExtrudeGeometry(heaterShape(1), {
            depth: W * 0.07, bevelEnabled: true, curveSegments: 8,
            bevelThickness: W * 0.03, bevelSize: W * 0.035, bevelSegments: 2,
        });
        _sigScaleUVs(faceGeo, 1 / W, 1 / W, 0.5, 0.5);
        var face = new THREE.Mesh(faceGeo, faceMat);
        face.renderOrder = 160;
        group.add(face);
        var trimGeo = new THREE.ExtrudeGeometry(heaterShape(1.1), {
            depth: W * 0.05, bevelEnabled: true, curveSegments: 8,
            bevelThickness: W * 0.02, bevelSize: W * 0.025, bevelSegments: 1,
        });
        _sigScaleUVs(trimGeo, 1 / W, 1 / W, 0.5, 0.5);
        var trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.z = -W * 0.045;
        trim.renderOrder = 159;
        group.add(trim);
        /* dome boss */
        var boss = new THREE.Mesh(new THREE.SphereGeometry(W * 0.15, 10, 8), trimMat);
        boss.scale.z = 0.55;
        boss.position.z = W * 0.09;
        boss.renderOrder = 161;
        group.add(boss);
        /* rivets around the face */
        var rivetGeo = new THREE.SphereGeometry(W * 0.035, 6, 5);
        var rivetPts = [
            [-0.38, 0.36], [0, 0.46], [0.38, 0.36],
            [-0.44, 0.0], [0.44, 0.0],
            [-0.26, -0.3], [0.26, -0.3], [0, -0.48],
        ];
        for (var rv = 0; rv < rivetPts.length; rv++) {
            var rvm = new THREE.Mesh(rivetGeo, trimMat);
            rvm.position.set(rivetPts[rv][0] * W, rivetPts[rv][1] * H, W * 0.075);
            rvm.renderOrder = 161;
            group.add(rvm);
        }
        /* glowing crest */
        var crestMat = _sigMat(opts.glowColor != null ? opts.glowColor : 0xffd875, { map: _sigCrestTex() });
        var crest = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.85, W * 0.85), crestMat);
        crest.position.z = W * 0.115;
        crest.renderOrder = 162;
        group.add(crest);

        function setFade(f, glowBoost) {
            faceMat.opacity = f;
            trimMat.opacity = f;
            crestMat.opacity = (0.5 + 0.5 * (glowBoost || 0)) * f;
        }
        setFade(0);
        return { group: group, setFade: setFade, w: W, h: H };
    }

    /* ── HERO: SHIELD BASH — a spectral tower shield summons in front of the
       target, braces, and RAMS through it with a shockwave ──────────────── */
    function _sigShieldBash3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var color = opts.glowColor != null ? opts.glowColor : 0xffd875;
        var yaw = opts.yaw != null ? opts.yaw : _sigYawToward(tx, ty);

        var sh = _sigBuildShield({ glowColor: color, scale: opts.scale || 1 });
        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        group.rotation.y = yaw;
        sh.group.position.set(0, ts * 0.62, -ts * 0.85);
        group.add(sh.group);

        var summonMs = 130, braceMs = 100, ramMs = 70, holdMs = 170, fadeMs = 240;
        var total = summonMs + braceMs + ramMs + holdMs + fadeMs;
        _sigMagicCircle3D(tx, ty, {
            color: color, radiusPx: ts * 0.8, height: ts * 0.6,
            tiltRad: Math.PI / 2, growMs: 110, holdMs: summonMs + braceMs, fadeMs: 200,
            spin: 0.005, opacity: 0.8,
        });
        var impactFired = false;
        _sigRun(group, total, function (el) {
            if (el < summonMs) {
                var t = el / summonMs;
                var s = Math.max(0.01, _sigEaseOutBack(t));
                sh.group.scale.set(s, s, s);
                sh.setFade(Math.min(1, t * 1.8), 1 - t);
                sh.group.position.z = -ts * 0.85;
            } else if (el < summonMs + braceMs) {
                var t2 = (el - summonMs) / braceMs;
                sh.group.scale.set(1, 1, 1);
                sh.group.position.z = -ts * (0.85 + 0.18 * _sigEaseOutCubic(t2));
                sh.group.rotation.x = -0.08 * t2;
                sh.setFade(1, 0.4);
            } else if (el < summonMs + braceMs + ramMs) {
                var t3 = (el - summonMs - braceMs) / ramMs;
                sh.group.position.z = -ts * 1.03 + ts * 1.2 * _sigEaseInCubic(t3);
                sh.group.rotation.x = -0.08 * (1 - t3);
                sh.setFade(1, 1);
            } else {
                if (!impactFired) {
                    impactFired = true;
                    _sigShake(opts.shake || 'normal');
                    _sigScreenFlash(_sigCss(color), 130, opts.flashPeak != null ? opts.flashPeak : 0.2);
                    _sigShockRing3D(tx, ty, { color: color, r1: ts * 1.5 });
                    _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                    _sigSparks(tx, ty, 'steel-spark', 16);
                }
                var elH = el - summonMs - braceMs - ramMs;
                if (elH < holdMs) {
                    sh.group.position.z = ts * 0.17 - 2 + Math.sin(elH * 0.09) * 2;
                    sh.setFade(1, 0.5);
                } else {
                    var t4 = (elH - holdMs) / fadeMs;
                    sh.group.position.z = ts * 0.17 - t4 * ts * 0.3;
                    sh.setFade(1 - t4, 0);
                }
            }
        });
    }

    /* ── HERO: SHIELD FORTRESS — a ring of shields rises from the earth and
       locks around the tile, then sinks away (fortify / Castle Fortress /
       Oath of Valor). ─────────────────────────────────────────────────── */
    function _sigShieldRing3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var color = opts.glowColor != null ? opts.glowColor : 0xffd875;
        var n = opts.count != null ? opts.count : 4;
        var radius = (opts.radiusTiles != null ? opts.radiusTiles : 0.72) * ts;
        var riseMs = 240, stagger = 80, holdMs = opts.holdMs != null ? opts.holdMs : 850, sinkMs = 300;
        var total = riseMs + stagger * (n - 1) + holdMs + sinkMs;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        var startYaw = rn(0, Math.PI * 2);
        var shields = [];
        for (var i = 0; i < n; i++) {
            var a = startYaw + i * Math.PI * 2 / n;
            var holder = new THREE.Group();
            holder.rotation.y = a;
            group.add(holder);
            var sh = _sigBuildShield({ glowColor: color, scale: opts.scale != null ? opts.scale : 0.7 });
            sh.group.position.set(0, -sh.h * 0.6, radius);
            holder.add(sh.group);
            shields.push({ sh: sh, t0: i * stagger, clinked: false });
        }
        _sigMagicCircle3D(tx, ty, {
            color: color, radiusPx: radius * 1.35, growMs: 160,
            holdMs: total - 500, fadeMs: 300, spin: 0.0022, opacity: 0.7,
        });

        _sigRun(group, total, function (el) {
            group.rotation.y = el * 0.00045;
            for (var i2 = 0; i2 < shields.length; i2++) {
                var s2 = shields[i2];
                var lt = el - s2.t0;
                if (lt < 0) { s2.sh.setFade(0); continue; }
                if (lt < riseMs) {
                    var tr = lt / riseMs;
                    var e = _sigEaseOutBack(tr);
                    s2.sh.group.position.y = -s2.sh.h * 0.6 + (s2.sh.h * 0.6 + ts * 0.55) * e;
                    s2.sh.setFade(Math.min(1, tr * 2), 1 - tr);
                } else if (el < total - sinkMs) {
                    if (!s2.clinked) {
                        s2.clinked = true;
                        _sigSparks(tx, ty, 'divine-sparkle', 4, { vxy: 90, vz0: 30, vz1: 120, gravity: 60 });
                    }
                    s2.sh.group.position.y = ts * 0.55 + Math.sin(el * 0.004 + i2) * 2;
                    s2.sh.setFade(1, 0.3 + 0.3 * Math.sin(el * 0.006 + i2 * 1.7));
                } else {
                    var tk = (el - (total - sinkMs)) / sinkMs;
                    s2.sh.group.position.y = ts * 0.55 - tk * ts * 0.7;
                    s2.sh.setFade(1 - tk, 0);
                }
            }
        });
    }

    /* ── HERO: SPECTRAL JAWS — two flesh-and-fang jaw arcs materialize
       around the victim and SNAP shut. Gums wear the R2 flesh sprite, fangs
       the dedicated cracked-enamel sprite. Used by werewolf maulings and
       every other bite in the roster. ───────────────────────────────────── */
    function _sigJawsBite3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var scale = opts.scale != null ? opts.scale : 1;
        var R = ts * 0.58 * scale;
        var color = opts.glowColor != null ? opts.glowColor : 0xff3333;
        var gumTint = opts.gumTint != null ? opts.gumTint : 0x8a2020;
        var toothTint = opts.toothTint != null ? opts.toothTint : 0xffffff;

        var gumMatU = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.gumTex || 'flesh.png', 1, 1),
            color: new THREE.Color(gumTint), transparent: true, opacity: 0, depthWrite: true,
        });
        var hideMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.hideTex || 'flesh_3.png', 1, 1),
            color: new THREE.Color(opts.hideTint != null ? opts.hideTint : 0x2f1d1a),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var toothMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.toothTex || 'enamel.png', 1, 1),
            color: new THREE.Color(toothTint), transparent: true, opacity: 0, depthWrite: true,
        });
        var mawMat = _sigMat(color);

        function buildJaw(isUpper) {
            var jaw = new THREE.Group();
            var gum = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.26, 8, 14, Math.PI), gumMatU);
            gum.rotation.x = -Math.PI / 2;
            gum.scale.y = 0.55;
            jaw.add(gum);
            /* snarling outer hide ridge over the gums */
            var hide = new THREE.Mesh(new THREE.TorusGeometry(R * 1.08, R * 0.2, 7, 14, Math.PI), hideMat);
            hide.rotation.x = -Math.PI / 2;
            hide.scale.y = 0.5;
            hide.position.y = (isUpper ? 1 : -1) * R * 0.16;
            jaw.add(hide);
            /* fangs along the arc — big canines at the corners */
            var nT = 7;
            for (var k = 0; k < nT; k++) {
                var a = (0.09 + 0.82 * (k / (nT - 1))) * Math.PI;
                var px = Math.cos(a) * R;
                var pz = -Math.sin(a) * R;
                var canine = (k === 0 || k === nT - 1);
                var th = R * (canine ? 0.62 : 0.36) * (0.9 + 0.2 * Math.sin(k * 2.7));
                var tr = R * (canine ? 0.14 : 0.10);
                var tooth = new THREE.Mesh(new THREE.ConeGeometry(tr, th, 6), toothMat);
                tooth.position.set(px, (isUpper ? -1 : 1) * th * 0.42, pz);
                tooth.rotation.x = isUpper ? Math.PI : 0;
                tooth.rotation.z = (isUpper ? 1 : -1) * Math.cos(a) * 0.22;
                jaw.add(tooth);
            }
            /* glowing maw behind the fangs */
            var maw = new THREE.Mesh(new THREE.CircleGeometry(R * 0.92, 12), mawMat);
            maw.rotation.x = -Math.PI / 2;
            maw.position.y = (isUpper ? 1 : -1) * R * 0.05;
            jaw.add(maw);
            for (var jj = 0; jj < jaw.children.length; jj++) jaw.children[jj].renderOrder = 160;
            maw.renderOrder = 159;
            return jaw;
        }

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        group.rotation.y = opts.yaw != null ? opts.yaw : _sigYawToward(tx, ty);
        var mouthY = ts * 0.55 * scale;
        var upper = buildJaw(true);
        var lower = buildJaw(false);
        group.add(upper); group.add(lower);

        var openMs = 130, snapMs = 65, clenchMs = opts.clenchMs != null ? opts.clenchMs : 260, fadeMs = 240;
        var total = openMs + snapMs + clenchMs + fadeMs;
        var gapOpen = R * 1.15, gapShut = R * 0.22;

        _sigMagicCircle3D(tx, ty, {
            color: opts.circleColor != null ? opts.circleColor : 0x881111,
            radiusPx: ts * 0.95 * scale, growMs: 100, holdMs: openMs + snapMs + clenchMs,
            fadeMs: 200, spin: 0.006, opacity: 0.7,
        });

        var snapped = false;
        _sigRun(group, total, function (el) {
            var vis = 1, gap, bite;
            if (el < openMs) {
                var t = el / openMs;
                vis = Math.min(1, t * 2.2);
                gap = gapOpen * _sigEaseOutCubic(t);
                bite = 0.55 * _sigEaseOutCubic(t);
            } else if (el < openMs + snapMs) {
                var t2 = (el - openMs) / snapMs;
                var e = _sigEaseInCubic(t2);
                gap = gapOpen + (gapShut - gapOpen) * e;
                bite = 0.55 * (1 - e) - 0.05 * e;
            } else if (el < openMs + snapMs + clenchMs) {
                if (!snapped) {
                    snapped = true;
                    _sigShake(opts.shake || 'normal');
                    _sigScreenFlash(_sigCss(color), 110, opts.flashPeak != null ? opts.flashPeak : 0.16);
                    _sigShockRing3D(tx, ty, { color: color, r1: ts * 1.3 * scale, ms: 360 });
                    _sigSpeedBurst3D(tx, ty, { color: 0xffffff, ms: 200 });
                    _sigSparks(tx, ty, opts.sparkSprite || 'blood-fleck', 16, { vxy: 170, vz0: 40, vz1: 200, gravity: 380 });
                }
                var elC = el - openMs - snapMs;
                gap = gapShut + Math.sin(elC * 0.11) * R * 0.03;   /* worrying the prey */
                bite = -0.05 + Math.sin(elC * 0.07) * 0.02;
            } else {
                var t4 = (el - openMs - snapMs - clenchMs) / fadeMs;
                gap = gapShut + (gapOpen * 0.4) * t4;
                bite = 0.25 * t4;
                vis = 1 - t4;
                group.position.y = wp.y + t4 * ts * 0.3;
            }
            upper.position.y = mouthY + gap * 0.5;
            lower.position.y = mouthY - gap * 0.5;
            upper.rotation.x = -bite;
            lower.rotation.x = bite * 0.7;
            gumMatU.opacity = vis;
            hideMat.opacity = vis;
            toothMat.opacity = vis;
            mawMat.opacity = 0.30 * vis;
        });
        window.setTimeout(function () {
            if (_suppressed()) return;
            _sigSparks(tx, ty, 'void-mist', 6, { vxy: 50, vz0: 20, vz1: 90, gravity: -30 });
        }, openMs + snapMs + clenchMs);
    }

    /* ── claw-gouge texture — three ragged parallel rips ────────────────── */
    function _sigClawMarkTex() {
        return _sigTex('sig-clawmark', 256, function (ctx, S) {
            var rnd = _sigRand(0xC1A45);
            ctx.clearRect(0, 0, S, S);
            ctx.strokeStyle = '#ffffff';
            ctx.lineCap = 'round';
            for (var i = 0; i < 3; i++) {
                var ox = 62 + i * 46 + (rnd() - 0.5) * 10;
                for (var pass = 0; pass < 14; pass++) {
                    var t = pass / 14;
                    ctx.globalAlpha = 0.8 * Math.sin(t * Math.PI);
                    ctx.lineWidth = 2 + 13 * Math.sin(t * Math.PI);
                    ctx.beginPath();
                    var y0 = 26 + t * 190;
                    ctx.moveTo(ox - 24 + t * 46 + (rnd() - 0.5) * 5, y0);
                    ctx.lineTo(ox - 24 + (t + 0.075) * 46 + (rnd() - 0.5) * 5, y0 + 15);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        });
    }

    /* ── build a "claw fan": 4 curved talons on an invisible wrist. Each
       talon is a tapered knuckle segment + hooked tip cone, marble-clad
       (pearl/bone placeholder) with an additive edge sheen. ──────────────── */
    function _sigBuildClawFan(ts, opts) {
        opts = opts || {};
        var scale = opts.scale != null ? opts.scale : 1;
        var color = opts.glowColor != null ? opts.glowColor : 0xff88cc;
        var clawMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex(opts.clawTex || 'enamel.png', 1, 1),
            color: new THREE.Color(opts.clawTint != null ? opts.clawTint : 0xffffff),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var sheenMat = _sigMat(color);
        var fan = new THREE.Group();
        for (var i = 0; i < 4; i++) {
            var lenMul = (i === 0 || i === 3) ? 0.78 : 1;
            var L = ts * 0.72 * scale * lenMul;
            var talon = new THREE.Group();
            var seg1 = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.055, L * 0.11, L * 0.5, 7), clawMat);
            seg1.position.y = -L * 0.25;
            talon.add(seg1);
            var seg2Holder = new THREE.Group();
            seg2Holder.position.y = -L * 0.5;
            seg2Holder.rotation.x = 0.55;          /* the hook of the claw */
            var seg2 = new THREE.Mesh(new THREE.ConeGeometry(L * 0.055, L * 0.52, 7), clawMat);
            seg2.rotation.x = Math.PI;             /* point down */
            seg2.position.y = -L * 0.26;
            seg2Holder.add(seg2);
            var sheen = new THREE.Mesh(new THREE.ConeGeometry(L * 0.075, L * 0.56, 7), sheenMat);
            sheen.rotation.x = Math.PI;
            sheen.position.y = -L * 0.26;
            sheen.renderOrder = 159;
            seg2Holder.add(sheen);
            talon.add(seg2Holder);
            talon.position.x = (i - 1.5) * ts * 0.17 * scale;
            talon.rotation.z = (i - 1.5) * -0.07;  /* slight splay */
            fan.add(talon);
        }
        fan.traverse(function (o) { if (o.isMesh && o.renderOrder === 0) o.renderOrder = 160; });
        function setFade(f, boost) {
            clawMat.opacity = f;
            sheenMat.opacity = (0.30 + 0.5 * (boost || 0)) * f;
        }
        setFade(0);
        return { group: fan, setFade: setFade };
    }

    /* ── HERO: CLAW COMBO — spectral talons rake the target in quick
       alternating swipes, each leaving a triple crescent trail; ends with
       lingering glowing gouge-marks. opts.swipes / scale / colors. ───────── */
    function _sigClawCombo3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var color = opts.glowColor != null ? opts.glowColor : 0xff88cc;
        var scale = (opts.scale != null ? opts.scale : 1) * 1.25;
        var nSwipes = opts.swipes != null ? opts.swipes : 3;
        var baseYaw = opts.yaw != null ? opts.yaw : _sigYawToward(tx, ty);
        var windMs = 55, swipeMs = opts.swipeMs != null ? opts.swipeMs : 70, gapMs = 45;
        var perSwipe = windMs + swipeMs + gapMs;
        var fadeMs = 200;
        var markMs = opts.markMs != null ? opts.markMs : 700;
        var total = nSwipes * perSwipe + fadeMs + markMs;
        var hubH = ts * (1.05 * scale);
        var radius = ts * 0.95 * scale;

        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);

        var swipes = [];
        for (var i = 0; i < nSwipes; i++) {
            var dir = (i % 2 === 0) ? 1 : -1;
            var holder = new THREE.Group();
            holder.rotation.order = 'YXZ';
            holder.rotation.y = baseYaw + (i - (nSwipes - 1) / 2) * 0.55;
            holder.rotation.x = dir * 0.35;
            holder.visible = false;
            group.add(holder);
            var pivot = new THREE.Group();
            pivot.position.y = hubH;
            holder.add(pivot);
            var fan = _sigBuildClawFan(ts, { scale: scale, glowColor: color, clawTint: opts.clawTint, clawTex: opts.clawTex });
            fan.group.position.y = -radius;
            pivot.add(fan.group);
            swipes.push({
                holder: holder, pivot: pivot, fan: fan, dir: dir,
                t0: i * perSwipe, hitFired: false,
            });
        }
        /* lingering gouge decal, revealed by the last swipe */
        var markMat = _sigMat(color, { map: _sigClawMarkTex() });
        var mark = new THREE.Mesh(new THREE.PlaneGeometry(ts * 1.15 * scale, ts * 1.15 * scale), markMat);
        mark.position.y = ts * 0.55;
        mark.rotation.x = -0.5;
        mark.rotation.z = baseYaw * 0.3;
        mark.renderOrder = 164;
        group.add(mark);

        _sigRun(group, total, function (el) {
            for (var k = 0; k < swipes.length; k++) {
                var s = swipes[k];
                var lt = el - s.t0;
                if (lt < 0 || lt > perSwipe + 60) { s.holder.visible = false; continue; }
                s.holder.visible = true;
                var a0 = s.dir * 1.5, a1 = -s.dir * 1.4;
                if (lt < windMs) {
                    var tw = lt / windMs;
                    s.pivot.rotation.z = a0 + 0.3 * s.dir * _sigEaseOutCubic(tw);
                    s.fan.setFade(Math.min(1, tw * 2.5), 0.4);
                } else if (lt < windMs + swipeMs) {
                    var tSw = (lt - windMs) / swipeMs;
                    var e = Math.pow(tSw, 2);
                    s.pivot.rotation.z = (a0 + 0.3 * s.dir) + (a1 - a0 - 0.3 * s.dir) * e;
                    s.fan.setFade(1, 1);
                } else {
                    if (!s.hitFired) {
                        s.hitFired = true;
                        var hYaw = s.holder.rotation.y;
                        /* triple crescent — one per lead talon */
                        for (var c3 = -1; c3 <= 1; c3++) {
                            _sigCrescentSlash3D(tx, ty, {
                                color: c3 === 0 ? 0xffffff : color,
                                yaw: hYaw + c3 * 0.16, dir: s.dir,
                                size: ts * (1.15 + 0.2 * (1 - Math.abs(c3))) * scale,
                                ms: 200, height: ts * (0.5 + c3 * 0.09),
                            });
                        }
                        _sigSparks(tx, ty, opts.sparkSprite || 'blood-fleck', 8, { vxy: 190, vz0: 30, vz1: 170, gravity: 320 });
                        _sigShake('soft');
                        if (k === swipes.length - 1) {
                            _sigSpeedBurst3D(tx, ty, { color: color, ms: 220 });
                            _sigScreenFlash(_sigCss(color), 110, opts.flashPeak != null ? opts.flashPeak : 0.12);
                            if (opts.heavyFinish) {
                                _sigShockRing3D(tx, ty, { color: color, r1: ts * 1.5 * scale });
                                _sigShake('normal');
                            }
                        }
                    }
                    var tG = (lt - windMs - swipeMs) / gapMs;
                    s.pivot.rotation.z = a1 - 0.1 * s.dir * Math.sin(Math.min(1, tG) * Math.PI);
                    s.fan.setFade(Math.max(0, 1 - tG), 0.3);
                }
            }
            /* gouge marks flare in as the combo ends, then bleed out */
            var mT0 = nSwipes * perSwipe - 40;
            if (el > mT0) {
                var mt = _sigClamp01((el - mT0) / (total - mT0));
                markMat.opacity = 0.85 * Math.sin(Math.min(1, mt * 1.4) * Math.PI);
                mark.scale.set(1 + mt * 0.12, 1 + mt * 0.12, 1);
            } else {
                markMat.opacity = 0;
            }
        });
    }

    /* which spectral firearm each gun spell summons (see _fireBoltMapped) */
    var _SIG_GUN_FOR = {
        deadEye: 'revolver',
        ricochet1: 'revolver',
        raceHighNoon: 'revolver',
        doubleShot: 'shotgun',        /* "Double Pump" */
        headshot: 'sniper',
        precisionShot: 'sniper',
        kneecapShot: 'sniper',
    };

    /* world-space vector → the coordinate frame _spawn() expects */
    function _sigWorldToSpawn(v) {
        var cfg = _cfg();
        var pad = cfg.boardPadding || 2;
        return { x: v.x + pad, y: v.z + pad, z: v.y - 3 };
    }

    /* ── HERO: PIRATE CANNON — a full iron carronade on a wooden carriage
       materializes beside the caster, its fuse burns down, and it hurls a
       spinning iron ball on a real ballistic arc into a 3×3 fireball.
       Wired through the bolt intent so it knows caster AND target. ──────── */
    function _sigCannonShot3D(fromTx, fromTy, toTx, toTy, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var fw = _worldPos(fromTx, fromTy);
        var tw = _worldPos(toTx, toTy);
        var ts = fw.ts;

        var ironMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('gunmetal.png', 1, 1),
            color: new THREE.Color(0x9299a4),      /* darkened gunmetal = cast iron */
            transparent: true, opacity: 0, depthWrite: true,
        });
        var woodMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('wood_planks.png', 1, 1),
            color: new THREE.Color(0x9a744c),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var brassMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('gold.png', 1, 1),
            color: new THREE.Color(0xd9b25e),
            transparent: true, opacity: 0, depthWrite: true,
        });

        var root = new THREE.Group();
        root.position.set(fw.x, fw.y, fw.z);
        root.scale.setScalar(opts.scale != null ? opts.scale : 1.35);   /* reads from the diorama cam */
        var dx = tw.x - fw.x, dz = tw.z - fw.z;
        var yaw = Math.atan2(dx, dz);
        root.rotation.y = yaw;

        function m(geo, mat, x, y, z, rx, ry, rz) {
            var mm = new THREE.Mesh(geo, mat);
            mm.position.set(x, y, z);
            mm.rotation.set(rx || 0, ry || 0, rz || 0);
            mm.renderOrder = 160;
            return mm;
        }
        /* barrel assembly pivots at the trunnions for elevation */
        var barrel = new THREE.Group();
        barrel.position.y = ts * 0.16;
        barrel.add(m(new THREE.SphereGeometry(ts * 0.075, 8, 7), ironMat, 0, 0, -ts * 0.34));                    /* cascabel */
        barrel.add(m(new THREE.CylinderGeometry(ts * 0.105, ts * 0.125, ts * 0.5, 12), ironMat, 0, 0, -ts * 0.04, Math.PI / 2));
        barrel.add(m(new THREE.CylinderGeometry(ts * 0.082, ts * 0.10, ts * 0.42, 12), ironMat, 0, 0, ts * 0.40, Math.PI / 2));
        barrel.add(m(new THREE.TorusGeometry(ts * 0.092, ts * 0.022, 8, 16), brassMat, 0, 0, ts * 0.585));       /* muzzle ring */
        barrel.add(m(new THREE.TorusGeometry(ts * 0.122, ts * 0.02, 8, 16), brassMat, 0, 0, -ts * 0.235));       /* breech ring */
        barrel.add(m(new THREE.CylinderGeometry(ts * 0.03, ts * 0.03, ts * 0.36, 8), ironMat, 0, 0, -ts * 0.02, 0, 0, Math.PI / 2)); /* trunnion */
        var muzzle = new THREE.Object3D();
        muzzle.position.set(0, 0, ts * 0.62);
        barrel.add(muzzle);
        barrel.rotation.x = -(opts.elev != null ? opts.elev : 0.30);
        root.add(barrel);
        /* carriage: cheeks, axle, wheels */
        root.add(m(new THREE.BoxGeometry(ts * 0.055, ts * 0.20, ts * 0.5), woodMat, -ts * 0.135, ts * 0.06, -ts * 0.04));
        root.add(m(new THREE.BoxGeometry(ts * 0.055, ts * 0.20, ts * 0.5), woodMat, ts * 0.135, ts * 0.06, -ts * 0.04));
        root.add(m(new THREE.BoxGeometry(ts * 0.22, ts * 0.05, ts * 0.4), woodMat, 0, ts * 0.0, -ts * 0.05));
        root.add(m(new THREE.CylinderGeometry(ts * 0.028, ts * 0.028, ts * 0.5, 8), ironMat, 0, ts * 0.02, ts * 0.10, 0, 0, Math.PI / 2));
        for (var wsd = 0; wsd < 2; wsd++) {
            var wx = (wsd === 0 ? -1 : 1) * ts * 0.245;
            root.add(m(new THREE.CylinderGeometry(ts * 0.145, ts * 0.145, ts * 0.045, 12), woodMat, wx, ts * 0.02, ts * 0.10, 0, 0, Math.PI / 2));
            root.add(m(new THREE.TorusGeometry(ts * 0.145, ts * 0.018, 8, 16), ironMat, wx, ts * 0.02, ts * 0.10, 0, Math.PI / 2));
            root.add(m(new THREE.SphereGeometry(ts * 0.035, 8, 6), brassMat, wx, ts * 0.02, ts * 0.10));
        }
        /* the cannonball */
        var ballMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('obsidian.png', 1, 1),
            color: new THREE.Color(0x33363d),
            transparent: true, opacity: 0, depthWrite: true,
        });
        var ball = new THREE.Mesh(new THREE.SphereGeometry(ts * 0.16, 10, 8), ballMat);
        ball.renderOrder = 161;
        var ballGlow = new THREE.Mesh(new THREE.SphereGeometry(ts * 0.15, 10, 8), _sigMat(0xff8833));
        ball.add(ballGlow);
        scene.add(ball);   /* flies in world space, cleaned up manually */

        /* muzzle flash cross-planes */
        var flashMat = _sigMat(0xffcc66, { map: _sigBurstTex() });
        var flashA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
        var flashB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
        flashB.rotation.z = Math.PI / 4;
        flashA.renderOrder = 165; flashB.renderOrder = 165;
        muzzle.add(flashA); muzzle.add(flashB);
        var ringMat = _sigMat(0xddccaa);
        var smokeRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 20), ringMat);
        smokeRing.renderOrder = 164;
        muzzle.add(smokeRing);

        var matMs = 110, fuseMs = 90;
        var fireAt = matMs + fuseMs;
        var flyMs = Math.max(200, (opts.flyMs || 480) - fireAt);
        var lingerMs = 520, fadeMs = 300;
        var total = fireAt + flyMs + lingerMs + fadeMs;

        _sigMagicCircle3D(fromTx, fromTy, {
            color: 0xffaa44, radiusPx: ts * 0.8, growMs: 100,
            holdMs: fireAt + 250, fadeMs: 220, spin: 0.005, opacity: 0.75,
        });

        var mzWorld = new THREE.Vector3();
        var ballFrom = null;
        var ballTo = new THREE.Vector3(tw.x, tw.y + ts * 0.18, tw.z);
        var arcH = 0;
        var fired = false, landed = false;
        var trailAcc = 0, lastEl = 0;

        _sigRun(root, total, function (el) {
            var dt = el - lastEl; lastEl = el;
            var vis;
            if (el < matMs) {
                var t = el / matMs;
                var s = Math.max(0.01, _sigEaseOutBack(t));
                root.scale.set(s, s, s);
                vis = Math.min(1, t * 2);
            } else {
                root.scale.set(1, 1, 1);
                vis = 1;
            }
            if (el >= total - fadeMs) {
                vis = Math.max(0, 1 - (el - (total - fadeMs)) / fadeMs);
            }
            ironMat.opacity = vis; woodMat.opacity = vis; brassMat.opacity = vis;

            /* burning fuse sparks at the breech */
            if (el > matMs && el < fireAt && _canSpawn()) {
                trailAcc += dt;
                if (trailAcc > 30) {
                    trailAcc = 0;
                    root.updateMatrixWorld(true);
                    var bp = new THREE.Vector3(0, ts * 0.22, -ts * 0.36).applyMatrix4(root.matrixWorld);
                    var sp = _sigWorldToSpawn(bp);
                    _spawn({ x: sp.x, y: sp.y, z: sp.z, mode: 'billboard', sprite: 'ember',
                             ml: 200, size0: 8, size1: 2, vz: 30, opacity0: 1, opacity1: 0 });
                }
            }

            if (!fired && el >= fireAt) {
                fired = true;
                root.updateMatrixWorld(true);
                muzzle.getWorldPosition(mzWorld);
                ballFrom = mzWorld.clone();
                var d2 = Math.sqrt(Math.pow(ballTo.x - ballFrom.x, 2) + Math.pow(ballTo.z - ballFrom.z, 2));
                arcH = d2 * 0.20 + ts * 0.55;
                ballMat.opacity = 1;
                _sigShake('soft');
                _sigScreenFlash('#ffcc88', 110, 0.12);
                var mzs = _sigWorldToSpawn(mzWorld);
                if (_canSpawn()) {
                    _spawn({ x: mzs.x, y: mzs.y, z: mzs.z, mode: 'billboard', sprite: 'muzzle-flash',
                             ml: 180, size0: ts * 0.8, size1: ts * 0.25, opacity0: 1, opacity1: 0 });
                    for (var sm = 0; sm < 5; sm++) {
                        _spawn({ x: mzs.x + rn(-6, 6), y: mzs.y + rn(-6, 6), z: mzs.z, mode: 'billboard',
                                 sprite: 'smoke', ml: rn(500, 900), size0: rn(18, 30), size1: rn(60, 90),
                                 vx: Math.sin(yaw) * rn(40, 90), vy: Math.cos(yaw) * rn(40, 90), vz: rn(15, 45),
                                 drag: 0.7, opacity0: 0.6, opacity1: 0 });
                    }
                }
            }
            if (fired) {
                var elF = el - fireAt;
                /* recoil the whole carriage back along the firing line */
                var rec = Math.max(0, 1 - elF / 260);
                var recD = ts * 0.24 * Math.sin(Math.min(1, elF / 90) * Math.PI * 0.5) * rec;
                root.position.set(fw.x - Math.sin(yaw) * recD, fw.y, fw.z - Math.cos(yaw) * recD);
                var fT = elF / 110;
                if (fT < 1) {
                    var fs = ts * (0.55 + 0.5 * fT);
                    flashA.scale.set(fs, fs, 1); flashB.scale.set(fs, fs, 1);
                    flashMat.opacity = 0.95 * (1 - fT);
                    var rs = ts * (0.10 + 0.55 * fT);
                    smokeRing.scale.set(rs, rs, rs);
                    ringMat.opacity = 0.5 * (1 - fT);
                } else { flashMat.opacity = 0; ringMat.opacity = 0; }

                /* ballistic ball flight */
                var bt = _sigClamp01(elF / flyMs);
                if (!landed) {
                    ball.position.set(
                        ballFrom.x + (ballTo.x - ballFrom.x) * bt,
                        ballFrom.y + (ballTo.y - ballFrom.y) * bt + arcH * 4 * bt * (1 - bt),
                        ballFrom.z + (ballTo.z - ballFrom.z) * bt
                    );
                    ball.rotation.x += dt * 0.02;
                    ball.rotation.y += dt * 0.013;
                    ballGlow.material.opacity = 0.22 + 0.1 * Math.sin(el * 0.03);
                    trailAcc += dt;
                    if (trailAcc > 34 && _canSpawn()) {
                        trailAcc = 0;
                        var bs = _sigWorldToSpawn(ball.position);
                        _spawn({ x: bs.x, y: bs.y, z: bs.z, mode: 'billboard', sprite: 'ember',
                                 ml: 260, size0: 9, size1: 2, opacity0: 0.9, opacity1: 0 });
                        _spawn({ x: bs.x, y: bs.y, z: bs.z, mode: 'billboard', sprite: 'smoke',
                                 ml: 420, size0: 12, size1: 30, vz: 10, opacity0: 0.35, opacity1: 0 });
                    }
                    if (bt >= 1) {
                        landed = true;
                        ball.visible = false;
                        _spawnExplosionRing3D(toTx, toTy, opts.aoeRadius != null ? opts.aoeRadius : 1, {});
                        _sigShockRing3D(toTx, toTy, { color: 0xffaa44, r1: ts * 1.9 });
                        _sigSpeedBurst3D(toTx, toTy, { color: 0xffcc88 });
                        _sigSparks(toTx, toTy, 'ember', 20);
                        _sigSparks(toTx, toTy, 'rock-debris', 10, { vxy: 220, vz0: 60, vz1: 260, gravity: 420 });
                        _sigShake('hard');
                        _sigScreenFlash('#ffaa55', 150, 0.24);
                        if (_canSpawn()) {
                            var cpx2 = tilePx(toTx, toTy);
                            _spawn({ x: cpx2.x, y: cpx2.y, z: unitSurfaceZ(toTx, toTy) + 1,
                                     mode: 'world', sprite: 'scorch', ml: 1600,
                                     size0: ts * 0.9, size1: ts * 1.05, opacity0: 0.85, opacity1: 0 });
                        }
                    }
                }
            }
        });
        /* the ball lives outside the rig group — dispose it when the run ends */
        window.setTimeout(function () {
            scene.remove(ball);
            ball.geometry.dispose(); ballMat.dispose();
            ballGlow.geometry.dispose(); ballGlow.material.dispose();
        }, total + 60);
    }

    /* ── SPECTRAL FIREARMS — giant stand-summoned guns for the gunslinger /
       sniper kits. One rig per (kind, caster tile); multi-hit spells reuse
       the live rig and just squeeze the trigger again (Double Pump cycles
       its pump between shells, the revolver's cylinder rolls, the sniper
       paints an aim-laser before its hit). Clad in the dedicated
       gunmetal.png plate sprite. ─────────────────────────────────────────── */
    var _sigGunRigs = {};

    function _sigBuildGun(kind, ts) {
        var steelMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('gunmetal.png', 1, 1),
            color: new THREE.Color(0xdfe4ec), transparent: true, opacity: 0, depthWrite: true,
        });
        var woodMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('wood.png', 1, 1),
            color: new THREE.Color(0x6e4a2e), transparent: true, opacity: 0, depthWrite: true,
        });
        var brassMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('gold.png', 1, 1),
            color: new THREE.Color(0xd9b25e), transparent: true, opacity: 0, depthWrite: true,
        });
        var gun = new THREE.Group();
        function m2(geo, mat, x, y, z, rx, ry, rz) {
            var mm = new THREE.Mesh(geo, mat);
            mm.position.set(x, y, z);
            mm.rotation.set(rx || 0, ry || 0, rz || 0);
            mm.renderOrder = 160;
            gun.add(mm);
            return mm;
        }
        var muzzleZ, drum = null, pump = null, lens = null;
        if (kind === 'revolver') {
            muzzleZ = ts * 0.74;
            m2(new THREE.CylinderGeometry(ts * 0.042, ts * 0.045, ts * 0.62, 10), steelMat, 0, ts * 0.055, ts * 0.42, Math.PI / 2);
            m2(new THREE.CylinderGeometry(ts * 0.02, ts * 0.02, ts * 0.44, 8), steelMat, 0, ts * 0.005, ts * 0.36, Math.PI / 2);
            m2(new THREE.BoxGeometry(ts * 0.02, ts * 0.045, ts * 0.02), steelMat, 0, ts * 0.105, ts * 0.70);
            m2(new THREE.BoxGeometry(ts * 0.075, ts * 0.13, ts * 0.28), steelMat, 0, ts * 0.02, ts * 0.02);
            drum = m2(new THREE.CylinderGeometry(ts * 0.082, ts * 0.082, ts * 0.17, 12), steelMat, 0, ts * 0.045, ts * 0.10, Math.PI / 2);
            for (var ch = 0; ch < 6; ch++) {
                var ca = ch * Math.PI / 3;
                var bore = new THREE.Mesh(new THREE.CylinderGeometry(ts * 0.018, ts * 0.018, ts * 0.175, 6),
                    new THREE.MeshBasicMaterial({ color: 0x14161a, transparent: true, opacity: 0, depthWrite: true }));
                bore.position.set(Math.cos(ca) * ts * 0.05, ts * 0.045 + Math.sin(ca) * ts * 0.05, ts * 0.10);
                bore.rotation.x = Math.PI / 2;
                bore.renderOrder = 161;
                gun.add(bore);
                bore._ew_isBore = true;
            }
            m2(new THREE.BoxGeometry(ts * 0.055, ts * 0.03, ts * 0.24), steelMat, 0, ts * 0.115, ts * 0.06);
            m2(new THREE.BoxGeometry(ts * 0.03, ts * 0.07, ts * 0.035), brassMat, 0, ts * 0.10, -ts * 0.135, -0.6);
            m2(new THREE.BoxGeometry(ts * 0.06, ts * 0.20, ts * 0.10), woodMat, 0, -ts * 0.115, -ts * 0.135, 0.42);
            var tg = m2(new THREE.TorusGeometry(ts * 0.045, ts * 0.011, 6, 12), brassMat, 0, -ts * 0.055, ts * 0.02, 0, Math.PI / 2);
            tg.renderOrder = 160;
        } else if (kind === 'shotgun') {
            muzzleZ = ts * 0.95;
            m2(new THREE.CylinderGeometry(ts * 0.036, ts * 0.038, ts * 0.95, 10), steelMat, 0, ts * 0.05, ts * 0.45, Math.PI / 2);
            m2(new THREE.CylinderGeometry(ts * 0.028, ts * 0.028, ts * 0.72, 8), steelMat, 0, -ts * 0.012, ts * 0.36, Math.PI / 2);
            m2(new THREE.SphereGeometry(ts * 0.012, 6, 5), brassMat, 0, ts * 0.09, ts * 0.92);
            pump = m2(new THREE.CylinderGeometry(ts * 0.052, ts * 0.052, ts * 0.24, 10), woodMat, 0, ts * 0.015, ts * 0.42, Math.PI / 2);
            m2(new THREE.BoxGeometry(ts * 0.075, ts * 0.115, ts * 0.32), steelMat, 0, ts * 0.02, -ts * 0.05);
            m2(new THREE.PlaneGeometry(ts * 0.10, ts * 0.05), brassMat, ts * 0.039, ts * 0.03, -ts * 0.02, 0, Math.PI / 2);
            m2(new THREE.BoxGeometry(ts * 0.06, ts * 0.11, ts * 0.34), woodMat, 0, -ts * 0.035, -ts * 0.36, 0.16);
            var tg2 = m2(new THREE.TorusGeometry(ts * 0.045, ts * 0.011, 6, 12), brassMat, 0, -ts * 0.05, -ts * 0.10, 0, Math.PI / 2);
            tg2.renderOrder = 160;
        } else { /* sniper */
            muzzleZ = ts * 1.25;
            m2(new THREE.CylinderGeometry(ts * 0.026, ts * 0.030, ts * 1.15, 10), steelMat, 0, ts * 0.03, ts * 0.62, Math.PI / 2);
            m2(new THREE.CylinderGeometry(ts * 0.042, ts * 0.042, ts * 0.11, 8), steelMat, 0, ts * 0.03, ts * 1.19, Math.PI / 2);
            m2(new THREE.BoxGeometry(ts * 0.065, ts * 0.10, ts * 0.40), steelMat, 0, ts * 0.015, -ts * 0.02);
            /* scope */
            m2(new THREE.CylinderGeometry(ts * 0.042, ts * 0.042, ts * 0.34, 10), steelMat, 0, ts * 0.125, ts * 0.04, Math.PI / 2);
            m2(new THREE.TorusGeometry(ts * 0.046, ts * 0.012, 6, 12), steelMat, 0, ts * 0.125, ts * 0.215);
            m2(new THREE.BoxGeometry(ts * 0.022, ts * 0.05, ts * 0.03), steelMat, 0, ts * 0.075, ts * 0.10);
            m2(new THREE.BoxGeometry(ts * 0.022, ts * 0.05, ts * 0.03), steelMat, 0, ts * 0.075, -ts * 0.03);
            lens = new THREE.Mesh(new THREE.CircleGeometry(ts * 0.035, 10), _sigMat(0x77e0ff));
            lens.position.set(0, ts * 0.125, ts * 0.222);
            lens.renderOrder = 162;
            gun.add(lens);
            /* bolt handle */
            m2(new THREE.CylinderGeometry(ts * 0.010, ts * 0.010, ts * 0.07, 6), steelMat, ts * 0.055, ts * 0.04, -ts * 0.08, 0, 0, Math.PI / 2);
            m2(new THREE.SphereGeometry(ts * 0.018, 6, 5), brassMat, ts * 0.095, ts * 0.04, -ts * 0.08);
            /* stock + cheek riser */
            m2(new THREE.BoxGeometry(ts * 0.055, ts * 0.10, ts * 0.36), woodMat, 0, -ts * 0.025, -ts * 0.38, 0.14);
            m2(new THREE.BoxGeometry(ts * 0.05, ts * 0.045, ts * 0.16), woodMat, 0, ts * 0.055, -ts * 0.33);
            /* bipod */
            m2(new THREE.CylinderGeometry(ts * 0.008, ts * 0.008, ts * 0.30, 6), steelMat, ts * 0.05, -ts * 0.10, ts * 0.75, 0.35, 0, 0.5);
            m2(new THREE.CylinderGeometry(ts * 0.008, ts * 0.008, ts * 0.30, 6), steelMat, -ts * 0.05, -ts * 0.10, ts * 0.75, 0.35, 0, -0.5);
        }
        var muzzle = new THREE.Object3D();
        muzzle.position.set(0, kind === 'sniper' ? ts * 0.03 : ts * 0.05, muzzleZ);
        gun.add(muzzle);

        function setFade(f) {
            steelMat.opacity = f; woodMat.opacity = f; brassMat.opacity = f;
            gun.traverse(function (o) {
                if (o._ew_isBore) o.material.opacity = f;
            });
            if (lens) lens.material.opacity = 0.6 * f;
        }
        setFade(0);
        return { group: gun, setFade: setFade, muzzle: muzzle, drum: drum, pump: pump, lens: lens,
                 pumpBaseZ: pump ? pump.position.z : 0, steelMat: steelMat };
    }

    function _sigGunRig3D(kind, fromTx, fromTy, toTx, toTy, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var key = kind + '@' + Math.round(fromTx) + ',' + Math.round(fromTy) + (opts.sky ? '#sky' : '') + (opts.key || '');
        var live = _sigGunRigs[key];
        if (live && !live.dead) { live.retarget(toTx, toTy); live.queueShot(); return; }

        var fw = _worldPos(fromTx, fromTy);
        var ts = fw.ts;
        var color = opts.glowColor != null ? opts.glowColor : (kind === 'sniper' ? 0x77e0ff : 0xffcc66);

        var root = new THREE.Group();
        var aim = new THREE.Group();
        aim.rotation.order = 'YXZ';
        root.add(aim);
        var g = _sigBuildGun(kind, ts);
        /* these are giant STAND weapons — big enough to read from the
           diorama camera, floating over their summoner */
        g.group.scale.setScalar(opts.modelScale != null ? opts.modelScale : 2.2);
        aim.add(g.group);

        /* flat summon disc spinning under the floating weapon (an upright
           glyph reads edge-on from the diorama camera) */
        var glyphMat = _sigMat(color, { map: _sigMagicCircleTex() });
        var glyph = new THREE.Mesh(new THREE.PlaneGeometry(ts * 1.15, ts * 1.15), glyphMat);
        glyph.rotation.x = -Math.PI / 2;
        glyph.position.y = -ts * 0.38;
        glyph.renderOrder = 156;
        root.add(glyph);

        /* muzzle flash cross */
        var flashMat = _sigMat(0xffd98a, { map: _sigBurstTex() });
        var fA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
        var fB = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
        fB.rotation.z = Math.PI / 4;
        fA.renderOrder = 165; fB.renderOrder = 165;
        g.muzzle.add(fA); g.muzzle.add(fB);

        /* sniper aim laser + tracer */
        var laser = null, laserMat = null, tracer = null, tracerMat = null;
        if (kind === 'sniper') {
            laserMat = _sigMat(0xff4455);
            laser = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.02, 1), laserMat);
            laser.renderOrder = 163;
            aim.add(laser);
            tracerMat = _sigMat(0xbbf0ff);
            tracer = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.06, 1), tracerMat);
            tracer.renderOrder = 164;
            aim.add(tracer);
        }

        var rig = {
            dead: false,
            shotsQueued: 1,
            shotsFired: 0,
            nextShotAt: opts.sky ? 140 : (kind === 'sniper' ? 260 : 95),
            interval: opts.interval != null ? opts.interval : (kind === 'shotgun' ? 300 : kind === 'sniper' ? 480 : 170),
            lastActivity: 0,
            recoil: 0,
            pumpT: -1,
            drumSpin: 0,
            dist: 1,
            ejected: 0,
            targetTx: toTx, targetTy: toTy,
        };
        if (opts.shots) rig.shotsQueued = opts.shots;

        function aimAt(ttx, tty) {
            rig.targetTx = ttx; rig.targetTy = tty;
            var twp = _worldPos(ttx, tty);
            var ax = twp.x - root.position.x, az = twp.z - root.position.z;
            var ay = (twp.y + ts * 0.4) - root.position.y;
            var dh = Math.sqrt(ax * ax + az * az) || 1;
            rig.dist = Math.sqrt(dh * dh + ay * ay);
            if (opts.sky) {
                aim.rotation.y = opts.skyYaw != null ? opts.skyYaw : rn(0, Math.PI * 2);
                aim.rotation.x = 1.15;   /* rain fire down on the tile below */
            } else {
                aim.rotation.y = Math.atan2(ax, az);
                aim.rotation.x = -Math.atan2(ay, dh);
            }
        }
        if (opts.sky) {
            var swp = _worldPos(toTx, toTy);
            root.position.set(swp.x, swp.y + ts * 2.9, swp.z);
        } else {
            var dxr = 0, dzr = 0;
            var twp0 = _worldPos(toTx, toTy);
            var ddx = twp0.x - fw.x, ddz = twp0.z - fw.z;
            var dl = Math.sqrt(ddx * ddx + ddz * ddz) || 1;
            dxr = ddx / dl; dzr = ddz / dl;
            root.position.set(fw.x + dxr * ts * 0.45, fw.y + ts * 1.15, fw.z + dzr * ts * 0.45);
        }
        aimAt(toTx, toTy);

        rig.retarget = aimAt;
        rig.queueShot = function () {
            rig.shotsQueued++;
        };

        var flashT = -1;
        var shells = [];
        var shellGeo = new THREE.BoxGeometry(ts * 0.018, ts * 0.018, ts * 0.05);
        var shellMat = new THREE.MeshBasicMaterial({
            map: _sigTerrainTex('gold.png', 1, 1),
            color: new THREE.Color(0xE8C15A), transparent: true, opacity: 1, depthWrite: true,
        });

        function ejectShell(el) {
            rig.ejected++;
            var sh = new THREE.Mesh(shellGeo, shellMat);
            sh.renderOrder = 161;
            var basePos = new THREE.Vector3(ts * 0.05, ts * 0.04, kind === 'revolver' ? ts * 0.10 : -ts * 0.03);
            sh.position.copy(basePos);
            aim.add(sh);
            shells.push({
                mesh: sh, t0: el,
                vx: rn(0.10, 0.22) * ts, vy: rn(0.18, 0.28) * ts, vz: rn(-0.06, 0.02) * ts,
                rx: rn(-8, 8), rz: rn(-8, 8),
            });
        }

        function fireShot(el) {
            rig.shotsFired++;
            rig.lastActivity = el;
            rig.recoil = 1;
            flashT = el;
            rig.drumSpin = kind === 'revolver' ? 1 : 0;
            if (kind === 'shotgun') rig.pumpT = el + 110;
            else ejectShell(el);
            root.updateMatrixWorld(true);
            var mz = new THREE.Vector3();
            g.muzzle.getWorldPosition(mz);
            var sp = _sigWorldToSpawn(mz);
            if (_canSpawn()) {
                _spawn({ x: sp.x, y: sp.y, z: sp.z, mode: 'billboard', sprite: 'muzzle-flash',
                         ml: 150, size0: ts * (kind === 'sniper' ? 0.75 : 0.55), size1: ts * 0.15,
                         opacity0: 1, opacity1: 0 });
                _spawn({ x: sp.x, y: sp.y, z: sp.z, mode: 'billboard', sprite: 'smoke',
                         ml: 500, size0: 14, size1: 40, vz: 20, drag: 0.6, opacity0: 0.4, opacity1: 0 });
            }
            if (kind === 'sniper') {
                _sigScreenFlash('#cfefff', 90, 0.10);
                _sigShake('soft');
            }
        }

        var linger = opts.sky ? 260 : 620;
        var fadeMs = 200;
        var CAP = 5200;
        var fadeStart = -1;
        var lastEl = 0;

        var entry = _sigRun(root, CAP, function (el) {
            var dt = el - lastEl; lastEl = el;

            /* materialize */
            var matF = _sigClamp01(el / 100);
            var f = matF;
            if (fadeStart >= 0) f = Math.max(0, 1 - (el - fadeStart) / fadeMs);
            g.setFade(f);
            glyphMat.opacity = 0.55 * f * (0.7 + 0.3 * Math.sin(el * 0.006));
            glyph.rotation.z = el * 0.004;
            shellMat.opacity = f;

            /* fire queued shots */
            if (fadeStart < 0 && rig.shotsFired < rig.shotsQueued && el >= rig.nextShotAt
                && (kind !== 'shotgun' || rig.pumpT < 0 || el > rig.pumpT + 220)) {
                fireShot(el);
                rig.nextShotAt = el + rig.interval;
                if (opts.sky && opts.shots && rig.shotsFired < opts.shots) rig.shotsQueued = opts.shots;
            }
            rig.lastActivity = Math.max(rig.lastActivity, 0);

            /* recoil */
            rig.recoil = Math.max(0, rig.recoil - dt * 0.006);
            var basePitch = aim.rotation.x;
            g.group.position.z = -ts * (kind === 'sniper' ? 0.14 : 0.10) * rig.recoil;
            g.group.rotation.x = -0.10 * rig.recoil;

            /* muzzle flash cross */
            if (flashT >= 0) {
                var fT = (el - flashT) / 90;
                if (fT < 1) {
                    var fs = ts * (kind === 'sniper' ? 0.7 : 0.5) * (0.6 + 0.6 * fT);
                    fA.scale.set(fs, fs, 1); fB.scale.set(fs, fs, 1);
                    flashMat.opacity = 0.95 * (1 - fT) * f;
                } else flashMat.opacity = 0;
            }

            /* revolver cylinder roll */
            if (g.drum) {
                rig.drumSpin = Math.max(0, rig.drumSpin - dt * 0.004);
                g.drum.rotation.z += dt * 0.02 * rig.drumSpin;
            }
            /* shotgun pump cycle */
            if (g.pump && rig.pumpT >= 0 && el >= rig.pumpT) {
                var pT = (el - rig.pumpT) / 200;
                if (pT < 1) {
                    g.pump.position.z = g.pumpBaseZ - ts * 0.16 * Math.sin(pT * Math.PI);
                    if (pT > 0.45 && rig.ejected < rig.shotsFired) ejectShell(el);
                } else {
                    g.pump.position.z = g.pumpBaseZ;
                }
            }
            /* sniper aim laser (visible until the first round leaves) + tracer */
            if (laser) {
                if (rig.shotsFired === 0 && fadeStart < 0) {
                    laser.visible = true;
                    laser.scale.y = rig.dist;
                    laser.position.set(0, ts * 0.03, ts * 1.25 + rig.dist / 2);
                    laser.rotation.x = Math.PI / 2;
                    laserMat.opacity = (0.22 + 0.14 * Math.sin(el * 0.02)) * f;
                    if (g.lens) g.lens.material.opacity = (0.5 + 0.45 * Math.sin(el * 0.02)) * f;
                } else {
                    laserMat.opacity = Math.max(0, laserMat.opacity - dt * 0.004);
                }
                if (flashT >= 0) {
                    var trT = (el - flashT) / 110;
                    if (trT < 1) {
                        tracer.visible = true;
                        tracer.scale.y = rig.dist;
                        tracer.position.set(0, ts * 0.03, ts * 1.25 + rig.dist / 2);
                        tracer.rotation.x = Math.PI / 2;
                        tracerMat.opacity = 0.8 * (1 - trT) * f;
                    } else tracerMat.opacity = 0;
                }
            }
            /* tumbling shell casings */
            for (var si = shells.length - 1; si >= 0; si--) {
                var s = shells[si];
                var st = (el - s.t0) / 1000;
                if (st > 0.55) { s.mesh.visible = false; shells.splice(si, 1); continue; }
                s.mesh.position.x += s.vx * dt / 1000;
                s.mesh.position.y += (s.vy - ts * 2.4 * st) * dt / 1000;
                s.mesh.position.z += s.vz * dt / 1000;
                s.mesh.rotation.x += s.rx * dt / 1000;
                s.mesh.rotation.z += s.rz * dt / 1000;
            }

            /* retire the rig once every queued shot is out and it's idle */
            if (fadeStart < 0 && rig.shotsFired >= rig.shotsQueued
                && el > rig.lastActivity + linger) {
                fadeStart = el;
            }
            if ((fadeStart >= 0 && el > fadeStart + fadeMs) || el > CAP - 50) {
                rig.dead = true;
                delete _sigGunRigs[key];
                if (entry) entry.finish();
            }
        });
        if (!entry) return;
        rig.entry = entry;
        _sigGunRigs[key] = rig;
    }

    /* ── TESLA COIL deploy cinematic — the persistent coil model itself is
       drawn by three-renderer (deployed objects); this is the summon: rune
       circle, charge pillar, crawling arcs off the toroid, spark rain. ───── */
    function _sigTeslaCoil3D(tx, ty) {
        var ts = _cfg().tileSize || 128;
        _sigMagicCircle3D(tx, ty, {
            color: 0x66ccff, radiusPx: ts * 0.85, growMs: 140,
            holdMs: 700, fadeMs: 260, spin: 0.006, opacity: 0.85,
        });
        _sigLightPillar3D(tx, ty, { color: 0x99ddff, coreColor: 0xffffff, ms: 520, height: ts * 1.6, radius: ts * 0.16 });
        _sigSparks(tx, ty, 'spark-blue', 14, { vxy: 140, vz0: 60, vz1: 260, gravity: 300 });
        _sigScreenFlash('#aaddff', 120, 0.10);
        if (window.ThreeLightning) {
            var cfg = _cfg();
            var pad = cfg.boardPadding || 2;
            var c = tilePx(tx, ty);
            var topZ = unitSurfaceZ(tx, ty) + 3 + ts * 0.62;
            for (var i = 0; i < 5; i++) {
                (function (idx) {
                    window.setTimeout(function () {
                        if (_suppressed()) return;
                        var a = rn(0, Math.PI * 2);
                        var r = ts * rn(0.45, 0.85);
                        ThreeLightning.bolt(
                            { x: c.x - pad, y: topZ, z: c.y - pad },
                            { x: c.x - pad + Math.cos(a) * r, y: unitSurfaceZ(tx, ty) + 6, z: c.y - pad + Math.sin(a) * r },
                            { segments: 7, jitter: 0.5, branchChance: 0.25, branchDepth: 1,
                              coreWidth: 2.5, glowWidth: 7, durationMs: 150 + rn(0, 90),
                              color: 0xbbe6ff, glowColor: 0x4499ff });
                    }, 140 + idx * 130);
                })(i);
            }
        }
    }

    /* ── 3D flying saucer builder — real geometry instead of the flat ufo
       sprite: lathe hull with procedural panel texture, glass dome, chasing
       rim lights, additive underglow ─────────────────────────────────────── */
    function _sigBuildUFO(radiusPx) {
        var group = new THREE.Group();

        var pts = [
            new THREE.Vector2(0.0, -0.16),
            new THREE.Vector2(0.35, -0.14),
            new THREE.Vector2(0.75, -0.08),
            new THREE.Vector2(1.0, 0.0),
            new THREE.Vector2(0.78, 0.10),
            new THREE.Vector2(0.45, 0.16),
            new THREE.Vector2(0.0, 0.18),
        ];
        /* riveted-steel pixel cladding — the same metal sprite the turrets
           wear, so the saucer sits in the board's art style */
        var hullMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0xd0d4dc), map: _sigTerrainTex('metal.png', 3, 1),
            transparent: true, opacity: 1, depthWrite: true,
        });
        var hull = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), hullMat);
        hull.renderOrder = 160;
        group.add(hull);

        var rimMat = _sigMat(0x9adcff);
        var rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 8, 48), rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.renderOrder = 161;
        group.add(rim);

        var domeMat = _sigMat(0x9adcff);
        var dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
        dome.position.y = 0.14;
        dome.renderOrder = 162;
        group.add(dome);

        var lights = [];
        for (var i = 0; i < 10; i++) {
            var lm = _sigMat(0xaaffcc);
            var lite = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), lm);
            var a = i * Math.PI * 2 / 10;
            lite.position.set(Math.cos(a) * 0.88, -0.02, Math.sin(a) * 0.88);
            lite.renderOrder = 162;
            group.add(lite);
            lights.push(lm);
        }

        var glowMat = _sigMat(0x66ff99, { map: _sigGlowTex() });
        var glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = -0.17;
        glow.scale.set(0.8, 0.8, 0.8);
        glow.renderOrder = 159;
        group.add(glow);

        group.scale.set(radiusPx, radiusPx, radiusPx);
        return {
            group: group, lights: lights,
            hullMat: hullMat, rimMat: rimMat, domeMat: domeMat, glowMat: glowMat,
        };
    }

    /* ── HERO: saucer flight sequence — swoops in banking, hovers with
       bobbing spin + chasing rim lights (+ optional tractor beam), then
       blasts off with a motion-stretch streak ───────────────────────────── */
    function _sigUFO3D(tx, ty, opts) {
        opts = opts || {};
        var scene = _getVFXScene(); if (!scene) return;
        var wp = _worldPos(tx, ty);
        var ts = wp.ts;
        var R = opts.radiusPx != null ? opts.radiusPx : ts * 1.05;
        var hoverH = opts.hoverH != null ? opts.hoverH : ts * 2.7;
        var enterMs = opts.enterMs != null ? opts.enterMs : 420;
        var hoverMs = opts.hoverMs != null ? opts.hoverMs : 1200;
        var exitMs = opts.exitMs != null ? opts.exitMs : 480;
        var total = enterMs + hoverMs + exitMs;

        var ufo = _sigBuildUFO(R);
        var group = new THREE.Group();
        group.position.set(wp.x, wp.y, wp.z);
        group.add(ufo.group);

        var enterDir = rn(0, Math.PI * 2);
        var exitDir = enterDir + Math.PI + rn(-0.8, 0.8);
        var enterDist = ts * 9;

        var beamMat = null, beam = null;
        if (opts.beam) {
            beamMat = _sigMat(opts.beamColor != null ? opts.beamColor : 0x55ff99);
            beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 1, 1, 24, 1, true), beamMat);
            beam.renderOrder = 157;
            group.add(beam);
        }

        _sigRun(group, total, function (el) {
            for (var i = 0; i < ufo.lights.length; i++) {
                ufo.lights[i].opacity = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(el * 0.006 - i * 0.63));
            }
            ufo.group.rotation.y = el * 0.0022;
            ufo.group.scale.set(R, R, R);
            var fade = 1;
            if (el < enterMs) {
                var t = el / enterMs, e = _sigEaseOutCubic(t);
                var d = enterDist * (1 - e);
                ufo.group.position.set(
                    Math.cos(enterDir) * d,
                    hoverH + (1 - e) * ts * 2.2,
                    Math.sin(enterDir) * d);
                ufo.group.rotation.z = 0.30 * (1 - e) * Math.cos(enterDir);
                ufo.group.rotation.x = -0.30 * (1 - e) * Math.sin(enterDir);
                if (beamMat) beamMat.opacity = 0;
            } else if (el < enterMs + hoverMs) {
                var t2 = (el - enterMs) / hoverMs;
                ufo.group.position.set(
                    Math.sin(el * 0.003) * 4,
                    hoverH + Math.sin(el * 0.004) * 7,
                    Math.cos(el * 0.0025) * 4);
                ufo.group.rotation.z = 0;
                ufo.group.rotation.x = 0;
                if (beam) {
                    var bh = hoverH - R * 0.16;
                    beam.position.y = bh / 2;
                    beam.scale.set(R * 0.85, bh, R * 0.85);
                    var ripple = 0.75 + 0.25 * Math.sin(el * 0.02);
                    beamMat.opacity = 0.22 * ripple * Math.min(1, t2 * 4)
                        * (t2 > 0.85 ? (1 - t2) / 0.15 : 1);
                }
            } else {
                var t3 = (el - enterMs - hoverMs) / exitMs, e3 = _sigEaseInCubic(t3);
                var d3 = enterDist * 1.2 * e3;
                if (beamMat) beamMat.opacity = 0;
                ufo.group.position.set(
                    Math.cos(exitDir) * d3,
                    hoverH + e3 * ts * 3,
                    Math.sin(exitDir) * d3);
                ufo.group.rotation.z = -0.4 * e3 * Math.cos(exitDir);
                /* motion-stretch streak as it blasts off */
                ufo.group.scale.set(R * (1 + e3 * 0.6), R * (1 - e3 * 0.3), R * (1 + e3 * 0.6));
                fade = 1 - Math.max(0, (t3 - 0.55) / 0.45);
            }
            ufo.hullMat.opacity = fade;
            ufo.rimMat.opacity = 0.5 * fade;
            ufo.domeMat.opacity = 0.4 * fade;
            ufo.glowMat.opacity = (0.5 + 0.2 * Math.sin(el * 0.01)) * fade;
        });
    }

    /* ── storm strike: rune circle in the sky, then shock ring + flash when
       the lightning lands (delayMs = the spell's descentMs) ─────────────── */
    function _sigStormStrike3D(tx, ty, opts) {
        opts = opts || {};
        var ts = _cfg().tileSize || 128;
        var color = opts.color != null ? opts.color : 0x88bbff;
        var delayMs = opts.delayMs != null ? opts.delayMs : 600;
        _sigMagicCircle3D(tx, ty, {
            color: color, radiusPx: opts.radiusPx != null ? opts.radiusPx : ts * 1.5,
            height: opts.skyH != null ? opts.skyH : 560,
            growMs: 140, holdMs: Math.max(160, delayMs - 140), fadeMs: 300,
            spin: 0.006, opacity: 0.75,
        });
        window.setTimeout(function () {
            if (_suppressed()) return;
            _sigShockRing3D(tx, ty, { color: color, r1: ts * 2.0, ms: 380 });
            _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
            _sigScreenFlash(_sigCss(color), 140, opts.flashPeak != null ? opts.flashPeak : 0.28);
        }, delayMs);
    }

    /* ── heavenly greatsword for judgment-type descents: timing is derived
       from the spell's own descentMs so the blade lands exactly when the
       damage does, then a pillar of light erupts ─────────────────────────── */
    function _sigJudgmentSword3D(tx, ty, descentEffectId, opts) {
        var def = EFFECTS[descentEffectId] || {};
        var dm = def.descentMs || 700;
        var o = opts || {};
        o.summonMs = Math.max(80, Math.round(dm * 0.3));
        o.holdMs = Math.max(80, Math.round(dm * 0.5));
        o.plungeMs = Math.max(60, Math.round(dm * 0.2));
        _sigStandSword3D(tx, ty, o);
        window.setTimeout(function () {
            if (_suppressed()) return;
            _sigLightPillar3D(tx, ty, {
                color: o.pillarColor != null ? o.pillarColor : 0xffe9a8,
                coreColor: 0xfff6d8, ms: 1000, height: 780,
            });
        }, dm);
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
        raceShieldWall:      function(tx, ty, r) {
            _spawnDome3D(tx, ty, r, {
                outerColor: 0xa0a0c3, innerColor: 0xccccee, wireColor: 0xbbbbdd,
                segments: 16, rings: 8, wireSegments: 8, wireRings: 4,
                radiusScale: 0.4, heightRatio: 0.7,
                outerOpacity: 0.3, innerOpacity: 0.18, wireOpacity: 0.35,
                wireRotSpeed: 0.0002,
                expandMs: 300, holdMs: 500, fadeMs: 400,
            });
            /* Castle Fortress — a real ring of tower shields locks in */
            _sigShieldRing3D(tx, ty, { glowColor: 0xbbccff, count: 6, radiusTiles: 0.85, holdMs: 950, scale: 0.75 });
        },
        raceBoneWall:        function(tx, ty, r) { _spawnDome3D(tx, ty, r, {
            outerColor: 0x998866, innerColor: 0xccaa77, wireColor: 0xbbaa88,
            segments: 10, rings: 6, wireSegments: 5, wireRings: 3,
            radiusScale: 0.4, heightRatio: 0.5,
            outerOpacity: 0.35, innerOpacity: 0.2, wireOpacity: 0.4,
            wireRotSpeed: 0.0001,
            expandMs: 350, holdMs: 400, fadeMs: 400,
        }); },
        /* Tesla Coil — the persistent coil model is drawn by three-renderer;
           this is the electric summon cinematic */
        raceTeslaTrap:       function(tx, ty) { _sigTeslaCoil3D(tx, ty); },
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

        raceAbductionBeam:   function(tx, ty) {
            _spawnAbductionBeam3D(tx, ty);
            _sigUFO3D(tx, ty, { enterMs: 280, hoverMs: 1250, exitMs: 450,
                hoverH: (_cfg().tileSize || 128) * 3.1 });
        },

        nuke:                function(tx, ty, r) { _spawnNukeCloud3D(tx, ty, r); },
        meteor:              function(tx, ty, r, dm, tm) {
            _spawnMeteorSphere3D(tx, ty, dm, tm);
            var ts0 = _cfg().tileSize || 128;
            _sigMagicCircle3D(tx, ty, {
                color: 0xff7733, radiusPx: ts0 * (r != null ? r * 0.8 + 1 : 1.6),
                growMs: 180, holdMs: Math.max(200, (dm || 700) - 180), fadeMs: 320,
                spin: 0.003,
            });
            window.setTimeout(function() {
                if (_suppressed()) return;
                _sigShockRing3D(tx, ty, { color: 0xffaa55, r1: ts0 * 2.4, ms: 520 });
                _sigSpeedBurst3D(tx, ty, { color: 0xffcc88 });
                _sigScreenFlash('#ffd9a8', 200, 0.32);
            }, dm || 700);
        },

        raceMushroomRing:    function(tx, ty, r) { _spawnMushroomRing3D(tx, ty, r); },
        sharedWardOfThorns:  function(tx, ty) { _spawnWardOfThorns3D(tx, ty); },

        sentaiGreenArrow:    function(tx, ty) { _spawnGreenArrow3D(tx, ty); },
        sharedGlacialTomb:   function(tx, ty) { _spawnGlacialTombShard3D(tx, ty); },

        shootout:            function(tx, ty, r) {
            _spawnBulletRainArea3D(tx, ty, r != null ? r : 1, 680);
            /* twin spectral revolvers hang over the kill-box, fanning the
               hammer down into it while the lead rains */
            var _soYaw = rn(0, Math.PI * 2);
            _sigGunRig3D('revolver', tx, ty, tx, ty, { sky: true, shots: 3, interval: 140, skyYaw: _soYaw, key: 'A' });
            _sigGunRig3D('revolver', tx, ty, tx, ty, { sky: true, shots: 3, interval: 155, skyYaw: _soYaw + Math.PI, key: 'B' });
        },

        /* ── signature anime cinematics (SIGNATURE 3D toolkit above). These
           are the staples; new spells should pick a builder + palette here
           rather than getting bespoke code. ─────────────────────────────── */

        /* SLASH COMBOS — the greatswords now actually SWING: chained arc
           slashes with afterimages and a heavy finisher (the sky-drop plunge
           survives only on the judgment descents, where falling is the point) */
        dragonSlash: function(tx, ty) { _sigSlashCombo3D(tx, ty, {
            glowColor: 0xff7733, circleColor: 0xff5522,
            bladeTex: 'obsidian.png', bladeColor: 0xffffff,   /* lava-cracked black rock */
            guardTex: 'metal.png', guardColor: 0xc08850,      /* bronze fittings */
            sparkSprite: 'ember', moteSprite: 'ember',
            len: (_cfg().tileSize || 128) * 1.9,
            slashes: [
                { dYaw: 0.55, dir: 1, tilt: 0.55 },
                { dYaw: -0.55, dir: -1, tilt: -0.5 },
                { dYaw: 1.4, dir: 1, tilt: 0.1, heavy: true },
            ],
            ringTiles: 1.9, flashPeak: 0.3,
        }); },
        guardSlash: function(tx, ty) { _sigSlashCombo3D(tx, ty, {
            glowColor: 0x77aaff, circleColor: 0x99bbff,
            bladeTex: 'metal.png', bladeColor: 0xbfd4ff,      /* blued steel */
            guardTex: 'metal.png', guardColor: 0x8f9db5,
            len: (_cfg().tileSize || 128) * 1.6,
            slashes: [
                { dYaw: 0.4, dir: 1, tilt: 0.4 },
                { dYaw: -1.1, dir: -1, tilt: -0.15, heavy: true },
            ],
            shake: 'normal', flashPeak: 0.2,
        }); },
        sneakSlash: function(tx, ty) { _sigSlashCombo3D(tx, ty, {
            glowColor: 0xbb55ff, circleColor: 0x8833cc,
            bladeTex: 'obsidian.png', bladeColor: 0xaa88ee,   /* venom-purple obsidian */
            guardTex: 'metal.png', guardColor: 0x5a4a70,
            len: (_cfg().tileSize || 128) * 1.35,
            summonMs: 90, windMs: 50, swingMs: 65, recoverMs: 40, fadeMs: 180,
            slashes: [
                { dYaw: 0.7, dir: 1, tilt: 0.6 },
                { dYaw: -0.7, dir: -1, tilt: -0.6 },
                { dYaw: Math.PI, dir: 1, tilt: 0.15, heavy: true },
            ],
            moteSprite: 'void-mist', flashPeak: 0.16, shake: 'normal', ringTiles: 1.3,
        }); },
        sentaiRedSlash: function(tx, ty) { _sigSlashCombo3D(tx, ty, {
            glowColor: 0xff3344, circleColor: 0xff2233,
            bladeTex: 'metal.png', bladeColor: 0xffffff,
            guardTex: 'metal.png', guardColor: 0xdd5555,
            sparkSprite: 'spark-pink',
            slashes: [   /* the classic sentai X-cross */
                { dYaw: 0.0, dir: 1, tilt: 0.65 },
                { dYaw: 0.0, dir: -1, tilt: -0.65, heavy: true },
            ],
        }); },
        raceSyntheticBlade: function(tx, ty) { _sigSlashCombo3D(tx, ty, {
            hologram: true, glowColor: 0x33ffee, circleColor: 0x22ccff,
            bladeColor: 0x66ffee, guardColor: 0x2288aa, moteSprite: 'plasma',
            windMs: 55, swingMs: 70, recoverMs: 40,
            slashes: [
                { dYaw: 0.5, dir: 1, tilt: 0.45 },
                { dYaw: -0.5, dir: -1, tilt: -0.45 },
                { dYaw: 1.2, dir: 1, tilt: 0.0, heavy: true },
            ],
        }); },

        /* ORA — spectral giant fist */
        reallyGoodPunch: function(tx, ty) { _sigStandFist3D(tx, ty, { color: 0xffd24a }); },

        /* KNIGHT / WARRIOR — tower shields */
        shieldBash: function(tx, ty) { _sigShieldBash3D(tx, ty, { glowColor: 0xffd875 }); },
        fortify: function(tx, ty) { _sigShieldRing3D(tx, ty, { glowColor: 0x88bbff, count: 4, holdMs: 800 }); },
        raceOathOfValor: function(tx, ty) { _sigShieldRing3D(tx, ty, { glowColor: 0xffd875, count: 3, scale: 0.55, holdMs: 650, radiusTiles: 0.6 }); },

        /* WEREWOLF — spectral jaws + rending claws */
        racePounce: function(tx, ty) { _sigJawsBite3D(tx, ty, { scale: 1.05, glowColor: 0xff3333 }); },
        raceFeralDive: function(tx, ty) { _sigJawsBite3D(tx, ty, { scale: 1.1, glowColor: 0xff5522, shake: 'hard', flashPeak: 0.2 }); },
        raceSavageRend: function(tx, ty) {
            /* claw, claw, BITE — mirrors the 3-hit combo in the spell desc */
            _sigClawCombo3D(tx, ty, {
                swipes: 2, glowColor: 0xff4444, clawTint: 0xe8ddc8,
                sparkSprite: 'blood-fleck', swipeMs: 65, markMs: 500,
            });
            window.setTimeout(function () {
                if (_suppressed()) return;
                _sigJawsBite3D(tx, ty, { scale: 0.95, glowColor: 0xff3333, clenchMs: 200 });
            }, 300);
        },
        raceInfectiousBite: function(tx, ty) { _sigJawsBite3D(tx, ty, {
            scale: 0.85, glowColor: 0x88ee44, gumTint: 0x5a6a20, toothTint: 0xdfe8c0,
            circleColor: 0x447722, sparkSprite: 'acid-green',
        }); },
        raceGhoulishBite: function(tx, ty) { _sigJawsBite3D(tx, ty, {
            scale: 0.9, glowColor: 0x77dd66, gumTint: 0x4a5a28, toothTint: 0xd8d2b0,
            circleColor: 0x336622, sparkSprite: 'acid-green',
        }); },

        /* CATGIRL — nine scratches in three triple-swipes; and a kitten-
           sized love bite */
        raceNinefoldScratch: function(tx, ty) { _sigClawCombo3D(tx, ty, {
            swipes: 3, glowColor: 0xff88cc, clawTint: 0xfaf2e8,
            sparkSprite: 'spark-pink', swipeMs: 60, heavyFinish: true,
        }); },
        raceLoveBite: function(tx, ty) { _sigJawsBite3D(tx, ty, {
            scale: 0.6, glowColor: 0xff77bb, gumTint: 0xbb4477, toothTint: 0xffffff,
            hideTint: 0x77364a, circleColor: 0xcc5599, sparkSprite: 'spark-pink',
            flashPeak: 0.08, clenchMs: 180,
        }); },

        /* HALF-DEMON — one massive raking demon claw */
        raceDemonicClaw: function(tx, ty) { _sigClawCombo3D(tx, ty, {
            swipes: 1, scale: 1.55, glowColor: 0xdd2222, clawTint: 0x3a3038,
            clawTex: 'obsidian.png', sparkSprite: 'blood-fleck',
            swipeMs: 95, markMs: 950, heavyFinish: true, flashPeak: 0.2,
        }); },

        /* golden blade of judgment falling out of heaven + light pillar */
        judgment: function(tx, ty) { _sigJudgmentSword3D(tx, ty, 'judgment_descent', {
            glowColor: 0xffcc55, circleColor: 0xffdd88,
            bladeTex: 'gold.png', bladeColor: 0xffffff,       /* solid gold-bar blade */
            guardTex: 'metal.png', guardColor: 0xffd970,      /* brass fittings */
            len: (_cfg().tileSize || 128) * 3.0,
            hoverH: (_cfg().tileSize || 128) * 3.2, ringTiles: 2.2,
            sparkSprite: 'divine-sparkle', moteSprite: 'holy-light',
        }); },
        raceDivineJudgment: function(tx, ty) { _sigJudgmentSword3D(tx, ty, 'raceDivineJudgment_descent', {
            glowColor: 0xffcc55, circleColor: 0xffdd88,
            bladeTex: 'gold.png', bladeColor: 0xffffff,       /* solid gold-bar blade */
            guardTex: 'metal.png', guardColor: 0xffd970,      /* brass fittings */
            len: (_cfg().tileSize || 128) * 3.0,
            hoverH: (_cfg().tileSize || 128) * 3.2, ringTiles: 2.2,
            sparkSprite: 'divine-sparkle', moteSprite: 'holy-light',
        }); },
        divineIntervention: function(tx, ty) {
            _sigMagicCircle3D(tx, ty, {
                color: 0xffdd88, radiusPx: (_cfg().tileSize || 128) * 1.4,
                holdMs: 900, spin: 0.0022, rise: 30,
            });
            _sigLightPillar3D(tx, ty, { color: 0xffe9a8, ms: 1200, height: 820 });
        },

        /* storm rune circle in the sky, shock + flash when the bolt lands */
        thunder1: function(tx, ty) {
            var _t1def = EFFECTS['thunder1_descent'] || {};
            _sigStormStrike3D(tx, ty, { color: 0x99ccff, delayMs: _t1def.descentMs || 600 });
        },

        exorcism: function(tx, ty) {
            var ts0 = _cfg().tileSize || 128;
            _sigMagicCircle3D(tx, ty, { color: 0xffee99, radiusPx: ts0 * 1.1, holdMs: 500, spin: 0.005 });
            _sigLightPillar3D(tx, ty, { color: 0xfff2bb, ms: 700, height: 520, radius: ts0 * 0.3 });
        },
        mindShatter: function(tx, ty) {
            var ts0 = _cfg().tileSize || 128;
            _sigShockRing3D(tx, ty, { color: 0xcc66ff, r1: ts0 * 1.8 });
            _sigSpeedBurst3D(tx, ty, { color: 0xdd99ff });
            _sigScreenFlash('#cc88ff', 150, 0.2);
        },
        fire2: function(tx, ty) {
            var ts0 = _cfg().tileSize || 128;
            _sigShockRing3D(tx, ty, { color: 0xffaa44, r1: ts0 * 1.5, ms: 360 });
            _sigScreenFlash('#ffbb66', 120, 0.14);
        },
        heal1: function(tx, ty) {
            _sigMagicCircle3D(tx, ty, {
                color: 0x66ff99, radiusPx: (_cfg().tileSize || 128) * 0.95,
                holdMs: 800, spin: 0.001, opacity: 0.55, rise: 40,
            });
        },

        /* the crop-circle saucer is a real 3D model now (descent pipeline
           calls this at descent start; beam rings/shaft stay sprite-based) */
        raceCropCircle: function(tx, ty) {
            _sigUFO3D(tx, ty, {
                enterMs: 380, hoverMs: 1150, exitMs: 470,
                hoverH: (_cfg().tileSize || 128) * 2.8,
                beam: true, beamColor: 0x55ff99,
            });
        },
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

        sigMagicCircle3D: _sigMagicCircle3D,
        sigShockRing3D: _sigShockRing3D,
        sigSpeedBurst3D: _sigSpeedBurst3D,
        sigLightPillar3D: _sigLightPillar3D,
        sigCrescentSlash3D: _sigCrescentSlash3D,
        sigStandSword3D: _sigStandSword3D,
        sigStandFist3D: _sigStandFist3D,
        sigSlashCombo3D: _sigSlashCombo3D,
        sigShieldBash3D: _sigShieldBash3D,
        sigShieldRing3D: _sigShieldRing3D,
        sigJawsBite3D: _sigJawsBite3D,
        sigClawCombo3D: _sigClawCombo3D,
        sigCannonShot3D: _sigCannonShot3D,
        sigGunRig3D: _sigGunRig3D,
        sigTeslaCoil3D: _sigTeslaCoil3D,
        sigUFO3D: _sigUFO3D,
        sigStormStrike3D: _sigStormStrike3D,
        sigScreenFlash: _sigScreenFlash,

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

        spawnProbeDescent3D: _spawnProbeDescent3D,
        spawnTrunkThrow3D: _spawnTrunkThrow3D,
        spawnBulletRain3D: _spawnBulletRain3D,

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
