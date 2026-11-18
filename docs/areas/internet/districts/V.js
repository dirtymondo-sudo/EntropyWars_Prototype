/* THE INTERNET · V · LIVE (6 plots: the east column from the Headset down to Character Select, and the Lobby and the Chat Room west of it).
   One thread a file; the tool is bake-internet.js, the kit docs/areas/internet/kit.js, the rules docs/notes/areas-complexes.md
   "THE INTERNET, PLAN 3".
   THE IDEA (mondo 11-17: "Virtual Reality, e-girls, v-tubers"): the streamers. Nothing here is a building: a stage of light with the
   avatar in its beam, a ring light the size of a big wheel, a ring of pedestals to pick who you are, a loading ring to walk round.
   TWO INSIDES OF THINGS (the interior pass): THE HEADSET (P08-00, the highest tile in the room: a headset the size of a house; inside,
   the world whose textures have not loaded) and THE CHAT ROOM (P06-03: a room made of chat windows; inside, everybody talking at once). */
'use strict';
const K = require('../kit.js'), STEEL = K.STEEL, POST = K.POST, PINK = 0xff5fb0, VIO = 0xb070ff;
const CHAT = [['FIRST', '#3fa0ff'], ['POG', '#b070ff'], ['HI CHAT', '#20a040'], ['LOL', '#ff5fb0'], ['W', '#ffb020'], ['???', '#555555'], ['CLIP IT', '#e01030'], ['SO TRUE', '#3fa0ff'], ['F', '#555555'], ['MODS', '#20a040'], ['GG', '#b070ff'], ['NOTICE ME', '#ff5fb0']];
exports.build = c => { const C = c.C;
    /* THE HEADSET (P08-00): an inside of a thing. The visor is its front (south), the strap goes round the back */
    const HS = c.building('headset', 'P08-00', 2, 1, 9, 4, 'S', 7, { key: null, tint: 0xe8e8ee, glow: 0.4, leaf: 'none', keyIn: 'checkerboard_2', floorIn: 'checkerboard_2', roofTint: 0xd0d0d8,
        look: (a, fw, fd, door, h) => { a.box(0, 2.6, fd / 2 + 0.2, fw - 1.2, 3.6, 0.3, null, 0x101018, { glow: 0.15 }); a.box(-fw * 0.24, 3.0, fd / 2 + 0.38, fw * 0.3, 2.6, 0.06, null, 0x40e0ff, { glow: 0.9 }); a.box(fw * 0.24, 3.0, fd / 2 + 0.38, fw * 0.3, 2.6, 0.06, null, PINK, { glow: 0.9 });
            a.cyl(0, 3.2, -fd / 2, fw / 2, 1.2, null, 0x2a2a34, { ri: fw / 2 - 0.5, arc: 180, a0: 90, seg: 14, cap: false, ds: true });
            a.box(door.lx, 0, fd / 2 + 0.12, door.cw + 0.5, 2.5, 0.12, null, 0x7fffd0, { glow: 1 }); K.words(a, 'PUT ME ON', 0, h + 1.2, fd / 2, 9, 1.3, '#ffffff', 'archivo'); } });
    HS.look('inside', a => { const w = HS.fw / 2 - 1, d = HS.fd / 2 - 1;
        a.box(-w + 1.5, 0, -d + 1.5, 2.2, 2.2, 2.2, 'checkerboard_2', 0xff40ff, { glow: 0.6, ry: 20 }); a.cone(w - 2, 0, -d + 1.5, 1.4, 0, 3.2, 'checkerboard_2', 0xff40ff, { glow: 0.6, seg: 6 }); a.dome(0, 0, -d + 1.2, 1.5, 1.5, 'checkerboard_2', 0xff40ff, { glow: 0.6, seg: 8, rings: 3 });
        a.sign('TEXTURE NOT FOUND', 0, 4.6, -d - 0.6, 12, 1.2, '#ff40ff', '', 'dot', { kind: 'over' }); a.sign('LOADING WORLD... 12%', 0, 3.4, -d - 0.6, 9, 0.8, '#ffffff', '', 'dot', { kind: 'over' }); });
    HS.native('occulus', 0, 1.5, 180); HS.put('gaming_chair', -6, 2, { face: 90 }); HS.put('egg_chair', 6, 2, { face: 270 });
    c.at('vr_headset', 'P08-00', 6, 9.6, { span: 6.4, face: 90 });   // a headset the size of a car lying outside the one you walk into (THE INTERNET MODELS, 11-18)
    c.look('vr_out', 'P08-00', 6, 8.6, 0, a => { [[-9, 0.6], [9, 0.9], [-11, -2]].forEach(([x, z], i) => { a.box(x, 0, z, 1.6, 1.6, 1.6, 'checkerboard_2', 0xff40ff, { glow: 0.6, ry: i * 25 }); a.box(x, 2.4, z, 0.9, 0.9, 0.9, null, 0x7fffd0, { glow: 1, ry: 45 }); }); K.words(a, 'VIRTUAL REALITY', 0, 0.2, 2.4, 9, 0.9, '#b070ff', 'archivo'); });
    /* THE HOLOGRAM STAGE (P08-01): a disc of light, the beam, the avatar standing in it (a resident); LIVE, the count, the hearts going up */
    c.at('holo_projector', 'P08-01', 8.6, 3.4, { span: 6.8 });   // the disc = the Meshy `holo_projector` (THE INTERNET MODELS, 11-18); the beam stays drawn
    [[4.6, 3, 0.5], [5.4, 5.4, 0.7], [4.2, 7.8, 0.45], [6.0, 9.6, 0.6], [-4.6, 9, 0.5]].forEach(([x, y, s], i) => c.at('icon_heart', 'P08-01', 8.6 + x / C, 3.4 + (i % 2) * 0.8 / C, { h: s * 2.6, y: c.base('P08-01') + y, face: (i * 23) % 50 - 25 }));   // the hearts going up (THE INTERNET ICONS)
    c.look('holo', 'P08-01', 8.6, 3.4, 0, a => { for (let b = 0; b < 16; b++) { const t = b / 16 * Math.PI * 2; a.box(Math.cos(t) * 3.0, 0.4, Math.sin(t) * 3.0, 0.06, 9, 0.06, null, VIO, { glow: 1 }); } a.cyl(0, 9.4, 0, 3.1, 0.1, null, VIO, { seg: 20, ri: 2.9, glow: 1 });   // (threads of light: a drawn tube is solid, it hid the avatar)
        a.sign('LIVE', -5.2, 6.4, 0, 2.6, 1.0, '#ffffff', '#e01030', 'archivo'); a.sign('LIVE', -5.2, 6.4, -0.05, 2.6, 1.0, '#ffffff', '#e01030', 'archivo', { ry: 180 }); K.words(a, '41,209 WATCHING', 0, 10, 0, 9, 1.0, '#ffffff');
    });
    K.solid(c, 'P08-01', 8, 2, 9, 3, 1);
    c.look('chatcol', 'P08-01', 2.4, 8.4, 0, a => CHAT.forEach(([w, bg], i) => { const y = 0.8 + i * 0.95, x = (i % 3 - 1) * 0.5; a.sign(w, x, y, 0, Math.max(1.6, w.length * 0.36), 0.7, '#ffffff', bg, 'archivo'); a.sign(w, x, y, -0.05, Math.max(1.6, w.length * 0.36), 0.7, '#ffffff', bg, 'archivo', { ry: 180 }); }));
    /* THE RING LIGHT (P08-02): a ring of lamps 16 m across standing on edge, the set under it */
    c.at('ring_light', 'P08-02', 6, 2.6, { h: 17 });   // the ring light the size of a big wheel = the Meshy `ring_light` (THE INTERNET MODELS, 11-18)
    c.look('ring', 'P08-02', 6, 2.6, 0, a => { K.words(a, 'GOOD LIGHTING IS EVERYTHING', 0, 18.4, 0, 12, 1.0, '#ffffff'); });
    /* CHARACTER SELECT (P08-03): a ring of pedestals, a resident on each; the words over the middle */
    c.look('select', 'P08-03', 6, 6, 0, a => { for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8 * Math.PI * 2; a.cyl(Math.cos(t) * 13.2, 0, Math.sin(t) * 13.2, 1.3, 0.5, null, 0x1a1030, { seg: 12, glow: 0.3 }); a.cyl(Math.cos(t) * 13.2, 0.5, Math.sin(t) * 13.2, 1.2, 0.06, null, [0x40e0ff, PINK, 0xffe040, VIO][i % 4], { seg: 12, glow: 1 }); }
        K.words(a, 'CHOOSE YOUR AVATAR', 0, 7.2, 0, 13, 1.5, '#ffffff', 'archivo'); K.words(a, 'YOU CAN CHANGE IT LATER (YOU WILL NOT)', 0, 6.2, 0, 11, 0.7, '#7fffd0'); });
    /* THE LOBBY (P07-03): the loading ring laid on the floor, to walk round; the count */
    c.look('lobby', 'P07-03', 6, 6, 0, a => { for (let i = 0; i < 12; i++) { const t = i / 12 * Math.PI * 2, v = Math.round(50 + 205 * (i / 11)), col = (v << 16) | (v << 8) | v; a.cyl(Math.cos(t) * 11, 0, Math.sin(t) * 11, 1.2, 0.3, null, col, { seg: 10, glow: 0.2 + 0.8 * (i / 11) }); }
        K.words(a, 'WAITING FOR PLAYERS 1/64', 0, 6, 0, 12, 1.2, '#ffffff'); });
    /* THE CHAT ROOM (P06-03): an inside of a thing. Its walls are chat windows; the door is a gap in them */
    const CR = c.building('chatroom', 'P06-03', 1, 2, 4, 4, 'E', 7, { key: null, tint: 0x1a1a2a, glow: 0.3, leaf: 'none', keyIn: 'holo', floorIn: 'carpet_3', roofTint: 0x1a1a2a,
        look: (a, fw, fd, door, h) => { K.popup(a, -2.2, 2.6, fd / 2 + 0.1, 5.4, 3.6, 'chat room #1', ['A/S/L?', 'BRB', 'G2G MOM NEEDS', 'THE PHONE'], null, { back: false }); a.box(door.lx, 0, fd / 2 + 0.12, door.cw + 0.5, 2.5, 0.12, null, 0x7fffd0, { glow: 1 }); K.words(a, 'CHAT ROOM', 0, h + 1, 0, 9, 1.4, '#ffffff', 'archivo'); } });
    CR.look('inside', a => { const w = CR.fw / 2 - 0.4, d = CR.fd / 2 - 0.4;
        [['WHO IS HERE', '#3fa0ff'], ['HELLO???', '#20a040'], ['TYPING...', '#555555'], ['IS ANYBODY REAL', '#b070ff'], ['USER HAS LEFT', '#a03040']].forEach(([s, bg], i) => a.sign(s, -w + 1.4 + i * (2 * w - 2.8) / 4, 2.2 + (i % 2) * 1.6, -d, 2.6, 0.9, '#ffffff', bg, 'archivo'));
        ['CAPS LOCK IS ON', 'YOU: HELLO', 'YOU: HELLO', 'YOU: ANYONE?'].forEach((s, i) => a.sign(s, -w, 1.6 + i * 1.1, -d + 2 + i * 1.6, 3, 0.8, '#101010', '#f2f2ee', 'dot', { ry: 90 })); });
    CR.put('curved_sofa', 0, -1.5, { face: 180 }); CR.put('lava_lamp', -3, 1, {}); CR.native('ghost', 2, 0.5, 180);
};
exports.dress = c => {
    c.put('studio_light', 'P08-02', 3, 7, { face: 30 }); c.put('studio_light', 'P08-02', 8, 7, { face: 330 }); c.put('gaming_chair', 'P08-02', 4, 4, { face: 180 }); c.put('stream_mic', 'P08-02', 5, 4, { face: 180 }); c.put('studio_camera', 'P08-02', 7, 8, { face: 0 }); c.put('plush_prizes', 'P08-02', 8, 4, { face: 180 }); c.put('egg_chair', 'P08-02', 3, 4);
    c.put('pa_speaker', 'P08-01', 3, 3, { face: 90 }); c.put('pa_speaker', 'P08-01', 7, 8, { face: 0 }); c.put('mirror_ball', 'P07-03', 3, 3); c.put('arcade_cabinet', 'P07-03', 8, 3, { face: 180 }); c.put('arcade_cabinet', 'P07-03', 3, 8, { face: 0 });
    c.put('retro_console', 'P06-03', 8, 8); c.put('egg_chair', 'P06-03', 8, 3);
};
exports.people = c => {
    c.native('catgirl', 'P08-01', 8, 4, 225); c.native('popstar', 'P08-01', 4, 4, 90); c.native('influencer', 'P08-02', 6, 4, 0); c.native('bunny girl', 'P08-02', 4, 7, 45);
    ['super sentai', 'knight', 'wizard', 'catgirl', 'robot', 'ninja', 'pirate', 'astronaut'].forEach((r, i) => { const t = (i + 0.5) / 8 * Math.PI * 2; c.native(r, 'P08-03', Math.round(5.5 + Math.cos(t) * 3.8), Math.round(5.5 + Math.sin(t) * 3.8), 0); });
    c.native('quarterback', 'P07-03', 7, 7, 270); c.native('skater', 'P07-03', 4, 7, 90); c.native('android', 'P06-03', 8, 7, 270);
};
exports.airZones = c => [{ sx0: 96, sy0: 0, sx1: 108, sy1: 48, kind: 'motes', n: 90, color: 0xff5fb0 }];
