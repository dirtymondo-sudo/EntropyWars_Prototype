const ThreeVFX = (function () {
    'use strict';

    var MAX_PARTICLES = 512;
    var MAX_WORLD_QUADS = 256;
    var MAX_QUAD_BILLBOARDS = 256;
    var MAX_BLOOD_GLOBS = 64;

    var _scene = null;

    var _spritePool = [];

    var _worldMeshPool = [];
    var _quadMeshPool  = [];
    var _globPool      = [];

    var _particles = [];

    var _initialized = false;
    var _aliveCount = 0;
    var _zoneAliveCount = 0;
    var _debugSpawns = 10;

    var _tmpQuat = null;
    var _tmpQuat2 = null;
    var _tmpEuler = null;
    var _tmpVec = null;
    var _upVec = null;

    var _spriteMap = {

        'ember':             { r: 1.00, g: 0.78, b: 0.31, blend: 'add' },
        'flash':             { r: 1.00, g: 1.00, b: 1.00, blend: 'add' },
        'flame':             { r: 1.00, g: 0.63, b: 0.16, blend: 'add' },
        'flame-hot':         { r: 1.00, g: 0.94, b: 0.78, blend: 'add' },
        'fire-glow':         { r: 1.00, g: 0.47, b: 0.08, blend: 'add' },
        'meteor':            { r: 1.00, g: 0.39, b: 0.12, blend: 'add' },
        'explosion-orange':  { r: 1.00, g: 0.71, b: 0.24, blend: 'add' },
        'muzzle-flash':      { r: 1.00, g: 0.92, b: 0.55, blend: 'add' },

        'holy-pillar':       { r: 1.00, g: 0.94, b: 0.71, blend: 'add' },
        'divine-sparkle':    { r: 1.00, g: 0.98, b: 0.78, blend: 'add' },
        'holy-light':        { r: 1.00, g: 1.00, b: 0.86, blend: 'add' },
        'heal-cross':        { r: 0.39, g: 1.00, b: 0.55, blend: 'add' },
        'heal-glow':         { r: 0.50, g: 1.00, b: 0.65, blend: 'add' },

        'plasma':            { r: 0.39, g: 0.71, b: 1.00, blend: 'add' },
        'spark-elec':        { r: 0.55, g: 0.86, b: 1.00, blend: 'add' },
        'emp-arc':           { r: 0.31, g: 0.63, b: 1.00, blend: 'add' },
        'lightning':         { r: 0.78, g: 0.90, b: 1.00, blend: 'add' },
        'spark-blue':        { r: 0.47, g: 0.78, b: 1.00, blend: 'add' },
        'spark-pink':        { r: 1.00, g: 0.47, b: 0.78, blend: 'add' },
        'steel-spark':       { r: 1.00, g: 0.96, b: 0.78, blend: 'add' },
        'shield-blue':       { r: 0.40, g: 0.70, b: 1.00, blend: 'add' },

        'dark-flame':        { r: 0.31, g: 0.12, b: 0.47, blend: 'add' },
        'psi-pulse':         { r: 0.78, g: 0.39, b: 1.00, blend: 'add' },
        'void-mist':         { r: 0.55, g: 0.24, b: 0.71, blend: 'add' },

        'poison-mist':       { r: 0.31, g: 0.78, b: 0.24, blend: 'add' },
        'poison-bubble':     { r: 0.47, g: 0.78, b: 0.24, blend: 'add' },
        'acid-green':        { r: 0.86, g: 1.00, b: 0.31, blend: 'add' },
        'vine-green':        { r: 0.47, g: 0.90, b: 0.31, blend: 'add' },

        'ice-shard':         { r: 0.71, g: 0.90, b: 1.00, blend: 'add' },
        'frost-crystal':     { r: 0.78, g: 0.94, b: 1.00, blend: 'add' },
        'frost-mist':        { r: 0.59, g: 0.78, b: 0.94, blend: 'add' },
        'water-splash':      { r: 0.31, g: 0.63, b: 0.86, blend: 'add' },

        'heat-ray':          { r: 1.00, g: 0.47, b: 0.16, blend: 'add' },
        'laser-pink':        { r: 1.00, g: 0.47, b: 0.86, blend: 'add' },
        'laser-red':         { r: 1.00, g: 0.24, b: 0.24, blend: 'add' },

        'ufo-glow':          { r: 0.39, g: 1.00, b: 0.55, blend: 'add' },
        'ring-1':            { r: 1.00, g: 0.80, b: 0.40, blend: 'add' },
        'ring-2':            { r: 0.80, g: 0.60, b: 1.00, blend: 'add' },
        'ring-3':            { r: 0.40, g: 0.80, b: 1.00, blend: 'add' },
        'ring-4':            { r: 1.00, g: 0.40, b: 0.40, blend: 'add' },
        'ring-5':            { r: 0.40, g: 1.00, b: 0.40, blend: 'add' },
        'ring-6':            { r: 1.00, g: 1.00, b: 0.40, blend: 'add' },
        'ring-7':            { r: 1.00, g: 0.60, b: 0.80, blend: 'add' },

        'smoke':             { r: 0.27, g: 0.24, b: 0.22, blend: 'nrm' },
        'smoke-soft':        { r: 0.62, g: 0.59, b: 0.55, blend: 'nrm' },
        'scorch':            { r: 0.12, g: 0.08, b: 0.04, blend: 'nrm' },
        'dust-puff':         { r: 0.63, g: 0.55, b: 0.43, blend: 'nrm' },
        'debris':            { r: 0.47, g: 0.39, b: 0.27, blend: 'nrm' },
        'rock-debris':       { r: 0.67, g: 0.55, b: 0.39, blend: 'nrm' },
        'sand-particle':     { r: 0.86, g: 0.75, b: 0.51, blend: 'nrm' },
        'blood-fleck':       { r: 0.88, g: 0.07, b: 0.07, blend: 'nrm' },
        'blood-splat':       { r: 0.66, g: 0.04, b: 0.04, blend: 'nrm' },
        'blood-mist':        { r: 0.55, g: 0.06, b: 0.06, blend: 'nrm' },
        'blood-drop':        { r: 0.78, g: 0.05, b: 0.05, blend: 'nrm' },
        'blood-streak':      { r: 0.78, g: 0.05, b: 0.05, blend: 'nrm' },
        'blood-pool':        { r: 0.40, g: 0.02, b: 0.02, blend: 'nrm' },
        'bubble':            { r: 0.55, g: 0.78, b: 1.00, blend: 'nrm' },
        'shadow-wisp':       { r: 0.24, g: 0.16, b: 0.31, blend: 'nrm' },
        'snowflake':         { r: 0.90, g: 0.96, b: 1.00, blend: 'nrm' },
        'leaf':              { r: 0.24, g: 0.55, b: 0.16, blend: 'nrm' },
        'petal':             { r: 1.00, g: 0.71, b: 0.78, blend: 'nrm' },
        'mud-chunk':         { r: 0.35, g: 0.27, b: 0.16, blend: 'nrm' },

        'f22':               { r: 0.55, g: 0.55, b: 0.55, blend: 'nrm' },
        'missile':           { r: 0.70, g: 0.70, b: 0.60, blend: 'nrm' },
        'nuclear-missile':   { r: 0.80, g: 0.80, b: 0.70, blend: 'nrm' },
        'ufo':               { r: 0.55, g: 0.80, b: 0.55, blend: 'nrm' },
        'bat-1':             { r: 0.30, g: 0.20, b: 0.25, blend: 'nrm' },
        'bat-2':             { r: 0.30, g: 0.20, b: 0.25, blend: 'nrm' },
        'bat-3':             { r: 0.30, g: 0.20, b: 0.25, blend: 'nrm' },
        'bat-4':             { r: 0.30, g: 0.20, b: 0.25, blend: 'nrm' },
        'spider-1':          { r: 0.30, g: 0.20, b: 0.30, blend: 'nrm' },
        'spiderweb-1':       { r: 0.70, g: 0.70, b: 0.85, blend: 'nrm' },
        'inkblot':           { r: 0.10, g: 0.06, b: 0.14, blend: 'nrm' },

        /* procedural water splash frames (see _waveFrameDefs) — additive +
           cyan tint so the bright crests catch the bloom pass */
        'wave-1':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },
        'wave-2':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },
        'wave-3':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },
        'wave-4':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },
        'wave-5':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },
        'wave-6':            { r: 0.60, g: 0.88, b: 1.00, blend: 'add' },

        /* tesseract storm shapes — additive so the falling holo-shapes glow
           (rain drop/splash materials read this table via _TESS_SPRITES too) */
        'tess-tri':          { r: 0.55, g: 1.00, b: 0.86, blend: 'add' },
        'tess-circle':       { r: 0.55, g: 1.00, b: 0.86, blend: 'add' },
        'tess-square':       { r: 0.55, g: 1.00, b: 0.86, blend: 'add' },
        'tess-splash':       { r: 0.75, g: 1.00, b: 0.92, blend: 'add' },

        /* gun lock-on reticle — colours are baked into the drawn texture
           (white core + red glow), so the material multiplier stays white */
        'crosshair':         { r: 1.00, g: 1.00, b: 1.00, blend: 'add' },

        'target-ring':       { r: 1.00, g: 0.30, b: 0.30, blend: 'world' },
        'target-ring-gold':  { r: 1.00, g: 0.85, b: 0.30, blend: 'world' },
        'target-ring-blue':  { r: 0.30, g: 0.60, b: 1.00, blend: 'world' },
        'target-ring-green': { r: 0.30, g: 1.00, b: 0.40, blend: 'world' },
        'shockwave':         { r: 1.00, g: 0.90, b: 0.70, blend: 'world' },
        'halo-ring':         { r: 1.00, g: 0.95, b: 0.70, blend: 'world' },
        'stun-ring':         { r: 1.00, g: 1.00, b: 0.40, blend: 'world' },
    };

    function _spriteColor(key) {
        return _spriteMap[key] || { r: 1.0, g: 1.0, b: 1.0, blend: 'add' };
    }

    // Tint normalization: accepts 0xRRGGBB, '#rrggbb' or {r,g,b} (0–1) and
    // returns an {r,g,b} multiplier whose brightest channel is ~1.12. Raw
    // multiplication by a colour always DARKENS (every channel <= 1), which
    // would make tinted particles read as dull rather than coloured — the
    // renormalize keeps the particle just as bright, only hued.
    var _tintCache = {};
    function _normTint(t) {
        if (t == null) return null;
        var key = (typeof t === 'object') ? null : String(t);
        if (key && _tintCache[key]) return _tintCache[key];
        var r, g, b;
        if (typeof t === 'number') {
            r = ((t >> 16) & 255) / 255; g = ((t >> 8) & 255) / 255; b = (t & 255) / 255;
        } else if (typeof t === 'string') {
            var h = t.charAt(0) === '#' ? t.slice(1) : t;
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            var n = parseInt(h, 16);
            if (isNaN(n)) return null;
            r = ((n >> 16) & 255) / 255; g = ((n >> 8) & 255) / 255; b = (n & 255) / 255;
        } else {
            r = t.r != null ? t.r : 1; g = t.g != null ? t.g : 1; b = t.b != null ? t.b : 1;
        }
        var mx = Math.max(r, g, b);
        if (mx > 0.001) { var k = 1.12 / mx; r *= k; g *= k; b *= k; }
        var out = { r: r, g: g, b: b };
        if (key) _tintCache[key] = out;
        return out;
    }

    var _ringSprites = { 'target-ring': 1, 'target-ring-gold': 1, 'target-ring-blue': 1,
                         'target-ring-green': 1, 'shockwave': 1, 'halo-ring': 1, 'stun-ring': 1 };

    /* sprites that read better tumbling than locked upright (see spawn) */
    var _AUTO_TUMBLE = {
        'smoke': 1, 'smoke-soft': 1, 'dust-puff': 1, 'debris': 1, 'rock-debris': 1,
        'mud-chunk': 1, 'explosion-orange': 1, 'void-mist': 1, 'poison-mist': 1,
        'shadow-wisp': 1, 'blood-splat': 1, 'leaf': 1, 'petal': 1, 'snowflake': 1,
        'ice-shard': 1, 'frost-crystal': 1,
    };

    var _WAVE_FRAMES = ['wave-1', 'wave-2', 'wave-3', 'wave-4', 'wave-5', 'wave-6'];
    var _WAVE_FRAME_MS = 120;

    var ATLAS_CELL = 64;
    var ATLAS_COLS = 10;
    var ATLAS_SIZE = ATLAS_CELL * ATLAS_COLS;

    var _atlasTexture = null;
    var _atlasCanvas = null;
    var _uvLookup = {};
    var _atlasReady = false;
    var _pendingImageCount = 0;

    var _spriteTextures = {};

    var _hiResTextures = {};

    var _gradientDefs = {
        'ember': { type: 'radial', stops: [
            [0,255,252,220,1],[0.30,255,200,80,1],[0.55,255,120,30,0.85],[0.75,200,50,10,0.4],[0.90,120,20,0,0]]},
        'flash': { type: 'radial', stops: [
            [0,255,255,255,1],[0.22,255,240,180,0.95],[0.48,255,180,60,0.7],[0.68,255,100,20,0.35],[0.85,180,40,10,0]]},
        'smoke': { type: 'radial', stops: [
            [0,70,60,55,0.78],[0.35,50,42,38,0.55],[0.65,30,26,24,0.25],[0.80,20,18,16,0]]},
        /* lighter, softer-falloff smoke used by the Smoke Screen zone bank —
           overlapping puffs read as one rolling grey cloud instead of a pile
           of dark blobs (the classic 'smoke' stays for impact/burn wisps) */
        'smoke-soft': { type: 'radial', stops: [
            [0,172,164,154,0.55],[0.30,148,140,131,0.42],[0.55,118,112,105,0.24],[0.78,88,84,79,0.09],[0.92,70,67,63,0]]},
        'scorch': { type: 'radial', stops: [
            [0,20,10,5,0.9],[0.30,35,18,8,0.8],[0.55,55,28,12,0.5],[0.75,80,40,18,0.18],[0.90,100,50,20,0]]},
        'flame': { type: 'linear', dir: 'up', stops: [
            [0,255,60,20,0],[0.06,255,90,30,1],[0.30,255,160,60,1],[0.60,255,220,130,1],[0.85,255,250,220,0.92],[1,255,255,255,0]]},
        'flame-hot': { type: 'linear', dir: 'up', stops: [
            [0,255,130,40,0],[0.08,255,200,90,1],[0.30,255,240,170,1],[0.55,255,252,220,1],[0.80,255,255,245,1],[1,255,255,255,0]]},
        'fire-glow': { type: 'radial', stops: [
            [0,255,220,130,0.9],[0.28,255,160,60,0.75],[0.55,255,90,25,0.45],[0.78,200,50,10,0.15],[0.92,120,30,0,0]]},
        'shockwave': { type: 'radial', stops: [
            [0,255,240,180,0],[0.38,255,200,80,0],[0.50,255,230,140,1],[0.56,255,180,60,0.65],[0.70,255,120,30,0]]},
        'meteor': { type: 'radial-off', cx: 0.4, cy: 0.4, stops: [
            [0,255,255,230,1],[0.18,255,220,120,1],[0.45,255,130,40,1],[0.70,200,60,10,0.85],[0.90,80,20,5,0.35],[1,0,0,0,0]]},
        'target-ring': { type: 'radial', stops: [
            [0,255,80,30,0],[0.40,255,80,30,0],[0.47,255,100,40,0.7],[0.50,255,60,20,0.9],[0.53,255,100,40,0.7],[0.60,255,80,30,0]]},
        'holy-pillar': { type: 'linear', dir: 'right', stops: [
            [0,255,240,180,0],[0.18,255,250,210,0.45],[0.38,255,255,230,0.85],[0.50,255,255,255,1],[0.62,255,255,230,0.85],[0.82,255,250,210,0.45],[1,255,240,180,0]]},
        'divine-sparkle': { type: 'radial', stops: [
            [0,255,255,255,1],[0.25,255,250,220,0.95],[0.50,255,220,120,0.75],[0.72,220,230,255,0.4],[0.90,180,200,255,0]]},
        'halo-ring': { type: 'radial', stops: [
            [0,255,220,100,0],[0.38,255,220,100,0],[0.44,255,240,170,0.65],[0.50,255,215,80,0.95],[0.56,255,240,170,0.65],[0.62,255,220,100,0]]},
        'target-ring-gold': { type: 'radial', stops: [
            [0,255,220,100,0],[0.40,255,220,100,0],[0.47,255,235,150,0.7],[0.50,255,205,60,0.95],[0.53,255,235,150,0.7],[0.60,255,220,100,0]]},
        'holy-light': { type: 'radial', stops: [
            [0,255,255,255,1],[0.30,255,245,200,0.95],[0.55,255,220,120,0.7],[0.75,220,190,80,0.3],[0.90,180,150,60,0]]},
        'plasma': { type: 'linear', dir: 'right', stops: [
            [0,120,200,255,0],[0.18,180,230,255,0.55],[0.38,230,250,200,0.9],[0.50,255,255,220,1],[0.62,230,250,200,0.9],[0.82,180,230,255,0.55],[1,120,200,255,0]]},
        'spark-elec': { type: 'radial', stops: [
            [0,255,255,255,1],[0.22,220,240,255,0.95],[0.48,120,200,255,0.85],[0.70,80,140,230,0.45],[0.90,40,80,180,0]]},
        'emp-arc': { type: 'linear', dir: 'right', stops: [
            [0,120,200,255,0],[0.20,180,230,255,0.8],[0.50,255,255,255,1],[0.80,180,230,255,0.8],[1,120,200,255,0]]},
        'target-ring-blue': { type: 'radial', stops: [
            [0,80,180,255,0],[0.40,80,180,255,0],[0.47,160,220,255,0.7],[0.50,40,150,255,0.95],[0.53,160,220,255,0.7],[0.60,80,180,255,0]]},
        'explosion-orange': { type: 'radial', stops: [
            [0,255,255,240,1],[0.18,255,240,160,1],[0.42,255,180,60,1],[0.65,255,110,30,0.95],[0.85,180,50,10,0.45],[1,80,20,5,0]]},
        'dust-puff': { type: 'radial', stops: [
            [0,190,175,150,0.7],[0.35,160,145,120,0.55],[0.65,120,105,85,0.3],[0.85,80,70,60,0]]},
        'debris': { type: 'radial-off', cx: 0.4, cy: 0.4, stops: [
            [0,120,100,80,1],[0.40,80,65,50,1],[0.70,50,40,30,0.85],[1,30,22,16,0]]},
        'dark-flame': { type: 'radial-off', cx: 0.5, cy: 1.0, stops: [
            [0,255,180,80,1],[0.22,220,80,30,1],[0.50,150,30,20,0.95],[0.75,80,10,15,0.65],[0.90,30,5,10,0.25],[1,10,0,5,0]]},
        'heal-cross': { type: 'radial', stops: [
            [0,180,255,200,1],[0.30,120,230,150,0.95],[0.55,255,230,130,0.7],[0.75,180,180,80,0.3],[0.90,80,100,40,0]]},
        'psi-pulse': { type: 'radial', stops: [
            [0,255,255,255,1],[0.22,180,255,220,0.95],[0.45,120,255,180,0.85],[0.70,220,80,220,0.5],[0.90,160,40,180,0]]},
        'target-ring-green': { type: 'radial', stops: [
            [0,80,255,180,0],[0.40,80,255,180,0],[0.47,160,255,200,0.7],[0.50,40,230,140,0.95],[0.53,160,255,200,0.7],[0.60,80,255,180,0]]},
        'lightning': { type: 'linear', dir: 'down', stops: [
            [0,120,200,255,0],[0.18,220,240,255,0.85],[0.50,255,255,255,1],[0.82,220,240,255,0.85],[1,120,200,255,0]]},
        'spark-blue': { type: 'radial', stops: [
            [0,255,255,255,1],[0.25,200,230,255,0.95],[0.50,80,180,255,0.85],[0.70,30,120,230,0.45],[0.90,10,60,160,0]]},
        'spark-pink': { type: 'radial', stops: [
            [0,255,255,255,1],[0.25,255,200,230,0.95],[0.50,255,80,180,0.85],[0.70,230,30,120,0.45],[0.90,160,10,60,0]]},
        'stun-ring': { type: 'radial', stops: [
            [0,180,230,255,0],[0.38,180,230,255,0],[0.44,220,245,255,0.85],[0.50,255,255,255,1],[0.56,220,245,255,0.85],[0.62,180,230,255,0],[1,180,230,255,0]]},
        'blood-fleck': { type: 'radial-off', cx: 0.45, cy: 0.45, stops: [
            [0,255,80,60,1],[0.35,200,30,30,0.95],[0.65,130,10,10,0.85],[1,70,5,5,0]]},
        'blood-splat': { type: 'radial', stops: [
            [0,160,20,20,0.95],[0.25,130,12,12,0.9],[0.50,100,8,8,0.7],[0.75,60,4,4,0.3],[1,30,2,2,0]]},
        'blood-mist': { type: 'radial', stops: [
            [0,140,30,30,0.65],[0.30,110,20,20,0.5],[0.55,80,12,12,0.3],[0.80,50,6,6,0.1],[1,30,3,3,0]]},
        'blood-drop': { type: 'radial-off', cx: 0.40, cy: 0.36, stops: [
            [0,235,80,60,1],[0.28,195,25,25,1],[0.58,120,10,10,0.95],[0.84,70,4,4,0.6],[1,40,2,2,0]]},
        'blood-streak': { type: 'linear', dir: 'up', stops: [
            [0,190,35,30,0],[0.20,175,20,20,0.7],[0.50,150,12,12,0.95],[0.80,110,7,7,0.85],[1,70,4,4,0.35]]},
        'blood-pool': { type: 'radial', stops: [
            [0,95,7,7,0.95],[0.30,72,4,4,0.92],[0.55,50,3,3,0.8],[0.78,30,2,2,0.42],[1,15,1,1,0]]},
        'steel-spark': { type: 'linear', dir: 'right', stops: [
            [0,255,230,140,0],[0.25,255,245,200,0.9],[0.50,255,255,255,1],[0.75,255,245,200,0.9],[1,255,230,140,0]]},
        'muzzle-flash': { type: 'radial', stops: [
            [0,255,255,255,1],[0.18,255,250,200,1],[0.38,255,230,120,0.85],[0.60,255,180,70,0.45],[0.82,200,100,30,0]]},
        'void-mist': { type: 'radial', stops: [
            [0,180,100,220,0.7],[0.30,140,60,180,0.55],[0.60,90,30,130,0.35],[0.80,40,10,60,0.15],[1,10,0,20,0]]},
        'ice-shard': { type: 'radial', stops: [
            [0,255,255,255,1],[0.25,200,240,255,0.95],[0.50,100,200,240,0.8],[0.70,40,140,210,0.4],[0.90,10,80,160,0]]},
        'water-splash': { type: 'radial', stops: [
            [0,220,240,255,1],[0.30,80,160,220,0.85],[0.55,30,100,180,0.6],[0.75,10,60,130,0.3],[1,5,30,80,0]]},
        'rock-debris': { type: 'radial', stops: [
            [0,220,200,170,1],[0.30,170,140,100,0.9],[0.55,120,90,60,0.7],[0.75,80,60,40,0.35],[1,50,30,15,0]]},
        'sand-particle': { type: 'radial', stops: [
            [0,255,240,200,1],[0.30,220,190,130,0.9],[0.55,180,150,90,0.65],[0.75,140,110,60,0.3],[1,80,60,30,0]]},
        'poison-bubble': { type: 'radial', stops: [
            [0,180,255,100,1],[0.30,120,200,60,0.85],[0.55,80,160,40,0.6],[0.75,50,100,30,0.3],[1,20,60,10,0]]},
        'frost-mist': { type: 'radial', stops: [
            [0,200,230,255,0.6],[0.30,150,200,240,0.45],[0.60,100,170,220,0.3],[0.80,60,130,190,0.12],[1,20,80,140,0]]},
        'acid-green': { type: 'linear', dir: 'right', stops: [
            [0,140,220,80,0],[0.18,180,240,100,0.55],[0.38,220,255,80,0.9],[0.50,240,255,200,1],[0.62,220,255,80,0.9],[0.82,180,240,100,0.55],[1,140,220,80,0]]},
        'heat-ray': { type: 'linear', dir: 'right', stops: [
            [0,220,40,20,0],[0.18,255,80,30,0.55],[0.38,255,160,60,0.9],[0.50,255,240,200,1],[0.62,255,160,60,0.9],[0.82,255,80,30,0.55],[1,220,40,20,0]]},
        'laser-pink': { type: 'linear', dir: 'right', stops: [
            [0,255,60,200,0],[0.18,255,120,220,0.6],[0.38,255,200,240,0.95],[0.50,255,255,255,1],[0.62,255,200,240,0.95],[0.82,255,120,220,0.6],[1,255,60,200,0]]},
        'laser-red': { type: 'linear', dir: 'right', stops: [
            [0,255,40,40,0],[0.18,255,90,90,0.6],[0.38,255,170,170,0.95],[0.50,255,255,255,1],[0.62,255,170,170,0.95],[0.82,255,90,90,0.6],[1,255,40,40,0]]},
        'vine-green': { type: 'radial', stops: [
            [0,220,255,180,1],[0.25,120,230,80,1],[0.55,60,170,50,0.9],[0.75,30,110,40,0.55],[0.95,10,50,20,0]]},
        'rain-drop': { type: 'linear', dir: 'down', stops: [
            [0,180,210,255,0],[0.15,200,225,255,0.4],[0.50,220,240,255,0.75],[0.80,240,250,255,0.85],[1,255,255,255,0.5]]},
        'rain-drop-blood': { type: 'linear', dir: 'down', stops: [
            [0,160,20,20,0],[0.15,180,30,40,0.45],[0.50,200,40,50,0.8],[0.80,220,50,60,0.9],[1,180,30,30,0.5]]},
        'rain-splash': { type: 'radial', stops: [
            [0,200,225,255,0],[0.40,200,225,255,0],[0.55,220,240,255,0.65],[0.72,240,250,255,0.45],[0.85,255,255,255,0.15],[1,255,255,255,0]]},
        'rain-splash-blood': { type: 'radial', stops: [
            [0,160,20,30,0],[0.40,160,20,30,0],[0.55,200,40,50,0.7],[0.72,180,30,40,0.5],[0.85,140,20,25,0.2],[1,120,15,20,0]]},
        'tess-splash': { type: 'radial', stops: [
            [0,0,255,200,0],[0.35,0,255,200,0],[0.48,0,255,220,0.55],[0.60,180,100,255,0.5],[0.72,255,200,80,0.4],[0.85,255,255,255,0.15],[1,255,255,255,0]]},
    };

    var _R2 = 'https://cdn.entropywars.net/Assets/Sprites/';
    var _imageDefs = {
        'bat-1':           _R2 + 'Races/vampire/bat1.png',
        'bat-2':           _R2 + 'Races/vampire/bat2.png',
        'bat-3':           _R2 + 'Races/vampire/bat3.png',
        'bat-4':           _R2 + 'Races/vampire/bat4.png',
        'spider-1':        _R2 + 'spider_1.png',
        'spiderweb-1':     _R2 + 'spiderweb_1.png',
        'missile':         _R2 + 'missle.png',
        'nuclear-missile': _R2 + 'nuclearmissle.png',
        'f22':             _R2 + 'f22.png',
        'ufo':             _R2 + 'ufo.png',
        'ring-1':          _R2 + 'ring_1.png',
        'ring-2':          _R2 + 'ring_2.png',
        'ring-3':          _R2 + 'ring_3.png',
        'ring-4':          _R2 + 'ring_4.png',
        'ring-5':          _R2 + 'ring_5.png',
        'ring-6':          _R2 + 'ring_6.png',
        'ring-7':          _R2 + 'ring_7.png',
        'tess-tri':        _R2 + 'holotriangle.png',
        'tess-circle':     _R2 + 'holocircle.png',
        'tess-square':     _R2 + 'holosquare.png',
        'inkblot':         _R2 + 'inkblot.png',
    };

    /* ── Procedural wave sprites ─────────────────────────────────────────
       The old wave_1..6.png art no longer fits the game, so the six frames
       are drawn on a canvas instead of loaded from R2: concentric soft
       ripple rings + caustic-bright arcs + flying droplets, cyan→deep-blue
       radial palette with white-hot crests. Frame index 0..5 animates one
       ripple expanding and decaying (the existing wave frame-swap animation
       loops it). Drawn once at atlas build — both into the 64px atlas cell
       and as a 128px hi-res texture — so every particle shares textures.  */
    var _proceduralDefs = {
        'wave-1': 0, 'wave-2': 1, 'wave-3': 2,
        'wave-4': 3, 'wave-5': 4, 'wave-6': 5,
    };
    var _WAVE_HIRES = 128;

    function _drawWaveFrame(ctx, cx, cy, sz, frame) {
        var t = frame / 5;                     // 0 → birth, 1 → dissipated
        var half = sz / 2;
        var mx = cx + half, my = cy + half;
        var fade = 1 - t * t;                  // overall decay
        ctx.save();
        ctx.clearRect(cx, cy, sz, sz);
        ctx.beginPath();
        ctx.arc(mx, my, half, 0, Math.PI * 2);
        ctx.clip();

        /* deep water body glow — shrinks + dims as the splash dies */
        var body = ctx.createRadialGradient(mx, my, 0, mx, my, half);
        body.addColorStop(0.00, 'rgba(150,220,255,' + (0.55 * fade) + ')');
        body.addColorStop(0.30, 'rgba(60,150,235,'  + (0.40 * fade) + ')');
        body.addColorStop(0.65, 'rgba(20,70,160,'   + (0.22 * fade) + ')');
        body.addColorStop(1.00, 'rgba(5,25,80,0)');
        ctx.fillStyle = body;
        ctx.fillRect(cx, cy, sz, sz);

        /* concentric ripple rings — expand outward with the frame */
        for (var ri = 0; ri < 3; ri++) {
            var rt = t + ri * 0.28;
            if (rt > 1.15) continue;
            var rad = half * (0.16 + 0.78 * Math.min(1, rt));
            var thick = half * (0.055 + 0.11 * rt);
            var rAlpha = Math.max(0, (1 - rt) * (ri === 0 ? 0.95 : 0.55)) * fade;
            if (rAlpha <= 0.02) continue;
            var inner = Math.max(0, rad - thick), outer = Math.min(half, rad + thick);
            var ring = ctx.createRadialGradient(mx, my, inner, mx, my, outer);
            ring.addColorStop(0.00, 'rgba(90,190,255,0)');
            ring.addColorStop(0.50, 'rgba(225,248,255,' + rAlpha + ')');
            ring.addColorStop(1.00, 'rgba(90,190,255,0)');
            ctx.beginPath();
            ctx.arc(mx, my, outer, 0, Math.PI * 2);
            ctx.fillStyle = ring;
            ctx.fill();
        }

        /* caustic-bright crest arcs riding the lead ripple */
        var leadRad = half * (0.16 + 0.78 * Math.min(1, t));
        var arcAlpha = (1 - t) * 0.9;
        if (arcAlpha > 0.03) {
            ctx.lineCap = 'round';
            for (var ai = 0; ai < 4; ai++) {
                var a0 = frame * 0.9 + ai * 1.62;
                var span = 0.5 + (ai % 2) * 0.45;
                ctx.beginPath();
                ctx.arc(mx, my, leadRad, a0, a0 + span);
                ctx.strokeStyle = 'rgba(255,255,255,' + (arcAlpha * (0.55 + 0.45 * (ai % 2))) + ')';
                ctx.lineWidth = Math.max(1, half * 0.05);
                ctx.stroke();
            }
        }

        /* droplets thrown up and out — rise early frames, fall late */
        var arc = t < 0.5 ? t * 2 : (1 - t) * 2;   // up-then-down envelope
        for (var di = 0; di < 6; di++) {
            var da = frame * 0.7 + di * 1.047;
            var dr = half * (0.30 + 0.55 * t) * (0.8 + 0.35 * ((di * 7) % 3) / 2);
            var dx = mx + Math.cos(da) * dr;
            var dy = my + Math.sin(da) * dr * 0.8 - half * 0.28 * arc;
            var ds = half * (0.05 + 0.05 * arc) * (di % 2 ? 1 : 0.7);
            var dAlpha = Math.max(0, 0.9 * fade - 0.1 * di);
            if (dAlpha <= 0.03 || ds < 0.5) continue;
            var drop = ctx.createRadialGradient(dx, dy, 0, dx, dy, ds);
            drop.addColorStop(0, 'rgba(240,252,255,' + dAlpha + ')');
            drop.addColorStop(0.55, 'rgba(120,200,255,' + (dAlpha * 0.7) + ')');
            drop.addColorStop(1, 'rgba(60,140,230,0)');
            ctx.beginPath();
            ctx.arc(dx, dy, ds, 0, Math.PI * 2);
            ctx.fillStyle = drop;
            ctx.fill();
        }

        /* white-hot core crest — big at birth, gone by mid-life */
        var coreAlpha = Math.max(0, 1 - t * 1.8);
        if (coreAlpha > 0.02) {
            var core = ctx.createRadialGradient(mx, my, 0, mx, my, half * 0.34);
            core.addColorStop(0, 'rgba(255,255,255,' + coreAlpha + ')');
            core.addColorStop(0.45, 'rgba(190,240,255,' + (coreAlpha * 0.75) + ')');
            core.addColorStop(1, 'rgba(90,190,255,0)');
            ctx.beginPath();
            ctx.arc(mx, my, half * 0.34, 0, Math.PI * 2);
            ctx.fillStyle = core;
            ctx.fill();
        }

        ctx.restore();
    }

    /* ── Procedural gun crosshair sprite ─────────────────────────────────
       Lock-on reticle painted on gun / gun-adjacent spell targets during
       the cast wind-up (see _stageGunCrosshair in three-vfx-effects.js).
       Drawn, not loaded: outer ring, cardinal ticks crossing it, inner
       ticks with a centre gap, hot centre dot. Two stroke passes — a wide
       dim red for glow and a thin near-white core — so the additive blend
       reads as a lit HUD element rather than a flat red shape. */
    function _drawCrosshairCell(ctx, cx, cy, sz) {
        var half = sz / 2, mx = cx + half, my = cy + half;
        ctx.save();
        ctx.clearRect(cx, cy, sz, sz);
        ctx.lineCap = 'round';
        var passes = [
            { w: sz * 0.070, col: 'rgba(255,55,25,0.50)' },
            { w: sz * 0.026, col: 'rgba(255,225,210,0.95)' }
        ];
        for (var pi = 0; pi < passes.length; pi++) {
            ctx.strokeStyle = passes[pi].col;
            ctx.lineWidth = passes[pi].w;
            ctx.beginPath();
            ctx.arc(mx, my, half * 0.64, 0, Math.PI * 2);
            ctx.stroke();
            for (var i = 0; i < 4; i++) {
                var a = i * Math.PI / 2;
                var ux = Math.cos(a), uy = Math.sin(a);
                /* cardinal tick crossing the ring */
                ctx.beginPath();
                ctx.moveTo(mx + ux * half * 0.48, my + uy * half * 0.48);
                ctx.lineTo(mx + ux * half * 0.92, my + uy * half * 0.92);
                ctx.stroke();
                /* inner tick, stopping short of the centre */
                ctx.beginPath();
                ctx.moveTo(mx + ux * half * 0.15, my + uy * half * 0.15);
                ctx.lineTo(mx + ux * half * 0.34, my + uy * half * 0.34);
                ctx.stroke();
            }
        }
        var dot = ctx.createRadialGradient(mx, my, 0, mx, my, half * 0.10);
        dot.addColorStop(0.00, 'rgba(255,255,255,1)');
        dot.addColorStop(0.50, 'rgba(255,120,80,0.9)');
        dot.addColorStop(1.00, 'rgba(255,55,25,0)');
        ctx.beginPath();
        ctx.arc(mx, my, half * 0.10, 0, Math.PI * 2);
        ctx.fillStyle = dot;
        ctx.fill();
        ctx.restore();
    }

    /* ═══ SHAPED SPRITE PACK (2026-08-04) ════════════════════════════════
       Every particle used to be a 64px soft radial/linear gradient — the
       whole game was built out of fuzzy blobs, which is exactly why spells
       read as FLAT no matter how well they were staged. This pack redraws
       the most-used sprites as real SHAPES at hi-res (128–192px): sparks
       are 4-point anamorphic glints, embers have a hot nucleus and a
       flickered rim, smoke is a lobed billow with eroded holes, flames are
       crisp layered tongues, ice is faceted crystal, shockwaves are sharp
       double bands, scorch is a cracked burn. The textures land in
       _hiResTextures, which _getSpriteTexture already prefers over the
       atlas — so every one of the ~600 effect recipes upgrades without a
       single recipe edit. Colors are BAKED (like the gradient cells they
       replace) so the existing white-material + optional-tint pipeline is
       untouched. All drawing is seeded-deterministic: same art every boot.
       ─────────────────────────────────────────────────────────────────── */
    function _sRand(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    /* soft radial blob at (x,y) — the workhorse under most shapes */
    function _blob(ctx, x, y, r, stops) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }

    /* 4-point star glint: two crossed tapered rays + hot core + halo.
       ratio squashes the vertical pair (anamorphic look), rot tilts it. */
    function _drawGlint(ctx, S, o) {
        var c = S / 2;
        var col = o.col, hot = o.hot || 'rgba(255,255,255,1)';
        ctx.save();
        ctx.translate(c, c);
        if (o.rot) ctx.rotate(o.rot);
        _blob(ctx, 0, 0, S * (o.halo != null ? o.halo : 0.34),
              [[0, col.replace('%A', '0.55')], [0.6, col.replace('%A', '0.18')], [1, col.replace('%A', '0')]]);
        function ray(len, wid, ang) {
            ctx.save();
            ctx.rotate(ang);
            var g = ctx.createLinearGradient(-len, 0, len, 0);
            g.addColorStop(0.0, col.replace('%A', '0'));
            g.addColorStop(0.28, col.replace('%A', '0.75'));
            g.addColorStop(0.5, hot);
            g.addColorStop(0.72, col.replace('%A', '0.75'));
            g.addColorStop(1.0, col.replace('%A', '0'));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-len, 0);
            ctx.quadraticCurveTo(0, -wid, len, 0);
            ctx.quadraticCurveTo(0, wid, -len, 0);
            ctx.fill();
            ctx.restore();
        }
        var L = S * (o.len != null ? o.len : 0.46);
        var W = S * (o.wid != null ? o.wid : 0.05);
        var vr = o.vRatio != null ? o.vRatio : 0.72;
        ray(L, W, 0);
        ray(L * vr, W, Math.PI / 2);
        if (o.diag) { ray(L * 0.42, W * 0.7, Math.PI / 4); ray(L * 0.42, W * 0.7, -Math.PI / 4); }
        _blob(ctx, 0, 0, S * 0.09, [[0, hot], [0.5, col.replace('%A', '0.9')], [1, col.replace('%A', '0')]]);
        ctx.restore();
    }

    /* lobed billow: N overlapping blobs around the centre with speckled
       erosion holes — smoke / dust / explosion cores */
    function _drawBillow(ctx, S, o) {
        var c = S / 2, rnd = _sRand(o.seed || 0xB111);
        var n = o.lobes || 7;
        for (var i = 0; i < n; i++) {
            var a = (i / n) * 6.2832 + rnd() * 1.1;
            var d = S * (0.10 + rnd() * (o.spread != null ? o.spread : 0.16));
            var r = S * (o.lobeR != null ? o.lobeR : 0.20) * (0.75 + rnd() * 0.5);
            _blob(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, r, o.stops);
        }
        _blob(ctx, c, c, S * 0.24, o.coreStops || o.stops);
        if (o.holes) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            for (var h = 0; h < o.holes; h++) {
                var ha = rnd() * 6.2832, hd = S * (0.16 + rnd() * 0.26);
                var hx = c + Math.cos(ha) * hd, hy = c + Math.sin(ha) * hd;
                _blob(ctx, hx, hy, S * (0.03 + rnd() * 0.05),
                      [[0, 'rgba(0,0,0,0.85)'], [1, 'rgba(0,0,0,0)']]);
            }
            ctx.restore();
        }
    }

    /* crisp flame tongue pointing UP: layered teardrop silhouettes with a
       wavering edge — outer body, mid heat, white-hot core */
    function _drawTongue(ctx, S, layers, seed) {
        var rnd = _sRand(seed || 0xF1A);
        for (var li = 0; li < layers.length; li++) {
            var L = layers[li];
            var w = S * L.w, hTop = S * (1 - L.h), base = S * (L.base != null ? L.base : 0.94);
            var cx = S / 2 + (L.dx || 0) * S;
            ctx.fillStyle = L.col;
            ctx.beginPath();
            ctx.moveTo(cx, hTop);
            var side, k, px, py;
            /* right edge down */
            for (k = 1; k <= 4; k++) {
                side = k / 4;
                px = cx + w * Math.sin(side * Math.PI) * (0.86 + rnd() * 0.3);
                py = hTop + (base - hTop) * side;
                ctx.quadraticCurveTo(px + w * 0.16, py - (base - hTop) * 0.1, px, py);
            }
            /* left edge back up */
            for (k = 3; k >= 0; k--) {
                side = k / 4;
                px = cx - w * Math.sin(side * Math.PI) * (0.86 + rnd() * 0.3);
                py = hTop + (base - hTop) * side;
                ctx.quadraticCurveTo(px - w * 0.16, py + (base - hTop) * 0.06, px, py);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    /* ring band with optional ticks / second echo band / speckle flecks */
    function _drawBand(ctx, S, o) {
        var c = S / 2, rnd = _sRand(o.seed || 0xB43D);
        function band(rad, thick, col0, col1, alpha) {
            var inner = Math.max(0, rad - thick), outer = Math.min(c, rad + thick);
            var g = ctx.createRadialGradient(c, c, inner, c, c, outer);
            g.addColorStop(0, col1.replace('%A', '0'));
            g.addColorStop(0.45, col0.replace('%A', String(alpha)));
            g.addColorStop(0.55, col0.replace('%A', String(alpha)));
            g.addColorStop(1, col1.replace('%A', '0'));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(c, c, outer, 0, 6.2832);
            ctx.arc(c, c, inner, 0, 6.2832, true); ctx.fill();
        }
        band(S * o.r, S * o.t, o.hot, o.col, o.a != null ? o.a : 0.95);
        if (o.echo) band(S * o.echo, S * o.t * 0.45, o.col, o.col, 0.5);
        if (o.inner) band(S * o.inner, S * o.t * 0.4, o.col, o.col, 0.4);
        if (o.ticks) {
            ctx.strokeStyle = o.hot.replace('%A', '0.9');
            ctx.lineCap = 'round';
            ctx.lineWidth = S * 0.012;
            for (var i = 0; i < o.ticks; i++) {
                var a = (i / o.ticks) * 6.2832;
                ctx.beginPath();
                ctx.moveTo(c + Math.cos(a) * S * (o.r - o.t * 1.5), c + Math.sin(a) * S * (o.r - o.t * 1.5));
                ctx.lineTo(c + Math.cos(a) * S * (o.r + o.t * 1.5), c + Math.sin(a) * S * (o.r + o.t * 1.5));
                ctx.stroke();
            }
        }
        if (o.flecks) {
            for (var f = 0; f < o.flecks; f++) {
                var fa = rnd() * 6.2832, fd = S * (o.r + 0.02 + rnd() * 0.1);
                if (fd > c * 0.98) continue;
                _blob(ctx, c + Math.cos(fa) * fd, c + Math.sin(fa) * fd,
                      S * (0.008 + rnd() * 0.014),
                      [[0, o.hot.replace('%A', '0.9')], [1, o.hot.replace('%A', '0')]]);
            }
        }
    }

    /* horizontal energy lance: layered halo + white core line + striations.
       For the 'linear right' beam sprites that get stretched along quads. */
    function _drawLance(ctx, S, o) {
        var mid = S / 2;
        function bar(hh, col0, col1, aPk) {
            var g = ctx.createLinearGradient(0, 0, S, 0);
            g.addColorStop(0, col1.replace('%A', '0'));
            g.addColorStop(0.16, col0.replace('%A', String(aPk * 0.55)));
            g.addColorStop(0.5, col0.replace('%A', String(aPk)));
            g.addColorStop(0.84, col0.replace('%A', String(aPk * 0.55)));
            g.addColorStop(1, col1.replace('%A', '0'));
            var gv = ctx.createLinearGradient(0, mid - hh, 0, mid + hh);
            gv.addColorStop(0, 'rgba(0,0,0,0)');
            gv.addColorStop(0.5, 'rgba(255,255,255,1)');
            gv.addColorStop(1, 'rgba(0,0,0,0)');
            var tmp = document.createElement('canvas');
            tmp.width = S; tmp.height = S;
            var tc = tmp.getContext('2d');
            tc.fillStyle = g; tc.fillRect(0, mid - hh, S, hh * 2);
            tc.globalCompositeOperation = 'destination-in';
            tc.fillStyle = gv; tc.fillRect(0, mid - hh, S, hh * 2);
            ctx.drawImage(tmp, 0, 0);
        }
        bar(S * (o.halo != null ? o.halo : 0.30), o.col, o.col, 0.55);
        bar(S * 0.12, o.col, o.col, 0.9);
        bar(S * 0.035, o.hot || 'rgba(255,255,255,%A)', o.col, 1);
        if (o.striate) {
            var rnd = _sRand(o.seed || 0x57A1);
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < o.striate; i++) {
                var y = mid + (rnd() - 0.5) * S * 0.3;
                var x0 = rnd() * S * 0.5, len = S * (0.2 + rnd() * 0.4);
                var g2 = ctx.createLinearGradient(x0, 0, x0 + len, 0);
                g2.addColorStop(0, o.col.replace('%A', '0'));
                g2.addColorStop(0.5, o.col.replace('%A', '0.5'));
                g2.addColorStop(1, o.col.replace('%A', '0'));
                ctx.fillStyle = g2;
                ctx.fillRect(x0, y - S * 0.006, len, S * 0.012);
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    /* faceted crystal star: n sharp tapered arms + facet strokes + core */
    function _drawCrystal(ctx, S, o) {
        var c = S / 2, rnd = _sRand(o.seed || 0x1CE);
        var n = o.arms || 6;
        for (var i = 0; i < n; i++) {
            var a = (i / n) * 6.2832 + (o.rot || 0);
            var len = S * (o.len != null ? o.len : 0.42) * (0.8 + rnd() * 0.35);
            var wid = S * (o.wid != null ? o.wid : 0.055);
            ctx.save();
            ctx.translate(c, c); ctx.rotate(a);
            var g = ctx.createLinearGradient(0, 0, len, 0);
            g.addColorStop(0, o.hot);
            g.addColorStop(0.45, o.col.replace('%A', '0.95'));
            g.addColorStop(1, o.col.replace('%A', '0.1'));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, -wid);
            ctx.lineTo(len * 0.62, -wid * 0.5);
            ctx.lineTo(len, 0);
            ctx.lineTo(len * 0.62, wid * 0.5);
            ctx.lineTo(0, wid);
            ctx.closePath();
            ctx.fill();
            if (o.branch) {
                for (var b = 0; b < 2; b++) {
                    var bt = 0.35 + b * 0.25;
                    ctx.strokeStyle = o.col.replace('%A', '0.8');
                    ctx.lineWidth = wid * 0.5;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(len * bt, 0);
                    ctx.lineTo(len * (bt + 0.14), -len * 0.13);
                    ctx.moveTo(len * bt, 0);
                    ctx.lineTo(len * (bt + 0.14), len * 0.13);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
        _blob(ctx, c, c, S * 0.12, [[0, o.hot], [0.6, o.col.replace('%A', '0.8')], [1, o.col.replace('%A', '0')]]);
    }

    /* irregular angular chunk with lit/shadow facets (debris / rock) */
    function _drawChunk(ctx, S, o) {
        var c = S / 2, rnd = _sRand(o.seed || 0xC4);
        var n = 7, pts = [];
        for (var i = 0; i < n; i++) {
            var a = (i / n) * 6.2832;
            var r = S * (0.2 + rnd() * 0.17);
            pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
        }
        ctx.fillStyle = o.base;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var k = 1; k < n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.closePath(); ctx.fill();
        /* lit top-left facet + shadowed bottom-right facet */
        ctx.fillStyle = o.lit;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.lineTo(c, c);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = o.dark;
        ctx.beginPath();
        ctx.moveTo(pts[3][0], pts[3][1]);
        ctx.lineTo(pts[4][0], pts[4][1]);
        ctx.lineTo(pts[5][0], pts[5][1]);
        ctx.lineTo(c, c);
        ctx.closePath(); ctx.fill();
    }

    /* the pack itself: key → { sz, draw }. Baked colors mirror the gradient
       cells these replace, so tint/blend behaviour is unchanged. */
    var _shapedHiResDefs = {

        /* ── impact / light ─────────────────────────────────────────── */
        'flash': { sz: 160, draw: function (ctx, S) {
            _blob(ctx, S / 2, S / 2, S * 0.5,
                  [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,244,200,0.9)'],
                   [0.45, 'rgba(255,190,90,0.55)'], [0.7, 'rgba(255,120,30,0.2)'], [1, 'rgba(180,60,10,0)']]);
            _drawGlint(ctx, S, { col: 'rgba(255,232,170,%A)', len: 0.5, wid: 0.035, vRatio: 1.0, diag: true, halo: 0.0 });
        }},
        'muzzle-flash': { sz: 128, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0x30F1A5);
            for (var i = 0; i < 7; i++) {
                var a = (i / 7) * 6.2832 + rnd() * 0.5;
                var len = S * (0.28 + rnd() * 0.2);
                ctx.save(); ctx.translate(c, c); ctx.rotate(a);
                var g = ctx.createLinearGradient(0, 0, len, 0);
                g.addColorStop(0, 'rgba(255,255,240,1)');
                g.addColorStop(0.5, 'rgba(255,220,110,0.85)');
                g.addColorStop(1, 'rgba(255,150,40,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(0, -S * 0.05); ctx.lineTo(len, 0); ctx.lineTo(0, S * 0.05);
                ctx.closePath(); ctx.fill();
                ctx.restore();
            }
            _blob(ctx, c, c, S * 0.2, [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,235,160,0.8)'], [1, 'rgba(255,180,60,0)']]);
        }},

        /* ── sparks: anamorphic glints ──────────────────────────────── */
        'spark-elec':    { sz: 128, draw: function (ctx, S) { _drawGlint(ctx, S, { col: 'rgba(120,200,255,%A)', len: 0.48, wid: 0.05, diag: true }); }},
        'spark-blue':    { sz: 128, draw: function (ctx, S) { _drawGlint(ctx, S, { col: 'rgba(80,180,255,%A)', len: 0.44, wid: 0.05 }); }},
        'spark-pink':    { sz: 128, draw: function (ctx, S) { _drawGlint(ctx, S, { col: 'rgba(255,90,190,%A)', len: 0.44, wid: 0.05 }); }},
        'steel-spark':   { sz: 128, draw: function (ctx, S) { _drawGlint(ctx, S, { col: 'rgba(255,235,160,%A)', len: 0.55, wid: 0.038, vRatio: 0.45 }); }},
        'divine-sparkle':{ sz: 128, draw: function (ctx, S) { _drawGlint(ctx, S, { col: 'rgba(255,244,190,%A)', len: 0.5, wid: 0.06, diag: true, halo: 0.3 }); }},
        'ember': { sz: 96, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0xE3B);
            _blob(ctx, c, c, S * 0.42,
                  [[0, 'rgba(255,220,120,0.7)'], [0.4, 'rgba(255,140,40,0.35)'], [1, 'rgba(180,50,10,0)']]);
            for (var i = 0; i < 8; i++) {
                var a = rnd() * 6.2832, d = S * (0.16 + rnd() * 0.14);
                _blob(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, S * (0.03 + rnd() * 0.05),
                      [[0, 'rgba(255,190,80,0.9)'], [1, 'rgba(255,120,30,0)']]);
            }
            _blob(ctx, c, c, S * 0.14,
                  [[0, 'rgba(255,255,240,1)'], [0.55, 'rgba(255,210,110,0.95)'], [1, 'rgba(255,140,40,0)']]);
        }},

        /* ── smoke / dust: lobed billows with eroded holes ──────────── */
        'smoke': { sz: 160, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0x50A0, lobes: 8, holes: 9, spread: 0.18,
                stops: [[0, 'rgba(70,60,55,0.8)'], [0.55, 'rgba(45,38,34,0.5)'], [1, 'rgba(25,21,19,0)']],
                coreStops: [[0, 'rgba(85,74,66,0.85)'], [0.6, 'rgba(50,42,38,0.5)'], [1, 'rgba(25,21,19,0)']] });
        }},
        'smoke-soft': { sz: 160, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0x50A1, lobes: 8, holes: 7, spread: 0.2,
                stops: [[0, 'rgba(176,168,158,0.55)'], [0.55, 'rgba(140,132,124,0.34)'], [1, 'rgba(90,86,80,0)']],
                coreStops: [[0, 'rgba(190,182,170,0.6)'], [0.6, 'rgba(150,142,132,0.36)'], [1, 'rgba(96,92,86,0)']] });
        }},
        'dust-puff': { sz: 144, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0xD057, lobes: 7, holes: 6, spread: 0.17,
                stops: [[0, 'rgba(198,180,150,0.7)'], [0.55, 'rgba(162,146,118,0.45)'], [1, 'rgba(110,98,80,0)']] });
        }},
        'poison-mist': { sz: 144, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0x9013, lobes: 7, holes: 5, spread: 0.18,
                stops: [[0, 'rgba(120,220,80,0.6)'], [0.55, 'rgba(70,160,50,0.4)'], [1, 'rgba(30,90,25,0)']] });
            var rnd = _sRand(0x9014), c = S / 2;
            for (var i = 0; i < 5; i++) {
                var a = rnd() * 6.2832, d = S * (0.1 + rnd() * 0.2);
                var x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, r = S * (0.02 + rnd() * 0.025);
                ctx.strokeStyle = 'rgba(190,255,130,0.8)';
                ctx.lineWidth = S * 0.008;
                ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
            }
        }},
        'void-mist': { sz: 144, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0x701D, lobes: 8, holes: 8, spread: 0.19,
                stops: [[0, 'rgba(150,80,200,0.65)'], [0.5, 'rgba(96,44,140,0.42)'], [1, 'rgba(30,8,55,0)']],
                coreStops: [[0, 'rgba(40,14,66,0.8)'], [0.55, 'rgba(80,36,120,0.45)'], [1, 'rgba(24,6,44,0)']] });
        }},
        'shadow-wisp': { sz: 144, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0x5AD0, lobes: 7, holes: 8, spread: 0.2,
                stops: [[0, 'rgba(64,44,84,0.7)'], [0.55, 'rgba(40,26,54,0.45)'], [1, 'rgba(16,10,24,0)']] });
        }},
        'explosion-orange': { sz: 192, draw: function (ctx, S) {
            _drawBillow(ctx, S, { seed: 0xB004, lobes: 9, holes: 6, spread: 0.2, lobeR: 0.22,
                stops: [[0, 'rgba(255,200,90,0.95)'], [0.45, 'rgba(255,120,35,0.75)'], [0.8, 'rgba(150,45,10,0.25)'], [1, 'rgba(60,18,4,0)']],
                coreStops: [[0, 'rgba(255,255,235,1)'], [0.4, 'rgba(255,225,140,0.95)'], [1, 'rgba(255,140,40,0)']] });
        }},

        /* ── fire tongues (drawn up; used by y-locked flame quads) ───── */
        'flame': { sz: 160, draw: function (ctx, S) {
            _drawTongue(ctx, S, [
                { w: 0.30, h: 0.86, col: 'rgba(210,60,12,0.85)' },
                { w: 0.235, h: 0.78, col: 'rgba(255,120,28,0.95)', dx: 0.012 },
                { w: 0.165, h: 0.62, col: 'rgba(255,190,70,1)', dx: -0.008 },
                { w: 0.095, h: 0.45, col: 'rgba(255,246,205,1)', base: 0.9 },
            ], 0xF7A3E);
        }},
        'flame-hot': { sz: 160, draw: function (ctx, S) {
            _drawTongue(ctx, S, [
                { w: 0.28, h: 0.82, col: 'rgba(255,150,50,0.9)' },
                { w: 0.20, h: 0.7, col: 'rgba(255,220,120,1)', dx: 0.01 },
                { w: 0.12, h: 0.5, col: 'rgba(255,252,235,1)', base: 0.9 },
            ], 0xF7A3F);
        }},
        'dark-flame': { sz: 160, draw: function (ctx, S) {
            _drawTongue(ctx, S, [
                { w: 0.30, h: 0.84, col: 'rgba(60,16,90,0.9)' },
                { w: 0.22, h: 0.72, col: 'rgba(120,36,170,0.95)', dx: 0.012 },
                { w: 0.14, h: 0.55, col: 'rgba(210,110,255,1)', dx: -0.006 },
                { w: 0.075, h: 0.4, col: 'rgba(255,230,255,1)', base: 0.9 },
            ], 0xDA4C);
        }},

        /* ── ice / frost / snow ─────────────────────────────────────── */
        'ice-shard': { sz: 144, draw: function (ctx, S) {
            _drawCrystal(ctx, S, { seed: 0x1CE5, arms: 6, len: 0.44, wid: 0.06,
                col: 'rgba(140,215,255,%A)', hot: 'rgba(255,255,255,1)' });
        }},
        'frost-crystal': { sz: 144, draw: function (ctx, S) {
            _drawCrystal(ctx, S, { seed: 0xF057, arms: 6, len: 0.46, wid: 0.04, branch: true,
                col: 'rgba(190,235,255,%A)', hot: 'rgba(255,255,255,1)' });
        }},
        'snowflake': { sz: 96, draw: function (ctx, S) {
            _drawCrystal(ctx, S, { seed: 0x5F1A, arms: 6, len: 0.4, wid: 0.03, branch: true,
                col: 'rgba(235,246,255,%A)', hot: 'rgba(255,255,255,0.95)' });
        }},

        /* ── rings / shockwaves (world decals) ──────────────────────── */
        'shockwave': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x540C, r: 0.36, t: 0.045, echo: 0.45, inner: 0.26, flecks: 26,
                col: 'rgba(255,170,60,%A)', hot: 'rgba(255,240,190,%A)' });
        }},
        'target-ring': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x7A61, r: 0.37, t: 0.035, echo: 0.44, ticks: 8,
                col: 'rgba(255,90,35,%A)', hot: 'rgba(255,170,110,%A)', a: 0.95 });
        }},
        'target-ring-gold': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x7A62, r: 0.37, t: 0.035, echo: 0.44, ticks: 12, flecks: 14,
                col: 'rgba(255,205,70,%A)', hot: 'rgba(255,240,180,%A)', a: 0.95 });
        }},
        'target-ring-blue': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x7A63, r: 0.37, t: 0.035, echo: 0.44, ticks: 8,
                col: 'rgba(60,160,255,%A)', hot: 'rgba(180,225,255,%A)', a: 0.95 });
        }},
        'target-ring-green': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x7A64, r: 0.37, t: 0.035, echo: 0.44, ticks: 8,
                col: 'rgba(60,230,140,%A)', hot: 'rgba(190,255,220,%A)', a: 0.95 });
        }},
        'halo-ring': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x4A10, r: 0.38, t: 0.05, inner: 0.28, flecks: 20,
                col: 'rgba(255,215,90,%A)', hot: 'rgba(255,245,200,%A)', a: 0.95 });
        }},
        'stun-ring': { sz: 192, draw: function (ctx, S) {
            _drawBand(ctx, S, { seed: 0x57C2, r: 0.37, t: 0.04, echo: 0.46, ticks: 6, flecks: 10,
                col: 'rgba(200,235,255,%A)', hot: 'rgba(255,255,255,%A)', a: 0.95 });
        }},

        /* ── ground scars ───────────────────────────────────────────── */
        'scorch': { sz: 192, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0x5C0C);
            _drawBillow(ctx, S, { seed: 0x5C0D, lobes: 9, spread: 0.14, lobeR: 0.2,
                stops: [[0, 'rgba(26,14,8,0.95)'], [0.6, 'rgba(38,22,12,0.75)'], [1, 'rgba(50,30,16,0)']] });
            /* radial cracks with faintly glowing inner tips */
            ctx.lineCap = 'round';
            for (var i = 0; i < 9; i++) {
                var a = (i / 9) * 6.2832 + rnd() * 0.5;
                var r0 = S * (0.05 + rnd() * 0.05), r1 = S * (0.26 + rnd() * 0.2);
                var seg = 3 + Math.floor(rnd() * 2), px = c + Math.cos(a) * r0, py = c + Math.sin(a) * r0;
                ctx.strokeStyle = 'rgba(255,120,40,' + (0.35 + rnd() * 0.3) + ')';
                ctx.lineWidth = S * (0.008 + rnd() * 0.008);
                ctx.beginPath(); ctx.moveTo(px, py);
                for (var s2 = 1; s2 <= seg; s2++) {
                    var rr = r0 + (r1 - r0) * (s2 / seg);
                    var aa = a + (rnd() - 0.5) * 0.5;
                    px = c + Math.cos(aa) * rr; py = c + Math.sin(aa) * rr;
                    ctx.lineTo(px, py);
                }
                ctx.stroke();
            }
            _blob(ctx, c, c, S * 0.14, [[0, 'rgba(255,150,50,0.5)'], [0.6, 'rgba(180,70,20,0.25)'], [1, 'rgba(90,30,8,0)']]);
        }},

        /* ── energy lances (linear-right quad sprites) ──────────────── */
        'plasma':    { sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(130,205,255,%A)', striate: 7, seed: 0x9145 }); }},
        'emp-arc':   { sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(150,215,255,%A)', striate: 5, seed: 0x9146 }); }},
        'acid-green':{ sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(190,245,90,%A)', striate: 6, seed: 0x9147 }); }},
        'heat-ray':  { sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(255,130,45,%A)', striate: 7, seed: 0x9148 }); }},
        'laser-pink':{ sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(255,120,220,%A)', striate: 5, seed: 0x9149 }); }},
        'laser-red': { sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(255,80,80,%A)', striate: 5, seed: 0x914A }); }},
        'holy-pillar':{ sz: 160, draw: function (ctx, S) { _drawLance(ctx, S, { col: 'rgba(255,240,190,%A)', striate: 4, seed: 0x914B }); }},

        /* ── jagged lightning streak (vertical, for stretched quads) ── */
        'lightning': { sz: 160, draw: function (ctx, S) {
            var rnd = _sRand(0x1147);
            var passes = [
                { w: S * 0.10, col: 'rgba(110,180,255,0.35)' },
                { w: S * 0.045, col: 'rgba(170,220,255,0.8)' },
                { w: S * 0.018, col: 'rgba(255,255,255,1)' },
            ];
            var pts = [];
            var n = 7;
            for (var i = 0; i <= n; i++) {
                var t = i / n;
                var xo = (i === 0 || i === n) ? 0 : (rnd() - 0.5) * S * 0.34 * Math.sin(t * Math.PI);
                pts.push([S / 2 + xo, t * S]);
            }
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (var p2 = 0; p2 < passes.length; p2++) {
                ctx.strokeStyle = passes[p2].col;
                ctx.lineWidth = passes[p2].w;
                ctx.beginPath();
                ctx.moveTo(pts[0][0], pts[0][1]);
                for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
                ctx.stroke();
            }
            /* one fork */
            ctx.strokeStyle = 'rgba(190,225,255,0.7)';
            ctx.lineWidth = S * 0.02;
            ctx.beginPath();
            ctx.moveTo(pts[3][0], pts[3][1]);
            ctx.lineTo(pts[3][0] + S * 0.18, pts[3][1] + S * 0.16);
            ctx.stroke();
        }},

        /* ── liquids / nature / misc ────────────────────────────────── */
        'water-splash': { sz: 144, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0xA04A);
            _blob(ctx, c, c, S * 0.3, [[0, 'rgba(200,235,255,0.9)'], [0.55, 'rgba(90,170,230,0.55)'], [1, 'rgba(30,90,170,0)']]);
            /* crown of droplet spikes */
            for (var i = 0; i < 9; i++) {
                var a = (i / 9) * 6.2832 + rnd() * 0.3;
                var d = S * (0.22 + rnd() * 0.14);
                var x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
                _blob(ctx, x, y, S * (0.035 + rnd() * 0.035),
                      [[0, 'rgba(235,250,255,0.95)'], [0.6, 'rgba(120,195,245,0.6)'], [1, 'rgba(60,130,210,0)']]);
            }
            _blob(ctx, c, c, S * 0.1, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(160,215,255,0)']]);
        }},
        'poison-bubble': { sz: 112, draw: function (ctx, S) {
            var c = S / 2;
            _blob(ctx, c, c, S * 0.4, [[0, 'rgba(140,230,80,0.35)'], [0.75, 'rgba(90,180,50,0.5)'], [1, 'rgba(50,120,30,0)']]);
            ctx.strokeStyle = 'rgba(200,255,140,0.9)';
            ctx.lineWidth = S * 0.03;
            ctx.beginPath(); ctx.arc(c, c, S * 0.34, 0, 6.2832); ctx.stroke();
            _blob(ctx, c - S * 0.13, c - S * 0.15, S * 0.08,
                  [[0, 'rgba(240,255,210,0.95)'], [1, 'rgba(200,255,150,0)']]);
        }},
        'bubble': { sz: 112, draw: function (ctx, S) {
            var c = S / 2;
            _blob(ctx, c, c, S * 0.4, [[0, 'rgba(150,200,255,0.18)'], [0.78, 'rgba(140,190,250,0.4)'], [1, 'rgba(90,140,220,0)']]);
            ctx.strokeStyle = 'rgba(220,240,255,0.85)';
            ctx.lineWidth = S * 0.025;
            ctx.beginPath(); ctx.arc(c, c, S * 0.35, 0, 6.2832); ctx.stroke();
            _blob(ctx, c - S * 0.14, c - S * 0.15, S * 0.07,
                  [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(220,240,255,0)']]);
        }},
        'heal-cross': { sz: 128, draw: function (ctx, S) {
            var c = S / 2, w = S * 0.13, l = S * 0.34;
            _blob(ctx, c, c, S * 0.42, [[0, 'rgba(140,255,180,0.5)'], [0.6, 'rgba(90,220,130,0.2)'], [1, 'rgba(50,150,80,0)']]);
            ctx.fillStyle = 'rgba(210,255,225,0.98)';
            function rrect(x, y, ww, hh) {
                var r = w * 0.4;
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.arcTo(x + ww, y, x + ww, y + hh, r);
                ctx.arcTo(x + ww, y + hh, x, y + hh, r);
                ctx.arcTo(x, y + hh, x, y, r);
                ctx.arcTo(x, y, x + ww, y, r);
                ctx.fill();
            }
            rrect(c - w / 2, c - l, w, l * 2);
            rrect(c - l, c - w / 2, l * 2, w);
            _blob(ctx, c, c, S * 0.1, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(190,255,215,0)']]);
        }},
        'holy-light': { sz: 144, draw: function (ctx, S) {
            _blob(ctx, S / 2, S / 2, S * 0.5,
                  [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,245,200,0.9)'], [0.6, 'rgba(255,220,120,0.5)'], [1, 'rgba(200,160,60,0)']]);
            _drawGlint(ctx, S, { col: 'rgba(255,240,180,%A)', len: 0.5, wid: 0.045, vRatio: 1.35, halo: 0 });
        }},
        'psi-pulse': { sz: 144, draw: function (ctx, S) {
            var c = S / 2;
            _blob(ctx, c, c, S * 0.46,
                  [[0, 'rgba(255,255,255,0.9)'], [0.3, 'rgba(190,255,210,0.6)'], [0.62, 'rgba(210,90,230,0.4)'], [1, 'rgba(140,40,170,0)']]);
            for (var i = 1; i <= 3; i++) {
                ctx.strokeStyle = i % 2 ? 'rgba(230,140,255,' + (0.65 - i * 0.12) + ')'
                                        : 'rgba(150,255,200,' + (0.6 - i * 0.12) + ')';
                ctx.lineWidth = S * 0.022;
                ctx.beginPath(); ctx.arc(c, c, S * (0.12 + i * 0.106), 0, 6.2832); ctx.stroke();
            }
        }},
        'vine-green': { sz: 128, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0x1EAF);
            _blob(ctx, c, c, S * 0.34, [[0, 'rgba(215,255,170,0.9)'], [0.55, 'rgba(110,220,80,0.55)'], [1, 'rgba(40,130,40,0)']]);
            /* leaf pods around the core */
            for (var i = 0; i < 5; i++) {
                var a = (i / 5) * 6.2832 + rnd() * 0.4;
                var d = S * 0.22;
                ctx.save();
                ctx.translate(c + Math.cos(a) * d, c + Math.sin(a) * d);
                ctx.rotate(a + Math.PI / 2);
                var lg = ctx.createLinearGradient(0, -S * 0.12, 0, S * 0.12);
                lg.addColorStop(0, 'rgba(190,255,140,0.95)');
                lg.addColorStop(1, 'rgba(60,160,55,0.5)');
                ctx.fillStyle = lg;
                ctx.beginPath();
                ctx.ellipse(0, 0, S * 0.055, S * 0.12, 0, 0, 6.2832);
                ctx.fill();
                ctx.restore();
            }
        }},
        'leaf': { sz: 96, draw: function (ctx, S) {
            var c = S / 2;
            ctx.save();
            ctx.translate(c, c); ctx.rotate(0.6);
            var g = ctx.createLinearGradient(0, -S * 0.3, 0, S * 0.3);
            g.addColorStop(0, 'rgba(120,200,70,0.95)');
            g.addColorStop(1, 'rgba(50,120,35,0.9)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, -S * 0.32);
            ctx.quadraticCurveTo(S * 0.22, -S * 0.05, 0, S * 0.32);
            ctx.quadraticCurveTo(-S * 0.22, -S * 0.05, 0, -S * 0.32);
            ctx.fill();
            ctx.strokeStyle = 'rgba(210,255,170,0.7)';
            ctx.lineWidth = S * 0.018;
            ctx.beginPath(); ctx.moveTo(0, -S * 0.28); ctx.lineTo(0, S * 0.28); ctx.stroke();
            ctx.restore();
        }},
        'petal': { sz: 96, draw: function (ctx, S) {
            var c = S / 2;
            ctx.save();
            ctx.translate(c, c); ctx.rotate(-0.5);
            var g = ctx.createLinearGradient(0, -S * 0.3, 0, S * 0.28);
            g.addColorStop(0, 'rgba(255,225,235,0.95)');
            g.addColorStop(1, 'rgba(250,150,180,0.85)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, -S * 0.3);
            ctx.bezierCurveTo(S * 0.26, -S * 0.18, S * 0.2, S * 0.2, 0, S * 0.28);
            ctx.bezierCurveTo(-S * 0.2, S * 0.2, -S * 0.26, -S * 0.18, 0, -S * 0.3);
            ctx.fill();
            ctx.restore();
        }},

        /* ── debris chunks ──────────────────────────────────────────── */
        'debris': { sz: 96, draw: function (ctx, S) {
            _drawChunk(ctx, S, { seed: 0xDE8, base: 'rgba(85,70,52,1)', lit: 'rgba(130,108,82,1)', dark: 'rgba(48,38,28,1)' });
        }},
        'rock-debris': { sz: 96, draw: function (ctx, S) {
            _drawChunk(ctx, S, { seed: 0x40CC, base: 'rgba(140,116,86,1)', lit: 'rgba(196,168,128,1)', dark: 'rgba(88,70,50,1)' });
        }},
        'mud-chunk': { sz: 96, draw: function (ctx, S) {
            _drawChunk(ctx, S, { seed: 0x30D, base: 'rgba(96,74,46,1)', lit: 'rgba(130,102,66,1)', dark: 'rgba(58,44,26,1)' });
        }},

        /* ── meteor: molten rock with a hot leading face ────────────── */
        'meteor': { sz: 160, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0x3E7);
            _blob(ctx, c - S * 0.06, c - S * 0.06, S * 0.5,
                  [[0, 'rgba(255,240,200,0.95)'], [0.35, 'rgba(255,160,60,0.7)'], [0.7, 'rgba(200,80,20,0.3)'], [1, 'rgba(100,30,8,0)']]);
            /* rocky body */
            ctx.fillStyle = 'rgba(52,34,24,0.96)';
            ctx.beginPath();
            for (var i = 0; i <= 9; i++) {
                var a = (i / 9) * 6.2832;
                var r = S * (0.26 + rnd() * 0.05);
                var x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.fill();
            /* glowing cracks */
            ctx.lineCap = 'round';
            for (var k = 0; k < 6; k++) {
                var ka = rnd() * 6.2832;
                var r0 = S * 0.06, r1 = S * (0.18 + rnd() * 0.1);
                ctx.strokeStyle = 'rgba(255,150,50,' + (0.6 + rnd() * 0.3) + ')';
                ctx.lineWidth = S * (0.012 + rnd() * 0.01);
                ctx.beginPath();
                ctx.moveTo(c + Math.cos(ka) * r0, c + Math.sin(ka) * r0);
                ctx.lineTo(c + Math.cos(ka + 0.4) * r1, c + Math.sin(ka + 0.4) * r1);
                ctx.stroke();
            }
            /* hot leading rim (upper-left) */
            ctx.strokeStyle = 'rgba(255,220,140,0.9)';
            ctx.lineWidth = S * 0.03;
            ctx.beginPath();
            ctx.arc(c, c, S * 0.27, Math.PI * 0.8, Math.PI * 1.6);
            ctx.stroke();
        }},

        /* ── blood decals (globs carry the 3D read; these are marks) ── */
        'blood-splat': { sz: 160, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0xB100D);
            _drawBillow(ctx, S, { seed: 0xB10E, lobes: 8, spread: 0.13, lobeR: 0.17,
                stops: [[0, 'rgba(150,16,16,0.95)'], [0.6, 'rgba(110,10,10,0.8)'], [1, 'rgba(70,5,5,0)']] });
            for (var i = 0; i < 10; i++) {
                var a = rnd() * 6.2832, d = S * (0.3 + rnd() * 0.16);
                _blob(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, S * (0.015 + rnd() * 0.03),
                      [[0, 'rgba(140,14,14,0.9)'], [1, 'rgba(90,8,8,0)']]);
            }
        }},
        'blood-pool': { sz: 160, draw: function (ctx, S) {
            var c = S / 2, rnd = _sRand(0x9001);
            ctx.fillStyle = 'rgba(90,6,6,0.94)';
            ctx.beginPath();
            for (var i = 0; i <= 11; i++) {
                var a = (i / 11) * 6.2832;
                var r = S * (0.3 + rnd() * 0.1);
                var x = c + Math.cos(a) * r, y = c + Math.sin(a) * r * 0.9;
                if (i === 0) ctx.moveTo(x, y); else ctx.quadraticCurveTo(
                    c + Math.cos(a - 0.28) * r * 1.08, c + Math.sin(a - 0.28) * r * 0.98, x, y);
            }
            ctx.closePath(); ctx.fill();
            _blob(ctx, c - S * 0.08, c - S * 0.06, S * 0.16,
                  [[0, 'rgba(180,40,40,0.5)'], [1, 'rgba(120,10,10,0)']]);
        }},
    };

    function _buildShapedHiRes() {
        for (var key in _shapedHiResDefs) {
            var def = _shapedHiResDefs[key];
            var cvs = document.createElement('canvas');
            cvs.width = cvs.height = def.sz;
            try { def.draw(cvs.getContext('2d'), def.sz); } catch (e) {
                console.warn('[ThreeVFX] shaped sprite draw failed: ' + key, e);
                continue;
            }
            var tex = new THREE.CanvasTexture(cvs);
            tex.premultiplyAlpha = false;
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            _hiResTextures[key] = tex;
        }
    }

    function _buildProceduralHiRes() {
        /* crisp 128px crosshair — billboard particles pick the hi-res
           texture over the 64px atlas cell when one exists */
        var xCvs = document.createElement('canvas');
        xCvs.width = _WAVE_HIRES; xCvs.height = _WAVE_HIRES;
        _drawCrosshairCell(xCvs.getContext('2d'), 0, 0, _WAVE_HIRES);
        var xTex = new THREE.CanvasTexture(xCvs);
        xTex.premultiplyAlpha = false;
        xTex.magFilter = THREE.LinearFilter;
        xTex.minFilter = THREE.LinearFilter;
        xTex.needsUpdate = true;
        _hiResTextures['crosshair'] = xTex;

        for (var key in _proceduralDefs) {
            var cvs = document.createElement('canvas');
            cvs.width = _WAVE_HIRES; cvs.height = _WAVE_HIRES;
            var ctx = cvs.getContext('2d');
            _drawWaveFrame(ctx, 0, 0, _WAVE_HIRES, _proceduralDefs[key]);
            var tex = new THREE.CanvasTexture(cvs);
            tex.premultiplyAlpha = false;
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            _hiResTextures[key] = tex;
        }

        _buildShapedHiRes();
    }

    function _buildAtlas() {
        var cvs = document.createElement('canvas');
        cvs.width = ATLAS_SIZE; cvs.height = ATLAS_SIZE;
        var ctx = cvs.getContext('2d');

        var allKeys = [];
        var key;
        for (key in _gradientDefs) allKeys.push(key);
        for (key in _imageDefs) { if (allKeys.indexOf(key) === -1) allKeys.push(key); }
        for (key in _spriteMap) { if (allKeys.indexOf(key) === -1) allKeys.push(key); }

        for (var i = 0; i < allKeys.length && i < ATLAS_COLS * ATLAS_COLS; i++) {
            var col = i % ATLAS_COLS;
            var row = Math.floor(i / ATLAS_COLS);
            var cx = col * ATLAS_CELL;
            var cy = row * ATLAS_CELL;
            var u0 = col / ATLAS_COLS;
            var v0 = row / ATLAS_COLS;
            var u1 = (col + 1) / ATLAS_COLS;
            var v1 = (row + 1) / ATLAS_COLS;
            _uvLookup[allKeys[i]] = { u0: u0, v0: v0, u1: u1, v1: v1 };

            var gdef = _gradientDefs[allKeys[i]];
            if (gdef) {
                _drawGradientCell(ctx, cx, cy, ATLAS_CELL, gdef);
            } else if (_proceduralDefs[allKeys[i]] != null) {
                _drawWaveFrame(ctx, cx, cy, ATLAS_CELL, _proceduralDefs[allKeys[i]]);
            } else if (allKeys[i] === 'crosshair') {
                _drawCrosshairCell(ctx, cx, cy, ATLAS_CELL);
            } else if (!_imageDefs[allKeys[i]]) {
                var sc = _spriteMap[allKeys[i]];
                if (sc) _drawSoftCircle(ctx, cx, cy, ATLAS_CELL, sc.r, sc.g, sc.b);
            }
        }

        var tex = new THREE.CanvasTexture(cvs);
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        tex.premultiplyAlpha = false;
        tex.needsUpdate = true;
        _atlasTexture = tex;
        _atlasCanvas = cvs;
        _atlasReady = true;

        _extractAllSpriteTextures();

        _buildProceduralHiRes();

        _loadImageSprites(ctx, cvs);

        console.log('[ThreeVFX] atlas built: ' + allKeys.length + ' sprites in ' +
                    ATLAS_SIZE + '×' + ATLAS_SIZE + ' atlas');
        if (allKeys.length > ATLAS_COLS * ATLAS_COLS) {
            console.error('[ThreeVFX] ATLAS OVERFLOW: ' + allKeys.length + ' sprites but only ' +
                          (ATLAS_COLS*ATLAS_COLS) + ' cells!');
        }
        return tex;
    }

    function _drawGradientCell(ctx, cx, cy, sz, def) {
        ctx.save();
        ctx.clearRect(cx, cy, sz, sz);
        var grad;
        var half = sz / 2;
        if (def.type === 'radial') {
            grad = ctx.createRadialGradient(cx + half, cy + half, 0, cx + half, cy + half, half);
        } else if (def.type === 'radial-off') {
            var ox = (def.cx != null ? def.cx : 0.5) * sz;
            var oy = (def.cy != null ? def.cy : 0.5) * sz;
            grad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + half, cy + half, half);
        } else if (def.type === 'linear') {
            if (def.dir === 'up') {
                grad = ctx.createLinearGradient(cx + half, cy + sz, cx + half, cy);
            } else if (def.dir === 'down') {
                grad = ctx.createLinearGradient(cx + half, cy, cx + half, cy + sz);
            } else {
                grad = ctx.createLinearGradient(cx, cy + half, cx + sz, cy + half);
            }
        }
        for (var i = 0; i < def.stops.length; i++) {
            var s = def.stops[i];
            grad.addColorStop(s[0], 'rgba(' + s[1] + ',' + s[2] + ',' + s[3] + ',' + s[4] + ')');
        }
        ctx.fillStyle = grad;
        if (def.type === 'radial' || def.type === 'radial-off') {
            ctx.beginPath();
            ctx.arc(cx + half, cy + half, half, 0, Math.PI * 2);
            ctx.fill();
        } else {

            var tmp = document.createElement('canvas');
            tmp.width = sz; tmp.height = sz;
            var tc = tmp.getContext('2d');

            var tGrad;
            if (def.dir === 'up') {
                tGrad = tc.createLinearGradient(half, sz, half, 0);
            } else if (def.dir === 'down') {
                tGrad = tc.createLinearGradient(half, 0, half, sz);
            } else {
                tGrad = tc.createLinearGradient(0, half, sz, half);
            }
            for (var gi = 0; gi < def.stops.length; gi++) {
                var gs = def.stops[gi];
                tGrad.addColorStop(gs[0], 'rgba(' + gs[1] + ',' + gs[2] + ',' + gs[3] + ',' + gs[4] + ')');
            }
            tc.fillStyle = tGrad;
            tc.fillRect(0, 0, sz, sz);

            tc.globalCompositeOperation = 'destination-in';
            var mask = tc.createRadialGradient(half, half, 0, half, half, half);
            mask.addColorStop(0, 'rgba(255,255,255,1)');
            mask.addColorStop(0.7, 'rgba(255,255,255,1)');
            mask.addColorStop(1, 'rgba(255,255,255,0)');
            tc.fillStyle = mask;
            tc.fillRect(0, 0, sz, sz);

            ctx.drawImage(tmp, cx, cy);
        }
        ctx.restore();
    }

    function _drawSoftCircle(ctx, cx, cy, sz, r, g, b) {
        var half = sz / 2;
        var grad = ctx.createRadialGradient(cx + half, cy + half, 0, cx + half, cy + half, half);
        grad.addColorStop(0, 'rgba(' + Math.round(r*255) + ',' + Math.round(g*255) + ',' + Math.round(b*255) + ',1)');
        grad.addColorStop(0.5, 'rgba(' + Math.round(r*255) + ',' + Math.round(g*255) + ',' + Math.round(b*255) + ',0.6)');
        grad.addColorStop(1, 'rgba(' + Math.round(r*255) + ',' + Math.round(g*255) + ',' + Math.round(b*255) + ',0)');
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + half, cy + half, half, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }

    function _extractAllSpriteTextures() {
        for (var key in _uvLookup) {
            _spriteTextures[key] = _extractSpriteTexture(key);
        }
    }

    function _extractSpriteTexture(spriteKey) {
        var uv = _uvLookup[spriteKey];
        if (!uv || !_atlasCanvas) return null;
        var px = Math.round(uv.u0 * ATLAS_SIZE);
        var py = Math.round(uv.v0 * ATLAS_SIZE);
        var cvs = document.createElement('canvas');
        cvs.width = ATLAS_CELL; cvs.height = ATLAS_CELL;
        var ctx = cvs.getContext('2d');
        ctx.drawImage(_atlasCanvas, px, py, ATLAS_CELL, ATLAS_CELL, 0, 0, ATLAS_CELL, ATLAS_CELL);
        var tex = new THREE.CanvasTexture(cvs);
        tex.premultiplyAlpha = false;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;

        tex._srcCanvas = cvs;
        tex._srcCtx = ctx;
        return tex;
    }

    function _refreshSpriteTexture(spriteKey) {
        var uv = _uvLookup[spriteKey];
        var tex = _spriteTextures[spriteKey];
        if (!uv || !tex || !_atlasCanvas) return;
        var px = Math.round(uv.u0 * ATLAS_SIZE);
        var py = Math.round(uv.v0 * ATLAS_SIZE);
        tex._srcCtx.clearRect(0, 0, ATLAS_CELL, ATLAS_CELL);
        tex._srcCtx.drawImage(_atlasCanvas, px, py, ATLAS_CELL, ATLAS_CELL, 0, 0, ATLAS_CELL, ATLAS_CELL);
        tex.needsUpdate = true;
    }

    function _loadImageSprites(ctx, cvs) {
        var keys = Object.keys(_imageDefs);
        _pendingImageCount = keys.length;
        for (var i = 0; i < keys.length; i++) {
            (function(sprKey) {
                var uv = _uvLookup[sprKey];
                if (!uv) { _pendingImageCount--; return; }
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    var col = Math.round(uv.u0 * ATLAS_COLS);
                    var row = Math.round(uv.v0 * ATLAS_COLS);
                    var cx2 = col * ATLAS_CELL;
                    var cy2 = row * ATLAS_CELL;
                    ctx.clearRect(cx2, cy2, ATLAS_CELL, ATLAS_CELL);
                    ctx.drawImage(img, cx2, cy2, ATLAS_CELL, ATLAS_CELL);
                    if (_atlasTexture) _atlasTexture.needsUpdate = true;

                    _refreshSpriteTexture(sprKey);

                    var hiCvs = document.createElement('canvas');
                    hiCvs.width = img.naturalWidth;
                    hiCvs.height = img.naturalHeight;
                    var hiCtx = hiCvs.getContext('2d');
                    hiCtx.drawImage(img, 0, 0);
                    var hiTex = new THREE.CanvasTexture(hiCvs);
                    hiTex.premultiplyAlpha = false;
                    hiTex.magFilter = THREE.NearestFilter;
                    hiTex.minFilter = THREE.LinearFilter;
                    hiTex.needsUpdate = true;
                    _hiResTextures[sprKey] = hiTex;

                    _pendingImageCount--;
                    if (_pendingImageCount === 0) {
                        console.log('[ThreeVFX] all image sprites loaded into atlas');
                    }
                };
                img.onerror = function() {
                    console.warn('[ThreeVFX] failed to load atlas image: ' + sprKey);
                    _pendingImageCount--;
                };
                img.src = window._ewCorsBust ? window._ewCorsBust(_imageDefs[sprKey]) : _imageDefs[sprKey];
            })(keys[i]);
        }
    }

    function _getUvRect(spriteKey) {
        return _uvLookup[spriteKey] || _uvLookup['ember'] || { u0: 0, v0: 0, u1: 0.125, v1: 0.125 };
    }

    function _getSpriteTexture(spriteKey) {

        return _hiResTextures[spriteKey] || _spriteTextures[spriteKey] || _spriteTextures['ember'] || null;
    }

    var _RAIN_MAX_DROPS = 50;
    var _RAIN_MAX_SPLASHES = 15;

    var _RAIN_CFG = {
        thunderstorm: {
            dropCount: 40, dropW: 1.5, dropH0: 18, dropH1: 32,
            fallSpeed: [450, 750], driftVx: [-15, 15], driftVz: [-8, 8],
            dropSprite: 'rain-drop',
            splashChance: 0.45, splashSprite: 'rain-splash',
            splashSize0: 4, splashSize1: 22, splashMs: [180, 320],
            skyHeight: 350, shapeMode: false,
        },
        hurricane: {
            dropCount: 50, dropW: 2, dropH0: 22, dropH1: 38,
            fallSpeed: [600, 1000], driftVx: [-50, -15], driftVz: [-20, 20],
            dropSprite: 'rain-drop',
            splashChance: 0.35, splashSprite: 'rain-splash',
            splashSize0: 5, splashSize1: 28, splashMs: [150, 280],
            skyHeight: 400, shapeMode: false,
        },
        bloodRain: {
            dropCount: 30, dropW: 1.2, dropH0: 12, dropH1: 24,
            fallSpeed: [300, 550], driftVx: [-8, 8], driftVz: [-5, 5],
            dropSprite: 'rain-drop-blood',
            splashChance: 0.55, splashSprite: 'rain-splash-blood',
            splashSize0: 3, splashSize1: 18, splashMs: [200, 360],
            skyHeight: 300, shapeMode: false,
        },
        tesseractStorm: {
            dropCount: 28, dropW: 0, dropH0: 0, dropH1: 0,
            shapeMode: true,
            shapeSprites: ['tess-tri', 'tess-circle', 'tess-square'],
            shapeSize: [10, 22], shapeSpin: [120, 400],
            fallSpeed: [180, 380], driftVx: [-25, 25], driftVz: [-15, 15],
            dropSprite: 'tess-tri',
            splashChance: 0.6, splashSprite: 'tess-splash',
            splashSize0: 6, splashSize1: 26, splashMs: [250, 420],
            skyHeight: 320,
        },
    };

    /* Tesseract-storm sprites render through the rain mesh pools (which
       bypass the particle blend table), so they get their additive blend +
       boosted cyan-green tint (>1 channels multiply up toward the storm's
       0x00ffc8) applied at spawn time — flat billboards become bloom-lit. */
    var _TESS_SPRITES = { 'tess-tri': 1, 'tess-circle': 1, 'tess-square': 1, 'tess-splash': 1 };

    var _rainDropMeshes = [];
    var _rainSplashMeshes = [];

    var _rainDrops = [];
    var _rainSplashes = [];
    var _rainActive = false;
    var _rainZones = [];
    var _rainTileIndex = null;
    var _rainBounds = null;

    var _tmpWorld = { x: 0, y: 0, z: 0 };
    var _SLAB_SURFACE_OFFSET = 3;

    function _vfxToWorld(px, py, pz) {
        var cfg = (typeof CONFIG !== 'undefined') ? CONFIG : { tileSize: 128, tileGap: 0, boardPadding: 2 };
        var pad = cfg.boardPadding || 2;
        _tmpWorld.x = px - pad;
        _tmpWorld.y = pz + _SLAB_SURFACE_OFFSET;
        _tmpWorld.z = py - pad;
        return _tmpWorld;
    }

    var _sharedPlaneGeo = null;

    function _createSpritePool(count) {
        var pool = [];
        for (var i = 0; i < count; i++) {
            var mat = new THREE.SpriteMaterial({
                map: null,
                color: 0xffffff,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending,
                alphaTest: 0.01,
                opacity: 0,
            });
            var sprite = new THREE.Sprite(mat);
            sprite.visible = false;
            sprite.frustumCulled = false;
            sprite.renderOrder = 100;
            _scene.add(sprite);
            pool.push({ sprite: sprite, material: mat, inUse: false });
        }
        return pool;
    }

    function _createMeshPool(count, renderOrder) {
        var pool = [];
        for (var i = 0; i < count; i++) {
            var mat = new THREE.MeshBasicMaterial({
                map: null,
                color: 0xffffff,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending,
                alphaTest: 0.01,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            var mesh = new THREE.Mesh(_sharedPlaneGeo, mat);
            mesh.visible = false;
            mesh.frustumCulled = false;
            mesh.renderOrder = renderOrder || 101;
            _scene.add(mesh);
            pool.push({ mesh: mesh, material: mat, inUse: false });
        }
        return pool;
    }

    /* ── 3D blood globs ──────────────────────────────────────────────────
       Blood spurts use REAL lumpy meshes with a glossy lit material instead
       of flat billboards, so they read as wet 3D liquid: they catch the
       sun/hemisphere light, show specular glints, tumble as they fly, and
       fast ones stretch along their velocity into whipping arterial jets.
       Four shared lumpy icosahedron variants keep the pool cheap. */
    var _globGeos = [];
    var _GLOB_COLOR_DEFAULT = 0xb00d0d;

    function _buildGlobGeos() {
        for (var v = 0; v < 4; v++) {
            var geo = new THREE.IcosahedronGeometry(0.5, 1);
            var pos = geo.attributes.position;
            for (var i = 0; i < pos.count; i++) {
                var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                /* continuous lump noise (same displacement for duplicated
                   verts → the hull stays watertight) */
                var n = 0.84 + 0.30 * Math.abs(
                    Math.sin(x * 5.1 + v * 7.3) * Math.cos(y * 4.7 - v * 3.1) +
                    Math.sin(z * 6.3 + v * 1.7) * 0.6);
                pos.setXYZ(i, x * n, y * n, z * n);
            }
            geo.computeVertexNormals();
            _globGeos.push(geo);
        }
    }

    function _createGlobPool(count) {
        var pool = [];
        for (var i = 0; i < count; i++) {
            var mat = new THREE.MeshStandardMaterial({
                color: _GLOB_COLOR_DEFAULT,
                roughness: 0.22, metalness: 0.0,
                emissive: 0x300303,
                transparent: true, opacity: 0,
            });
            var mesh = new THREE.Mesh(_globGeos[i % _globGeos.length], mat);
            mesh.visible = false;
            mesh.frustumCulled = false;
            mesh.renderOrder = 99;
            _scene.add(mesh);
            pool.push({ mesh: mesh, material: mat, inUse: false });
        }
        return pool;
    }

    function _claimFromPool(pool) {
        for (var i = 0; i < pool.length; i++) {
            if (!pool[i].inUse) return i;
        }
        return -1;
    }

    function _hideSprite(entry) {
        entry.sprite.visible = false;
        entry.sprite.position.set(0, -99999, 0);
        entry.material.opacity = 0;
        entry.inUse = false;
    }

    function _hideMesh(entry) {
        entry.mesh.visible = false;
        entry.mesh.position.set(0, -99999, 0);
        entry.material.opacity = 0;
        entry.inUse = false;
    }

    function init(scene) {
        if (_initialized) return;
        _scene = scene;

        _tmpQuat  = new THREE.Quaternion();
        _tmpQuat2 = new THREE.Quaternion();
        _tmpEuler = new THREE.Euler();
        _tmpVec   = new THREE.Vector3();
        _upVec    = new THREE.Vector3(0, 1, 0);

        _sharedPlaneGeo = new THREE.PlaneGeometry(1, 1);

        _buildAtlas();

        _spritePool = _createSpritePool(MAX_PARTICLES);
        _worldMeshPool = _createMeshPool(MAX_WORLD_QUADS, 101);
        _quadMeshPool  = _createMeshPool(MAX_QUAD_BILLBOARDS, 102);
        _buildGlobGeos();
        _globPool = _createGlobPool(MAX_BLOOD_GLOBS);

        for (var i = 0; i < MAX_PARTICLES; i++) {
            _particles.push({
                alive: false,
                poolType: null,
                slotIdx: -1,
                x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
                life: 0, ml: 500,
                size0: 16, size1: 16,
                w0: 0, w1: 0, h0: 0, h1: 0,
                opacity0: 1, opacity1: 0,
                gravity: 0, drag: 0,
                descent: false, _descFromZ: 0, _descToZ: 0, _descMs: 0, _ease: null,
                trail: null,
                sprite: 'ember', mode: 'billboard',
                _color: { r: 1, g: 1, b: 1 },
                _tint: null,
                _blend: 'add',
                onComplete: null,
                _trackHeading: false, _headingOffset: 0,
                _beamYawDeg: null, _beamPitchDeg: 0,
                _spriteRot: 0, _spriteSpin: 0,
                _uvRect: null,
                _gsx: 1, _gsy: 1, _gsz: 1,
                _rot0x: 0, _rot0y: 0, _rot0z: 0,
                _spinx: 0, _spiny: 0, _spinz: 0,
                _stretch: false,
                _seek: null, _orbit: null, _wander: null, _stretchVel: 0,
            });
        }

        _initialized = true;
        console.log('[ThreeVFX] initialized (standard materials) — sprites=' + MAX_PARTICLES +
                    ' worldQ=' + MAX_WORLD_QUADS + ' quadBB=' + MAX_QUAD_BILLBOARDS);
    }

    function _claim() {
        for (var i = 0; i < _particles.length; i++) {
            if (!_particles[i].alive) return _particles[i];
        }

        var oldest = _particles[0], oldF = -1;
        for (var j = 0; j < _particles.length; j++) {
            var f = _particles[j].life / _particles[j].ml;
            if (f > oldF) { oldF = f; oldest = _particles[j]; }
        }
        _release(oldest);
        return oldest;
    }

    function _release(p) {
        if (!p.alive) return;

        if (p.poolType === 'sprite' && p.slotIdx >= 0 && p.slotIdx < _spritePool.length) {
            _hideSprite(_spritePool[p.slotIdx]);
        } else if (p.poolType === 'world' && p.slotIdx >= 0 && p.slotIdx < _worldMeshPool.length) {
            _hideMesh(_worldMeshPool[p.slotIdx]);
        } else if (p.poolType === 'quad' && p.slotIdx >= 0 && p.slotIdx < _quadMeshPool.length) {
            _hideMesh(_quadMeshPool[p.slotIdx]);
        } else if (p.poolType === 'glob' && p.slotIdx >= 0 && p.slotIdx < _globPool.length) {
            _hideMesh(_globPool[p.slotIdx]);
        }

        p.alive = false;
        if (p._zone) _zoneAliveCount = Math.max(0, _zoneAliveCount - 1);
        p._zone = false;
        p.trail = null; p.onComplete = null; p.descent = false; p._ease = null;
        p._beamYawDeg = null; p._trackHeading = false; p._uvRect = null;
        p._tint = null;
        p._seek = null; p._orbit = null; p._wander = null; p._stretchVel = 0;
        p._spriteRot = 0; p._spriteSpin = 0;
        p.poolType = null; p.slotIdx = -1;
        _aliveCount = Math.max(0, _aliveCount - 1);
    }

    function spawn(opts) {
        if (!_initialized) return null;

        var sprite = opts.sprite || 'ember';
        var mode   = opts.mode   || 'billboard';
        var sc     = _spriteColor(sprite);
        var isWorld = (sc.blend === 'world' || mode === 'world');
        var isNonSquare = (opts.w0 != null || opts.h0 != null);
        var isGlob = (sprite === 'blood-glob');

        var poolType, slotIdx;

        if (isGlob) {
            poolType = 'glob';
            slotIdx = _claimFromPool(_globPool);
            if (slotIdx < 0) return null;
        } else if (isWorld) {
            poolType = 'world';
            slotIdx = _claimFromPool(_worldMeshPool);
            if (slotIdx < 0) return null;
        } else if (isNonSquare) {
            poolType = 'quad';
            slotIdx = _claimFromPool(_quadMeshPool);
            if (slotIdx < 0) return null;
        } else {
            poolType = 'sprite';
            slotIdx = _claimFromPool(_spritePool);
            if (slotIdx < 0) return null;
        }

        var p = _claim();
        p.alive = true;
        p.poolType = poolType; p.slotIdx = slotIdx;

        if (poolType === 'sprite') _spritePool[slotIdx].inUse = true;
        else if (poolType === 'world') _worldMeshPool[slotIdx].inUse = true;
        else if (poolType === 'quad') _quadMeshPool[slotIdx].inUse = true;
        else if (poolType === 'glob') {
            var gEntry = _globPool[slotIdx];
            gEntry.inUse = true;
            gEntry.mesh.geometry = _globGeos[Math.floor(Math.random() * _globGeos.length)];
            gEntry.material.color.setHex(opts.globColor != null ? opts.globColor : _GLOB_COLOR_DEFAULT);
            p._gsx = _rn(0.7, 1.35); p._gsy = _rn(0.7, 1.35); p._gsz = _rn(0.7, 1.35);
            p._rot0x = _rn(0, Math.PI * 2); p._rot0y = _rn(0, Math.PI * 2); p._rot0z = _rn(0, Math.PI * 2);
            p._spinx = _rn(-8, 8); p._spiny = _rn(-8, 8); p._spinz = _rn(-8, 8);
            p._stretch = !!opts.stretch;
        }

        p.x = opts.x || 0; p.y = opts.y || 0; p.z = opts.z || 0;
        p.vx = opts.vx || 0; p.vy = opts.vy || 0; p.vz = opts.vz || 0;
        p.life = 0; p.ml = Math.max(1, opts.ml || 500);
        p._zone = !!opts._zone;

        if (isNonSquare) {
            p.w0 = opts.w0 != null ? opts.w0 : (opts.size0 || 16);
            p.h0 = opts.h0 != null ? opts.h0 : (opts.size0 || 16);
            p.w1 = opts.w1 != null ? opts.w1 : (opts.size1 != null ? opts.size1 : p.w0);
            p.h1 = opts.h1 != null ? opts.h1 : (opts.size1 != null ? opts.size1 : p.h0);
            p.size0 = 0; p.size1 = 0;
            if (Array.isArray(p.w0)) p.w0 = _rangePick(p.w0);
            if (Array.isArray(p.h0)) p.h0 = _rangePick(p.h0);
            if (Array.isArray(p.w1)) p.w1 = _rangePick(p.w1);
            if (Array.isArray(p.h1)) p.h1 = _rangePick(p.h1);
        } else {
            p.size0 = opts.size0 != null ? opts.size0 : 16;
            p.size1 = opts.size1 != null ? opts.size1 : p.size0;
            p.w0 = 0; p.w1 = 0; p.h0 = 0; p.h1 = 0;
        }

        p.opacity0 = opts.opacity0 != null ? opts.opacity0 : 1;
        p.opacity1 = opts.opacity1 != null ? opts.opacity1 : 0;
        p.gravity = opts.gravity || 0;
        p.drag    = opts.drag    || 0;
        p.sprite = sprite; p.mode = mode; p._color = sc; p._blend = sc.blend;
        // Per-particle TINT. The pool hands every particle its own material,
        // so a colour multiplier costs nothing and finally lets one sprite
        // shape serve many spells: `flash` is a warm-white blob until a
        // psychic spell tints it magenta and an ice spell tints it cyan.
        // Normalized to a peak channel of ~1.12 (see _normTint) so tinting
        // recolours a particle instead of just dimming it.
        p._tint = opts.tint != null ? _normTint(opts.tint) : null;
        /* Tumble: cloud/debris billboards pick up a random facing + slow
           spin by default (shaped textures made identical-rotation spam
           obvious). Explicit spriteRot/spriteSpin always wins; flame
           tongues, glints and rings are NOT in the auto set on purpose. */
        p._spriteRot = opts.spriteRot != null ? opts.spriteRot
                     : (_AUTO_TUMBLE[sprite] ? _rn(0, 360) : 0);
        p._spriteSpin = opts.spriteSpin != null ? _rangePick(opts.spriteSpin)
                      : (_AUTO_TUMBLE[sprite] ? _rn(-55, 55) : 0);
        p._uvRect = _getUvRect(sprite);

        if (sprite === 'wave-1' || sprite === 'wave-anim') {
            p._animFrames = _WAVE_FRAMES;
            p._animIdx = Math.floor(Math.random() * _WAVE_FRAMES.length);
            p._animAcc = Math.random() * _WAVE_FRAME_MS;
            p.sprite = _WAVE_FRAMES[p._animIdx];
            p._uvRect = _getUvRect(p.sprite);
        } else {
            p._animFrames = null;
        }

        if (opts.descent) {
            p.descent = true;
            p._descFromZ = opts.descent.fromZ != null ? opts.descent.fromZ : p.z;
            p._descToZ   = opts.descent.toZ   != null ? opts.descent.toZ   : p.z;
            p._descMs    = opts.descent.ms || p.ml;
            p._ease      = opts.descent.ease || 'easeIn';
            p.z          = p._descFromZ;
            if (opts.descent.trail) {
                p.trail = { accMs: 0, sprite: opts.descent.trail.sprite || 'ember',
                            rateMs: opts.descent.trail.rateMs || 50,
                            jitter: opts.descent.trail.jitter || 4,
                            sizeRange: opts.descent.trail.sizeRange || [10, 18],
                            msRange: opts.descent.trail.msRange || [300, 600] };
            }
        } else { p.descent = false; }

        if (opts.trail && !opts.descent) {
            p.trail = { accMs: 0, sprite: opts.trail.sprite || 'ember',
                        rateMs: opts.trail.rateMs || 50,
                        jitter: opts.trail.jitter || 4,
                        sizeRange: opts.trail.sizeRange || [10, 18],
                        msRange: opts.trail.msRange || [300, 600] };
        }

        /* ── Parametric motion paths (2026-07-26, ported from the wawa-vfx /
           three-nebula playbook) ─────────────────────────────────────────
           seek  — REVERSE EMITTER: the particle spawns wherever opts.x/y/z
                   put it and travels INTO seek.{x,y,z} over seek.ms with an
                   ease, optionally sweeping seek.spiralDeg degrees around
                   the destination on the way in (charge-up spirals). After
                   arrival it holds at the destination until ml expires.
           orbit — circle a center: {x,y,z, r0,r1, degPerSec, phase, zRate,
                   bobAmp, bobHz}. Radius lerps r0→r1 over the LIFETIME.
           wander— brownian drift à la nebula's RandomDrift: adds a smooth
                   sin/cos velocity perturbation {amp, freq} so smoke/snow
                   stops moving in dead-straight lines.
           All three are opt-in and cost nothing when unset. seek/orbit own
           the particle's position (physics is skipped, like descent). */
        if (opts.seek) {
            p._seek = {
                x: opts.seek.x || 0, y: opts.seek.y || 0,
                z: opts.seek.z != null ? opts.seek.z : p.z,
                ms: Math.max(1, opts.seek.ms || p.ml),
                ease: opts.seek.ease || 'in',
                spiral: (opts.seek.spiralDeg || 0) * Math.PI / 180,
                sx: p.x, sy: p.y, sz: p.z,
            };
        } else { p._seek = null; }
        if (opts.orbit) {
            p._orbit = {
                x: opts.orbit.x || 0, y: opts.orbit.y || 0,
                z: opts.orbit.z != null ? opts.orbit.z : p.z,
                r0: opts.orbit.r0 != null ? opts.orbit.r0 : 40,
                r1: opts.orbit.r1 != null ? opts.orbit.r1 : (opts.orbit.r0 != null ? opts.orbit.r0 : 40),
                spd: (opts.orbit.degPerSec != null ? opts.orbit.degPerSec : 180) * Math.PI / 180,
                phase: opts.orbit.phase != null ? opts.orbit.phase : Math.random() * Math.PI * 2,
                zRate: opts.orbit.zRate || 0,
                bobAmp: opts.orbit.bobAmp || 0,
                bobHz: opts.orbit.bobHz || 1.6,
            };
        } else { p._orbit = null; }
        if (opts.wander) {
            p._wander = {
                amp: opts.wander.amp != null ? opts.wander.amp : 40,
                freq: opts.wander.freq != null ? opts.wander.freq : 1.1,
                ph1: Math.random() * Math.PI * 2,
                ph2: Math.random() * Math.PI * 2,
            };
        } else { p._wander = null; }
        /* stretchVel: quad-pool speed lines — the quad's LONG axis (w) keeps
           tracking the velocity heading and its length becomes speed×k, so
           fast particles smear into streaks (wawa-vfx "stretch billboard"). */
        p._stretchVel = opts.stretchVel || 0;

        p.onComplete = opts.onComplete || null;
        p._trackHeading = !!opts.trackHeading;
        p._headingOffset = opts.headingOffset || 0;
        p._beamYawDeg  = (opts.beamYawDeg != null) ? opts.beamYawDeg : null;
        p._beamPitchDeg = opts.beamPitchDeg || 0;

        if (p._trackHeading && (p.vx !== 0 || p.vy !== 0 || p.vz !== 0)) {
            var hYaw0 = Math.atan2(p.vy, p.vx);
            var hPitch0 = Math.atan2(p.vz, Math.sqrt(p.vx * p.vx + p.vy * p.vy));
            p._beamYawDeg = -(hYaw0 * 180 / Math.PI) + p._headingOffset;
            p._beamPitchDeg = hPitch0 * 180 / Math.PI;
        }

        _setupMaterial(p);

        _aliveCount++;
        if (p._zone) _zoneAliveCount++;

        if (_debugSpawns > 0) {
            _debugSpawns--;
            var w = _vfxToWorld(p.x, p.y, p.z);
            console.log('[ThreeVFX] spawn #' + (10 - _debugSpawns) +
                        ' sprite=' + sprite + ' type=' + poolType +
                        ' vfx(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ',' + p.z.toFixed(1) + ')' +
                        ' → world(' + w.x.toFixed(1) + ',' + w.y.toFixed(1) + ',' + w.z.toFixed(1) + ')');
        }

        _writeParticle(p);
        return p;
    }

    function _setupMaterial(p) {
        var tex = _getSpriteTexture(p.sprite);
        var isAdd = (p._blend === 'add');
        var blending = isAdd ? THREE.AdditiveBlending : THREE.NormalBlending;

        if (p.poolType === 'sprite') {
            var entry = _spritePool[p.slotIdx];
            entry.material.map = tex;
            entry.material.blending = blending;
            entry.material.needsUpdate = true;
            entry.sprite.visible = true;
        } else if (p.poolType === 'world') {
            var wEntry = _worldMeshPool[p.slotIdx];
            wEntry.material.map = tex;
            wEntry.material.blending = isAdd ? THREE.AdditiveBlending : THREE.NormalBlending;
            wEntry.material.needsUpdate = true;
            wEntry.mesh.visible = true;
        } else if (p.poolType === 'quad') {
            var qEntry = _quadMeshPool[p.slotIdx];
            qEntry.material.map = tex;
            qEntry.material.blending = blending;
            qEntry.material.needsUpdate = true;
            qEntry.mesh.visible = true;
        } else if (p.poolType === 'glob') {
            /* lit solid mesh — no sprite texture / blend table involved */
            _globPool[p.slotIdx].mesh.visible = true;
        }
    }

    function _lerp(a, b, t) { return a + (b - a) * t; }

    function _writeParticle(p) {
        if (p.poolType === 'sprite') _writeSprite(p);
        else if (p.poolType === 'world') _writeWorldMesh(p);
        else if (p.poolType === 'quad') _writeQuadMesh(p);
        else if (p.poolType === 'glob') _writeGlobMesh(p);
    }

    function _writeGlobMesh(p) {
        var entry = _globPool[p.slotIdx];
        if (!entry) return;
        var t = Math.min(1, p.life / p.ml);
        var w = _vfxToWorld(p.x, p.y, p.z);
        var mesh = entry.mesh;
        mesh.position.set(w.x, w.y, w.z);

        var sz = _lerp(p.size0, p.size1, t);
        var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);

        if (p._stretch && speed > 50) {
            /* fast glob → orient along velocity and stretch into a liquid
               jet (volume-preserving squash on the other two axes) */
            var st = Math.min(2.6, 1 + speed / 280);
            _tmpVec.set(p.vx / speed, p.vz / speed, p.vy / speed);
            mesh.quaternion.setFromUnitVectors(_upVec, _tmpVec);
            var sq = 1 / Math.sqrt(st);
            mesh.scale.set(sz * p._gsx * sq, sz * p._gsy * st, sz * p._gsz * sq);
        } else {
            var lt = p.life / 1000;
            mesh.quaternion.setFromEuler(_tmpEuler.set(
                p._rot0x + p._spinx * lt,
                p._rot0y + p._spiny * lt,
                p._rot0z + p._spinz * lt));
            mesh.scale.set(sz * p._gsx, sz * p._gsy, sz * p._gsz);
        }

        var op = _lerp(p.opacity0, p.opacity1, t);
        entry.material.opacity = op;
        mesh.visible = (op > 0.001);
    }

    function _writeSprite(p) {
        var entry = _spritePool[p.slotIdx];
        if (!entry) return;
        var t = Math.min(1, p.life / p.ml);
        var w = _vfxToWorld(p.x, p.y, p.z);

        entry.sprite.position.set(w.x, w.y, w.z);

        var sz = _lerp(p.size0, p.size1, t);
        entry.sprite.scale.set(sz, sz, 1);

        if (p._spriteRot || p._spriteSpin) {
            entry.material.rotation = (p._spriteRot + p._spriteSpin * (p.life / 1000)) * 0.017453293;
        } else if (entry.material.rotation !== 0) {
            entry.material.rotation = 0;
        }

        var op = _lerp(p.opacity0, p.opacity1, t);
        entry.material.opacity = op;

        var hasAtlasShape = !!(_gradientDefs[p.sprite] || _imageDefs[p.sprite]);
        if (p._tint) {
            entry.material.color.setRGB(p._tint.r, p._tint.g, p._tint.b);
        } else if (hasAtlasShape) {
            entry.material.color.setRGB(1, 1, 1);
        } else {
            entry.material.color.setRGB(p._color.r, p._color.g, p._color.b);
        }

        entry.sprite.visible = (op > 0.001);
    }

    function _writeWorldMesh(p) {
        var entry = _worldMeshPool[p.slotIdx];
        if (!entry) return;
        var t = Math.min(1, p.life / p.ml);
        var w = _vfxToWorld(p.x, p.y, p.z);

        var sw, sh;
        if (p.w0 || p.h0) {
            sw = _lerp(p.w0, p.w1, t);
            sh = _lerp(p.h0, p.h1, t);
        } else {
            sw = _lerp(p.size0, p.size1, t);
            sh = sw;
        }

        var mesh = entry.mesh;
        mesh.position.set(w.x, w.y + 0.5, w.z);

        mesh.rotation.set(-Math.PI / 2, 0, 0);
        if (p._spriteRot || p._spriteSpin) {
            mesh.rotation.set(-Math.PI / 2, 0,
                (p._spriteRot + p._spriteSpin * (p.life / 1000)) * Math.PI / 180);
        }

        mesh.scale.set(sw, sh, 1);

        var op = _lerp(p.opacity0, p.opacity1, t);
        entry.material.opacity = op;

        var hasAtlasShape = !!(_gradientDefs[p.sprite] || _imageDefs[p.sprite]);
        if (p._tint) {
            entry.material.color.setRGB(p._tint.r, p._tint.g, p._tint.b);
        } else if (hasAtlasShape) {
            entry.material.color.setRGB(1, 1, 1);
        } else {
            entry.material.color.setRGB(p._color.r, p._color.g, p._color.b);
        }

        mesh.visible = (op > 0.001);
    }

    function _writeQuadMesh(p) {
        var entry = _quadMeshPool[p.slotIdx];
        if (!entry) return;
        var t = Math.min(1, p.life / p.ml);
        var w = _vfxToWorld(p.x, p.y, p.z);
        var cw = _lerp(p.w0, p.w1, t);
        var ch = _lerp(p.h0, p.h1, t);

        if (p._stretchVel > 0) {
            /* stretch-billboard: length rides the live speed so streaks smear
               when fast and collapse to their base size as they slow */
            var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
            cw = Math.max(cw, Math.min(spd * p._stretchVel, cw * 8));
        }

        var mesh = entry.mesh;
        mesh.position.set(w.x, w.y, w.z);

        if (p._beamYawDeg != null) {

            var yawRad   = p._beamYawDeg * Math.PI / 180;
            var pitchRad = (p._beamPitchDeg || 0) * Math.PI / 180;
            _tmpEuler.set(pitchRad, -yawRad, 0, 'YXZ');
            mesh.quaternion.setFromEuler(_tmpEuler);
        } else if (p.mode === 'y-locked') {

            var cam = (typeof ThreeCamera !== 'undefined') ? ThreeCamera.getCamera() : null;
            if (cam) {
                var camDir_x = -(cam.matrixWorld.elements[8]);
                var camDir_z = -(cam.matrixWorld.elements[10]);
                var yRot = Math.atan2(camDir_x, camDir_z);
                mesh.quaternion.setFromAxisAngle(_tmpVec.set(0, 1, 0), yRot);
            } else {
                mesh.quaternion.identity();
            }
        } else {

            var cam2 = (typeof ThreeCamera !== 'undefined') ? ThreeCamera.getCamera() : null;
            if (cam2) { mesh.quaternion.copy(cam2.quaternion); }
            else { mesh.quaternion.identity(); }
        }

        if (p._spriteRot || p._spriteSpin) {
            _tmpQuat2.setFromAxisAngle(_tmpVec.set(0, 0, 1),
                (p._spriteRot + p._spriteSpin * (p.life / 1000)) * Math.PI / 180);
            mesh.quaternion.multiply(_tmpQuat2);
        }

        mesh.scale.set(cw, ch, 1);

        var op = _lerp(p.opacity0, p.opacity1, t);
        entry.material.opacity = op;

        var hasAtlasShape = !!(_gradientDefs[p.sprite] || _imageDefs[p.sprite]);
        if (p._tint) {
            entry.material.color.setRGB(p._tint.r, p._tint.g, p._tint.b);
        } else if (hasAtlasShape) {
            entry.material.color.setRGB(1, 1, 1);
        } else {
            entry.material.color.setRGB(p._color.r, p._color.g, p._color.b);
        }

        mesh.visible = (op > 0.001);
    }

    function _easeIn(t)  { return t * t; }
    function _easeOut(t) { return 1 - (1 - t) * (1 - t); }
    function _rn(lo, hi) { return lo + Math.random() * (hi - lo); }
    function _rangePick(r) { return Array.isArray(r) ? _rn(r[0], r[1]) : r; }

    function tick(dt) {
        if (!_initialized) return;

        _rainTick(dt);
        _ambientTick(dt);

        if (window.ThreeVFXEffects && window.ThreeVFXEffects.tick) {
            window.ThreeVFXEffects.tick(dt);
        }

        if (_aliveCount === 0) return;

        for (var i = 0; i < _particles.length; i++) {
            var p = _particles[i];
            if (!p.alive) continue;

            p.life += dt * 1000;
            var t = Math.min(1, p.life / p.ml);

            if (p.descent) {
                var descT = Math.min(1, p.life / p._descMs);
                var eased = (p._ease === 'easeIn') ? _easeIn(descT)
                          : (p._ease === 'easeOut') ? _easeOut(descT) : descT;
                p.z = _lerp(p._descFromZ, p._descToZ, eased);

                if (p.trail) {
                    p.trail.accMs += dt * 1000;
                    while (p.trail.accMs >= p.trail.rateMs) {
                        p.trail.accMs -= p.trail.rateMs;
                        var jx = _rn(-p.trail.jitter, p.trail.jitter);
                        var jy = _rn(-p.trail.jitter, p.trail.jitter);
                        var jz = _rn(-p.trail.jitter, p.trail.jitter);
                        spawn({
                            x: p.x + jx, y: p.y + jy, z: p.z + jz,
                            mode: 'billboard', sprite: p.trail.sprite,
                            ml: _rangePick(p.trail.msRange),
                            size0: _rangePick(p.trail.sizeRange), size1: 0,
                            opacity0: 0.9, opacity1: 0,
                            vz: _rn(-30, 30), drag: 1.2,
                        });
                    }
                }
            } else if (p._seek) {
                /* reverse emitter: parametric travel INTO the destination,
                   optionally spiralling around it as the radius closes */
                var sk = p._seek;
                var skT = Math.min(1, p.life / sk.ms);
                var skE = (sk.ease === 'out') ? _easeOut(skT)
                        : (sk.ease === 'inOut') ? (skT * skT * (3 - 2 * skT))
                        : _easeIn(skT);
                var shrink = 1 - skE;
                var ox = sk.sx - sk.x, oy = sk.sy - sk.y, oz = sk.sz - sk.z;
                if (sk.spiral) {
                    var sa = sk.spiral * skE;
                    var sc = Math.cos(sa), ss = Math.sin(sa);
                    var rox = ox * sc - oy * ss;
                    var roy = ox * ss + oy * sc;
                    ox = rox; oy = roy;
                }
                p.x = sk.x + ox * shrink;
                p.y = sk.y + oy * shrink;
                p.z = sk.z + oz * shrink;
            } else if (p._orbit) {
                var ob = p._orbit;
                var obSec = p.life / 1000;
                var obAng = ob.phase + ob.spd * obSec;
                var obR = _lerp(ob.r0, ob.r1, t);
                p.x = ob.x + Math.cos(obAng) * obR;
                p.y = ob.y + Math.sin(obAng) * obR;
                p.z = ob.z + ob.zRate * obSec
                    + (ob.bobAmp ? Math.sin(obSec * ob.bobHz * 6.2832 + ob.phase) * ob.bobAmp : 0);
            } else {
                if (p._wander) {
                    /* smooth brownian drift (nebula RandomDrift): perturb the
                       VELOCITY, never the position, so paths stay continuous */
                    var wd = p._wander;
                    var wt = (p.life / 1000) * wd.freq * 6.2832;
                    p.vx += Math.sin(wt + wd.ph1) * wd.amp * dt;
                    p.vy += Math.cos(wt * 0.83 + wd.ph2) * wd.amp * dt;
                    p.vz += Math.sin(wt * 0.61 + wd.ph1 * 1.7) * wd.amp * 0.5 * dt;
                }
                var dm = Math.max(0, 1 - p.drag * dt);
                p.vx *= dm; p.vy *= dm; p.vz *= dm;
                p.vz -= p.gravity * dt;
                p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            }

            if (p._trackHeading && (p.vx !== 0 || p.vy !== 0 || p.vz !== 0)) {
                var hYaw = Math.atan2(p.vy, p.vx);
                var hPitch = Math.atan2(p.vz, Math.sqrt(p.vx * p.vx + p.vy * p.vy));
                p._beamYawDeg = -(hYaw * 180 / Math.PI) + p._headingOffset;
                p._beamPitchDeg = hPitch * 180 / Math.PI;
            }

            if (p._animFrames) {
                p._animAcc += dt * 1000;
                if (p._animAcc >= _WAVE_FRAME_MS) {
                    p._animAcc -= _WAVE_FRAME_MS;
                    p._animIdx = (p._animIdx + 1) % p._animFrames.length;
                    var newSpr = p._animFrames[p._animIdx];
                    p.sprite = newSpr;
                    p._uvRect = _getUvRect(newSpr);
                    var newTex = _getSpriteTexture(newSpr);
                    if (newTex) {
                        if (p.poolType === 'sprite' && _spritePool[p.slotIdx]) {
                            _spritePool[p.slotIdx].material.map = newTex;
                            _spritePool[p.slotIdx].material.needsUpdate = true;
                        } else if (p.poolType === 'world' && _worldMeshPool[p.slotIdx]) {
                            _worldMeshPool[p.slotIdx].material.map = newTex;
                            _worldMeshPool[p.slotIdx].material.needsUpdate = true;
                        } else if (p.poolType === 'quad' && _quadMeshPool[p.slotIdx]) {
                            _quadMeshPool[p.slotIdx].material.map = newTex;
                            _quadMeshPool[p.slotIdx].material.needsUpdate = true;
                        }
                    }
                }
            }

            _writeParticle(p);

            if (t >= 1) {
                var cb = p.onComplete;
                _release(p);
                if (cb) try { cb(); } catch (e) {  }
            }
        }
    }

    // ── Ambient atmosphere: dust motes (day) + fireflies (night) ────────
    // Two GPU-animated THREE.Points clouds that live over the battlefield and
    // crossfade with the day/night cycle. All motion (drift loops, firefly
    // blink) runs in the vertex shader off uTime — zero per-frame CPU work
    // beyond a handful of uniform writes. Density is a pause-menu slider
    // (`ew_ambientFx`, ThreeVFX.setAmbientDensity, 0 = off); it gates
    // particles per-fragment via each point's aRand, so the slider thins the
    // clouds smoothly instead of popping whole systems.
    var _ambDensity = 0.3;
    try {
        var _ambSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_ambientFx') : null;
        if (_ambSaved !== null) {
            var _av = parseFloat(_ambSaved);
            if (!isNaN(_av)) _ambDensity = Math.max(0, Math.min(1, _av));
        // Low performance mode (mobile): thinner ambient clouds by default.
        } else if (typeof window !== 'undefined' && window.EW_PERF_LOW) {
            _ambDensity = 0.15;
        }
    } catch (e) {}
    var _ambMotes = null, _ambFlies = null;   // { points, geo, mat }
    var _ambKey = '';
    var _ambNight = 0;                        // lerped: 0 = day, 1 = night
    var _ambTime = 0;
    var _ambCanvasEl = null;

    var _AMB_VERT = [
        'attribute float aPhase;',
        'attribute float aSpeed;',
        'attribute vec3 aAmp;',
        'attribute float aSize;',
        'attribute float aRand;',
        'uniform float uTime;',
        'uniform float uScale;',
        'uniform float uBlink;',
        'varying float vBright;',
        'varying float vRand;',
        'void main() {',
        '  vRand = aRand;',
        '  float t = uTime * aSpeed + aPhase;',
        '  vec3 p = position;',
        // layered sin/cos loops read as organic wandering, and (unlike a
        // linear drift) never need wrapping
        '  p.x += sin(t * 0.31) * aAmp.x + sin(t * 0.83 + aPhase * 2.7) * aAmp.x * 0.35;',
        '  p.y += sin(t * 0.47 + aPhase * 1.3) * aAmp.y;',
        '  p.z += cos(t * 0.28) * aAmp.z + cos(t * 0.71 + aPhase * 3.1) * aAmp.z * 0.3;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * uScale / max(1.0, -mv.z);',
        '  gl_Position = projectionMatrix * mv;',
        // firefly blink: mostly dark, brief soft pulses, desynced per particle
        '  float blink = smoothstep(0.45, 0.95, sin(uTime * (0.6 + fract(aPhase) * 0.9) + aPhase * 7.0) * 0.5 + 0.5);',
        '  vBright = mix(1.0, blink, uBlink);',
        '}'
    ].join('\n');

    var _AMB_FRAG = [
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform float uOpacity;',
        'uniform float uDensity;',
        'varying float vBright;',
        'varying float vRand;',
        'void main() {',
        '  if (vRand > uDensity) discard;',
        '  vec2 c = gl_PointCoord - 0.5;',
        '  float d = length(c) * 2.0;',
        '  float a = smoothstep(1.0, 0.15, d);',
        '  float alpha = a * uOpacity * vBright;',
        '  if (alpha < 0.004) discard;',
        '  vec3 col = mix(uColorA, uColorB, vRand);',
        '  gl_FragColor = vec4(col * vBright, alpha);',
        '}'
    ].join('\n');

    function _ambDisposeCloud(cloud) {
        if (!cloud) return;
        if (_scene && cloud.points) _scene.remove(cloud.points);
        if (cloud.geo) cloud.geo.dispose();
        if (cloud.mat) cloud.mat.dispose();
    }

    // opts: { count, colorA, colorB, blink, sizeLo, sizeHi (world px),
    //         ampXZ [lo,hi], ampY [lo,hi], yLo, yHi (× tileSize above terrain),
    //         speedLo, speedHi }
    function _ambBuildCloud(bwT, bhT, ts, opts) {
        var n = opts.count;
        var pos = new Float32Array(n * 3);
        var phase = new Float32Array(n);
        var speed = new Float32Array(n);
        var amp = new Float32Array(n * 3);
        var size = new Float32Array(n);
        var rand = new Float32Array(n);
        for (var i = 0; i < n; i++) {
            var tx = Math.floor(Math.random() * bwT);
            var ty = Math.floor(Math.random() * bhT);
            var topY = _rainTileTopY(tx, ty);
            pos[i * 3]     = (tx + Math.random()) * ts;
            pos[i * 3 + 1] = topY + ts * (opts.yLo + Math.random() * (opts.yHi - opts.yLo));
            pos[i * 3 + 2] = (ty + Math.random()) * ts;
            phase[i] = Math.random() * 6.28318;
            speed[i] = opts.speedLo + Math.random() * (opts.speedHi - opts.speedLo);
            var aXZ = ts * (opts.ampXZ[0] + Math.random() * (opts.ampXZ[1] - opts.ampXZ[0]));
            amp[i * 3]     = aXZ;
            amp[i * 3 + 1] = ts * (opts.ampY[0] + Math.random() * (opts.ampY[1] - opts.ampY[0]));
            amp[i * 3 + 2] = aXZ * (0.7 + Math.random() * 0.6);
            size[i] = ts * (opts.sizeLo + Math.random() * (opts.sizeHi - opts.sizeLo));
            rand[i] = Math.random();
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
        geo.setAttribute('aAmp', new THREE.BufferAttribute(amp, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
        geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
        var mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime:    { value: 0 },
                uScale:   { value: 800 },
                uBlink:   { value: opts.blink ? 1.0 : 0.0 },
                uColorA:  { value: new THREE.Color(opts.colorA) },
                uColorB:  { value: new THREE.Color(opts.colorB) },
                uOpacity: { value: 0 },
                uDensity: { value: _ambDensity }
            },
            vertexShader: _AMB_VERT,
            fragmentShader: _AMB_FRAG,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending
        });
        var points = new THREE.Points(geo, mat);
        points.frustumCulled = false;   // cloud spans the board; skip per-frame sphere math
        points.renderOrder = 60;
        points._ew_ambient = true;
        _scene.add(points);
        return { points: points, geo: geo, mat: mat };
    }

    function _ambientTick(dt) {
        if (!_scene) return;
        var haveBoard = (typeof bw === 'function' && typeof bh === 'function');
        var bwT = haveBoard ? bw() : 0, bhT = haveBoard ? bh() : 0;
        var ts = (typeof CONFIG !== 'undefined' && CONFIG.tileSize) ? CONFIG.tileSize : 128;
        var inBattle = (typeof state !== 'undefined' && state && state.phase === 'battle');
        if (!inBattle || !bwT || !bhT || _ambDensity <= 0) {
            if (_ambMotes) _ambMotes.points.visible = false;
            if (_ambFlies) _ambFlies.points.visible = false;
            return;
        }

        var key = bwT + 'x' + bhT + 'x' + ts;
        if (key !== _ambKey) {
            _ambDisposeCloud(_ambMotes);
            _ambDisposeCloud(_ambFlies);
            var area = bwT * bhT;
            _ambMotes = _ambBuildCloud(bwT, bhT, ts, {
                count: Math.min(420, Math.round(area * 1.1) + 30),
                colorA: 0xfff6dd, colorB: 0xd8e2f0, blink: false,
                sizeLo: 0.028, sizeHi: 0.055,
                ampXZ: [0.18, 0.42], ampY: [0.10, 0.30],
                yLo: 0.25, yHi: 2.3,
                speedLo: 0.35, speedHi: 0.8
            });
            _ambFlies = _ambBuildCloud(bwT, bhT, ts, {
                count: Math.min(180, Math.round(area * 0.45) + 12),
                colorA: 0xb8ff5e, colorB: 0xffe066, blink: true,
                sizeLo: 0.06, sizeHi: 0.11,
                ampXZ: [0.45, 1.1], ampY: [0.12, 0.35],
                yLo: 0.2, yHi: 0.95,
                speedLo: 0.5, speedHi: 1.1
            });
            _ambKey = key;
        }

        _ambTime += dt;
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var tgt = (cycle === 'night') ? 1 : 0;
        _ambNight += (tgt - _ambNight) * Math.min(1, dt * 1.5);

        if (!_ambCanvasEl) _ambCanvasEl = document.getElementById('threeCanvas');
        var scale = (_ambCanvasEl && _ambCanvasEl.height) ? _ambCanvasEl.height : 800;

        var moteOp = 0.5 * (1 - _ambNight * 0.75);   // faint dust lingers at night
        var flyOp = 0.95 * _ambNight;                // fireflies are night-only
        if (_ambMotes) {
            var mu = _ambMotes.mat.uniforms;
            mu.uTime.value = _ambTime; mu.uScale.value = scale;
            mu.uOpacity.value = moteOp; mu.uDensity.value = _ambDensity;
            _ambMotes.points.visible = moteOp > 0.02;
        }
        if (_ambFlies) {
            var fu = _ambFlies.mat.uniforms;
            fu.uTime.value = _ambTime; fu.uScale.value = scale;
            fu.uOpacity.value = flyOp; fu.uDensity.value = _ambDensity;
            _ambFlies.points.visible = flyOp > 0.02;
        }
    }

    function setAmbientDensity(v) {
        var s = parseFloat(v);
        if (isNaN(s)) return;
        _ambDensity = Math.max(0, Math.min(1, s));
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('ew_ambientFx', String(_ambDensity)); } catch (e) {}
    }
    function getAmbientDensity() { return _ambDensity; }

    function _rainTileTopY(tx, ty) {
        var ts = (typeof CONFIG !== 'undefined' && CONFIG.tileSize) ? CONFIG.tileSize : 128;
        var h = (typeof getHeightAt === 'function') ? getHeightAt(tx, ty) : 0;
        var hPx = (typeof window._getElevationPx === 'function') ? window._getElevationPx(h) : h * ts;
        return Math.max(2, hPx);
    }

    function _rainInitPools() {
        if (_rainDropMeshes.length > 0) return;

        for (var i = 0; i < _RAIN_MAX_DROPS; i++) {
            var dMat = new THREE.MeshBasicMaterial({
                map: null,
                color: 0xffffff,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                blending: THREE.NormalBlending,
                alphaTest: 0.01,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            var dMesh = new THREE.Mesh(_sharedPlaneGeo, dMat);
            dMesh.visible = false;
            dMesh.frustumCulled = false;
            dMesh.renderOrder = 103;
            _scene.add(dMesh);
            _rainDropMeshes.push({ mesh: dMesh, material: dMat, inUse: false });
        }

        for (var j = 0; j < _RAIN_MAX_SPLASHES; j++) {
            var sMat = new THREE.MeshBasicMaterial({
                map: null,
                color: 0xffffff,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                blending: THREE.NormalBlending,
                alphaTest: 0.01,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            var sMesh = new THREE.Mesh(_sharedPlaneGeo, sMat);
            sMesh.visible = false;
            sMesh.frustumCulled = false;
            sMesh.renderOrder = 103;
            _scene.add(sMesh);
            _rainSplashMeshes.push({ mesh: sMesh, material: sMat, inUse: false });
        }

        for (var ii = 0; ii < _RAIN_MAX_DROPS; ii++) {
            _rainDrops.push({
                alive: false, x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0, groundY: 0,
                cfgType: null, zoneIdx: 0,
                spinDeg: 0, spinSpeed: 0,
                w: 1, h: 20, spriteKey: 'rain-drop', slotIdx: ii,
            });
        }
        for (var jj = 0; jj < _RAIN_MAX_SPLASHES; jj++) {
            _rainSplashes.push({
                alive: false, x: 0, y: 0, z: 0,
                life: 0, ml: 250, size0: 4, size1: 20,
                spriteKey: 'rain-splash', slotIdx: jj,
            });
        }
    }

    function _rainBuildIndex(zones) {
        _rainTileIndex = new Map();
        var ts = (typeof CONFIG !== 'undefined' && CONFIG.tileSize) ? CONFIG.tileSize : 128;
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (var zi = 0; zi < zones.length; zi++) {
            var tiles = zones[zi].tiles;
            for (var ti = 0; ti < tiles.length; ti++) {
                var t = tiles[ti];
                var key = t.x + ',' + t.y;
                if (!_rainTileIndex.has(key)) {
                    _rainTileIndex.set(key, _rainTileTopY(t.x, t.y));
                }
                var wx = t.x * ts;
                var wz = t.y * ts;
                if (wx - ts/2 < minX) minX = wx - ts/2;
                if (wx + ts/2 > maxX) maxX = wx + ts/2;
                if (wz - ts/2 < minZ) minZ = wz - ts/2;
                if (wz + ts/2 > maxZ) maxZ = wz + ts/2;
            }
        }
        _rainBounds = { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
    }

    function _rainGroundY(wx, wz) {
        var ts = (typeof CONFIG !== 'undefined' && CONFIG.tileSize) ? CONFIG.tileSize : 128;
        var tx = Math.round(wx / ts);
        var tz = Math.round(wz / ts);
        var key = tx + ',' + tz;
        return (_rainTileIndex && _rainTileIndex.has(key)) ? _rainTileIndex.get(key) : 2;
    }

    function _rainSpawnDrop(d, rcfg) {
        if (!_rainBounds) return;
        var b = _rainBounds;
        d.alive = true;
        d.cfgType = rcfg;
        d.x = _rn(b.minX, b.maxX);
        d.z = _rn(b.minZ, b.maxZ);
        d.groundY = _rainGroundY(d.x, d.z);
        d.y = d.groundY + rcfg.skyHeight + _rn(0, 80);
        d.vx = _rn(rcfg.driftVx[0], rcfg.driftVx[1]);
        d.vz = _rn(rcfg.driftVz[0], rcfg.driftVz[1]);
        d.vy = -_rn(rcfg.fallSpeed[0], rcfg.fallSpeed[1]);

        if (rcfg.shapeMode) {
            var sprites = rcfg.shapeSprites;
            var spr = sprites[Math.floor(Math.random() * sprites.length)];
            var sz = _rn(rcfg.shapeSize[0], rcfg.shapeSize[1]);
            d.w = sz; d.h = sz;
            d.spriteKey = spr;
            d.spinDeg = Math.random() * 360;
            d.spinSpeed = _rn(rcfg.shapeSpin[0], rcfg.shapeSpin[1]) * (Math.random() > 0.5 ? 1 : -1);
        } else {
            d.w = rcfg.dropW;
            d.h = _rn(rcfg.dropH0, rcfg.dropH1);
            d.spriteKey = rcfg.dropSprite;
            d.spinDeg = 0;
            d.spinSpeed = 0;
        }

        var entry = _rainDropMeshes[d.slotIdx];
        if (entry) {
            entry.material.map = _getSpriteTexture(d.spriteKey);
            if (_TESS_SPRITES[d.spriteKey]) {
                entry.material.blending = THREE.AdditiveBlending;
                entry.material.color.setRGB(0.7, 1.9, 1.6);
            } else {
                entry.material.blending = THREE.NormalBlending;
                entry.material.color.setRGB(1, 1, 1);
            }
            entry.material.needsUpdate = true;
            entry.inUse = true;
        }
    }

    function _rainReleaseDrop(d) {
        d.alive = false;
        var entry = _rainDropMeshes[d.slotIdx];
        if (entry) {
            entry.mesh.visible = false;
            entry.mesh.position.set(0, -99999, 0);
            entry.material.opacity = 0;
            entry.inUse = false;
        }
    }

    function _rainSpawnSplash(s, x, y, z, rcfg) {
        s.alive = true;
        s.life = 0;
        s.ml = _rn(rcfg.splashMs[0], rcfg.splashMs[1]);
        s.size0 = rcfg.splashSize0;
        s.size1 = rcfg.splashSize1;
        s.x = x;
        s.y = y + 0.5;
        s.z = z;
        s.spriteKey = rcfg.splashSprite;

        var entry = _rainSplashMeshes[s.slotIdx];
        if (entry) {
            entry.material.map = _getSpriteTexture(s.spriteKey);
            if (_TESS_SPRITES[s.spriteKey]) {
                entry.material.blending = THREE.AdditiveBlending;
                entry.material.color.setRGB(1.5, 1.5, 1.5);
            } else {
                entry.material.blending = THREE.NormalBlending;
                entry.material.color.setRGB(1, 1, 1);
            }
            entry.material.needsUpdate = true;
            entry.inUse = true;
        }
    }

    function _rainReleaseSplash(s) {
        s.alive = false;
        var entry = _rainSplashMeshes[s.slotIdx];
        if (entry) {
            entry.mesh.visible = false;
            entry.mesh.position.set(0, -99999, 0);
            entry.material.opacity = 0;
            entry.inUse = false;
        }
    }

    function _rainClaimSplash(rcfg, x, y, z) {
        for (var i = 0; i < _rainSplashes.length; i++) {
            if (!_rainSplashes[i].alive) {
                _rainSpawnSplash(_rainSplashes[i], x, y, z, rcfg);
                return;
            }
        }
        var oldest = _rainSplashes[0], maxFrac = -1;
        for (var j = 0; j < _rainSplashes.length; j++) {
            var frac = _rainSplashes[j].life / _rainSplashes[j].ml;
            if (frac > maxFrac) { maxFrac = frac; oldest = _rainSplashes[j]; }
        }
        _rainSpawnSplash(oldest, x, y, z, rcfg);
    }

    function _rainTick(dt) {
        if (!_rainActive || _rainDropMeshes.length === 0) return;
        if (typeof state !== 'undefined' && state.devAutoSim) {
            _rainStopAll();
            return;
        }

        var zoneCfgs = [];
        var totalDesired = 0;
        for (var z = 0; z < _rainZones.length; z++) {
            var cfg = _RAIN_CFG[_rainZones[z].type] || _RAIN_CFG.thunderstorm;
            totalDesired += cfg.dropCount;
            zoneCfgs.push(cfg);
        }
        var budgets = [];
        var budgetSum = 0;
        for (var z2 = 0; z2 < zoneCfgs.length; z2++) {
            var share = totalDesired > 0
                ? Math.max(1, Math.round((zoneCfgs[z2].dropCount / totalDesired) * _RAIN_MAX_DROPS))
                : 0;
            budgets.push(share);
            budgetSum += share;
        }
        while (budgetSum > _RAIN_MAX_DROPS && budgets.length > 0) {
            var maxIdx = 0;
            for (var z3 = 1; z3 < budgets.length; z3++) if (budgets[z3] > budgets[maxIdx]) maxIdx = z3;
            budgets[maxIdx]--;
            budgetSum--;
        }

        var alivePerZone = [];
        for (var az = 0; az < zoneCfgs.length; az++) alivePerZone.push(0);
        for (var i = 0; i < _rainDrops.length; i++) {
            var dd = _rainDrops[i];
            if (dd.alive && dd.zoneIdx < alivePerZone.length) alivePerZone[dd.zoneIdx]++;
        }

        var poolIdx = 0;
        for (var z4 = 0; z4 < zoneCfgs.length; z4++) {
            var need = budgets[z4] - alivePerZone[z4];
            while (need > 0 && poolIdx < _rainDrops.length) {
                if (!_rainDrops[poolIdx].alive) {
                    _rainDrops[poolIdx].zoneIdx = z4;
                    _rainSpawnDrop(_rainDrops[poolIdx], zoneCfgs[z4]);
                    need--;
                }
                poolIdx++;
            }
        }

        var camera = (typeof ThreeCamera !== 'undefined') ? ThreeCamera.getCamera() : null;
        var b = _rainBounds;

        for (var di = 0; di < _rainDrops.length; di++) {
            var d = _rainDrops[di];
            if (!d.alive) continue;

            var zi2 = d.zoneIdx;
            var rcfg = zoneCfgs[zi2] || zoneCfgs[0] || _RAIN_CFG.thunderstorm;

            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.z += d.vz * dt;

            if (d.y <= d.groundY) {
                if (rcfg.splashChance > 0 && Math.random() < rcfg.splashChance) {
                    _rainClaimSplash(rcfg, d.x, d.groundY, d.z);
                }
                _rainSpawnDrop(d, rcfg);
            } else if (b && (d.x < b.minX - 20 || d.x > b.maxX + 20 ||
                             d.z < b.minZ - 20 || d.z > b.maxZ + 20)) {
                _rainSpawnDrop(d, rcfg);
            } else if (d.spinSpeed) {
                d.spinDeg += d.spinSpeed * dt;
            }

            var dEntry = _rainDropMeshes[d.slotIdx];
            if (dEntry) {
                dEntry.mesh.position.set(d.x, d.y, d.z);
                if (camera) {

                    var camDir_x = -(camera.matrixWorld.elements[8]);
                    var camDir_z = -(camera.matrixWorld.elements[10]);
                    var yRot = Math.atan2(camDir_x, camDir_z);
                    dEntry.mesh.quaternion.setFromAxisAngle(_tmpVec.set(0, 1, 0), yRot);
                    if (d.spinSpeed) {

                        _tmpQuat2.setFromAxisAngle(_tmpVec.set(0, 0, 1), d.spinDeg * Math.PI / 180);
                        dEntry.mesh.quaternion.multiply(_tmpQuat2);
                    }
                }
                dEntry.mesh.scale.set(d.w, d.h, 1);
                dEntry.material.opacity = _TESS_SPRITES[d.spriteKey] ? 0.95 : 0.7;
                dEntry.mesh.visible = true;
            }
        }

        for (var si = 0; si < _rainSplashes.length; si++) {
            var s = _rainSplashes[si];
            if (!s.alive) continue;
            s.life += dt * 1000;
            var t2 = Math.min(1, s.life / s.ml);
            if (t2 >= 1) {
                _rainReleaseSplash(s);
                continue;
            }
            var sz = s.size0 + (s.size1 - s.size0) * t2;
            var easeT = 1 - (1 - t2) * (1 - t2);
            var op = 0.85 * (1 - easeT);

            var sEntry = _rainSplashMeshes[s.slotIdx];
            if (sEntry) {
                sEntry.mesh.position.set(s.x, s.y, s.z);
                sEntry.mesh.rotation.set(-Math.PI / 2, 0, 0);
                sEntry.mesh.scale.set(sz, sz, 1);
                sEntry.material.opacity = op;
                sEntry.mesh.visible = (op > 0.001);
            }
        }
    }

    function _rainStopAll() {
        for (var i = 0; i < _rainDrops.length; i++) {
            if (_rainDrops[i].alive) _rainReleaseDrop(_rainDrops[i]);
        }
        for (var j = 0; j < _rainSplashes.length; j++) {
            if (_rainSplashes[j].alive) _rainReleaseSplash(_rainSplashes[j]);
        }
        _rainActive = false;
        _rainZones = [];
        _rainTileIndex = null;
        _rainBounds = null;
    }

    function startRain3D(zones) {
        if (!zones || zones.length === 0) { _rainStopAll(); return; }
        if (!_initialized) return;
        _rainInitPools();
        _rainZones = zones;
        _rainBuildIndex(zones);
        _rainActive = true;
        console.log('[ThreeVFX] startRain3D — ' + zones.length + ' zone(s)');
    }

    function stopRain3D() {
        _rainStopAll();
        console.log('[ThreeVFX] stopRain3D');
    }

    function isRain3DActive() {
        return _rainActive;
    }

    function isActive() {
        return _initialized && (typeof ThreeRenderer !== 'undefined') && ThreeRenderer.isActive();
    }

    function clear() {
        if (!_initialized) return;
        for (var i = 0; i < _particles.length; i++) {
            if (_particles[i].alive) _release(_particles[i]);
        }
        _aliveCount = 0;
        _zoneAliveCount = 0;
        if (window.ThreeVFXEffects && window.ThreeVFXEffects.clear) {
            window.ThreeVFXEffects.clear();
        }
    }

    function dispose() {

        for (var i = 0; i < _spritePool.length; i++) {
            if (_scene) _scene.remove(_spritePool[i].sprite);
            _spritePool[i].material.dispose();
        }
        _spritePool = [];

        for (var j = 0; j < _worldMeshPool.length; j++) {
            if (_scene) _scene.remove(_worldMeshPool[j].mesh);
            _worldMeshPool[j].material.dispose();
        }
        _worldMeshPool = [];

        for (var k = 0; k < _quadMeshPool.length; k++) {
            if (_scene) _scene.remove(_quadMeshPool[k].mesh);
            _quadMeshPool[k].material.dispose();
        }
        _quadMeshPool = [];

        for (var ri = 0; ri < _rainDropMeshes.length; ri++) {
            if (_scene) _scene.remove(_rainDropMeshes[ri].mesh);
            _rainDropMeshes[ri].material.dispose();
        }
        _rainDropMeshes = [];
        for (var rj = 0; rj < _rainSplashMeshes.length; rj++) {
            if (_scene) _scene.remove(_rainSplashMeshes[rj].mesh);
            _rainSplashMeshes[rj].material.dispose();
        }
        _rainSplashMeshes = [];

        _rainDrops = []; _rainSplashes = [];
        _rainActive = false; _rainZones = []; _rainTileIndex = null; _rainBounds = null;

        _ambDisposeCloud(_ambMotes); _ambDisposeCloud(_ambFlies);
        _ambMotes = null; _ambFlies = null; _ambKey = ''; _ambCanvasEl = null;

        if (_sharedPlaneGeo) { _sharedPlaneGeo.dispose(); _sharedPlaneGeo = null; }
        if (_atlasTexture) { _atlasTexture.dispose(); _atlasTexture = null; }

        for (var sk in _spriteTextures) {
            if (_spriteTextures[sk]) _spriteTextures[sk].dispose();
        }
        _spriteTextures = {};

        _atlasCanvas = null;
        _uvLookup = {}; _atlasReady = false;
        _particles = []; _aliveCount = 0; _zoneAliveCount = 0; _initialized = false; _scene = null;
        _tmpQuat = _tmpQuat2 = _tmpEuler = _tmpVec = null;
        console.log('[ThreeVFX] disposed');
    }

    function hasActiveParticles() { return (_aliveCount - _zoneAliveCount) > 0; }

    function _diag() {
        console.log('=== ThreeVFX DIAGNOSTIC ===');
        console.log('_initialized:', _initialized);
        console.log('_scene:', _scene);
        console.log('_scene.children count:', _scene ? _scene.children.length : 'N/A');
        console.log('_atlasTexture:', _atlasTexture);
        console.log('_atlasCanvas:', _atlasCanvas);
        console.log('_aliveCount:', _aliveCount);
        console.log('_spritePool size:', _spritePool.length, 'inUse:', _spritePool.filter(function(e){return e.inUse;}).length);
        console.log('_worldMeshPool size:', _worldMeshPool.length, 'inUse:', _worldMeshPool.filter(function(e){return e.inUse;}).length);
        console.log('_quadMeshPool size:', _quadMeshPool.length, 'inUse:', _quadMeshPool.filter(function(e){return e.inUse;}).length);
        console.log('_spriteTextures keys:', Object.keys(_spriteTextures).length);

        var testP = spawn({ x: 578, y: 578, z: 200, mode: 'billboard', sprite: 'flash',
                            ml: 5000, size0: 300, size1: 300, opacity0: 1, opacity1: 1 });
        if (testP) {
            console.log('Test particle spawned:', testP.alive, 'poolType:', testP.poolType, 'slot:', testP.slotIdx);
            console.log('Test particle pos:', testP.x, testP.y, testP.z);
            var w = _vfxToWorld(testP.x, testP.y, testP.z);
            console.log('Test particle world pos:', w.x, w.y, w.z);
            if (testP.poolType === 'sprite') {
                var entry = _spritePool[testP.slotIdx];
                console.log('Sprite visible:', entry.sprite.visible);
                console.log('Sprite position:', entry.sprite.position.x, entry.sprite.position.y, entry.sprite.position.z);
                console.log('Sprite scale:', entry.sprite.scale.x, entry.sprite.scale.y);
                console.log('Material opacity:', entry.material.opacity);
                console.log('Material map:', entry.material.map);
            }
        } else {
            console.log('SPAWN RETURNED NULL');
        }
        console.log('=== END DIAGNOSTIC ===');
    }

    function _getScene() { return _scene; }

    return { init: init, spawn: spawn, tick: tick, isActive: isActive, clear: clear, dispose: dispose,
             startRain3D: startRain3D, stopRain3D: stopRain3D, isRain3DActive: isRain3DActive,
             setAmbientDensity: setAmbientDensity, getAmbientDensity: getAmbientDensity,
             hasActiveParticles: hasActiveParticles, _diag: _diag, _getScene: _getScene };
})();

window.ThreeVFX = ThreeVFX;
