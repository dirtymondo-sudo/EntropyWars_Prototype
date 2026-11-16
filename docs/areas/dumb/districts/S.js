/* THE D.U.M.B., district S · SUB-LEVEL 7 (6 plots: a cross in the middle of the base, the lowest level, 14 m under Level P3).
   One thread a file (docs/notes/claims.md). Read by `node bake-dumb.js`; rules: docs/notes/areas-complexes.md "THE D.U.M.B. ON PLOTS".
   THE PILOT DISTRICT of the zone (docs/plans/ZONE_THREAD_BRIEF.md step 7): its passes are in the notes, "THE D.U.M.B., SUB-LEVEL 7".
   BRIEF: "the level that does not exist": the stair says seven, the lift does not stop here. THE HUB in the middle with THE TOWER
   ("The tower has no stair." "How do they get up?" "They do not. That is what it is for."); every department is off this hub:
     south  THE STAIR (P03-04): the long flight down from Level P3's wired door, 14 m; two dead-end side rooms
     west   CHAMBERS 01 + 03 (P02-03): the spoke to Research's stair; 01 THE DROP north of it, 03 THE PIT south of it
     east   CHAMBERS 02 + 04 (P04-03): the spoke to the Vault Gantry's stair; 02 THE CATWALK north, 04 OBSERVATION south
     north  CORRIDOR FIVE (P03-02: "Five is the corridor. Five was always the corridor."): the Healing Zone; stairs up to the Range and
            the Comms Room; then LEVEL -6 (P03-01): rock cut square, the blast door to the Cavern (links.cave_dumb), the Vent's ladder
   STANDS TODAY: see the passes in the notes.
   PASS 1, THE STRUCTURE + THE LANDMARKS (11-16): THE TOWER's skin (panels, a hazard skirt, lit slits, a red band, a beacon), the hub's two
   steel galleries up their stairs, four hazard portals, the ways painted on the floor, four pillars, wall lamps; each chamber behind a wall
   with a long window; 01 THE DROP (the tier, its stair, the edge, the X); 03 THE PIT (1.75 m down, its stair, a rail on the rim, a red
   line of light at the bottom); 02 THE CATWALK (two towers, the plank, a stair, a ladder); 04 OBSERVATION (the deck behind a wall of
   round windows); Corridor Five's lane with two rooms west and four closets east; Level -6's rock, the blast door's collar; the Stair's
   level numbers, light slots and side-room doors.
   PASS 2, THE INSIDES + THE DRESSING (11-16, `dress`): the hub's duty desk, lockers and racks under the west gallery, stores under the
   east, the waiting corner, the board that watches the chambers, cameras on the galleries; 01's mattresses, dummy, camera and scale;
   03's rim kit (the pit stays empty); 02's mattresses, robot arm and bag; 04's one chair, its recorder, the observers' chairs; Corridor
   Five's DECON, ARMOURY, STORES, ELECTRICAL, LOCKERS, JANITOR (plain labels, mine); Level -6's guard post; the Stair's guard room and
   store. Seven more people (no lines yet): two professors, a flesheater in the pit, two androids, a mad scientist, a man in black.
   PASS 3, THE LIGHT + THE AIR + POLISH (11-16, `air()`): five real bulbs (of the base's ten); hanging dome lamps in the hub, the
   chambers and down the stair's hall; a duct and two pipes under every corridor's roof; the chambers' status lamps; lit window frames;
   steam off the Vent; stains on the floors (flicker tubes and DECON's steam cost a quarter of the frame rate and went). THREE PASSES LIVE: the district stops here until mondo has looked. */
'use strict';
const U = n => 'urban:' + n, CONC = U('ConcreteStriped1d'), GRILL = U('MetalSubwayGrill1a'), STEEL = U('MetalCorrugatedPainted3a'), HAZ = 0xe0b020, DARK = 0x2a2c30, RED = 0xff3020, INK = '#e8e4d0';
const WL = { h: 7, key: CONC, tint: 0xb4b8bc, gain: 1.9 };

/* ── the district's own pieces (plain functions on a kit room R) ── */
/* a hazard portal: two yellow posts with black bands and a lintel round an opening on a line (axis / at as R.wall), from a to b, H high */
function portal(R, axis, at, a, b, H, words, side) {
    const C = 3.5, L = (b - a) * C, mid = (a + b) / 2, P = (m, y, w, h, d, tint, x) => axis === 'u' ? R.box(m, at, y, w, h, d, null, tint, x) : R.box(at, m, y, d, h, w, null, tint, x);
    for (const m of [a + 0.06, b - 0.06]) { P(m, 0, 0.42, H, 0.5, HAZ); P(m, 0.5, 0.44, 0.3, 0.52, DARK, { n: Math.floor((H - 0.6) / 1.0), step: [0, 1.0, 0] }); }
    P(mid, H, L + 0.42, 0.5, 0.5, HAZ);
    if (words) { const off = (side || 1) * 0.27; if (axis === 'u') R.sign(words, mid, at + off / 3.5, H + 0.95, Math.min(L, words.length * 0.62), 0.8, side > 0 ? 0 : 180, INK, '', 'stencil', 0.35); else R.sign(words, at + off / 3.5, mid, H + 0.95, Math.min(L, words.length * 0.62), 0.8, side > 0 ? -90 : 90, INK, '', 'stencil', 0.35); }
}
/* words painted on the floor (ry: the way the words' top points: 0 north, 90 east) */
const floorWords = (R, words, u, v, w, d, ry, col) => R.part({ s: 'quad', flat: true, p: [R.X(u), 0.03, R.Z(v)], size: [w, d], ry: ry || 0, key: 'txt:' + words + '|' + (col || '#e0b020') + '||' + Math.round(w / d * 100) / 100 + '||stencil', uv: 'fit', kind: 'over' });
/* a painted line on the floor */
const line = (R, u, v, w, d, tint) => R.box(u, v, 0.012, w, 0.012, d, null, tint == null ? HAZ : tint);
/* a wall lamp: a caged bulkhead light on a wall face (drawn, glows) */
const wallLamp = (R, u, v, y, tint) => { R.box(u, v, y, 0.34, 0.2, 0.34, null, DARK); R.box(u, v, y - 0.08, 0.26, 0.1, 0.26, null, tint == null ? 0xfff0d0 : tint, { glow: 1 }); };

module.exports = {
    look: { wall: CONC, tint: 0xb4b8bc, band: HAZ, ceil: U('ConcreteStriped2e'), ceilTint: 0xb0b4b8, ceilGain: 2.0, light: 0xdfe8ff, every: 3 },
    looks: { 'P03-01': { wall: 'rocks_5', tint: 0xc8c2b8, gain: 2.6, band: null, ceil: 'rocks_5', ceilTint: 0x9a948a, ceilGain: 2.0, light: 0xffb060, every: 4 } },
    build(ctx) {
        const { C, r2, gcx, gcz, gx, gz, plot } = ctx, O = ctx.O;
        /* ══ THE HUB (P03-03): THE TOWER on its middle four squares, 10.5 m of concrete with no stair; a steel gallery along the east and
           west walls; a hazard portal to each department; the way to each painted on the floor ══ */
        { const R = ctx.room('P03-03', 1, 1, 10, 10, 'hub'), TH = 10.5;
          ctx.feat({ k: 'plateau', x: R.X(5), z: R.Z(5), w: 6.7, d: 6.7, h: TH, edge: 0.05 });   /* (a hand inside its skin: a plateau's foot slopes out) */ for (const q of [[4, 4], [5, 4], [4, 5], [5, 5]]) R.keep(q[0], q[1]);
          /* the tower's skin: concrete panels with a reveal every 3.5 m, a hazard skirt, slit windows that are lit, a red band and a beacon */
          for (const [du, dv, w, d, ry] of [[0, -1.008, 7.04, 0.06, 180], [0, 1.008, 7.04, 0.06, 0], [-1.008, 0, 0.06, 7.04, 90], [1.008, 0, 0.06, 7.04, -90]]) { const u = 5 + du, v = 5 + dv;
              R.box(u, v, 0, w, TH, d, CONC, 0xc4c8cc, { uv: [3.5, 1.75], gain: 1.9, top: false });
              R.box(u + du * 0.012, v + dv * 0.012, 0, w + (du ? 0.04 : 0.06), 1.2, d + (dv ? 0.04 : 0.06), null, HAZ, { top: false });
              R.box(u + du * 0.012, v + dv * 0.012, 0.3, w + (du ? 0.05 : 0.07), 0.2, d + (dv ? 0.05 : 0.07), null, DARK, { top: false, n: 3, step: [0, 0.35, 0] });
              for (const y of [3.5, 7.0]) R.box(u + du * 0.012, v + dv * 0.012, y, w + (du ? 0.03 : 0.05), 0.07, d + (dv ? 0.03 : 0.05), null, 0x6a6e74, { top: false });
              R.box(u + du * 0.014, v + dv * 0.014, 8.0, du ? 0.06 : 4.6, 0.55, dv ? 0.06 : 4.6, null, 0xfff2c0, { glow: 1, top: false });            // the slit: someone is up there
              R.box(u + du * 0.014, v + dv * 0.014, 9.6, w + (du ? 0.05 : 0.07), 0.4, d + (dv ? 0.05 : 0.07), null, RED, { glow: 1, top: false });
              R.sign('7', u + du * 0.02, v + dv * 0.02, 5.2, 1.6, 2.0, ry, INK, '', 'stencil', 0.3); }
          /* the plinth: the tower's first 3.6 m stand a pace proud of the shaft, hazard-banded */
          R.box(5, 5, 0, 8.1, 3.6, 8.1, CONC, 0xb8bcc0, { uv: [3.5, 1.75], gain: 1.9 });
          for (const [du, dv, w, d] of [[0, -1.16, 8.16, 0.05], [0, 1.16, 8.16, 0.05], [-1.16, 0, 0.05, 8.16], [1.16, 0, 0.05, 8.16]]) { R.box(5 + du, 5 + dv, 0, w, 1.0, d, null, HAZ, { top: false }); R.box(5 + du * 1.001, 5 + dv * 1.001, 0.25, w + 0.01, 0.18, d + 0.01, null, DARK, { top: false, n: 3, step: [0, 0.3, 0] }); R.box(5 + du, 5 + dv, 3.3, w, 0.3, d, null, HAZ, { top: false }); }
          R.box(5, 5, TH, 7.3, 0.25, 7.3, CONC, 0x9a9ea4, { gain: 1.6 }); R.box(5, 5, TH + 0.25, 1.0, 0.5, 1.0, null, DARK); R.box(5, 5, TH + 0.75, 0.5, 0.35, 0.5, null, RED, { glow: 1 });
          /* the floor: a hazard square round the tower's foot, the four ways */
          for (const [du, dv, w, d] of [[0, -1.5, 10.9, 0.3], [0, 1.5, 10.9, 0.3], [-1.5, 0, 0.3, 10.9], [1.5, 0, 0.3, 10.9]]) line(R, 5 + du, 5 + dv, w, d);
          floorWords(R, 'RESEARCH', 1.7, 5, 5.2, 1.1, 270); floorWords(R, 'COMMAND', 8.3, 5, 4.8, 1.1, 90); floorWords(R, 'LEVEL P3', 5, 8.4, 5.2, 1.1, 180); floorWords(R, 'LEVEL -6', 5, 1.6, 5.2, 1.1, 0);
          /* the four portals (each spoke's own roof is lower: the tool hangs the wall over them) */
          portal(R, 'u', 0, 3.5, 6.5, 4.4, 'CORRIDOR 5', 1); portal(R, 'u', 10, 3.5, 6.5, 4.4, 'STAIR · P3', -1); portal(R, 'v', 0, 3.5, 6.5, 3.2, null, 1); portal(R, 'v', 10, 3.5, 6.5, 3.2, null, -1); R.sign('RESEARCH', 1.08, 5, 5.0, 4.6, 0.8, -90, INK, '', 'stencil', 0.35); R.sign('COMMAND', 8.92, 5, 5.0, 4.4, 0.8, 90, INK, '', 'stencil', 0.35);
          /* the galleries: a steel deck 3.5 m up along the west and the east wall, a stair up each from the south */
          for (const [u0, u1, ug, su] of [[0, 1, 1, 0.5], [9, 10, 9, 9.5]]) { R.deck(u0, 0, u1, 7, 3.5, GRILL); R.guard('v', ug, 0, 7, 3.5, HAZ); R.stair(su, 10, su, 7, 1, 0, 3.5, 'steel'); R.guard('u', 7, u0, u1, 3.5, HAZ);
              for (let v = 0.5; v < 7; v += 2) R.box(ug === 1 ? 0.92 : 9.08, v, 0, 0.16, 3.5, 0.16, null, DARK); }
          /* four pillars (the catalogue's own: a hazard band and a bay number), wall lamps at the gallery's height */
          for (const q of [[2, 2], [7, 2], [2, 7], [7, 7]]) R.B('concrete_pillar', q[0], q[1], 0);
          for (const v of [1.5, 5, 8.5]) { wallLamp(R, 0.14, v, 5.6); wallLamp(R, 9.86, v, 5.6); } for (const u of [1.5, 8.5]) { wallLamp(R, u, 0.14, 5.6); wallLamp(R, u, 9.86, 5.6); }
          R.who('men in black', 6.5, 8.5, 250, ctx.sayOf(O.sublevel7, 'men in black')); R.done(); }

        /* ══ CHAMBERS 01 + 03 (P02-03): the west spoke between two test chambers, each behind a wall with a long window ══ */
        { const R = ctx.room('P02-03', 1, 1, 10, 10, 'ch13');
          R.wall('u', 4, 0, 10, Object.assign({ doors: [[8.5, 'leaf_security']], gaps: [[1, 6]] }, WL)); R.wall('u', 4, 1, 6, Object.assign({}, WL, { h: 1.0 })); R.wall('u', 4, 1, 6, Object.assign({}, WL, { y0: 3.2, h: 3.8, walk: false })); R.pane('u', 4, 1, 6, { y0: 1.0, h: 2.2 });
          R.wall('u', 7, 0, 10, Object.assign({ doors: [[1.5, 'leaf_security']], gaps: [[4, 9]] }, WL)); R.wall('u', 7, 4, 9, Object.assign({}, WL, { h: 1.0 })); R.wall('u', 7, 4, 9, Object.assign({}, WL, { y0: 3.2, h: 3.8, walk: false })); R.pane('u', 7, 4, 9, { y0: 1.0, h: 2.2 });
          R.sign('01', 8.5, 4.18, 3.3, 1.3, 1.0, 0, INK, '', 'stencil', 0.3); R.label('THE DROP', 8.5, 4.18, 0, 1.4); R.sign('03', 1.5, 6.82, 3.3, 1.3, 1.0, 180, INK, '', 'stencil', 0.3); R.label('THE PIT', 1.5, 6.82, 180, 1.2);
          line(R, 5, 4.35, 35, 0.16); line(R, 5, 6.65, 35, 0.16);
          /* 01 THE DROP: a tier 3.5 m up its stair; three sides railed, the fourth is the experiment */
          ctx.feat({ k: 'plateau', x: R.X(1.5) - 0.1, z: R.Z(2), w: 3 * C - 0.2, d: 4 * C, h: 3.5, edge: 0.05 }); R.stair(6, 0.5, 3, 0.5, 1, 0, 3.5, 'concrete'); for (let u = 0; u < 3; u++) for (let v = 0; v < 4; v++) R.keep(u, v);
          R.box(1.5, 2, 0, 3 * C + 0.06, 3.5, 4 * C + 0.06, CONC, 0xc4c8cc, { uv: [3.5, 1.75], gain: 1.9, top: false });
          R.box(2.96, 2.5, 3.5, 0.3, 0.02, 3 * C, null, HAZ); R.box(3.04, 2.5, 2.9, 0.06, 0.6, 3 * C, null, HAZ, { top: false }); R.box(3.05, 2.5, 3.05, 0.07, 0.15, 3 * C, null, DARK, { top: false, n: 2, step: [0, 0.25, 0] });
          R.guard('u', 4, 0, 3, 3.5, HAZ); R.guard('u', 1, 0, 3, 3.5, HAZ);
          floorWords(R, 'X', 4.2, 2.5, 2.2, 2.2, 90, '#ff3020'); line(R, 4.2, 2.5, 3.0, 0.1, RED); line(R, 4.2, 2.5, 0.1, 3.0, RED);
          R.who('mad scientist', 7.5, 2.5, 270, ctx.sayOf(O.sublevel7, 'mad scientist'));
          /* 03 THE PIT: 1.75 m down, a stair in at its east end, a rail round its rim that is ground on, a red line of light at the bottom */
          ctx.feat({ k: 'plateau', sink: true, x: R.X(5), z: R.Z(8.5), w: 6 * C, d: 2 * C, h: -1.75, edge: 0.1 }); R.stair(6, 8.5, 8, 8.5, 1, -1.75, 0, 'concrete');
          for (const [u, v, w, d] of [[5, 7.52, 6 * C, 0.08], [5, 9.48, 6 * C, 0.08], [2.02, 8.5, 0.08, 2 * C]]) { R.box(u, v, -1.7, w, 0.1, d, null, RED, { glow: 1 }); }
          ctx.feat({ k: 'wall', x0: R.X(2), z0: R.Z(7.5) - 0.2, x1: R.X(8), z1: R.Z(7.5) - 0.2, h: 0.5, t: 0.1, key: 'metal' }); ctx.feat({ k: 'wall', x0: R.X(2) - 0.2, z0: R.Z(7.5), x1: R.X(2) - 0.2, z1: R.Z(9.5), h: 0.5, t: 0.1, key: 'metal' });
          floorWords(R, 'DO NOT THINK ABOUT THE PIT', 5, 7.25, 9.0, 0.5, 0);
          R.who('telepath', 9.5, 7.5, 200, ctx.sayOf(O.sublevel7, 'telepath'));
          R.done(); }

        /* ══ CHAMBERS 02 + 04 (P04-03) ══ */
        { const R = ctx.room('P04-03', 1, 1, 10, 10, 'ch24');
          R.wall('u', 4, 0, 10, Object.assign({ doors: [[1.5, 'leaf_security']], gaps: [[4, 9]] }, WL)); R.wall('u', 4, 4, 9, Object.assign({}, WL, { h: 1.0 })); R.wall('u', 4, 4, 9, Object.assign({}, WL, { y0: 3.2, h: 3.8, walk: false })); R.pane('u', 4, 4, 9, { y0: 1.0, h: 2.2 });
          R.wall('u', 7, 0, 10, Object.assign({ doors: [[8.5, 'leaf_security']] }, WL));
          R.sign('02', 1.5, 4.18, 3.3, 1.3, 1.0, 0, INK, '', 'stencil', 0.3); R.label('THE CATWALK', 1.5, 4.18, 0, 1.7); R.sign('04', 8.5, 6.82, 3.3, 1.3, 1.0, 180, INK, '', 'stencil', 0.3); R.label('OBSERVATION', 8.5, 6.82, 180, 1.7);
          line(R, 5, 4.35, 35, 0.16); line(R, 5, 6.65, 35, 0.16);
          /* 02 THE CATWALK: two towers 3.5 m and the plank between them (rated for one); a stair up the west tower, a ladder down the east */
          for (const u of [3.5, 8.5]) { ctx.feat({ k: 'plateau', x: R.X(u), z: R.Z(1.5), w: C - 0.25, d: C - 0.25, h: 3.5, edge: 0.05 }); R.keep(u - 0.5, 1); R.box(u, 1.5, 0, C + 0.06, 3.5, C + 0.06, CONC, 0xc4c8cc, { uv: [3.5, 1.75], gain: 1.9, top: false }); R.box(u, 1.5, 3.5, C + 0.1, 0.03, C + 0.1, null, HAZ); }
          R.deck(4, 1.25, 8, 1.75, 3.5, STEEL); R.stair(0, 1.5, 3, 1.5, 1, 0, 3.5, 'steel');
          ctx.feat({ k: 'climb', x: r2(R.X(9) + 0.3), z: R.Z(1.5), face: 270, look: 'ladder' });
          R.sign('MAX LOAD: ONE', 6, 1.24, 3.05, 2.6, 0.32, 0, '#1c1c1c', '#e0b020');
          R.who('android', 6.5, 3.2, 0, ctx.sayOf(O.sublevel7, 'android'));
          /* 04 OBSERVATION: the deck along the south wall behind the round windows; the chamber it observes is empty */
          R.deck(0, 9, 8, 10, 3.5, GRILL); R.wall('u', 9, 0, 8, Object.assign({}, WL, { y0: 3.5, h: 3.5 })); R.stair(9.5, 9.5, 8, 9.5, 1, 0, 3.5, 'steel');
          for (const u of [1.5, 4, 6.5]) R.dec('observation_window', u, 8.94, 180, { y: 4.7 });
          for (let u = 0.5; u < 8; u += 2.5) R.box(u, 9.04, 0, 0.18, 3.5, 0.18, null, DARK);
          floorWords(R, 'KEEP CLEAR', 4, 8.2, 5.0, 0.7, 0); for (const [u, v, w, d] of [[4, 7.4, 21, 0.14], [4, 8.9, 21, 0.14], [1, 8.15, 0.14, 5.4], [7, 8.15, 0.14, 5.4]]) line(R, u, v, w, d);
          R.who('grey', 3.5, 9.5, 0, ctx.sayOf(O.sublevel7, 'grey')); ctx.npc[ctx.npc.length - 1].y = r2(plot['P04-03'].base + 3.5);
          R.done(); }

        /* ══ CORRIDOR FIVE (P03-02): the lane up the middle, the Healing Zone in it; rooms off it west, closets east ══ */
        { const hz = O.sublevel7.c.find(c => c.id === 'healzone'), s = ctx.sq('P03-02', 6, 9); if (hz) { ctx.counters.push(Object.assign({}, hz, { x: gcx(s[0]), z: gcz(s[1]), plateY: r2(plot['P03-02'].base + 2.35) })); ctx.taken.add(s[0] + ':' + s[1]); }
          const R = ctx.room('P03-02', 3, 0, 6, 12, 'five'), wl = Object.assign({}, WL, { h: 5.25 });
          R.wall('v', 2, 0, 5, Object.assign({ doors: [[2.5, 'leaf_security']] }, wl)); R.wall('v', 2, 8, 12, Object.assign({ doors: [[10, 'leaf_security']] }, wl));
          R.wall('v', 5, 0, 5, Object.assign({ doors: [[1.5, 'leaf_office'], [4, 'leaf_office']] }, wl)); R.wall('v', 5, 8, 12, Object.assign({ doors: [[9, 'leaf_office'], [11, 'leaf_office']] }, wl));
          R.wall('u', 5, 0, 2, wl); R.wall('u', 8, 0, 2, wl); R.wall('u', 5, 5, 6, wl); R.wall('u', 8, 5, 6, wl); R.wall('u', 3, 5, 6, wl); R.wall('u', 10, 5, 6, wl);
          R.sign('5', 2.18, 0.9, 2.3, 1.4, 1.8, -90, INK, '', 'stencil', 0.3); R.sign('5', 4.82, 11.1, 2.3, 1.4, 1.8, 90, INK, '', 'stencil', 0.3);
          line(R, 3.5, 6, 0.16, 42); floorWords(R, '5', 3.5, 3, 1.6, 2.2, 0); floorWords(R, '5', 3.5, 10.6, 1.6, 2.2, 180);
          portal(R, 'v', 0, 5, 8, 3.6, 'THE RANGE', 1); portal(R, 'v', 6, 5, 8, 3.6, 'COMMS', -1);
          for (const v of [1, 4, 9, 11]) { wallLamp(R, 2.16, v, 3.4); wallLamp(R, 4.84, v, 3.4); }
          R.done(); }

        /* ══ LEVEL -6 (P03-01): rock cut square, 19 m up to the Vent; the blast door's concrete collar; a guard post that faces it ══ */
        { const R = ctx.room('P03-01', 2, 2, 8, 8, 'minus6');
          /* the collar round the link's own door on the west wall (the room's square 0, 4) */
          for (const dv of [-1.05, 1.05]) R.box(0.12, 4.5 + dv / 3.5 * 3.5 / 3.5 * 1, 0, 0.5, 4.4, 0.6, CONC, 0xc4c8cc, { gain: 1.9 }); R.box(0.12, 4.5, 4.0, 0.5, 0.9, 4.4, CONC, 0xc4c8cc, { gain: 1.9 });
          R.box(0.4, 4.5, 4.05, 0.06, 0.5, 4.2, null, HAZ, { glow: 0.3 }); R.sign('LEVEL -6', 0.46, 4.5, 4.3, 3.2, 0.42, -90, '#1c1c1c', '', 'stencil');
          R.sign('THE CAVERN', 0.1, 4.5, 5.6, 4.0, 0.8, -90, INK, '', 'stencil', 0.4);
          floorWords(R, 'STAND CLEAR', 2.2, 4.5, 4.4, 0.8, 90); for (const v of [3.2, 5.8]) line(R, 1.8, v, 10.5, 0.16);
          /* the Vent's foot: hazard hoops up the shaft's first metres */
          R.sign('THE VENT', 4.5, -1.9, 3.2, 2.6, 0.6, 0, INK, '', 'stencil', 0.4);
          for (const [u, v] of [[0.14, 1.5], [0.14, 7], [7.86, 2], [7.86, 6], [3, 7.86], [5.5, 7.86]]) wallLamp(R, u, v, 3.6, 0xffb060);
          R.done(); }

        /* ══ THE STAIR (P03-04): the level numbers down the hall's walls, lamps that follow the flight, the two side rooms' doors ══ */
        { const R = ctx.room('P03-04', 3, 0, 6, 12, 'stair'), wl = Object.assign({}, WL, { h: 4.0 });
          /* the flight comes down from the south line (v 12, 14 m) to v 6 (0 m): a number every 3.5 m of height */
          [['2', 11.0], ['3', 9.9], ['4', 8.8], ['5', 7.7], ['6', 6.6]].map(q => [q[0], q[1], r2(14 * (q[1] - 6) / 6)]).forEach(q => { R.sign(q[0], 0.08, q[1], q[2] + 1.8, 2.0, 2.6, -90, INK, '', 'stencil', 0.4); R.sign(q[0], 5.92, q[1], q[2] + 1.8, 2.0, 2.6, 90, INK, '', 'stencil', 0.4);
              for (const u of [0.1, 5.9]) R.box(u, q[1] - 0.45, q[2] + 0.4, 0.1, 5.0, 0.22, null, 0xdfe8ff, { glow: 1 }); wallLamp(R, 0.16, q[1] + 0.6, q[2] + 2.6); wallLamp(R, 5.84, q[1] + 0.6, q[2] + 2.6); });
          R.sign('SUB-LEVEL 7', 3, 0.3, 5.6, 6.0, 1.0, 0, INK, '', 'stencil', 0.35); floorWords(R, '7', 3, 3.6, 3.4, 4.4, 180);
          for (const u of [1.02, 4.98]) R.box(u, 2.9, 0.012, 0.16, 0.012, 20, null, HAZ);
          R.wall('v', 0, 2, 6, Object.assign({ doors: [[4, 'leaf_security']] }, wl)); R.wall('v', 6, 2, 6, Object.assign({ doors: [[4, 'leaf_security']] }, wl));
          R.done(); }
    },
    /* PASS 2, THE INSIDES + THE DRESSING: what stands in every room (the FITS list in the notes; packs first, the heavy Meshy pieces once). */
    dress(ctx) {
        const { r2, plot } = ctx, UP = 3.5, nb = { noBlock: true };
        /* ── THE HUB ── */
        { const R = ctx.room('P03-03', 1, 1, 10, 10, 'hub2');
          /* under the west gallery: lockers; under the east: what came down the stair on a pallet jack */
          for (const v of [0, 1, 2]) R.B('office_locker', 0, v, 90); R.dec('riot_gear_rack', 0.22, 4.5, 90); R.keep(0, 4); R.dec('scba_rack', 0.22, 5.5, 90); R.keep(0, 5);
          R.B('wrapped_pallet', 9, 0, 0); R.dec('gas_cylinder_rack', 9.78, 1.5, 270); R.keep(9, 1); R.B('cable_drum', 9, 3, 0); R.B('psx_metal_barrel_mp_1', 9, 5, 0); R.dec('pallet_jack', 8.5, 0.6, 200, nb); R.dec('psx_supply_crate_1', 8.6, 1.6, 20, nb); R.dec('psx_supply_crate_1', 8.5, 1.5, 70, { y: 0.4, noBlock: true });
          /* the north-west corner: the duty desk; the north-east: where you wait to be told there is no level seven */
          R.B('tanker_desk', 1, 0, 180); R.dec('computer_chair_grey', 1.5, 0.35, 0); R.dec('psx_pc_monitor_mp_1', 1.3, 0.75, 180, { y: 0.78 }); R.dec('psx_pc_keyboard_mp_1', 1.6, 0.9, 180, { y: 0.78 }); R.dec('clipboard_flat', 1.85, 0.7, 30, { y: 0.78 }); R.hung('key_rack', 2.5, 0.06, 0, 1.5); R.hung('punch_clock', 3.4, 0.06, 0, 1.4); R.hung('wall_clock', 1.5, 0.06, 0, 3.0);
          R.dec('vending_machine', 8.5, 0.22, 0); R.keep(8, 0); R.B('metro_bin', 7, 0, 0); for (const u of [6.2, 6.8, 7.4]) R.dec('molded_chair', u, 1.4, 180, nb); R.hung('notice_board', 6.6, 0.06, 0, 1.6); R.dec('meshy_water_cooler', 8.7, 1.5, 270, nb);
          /* the south side: the board that watches the chambers, a barricade by the stair's portal */
          R.dec('retro_control_panel', 2.5, 9.78, 180); R.keep(2, 9); R.dec('monitor_stack', 3.5, 9.78, 180); R.keep(3, 9); R.hung('gauge_board', 1.5, 9.94, 180, 1.9); R.dec('computer_chair_grey', 2.6, 8.4, 20, nb);
          R.B('item_police_barricade', 7, 9, 0); R.B('traffic_barrel', 8, 9, 0); R.dec('traffic_cone', 6.6, 8.5, 0, nb);
          /* on the galleries: a camera on the tower, a chair for whoever watches it */
          R.dec('film_camera', 0.5, 3.5, 90, { y: UP, noBlock: true }); R.dec('molded_chair', 0.5, 1.5, 90, { y: UP, noBlock: true }); R.dec('studio_camera', 9.5, 2.5, 270, { y: UP, noBlock: true }); R.dec('molded_chair', 9.5, 5.5, 270, { y: UP, noBlock: true }); R.dec('clipboard_flat', 9.4, 5.9, 0, { y: UP + 0.02, noBlock: true });
          for (const q of [[3.3, 0.06, 0], [6.7, 9.94, 180]]) R.dec('evac_button', q[0], q[1], q[2], { y: 1.3, noLight: true }); R.hung('fire_extinguisher', 3.2, 9.94, 180, 1.0); R.hung('exit_sign', 5, 9.9, 180, 5.4); R.dec('floor_stain', 3.5, 6.5, 0, nb); R.dec('floor_stain', 6.4, 2.6, 0, nb);
          R.who('professor', 6.5, 2.5, 200); R.done(); }
        /* ── CHAMBERS 01 + 03 ── */
        { const R = ctx.room('P02-03', 1, 1, 10, 10, 'ch13b');
          /* 01: what the subject lands on, who films it, who weighs what is left */
          for (const q of [[3.6, 1.6, 10], [4.4, 2.6, 80], [3.7, 3.3, 30]]) R.dec('psx_old_mattress_mp_1', q[0], q[1], q[2], nb);
          R.dec('wing_chun_dummy', 2.5, 2.5, 90, { y: UP, noBlock: true }); R.B('film_camera', 6, 2, 270); R.B('studio_light', 6, 3, 300, { noLight: true }); R.B('platform_scale', 9, 0, 0); R.B('tanker_desk', 8, 2, 270, { nv: 1 }); R.dec('computer_chair_grey', 9.3, 2.5, 270, nb); R.dec('clipboard_flat', 8.5, 2.3, 40, { y: 0.78 }); R.dec('psx_dosimeter_1', 8.4, 2.8, 0, { y: 0.78 });
          R.hung('notice_board', 7.5, 0.06, 0, 1.6); R.hung('wall_clock', 5, 0.06, 0, 3.2); R.B('hw_body', 7, 3, 20); R.dec('floor_stain', 4.3, 2.2, 0, nb);
          /* 03: the rim's kit. The pit is left empty: it is a very good pit */
          R.dec('scba_rack', 0.22, 7.5, 90); R.keep(0, 7); R.dec('hose_rack', 0.22, 9.5, 90); R.keep(0, 9); R.B('studio_light', 9, 9, 250, { noLight: true }); R.dec('warning_tape', 8.6, 8.5, 90, nb); R.dec('psx_flashlight_1', 1.6, 7.3, 40, nb); R.hung('radiation_sign', 9.94, 7.5, 270, 1.7);
          R.who('flesheater', 3.5, 8.5, 90); ctx.npc[ctx.npc.length - 1].y = r2(plot['P02-03'].base - 1.75);
          R.done(); }
        /* ── CHAMBERS 02 + 04 ── */
        { const R = ctx.room('P04-03', 1, 1, 10, 10, 'ch24b');
          /* 02: under the plank */
          for (const q of [[5, 1.5, 0], [6, 1.6, 90], [7, 1.4, 10]]) R.dec('psx_old_mattress_mp_1', q[0], q[1], q[2], nb);
          R.B('robot_arm', 6, 3, 0); R.B('maintenance_stairs', 9, 3, 270); R.dec('tool_chest', 9.78, 0.5, 270); R.keep(9, 0); R.hung('gauge_board', 6, 0.06, 0, 1.8); R.B('psx_metal_barrel_mp_1', 0, 3, 0); R.B('punching_bag', 4, 3, 0); R.dec('floor_stain', 6.5, 2.4, 0, nb);
          /* 04: the chair the chamber is observed with; the recorder; the observers' own chairs up on the deck */
          R.B('molded_chair', 4, 8, 180); R.B('studio_light', 7, 7, 220, { noLight: true }); R.dec('reel_to_reel', 9.78, 7.5, 270); R.keep(9, 7);
          for (const u of [1.5, 4, 6.5]) R.dec('molded_chair', u, 9.6, 0, { y: UP, noBlock: true }); R.dec('clipboard_flat', 2.4, 9.6, 0, { y: UP + 0.02, noBlock: true }); R.dec('psx_handheld_tablet_1', 5, 9.6, 30, { y: UP + 0.02, noBlock: true });
          R.who('professor', 6.5, 9.5, 0); ctx.npc[ctx.npc.length - 1].y = r2(plot['P04-03'].base + UP);
          R.done(); }
        /* ── CORRIDOR FIVE: DECON and the ARMOURY west, four closets east (plain labels, mine) ── */
        { const R = ctx.room('P03-02', 3, 0, 6, 12, 'five2');
          R.dec('shower_stall', 0.5, 0.22, 0); R.keep(0, 0); R.dec('shower_stall', 1.5, 0.22, 0); R.keep(1, 0); R.dec('scba_rack', 0.22, 2.5, 90); R.keep(0, 2); R.dec('turnout_gear_rack', 0.22, 3.5, 90); R.keep(0, 3); R.dec('mop_bucket', 1.5, 4.4, 30, nb); R.dec('floor_drain', 1.2, 1.5, 0, nb); R.hung('hose_rack', 1.94, 1.2, 270, 1.0); R.label('DECON', 2.18, 2.5, -90, 1.1);
          R.dec('rifle_rack', 0.22, 8.5, 90); R.keep(0, 8); R.dec('riot_gear_rack', 0.22, 10.5, 90); R.keep(0, 10); R.B('footlocker', 1, 11, 0); R.dec('psx_supply_crate_1', 1.5, 8.5, 20, nb); R.dec('psx_ammo_box_1', 1.4, 9.4, 0, nb); R.dec('psx_ammo_box_1', 1.6, 9.5, 40, nb); R.dec('psx_police_baton_mp_1', 1.3, 10.6, 60, nb); R.label('ARMOURY', 2.18, 10, -90, 1.3);
          R.dec('metal_shelving', 5.78, 0.5, 270); R.keep(5, 0); R.dec('psx_supply_crate_1', 5.5, 2.4, 0, nb); R.label('STORES', 4.82, 1.5, 90, 1.1);
          R.dec('breaker_panel', 5.94, 4, 270, { y: 1.5 }); R.dec('utility_box', 5.78, 3.5, 270); R.keep(5, 3); R.label('ELECTRICAL', 4.82, 4, 90, 1.6);
          R.dec('locker', 5.78, 8.5, 270); R.keep(5, 8); R.dec('locker', 5.7, 9.6, 270, nb); R.label('LOCKERS', 4.82, 9, 90, 1.2);
          R.dec('mop_bucket', 5.5, 10.5, 0, nb); R.dec('trash_bin', 5.6, 11.5, 0, nb); R.dec('wet_floor_sign', 5.3, 11.0, 30, nb); R.label('JANITOR', 4.82, 11, 90, 1.2);
          R.hung('fire_extinguisher', 2.06, 4.5, 90, 1.0); R.hung('exit_sign', 3.5, 0.06, 0, 3.4); R.hung('notice_board', 4.94, 2.6, 270, 1.6);
          R.who('android', 4.5, 6.5, 270); R.who('mad scientist', 1.5, 1.5, 90); R.done(); }
        /* ── LEVEL -6: the guard post that faces the blast door ── */
        { const R = ctx.room('P03-01', 2, 2, 8, 8, 'minus6b');
          R.B('meshy_sandbags', 3, 3, 90); R.B('meshy_sandbags', 3, 5, 90); R.B('item_police_barricade', 4, 2, 0); R.B('footlocker', 5, 4, 90); R.dec('field_radio', 5.5, 4.5, 270, { y: 0.42 }); R.dec('psx_walkie_talkie_1', 5.4, 4.2, 30, { y: 0.42 });
          R.B('psx_metal_barrel_mp_1', 7, 0, 0); R.B('psx_metal_barrel_mp_2', 7, 1, 0); R.B('cable_drum', 6, 7, 0); R.dec('gas_cylinder_rack', 0.22, 7.5, 90); R.keep(0, 7); for (const q of [[1.4, 1.4], [1.8, 1.7], [6.5, 6.3]]) R.dec('cinder_block', q[0], q[1], 30, nb);
          R.dec('security_camera', 0.3, 2.5, 60, { y: 4.6 }); R.hung('radiation_sign', 0.06, 2.5, 90, 1.7); R.dec('psx_flashlight_1', 4.5, 5.4, 100, nb); R.dec('floor_stain', 2.5, 4.4, 0, nb);
          R.who('men in black', 4.5, 4.5, 270); R.done(); }
        /* ── THE STAIR: the guard room west of the foot, the store east of it ── */
        { const R = ctx.room('P03-04', 3, 0, 6, 12, 'stair2');
          R.B('tanker_desk', -2, 2, 0); R.dec('computer_chair_grey', -1.5, 3.3, 180, nb); R.dec('psx_pc_monitor_mp_1', -1.4, 2.6, 0, { y: 0.78 }); R.hung('key_rack', -1, 2.06, 0, 1.5); R.dec('office_locker', -1.78, 5.5, 90); R.keep(-2, 5); R.dec('office_locker', -1.78, 4.5, 90); R.keep(-2, 4); R.hung('punch_clock', -0.06, 2.6, 270, 1.4);
          R.B('wrapped_pallet', 7, 2, 0); R.dec('metal_shelving', 7.5, 5.78, 180); R.keep(7, 5); R.dec('hand_truck', 6.6, 3.6, 120, nb); R.dec('psx_supply_crate_1', 7.5, 3.4, 10, nb); R.dec('psx_supply_crate_1', 6.5, 5.2, 60, nb);
          R.label('GUARD', -0.18, 4, 90, 1.0); R.label('STORE', 6.18, 4, -90, 1.0); R.hung('exit_sign', 3, 0.3, 0, 4.4);
          R.B('item_police_barricade', 0, 9, 0); R.B('item_police_barricade', 5, 9, 0); R.B('traffic_barrel', 0, 7, 0); R.B('traffic_barrel', 5, 7, 0);
          R.who('android', 4.5, 2.5, 180); R.done(); }
        air(ctx);
    },
};

/* PASS 3, THE LIGHT + THE AIR + POLISH (called at the end of `dress`). Light is the look down here and the base has ten REAL lights in
   all: this district takes five (`bare_bulb`, a 7 m pool each: the hub's two, the pit's, Level -6's, the stair's foot); everything else is
   drawn: hanging dome lamps, ducts and pipes under the roofs, status lamps, window frames that glow, steam, stains on the floor. */
function air(ctx) {
    const { r2, plot } = ctx, WHITE = 0xdfe8ff, AMBER = 0xffb060;
    /* a run of services under a roof: a duct and two pipes on hangers (axis 'u' = they run west-east at v, 'v' = north-south at u) */
    const services = (R, axis, at, a, b, y) => { const L = (b - a) * 3.5, m = (a + b) / 2, B = (off, w, h, tint, key) => axis === 'u' ? R.box(m, at + off / 3.5, y - h, L, h, w, key || null, tint) : R.box(at + off / 3.5, m, y - h, w, h, L, key || null, tint);
        B(0, 0.7, 0.45, 0x9aa0a6, STEEL); B(0.62, 0.14, 0.14, HAZ); B(0.84, 0.14, 0.14, 0xb03020);
        for (let t = a + 0.5; t < b; t += 2) { if (axis === 'u') R.box(t, at + 0.2 / 3.5, y - 0.5, 0.06, 0.5, 1.4, null, DARK); else R.box(at + 0.2 / 3.5, t, y - 0.5, 1.4, 0.5, 0.06, null, DARK); } };
    /* a dome lamp on a long rod (drawn: it glows) */
    const dome = (R, u, v, top, drop, tint) => { R.box(u, v, top - drop, 0.05, drop, 0.05, null, DARK); R.cyl(u, v, top - drop - 0.35, 0.55, 0.35, null, 0x24402c, { r2: 0.18, seg: 10 }); R.cyl(u, v, top - drop - 0.4, 0.42, 0.06, null, tint == null ? 0xfff0d0 : tint, { glow: 1, seg: 10 }); };
    /* a window's lit frame on a wall line (the chambers' long windows) */
    const frame = (R, at, a, b, side) => { const m = (a + b) / 2, L = (b - a) * 3.5, v = at + side * 0.17 / 3.5; R.box(m, v, 0.96, L, 0.05, 0.04, null, WHITE, { glow: 1 }); R.box(m, v, 3.2, L, 0.05, 0.04, null, WHITE, { glow: 1 }); };
    /* ── THE HUB ── */
    { const R = ctx.room('P03-03', 1, 1, 10, 10, 'hub3'), top = 12.25;
      for (const q of [[2.5, 2.5], [7.5, 2.5], [2.5, 7.5], [7.5, 7.5], [5, 1.5], [5, 8.5], [1.8, 5], [8.2, 5]]) dome(R, q[0], q[1], top, 3.4);
      R.bulb(2.5, 5, 6.0); R.bulb(7.5, 5, 6.0);
      /* the chambers' status on the south wall, over the board: two in use, two not */
      [['01', 0x40ff70], ['02', 0x40ff70], ['03', 0xff3020], ['04', 0xff3020]].forEach((q, i) => { const u = 1.6 + i * 0.5; R.box(u, 9.9, 3.1, 0.34, 0.34, 0.08, null, q[1], { glow: 1 }); R.sign(q[0], u, 9.86, 3.62, 0.36, 0.24, 180, INK, '#1c1e22'); });
      services(R, 'u', 0.6, 1, 9, 6.8); services(R, 'u', 9.4, 1, 9, 6.8);
      ctx.grime('oil', 'P03-03', 9, 3, 1.3); ctx.grime('grime', 'P03-03', 3, 8, 1.6); ctx.grime('grime', 'P03-03', 7, 4, 1.2);
      R.done(); }
    /* ── THE SPOKES: services down each corridor, lit window frames ── */
    for (const id of ['P02-03', 'P04-03']) { const R = ctx.room(id, 1, 1, 10, 10, 'spoke3:' + id), west = id === 'P02-03';
      services(R, 'u', 4.5, -1, 11, 6.6);
      if (west) { frame(R, 4, 1, 6, 1); frame(R, 7, 4, 9, -1); } else frame(R, 4, 4, 9, 1);
      R.hung('exit_sign', west ? 0.4 : 9.6, 4.06, 0, 2.9);
      R.done(); }
    { const R = ctx.room('P02-03', 1, 1, 10, 10, 'ch13c');
      R.bulb(5, 8.5, 5.0);                                                                                       // the pit's own light
      ctx.grime('blood', 'P02-03', 5, 3, 1.5); ctx.grime('scorch', 'P02-03', 5, 4, 0.9); ctx.grime('grime', 'P02-03', 9, 6, 1.4);
      for (const u of [1, 3, 5, 7, 9]) dome(R, u, 2, 7, 1.2);
      R.done(); }
    { const R = ctx.room('P04-03', 1, 1, 10, 10, 'ch24c');
      ctx.grime('oil', 'P04-03', 7, 4, 1.4); ctx.grime('grime', 'P04-03', 3, 6, 1.4); ctx.grime('scorch', 'P04-03', 5, 9, 0.8);
      for (const u of [1.5, 5, 8.5]) dome(R, u, 2.6, 7, 1.2); dome(R, 4.5, 8.2, 7, 2.6, 0xffffff);                // one hard lamp over the chair
      R.done(); }
    /* ── CORRIDOR FIVE ── */
    { const R = ctx.room('P03-02', 3, 0, 6, 12, 'five3');
      services(R, 'v', 3.5, 0, 12, 5.1);
      ctx.grime('puddle', 'P03-02', 4, 1, 1.2); ctx.grime('puddle', 'P03-02', 3, 3, 0.9); ctx.grime('grime', 'P03-02', 6, 4, 1.3); ctx.grime('grime', 'P03-02', 7, 10, 1.1);
      R.done(); }
    /* ── LEVEL -6: steam off the Vent, a pool of light before the blast door, scorch on its sill ── */
    { const R = ctx.room('P03-01', 2, 2, 8, 8, 'minus6c'), B = plot['P03-01'].base;
      R.bulb(1.6, 4.5, 4.6);
      for (const q of [[3.6, -1.4, 4, 9], [5.2, -1.0, 9, 9]]) ctx.props.push({ key: 'chimney_smoke', x: R.X(q[0]), z: R.Z(q[1]), y: r2(B + q[2]), rise: q[3] });
      for (const y of [6, 10, 14]) R.box(4.5, -1.96, y, 3.4, 0.12, 0.06, null, AMBER, { glow: 1 });                  // the shaft's rungs of light, going up
      ctx.grime('scorch', 'P03-01', 3, 6, 1.4); ctx.grime('puddle', 'P03-01', 7, 8, 1.2); ctx.grime('grime', 'P03-01', 6, 4, 1.5);
      R.done(); }
    /* ── THE STAIR: a pool of light at the foot, chevrons where the flight lands ── */
    { const R = ctx.room('P03-04', 3, 0, 6, 12, 'stair3');
      R.bulb(3, 5, 5.5);
      for (let i = 0; i < 6; i++) R.box(1.6 + i * 0.56, 5.8, 0.013, 0.9, 0.012, 0.3, null, i % 2 ? DARK : HAZ, { ry: 30 });
      for (const q of [[1, 1.5], [5, 1.5], [3, 3.2]]) dome(R, q[0], q[1], 21, 15.2);
      ctx.grime('grime', 'P03-04', 6, 5, 1.6); ctx.grime('oil', 'P03-04', 4, 2, 1.0);
      R.done(); }
}
