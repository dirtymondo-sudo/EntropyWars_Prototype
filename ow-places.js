/* ow-places.js — THE PLACES ON THE WAY (2026-11-17, One World; repo-only tooling, read by bake-route.js and by a zone tool that builds route plots itself).
   mondo after the test slice: "Every route plot gets one place of its own to walk towards (from the page's list or plain new ones marked as ideas) ...
   Put the rule in the route kit so phase 4 gets it for free."
   THE RULE: every plot of a road, a highway or a wild link carries ONE small place, a few pieces from the catalogue set down together beside the path:
   something you see from the path and walk over to. Which one: the route's spec may name it (`places: { "<x>,<y>": "<id>" }`, from the design page's
   own list for that route, or `false` for none); otherwise the kit takes the next one from the list of the plot's ground kind, never the same twice
   running. Every piece is in the game already (MODEL_LIST.md §6: the Meshy wish list, the Halloween pack, the PSX packs): no new model.
   EVERY NAME HERE IS AN IDEA OF CLAUDE'S, PLAIN ON PURPOSE (mondo's rule: never invent characters or game rules; new names are marked as ideas). A
   place has no role in the game: no shop, no rest, no story. mondo renames or drops any of them by editing this one table.

   A place = { name, kinds: [kit kinds / map kinds it suits], r: half its side in squares (2 = a 5 x 5 patch), pieces: [[key, dx, dz, o]] }
       dx, dz   squares from the place's middle (whole numbers for a piece that blocks: it stands on a square's middle)
       o        { face, y, noLight } as a room's prop row; `b: 1` = a blocker (it takes its square), else decor
   lay(place, sx, sy, h) sets it down: h = { P(key, sx, sy, o), at(key, fx, fy, o) } (the tool's own helpers). */
'use strict';
const B = { b: 1 };
const PLACES = {
    /* ── green country: grassland, farmland, river meadow, foothills ── */
    well:       { name: 'the well', kinds: ['grass'], r: 2, pieces: [['ancient_well', 0, 0, B], ['water_trough', 1, 1, { face: 90 }], ['wooden_bucket', -0.6, 0.7], ['wooden_barrel', 1, -1, B]] },
    haystack:   { name: 'the hay stack', kinds: ['grass'], r: 2, pieces: [['hay_cart', 0, 0, Object.assign({ face: 20 }, B)], ['hay_rack', -1, -1, Object.assign({ face: 90 }, B)], ['hay_bale', 1.2, 0.6], ['hay_bale', 1.5, -0.5, { face: 40 }], ['hay_bale', -0.9, 1.3, { face: 70 }], ['hay_bale', -0.6, 1.5, { y: 0.9, face: 15 }], ['pitchfork', 0.7, -1.2]] },
    scarecrows: { name: 'the scarecrow row', kinds: ['grass'], r: 2, pieces: [['hw_scarecrow', -2, 0, Object.assign({ face: 180 }, B)], ['hw_scarecrow_2', 0, 0, Object.assign({ face: 160 }, B)], ['hw_scarecrow', 2, 0, Object.assign({ face: 200 }, B)], ['hw_pumpkin', -1.2, 0.7], ['hw_pumpkin', 0.8, 0.9], ['hw_pumpkin', 1.5, -0.6], ['cattle_skull', -0.5, -0.8]] },
    bees:       { name: 'the bee yard', kinds: ['grass'], r: 2, pieces: [['beehive', -1, -1, B], ['beehive', 1, -1, B], ['beehive', -1, 1, B], ['beehive', 1, 1, B], ['wild_flowers', 0.2, 0.1], ['wild_flowers', -1.6, 0.2], ['wild_flowers', 1.7, -0.2], ['wooden_bucket', 0.4, 1.4]] },
    rest:       { name: 'the rest', kinds: ['grass', 'forest'], r: 2, pieces: [['picnic_table', 0, 0, B], ['park_bench', -1, 1, Object.assign({ face: 90 }, B)], ['meshy_campfire_ring', 1.3, 1.2], ['wooden_barrel', 1, -1, B]] },
    plough:     { name: 'the plough', kinds: ['grass'], r: 2, pieces: [['plough', 0, 0, Object.assign({ face: 30 }, B)], ['wheelbarrow', 1.3, 0.9, { face: 250 }], ['hay_bale', -1.2, -0.7], ['pitchfork', 0.6, -1.1]] },
    /* small ones (a 3 x 3 patch: what a narrow plot or a plot with two paths has room for) */
    scarecrow:  { name: 'the lone scarecrow', kinds: ['grass'], r: 1, pieces: [['hw_scarecrow_2', 0, 0, Object.assign({ face: 180 }, B)], ['hw_pumpkin', 0.8, 0.6], ['hw_pumpkin', -0.7, 0.8]] },
    stone:      { name: 'the boundary stone', kinds: ['grass', 'scrub', 'forest', 'desert'], r: 1, pieces: [['milestone', 0, 0, B], ['wild_flowers', 0.7, 0.5], ['psxg_rock_4', -0.8, 0.6]] },
    bench:      { name: 'the bench', kinds: ['grass', 'forest', 'sand'], r: 1, pieces: [['park_bench', 0, 0, B], ['lantern_post', 1, 0, Object.assign({ face: 270, noLight: true }, B)]] },
    /* ── forest and open woodland ── */
    camp:       { name: 'the camp', kinds: ['forest', 'rock'], r: 2, pieces: [['canvas_tent', 0, 0, Object.assign({ face: 200 }, B)], ['meshy_campfire_ring', 1.4, 1.3], ['firewood_stack', -1, 1, Object.assign({ face: 90 }, B)], ['wooden_bucket', 0.9, 0.5], ['stump', 2, 1, B]] },
    woodpile:   { name: 'the woodcutter’s stack', kinds: ['forest'], r: 2, pieces: [['firewood_stack', 0, 0, B], ['firewood_stack', 1, 0, B], ['stump', -1, 1, B], ['wheelbarrow', 1.2, 1.3, { face: 120 }], ['stump', 0, -1, B]] },
    cross:      { name: 'the wayside cross', kinds: ['forest', 'grass'], r: 1, pieces: [['wooden_cross', 0, 0], ['stone_lantern', 1, 0, B], ['wild_flowers', -0.6, 0.5], ['wild_flowers', 0.3, 0.8]] },
    firesign:   { name: 'the fire watch sign', kinds: ['forest'], r: 2, pieces: [['fire_danger_sign', 0, 0], ['picnic_table', 1, 1, B], ['stump', -1, 0, B], ['wooden_barrel', -1, 1, B]] },
    /* ── dry scrub, badlands ── */
    drywell:    { name: 'the dry well', kinds: ['scrub', 'desert'], r: 2, pieces: [['ancient_well', 0, 0, B], ['cattle_skull', 1.1, 0.6], ['wooden_barrel', -1, 0, B], ['wooden_bucket', 0.5, -0.9]] },
    wreck:      { name: 'the wreck', kinds: ['scrub', 'desert'], r: 2, pieces: [['crashed_car', 0, 0, Object.assign({ face: 70 }, B)], ['tire_stack', 1.4, 0.9], ['psxg_dead_bush_1', -1.3, -0.8], ['tire_stack', -1.1, 1.2]] },
    pen:        { name: 'the cattle pen', kinds: ['scrub', 'grass'], r: 2, pieces: [['barbed_wire_fence', -1, -2, Object.assign({ face: 0 }, B)], ['barbed_wire_fence', 0, -2, Object.assign({ face: 0 }, B)], ['barbed_wire_fence', -2, -1, Object.assign({ face: 90 }, B)], ['barbed_wire_fence', -2, 0, Object.assign({ face: 90 }, B)], ['water_trough', 0, 0, { face: 0 }], ['cattle_skull', 1.2, 0.8]] },
    pump:       { name: 'the pump jack', kinds: ['scrub', 'desert'], r: 2, pieces: [['beam_pump', 0, 0, B], ['wooden_barrel', 2, 1, B], ['wooden_barrel', 2, 0, B], ['tire_stack', -1.4, 1.1]] },
    /* ── desert, dunes, salt flats, beach ── */
    wagon:      { name: 'the wagon', kinds: ['desert', 'scrub'], r: 2, pieces: [['covered_wagon', 0, 0, Object.assign({ face: 15 }, B)], ['wooden_barrel', 2, 0, B], ['cattle_skull', -1.5, 1.1], ['wooden_bucket', 1.3, 1.2]] },
    boat:       { name: 'the stranded boat', kinds: ['saltflat', 'sand'], r: 2, pieces: [['fishing_boat', 0, 0, Object.assign({ face: 25 }, B)], ['rowboat', 1, 2, Object.assign({ face: 100 }, B)], ['wooden_barrel', -2, 1, B], ['cattle_skull', 1.6, -1.2]] },
    jetty:      { name: 'the old jetty', kinds: ['saltflat', 'sand'], r: 2, pieces: [['hw_pier', 0, -1, B], ['hw_pier', 0, 0, B], ['hw_pier', 0, 1, B], ['lantern_post', 1, -1, Object.assign({ face: 270, noLight: true }, B)], ['wooden_barrel', -1, 1, B], ['wooden_bucket', 0.8, 0.9]] },
    tower:      { name: 'the water tower', kinds: ['desert', 'saltflat', 'scrub'], r: 2, pieces: [['water_tower_west', 0, 0, B], ['water_trough', 2, 0, { face: 90 }], ['wooden_barrel', -2, 1, B]] },
    markers:    { name: 'the marker stones', kinds: ['desert', 'saltflat', 'rock', 'snow', 'scrub'], r: 1, pieces: [['cairn', 0, 0, B], ['cairn', 1, 1, B], ['cairn', -1, 1, B]] },
    /* ── the coast (2026-11-17, One World 4.3: the design page gives the Coast Road "cliff tunnel, surf coves, a lookout over the sea" and the Delta
       Causeway "reed flats"); ideas, plain names, no role ── */
    surf:       { name: 'the surf rack', kinds: ['sand'], r: 2, pieces: [['surfboard_rack', 0, 0, Object.assign({ face: 180 }, B)], ['surfboard_long', 1.4, 0.9, { face: 70 }], ['beach_towel', -1.2, 1.1, { face: 20 }], ['beach_cooler', -1.4, -0.6]] },
    lookout:    { name: 'the lookout', kinds: ['sand', 'cliff', 'rock'], r: 2, pieces: [['coin_telescope', 0, 0, Object.assign({ face: 90 }, B)], ['park_bench', -1, 1, Object.assign({ face: 90 }, B)], ['lantern_post', 1, 1, Object.assign({ face: 270, noLight: true }, B)]] },
    nets:       { name: 'the drying nets', kinds: ['sand'], r: 2, pieces: [['drying_fish', 0, 0, B], ['fish_boxes', 1, 1, B], ['rowboat', -1, 1, Object.assign({ face: 100 }, B)], ['fishing_rod', 1, -1, B]] },
    reedbed:    { name: 'the reed bed', kinds: ['marsh', 'meadow', 'scrub'], r: 2, pieces: [['reeds', -1, -1, B], ['reeds', 1, 0, B], ['reeds', 0, 1, B], ['heron', 0.4, -0.6, { face: 200 }], ['duck', -1.3, 0.8, { face: 60 }]] },
    tikis:      { name: 'the torches', kinds: ['sand'], r: 1, pieces: [['tiki_torch', -1, 0, B], ['tiki_torch', 1, 0, B], ['beach_towel', 0.1, 0.6, { face: 90 }]] },
    /* ── snow and ice ── */
    snowman:    { name: 'the snowman', kinds: ['snow'], r: 1, pieces: [['xmas_snowman', 0, 0, Object.assign({ face: 180 }, B)], ['snow_sled', 1.1, 0.7, { face: 40 }], ['snow_heap', -1, 1, B]] },
    trapper:    { name: 'the trapper’s camp', kinds: ['snow'], r: 2, pieces: [['canvas_tent', 0, 0, Object.assign({ face: 200 }, B)], ['meshy_campfire_ring', 1.4, 1.3], ['firewood_stack', -1, 1, Object.assign({ face: 90 }, B)], ['snow_sled', 1.5, -0.8, { face: 300 }]] },
    /* ── bare rock, alpine slopes, cliffs ── */
    minecart:   { name: 'the mine cart', kinds: ['rock'], r: 2, pieces: [['mine_cart', 0, 0, Object.assign({ face: 80 }, B)], ['cave_stone', 1, 1, B], ['cave_stone', -1, 0, B], ['wooden_barrel', 1, -1, B]] },
    totem:      { name: 'the carved pole', kinds: ['rock', 'forest'], r: 1, pieces: [['carved_totem_pole', 0, 0, B], ['cave_stone', 1, 1, B], ['wild_flowers', -0.7, 0.6]] },
    /* ── THE NORTH ROUTES' OWN (2026-11-17, BUILD_PLAN phase 4.1): the design page's "on the way" list for R1 to R5 and R12. `kinds: []` = laid only where a
       route's spec names it (so no other route's picks move on a rebake). Ideas of Claude's, plain names, no role in the game. ── */
    ranger:     { name: 'the ranger station', kinds: [], r: 2, pieces: [['woods_cabin', 0, 0, Object.assign({ face: 180 }, B)], ['flag_pole', 2, -2, B], ['picnic_table', -2, 2, B], ['firewood_stack', 2, 2, Object.assign({ face: 90 }, B)], ['trail_sign', -2, -2, B]] },
    inn:        { name: 'the crossroads inn', kinds: [], r: 2, pieces: [['woods_cabin', 0, 0, Object.assign({ face: 180 }, B)], ['lantern_post', 2, -1, Object.assign({ face: 270 }, B)], ['wooden_barrel', 2, 1, B], ['picnic_table', -2, 2, B], ['signpost', -2, -2, B], ['hay_bale', 1.6, 2.1]] },
    menhirs:    { name: 'the standing stones', kinds: [], r: 2, pieces: [['menhir', -2, -1, B], ['menhir', -2, 1, Object.assign({ face: 40 }, B)], ['menhir', 0, -2, Object.assign({ face: 90 }, B)], ['menhir', 0, 2, Object.assign({ face: 200 }, B)], ['menhir', 2, -1, Object.assign({ face: 130 }, B)], ['menhir', 2, 1, Object.assign({ face: 300 }, B)], ['wild_flowers', 0.3, 0.2]] },
    shrine:     { name: 'the wayside shrine', kinds: [], r: 1, pieces: [['hooded_statue', 0, 0, Object.assign({ face: 180 }, B)], ['stone_lantern', 1, 0, B], ['candle', -0.6, 0.7], ['candle', -0.3, 0.8], ['wild_flowers', 0.6, 0.8]] },
    hut:        { name: 'the mountain hut', kinds: [], r: 2, pieces: [['woods_cabin', 0, 0, Object.assign({ face: 180 }, B)], ['firewood_stack', -2, 2, Object.assign({ face: 90 }, B)], ['snow_sled', 1.6, 2.0, { face: 30 }], ['snow_heap', 2, -2, B], ['wooden_barrel', 2, 2, B]] },
    icepond:    { name: 'the frozen pond', kinds: [], r: 2, pieces: [['ice_fishing_hole', 0, 0], ['ice_fishing_hole', 1.3, -0.9], ['snow_sled', 1.1, 1.4, { face: 60 }], ['wooden_bucket', -0.6, 0.6], ['ice_block', -2, -2, B], ['snow_heap', 2, 2, B]] },
};
Object.keys(PLACES).forEach(id => { PLACES[id].id = id; PLACES[id].idea = true; });
/* the list a ground kind draws from, in order (a map kind that has places of its own first: a salt flat is not just desert) */
const forKind = g => { const own = Object.keys(PLACES).filter(id => PLACES[id].kinds.indexOf(g.kind) >= 0), kit = Object.keys(PLACES).filter(id => PLACES[id].kinds.indexOf(g.kit) >= 0 && own.indexOf(id) < 0); return own.concat(kit); };
function lay(place, sx, sy, h) {
    place.pieces.forEach(q => { const o = Object.assign({}, q[3] || {}), blk = o.b; delete o.b;
        if (blk) h.P(q[0], sx + Math.round(q[1]), sy + Math.round(q[2]), o); else h.at(q[0], sx + 0.5 + q[1], sy + 0.5 + q[2], o); });
}
module.exports = { PLACES, forKind, lay };
