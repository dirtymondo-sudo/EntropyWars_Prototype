/* THE INTERNET · C · THE POP-UPS (8 plots south-east of the crossing). One thread a file; the tool is bake-internet.js, the kit
   docs/areas/internet/kit.js, the rules docs/notes/areas-complexes.md "THE INTERNET, PLAN 3".
   THE IDEA (mondo 11-17: "Holographic floating ad boards, some could look like windows pop up viruses"): every tile is a window pane
   hanging at its own height. No buildings: pop-up windows standing and hanging, holo ad boards, the captcha, the cookie banner, the
   cart, the viruses kept in rings of red light. LANDMARK: THE SEARCH BAR (label mine): the bar hanging in the sky, finishing your
   question for you. A window tile's squares: floor 1..10 x 2..9; the walks run along 5-6. */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST;
const POPS = [
    ['Congratulations!', ['YOU ARE THE', '1,000,000th', 'VISITOR'], ['CLAIM PRIZE']],
    ['WARNING', [['YOUR COMPUTER', '#c01020'], ['HAS 37 VIRUSES', '#c01020'], 'CLICK TO CLEAN'], ['OK', 'OK']],
    ['System', ['ARE YOU SURE YOU', 'WANT TO LEAVE', 'THIS PAGE?'], ['STAY', 'STAY']],
    ['Download', ['MORE RAM', 'FREE', '100% REAL'], ['DOWNLOAD']],
    ['Error', ['AN ERROR HAS', 'OCCURRED WHILE', 'SHOWING THE ERROR'], ['OK']],
    ['Update', ['RESTART NOW?', 'RESTARTING IN', '10... 9... 8...'], ['LATER', 'NOW']],
    ['Toolbar', ['INSTALL 6 MORE', 'TOOLBARS?'], ['YES', 'YES']],
    ['Survey', ['RATE THIS POP-UP', '* * * * *'], ['SUBMIT']],
];
const ADS = [['BUY NOW', '#ffffff', '#e01030'], ['LIMITED TIME ONLY', '#111111', '#ffe23a'], ['SKIP AD IN 5', '#ffffff', '#222222'], ['ONE WEIRD TRICK', '#ffffff', '#20a040'], ['YOU MAY ALSO LIKE', '#ffffff', '#3fa0ff'],
    ['50% OFF EVERYTHING', '#ffffff', '#b070ff'], ['AS SEEN ON A SCREEN', '#111111', '#7fffd0'], ['FREE*', '#ffffff', '#ff5fb0'], ['ACT NOW', '#111111', '#ff9a20'], ['THIS AD KNOWS YOU', '#ffffff', '#1a1030']];
exports.build = c => { const C = c.C;
    /* THE MILLIONTH VISITOR (P05-05): pop-ups standing in the four quarters, turned every way, and three more hanging over the walk */
    [[2.5, 3.5, 20, 0], [3.6, 8.2, 160, 1], [8.4, 3.4, -30, 2], [8.6, 8.4, 200, 3], [1.9, 8.6, 100, 4], [9.4, 3.2, 290, 6]].forEach(([x, y, rot, k], i) => c.look('pop' + i, 'P05-05', x, y, rot, a => K.popupStand(a, 0, 0, 5.4, 3.8, POPS[k][0], POPS[k][1], POPS[k][2])));
    [[6, 6, 15, 5, 6.5], [4.4, 5.6, -40, 7, 10], [7.6, 6.6, 70, 0, 13.5]].forEach(([x, y, rot, k, h], i) => c.look('popair' + i, 'P05-05', x, y, rot, a => K.popup(a, 0, h, 0, 6.6, 4.4, POPS[k][0], POPS[k][1], POPS[k][2])));
    /* THE ADS (P06-05): holo boards at every height, the blocker that gave up */
    [[2.4, 3.4, 30], [8.6, 3.2, -40], [2.6, 8.4, 150], [8.4, 8.6, 210], [3.9, 2.6, 80], [7.4, 8.9, 0]].forEach(([x, y, rot], i) => c.look('ad' + i, 'P06-05', x, y, rot, a => { const A = ADS[i], B = ADS[i + 4]; K.holo(a, 0, 0, 2.6 + (i % 3) * 0.6, 6.4, 2.2, A[0], A[1], A[2], 'archivo', { col: parseInt(A[2].slice(1), 16) || 0x40e0ff });
        K.holo(a, 0.3, 0.2, 6.6 + (i % 2) * 1.6, 5.2, 1.8, B[0], B[1], B[2], 'archivo', { puck: false, col: parseInt(B[2].slice(1), 16) || 0x40e0ff }); }));
    c.look('blocker', 'P06-05', 6, 6, 0, a => { K.words(a, 'AD BLOCKER: 0 BLOCKED', 0, 11.5, 0, 12, 1.2, '#ff3050', 'archivo'); });
    /* THE CAPTCHA (P05-06): nine panels on the floor of the west half, three of them with a traffic light standing on them; the box to tick */
    c.look('captcha', 'P05-06', 3, 5.5, 0, a => { for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) a.quad((k - 1) * 3.5, 0.05, (r - 1) * 3.5 - (r === 1 ? 0 : (r ? -5.3 : 5.3)) * 0 + (r === 0 ? -7 : r === 2 ? 7 : 0) * 0, 3.2, 3.2, 0, null, [0x9ad8ff, 0xd8e8f8, 0xb8c8d8][(r + k) % 3], { flat: true, glow: 0.5 }); });
    c.look('captcha2', 'P05-06', 8.5, 3.4, 0, a => { K.popup(a, 0, 1.0, 0, 8.4, 4.0, 'Are you human?', ['SELECT ALL SQUARES WITH', 'TRAFFIC LIGHTS', ['[ ] I AM NOT A ROBOT', '#0a2a90']], ['VERIFY']); });
    /* THE SEARCH BAR (P06-06, the landmark): a white bar 24 m long hanging 9 m up, the glass at its end, what it thinks you want under it */
    c.look('search', 'P06-06', 6, 3.0, 0, a => { a.box(0, 9, 0, 24, 2.6, 0.6, null, 0xf6f6f2, { glow: 0.85 }); a.cyl(-12, 9, 0, 1.3, 0.6, null, 0xf6f6f2, { seg: 12, glow: 0.85 }); a.cyl(12, 9, 0, 1.3, 0.6, null, 0xf6f6f2, { seg: 12, glow: 0.85 });
        a.sign('how do i', -5.5, 9.4, 0.32, 9, 1.8, '#202020', '', 'way', { kind: 'over' }); a.sign('how do i', 5.5, 9.4, -0.32, 9, 1.8, '#202020', '', 'way', { kind: 'over', ry: 180 });
        ['how do i exit the internet', 'how do i know if i am a bot', 'how do i stop scrolling', 'how do i'].forEach((s, i) => { a.sign(s, -1.5, 7.6 - i * 1.25, 0.1, 18, 1.05, '#404040', '#ffffff', 'way'); a.sign(s, 1.5, 7.6 - i * 1.25, -0.1, 18, 1.05, '#404040', '#ffffff', 'way', { ry: 180 }); }); });
    c.at('magnifier', 'P06-06', 6 + 10.2 / C, 3.0, { h: 3.4, y: 7.9 });   // the glass at the bar's end = the Meshy `magnifier` (THE INTERNET MODELS, 11-18)
    /* THE CHECKOUT (P07-05): a shopping cart the size of a house, made of wire; the button */
    c.at('shopping_cart', 'P07-05', 3, 3.6, { h: 6.2, face: 180 });   // the cart = the Meshy `shopping_cart` (THE INTERNET MODELS, 11-18), house-size
    K.solid(c, 'P07-05', 2, 3, 3, 4, 6);
    c.look('buy', 'P07-05', 8.5, 8, 0, a => { a.box(0, 0, 0, 6.4, 1.0, 3.0, null, 0xffb020, { glow: 0.85 }); a.sign('ADD TO CART', 0, 1.02, 0, 5.6, 1.8, '#111111', '', 'archivo', { kind: 'over', flat: true }); K.words(a, 'ITEMS IN CART: 412', 0, 5, 0, 9, 1.0, '#ffffff'); });
    K.solid(c, 'P07-05', 8, 8, 9, 8, 1.2);
    /* THE COOKIE BANNER (P07-06): the banner across the tile's north half, the two buttons; the cookie itself, three metres across */
    c.look('banner', 'P07-06', 6, 2.6, 0, a => { a.box(0, 0.6, 0, 30, 3.4, 0.4, null, 0x1a1a2a, { glow: 0.3 }); a.sign('WE VALUE YOUR PRIVACY', -4, 2.5, 0.22, 16, 1.2, '#ffffff', '', 'archivo', { kind: 'over' }); a.sign('(THAT IS WHY WE SELL IT)', -4, 1.5, 0.22, 12, 0.7, '#7fffd0', '', 'dot', { kind: 'over' });
        a.box(8.6, 1.3, 0.24, 5.2, 1.6, 0.06, null, 0x20a040, { glow: 0.9 }); a.sign('ACCEPT ALL', 8.6, 1.5, 0.3, 4.6, 1.2, '#ffffff', '', 'archivo', { kind: 'over' }); a.sign('manage 1,204 options', 8.6, 0.75, 0.3, 3.6, 0.4, '#8a8a9a', '', 'dot', { kind: 'over' }); });
    c.at('xmas_cookie_round', 'P07-06', 3, 8, { span: 6.2, face: 20 });   // the cookie = the Christmas pack's round cookie (mondo 11-18: "we already have cookies from the christmas pack")
    K.solid(c, 'P07-06', 2, 7, 3, 8, 1);
    /* CLICKBAIT (P05-07): the signs */
    [['NUMBER 7 WILL SHOCK YOU', '#ffe23a', '#111111'], ['DOCTORS HATE THIS TILE', '#e01030', '#ffffff'], ['YOU WON\'T BELIEVE WHAT HAPPENS NEXT', '#ffffff', '#111111'], ['THEN THIS HAPPENED', '#3fa0ff', '#ffffff'], ['THE ANSWER MAY SURPRISE YOU', '#b070ff', '#ffffff']].forEach(([w, bg, fg], i) => {
        const [x, y, rot] = [[2.6, 3.4, 15], [8.4, 3.2, -20], [2.8, 8.4, 170], [8.8, 8.4, 195], [9.6, 4.4, 270]][i]; c.look('bait' + i, 'P05-07', x, y, rot, a => K.holo(a, 0, 0, 2.2 + (i % 3) * 1.4, Math.min(11, w.length * 0.4 + 1), 1.5, w, fg, bg, 'archivo')); });
    /* THE QUARANTINE (P06-07): the viruses, each in a ring of red light with a pop-up over it; the tape */
    [[3, 3, 'TROJAN.EXE'], [8, 3, 'WORM.BAT'], [3, 8, 'TOTALLY_SAFE.ZIP'], [8, 8, 'ILOVEYOU.TXT.VBS']].forEach(([x, y, nm], i) => c.look('virus' + i, 'P06-07', x + 0.5, y + 0.5, i * 90, a => {
        a.cyl(0, 0, 0, 2.2, 0.1, null, 0xff3050, { seg: 16, ri: 2.0, glow: 1 }); a.cyl(0, 0.1, 0, 2.1, 4.6, null, 0xff3050, { seg: 14, ri: 2.06, cap: false, ds: true, glow: 0.35 });
        a.dome(0, 1.9, 0, 0.9, 0.9, null, 0x30ff70, { glow: 0.8, seg: 8, rings: 3 }); a.dome(0, 1.9, 0, 0.9, -0.9, null, 0x30ff70, { glow: 0.8, seg: 8, rings: 3 });
        for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2; a.cone(Math.cos(t) * 1.0, 1.75, Math.sin(t) * 1.0, 0.16, 0, 0.9, null, 0x30ff70, { glow: 0.9, seg: 5 }); } a.cone(0, 2.7, 0, 0.2, 0, 1.0, null, 0x30ff70, { glow: 0.9, seg: 5 });
        a.sign(nm, 0, 5.0, 0, Math.max(4, nm.length * 0.36), 0.8, '#ffffff', '#b01020', 'dot'); a.sign(nm, 0, 5.0, -0.05, Math.max(4, nm.length * 0.36), 0.8, '#ffffff', '#b01020', 'dot', { ry: 180 }); }));
    c.look('qname', 'P06-07', 6, 6, 0, a => K.words(a, 'QUARANTINE · DO NOT OPEN', 0, 7.6, 0, 13, 1.2, '#ff3050', 'archivo'));
};
exports.dress = c => {
    [[2, 4], [3, 6], [4, 4]].forEach(([x, y]) => c.put('street_signal', 'P05-06', x, y + (y === 6 ? 1 : 0)));
    c.put('cardboard_boxes', 'P07-05', 8, 3); c.put('wrapped_pallet', 'P07-05', 3, 8); c.put('cash_register', 'P07-05', 9, 4); c.dec('cardboard_box', 'P07-05', 7, 4);
    c.put('radiation_sign', 'P06-07', 5, 4); c.dec('warning_tape', 'P06-07', 4, 5); c.dec('warning_tape', 'P06-07', 7, 6);
};
exports.people = c => {
    c.native('tech ceo', 'P05-05', 4, 4, 90); c.native('magician', 'P05-05', 7, 7, 270); c.native('televangelist', 'P06-05', 4, 4, 180); c.native('robot', 'P05-06', 8, 7, 270); c.native('police officer', 'P05-06', 4, 8, 0);
    c.native('banker', 'P07-05', 7, 4, 180); c.native('delivery boy', 'P07-05', 4, 7, 90); c.native('politician', 'P07-06', 8, 7, 180); c.native('clown', 'P05-07', 4, 7, 90); c.native('florida man', 'P05-07', 7, 4, 180);
    c.native('glitch', 'P06-07', 6, 4, 180); c.native('symbiote', 'P06-07', 4, 6, 90); c.native('mad scientist', 'P06-07', 7, 7, 0); c.native('fortune teller', 'P06-06', 4, 7, 0); c.native('professor', 'P06-06', 8, 8, 0);
};
