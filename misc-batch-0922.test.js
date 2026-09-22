/* THE 2026-09-22 BATCH — seventeen Meshy models (R2 Assets/misc/): the catalogue rows, the GLB-first sites over their stand-ins, the
   kickable boxes, the deck lift. Source pins + the catalogue through the sandbox (MODEL_INDEX §3q names the batch). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');

const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, 'MODEL_INDEX.md'), 'utf8');
const D = loadGameData();
const CAT = D.DOOR_HQ.catalogue;

const FILES = {
    ancient_well: 'Meshy_AI_an_ancient_well_0922010024_texture.glb', wooden_bucket: 'Meshy_AI_wooden_bucket_0922011434_texture.glb',
    city_bench: 'Meshy_AI_a_city_bench_0922010124_texture.glb', hot_dog_stand: 'Meshy_AI_a_hot_dog_stand_0922010432_texture.glb',
    military_tank: 'Meshy_AI_a_military_tank_0922010101_texture.glb', yellow_pole: 'Meshy_AI_a_yellow_pole_0922010159_texture.glb',
    hospital_bed: 'Meshy_AI_a_hospital_bed_0922010451_texture.glb', dorm_bed: 'Meshy_AI_a_dorm_bed_0922010217_texture.glb',
    couples_bed: 'Meshy_AI_a_couples_bed_0922010443_texture.glb', royal_bed: 'Meshy_AI_a_royal_bed_0922010438_texture.glb',
    camping_tent: 'Meshy_AI_a_camping_tent_0922010306_texture.glb', carnival_tent: 'Meshy_AI_a_carnival_tent_0922010243_texture.glb',
    fortune_teller_tent: 'Meshy_AI_a_fortune_teller_tent_0922010255_texture.glb', retro_control_panel: 'Meshy_AI_a_retro_control_panel_0922010114_texture.glb',
    vhs_player: 'Meshy_AI_a_vhs_player_0922010233_texture.glb', vhs_tape: 'Meshy_AI_a_vhs_tape_0922010141_texture.glb',
    field_goal_post: 'Meshy_AI_a_yellow_field_goal_post_0922010209_texture.glb',
};

test('every file of the batch is a misc catalogue row and a _MISC_GLB row, and MODEL_INDEX names it', () => {
    const table = TR.slice(TR.indexOf('var _MISC_GLB = {'), TR.indexOf('};', TR.indexOf('var _MISC_GLB = {')));
    for (const [k, f] of Object.entries(FILES)) {
        const row = CAT[k]; assert.ok(row && row.file === f && row.base === 'misc', k + ' catalogued in the misc bucket');
        assert.ok(row.h != null || row.span != null, k + ' sized');
        assert.match(table, new RegExp('\\n\\s*' + k + ':\\s*\'' + f.replace(/\./g, '\\.') + '\''), k + ' in _MISC_GLB');
        assert.ok(INDEX.includes(f), k + ' in MODEL_INDEX');
    }
    assert.equal(Object.keys(FILES).length, 17);
    const jet = CAT.fighter_jet; assert.ok(jet && jet.base === 'weapons' && /f22/.test(jet.file) && jet.turn === 180, 'the F22 reads the weapons bucket (the same file the Air Support spell flies)');
    assert.ok(TR.includes("if (entry.base === 'weapons') return _R2_WEAPONS"), '_hqModelUrl reads base weapons');
});

test('GLB-first over the stand-ins: the well, the bucket, the two benches, the fortune tent, the console, the tape, the shelf\'s VCR, the traffic light\'s pole', () => {
    assert.ok(TR.includes('function _hqCatGlb(key, U, o)'), 'the shared helper');
    /* every call site is guarded for the stub sandboxes: (typeof _hqCatGlb === 'function' ? _hqCatGlb : function () { return null; })('<key>', U, …) */
    const CALL = key => new RegExp("_hqCatGlb : function \\(\\) \\{ return null; \\}\\)\\('" + key + "', U");
    for (const key of ['ancient_well', 'wooden_bucket', 'city_bench', 'fortune_teller_tent', 'retro_control_panel', 'vhs_tape', 'vhs_player']) assert.match(TR, CALL(key), key + ' hung by _hqCatGlb');
    assert.equal((TR.match(new RegExp(CALL('city_bench').source, 'g')) || []).length, 2, 'park_bench AND locker_bench');
    assert.match(TR, /_hzMiscKit\('yellow_pole'/, 'the traffic light pole');
    assert.ok(TR.includes("if (bucketGlb) bucketGlb.position.set(0, (by - 0.12) * U, zc * U);"), 'the bucket rides the rope');
});

test('every cardboard box is kickable (the stack too) and the bucket with them; the beds / tents / stands / posts are catalogued with a footprint', () => {
    for (const k of ['cardboard_box', 'cardboard_boxes', 'wooden_bucket']) assert.ok(D.hqPropKickable(k, CAT[k]), k + ' kickable');
    assert.ok(D.HQ_KICKABLE.maxFoot >= CAT.cardboard_boxes.foot, 'the stack fits the foot cap');
    for (const k of ['hot_dog_stand', 'military_tank', 'fighter_jet', 'hospital_bed', 'royal_bed', 'camping_tent', 'carnival_tent', 'field_goal_post']) assert.ok(CAT[k].block && CAT[k].rect && CAT[k].rect.hw > 0, k + ' blocks with a rect');
});

test('the placements: the wells wear the way, Medical\'s beds, the keep\'s beds, the bunker\'s loft, the grove\'s camp, the Bowl\'s posts, Area 51\'s armour, the cities\' vendors', () => {
    const R = D.DOOR_HQ.rooms;
    const has = (id, key, n) => assert.ok(R[id].props.filter(p => p.key === key).length >= (n || 1), id + ' has ' + key);
    has('medical', 'hospital_bed', 2); has('site_prebuilt_camelot_keep', 'royal_bed'); has('site_prebuilt_camelot_keep', 'dorm_bed', 2); has('site_prebuilt_dumb_bunker', 'couples_bed');
    has('site_prebuilt_bohemian_grove_grove', 'camping_tent', 3); has('site_prebuilt_bohemian_grove_grove', 'carnival_tent'); has('site_prebuilt_stadium_bowl', 'field_goal_post', 2);
    has('site_prebuilt_area51_flightline', 'military_tank', 2); has('site_prebuilt_area51_flightline', 'fighter_jet');
    for (const id of ['site_prebuilt_strip_streets', 'site_prebuilt_downtown_streets', 'site_prebuilt_cyberpunk_streets']) assert.ok(R[id].terrain.features.some(f => f.k === 'scatter' && f.key === 'hot_dog_stand' && f.n >= 2), id + ' scatters hot dog stands');
    assert.ok(Object.values(D.DOOR_HQ.links).filter(l => l.way === 'well').length >= 5, 'the wells are ways (the ancient well hangs on every one)');
});

test('THE FLICKER on the decks: the terrain deck and the cave-grid deck ride 2.5 cm over their data height', () => {
    assert.ok(TR.includes('(dk.y + 0.025) * U + 0.3'), 'the terrain deck');
    assert.ok(TR.includes('(deckY - 0.11 + 0.025) * U + 0.3'), 'the cave grid deck');
});
