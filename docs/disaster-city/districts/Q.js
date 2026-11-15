/* DISASTER CITY · THE HARBOUR QUAY (file Q: no district of its own) — 2026-11-15, THE DISTRICT MOVE (mondo: "the districts along the coast
   should be industrial, bayside, and entertainment"; his OK on the drawn plan, "Build it as drawn": "the new heights, crossings, edges, beach
   and harbour"). Industrial is the south-east block now, so the sea that lies off Bayside runs on south along it: a concrete quay three
   squares wide (cx 144-146) down Industrial's whole east side (cy 96-143), deep water from its edge to the room's east edge. The quay is one
   height with the port (levels.js: the city's east column is 0 from row 8 down) and with Bayside's boardwalk, whose grill deck it meets at
   its north end. Two ways onto it out of Industrial (move.js `ways`): the Aerospace lab's walk (cy 113-114) and the Rail service road
   (cy 135-140); both stay clear.
   Repo tooling only: `node bake-disaster-city.js` loads this file with the district files. It has no entry in move.js `frame`, so it runs in
   the CITY's own squares (not a district's home squares): cx west to east, cy north to south, one square = 3.5 m, gx(c) = a square LINE.
   PROP PLACEMENT (mondo 11-13): the containers are blockers, each fills two whole squares of the city-side column (cx 144); the crane fills
   one square of the water-side column (cx 146); the middle column (cx 145) is the walk, a whole square wide, nothing on it. The small
   pieces are decor, off centre. Every piece is a catalogue prop the city already draws: no new model, no new sheet. */
'use strict';
const EAST = 20, DEEP = -3.6;
const Q = { x0: 144, x1: 147, y0: 96, y1: 144 };
const WAYS = [[112, 116], [134, 141]];   // the squares kept clear in front of the two ways out of Industrial (a square more each side)
const room = { backdropOpen: [[60, 250, 400, 400]] };   // no skyline tower stands in the bay south of the port

function apply(ctx) {
    const { paintCell } = ctx;
    for (let cy = Q.y0; cy < Q.y1; cy++) for (let cx = Q.x0; cx < 144 + EAST; cx++) paintCell(cx, cy, cx < Q.x1 ? 'urban:ConcreteStriped2a' : 'desert');   // the apron; the bay's floor is sand like Bayside's
}

function build(ctx) {
    const { lateRows, props, gx, gc, r3 } = ctx;
    const XE = gx(144 + EAST), Z0 = gx(Q.y0), Z1 = ctx.HALF;
    const rect = (x0, z0, x1, z1, h, o) => lateRows.push(Object.assign({ k: 'plateau', x: r3((x0 + x1) / 2), z: r3((z0 + z1) / 2), w: r3(x1 - x0), d: r3(z1 - z0), h, absY: true }, o));
    /* the strip is first cut flat to the quay's height (Bayside's own cut ends 2 m south of its last plot: the two overlap), then the water */
    rect(gx(144) + 0.4, Z0 + 1.5, XE + 2, Z1 + 2, 0, { id: 'dc:quay:flat', sink: true, edge: 0.3 });
    rect(gx(Q.x1), Z0 + 1.6, XE + 2, Z1 + 2, DEEP, { id: 'dc:quay:water', sink: true, edge: 0.4 });
    const clear = cy => !WAYS.some(w => cy >= w[0] && cy < w[1]);
    const n = { containers: 0, cranes: 0, small: 0 };
    const P = (key, x, z, face, o) => props.push(Object.assign({ key, x: r3(x), z: r3(z), face }, o || {}));
    /* the container line: a stack every four squares on the city side, two or three high, one colour run broken by a gap at each way */
    for (let cy = Q.y0 + 3, k = 0; cy + 2 <= Q.y1 - 1; cy += 4, k++) {
        if (!clear(cy) || !clear(cy + 1)) continue;
        const hi = 1 + (k * 7 + 3) % 3;
        for (let l = 0; l < hi; l++) { P('ind_container', gc(144), gx(cy + 1), 0, l ? { y: r3(l * 2.15) } : null); n.containers++; }
    }
    /* the cranes on the water side, a forklift and its pallets by each */
    [101, 122, 129].forEach((cy, i) => {
        P('babel_crane', gc(146), gc(cy), 90); n.cranes++;
        P('forklift', gc(146), gc(cy + 3), i % 2 ? 180 : 0); P('wrapped_pallet', gc(146), gc(cy - 2), 0); P('wrapped_pallet', gc(146), gc(cy - 3), 90); n.small += 3;
    });
    /* the dockside's small things, off centre along the water's edge */
    [[98, 'cable_drum'], [105, 'traffic_barrel'], [108, 'pallet_jack'], [110, 'cable_drum'], [118, 'traffic_barrel'], [119, 'cable_drum'], [126, 'pallet_jack'], [132, 'traffic_barrel'], [142, 'cable_drum']].forEach((q, i) => {
        if (!clear(q[0])) return; P(q[1], gx(147) - 0.75 - (i % 3) * 0.2, gc(q[0]) + (i % 2 ? 0.6 : -0.5), (i * 70) % 360); n.small++; });
    console.warn('[quay]', JSON.stringify(n));
}

module.exports = { room, apply, build };
