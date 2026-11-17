/* THE INTERNET · THE KIT (2026-11-17, plan 2): the pieces more than one district file draws. Repo tooling, read by the district files through
   bake-internet.js; never loaded by the game. Everything is `arch` parts (three-renderer.js THE ARCHITECTURE: boxes, cylinders, quads, signs):
   no new art. A piece is drawn in a sheet `a` (ctx.look / ctx.sky / a building's look), facing +z of the sheet unless said. */
'use strict';
const STEEL = 'gunmetal', DARK = 0x16181c, POST = 0x30343a;
/* a drawn piece nobody walks through: its squares claimed, a ghost wall round it */
const solid = (c, id, lx0, ly0, lx1, ly1, h) => { const p = c.plot[id], b = c.base(id), X0 = c.gx(p.sx + lx0), X1 = c.gx(p.sx + lx1 + 1), Z0 = c.gx(p.sy + ly0), Z1 = c.gx(p.sy + ly1 + 1);
    c.claim(id, lx0, ly0, lx1, ly1);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([x0, z0, x1, z1]) => c.feat({ k: 'wall', absY: true, x0, z0, x1, z1, t: 0.3, h: h || 4, y: b, ghost: true, rail: false })); };
/* words standing alone (no board), read from both sides */
const words = (a, w, x, y, z, wd, ht, fg, font, o) => { a.sign(w, x, y, z, wd, ht, fg, '', font || 'dot', Object.assign({ kind: 'over', glow: 1 }, o || {}));
    a.sign(w, x, y, z - 0.04, wd, ht, fg, '', font || 'dot', Object.assign({ kind: 'over', glow: 1 }, o || {}, { ry: ((o && o.ry) || 0) + 180 })); };
/* A POP-UP WINDOW (mondo: "some could look like windows pop up viruses"): the grey frame, the blue title bar with its red X, the white
   body with its lines, one or two buttons. w x h metres, its foot at y; `o.back` = false leaves the back bare (against a wall). */
function popup(a, x, y, z, w, h, title, lines, btns, o) { o = o || {}; const ry = o.ry || 0, t = ry * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
    const at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs], G = { ry };
    const box = (lx, ly, lz, bw, bh, bd, tint, glow) => { const q = at(lx, lz); a.box(q[0], y + ly, q[1], bw, bh, bd, null, tint, { ry, glow }); };
    const sg = (s, lx, ly, lz, sw, sh, fg, bg, font, kind) => { const q = at(lx, lz); a.sign(s, q[0], y + ly, q[1], sw, sh, fg, bg, font, Object.assign({ ry }, kind ? { kind } : {})); };
    const bar = Math.min(0.9, h * 0.16), body = o.body || 0xf2f2ee;
    box(0, 0, 0, w, h, 0.22, 0xc0c4c8, 0.35);                                   // the frame
    box(0, h - bar - 0.08, 0.12, w - 0.16, bar, 0.04, o.bar || 0x0a2a90, 0.8);     // the title bar
    box(w / 2 - 0.08 - bar / 2, h - bar - 0.04, 0.15, bar - 0.1, bar - 0.1, 0.03, 0xd02030, 0.9);   // the X
    sg('X', w / 2 - 0.08 - bar / 2, h - bar - 0.02, 0.17, bar - 0.2, bar - 0.16, '#ffffff', '', 'archivo', 'over');
    sg(title, -bar / 2, h - bar - 0.02, 0.15, w - bar - 0.5, bar - 0.14, '#ffffff', '', 'dot', 'over');
    box(0, 0.08, 0.12, w - 0.16, h - bar - 0.24, 0.03, body, 0.75);                // the body
    const hasB = btns && btns.length, top = h - bar - 0.3, bot = hasB ? 0.2 + Math.min(0.8, h * 0.16) : 0.2, n = lines.length, lh = (top - bot) / n;
    lines.forEach((ln, i) => { const s = Array.isArray(ln) ? ln[0] : ln, fg = Array.isArray(ln) ? ln[1] : (o.fg || '#101010'); sg(s, 0, top - (i + 1) * lh + lh * 0.12, 0.15, w - 0.5, lh * 0.76, fg, '', o.font || 'dot', 'over'); });
    if (hasB) { const bw = Math.min(2.4, (w - 0.6) / btns.length - 0.2), bh = Math.min(0.7, h * 0.14);
        btns.forEach((b, i) => { const lx = (i - (btns.length - 1) / 2) * (bw + 0.3); box(lx, 0.2, 0.15, bw, bh, 0.04, 0xd4d8dc, 0.6); sg(b, lx, 0.24, 0.18, bw - 0.2, bh - 0.1, '#101010', '', 'dot', 'over'); }); }
    if (o.back !== false) box(0, 0, -0.12, w, h, 0.03, 0x8a8e94, 0.2);
}
/* a pop-up standing on the ground on two short legs (so the frame clears the floor) */
function popupStand(a, x, z, w, h, title, lines, btns, o) { o = o || {}; const ry = o.ry || 0, t = ry * Math.PI / 180, lift = o.lift == null ? 0.5 : o.lift;
    for (const s of [-1, 1]) a.box(x + s * (w / 2 - 0.4) * Math.cos(t), 0, z - s * (w / 2 - 0.4) * Math.sin(t), 0.18, lift, 0.18, STEEL, POST, { ry });
    popup(a, x, lift, z, w, h, title, lines, btns, o); }
/* A HOLOGRAPHIC AD BOARD (mondo: "Holographic floating ad boards"): a projector puck on the floor, a thin beam, the lit panel hanging
   over it with nothing holding it, read from both sides */
function holo(a, x, z, y, w, h, textv, fg, bg, font, o) { o = o || {}; const ry = o.ry || 0, col = o.col == null ? 0x40e0ff : o.col;
    if (o.puck !== false) { a.cyl(x, 0, z, 0.55, 0.22, STEEL, POST, { seg: 10 }); a.cyl(x, 0.22, z, 0.32, 0.08, null, col, { seg: 10, glow: 1 }); a.cyl(x, 0.3, z, 0.05, Math.max(0.2, y - 0.3), null, col, { seg: 5, glow: 0.9 }); }
    const t = ry * Math.PI / 180, cs = Math.cos(t), sn = Math.sin(t);
    a.sign(textv, x + 0.04 * sn, y, z + 0.04 * cs, w, h, fg, bg, font || 'archivo', { ry, glow: 1 }); a.sign(textv, x - 0.04 * sn, y, z - 0.04 * cs, w, h, fg, bg, font || 'archivo', { ry: ry + 180, glow: 1 });
    a.box(x, y - 0.1, z, w + 0.24, 0.08, 0.1, null, col, { ry, glow: 1 }); a.box(x, y + h + 0.02, z, w + 0.24, 0.08, 0.1, null, col, { ry, glow: 1 }); }
/* a street lamp of the net: a thin post, a lit ball */
const lamp = (a, x, z, col, h) => { a.cyl(x, 0, z, 0.07, h || 4.2, STEEL, POST, { seg: 6 }); a.dome(x, (h || 4.2), z, 0.28, 0.28, null, col == null ? 0x7fffd0 : col, { glow: 1, seg: 8, rings: 2 }); };
/* A TOWER of Popup City: a dark body, lit window bands on four sides, a neon edge, a mast. w x d metres, h high, its middle at (x, z). */
function tower(a, x, z, w, d, h, tint, neon, o) { o = o || {};
    a.box(x, 0, z, w, h, d, o.key || 'urban:ConcretePanels1a', tint, { glow: 0.18 });
    for (let yy = 2.4; yy < h - 1.6; yy += 3.5) { a.box(x, yy, z + d / 2 + 0.03, w * 0.84, 1.5, 0.05, 'urban:GlassWindowTall1a', o.win || 0x9ad8ff, { glow: 0.7 }); a.box(x, yy, z - d / 2 - 0.03, w * 0.84, 1.5, 0.05, 'urban:GlassWindowTall1a', o.win || 0x9ad8ff, { glow: 0.7 });
        a.box(x + w / 2 + 0.03, yy, z, 0.05, 1.5, d * 0.84, 'urban:GlassWindowTall1a', o.win || 0x9ad8ff, { glow: 0.7 }); a.box(x - w / 2 - 0.03, yy, z, 0.05, 1.5, d * 0.84, 'urban:GlassWindowTall1a', o.win || 0x9ad8ff, { glow: 0.7 }); }
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => a.box(x + sx * (w / 2 + 0.04), 0, z + sz * (d / 2 + 0.04), 0.14, h, 0.14, null, neon, { glow: 1 }));
    a.box(x, h, z, w + 0.5, 0.35, d + 0.5, STEEL, DARK); a.box(x, h + 0.35, z, w + 0.6, 0.1, d + 0.6, null, neon, { glow: 1 });
    if (o.mast !== false) { a.cyl(x, h + 0.45, z, 0.1, o.mast || 5, STEEL, POST, { seg: 6 }); a.dome(x, h + 0.45 + (o.mast || 5), z, 0.22, 0.22, null, 0xff3050, { glow: 1, seg: 6, rings: 2 }); } }
/* a giant screen on two legs: [who, the words, the count, the screen's colour, the words' colour] (the Feed's post screen) */
function screen(a, x, post, w, h, y0) { const [who, textv, likes, bg, fg] = post;
    a.box(x - w / 2 + 0.6, 0, -0.3, 0.35, y0, 0.35, STEEL, POST); a.box(x + w / 2 - 0.6, 0, -0.3, 0.35, y0, 0.35, STEEL, POST);
    a.box(x, y0 - 0.25, -0.3, w + 0.5, h + 0.5, 0.4, STEEL, DARK, { glow: 0.1 });
    a.box(x, y0, -0.08, w, h, 0.06, null, bg === '#ffffff' ? 0xf4f4f4 : parseInt(bg.slice(1), 16), { glow: 0.85 });
    a.sign(who, x - w * 0.15, y0 + h - 0.95, 0, w * 0.62, 0.62, fg, '', 'dot', { kind: 'over' });
    a.sign(textv, x, y0 + h * 0.36, 0, w * 0.92, h * 0.3, fg, '', 'archivo', { kind: 'over' });
    a.sign(likes, x - w * 0.12, y0 + 0.35, 0, w * 0.66, 0.6, fg, '', 'dot', { kind: 'over' }); }
/* a run of glowing cable along the floor or in the air: straight, axis-aligned legs through the points [[x, y, z], ...] */
function cable(a, pts, col, r) { r = r || 0.09; for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
        a.box((p[0] + q[0]) / 2, Math.min(p[1], q[1]), (p[2] + q[2]) / 2, Math.abs(dx) + r, Math.abs(dy) + r, Math.abs(dz) + r, null, col, { glow: 1 }); } }
module.exports = { STEEL, DARK, POST, solid, words, popup, popupStand, holo, lamp, tower, screen, cable };
