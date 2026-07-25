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

    // ── HD-2D upgrade state (filmic tone / shadows / tilt-shift DoF) ────
    // Filmic tone mapping (ACESFilmic) — richer contrast + highlight rolloff.
    // ACES darkens midtones vs the old Linear pipe, so when it's on the
    // day/night exposure is multiplied by FILMIC_EXPOSURE_COMP to match the
    // scene's authored brightness. Toggling requires a material recompile
    // (tone mapping is baked into every program), handled in setFilmicTone.
    var _filmic = true;
    var FILMIC_EXPOSURE_COMP = 1.22;
    try {
        var _fmSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_filmicTone') : null;
        if (_fmSaved !== null) _filmic = (_fmSaved === '1' || _fmSaved === 'true');
    } catch (e) {}

    // Real-time sun shadows. Quality picks the shadow-map resolution; 'off'
    // disables the depth pass entirely. The ortho shadow frustum is fitted to
    // the board by setShadowFrame (called from ThreeRenderer.rebuildTerrain).
    var _shadowQuality = 'high';               // 'off' | 'low' | 'high'
    var SHADOW_MAP_SIZE = { low: 1024, high: 2048 };
    try {
        var _shSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_shadows') : null;
        if (_shSaved === 'off' || _shSaved === 'low' || _shSaved === 'high') _shadowQuality = _shSaved;
    } catch (e) {}
    var _shadowFrame = null;                   // { cx, cz, radius } board fit, world px

    // Tilt-shift depth of field (the HD-2D diorama look): a horizontal band of
    // the screen around the camera's focal point stays sharp, everything
    // nearer/farther melts into a miniature-photography blur. Strength 0 = off.
    var _dofStrength = 0.45;                   // 0..1 (slider), 0 disables
    var DOF_MAX_BLUR_PX = 5.0;                 // tap spread at strength 1 (per pass)
    var DOF_BAND = 0.13;                       // half-height of the fully-sharp band (uv)
    var DOF_FEATHER = 0.30;                    // uv distance over which blur ramps to full
    try {
        var _dofSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_dofStrength') : null;
        if (_dofSaved !== null) {
            var _dv = parseFloat(_dofSaved);
            if (!isNaN(_dv)) _dofStrength = Math.max(0, Math.min(1, _dv));
        }
    } catch (e) {}
    var _dofPassH = null, _dofPassV = null;
    var _dofFocusCur = 0.5;                    // smoothed focus line (screen v, 0=bottom)

    var _cinematicPass = null;

    // ── Impact flash (bloom pulse) ───────────────────────────────────────
    // Big hits kick the bloom strength up for a beat and let it decay — the
    // cheap "the screen radiates" moment (the bloom pass already runs, so a
    // pulse costs nothing). Scaled by the pause-menu Impact Flash slider;
    // 0 disables pulses entirely. Fired by the VFX layer via bloomPulse().
    var _impactFx = 0.7;                       // 0..1.5 slider
    var IMPACT_FX_MAX = 1.5;
    try {
        var _ifxSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_impactFx') : null;
        if (_ifxSaved !== null) {
            var _ifv = parseFloat(_ifxSaved);
            if (!isNaN(_ifv)) _impactFx = Math.max(0, Math.min(IMPACT_FX_MAX, _ifv));
        }
    } catch (e) {}
    var _bloomPulseAmt = 0;                    // current pulse peak (bloom strength units)
    var _bloomPulseT0 = 0;                     // pulse start (ms)
    var _bloomPulseMs = 300;                   // pulse decay time

    function bloomPulse(amount, ms) {
        if (_impactFx <= 0) return;
        var a = parseFloat(amount);
        if (isNaN(a) || a <= 0) return;
        a = Math.min(2.0, a) * _impactFx;
        var now = performance.now();
        // Overlapping pulses: keep whichever peak is currently stronger so
        // multi-hit spam can't stack bloom to white-out.
        var live = _bloomPulseCurrent(now);
        if (a > live) {
            _bloomPulseAmt = a;
            _bloomPulseT0 = now;
            _bloomPulseMs = Math.max(80, Math.min(1200, ms || 300));
        }
    }
    function _bloomPulseCurrent(now) {
        if (_bloomPulseAmt <= 0) return 0;
        var t = (now - _bloomPulseT0) / _bloomPulseMs;
        if (t >= 1) { _bloomPulseAmt = 0; return 0; }
        var f = 1 - t;
        return _bloomPulseAmt * f * f;         // ease-out decay
    }
    // ── DRAMATIC DIM ─────────────────────────────────────────────────────
    // "The world drops away for the big spell." A TIMED BEAT (never a
    // setting) that ramps the existing night grade — colour drain, cool
    // tint, crushed blacks, closing vignette — and pulls tone-mapping
    // exposure down underneath it. The additive spell VFX and the bloom
    // pass are untouched, so the effect is that the battlefield goes dark
    // and the SPELL becomes the only light source in the frame. That's the
    // Persona / SMT "everything else stops existing" read.
    //
    // Reuses uNightGrade rather than adding a pass: zero extra GPU cost,
    // and it composes correctly with an actual night (max of the two).
    // Scaled by the user's Impact FX slider like bloomPulse, so players who
    // turned the juice down don't get flash-banged.
    //
    //   ThreePost.dramaDim(0.7, 900)                 → ramp, hold 900ms, release
    //   ThreePost.dramaDim(0.7, 900, {riseMs, fallMs})
    //   ThreePost.dramaClear()                       → drop it instantly
    var _drama = { peak: 0, t0: 0, riseMs: 180, holdMs: 0, fallMs: 460 };

    function dramaDim(amount, holdMs, opts) {
        if (_impactFx <= 0) return;
        var a = parseFloat(amount);
        if (isNaN(a) || a <= 0) return;
        a = Math.min(1, a) * Math.min(1, _impactFx);
        var now = performance.now();
        // Overlapping beats: a smaller dim never cuts a bigger one short.
        if (a < _dramaCurrent(now)) return;
        opts = opts || {};
        _drama.peak = a;
        _drama.t0 = now;
        _drama.riseMs = Math.max(40, opts.riseMs || 180);
        _drama.holdMs = Math.max(0, holdMs || 400);
        _drama.fallMs = Math.max(90, opts.fallMs || 460);
    }
    function _dramaCurrent(now) {
        if (_drama.peak <= 0) return 0;
        var t = now - _drama.t0;
        if (t < 0) return 0;
        if (t < _drama.riseMs) return _drama.peak * (t / _drama.riseMs);
        t -= _drama.riseMs;
        if (t < _drama.holdMs) return _drama.peak;
        t -= _drama.holdMs;
        if (t < _drama.fallMs) {
            var f = 1 - t / _drama.fallMs;
            return _drama.peak * f * f;            // ease-out release
        }
        _drama.peak = 0;
        return 0;
    }
    function dramaClear() { _drama.peak = 0; }
    function getDramaDim() { return _dramaCurrent(performance.now()); }

    // ── SPELL GRADE ──────────────────────────────────────────────────────
    // "The world drops away for the big spell" — the SHADER half. dramaDim
    // above darkens the whole frame uniformly; this is the version that
    // keeps the CASTER and the TARGET standing in pools of light while the
    // map, the props and the backdrop fall into the dark, and that can push
    // the whole frame through a psychedelic grade on the way.
    //
    // Five knobs, all riding ONE timed envelope (rise → hold → fall), all
    // driven through the existing cinematic pass (no extra fullscreen pass,
    // so a beat costs nothing when it isn't running):
    //
    //   dim      how dark the world goes OUTSIDE the pools of light. Hot
    //            pixels (additive spell VFX, bloom) are exempted by
    //            luminance, so the spell itself stays the light source.
    //   focus    WORLD-space points (the caster tile, the target tile) that
    //            get the pools. Re-projected every frame, so the pools track
    //            through camera pans/orbits for free.
    //   trip     hue-cycling + saturation blowout — the Bad Trip grade, now
    //            a real shader instead of a CSS filter on the canvas.
    //   chroma   radial chromatic aberration in px (RGB pulls apart toward
    //            the corners). Independent of the CRT filter's own chroma,
    //            so it reads with the CRT toggle off.
    //   warp     UV wobble — the frame breathes/melts.
    //   tint     per-archetype colour push (fire runs hot, ice runs cold,
    //            unholy runs violet) so spells stop grading identically.
    //
    // Scaled by the pause-menu Impact FX slider like bloomPulse/dramaDim,
    // and killable outright with window.EW_DISABLE_SPELL_GRADE = true.
    //
    //   ThreePost.spellGrade({ dim: 0.8, trip: 0.7, chroma: 4, warp: 0.004,
    //                          focus: [{x,y,z,r}], holdMs: 700 })
    //   ThreePost.spellGradeFocus([{x,y,z,r}, …])   → move the pools
    //   ThreePost.spellGradeKick(6, 220)            → aberration snap
    //   ThreePost.spellGradeClear()
    //
    // The pause-menu "Spell Cinematics" toggle persists as the INVERSE of
    // the kill-switch, so the default — no saved key — is ON.
    try {
        var _sgSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_spellGrade') : null;
        if (_sgSaved === '0' && typeof window !== 'undefined') window.EW_DISABLE_SPELL_GRADE = true;
    } catch (e) {}

    var _grade = {
        live: false,
        t0: 0, riseMs: 200, holdMs: 400, fallMs: 520,
        dim: 0, spotSoft: 0.75, spotLift: 0.9,
        trip: 0, hueRate: 0, warp: 0, chroma: 0,
        tint: [1, 1, 1], tintAmt: 0,
        focus: [],
        hue: 0, lastT: 0
    };
    var _gradeKick = { amt: 0, t0: 0, ms: 220 };
    var _gv1 = null, _gv2 = null;                  // projection scratch

    function _gradeIntensity(g) {
        return Math.max(g.dim, g.trip, g.chroma / 8, g.tintAmt * 0.6, g.warp * 60);
    }
    function _gradeCurrent(now) {
        if (!_grade.live) return 0;
        var t = now - _grade.t0;
        if (t < 0) return 0;
        if (t < _grade.riseMs) return t / _grade.riseMs;
        t -= _grade.riseMs;
        if (t < _grade.holdMs) return 1;
        t -= _grade.holdMs;
        if (t < _grade.fallMs) {
            var f = 1 - t / _grade.fallMs;
            return f * f;                          // ease-out release
        }
        _grade.live = false;
        _grade.focus.length = 0;
        return 0;
    }

    function spellGrade(opts) {
        if (!opts) return;
        if (typeof window !== 'undefined' && window.EW_DISABLE_SPELL_GRADE) return;
        if (_impactFx <= 0) return;
        var scale = Math.min(1, _impactFx);
        var next = {
            dim:      Math.max(0, Math.min(1, (opts.dim || 0))) * scale,
            trip:     Math.max(0, Math.min(1, (opts.trip || 0))) * scale,
            chroma:   Math.max(0, Math.min(24, (opts.chroma || 0))) * scale,
            warp:     Math.max(0, Math.min(0.05, (opts.warp || 0))) * scale,
            tintAmt:  Math.max(0, Math.min(1, (opts.tintAmt || 0))) * scale,
            hueRate:  opts.hueRate || 0
        };
        var now = performance.now();
        // A weaker beat never cuts a stronger one short (same rule as
        // dramaDim) — spell chains and multi-hits would otherwise strobe.
        var liveK = _gradeCurrent(now);
        if (liveK > 0 && _gradeIntensity(next) < _gradeIntensity(_grade) * liveK) {
            if (opts.focus) spellGradeFocus(opts.focus);
            return;
        }
        _grade.live = true;
        _grade.t0 = now;
        _grade.lastT = now;
        _grade.riseMs = Math.max(40, opts.riseMs || 200);
        _grade.holdMs = Math.max(0, opts.holdMs != null ? opts.holdMs : 400);
        _grade.fallMs = Math.max(90, opts.fallMs || 520);
        _grade.dim = next.dim;
        _grade.trip = next.trip;
        _grade.chroma = next.chroma;
        _grade.warp = next.warp;
        _grade.tintAmt = next.tintAmt;
        _grade.hueRate = next.hueRate;
        _grade.spotSoft = opts.spotSoft != null ? Math.max(0.05, opts.spotSoft) : 0.75;
        _grade.spotLift = opts.spotLift != null ? Math.max(0, Math.min(1, opts.spotLift)) : 0.9;
        if (opts.tint) {
            _grade.tint[0] = opts.tint[0]; _grade.tint[1] = opts.tint[1]; _grade.tint[2] = opts.tint[2];
        } else {
            _grade.tint[0] = _grade.tint[1] = _grade.tint[2] = 1;
        }
        if (!opts.keepHue) _grade.hue = 0;
        spellGradeFocus(opts.focus || []);
    }

    // Move / replace the pools of light. Points are WORLD-space with an
    // optional world-unit radius `r` (defaults to ~1.5 tiles' worth).
    function spellGradeFocus(points) {
        _grade.focus.length = 0;
        if (!points || !points.length) return;
        for (var i = 0; i < points.length && i < 2; i++) {
            var p = points[i];
            if (!p || p.x == null) continue;
            _grade.focus.push({ x: p.x, y: p.y || 0, z: p.z || 0, r: p.r > 0 ? p.r : 190 });
        }
    }

    // Short additive aberration snap — the frame the hit registers. Rides on
    // top of whatever grade is live (or on nothing at all).
    function spellGradeKick(px, ms) {
        if (typeof window !== 'undefined' && window.EW_DISABLE_SPELL_GRADE) return;
        if (_impactFx <= 0) return;
        var a = Math.max(0, Math.min(24, parseFloat(px) || 0)) * Math.min(1, _impactFx);
        if (a <= 0) return;
        var now = performance.now();
        if (a > _gradeKickCurrent(now)) {
            _gradeKick.amt = a;
            _gradeKick.t0 = now;
            _gradeKick.ms = Math.max(60, Math.min(900, ms || 220));
        }
    }
    function _gradeKickCurrent(now) {
        if (_gradeKick.amt <= 0) return 0;
        var t = (now - _gradeKick.t0) / _gradeKick.ms;
        if (t >= 1) { _gradeKick.amt = 0; return 0; }
        var f = 1 - t;
        return _gradeKick.amt * f * f;
    }

    function spellGradeClear() {
        _grade.live = false;
        _grade.focus.length = 0;
        _gradeKick.amt = 0;
    }
    function isSpellGradeActive() {
        return _gradeCurrent(performance.now()) > 0.001 || _gradeKickCurrent(performance.now()) > 0.01;
    }

    // Project the world-space pools into screen UV + a screen radius measured
    // in units of SCREEN HEIGHT (so the mask stays circular at any aspect).
    function _writeSpotUniform(u, name, pt, cam, w, h) {
        var v = u[name].value;
        if (!pt || !cam) { v.set(0.5, 0.5, 0.0); return; }
        if (!_gv1) { _gv1 = new THREE.Vector3(); _gv2 = new THREE.Vector3(); }
        _gv1.set(pt.x, pt.y, pt.z);
        _gv1.project(cam);
        if (_gv1.z > 1) { v.set(0.5, 0.5, 0.0); return; }   // behind the camera
        // A second point pushed along the camera's RIGHT axis by the pool
        // radius — the screen-space gap between the two IS the radius.
        var m = cam.matrixWorld.elements;
        _gv2.set(pt.x + m[0] * pt.r, pt.y + m[1] * pt.r, pt.z + m[2] * pt.r);
        _gv2.project(cam);
        var aspect = (h > 0) ? (w / h) : 1.0;
        var r = Math.abs(_gv2.x - _gv1.x) * 0.5 * aspect;
        v.set(_gv1.x * 0.5 + 0.5, _gv1.y * 0.5 + 0.5, Math.max(0.02, Math.min(2.0, r)));
    }

    function setImpactFx(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        _impactFx = Math.max(0, Math.min(IMPACT_FX_MAX, s));
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_impactFx', String(_impactFx)); } catch (e) {}
    }
    function getImpactFx() { return _impactFx; }
    function getImpactFxMax() { return IMPACT_FX_MAX; }

    // ── CRT / cinematic filter + vignette state ─────────────────────────
    // The cinematic pass hosts two INDEPENDENT effects: the CRT look (scanlines
    // + chromatic aberration + barrel curvature + flicker) and a separate corner
    // vignette. Each toggles on its own — the pass runs whenever EITHER is on —
    // and every knob below is a pause-menu slider, persisted as one JSON blob.
    // Vignette strength defaults low: the old build hard-wired a full-strength
    // vignette into the CRT filter, which read as far too heavy.
    var _cin = {
        crt:        false,   // scanlines + chroma + curvature + flicker
        vignette:   false,   // dark-corner vignette (independent of CRT)
        scanline:   0.07,    // scanline darkening (uScanlineAlpha)
        chroma:     0.8,     // chromatic-aberration shift in px (uChromaShift)
        curvature:  0.0,     // barrel distortion (uCurvature)
        vigAmount:  0.45,    // vignette strength (0 = none, 1 = full darkening)
        vigSize:    0.42,    // vignette radius (uVignetteSize)
        vigSoft:    0.55     // vignette edge softness (uVignetteSoft)
    };
    try {
        var _cinSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_cinematic') : null;
        if (_cinSaved) {
            var _cs = JSON.parse(_cinSaved);
            if (_cs && typeof _cs === 'object') {
                ['crt', 'vignette'].forEach(function (k) { if (typeof _cs[k] === 'boolean') _cin[k] = _cs[k]; });
                ['scanline', 'chroma', 'curvature', 'vigAmount', 'vigSize', 'vigSoft'].forEach(function (k) {
                    if (typeof _cs[k] === 'number' && !isNaN(_cs[k])) _cin[k] = _cs[k];
                });
            }
        }
    } catch (e) {}

    function _saveCinematic() {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem('ew_cinematic', JSON.stringify(_cin));
        } catch (e) {}
    }

    // ── Tilt-shift blur shader (run twice: horizontal then vertical) ─────
    // Separable 9-tap gaussian whose radius scales with distance from a focus
    // line (uFocus, screen v). Inside ±uBand it's fully sharp; blur ramps in
    // over uFeather. This is what sells the HD-2D miniature-diorama look.
    var _TiltShiftShader = {
        uniforms: {
            'tDiffuse':   { value: null },
            'uResolution':{ value: new THREE.Vector2(1, 1) },
            'uDir':       { value: new THREE.Vector2(1, 0) },
            'uFocus':     { value: 0.5 },
            'uBand':      { value: DOF_BAND },
            'uFeather':   { value: DOF_FEATHER },
            'uAmount':    { value: 0.0 }
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
            'uniform vec2 uDir;',
            'uniform float uFocus;',
            'uniform float uBand;',
            'uniform float uFeather;',
            'uniform float uAmount;',
            'varying vec2 vUv;',
            '',
            'void main() {',
            '  float d = abs(vUv.y - uFocus);',
            '  float f = clamp((d - uBand) / max(uFeather, 0.001), 0.0, 1.0);',
            '  f = f * f;                                // ease-in so the band edge is gentle',
            '  float r = uAmount * f;',
            '  if (r < 0.05) { gl_FragColor = texture2D(tDiffuse, vUv); return; }',
            '  vec2 step = (uDir / uResolution) * r;',
            '  vec4 c = texture2D(tDiffuse, vUv) * 0.2270;',
            '  c += (texture2D(tDiffuse, vUv + step * 1.0) + texture2D(tDiffuse, vUv - step * 1.0)) * 0.1946;',
            '  c += (texture2D(tDiffuse, vUv + step * 2.0) + texture2D(tDiffuse, vUv - step * 2.0)) * 0.1216;',
            '  c += (texture2D(tDiffuse, vUv + step * 3.0) + texture2D(tDiffuse, vUv - step * 3.0)) * 0.0541;',
            '  c += (texture2D(tDiffuse, vUv + step * 4.0) + texture2D(tDiffuse, vUv - step * 4.0)) * 0.0162;',
            '  gl_FragColor = c;',
            '}'
        ].join('\n')
    };

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
            'uVignetteAmount':{ value: 0.0 },
            'uCrtAmount':     { value: 0.0 },
            'uCurvature':     { value: 0.0 },
            'uNightGrade':    { value: 0.0 },
            'uNightTint':     { value: new THREE.Vector3(0.68, 0.78, 1.08) },
            // ── spell grade (see spellGrade() above) ──
            'uSpotDim':       { value: 0.0 },
            'uSpotA':         { value: new THREE.Vector3(0.5, 0.5, 0.0) },
            'uSpotB':         { value: new THREE.Vector3(0.5, 0.5, 0.0) },
            'uSpotSoft':      { value: 0.75 },
            'uSpotLift':      { value: 0.9 },
            'uTrip':          { value: 0.0 },
            'uHue':           { value: 0.0 },
            'uWarp':          { value: 0.0 },
            'uChromaRadial':  { value: 0.0 },
            'uGradeTint':     { value: new THREE.Vector3(1.0, 1.0, 1.0) },
            'uGradeTintAmt':  { value: 0.0 }
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
            'uniform float uVignetteAmount;',
            'uniform float uCrtAmount;',
            'uniform float uCurvature;',
            'uniform float uNightGrade;',
            'uniform vec3 uNightTint;',
            'uniform float uSpotDim;',
            'uniform vec3 uSpotA;',
            'uniform vec3 uSpotB;',
            'uniform float uSpotSoft;',
            'uniform float uSpotLift;',
            'uniform float uTrip;',
            'uniform float uHue;',
            'uniform float uWarp;',
            'uniform float uChromaRadial;',
            'uniform vec3 uGradeTint;',
            'uniform float uGradeTintAmt;',
            'varying vec2 vUv;',
            '',
            '// pool of light: 1 at the focus point, 0 past the feathered rim.',
            '// Distances are aspect-corrected so the pool stays round.',
            'float spotMask(vec2 uv, vec3 s, vec2 asp) {',
            '  if (s.z <= 0.0) return 0.0;',
            '  float d = length((uv - s.xy) * asp);',
            '  return 1.0 - smoothstep(s.z, s.z * (1.0 + uSpotSoft), d);',
            '}',
            '',
            '// hue rotation about the (1,1,1) grey axis (Rodrigues) — the',
            '// colour-cycling that makes a psychedelic beat read as a TRIP',
            '// rather than as a flat purple wash.',
            'vec3 hueRotate(vec3 c, float a) {',
            '  const vec3 k = vec3(0.57735027);',
            '  float ca = cos(a), sa = sin(a);',
            '  return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca);',
            '}',
            '',
            'vec2 curveUV(vec2 uv) {',
            '  if (uCurvature < 0.001 || uCrtAmount < 0.001) return uv;',
            '  vec2 c = uv * 2.0 - 1.0;',
            '  c *= 1.0 + uCurvature * dot(c, c);',
            '  // Auto-overscan: the barrel bulge pushes the corners outward (the',
            '  // corner at |c|=(1,1) grows by 1 + 2*uCurvature), which would sample',
            '  // off-image and show as black borders. Scale back by that exact corner',
            '  // factor so the curved image always fills the whole screen edge-to-edge.',
            '  c /= 1.0 + 2.0 * uCurvature;',
            '  return c * 0.5 + 0.5;',
            '}',
            '',
            'void main() {',
            '  vec2 uv = curveUV(vUv);',
            '',
            '  // ── spell warp: the frame breathes/melts (two beat frequencies',
            '  // per axis so it never reads as a clean sine). ──',
            '  if (uWarp > 0.00001) {',
            '    float wt = uTime * 2.1;',
            '    uv += vec2(',
            '      sin(uv.y * 11.0 + wt) * 0.65 + sin(uv.y * 27.0 - wt * 1.7) * 0.35,',
            '      cos(uv.x * 13.0 - wt * 1.3) * 0.65 + cos(uv.x * 21.0 + wt * 2.2) * 0.35',
            '    ) * uWarp;',
            '    uv = clamp(uv, vec2(0.0005), vec2(0.9995));',
            '  }',
            '',
            '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {',
            '    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
            '    return;',
            '  }',
            '',
            '  // ── CRT look (chroma + scanlines + flicker), scaled by uCrtAmount ──',
            '  // uChromaRadial adds the SPELL aberration on top: a radial pull that',
            '  // grows toward the corners, so a hit visibly tears the image apart',
            '  // even with the CRT filter switched off.',
            '  float px = (uChromaShift * uCrtAmount) / uResolution.x;',
            '  vec2 ab = (uv - 0.5) * (uChromaRadial * 2.0 / uResolution.x);',
            '  float r = texture2D(tDiffuse, vec2(uv.x - px, uv.y) - ab).r;',
            '  vec4 center = texture2D(tDiffuse, uv);',
            '  float b = texture2D(tDiffuse, vec2(uv.x + px, uv.y) + ab).b;',
            '  float g = center.g;',
            '  if (uChromaRadial > 0.01) {',
            '    // green rides the PERPENDICULAR so the split fans instead of',
            '    // smearing along one line — reads far more like a bad signal',
            '    g = texture2D(tDiffuse, uv + vec2(-ab.y, ab.x) * 0.6).g;',
            '  }',
            '  vec4 col = vec4(r, g, b, center.a);',
            '',
            '  // ── psychedelic grade: cycling hue + saturation blowout ──',
            '  if (uTrip > 0.001) {',
            '    vec3 hc = hueRotate(col.rgb, uHue * 6.2831853);',
            '    float tl = dot(hc, vec3(0.299, 0.587, 0.114));',
            '    hc = mix(vec3(tl), hc, 1.0 + 1.3 * uTrip);          // oversaturate',
            '    hc = mix(hc, hc * hc * 2.0, 0.18 * uTrip);          // push the highs',
            '    col.rgb = mix(col.rgb, hc, uTrip);',
            '  }',
            '',
            '  // ── archetype colour push (fire hot, ice cold, unholy violet) ──',
            '  if (uGradeTintAmt > 0.001) {',
            '    col.rgb = mix(col.rgb, col.rgb * uGradeTint, uGradeTintAmt);',
            '  }',
            '',
            '  // pools of light around the caster and the target — computed',
            '  // here because the night grade below is LIFTED inside them.',
            '  vec2 asp = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);',
            '  float spot = 0.0;',
            '  if (uSpotDim > 0.001) spot = max(spotMask(uv, uSpotA, asp), spotMask(uv, uSpotB, asp));',
            '',
            '  float scanY = uv.y * uResolution.y * uScanlineScale;',
            '  float scanline = sin(scanY * 3.14159) * 0.5 + 0.5;',
            '  scanline = pow(scanline, 1.2);',
            '  col.rgb *= 1.0 - (uScanlineAlpha * uCrtAmount) * (1.0 - scanline);',
            '',
            '  float flicker = 1.0 - (0.006 * uCrtAmount) * sin(uTime * 8.3);',
            '  col.rgb *= flicker;',
            '',
            '  // ── night colour grade — cool tint + desaturate + crushed shadows.',
            '  // Driven per-frame by the day/night cycle × the Night Mood slider,',
            '  // so nights read moody instead of "slightly blue day".',
            '  if (uNightGrade > 0.001) {',
            '    float ng = clamp(uNightGrade, 0.0, 1.0);',
            '    ng *= (1.0 - uSpotLift * spot);      // the pools stay lit',
            '    float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));',
            '    col.rgb = mix(col.rgb, vec3(lum), 0.35 * ng);          // drain colour',
            '    col.rgb *= mix(vec3(1.0), uNightTint, ng);             // moonlight tint',
            '    vec3 crushed = col.rgb * col.rgb * (3.0 - 2.0 * col.rgb);',
            '    col.rgb = mix(col.rgb, crushed, 0.30 * ng);            // deepen blacks',
            '  }',
            '',
            '  // ── vignette (independent of the CRT look), scaled by uVignetteAmount.',
            '  // The night grade closes the corners in further for the moody frame.',
            '  vec2 vc = uv - 0.5;',
            '  float vDist = dot(vc, vc);',
            '  float vignette = smoothstep(uVignetteSize, uVignetteSize - uVignetteSoft, vDist);',
            '  float vigAmt = clamp(uVignetteAmount + 0.35 * uNightGrade, 0.0, 1.0);',
            '  col.rgb *= mix(1.0, vignette, vigAmt);',
            '',
            '  // ── the world drops away, the spell does not ────────────────',
            '  // Everything outside the pools is darkened and drained. HOT',
            '  // pixels are exempted by luminance, so the additive spell VFX',
            '  // (and the bloom off them) keep burning wherever they land —',
            '  // the battlefield goes black and the SPELL lights the frame.',
            '  if (uSpotDim > 0.001) {',
            '    float slum = dot(col.rgb, vec3(0.299, 0.587, 0.114));',
            '    float hot = smoothstep(0.45, 0.95, slum);',
            '    float keep = max(spot, hot);',
            '    col.rgb = mix(vec3(slum), col.rgb, mix(1.0 - 0.45 * uSpotDim, 1.0, keep));',
            '    col.rgb *= mix(1.0 - uSpotDim, 1.0, keep);',
            '  }',
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
        // WHAT the pixelation applies to. 'models' (default) = only the 3D GLB
        // models (units, Meshy props) get the chunky UV-snap; the terrain,
        // trees, turrets and stairs are already hand-pixelled sprite art, so
        // re-pixelating them just smears the tile grid. 'screen' = the old
        // whole-frame behaviour. See _renderPixelMask.
        pixelScope:     'models',
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
        fogDensity:     0.0002,
        // Altitude (view-ray .y) at which the horizon haze band fully CLEARS.
        // 0 = the fog dissolves exactly at the board horizon (z=0 board level) and
        // sits below it — the realistic ground-fog default; higher lets the haze
        // climb up into the sky. Tuned by the pause-menu "Fog Horizon" slider.
        fogHorizon:     0.0
    };
    try {
        var _retroSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_retro') : null;
        if (_retroSaved) {
            var _rs = JSON.parse(_retroSaved);
            if (_rs && typeof _rs === 'object') {
                if (typeof _rs.preset === 'string' && RETRO_PRESETS[_rs.preset]) _retro.preset = _rs.preset;
                if (_rs.pixelScope === 'models' || _rs.pixelScope === 'screen') _retro.pixelScope = _rs.pixelScope;
                ['enabled','fogEnabled'].forEach(function (k) { if (typeof _rs[k] === 'boolean') _retro[k] = _rs[k]; });
                ['pixelSize','ditherStrength','ditherScale','grain','levels','tintAmount','fogDensity','fogHorizon'].forEach(function (k) {
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
            'uGrain':         { value: 0.04 },
            // Models-only pixelation: silhouette mask of the 3D GLB meshes
            // (white = model). uMaskMode 0 = pixelate the whole frame.
            'tMask':          { value: null },
            'uMaskMode':      { value: 0.0 }
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
            'uniform sampler2D tMask;',
            'uniform float uMaskMode;',
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
            '  // 1. optional chunky pixelation (UV-snap downscale). In models-only',
            '  //    mode the snap happens ONLY where the model mask is lit, so the',
            '  //    already-pixel-art terrain sprites stay at native resolution.',
            '  //    The mask is read at BOTH the block centre and the exact pixel:',
            '  //    centre fills a block solid, exact catches the silhouette edge,',
            '  //    so partly-covered blocks still snap (that is the chunky look).',
            '  vec2 uv = vUv;',
            '  if (uPixelSize > 1.0) {',
            '    vec2 cells = uResolution / uPixelSize;',
            '    vec2 snapped = (floor(vUv * cells) + 0.5) / cells;',
            '    if (uMaskMode > 0.5) {',
            '      float m = max(texture2D(tMask, snapped).r, texture2D(tMask, vUv).r);',
            '      uv = mix(vUv, snapped, step(0.35, m));',
            '    } else {',
            '      uv = snapped;',
            '    }',
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

    // ── Models-only pixelation mask ─────────────────────────────────────
    // The board is hand-pixelled sprite art already (terrain, trees, turrets,
    // stairs all sample the R2 /Assets/Sprites/terrain textures at NearestFilter),
    // so the retro UV-snap double-pixelates it and dissolves the tile grid. The
    // things that DO need it are the smooth-shaded GLB models — rigged unit
    // characters and the Meshy weapon/prop bakes. This renders a cheap white
    // silhouette of exactly those meshes into a half-res target; the retro
    // shader snaps UVs only where that mask is lit.
    //
    // Meshes opt in through flags the renderers already set: _ew_modelSkin (unit
    // GLB meshes, three-renderer) or _ew_pixelate (weapon/prop GLBs, three-vfx-
    // effects). The scan tags them onto two dedicated camera layers — skinned and
    // static — because one scene.overrideMaterial can't serve both: r128 needs
    // material.skinning to match the mesh type or the shader reads attributes the
    // geometry doesn't have.
    var PIX_LAYER_SKIN = 7, PIX_LAYER_STATIC = 8;
    var PIX_SCAN_MS = 400;      // re-tag newly spawned models a few times a second
    var _maskRT = null, _maskMatSkin = null, _maskMatStatic = null;
    var _maskW = 0, _maskH = 0, _maskScanAt = 0, _maskVec = null, _maskClearCol = null;

    function _scanPixelMaskTargets() {
        if (!_scene) return;
        _scene.traverse(function (n) {
            if (!n.isMesh || n._ew_pixelTagged) return;
            // Silhouette/x-ray twins share the model's geometry but are a UI
            // read-through, not the model itself — never mask them.
            if (n._ew_silhouette) return;
            if (!(n._ew_modelSkin || n._ew_pixelate)) return;
            n._ew_pixelTagged = true;
            n.layers.enable(n.isSkinnedMesh ? PIX_LAYER_SKIN : PIX_LAYER_STATIC);
        });
    }

    // Renders the mask for this frame. Returns true when tMask is usable.
    // Deliberately has NO terrain in it: an occluder pass would cost a second
    // full scene render, and a unit hidden behind a cliff only ever means a few
    // background blocks get snapped (invisible on flat sprite texture) — while
    // its x-ray hologram twin, which DOES show through, reads as part of the
    // model anyway.
    function _renderPixelMask(cam) {
        if (!_renderer || !_scene || !cam || typeof THREE === 'undefined') return false;
        try {
            var now = performance.now();
            if (now - _maskScanAt > PIX_SCAN_MS) { _maskScanAt = now; _scanPixelMaskTargets(); }

            if (!_maskVec) _maskVec = new THREE.Vector2();
            _renderer.getDrawingBufferSize(_maskVec);
            var w = Math.max(2, Math.round(_maskVec.x * 0.5));
            var h = Math.max(2, Math.round(_maskVec.y * 0.5));
            if (!_maskRT) {
                _maskRT = new THREE.WebGLRenderTarget(w, h, {
                    minFilter: THREE.NearestFilter,
                    magFilter: THREE.NearestFilter,
                    format: THREE.RGBAFormat,
                    stencilBuffer: false
                });
                _maskW = w; _maskH = h;
            } else if (w !== _maskW || h !== _maskH) {
                _maskRT.setSize(w, h); _maskW = w; _maskH = h;
            }
            if (!_maskMatSkin) {
                // toneMapped/fog off so the mask stays a hard 1.0 no matter what
                // the exposure grade or the retro scene fog is doing.
                _maskMatSkin = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
                _maskMatSkin.toneMapped = false;
                _maskMatSkin.skinning = true;
                _maskMatStatic = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
                _maskMatStatic.toneMapped = false;
            }

            var prevTarget    = _renderer.getRenderTarget();
            var prevOverride  = _scene.overrideMaterial;
            var prevLayers    = cam.layers.mask;
            var prevAutoClear = _renderer.autoClear;
            // Shadows are manually driven (autoUpdate off + needsUpdate pulses);
            // these extra renders must not eat the pulse before the real frame.
            var prevShadowNeeds = _renderer.shadowMap ? _renderer.shadowMap.needsUpdate : false;
            var prevAlpha = _renderer.getClearAlpha();
            if (!_maskClearCol) _maskClearCol = new THREE.Color();
            try { _renderer.getClearColor(_maskClearCol); } catch (e) { _maskClearCol.setHex(0x000000); }

            _renderer.setRenderTarget(_maskRT);
            _renderer.autoClear = false;
            if (_renderer.shadowMap) _renderer.shadowMap.needsUpdate = false;
            _renderer.setClearColor(0x000000, 1);
            _renderer.clear(true, true, false);

            cam.layers.set(PIX_LAYER_SKIN);
            _scene.overrideMaterial = _maskMatSkin;
            _renderer.render(_scene, cam);

            cam.layers.set(PIX_LAYER_STATIC);
            _scene.overrideMaterial = _maskMatStatic;
            _renderer.render(_scene, cam);

            _scene.overrideMaterial = prevOverride;
            cam.layers.mask = prevLayers;
            _renderer.setRenderTarget(prevTarget);
            _renderer.setClearColor(_maskClearCol, prevAlpha);
            _renderer.autoClear = prevAutoClear;
            if (_renderer.shadowMap) _renderer.shadowMap.needsUpdate = prevShadowNeeds;
            return true;
        } catch (e) {
            try { console.warn('[ThreePost] pixel mask pass failed — falling back to full-screen pixelate', e); } catch (e2) {}
            return false;
        }
    }

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
        // Also reach the background: the landmark materials are built fog:false
        // and the sky dome is its own shader, so without this the mood fog would
        // haze the board but leave the far bodies floating crisp against a clear
        // sky. The renderer flips distance-fog on the solid scenery materials AND
        // banks a matching haze along the dome's horizon (thinning toward the
        // zenith, so the stars / sun / moon stay visible overhead). Thickness is
        // derived from the density slider so one control drives the whole effect.
        if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.setHorizonFog) {
            var _fp = RETRO_PRESETS[_retro.preset] || RETRO_PRESETS.teal;
            var _thick = Math.max(0, Math.min(1, _retro.fogDensity / 0.0005));
            ThreeRenderer.setHorizonFog(_retro.fogEnabled, _fp.fogColor, _thick, _retro.fogHorizon);
        }
    }

    var _sunLight = null;
    var _hemiLight = null;
    var _ambientLight = null;
    var _lastCycle = null;

    // HD-2D lighting model: a STRONG warm directional key (the shadow-caster)
    // with a low cool ambient + hemisphere fill, instead of the old flat
    // ambient-1.0 wash. Every cliff face / building now has a lit side and a
    // shade side, which is most of what made the old look read as "flat".
    // Total top-face illumination stays close to the old level so the authored
    // terrain palette still reads correctly.
    var LIGHT_DAY = {

        sunColor:    0xfff0d6,
        sunIntensity: 1.0,
        sunX: -0.55, sunY: 1.05, sunZ: -0.42,

        skyColor:    0x9db8e0,
        groundColor: 0x8a7458,
        hemiIntensity: 0.45,

        ambientColor: 0xccd4e8,
        ambientIntensity: 0.38,
        exposure: 0.98,
        bloomStrength: 0, bloomThreshold: 1.0
    };

    var LIGHT_NIGHT = {

        sunColor:    0x9db4e8,
        sunIntensity: 0.55,
        sunX: 0.4, sunY: 1.1, sunZ: 0.3,

        skyColor:    0x2c3a5e,
        groundColor: 0x1a1826,
        hemiIntensity: 0.28,

        ambientColor: 0x5a66a0,
        ambientIntensity: 0.32,
        exposure: 0.92,
        bloomStrength: 0, bloomThreshold: 1.0
    };

    // ── Night Mood ───────────────────────────────────────────────────────
    // The old night preset barely darkened the scene (exposure 0.98 → 0.92),
    // so nights read as slightly blue days. The DEEP preset below is the
    // moody extreme — a real drop in exposure/fill so torches, wards and
    // spell glow become the light sources — and the pause-menu "Night Mood"
    // slider blends the active night preset between the two (0 = old soft
    // night, 1 = full deep night). The same value also drives the night
    // colour grade in the cinematic pass and scales down the units' emissive
    // self-glow in three-renderer.js (ThreePost.getNightMood).
    var LIGHT_NIGHT_DEEP = {

        sunColor:    0x8ba4e0,
        sunIntensity: 0.38,
        sunX: 0.4, sunY: 1.1, sunZ: 0.3,

        skyColor:    0x1b2745,
        groundColor: 0x0c0b14,
        hemiIntensity: 0.16,

        ambientColor: 0x353f66,
        ambientIntensity: 0.15,
        exposure: 0.68,
        bloomStrength: 0, bloomThreshold: 1.0
    };

    var _nightMood = 0.65;                     // 0..1 pause-menu slider
    try {
        var _nmSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_nightMood') : null;
        if (_nmSaved !== null) {
            var _nmv = parseFloat(_nmSaved);
            if (!isNaN(_nmv)) _nightMood = Math.max(0, Math.min(1, _nmv));
        }
    } catch (e) {}

    // Blend the two night presets by the Night Mood slider. Colours lerp in
    // RGB via THREE.Color so the result feeds _presetToTarget unchanged.
    var _npColA = null, _npColB = null;
    function _nightPreset() {
        var m = _nightMood;
        if (m <= 0) return LIGHT_NIGHT;
        if (!_npColA) { _npColA = new THREE.Color(); _npColB = new THREE.Color(); }
        function mixHex(a, b) {
            _npColA.setHex(a); _npColB.setHex(b);
            _npColA.lerp(_npColB, m);
            return _npColA.getHex();
        }
        function mixNum(a, b) { return a + (b - a) * m; }
        return {
            sunColor: mixHex(LIGHT_NIGHT.sunColor, LIGHT_NIGHT_DEEP.sunColor),
            sunIntensity: mixNum(LIGHT_NIGHT.sunIntensity, LIGHT_NIGHT_DEEP.sunIntensity),
            sunX: LIGHT_NIGHT.sunX, sunY: LIGHT_NIGHT.sunY, sunZ: LIGHT_NIGHT.sunZ,
            skyColor: mixHex(LIGHT_NIGHT.skyColor, LIGHT_NIGHT_DEEP.skyColor),
            groundColor: mixHex(LIGHT_NIGHT.groundColor, LIGHT_NIGHT_DEEP.groundColor),
            hemiIntensity: mixNum(LIGHT_NIGHT.hemiIntensity, LIGHT_NIGHT_DEEP.hemiIntensity),
            ambientColor: mixHex(LIGHT_NIGHT.ambientColor, LIGHT_NIGHT_DEEP.ambientColor),
            ambientIntensity: mixNum(LIGHT_NIGHT.ambientIntensity, LIGHT_NIGHT_DEEP.ambientIntensity),
            exposure: mixNum(LIGHT_NIGHT.exposure, LIGHT_NIGHT_DEEP.exposure),
            bloomStrength: 0, bloomThreshold: 1.0
        };
    }

    // Smoothed 0(day)→1(night) factor for the per-frame night colour grade.
    // Eased in syncLighting alongside the light lerp so the grade fades in
    // with the same cadence as the sun.
    var _nightF = 0;

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
            // Direction only (no shadow frame yet): a unit vector aimed at the
            // origin behaves exactly like the old rig. Once setShadowFrame has
            // fitted the board, park the sun a real distance out along that
            // direction so its ortho shadow camera hangs over the battlefield.
            if (_shadowFrame) {
                var _sf = _shadowFrame;
                var _sd = Math.max(_sf.radius * 1.8, 900);
                _sunLight.position.set(_cur.sunDirX, _cur.sunDirY, _cur.sunDirZ).normalize().multiplyScalar(_sd);
                _sunLight.position.x += _sf.cx;
                _sunLight.position.z += _sf.cz;
                if (_sunLight.target) {
                    _sunLight.target.position.set(_sf.cx, 0, _sf.cz);
                    _sunLight.target.updateMatrixWorld();
                }
            } else {
                _sunLight.position.set(_cur.sunDirX, _cur.sunDirY, _cur.sunDirZ).normalize();
            }
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
            _renderer.toneMappingExposure = _cur.exposure * _exposureUser * (_filmic ? FILMIC_EXPOSURE_COMP : 1.0);
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

        _sunLight = new THREE.DirectionalLight(0xfff0d6, 1.0);
        _sunLight.position.set(-0.55, 1.05, -0.42).normalize();
        scene.add(_sunLight);
        scene.add(_sunLight.target);
        _sunLight.castShadow = (_shadowQuality !== 'off');
        _sunLight.shadow.mapSize.width = _sunLight.shadow.mapSize.height =
            SHADOW_MAP_SIZE[_shadowQuality] || SHADOW_MAP_SIZE.high;
        _sunLight.shadow.bias = -0.0004;
        _sunLight.shadow.normalBias = 3.0;   // world px — kills acne on the flat cube faces

        _hemiLight = new THREE.HemisphereLight(0x9db8e0, 0x8a7458, 0.45);
        scene.add(_hemiLight);

        _ambientLight = new THREE.AmbientLight(0xccd4e8, 0.38);
        scene.add(_ambientLight);

        _target = _presetToTarget(LIGHT_DAY);

        for (var k in _target) _cur[k] = _target[k];
        _lerpT = 1.0;
        _lastCycle = 'day';
        _applyCurrent();
    }

    /* §4.2 shadow gating (three-renderer.js): true while the day/night grade
       is still easing — the sun is moving, so shadow maps must re-render. */
    function isLightingEasing() { return _lerpT < 1.0; }

    function syncLighting() {
        if (!_sunLight) return;

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';

        if (cycle !== _lastCycle) {
            _lastCycle = cycle;
            _target = _presetToTarget(cycle === 'night' ? _nightPreset() : LIGHT_DAY);
            _lerpT = 0;
        }

        // Night factor for the colour grade — eased every frame (not gated on
        // _lerpT) so mid-match flips always converge even if the light lerp
        // was interrupted by a preset re-target.
        var _nfTarget = (cycle === 'night') ? 1 : 0;
        _nightF += (_nfTarget - _nightF) * Math.min(1, LIGHT_LERP_SPEED * 0.016 * 1.4);
        if (Math.abs(_nightF - _nfTarget) < 0.002) _nightF = _nfTarget;

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

    // ── Sun shadow rig ───────────────────────────────────────────────────
    // Fit the sun's ortho shadow camera to the board. Called by the renderer
    // whenever the terrain rebuilds (board size / tile size changes).
    // cx/cz = board centre (world px), radius = half the board diagonal + margin.
    function setShadowFrame(cx, cz, radius) {
        _shadowFrame = { cx: cx, cz: cz, radius: radius };
        if (!_sunLight) return;
        var sc = _sunLight.shadow.camera;
        var r = radius * 1.12;
        sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r;
        sc.near = 1;
        sc.far = Math.max(radius * 1.8, 900) + radius * 2.5;
        sc.updateProjectionMatrix();
        _applyCurrent();   // repark the sun over the new frame
        try { if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.markShadowsDirty) ThreeRenderer.markShadowsDirty(); } catch (e) {}
    }

    // Every material bakes tone mapping + shadow defines into its program, so
    // flipping either at runtime needs a recompile sweep.
    function _recompileSceneMaterials() {
        if (!_scene) return;
        _scene.traverse(function (o) {
            if (!o.material) return;
            if (Array.isArray(o.material)) {
                for (var i = 0; i < o.material.length; i++) o.material[i].needsUpdate = true;
            } else {
                o.material.needsUpdate = true;
            }
        });
    }

    function setShadowQuality(q) {
        if (q !== 'off' && q !== 'low' && q !== 'high') return;
        _shadowQuality = q;
        var on = (q !== 'off');
        if (_renderer) _renderer.shadowMap.enabled = on;
        if (_sunLight) {
            _sunLight.castShadow = on;
            if (on) {
                var size = SHADOW_MAP_SIZE[q] || SHADOW_MAP_SIZE.high;
                if (_sunLight.shadow.mapSize.width !== size) {
                    _sunLight.shadow.mapSize.width = _sunLight.shadow.mapSize.height = size;
                    if (_sunLight.shadow.map) { _sunLight.shadow.map.dispose(); _sunLight.shadow.map = null; }
                }
            }
        }
        _recompileSceneMaterials();
        /* the gated depth pass (§4.2) must re-render at the new size/state */
        try { if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.markShadowsDirty) ThreeRenderer.markShadowsDirty(); } catch (e) {}
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_shadows', q); } catch (e) {}
    }
    function getShadowQuality() { return _shadowQuality; }

    // Yaw (rotation.y) that faces a vertical plane's normal toward the sun —
    // used by the renderer's per-unit shadow-proxy planes so a billboard
    // sprite always casts its full silhouette regardless of the free camera.
    function getSunAzimuth() { return Math.atan2(_cur.sunDirX, _cur.sunDirZ); }

    // ── Night Mood API ───────────────────────────────────────────────────
    // 0 = the old soft night, 1 = deep moody night. Re-targets the light lerp
    // immediately when changed mid-night so the slider feels live.
    function setNightMood(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        _nightMood = Math.max(0, Math.min(1, s));
        if (_lastCycle === 'night') {
            _target = _presetToTarget(_nightPreset());
            _lerpT = 0;
        }
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_nightMood', String(_nightMood)); } catch (e) {}
    }
    function getNightMood() { return _nightMood; }

    function setFilmicTone(enabled) {
        _filmic = !!enabled;
        if (_renderer) {
            _renderer.toneMapping = _filmic ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;
            _renderer.toneMappingExposure = _cur.exposure * _exposureUser * (_filmic ? FILMIC_EXPOSURE_COMP : 1.0);
        }
        _recompileSceneMaterials();
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_filmicTone', _filmic ? '1' : '0'); } catch (e) {}
    }
    function isFilmicTone() { return _filmic; }

    // ── Tilt-shift DoF API ───────────────────────────────────────────────
    function _applyDofUniforms() {
        var on = _dofStrength > 0.01;
        var amt = DOF_MAX_BLUR_PX * _dofStrength;
        if (_dofPassH) {
            _dofPassH.enabled = on;
            _dofPassH.material.uniforms['uAmount'].value = amt;
        }
        if (_dofPassV) {
            _dofPassV.enabled = on;
            _dofPassV.material.uniforms['uAmount'].value = amt;
        }
    }
    function setDofStrength(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        _dofStrength = Math.max(0, Math.min(1, s));
        _applyDofUniforms();
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_dofStrength', String(_dofStrength)); } catch (e) {}
    }
    function getDofStrength() { return _dofStrength; }

    // Track the camera's focal point: project it to screen space and slide the
    // sharp band there (damped, so cinematic pans don't snap the blur around).
    var _dofProjVec = null;
    function _updateDofFocus(cam) {
        if (!_dofPassH || !_dofPassH.enabled || !cam) return;
        var focal = (typeof ThreeCamera !== 'undefined' && ThreeCamera.getFocalWorld)
                  ? ThreeCamera.getFocalWorld() : null;
        var target = 0.5;
        if (focal) {
            if (!_dofProjVec) _dofProjVec = new THREE.Vector3();
            _dofProjVec.set(focal.x, focal.y, focal.z).project(cam);
            if (_dofProjVec.z > -1 && _dofProjVec.z < 1) {
                target = Math.max(0.22, Math.min(0.82, _dofProjVec.y * 0.5 + 0.5));
            }
        }
        _dofFocusCur += (target - _dofFocusCur) * 0.12;
        _dofPassH.material.uniforms['uFocus'].value = _dofFocusCur;
        if (_dofPassV) _dofPassV.material.uniforms['uFocus'].value = _dofFocusCur;
    }

    var _wardLights = [];
    var _wardLightGroup = null;

    var WARD_LIGHT_COLOR_DAY   = 0xff9944;
    var WARD_LIGHT_COLOR_NIGHT = 0xff8833;
    var WARD_LIGHT_INTENSITY_DAY   = 0.6;
    var WARD_LIGHT_INTENSITY_NIGHT = 1.4;
    var WARD_LIGHT_DISTANCE   = 384;
    var WARD_LIGHT_DECAY      = 1.5;

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

            // Light only — no glow plane here. The old untextured additive quad
            // read as a glowing BOX floating on the ward; the visible halo is
            // now the renderer's radial glow sprite on the ward torch itself
            // (see _buildWardTorch in three-renderer.js).
            _wardLights.push({ light: pl, mesh: null, x: w.x, y: w.y });
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
    var LAMP_LIGHT_DISTANCE   = 300;
    var LAMP_LIGHT_DECAY      = 1.5;
    /* Real point-lights are the single most expensive thing a lamp adds —
       every extra light multiplies per-fragment shading cost across the WHOLE
       frame (and a changed light count recompiles every shader in the scene).
       The lanterns already read as lit from their self-lit glass + additive
       halo, so only a few of them need to genuinely throw light. Override via
       window.EW_LAMP_LIGHT_MAX (0 disables them entirely). */
    var LAMP_LIGHT_MAX = 3;

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

        /* Budget the REAL lights (see LAMP_LIGHT_MAX above): stride-pick a
           handful spread across the lamp line-up; every other lantern keeps
           its (free) self-lit glow but throws no light. */
        var maxLights = (typeof window !== 'undefined' && window.EW_LAMP_LIGHT_MAX != null)
            ? Math.max(0, window.EW_LAMP_LIGHT_MAX | 0) : LAMP_LIGHT_MAX;
        if (maxLights <= 0) return;
        var picked = heads;
        if (heads.length > maxLights) {
            picked = [];
            var stride = heads.length / maxLights;
            for (var pi = 0; pi < maxLights; pi++) picked.push(heads[Math.floor(pi * stride)]);
        }

        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var lightColor = isNight ? LAMP_LIGHT_COLOR_NIGHT : LAMP_LIGHT_COLOR_DAY;
        var lightIntensity = isNight ? LAMP_LIGHT_INTENSITY_NIGHT : LAMP_LIGHT_INTENSITY_DAY;

        for (var i = 0; i < picked.length; i++) {
            var hd = picked[i];

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
    var _unitLightSurfaceFn = null;
    var _unitLightTileSize = 128;

    var UNIT_LIGHT_COLOR           = 0xffe0a0;
    var UNIT_LIGHT_INTENSITY_DAY   = 0.45;
    var UNIT_LIGHT_INTENSITY_NIGHT = 1.7;
    var UNIT_LIGHT_DISTANCE        = 320;
    var UNIT_LIGHT_DECAY           = 1.6;
    var UNIT_LIGHT_HEIGHT          = 64;

    function rebuildUnitLights(units, unitSurfaceYFn, tileSize) {
        if (!_scene) return;
        var ts = tileSize || 128;
        _unitLightSurfaceFn = unitSurfaceYFn;
        _unitLightTileSize = ts;

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

        // Lights exist day AND night — day is a faint warm presence, night is the
        // real torch glow. Intensity is set per-frame in _updateUnitLights so a
        // mid-match day↔night flip doesn't need a structural rebuild to show up.
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var baseIntensity = (cycle === 'night') ? UNIT_LIGHT_INTENSITY_NIGHT : UNIT_LIGHT_INTENSITY_DAY;

        for (var i = 0; i < units.length; i++) {
            var u = units[i];
            if (u.dead || u._dying) continue;

            var surfY = unitSurfaceYFn(u);
            var pl = new THREE.PointLight(UNIT_LIGHT_COLOR, baseIntensity, UNIT_LIGHT_DISTANCE, UNIT_LIGHT_DECAY);
            pl.position.set(u.x * ts + ts / 2, surfY + UNIT_LIGHT_HEIGHT, u.y * ts + ts / 2);
            _unitLightGroup.add(pl);
            _unitLights.push({ light: pl, unit: u, unitId: u.id });
        }
    }

    function _updateUnitLights() {
        if (_unitLights.length === 0) return;
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var baseIntensity = (cycle === 'night') ? UNIT_LIGHT_INTENSITY_NIGHT : UNIT_LIGHT_INTENSITY_DAY;
        var ts = _unitLightTileSize;
        var now = performance.now() * 0.001;
        for (var i = 0; i < _unitLights.length; i++) {
            var entry = _unitLights[i];
            var u = entry.unit;
            if (u && (u.dead || u._dying)) { entry.light.intensity = 0; continue; }
            // Re-anchor to the unit's current tile each frame so the glow follows
            // moves immediately instead of waiting for the next full unit rebuild.
            if (u && _unitLightSurfaceFn) {
                entry.light.position.set(u.x * ts + ts / 2, _unitLightSurfaceFn(u) + UNIT_LIGHT_HEIGHT, u.y * ts + ts / 2);
            }
            var flicker = 1.0 + 0.06 * Math.sin(now * 3.5 + i * 2.1) + 0.03 * Math.sin(now * 7.8 + i * 4.3);
            entry.light.intensity = baseIntensity * flicker;
        }
    }

    function init(renderer, scene, w, h) {
        _renderer = renderer;
        _scene = scene;

        // Filmic (ACESFilmic) tone mapping by default: richer contrast + a real
        // highlight rolloff, which is a big part of the HD-2D look. Falls back
        // to LinearToneMapping (the old pipe: exposure multiply + clamp) via the
        // pause-menu "Filmic Tone" toggle. Either way toneMappingExposure works,
        // so the day/night exposure grade + Brightness slider are unaffected.
        renderer.toneMapping = _filmic ? THREE.ACESFilmicToneMapping : THREE.LinearToneMapping;
        renderer.toneMappingExposure = _filmic ? FILMIC_EXPOSURE_COMP : 1.0;
        renderer.setClearColor(0x000000, 0);

        // Sun shadows (the depth pass is skipped entirely at quality 'off').
        // PCFSoft = the soft-edged look; meshes opt in via castShadow/
        // receiveShadow flags set by the renderer after each rebuild.
        renderer.shadowMap.enabled = (_shadowQuality !== 'off');
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

        // Tilt-shift DoF — after bloom (so the glow melts into the blur), before
        // FXAA/cinematic/retro. Two passes of the same separable gaussian.
        _dofPassH = new THREE.ShaderPass(_TiltShiftShader);
        _dofPassH.material.uniforms['uResolution'].value.set(w, h);
        _dofPassH.material.uniforms['uDir'].value.set(1, 0);
        _composer.addPass(_dofPassH);
        _dofPassV = new THREE.ShaderPass(_TiltShiftShader);
        _dofPassV.material.uniforms['uResolution'].value.set(w, h);
        _dofPassV.material.uniforms['uDir'].value.set(0, 1);
        _composer.addPass(_dofPassV);
        _applyDofUniforms();

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
        _applyCinematicUniforms();
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
        console.log('[ThreePost] initialized — bloom + tilt-shift DoF + FXAA + cinematic filter + retro filter + sun shadows (' + _shadowQuality + ') + filmic tone (' + (_filmic ? 'on' : 'off') + ')');
    }

    function render(cam) {

        syncLighting();
        _updateWardLights();
        _updateStreetLampLights();
        _updateLavaLights();
        _updateUnitLights();

        // Night grade — per-frame: the eased night factor × the Night Mood
        // slider. The cinematic pass must run whenever the grade is live,
        // even with CRT + vignette both off.
        // Dramatic dim rides ON TOP of the night grade (max of the two, so a
        // spell beat can't make an actual night brighter) and pulls exposure
        // down beneath it — see dramaDim().
        var _nowMs = performance.now();
        var _dim = _dramaCurrent(_nowMs);
        // ── spell grade beat (spotlight / trip / aberration / warp) ──
        var _gk = _gradeCurrent(_nowMs);
        var _kick = _gradeKickCurrent(_nowMs);
        var _spotOn = false;
        if (_cinematicPass) {
            var _gu = _cinematicPass.material.uniforms;
            if (_gk > 0.001 || _kick > 0.01) {
                var _dt = Math.min(0.1, Math.max(0, (_nowMs - _grade.lastT) / 1000));
                _grade.lastT = _nowMs;
                _grade.hue += _dt * _grade.hueRate * _gk;
                if (_grade.hue > 64) _grade.hue -= 64;
                var _spotDim = _grade.dim * _gk;
                _spotOn = _spotDim > 0.001 && _grade.focus.length > 0;
                var _w = _gu['uResolution'].value.x, _h = _gu['uResolution'].value.y;
                _writeSpotUniform(_gu, 'uSpotA', _grade.focus[0], cam, _w, _h);
                _writeSpotUniform(_gu, 'uSpotB', _grade.focus[1] || _grade.focus[0], cam, _w, _h);
                _gu['uSpotDim'].value      = _spotOn ? _spotDim : 0.0;
                _gu['uSpotSoft'].value     = _grade.spotSoft;
                _gu['uSpotLift'].value     = _grade.spotLift;
                _gu['uTrip'].value         = _grade.trip * _gk;
                _gu['uHue'].value          = _grade.hue;
                _gu['uWarp'].value         = _grade.warp * _gk;
                _gu['uChromaRadial'].value = _grade.chroma * _gk + _kick;
                _gu['uGradeTint'].value.set(_grade.tint[0], _grade.tint[1], _grade.tint[2]);
                _gu['uGradeTintAmt'].value = _grade.tintAmt * _gk;
            } else if (_gu['uSpotDim'].value !== 0.0 || _gu['uTrip'].value !== 0.0
                       || _gu['uChromaRadial'].value !== 0.0 || _gu['uWarp'].value !== 0.0
                       || _gu['uGradeTintAmt'].value !== 0.0) {
                _gu['uSpotDim'].value = 0.0;
                _gu['uTrip'].value = 0.0;
                _gu['uWarp'].value = 0.0;
                _gu['uChromaRadial'].value = 0.0;
                _gu['uGradeTintAmt'].value = 0.0;
                _grade.lastT = _nowMs;
            }
        }
        if (_cinematicPass) {
            var _ng = _nightF * _nightMood * 0.85;
            if (_dim > 0) _ng = Math.max(_ng, _dim * 0.92);
            // A spotlit beat carries its own darkness in the grade (the pools
            // lift out of it), so it feeds the night grade too — that's what
            // drains and crushes the world OUTSIDE the pools.
            if (_spotOn) _ng = Math.max(_ng, _grade.dim * _gk * 0.85);
            _cinematicPass.material.uniforms['uNightGrade'].value = _ng;
            _cinematicPass.enabled = !!(_cin.crt || _cin.vignette || _ng > 0.001
                || _gk > 0.001 || _kick > 0.01);
        }
        // Exposure is pulled down for a plain dramaDim, but NOT while a
        // spotlight beat is running: exposure is global, and dimming the
        // whole render would take the caster and target down with it.
        if (_renderer && _dim > 0 && !_spotOn) {
            // Written AFTER syncLighting() (which owns the steady value) so
            // the beat wins for its duration and restores itself on release.
            _renderer.toneMappingExposure =
                _cur.exposure * _exposureUser * (_filmic ? FILMIC_EXPOSURE_COMP : 1.0)
                * (1 - 0.5 * _dim);
        }

        // Impact flash — decaying bloom kick over the steady user strength.
        if (_bloomPass && _bloomPass.enabled) {
            var _pulse = _bloomPulseCurrent(performance.now());
            _bloomPass.strength = Math.max(_cur.bloomStr, BLOOM_USER_STRENGTH) + _pulse;
        }

        if (_cinematicPass && _cinematicPass.enabled) {
            _cinematicPass.material.uniforms['uTime'].value = performance.now() * 0.001;
        }

        if (_retroPass && _retroPass.enabled) {
            _retroPass.material.uniforms['uTime'].value = performance.now() * 0.001;
            // Models-only pixelation needs its silhouette mask refreshed before
            // the composer runs. Only when the snap is actually doing something.
            var _wantMask = (_retro.pixelScope !== 'screen') && _retro.pixelSize > 1.0 && cam;
            var _maskOk = _wantMask ? _renderPixelMask(cam) : false;
            _retroPass.material.uniforms['tMask'].value = _maskOk ? _maskRT.texture : null;
            _retroPass.material.uniforms['uMaskMode'].value = _maskOk ? 1.0 : 0.0;
        }

        if (!_ready || !_composer || !cam) {

            if (_renderer && _scene && cam) _renderer.render(_scene, cam);
            return;
        }

        _updateDofFocus(cam);

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
        if (_dofPassH) _dofPassH.material.uniforms['uResolution'].value.set(w, h);
        if (_dofPassV) _dofPassV.material.uniforms['uResolution'].value.set(w, h);
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
        // Include the filmic compensation — omitting it made the Brightness
        // slider visibly darken the scene until the next day/night ease.
        if (_renderer) _renderer.toneMappingExposure = _cur.exposure * _exposureUser * (_filmic ? FILMIC_EXPOSURE_COMP : 1.0);
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

        if (_sunLight && _scene) {
            if (_sunLight.target) _scene.remove(_sunLight.target);
            if (_sunLight.shadow && _sunLight.shadow.map) { _sunLight.shadow.map.dispose(); _sunLight.shadow.map = null; }
            _scene.remove(_sunLight);
        }
        if (_hemiLight && _scene) _scene.remove(_hemiLight);
        if (_ambientLight && _scene) _scene.remove(_ambientLight);
        _sunLight = null; _hemiLight = null; _ambientLight = null;
        _lastCycle = null;

        if (_composer) {

            if (_composer.renderTarget1) _composer.renderTarget1.dispose();
            if (_composer.renderTarget2) _composer.renderTarget2.dispose();
        }
        if (_maskRT) { _maskRT.dispose(); _maskRT = null; _maskW = _maskH = 0; }
        if (_maskMatSkin) { _maskMatSkin.dispose(); _maskMatSkin = null; }
        if (_maskMatStatic) { _maskMatStatic.dispose(); _maskMatStatic = null; }
        if (_retroPass) {
            _retroPass.material.uniforms['tMask'].value = null;
            _retroPass.material.uniforms['uMaskMode'].value = 0.0;
        }
        _maskScanAt = 0;

        _composer = null;
        _bloomPass = null;
        _fxaaPass = null;
        _dofPassH = null;
        _dofPassV = null;
        _shadowFrame = null;
        _renderer = null;
        _scene = null;
        _ready = false;
    }

    // Push the current _cin state into the shader uniforms and decide whether the
    // pass runs at all. uCrtAmount/uVignetteAmount are the master gates: 0 fully
    // bypasses that effect, so the CRT look and the vignette are truly separable.
    function _applyCinematicUniforms() {
        if (!_cinematicPass) return;
        var u = _cinematicPass.material.uniforms;
        u['uScanlineAlpha'].value  = _cin.scanline;
        u['uChromaShift'].value    = _cin.chroma;
        u['uCurvature'].value      = _cin.curvature;
        u['uVignetteSize'].value   = _cin.vigSize;
        u['uVignetteSoft'].value   = _cin.vigSoft;
        u['uVignetteAmount'].value = _cin.vignette ? _cin.vigAmount : 0.0;
        u['uCrtAmount'].value      = _cin.crt ? 1.0 : 0.0;
        _cinematicPass.enabled = !!(_cin.crt || _cin.vignette);
    }

    // CRT look = scanlines + chromatic aberration + barrel curvature + flicker.
    // The vignette is now a SEPARATE toggle (setVignetteEnabled).
    function setCinematicFilter(enabled) {
        _cin.crt = !!enabled;
        _applyCinematicUniforms();
        _saveCinematic();
    }
    function isCinematicFilterEnabled() { return _cin.crt; }

    function setVignetteEnabled(enabled) {
        _cin.vignette = !!enabled;
        _applyCinematicUniforms();
        _saveCinematic();
    }
    function isVignetteEnabled() { return _cin.vignette; }

    // Tunable keys: scanline, chroma, curvature, vigAmount, vigSize, vigSoft
    function setCinematicParam(key, value) {
        var v = parseFloat(value);
        if (isNaN(v)) return;
        if (!(key in _cin) || typeof _cin[key] !== 'number') return;
        _cin[key] = v;
        _applyCinematicUniforms();
        _saveCinematic();
    }
    function getCinematicParam(key) { return _cin[key]; }
    function getCinematicState() {
        var out = {};
        for (var k in _cin) out[k] = _cin[k];
        return out;
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
    /* 'models' = pixelate only the 3D GLB models (units + Meshy props), leaving
       the pixel-art terrain sprites untouched. 'screen' = the whole frame. */
    function setRetroPixelScope(scope) {
        _retro.pixelScope = (scope === 'screen') ? 'screen' : 'models';
        if (_retroPass && _retro.pixelScope === 'screen') {
            _retroPass.material.uniforms['tMask'].value = null;
            _retroPass.material.uniforms['uMaskMode'].value = 0.0;
        }
        _saveRetro();
    }
    function getRetroPixelScope() { return _retro.pixelScope; }
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
    // Horizon-haze clear altitude: 0 = fog dissolves at the board horizon (z=0),
    // higher lets it climb up into the sky. See _retro.fogHorizon.
    function setRetroFogHorizon(value) {
        var v = parseFloat(value);
        if (isNaN(v)) return;
        _retro.fogHorizon = Math.max(0, v);
        _applySceneFog();
        _saveRetro();
    }
    function getRetroFogHorizon() { return _retro.fogHorizon; }

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
        setShadowFrame: setShadowFrame,
        isLightingEasing: isLightingEasing,
        setShadowQuality: setShadowQuality,
        getShadowQuality: getShadowQuality,
        getSunAzimuth: getSunAzimuth,
        setFilmicTone: setFilmicTone,
        isFilmicTone: isFilmicTone,
        setNightMood: setNightMood,
        getNightMood: getNightMood,
        bloomPulse: bloomPulse,
        dramaDim: dramaDim,
        dramaClear: dramaClear,
        getDramaDim: getDramaDim,
        spellGrade: spellGrade,
        spellGradeFocus: spellGradeFocus,
        spellGradeKick: spellGradeKick,
        spellGradeClear: spellGradeClear,
        isSpellGradeActive: isSpellGradeActive,
        setImpactFx: setImpactFx,
        getImpactFx: getImpactFx,
        getImpactFxMax: getImpactFxMax,
        setDofStrength: setDofStrength,
        getDofStrength: getDofStrength,
        rebuildWardLights: rebuildWardLights,
        rebuildUnitLights: rebuildUnitLights,
        rebuildLavaLights: rebuildLavaLights,
        rebuildStreetLampLights: rebuildStreetLampLights,
        setCinematicFilter: setCinematicFilter,
        isCinematicFilterEnabled: isCinematicFilterEnabled,
        setVignetteEnabled: setVignetteEnabled,
        isVignetteEnabled: isVignetteEnabled,
        setCinematicParam: setCinematicParam,
        getCinematicParam: getCinematicParam,
        getCinematicState: getCinematicState,
        setRetroFilter: setRetroFilter,
        isRetroFilterEnabled: isRetroFilterEnabled,
        setRetroPreset: setRetroPreset,
        getRetroPreset: getRetroPreset,
        getRetroPresets: getRetroPresets,
        setRetroParam: setRetroParam,
        getRetroParam: getRetroParam,
        setRetroPixelScope: setRetroPixelScope,
        getRetroPixelScope: getRetroPixelScope,
        getRetroState: getRetroState,
        setRetroFog: setRetroFog,
        isRetroFogEnabled: isRetroFogEnabled,
        setRetroFogDensity: setRetroFogDensity,
        getRetroFogDensity: getRetroFogDensity,
        setRetroFogHorizon: setRetroFogHorizon,
        getRetroFogHorizon: getRetroFogHorizon,
        isReady: isReady,
        dispose: dispose
    };
})();

window.ThreePost = ThreePost;
