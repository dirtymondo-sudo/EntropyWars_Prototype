/* THE URBAN DECAY PASS (2026-11-15, mondo: "Utilize this pack to the fullest throughout disaster city ... The roads and wood and
   carpet and pretty much everything in this pack is better textures"; his OK on the plan sheet the same day: "looks good, and you
   can still use the old textures too except for tilegeneric2a, the calm wood planks, the calm carpet, and the road").
   Run by bake-disaster-city.js after every district file and every other pass, so a district thread keeps writing the keys it
   knows and the city still comes out in the pack's sheets (sprites.js URBAN_DECAY_FAMILIES, R2 Assets/world/terrain/urban/).
   It only renames a sheet key (and lifts `gain` where the new sheet is darker); it never moves, adds or drops a row.
   DC_NO_UD=1 = the room without it.

   NEVER in the city again (his words): urban:TileGeneric2a, calm_planks (and wood_planks, which the calm look draws as
   calm_planks), calm_carpet, and the plaster sheet as the road.
   THE STACKING RULE (his pins on the sheet: "this one isnt stackable (strip across it)"): a wall that repeats upward wears a
   PLAIN sheet only (the `a` of a family). A sheet with a base band / plinth / pipe is for a ground storey, a Moulding is one
   cornice band, a ShippingContainer is one container side, a Curb is one kerb strip: none of them is named here.
   A tinted part keeps its tint: where a district coloured a grey sheet, the new sheet is a grey one of about the same value. */
'use strict';
const U = n => 'urban:' + n;
/* the ground: the road (terrain.floor), the walk (path + palette), the steep banks (cliff), and the palette's other sheets */
const GROUND = { floor: U('RoadGeneric1a'), cliff: U('ConcreteWoodFormed1a'), path: U('ConcreteSidewalk1a') };
const PAL = {
    'urban:TileGeneric1a': U('ConcreteSidewalk1a'),        // the walks: paving slabs
    'urban:ConcreteStriped2a': U('ConcreteSlab2a'),        // yards, lots, alleys: poured slab
    'urban:TileGeneric2a': U('ConcreteHexagons1a'),        // the pale plazas: hex pavers
    'urban:TileGeneric3a': U('ConcreteHexagons2b'),        // the dark plazas: dark hex pavers
    'urban:ConcreteUnderTiles1': U('ConcreteRoofBitumen1a'), // the roofs you walk on: tar
    'wood_planks': U('WoodGeneric1a'), 'calm_planks': U('WoodGeneric1a'),   // boardwalks and decks
};
/* the 765 retaining blocks + yard walls, by district (each about the old sheet's value, each a plain stackable sheet) */
const WALL = { R: 'BrickUrban3a', C: 'ConcretePrecast1c', F: 'BrickMasonry1a', U: 'BrickWide2a', H: 'ConcreteWoodFormed1a', E: 'ConcreteGeneric3a', I: 'BrickCinder1a', S: 'ConcretePanels3a', B: 'ConcreteGeneric1a' };
/* the pixel brick sheets the calm look drew as grey stone: real brick of the same grey, so every district's own tint still colours it */
const BRICK1 = { R: 'BrickUrban3a', E: 'BrickUrban3a', C: 'BrickMasonry1a', F: 'BrickMasonry1a' };
const BRICK3 = { H: 'BrickUrban4a', I: 'BrickCinder4a', E: 'BrickUrban3a', C: 'BrickMasonry2a', F: 'BrickMasonry2a' };
const WOODFLOOR = { R: ['WoodFlooring1a', 'WoodFlooring1b'], E: ['WoodFlooring1a', 'WoodFlooring1b'], H: ['WoodFlooring1c', 'WoodFlooring1d'], U: ['WoodFlooring1c', 'WoodFlooring1d'],
                    C: ['WoodFlooring1c', 'WoodFlooring1a'], F: ['WoodFlooring1d', 'WoodFlooring1c'], I: ['WoodFlooring1b'], S: ['WoodFlooring1a'], B: ['WoodFlooring1b', 'WoodFlooring1a'] };
const WOODPART = { E: 'WoodGeneric1b', B: 'WoodGeneric1c' };
const CARPET = { U: 'CarpetPattern1c', C: 'CarpetPlain1c', S: 'CarpetDiamond1c' };
const CONC2 = { I: 'ConcretePanels3a', S: 'ConcretePrecast1c', R: 'ConcreteGeneric2a' };   // a building's striped concrete, where it was the yard sheet stood up
const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (list, seed) => list[hash(seed) % list.length];

/* one key -> its new key (or null = keep). role: 'wall' | 'floorIn' | 'keyIn' | 'bridge' | 'part' | 'partTop' | 'row' */
function swap(key, d, role, seed, part) {
    if (key === 'wood_planks' || key === 'calm_planks') {
        if (role === 'floorIn') return U(pick(WOODFLOOR[d] || ['WoodFlooring1a'], seed));
        if (role === 'bridge') return U('WoodGeneric2a');
        return U(WOODPART[d] || 'WoodGeneric1a');
    }
    if (key === 'urban:ConcreteUnderTiles1a') return U('ConcreteUnderTiles1');   // a sheet name that never existed (36 parts drew no sheet)
    if (key === 'calm_carpet') return U(CARPET[d] || 'CarpetPattern1c');
    if (key === 'urban:TileGeneric2a') return U('TileLinoleum1a');
    if (key === 'bricks_1') return U(BRICK1[d] || 'BrickMasonry1a');
    if (key === 'bricks_3') return U(BRICK3[d] || 'BrickMasonry2a');
    if (key === 'urban:ConcreteStriped2a') {
        if (role === 'wall') return U(WALL[d] || 'ConcreteWoodFormed1a');
        if (role === 'part' && CONC2[d]) return U(CONC2[d]);
        return null;
    }
    if (key === 'urban:ConcreteStriped1c' && role === 'part' && d === 'H') return U('ConcretePrecast2a');
    if (key === 'urban:PlasterWallPainted1a' && role === 'keyIn') return U('PlasterWallGeneric1a');
    if (key === 'urban:PlasterWallStucco1a' && role === 'keyIn') return U('PlasterWallGeneric3a');
    if (key === 'urban:TileGeneric5a' && role === 'floorIn') return U('TileLinoleum1c');
    if (key === 'urban:ConcreteUnderTiles1' && role === 'partTop') return U('ConcreteRoofBitumen1a');
    if (key === 'urban:MetalCorrugatedPainted1a' && role === 'part' && part) {
        if (part.s === 'roof' && d !== 'I') return { key: U('MetalRoofTiles1a'), gain: 1.28 };                                   // a pitched roof: roof tiles (a shed's tin roof stays tin)
        if (d === 'I' && (!part.s || part.s === 'box') && part.size && part.size[1] >= 2.6) return { key: U('MetalWallRibbed1a'), gain: 1.28 };   // an Industrial shed's wall: ribbed cladding
    }
    return null;
}
module.exports = function (o) {
    const n = {}, tick = (a, b) => { const k = a + ' > ' + b.replace(/^urban:/, ''); n[k] = (n[k] || 0) + 1; };
    const dOfRow = f => o.dOf(f) || ((typeof f.x0 === 'number') ? o.dOf({ x: (f.x0 + f.x1) / 2, z: (f.z0 + f.z1) / 2 }) : '') || '';
    o.features.forEach((f, i) => {
        const d = dOfRow(f), seed = f.id || (f.k + ':' + i);
        [['key', f.k === 'wall' ? 'wall' : f.k === 'bridge' ? 'bridge' : 'row'], ['keyIn', 'keyIn'], ['floorIn', 'floorIn']].forEach(([k, role]) => {
            if (typeof f[k] !== 'string') return; const r = swap(f[k], d, role, seed, null); if (typeof r === 'string') { tick(f[k], r); f[k] = r; } });
        (f.parts || []).forEach(p => [['key', 'part'], ['keyTop', 'partTop'], ['keyEnd', 'partEnd'], ['keyBase', 'partEnd']].forEach(([k, role]) => {
            if (typeof p[k] !== 'string') return; const r = swap(p[k], d, role, seed, p); if (!r) return;
            if (typeof r === 'string') { tick(p[k], r); p[k] = r; } else { tick(p[k], r.key); p[k] = r.key; p.gain = Math.round((p.gain > 0 ? p.gain : 1) * r.gain * 100) / 100; } }));
    });
    return n;
};
module.exports.GROUND = GROUND;
module.exports.pal = pal => { const out = []; pal.forEach(k => out.push(PAL[k] || k)); return out; };
module.exports.banned = ['urban:TileGeneric2a', 'calm_planks', 'wood_planks', 'calm_carpet'];
