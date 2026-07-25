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
                img.src = _imageDefs[sprKey];
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
                _spriteRot: 0,
                _uvRect: null,
                _gsx: 1, _gsy: 1, _gsz: 1,
                _rot0x: 0, _rot0y: 0, _rot0z: 0,
                _spinx: 0, _spiny: 0, _spinz: 0,
                _stretch: false,
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
        p._spriteRot = opts.spriteRot || 0;
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
        if (p._spriteRot) {

            mesh.rotation.set(-Math.PI / 2, 0, p._spriteRot * Math.PI / 180);
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

        if (p._spriteRot) {
            _tmpQuat2.setFromAxisAngle(_tmpVec.set(0, 0, 1), p._spriteRot * Math.PI / 180);
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
            } else {
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
    var _ambDensity = 0.6;
    try {
        var _ambSaved = (typeof localStorage !== 'undefined') ? localStorage.getItem('ew_ambientFx') : null;
        if (_ambSaved !== null) {
            var _av = parseFloat(_ambSaved);
            if (!isNaN(_av)) _ambDensity = Math.max(0, Math.min(1, _av));
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
