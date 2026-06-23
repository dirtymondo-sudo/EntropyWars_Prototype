const ThreeRenderer = (function () {
    'use strict';

    const ELEV_STEP_RATIO = 1.0; /* 1 game height = 1 full tile (cube voxels). Keep in sync with three-camera.js, ui.js, hud.js, three-vfx.js, map.js editor preview. */
    const FACE_BRIGHTNESS = [0.48, 0.48, 1.00, 0.30, 0.55, 0.43];

    const DEFAULT_BUILDING_HEIGHT_TILES = 1.8;
    const TURRET_RADIUS_RATIO = 0.35;
    const TURRET_HEIGHT_RATIO = 0.7;
    const CANNON_LENGTH_RATIO = 0.5;
    const CANNON_THICKNESS = 3;
    const BILLBOARD_DEFAULT_H = 1.2;
    const TURRET_COLORS = { 1: 0x4466aa, 2: 0xaa4444 };

    function _isP2Viewer() {
        return !!(window._NET && window._NET.online && window._NET.myPlayer === 2);
    }
    function _viewerPlayerColor(player) {

        var viewerP = (window._NET && window._NET.online && window._NET.myPlayer) ? window._NET.myPlayer : 1;
        if (player === viewerP) return 0x3399ff;
        return 0xff3355;
    }

    /* Returns true if `player` is the local/viewing player */
    function _isAllyPlayer(player) {
        var viewerP = (window._NET && window._NET.online && window._NET.myPlayer) ? window._NET.myPlayer : 1;
        return player === viewerP;
    }

    /* Build HTML tick marks inside an HP bar — one line per 100 HP */
    function _buildHpTicks(maxHp) {
        if (maxHp <= 100) return '';
        var ticks = [];
        var count = Math.floor(maxHp / 100);
        for (var i = 1; i <= count; i++) {
            var pct = (i * 100 / maxHp) * 100;
            if (pct >= 100) break;
            ticks.push('<div class="tp-hp-tick" style="left:' + pct.toFixed(1) + '%"></div>');
        }
        return ticks.join('');
    }

    const UNIT_SPRITE_SIZE_RATIO = 1.0;
    const SELECTED_RING_OFFSET = 0.8;

    const BAT_COUNT = 8;
    const BAT_SPRITE_SIZE = 0.25;
    const BAT_SPREAD = 0.35;
    const BAT_BOB_SPEED = 2.5;
    const BAT_ORBIT_SPEED = 0.8;

    const FLY_BOB_AMP = 4;
    const FLY_BOB_SPEED = 1.8;

    const SUBMERSION_DEPTH = {
        water:      0.22,
        deep_water: 0.45,
        lava:       0.35
    };

    const HL_COLORS = {
        'move':            0x2288ff,
        'move-jump':       0x00ccdd,
        'move-takeoff':    0x44aaff,
        'move-2ap':        0xcc8800,
        'move-3ap':        0xcc4400,
        'move-edge':       0x991111,
        'attack':          0x3366ee,
        'attack enemy':    0xff2222,
        'spell-range':     0x8844ee,
        'spell-range-bg':  0x6633bb,
        'heal':            0x22ee55,
        'inspect':         0x22eebb,
        'move ally':       0xddaa22,
        'combo-target':    0xff8822,
        'selected':        0xffffff,
        'placeable':       0x44aaff
    };
    const HL_OPACITY = 0.62;

    const HL_OPACITY_MAP = {
        'move-edge':       0.40,
        'spell-range-bg':  0.35,
        'move-2ap':        0.62,
        'move-3ap':        0.58,
        'attack enemy':    0.72
    };

    const HL_DOT_COUNT = {
        'move':       1,
        'move-jump':  1,
        'move-2ap':   2,
        'move-3ap':   3,
        'move-takeoff': 2
    };

    const HL_EDGE_GLOW = {
        'move':         0.7,
        'move-jump':    0.8,
        'move-takeoff': 0.75,
        'move-2ap':     0.65,
        'move-3ap':     0.55,
        'move-edge':    0.4,
        'attack':       0.6,
        'attack enemy': 0.9,
        'spell-range':  0.8,
        'spell-range-bg': 0.4,
        'heal':         0.75,
        'inspect':      0.5,
        'move ally':    0.7,
        'combo-target': 0.8,
        'selected':     0.5,
        'placeable':    0.5
    };

    var _hlGlobalTime = { value: 0.0 };

    var _hlVertexShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var _hlFragmentShader = [
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'uniform float uTime;',
        'uniform float uEdgeGlow;',
        'uniform int uDots;',
        'varying vec2 vUv;',
        '',
        'void main() {',
        '  vec2 uv = vUv;',
        '',
        '  float edgeX = min(uv.x, 1.0 - uv.x);',
        '  float edgeY = min(uv.y, 1.0 - uv.y);',
        '  float edge = min(edgeX, edgeY);',
        '  float borderHard = 1.0 - smoothstep(0.0, 0.05, edge);',
        '  float borderSoft = 1.0 - smoothstep(0.0, 0.13, edge);',
        '  float innerGlow = 1.0 - smoothstep(0.0, 0.45, edge);',
        '',
        '  float gridX = abs(fract(uv.x * 4.0) - 0.5);',
        '  float gridY = abs(fract(uv.y * 4.0) - 0.5);',
        '  float grid = smoothstep(0.45, 0.5, gridX) + smoothstep(0.45, 0.5, gridY);',
        '  grid = min(grid, 1.0) * 0.18;',
        '',
        '  float pulse = 0.88 + 0.12 * sin(uTime * 2.2);',
        '',
        '  float bracketLen = 0.22;',
        '  float bracketW = 0.045;',
        '  float bTL = step(uv.x, bracketLen) * step(uv.y, bracketW) + step(uv.y, bracketLen) * step(uv.x, bracketW);',
        '  float bTR = step(1.0 - bracketLen, uv.x) * step(uv.y, bracketW) + step(uv.y, bracketLen) * step(1.0 - bracketW, uv.x);',
        '  float bBL = step(uv.x, bracketLen) * step(1.0 - bracketW, uv.y) + step(1.0 - bracketLen, uv.y) * step(uv.x, bracketW);',
        '  float bBR = step(1.0 - bracketLen, uv.x) * step(1.0 - bracketW, uv.y) + step(1.0 - bracketLen, uv.y) * step(1.0 - bracketW, uv.x);',
        '  float brackets = min(bTL + bTR + bBL + bBR, 1.0) * 0.95;',
        '',
        '  float dots = 0.0;',
        '  if (uDots > 0) {',
        '    float dotR = 0.06;',
        '    float ringR = 0.075;',
        '    if (uDots == 1) {',
        '      float d = distance(uv, vec2(0.5, 0.5));',
        '      dots = (1.0 - smoothstep(dotR - 0.01, dotR, d));',
        '      dots += (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d)) * 0.35;',
        '    } else if (uDots == 2) {',
        '      float d1 = distance(uv, vec2(0.37, 0.5));',
        '      float d2 = distance(uv, vec2(0.63, 0.5));',
        '      float c1 = (1.0 - smoothstep(dotR - 0.01, dotR, d1));',
        '      float c2 = (1.0 - smoothstep(dotR - 0.01, dotR, d2));',
        '      float r1 = (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d1)) * 0.35;',
        '      float r2 = (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d2)) * 0.35;',
        '      dots = max(c1 + r1, c2 + r2);',
        '    } else {',
        '      float d1 = distance(uv, vec2(0.28, 0.5));',
        '      float d2 = distance(uv, vec2(0.5, 0.5));',
        '      float d3 = distance(uv, vec2(0.72, 0.5));',
        '      float c1 = (1.0 - smoothstep(dotR - 0.01, dotR, d1));',
        '      float c2 = (1.0 - smoothstep(dotR - 0.01, dotR, d2));',
        '      float c3 = (1.0 - smoothstep(dotR - 0.01, dotR, d3));',
        '      float r1 = (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d1)) * 0.35;',
        '      float r2 = (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d2)) * 0.35;',
        '      float r3 = (1.0 - smoothstep(ringR - 0.008, ringR + 0.008, d3)) * 0.35;',
        '      dots = max(max(c1 + r1, c2 + r2), c3 + r3);',
        '    }',
        '  }',
        '',
        '  float fill = 0.55 * pulse;',
        '  float border = (borderHard * 1.0 + borderSoft * 0.5) * uEdgeGlow * pulse;',
        '  float glow = innerGlow * uEdgeGlow * 0.35;',
        '  float alpha = (fill + border + glow + grid + brackets + dots) * uOpacity;',
        '  alpha = clamp(alpha, 0.0, 1.0);',
        '',
        '  float bright = border * 0.5 + brackets * 0.65 + dots * 0.85;',
        '  vec3 col = mix(uColor, vec3(1.0), clamp(bright, 0.0, 0.75));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    function _makeHlMaterial(color, opacity, edgeGlow, dotCount) {
        var c = new THREE.Color(color);
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor:    { value: c },
                uOpacity:  { value: opacity },
                uTime:     _hlGlobalTime,
                uEdgeGlow: { value: edgeGlow },
                uDots:     { value: dotCount || 0 }
            },
            vertexShader: _hlVertexShader,
            fragmentShader: _hlFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    var _ringVertexShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var _ringFragmentShader = [
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'uniform float uTime;',
        'uniform float uPhase;',
        'varying vec2 vUv;',
        'void main() {',
        '  float pulse = 0.85 + 0.15 * sin(uTime * 3.0 + uPhase);',
        '  float radial = 1.0 - 2.0 * abs(vUv.y - 0.5);',
        '  radial = pow(radial, 0.3);',
        '  float angle = vUv.x * 6.2832;',
        '  float dash = 0.82 + 0.18 * sin(angle * 6.0 - uTime * 2.5 + uPhase);',
        '  float alpha = radial * dash * pulse * uOpacity;',
        '  vec3 col = mix(uColor, vec3(1.0), radial * 0.5);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    function _makeRingMaterial(color, opacity, phase) {
        var c = new THREE.Color(color);
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor:   { value: c },
                uOpacity: { value: opacity },
                uTime:    _hlGlobalTime,
                uPhase:   { value: phase || 0.0 }
            },
            vertexShader: _ringVertexShader,
            fragmentShader: _ringFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    var renderer = null, scene = null, canvas = null;
    var active = false, initialized = false;

    var terrainGroup = null, highlightGroup = null;
    var objectGroup = null, unitGroup = null;
    var weatherGroup = null;

    var textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    var textureCache = new Map();

    var tileMeshes = new Map();
    var _lastTerrainVersion = -1, _lastHeightVersion = -1, _lastVoxelVersion = -1;
    var _lastBoardW = 0, _lastBoardH = 0;

    var _FLUID_TERRAIN_SET = { water: true, deep_water: true, lava: true };
    var _fluidTimeSec = 0;

    var _fluidTextures = {};

    var _FLUID_DRIFT_3D = {
        water:      { l1dx: 0.15, l1dy: 0.15, l2dx: -0.11, l2dy: 0.11 },
        deep_water: { l1dx: 0.15, l1dy: 0.15, l2dx: -0.11, l2dy: 0.11 },
        lava:       { l1dx: 0.09, l1dy: 0.09, l2dx: -0.07, l2dy: -0.07 }
    };

    var objectMeshes = new Map();
    var _lastObjectSerial = 0, _objectsDirty = true;

    var turretMeshes = new Map();
    var _lastTurretSerial = '';

    /* Tower cubes — floating spinning cubes for tower_cube objects */
    var _towerCubes = [];

    /* Terrain decorations — rock clusters, crystal clusters spawned per-terrain */
    var _terrainDecoGroup = null;
    var _lastTerrainDecoSerial = '';

    var deployableMeshes = new Map();
    var _lastDeployableSerial = '';

    var _nexusWallGroup = null;
    var _lastNexusSerial = '';

    var unitEntries = new Map();
    var _lastUnitSerial = '';

    var _unitById = new Map();
    function _rebuildUnitMap() {
        _unitById.clear();
        if (!state.units) return;
        for (var i = 0; i < state.units.length; i++) {
            _unitById.set(state.units[i].id, state.units[i]);
        }
    }

    var _plateObjs = new Map();
    /* Last rendered HP/MP fill % per unit id. Lets a freshly-rebuilt plate start at
       the previous fill width and animate (drain) to the new value, instead of
       snapping straight to the lower health. */
    var _lastHpPctById = new Map();
    var _lastMpPctById = new Map();
    /* Fake nameplates attached to decoy/clone objects so they read identically to
       real units (HP/MP/name bars). Tracked separately for per-frame scale + fog
       visibility, and cleared whenever deployables rebuild. */
    var _decoyPlates = [];
    /* Opacity applied to the VIEWER'S OWN sprite while it carries the Invisible
       status — the player needs a clear "you are cloaked" cue. */
    var INVIS_OWN_OPACITY = 0.45;
    var _batWorldVec = new THREE.Vector3();
    var css2dRenderer = null;

    var _nexusBarObjs = new Map();
    var _nexusBarGroup = null;
    var _lastNexusBarSerial = '';

    var _lastHlKey = '';

    var fogGroup = null;
    var _fogMeshes = new Map();
    var _fogVisibleSet = null;
    var _fogVisibleKey = '';
    var _fogPulseTime = 0;
    var _fogLastTime = 0;
    var _fogLastCheckTime = 0;

    var FOG_COLOR_CORE    = 0x22ccff;
    var FOG_COLOR_EDGE    = 0x1188aa;
    var FOG_COLOR_SCANLINE = 0x33eeff;
    var FOG_CUBE_HEIGHT_RATIO = 0.9;
    var FOG_EDGE_HEIGHT_RATIO = 0.45;
    var FOG_LINE_OPACITY  = 0.55;
    var FOG_EDGE_LINE_OPACITY = 0.30;
    var FOG_PULSE_SPEED   = 0.15;
    var FOG_PULSE_AMP     = 0.04;
    var FOG_SCANLINE_SPEED = 0.08;

    var _fogEdgesCache = new Map();
    function _getFogEdgesGeo(w, h) {
        var k = w + ',' + h;
        var cached = _fogEdgesCache.get(k);
        if (cached) return cached;
        var box = new THREE.BoxGeometry(w, h, w);
        var edges = new THREE.EdgesGeometry(box);
        box.dispose();
        edges._ew_shared = true;
        _fogEdgesCache.set(k, edges);
        return edges;
    }
    function _clearFogEdgesCache() {
        _fogEdgesCache.forEach(function(geo) { geo.dispose(); });
        _fogEdgesCache.clear();
    }

    var _walkTweens = new Map();

    var _displaceTweens = new Map();

    var _jumpTweens = new Map();

    var _deathTweens = new Map();

    var _lungeTweens = new Map();

    var _dodgeTweens = new Map();

    var _castTweens = new Map();

    var _flashTweens = new Map();

    var _wiggleTweens = new Map();

    var _prevAttackIds = new Set();
    var _prevCastIds = new Set();
    var _prevDodgeIds = new Set();
    var _prevHitFlashIds = new Set();
    var _prevHealFlashIds = new Set();
    var _prevWiggleIds = new Set();

    var LUNGE_DIST = 18;
    var LUNGE_MS = 350;
    var DODGE_DIST = 14;
    var DODGE_MS = 420;
    var CAST_MS = 500;
    var FLASH_MS = 300;
    var DEATH_MS = 800;
    var WIGGLE_MS = 500;
    var WIGGLE_AMP = 5;
    var CAST_BOB_AMP = 8;

    var _lastVfxTime = 0;
    var _lastFluidTime = 0;

    var projectileGroup = null;
    var _projTweens = [];
    var _projIdCounter = 0;
    var PROJ_SIZE = 32;

    var _R2_PROJ = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/projectiles/';
    var _PROJ_SPRITES = {
        'attack':           { url: _R2_PROJ + 'proj_human.png',        glow: 0xeec040 },
        'damage':           { url: _R2_PROJ + 'proj_tech.png',         glow: 0xdd7755 },
        'heal':             { url: _R2_PROJ + 'proj_heal.png',         glow: 0x44dd66 },
        'cleanse':          { url: _R2_PROJ + 'proj_heal.png',         glow: 0x66ccdd },
        'shield':           { url: _R2_PROJ + 'proj_shield.png',       glow: 0x66aadd },
        'status':           { url: _R2_PROJ + 'proj_debuff.png',       glow: 0xaa77dd },
        'proj-heal':        { url: _R2_PROJ + 'proj_heal.png',         glow: 0x44dd66 },
        'proj-shield':      { url: _R2_PROJ + 'proj_shield.png',       glow: 0x66aadd },
        'proj-debuff':      { url: _R2_PROJ + 'proj_debuff.png',       glow: 0xaa77dd },
        'proj-bomb':        { url: _R2_PROJ + 'proj_bomb.png',         glow: 0x985050 },
        'proj-ricochet':    { url: _R2_PROJ + 'proj_ricochet.png',     glow: 0xffe38a },
        'proj-lightning':   { url: _R2_PROJ + 'proj_lightning.png',     glow: 0x88ccff },
        'proj-pull-hook':   { url: _R2_PROJ + 'proj_pull_hook.png',    glow: 0xaaaaaa },
        'proj-divine':      { url: _R2_PROJ + 'proj_divine.png',       glow: 0xffdc64 },
        'proj-unholy':      { url: _R2_PROJ + 'proj_unholy.png',       glow: 0x9632b4 },
        'proj-tech':        { url: _R2_PROJ + 'proj_tech.png',         glow: 0x28a0be },
        'proj-alien':       { url: _R2_PROJ + 'proj_alien.png',        glow: 0x32aa50 },
        'proj-human':       { url: _R2_PROJ + 'proj_human.png',        glow: 0xa0a0c3 },
        'proj-anomaly':     { url: _R2_PROJ + 'proj_anomaly.png',      glow: 0xdc3c82 },
        'proj-fire':        { url: _R2_PROJ + 'fire/fire_strike_0.png',glow: 0xff781e },
        'proj-bullet':      { url: _R2_PROJ + 'bullet.png',            glow: 0xffee88 },
        'proj-bane-human':  { url: _R2_PROJ + 'proj_human_bane.png',   glow: 0xa0a0c3 },
        'proj-bane-divine': { url: _R2_PROJ + 'proj_divine_bane.png',  glow: 0xffdc64 },
        'proj-bane-unholy': { url: _R2_PROJ + 'proj_unholy_bane.png',  glow: 0x9632b4 },
        'proj-bane-tech':   { url: _R2_PROJ + 'proj_tech_bane.png',    glow: 0x28a0be },
        'proj-bane-anomaly':{ url: _R2_PROJ + 'proj_anomaly_bane.png', glow: 0xdc3c82 },
        'proj-bane-alien':  { url: _R2_PROJ + 'proj_alien_bane.png',   glow: 0x32aa50 },

        'proj-spider':      { url: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/spider_1.png',    glow: 0x3cdcc8 },
        'proj-spiderweb':   { url: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/spiderweb_1.png', glow: 0xb4b4dc },
        'proj-knife':       { url: _R2_PROJ + 'proj_knife.png',         glow: 0xc0c0cc },

        'proj-football':    { url: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/football.png',    glow: 0x8b5e3c },
    };

    var floatTextGroup = null;
    var _floatTweens = [];
    var _floatIdCounter = 0;
    var FLOAT_RISE_PX = 110;

    var _floatTileStagger = {};
    var FLOAT_STAGGER_Y = 36;
    var FLOAT_STAGGER_WINDOW = 600;

    var _FLOAT_STYLES = {
        'damage':        { color: '#ff4444', stroke: '#000000', fontSize: 48 },
        'heal':          { color: '#44ff66', stroke: '#000000', fontSize: 46 },
        'mp':            { color: '#6ec8ff', stroke: '#000000', fontSize: 40 },
        'revive':        { color: '#ffd700', stroke: '#000000', fontSize: 48 },
        'crit':          { color: '#ffcc00', stroke: '#000000', fontSize: 58 },
        'dodge':         { color: '#ccccdd', stroke: '#000000', fontSize: 40 },
        'counter':       { color: '#ff8844', stroke: '#000000', fontSize: 42 },
        'xp':            { color: '#dda0ff', stroke: '#000000', fontSize: 34 },
        'levelup':       { color: '#ffd700', stroke: '#000000', fontSize: 54 },
        'streak':        { color: '#ff4444', stroke: '#000000', fontSize: 48 },
        'laststd':       { color: '#ffd700', stroke: '#000000', fontSize: 52 },
        'overkill':      { color: '#ff2222', stroke: '#000000', fontSize: 56 },
        'achieve':       { color: '#ffd700', stroke: '#000000', fontSize: 40 },
        'protect-block': { color: '#44aaff', stroke: '#000000', fontSize: 42 },
        'pickup':        { color: '#ffd700', stroke: '#000000', fontSize: 38 },
        'buff':          { color: '#88ddff', stroke: '#000000', fontSize: 40 },
        'debuff':        { color: '#cc66ff', stroke: '#000000', fontSize: 40 },
        'status':        { color: '#ffcc44', stroke: '#000000', fontSize: 38 },
        'neutral':       { color: '#ffffff', stroke: '#000000', fontSize: 40 },
    };

    var hitFxGroup = null;
    var _hitFxTweens = [];
    var _hitFxIdCounter = 0;
    var HIT_FX_SIZE = 48;

    var _R2_FX = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Effects/';

    var _HIT_FX_SHEETS = {
        'hit04':        { url: _R2_FX + 'hit04.png',        cols: 5, rows: 2, frames: 10 },
        'hit02':        { url: _R2_FX + 'hit02.png',        cols: 5, rows: 2, frames: 10 },
        'hit11':        { url: _R2_FX + 'hit11.png',        cols: 5, rows: 2, frames: 10 },
        'spell_hit_01': { url: _R2_FX + 'spell_hit_01.png', cols: 4, rows: 2, frames: 8  },
    };

    var _BUILDING_PRISM_KEYS = new Set();
    function _initBuildingKeys() {
        if (typeof OBJECT_SPRITES === 'undefined' || _BUILDING_PRISM_KEYS.size > 0) return;
        for (var k in OBJECT_SPRITES) {
            if (k.startsWith('building_') || k.startsWith('abandoned_building') ||
                k === 'ancient_building' || k.startsWith('church_') || k === 'church' ||
                k === 'shop' || k.startsWith('column_')) _BUILDING_PRISM_KEYS.add(k);
        }
    }
    function _isBuildingKey(key) { return _BUILDING_PRISM_KEYS.has(key); }

    var _TREE_KEYS = new Set([
        'tree', 'tree_2', 'tree_3', 'tree_4', 'tree_5', 'tree_6'
    ]);
    function _isTreeKey(key) { return _TREE_KEYS.has(key); }

    var _CROSS_BILLBOARD_KEYS = new Set([
        'beanstalk', 'well', 'cave_entrance', 'ruins', 'nexus', 'nexus_cave', 'nexus_sky',
        'mountain_top', 'poison_seed'
    ]);
    function _isCrossBillboard(key) { return _CROSS_BILLBOARD_KEYS.has(key); }

    function _isBarrierKey(key) { return key && key.startsWith('barrier_') && key !== 'barrier_passage'; }

    var _buildingScansKicked = false;
    function _kickBuildingAlphaScans() {
        if (_buildingScansKicked) return;
        if (typeof OBJECT_SPRITES === 'undefined') return;
        if (typeof window._alphaScanSprite !== 'function') return;
        _buildingScansKicked = true;
        _BUILDING_PRISM_KEYS.forEach(function(k) {
            var oSpr = OBJECT_SPRITES[k];
            if (oSpr && !oSpr._trim && !oSpr._trimScanning) {
                window._alphaScanSprite(oSpr);
            }
        });
    }

    var hoverMesh = null, _lastHoverX = -1, _lastHoverY = -1;

    var _hoveredUnitId = null;
    var _hoverGlowMesh = null;
    var _parentEl = null;

    function getTexture(url, onLoad) {
        if (!url) return null;
        if (textureCache.has(url)) {
            var cached = textureCache.get(url);

            if (onLoad && cached.image && cached.image.complete) {
                setTimeout(function() { onLoad(cached); }, 0);
            }
            return cached;
        }
        var tex = textureLoader.load(url, function(loadedTex) {
            if (onLoad) onLoad(loadedTex);
        });
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;

        textureCache.set(url, tex);
        return tex;
    }

    function scanSpriteOffset(url) {
        if (!url) return;
        getTexture(url, function(tex) {
            if (!tex || !tex.image) return;
            var img = tex.image;
            if (!img.naturalWidth && !img.width) return;

            if (typeof _finishSpriteOffsetScan === 'function') {
                _finishSpriteOffsetScan(url, img);
            }
        });
    }

    function getTerrainTexture(k) {
        var url = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES[k]) ? TERRAIN_SPRITES[k][0] : null;
        return url ? getTexture(url) : null;
    }

    function getObjectTexture(k) {
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[k] : null;
        return spr ? getTexture(spr.url) : null;
    }

    function _fixSlabSideUVs(geo, boxH, ts) {
        var ratio = boxH / ts;
        if (Math.abs(ratio - 1) < 0.01) return;
        var uv = geo.getAttribute('uv');

        /* Side faces: +X(0-3), -X(4-7), +Z(16-19), -Z(20-23) */
        var sideFaceStarts = [0, 4, 16, 20];
        for (var si = 0; si < sideFaceStarts.length; si++) {
            var base = sideFaceStarts[si];
            for (var vi = 0; vi < 4; vi++) {
                var idx = base + vi;
                var v = uv.getY(idx);
                if (v > 0.5) {
                    /* Map bottom edge to ratio so texture tiles for tall columns
                       and shows a fraction for short ones */
                    uv.setY(idx, ratio);
                }
            }
        }
        uv.needsUpdate = true;
    }

    var _boxGeoCache = new Map();
    var _boxGeoCacheTs = 0;
    function _getBoxGeo(ts, boxH) {
        if (ts !== _boxGeoCacheTs) {

            _boxGeoCache.forEach(function(geo) { geo.dispose(); });
            _boxGeoCache.clear();
            _boxGeoCacheTs = ts;
        }
        var ck = ts + ',' + boxH;
        if (_boxGeoCache.has(ck)) return _boxGeoCache.get(ck);
        var geo = new THREE.BoxGeometry(ts, boxH, ts);
        _fixSlabSideUVs(geo, boxH, ts);
        geo._ew_shared = true;
        _boxGeoCache.set(ck, geo);
        return geo;
    }

    var _terrainMatCache = new Map();

    function buildBoxMaterials(topKey, sideKey) {
        var ck = (topKey || '_') + '|' + (sideKey || topKey || '_');
        if (_terrainMatCache.has(ck)) return _terrainMatCache.get(ck);
        var topTex = getTerrainTexture(topKey);
        var sideTex = getTerrainTexture(sideKey || topKey);
        /* Side textures need RepeatWrapping so UVs > 1 tile instead of stretch */
        if (sideTex) {
            sideTex.wrapS = THREE.RepeatWrapping;
            sideTex.wrapT = THREE.RepeatWrapping;
        }
        var mats = [];
        for (var i = 0; i < 6; i++) {
            var isTop = (i === 2);
            var tex = isTop ? topTex : sideTex;

            if (tex) { mats.push(new THREE.MeshLambertMaterial({ map: tex })); }
            else {
                var c = new THREE.Color(isTop ? 0x556655 : 0x443322);
                mats.push(new THREE.MeshLambertMaterial({ color: c }));
            }
        }
        _terrainMatCache.set(ck, mats);
        for (var mi = 0; mi < mats.length; mi++) mats[mi]._ew_shared = true;
        return mats;
    }

    function buildLavaBoxMaterials(topKey, sideKey) {
        var topTex = getTerrainTexture(topKey);
        var sideTex = getTerrainTexture(sideKey || topKey);
        if (sideTex) {
            sideTex.wrapS = THREE.RepeatWrapping;
            sideTex.wrapT = THREE.RepeatWrapping;
        }
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');

        var emissiveColor = new THREE.Color(0xff4411);
        var emissiveInt = isNight ? 0.7 : 0.25;
        var mats = [];
        for (var i = 0; i < 6; i++) {
            var isTop = (i === 2);
            var tex = isTop ? topTex : sideTex;
            var matOpts = {
                emissive: emissiveColor,
                emissiveIntensity: emissiveInt
            };
            if (tex) {
                matOpts.map = tex;
            } else {
                matOpts.color = new THREE.Color(isTop ? 0x883311 : 0x661100);
            }
            mats.push(new THREE.MeshLambertMaterial(matOpts));
        }
        return mats;
    }

    function _getFluidTex(fluidKey, layerNum) {
        var ck = fluidKey + '_l' + layerNum;
        if (_fluidTextures[ck]) return _fluidTextures[ck];

        var base = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/';
        var url = (layerNum === 1)
            ? base + fluidKey + '.png'
            : base + 'waves_1.png';
        var tex = textureLoader.load(url);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        _fluidTextures[ck] = tex;
        return tex;
    }

    function _buildFluidTopMat(terrainKey) {
        var baseTex = getTerrainTexture(terrainKey);
        var isLava = (terrainKey === 'lava');
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');

        var matOpts = {};
        if (baseTex) matOpts.map = baseTex;
        else matOpts.color = new THREE.Color(isLava ? 0x883311 : 0x556655);
        if (isLava) {
            matOpts.emissive = new THREE.Color(0xff4411);
            matOpts.emissiveIntensity = isNight ? 0.7 : 0.25;
        }

        var mat = new THREE.MeshLambertMaterial(matOpts);

        var waveTex1 = _getFluidTex(terrainKey, 1);
        var waveTex2 = _getFluidTex(terrainKey, 2);

        var waveOp = (terrainKey === 'deep_water')
            ? { op1: 0.25, op2: 0.18 }
            : { op1: 0.38, op2: 0.28 };

        var drift = _FLUID_DRIFT_3D[terrainKey];
        if (!_fluidTextures[terrainKey + '_off1']) {
            _fluidTextures[terrainKey + '_off1'] = new THREE.Vector2(0, 0);
            _fluidTextures[terrainKey + '_off2'] = new THREE.Vector2(0, 0);
        }
        var off1 = _fluidTextures[terrainKey + '_off1'];
        var off2 = _fluidTextures[terrainKey + '_off2'];

        mat.onBeforeCompile = function(shader) {
            shader.uniforms.uWave1 = { value: waveTex1 };
            shader.uniforms.uWave2 = { value: waveTex2 };
            shader.uniforms.uWaveOff1 = { value: off1 };
            shader.uniforms.uWaveOff2 = { value: off2 };
            shader.uniforms.uWaveOp1 = { value: waveOp.op1 };
            shader.uniforms.uWaveOp2 = { value: waveOp.op2 };

            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                'uniform sampler2D uWave1;\n' +
                'uniform sampler2D uWave2;\n' +
                'uniform vec2 uWaveOff1;\n' +
                'uniform vec2 uWaveOff2;\n' +
                'uniform float uWaveOp1;\n' +
                'uniform float uWaveOp2;\n' +
                'void main() {'
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                '#include <color_fragment>\n' +
                '{\n' +
                '  vec4 w1 = texture2D(uWave1, vUv + uWaveOff1);\n' +
                '  vec4 w2 = texture2D(uWave2, vUv + uWaveOff2);\n' +
                '  diffuseColor.rgb = mix(diffuseColor.rgb, w1.rgb, uWaveOp1 * w1.a);\n' +
                '  diffuseColor.rgb = mix(diffuseColor.rgb, w2.rgb, uWaveOp2 * w2.a);\n' +
                '}\n'
            );
        };

        mat._ew_fluidTop = true;
        mat._ew_fluidType = terrainKey;

        return mat;
    }

    function buildFluidBoxMaterials(topKey, sideKey) {
        var sideTex = getTerrainTexture(sideKey || topKey);
        if (sideTex) {
            sideTex.wrapS = THREE.RepeatWrapping;
            sideTex.wrapT = THREE.RepeatWrapping;
        }
        var isLava = (topKey === 'lava');
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');

        var mats = [];
        for (var i = 0; i < 6; i++) {
            var isTop = (i === 2);
            if (isTop) {
                mats.push(_buildFluidTopMat(topKey));
            } else {
                var matOpts = {};
                if (isLava) {
                    matOpts.emissive = new THREE.Color(0xff4411);
                    matOpts.emissiveIntensity = isNight ? 0.7 : 0.25;
                }
                if (sideTex) matOpts.map = sideTex;
                else matOpts.color = new THREE.Color(isLava ? 0x661100 : 0x443322);
                mats.push(new THREE.MeshLambertMaterial(matOpts));
            }
        }
        return mats;
    }

    function _clearGroup(g) {
        while (g.children.length > 0) { var c = g.children[0]; g.remove(c); _disposeR(c); }
    }
    function _disposeR(obj) {
        /* CSS2DObject: remove DOM element from the CSS2D overlay */
        if (obj.isCSS2DObject && obj.element && obj.element.parentNode) {
            obj.element.parentNode.removeChild(obj.element);
        }
        if (obj.geometry && !obj.geometry._ew_shared) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                for (var i = 0; i < obj.material.length; i++) {
                    if (!obj.material[i]._ew_shared) obj.material[i].dispose();
                }
            }
            else if (!obj.material._ew_shared) obj.material.dispose();
        }
        if (obj.children) { for (var i = obj.children.length - 1; i >= 0; i--) _disposeR(obj.children[i]); }
    }

    function _minSlab(ts) { return ts * ELEV_STEP_RATIO; }

    function tileTopY(x, y) {
        var ts = CONFIG.tileSize || 128;

        var h = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y)
              : (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : 0;

        var base = h * ts * ELEV_STEP_RATIO;

        if (typeof getObjectAt === 'function') {
            var obj = getObjectAt(x, y);
            if (obj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[obj] && OBJECT_RULES[obj].roofWalkable) {
                var oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                if (oSpr && oSpr._roofZPx > 0) base += oSpr._roofZPx;
            }
        }
        return base;
    }

    function unitSurfaceY(unit) {
        var ts = CONFIG.tileSize || 128;
        var ux = unit.x, uy = unit.y;

        if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) {
            var h = unit.z || 0;
            return h * ts * ELEV_STEP_RATIO;
        }

        var baseH = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(ux, uy)
                  : (state.boardHeights && state.boardHeights[uy]) ? (state.boardHeights[uy][ux] || 0) : 0;
        var elevPx = baseH * ts * ELEV_STEP_RATIO;
        var roofExtra = 0;
        if (typeof getObjectAt === 'function') {
            var obj = getObjectAt(ux, uy);
            if (obj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[obj] && OBJECT_RULES[obj].roofWalkable) {
                var oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[obj] : null;
                if (oSpr && oSpr._roofZPx > 0) roofExtra = oSpr._roofZPx;
            }
        }
        return elevPx + roofExtra;
    }

    function _escHtml(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s) : String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    var STAIR_STEPS = 5;

    function _isStairTile(x, y, ht, _bw, _bh) {

        var terrain;
        var explicitDir = null;
        var col = state.boardColumns[y] && state.boardColumns[y][x];
        if (col && col.length) {
            var topBlock = col[col.length - 1];
            terrain = topBlock.terrain;
            if (topBlock.stairDir) explicitDir = topBlock.stairDir;
        } else {
            terrain = '';
        }
        var isBarrierPassage = terrain === 'barrier_passage' ||
            (typeof TERRAIN_RULES !== 'undefined' && TERRAIN_RULES[terrain] && TERRAIN_RULES[terrain].isBarrierPassage);
        if (!isBarrierPassage) return null;

        function _nbrH(nx, ny) {
            if (nx < 0 || ny < 0 || ny >= _bh || nx >= _bw) return ht;
            var nc = state.boardColumns[ny] && state.boardColumns[ny][nx];
            if (nc && nc.length && nc[nc.length - 1].terrain === 'void') return ht;
            return (state.boardHeights && state.boardHeights[ny]) ? (state.boardHeights[ny][nx] || 0) : 0;
        }

        var hN = _nbrH(x, y - 1), hS = _nbrH(x, y + 1);
        var hW = _nbrH(x - 1, y), hE = _nbrH(x + 1, y);
        var maxNbr = Math.max(hN, hS, hW, hE);
        var minNbr = Math.min(hN, hS, hW, hE);

        /* A barrier_passage tile is a ramp as long as a neighbour is higher than
           it. (Stairs now bridge a 1-level difference, so the tile sits flush
           with the low side instead of at an intermediate height.) */
        if (maxNbr <= ht) return null;
        var lowH = Math.min(ht, minNbr);

        if (explicitDir) {

            var opposite = { N: 'S', S: 'N', E: 'W', W: 'E' };
            return { highDir: opposite[explicitDir] || 'N', lowH: lowH, highH: maxNbr };
        }

        var highDir = 'N';
        if (hS === minNbr && hN >= maxNbr) highDir = 'N';
        else if (hN === minNbr && hS >= maxNbr) highDir = 'S';
        else if (hE === minNbr && hW >= maxNbr) highDir = 'W';
        else if (hW === minNbr && hE >= maxNbr) highDir = 'E';
        else if (hN >= maxNbr) highDir = 'N';
        else if (hS >= maxNbr) highDir = 'S';
        else if (hW >= maxNbr) highDir = 'W';
        else highDir = 'E';

        return { highDir: highDir, lowH: lowH, highH: maxNbr };
    }

    function _buildStairMesh(x, y, ts, elevStep, tKey, sKey, stairInfo) {
        var lowH = stairInfo.lowH;
        var highH = stairInfo.highH;
        var highDir = stairInfo.highDir;
        var n = STAIR_STEPS;

        var lowY = lowH * elevStep;
        var highY = highH * elevStep;
        var totalRise = highY - lowY;

        var topTex = getTerrainTexture(tKey);
        var sideTex = getTerrainTexture(sKey || tKey);

        var group = new THREE.Group();

        var stepDepth = ts / n;
        var stepRise = totalRise / n;
        var halfW = ts / 2;
        var halfD = ts / 2;

        for (var i = 0; i < n; i++) {
            var stepTopY = lowY + (i + 1) * stepRise;
            var stepZ = -halfD + stepDepth / 2 + i * stepDepth;

            var vLo = i / n;
            var vHi = (i + 1) / n;

            var treadGeo = new THREE.PlaneGeometry(ts, stepDepth);

            treadGeo.rotateX(-Math.PI / 2);

            var treadUV = treadGeo.getAttribute('uv');

            treadUV.setXY(0, 0, vHi);
            treadUV.setXY(1, 1, vHi);
            treadUV.setXY(2, 0, vLo);
            treadUV.setXY(3, 1, vLo);
            treadUV.needsUpdate = true;

            var treadMat = topTex
                ? new THREE.MeshLambertMaterial({ map: topTex })
                : new THREE.MeshLambertMaterial({ color: new THREE.Color(0x556655) });
            var tread = new THREE.Mesh(treadGeo, treadMat);
            tread.position.set(0, stepTopY, stepZ);
            group.add(tread);
        }

        for (var i = 0; i < n; i++) {
            var riserBottom = lowY + i * stepRise;
            var riserTop = lowY + (i + 1) * stepRise;
            var riserH = riserTop - riserBottom;
            if (riserH < 0.5) continue;
            var riserZ = -halfD + i * stepDepth;

            var riserGeo = new THREE.PlaneGeometry(ts, riserH);

            riserGeo.rotateY(Math.PI);

            var rUVattr = riserGeo.getAttribute('uv');
            var rvLo = riserBottom / highY;
            var rvHi = riserTop / highY;
            if (rvHi > 1) rvHi = 1;
            rUVattr.setXY(0, 1, rvHi);
            rUVattr.setXY(1, 0, rvHi);
            rUVattr.setXY(2, 1, rvLo);
            rUVattr.setXY(3, 0, rvLo);
            rUVattr.needsUpdate = true;

            var rTex = sideTex || topTex;
            var riserMat = rTex
                ? new THREE.MeshLambertMaterial({ map: rTex })
                : new THREE.MeshLambertMaterial({ color: new THREE.Color(0x443322) });
            var riser = new THREE.Mesh(riserGeo, riserMat);
            riser.position.set(0, riserBottom + riserH / 2, riserZ);
            group.add(riser);
        }

        function _buildSideWall(xPos, faceDir) {

            var verts = [];
            var uvs = [];
            var indices = [];
            var vi = 0;

            function pushVert(vz, vy) {
                verts.push(xPos, vy, vz);

                var u = (vz + halfD) / ts;

                var v = (highY > lowY) ? (vy - lowY) / (highY - lowY) : 0;
                if (v < 0) v = 0; if (v > 1) v = 1;
                uvs.push(u, v);
                return vi++;
            }

            function pushQuad(a, b, c, d) {

                if (faceDir > 0) {

                    indices.push(a, c, b, a, d, c);
                } else {

                    indices.push(a, b, c, a, c, d);
                }
            }

            for (var i = 0; i < n; i++) {
                var stepTopYi = lowY + (i + 1) * stepRise;
                var z0 = -halfD + i * stepDepth;
                var z1 = -halfD + (i + 1) * stepDepth;

                var bl = pushVert(z0, lowY);
                var tl = pushVert(z0, stepTopYi);
                var tr = pushVert(z1, stepTopYi);
                var br = pushVert(z1, lowY);
                pushQuad(bl, tl, tr, br);
            }

            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geo.computeVertexNormals();

            var sTex = sideTex || topTex;
            var mat = sTex
                ? new THREE.MeshLambertMaterial({ map: sTex, side: THREE.DoubleSide })
                : new THREE.MeshLambertMaterial({ color: new THREE.Color(0x443322), side: THREE.DoubleSide });

            return new THREE.Mesh(geo, mat);
        }

        group.add(_buildSideWall(halfW, 1));
        group.add(_buildSideWall(-halfW, -1));

        var backH = highY - lowY;
        if (backH > 0.5) {
            var backGeo = new THREE.PlaneGeometry(ts, backH);

            var bTex = sideTex || topTex;
            var backMat = bTex
                ? new THREE.MeshLambertMaterial({ map: bTex })
                : new THREE.MeshLambertMaterial({ color: new THREE.Color(0x443322) });
            var backWall = new THREE.Mesh(backGeo, backMat);
            backWall.position.set(0, lowY + backH / 2, halfD);
            group.add(backWall);
        }

        var bottomGeo = new THREE.PlaneGeometry(ts, ts);
        bottomGeo.rotateX(Math.PI / 2);
        var bottomMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x443322) });
        var bottom = new THREE.Mesh(bottomGeo, bottomMat);
        bottom.position.set(0, lowY, 0);
        group.add(bottom);

        var rotY = 0;
        if (highDir === 'S') rotY = 0;
        else if (highDir === 'N') rotY = Math.PI;
        else if (highDir === 'E') rotY = -Math.PI / 2;
        else if (highDir === 'W') rotY = Math.PI / 2;
        group.rotation.y = rotY;

        group.position.set(x * ts + ts / 2, 0, y * ts + ts / 2);

        return group;
    }

    function rebuildTerrain() {
        if (!terrainGroup) return;
        var ts = CONFIG.tileSize || 128;
        ThreeCamera.setTileSize(ts);
        var elevStep = ts * ELEV_STEP_RATIO;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var full = (_bw !== _lastBoardW || _bh !== _lastBoardH);
        if (full) { _clearGroup(terrainGroup); tileMeshes.clear(); }
        var lavaTiles = [];

        for (var y = 0; y < _bh; y++) {
            for (var x = 0; x < _bw; x++) {
                var tKey, ht, col;

                col = state.boardColumns[y] && state.boardColumns[y][x];
                if (col && col.length) {
                    tKey = col[col.length - 1].terrain || 'grass';
                    ht = col[col.length - 1].z;
                } else {
                    tKey = 'void'; ht = 0; col = null;
                }

                var htLegacy = (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : ht;

                var sKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined') ? (TERRAIN_SIDE_SPRITES[tKey] ?? null) : null;

                var colFp = '';
                if (col && col.length > 1) {
                    for (var ci = 0; ci < col.length; ci++) colFp += col[ci].z + ':' + col[ci].terrain + ',';
                }
                var k = x + ',' + y;
                var ex = tileMeshes.get(k);
                if (ex && ex._ew_terrain === tKey && ex._ew_height === ht && ex._ew_colFp === colFp && !full) {

                    if (tKey === 'lava') lavaTiles.push({ x: x, y: y });
                    continue;
                }
                if (ex) { terrainGroup.remove(ex); _disposeR(ex); tileMeshes.delete(k); }
                if (sKey === null && tKey.startsWith('void')) continue;

                var isLava = (tKey === 'lava');
                if (isLava) lavaTiles.push({ x: x, y: y });

                var stairInfo = _isStairTile(x, y, htLegacy, _bw, _bh);
                var m;
                if (stairInfo) {
                    m = _buildStairMesh(x, y, ts, elevStep, tKey, sKey, stairInfo);
                    m._ew_isStair = true;
                } else if (col && col.length > 1) {

                    m = new THREE.Group();
                    var topZ = col[col.length - 1].z;
                    var totalH = topZ * elevStep;
                    var surfaceTerrain = col[col.length - 1].terrain || 'grass';

                    if (topZ <= 0) {

                        var degSKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined') ? (TERRAIN_SIDE_SPRITES[surfaceTerrain] ?? null) : null;
                        var degMats = buildBoxMaterials(surfaceTerrain, degSKey);
                        var degGeo = _getBoxGeo(ts, elevStep);
                        var degMesh = new THREE.Mesh(degGeo, degMats);
                        degMesh.position.set(0, -elevStep / 2, 0);
                        m.add(degMesh);
                    } else {

                        var zTerrainMap = {};
                        for (var ci = 0; ci < col.length; ci++) zTerrainMap[col[ci].z] = col[ci].terrain || 'grass';

                        var runs = [];
                        var runStartZ = 0;
                        var runTerrain = zTerrainMap[0] || 'grass';
                        for (var zz = 1; zz < topZ; zz++) {
                            var zzTerrain = zTerrainMap[zz] || runTerrain;
                            if (zzTerrain !== runTerrain) {
                                runs.push({ fromZ: runStartZ, toZ: zz - 1, terrain: runTerrain });
                                runStartZ = zz;
                                runTerrain = zzTerrain;
                            }
                        }

                        runs.push({ fromZ: runStartZ, toZ: topZ - 1, terrain: runTerrain });

                        for (var ri = 0; ri < runs.length; ri++) {
                            var run = runs[ri];
                            var rIsTopRun = (ri === runs.length - 1);
                            var rBottomY = run.fromZ * elevStep;
                            var rTopY = (run.toZ + 1) * elevStep;
                            var rH = rTopY - rBottomY;
                            if (rH < 0.5) continue;

                            var rTopTerrain = rIsTopRun ? surfaceTerrain : run.terrain;
                            var rSideTerrain = run.terrain;
                            var rSKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined') ? (TERRAIN_SIDE_SPRITES[rSideTerrain] ?? null) : null;
                            var rIsFluid = !!_FLUID_TERRAIN_SET[rTopTerrain];
                            var rIsLava = (rTopTerrain === 'lava' || rSideTerrain === 'lava');

                            var rTopTex = getTerrainTexture(rTopTerrain);
                            var rSideTex = getTerrainTexture(rSKey || rSideTerrain);
                            if (rSideTex) {
                                rSideTex.wrapS = THREE.RepeatWrapping;
                                rSideTex.wrapT = THREE.RepeatWrapping;
                            }
                            var rMats;
                            if (rIsFluid) {
                                rMats = buildFluidBoxMaterials(rTopTerrain, rSKey);
                            } else if (rIsLava) {
                                rMats = buildLavaBoxMaterials(rTopTerrain, rSKey);
                            } else {

                                rMats = [];
                                for (var fi = 0; fi < 6; fi++) {
                                    var fIsTop = (fi === 2);
                                    var fTex = fIsTop ? rTopTex : rSideTex;
                                    if (fTex) { rMats.push(new THREE.MeshLambertMaterial({ map: fTex })); }
                                    else {
                                        var fc = new THREE.Color(fIsTop ? 0x556655 : 0x443322);
                                        rMats.push(new THREE.MeshLambertMaterial({ color: fc }));
                                    }
                                }
                            }
                            var rGeo = _getBoxGeo(ts, rH);
                            var rMesh = new THREE.Mesh(rGeo, rMats);
                            rMesh.position.set(0, rBottomY + rH / 2, 0);
                            m.add(rMesh);
                            if (rIsLava) m._ew_hasLava = true;
                        }
                    }
                    m.position.set(x * ts + ts / 2, 0, y * ts + ts / 2);
                } else {

                    var boxH = Math.max(elevStep, ht * elevStep);
                    var isFluid = !!_FLUID_TERRAIN_SET[tKey];
                    var mats = isFluid ? buildFluidBoxMaterials(tKey, sKey)
                             : isLava  ? buildLavaBoxMaterials(tKey, sKey)
                             :           buildBoxMaterials(tKey, sKey);
                    var boxGeo = _getBoxGeo(ts, boxH);
                    m = new THREE.Mesh(boxGeo, mats);
                    if (ht <= 0) {

                        m.position.set(x * ts + ts / 2, -boxH / 2, y * ts + ts / 2);
                    } else {
                        m.position.set(x * ts + ts / 2, boxH / 2, y * ts + ts / 2);
                    }
                }
                m._ew_terrain = tKey; m._ew_height = ht; m._ew_tileX = x; m._ew_tileY = y;
                m._ew_colFp = colFp;
                if (isLava || (m._ew_hasLava)) m._ew_isLava = true;
                terrainGroup.add(m); tileMeshes.set(k, m);
            }
        }
        _lastBoardW = _bw; _lastBoardH = _bh;
        _lastTerrainVersion = state._terrainVersion || 0;
        _lastHeightVersion = state._heightVersion || 0;
        _lastVoxelVersion = state._voxelVersion || 0;
        _objectsDirty = true;

        if (ThreePost && ThreePost.rebuildLavaLights) {
            ThreePost.rebuildLavaLights(lavaTiles, tileTopY, ts);
        }
    }

    function _computeObjectSerial() {
        var s = 0, _bw = (typeof bw === 'function') ? bw() : 0, _bh = (typeof bh === 'function') ? bh() : 0;
        if (state.boardObjects) {
            for (var y = 0; y < _bh; y++) {
                var r = state.boardObjects[y]; if (!r) continue;
                for (var x = 0; x < _bw; x++) {
                    if (r[x]) {
                        s += (x+1)*31 + (y+1)*97;

                        var _rkRaw = r[x];
                        var _rk = Array.isArray(_rkRaw) ? (_rkRaw[0] ? (_rkRaw[0].key || null) : null) : _rkRaw;
                        if (_rk && _isBuildingKey(_rk) && typeof OBJECT_SPRITES !== 'undefined') {
                            var oSpr = OBJECT_SPRITES[_rk];
                            if (oSpr && oSpr._trim) s += 10000;
                            if (oSpr && oSpr._coreWidth) s += Math.round(oSpr._coreWidth);
                        }

                        if (Array.isArray(_rkRaw) && _rkRaw[0]) {
                            var _e0 = _rkRaw[0];
                            if (_e0.rot) s += _e0.rot;
                            if (_e0.alignX === 'left') s += 1; else if (_e0.alignX === 'right') s += 2;
                            if (_e0.alignY === 'top') s += 4;
                        }
                    }
                }
            }
        }
        return s;
    }
    function _computeTurretSerial() {
        if (!state.turrets || !state.turrets.length) return '';
        var p = []; for (var i = 0; i < state.turrets.length; i++) { var t = state.turrets[i]; p.push(t.id+':'+t.x+','+t.y+','+t.hp+','+(t.facingAngle!=null?t.facingAngle.toFixed(2):'0')); }
        return p.join('|');
    }

    function _buildBuildingPrism(objKey, x, y) {
        var ts = CONFIG.tileSize || 128;

        var baseH = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y) : 0;
        var topY = baseH * ts * ELEV_STEP_RATIO;
        var oSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
        if (!oSpr) return null;

        if (!oSpr._trim && !oSpr._trimScanning && typeof window._alphaScanSprite === 'function') {
            window._alphaScanSprite(oSpr);
        }

        var R = 128;
        var sprW = oSpr.width || R;
        var sprH = oSpr.height || R;
        var scale = ts / R;
        var trim = oSpr._trim;

        var trimLeft = trim ? trim.left : 0;
        var trimRight = trim ? trim.right : sprW - 1;
        var trimTop = trim ? trim.top : 0;
        var trimBottom = trim ? trim.bottom : sprH - 1;
        var trimmedW = trimRight - trimLeft + 1;
        var trimmedH = trimBottom - trimTop + 1;

        var coreW = oSpr._coreWidth || trimmedW;
        var side = Math.round(coreW * scale);

        if (!trim && side < ts * 0.3) side = Math.round(ts * 0.85);
        var fullWallH = Math.round(trimmedH * scale);

        var profile = oSpr._topProfile;
        var roofZ;
        if (profile && profile.length >= 2) {
            var pts = profile.length;
            var margin = (trimmedW - coreW) / 2;
            var iStart = Math.floor((margin / trimmedW) * pts);
            var iEnd = Math.ceil(((margin + coreW) / trimmedW) * pts);
            var centerProfile = profile.slice(iStart, iEnd);
            if (centerProfile.length > 0) {
                var sorted = centerProfile.slice().sort(function(a, b) { return a - b; });
                var pIdx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
                var roofP = sorted[pIdx];
                roofZ = Math.max(Math.round(fullWallH * 0.4), Math.round(fullWallH - (roofP * scale)));
            } else {
                roofZ = fullWallH - 10;
            }
        } else {
            roofZ = Math.round(ts * DEFAULT_BUILDING_HEIGHT_TILES);
        }
        var wallH = fullWallH || roofZ;

        /* Game height is pinned to the legacy half-tile basis so the 1:1 visual
           step doesn't change LOS / roof-standing heights. The prism is then
           scaled so its roof sits exactly at _gameHeight on the voxel grid. */
        var stepPx = ts * ELEV_STEP_RATIO;
        var gameH = Math.max(1, Math.floor(roofZ / (ts * 0.5)));
        var roofScale = (gameH * stepPx) / roofZ;
        roofZ = gameH * stepPx;
        wallH = wallH * roofScale;
        oSpr._gameHeight = gameH;
        oSpr._roofZPx = roofZ;

        var g = new THREE.Group();

        var boxGeo = new THREE.BoxGeometry(side, roofZ, side);
        var darkMat = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
        var darkBox = new THREE.Mesh(boxGeo, darkMat);
        darkBox.position.y = roofZ / 2;
        g.add(darkBox);

        var roofTex = getTerrainTexture('bricks_3');
        var roofMat = roofTex
            ? new THREE.MeshBasicMaterial({ map: roofTex, side: THREE.DoubleSide })
            : new THREE.MeshBasicMaterial({ color: 0x8b6b4a, side: THREE.DoubleSide });
        var roofGeo = new THREE.PlaneGeometry(side, side);
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.rotation.x = -Math.PI / 2;
        roofMesh.position.y = roofZ + 0.5;
        g.add(roofMesh);

        var wallTex = getObjectTexture(objKey);
        if (wallTex) {

            var coreLeft = trimLeft + Math.round((trimmedW - coreW) / 2);
            var uL = coreLeft / sprW;
            var uR = (coreLeft + coreW) / sprW;

            var vBottom = 1 - (trimBottom + 1) / sprH;
            var vTop = 1 - (trimBottom + 1 - trimmedH) / sprH;
            if (vTop > 1) vTop = 1;
            if (vBottom < 0) vBottom = 0;

            var zOff = 1.5;
            var dirs = [
                { rY: 0,            pX: 0,        pZ:  side / 2 + zOff },
                { rY: Math.PI,      pX: 0,        pZ: -side / 2 - zOff },
                { rY: -Math.PI / 2, pX:  side / 2 + zOff, pZ: 0        },
                { rY:  Math.PI / 2, pX: -side / 2 - zOff, pZ: 0        }
            ];
            var bValues = [0.55, 0.43, 0.48, 0.48];

            for (var fi = 0; fi < dirs.length; fi++) {
                var d = dirs[fi];
                var b = bValues[fi];
                var faceGeo = new THREE.PlaneGeometry(side, wallH);

                var fuv = faceGeo.getAttribute('uv');
                if (fuv) {

                    fuv.setXY(0, uL, vTop);
                    fuv.setXY(1, uR, vTop);
                    fuv.setXY(2, uL, vBottom);
                    fuv.setXY(3, uR, vBottom);
                    fuv.needsUpdate = true;
                }

                var faceMat = new THREE.MeshBasicMaterial({
                    map: wallTex, color: new THREE.Color(b, b, b),
                    transparent: true, alphaTest: 0.1,
                    side: THREE.DoubleSide, depthWrite: true
                });
                var faceMesh = new THREE.Mesh(faceGeo, faceMat);

                faceMesh.position.set(d.pX, wallH / 2, d.pZ);
                faceMesh.rotation.y = d.rY;
                g.add(faceMesh);
            }
        }

        /* For columns, offset from center to edge/corner so they don't clip with units */
        var posOffX = 0, posOffZ = 0;
        if (objKey.startsWith('column_')) {
            var stack = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : [];
            var entry = null;
            for (var si = 0; si < stack.length; si++) {
                var ek = stack[si].key || stack[si];
                if (ek === objKey) { entry = stack[si]; break; }
            }
            var alignX = entry ? (entry.alignX || 'center') : 'center';
            var alignY = entry ? (entry.alignY || 'bottom') : 'bottom';
            /* Push column to tile edge/corner: offset by ~35% of tile so it sits near the perimeter */
            var edgeOff = ts * 0.35;
            if (alignX !== 'center' || (alignY !== 'center' && alignY !== 'bottom')) {
                /* Explicit non-default alignment — use it directly */
                if (alignX === 'left')   posOffX = -edgeOff;
                if (alignX === 'right')  posOffX =  edgeOff;
                if (alignY === 'top')    posOffZ = -edgeOff;
                if (alignY === 'bottom') posOffZ =  edgeOff;
            } else {
                /* Default/legacy alignment — push to a deterministic corner based on tile coords */
                var cornerIdx = (x + y) % 4;
                posOffX = (cornerIdx < 2 ? -1 : 1) * edgeOff;
                posOffZ = (cornerIdx % 2 === 0 ? -1 : 1) * edgeOff;
            }
        }

        g.position.set(x * ts + ts / 2 + posOffX, topY, y * ts + ts / 2 + posOffZ);
        return g;
    }
    function _buildTurret(turret) {
        var ts = CONFIG.tileSize || 128, topY = tileTopY(turret.x, turret.y);
        var isSiege = turret.spellId === 'siegeTurret';
        var r = ts * (isSiege ? 0.42 : TURRET_RADIUS_RATIO);
        var h = ts * (isSiege ? 0.85 : TURRET_HEIGHT_RATIO);
        var col = turret.owner ? _viewerPlayerColor(turret.owner) : 0x888888;
        var g = new THREE.Group();

        var brickTex = getTerrainTexture('bricks_2');
        var bodyMat;
        if (brickTex) {
            brickTex.wrapS = THREE.RepeatWrapping; brickTex.wrapT = THREE.RepeatWrapping;
            brickTex.repeat.set(3, 1);
            bodyMat = new THREE.MeshLambertMaterial({ map: brickTex });
        } else {
            bodyMat = new THREE.MeshLambertMaterial({ color: col });
        }
        var body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8, 1, true), bodyMat);
        body.position.y = h / 2; g.add(body);

        var domeMat;
        if (brickTex) {
            domeMat = new THREE.MeshLambertMaterial({ map: brickTex });
        } else {
            domeMat = new THREE.MeshLambertMaterial({ color: col });
        }
        var dome = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
        dome.position.y = h; g.add(dome);

        var floorMat = new THREE.MeshBasicMaterial({ color: 0x0a0806 });
        var floor = new THREE.Mesh(new THREE.CircleGeometry(r, 8), floorMat);
        floor.rotation.x = Math.PI / 2;
        floor.position.y = 0.5;
        g.add(floor);

        var ringGeo = new THREE.TorusGeometry(r, 1.5, 4, 8);
        var ringMat = new THREE.MeshBasicMaterial({ color: col });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = h;
        g.add(ring);

        var cL = ts * CANNON_LENGTH_RATIO;
        var cannon = new THREE.Mesh(new THREE.BoxGeometry(CANNON_THICKNESS, CANNON_THICKNESS, cL),
            new THREE.MeshLambertMaterial({ color: 0x333333 }));
        cannon.position.y = h + CANNON_THICKNESS; cannon.position.z = cL / 2;
        g.add(cannon);

        if (turret.facingAngle != null) g.rotation.y = -turret.facingAngle;
        g.position.set(turret.x * ts + ts / 2, topY, turret.y * ts + ts / 2);
        g._ew_turretId = turret.id; return g;
    }

    /* ── 3D tree geometry variants ── */
    var _treeWoodTex = null, _treeForestTex = null;
    function _getTreeWoodTex() {
        if (_treeWoodTex) return _treeWoodTex;
        _treeWoodTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/wood.png');
        if (_treeWoodTex) {
            _treeWoodTex.wrapS = THREE.RepeatWrapping;
            _treeWoodTex.wrapT = THREE.RepeatWrapping;
            _treeWoodTex.repeat.set(2, 2);
        }
        return _treeWoodTex;
    }
    function _getTreeForestTex() {
        if (_treeForestTex) return _treeForestTex;
        _treeForestTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/forest.png');
        if (_treeForestTex) {
            _treeForestTex.wrapS = THREE.RepeatWrapping;
            _treeForestTex.wrapT = THREE.RepeatWrapping;
            _treeForestTex.repeat.set(3, 2);
        }
        return _treeForestTex;
    }

    /* Rock/boulder texture for 3D rock clusters */
    var _rockClusterTex = null;
    function _getBoulderTexture() {
        if (_rockClusterTex) return _rockClusterTex;
        _rockClusterTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/rock.png');
        if (_rockClusterTex) {
            _rockClusterTex.wrapS = THREE.RepeatWrapping;
            _rockClusterTex.wrapT = THREE.RepeatWrapping;
            _rockClusterTex.repeat.set(2, 2);
        }
        return _rockClusterTex;
    }

    /* Crystal texture for 3D crystal cones */
    var _crystalClusterTex = null;
    function _getCrystalTexture() {
        if (_crystalClusterTex) return _crystalClusterTex;
        _crystalClusterTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/crystal.png');
        if (_crystalClusterTex) {
            _crystalClusterTex.wrapS = THREE.RepeatWrapping;
            _crystalClusterTex.wrapT = THREE.RepeatWrapping;
            _crystalClusterTex.repeat.set(1, 2);
        }
        return _crystalClusterTex;
    }

    var _TREE_VARIANTS = {
        tree:   { trunkHMul: 1.0, canopyRMul: 1.0,  canopySquish: 0.7,  canopyColor: 0x2a7a2a, trunkColor: 0x5a4030 },
        tree_2: { trunkHMul: 1.15, canopyRMul: 0.9,  canopySquish: 0.85, canopyColor: 0x1e6e2e, trunkColor: 0x604535 },
        tree_3: { trunkHMul: 0.85, canopyRMul: 1.1,  canopySquish: 0.6,  canopyColor: 0x3a8a30, trunkColor: 0x4a3828 },
        tree_4: { trunkHMul: 1.2,  canopyRMul: 0.75, canopySquish: 0.9,  canopyColor: 0x226622, trunkColor: 0x553d2a },
        tree_5: { trunkHMul: 0.95, canopyRMul: 1.15, canopySquish: 0.65, canopyColor: 0x448833, trunkColor: 0x5e4838 },
        tree_6: { trunkHMul: 1.1,  canopyRMul: 0.85, canopySquish: 0.75, canopyColor: 0x1a5a28, trunkColor: 0x4e3a2c },
    };

    function _buildTree3D(objKey, x, y) {
        var ts = CONFIG.tileSize || 128;
        var topY = tileTopY(x, y);
        var v = _TREE_VARIANTS[objKey] || _TREE_VARIANTS.tree;

        var trunkH = ts * 1.2 * v.trunkHMul;
        var trunkR = ts * 0.10;
        var canopyR = ts * 0.48 * v.canopyRMul;

        var g = new THREE.Group();

        /* trunk — tapered cone with wood texture, tiled to match terrain pixel density */
        var trunkGeo = new THREE.ConeGeometry(trunkR, trunkH, 8, 1, false);
        var woodTex = _getTreeWoodTex();
        var trunkMat;
        if (woodTex) {
            trunkMat = new THREE.MeshBasicMaterial({ map: woodTex, color: new THREE.Color(v.trunkColor), depthWrite: true });
        } else {
            trunkMat = new THREE.MeshBasicMaterial({ color: v.trunkColor, depthWrite: true });
        }
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH * 0.5;
        g.add(trunk);

        /* canopy — squished sphere with forest texture, tiled so pixels stay crisp */
        var canopyGeo = new THREE.SphereGeometry(canopyR, 10, 7);
        var forestTex = _getTreeForestTex();
        var canopyMat;
        if (forestTex) {
            canopyMat = new THREE.MeshBasicMaterial({ map: forestTex, color: new THREE.Color(v.canopyColor), depthWrite: true });
        } else {
            canopyMat = new THREE.MeshBasicMaterial({ color: v.canopyColor, depthWrite: true });
        }
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.scale.set(1, v.canopySquish, 1);
        canopy.position.y = trunkH * 0.8;
        g.add(canopy);

        /* subtle darker inner shell for depth */
        var innerMat = new THREE.MeshBasicMaterial({
            color: 0x0a1a08, transparent: true, opacity: 0.25,
            side: THREE.BackSide, depthWrite: false,
        });
        var inner = new THREE.Mesh(canopyGeo, innerMat);
        inner.scale.set(0.85, v.canopySquish * 0.85, 0.85);
        inner.position.y = trunkH * 0.8;
        g.add(inner);

        /* small random yaw rotation for visual variety */
        g.rotation.y = (x * 7 + y * 13) % 6;

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    function _buildCrossBillboard(objKey, x, y) {
        var ts = CONFIG.tileSize || 128, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
        var w = ts, h = ts * BILLBOARD_DEFAULT_H;
        if (spr && spr.width && spr.height) { h = ts * BILLBOARD_DEFAULT_H; w = h * (spr.width / spr.height); }
        var mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true
        });
        var g = new THREE.Group();

        var planeA = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        planeA.position.y = h / 2;
        g.add(planeA);

        var planeB = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        planeB.rotation.y = Math.PI / 2;
        planeB.position.y = h / 2;
        g.add(planeB);

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    function _buildBarrierSlab(objKey, x, y) {
        var ts = CONFIG.tileSize || 128, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;

        var sprW = (spr && spr.width) ? spr.width : 128;
        var sprH = (spr && spr.height) ? spr.height : 32;
        var scale = ts / 128;

        var slabW = sprW * scale;
        var slabH = sprH * scale;
        var slabD = 4 * scale;

        var stack = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : [];
        var entry = null;
        for (var si = 0; si < stack.length; si++) {
            var ek = stack[si].key || stack[si];
            if (ek === objKey) { entry = stack[si]; break; }
        }
        var rot = entry ? (entry.rot || 0) : 0;
        var alignX = entry ? (entry.alignX || 'center') : 'center';
        var alignY = entry ? (entry.alignY || 'bottom') : 'bottom';

        var frontMat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true
        });
        var edgeMat = new THREE.MeshBasicMaterial({ color: 0x3a3028 });

        var mats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, frontMat];
        var slab = new THREE.Mesh(new THREE.BoxGeometry(slabW, slabH, slabD), mats);

        var offX = 0, offZ = 0;
        if (alignX === 'left')  offX = -ts * 0.25;
        if (alignX === 'right') offX =  ts * 0.25;
        if (alignY === 'top')    offZ = -ts * 0.25;
        if (alignY === 'bottom') offZ =  ts * 0.25;

        var g = new THREE.Group();
        slab.position.set(offX, slabH / 2, offZ);
        g.add(slab);

        if (rot) g.rotation.y = -rot * Math.PI / 180;

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    function _buildBillboard(objKey, x, y) {
        var ts = CONFIG.tileSize || 128, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
        var w = ts, h = ts * BILLBOARD_DEFAULT_H;
        if (spr && spr.width && spr.height) { h = ts * BILLBOARD_DEFAULT_H; w = h * (spr.width / spr.height); }
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true
        }));
        m.position.set(x*ts+ts/2, topY+h/2, y*ts+ts/2); m._ew_billboard = true; return m;
    }

    /* ── Tower Cube: floating spinning cube with fractal texture ── */
    var _fractalTex = null;
    function _getFractalTex() {
        if (_fractalTex) return _fractalTex;
        _fractalTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/fractal.png');
        if (_fractalTex) {
            _fractalTex.wrapS = THREE.RepeatWrapping;
            _fractalTex.wrapT = THREE.RepeatWrapping;
        }
        return _fractalTex;
    }

    function _buildTowerCube(x, y, owner) {
        var ts = CONFIG.tileSize || 128;
        var topY = tileTopY(x, y);
        var cubeSize = ts * 0.55;
        var floatH = ts * 1.0;

        var fracTex = _getFractalTex();
        var tint = (owner === 1) ? _viewerPlayerColor(1) : _viewerPlayerColor(2);
        var mat = fracTex
            ? new THREE.MeshBasicMaterial({ map: fracTex, color: new THREE.Color(tint) })
            : new THREE.MeshBasicMaterial({ color: tint });

        var geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        var cube = new THREE.Mesh(geo, mat);

        /* inner glow shell */
        var glowMat = new THREE.MeshBasicMaterial({
            color: tint, transparent: true, opacity: 0.15,
            side: THREE.BackSide, depthWrite: false
        });
        var glow = new THREE.Mesh(new THREE.BoxGeometry(cubeSize * 1.25, cubeSize * 1.25, cubeSize * 1.25), glowMat);

        var g = new THREE.Group();
        g.add(cube);
        g.add(glow);
        g.position.set(x * ts + ts / 2, topY + floatH, y * ts + ts / 2);
        g._ew_towerCube = true;
        g._ew_towerOwner = owner;
        g._ew_cubeInner = cube;
        g._ew_cubeGlow = glow;

        /* ── Tower health bar (CSS2DObject, same style as unit plates) ── */
        _ensurePlateStyles();
        var tw = state.towers ? state.towers[owner] : null;
        var hp = tw ? tw.hp : 0;
        var maxHp = tw ? (tw.maxHp || 1) : 1;
        var hpPct = Math.max(0, Math.round(100 * hp / maxHp));
        var allyCls = _isAllyPlayer(owner) ? 'tp-hp-ally' : 'tp-hp-enemy';
        var ticksHtml = _buildHpTicks(maxHp);

        var pCls = owner === 1 ? 'tp-p1' : 'tp-p2';
        /* Wrap in a 0×0 .tp-plate-outer just like unit plates do. Passing the
           .tp-wrap directly to CSS2DObject lets its CSS `position:absolute;
           bottom:0` pin it to the bottom of the full-screen CSS2D container,
           which dumped the cube health bar far below the map. */
        var outer = document.createElement('div');
        outer.className = 'tp-plate-outer';
        var wrap = document.createElement('div');
        wrap.className = 'tp-wrap ' + pCls + ' tp-tower-plate';
        wrap.innerHTML =
            '<div class="tp-name"><span class="tp-lvl">⬡</span>Cube</div>' +
            '<div class="tp-body">' +
                '<div class="tp-bars">' +
                    '<div class="tp-bar ' + allyCls + '">' +
                        '<div class="tp-hp-fill" style="width:' + hpPct + '%"></div>' +
                        ticksHtml +
                        '<span class="tp-bar-num">' + hp + '/' + maxHp + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        outer.appendChild(wrap);

        var css2d = new THREE.CSS2DObject(outer);
        css2d.position.set(0, cubeSize * 1.1, 0);
        g.add(css2d);
        g._ew_towerPlateEl = wrap;
        g._ew_lastTowerHp = hp;

        return g;
    }

    function _updateTowerCubes() {
        var now = performance.now() * 0.001;
        for (var i = 0; i < _towerCubes.length; i++) {
            var tc = _towerCubes[i];
            /* Spin on Y and wobble on X */
            tc._ew_cubeInner.rotation.y = now * 0.8 + i * 1.5;
            tc._ew_cubeInner.rotation.x = Math.sin(now * 0.6 + i * 2.0) * 0.35;
            /* Glow counter-rotates slowly */
            tc._ew_cubeGlow.rotation.y = -now * 0.3 + i;
            tc._ew_cubeGlow.rotation.z = now * 0.2;
            /* Gentle float bob */
            var bob = Math.sin(now * 1.2 + i * 3.14) * (CONFIG.tileSize || 128) * 0.06;
            tc.position.y = tc._ew_baseY + bob;

            /* ── Patch tower HP bar smoothly ── */
            var owner = tc._ew_towerOwner;
            var tw = state.towers ? state.towers[owner] : null;
            if (tw && tc._ew_towerPlateEl) {
                var hp = tw.hp;
                var maxHp = tw.maxHp || 1;
                if (hp !== tc._ew_lastTowerHp) {
                    tc._ew_lastTowerHp = hp;
                    var hpPct = Math.max(0, Math.round(100 * hp / maxHp));
                    var hpFill = tc._ew_towerPlateEl.querySelector('.tp-hp-fill');
                    if (hpFill) hpFill.style.width = hpPct + '%';
                    // ally/enemy color is static — no tier swap needed
                    var hpNum = tc._ew_towerPlateEl.querySelector('.tp-bar-num');
                    if (hpNum) hpNum.textContent = hp + '/' + maxHp;
                }
            }
        }
    }

    /* ── Rock Cluster: 2-4 noisy icosahedrons with rock texture ── */
    function _buildRockCluster3D(x, y) {
        var ts = CONFIG.tileSize || 128;
        var topY = tileTopY(x, y);
        var rockTex = _getBoulderTexture();
        var g = new THREE.Group();

        /* Seed-based pseudo-random for consistent look per tile */
        var seed = (x * 73 + y * 137 + 42) & 0xFFFF;
        var _sr = function() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return (seed & 0xFFFF) / 0xFFFF; };

        var count = 2 + Math.floor(_sr() * 3); /* 2-4 rocks */
        for (var ri = 0; ri < count; ri++) {
            var radius = ts * (0.08 + _sr() * 0.12);
            var baseGeo = new THREE.IcosahedronGeometry(1, 1);
            var posAttr = baseGeo.getAttribute('position');
            for (var vi = 0; vi < posAttr.count; vi++) {
                var vx = posAttr.getX(vi), vy = posAttr.getY(vi), vz = posAttr.getZ(vi);
                var noise = 1 + 0.3 * Math.sin(vx * 7.3 + vy * 11.1 + ri) * Math.cos(vz * 5.7 + vx * 3.2 + ri * 2);
                posAttr.setXYZ(vi, vx * noise, vy * noise * 0.7, vz * noise); /* squish Y for flatter rocks */
            }
            posAttr.needsUpdate = true;
            baseGeo.computeVertexNormals();

            var shade = 0.5 + _sr() * 0.3;
            var mat = rockTex
                ? new THREE.MeshBasicMaterial({ map: rockTex, color: new THREE.Color(shade, shade * 0.95, shade * 0.9), depthWrite: true })
                : new THREE.MeshBasicMaterial({ color: new THREE.Color(shade * 0.6, shade * 0.55, shade * 0.5), depthWrite: true });

            var rock = new THREE.Mesh(baseGeo, mat);
            rock.scale.set(radius, radius, radius);
            /* Scatter within tile */
            var offX = (_sr() - 0.5) * ts * 0.5;
            var offZ = (_sr() - 0.5) * ts * 0.5;
            rock.position.set(offX, radius * 0.6, offZ);
            rock.rotation.y = _sr() * Math.PI * 2;
            g.add(rock);
        }

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        g._ew_decoX = x;
        g._ew_decoY = y;
        return g;
    }

    /* ── Crystal Cluster: 3-5 tall cones with crystal.png texture + glow ── */
    function _buildCrystalCluster3D(x, y) {
        var ts = CONFIG.tileSize || 128;
        var topY = tileTopY(x, y);
        var g = new THREE.Group();

        var seed = (x * 53 + y * 97 + 17) & 0xFFFF;
        var _sr = function() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return (seed & 0xFFFF) / 0xFFFF; };

        var crystalTex = _getCrystalTexture();
        var crystalColors = [0x8844cc, 0x6633aa, 0xaa55ee, 0x9944dd, 0x7733bb];
        var count = 3 + Math.floor(_sr() * 3); /* 3-5 crystals */

        for (var ci = 0; ci < count; ci++) {
            var h = ts * (0.3 + _sr() * 0.6);
            var r = ts * (0.04 + _sr() * 0.06);
            var geo = new THREE.ConeGeometry(r, h, 5, 1);

            var color = crystalColors[ci % crystalColors.length];
            var mat = crystalTex
                ? new THREE.MeshBasicMaterial({
                    map: crystalTex, color: color, transparent: true, opacity: 0.78,
                    depthWrite: true
                })
                : new THREE.MeshBasicMaterial({
                    color: color, transparent: true, opacity: 0.72,
                    depthWrite: true
                });

            var crystal = new THREE.Mesh(geo, mat);
            /* Scatter and tilt within tile */
            var offX = (_sr() - 0.5) * ts * 0.45;
            var offZ = (_sr() - 0.5) * ts * 0.45;
            crystal.position.set(offX, h * 0.5, offZ);
            crystal.rotation.z = (_sr() - 0.5) * 0.3;
            crystal.rotation.x = (_sr() - 0.5) * 0.25;
            g.add(crystal);

            /* Inner glow — slightly smaller, additive */
            var glowMat = new THREE.MeshBasicMaterial({
                color: 0xccaaff, transparent: true, opacity: 0.15,
                side: THREE.BackSide, depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            var glowCrystal = new THREE.Mesh(geo, glowMat);
            glowCrystal.position.copy(crystal.position);
            glowCrystal.rotation.copy(crystal.rotation);
            glowCrystal.scale.set(1.15, 1.05, 1.15);
            g.add(glowCrystal);
        }

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        g._ew_decoX = x;
        g._ew_decoY = y;
        return g;
    }

    /* ── Terrain Decoration Builder: scans terrain and places rock/crystal clusters ── */
    var _ROCK_TERRAIN_SET = { rocks_1: true, rocks_2: true, rocks_3: true, rocks_4: true, rocks_5: true };
    var _CRYSTAL_TERRAIN_SET = { crystal: true };

    function _computeTerrainDecoSerial() {
        /* Quick hash: terrain version + height version */
        return (state._terrainVersion || 0) + ':' + (state._heightVersion || 0);
    }

    function rebuildTerrainDecorations() {
        if (!objectGroup) return;
        /* Clear old decorations */
        if (_terrainDecoGroup) {
            objectGroup.remove(_terrainDecoGroup);
            _disposeR(_terrainDecoGroup);
        }
        _terrainDecoGroup = new THREE.Group();

        var _bw = (typeof bw === 'function') ? bw() : 0;
        var _bh = (typeof bh === 'function') ? bh() : 0;

        for (var dy = 0; dy < _bh; dy++) {
            for (var dx = 0; dx < _bw; dx++) {
                var terrain = (typeof getTerrainAt === 'function') ? getTerrainAt(dx, dy) : null;
                if (!terrain) continue;

                /* Skip tiles that already have objects — don't double-stack */
                var existingObj = (typeof getObjectAt === 'function') ? getObjectAt(dx, dy) : null;
                if (existingObj) continue;

                /* Deterministic skip: only ~40% of matching tiles get a decoration for variety */
                var hash = (dx * 73 + dy * 137 + 7) & 0xFF;
                if (hash > 102) continue; /* ~40% chance */

                var m = null;
                if (_ROCK_TERRAIN_SET[terrain])    m = _buildRockCluster3D(dx, dy);
                if (_CRYSTAL_TERRAIN_SET[terrain]) m = _buildCrystalCluster3D(dx, dy);
                if (m) _terrainDecoGroup.add(m);
            }
        }

        objectGroup.add(_terrainDecoGroup);
        _lastTerrainDecoSerial = _computeTerrainDecoSerial();
    }

    function rebuildObjects() {
        if (!objectGroup) return;
        var rem = []; for (var i = 0; i < objectGroup.children.length; i++) { var ch = objectGroup.children[i]; if (!ch._ew_turretId && ch !== _terrainDecoGroup) rem.push(ch); }
        for (var j = 0; j < rem.length; j++) { objectGroup.remove(rem[j]); _disposeR(rem[j]); }
        objectMeshes.clear(); _initBuildingKeys(); _kickBuildingAlphaScans();
        /* Explicitly remove tower cube CSS2D plates (health bars) from scene */
        for (var ti = 0; ti < _towerCubes.length; ti++) {
            var tc = _towerCubes[ti];
            for (var ci = tc.children.length - 1; ci >= 0; ci--) {
                if (tc.children[ci].isCSS2DObject) tc.remove(tc.children[ci]);
            }
        }
        _towerCubes.length = 0;
        var _bw = (typeof bw === 'function') ? bw() : 0, _bh = (typeof bh === 'function') ? bh() : 0;
        for (var y = 0; y < _bh; y++) { for (var x = 0; x < _bw; x++) {
            var ok = (typeof getObjectAt === 'function') ? getObjectAt(x, y) : null; if (!ok) continue;
            var m;
            if (ok === 'tower_cube') {
                /* Tower cubes are built from live tower state, not the static object */
                continue;
            }
            else if (_isTreeKey(ok))              m = _buildTree3D(ok, x, y);
            else if (_isBuildingKey(ok))      m = _buildBuildingPrism(ok, x, y);
            else if (_isCrossBillboard(ok))   m = _buildCrossBillboard(ok, x, y);
            else if (_isBarrierKey(ok))       m = _buildBarrierSlab(ok, x, y);
            else                              m = _buildBillboard(ok, x, y);
            if (m) { objectGroup.add(m); objectMeshes.set(x+','+y, m); }
        }}

        /* Build tower cubes from live state.towers — these float above their tile */
        if (state.towers) {
            for (var tOwner = 1; tOwner <= 2; tOwner++) {
                var tw = state.towers[tOwner];
                if (!tw || tw.hp <= 0) continue;
                var tcm = _buildTowerCube(tw.x, tw.y, tOwner);
                tcm._ew_baseY = tcm.position.y;
                objectGroup.add(tcm);
                _towerCubes.push(tcm);
            }
        }

        _lastObjectSerial = _computeObjectSerial(); _objectsDirty = false;

        _lastUnitSerial = '';
        _lastStructuralSerial = '';

        /* Rebuild terrain decorations if needed */
        rebuildTerrainDecorations();
    }
    function rebuildTurrets() {
        if (!objectGroup) return;
        for (var e of turretMeshes) { objectGroup.remove(e[1]); _disposeR(e[1]); }
        turretMeshes.clear();
        if (!state.turrets) return;
        for (var i = 0; i < state.turrets.length; i++) { var t = state.turrets[i]; if (t.hp <= 0) continue; var m = _buildTurret(t); objectGroup.add(m); turretMeshes.set(t.id, m); }
        _lastTurretSerial = _computeTurretSerial();
    }

    var _DEPLOY_SPRITE_URLS = {
        'seed-heal':   (typeof HEALING_SEED_SPRITE_URL !== 'undefined') ? HEALING_SEED_SPRITE_URL : null,
        'seed-poison': (typeof POISON_SEED_SPRITE_URL  !== 'undefined') ? POISON_SEED_SPRITE_URL  : null,
        'seed-leech':  (typeof LEECH_SEED_SPRITE_URL   !== 'undefined') ? LEECH_SEED_SPRITE_URL   : null,
        'bomb':        (typeof BOMB_SPRITE_URL          !== 'undefined') ? BOMB_SPRITE_URL          : null,
        'ward':        (typeof WARD_SPRITE_URL          !== 'undefined') ? WARD_SPRITE_URL          : null
    };

    function _computeDeployableSerial() {
        var parts = [];
        if (state.plantedSeeds) {
            for (var i = 0; i < state.plantedSeeds.length; i++) {
                var s = state.plantedSeeds[i];
                parts.push('s' + s.x + ',' + s.y + ':' + s.type);
            }
        }
        if (state.bombs) {
            for (var i = 0; i < state.bombs.length; i++) {
                var b = state.bombs[i];
                parts.push('b' + b.x + ',' + b.y + ':' + b.owner);
            }
        }
        if (state.wards) {
            for (var i = 0; i < state.wards.length; i++) {
                var w = state.wards[i];
                parts.push('w' + w.x + ',' + w.y + ':' + w.owner);
            }
        }
        if (state.warpRunes) {
            for (var i = 0; i < state.warpRunes.length; i++) {
                var r = state.warpRunes[i];
                parts.push('r' + r.x + ',' + r.y + ':' + r.owner);
            }
        }
        if (state._deployedObjects) {
            for (var i = 0; i < state._deployedObjects.length; i++) {
                var d = state._deployedObjects[i];
                if (d.hp > 0) parts.push('d' + d.x + ',' + d.y + ':' + d.ownerPlayer + ':' + (d.spellName || '') + ':' + d.hp);
            }
        }
        return parts.join('|');
    }

    function _buildDeployableBillboard(spriteKey, x, y, tint) {
        var url = _DEPLOY_SPRITE_URLS[spriteKey];
        if (!url) return null;
        var tex = getTexture(url);
        if (!tex) return null;
        var ts = CONFIG.tileSize || 128;
        var topY = tileTopY(x, y);

        var h = ts * 0.6;
        var w = h;
        var mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1,
            side: THREE.DoubleSide, depthWrite: true
        });
        if (tint) mat.color = new THREE.Color(tint);

        var isSeed = spriteKey.indexOf('seed') === 0;
        if (isSeed) {
            var g = new THREE.Group();
            var planeA = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            planeA.position.y = h / 2;
            g.add(planeA);
            var planeB = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            planeB.rotation.y = Math.PI / 2;
            planeB.position.y = h / 2;
            g.add(planeB);
            g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
            g._ew_deployable = true;
            return g;
        }

        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
        m.position.set(x * ts + ts / 2, topY + h / 2, y * ts + ts / 2);
        m._ew_billboard = true;
        m._ew_deployable = true;
        return m;
    }

    function rebuildDeployables() {
        if (!objectGroup) return;

        /* Detach decoy nameplates first so their DOM elements are dropped cleanly. */
        for (var _dpi = 0; _dpi < _decoyPlates.length; _dpi++) {
            var _dpe = _decoyPlates[_dpi];
            if (_dpe.css2d && _dpe.css2d.parent) _dpe.css2d.parent.remove(_dpe.css2d);
        }
        _decoyPlates.length = 0;

        for (var entry of deployableMeshes) {
            objectGroup.remove(entry[1]);
            _disposeR(entry[1]);
        }
        deployableMeshes.clear();

        var idx = 0;

        if (state.plantedSeeds) {
            for (var i = 0; i < state.plantedSeeds.length; i++) {
                var s = state.plantedSeeds[i];
                var sprKey = 'seed-' + s.type;
                var m = _buildDeployableBillboard(sprKey, s.x, s.y, null);
                if (m) {
                    var key = 'dep_' + (idx++);
                    m._ew_depX = s.x; m._ew_depY = s.y;
                    objectGroup.add(m);
                    deployableMeshes.set(key, m);
                }
            }
        }

        if (state.bombs) {
            for (var i = 0; i < state.bombs.length; i++) {
                var b = state.bombs[i];
                var m = _buildDeployableBillboard('bomb', b.x, b.y, null);
                if (m) {
                    var key = 'dep_' + (idx++);
                    m._ew_depX = b.x; m._ew_depY = b.y;
                    objectGroup.add(m);
                    deployableMeshes.set(key, m);
                }
            }
        }

        if (state.wards) {
            for (var i = 0; i < state.wards.length; i++) {
                var w = state.wards[i];
                var m = _buildDeployableBillboard('ward', w.x, w.y, null);
                if (m) {
                    var key = 'dep_' + (idx++);
                    m._ew_depX = w.x; m._ew_depY = w.y;
                    objectGroup.add(m);
                    deployableMeshes.set(key, m);
                }
            }
        }

        /* Warp Runes — flat glowing rune sigil laid on the tile. The rune is
           "hidden" from the opponent, so only render it for its owner (the
           viewing player). Uses the warp rune SVG from SEED_TILE_SPRITES. */
        if (state.warpRunes && typeof SEED_TILE_SPRITES !== 'undefined' &&
            SEED_TILE_SPRITES.warp && SEED_TILE_SPRITES.warp.length) {
            var _runeVp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
            var _runeUrl = SEED_TILE_SPRITES.warp[0];
            var _runeTs = CONFIG.tileSize || 128;
            for (var i = 0; i < state.warpRunes.length; i++) {
                var rr = state.warpRunes[i];
                if (rr.owner !== _runeVp) continue;
                var rtex = getTexture(_runeUrl);
                if (!rtex) continue;
                var rmat = new THREE.MeshBasicMaterial({
                    map: rtex, transparent: true, alphaTest: 0.01,
                    side: THREE.DoubleSide, depthWrite: false
                });
                var rmesh = new THREE.Mesh(new THREE.PlaneGeometry(_runeTs * 0.92, _runeTs * 0.92), rmat);
                rmesh.rotation.x = -Math.PI / 2;
                var rtopY = tileTopY(rr.x, rr.y);
                rmesh.position.set(rr.x * _runeTs + _runeTs / 2, rtopY + 0.6, rr.y * _runeTs + _runeTs / 2);
                rmesh._ew_deployable = true;
                rmesh._ew_groundDecal = true;
                rmesh._ew_depX = rr.x; rmesh._ew_depY = rr.y;
                var rkey = 'dep_' + (idx++);
                objectGroup.add(rmesh);
                deployableMeshes.set(rkey, rmesh);
            }
        }

        _lastDeployableSerial = _computeDeployableSerial();

        /* ── Render state._deployedObjects (traps, decoys, walls, totems) ── */
        if (state._deployedObjects) {
            var ts = CONFIG.tileSize || 128;
            for (var i = 0; i < state._deployedObjects.length; i++) {
                var dObj = state._deployedObjects[i];
                if (dObj.hp <= 0) continue;
                var dKey = 'dobj_' + i;
                var dx = dObj.x, dy = dObj.y;
                var topY = tileTopY(dx, dy);

                /* Decoys/clones wear the caster's sprite. Render them to look EXACTLY
                   like a live unit — full opacity, native sprite dimensions, matching
                   facing, plus a fake nameplate — so the opponent can't pick the real
                   unit out from its decoy. */
                if (dObj.isDecoy && dObj.spriteUnit) {
                    var sprUrl = (typeof getBattleMapSpriteUrl === 'function') ? getBattleMapSpriteUrl(dObj.spriteUnit) : null;
                    if (sprUrl) {
                        var tex = getTexture(sprUrl);
                        var mat = new THREE.MeshBasicMaterial({
                            map: tex, transparent: true, alphaTest: 0.1,
                            side: THREE.DoubleSide, depthWrite: true
                        });

                        /* Mirror the real-unit sizing logic in _buildUnitEntry. */
                        var _dns = ts / 128;
                        var dnw = 128, dnh = 128;
                        var dScan = window._spriteGroundOffsets ? window._spriteGroundOffsets.get(sprUrl) : null;
                        if (dScan && !dScan.scanning && dScan.nativeW > 0 && dScan.nativeH > 0) {
                            dnw = dScan.nativeW; dnh = dScan.nativeH;
                        } else if (tex && tex.image) {
                            var _dimg = tex.image;
                            var _diw = _dimg.naturalWidth || _dimg.width || 0;
                            var _dih = _dimg.naturalHeight || _dimg.height || 0;
                            if (_diw > 0 && _dih > 0) { dnw = _diw; dnh = _dih; }
                        }
                        var dSprW = dnw * _dns, dSprH = dnh * _dns;
                        var dBottom = (dScan && !dScan.scanning && dScan.bottomGapPct > 0) ? dSprH * (dScan.bottomGapPct / 100) : 0;
                        var dTop = (dScan && !dScan.scanning && dScan.topGapPct > 0) ? dSprH * (dScan.topGapPct / 100) : 0;

                        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(dSprW, dSprH), mat);
                        mesh.position.set(dx * ts + ts / 2, topY + dSprH / 2 - dBottom, dy * ts + ts / 2);
                        if (dObj.spriteUnit._spriteFlipX) mesh.scale.x = -1;
                        mesh._ew_billboard = true;
                        mesh._ew_deployable = true;
                        mesh._ew_depX = dx; mesh._ew_depY = dy;
                        objectGroup.add(mesh);
                        deployableMeshes.set(dKey, mesh);

                        /* Fake nameplate (full HP/MP) — a decoy with no plate while every
                           real unit has one would itself give the decoy away. */
                        var _clonePlate = _buildClonePlate(dObj.spriteUnit, dObj.ownerPlayer);
                        if (_clonePlate) {
                            _clonePlate.css2d.position.set(0, dSprH / 2 - dTop + 14, 0);
                            mesh.add(_clonePlate.css2d);
                            _decoyPlates.push({ css2d: _clonePlate.css2d, el: _clonePlate.el, mesh: mesh });
                        }
                        continue;
                    }
                }

                /* Non-decoy objects: colored marker */
                var pColor = (dObj.ownerPlayer === 1) ? 0x4488ff : 0xff4444;
                var isWall = dObj.blocksMovement;
                var isTrap = dObj.detonateOnStep;
                var isTotem = dObj.auraHeal > 0;
                var mW = ts * (isWall ? 0.7 : 0.4);
                var mH = ts * (isWall ? 0.5 : isTrap ? 0.2 : isTotem ? 0.6 : 0.35);
                var markerGeo = new THREE.PlaneGeometry(mW, mH);
                var markerMat = new THREE.MeshBasicMaterial({
                    color: isTotem ? 0x44cc66 : isWall ? 0xbbaa77 : isTrap ? 0xcc4444 : pColor,
                    transparent: true, opacity: isTrap ? 0.45 : 0.7,
                    side: THREE.DoubleSide, depthWrite: false
                });
                var markerMesh = new THREE.Mesh(markerGeo, markerMat);
                markerMesh.position.set(dx * ts + ts / 2, topY + mH / 2, dy * ts + ts / 2);
                markerMesh._ew_billboard = true;
                markerMesh._ew_deployable = true;
                markerMesh._ew_depX = dx; markerMesh._ew_depY = dy;
                objectGroup.add(markerMesh);
                deployableMeshes.set(dKey, markerMesh);
            }
        }

        if (ThreePost && ThreePost.rebuildWardLights) {
            ThreePost.rebuildWardLights(state.wards || [], tileTopY, CONFIG.tileSize || 128);
        }
    }

    function _computeNexusSerial() {
        var s = '';
        if (state.nexusPoints) {
            for (var key in state.nexusPoints) {
                var n = state.nexusPoints[key];
                if (n) s += key + ':' + n.zoneX + ',' + n.zoneY + ',' + (n.zoneSize||2) + ',' + (n.owner||0) + ',' + (n.progress||0) + '|';
            }
        }
        if (state.roamingNexus) {
            var rn = state.roamingNexus;
            s += 'roam:' + rn.zoneX + ',' + rn.zoneY + ',' + (rn.zoneSize||2) + ',' + (rn.owner||0) + ',' + (rn.progress||0);
        }
        return s;
    }

    var _nexusWallMats = [];

    function _nexusOwnerColor(owner) {
        if (owner === 0 || !owner) return 0xddaa33;
        return _viewerPlayerColor(owner);
    }

    function rebuildNexusWalls() {
        if (!_nexusWallGroup) return;

        for (var ci = 0; ci < _nexusWallMats.length; ci++) {
            if (_nexusWallMats[ci].map) _nexusWallMats[ci].map.dispose();
        }
        _clearGroup(_nexusWallGroup);
        _nexusWallMats.length = 0;

        var zones = [];
        if (state.nexusPoints) {
            for (var key in state.nexusPoints) {
                var n = state.nexusPoints[key];
                if (n) zones.push(n);
            }
        }
        if (state.roamingNexus) zones.push(state.roamingNexus);
        if (zones.length === 0) { _lastNexusSerial = _computeNexusSerial(); return; }

        var ts = CONFIG.tileSize || 128;
        var elevStep = ts * ELEV_STEP_RATIO;
        var wallHeight = 2 * elevStep;

        for (var zi = 0; zi < zones.length; zi++) {
            var nex = zones[zi];
            var zs = nex.zoneSize || 2;
            var zx = nex.zoneX;
            var zy = nex.zoneY;
            var color = _nexusOwnerColor(nex.owner || 0);

            var edges = [];
            for (var dy = 0; dy < zs; dy++) {
                for (var dx = 0; dx < zs; dx++) {
                    var tx = zx + dx;
                    var ty = zy + dy;

                    if (dy === 0) edges.push({ x: tx, y: ty, dir: 'n' });

                    if (dy === zs - 1) edges.push({ x: tx, y: ty, dir: 's' });

                    if (dx === 0) edges.push({ x: tx, y: ty, dir: 'w' });

                    if (dx === zs - 1) edges.push({ x: tx, y: ty, dir: 'e' });
                }
            }

            for (var ei = 0; ei < edges.length; ei++) {
                var e = edges[ei];
                var tileY = tileTopY(e.x, e.y);

                var geo = new THREE.PlaneGeometry(ts, wallHeight);

                var canvas = document.createElement('canvas');
                canvas.width = 4; canvas.height = 64;
                var ctx = canvas.getContext('2d');
                var r = (color >> 16) & 0xff;
                var g_c = (color >> 8) & 0xff;
                var b = color & 0xff;
                var grad = ctx.createLinearGradient(0, 0, 0, 64);
                grad.addColorStop(0, 'rgba(' + r + ',' + g_c + ',' + b + ',0)');
                grad.addColorStop(0.3, 'rgba(' + r + ',' + g_c + ',' + b + ',0.35)');
                grad.addColorStop(0.7, 'rgba(' + r + ',' + g_c + ',' + b + ',0.7)');
                grad.addColorStop(1, 'rgba(' + r + ',' + g_c + ',' + b + ',0.9)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 4, 64);

                var tex = new THREE.CanvasTexture(canvas);
                tex.magFilter = THREE.LinearFilter;
                tex.minFilter = THREE.LinearFilter;

                var mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                mat._ew_nexusBaseColor = color;
                _nexusWallMats.push(mat);

                var mesh = new THREE.Mesh(geo, mat);

                var cx = e.x * ts + ts / 2;
                var cz = e.y * ts + ts / 2;
                var halfTs = ts / 2;

                if (e.dir === 'n') {

                    mesh.position.set(cx, tileY + wallHeight / 2, cz - halfTs);
                    mesh.rotation.y = 0;
                } else if (e.dir === 's') {

                    mesh.position.set(cx, tileY + wallHeight / 2, cz + halfTs);
                    mesh.rotation.y = Math.PI;
                } else if (e.dir === 'w') {

                    mesh.position.set(cx - halfTs, tileY + wallHeight / 2, cz);
                    mesh.rotation.y = Math.PI / 2;
                } else if (e.dir === 'e') {

                    mesh.position.set(cx + halfTs, tileY + wallHeight / 2, cz);
                    mesh.rotation.y = -Math.PI / 2;
                }

                _nexusWallGroup.add(mesh);
            }
        }

        _lastNexusSerial = _computeNexusSerial();
    }

    /* ── Spawn Zone floor overlays ── */
    var _spawnZoneGroup = null;
    var _spawnZoneMats = [];
    var _lastSpawnZoneSerial = '';

    function _computeSpawnZoneSerial() {
        if (!state.spawnZones) return '';
        var s = '';
        for (var p = 1; p <= 2; p++) {
            var z = state.spawnZones[p];
            if (z) for (var i = 0; i < z.length; i++) s += p + ':' + z[i].x + ',' + z[i].y + ';';
        }
        return s;
    }

    function rebuildSpawnZoneOverlays() {
        if (!_spawnZoneGroup) {
            _spawnZoneGroup = new THREE.Group();
            _spawnZoneGroup.name = 'spawnZoneOverlays';
            if (scene) scene.add(_spawnZoneGroup);
        }
        var ser = _computeSpawnZoneSerial();
        if (ser === _lastSpawnZoneSerial) return;
        _clearGroup(_spawnZoneGroup);
        _spawnZoneMats.length = 0;
        if (!state.spawnZones) { _lastSpawnZoneSerial = ser; return; }

        var ts = CONFIG.tileSize || 128;
        var elevStep = ts * ELEV_STEP_RATIO;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;

        var P1_COLOR = 0x3388ff;
        var P2_COLOR = 0xff3333;

        for (var p = 1; p <= 2; p++) {
            var zone = state.spawnZones[p];
            if (!zone) continue;
            var color = p === 1 ? P1_COLOR : P2_COLOR;

            for (var i = 0; i < zone.length; i++) {
                var tile = zone[i];
                if (tile.x < 0 || tile.y < 0 || tile.x >= _bw || tile.y >= _bh) continue;

                var geo = new THREE.PlaneGeometry(ts * 0.95, ts * 0.95);
                var mat = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.18,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                _spawnZoneMats.push(mat);
                var mesh = new THREE.Mesh(geo, mat);

                var ht = (state.boardHeights && state.boardHeights[tile.y])
                    ? (state.boardHeights[tile.y][tile.x] || 0) : 0;

                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(
                    tile.x * ts + ts / 2,
                    ht * elevStep + 0.5,
                    tile.y * ts + ts / 2
                );
                _spawnZoneGroup.add(mesh);
            }
        }
        _lastSpawnZoneSerial = ser;
    }

    function _updateSpawnZonePulse() {
        if (_spawnZoneMats.length === 0) return;
        var t = performance.now() / 1000;
        var pulse = 0.12 + 0.08 * Math.sin(t * 1.5);
        for (var i = 0; i < _spawnZoneMats.length; i++) {
            _spawnZoneMats[i].opacity = pulse;
        }
    }

    /* ── Sanctuary / Spawn-Zone Walls of Light ── */
    var _sanctuaryWallGroup = null;
    var _sanctuaryWallMats = [];
    var _lastSanctuaryWallSerial = '';

    function _computeSanctuaryWallSerial() {
        return _computeSpawnZoneSerial();
    }

    function rebuildSanctuaryWalls() {
        if (!_sanctuaryWallGroup) {
            _sanctuaryWallGroup = new THREE.Group();
            _sanctuaryWallGroup.name = 'sanctuaryWalls';
            _sanctuaryWallGroup.renderOrder = 3;
            if (scene) scene.add(_sanctuaryWallGroup);
        }
        var ser = _computeSanctuaryWallSerial();
        if (ser === _lastSanctuaryWallSerial) return;

        for (var ci = 0; ci < _sanctuaryWallMats.length; ci++) {
            if (_sanctuaryWallMats[ci].map) _sanctuaryWallMats[ci].map.dispose();
        }
        _clearGroup(_sanctuaryWallGroup);
        _sanctuaryWallMats.length = 0;

        if (!state.spawnZones) { _lastSanctuaryWallSerial = ser; return; }

        var ts = CONFIG.tileSize || 128;
        var elevStep = ts * ELEV_STEP_RATIO;
        var wallHeight = 1.3 * elevStep; /* shorter than nexus (2×elevStep) */

        for (var p = 1; p <= 2; p++) {
            var zone = state.spawnZones[p];
            if (!zone || zone.length === 0) continue;

            var color = (p === 1) ? _viewerPlayerColor(1) : _viewerPlayerColor(2);

            /* Build a Set of zone tile keys for fast neighbor lookup */
            var zoneSet = {};
            for (var i = 0; i < zone.length; i++) {
                zoneSet[zone[i].x + ',' + zone[i].y] = true;
            }

            /* Find perimeter edges: tile edge exposed to non-zone neighbor */
            var edges = [];
            for (var i = 0; i < zone.length; i++) {
                var tx = zone[i].x;
                var ty = zone[i].y;
                if (!zoneSet[tx + ',' + (ty - 1)]) edges.push({ x: tx, y: ty, dir: 'n' });
                if (!zoneSet[tx + ',' + (ty + 1)]) edges.push({ x: tx, y: ty, dir: 's' });
                if (!zoneSet[(tx - 1) + ',' + ty]) edges.push({ x: tx, y: ty, dir: 'w' });
                if (!zoneSet[(tx + 1) + ',' + ty]) edges.push({ x: tx, y: ty, dir: 'e' });
            }

            for (var ei = 0; ei < edges.length; ei++) {
                var e = edges[ei];
                var tileY = tileTopY(e.x, e.y);

                var geo = new THREE.PlaneGeometry(ts, wallHeight);

                /* Gradient canvas — transparent at top, color at bottom (same as nexus) */
                var canvas = document.createElement('canvas');
                canvas.width = 4; canvas.height = 64;
                var ctx = canvas.getContext('2d');
                var r = (color >> 16) & 0xff;
                var g_c = (color >> 8) & 0xff;
                var b = color & 0xff;
                var grad = ctx.createLinearGradient(0, 0, 0, 64);
                grad.addColorStop(0, 'rgba(' + r + ',' + g_c + ',' + b + ',0)');
                grad.addColorStop(0.3, 'rgba(' + r + ',' + g_c + ',' + b + ',0.3)');
                grad.addColorStop(0.7, 'rgba(' + r + ',' + g_c + ',' + b + ',0.6)');
                grad.addColorStop(1, 'rgba(' + r + ',' + g_c + ',' + b + ',0.8)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 4, 64);

                var tex = new THREE.CanvasTexture(canvas);
                tex.magFilter = THREE.LinearFilter;
                tex.minFilter = THREE.LinearFilter;

                var mat = new THREE.MeshBasicMaterial({
                    map: tex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                _sanctuaryWallMats.push(mat);

                var mesh = new THREE.Mesh(geo, mat);

                var cx = e.x * ts + ts / 2;
                var cz = e.y * ts + ts / 2;
                var halfTs = ts / 2;

                if (e.dir === 'n') {
                    mesh.position.set(cx, tileY + wallHeight / 2, cz - halfTs);
                    mesh.rotation.y = 0;
                } else if (e.dir === 's') {
                    mesh.position.set(cx, tileY + wallHeight / 2, cz + halfTs);
                    mesh.rotation.y = Math.PI;
                } else if (e.dir === 'w') {
                    mesh.position.set(cx - halfTs, tileY + wallHeight / 2, cz);
                    mesh.rotation.y = Math.PI / 2;
                } else if (e.dir === 'e') {
                    mesh.position.set(cx + halfTs, tileY + wallHeight / 2, cz);
                    mesh.rotation.y = -Math.PI / 2;
                }

                _sanctuaryWallGroup.add(mesh);
            }
        }

        _lastSanctuaryWallSerial = ser;
    }

    function _updateSanctuaryWallPulse() {
        if (_sanctuaryWallMats.length === 0) return;
        var t = performance.now() / 1000;
        var pulse = 0.7 + 0.2 * Math.sin(t * 1.8);
        for (var i = 0; i < _sanctuaryWallMats.length; i++) {
            _sanctuaryWallMats[i].opacity = pulse;
        }
    }

    function _updateNexusWallPulse() {
        if (_nexusWallMats.length === 0) return;
        var t = performance.now() / 1000;

        var pulse = 0.8 + 0.2 * Math.sin(t * 2.0);
        for (var i = 0; i < _nexusWallMats.length; i++) {
            _nexusWallMats[i].opacity = pulse;
        }
    }

    function _updateZoneBorderPulse() {
        if (_zoneBorderMats.length === 0) return;
        var t = performance.now() / 1000;

        var pulse = 0.75 + 0.25 * Math.sin(t * 1.8);
        for (var i = 0; i < _zoneBorderMats.length; i++) {
            var m = _zoneBorderMats[i];

            if (m._baseOp === undefined) m._baseOp = m.opacity;
            m.opacity = m._baseOp * pulse;
        }
    }

    function _ensureNexusBarStyles() {
        if (!document.getElementById('threeNexusBarStyles')) {
            var s = document.createElement('style');
            s.id = 'threeNexusBarStyles';
            s.textContent = [

                '.nb-wrap {',
                '  pointer-events: none;',
                '  width: 160px;',
                '  font-family: "DotGothic16", monospace;',
                '  display: flex; flex-direction: column; align-items: center;',
                '  transform: translate(-50%, -100%);',
                '}',

                '.nb-wrap .nb-owner {',
                '  font-size: 10px; font-weight: 800;',
                '  letter-spacing: 0.1em; text-transform: uppercase;',
                '  color: #e8e8f0; text-shadow: 0 1px 3px #000, 0 0 6px rgba(0,0,0,0.8);',
                '  margin-bottom: 3px; line-height: 1;',
                '}',
                '.nb-wrap .nb-owner-p1 { color: #6ab4ff; }',
                '.nb-wrap .nb-owner-p2 { color: #ff6a6a; }',
                '.nb-wrap .nb-owner-neutral { color: #ddaa33; }',

                '.nb-wrap .nb-track {',
                '  position: relative; width: 100%; height: 14px;',
                '  background: rgba(0,0,0,0.75); border-radius: 3px;',
                '  overflow: hidden;',
                '  border: 1px solid rgba(255,255,255,0.15);',
                '  box-shadow: 0 2px 10px rgba(0,0,0,0.9), inset 0 1px 3px rgba(0,0,0,0.5);',
                '}',

                '.nb-wrap .nb-center {',
                '  position: absolute; left: 50%; top: 0; width: 2px; height: 100%;',
                '  background: rgba(255,255,255,0.35);',
                '  transform: translateX(-50%);',
                '  z-index: 2;',
                '}',

                '.nb-wrap .nb-fill-p1 {',
                '  position: absolute; top: 0; left: 50%; height: 100%;',
                '  background: linear-gradient(180deg, #5599ff 0%, #2266cc 50%, #1a4488 100%);',
                '  box-shadow: 0 0 6px rgba(80,150,255,0.5);',
                '  border-radius: 0 2px 2px 0;',
                '  transition: width 0.3s ease-out;',
                '}',

                '.nb-wrap .nb-fill-p2 {',
                '  position: absolute; top: 0; right: 50%; height: 100%;',
                '  background: linear-gradient(180deg, #ff5555 0%, #cc2222 50%, #881a1a 100%);',
                '  box-shadow: 0 0 6px rgba(255,80,80,0.5);',
                '  border-radius: 2px 0 0 2px;',
                '  transition: width 0.3s ease-out;',
                '}',

                '.nb-wrap.nb-captured-p1 .nb-track {',
                '  border-color: rgba(90,170,255,0.6);',
                '  box-shadow: 0 0 12px rgba(80,150,255,0.4), 0 2px 10px rgba(0,0,0,0.9);',
                '}',
                '.nb-wrap.nb-captured-p2 .nb-track {',
                '  border-color: rgba(255,90,90,0.6);',
                '  box-shadow: 0 0 12px rgba(255,80,80,0.4), 0 2px 10px rgba(0,0,0,0.9);',
                '}',

                '.nb-wrap .nb-prog {',
                '  position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
                '  display: flex; align-items: center; justify-content: center;',
                '  font-size: 9px; font-weight: 700; color: #fff;',
                '  text-shadow: 0 0 4px #000, 0 1px 2px #000;',
                '  letter-spacing: 0.06em; line-height: 1;',
                '  z-index: 3;',
                '}',

                '.nb-wrap.nb-contested .nb-track {',
                '  animation: nb-contest-pulse 1.2s ease-in-out infinite;',
                '}',
                '@keyframes nb-contest-pulse {',
                '  0%, 100% { border-color: rgba(255,255,255,0.15); }',
                '  50% { border-color: rgba(255,200,60,0.6); }',
                '}',

                '.nb-wrap .nb-label {',
                '  font-size: 7px; font-weight: 800; letter-spacing: 0.12em;',
                '  color: rgba(255,255,255,0.5); margin-top: 2px; line-height: 1;',
                '  text-transform: uppercase;',
                '}',

                'body.is-p2-viewer .nb-wrap .nb-fill-p1 {',
                '  background: linear-gradient(180deg, #ff5555 0%, #cc2222 50%, #881a1a 100%);',
                '  box-shadow: 0 0 6px rgba(255,80,80,0.5);',
                '}',
                'body.is-p2-viewer .nb-wrap .nb-fill-p2 {',
                '  background: linear-gradient(180deg, #5599ff 0%, #2266cc 50%, #1a4488 100%);',
                '  box-shadow: 0 0 6px rgba(80,150,255,0.5);',
                '}',
                'body.is-p2-viewer .nb-wrap .nb-owner-p1 { color: #ff6a6a; }',
                'body.is-p2-viewer .nb-wrap .nb-owner-p2 { color: #6ab4ff; }',
                'body.is-p2-viewer .nb-wrap.nb-captured-p1 .nb-track {',
                '  border-color: rgba(255,90,90,0.6);',
                '  box-shadow: 0 0 12px rgba(255,80,80,0.4), 0 2px 10px rgba(0,0,0,0.9);',
                '}',
                'body.is-p2-viewer .nb-wrap.nb-captured-p2 .nb-track {',
                '  border-color: rgba(90,170,255,0.6);',
                '  box-shadow: 0 0 12px rgba(80,150,255,0.4), 0 2px 10px rgba(0,0,0,0.9);',
                '}'
            ].join('\n');
            document.head.appendChild(s);
        }
    }

    function _clearNexusBars() {
        for (var entry of _nexusBarObjs) {
            var no = entry[1];
            if (no.css2d && no.css2d.parent) no.css2d.parent.remove(no.css2d);
        }
        _nexusBarObjs.clear();
        if (_nexusBarGroup) { while (_nexusBarGroup.children.length > 0) _nexusBarGroup.remove(_nexusBarGroup.children[0]); }
    }

    function _computeNexusBarSerial() {
        var s = '';
        if (state.nexusPoints) {
            for (var key in state.nexusPoints) {
                var n = state.nexusPoints[key];
                if (n) s += key + ':' + (n.owner||0) + ',' + (n.progress||0) + '|';
            }
        }
        if (state.roamingNexus) {
            var rn = state.roamingNexus;
            s += 'roam:' + (rn.owner||0) + ',' + (rn.progress||0);
        }
        return s;
    }

    function _buildNexusBar(key, nex) {
        _ensureNexusBarStyles();
        var ts = CONFIG.tileSize || 128;
        var elevStep = ts * ELEV_STEP_RATIO;

        var wrap = document.createElement('div');
        var capThreshold = (typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined') ? NEXUS_CAPTURE_THRESHOLD : 6;
        var prog = Number(nex.progress || 0);
        var absProgress = Math.abs(prog);
        var isCapturedP1 = nex.owner === 1 && absProgress >= capThreshold;
        var isCapturedP2 = nex.owner === 2 && absProgress >= capThreshold;

        var isContested = false;
        if (state.units && typeof isInNexusZone === 'function') {
            var hasP1 = false, hasP2 = false;
            for (var i = 0; i < state.units.length; i++) {
                var u = state.units[i];
                if (u.dead) continue;
                if (isInNexusZone(u.x, u.y, key)) {
                    if (u.player === 1) hasP1 = true;
                    if (u.player === 2) hasP2 = true;
                }
            }
            isContested = hasP1 && hasP2;
        }

        var cls = 'nb-wrap';
        if (isCapturedP1) cls += ' nb-captured-p1';
        else if (isCapturedP2) cls += ' nb-captured-p2';
        if (isContested) cls += ' nb-contested';
        wrap.className = cls;

        var ownerText = 'NEUTRAL';
        var ownerCls = 'nb-owner nb-owner-neutral';
        if (nex.owner === 1) { ownerText = 'P1 CONTROLLED'; ownerCls = 'nb-owner nb-owner-p1'; }
        else if (nex.owner === 2) { ownerText = 'P2 CONTROLLED'; ownerCls = 'nb-owner nb-owner-p2'; }
        if (isContested) ownerText = 'CONTESTED';

        var fillHtml = '';
        if (prog > 0) {
            var pct1 = Math.min(1, absProgress / capThreshold) * 50;
            fillHtml = '<div class="nb-fill-p1" style="width:' + pct1.toFixed(1) + '%"></div>';
        } else if (prog < 0) {
            var pct2 = Math.min(1, absProgress / capThreshold) * 50;
            fillHtml = '<div class="nb-fill-p2" style="width:' + pct2.toFixed(1) + '%"></div>';
        }

        var progText = absProgress + '/' + capThreshold;
        if (prog === 0 && nex.owner === 0) progText = 'UNCLAIMED';

        var modeLabel = 'NEXUS';
        if (key === 'roaming' || (state.roamingNexus && nex === state.roamingNexus)) modeLabel = 'HOTSPOT';

        wrap.innerHTML =
            '<div class="' + ownerCls + '">' + ownerText + '</div>' +
            '<div class="nb-track">' +
                fillHtml +
                '<div class="nb-center"></div>' +
                '<div class="nb-prog">' + progText + '</div>' +
            '</div>' +
            '<div class="nb-label">' + modeLabel + '</div>';

        var css2d = new THREE.CSS2DObject(wrap);
        var zs = nex.zoneSize || 2;

        var maxH = 0;
        for (var dy = 0; dy < zs; dy++) {
            for (var dx = 0; dx < zs; dx++) {
                var h = (typeof getHeightAt === 'function') ? getHeightAt(nex.zoneX + dx, nex.zoneY + dy) : 0;
                if (h > maxH) maxH = h;
            }
        }

        var cx = nex.zoneX * ts + (zs * ts) / 2;
        var cz = nex.zoneY * ts + (zs * ts) / 2;
        var cy = maxH * elevStep + 2.5 * elevStep;

        css2d.position.set(cx, cy, cz);
        if (_nexusBarGroup) _nexusBarGroup.add(css2d);

        _nexusBarObjs.set(key, { css2d: css2d, el: wrap });
    }

    function _rebuildNexusBars() {
        _clearNexusBars();

        if (state.nexusPoints) {
            for (var key in state.nexusPoints) {
                var n = state.nexusPoints[key];
                if (n) _buildNexusBar(key, n);
            }
        }
        if (state.roamingNexus) {
            _buildNexusBar('roaming', state.roamingNexus);
        }
        _lastNexusBarSerial = _computeNexusBarSerial();
    }

    function _syncNexusBars() {

        var barSer = _computeNexusBarSerial();
        if (barSer !== _lastNexusBarSerial) _rebuildNexusBars();

        if (state.fogOfWar && _fogVisibleSet) {
            for (var entry of _nexusBarObjs) {
                var key = entry[0], no = entry[1];
                var nex = null;
                if (key === 'roaming') nex = state.roamingNexus;
                else if (state.nexusPoints) nex = state.nexusPoints[key];
                if (!nex) { no.css2d.visible = false; continue; }
                var zs = nex.zoneSize || 2;
                var anyVisible = false;
                for (var fdy = 0; fdy < zs && !anyVisible; fdy++) {
                    for (var fdx = 0; fdx < zs && !anyVisible; fdx++) {
                        if (_fogVisibleSet.has((nex.zoneX + fdx) + ',' + (nex.zoneY + fdy))) anyVisible = true;
                    }
                }
                no.css2d.visible = anyVisible;
            }
        } else {

            for (var entry2 of _nexusBarObjs) {
                entry2[1].css2d.visible = true;
            }
        }
    }

    function _computeUnitSerial() {
        if (!state.units) return '';
        var p = [];
        for (var i = 0; i < state.units.length; i++) {
            var u = state.units[i]; if (u.dead) continue;
            var sKeys = (typeof getActiveStatusKeys === 'function' && u.status) ? getActiveStatusKeys(u).join(',') : '';
            p.push(u.id+':'+u.x+','+u.y+','+(u.z||0)+','+u.hp+','+u.mp+','+u.ap+','+u.player+','+(u.shield||0)+','+sKeys
                +(u.race==='vampire'?',bat:'+(_isVampireBatForm(u)?1:0):'')
                +(u._spriteOverride?',so:'+u._spriteOverride:'')
                +(u._spriteFlipX?',fx:1':'')
                +(u.race==='werewolf'?',tod:'+(typeof getCurrentCyclePhase==='function'?getCurrentCyclePhase():'night'):''));
        }
        p.push('sel:'+(state.selectedUnitId||''));
        p.push('nm:'+(state.nametagMode||'name'));
        return p.join('|');
    }

    /* Structural serial — only changes that require a full 3D rebuild (position, sprite, player, selection).
       Stats-only changes (hp/mp/ap/shield/status) are patched in-place via _patchPlateStats(). */
    function _computeUnitStructuralSerial() {
        if (!state.units) return '';
        var p = [];
        for (var i = 0; i < state.units.length; i++) {
            var u = state.units[i]; if (u.dead) continue;
            p.push(u.id+':'+u.x+','+u.y+','+(u.z||0)+','+u.player
                +(u.race==='vampire'?',bat:'+(_isVampireBatForm(u)?1:0):'')
                +(u._spriteOverride?',so:'+u._spriteOverride:'')
                +(u._spriteFlipX?',fx:1':'')
                +(u.race==='werewolf'?',tod:'+(typeof getCurrentCyclePhase==='function'?getCurrentCyclePhase():'night'):''));
        }
        p.push('sel:'+(state.selectedUnitId||''));
        p.push('nm:'+(state.nametagMode||'name'));
        return p.join('|');
    }
    var _lastStructuralSerial = '';

    /* Patch plate HP/MP/shield bars + status badges in-place so CSS transitions animate smoothly. */
    function _patchPlateStats() {
        if (!state.units) return;
        for (var i = 0; i < state.units.length; i++) {
            var u = state.units[i];
            if (u.dead) continue;
            var po = _plateObjs.get(u.id);
            if (!po || !po.el) continue;

            var hpPct = Math.max(0, Math.round(100 * u.hp / (u.maxHp || 1)));
            var mpPct = Math.max(0, Math.round(100 * u.mp / (u.maxMp || 1)));

            // Update HP bar fill width (transition animates it)
            var hpFill = po.el.querySelector('.tp-hp-fill');
            if (hpFill) hpFill.style.width = hpPct + '%';
            _lastHpPctById.set(u.id, hpPct);
            _lastMpPctById.set(u.id, mpPct);

            // HP bar color is ally/enemy based — no tier swap needed
            var hpBar = po.el.querySelector('.tp-bar:not(.tp-bar-mp)');

            // Update MP bar fill width
            var mpFill = po.el.querySelector('.tp-mp-fill');
            if (mpFill) mpFill.style.width = mpPct + '%';

            // Update shield overlay
            var shieldEl = po.el.querySelector('.tp-shield');
            var shieldAmt = u.shield || 0;
            var shieldPct = shieldAmt > 0 ? Math.round((shieldAmt / (u.maxHp || 1)) * 100) : 0;
            if (shieldPct > 0) {
                if (!shieldEl) {
                    shieldEl = document.createElement('div');
                    shieldEl.className = 'tp-shield';
                    if (hpBar) hpBar.appendChild(shieldEl);
                }
                shieldEl.style.width = shieldPct + '%';
            } else if (shieldEl) {
                shieldEl.remove();
            }

            // Update numeric text
            var hpNum = hpBar ? hpBar.querySelector('.tp-bar-num') : null;
            if (hpNum) hpNum.textContent = u.hp + '/' + u.maxHp;
            var mpBar = po.el.querySelector('.tp-bar-mp');
            var mpNum = mpBar ? mpBar.querySelector('.tp-bar-num') : null;
            if (mpNum) mpNum.textContent = u.mp + '/' + u.maxMp;
        }
        _lastUnitSerial = _computeUnitSerial();
    }

    function _isVampireBatForm(unit) {
        return unit.race === 'vampire'
            && typeof canFly === 'function' && typeof isUnitAirborne === 'function'
            && canFly(unit) && isUnitAirborne(unit)
            && typeof BAT_SPRITES !== 'undefined' && BAT_SPRITES.length > 0;
    }

    function _batRand(seed, i, salt) {
        var v = ((seed + i * 2654435761 + salt * 2246822519) >>> 0) % 10000;
        return v / 10000;
    }

    function _buildBatSwarmGroup(unit, ts) {
        var swarm = new THREE.Group();
        swarm.name = 'bat_swarm_' + unit.id;
        swarm._ew_batSwarm = true;

        var seed = 13;
        var idStr = String(unit.id || '0');
        for (var c = 0; c < idStr.length; c++) seed = (seed * 31 + idStr.charCodeAt(c)) | 0;
        seed = Math.abs(seed);

        var batSize = ts * BAT_SPRITE_SIZE;
        var spread = ts * BAT_SPREAD;
        var batGeo = new THREE.PlaneGeometry(batSize, batSize);

        var batTextures = [];
        for (var t = 0; t < BAT_SPRITES.length; t++) {
            batTextures.push(getTexture(BAT_SPRITES[t]));
        }

        for (var i = 0; i < BAT_COUNT; i++) {
            var s1 = _batRand(seed, i, 0);
            var s2 = _batRand(seed, i, 1);
            var s3 = _batRand(seed, i, 2);

            var tex = batTextures[i % batTextures.length];
            var mat = new THREE.MeshBasicMaterial({
                map: tex, transparent: true, alphaTest: 0.1,
                side: THREE.DoubleSide, depthWrite: false
            });
            if (unit.ap <= 0) mat.color = new THREE.Color(0.5, 0.5, 0.5);

            var bat = new THREE.Mesh(batGeo, mat);
            bat._ew_billboard = true;

            bat._ew_batSeed = {
                orbitAngle: s1 * Math.PI * 2,
                orbitRadius: spread * (0.5 + s2 * 0.5),
                bobPhase: s3 * Math.PI * 2,
                bobAmp: batSize * (0.3 + s1 * 0.4),
                orbitSpeed: BAT_ORBIT_SPEED * (0.7 + s2 * 0.6),
                bobSpeed: BAT_BOB_SPEED * (0.8 + s3 * 0.4),
                heightOffset: spread * 0.3 + s1 * spread * 0.7
            };

            var bSeed = bat._ew_batSeed;
            bat.position.set(
                Math.cos(bSeed.orbitAngle) * bSeed.orbitRadius,
                bSeed.heightOffset,
                Math.sin(bSeed.orbitAngle) * bSeed.orbitRadius
            );

            swarm.add(bat);
        }

        return swarm;
    }

    function _getSubmersionDepth(unit) {
        if (!unit) return 0;

        if (typeof canFly === 'function' && typeof isUnitAirborne === 'function'
            && canFly(unit) && isUnitAirborne(unit)) return 0;
        var terrain = (state.boardTerrain && state.boardTerrain[unit.y])
                    ? state.boardTerrain[unit.y][unit.x] : '';

        var tKey = terrain.replace(/_\d+$/, '');
        return SUBMERSION_DEPTH[tKey] || 0;
    }

    function _getSubmersionForTile(tx, ty) {
        var terrain = (state.boardTerrain && state.boardTerrain[ty])
                    ? state.boardTerrain[ty][tx] : '';
        var tKey = terrain.replace(/_\d+$/, '');
        return SUBMERSION_DEPTH[tKey] || 0;
    }

    function _updateSubmersionClip(ue, tx, ty, surfY, ts) {
        if (!ue || !ue.group) return;
        var depth = _getSubmersionForTile(tx, ty);
        var sink = depth * ts * UNIT_SPRITE_SIZE_RATIO;
        ue.group._ew_subSink = sink;
    }

    function _buildUnitEntry(unit) {
        var ts = CONFIG.tileSize || 128;
        var surfY = unitSurfaceY(unit);

        var _nativeScale = ts / 128;

        var _effectiveSprH = ts;

        var group = new THREE.Group();
        group.name = 'unit_' + unit.id;

        var spriteMesh = null;

        if (_isVampireBatForm(unit)) {
            var swarm = _buildBatSwarmGroup(unit, ts);
            group.add(swarm);
            group._ew_isBatSwarm = true;
            group._ew_spriteW = ts;

            spriteMesh = swarm.children.length > 0 ? swarm.children[0] : null;
        } else {

            var spriteUrl = (typeof getBattleMapSpriteUrl === 'function')
                          ? getBattleMapSpriteUrl(unit)
                          : ((typeof getR2RaceSpriteUrl === 'function')
                             ? getR2RaceSpriteUrl(unit.race, unit.gender, unit.cls) : null);
            var spriteTex = spriteUrl ? getTexture(spriteUrl) : null;
            var spriteMat = new THREE.MeshBasicMaterial({
                map: spriteTex, transparent: true, alphaTest: 0.1,
                side: THREE.DoubleSide, depthWrite: true
            });
            if (unit.ap <= 0) spriteMat.color = new THREE.Color(0.5, 0.5, 0.5);

            var nw = 128, nh = 128;
            var scanData = (spriteUrl && window._spriteGroundOffsets)
                ? window._spriteGroundOffsets.get(spriteUrl) : null;

            if (scanData && !scanData.scanning && scanData.nativeW > 0 && scanData.nativeH > 0) {
                nw = scanData.nativeW;
                nh = scanData.nativeH;
            } else if (spriteTex && spriteTex.image) {
                var img = spriteTex.image;
                var iw = img.naturalWidth || img.width || 0;
                var ih = img.naturalHeight || img.height || 0;
                if (iw > 0 && ih > 0) { nw = iw; nh = ih; }
            }
            var sprW = nw * _nativeScale;
            var sprH = nh * _nativeScale;
            _effectiveSprH = sprH;
            group._ew_spriteW = sprW;

            spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(sprW, sprH), spriteMat);
            var bottomShift = 0;
            if (scanData && !scanData.scanning && scanData.bottomGapPct > 0) {
                bottomShift = sprH * (scanData.bottomGapPct / 100);
            }
            spriteMesh.position.y = sprH / 2 - bottomShift;
            spriteMesh._ew_baseY = sprH / 2 - bottomShift;
            spriteMesh._ew_billboard = true;

            if (unit._spriteFlipX && spriteMesh) {
                spriteMesh.scale.x = -1;
            }
            group.add(spriteMesh);
        }

        var ringCol = _viewerPlayerColor(unit.player);

        var innerRing = new THREE.Mesh(
            new THREE.RingGeometry(ts * 0.28, ts * 0.40, 32),
            new THREE.MeshBasicMaterial({ color: ringCol, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false })
        );
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = SELECTED_RING_OFFSET;
        group.add(innerRing);

        var outerRing = new THREE.Mesh(
            new THREE.RingGeometry(ts * 0.40, ts * 0.50, 32),
            new THREE.MeshBasicMaterial({ color: ringCol, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
        );
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.y = SELECTED_RING_OFFSET - 0.1;
        group.add(outerRing);

        if (state.selectedUnitId === unit.id) {
            var selGlow = new THREE.Mesh(
                new THREE.RingGeometry(ts * 0.42, ts * 0.56, 32),
                _makeRingMaterial(0xffcc00, 1.0, 0.0)
            );
            selGlow.rotation.x = -Math.PI / 2;
            selGlow.position.y = SELECTED_RING_OFFSET + 0.3;
            group.add(selGlow);

            var selHalo = new THREE.Mesh(
                new THREE.RingGeometry(ts * 0.56, ts * 0.64, 32),
                new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
            );
            selHalo.rotation.x = -Math.PI / 2;
            selHalo.position.y = SELECTED_RING_OFFSET + 0.2;
            group.add(selHalo);
        }

        var _subSink = _getSubmersionDepth(unit) * _effectiveSprH;
        group.position.set(unit.x * ts + ts / 2, surfY - _subSink, unit.y * ts + ts / 2);
        group._ew_unitId = unit.id;
        group._ew_subSink = _subSink;

        if (group._ew_isBatSwarm) {

            group._ew_spriteTopY = surfY + ts * BAT_SPREAD + ts * BAT_SPRITE_SIZE + 12;
        } else {
            var topShift = 0;
            var spriteUrl2 = (typeof getBattleMapSpriteUrl === 'function')
                           ? getBattleMapSpriteUrl(unit)
                           : ((typeof getR2RaceSpriteUrl === 'function')
                              ? getR2RaceSpriteUrl(unit.race, unit.gender, unit.cls) : null);
            if (spriteUrl2 && window._spriteGroundOffsets) {
                var gndData2 = window._spriteGroundOffsets.get(spriteUrl2);
                if (gndData2 && !gndData2.scanning && gndData2.topGapPct > 0) {
                    topShift = _effectiveSprH * (gndData2.topGapPct / 100);
                }
            }
            var bottomShift2 = 0;
            if (spriteUrl2 && window._spriteGroundOffsets) {
                var gndData3 = window._spriteGroundOffsets.get(spriteUrl2);
                if (gndData3 && !gndData3.scanning && gndData3.bottomGapPct > 0) {
                    bottomShift2 = _effectiveSprH * (gndData3.bottomGapPct / 100);
                }
            }
            group._ew_spriteTopY = surfY + _effectiveSprH - bottomShift2 - topShift + 4;
        }

        return { group: group, sprite: spriteMesh };
    }

    function rebuildUnits() {
        if (!unitGroup) return;

        _hoverGlowMesh = null; _hoveredUnitId = null;

        _selChevronMesh = null; _selChevronUnitId = null;
        _lastActivePlateId = null;
        _clearGroup(unitGroup);
        unitEntries.clear();
        _clearPlates();

        if (!state.units) return;
        for (var i = 0; i < state.units.length; i++) {
            var unit = state.units[i];
            if (unit.dead || unit._dying) continue;
            var entry = _buildUnitEntry(unit);
            unitGroup.add(entry.group);
            unitEntries.set(unit.id, entry);
            _createPlate(unit);
        }
        _lastUnitSerial = _computeUnitSerial();
        _lastStructuralSerial = _computeUnitStructuralSerial();
        _rebuildUnitMap();

        _bbLastCamX = NaN;

        if (ThreePost && ThreePost.rebuildUnitLights) {
            ThreePost.rebuildUnitLights(state.units, unitSurfaceY, CONFIG.tileSize || 128);
        }
    }

    function _ensurePlateStyles() {

        if (!document.getElementById('threePlateStyles')) {
            var s = document.createElement('style');
            s.id = 'threePlateStyles';
            s.textContent = [

                '.tp-plate-outer {',
                '  pointer-events: none; width: 0; height: 0; overflow: visible;',
                '}',
                '.tp-wrap {',
                '  pointer-events: none;',
                '  width: 150px;',
                '  font-family: "DotGothic16", monospace;',
                '  position: absolute;',
                '  left: 0; bottom: 0;',
                '  transform: translateX(-50%);',
                '  transform-origin: center bottom;',
                '}',

                '.tp-wrap .tp-name {',
                '  display: flex; align-items: center; justify-content: center;',
                '  height: 20px; font-size: 13px; font-weight: 700;',
                '  color: #e8e8f0; text-shadow: 0 1px 3px #000, 0 0 6px rgba(0,0,0,0.8);',
                '  letter-spacing: 0.06em; text-transform: uppercase;',
                '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
                '  padding: 0 4px;',
                '}',
                '.tp-wrap .tp-lvl {',
                '  color: #ffd866; margin-right: 5px; font-size: 11px; flex-shrink: 0;',
                '}',

                /* Body = the single black panel holding the type badge column
                   (left) and the HP/MP bars (right) as one cohesive unit. */
                '.tp-wrap .tp-body {',
                '  display: flex; align-items: stretch; gap: 3px;',
                '  background: rgba(0,0,0,0.7); border-radius: 4px;',
                '  padding: 3px 4px; border: 1px solid rgba(255,255,255,0.12);',
                '  box-shadow: 0 2px 8px rgba(0,0,0,0.8);',
                '}',

                '.tp-wrap .tp-bars {',
                '  flex: 1 1 auto; min-width: 0;',
                '  display: flex; flex-direction: column; gap: 2px;',
                '}',

                '.tp-wrap .tp-bar {',
                '  position: relative; width: 100%; height: 14px;',
                '  background: rgba(0,0,0,0.6); border-radius: 2px; overflow: hidden;',
                '}',

                '.tp-wrap .tp-hp-fill {',
                '  position: absolute; top: 0; left: 0; height: 100%; border-radius: 2px;',
                '  transition: width 0.25s ease-out;',
                '}',
                '.tp-wrap .tp-hp-ally .tp-hp-fill {',
                '  background: linear-gradient(180deg, #5eea7a 0%, #2eb850 50%, #1d8a3a 100%);',
                '  box-shadow: 0 0 4px rgba(80,230,100,0.4);',
                '}',
                '.tp-wrap .tp-hp-enemy .tp-hp-fill {',
                '  background: linear-gradient(180deg, #ff5050 0%, #d42020 50%, #a01010 100%);',
                '  box-shadow: 0 0 4px rgba(255,60,60,0.5);',
                '}',

                '.tp-wrap .tp-hp-tick {',
                '  position: absolute; top: 1px; bottom: 1px; width: 1px;',
                '  background: rgba(0,0,0,0.55); pointer-events: none; z-index: 1;',
                '}',

                '.tp-wrap .tp-shield {',
                '  position: absolute; top: 0; right: 0; height: 100%;',
                '  background: linear-gradient(180deg, rgba(120,200,255,0.7) 0%, rgba(60,140,220,0.5) 100%);',
                '  border-radius: 2px;',
                '}',

                '.tp-wrap .tp-mp-fill {',
                '  position: absolute; top: 0; left: 0; height: 100%; border-radius: 2px;',
                '  background: linear-gradient(180deg, #6090ff 0%, #3060d0 50%, #2040a0 100%);',
                '  transition: width 0.25s ease-out;',
                '}',
                '.tp-wrap .tp-bar-mp { height: 9px; }',

                '.tp-wrap .tp-bar-num {',
                '  position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
                '  display: flex; align-items: center; justify-content: center;',
                '  font-size: 11px; font-weight: 700; color: #fff;',
                '  text-shadow: 0 0 3px #000, 0 1px 1px #000;',
                '  letter-spacing: 0.04em; line-height: 1;',
                '}',
                '.tp-wrap .tp-bar-mp .tp-bar-num { font-size: 8px; }',

                '.tp-wrap .tp-status-row {',
                '  display: flex; flex-wrap: wrap; gap: 1px; padding: 1px 0 0;',
                '  justify-content: center;',
                '}',
                '.tp-wrap .tp-sbadge {',
                '  font-size: 9px; font-weight: 700; padding: 1px 4px;',
                '  border-radius: 2px; color: #fff; line-height: 1.4;',
                '}',
                '.tp-wrap .tp-stat-up { background: rgba(50,200,100,0.3); color: #6ee2a8; }',
                '.tp-wrap .tp-stat-dn { background: rgba(255,80,80,0.3); color: #ff7a8a; }',

                /* Type badges stack vertically alongside the bars. With a single
                   type the lone badge stretches (flex:1) to span the full height
                   of both the HP and MP bars; with two types each badge lines up
                   with one bar. */
                '.tp-wrap .tp-types {',
                '  flex: 0 0 auto;',
                '  display: flex; flex-direction: column; gap: 2px;',
                '}',
                /* Canonical type badge — same cut-corner chip used everywhere
                   else (action menu, roster, codex). Bright colored text on a
                   tinted-over-dark fill reads cleanly over the 3D scene. */
                '.tp-wrap .tp-type {',
                '  flex: 1 1 0; min-height: 0;',
                '  display: flex; align-items: center; justify-content: center;',
                '  font-size: 9px; font-weight: 700; letter-spacing: 0.12em;',
                '  padding: 0 6px; line-height: 1;',
                '  text-transform: uppercase;',
                '  text-shadow: 0 1px 2px rgba(0,0,0,0.85);',
                '  border: 1px solid transparent;',
                '  clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);',
                '}',
                '.tp-wrap .tp-type-human   { color:#c8c8e4; background: linear-gradient(#a0a0c322,#a0a0c322), rgba(9,11,17,0.82); border-color:#a0a0c3aa; }',
                '.tp-wrap .tp-type-divine  { color:#f2c63c; background: linear-gradient(#dcaa1e22,#dcaa1e22), rgba(9,11,17,0.82); border-color:#dcaa1eaa; }',
                '.tp-wrap .tp-type-unholy  { color:#c566e2; background: linear-gradient(#9632b422,#9632b422), rgba(9,11,17,0.82); border-color:#9632b4aa; }',
                '.tp-wrap .tp-type-tech    { color:#4ecbe2; background: linear-gradient(#28a0be22,#28a0be22), rgba(9,11,17,0.82); border-color:#28a0beaa; }',
                '.tp-wrap .tp-type-anomaly { color:#ff5e98; background: linear-gradient(#dc3c8222,#dc3c8222), rgba(9,11,17,0.82); border-color:#dc3c82aa; }',
                '.tp-wrap .tp-type-alien   { color:#56d178; background: linear-gradient(#32aa5022,#32aa5022), rgba(9,11,17,0.82); border-color:#32aa50aa; }',

                '.tp-wrap.tp-p1 .tp-body {',
                '  border-color: rgba(90,170,255,0.45);',
                '}',
                '.tp-wrap.tp-p2 .tp-body {',
                '  border-color: rgba(255,90,90,0.45);',
                '}',
                'body.is-p2-viewer .tp-wrap.tp-p1 .tp-body {',
                '  border-color: rgba(255,90,90,0.45);',
                '}',
                'body.is-p2-viewer .tp-wrap.tp-p2 .tp-body {',
                '  border-color: rgba(90,170,255,0.45);',
                '}',

                '.tp-wrap.tp-p1 .tp-name {',
                '  color: #5aafff;',
                '}',
                '.tp-wrap.tp-p2 .tp-name {',
                '  color: #ff5a5a;',
                '}',

                'body.is-p2-viewer .tp-wrap.tp-p1 .tp-name {',
                '  color: #ff5a5a;',
                '}',
                'body.is-p2-viewer .tp-wrap.tp-p2 .tp-name {',
                '  color: #5aafff;',
                '}',

                '.tp-wrap.tp-active .tp-name {',
                '  color: #ffd866 !important;',
                '  text-shadow: 0 0 8px rgba(255,200,0,0.9), 0 0 3px rgba(255,200,0,0.5), 0 1px 3px #000;',
                '}',
                '.tp-wrap.tp-active .tp-body {',
                '  border-color: rgba(255,200,0,0.55) !important;',
                '}',

                '.tp-eff-badge {',
                '  position: absolute; top: -2px; right: -6px; width: 16px; height: 16px;',
                '  border-radius: 50%; font-size: 11px; font-weight: 900;',
                '  display: none; align-items: center; justify-content: center;',
                '  line-height: 1; pointer-events: none; z-index: 10;',
                '  text-shadow: 0 1px 2px rgba(0,0,0,0.8);',
                '  box-shadow: 0 0 4px rgba(0,0,0,0.6);',
                '}',
                '.tp-eff-badge.tp-eff-super {',
                '  display: flex; background: rgba(40,180,60,0.85); color: #fff;',
                '  border: 1px solid rgba(80,255,100,0.6);',
                '  animation: tp-eff-pulse 1.2s ease-in-out infinite;',
                '}',
                '.tp-eff-badge.tp-eff-resist {',
                '  display: flex; background: rgba(180,50,50,0.85); color: #fff;',
                '  border: 1px solid rgba(255,100,100,0.5);',
                '}',
                '@keyframes tp-eff-pulse {',
                '  0%, 100% { transform: scale(1); }',
                '  50% { transform: scale(1.15); }',
                '}'
            ].join('\n');
            document.head.appendChild(s);
        }
    }

    function _clearPlates() {
        for (var entry of _plateObjs) {
            var po = entry[1];
            if (po.css2d && po.css2d.parent) po.css2d.parent.remove(po.css2d);
        }
        _plateObjs.clear();
        /* NOTE: do NOT clear _lastHpPctById/_lastMpPctById here — _clearPlates() runs
           on every rebuildUnits(), and _createPlate() relies on the previous fill % to
           animate the drain. They're cleared on dispose() / match teardown instead. */
    }

    function _hpTier(ratio) {
        if (ratio > 0.5) return 'hp-high';
        if (ratio > 0.25) return 'hp-mid';
        return 'hp-low';
    }

    function _createPlate(unit) {
        _ensurePlateStyles();

        /* Outer container: 0×0 point, CSS2DRenderer positions this */
        var outer = document.createElement('div');
        outer.className = 'tp-plate-outer';

        var wrap = document.createElement('div');
        var pCls = unit.player === 1 ? 'tp-p1' : 'tp-p2';

        var blitzUnit = (typeof getBlitzTurnUnit === 'function') ? getBlitzTurnUnit() : null;
        if (blitzUnit && blitzUnit.id === unit.id) pCls += ' tp-active';
        wrap.className = 'tp-wrap ' + pCls;

        var lvl = (typeof getUnitLevel === 'function') ? getUnitLevel(unit) : 1;
        var mode = state.nametagMode || 'name';
        var label = '';
        if (mode === 'job') label = (typeof getJobDisplayName === 'function') ? getJobDisplayName(unit.cls) : (unit.cls || '');
        else if (mode === 'race') label = unit.race ? unit.race.charAt(0).toUpperCase() + unit.race.slice(1) : '';
        else if (mode !== 'none') label = unit.name || unit.cls || '';

        var hpPct = Math.max(0, Math.round(100 * unit.hp / (unit.maxHp || 1)));
        var mpPct = Math.max(0, Math.round(100 * unit.mp / (unit.maxMp || 1)));
        /* If this unit already had a plate (it's being rebuilt mid-combat), start the
           fill at the previously rendered width so the CSS width-transition can drain
           it down to the new value instead of snapping. */
        var hpStartPct = _lastHpPctById.has(unit.id) ? _lastHpPctById.get(unit.id) : hpPct;
        var mpStartPct = _lastMpPctById.has(unit.id) ? _lastMpPctById.get(unit.id) : mpPct;
        var allyCls = _isAllyPlayer(unit.player) ? 'tp-hp-ally' : 'tp-hp-enemy';
        var ticksHtml = _buildHpTicks(unit.maxHp || 1);

        var shieldAmt = unit.shield || 0;
        var shieldPct = shieldAmt > 0 ? Math.round((shieldAmt / (unit.maxHp || 1)) * 100) : 0;
        var shieldHtml = shieldPct > 0 ? '<div class="tp-shield" style="width:' + shieldPct + '%"></div>' : '';

        var typeHtml = '';
        if (unit.types && unit.types.length) {
            var TYPE_ABBR = { human:'Human', divine:'Divine', unholy:'Unholy', tech:'Tech', anomaly:'Anomaly', alien:'Alien' };
            var tParts = [];
            for (var ti = 0; ti < unit.types.length; ti++) {
                var tKey = unit.types[ti];
                var tAbbr = TYPE_ABBR[tKey] || tKey.substring(0,3).toUpperCase();
                tParts.push('<span class="tp-type tp-type-' + tKey + '">' + tAbbr + '</span>');
            }
            typeHtml = '<div class="tp-types">' + tParts.join('') + '</div>';
        }

        var statusHtml = '';
        if (typeof getActiveStatusKeys === 'function' && typeof _STATUS_EFFECT_IDS !== 'undefined') {
            var _SB_COLORS = {
                burn:'#c0392b',poison:'#27ae60',silence:'#7f8c8d',stun:'#f39c12',
                stagger:'#e67e22',marked:'#e74c6f',jammed:'#8e44ad',drowning:'#2980b9',
                lava_burn:'#d35400',protect:'#3498db',charm:'#e84393',sirenSong:'#6c5ce7',
                invisible:'#1a7a4a'
            };
            var badges = [];
            var activeKeys = getActiveStatusKeys(unit);
            for (var si = 0; si < activeKeys.length; si++) {
                var sk = activeKeys[si];
                /* 'invisible' isn't in the shared status-tick whitelist (changing that
                   set would alter game logic), so surface it as a badge explicitly.
                   Concealed enemies aren't drawn, so this only ever shows on units
                   the viewer can legitimately see (i.e. their own cloaked units). */
                if (!_STATUS_EFFECT_IDS.has(sk) && sk !== 'invisible') continue;
                var sDef = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS[sk] : null;
                if (!sDef) continue;
                badges.push('<span class="tp-sbadge" style="background:' + (_SB_COLORS[sk] || '#555') + '">' + (sDef.short || sk) + '</span>');
            }

            var atkD = (typeof getStatusAtkDelta === 'function') ? getStatusAtkDelta(unit) : 0;
            var defD = (typeof getStatusArmorDelta === 'function') ? getStatusArmorDelta(unit) : 0;
            var movD = (typeof getStatusMoveDelta === 'function') ? getStatusMoveDelta(unit) : 0;
            var hgBuff = unit.hourglassBuff || 0;
            var totalAtk = atkD + hgBuff + (unit._streakAtkBonus || 0) + (unit._lastStandAtkBonus || 0);
            var totalDef = defD + hgBuff;
            var totalMov = movD + (hgBuff > 0 ? Math.floor(hgBuff / 2) : 0);
            if (totalAtk > 0) badges.push('<span class="tp-sbadge tp-stat-up">ATK+' + totalAtk + '</span>');
            else if (totalAtk < 0) badges.push('<span class="tp-sbadge tp-stat-dn">ATK' + totalAtk + '</span>');
            if (totalDef > 0) badges.push('<span class="tp-sbadge tp-stat-up">DEF+' + totalDef + '</span>');
            else if (totalDef < 0) badges.push('<span class="tp-sbadge tp-stat-dn">DEF' + totalDef + '</span>');
            if (totalMov > 0) badges.push('<span class="tp-sbadge tp-stat-up">MOV+' + totalMov + '</span>');
            else if (totalMov < 0) badges.push('<span class="tp-sbadge tp-stat-dn">MOV' + totalMov + '</span>');
            if (badges.length) statusHtml = '<div class="tp-status-row">' + badges.join('') + '</div>';
        }

        wrap.innerHTML =
            '<div class="tp-name">' +
                '<span class="tp-lvl">' + lvl + '</span>' +
                _escHtml(label) +
            '</div>' +
            '<div class="tp-body">' +
                typeHtml +
                '<div class="tp-bars">' +
                    '<div class="tp-bar ' + allyCls + '">' +
                        '<div class="tp-hp-fill" style="width:' + hpStartPct + '%"></div>' +
                        ticksHtml +
                        shieldHtml +
                        '<span class="tp-bar-num">' + unit.hp + '/' + unit.maxHp + '</span>' +
                    '</div>' +
                    '<div class="tp-bar tp-bar-mp">' +
                        '<div class="tp-mp-fill" style="width:' + mpStartPct + '%"></div>' +
                        '<span class="tp-bar-num">' + unit.mp + '/' + unit.maxMp + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            statusHtml;

        var effEl = document.createElement('div');
        effEl.className = 'tp-eff-badge';
        effEl.setAttribute('data-eff', '');
        wrap.appendChild(effEl);

        outer.appendChild(wrap);

        var css2d = new THREE.CSS2DObject(outer);
        var ue = unitEntries.get(unit.id);
        if (ue && ue.group) {

            var localY = ue.group._ew_spriteTopY - ue.group.position.y + 12;
            css2d.position.set(0, localY, 0);
            ue.group.add(css2d);
        }

        _plateObjs.set(unit.id, { css2d: css2d, el: wrap });

        /* The fill was rendered at its previous width (hpStartPct/mpStartPct). On the
           next frame, set it to the real value so the CSS width-transition animates the
           change (e.g. health draining) rather than snapping. */
        if (hpStartPct !== hpPct || mpStartPct !== mpPct) {
            requestAnimationFrame(function () {
                var hf = wrap.querySelector('.tp-hp-fill');
                if (hf) hf.style.width = hpPct + '%';
                var mf = wrap.querySelector('.tp-mp-fill');
                if (mf) mf.style.width = mpPct + '%';
            });
        }
        _lastHpPctById.set(unit.id, hpPct);
        _lastMpPctById.set(unit.id, mpPct);
    }

    /* Build a nameplate for a decoy/clone that visually matches a real unit plate.
       Uses the cloned spriteUnit's stats and shows full HP/MP so the decoy reads as
       a healthy, ordinary unit. Returns {css2d, el} (not registered in _plateObjs). */
    function _buildClonePlate(su, ownerPlayer) {
        if (!su) return null;
        _ensurePlateStyles();

        var outer = document.createElement('div');
        outer.className = 'tp-plate-outer';

        var wrap = document.createElement('div');
        wrap.className = 'tp-wrap ' + (ownerPlayer === 1 ? 'tp-p1' : 'tp-p2');

        var lvl = 1;
        try { if (typeof getUnitLevel === 'function') lvl = getUnitLevel(su); } catch (e) {}

        var mode = state.nametagMode || 'name';
        var label = '';
        if (mode === 'job') label = (typeof getJobDisplayName === 'function') ? getJobDisplayName(su.cls) : (su.cls || '');
        else if (mode === 'race') label = su.race ? su.race.charAt(0).toUpperCase() + su.race.slice(1) : '';
        else if (mode !== 'none') label = su.name || su.cls || '';

        var maxHp = su.maxHp || 1, maxMp = su.maxMp || 0;
        var allyCls = _isAllyPlayer(ownerPlayer) ? 'tp-hp-ally' : 'tp-hp-enemy';
        var ticksHtml = _buildHpTicks(maxHp);

        var typeHtml = '';
        if (su.types && su.types.length) {
            var TYPE_ABBR = { human:'Human', divine:'Divine', unholy:'Unholy', tech:'Tech', anomaly:'Anomaly', alien:'Alien' };
            var tParts = [];
            for (var ti = 0; ti < su.types.length; ti++) {
                var tKey = su.types[ti];
                var tAbbr = TYPE_ABBR[tKey] || tKey.substring(0, 3).toUpperCase();
                tParts.push('<span class="tp-type tp-type-' + tKey + '">' + tAbbr + '</span>');
            }
            typeHtml = '<div class="tp-types">' + tParts.join('') + '</div>';
        }

        wrap.innerHTML =
            '<div class="tp-name">' +
                '<span class="tp-lvl">' + lvl + '</span>' +
                _escHtml(label) +
            '</div>' +
            '<div class="tp-body">' +
                typeHtml +
                '<div class="tp-bars">' +
                    '<div class="tp-bar ' + allyCls + '">' +
                        '<div class="tp-hp-fill" style="width:100%"></div>' +
                        ticksHtml +
                        '<span class="tp-bar-num">' + maxHp + '/' + maxHp + '</span>' +
                    '</div>' +
                    '<div class="tp-bar tp-bar-mp">' +
                        '<div class="tp-mp-fill" style="width:100%"></div>' +
                        '<span class="tp-bar-num">' + maxMp + '/' + maxMp + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var effEl = document.createElement('div');
        effEl.className = 'tp-eff-badge';
        wrap.appendChild(effEl);
        outer.appendChild(wrap);

        return { css2d: new THREE.CSS2DObject(outer), el: wrap };
    }

    /* ── Per-frame plate scaling: match plate width to projected sprite width ── */
    var _scalePlateVec = new THREE.Vector3();
    var PLATE_BASE_W = 150;
    var MIN_PLATE_SCALE = 1.0;
    var MAX_PLATE_SCALE = 3.0;

    function _scalePlates(cam) {
        if (!cam || !_parentEl) return;
        var screenH = _parentEl.clientHeight;
        if (screenH <= 0) return;
        var fovRad = cam.fov * Math.PI / 180;
        var halfTanFov = Math.tan(fovRad / 2);

        _plateObjs.forEach(function(po, uid) {
            if (!po.css2d.visible) return;
            var ue = unitEntries.get(uid);
            if (!ue || !ue.group) return;
            /* Always scale relative to tile size, not sprite width —
               narrow sprites (64×128) must not shrink the plate */
            var refW = CONFIG.tileSize || 128;

            ue.group.getWorldPosition(_scalePlateVec);
            var dist = _scalePlateVec.distanceTo(cam.position);
            if (dist < 1) dist = 1;

            /* projected pixel width of one tile at this distance */
            var projW = (refW * screenH) / (2 * dist * halfTanFov);

            /* scale so plate is at least as wide as one tile, with a legibility floor */
            var s = Math.min(MAX_PLATE_SCALE, Math.max(projW / PLATE_BASE_W, MIN_PLATE_SCALE));

            po.el.style.transform = 'translateX(-50%) scale(' + s.toFixed(3) + ')';
        });

        /* Scale decoy nameplates the same way so they don't betray the decoy by
           staying a fixed size while real plates grow/shrink with the camera. */
        for (var _dsi = 0; _dsi < _decoyPlates.length; _dsi++) {
            var _dse = _decoyPlates[_dsi];
            if (!_dse.css2d.visible || !_dse.mesh) continue;
            var _drefW = CONFIG.tileSize || 128;
            _dse.mesh.getWorldPosition(_scalePlateVec);
            var _ddist = _scalePlateVec.distanceTo(cam.position);
            if (_ddist < 1) _ddist = 1;
            var _dprojW = (_drefW * screenH) / (2 * _ddist * halfTanFov);
            var _ds = Math.min(MAX_PLATE_SCALE, Math.max(_dprojW / PLATE_BASE_W, MIN_PLATE_SCALE));
            _dse.el.style.transform = 'translateX(-50%) scale(' + _ds.toFixed(3) + ')';
        }
    }

    function _updatePlateVisibility() {

        var targetSet = window._ewTargetableUnitIds || null;

        for (var entry of _plateObjs) {
            var uid = entry[0], po = entry[1];
            var vis = true;

            if (targetSet && !targetSet.has(uid)) {
                vis = false;
            }

            if (vis && state.fogOfWar && _fogVisibleSet) {
                var _pUnit = _unitById.get(uid) || null;
                if (_pUnit) {
                    var _pVp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
                    if (_pUnit.player !== _pVp && !_fogVisibleSet.has(_pUnit.x + ',' + _pUnit.y)) {
                        vis = false;
                    }
                }
            }

            if (vis && po.css2d.parent && !po.css2d.parent.visible) {
                vis = false;
            }

            po.css2d.visible = vis;
        }

        /* Decoy plates follow their sprite's fog visibility. */
        for (var _dvi = 0; _dvi < _decoyPlates.length; _dvi++) {
            var _dve = _decoyPlates[_dvi];
            _dve.css2d.visible = _dve.mesh ? !!_dve.mesh.visible : true;
        }
    }

    var _lastEffKey = '';
    function _updatePlateEffBadges() {
        var hlStore = window._ewHlCache;
        var hlMap = hlStore ? hlStore.map : null;
        var actionMode = state.actionMode || '';
        var isTargeting = (actionMode === 'attack' || actionMode === 'spell') && state.selectedUnitId;

        var effKey = isTargeting ? (actionMode + '|' + state.selectedUnitId + '|' + (state.selectedTool || '')) : '';
        if (effKey === _lastEffKey && effKey === '') return;
        _lastEffKey = effKey;

        for (var entry of _plateObjs) {
            var uid = entry[0], po = entry[1];
            var effEl = po.el.querySelector('.tp-eff-badge');
            if (!effEl) continue;

            if (!isTargeting || !hlMap) {
                effEl.className = 'tp-eff-badge';
                effEl.textContent = '';
                continue;
            }

            var unit = _unitById.get(uid);
            if (!unit || unit.dead) {
                effEl.className = 'tp-eff-badge';
                effEl.textContent = '';
                continue;
            }

            var pk = unit.x + ',' + unit.y;
            var hlType = hlMap.get(pk) || '';

            if (hlType.indexOf('type-strong') !== -1) {
                effEl.className = 'tp-eff-badge tp-eff-super';
                effEl.textContent = '!';
            } else if (hlType.indexOf('type-weak') !== -1) {
                effEl.className = 'tp-eff-badge tp-eff-resist';
                effEl.textContent = '−';
            } else {
                effEl.className = 'tp-eff-badge';
                effEl.textContent = '';
            }
        }
    }

    function _getHlColor(type) {
        if (!type) return 0xffffff;

        if (HL_COLORS[type] !== undefined) return HL_COLORS[type];

        if (type.indexOf('attack enemy') === 0) return HL_COLORS['attack enemy'];

        for (var p in HL_COLORS) { if (type.indexOf(p) === 0) return HL_COLORS[p]; }
        return 0xffffff;
    }

    function _getHlOpacity(type) {
        if (!type) return HL_OPACITY;
        if (HL_OPACITY_MAP[type] !== undefined) return HL_OPACITY_MAP[type];
        if (type.indexOf('attack enemy') === 0) return HL_OPACITY_MAP['attack enemy'] || HL_OPACITY;
        return HL_OPACITY;
    }

    var _hlMatCache = new Map();
    var _hlSharedGeo = null;
    var _hlSharedGeoTs = 0;

    function _getSharedHlGeo(ts) {
        if (_hlSharedGeo && _hlSharedGeoTs === ts) return _hlSharedGeo;
        if (_hlSharedGeo) _hlSharedGeo.dispose();
        _hlSharedGeo = new THREE.PlaneGeometry(ts * 0.92, ts * 0.92);
        _hlSharedGeo._ew_shared = true;
        _hlSharedGeoTs = ts;
        return _hlSharedGeo;
    }

    function _getSharedHlMat(hlType) {

        var matKey = hlType;
        if (hlType.indexOf('attack enemy') === 0) matKey = 'attack enemy';
        if (_hlMatCache.has(matKey)) return _hlMatCache.get(matKey);
        var color = _getHlColor(matKey);
        var opacity = _getHlOpacity(matKey);
        var edgeGlow = HL_EDGE_GLOW[matKey] || 0.6;
        if (edgeGlow === 0.6 && matKey.indexOf('attack enemy') === 0) edgeGlow = HL_EDGE_GLOW['attack enemy'];
        var dotCount = HL_DOT_COUNT[matKey] || 0;
        var mat = _makeHlMaterial(color, opacity, edgeGlow, dotCount);
        mat._ew_shared = true;
        _hlMatCache.set(matKey, mat);
        return mat;
    }

    function rebuildHighlights() {
        if (!highlightGroup) return;

        var toRemove = [];
        for (var i = 0; i < highlightGroup.children.length; i++) {
            var ch = highlightGroup.children[i];
            if (!ch._ew_overlay && ch !== hoverMesh) toRemove.push(ch);
        }
        for (var j = 0; j < toRemove.length; j++) {
            highlightGroup.remove(toRemove[j]);
            if (toRemove[j].geometry && toRemove[j].geometry !== _hlSharedGeo) toRemove[j].geometry.dispose();

        }
        if (hoverMesh) { highlightGroup.remove(hoverMesh); if (hoverMesh.geometry !== _hlSharedGeo) hoverMesh.geometry.dispose(); hoverMesh.material.dispose(); hoverMesh = null; }
        _lastHoverX = -1; _lastHoverY = -1;

        if (!state.selectedUnitId || !state.actionMode || state.phase !== 'battle' || state._actionExecuting) { _lastHlKey = ''; return; }

        var ts = CONFIG.tileSize || 128;

        var cache = window._ewHlCache;

        var _curHlKey = state.selectedUnitId + '|' + state.actionMode;
        if (cache && cache.key && cache.key.indexOf(_curHlKey) !== 0) {
            cache = null;
        }
        if (cache && cache.map && cache.map.size > 0) {
            var hlGeo = _getSharedHlGeo(ts);
            cache.map.forEach(function(hlType, pk) {
                var comma = pk.indexOf(',');
                var hx = parseInt(pk.substring(0, comma), 10);
                var hy = parseInt(pk.substring(comma + 1), 10);

                var topY = tileTopY(hx, hy) + 0.3;
                var mat = _getSharedHlMat(hlType);
                var plane = new THREE.Mesh(hlGeo, mat);
                plane.rotation.x = -Math.PI / 2;
                plane.position.set(hx * ts + ts / 2, topY, hy * ts + ts / 2);
                highlightGroup.add(plane);
            });
            return;
        }

        var G = (typeof window !== 'undefined' && window.GAME) ? window.GAME : null;
        if (!G) { _lastHlKey = ''; return; }
        var sel = (function(){ var _u = _unitById.get(state.selectedUnitId); return (_u && !_u.dead) ? _u : null; })();
        if (!sel) { _lastHlKey = ''; return; }

        var fbGeo = _getSharedHlGeo(ts);
        var tiles = null;
        if (state.actionMode === 'move' && typeof G.getMoveTiles === 'function') {
            tiles = G.getMoveTiles(sel);
            if (tiles) {
                for (var mi = 0; mi < tiles.length; mi++) {
                    var mt = tiles[mi];
                    var mType = mt._jump ? 'move-jump' : mt._takeoff ? 'move-takeoff' : 'move';
                    var mTopY = tileTopY(mt.x, mt.y) + 0.3;
                    var mPlane = new THREE.Mesh(fbGeo, _getSharedHlMat(mType));
                    mPlane.rotation.x = -Math.PI / 2;
                    mPlane.position.set(mt.x * ts + ts / 2, mTopY, mt.y * ts + ts / 2);
                    highlightGroup.add(mPlane);
                }
            }
        } else if (state.actionMode === 'jump' && typeof G.getJumpTiles === 'function') {
            tiles = G.getJumpTiles(sel);
            if (tiles) {
                for (var ji = 0; ji < tiles.length; ji++) {
                    var jt = tiles[ji];
                    var jTopY = tileTopY(jt.x, jt.y) + 0.3;
                    var jPlane = new THREE.Mesh(fbGeo, _getSharedHlMat('move-jump'));
                    jPlane.rotation.x = -Math.PI / 2;
                    jPlane.position.set(jt.x * ts + ts / 2, jTopY, jt.y * ts + ts / 2);
                    highlightGroup.add(jPlane);
                }
            }
        } else if (state.actionMode === 'attack' && typeof G.getAttackTiles === 'function') {
            tiles = G.getAttackTiles(sel);
            if (tiles) {
                for (var ai = 0; ai < tiles.length; ai++) {
                    var at = tiles[ai];
                    var aTopY = tileTopY(at.x, at.y) + 0.3;
                    var aPlane = new THREE.Mesh(fbGeo, _getSharedHlMat('attack'));
                    aPlane.rotation.x = -Math.PI / 2;
                    aPlane.position.set(at.x * ts + ts / 2, aTopY, at.y * ts + ts / 2);
                    highlightGroup.add(aPlane);
                }
            }
        } else if (state.actionMode === 'inspect' && typeof G.getInspectTiles === 'function') {
            tiles = G.getInspectTiles(sel);
            if (tiles) {
                for (var ii = 0; ii < tiles.length; ii++) {
                    var it = tiles[ii];
                    var iTopY = tileTopY(it.x, it.y) + 0.3;
                    var iPlane = new THREE.Mesh(fbGeo, _getSharedHlMat('inspect'));
                    iPlane.rotation.x = -Math.PI / 2;
                    iPlane.position.set(it.x * ts + ts / 2, iTopY, it.y * ts + ts / 2);
                    highlightGroup.add(iPlane);
                }
            }
        }
    }

    var _overlayMeshes = {};

    var _PREVIEW_OVERLAYS = { spellRange: true, attackRange: true };

    var _previewBaseOpacity = {};

    function setOverlay(name, tiles, color, opacity) {
        clearOverlay(name);
        if (!highlightGroup || !tiles || !tiles.length) return;
        var ts = CONFIG.tileSize || 128;
        var meshes = [];
        var isPreview = !!_PREVIEW_OVERLAYS[name];
        if (isPreview) _previewBaseOpacity[name] = opacity;
        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var topY = tileTopY(t.x, t.y) + (name === 'aoe' ? 0.6 : 0.2);
            var tileColor = (t.color !== undefined) ? t.color : color;
            var tileOpacity = (t.opacity !== undefined) ? t.opacity : opacity;
            var oMat = _makeHlMaterial(tileColor, tileOpacity, isPreview ? 0.85 : 0.65, 0);
            var plane = new THREE.Mesh(
                new THREE.PlaneGeometry(ts * 0.92, ts * 0.92),
                oMat
            );
            plane.rotation.x = -Math.PI / 2;
            plane.position.set(t.x * ts + ts / 2, topY, t.y * ts + ts / 2);
            plane._ew_overlay = name;
            highlightGroup.add(plane);
            meshes.push(plane);
        }
        _overlayMeshes[name] = meshes;
    }

    function _updatePreviewOverlayPulse() {
        var t = performance.now() / 1000.0;
        for (var name in _PREVIEW_OVERLAYS) {
            var meshes = _overlayMeshes[name];
            if (!meshes || !meshes.length) continue;
            var baseOp = _previewBaseOpacity[name] || 0.4;

            var pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 5.0));
            var op = baseOp * pulse;
            for (var i = 0; i < meshes.length; i++) {
                var mat = meshes[i].material;
                if (mat && mat.uniforms && mat.uniforms.uOpacity) {
                    mat.uniforms.uOpacity.value = op;
                }
            }
        }
    }

    function clearOverlay(name) {
        var meshes = _overlayMeshes[name];
        if (!meshes || !meshes.length) return;
        for (var i = 0; i < meshes.length; i++) {
            if (highlightGroup) highlightGroup.remove(meshes[i]);
            if (meshes[i].geometry) meshes[i].geometry.dispose();
            if (meshes[i].material) meshes[i].material.dispose();
        }
        delete _overlayMeshes[name];
    }

    function clearAllOverlays() {
        for (var name in _overlayMeshes) clearOverlay(name);

        for (var _zai = 0; _zai < _zoneBorderMeshes.length; _zai++) {
            var _zam = _zoneBorderMeshes[_zai];
            if (highlightGroup) highlightGroup.remove(_zam);
            if (_zam.geometry) _zam.geometry.dispose();
            if (_zam.material) _zam.material.dispose();
        }
        _zoneBorderMeshes.length = 0;
        _zoneBorderMats.length = 0;
    }

    var _telegraphTimer = null;
    function flashTelegraph(tx, ty) {
        clearOverlay('telegraph');
        setOverlay('telegraph', [{ x: tx, y: ty }], 0xffff44, 0.45);
        if (_telegraphTimer) clearTimeout(_telegraphTimer);
        _telegraphTimer = setTimeout(function() { clearOverlay('telegraph'); _telegraphTimer = null; }, 450);
    }

    var _ghostGroup = null;
    var _ghostMat = null;

    function showGhostUnit(unit, tileX, tileY, surfaceYOverride) {
        clearGhostUnit();
        if (!highlightGroup || !unit) return;
        var ts = CONFIG.tileSize || 128;
        var surfY = (surfaceYOverride !== undefined && surfaceYOverride !== null)
            ? surfaceYOverride + 1.0
            : tileTopY(tileX, tileY) + 1.0;

        var spriteUrl = (typeof getBattleMapSpriteUrl === 'function')
            ? getBattleMapSpriteUrl(unit)
            : ((typeof getR2RaceSpriteUrl === 'function')
               ? getR2RaceSpriteUrl(unit.race, unit.gender, unit.cls) : null);
        if (!spriteUrl) return;
        var spriteTex = getTexture(spriteUrl);
        if (!spriteTex) return;

        var _nativeScale = ts / 128;
        var nw = 128, nh = 128;
        var scanData = window._spriteGroundOffsets
            ? window._spriteGroundOffsets.get(spriteUrl) : null;
        if (scanData && !scanData.scanning && scanData.nativeW > 0 && scanData.nativeH > 0) {
            nw = scanData.nativeW;
            nh = scanData.nativeH;
        } else if (spriteTex && spriteTex.image) {
            var img = spriteTex.image;
            var iw = img.naturalWidth || img.width || 0;
            var ih = img.naturalHeight || img.height || 0;
            if (iw > 0 && ih > 0) { nw = iw; nh = ih; }
        }
        var sprW = nw * _nativeScale;
        var sprH = nh * _nativeScale;

        _ghostMat = new THREE.MeshBasicMaterial({
            map: spriteTex, transparent: true, alphaTest: 0.05,
            side: THREE.DoubleSide, depthWrite: false,
            opacity: 0.45
        });

        var spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(sprW, sprH), _ghostMat);
        var bottomShift = 0;
        if (scanData && !scanData.scanning && scanData.bottomGapPct > 0) {
            bottomShift = sprH * (scanData.bottomGapPct / 100);
        }
        spriteMesh.position.y = sprH / 2 - bottomShift;
        spriteMesh._ew_billboard = true;

        _ghostGroup = new THREE.Group();
        _ghostGroup.name = 'actionPlanGhost';
        _ghostGroup.add(spriteMesh);
        _ghostGroup.position.set(tileX * ts + ts / 2, surfY, tileY * ts + ts / 2);

        highlightGroup.add(_ghostGroup);

        _bbLastCamX = NaN;
    }

    function clearGhostUnit() {
        if (_ghostGroup && highlightGroup) {
            highlightGroup.remove(_ghostGroup);

            _ghostGroup.traverse(function(child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        _ghostGroup = null;
        _ghostMat = null;
    }

    function _updateActionPlanPulse() {
        var t = performance.now() / 1000.0;
        var pulse = 0.25 + 0.3 * Math.abs(Math.sin(t * 2.5));

        if (_ghostMat) {
            _ghostMat.opacity = pulse + 0.1;
        }

        if (_ghostGroup && _arrowMeshes.length > 0) {
            var arrowPulse = 0.55 + 0.4 * Math.abs(Math.sin(t * 2.5));
            for (var i = 0; i < _arrowMeshes.length; i++) {
                var m = _arrowMeshes[i];
                if (m.material && m.material.opacity !== undefined) {

                    var baseOp = m._ew_baseOpacity;
                    if (baseOp === undefined) {
                        baseOp = m.material.opacity;
                        m._ew_baseOpacity = baseOp;
                    }
                    m.material.opacity = baseOp * arrowPulse;
                }
            }
        }
    }

    var _arrowMeshes = [];

    function drawArrow3D(fromX, fromY, toX, toY, hexColor, dashed, fromYOverride, toYOverride) {
        if (!highlightGroup) return;
        var ts = CONFIG.tileSize || 128;
        var inset = ts * 0.22;

        var torsoOff = ts * UNIT_SPRITE_SIZE_RATIO * 0.5;
        var ay = (fromYOverride !== undefined && fromYOverride !== null ? fromYOverride : tileTopY(fromX, fromY)) + torsoOff;
        var by = (toYOverride !== undefined && toYOverride !== null ? toYOverride : tileTopY(toX, toY)) + torsoOff;
        var ax = fromX * ts + ts / 2, az = fromY * ts + ts / 2;
        var bx = toX * ts + ts / 2, bz = toY * ts + ts / 2;

        var dx = bx - ax, dz = bz - az, dy = by - ay;
        var len = Math.sqrt(dx * dx + dz * dz + dy * dy);
        if (len < 2) return;
        var nx = dx / len, nz = dz / len, ny = dy / len;
        ax += nx * inset; az += nz * inset; ay += ny * inset;
        bx -= nx * inset; bz -= nz * inset; by -= ny * inset;

        var shaftLen = Math.sqrt((bx-ax)*(bx-ax) + (by-ay)*(by-ay) + (bz-az)*(bz-az));
        var shaftRad = ts * 0.025;
        var shaftGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, shaftLen, 6);
        var shaftMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.85, depthWrite: false });
        var shaft = new THREE.Mesh(shaftGeo, shaftMat);

        shaft.position.set((ax+bx)/2, (ay+by)/2, (az+bz)/2);

        var dir = new THREE.Vector3(dx, dy, dz).normalize();
        var up = new THREE.Vector3(0, 1, 0);
        var q = new THREE.Quaternion().setFromUnitVectors(up, dir);
        shaft.quaternion.copy(q);
        shaft._ew_overlay = 'arrow';
        highlightGroup.add(shaft);
        _arrowMeshes.push(shaft);

        var glowGeo = new THREE.CylinderGeometry(shaftRad * 2.5, shaftRad * 2.5, shaftLen, 6);
        var glowMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.12, depthWrite: false });
        var glowTube = new THREE.Mesh(glowGeo, glowMat);
        glowTube.position.copy(shaft.position);
        glowTube.quaternion.copy(shaft.quaternion);
        glowTube._ew_overlay = 'arrow';
        highlightGroup.add(glowTube);
        _arrowMeshes.push(glowTube);

        var headLen = Math.min(ts * 0.22, 30);
        var headRad = headLen * 0.55;
        var coneGeo = new THREE.ConeGeometry(headRad, headLen, 8);
        var coneMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.92, depthWrite: false });
        var cone = new THREE.Mesh(coneGeo, coneMat);

        cone.position.set(bx + nx * headLen * 0.4, by + ny * headLen * 0.4, bz + nz * headLen * 0.4);
        cone.quaternion.copy(q);
        cone._ew_overlay = 'arrow';
        highlightGroup.add(cone);
        _arrowMeshes.push(cone);

        var haloGeo = new THREE.ConeGeometry(headRad * 1.6, headLen * 1.2, 8);
        var haloMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.15, depthWrite: false });
        var halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(cone.position);
        halo.quaternion.copy(q);
        halo._ew_overlay = 'arrow';
        highlightGroup.add(halo);
        _arrowMeshes.push(halo);

        if (dashed && shaftLen > ts * 0.3) {
            var tickCount = Math.floor(shaftLen / (ts * 0.12));
            for (var ti = 1; ti < tickCount; ti++) {
                var frac = ti / tickCount;
                var tGeo = new THREE.SphereGeometry(shaftRad * 1.8, 4, 4);
                var tMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.5, depthWrite: false });
                var tick = new THREE.Mesh(tGeo, tMat);
                tick.position.set(
                    ax + dx * frac * (1 - inset/len),
                    ay + dy * frac * (1 - inset/len),
                    az + dz * frac * (1 - inset/len)
                );
                tick._ew_overlay = 'arrow';
                highlightGroup.add(tick);
                _arrowMeshes.push(tick);
            }
        }
    }

    function clearArrows3D() {
        for (var i = 0; i < _arrowMeshes.length; i++) {
            if (highlightGroup) highlightGroup.remove(_arrowMeshes[i]);
            if (_arrowMeshes[i].geometry) _arrowMeshes[i].geometry.dispose();
            if (_arrowMeshes[i].material) _arrowMeshes[i].material.dispose();
        }
        _arrowMeshes = [];
    }

    var _intentBadgeContainer = null;
    var _intentBadgeEls = [];
    var _projVec2 = new THREE.Vector3();

    function _ensureIntentBadgeContainer() {
        if (_intentBadgeContainer) return;
        _intentBadgeContainer = document.createElement('div');
        _intentBadgeContainer.id = 'threeIntentOverlay';
        _intentBadgeContainer.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:15;overflow:hidden;';
        if (_parentEl) _parentEl.appendChild(_intentBadgeContainer);

        if (!document.getElementById('threeIntentStyles')) {
            var style = document.createElement('style');
            style.id = 'threeIntentStyles';
            style.textContent = [
                '#threeIntentOverlay .ti-badge {',
                '  position: absolute; pointer-events: none; z-index: 15;',
                '  font-family: "DotGothic16", "JetBrains Mono", monospace;',
                '  font-weight: 900; line-height: 1; letter-spacing: 0.02em;',
                '  white-space: nowrap; transform: translate(-50%, -100%);',
                '  text-shadow: 0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5);',
                '  animation: tiBadgeFadeIn 0.15s ease-out forwards;',
                '}',
                '.ti-damage { color: #ff5555; font-size: 18px; text-shadow: 0 1px 4px rgba(255,40,40,0.7), 0 0 10px rgba(255,0,0,0.4); }',
                '.ti-heal { color: #44ee66; font-size: 18px; text-shadow: 0 1px 4px rgba(40,220,80,0.7), 0 0 10px rgba(0,200,60,0.4); }',
                '.ti-shield { color: #55aaff; font-size: 14px; text-shadow: 0 1px 4px rgba(40,120,255,0.7); }',
                '.ti-status { font-size: 11px; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.2); color: #ffcc44; }',
                '.ti-status.ti-debuff { color: #ff8844; border-color: rgba(255,120,40,0.4); }',
                '.ti-status.ti-buff { color: #55ccff; border-color: rgba(80,180,255,0.4); }',
                '.ti-type-eff { font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 3px; background: rgba(0,0,0,0.65); }',
                '.ti-type-eff.super-effective { color: #ff6644; border: 1px solid rgba(255,80,40,0.5); }',
                '.ti-type-eff.not-effective { color: #7799bb; border: 1px solid rgba(100,140,180,0.4); }',
                '.ti-type-eff.stab { color: #ffdd55; border: 1px solid rgba(255,200,60,0.4); }',
                '.ti-kill { font-size: 12px; font-weight: 900; color: #ff3333; text-shadow: 0 0 8px rgba(255,0,0,0.8), 0 0 16px rgba(255,0,0,0.4); }',
                '@keyframes tiBadgeFadeIn { from { opacity: 0; } to { opacity: 1; } }'
            ].join('\n');
            document.head.appendChild(style);
        }
    }

    function worldToScreen(tileX, tileY, yOffset) {
        var cam = ThreeCamera.getCamera();
        if (!cam || !canvas) return null;
        var ts = CONFIG.tileSize || 128;
        var wx = tileX * ts + ts / 2;
        var wy = tileTopY(tileX, tileY) + (yOffset || 0);
        var wz = tileY * ts + ts / 2;
        _projVec2.set(wx, wy, wz);
        _projVec2.project(cam);
        if (_projVec2.z > 1) return null;
        var cw = canvas.clientWidth, ch = canvas.clientHeight;
        return {
            x: ((_projVec2.x + 1) / 2) * cw,
            y: ((1 - _projVec2.y) / 2) * ch,
            visible: true
        };
    }

    function showIntentBadges(tileX, tileY, badges) {
        if (!badges || !badges.length) return;
        _ensureIntentBadgeContainer();
        var cam = ThreeCamera.getCamera();
        if (!cam || !canvas) return;
        var ts = CONFIG.tileSize || 128;

        var ue = null;
        var unitOnTile = state.units ? state.units.find(function(u) { return !u.dead && u.x === tileX && u.y === tileY; }) : null;
        if (unitOnTile) ue = unitEntries.get(unitOnTile.id);
        var spriteTopY;
        if (ue && ue.group._ew_spriteTopY) {
            spriteTopY = ue.group._ew_spriteTopY;
        } else {
            spriteTopY = tileTopY(tileX, tileY) + ts * 0.6;
        }

        _projVec2.set(tileX * ts + ts / 2, spriteTopY, tileY * ts + ts / 2);
        _projVec2.project(cam);
        if (_projVec2.z > 1) return;
        var cw = canvas.clientWidth, ch = canvas.clientHeight;
        var sx = ((_projVec2.x + 1) / 2) * cw;
        var sy = ((1 - _projVec2.y) / 2) * ch;

        for (var i = 0; i < badges.length; i++) {
            var b = badges[i];
            var el = document.createElement('div');
            el.className = 'ti-badge ' + b.cls;
            el.innerHTML = b.html;
            el.style.left = sx + 'px';
            el.style.top = (sy - 4 - b.yOff * 1.2) + 'px';
            _intentBadgeContainer.appendChild(el);
            _intentBadgeEls.push(el);
        }
    }

    function clearIntentBadges() {
        for (var i = 0; i < _intentBadgeEls.length; i++) _intentBadgeEls[i].remove();
        _intentBadgeEls = [];
    }

    function _computeHlKey() {
        if (!state.selectedUnitId || !state.actionMode || state.phase !== 'battle' || state._actionExecuting) return '';
        var sel = (function(){ var _u = _unitById.get(state.selectedUnitId); return (_u && !_u.dead) ? _u : null; })();
        if (!sel) return '';

        if (window._ewHlCache && window._ewHlCache.key) return window._ewHlCache.key;
        return state.selectedUnitId+'|'+state.actionMode+'|'+(state.selectedTool||'')+'|'+sel.x+','+sel.y+'|'+(sel.z||0)+'|'+state.activePlayer+'|'+state.round+'|'+(state.actionMenuView||'');
    }

    function updateHoverHighlight(tx, ty) {
        if (tx === _lastHoverX && ty === _lastHoverY) return;
        _lastHoverX = tx; _lastHoverY = ty;
        if (!highlightGroup) return;
        if (hoverMesh) { highlightGroup.remove(hoverMesh); hoverMesh.geometry.dispose(); hoverMesh.material.dispose(); hoverMesh = null; }
        if (tx < 0 || ty < 0) return;
        var ts = CONFIG.tileSize || 128, topY = tileTopY(tx, ty) + 0.5;
        var hMat = _makeHlMaterial(0xffffff, 0.25, 0.3, 0);
        hoverMesh = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.95, ts * 0.95), hMat);
        hoverMesh.rotation.x = -Math.PI / 2;
        hoverMesh.position.set(tx*ts+ts/2, topY, ty*ts+ts/2);
        highlightGroup.add(hoverMesh);
    }

    function _updateUnitHover(unitId) {
        if (unitId === _hoveredUnitId) return;
        _clearUnitHover();
        _hoveredUnitId = unitId;
        if (unitId == null) {
            if (canvas) canvas.style.cursor = '';
            return;
        }
        if (canvas) canvas.style.cursor = 'pointer';

        var entry = unitEntries.get(unitId);
        if (!entry || !entry.group) return;
        var ts = CONFIG.tileSize || 128;
        _hoverGlowMesh = new THREE.Mesh(
            new THREE.RingGeometry(ts * 0.42, ts * 0.56, 32),
            _makeRingMaterial(0xffffff, 0.9, 0.0)
        );
        _hoverGlowMesh.rotation.x = -Math.PI / 2;
        _hoverGlowMesh.position.y = SELECTED_RING_OFFSET + 0.4;
        _hoverGlowMesh._ew_hoverGlow = true;
        entry.group.add(_hoverGlowMesh);
    }
    function _clearUnitHover() {
        if (_hoverGlowMesh) {
            if (_hoverGlowMesh.parent) _hoverGlowMesh.parent.remove(_hoverGlowMesh);
            _hoverGlowMesh.geometry.dispose();
            _hoverGlowMesh.material.dispose();
            _hoverGlowMesh = null;
        }
        _hoveredUnitId = null;
    }

    function _updateUnitHoverPulse() {

    }

    var _selChevronMesh = null;
    var _selChevronUnitId = null;
    var _chevronVec = new THREE.Vector3();

    function _buildSelectionChevron(ts) {

        var w = ts * 0.32;
        var h = ts * 0.18;
        var t = ts * 0.05;
        var shape = new THREE.Shape();

        shape.moveTo(-w, h);
        shape.lineTo(0, 0);
        shape.lineTo(w, h);

        shape.lineTo(w - t, h);
        shape.lineTo(0, t);
        shape.lineTo(-w + t, h);
        shape.closePath();
        var geom = new THREE.ShapeGeometry(shape);
        var mat = new THREE.MeshBasicMaterial({
            color: 0xffcc00, transparent: true, opacity: 0.95,
            side: THREE.DoubleSide, depthWrite: false
        });
        var mesh = new THREE.Mesh(geom, mat);
        mesh._ew_billboard = true;
        return mesh;
    }

    function _syncSelectionIndicator() {
        var selId = state.selectedUnitId;
        var ue = selId != null ? unitEntries.get(selId) : null;

        if (_selChevronMesh && (_selChevronUnitId !== selId || !ue)) {
            if (_selChevronMesh.parent) _selChevronMesh.parent.remove(_selChevronMesh);
            if (_selChevronMesh.geometry) _selChevronMesh.geometry.dispose();
            if (_selChevronMesh.material) _selChevronMesh.material.dispose();
            _selChevronMesh = null;
            _selChevronUnitId = null;
        }

        if (!ue || selId == null) return;

        if (!_selChevronMesh) {
            var ts = CONFIG.tileSize || 128;
            _selChevronMesh = _buildSelectionChevron(ts);
            _selChevronUnitId = selId;
            ue.group.add(_selChevronMesh);
        }

        if (_selChevronMesh.parent !== ue.group) {
            if (_selChevronMesh.parent) _selChevronMesh.parent.remove(_selChevronMesh);
            ue.group.add(_selChevronMesh);
        }

        var topY = ue.group._ew_spriteTopY ? (ue.group._ew_spriteTopY - ue.group.position.y) : ((CONFIG.tileSize || 128) * 0.85);
        var bobOffset = Math.sin(performance.now() * 0.003) * 4;

        /* Plate anchor is at topY + 12 in local coords; plate grows upward ~75px
           in screen space (fixed size due to MIN_PLATE_SCALE clamping).
           Convert that screen height to world units so the chevron clears it. */
        var chevY = topY + 65; // fallback
        var cam = ThreeCamera.getCamera();
        if (cam && _parentEl) {
            var screenH = _parentEl.clientHeight || 540;
            var fovRad = cam.fov * Math.PI / 180;
            var halfTanFov = Math.tan(fovRad / 2);
            ue.group.getWorldPosition(_chevronVec);
            var dist = _chevronVec.distanceTo(cam.position);
            if (dist < 1) dist = 1;
            var plateWorldH = 75 * (2 * dist * halfTanFov) / screenH;
            chevY = topY + 12 + plateWorldH + 10;

            /* scale chevron inversely so it stays constant screen size */
            var cScale = Math.max(1, dist / 800);
            _selChevronMesh.scale.setScalar(cScale);
        }
        _selChevronMesh.position.y = chevY + bobOffset;

        var pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.004);
        _selChevronMesh.material.opacity = pulse;
    }

    var _lastActivePlateId = null;

    function _syncActivePlateClass() {
        var blitzUnit = (typeof getBlitzTurnUnit === 'function') ? getBlitzTurnUnit() : null;
        var activeId = blitzUnit ? blitzUnit.id : null;

        if (activeId === _lastActivePlateId) return;

        if (_lastActivePlateId != null) {
            var oldPo = _plateObjs.get(_lastActivePlateId);
            if (oldPo && oldPo.el) oldPo.el.classList.remove('tp-active');
        }

        if (activeId != null) {
            var newPo = _plateObjs.get(activeId);
            if (newPo && newPo.el) newPo.el.classList.add('tp-active');
        }
        _lastActivePlateId = activeId;
    }

    function _updateExhaustedRingDim() {
        for (var entry of unitEntries) {
            var uid = entry[0], ue = entry[1];
            var unit = null;
            if (state.units) {
                for (var i = 0; i < state.units.length; i++) {
                    if (state.units[i].id === uid) { unit = state.units[i]; break; }
                }
            }
            if (!unit) continue;
            var exhausted = unit.ap <= 0;

            for (var ci = 0; ci < ue.group.children.length; ci++) {
                var child = ue.group.children[ci];
                if (child.geometry && child.geometry.type === 'RingGeometry' && child.material) {

                    var isSelRing = (child.material.color && child.material.color.getHex() === 0xffcc00);
                    if (isSelRing) continue;

                    var targetOp = exhausted ? 0.3 : (child.material._ew_baseOpacity || child.material.opacity);

                    if (child.material._ew_baseOpacity == null) {
                        child.material._ew_baseOpacity = child.material.opacity;
                    }
                    if (exhausted) {
                        child.material.opacity = 0.3;

                    } else {
                        child.material.opacity = child.material._ew_baseOpacity;
                    }
                }
            }
        }
    }

    function _computeFogVisibleKey() {
        if (!state.fogOfWar) return 'off';
        var vp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
        var vis = (typeof computeVisibleTiles === 'function') ? computeVisibleTiles(vp) : null;
        if (!vis || vis.size === 0) return 'empty';
        _fogVisibleSet = vis;

        var h = 0x811c9dc5 | 0;
        vis.forEach(function(pk) {
            for (var i = 0, n = pk.length; i < n; i++) {
                h = Math.imul(h ^ pk.charCodeAt(i), 16777619);
            }
            h = Math.imul(h ^ 44, 16777619);
        });
        return 'v' + vp + '_' + (h >>> 0);
    }

    function _fogIsEdgeTile(x, y, visible) {

        for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (visible.has((x + dx) + ',' + (y + dy))) return true;
            }
        }
        return false;
    }

    var _fogCoreMat = null;
    var _fogEdgeMat = null;

    function _ensureFogMats() {
        if (!_fogCoreMat) {
            _fogCoreMat = new THREE.LineBasicMaterial({
                color: FOG_COLOR_CORE, transparent: true,
                opacity: FOG_LINE_OPACITY, depthWrite: false
            });
            _fogCoreMat._ew_shared = true;
        }
        if (!_fogEdgeMat) {
            _fogEdgeMat = new THREE.LineBasicMaterial({
                color: FOG_COLOR_EDGE, transparent: true,
                opacity: FOG_EDGE_LINE_OPACITY, depthWrite: false
            });
            _fogEdgeMat._ew_shared = true;
        }
    }

    function _buildFogCube(x, y, ts, isEdge, topY) {

        var elevStep = ts * ELEV_STEP_RATIO;
        var doubleStep = elevStep * 2;
        var topExtension = ts * (isEdge ? FOG_EDGE_HEIGHT_RATIO : FOG_CUBE_HEIGHT_RATIO);
        var totalH = topY + topExtension;

        var totalLevels = Math.max(1, Math.round(totalH / elevStep));

        var group = new THREE.Group();
        _ensureFogMats();
        var lineMat = isEdge ? _fogEdgeMat : _fogCoreMat;

        var curY = 0;
        if (totalLevels <= 1) {

            var edgesGeo = _getFogEdgesGeo(ts, elevStep);
            var wire = new THREE.LineSegments(edgesGeo, lineMat);
            wire.position.set(0, elevStep / 2, 0);
            group.add(wire);
        } else {

            var topSlabBase = (totalLevels - 1) * elevStep;

            var bodyLevels = totalLevels - 1;
            var doubleCount = Math.floor(bodyLevels / 2);
            var oddBody = bodyLevels % 2;

            var dGeo = _getFogEdgesGeo(ts, doubleStep);
            for (var i = 0; i < doubleCount; i++) {
                var wire = new THREE.LineSegments(dGeo, lineMat);
                wire.position.set(0, curY + doubleStep / 2, 0);
                group.add(wire);
                curY += doubleStep;
            }

            if (oddBody) {
                var sGeo = _getFogEdgesGeo(ts, elevStep);
                var wire = new THREE.LineSegments(sGeo, lineMat);
                wire.position.set(0, curY + elevStep / 2, 0);
                group.add(wire);
                curY += elevStep;
            }

            var tGeo = _getFogEdgesGeo(ts, elevStep);
            var wire = new THREE.LineSegments(tGeo, lineMat);
            wire.position.set(0, curY + elevStep / 2, 0);
            group.add(wire);
        }

        group.position.set(x * ts + ts / 2, 0, y * ts + ts / 2);

        return {
            group: group,
            wireframes: group.children,
            isEdge: isEdge,
            tileX: x,
            tileY: y,
            lineMat: lineMat
        };
    }

    function rebuildFog() {
        if (!fogGroup) return;
        _clearGroup(fogGroup);
        _fogMeshes.clear();
        _clearFogEdgesCache();

        if (!state.fogOfWar) {
            _fogVisibleKey = 'off';

            _applyFogVisibility(new Set());
            return;
        }

        var ts = CONFIG.tileSize || 128;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;

        var vp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
        var visible = (typeof computeVisibleTiles === 'function') ? computeVisibleTiles(vp) : new Set();
        _fogVisibleSet = visible;

        for (var y = 0; y < _bh; y++) {
            for (var x = 0; x < _bw; x++) {
                var pk = x + ',' + y;
                if (visible.has(pk)) continue;

                var topY = tileTopY(x, y);
                var isEdge = _fogIsEdgeTile(x, y, visible);
                var entry = _buildFogCube(x, y, ts, isEdge, topY);

                fogGroup.add(entry.group);
                _fogMeshes.set(pk, entry);
            }
        }

        _applyFogVisibility(visible);

        _fogVisibleKey = _computeFogVisibleKey();
    }

    /* Hide enemy units that are concealed from the viewer (Invisible status or
       inside an enemy smoke screen). Runs whether fog is on or off, so cloaked
       enemies never render on the player's screen. */
    function _viewerPlayerNum() {
        return (typeof getViewerPlayer === 'function') ? getViewerPlayer()
             : (window._NET && window._NET.online && window._NET.myPlayer) ? window._NET.myPlayer : 1;
    }
    function _isConcealedFromViewer(unit, vp) {
        if (!unit || unit.dead || unit.player === vp) return false;
        if (window.GAME && typeof window.GAME.isUnitConcealedFrom === 'function') {
            try { return window.GAME.isUnitConcealedFrom(unit, vp); } catch (e) { return false; }
        }
        return false;
    }
    /* Recompute enemy unit + plate visibility from (fog base) AND (not concealed).
       Cheap — only a handful of units — so it runs every frame, which keeps cloak
       and reveal instantaneous even when fog of war is off or _objDirty is unset. */
    function _ownUnitInvisible(unit) {
        try {
            if (typeof unitHasStatus === 'function') return !!unitHasStatus(unit, 'invisible');
            if (window.GAME && typeof window.GAME.unitHasStatus === 'function') return !!window.GAME.unitHasStatus(unit, 'invisible');
        } catch (e) {}
        return false;
    }
    /* Dim/restore a unit entry's sprite billboards (leaves the team ring/plate at
       full strength so the cloaked unit is still easy to find and select). */
    function _setEntrySpriteOpacity(entry, op) {
        if (!entry || !entry.group) return;
        entry.group.traverse(function(o) {
            if (o.isMesh && o._ew_billboard && o.material) {
                if (o.material._ew_baseOpacity === undefined) {
                    o.material._ew_baseOpacity = (o.material.opacity !== undefined) ? o.material.opacity : 1;
                }
                o.material.transparent = true;
                o.material.opacity = (op < 1) ? op : o.material._ew_baseOpacity;
            }
        });
    }
    function _updateEnemyConcealment() {
        if (typeof state === 'undefined' || state.phase !== 'battle') return;
        var vp = _viewerPlayerNum();
        var fog = !!state.fogOfWar;
        unitEntries.forEach(function(entry, uid) {
            var unit = _unitById.get(uid) || null;
            if (!unit || unit.dead) return;
            if (unit.player === vp) {
                /* The viewer's own cloaked units stay on screen but turn ghostly so
                   the player can tell the Invisible buff is actually active. */
                _setEntrySpriteOpacity(entry, _ownUnitInvisible(unit) ? INVIS_OWN_OPACITY : 1);
                return;
            }
            var base = !fog || (_fogVisibleSet && _fogVisibleSet.has(unit.x + ',' + unit.y));
            entry.group.visible = base && !_isConcealedFromViewer(unit, vp);
        });
        _plateObjs.forEach(function(po, uid) {
            var unit = _unitById.get(uid) || null;
            if (!unit || unit.dead || unit.player === vp) return;
            var base = !fog || (_fogVisibleSet && _fogVisibleSet.has(unit.x + ',' + unit.y));
            po.css2d.visible = base && !_isConcealedFromViewer(unit, vp);
        });
    }
    function _applyConcealment(vp) { _updateEnemyConcealment(); }

    function _applyFogVisibility(visible) {
        if (!state.fogOfWar) {

            tileMeshes.forEach(function(mesh) { mesh.visible = true; });
            objectMeshes.forEach(function(mesh) { mesh.visible = true; });
            unitEntries.forEach(function(entry) { entry.group.visible = true; });
            deployableMeshes.forEach(function(mesh) { mesh.visible = true; });
            turretMeshes.forEach(function(mesh) { mesh.visible = true; });
            _plateObjs.forEach(function(po) { po.css2d.visible = true; });
            /* Show all terrain decorations when fog is off */
            if (_terrainDecoGroup) {
                for (var di = 0; di < _terrainDecoGroup.children.length; di++) {
                    _terrainDecoGroup.children[di].visible = true;
                }
            }
            _applyConcealment(_viewerPlayerNum());
            return;
        }

        tileMeshes.forEach(function(mesh, pk) {
            mesh.visible = visible.has(pk);
        });

        objectMeshes.forEach(function(mesh, pk) {
            mesh.visible = visible.has(pk);
        });

        /* Hide terrain decorations (rocks, crystals) in fog */
        if (_terrainDecoGroup) {
            for (var di = 0; di < _terrainDecoGroup.children.length; di++) {
                var deco = _terrainDecoGroup.children[di];
                if (deco._ew_decoX !== undefined && deco._ew_decoY !== undefined) {
                    deco.visible = visible.has(deco._ew_decoX + ',' + deco._ew_decoY);
                }
            }
        }

        var vp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
        deployableMeshes.forEach(function(mesh) {
            var dx = mesh._ew_depX, dy = mesh._ew_depY;
            if (dx !== undefined && dy !== undefined) {
                mesh.visible = visible.has(dx + ',' + dy);
            }
        });

        if (state.turrets) {
            turretMeshes.forEach(function(mesh, tid) {
                var turret = state.turrets.find(function(t) { return t.id === tid; });
                if (!turret) return;
                var tpk = turret.x + ',' + turret.y;
                if (turret.player === vp) {
                    mesh.visible = true;
                } else {
                    mesh.visible = visible.has(tpk);
                }
            });
        }

        unitEntries.forEach(function(entry, uid) {
            var unit = _unitById.get(uid) || null;
            if (!unit || unit.dead) return;
            var upk = unit.x + ',' + unit.y;
            if (unit.player === vp) {
                entry.group.visible = true;
            } else {
                entry.group.visible = visible.has(upk);
            }
        });

        _plateObjs.forEach(function(po, uid) {
            var unit = _unitById.get(uid) || null;
            if (!unit) { po.css2d.visible = false; return; }
            var upk = unit.x + ',' + unit.y;
            if (unit.player === vp) {
                po.css2d.visible = true;
            } else {
                po.css2d.visible = visible.has(upk);
            }
        });

        _applyConcealment(vp);
    }

    function _updateFogPulse() {
        if (!state.fogOfWar || !fogGroup || _fogMeshes.size === 0) {

            if (state.fogOfWar === false && _fogVisibleKey !== 'off') {
                _fogVisibleKey = 'off';
                rebuildFog();
            }
            return;
        }

        var now = performance.now() / 1000;
        var dt = Math.min(now - (_fogLastTime || now), 0.05);
        _fogLastTime = now;
        _fogPulseTime += dt;

        if (!_fogLastCheckTime || (now - _fogLastCheckTime) > 0.2) {
            _fogLastCheckTime = now;
            var newKey = _computeFogVisibleKey();
            if (newKey !== _fogVisibleKey) {
                _fogVisibleKey = newKey;
                rebuildFog();
                return;
            }
        }

        var pulse = Math.sin(_fogPulseTime * FOG_PULSE_SPEED * Math.PI * 2);
        var pulseVal = pulse * FOG_PULSE_AMP;

        if (_fogCoreMat) _fogCoreMat.opacity = Math.max(0.05, FOG_LINE_OPACITY + pulseVal);
        if (_fogEdgeMat) _fogEdgeMat.opacity = Math.max(0.05, FOG_EDGE_LINE_OPACITY + pulseVal);
    }

    function _updateBatSwarms() {
        if (!unitGroup) return;
        var now = performance.now() / 1000;
        for (var j = 0; j < unitGroup.children.length; j++) {
            var g = unitGroup.children[j];
            if (!g._ew_isBatSwarm) continue;

            for (var k = 0; k < g.children.length; k++) {
                var swarm = g.children[k];
                if (!swarm._ew_batSwarm) continue;
                for (var b = 0; b < swarm.children.length; b++) {
                    var bat = swarm.children[b];
                    var s = bat._ew_batSeed;
                    if (!s) continue;
                    var angle = s.orbitAngle + now * s.orbitSpeed;
                    var bob = Math.sin(now * s.bobSpeed + s.bobPhase) * s.bobAmp;
                    bat.position.set(
                        Math.cos(angle) * s.orbitRadius,
                        s.heightOffset + bob,
                        Math.sin(angle) * s.orbitRadius
                    );
                }
                break;
            }
        }
    }

    function _updateFlyingBob() {
        if (!unitGroup) return;
        var now = performance.now() / 1000;
        var hasFly = (typeof canFly === 'function' && typeof isUnitAirborne === 'function');
        if (!hasFly) return;
        for (var j = 0; j < unitGroup.children.length; j++) {
            var g = unitGroup.children[j];
            var uid = g._ew_unitId;
            if (!uid) continue;

            if (_walkTweens.has(uid) || _displaceTweens.has(uid) || _jumpTweens.has(uid)
                || _strikeTweens.has(uid) || _deathTweens.has(uid)) continue;
            var unit = _findUnit(uid);
            if (!unit || unit.dead) continue;
            if (!canFly(unit) || !isUnitAirborne(unit)) {

                if (g._ew_bobActive) {
                    var sinkG = _getSubmersionDepth(unit) * ((CONFIG.tileSize || 128) * UNIT_SPRITE_SIZE_RATIO);
                    g.position.y = unitSurfaceY(unit) - sinkG;
                    g._ew_spriteTopY = unitSurfaceY(unit) + (CONFIG.tileSize || 128) * UNIT_SPRITE_SIZE_RATIO + 4;
                    g._ew_bobActive = false;
                }
                continue;
            }

            var h = 0;
            var idStr = String(uid);
            for (var c = 0; c < idStr.length; c++) h = (h * 31 + idStr.charCodeAt(c)) | 0;
            var phase = (Math.abs(h) % 1000) * 0.00637;
            var bob = Math.sin(now * FLY_BOB_SPEED * Math.PI * 2 + phase) * FLY_BOB_AMP;
            var baseY = unitSurfaceY(unit);
            g.position.y = baseY + bob;
            g._ew_spriteTopY = baseY + bob + (CONFIG.tileSize || 128) * UNIT_SPRITE_SIZE_RATIO + 4;
            g._ew_bobActive = true;
        }
    }

    var _bbLastCamX = NaN, _bbLastCamZ = NaN;

    function _updateBillboards() {
        var cam = ThreeCamera.getCamera();
        if (!cam) return;

        var cx = cam.position.x, cz = cam.position.z;
        if (cx === _bbLastCamX && cz === _bbLastCamZ) return;
        _bbLastCamX = cx; _bbLastCamZ = cz;

        if (objectGroup) { for (var i = 0; i < objectGroup.children.length; i++) { var c = objectGroup.children[i]; if (c._ew_billboard) { c.rotation.y = Math.atan2(cx - c.position.x, cz - c.position.z); } } }

        if (unitGroup) { for (var j = 0; j < unitGroup.children.length; j++) { var g = unitGroup.children[j]; if (!g.children) continue; for (var k = 0; k < g.children.length; k++) { var ch = g.children[k]; if (ch._ew_billboard) { ch.rotation.y = Math.atan2(cx - g.position.x, cz - g.position.z); } else if (ch._ew_batSwarm && ch.children) { for (var b = 0; b < ch.children.length; b++) { var bat = ch.children[b]; if (bat._ew_billboard) { bat.getWorldPosition(_batWorldVec); bat.rotation.y = Math.atan2(cx - _batWorldVec.x, cz - _batWorldVec.z); } } } } } }

        if (scene) { for (var s = 0; s < scene.children.length; s++) { var sg = scene.children[s]; if (sg.name === 'wardLights' && sg.children) { for (var w = 0; w < sg.children.length; w++) { var wc = sg.children[w]; if (wc._ew_billboard) { wc.rotation.y = Math.atan2(cx - wc.position.x, cz - wc.position.z); } } } } }

        if (_ghostGroup && _ghostGroup.children) { for (var gi = 0; gi < _ghostGroup.children.length; gi++) { var gc = _ghostGroup.children[gi]; if (gc._ew_billboard) { gc.rotation.y = Math.atan2(cx - _ghostGroup.position.x, cz - _ghostGroup.position.z); } } }
    }

    function _easeInOut(t) {
        return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
    }

    function _easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function _getUnitEntry(unitId) {
        return unitEntries.get(unitId) || null;
    }

    function _unitRestPos(unit) {
        var ts = CONFIG.tileSize || 128;
        var sy = unitSurfaceY(unit);
        var sink = _getSubmersionDepth(unit) * (ts * UNIT_SPRITE_SIZE_RATIO);
        return { x: unit.x * ts + ts / 2, y: sy - sink, z: unit.y * ts + ts / 2 };
    }

    function startWalkTween(unit, path, onDone) {
        if (!path || !path.length) { if (onDone) onDone(); return; }
        var fullPath = [{ x: unit.x, y: unit.y, z: unit.z || 0 }].concat(path);
        var stepMs = Math.max(140, Math.min(220, 200 - path.length * 5));
        var _isFlying = (typeof canFly === 'function' && typeof isUnitAirborne === 'function')
            ? (canFly(unit) && isUnitAirborne(unit)) : false;
        _walkTweens.set(unit.id, {
            path: fullPath,
            stepIdx: 0,
            stepStart: performance.now(),
            stepMs: stepMs,
            isFlying: _isFlying,
            onDone: onDone || null
        });

        var entry = _getUnitEntry(unit.id);
        if (entry && entry.group) entry.group.visible = false;
        var plate = _plateObjs.get(unit.id);
        if (plate) plate.css2d.visible = false;
    }

    function _updateWalkTweens() {
        var now = performance.now();
        var ts = CONFIG.tileSize || 128;
        var toRemove = [];

        var _wkVp = (state.fogOfWar && typeof getViewerPlayer === 'function') ? getViewerPlayer() : 0;
        for (var entry of _walkTweens) {
            var uid = entry[0], tw = entry[1];
            var elapsed = now - tw.stepStart;
            var t = Math.min(elapsed / tw.stepMs, 1);
            var ease = _easeInOut(t);

            var from = tw.path[tw.stepIdx];
            var to = tw.path[Math.min(tw.stepIdx + 1, tw.path.length - 1)];
            var fromY = _tileSurfaceY(from.x, from.y, from.z);
            var toY = _tileSurfaceY(to.x, to.y, to.z);

            var wx = (from.x + (to.x - from.x) * ease) * ts + ts / 2;
            var wy = fromY + (toY - fromY) * ease;
            var wz = (from.y + (to.y - from.y) * ease) * ts + ts / 2;

            if (tw.isFlying) wy += Math.sin(now * 0.003) * 3;

            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {

                var _wkVisible = true;
                if (_wkVp && _fogVisibleSet) {
                    var _wkUnit = _unitById.get(uid);
                    if (_wkUnit && _wkUnit.player !== _wkVp) {

                        var _wkTileX = Math.round(from.x + (to.x - from.x) * ease);
                        var _wkTileY = Math.round(from.y + (to.y - from.y) * ease);
                        _wkVisible = _fogVisibleSet.has(_wkTileX + ',' + _wkTileY);
                    }
                }
                ue.group.visible = _wkVisible;

                _updateSubmersionClip(ue, to.x, to.y, toY, ts);
                var sink = ue.group._ew_subSink || 0;
                ue.group.position.set(wx, wy - sink, wz);
                ue.group._ew_spriteTopY = wy + (ts * UNIT_SPRITE_SIZE_RATIO) + 4;
            }

            if (t >= 1) {
                tw.stepIdx++;
                tw.stepStart = now;
                if (tw.stepIdx >= tw.path.length - 1) {

                    var final = tw.path[tw.path.length - 1];
                    if (ue && ue.group) {
                        var fy = _tileSurfaceY(final.x, final.y, final.z);
                        var fSink = ue.group._ew_subSink || 0;
                        ue.group.position.set(final.x * ts + ts / 2, fy - fSink, final.y * ts + ts / 2);
                        ue.group._ew_spriteTopY = fy + (ts * UNIT_SPRITE_SIZE_RATIO) + 4;
                    }
                    toRemove.push(uid);
                    if (tw.onDone) tw.onDone();
                }
            }
        }
        for (var r = 0; r < toRemove.length; r++) _walkTweens.delete(toRemove[r]);
    }

    function _tileSurfaceY(tx, ty, tz) {
        var ts = CONFIG.tileSize || 128;
        var z = tz;
        if (z === undefined || z === null) {
            z = (typeof getHeightAt === 'function') ? getHeightAt(tx, ty) : 0;
        }
        return z * ts * ELEV_STEP_RATIO;
    }

    function startDisplaceTween(unit, fromX, fromY, toX, toY, durationMs) {
        var fromZ = unit.z || 0;
        var toZ = (typeof getHeightAt === 'function') ? getHeightAt(toX, toY) : 0;
        // Scale the slide with travel distance so multi-tile dashes / knockbacks
        // read as a real glide instead of snapping. The caller's duration acts as
        // a per-move floor (short 1-tile shoves stay punchy).
        var _dpDist = Math.abs(toX - fromX) + Math.abs(toY - fromY);
        var _dpScaled = Math.max(_dpDist, 1) * 110;
        var _dpDur = Math.max(durationMs || 0, _dpScaled, 200);
        _displaceTweens.set(unit.id, {
            fromX: fromX, fromY: fromY, fromZ: fromZ,
            toX: toX, toY: toY, toZ: toZ,
            startTime: performance.now(),
            durationMs: _dpDur
        });

        var entry = _getUnitEntry(unit.id);
        if (entry && entry.group) entry.group.visible = true;
    }

    function _updateDisplaceTweens() {
        var now = performance.now();
        var ts = CONFIG.tileSize || 128;
        var toRemove = [];
        var _dpVp = (state.fogOfWar && typeof getViewerPlayer === 'function') ? getViewerPlayer() : 0;
        for (var entry of _displaceTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var ease = _easeOut(t);
            var fromSY = _tileSurfaceY(tw.fromX, tw.fromY, tw.fromZ);
            var toSY = _tileSurfaceY(tw.toX, tw.toY, tw.toZ);
            var wx = (tw.fromX + (tw.toX - tw.fromX) * ease) * ts + ts / 2;
            var wy = fromSY + (toSY - fromSY) * ease;
            var wz = (tw.fromY + (tw.toY - tw.fromY) * ease) * ts + ts / 2;
            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {

                var _dpVisible = true;
                if (_dpVp && _fogVisibleSet) {
                    var _dpUnit = _unitById.get(uid);
                    if (_dpUnit && _dpUnit.player !== _dpVp) {
                        _dpVisible = _fogVisibleSet.has(tw.fromX + ',' + tw.fromY)
                            || _fogVisibleSet.has(tw.toX + ',' + tw.toY);
                    }
                }
                ue.group.visible = _dpVisible;
                _updateSubmersionClip(ue, tw.toX, tw.toY, toSY, ts);
                var sink = ue.group._ew_subSink || 0;
                ue.group.position.set(wx, wy - sink, wz);
                ue.group._ew_spriteTopY = wy + (ts * UNIT_SPRITE_SIZE_RATIO) + 4;
            }
            if (t >= 1) toRemove.push(uid);
        }
        for (var r = 0; r < toRemove.length; r++) _displaceTweens.delete(toRemove[r]);
    }

    function startJumpTween(unit, fromX, fromY, toX, toY, fromZ, toZ, durationMs) {
        var ts = CONFIG.tileSize || 128;
        var dist = Math.abs(toX - fromX) + Math.abs(toY - fromY);
        var hDelta = Math.abs((toZ || 0) - (fromZ || 0));
        var arcPeak = Math.max(ts * 0.6, ts * 0.35 * dist + hDelta * 12);
        _jumpTweens.set(unit.id, {
            fromX: fromX, fromY: fromY, fromZ: fromZ || 0,
            toX: toX, toY: toY, toZ: toZ || 0,
            startTime: performance.now(),
            durationMs: durationMs || 480,
            arcPeak: arcPeak
        });
        var entry = _getUnitEntry(unit.id);
        if (entry && entry.group) entry.group.visible = true;
    }

    function _updateJumpTweens() {
        var now = performance.now();
        var ts = CONFIG.tileSize || 128;
        var toRemove = [];
        var _jpVp = (state.fogOfWar && typeof getViewerPlayer === 'function') ? getViewerPlayer() : 0;
        for (var entry of _jumpTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var ease = _easeInOut(t);
            var fromSY = _tileSurfaceY(tw.fromX, tw.fromY, tw.fromZ);
            var toSY = _tileSurfaceY(tw.toX, tw.toY, tw.toZ);

            var wx = (tw.fromX + (tw.toX - tw.fromX) * ease) * ts + ts / 2;
            var baseY = fromSY + (toSY - fromSY) * ease;
            var arc = tw.arcPeak * 4 * t * (1 - t);
            var wy = baseY + arc;
            var wz = (tw.fromY + (tw.toY - tw.fromY) * ease) * ts + ts / 2;

            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {

                var _jpVisible = true;
                if (_jpVp && _fogVisibleSet) {
                    var _jpUnit = _unitById.get(uid);
                    if (_jpUnit && _jpUnit.player !== _jpVp) {
                        _jpVisible = _fogVisibleSet.has(tw.fromX + ',' + tw.fromY)
                            || _fogVisibleSet.has(tw.toX + ',' + tw.toY);
                    }
                }
                ue.group.visible = _jpVisible;
                ue.group.position.set(wx, wy, wz);
                ue.group._ew_spriteTopY = wy + (ts * UNIT_SPRITE_SIZE_RATIO) + 4;

                var spriteMesh = ue.sprite;
                if (spriteMesh) {
                    var stretch = 1 + 0.12 * Math.sin(t * Math.PI);
                    var squash = 1 - 0.08 * Math.sin(t * Math.PI);
                    spriteMesh.scale.set(squash, stretch, 1);
                }
            }

            if (t >= 1) {

                if (ue && ue.sprite) ue.sprite.scale.set(1, 1, 1);

                if (ue) _updateSubmersionClip(ue, tw.toX, tw.toY, toSY, ts);
                if (ue && ue.group) {
                    var landSink = ue.group._ew_subSink || 0;
                    ue.group.position.y = toSY - landSink;
                }
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _jumpTweens.delete(toRemove[r]);
    }

    var _strikeTweens = new Map();

    function startStrikeLeapTween(unit, tx, ty, opts) {
        if (!unit) return;
        var ts = CONFIG.tileSize || 128;
        opts = opts || {};
        var leapMs   = opts.leapMs   || 260;
        var holdMs   = opts.holdMs   || 70;
        var returnMs = opts.returnMs || 220;
        var arcScale = opts.arcScale != null ? opts.arcScale : 0.55;
        var onImpact = opts.onImpact || null;
        var fromX = unit.x, fromY = unit.y;
        var dist = Math.abs(tx - fromX) + Math.abs(ty - fromY);
        var arcPeak = Math.max(ts * 0.45, ts * arcScale * dist);
        var fromSY = unitSurfaceY(unit);
        var toSY = _tileSurfaceY(tx, ty);
        _strikeTweens.set(unit.id, {
            fromX: fromX, fromY: fromY, fromSY: fromSY,
            toX: tx, toY: ty, toSY: toSY,
            startTime: performance.now(),
            leapMs: leapMs, holdMs: holdMs, returnMs: returnMs,
            totalMs: leapMs + holdMs + returnMs,
            arcPeak: arcPeak,
            impactFired: false,
            onImpact: onImpact
        });
        var entry = _getUnitEntry(unit.id);
        if (entry && entry.group) entry.group.visible = true;
    }

    function _updateStrikeTweens() {
        var now = performance.now();
        var ts = CONFIG.tileSize || 128;
        var toRemove = [];
        for (var entry of _strikeTweens) {
            var uid = entry[0], tw = entry[1];
            var elapsed = now - tw.startTime;
            var t = Math.min(elapsed / tw.totalMs, 1);

            var phase, phaseT;
            if (elapsed < tw.leapMs) {
                phase = 0;
                phaseT = elapsed / tw.leapMs;
            } else if (elapsed < tw.leapMs + tw.holdMs) {
                phase = 1;
                phaseT = 1;
            } else {
                phase = 2;
                phaseT = (elapsed - tw.leapMs - tw.holdMs) / tw.returnMs;
            }

            var ease = _easeInOut(phase === 0 ? phaseT : phase === 2 ? phaseT : 1);
            var posT, arcT;
            if (phase === 0) { posT = ease; arcT = ease; }
            else if (phase === 1) { posT = 1; arcT = 1; }
            else { posT = 1 - _easeInOut(phaseT); arcT = posT; }

            var arc = tw.arcPeak * 4 * arcT * (1 - arcT);
            var wx = (tw.fromX + (tw.toX - tw.fromX) * posT) * ts + ts / 2;
            var baseY = tw.fromSY + (tw.toSY - tw.fromSY) * posT;
            var wy = baseY + arc;
            var wz = (tw.fromY + (tw.toY - tw.fromY) * posT) * ts + ts / 2;

            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {
                ue.group.position.set(wx, wy, wz);
                ue.group._ew_spriteTopY = wy + (ts * UNIT_SPRITE_SIZE_RATIO) + 4;

                var spriteMesh = ue.sprite;
                if (spriteMesh) {
                    if (phase === 0) {
                        var stretch = 1 + 0.14 * Math.sin(phaseT * Math.PI);
                        var squash  = 1 - 0.10 * Math.sin(phaseT * Math.PI);
                        spriteMesh.scale.set(squash, stretch, 1);
                    } else if (phase === 1) {
                        spriteMesh.scale.set(1.18, 0.82, 1);
                    } else {
                        var stretch2 = 1 + 0.10 * Math.sin(phaseT * Math.PI);
                        var squash2  = 1 - 0.06 * Math.sin(phaseT * Math.PI);
                        spriteMesh.scale.set(squash2, stretch2, 1);
                    }
                }
            }

            if (phase >= 1 && !tw.impactFired) {
                tw.impactFired = true;
                if (tw.onImpact) try { tw.onImpact(); } catch(e) { console.warn('[ThreeRenderer] strikeLeap onImpact error:', e); }
            }

            if (t >= 1) {
                if (ue && ue.sprite) ue.sprite.scale.set(1, 1, 1);

                var unit = _findUnit(uid);
                if (unit && ue && ue.group) {
                    var rest = _unitRestPos(unit);
                    ue.group.position.set(rest.x, rest.y, rest.z);
                }
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _strikeTweens.delete(toRemove[r]);
    }

    function startDeathTween(unitId) {
        var entry = _getUnitEntry(unitId);
        if (!entry || !entry.group) return;

        _deathTweens.set(unitId, {
            startTime: performance.now(),
            durationMs: DEATH_MS,
            group: entry.group,
            startX: entry.group.position.x,
            startY: entry.group.position.y
        });
    }

    function _updateDeathTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _deathTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var g = tw.group;
            if (g) {

                if (t < 0.3) {
                    var flashT = t / 0.3;

                    var shakeAmp = (1 - flashT) * 6;
                    var shakeX = Math.sin(flashT * Math.PI * 8) * shakeAmp;
                    g.position.x = tw.startX + shakeX;

                    var flashI = Math.sin(flashT * Math.PI * 3);
                    for (var i = 0; i < g.children.length; i++) {
                        var ch = g.children[i];
                        if (ch.material && ch.material.color) {
                            ch.material.color.setRGB(1 + flashI * 1.5, 1 - flashI * 0.7, 1 - flashI * 0.7);
                        }
                    }
                } else {
                    var fadeT = (t - 0.3) / 0.7;
                    var easedFade = fadeT * fadeT;

                    g.position.x = tw.startX;

                    var s = 1 - easedFade * 0.7;
                    g.scale.set(s, s, s);

                    g.position.y = tw.startY - easedFade * 30;

                    g.rotation.y = easedFade * Math.PI * 3;

                    for (var i = 0; i < g.children.length; i++) {
                        var ch = g.children[i];
                        if (ch.material) {
                            ch.material.transparent = true;
                            ch.material.opacity = 1 - easedFade;

                            if (ch.material.color) ch.material.color.setRGB(1, 1, 1);
                        }
                    }
                }
            }
            if (t >= 1) {
                if (g) {
                    g.visible = false;
                    g.rotation.y = 0;
                    g.scale.set(1, 1, 1);
                }
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _deathTweens.delete(toRemove[r]);
    }

    function _getProjSpriteInfo(cssClass) {
        if (_PROJ_SPRITES[cssClass]) return _PROJ_SPRITES[cssClass];

        return _PROJ_SPRITES['attack'];
    }

    function startProjectileTween(fromX, fromY, toX, toY, projClass, flyMs, fromZ, toZ) {
        if (!projectileGroup || !scene) return;
        var ts = CONFIG.tileSize || 128;
        var info = _getProjSpriteInfo(projClass);

        var tex = getTexture(info.url);
        var mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.05,
            side: THREE.DoubleSide, depthWrite: false
        });
        var sz = PROJ_SIZE;
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), mat);
        mesh._ew_billboard = true;

        var fZ = (fromZ !== undefined && fromZ !== null) ? fromZ : ((typeof getHeightAt === 'function') ? getHeightAt(Math.round(fromX), Math.round(fromY)) : 0);
        var tZ = (toZ !== undefined && toZ !== null) ? toZ : ((typeof getHeightAt === 'function') ? getHeightAt(Math.round(toX), Math.round(toY)) : 0);

        var fromSY = _tileSurfaceY(Math.round(fromX), Math.round(fromY), fZ);
        var toSY = _tileSurfaceY(Math.round(toX), Math.round(toY), tZ);

        var spriteBoost = ts * 0.5;
        var startY = fromSY + spriteBoost;
        var endY = toSY + spriteBoost;

        var startX = fromX * ts + ts / 2;
        var startZ = fromY * ts + ts / 2;
        var endX = toX * ts + ts / 2;
        var endZ = toY * ts + ts / 2;

        mesh.position.set(startX, startY, startZ);
        projectileGroup.add(mesh);

        var needsDirRot = (projClass === 'proj-bullet' || projClass === 'proj-football');

        var tw = {
            id: ++_projIdCounter,
            mesh: mesh,
            startX: startX, startY: startY, startZ: startZ,
            endX: endX, endY: endY, endZ: endZ,
            startTime: performance.now(),
            durationMs: Math.max(40, flyMs || 320),
            spinSpeed: (projClass === 'proj-spiderweb') ? 10.5
                     : (projClass === 'proj-knife') ? 14.0
                     : (projClass === 'proj-football') ? 6.0 : 0,
            arcHeight: (projClass === 'proj-knife') ? ts * 0.35
                     : (projClass === 'proj-football') ? ts * 0.55 : 0,
            needsDirRot: needsDirRot,
            travelDX: endX - startX,
            travelDY: endY - startY,
            travelDZ: endZ - startZ
        };
        _projTweens.push(tw);
    }

    function _updateProjectileTweens() {
        if (_projTweens.length === 0) return;
        var now = performance.now();
        var cam = ThreeCamera.getCamera();
        var i = _projTweens.length;
        while (i--) {
            var tw = _projTweens[i];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var wx = tw.startX + (tw.endX - tw.startX) * t;
            var wy = tw.startY + (tw.endY - tw.startY) * t;
            var wz = tw.startZ + (tw.endZ - tw.startZ) * t;

            if (tw.arcHeight) wy += tw.arcHeight * 4 * t * (1 - t);
            tw.mesh.position.set(wx, wy, wz);

            if (cam) {
                tw.mesh.rotation.y = Math.atan2(
                    cam.position.x - wx,
                    cam.position.z - wz
                );
            }

            if (tw.needsDirRot && cam) {
                var camAngle = tw.mesh.rotation.y;
                var localH = tw.travelDX * Math.cos(camAngle) - tw.travelDZ * Math.sin(camAngle);
                var localV = tw.travelDY;
                var dirAngle = -Math.atan2(localH, localV);

                if (tw.spinSpeed) {
                    dirAngle += ((now - tw.startTime) / 1000) * tw.spinSpeed;
                }
                tw.mesh.rotation.z = dirAngle;
            }

            else if (tw.spinSpeed) {
                tw.mesh.rotation.z = ((now - tw.startTime) / 1000) * tw.spinSpeed;
            }

            if (t > 0.85) {
                tw.mesh.material.opacity = Math.max(0, 1 - (t - 0.85) / 0.15);
            }

            var sc = 1 - 0.15 * t;
            tw.mesh.scale.set(sc, sc, 1);

            if (t >= 1) {

                projectileGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                tw.mesh.material.dispose();
                _projTweens.splice(i, 1);
            }
        }
    }

    function _clearProjectileTweens() {
        for (var i = 0; i < _projTweens.length; i++) {
            var tw = _projTweens[i];
            if (tw.mesh) {
                projectileGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                tw.mesh.material.dispose();
            }
        }
        _projTweens.length = 0;
    }

    var _tetherTweens = [];
    var _tetherIdCounter = 0;

    var _R2_TETHER = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/';
    var _TETHER_SPRITES = {
        'rope': { url: _R2_TETHER + 'rope.png', glow: 0xa08250 },
        'vine': { url: _R2_TETHER + 'vine.png', glow: 0x3cb43c }
    };

    function _tetherWorldPos(tileX, tileY, zLevel) {
        var ts = CONFIG.tileSize || 128;
        var z = (zLevel !== undefined && zLevel !== null) ? zLevel
            : ((typeof getHeightAt === 'function') ? getHeightAt(Math.round(tileX), Math.round(tileY)) : 0);
        var surfY = _tileSurfaceY(Math.round(tileX), Math.round(tileY), z);
        return {
            x: tileX * ts + ts / 2,
            y: surfY + ts * 0.5,
            z: tileY * ts + ts / 2
        };
    }

    function _buildTetherMesh(kind) {
        var info = _TETHER_SPRITES[kind] || _TETHER_SPRITES['rope'];

        var geo = new THREE.BufferGeometry();

        var positions = new Float32Array(4 * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        var uvs = new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]);
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        geo.setIndex([0, 1, 2, 1, 3, 2]);

        var tex = getTexture(info.url);
        if (tex) {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
        }
        var mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1,
            side: THREE.DoubleSide, depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        return { mesh: mesh, geo: geo, mat: mat };
    }

    function _setTetherVerts(geo, from, to) {
        var halfH = 8;
        var ts = CONFIG.tileSize || 128;

        var dx = to.x - from.x;
        var dz = to.z - from.z;
        var lenXZ = Math.sqrt(dx * dx + dz * dz);

        var pos = geo.getAttribute('position');

        pos.setXYZ(0, from.x, from.y + halfH, from.z);

        pos.setXYZ(1, from.x, from.y - halfH, from.z);

        pos.setXYZ(2, to.x, to.y + halfH, to.z);

        pos.setXYZ(3, to.x, to.y - halfH, to.z);
        pos.needsUpdate = true;

        var dist3D = Math.sqrt(
            (to.x - from.x) * (to.x - from.x) +
            (to.y - from.y) * (to.y - from.y) +
            (to.z - from.z) * (to.z - from.z)
        );
        var repeatX = Math.max(0.01, dist3D / ts);
        var uv = geo.getAttribute('uv');

        uv.setXY(0, 0, 1);
        uv.setXY(1, 0, 0);
        uv.setXY(2, repeatX, 1);
        uv.setXY(3, repeatX, 0);
        uv.needsUpdate = true;

        geo.computeBoundingSphere();
    }

    function startTetherTween(fromX, fromY, toX, toY, kind, shootMs, fromZLevel, toZLevel) {
        if (!projectileGroup || !scene) return null;

        var from = _tetherWorldPos(fromX, fromY, fromZLevel);
        var to = _tetherWorldPos(toX, toY, toZLevel);

        var built = _buildTetherMesh(kind);

        _setTetherVerts(built.geo, from, from);
        projectileGroup.add(built.mesh);

        var id = ++_tetherIdCounter;
        var tw = {
            id: id,
            mesh: built.mesh, geo: built.geo, mat: built.mat,
            kind: kind,

            from: from, to: to,

            fromTX: fromX, fromTY: fromY,

            phase: 'shoot',
            startTime: performance.now(),
            shootMs: Math.max(40, shootMs || 280),

            retractFrom: null, retractTo: null,
            retractStartTime: 0, retractMs: 0,

            fadeStartTime: 0, fadeMs: 0,
            removed: false
        };
        _tetherTweens.push(tw);

        return {
            id: id,
            retract: function(newToX, newToY, retractMs) {
                _tetherRetract(id, newToX, newToY, retractMs);
            },
            remove: function(fadeMs) {
                _tetherRemove(id, fadeMs || 200);
            }
        };
    }

    function _tetherRetract(tetherId, newToX, newToY, retractMs) {
        for (var i = 0; i < _tetherTweens.length; i++) {
            var tw = _tetherTweens[i];
            if (tw.id === tetherId && !tw.removed) {

                var casterPos = tw.from;
                var newTo = _tetherWorldPos(newToX, newToY);
                tw.phase = 'retract';
                tw.retractFrom = { x: tw.to.x, y: tw.to.y, z: tw.to.z };
                tw.retractTo = casterPos;

                tw.retractNewFrom = newTo;
                tw.retractStartTime = performance.now();
                tw.retractMs = Math.max(40, retractMs || 200);
                return;
            }
        }
    }

    function _tetherRemove(tetherId, fadeMs) {
        for (var i = 0; i < _tetherTweens.length; i++) {
            if (_tetherTweens[i].id === tetherId && !_tetherTweens[i].removed) {
                _tetherTweens[i].phase = 'fade';
                _tetherTweens[i].fadeStartTime = performance.now();
                _tetherTweens[i].fadeMs = fadeMs || 200;
                return;
            }
        }
    }

    function _updateTetherTweens() {
        if (_tetherTweens.length === 0) return;
        var now = performance.now();
        var i = _tetherTweens.length;
        while (i--) {
            var tw = _tetherTweens[i];
            if (tw.removed) { _tetherTweens.splice(i, 1); continue; }

            if (tw.phase === 'shoot') {

                var t = Math.min((now - tw.startTime) / tw.shootMs, 1);
                var curTo = {
                    x: tw.from.x + (tw.to.x - tw.from.x) * t,
                    y: tw.from.y + (tw.to.y - tw.from.y) * t,
                    z: tw.from.z + (tw.to.z - tw.from.z) * t
                };
                _setTetherVerts(tw.geo, tw.from, curTo);
                if (t >= 1) tw.phase = 'hold';

            } else if (tw.phase === 'hold') {

                _setTetherVerts(tw.geo, tw.from, tw.to);

            } else if (tw.phase === 'retract') {

                var rt = Math.min((now - tw.retractStartTime) / tw.retractMs, 1);
                var curFar = {
                    x: tw.retractFrom.x + (tw.retractTo.x - tw.retractFrom.x) * rt,
                    y: tw.retractFrom.y + (tw.retractTo.y - tw.retractFrom.y) * rt,
                    z: tw.retractFrom.z + (tw.retractTo.z - tw.retractFrom.z) * rt
                };

                var curNear = tw.retractNewFrom ? {
                    x: tw.retractFrom.x + (tw.retractNewFrom.x - tw.retractFrom.x) * rt,
                    y: tw.retractFrom.y + (tw.retractNewFrom.y - tw.retractFrom.y) * rt,
                    z: tw.retractFrom.z + (tw.retractNewFrom.z - tw.retractFrom.z) * rt
                } : tw.from;
                _setTetherVerts(tw.geo, curNear, curFar);
                if (rt >= 1) {
                    tw.phase = 'fade';
                    tw.fadeStartTime = now;
                    tw.fadeMs = 150;
                }

            } else if (tw.phase === 'fade') {
                var ft = Math.min((now - tw.fadeStartTime) / tw.fadeMs, 1);
                tw.mat.opacity = 1 - ft;
                if (ft >= 1) {
                    projectileGroup.remove(tw.mesh);
                    tw.geo.dispose();
                    tw.mat.dispose();
                    tw.removed = true;
                    _tetherTweens.splice(i, 1);
                }
            }
        }
    }

    function _clearTetherTweens() {
        for (var i = 0; i < _tetherTweens.length; i++) {
            var tw = _tetherTweens[i];
            if (tw.mesh && tw.mesh.parent) {
                projectileGroup.remove(tw.mesh);
                tw.geo.dispose();
                tw.mat.dispose();
            }
        }
        _tetherTweens.length = 0;
    }

    function _buildFloatTextTexture(text, kind) {
        var style = _FLOAT_STYLES[kind] || _FLOAT_STYLES['damage'];
        var fontSize = style.fontSize || 48;
        var fontFamily = "'DotGothic16', monospace";
        var fontWeight = '900';
        var fontStr = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        ctx.font = fontStr;
        var metrics = ctx.measureText(text);

        var outlineW = Math.max(3, Math.round(fontSize * 0.08));
        var padX = outlineW * 4 + 8;
        var padY = outlineW * 4 + 8;
        var tw = Math.ceil(metrics.width) + padX * 2;
        var th = Math.ceil(fontSize * 1.3) + padY * 2;
        c.width = tw; c.height = th;
        ctx = c.getContext('2d');
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var cx = tw / 2;
        var cy = th / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(text, cx, cy);
        ctx.restore();

        ctx.save();
        ctx.lineWidth = outlineW * 2.5;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = style.stroke || '#000000';
        ctx.strokeText(text, cx, cy);
        ctx.restore();

        ctx.save();
        ctx.lineWidth = outlineW * 1.2;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(text, cx, cy);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = style.color || '#ffffff';
        ctx.fillText(text, cx, cy);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, cx, cy - 1);
        ctx.restore();

        var tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        return { texture: tex, width: tw, height: th };
    }

    function startFloatingText(tileX, tileY, text, kind, durationMs, opts) {
        if (!floatTextGroup || !scene) return;
        opts = opts || {};
        var ts = CONFIG.tileSize || 128;

        var info = _buildFloatTextTexture(text, kind);
        var mat = new THREE.MeshBasicMaterial({
            map: info.texture, transparent: true, alphaTest: 0.01,
            side: THREE.DoubleSide, depthWrite: false, depthTest: true
        });

        var pxScale = 0.7;
        var quadW = info.width * pxScale;
        var quadH = info.height * pxScale;
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(quadW, quadH), mat);
        mesh._ew_billboard = true;

        var jx = Number.isFinite(opts.jitterX) ? opts.jitterX * 0.4 : (Math.random() * 8 - 4);
        var jy = Number.isFinite(opts.jitterY) ? opts.jitterY * 0.4 : (Math.random() * 5 - 2.5);

        var tileKey = tileX + ',' + tileY;
        var stag = _floatTileStagger[tileKey];
        var staggerIdx = 0;
        if (stag && (performance.now() - stag.time) < FLOAT_STAGGER_WINDOW) {
            stag.count++;
            stag.time = performance.now();
            staggerIdx = stag.count;
        } else {
            _floatTileStagger[tileKey] = { count: 0, time: performance.now() };
        }
        var staggerLift = staggerIdx * FLOAT_STAGGER_Y;

        var unitAtTile = (typeof unitAt === 'function') ? unitAt(tileX, tileY) : null;
        var zLevel;
        if (unitAtTile && typeof canFly === 'function' && canFly(unitAtTile) && typeof isUnitAirborne === 'function' && isUnitAirborne(unitAtTile)) {
            zLevel = unitAtTile.z || 0;
        } else {
            zLevel = (typeof getHeightAt === 'function') ? getHeightAt(tileX, tileY) : 0;
        }
        var surfaceY = _tileSurfaceY(tileX, tileY, zLevel);

        var startY = surfaceY + ts * UNIT_SPRITE_SIZE_RATIO + quadH / 2 + 12 + staggerLift;

        var wx = tileX * ts + ts / 2 + jx;
        var wz = tileY * ts + ts / 2 + jy;

        mesh.position.set(wx, startY, wz);

        mesh.material.opacity = 0;
        mesh.scale.set(0, 0, 1);
        floatTextGroup.add(mesh);

        var isBig = (kind === 'crit' || kind === 'overkill' || kind === 'levelup' || kind === 'laststd');

        var tw = {
            id: ++_floatIdCounter,
            mesh: mesh,
            startY: startY,
            riseY: FLOAT_RISE_PX,
            startTime: performance.now(),
            durationMs: Math.max(400, durationMs || 900),
            isBig: isBig,
            staggerIdx: staggerIdx
        };
        _floatTweens.push(tw);
    }

    function _updateFloatTextTweens() {
        if (_floatTweens.length === 0) return;
        var now = performance.now();
        var cam = ThreeCamera.getCamera();
        var i = _floatTweens.length;
        while (i--) {
            var tw = _floatTweens[i];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var riseT = 1 - Math.pow(1 - t, 3);
            tw.mesh.position.y = tw.startY + tw.riseY * riseT;

            if (cam) {
                tw.mesh.rotation.y = Math.atan2(
                    cam.position.x - tw.mesh.position.x,
                    cam.position.z - tw.mesh.position.z
                );
            }

            var opacity;
            if (t < 0.06) {

                opacity = Math.min(1, t / 0.06);
            } else if (t < 0.75) {

                opacity = 1;
            } else {

                var fadeT = (t - 0.75) / 0.25;
                opacity = 1 - fadeT * fadeT;
            }
            tw.mesh.material.opacity = Math.max(0, opacity);

            var sc;
            var overshoot = tw.isBig ? 1.6 : 1.35;
            if (t < 0.08) {

                var slamT = t / 0.08;
                sc = overshoot * (1 - Math.pow(1 - slamT, 3));
            } else if (t < 0.18) {

                var settleT = (t - 0.08) / 0.10;
                sc = overshoot + (1.0 - overshoot) * (1 - Math.pow(1 - settleT, 2));
            } else if (t < 0.22) {

                var bounceT = (t - 0.18) / 0.04;
                sc = 1.0 + 0.05 * Math.sin(bounceT * Math.PI);
            } else {
                sc = 1.0;
            }
            tw.mesh.scale.set(sc, sc, 1);

            if (t >= 1) {
                floatTextGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                tw.mesh.material.dispose();
                if (tw.mesh.material.map) tw.mesh.material.map.dispose();
                _floatTweens.splice(i, 1);
            }
        }
    }

    function _clearFloatTextTweens() {
        for (var i = 0; i < _floatTweens.length; i++) {
            var tw = _floatTweens[i];
            if (tw.mesh) {
                floatTextGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                if (tw.mesh.material.map) tw.mesh.material.map.dispose();
                tw.mesh.material.dispose();
            }
        }
        _floatTweens.length = 0;
    }

    function startHitEffect(tileX, tileY, variant, isCrit, durationMs) {
        if (!hitFxGroup || !scene) return;
        var ts = CONFIG.tileSize || 128;
        var sheet = _HIT_FX_SHEETS[variant] || _HIT_FX_SHEETS['hit04'];

        var tex = getTexture(sheet.url);
        if (!tex) return;

        var frameTex = tex.clone();
        frameTex.needsUpdate = true;

        frameTex.repeat.set(1 / sheet.cols, 1 / sheet.rows);

        frameTex.offset.set(0, 1 - 1 / sheet.rows);

        var sz = isCrit ? HIT_FX_SIZE * 1.35 : HIT_FX_SIZE;
        var mat = new THREE.MeshBasicMaterial({
            map: frameTex, transparent: true, alphaTest: 0.05,
            side: THREE.DoubleSide, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), mat);
        mesh._ew_billboard = true;

        var jX = (Math.random() - 0.5) * 8;
        var jZ = (Math.random() - 0.5) * 6;
        var unitAtTile = (typeof unitAt === 'function') ? unitAt(tileX, tileY) : null;
        var zLevel;
        if (unitAtTile && typeof canFly === 'function' && canFly(unitAtTile) && typeof isUnitAirborne === 'function' && isUnitAirborne(unitAtTile)) {
            zLevel = unitAtTile.z || 0;
        } else {
            zLevel = (typeof getHeightAt === 'function') ? getHeightAt(tileX, tileY) : 0;
        }
        var surfaceY = _tileSurfaceY(tileX, tileY, zLevel);
        var hitY = surfaceY + ts * 0.55;

        var wx = tileX * ts + ts / 2 + jX;
        var wz = tileY * ts + ts / 2 + jZ;
        mesh.position.set(wx, hitY, wz);
        hitFxGroup.add(mesh);

        _hitFxTweens.push({
            id: ++_hitFxIdCounter,
            mesh: mesh,
            tex: frameTex,
            cols: sheet.cols,
            rows: sheet.rows,
            frames: sheet.frames,
            startTime: performance.now(),
            durationMs: Math.max(200, durationMs || 380)
        });
    }

    function _updateHitFxTweens() {
        if (_hitFxTweens.length === 0) return;
        var now = performance.now();
        var cam = ThreeCamera.getCamera();
        var i = _hitFxTweens.length;
        while (i--) {
            var tw = _hitFxTweens[i];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var frameIdx = Math.min(Math.floor(t * tw.frames), tw.frames - 1);
            var col = frameIdx % tw.cols;
            var row = Math.floor(frameIdx / tw.cols);

            tw.tex.offset.set(col / tw.cols, 1 - (row + 1) / tw.rows);

            if (cam) {
                tw.mesh.rotation.y = Math.atan2(
                    cam.position.x - tw.mesh.position.x,
                    cam.position.z - tw.mesh.position.z
                );
            }

            var sc;
            if (t < 0.15) { sc = 0.85 + 0.2 * (t / 0.15); }
            else { sc = 1.0; }
            tw.mesh.scale.set(sc, sc, 1);

            var opacity;
            if (t < 0.50) { opacity = 1; }
            else if (t < 0.85) { opacity = 1 - 0.4 * ((t - 0.50) / 0.35); }
            else { opacity = 0.6 - 0.6 * ((t - 0.85) / 0.15); }
            tw.mesh.material.opacity = Math.max(0, opacity);

            if (t >= 1) {
                hitFxGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                tw.mesh.material.dispose();

                _hitFxTweens.splice(i, 1);
            }
        }
    }

    function _clearHitFxTweens() {
        for (var i = 0; i < _hitFxTweens.length; i++) {
            var tw = _hitFxTweens[i];
            if (tw.mesh) {
                hitFxGroup.remove(tw.mesh);
                tw.mesh.geometry.dispose();
                tw.mesh.material.dispose();
            }
        }
        _hitFxTweens.length = 0;
    }

    function _syncCombatAnims() {
        var ts = CONFIG.tileSize || 128;

        if (state.attackAnimIds) {
            for (var uid of state.attackAnimIds) {
                if (!_prevAttackIds.has(uid) && !_lungeTweens.has(uid)) {
                    var dir = state._attackAnimDir ? state._attackAnimDir[uid] : null;
                    if (dir) {
                        _lungeTweens.set(uid, {
                            dx: dir.dx * LUNGE_DIST,
                            dz: dir.dy * LUNGE_DIST,
                            startTime: performance.now(),
                            durationMs: LUNGE_MS
                        });
                    }
                }
            }
            _prevAttackIds = new Set(state.attackAnimIds);
        }

        if (state.castAnimIds) {
            for (var uid of state.castAnimIds) {
                if (!_prevCastIds.has(uid) && !_castTweens.has(uid)) {
                    _castTweens.set(uid, {
                        startTime: performance.now(),
                        durationMs: CAST_MS
                    });
                }
            }
            _prevCastIds = new Set(state.castAnimIds);
        }

        if (state.dodgeAnimIds) {
            for (var uid of state.dodgeAnimIds) {
                if (!_prevDodgeIds.has(uid) && !_dodgeTweens.has(uid)) {
                    var dir = state._dodgeAnimDir ? state._dodgeAnimDir[uid] : null;
                    if (dir) {
                        _dodgeTweens.set(uid, {
                            dx: dir.dx * DODGE_DIST,
                            dz: dir.dy * DODGE_DIST,
                            startTime: performance.now(),
                            durationMs: DODGE_MS
                        });
                    }
                }
            }
            _prevDodgeIds = new Set(state.dodgeAnimIds);
        }

        if (state.hitFlashIds) {
            for (var uid of state.hitFlashIds) {
                if (!_prevHitFlashIds.has(uid) && !_flashTweens.has(uid)) {
                    _flashTweens.set(uid, { startTime: performance.now(), durationMs: FLASH_MS, kind: 'hit' });
                }
            }
            _prevHitFlashIds = new Set(state.hitFlashIds);
        }

        if (state.healFlashIds) {
            for (var uid of state.healFlashIds) {
                if (!_prevHealFlashIds.has(uid) && !_flashTweens.has(uid)) {
                    _flashTweens.set(uid, { startTime: performance.now(), durationMs: FLASH_MS, kind: 'heal' });
                }
            }
            _prevHealFlashIds = new Set(state.healFlashIds);
        }

        if (state.statusWiggleIds) {
            for (var uid of state.statusWiggleIds) {
                if (!_prevWiggleIds.has(uid) && !_wiggleTweens.has(uid)) {
                    _wiggleTweens.set(uid, { startTime: performance.now(), durationMs: WIGGLE_MS });
                }
            }
            _prevWiggleIds = new Set(state.statusWiggleIds);
        }
    }

    function _updateLungeTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _lungeTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var peak = 0.3;
            var intensity;
            if (t < peak) {
                intensity = _easeOut(t / peak);
            } else {
                intensity = 1 - _easeOut((t - peak) / (1 - peak));
            }
            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {

                var unit = _findUnit(uid);
                if (unit) {
                    var rest = _unitRestPos(unit);
                    ue.group.position.x = rest.x + tw.dx * intensity;
                    ue.group.position.y = rest.y;
                    ue.group.position.z = rest.z + tw.dz * intensity;
                }
            }
            if (t >= 1) toRemove.push(uid);
        }
        for (var r = 0; r < toRemove.length; r++) _lungeTweens.delete(toRemove[r]);
    }

    function _updateDodgeTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _dodgeTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var peak = 0.35;
            var intensity;
            if (t < peak) {
                intensity = _easeOut(t / peak);
            } else {
                intensity = 1 - _easeOut((t - peak) / (1 - peak));
            }
            var ue = _getUnitEntry(uid);
            if (ue && ue.group) {
                var unit = _findUnit(uid);
                if (unit) {
                    var rest = _unitRestPos(unit);
                    ue.group.position.x = rest.x + tw.dx * intensity;
                    ue.group.position.z = rest.z + tw.dz * intensity;

                    ue.group.position.y = rest.y + Math.sin(t * Math.PI) * 6;
                }
            }
            if (t >= 1) toRemove.push(uid);
        }
        for (var r = 0; r < toRemove.length; r++) _dodgeTweens.delete(toRemove[r]);
    }

    function _updateCastTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _castTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var ue = _getUnitEntry(uid);
            if (ue && ue.sprite && ue.sprite.material) {

                var glow = Math.sin(t * Math.PI);
                var r = 1 + glow * 0.8;
                var g = 1 + glow * 0.6;
                var b = 1 + glow * 1.0;
                ue.sprite.material.color.setRGB(r, g, b);

                var bob = Math.sin(t * Math.PI) * CAST_BOB_AMP;
                var baseY = ue.sprite._ew_baseY || 0;
                ue.sprite.position.y = baseY + bob;

                var scalePulse = 1 + glow * 0.08;
                ue.sprite.scale.set(scalePulse, scalePulse, 1);
            }
            if (t >= 1) {

                if (ue && ue.sprite) {
                    ue.sprite.position.y = ue.sprite._ew_baseY || 0;
                    ue.sprite.scale.set(1, 1, 1);
                    if (ue.sprite.material) {
                        var unit = _findUnit(uid);
                        if (unit && unit.ap <= 0) {
                            ue.sprite.material.color.setRGB(0.5, 0.5, 0.5);
                        } else {
                            ue.sprite.material.color.setRGB(1, 1, 1);
                        }
                    }
                }
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _castTweens.delete(toRemove[r]);
    }

    function _updateFlashTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _flashTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var ue = _getUnitEntry(uid);
            if (ue && ue.sprite && ue.sprite.material) {
                var flash = Math.sin(t * Math.PI);
                if (tw.kind === 'hit') {

                    ue.sprite.material.color.setRGB(1 + flash * 1.5, 1 - flash * 0.6, 1 - flash * 0.6);
                    var baseY = ue.sprite._ew_baseY || 0;

                    if (t < 0.6) {
                        var shakeDecay = 1 - (t / 0.6);
                        var shakeFreq = Math.sin(t * Math.PI * 8);
                        ue.sprite.position.x = shakeFreq * shakeDecay * 6;

                        ue.sprite.position.y = baseY - flash * 3;
                    } else {
                        ue.sprite.position.x = 0;
                        ue.sprite.position.y = baseY;
                    }
                } else {

                    ue.sprite.material.color.setRGB(1 - flash * 0.2, 1 + flash * 0.8, 1 - flash * 0.2);
                }
            }
            if (t >= 1) {

                if (ue && ue.sprite) {
                    ue.sprite.position.x = 0;
                    ue.sprite.position.y = ue.sprite._ew_baseY || 0;
                    if (ue.sprite.material) {
                        var unit = _findUnit(uid);
                        if (unit && unit.ap <= 0) {
                            ue.sprite.material.color.setRGB(0.5, 0.5, 0.5);
                        } else {
                            ue.sprite.material.color.setRGB(1, 1, 1);
                        }
                    }
                }
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _flashTweens.delete(toRemove[r]);
    }

    function _updateWiggleTweens() {
        var now = performance.now();
        var toRemove = [];
        for (var entry of _wiggleTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var ue = _getUnitEntry(uid);
            if (ue && ue.sprite) {

                var decay = 1 - t;
                var freq = t * Math.PI * 6;
                var offset = Math.sin(freq) * WIGGLE_AMP * decay;
                ue.sprite.position.x = offset;
            }
            if (t >= 1) {
                if (ue && ue.sprite) ue.sprite.position.x = 0;
                toRemove.push(uid);
            }
        }
        for (var r = 0; r < toRemove.length; r++) _wiggleTweens.delete(toRemove[r]);
    }

    function _findUnit(uid) {
        if (!state.units) return null;
        for (var i = 0; i < state.units.length; i++) {
            if (state.units[i].id === uid) return state.units[i];
        }
        return null;
    }

    function _updateAnimations() {
        _syncCombatAnims();
        _updateWalkTweens();
        _updateDisplaceTweens();
        _updateJumpTweens();
        _updateStrikeTweens();
        _updateDeathTweens();
        _updateProjectileTweens();
        _updateTetherTweens();
        _updateFloatTextTweens();
        _updateHitFxTweens();
        _updateLungeTweens();
        _updateDodgeTweens();
        _updateCastTweens();
        _updateFlashTweens();
        _updateWiggleTweens();
    }

    function _clearAnimations() {
        _walkTweens.clear();
        _displaceTweens.clear();
        _jumpTweens.clear();
        _deathTweens.clear();
        _clearProjectileTweens();
        _clearTetherTweens();
        _clearFloatTextTweens();
        _clearHitFxTweens();
        _lungeTweens.clear();
        _dodgeTweens.clear();
        _castTweens.clear();
        _flashTweens.clear();
        _strikeTweens.clear();
        _prevAttackIds.clear();
        _prevCastIds.clear();
        _prevDodgeIds.clear();
        _prevHitFlashIds.clear();
        _prevHealFlashIds.clear();
        _wiggleTweens.clear();
        _prevWiggleIds.clear();
        clearAllOverlays();
    }

    // ════════════════════════════════════════════════════════════════════
    //  FLAT-EARTH FIRMAMENT ENVIRONMENT
    //  Real 3D geometry living in the battle scene, sharing the game camera:
    //  no floor and no horizon at all — a single full-sphere cosmic dome (deep
    //  nebula + milky-way band + layered starfield) wraps the scene in every
    //  direction, so the board floats in seamless open space. Because it is
    //  actual world geometry it tilts / rotates / zooms with the map, and you
    //  can look up to see the sky. Reacts to the day/night cycle, sky events,
    //  the active zodiac and the weather.
    // ════════════════════════════════════════════════════════════════════
    var _envGroup = null, _envGround = null, _envWall = null, _envDome = null;
    var _envUni = null, _envInited = false;
    var _ENV_WALL_H = 3200, _ENV_DOME_R = 16000;
    var _envSmooth = { night: 0, skyAmt: 0, skyEvent: 0, zodiac: 0, storm: 0, snow: 0, sand: 0, blood: 0 };

    var _ENV_COMMON = [
        'uniform float uTime; uniform float uDayNight; uniform float uSkyEvent; uniform float uSkyAmt;',
        'uniform float uZodiac; uniform vec4 uWeather; uniform float uOccult;',
        'uniform vec3 uCenter; uniform float uDiscR; uniform float uWallH; uniform float uTile;',
        '#define PI 3.14159265359',
        '#define TAU 6.28318530718',
        'float hash11(float p){p=fract(p*0.1031);p*=p+33.33;p*=p+p;return fract(p);}',
        'float hash21(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
        'vec2 hash22(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy);}',
        'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash21(i),b=hash21(i+vec2(1,0)),c=hash21(i+vec2(0,1)),d=hash21(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
        'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p*=2.02;a*=0.5;}return v;}'
    ].join('\n');

    var _ENV_WORLD_VS =
        'varying vec3 vWorld;\n' +
        'void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWorld=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }';

    function _envGroundFS() {
        // Not a floor any more — this plane is banished far below the floating
        // board as a distant molten rift: charred obsidian with large-scale
        // value drift, fine grain and aether/lava seeping up through glowing
        // cracks, ringed by faint esoteric sigils and dissolving into haze.
        return 'varying vec3 vWorld;\n' + _ENV_COMMON + '\n' +
        'void main(){\n' +
        '  float night=uDayNight;\n' +
        '  vec2 p=vWorld.xz; vec2 q=p-uCenter.xz; float rr=length(q); float th=atan(q.y,q.x);\n' +
        '  float big=fbm(p/(uTile*6.0));\n' +
        '  float grain=fbm(p/(uTile*0.55));\n' +
        '  vec3 charC=mix(vec3(0.028,0.025,0.032),vec3(0.006,0.006,0.013),night);\n' +
        '  vec3 ashC =mix(vec3(0.075,0.068,0.082),vec3(0.020,0.019,0.030),night);\n' +
        '  vec3 col=mix(charC,ashC,clamp(big*0.7+grain*0.3,0.0,1.0));\n' +
        '  // glowing fissures — molten by day, aetheric violet by night\n' +
        '  float crk=fbm(p/(uTile*2.1)+vec2(11.3,4.7));\n' +
        '  float crack=smoothstep(0.45,0.50,crk)*smoothstep(0.57,0.51,crk);\n' +
        '  vec3 emberC=mix(vec3(0.95,0.34,0.12),vec3(0.42,0.30,0.92),night);\n' +
        '  float pulse=0.6+0.4*sin(uTime*0.6+crk*32.0);\n' +
        '  col+=crack*emberC*(0.22+0.45*night)*pulse*smoothstep(0.0,uTile*4.0,rr);\n' +
        '  float rn=rr/uTile;\n' +
        '  vec3 sigCol=mix(vec3(0.45,0.40,0.82),vec3(0.42,0.62,1.0),night);\n' +
        '  float rings=smoothstep(0.96,1.0,abs(sin(rn*0.5-uTime*0.05)));\n' +
        '  float spokes=smoothstep(0.95,1.0,abs(cos(th*9.0)));\n' +
        '  float rosette=smoothstep(0.90,1.0,abs(sin(th*6.0+rn*0.35)));\n' +
        '  float sig=rings*0.5+spokes*0.16+rosette*0.22;\n' +
        '  col+=sig*sigCol*uOccult*smoothstep(4.0,16.0,rn)*0.34;\n' +
        '  float zr=uDiscR*0.45;\n' +
        '  col+=smoothstep(uTile*5.0,0.0,abs(rr-zr))*smoothstep(0.85,1.0,abs(cos(th*6.0)))*sigCol*uOccult*0.25;\n' +
        '  float fog=smoothstep(uDiscR*0.14,uDiscR*0.80,rr);\n' +
        '  vec3 haze=mix(vec3(0.50,0.60,0.72),vec3(0.02,0.035,0.085),night);\n' +
        '  col=mix(col,haze,fog*0.97);\n' +
        '  float rim=smoothstep(uDiscR*0.86,uDiscR,rr);\n' +
        '  col+=rim*mix(vec3(0.45,0.68,0.92),vec3(0.16,0.34,0.62),night)*0.45;\n' +
        '  col=mix(col,col*vec3(1.30,0.50,0.45)+vec3(0.05,0.0,0.0),uWeather.w*0.4);\n' +
        '  col=mix(col,col*vec3(1.15,1.0,0.75),uWeather.z*0.35);\n' +
        '  float lum=dot(col,vec3(0.299,0.587,0.114)); col=mix(col,vec3(lum),uWeather.x*0.3);\n' +
        '  float bloodM=step(0.5,uSkyEvent)*step(uSkyEvent,1.5)*uSkyAmt;\n' +
        '  float ecl=(step(1.5,uSkyEvent)*step(uSkyEvent,2.5)+step(2.5,uSkyEvent))*uSkyAmt;\n' +
        '  col=mix(col,col*vec3(1.4,0.55,0.5)+vec3(0.04,0.0,0.0),bloodM*0.45);\n' +
        '  col=mix(col,col*vec3(0.5,0.5,0.62),ecl*0.45);\n' +
        '  col=col/(col+vec3(0.6)); col=pow(max(col,0.0),vec3(0.95));\n' +
        '  gl_FragColor=vec4(col,1.0);\n' +
        '}';
    }

    // Horizon skyline drawn on the ring wall: layered distant snow mountains,
    // a ruined occult city (ziggurats / towers with lit windows / domed temples
    // with glowing sigils / obelisks) and a forest fringe. Everything above the
    // silhouette crest is discarded so the firmament dome shows through, and the
    // whole band tilts / rotates / zooms with the map like real world geometry.
    function _envWallFS() {
        return [
        'varying vec3 vWorld;', _ENV_COMMON,
        // ── silhouette crest profiles (functions of ring azimuth) ──
        'float ridge(float a){ float n=fbm(vec2(a,1.7)); return 1.0-abs(2.0*n-1.0); }',
        'float mtnCrest(float a){ return 0.12 + ridge(a*1.3+2.0)*0.26 + ridge(a*2.9+9.0)*0.12 + fbm(vec2(a*6.0,3.0))*0.05; }',
        'float forestCrest(float a){ float m=smoothstep(0.42,0.55,fbm(vec2(a*3.0,5.0)));',
        '  float n=fbm(vec2(a*34.0,4.0)); float n2=fbm(vec2(a*82.0,9.0)); return m*(0.05+n*n*0.12+n2*0.03); }',
        'float cityCrest(float a, out float fc, out float kind){',
        '  float cells=24.0; float ac=a*(1.0/TAU)+0.5; float idx=floor(ac*cells); fc=fract(ac*cells);',
        '  float seed=hash11(idx*1.37+0.2); kind=floor(hash11(idx*2.7+0.5)*4.0);',
        '  if(seed<0.5){ kind=-1.0; return 0.0; }',
        '  float d=abs(fc-0.5); float bw=0.20+hash11(idx*4.4)*0.15; float bh=0.17+hash11(idx*3.1)*0.21; float h=0.0;',
        '  if(kind<0.5){ float st=clamp((0.5-d)/max(bw,1e-3),0.0,1.0); h=step(d,bw)*bh*(0.4+0.6*floor(st*3.0)/3.0); }', // ziggurat
        '  else if(kind<1.5){ float tw=bw*0.5; h=step(d,tw)*(bh*1.4+0.10); }',                                          // tower
        '  else if(kind<2.5){ float body=step(d,bw)*bh*0.6; float dm=step(d,bw*0.6)*sqrt(max(0.0,1.0-pow(d/(bw*0.6+1e-3),2.0)))*0.14; h=body+dm; }', // domed temple
        '  else { h=step(d,0.055)*(bh*0.7+0.24); }',                                                                    // obelisk
        '  return h;',
        '}',
        'float glyph(vec2 p){ float ring=smoothstep(0.045,0.0,abs(length(p-vec2(0.0,0.16))-0.11));',
        '  float stem=smoothstep(0.03,0.0,abs(p.x))*step(-0.20,p.y)*step(p.y,0.16);',
        '  float bar=smoothstep(0.03,0.0,abs(p.y))*step(-0.14,p.x)*step(p.x,0.14); return clamp(ring+stem+bar,0.0,1.0); }',
        // ── per-layer shading ──
        'vec3 shadeMtn(float a,float hg,float cr,float laz,vec3 lc,vec3 sk,float night){',
        '  float up=clamp(hg/max(cr,1e-3),0.0,1.0);',
        '  vec3 rock=mix(vec3(0.11,0.13,0.19),vec3(0.03,0.05,0.11),night); rock*=0.7+0.55*fbm(vec2(a*55.0,hg*22.0));',
        '  float face=0.5+0.5*cos(a-laz); float snow=smoothstep(0.55-0.12*face,0.82,up);',
        '  vec3 snowC=mix(vec3(0.80,0.88,1.0),vec3(0.26,0.40,0.64),night)+lc*face*0.30;',
        '  vec3 c=mix(rock,snowC,snow); c+=lc*face*0.07*(0.4+0.6*up);',
        '  c=mix(sk*0.9,c,clamp(up*1.7,0.12,1.0)); return c; }',
        'vec3 shadeFor(float a,float hg,float cr,vec3 sk,float night){',
        '  float up=clamp(hg/max(cr,1e-3),0.0,1.0);',
        '  vec3 canopy=mix(vec3(0.06,0.13,0.09),vec3(0.015,0.04,0.05),night); canopy*=0.55+0.85*fbm(vec2(a*110.0,hg*34.0));',
        '  float biolum=step(0.93,hash21(floor(vec2(a*220.0,hg*150.0))))*(0.4+0.6*night);',
        '  vec3 c=canopy+biolum*vec3(0.25,0.7,0.55)*0.5; c=mix(sk*0.85,c,clamp(up*1.9,0.18,1.0)); return c; }',
        'vec3 shadeCity(float a,float hg,float cr,float fc,float kind,float laz,vec3 lc,vec3 sk,float night,float t){',
        '  float up=clamp(hg/max(cr,1e-3),0.0,1.0);',
        '  vec3 stone=mix(vec3(0.16,0.15,0.20),vec3(0.04,0.045,0.09),night); stone*=0.85+0.22*(0.5+0.5*sin(fc*70.0));',
        '  float face=0.5+0.5*cos(a-laz); stone+=lc*face*0.10; vec3 c=stone;',
        '  if(kind<1.5){ float gx=floor(fc*16.0),gy=floor(up*11.0); vec2 wf=fract(vec2(fc*16.0,up*11.0))-0.5;',
        '    float lit=step(0.45,hash21(vec2(gx,gy)+floor(a*5.0)));',
        '    float win=smoothstep(0.34,0.16,max(abs(wf.x),abs(wf.y)));',
        '    float flick=0.7+0.3*sin(t*3.0+hash21(vec2(gx,gy))*30.0);',
        '    c+=win*lit*flick*vec3(1.0,0.72,0.34)*(0.3+1.0*night)*step(0.06,up)*step(up,0.95); }',
        '  else { vec3 gc=mix(vec3(0.55,0.45,0.85),vec3(0.55,0.75,1.0),night);',
        '    float g=glyph(vec2(fc-0.5,up-0.5)*vec2(3.2,2.2))*(0.6+0.4*sin(t*1.5+a*3.0)); c+=g*gc*(0.5+0.8*night); }',
        '  c+=sk*smoothstep(0.72,1.0,up)*0.32; c=mix(sk*0.85,c,clamp(up*1.7,0.16,1.0)); return c; }',
        'void main(){',
        '  float night=uDayNight; float t=uTime;',
        '  vec2 q=vWorld.xz-uCenter.xz; float a=atan(q.y,q.x); float hgt=clamp(vWorld.y/uWallH,0.0,1.0);',
        '  float bloodM=step(0.5,uSkyEvent)*step(uSkyEvent,1.5)*uSkyAmt;',
        '  float bsun=step(1.5,uSkyEvent)*step(uSkyEvent,2.5)*uSkyAmt; float lun=step(2.5,uSkyEvent)*uSkyAmt;',
        '  vec3 sunDir=normalize(vec3(0.50,0.40,-0.58)); vec3 moonDir=normalize(vec3(-0.50,0.40,0.56));',
        '  float lightAz=mix(atan(sunDir.z,sunDir.x),atan(moonDir.z,moonDir.x),night);',
        '  vec3 lightCol=mix(vec3(1.0,0.85,0.55),vec3(0.55,0.68,0.95),night); lightCol=mix(lightCol,vec3(0.95,0.25,0.15),bloodM);',
        '  vec3 skyTint=mix(vec3(0.62,0.74,0.86),vec3(0.06,0.10,0.20),night);',
        '  float fc,kind; float cc=cityCrest(a,fc,kind); float mc=mtnCrest(a); float fcr=forestCrest(a);',
        '  vec3 col;',
        '  if(fcr>0.004 && hgt<=fcr){ col=shadeFor(a,hgt,fcr,skyTint,night); }',           // forest (nearest)
        '  else if(kind>=0.0 && hgt<=cc){ col=shadeCity(a,hgt,cc,fc,kind,lightAz,lightCol,skyTint,night,t); }', // city (mid)
        '  else if(hgt<=mc){ col=shadeMtn(a,hgt,mc,lightAz,lightCol,skyTint,night); }',     // mountains (back)
        '  else { discard; }',                                                              // sky above the crest
        '  col=mix(col,col*vec3(1.4,0.5,0.45),bloodM*0.5); col=mix(col,col*vec3(0.55,0.55,0.65),(bsun+lun)*0.4);',
        '  float lum=dot(col,vec3(0.299,0.587,0.114)); col=mix(col,vec3(lum),uWeather.x*0.3);',
        '  col=mix(col,col*vec3(0.85,0.95,1.15),uWeather.y*0.4); col=mix(col,col*vec3(1.15,1.0,0.75),uWeather.z*0.35);',
        '  col=col/(col+vec3(0.6)); col=pow(max(col,0.0),vec3(0.95));',
        '  gl_FragColor=vec4(col,1.0);',
        '}'
        ].join('\n');
    }

    var _ENV_DOME_VS =
        'varying vec3 vDir;\n' +
        'void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vDir=wp.xyz-cameraPosition; gl_Position=projectionMatrix*viewMatrix*wp; }';

    function _envDomeFS() {
        return 'varying vec3 vDir;\n' + _ENV_COMMON + '\n' +
        'void main(){\n' +
        '  vec3 rd=normalize(vDir); float night=uDayNight; float t=uTime;\n' +
        '  float wStorm=uWeather.x,wSnow=uWeather.y,wSand=uWeather.z,wBlood=uWeather.w;\n' +
        '  float bloodM=step(0.5,uSkyEvent)*step(uSkyEvent,1.5)*uSkyAmt;\n' +
        '  float bsun=step(1.5,uSkyEvent)*step(uSkyEvent,2.5)*uSkyAmt;\n' +
        '  float lun=step(2.5,uSkyEvent)*uSkyAmt;\n' +
        '  vec3 sunDir=normalize(vec3(0.50+0.03*sin(t*0.05),0.40,-0.58));\n' +
        '  vec3 moonDir=normalize(vec3(-0.50,0.40,0.56+0.03*sin(t*0.04)));\n' +
        '  float el=rd.y; float az=atan(rd.x,rd.z); float lat=asin(clamp(el,-1.0,1.0))/(PI*0.5);\n' +
        '  vec2 sph=vec2(az/PI, lat);\n' +
        '  vec2 nd=vec2(az/PI, el);\n' +
        // ── seamless deep-space gradient (no horizon line at all) ──
        '  float v=el*0.5+0.5;\n' +
        '  vec3 deepLo=mix(vec3(0.060,0.040,0.092),vec3(0.022,0.014,0.048),night);\n' +
        '  vec3 deepMd=mix(vec3(0.034,0.034,0.078),vec3(0.012,0.011,0.030),night);\n' +
        '  vec3 deepHi=mix(vec3(0.014,0.024,0.060),vec3(0.004,0.006,0.020),night);\n' +
        '  vec3 col=mix(deepLo,deepMd,smoothstep(0.0,0.55,v)); col=mix(col,deepHi,smoothstep(0.45,1.0,v));\n' +
        // ── volumetric nebula clouds, slowly drifting, multi-hue ──
        '  float n1=fbm(nd*vec2(2.4,3.0)+vec2(t*0.004,0.0));\n' +
        '  float n2=fbm(nd*vec2(5.5,6.5)-vec2(t*0.006,0.4));\n' +
        '  float n3=fbm(nd*vec2(11.0,13.0)+vec2(0.0,t*0.003));\n' +
        '  float neb=clamp(n1*0.65+n2*0.45+n3*0.20-0.34,0.0,1.0); neb=pow(neb,1.6);\n' +
        '  vec3 nebMag =mix(vec3(0.46,0.12,0.52),vec3(0.22,0.05,0.34),night);\n' +
        '  vec3 nebTeal=mix(vec3(0.06,0.30,0.44),vec3(0.03,0.14,0.26),night);\n' +
        '  vec3 nebGold=mix(vec3(0.55,0.30,0.18),vec3(0.30,0.16,0.10),night);\n' +
        '  float mxA=fbm(nd*1.6+7.0); float mxB=fbm(nd*2.3-3.0);\n' +
        '  vec3 nebCol=mix(nebTeal,nebMag,smoothstep(0.30,0.70,mxA)); nebCol=mix(nebCol,nebGold,smoothstep(0.55,0.85,mxB)*0.6);\n' +
        '  col+=neb*nebCol*(0.95+0.5*night);\n' +
        // ── galactic band: a great-circle milky way, dust + denser stars ──
        '  vec3 gaxis=normalize(vec3(0.36,0.52,-0.77)); float gb=dot(rd,gaxis); float band=exp(-gb*gb*9.0);\n' +
        '  float bandTex=fbm(nd*vec2(7.0,3.0)+vec2(5.0,0.0));\n' +
        '  col+=band*(0.30+0.55*bandTex)*mix(vec3(0.30,0.26,0.40),vec3(0.18,0.16,0.30),night);\n' +
        // ── sky-event mood applied to the backdrop (stars stay crisp on top) ──
        '  col=mix(col,col*vec3(1.5,0.42,0.38)+vec3(0.04,0.0,0.0),bloodM*0.55);\n' +
        '  col=mix(col,col*vec3(0.45,0.45,0.60),bsun*0.5);\n' +
        '  col=mix(col,col*vec3(0.55,0.55,0.70),lun*0.40);\n' +
        // ── layered starfield: size / brightness / colour variation + twinkle ──
        '  vec3 starAcc=vec3(0.0);\n' +
        '  for(int li=0;li<4;li++){ float fl=float(li); float sc=34.0+fl*46.0;\n' +
        '    vec2 uv=vec2(sph.x*sc*1.9, lat*sc); vec2 g=floor(uv), f=fract(uv); float h=hash21(g+fl*23.1);\n' +
        '    float thr=0.92 - band*0.10 - fl*0.012;\n' +
        '    if(h>thr){ vec2 c=hash22(g+fl*4.3); float d=length(f-c);\n' +
        '      float sz=0.05+0.13*hash11(h*13.7); float core=smoothstep(sz,0.0,d); float halo=exp(-d*d*55.0)*0.35;\n' +
        '      float tw=0.55+0.45*sin(t*(0.8+hash11(h*7.3)*3.5)+h*52.0);\n' +
        '      float mag=hash11(h*5.1); float bri=(core+halo)*tw*(0.35+0.85*mag*mag);\n' +
        '      vec3 sct=mix(vec3(0.65,0.78,1.0),vec3(1.0,0.86,0.62),hash11(h*9.9));\n' +
        '      sct=mix(sct,vec3(1.0,0.50,0.45),step(0.97,hash11(h*3.3))*0.7);\n' +
        '      starAcc+=sct*bri; } }\n' +
        '  col+=starAcc*(1.0+0.5*night)*(1.0-0.6*wStorm);\n' +
        // ── zodiac wheel nodes ──
        '  for(int i=0;i<12;i++){ float fi=float(i); float a=fi/12.0*TAU;\n' +
        '    vec3 zd=normalize(vec3(sin(a)*0.85,0.42,-cos(a)*0.85));\n' +
        '    float dz=acos(clamp(dot(rd,zd),-1.0,1.0));\n' +
        '    float zAct=step(abs(mod(uZodiac-fi+6.0,12.0)-6.0),0.5);\n' +
        '    float node=smoothstep(0.03,0.0,dz); float glo=exp(-dz*10.0);\n' +
        '    vec3 zc=mix(vec3(0.50,0.55,0.82),vec3(1.0,0.84,0.42),zAct);\n' +
        '    col+=(node*(0.5+1.0*zAct)+glo*0.16*(0.3+zAct))*zc*(0.4+0.6*night); }\n' +
        // ── active constellation ──
        '  vec3 cDir=normalize(vec3(0.16,0.5,-0.82));\n' +
        '  vec3 rgt=normalize(cross(vec3(0.0,1.0,0.0),cDir)); vec3 upv=normalize(cross(cDir,rgt));\n' +
        '  for(int k=0;k<6;k++){ float fk=float(k);\n' +
        '    vec2 off=(hash22(vec2(uZodiac*13.0+fk*1.7,fk*5.0))-0.5)*0.32;\n' +
        '    vec3 cn=normalize(cDir+rgt*off.x+upv*off.y);\n' +
        '    float dcc=acos(clamp(dot(rd,cn),-1.0,1.0)); float br=0.6+0.6*hash11(uZodiac*3.0+fk);\n' +
        '    col+=smoothstep(0.012,0.0,dcc)*vec3(1.0,0.92,0.66)*br*(0.55+0.45*night);\n' +
        '    col+=exp(-dcc*42.0)*vec3(0.8,0.85,1.0)*0.12*(0.4+0.6*night); }\n' +
        // ── sun (a warm star, or a black sun during a solar eclipse) ──
        '  float sa=acos(clamp(dot(rd,sunDir),-1.0,1.0)); float sunVis=1.0-night*0.85; float sunR=0.05;\n' +
        '  float disc=smoothstep(sunR,sunR*0.8,sa); float corona=exp(-sa*5.0)*0.8+exp(-sa*1.3)*0.18;\n' +
        '  vec3 sunWarm=mix(vec3(1.0,0.92,0.70),vec3(1.0,0.66,0.32),wSand);\n' +
        '  vec3 sunC=disc*sunWarm*3.0+corona*sunWarm*1.2;\n' +
        '  vec3 blackSunC=-disc*vec3(2.5)+smoothstep(sunR*1.7,sunR*1.05,abs(sa-sunR*1.25))*vec3(1.0,0.9,0.7)*2.8+corona*vec3(0.9,0.7,0.95)*0.5;\n' +
        '  col+=mix(sunC*sunVis,blackSunC,bsun);\n' +
        // ── moon ──
        '  float ma=acos(clamp(dot(rd,moonDir),-1.0,1.0)); float moonVis=0.35+0.65*night; float moonR=mix(0.06,0.095,bloodM);\n' +
        '  float mdisc=smoothstep(moonR,moonR*0.85,ma); float craters=fbm((rd.xy-moonDir.xy)*42.0);\n' +
        '  vec3 moonGrey=vec3(0.85,0.88,0.95)*(0.8+0.3*craters); float mGlow=exp(-ma*7.0)*0.4;\n' +
        '  vec3 moonC=mdisc*moonGrey*1.6+mGlow*moonGrey*0.6;\n' +
        '  vec3 moonRed=vec3(0.75,0.12,0.07)*(0.7+0.5*craters);\n' +
        '  vec3 moonEv=mdisc*moonRed*2.0+exp(-ma*3.5)*vec3(0.7,0.12,0.08)*0.8;\n' +
        '  col+=mix(moonC*moonVis,moonEv,max(bloodM,lun));\n' +
        '  col+=smoothstep(0.85,1.0,el)*mix(vec3(0.10,0.08,0.18),vec3(0.30,0.25,0.45),night)*0.14*uOccult;\n' +
        // ── storm overcast: seamless, weighted to the lower sky, no hard edge ──
        '  if(wStorm>0.01){ float cl=fbm(vec2(az*2.2+t*0.05, v*3.0 - t*0.02));\n' +
        '    float cover=smoothstep(0.70,0.12,v);\n' +
        '    vec3 cloud=mix(vec3(0.16,0.17,0.22),vec3(0.03,0.035,0.06),night);\n' +
        '    col=mix(col,cloud,cover*smoothstep(0.40,0.70,cl)*wStorm*0.85); }\n' +
        '  float lum=dot(col,vec3(0.299,0.587,0.114)); col=mix(col,vec3(lum),wStorm*0.25); col*=mix(1.0,0.72,wStorm*0.5);\n' +
        '  col=mix(col,col*vec3(0.85,0.95,1.15)+vec3(0.04,0.06,0.09),wSnow*0.4);\n' +
        '  col=mix(col,col*vec3(1.18,1.00,0.74)+vec3(0.05,0.03,0.0),wSand*0.35);\n' +
        '  col=mix(col,col*vec3(1.30,0.50,0.45)+vec3(0.05,0.0,0.0),wBlood*0.45);\n' +
        '  col=col/(col+vec3(0.6)); col=pow(max(col,0.0),vec3(0.92));\n' +
        '  gl_FragColor=vec4(col,1.0);\n' +
        '}';
    }

    function _initEnvironment() {
        if (_envInited || !scene || typeof THREE === 'undefined') return;
        try {
            _envUni = {
                uTime: { value: 0 },
                uDayNight: { value: 0 },
                uSkyEvent: { value: 0 },
                uSkyAmt: { value: 0 },
                uZodiac: { value: 0 },
                uWeather: { value: new THREE.Vector4(0, 0, 0, 0) },
                uOccult: { value: 0.5 },
                uCenter: { value: new THREE.Vector3(0, 0, 0) },
                uDiscR: { value: 9000 },
                uWallH: { value: _ENV_WALL_H },
                uTile: { value: 128 }
            };

            var groundMat = new THREE.ShaderMaterial({
                uniforms: _envUni, vertexShader: _ENV_WORLD_VS, fragmentShader: _envGroundFS(),
                side: THREE.DoubleSide, depthWrite: true, fog: false
            });
            groundMat.extensions = { derivatives: true };
            var gGeo = new THREE.CircleGeometry(1, 160); gGeo.rotateX(-Math.PI / 2);
            _envGround = new THREE.Mesh(gGeo, groundMat);
            _envGround.renderOrder = -50; _envGround.frustumCulled = false;

            var wallMat = new THREE.ShaderMaterial({
                uniforms: _envUni, vertexShader: _ENV_WORLD_VS, fragmentShader: _envWallFS(),
                side: THREE.BackSide, depthWrite: true, fog: false
            });
            var wGeo = new THREE.CylinderGeometry(1, 1, 1, 160, 1, true);
            _envWall = new THREE.Mesh(wGeo, wallMat);
            _envWall.renderOrder = -60; _envWall.frustumCulled = false;
            // The enclosing ring wall is retired in favour of real scattered
            // horizon scenery (see _buildHorizonScenery). Hidden, not removed, so
            // the dome + ground disc form an open ground-meets-sky horizon.
            _envWall.visible = false;

            var domeMat = new THREE.ShaderMaterial({
                uniforms: _envUni, vertexShader: _ENV_DOME_VS, fragmentShader: _envDomeFS(),
                side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false
            });
            var dGeo = new THREE.SphereGeometry(1, 48, 24);
            _envDome = new THREE.Mesh(dGeo, domeMat);
            _envDome.renderOrder = -1000; _envDome.frustumCulled = false;

            _envGroup = new THREE.Group();
            _envGroup.add(_envDome, _envWall, _envGround);
            scene.add(_envGroup);
            _envInited = true;
            console.log('[ThreeRenderer] firmament environment initialized');
        } catch (e) {
            console.warn('[ThreeRenderer] environment init failed', e);
        }
    }

    function _envReadState() {
        var night = 0;
        try {
            if (typeof getCurrentCyclePhase === 'function') night = getCurrentCyclePhase() === 'night' ? 1 : 0;
            else if (document.body && document.body.dataset) night = document.body.dataset.cycle === 'night' ? 1 : 0;
        } catch (e) {}
        var ev = 0;
        if (typeof state !== 'undefined' && state && state.skyEvent && state.skyEvent.type) {
            var m = { bloodMoon: 1, solarEclipse: 2, lunarEclipse: 3 };
            ev = m[state.skyEvent.type] || 0;
        }
        var zi = 0;
        var ZL = (typeof AVAILABLE_ZODIACS !== 'undefined') ? AVAILABLE_ZODIACS : window.AVAILABLE_ZODIACS;
        if (typeof state !== 'undefined' && state && state.activeZodiac && ZL) {
            var ki = ZL.indexOf(state.activeZodiac); if (ki >= 0) zi = ki;
        }
        var w = { storm: 0, snow: 0, sand: 0, blood: 0 };
        var aw = (typeof state !== 'undefined' && state && state.activeWeather) || [];
        for (var i = 0; i < aw.length; i++) {
            switch (aw[i] && aw[i].type) {
                case 'tornado': case 'hurricane': case 'thunderstorm':
                case 'earthquake': case 'tesseractStorm': w.storm = 1; break;
                case 'blizzard': w.snow = 1; break;
                case 'sandstorm': case 'drought': case 'solarFlare': w.sand = 1; break;
                case 'bloodRain': w.blood = 1; break;
            }
        }
        return { night: night, ev: ev, zi: zi, w: w };
    }

    function _updateEnvironment() {
        if (!_envInited || !_envUni) return;
        var ts = CONFIG.tileSize || 128;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        var discR = Math.min(11000, Math.max(6000, Math.max(_bw, _bh) * ts * 2.5 + 3500));

        _envUni.uCenter.value.set(cx, 0, cz);
        _envUni.uDiscR.value = discR;
        _envUni.uWallH.value = _ENV_WALL_H;
        _envUni.uTile.value = ts;

        // No ground plane and no rift disc — both created a hard horizon line.
        // The full-sphere cosmic dome is now the one seamless backdrop in every
        // direction, so the board and scenery read as floating in open space.
        if (_envGround) _envGround.visible = false;
        if (_envWall) { _envWall.position.set(cx, _ENV_WALL_H * 0.5, cz); _envWall.scale.set(discR, _ENV_WALL_H, discR); }
        if (_envDome) {
            var camo = ThreeCamera.getCamera();
            if (camo) _envDome.position.copy(camo.position);
            _envDome.scale.setScalar(_ENV_DOME_R);
        }

        var s = _envReadState(), S = _envSmooth, k = 0.05;
        S.night += ((s.night ? 1 : 0) - S.night) * k;
        S.skyAmt += ((s.ev > 0 ? 1 : 0) - S.skyAmt) * k;
        if (s.ev > 0) S.skyEvent = s.ev;
        S.zodiac += (s.zi - S.zodiac) * 0.08;
        S.storm += (s.w.storm - S.storm) * k;
        S.snow += (s.w.snow - S.snow) * k;
        S.sand += (s.w.sand - S.sand) * k;
        S.blood += (s.w.blood - S.blood) * k;

        _envUni.uDayNight.value = S.night;
        _envUni.uSkyEvent.value = S.skyEvent;
        _envUni.uSkyAmt.value = S.skyAmt;
        _envUni.uZodiac.value = S.zodiac;
        _envUni.uWeather.value.set(S.storm, S.snow, S.sand, S.blood);
        _envUni.uTime.value = performance.now() / 1000;

        // keep the real horizon scenery in sync + atmospherically graded
        _buildHorizonScenery();
        _animateFloaters(_envUni.uTime.value);
        _gradeHorizonScenery(S.night, S.skyEvent, S.skyAmt);

        // volumetric light shafts raking down onto the board
        _buildLightRays();
        _updateLightRays(_envUni.uTime.value, S.night, S.skyEvent, S.skyAmt);
    }

    // ════════════════════════════════════════════════════════════════════
    //  VOID SCENERY
    //  Surreal landmarks built from real THREE geometry, telling an abstract,
    //  apocalyptic, esoteric visual story. There is no floor: the board floats
    //  in an open void and these bodies hang suspended all around it — at varied
    //  directions, depths and elevations (far below the board as well as high
    //  above) — every one drifting gently. The cast: nexus-textured floating
    //  peaks, greek colonnade ruins, stairways to nowhere, great pyramids,
    //  stepped ziggurats, gateways to nowhere, obelisks, leaning black
    //  monoliths, toppled colossi, broken sky-islands, drifting crystal clusters
    //  and sacred-geometry orbital haloes. Everything is solid world geometry so
    //  it tilts / rotates / zooms with the map, and it is graded by the
    //  day/night cycle + sky events just like the rest of the scene.
    // ════════════════════════════════════════════════════════════════════
    var _horizonGroup = null, _horizonKey = '', _horizonMats = [];
    var _horizonFloaters = [];          // { obj, baseY, amp, spd, phase, spin }
    var _HZ_DAY = null, _HZ_NIGHT = null, _hzScratch = null;

    // ── Atmospheric haze (lightweight "background fog") ──
    // Real depth fog is keyed on camera distance, but our camera orbits far from
    // the board, so scene.fog would grey out the playfield. Instead we fade only
    // the far background scenery toward a pale haze colour by WORLD distance — a
    // few colour-lerps on materials we already grade each frame, so it costs
    // nothing extra and never touches the board, units or terrain.
    var _HZ_HAZE_DAY = null, _HZ_HAZE_NIGHT = null, _hzHaze = null;

    // ── Volumetric light shafts (god rays) ──
    // A handful of additive box-prism beams raking down onto the board. Solid
    // world geometry, so they tilt / orbit with the map and read as real shafts
    // of light. Tiny fragment shader + 6 meshes ⇒ negligible cost.
    var _rayGroup = null, _rayKey = '', _rayShafts = [];
    var _RAY_VS = null, _RAY_FS = null;
    var _RAY_DAY = null, _RAY_NIGHT = null, _rayCol = null, _RAY_RED = null;

    function _mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function _objUrl(k) {
        var s = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[k] : null;
        return s ? s.url : null;
    }

    // Flat textured billboard; its width is corrected to the real sprite aspect
    // as soon as the image loads, so buildings/trees/columns aren't stretched.
    function _horizonBillboard(url, h, dfltAspect) {
        if (!url) return null;
        var mat = new THREE.MeshBasicMaterial({
            transparent: true, alphaTest: 0.22, side: THREE.DoubleSide, depthWrite: true, fog: false
        });
        _horizonMats.push(mat);
        var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.scale.set(h * dfltAspect, h, 1);
        m.position.y = h * 0.5; m.frustumCulled = false;
        function _fit(t) {
            if (!t || !t.image) return;
            var iw = t.image.naturalWidth || t.image.width, ih = t.image.naturalHeight || t.image.height;
            if (iw && ih) m.scale.x = h * (iw / ih);
        }
        var tex = getTexture(url, _fit);
        mat.map = tex; mat.needsUpdate = true;
        _fit(tex);
        var g = new THREE.Group(); g.add(m); return g;
    }

    // Distant mountain peak, textured with the nexus terrain sprite.
    function _hzMountain(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('nexus');
        var h = ts * (9 + rng() * 10);
        var r = h * (0.55 + rng() * 0.40);               // base radius
        var seg = 5 + (rng() * 3 | 0);                   // low-poly, faceted peak
        var geo = new THREE.ConeGeometry(r, h, seg, 1, false);
        // tile around the base circumference and up the slant for terrain density
        _hzScaleUV(geo, Math.max(1, (2 * Math.PI * r) / ts), Math.max(1, h / ts));
        var m = new THREE.Mesh(geo, _hzGeoMat(tex, 0xffffff));
        m.position.y = h * 0.5; m.frustumCulled = false;
        g.add(m);
        return g;
    }

    // ── geometry helpers for the landmark structures ──
    // Dedicated horizon texture instances (one per terrain key) loaded through
    // the module loader so they upload reliably once the PNG arrives. We keep
    // repeat at 1×1 and tile via geometry UVs instead, so the textures are
    // never shared with — or mutated against — the in-world terrain tiles, and
    // every face keeps the same pixel density as the rest of the game.
    var _hzTexCache = {};
    function _hzTex(terrainKey) {
        if (_hzTexCache[terrainKey] !== undefined) return _hzTexCache[terrainKey];
        var url = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES[terrainKey]) ? TERRAIN_SPRITES[terrainKey][0] : null;
        if (!url) { _hzTexCache[terrainKey] = null; return null; }
        var tex = textureLoader.load(url);        // fresh instance; onLoad sets image + needsUpdate
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
        _hzTexCache[terrainKey] = tex;
        return tex;
    }

    // Tile a box's UVs so each face shows ~one texture per tileSize, per-face
    // (so a wide base and a tall column keep the same pixel density).
    function _hzBoxUV(geo, w, h, d, ts) {
        var uv = geo.attributes && geo.attributes.uv; if (!uv) return;
        var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // px,nx,py,ny,pz,nz
        for (var face = 0; face < 6; face++) {
            var su = dims[face][0] / ts, sv = dims[face][1] / ts;
            for (var v = 0; v < 4; v++) {
                var idx = face * 4 + v;
                if (idx >= uv.count) break;
                uv.setXY(idx, uv.getX(idx) * su, uv.getY(idx) * sv);
            }
        }
        uv.needsUpdate = true;
    }

    // Uniformly tile a geometry's 0..1 UVs (cylinders / spheres) by (su, sv).
    function _hzScaleUV(geo, su, sv) {
        var uv = geo.attributes && geo.attributes.uv; if (!uv) return;
        for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
        uv.needsUpdate = true;
    }

    // Textured MeshBasicMaterial registered for day/night grading. The grade
    // pass multiplies the texture by `base` * the atmospheric tint, so `base`
    // sets the structure's intrinsic stone/wood/foliage colour.
    function _hzGeoMat(tex, base) {
        var mat = new THREE.MeshBasicMaterial({
            map: tex || null,
            color: new THREE.Color(base == null ? 0xffffff : base),
            side: THREE.FrontSide, depthWrite: true, fog: false
        });
        mat._ew_hzBase = new THREE.Color(base == null ? 0xffffff : base);
        _horizonMats.push(mat);
        return mat;
    }

    // box mesh whose UVs tile per-face at terrain pixel density
    function _hzBox(w, h, d, ts, mat) {
        var geo = new THREE.BoxGeometry(w, h, d);
        _hzBoxUV(geo, w, h, d, ts);
        return new THREE.Mesh(geo, mat);
    }
    // cylinder whose UVs tile around the circumference + up the height
    function _hzCyl(rTop, rBot, h, seg, ts, mat) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
        var rAvg = (rTop + rBot) * 0.5;
        _hzScaleUV(geo, Math.max(1, (2 * Math.PI * rAvg) / ts), Math.max(1, h / ts));
        return new THREE.Mesh(geo, mat);
    }

    // A surreal floating stairway climbing up and ending in mid-air.
    function _hzStairway(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var topTex = _hzTex('bricks_3');
        var sideTex = _hzTex('ruins') || topTex;
        var steps = 16 + (rng() * 12 | 0);
        var stepW = ts * (2.4 + rng() * 1.8);
        var rise = ts * (0.55 + rng() * 0.25);
        var depth = ts * (0.85 + rng() * 0.35);
        var th = rise * 0.4;
        var lean = (rng() - 0.5) * 0.18;                 // slight sideways drift
        var topMat = _hzGeoMat(topTex, 0xe6ddca);
        var sideMat = _hzGeoMat(sideTex, 0xb3a892);
        var mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
        for (var s = 0; s < steps; s++) {
            var geo = new THREE.BoxGeometry(stepW, th, depth);
            _hzBoxUV(geo, stepW, th, depth, ts);
            var tread = new THREE.Mesh(geo, mats);
            tread.position.set(s * stepW * lean, rise * (s + 0.5), -depth * s);
            g.add(tread);
        }
        return g;
    }

    // Abandoned greek temple — a stylobate, a colonnade of (some broken)
    // columns and a partial entablature beam.
    function _hzGreekRuin(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var stoneTex = _hzTex('bricks_2');
        var beamTex = _hzTex('ruins') || stoneTex;
        var cols = 4 + (rng() * 4 | 0);
        var spacing = ts * 2.0;
        var colH = ts * (5 + rng() * 3);
        var colR = ts * 0.55;
        var baseW = spacing * (cols - 1) + ts * 2.2;
        var baseH = ts * 1.1;
        var baseD = ts * 3.0;

        var stylobate = _hzBox(baseW, baseH, baseD, ts, _hzGeoMat(stoneTex, 0xe2d8bf));
        stylobate.position.y = baseH * 0.5;
        g.add(stylobate);

        var startX = -spacing * (cols - 1) / 2;
        var allIntact = true;
        for (var c = 0; c < cols; c++) {
            var broken = rng() < 0.35;
            var h = broken ? colH * (0.3 + rng() * 0.45) : colH;
            if (broken) allIntact = false;
            var col = _hzCyl(colR * 0.9, colR, h, 12, ts, _hzGeoMat(stoneTex, 0xe6dcc4));
            col.position.set(startX + c * spacing, baseH + h * 0.5, 0);
            g.add(col);
            if (!broken) {
                var cw = colR * 2.5, capH = ts * 0.4;
                var cap = _hzBox(cw, capH, cw, ts, _hzGeoMat(stoneTex, 0xe6dcc4));
                cap.position.set(startX + c * spacing, baseH + h + ts * 0.18, 0);
                g.add(cap);
            }
        }
        // entablature beam spanning the colonnade when enough columns survive
        if (allIntact || rng() < 0.5) {
            var span = allIntact ? baseW * 0.96 : baseW * (0.4 + rng() * 0.4);
            var bh = ts * 0.7, bd = colR * 2.6;
            var beam = _hzBox(span, bh, bd, ts, _hzGeoMat(beamTex, 0xd8cdb0));
            beam.position.set(allIntact ? 0 : startX + ts, baseH + colH + ts * 0.5, 0);
            g.add(beam);
        }
        return g;
    }

    // Uniformly tile a non-box geometry (cone / cylinder / torus / poly) whose
    // base UVs span 0..1, by an approximate world size so it keeps terrain
    // pixel density. Thin wrapper around _hzScaleUV for readability.
    function _hzTileUV(geo, worldU, worldV, ts) {
        _hzScaleUV(geo, Math.max(1, worldU / ts), Math.max(1, worldV / ts));
    }

    // A great pyramid. Some are pristine; others are tilted and half-swallowed
    // by the ground — monuments of a civilisation the apocalypse came for.
    function _hzPyramid(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex(rng() < 0.5 ? 'desert' : 'wasteland') || _hzTex('scorched');
        var base = rng() < 0.5 ? 0xd6c39a : 0xb6a78c;
        var h = ts * (7 + rng() * 8);
        var r = h * (0.78 + rng() * 0.35);
        var geo = new THREE.ConeGeometry(r, h, 4, 1, false);
        _hzTileUV(geo, r, h, ts);
        var m = new THREE.Mesh(geo, _hzGeoMat(tex, base));
        m.rotation.y = Math.PI / 4;                       // present a flat face
        m.position.y = h * 0.5;
        g.add(m);
        if (rng() < 0.45) {                               // tilted & sinking
            g.rotation.z = (rng() - 0.5) * 0.5;
            g.position.y = -h * (0.10 + rng() * 0.28);
        }
        return g;
    }

    // Mesopotamian stepped ziggurat — diminishing terraces crowned by a shrine.
    function _hzZiggurat(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('bricks_1') || _hzTex('ruins');
        var tiers = 4 + (rng() * 3 | 0);
        var w = ts * (6 + rng() * 3.5);
        var th = ts * (0.9 + rng() * 0.4);
        var y = 0;
        for (var i = 0; i < tiers; i++) {
            var f = 1 - i / (tiers + 1.2);
            var tw = w * f;
            var box = _hzBox(tw, th, tw, ts, _hzGeoMat(tex, i % 2 ? 0xc6b694 : 0xd6c6a4));
            box.position.y = y + th * 0.5;
            g.add(box);
            y += th;
        }
        var shrine = _hzBox(w * 0.16, th * 1.5, w * 0.16, ts, _hzGeoMat(tex, 0xb29070));
        shrine.position.y = y + th * 0.75;
        g.add(shrine);
        return g;
    }

    // A solitary leaning monolith — a black obsidian slab, sentinel and omen.
    function _hzMonolith(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('obsidian');
        var h = ts * (8 + rng() * 9);
        var w = ts * (1.5 + rng() * 1.1), d = w * (0.28 + rng() * 0.12);
        var slab = _hzBox(w, h, d, ts, _hzGeoMat(tex, 0x1f232d));
        slab.position.y = h * 0.5;
        g.add(slab);
        g.rotation.z = (rng() - 0.5) * 0.22;              // ominous lean
        g.rotation.x = (rng() - 0.5) * 0.06;
        return g;
    }

    // A free-standing gateway to nowhere — two piers and a lintel framing only
    // sky. Sometimes a pier has crumbled and the lintel hangs broken.
    function _hzGateway(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('bricks_2') || _hzTex('ruins');
        var base = 0xcabfa2;
        var h = ts * (5 + rng() * 4.5);
        var pw = ts * (0.8 + rng() * 0.45);
        var gap = ts * (2.2 + rng() * 1.6);
        var leftBroken = rng() < 0.3;
        var lh = leftBroken ? h * (0.4 + rng() * 0.3) : h;
        var L = _hzBox(pw, lh, pw, ts, _hzGeoMat(tex, base));
        L.position.set(-gap * 0.5, lh * 0.5, 0); g.add(L);
        var R = _hzBox(pw, h, pw, ts, _hzGeoMat(tex, base));
        R.position.set(gap * 0.5, h * 0.5, 0); g.add(R);
        if (!leftBroken) {
            var lint = _hzBox(gap + pw * 2.0, pw * 1.1, pw, ts, _hzGeoMat(tex, base * 1));
            lint.position.set(0, h + pw * 0.5, 0); g.add(lint);
        } else {
            var stub = _hzBox(gap * 0.55, pw * 1.0, pw, ts, _hzGeoMat(tex, 0xb8ad90));
            stub.position.set(gap * 0.18, h + pw * 0.45, 0);
            stub.rotation.z = -0.12; g.add(stub);
        }
        return g;
    }

    // A tapered obelisk capped by a pyramidion — fingers of dead empires.
    function _hzObelisk(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('scorched') || _hzTex('wasteland');
        var h = ts * (7 + rng() * 6);
        var w = ts * (0.6 + rng() * 0.35);
        var geo = new THREE.CylinderGeometry(w * 0.55, w, h, 4, 1);
        _hzTileUV(geo, w, h, ts);
        var shaft = new THREE.Mesh(geo, _hzGeoMat(tex, 0xbcad8e));
        shaft.rotation.y = Math.PI / 4; shaft.position.y = h * 0.5; g.add(shaft);
        var capGeo = new THREE.ConeGeometry(w * 0.78, w * 1.15, 4, 1);
        _hzTileUV(capGeo, w, w, ts);
        var cap = new THREE.Mesh(capGeo, _hzGeoMat(tex, 0xc8b896));
        cap.rotation.y = Math.PI / 4; cap.position.y = h + w * 0.55; g.add(cap);
        return g;
    }

    // A toppled colossus: a felled giant column lying in the dust with its
    // drums scattered around it — the Ozymandias beat of the skyline.
    function _hzColossus(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('bricks_2') || _hzTex('ruins');
        var len = ts * (8 + rng() * 6), r = ts * (0.8 + rng() * 0.4);
        var body = _hzCyl(r, r, len, 12, ts, _hzGeoMat(tex, 0xd0c4a6));
        body.rotation.z = Math.PI / 2; body.position.set(0, r, 0); g.add(body);
        // a broken capital block at one end
        var cap = _hzBox(r * 2.6, r * 1.0, r * 2.6, ts, _hzGeoMat(tex, 0xc6ba9c));
        cap.position.set(-len * 0.5 - r, r, 0); cap.rotation.z = 0.1; g.add(cap);
        var drums = 2 + (rng() * 3 | 0);
        for (var i = 0; i < drums; i++) {
            var dh = ts * (0.7 + rng() * 0.6);
            var drum = _hzCyl(r * 0.95, r, dh, 12, ts, _hzGeoMat(tex, 0xc8bc9e));
            drum.position.set(len * 0.5 + ts * (0.6 + i * 0.95), r * (0.7 + rng() * 0.4), (rng() - 0.5) * ts * 1.6);
            drum.rotation.set((rng() - 0.5) * 0.7, rng() * Math.PI, Math.PI / 2 + (rng() - 0.5) * 0.5);
            g.add(drum);
        }
        return g;
    }

    // A cluster of crystalline shards thrusting from the ground — alien, lit
    // from within. Reused on the ground and floating in the air.
    function _hzCrystalShards(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var tex = _hzTex('crystal') || _hzTex('obsidian');
        var n = 3 + (rng() * 4 | 0);
        for (var i = 0; i < n; i++) {
            var h = ts * (3 + rng() * 6), r = h * (0.14 + rng() * 0.12);
            var geo = new THREE.ConeGeometry(r, h, 5, 1);
            _hzTileUV(geo, r, h, ts);
            var m = new THREE.Mesh(geo, _hzGeoMat(tex, 0x9fb6e8));
            var a = rng() * Math.PI * 2, rad = ts * (0.3 + rng() * 1.6);
            m.position.set(Math.cos(a) * rad, h * 0.5, Math.sin(a) * rad);
            m.rotation.set((rng() - 0.5) * 0.45, rng() * Math.PI, (rng() - 0.5) * 0.45);
            g.add(m);
        }
        return g;
    }

    // A broken-off island of land hovering in the air: a slab top (with a small
    // ruin or crystals) over a tapered rocky underside, debris trailing below.
    function _hzFloatingIsland(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var topTex = _hzTex(rng() < 0.5 ? 'wasteland' : 'scorched') || _hzTex('dirt');
        var rockTex = _hzTex('cliff') || _hzTex('rock');
        var r = ts * (3 + rng() * 3.5), topH = ts * 0.8;
        var top = _hzCyl(r, r * 0.95, topH, 9, ts, _hzGeoMat(topTex, 0xb6a886));
        g.add(top);
        var uh = r * (1.4 + rng() * 0.9);
        var ug = new THREE.ConeGeometry(r * 0.95, uh, 9, 1);
        _hzTileUV(ug, r, uh, ts);
        var under = new THREE.Mesh(ug, _hzGeoMat(rockTex, 0x6e665a));
        under.rotation.x = Math.PI; under.position.y = -topH * 0.5 - uh * 0.5; g.add(under);
        if (rng() < 0.65) {                               // crown it
            var crown = rng() < 0.5 ? _hzGreekRuin(rng) : _hzCrystalShards(rng);
            crown.scale.setScalar(0.5); crown.position.y = topH * 0.5; g.add(crown);
        }
        // a few chunks of falling debris
        var deb = 2 + (rng() * 3 | 0);
        for (var i = 0; i < deb; i++) {
            var s = ts * (0.4 + rng() * 0.5);
            var chunk = _hzBox(s, s, s, ts, _hzGeoMat(rockTex, 0x6a6256));
            var a = rng() * Math.PI * 2;
            chunk.position.set(Math.cos(a) * r * (0.3 + rng() * 0.5), -uh * (0.4 + rng() * 0.8), Math.sin(a) * r * (0.3 + rng() * 0.5));
            chunk.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
            g.add(chunk);
        }
        return g;
    }

    // Sacred-geometry orbital halo — tilted obsidian rings spinning around a
    // glowing crystal core, like a derelict armillary sphere adrift in the sky.
    function _hzSacredRings(rng) {
        var ts = CONFIG.tileSize || 128;
        var g = new THREE.Group();
        var ringTex = _hzTex('obsidian');
        var R = ts * (2.6 + rng() * 2.6);
        var n = 2 + (rng() * 2 | 0);
        for (var i = 0; i < n; i++) {
            var rr = R * (0.6 + i * 0.30);
            var tg = new THREE.TorusGeometry(rr, ts * 0.12, 6, 44);
            _hzTileUV(tg, 2 * Math.PI * rr, ts, ts);
            var ring = new THREE.Mesh(tg, _hzGeoMat(ringTex, 0x8a7fae));
            ring.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
            g.add(ring);
        }
        var core = new THREE.Mesh(new THREE.OctahedronGeometry(ts * 0.62, 0), _hzGeoMat(_hzTex('crystal'), 0xc2cef2));
        g.add(core);
        return g;
    }

    function _buildHorizonScenery() {
        if (!scene || typeof THREE === 'undefined') return;
        var ts = CONFIG.tileSize || 128;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        var discR = Math.min(11000, Math.max(6000, Math.max(_bw, _bh) * ts * 2.5 + 3500));
        var key = cx.toFixed(0) + ',' + cz.toFixed(0) + ',' + discR.toFixed(0);
        if (_horizonGroup && _horizonKey === key) return;
        if (_horizonGroup) { scene.remove(_horizonGroup); _disposeR(_horizonGroup); }
        _horizonMats.length = 0;
        _horizonFloaters.length = 0;
        _horizonGroup = new THREE.Group();
        _horizonGroup.name = 'horizonScenery';
        _horizonGroup.renderOrder = -40;
        _horizonKey = key;

        var rng = _mulberry32(0x5151 + Math.round(discR) + Math.round(cx) * 7 + Math.round(cz) * 13);

        // There is no ground plane any more — the board floats in an open void,
        // and so does everything else. Each landmark is a free-floating body
        // suspended all around the map: varied compass directions, distances AND
        // elevations (well below the board as well as high above it), every one
        // drifting gently. The weighted roster cumulative-thresholds the type;
        // `tumble` bodies (crystals, haloes) spin freely on all axes while the
        // rest hang roughly upright with a slow turn and an organic tilt.
        //   thr,  builder,          tumble, yLoFactor, yHiFactor   (× discR)
        var ROSTER = [
            [0.13, _hzMountain,       false, -0.08,  0.22],   // floating peaks / land-chunks
            [0.24, _hzGreekRuin,      false, -0.45,  0.55],   // colonnade ruins
            [0.33, _hzStairway,       false, -0.50,  0.55],   // stairways to nowhere
            [0.45, _hzPyramid,        false, -0.48,  0.55],   // great pyramids
            [0.53, _hzZiggurat,       false, -0.45,  0.55],   // stepped temples
            [0.61, _hzGateway,        false, -0.45,  0.58],   // gateways to nowhere
            [0.68, _hzObelisk,        false, -0.45,  0.58],   // obelisks
            [0.76, _hzMonolith,       false, -0.52,  0.62],   // leaning monoliths
            [0.82, _hzColossus,       false, -0.45,  0.48],   // toppled colossi
            [0.90, _hzFloatingIsland, false, -0.58,  0.66],   // broken sky-islands
            [0.96, _hzCrystalShards,  true,  -0.60,  0.70],   // crystal clusters
            [1.00, _hzSacredRings,    true,  -0.60,  0.72]    // sacred-geometry haloes
        ];

        var slots = 132;
        for (var i = 0; i < slots; i++) {
            if (rng() < 0.50) continue;                          // open gaps keep the void airy
            var ang = (i / slots) * Math.PI * 2 + (rng() - 0.5) * 0.18;
            var rr = discR * (0.46 + rng() * 0.58);              // varied depth into the void
            var x = cx + Math.cos(ang) * rr;
            var z = cz + Math.sin(ang) * rr;

            var roll = rng(), pick = null;
            for (var ri = 0; ri < ROSTER.length; ri++) {
                if (roll < ROSTER[ri][0]) { pick = ROSTER[ri]; break; }
            }
            if (!pick) continue;
            var mesh = pick[1](rng);
            if (!mesh) continue;
            var tumble = pick[2];
            var y = (pick[3] + rng() * (pick[4] - pick[3])) * discR;
            mesh.position.set(x, y, z);

            var spin;
            if (tumble) {
                mesh.rotation.set(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2);
                spin = (rng() < 0.5 ? 1 : -1) * (0.0012 + rng() * 0.0028);
            } else {
                mesh.rotation.y = Math.atan2(cx - x, cz - z);    // face the board
                mesh.rotation.z += (rng() - 0.5) * 0.10;         // organic float tilt
                mesh.rotation.x += (rng() - 0.5) * 0.06;
                spin = rng() < 0.4 ? (rng() < 0.5 ? 1 : -1) * (0.0003 + rng() * 0.0008) : 0;
            }
            _stampHorizonHaze(mesh, rr, y, discR);
            _horizonGroup.add(mesh);
            _horizonFloaters.push({
                obj: mesh, baseY: y,
                amp: ts * (0.5 + rng() * 1.6),
                spd: 0.08 + rng() * 0.22,
                phase: rng() * Math.PI * 2,
                spin: spin
            });
        }

        scene.add(_horizonGroup);
    }

    // Gentle drift for the floating background scenery — a slow vertical bob
    // plus a lazy spin, giving the skyline cinematic, dream-like motion.
    function _animateFloaters(t) {
        for (var i = 0; i < _horizonFloaters.length; i++) {
            var f = _horizonFloaters[i];
            f.obj.position.y = f.baseY + Math.sin(t * f.spd + f.phase) * f.amp;
            f.obj.rotation.y += f.spin;
        }
    }

    // Tag every material under a background landmark with how much atmospheric
    // haze it should soak up, from its WORLD distance into the void (and a touch
    // extra for bodies hanging far below the board). Done once at build time so
    // the per-frame grade is just a colour-lerp.
    function _stampHorizonHaze(obj, rr, y, discR) {
        var dn = discR > 0 ? Math.min(1, rr / (discR * 1.04)) : 0;
        var hz = Math.pow(Math.max(0, (dn - 0.30) / 0.70), 1.15);   // clear near, hazy far
        var below = (y < 0 && discR > 0) ? Math.min(1, (-y) / (discR * 0.5)) * 0.22 : 0;
        hz = Math.min(0.9, hz + below);
        obj.traverse(function (o) {
            if (!o.material) return;
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            for (var i = 0; i < ms.length; i++) ms[i]._ew_hzHaze = hz;
        });
    }

    function _gradeHorizonScenery(night, skyEvent, skyAmt) {
        if (!_horizonMats.length) return;
        if (!_HZ_DAY) { _HZ_DAY = new THREE.Color(0x9aa6b8); _HZ_NIGHT = new THREE.Color(0x2b3552); _hzScratch = new THREE.Color(); }
        // blood moon washes the skyline red; eclipses cool/desaturate it
        var bloodM = (skyEvent > 0.5 && skyEvent < 1.5) ? skyAmt : 0;
        var ecl = (skyEvent >= 1.5) ? skyAmt : 0;
        _hzScratch.copy(_HZ_DAY).lerp(_HZ_NIGHT, night);
        // The haze tint the far scenery dissolves into — a pale, slightly brighter
        // version of the sky so distant bodies melt into the firmament.
        if (!_HZ_HAZE_DAY) { _HZ_HAZE_DAY = new THREE.Color(0xc4cedd); _HZ_HAZE_NIGHT = new THREE.Color(0x39455f); _hzHaze = new THREE.Color(); }
        _hzHaze.copy(_HZ_HAZE_DAY).lerp(_HZ_HAZE_NIGHT, night);
        if (bloodM > 0.01) _hzHaze.lerp(_HZ_RED || (_HZ_RED = new THREE.Color(0x7a2118)), bloodM * 0.4);
        if (ecl > 0.01) _hzHaze.multiplyScalar(1.0 - ecl * 0.3);
        for (var i = 0; i < _horizonMats.length; i++) {
            var m = _horizonMats[i];
            // geometry landmarks carry an intrinsic base colour; billboards/rocks
            // default to white (so they read as plain texture * atmosphere).
            if (m._ew_hzBase) m.color.copy(m._ew_hzBase).multiply(_hzScratch);
            else m.color.copy(_hzScratch);
            if (m._ew_rock) m.color.multiplyScalar(0.82);
            if (bloodM > 0.01) m.color.lerp(_HZ_RED || (_HZ_RED = new THREE.Color(0x7a2118)), bloodM * 0.5);
            if (ecl > 0.01) m.color.multiplyScalar(1.0 - ecl * 0.35);
            // dissolve the far background into atmospheric haze
            if (m._ew_hzHaze) m.color.lerp(_hzHaze, m._ew_hzHaze);
        }
    }
    var _HZ_RED = null;

    // ════════════════════════════════════════════════════════════════════
    //  VOLUMETRIC LIGHT SHAFTS  (geometry "god rays" cast down on the board)
    //  Each shaft is a tall box prism with an additive shader that fades soft
    //  toward its sides and tapers off at top and bottom, so the solid box
    //  reads as a cone of light. They share one low "sun" direction so they
    //  rake across the board, and being real world geometry they tilt / orbit
    //  with the map and are graded by the day/night cycle + sky events.
    // ════════════════════════════════════════════════════════════════════
    function _ensureRayShaders() {
        if (_RAY_VS) return;
        _RAY_VS =
            'varying vec3 vLocal;\n' +
            'void main(){ vLocal = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
        _RAY_FS =
            'precision mediump float;\n' +
            'varying vec3 vLocal;\n' +
            'uniform float uTime; uniform vec3 uColor; uniform float uIntensity; uniform float uSeed;\n' +
            'void main(){\n' +
            '  float r = length(vec2(vLocal.x, vLocal.z)) * 2.0;\n' +        // 0 core → 1 face edge
            '  float radial = pow(smoothstep(1.0, 0.0, r), 1.7);\n' +        // soft round falloff
            '  float yy = vLocal.y + 0.5;\n' +                              // 0 bottom → 1 top
            '  float vert = smoothstep(0.0, 0.30, yy) * smoothstep(1.0, 0.42, yy);\n' +
            '  float flick = 0.82 + 0.18 * sin(uTime * 1.1 + uSeed + vLocal.y * 5.0);\n' +
            '  float a = radial * vert * uIntensity * flick;\n' +
            '  if (a <= 0.002) discard;\n' +
            '  gl_FragColor = vec4(uColor * a, a);\n' +
            '}';
    }

    function _buildLightRays() {
        if (!scene || typeof THREE === 'undefined') return;
        var ts = CONFIG.tileSize || 128;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var key = _bw + 'x' + _bh + '@' + ts;
        if (_rayGroup && _rayKey === key) return;
        if (_rayGroup) { scene.remove(_rayGroup); _disposeR(_rayGroup); }
        _rayShafts.length = 0;
        _rayGroup = new THREE.Group();
        _rayGroup.name = 'lightShafts';
        _rayGroup.renderOrder = 2;
        _rayKey = key;
        _ensureRayShaders();

        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        var W = _bw * ts, H = _bh * ts;
        var shaftH = Math.max(2200, _bh * ts * 1.1 + 1800);
        // one shared low-sun direction so the beams rake the board consistently
        var sunTiltX = 0.22, sunTiltZ = 0.16, sunYaw = -0.6;
        var rng = _mulberry32(0xBEAC07 + _bw * 131 + _bh * 17 + ts);
        var N = 6;
        for (var i = 0; i < N; i++) {
            var cw = ts * (1.1 + rng() * 1.0);
            var geo = new THREE.BoxGeometry(cw, shaftH, cw);
            var uni = {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xfff0d2) },
                uIntensity: { value: 0.15 + rng() * 0.08 },
                uSeed: { value: rng() * 6.2832 }
            };
            var mat = new THREE.ShaderMaterial({
                uniforms: uni, vertexShader: _RAY_VS, fragmentShader: _RAY_FS,
                transparent: true, blending: THREE.AdditiveBlending,
                depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false
            });
            var m = new THREE.Mesh(geo, mat);
            // scatter landing points across (and a touch beyond) the board
            var lx = cx + (rng() - 0.5) * W * 1.15;
            var lz = cz + (rng() - 0.5) * H * 1.15;
            m.position.set(lx, shaftH * 0.45, lz);   // base dips into the board, top high above
            m.rotation.set(sunTiltX + (rng() - 0.5) * 0.06, sunYaw + (rng() - 0.5) * 0.20, sunTiltZ + (rng() - 0.5) * 0.06);
            m.frustumCulled = false;
            _rayGroup.add(m);
            _rayShafts.push({
                mesh: m, uni: uni, baseInt: uni.uIntensity.value,
                baseRotZ: m.rotation.z, sway: (rng() < 0.5 ? 1 : -1) * (0.02 + rng() * 0.03),
                phase: rng() * 6.2832
            });
        }
        scene.add(_rayGroup);
    }

    function _updateLightRays(t, night, skyEvent, skyAmt) {
        if (!_rayShafts.length) return;
        if (!_RAY_DAY) { _RAY_DAY = new THREE.Color(0xfff0d2); _RAY_NIGHT = new THREE.Color(0x9fb8ff); _rayCol = new THREE.Color(); }
        _rayCol.copy(_RAY_DAY).lerp(_RAY_NIGHT, night);
        var bloodM = (skyEvent > 0.5 && skyEvent < 1.5) ? skyAmt : 0;
        var ecl = (skyEvent >= 1.5) ? skyAmt : 0;
        if (bloodM > 0.01) _rayCol.lerp(_RAY_RED || (_RAY_RED = new THREE.Color(0xff5a3c)), bloodM * 0.6);
        // beams soften at night and all but vanish under an eclipse
        var intMul = (1.0 - night * 0.45) * (1.0 - ecl * 0.7);
        for (var i = 0; i < _rayShafts.length; i++) {
            var s = _rayShafts[i];
            s.uni.uTime.value = t;
            s.uni.uColor.value.copy(_rayCol);
            s.uni.uIntensity.value = s.baseInt * intMul;
            s.mesh.rotation.z = s.baseRotZ + Math.sin(t * 0.25 + s.phase) * s.sway;
        }
    }

    function init() {
        if (initialized) return;
        _parentEl = document.querySelector('.map-center');
        if (!_parentEl) { console.warn('[ThreeRenderer] .map-center not found'); return; }

        canvas = document.createElement('canvas');
        canvas.id = 'threeCanvas';
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;display:none;pointer-events:auto;';
        _parentEl.appendChild(canvas);

        var w = _parentEl.clientWidth || 960, h = _parentEl.clientHeight || 540;
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);

        css2dRenderer = new THREE.CSS2DRenderer();
        css2dRenderer.setSize(w, h);
        css2dRenderer.domElement.id = 'css2dOverlay';
        css2dRenderer.domElement.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:7;display:none;overflow:hidden;';
        _parentEl.appendChild(css2dRenderer.domElement);

        scene = new THREE.Scene();

        terrainGroup = new THREE.Group(); highlightGroup = new THREE.Group();
        objectGroup = new THREE.Group(); unitGroup = new THREE.Group();
        fogGroup = new THREE.Group();
        fogGroup.renderOrder = 10;
        projectileGroup = new THREE.Group(); floatTextGroup = new THREE.Group(); hitFxGroup = new THREE.Group();
        weatherGroup = new THREE.Group();
        _nexusWallGroup = new THREE.Group();
        _nexusWallGroup.renderOrder = 3;

        _nexusBarGroup = new THREE.Group();
        scene.add(terrainGroup, highlightGroup, objectGroup, _nexusWallGroup, unitGroup, fogGroup, weatherGroup, projectileGroup, floatTextGroup, hitFxGroup, _nexusBarGroup);

        ThreeCamera.create(w, h);
        ThreeCamera.setBaseDist(Math.sqrt(w*w+h*h) * 1.2);
        _initBuildingKeys();
        _kickBuildingAlphaScans();
        _ensurePlateStyles();

        if (ThreePost && ThreePost.init) {
            ThreePost.init(renderer, scene, w, h);
        }

        if (ThreeVFX && ThreeVFX.init) {
            ThreeVFX.init(scene);
        }

        _initEnvironment();

        if (window.ThreeLightning && ThreeLightning.init) {
            ThreeLightning.init(scene);
        }

        initialized = true;
        console.log('[ThreeRenderer] initialized (CSS2DRenderer enabled)');
    }

    function activate() {
        if (!initialized) init();
        if (!canvas || !renderer) return;
        active = true;
        canvas.style.display = 'block';
        if (css2dRenderer) css2dRenderer.domElement.style.display = '';
        _ensureIntentBadgeContainer();
        if (_intentBadgeContainer) _intentBadgeContainer.style.display = '';

        var boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.style.visibility = 'hidden';
            boardEl.style.pointerEvents = 'none';
        }
        _ensureFloatTextOverride();

        var boardStageEl = document.getElementById('boardStage');
        if (boardStageEl) {
            boardStageEl.style.position = 'relative';
            boardStageEl.style.zIndex = '10';
            boardStageEl.style.pointerEvents = 'none';
        }

        rebuildTerrain(); rebuildObjects(); rebuildTurrets();
        rebuildNexusWalls();
        rebuildSpawnZoneOverlays();
        rebuildSanctuaryWalls();
        rebuildUnits(); rebuildHighlights(); rebuildFog();
        renderer.setAnimationLoop(renderFrame);
        _bindInput();
        console.log('[ThreeRenderer] activated');
    }

    var _floatTextStyleEl = null;
    function _ensureFloatTextOverride() {
        if (_floatTextStyleEl) return;
        _floatTextStyleEl = document.createElement('style');
        _floatTextStyleEl.textContent = '#board .dio-float-text { visibility: visible !important; }';
        document.head.appendChild(_floatTextStyleEl);
    }

    function deactivate() {
        active = false;
        _clearAnimations();
        _fluidTimeSec = 0;
        _fluidTextures = {};

        /* Clean up tower cube CSS2D plates before clearing */
        for (var ti = 0; ti < _towerCubes.length; ti++) {
            var tc = _towerCubes[ti];
            for (var ci = tc.children.length - 1; ci >= 0; ci--) {
                if (tc.children[ci].isCSS2DObject) tc.remove(tc.children[ci]);
            }
        }
        _towerCubes.length = 0;
        if (_terrainDecoGroup && objectGroup) {
            objectGroup.remove(_terrainDecoGroup);
            _disposeR(_terrainDecoGroup);
        }
        _terrainDecoGroup = null;
        _lastTerrainDecoSerial = '';

        for (var i = 0; i < _tornadoBillboards.length; i++) {
            if (weatherGroup) weatherGroup.remove(_tornadoBillboards[i].mesh);
            _tornadoBillboards[i].mat.dispose();
        }
        _tornadoBillboards.length = 0;
        _lastWeatherOverlayKey = '';
        _lastZoneOverlayKey = '';

        for (var _zdi = 0; _zdi < _zoneBorderMeshes.length; _zdi++) {
            var _zdm = _zoneBorderMeshes[_zdi];
            if (highlightGroup) highlightGroup.remove(_zdm);
            if (_zdm.geometry) _zdm.geometry.dispose();
            if (_zdm.material) _zdm.material.dispose();
        }
        _zoneBorderMeshes.length = 0;
        _zoneBorderMats.length = 0;
        _lastWeatherVfxKey = '';
        if (renderer) renderer.setAnimationLoop(null);
        if (canvas) canvas.style.display = 'none';
        if (css2dRenderer) css2dRenderer.domElement.style.display = 'none';
        _clearNexusBars();
        if (_intentBadgeContainer) _intentBadgeContainer.style.display = 'none';
        clearIntentBadges();
        clearArrows3D();
        clearGhostUnit();
        var boardEl = document.getElementById('board');
        if (boardEl) {
            boardEl.style.visibility = '';
            boardEl.style.pointerEvents = '';
        }

        var boardStageEl = document.getElementById('boardStage');
        if (boardStageEl) {
            boardStageEl.style.position = '';
            boardStageEl.style.zIndex = '';
            boardStageEl.style.pointerEvents = '';
        }
        if (typeof camera !== 'undefined' && camera._apply) camera._apply();
        _unbindInput();

        if (fogGroup) _clearGroup(fogGroup);
        _fogMeshes.clear();
        _fogVisibleKey = '';
        _fogVisibleSet = null;
        _fogLastCheckTime = 0;

        tileMeshes.forEach(function(mesh) { mesh.visible = true; });
        console.log('[ThreeRenderer] deactivated');
    }

    function isActive() { return active; }

    function _updateLavaEmissive() {
        var cycle = (document.body && document.body.dataset && document.body.dataset.cycle) || 'day';
        var isNight = (cycle === 'night');
        var baseInt = isNight ? 0.7 : 0.25;
        var now = performance.now() * 0.001;
        var idx = 0;

        for (var entry of tileMeshes) {
            var mesh = entry[1];
            if (!mesh._ew_isLava) continue;

            var pulse = 1.0
                + 0.15 * Math.sin(now * 1.5 + idx * 2.1)
                + 0.08 * Math.sin(now * 3.7 + idx * 1.3);
            var eInt = baseInt * pulse;
            var mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (var i = 0; i < mats.length; i++) {
                if (mats[i] && mats[i].emissive) {
                    mats[i].emissiveIntensity = eInt;
                }
            }
            idx++;
        }
    }

    function _updateFluidWaves(dt) {
        _fluidTimeSec += dt;
        var t = _fluidTimeSec;
        var types = ['water', 'deep_water', 'lava'];
        for (var ti = 0; ti < types.length; ti++) {
            var fKey = types[ti];
            var drift = _FLUID_DRIFT_3D[fKey];
            if (!drift) continue;
            var off1 = _fluidTextures[fKey + '_off1'];
            var off2 = _fluidTextures[fKey + '_off2'];
            if (off1) {
                off1.x = (drift.l1dx * t) % 1.0;
                off1.y = (drift.l1dy * t) % 1.0;
            }
            if (off2) {
                off2.x = (drift.l2dx * t) % 1.0;
                off2.y = (drift.l2dy * t) % 1.0;
            }
        }
    }

    var _WEATHER_OVERLAY_COLORS = {
        tornado:        0xb4b4b4,
        earthquake:     0xa06428,
        hurricane:      0x508cd8,
        bloodRain:      0xc83232,
        drought:        0xdcb43c,
        solarFlare:     0xffa032,
        thunderstorm:   0x6e96ff,
        tesseractStorm: 0x00ffc8,
        sandstorm:      0xc8a050,
        blizzard:       0x88ccff,
    };
    var _WEATHER_OVERLAY_OPACITY = {
        tornado: 0.22, earthquake: 0.22, hurricane: 0.22,
        bloodRain: 0.25, drought: 0.18, solarFlare: 0.22,
        thunderstorm: 0.22, tesseractStorm: 0.20, sandstorm: 0.20,
        blizzard: 0.22,
    };

    var _ZONE_OVERLAY_COLORS = {
        heal:    0x78dc78,
        debuff:  0xc850c8,
        shield:  0x8cb4ff,
        delayed: 0xdc5050,
    };
    var _ZONE_OVERLAY_NAMES = {
        'Sanctuary':       0xffdc78,
        'Cold Spot':       0x8cd2f0,
        'Bubble':          0x8cb4ff,
        'Star Decree':     0xb478ff,
        'Dimensional Web': 0xb4c8dc,
    };

    var _zoneBorderMats = [];
    var _zoneBorderMeshes = [];

    function _buildZoneBorderEdges(centerX, centerY, radius) {
        var tiles = [];
        var tileSet = {};
        for (var dx = -radius; dx <= radius; dx++) {
            for (var dy = -radius; dy <= radius; dy++) {
                var tx = centerX + dx, ty = centerY + dy;
                if (typeof bw === 'function' && typeof bh === 'function') {
                    if (tx < 0 || ty < 0 || tx >= bw() || ty >= bh()) continue;
                }
                tiles.push({ x: tx, y: ty });
                tileSet[tx + ',' + ty] = true;
            }
        }
        var edges = [];
        for (var i = 0; i < tiles.length; i++) {
            var tt = tiles[i];
            if (!tileSet[tt.x + ',' + (tt.y - 1)]) edges.push({ x: tt.x, y: tt.y, dir: 'n' });
            if (!tileSet[tt.x + ',' + (tt.y + 1)]) edges.push({ x: tt.x, y: tt.y, dir: 's' });
            if (!tileSet[(tt.x - 1) + ',' + tt.y]) edges.push({ x: tt.x, y: tt.y, dir: 'w' });
            if (!tileSet[(tt.x + 1) + ',' + tt.y]) edges.push({ x: tt.x, y: tt.y, dir: 'e' });
        }
        return { tiles: tiles, edges: edges };
    }

    function _renderZoneBorderGroup(info, color) {
        var ts = CONFIG.tileSize || 128;

        for (var fi = 0; fi < info.tiles.length; fi++) {
            var ft = info.tiles[fi];
            var ftY = tileTopY(ft.x, ft.y) + 0.15;
            var fillMat = new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.12,
                depthWrite: false, side: THREE.DoubleSide
            });
            var fillPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(ts * 0.96, ts * 0.96), fillMat
            );
            fillPlane.rotation.x = -Math.PI / 2;
            fillPlane.position.set(ft.x * ts + ts / 2, ftY, ft.y * ts + ts / 2);
            fillPlane._ew_overlay = 'zone';
            highlightGroup.add(fillPlane);
            _zoneBorderMeshes.push(fillPlane);
            _zoneBorderMats.push(fillMat);
        }

        var lineThickness = ts * 0.04;
        var lineHeight = 0.35;
        for (var ei = 0; ei < info.edges.length; ei++) {
            var e = info.edges[ei];
            var eTopY = tileTopY(e.x, e.y) + lineHeight;
            var bx = e.x * ts;
            var bz = e.y * ts;

            var segW, segH, posX, posZ;
            if (e.dir === 'n') {
                segW = ts; segH = lineThickness;
                posX = bx + ts / 2; posZ = bz;
            } else if (e.dir === 's') {
                segW = ts; segH = lineThickness;
                posX = bx + ts / 2; posZ = bz + ts;
            } else if (e.dir === 'w') {
                segW = lineThickness; segH = ts;
                posX = bx; posZ = bz + ts / 2;
            } else {
                segW = lineThickness; segH = ts;
                posX = bx + ts; posZ = bz + ts / 2;
            }

            var lineMat = new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.85,
                depthWrite: false, side: THREE.DoubleSide
            });
            var lineMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(segW, segH), lineMat
            );
            lineMesh.rotation.x = -Math.PI / 2;
            lineMesh.position.set(posX, eTopY, posZ);
            lineMesh._ew_overlay = 'zone';
            highlightGroup.add(lineMesh);
            _zoneBorderMeshes.push(lineMesh);
            _zoneBorderMats.push(lineMat);

            var glowW = (e.dir === 'n' || e.dir === 's') ? ts * 1.02 : lineThickness * 5;
            var glowH = (e.dir === 'n' || e.dir === 's') ? lineThickness * 5 : ts * 1.02;
            var glowMat = new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.22,
                depthWrite: false, side: THREE.DoubleSide
            });
            var glowMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(glowW, glowH), glowMat
            );
            glowMesh.rotation.x = -Math.PI / 2;
            glowMesh.position.set(posX, eTopY - 0.1, posZ);
            glowMesh._ew_overlay = 'zone';
            highlightGroup.add(glowMesh);
            _zoneBorderMeshes.push(glowMesh);
            _zoneBorderMats.push(glowMat);
        }

        var cornerSet = {};
        for (var ci = 0; ci < info.edges.length; ci++) {
            var ce = info.edges[ci];
            var cx0 = ce.x * ts, cz0 = ce.y * ts;
            var corners;
            if (ce.dir === 'n') corners = [[cx0, cz0], [cx0 + ts, cz0]];
            else if (ce.dir === 's') corners = [[cx0, cz0 + ts], [cx0 + ts, cz0 + ts]];
            else if (ce.dir === 'w') corners = [[cx0, cz0], [cx0, cz0 + ts]];
            else corners = [[cx0 + ts, cz0], [cx0 + ts, cz0 + ts]];
            for (var cci = 0; cci < corners.length; cci++) {
                var ck = corners[cci][0] + ',' + corners[cci][1];
                if (!cornerSet[ck]) {
                    cornerSet[ck] = true;
                    var dotSize = lineThickness * 2.5;
                    var dotMat = new THREE.MeshBasicMaterial({
                        color: color, transparent: true, opacity: 0.9,
                        depthWrite: false, side: THREE.DoubleSide
                    });
                    var dotMesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(dotSize, dotSize), dotMat
                    );
                    var cornerTopY = tileTopY(ce.x, ce.y) + lineHeight + 0.05;
                    dotMesh.rotation.x = -Math.PI / 2;
                    dotMesh.position.set(corners[cci][0], cornerTopY, corners[cci][1]);
                    dotMesh._ew_overlay = 'zone';
                    highlightGroup.add(dotMesh);
                    _zoneBorderMeshes.push(dotMesh);
                    _zoneBorderMats.push(dotMat);
                }
            }
        }
    }

    var _spiderwebZoneTex = null;
    function _renderSpiderwebZoneOverlay(tiles) {
        if (!highlightGroup || !tiles || !tiles.length) return;
        var ts = CONFIG.tileSize || 128;

        if (!_spiderwebZoneTex) {
            var webUrl = (typeof SPIDERWEB_SPRITE !== 'undefined')
                ? SPIDERWEB_SPRITE
                : 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/spiderweb_1.png';
            _spiderwebZoneTex = getTexture(webUrl);
        }
        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var topY = tileTopY(t.x, t.y) + 0.25;
            var webMat = new THREE.MeshBasicMaterial({
                map: _spiderwebZoneTex,
                color: 0xc8c8e0,
                transparent: true,
                opacity: 0.55,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending,
            });
            var webPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(ts * 0.94, ts * 0.94), webMat
            );
            webPlane.rotation.x = -Math.PI / 2;

            webPlane.rotation.z = (t.x * 1.7 + t.y * 2.3) % (Math.PI * 2);
            webPlane.position.set(t.x * ts + ts / 2, topY, t.y * ts + ts / 2);
            webPlane.renderOrder = 5;
            webPlane._ew_overlay = 'zone';
            highlightGroup.add(webPlane);
            _zoneBorderMeshes.push(webPlane);
            _zoneBorderMats.push(webMat);
        }
    }

    var _lastWeatherOverlayKey = '';
    var _lastZoneOverlayKey = '';

    // Serialize a weather zone's tile coordinates so cache keys change when a
    // homing storm slides (its tile count stays 1, only the position moves).
    function _weatherTilesKey(w) {
        if (!w.tiles) return '0';
        var s = w.tiles.length + '#';
        for (var i = 0; i < w.tiles.length; i++) s += w.tiles[i].x + ',' + w.tiles[i].y + ';';
        return s;
    }

    function _syncWeatherOverlays() {
        if (!highlightGroup || !active) return;
        if (typeof state === 'undefined' || state.phase !== 'battle') return;
        if (state.devAutoSim) {
            if (_lastWeatherOverlayKey !== '') { clearOverlay('weather'); _lastWeatherOverlayKey = ''; }
            if (_lastZoneOverlayKey !== '') {
                clearOverlay('zones'); clearOverlay('delayed');

                for (var _zci = 0; _zci < _zoneBorderMeshes.length; _zci++) {
                    var _zcm = _zoneBorderMeshes[_zci];
                    if (highlightGroup) highlightGroup.remove(_zcm);
                    if (_zcm.geometry) _zcm.geometry.dispose();
                    if (_zcm.material) _zcm.material.dispose();
                }
                _zoneBorderMeshes.length = 0;
                _zoneBorderMats.length = 0;
                _lastZoneOverlayKey = '';
            }
            return;
        }

        var aw = state.activeWeather || [];
        var wKey = '';
        for (var i = 0; i < aw.length; i++) {
            var w = aw[i];
            wKey += w.id + ':' + _weatherTilesKey(w) + ':' + w.type + '|';
        }
        if (wKey !== _lastWeatherOverlayKey) {
            _lastWeatherOverlayKey = wKey;
            var wTiles = [];
            for (var wi = 0; wi < aw.length; wi++) {
                var ww = aw[wi];
                if (!ww.tiles) continue;
                var col = _WEATHER_OVERLAY_COLORS[ww.type] || 0xffffff;
                var op = _WEATHER_OVERLAY_OPACITY[ww.type] || 0.20;
                for (var ti = 0; ti < ww.tiles.length; ti++) {
                    wTiles.push({ x: ww.tiles[ti].x, y: ww.tiles[ti].y, color: col, opacity: op });
                }
            }
            if (wTiles.length > 0) setOverlay('weather', wTiles, 0xffffff, 0.2);
            else clearOverlay('weather');
        }

        var zones = state._activeZones || [];
        var delayed = state._delayedSpells || [];
        var zKey = '';
        for (var zi = 0; zi < zones.length; zi++) {
            var z = zones[zi];
            zKey += (z.spellName || z.type) + ':' + z.x + ',' + z.y + ':' + (z.radius || 1) + '|';
        }
        for (var di = 0; di < delayed.length; di++) {
            var d = delayed[di];
            zKey += 'D:' + (d.spellName || 'del') + ':' + d.x + ',' + d.y + ':' + (d.aoeRadius || 1) + '|';
        }
        if (zKey !== _lastZoneOverlayKey) {
            _lastZoneOverlayKey = zKey;

            for (var _zbi = 0; _zbi < _zoneBorderMeshes.length; _zbi++) {
                var _zbm = _zoneBorderMeshes[_zbi];
                if (highlightGroup) highlightGroup.remove(_zbm);
                if (_zbm.geometry) _zbm.geometry.dispose();
                if (_zbm.material && _zbm.material !== _zbm._shared) _zbm.material.dispose();
            }
            _zoneBorderMeshes.length = 0;
            _zoneBorderMats.length = 0;
            clearOverlay('zones');
            clearOverlay('delayed');

            for (var zzi = 0; zzi < zones.length; zzi++) {
                var zz = zones[zzi];
                var zr = zz.radius || 1;
                var zcol = _ZONE_OVERLAY_NAMES[zz.spellName] || _ZONE_OVERLAY_COLORS[zz.type] || 0xdcc8a0;
                var zInfo = _buildZoneBorderEdges(zz.x, zz.y, zr);
                _renderZoneBorderGroup(zInfo, zcol);

                if (zz.spellName === 'Dimensional Web' || zz.spellName === 'Web Snare') {
                    _renderSpiderwebZoneOverlay(zInfo.tiles);
                }
            }

            for (var ddi = 0; ddi < delayed.length; ddi++) {
                var dd = delayed[ddi];
                var dr = dd.aoeRadius || 1;
                var dInfo = _buildZoneBorderEdges(dd.x, dd.y, dr);
                _renderZoneBorderGroup(dInfo, 0xdd4444);
            }
        }
    }

    var _lastWeatherVfxKey = '';

    function _syncWeatherVFX() {
        if (typeof state === 'undefined' || state.phase !== 'battle') return;
        var aw = state.activeWeather || [];

        var key = '';
        for (var i = 0; i < aw.length; i++) key += aw[i].id + aw[i].type + _weatherTilesKey(aw[i]) + '|';
        if (key === _lastWeatherVfxKey) return;
        _lastWeatherVfxKey = key;

        if (state.devAutoSim) {
            if (window.ThreeVFX && window.ThreeVFX.isRain3DActive && window.ThreeVFX.isRain3DActive()) window.ThreeVFX.stopRain3D();
            _syncTornadoBillboards([]);
            _syncHurricaneVortices([]);
            _syncBlizzardVortices([]);
            _syncSandstormVortices([]);
            return;
        }

        var rainZones = aw.filter(function(w) {
            return ['thunderstorm', 'hurricane', 'bloodRain', 'tesseractStorm', 'blizzard'].indexOf(w.type) >= 0 && w.tiles && w.tiles.length > 0;
        });
        if (rainZones.length > 0 && window.ThreeVFX && window.ThreeVFX.startRain3D) {
            window.ThreeVFX.startRain3D(rainZones.map(function(w) { return { type: w.type, tiles: w.tiles }; }));
        } else if (window.ThreeVFX && window.ThreeVFX.isRain3DActive && window.ThreeVFX.isRain3DActive()) {
            window.ThreeVFX.stopRain3D();
        }

        var tornadoZones = aw.filter(function(w) { return w.type === 'tornado' && w.tiles && w.tiles.length > 0; });
        _syncTornadoBillboards(tornadoZones);

        var hurricaneZones = aw.filter(function(w) { return w.type === 'hurricane' && w.tiles && w.tiles.length > 0; });
        _syncHurricaneVortices(hurricaneZones);

        var blizzardZones = aw.filter(function(w) { return w.type === 'blizzard' && w.tiles && w.tiles.length > 0; });
        _syncBlizzardVortices(blizzardZones);

        var sandstormZones = aw.filter(function(w) { return w.type === 'sandstorm' && w.tiles && w.tiles.length > 0; });
        _syncSandstormVortices(sandstormZones);
    }

    var _tornadoBillboards = [];
    var _tornadoFrameTextures = [];
    var _tornadoNativeAspect = 0;
    var _TORNADO_FPS = 30;
    var _TORNADO_FRAME_MS = 1000 / _TORNADO_FPS;

    function _getTornadoFrameTex(idx) {
        if (_tornadoFrameTextures[idx]) return _tornadoFrameTextures[idx];
        if (typeof TORNADO_FRAMES === 'undefined' || !TORNADO_FRAMES[idx]) return null;
        var tex = getTexture(TORNADO_FRAMES[idx]);
        _tornadoFrameTextures[idx] = tex;

        if (!_tornadoNativeAspect && tex.image && tex.image.width && tex.image.height) {
            _tornadoNativeAspect = tex.image.width / tex.image.height;
        }
        return tex;
    }

    function _tornadoPlaneSize(ts) {

        var aspect = _tornadoNativeAspect || 0.57;
        var spriteH = ts * 3.5;
        var spriteW = spriteH * aspect;
        return { w: spriteW, h: spriteH };
    }

    function _syncTornadoBillboards(zones) {
        if (!weatherGroup) return;
        var ts = CONFIG.tileSize || 128;

        var needed = {};
        for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var zid = z.id || ('tz_' + i);
            needed[zid] = z;
        }

        for (var j = _tornadoBillboards.length - 1; j >= 0; j--) {
            if (!needed[_tornadoBillboards[j].zoneId]) {
                weatherGroup.remove(_tornadoBillboards[j].mesh);
                _tornadoBillboards[j].mat.dispose();
                _tornadoBillboards.splice(j, 1);
            }
        }

        var existing = {};
        for (var k = 0; k < _tornadoBillboards.length; k++) existing[_tornadoBillboards[k].zoneId] = _tornadoBillboards[k];

        var sz = _tornadoPlaneSize(ts);

        for (var zid2 in needed) {
            var zone = needed[zid2];
            if (!zone.tiles || !zone.tiles.length) continue;

            var sumX = 0, sumZ = 0, sumY = 0;
            for (var ti = 0; ti < zone.tiles.length; ti++) {
                var t = zone.tiles[ti];
                sumX += t.x * ts + ts / 2;
                sumZ += t.y * ts + ts / 2;
                sumY += tileTopY(t.x, t.y);
            }
            var cx = sumX / zone.tiles.length;
            var cz = sumZ / zone.tiles.length;
            var cy = sumY / zone.tiles.length;

            if (existing[zid2]) {
                var eb = existing[zid2];
                _vortexSlideTo(eb, eb.mesh, cx, cy + sz.h / 2, cz);
                continue;
            }

            var mat = new THREE.MeshBasicMaterial({
                transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, depthWrite: false,
                opacity: 0.85,
            });
            var tex0 = _getTornadoFrameTex(0);
            if (tex0) mat.map = tex0;

            var geo = new THREE.PlaneGeometry(sz.w, sz.h);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(cx, cy + sz.h / 2, cz);
            weatherGroup.add(mesh);

            _tornadoBillboards.push({
                mesh: mesh, mat: mat,
                zoneId: zid2, frameIdx: 0, lastFrameTime: performance.now(),
                lastAspect: _tornadoNativeAspect
            });
        }
    }

    function _updateTornadoBillboards() {
        if (_tornadoBillboards.length === 0) return;
        var now = performance.now();
        var frameCount = (typeof TORNADO_FRAME_COUNT !== 'undefined') ? TORNADO_FRAME_COUNT : 99;
        var cam = ThreeCamera.getCamera();
        var ts = CONFIG.tileSize || 128;
        for (var i = 0; i < _tornadoBillboards.length; i++) {
            var tb = _tornadoBillboards[i];

            _vortexSlideTick(tb, tb.mesh);

            if (now - tb.lastFrameTime >= _TORNADO_FRAME_MS) {
                var elapsed = now - tb.lastFrameTime;
                var steps = Math.floor(elapsed / _TORNADO_FRAME_MS);
                tb.frameIdx = (tb.frameIdx + steps) % frameCount;
                tb.lastFrameTime = now - (elapsed % _TORNADO_FRAME_MS);
                var tex = _getTornadoFrameTex(tb.frameIdx);
                if (tex && tb.mat.map !== tex) {
                    tb.mat.map = tex;
                    tb.mat.needsUpdate = true;
                }
            }

            if (cam) {
                tb.mesh.rotation.y = Math.atan2(
                    cam.position.x - tb.mesh.position.x,
                    cam.position.z - tb.mesh.position.z
                );
            }

            if (_tornadoNativeAspect && tb.lastAspect !== _tornadoNativeAspect) {
                tb.lastAspect = _tornadoNativeAspect;
                var sz = _tornadoPlaneSize(ts);
                tb.mesh.geometry.dispose();
                tb.mesh.geometry = new THREE.PlaneGeometry(sz.w, sz.h);
            }
        }
    }

    // Roaming storms (tornado/hurricane/blizzard/sandstorm) should glide to their
    // next tile rather than teleport. Each vortex entry stores a time-based slide
    // tween; _sync* sets the target, _update* eases the Object3D toward it. The
    // gameplay layer (processHomingWeather) waits out this slide before it applies
    // damage/displacement, so the storm visibly arrives before anyone is hit.
    var _VORTEX_SLIDE_MS = 420;
    function _vortexEaseInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    // Aim a vortex entry's positioned Object3D (`obj`) at (cx,cy,cz). Snaps when
    // there's no prior position (initial placement) or when already targeting it.
    function _vortexSlideTo(entry, obj, cx, cy, cz) {
        if (entry._slideTo && entry._slideTo.x === cx && entry._slideTo.y === cy && entry._slideTo.z === cz) return;
        entry._slideFrom = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        entry._slideTo = { x: cx, y: cy, z: cz };
        entry._slideT0 = performance.now();
    }
    function _vortexSlideTick(entry, obj) {
        if (!entry._slideTo) return;
        var t = (performance.now() - entry._slideT0) / _VORTEX_SLIDE_MS;
        if (t >= 1) {
            obj.position.set(entry._slideTo.x, entry._slideTo.y, entry._slideTo.z);
            entry._slideFrom = null;
            entry._slideTo = null;
            return;
        }
        var e = _vortexEaseInOut(t < 0 ? 0 : t);
        var f = entry._slideFrom;
        obj.position.set(
            f.x + (entry._slideTo.x - f.x) * e,
            f.y + (entry._slideTo.y - f.y) * e,
            f.z + (entry._slideTo.z - f.z) * e
        );
    }

    var _hurricaneVortices = [];

    function _syncHurricaneVortices(zones) {
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.buildHurricaneVortex3D) return;
        var ts = CONFIG.tileSize || 128;

        var needed = {};
        for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var zid = z.id || ('hz_' + i);
            needed[zid] = z;
        }

        for (var j = _hurricaneVortices.length - 1; j >= 0; j--) {
            if (!needed[_hurricaneVortices[j].zoneId]) {
                Effects.disposeHurricaneVortex(_hurricaneVortices[j].vortex);
                _hurricaneVortices.splice(j, 1);
            }
        }

        var existing = {};
        for (var k = 0; k < _hurricaneVortices.length; k++) {
            existing[_hurricaneVortices[k].zoneId] = _hurricaneVortices[k];
        }

        for (var zid2 in needed) {
            var zone = needed[zid2];
            if (!zone.tiles || !zone.tiles.length) continue;

            var sumX = 0, sumZ = 0, sumY = 0;
            for (var ti = 0; ti < zone.tiles.length; ti++) {
                var t = zone.tiles[ti];
                sumX += t.x * ts + ts / 2;
                sumZ += t.y * ts + ts / 2;
                sumY += tileTopY(t.x, t.y);
            }
            var cx = sumX / zone.tiles.length;
            var cz = sumZ / zone.tiles.length;
            var cy = sumY / zone.tiles.length;

            if (existing[zid2]) {
                _vortexSlideTo(existing[zid2], existing[zid2].vortex.group, cx, cy, cz);
                continue;
            }

            var vortex = Effects.buildHurricaneVortex3D(cx, cy, cz, ts);
            if (vortex) {
                _hurricaneVortices.push({ zoneId: zid2, vortex: vortex });
            }
        }
    }

    function _updateHurricaneVortices() {
        if (_hurricaneVortices.length === 0) return;
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.tickHurricaneVortex) return;
        var now = performance.now();
        for (var i = 0; i < _hurricaneVortices.length; i++) {
            _vortexSlideTick(_hurricaneVortices[i], _hurricaneVortices[i].vortex.group);
            Effects.tickHurricaneVortex(_hurricaneVortices[i].vortex, now);
        }
    }

    var _blizzardVortices = [];

    function _syncBlizzardVortices(zones) {
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.buildBlizzardVortex3D) return;
        var ts = CONFIG.tileSize || 128;

        var needed = {};
        for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var zid = z.id || ('bz_' + i);
            needed[zid] = z;
        }

        for (var j = _blizzardVortices.length - 1; j >= 0; j--) {
            if (!needed[_blizzardVortices[j].zoneId]) {
                Effects.disposeBlizzardVortex(_blizzardVortices[j].vortex);
                _blizzardVortices.splice(j, 1);
            }
        }

        var existing = {};
        for (var k = 0; k < _blizzardVortices.length; k++) {
            existing[_blizzardVortices[k].zoneId] = _blizzardVortices[k];
        }

        for (var zid2 in needed) {
            var zone = needed[zid2];
            if (!zone.tiles || !zone.tiles.length) continue;

            var sumX = 0, sumZ = 0, sumY = 0;
            for (var ti = 0; ti < zone.tiles.length; ti++) {
                var t = zone.tiles[ti];
                sumX += t.x * ts + ts / 2;
                sumZ += t.y * ts + ts / 2;
                sumY += tileTopY(t.x, t.y);
            }
            var cx = sumX / zone.tiles.length;
            var cz = sumZ / zone.tiles.length;
            var cy = sumY / zone.tiles.length;

            if (existing[zid2]) {
                _vortexSlideTo(existing[zid2], existing[zid2].vortex.group, cx, cy, cz);
                continue;
            }

            var vortex = Effects.buildBlizzardVortex3D(cx, cy, cz, ts);
            if (vortex) {
                _blizzardVortices.push({ zoneId: zid2, vortex: vortex });
            }
        }
    }

    function _updateBlizzardVortices() {
        if (_blizzardVortices.length === 0) return;
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.tickBlizzardVortex) return;
        var now = performance.now();
        for (var i = 0; i < _blizzardVortices.length; i++) {
            _vortexSlideTick(_blizzardVortices[i], _blizzardVortices[i].vortex.group);
            Effects.tickBlizzardVortex(_blizzardVortices[i].vortex, now);
        }
    }

    var _sandstormVortices = [];

    function _syncSandstormVortices(zones) {
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.buildSandstormVortex3D) return;
        var ts = CONFIG.tileSize || 128;

        var needed = {};
        for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var zid = z.id || ('sz_' + i);
            needed[zid] = z;
        }

        for (var j = _sandstormVortices.length - 1; j >= 0; j--) {
            if (!needed[_sandstormVortices[j].zoneId]) {
                Effects.disposeSandstormVortex(_sandstormVortices[j].vortex);
                _sandstormVortices.splice(j, 1);
            }
        }

        var existing = {};
        for (var k = 0; k < _sandstormVortices.length; k++) {
            existing[_sandstormVortices[k].zoneId] = _sandstormVortices[k];
        }

        for (var zid2 in needed) {
            var zone = needed[zid2];
            if (!zone.tiles || !zone.tiles.length) continue;

            var sumX = 0, sumZ = 0, sumY = 0;
            for (var ti = 0; ti < zone.tiles.length; ti++) {
                var t = zone.tiles[ti];
                sumX += t.x * ts + ts / 2;
                sumZ += t.y * ts + ts / 2;
                sumY += tileTopY(t.x, t.y);
            }
            var cx = sumX / zone.tiles.length;
            var cz = sumZ / zone.tiles.length;
            var cy = sumY / zone.tiles.length;

            if (existing[zid2]) {
                _vortexSlideTo(existing[zid2], existing[zid2].vortex.group, cx, cy, cz);
                continue;
            }

            var vortex = Effects.buildSandstormVortex3D(cx, cy, cz, ts);
            if (vortex) {
                _sandstormVortices.push({ zoneId: zid2, vortex: vortex });
            }
        }
    }

    function _updateSandstormVortices() {
        if (_sandstormVortices.length === 0) return;
        var Effects = window.ThreeVFXEffects;
        if (!Effects || !Effects.tickSandstormVortex) return;
        var now = performance.now();
        for (var i = 0; i < _sandstormVortices.length; i++) {
            _vortexSlideTick(_sandstormVortices[i], _sandstormVortices[i].vortex.group);
            Effects.tickSandstormVortex(_sandstormVortices[i].vortex, now);
        }
    }

    function renderFrame() {
        if (!active || !renderer || !scene) return;

        if (typeof camera !== 'undefined') {
            ThreeCamera.setTileSize(CONFIG.tileSize || 128);

            if (!camera._appliedThisFrame) {
                ThreeCamera.sync(camera);
            }
            camera._appliedThisFrame = false;
        }

        _updateEnvironment();

        var tv = state._terrainVersion || 0, hv = state._heightVersion || 0, vv = state._voxelVersion || 0;
        if (tv !== _lastTerrainVersion || hv !== _lastHeightVersion || vv !== _lastVoxelVersion) rebuildTerrain();
        var tdSer = _computeTerrainDecoSerial();
        if (tdSer !== _lastTerrainDecoSerial) rebuildTerrainDecorations();
        var _objDirty = false;
        if (_objectsDirty || _computeObjectSerial() !== _lastObjectSerial) { rebuildObjects(); _objDirty = true; }
        var tSer = _computeTurretSerial();
        if (tSer !== _lastTurretSerial) { rebuildTurrets(); _objDirty = true; }
        var dSer = _computeDeployableSerial();
        if (dSer !== _lastDeployableSerial) { rebuildDeployables(); _objDirty = true; }
        var nSer = _computeNexusSerial();
        if (nSer !== _lastNexusSerial) { rebuildNexusWalls(); }
        rebuildSpawnZoneOverlays();
        rebuildSanctuaryWalls();
        _updateSpawnZonePulse();
        _updateSanctuaryWallPulse();
        var uSer = _computeUnitSerial();
        if (uSer !== _lastUnitSerial) {

            if (_walkTweens.size > 0 || _jumpTweens.size > 0 || _displaceTweens.size > 0 || _deathTweens.size > 0 || _strikeTweens.size > 0) {

            } else {
                var sSer = _computeUnitStructuralSerial();
                if (sSer !== _lastStructuralSerial) {
                    // Structural change (position, sprite, player, selection) — full rebuild
                    rebuildUnits();
                    _lastStructuralSerial = sSer;
                    _objDirty = true;
                } else {
                    // Stats-only change (hp/mp/ap/shield/status) — patch plates in-place for smooth transitions
                    _patchPlateStats();
                }
            }
        }

        if (_objDirty && state.fogOfWar && _fogVisibleSet) {
            _applyFogVisibility(_fogVisibleSet);
        }

        _updateEnemyConcealment();

        if (typeof renderIfDirty === 'function') renderIfDirty();
        var hlKey = _computeHlKey();

        var _hasStaleHl = false;
        if (hlKey === '' && _lastHlKey === '' && highlightGroup) {
            for (var _si = 0; _si < highlightGroup.children.length; _si++) {
                var _sch = highlightGroup.children[_si];
                if (!_sch._ew_overlay && _sch !== hoverMesh) { _hasStaleHl = true; break; }
            }
        }
        if (hlKey !== _lastHlKey || _hasStaleHl) { rebuildHighlights(); _lastHlKey = hlKey; }

        _updateBillboards();
        _updateBatSwarms();
        _updateFlyingBob();
        _updateTowerCubes();
        _updatePlateVisibility();
        _updatePlateEffBadges();
        _syncNexusBars();
        _updateUnitHoverPulse();
        _syncSelectionIndicator();
        _syncActivePlateClass();
        _updateExhaustedRingDim();

        _hlGlobalTime.value = performance.now() / 1000.0;
        _updateLavaEmissive();

        var _fNow = performance.now();
        var _fDt = Math.min((_fNow - (_lastFluidTime || _fNow)) / 1000, 0.05);
        _lastFluidTime = _fNow;
        _updateFluidWaves(_fDt);

        _updateFogPulse();

        _updateNexusWallPulse();

        _updateZoneBorderPulse();

        _updatePreviewOverlayPulse();

        _updateActionPlanPulse();

        _updateAnimations();

        if (ThreeVFX && ThreeVFX.tick) {
            var now = performance.now();
            var vfxDt = Math.min((now - (_lastVfxTime || now)) / 1000, 0.05);
            _lastVfxTime = now;
            ThreeVFX.tick(vfxDt);
        }

        if (window.ThreeLightning && ThreeLightning.tick) {
            var lNow = performance.now();
            var lDt = Math.min((lNow - (_lastVfxTime || lNow)) / 1000, 0.05);
            ThreeLightning.tick(lDt);
        }

        _syncWeatherOverlays();
        _syncWeatherVFX();
        _updateTornadoBillboards();
        _updateHurricaneVortices();
        _updateBlizzardVortices();
        _updateSandstormVortices();

        if (_parentEl) {
            var w = _parentEl.clientWidth, h = _parentEl.clientHeight;
            if (w > 0 && h > 0 && (canvas.width !== w * renderer.getPixelRatio() || canvas.height !== h * renderer.getPixelRatio())) {
                renderer.setSize(w, h); ThreeCamera.resize(w, h);
                if (ThreePost && ThreePost.resize) ThreePost.resize(w, h);
                if (css2dRenderer) css2dRenderer.setSize(w, h);
            }
        }
        var cam = ThreeCamera.getCamera();
        if (cam) {
            if (ThreePost && ThreePost.isReady()) {
                ThreePost.render(cam);
            } else {
                renderer.render(scene, cam);
            }

            if (css2dRenderer) css2dRenderer.render(scene, cam);
            _scalePlates(cam);
        }
    }

    var _onMouseMove = null, _onClick = null, _onContextMenu = null;
    var _onMouseDown = null, _onTouchStart = null, _onMouseLeave = null;
    var _lastHitX = -1, _lastHitY = -1;

    /* Raycast the floating tower cubes and return the hit cube group (carries
       _ew_towerOwner), or null. Used so a cube can be clicked to attack/target it. */
    function _pickTowerCube(clientX, clientY) {
        if (!_towerCubes.length || !canvas) return null;
        var cam = ThreeCamera.getCamera();
        if (!cam) return null;
        var rect = canvas.getBoundingClientRect();
        var ndc = new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );
        var rc = new THREE.Raycaster();
        rc.setFromCamera(ndc, cam);
        var hits = rc.intersectObjects(_towerCubes, true);
        for (var i = 0; i < hits.length; i++) {
            var obj = hits[i].object;
            while (obj) {
                if (obj._ew_towerCube) return obj;
                obj = obj.parent;
            }
        }
        return null;
    }

    function _bindInput() {
        if (!canvas) return;

        _onMouseMove = function(e) {

            var unitHit = ThreeCamera.screenToUnit(e.clientX, e.clientY, canvas, unitGroup);
            _updateUnitHover(unitHit ? unitHit.unitId : null);

            var hit = ThreeCamera.screenToTile(e.clientX, e.clientY, canvas, terrainGroup, objectGroup);
            /* Hovering the floating cube resolves to the tower's own tile. */
            var tcHover = _pickTowerCube(e.clientX, e.clientY);
            if (tcHover) {
                var _twH = state.towers ? state.towers[tcHover._ew_towerOwner] : null;
                if (_twH) hit = { tileX: _twH.x, tileY: _twH.y };
            }
            if (hit) {
                var tx = hit.tileX, ty = hit.tileY;
                updateHoverHighlight(tx, ty);

                if (tx !== _lastHitX || ty !== _lastHitY) {
                    _lastHitX = tx; _lastHitY = ty;
                    if (typeof handleTileDragEnter === 'function') handleTileDragEnter(tx, ty);
                    if (typeof updateHoveredTarget === 'function') {
                        var changed = updateHoveredTarget(tx, ty);
                        if (changed) {

                            var _hu = (typeof unitAt === 'function') ? unitAt(tx, ty) : null;
                            if (_hu && typeof focusUnitPanel === 'function') {
                                focusUnitPanel(_hu.id, null, 'hover');
                            }
                            if (typeof scheduleHoverHighlightUpdate === 'function') scheduleHoverHighlightUpdate(tx, ty);
                            if (!_hu && typeof renderSelectedUnitPanel === 'function') renderSelectedUnitPanel();
                        }
                    }
                }
            } else {
                updateHoverHighlight(-1, -1);

                if (_lastHitX >= 0 || _lastHitY >= 0) {
                    var prevX = _lastHitX, prevY = _lastHitY;
                    _lastHitX = -1; _lastHitY = -1;
                    if (typeof clearHoveredTarget === 'function') clearHoveredTarget(prevX, prevY);
                    if (typeof restoreHoverFocus === 'function') restoreHoverFocus();
                    if (typeof clearHoverHighlight === 'function') clearHoverHighlight();
                }
            }
        };

        _onClick = function(e) {
            if (e.button !== 0) return;
            var tx, ty;
            var unitHit = ThreeCamera.screenToUnit(e.clientX, e.clientY, canvas, unitGroup);
            if (unitHit) {

                var _clickUnit = _unitById.get(unitHit.unitId) || null;
                if (_clickUnit) { tx = _clickUnit.x; ty = _clickUnit.y; }
            }
            /* Clicking the floating tower cube targets the tower on its own tile.
               (screenToTile would otherwise return a parallax-shifted ground tile
               because the cube hovers a tile above the board.) */
            if (tx === undefined) {
                var tcHit = _pickTowerCube(e.clientX, e.clientY);
                if (tcHit) {
                    var _tw = state.towers ? state.towers[tcHit._ew_towerOwner] : null;
                    if (_tw) { tx = _tw.x; ty = _tw.y; }
                }
            }
            if (tx === undefined) {
                var hit = ThreeCamera.screenToTile(e.clientX, e.clientY, canvas, terrainGroup, objectGroup);
                if (!hit) return;
                tx = hit.tileX; ty = hit.tileY;
            }

            /* Track whether the click directly hit a unit sprite (vs the tile beneath) */
            if (typeof state !== 'undefined') state._clickedUnitId = unitHit ? unitHit.unitId : null;

            var clickZ;
            /* If the player clicked directly on a unit's sprite, target THAT unit's own
               height. Otherwise the tile-based z below always resolves to the ground, so a
               sky/airborne unit — or the upper unit of a stack — can never be hit. */
            if (unitHit) {
                var _hitU = _unitById.get(unitHit.unitId) || null;
                if (_hitU && _hitU.z != null) clickZ = _hitU.z;
            }
            if (clickZ === undefined && typeof nearestWalkableZ === 'function' && typeof state !== 'undefined' && state.selectedUnitId != null) {
                var _actU = _unitById.get(state.selectedUnitId) || null;
                if (_actU) clickZ = nearestWalkableZ(tx, ty, _actU.z != null ? _actU.z : 0);
            }
            if (clickZ === undefined && typeof getHeightAt === 'function') clickZ = getHeightAt(tx, ty);
            if (typeof clickTile === 'function') clickTile(tx, ty, clickZ);
        };

        _onMouseDown = function(e) {
            if (e.button !== 0) return;
            var hit = ThreeCamera.screenToTile(e.clientX, e.clientY, canvas, terrainGroup, objectGroup);
            if (hit && typeof handleTileDragStart === 'function') handleTileDragStart(hit.tileX, hit.tileY);
        };

        _onTouchStart = function(e) {
            if (!e.touches || !e.touches.length) return;
            var touch = e.touches[0];
            var hit = ThreeCamera.screenToTile(touch.clientX, touch.clientY, canvas, terrainGroup, objectGroup);
            if (hit && typeof handleTileDragStart === 'function') handleTileDragStart(hit.tileX, hit.tileY);
        };

        _onMouseLeave = function() {
            _updateUnitHover(null);
            updateHoverHighlight(-1, -1);
            if (_lastHitX >= 0 || _lastHitY >= 0) {
                var prevX = _lastHitX, prevY = _lastHitY;
                _lastHitX = -1; _lastHitY = -1;
                if (typeof clearHoveredTarget === 'function') clearHoveredTarget(prevX, prevY);
                if (typeof restoreHoverFocus === 'function') restoreHoverFocus();
                if (typeof clearHoverHighlight === 'function') clearHoverHighlight();
            }
        };

        _onContextMenu = function(e) { e.preventDefault(); };

        canvas.addEventListener('mousemove', _onMouseMove);
        canvas.addEventListener('click', _onClick);
        canvas.addEventListener('mousedown', _onMouseDown);
        canvas.addEventListener('touchstart', _onTouchStart, { passive: true });
        canvas.addEventListener('mouseleave', _onMouseLeave);
        canvas.addEventListener('contextmenu', _onContextMenu);
    }
    function _unbindInput() {
        if (!canvas) return;
        _clearUnitHover();
        if (canvas) canvas.style.cursor = '';
        if (_onMouseMove) canvas.removeEventListener('mousemove', _onMouseMove);
        if (_onClick) canvas.removeEventListener('click', _onClick);
        if (_onMouseDown) canvas.removeEventListener('mousedown', _onMouseDown);
        if (_onTouchStart) canvas.removeEventListener('touchstart', _onTouchStart);
        if (_onMouseLeave) canvas.removeEventListener('mouseleave', _onMouseLeave);
        if (_onContextMenu) canvas.removeEventListener('contextmenu', _onContextMenu);
        _onMouseMove = _onClick = _onMouseDown = _onTouchStart = _onMouseLeave = _onContextMenu = null;
        _lastHitX = -1; _lastHitY = -1;
    }

    function hookCamera() {
        var poll = setInterval(function() {
            if (typeof camera !== 'undefined' && camera._apply) {
                var orig = camera._apply.bind(camera);
                camera._apply = function() { orig(); this._appliedThisFrame = true; if (active && ThreeCamera.getCamera()) { ThreeCamera.setTileSize(CONFIG.tileSize||58); ThreeCamera.sync(this); } };
                clearInterval(poll);
                console.log('[ThreeRenderer] camera._apply() hooked');
            }
        }, 200);
        setTimeout(function() { clearInterval(poll); }, 10000);
    }

    function dispose() {
        deactivate();
        _clearPlates();
        if (ThreeVFX && ThreeVFX.dispose) ThreeVFX.dispose();
        if (window.ThreeLightning && ThreeLightning.dispose) ThreeLightning.dispose();
        if (ThreePost && ThreePost.dispose) ThreePost.dispose();
        _clearNexusBars();
        if (_intentBadgeContainer && _intentBadgeContainer.parentElement) _intentBadgeContainer.parentElement.removeChild(_intentBadgeContainer);
        _intentBadgeContainer = null;
        _intentBadgeEls = [];
        if (css2dRenderer && css2dRenderer.domElement && css2dRenderer.domElement.parentElement) {
            css2dRenderer.domElement.parentElement.removeChild(css2dRenderer.domElement);
        }
        css2dRenderer = null;
        if (_horizonGroup) { if (scene) scene.remove(_horizonGroup); _disposeR(_horizonGroup); }
        _horizonGroup = null; _horizonMats.length = 0; _horizonKey = '';
        _envGroup = _envGround = _envWall = _envDome = null; _envInited = false;
        if (renderer) { renderer.dispose(); renderer = null; }
        if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
        canvas = null; scene = null;
        terrainGroup = highlightGroup = objectGroup = unitGroup = projectileGroup = floatTextGroup = hitFxGroup = fogGroup = null;
        _nexusBarGroup = null;
        textureCache.clear(); tileMeshes.clear(); objectMeshes.clear();
        turretMeshes.clear(); deployableMeshes.clear(); unitEntries.clear(); _plateObjs.clear();
        _lastHpPctById.clear(); _lastMpPctById.clear();
        _fogMeshes.clear();
        _clearAnimations();
        initialized = false;
    }

    function hasActiveAnims() {
        if (_floatTweens.length > 0) return true;
        if (_projTweens.length > 0) return true;
        if (_tetherTweens.length > 0) return true;
        if (_hitFxTweens.length > 0) return true;
        if (_walkTweens.size > 0) return true;
        if (_displaceTweens.size > 0) return true;
        if (_jumpTweens.size > 0) return true;
        if (_strikeTweens.size > 0) return true;
        if (_deathTweens.size > 0) return true;
        return false;
    }

    function invalidateUnits() { _lastUnitSerial = ''; _lastStructuralSerial = ''; }

    return {
        init, activate, deactivate, isActive, dispose, hookCamera,
        rebuildTerrain, rebuildObjects, rebuildTurrets, rebuildNexusWalls, rebuildSanctuaryWalls, rebuildUnits, rebuildHighlights,
        rebuildFog, invalidateUnits,

        scanSpriteOffset,

        setOverlay, clearOverlay, clearAllOverlays, flashTelegraph,

        drawArrow3D, clearArrows3D,

        showGhostUnit, clearGhostUnit,

        unitSurfaceY, tileTopY,

        showIntentBadges, clearIntentBadges, worldToScreen,

        startWalkTween, startDisplaceTween, startJumpTween, startStrikeLeapTween, startDeathTween,

        startProjectileTween,

        startTetherTween,

        startFloatingText,

        startHitEffect,

        hasActiveAnims,

        get _scene() { return scene; }
    };
})();

function toggleThreeRenderer() {
    if (ThreeRenderer.isActive()) { ThreeRenderer.deactivate(); console.log('Three.js renderer OFF'); }
    else { ThreeRenderer.activate(); console.log('Three.js renderer ON'); }
}
ThreeRenderer.hookCamera();

(function _autoActivateThreeOnBattle() {
    var _armed = true;
    setInterval(function() {
        if (!_armed) {

            if (typeof state !== 'undefined' && state.phase !== 'battle') _armed = true;
            return;
        }
        if (typeof state === 'undefined' || state.phase !== 'battle') return;
        if (!document.querySelector('.map-center')) return;

        if (!state.boardTerrain || !state.boardTerrain.length || !state.boardTerrain[0]) return;
        if (ThreeRenderer.isActive()) return;

        CONFIG.tileSize = 128;

        ThreeRenderer.activate();
        _armed = false;
        console.log('[ThreeRenderer] auto-activated for battle');
    }, 250);
})();

window.ThreeAnim = {

    walkPath: function(unit, path, onDone) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startWalkTween(unit, path, onDone);
    },

    displace: function(unit, fromX, fromY, toX, toY, durationMs) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startDisplaceTween(unit, fromX, fromY, toX, toY, durationMs);
    },

    jumpArc: function(unit, fromX, fromY, toX, toY, fromZ, toZ, durationMs) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startJumpTween(unit, fromX, fromY, toX, toY, fromZ, toZ, durationMs);
    },

    strikeLeap: function(unit, tx, ty, opts) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startStrikeLeapTween(unit, tx, ty, opts);
    },

    death: function(unitId) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startDeathTween(unitId);
    },

    projectile: function(fromX, fromY, toX, toY, projClass, flyMs, fromZ, toZ) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startProjectileTween(fromX, fromY, toX, toY, projClass, flyMs, fromZ, toZ);
    },

    tether: function(fromX, fromY, toX, toY, kind, shootMs, fromZLevel, toZLevel) {
        if (ThreeRenderer.isActive()) return ThreeRenderer.startTetherTween(fromX, fromY, toX, toY, kind, shootMs, fromZLevel, toZLevel);
        return null;
    },

    floatingText: function(tileX, tileY, text, kind, durationMs, opts) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startFloatingText(tileX, tileY, text, kind, durationMs, opts);
    },

    hitEffect: function(tileX, tileY, variant, isCrit, durationMs) {
        if (ThreeRenderer.isActive()) ThreeRenderer.startHitEffect(tileX, tileY, variant, isCrit, durationMs);
    },

    isActive: function() { return ThreeRenderer.isActive(); }
};
