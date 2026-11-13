#!/usr/bin/env node
/* list-models.js — writes MODEL_LIST.md, THE master list of every 3D model in the game and HOW IT WAS MADE
   (2026-11-03, mondo: "Any model from spell animations, characters, props, etc. needs to be documented and kept up to date
   with new additions ... the asset list can include how the model was made (asset pack/human, meshy, or made by you in
   blender, etc.)").

   Repo-only dev tooling (like manifest-assets.js): never loaded by the game. It reads the REAL tables, not a copy:
   data.js (DOOR_HQ.catalogue, HQ_TREE_KINDS) through load-data.js, sprites.js (RACE_MODELS_3D, DOOR_CAST_MODELS, the anim
   libraries, the creator's EW_MH_WEAR / EW_HAIR_STYLES / EW_MPFB_BODIES ...) in the same sandbox, the renderer's file tables
   (_MISC_GLB, _WPN_MODELS ...) by text, every literal model URL in the game scripts, and charactercreation/*.json.

   Usage:   node list-models.js            (rewrites MODEL_LIST.md)
            node list-models.js --dry-run  (prints the counts, writes nothing)

   HOW TO KEEP IT TRUE: a model from a NEW folder / pack / maker gets ONE row in SOURCES below (first match wins), then rerun
   the script and commit MODEL_LIST.md in the same PR. Anything the script finds that no SOURCES row matches lands under
   "UNSORTED" at the bottom of MODEL_LIST.md — that is the to-do. The hand-kept parts (the missing-props list, the Meshy
   pieces not wired yet) live in MODEL_LIST_EXTRA.md and are copied in verbatim. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'MODEL_LIST.md');
const EXTRA = path.join(ROOT, 'MODEL_LIST_EXTRA.md');
const DRY = process.argv.includes('--dry-run');
/* THE R2 AUDIT (2026-11-04, mondo: "You are supposed to document every single model"): `--r2` lists the game bucket
   (ewmusicsfx = cdn.entropywars.net) through the Cloudflare REST API (curl; the cloud proxy adds the token, never in a file)
   and rewrites R2_MODEL_FILES.json; a plain run reads that snapshot, so §13 names every model file on R2, used or not. */
const R2_SNAP = path.join(__dirname, 'R2_MODEL_FILES.json');
/* THE ASSET PATH MAP (docs/notes/r2-layout-plan.md): sprites.js EW_ASSET_MOVES = the folders that moved. Every path this list
   collects is shown at its NEW key (moved()); a SOURCES row may still name the old folder (it is tested on both); the R2 snapshot
   skips the old keys a wave keeps on R2 until mondo has checked it. */
const ASSET_MOVES = (() => {
    try {
        const src = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
        const a = src.indexOf('const EW_ASSET_MOVES = ['), b = a >= 0 ? src.indexOf('];', a) : -1;
        return a < 0 || b < a ? [] : [...src.slice(a, b).matchAll(/\[\s*'(Assets\/[^'<]+)'\s*,\s*'(Assets\/[^']+)'\s*\]/g)].map(m => [m[1], m[2]]).sort((x, y) => y[0].length - x[0].length);
    } catch (e) { return []; }
})();
function moved(p) { for (const [o, n] of ASSET_MOVES) if (p.startsWith(o)) return n + p.slice(o.length); return p; }
function unmoved(p) { let best = null; for (const [o, n] of ASSET_MOVES) if (p.startsWith(n) && (!best || n.length > best[1].length)) best = [o, n]; return best ? best[0] + p.slice(best[1].length) : p; }
const isOldKey = (p) => ASSET_MOVES.some(([o]) => p.startsWith(o));
const MODEL_EXT = /\.(glb|gltf|fbx|obj|dae|blend|3ds|stl|ply|c4d|max|ma|mb)$/i;
if (process.argv.includes('--r2')) {
    const { execFileSync } = require('child_process');
    const acct = process.env.CLOUDFLARE_ACCOUNT_ID || 'b2608d464c04fdeec48ba91f04b8aeb7', bucket = process.env.EW_R2_BUCKET || 'ewmusicsfx';
    const files = []; let cur = null;
    for (;;) {
        const u = 'https://api.cloudflare.com/client/v4/accounts/' + acct + '/r2/buckets/' + bucket + '/objects?per_page=1000' + (cur ? '&cursor=' + encodeURIComponent(cur) : '');
        const r = JSON.parse(execFileSync('curl', ['-sS', '--max-time', '120', u], { maxBuffer: 1 << 28 }).toString());
        if (!r.success) { console.error('R2 listing refused: ' + JSON.stringify(r.errors || r).slice(0, 300)); process.exit(1); }
        for (const o of r.result) if (MODEL_EXT.test(o.key) && !isOldKey(o.key)) files.push([o.key, o.size]);
        const ri = r.result_info || {}; cur = ri.cursor;
        if (!ri.is_truncated || !cur) break;
    }
    files.sort((a, b) => a[0].localeCompare(b[0]));
    fs.writeFileSync(R2_SNAP, JSON.stringify({ bucket, listed: new Date().toISOString().slice(0, 10), files }, null, 0).replace(/\],\[/g, '],\n['));
    console.log('R2 snapshot: ' + files.length + ' model files in ' + bucket);
}
const CDN = 'https://cdn.entropywars.net/';

/* ── HOW EACH MODEL WAS MADE. `how` is one of the HOW keys; first matching row wins (tested on the bucket path). ── */
const HOW = {
    PACK:      { label: 'Asset pack', human: 'yes' },
    PACK_ANON: { label: 'Asset pack (author not recorded yet)', human: 'yes' },
    MH:        { label: 'MakeHuman community asset', human: 'yes' },
    MH_BLEND:  { label: 'MakeHuman parts, baked by Claude in Blender', human: 'yes (parts)' },
    MONDO:     { label: "mondo's own model", human: 'yes' },
    MONDO_TEX: { label: "mondo's own model, texture by Meshy AI (Retexture on his UVs)", human: 'yes (mesh)' },
    MESHY:     { label: 'Meshy AI', human: 'no' },
    MESHY_C:   { label: 'Meshy AI, reworked by Claude', human: 'no' },
    BLENDER:   { label: 'Claude in Blender', human: 'no' },
    CODE:      { label: 'Claude in code (three.js, no file)', human: 'no' },
    MOCAP:     { label: 'Motion capture (real actors), cut into loops by Claude', human: 'yes (motion)' },
};
const SOURCES = [
    { re: /world\/props\/meshy\/(treadmill|welding_cart|photocopier|newspaper_bundles|studio_camera|pallet_jack|hand_truck|mailbox_bank)\.glb/, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (Disaster City interiors, Hero Plaza second pass, mondo 2026-11-13: "make meshy versions of them"; claims in project files meshy/interior-claims.md)' },
    { re: /ew_plant_(thornvine|gasplant|healflower|apple)\.glb/, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (THE GARDEN: the plants the seeds grow into + the apple of the apple tree; plant concepts approved by mondo 2026-11-12)' },
    // the shared animation libraries
    { re: /Assets\/Models\/UAL\d/, how: 'PACK', src: 'Universal Animation Library · Quaternius · CC0' },
    { re: /characters\/animations\/MAL[45]_Sniper/, how: 'MESHY_C', src: "Meshy's animation library pulled through the Meshy API on the male sniper's rig (2026-11-11), packed by Claude (build-mal.py)" },
    { re: /characters\/animations\/MOC2_100STYLE/, how: 'MOCAP', src: 'The 100STYLE Dataset (Ian Mason, CC BY 4.0), converted by mocap-100style.py, in-place loops by bake-mocap.py' },
    { re: /(Assets\/Models|characters\/animations)\/MOC\d/, how: 'MOCAP', src: 'CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu, BVH by B. Hahne), in-place loops by bake-mocap.py' },
    { re: /Assets\/Models\/MAL\d/, how: 'MESHY_C', src: "Meshy's 20 animations exported from the male sniper, consolidated by Claude (build_mal2.js)" },
    // character creator
    { re: /charactercreation\/wear\/ewf_/, how: 'MH_BLEND', src: 'MPFB 2 hair editor fur (Tomáš Klecer templates, MakeHuman CC0) grown + baked to a body shell in cloud Blender (bake-fur.py)' },
    { re: /charactercreation\/wear\/ewb_beard_/, how: 'MH_BLEND', src: 'MakeHuman pack beard + moustache joined in Blender (bake-beards.py)' },
    { re: /charactercreation\/wear\/ewb_cowboyhat_worn/, how: 'MONDO_TEX', src: "mondo's cowboy hat + a Meshy Retexture base colour on his UVs (worn dark / worn tan; bake-clothes.py SOLIDS)" },
    { re: /charactercreation\/wear\/ewb_cowboyhat/, how: 'MONDO', src: "mondo's cowboy hat, fitted to the bodies in Blender (bake-clothes.py SOLIDS)" },
    { re: /charactercreation\/wear\/ewb_/, how: 'BLENDER', src: 'bake-clothes.py / bake-garment.py (cloud Blender)' },
    { re: /charactercreation\/wear\/ewm_/, how: 'MESHY', src: 'Meshy AI piece made by Claude through the Meshy API (concept -> mondo\'s OK -> model), fitted on the MPFB bodies in Blender (bake-meshy.py, PR #829)' },
    { re: /charactercreation\/wear\/mhw_/, how: 'MH', src: 'MakeHuman asset packs (author + licence per piece in charactercreation/wear/wear.json)' },
    { re: /charactercreation\/hair\/mh\//, how: 'MH', src: 'MakeHuman hair (author + licence per style in charactercreation/hair/mh/hair_styles.json)' },
    { re: /charactercreation\/hair\/hair\d/, how: 'PACK_ANON', src: "Hair pack part 1 (HairPackPT1.glb, mondo's 2026-09-11 upload), split by character-rig.js" },
    { re: /charactercreation\/mpfb\/looks\/eyes/, how: 'MH_BLEND', src: "MakeHuman high-poly eye mesh (bake-eyes.py) + mondo's eye textures" },
    { re: /charactercreation\/mpfb\//, how: 'MH_BLEND', src: 'MakeHuman / MPFB2 base body (CC0), built + rigged by Claude in Blender (bake-mpfb.py / bake-mpfb-classic.py)' },
    { re: /charactercreation\/Meshy_AI_/, how: 'MESHY_C', src: 'Meshy base body, rigged by Claude (character-rig.js bodies)' },
    // packs with a known author (the same rows as data.js EW_CREDITS)
    { re: /Assets\/foilage\/OBJ\//, how: 'PACK', src: 'LowPoly nature · Quaternius · CC0' },
    { re: /Assets\/foilage\/(FBX|Blends)\//, how: 'PACK', src: 'LowPoly nature · Quaternius · CC0 (the same trees as FBX / .blend; the game loads the OBJ)' },
    { re: /Assets\/foilage\/retrotreepack\//, how: 'PACK', src: 'Retro Tree Pack · Pizza Doggy · Pizza Doggy licence, NOT CC0 (no AI use of the assets, no redistributing them as standalone files)' },
    // 2026-11-08 (mondo bought it with the creator's coupon): the whole pack, one folder per pack category, not wired yet (MODEL_LIST §12b)
    { re: /Assets\/world\/packs\/pizzadoggy_psx_mega_pack\//, how: 'PACK', src: 'PSX Mega Pack · Pizza Doggy · Pizza Doggy licence, NOT CC0 (no AI use of the assets, no redistributing them as standalone files)' },
    { re: /Assets\/Metro_PSX\//, how: 'PACK', src: 'Metro PSX · Elbolilloduro · CC0' },
    { re: /Assets\/halloween\//, how: 'PACK', src: 'Halloween pack · Elbolilloduro · CC0' },
    { re: /Assets\/christmas\//, how: 'PACK', src: 'Christmas pack · Elbolilloduro' },
    // THE PACK ROADS (2026-11-09): every piece of Elbolilloduro's Roads pack, one GLB each (bake-roads.py; data.js HQ_CATALOGUE_ROADS)
    { re: /Assets\/world\/packs\/elbolilloduro\/roads\//, how: 'PACK', src: 'Roads · Elbolilloduro · CC0 (every piece of the pack cut into its own GLB in Blender by bake-roads.py; data.js HQ_CATALOGUE_ROADS, editor group Roads)' },
    // THE MESHY SWAP (2026-11-03): one piece cut out of an Elbolilloduro pack scene by Claude in Blender (bake-pack-pieces.py), Assets/misc/ebd_<pack>_<item>.glb
    // THE INDUSTRIAL PACK (2026-11-13, Disaster City's Industrial district): domi236's PS1/PSX Industrial Pack #1, cut by bake-pack-pieces.py ind_*
    // THE PLAYGROUND (2026-11-13, the city prop pass): Cursedlake's PS1 Playground from mondo's asset-packs folder, cut by bake-pack-pieces.py play_*
    { re: /Assets\/world\/packs\/cursedlake_playground\//, how: 'PACK', src: 'PS1 Playground · Cursedlake · from mondo\'s asset-packs folder (each piece cut out in Blender by bake-pack-pieces.py play_*; DOOR_HQ.catalogue play_*, Disaster City)' },
    { re: /Assets\/world\/packs\/domi236_industrial\//, how: 'PACK', src: 'PS1/PSX Industrial Pack #1 · domi236 (itch.io) · CC0 (each piece cut out in Blender by bake-pack-pieces.py ind_*; DOOR_HQ.catalogue ind_*, Disaster City)' },
    { re: /Assets\/misc\/ebd_\w+_city_/, how: 'PACK', src: 'Pizzeria PSX / Gas Station / DINER / BurgerPiz / 6twelve / Tacos / Laundry / VHS Shop / House / Quequis House · Elbolilloduro · CC0 (the scene\'s whole building cut out in Blender by bake-pack-pieces.py city_*; Disaster City, docs/disaster-city/pack-claims.md)' },
    { re: /Assets\/misc\/ebd_buildings_/, how: 'PACK', src: 'Buildings · Elbolilloduro · CC0 (one shop block cut out in Blender; HQ_PACK_BUILDINGS)' },
    { re: /Assets\/misc\/ebd_pizzeria_/, how: 'PACK', src: 'Pizzeria PSX · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_diner_/, how: 'PACK', src: 'DINER · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/meshy_babel_house_/, how: 'MESHY', src: 'Meshy image-to-3D from Claude\'s concept, mondo OK\'d 11-05 (DOOR_HQ.catalogue babel_house_*, the Babel room)' },
    { re: /Assets\/misc\/ebd_trailerscene_/, how: 'PACK', src: 'Trailer Park · Elbolilloduro · CC0 (one whole trailer cut out of the scene in Blender; DOOR_HQ.catalogue trailer_home_N in Area 51 + Skinwalker rooms)' },
    { re: /Assets\/misc\/ebd_abandonedhouse_(?!house)/, how: 'PACK', src: 'Abandoned House · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_dinerscene_/, how: 'PACK', src: 'DINER · Elbolilloduro · CC0 (piece cut out of the DINER scene in Blender)' },
    { re: /Assets\/misc\/ebd_abandonedhouse_/, how: 'PACK', src: 'Abandoned House · Elbolilloduro · CC0 (the house exterior cut out in Blender, basement cut; DOOR_HQ.catalogue abandoned_house past the Haunted grounds)' },
    { re: /Assets\/misc\/ebd_trailerpark_/, how: 'PACK', src: 'Trailer Park · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_6twelve_/, how: 'PACK', src: '6TWELVE · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_psx3_/, how: 'PACK', src: 'Paquete de modelos psx 3 · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_laundry_/, how: 'PACK', src: 'Laundry · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_house_/, how: 'PACK', src: 'House · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_vhsshop_/, how: 'PACK', src: 'VHS Shop · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_metro_/, how: 'PACK', src: 'Metro PSX · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_tacos_/, how: 'PACK', src: 'Tacos · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_busstop_/, how: 'PACK', src: 'Bus stop · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_survival_/, how: 'PACK', src: 'Survival PSX · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_vegetation_/, how: 'PACK', src: 'Vegetation · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_housesonwater_/, how: 'PACK', src: 'Houses on the water · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_mine_/, how: 'PACK', src: 'Mine · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_burgerpiz_/, how: 'PACK', src: 'BurgerPiz · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_gasstation_/, how: 'PACK', src: 'Gas station · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/molten_/, how: 'PACK', src: 'Molten Maps SciFi Asset Pack · Moltenbolt · CC0' },
    { re: /Assets\/vehicles\//, how: 'PACK', src: 'Low-poly cars · GGBot' },
    { re: /Assets\/stairs\/stairs_railings/, how: 'PACK', src: 'Stairs & Railings · ATD-London · CC-BY 4.0 (credit required)' },
    { re: /Assets\/stairs\/stairs\.glb/, how: 'PACK', src: 'Stairs · Ansh_Singla · CC-BY 4.0 (credit required)' },
    { re: /Assets\/misc\/Castles_and_Forts\.glb/, how: 'PACK', src: 'Castle and Fort Builder Pack · McSteeg (itch.io) · free for games, credit given' },
    { re: /UFO_Low_Poly\.fbx/, how: 'PACK', src: '3D Game Ready UFO Spaceship · FlexUnit · CC0' },
    { re: /_sway\.glb$/, how: 'MESHY_C', src: 'Meshy rig + spring-bone cape chain baked by Claude (bake-sway.py)' },
    { re: /Assets\/props\/(police_barricade|flat_earth|heart_scales|maat_feather)\.glb/, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (ultimate spell props, concepts picked by mondo 2026-11-03: barricade U01a, flat earth U03b, scales U04a, feather U06a)' },
    { re: /Assets\/props\//, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (concepts approved by mondo, 2026-11-03; held props + worn gear, PR #827)' },
    { re: /Assets\/decor\//, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (concepts approved by mondo, 2026-11-03)' },
    // Meshy exports (mondo's, made on meshy.ai) — before the folder rows so a Meshy file in a pack folder still reads Meshy
    { re: /Assets\/misc\/wings\.glb$/, how: 'PACK_ANON', src: "Angel wings pair (mondo's upload, maker not recorded): retired 2026-10-27 for the single Meshy wings" },
    { re: /(^|\/)MAL\d_Sniper\.glb$/, how: 'MESHY_C', src: "Meshy animations from the male sniper, consolidated by Claude (a stray copy at the bucket root)" },
    { re: /Assets\/misc\/wings\/Meshy_AI_/, how: 'MESHY', src: 'Meshy AI (single wing, mirrored in code)' },
    { re: /_Character_output\.glb|_withSkin\.glb|Meshy_AI_\w+_Running\.glb/, how: 'MESHY', src: 'Meshy AI rigged character (mondo)' },
    { re: /Meshy_AI_/, how: 'MESHY', src: 'Meshy AI (mondo)' },
    { re: /Assets\/animals\/eagle_rigged/, how: 'MESHY_C', src: "Meshy-style eagle export (mondo's upload), rig + 5 clips by Claude (bake-eagle.mjs)" },
    { re: /Assets\/animals\/horses\/Horse_glb\.glb#unicorn/, how: 'PACK_ANON', src: "Horse pack (mondo's upload) + Meshy unicorn horn + Meshy angel wing" },
    // packs mondo uploaded whose author is not recorded yet (also listed as "needs a source" by the credits thread)
    { re: /Assets\/oceanic\//, how: 'PACK_ANON', src: "Ocean pack (mondo's upload, 48 FBX)" },
    { re: /Assets\/animals\/insects\//, how: 'PACK_ANON', src: "Insects pack (mondo's upload)" },
    { re: /Assets\/animals\/horses\//, how: 'PACK_ANON', src: "Horse pack (mondo's upload)" },
    { re: /Assets\/animals\/bats\//, how: 'PACK_ANON', src: "Bats (mondo's upload, OBJ)" },
    { re: /Assets\/animals\/elephant\//, how: 'PACK_ANON', src: "Elephant (mondo's upload, FBX)" },
    { re: /Assets\/animals\/crow_and_rabbit\//, how: 'PACK_ANON', src: "Crow + rabbit (mondo's upload)" },
    { re: /Assets\/animals\/top_fangs/, how: 'PACK_ANON', src: "Top fangs (mondo's upload)" },
    { re: /Assets\/animals\/eagle\.(fbx|glb)$/, how: 'MESHY', src: "Meshy-style eagle export (mondo's upload): the unrigged original of eagle_rigged.glb" },
    { re: /Assets\/animals\//, how: 'PACK_ANON', src: "Farm / zoo animals (mondo's upload)" },
    { re: /Assets\/instruments\//, how: 'PACK_ANON', src: "Instruments + orchestral (mondo's upload)" },
    { re: /Assets\/traps\//, how: 'PACK_ANON', src: "Traps pack (mondo's upload)" },
    { re: /Assets\/chess\//, how: 'PACK_ANON', src: "Low Poly Chess Set (mondo's upload, FBX)" },
    { re: /Assets\/weapons\/spear\//, how: 'PACK_ANON', src: "Spear (mondo's upload, FBX)" },
    { re: /Assets\/misc\/road\//, how: 'PACK_ANON', src: "Road piece (mondo's upload, author not recorded; .3ds / .blend / .dae / .fbx / .obj of one model)" },
    { re: /Assets\/misc\/(eyeball|streetlamp|Pyramid)\//, how: 'PACK_ANON', src: "Authored OBJ / GLB (mondo's upload, author not recorded)" },
    { re: /_cc0_clip_ready/, how: 'PACK_ANON', src: "CC0 'clip ready' prop (mondo's upload, author not recorded)" },
    { re: /Assets\/door\/models\/(computer_chair|asteroid_)/, how: 'PACK_ANON', src: "D.O.O.R. kit upload (mondo, author not recorded)" },
    { re: /Assets\/door\/models\/[^/]*\bdoor\b[^/]*\.glb$/i, how: 'PACK_ANON', src: "Door leaves (mondo's upload, author not recorded)" },
];
function sourceOf(p) {
    const o = unmoved(p);   // first row wins, tested on the new path AND the path before the R2 layout move
    for (const s of SOURCES) if (s.re.test(p) || (o !== p && s.re.test(o))) return s;
    return null;
}

/* ── collect ── */
const rows = new Map();            // bucket path → row
function bucketPath(u) {
    let p = String(u || '');
    if (p.startsWith(CDN)) p = p.slice(CDN.length);
    p = p.replace(/\?.*$/, '');
    try { p = decodeURI(p); } catch (e) {}
    return moved(p);
}
function add(section, key, url, note) {
    const p = bucketPath(url);
    if (!/\.(glb|gltf|fbx|obj|dae)(#.*)?$/i.test(p)) return;
    const id = section + '|' + p + '|' + key;
    if (rows.has(id)) return;
    rows.set(id, { section, key: key || '', path: p, note: note || '', src: sourceOf(p) });
}

const sb = loadGameData();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
vm.runInContext(read('sprites.js') + '\n;window.__EWML = { R: RACE_MODELS_3D, C: DOOR_CAST_MODELS, LIB: EW_ANIM_LIB_URLS, WEAR: EW_MH_WEAR, HAIR: EW_HAIR_STYLES, BASE: EW_CHARACTER_ASSET_BASE, BODIES: (typeof EW_MPFB_BODIES !== "undefined" ? EW_MPFB_BODIES : null), BEARDS: (typeof EW_MH_FACIAL_HAIR !== "undefined" ? EW_MH_FACIAL_HAIR : null), LOOKS: RACE_CREATOR_LOOKS, SKINS: (typeof RACE_MODEL_SKINS !== "undefined" ? RACE_MODEL_SKINS : {}) };', sb, { filename: 'sprites.js' });
const SP = sb.__EWML;

// 1. characters
for (const race of Object.keys(SP.R).sort()) {
    const v = SP.R[race] || {};
    for (const g of Object.keys(v)) if (v[g] && v[g].model) add('units', race + (g === 'male' ? '' : ' (' + g + ')'), v[g].model,
        SP.LOOKS && SP.LOOKS[race] ? 'creator look also baked' : '');
}
for (const id of Object.keys(SP.C).sort()) if (SP.C[id] && SP.C[id].model) add('cast', id, SP.C[id].model);
(SP.LIB || []).forEach(u => add('anim', path.basename(u, '.glb'), u));
// site skins / alternates of a race (RACE_MODEL_SKINS)
(function walk(o, label) {
    if (!o || typeof o !== 'object') return;
    if (o.model && typeof o.model === 'string') { add('units', label + ' (skin)', o.model); return; }
    for (const k of Object.keys(o)) walk(o[k], k === 'sites' || k === 'alts' || /^\d+$/.test(k) ? label : (label ? label + ' · ' + k : k));
})(SP.SKINS, '');
// the legacy per-character Meshy clip exports (the fallback when the shared library fails; a few rigs use them on purpose)
const clipRows = [];
for (const race of Object.keys(SP.R).sort()) for (const g of Object.keys(SP.R[race] || {})) {
    const d = SP.R[race][g]; if (!d || !d.clips) continue;
    const slots = Object.keys(d.clips).filter(k => typeof d.clips[k] === 'string');
    if (slots.length) clipRows.push([race + (g === 'male' ? '' : ' (' + g + ')'), slots, bucketPath(d.clips[slots[0]]).replace(/\/[^/]*$/, '/')]);
}

// 2. the catalogue (every room / editor prop)
const H = sb.DOOR_HQ;
const KIT = H.assets.models;
const BASES = {
    misc: CDN + 'Assets/misc/', weapons: CDN + 'Assets/weapons/', rt: CDN + 'Assets/foilage/retrotreepack/GLB/',
    ocean: CDN + 'Assets/oceanic/', animals: CDN + 'Assets/animals/', instruments: CDN + 'Assets/instruments/',
    traps: CDN + 'Assets/traps/', chess: CDN + 'Assets/chess/', psxmp: CDN + 'Assets/world/packs/pizzadoggy_psx_mega_pack/', asset: CDN + 'Assets/',
};
const R3 = read('three-renderer.js');
const XMAS_FILE = (R3.match(/var _XMAS_FILE = '([^']+)'/) || [, 'Christmas.dae'])[1];
const METRO_URL = (R3.match(/_R2_METRO \+ '([^']+\.glb)'/) || [, 'Models/Metro.glb'])[1];
const procRows = [];
/* a proc builder that hangs a real model over its own pieces (THE ONE MODEL: _hqCatGlb / _hqOneModel, a race model, a retro
   tree) is not a stand-in — `procWears` names what it wears, read off the builder's body in three-renderer.js */
function procBody(proc) {
    const m = new RegExp('^\\s+' + proc + ':\\s*function', 'm').exec(R3);
    if (!m) return '';
    const rest = R3.slice(m.index + m[0].length);
    const nx = /^\s+[a-z_0-9]+:\s*function/m.exec(rest);
    return nx ? rest.slice(0, nx.index) : rest.slice(0, 4000);
}
function fnBody(name) {   // a top-level `function _hqXxx(` helper a builder hands its work to
    const i = R3.indexOf('function ' + name + '(');
    if (i < 0) return '';
    const rest = R3.slice(i + 9 + name.length);
    const nx = /\n    (?:function |var |\/\*)/.exec(rest);
    return nx ? rest.slice(0, nx.index) : rest.slice(0, 4000);
}
function procWears(proc) {
    let body = procBody(proc);
    if (!body) return null;
    /* THE MESHY AUDIT (2026-11-04): a builder that hands its work on (`_hqProcBuilders._laundry_machine(...)`, `_hqLavaLampBuild(...)`)
       is read through that helper too, and a model named straight off the decor tables (`_HQ_DECOR_GLB.grow_lamp`,
       `_HQ_DECOR_GLB[floor ? 'lava_lamp_floor_base' : …]`) or by `_hqDecorWear(a ? 'dryer' : 'washer', …)` counts as worn */
    for (const d of body.matchAll(/_hqProcBuilders\._(\w+)\(/g)) body += procBody('_' + d[1]);
    for (const d of body.matchAll(/\b(_hq\w+Build)\(/g)) body += fnBody(d[1]);
    const hits = new Set();
    for (const h of body.matchAll(/_HQ_DECOR_GLB\.(\w+)|_HQ_DECOR_GLB\[[^\]]*?'(\w+)'[^\]]*\]|_hqDecorWear\([^,']*\?\s*'(\w+)'\s*:\s*'(\w+)'/g)) [h[1], h[2], h[3], h[4]].forEach(x => x && hits.add(x));
    for (const h of body.matchAll(/\('([a-z_]+)', U|_hqSpellUrl\('(\w+)'\)|_hqMiscUrl\('(\w+)'\)|getRace3DModel\('([^']+)'|(_nrTree)\(|_hqProcBuilders\._(conveyor)\(/g)) hits.add(h[1] || h[2] || h[3] || h[4] || (h[5] && 'a retro-pack tree') || (h[6] && 'conveyor'));
    return hits.size ? [...hits].join(', ') : null;
}
/* THE MESHY AUDIT (2026-11-04): a catalogue row / a _VEHICLE_KIT row with a `pack` DRAWS mondo's car pack (GGBot OBJs,
   three-renderer.js _CAR_PACK_POOLS); its Meshy file is only the fallback (window.EW_NO_CAR_PACK). Read the pools off the
   renderer so the list names the cars actually drawn, and file the Meshy copy under "fallback only". */
const carPool = {};
for (const m of (block(R3, 'var _CAR_PACK_POOLS = {') || '').matchAll(/(\w+):\s*\{[^\n]*?rows:\s*\[(.*)\]\s*\}/g))
    carPool[m[1]] = [...m[2].matchAll(/\[(\d), \[([^\]]*)\]\]/g)].map(x => [+x[1], x[2]]);
for (let n = 1; n <= 8; n++) carPool['car0' + n] = carPool['car0' + n] || [[n, "''"]];
function carPackFiles(pool) {
    const out = [];
    for (const [n, paints] of carPool[pool] || []) {
        const dir = CDN + 'Assets/vehicles/Car 0' + n + '/', base = n === 1 ? 'Car.obj' : 'Car' + n + '.obj';
        if (n === 5 && /'taxi'/.test(paints)) out.push(dir + 'Car5_Taxi.obj');
        if (n === 5 && /'police/.test(paints)) out.push(dir + 'Car5_Police.obj');
        if (paints.split(',').some(p => !/taxi|police/.test(p))) out.push(dir + base);
    }
    return [...new Set(out)];
}
const meshyFallback = [];   // [key, url, what draws instead]
for (const k of Object.keys(H.catalogue)) {
    const r = H.catalogue[k];
    let url = null;
    if (r.base === 'metro') url = CDN + 'Assets/Metro_PSX/' + METRO_URL + '#' + (r.node || k);
    else if (r.base === 'xmas') url = CDN + 'Assets/christmas/models/' + XMAS_FILE + '#' + (r.node || k);
    else if (r.base === 'halloween') url = CDN + 'Assets/halloween/models/halloween.fbx#' + (r.node || k);
    else if (r.file && r.base && BASES[r.base]) url = BASES[r.base] + r.file + (r.base === 'rt' && !/\.glb$/.test(r.file) ? '.glb' : '') + (r.node ? '#' + r.node : '');
    else if (r.file && r.base === 'chess') url = BASES.chess + r.file + (r.node ? '#' + r.node : '');
    else if (r.file) url = KIT + r.file + (r.node ? '#' + r.node : '');
    else if (r.pack) url = CDN + 'Assets/vehicles/' + r.pack;
    if (url) {
        if (r.pack) {
            const files = carPackFiles(r.pack);
            files.forEach((f, i) => add('props', k + (files.length > 1 ? ' (' + (i + 1) + ' of ' + files.length + ')' : ''), f, 'the car pack, pool `' + r.pack + '`'));
            if (r.file) meshyFallback.push([k, url, 'car pack pool `' + r.pack + '`']);
        }
        else add('props', k, url);
    } else if (r.proc && !/^(bat_|trap_)/.test(k)) procRows.push([k, r.proc, r.h || r.span || '', procWears(r.proc)]);
}
['Car5_Taxi', 'Car5_Police'].forEach(f => add('props', f.toLowerCase().replace('car5', 'car_pack_5'), CDN + 'Assets/vehicles/Car 05/' + f + '.obj', 'paint'));
// the stairs pack (data.js HQ_STAIR_PACK.files): every stair flight + railing of the rooms
const SPK = sb.HQ_STAIR_PACK || {};
for (const k of Object.keys(SPK.files || {})) if (k !== 'metro') add('stairs', k, CDN + SPK.files[k]);
// 3. foliage (HQ_TREE_KINDS + the renderer's key map)
const FOL_OBJ = CDN + 'Assets/foilage/OBJ/';
function foliageUrl(name) {
    if (!name) return null;
    if (name.startsWith('rt:')) return BASES.rt + name.slice(3) + '.glb';
    if (name.startsWith('kit:')) return KIT + name.slice(4);
    if (name.startsWith('misc:')) return BASES.misc + name.slice(5);
    if (name.startsWith('xmas:')) return CDN + 'Assets/christmas/models/' + XMAS_FILE + '#' + name.slice(5);
    return FOL_OBJ + name + '.obj';
}
for (const k of Object.keys(sb.HQ_TREE_KINDS || {})) {
    const T = sb.HQ_TREE_KINDS[k];
    if (T.model) add('foliage', k, foliageUrl(T.model));
    else if (T.chess) add('foliage', k, CDN + 'Assets/chess/Low Poly Chess Set.fbx#' + (T.node || k));
}
const fm = R3.match(/var _FOLIAGE_MODEL_FOR_KEY = \{([\s\S]*?)\};/);
if (fm) for (const m of fm[1].matchAll(/(\w+):\s*'([^']+)'/g)) add('foliage', m[1], foliageUrl(m[2]));

// 4. the renderer + VFX file tables (spell props, sky / horizon models, animals)
function block(src, start) {
    const i = src.indexOf(start); if (i < 0) return '';
    let d = 0, j = src.indexOf('{', i);
    for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(j, k + 1); } }
    return '';
}
const misc = block(R3, 'var _MISC_GLB = {');
for (const m of misc.matchAll(/^\s+(\w+):\s*'([^']+\.(?:glb|obj|fbx))'/gm)) add('misc', m[1], BASES.misc + m[2]);
// the NPC traffic (_VEHICLE_KIT.<k>.pack = '<pool>'): those Meshy cars only draw when the car pack is off
for (const m of R3.matchAll(/_VEHICLE_KIT\.(\w+)\.pack = '(\w+)'/g)) {
    const id = [...rows.keys()].find(i => i.startsWith('misc|') && i.endsWith('|' + m[1]));
    if (!id) continue;
    meshyFallback.push([m[1] + ' (NPC traffic)', CDN + rows.get(id).path, 'car pack pool `' + m[2] + '`: ' + carPackFiles(m[2]).map(f => f.replace(CDN + 'Assets/vehicles/', '')).join(', ')]);
    rows.delete(id);
}
// THE PACK WEAR (2026-11-04, THE MESHY AUDIT): pack pieces cut out in Blender that the procs wear (three-renderer.js _HQ_PACK_WEAR)
for (const m of (block(R3, 'var _HQ_PACK_WEAR = {') || '').matchAll(/(\w+):\s*'([^']+\.glb)'/g)) add('packwear', m[1], BASES.misc + m[2]);
const VFX = read('three-vfx-effects.js');
const wpn = block(VFX, 'var _WPN_MODELS = {');
for (const m of wpn.matchAll(/^\s+(\w+):\s*\{[^}]*?\b(file|url):\s*'([^']+)'/gm)) add('spell', m[1], m[2] === 'url' ? m[3] : BASES.weapons + m[3]);
// THE MESHY DECOR (2026-11-03): the models the procs wear (three-renderer.js _HQ_DECOR_GLB) + its three spell props
const decor = block(R3, 'var _HQ_DECOR_GLB = {');
for (const m of decor.matchAll(/(\w+):\s*'([^']+\.glb)'/g)) add('decor', m[1], CDN + 'Assets/decor/' + m[2]);
for (const m of VFX.matchAll(/_WPN_MODELS\.(\w+) = \{ url: _DECOR_BASE \+ '([^']+)'/g)) add('spell', m[1], CDN + 'Assets/decor/' + m[2]);
// THE PROPS IN THE HAND + THE GEAR ON THE BODY (2026-11-03, PR #827): the Meshy pieces #47-72 on R2 Assets/props/
const heldP = (VFX.match(/var P = \{([\s\S]*?)\};/) || [, ''])[1];
for (const m of heldP.matchAll(/(\w+):\s*\['([^']+\.glb)'/g)) add('spell', m[1] + ' (held in the hand)', CDN + 'Assets/props/' + m[2]);
// the ultimate spell props (2026-11-03): Lockdown barricades, Flat Earth disc, Weigh the Heart scales + feather; not held in the hand
const ULT_PROPS = { policeBarricade: 'Lockdown', flatEarth: 'Flat Earth', heartScales: 'Weigh the Heart', maatFeather: 'Weigh the Heart' };
for (const m of VFX.matchAll(/_WPN_MODELS\.(\w+) = \{ url: _PROPS_BASE \+ '([^']+)'/g)) add('spell', m[1] + (ULT_PROPS[m[1]] ? ' (' + ULT_PROPS[m[1]] + ' ultimate prop)' : ' (held in the hand)'), CDN + 'Assets/props/' + m[2]);
const gearW = block(R3, 'var UNIT_GEAR_WEAR = {');
for (const m of gearW.matchAll(/^\s+(\w+):\s*\{\s*file:\s*'([^']+\.glb)'/gm)) add('gear', m[1], CDN + 'Assets/props/' + m[2]);
// the bats the bat_ procs draw (`_BAT_BASE + 'bat_' + kind + '.obj'`, a name built at run time)
for (const m of ((R3.match(/var _BAT_KINDS = \[([^\]]*)\]/) || [, ''])[1]).matchAll(/'(\w+)'/g)) add('animal', 'bat_' + m[1] + ' (the bat_ procs)', CDN + 'Assets/animals/bats/bat_' + m[1] + '.obj');
const ani = block(R3, 'var _ANIMALS = {');
for (const m of ani.matchAll(/^\s+(\w+):\s*\{\s*file:\s*'([^']+)'/gm)) add('animal', m[1], BASES.animals + m[2]);
// THE PACK BUILDINGS (2026-11-03): the Buildings pack's shop blocks (data.js HQ_PACK_BUILDINGS: Disaster City's lots + the editor's Look list)
const packB = block(read('data.js'), 'const HQ_PACK_BUILDINGS = {');
for (const m of packB.matchAll(/(\w+):\s*\{\s*file:\s*'([^']+\.glb)'/g)) add('misc', m[1] + ' (a whole building)', BASES.misc + m[2]);
// the halloween pieces the spells cut out of the one kit file
const hwNodes = new Set();
for (const m of (VFX + R3).matchAll(/var _(?:HW_SWEETS|HW_PAILS|HW_GRAVE_NODES|HWC_NODES|BP_WARM|PK_LANTERNS|PK_WHOLE|GRAVE_HW_STONES)\s*=\s*\[([^\]]*(?:\][^;]*)?)\]/g))
    for (const n of m[1].matchAll(/'([A-Za-z][\w ]*)'/g)) hwNodes.add(n[1]);
['Candy_Bowl', 'Shovel'].forEach(n => hwNodes.add(n));

// 5. every literal model URL left in the game scripts (the catch-all: nothing slips through)
const GAME = ['data.js', 'three-renderer.js', 'three-vfx-effects.js', 'sprites.js', 'battle.js', 'map.js', 'editor.js', 'hud.js', 'ui.js',
    'online.js', 'party-builder.js', 'three-post.js', 'three-camera.js', 'three-lightning.js', 'three-vfx.js', 'index.html'];
const literalRefs = [];
for (const f of GAME) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    const src = read(f);
    for (const m of src.matchAll(/https:\/\/cdn\.entropywars\.net\/[^'"`\s)]+?\.(?:glb|gltf|fbx|obj|dae)\b/g)) literalRefs.push([f, m[0]]);
    // a base variable + a literal file (`_R2_MISC + 'Pyramid/Pyramid.glb'`)
    for (const m of src.matchAll(/(_R2_\w+|_BAT_BASE|_CAR_PACK_BASE|AS_BASE)\s*\+\s*'([^']+\.(?:glb|gltf|fbx|obj|dae))'/g)) {
        const base = (src.match(new RegExp('var ' + m[1] + "\\s*=\\s*'([^']+)'")) || [])[1];
        if (base) literalRefs.push([f, base + m[2]]);
    }
}
const known = new Set([...rows.values()].map(r => r.path.replace(/#.*$/, '')));
for (const [f, u] of literalRefs) {
    const p = bucketPath(u);
    if (known.has(p)) continue;
    known.add(p);
    add('literal', path.basename(p).replace(/\.(glb|gltf|fbx|obj|dae)$/i, ''), u, f);
}

// 6. the character creator (files on R2 named by the creator's own lists)
const CC = SP.BASE.replace(CDN, '');
const wearJson = JSON.parse(read('charactercreation/wear/wear.json'));
const wearPacks = {};
for (const w of wearJson) { const k = w.pack + '|' + w.license + '|' + w.cat; (wearPacks[k] = wearPacks[k] || []).push(w); }
const ewb = (SP.WEAR || []).filter(w => /^ew[bf]_/.test(w[0]));
const hairMh = JSON.parse(read('charactercreation/hair/mh/hair_styles.json'));
const mpfbFiles = fs.readdirSync(path.join(ROOT, 'charactercreation/mpfb')).filter(f => /\.glb$/.test(f));
const ccRoot = fs.readdirSync(path.join(ROOT, 'charactercreation')).filter(f => /\.glb$/.test(f));
const wearFiles = fs.readdirSync(path.join(ROOT, 'charactercreation/wear')).filter(f => /^ew[bf]_.*\.glb$/.test(f));
// the Meshy creator pieces (PR #829): EW_MH_WEAR rows `ewm_*`, one GLB on R2 (not in the repo)
for (const w of (SP.WEAR || []).filter(w => /^ewm_/.test(w[0]))) add('meshywear', w[0] + ' · ' + w[1] + ' (' + w[2] + ')', CDN + CC + '/wear/' + w[0] + '.glb');
for (const f of mpfbFiles) add('creator', f.replace(/\.glb$/, ''), CDN + CC + '/mpfb/' + f);
for (const f of ccRoot) add('creator', f.replace(/\.glb$/, ''), CDN + CC + '/' + f);
for (const h of SP.HAIR || []) if (/^hair\d/.test(h.id)) add('creator', h.id + ' · ' + h.label, CDN + CC + '/hair/' + h.id + '.glb');
for (const f of wearFiles) {
    const id = f.replace(/\.glb$/, '');
    const w = ewb.find(e => e[0] === id);
    add('blender', id + (w ? ' · ' + w[1] : (/_open$|_closed$/.test(id) ? ' · (front variant)' : '')), CDN + CC + '/wear/' + f);
}

/* ── write ── */
// a Meshy file that only draws when the car pack is off is not counted as in the game (it is listed under "fallback only")
const fallbackPaths = new Set(meshyFallback.map(f => bucketPath(f[1]).replace(/#.*$/, '')));
for (const [id, r] of [...rows]) if ((r.section === 'props' || r.section === 'misc') && fallbackPaths.has(r.path.replace(/#.*$/, ''))) {
    if (!meshyFallback.some(f => f[0] === r.key)) meshyFallback.push([r.key + ' (' + r.section + ' table)', CDN + r.path, 'the catalogue rows above (car pack)']);
    rows.delete(id);
}
const all = [...rows.values()];
const tally = {};
function count(how, n) { tally[how] = (tally[how] || 0) + n; }
const seenPath = new Set();
for (const r of all) { const p = r.path.replace(/#.*$/, '') + (/#/.test(r.path) ? '#' + r.path.split('#')[1] : ''); if (seenPath.has(p)) continue; seenPath.add(p); count(r.src ? r.src.how : 'UNSORTED', 1); }
count('MH', wearJson.length + hairMh.length);
count('CODE', procRows.filter(r => !r[3]).length);

function esc(s) { return String(s).replace(/\|/g, '\\|'); }
function table(list, keyHead) {
    const out = ['| ' + keyHead + ' | file (R2 bucket path) | made by | source |', '| --- | --- | --- | --- |'];
    for (const r of list) out.push('| ' + esc(r.key) + (r.note && r.section !== 'literal' ? ' — ' + esc(r.note) : '') + ' | `' + esc(r.path) + '` | ' +
        (r.src ? HOW[r.src.how].label : '**UNSORTED**') + ' | ' + (r.src ? esc(r.src.src) : 'add a SOURCES row in list-models.js') + ' |');
    return out.join('\n');
}
const sec = s => all.filter(r => r.section === s && r.src).sort((a, b) => a.key.localeCompare(b.key));
function byHow(list) {
    const groups = {};
    for (const r of list) { const g = r.src.src; (groups[g] = groups[g] || []).push(r); }
    return groups;
}

const L = [];
L.push('# MODEL LIST — every 3D model in Entropy Wars and how it was made');
L.push('');
L.push('GENERATED by `node list-models.js` from the game\'s own tables — do not hand-edit this file (the hand-kept parts are in');
L.push('`MODEL_LIST_EXTRA.md`, copied in below). Last written ' + new Date().toISOString().slice(0, 10) + '.');
L.push('');
L.push('**THE RULE (mondo, 2026-11-03):** every model added to the game — a character, a spell prop, a room prop, a pack, a');
L.push('creator piece — is documented here in the SAME PR that wires it: add a `SOURCES` row in list-models.js if it comes from');
L.push('a new folder / pack / maker, rerun `node list-models.js`, commit MODEL_LIST.md. Name the pack and its author when known.');
L.push('Goal: keep the look consistent and track how far the game is from **all human-made models** (see the tally).');
L.push('Where each model STANDS (which map, room, spell) is MODEL_INDEX.md; this file is WHAT exists and WHO / WHAT made it.');
L.push('');
L.push('> **THE PACK-FIRST RULE (mondo, 2026-11-04: "try to not use meshy models"):** before any Meshy prompt, concept or to-do');
L.push('> row, look for a human-made model first, in this order: §6 / §7 here (already in the game), §13 (on R2, not wired), and');
L.push('> project files `asset-packs/contents-lists/object_names_in_every_downloaded_pack.json` (every node of every downloaded pack).');
L.push('> A pack piece is cut out with `bake-pack-pieces.py` and worn by the proc (§6 "pack pieces the procs wear"). Only when');
L.push('> nothing fits does the row go to Meshy, and the to-do row says which packs were checked. See §12 for the 2026-11-04 audit.');
L.push('');
L.push('## 1. The tally');
L.push('');
L.push('| made by | human-made? | count |');
L.push('| --- | --- | --- |');
for (const k of Object.keys(HOW)) if (tally[k]) L.push('| ' + HOW[k].label + ' | ' + HOW[k].human + ' | ' + tally[k] + ' |');
if (tally.UNSORTED) L.push('| **UNSORTED** (no SOURCES row yet) | ? | ' + tally.UNSORTED + ' |');
L.push('');
L.push('Counts are distinct files (a pack kit cut into pieces counts each piece used; the MakeHuman count is the creator\'s');
L.push('picks, each a GLB per body; the code count is procedural catalogue rows).');
L.push('"Claude in code" = procedural stand-ins drawn from three.js primitives — the props still waiting for a real model (§8, ranked in §10).');
L.push('Not in the count: the horizon. **%%HZCODE%% of the %%HZTOTAL%% builders drawn past the board** (far rosters, near settings, rims, room weenies, board');
L.push('monuments) are three.js shapes with no model file — §8b lists them, §11 says which look bad and what could replace them.');
L.push('');
L.push('## 2. Units — the playable races (sprites.js RACE_MODELS_3D)');
L.push('');
L.push('Every race in the game. "creator look also baked" = a character-creator build of the race exists as a saved option');
L.push('(sprites.js RACE_CREATOR_LOOKS) — the step toward replacing the Meshy model with human-made MakeHuman parts.');
L.push('');
L.push(table(sec('units'), 'race'));
L.push('');
L.push('## 3. The story cast (sprites.js DOOR_CAST_MODELS)');
L.push('');
L.push(table(sec('cast'), 'cast id'));
L.push('');
L.push('## 4. Animation libraries (every rig is retargeted from these)');
L.push('');
L.push(table(sec('anim'), 'library'));
L.push('');
L.push('### 4b. Legacy per-character Meshy clip exports');
L.push('');
L.push('Meshy `..._Animation_<clip>_withSkin.glb` files exported FROM one character (Meshy AI). The game plays them only when the');
L.push('shared library fails, except where a rig keeps its own clip on purpose. Folder = the race\'s R2 folder.');
L.push('');
L.push('| race | clips | folder |');
L.push('| --- | --- | --- |');
for (const r of clipRows) L.push('| ' + r[0] + ' | ' + r[1].join(', ') + ' | `' + r[2] + '` |');
L.push('');
L.push('## 5. The character creator');
L.push('');
L.push('### 5a. Bodies and classic hair');
L.push('');
L.push(table(sec('creator'), 'piece'));
L.push('');
L.push('### 5b. MakeHuman pack clothes (' + wearJson.length + ' picks, one GLB per body in `' + CC + '/wear/mhw_*`)');
L.push('');
L.push('Human-made, from the MakeHuman community asset packs. Every piece\'s author, licence and page is in');
L.push('`charactercreation/wear/wear.json`; CC-BY authors are credited on the CREDITS page (mpfb/CREDITS.json).');
L.push('');
L.push('| pack | licence | category | picks |');
L.push('| --- | --- | --- | --- |');
for (const k of Object.keys(wearPacks).sort()) { const [p, lic, cat] = k.split('|'); L.push('| ' + p + ' | ' + lic + ' | ' + cat + ' | ' + wearPacks[k].map(w => w.label).join(', ') + ' |'); }
L.push('');
L.push('### 5c. MakeHuman hair (' + hairMh.length + ' styles, `' + CC + '/hair/mh/`)');
L.push('');
const hairBy = {};
for (const h of hairMh) { const k = h.pack + ' · ' + h.author + ' · ' + h.license; (hairBy[k] = hairBy[k] || []).push(h.label); }
for (const k of Object.keys(hairBy).sort()) L.push('- **' + k + '**: ' + hairBy[k].join(', '));
L.push('');
L.push('### 5d. Made by Claude in Blender (' + all.filter(r => r.section === 'blender').length + ' files, `' + CC + '/wear/ewb_*`)');
L.push('');
L.push('Garments modelled in cloud Blender (bake-clothes.py), except the rows marked otherwise (mondo\'s cowboy hat, the joined');
L.push('MakeHuman beards). `_open` / `_closed` files are the same garment with the front the other way.');
L.push('');
L.push(table(sec('blender'), 'piece'));
L.push('');
L.push('### 5e. Meshy pieces in the creator (' + sec('meshywear').length + ' files, `' + CC + '/wear/ewm_*`, PR #829)');
L.push('');
L.push('Made 2026-11-03 on Meshy through the API (concept image -> mondo\'s OK -> model) and fitted on the MPFB bodies in Blender');
L.push('(bake-meshy.py): hats, creature heads, armour, equipment, tails. Column = the creator\'s own id · label (tab).');
L.push('The pendants (OUTFIT > Neck > Pendants: cross, talisman, hagstone) each wear a CORD round the neck that is made in code');
L.push('(three-renderer.js THE PENDANT CORDS, 2026-11-05): a tube built at run time on the body it is worn on; no model file.');
L.push('');
L.push(table(sec('meshywear'), 'piece'));
L.push('');
L.push('## 6. Props — every room / editor prop (data.js DOOR_HQ.catalogue)');
L.push('');
const props = sec('props');
const pg = byHow(props);
for (const g of Object.keys(pg).sort((a, b) => pg[b].length - pg[a].length)) {
    L.push('### ' + g + ' — ' + HOW[pg[g][0].src.how].label + ' (' + pg[g].length + ')');
    L.push('');
    L.push(table(pg[g], 'catalogue key'));
    L.push('');
}
L.push('### The Meshy decor (three-renderer.js _HQ_DECOR_GLB) — worn by the procs in §8 (' + sec('decor').length + ')');
L.push('');
L.push('Made 2026-11-03 for the code-drawn stand-ins of §10A (D-IDs in project files meshy/decor/decor_prompts.json). A proc builder');
L.push('calls `_hqDecorWear(name, U, g)`: its own pieces hide (they keep the collision) and the model is fitted into their box.');
L.push('');
L.push(table(sec('decor'), 'decor key'));
L.push('');
L.push('### Pack pieces the procs wear (three-renderer.js _HQ_PACK_WEAR, Assets/misc/) — human-made, preferred over Meshy (' + sec('packwear').length + ')');
L.push('');
L.push('THE MESHY AUDIT (2026-11-04): §10A rows a downloaded pack already had a piece for. `bake-pack-pieces.py` (its AUDIT jobs) cut the');
L.push('node out of the pack scene; `_hqDecorWear(name, U, g)` wears it exactly like a Meshy decor model (a name in _HQ_DECOR_GLB wins).');
L.push('');
L.push(table(sec('packwear'), 'proc wear name'));
L.push('');
L.push('### Meshy files kept only as a FALLBACK — not drawn in the game (' + meshyFallback.length + ')');
L.push('');
L.push('These rows draw mondo\'s car pack (GGBot low-poly cars, Assets/vehicles/, `_CAR_PACK_POOLS`); the Meshy car only draws with');
L.push('`window.EW_NO_CAR_PACK = true` or if the pack fails. Not counted in the tally.');
L.push('');
L.push('| row | Meshy file (R2 bucket path) | what draws instead |');
L.push('| --- | --- | --- |');
for (const f of meshyFallback.sort((a, b) => a[0].localeCompare(b[0]))) L.push('| ' + esc(f[0]) + ' | `' + esc(bucketPath(f[1])) + '` | ' + f[2] + ' |');
L.push('');
L.push('### Stairs pack (data.js HQ_STAIR_PACK — every stair flight, railing and escalator in the rooms)');
L.push('');
L.push(table(sec('stairs'), 'pack file'));
L.push('');
L.push('## 7. Spell props, sky / horizon models, animals, foliage');
L.push('');
L.push('### 7a. Spell props (three-vfx-effects.js _WPN_MODELS)');
L.push('');
L.push(table(sec('spell'), 'key'));
L.push('');
L.push('### 7a-2. Gear worn on the body (three-renderer.js UNIT_GEAR_WEAR, PR #827) — the equipment a unit carries, on its bones');
L.push('');
L.push(table(sec('gear'), 'equipment key'));
L.push('');
L.push('### 7b. Settings, horizons, monuments (three-renderer.js _MISC_GLB)');
L.push('');
L.push(table(sec('misc'), 'key'));
L.push('');
L.push('### 7c. Animals (three-renderer.js _ANIMALS)');
L.push('');
L.push(table(sec('animal'), 'key'));
L.push('');
L.push('### 7d. Foliage (data.js HQ_TREE_KINDS + the renderer\'s tree keys)');
L.push('');
L.push(table(sec('foliage'), 'tree key'));
L.push('');
L.push('### 7e. Halloween pack pieces cut out by the spells (Assets/halloween/models/halloween.fbx · Elbolilloduro · CC0)');
L.push('');
L.push([...hwNodes].sort().join(', '));
L.push('');
L.push('### 7f. Every other model file the game scripts name');
L.push('');
L.push('Found by scanning the scripts for literal model URLs that no table above lists (the "note" is the script).');
L.push('');
const lit = all.filter(r => r.section === 'literal' && r.src);
L.push('| name | file (R2 bucket path) | made by | source | script |');
L.push('| --- | --- | --- | --- | --- |');
for (const r of lit.sort((a, b) => a.path.localeCompare(b.path))) L.push('| ' + esc(r.key) + ' | `' + esc(r.path) + '` | ' + HOW[r.src.how].label + ' | ' + esc(r.src.src) + ' | ' + r.note + ' |');
L.push('');
const standIns = procRows.filter(r => !r[3]), wearing = procRows.filter(r => r[3]);
L.push('## 8. Made in code — procedural stand-ins still in the catalogue (' + standIns.length + ')');
L.push('');
L.push('Catalogue rows with a `proc` and no file: Claude drew them from three.js primitives. These are the props that still');
L.push('want a real model; §10 ranks which ones are worth one. (Pack-backed procs — bats, traps — and the car pack are not here.)');
L.push('');
L.push(standIns.sort((a, b) => a[0].localeCompare(b[0])).map(r => '`' + r[0] + '`').join(', '));
L.push('');
L.push('**Procs that already wear a real model** (' + wearing.length + ': the builder hangs a model file over its own pieces, which only');
L.push('show if the file fails) — counted under that model\'s maker, not as code:');
L.push('');
L.push(wearing.sort((a, b) => a[0].localeCompare(b[0])).map(r => '`' + r[0] + '` (' + r[3] + ')').join(', '));
L.push('');
// ── 8b. THE HORIZON AND THE SKY (2026-11-03, mondo: "why didnt model list catalogue them? ... what about everything else
// that is in the horizon? you need to catalogue those too"). The cone mountains were missed because this list only read MODEL
// FILES; a thing the renderer builds from three.js shapes had no row. This section reads the renderer's horizon tables by text
// (the far rosters, the near settings, THE WORLD's rim, the room weenies, the board monuments), follows each builder into the
// _hz / _nr / _wd helpers it calls (3 deep) and says what it is made of: which model files it loads (with their maker, from the
// tables above) and which three.js shapes it builds. A builder that loads a model AND builds shapes usually keeps the shapes as
// its stand-in when the file fails, or adds small code parts (a glow, a base) — the row says both, never guesses which.
const HZ = (function () {
    const src = R3;
    function body(at) {   // the {...} after index `at` (brace-matched; the renderer's builders hold no stray braces in strings)
        let j = src.indexOf('{', at); if (j < 0) return '';
        for (let k = j, d = 0; k < src.length; k++) { const c = src[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return src.slice(j, k + 1); } }
        return '';
    }
    const FN = {};
    for (const m of src.matchAll(/^\s*function (_\w+)\s*\(/gm)) if (!FN[m[1]]) FN[m[1]] = body(m.index + m[0].length);
    // the object tables' own entries (`kind: function`), in the literal and in every later Object.assign(table, {...}) / table.kind = function
    function tableFns(name) {
        const out = {}, starts = [];
        for (const m of src.matchAll(new RegExp('var ' + name + ' = \\{|Object\\.assign\\(' + name + ', \\{', 'g'))) starts.push(m.index + m[0].length - 1);
        for (const st of starts) { const b = body(st), off = src.indexOf(b, st); for (const m of b.matchAll(/^ {8}(\w+): function[^{]*/gm)) out[m[1]] = body(off + m.index + m[0].length - 1); }
        for (const m of src.matchAll(new RegExp(name.replace(/\$/g, '\\$') + '\\.(\\w+) = function[^{]*', 'g'))) out[m[1]] = body(m.index + m[0].length - 1);
        for (const k of Object.keys(out)) FN[name + '.' + k] = out[k];
        return out;
    }
    const LM = tableFns('_hqLandmarkBuilders'), NRB = tableFns('_NR_BUILDERS');
    const miscKeys = new Map(all.filter(r => r.section === 'misc').map(r => [r.key, r]));
    const doorKeys = new Map(all.filter(r => r.section === 'props').map(r => [r.key, r]));
    const animalKeys = new Map(all.filter(r => r.section === 'animal').map(r => [r.key, r]));
    const decorKeys = new Map(all.filter(r => r.section === 'decor').map(r => [r.key, r]));
    // helpers that only make materials / textures / placements / loaders: never followed (the loaders are read from their call)
    const STOP = /^(_miscModelInstance|_loadMiscModel|_animalBuild|_hqModelUrl|_hqTex|_hqMat|_mulberry32|_disposeR|_hzLit|_hzAt|_hzTex|_hzGeoMat|_hzGlowMat|_hzGlowSprite|_hzPulse|_hzKitTile|_hzRockPick|_hzPropLitPick|_hzPropLitLiftPick|_hzMiscUnlitPick|_hzMiscKit|_hzMiscGLB|_hzPropGLB|_hzDoorKitGLB|_hzVehicle|_hzRock|_hzRockProc|_nrRectRing|_wdRing|_nrUV|_nrSquashUV|_nrInjectWorld|_hzTextTex|_hzStripeTex|_hzScorchTex|_nrPicketTex|_hzFacTex\w*)$|Tex$|Mat$|Pick$|Haze|Fog/;
    const SHAPE = /new THREE\.(\w+?)(?:Buffer)?Geometry\b/g;
    function scan(code, depth, seen, out) {
        for (const m of code.matchAll(/_hz(?:MiscKit|MiscGLB|PropGLB)\(\s*'(\w+)'/g)) if (miscKeys.has(m[1]) || !/url:/.test(code)) out.models.add('misc:' + m[1]);
        for (const m of code.matchAll(/_HQ_DECOR_GLB\.(\w+)/g)) out.models.add('decor:' + m[1]);   // THE CODED SHAPES OUT (2026-11-03): a builder placing a Meshy decor model
        for (const m of code.matchAll(/_oceanUrl\(\s*'(\w+)'/g)) out.models.add('ocean:' + m[1]);
        if (/_oceanUrl\(\s*ROCKS/.test(code)) for (const m of code.matchAll(/'(Rock\d*)'/g)) out.models.add('ocean:' + m[1]);
        for (const m of code.matchAll(/_MISC_GLB(?:\.(\w+)|\[\s*'(\w+)'\s*\])/g)) out.models.add('misc:' + (m[1] || m[2]));
        for (const m of code.matchAll(/_hzDoorKitGLB\(\s*'(\w+)'/g)) out.models.add('door:' + m[1]);
        for (const m of code.matchAll(/_hzVehicle\(\s*'(\w+)'/g)) out.models.add('vehicle:' + m[1]);
        for (const m of code.matchAll(/_hqDecorWear\(\s*'(\w+)'/g)) out.models.add('decor:' + m[1]);   // THE MESHY DECOR: the builder wears a model (its shapes only show when the file fails)
        if (/Castles_and_Forts\.glb#/.test(code)) out.models.add('file:Assets/misc/Castles_and_Forts.glb');   // THE CODED SHAPES OUT round 2: castle pack pieces by node (the castle, the ruins rim)
        if (/_hwUrl\(/.test(code)) out.models.add('file:Assets/halloween/models/halloween.fbx');   // the Halloween pack body parts (the flesh mound)
        if (/_chessFill\(/.test(code)) out.models.add('chess:Low Poly Chess Set');   // THE CHESS SET: mondo's piece (the lathe only when the set fails)
        if (/_hzRock\(/.test(code)) { out.models.add('door:asteroid_a'); out.models.add('door:asteroid_b'); out.models.add('misc:standingstone'); }
        if (/_nrTree\(|_hzTreeModel\(|_FOLIAGE_MODEL_FOR_KEY/.test(code)) out.models.add('trees (foliage models, §7d)');
        if (/_CRYSTAL_MODEL_URLS/.test(code)) out.models.add('crystals (_CRYSTAL_MODEL_URLS)');
        for (const m of code.matchAll(/'([^'\s]+\.(?:glb|fbx|obj))'/g)) out.models.add('file:' + m[1].replace(/^https:\/\/cdn\.entropywars\.net\//, ''));
        for (const m of code.matchAll(/'(\w+)'/g)) { if (miscKeys.has(m[1]) && /MiscKit|MiscGLB|PropGLB|_MISC_GLB|PLANETS/.test(code)) out.models.add('misc:' + m[1]); if (doorKeys.has(m[1]) && /DoorKitGLB/.test(code)) out.models.add('door:' + m[1]); if (animalKeys.has(m[1]) && /_animal|_ANIMALS|Animal/.test(code)) out.models.add('animal:' + m[1]); }
        for (const m of code.matchAll(SHAPE)) out.shapes.add(m[1]);
        if (/_hqBox\(|K\.box\(|_hzBox\(/.test(code)) out.shapes.add('Box');
        if (/_hzGlowSprite\(|new THREE\.Sprite\(/.test(code)) out.glow = true;
        if (depth >= 3) return;
        for (const m of code.matchAll(/\b(_\w+(?:\.\w+)?)\s*\(/g)) {
            const f = m[1]; if (seen.has(f) || STOP.test(f.split('.')[0]) || !FN[f]) continue;
            seen.add(f); scan(FN[f], depth + 1, seen, out);
        }
    }
    function describe(code) {
        const out = { models: new Set(), shapes: new Set(), glow: false };
        scan(code, 0, new Set(), out);
        const seenKey = new Map();
        for (const k of [...out.models].sort()) {
            const [kind, key] = k.indexOf(':') > 0 ? [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)] : ['', k];
            const r = (kind === 'misc' || kind === 'vehicle') ? miscKeys.get(key) : kind === 'door' ? doorKeys.get(key) : kind === 'animal' ? animalKeys.get(key) : kind === 'decor' ? decorKeys.get(key) : null;
            const label = '`' + key + '`' + (r && r.src ? ' (' + HOW[r.src.how].label + ')' : kind === 'vehicle' ? ' (the car pack, _CAR_PACK)' : kind === 'chess' ? " (mondo's upload, Assets/chess/)" : kind === 'ocean' ? " (the ocean pack, mondo's upload, Assets/oceanic/)" : /^Assets\/props\//.test(key) ? ' (Meshy AI)' : '');
            if (!seenKey.has(key) || (r && r.src)) seenKey.set(key, label);
        }
        const models = [...seenKey.values()];
        const shapes = [...out.shapes].map(x => x === 'Buffer' ? 'custom mesh' : x).sort();
        const made = models.length && shapes.length ? 'model files + three.js shapes' : models.length ? 'model files' : shapes.length ? 'three.js shapes (code)' : out.glow ? 'glow sprites (code)' : 'draws nothing (an empty group)';
        return { made, models: models.join(', ') || '—', shapes: shapes.join(', ') + (out.glow ? (shapes.length ? ', ' : '') + 'glow sprites' : '') || '—', code: !models.length && (shapes.length > 0 || out.glow) };
    }
    const fams = [];
    // A. the far rosters (the battle's void + the open rooms' skies): theme -> builders
    const ros = (function () { const i = src.indexOf('if (!_HZ_THEME_ROSTERS) _HZ_THEME_ROSTERS = {'); return i < 0 ? '' : body(i + 40); })();
    const byFn = new Map();
    for (const t of ros.matchAll(/^\s{12}(\w+): \[([\s\S]*?)\]\],?\s*(?:\/\/[^\n]*)?$/gm)) for (const f of t[2].matchAll(/\[[\d.]+,\s*(_hz\w+)/g)) { if (!byFn.has(f[1])) byFn.set(f[1], new Set()); byFn.get(f[1]).add(t[1]); }
    fams.push({ id: 'A', title: 'The far rosters — what floats / stands in the void round a battle board and in an open room\'s sky (`_hzThemeRoster`; column = the themes that use it)',
        rows: [...byFn.keys()].sort().map(f => Object.assign({ key: f, extra: [...byFn.get(f)].sort().join(', ') }, describe(FN[f] || ''))) });
    // B. the near settings (_NR_BUILDERS.<map>)
    const nr = Object.keys(NRB).map(k => Object.assign({ key: k, extra: '' }, describe(NRB[k])));
    fams.push({ id: 'B', title: 'The near settings — the landscape right round a battle board, per map (`_NR_BUILDERS`)', rows: nr.sort((a, b) => a.key.localeCompare(b.key)) });
    // C. THE WORLD's rim (_WD_RIM.<kind>) and D. the room weenies (_hqLandmarkBuilders.<kind>)
    const objRows = T => Object.keys(T).sort().map(k => Object.assign({ key: k, extra: '' }, describe(T[k])));
    // C. THE WORLD's rim (_WD_RIM) was DELETED 2026-11-05 (mondo: "delete the rims")
    fams.push({ id: 'D', title: 'The room weenies — the fixed landmarks on an open room\'s horizon (`_hqLandmarkBuilders`, data.js `shell.sky.landmarks`)', rows: objRows(LM) });
    // E. the board monuments (_monBuilders: on-board cover a map names, the same _hz builders)
    const mon = (function () { const i = src.indexOf('if (!_MON_BUILDERS) _MON_BUILDERS = {'); return i < 0 ? '' : body(i + 30); })(), mrows = [];
    for (const m of mon.matchAll(/(\w+):\s*(_hz\w+)/g)) mrows.push(Object.assign({ key: m[1], extra: m[2] }, describe(FN[m[2]] || '')));
    fams.push({ id: 'E', title: 'The board monuments — landmarks a map stands ON or beside its board (`_monBuilders`; column = the builder)', rows: mrows.sort((a, b) => a.key.localeCompare(b.key)) });
    return fams;
})();
L.push('## 8b. The horizon and the sky — everything drawn past the board, and what it is made of');
L.push('');
L.push('Written by list-models.js from three-renderer.js\'s own tables (2026-11-03: the cone mountains had no row because this list');
L.push('only read model files). **made with** = what the scan found in the builder and the helpers it calls: model files (their');
L.push('maker in brackets, from the tables above) and/or three.js shapes. "three.js shapes (code)" = drawn by Claude in code, no');
L.push('model: those are the candidates for a real model. Also painted, not modelled: the battle\'s ring-wall skyline (distant');
L.push('snow mountains drawn in its shader), the sky dome, stars, clouds and the lenticular (`_hzLenticular`, a cloud sprite stack).');
L.push('');
const hzCounts = { total: 0, code: 0 };
for (const F of HZ) {
    L.push('### 8b-' + F.id + '. ' + F.title + ' (' + F.rows.length + ')');
    L.push('');
    const extraHead = F.id === 'A' ? ' themes |' : F.id === 'E' ? ' builder |' : '';
    L.push('| key | made with | model files | three.js shapes |' + extraHead);
    L.push('| --- | --- | --- | --- |' + (extraHead ? ' --- |' : ''));
    for (const r of F.rows) { hzCounts.total++; if (r.code) hzCounts.code++; L.push('| `' + esc(r.key) + '` | ' + r.made + ' | ' + esc(r.models) + ' | ' + esc(r.shapes) + ' |' + (extraHead ? ' ' + esc(r.extra) + ' |' : '')); }
    L.push('');
}
for (let i = 0; i < L.length; i++) if (typeof L[i] === 'string' && L[i].indexOf('%%HZCODE%%') >= 0) L[i] = L[i].replace('%%HZCODE%%', hzCounts.code).replace('%%HZTOTAL%%', hzCounts.total);
L.push('**' + hzCounts.code + ' of these ' + hzCounts.total + ' rows are code only (three.js shapes / glow sprites, no model file); the monuments reuse many roster builders, so a builder can count twice.**');
L.push('');
L.push('**The cone mountains are gone** (2026-11-03, mondo: "they look terrible"): the rooms\' far weenies `peak` / `mountain`');
L.push('(Mount Shasta over the woods and the ranch, the Range over Area 51, the Transantarctics, Olympus Mons, the Clash temple\'s');
L.push('three) were stacked three.js cones with a white cone for snow. Builders and rows removed, nothing replaces them: no downloaded');
L.push('pack has a mountain, and the D.O.O.R. kit asteroid rocks stretched into a massif read as giant blobs.');
L.push('**Wanted:** a real far mountain range model (one file, low poly) if mondo wants the weenies back.');
L.push('');
/* THE MESHY AUDIT (2026-11-04): §10A's to-do rows go stale the moment a thread wires one, so each row gets an AUTO column
   read off the game tables: what that catalogue key draws today (a model file and its maker / the models its proc wears /
   still code). A row that says "code" is the only kind still waiting on a model. */
const procBy = new Map(procRows.map(r => [r[0], r]));
const propBy = new Map();
for (const r of all) if (r.section === 'props') propBy.set(r.key.replace(/ \(\d+ of \d+\)$/, ''), r);
const wearMaker = new Map();
for (const r of all) if (r.section === 'decor') wearMaker.set(r.key, 'Meshy decor');
for (const r of all) if (r.section === 'packwear') wearMaker.set(r.key, 'pack piece');
function liveStatus(key) {
    const pr = propBy.get(key);
    if (pr) return 'model file (' + (pr.src ? HOW[pr.src.how].label : '?') + ')';
    const r = procBy.get(key);
    if (!r) return H.catalogue[key] ? 'pack-backed proc' : 'not a catalogue key';
    if (!r[3]) return '**code — still needs a model**';
    return 'wears ' + r[3].split(', ').map(w => w + (wearMaker.has(w) ? ' (' + wearMaker.get(w) + ')' : '')).join(', ');
}
if (fs.existsSync(EXTRA)) {
    let inA = false;
    const ex = fs.readFileSync(EXTRA, 'utf8').trim().split('\n').map(line => {
        if (/^### /.test(line)) inA = /^### 10A\./.test(line);
        if (!inA || !/^\|/.test(line)) return line;
        if (/^\| # \|/.test(line)) return line + ' in the game now (AUTO, list-models.js) |';
        if (/^\| --- /.test(line)) return line + ' --- |';
        const m = /^\| D\d+\w? \| `(\w+)`/.exec(line);
        return m ? line + ' ' + liveStatus(m[1]) + ' |' : line;
    });
    L.push(ex.join('\n')); L.push('');
}
// ── 13. EVERY MODEL FILE ON R2 (the bucket snapshot R2_MODEL_FILES.json; `node list-models.js --r2` refreshes it)
if (fs.existsSync(R2_SNAP)) {
    const snap = JSON.parse(fs.readFileSync(R2_SNAP, 'utf8'));
    const listed = new Set(all.map(r => r.path.replace(/#.*$/, '')));
    for (const f of meshyFallback) listed.add(bucketPath(f[1]).replace(/#.*$/, ''));
    ['Assets/halloween/models/halloween.fbx', 'Assets/misc/Castles_and_Forts.glb'].forEach(p => listed.add(moved(p)));   // cut up by node (§7e, §8b)
    const stem = p => p.replace(/\.[^./]+$/, '').toLowerCase();
    const listedStems = new Set([...listed].map(stem));
    const listedBase = new Set([...listed].map(p => p.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase()));
    const groups = new Map();
    let unlisted = 0;
    for (const [key, size] of snap.files) {
        if (listed.has(key) || isOldKey(key)) continue;
        unlisted++;
        let status, made;
        const src = sourceOf(key), base = key.split('/').pop();
        if (/^Assets\/opt\//.test(key)) {
            const orig = base.replace(/^[0-9a-f]{8}_/, '').replace(/\.(opt|lod\d)\.glb$/, '').toLowerCase();
            status = /\.lod\d\.glb$/.test(base) ? 'far-off LOD copy (optimize-assets.js --lod)' : 'optimised copy the game loads in place of the original (optimize-assets.js)';
            if (!listedBase.has(orig)) status += ' — its original is not in the tables above';
            made = /meshy_ai/i.test(base) ? 'Meshy AI' : 'same maker as its original';
        } else if (/_withSkin\.glb$|Meshy_AI_sniper_|_Animation_|\/MAL\d_|_Running\.glb$/.test(key)) {
            status = 'animation clip file (the shared library replaced per-character clips; kept for the fallback / a re-consolidate)';
            made = src ? HOW[src.how].label : 'Meshy AI';
        } else if (/charactercreation\//.test(key)) {
            status = 'creator file not named by a table above (a per-body copy, a base mesh, or a retired pick)';
            made = src ? HOW[src.how].label : /meshy_ai/i.test(base) ? 'Meshy AI' : 'see §5';
        } else if (listedStems.has(stem(key))) {
            status = 'another format of a model listed above (source file, the game loads the listed one)';
            made = src ? HOW[src.how].label : 'same as the listed one';
        } else {
            status = 'on R2, the game does not load it';
            made = src ? HOW[src.how].label : /meshy_ai/i.test(base) ? 'Meshy AI' : '**UNSORTED**';
        }
        const folder = key.indexOf('/') < 0 ? '(bucket root)' : key.replace(/\/[^/]*$/, '');
        const gk = folder + '|' + status + '|' + made;
        if (!groups.has(gk)) groups.set(gk, { folder, status, made, src: src ? src.src : '', files: [], bytes: 0 });
        const g = groups.get(gk); g.files.push(base.replace(/^[0-9a-f]{8}_/, '')); g.bytes += size;
    }
    L.push('## 13. EVERY MODEL FILE ON R2 — the ones not named in the tables above (' + unlisted + ' of ' + snap.files.length + ', bucket `' + snap.bucket + '`, listed ' + snap.listed + ')');
    L.push('');
    L.push('THE R2 AUDIT (2026-11-04, mondo: "You are supposed to document every single model"). Every model file in the bucket that the');
    L.push('game tables above do not name, grouped by folder and why it is there. `node list-models.js --r2` re-lists the bucket into');
    L.push('R2_MODEL_FILES.json; rerun it after uploading models. A folder with "the game does not load it" is a model we HAVE: check it');
    L.push('before asking for a new one (THE PACK-FIRST RULE).');
    L.push('');
    L.push('| folder | why it is on R2 | made by | files | MB |');
    L.push('| --- | --- | --- | --- | --- |');
    for (const g of [...groups.values()].sort((a, b) => a.folder.localeCompare(b.folder) || a.status.localeCompare(b.status)))
        L.push('| `' + esc(g.folder) + '` | ' + esc(g.status) + ' | ' + g.made + (g.src && g.made !== 'see §5' ? ' · ' + esc(g.src) : '') + ' | ' + g.files.length + ': ' + esc(g.files.sort().join(', ')) + ' | ' + (g.bytes / 1048576).toFixed(1) + ' |');
    L.push('');
}
const uns = all.filter(r => !r.src);
if (uns.length) {
    L.push('## UNSORTED — found in the game, no SOURCES row yet');
    L.push('');
    L.push(table(uns.sort((a, b) => a.path.localeCompare(b.path)), 'name'));
    L.push('');
}
const text = L.join('\n') + '\n';
console.log('rows', all.length, 'tally', JSON.stringify(tally), 'unsorted', uns.length, 'bytes', text.length);
if (uns.length) console.log('UNSORTED:\n' + uns.map(r => '  ' + r.section + ' ' + r.key + ' ' + r.path).join('\n'));
if (!DRY) fs.writeFileSync(OUT, text);
