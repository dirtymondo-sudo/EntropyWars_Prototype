/* DISASTER CITY · THE FINANCIAL DISTRICT · THE SECOND LAYERS (2026-11-13, mondo 20:15: "one more polish pass on the exteriors ... go one or two
   more layers deep with the detail, the foundation is already there and is good"; 20:18 "roofs and ac units"; 20:19 "and textures, different
   textures or decals for different parts of the building"). Required by F.js (not a district file: the tool reads only <LETTER>.js):
   `detail(T, P)` runs on a building's parts just before its arch row is written and adds what a designer adds after the massing: belt courses,
   dentils, sills, downpipes, lamps, ROOFS (a deck sheet, parapets, AC units, vents, stair heads, tanks), AC boxes and grilles on the walls,
   the pack's other sheets on other parts (tile dados, checker floors, grilles, truss frames, ceiling tile soffits, the Sign* plates) and
   SIGNS in block letters built from boxes (an arch part cannot write text; the words are plain trade words, never a made-up name).
   Gold = the `gold` sheet only; glass stays the pack's dark glass (never lifted). Walked roofs (the roof route) stay clear. */
'use strict';
module.exports = function (K) {
    const { box, cyl, dome, roof, quad, STONE, ALU, GUN, CONC, CONC2, CORR2, U } = K, WHITE = 0xffffff;
    const IRON = 0x24272c, LAMP = 0xffd890, YEL = 0xf2c230, ACG = 0xb0b6bc, CR = 0xd8d0c0;
    const GRILL = U('MetalSubwayGrill1a'), TRUSS = U('MetalTruss1a'), RUB = U('RubberNonSlip1a'), ROOFT = U('ConcreteUnderTiles2'), FIBRE = U('FibreCeilingTile1a');
    const CHK = U('TileGeneric5a'), CHKG = U('TileMarble2a'), CHKB = U('TileMarble3a'), TILE = U('TileSubway1a'), TILER = U('TileSubway3a'), PAVE = U('TileGeneric1a');
    const S_CAUT = U('SignCaution1a'), S_HAZ = U('SignHazard1a'), S_VOLT = U('SignHazard2a'), S_NO = U('SignProhibited1a'), S_HELM = U('SignProtective1a');

    /* ── block letters: a 5 × 7 face cut into as few boxes as cover it ── */
    const FONT = {
        A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
        C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
        E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
        G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
        I: ['111', '010', '010', '010', '010', '010', '111'], K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
        L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
        O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
        S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
        U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
        W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
        ' ': ['000', '000', '000', '000', '000', '000', '000'],
    };
    const glyph = (P, g, x0, y, z, px, dep, key, tint, o) => {
        const used = g.map(r => r.split('').map(() => false)), extra = o.glow ? { glow: o.glow } : o.gain ? { gain: o.gain } : null;
        for (let r = 0; r < 7; r++) for (let c = 0; c < g[r].length; c++) {
            if (g[r][c] !== '1' || used[r][c]) continue;
            let e = c; while (e < g[r].length && g[r][e] === '1' && !used[r][e]) e++;
            let b = r + 1; const full = q => { for (let k = c; k < e; k++) if (g[q][k] !== '1' || used[q][k]) return false; return true; };
            while (b < 7 && full(b)) b++;
            for (let rr = r; rr < b; rr++) for (let k = c; k < e; k++) used[rr][k] = true;
            P.push(box(x0 + (c + e) / 2 * px, y + (7 - b) * px, z + dep / 2, (e - c) * px + 0.004, (b - r) * px + 0.004, dep, key, tint, extra));
        }
    };
    /* `text` centred on x, its foot at y, on the plane z (facing +z), `h` tall; `o.down` = the letters stacked downward (a blade sign) */
    const letters = (P, text, x, y, z, h, key, tint, o) => {
        o = o || {}; const px = h / 7, dep = o.depth || 0.12, chars = String(text).split('').map(c => FONT[c] || FONT[' ']);
        if (o.down) { chars.forEach((g, i) => glyph(P, g, x - g[0].length * px / 2, y - i * (h + px * 1.6), z, px, dep, key, tint, o)); return; }
        const wide = chars.reduce((a, g) => a + (g[0].length + 1) * px, -px); let cx = x - wide / 2;
        chars.forEach(g => { glyph(P, g, cx, y, z, px, dep, key, tint, o); cx += (g[0].length + 1) * px; });
    };

    /* ── a face of a body w × d centred on (cx, cz): 'f' +z, 'b' -z, 'r' +x, 'l' -x; `a` = along the face ── */
    const wBox = (P, f, cx, cz, w, d, a, y, len, h, dep, key, tint, o) => P.push(f === 'f' ? box(cx + a, y, cz + d / 2 + dep / 2, len, h, dep, key, tint, o) : f === 'b' ? box(cx + a, y, cz - d / 2 - dep / 2, len, h, dep, key, tint, o)
        : f === 'r' ? box(cx + w / 2 + dep / 2, y, cz + a, dep, h, len, key, tint, o) : box(cx - w / 2 - dep / 2, y, cz + a, dep, h, len, key, tint, o));
    const wQuad = (P, f, cx, cz, w, d, a, y, len, h, out, key, tint, o) => P.push(f === 'f' ? quad(cx + a, y, cz + d / 2 + out, len, h, 0, key, tint, o) : f === 'b' ? quad(cx + a, y, cz - d / 2 - out, len, h, 180, key, tint, o)
        : f === 'r' ? quad(cx + w / 2 + out, y, cz + a, len, h, 270, key, tint, o) : quad(cx - w / 2 - out, y, cz + a, len, h, 90, key, tint, o));
    const wallAC = (P, f, cx, cz, w, d, a, y) => { wBox(P, f, cx, cz, w, d, a, y, 0.95, 0.6, 0.5, CORR2, ACG); wQuad(P, f, cx, cz, w, d, a, y + 0.06, 0.8, 0.48, 0.51, GRILL, 0x9aa0a6, { uv: [0.4, 0.48], kind: 'wall' }); wBox(P, f, cx, cz, w, d, a, y - 0.1, 1.05, 0.08, 0.55, null, IRON); };
    const grille = (P, f, cx, cz, w, d, a, y, len, h, tint) => wQuad(P, f, cx, cz, w, d, a, y, len, h, 0.07, GRILL, tint || 0x9aa0a6, { uv: [h, h], kind: 'wall' });
    const plate = (P, f, cx, cz, w, d, a, y, s, key) => wQuad(P, f, cx, cz, w, d, a, y, s, s, 0.08, key, WHITE, { uv: 'fit' });

    /* ── the small parts ── */
    const pipe = (P, x, z, h) => { const tint = IRON; P.push(cyl(x, 0, z, 0.07, h, null, tint || IRON, { seg: 6, cap: false }), box(x, h * 0.33, z, 0.22, 0.08, 0.22, null, tint || IRON, { n: 2, step: [0, h * 0.33, 0] }), box(x, h - 0.3, z, 0.3, 0.3, 0.3, null, tint || IRON)); };
    const lamp = (P, x, y, z) => { P.push(box(x, y + 0.28, z + 0.12, 0.08, 0.08, 0.3, null, IRON), box(x, y + 0.04, z + 0.24, 0.18, 0.22, 0.18, null, LAMP, { glow: 1 })); };
    const dentils = (P, x, y, z, len, key, tint, alongZ) => { const n = Math.max(2, Math.floor(len / 0.7)), st = len / n; P.push(box(alongZ ? x : x - len / 2 + st / 2, y, alongZ ? z - len / 2 + st / 2 : z, alongZ ? 0.3 : 0.34, 0.3, alongZ ? 0.34 : 0.3, key, tint, { n, step: alongZ ? [0, 0, st] : [st, 0, 0], top: false, under: true })); };
    const railing = (P, x, y, z, len, alongZ, tint, o) => { const n = Math.max(2, Math.round(len / 1.4)) + 1, st = len / (n - 1), R = o || {};
        P.push(box(x, y + 0.95, z, alongZ ? 0.06 : len, 0.06, alongZ ? len : 0.06, null, tint || IRON, R), box(x, y + 0.5, z, alongZ ? 0.04 : len, 0.04, alongZ ? len : 0.04, null, tint || IRON, R),
            box(alongZ ? x : x - len / 2, y, alongZ ? z - len / 2 : z, 0.07, 1.0, 0.07, null, tint || IRON, Object.assign({ n, step: alongZ ? [0, 0, st] : [st, 0, 0] }, R))); };
    const belt = (P, x, y, z, w, d, key, tint, out, o) => { P.push(box(x, y, z, w + (out || 0.3), 0.18, d + (out || 0.3), key, tint, Object.assign({ under: true }, o || {}))); };
    const bollards = (P, x, z, n, st, tint) => P.push(cyl(x, 0, z, 0.13, 1.0, null, tint || YEL, { seg: 8, n, step: [st, 0, 0] }));

    /* ── the roofs (every part `roof: true`: hidden with HIDE ROOFS, as a building's roof) ── */
    const RF = null; let HOLLOW = false;   // only a walk-in's deck is hidden with HIDE ROOFS (a `roof` flag is its own mesh: the plant shares the walls' meshes)
    const deck = (P, x, y, z, w, d, key, tint, uv) => P.push(quad(x, y + 0.05, z, w, d, 0, key || RUB, tint || 0x8a8c90, { flat: true, uv: uv || 1.75, roof: HOLLOW && y > 1 }));
    const parapet = (P, x, y, z, w, d, h, key, tint) => { P.push(box(x, y, z + d / 2 - 0.15, w, h, 0.3, key, tint, RF), box(x, y, z - d / 2 + 0.15, w, h, 0.3, key, tint, RF), box(x + w / 2 - 0.15, y, z, 0.3, h, d - 0.6, key, tint, RF), box(x - w / 2 + 0.15, y, z, 0.3, h, d - 0.6, key, tint, RF)); };
    const acUnit = (P, x, y, z) => { P.push(box(x, y, z, 1.5, 0.95, 1.0, CORR2, ACG, RF), quad(x, y + 0.12, z + 0.51, 1.3, 0.7, 0, GRILL, 0x9aa0a6, { uv: [0.65, 0.7], kind: 'wall' }), quad(x, y + 0.12, z - 0.51, 1.3, 0.7, 180, GRILL, 0x9aa0a6, { uv: [0.65, 0.7], kind: 'wall' }), cyl(x, y + 0.95, z, 0.36, 0.08, null, IRON, { seg: 10 })); };
    /* a chiller: a long cabinet under two fans, louvres down both long sides, a high-voltage plate on its end */
    const chiller = (P, x, y, z, alongZ) => { const w = alongZ ? 1.8 : 3.6, d = alongZ ? 3.6 : 1.8;
        P.push(box(x, y, z, w, 1.7, d, CORR2, ACG, RF));
        for (const f of alongZ ? 'lr' : 'fb') wQuad(P, f, x, z, w, d, 0, y + 0.2, 3.2, 1.2, 0.01, GRILL, 0x9aa0a6, { uv: [1.2, 1.2], kind: 'wall' });
        wQuad(P, alongZ ? 'f' : 'r', x, z, w, d, 0, y + 0.6, 0.6, 0.6, 0.02, S_VOLT, WHITE, { uv: 'fit' });
        P.push(cyl(alongZ ? x : x - 0.9, y + 1.7, alongZ ? z - 0.9 : z, 0.62, 0.12, null, IRON, { seg: 12, n: 2, step: alongZ ? [0, 0, 1.8] : [1.8, 0, 0] })); };
    const roofVent = (P, x, y, z) => { P.push(cyl(x, y, z, 0.22, 0.7, ALU, 0xc0c4c8, { seg: 8 }), cyl(x, y + 0.7, z, 0.4, 0.14, ALU, 0xc0c4c8, { seg: 8, r2: 0.1 })); };
    const duct = (P, x, y, z, len, alongZ) => P.push(box(x, y + 0.25, z, alongZ ? 0.6 : len, 0.5, alongZ ? len : 0.6, ALU, 0xc0c4c8, RF), box(alongZ ? x : x - len / 2 + 0.4, y, alongZ ? z - len / 2 + 0.4 : z, 0.5, 0.25, 0.5, null, IRON, { n: Math.max(2, Math.round(len / 2.2)), step: alongZ ? [0, 0, 2.2] : [2.2, 0, 0] }));
    /* the stair head: a little house on the roof with a door and a plate */
    const stairHead = (P, x, y, z, key, tint) => { P.push(box(x, y, z, 2.6, 2.5, 3.0, key || CONC2, tint || 0xb8b4aa, RF), box(x, y + 2.5, z, 3.0, 0.16, 3.4, CONC, 0x94989e, { under: true }), quad(x, y, z + 1.52, 1.1, 2.1, 0, U('DoorPaintedHalf2a'), 0xc8c8c0, { uv: [1.1, 2.1], kind: 'wall' }), quad(x + 0.95, y + 1.2, z + 1.52, 0.42, 0.42, 0, S_CAUT, WHITE, { uv: 'fit' })); };
    const tank = (P, x, y, z, r) => { P.push(cyl(x, y, z, 0.08, 1.3, null, IRON, { seg: 4, ring: { n: 4, r: r * 0.7, a0: 45 } }), cyl(x, y + 1.3, z, r, 2.1, 'wood', 0xa89070, { seg: 12 }), cyl(x, y + 3.4, z, r + 0.1, 0.7, null, 0x50545c, { seg: 12, r2: 0.1 }), cyl(x, y + 1.9, z, r + 0.03, 0.1, null, IRON, { seg: 12, cap: false, n: 2, step: [0, 1.0, 0] })); };
    const skylight = (P, x, y, z, w, d) => P.push(box(x, y, z, w, 0.35, d, ALU, 0xc0c4c8, { keyTop: U('GlassWindowFactory1a') }));
    const truss = (P, x, y, z, w, h) => P.push(quad(x, y, z, w, h, 0, TRUSS, 0x50545c, { uv: [h, h], kind: 'over', ds: true }));

    const BY = {
        /* 1. the hotel: its name in gold standing on the marquee and down a red blade on the tower, belt courses and a checker frieze, deco
              fins on the crown, a rail round the sky bar, plant on the crown's ledge, the pool's coping; the back is the service side */
        'P08-00-B1': (T, P) => {
            const F = T.D / 2, Y = T.H, tx = 3, tz = -3, TW = 17.5, CRM = 0xd9c8a4, tf = tz + TW / 2;
            letters(P, 'HOTEL', 0, 5.25, F + 2.55, 1.0, 'gold', WHITE, { gain: 1.5, depth: 0.16 });
            P.push(box(tx + 5.6, Y + 7.6, tf + 0.2, 2.3, 11.6, 0.3, null, 0x7a1420), box(tx + 5.6, Y + 7.4, tf + 0.22, 2.6, 0.2, 0.36, 'gold', WHITE, { gain: 1.5, n: 2, step: [0, 11.8, 0] }));
            letters(P, 'HOTEL', tx + 5.6, Y + 16.6, tf + 0.35, 1.6, 'gold', WHITE, { gain: 1.5, down: true });
            for (let k = 1; k <= 6; k += 2) belt(P, tx, Y + k * 3.5 - 0.09, tz, TW, TW, STONE, CRM, 0.24, { top: false });
            P.push(box(tx, Y + 23.5, tz, TW + 0.16, 0.9, TW + 0.16, CHKG, 0xf0e6d0, { uv: 0.9, top: false }));
            for (const s of [-1, 1]) P.push(box(tx + s * 4.2, Y + 24.5, tf - 1.65, 0.5, 5.6, 0.45, STONE, CRM), box(tx + s * 4.2, Y + 24.5, tz - 7.1, 0.5, 5.6, 0.45, STONE, CRM));
            railing(P, tx, Y + 24.5, tf - 0.2, TW - 2.2, false, 0xd0d6da); railing(P, tx, Y + 24.5, tz - TW / 2 + 0.2, TW - 2.2, false, 0xd0d6da); railing(P, tx + TW / 2 - 0.2, Y + 24.5, tz, TW - 2.2, true, 0xd0d6da); railing(P, tx - TW / 2 + 0.2, Y + 24.5, tz, TW - 2.2, true, 0xd0d6da);
            acUnit(P, tx - 3, Y + 28, tz - 6.1); acUnit(P, tx + 3, Y + 28, tz - 6.1); roofVent(P, tx - 6.1, Y + 28, tz + 3); roofVent(P, tx + 6.1, Y + 28, tz - 3);
            P.push(box(-9, Y, 9, 7.6, 0.14, 4.6, STONE, 0xe6dcc8, { top: false }));                                                        // the pool's coping
            P.push(box(-3.6, 4.2, F + 1.75, 0.3, 0.1, 0.3, null, LAMP, { glow: 1, n: 5, step: [1.8, 0, 0] }));                             // the marquee's lamps
            dentils(P, 0, Y - 0.95, F + 0.28, T.W, STONE, CRM);
            for (const x of [-12.6, 12.6]) pipe(P, x, -F - 0.12, Y - 0.7, 0x8a8478);
            for (const a of [-9, -3, 3, 9]) wallAC(P, 'b', 0, 0, T.W + 0.1, T.D + 0.1, a, 2.2);
            grille(P, 'b', 0, 0, T.W + 0.1, T.D + 0.1, 6, 0.4, 2.4, 1.2); grille(P, 'b', 0, 0, T.W + 0.1, T.D + 0.1, -6, 0.4, 2.4, 1.2);
            P.push(box(0, 0, 0, T.W + 0.3, 0.6, T.D + 0.3, GUN, 0x606068, { top: false, faces: 'blr' }));
        },
        /* 2. the archive: formwork lines, its name cast over the slits, a hood and a lamp at the door, grilles high on the sides, the lid a real roof */
        'P09-00-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2;
            for (const y of [3.8, 7.6]) P.push(box(0, y, 0, W + 0.16, 0.07, D + 0.16, null, 0x70747a, { top: false }));
            letters(P, 'ARCHIVE', 1.6, 10.45, F + 0.06, 0.6, null, 0x30343a);
            P.push(box(3.5, 2.75, F + 0.5, 2.8, 0.14, 1.0, CONC, 0x94989e, { under: true })); lamp(P, 5.0, 1.9, F + 0.06); plate(P, 'f', 0, 0, W + 0.1, D + 0.1, 2.0, 1.4, 0.5, S_NO);
            for (const f of 'lr') for (const a of [-4, 0, 4]) grille(P, f, 0, 0, W + 0.1, D + 0.1, a, 9.0, 1.6, 0.9);
            pipe(P, W / 2 - 0.5, -F - 0.12, 11.3); wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, -3, 2.4); wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, 3, 2.4);
            deck(P, 0, 12.8, 0, W + 1.6, D + 1.6); parapet(P, 0, 12.8, 0, W + 2.2, D + 2.2, 0.45, CONC, 0xa4a8ac);
            chiller(P, 2.5, 12.8, -3.5); roofVent(P, 5.5, 12.8, 3); roofVent(P, 5.5, 12.8, 1.2); stairHead(P, -3, 12.8, -3.6); duct(P, 0.5, 12.8, 2.6, 6.5);
        },
        /* 3. the Goblin Bank: BANK in gold on the entablature, dentils under both cornices, a base course, pilasters between the drum's
              windows, sills and heads on the side windows, gold acroteria, a checker floor under the portico, plant hidden behind the attic */
        'P10-00-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2, lx = T.lx, TR = 0xd2dcc8;
            letters(P, 'BANK', lx, 12.7, F + 5.1, 1.0, 'gold', WHITE, { gain: 1.5, depth: 0.16 });
            dentils(P, lx, 13.8, F + 5.25, 21.6, STONE, TR); dentils(P, 0, 14.7, -F - 0.22, W, STONE, TR); dentils(P, W / 2 + 0.52, 14.7, 0, D, STONE, TR, true); dentils(P, -W / 2 - 0.52, 14.7, 0, D, STONE, TR, true);
            P.push(box(0, 0, 0, W + 0.4, 1.3, D + 0.4, STONE, 0xb4bca8, { top: false, faces: 'blr' }), box(0, 1.3, 0, W + 0.5, 0.16, D + 0.5, STONE, TR, { top: false, faces: 'blr' }));
            P.push(box(0, 19.1, 0, 0.7, 3.6, 0.35, STONE, TR, { ring: { n: 16, r: 8.3, a0: 11.25 }, top: false }));
            for (const s of [-1, 1]) P.push(box(s * (W / 2 + 0.14), 10.6, -8.25, 0.24, 0.3, 2.1, STONE, TR, { n: 6, step: [0, 0, 3.3] }), box(s * (W / 2 + 0.14), 3.22, -8.25, 0.34, 0.25, 2.3, STONE, TR, { n: 6, step: [0, 0, 3.3] }));
            P.push(dome(lx, 18.1, F + 5.0, 0.5, 0.7, 'gold', WHITE, { roof: false }), dome(lx - 10.9, 14.5, F + 5.0, 0.4, 0.5, 'gold', WHITE, { roof: false }), dome(lx + 10.9, 14.5, F + 5.0, 0.4, 0.5, 'gold', WHITE, { roof: false }));
            deck(P, lx, 0.3, F + 2.5, 21.6, 4.6, CHKG, 0xe8f0e0, 3.5);
            deck(P, 0, 19.1, 0, 20.6, 18.6, ROOFT, 0xb8bcb0); railing(P, 0, 19.1, 9.3, 20.4, false, 0xd0d6da, RF); railing(P, 0, 19.1, -9.3, 20.4, false, 0xd0d6da, RF); railing(P, 10.3, 19.1, 0, 18.4, true, 0xd0d6da, RF); railing(P, -10.3, 19.1, 0, 18.4, true, 0xd0d6da, RF);
            for (const x of [-6, 0, 6]) acUnit(P, x, 15.9, -10.7); roofVent(P, -9.5, 15.9, -10.7); roofVent(P, 9.5, 15.9, -10.7);
            for (const s of [-1, 1]) lamp(P, lx + s * 4.4, 3.4, F + 0.06);
            pipe(P, W / 2 - 1, -F - 0.12, 14.6, 0xa8b09c); pipe(P, -W / 2 + 1, -F - 0.12, 14.6, 0xa8b09c);
        },
        /* 4. the executive court: fins down the glass, a canopy on rods, a ceiling-tile soffit and its lamps under the slab, a louvred plant
              yard, a rail and the helipad's lights on the roof */
        'P11-00-B1': (T, P) => {
            const W = 28, D = 13, cz = 1.0, FR = cz + D / 2, LF = T.D / 2;
            P.push(box(-W / 2 + 4.6, 5.25, FR + 0.2, 0.1, 17.5, 0.4, ALU, 0xe8eef2, { n: 12, step: [1.95, 0, 0], top: false }));
            P.push(box(0, 3.1, LF + 1.3, 6, 0.16, 2.6, ALU, 0xe8eef2, { under: true }), cyl(-2.6, 3.26, LF + 2.3, 0.03, 1.85, null, IRON, { seg: 4, n: 2, step: [5.2, 0, 0] }));
            P.push(box(1.6, 5.19, cz, W - 3.6, 0.06, D - 0.4, FIBRE, 0xe8e8e4, { under: true, top: false, sides: false, uv: 1.75 }), box(-9, 5.08, cz + 3, 1.2, 0.1, 0.3, null, LAMP, { glow: 1, n: 6, step: [4, 0, 0], under: true }), box(-9, 5.08, cz - 3, 1.2, 0.1, 0.3, null, LAMP, { glow: 1, n: 6, step: [4, 0, 0], under: true }));
            P.push(box(-6, 22.75, cz, 7.6, 2.4, 5.6, GRILL, 0x9aa0a6, { top: false, uv: 1.2 }), box(-6, 22.75, cz, 7.0, 1.7, 5.0, CORR2, ACG, RF), cyl(-7.6, 24.45, cz, 1.0, 0.12, null, IRON, { seg: 12, n: 2, step: [3.2, 0, 0] }));
            railing(P, 3, 22.75, FR - 0.3, W - 7, false, 0xd0d6da, RF); railing(P, 3, 22.75, cz - D / 2 + 0.3, W - 7, false, 0xd0d6da, RF); railing(P, W / 2 - 0.3, 22.75, cz, D - 0.6, true, 0xd0d6da, RF);
            P.push(box(3, 23.0, cz, 0.26, 0.16, 0.26, null, 0x40ff60, { glow: 1, ring: { n: 8, r: 4.5 } }));
            acUnit(P, -W / 2 + 1.6, 26.5, cz - 3); roofVent(P, -W / 2 + 1.6, 26.5, cz + 3); P.push(cyl(-W / 2 + 1.6, 26.5, cz, 0.06, 5, null, 0xc0c0c0, { seg: 4 }));
            for (const a of [-3, 0, 3]) grille(P, 'l', -W / 2 + 1.6, cz, 3.2, D + 0.2, a, 1.0, 1.8, 1.0);
        },
        /* 5. the members club: a belt course, a brass plate by the door, a checker step under the awning, caps and pots on the stacks, dentils,
              pipes, AC boxes on the back (the roof is walked: it stays clear) */
        'P08-01-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2, Y = T.H, dx = -W / 4 - 1;
            belt(P, 0, 3.3, 0, W, D, STONE, 0xe2dac8, 0.2, { top: false });
            P.push(box(dx + 1.6, 1.25, F + 0.08, 0.5, 0.36, 0.06, 'gold', WHITE, { gain: 1.5 }));
            deck(P, dx, 0, F + 1.3, 3.4, 2.4, CHKB, 0xf0e8dc, 1.7);
            for (const s of [-1, 1]) P.push(box(s * (W / 2 - 1.0), Y + 3.4, -F + 1.0, 1.44, 0.2, 1.44, STONE, 0xe2dac8), cyl(s * (W / 2 - 1.0) - 0.25, Y + 3.6, -F + 1.0, 0.16, 0.6, null, 0xb06a50, { seg: 8, n: 2, step: [0.5, 0, 0] }));
            pipe(P, -W / 2 - 0.12, -F + 2.4, Y - 0.6); pipe(P, W / 2 + 0.12, -F + 2.4, Y - 0.6);
            wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, -5.6, 2.5); wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, 5.6, 5.9); grille(P, 'b', 0, 0, W + 0.1, D + 0.1, 0, 0.3, 1.6, 0.7);
            dentils(P, 0, Y - 0.82, F + 0.24, W, STONE, 0xe2dac8);
        },
        /* 6. the caterer yard: its trade on the yard wall, bumpers and a yellow edge on the dock, caution plates between the shutters, a tile
              dado on the kitchen, bollards at the yard's mouth, a real roof on the dock wing, caps on the stacks, lamps, pipes */
        'P09-01-B1': (T, P) => {
            const Wf = T.W, nd = T.D, F = nd / 2, wl = 17.5, wz = F + wl / 2, ww = 9, dk = -Wf / 2 + ww, kx = Wf / 2 - ww;
            letters(P, 'CATERING', 1.4, 5.45, F + 0.06, 0.8, null, 0xf4f0e4);
            P.push(box(dk + 2.86, 0.45, wz - 5.6, 0.12, 0.5, 0.5, null, IRON, { n: 3, step: [0, 0, 5.6] }), box(dk + 2.8, 1.08, wz, 0.08, 0.14, wl - 2, null, YEL));
            for (const a of [-2.8, 2.8]) P.push(quad(dk + 0.08, 2.2, wz + a, 0.7, 0.7, 270, S_CAUT, WHITE, { uv: 'fit' }));
            P.push(quad(kx - 0.07, 0, wz, wl - 0.4, 1.9, 90, TILE, WHITE, { uv: [1.9, 1.9], kind: 'wall' }));
            for (const a of [-5, 5]) P.push(quad(kx - 0.08, 4.4, wz + a, 1.6, 0.9, 90, GRILL, 0x9aa0a6, { uv: [0.9, 0.9], kind: 'wall' }));
            bollards(P, -1.6, F + wl + 0.3, 4, 2.2);
            lamp(P, 3.6, 2.2, F + 0.06);
            const dcx = -Wf / 2 + ww / 2;
            deck(P, dcx, 6.3, wz, ww - 0.6, wl - 0.6); parapet(P, dcx, 6.3, wz, ww, wl, 0.4, CORR2, 0x8a98a0);
            chiller(P, dcx - 1.6, 6.3, wz - 4.5, true); chiller(P, dcx - 1.6, 6.3, wz + 1.5, true); acUnit(P, dcx + 2, 6.3, wz + 6.5); roofVent(P, dcx + 2.4, 6.3, wz - 6); roofVent(P, dcx + 2.4, 6.3, wz - 4.4); duct(P, dcx + 1.4, 6.3, wz - 0.5, 7, true);
            P.push(cyl(Wf / 2 - 1.3, 11.5, wz - 5.5, 0.7, 0.3, ALU, 0xb8bcc0, { seg: 12, r2: 0.2, n: 3, step: [0, 0, 4.75] }));
            pipe(P, -Wf / 2 - 0.12, F + 1, 6.0); pipe(P, Wf / 2 + 0.12, F + 1, 5.8); pipe(P, 6, F + wl + 0.12, 5.8);
            for (const a of [-9, -3, 3, 9]) wallAC(P, 'b', 0, 0, Wf + 0.1, nd + 0.1, a, 2.0);
            plate(P, 'f', 0, 0, Wf + 0.1, nd + 0.1, 0.5, 1.4, 0.5, S_HELM);
        },
        /* 7. the bank offices: BANK in gold on the stone core, a canopy on rods, a cleaning cradle on its davits, a roof deck with a louvred
              plant room, chillers, ducts, a stair head, a parapet rail */
        'P10-01-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2;
            letters(P, 'BANK', -W / 2 + 2.4, 8.4, F + 0.92, 0.85, 'gold', WHITE, { gain: 1.5 });
            P.push(box(T.lx, 3.2, F + 1.5, 5.4, 0.18, 1.9, ALU, 0xeef2f4, { under: true }), cyl(T.lx - 2.4, 3.38, F + 0.95, 0.03, 3.5, null, IRON, { seg: 4, n: 2, step: [4.8, 0, 0] }));
            P.push(box(9, 28.6, F + 1.3, 2.6, 1.1, 0.8, ALU, 0xc0c4c8, { top: false }), box(8, 31.5, F + 0.5, 0.12, 0.5, 2.0, null, IRON, { n: 2, step: [2, 0, 0] }), cyl(8, 29.7, F + 1.35, 0.02, 1.9, null, IRON, { seg: 4, n: 2, step: [2, 0, 0] }));
            deck(P, 2.4, 31.5, 0, W - 5, D + 1.0);
            for (const f of 'fb') wQuad(P, f, 5, 0, 10, 6, 0, 31.9, 9, 2.2, 0.02, GRILL, 0x9aa0a6, { uv: [1.1, 1.1], kind: 'wall' });
            chiller(P, -5, 31.5, 3.6); chiller(P, -5, 31.5, -3.6); acUnit(P, 13, 31.5, 4); acUnit(P, 13, 31.5, 1.6); roofVent(P, 11, 31.5, -5.5); duct(P, -1, 31.5, 0, 4.5); stairHead(P, 13, 31.5, -4.2);
            railing(P, 2.4, 31.5, F + 0.4, W - 5.4, false, 0xd0d6da, RF); railing(P, 2.4, 31.5, -F - 0.4, W - 5.4, false, 0xd0d6da, RF); railing(P, W / 2 - 0.1, 31.5, 0, D + 0.8, true, 0xd0d6da, RF);
            for (const y of [1.0, 13, 25]) grille(P, 'b', -W / 2 + 2.4, 0, 4.8, D + 1.8, 0, y, 2.4, 1.0);
            P.push(box(-W / 2 + 2.4, 35, 0, 5.0, 0.3, D + 2.0, CONC, 0xc8bca8, { under: true }));
        },
        /* 8. the vault annex: VAULT in gold on the portal, hazard plates on its piers, a rubber plinth, a rail on each step, grilles in the
              first step, cameras and floodlights on the front drums, plant on the cap, a red lamp over the door */
        'P11-01-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2, lx = T.lx;
            letters(P, 'VAULT', lx, 7.18, F + 1.0, 0.64, 'gold', WHITE, { gain: 1.5 });
            for (const s of [-1, 1]) P.push(quad(lx + s * 4.6, 1.0, F + 1.03, 1.0, 1.0, 0, S_HAZ, WHITE, { uv: 'fit' }), quad(lx + s * 4.6, 2.3, F + 1.03, 0.6, 0.6, 0, S_NO, WHITE, { uv: 'fit' }));
            P.push(box(0, 0, 0, W + 0.3, 0.9, D + 0.3, RUB, 0x9a9ca4, { top: false, faces: 'blr', uv: 0.9 }));
            for (const s of [-1, 1]) { const x = s * (W / 2 - 1.0), z = F - 1.0; P.push(box(x, 9.6, z + 2.45, 0.3, 0.26, 0.6, null, 0xe0e4e8), box(x, 9.9, z + 2.2, 0.08, 0.08, 0.5, null, IRON), box(x - s * 1.4, 12.0, z + 1.6, 0.5, 0.36, 0.3, null, LAMP, { glow: 1 })); }
            railing(P, 0, 3.7, F - 0.3, W - 7, false); railing(P, 0, 6.6, F - 0.95, W - 9, false); railing(P, 0, 9.4, F - 1.6, W - 9, false);
            for (const f of 'lr') for (const a of [-6, -2, 2, 6]) grille(P, f, 0, 0, W - 1.2, D - 1.2, a, 4.3, 1.8, 1.0);
            for (const s of [-1, 1]) { roofVent(P, s * 9.6, 13.5, 0); acUnit(P, s * 9.6, 13.5, -5); acUnit(P, s * 9.6, 13.5, 5); }
            P.push(box(lx, 8.05, F + 0.9, 0.22, 0.22, 0.22, null, 0xff3030, { glow: 1 }));
        },
        /* 9. the taxi court: TAXI lit on a truss on the canopy, a ceiling-tile soffit and its lamps, a tiled back wall, a checker band on the
              office, a roof deck, skylights and plant on the canopy, pipes */
        'P08-02-B1': (T, P) => {
            const full = 31.5, deep = 10.5, cx = full / 2 - 3.4, cz = 2.4, FZ = cz + deep / 2 + 1.7;
            truss(P, cx, 5.9, FZ - 0.52, 7.4, 1.9); letters(P, 'TAXI', cx, 6.1, FZ - 0.5, 1.5, null, YEL, { glow: 0.7, depth: 0.2 });
            P.push(box(cx, 5.33, cz + 0.5, full - 0.4, 0.06, deep + 1.6, FIBRE, 0xe8e8e4, { under: true, top: false, sides: false, uv: 1.75 }), box(cx - 12, 5.24, cz + 2, 2.2, 0.08, 0.3, null, LAMP, { glow: 1, n: 5, step: [6, 0, 0], under: true }));
            P.push(quad(cx, 0, -deep / 2 + 2.02, full - 0.4, 2.6, 0, TILE, WHITE, { uv: [2.6, 2.6], kind: 'wall' }), box(cx, 2.6, -deep / 2 + 2.05, full - 0.4, 0.12, 0.12, STONE, CR));
            P.push(box(0, 0.9, 0, T.W + 0.14, 0.6, T.D + 0.14, CHK, WHITE, { uv: 0.6, top: false, faces: 'bl' }));
            deck(P, cx, 5.9, cz - 0.5, full - 0.5, deep + 1.4); acUnit(P, 0, 5.9, -1.5); acUnit(P, 2.2, 5.9, -1.5); roofVent(P, -1.8, 5.9, -1.5); skylight(P, cx + 2, 5.9, cz - 1, 6, 2.4); skylight(P, cx - 8, 5.9, cz - 1, 6, 2.4);
            pipe(P, cx - full / 2 + 0.4, -deep / 2 + 2.1, 5.3); pipe(P, cx + full / 2 - 0.4, -deep / 2 + 2.1, 5.3);
        },
        /* the drivers' store: STORE on its fascia, a red tile riser under the glass, roof plant behind a parapet, a caution plate on the yard store */
        'P08-02-B2': (T, P) => {
            const W = T.W, D = T.D, F = D / 2, a = T.lx - T.cw / 2 - 0.35, b = T.lx + T.cw / 2 + 0.35;
            P.push(box(T.lx, 4.6, F + 1.25, 5.6, 0.1, 0.3, null, IRON)); letters(P, 'STORE', T.lx, 4.7, F + 1.2, 0.8, null, 0xe24a1c, { glow: 0.35, depth: 0.16 });
            P.push(box((-W / 2 + a) / 2, 0, F + 0.1, a + W / 2, 0.6, 0.12, TILER, WHITE, { uv: 0.6 }), box((W / 2 + b) / 2, 0, F + 0.1, W / 2 - b, 0.6, 0.12, TILER, WHITE, { uv: 0.6 }));
            parapet(P, 0, 4.4, 0, W + 0.1, D + 0.1, 0.4, null, 0xf2f2ee); acUnit(P, -5, 4.4, -1); acUnit(P, -2.6, 4.4, -1); roofVent(P, 5, 4.4, 0); skylight(P, 2, 4.4, 0.4, 3, 2);
            pipe(P, -W / 2 - 0.12, -F + 0.6, 4.2); P.push(quad(W / 2 + 4.0, 1.4, F - 0.4, 0.5, 0.5, 0, S_CAUT, WHITE, { uv: 'fit' }));
            P.push(box(-W / 2 + 2, 3.22, F + 0.8, 1.6, 0.08, 0.3, null, LAMP, { glow: 1, n: 5, step: [(W - 4) / 4, 0, 0], under: true }));
            wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, -4, 2.4); wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, 4, 2.4);
        },
        /* 11. the intelligence office: nothing written on it. Louvres in the dark foot, a no-entry plate, cameras under each tier, a rail,
               whips, a roof deck, louvred plant */
        'P10-02-B1': (T, P) => {
            const FW = 28, FD = 24.5, F = T.D / 2, R = 21.25;
            [[21, 17.5], [23.4, 19.8], [25.7, 22.2], [FW, FD]].forEach((t, i) => { for (const s of [-1, 1]) P.push(box(s * (t[0] / 2 - 0.5), 5.25 + i * 4 - 0.26, t[1] / 2 - 0.5, 0.26, 0.24, 0.5, null, 0xe0e4e8)); });
            for (const s of [-1, 1]) { grille(P, 'f', 0, 0, T.W + 0.1, T.D + 0.1, s * 6, 3.4, 4.4, 1.4, 0x60646c); grille(P, 'f', 0, 0, T.W + 0.1, T.D + 0.1, s * 6, 0.5, 4.4, 1.4, 0x60646c); }
            for (const f of 'lr') grille(P, f, 0, 0, T.W + 0.1, T.D + 0.1, 0, 3.4, 9, 1.4, 0x60646c);
            plate(P, 'f', 0, 0, T.W + 0.1, T.D + 0.1, T.lx + 2.4, 1.3, 0.6, S_NO);
            P.push(box(T.lx, 2.9, F + 1.0, 4.6, 0.2, 2.0, GUN, 0x80848c, { under: true }));
            for (const s of [-1, 1]) P.push(box(T.lx + s * 1.9, 2.6, F + 0.1, 0.2, 0.2, 0.12, null, 0xff3030, { glow: 1 }));
            deck(P, 0, R, 0, FW - 0.4, FD - 0.4);
            railing(P, 0, R, FD / 2 - 0.1, FW, false, IRON, RF); railing(P, 0, R, -FD / 2 + 0.1, FW, false, IRON, RF); railing(P, FW / 2 - 0.1, R, 0, FD, true, IRON, RF); railing(P, -FW / 2 + 0.1, R, 0, FD, true, IRON, RF);
            P.push(cyl(11, R, 9, 0.04, 6, null, 0xc0c0c0, { seg: 4, n: 3, step: [-1.6, 0, 0.4] }), cyl(-12, R, 9, 0.05, 4.2, null, 0xc0c0c0, { seg: 4 }));
            for (const f of 'fb') wQuad(P, f, 2, -1, 5, 4, 0, R + 0.3, 4.4, 1.6, 0.02, GRILL, 0x9aa0a6, { uv: [0.8, 0.8], kind: 'wall' });
            chiller(P, -2, R, 8.5); chiller(P, 6, R, -10.2); acUnit(P, -11.5, R, 4); acUnit(P, -11.5, R, 1.6); duct(P, 6, R, 3.6, 7); stairHead(P, 11.6, R, -2, CONC2, 0x8a8e96);
        },
        /* 12. the service garage: GARAGE on a truss over the bays, yellow posts and lamps between them, a helmet plate and a hazard plate,
               ridge vents, AC boxes and a pipe on the side */
        'P11-02-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2;
            truss(P, -2.45, 5.6, F + 0.36, 6.4, 1.4); letters(P, 'GARAGE', -2.45, 5.8, F + 0.38, 1.0, null, 0xc8402c, { depth: 0.16 });
            bollards(P, -W / 2 + 0.8, F + 0.4, 4, 6.2);
            for (let i = 1; i < 4; i++) lamp(P, -W / 2 + 0.8 + i * 6.2, 3.3, F + 0.12);
            plate(P, 'f', 0, 0, W + 0.06, D + 0.06, W / 2 - 3.2, 1.5, 0.6, S_HELM); plate(P, 'f', 0, 0, W + 0.06, D + 0.06, -W / 2 + 0.8, 1.9, 0.6, S_HAZ);
            for (const x of [-7, 0, 7]) roofVent(P, x, 8.85, 0);
            wallAC(P, 'l', 0, 0, W + 0.06, D + 0.06, -2, 3.0); wallAC(P, 'l', 0, 0, W + 0.06, D + 0.06, 2, 3.0); grille(P, 'r', 0, 0, W + 0.06, D + 0.06, 0, 3.0, 2.4, 1.2);
            pipe(P, -W / 2 - 0.1, F - 0.4, 5.5); pipe(P, W / 2 + 0.1, -F + 0.4, 5.5);
            P.push(box(0, 1.4, 0, W + 0.2, 0.12, D + 0.2, STONE, 0xa8a298, { top: false }));
        },
        /* 13. the finance arcade: ARCADE in gold on its frieze, keystones, a lantern in each arch, a checker floor under the loggia, sills and
               heads on the tall windows, dentils, finials, the clock's hands, plant on the back of the roof */
        'P08-03-B1': (T, P) => {
            const W = T.W, FD = 10.5, cz = 2.0, FF = cz + FD / 2, n = 4, bay = (W - 1) / n, TR = 0xe0c898;
            letters(P, 'ARCADE', 0, 5.5, FF + 0.08, 0.55, 'gold', WHITE, { gain: 1.5 });
            for (let a = 0; a < n; a++) { const x = -W / 2 + 0.5 + bay * (a + 0.5); P.push(box(x, 3.6 + bay / 2 - 0.85, FF + 0.06, 0.5, 0.7, 0.2, STONE, TR), box(x, 2.9, FF - 0.6, 0.3, 0.42, 0.3, null, LAMP, { glow: 1 }), cyl(x, 3.32, FF - 0.6, 0.02, 0.4, null, IRON, { seg: 4 })); }
            P.push(box(-W / 2 + 0.5 + bay / 2, 6.05, FF + 0.2, 2.2, 0.16, 0.36, STONE, TR, { n, step: [bay, 0, 0] }), box(-W / 2 + 0.5 + bay / 2, 10.8, FF + 0.16, 2.1, 0.24, 0.28, STONE, TR, { n, step: [bay, 0, 0] }));
            deck(P, 0, 0, (T.D / 2 + FF) / 2, W - 1, FF - T.D / 2 - 0.1, CHKB, 0xf4ead8, 3.5);
            P.push(box(0, 13.0, FF + 0.1, 0.07, 0.6, 0.05, null, IRON), box(0.2, 13.0, FF + 0.1, 0.44, 0.07, 0.05, null, IRON));
            for (const s of [-1, 1]) P.push(box(s * (W / 2 - 0.2), 12.75, FF - 0.3, 0.6, 0.7, 0.6, STONE, TR), dome(s * (W / 2 - 0.2), 13.45, FF - 0.3, 0.3, 0.4, STONE, TR, { roof: false }));
            dentils(P, 0, 11.9, FF + 0.2, W, STONE, TR);
            acUnit(P, -W / 2 + 2, 12.75, cz - FD / 2 + 0.9); acUnit(P, W / 2 - 2, 12.75, cz - FD / 2 + 0.9); roofVent(P, 0, 12.75, cz - FD / 2 + 0.9);
            pipe(P, -W / 2 - 0.12, cz - FD / 2 + 1, 12.0, 0x6a5a40); pipe(P, W / 2 + 0.12, cz - FD / 2 + 1, 12.0, 0x6a5a40);
            wallAC(P, 'b', 0, cz, W + 0.1, FD + 0.1, -3, 6.2); wallAC(P, 'b', 0, cz, W + 0.1, FD + 0.1, 3, 6.2);
        },
        /* the news kiosk: NEWS under its eave, a lamp at each end, a checker foot */
        'P08-03-B2': (T, P) => { const F = T.D / 2; letters(P, 'NEWS', 0, 2.9, F + 0.12, 0.4, null, 0xf4ecd8); for (const s of [-1, 1]) lamp(P, s * (T.W / 2 - 0.6), 2.2, F + 0.06); P.push(box(0, 0, 0, T.W + 0.16, 0.8, T.D + 0.16, CHK, WHITE, { uv: 0.8, top: false })); },
        /* 15. the penthouse stair: a stone ground storey, frosted balustrades and a hand rail on every ring, an AC box on every back balcony,
               a rail round the roof terrace, plant and a whip on the stair shaft */
        'P10-03-B1': (T, P) => {
            const W = T.W, D = T.D, F = D / 2, H = 31.5, FR = 0x9fb4c2, N = { n: 8, step: [0, 3.5, 0] };
            P.push(box(0, 0, 0, W + 0.16, 3.38, D + 0.16, STONE, CR, { faces: 'blr', top: false, uv: 3.5 }));
            P.push(box(0, 3.63, F + 0.84, W - 5.2, 0.85, 0.04, null, FR, N), box(0, 4.5, F + 0.84, W - 5.2, 0.05, 0.08, ALU, WHITE, N), box(-1.6, 3.63, -F - 0.84, W - 5.4, 0.85, 0.04, null, FR, N), box(-1.6, 4.5, -F - 0.84, W - 5.4, 0.05, 0.08, ALU, WHITE, N));
            P.push(box(-W / 2 - 0.84, 3.63, -0.6, 0.04, 0.85, D - 1.4, null, FR, N), box(-W / 2 - 0.84, 4.5, -0.6, 0.08, 0.05, D - 1.4, ALU, WHITE, N), box(W / 2 + 0.84, 3.63, -0.2, 0.04, 0.85, D - 3.4, null, FR, N), box(W / 2 + 0.84, 4.5, -0.2, 0.08, 0.05, D - 3.4, ALU, WHITE, N));
            P.push(box(-3.5, 3.63, -F - 0.4, 0.95, 0.6, 0.5, CORR2, ACG, N));
            railing(P, 0, H + 0.4, F + 1.1, W + 2.2, false, 0xd0d6da, RF); railing(P, -W / 2 - 1.1, H + 0.4, 0, D + 2.2, true, 0xd0d6da, RF); railing(P, W / 2 + 1.1, H + 0.4, 0.9, D + 0.4, true, 0xd0d6da, RF);
            acUnit(P, W / 2 - 1.4, H + 5, -F - 1.0); P.push(cyl(W / 2 - 0.3, H + 5, -F - 2.1, 0.05, 6, null, 0xd0d0d0, { seg: 4 }), box(W / 2 - 0.3, H + 11, -F - 2.1, 0.3, 0.3, 0.3, null, 0xff3030, { glow: 1 }));
            for (const s of [-1, 1]) lamp(P, T.lx + s * 1.9, 2.0, F + 0.06);
        },
        /* 16. the private garden: piers along the wall, lanterns on the gate, a paved walk round the fountain, urns, ivy on the wall, glazing
               bars and a ridge crest on the palm house */
        'P11-03-B1': (T, P) => {
            const cz = 3, GD = 28, GW = 28, hw = GW / 2, F = cz + GD / 2, gp = 2.6, ST = CR, PF = T.D / 2;
            P.push(box(-hw, 0, cz - GD / 2, 0.9, 3.3, 0.9, STONE, ST, { n: 7, step: [GW / 6, 0, 0] }), box(-hw, 0, cz - GD / 2 + GD / 6, 0.9, 3.3, 0.9, STONE, ST, { n: 5, step: [0, 0, GD / 6] }), box(hw, 0, cz - GD / 2 + GD / 6, 0.9, 3.3, 0.9, STONE, ST, { n: 5, step: [0, 0, GD / 6] }));
            for (const s of [-1, 1]) { P.push(box(s * hw, 0, F, 0.9, 3.3, 0.9, STONE, ST), box(s * (gp + (hw - gp) / 2), 0, F, 0.9, 3.3, 0.9, STONE, ST)); lamp(P, s * gp, 2.9, F + 0.6); }
            P.push(cyl(0, 0, cz + 8.5, 3.4, 0.05, PAVE, 0xe8dcc0, { seg: 20 })); deck(P, 0, 0, cz + 12.9, 2.4, 2.2, PAVE, 0xe8dcc0); deck(P, 0, 0, (PF + cz + 5.2) / 2, 2.4, cz + 5.2 - PF, PAVE, 0xe8dcc0);
            for (const p of [[-2.2, 2.6], [2.2, 2.6], [-2.2, 13.2], [2.2, 13.2]]) P.push(cyl(p[0], 0, cz + p[1], 0.3, 0.7, STONE, ST, { seg: 8, r2: 0.5 }), dome(p[0], 0.7, cz + p[1], 0.5, 0.45, 'leaves_3', 0xc8e8b8, { roof: false }));
            for (const x of [-9.5, 7.5]) P.push(box(x, 0.2, F + 0.33, 3.4, 2.5, 0.08, 'leaves_3', 0xa8d098, { top: false }));
            P.push(box(hw + 0.33, 0.2, cz - 4, 0.08, 2.5, 4.2, 'leaves_3', 0xa8d098, { top: false }), box(-hw - 0.33, 0.2, cz + 5, 0.08, 2.5, 3.6, 'leaves_3', 0xa8d098, { top: false }));
            for (const s of [-1, 1]) P.push(box(s * (T.W / 2 - 0.8), 7.55, 0, 0.08, 0.4, 0.08, ALU, WHITE, { n: 7, step: [-s * 1.0, 0, 0] }));
            for (let x = -T.W / 2 + 0.9; x < T.W / 2; x += 1.75) if (Math.abs(x - T.lx) > 1.3) P.push(box(x, 0.7, PF + 0.08, 0.1, 3.2, 0.1, ALU, WHITE, { top: false }));
            P.push(box(0, 2.3, PF + 0.08, T.W, 0.08, 0.1, ALU, WHITE, { top: false }));
        },
    };
    /* ── the repeating kinds ── */
    const KIND = {
        /* the bankers' terrace: a hood on brackets over each door, rails down the stoop, a window box, belt courses, a pot on the stack, a pipe
           between houses; the back has a door, a pipe and the AC boxes */
        terrace: (T, P) => {
            const n = T.n, hw = T.W / n, D = T.D;
            for (let i = 0; i < n; i++) {
                const x = -T.W / 2 + hw * (i + 0.5), H = 10.5 + (i % 2) * 0.6, dx = x - hw * 0.22;
                P.push(roof('shed', dx, 3.05, D / 2 + 0.55, 2.4, 0.45, 1.0, GUN, 0x7a8496, { under: true, roof: false }), box(dx - 1.0, 2.5, D / 2 + 0.5, 0.1, 0.55, 0.9, STONE, CR, { n: 2, step: [2.0, 0, 0] }));
                P.push(box(x + hw * 0.2, 1.1, D / 2 + 0.3, Math.min(1.9, hw * 0.36), 0.3, 0.4, null, 0x3a2a20), box(x + hw * 0.2, 1.4, D / 2 + 0.3, Math.min(1.7, hw * 0.32), 0.22, 0.3, 'leaves_3', 0xc8e8b8));
                P.push(box(x + hw / 2 - 0.6, H + 4.6, -D / 4, 1.1, 0.16, 1.1, STONE, CR), cyl(x + hw / 2 - 0.6, H + 4.76, -D / 4, 0.18, 0.6, null, 0xb06a50, { seg: 8 }));
                railing(P, dx - 1.05, 0.35, D / 2 + 0.78, 1.2, true); railing(P, dx + 1.05, 0.35, D / 2 + 0.78, 1.2, true); lamp(P, dx + 1.3, 2.3, D / 2 + 0.1);
                P.push(box(x, 3.45, D / 2 + 0.08, hw - 0.3, 0.14, 0.16, STONE, CR), box(x, 6.9, D / 2 + 0.08, hw - 0.3, 0.14, 0.16, STONE, CR));
                if (i) pipe(P, x - hw / 2, D / 2 + 0.14, H - 0.2);
                wallAC(P, 'b', x, 0, hw, D + 0.1, (i % 2 ? -1 : 1) * hw * 0.25, 4.3 + (i % 2) * 3.5); pipe(P, x + hw / 2 - 0.3, -D / 2 - 0.14, H - 0.2);
                P.push(quad(x - hw * 0.2, 0, -D / 2 - 0.07, 1.1, 2.3, 180, U('DoorPaintedHalf1a'), 0x8a8a80, { uv: [1.1, 2.3], kind: 'wall' }));
            }
        },
        /* the small shop: its trade on the awning's valance, mullions and a red tile riser on the glass front, sills, a lamp, a pipe, AC
           boxes on the side and the back; the roof (where it is not walked) has a deck, plant and a stair head */
        shop: (T, P) => {
            const W = T.W, D = T.D, H = T.H || 7, o = T.o || {}, gw = W - 4.2, m = Math.max(2, Math.round(gw / 1.6)) + 1;
            P.push(box(0, 2.75, D / 2 + 1.98, W - 0.4, 0.56, 0.06, null, o.trim));
            if (o.sign) letters(P, o.sign, 0, 2.85, D / 2 + 2.01, 0.36, null, 0xf4ecd8, { depth: 0.05 });
            P.push(box(0.9 - gw / 2, 0.5, D / 2 + 0.14, 0.09, 2.7, 0.09, null, IRON, { n: m, step: [gw / (m - 1), 0, 0] }), box(0.9, 0, D / 2 + 0.24, gw, 0.5, 0.06, TILER, WHITE, { uv: 0.5 }));
            P.push(box(0, 6.56, D / 2 + 0.1, W - 1.2, 0.12, 0.16, STONE, 0xd0c8b8), box(0, 4.2, D / 2 + 0.1, W - 1.2, 0.12, 0.2, STONE, 0xd0c8b8));
            lamp(P, -W / 2 + 0.5, 2.6, D / 2 + 0.1); pipe(P, W / 2 + 0.12, D / 2 - 0.5, H - 0.5);
            wallAC(P, 'r', 0, 0, W + 0.1, D + 0.1, -D / 4, 4.6); grille(P, 'l', 0, 0, W + 0.1, D + 0.1, 0, 0.6, 1.2, 0.8); wallAC(P, 'b', 0, 0, W + 0.1, D + 0.1, W / 4, 4.6);
            P.push(quad(-W / 4, 0, -D / 2 - 0.07, 1.1, 2.3, 180, U('DoorPaintedHalf1a'), 0xa8a8a0, { uv: [1.1, 2.3], kind: 'wall' }));
            if (!T.H) { deck(P, 0, H, 0, W - 0.6, D - 0.6); acUnit(P, W / 4, H, -D / 4); roofVent(P, -W / 4, H, D / 4); if (D > 7 && W > 7) stairHead(P, -W / 4, H, -D / 4); }
        },
        /* the workshop: a lintel and a lamp over the roller door, posts beside it, a hazard plate, a band on the dado, pipes, an AC box, a flue */
        workshop: (T, P) => {
            const W = T.W, D = T.D, flat = !!T.H, H = flat ? T.H - 0.02 : 5.6;
            lamp(P, 1.2, 3.75, D / 2 + 0.12); pipe(P, -W / 2 - 0.1, D / 2 - 0.5, H - 0.3); pipe(P, W / 2 + 0.1, -D / 2 + 0.5, H - 0.3);
            bollards(P, -1.25, D / 2 + 0.4, 2, 4.9); P.push(box(1.2, 3.62, D / 2 + 0.16, 4.6, 0.14, 0.2, null, IRON));
            plate(P, 'f', 0, 0, W + 0.1, D + 0.1, -1.7, 1.6, 0.55, S_HAZ);
            if (!flat) P.push(cyl(W / 2 - 1.2, H, -D / 2 + 1.2, 0.3, 3.4, ALU, 0xc0c4c8, { seg: 8 }), cyl(W / 2 - 1.2, H + 3.4, -D / 2 + 1.2, 0.45, 0.2, ALU, 0xc0c4c8, { seg: 8, r2: 0.15 }));
            P.push(box(0, 1.5, 0, W + 0.24, 0.1, D + 0.24, STONE, 0xa8a298, { top: false }));
            wallAC(P, 'l', 0, 0, W + 0.1, D + 0.1, D / 4, 3.0); grille(P, 'r', 0, 0, W + 0.1, D + 0.1, 0, 2.2, 1.6, 0.9); grille(P, 'b', 0, 0, W + 0.1, D + 0.1, 0, 2.2, 2.4, 0.9);
        },
        /* a back lot: a service door with a lamp and a plate, storey bands, AC boxes under the windows, pipes; the roof a deck behind a
           parapet with plant, and on the bigger ones a water tank or a stair head */
        backlot: (T, P) => {
            const W = T.W, D = T.D, H = T.Hh, i = T.i, glass = i % 3 === 1 && H > 6, R = H + 0.15;
            P.push(quad(-W / 2 + 1.6, 0, D / 2 + 0.07, 1.5, 2.4, 0, U('DoorPaintedHalf1a'), 0xc8c8c0, { uv: [0.75, 2.4], kind: 'wall' }), box(-W / 2 + 1.6, 2.4, D / 2 + 0.07, 1.8, 0.16, 0.2, STONE, 0xa8a298));
            lamp(P, -W / 2 + 1.6, 2.7, D / 2 + 0.07); if (W > 5) plate(P, 'f', 0, 0, W + 0.1, D + 0.1, -W / 2 + 2.9, 1.4, 0.45, i % 2 ? S_CAUT : S_VOLT);
            pipe(P, W / 2 - 0.5, D / 2 + 0.12, H - 0.4); if (W > 8) pipe(P, -W / 2 + 0.5, -D / 2 - 0.12, H - 0.4);
            for (let s = 1; s < H / 3.5 - 0.5; s++) { P.push(box(0, s * 3.5 - 0.08, 0, W + 0.24, 0.14, D + 0.24, STONE, 0xcfc8b8, { top: false })); if (!glass && W > 5) wallAC(P, s % 2 ? 'f' : 'b', 0, 0, W + 0.1, D + 0.1, (s % 2 ? 1 : -1) * W * 0.22, s * 3.5 + 0.3); }
            if (W > 4 && D > 4) {
                deck(P, 0, R, 0, W - 0.5, D - 0.5, i % 2 ? ROOFT : RUB, i % 2 ? 0xa8aaa4 : 0x8a8c90); parapet(P, 0, R, 0, W + 0.5, D + 0.5, 0.5, STONE, 0xcfc8b8);
                acUnit(P, W / 4, R, D / 4 - 0.4); if (W > 9) acUnit(P, W / 4 - 2, R, D / 4 - 0.4);
                if (W > 7 && D > 7) { if (i % 2) tank(P, -W / 4, R, -D / 5, Math.min(1.3, D / 4)); else stairHead(P, -W / 4, R, -D / 5); roofVent(P, W / 4, R, -D / 4); }
                else roofVent(P, -W / 4, R, 0);
                if (W > 12 && D > 8) { chiller(P, 0, R, -D / 4); duct(P, W / 8, R, 0.6, W / 3); }
            }
        },
    };
    return (T, P) => { const f = BY[T.id] || KIND[T.kind]; HOLLOW = !!(T.row && T.row.hollow); if (f) f(T, P); for (const q of P) if (q && q.key == null) delete q.key; };
};
