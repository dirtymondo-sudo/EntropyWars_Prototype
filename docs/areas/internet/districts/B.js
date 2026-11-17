/* THE INTERNET · B · THE FORUMS (9 plots: columns 3-5, rows 3-5; levels 8 to 11). One thread a file; the tool is bake-internet.js, the rules
   docs/notes/areas-complexes.md "THE INTERNET ON PLOTS".
   THE IDEA (mondo's OK 11-17: "plazas of message boards"): the old Internet, the boards. Every plot is a plaza with boards standing round
   it, each board a thread (its title on a header, notes pinned under it). General Discussion takes the way down from the Feed; Off-Topic
   holds the steps down to the Dark Web. LANDMARK: THE MOD TOWER (label mine): the moderators' tower and the ban hammer on its top.
   Every thread title is mine (plain, no real names).
   STANDS TODAY (the first build, One World 4.4): the boards on every plaza, the Mod Tower, the Flame War's fires, the Help Desk, the Archive's
   shelves, the Rules board; the forums' people.
   NOT YET: replies that appear, a board you can read up close, the hammer swinging. */
'use strict';
const STEEL = 'gunmetal', WOOD = 'wood';
const solid = (c, id, lx0, ly0, lx1, ly1, h) => { const p = c.plot[id], b = c.base(id), X0 = c.gx(p.sx + lx0), X1 = c.gx(p.sx + lx1 + 1), Z0 = c.gx(p.sy + ly0), Z1 = c.gx(p.sy + ly1 + 1);
    c.claim(id, lx0, ly0, lx1, ly1);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([x0, z0, x1, z1]) => c.feat({ k: 'wall', absY: true, x0, z0, x1, z1, t: 0.3, h: h || 4, y: b, ghost: true, rail: false })); };
/* a thread board: two posts, a cork board, the title on a header over it, a few notes pinned (facing +z of its sheet) */
function board(a, title, col, n) { a.box(-2.1, 0, 0, 0.25, 3.6, 0.25, WOOD, 0x6a4a30); a.box(2.1, 0, 0, 0.25, 3.6, 0.25, WOOD, 0x6a4a30);
    a.box(0, 0.9, 0, 4.2, 2.3, 0.2, WOOD, 0xb08850, { glow: 0.2 });
    a.sign(title, 0, 3.25, 0.12, 4.4, 0.55, '#ffffff', col, 'archivo');
    for (let i = 0; i < n; i++) { const x = -1.5 + (i % 4) * 1.0, y = 1.15 + Math.floor(i / 4) * 0.95; a.box(x, y, 0.11, 0.7, 0.75, 0.02, null, [0xfffbe0, 0xfff0a0, 0xe0f4ff, 0xffe0ec][i % 4], { glow: 0.5, ry: (i * 7) % 11 - 5 }); } }
const THREADS = [
    ['PINNED: READ BEFORE POSTING', '#c04a10'], ['RE: RE: RE: RE: HELP', '#3a6aa0'], ['NEWBIE QUESTION (PLS BE NICE)', '#3a8a5a'], ['IS THIS A BUG?', '#7a3fa0'], ['[SOLVED] NEVER MIND, FIXED IT', '#20a040'],
    ['[LOCKED] THIS GOT OUT OF HAND', '#555555'], ['BUMP', '#a08a20'], ['WHAT ARE YOU LISTENING TO RIGHT NOW', '#3a6aa0'], ['POST YOUR SETUP', '#c04a10'], ['UNPOPULAR OPINIONS THREAD', '#a03040'],
    ['MEGATHREAD: EVERYTHING', '#3a8a5a'], ['DOES ANYBODY STILL USE THIS', '#555555'], ['SEARCH BUTTON IS RIGHT THERE', '#a03040'], ['TIL', '#3a6aa0'], ['WHO ELSE IS STILL UP', '#7a3fa0'],
];
/* the boards round a plaza: [lx, ly, facing] spots off the walks (the walks run on rows / columns 5-6 to the ports) */
const RING = [[2.5, 2.2, 0], [8.5, 2.2, 0], [2.2, 8.8, 180], [8.8, 8.8, 180], [1.6, 4.0, 90], [9.4, 4.0, 270], [1.6, 7.6, 90], [9.4, 7.6, 270]];
exports.build = c => { const C = c.C; let t = 0;
    const plazas = { 'P08-05': 6, 'P08-06': 8, 'P07-07': 6, 'P07-07': 3, 'P07-08': 4, 'P08-08': 2, 'P06-08': 3, 'P08-07': 4 };
    Object.keys(plazas).forEach(id => { for (let i = 0; i < plazas[id]; i++) { const [lx, ly, ry] = RING[i], th = THREADS[t++ % THREADS.length];
        const sx = Math.floor(lx), sy = Math.floor(ly); if (!c.free(id, sx, sy)) continue;
        c.look('board' + t, id, lx, ly, ry, a => board(a, th[0], th[1], 3 + (t % 6))); c.claim(id, sx, sy, sx, sy); } });
    /* THE FRONT PAGE (P08-05): one board bigger than the rest, the top posts on it */
    c.look('frontpage', 'P08-05', 8.4, 8.6, 180, a => { a.box(0, 0, 0, 9.4, 0.4, 1.6, STEEL, 0x22262c); a.box(0, 0.4, 0, 9, 6.2, 0.4, WOOD, 0xb08850, { glow: 0.2 });
        a.sign('THE FRONT PAGE', 0, 6.9, 0.2, 8, 1.1, '#ffffff', '#c04a10', 'archivo');
        ['1. THE DRESS IS BLUE (11,402 REPLIES)', '2. HOW DO I EXIT THE EDITOR', '3. MY CAT DID A THING', '4. ASK ME ANYTHING (NOT THAT)'].forEach((s, i) => a.sign(s, 0, 5.2 - i * 1.25, 0.22, 8.2, 0.9, '#2a1a10', '#fff8e8', 'dot')); });
    solid(c, 'P08-05', 7, 8, 9, 9, 7);
    /* THE FLAME WAR (P08-07): the plaza is on fire; the thread it started from, charred */
    c.look('flamewar', 'P08-07', 6, 9.4, 180, a => { a.box(0, 0, 0, 7, 0.3, 1.2, STEEL, 0x1a1a1a); a.box(0, 0.3, 0, 6.6, 3.4, 0.3, WOOD, 0x2a1a10);
        a.sign('FLAME WAR · DAY 3,041', 0, 4.0, 0.2, 6.6, 0.9, '#ffe23a', '#2a0808', 'archivo'); a.sign('NOBODY REMEMBERS WHAT STARTED IT', 0, 2.0, 0.2, 6.2, 0.6, '#ff9a40', '', 'dot', { kind: 'over' }); });
    solid(c, 'P08-07', 5, 9, 7, 9, 5);
    /* THE HELP DESK (P07-07): the desk and its sign */
    c.look('helpdesk', 'P07-07', 6, 9.2, 180, a => { a.box(0, 0, 0, 8.6, 5.2, 0.3, null, 0x3a6aa0, { glow: 0.4 }); a.sign('HELP DESK', 0, 3.6, 0.2, 6, 1.2, '#ffffff', '', 'archivo', { kind: 'over' });
        a.sign('HAVE YOU TRIED TURNING IT OFF AND ON AGAIN', 0, 2.2, 0.2, 8.2, 0.7, '#e0f4ff', '', 'dot', { kind: 'over' }); a.sign('TICKET #000001 · OPEN', 0, 1.2, 0.2, 5, 0.5, '#ffe23a', '', 'dot', { kind: 'over' }); });
    /* THE ARCHIVE (P07-08): the sign over the shelves */
    c.look('archive', 'P07-08', 6, 1.6, 0, a => { a.box(-3.6, 0, 0, 0.3, 5, 0.3, STEEL, 0x30343a); a.box(3.6, 0, 0, 0.3, 5, 0.3, STEEL, 0x30343a);
        a.sign('THE ARCHIVE', 0, 4.6, 0, 7.4, 1.0, '#e0d0b0', '#3a2a1a', 'fell'); a.sign('LAST REPLY: 11 YEARS AGO', 0, 3.9, 0, 6, 0.6, '#c0b090', '#3a2a1a', 'dot'); });
    /* THE RULES (P08-08): the rules board */
    c.look('rules', 'P08-08', 3.2, 9.4, 180, a => { a.box(0, 0, 0, 8.4, 0.3, 1.2, STEEL, 0x22262c); a.box(0, 0.3, 0, 8, 6, 0.3, null, 0xf4f0e0, { glow: 0.6 });
        a.sign('THE RULES', 0, 5.0, 0.2, 6, 1.0, '#a03040', '', 'archivo', { kind: 'over' });
        ['1. READ THE RULES', '2. NO SPAM', '3. BE NICE', '4. SEE RULE 1'].forEach((s, i) => a.sign(s, 0, 3.8 - i * 0.95, 0.2, 6.6, 0.75, '#2a1a10', '', 'dot', { kind: 'over' })); });
    solid(c, 'P08-08', 1, 9, 4, 9, 7);
    /* THE MOD TOWER (P08-08, the landmark): a tower four squares a side, 22 m, MODERATORS round its top, the ban hammer standing on it */
    c.look('modtower', 'P08-08', 3, 7, 0, a => { const S = 5.6, Hh = 20;
        a.box(0, 0, 0, S + 1.2, 1.2, S + 1.2, STEEL, 0x22262c); a.box(0, 1.2, 0, S, Hh, S, 'urban:MetalPanel2a', 0x9aa8c0, { glow: 0.2 });
        for (let y = 3; y < Hh; y += 3.2) { a.box(0, y, S / 2 + 0.02, S * 0.7, 1.2, 0.05, null, 0x7fffd0, { glow: 0.9 }); a.box(0, y, -S / 2 - 0.02, S * 0.7, 1.2, 0.05, null, 0x7fffd0, { glow: 0.9 }); }
        a.box(0, Hh + 1.2, 0, S + 1.6, 0.6, S + 1.6, STEEL, 0x30343a);
        [[0, 0], [90, 0], [180, 0], [270, 0]].forEach(([ry]) => { const r = ry * Math.PI / 180; a.sign('MODERATORS', Math.sin(r) * (S / 2 + 0.06), Hh - 1.4, Math.cos(r) * (S / 2 + 0.06), S * 0.9, 1.0, '#ffffff', '#a03040', 'archivo', { ry }); });
        /* the ban hammer: the handle, the head */
        a.box(0, Hh + 1.8, 0, 0.6, 7, 0.6, WOOD, 0x6a4a30); a.box(0, Hh + 8.4, 0, 6.4, 2.6, 2.6, STEEL, 0x50565e, { glow: 0.2 });
        a.sign('BAN', 0, Hh + 8.8, 1.32, 3.4, 1.6, '#ffffff', '#c01020', 'archivo'); a.sign('BAN', 0, Hh + 8.8, -1.32, 3.4, 1.6, '#ffffff', '#c01020', 'archivo', { ry: 180 }); });
    solid(c, 'P08-08', 1, 5, 4, 9, 22);
};
exports.dress = c => {
    /* the Flame War's fires */
    [[2, 2], [9, 2], [2, 8], [9, 8], [3, 5], [8, 5]].forEach(([x, y]) => c.put('brazier', 'P08-07', x, y)); c.put('ring_of_fire', 'P08-07', 8, 3, { face: 45 });
    /* the Help Desk */
    c.put('exec_desk', 'P07-07', 6, 8, { face: 0 }); c.put('computer_chair_grey', 'P07-07', 3, 7); c.dec('crt_terminal', 'P07-07', 6, 8, { y: 0.78 });
    c.put('filing_cabinet', 'P07-07', 9, 8); c.put('office_plant', 'P07-07', 2, 8);
    /* the Archive: the shelves of old threads */
    [[2, 3], [3, 3], [8, 3], [9, 3], [2, 8], [3, 8], [8, 8], [9, 8]].forEach(([x, y]) => { if (c.free('P07-08', x, y)) c.P('library_shelf_full', 'P07-08', x, y, { face: y < 5 ? 180 : 0 }); });
    c.put('card_catalogue', 'P07-08', 3, 6); c.put('spider', 'P07-08', 8, 6);
    /* Lurkers' Corner: benches facing a board, everybody reading */
    c.put('park_bench', 'P06-08', 4, 7, { face: 0 }); c.put('park_bench', 'P06-08', 7, 7, { face: 0 });
    /* General Discussion + Off-Topic: a few seats, a bin */
    c.put('park_bench', 'P08-06', 3, 7, { face: 90 }); c.put('metal_trash_can', 'P08-06', 8, 7); c.put('park_bench', 'P07-07', 8, 8, { face: 270 }); c.put('jukebox', 'P07-07', 3, 3, { face: 180 });
    c.put('chalkboard', 'P08-05', 3, 7, { face: 90 });
};
exports.people = c => {
    c.native('conspiracy theorist', 'P08-05', 4, 4, 180); c.native('professor', 'P08-06', 7, 8, 0); c.native('librarian', 'P07-08', 6, 8, 0);
    c.native('karate frog', 'P07-07', 4, 8, 90); c.native('goblin', 'P08-07', 5, 3, 180); c.native('politician', 'P08-08', 8, 3, 180);
    c.native('watcher', 'P06-08', 5, 8, 0); c.native('referee', 'P08-08', 7, 3, 180); c.native('mime', 'P07-07', 3, 3, 135);
};
