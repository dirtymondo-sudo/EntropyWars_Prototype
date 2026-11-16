/* LEYLINES · district Y · THE LEY LINE (9 plots: row 03; squares y 36..47, wall to wall). The old ley tunnels, brought up into the daylight:
   one line that does not bend, from the Desert's robbers' tunnel to the sea. The line's glow, the forks and the Nexus ring are the TOOL's
   (they cross every district's doorstep); this file is what stands along the line. One thread a file.
   STANDS TODAY (first build): a menhir every six squares down both sides; the Niches (stone alcoves with a fire, the old tunnels' sarcophagus
   and skull pile in two of them); four obelisks at the Nexus (the Healing Zone is the hub's own, placed by the game); a signpost at each fork;
   the West Mouth's stone frame (the Giza draught is in the west wall behind it) and the East Mouth's trilithon where the line leaves for the
   sea; the old tunnels' five people and their lines.
   NOT YET: the line's own light at night (lamps / glow posts), veins of light in the ground beside it, the Forks as more than one square of
   gold, a real tunnel mouth at the West Mouth, way stones with words, pilgrims. */
'use strict';
exports.build = ctx => {
    const { look, cx, cz } = ctx;
    const niche = (id, sx, sy, south) => look('niche:' + id, cx(sx), cz(sy), south ? 180 : 0, a => { a.box(-1.6, 0, 0, 0.7, 2.7, 1.6, 'rock_wall_1', 0xb8b0a0); a.box(1.6, 0, 0, 0.7, 2.7, 1.6, 'rock_wall_1', 0xb8b0a0);
        a.box(0, 2.7, 0, 4.2, 0.6, 1.8, 'rock_wall_1', 0xa8a090, { under: true }); a.box(0, 0, -0.7, 2.6, 2.7, 0.35, 'rock_wall_1', 0x989080); });
    exports._niches.forEach((q, i) => niche(i, q[0], q[1], q[1] > 42));
};
exports._niches = [[14, 38], [20, 38], [14, 45], [20, 45], [86, 38], [94, 38], [86, 45], [94, 45]];
exports.dress = ctx => {
    const { A, P, Pm, dec, cx, cz, gx, gz, taken } = ctx, f = A.forks, inFork = x => Object.keys(f).some(k => x >= f[k][0] - 1 && x <= f[k][1]);
    for (let x = 3; x < 108; x += 6) { if (inFork(x) || Math.abs(x + 0.5 - A.nexus.x) < 6) continue; [39, 44].forEach(y => { if (!exports._niches.some(n => Math.abs(n[0] - x) < 2 && Math.abs(n[1] - y) < 2)) P('menhir', x, y, { h: 2.4, face: (x * 31) % 360 }); }); }
    exports._niches.forEach((q, i) => { taken.add(q[0] + ':' + q[1]); Pm(i === 1 ? 'sarcophagus' : i === 6 ? 'skull_pile' : 'brazier', cx(q[0]), cz(q[1]) + (q[1] > 42 ? -0.3 : 0.3), { face: q[1] > 42 ? 0 : 180 }); });
    [[49, 37], [58, 37], [49, 46], [58, 46]].forEach(q => P('obelisk', q[0], q[1], { h: 7 }));
    [[f.gobekli[1] + 1, 39], [f.anthill[1] + 1, 37], [f.henge[1] + 1, 39], [f.babel[1] + 1, 44], [f.causeway[1] + 1, 44]].forEach(q => P('signpost', q[0], q[1], { face: 90 }));
    /* THE WEST MOUTH + THE EAST MOUTH */
    P('sarsen', 0, 40, { h: 4.2 }); P('sarsen', 0, 43, { h: 4.2 }); P('campfire', 4, 45); P('sea_chest', 6, 46, { face: 20 }); dec('paper_sheet', 5, 46, { y: 0.01 }); dec('skull', 2, 38);
    Pm('trilithon', cx(106), gz(42), { face: 90, h: 6.2 }); taken.add('106:41'); taken.add('106:42'); P('brazier', 104, 39); P('brazier', 104, 44);
};
exports.people = ctx => { const { native, sayOf, OLD } = ctx;
    native('grey', 8, 39, 120, sayOf(OLD.ley, 'grey')); native('giant', 44, 45, 20, sayOf(OLD.ley, 'giant')); native('conspiracy theorist', 61, 39, 200, sayOf(OLD.ley, 'conspiracy theorist')); native('watcher', 101, 44, 270, sayOf(OLD.ley, 'watcher'));
    native('antperson', 30, 45, 40, sayOf(OLD.babel, 'antperson')); };
