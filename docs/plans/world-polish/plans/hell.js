/* THREAD 11, HEAVEN + HELL + VATICAN: HELL'S PLAN, laid OVER THE ROOM AS IT STANDS (`underlay`). A LIGHT AND LANDMARK PLAN.
   A PROPOSAL: nothing is built from it until mondo says so. DATA ONLY (the format: plans/README.md).
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/hell.js
   HELL HAS THE BEST SHAPE IN THE WORLD AND YOU CANNOT READ IT: black on black (the screenshot audit, 11-20). IT NEEDS LIGHT, NOT
   HEIGHT. So this plan moves NO ground and lays NO new way: the grey squares are the pit as it stands (the rim 8, the terrace 5, the
   bowl 2, the lava, the platforms over the lava sea). It says WHERE THE LIGHTS AND THE LANDMARKS GO, so that every district reads
   and each light tells you where you are:
   - COLOUR IS THE MAP. The RIM is cold and dark with a line of torches that leads to the Descent. The DESCENT's six flights each
     have a torch pair at head and foot. The BOWL is lit orange from below by the lava. THE PLINTH burns WHITE: the one cold light in
     Hell, seen from every part of the pit. The WALKWAYS' three platforms each carry a beacon of their own colour (red north, amber
     middle, green south), so you know which platform you stand on.
   - Torches are variants of the game's own (cave_torch, wall_torch, tiki_torch): owner-rules.md. The lava glow is real lights.
   Each star on the picture is a light or a landmark. Levels are the room's own. */
'use strict';
module.exports = {
    zone: 'Heaven + Hell + Vatican', thread: 11, room: 'site_prebuilt_hell_plots', underlay: { deep: 30, void: true },
    title: 'HELL: THE LIGHT AND LANDMARK PLAN over the pit as it stands (a proposal; no ground moves)',
    build: { frame: 'room', file: 'docs/areas/afterlife/districts/R D L W.js (lights and props only: no ground, no way)' },
    mass: 'lava and the open pit (closed)', massHeight: 0,
    tiles: { ' ': ['lava / the open pit', false, [120, 36, 10], [120, 36, 10]], u: ['the pit as it stands today (read from the room)', true, [48, 40, 44], [176, 150, 140]] },
    grid: { w: 48, h: 48, n: 12 }, start: [30, 3],
    districts: { R: { name: 'The Rim', color: '#9aa0a6', flat: 'as built: the pit is not reshaped' }, D: { name: 'The Descent', color: '#f2c14e', flat: 'as built' }, L: { name: 'The Bowl', color: '#ff6b3a', flat: 'as built' }, W: { name: 'The Walkways', color: '#b58cff', flat: 'as built' } },
    plots: [
        [0, 0, 'The Fissure\'s End', 'R', 8, 8], [1, 0, 'The Rim, north', 'R', 8, 8, { flat: 'the rim, as built' }], [2, 0, 'The Warm Wall', 'R', 8, 8], [3, 0, 'The High Platforms', 'W', 8, 8],
        [0, 1, 'The Rim, west', 'R', 7, 7], [1, 1, 'The Descent', 'D', 4, 4], [2, 1, 'The Lava Lake', 'L', 3, 3], [3, 1, 'The Walkways', 'W', 8, 8],
        [0, 2, 'The Alcove', 'D', 7, 7], [1, 2, 'The Bowl', 'L', 3, 3, { flat: 'the bowl\'s floor, as built' }], [2, 2, 'The Plinth', 'L', 3, 3], [3, 2, 'The Lava Below', 'W', 3, 3],
        [0, 3, 'The Ash Flats', 'D', 8, 8], [1, 3, 'The Rim, south', 'R', 7, 7], [2, 3, 'The Far Shore', 'L', 7, 7], [3, 3, 'The Walkways, east', 'W', 8, 8]],
    steps: [
        ['label', 30, 1.2, 'THE MOUTH · two tall braziers', 'mark'], ['label', 18, 4.4, 'torch line along the rim: it leads to the Descent', 'note'], ['label', 4, 5.4, 'FISSURE · red glow', 'mark'],
        ['label', 6, 24.2, 'THE DESCENT · torch pairs', 'mark'], ['label', 5, 29.4, 'ALCOVE · one blue flame', 'mark'], ['label', 29, 26.2, 'THE PLINTH · WHITE fire', 'mark'],
        ['label', 20, 22, 'THE BOWL · orange from the lava', 'place'], ['label', 41, 3.2, 'RED beacon', 'mark'], ['label', 41, 14.2, 'AMBER beacon', 'mark'], ['label', 41, 37.2, 'GREEN beacon', 'mark'],
        ['label', 41, 32.4, 'THE LAVA BELOW · glow', 'note'], ['label', 22, 43.4, 'south rim: torch line', 'note'], ['label', 8, 40, 'ASH FLATS · a ring of coals', 'mark'],
    ],
    /* the flights and the walkways that stand today (real pieces), so the walk can be checked */
    stairs: [[[23, 6], [23, 10]], [[4, 25], [8, 25]], [[10, 29], [14, 29]], [[22, 36], [19, 38]], [[38, 27], [39, 27]], [[33, 32], [35, 31]]],   // (the last one: a ramp stub by the lava's east edge; the build thread checks in the game that you can walk back up it)
    bridges: [[[35, 6], [38, 6]], [[35, 17], [39, 17]], [[35, 40], [38, 40]], [[41, 8], [41, 15]], [[41, 19], [41, 26]], [[41, 30], [41, 38]], [[22, 28], [28, 28]]],
    found: [
        { name: 'the chain up the west wall', from: [8, 25], to: [3, 25], kind: 'climb' }, { name: 'the broken wall under the west rim', from: [8, 20], to: [7, 20], kind: 'climb' }, { name: 'the hanging chain to the Far Shore', from: [20, 34], to: [30, 41], kind: 'climb' },
        { name: 'the climb out of the Lava Below (it stands today)', from: [38, 25], to: [39, 27], kind: 'climb' }],
    doors: [[30, 0, 'N', 'the Catacombs (the warm wall)', 8], [0, 6, 'W', 'the Cavern', 8]],
    landmarks: [
        { name: 'The Mouth\'s braziers', at: [30, 2], tall: 3 }, { name: 'The Fissure\'s glow', at: [4, 6], tall: 2 }, { name: 'The rim\'s torch line', at: [16, 5], tall: 2 }, { name: 'The south rim\'s torch line', at: [22, 42], tall: 2 },
        { name: 'The Descent\'s torches', at: [6, 25], tall: 2 }, { name: 'The Alcove\'s blue flame', at: [5, 30], tall: 1 }, { name: 'The Ash Flats\' coals', at: [8, 41], tall: 1 },
        { name: 'The Plinth\'s white fire', at: [29, 28], tall: 6 }, { name: 'The Bowl\'s altar fire', at: [18, 24], tall: 2 },
        { name: 'The red beacon', at: [41, 5], tall: 5 }, { name: 'The amber beacon', at: [41, 17], tall: 5 }, { name: 'The green beacon', at: [41, 40], tall: 5 }],
    lookouts: [
        { name: 'the north rim, over the pit', at: [20, 9], sees: 'The Plinth\'s white fire', next: 'L' }, { name: 'the head of the Descent', at: [9, 25], sees: 'The Plinth\'s white fire', next: 'L' },
        { name: 'the bowl\'s floor', at: [18, 26], sees: 'The Plinth\'s white fire', next: 'W' }, { name: 'the middle platform', at: [41, 18], sees: 'The Plinth\'s white fire', next: 'L' }],
    flats: [{ name: 'The Bowl\'s floor', rect: [14, 16, 24, 30], why: 'the bowl, as built: the pit\'s open floor' }, { name: 'The north rim', rect: [2, 3, 35, 6], why: 'the rim, as built' },
        { name: 'The Ash Flats', rect: [2, 38, 11, 44], why: 'as built' }, { name: 'The High Platforms', rect: [38, 4, 43, 8], why: 'as built' }],
    buildings: [],
    picture: { S: 30 },
};
