const ThreePost = (function () {
    'use strict';

    var _renderer = null;
    var _scene = null;
    var _composer = null;
    var _bloomPass = null;
    var _fxaaPass = null;
    var _ready = false;

    var BLOOM_STRENGTH = 0.35;
    var BLOOM_RADIUS   = 0.4;
    var BLOOM_THRESHOLD = 0.82;

    // User-controllable bloom (persisted, tuned via the pause-menu slider). The
    // day/night presets carry bloomStr 0, so without this floor bloom is
    // invisible — this strength drives the astral glow on the self-lit scenery,
    // VFX and other bright surfaces. A strength of 0 turns bloom off entirely.
    var BLOOM_USER_STRENGTH  = 0.8;    // default glow intensity (slider value)
    var BLOOM_USER_RADIUS    = 0.6;    // how far the glow spreads
    var BLOOM_USER_THRESHOLD = 0.6;    // lower → more of the scene blooms
    var BLOOM_MAX_STRENGTH   = 1.6;    // pause-menu slider ceiling
    try {
        var _bloomSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_bloomStrength') : null;
        if (_bloomSaved !== null) {
            var _bv = parseFloat(_bloomSaved);
            if (!isNaN(_bv)) BLOOM_USER_STRENGTH = Math.max(0, Math.min(BLOOM_MAX_STRENGTH, _bv));
        }
    } catch (e) {}

    var _cinematicPass = null;
    var _cinematicEnabled = false;

    var _CinematicShader = {
        uniforms: {
            'tDiffuse':       { value: null },
            'uResolution':    { value: new THREE.Vector2(1, 1) },
            'uTime':          { value: 0.0 },
            'uScanlineAlpha': { value: 0.07 },
            'uScanlineScale': { value: 2.0 },
            'uChromaShift':   { value: 0.8 },
            'uVignetteSize':  { value: 0.42 },
            'uVignetteSoft':  { value: 0.55 },
            'uCurvature':     { value: 0.0 }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
            '}'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'uniform vec2 uResolution;',
            'uniform float uTime;',
            'uniform float uScanlineAlpha;',
            'uniform float uScanlineScale;',
            'uniform float uChromaShift;',
            'uniform float uVignetteSize;',
            'uniform float uVignetteSoft;',
            'uniform float uCurvature;',
            'varying vec2 vUv;',
            '',
            'vec2 curveUV(vec2 uv) {',
            '  if (uCurvature < 0.001) return uv;',
            '  vec2 c = uv * 2.0 - 1.0;',
            '  c *= 1.0 + uCurvature * dot(c, c);',
            '  return c * 0.5 + 0.5;',
            '}',
            '',
            'void main() {',
            '  vec2 uv = curveUV(vUv);',
            '',
            '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {',
            '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
            '    return;',
            '  }',
            '',
            '  float px = uChromaShift / uResolution.x;',
            '  float r = texture2D(tDiffuse, vec2(uv.x - px, uv.y)).r;',
            '  vec4 center = texture2D(tDiffuse, uv);',
            '  float b = texture2D(tDiffuse, vec2(uv.x + px, uv.y)).b;',
            '  vec4 col = vec4(r, center.g, b, center.a);',
            '',
            '  float scanY = uv.y * uResolution.y * uScanlineScale;',
            '  float scanline = sin(scanY * 3.14159) * 0.5 + 0.5;',
            '  scanline = pow(scanline, 1.2);',
            '  col.rgb *= 1.0 - uScanlineAlpha * (1.0 - scanline);',
            '',
            '  float flicker = 1.0 - 0.006 * sin(uTime * 8.3);',
            '  col.rgb *= flicker;',
            '',
            '  vec2 vc = uv - 0.5;',
            '  float vDist = dot(vc, vc);',
            '  float vignette = smoothstep(uVignetteSize, uVignetteSize - uVignetteSoft, vDist);',
            '  col.rgb *= vignette;',
            '',
            '  gl_FragColor = col;',
            '}'
        ].join('\n')
    };

    var _sunLight = null;
    var _hemiLight = null;
    var _ambientLight = null;
    var _lastCycle = null;

    var LIGHT_DAY = {

        sunColor:    0xffffff,
        sunIntensity: 0.3,
        sunX: -0.3, sunY: 1.4, sunZ: -0.2,

        skyColor:    0x000000,
        groundColor: 0x000000,
        hemiIntensity: 0.0,

        ambientColor: 0xffffff,
        ambientIntensity: 1.0,
        exposure: 0.98,
        bloomStrength: 0, bloomThreshold: 1.0
    };

    var LIGHT_NIGHT = {

        sunColor:    0x8899cc,
        sunIntensity: 0.18,
        sunX: 0.3, sunY: 1.3, sunZ: 0.2,

        skyColor:    0x000000,
        groundColor: 0x000000,
        hemiIntensity: 0.0,

        ambientColor: 0x6672a0,
        ambientIntensity: 0.45,
        exposure: 0.92,
        bloomStrength: 0, bloomThreshold: 1.0
    };

    var LIGHT_LERP_SPEED = 1.5;

    var _cur = {
        sunR: 1, sunG: 1, sunB: 1, sunInt: 0.3,
        sunDirX: -0.3, sunDirY: 1.4, sunDirZ: -0.2,
        skyR: 0, skyG: 0, skyB: 0,
        gndR: 0, gndG: 0, gndB: 0,
        hemiInt: 0,
        ambR: 1, ambG: 1, ambB: 1, ambInt: 1.0,
        exposure: 1.0,
        bloomStr: 0, bloomThr: 1.0
    };
    var _target = null;
    var _lerpT = 1.0;

    function _presetToTarget(p) {
        var sc = new THREE.Color(p.sunColor);
        var skc = new THREE.Color(p.skyColor);
        var gc = new THREE.Color(p.groundColor);
        var ac = new THREE.Color(p.ambientColor);
        return {
            sunR: sc.r, sunG: sc.g, sunB: sc.b, sunInt: p.sunIntensity,
            sunDirX: p.sunX, sunDirY: p.sunY, sunDirZ: p.sunZ,
            skyR: skc.r, skyG: skc.g, skyB: skc.b,
            gndR: gc.r, gndG: gc.g, gndB: gc.b,
            hemiInt: p.hemiIntensity,
            ambR: ac.r, ambG: ac.g, ambB: ac.b, ambInt: p.ambientIntensity,
            exposure: p.exposure,
            bloomStr: p.bloomStrength, bloomThr: p.bloomThreshold
        };
    }

    function _lerpVal(a, b, t) { return a + (b - a) * t; }

    function _applyCurrent() {
        if (_sunLight) {
            _sunLight.color.setRGB(_cur.sunR, _cur.sunG, _cur.sunB);
            _sunLight.intensity = _cur.sunInt;
            _sunLight.position.set(_cur.sunDirX, _cur.sunDirY, _cur.sunDirZ).normalize();
        }
        if (_hemiLight) {
            _hemiLight.color.setRGB(_cur.skyR, _cur.skyG, _cur.skyB);
            _hemiLight.groundColor.setRGB(_cur.gndR, _cur.gndG, _cur.gndB);
            _hemiLight.intensity = _cur.hemiInt;
        }
        if (_ambientLight) {
            _ambientLight.color.setRGB(_cur.ambR, _cur.ambG, _cur.ambB);
            _ambientLight.intensity = _cur.ambInt;
        }
        if (_renderer) {
            _renderer.toneMappingExposure = _cur.exposure;
        }
        if (_bloomPass) {
            var _bloomOn = BLOOM_USER_STRENGTH > 0;
            _bloomPass.enabled = _bloomOn;
            if (_bloomOn) {
                // floor the env grade (which is 0 by day/night) to the user level
                // so the glow is always visible, and let bright sky-events add to it
                _bloomPass.strength  = Math.max(_cur.bloomStr, BLOOM_USER_STRENGTH);
                _bloomPass.threshold = Math.min(_cur.bloomThr, BLOOM_USER_THRESHOLD);
                _bloomPass.radius    = BLOOM_USER_RADIUS;
            }
        }
    }

    function _initLighting(scene) {

        _sunLight = new THREE.DirectionalLight(0xffffff, 0.3);
        _sunLight.position.set(-0.3, 1.4, -0.2).normalize();
        scene.add(_sunLight);

        _hemiLight = new THREE.HemisphereLight(0x000000, 0x000000, 0.0);
        scene.add(_hemiLight);

        _ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(_ambientLight);

        _target = _presetToTarget(LIGHT_DAY);

        for (var k in _target) _cur[k] = _target[k];
        _lerpT = 1.0;
        _lastCycle = 'day';
        _applyCurrent();
    }

    function syncLighting() {
        if (!_sunLight) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';

        if (cycle !== _lastCycle) {
            _lastCycle = cycle;
            _target = _presetToTarget(cycle === 'night' ? LIGHT_NIGHT : LIGHT_DAY);
            _lerpT = 0;
        }

        if (_lerpT < 1.0) {

            _lerpT = Math.min(1.0, _lerpT + LIGHT_LERP_SPEED * 0.016);
            var t = _lerpT * _lerpT * (3 - 2 * _lerpT);
            for (var k in _target) {
                _cur[k] = _lerpVal(_cur[k], _target[k], t);
            }

            if (_lerpT >= 1.0) {
                for (var k in _target) _cur[k] = _target[k];
            }
            _applyCurrent();
        }
    }

    var _wardLights = [];
    var _wardLightGroup = null;

    var WARD_LIGHT_COLOR_DAY   = 0xff9944;
    var WARD_LIGHT_COLOR_NIGHT = 0xff8833;
    var WARD_LIGHT_INTENSITY_DAY   = 0.6;
    var WARD_LIGHT_INTENSITY_NIGHT = 1.4;
    var WARD_LIGHT_DISTANCE   = 384;
    var WARD_LIGHT_DECAY      = 1.5;

    var WARD_GLOW_SIZE = 96;

    function rebuildWardLights(wards, tileTopYFn, tileSize) {
        if (!_scene) return;
        var ts = tileSize || 128;

        if (!_wardLightGroup) {
            _wardLightGroup = new THREE.Group();
            _wardLightGroup.name = 'wardLights';
            _scene.add(_wardLightGroup);
        }

        for (var i = 0; i < _wardLights.length; i++) {
            var entry = _wardLights[i];
            _wardLightGroup.remove(entry.light);
            if (entry.light.dispose) entry.light.dispose();
            if (entry.mesh) {
                _wardLightGroup.remove(entry.mesh);
                if (entry.mesh.geometry) entry.mesh.geometry.dispose();
                if (entry.mesh.material) entry.mesh.material.dispose();
            }
        }
        _wardLights = [];

        if (!wards || !wards.length) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var lightColor = isNight ? WARD_LIGHT_COLOR_NIGHT : WARD_LIGHT_COLOR_DAY;
        var lightIntensity = isNight ? WARD_LIGHT_INTENSITY_NIGHT : WARD_LIGHT_INTENSITY_DAY;

        for (var i = 0; i < wards.length; i++) {
            var w = wards[i];
            var topY = tileTopYFn(w.x, w.y);
            var worldX = w.x * ts + ts / 2;
            var worldZ = w.y * ts + ts / 2;
            var worldY = topY + ts * 0.4;

            var pl = new THREE.PointLight(lightColor, lightIntensity, WARD_LIGHT_DISTANCE, WARD_LIGHT_DECAY);
            pl.position.set(worldX, worldY, worldZ);
            pl._ew_wardLight = true;
            _wardLightGroup.add(pl);

            var glowGeo = new THREE.PlaneGeometry(WARD_GLOW_SIZE, WARD_GLOW_SIZE);
            var glowMat = new THREE.MeshBasicMaterial({
                color: 0xffaa44,
                transparent: true,
                opacity: isNight ? 0.7 : 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            var glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.position.set(worldX, worldY, worldZ);
            glowMesh._ew_billboard = true;
            _wardLightGroup.add(glowMesh);

            _wardLights.push({ light: pl, mesh: glowMesh, x: w.x, y: w.y });
        }
    }

    function _updateWardLights() {
        if (_wardLights.length === 0) return;
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var baseIntensity = isNight ? WARD_LIGHT_INTENSITY_NIGHT : WARD_LIGHT_INTENSITY_DAY;
        var baseGlowOpacity = isNight ? 0.7 : 0.35;
        var now = performance.now() * 0.001;

        for (var i = 0; i < _wardLights.length; i++) {
            var entry = _wardLights[i];

            var flicker = 1.0
                + 0.08 * Math.sin(now * 6.3 + i * 1.7)
                + 0.05 * Math.sin(now * 13.1 + i * 3.2)
                + 0.03 * Math.sin(now * 2.1 + i * 5.0);
            entry.light.intensity = baseIntensity * flicker;
            entry.light.color.set(isNight ? WARD_LIGHT_COLOR_NIGHT : WARD_LIGHT_COLOR_DAY);
            if (entry.mesh) {
                entry.mesh.material.opacity = baseGlowOpacity * flicker;
            }
        }
    }

    var _lavaLights = [];
    var _lavaLightGroup = null;
    var MAX_LAVA_LIGHTS = 4;

    var LAVA_LIGHT_COLOR       = 0xff4411;
    var LAVA_LIGHT_COLOR_NIGHT = 0xff3308;
    var LAVA_LIGHT_INTENSITY_DAY   = 0.7;
    var LAVA_LIGHT_INTENSITY_NIGHT = 2.2;
    var LAVA_LIGHT_BASE_DISTANCE   = 320;
    var LAVA_LIGHT_DECAY       = 1.6;

    function _clusterLavaTiles(tiles, ts, tileTopYFn) {
        var n = tiles.length;
        if (n === 0) return [];

        var k = Math.min(MAX_LAVA_LIGHTS, Math.max(1, Math.ceil(n / 6)));

        var centroids = [];
        for (var c = 0; c < k; c++) {
            var idx = Math.floor(c * n / k);
            var t = tiles[idx];
            centroids.push({ wx: t.x * ts + ts / 2, wz: t.y * ts + ts / 2 });
        }

        var assignments = new Array(n);
        for (var iter = 0; iter < 3; iter++) {

            for (var i = 0; i < n; i++) {
                var t = tiles[i];
                var tx = t.x * ts + ts / 2, tz = t.y * ts + ts / 2;
                var best = 0, bestD = Infinity;
                for (var c = 0; c < k; c++) {
                    var dx = tx - centroids[c].wx, dz = tz - centroids[c].wz;
                    var d = dx * dx + dz * dz;
                    if (d < bestD) { bestD = d; best = c; }
                }
                assignments[i] = best;
            }

            for (var c = 0; c < k; c++) {
                var sx = 0, sz = 0, cnt = 0;
                for (var i = 0; i < n; i++) {
                    if (assignments[i] === c) {
                        var t = tiles[i];
                        sx += t.x * ts + ts / 2;
                        sz += t.y * ts + ts / 2;
                        cnt++;
                    }
                }
                if (cnt > 0) { centroids[c].wx = sx / cnt; centroids[c].wz = sz / cnt; }
            }
        }

        var results = [];
        for (var c = 0; c < k; c++) {
            var sumY = 0, cnt = 0, maxDist = 0;
            for (var i = 0; i < n; i++) {
                if (assignments[i] !== c) continue;
                var t = tiles[i];
                sumY += tileTopYFn(t.x, t.y);
                cnt++;
                var dx = (t.x * ts + ts / 2) - centroids[c].wx;
                var dz = (t.y * ts + ts / 2) - centroids[c].wz;
                var d = Math.sqrt(dx * dx + dz * dz);
                if (d > maxDist) maxDist = d;
            }
            if (cnt > 0) {
                results.push({
                    wx: centroids[c].wx,
                    wy: sumY / cnt + ts * 0.2,
                    wz: centroids[c].wz,
                    count: cnt,
                    radius: maxDist
                });
            }
        }
        return results;
    }

    function rebuildLavaLights(lavaTiles, tileTopYFn, tileSize) {
        if (!_scene) return;
        var ts = tileSize || 128;

        if (!_lavaLightGroup) {
            _lavaLightGroup = new THREE.Group();
            _lavaLightGroup.name = 'lavaLights';
            _scene.add(_lavaLightGroup);
        }

        for (var i = 0; i < _lavaLights.length; i++) {
            var entry = _lavaLights[i];
            _lavaLightGroup.remove(entry.light);
            if (entry.light.dispose) entry.light.dispose();
        }
        _lavaLights = [];

        if (!lavaTiles || !lavaTiles.length) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var lightColor = isNight ? LAVA_LIGHT_COLOR_NIGHT : LAVA_LIGHT_COLOR;
        var baseIntensity = isNight ? LAVA_LIGHT_INTENSITY_NIGHT : LAVA_LIGHT_INTENSITY_DAY;

        var clusters = _clusterLavaTiles(lavaTiles, ts, tileTopYFn);

        for (var i = 0; i < clusters.length; i++) {
            var cl = clusters[i];

            var intScale = Math.min(2.0, 1.0 + cl.count * 0.08);
            var dist = LAVA_LIGHT_BASE_DISTANCE + cl.radius + ts * 0.5;

            var pl = new THREE.PointLight(lightColor, baseIntensity * intScale, dist, LAVA_LIGHT_DECAY);
            pl.position.set(cl.wx, cl.wy, cl.wz);
            _lavaLightGroup.add(pl);

            _lavaLights.push({ light: pl });
        }
    }

    function _updateLavaLights() {
        if (_lavaLights.length === 0) return;
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var baseIntensity = isNight ? LAVA_LIGHT_INTENSITY_NIGHT : LAVA_LIGHT_INTENSITY_DAY;
        var now = performance.now() * 0.001;

        for (var i = 0; i < _lavaLights.length; i++) {
            var entry = _lavaLights[i];
            var flicker = 1.0
                + 0.10 * Math.sin(now * 1.7 + i * 2.3)
                + 0.05 * Math.sin(now * 4.1 + i * 1.1);
            entry.light.intensity = baseIntensity * flicker;
            entry.light.color.set(isNight ? LAVA_LIGHT_COLOR_NIGHT : LAVA_LIGHT_COLOR);
        }
    }

    var _unitLights = [];
    var _unitLightGroup = null;

    var UNIT_LIGHT_COLOR           = 0xffe0a0;
    var UNIT_LIGHT_INTENSITY_NIGHT = 1.2;
    var UNIT_LIGHT_DISTANCE        = 320;
    var UNIT_LIGHT_DECAY           = 1.6;
    var UNIT_LIGHT_HEIGHT          = 64;

    function rebuildUnitLights(units, unitSurfaceYFn, tileSize) {
        if (!_scene) return;
        var ts = tileSize || 128;

        if (!_unitLightGroup) {
            _unitLightGroup = new THREE.Group();
            _unitLightGroup.name = 'unitLights';
            _scene.add(_unitLightGroup);
        }

        for (var i = 0; i < _unitLights.length; i++) {
            _unitLightGroup.remove(_unitLights[i].light);
            if (_unitLights[i].light.dispose) _unitLights[i].light.dispose();
        }
        _unitLights = [];

        if (!units || !units.length) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        if (cycle !== 'night') return;

        for (var i = 0; i < units.length; i++) {
            var u = units[i];
            if (u.dead || u._dying) continue;

            var surfY = unitSurfaceYFn(u);
            var pl = new THREE.PointLight(UNIT_LIGHT_COLOR, UNIT_LIGHT_INTENSITY_NIGHT, UNIT_LIGHT_DISTANCE, UNIT_LIGHT_DECAY);
            pl.position.set(u.x * ts + ts / 2, surfY + UNIT_LIGHT_HEIGHT, u.y * ts + ts / 2);
            _unitLightGroup.add(pl);
            _unitLights.push({ light: pl, unitId: u.id });
        }
    }

    function _updateUnitLights() {
        if (_unitLights.length === 0) return;
        var now = performance.now() * 0.001;
        for (var i = 0; i < _unitLights.length; i++) {
            var flicker = 1.0 + 0.06 * Math.sin(now * 3.5 + i * 2.1) + 0.03 * Math.sin(now * 7.8 + i * 4.3);
            _unitLights[i].light.intensity = UNIT_LIGHT_INTENSITY_NIGHT * flicker;
        }
    }

    function init(renderer, scene, w, h) {
        _renderer = renderer;
        _scene = scene;

        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.setClearColor(0x000000, 0);

        _initLighting(scene);

        if (!THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass || !THREE.ShaderPass) {
            console.warn('[ThreePost] postprocessing classes not found — running without post-fx');
            return;
        }

        var rt = new THREE.WebGLRenderTarget(w, h, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        _composer = new THREE.EffectComposer(renderer, rt);

        var renderPass = new THREE.RenderPass(scene, null);
        renderPass.clear = true;
        renderPass.clearAlpha = 0;
        _composer.addPass(renderPass);

        // Bloom — blooms the raw scene before AA/cinematic. Driven each frame by
        // _applyCurrent (env grade floored to the user strength) and gated by the
        // pause-menu toggle. This pass was previously never created, so bloom did
        // nothing; instantiating it here is what makes the glow visible at all.
        if (THREE.UnrealBloomPass) {
            _bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(w, h), BLOOM_USER_STRENGTH, BLOOM_USER_RADIUS, BLOOM_USER_THRESHOLD
            );
            _bloomPass.enabled = (BLOOM_USER_STRENGTH > 0);
            _composer.addPass(_bloomPass);
        }

        if (THREE.FXAAShader) {
            _fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            var pixelRatio = renderer.getPixelRatio();
            _fxaaPass.material.uniforms['resolution'].value.set(
                1 / (w * pixelRatio), 1 / (h * pixelRatio)
            );
            _composer.addPass(_fxaaPass);
        } else {
            console.warn('[ThreePost] FXAAShader not found — skipping FXAA');
        }

        _cinematicPass = new THREE.ShaderPass(_CinematicShader);
        _cinematicPass.material.uniforms['uResolution'].value.set(w, h);
        _cinematicPass.enabled = _cinematicEnabled;
        _composer.addPass(_cinematicPass);

        _ready = true;
        console.log('[ThreePost] initialized — bloom + FXAA + cinematic filter + directional/hemi lighting');
    }

    function render(cam) {

        syncLighting();
        _updateWardLights();
        _updateLavaLights();
        _updateUnitLights();

        if (_cinematicPass && _cinematicPass.enabled) {
            _cinematicPass.material.uniforms['uTime'].value = performance.now() * 0.001;
        }

        if (!_ready || !_composer || !cam) {

            if (_renderer && _scene && cam) _renderer.render(_scene, cam);
            return;
        }

        _composer.passes[0].camera = cam;
        _composer.render();
    }

    function resize(w, h) {
        if (!_ready || !_composer) return;
        _composer.setSize(w, h);
        if (_fxaaPass) {
            var pixelRatio = _renderer ? _renderer.getPixelRatio() : 1;
            _fxaaPass.material.uniforms['resolution'].value.set(
                1 / (w * pixelRatio), 1 / (h * pixelRatio)
            );
        }
        if (_cinematicPass) {
            _cinematicPass.material.uniforms['uResolution'].value.set(w, h);
        }
    }

    function setBloom(strength, radius, threshold) {
        if (!_bloomPass) return;
        if (strength !== undefined)  _bloomPass.strength  = strength;
        if (radius !== undefined)    _bloomPass.radius    = radius;
        if (threshold !== undefined) _bloomPass.threshold = threshold;
    }

    function setBloomStrength(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        BLOOM_USER_STRENGTH = Math.max(0, Math.min(BLOOM_MAX_STRENGTH, s));
        if (_bloomPass) {
            var on = BLOOM_USER_STRENGTH > 0;
            _bloomPass.enabled = on;
            if (on) {
                _bloomPass.strength  = Math.max(_cur.bloomStr, BLOOM_USER_STRENGTH);
                _bloomPass.threshold = Math.min(_cur.bloomThr, BLOOM_USER_THRESHOLD);
                _bloomPass.radius    = BLOOM_USER_RADIUS;
            }
        }
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_bloomStrength', String(BLOOM_USER_STRENGTH)); } catch (e) {}
    }

    function getBloomStrength()    { return BLOOM_USER_STRENGTH; }
    function getBloomMaxStrength() { return BLOOM_MAX_STRENGTH; }

    // back-compat shims (toggle → strength)
    function setBloomEnabled(enabled) { setBloomStrength(enabled ? (BLOOM_USER_STRENGTH > 0 ? BLOOM_USER_STRENGTH : 0.8) : 0); }
    function isBloomEnabled() { return BLOOM_USER_STRENGTH > 0; }

    function setExposure(val) {
        if (_renderer) _renderer.toneMappingExposure = val;
    }

    function isReady() { return _ready; }

    function setFXAA(enabled) {
        if (!_fxaaPass) return;
        _fxaaPass.enabled = !!enabled;
    }

    function isFXAAEnabled() {
        return _fxaaPass ? _fxaaPass.enabled : false;
    }

    function setPixelRatio(ratio) {
        if (!_renderer) return;
        _renderer.setPixelRatio(ratio);

        if (_renderer.domElement) {
            var w = _renderer.domElement.clientWidth;
            var h = _renderer.domElement.clientHeight;
            if (w > 0 && h > 0) {
                _renderer.setSize(w, h);
                resize(w, h);
            }
        }
    }

    function dispose() {

        if (_wardLightGroup) {
            for (var i = 0; i < _wardLights.length; i++) {
                var e = _wardLights[i];
                if (e.light && e.light.dispose) e.light.dispose();
                if (e.mesh) {
                    if (e.mesh.geometry) e.mesh.geometry.dispose();
                    if (e.mesh.material) e.mesh.material.dispose();
                }
            }
            _wardLights = [];
            if (_scene && _wardLightGroup.parent) _scene.remove(_wardLightGroup);
            _wardLightGroup = null;
        }

        if (_lavaLightGroup) {
            for (var i = 0; i < _lavaLights.length; i++) {
                if (_lavaLights[i].light && _lavaLights[i].light.dispose) _lavaLights[i].light.dispose();
            }
            _lavaLights = [];
            if (_scene && _lavaLightGroup.parent) _scene.remove(_lavaLightGroup);
            _lavaLightGroup = null;
        }

        if (_unitLightGroup) {
            for (var i = 0; i < _unitLights.length; i++) {
                if (_unitLights[i].light && _unitLights[i].light.dispose) _unitLights[i].light.dispose();
            }
            _unitLights = [];
            if (_scene && _unitLightGroup.parent) _scene.remove(_unitLightGroup);
            _unitLightGroup = null;
        }

        if (_sunLight && _scene) _scene.remove(_sunLight);
        if (_hemiLight && _scene) _scene.remove(_hemiLight);
        if (_ambientLight && _scene) _scene.remove(_ambientLight);
        _sunLight = null; _hemiLight = null; _ambientLight = null;
        _lastCycle = null;

        if (_composer) {

            if (_composer.renderTarget1) _composer.renderTarget1.dispose();
            if (_composer.renderTarget2) _composer.renderTarget2.dispose();
        }
        _composer = null;
        _bloomPass = null;
        _fxaaPass = null;
        _renderer = null;
        _scene = null;
        _ready = false;
    }

    function setCinematicFilter(enabled) {
        _cinematicEnabled = !!enabled;
        if (_cinematicPass) _cinematicPass.enabled = _cinematicEnabled;
    }

    function isCinematicFilterEnabled() {
        return _cinematicEnabled;
    }

    function setCinematicParam(key, value) {
        if (!_cinematicPass) return;
        var u = _cinematicPass.material.uniforms;
        if (u[key]) u[key].value = value;
    }

    return {
        init: init,
        render: render,
        resize: resize,
        setBloom: setBloom,
        setBloomEnabled: setBloomEnabled,
        isBloomEnabled: isBloomEnabled,
        setBloomStrength: setBloomStrength,
        getBloomStrength: getBloomStrength,
        getBloomMaxStrength: getBloomMaxStrength,
        setExposure: setExposure,
        setFXAA: setFXAA,
        isFXAAEnabled: isFXAAEnabled,
        setPixelRatio: setPixelRatio,
        syncLighting: syncLighting,
        rebuildWardLights: rebuildWardLights,
        rebuildUnitLights: rebuildUnitLights,
        rebuildLavaLights: rebuildLavaLights,
        setCinematicFilter: setCinematicFilter,
        isCinematicFilterEnabled: isCinematicFilterEnabled,
        setCinematicParam: setCinematicParam,
        isReady: isReady,
        dispose: dispose
    };
})();

window.ThreePost = ThreePost;
