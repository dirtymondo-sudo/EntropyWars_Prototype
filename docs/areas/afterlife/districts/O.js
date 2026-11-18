/* THE VATICAN · O · THE COLOSSEUM (9 plots: columns 1-3, rows 0-2 of room `site_prebuilt_vatican_plots`, sx 12-47, sy 0-35; the map's
   district `col`, world plots -11..-9 x -9..-7, straight north of the Vatican under Mount Olympus). One thread a file
   (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js. NOTE: this district builds AFTER the Vatican's One World move, so its
   squares are the MOVED room's (the other Vatican files still build in the home frame, 36 squares further north).

   THE REDESIGN (2026-11-18, mondo: "improve the coliseum to be more realistic and epic, it looks like absolute shit currently. plan and design
   and build it like an actual architect would"). What was wrong with the first build: arches made of boxes (every one turned the wrong way), a
   wall one stone thick with the sky through it, stands 5 m tall behind a 23 m wall, a scaled ellipse for a plan, a mud tint.

   THE PLAN is a FOUR-CENTRE OVAL, as the Roman surveyors set an amphitheatre out: two small arcs at the ends of the long axis (radius 9 m at the
   arena's edge), two big arcs along the sides (34.4 m), meeting on one tangent. Every ring of the building is then the same distance from the
   arena all the way round, and one SECTION carried round the plan is the whole building. The arena is 52.5 x 31.5 m; the outer wall's face
   stands 28 m out from its edge (108.5 x 87.5 m: the first build's footprint). 64 bays round it: 60 of 4.63 m and a 7.6 m gate bay on each axis.

   THE SECTION, outward from the arena's edge (d, metres) and up (y):
     d  0.0 -  3.5   the PODIUM: the arena's wall (3.5 m) and the terrace on it, a marble parapet at its lip
     d  3.5 - 10.5   the LOWER SEATS: 8 rows, 0.875 m a tread, 0.5 m a rise (4.0 ... 7.5 m)
     d 10.5 - 13.1   the WALK (8.0 m): the ring between the two banks; the four stairs from the ground come up onto it
     d 13.1 - 21.0   the UPPER SEATS: 9 rows, 0.6 m a rise (8.6 ... 13.4 m): steeper, as the real upper bank was
     d 21.0 - 28.0   the GALLERY (14.0 m): a floor 7 m deep under a roof, a colonnade toward the arena, the third storey's arches outward
     d 23.5 - 25.8   the RING CORRIDOR on the ground behind the facade's arches (vaulted; the same corridor again on the second storey, drawn)
     d 25.8 - 28.0   the FACADE: three storeys of round arches (7 m each) between half columns (plain, scrolled, leafed: the three orders),
                     an entablature a storey; the ATTIC over them (21 - 28.5 m) with pilasters, windows and the awning's masts; the AWNING.
   Everything a walker stands on is a row he really stands on: the rows of seats are tier walls (a step up each: data.js THE STANDS), the
   gallery's outer half and the rows over a tunnel are bridges, the four stairs are ramps. The map's ground under the building is flat.

   THE FOUR GATES: a vaulted tunnel 6 m wide on each axis, plaza to sand (the Gate of Life north, the Gate of Death south: labels mine). Over each
   tunnel's mouth on the sand a platform at 6 m, reached from the fifth row; the north and south ones are boxes under a canopy (a throne each).
   A porch stands before the north and the south gate, a chariot on each. THE FOUR STAIRS (the vomitoria) climb from the ring corridor, in
   bays 8, 24, 40 and 56 (the diagonals), up through the upper seats onto the walk.
   THE PEOPLE (2026-11-18): the Pope sits on the south throne, a small crowd sits and stands in the seats (the room's crowd cap is the game's own:
   data.js HQ_CROWD_RULES.areaMax, one body a race), the north throne is the walker's to sit in (E).
   STILL TO DO: the rooms under the sand (the hypogeum) and its lifts; the second storey walked. */
'use strict';
const TAU = Math.PI * 2, r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const CX = 30, CY = 16;                                   // the oval's middle: a square corner of the moved room
const OV = { a: 26.25, b: 15.75, r1: 9, out: 28 };        // = draw-afterlife.js COL_OVAL: the arena's half axes, the small arcs' radius, the facade's distance out
const R2 = (OV.a * OV.a - 2 * OV.a * OV.r1 + OV.b * OV.b) / (2 * (OV.b - OV.r1)), C1 = OV.a - OV.r1, C2 = R2 - OV.b, PHI = Math.atan2(C2, C1);
/* a point of the oval by the angle of its NORMAL (0 = east, a quarter turn = south): the arc it lies on [centre x, centre z, radius at the arena's edge] */
const arcOf = th => { const t = ((th % TAU) + TAU) % TAU; return (t <= PHI || t >= TAU - PHI) ? [C1, 0, OV.r1] : t < Math.PI - PHI ? [0, -C2, R2] : t <= Math.PI + PHI ? [-C1, 0, OV.r1] : [0, C2, R2]; };
const pt = (th, d) => { const a = arcOf(th), r = a[2] + (d || 0); return [a[0] + r * Math.cos(th), a[1] + r * Math.sin(th)]; };
/* THE 64 BAYS, laid out by length along the facade: bay 0 = the east gate, 16 = south, 32 = west, 48 = north */
const NB = 64, WG = 7.6, RS = OV.r1 + OV.out, RB = R2 + OV.out, LE = PHI * RS, LB = (Math.PI - 2 * PHI) * RB, LS = 2 * LE, PER = 2 * (LS + LB), WB = (PER / 4 - WG) / 15;
const thAt = s0 => { let s = ((s0 % PER) + PER) % PER; if (s < LE) return s / RS; s -= LE; if (s < LB) return PHI + s / RB; s -= LB; if (s < LS) return Math.PI - PHI + s / RS; s -= LS; if (s < LB) return Math.PI + PHI + s / RB; s -= LB; return TAU - PHI + s / RS; };
const sMid = i => Math.floor(i / 16) * PER / 4 + (i % 16 ? WG / 2 + (i % 16 - 0.5) * WB : 0), sEnd = i => Math.floor(i / 16) * PER / 4 + WG / 2 + (i % 16) * WB;
const TH = []; for (let i = 0; i < NB; i++) TH.push(thAt(sMid(i)), thAt(sEnd(i)));   // 128 normals: [2i] = the middle of bay i, [2i + 1] = the line between bay i and bay i + 1
const isGate = i => i % 16 === 0, VOM = [8, 24, 40, 56];
const PATH = TH.map(th => { const p = pt(th, 0); return [r3(p[0]), r3(p[1]), r4(Math.cos(th)), r4(Math.sin(th))]; });   // the arena's edge + its normals: every drawn ring is this line, d metres out
const REG = [], GATE = [], BND = []; for (let i = 0; i < NB; i++) { (isGate(i) ? GATE : REG).push(2 * i); BND.push(2 * i + 1); }
/* the gates: [the way out (x, z), the arena's half axis on it, the look row's turn] */
const GATES = [{ k: 'e', u: [1, 0], ar: OV.a, rot: 270 }, { k: 's', u: [0, 1], ar: OV.b, rot: 0, box: true }, { k: 'w', u: [-1, 0], ar: OV.a, rot: 90 }, { k: 'n', u: [0, -1], ar: OV.b, rot: 180, box: true }];
/* THE SECTION'S RINGS (the rows a walker stands on) */
const RINGS = [{ id: 'podium', d0: 0, d1: 3.5, top: 3.5 }];
for (let k = 1; k <= 8; k++) RINGS.push({ id: 'low' + k, d0: 3.5 + 0.875 * (k - 1), d1: 3.5 + 0.875 * k, top: 3.5 + 0.5 * k });
RINGS.push({ id: 'walk', d0: 10.5, d1: 13.125, top: 8 });
for (let j = 1; j <= 9; j++) RINGS.push({ id: 'up' + j, d0: 13.125 + 0.875 * (j - 1), d1: 13.125 + 0.875 * j, top: Math.round((8 + 0.6 * j) * 100) / 100 });
RINGS.push({ id: 'gallery', d0: 21, d1: 23.5, top: 14 });
const TUNNEL_H = 5.5, BOX_Y = 6, BOX_D = 7.9, STAIR = { foot: 23.5, head: 13.0, top: 8, hw: 1.8 }, stairH = d => STAIR.top * (STAIR.foot - d) / (STAIR.foot - STAIR.head);
/* THE STONE: the game's own sheets. Travertine blocks = the calm pack's coursed ashlar lifted to a warm cream; dressed stone = its marble */
const ASH = 'calm_castle', SM = 'calm_marble', SEAT = 'marble_light', WALLK = 'castle_wall';
const T_ASH = 0xfff1da, T_SM = 0xfff3e0, T_IN = 0xa59883, T_DARK = 0x6e6558, mA = { gain: 2.75, uv: 7 }, mS = { gain: 2.05, uv: 5 }, mIn = { gain: 2.4, uv: 7 };

exports.oval = { pt, TH, PATH, RINGS };
exports.build = ctx => { const { gx, gz, look, feat, r2 } = ctx, cx = gx(CX), cz = gz(CY);
    const WX = x => r2(cx + x), WZ = z => r2(cz + z);
    const part = (a, o) => { a.P.push(o); return o; };
    const sweep = (a, prof, key, tint, o) => part(a, Object.assign({ s: 'sweep', p: [0, 0, 0], path: 'o', prof: prof.map(q => [r3(q[0]), r3(q[1])]), key, tint }, o));
    const archw = (a, o) => part(a, Object.assign({ s: 'archw' }, o));
    const row = (id, x, z, rot, fn) => { const r = look(id, cx + x, cz + z, rot, 0, fn); if (r.parts.some(p => p.path === 'o' || (p.along && p.along.path === 'o'))) r.paths = { o: PATH }; return r; };
    const up = (prof, y) => prof.map(q => [q[0], q[1] + y]);

    /* ════ THE SEATS: every ring of the section as tier walls round the oval, cut where a tunnel or a stair goes through ════ */
    const STRIPS = GATES.map((g, i) => ({ gate: g, o: [0, 0], u: g.u, hw: 3.6, from: -1 }))
        .concat(VOM.map(v => { const th = TH[2 * v]; return { vom: v, o: pt(th, 0), u: [Math.cos(th), Math.sin(th)], hw: STAIR.hw, from: 13.1, th }; }));
    const lat = (S, p) => -(p[0] - S.o[0]) * S.u[1] + (p[1] - S.o[1]) * S.u[0], alo = (S, p) => (p[0] - S.o[0]) * S.u[0] + (p[1] - S.o[1]) * S.u[1];
    const half = (poly, f) => { const out = [], cut = []; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B);
            if (fa >= 0) out.push(A); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb), q = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; out.push(q); cut.push(q); } }
        return { poly: out, cut }; };
    const area = q => { let s = 0; for (let i = 0; i < q.length; i++) { const A = q[i], B = q[(i + 1) % q.length]; s += A[0] * B[1] - B[0] * A[1]; } return Math.abs(s) / 2; };
    const clip = (piece, S) => { if (piece.poly.every(p => alo(S, p) <= 0) || piece.poly.every(p => lat(S, p) >= S.hw) || piece.poly.every(p => lat(S, p) <= -S.hw)) return [piece];
        return [half(piece.poly, p => lat(S, p) - S.hw), half(piece.poly, p => -lat(S, p) - S.hw)].filter(h => h.poly.length >= 3 && area(h.poly) > 0.06).map(h => ({ poly: h.poly, cuts: piece.cuts.concat(h.cut.length === 2 ? [h.cut] : []) })); };
    const WALLS = [];
    RINGS.forEach((G, k) => { G.tint = (G.id === 'podium' || G.id === 'walk' || G.id === 'gallery') ? '#fff6e6' : (k % 2 ? '#efe4cf' : '#d6cab2'); });   // the rows read as rows: a lighter and a darker stone, turn about
    RINGS.forEach(G => { const step = G.d0 >= 13 ? 2 : 1, d1 = G.d1 + (G.id === 'gallery' ? 0 : 0.12), hw = (G.d1 - G.d0) / 2;
        for (let i = 0; i < NB; i += step) { const tA = TH[(2 * i - 1 + 2 * NB) % (2 * NB)], tB = TH[(2 * (i + step - 1) + 1) % (2 * NB)];
            let pieces = [{ poly: [pt(tA, G.d0), pt(tB, G.d0), pt(tB, d1), pt(tA, d1)], cuts: [] }];
            STRIPS.forEach(S => { if (G.d0 >= S.from) pieces = [].concat(...pieces.map(p => clip(p, S))); });
            const mA_ = pt(tA, (G.d0 + G.d1) / 2), mB_ = pt(tB, (G.d0 + G.d1) / 2), L0 = Math.hypot(mB_[0] - mA_[0], mB_[1] - mA_[1]), td = [(mB_[0] - mA_[0]) / L0, (mB_[1] - mA_[1]) / L0];
            pieces.forEach(pc => { let q = pc.poly.slice();
                while (q.length > 4) { let bi = 0, bl = 1e9; for (let k = 0; k < q.length; k++) { const l = Math.hypot(q[(k + 1) % q.length][0] - q[k][0], q[(k + 1) % q.length][1] - q[k][1]); if (l < bl) { bl = l; bi = k; } } q.splice(bi, 1); }
                if (q.length === 3) { let bi = 0, bl = 0; for (let k = 0; k < 3; k++) { const l = Math.hypot(q[(k + 1) % 3][0] - q[k][0], q[(k + 1) % 3][1] - q[k][1]); if (l > bl) { bl = l; bi = k; } } q.splice(bi + 1, 0, [(q[bi][0] + q[(bi + 1) % 3][0]) / 2, (q[bi][1] + q[(bi + 1) % 3][1]) / 2]); }
                const c = [q.reduce((s, p) => s + p[0], 0) / 4, q.reduce((s, p) => s + p[1], 0) / 4], pr = q.map(p => (p[0] - c[0]) * td[0] + (p[1] - c[1]) * td[1]), s0 = Math.min(...pr), s1 = Math.max(...pr), L = s1 - s0;
                if (L < 0.2) return;
                const cutAt = s => pc.cuts.some(e => e.some(p => Math.abs((p[0] - c[0]) * td[0] + (p[1] - c[1]) * td[1] - s) < 0.35)), pull = Math.min(hw, L / 2 - 0.05);
                const a0 = s0 + (cutAt(s0) ? pull : 0), a1 = s1 - (cutAt(s1) ? pull : 0);
                WALLS.push({ k: 'wall', absY: true, x0: WX(c[0] + td[0] * a0), z0: WZ(c[1] + td[1] * a0), x1: WX(c[0] + td[0] * a1), z1: WZ(c[1] + td[1] * a1), y: G.top, t: r2(G.d1 - G.d0), key: SEAT, tier: true, quad: q.map(p => [WX(p[0]), WZ(p[1])]), rail: false, tint: G.tint });
                /* a ghost along each cut end, just inside the row: the row's round end is pulled back from the cut, the ghost closes the corner */
                pc.cuts.forEach(e => { const m = [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2], dx = c[0] - m[0], dz = c[1] - m[1], dl = Math.hypot(dx, dz) || 1, ox = dx / dl * 0.22, oz = dz / dl * 0.22;
                    WALLS.push({ k: 'wall', absY: true, x0: WX(e[0][0] + ox), z0: WZ(e[0][1] + oz), x1: WX(e[1][0] + ox), z1: WZ(e[1][1] + oz), y: G.top, t: 0.4, ghost: true, rail: false }); }); }); } });
    /* THE TUNNELS' WALLS (6 m: the rows under 6 m end on them, the higher rows and the platform lie over them) */
    GATES.forEach(g => [-1, 1].forEach(sd => { const tx = -g.u[1] * sd * 3.3, tz = g.u[0] * sd * 3.3;
        WALLS.push({ k: 'wall', absY: true, x0: WX(g.u[0] * (g.ar - 0.3) + tx), z0: WZ(g.u[1] * (g.ar - 0.3) + tz), x1: WX(g.u[0] * (g.ar + 23.3) + tx), z1: WZ(g.u[1] * (g.ar + 23.3) + tz), y: BOX_Y, t: 0.6, key: WALLK, rail: false }); }));
    let nBridge = 0;
    GATES.forEach(g => { const t = [-g.u[1], g.u[0]], ext = 3.6 + (g.box ? 1.6 : 1.1);
        /* the rows that stand clear of the vault carry on over the tunnel; the platform at its mouth on the sand */
        RINGS.forEach(G => { if (G.top < BOX_Y + 0.45) return; const dm = g.ar + (G.d0 + G.d1) / 2, c = [g.u[0] * dm, g.u[1] * dm];
            feat({ k: 'bridge', absY: true, id: 'col:over_' + g.k + ':' + G.id, x0: WX(c[0] - t[0] * ext), z0: WZ(c[1] - t[1] * ext), x1: WX(c[0] + t[0] * ext), z1: WZ(c[1] + t[1] * ext), w: r2(G.d1 - G.d0 + 0.3), y: G.top, thick: r2(G.top - TUNNEL_H), plain: true, tier: true, rails: false, key: SEAT }); nBridge++; });
        feat({ k: 'bridge', absY: true, id: 'col:box_' + g.k, x0: WX(g.u[0] * (g.ar - 0.6)), z0: WZ(g.u[1] * (g.ar - 0.6)), x1: WX(g.u[0] * (g.ar + BOX_D)), z1: WZ(g.u[1] * (g.ar + BOX_D)), w: 8.4, y: BOX_Y, thick: 0.5, hide: true, rails: false });
        WALLS.push({ k: 'wall', absY: true, x0: WX(g.u[0] * (g.ar - 0.42) - t[0] * 4.2), z0: WZ(g.u[1] * (g.ar - 0.42) - t[1] * 4.2), x1: WX(g.u[0] * (g.ar - 0.42) + t[0] * 4.2), z1: WZ(g.u[1] * (g.ar - 0.42) + t[1] * 4.2), t: 0.4, y0: BOX_Y, y: BOX_Y + 1.05, ghost: true, rail: false }); });
    /* THE FOUR STAIRS (the vomitoria): a flight from the ring corridor up onto the walk; the upper rows that clear it carry on over it */
    STRIPS.filter(S => S.vom != null).forEach(S => { const f = pt(S.th, STAIR.foot), h = pt(S.th, STAIR.head), t = [-S.u[1], S.u[0]];
        feat({ k: 'ramp', absY: true, x0: WX(f[0]), z0: WZ(f[1]), x1: WX(h[0]), z1: WZ(h[1]), w: 2 * STAIR.hw + 0.6, h0: 0, h1: STAIR.top, stairs: true, edge: 0.1, model: 'stone', built: true, key: SEAT, side: SEAT });
        RINGS.forEach(G => { if (G.d0 < S.from) return; const dm = (G.d0 + G.d1) / 2, th = G.top - (stairH(G.d0) + 2.25); if (th < 0.3) return;
            const c = pt(S.th, dm), ext = STAIR.hw + 0.7;
            feat({ k: 'bridge', absY: true, id: 'col:over_v' + S.vom + ':' + G.id, x0: WX(c[0] - t[0] * ext), z0: WZ(c[1] - t[1] * ext), x1: WX(c[0] + t[0] * ext), z1: WZ(c[1] + t[1] * ext), w: r2(G.d1 - G.d0 + 0.15), y: G.top, thick: r2(Math.min(th, 3)), plain: true, tier: true, rails: false, key: SEAT }); nBridge++; }); });
    /* THE GALLERY'S OUTER HALF (14 m): a slab a bay over the ring corridor; the piers and the parapets in the third storey's arches */
    for (let i = 0; i < NB; i++) { const tA = TH[(2 * i - 1 + 2 * NB) % (2 * NB)], tB = TH[2 * i + 1], A = pt(tA, 25.4), B = pt(tB, 25.4), L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
        feat({ k: 'bridge', absY: true, id: 'col:gallery' + i, x0: WX(A[0] - ux * 0.3), z0: WZ(A[1] - uz * 0.3), x1: WX(B[0] + ux * 0.3), z1: WZ(B[1] + uz * 0.3), w: 4.6, y: 14, thick: 0.5, hide: true, rails: false });
        const P0 = pt(tA, 27.55), P1 = pt(tB, 27.55);
        WALLS.push({ k: 'wall', absY: true, x0: WX(P0[0]), z0: WZ(P0[1]), x1: WX(P1[0]), z1: WZ(P1[1]), t: 0.4, y0: 14, y: 15.05, ghost: true, rail: false });
        /* a pier: a ghost on the ground, another on the gallery */
        const Q0 = pt(tB, 26.6), Q1 = pt(tB, 27.4);
        WALLS.push({ k: 'wall', absY: true, x0: WX(Q0[0]), z0: WZ(Q0[1]), x1: WX(Q1[0]), z1: WZ(Q1[1]), t: 1.5, h: 5, y: 5, ghost: true, rail: false });
        WALLS.push({ k: 'wall', absY: true, x0: WX(Q0[0]), z0: WZ(Q0[1]), x1: WX(Q1[0]), z1: WZ(Q1[1]), t: 1.5, y0: 14, y: 19, ghost: true, rail: false }); }
    /* the podium's parapet over the sand (a walker leans on it; he can still jump it) */
    for (let i = 0; i < NB; i++) { const tA = TH[(2 * i - 1 + 2 * NB) % (2 * NB)], tB = TH[2 * i + 1], A = pt(tA, 0.22), B = pt(tB, 0.22);
        if (GATES.some(g => Math.abs(-((A[0] + B[0]) / 2) * g.u[1] + ((A[1] + B[1]) / 2) * g.u[0]) < 4.3 && ((A[0] + B[0]) * g.u[0] + (A[1] + B[1]) * g.u[1]) > 0)) continue;
        WALLS.push({ k: 'wall', absY: true, x0: WX(A[0]), z0: WZ(A[1]), x1: WX(B[0]), z1: WZ(B[1]), t: 0.4, y0: 3.5, y: 4.45, ghost: true, rail: false }); }
    /* HIGH -> LOW: the walker reads the first wall he touches (data.js THE STANDS), so a parapet is read before the row it stands on */
    WALLS.sort((p, q) => q.y - p.y).forEach(w => feat(w));
    ctx.count.colRows = WALLS.length; ctx.count.colBridges = nBridge + NB + 4;

    /* ════ THE FACADE: three storeys of arches between half columns, an entablature a storey ════ */
    const ENT = [[28.0, 7.0], [28.2, 7.0], [28.2, 6.75], [28.85, 6.75], [28.85, 6.6], [28.5, 6.35], [28.36, 6.35], [28.36, 5.8], [28.4, 5.8], [28.4, 5.35], [28.0, 5.35]];
    [0, 1, 2].forEach(s => row('facade' + (s + 1), 0, 0, 0, a => { const Y = 7 * s, reg = { path: 'o', at: REG, off: 26.86 }, gat = { path: 'o', at: GATE, off: 26.86 }, bnd = off => ({ path: 'o', at: BND, off });
        archw(a, Object.assign({ p: [0, Y, 0], size: [r3(WB + 0.08), 5.35, 2.2], hole: [3.0, 3.1], seg: 12, rim: [0.34, 0.1], key: ASH, tint: T_ASH, keyIn: ASH, tintIn: T_IN, keyRim: SM, tintRim: T_SM, along: reg }, mA));
        archw(a, Object.assign({ p: [0, Y, 0], size: [r3(WG + 0.08), 5.35, 2.2], hole: [5.2, 2.1], seg: 16, rim: [0.42, 0.12], key: ASH, tint: T_ASH, keyIn: ASH, tintIn: T_IN, keyRim: SM, tintRim: T_SM, along: gat }, mA));
        a.box(0, Y + 4.42, 1.14, 0.46, 0.93, 0.3, SM, T_SM, Object.assign({ along: reg }, mS));                    // the keystones
        a.box(0, Y + 4.52, 1.14, 0.6, 0.83, 0.34, SM, T_SM, Object.assign({ along: gat }, mS));
        a.box(0, Y + 2.88, 0, r3(WB - 3.0 + 0.16), 0.22, 0.24, SM, T_SM, Object.assign({ along: bnd(28.04) }, mS));  // the imposts, a band across each pier at the springing
        /* the half column on every pier: pedestal, base, shaft, capital (the order of its storey), abacus */
        a.box(0, Y, 0, 1.08, 0.7, 0.8, SM, T_SM, Object.assign({ along: bnd(28.12) }, mS));
        a.cyl(0, Y + 0.7, 0, 0.53, 0.2, SM, T_SM, Object.assign({ arc: 180, seg: 12, along: bnd(28) }, mS));
        const sh = s === 2 ? 3.82 : 4.0;
        a.cyl(0, Y + 0.9, 0, 0.42, sh, SM, T_SM, Object.assign({ r2: 0.36, arc: 180, seg: 14, cap: false, along: bnd(28) }, mS));
        if (s === 0) a.cyl(0, Y + 4.9, 0, 0.37, 0.3, SM, T_SM, Object.assign({ r2: 0.5, arc: 180, seg: 12, along: bnd(28) }, mS));                                    // plain: a round cushion
        else if (s === 1) { a.cyl(0, Y + 4.9, 0, 0.37, 0.16, SM, T_SM, Object.assign({ r2: 0.45, arc: 180, seg: 12, along: bnd(28) }, mS));
            [-1, 1].forEach(k => a.cyl(k * 0.5, Y + 4.93, 0.28, 0.17, 0.3, SM, T_SM, Object.assign({ seg: 8, along: bnd(28) }, mS)));                                    // scrolled: a scroll each side
            a.box(0, Y + 5.06, 0.22, 1.16, 0.14, 0.5, SM, T_SM, Object.assign({ along: bnd(28) }, mS)); }
        else { a.cyl(0, Y + 4.72, 0, 0.36, 0.26, SM, T_SM, Object.assign({ r2: 0.47, arc: 180, seg: 12, cap: false, along: bnd(28) }, mS));                          // leafed: a bell in two flaring rings
            a.cyl(0, Y + 4.98, 0, 0.42, 0.22, SM, T_SM, Object.assign({ r2: 0.56, arc: 180, seg: 12, along: bnd(28) }, mS)); }
        a.box(0, Y + 5.2, 0.26, 1.1, 0.15, 0.56, SM, T_SM, Object.assign({ along: bnd(28) }, mS));
        sweep(a, up(ENT, Y), SM, T_SM, Object.assign({ closed: true, ud: 28 }, mS));                             // the entablature: architrave, frieze, cornice, the blocking course
        if (s > 0) { a.box(0, Y, 0.92, 3.02, 0.95, 0.3, SM, T_SM, Object.assign({ along: reg }, mS)); a.box(0, Y + 0.95, 0.92, 3.1, 0.1, 0.4, SM, T_SM, Object.assign({ along: reg }, mS));   // the parapet in each arch
            a.box(0, Y, 0.92, 5.22, 0.95, 0.3, SM, T_SM, Object.assign({ along: gat }, mS)); a.box(0, Y + 0.95, 0.92, 5.3, 0.1, 0.4, SM, T_SM, Object.assign({ along: gat }, mS)); }
    }));
    /* ════ THE ATTIC (21 - 28.5 m): a wall, a pilaster a pier, a window every other bay, the corbels and the masts of the awning ════ */
    row('attic', 0, 0, 0, a => { const ev = REG.filter((v, k) => k % 2 === 0), bnd = off => ({ path: 'o', at: BND, off });
        sweep(a, [[26.6, 21.0], [26.6, 28.5], [28.75, 28.5], [28.75, 28.22], [28.38, 27.95], [28.1, 27.95], [28.1, 21.9], [28.28, 21.9], [28.28, 21.0]], ASH, T_ASH, Object.assign({ closed: true, ud: 28, keys: [ASH, SM, SM, SM, SM, ASH, SM, SM], tints: [T_IN, T_SM, T_SM, T_SM, T_SM, T_ASH, T_SM, T_SM] }, mA));
        a.box(0, 21.9, 0, 0.95, 5.6, 0.26, SM, T_SM, Object.assign({ along: bnd(28.2) }, mS));                    // the pilasters
        a.box(0, 21.9, 0, 1.15, 0.35, 0.36, SM, T_SM, Object.assign({ along: bnd(28.22) }, mS));
        a.box(0, 27.5, 0, 1.25, 0.45, 0.4, SM, T_SM, Object.assign({ along: bnd(28.24) }, mS));
        a.box(0, 23.9, 0, 1.9, 2.3, 0.12, SM, T_SM, Object.assign({ along: { path: 'o', at: ev, off: 28.12 } }, mS));        // a window's frame, then its dark
        a.box(0, 24.1, 0, 1.4, 1.9, 0.16, SM, 0x3a342e, { along: { path: 'o', at: ev, off: 28.13 }, uv: 5 });
        [-1.25, 1.25].forEach(sx => { a.box(sx, 26.0, 0, 0.42, 0.5, 0.62, SM, T_SM, Object.assign({ along: { path: 'o', at: REG, off: 28.38 } }, mS));       // two corbels a bay, a mast on each
            a.cyl(sx, 26.5, 0, 0.11, 7.2, 'urban:WoodFlooring2a', 0xb09070, { r2: 0.08, seg: 6, along: { path: 'o', at: REG, off: 28.5 }, uv: 2 }); });
    });
    /* ════ THE RING CORRIDORS behind the arches: the ground one (walked), the second storey's (seen through its arches), their vaults ════ */
    const vault = (y, r0, r1) => { const n = 8, m = (r0 + r1) / 2, rr = (r1 - r0) / 2, P = []; for (let k = 0; k <= n; k++) { const t = Math.PI * k / n; P.push([m + rr * Math.cos(t), y + rr * Math.sin(t)]); } return P; };
    row('corridor', 0, 0, 0, a => { const dk = Object.assign({}, mIn);
        const open = []; for (let q = 0; q < 4; q++) { const g = 32 * q; open.push([g + 1, g + 15], [g + 17, g + 31]); }   // the back wall: not across a gate (0, 32, 64, 96), not across a stair's door (16, 48, 80, 112)
        open.forEach(q => sweep(a, [[23.5, 5.3], [23.5, 0]], ASH, T_IN, Object.assign({ from: q[0], to: q[1], ud: 23.5 }, dk)));
        for (let q = 0; q < 4; q++) sweep(a, vault(4.0, 23.5, 25.8), ASH, T_DARK, Object.assign({ from: 32 * q + 1, to: 32 * q + 31, ud: 25, roof: true }, dk));
        archw(a, Object.assign({ p: [0, 0, 0], size: [4.5, 5.3, 0.5], hole: [3.3, 2.5], seg: 12, rim: [0.3, 0.08], key: ASH, tint: T_IN, keyIn: ASH, tintIn: T_DARK, faces: 'f', along: { path: 'o', at: VOM.map(v => 2 * v), off: 23.42 } }, dk));   // the stairs' doors
        /* the second storey: its floor, its back wall, its vault; the third storey's floor is the gallery's (below) */
        sweep(a, [[23.4, 7.0], [25.9, 7.0]], SM, T_IN, Object.assign({ closed: true, ud: 25 }, mS));
        sweep(a, [[23.5, 12.3], [23.5, 7.0]], ASH, T_IN, Object.assign({ closed: true, ud: 23.5 }, dk));
        sweep(a, vault(11.0, 23.5, 25.8), ASH, T_DARK, Object.assign({ closed: true, ud: 25, roof: true }, dk));
    });
    /* ════ THE GALLERY (14 m): its floor, the colonnade toward the arena, the roof over it ════ */
    row('gallery', 0, 0, 0, a => { const bnd = off => ({ path: 'o', at: BND, off });
        sweep(a, [[20.95, 14.02], [27.9, 14.02]], SM, T_SM, Object.assign({ closed: true, ud: 24 }, mS));
        a.box(0, 14.0, 0, 0.95, 0.26, 0.95, SM, T_SM, Object.assign({ along: bnd(21.45) }, mS));
        a.cyl(0, 14.26, 0, 0.34, 4.9, SM, T_SM, Object.assign({ r2: 0.28, seg: 12, cap: false, along: bnd(21.45) }, mS));
        a.cyl(0, 19.16, 0, 0.29, 0.42, SM, T_SM, Object.assign({ r2: 0.46, seg: 12, along: bnd(21.45) }, mS));
        a.box(0, 19.58, 0, 1.0, 0.22, 1.0, SM, T_SM, Object.assign({ along: bnd(21.45) }, mS));
        sweep(a, [[21.85, 20.6], [21.85, 19.8], [21.0, 19.8], [21.0, 20.7], [20.7, 20.7], [20.7, 21.0], [26.62, 21.0]], SM, T_SM, Object.assign({ closed: true, ud: 22, tints: [T_IN, T_SM, T_SM, T_SM, T_SM, T_ASH] }, mS));
        sweep(a, [[26.7, 20.6], [21.85, 20.6]], SM, T_IN, Object.assign({ closed: true, ud: 24, glow: 0.2 }, mS));                                    // the ceiling (lit a little: nothing in the game lights a face that looks down)
        sweep(a, [[25.78, 19.2], [25.78, 20.65]], ASH, T_IN, Object.assign({ closed: true, ud: 25.8 }, mIn));                                         // the wall over the arches' heads, inside
    });
    /* ════ THE AWNING: canvas on every other bay, from the masts' heads down toward the arena ════ */
    row('awning', 0, 0, 0, a => { for (let i = 1; i < NB; i += 2) sweep(a, [[28.3, 32.6], [13.5, 27.2]], null, i % 8 === 1 ? 0x9a2a24 : 0xeadfc6, { from: 2 * i - 1, to: 2 * i + 1, ds: true, roof: true, glow: 0.42 });
        sweep(a, [[13.5, 27.15], [13.2, 27.15], [13.2, 27.35], [13.5, 27.35]], null, 0x6b5a3c, { closed: true, ds: true, roof: true }); });   // the rope ring the canvas ends on
    /* ════ THE PODIUM'S LIP + THE SAND ════ */
    row('podium', 0, 0, 0, a => { const thE = Math.asin(4.0 / OV.r1), thS = Math.acos(4.0 / R2), quads = [[thE, thS], [Math.PI - thS, Math.PI - thE], [Math.PI + thE, Math.PI + thS], [TAU - thS, TAU - thE]];
        const LIP = [[0, 3.0], [-0.1, 3.0], [-0.1, 3.32], [0, 3.32], [0, 4.3], [-0.08, 4.3], [-0.08, 4.45], [0.5, 4.45], [0.5, 4.3], [0.42, 4.3], [0.42, 3.5]];
        quads.forEach(q => { const n = Math.ceil((q[1] - q[0]) / 0.05), P = []; for (let k = 0; k <= n; k++) { const th = q[0] + (q[1] - q[0]) * k / n, p = pt(th, 0); P.push([r3(p[0]), r3(p[1]), r4(Math.cos(th)), r4(Math.sin(th))]); }
            part(a, Object.assign({ s: 'sweep', p: [0, 0, 0], path: P, prof: LIP, key: SM, tint: T_SM }, mS));
            part(a, Object.assign({ s: 'sweep', p: [0, 0, 0], path: P, prof: [[-0.12, 0], [-0.12, 0.55], [-0.05, 0.55], [-0.05, 3.0]], key: SM, tint: T_SM, tints: [T_SM, T_SM, 0x9c3526] }, mS)); });   // the arena's wall: a pale plinth, a red marble face
        const sand = []; for (let k = 0; k < 72; k++) { const p = pt(-k * TAU / 72, 0.3); sand.push(p); }
        a.poly(sand, 0, 0.06, 'calm_sand', 0xfff0cc, { gain: 1.75, uv: 7 });
        /* the trapdoors of the lifts under the sand (the rooms under it are not built) */
        [[-13, -3.5], [13, 3.5], [-13, 3.5], [13, -3.5], [0, -7], [0, 7], [-6.5, 0], [6.5, 0]].forEach(q => { a.box(q[0], 0.05, q[1], 2.6, 0.05, 2.6, 'urban:WoodFlooring2a', 0x8a7458, { uv: 2.6 }); a.box(q[0], 0.05, q[1], 2.9, 0.03, 2.9, null, 0x3a3630, {}); });
    });
    /* ════ THE FOUR GATES: the tunnel's vault, the portal on the sand, the platform over it (a box north and south), the porch outside ════ */
    GATES.forEach(g => row('gate_' + g.k, g.u[0] * g.ar, g.u[1] * g.ar, g.rot, a => {   // this row's frame: z = metres out from the arena's edge along the gate's axis, x = across
        part(a, Object.assign({ s: 'roof', form: 'barrel', p: [0, 2.5, 12.75], ry: 90, size: [26.1, 3.0, 6.0], roof: true, ends: false, ds: true, seg: 12, key: ASH, tint: T_DARK }, mIn));
        [-1, 1].forEach(k => a.box(k * 3.02, 2.3, 12.75, 0.16, 0.22, 26.1, SM, T_IN, mS));                                                        // the springing's band
        archw(a, Object.assign({ p: [0, 0, -0.15], ry: 180, size: [8.4, 6.0, 0.9], hole: [6.0, 2.5], seg: 16, rim: [0.45, 0.14], ends: true, key: ASH, tint: T_ASH, keyIn: ASH, tintIn: T_IN, keyRim: SM, tintRim: T_SM }, mA));
        a.box(0, 4.95, -0.68, 0.7, 1.05, 0.3, SM, T_SM, mS);
        a.box(0, 5.5, 3.65, 8.4, 0.5, 8.5, SM, T_SM, Object.assign({ under: true }, mS));                                                         // the platform
        a.box(0, 6.0, -0.42, 8.4, 1.0, 0.36, SM, T_SM, mS); a.box(0, 7.0, -0.42, 8.6, 0.12, 0.52, SM, T_SM, mS);                                    // its parapet over the sand
        [-1, 1].forEach(k => { a.box(k * 3.6, 2.2, -0.66, 0.9, 3.3, 0.06, null, 0x8e1f1f, {}); a.box(k * 3.6, 5.5, -0.67, 1.0, 0.1, 0.08, null, 0xc8a040, {}); a.box(k * 3.6, 2.12, -0.67, 1.0, 0.08, 0.08, null, 0xc8a040, {}); });   // the banners on the portal's piers
        if (g.box) {   /* THE BOX: a canopy on four posts, red cloth, a gilt edge */
            [[-3.7, 0.4], [3.7, 0.4], [-3.7, 6.6], [3.7, 6.6]].forEach(q => { a.box(q[0], 6.0, q[1], 0.6, 0.3, 0.6, SM, T_SM, mS); a.cyl(q[0], 6.3, q[1], 0.2, 3.3, SM, T_SM, Object.assign({ r2: 0.17, seg: 10 }, mS)); a.box(q[0], 9.6, q[1], 0.56, 0.2, 0.56, SM, T_SM, mS); });
            a.box(0, 9.8, 3.5, 8.3, 0.28, 7.1, null, 0xc8a040, { under: true, glow: 0.22 });
            a.roof('hip', 0, 10.08, 3.5, 8.0, 1.5, 6.8, null, 0x8e1f1f, { roof: true });
            [0.4, 6.6].forEach(z => a.box(0, 9.2, z, 7.6, 0.6, 0.06, null, 0x8e1f1f, {}));
            a.box(0, 6.0, 4.6, 3.4, 0.1, 2.6, SM, T_SM, mS);                                                                                       // the dais the throne stands on
        }
        if (g.k === 'n' || g.k === 's') {   /* THE PORCH: four columns, an entablature, a low attic the chariot stands on */
            [-4.85, -3.0, 3.0, 4.85].forEach(x => { a.box(x, 0, 31.0, 1.25, 0.7, 1.25, SM, T_SM, mS); a.cyl(x, 0.7, 31.0, 0.55, 0.22, SM, T_SM, Object.assign({ seg: 14 }, mS));
                a.cyl(x, 0.92, 31.0, 0.46, 3.98, SM, T_SM, Object.assign({ r2: 0.39, seg: 16, cap: false }, mS)); a.cyl(x, 4.9, 31.0, 0.4, 0.3, SM, T_SM, Object.assign({ r2: 0.54, seg: 14 }, mS)); a.box(x, 5.2, 31.0, 1.2, 0.15, 1.2, SM, T_SM, mS); });
            a.box(0, 5.35, 30.1, 11.6, 0.45, 3.3, SM, T_SM, Object.assign({ under: true }, mS)); a.box(0, 5.8, 30.08, 11.5, 0.55, 3.2, SM, T_SM, mS);
            a.box(0, 6.35, 30.2, 12.3, 0.4, 3.9, SM, T_SM, Object.assign({ under: true }, mS)); a.box(0, 6.75, 30.0, 9.6, 1.0, 3.0, ASH, T_ASH, Object.assign({ keyTop: SM, tintTop: T_SM }, mA));
            a.sign('COLOSSEVM', 0, 5.84, 31.7, 7.4, 0.46, '#5a2a1c', '', 'cinzel', { kind: 'over' });
        }
    }));
};
/* a piece's facing from the way it looks (x, z): 0 = north */
const faceOf = (x, z) => Math.round(Math.atan2(x, -z) * 180 / Math.PI);
exports.dress = ctx => { const { P, dec, at, gx, gz, cell } = ctx, cx = gx(CX), cz = gz(CY);
    const put = (key, p, o) => at(key, cx + p[0], cz + p[1], o);
    /* the two processional gates: a lion each side on the plaza, a brazier each side of the porch; the chariots on the porches */
    P('lion_statue', 27, 1, { face: 180 }); P('lion_statue', 32, 1, { face: 180 }); P('lion_statue', 27, 30, { face: 0 }); P('lion_statue', 32, 30, { face: 0 });
    [[-6.6, -(OV.b + 31)], [6.6, -(OV.b + 31)], [-6.6, OV.b + 31], [6.6, OV.b + 31]].forEach(q => put('brazier', q));
    put('chariot', [0, -(OV.b + 30)], { y: 7.75, face: 180 }); put('chariot', [0, OV.b + 30], { y: 7.75, face: 0 });
    /* statues in the second storey's arches, every other bay (the real one had one in every arch) */
    for (let i = 1; i < NB; i += 2) { if (isGate(i)) continue; const th = TH[2 * i], p = pt(th, 26.7); put((i % 4 === 1) ? 'god_statue' : 'angel_statue', p, { y: 7.0, face: faceOf(Math.cos(th), Math.sin(th)) }); }
    /* the tunnels: a brazier pair inside each; the boxes: a throne under the canopy */
    GATES.forEach(g => { const t = [-g.u[1], g.u[0]]; [9, 19].forEach(d => [-1, 1].forEach(k => put('brazier', [g.u[0] * (g.ar + d) + t[0] * k * 2.5, g.u[1] * (g.ar + d) + t[1] * k * 2.5])));
        if (g.box) put('royal_throne', [g.u[0] * (g.ar + 4.6), g.u[1] * (g.ar + 4.6)], { y: BOX_Y + 0.1, face: faceOf(-g.u[0], -g.u[1]) }); });
    /* the sand: braziers at the foot of the arena's wall, the fighters' racks and a training post, a beast's wagon by the Gate of Death */
    for (let k = 0; k < 14; k++) { const th = (k + 0.5) * TAU / 14, p = pt(th, -1.6); if (Math.abs(p[0]) > 5 && Math.abs(p[1]) > 5) put('brazier', p); }
    put('dojo_weapon_rack', [-9, 11.5], { face: 0 }); put('dojo_weapon_rack', [9, 11.5], { face: 0 }); put('wing_chun_dummy', [-15, -6], { face: 90 }); put('wing_chun_dummy', [-15, 6], { face: 90 });
    put('cage_wagon', [15, 7], { face: 300 });
    /* the gallery: urns between the columns on the long sides */
    [10, 12, 14, 18, 20, 22, 42, 44, 46, 50, 52, 54].forEach(i => { const p = pt(TH[2 * i], 22.3); put('stone_urn', p, { y: 14 }); });
    /* the plaza: benches, urns, amphorae, flag poles at the four corners of the oval, the beast cages by the Gate of Death */
    [[15, 3], [44, 3], [15, 31], [44, 28]].forEach(q => P('flag_pole', q[0], q[1]));
    [[20, 2, 180], [39, 2, 180], [14, 16, 90], [45, 16, 270], [20, 33, 0]].forEach(q => P('park_bench', q[0], q[1], { face: q[2] }));
    [[16, 6], [43, 6], [16, 26], [43, 25], [24, 33], [36, 33]].forEach(q => P('stone_urn', q[0], q[1]));
    [[14, 9], [45, 9], [14, 23], [45, 22], [26, 2], [34, 2]].forEach(q => dec('greek_amphora', q[0], q[1]));
    P('cage_wagon', 22, 31, { face: 90 }); P('cage_wagon', 37, 31, { face: 270 });
};
exports.people = ctx => { const { native, npc, gx, gz } = ctx, cx = gx(CX), cz = gz(CY);
    /* THE PEOPLE OFF THE GROUND (2026-11-18, mondo: "make the stands walkable and those thrones able to be sat in"). A spot on a row of seats needs
       no height (a body stands on what is under it, and a row is a wall's top); a spot on a BRIDGE (a box, the gallery's outer half) carries its
       own `y`; `pose: 'hqSit'` seats it (its `y` is then the seat's own height, as the walker's is when he sits). The north throne is the walker's.
       THE ORDER IS WHO STANDS FIRST: the room's bodies are capped (data.js HQ_CROWD_RULES.areaMax 14, one body a race), so the Pope and the seats
       come before the sand, and the last rows here stand only when the cap is lifted. */
    const R2D = 180 / Math.PI, W2 = v => Math.round(v * 100) / 100, inward = th => faceOf(-Math.cos(th), -Math.sin(th));
    npc.push({ x: cx, z: W2(cz + OV.b + 4.6), y: BOX_Y + 0.1 + 0.55, face: 0, race: 'pope', pose: 'hqSit' });   // the Pope on the south throne, looking down the arena
    /* the crowd: seated on the front of a row (legs over the row below), or standing; two of them walk their rounds from the seats */
    const rowAt = (id, th, f) => { const G = RINGS.find(g => g.id === id), p = pt(th / R2D, G.d0 + (f == null ? 0.3 : f)); return { x: W2(cx + p[0]), z: W2(cz + p[1]), face: inward(th / R2D) }; };
    const seated = q => npc.push(Object.assign(rowAt(q[1], q[2]), { race: q[0], pose: 'hqSit' }));
    [['fortune teller', 'low3', 250], ['cowboy', 'low5', 292], ['wizard', 'low2', 112]].forEach(seated);
    npc.push(Object.assign(rowAt('walk', 140, 1.3), { race: 'pirate', roam: true })); npc.push(Object.assign(rowAt('up5', 25, 0.45), { race: 'influencer', roam: true }));
    /* the fighters on the sand and their referee */
    native('swordfighter', 28, 15, 90, null, { gender: 'male' }); native('minotaur', 31, 15, 270); native('referee', 30, 17, 0); native('knight', 33, 17, 270);
    /* past the cap today: more of the crowd, the ringmaster at the Gate of Life, the plaza's people */
    [['politician', 'low6', 68], ['televangelist', 'low4', 205], ['banker', 'up2', 335]].forEach(seated);
    npc.push(Object.assign(rowAt('podium', 300, 1.8), { race: 'tech ceo' }));
    native('luchador', 26, 17, 90); native('ringmaster', 32, 3, 180); native('quarterback', 18, 29, 45);
};
