#!/usr/bin/env node
/* THE MAP REMAKE (2026-11-16, docs/plans/map-remake/MAP_REMAKE_PLAN.md; mondo: "do this map remake plan, but make the maps look
   kinda like the images" = the map-pass thread's top-down audit maps: every 3.5 m square drawn by its height, soft ground green,
   hard ground grey, water blue, lit from the top-left).

   node bake-map.js                 bake every plot-built room (about 5 minutes; 4 rooms at a time)
   node bake-map.js <room id> ...   only those rooms (the others keep their last bake)
   node bake-map.js --table         only rewrite the data.js table (no terrain)

   WRITES
   1. Assets/ui/map/<room id>.png   ONE PIXEL PER SQUARE, a data picture, not a picture to look at:
        R = height above the room's lowest square, in `hs` metres a step (HQ_ZONE_MAP row `h0`, `hs`)
        G = the ground kind (HQ_ZONE_MAP.kinds; map.js THE ZONE SHEET paints it)
        B = flags: 1 solid (a building, a wall), 2 a tree, 4 water, 8 lava, 16 sludge, 32 the sea, 64 nothing (no ground),
            128 ground you cannot stand on (the forest mass, a roof you cannot reach)
      upload: node sync-zip.js --put Assets/ui/map/<room>.png Assets/ui/map/<room>.png  (the tool prints the lines)
   2. data.js HQ_ZONE_MAP between ZONEMAP-BEGIN / ZONEMAP-END: every zone, where it stands on THE ONE WORLD (in plots, north up:
      docs/plans/one-world, v13; `world` = the ground kind of every plot + the far sights), its rooms (where each sits on the zone sheet, its plot grid in metres, its picture's sha), the district names
      (from each zone's layout.json) and Disaster City's 183 plots (the game has no plot list for the city: read here from
      docs/disaster-city/city-layout.json + move.js + hills-layout.json).
   Plot names of every other room are read LIVE by the map from `room.plots.names` (each zone's own bake writes them).
   Rerun after a zone's heights change (its picture goes stale; the names never do). */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto'), cp = require('child_process');
const REPO = __dirname;
const SQ = 3.5, PLOT = 42;
const OUT_DIR = path.join(REPO, 'Assets/ui/map');

/* ── THE ZONES: where each room stands ON THE ONE WORLD (2026-11-17, mondo's approved map v13: docs/plans/one-world/plots.json).
   wx/wy = the room's plot grid's north-west corner on the world's plot grid (x east, y south; Disaster City's first city plot =
   0,0, its Hills are rows -3..-1). layer: 'surface' | 'under' | 'off' (not a place on the sheet: a row in the list).
   zx/zy = the room on its ZONE sheet (a zone of several rooms), in plots.
   `wait: 1` = THE ROOM HAS NOT MOVED YET: v13 re-lays its districts (BUILD_PLAN phase 3 / 4), so wx/wy is only where the chart
   draws it meanwhile (its zone's v13 home); it is nobody's neighbour and its edges stay its own. The zone thread that re-lays
   it drops the flag (or the row, for a room it retires).
   A ROOM MAY SAY ITS OWN PLACE: `room.world = { hub, layer, wx, wy [, zx, zy, note] }` in data.js (the route kit and every
   re-laid room write it). Such a room needs no row here: it is added to its hub's zone, and `room.world` wins over a row here. ── */
const ZONES = [
    { hub: 'city', layout: null, rooms: [{ room: 'site_prebuilt_downtown_streets', layer: 'surface', wx: 0, wy: -3, zx: 0, zy: 0, city: true }] },
    { hub: 'mountains', layout: 'mountains', rooms: [{ room: 'site_prebuilt_northpole_plots', layer: 'surface', wx: 0, wy: -28, zx: 0, zy: -28 }] },   // ONE WORLD PHASE 5 (2026-11-17): the waiting rows of retired rooms are gone from this table (the Mountains', the Woods', the Estate's, Leylines'); every re-laid room says its own place (`room.world`)
    { hub: 'woods', layout: 'woods', rooms: [] },   // THE TEST SLICE (2026-11-17): the room is the Redwood Trail + the Ritual Ground now (6 x 3 plots, not moved yet); the Clearing and Dead Man's Cave are rooms of their own (`room.world`), so the waiting room is drawn clear of them
    { hub: 'kingdom', layout: 'camelot', rooms: [{ room: 'site_prebuilt_camelot_kingdom', layer: 'surface', wx: -29, wy: -3, zx: 0, zy: 0 }] },
    { hub: 'ranch', layout: 'estate', rooms: [] },   // THE TEST SLICE (2026-11-17): the room is the Haunted House + the Ranch now (6 x 3 plots, not moved yet); the Corn Fields and the Lake are rooms of their own (`room.world`)
    { hub: 'desert', layout: 'desert', rooms: [] },   // ONE WORLD 4.2 (2026-11-17): every Desert room says its own place (`room.world`): the four districts and the roads between them (site_ow_dh1..dh4, site_ow_r9); the Highway's room is retired
    { hub: 'beach', layout: 'beach', rooms: [{ room: 'site_prebuilt_bermuda_beach', layer: 'surface', wx: 12, wy: 2, zx: 0, zy: 0 }] },   // THE ONE WORLD MOVE (2026-11-17, phase 4.3): the Beach stands at 12,2 (8 x 10); the Triangle and the Volcano Island are rooms of their own (`room.world`)
    { hub: 'ley', layout: 'leylines', rooms: [] },
    { hub: 'antarctica', layout: 'antarctica', rooms: [{ room: 'site_prebuilt_antarctica_plots', layer: 'surface', wx: 0, wy: 46, zx: 0, zy: 0 }] },
    { hub: 'divine', layout: 'afterlife', rooms: [
        { room: 'site_prebuilt_heaven_plots', layer: 'off', zx: 3, zy: -13, note: 'ABOVE THE VATICAN' },
        { room: 'site_prebuilt_vatican_plots', layer: 'surface', wx: -12, wy: -9, zx: 6, zy: 0 },   // (One World 4.4: the Colosseum stands north of the Vatican in its room; the room says its own place, `room.world`)
        { room: 'site_prebuilt_vatican_under', layer: 'under', wx: -10, wy: -5, zx: -17, zy: -5, note: 'UNDER THE VATICAN' },
        { room: 'site_prebuilt_hell_plots', layer: 'under', wx: -10, wy: -10, zx: -18, zy: -10, note: 'UNDER THE COLOSSEUM' }   /* ONE WORLD PHASE 5 (2026-11-17): THE ZONE SHEET draws every room of a zone at zx, zy whatever its layer. The surface rooms stand at their world places (the Vatican, the River Road, the Canyon Trail), so the rooms that are not on the surface are set clear of them: Heaven north-east of the River Road, the Catacombs and Hell west of the Vatican on the rows they lie under. They were still at the old sheet's places and lay over the roads. The North Pole's zy is its world row for the same reason */] },
    { hub: 'underworld', layout: 'sewers', rooms: [{ room: 'site_prebuilt_downtown_underworld', layer: 'under', wx: 1, wy: 1, zx: 1, zy: 1, note: 'UNDER DISASTER CITY' }] },   // (the room says its own place, `room.world`, which wins; this row carries the map's note)
    { hub: 'cavern', layout: 'cavern', rooms: [] },
    { hub: 'dumb', layout: 'dumb', rooms: [{ room: 'site_prebuilt_dumb_base', layer: 'under', wx: 0, wy: 11, zx: 0, zy: 11, note: 'UNDER THE SOUTH OF DISASTER CITY' }] },   // (the room says its own place, `room.world`, which wins; this row carries the map's note)
    { hub: 'deep', layout: 'deep', rooms: [{ room: 'site_prebuilt_atlantis_deep', layer: 'under', wx: 35, wy: 1, zx: 35, zy: 1, note: 'UNDER THE SEA' }] },   // (the room says its own place, `room.world`, which wins; this row carries the map's note)
    { hub: 'space', layout: 'space', rooms: [
        { room: 'site_prebuilt_moon_plots', layer: 'off', zx: 0, zy: 0, note: 'THE SOLAR SYSTEM' }] },   // THE SPACESHIP YOU FLY (2026-11-17): the four worlds are one room (bake-space.js)
    { hub: 'astral', layout: 'astral', rooms: [{ room: 'site_prebuilt_lookingglass_realm', layer: 'off', zx: 0, zy: 0 }] },
    { hub: 'internet', layout: 'internet', rooms: [{ room: 'site_prebuilt_internet_web', layer: 'off', zx: 0, zy: 0, note: 'BESIDE THE ASTRAL REALM' }] },   // THE INTERNET (One World 4.4, 2026-11-17: bake-internet.js)
];
/* ── THE WORLD'S GROUND + SIGHTS (2026-11-17): what every plot of the disc is made of, and the far places a room may see.
   `world.g[y - y0][x - x0]` = the plot's ground letter (plots.json `ground`, 18 kinds + sea, ice, the Ice Wall);
   `world.key[letter] = [kind, kit, edge]`: kit = the route kit's ground kind (bake-route.js), edge = the kind the land past a
   room's line wears there (three-renderer.js _hqEdgeLandFn, `terrain.edges.world`).
   `world.sights` = [name, x, y, landmark kind, size, hub]: a place tall enough to see from another room; a room whose sky says
   `landmarks: 'world'` gets each one within sight at its TRUE BEARING (data.js hqOwLandmarks; kinds = _hqLandmarkBuilders). ── */
const EDGE_OF = { peak: 'mountain', rock: 'mountain', alpine: 'mountain', cliff: 'mountain', foot: 'grass', tundra: 'snow', ice: 'snow', wall: 'snow', forest: 'forest', wood: 'forest',
    meadow: 'grass', grass: 'grass', farm: 'grass', marsh: 'grass', scrub: 'scrub', bad: 'mesa', desert: 'desert', dunes: 'desert', saltflat: 'desert', sand: 'desert', sea: 'coast' };
const SIGHTS = [   // [name, district in plots.json, landmark kind, size, hub]
    ['Disaster City', 'city', 'tower', 1, 'city'], ['The Vatican', 'vat', 'dome', 0.8, 'divine'], ['Came A Lot', 'cam', 'castle', 0.8, 'kingdom'],
];
function buildWorld() {
    const PJ = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/plans/one-world/plots.json'), 'utf8'));
    const key = {}; Object.keys(PJ.ground.key).forEach(c => { const k = PJ.ground.key[c]; if (!EDGE_OF[k.kind]) throw new Error('no edge kind for ground ' + k.kind); key[c] = [k.kind, k.kit || null, EDGE_OF[k.kind]]; });
    const sights = SIGHTS.map(([name, id, kind, s, hub]) => { const d = PJ.districts.find(q => q.id === id); if (!d) throw new Error('no district ' + id); return [name, d.x + d.w / 2, d.y + d.h / 2, kind, s, hub]; });
    return { v: PJ.v, x0: PJ.ground.x0, y0: PJ.ground.y0, w: PJ.ground.w, h: PJ.ground.h, cx: PJ.disc.cx, cy: PJ.disc.cy, r: PJ.disc.r, key, g: PJ.ground.rows, sights };
}
/* the district inks: one hue a letter, kept apart within a zone */
const INKS = ['#e0b040', '#5fb0e0', '#e06a8a', '#7fd07a', '#c08ae0', '#e08a40', '#50d0c0', '#d0d060', '#a0a0ff', '#ff9a9a', '#9ae0ff', '#e0c0a0', '#b0e050', '#ff80d0'];
const CITY_DN = { C: 'Civic Center', F: 'Financial', E: 'Entertainment', U: 'University', H: 'Hero Plaza', B: 'Bayside', R: 'Southside', S: 'Sports + Culture', I: 'Industrial', N: 'The Hollywood Hills' };

/* ── THE GROUND KINDS (G of the picture): the paint key's family. map.js draws each in its colour, shaded by height ── */
const KINDS = ['nothing', 'grass', 'dark grass', 'dirt', 'sand', 'snow', 'rock', 'paved', 'wood', 'ash', 'lava rock', 'cloud', 'red rock', 'crystal', 'gold', 'metal'];
const KIND_RX = [
    [14, /gold|gilded/i], [11, /cloud|heaven|holy|halo/i], [5, /snow|ice|frost|glacier|polar|tundra|igloo/i], [10, /lava|magma|ember/i],
    [9, /scorch|ash|burnt|char|obsidian|basalt|soot|wasteland/i], [12, /mars|rust|red_?rock|clay|terracotta|flesh|storm/i], [13, /crystal|astral|void|nebula|cosmic|gem|glow/i],
    [15, /metal|steel|grate|plate|iron|chrome|hull|tech|scifi|sci_fi|panel|holo|alumin/i],
    [8, /wood|plank|deck|board|parquet|bamboo/i], [7, /^urban:|dungeon|concrete|asphalt|road|slab|tile|cobble|brick|flagstone|marble|pave|sidewalk|stone_floor|floor|carpet|terrazzo|granite|limestone|sandstone_block|street/i],
    [4, /sand|desert|dune|beach|shore/i], [2, /grass_dark|dark_fantasy|swamp|marsh|bog|moss|jungle|fern/i], [1, /grass|lawn|meadow|turf|leaf|leaves|forest|field|hay|corn|crop|garden/i],
    [3, /dirt|mud|soil|earth|path|trail|ground|loam|peat|farm/i], [6, /rock|stone|cliff|rubble|gravel|crater|regolith|moon|lunar|cave|cavern|pebble|boulder|slate/i],
];
const unknownKeys = {};
function kindOf(key) { const k = String(key || ''); for (const [i, rx] of KIND_RX) if (rx.test(k)) return i; unknownKeys[k] = (unknownKeys[k] || 0) + 1; return 6; }

/* ── a PNG writer (RGBA, no filter): node has zlib, nothing else is needed ── */
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); }
function png(w, h, rgba) {
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
    const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; ih[10] = 0; ih[11] = 0; ih[12] = 0;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ── ONE ROOM: sample every square ── */
function bakeRoom(S, id) {
    const room = S.DOOR_HQ.rooms[id]; if (!room) throw new Error('no room ' + id);
    const t0 = Date.now();
    const info = S.hqTerrainInfo(id);
    const sh = room.shell, nx = Math.round(sh.w / SQ), nz = Math.round(sh.d / SQ);
    const paintAt = (x, z) => { if (!info.paint) return info.floor; const i = Math.round((x - info.x0) / info.res), j = Math.round((z - info.z0) / info.res); if (i < 0 || j < 0 || i >= info.nx || j >= info.nz) return info.floor; const v = info.paint.P[j * info.nx + i]; return v ? info.paint.pal[v - 1] : info.floor; };
    const H = new Float32Array(nx * nz), G = new Uint8Array(nx * nz), B = new Uint8Array(nx * nz);
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i, x = -sh.w / 2 + SQ / 2 + i * SQ, z = -sh.d / 2 + SQ / 2 + j * SQ;
        let y = null; try { y = S.hqTerrainFeet(info, x, z, null); } catch (e) { y = null; }
        let f = null; try { f = S.hqTerrainFluidAt(info, x, z); } catch (e) { f = null; }
        let solid = false; try { solid = !!(S.hqTerrainSolidAt(info, x, z, 0) || S.hqTerrainWallAt(info, x, z, 0.3)); } catch (e) { solid = false; }
        if (y == null || !isFinite(y)) {
            /* no feet: a solid square (the forest mass, a building with no roof to stand on) is ground you cannot walk = 128; else nothing (the void) */
            let g = null; if (solid) { try { g = S.hqTerrainHeight(info, x, z); } catch (e) { g = null; } }
            if (f && f.y != null) y = f.y; else if (g != null && isFinite(g)) { y = g; B[k] |= 128; } else { B[k] = 64; H[k] = NaN; continue; }
        }
        if (f) { const fk = String((f.key || '') + ' ' + (f.kind || '') + ' ' + (f.liquid || '')); B[k] |= f.sea ? 32 : /lava|magma/i.test(fk) ? 8 : /sludge|toxic|waste|acid/i.test(fk) ? 16 : 4; if (f.y != null && !f.sea) y = Math.max(y, f.y); if (f.sea) y = f.y; }
        if (solid) B[k] |= 1;
        G[k] = kindOf(paintAt(x, z));
        H[k] = y; if (y < lo) lo = y; if (y > hi) hi = y;
    }
    /* the trees: the room's tree features + tree props */
    const tree = (x, z) => { const i = Math.round((x + sh.w / 2 - SQ / 2) / SQ), j = Math.round((z + sh.d / 2 - SQ / 2) / SQ); if (i >= 0 && j >= 0 && i < nx && j < nz) B[j * nx + i] |= 2; };
    (info.trees || []).forEach(t => tree(t.x, t.z));
    (room.props || []).forEach(p => { if (/^rt:|tree|palm|pine|oak|birch|willow|cypress|redwood/i.test(p.key || '') && !/treehouse|street/i.test(p.key || '') && !((p.y || 0) > 4)) tree(p.x || 0, p.z || 0); });
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    const hs = Math.max(0.25, Math.ceil(((hi - lo) / 255) * 100) / 100);
    const rgba = Buffer.alloc(nx * nz * 4);
    for (let k = 0; k < nx * nz; k++) { rgba[k * 4] = isNaN(H[k]) ? 0 : Math.max(0, Math.min(255, Math.round((H[k] - lo) / hs))); rgba[k * 4 + 1] = G[k]; rgba[k * 4 + 2] = B[k]; rgba[k * 4 + 3] = 255; }
    const buf = png(nx, nz, rgba);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, id + '.png'), buf);
    return { id, nx, nz, h0: +lo.toFixed(2), hs, v: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10), bytes: buf.length, s: ((Date.now() - t0) / 1000).toFixed(1), unknown: unknownKeys };
}

/* ── THE TABLE ── */
function buildTable(S, rasters) {
    const H = S.DOOR_HQ, Z = { v: 2, sq: SQ, plot: PLOT, kinds: KINDS, world: buildWorld(), zones: {} };
    /* a room that says its own place (`room.world`): into its hub's zone; it replaces a row of the table above */
    const zones = ZONES.map(z => Object.assign({}, z, { rooms: z.rooms.map(r => Object.assign({}, r)) }));
    Object.keys(H.rooms).forEach(id => { const w = H.rooms[id] && H.rooms[id].world; if (!w || !w.hub || w.proof) return;   // (proof: a room baked to try a tool, off the map)
        let z = zones.find(q => q.hub === w.hub); if (!z) { z = { hub: w.hub, layout: null, rooms: [] }; zones.push(z); }
        const row = { room: id, layer: w.layer || 'surface', wx: w.wx, wy: w.wy, zx: w.zx != null ? w.zx : w.wx, zy: w.zy != null ? w.zy : w.wy }; if (w.note) row.note = w.note;
        const i = z.rooms.findIndex(r => r.room === id); if (i >= 0) z.rooms[i] = Object.assign({}, z.rooms[i], row, { wait: undefined }); else z.rooms.push(row); });
    for (const z of zones) {
        const hub = H.hubs[z.hub]; if (!hub) { console.warn('no hub', z.hub); continue; }
        let dn = {};
        if (z.layout) {
            const L = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas', z.layout, 'layout.json'), 'utf8'));
            const add = d => { if (!d) return; Object.keys(d).forEach(k => { const v = d[k]; dn[k] = String(typeof v === 'string' ? v : (v && v.name) || k).replace(/\s*\(NEW\)/, ''); }); };
            add(L.districts); (Array.isArray(L.rooms) ? L.rooms : []).forEach(r => add(r && r.districts));
        } else dn = Object.assign({}, CITY_DN);
        const rooms = [], used = {};
        for (const r of z.rooms) {
            if (H.retired && H.retired[r.room]) continue;   // a room a zone thread retired (DOOR_HQ.retired) leaves the map by itself: no edit here
            const room = H.rooms[r.room]; if (!room) { console.warn('no room', r.room); continue; }
            const rs = rasters[r.room] || null;
            const row = { room: r.room, layer: r.layer, zx: r.zx, zy: r.zy };
            if (r.layer !== 'off') { row.wx = r.wx; row.wy = r.wy; }
            if (r.wait) row.wait = 1;
            if (r.note) row.note = r.note;
            if (r.city) {
                const CL = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/city-layout.json'), 'utf8'));
                const MV = require(path.join(REPO, 'docs/disaster-city/move.js'));
                const HL = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/hills-layout.json'), 'utf8'));
                const home = {}; CL.districts.forEach(d => { home[d.id] = [d.gx, d.gy]; });
                row.cols = 13; row.rows = 15; row.ox = -252; row.oz = -378;
                row.plots = [];
                CL.plots.forEach(p => { const hm = home[p.d], to = MV.to[p.d]; row.plots.push([p.id, p.name, p.d, p.x - hm[0] * 4 + to[0] * 4, p.y - hm[1] * 4 + to[1] * 4 + 3]); used[p.d] = 1; });
                HL.plots.forEach(p => { const m = /^H(\d+)-(\d+)$/.exec(p.id); if (m) { row.plots.push([p.id, p.name, 'N', +m[1], +m[2]]); used.N = 1; } });
            } else {
                const P = room.plots || {}; row.cols = P.nx || P.n || Math.round(room.shell.w / PLOT); row.rows = P.nz || Math.round(room.shell.d / PLOT);   // (rows from the shell: a room that wrote `n` alone is not always square, Leylines is 9 x 7)
                row.ox = -room.shell.w / 2; row.oz = -room.shell.d / 2;
                (P.names || []).forEach(n => { used[n[2]] = 1; });
            }
            if (rs) Object.assign(row, { nx: rs.nx, nz: rs.nz, h0: rs.h0, hs: rs.hs, v: rs.v });
            else { row.nx = Math.round(room.shell.w / SQ); row.nz = Math.round(room.shell.d / SQ); }
            rooms.push(row);
        }
        const districts = {}; let i = 0;
        Object.keys(dn).forEach(k => { if (used[k]) districts[k] = [dn[k], INKS[i++ % INKS.length]]; });
        Object.keys(used).forEach(k => { if (!districts[k]) districts[k] = [k, INKS[i++ % INKS.length]]; });
        Z.zones[z.hub] = { rooms, districts };
    }
    /* TWO ROOMS ON ONE PLOT: every placed room's plots on the world grid (a `wait` room is not placed); a clash stops the bake */
    const at = { surface: {}, under: {} }, clash = [];
    Object.keys(Z.zones).forEach(hub => Z.zones[hub].rooms.forEach(row => { if (row.wx == null || row.wait || !at[row.layer]) return;
        const P = (H.rooms[row.room] || {}).plots || {}, has = (c, r) => Array.isArray(P.mask) ? (P.mask[r] || '').charAt(c) === '#' : row.plots ? row.plots.some(q => q[3] === c && q[4] === r) : true;
        for (let r = 0; r < row.rows; r++) for (let c = 0; c < row.cols; c++) if (has(c, r)) { const k = (row.wx + c) + ',' + (row.wy + r); if (at[row.layer][k] && at[row.layer][k] !== row.room) clash.push(k + ' ' + at[row.layer][k] + ' / ' + row.room); else at[row.layer][k] = row.room; } }));
    if (clash.length) throw new Error('two rooms stand on one world plot:\n  ' + clash.slice(0, 12).join('\n  '));
    return Z;
}
function writeTable(Z) {
    const f = path.join(REPO, 'data.js'); let src = fs.readFileSync(f, 'utf8');
    const body = '/* ZONEMAP-BEGIN (written by `node bake-map.js`; do not edit by hand: THE MAP REMAKE, docs/plans/map-remake/MAP_REMAKE_PLAN.md) */\n'
        + 'const HQ_ZONE_MAP = ' + JSON.stringify(Z) + ';\n/* ZONEMAP-END */\n';
    const a = src.indexOf('/* ZONEMAP-BEGIN'), b = src.indexOf('/* ZONEMAP-END */');
    if (a >= 0 && b > a) src = src.slice(0, a) + body + src.slice(b + '/* ZONEMAP-END */\n'.length);
    else { const at = src.indexOf('const HQ_WORLD_L = {'); if (at < 0) throw new Error('no HQ_WORLD_L in data.js'); src = src.slice(0, at) + body + src.slice(at); }
    fs.writeFileSync(f, src);
}

/* ── the driver: a child per room (terrain compiles are slow; 4 at once) ── */
const STATE = path.join(OUT_DIR, 'bake-map.json');   // the last bake of each room (h0, hs, v), kept beside the pictures
if (process.argv[2] === '--child') {
    const S = require(path.join(REPO, 'load-data.js')).loadGameData();
    const r = bakeRoom(S, process.argv[3]); process.stdout.write('\n@@' + JSON.stringify(r) + '\n'); process.exit(0);
}
(async () => {
    const args = process.argv.slice(2);
    let state = {}; try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {}
    const all = []; ZONES.forEach(z => z.rooms.forEach(r => all.push(r.room)));
    const todo = args.includes('--table') ? [] : (args.filter(a => !a.startsWith('--')).length ? args.filter(a => !a.startsWith('--')) : all);
    const unknown = {};
    let next = 0;
    const run = () => new Promise(res => {
        const go = () => {
            if (next >= todo.length) return res();
            const id = todo[next++];
            const p = cp.spawn(process.execPath, ['--max-old-space-size=6000', __filename, '--child', id], { stdio: ['ignore', 'pipe', 'inherit'] });
            let out = ''; p.stdout.on('data', d => { out += d; });
            p.on('close', code => {
                const m = /@@(.*)/.exec(out);
                if (code || !m) console.error('FAILED', id, code);
                else { const r = JSON.parse(m[1]); Object.keys(r.unknown || {}).forEach(k => { unknown[k] = (unknown[k] || 0) + r.unknown[k]; }); delete r.unknown; state[id] = r; console.log(id.padEnd(40), r.nx + 'x' + r.nz, 'h', r.h0 + '+' + r.hs, (r.bytes / 1024).toFixed(1) + ' KB', r.s + ' s'); }
                go();
            });
        };
        go();
    });
    await Promise.all([run(), run(), run(), run()]);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
    const S = require(path.join(REPO, 'load-data.js')).loadGameData();
    writeTable(buildTable(S, state));
    if (Object.keys(unknown).length) console.log('paint keys with no family (drawn as rock):', JSON.stringify(unknown));
    console.log('data.js HQ_ZONE_MAP written. Upload the pictures:');
    console.log('node sync-zip.js --put ' + todo.map(id => `Assets/ui/map/${id}.png Assets/ui/map/${id}.png`).join(' '));
})();
