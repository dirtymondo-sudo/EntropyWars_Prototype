/* THE INTERNET · F · THE FEED (9 plots: columns 3-5, rows 0-2). One thread a file; the tool is bake-internet.js, the rules
   docs/notes/areas-complexes.md "THE INTERNET ON PLOTS".
   THE IDEA (mondo's OK 11-17: "a long boulevard of giant scrolling screens"): THE BOULEVARD (row 1, three plots, level 10, four squares wide)
   runs east from the Server Farm's Uplink, a giant screen every few steps on both sides, each one a post. Off it, six side plots: the
   stages (the Influencer Stage, Trending, the Unboxing, higher), the Comment Section (a pit, lower), Sponsored and Going Viral (the way down
   to the Forums). LANDMARK: THE FOR YOU PAGE (label mine) at the boulevard's east end: the biggest screen, a phone standing on end, and
   it is looking at you. Every post's words are mine (plain, no real names).
   STANDS TODAY (the first build, One World 4.4): twelve post screens down the boulevard, the For You Page, the six side plots' pieces and people.
   NOT YET: the screens scroll (they are still pictures today), the likes count up, a sound. */
'use strict';
const STEEL = 'gunmetal';
const solid = (c, id, lx0, ly0, lx1, ly1, h) => { const p = c.plot[id], b = c.base(id), X0 = c.gx(p.sx + lx0), X1 = c.gx(p.sx + lx1 + 1), Z0 = c.gx(p.sy + ly0), Z1 = c.gx(p.sy + ly1 + 1);
    c.claim(id, lx0, ly0, lx1, ly1);
    [[X0, Z0, X1, Z0], [X0, Z1, X1, Z1], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1]].forEach(([x0, z0, x1, z1]) => c.feat({ k: 'wall', absY: true, x0, z0, x1, z1, t: 0.3, h: h || 4, y: b, ghost: true, rail: false })); };
/* the posts: [who, the words, the count, the screen's colour, the words' colour] */
const POSTS = [
    ['@MAIN_CHARACTER · 2H', 'POV: YOU OPENED THE APP FOR ONE MINUTE', '1.2M LIKES · 40K COMMENTS', '#1a1030', '#ffffff'],
    ['@DAILY_DOSE · 5M', 'YOU WON\'T BELIEVE NUMBER 7', '880K LIKES · 12K COMMENTS', '#ffe23a', '#111111'],
    ['@USER_48213 · 1D', 'THIS IS FINE', '3.4M LIKES · 210K COMMENTS', '#ff6a2a', '#ffffff'],
    ['@HOT_TAKES · 9H', 'UNPOPULAR OPINION: WATER IS WET', '12K LIKES · 96K COMMENTS', '#2a2a2a', '#ff5fb0'],
    ['@GLOW_UP · 3H', 'GET READY WITH ME', '450K LIKES · 3K COMMENTS', '#ffc0dc', '#5a1038'],
    ['@PERSISTENT · 1D', 'DAY 412 OF ASKING', '2.1M LIKES · 88K COMMENTS', '#3fa0ff', '#ffffff'],
    ['@SUSPENSE · 6H', 'WAIT FOR IT...', '9.9M LIKES · 1M COMMENTS', '#101010', '#7fffd0'],
    ['@NEWS_NOW · 1M', 'BREAKING: NOTHING HAPPENED', '64K LIKES · 30K COMMENTS', '#b01020', '#ffffff'],
    ['@STORYTIME · 4H', 'STORYTIME (NOT CLICKBAIT)', '310K LIKES · 22K COMMENTS', '#6a3fd0', '#ffffff'],
    ['@TESTED_IT · 2D', 'I TRIED IT SO YOU DON\'T HAVE TO', '700K LIKES · 9K COMMENTS', '#20c080', '#08221c'],
    ['@REPLY_GUY · 1M', 'RATIO', '5.6M LIKES · 400K COMMENTS', '#ffffff', '#111111'],
    ['@SLEEP_AID · 3Y', '10 HOURS OF RAIN SOUNDS', '41M VIEWS', '#0c2a4a', '#bfe4ff'],
];
/* one post screen: two legs, the frame, the post's three bands, facing +z of its sheet */
function screen(a, x, post, w, h, y0) { const [who, words, likes, bg, fg] = post;
    a.box(x, y0 - 0.5, -0.3, w + 0.8, 0.1, 0.5, null, 0xff5fb0, { glow: 1 }); a.box(x, y0 + h + 0.4, -0.3, w + 0.8, 0.1, 0.5, null, 0xff5fb0, { glow: 1 });   // (plan 3: a post hangs in the air, no legs)
    a.box(x, y0 - 0.25, -0.3, w + 0.5, h + 0.5, 0.4, STEEL, 0x16181c, { glow: 0.1 });
    a.box(x, y0, -0.08, w, h, 0.06, null, bg === '#ffffff' ? 0xf4f4f4 : parseInt(bg.slice(1), 16), { glow: 0.85 });
    a.sign(who, x - w * 0.15, y0 + h - 0.95, 0, w * 0.62, 0.62, fg, '', 'dot', { kind: 'over' });
    a.sign(words, x, y0 + h * 0.36, 0, w * 0.92, h * 0.3, fg, '', 'archivo', { kind: 'over' });
    a.sign(likes, x - w * 0.12, y0 + 0.35, 0, w * 0.66, 0.6, fg, '', 'dot', { kind: 'over' }); }
const BLVD = ['P05-01', 'P06-01', 'P07-01'];
exports.build = c => { const C = c.C;
    /* THE BOULEVARD'S SCREENS: two a side a plot (the For You Page's plot keeps its north-east one for the phone's shoulder) */
    let k = 0;
    BLVD.forEach(id => { [[3, 2.1, 0], [9, 2.1, 0], [3, 9.9, 180], [9, 9.9, 180]].forEach(([lx, ly, ry]) => { const post = POSTS[k++ % POSTS.length];
        c.look('post' + k, id, lx, ly, ry, a => screen(a, 0, post, 10, 6, 1.8)); });
        solid(c, id, 2, 2, 4, 2, 8); solid(c, id, 8, 2, 10, 2, 8); solid(c, id, 2, 9, 4, 9, 8); solid(c, id, 8, 9, 10, 9, 8); });
    /* THE FOR YOU PAGE (P07-01, the landmark): a phone on end at the boulevard's end, facing back down it; on its screen an eye */
    c.look('foryou', 'P07-01', 10.6, 6, -90, a => { const W = 11, H = 19;
        a.box(0, 0, 0, W + 1.2, H + 1.2, 1.4, STEEL, 0x0a0a0c, { glow: 0.05 });
        a.box(0, 0.6, 0.72, W, H, 0.05, null, 0x101828, { glow: 0.6 });
        a.box(0, H - 0.2, 0.75, 2.2, 0.5, 0.05, null, 0x050505);   // (the notch)
        a.sign('FOR YOU', 0, H - 2.4, 0.8, W * 0.8, 1.6, '#ffffff', '', 'archivo', { kind: 'over' });
        a.box(0, 7.6, 0.8, 8.4, 5.2, 0.05, null, 0xf4f4f0, { glow: 0.9 }); a.box(0, 8.4, 0.85, 3.6, 3.6, 0.05, null, 0x2a9a7a, { glow: 0.9 }); a.box(0, 9.3, 0.9, 1.8, 1.8, 0.05, null, 0x050505, { glow: 0.2 });
        a.box(-0.6, 10.3, 0.95, 0.5, 0.5, 0.05, null, 0xffffff, { glow: 1 });
        a.sign('IT KNOWS WHAT YOU WANT', 0, 4.6, 0.8, W * 0.86, 1.0, '#7fffd0', '', 'dot', { kind: 'over' });
        a.sign('KEEP SCROLLING', 0, 2.0, 0.8, W * 0.6, 0.9, '#ffffff', '#ff2a6a', 'archivo'); });
    solid(c, 'P07-01', 10, 3, 10, 8, 20);
    /* THE INFLUENCER STAGE (P05-00): a low stage, a backdrop, LIVE over it */
    c.look('stage', 'P05-00', 6, 3.2, 0, a => { a.box(0, 0, 0, 12, 0.6, 5, 'wood', 0x7a5a40); a.box(0, 0.6, -2.3, 12, 5.2, 0.3, null, 0xffc0dc, { glow: 0.5 });
        a.sign('LIVE', -4.2, 4.4, -2.1, 2.2, 0.9, '#ffffff', '#e01030', 'archivo'); a.sign('3 WATCHING', 3.2, 4.4, -2.1, 4.2, 0.8, '#5a1038', '', 'dot', { kind: 'over' });
        a.sign('LINK IN BIO', 0, 2.2, -2.1, 7, 1.2, '#5a1038', '', 'bangers', { kind: 'over' }); });
    solid(c, 'P05-00', 2, 2, 9, 3, 3);
    /* TRENDING (P06-00): the hashtag, eight metres of it */
    c.look('hash', 'P06-00', 6, 3.5, 0, a => { const T = 0xff5fb0; a.box(-1.6, 0, 0, 1.0, 9, 1.0, null, T, { glow: 0.9 }); a.box(1.6, 0, 0, 1.0, 9, 1.0, null, T, { glow: 0.9 });
        a.box(0, 2.6, 0, 7, 1.0, 1.0, null, T, { glow: 0.9 }); a.box(0, 5.6, 0, 7, 1.0, 1.0, null, T, { glow: 0.9 }); a.box(0, 0, 0, 7.4, 0.3, 3, STEEL, 0x22262c);
        a.sign('TRENDING', 0, 0.4, 1.6, 6.4, 1.2, '#ffffff', '#1a1030', 'archivo'); });
    solid(c, 'P06-00', 4, 3, 7, 4, 9);
    /* THE UNBOXING (P07-00): the boxes, opened on camera and kept */
    c.look('boxes', 'P07-00', 6, 3.4, 0, a => { const K = 0xb08a5a; [[-3.2, 0, 3.6], [1.0, 0, 4.6], [4.4, 0, 2.6], [-0.8, 4.6, 2.4]].forEach(([x, y, s], i) => { a.box(x, y, 0, s, s, s, null, K, { ry: i * 13 });
        a.box(x - s * 0.3, y + s, 0, s * 0.5, 0.06, s, null, 0x9a7448, { ry: i * 13 + 8 }); });
        a.sign('UNBOXING · PART 37', 0, 7.6, 0, 8, 1.0, '#ffffff', '#c04a10', 'archivo'); });
    solid(c, 'P07-00', 4, 2, 8, 4, 7);
    /* THE COMMENT SECTION (P05-02): a pit of speech bubbles on poles */
    const SAYS = [['FIRST', '#ffffff', '#3fa0ff'], ['WHO IS HERE IN 2026?', '#111111', '#ffe23a'], ['SOURCE?', '#ffffff', '#6a3fd0'], ['THIS.', '#111111', '#7fffd0'], ['L + RATIO', '#ffffff', '#e01030'],
        ['NOBODY:', '#111111', '#ffffff'], ['TOUCH GRASS', '#ffffff', '#20a040'], ['BOT', '#ffffff', '#555555'], ['I\'M NOT READING ALL THAT', '#111111', '#ffc0dc'], ['EDIT: THANKS FOR THE LIKES', '#ffffff', '#ff6a2a']];
    c.look('comments', 'P05-02', 0, 0, 0, a => { [[2.5, 2.5], [8.5, 2.5], [2.5, 8.8], [8.5, 8.5], [9.5, 5.5], [2.3, 5.5], [4.2, 9.6], [7.6, 9.6], [8.8, 7.0], [3.0, 7.1]].forEach(([x, y], i) => { const [w, fg, bg] = SAYS[i], X = x * C, Z = y * C, H = 2.4 + (i % 4) * 0.8;
        a.box(X, 0, Z, 0.12, H, 0.12, STEEL, 0x30343a); a.sign(w, X, H, Z, Math.max(2.4, w.length * 0.32), 0.9, fg, bg, 'archivo', { ry: (i * 47) % 360 }); a.sign(w, X, H, Z - 0.02, Math.max(2.4, w.length * 0.32), 0.9, fg, bg, 'archivo', { ry: ((i * 47) % 360) + 180 }); }); });
    /* SPONSORED (P06-02): ad boards round the plaza */
    const ADS = [['BUY NOW', '#ffffff', '#e01030'], ['LIMITED TIME ONLY', '#111111', '#ffe23a'], ['SKIP AD IN 5', '#ffffff', '#222222'], ['ONE WEIRD TRICK', '#ffffff', '#20a040'], ['YOU MAY ALSO LIKE', '#ffffff', '#3fa0ff']];
    [[2.6, 2.6, 135], [9.4, 2.6, 225], [2.6, 9.0, 45], [9.4, 9.0, 315], [9.6, 5.9, 270]].forEach(([x, y, ry], i) => c.look('ad' + i, 'P06-02', x, y, ry, a => { const [w, fg, bg] = ADS[i];
        a.box(0, 0, -0.2, 0.3, 2.4, 0.3, STEEL, 0x30343a); a.box(0, 2.4, -0.2, 4.6, 2.6, 0.25, STEEL, 0x16181c); a.sign(w, 0, 2.55, 0, 4.3, 2.3, fg, bg, 'archivo'); a.sign('SPONSORED', 0, 2.0, 0, 2, 0.35, '#dddddd', '', 'dot', { kind: 'over' }); }));
    /* GOING VIRAL (P07-02): the stage everybody wants: the view counter */
    c.look('viral', 'P07-02', 3, 8.2, 90, a => { a.box(0, 0, 0, 10, 0.5, 4, STEEL, 0x22262c); a.sign('GOING VIRAL', 0, 6.4, 1.5, 8, 1.3, '#ffffff', '#ff2a6a', 'archivo');
        a.box(0, 0.5, 1.6, 8.6, 5.6, 0.3, STEEL, 0x0a0a0c); a.sign('9,999,999 VIEWS', 0, 3.3, 1.8, 8, 1.4, '#7fffd0', '#08221c', 'dot'); a.sign('15 MINUTES LEFT', 0, 1.4, 1.8, 6, 0.9, '#ffe23a', '#08221c', 'dot'); });
    solid(c, 'P07-02', 2, 7, 3, 9, 7);
    /* the notification bell and the like, hanging over the view counter; three speech bubbles over the comment pit (THE INTERNET ICONS, 11-18) */
    c.at('icon_bell', 'P07-02', 3, 6.2, { h: 3.2, y: c.base('P07-02') + 8.6, face: 90 }); c.at('icon_like', 'P07-02', 3, 10.2, { h: 3.0, y: c.base('P07-02') + 8.4, face: 90 });
    [[5.5, 4.2, 6.6, 20], [3.6, 6.4, 8.2, -30], [7.4, 6.8, 7.4, 160]].forEach(([x, y, h, f]) => c.at('icon_speech_bubble', 'P05-02', x, y, { h: 2.6, y: c.base('P05-02') + h, face: f }));
};
exports.dress = c => {
    /* the stages' kit */
    c.put('ring_light', 'P05-00', 4, 7, { face: 20 }); c.put('gaming_chair', 'P05-00', 6, 8, { face: 180 }); c.put('stream_mic', 'P05-00', 7, 8, { face: 180 });   // the streamer's set (THE INTERNET MODELS, 11-18)
    c.put('studio_light', 'P05-00', 2, 5, { face: 30 }); c.put('studio_light', 'P05-00', 9, 5, { face: 330 }); c.put('studio_camera', 'P05-00', 7, 7, { face: 0 });
    c.put('followspot', 'P07-02', 2, 4, { face: 150 }); c.put('followspot', 'P07-02', 9, 4, { face: 210 }); c.put('pa_speaker', 'P07-02', 2, 7, { face: 180 }); c.put('pa_speaker', 'P07-02', 9, 7, { face: 180 });
    c.put('cardboard_boxes', 'P07-00', 2, 7); c.put('cardboard_boxes', 'P07-00', 9, 7); c.dec('cardboard_box', 'P07-00', 3, 8); c.put('studio_camera', 'P07-00', 6, 7, { face: 0 });
    c.put('pa_speaker', 'P06-00', 2, 4, { face: 90 }); c.put('pa_speaker', 'P06-00', 9, 4, { face: 270 });
    /* the boulevard: benches between the screens, facing them (nobody sits) */
    ['P05-01', 'P06-01', 'P07-01'].forEach(id => { [[6, 3], [6, 8]].forEach(([x, y], i) => { if (c.free(id, x === 6 && id === 'P07-01' ? 7 : x, y)) c.P('city_bench', id, x === 6 && id === 'P07-01' ? 7 : x, y, { face: i ? 180 : 0 }); }); });
    c.put('vending_machine', 'P06-02', 5, 9, { face: 0 }); c.put('arcade_cabinet', 'P06-02', 7, 9, { face: 0 });
};
exports.people = c => {
    c.native('influencer', 'P05-00', 6, 6, 0); c.native('popstar', 'P06-00', 6, 7, 0); c.native('delivery boy', 'P07-00', 5, 8, 0);
    c.native('florida man', 'P05-02', 5, 7, 90); c.native('tech ceo', 'P06-02', 3, 6, 90); c.native('skater', 'P07-02', 6, 4, 0);
    c.native('televangelist', 'P06-01', 4, 4, 180); c.native('clown', 'P05-02', 8, 4, 270);
};
