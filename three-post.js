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
    // invisible. A strength of 0 turns bloom off entirely.
    var BLOOM_USER_STRENGTH  = 0.35;   // default glow intensity (slider value)
    var BLOOM_USER_RADIUS    = 0.6;    // how far the glow spreads
    var BLOOM_USER_THRESHOLD = 0.72;   // higher → only the brightest surfaces bloom (less daytime over-bloom on map/spawn zones)
    var BLOOM_MAX_STRENGTH   = 1.6;    // pause-menu slider ceiling
    try {
        // _v2 key: the default changed (1.0 → 0.35), so ignore stale saved values
        var _bloomSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_bloomStrength_v2') : null;
        if (_bloomSaved !== null) {
            var _bv = parseFloat(_bloomSaved);
            if (!isNaN(_bv)) BLOOM_USER_STRENGTH = Math.max(0, Math.min(BLOOM_MAX_STRENGTH, _bv));
        }
    } catch (e) {}

    // User brightness — a multiplier on the day/night tone-mapping exposure.
    // Daytime ambient pushes the map surfaces and the spawn zones bright enough
    // to bloom hard, so this lets the player dial the overall brightness down.
    var _exposureUser = 1.0;
    var EXPOSURE_MIN = 0.55, EXPOSURE_MAX = 1.25;
    try {
        var _expSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_exposure') : null;
        if (_expSaved !== null) {
            var _ev = parseFloat(_expSaved);
            if (!isNaN(_ev)) _exposureUser = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, _ev));
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

    // ── Retro / Haunted-PS1 filter ──────────────────────────────────────
    // A single final post pass that reproduces the "Haunted PS1 / King's Field"
    // look from the retro aesthetic guide: optional chunky pixelation (UV-snap
    // downscale), a mood colour-grade + tint, ordered (Bayer) dithering with
    // colour-depth quantization (the signature weave), and a touch of animated
    // film grain. It runs LAST so the period-correct colour depth is the final
    // thing the eye sees (grade + dither after bloom/AA, per the guide).
    var _retroPass = null;

    // Mood palettes — each drives the tint, tint amount, saturation, contrast
    // black/white points and a base colour-depth, distilled from the reference
    // screenshots (teal crypt, green field, amber apocalypse, dreamy rose,
    // faded nostalgia). Selecting one re-seeds the Tint and Colour-Depth sliders.
    // fogColor: the mood haze colour used when the optional scene-fog toggle is on.
    var RETRO_PRESETS = {
        teal:  { label: 'Eerie Teal',   tint: [0.80, 1.05, 1.04], tintAmount: 0.55, saturation: 0.82, loIn: 0.03, hiIn: 0.95, levels: 24, fogColor: 0x2b4a52 },
        green: { label: 'Haunted Green', tint: [0.78, 1.08, 0.84], tintAmount: 0.60, saturation: 0.80, loIn: 0.04, hiIn: 0.94, levels: 20, fogColor: 0x2f4d3f },
        amber: { label: 'Apocalypse',    tint: [1.12, 0.92, 0.68], tintAmount: 0.55, saturation: 0.86, loIn: 0.04, hiIn: 0.96, levels: 22, fogColor: 0x4a3420 },
        dream: { label: 'Dreamy',        tint: [1.08, 0.94, 1.05], tintAmount: 0.45, saturation: 0.98, loIn: 0.02, hiIn: 0.97, levels: 28, fogColor: 0x3f2f47 },
        faded: { label: 'Faded',         tint: [1.02, 0.99, 0.92], tintAmount: 0.30, saturation: 0.62, loIn: 0.05, hiIn: 0.93, levels: 16, fogColor: 0x3a3a33 }
    };

    // Live state (persisted as one JSON blob). pixelSize/dither*/grain are
    // preset-independent; levels + tintAmount are seeded by the preset but then
    // fine-tunable via the Colour-Depth / Tint sliders.
    var _retro = {
        enabled:        false,
        preset:         'teal',
        pixelSize:      1.0,    // 1 = off (game is already pixel-art); >1 = chunkier blocks
        ditherStrength: 0.6,
        ditherScale:    1.0,    // size of a dither cell in source pixels (bigger = coarser weave)
        grain:          0.04,
        levels:         24.0,   // colour levels per channel (lower = chunkier banding)
        tintAmount:     0.55,
        // Optional tinted scene fog (King's-Field haze). Off by default: with the
        // far orbit camera, exp2 fog hazes the whole board, so it's an opt-in mood
        // lever the player dials with the density slider, not a forced default.
        fogEnabled:     false,
        // Calibrated to the world scale: camera ~800u from the board, horizon
        // scenery 6k–15k out. At ~0.0002 the board stays readable, near landmarks
        // poke out of the haze, and the deepest ones dissolve completely.
        fogDensity:     0.0002
    };
    try {
        var _retroSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_retro') : null;
        if (_retroSaved) {
            var _rs = JSON.parse(_retroSaved);
            if (_rs && typeof _rs === 'object') {
                if (typeof _rs.preset === 'string' && RETRO_PRESETS[_rs.preset]) _retro.preset = _rs.preset;
                ['enabled','fogEnabled'].forEach(function (k) { if (typeof _rs[k] === 'boolean') _retro[k] = _rs[k]; });
                ['pixelSize','ditherStrength','ditherScale','grain','levels','tintAmount','fogDensity'].forEach(function (k) {
                    if (typeof _rs[k] === 'number' && !isNaN(_rs[k])) _retro[k] = _rs[k];
                });
            }
        }
    } catch (e) {}

    function _saveRetro() {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('ew_retro', JSON.stringify(_retro));
        } catch (e) {}
    }

    var _RetroShader = {
        uniforms: {
            'tDiffuse':       { value: null },
            'uResolution':    { value: new THREE.Vector2(1, 1) },
            'uTime':          { value: 0.0 },
            'uPixelSize':     { value: 1.0 },
            'uLevels':        { value: 24.0 },
            'uDitherStrength':{ value: 0.6 },
            'uDitherScale':   { value: 1.0 },
            'uTint':          { value: new THREE.Vector3(0.80, 1.05, 1.04) },
            'uTintAmount':    { value: 0.55 },
            'uSaturation':    { value: 0.82 },
            'uLevelsInOut':   { value: new THREE.Vector2(0.03, 0.95) },
            'uGrain':         { value: 0.04 }
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
            'uniform float uPixelSize;',
            'uniform float uLevels;',
            'uniform float uDitherStrength;',
            'uniform float uDitherScale;',
            'uniform vec3 uTint;',
            'uniform float uTintAmount;',
            'uniform float uSaturation;',
            'uniform vec2 uLevelsInOut;',
            'uniform float uGrain;',
            'varying vec2 vUv;',
            '',
            '// 4x4 ordered Bayer matrix, 0..15 (unrolled — no dynamic array indexing for WebGL1)',
            'float bayer4x4(vec2 p) {',
            '  float x = mod(p.x, 4.0);',
            '  float y = mod(p.y, 4.0);',
            '  float idx = x + y * 4.0;',
            '  float m = 0.0;',
            '  if (idx < 0.5) m = 0.0; else if (idx < 1.5) m = 8.0; else if (idx < 2.5) m = 2.0; else if (idx < 3.5) m = 10.0;',
            '  else if (idx < 4.5) m = 12.0; else if (idx < 5.5) m = 4.0; else if (idx < 6.5) m = 14.0; else if (idx < 7.5) m = 6.0;',
            '  else if (idx < 8.5) m = 3.0; else if (idx < 9.5) m = 11.0; else if (idx < 10.5) m = 1.0; else if (idx < 11.5) m = 9.0;',
            '  else if (idx < 12.5) m = 15.0; else if (idx < 13.5) m = 7.0; else if (idx < 14.5) m = 13.0; else m = 5.0;',
            '  return m / 16.0;',
            '}',
            '',
            'float hash(vec2 p) {',
            '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
            '}',
            '',
            'vec3 grade(vec3 c) {',
            '  // contrast / level remap',
            '  c = clamp((c - uLevelsInOut.x) / max(0.001, uLevelsInOut.y - uLevelsInOut.x), 0.0, 1.0);',
            '  // desaturate slightly',
            '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
            '  c = mix(vec3(l), c, uSaturation);',
            '  // tint toward the mood colour (multiply keeps darks dark)',
            '  c = mix(c, c * uTint, uTintAmount);',
            '  return c;',
            '}',
            '',
            'void main() {',
            '  // 1. optional chunky pixelation (UV-snap downscale)',
            '  vec2 uv = vUv;',
            '  if (uPixelSize > 1.0) {',
            '    vec2 cells = uResolution / uPixelSize;',
            '    uv = (floor(vUv * cells) + 0.5) / cells;',
            '  }',
            '  vec3 c = texture2D(tDiffuse, uv).rgb;',
            '',
            '  // 2. grade BEFORE dither so the period-correct depth is final',
            '  c = grade(c);',
            '',
            '  // 3. ordered dither + quantize (the signature weave). Cells are keyed',
            '  //    to the (snapped) uv so they ride along with the pixelation grid.',
            '  vec2 dcoord = floor(uv * uResolution / max(1.0, uDitherScale));',
            '  float threshold = bayer4x4(dcoord) - 0.5;',
            '  c += threshold * (uDitherStrength / uLevels);',
            '  c = floor(c * uLevels + 0.5) / uLevels;',
            '',
            '  // 4. a little animated grain over the static dither adds life',
            '  if (uGrain > 0.0) {',
            '    float g = hash(uv * uResolution + fract(uTime)) - 0.5;',
            '    c += g * uGrain;',
            '  }',
            '',
            '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
            '}'
        ].join('\n')
    };

    // Push the full _retro state (including the active preset's tint/sat/contrast)
    // into the live shader uniforms.
    function _applyRetroUniforms() {
        if (!_retroPass) return;
        var u = _retroPass.material.uniforms;
        var p = RETRO_PRESETS[_retro.preset] || RETRO_PRESETS.teal;
        u.uPixelSize.value      = _retro.pixelSize;
        u.uLevels.value         = _retro.levels;
        u.uDitherStrength.value = _retro.ditherStrength;
        u.uDitherScale.value    = _retro.ditherScale;
        u.uTintAmount.value     = _retro.tintAmount;
        u.uTint.value.set(p.tint[0], p.tint[1], p.tint[2]);
        u.uSaturation.value     = p.saturation;
        u.uLevelsInOut.value.set(p.loIn, p.hiIn);
        u.uGrain.value          = _retro.grain;
    }

    // Optional tinted scene fog. Keyed on camera distance, so with the far orbit
    // camera it hazes the whole board uniformly — that's why it's opt-in and the
    // density is player-tunable. Colour follows the active mood preset.
    function _applySceneFog() {
        if (_scene) {
            if (_retro.fogEnabled) {
                var p = RETRO_PRESETS[_retro.preset] || RETRO_PRESETS.teal;
                if (_scene.fog && _scene.fog.isFogExp2) {
                    _scene.fog.color.setHex(p.fogColor);
                    _scene.fog.density = _retro.fogDensity;
                } else {
                    _scene.fog = new THREE.FogExp2(p.fogColor, _retro.fogDensity);
                }
            } else {
                _scene.fog = null;
            }
        }
        // Also reach the background scenery: its landmark materials are built
        // fog:false, so without this the mood fog would haze the board but leave
        // the far esoteric bodies floating crisp in front of it. The renderer
        // flips fog on the solid scenery materials (camera-distance fade) so the
        // deepest landmarks dissolve into the haze and the nearer ones poke out.
        if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.setHorizonFog) {
            var _fp = RETRO_PRESETS[_retro.preset] || RETRO_PRESETS.teal;
            ThreeRenderer.setHorizonFog(_retro.fogEnabled, _fp.fogColor);
        }
    }

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
            _renderer.toneMappingExposure = _cur.exposure * _exposureUser;
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

    // ── Street lamp lights (Entropy Vale) ───────────────────────────────
    // Warm flickering point-lights crowning the street lamps that line the
    // battlefield — same authored behaviour as the ward/lava lights: dim by day,
    // bright at night, with an additive glow plane and a subtle flame flicker.
    var _streetLampLights = [];
    var _streetLampGroup = null;

    var LAMP_LIGHT_COLOR_DAY   = 0xffcf8a;
    var LAMP_LIGHT_COLOR_NIGHT = 0xffb84d;
    var LAMP_LIGHT_INTENSITY_DAY   = 0.35;
    var LAMP_LIGHT_INTENSITY_NIGHT = 1.6;
    var LAMP_LIGHT_DISTANCE   = 420;
    var LAMP_LIGHT_DECAY      = 1.5;

    // heads: [{ wx, wy, wz }] world positions of each lantern. Point-lights only —
    // the visible bloom halo is the renderer's _hzGlowCore sprite at each head
    // (this mirrors the lava lights, which likewise contribute light, not glow).
    function rebuildStreetLampLights(heads, tileSize) {
        if (!_scene) return;

        if (!_streetLampGroup) {
            _streetLampGroup = new THREE.Group();
            _streetLampGroup.name = 'streetLampLights';
            _scene.add(_streetLampGroup);
        }

        for (var i = 0; i < _streetLampLights.length; i++) {
            var entry = _streetLampLights[i];
            _streetLampGroup.remove(entry.light);
            if (entry.light.dispose) entry.light.dispose();
        }
        _streetLampLights = [];

        if (!heads || !heads.length) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var lightColor = isNight ? LAMP_LIGHT_COLOR_NIGHT : LAMP_LIGHT_COLOR_DAY;
        var lightIntensity = isNight ? LAMP_LIGHT_INTENSITY_NIGHT : LAMP_LIGHT_INTENSITY_DAY;

        for (var i = 0; i < heads.length; i++) {
            var hd = heads[i];

            var pl = new THREE.PointLight(lightColor, lightIntensity, LAMP_LIGHT_DISTANCE, LAMP_LIGHT_DECAY);
            pl.position.set(hd.wx, hd.wy, hd.wz);
            pl._ew_lampLight = true;
            _streetLampGroup.add(pl);

            _streetLampLights.push({ light: pl });
        }
    }

    function _updateStreetLampLights() {
        if (_streetLampLights.length === 0) return;
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var baseIntensity = isNight ? LAMP_LIGHT_INTENSITY_NIGHT : LAMP_LIGHT_INTENSITY_DAY;
        var now = performance.now() * 0.001;

        for (var i = 0; i < _streetLampLights.length; i++) {
            var entry = _streetLampLights[i];
            var flicker = 1.0
                + 0.06 * Math.sin(now * 5.7 + i * 1.9)
                + 0.04 * Math.sin(now * 11.3 + i * 3.7)
                + 0.02 * Math.sin(now * 1.9 + i * 4.4);
            entry.light.intensity = baseIntensity * flicker;
            entry.light.color.set(isNight ? LAMP_LIGHT_COLOR_NIGHT : LAMP_LIGHT_COLOR_DAY);
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

        // LinearToneMapping (not NoToneMapping) so toneMappingExposure actually
        // takes effect — it just multiplies scene colour by exposure and clamps,
        // so at exposure 1.0 it matches the old NoToneMapping look, but now the
        // day/night exposure grade + the pause-menu Brightness slider work.
        renderer.toneMapping = THREE.LinearToneMapping;
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

        // Retro / Haunted-PS1 pass — LAST, so grade + dither are the final thing
        // the eye sees (per the aesthetic guide's recommended pass order).
        _retroPass = new THREE.ShaderPass(_RetroShader);
        _retroPass.material.uniforms['uResolution'].value.set(w, h);
        _retroPass.enabled = _retro.enabled;
        _applyRetroUniforms();
        _composer.addPass(_retroPass);
        _applySceneFog();

        _ready = true;
        console.log('[ThreePost] initialized — bloom + FXAA + cinematic filter + retro filter + directional/hemi lighting');
    }

    function render(cam) {

        syncLighting();
        _updateWardLights();
        _updateStreetLampLights();
        _updateLavaLights();
        _updateUnitLights();

        if (_cinematicPass && _cinematicPass.enabled) {
            _cinematicPass.material.uniforms['uTime'].value = performance.now() * 0.001;
        }

        if (_retroPass && _retroPass.enabled) {
            _retroPass.material.uniforms['uTime'].value = performance.now() * 0.001;
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
        if (_retroPass) {
            _retroPass.material.uniforms['uResolution'].value.set(w, h);
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
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_bloomStrength_v2', String(BLOOM_USER_STRENGTH)); } catch (e) {}
    }

    function getBloomStrength()    { return BLOOM_USER_STRENGTH; }
    function getBloomMaxStrength() { return BLOOM_MAX_STRENGTH; }

    function setExposureScale(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        _exposureUser = Math.max(EXPOSURE_MIN, Math.min(EXPOSURE_MAX, s));
        if (_renderer) _renderer.toneMappingExposure = _cur.exposure * _exposureUser;
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_exposure', String(_exposureUser)); } catch (e) {}
    }
    function getExposureScale() { return _exposureUser; }
    function getExposureRange() { return { min: EXPOSURE_MIN, max: EXPOSURE_MAX }; }

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

        if (_streetLampGroup) {
            for (var i = 0; i < _streetLampLights.length; i++) {
                if (_streetLampLights[i].light && _streetLampLights[i].light.dispose) _streetLampLights[i].light.dispose();
            }
            _streetLampLights = [];
            if (_scene && _streetLampGroup.parent) _scene.remove(_streetLampGroup);
            _streetLampGroup = null;
        }

        if (_scene && _scene.fog) _scene.fog = null;

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

    // ── Retro / Haunted-PS1 filter API ──────────────────────────────────
    function setRetroFilter(enabled) {
        _retro.enabled = !!enabled;
        if (_retroPass) _retroPass.enabled = _retro.enabled;
        _saveRetro();
    }
    function isRetroFilterEnabled() { return _retro.enabled; }

    function setRetroPreset(name) {
        if (!RETRO_PRESETS[name]) return;
        _retro.preset = name;
        // re-seed the preset-driven sliders so they reflect the new mood
        var p = RETRO_PRESETS[name];
        _retro.levels = p.levels;
        _retro.tintAmount = p.tintAmount;
        _applyRetroUniforms();
        _applySceneFog();
        _saveRetro();
    }
    function getRetroPreset() { return _retro.preset; }
    function getRetroPresets() {
        return Object.keys(RETRO_PRESETS).map(function (k) {
            return { key: k, label: RETRO_PRESETS[k].label };
        });
    }

    // Tunable keys: pixelSize, ditherStrength, ditherScale, grain, levels, tintAmount
    function setRetroParam(key, value) {
        var v = parseFloat(value);
        if (isNaN(v)) return;
        if (!(key in _retro)) return;
        _retro[key] = v;
        _applyRetroUniforms();
        _saveRetro();
    }
    function getRetroParam(key) { return _retro[key]; }
    function getRetroState() {
        var out = {};
        for (var k in _retro) out[k] = _retro[k];
        return out;
    }

    function setRetroFog(enabled) {
        _retro.fogEnabled = !!enabled;
        _applySceneFog();
        _saveRetro();
    }
    function isRetroFogEnabled() { return _retro.fogEnabled; }
    function setRetroFogDensity(value) {
        var v = parseFloat(value);
        if (isNaN(v)) return;
        _retro.fogDensity = Math.max(0, v);
        _applySceneFog();
        _saveRetro();
    }
    function getRetroFogDensity() { return _retro.fogDensity; }

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
        setExposureScale: setExposureScale,
        getExposureScale: getExposureScale,
        getExposureRange: getExposureRange,
        setExposure: setExposure,
        setFXAA: setFXAA,
        isFXAAEnabled: isFXAAEnabled,
        setPixelRatio: setPixelRatio,
        syncLighting: syncLighting,
        rebuildWardLights: rebuildWardLights,
        rebuildUnitLights: rebuildUnitLights,
        rebuildLavaLights: rebuildLavaLights,
        rebuildStreetLampLights: rebuildStreetLampLights,
        setCinematicFilter: setCinematicFilter,
        isCinematicFilterEnabled: isCinematicFilterEnabled,
        setCinematicParam: setCinematicParam,
        setRetroFilter: setRetroFilter,
        isRetroFilterEnabled: isRetroFilterEnabled,
        setRetroPreset: setRetroPreset,
        getRetroPreset: getRetroPreset,
        getRetroPresets: getRetroPresets,
        setRetroParam: setRetroParam,
        getRetroParam: getRetroParam,
        getRetroState: getRetroState,
        setRetroFog: setRetroFog,
        isRetroFogEnabled: isRetroFogEnabled,
        setRetroFogDensity: setRetroFogDensity,
        getRetroFogDensity: getRetroFogDensity,
        isReady: isReady,
        dispose: dispose
    };
})();

window.ThreePost = ThreePost;
