#!/usr/bin/env node
/* docs/plans/door-hq-2/hwing.js — H-WING (DOOR HQ 2.0 wave 4, 2026-11-26). Repo-only tooling.
   Writes data.js DOOR_HQ.rooms.hwing_floor (THE HALLS) and the four vignettes (hwing_desert, hwing_pines, hwing_corn, hwing_moon)
   from plans/5_h_wing.png: yellowed halls laid out like a dungeon, one plain door from every level of the building on its outer
   walls (the shortcut network), plain doors on the blocks between the halls into the uncanny rooms (the Swimming Pool, the
   Garden, Home, the Thirteenth Floor, the Mandela Room, the Upside-Down Room) and into the vignettes: small pieces of other places
   under their own sky, each with a lone door on its far side that comes out on another face of the same block.
   The halls are a plan room (`terrain.gen.kind 'plan'`, look 'walls'): `hall` / `space` rows carve the walkable floor out of a
   solid mass of wallpapered wall. Grid: metres from the plan's top-left corner, x east, z south (converted to the room's
   centred frame on the way out). Main halls 7 m wide (2 squares), back halls 3.5 m.
     node docs/plans/door-hq-2/hwing.js            print the rooms
     node docs/plans/door-hq-2/hwing.js --write    write them into data.js between the H-WING markers
   Notes: docs/notes/hq-building-rooms.md "DOOR HQ 2.0, WAVE 4: H-WING". */
'use strict';
const fs = require('fs'), path = require('path');
const r2 = v => Math.round(v * 100) / 100;

/* ── THE MEASURES ── */
const W = 112, D = 77;               // the box: 32 x 22 squares
const H = 3.5;                       // the look book: the halls' ceiling at 3.5 m, low on purpose
const OX = W / 2, OZ = D / 2;        // plan corner -> room centre
const X = x => r2(x - OX), Z = z => r2(z - OZ);

/* ══ THE HALLS (plan metres) ══
   rows: the top hall z 0-7, the upper blocks z 7-24.5, the middle hall z 24.5-31.5, the lower blocks z 31.5-49, the bottom hall z 49-56,
   the back halls south of it (z 56-77: "it goes on further than the building is wide").
   columns, upper: hall 0-7 | DESERT block 7-35 | hall 35-42 | MANDELA 42-52.5 | hall 52.5-59.5 | UPSIDE-DOWN 59.5-70 | hall 70-77 | PINES block 77-105 | hall 105-112
   columns, lower: hall 0-7 | HOME 7-17.5 | hall 17.5-24.5 | THIRTEENTH 24.5-35 | hall 35-42 | POOL block 42-70 | hall 70-77 | GARDEN 77-87.5 | hall 87.5-94.5 | MOON 94.5-105 | hall 105-112 */
const feats = [];
const hallV = (x0, x1, z0, z1) => feats.push({ k: 'hall', pts: [[X((x0 + x1) / 2), Z(z0)], [X((x0 + x1) / 2), Z(z1)]], w: x1 - x0 });
const hallH = (z0, z1, x0, x1) => feats.push({ k: 'hall', pts: [[X(x0), Z((z0 + z1) / 2)], [X(x1), Z((z0 + z1) / 2)]], w: z1 - z0 });
const space = (x0, x1, z0, z1) => feats.push({ k: 'space', x: X((x0 + x1) / 2), z: Z((z0 + z1) / 2), w: x1 - x0, d: z1 - z0 });
const line = (pts, w) => feats.push({ k: 'hall', pts: pts.map(([x, z]) => [X(x), Z(z)]), w });
/* the three long halls */
hallH(0, 7, 0, 112); hallH(24.5, 31.5, 0, 112); hallH(49, 56, 0, 112);
/* the cross halls: the two outer ones and the two full ones run the whole height; the others only half */
hallV(0, 7, 0, 56); hallV(105, 112, 0, 56); hallV(35, 42, 0, 56); hallV(70, 77, 0, 56);
hallV(52.5, 59.5, 0, 31.5);          // between the Mandela Room and the Upside-Down Room (upper only)
hallV(17.5, 24.5, 24.5, 56);         // between Home and the Thirteenth Floor (lower only)
hallV(87.5, 94.5, 24.5, 56);         // between the Garden and the Moon (lower only)
/* inside the blocks: THE CUBICLES (the desert block, in from the west hall), THE BREAK ROOM (the pines block, in from the east hall),
   THE TYPING POOL (the pool block, in from the bottom hall) — rooms that are nothing but more of the same */
space(10.5, 28, 10.5, 21); hallH(14, 17.5, 7, 10.5);
space(84, 101.5, 10.5, 21); hallH(14, 17.5, 101.5, 105);
space(45.5, 66.5, 35, 45.5); hallV(54.25, 57.75, 45.5, 49);
/* THE BACK HALLS (3.5 m), south of the bottom hall: a turn, a dead end with a dead machine, an office nobody uses, and the corridor
   that comes out where you came in */
line([[56, 56], [56, 70], [98, 70], [98, 77]], 3.5);
line([[77.75, 56], [77.75, 63], [87.5, 63]], 3.5); space(87.5, 94.5, 59.5, 66.5);
line([[66.5, 70], [66.5, 75.25]], 3.5);
line([[45.5, 70], [56, 70]], 3.5);

/* ══ THE DOORS ══ */
const PLAIN = 'leaf_white_wood', PLAIN2 = 'leaf_beige_wood';
const doors = [];
/* the plain door from every level, on the outer walls (plans/5_h_wing.png's dashed squares) */
const lvl = (id, wall, at, label, action) => doors.push(Object.assign({ id, wall }, wall === 'n' || wall === 's' ? { x: X(at) } : { z: Z(at) }, { leaf: PLAIN, label, action }));
lvl('ring',         'n', 3.5,   'THE RING',          { room: 'ring_g', at: 'hwing' });
lvl('upper',        'n', 38.5,  'THE LOBBY',         { room: 'central_egress', at: 'hwing_upper' });
lvl('garage',       'n', 73.5,  'GARAGE',            { room: 'garage', at: 'hwing' });
lvl('works_top',    'n', 108.5, 'THE WORKS',         { room: 'factory', at: 'hwing' });
lvl('works_middle', 'w', 28,    'THE GANTRY',        { room: 'labs', at: 'hwing' });
lvl('works_bottom', 'e', 28,    'THE INCINERATOR',   { room: 'antechamber', at: 'hwing' });
/* the back halls' last door: the corridor goes on, and comes out at the Ring's door, inside, facing in */
lvl('loop',         's', 98,    'H-WING',            { room: 'hwing_floor', at: 'ring' });
/* the doors on the blocks (free doors standing against the block's face; `face` = the way into the hall) */
const FACE = { n: 0, e: 90, s: 180, w: 270 };
const blk = (id, x, z, side, leaf, label, action) => doors.push({ id, wall: 'free', x: X(x), z: Z(z), face: FACE[side], leaf, label, action });
blk('desert',     31.5, 7,     'n', PLAIN,  'DESERT AT DUSK',        { room: 'hwing_desert', at: 'hall' });
blk('desert_out', 10.5, 24.5,  's', PLAIN,  'DESERT AT DUSK',        { room: 'hwing_desert', at: 'lone' });
blk('mandela',    47.25, 24.5, 's', PLAIN2, 'THE MANDELA ROOM',      { room: 'mandela', at: 'labs' });
blk('upsidedown', 64.75, 7,    'n', PLAIN2, 'THE UPSIDE-DOWN ROOM',  { room: 'upsidedown', at: 'labs' });
blk('pines',      101.5, 7,    'n', PLAIN,  'SNOWY PINES',           { room: 'hwing_pines', at: 'hall' });
blk('pines_out',  80.5, 24.5,  's', PLAIN,  'SNOWY PINES',           { room: 'hwing_pines', at: 'lone' });
blk('home',       7, 40.25,    'w', 'leaf_suburban_house', 'HOME',   { room: 'hwing_home', at: 'hall' });
blk('thirteenth', 35, 40.25,   'e', PLAIN2, 'THE THIRTEENTH FLOOR',  { room: 'thirteenth', at: 'crawl' });
blk('pool',       56, 31.5,    'n', PLAIN2, 'THE SWIMMING POOL',     { room: 'natatorium', at: 'garden' });
blk('garden',     82.25, 49,   's', PLAIN2, 'THE GARDEN',            { room: 'garden', at: 'annex' });
blk('moon',       99.75, 31.5, 'n', PLAIN,  'THE MOON',              { room: 'hwing_moon', at: 'hall' });
blk('moon_out',   105, 43.75,  'e', PLAIN,  'THE MOON',              { room: 'hwing_moon', at: 'lone' });
blk('corn',       14, 56,      'n', PLAIN,  'CORN FIELD',            { room: 'hwing_corn', at: 'hall' });
blk('corn_out',   28, 56,      'n', PLAIN,  'CORN FIELD',            { room: 'hwing_corn', at: 'lone' });

/* ══ THE DRESSING (LOOK_BOOK.md "H-Wing": square_cubicle, office_chair, filing_cabinet, water_cooler, paper_sheet, a dead
   vending machine, cobwebs sparingly; an even grid of fluorescents with flicker_tubes, which is what makes it wrong) ══ */
const props = [];
const P = (key, x, z, more) => props.push(Object.assign({ key, x: X(x), z: Z(z) }, more || {}));
/* the tubes: every 7 m down the middle of every main hall, one in six flickers */
let n = 0;
const tube = (x, z, f) => P(++n % 6 === 0 ? 'flicker_tube' : 'fluorescent', x, z, { ceil: true, face: f });
for (let x = 7; x <= 105; x += 7) { tube(x, 3.5, 90); tube(x, 28, 90); tube(x, 52.5, 90); }
for (let z = 14; z <= 42; z += 7) { if (z === 28) continue; tube(3.5, z, 0); tube(108.5, z, 0); tube(38.5, z, 0); tube(73.5, z, 0); }
[14, 21].forEach(z => tube(56, z, 0)); [35, 42].forEach(z => { tube(21, z, 0); tube(91, z, 0); });
[[56, 63], [63, 70], [77, 70], [91, 70], [98, 74], [77.75, 59.5], [91, 63]].forEach(([x, z]) => tube(x, z, 90));
/* the rooms inside the blocks: tubes over them too */
[[14, 14], [21, 14], [14, 17.5], [21, 17.5], [87.5, 14], [94.5, 14], [87.5, 17.5], [94.5, 17.5], [49, 38.5], [56, 38.5], [63, 38.5], [49, 42], [56, 42], [63, 42]].forEach(([x, z]) => tube(x, z, 90));

/* THE CUBICLES (desert block): two rows of cubicles, seat side to the aisle */
[13, 17.5, 22, 26.5].forEach(x => { P('square_cubicle', x, 12, { face: 180 }); P('square_cubicle', x, 19.4, { face: 0 }); });
P('office_chair', 15.2, 15.9, { face: 140 }); P('office_chair', 24.6, 14.9, { face: 300 });
P('paper_sheet', 19.6, 16.2, { y: 0.01, face: 35 }); P('paper_sheet', 12.4, 15.0, { y: 0.01, face: 300 });
P('water_cooler', 27.4, 16.0, { face: 270 });
/* THE BREAK ROOM (pines block): a table nobody sits at, the machines, the cooler */
P('psx_vending_machine_1', 85.0, 11.2, { face: 180 }); P('psx_vending_machine_1', 86.6, 11.2, { face: 180 });
P('water_cooler', 92.5, 11.0, { face: 180 });
P('psx_table_large_2', 92.75, 16.5, { face: 0 }); P('office_chair', 91.2, 16.5, { face: 90 }); P('office_chair', 94.3, 16.4, { face: 280 });
P('coffee_mug', 92.6, 16.4, { y: 0.78 }); P('wall_clock', 92.75, 10.6, { y: 2.3, face: 180 });
/* THE TYPING POOL (pool block): three rows of cubicles facing the same wall */
[48.5, 53.5, 58.5, 63.5].forEach(x => [37.5, 41.5].forEach(z => P('square_cubicle', x, z, { face: 180 })));
P('paper_sheet', 51.0, 44.0, { y: 0.01, face: 80 }); P('paper_sheet', 60.6, 39.7, { y: 0.01, face: 20 }); P('paper_sheet', 61.2, 44.2, { y: 0.01, face: 150 });
P('filing_cabinet', 66.0, 36.0, { face: 270 }); P('filing_cabinet', 66.0, 37.4, { face: 270 });
/* the halls: things left against the walls, never within a door's clear square */
P('filing_cabinet', 7.5 - 0.45, 12.2, { face: 90 }); P('filing_cabinet', 0.45, 44.5, { face: 90 });
P('water_cooler', 41.6, 18.5, { face: 270 }); P('office_chair', 39.0, 45.0, { face: 200 });
P('filing_cabinet', 59.1, 14.5, { face: 270 }); P('filing_cabinet', 59.1, 15.9, { face: 270 });
P('psx_vending_machine_1', 76.5, 40.5, { face: 270 });
P('office_chair', 98.0, 27.4, { face: 60 });
P('filing_cabinet', 111.55, 15.0, { face: 270 }); P('water_cooler', 111.6, 49.5 - 3.6, { face: 270 });
P('paper_sheet', 30.4, 29.0, { y: 0.01, face: 10 }); P('paper_sheet', 66.4, 53.4, { y: 0.01, face: 120 }); P('paper_sheet', 91.0, 4.5, { y: 0.01, face: 260 });
P('office_chair', 63.5, 51.0, { face: 330 });
/* the back halls: the dead machine at the dead end, the office nobody uses */
P('psx_vending_machine_1', 66.5, 75.0, { face: 0 });
P('square_cubicle', 91, 61.2, { face: 180 }); P('office_chair', 91.5, 64.4, { face: 20 });
P('psx_cobweb_1', 55.0, 69.0, { y: 2.9, face: 45 }); P('psx_cobweb_1', 97.2, 76.2, { y: 2.9, face: 315 }); P('psx_cobweb_1', 0.7, 55.4, { y: 2.9, face: 135 });

/* the point lights (the tubes are fixtures; these light the floor), at the crossings */
const lights = [[3.5, 3.5], [38.5, 3.5], [73.5, 3.5], [108.5, 3.5], [3.5, 28], [38.5, 28], [73.5, 28], [108.5, 28], [3.5, 52.5], [38.5, 52.5], [73.5, 52.5], [108.5, 52.5],
    [19, 16], [93, 16], [56, 40], [56, 63], [91, 63]].map(([x, z]) => ({ x: X(x), z: Z(z) }));

const fmtV = v => {
    if (typeof v === 'string') return "'" + v.replace(/'/g, "\\'") + "'";
    if (Array.isArray(v)) return '[' + v.map(fmtV).join(', ') + ']';
    if (v && typeof v === 'object') return '{ ' + Object.entries(v).map(([k, w]) => k + ': ' + fmtV(w)).join(', ') + ' }';
    return String(v);
};
const rows = (arr, ind) => arr.map(o => ind + fmtV(o) + ',').join('\n');

const halls = `        hwing_floor: {
            label: 'H-WING',
            kind: 'box', noWalkers: true,
            shell: {
                w: ${W}, d: ${D}, h: ${H},
                wallH: ${H}, dadoH: 0.85,
                floor: 'carpet_4', wall: 'wallpaper', dado: 'drywall_2', trim: 'drywall_3', ceiling: 'ceiling',
                floorColor: 0x9c8e5e, wallColor: 0xd8c78a, dadoColor: 0xc8b878, ceilColor: 0xf0ece2,
                pipes: false, strips: false, keyLamp: 0,
                lights: ${fmtV(lights)},
                mood: { light: 0xf1ebc0, ambient: 0.65 },
                fog: { color: 0x2a2612, density: 0.016 },
                look: HQ_ROOM_LOOKS.faded,
                plate: { x: ${X(3.5)}, z: ${Z(0) + 0.25}, y: 2.9 },
            },
            terrain: {
                res: 0.875,
                floor: 'carpet_4', cliff: 'wallpaper', path: 'carpet_4',
                noise: { amp: 0, scale: 5 }, crag: false,
                gen: { kind: 'plan', look: 'walls', wallKey: 'wallpaper', rim: 0, forceGrow: -0.3 },
                features: [
${rows(feats, '                    ')}
                ],
            },
            doors: [
${rows(doors, '                ')}
            ],
            counters: [],
            props: [
${rows(props, '                ')}
            ],
            agents: [], npcSpots: [], onlineSpots: [], lines: [],
            spawn: { x: ${X(3.5)}, z: ${Z(4.2)}, face: 180 },
        },`;

/* ══ THE VIGNETTES: 28 x 38.5 m of another place under its own sky, OPEN edge (the ground runs out, nothing stands at the bound):
   the door you came in by stands alone behind you (south), the lone door stands alone across it (north) ══ */
const VW = 28, VD = 38.5;
const vDoors = (label) => `            doors: [
                { id: 'hall', wall: 's', x: 0, leaf: '${PLAIN}', label: 'H-WING', action: { room: 'hwing_floor', at: '${label}' } },
                { id: 'lone', wall: 'n', x: 0, leaf: '${PLAIN}', label: 'H-WING', action: { room: 'hwing_floor', at: '${label}_out' } },
            ],`;
const vEnd = `            counters: [], agents: [], npcSpots: [], onlineSpots: [], lines: [],
            spawn: { x: 0, z: ${r2(VD / 2 - 3.6)}, face: 0 },
        },`;
const pr = (arr) => arr.map(o => '                ' + fmtV(o) + ',').join('\n');
/* a scatter that keeps the walk from door to door clear (|x| > lane) and away from the edges */
function scatter(seed, nItems, lane, mk) {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = [];
    for (let i = 0; i < nItems; i++) {
        let x = (rnd() * 2 - 1) * (VW / 2 - 2), z = (rnd() * 2 - 1) * (VD / 2 - 3);
        if (Math.abs(x) < lane) x = Math.sign(x || 1) * (lane + rnd() * 3);
        out.push(mk(r2(x), r2(z), Math.round(rnd() * 360), rnd));
    }
    return out;
}

const desertProps = [
    ...scatter(7, 7, 4.5, (x, z, f, rnd) => ({ key: 'saguaro_cactus', x, z, face: f, h: r2(3.8 + rnd() * 2.6) })),
    ...scatter(11, 6, 3.5, (x, z, f) => ({ key: 'prickly_pear', x, z, face: f })),
    ...scatter(19, 4, 2.5, (x, z, f) => ({ key: 'tumbleweed', x, z, face: f })),
    { key: 'power_pole', x: -9.5, z: -4, face: 90 }, { key: 'power_pole', x: 9.5, z: -4, face: 90 },
];
const desert = `        hwing_desert: {
            label: 'DESERT AT DUSK',
            kind: 'box', noWalkers: true,
            shell: hqAncientShell({ w: ${VW}, d: ${VD}, h: 20, wallH: 20, floor: 'desert', apron: 'desert', skirt: 'dirt_2', apronColor: 0xffffff, floorColor: 0xffffff, plate: { x: 0, z: ${-VD / 2 + 0.4}, y: 5.0 },
                                    mood: { lamp: 0xff9a50, glow: 0xff7a30, strip: 0xffc080, light: 0xffb878, ambient: 0.5 },
                                    sky: { night: 0, hold: 19.3, tint: 0xe08a50, tintAmt: 0.65, stars: 0.5, nebula: 0.4, day: 1, clouds: 0.08, fog: { color: 0xe29a60, amount: 0.55, top: 0.05, band: 0.45, density: 0.02 }, scenery: 'none' },
                                    atmos: { kind: 'dust', color: 0xd8c0a0, n: 40 },
                                    look: HQ_ROOM_LOOKS.plateau }),
            terrain: { res: 1.75, floor: 'desert', cliff: 'bricks_1', path: 'urban_street', noise: { amp: 0.12, scale: 9 }, crag: false,
                features: [{ k: 'path', pts: [[${-VW / 2 - 16}, -4], [${VW / 2 + 16}, -4]], w: 5 }] },
${vDoors('desert')}
            props: [
${pr(desertProps)}
            ],
${vEnd}`;

const pinesTrees = scatter(23, 16, 3.5, (x, z, f, rnd) => ({ k: 'tree', x, z, kind: ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3', 'xmas_pine'][Math.floor(rnd() * 4)], h: r2(5.5 + rnd() * 3) }));
const pinesProps = [
    ...scatter(29, 6, 2.5, (x, z, f) => ({ key: 'snow_heap', x, z, face: f })),
    { key: 'lantern_post', x: 2.2, z: r2(-VD / 2 + 3.2), face: 180 },
];
const pines = `        hwing_pines: {
            label: 'SNOWY PINES',
            kind: 'box', noWalkers: true,
            shell: hqMountainShell({ w: ${VW}, d: ${VD}, h: 20, wallH: 20, floor: 'calm_snow', apron: 'calm_snow', skirt: 'ice_1', floorColor: 0xf2f6ff, apronColor: 0xf2f6ff, plate: { x: 0, z: ${-VD / 2 + 0.4}, y: 5.0 },
                                    mood: { lamp: 0xffc070, glow: 0xffa040, light: 0xb8c8ff, ambient: 0.45 },
                                    sky: { night: 1, lock: 22, tint: 0x1c2a48, tintAmt: 0.45, stars: 0.8, nebula: 0.4, fog: { color: 0x39465e, amount: 0.6, top: 0.07, band: 0.55, density: 0.03 }, scenery: 'none' },
                                    forest: { depth: 14, spacing: 2.8, rows: 2.6, start: 1.0, kinds: ['xmas_snow_pine', 'xmas_snow_pine_2', 'xmas_snow_pine_3', 'xmas_pine', 'xmas_pine_2'] },
                                    atmos: { kind: 'snow', wind: 0.6 },
                                    look: HQ_ROOM_LOOKS.mountain }),
            terrain: { res: 1.75, floor: 'calm_snow', cliff: 'ice_1', path: 'calm_snow', noise: { amp: 0.18, scale: 7 }, crag: false,
                features: [
${pinesTrees.map(t => '                    ' + fmtV(t) + ',').join('\n')}
                ] },
${vDoors('pines')}
            props: [
${pr(pinesProps)}
            ],
${vEnd}`;

/* the corn: rows of corn_row (3.5 m) east-west across the field, the walk from door to door cut through the middle */
const cornProps = [];
for (let z = -VD / 2 + 3; z <= VD / 2 - 4; z += 1.75) for (let x = -VW / 2 + 1.75; x <= VW / 2 - 1.75; x += 3.5) { if (Math.abs(x) < 2.6) continue; cornProps.push({ key: 'corn_row', x: r2(x), z: r2(z), face: 0 }); }
cornProps.push({ key: 'hay_bale', x: 2.6, z: 6.5, face: 20 }, { key: 'lantern_post', x: -2.2, z: r2(-VD / 2 + 3.2), face: 180 });
const corn = `        hwing_corn: {
            label: 'CORN FIELD',
            kind: 'box', noWalkers: true,
            shell: hqRanchShell({ w: ${VW}, d: ${VD}, h: 20, wallH: 20, plate: { x: 0, z: ${-VD / 2 + 0.4}, y: 5.0 },
                                   sky: { night: 1, lock: 23, tint: 0x2a1638, tintAmt: 0.5, stars: 1.2, nebula: 0.8, fog: { color: 0x2c2040, amount: 0.86, top: 0.1, band: 0.6, density: 0.024 }, scenery: 'none' } }),
            terrain: { res: 1.75, floor: 'grass_rocky', cliff: 'dirt', path: 'dirt', noise: { amp: 0.06, scale: 8 }, crag: false,
                features: [{ k: 'path', pts: [[0, ${VD / 2}], [0, ${-VD / 2}]], w: 3 }] },
${vDoors('corn')}
            props: [
${pr(cornProps)}
            ],
${vEnd}`;

const moonProps = [
    ...scatter(31, 10, 3, (x, z, f, rnd) => ({ key: rnd() < 0.5 ? 'psxg_rock_1' : 'psxg_rock_4', x, z, face: f, h: r2(0.3 + rnd() * 0.7) })),
    ...scatter(37, 4, 4, (x, z, f) => ({ key: 'asteroid_b', x, z, face: f })),
    { key: 'flag_pole', x: -5.5, z: -6, face: 30 },
    { key: 'earth', x: 14, z: -70, y: 26, h: 14 },
];
const moon = `        hwing_moon: {
            label: 'THE MOON',
            kind: 'box', noWalkers: true,
            shell: hqAncientShell({ w: ${VW}, d: ${VD}, h: 20, wallH: 20, floor: 'moon', apron: 'moon', skirt: 'moon_3', apronColor: 0xc8c8d0, floorColor: 0xc8c8d0, plate: { x: 0, z: ${-VD / 2 + 0.4}, y: 5.0 },
                                    mood: { lamp: 0xd8e0ff, glow: 0xa0b0ff, light: 0xe8ecff, ambient: 0.4 },
                                    sky: { night: 1, lock: 23, tint: 0x05060d, tintAmt: 0.55, stars: 2.2, nebula: 0.6, fog: { color: 0x0a0c14, amount: 0.12, top: 0.02, band: 0.3 }, scenery: 'none' },
                                    look: HQ_ROOM_LOOKS.plateau }),
            terrain: { res: 1.75, floor: 'moon', cliff: 'moon_3', path: 'moon_2', noise: { amp: 0.22, scale: 6 }, crag: false, features: [] },
${vDoors('moon')}
            props: [
${pr(moonProps)}
            ],
${vEnd}`;

const block = `        /* <H-WING> — WRITTEN BY docs/plans/door-hq-2/hwing.js (edit the tool, run --write). DOOR HQ 2.0 wave 4 (2026-11-26), plans/5_h_wing.png:
           H-WING is on no level. Yellowed halls laid out like a dungeon (a plan room: halls 7 m wide, a 3.5 m ceiling, an even grid of
           tubes); a plain door from every level of the building on its outer walls (the Ring, the Lobby's upper level, the Garage, the
           Works top / middle / bottom), so it is also the shortcut network. On the blocks between the halls: the uncanny rooms (the
           Swimming Pool, the Garden, Home, the Thirteenth Floor, the Mandela Room, the Upside-Down Room) and four VIGNETTES, small open
           rooms under another sky with a lone door across them that comes out on another face of the same block. Every door here is
           an ordinary door for now (the impossible-doors thread may turn them into portals). */
${halls}
${desert}
${pines}
${corn}
${moon}
        /* </H-WING> */`;

if (process.argv.includes('--write')) {
    const f = path.join(__dirname, '..', '..', '..', 'data.js');
    const src = fs.readFileSync(f, 'utf8');
    const a = src.indexOf('        /* <H-WING>'), b = src.indexOf('        /* </H-WING> */');
    if (a < 0 || b < 0) { console.error('the H-WING markers are not in data.js'); process.exit(1); }
    fs.writeFileSync(f, src.slice(0, a) + block + src.slice(b + '        /* </H-WING> */'.length));
    console.log('wrote', props.length, 'props,', doors.length, 'doors,', feats.length, 'hall rows into data.js');
} else console.log(block);
