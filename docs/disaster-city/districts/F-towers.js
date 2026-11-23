/* DISASTER CITY · THE FINANCIAL DISTRICT · THE TOWERS (2026-11-23, mondo 17:00 on the skyline plan: "Build it, plus the mid-rise fill";
   the plan https://claude.ai/artifact/YEe54svVhVbLufjHdfQ5QY, its sites /mnt/project-files/skyline-plan/tools/towers.json). Required by F.js
   (not a district file: the tool reads only <LETTER>.js). Financial is London, so its towers are London's own outlines, made silly:
     1  THE SHARD-OW         150 m  over the Vault annex (P11-01-B1): a glass spike, open shards at the tip
     4  THE CHEESE GRATER    135 m  over the Tailor shops' workshop (P09-02-B3, now its lobby): one sloped face, a yellow frame, a yellow core
     5  THE WALKIE-TALKIE    130 m  over the Bank offices (P10-01-B1): wider as it rises, a glass sky garden on top; the clock tower stays
     15 THE PICKLE            95 m  the Executive court's curved glass tower (P11-00-B1) raised from 50 m (its walk-in lobby is the glass box)
     19 ACT OF GOD INSURANCE  85 m  over the Bank archive (P09-00-B1, now its lobby): inside-out, stair tubes, lifts, pipes and blue cranes outside
   THE LIMITS (the plan's frame-rate section): each tower is ONE arch row of its own, `dc:<id>:tower`, of at most FOUR materials (a material =
   sheet + tint + glow + kind: the renderer draws one mesh per material per row, so every part of one material is merged into one piece); no
   lamps and no glow (the window sheets are the lit look); the walk-in lobby is the building's own row and its inside (F-inside.js). Upper
   floors are windows only: no door above the lobby. Shapes come from the code parts only (no skyscraper pack exists; MODEL_LIST.md checked).
   Every tower is called with the building's frame T (F.js `frame`), its front at +z. */
'use strict';
module.exports = function (K) {
    const { box, cyl, dome, roof, quad, ALU, U } = K, r3 = v => Math.round(v * 1000) / 1000;
    const GT = U('GlassWindowTall1a'), GT4 = U('GlassWindowTall4a'), GS2 = U('GlassWindowSquare2a'), GS1 = U('GlassWindowSquare1a');
    const row = (T, parts) => ({ k: 'arch', id: 'dc:' + T.id + ':tower', x: T.x, z: T.z, y: 0, rot: T.rot, parts: parts.filter(Boolean) });
    /* the check the plan asks for: a tower over four materials is a bug in this file (the same key as the renderer's) */
    const mats = parts => { const s = new Set(); for (const p of parts) { const k = (P, key, tint) => s.add([key || '', tint >>> 0, +P.glow || 0, P.kind || '', P.ds ? 1 : 0, P.roof ? 1 : 0, P.gain || 1, P.shine || 0].join('|'));
        k(p, p.key, p.tint); if (p.keyTop && p.keyTop !== p.key) k(p, p.keyTop, p.tintTop != null ? p.tintTop : p.tint); if (p.keyEnd && p.keyEnd !== p.key) k(p, p.keyEnd, p.tintEnd != null ? p.tintEnd : p.tint); } return s.size; };
    const out = (T, parts, name) => { const R = row(T, parts), n = mats(R.parts); if (n > 4) throw new Error('[financial] tower ' + name + ' has ' + n + ' materials (the limit is 4)'); console.log('[financial] tower', name, R.parts.length, 'parts,', n, 'materials'); return R; };

    /* ═══ 1. THE SHARD-OW (150 m): the vault's dark podium (F.js keeps its ground storey and first step, 6.6 m), on it a pale glass spike in
           four faces, the top split into five shards that stand clear of each other at different heights, a steel mast in the gap ═══ */
    const shard = T => {
        const P = [], Y = 6.6, G = 0xe4eef8, GL = { roof: false, shine: 70, gain: 1.5 };   // (gain: the pack's dark glass lifted to the real one's pale silver)   // the faces are `roof` parts with the roof flag off: never hidden with HIDE ROOFS
        P.push(roof('pyramid', 0, Y, -0.6, 22.4, 128, 19.6, GT4, G, Object.assign({ uv: 3.5 }, GL)));                 // the body: apex 134.6 m
        /* the shards at the tip: slim spikes round the axis, each leaning out of the body to its own height (the real one's open top) */
        for (const s of [[1.6, 0.9, 5.6, 4.8, 96, 54], [-1.9, -1.4, 4.8, 4.4, 102, 41], [1.3, -2.2, 4.0, 3.6, 108, 34], [-1.1, 1.7, 3.6, 3.4, 112, 26], [0.2, -0.2, 2.4, 2.4, 118, 25.4]])
            P.push(roof('pyramid', s[0], s[4], -0.6 + s[1], s[2], s[5], s[3], GT4, G, Object.assign({ uv: 3.5 }, GL)));
        /* the base of the spike: a steel collar on the podium */
        P.push(box(0, Y, -0.6, 23.2, 0.6, 20.4, ALU, 0x9aa2aa, { top: false }));
        P.push(cyl(-0.3, 128, -0.8, 0.14, 21, ALU, 0x9aa2aa, { seg: 6, cap: false }));                                  // the mast in the gap, to 149 m
        return out(T, P, 'Shard-ow');
    };

    /* ═══ 4. THE CHEESE GRATER (135 m): a wedge, the back wall straight up, the front sloping back storey by storey from the full depth over
           the lobby to a blade at the top; a yellow frame down both edges of the slope, a yellow core of lifts up the back ═══ */
    const grater = T => {
        const P = [], W = T.W, D = T.D, Y0 = 7, n = 36, sh = 3.5, top = Y0 + n * sh, YEL = 0xe8b420, G = 0xc2cfdc;
        for (let k = 0; k < n; k++) { const t = (k + 1) / n, d = r3(D - (D - 2.4) * t), zc = -D / 2 + d / 2, y = Y0 + k * sh;
            P.push(box(0, y, zc, W, sh, d, GS1, G, { uv: 3.5, top: true, keyTop: ALU, tintTop: 0xb0b8c0, sides: true }));   // a storey: its top is the slope's step
            for (const s of [-1, 1]) P.push(box(s * (W / 2 + 0.2), y, zc + d / 2 - 0.25, 0.42, sh, 0.5, null, YEL)); }       // the yellow edge of the slope
        P.push(box(0, Y0 - 0.6, -D / 2 - 0.8, 7.0, top - Y0 + 4.6, 1.6, null, YEL));                                       // the core up the back
        for (const s of [-1, 1]) P.push(box(s * (W / 2 + 0.2), Y0 - 0.6, -D / 2 + 0.25, 0.42, top - Y0 + 0.6, 0.5, null, YEL));   // the back corners
        P.push(box(0, Y0 - 0.6, 0, W + 0.8, 0.6, D + 0.4, null, YEL, { under: true }));                                      // the frame's foot over the lobby
        P.push(box(0, top, -D / 2 + 1.2, W + 0.4, 1.0, 2.6, ALU, 0xb0b8c0), box(0, top + 1.0, -D / 2 - 0.8, 7.0, 3.2, 1.6, ALU, 0xb0b8c0));   // the blade's cap, the core's plant room
        return out(T, P, 'Cheese Grater');
    };

    /* ═══ 5. THE WALKIE-TALKIE (130 m): over the bank's glass lobby (7 m) a teal glass slab that grows deeper storey by storey, front and back
           bulging out on a curve, crowned by a sloping glass roof over a sky garden; the bank's gothic clock tower keeps its end of the row ═══ */
    const walkie = T => {
        const P = [], W = T.W, D = T.D, x0 = -W / 2 + 7.4, x1 = W / 2, w = x1 - x0, xc = (x0 + x1) / 2, Y0 = 7, n = 33, sh = 3.5, top = Y0 + n * sh;
        const TEAL = 0x9ae0d8, depth = k => r3(D + 10 * Math.pow(k / n, 1.5));
        for (let k = 0; k < n; k++) { const d = depth(k + 0.5), y = Y0 + k * sh;
            P.push(box(xc, y, 0, w, sh, d, GS2, TEAL, { uv: 3.5, top: false }));   // (no underside: the floor bands' own undersides close each step)
            if (k % 2 === 1) P.push(box(xc, y - 0.14, 0, w + 0.3, 0.28, d + 0.3, ALU, 0xeef2f4, { under: true })); }       // a floor band every second storey
        const dt = depth(n);
        P.push(box(xc, top, 0, w + 0.4, 0.5, dt + 0.4, ALU, 0xeef2f4));                                                     // the garden's floor, its rim
        /* the sky garden: planting under a sloping glass roof (clear: the green is seen through it), the roof high at the back */
        P.push(roof('shed', xc, top + 0.5, 0, w, 7.4, dt, GT4, 0xd8ecf0, { roof: false, kind: 'clear', keyEnd: GT4, tintEnd: 0xd8ecf0 }));
        P.push(box(xc, top + 0.5, 1.5, w - 3, 0.9, dt - 6, 'leaves_3', 0xa8d098));
        for (const t of [[-7, -2, 2.4], [-1.5, 3, 2.0], [4.5, -3.5, 2.6], [8.5, 2.5, 1.8]]) P.push(dome(xc + t[0], top + 1.4, t[1], t[2], t[2] * 1.2, 'leaves_3', 0xa8d098, { roof: false, seg: 10, rings: 4 }));
        P.push(box(xc - w / 2 + 0.2, top + 0.5, 0, 0.4, 7.4, dt, ALU, 0xeef2f4), box(xc + w / 2 - 0.2, top + 0.5, 0, 0.4, 7.4, dt, ALU, 0xeef2f4));   // the roof's end frames
        return out(T, P, 'Walkie-Talkie');
    };

    /* ═══ 19. ACT OF GOD INSURANCE (85 m): the inside-out tower. A glass core in steel bands; everything a tower hides is on the outside:
           four steel stair tubes at the corners (each its own height), two glass lift shafts on the sides, ducts and service pods up the
           front and back, a glass barrel vault over the atrium, and the blue window-cleaning cranes on the tubes' tops ═══ */
    const lloyds = T => {
        const P = [], Y0 = 7, ST = 0xd4dadf, GL = 0xb4c6d2, BLUE = 0x2a6cc8, S = { shine: 80 }, C = 8.2, cz = -0.4, coreTop = 74;
        P.push(box(0, Y0, cz, C, coreTop - Y0, C, GT4, GL, { uv: 3.5, top: false }));
        P.push(box(0, Y0, cz, C + 0.3, 0.3, C + 0.3, ALU, ST, Object.assign({ n: 20, step: [0, 3.5, 0], under: true }, S)));   // the steel floor bands
        P.push(roof('barrel', 0, coreTop, cz, C, 4.2, C, GT4, GL, { roof: false, seg: 10 }));                               // the atrium's vault
        const tubes = [[-1, -1, 78], [1, -1, 82], [-1, 1, 72], [1, 1, 76]];
        for (const t of tubes) { const x = t[0] * 5.2, z = t[1] * 5.2;
            P.push(cyl(x, Y0, z, 1.55, t[2] - Y0, ALU, ST, Object.assign({ seg: 14 }, S)), cyl(x, Y0, z, 1.7, 0.4, ALU, ST, Object.assign({ seg: 14, n: Math.floor((t[2] - Y0) / 7), step: [0, 7, 0] }, S)));   // (from the lobby's slab: the lobby under it is walked)   // a stair tube and its rings
            P.push(box(x - t[0] * 1.6, Y0, z * 0.55, 1.4, 0.5, 1.4, ALU, ST, Object.assign({ n: Math.floor((coreTop - Y0) / 7), step: [0, 7, 0] }, S))); }   // the bridges into the core
        for (const s of [-1, 1]) { const x = s * 5.25;
            P.push(box(x, Y0, cz, 1.7, 80 - Y0, 2.0, GT4, GL, { uv: 3.5 }), box(x, Y0, cz, 1.9, 0.3, 2.2, ALU, ST, Object.assign({ n: 21, step: [0, 3.5, 0] }, S)));   // a glass lift shaft
            P.push(box(x, 80, cz, 2.3, 2.4, 2.6, ALU, ST, S)); }                                                                 // its winding house
        for (const f of [-1, 1]) {   // the ducts and the service pods on the front and back
            P.push(cyl(-2.1, Y0, f * (C / 2 + 0.55) + cz, 0.36, coreTop - Y0 + 3, ALU, ST, Object.assign({ seg: 8, n: 3, step: [2.1, 0, 0] }, S)));
            P.push(box(0, Y0 + 3, f * (C / 2 + 1.1) + cz, 5.6, 1.4, 1.0, ALU, ST, Object.assign({ n: 9, step: [0, 7, 0] }, S))); }
        /* the blue cranes: a gantry on two tubes' tops, the trolley, the jib over the edge */
        for (const t of [tubes[1], tubes[0]]) { const x = t[0] * 5.2, z = t[1] * 5.2, y = t[2];
            P.push(box(x, y, z, 0.5, 3.2, 0.5, null, BLUE), box(x - t[0] * 1.6, y + 3.2, z, 4.6, 0.6, 0.6, null, BLUE), box(x + t[0] * 0.9, y + 2.4, z, 0.9, 0.8, 0.9, null, BLUE)); }
        P.push(cyl(-5.2, 78, -5.2, 0.12, 7, ALU, ST, Object.assign({ seg: 6, cap: false }, S)));                            // the mast to 85 m
        return out(T, P, 'Act of God Insurance');
    };

    return { shard, grater, walkie, lloyds, own: out };
};
