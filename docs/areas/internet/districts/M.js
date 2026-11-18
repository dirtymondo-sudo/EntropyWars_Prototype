/* THE INTERNET · M · THE INBOX (5 plots: the column between the Server Farm and the Highway, and the two tiles under the hall's south
   edge). One thread a file; the tool is bake-internet.js, the kit docs/areas/internet/kit.js, the rules docs/notes/areas-complexes.md
   "THE INTERNET, PLAN 3".
   THE IDEA (mondo 11-17: "Moving platforms that are like mail"): the mail. Paper-white tiles the shape of envelopes. THE MAIL flies from
   here: envelopes you stand on that carry you over the open sky (ctx.mail; three-renderer.js THE MAIL). LANDMARK: the hill of envelopes
   on the Inbox, 4,096 unread.
   THE ROUTES: the Outbox -> the Feed's Influencer Stage (up); the Mail Dock -> the Highway's Bandwidth; the Spam Folder -> the Dark Web's
   Mirror Sites (down). (A fourth, the Motherboard's Battery -> Clickbait, is in K.js.) */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST;
/* an envelope lying or standing: a white slab, the flap's two lines, a red seal */
const env = (a, x, y, z, w, d, h, ry) => { a.box(x, y, z, w, h, d, null, 0xf6f2e6, { glow: 0.45, ry }); a.box(x, y + h, z, w * 0.96, 0.03, d * 0.1, null, 0xc8283a, { glow: 0.6, ry }); };
exports.plan = c => { };
exports.build = c => {
    /* THE MAIL */
    c.mail('out_feed', 'P03-00', 'E', 'P05-00', { phase: 0.1 });
    c.mail('dock_highway', 'P01-03', 'E', 'P04-03', { phase: 0.45 });
    c.mail('spam_dark', 'P00-03', 'S', 'P00-05', { phase: 0.7 });
    /* THE OUTBOX (P03-00): the SEND button, the size of a bed; sent letters stacked beside it */
    c.look('outbox', 'P03-00', 0, 0, 0, a => { const C = c.C;
        a.box(8.5 * C, 0, 3.5 * C, 6, 1.1, 3.2, null, 0x20a040, { glow: 0.8 }); a.sign('SEND', 8.5 * C, 1.12, 3.5 * C, 4.6, 2.2, '#ffffff', '', 'archivo', { kind: 'over', flat: true });
        for (let i = 0; i < 7; i++) env(a, 2.6 * C, i * 0.34, 3.4 * C, 5.2, 3.4, 0.3, (i * 23) % 40 - 20);
        K.words(a, 'OUTBOX', 6 * C, 6.4, 2.4 * C, 9, 1.8, '#ffffff', 'archivo'); K.words(a, 'SENT. PROBABLY.', 6 * C, 5.4, 2.4 * C, 6, 0.7, '#7fffd0'); });
    K.solid(c, 'P03-00', 8, 3, 9, 3, 1.2); K.solid(c, 'P03-00', 2, 3, 3, 3, 2.5);
    /* THE INBOX (P03-01, the landmark): the hill of envelopes, the count over it, the @ standing on top */
    c.look('hill', 'P03-01', 2.5, 7.5, 0, a => { let n = 0; for (let L = 0; L < 7; L++) { const r = 5.2 - L * 0.7, k = Math.max(3, 9 - L); for (let i = 0; i < k; i++) { const t = (i / k + L * 0.13) * Math.PI * 2; env(a, Math.cos(t) * r * 0.6, L * 0.62, Math.sin(t) * r * 0.6, 3.6, 2.4, 0.6, (n++ * 37) % 180); } }
        K.words(a, '@', 0, 4.6, 0, 3.6, 3.6, '#40e0ff', 'archivo'); K.words(a, '4,096 UNREAD', 0, 8.6, 0, 9, 1.4, '#ff3050', 'archivo'); });
    K.solid(c, 'P03-01', 1, 7, 3, 8, 5);
    c.at('icon_envelope', 'P03-01', 2.5, 7.5, { h: 3.2, y: 10.4 });   // the envelope icon over the hill (THE INTERNET ICONS, 11-18)
    c.at('icon_envelope', 'P03-00', 2.6, 3.4, { h: 2.2, y: 3.2, face: 15 });   // and over the sent stack
    c.look('inbox2', 'P03-01', 8.5, 3.5, 0, a => { K.popup(a, 0, 1.2, 0, 6.4, 4.2, 'New mail', ['RE: RE: FWD: RE: RE:', 'PLEASE SEE BELOW', ['(NOTHING IS BELOW)', '#a03040']], ['REPLY ALL']); });
    /* THE PIGEONHOLES (P03-02): a wall of pigeonholes four metres high, every hole a letter */
    c.look('holes', 'P03-02', 2.5, 2.6, 0, a => { a.box(0, 0, 0, 10.2, 4.6, 0.9, 'urban:WoodGeneric1a', 0x8a6a48, { glow: 0.2 });
        for (let r = 0; r < 5; r++) for (let k = 0; k < 10; k++) { a.box(-4.5 + k, 0.35 + r * 0.85, 0.46, 0.8, 0.66, 0.04, null, 0x2a2018); if ((r * 3 + k * 7) % 4) a.box(-4.5 + k, 0.4 + r * 0.85, 0.5, 0.6, 0.12 + ((r + k) % 3) * 0.14, 0.04, null, [0xf6f2e6, 0xf0e0b0, 0xd8e8f8][(r + k) % 3], { glow: 0.6 }); }
        K.words(a, 'SORTED BY: NOBODY', 0, 5.2, 0, 8, 0.8, '#ffffff'); });
    K.solid(c, 'P03-02', 1, 2, 4, 2, 5);
    /* THE SPAM FOLDER (P00-03): pop-ups that will not close, a heap of junk */
    [[3.2, 3.4, 20, 'YOU HAVE WON', ['CONGRATULATIONS!!!', 'YOU ARE OUR', 'LUCKY WINNER'], ['CLAIM']], [8.4, 3.6, -25, 'URGENT', ['DEAR FRIEND,', 'I AM A PRINCE', 'SEND BANK DETAILS'], ['OK', 'OK']], [8.2, 8.2, 200, 'HOT SINGLES', ['3 KM AWAY', 'THEY ARE ALSO', 'POP-UPS'], ['MEET']]].forEach(([x, y, rot, t, ln, b], i) =>
        c.look('spam' + i, 'P00-03', x, y, rot, a => K.popupStand(a, 0, 0, 5.2, 3.6, t, ln, b)));
    c.look('spamname', 'P00-03', 6, 6, 0, a => K.words(a, 'SPAM (99+)', 0, 6.4, 0, 8, 1.4, '#ffe040', 'archivo'));
    /* THE MAIL DOCK (P01-03): the board that says when the next one leaves (it does not know) */
    c.look('dock', 'P01-03', 8.5, 3.2, 0, a => { K.holo(a, 0, 0, 3.0, 7.5, 2.6, 'NEXT MAIL: SOON', '#ffffff', '#0a2a90', 'dot'); });
};
exports.dress = c => {
    c.put('mailbox_bank', 'P03-02', 8, 3, { face: 180 }); c.put('mailbox', 'P03-02', 8, 8); c.put('mailbox', 'P03-00', 3, 8); c.put('mailbox', 'P01-03', 3, 8); c.put('mailbox', 'P01-03', 3, 3);
    c.put('cardboard_boxes', 'P03-01', 8, 8); c.put('wrapped_pallet', 'P03-02', 3, 8); c.put('luggage_cart', 'P01-03', 8, 8, { face: 90 }); c.dec('cardboard_box', 'P00-03', 3, 8); c.dec('cardboard_box', 'P00-03', 4, 8);
};
exports.people = c => {
    c.native('delivery boy', 'P03-00', 7, 8, 0); c.native('robot', 'P03-01', 8, 7, 270); c.native('librarian', 'P03-02', 7, 7, 0); c.native('banker', 'P00-03', 3, 7, 90); c.native('televangelist', 'P00-03', 7, 4, 180); c.native('droid', 'P01-03', 8, 7, 270);
};
