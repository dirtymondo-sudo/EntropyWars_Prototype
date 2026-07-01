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

    /* ════════════════════════════════════════════════════════════════════
     *  BEVELED / NATURAL TERRAIN
     *  Instead of razor-edged voxel cubes, ground tiles are built with a
     *  chamfered top lip, slightly battered (out-flaring) walls and a gently
     *  domed organic top. From above it is still a perfect square grid (every
     *  tile keeps its exact centre & footprint, so movement / spell / range
     *  logic is untouched) but the silhouette reads as eroded, natural rock —
     *  a PS1/PS2-era low-poly look. Structured terrains (bricks, road, water,
     *  lava) keep their flat cubes. Flip BEVEL.enabled = false to revert.
     * ════════════════════════════════════════════════════════════════════ */
    var BEVEL = {
        enabled: true,
        edge: 0.17,    // top-plate horizontal inset (× tile) — chamfer width
        drop: 0.085,   // chamfer vertical drop (× tile)
        batter: 0.05,  // wall taper — top narrower than base (× tile)
        topSegs: 4,    // top subdivisions (organic doming resolution)
        amp: 0.055,    // organic top swell amplitude (× tile)
        freq: 0.85,    // organic noise frequency (cycles per tile)
        ruins: true,   // mid-ground esoteric ruins ring around the arena
        scatter: true  // light natural boulder scatter on open ground
    };
    /* ── COSMETIC GRASS ────────────────────────────────────────────────────
       Little blocky billboard grass blades, textured with grass_2.png, scattered
       on open grassy ground across EVERY map (autoScatter), plus available as the
       editor-placeable 'grass_tuft' object. Purely visual: no collision, no
       gameplay, no pathing effect. Tweak freely — flip enabled:false to remove,
       or autoScatter:false to keep only the editor-placed tufts. */
    var GRASS = {
        enabled: true,
        autoScatter: true, // auto-sprinkle on grassy tiles of every map (false = editor-placed only)
        texture: 'grass_2.png', // R2 /Assets/Sprites/terrain sprite wrapped on each blade
        coverage: 150,   // 0-255 hash cutoff — ~ (this/255) of grass tiles get an auto tuft (~59%)
        bladesMin: 9,    // blades per tuft (lower bound)
        bladesMax: 16,   // blades per tuft (upper bound)
        heightMin: 0.13, // blade height as × tile (128px tile → ~17px)
        heightMax: 0.20, // (~26px)
        width:     0.022,// blade base half-width × tile (~3px) — blocky/billboard
        spread:    0.40, // how far across the tile blades scatter (× tile)
        rootShade: 0.55, // texture brightness multiplier at the blade base (darker)
        tipShade:  1.0   // texture brightness multiplier at the blade tip (full)
    };
    /* terrains that STAY hard cubes (man-made / structured) */
    var _CUBE_TERRAIN_SET = { bricks_1: 1, bricks_2: 1, bricks_3: 1, bricks: 1, road: 1, road_2: 1, metal: 1, metal_floor: 1 };

    function _ewValHash(ix, iz) {
        var h = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
        return h - Math.floor(h);
    }
    function _ewSmoothNoise(u, v) {
        var iu = Math.floor(u), iv = Math.floor(v);
        var fu = u - iu, fv = v - iv;
        var su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
        var a = _ewValHash(iu, iv), b = _ewValHash(iu + 1, iv);
        var c = _ewValHash(iu, iv + 1), d = _ewValHash(iu + 1, iv + 1);
        return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
    }
    /* Small, smooth, deterministic vertical swell as a function of world X/Z.
     * Continuous everywhere; shared by terrain tops, tile-surface queries and
     * highlight draping so units, ranges and ground all ride the same surface. */
    function _surfaceLift(wx, wz) {
        if (!BEVEL.enabled || BEVEL.amp <= 0) return 0;
        var ts = CONFIG.tileSize || BASE_TILE;
        var f = BEVEL.freq / ts;
        var n = _ewSmoothNoise(wx * f, wz * f) * 0.65
              + _ewSmoothNoise(wx * f * 2.3 + 11.5, wz * f * 2.3 + 7.1) * 0.35;
        return (n - 0.5) * 2.0 * (ts * BEVEL.amp);
    }
    function _isBeveledTerrain(tKey) {
        if (!BEVEL.enabled) return false;
        if (!tKey || tKey.indexOf('void') === 0) return false;
        if (_CUBE_TERRAIN_SET[tKey]) return false;
        if (typeof _FLUID_TERRAIN_SET !== 'undefined' && _FLUID_TERRAIN_SET[tKey]) return false;
        if (tKey === 'lava') return false;
        return true;
    }

    /* Beveled tile: chamfered top lip (top material), battered walls + base
     * (side material), organic domed top. Centred on origin like BoxGeometry,
     * so the caller positions it exactly as it positions a flat box. Material
     * groups match buildBoxMaterials: group index 2 = top, 0 = sides. Built
     * double-sided (see _buildBeveledMaterials) so winding is never an issue. */
    function _buildBeveledTileGeo(ts, boxH, cx, cz) {
        var H2 = ts / 2;
        var topY = boxH / 2, botY = -boxH / 2;
        var inset = ts * BEVEL.edge;
        var drop = Math.min(ts * BEVEL.drop, boxH * 0.4);
        var batter = ts * BEVEL.batter;
        var segs = Math.max(1, BEVEL.topSegs | 0);
        var plateE = H2 - inset;   // top plate half-extent
        var rimE = H2 - batter;    // chamfer outer / wall top half-extent
        var rimY = topY - drop;    // chamfer base / wall top height

        var pos = [], uv = [], idx = [];

        /* ── top plate (organic dome; edges pinned flat so the chamfer meets
              it watertight and neighbouring tiles stay flush) ── */
        var grid = [];
        for (var gj = 0; gj <= segs; gj++) {
            grid[gj] = [];
            for (var gi = 0; gi <= segs; gi++) {
                var lx = -plateE + (gi / segs) * (plateE * 2);
                var lz = -plateE + (gj / segs) * (plateE * 2);
                var onEdge = (gi === 0 || gi === segs || gj === 0 || gj === segs);
                var lift = onEdge ? 0 : _surfaceLift(cx + lx, cz + lz);
                grid[gj][gi] = pos.length / 3;
                pos.push(lx, topY + lift, lz);
                uv.push(0.5 + lx / ts, 0.5 + lz / ts);
            }
        }
        for (var qj = 0; qj < segs; qj++) {
            for (var qi = 0; qi < segs; qi++) {
                var a = grid[qj][qi], b = grid[qj][qi + 1];
                var c = grid[qj + 1][qi], d = grid[qj + 1][qi + 1];
                idx.push(a, c, b, b, c, d);
            }
        }

        function quad(p0, p1, p2, p3, vRatio) {
            var base = pos.length / 3;
            pos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2],
                     p2[0], p2[1], p2[2], p3[0], p3[1], p3[2]);
            var vb = (vRatio == null) ? 1 : vRatio;
            uv.push(0, 0, 1, 0, 1, vb, 0, vb);
            idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }

        /* ── chamfer lip (top material) ── 4 trapezoids plate→rim ── */
        var P = function (sx, sz) { return [sx * plateE, topY, sz * plateE]; };
        var R = function (sx, sz) { return [sx * rimE, rimY, sz * rimE]; };
        quad(P(1, -1), P(1, 1), R(1, 1), R(1, -1));   // +X
        quad(P(-1, 1), P(-1, -1), R(-1, -1), R(-1, 1)); // -X
        quad(P(1, 1), P(-1, 1), R(-1, 1), R(1, 1));    // +Z
        quad(P(-1, -1), P(1, -1), R(1, -1), R(-1, -1)); // -Z
        var nTopIdx = idx.length;

        /* ── battered walls (side material) rim→base, flaring out at the foot ── */
        var B = function (sx, sz) { return [sx * H2, botY, sz * H2]; };
        var vR = boxH / ts;
        quad(R(1, -1), R(1, 1), B(1, 1), B(1, -1), vR);
        quad(R(-1, 1), R(-1, -1), B(-1, -1), B(-1, 1), vR);
        quad(R(1, 1), R(-1, 1), B(-1, 1), B(1, 1), vR);
        quad(R(-1, -1), R(1, -1), B(1, -1), B(-1, -1), vR);
        /* base cap (rarely seen; keeps it a closed solid) */
        quad(B(-1, -1), B(-1, 1), B(1, 1), B(1, -1));
        var nSideIdx = idx.length - nTopIdx;

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        geo.addGroup(0, nTopIdx, 2);
        geo.addGroup(nTopIdx, nSideIdx, 0);
        geo.computeVertexNormals();
        return geo;
    }

    /* ── Natural rolling-heightfield terrain (opt-in per map) ──────────────
     * When state.naturalTerrain is set (currently only the "Entropy Vale"
     * map), ground tiles are rendered as ONE continuous, smoothly sloped
     * landform instead of stacked flat voxel cubes: each tile's four top
     * corners sit at the AVERAGE height of the tiles meeting at that corner,
     * so adjacent tiles share corner heights and the surface flows seamlessly
     * into hills, valleys and mountains. The board still maps 1:1 to a square
     * grid (centres & footprints unchanged) so all gameplay logic is intact.
     * Every OTHER map is completely unaffected — it keeps the classic path. */
    function _naturalTerrainActive() {
        return BEVEL.enabled && !!(typeof state !== 'undefined' && state && state.naturalTerrain);
    }

    /* The Entropy Vale colour-PALETTE tint has been removed. Terrain GEOMETRY
       (the natural rolling heightfield) is still driven by _naturalTerrainActive()
       above; this separate flag governs ONLY the palette colour tint and is off,
       so terrain, props, trees, rocks and crystals keep their original colours. */
    function _evPaletteActive() { return false; }

    /* ── EW master palette ─────────────────────────────────────────────────
     * ONE cohesive, hand-tuned palette that the whole world is meant to draw
     * from, so shared materials share a colour — the green of the grass IS the
     * green of the trees (both ent_verdant), wood IS bark (ent_bark), etc. The
     * intent is a single source of truth for terrain, props and (eventually)
     * unit sprites. 37 swatches in six ramps, each anchored on a unit type-badge
     * colour (human / alien / divine / unholy / anomaly / tech) and including
     * that badge's UI text-tint + the fog colours, so it stays continuous with
     * the existing HUD.
     *
     * Applied as a MULTIPLY tint over the existing terrain textures (so sprite
     * detail survives) ONLY while _naturalTerrainActive() — i.e. on the
     * "Entropy Vale" map. Every other map keeps its original colours. Gameplay-
     * identity colours (player blue/red towers, spawn markers, deployed walls/
     * totems/traps) are deliberately left alone so they stay readable. */
    var EW_PAL = {
        /* Void / Stone (human) — neutral cool base */
        ent_void:'#0c0c13', ent_pitch:'#1a1a28', ent_graphite:'#2a2a3e', ent_slate:'#3a3a52',
        ent_stone:'#565673', ent_ash:'#8a93a8', ent_silver:'#a0a0c3', ent_mist:'#c8c8e4', ent_bone:'#e9e9f4',
        /* Verdant (alien) — all vegetation */
        ent_moss:'#18512a', ent_pine:'#226e30', ent_verdant:'#32aa50', ent_leaf:'#56d178', ent_sprout:'#92e8a6',
        /* Tidal (tech) — water / ice / sky / fog */
        ent_depth:'#123c50', ent_tidal:'#1c6f88', ent_teal:'#28a0be', ent_cyan:'#4ecbe2',
        ent_frost:'#a6e8f2', ent_astral:'#22ccff', ent_haze:'#1188aa',
        /* Gilded (divine) — earth / wood / sand / peaks */
        ent_umber:'#3e2c1c', ent_bark:'#6b4a2e', ent_clay:'#9c7440', ent_gold:'#dcaa1e',
        ent_sun:'#f2c63c', ent_sand:'#ecdca0',
        /* Arcane (unholy) — crystal / obsidian / void-magic */
        ent_voidviolet:'#311646', ent_amethyst:'#5e2a80', ent_violet:'#9632b4', ent_orchid:'#c566e2', ent_lilac:'#e3b3ff',
        /* Ember (anomaly) — hazard / scorched / lava / fire */
        ent_maroon:'#4f1828', ent_blood:'#88283e', ent_rose:'#dc3c82', ent_pink:'#ff5e98', ent_ember:'#e8643c', ent_flame:'#ff9a4a'
    };

    /* terrain / prop key → master-palette swatch. Keys that should look the same
       point at the SAME swatch (grass + tree canopy → ent_verdant). */
    var _EV_MAP = {
        /* vegetation → verdant ramp */
        grass:'ent_verdant', grass_2:'ent_verdant', grass_rocky:'ent_pine', purple_grass:'ent_amethyst',
        forest:'ent_pine', forest_2:'ent_pine', dark_woods:'ent_moss', tree:'ent_verdant', tree_top:'ent_verdant',
        poison:'ent_moss', poison_bog:'ent_moss', mushroom:'ent_orchid',
        /* water / ice / sky → tidal ramp */
        water:'ent_teal', deep_water:'ent_depth', ice:'ent_frost', healing_spring:'ent_cyan',
        well:'ent_tidal', sky_open:'ent_astral', cloud:'ent_mist', cloud_thick:'ent_bone', storm:'ent_amethyst',
        /* crystal / arcane → arcane ramp */
        crystal:'ent_violet', purple_bog:'ent_amethyst', obsidian:'ent_voidviolet',
        nexus:'ent_violet', nexus_cave:'ent_amethyst', nexus_sky:'ent_orchid',
        /* hazard / burnt → ember ramp */
        scorched:'ent_maroon', lava:'ent_ember', poison_seed:'ent_blood',
        /* earth / wood / sand / sacred → gilded ramp */
        dirt:'ent_clay', desert:'ent_sand', wasteland:'ent_clay', sanctuary:'ent_sand',
        wood:'ent_bark', wood_planks:'ent_bark', bridge:'ent_bark', road:'ent_ash',
        bricks_1:'ent_clay', bricks_2:'ent_clay', mountain_top:'ent_sand', beanstalk:'ent_pine',
        /* stone / structural / neutral → void-stone ramp */
        mountain:'ent_stone', mountain_2:'ent_slate', cliff:'ent_slate', ruins:'ent_ash',
        rocks_1:'ent_stone', rocks_2:'ent_stone', rocks_3:'ent_stone', rocks_4:'ent_slate', rocks_5:'ent_slate',
        rock_wall_1:'ent_slate', rock_wall_2:'ent_slate', rubble_1:'ent_ash', rubble_2:'ent_ash',
        rubble_3:'ent_ash', rubble_4:'ent_ash', urban_wall:'ent_stone', urban_street:'ent_ash',
        cave_floor:'ent_slate', cave_wall:'ent_graphite', cave_entrance:'ent_pitch'
    };

    /* A multiply tint can only darken, so each swatch is lightened toward white
       by this fixed amount before it's multiplied onto a texture — this lifts
       the result back up to roughly the swatch's own value while keeping the
       relationships between swatches intact. Shared swatch ⇒ shared tint. */
    var EW_TINT_MIX = 0.32;

    function _hexToInt(h) { return parseInt(h.replace('#',''), 16); }
    function _evLighten(hex, amt) {
        var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
        r = Math.round(r + (255 - r) * amt);
        g = Math.round(g + (255 - g) * amt);
        b = Math.round(b + (255 - b) * amt);
        return (r << 16) | (g << 8) | b;
    }
    /* Resolve a swatch NAME (e.g. 'ent_verdant') to its raw palette int. */
    function _ewSwatch(name) {
        var h = EW_PAL[name];
        return h ? _hexToInt(h) : 0x808080;
    }
    /* Resolve a terrain/prop KEY to its lightened multiply-tint hex (int). */
    var _evTintCache = {};
    function _evTintHex(key) {
        if (!key) return null;
        if (key in _evTintCache) return _evTintCache[key];
        var name = _EV_MAP[key] || 'ent_ash';        /* neutral stone default */
        var hex = _evLighten(_ewSwatch(name), EW_TINT_MIX);
        _evTintCache[key] = hex;
        return hex;
    }
    /* THREE.Color for a terrain/prop key (cached). */
    var _evColorCache = {};
    function _evColor(key) {
        var hex = _evTintHex(key);
        if (hex == null) return null;
        if (!(hex in _evColorCache)) _evColorCache[hex] = new THREE.Color(hex);
        return _evColorCache[hex];
    }
    /* Apply the palette tint for `key` onto a material's .color (multiply),
       no-op unless the Entropy Vale palette is active.
       DISABLED: the Entropy Vale colour tint has been removed, so terrain/props
       keep their original untinted textures. The natural rolling-heightfield
       landform (see _naturalTerrainActive) is unaffected. */
    function _evTintMat(mat, key) {
        /* Map-editor per-terrain tint: the editor stores a {terrainKey: '#hex'}
           map on state.terrainTints (and only the custom editor map ever sets it,
           so normal maps are untouched). Multiply the chosen colour onto the
           material — this tints the sprite while preserving its detail, exactly
           like the old Entropy-Vale palette did. */
        try {
            var tints = (typeof state !== 'undefined' && state) ? state.terrainTints : null;
            if (tints && key && tints[key] && mat && mat.color) {
                var hex = tints[key];
                if (!_userTintCache[hex]) _userTintCache[hex] = new THREE.Color(hex);
                mat.color.multiply(_userTintCache[hex]);
            }
        } catch (e) {}
        return mat;
    }
    var _userTintCache = {};

    /* Material cache key fragment for the active per-terrain editor tints.
       buildBoxMaterials/_buildBeveledMaterials cache materials by terrain key,
       but the tint is multiplied on at build time (_evTintMat). Without folding
       the tint into the cache key, changing a tint returned the stale (untinted)
       cached material and the map never updated. Include the top/side tint hex so
       a tint change yields a fresh cache entry — and rebuilds tinted materials. */
    function _tintKeyPart(topKey, sideKey) {
        var t = (typeof state !== 'undefined' && state) ? state.terrainTints : null;
        if (!t) return '';
        var a = t[topKey] || '', b = t[sideKey || topKey] || '';
        return (a || b) ? '|t:' + a + ':' + b : '';
    }

    function _lerp(a, b, t) { return a + (b - a) * t; }
    function _hLevelAt(x, y) {
        if (typeof getBaseHeightAt === 'function') return getBaseHeightAt(x, y) || 0;
        return (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : 0;
    }
    /* world-Y of the grid corner (gx,gy): mean height of the up-to-4 tiles
       that touch it × elevStep — this is what welds neighbours together. */
    function _cornerHeightY(gx, gy, elevStep, _bw, _bh) {
        var sum = 0, cnt = 0;
        for (var dy = -1; dy <= 0; dy++) {
            for (var dx = -1; dx <= 0; dx++) {
                var tx = gx + dx, ty = gy + dy;
                if (tx >= 0 && ty >= 0 && tx < _bw && ty < _bh) { sum += _hLevelAt(tx, ty); cnt++; }
            }
        }
        return cnt ? (sum / cnt) * elevStep : 0;
    }
    /* smooth surface height at local (lu,lv) in [0..1] across tile (x,y):
       bilinear blend of the 4 corner heights + a small organic swell. */
    function _naturalSurfaceYLocal(x, y, lu, lv, _bw, _bh, elevStep) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var Y00 = _cornerHeightY(x,     y,     elevStep, _bw, _bh);
        var Y10 = _cornerHeightY(x + 1, y,     elevStep, _bw, _bh);
        var Y01 = _cornerHeightY(x,     y + 1, elevStep, _bw, _bh);
        var Y11 = _cornerHeightY(x + 1, y + 1, elevStep, _bw, _bh);
        var top = _lerp(_lerp(Y00, Y10, lu), _lerp(Y01, Y11, lu), lv);
        return top + _surfaceLift(x * ts + lu * ts, y * ts + lv * ts);
    }
    function _naturalSurfaceY(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var elevStep = ts * ELEV_STEP_RATIO;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        return _naturalSurfaceYLocal(x, y, 0.5, 0.5, _bw, _bh, elevStep);
    }
    function _isNaturalRenderTile(x, y) {
        if (!_naturalTerrainActive()) return false;
        var t = (typeof getTerrainAt === 'function') ? getTerrainAt(x, y) : null;
        if (!t || t.indexOf('void') === 0) return false;
        if (typeof _FLUID_TERRAIN_SET !== 'undefined' && _FLUID_TERRAIN_SET[t]) return false;
        if (t === 'lava') return false;
        return true;
    }
    /* Build one smooth landform tile: subdivided sloped top (top material) +
       skirts dropping to a soil floor ONLY where a neighbour is void/off-board
       (interior edges are continuous with neighbours, so no walls/z-fighting). */
    function _buildNaturalTileMesh(x, y, ts, elevStep, _bw, _bh, tKey, sKey) {
        var segs = 5;
        var floorY = -elevStep; // a tile of soil below the lowest ground → rim cliffs
        var pos = [], uv = [], idx = [], grid = [];
        function surf(lu, lv) { return _naturalSurfaceYLocal(x, y, lu, lv, _bw, _bh, elevStep); }

        /* Steep tiles stretch the top texture because the sloped face is much
           longer than the flat tile footprint while the UV span stays 0..1.
           Repeat the texture by the slope's length/footprint ratio (rounded to
           an integer so the tiling still lines up with flat neighbours at the
           shared edge) so texel density stays roughly constant — no stretching. */
        var _cY00 = _cornerHeightY(x,     y,     elevStep, _bw, _bh);
        var _cY10 = _cornerHeightY(x + 1, y,     elevStep, _bw, _bh);
        var _cY01 = _cornerHeightY(x,     y + 1, elevStep, _bw, _bh);
        var _cY11 = _cornerHeightY(x + 1, y + 1, elevStep, _bw, _bh);
        var _dU = (Math.abs(_cY10 - _cY00) + Math.abs(_cY11 - _cY01)) / 2;
        var _dV = (Math.abs(_cY01 - _cY00) + Math.abs(_cY11 - _cY10)) / 2;
        var uRep = Math.max(1, Math.round(Math.sqrt(ts * ts + _dU * _dU) / ts));
        var vRep = Math.max(1, Math.round(Math.sqrt(ts * ts + _dV * _dV) / ts));

        for (var j = 0; j <= segs; j++) {
            grid[j] = [];
            for (var i = 0; i <= segs; i++) {
                var lu = i / segs, lv = j / segs;
                grid[j][i] = pos.length / 3;
                pos.push((lu - 0.5) * ts, surf(lu, lv), (lv - 0.5) * ts);
                uv.push(lu * uRep, lv * vRep);
            }
        }
        for (var qj = 0; qj < segs; qj++) {
            for (var qi = 0; qi < segs; qi++) {
                var a = grid[qj][qi], b = grid[qj][qi + 1];
                var c = grid[qj + 1][qi], d = grid[qj + 1][qi + 1];
                idx.push(a, c, b, b, c, d);
            }
        }
        var nTopIdx = idx.length;
        /* Drop a closing skirt wherever the continuous landform ENDS — i.e. the
           neighbour is off-board, void, or a non-natural tile (water/lava/fluid)
           that renders as its own flat voxel box. Without this, a height gap to
           such a neighbour leaves a see-through hole in the map. Natural-render
           neighbours are welded by shared corner heights, so they get no wall. */
        function needsSkirt(tx, ty) {
            if (tx < 0 || ty < 0 || tx >= _bw || ty >= _bh) return true;
            var t = (typeof getTerrainAt === 'function') ? getTerrainAt(tx, ty) : null;
            if (!t || t.indexOf('void') === 0) return true;
            if (typeof _FLUID_TERRAIN_SET !== 'undefined' && _FLUID_TERRAIN_SET[t]) return true;
            if (t === 'lava') return true;
            return false;
        }
        function topPt(i, jj) { var lu = i / segs, lv = jj / segs; return [(lu - 0.5) * ts, surf(lu, lv), (lv - 0.5) * ts]; }
        function skirt(p0, p1) {
            var base = pos.length / 3;
            pos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p1[0], floorY, p1[2], p0[0], floorY, p0[2]);
            uv.push(0, 0, 1, 0, 1, (p1[1] - floorY) / ts, 0, (p0[1] - floorY) / ts);
            idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
        var s;
        if (needsSkirt(x + 1, y)) for (s = 0; s < segs; s++) skirt(topPt(segs, s), topPt(segs, s + 1));
        if (needsSkirt(x - 1, y)) for (s = 0; s < segs; s++) skirt(topPt(0, s + 1), topPt(0, s));
        if (needsSkirt(x, y + 1)) for (s = 0; s < segs; s++) skirt(topPt(s + 1, segs), topPt(s, segs));
        if (needsSkirt(x, y - 1)) for (s = 0; s < segs; s++) skirt(topPt(s, 0), topPt(s + 1, 0));
        var nSideIdx = idx.length - nTopIdx;

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        geo.addGroup(0, nTopIdx, 2);
        if (nSideIdx > 0) geo.addGroup(nTopIdx, nSideIdx, 0);
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, _buildBeveledMaterials(tKey, sKey));
    }

    var _bevelMatCache = new Map();
    function _buildBeveledMaterials(topKey, sideKey) {
        var evp = _evPaletteActive();
        var ck = (evp ? 'EV|' : '') + (topKey || '_') + '|' + (sideKey || topKey || '_') + _tintKeyPart(topKey, sideKey);
        if (_bevelMatCache.has(ck)) return _bevelMatCache.get(ck);
        var topTex = getTerrainTexture(topKey);
        var sideTex = getTerrainTexture(sideKey || topKey);
        /* Top texture must wrap so steep tiles can repeat it (see uRep/vRep in
           _buildNaturalTileMesh); flat tiles keep a 0..1 span so this is a no-op
           for them. */
        if (topTex) { topTex.wrapS = THREE.RepeatWrapping; topTex.wrapT = THREE.RepeatWrapping; }
        if (sideTex) { sideTex.wrapS = THREE.RepeatWrapping; sideTex.wrapT = THREE.RepeatWrapping; }
        var mats = [];
        for (var i = 0; i < 6; i++) {
            var isTop = (i === 2);
            var tex = isTop ? topTex : sideTex;
            var faceKey = isTop ? topKey : (sideKey || topKey);
            if (tex) { mats.push(_evTintMat(new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), faceKey)); }
            else {
                var c = evp ? _evColor(faceKey) : new THREE.Color(isTop ? 0x556655 : 0x443322);
                mats.push(new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
            }
        }
        for (var mi = 0; mi < mats.length; mi++) mats[mi]._ew_shared = true;
        _bevelMatCache.set(ck, mats);
        return mats;
    }

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
        /* Move-destination BASE colours are now neutral — AP cost is conveyed by
           the pip dots (uDots), not the colour. Colour is repurposed to encode
           the TACTICAL consequence of standing on the tile (strike/hazard/etc,
           see the tactical entries below; resolved in _getSharedHlMat). Walk tiles read as a
           calm slate; jump/takeoff keep a faint teal so the move-TYPE cue (which
           is non-redundant) survives when a tile has no tactical meaning. */
        'move':            0x6f8296,
        'move-jump':       0x33a8bb,
        'move-takeoff':    0x33a8bb,
        'move-2ap':        0x6f8296,
        'move-3ap':        0x6f8296,
        'move-edge':       0x991111,
        /* Tactical move-tile overlays (appended as tokens by ui.js): */
        'strike':          0xffcc33,   /* gold   — can attack/cast a visible enemy from here */
        'hazard':          0xff3a3a,   /* crimson— ending here damages you / bad status */
        'slow':            0x4a78c8,   /* steel  — terrain costs extra movement to enter */
        'benefit':         0x33dd77,   /* green  — healing terrain / cover */
        'exposed':         0xff7722,   /* orange — drawn as a hatched warning border (shader) */
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
        'uniform float uExposed;',
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
        '',
        '  // EXPOSED warning: animated diagonal hazard-tape stripes hugging the',
        '  // tile border, drawn in orange OVER whatever base colour the tile has,',
        '  // so a tile can read "I can strike from here" (gold fill) AND "I would',
        '  // be in an enemy\'s reach here" (orange border) at the same time.',
        '  float exposedFx = 0.0;',
        '  if (uExposed > 0.5) {',
        '    float hatch = abs(fract((uv.x - uv.y) * 7.0 + uTime * 0.55) - 0.5) * 2.0;',
        '    float stripe = smoothstep(0.45, 0.85, hatch);',
        '    float band = 1.0 - smoothstep(0.0, 0.17, edge);',
        '    exposedFx = stripe * band * (0.78 + 0.22 * sin(uTime * 3.0));',
        '  }',
        '',
        '  float alpha = (fill + border + glow + grid + brackets + dots) * uOpacity;',
        '  alpha = max(alpha, exposedFx * 0.85);',
        '  alpha = clamp(alpha, 0.0, 1.0);',
        '',
        '  float bright = border * 0.5 + brackets * 0.65 + dots * 0.85;',
        '  vec3 col = mix(uColor, vec3(1.0), clamp(bright, 0.0, 0.75));',
        '  col = mix(col, vec3(1.0, 0.46, 0.12), clamp(exposedFx, 0.0, 0.85));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    function _makeHlMaterial(color, opacity, edgeGlow, dotCount, exposed) {
        var c = new THREE.Color(color);
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor:    { value: c },
                uOpacity:  { value: opacity },
                uTime:     _hlGlobalTime,
                uEdgeGlow: { value: edgeGlow },
                uDots:     { value: dotCount || 0 },
                uExposed:  { value: exposed ? 1.0 : 0.0 }
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

    // ════════════════════════════════════════════════════════════════════
    // OCCLUDED-UNIT X-RAY SILHOUETTE
    // A holographic ghost of each unit's sprite, drawn ONLY where the unit is
    // hidden behind terrain/props, so the player can still read positions while
    // rotating the camera. Blue for the viewer's own units, red for enemies.
    //
    // No raycasting: the material is rendered with depthFunc = GreaterDepth, so
    // the GPU only paints fragments that lie BEHIND something already in the
    // depth buffer (terrain blocks, trees, rocks, props — all depthWrite:true).
    // Where the unit is in the open its fragments fail the test and nothing
    // draws, so the silhouette appears exactly when the real sprite is occluded.
    // It lives as a child of the sprite mesh, inheriting billboard facing, bob,
    // flip and hit-shake for free, and is hidden along with the group when fog
    // of war / concealment hides the unit — so fogged units stay hidden.
    // ════════════════════════════════════════════════════════════════════
    var SILHOUETTE_OWN_COLOR  = 0x4db8ff;   // friendly  → blue hologram
    var SILHOUETTE_ENEMY_COLOR = 0xff4242;  // enemy     → red hologram
    var SILHOUETTE_OPACITY = 0.6;

    var _silVertexShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    var _silFragmentShader = [
        'uniform sampler2D uMap;',
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'uniform float uTime;',
        'varying vec2 vUv;',
        'void main() {',
        '  float a = texture2D(uMap, vUv).a;',
        '  if (a < 0.35) discard;',                       // follow the sprite's silhouette
        '  float scan = 0.78 + 0.22 * sin(vUv.y * 90.0 - uTime * 6.0);', // holo scanlines
        '  float pulse = 0.85 + 0.15 * sin(uTime * 3.0);',
        '  vec3 col = mix(uColor * scan, vec3(1.0), 0.22);',             // lift toward white for glow
        '  gl_FragColor = vec4(col, uOpacity * pulse);',
        '}'
    ].join('\n');

    function _makeSilhouetteMaterial(color, tex) {
        return new THREE.ShaderMaterial({
            uniforms: {
                uMap:     { value: tex || null },
                uColor:   { value: new THREE.Color(color) },
                uOpacity: { value: SILHOUETTE_OPACITY },
                uTime:    _hlGlobalTime
            },
            vertexShader: _silVertexShader,
            fragmentShader: _silFragmentShader,
            transparent: true,
            depthTest: true,
            depthFunc: THREE.GreaterDepth,   // paint only where occluded
            depthWrite: false,
            // The billboard's lower edge sits right on the ground line, so the
            // hairline sliver at the unit's feet lands exactly on the GreaterDepth
            // boundary and shimmers every frame. A negative polygonOffset pulls the
            // ghost slightly toward the camera so those near-coplanar fragments FAIL
            // the test (no flicker), while a real occluder — wall, tree, hill — still
            // puts the ghost far enough behind to draw the x-ray as intended.
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4,
            side: THREE.DoubleSide,
            fog: false
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
    // Tile size the terrain mesh was last built at. CONFIG.tileSize is the menu
    // value (MENU_TILE) while a menu is open and the battle value (BASE_TILE)
    // during a match. Because the renderer runs a continuous animation loop, a
    // match started from a menu can flip the terrain version and rebuild while
    // tileSize is still the menu value — baking a mis-scaled board that never
    // rebuilds (units/camera use the battle size, so the board looks tiny and
    // floats far away). Tracking the build-time size lets renderFrame force a
    // full rebuild the instant the size changes. -1 = nothing built yet.
    var _lastBuiltTileSize = -1;

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

    /* Smooth fog-of-war reveal/hide. Terrain tiles + props + decorations no longer
       pop on/off the instant a tile enters or leaves vision — instead each tile
       carries a reveal opacity (0 = fully fogged, 1 = fully seen) that lerps toward
       its target, and the holographic fog box over a hidden tile fades in/out in
       lock-step with it. _fogTiles tracks the per-tile fade for the terrain side;
       each entry in _fogMeshes carries its own (.fade/.fadeTarget) for the box. */
    var _fogTiles = new Map();          // pk -> { op, swapped, meshes, tileRef }
    var _fogBuiltBw = 0, _fogBuiltBh = 0;
    var FOG_FADE_RATE = 5.5;            // per-second smoothing for reveal/hide fades

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

    // Frame-by-frame sprite-sheet animations (e.g. Catgirl attack/meow). Keyed
    // by unit id while an action plays the strip on the unit's billboard.
    var _spriteAnimTweens = new Map();
    var SPRITE_ANIM_ATTACK_MS = 350;
    var SPRITE_ANIM_SPELL_MS = 500;

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

    // Damage/heal/mana NUMBERS render with a vertical gradient (`grad`, top→bottom)
    // and a heavier gothic-serif weight; WORD callouts ("SUPER EFFECTIVE", "DODGE!")
    // fall back to the flat `color` and a lighter, letter-spaced label treatment so
    // the two read as clearly different things. _buildFloatTextCanvas picks which
    // path to use per string (numeric vs. label).
    var _GRAD_FIRE = ['#ffd23a', '#ff7a18', '#d11010']; // orange → red (damage)
    var _GRAD_LIFE = ['#c8ffd6', '#48e06d', '#12993a']; // pale → deep green (heal)
    var _GRAD_MANA = ['#d6f1ff', '#5bb8ff', '#1f6fe0']; // pale → deep blue (mana)
    var _GRAD_GOLD = ['#fff3b0', '#ffd24a', '#e0a000']; // light → amber (gold/AP/level)
    var _FLOAT_STYLES = {
        'damage':        { color: '#ff5a4a', grad: _GRAD_FIRE, stroke: '#240202', fontSize: 52 },
        'heal':          { color: '#5cf07e', grad: _GRAD_LIFE, stroke: '#052813', fontSize: 50 },
        'mp':            { color: '#6ec8ff', grad: _GRAD_MANA, stroke: '#031f3c', fontSize: 44 },
        'revive':        { color: '#ffd700', grad: _GRAD_GOLD, stroke: '#3a2600', fontSize: 50 },
        'crit':          { color: '#ffcc00', grad: _GRAD_GOLD, stroke: '#3a1a00', fontSize: 64, label: true },
        'dodge':         { color: '#d6d9e6', stroke: '#10131c', fontSize: 42, label: true },
        'counter':       { color: '#ff9a55', grad: _GRAD_FIRE, stroke: '#2a1000', fontSize: 44, label: true },
        'xp':            { color: '#dda0ff', stroke: '#22103a', fontSize: 36, label: true },
        'levelup':       { color: '#ffe27a', grad: _GRAD_GOLD, stroke: '#3a2600', fontSize: 56, label: true },
        'streak':        { color: '#ff6a4a', grad: _GRAD_FIRE, stroke: '#240202', fontSize: 50, label: true },
        'laststd':       { color: '#ffe27a', grad: _GRAD_GOLD, stroke: '#3a2600', fontSize: 54, label: true },
        'overkill':      { color: '#ff3a2a', grad: _GRAD_FIRE, stroke: '#240202', fontSize: 60, label: true },
        'achieve':       { color: '#ffd700', grad: _GRAD_GOLD, stroke: '#3a2600', fontSize: 42, label: true },
        'protect-block': { color: '#5cb8ff', grad: _GRAD_MANA, stroke: '#031f3c', fontSize: 42, label: true },
        'pickup':        { color: '#ffd86b', grad: _GRAD_GOLD, stroke: '#3a2600', fontSize: 40 },
        'buff':          { color: '#9fe6ff', stroke: '#052236', fontSize: 42, label: true },
        'debuff':        { color: '#d68cff', stroke: '#22103a', fontSize: 42, label: true },
        'status':        { color: '#ffd86b', stroke: '#3a2600', fontSize: 40, label: true },
        'neutral':       { color: '#f0f0f0', stroke: '#101010', fontSize: 42, label: true },
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
        var evp = _evPaletteActive();
        var ck = (evp ? 'EV|' : '') + (topKey || '_') + '|' + (sideKey || topKey || '_') + _tintKeyPart(topKey, sideKey);
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
            var faceKey = isTop ? topKey : (sideKey || topKey);

            if (tex) { mats.push(_evTintMat(new THREE.MeshLambertMaterial({ map: tex }), faceKey)); }
            else {
                var c = evp ? _evColor(faceKey) : new THREE.Color(isTop ? 0x556655 : 0x443322);
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
            var faceKey = isTop ? topKey : (sideKey || topKey);
            var matOpts = {
                emissive: emissiveColor,
                emissiveIntensity: emissiveInt
            };
            if (tex) {
                matOpts.map = tex;
            } else {
                matOpts.color = new THREE.Color(isTop ? 0x883311 : 0x661100);
            }
            mats.push(_evTintMat(new THREE.MeshLambertMaterial(matOpts), faceKey));
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

        var mat = _evTintMat(new THREE.MeshLambertMaterial(matOpts), terrainKey);

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
                mats.push(_evTintMat(new THREE.MeshLambertMaterial(matOpts), sideKey || topKey));
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

    /* Organic top-swell at a tile's centre, matching the beveled terrain dome
       (0 for flat-cube / fluid / multi-layer tiles). Keeps props, units, range
       tiles and highlights riding the same surface as the ground mesh. */
    /* True when a tile is rendered as beveled organic ground (single-layer,
       natural terrain) — i.e. its top actually follows the surface swell. */
    function _tileIsBeveled(x, y) {
        if (!_naturalTerrainActive()) return false;
        var col = state.boardColumns && state.boardColumns[y] && state.boardColumns[y][x];
        if (col && col.length > 1) return false;
        var tKey = (typeof getTerrainAt === 'function') ? getTerrainAt(x, y)
                 : (col && col.length ? col[col.length - 1].terrain : null);
        return _isBeveledTerrain(tKey);
    }
    function _tileSurfaceLift(x, y) {
        if (BEVEL.amp <= 0 || !_tileIsBeveled(x, y)) return 0;
        var ts = CONFIG.tileSize || BASE_TILE;
        return _surfaceLift(x * ts + ts / 2, y * ts + ts / 2);
    }

    function tileTopY(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;

        /* Roof-walkable buildings are anchored to the VOXEL ground (baseH*ts) and
           their roof plane sits at baseH*ts + _roofZPx, INDEPENDENT of the natural
           smoothing (_buildBuildingPrism uses getBaseHeightAt, not tileTopY). Resolve
           the roof the same way FIRST so roof move-tiles / VFX land on the roof — on
           natural terrain the old code returned _naturalSurfaceY (ground) and buried
           them at the base. */
        if (typeof getObjectAt === 'function') {
            var robj = getObjectAt(x, y);
            if (robj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[robj] && OBJECT_RULES[robj].roofWalkable) {
                var rSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[robj] : null;
                if (rSpr && rSpr._roofZPx > 0) {
                    var rH = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y)
                           : (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : 0;
                    return rH * ts * ELEV_STEP_RATIO + rSpr._roofZPx;
                }
            }
        }

        if (_isNaturalRenderTile(x, y)) return _naturalSurfaceY(x, y);

        var h = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(x, y)
              : (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : 0;

        return h * ts * ELEV_STEP_RATIO + _tileSurfaceLift(x, y) + _stairStandLift(x, y);
    }

    function unitSurfaceY(unit) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var ux = unit.x, uy = unit.y;

        if (typeof isUnitAirborne === 'function' && isUnitAirborne(unit)) {
            var h = unit.z || 0;
            return h * ts * ELEV_STEP_RATIO;
        }

        /* Roof-walkable building tiles only expose the ROOF as a standing surface
           (getWalkableSurfaces returns [roofZ] alone), so a unit on this tile is on
           the roof — place it on the roof plane (voxel base + _roofZPx) on EVERY
           terrain type, including natural, so it doesn't sink to ground level. */
        if (typeof getObjectAt === 'function') {
            var robj = getObjectAt(ux, uy);
            if (robj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[robj] && OBJECT_RULES[robj].roofWalkable) {
                var rSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[robj] : null;
                if (rSpr && rSpr._roofZPx > 0) {
                    var rH = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(ux, uy)
                           : (state.boardHeights && state.boardHeights[uy]) ? (state.boardHeights[uy][ux] || 0) : 0;
                    return rH * ts * ELEV_STEP_RATIO + rSpr._roofZPx;
                }
            }
        }

        if (_isNaturalRenderTile(ux, uy)) return _naturalSurfaceY(ux, uy);

        var baseH = (typeof getBaseHeightAt === 'function') ? getBaseHeightAt(ux, uy)
                  : (state.boardHeights && state.boardHeights[uy]) ? (state.boardHeights[uy][ux] || 0) : 0;
        var elevPx = baseH * ts * ELEV_STEP_RATIO + _tileSurfaceLift(ux, uy) + _stairStandLift(ux, uy);
        return elevPx;
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

        /* A staircase is ALWAYS a fixed 1×1×1 prop: it bridges exactly ONE
           elevation level and never stretches to match a taller neighbour.
           (User: "they should not stretch depending on their surrounding height,
           always 1×1×1.") The unit standing surface is lifted +0.5 level so a
           climber reads mid-slope (see _stairStandLift). */

        /* Explicitly-placed stairs (the editor stamps stairDir from the object's
           rotation) render wherever they sit, even on flat ground, facing the way
           the user spun them. */
        if (explicitDir) {
            var opposite = { N: 'S', S: 'N', E: 'W', W: 'E' };
            return { highDir: opposite[explicitDir] || 'N', lowH: ht, highH: ht + 1 };
        }

        /* Legacy auto barrier_passage: only ramp where a neighbour is actually
           higher — but clamp the rise to a single level so it never stretches. */
        if (maxNbr <= ht) return null;
        var lowH = Math.min(ht, minNbr);
        var highH = lowH + 1;

        var highDir = 'N';
        if (hS === minNbr && hN >= maxNbr) highDir = 'N';
        else if (hN === minNbr && hS >= maxNbr) highDir = 'S';
        else if (hE === minNbr && hW >= maxNbr) highDir = 'W';
        else if (hW === minNbr && hE >= maxNbr) highDir = 'E';
        else if (hN >= maxNbr) highDir = 'N';
        else if (hS >= maxNbr) highDir = 'S';
        else if (hW >= maxNbr) highDir = 'W';
        else highDir = 'E';

        return { highDir: highDir, lowH: lowH, highH: highH };
    }

    /* Standing-surface lift for a unit/tile that is a staircase: +0.5 of the
       (one-level) rise so a climber stands mid-slope rather than at the foot. */
    function _stairStandLift(x, y) {
        try {
            var _bw = (typeof bw === 'function') ? bw() : 0;
            var _bh = (typeof bh === 'function') ? bh() : 0;
            var ht = (state.boardHeights && state.boardHeights[y]) ? (state.boardHeights[y][x] || 0) : 0;
            var si = _isStairTile(x, y, ht, _bw, _bh);
            if (si) { var ts = CONFIG.tileSize || BASE_TILE; return (si.highH - si.lowH) * 0.5 * ts * ELEV_STEP_RATIO; }
        } catch (e) {}
        return 0;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
                /* Monument tiles carry invisible climb/collision voxels (gameplay
                   reads the full column); render only up to the ground floor so the
                   smooth _hz* mesh is the visual, not a stack of blocky cubes. */
                if (col && col.length && state._monumentTiles) {
                    var _mcap = state._monumentTiles.get(x + ',' + y);
                    if (_mcap !== undefined) col = col.filter(function (b) { return b.z <= _mcap; });
                }
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
                if (_naturalTerrainActive() && tKey && tKey.indexOf('void') !== 0 && tKey !== 'lava' && !_FLUID_TERRAIN_SET[tKey]) {
                    /* neighbour heights weld our corners → fingerprint them so an
                       edit to any neighbour correctly rebuilds this landform tile */
                    colFp = 'nat:' + _hLevelAt(x - 1, y) + ',' + _hLevelAt(x + 1, y) + ',' + _hLevelAt(x, y - 1) + ','
                          + _hLevelAt(x, y + 1) + ',' + _hLevelAt(x - 1, y - 1) + ',' + _hLevelAt(x + 1, y + 1) + ','
                          + _hLevelAt(x + 1, y - 1) + ',' + _hLevelAt(x - 1, y + 1);
                }
                /* Stairs depend on their orientation (stairDir) and — for legacy
                   auto-ramps — neighbour heights, so fold those into the cache
                   fingerprint or a rotated/edited staircase keeps the stale mesh. */
                if (tKey === 'barrier_passage') {
                    var _topSd = (col && col.length) ? (col[col.length - 1].stairDir || '') : '';
                    colFp += '|st:' + _topSd + ',' + _hLevelAt(x, y - 1) + ',' + _hLevelAt(x, y + 1) + ','
                          + _hLevelAt(x - 1, y) + ',' + _hLevelAt(x + 1, y);
                }
                /* Map-editor per-terrain tint is multiplied onto the materials at
                   build time (_evTintMat) but is invisible to the geometry cache,
                   so changing a tint left already-built tiles showing the stale
                   colour. Fold the active tint(s) for every terrain this tile uses
                   (top + side + each block's terrain/side) into the fingerprint so
                   a tint change — or a fill onto an already-placed terrain —
                   actually rebuilds the affected tiles. */
                var _tints = (typeof state !== 'undefined' && state) ? state.terrainTints : null;
                if (_tints) {
                    var _tintFp = '';
                    var _addTint = function (kk) { if (kk && _tints[kk]) _tintFp += kk + '=' + _tints[kk] + ';'; };
                    _addTint(tKey);
                    _addTint(sKey);
                    if (col && col.length) {
                        for (var _ti = 0; _ti < col.length; _ti++) {
                            var _ck = col[_ti].terrain;
                            _addTint(_ck);
                            if (typeof TERRAIN_SIDE_SPRITES !== 'undefined') _addTint(TERRAIN_SIDE_SPRITES[_ck] ?? null);
                        }
                    }
                    if (_tintFp) colFp += '|tint:' + _tintFp;
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
                var natural = _naturalTerrainActive() && tKey && tKey.indexOf('void') !== 0
                            && !isLava && !_FLUID_TERRAIN_SET[tKey];
                var m;
                if (natural) {
                    /* one continuous sloped landform; ignores voxel stacking */
                    m = _buildNaturalTileMesh(x, y, ts, elevStep, _bw, _bh, tKey, sKey);
                    m.position.set(x * ts + ts / 2, 0, y * ts + ts / 2);
                } else if (stairInfo) {
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

                        /* Group the column into contiguous block-runs, breaking
                           at terrain changes AND at GAPS (missing z levels). A gap
                           means the run below it is capped by an open surface — its
                           top block is where a unit stands, so it is left undrawn
                           (toZ = lastPresent-1), leaving the space above open (this
                           is what makes walk-under arches / overhangs render hollow).
                           A terrain boundary inside a solid stack keeps its boundary
                           block drawn (it is enclosed from above). For a fully solid
                           column this produces exactly the same runs as before. */
                        var runs = [];
                        var segStart = -1, segTerrain = null;
                        for (var zz = 0; zz <= topZ; zz++) {
                            var zPresent = Object.prototype.hasOwnProperty.call(zTerrainMap, zz);
                            if (zPresent) {
                                var zt = zTerrainMap[zz] || 'grass';
                                if (segStart === -1) { segStart = zz; segTerrain = zt; }
                                else if (zt !== segTerrain) {
                                    runs.push({ fromZ: segStart, toZ: zz - 1, terrain: segTerrain });
                                    segStart = zz; segTerrain = zt;
                                }
                            } else if (segStart !== -1) {
                                /* gap: last present block (zz-1) is this run's open
                                   surface — undrawn, so leave it out of the cubes */
                                runs.push({ fromZ: segStart, toZ: zz - 2, terrain: segTerrain });
                                segStart = -1; segTerrain = null;
                            }
                        }
                        if (segStart !== -1) {
                            /* Topmost run. On SOLID columns draw the top voxel as a REAL
                               cube (toZ = topZ) so every filled layer is a full cube of
                               its own terrain. Combined with the elevStep shift on
                               m.position below, this makes voxel z occupy world-y
                               [(z-1)*elevStep, z*elevStep] — so a column's z0 cube lines
                               up exactly with a flat tile's cube ([-elevStep, 0]) and the
                               walkable surface stays at topZ*elevStep (unit heights
                               unchanged). Hollow / arch columns keep the top voxel as an
                               undrawn "surface skin" (toZ = topZ-1) so their walk-under
                               span stays open. */
                            runs.push({ fromZ: segStart, toZ: (state._hollowVoxels ? topZ - 1 : topZ), terrain: segTerrain });
                        }

                        /* Exposed ground floor: if z0 exists but z1 is a gap (open
                           space above ground — e.g. the walkable area UNDER a hollow
                           arch), draw a flat ground slab (top at y=0) like a normal
                           flat tile, so the floor renders instead of an empty void. */
                        if (Object.prototype.hasOwnProperty.call(zTerrainMap, 0) &&
                            !Object.prototype.hasOwnProperty.call(zTerrainMap, 1)) {
                            var gTerr = zTerrainMap[0] || 'grass';
                            var gSKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined') ? (TERRAIN_SIDE_SPRITES[gTerr] ?? null) : null;
                            var gMesh = new THREE.Mesh(_getBoxGeo(ts, elevStep), buildBoxMaterials(gTerr, gSKey));
                            gMesh.position.set(0, -elevStep / 2, 0);
                            m.add(gMesh);
                        }

                        for (var ri = 0; ri < runs.length; ri++) {
                            var run = runs[ri];
                            var rBottomY = run.fromZ * elevStep;
                            var rTopY = (run.toZ + 1) * elevStep;
                            var rH = rTopY - rBottomY;
                            if (rH < 0.5) continue;

                            /* 'void' bands are empty space (the editor fills the gap
                               between authored voxels with void) — render nothing so the
                               gap is actually open. */
                            if (run.terrain && run.terrain.indexOf('void') === 0) continue;

                            /* Every band renders as a solid cube of its OWN terrain on
                               every face (top AND sides). A genuine stacked-terrain
                               column therefore shows each layer as its own cube — no
                               band is recoloured by the surface terrain or by the layer
                               beneath it. */
                            var rTopTerrain = run.terrain;
                            var rSideTerrain = run.terrain;
                            var rSKey = (typeof TERRAIN_SIDE_SPRITES !== 'undefined') ? (TERRAIN_SIDE_SPRITES[rSideTerrain] ?? null) : null;
                            var rIsFluid = !!_FLUID_TERRAIN_SET[rTopTerrain];
                            var rIsLava = (rTopTerrain === 'lava');

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
                    /* Solid columns are shifted down one elevStep so voxel z0 sits at
                       the flat-tile floor level ([-elevStep, 0]) instead of one level
                       above it; the surface (top of the topZ cube) still lands at
                       topZ*elevStep. Hollow columns keep their original y=0 origin. */
                    m.position.set(x * ts + ts / 2, (state._hollowVoxels ? 0 : -elevStep), y * ts + ts / 2);
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
        _lastBuiltTileSize = ts;
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
                            /* leaf choice changes the canopy texture → bust the cache */
                            for (var _ei = 0; _ei < _rkRaw.length; _ei++) {
                                var _le = _rkRaw[_ei]; if (_le && _le.leaf) { for (var _ci = 0; _ci < _le.leaf.length; _ci++) s += _le.leaf.charCodeAt(_ci) * (_ei + 1); } }
                        }
                    }
                }
            }
        }
        if (state.monuments) {
            for (var mi = 0; mi < state.monuments.length; mi++) {
                var mo = state.monuments[mi];
                s += (mo.x + 1) * 131 + (mo.y + 1) * 197 + (mo.foot || 0) * 7 + (mo.maxH || 0) * 13;
                if (mo.kind) { for (var mc = 0; mc < mo.kind.length; mc++) s += mo.kind.charCodeAt(mc); }
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
        var ts = CONFIG.tileSize || BASE_TILE;

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

        /* Houses occupy a clean 2×2-tile footprint so they read as proper
           structures and their roofs (below) tile to match. Every roofWalkable
           object is a house — that's building_*, abandoned_building_*,
           ancient_building AND church / church_* / shop (item shop), so the old
           shop/church now match the buildings instead of staying 1×1. Columns
           (not roofWalkable) keep their own sprite-derived size. We remember how
           much we widened the footprint (houseFactor) and apply the same factor
           to the height below, so a building that's twice as wide is also
           proportionally taller. */
        var isHouse = (typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[objKey] && OBJECT_RULES[objKey].roofWalkable);
        var houseFactor = 1;
        if (isHouse) {
            houseFactor = (ts * 2) / Math.max(1, side);
            side = Math.round(ts * 2);
        }
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

        /* Footprint was widened to 2×2 — scale the height to match, but CAP the
           vertical growth at 2×. Narrow sprites produce a large houseFactor
           ((ts*2)/side), which used to stretch buildings far too tall; clamp it
           so a building is only ever scaled up to 2× in height.
           gameH (below) is derived from the scaled roofZ, so LOS and the
           roof-standing height rise to match the taller building, and the roof
           tile-highlight (which rides tileTopY + _roofZPx) follows automatically. */
        if (isHouse) {
            var heightFactor = Math.min(2, houseFactor);
            roofZ = Math.round(roofZ * heightFactor);
            wallH = wallH * heightFactor;
        }

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
            ? _evTintMat(new THREE.MeshBasicMaterial({ map: roofTex, side: THREE.DoubleSide }), 'bricks_1')
            : new THREE.MeshBasicMaterial({ color: 0x8b6b4a, side: THREE.DoubleSide });
        var roofTilesN = isHouse ? Math.max(2, Math.round(side / ts)) : 1;
        if (roofTilesN <= 1) {
            var roofGeo = new THREE.PlaneGeometry(side, side);
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.rotation.x = -Math.PI / 2;
            roofMesh.position.y = roofZ + 0.5;
            g.add(roofMesh);
        } else {
            /* Roof = an N×N grid of brick panels (one per footprint tile) so it
               reads as a real multi-tile roof instead of a single stretched
               panel. Each quad samples the full 0..1 texture, so there's no
               RepeatWrapping (which renders black on NPOT textures). */
            var cell = side / roofTilesN;
            for (var rxi = 0; rxi < roofTilesN; rxi++) {
                for (var rzi = 0; rzi < roofTilesN; rzi++) {
                    var cellMesh = new THREE.Mesh(new THREE.PlaneGeometry(cell, cell), roofMat);
                    cellMesh.rotation.x = -Math.PI / 2;
                    cellMesh.position.set(
                        -side / 2 + cell / 2 + rxi * cell,
                        roofZ + 0.5,
                        -side / 2 + cell / 2 + rzi * cell
                    );
                    g.add(cellMesh);
                }
            }
        }

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

                var _faceCol;
                if (_evPaletteActive()) {
                    var _wh = _evColor('urban_wall');
                    _faceCol = new THREE.Color(_wh.r * b, _wh.g * b, _wh.b * b);
                } else {
                    _faceCol = new THREE.Color(b, b, b);
                }
                var faceMat = new THREE.MeshBasicMaterial({
                    map: wallTex, color: _faceCol,
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
        /* A 2×2 house is centred on the 2×2 tile block whose NW corner is its
           tile (x,y): tiles (x,y),(x+1,y),(x,y+1),(x+1,y+1). Shifting it by half
           a tile puts it dead-centre on those four tiles, so it never overhangs
           onto a neighbouring (possibly sloped) tile. The map data flattens &
           paves exactly that block. */
        if (isHouse) { posOffX = ts / 2; posOffZ = ts / 2; }
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
    // A per-instance metal/aluminium terrain texture: cloned so each structure
    // can set its own tiling without disturbing the shared terrain copy, yet it
    // still shares the source <img> so it appears once the async load finishes.
    function _turretMetalTex(key, repX, repY) {
        var url = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES[key]) ? TERRAIN_SPRITES[key][0] : null;
        if (!url) return null;
        var base = getTexture(url);
        if (!base) return null;
        var tex = base.clone();
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repX, repY);
        tex.needsUpdate = true;
        if (base.image && !base.image.complete && base.image.addEventListener) {
            base.image.addEventListener('load', function() {
                tex.needsUpdate = true; _objectsDirty = true;
            }, { once: true });
        }
        return tex;
    }

    // A box-shaped strut connecting two points in space — the building block of
    // the lattice radio-mast (legs, belts and diagonal cross-braces).
    function _turretStrut(p0, p1, thick, mat) {
        var dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
        var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        var m = new THREE.Mesh(new THREE.BoxGeometry(thick, len, thick), mat);
        m.position.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(dx, dy, dz).normalize());
        return m;
    }

    // The 5G Tower — a tapered four-leg lattice radio mast clad in aluminium,
    // topped with an antenna array and dotted with red aviation warning lights.
    function _buildFiveGTower(turret) {
        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(turret.x, turret.y);
        var g = new THREE.Group();

        var metalTex = _turretMetalTex('aluminium', 1, 3) || _turretMetalTex('metal', 1, 3);
        var latticeMat = metalTex
            ? new THREE.MeshLambertMaterial({ map: metalTex, color: 0xc8ccd4 })
            : new THREE.MeshLambertMaterial({ color: 0xc8ccd4 });

        var H = ts * 2.2;                       // tall radio mast
        var wBot = ts * 0.34, wTop = ts * 0.12; // half-width at base / top
        var SECTIONS = 5;
        var legT = ts * 0.035, braceT = ts * 0.02;
        var signs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        function corner(s, t) {
            var w = wBot + (wTop - wBot) * t;
            return new THREE.Vector3(s[0] * w, H * t, s[1] * w);
        }

        // four tapering legs, bottom belt, then per-section belts + X-bracing
        for (var c = 0; c < 4; c++) g.add(_turretStrut(corner(signs[c], 0), corner(signs[c], 1), legT, latticeMat));
        for (var fb = 0; fb < 4; fb++) g.add(_turretStrut(corner(signs[fb], 0), corner(signs[(fb + 1) % 4], 0), braceT, latticeMat));
        for (var s = 0; s < SECTIONS; s++) {
            var t0 = s / SECTIONS, t1 = (s + 1) / SECTIONS;
            for (var f = 0; f < 4; f++) {
                var a = signs[f], b = signs[(f + 1) % 4];
                var aB = corner(a, t0), bB = corner(b, t0), aT = corner(a, t1), bT = corner(b, t1);
                g.add(_turretStrut(aT, bT, braceT, latticeMat));   // belt
                g.add(_turretStrut(aB, bT, braceT, latticeMat));   // X brace
                g.add(_turretStrut(bB, aT, braceT, latticeMat));   // X brace
            }
        }

        // top platform + slim antenna mast
        var plat = new THREE.Mesh(new THREE.BoxGeometry(wTop * 2.6, ts * 0.04, wTop * 2.6), latticeMat);
        plat.position.y = H; g.add(plat);
        var mastH = ts * 0.55;
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(ts * 0.02, ts * 0.03, mastH, 6), latticeMat);
        mast.position.y = H + mastH / 2; g.add(mast);

        // the "5G" antenna panels — three flat radios around the upper section
        var panelMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a8 });
        for (var p = 0; p < 3; p++) {
            var ang = p * (Math.PI * 2 / 3), pr = wTop * 1.5;
            var panel = new THREE.Mesh(new THREE.BoxGeometry(ts * 0.05, ts * 0.30, ts * 0.12), panelMat);
            panel.position.set(Math.cos(ang) * pr, H * 0.82, Math.sin(ang) * pr);
            panel.rotation.y = -ang; g.add(panel);
        }

        // red warning lights — self-lit so the bloom pass makes them glow
        var redMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a, fog: false });
        function redLight(x, y, z, rad) {
            var b = new THREE.Mesh(new THREE.SphereGeometry(rad, 8, 6), redMat);
            b.position.set(x, y, z); return b;
        }
        g.add(redLight(0, H + mastH, 0, ts * 0.05));                 // top beacon
        g.add(redLight(wTop * 0.95, H * 0.62, wTop * 0.95, ts * 0.04));
        g.add(redLight(-wTop * 0.95, H * 0.62, -wTop * 0.95, ts * 0.04));

        // dark base pad
        var pad = new THREE.Mesh(new THREE.CircleGeometry(wBot * 1.25, 12),
            new THREE.MeshBasicMaterial({ color: 0x0a0806 }));
        pad.rotation.x = Math.PI / 2; pad.position.y = 0.5; g.add(pad);

        g.position.set(turret.x * ts + ts / 2, topY, turret.y * ts + ts / 2);
        g._ew_turretId = turret.id; return g;
    }

    function _buildTurret(turret) {
        if (turret.spellId === 'fiveGTower') return _buildFiveGTower(turret);

        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(turret.x, turret.y);
        var isSiege = turret.spellId === 'siegeTurret';
        var r = ts * (isSiege ? 0.42 : TURRET_RADIUS_RATIO);
        var h = ts * (isSiege ? 0.85 : TURRET_HEIGHT_RATIO);
        var col = turret.owner ? _viewerPlayerColor(turret.owner) : 0x888888;
        var g = new THREE.Group();

        // brushed-metal hull replaces the old brick cladding
        var metalTex = _turretMetalTex('metal', 3, 1) || _turretMetalTex('aluminium', 3, 1);
        var bodyMat, domeMat;
        if (metalTex) {
            bodyMat = new THREE.MeshLambertMaterial({ map: metalTex, color: 0xb8bcc4 });
            domeMat = new THREE.MeshLambertMaterial({ map: metalTex, color: 0xb8bcc4 });
        } else {
            bodyMat = new THREE.MeshLambertMaterial({ color: col });
            domeMat = new THREE.MeshLambertMaterial({ color: col });
        }
        var body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8, 1, true), bodyMat);
        body.position.y = h / 2; g.add(body);

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

        // ── rotating arm: the dome head + cannon swivel to track the target ──
        // (the cylindrical base stays put; battle.js keeps turret.facingAngle
        // pointed at the closest / currently-targeted enemy).
        var arm = new THREE.Group();
        arm.position.y = h;

        var dome = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
        arm.add(dome);

        var cL = ts * CANNON_LENGTH_RATIO;
        var cannon = new THREE.Mesh(new THREE.BoxGeometry(CANNON_THICKNESS, CANNON_THICKNESS, cL),
            new THREE.MeshLambertMaterial({ color: 0x333333 }));
        cannon.position.y = CANNON_THICKNESS; cannon.position.z = cL / 2;
        arm.add(cannon);

        if (turret.facingAngle != null) arm.rotation.y = -turret.facingAngle;
        g.add(arm);

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
        /* Tree canopies/tops are textured with the dedicated leaves.png sprite
           (was forest.png — the old grass/forest tile). */
        _treeForestTex = getTexture('https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/leaves.png');
        if (_treeForestTex) {
            _treeForestTex.wrapS = THREE.RepeatWrapping;
            _treeForestTex.wrapT = THREE.RepeatWrapping;
            _treeForestTex.repeat.set(1.5, 1);
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var v = _TREE_VARIANTS[objKey] || _TREE_VARIANTS.tree;

        var trunkH = ts * 1.2 * v.trunkHMul;
        var trunkR = ts * 0.10;
        var canopyR = ts * 0.48 * v.canopyRMul;

        var g = new THREE.Group();

        /* trunk — tapered cone with wood texture, tiled to match terrain pixel density */
        var trunkGeo = new THREE.ConeGeometry(trunkR, trunkH, 8, 1, false);
        var woodTex = _getTreeWoodTex();
        var _evp = false;   /* Entropy Vale colour tint removed — keep original tree colours */
        var _trunkCol = _evp ? _evTintHex('wood') : v.trunkColor;
        var trunkMat;
        if (woodTex) {
            trunkMat = new THREE.MeshBasicMaterial({ map: woodTex, color: new THREE.Color(_trunkCol), depthWrite: true });
        } else {
            trunkMat = new THREE.MeshBasicMaterial({ color: _trunkCol, depthWrite: true });
        }
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH * 0.5;
        g.add(trunk);

        /* canopy — squished sphere with forest texture, tiled so pixels stay crisp */
        var canopyGeo = new THREE.SphereGeometry(canopyR, 10, 7);
        var forestTex = _getTreeForestTex();
        var _canopyCol = _evp ? _evTintHex('tree') : v.canopyColor;   /* shares grass swatch (ent_verdant) */
        var canopyMat;
        if (forestTex) {
            canopyMat = new THREE.MeshBasicMaterial({ map: forestTex, color: new THREE.Color(_canopyCol), depthWrite: true });
        } else {
            canopyMat = new THREE.MeshBasicMaterial({ color: _canopyCol, depthWrite: true });
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

    /* ──────────────────────────────────────────────────────────────────────
       FOLIAGE OBJ MODELS — default trees (originally the Entropy Vale experiment)
       Swaps the procedural cone+sphere trees for real 3D meshes pulled from the
       R2 /Assets/foilage bucket. These are now the DEFAULT trees on EVERY map;
       _buildTree3D survives only as the per-tile fallback while a model is still
       loading (or fails). The Entropy-Vale-only behaviour that remains is the
       palette tint (_evTintMat), which no-ops on other maps, so non-natural maps
       get the same tree geometry with their normal untinted wood/leaf sprites.

       Bucket contents discovered:
         OBJ/Tree_1..Tree_10.obj        — leafy trees (materials: Bark + Tree_Leaves)
         OBJ/DeadTree_1..DeadTree_10.obj — bare trees  (material:  Bark)
       The OBJ geometry is wrapped with the game's existing pixel terrain sprites
       (wood.png on the trunk/branches, a grass/forest sprite on the canopy) so
       the models read in the same hand-pixelled style as the rest of the board.
       Models are loaded once, cached, and cloned per tile (shared geometry). The
       async load flips _objectsDirty so the real meshes swap in once ready; until
       then each tile falls back to the procedural tree.
       ────────────────────────────────────────────────────────────────────── */
    var _R2_FOLIAGE        = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/foilage/';
    var _FOLIAGE_OBJ_BASE  = _R2_FOLIAGE + 'OBJ/';
    var _FOLIAGE_TERRAIN_TEX = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/';

    /* Map the 6 logical tree keys onto distinct bucket models so a forest reads
       as a varied mix of full-canopy and bare trees. Tweak to experiment. */
    var _FOLIAGE_MODEL_FOR_KEY = {
        tree:   'Tree_1',
        tree_2: 'Tree_3',
        tree_3: 'Tree_6',
        tree_4: 'Tree_9',
        tree_5: 'DeadTree_2',
        tree_6: 'DeadTree_5'
    };
    /* Pixel sprite wrapped on the trunk/branches (Bark material group). */
    var _FOLIAGE_BARK_TEX = 'wood.png';
    /* Pixel sprite wrapped on the canopy (Tree_Leaves group). All tree tops now
       use the dedicated leaves.png sprite instead of the old grass/forest tiles
       (forest_2 / grass_2 / purple_grass).
       (tree_5/tree_6 are bare DeadTree models — they have no leaf group.) */
    var _FOLIAGE_LEAF_TEX_FOR_KEY = {
        tree:   'leaves.png',
        tree_2: 'leaves.png',
        tree_3: 'leaves.png',
        tree_4: 'leaves.png',
        tree_5: 'leaves.png',
        tree_6: 'leaves.png'
    };
    /* How many times each sprite tiles across the model's UVs (the OBJ UVs span
       ~0..2.3, so this multiplies on top). Higher = smaller, denser pixels that
       stretch/distort less across big canopy and trunk faces. */
    var _FOLIAGE_BARK_REPEAT = 2.5;
    var _FOLIAGE_LEAF_REPEAT = 2.5;

    var _foliageModelCache = {};   /* name -> { obj, loading, failed } */
    var _foliageTexCache   = {};   /* file -> THREE.Texture (Nearest, tiled) */

    /* Load a terrain sprite as a tiling, pixel-filtered (NearestFilter) texture
       to wrap onto the foliage geometry — matches the rest of the board's look. */
    function _getFoliagePixelTex(file, repeat) {
        if (_foliageTexCache[file]) return _foliageTexCache[file];
        var t = textureLoader.load(_FOLIAGE_TERRAIN_TEX + file, function() { _objectsDirty = true; });
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.repeat.set(repeat || 1, repeat || 1);
        _foliageTexCache[file] = t;
        return t;
    }

    function _normalizeFoliageModel(root) {
        /* Mark every child geometry shared so _disposeR keeps it alive across the
           clones placed on the board. */
        root.traverse(function(node) {
            if (node.isMesh && node.geometry) node.geometry._ew_shared = true;
        });
        root._ew_bbox = new THREE.Box3().setFromObject(root);
        return root;
    }

    /* Kick a one-time async load; returns the loaded Object3D or null while it is
       still loading / failed. */
    function _loadFoliageModel(name) {
        var entry = _foliageModelCache[name];
        if (entry) return entry.obj;
        entry = _foliageModelCache[name] = { obj: null, loading: true, failed: false };
        if (typeof THREE.OBJLoader !== 'function') { entry.loading = false; entry.failed = true; return null; }
        try {
            new THREE.OBJLoader().load(
                _FOLIAGE_OBJ_BASE + name + '.obj',
                function(root) {
                    _normalizeFoliageModel(root);
                    entry.obj = root; entry.loading = false;
                    _objectsDirty = true;   /* re-render so the model swaps in */
                },
                undefined,
                function() { entry.loading = false; entry.failed = true; }
            );
        } catch (e) { entry.loading = false; entry.failed = true; }
        return null;
    }

    function _foliageHash(x, y) {
        var h = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        h = (h ^ (h >>> 13)) >>> 0;
        return h;
    }

    /* Placed foliage model for (objKey,x,y). Null if the model isn't ready yet —
       caller then falls back to _buildTree3D for that tile. */
    function _buildFoliageObj(objKey, x, y) {
        var name = _FOLIAGE_MODEL_FOR_KEY[objKey];
        if (!name) return null;
        var src = _loadFoliageModel(name);
        if (!src || !src._ew_bbox) return null;

        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var bb = src._ew_bbox;
        var modelH = (bb.max.y - bb.min.y) || 1;

        var barkTex = _getFoliagePixelTex(_FOLIAGE_BARK_TEX, _FOLIAGE_BARK_REPEAT);
        var leafFile = _FOLIAGE_LEAF_TEX_FOR_KEY[objKey] || 'forest_2.png';
        /* Per-tree leaf override authored in the map editor (entry.leaf = 'leaves_3'…). */
        try {
            var _lstk = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : null;
            if (_lstk) {
                for (var _li = 0; _li < _lstk.length; _li++) {
                    var _lk = _lstk[_li].key || _lstk[_li];
                    if (_lk === objKey && _lstk[_li].leaf) { leafFile = _lstk[_li].leaf + '.png'; break; }
                }
            }
        } catch (e) {}
        var leafTex = _getFoliagePixelTex(leafFile, _FOLIAGE_LEAF_REPEAT);

        /* OBJLoader gives a mesh that uses several materials an ARRAY of
           materials (one per geometry group). Map element-wise so the
           Tree_Leaves group gets the canopy sprite and the Bark group gets the
           wood sprite — checking node.material.name alone would miss the leaves. */
        function _pickFoliageMat(srcMat) {
            var mname = (srcMat && srcMat.name) || '';
            if (mname === 'Tree_Leaves') {
                return _evTintMat(new THREE.MeshLambertMaterial({
                    map: leafTex, side: THREE.DoubleSide, depthWrite: true
                }), 'tree');   /* tree canopy shares the grass swatch (ent_verdant) */
            }
            return _evTintMat(new THREE.MeshLambertMaterial({ map: barkTex }), 'wood');
        }

        var model = src.clone(true);
        model.traverse(function(node) {
            if (!node.isMesh) return;
            node.material = Array.isArray(node.material)
                ? node.material.map(_pickFoliageMat)
                : _pickFoliageMat(node.material);
        });

        /* Stand the tree ~1.9 tiles tall with a little deterministic jitter so a
           cluster of the same key doesn't look stamped. */
        var rnd = _foliageHash(x, y);
        var jitter = 0.85 + ((rnd & 0xff) / 255) * 0.45;     /* 0.85 .. 1.30 */
        var s = (ts * 1.9 / modelH) * jitter;

        model.scale.setScalar(s);
        model.position.x = -((bb.min.x + bb.max.x) * 0.5) * s;
        model.position.z = -((bb.min.z + bb.max.z) * 0.5) * s;
        model.position.y = -bb.min.y * s;
        /* Honor an editor-authored rotation (entry.rot); else the deterministic
           per-tile yaw so a forest doesn't look stamped. */
        var _frot = null;
        try {
            var _rstk = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : null;
            if (_rstk) { for (var _ri = 0; _ri < _rstk.length; _ri++) { var _rk2 = _rstk[_ri].key || _rstk[_ri]; if (_rk2 === objKey && _rstk[_ri].rot) { _frot = _rstk[_ri].rot; break; } } }
        } catch (e) {}
        model.rotation.y = (_frot != null ? -_frot : (rnd % 360)) * Math.PI / 180;

        var g = new THREE.Group();
        g.add(model);
        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    function _buildCrossBillboard(objKey, x, y) {
        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
        var w = ts, h = ts * BILLBOARD_DEFAULT_H;
        if (spr && spr.width && spr.height) { h = ts * BILLBOARD_DEFAULT_H; w = h * (spr.width / spr.height); }
        var mat = _evTintMat(new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true
        }), objKey);
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
        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
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

    /* Lamp posts placed from the map editor render as the SAME authored 3D model
       used by the cosmetic Entropy-Vale street lamps (Assets/misc/streetlamp/
       Street Lamp.obj): a dark metal post with a self-lit warm lantern and a
       soft glow head. Honors an editor-authored rotation (entry.rot). */
    function _buildLampPostObj(objKey, x, y) {
        if (typeof _miscModelInstance !== 'function') return null;
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var lampH = ts * 2.0;             // ~2 tiles tall (matches the auto lamps)
        var headY = lampH * 0.86;         // lantern sits near the top

        function _lampMat(node, srcMat) {
            var nm = (srcMat && srcMat.name) || '';
            if (nm === 'Glass') return new THREE.MeshBasicMaterial({ color: 0xffe6b0, fog: false });
            return new THREE.MeshLambertMaterial({ color: 0x23262e, fog: false });
        }

        var g = new THREE.Group();
        var lamp = _miscModelInstance(_R2_MISC + 'streetlamp/Street%20Lamp.obj', false, lampH, { matPick: _lampMat });

        var rot = 0;
        try {
            var stack = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : null;
            if (stack) {
                for (var i = 0; i < stack.length; i++) {
                    var ek = stack[i].key || stack[i];
                    if (ek === objKey && stack[i].rot) { rot = stack[i].rot; break; }
                }
            }
        } catch (e) {}
        lamp.rotation.y = -rot * Math.PI / 180;
        g.add(lamp);

        if (typeof _hzGlowCore === 'function') {
            var glow = _hzGlowCore(ts * 0.30, 0xffd27a, 0xff9a3c);
            glow.position.y = headY;
            g.add(glow);
        }

        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    function _buildBillboard(objKey, x, y) {
        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(x, y), tex = getObjectTexture(objKey);
        var spr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[objKey] : null;
        var w = ts, h = ts * BILLBOARD_DEFAULT_H;
        if (spr && spr.width && spr.height) { h = ts * BILLBOARD_DEFAULT_H; w = h * (spr.width / spr.height); }
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), _evTintMat(new THREE.MeshBasicMaterial({
            map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, depthWrite: true
        }), objKey));
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
            var bob = Math.sin(now * 1.2 + i * 3.14) * (CONFIG.tileSize || BASE_TILE) * 0.06;
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
    /* ── Grass Tuft: a cluster of thin tapered billboard blades ───────────
       Each blade is a single double-sided tapered quad (wide-ish at the root,
       pinched at the tip) wrapped with the grass_2.png terrain sprite (so the
       blades read in the same pixel style as the board) and shaded by a vertex
       brightness ramp — darker at the root, full-bright at the tip. Each blade
       samples a random sub-region of the texture for variety. Blades scatter
       across the tile at random yaw with a slight lean so the tuft reads as
       grassy from any camera angle. One shared MeshBasicMaterial per tuft →
       cheap. Used by the all-map cosmetic scatter AND the editor-placed
       'grass_tuft' object. Cosmetic only: no collision. */
    var _grassBladeMat = null;
    function _getGrassMat() {
        if (!_grassBladeMat) {
            /* grass_2.png from the R2 /Assets/Sprites/terrain folder, pixel-filtered
               and repeat-wrapped (so per-blade UV offsets can roam the texture). */
            var tex = _getFoliagePixelTex(GRASS.texture, 1);
            _grassBladeMat = new THREE.MeshBasicMaterial({
                map: tex, vertexColors: true, side: THREE.DoubleSide, depthWrite: true
            });
            /* shared across every tuft — keep it alive across deco rebuilds */
            _grassBladeMat._ew_shared = true;
        }
        return _grassBladeMat;
    }
    function _buildGrassTuft3D(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var g = new THREE.Group();

        /* Seed-based pseudo-random for a consistent tuft per tile */
        var seed = (x * 911 + y * 1607 + 53) & 0xFFFF;
        var _sr = function() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return (seed & 0xFFFF) / 0xFFFF; };

        var rootS = GRASS.rootShade, tipS = GRASS.tipShade;
        var n = GRASS.bladesMin + Math.floor(_sr() * (GRASS.bladesMax - GRASS.bladesMin + 1));

        /* Build one merged BufferGeometry for the whole tuft (2 triangles/blade). */
        var verts = [];   // x,y,z per vertex
        var cols  = [];   // r,g,b per vertex (brightness ramp, multiplies the texture)
        var uvs   = [];   // u,v per vertex (random sub-region of grass_2.png per blade)
        for (var bi = 0; bi < n; bi++) {
            var h  = ts * (GRASS.heightMin + _sr() * (GRASS.heightMax - GRASS.heightMin));
            var hw = ts * GRASS.width * (0.7 + _sr() * 0.6);  // base half-width
            var ox = (_sr() - 0.5) * ts * GRASS.spread;
            var oz = (_sr() - 0.5) * ts * GRASS.spread;
            var yaw = _sr() * Math.PI * 2;
            var cy = Math.cos(yaw), sy = Math.sin(yaw);
            /* slight lean so blades aren't all bolt-upright */
            var leanX = (_sr() - 0.5) * hw * 1.6;
            var leanZ = (_sr() - 0.5) * hw * 1.6;
            /* per-blade brightness jitter so the field isn't flat */
            var j = 0.85 + _sr() * 0.3;
            /* MASK a blade-sized window out of the 128² grass_2 texture (the tile
               texture maps 0..1 over ts world-px, so texels are ~1:1 with world-px).
               Sizing the UV window to the blade's own footprint keeps that 1:1
               density — no stretching — like a small masked cutout in Photoshop.
               The window is positioned randomly per blade for variety. NearestFilter
               on the texture keeps the few sampled texels crisp/blocky. */
            var tipHw = hw * 0.18;
            var uSpan = Math.min(0.95, (2 * hw) / ts);   // base width as a tex fraction
            var vSpan = Math.min(0.95, h / ts);          // blade height as a tex fraction
            var uMin = _sr() * (1 - uSpan), vMin = _sr() * (1 - vSpan);
            var uC = uMin + uSpan / 2;
            var vBase = vMin, vTip = vMin + vSpan;
            var uBL = uMin, uBR = uMin + uSpan;                  // base edges
            var uTL = uC - tipHw / ts, uTR = uC + tipHw / ts;    // pinched tip edges (narrower slice)

            /* local blade points (before yaw): base-left, base-right, tip */
            function _push(lx, ly, lz, top, u, v) {
                var wx = ox + (lx * cy - lz * sy) + (top ? leanX : 0);
                var wz = oz + (lx * sy + lz * cy) + (top ? leanZ : 0);
                verts.push(wx, ly, wz);
                var s = (top ? tipS : rootS) * j;
                cols.push(s, s, s);
                uvs.push(u, v);
            }
            /* quad as two triangles: (bl, br, tr) + (bl, tr, tl), tip pinched */
            // tri 1: base-left, base-right, tip-right
            _push(-hw, 0, 0, false, uBL, vBase); _push(hw, 0, 0, false, uBR, vBase); _push(tipHw, h, 0, true, uTR, vTip);
            // tri 2: base-left, tip-right, tip-left
            _push(-hw, 0, 0, false, uBL, vBase); _push(tipHw, h, 0, true, uTR, vTip); _push(-tipHw, h, 0, true, uTL, vTip);
        }

        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        geo.setAttribute('color',    new THREE.Float32BufferAttribute(cols, 3));
        geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
        /* MeshBasicMaterial is unlit — no normals needed. */

        var mesh = new THREE.Mesh(geo, _getGrassMat());
        g.add(mesh);
        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        g._ew_decoX = x;
        g._ew_decoY = y;
        return g;
    }

    function _buildRockCluster3D(x, y, texOverride) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var rockTex = texOverride || _getBoulderTexture();
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
            var mat;
            /* Entropy Vale colour tint removed — rocks use the default grey shading on every map */
            mat = rockTex
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

    /* ── Editor-placed cosmetic Rock object ───────────────────────────────
       A standalone boulder cluster the user can drop on ANY terrain (moon,
       grass, …). The automatic rock scatter in rebuildTerrainDecorations only
       appears where the *ground tile itself* is rocks_*, which is why the moon
       map used to need rock-terrain patches to show any rocks. This object
       decouples rocks from the ground so they can sit on the lunar surface (or
       anywhere) untethered. The per-placement texture variant (entry.leaf =
       'rocks_1'..'rocks_5') picks which rocks sprite wraps the boulders — the
       same per-placement texture mechanism trees use for their leaves. No
       collision (OBJECT_RULES.rock.cosmetic). */
    var _ROCK_OBJ_DEFAULT_TEX = 'rocks_1';
    /* Dedicated, per-file texture cache (NOT the shared terrain cache) so setting
       wrap/repeat for the boulder never mutates the terrain texture object. */
    var _rockObjTexCache = {};
    function _getRockObjTexture(file) {
        if (_rockObjTexCache[file]) return _rockObjTexCache[file];
        var t = textureLoader.load(_FOLIAGE_TERRAIN_TEX + file + '.png', function() { _objectsDirty = true; });
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.repeat.set(1.5, 1);
        _rockObjTexCache[file] = t;
        return t;
    }
    function _buildRock3D(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);

        /* Per-placement texture variant lives in entry.leaf (the generic texture
           slot): 'rocks_1'..'rocks_5' or a moon regolith ('moon','moon_2',…). */
        var rockFile = _ROCK_OBJ_DEFAULT_TEX;
        try {
            var _stk = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : null;
            if (_stk) {
                for (var i = 0; i < _stk.length; i++) {
                    var k = _stk[i].key || _stk[i];
                    if (k === 'rock' && _stk[i].leaf) { rockFile = _stk[i].leaf; break; }
                }
            }
        } catch (e) {}
        var tex = _getRockObjTexture(rockFile);

        var g = new THREE.Group();
        var seed = (x * 73 + y * 137 + 42) & 0xFFFF;
        var _sr = function() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return (seed & 0xFFFF) / 0xFFFF; };

        var count = 2 + Math.floor(_sr() * 3); /* 2-4 boulders */
        for (var ri = 0; ri < count; ri++) {
            var radius = ts * (0.10 + _sr() * 0.13);
            /* SphereGeometry has clean lat/long UVs so the chosen rock sprite
               actually wraps and reads — IcosahedronGeometry's UVs are degenerate
               and collapse every variant into the same flat grey lump. Deform
               for an irregular boulder and squish Y so it sits low. */
            var geo = new THREE.SphereGeometry(1, 10, 8);
            var pa = geo.getAttribute('position');
            for (var vi = 0; vi < pa.count; vi++) {
                var vx = pa.getX(vi), vy = pa.getY(vi), vz = pa.getZ(vi);
                var noise = 1 + 0.28 * Math.sin(vx * 6.1 + vy * 9.3 + ri) * Math.cos(vz * 5.2 + vx * 3.7 + ri * 2);
                pa.setXYZ(vi, vx * noise, vy * noise * 0.72, vz * noise);
            }
            pa.needsUpdate = true;
            geo.computeVertexNormals();

            /* Lit material with only a gentle brightness jitter (no heavy grey
               multiply) so each texture's real colour shows — moon reads pale,
               rocks_* read as their own tones, and the variants look different. */
            var shade = 0.8 + _sr() * 0.2;
            var mat = _evTintMat(new THREE.MeshLambertMaterial({
                map: tex, color: new THREE.Color(shade, shade, shade)
            }), rockFile);

            var rock = new THREE.Mesh(geo, mat);
            rock.scale.set(radius, radius, radius);
            var offX = (_sr() - 0.5) * ts * 0.5;
            var offZ = (_sr() - 0.5) * ts * 0.5;
            rock.position.set(offX, radius * 0.62, offZ);
            rock.rotation.y = _sr() * Math.PI * 2;
            g.add(rock);
        }
        g.position.set(x * ts + ts / 2, topY, y * ts + ts / 2);
        return g;
    }

    /* ── Crystal Cluster: 3-5 tall cones with crystal.png texture + glow ── */
    function _buildCrystalCluster3D(x, y) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var topY = tileTopY(x, y);
        var g = new THREE.Group();

        var seed = (x * 53 + y * 97 + 17) & 0xFFFF;
        var _sr = function() { seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF; return (seed & 0xFFFF) / 0xFFFF; };

        var crystalTex = _getCrystalTexture();
        var crystalColors = _evPaletteActive()
            ? [ _ewSwatch('ent_amethyst'), _ewSwatch('ent_violet'), _ewSwatch('ent_orchid'),
                _ewSwatch('ent_violet'), _ewSwatch('ent_amethyst') ]
            : [0x8844cc, 0x6633aa, 0xaa55ee, 0x9944dd, 0x7733bb];
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
                color: _evPaletteActive() ? _ewSwatch('ent_lilac') : 0xccaaff,
                transparent: true, opacity: 0.15,
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
    /* Grassy ground that cosmetic grass blades may sprout on (Entropy Vale only). */
    var _GRASS_TERRAIN_SET = { grass: true, grass_2: true, grass_3: true, grass_4: true, grass_rocky: true, purple_grass: true };

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

                /* COSMETIC GRASS (all maps) — its own dense pass, run before the
                   sparse rock-decoration gate so most grassy tiles get a tuft.
                   Coexists fine with the boulder scatter below. */
                if (GRASS.enabled && GRASS.autoScatter && _GRASS_TERRAIN_SET[terrain]) {
                    var gHash = (dx * 263 + dy * 521 + 91) & 0xFF;
                    if (gHash < GRASS.coverage) {
                        var gt = _buildGrassTuft3D(dx, dy);
                        if (gt) _terrainDecoGroup.add(gt);
                    }
                }

                /* Deterministic skip: only ~40% of matching tiles get a decoration for variety */
                var hash = (dx * 73 + dy * 137 + 7) & 0xFF;
                if (hash > 102) continue; /* ~40% chance */

                var m = null;
                if (_ROCK_TERRAIN_SET[terrain])    m = _buildRockCluster3D(dx, dy);
                if (_CRYSTAL_TERRAIN_SET[terrain]) m = _buildCrystalCluster3D(dx, dy);
                /* Light natural boulder scatter on open beveled ground (a few
                   strewn rocks so the organic terrain reads as a real, eroded
                   landscape). Separate low-density hash; never on water/lava/
                   structured tiles, and only where nothing else was placed. */
                if (!m && BEVEL.scatter && _naturalTerrainActive() && _isBeveledTerrain(terrain) &&
                    !_ROCK_TERRAIN_SET[terrain] && !_CRYSTAL_TERRAIN_SET[terrain]) {
                    var sHash = (dx * 191 + dy * 313 + 29) & 0xFF;
                    if (sHash < 22) m = _buildRockCluster3D(dx, dy); /* ~8.5% of open ground */
                }
                if (m) _terrainDecoGroup.add(m);
            }
        }

        objectGroup.add(_terrainDecoGroup);
        _lastTerrainDecoSerial = _computeTerrainDecoSerial();
    }

    /* ── On-board MONUMENTS ───────────────────────────────────────────────
       Reuse the existing esoteric-background geometry (_hz* builders) as real
       on-map landmarks instead of authoring any new art. We just adjust them to
       be board-compatible: drive the builder with a deterministic seed (stable
       per placement), force it upright (drop the baked-in random tilt/sink),
       scale it to a tile footprint, and sit it on the ground at a board tile.
       Map data supplies state.monuments = [{kind,x,y,foot,maxH,seed}]. */
    var _MON_BUILDERS = null;
    function _monBuilders() {
        if (!_MON_BUILDERS) _MON_BUILDERS = {
            pyramid: _hzModelPyramid, pyramid_cone: _hzPyramid,
            ziggurat: _hzZiggurat, arch: _hzGateway, gateway: _hzGateway,
            obelisk: _hzObelisk, stairway: _hzStairway, monolith: _hzMonolith,
            greek: _hzGreekRuin, mountain: _hzMountain, crystal: _hzCrystalShards,
            rings: _hzSacredRings, colossus: _hzColossus, island: _hzFloatingIsland,
            flag: _hzFlag, rover: _hzRover, goldgate: _hzGoldGate,
            lightpillar: _hzLightPillar, fluorescent: _hzFluorescent,
            exitsign: _hzExitSign
        };
        return _MON_BUILDERS;
    }
    function _monRng(seed) {
        var s = (seed | 0) || 1;
        return function () {
            s = s + 0x6D2B79F5 | 0;
            var t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function _buildMonumentObj(mon) {
        if (!mon || typeof THREE === 'undefined') return null;
        var fn = _monBuilders()[mon.kind];
        if (!fn) return null;
        var ts = CONFIG.tileSize || BASE_TILE;
        var g;
        try { g = fn(_monRng(mon.seed || 1)); } catch (e) { return null; }
        if (!g) return null;
        /* Force upright (drop any baked ruin tilt), then apply the editor-authored
           Y rotation so monuments can be spun to face any direction. */
        g.rotation.set(0, (mon.rot ? -mon.rot * Math.PI / 180 : 0), 0);
        g.position.set(0, 0, 0);
        g.updateMatrixWorld(true);
        var box = new THREE.Box3().setFromObject(g);
        var size = new THREE.Vector3(); box.getSize(size);
        var s = ((mon.foot || 3) * ts) / Math.max(size.x, size.z, 1);   // fit footprint
        if (mon.maxH) { var sH = (mon.maxH * ts) / Math.max(size.y, 1); if (sH < s) s = sH; }
        g.scale.set(s, s, s);
        g.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(g);
        /* Sit on the tile's GROUND floor (maps have a z>=3 floor). Use the recorded
           monument floor, not getHeightAt — the latter now returns the stamped
           collision peak (e.g. a pyramid centre), which would float the mesh up. */
        var surfaceY = 0;
        try {
            var floorZ;
            if (state._monumentTiles && state._monumentTiles.has(mon.x + ',' + mon.y)) {
                floorZ = state._monumentTiles.get(mon.x + ',' + mon.y);
            } else if (typeof getHeightAt === 'function') {
                floorZ = getHeightAt(mon.x, mon.y) || 0;
            } else floorZ = 0;
            surfaceY = floorZ * ts * ELEV_STEP_RATIO;
        } catch (e) { surfaceY = 0; }
        g.position.set(mon.x * ts + ts / 2, surfaceY - box.min.y, mon.y * ts + ts / 2);
        g._ew_monument = true;
        return g;
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
            else if (ok === 'stairs' || ok === 'stairs_2') {
                /* Stairs are drawn as the 3D staircase by the barrier_passage
                   terrain mesh (_buildStairMesh) — don't also draw the flat
                   billboard sprite for the object. */
                continue;
            }
            else if (ok === 'lamp_post' || ok === 'lamp_post_2') m = _buildLampPostObj(ok, x, y);
            else if (ok === 'grass_tuft')         m = _buildGrassTuft3D(x, y);
            else if (ok === 'rock')               m = _buildRock3D(x, y);
            else if (_isTreeKey(ok))              m = _buildFoliageObj(ok, x, y) || _buildTree3D(ok, x, y);
            else if (_isBuildingKey(ok)) {
                /* 2×2 houses occupy four tiles but only the NW-anchor draws the
                   prism. The other three tiles carry a footprint-shadow entry
                   (_fp) so gameplay (roof-walk / climb / height) sees the full
                   block; skip drawing on those so we don't stack four prisms. */
                var _ostk = (typeof getObjectStack === 'function') ? getObjectStack(x, y) : null;
                if (_ostk && _ostk[0] && _ostk[0]._fp) continue;
                m = _buildBuildingPrism(ok, x, y);
            }
            else if (_isCrossBillboard(ok))   m = _buildCrossBillboard(ok, x, y);
            else if (_isBarrierKey(ok))       m = _buildBarrierSlab(ok, x, y);
            else                              m = _buildBillboard(ok, x, y);
            if (m) { objectGroup.add(m); objectMeshes.set(x+','+y, m); }
        }}

        /* On-board monuments (reused esoteric geometry) — cleared & rebuilt with
           the rest of objectGroup each pass (they carry no _ew_turretId). */
        if (state.monuments && state.monuments.length) {
            for (var monI = 0; monI < state.monuments.length; monI++) {
                var monMesh = _buildMonumentObj(state.monuments[monI]);
                if (monMesh) objectGroup.add(monMesh);
            }
        }

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
        var ts = CONFIG.tileSize || BASE_TILE;
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
            var _runeTs = CONFIG.tileSize || BASE_TILE;
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
            var ts = CONFIG.tileSize || BASE_TILE;
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
            ThreePost.rebuildWardLights(state.wards || [], tileTopY, CONFIG.tileSize || BASE_TILE);
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

        var ts = CONFIG.tileSize || BASE_TILE;
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

        var ts = CONFIG.tileSize || BASE_TILE;
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
                    // Floor decal sits all but coplanar with the terrain top, so a
                    // tiny lift alone z-fights (flickers) as the camera moves. A
                    // negative polygonOffset biases the plane toward the camera in
                    // the depth buffer so it reliably renders ON the ground without
                    // shimmering, while depthTest still lets units/props occlude it.
                    polygonOffset: true,
                    polygonOffsetFactor: -2,
                    polygonOffsetUnits: -2,
                    side: THREE.DoubleSide
                });
                _spawnZoneMats.push(mat);
                var mesh = new THREE.Mesh(geo, mat);

                // Anchor to the REAL terrain top (tileTopY adds surface smoothing /
                // stand-lift) rather than raw boardHeights*elevStep — the latter can
                // place the plane below the rendered surface and bury/flicker it.
                var topY = (typeof tileTopY === 'function')
                    ? tileTopY(tile.x, tile.y)
                    : (((state.boardHeights && state.boardHeights[tile.y])
                        ? (state.boardHeights[tile.y][tile.x] || 0) : 0) * elevStep);

                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(
                    tile.x * ts + ts / 2,
                    topY + ts * 0.012,
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

        var ts = CONFIG.tileSize || BASE_TILE;
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
                    // The wall plane sits exactly on the perimeter tile edge, so when
                    // a taller neighbouring tile's cliff face lands on that same plane
                    // the two are coplanar and z-fight (the light flickers on/off as
                    // the camera moves). A negative polygonOffset biases the wall
                    // toward the camera so it wins the depth test cleanly. (Maps are
                    // *supposed* to keep higher terrain off the spawn perimeter, but
                    // this makes the effect robust regardless of map authoring.)
                    polygonOffset: true,
                    polygonOffsetFactor: -2,
                    polygonOffsetUnits: -2,
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
        var ts = CONFIG.tileSize || BASE_TILE;
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

            // Vision eye: open when any enemy can see this unit, closed/slashed
            // when hidden. Recomputed each frame so it tracks movement/fog live.
            var eyeEl = po.el.querySelector('[data-eye]');
            if (eyeEl) {
                var eyeSeen = (typeof isUnitSeenByAnyEnemy === 'function') ? isUnitSeenByAnyEnemy(u) : true;
                eyeEl.classList.toggle('tp-eye-hidden', !eyeSeen);
                eyeEl.title = eyeSeen ? 'Spotted — an enemy can see this unit' : 'Hidden — out of all enemy vision';
            }
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var surfY = unitSurfaceY(unit);

        var _nativeScale = ts / 128;

        var _effectiveSprH = ts;

        var group = new THREE.Group();
        group.name = 'unit_' + unit.id;

        var spriteMesh = null;
        var silhouetteMesh = null;

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

            // Warm up animated sprite-sheet textures (if this race has any) so
            // they're decoded and GPU-ready by the time the unit attacks/casts.
            if (typeof getRaceSpriteAnimations === 'function') {
                var _anims = getRaceSpriteAnimations(unit.race, unit.gender);
                if (_anims) {
                    if (_anims.attack) getTexture(_anims.attack);
                    if (_anims.spell) getTexture(_anims.spell);
                }
            }

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

            // Holographic x-ray ghost shown when this unit is hidden behind
            // terrain/props. Parented to the sprite so it inherits the same
            // billboard facing, position, flip and shake automatically.
            if (spriteTex) {
                var _silColor = (unit.player === _viewerPlayerNum())
                    ? SILHOUETTE_OWN_COLOR : SILHOUETTE_ENEMY_COLOR;
                var silMesh = new THREE.Mesh(
                    spriteMesh.geometry,
                    _makeSilhouetteMaterial(_silColor, spriteTex)
                );
                silMesh.renderOrder = 9999;   // draw after terrain/props so the depth buffer is populated
                silMesh._ew_silhouette = true;
                spriteMesh.add(silMesh);
                silMesh._ew_unitId = unit.id;
                silhouetteMesh = silMesh;
            }
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

        return { group: group, sprite: spriteMesh, silhouette: silhouetteMesh };
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
            ThreePost.rebuildUnitLights(state.units, unitSurfaceY, CONFIG.tileSize || BASE_TILE);
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
                '  transition: opacity 0.22s ease, filter 0.22s ease;',
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
                /* Vision eye: open = an enemy can see you; slashed/dim = hidden. */
                '.tp-wrap .tp-eye {',
                '  margin-left: 5px; font-size: 12px; line-height: 1; flex-shrink: 0;',
                '  position: relative; color: #ffe08a;',
                '  text-shadow: 0 0 4px rgba(255,180,80,0.7), 0 1px 2px #000;',
                '}',
                '.tp-wrap .tp-eye.tp-eye-hidden {',
                '  color: #7fd8a0; opacity: 0.85;',
                '  text-shadow: 0 0 4px rgba(60,160,100,0.6), 0 1px 2px #000;',
                '}',
                /* Diagonal slash across the eye when hidden. */
                '.tp-wrap .tp-eye.tp-eye-hidden::after {',
                '  content: ""; position: absolute; left: -2px; right: -2px; top: 50%;',
                '  height: 2px; background: currentColor; border-radius: 1px;',
                '  transform: rotate(-30deg); box-shadow: 0 0 3px rgba(0,0,0,0.9);',
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

                /* ---- Visual hierarchy ----------------------------------------
                   Nameplates float over every unit at once, so by default they
                   compete for attention. Let the secondary ones recede and only
                   bring a plate to full strength when it is directly relevant:
                   the unit whose turn it is (tp-active), the one under the cursor
                   (tp-hovered), or the current action's target (tp-targeted).
                   Enemy plates sit back the furthest — the player only needs to
                   read an enemy when they are about to act on it. */
                '.tp-wrap.tp-enemy { opacity: 0.42; filter: saturate(0.8); }',
                '.tp-wrap.tp-ally  { opacity: 0.8; }',
                '.tp-wrap.tp-active, .tp-wrap.tp-hovered, .tp-wrap.tp-targeted {',
                '  opacity: 1 !important; filter: none !important;',
                '}',
                /* Engaging an enemy (hover or target) pops its plate with a red
                   accent so the player clearly sees what they are aiming at. */
                '.tp-wrap.tp-enemy.tp-hovered .tp-body,',
                '.tp-wrap.tp-enemy.tp-targeted .tp-body {',
                '  border-color: rgba(255,90,90,0.9) !important;',
                '  box-shadow: 0 0 11px rgba(255,60,60,0.5), 0 2px 8px rgba(0,0,0,0.8);',
                '}',
                '.tp-wrap.tp-targeted .tp-name {',
                '  text-shadow: 0 0 9px rgba(255,120,120,0.8), 0 1px 3px #000;',
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
        /* Ally/enemy is viewer-relative (a P2 viewer's own team is player 2), so
           the visual-hierarchy dimming keys off this, not the raw p1/p2 side. */
        pCls += _isAllyPlayer(unit.player) ? ' tp-ally' : ' tp-enemy';

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
                stagger:'#e67e22',marked:'#e74c6f',lasered:'#ff2b2b',jammed:'#8e44ad',drowning:'#2980b9',
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

        /* Vision eye — only on the viewer's own units: open when at least one
           enemy can see this unit, closed/slashed when out of all enemy vision.
           (Enemy plates only render when already visible, so an eye there would
           be meaningless.) */
        var eyeHtml = '';
        if (_isAllyPlayer(unit.player)) {
            var _seen = (typeof isUnitSeenByAnyEnemy === 'function') ? isUnitSeenByAnyEnemy(unit) : true;
            eyeHtml = '<span class="tp-eye' + (_seen ? '' : ' tp-eye-hidden') + '" data-eye title="'
                + (_seen ? 'Spotted — an enemy can see this unit' : 'Hidden — out of all enemy vision')
                + '">👁</span>';
        }

        wrap.innerHTML =
            '<div class="tp-name">' +
                '<span class="tp-lvl">' + lvl + '</span>' +
                _escHtml(label) +
                eyeHtml +
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
            var refW = CONFIG.tileSize || BASE_TILE;

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
            var _drefW = CONFIG.tileSize || BASE_TILE;
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

    /* Draped highlight tile — a subdivided quad whose vertices follow the
       beveled terrain swell, so range/spell overlays hug the ground topology
       instead of hovering as flat decals. Falls back to a flat quad when
       BEVEL is disabled (identical to the old PlaneGeometry decal). */
    function _buildDrapeGeo(hx, hy, ts, frac) {
        var s = ts * frac, half = s / 2, segs = 4;
        var cx = hx * ts + ts / 2, cz = hy * ts + ts / 2;
        /* natural tiles: drape over the smooth sloped landform; beveled tiles:
           follow the organic swell; everything else: flat (classic decal). */
        var nat = _isNaturalRenderTile(hx, hy);
        var elevStep = ts * ELEV_STEP_RATIO;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var natCenter = nat ? _naturalSurfaceY(hx, hy) : 0;
        var liftC = _tileSurfaceLift(hx, hy);
        var doLift = (BEVEL.amp > 0 && _tileIsBeveled(hx, hy));
        var pos = [], uv = [], idx = [], grid = [];
        for (var gj = 0; gj <= segs; gj++) {
            grid[gj] = [];
            for (var gi = 0; gi <= segs; gi++) {
                var lx = -half + (gi / segs) * s;
                var lz = -half + (gj / segs) * s;
                var y;
                if (nat) {
                    var lu = 0.5 + lx / ts, lv = 0.5 + lz / ts;
                    y = _naturalSurfaceYLocal(hx, hy, lu, lv, _bw, _bh, elevStep) - natCenter;
                } else {
                    y = doLift ? (_surfaceLift(cx + lx, cz + lz) - liftC) : 0;
                }
                grid[gj][gi] = pos.length / 3;
                pos.push(lx, y, lz);
                uv.push(gi / segs, gj / segs);
            }
        }
        for (var qj = 0; qj < segs; qj++) {
            for (var qi = 0; qi < segs; qi++) {
                var a = grid[qj][qi], b = grid[qj][qi + 1];
                var c = grid[qj + 1][qi], d = grid[qj + 1][qi + 1];
                idx.push(a, c, b, b, c, d);
            }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        return geo;
    }
    function _makeHlTile(hx, hy, mat, frac, yOff) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var mesh = new THREE.Mesh(_buildDrapeGeo(hx, hy, ts, frac), mat);
        /* On a walkable roof, tileTopY is the roof-standing height but the roof
           mesh itself is drawn a hair above it, so lift the highlight clear of
           the roof plane — otherwise the (depth-tested) overlay is occluded by
           the roof and the tile looks un-highlighted. */
        var roofLift = 0;
        if (typeof getObjectAt === 'function') {
            var hobj = getObjectAt(hx, hy);
            if (hobj && typeof OBJECT_RULES !== 'undefined' && OBJECT_RULES[hobj] && OBJECT_RULES[hobj].roofWalkable) {
                var hoSpr = (typeof OBJECT_SPRITES !== 'undefined') ? OBJECT_SPRITES[hobj] : null;
                if (hoSpr && hoSpr._roofZPx > 0) roofLift = 1.5;
            }
        }
        mesh.position.set(hx * ts + ts / 2, tileTopY(hx, hy) + yOff + roofLift, hy * ts + ts / 2);
        return mesh;
    }

    function _getSharedHlMat(hlType) {

        var matKey = hlType;
        if (hlType.indexOf('attack enemy') === 0) matKey = 'attack enemy';
        if (_hlMatCache.has(matKey)) return _hlMatCache.get(matKey);

        var color, opacity, edgeGlow, dotCount, exposed = 0;
        var baseTok = hlType.split(' ')[0];

        /* Tactical move highlight: base token (move / move-2ap / move-jump …)
           still drives the AP-cost pip dots; the appended tactical token drives
           the COLOUR; an appended ' exposed' token drives the warning border.
           Priority for the (mutually-exclusive) base fill: strike > hazard >
           benefit > slow > neutral — offence opportunities pop loudest. */
        if (baseTok.indexOf('move') === 0 && baseTok !== 'move-edge') {
            dotCount = HL_DOT_COUNT[baseTok] || 0;
            exposed = (hlType.indexOf(' exposed') !== -1) ? 1 : 0;
            if (hlType.indexOf(' strike') !== -1)       { color = HL_COLORS['strike'];  opacity = 0.66; edgeGlow = 0.95; }
            else if (hlType.indexOf(' hazard') !== -1)  { color = HL_COLORS['hazard'];  opacity = 0.62; edgeGlow = 0.85; }
            else if (hlType.indexOf(' benefit') !== -1) { color = HL_COLORS['benefit']; opacity = 0.60; edgeGlow = 0.80; }
            else if (hlType.indexOf(' slow') !== -1)    { color = HL_COLORS['slow'];    opacity = 0.55; edgeGlow = 0.70; }
            else { color = HL_COLORS[baseTok] || HL_COLORS['move']; opacity = 0.44; edgeGlow = 0.55; } /* plain — recede */
        } else {
            color = _getHlColor(matKey);
            opacity = _getHlOpacity(matKey);
            edgeGlow = HL_EDGE_GLOW[matKey] || 0.6;
            if (edgeGlow === 0.6 && matKey.indexOf('attack enemy') === 0) edgeGlow = HL_EDGE_GLOW['attack enemy'];
            dotCount = HL_DOT_COUNT[matKey] || 0;
        }

        var mat = _makeHlMaterial(color, opacity, edgeGlow, dotCount, exposed);
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

        var ts = CONFIG.tileSize || BASE_TILE;

        var cache = window._ewHlCache;

        var _curHlKey = state.selectedUnitId + '|' + state.actionMode;
        if (cache && cache.key && cache.key.indexOf(_curHlKey) !== 0) {
            cache = null;
        }
        if (cache && cache.map && cache.map.size > 0) {
            cache.map.forEach(function(hlType, pk) {
                var comma = pk.indexOf(',');
                var hx = parseInt(pk.substring(0, comma), 10);
                var hy = parseInt(pk.substring(comma + 1), 10);
                highlightGroup.add(_makeHlTile(hx, hy, _getSharedHlMat(hlType), 0.92, 0.3));
            });
            return;
        }

        var G = (typeof window !== 'undefined' && window.GAME) ? window.GAME : null;
        if (!G) { _lastHlKey = ''; return; }
        var sel = (function(){ var _u = _unitById.get(state.selectedUnitId); return (_u && !_u.dead) ? _u : null; })();
        if (!sel) { _lastHlKey = ''; return; }

        var tiles = null;
        if (state.actionMode === 'move' && typeof G.getMoveTiles === 'function') {
            tiles = G.getMoveTiles(sel);
            if (tiles) {
                for (var mi = 0; mi < tiles.length; mi++) {
                    var mt = tiles[mi];
                    var mType = mt._jump ? 'move-jump' : mt._takeoff ? 'move-takeoff' : 'move';
                    highlightGroup.add(_makeHlTile(mt.x, mt.y, _getSharedHlMat(mType), 0.92, 0.3));
                }
            }
        } else if (state.actionMode === 'jump' && typeof G.getJumpTiles === 'function') {
            tiles = G.getJumpTiles(sel);
            if (tiles) {
                for (var ji = 0; ji < tiles.length; ji++) {
                    var jt = tiles[ji];
                    highlightGroup.add(_makeHlTile(jt.x, jt.y, _getSharedHlMat('move-jump'), 0.92, 0.3));
                }
            }
        } else if (state.actionMode === 'attack' && typeof G.getAttackTiles === 'function') {
            tiles = G.getAttackTiles(sel);
            if (tiles) {
                for (var ai = 0; ai < tiles.length; ai++) {
                    var at = tiles[ai];
                    highlightGroup.add(_makeHlTile(at.x, at.y, _getSharedHlMat('attack'), 0.92, 0.3));
                }
            }
        } else if (state.actionMode === 'inspect' && typeof G.getInspectTiles === 'function') {
            tiles = G.getInspectTiles(sel);
            if (tiles) {
                for (var ii = 0; ii < tiles.length; ii++) {
                    var it = tiles[ii];
                    highlightGroup.add(_makeHlTile(it.x, it.y, _getSharedHlMat('inspect'), 0.92, 0.3));
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var meshes = [];
        var isPreview = !!_PREVIEW_OVERLAYS[name];
        if (isPreview) _previewBaseOpacity[name] = opacity;
        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var tileColor = (t.color !== undefined) ? t.color : color;
            var tileOpacity = (t.opacity !== undefined) ? t.opacity : opacity;
            var oMat = _makeHlMaterial(tileColor, tileOpacity, isPreview ? 0.85 : 0.65, 0);
            var plane = _makeHlTile(t.x, t.y, oMat, 0.92, (name === 'aoe' ? 0.6 : 0.2));
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

    // ── Holographic action-plan ghosts ────────────────────────────────────────
    // A ghost is a translucent, tinted hologram of a unit sprite standing on a
    // pulsing footprint ring — used to preview WHERE a unit will end up (the
    // caster after it moves) and WHAT a spell does to a target (a second ghost
    // of the enemy at the tile it will be shoved/pulled to). Multiple ghosts can
    // be shown at once, keyed by a `tag`.
    var _ghostGroup = null;   // primary ('caster') ghost — kept for back-compat refs
    var _ghostMat = null;
    var _ghostGroups = [];    // [{ group, mat, ringMat, ring, tag, baseOpacity }]

    function _makeGhostRing(color, radius) {
        var ringGeo = new THREE.RingGeometry(radius * 0.6, radius, 44);
        var ringMat = new THREE.MeshBasicMaterial({
            color: color, transparent: true, opacity: 0.5,
            side: THREE.DoubleSide, depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring._ew_ghostRing = true;
        return { mesh: ring, mat: ringMat };
    }

    function showGhostUnit(unit, tileX, tileY, surfaceYOverride, opts) {
        opts = opts || {};
        var tag = opts.tag || 'caster';
        clearGhostUnit(tag);
        if (!highlightGroup || !unit) return;
        var ts = CONFIG.tileSize || BASE_TILE;
        var surfY = (surfaceYOverride !== undefined && surfaceYOverride !== null)
            ? surfaceYOverride + 1.0
            : tileTopY(tileX, tileY) + 1.0;

        var tintColor = (opts.color !== undefined && opts.color !== null) ? opts.color : 0x66ddff;
        var baseOpacity = (opts.opacity !== undefined) ? opts.opacity : 0.5;

        var group = new THREE.Group();
        group.name = 'actionPlanGhost:' + tag;
        group.position.set(tileX * ts + ts / 2, surfY, tileY * ts + ts / 2);

        // Ground footprint ring — reads instantly even before the sprite loads.
        var ringInfo = _makeGhostRing(tintColor, ts * 0.42);
        ringInfo.mesh.position.y = 0.8;
        group.add(ringInfo.mesh);

        var mat = null;
        var spriteUrl = (typeof getBattleMapSpriteUrl === 'function')
            ? getBattleMapSpriteUrl(unit)
            : ((typeof getR2RaceSpriteUrl === 'function')
               ? getR2RaceSpriteUrl(unit.race, unit.gender, unit.cls) : null);
        var spriteTex = spriteUrl ? getTexture(spriteUrl) : null;
        if (spriteTex) {
            var _nativeScale = ts / 128;
            var nw = 128, nh = 128;
            var scanData = window._spriteGroundOffsets
                ? window._spriteGroundOffsets.get(spriteUrl) : null;
            if (scanData && !scanData.scanning && scanData.nativeW > 0 && scanData.nativeH > 0) {
                nw = scanData.nativeW;
                nh = scanData.nativeH;
            } else if (spriteTex.image) {
                var img = spriteTex.image;
                var iw = img.naturalWidth || img.width || 0;
                var ih = img.naturalHeight || img.height || 0;
                if (iw > 0 && ih > 0) { nw = iw; nh = ih; }
            }
            var sprW = nw * _nativeScale;
            var sprH = nh * _nativeScale;

            // Tint toward the plan colour but blend to white so the silhouette
            // stays legible; additive blend gives the projected-hologram glow.
            var _tc = new THREE.Color(tintColor);
            _tc.lerp(new THREE.Color(0xffffff), 0.5);
            mat = new THREE.MeshBasicMaterial({
                map: spriteTex, transparent: true, alphaTest: 0.03,
                side: THREE.DoubleSide, depthWrite: false,
                opacity: baseOpacity, color: _tc, blending: THREE.AdditiveBlending
            });

            var spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(sprW, sprH), mat);
            var bottomShift = 0;
            if (scanData && !scanData.scanning && scanData.bottomGapPct > 0) {
                bottomShift = sprH * (scanData.bottomGapPct / 100);
            }
            spriteMesh.position.y = sprH / 2 - bottomShift;
            spriteMesh._ew_billboard = true;
            group.add(spriteMesh);
        }

        highlightGroup.add(group);
        _ghostGroups.push({
            group: group, mat: mat, ringMat: ringInfo.mat, ring: ringInfo.mesh,
            tag: tag, baseOpacity: baseOpacity
        });
        if (tag === 'caster') { _ghostGroup = group; _ghostMat = mat; }

        _bbLastCamX = NaN;
    }

    // clearGhostUnit()      → clears every ghost.
    // clearGhostUnit(tag)   → clears only the ghost with that tag.
    function clearGhostUnit(tag) {
        for (var i = _ghostGroups.length - 1; i >= 0; i--) {
            var e = _ghostGroups[i];
            if (tag && e.tag !== tag) continue;
            if (highlightGroup) highlightGroup.remove(e.group);
            e.group.traverse(function(child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            _ghostGroups.splice(i, 1);
        }
        if (!tag || tag === 'caster') { _ghostGroup = null; _ghostMat = null; }
    }

    function _updateActionPlanPulse() {
        var t = performance.now() / 1000.0;
        var flicker = 0.85 + 0.15 * Math.sin(t * 11.0); // subtle hologram scanline shimmer

        // Holographic ghosts: breathe the sprite opacity and pulse the footprint ring.
        for (var gi = 0; gi < _ghostGroups.length; gi++) {
            var e = _ghostGroups[gi];
            var breathe = 0.7 + 0.45 * Math.abs(Math.sin(t * 2.5));
            if (e.mat) e.mat.opacity = (e.baseOpacity || 0.5) * breathe * flicker;
            if (e.ringMat) e.ringMat.opacity = 0.32 + 0.4 * Math.abs(Math.sin(t * 2.5 + 1.0));
            if (e.ring) {
                var rs = 1.0 + 0.12 * Math.sin(t * 3.0);
                e.ring.scale.set(rs, rs, rs);
            }
        }

        // Arrow bodies breathe together; flow dots stream toward the target below.
        if (_arrowMeshes.length > 0) {
            var arrowPulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.5));
            for (var i = 0; i < _arrowMeshes.length; i++) {
                var m = _arrowMeshes[i];
                if (m._ew_flowDot) continue;
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

        for (var f = 0; f < _arrowFlowDots.length; f++) {
            var fd = _arrowFlowDots[f];
            var tt = (fd.phase + t * 0.55) % 1.0;
            if (fd.curve && fd.mesh) {
                var p = fd.curve.getPointAt(Math.min(1, tt * fd.tEnd));
                fd.mesh.position.copy(p);
                if (fd.mesh.material) fd.mesh.material.opacity = 0.25 + 0.6 * Math.sin(tt * Math.PI);
            }
        }
    }

    var _arrowMeshes = [];
    var _arrowFlowDots = [];

    function _addArrowMesh(mesh) {
        mesh._ew_overlay = 'arrow';
        if (highlightGroup) highlightGroup.add(mesh);
        _arrowMeshes.push(mesh);
    }

    // Core arrow builder — draws a glowing tube shaft that follows an arbitrary
    // 3D curve (straight, arced through the air, or bending through waypoints),
    // caps it with a cone head aimed along the final tangent, and seeds a few
    // "energy" dots that stream toward the target so direction reads at a glance.
    // opts: { radius, headLen, flow(bool), dotColor }
    function _buildArrowFromPoints(pts, hexColor, opts) {
        if (!highlightGroup || !pts || pts.length < 2) return;
        opts = opts || {};
        var ts = CONFIG.tileSize || BASE_TILE;

        var curve = (pts.length === 2)
            ? new THREE.LineCurve3(pts[0], pts[1])
            : new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
        var fullLen = curve.getLength();
        if (fullLen < 2) return;

        var shaftRad = opts.radius || ts * 0.03;
        var headLen = Math.min(opts.headLen || ts * 0.26, 38);
        var headRad = headLen * 0.5;
        // Stop the shaft short so the cone head isn't buried in the tube.
        var tEnd = fullLen > headLen * 1.3 ? (fullLen - headLen * 0.85) / fullLen : 0.9;

        var segs = Math.max(6, Math.min(80, Math.round(fullLen / (ts * 0.13))));
        var shaftPts = [];
        for (var s = 0; s <= segs; s++) shaftPts.push(curve.getPointAt(tEnd * (s / segs)));
        var shaftCurve = new THREE.CatmullRomCurve3(shaftPts);

        var shaftMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.9, depthWrite: false });
        _addArrowMesh(new THREE.Mesh(new THREE.TubeGeometry(shaftCurve, segs, shaftRad, 8, false), shaftMat));

        var glowMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.13, depthWrite: false, blending: THREE.AdditiveBlending });
        _addArrowMesh(new THREE.Mesh(new THREE.TubeGeometry(shaftCurve, segs, shaftRad * 2.7, 8, false), glowMat));

        // Cone head at the true end, oriented along the curve's final tangent so
        // it points cleanly even when the arrow arcs or bends.
        var endPt = curve.getPointAt(1);
        var tan = curve.getTangentAt(1).normalize();
        var q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);

        var coneMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.95, depthWrite: false });
        var cone = new THREE.Mesh(new THREE.ConeGeometry(headRad, headLen, 12), coneMat);
        cone.quaternion.copy(q);
        cone.position.copy(endPt).addScaledVector(tan, -headLen * 0.32);
        _addArrowMesh(cone);

        var haloMat = new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
        var halo = new THREE.Mesh(new THREE.ConeGeometry(headRad * 1.7, headLen * 1.25, 12), haloMat);
        halo.quaternion.copy(q);
        halo.position.copy(cone.position);
        _addArrowMesh(halo);

        if (opts.flow !== false) {
            var dotColor = (opts.dotColor !== undefined) ? opts.dotColor : hexColor;
            var dotN = Math.max(2, Math.min(6, Math.round(fullLen / (ts * 0.6))));
            for (var d = 0; d < dotN; d++) {
                var dotMat = new THREE.MeshBasicMaterial({ color: dotColor, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
                var dot = new THREE.Mesh(new THREE.SphereGeometry(shaftRad * 2.3, 8, 8), dotMat);
                dot._ew_overlay = 'arrow';
                dot._ew_flowDot = true;
                if (highlightGroup) highlightGroup.add(dot);
                _arrowMeshes.push(dot);
                _arrowFlowDots.push({ mesh: dot, curve: curve, tEnd: tEnd, phase: d / dotN });
            }
        }
    }

    // Straight or arced arrow between two tiles. Back-compat first 8 args; the
    // optional `opts` adds { arc, flow, radius, headLen }. arc>0 lobs the arrow
    // through the air (a curved trajectory) — used for spell/attack plans.
    function drawArrow3D(fromX, fromY, toX, toY, hexColor, dashed, fromYOverride, toYOverride, opts) {
        if (!highlightGroup) return;
        opts = opts || {};
        var ts = CONFIG.tileSize || BASE_TILE;
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

        var start = new THREE.Vector3(ax, ay, az);
        var end = new THREE.Vector3(bx, by, bz);

        var arc = opts.arc || 0;
        var pts;
        if (arc > 0) {
            var flatLen = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
            var lift = Math.min(ts * 2.6, flatLen * arc) + ts * 0.3;
            var mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + lift, (az + bz) / 2);
            pts = [start, mid, end];
        } else {
            pts = [start, end];
        }

        _buildArrowFromPoints(pts, hexColor, {
            radius: opts.radius || (dashed ? ts * 0.026 : ts * 0.032),
            flow: (opts.flow !== undefined) ? opts.flow : true,
            headLen: opts.headLen,
            dotColor: opts.dotColor
        });
    }

    // Bending walk-route arrow that threads through a list of tile waypoints
    // (start → optional vias → destination). Hugs the surface of each tile and
    // curves smoothly around corners so a multi-step move reads as one path.
    // waypoints: [{ x, y, yOverride? }, ...]  (2+ entries)
    function drawPathArrow3D(waypoints, hexColor, opts) {
        if (!highlightGroup || !waypoints || waypoints.length < 2) return;
        opts = opts || {};
        var ts = CONFIG.tileSize || BASE_TILE;
        var lift = (opts.lift !== undefined) ? opts.lift : ts * 0.14;
        var pts = [];
        for (var i = 0; i < waypoints.length; i++) {
            var w = waypoints[i];
            var wy = (w.yOverride !== undefined && w.yOverride !== null) ? w.yOverride : tileTopY(w.x, w.y);
            pts.push(new THREE.Vector3(w.x * ts + ts / 2, wy + lift, w.y * ts + ts / 2));
        }
        _buildArrowFromPoints(pts, hexColor, {
            radius: opts.radius || ts * 0.028,
            flow: (opts.flow !== undefined) ? opts.flow : true,
            headLen: opts.headLen,
            dotColor: opts.dotColor
        });
    }

    function clearArrows3D() {
        for (var i = 0; i < _arrowMeshes.length; i++) {
            if (highlightGroup) highlightGroup.remove(_arrowMeshes[i]);
            if (_arrowMeshes[i].geometry) _arrowMeshes[i].geometry.dispose();
            if (_arrowMeshes[i].material) _arrowMeshes[i].material.dispose();
        }
        _arrowMeshes = [];
        _arrowFlowDots = [];
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        var ts = CONFIG.tileSize || BASE_TILE, topY = tileTopY(tx, ty) + 0.5;
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

        /* Bring the hovered unit's nameplate to full strength (visual hierarchy). */
        var hpo = _plateObjs.get(unitId);
        if (hpo && hpo.el) hpo.el.classList.add('tp-hovered');

        var entry = unitEntries.get(unitId);
        if (!entry || !entry.group) return;
        var ts = CONFIG.tileSize || BASE_TILE;
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
        if (_hoveredUnitId != null) {
            var cpo = _plateObjs.get(_hoveredUnitId);
            if (cpo && cpo.el) cpo.el.classList.remove('tp-hovered');
        }
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
            var ts = CONFIG.tileSize || BASE_TILE;
            _selChevronMesh = _buildSelectionChevron(ts);
            _selChevronUnitId = selId;
            ue.group.add(_selChevronMesh);
        }

        if (_selChevronMesh.parent !== ue.group) {
            if (_selChevronMesh.parent) _selChevronMesh.parent.remove(_selChevronMesh);
            ue.group.add(_selChevronMesh);
        }

        var topY = ue.group._ew_spriteTopY ? (ue.group._ew_spriteTopY - ue.group.position.y) : ((CONFIG.tileSize || BASE_TILE) * 0.85);
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

    /* A per-box clone of the shared fog material so each holographic cell can hold
       its own fade opacity (the shared templates only drive the global pulse). The
       clone is NOT marked _ew_shared, so _disposeR cleans it up when the box is
       removed. _ew_fogBoxBase records the box's resting opacity for the pulse. */
    function _newFogBoxMat(isEdge) {
        _ensureFogMats();
        var m = (isEdge ? _fogEdgeMat : _fogCoreMat).clone();
        m.transparent = true;
        m._ew_fogBoxBase = isEdge ? FOG_EDGE_LINE_OPACITY : FOG_LINE_OPACITY;
        return m;
    }

    function _buildFogCube(x, y, ts, isEdge, topY) {

        var elevStep = ts * ELEV_STEP_RATIO;
        var doubleStep = elevStep * 2;
        var topExtension = ts * (isEdge ? FOG_EDGE_HEIGHT_RATIO : FOG_CUBE_HEIGHT_RATIO);
        var totalH = topY + topExtension;

        var totalLevels = Math.max(1, Math.round(totalH / elevStep));

        var group = new THREE.Group();
        var lineMat = _newFogBoxMat(isEdge);

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
            lineMat: lineMat,
            fade: 1,
            fadeTarget: 1
        };
    }

    /* Topographic fog cell: a holographic wire box whose bottom ring hugs the
       sloped terrain surface (the four welded corner heights) and whose rings
       step up parallel to that slope, so the fog grid drapes over hills and
       valleys instead of sitting as an axis-aligned cube. Used for natural
       (rolling-heightfield) tiles; flat/voxel tiles keep _buildFogCube. */
    function _buildFogSlopedCube(x, y, ts, isEdge) {
        var elevStep = ts * ELEV_STEP_RATIO;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        /* surface Y at the four tile corners — group sits at world-y 0, so these
           local Ys already place the ring on the terrain. */
        var Y00 = _naturalSurfaceYLocal(x, y, 0, 0, _bw, _bh, elevStep);
        var Y10 = _naturalSurfaceYLocal(x, y, 1, 0, _bw, _bh, elevStep);
        var Y11 = _naturalSurfaceYLocal(x, y, 1, 1, _bw, _bh, elevStep);
        var Y01 = _naturalSurfaceYLocal(x, y, 0, 1, _bw, _bh, elevStep);
        var fogH = ts * (isEdge ? FOG_EDGE_HEIGHT_RATIO : FOG_CUBE_HEIGHT_RATIO);
        var h = ts / 2;
        var c = [
            [-h, Y00, -h],
            [ h, Y10, -h],
            [ h, Y11,  h],
            [-h, Y01,  h]
        ];
        var pts = [];
        function seg(a, ay, b, by) { pts.push(a[0], ay, a[2], b[0], by, b[2]); }
        var layers = isEdge ? 1 : 2;
        for (var L = 0; L <= layers; L++) {
            var off = fogH * (L / layers);
            for (var i = 0; i < 4; i++) {
                var a = c[i], b = c[(i + 1) % 4];
                seg(a, a[1] + off, b, b[1] + off);
            }
        }
        for (var k = 0; k < 4; k++) {
            var p = c[k];
            seg(p, p[1], p, p[1] + fogH);
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        var lineMat = _newFogBoxMat(isEdge);
        var group = new THREE.Group();
        group.add(new THREE.LineSegments(geo, lineMat));
        group.position.set(x * ts + ts / 2, 0, y * ts + ts / 2);
        return {
            group: group,
            wireframes: group.children,
            isEdge: isEdge,
            tileX: x,
            tileY: y,
            lineMat: lineMat,
            fade: 1,
            fadeTarget: 1
        };
    }

    // ── Terrain-side fog fade ─────────────────────────────────────────────
    // Terrain materials are cached + shared across tiles of the same type, so
    // (exactly like the action-cam occlusion fade) we swap in a transparent clone
    // before ramping a tile's opacity and restore the shared original once the
    // fade settles. _ew_fogOrig holds the saved material; _ew_fogClone marks the
    // throwaway so _disposeR / _fogRestore know what to clean up.
    function _fogCloneMat(m) {
        var c = m.clone();
        c.transparent = true;
        c.depthWrite = false;
        c.opacity = (m.opacity != null ? m.opacity : 1);
        c._ew_fogClone = true;
        return c;
    }
    function _fogApplyFade(mesh) {
        if (mesh._ew_fogOrig || mesh._ew_occOrig) return;   // already swapped (fog or occlusion)
        mesh._ew_fogOrig = mesh.material;
        mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(_fogCloneMat)
            : _fogCloneMat(mesh.material);
    }
    function _fogSetMatOpacity(mesh, op) {
        var m = mesh.material;
        if (Array.isArray(m)) { for (var i = 0; i < m.length; i++) if (m[i]) m[i].opacity = op; }
        else if (m) m.opacity = op;
    }
    function _fogRestoreMesh(mesh) {
        if (!mesh._ew_fogOrig) return;
        var cur = mesh.material;
        mesh.material = mesh._ew_fogOrig;
        mesh._ew_fogOrig = null;
        if (Array.isArray(cur)) { for (var i = 0; i < cur.length; i++) if (cur[i] && cur[i]._ew_fogClone) cur[i].dispose(); }
        else if (cur && cur._ew_fogClone) cur.dispose();
    }

    /* The top-level scene objects that make up one board tile — the terrain cube
       (a single mesh for a flat tile, a Group of band meshes for voxel/natural
       columns), any prop sitting on it, and its scatter decorations. Their .visible
       is what _applyFogVisibility normally toggles, so the fade must drive the SAME
       objects (toggling a band-mesh leaf does nothing while its parent Group is
       hidden). */
    function _fogTileContainers(pk) {
        var arr = [];
        var tm = tileMeshes.get(pk); if (tm) arr.push(tm);
        var om = objectMeshes.get(pk); if (om) arr.push(om);
        if (_terrainDecoGroup) {
            var parts = pk.split(','); var tx = +parts[0], ty = +parts[1];
            for (var i = 0; i < _terrainDecoGroup.children.length; i++) {
                var d = _terrainDecoGroup.children[i];
                if (d._ew_decoX === tx && d._ew_decoY === ty) arr.push(d);
            }
        }
        return arr;
    }
    function _fogBeginTileFade(pk, rec) {
        rec.containers = _fogTileContainers(pk);
        rec.meshes = [];
        var meshes = rec.meshes;
        for (var c = 0; c < rec.containers.length; c++) {
            rec.containers[c].visible = true;          // keep the tile on screen for the whole fade
            rec.containers[c].traverse(function (o) {
                if ((o.isMesh || o.isSprite) && o.material) { meshes.push(o); _fogApplyFade(o); }
            });
        }
        rec.swapped = true;
    }
    function _fogEndTileFade(rec, tgt) {
        if (rec.meshes) {
            for (var i = 0; i < rec.meshes.length; i++) _fogRestoreMesh(rec.meshes[i]);
        }
        if (rec.containers) {
            for (var c = 0; c < rec.containers.length; c++) rec.containers[c].visible = (tgt > 0);
        }
        rec.meshes = null;
        rec.containers = null;
        rec.swapped = false;
        rec.op = tgt;
    }
    function _fogResetTileFades() {
        _fogTiles.forEach(function (rec) {
            if (rec.swapped && rec.meshes) {
                for (var i = 0; i < rec.meshes.length; i++) _fogRestoreMesh(rec.meshes[i]);
            }
        });
        _fogTiles.clear();
    }

    function _makeFogEntry(x, y, ts, isEdge) {
        return _isNaturalRenderTile(x, y)
            ? _buildFogSlopedCube(x, y, ts, isEdge)
            : _buildFogCube(x, y, ts, isEdge, tileTopY(x, y));
    }

    function rebuildFog() {
        if (!fogGroup) return;
        _clearGroup(fogGroup);
        _fogMeshes.clear();
        _clearFogEdgesCache();
        _fogResetTileFades();

        if (!state.fogOfWar) {
            _fogVisibleKey = 'off';

            _applyFogVisibility(new Set());
            return;
        }

        var ts = CONFIG.tileSize || BASE_TILE;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;

        var vp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
        var visible = (typeof computeVisibleTiles === 'function') ? computeVisibleTiles(vp) : new Set();
        _fogVisibleSet = visible;

        for (var y = 0; y < _bh; y++) {
            for (var x = 0; x < _bw; x++) {
                var pk = x + ',' + y;
                if (visible.has(pk)) continue;

                var isEdge = _fogIsEdgeTile(x, y, visible);
                var entry = _makeFogEntry(x, y, ts, isEdge);   // fresh build → fade already 1 (instant)

                fogGroup.add(entry.group);
                _fogMeshes.set(pk, entry);
            }
        }

        // Hard reset (map load / fog toggle): snap terrain to the current vision so
        // the board doesn't fade up from nothing, and prime each tile's fade record
        // at its resting target so no spurious transition fires on the next frame.
        _applyFogVisibility(visible);
        tileMeshes.forEach(function (m, pk) {
            _fogTiles.set(pk, { op: visible.has(pk) ? 1 : 0, swapped: false, meshes: null, tileRef: m });
        });
        _fogBuiltBw = _bw; _fogBuiltBh = _bh;

        _fogVisibleKey = 'on';
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
            /* Keep the x-ray silhouette tinted from the CURRENT viewer's side
               (blue = own, red = enemy), so a perspective swap recolours it
               without a full rebuild. */
            if (entry.silhouette && entry.silhouette.material && entry.silhouette.material.uniforms) {
                entry.silhouette.material.uniforms.uColor.value.set(
                    unit.player === vp ? SILHOUETTE_OWN_COLOR : SILHOUETTE_ENEMY_COLOR
                );
            }
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

    // ════════════════════════════════════════════════════════════════════
    // ACTION-CAM OCCLUSION FADE
    // While a cinematic over-the-shoulder / sky-strike shot is live (the camera
    // drops in low behind the caster and aims at the target), terrain tiles and
    // map props that sit BETWEEN the camera and the caster (or the target) are
    // faded toward near-invisible — so a dirt block or a tree can't swallow the
    // screen and hide what's actually going on. The moment the shot ends, or an
    // occluder is no longer in the line of sight, it smoothly fades back to full.
    //
    // The shot publishes its caster (camera._cineShotUnitId) and target
    // (camera._cineShotTarget) from battle.js; we cast a small bundle of rays
    // from the camera eye to each subject and fade whatever the rays hit short
    // of the subject. Fading uses a per-mesh cloned material (the originals are
    // shared across many tiles, so we must never mutate them) restored on exit.
    // ════════════════════════════════════════════════════════════════════
    var _occFaded = new Map();   // occluder root Object3D -> { meshes:[mesh], op:Number }
    var _occRaycaster = null;
    var _occVecA = null, _occVecB = null, _occRight = null, _occUp = null, _occDir = null;
    var _occLastTime = 0;
    var OCC_FADE_TARGET = 0.10;  // how see-through an occluder becomes (0 = invisible)
    var OCC_FADE_RATE   = 9.0;   // smoothing rate for the fade in/out (per second)
    var _occWant = null;         // cached blocking set (throttled during normal play)
    var _occWantTime = 0;
    var OCC_RECOMPUTE_DT = 0.06; // seconds between blocker raycasts when not in a shot

    function _occInit() {
        if (_occRaycaster) return;
        _occRaycaster = new THREE.Raycaster();
        _occVecA = new THREE.Vector3();
        _occVecB = new THREE.Vector3();
        _occRight = new THREE.Vector3();
        _occUp = new THREE.Vector3();
        _occDir = new THREE.Vector3();
    }

    /* A direct child of one of these containers is treated as a single occluder
       (so a whole tree fades together, but only the ONE blocking decoration
       fades — not every grass tuft on the board). */
    function _occIsContainer(o) {
        return o === terrainGroup || o === objectGroup || o === _terrainDecoGroup;
    }
    function _occRootOf(obj) {
        var o = obj;
        while (o && o.parent && !_occIsContainer(o.parent)) o = o.parent;
        return (o && o.parent && _occIsContainer(o.parent)) ? o : null;
    }

    /* World point we want kept clear for a unit: roughly its torso (midway
       between the ground and the top of the sprite). */
    function _occUnitPoint(unit) {
        if (!unit) return null;
        var ue = unitEntries.get(unit.id);
        if (ue && ue.group) {
            ue.group.getWorldPosition(_occVecA);
            var ts = CONFIG.tileSize || BASE_TILE;
            var topY = (ue.group._ew_spriteTopY != null) ? ue.group._ew_spriteTopY : (_occVecA.y + ts * 0.85);
            return _occVecB.set(_occVecA.x, (_occVecA.y + topY) * 0.5, _occVecA.z).clone();
        }
        return _occTilePoint(unit.x, unit.y);
    }
    function _occTilePoint(tx, ty) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var y = ts * 0.6;
        if (typeof getHeightAt === 'function' && typeof window._getElevationPx === 'function') {
            var h = getHeightAt(Math.round(tx), Math.round(ty));
            if (h > 0) y = window._getElevationPx(h) + ts * 0.6;
        }
        return new THREE.Vector3(tx * ts + ts / 2, y, ty * ts + ts / 2);
    }

    function _occCloneMat(m) {
        var c = m.clone();
        c.transparent = true;
        c.depthWrite = false;
        c.opacity = (m.opacity != null ? m.opacity : 1);
        c._ew_occClone = true;
        return c;
    }
    function _occApplyFade(mesh) {
        if (mesh._ew_occOrig || mesh._ew_fogOrig) return;   // already swapped (occlusion or fog fade)
        mesh._ew_occOrig = mesh.material;
        mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(_occCloneMat)
            : _occCloneMat(mesh.material);
    }
    function _occSetOpacity(mesh, op) {
        var m = mesh.material;
        if (Array.isArray(m)) { for (var i = 0; i < m.length; i++) if (m[i]) m[i].opacity = op; }
        else if (m) m.opacity = op;
    }
    function _occRestore(mesh) {
        if (!mesh._ew_occOrig) return;
        var cur = mesh.material;
        mesh.material = mesh._ew_occOrig;
        mesh._ew_occOrig = null;
        if (Array.isArray(cur)) { for (var i = 0; i < cur.length; i++) if (cur[i] && cur[i]._ew_occClone) cur[i].dispose(); }
        else if (cur && cur._ew_occClone) cur.dispose();
    }
    function _occCollect(root) {
        var arr = [];
        root.traverse(function (o) { if (o.isMesh && o.material) arr.push(o); });
        return arr;
    }

    /* Roots that block the line of sight to the caster or target this frame. */
    function _occComputeBlockers(cam, cineActive, selUnit) {
        var roots = new Set();
        var groups = [];
        if (terrainGroup) groups.push(terrainGroup);
        if (objectGroup) groups.push(objectGroup);
        if (!groups.length) return roots;

        var subs = [];
        if (cineActive) {
            var caster = _unitById.get(camera._cineShotUnitId);
            if (caster) { var cp = _occUnitPoint(caster); if (cp) subs.push(cp); }
            var tgt = camera._cineShotTarget;
            if (tgt) {
                var tUnit = (tgt.id != null) ? _unitById.get(tgt.id) : null;
                var tp = (tUnit && !tUnit.dead) ? _occUnitPoint(tUnit) : _occTilePoint(tgt.x, tgt.y);
                if (tp) subs.push(tp);
            }
        } else if (selUnit) {
            // Normal play: keep just the selected/active unit clear.
            var sp = _occUnitPoint(selUnit); if (sp) subs.push(sp);
        }
        if (!subs.length) return roots;

        cam.updateMatrixWorld();
        // THREE.Sprite.raycast() needs raycaster.camera set, otherwise it throws
        // "Raycaster.camera needs to be set in order to raycast against sprites."
        // The terrain/object groups can contain sprites (props, markers), so give
        // the occlusion raycaster a camera before intersecting against them.
        _occRaycaster.camera = cam;
        var eye = cam.position;
        _occRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
        _occUp.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
        var ts = CONFIG.tileSize || BASE_TILE;
        var jit = ts * 0.45;           // spread to catch a big block just off the centre line
        var nearClear = ts * 0.5;      // stop short of the subject so its own tile isn't faded

        for (var s = 0; s < subs.length; s++) {
            var P = subs[s];
            for (var q = 0; q < 5; q++) {
                // centre ray + four spread around the subject in screen space
                _occVecA.copy(P);
                if (q === 1) _occVecA.addScaledVector(_occRight, jit);
                else if (q === 2) _occVecA.addScaledVector(_occRight, -jit);
                else if (q === 3) _occVecA.addScaledVector(_occUp, jit);
                else if (q === 4) _occVecA.addScaledVector(_occUp, -jit);

                _occDir.subVectors(_occVecA, eye);
                var dist = _occDir.length();
                if (dist <= nearClear + 1) continue;
                _occDir.multiplyScalar(1 / dist);
                _occRaycaster.set(eye, _occDir);
                _occRaycaster.near = 0;
                _occRaycaster.far = dist - nearClear;
                var hits = _occRaycaster.intersectObjects(groups, true);
                for (var hi = 0; hi < hits.length; hi++) {
                    var r = _occRootOf(hits[hi].object);
                    if (r) roots.add(r);
                }
            }
        }
        return roots;
    }

    function _updateActionCamOcclusion() {
        var cam = (typeof ThreeCamera !== 'undefined') ? ThreeCamera.getCamera() : null;
        var inBattle = !!(cam && typeof state !== 'undefined' && state.phase === 'battle'
            && typeof THREE !== 'undefined');
        var cineActive = !!(inBattle && typeof camera !== 'undefined' && camera
            && camera._cineShotId != null && state.cinematicActionCam);

        // Outside of a cinematic shot, keep the currently-selected unit (the one
        // whose turn it is) visible while the player drags the camera around by
        // hand — fading whatever terrain / props sit between the camera and that
        // unit, exactly the way the action-cam does for the caster and target.
        var selUnit = null;
        if (inBattle && !cineActive) {
            var selId = state.selectedUnitId || state._blitzActiveUnitId;
            if (selId != null) {
                var su = _unitById.get(selId);
                if (su && !su.dead) selUnit = su;
            }
        }

        var active = cineActive || !!selUnit;

        if (!active && _occFaded.size === 0) return;   // nothing to do
        _occInit();

        var now = performance.now() / 1000;
        var dt = _occLastTime > 0 ? Math.min(now - _occLastTime, 0.05) : 0.016;
        _occLastTime = now;

        // Recompute the blocking set every frame during a fast-moving cinematic
        // shot; throttle it during normal play (the opacity lerp below still runs
        // every frame, so fades stay smooth either way).
        var want;
        if (active) {
            if (cineActive || _occWant === null || (now - _occWantTime) >= OCC_RECOMPUTE_DT) {
                want = _occComputeBlockers(cam, cineActive, selUnit);
                _occWant = want;
                _occWantTime = now;
            } else {
                want = _occWant;
            }
        } else {
            want = null;
            _occWant = null;
        }

        // Begin fading any newly-blocking root.
        if (want) {
            want.forEach(function (root) {
                if (_occFaded.has(root)) return;
                var meshes = _occCollect(root);
                for (var i = 0; i < meshes.length; i++) _occApplyFade(meshes[i]);
                _occFaded.set(root, { meshes: meshes, op: 1.0 });
            });
        }

        // Step every tracked root toward its target opacity; restore finished ones.
        var k = Math.min(1, OCC_FADE_RATE * dt);
        var done = [];
        _occFaded.forEach(function (rec, root) {
            if (!root.parent) {            // rebuilt/removed out from under us
                for (var j = 0; j < rec.meshes.length; j++) _occRestore(rec.meshes[j]);
                done.push(root); return;
            }
            var blocking = want && want.has(root);
            var tgt = blocking ? OCC_FADE_TARGET : 1.0;
            rec.op += (tgt - rec.op) * k;
            if (Math.abs(rec.op - tgt) < 0.012) rec.op = tgt;
            for (var i = 0; i < rec.meshes.length; i++) _occSetOpacity(rec.meshes[i], rec.op);
            if (!blocking && rec.op >= 0.999) {
                for (var j2 = 0; j2 < rec.meshes.length; j2++) _occRestore(rec.meshes[j2]);
                done.push(root);
            }
        });
        for (var d = 0; d < done.length; d++) _occFaded.delete(done[d]);
    }

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

        /* Terrain tiles, props and decorations are handled by the per-tile reveal
           fade (_updateFogReveal) so they ease in/out instead of popping. We still
           set their resting visibility here for tiles that AREN'T mid-fade, so a
           freshly rebuilt mesh (object/turret/deploy rebuild) lands in the right
           state immediately; a swapped (actively fading) tile is left to the fade. */
        tileMeshes.forEach(function(mesh, pk) {
            var rec = _fogTiles.get(pk);
            if (rec && rec.swapped) return;
            mesh.visible = visible.has(pk);
        });

        objectMeshes.forEach(function(mesh, pk) {
            var rec = _fogTiles.get(pk);
            if (rec && rec.swapped) return;
            mesh.visible = visible.has(pk);
        });

        /* Hide terrain decorations (rocks, crystals) in fog */
        if (_terrainDecoGroup) {
            for (var di = 0; di < _terrainDecoGroup.children.length; di++) {
                var deco = _terrainDecoGroup.children[di];
                if (deco._ew_decoX !== undefined && deco._ew_decoY !== undefined) {
                    var dRec = _fogTiles.get(deco._ew_decoX + ',' + deco._ew_decoY);
                    if (dRec && dRec.swapped) continue;
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

    /* Re-evaluate vision (throttled) and reconcile the fog boxes against it: spawn
       a box (fading in) over a newly hidden tile, target the box for fade-out over a
       newly revealed one, and rebuild a box in place when the frontier moving past
       it flips its edge/core shape. Terrain visibility itself is eased separately. */
    function _fogRecomputeVisibility(_bw, _bh) {
        var vp = (typeof getViewerPlayer === 'function') ? getViewerPlayer() : (state.activePlayer || 1);
        var visible = (typeof computeVisibleTiles === 'function') ? computeVisibleTiles(vp) : new Set();
        _fogVisibleSet = visible;
        var ts = CONFIG.tileSize || BASE_TILE;
        for (var y = 0; y < _bh; y++) {
            for (var x = 0; x < _bw; x++) {
                var pk = x + ',' + y;
                var entry = _fogMeshes.get(pk);
                if (visible.has(pk)) {
                    if (entry) entry.fadeTarget = 0;        // revealed → dissolve the box
                    continue;
                }
                var isEdge = _fogIsEdgeTile(x, y, visible);
                if (!entry) {
                    entry = _makeFogEntry(x, y, ts, isEdge);
                    entry.fade = 0;                         // hidden → materialise the box
                    fogGroup.add(entry.group);
                    _fogMeshes.set(pk, entry);
                } else if (entry.isEdge !== isEdge) {
                    var carry = entry.fade;                 // frontier moved → reshape, keep fade
                    fogGroup.remove(entry.group);
                    _disposeR(entry.group);
                    entry = _makeFogEntry(x, y, ts, isEdge);
                    entry.fade = carry;
                    fogGroup.add(entry.group);
                    _fogMeshes.set(pk, entry);
                }
                entry.fadeTarget = 1;
            }
        }
    }

    /* Ease each tile's terrain/props/decorations toward seen (1) or fogged (0). */
    function _updateFogTerrainReveal(visible, k) {
        tileMeshes.forEach(function (tmesh, pk) {
            var rec = _fogTiles.get(pk);
            var tgt = visible.has(pk) ? 1 : 0;
            if (!rec || rec.tileRef !== tmesh) {
                /* First sighting, or the tile mesh was rebuilt under us — snap to the
                   resting state (no fade) and make sure the fresh meshes are shown
                   or hidden correctly. */
                if (rec && rec.swapped && rec.meshes) {
                    for (var r = 0; r < rec.meshes.length; r++) _fogRestoreMesh(rec.meshes[r]);
                }
                rec = { op: tgt, swapped: false, meshes: null, containers: null, tileRef: tmesh };
                _fogTiles.set(pk, rec);
                var cs = _fogTileContainers(pk);
                for (var s = 0; s < cs.length; s++) cs[s].visible = (tgt > 0);
                return;
            }
            if (rec.op === tgt && !rec.swapped) return;
            if (rec.op !== tgt) {
                if (!rec.swapped) _fogBeginTileFade(pk, rec);
                rec.op += (tgt - rec.op) * k;
                if (Math.abs(rec.op - tgt) < 0.02) rec.op = tgt;
                if (rec.meshes) {
                    for (var j = 0; j < rec.meshes.length; j++) {
                        if (rec.meshes[j].parent) _fogSetMatOpacity(rec.meshes[j], rec.op);
                    }
                }
                if (rec.op === tgt) _fogEndTileFade(rec, tgt);
            } else {
                _fogEndTileFade(rec, tgt);
            }
        });
    }

    /* Ease each fog box toward its target, modulated by the global hologram pulse,
       and retire boxes that have fully faded out over a now-visible tile. */
    function _updateFogBoxFade(k) {
        var pulseVal = Math.sin(_fogPulseTime * FOG_PULSE_SPEED * Math.PI * 2) * FOG_PULSE_AMP;
        var remove = null;
        _fogMeshes.forEach(function (entry, pk) {
            var tgt = (entry.fadeTarget != null) ? entry.fadeTarget : 1;
            entry.fade += (tgt - entry.fade) * k;
            if (Math.abs(entry.fade - tgt) < 0.02) entry.fade = tgt;
            if (tgt === 0 && entry.fade <= 0.02) {
                (remove || (remove = [])).push(pk);
                return;
            }
            entry.group.visible = entry.fade > 0.01;
            if (entry.lineMat) {
                var base = (entry.lineMat._ew_fogBoxBase != null) ? entry.lineMat._ew_fogBoxBase : FOG_LINE_OPACITY;
                entry.lineMat.opacity = Math.max(0, base + pulseVal) * entry.fade;
            }
        });
        if (remove) {
            for (var i = 0; i < remove.length; i++) {
                var e = _fogMeshes.get(remove[i]);
                if (e) { fogGroup.remove(e.group); _disposeR(e.group); }
                _fogMeshes.delete(remove[i]);
            }
        }
    }

    function _updateFogPulse() {
        if (!state.fogOfWar) {
            if (_fogVisibleKey !== 'off') { _fogVisibleKey = 'off'; rebuildFog(); }
            return;
        }
        if (!fogGroup) return;

        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;

        /* Fog just turned on, first build of this match, or the board was resized:
           do a hard (instant) rebuild so nothing fades up out of nothing. */
        if (_fogVisibleKey !== 'on' || _bw !== _fogBuiltBw || _bh !== _fogBuiltBh) {
            rebuildFog();
            return;
        }

        var now = performance.now() / 1000;
        var dt = Math.min(now - (_fogLastTime || now), 0.05);
        _fogLastTime = now;
        _fogPulseTime += dt;

        if (!_fogLastCheckTime || (now - _fogLastCheckTime) > 0.2) {
            _fogLastCheckTime = now;
            _fogRecomputeVisibility(_bw, _bh);
        }

        var k = Math.min(1, FOG_FADE_RATE * dt);
        _updateFogTerrainReveal(_fogVisibleSet || new Set(), k);
        _updateFogBoxFade(k);
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
                    var sinkG = _getSubmersionDepth(unit) * ((CONFIG.tileSize || BASE_TILE) * UNIT_SPRITE_SIZE_RATIO);
                    g.position.y = unitSurfaceY(unit) - sinkG;
                    g._ew_spriteTopY = unitSurfaceY(unit) + (CONFIG.tileSize || BASE_TILE) * UNIT_SPRITE_SIZE_RATIO + 4;
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
            g._ew_spriteTopY = baseY + bob + (CONFIG.tileSize || BASE_TILE) * UNIT_SPRITE_SIZE_RATIO + 4;
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

        for (var _egi = 0; _egi < _ghostGroups.length; _egi++) { var _eg = _ghostGroups[_egi].group; if (_eg && _eg.children) { for (var gi = 0; gi < _eg.children.length; gi++) { var gc = _eg.children[gi]; if (gc._ew_billboard) { gc.rotation.y = Math.atan2(cx - _eg.position.x, cz - _eg.position.z); } } } }
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var sy = unitSurfaceY(unit);
        var sink = _getSubmersionDepth(unit) * (ts * UNIT_SPRITE_SIZE_RATIO);
        return { x: unit.x * ts + ts / 2, y: sy - sink, z: unit.y * ts + ts / 2 };
    }

    function startWalkTween(unit, path, onDone) {
        if (!path || !path.length) { if (onDone) onDone(); return; }
        var fullPath = [{ x: unit.x, y: unit.y, z: unit.z || 0 }].concat(path);
        var segs = fullPath.length - 1;
        // One steady pace across the WHOLE path so multi-tile moves glide as a
        // single motion instead of stop-starting at every waypoint. Longer paths
        // get a slightly quicker per-tile pace so a 3-tile move doesn't drag.
        var perTile = Math.max(135, 190 - segs * 12);
        var totalMs = perTile * segs;
        var _isFlying = (typeof canFly === 'function' && typeof isUnitAirborne === 'function')
            ? (canFly(unit) && isUnitAirborne(unit)) : false;
        _walkTweens.set(unit.id, {
            path: fullPath,
            segs: segs,
            startTime: performance.now(),
            totalMs: totalMs,
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var toRemove = [];

        var _wkVp = (state.fogOfWar && typeof getViewerPlayer === 'function') ? getViewerPlayer() : 0;
        for (var entry of _walkTweens) {
            var uid = entry[0], tw = entry[1];
            // Progress along the ENTIRE path, eased once end-to-end: gentle accel
            // leaving the start tile, constant speed through the middle, gentle
            // decel into the destination. No more easing (and stopping) per tile.
            var gt = Math.min((now - tw.startTime) / tw.totalMs, 1);
            var traveled = _easeInOut(gt) * tw.segs;
            var stepIdx = Math.min(Math.floor(traveled), tw.segs - 1);
            var ease = traveled - stepIdx; // linear within the current segment

            var from = tw.path[stepIdx];
            var to = tw.path[stepIdx + 1];
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

            if (gt >= 1) {
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
        for (var r = 0; r < toRemove.length; r++) _walkTweens.delete(toRemove[r]);
    }

    function _tileSurfaceY(tx, ty, tz) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;

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

    function _buildFloatTextCanvas(text, kind) {
        var style = _FLOAT_STYLES[kind] || _FLOAT_STYLES['damage'];
        var raw = String(text == null ? '' : text);

        // A "number" pop (e.g. "-128", "+45", "+30 MP") gets the punchy gradient
        // glyph; everything else is a word callout ("SUPER EFFECTIVE!", "DODGE!")
        // rendered flat + letter-spaced so it reads as a different layer of feedback.
        var isNumber = /^[+\-]?\d/.test(raw.trim()) && !style.label;

        var fontSize = style.fontSize || 48;
        // Gothic / serif face (loaded in index.html) for that JRPG damage-number look.
        var fontFamily = "'Cinzel', Georgia, 'Times New Roman', serif";
        var fontWeight = isNumber ? '900' : '700';
        var letterSpacing = isNumber ? 0 : Math.max(1, Math.round(fontSize * 0.06));
        var fontStr = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        ctx.font = fontStr;
        if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing + 'px';
        var metrics = ctx.measureText(raw);

        var outlineW = Math.max(3, Math.round(fontSize * (isNumber ? 0.09 : 0.07)));
        var padX = outlineW * 4 + 8 + letterSpacing;
        var padY = outlineW * 4 + 8;
        var tw = Math.ceil(metrics.width) + padX * 2;
        var th = Math.ceil(fontSize * 1.4) + padY * 2;
        c.width = tw; c.height = th;
        ctx = c.getContext('2d');
        ctx.font = fontStr;
        if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing + 'px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var cx = tw / 2;
        var cy = th / 2;

        // Drop shadow (offset, soft) for legibility over any board color.
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = isNumber ? 10 : 7;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(raw, cx, cy);
        ctx.restore();

        // Thick dark outline → thin black inner outline (two passes for a clean edge).
        ctx.save();
        ctx.lineWidth = outlineW * 2.5;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = style.stroke || '#000000';
        ctx.strokeText(raw, cx, cy);
        ctx.lineWidth = outlineW * 1.1;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(raw, cx, cy);
        ctx.restore();

        // Fill: vertical gradient for numbers, flat color for word callouts.
        ctx.save();
        if (isNumber && style.grad && style.grad.length) {
            var g = ctx.createLinearGradient(0, cy - fontSize * 0.62, 0, cy + fontSize * 0.55);
            var stops = style.grad;
            for (var si = 0; si < stops.length; si++) {
                g.addColorStop(stops.length === 1 ? 0 : si / (stops.length - 1), stops[si]);
            }
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = style.color || '#ffffff';
        }
        ctx.fillText(raw, cx, cy);
        ctx.restore();

        // Top sheen — a bright highlight on the upper third sells the metallic pop.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, tw, cy);
        ctx.clip();
        ctx.globalAlpha = isNumber ? 0.42 : 0.25;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(raw, cx, cy - Math.max(1, fontSize * 0.03));
        ctx.restore();

        c.style.width = tw + 'px';
        c.style.height = th + 'px';
        return c;
    }

    // Floating combat numbers/text render into a dedicated DOM overlay (_floatDomOverlay)
    // that sits ABOVE both the WebGL canvas (sprites) and the CSS2D nameplate layer, so
    // they're never occluded by a sprite or a name plate. Each pop stores its world-space
    // anchor; _updateFloatTextTweens projects that to screen pixels every frame (matching
    // the camera the way _scalePlates does) and animates scale/opacity via CSS transforms.
    var _floatDomOverlay = null;
    var _floatProjVec = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;

    function _ensureFloatOverlay() {
        if (_floatDomOverlay || !_parentEl) return;
        var ov = document.createElement('div');
        ov.id = 'floatTextOverlay';
        // Must out-rank every other layer INSIDE .map-center — the name-plate CSS2D
        // overlay (z 7), #boardStage (z 10) and the intent-badge layer (z 15) — so the
        // numbers always read on top of them. .map-center is itself z-index:1, so this
        // big value is still safely contained BELOW the HUD (which lives outside it).
        ov.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:9999;overflow:hidden;';
        _parentEl.appendChild(ov);
        _floatDomOverlay = ov;
    }

    function startFloatingText(tileX, tileY, text, kind, durationMs, opts) {
        _ensureFloatOverlay();
        if (!_floatDomOverlay) return;
        opts = opts || {};
        var ts = CONFIG.tileSize || BASE_TILE;

        var el = _buildFloatTextCanvas(text, kind);
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.top = '0';
        el.style.transformOrigin = '50% 50%';
        el.style.willChange = 'transform, opacity';
        el.style.opacity = '0';
        _floatDomOverlay.appendChild(el);

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

        // Spawn at the unit's torso/upper-chest (~0.6 of sprite height) instead of
        // above the head — the number then rises (FLOAT_RISE_PX) up past the head
        // for that punchy JRPG pop. Stagger lift keeps stacked pops from overlapping.
        var startY = surfaceY + ts * UNIT_SPRITE_SIZE_RATIO * 0.6 + staggerLift;

        var wx = tileX * ts + ts / 2 + jx;
        var wz = tileY * ts + ts / 2 + jy;

        var isBig = (kind === 'crit' || kind === 'overkill' || kind === 'levelup' || kind === 'laststd');

        var tw = {
            id: ++_floatIdCounter,
            el: el,
            wx: wx,
            wz: wz,
            startY: startY,
            riseY: FLOAT_RISE_PX,
            startTime: performance.now(),
            durationMs: Math.max(400, durationMs || 900),
            isBig: isBig,
            staggerIdx: staggerIdx
        };
        _floatTweens.push(tw);
    }

    function _removeFloatTween(tw) {
        if (tw.el && tw.el.parentNode) tw.el.parentNode.removeChild(tw.el);
        tw.el = null;
    }

    function _updateFloatTextTweens() {
        if (_floatTweens.length === 0) return;
        var now = performance.now();
        var cam = ThreeCamera.getCamera();
        var screenW = _parentEl ? _parentEl.clientWidth : 0;
        var screenH = _parentEl ? _parentEl.clientHeight : 0;
        // pxScale sets the on-screen size of the numbers (world→screen px factor).
        var halfTanFov = cam ? Math.tan((cam.fov * Math.PI / 180) / 2) : 0;
        var pxScale = 0.58;
        var i = _floatTweens.length;
        while (i--) {
            var tw = _floatTweens[i];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);

            var riseT = 1 - Math.pow(1 - t, 3);
            var worldY = tw.startY + tw.riseY * riseT;

            var opacity;
            if (t < 0.06) {
                opacity = Math.min(1, t / 0.06);
            } else if (t < 0.75) {
                opacity = 1;
            } else {
                var fadeT = (t - 0.75) / 0.25;
                opacity = 1 - fadeT * fadeT;
            }

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

            if (tw.el && cam && screenH > 0 && halfTanFov > 0) {
                _floatProjVec.set(tw.wx, worldY, tw.wz);
                var dist = _floatProjVec.distanceTo(cam.position);
                if (dist < 1) dist = 1;
                _floatProjVec.project(cam);
                // Behind the camera or off-screen depth → hide this frame.
                if (_floatProjVec.z > 1) {
                    tw.el.style.opacity = '0';
                } else {
                    var sx = (_floatProjVec.x * 0.5 + 0.5) * screenW;
                    var sy = (-_floatProjVec.y * 0.5 + 0.5) * screenH;
                    // World→screen size (px per world unit) at this depth, ×pxScale —
                    // mirrors _scalePlates so numbers track zoom like sprites/plates.
                    var worldToPx = screenH / (2 * dist * halfTanFov);
                    var k = sc * pxScale * worldToPx;
                    tw.el.style.left = sx + 'px';
                    tw.el.style.top = sy + 'px';
                    tw.el.style.transform = 'translate(-50%,-50%) scale(' + k.toFixed(4) + ')';
                    tw.el.style.opacity = Math.max(0, opacity).toFixed(3);
                }
            }

            if (t >= 1) {
                _removeFloatTween(tw);
                _floatTweens.splice(i, 1);
            }
        }
    }

    function _clearFloatTextTweens() {
        for (var i = 0; i < _floatTweens.length; i++) {
            _removeFloatTween(_floatTweens[i]);
        }
        _floatTweens.length = 0;
    }

    function startHitEffect(tileX, tileY, variant, isCrit, durationMs) {
        if (!hitFxGroup || !scene) return;
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;

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
                    // Play the attack sprite sheet (if any) on top of the lunge.
                    _maybeStartSpriteAnim(uid, 'attack');
                }
            }
            _prevAttackIds = new Set(state.attackAnimIds);
        }

        if (state.castAnimIds) {
            for (var uid of state.castAnimIds) {
                if (!_prevCastIds.has(uid) && !_castTweens.has(uid) && !_spriteAnimTweens.has(uid)) {
                    // Damaging spells use the attack animation; non-damaging
                    // ones (e.g. Catgirl "Meow") use the secondary sheet. If the
                    // race has a sheet we own the sprite for the cast and skip
                    // the default glow/pulse tween (which would tint it).
                    var _dmg = state._castAnimDamaging && state._castAnimDamaging[uid];
                    if (!_maybeStartSpriteAnim(uid, _dmg ? 'attack' : 'spell')) {
                        _castTweens.set(uid, {
                            startTime: performance.now(),
                            durationMs: CAST_MS
                        });
                    }
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
                    var _hk = (state.hitFlashKindById && state.hitFlashKindById[uid]) || 'hit';
                    _flashTweens.set(uid, { startTime: performance.now(), durationMs: FLASH_MS, kind: _hk });
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

    // ── Animated sprite sheets ───────────────────────────────────────────
    // Swap a unit's billboard texture to a grid frame sheet and step the UV
    // window cell-by-cell for the duration of an action, then restore the idle
    // texture. Used by races registered in RACE_SPRITE_ANIMATIONS (sprites.js).

    function _maybeStartSpriteAnim(uid, kind) {
        if (typeof getRaceSpriteAnimations !== 'function') return false;
        if (_spriteAnimTweens.has(uid)) return true;
        var unit = _findUnit(uid);
        if (!unit) return false;
        var anims = getRaceSpriteAnimations(unit.race, unit.gender);
        if (!anims) return false;
        var url = (kind === 'spell') ? anims.spell : anims.attack;
        if (!url) return false;
        var ue = _getUnitEntry(uid);
        if (!ue || !ue.sprite || !ue.sprite.material) return false;

        var baseTex = getTexture(url);
        // Only animate once the strip is decoded — otherwise fall back to the
        // default lunge/cast tween for this action (textures are pre-warmed at
        // unit build, so this only skips the rare cold first use).
        if (!baseTex || !baseTex.image || !baseTex.image.complete) return false;

        // The `spell` sheet may use a different grid than `attack`; honor its
        // spellCols/spellRows/spellFrames overrides when present.
        var cols, rows, frames;
        if (kind === 'spell' && (anims.spellCols || anims.spellRows || anims.spellFrames)) {
            cols = anims.spellCols || anims.cols || anims.frames || 8;
            rows = anims.spellRows || anims.rows || 1;
            frames = anims.spellFrames || anims.frames || (cols * rows);
        } else {
            cols = anims.cols || anims.frames || 8;
            rows = anims.rows || 1;
            frames = anims.frames || (cols * rows);
        }
        // Clone so the per-frame UV offset/repeat never mutate the shared
        // cached texture (other units may share the same idle/sheet image).
        var sheetTex = baseTex.clone();
        sheetTex.magFilter = THREE.NearestFilter;
        sheetTex.minFilter = THREE.NearestFilter;
        sheetTex.wrapS = THREE.ClampToEdgeWrapping;
        sheetTex.wrapT = THREE.ClampToEdgeWrapping;
        // One grid cell = the visible UV window. Square cells on a square sheet
        // match the square idle billboard, so no distortion.
        sheetTex.repeat.set(1 / cols, 1 / rows);
        sheetTex.offset.set(0, (rows - 1) / rows);   // start on the top-left cell
        sheetTex.needsUpdate = true;

        var spr = ue.sprite;
        var mat = spr.material;

        // Correct the billboard's on-screen aspect so a (square) sheet cell is
        // never stretched by a non-square idle plane. Display width is forced
        // to cellAspect * height; sign of scale.x preserves any sprite flip.
        var baseScaleX = spr.scale.x;
        var gp = (spr.geometry && spr.geometry.parameters) ? spr.geometry.parameters : null;
        var pw = gp ? gp.width : 0, ph = gp ? gp.height : 0;
        var img = baseTex.image;
        var cellAspect = (img.naturalWidth && img.naturalHeight)
            ? ((img.naturalWidth / cols) / (img.naturalHeight / rows)) : 1;
        if (pw > 0 && ph > 0) {
            var sign = baseScaleX < 0 ? -1 : 1;
            spr.scale.x = sign * cellAspect * (ph / pw);
        }

        _spriteAnimTweens.set(uid, {
            startTime: performance.now(),
            durationMs: (kind === 'spell') ? SPRITE_ANIM_SPELL_MS : SPRITE_ANIM_ATTACK_MS,
            cols: cols,
            rows: rows,
            frames: frames,
            tex: sheetTex,
            mat: mat,
            sprite: spr,
            baseScaleX: baseScaleX,
            idleMap: mat.map
        });
        mat.map = sheetTex;
        mat.color.setRGB(1, 1, 1);   // show the sheet's true colours
        mat.needsUpdate = true;
        return true;
    }

    function _endSpriteAnim(uid) {
        var tw = _spriteAnimTweens.get(uid);
        if (!tw) return;
        if (tw.sprite && typeof tw.baseScaleX === 'number') {
            tw.sprite.scale.x = tw.baseScaleX;
        }
        if (tw.mat) {
            tw.mat.map = tw.idleMap;
            var unit = _findUnit(uid);
            if (unit && unit.ap <= 0) tw.mat.color.setRGB(0.5, 0.5, 0.5);
            else tw.mat.color.setRGB(1, 1, 1);
            tw.mat.needsUpdate = true;
        }
        if (tw.tex) tw.tex.dispose();
    }

    function _updateSpriteAnimTweens() {
        if (_spriteAnimTweens.size === 0) return;
        var now = performance.now();
        var toRemove = [];
        for (var entry of _spriteAnimTweens) {
            var uid = entry[0], tw = entry[1];
            var t = Math.min((now - tw.startTime) / tw.durationMs, 1);
            var frame = Math.min(tw.frames - 1, Math.floor(t * tw.frames));
            if (tw.tex) {
                var col = frame % tw.cols;
                var row = Math.floor(frame / tw.cols);
                tw.tex.offset.x = col / tw.cols;
                // UV origin is bottom-left, so the top grid row (row 0) maps to
                // the highest vertical offset.
                tw.tex.offset.y = (tw.rows - 1 - row) / tw.rows;
            }
            if (t >= 1) toRemove.push(uid);
        }
        for (var r = 0; r < toRemove.length; r++) {
            _endSpriteAnim(toRemove[r]);
            _spriteAnimTweens.delete(toRemove[r]);
        }
    }

    function _clearSpriteAnims() {
        for (var entry of _spriteAnimTweens) _endSpriteAnim(entry[0]);
        _spriteAnimTweens.clear();
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
                if (tw.kind === 'heal') {

                    ue.sprite.material.color.setRGB(1 - flash * 0.2, 1 + flash * 0.8, 1 - flash * 0.2);
                } else {
                    // Damage flash — colour depends on the source:
                    //   hit/default = white, burn = red, drowning = blue,
                    //   poison = purple, paralysis (stun) = yellow.
                    var fr, fg, fb;
                    if (tw.kind === 'burn') {
                        fr = 1 + flash * 1.5; fg = 1 - flash * 0.6; fb = 1 - flash * 0.6;
                    } else if (tw.kind === 'drowning') {
                        fr = 1 - flash * 0.6; fg = 1 - flash * 0.2; fb = 1 + flash * 1.5;
                    } else if (tw.kind === 'poison') {
                        fr = 1 + flash * 0.9; fg = 1 - flash * 0.5; fb = 1 + flash * 1.1;
                    } else if (tw.kind === 'paralysis') {
                        fr = 1 + flash * 1.4; fg = 1 + flash * 1.1; fb = 1 - flash * 0.7;
                    } else {
                        // 'hit' / 'damage' — plain white flash.
                        fr = 1 + flash * 1.5; fg = 1 + flash * 1.5; fb = 1 + flash * 1.5;
                    }
                    ue.sprite.material.color.setRGB(fr, fg, fb);
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
        _updateSpriteAnimTweens();
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
        _clearSpriteAnims();
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
        'uniform vec3 uFogColor; uniform float uFogAmount; uniform float uFogTop; uniform float uFogBand;',
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
        // ── retro mood fog: a haze bank hugging the horizon that thins toward the
        //    zenith, so the lower sky drowns in fog while the stars / sun / moon
        //    overhead stay clear. el (rd.y) is the view-ray altitude. The band
        //    fully CLEARS at uFogTop (the horizon line — 0 = board level / z=0) and
        //    ramps to full over uFogBand BELOW it, so the fog sits at/under the
        //    board horizon instead of climbing into the sky. Applied to the final
        //    display colour so it matches the colour the distance fog fades the
        //    scenery into. uFogAmount is 0 when the filter is off.
        '  if(uFogAmount>0.001){ float fb=1.0-smoothstep(uFogTop-uFogBand,uFogTop,el); fb=pow(fb,1.6);\n' +
        '    col=mix(col,uFogColor,clamp(fb*uFogAmount,0.0,1.0)); }\n' +
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
                uTile: { value: 128 },
                // retro mood fog banked along the horizon (0 amount = off)
                uFogColor: { value: new THREE.Vector3(0.17, 0.29, 0.32) },
                uFogAmount: { value: 0.0 },
                uFogTop: { value: 0.0 },
                uFogBand: { value: 0.5 }
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        // keep the dome's horizon haze band in sync with the retro-fog state
        // (cheap; also covers the dome initialising after the fog was toggled on)
        _applyDomeFog();

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
        if (_horizonFogDirty) _applyHorizonFog();   // re-apply retro fog after rebuilds / async model loads
        _buildArenaRuins();
        _buildStreetLamps();
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

    // ── Retro mood fog on the background scenery ─────────────────────────
    // Uniform scene.fog (FogExp2) is distance-only, so it buries a sky-island
    // floating high overhead just as hard as one sitting on the horizon — which
    // fights the dome's horizon haze band and reads incoherently. So we DON'T use
    // scene.fog on the backdrop: _applyHorizonFog forces fog:false on the whole
    // horizon group (including async misc models, which load fog:true by default
    // and would otherwise get distance-fogged). Instead the scenery is hazed by
    // the SAME altitude band the dome uses, applied per-object in _gradeHorizon-
    // Scenery: bodies at/below the horizon line dissolve into the mood fog colour
    // while bodies above the band stay clear — so object haze and sky haze are
    // one continuous horizon. Re-runs on map rebuilds / async loads via the
    // _horizonFogDirty flag, checked each frame.
    var _retroFogHorizon = false;
    var _horizonFogDirty = false;

    // Inject a per-FRAGMENT mood fog into a scenery material. Mixing the final
    // fragment (after texturing) is what actually dissolves textured bodies —
    // lerping material.color only tints them, leaving the texture detail crisp,
    // which is why they kept reading as clear. The band is computed from the
    // fragment's world altitude (el = view-ray .y) with the SAME shape the dome
    // shader uses, and it shares the dome's fog uniforms, so object haze and sky
    // haze are pixel-for-pixel one continuous horizon. Gated by uHzFogAmt (0 when
    // the filter is off), so injecting it is harmless to the default look and
    // never needs removing. Additive self-lit glows are skipped so they shine on.
    function _injectHorizonFog(mat) {
        if (!mat || mat._ew_hzFogInjected) return;
        if (!mat.color || mat.blending === THREE.AdditiveBlending || mat.isSpriteMaterial) return;
        if (!_envUni) return;   // dome uniforms not ready yet — retry on the next dirty pass
        mat._ew_hzFogInjected = true;
        var _prevOBC = mat.onBeforeCompile;
        mat.onBeforeCompile = function (shader) {
            if (_prevOBC) _prevOBC(shader);
            shader.uniforms.uHzFogColor = _envUni.uFogColor;
            shader.uniforms.uHzFogTop   = _envUni.uFogTop;
            shader.uniforms.uHzFogBand  = _envUni.uFogBand;
            shader.uniforms.uHzFogAmt   = _envUni.uFogAmount;
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vHzWorldPos;')
                .replace('#include <project_vertex>', '#include <project_vertex>\n  vHzWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vHzWorldPos;\nuniform vec3 uHzFogColor;\nuniform float uHzFogTop;\nuniform float uHzFogBand;\nuniform float uHzFogAmt;')
                .replace('#include <dithering_fragment>',
                    '#include <dithering_fragment>\n' +
                    '  if (uHzFogAmt > 0.001) {\n' +
                    '    float hzEl = normalize(vHzWorldPos - cameraPosition).y;\n' +
                    // same band shape as the dome: clears at uHzFogTop (the board
                    // horizon), ramps to full over uHzFogBand below it.
                    '    float hzS = smoothstep(uHzFogTop - uHzFogBand, uHzFogTop, hzEl);\n' +
                    '    float hzBand = pow(1.0 - hzS, 1.6) * uHzFogAmt;\n' +
                    '    gl_FragColor.rgb = mix(gl_FragColor.rgb, uHzFogColor, clamp(hzBand, 0.0, 0.95));\n' +
                    '  }');
        };
        mat.needsUpdate = true;
    }

    function _applyHorizonFog() {
        _horizonFogDirty = false;
        if (!_horizonGroup) return;
        _horizonGroup.traverse(function (o) {
            if (!o.material) return;
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            for (var i = 0; i < ms.length; i++) {
                var m = ms[i];
                if (!m) continue;
                if (m.fog !== false) { m.fog = false; m.needsUpdate = true; }  // backdrop never uses uniform distance fog
                _injectHorizonFog(m);   // per-fragment altitude fog (covers async misc models too)
            }
        });
    }

    // "Actual fog" that keeps the sky: the cosmic dome (_envDome) stays visible,
    // but its lower band is blended toward the mood fog colour (see the dome FS),
    // banked along the horizon and thinning toward the zenith — so the far
    // scenery dissolves into a fog-coloured horizon while the stars / sun / moon
    // overhead stay clear. The same colour drives scene.fog (object distance
    // fade), so landmarks melt seamlessly into the dome's haze band. State is
    // cached and pushed to the uniforms every frame (_applyDomeFog) so it holds
    // regardless of whether the dome inits before or after the fog toggle.
    var _retroFogColorHex = 0x2b4a52;
    var _retroFogThickness = 0.4;
    // View-ray altitude at which the haze fully CLEARS. 0 = the fog dissolves
    // exactly at the board horizon (z=0 board level) and banks below it — the
    // realistic ground-fog default. The pause-menu "Fog Horizon" slider raises it
    // to let the haze climb up into the sky.
    var _retroFogHorizonY = 0.0;
    var _retroFogScratch = null;

    function _applyDomeFog() {
        if (!_envUni) return;
        if (_retroFogHorizon) {
            if (!_retroFogScratch) _retroFogScratch = new THREE.Color();
            _retroFogScratch.setHex(_retroFogColorHex);
            _envUni.uFogColor.value.set(_retroFogScratch.r, _retroFogScratch.g, _retroFogScratch.b);
            _envUni.uFogAmount.value = 0.80 + 0.20 * _retroFogThickness;   // near-opaque horizon band
            // uFogTop = altitude where the haze fully clears (the horizon line);
            // uFogBand = how far below it ramps to full. With uFogTop at 0 the fog
            // dissolves right at the board horizon and sits below it, instead of
            // climbing into the sky. A thicker fog gets a slightly deeper ramp.
            _envUni.uFogTop.value    = _retroFogHorizonY;
            _envUni.uFogBand.value   = 0.35 + 0.30 * _retroFogThickness;
        } else {
            _envUni.uFogAmount.value = 0.0;
        }
    }

    function setHorizonFog(enabled, colorHex, thickness, horizon) {
        _retroFogHorizon = !!enabled;
        if (colorHex != null) _retroFogColorHex = colorHex;
        if (typeof thickness === 'number' && !isNaN(thickness)) {
            _retroFogThickness = Math.max(0, Math.min(1, thickness));
        }
        if (typeof horizon === 'number' && !isNaN(horizon)) {
            _retroFogHorizonY = Math.max(0, horizon);
        }
        _horizonFogDirty = true;
        _applyHorizonFog();
        _applyDomeFog();
    }
    var _hzGlowPulse = [];              // self-lit accents that breathe: { mat, mesh, baseOp, opAmp, baseScl, sclAmp, spd, phase }
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
    // Background elements are far away and constantly drifting/spinning. With
    // NearestFilter + no mipmaps + heavy UV tiling, every screen pixel samples a
    // near-random texel as the body moves → the textures "buzz"/shimmer (moiré),
    // and the renderer runs with antialias:false so nothing hides it. Distant
    // scenery doesn't need crisp 1:1 pixels, so we trade pixel-art sharpness for
    // trilinear mipmapping + anisotropy, which is the correct distance AA and
    // kills the buzzing. (In-world terrain still uses NearestFilter — unchanged.)
    var _hzTexCache = {};
    function _hzTex(terrainKey) {
        if (_hzTexCache[terrainKey] !== undefined) return _hzTexCache[terrainKey];
        var url = (typeof TERRAIN_SPRITES !== 'undefined' && TERRAIN_SPRITES[terrainKey]) ? TERRAIN_SPRITES[terrainKey][0] : null;
        if (!url) { _hzTexCache[terrainKey] = null; return null; }
        var tex = textureLoader.load(url);        // fresh instance; onLoad sets image + needsUpdate
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;   // trilinear: smooth minification at distance
        tex.generateMipmaps = true;
        try {
            var maxA = (renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) ? renderer.capabilities.getMaxAnisotropy() : 1;
            tex.anisotropy = Math.min(8, maxA || 1);       // sharpen grazing angles without shimmer
        } catch (e) {}
        _hzTexCache[terrainKey] = tex;
        return tex;
    }

    // Background elements sit far from the camera, so they don't need full
    // in-world pixel density — fewer texture repeats means larger texels, less
    // shimmer, and less "too many pixels" buzz. This factor coarsens every
    // horizon UV tiling (1.0 = same density as terrain; lower = fewer repeats).
    var HZ_TEX_DENSITY = 0.5;

    // Tile a box's UVs so each face shows ~one texture per tileSize, per-face
    // (so a wide base and a tall column keep the same pixel density).
    function _hzBoxUV(geo, w, h, d, ts) {
        var uv = geo.attributes && geo.attributes.uv; if (!uv) return;
        var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // px,nx,py,ny,pz,nz
        for (var face = 0; face < 6; face++) {
            var su = dims[face][0] / ts * HZ_TEX_DENSITY, sv = dims[face][1] / ts * HZ_TEX_DENSITY;
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
        su *= HZ_TEX_DENSITY; sv *= HZ_TEX_DENSITY;       // coarser density for far scenery
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

    // ── Self-lit glow accents ───────────────────────────────────────────
    // Luminous cores/auras/runes that make the esoteric landmarks "pop" and
    // push the backdrop into bloom territory (post bloom threshold ≈ 0.82, so
    // these bright additive surfaces bloom on their own). Deliberately NOT
    // registered in _horizonMats, so the day/night + haze grade never dims
    // them — an astral light that survives every sky. Tracked separately so
    // they breathe with a slow opacity/scale pulse.
    function _hzGlowMat(color, opacity) {
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(color), transparent: true, opacity: opacity,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
            side: THREE.DoubleSide
        });
    }
    // register a glow material/mesh so it gently breathes over time
    function _hzPulse(mat, mesh, opAmp, sclAmp, spd) {
        _hzGlowPulse.push({
            mat: mat, mesh: mesh || null,
            baseOp: mat.opacity, opAmp: opAmp || 0,
            baseScl: mesh ? mesh.scale.x : 1, sclAmp: sclAmp || 0,
            spd: spd || (0.35 + Math.random() * 0.55),
            phase: Math.random() * Math.PI * 2
        });
        return mat;
    }
    // Soft radial glow texture (one shared canvas gradient) for sprite auras —
    // fades to fully transparent at the rim, so a glow never shows the hard
    // circular outline an additive sphere/disc gives. Cached + reused; never
    // disposed by _disposeR (it only disposes materials, not their maps).
    var _hzGlowTex = null;
    function _hzGlowTexture() {
        if (_hzGlowTex) return _hzGlowTex;
        if (typeof document === 'undefined') return null;
        var c = document.createElement('canvas'); c.width = c.height = 128;
        var ctx = c.getContext('2d');
        var grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0.00, 'rgba(255,255,255,1.0)');
        grad.addColorStop(0.20, 'rgba(255,255,255,0.55)');
        grad.addColorStop(0.48, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1.00, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
        _hzGlowTex = new THREE.CanvasTexture(c);
        _hzGlowTex.minFilter = THREE.LinearFilter;
        _hzGlowTex.magFilter = THREE.LinearFilter;
        return _hzGlowTex;
    }
    // A camera-facing additive glow sprite with a soft radial falloff (no hard
    // silhouette). Optionally breathes.
    function _hzGlowSprite(size, color, opacity, opAmp, sclAmp, spd) {
        var mat = new THREE.SpriteMaterial({
            map: _hzGlowTexture(), color: new THREE.Color(color),
            blending: THREE.AdditiveBlending, transparent: true, opacity: opacity,
            depthWrite: false, fog: false
        });
        var sp = new THREE.Sprite(mat);
        sp.scale.set(size, size, 1);
        if (opAmp || sclAmp) _hzPulse(mat, sp, opAmp || 0, sclAmp || 0, spd);
        return sp;
    }
    // A luminous core: a soft radial aura sprite wrapped around a brighter,
    // smaller core sprite — the "lit from within" astral glow, always facing the
    // camera with a soft edge (no lazy circle outline). Centred at the origin.
    function _hzGlowCore(radius, color, auraColor) {
        var g = new THREE.Group();
        g.add(_hzGlowSprite(radius * 5.2, auraColor || color, 0.40, 0.11, 0.10, 0.30 + Math.random() * 0.4));
        g.add(_hzGlowSprite(radius * 2.2, color, 0.85, 0.12, 0.07, 0.45 + Math.random() * 0.6));
        return g;
    }

    // ── Real 3D models from the R2 /Assets/misc bucket ──────────────────
    // The esoteric background props (Pyramid, eyeball, road highway) and the
    // Entropy-Vale street lamps are authored 3D meshes living under /Assets/misc.
    // OBJ models load through the same OBJLoader the foliage uses; the Pyramid
    // ships as a self-contained .glb (embedded textures) so it needs GLTFLoader.
    // Models load once, are cached + cloned, and swap in asynchronously: each
    // builder returns an (initially empty) Group and registers a callback that
    // fills it once the mesh arrives, flipping _objectsDirty to re-render.
    var _R2_MISC = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/misc/';
    var _miscModelCache = {};   // url -> { root, loading, failed, cbs:[] }
    var _miscTexCache = {};     // url -> THREE.Texture (linear + mipmapped)

    // Distance-friendly texture (linear + mipmaps + anisotropy) for misc models,
    // so the eye/road textures don't buzz the way NearestFilter would far away.
    function _miscTex(url, onLoad) {
        if (_miscTexCache[url]) { if (onLoad) onLoad(_miscTexCache[url]); return _miscTexCache[url]; }
        var t = textureLoader.load(url, function (tex) { _objectsDirty = true; if (onLoad) onLoad(tex); });
        t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
        t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
        t.generateMipmaps = true;
        try {
            var maxA = (renderer && renderer.capabilities && renderer.capabilities.getMaxAnisotropy) ? renderer.capabilities.getMaxAnisotropy() : 1;
            t.anisotropy = Math.min(8, maxA || 1);
        } catch (e) {}
        _miscTexCache[url] = t;
        return t;
    }

    // One-time async load of a misc model. `cb(root)` fires once the normalized
    // root (with a cached _ew_bbox) is ready; ignored on failure.
    function _loadMiscModel(url, isGLB, cb) {
        var e = _miscModelCache[url];
        if (e) {
            if (e.root) { cb(e.root); return; }
            if (e.failed) return;
            e.cbs.push(cb); return;
        }
        e = _miscModelCache[url] = { root: null, loading: true, failed: false, cbs: [cb] };
        function _onLoad(res) {
            var obj = (res && res.scene) ? res.scene : res;   // GLTF → {scene}, OBJ → Object3D
            obj.traverse(function (n) { if (n.isMesh && n.geometry) n.geometry._ew_shared = true; });
            obj._ew_bbox = new THREE.Box3().setFromObject(obj);
            e.root = obj; e.loading = false;
            for (var i = 0; i < e.cbs.length; i++) { try { e.cbs[i](obj); } catch (_e) {} }
            e.cbs.length = 0;
            _objectsDirty = true;
            _horizonFogDirty = true;   // a horizon misc model (pyramid/eye) just filled in — re-apply fog
        }
        function _onErr() { e.loading = false; e.failed = true; e.cbs.length = 0; }
        try {
            if (isGLB) {
                if (typeof THREE.GLTFLoader !== 'function') { _onErr(); return; }
                new THREE.GLTFLoader().load(url, _onLoad, undefined, _onErr);
            } else {
                if (typeof THREE.OBJLoader !== 'function') { _onErr(); return; }
                new THREE.OBJLoader().load(url, _onLoad, undefined, _onErr);
            }
        } catch (ex) { _onErr(); }
    }

    // Return a Group that fills (async) with a normalized instance of a misc
    // model. opts: { fit:'height'|'span' (default height), repeat:n (lay copies
    // end-to-end along the longest horizontal axis), matPick(node,srcMat)→mat
    // (return falsy to keep the source material), onDone(group, scale, bbox) }.
    function _miscModelInstance(url, isGLB, target, opts) {
        opts = opts || {};
        var g = new THREE.Group();
        _loadMiscModel(url, isGLB, function (root) {
            if (!root || !root._ew_bbox) return;
            var bb = root._ew_bbox;
            var ex = (bb.max.x - bb.min.x) || 1, ey = (bb.max.y - bb.min.y) || 1, ez = (bb.max.z - bb.min.z) || 1;
            var s = (opts.fit === 'span') ? target / Math.max(ex, ez) : target / ey;
            function _mk() {
                var m = root.clone(true);
                if (opts.matPick) {
                    m.traverse(function (n) {
                        if (!n.isMesh) return;
                        n.material = Array.isArray(n.material)
                            ? n.material.map(function (mm) { return opts.matPick(n, mm) || mm; })
                            : (opts.matPick(n, n.material) || n.material);
                    });
                }
                m.scale.setScalar(s);
                m.position.x = -((bb.min.x + bb.max.x) * 0.5) * s;
                m.position.y = -bb.min.y * s;                 // sit base on y=0
                m.position.z = -((bb.min.z + bb.max.z) * 0.5) * s;
                return m;
            }
            var rep = Math.max(1, opts.repeat || 1);
            var alongZ = ez >= ex;
            var step = (alongZ ? ez : ex) * s;
            for (var i = 0; i < rep; i++) {
                var m = _mk();
                var off = (i - (rep - 1) / 2) * step;
                if (alongZ) m.position.z += off; else m.position.x += off;
                g.add(m);
            }
            if (opts.onDone) opts.onDone(g, s, bb);
            _objectsDirty = true;
        });
        return g;
    }

    // ── Esoteric background landmarks built from the misc models ──────────
    // A great pyramid (real .glb geometry) wearing its baked desert texture and
    // crowned with a lit ember capstone — the same "lit beacon of a dead empire"
    // beat as the procedural obelisk. The .glb only embeds Mask.png (a mask, not
    // the diffuse), so we override its material with the real BakedPyramid.png
    // bake as an unlit map — that way it never renders flat/dark.
    function _hzModelPyramid(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var h = ts * (8 + rng() * 7);
        // glTF UVs assume flipY:false — the default TextureLoader flips, which
        // would render the bake upside-down, so build this one with flipY off.
        // (Use TextureBake.png — the baked sandstone diffuse; BakedPyramid.png in
        // that folder is an all-black map and renders the pyramid pure black.)
        var tex = _miscTex(_R2_MISC + 'Pyramid/Textures/TextureBake.png');
        if (tex && tex.flipY !== false) { tex.flipY = false; tex.needsUpdate = true; }
        var g = _miscModelInstance(_R2_MISC + 'Pyramid/Pyramid.glb', true, h, {
            matPick: function () {
                return new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, fog: false });
            }
        });
        var cap = _hzGlowCore(h * 0.10, 0xffe6b0, 0xffc070);
        cap.position.y = h * 1.0;
        g.add(cap);
        return g;
    }

    // A colossal disembodied eyeball adrift in the void, wrapped in an eerie
    // astral aura — the watcher of the apocalypse. Tumbles slowly (set in the
    // roster) so it seems to scan the battlefield. The model has a separate
    // transparent cornea/lens group (Eye_Tranz) — if we render it opaque it
    // greys out the iris/pupil underneath, so that group is kept see-through
    // while the sclera/iris/pupil show the painted Eye_D diffuse.
    function _hzModelEyeball(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var h = ts * (3.5 + rng() * 3.5);
        var tex = _miscTex(_R2_MISC + 'eyeball/textures/Eye_D.jpg');
        var g = _miscModelInstance(_R2_MISC + 'eyeball/eyeball.obj', false, h, {
            matPick: function (node, srcMat) {
                var nm = (srcMat && srcMat.name) || '';
                if (nm.indexOf('Eye_Tranz') === 0) {       // glassy cornea — barely there
                    return new THREE.MeshBasicMaterial({
                        color: 0xdfe6f2, transparent: true, opacity: 0.10,
                        depthWrite: false, side: THREE.FrontSide, fog: false
                    });
                }
                return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false });
            }
        });
        var aura = _hzGlowCore(h * 0.46, 0xff5f8f, 0x9a4cff);   // sickly violet halo
        aura.position.y = h * 0.5;
        g.add(aura);
        return g;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        if (rng() < 0.4) {                                // a lit capstone on some — a golden apex
            var capstone = _hzGlowCore(r * 0.14, 0xfff0c0, 0xffcf80);
            capstone.position.y = h;
            g.add(capstone);
        }
        if (rng() < 0.45) {                               // tilted & sinking
            g.rotation.z = (rng() - 0.5) * 0.5;
            g.position.y = -h * (0.10 + rng() * 0.28);
        }
        return g;
    }

    // Mesopotamian stepped ziggurat — diminishing terraces crowned by a shrine.
    function _hzZiggurat(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var tex = _hzTex('rocks_1');
        var h = ts * (8 + rng() * 9);
        var w = ts * (1.5 + rng() * 1.1), d = w * (0.28 + rng() * 0.12);
        var slab = _hzBox(w, h, d, ts, _hzGeoMat(tex, 0x8f8a82));
        slab.position.y = h * 0.5;
        g.add(slab);
        // a glowing rune-seam down the obsidian face — a cold, eerie sigil light
        var runeCol = (rng() < 0.5) ? 0x66ffd0 : 0x8a7bff;   // sickly green or arcane violet
        var runeMat = _hzGlowMat(runeCol, 0.6);
        var rune = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.14, h * 0.66), runeMat);
        rune.position.set(0, h * 0.5, d * 0.5 + 1.5);
        g.add(rune);
        _hzPulse(runeMat, null, 0.30, 0, 0.30 + rng() * 0.45);
        g.rotation.z = (rng() - 0.5) * 0.22;              // ominous lean
        g.rotation.x = (rng() - 0.5) * 0.06;
        return g;
    }

    // A free-standing gateway to nowhere — two piers and a lintel framing only
    // sky. Sometimes a pier has crumbled and the lintel hangs broken.
    function _hzGateway(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
            // a faint shimmering veil filling the arch — a dream-portal to nowhere
            var veilMat = _hzGlowMat(0xb38cff, 0.14);
            var veil = new THREE.Mesh(new THREE.PlaneGeometry(gap, h * 0.92), veilMat);
            veil.position.set(0, h * 0.5, 0);
            g.add(veil);
            _hzPulse(veilMat, veil, 0.07, 0.03, 0.25 + rng() * 0.35);
        } else {
            var stub = _hzBox(gap * 0.55, pw * 1.0, pw, ts, _hzGeoMat(tex, 0xb8ad90));
            stub.position.set(gap * 0.18, h + pw * 0.45, 0);
            stub.rotation.z = -0.12; g.add(stub);
        }
        return g;
    }

    // A tapered obelisk capped by a pyramidion — fingers of dead empires.
    function _hzObelisk(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
        // a warm ember light crowning the pyramidion — a lit beacon of dead empires
        var tip = _hzGlowCore(w * 0.5, 0xffd9a0, 0xffb060);
        tip.position.y = h + w * 1.0;
        g.add(tip);
        return g;
    }

    // A toppled colossus: a felled giant column lying in the dust with its
    // drums scattered around it — the Ozymandias beat of the skyline.
    function _hzColossus(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
            // inner light — an additive shell so each shard glows from within
            var glowMat = _hzGlowMat(0xbfd4ff, 0.20);
            var glow = new THREE.Mesh(geo, glowMat);
            glow.position.copy(m.position); glow.rotation.copy(m.rotation);
            glow.scale.set(1.16, 1.04, 1.16);
            g.add(glow);
            _hzPulse(glowMat, null, 0.12, 0, 0.4 + rng() * 0.6);
        }
        // a soft pooled glow at the base where the shards erupt
        var pool = _hzGlowCore(ts * 0.5, 0x8fc0ff, 0x6f9fe0);
        pool.position.y = ts * 0.25;
        g.add(pool);
        return g;
    }

    // A broken-off island of land hovering in the air: a slab top (with a small
    // ruin or crystals) over a tapered rocky underside, debris trailing below.
    function _hzFloatingIsland(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        // glowing crystal heart at the centre of the armillary — the bloom-lit
        // core the rings orbit, an eerie astral beacon adrift in the void.
        var heartCol = (rng() < 0.5) ? 0x9fd8ff : 0xc7a9ff;   // cold cyan or violet
        var core = _hzGlowCore(ts * 0.6, heartCol, heartCol);
        g.add(core);
        // a faint shaded crystal nucleus inside the glow so it reads as solid
        var nucleus = new THREE.Mesh(new THREE.OctahedronGeometry(ts * 0.5, 0), _hzGeoMat(_hzTex('crystal'), 0xc2cef2));
        g.add(nucleus);
        return g;
    }

    // A loose constellation of wandering astral lights — pure bloom-lit orbs in
    // varied otherworldly hues, drifting in the deep. No geometry to ground them;
    // they read as distant stars, spirits or stray sparks of imagination, the
    // soul of the "time, space & reality collided" backdrop.
    function _hzAstralOrbs(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var palette = [0x9fd8ff, 0xb38cff, 0xff9fd0, 0xfff0a0, 0x8fffd0, 0xff8f8f];
        var n = 2 + (rng() * 4 | 0);
        for (var i = 0; i < n; i++) {
            var col = palette[(rng() * palette.length) | 0];
            var orb = _hzGlowCore(ts * (0.45 + rng() * 0.75), col, col);
            var a = rng() * Math.PI * 2, rad = ts * (0.5 + rng() * 3.2);
            orb.position.set(Math.cos(a) * rad, (rng() - 0.5) * ts * 3.0, Math.sin(a) * rad);
            g.add(orb);
        }
        return g;
    }

    // ── Custom on-board monument props (Moon / Heaven / Backrooms map set) ───
    // Built from the same _hz* helpers as the esoteric landmarks so they grade
    // with day/night and keep terrain pixel density. Registered in _monBuilders
    // and driven by state.monuments = [{kind,x,y,foot,maxH,seed}]. None of these
    // kinds appear in _MON_COLLISION, so they are purely decorative (no tile
    // blocking) — tactical cover on these maps comes from terrain height.

    // Planted Stars-and-Stripes — a rigid (airless-moon) flag on a metal pole.
    function _hzFlag(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var poleH = ts * 4.2, poleR = ts * 0.07;
        var pole = _hzCyl(poleR, poleR, poleH, 8, ts, _hzGeoMat(_hzTex('metal'), 0xc9cdd6));
        pole.position.y = poleH * 0.5; g.add(pole);
        var knob = new THREE.Mesh(new THREE.SphereGeometry(ts * 0.12, 8, 6), _hzGeoMat(_hzTex('gold'), 0xffd873));
        knob.position.y = poleH + ts * 0.05; g.add(knob);
        var fw = ts * 2.3, fh = ts * 1.35, stripes = 7, sh = fh / stripes;
        var flag = new THREE.Group();
        for (var i = 0; i < stripes; i++) {
            var col = (i % 2 === 0) ? 0xc0312b : 0xf2f2f2;      // red / white
            var strip = _hzBox(fw, sh, ts * 0.04, ts, _hzGeoMat(null, col));
            strip.position.set(fw * 0.5, fh - sh * (i + 0.5), 0);
            flag.add(strip);
        }
        var ch = sh * 4, cw = fw * 0.42;                        // blue canton
        var canton = _hzBox(cw, ch, ts * 0.05, ts, _hzGeoMat(null, 0x2a3b7a));
        canton.position.set(cw * 0.5, fh - ch * 0.5, ts * 0.012);
        flag.add(canton);
        flag.position.set(poleR, poleH - fh, 0);
        flag.rotation.y = -0.12;                                // a slight curl
        g.add(flag);
        return g;
    }

    // Apollo Lunar Roving Vehicle — an open tubular chassis that is LONGER than
    // it is wide (≈3.1 m × 1.8 m in life), four wire-mesh wheels under flared
    // fenders, twin mesh bucket seats, a central control console, a gold-foil
    // equipment/battery bay at the back and the big umbrella high-gain antenna
    // on a forward mast. Forward is +Z (where the dish + console live).
    function _hzRover(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var foil  = function () { return _hzGeoMat(_hzTex('gold'), 0xcaa23f); };                          // kapton gold foil
        var alum  = function () { return _hzGeoMat(_hzTex('aluminium') || _hzTex('metal'), 0xc6cad1); };  // bare aluminium
        var frame = function () { return _hzGeoMat(_hzTex('metal'), 0x44474e); };                         // dark structural tube
        var seatM = function () { return _hzGeoMat(_hzTex('metal_2') || _hzTex('metal'), 0x2b2d33); };    // dark mesh seat

        // length runs along Z, width along X — longer than wide, the right way round
        var L = ts * 2.3, W = ts * 1.25, deckH = ts * 0.14, wheelR = ts * 0.30;
        var deckY = wheelR + ts * 0.16;                 // open deck sits just above the axles
        var deckTop = deckY + deckH * 0.5;

        // ── open chassis: thin aluminium floor pan + tubular frame rails ────
        var deck = _hzBox(W, deckH, L, ts, alum());
        deck.position.y = deckY; g.add(deck);
        [-1, 1].forEach(function (sx) {
            var rail = _hzBox(ts * 0.10, ts * 0.10, L * 0.98, ts, frame());
            rail.position.set(sx * W * 0.5, deckTop, 0); g.add(rail);
        });
        [-1, 1].forEach(function (sz) {
            var xm = _hzBox(W * 1.02, ts * 0.10, ts * 0.10, ts, frame());
            xm.position.set(0, deckTop, sz * L * 0.46); g.add(xm);
        });

        // ── twin bucket seats, side by side across the width, mid-deck ──────
        for (var s = 0; s < 2; s++) {
            var sx2 = (s === 0 ? -1 : 1) * W * 0.24;
            var seatZ = L * 0.04;
            var pan = _hzBox(W * 0.42, ts * 0.10, ts * 0.52, ts, seatM());
            pan.position.set(sx2, deckTop + ts * 0.17, seatZ); g.add(pan);
            var back = _hzBox(W * 0.42, ts * 0.52, ts * 0.10, ts, seatM());
            back.position.set(sx2, deckTop + ts * 0.42, seatZ - ts * 0.27); g.add(back);
            var rest = _hzBox(W * 0.40, ts * 0.13, ts * 0.11, ts, foil());     // gold head-rest pad
            rest.position.set(sx2, deckTop + ts * 0.67, seatZ - ts * 0.27); g.add(rest);
        }

        // ── central control console + hand-controller stalk, toward the front ─
        var con = _hzBox(ts * 0.30, ts * 0.24, ts * 0.20, ts, frame());
        con.position.set(0, deckTop + ts * 0.18, L * 0.30); g.add(con);
        var tstem = _hzCyl(ts * 0.025, ts * 0.025, ts * 0.26, 6, ts, frame());
        tstem.position.set(0, deckTop + ts * 0.34, L * 0.30); g.add(tstem);

        // ── rear equipment / battery bay clad in gold foil + aluminium lid ──
        var bay = _hzBox(W * 0.86, ts * 0.32, ts * 0.5, ts, foil());
        bay.position.set(0, deckTop + ts * 0.19, -L * 0.34); g.add(bay);
        var bayTop = _hzBox(W * 0.88, ts * 0.05, ts * 0.52, ts, alum());
        bayTop.position.set(0, deckTop + ts * 0.37, -L * 0.34); g.add(bayTop);

        // ── four wire-mesh wheels, bright hubs, flared fenders ──────────────
        var wx = W * 0.56, wz = L * 0.34;
        [[-wx, wz], [wx, wz], [-wx, -wz], [wx, -wz]].forEach(function (p) {
            var side = p[0] < 0 ? -1 : 1;
            var wheel = _hzCyl(wheelR, wheelR, ts * 0.26, 16, ts, frame());
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(p[0], wheelR, p[1]); g.add(wheel);
            var hub = _hzCyl(wheelR * 0.36, wheelR * 0.36, ts * 0.30, 10, ts, alum());
            hub.rotation.z = Math.PI / 2;
            hub.position.set(p[0] + side * ts * 0.01, wheelR, p[1]); g.add(hub);
            var fender = _hzBox(ts * 0.34, ts * 0.05, wheelR * 2.4, ts, alum());
            fender.position.set(p[0], wheelR * 1.95, p[1]); g.add(fender);
        });

        // ── umbrella high-gain antenna on a forward mast ────────────────────
        var mast = _hzCyl(ts * 0.03, ts * 0.035, ts * 1.15, 6, ts, alum());
        mast.position.set(W * 0.30, deckTop + ts * 0.58, L * 0.40); g.add(mast);
        var dishGeo = new THREE.SphereGeometry(ts * 0.5, 16, 9, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var dish = new THREE.Mesh(dishGeo, _hzGeoMat(_hzTex('aluminium') || _hzTex('metal'), 0xe6e8ee));
        dish.scale.set(1, 0.3, 1);
        dish.position.set(W * 0.30, deckTop + ts * 1.16, L * 0.40);
        dish.rotation.x = -0.6; g.add(dish);

        // ── low-gain whip antenna at the rear ───────────────────────────────
        var whip = _hzCyl(ts * 0.012, ts * 0.012, ts * 0.9, 5, ts, frame());
        whip.position.set(-W * 0.34, deckTop + ts * 0.5, -L * 0.28);
        whip.rotation.z = 0.18; g.add(whip);

        return g;
    }

    // The Golden Gates — two fluted gold pillars under an ornate lintel, a
    // luminous veil filling the threshold and a crowning glow.
    function _hzGoldGate(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var goldTex = _hzTex('gold');
        var base = 0xe9c25a;
        var h = ts * (7 + rng() * 2);
        var pw = ts * 1.0, gap = ts * 3.0;
        [-1, 1].forEach(function (sgn) {
            var pillar = _hzCyl(pw * 0.42, pw * 0.5, h, 14, ts, _hzGeoMat(goldTex, base));
            pillar.position.set(sgn * gap * 0.5, h * 0.5, 0); g.add(pillar);
            var cap = _hzBox(pw * 1.3, pw * 0.5, pw * 1.3, ts, _hzGeoMat(goldTex, 0xf3d885));
            cap.position.set(sgn * gap * 0.5, h + pw * 0.2, 0); g.add(cap);
            var finial = new THREE.Mesh(new THREE.SphereGeometry(pw * 0.3, 10, 8), _hzGeoMat(goldTex, 0xffe9a0));
            finial.position.set(sgn * gap * 0.5, h + pw * 0.55, 0); g.add(finial);
        });
        var lintel = _hzBox(gap + pw * 2.0, pw * 0.9, pw * 1.1, ts, _hzGeoMat(goldTex, 0xf0d27a));
        lintel.position.y = h + pw * 0.05; g.add(lintel);
        var veilMat = _hzGlowMat(0xfff3c8, 0.20);
        var veil = new THREE.Mesh(new THREE.PlaneGeometry(gap, h * 0.94), veilMat);
        veil.position.set(0, h * 0.5, 0); g.add(veil);
        _hzPulse(veilMat, veil, 0.10, 0.02, 0.25 + rng() * 0.3);
        var crown = _hzGlowCore(ts * 0.7, 0xffe9a8, 0xffcf66);
        crown.position.y = h + pw * 0.9; g.add(crown);
        return g;
    }

    // A glowing EXIT sign on a slim post — a freestanding wayfinder in the maze
    // (stands on the floor since the backrooms has no ceiling to hang from).
    function _hzExitSign(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var postH = ts * 1.7;
        var post = _hzCyl(ts * 0.05, ts * 0.05, postH, 6, ts, _hzGeoMat(_hzTex('metal'), 0x52555c));
        post.position.y = postH * 0.5; g.add(post);
        // green housing box
        var housing = _hzBox(ts * 0.95, ts * 0.42, ts * 0.12, ts, _hzGeoMat(_hzTex('metal'), 0x1d6b32));
        housing.position.y = postH + ts * 0.21; g.add(housing);
        // luminous EXIT face (double-sided so it reads from both directions)
        var faceMat = _hzGlowMat(0x6dff9a, 0.85);
        var face = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.86, ts * 0.34), faceMat);
        face.position.set(0, postH + ts * 0.21, ts * 0.07); g.add(face);
        var faceB = new THREE.Mesh(new THREE.PlaneGeometry(ts * 0.86, ts * 0.34), faceMat);
        faceB.rotation.y = Math.PI; faceB.position.set(0, postH + ts * 0.21, -ts * 0.07); g.add(faceB);
        _hzPulse(faceMat, null, 0.14, 0, 0.8 + rng() * 1.2);
        var glow = _hzGlowCore(ts * 0.45, 0x8fffb4, 0x4fe07f);
        glow.position.y = postH + ts * 0.21; g.add(glow);
        return g;
    }

    // A pillar of holy light rising into the sky from a dais.
    function _hzLightPillar(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var h = ts * (16 + rng() * 8), r = ts * (0.7 + rng() * 0.4);
        var beamMat = _hzGlowMat(0xfff6d6, 0.16);
        var beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r, h, 16, 1, true), beamMat);
        beam.position.y = h * 0.5; g.add(beam);
        _hzPulse(beamMat, null, 0.06, 0, 0.2 + rng() * 0.3);
        var coreMat = _hzGlowMat(0xffffff, 0.30);
        var core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.32, h, 12, 1, true), coreMat);
        core.position.y = h * 0.5; g.add(core);
        _hzPulse(coreMat, null, 0.12, 0, 0.3 + rng() * 0.4);
        var pool = _hzGlowCore(r * 1.6, 0xfff0c0, 0xffd870);
        pool.position.y = ts * 0.2; g.add(pool);
        return g;
    }

    // Backrooms hanging fluorescent — a buzzing light panel on a ceiling conduit.
    function _hzFluorescent(rng) {
        var ts = CONFIG.tileSize || BASE_TILE;
        var g = new THREE.Group();
        var conduitH = ts * 2.6;
        var stem = _hzCyl(ts * 0.04, ts * 0.04, conduitH, 6, ts, _hzGeoMat(_hzTex('metal'), 0x6a6d74));
        stem.position.y = conduitH * 0.5; g.add(stem);
        var housing = _hzBox(ts * 1.3, ts * 0.12, ts * 0.42, ts, _hzGeoMat(_hzTex('metal'), 0xc4c7cf));
        housing.position.y = conduitH; g.add(housing);
        var panelMat = _hzGlowMat(0xfdfbe6, 0.8);
        var panel = new THREE.Mesh(new THREE.PlaneGeometry(ts * 1.15, ts * 0.34), panelMat);
        panel.rotation.x = Math.PI / 2; panel.position.y = conduitH - ts * 0.07; g.add(panel);
        _hzPulse(panelMat, null, 0.2, 0, 1.3 + rng() * 1.8);     // sickly flicker/hum
        var glow = _hzGlowCore(ts * 0.6, 0xf8f4d0, 0xeae6b0);
        glow.position.y = conduitH - ts * 0.2; g.add(glow);
        return g;
    }

    function _buildHorizonScenery() {
        if (!scene || typeof THREE === 'undefined') return;
        var ts = CONFIG.tileSize || BASE_TILE;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        var discR = Math.min(11000, Math.max(6000, Math.max(_bw, _bh) * ts * 2.5 + 3500));
        var key = cx.toFixed(0) + ',' + cz.toFixed(0) + ',' + discR.toFixed(0);
        if (_horizonGroup && _horizonKey === key) return;
        if (_horizonGroup) { scene.remove(_horizonGroup); _disposeR(_horizonGroup); }
        _horizonMats.length = 0;
        _horizonFloaters.length = 0;
        _hzGlowPulse.length = 0;
        _horizonGroup = new THREE.Group();
        _horizonGroup.name = 'horizonScenery';
        _horizonGroup.renderOrder = -40;
        _horizonKey = key;
        _horizonFogDirty = true;   // freshly-built scenery must pick up the current retro-fog state

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
            [0.118, _hzMountain,       false, -0.08,  0.22],   // floating peaks / land-chunks
            [0.217, _hzGreekRuin,      false, -0.45,  0.55],   // colonnade ruins
            [0.308, _hzStairway,       false, -0.50,  0.55],   // stairways to nowhere
            [0.480, _hzZiggurat,       false, -0.45,  0.55],   // stepped temples
            [0.552, _hzGateway,        false, -0.45,  0.58],   // gateways to nowhere
            [0.615, _hzObelisk,        false, -0.45,  0.58],   // obelisks
            [0.688, _hzMonolith,       false, -0.52,  0.62],   // leaning monoliths
            [0.742, _hzColossus,       false, -0.45,  0.48],   // toppled colossi
            [0.815, _hzFloatingIsland, false, -0.58,  0.66],   // broken sky-islands
            [0.855, _hzCrystalShards, true,  -0.60,  0.70],   // crystal clusters
            [0.882, _hzAstralOrbs,    true,  -0.64,  0.76],   // wandering astral lights
            [0.905, _hzSacredRings,   true,  -0.60,  0.72],   // sacred-geometry haloes
            [0.952, _hzModelPyramid,  false, -0.48,  0.55],   // textured pyramid model (.glb)
            [1.00,  _hzModelEyeball,  true,  -0.55,  0.70]    // watcher eyeball — tumbles/scans
        ];

        var slots = 132;
        for (var i = 0; i < slots; i++) {
            if (rng() < 0.62) continue;                          // more open gaps → less clumped
            var ang = (i / slots) * Math.PI * 2 + (rng() - 0.5) * 0.30;  // wider angular jitter
            var rr = discR * (0.62 + rng() * 0.78);              // pushed further out + wider depth band
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

        // ── Guaranteed sacred-geometry haloes ────────────────────────────────
        // The weighted ROSTER above makes the armillary rings rare (~2.3% slice
        // ⇒ ~1 per map, frequently zero). They're a signature backdrop motif, so
        // restore the old reliable behaviour: spawn a handful every map with the
        // same free-floating placement (varied compass dir / depth / elevation,
        // tumbling) the roster bodies use.
        var ringWant = 5 + (rng() * 4 | 0);
        for (var rgi = 0; rgi < ringWant; rgi++) {
            var rMesh = _hzSacredRings(rng);
            if (!rMesh) continue;
            var rAng = (rgi / ringWant) * Math.PI * 2 + (rng() - 0.5) * 0.80;
            var rRad = discR * (0.62 + rng() * 0.78);
            var rX = cx + Math.cos(rAng) * rRad;
            var rZ = cz + Math.sin(rAng) * rRad;
            var rY = (-0.60 + rng() * 1.32) * discR;        // matches roster ring yLo/yHi
            rMesh.position.set(rX, rY, rZ);
            rMesh.rotation.set(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2);
            _stampHorizonHaze(rMesh, rRad, rY, discR);
            _horizonGroup.add(rMesh);
            _horizonFloaters.push({
                obj: rMesh, baseY: rY,
                amp: ts * (0.5 + rng() * 1.6),
                spd: 0.08 + rng() * 0.22,
                phase: rng() * Math.PI * 2,
                spin: (rng() < 0.5 ? 1 : -1) * (0.0012 + rng() * 0.0028)
            });
        }

        scene.add(_horizonGroup);
    }

    // ════════════════════════════════════════════════════════════════════
    //  ARENA RUINS  — mid-ground esoteric architecture
    //  The same broken-architecture vocabulary as the far horizon (colonnades,
    //  toppled colossi, obelisks, leaning monoliths, gateways, ziggurats,
    //  pyramids, crystal shards) but brought CLOSE: a grounded ring resting on
    //  the board's own plane, framing the battlefield so it reads as one
    //  surviving fragment of a vast ruined, apocalyptic world. Placed entirely
    //  OUTSIDE the playable footprint, so it never overlaps tiles or units.
    //  Materials grade with the day/night cycle (via _hzGeoMat → _horizonMats);
    //  not haze-stamped, so they stay crisp and present rather than dissolving.
    // ════════════════════════════════════════════════════════════════════
    var _arenaRuinsGroup = null, _arenaRuinsKey = '';
    function _buildArenaRuins() {
        if (!scene || typeof THREE === 'undefined') return;
        if (!BEVEL.ruins || !_naturalTerrainActive()) {
            if (_arenaRuinsGroup) { scene.remove(_arenaRuinsGroup); _disposeR(_arenaRuinsGroup); _arenaRuinsGroup = null; _arenaRuinsKey = ''; }
            return;
        }
        var ts = CONFIG.tileSize || BASE_TILE;
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;
        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        // Match the horizon's key exactly so the ruins always rebuild in lockstep
        // with it — their materials live in the same _horizonMats grade list.
        var discR = Math.min(11000, Math.max(6000, Math.max(_bw, _bh) * ts * 2.5 + 3500));
        var key = cx.toFixed(0) + ',' + cz.toFixed(0) + ',' + discR.toFixed(0);
        if (_arenaRuinsGroup && _arenaRuinsKey === key) return;
        if (_arenaRuinsGroup) { scene.remove(_arenaRuinsGroup); _disposeR(_arenaRuinsGroup); }
        _arenaRuinsGroup = new THREE.Group();
        _arenaRuinsGroup.name = 'arenaRuins';
        _arenaRuinsGroup.renderOrder = -30;
        _arenaRuinsKey = key;

        var boardR = Math.sqrt(cx * cx + cz * cz);   // half-diagonal of the board
        var rng = _mulberry32(0x9E37 + _bw * 131 + _bh * 977);

        // upright landmarks that read well standing on the ground — including the
        // esoteric misc models (textured pyramid, watcher eyeball). The old
        // procedural _hzPyramid (wasteland-textured) is intentionally omitted.
        var BUILDERS = [
            _hzGreekRuin, _hzColossus, _hzObelisk, _hzMonolith,
            _hzGateway, _hzZiggurat, _hzCrystalShards,
            _hzModelPyramid, _hzModelEyeball
        ];
        var count = 11 + (rng() * 7 | 0);
        for (var i = 0; i < count; i++) {
            var ang = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.55;
            var rad = boardR * (1.35 + rng() * 1.55);          // safely outside the board
            var x = cx + Math.cos(ang) * rad;
            var z = cz + Math.sin(ang) * rad;
            var build = BUILDERS[(rng() * BUILDERS.length) | 0];
            var mesh = build(rng);
            if (!mesh) continue;
            mesh.scale.setScalar(0.55 + rng() * 0.75);
            // most stand on the board plane; some sink / lean as collapsed ruins
            var sink = (rng() < 0.4) ? -ts * (0.4 + rng() * 1.6) : 0;
            mesh.position.set(x, sink, z);
            mesh.rotation.y = Math.atan2(cx - x, cz - z) + (rng() - 0.5) * 0.6;
            mesh.rotation.z = (rng() - 0.5) * 0.10;            // tilt of a leaning ruin
            mesh.rotation.x = (rng() - 0.5) * 0.05;
            _arenaRuinsGroup.add(mesh);
        }

        // low scattered rubble hugging the void's edge — broken drums & blocks
        var rubbleTex = _hzTex('ruins') || _hzTex('bricks_2');
        var rubble = 10 + (rng() * 10 | 0);
        for (var r = 0; r < rubble; r++) {
            var ra = rng() * Math.PI * 2;
            var rr = boardR * (1.12 + rng() * 1.7);
            var piece;
            if (rng() < 0.5) {
                var dr = ts * (0.4 + rng() * 0.5);
                piece = _hzCyl(dr, dr, ts * (0.4 + rng() * 0.5), 10, ts, _hzGeoMat(rubbleTex, 0xb8ac8e));
                piece.rotation.z = Math.PI / 2 + (rng() - 0.5);
            } else {
                var bs = ts * (0.45 + rng() * 0.6);
                piece = _hzBox(bs, bs * (0.5 + rng() * 0.6), bs, ts, _hzGeoMat(rubbleTex, 0xa99d80));
            }
            piece.position.set(cx + Math.cos(ra) * rr, -ts * (0.1 + rng() * 0.5), cz + Math.sin(ra) * rr);
            piece.rotation.y = rng() * Math.PI * 2;
            _arenaRuinsGroup.add(piece);
        }

        scene.add(_arenaRuinsGroup);
    }

    // ════════════════════════════════════════════════════════════════════
    //  STREET LAMPS  — Entropy Vale + maps flagged streetLamps (urban/built)
    //  A handful of cosmetic 3D street lamps (the /Assets/misc "Street Lamp.obj")
    //  standing ON the board beside its built environment — the placed buildings
    //  and any street/brick/path/ruin tiles — each crowned with a glowing lantern.
    //  The post is a dark metal silhouette; the glass lantern is self-lit (blooms)
    //  with an additive halo, and casts a warm flickering point-light graded
    //  day↔night exactly like the lava/ward lights. Lamps sit just off a built
    //  tile (nudged toward the nearest open neighbour) so they flank, not cover it.
    // ════════════════════════════════════════════════════════════════════
    var _streetLampGroup = null, _streetLampKey = '';
    var _STREET_TERRAIN = { road: 1, bricks: 1, brick: 1, pathway: 1, path: 1, ruins: 1, stairs: 1, cobble: 1 };
    // Tiles that read as "built environment" — a placed structure (any object
    // that isn't a tree) or a street/brick/path/ruin terrain — the spots a real
    // street lamp would stand beside.
    function _collectBuiltTiles(_bw, _bh) {
        if (typeof _initBuildingKeys === 'function') _initBuildingKeys();
        var out = [];
        for (var y = 0; y < _bh; y++) {
            for (var x = 0; x < _bw; x++) {
                var built = false;
                var cell = (state.boardObjects && state.boardObjects[y]) ? state.boardObjects[y][x] : null;
                if (cell) {
                    var k = Array.isArray(cell) ? (cell[0] ? cell[0].key : null) : cell;
                    if (k && !_isTreeKey(k)) built = true;     // any non-tree structure
                }
                if (!built && typeof getTerrainAt === 'function') {
                    var tk = (getTerrainAt(x, y) || '').replace(/_\d+$/, '');
                    if (_STREET_TERRAIN[tk]) built = true;
                }
                if (built) out.push({ x: x, y: y });
            }
        }
        return out;
    }
    // Street lamps render on the natural-terrain map (Entropy Vale) and on any
    // map that opts in via state.streetLamps (the thematically urban/built maps).
    function _streetLampsEnabled() {
        if (_naturalTerrainActive()) return true;
        return !!(typeof state !== 'undefined' && state && state.streetLamps);
    }
    function _buildStreetLamps() {
        if (!scene || typeof THREE === 'undefined') return;
        var ts = CONFIG.tileSize || BASE_TILE;
        if (!_streetLampsEnabled()) {
            if (_streetLampGroup) { scene.remove(_streetLampGroup); _disposeR(_streetLampGroup); _streetLampGroup = null; _streetLampKey = ''; }
            if (typeof ThreePost !== 'undefined' && ThreePost && ThreePost.rebuildStreetLampLights) ThreePost.rebuildStreetLampLights([], ts);
            return;
        }
        var _bw = (typeof bw === 'function') ? bw() : 16;
        var _bh = (typeof bh === 'function') ? bh() : 8;

        var built = _collectBuiltTiles(_bw, _bh);
        // Fallback: if the map exposes no built tiles, drop a sparse interior
        // spread so the lamps still light the field rather than vanishing.
        if (!built.length) {
            for (var fy = 2; fy < _bh - 1; fy += 5) {
                for (var fx = 2; fx < _bw - 1; fx += 5) built.push({ x: fx, y: fy });
            }
        }
        // key off the built-tile signature so we rebuild only when the map changes
        var sig = ''; for (var s = 0; s < built.length; s++) sig += built[s].x + ',' + built[s].y + ';';
        var key = _bw + 'x' + _bh + 'x' + ts + '#' + sig;
        if (_streetLampGroup && _streetLampKey === key) return;
        if (_streetLampGroup) { scene.remove(_streetLampGroup); _disposeR(_streetLampGroup); }
        _streetLampGroup = new THREE.Group();
        _streetLampGroup.name = 'streetLamps';
        _streetLampGroup.renderOrder = -20;
        _streetLampKey = key;

        var cx = _bw * ts * 0.5, cz = _bh * ts * 0.5;
        var lampH = ts * 2.0;                  // ~2 tiles tall
        var headY = lampH * 0.86;              // lantern sits near the top
        var rng = _mulberry32(0x1A77 + _bw * 53 + _bh * 311);

        // dark metal post + self-lit warm glass lantern (bright → blooms)
        function _lampMat(node, srcMat) {
            var nm = (srcMat && srcMat.name) || '';
            if (nm === 'Glass') return new THREE.MeshBasicMaterial({ color: 0xffe6b0, fog: false });
            return new THREE.MeshLambertMaterial({ color: 0x23262e, fog: false });
        }

        // Pick up to MAX lamps spread evenly across the built tiles.
        var MAX_LAMPS = 6;
        var chosen = [];
        if (built.length) {
            var stride = Math.max(1, built.length / MAX_LAMPS);
            for (var i = 0; chosen.length < MAX_LAMPS; i++) {
                var idx = Math.floor(i * stride);
                if (idx >= built.length) break;
                chosen.push(built[idx]);
            }
        }

        // Tiles a lamp must never stand on: any built/occupied tile (so it
        // flanks a structure instead of sitting on its roof) or a fluid/void tile.
        var occupied = {};
        for (var bi = 0; bi < built.length; bi++) occupied[built[bi].x + ',' + built[bi].y] = 1;
        function _tileOpenForLamp(x, y) {
            if (x < 0 || y < 0 || x >= _bw || y >= _bh) return false;
            if (occupied[x + ',' + y]) return false;                       // a built tile
            var cell = (state.boardObjects && state.boardObjects[y]) ? state.boardObjects[y][x] : null;
            if (cell && (Array.isArray(cell) ? cell.length : cell)) return false;   // a placed prop
            if (typeof getTerrainAt === 'function') {
                var tk = (getTerrainAt(x, y) || '').replace(/_\d+$/, '');
                if (_FLUID_TERRAIN_SET[tk] || tk === 'void') return false;
            }
            return true;
        }

        var heads = [];   // world positions for ThreePost point-lights
        for (var c = 0; c < chosen.length; c++) {
            var t = chosen[c];
            // nudge the post off the built tile to an adjacent OPEN tile (toward
            // board centre first) so it stands beside the building/street, never
            // on top of it. If nothing beside it is open, skip rather than cover.
            var towardX = (t.x < cx / ts) ? 1 : -1;
            var towardY = (t.y < cz / ts) ? 1 : -1;
            var cand = [
                { x: t.x + towardX, y: t.y },
                { x: t.x, y: t.y + towardY },
                { x: t.x + towardX, y: t.y + towardY },
                { x: t.x - towardX, y: t.y },
                { x: t.x, y: t.y - towardY },
                { x: t.x + towardX, y: t.y - towardY },
                { x: t.x - towardX, y: t.y + towardY },
                { x: t.x - towardX, y: t.y - towardY }
            ];
            var spot = null;
            for (var ci = 0; ci < cand.length; ci++) {
                if (_tileOpenForLamp(cand[ci].x, cand[ci].y)) { spot = cand[ci]; break; }
            }
            if (!spot) continue;
            var nx = spot.x, ny = spot.y;
            // reserve the chosen tile so two lamps never share it
            occupied[nx + ',' + ny] = 1;
            var wx = nx * ts + ts / 2;
            var wz = ny * ts + ts / 2;
            var topY = tileTopY(nx, ny);

            var lamp = _miscModelInstance(_R2_MISC + 'streetlamp/Street%20Lamp.obj', false, lampH, { matPick: _lampMat });
            lamp.position.set(wx, topY, wz);
            lamp.rotation.y = Math.atan2(cx - wx, cz - wz) + (rng() - 0.5) * 0.4;
            _streetLampGroup.add(lamp);

            var glow = _hzGlowCore(ts * 0.30, 0xffd27a, 0xff9a3c);
            glow.position.set(wx, topY + headY, wz);
            _streetLampGroup.add(glow);

            heads.push({ wx: wx, wy: topY + headY, wz: wz });
        }

        scene.add(_streetLampGroup);

        if (typeof ThreePost !== 'undefined' && ThreePost && ThreePost.rebuildStreetLampLights) {
            ThreePost.rebuildStreetLampLights(heads, ts);
        }
    }

    // Gentle drift for the floating background scenery — a slow vertical bob
    // plus a lazy spin, giving the skyline cinematic, dream-like motion.
    function _animateFloaters(t) {
        for (var i = 0; i < _horizonFloaters.length; i++) {
            var f = _horizonFloaters[i];
            f.obj.position.y = f.baseY + Math.sin(t * f.spd + f.phase) * f.amp;
            f.obj.rotation.y += f.spin;
        }
        // breathe the self-lit glow accents — a slow luminous swell
        for (var j = 0; j < _hzGlowPulse.length; j++) {
            var p = _hzGlowPulse[j];
            var s = Math.sin(t * p.spd + p.phase);
            if (p.opAmp) p.mat.opacity = Math.max(0, p.baseOp + s * p.opAmp);
            if (p.sclAmp && p.mesh) p.mesh.scale.setScalar(p.baseScl * (1 + s * p.sclAmp));
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
            // Default pale-sky atmospheric haze. Skipped when the retro mood fog is
            // on — there the per-fragment shader fog (see _injectHorizonFog) does
            // the dissolving, keyed on world altitude to match the dome exactly.
            if (!_retroFogHorizon && m._ew_hzHaze) m.color.lerp(_hzHaze, m._ew_hzHaze);
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
        var ts = CONFIG.tileSize || BASE_TILE;
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

        _ensureFloatOverlay();

        initialized = true;
        console.log('[ThreeRenderer] initialized (CSS2DRenderer enabled)');
    }

    function activate() {
        if (!initialized) init();
        if (!canvas || !renderer) return;
        active = true;
        canvas.style.display = 'block';
        if (css2dRenderer) css2dRenderer.domElement.style.display = '';
        _ensureFloatOverlay();
        if (_floatDomOverlay) _floatDomOverlay.style.display = '';
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
        if (_miniWrap) _miniWrap.style.display = 'none';
        if (canvas) canvas.style.display = 'none';
        if (css2dRenderer) css2dRenderer.domElement.style.display = 'none';
        _clearFloatTextTweens();
        if (_floatDomOverlay) _floatDomOverlay.style.display = 'none';
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
        _fogResetTileFades();
        _fogVisibleKey = '';
        _fogVisibleSet = null;
        _fogLastCheckTime = 0;
        _fogBuiltBw = 0; _fogBuiltBh = 0;

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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        // Unit-tracking laser marks (Headshot) follow their target — sync the
        // overlay position to the painted unit so the red dot rides along.
        for (var _mdi = 0; _mdi < delayed.length; _mdi++) {
            var _md = delayed[_mdi];
            if (_md && _md.markedUnitId) {
                for (var _mui = 0; _mui < state.units.length; _mui++) {
                    var _mu = state.units[_mui];
                    if (_mu.id === _md.markedUnitId && !_mu.dead) { _md.x = _mu.x; _md.y = _mu.y; break; }
                }
            }
        }
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
                var dr = dd.markedUnitId ? 0 : (dd.aoeRadius || 1);
                var dInfo = _buildZoneBorderEdges(dd.x, dd.y, dr);
                _renderZoneBorderGroup(dInfo, dd.markedUnitId ? 0xff2020 : 0xdd4444);
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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        var ts = CONFIG.tileSize || BASE_TILE;
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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        var ts = CONFIG.tileSize || BASE_TILE;

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
        var ts = CONFIG.tileSize || BASE_TILE;

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

    /* ────────────────────────────────────────────────────────────────────
     * Minimap — fixed overhead map pinned to the bottom-right corner. Draws a
     * simplified, top-down board using the shared terrain palette
     * (window.EW_TERRAIN_COLORS) and overlays spawn zones, nexus zones, tower
     * "cubes" (bases) and visible units. The viewer's currently-active unit
     * gets a white arrow that points the way the camera is facing.
     * ──────────────────────────────────────────────────────────────────── */
    var _miniWrap = null, _miniCanvas = null, _miniCtx = null;
    var MINI_BOX = 188;          /* max wrapper size in CSS px */
    var _miniLastW = -1, _miniLastH = -1;
    var _MINI_TERRAIN_FALLBACK = {
        blank:'transparent', void:'transparent', grass:'rgba(80,140,60,0.45)',
        water:'rgba(50,100,200,0.5)', deep_water:'rgba(30,60,160,0.6)',
        mountain:'rgba(120,110,100,0.5)', lava:'rgba(220,80,20,0.58)',
        dirt:'rgba(130,100,60,0.4)', forest:'rgba(40,100,40,0.5)'
    };
    function _miniTerrainColors() {
        return (typeof window !== 'undefined' && window.EW_TERRAIN_COLORS) || _MINI_TERRAIN_FALLBACK;
    }

    function _ensureMinimap() {
        if (_miniWrap) return;
        _miniWrap = document.createElement('div');
        _miniWrap.id = 'battleMinimap';
        _miniWrap.style.cssText = [
            'position:fixed', 'right:14px', 'bottom:14px', 'z-index:60',
            'pointer-events:none', 'border-radius:10px', 'padding:6px',
            'box-sizing:content-box', 'background:rgba(10,14,22,0.62)',
            'border:1px solid rgba(120,150,190,0.35)',
            'box-shadow:0 4px 18px rgba(0,0,0,0.45)'
        ].join(';');
        _miniCanvas = document.createElement('canvas');
        _miniCanvas.style.cssText = 'display:block;';
        _miniWrap.appendChild(_miniCanvas);
        document.body.appendChild(_miniWrap);
        _miniCtx = _miniCanvas.getContext('2d');
    }

    /* Which player is "us" (whose units are always shown / arrow is drawn). */
    function _miniViewerPlayer() {
        try {
            if (typeof ONLINE_RULES !== 'undefined' && ONLINE_RULES.active &&
                typeof window._myPlayer === 'function') return window._myPlayer();
        } catch (e) {}
        var ap = (state && state.autoPlayers) || {};
        if (!ap[1]) return 1;
        if (!ap[2]) return 2;
        return 1;
    }

    /* Fog-of-war aware: own units always show; enemies only when not concealed. */
    function _miniUnitVisible(u, viewer) {
        if (u.player === viewer) return true;
        if (!state.fogOfWar) return true;
        var ap = (state && state.autoPlayers) || {};
        if (ap[viewer]) return true; /* viewer is AI / spectated → reveal */
        try {
            if (window.GAME && typeof window.GAME.isUnitConcealedFrom === 'function')
                return !window.GAME.isUnitConcealedFrom(u, viewer);
        } catch (e) {}
        return true;
    }

    function _miniDiamond(ctx, cx, cy, r, color) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.3);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    }

    /* Filled triangle from (cx,cy) pointing along unit vector (fx,fy). */
    function _miniArrow(ctx, cx, cy, fx, fy, len) {
        var px = -fy, py = fx;            /* perpendicular */
        var tipX = cx + fx * len,        tipY = cy + fy * len;
        var baseX = cx - fx * len * 0.35, baseY = cy - fy * len * 0.35;
        var hw = len * 0.42;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + px * hw, baseY + py * hw);
        ctx.lineTo(baseX - px * hw, baseY - py * hw);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
    }

    function _updateMinimap() {
        try {
            if (!active || typeof state === 'undefined' || !state || !state.boardTerrain) {
                if (_miniWrap) _miniWrap.style.display = 'none';
                return;
            }
            var W = (typeof bw === 'function') ? bw() :
                    (state.boardTerrain[0] ? state.boardTerrain[0].length : 0);
            var H = (typeof bh === 'function') ? bh() : state.boardTerrain.length;
            if (!W || !H) { if (_miniWrap) _miniWrap.style.display = 'none'; return; }

            _ensureMinimap();
            _miniWrap.style.display = 'block';

            var cell = Math.max(2, Math.floor(Math.min(MINI_BOX / W, MINI_BOX / H)));
            var drawW = cell * W, drawH = cell * H;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);

            if (_miniLastW !== drawW || _miniLastH !== drawH) {
                _miniCanvas.width = Math.round(drawW * dpr);
                _miniCanvas.height = Math.round(drawH * dpr);
                _miniCanvas.style.width = drawW + 'px';
                _miniCanvas.style.height = drawH + 'px';
                _miniLastW = drawW; _miniLastH = drawH;
            }

            var ctx = _miniCtx;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, drawW, drawH);

            var COLORS = _miniTerrainColors();

            /* ── Terrain ── */
            for (var y = 0; y < H; y++) {
                var trow = state.boardTerrain[y];
                if (!trow) continue;
                for (var x = 0; x < W; x++) {
                    var t = trow[x];
                    if (!t || t === 'blank' || t === 'void') continue;
                    var col = COLORS[t];
                    if (col === undefined) col = 'rgba(90,120,95,0.3)'; /* unknown terrain */
                    if (col === 'transparent') continue;
                    ctx.fillStyle = col;
                    ctx.fillRect(x * cell, y * cell, cell, cell);
                }
            }

            /* ── Spawn zones ── */
            var sz = state.spawnZones;
            if (sz) {
                for (var sp = 1; sp <= 2; sp++) {
                    var zone = sz[sp];
                    if (!zone) continue;
                    ctx.fillStyle = sp === 1 ? 'rgba(60,150,255,0.5)' : 'rgba(255,70,70,0.5)';
                    for (var zi = 0; zi < zone.length; zi++) {
                        var tl = zone[zi];
                        if (tl) ctx.fillRect(tl.x * cell, tl.y * cell, cell, cell);
                    }
                }
            }

            /* ── Nexus zones (objectives) ── */
            if (state.nexusPoints) {
                var nkeys = Object.keys(state.nexusPoints);
                for (var nki = 0; nki < nkeys.length; nki++) {
                    var nex = state.nexusPoints[nkeys[nki]];
                    if (!nex) continue;
                    var nzs = nex.zoneSize || 1;
                    var nx = (nex.zoneX || 0) * cell, ny = (nex.zoneY || 0) * cell;
                    var nw = nzs * cell, nh = nzs * cell;
                    var base = nex.owner === 1 ? 'rgba(60,150,255,'
                             : nex.owner === 2 ? 'rgba(255,70,70,'
                             : 'rgba(255,210,80,';
                    ctx.fillStyle = base + '0.26)';
                    ctx.fillRect(nx, ny, nw, nh);
                    var lw = Math.max(1.5, cell * 0.16);
                    ctx.lineWidth = lw;
                    ctx.strokeStyle = base + '0.95)';
                    ctx.strokeRect(nx + lw / 2, ny + lw / 2, nw - lw, nh - lw);
                }
            }

            /* ── Tower "cubes" (bases) ── */
            if (state.towers) {
                for (var tp = 1; tp <= 2; tp++) {
                    var tw = state.towers[tp];
                    if (!tw || (typeof tw.hp === 'number' && tw.hp <= 0)) continue;
                    _miniDiamond(ctx, (tw.x + 0.5) * cell, (tw.y + 0.5) * cell,
                                 Math.max(3, cell * 0.6), tp === 1 ? '#3aa0ff' : '#ff5a5a');
                }
            }

            /* ── Units (fog-aware) + remember the viewer's active unit ── */
            var viewer = _miniViewerPlayer();
            var activeId = state._blitzActiveUnitId;
            var units = state.units || [];
            var activeUnitPos = null;
            for (var uiI = 0; uiI < units.length; uiI++) {
                var u = units[uiI];
                if (!u || u.dead || (typeof u.hp === 'number' && u.hp <= 0)) continue;
                if (!_miniUnitVisible(u, viewer)) continue;
                var ucx = (u.x + 0.5) * cell, ucy = (u.y + 0.5) * cell;
                var isOwn = (u.player === viewer);
                if (u.id === activeId && isOwn) activeUnitPos = { x: ucx, y: ucy };
                var rad = Math.max(2, cell * 0.34);
                ctx.beginPath();
                ctx.arc(ucx, ucy, rad, 0, Math.PI * 2);
                ctx.fillStyle = isOwn ? '#46d07a' : '#ff4d4d';
                ctx.fill();
                ctx.lineWidth = Math.max(1, cell * 0.1);
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.stroke();
            }

            /* ── Camera-facing arrow on the viewer's active unit ── */
            if (activeUnitPos) {
                var yaw = (typeof camera !== 'undefined' && camera && typeof camera.yaw === 'number')
                          ? camera.yaw : 0;
                var yawRad = yaw * Math.PI / 180;
                /* world forward (horizontal) → minimap (-sin, -cos): yaw 0 points up/north */
                var fx = -Math.sin(yawRad), fy = -Math.cos(yawRad);
                _miniArrow(ctx, activeUnitPos.x, activeUnitPos.y, fx, fy, Math.max(7, cell * 0.95));
            }

            /* ── Inner frame ── */
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(180,200,230,0.25)';
            ctx.strokeRect(0.5, 0.5, drawW - 1, drawH - 1);
        } catch (e) {
            /* never let the minimap break the render loop */
        }
    }

    function renderFrame() {
        if (!active || !renderer || !scene) return;

        if (typeof camera !== 'undefined') {
            ThreeCamera.setTileSize(CONFIG.tileSize || BASE_TILE);

            if (!camera._appliedThisFrame) {
                ThreeCamera.sync(camera);
            }
            camera._appliedThisFrame = false;
        }

        _updateEnvironment();

        // A tile-size change (menu MENU_TILE <-> battle BASE_TILE) rescales the
        // entire board. The renderer's animation loop can otherwise rebuild the
        // terrain at the menu size when a new match is started from a menu (the
        // version flips before renderBoard switches CONFIG.tileSize to the battle
        // size), leaving a tiny board that floats under the units and never
        // rebuilds. Force a full rebuild of everything scale-dependent whenever
        // the size changes. tileSize is constant within a battle, so on a normal
        // frame this costs only the comparison below.
        var _curTileSize = CONFIG.tileSize || BASE_TILE;
        if (_lastBuiltTileSize !== -1 && _curTileSize !== _lastBuiltTileSize) {
            _lastBoardW = 0; _lastBoardH = 0;
            _lastTerrainVersion = -1; _lastHeightVersion = -1; _lastVoxelVersion = -1;
            _lastTerrainDecoSerial = '';
            _lastObjectSerial = ''; _objectsDirty = true;
            _lastTurretSerial = ''; _lastDeployableSerial = ''; _lastNexusSerial = '';
            invalidateUnits();
            _lastBuiltTileSize = _curTileSize;
        }

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
        _updateActionCamOcclusion();

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

        _updateMinimap();
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

    /* In the map editor, the pointer ray must resolve a tile even over empty
       cells (which have no terrain mesh). Try the mesh raycast first, then fall
       back to a flat ground-plane intersection so click-to-place is reliable. */
    function _editorResolveTile(clientX, clientY) {
        var hit = ThreeCamera.screenToTile(clientX, clientY, canvas, terrainGroup, objectGroup);
        if (hit) return hit;
        if (typeof state !== 'undefined' && state.phase === 'editor' && ThreeCamera.screenToTilePlane) {
            return ThreeCamera.screenToTilePlane(clientX, clientY, canvas, 0);
        }
        return hit;
    }

    function _bindInput() {
        if (!canvas) return;

        _onMouseMove = function(e) {

            var unitHit = ThreeCamera.screenToUnit(e.clientX, e.clientY, canvas, unitGroup);
            _updateUnitHover(unitHit ? unitHit.unitId : null);

            var hit = _editorResolveTile(e.clientX, e.clientY);
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
            var hit = _editorResolveTile(e.clientX, e.clientY);
            if (hit && typeof handleTileDragStart === 'function') handleTileDragStart(hit.tileX, hit.tileY);
        };

        _onTouchStart = function(e) {
            if (!e.touches || !e.touches.length) return;
            var touch = e.touches[0];
            var hit = _editorResolveTile(touch.clientX, touch.clientY);
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
                camera._apply = function() { orig(); this._appliedThisFrame = true; if (active && ThreeCamera.getCamera()) { ThreeCamera.setTileSize(CONFIG.tileSize||BASE_TILE); ThreeCamera.sync(this); } };
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
        _clearFloatTextTweens();
        if (_floatDomOverlay && _floatDomOverlay.parentElement) _floatDomOverlay.parentElement.removeChild(_floatDomOverlay);
        _floatDomOverlay = null;
        if (_horizonGroup) { if (scene) scene.remove(_horizonGroup); _disposeR(_horizonGroup); }
        _horizonGroup = null; _horizonMats.length = 0; _horizonKey = '';
        if (_arenaRuinsGroup) { if (scene) scene.remove(_arenaRuinsGroup); _disposeR(_arenaRuinsGroup); }
        _arenaRuinsGroup = null; _arenaRuinsKey = '';
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
        _fogTiles.clear();
        _fogBuiltBw = 0; _fogBuiltBh = 0;
        _clearAnimations();
        _lastBoardW = 0; _lastBoardH = 0; _lastBuiltTileSize = -1;
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

    // Called when a new match begins (the renderer stays active across matches and
    // is never disposed). Drops the previous match's leftover animation tweens and
    // invalidates the terrain/unit caches so the next render frame rebuilds the
    // board, heights and units from scratch for the new map — preventing stale
    // geometry (e.g. units left floating over the old terrain) and forcing the
    // camera to snap cleanly to the new framing instead of drifting from the last.
    function resetForNewMatch() {
        _clearAnimations();
        _lastBoardW = 0; _lastBoardH = 0;
        _lastTerrainVersion = -1; _lastHeightVersion = -1; _lastVoxelVersion = -1;
        _lastTerrainDecoSerial = ''; _lastObjectSerial = ''; _objectsDirty = true;
        invalidateUnits();
        if (typeof ThreeCamera !== 'undefined' && ThreeCamera.snapImmediate) ThreeCamera.snapImmediate();
    }

    return {
        init, activate, deactivate, isActive, dispose, hookCamera, resetForNewMatch,
        rebuildTerrain, rebuildObjects, rebuildTurrets, rebuildNexusWalls, rebuildSanctuaryWalls, rebuildUnits, rebuildHighlights,
        rebuildFog, invalidateUnits,

        scanSpriteOffset,

        setOverlay, clearOverlay, clearAllOverlays, flashTelegraph,

        drawArrow3D, drawPathArrow3D, clearArrows3D,

        showGhostUnit, clearGhostUnit,

        unitSurfaceY, tileTopY,

        showIntentBadges, clearIntentBadges, worldToScreen,

        startWalkTween, startDisplaceTween, startJumpTween, startStrikeLeapTween, startDeathTween,

        startProjectileTween,

        startTetherTween,

        startFloatingText,

        startHitEffect,

        hasActiveAnims,

        setHorizonFog,

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

        CONFIG.tileSize = BASE_TILE;

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
