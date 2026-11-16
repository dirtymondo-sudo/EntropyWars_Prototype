/* THE CATACOMBS · K (all 6 plots of room `site_prebuilt_vatican_under`: the Loculi, the Crypt, the Font / the Cistern, the Descent, the Warm Wall)
   One thread a file (docs/plans/DISTRICT_THREAD_BRIEF.md); the tool is bake-afterlife.js.
   THE IDEA: the dungeon under the Basilica. THE CRYPT (3.5 m over the galleries; the stair up to the white door behind the altar is in its
   north wall), THE DESCENT ("two flights down and you are level with the dead"), THE LOCULI ("little places": galleries round four blocks
   of graves), THE CISTERN's foot (the rope), THE FONT ("consecrated and cold"), THE WARM WALL (its east wall is Hell's: link `vatican_hell`).
   STANDS TODAY (the first build): the old Catacombs' own pieces on the new plan + four people with their lines.
   NOT YET: grave niches in the walls (NEEDS A MODEL: a loculus wall piece), vaults over the galleries (the Sewers' barrel vault fits),
   bone stacks along the walls, candles in every niche, the warm wall's glow. */
'use strict';
exports.dress = ctx => { const { P, dec } = ctx;
    P('stone_altar', 18, 5, { face: 0 }); P('wooden_cross', 18, 3, { face: 0 }); [[15, 3], [21, 3], [15, 7], [21, 7]].forEach(q => P('sarcophagus', q[0], q[1], { face: 90 })); P('candle_ring', 16, 5); P('candle_ring', 20, 5); P('confessional_booth', 22, 8, { face: 270 });
    [[2, 2], [11, 2], [2, 10], [11, 10], [6, 6], [7, 3], [3, 7]].forEach(q => P('skull_pile', q[0], q[1])); P('trap_coffin_open', 6, 2, { face: 0 }); P('hw_coffin', 3, 6, { face: 90 }); P('hw_coffin_2', 10, 7, { face: 90 }); P('psxg_coffin', 7, 10, { face: 0 });
    P('brazier', 27, 3); P('brazier', 33, 3); P('lectern', 30, 8, { face: 0 }); P('candle_ring', 28, 7); P('candle_ring', 32, 7);
    P('brazier', 26, 15); P('brazier', 26, 21); P('wall_chains', 33, 15); P('skull_pile', 33, 21); P('sarcophagus', 29, 20, { face: 0 });
    P('candle_ring', 3, 16); P('candle_ring', 8, 20); P('wooden_bucket', 8, 16); P('cave_torch', 12, 17); P('cave_torch', 20, 17); P('cave_torch', 16, 12); P('cave_torch', 10, 12);
};
exports.people = ctx => { const { native, say } = ctx;
    native('priest', 31, 16, 250, say('vatican_catacombs', 'priest', 0, 'female'), { gender: 'female' }); native('ghoul', 9, 3, 180, say('vatican_catacombs', 'ghoul'));
    native('priest', 20, 13, 250, say('vatican_catacombs', 'priest', 0, 'male'), { gender: 'male' }); native('vampire', 16, 8, 0);
};
