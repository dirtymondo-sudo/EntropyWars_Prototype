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
const CDN = 'https://cdn.entropywars.net/';

/* ── HOW EACH MODEL WAS MADE. `how` is one of the HOW keys; first matching row wins (tested on the bucket path). ── */
const HOW = {
    PACK:      { label: 'Asset pack', human: 'yes' },
    PACK_ANON: { label: 'Asset pack (author not recorded yet)', human: 'yes' },
    MH:        { label: 'MakeHuman community asset', human: 'yes' },
    MH_BLEND:  { label: 'MakeHuman parts, baked by Claude in Blender', human: 'yes (parts)' },
    MONDO:     { label: "mondo's own model", human: 'yes' },
    MESHY:     { label: 'Meshy AI', human: 'no' },
    MESHY_C:   { label: 'Meshy AI, reworked by Claude', human: 'no' },
    BLENDER:   { label: 'Claude in Blender', human: 'no' },
    CODE:      { label: 'Claude in code (three.js, no file)', human: 'no' },
};
const SOURCES = [
    // the shared animation libraries
    { re: /Assets\/Models\/UAL\d/, how: 'PACK', src: 'Universal Animation Library · Quaternius · CC0' },
    { re: /Assets\/Models\/MAL\d/, how: 'MESHY_C', src: "Meshy's 20 animations exported from the male sniper, consolidated by Claude (build_mal2.js)" },
    // character creator
    { re: /charactercreation\/wear\/ewb_beard_/, how: 'MH_BLEND', src: 'MakeHuman pack beard + moustache joined in Blender (bake-beards.py)' },
    { re: /charactercreation\/wear\/ewb_cowboyhat/, how: 'MONDO', src: "mondo's cowboy hat, fitted to the bodies in Blender (bake-clothes.py SOLIDS)" },
    { re: /charactercreation\/wear\/ewb_/, how: 'BLENDER', src: 'bake-clothes.py / bake-garment.py (cloud Blender)' },
    { re: /charactercreation\/wear\/mhw_/, how: 'MH', src: 'MakeHuman asset packs (author + licence per piece in charactercreation/wear/wear.json)' },
    { re: /charactercreation\/hair\/mh\//, how: 'MH', src: 'MakeHuman hair (author + licence per style in charactercreation/hair/mh/hair_styles.json)' },
    { re: /charactercreation\/hair\/hair\d/, how: 'PACK_ANON', src: "Hair pack part 1 (HairPackPT1.glb, mondo's 2026-09-11 upload), split by character-rig.js" },
    { re: /charactercreation\/mpfb\/looks\/eyes/, how: 'MH_BLEND', src: "MakeHuman high-poly eye mesh (bake-eyes.py) + mondo's eye textures" },
    { re: /charactercreation\/mpfb\//, how: 'MH_BLEND', src: 'MakeHuman / MPFB2 base body (CC0), built + rigged by Claude in Blender (bake-mpfb.py / bake-mpfb-classic.py)' },
    { re: /charactercreation\/Meshy_AI_/, how: 'MESHY_C', src: 'Meshy base body, rigged by Claude (character-rig.js bodies)' },
    // packs with a known author (the same rows as data.js EW_CREDITS)
    { re: /Assets\/foilage\/OBJ\//, how: 'PACK', src: 'LowPoly nature · Quaternius · CC0' },
    { re: /Assets\/foilage\/retrotreepack\//, how: 'PACK', src: 'Retro Tree Pack · Pizza Doggy · Pizza Doggy licence, NOT CC0 (no AI use of the assets, no redistributing them as standalone files)' },
    { re: /Assets\/Metro_PSX\//, how: 'PACK', src: 'Metro PSX · Elbolilloduro · CC0' },
    { re: /Assets\/halloween\//, how: 'PACK', src: 'Halloween pack · Elbolilloduro · CC0' },
    { re: /Assets\/christmas\//, how: 'PACK', src: 'Christmas pack · Elbolilloduro' },
    // THE MESHY SWAP (2026-11-03): one piece cut out of an Elbolilloduro pack scene by Claude in Blender (bake-pack-pieces.py), Assets/misc/ebd_<pack>_<item>.glb
    { re: /Assets\/misc\/ebd_pizzeria_/, how: 'PACK', src: 'Pizzeria PSX · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_diner_/, how: 'PACK', src: 'DINER · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_trailerpark_/, how: 'PACK', src: 'Trailer Park · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_6twelve_/, how: 'PACK', src: '6TWELVE · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_psx3_/, how: 'PACK', src: 'Paquete de modelos psx 3 · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_laundry_/, how: 'PACK', src: 'Laundry · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_house_/, how: 'PACK', src: 'House · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_vhsshop_/, how: 'PACK', src: 'VHS Shop · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_busstop_/, how: 'PACK', src: 'Bus stop · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_survival_/, how: 'PACK', src: 'Survival PSX · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_vegetation_/, how: 'PACK', src: 'Vegetation · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_housesonwater_/, how: 'PACK', src: 'Houses on the water · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_mine_/, how: 'PACK', src: 'Mine · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/misc\/ebd_burgerpiz_/, how: 'PACK', src: 'BurgerPiz · Elbolilloduro · CC0 (piece cut out in Blender)' },
    { re: /Assets\/vehicles\//, how: 'PACK', src: 'Low-poly cars · GGBot' },
    { re: /Assets\/stairs\/stairs_railings/, how: 'PACK', src: 'Stairs & Railings · ATD-London · CC-BY 4.0 (credit required)' },
    { re: /Assets\/stairs\/stairs\.glb/, how: 'PACK', src: 'Stairs · Ansh_Singla · CC-BY 4.0 (credit required)' },
    { re: /Assets\/misc\/Castles_and_Forts\.glb/, how: 'PACK', src: 'Castle and Fort Builder Pack · McSteeg (itch.io) · free for games, credit given' },
    { re: /UFO_Low_Poly\.fbx/, how: 'PACK', src: '3D Game Ready UFO Spaceship · FlexUnit · CC0' },
    { re: /_sway\.glb$/, how: 'MESHY_C', src: 'Meshy rig + spring-bone cape chain baked by Claude (bake-sway.py)' },
    { re: /Assets\/decor\//, how: 'MESHY', src: 'Meshy AI, made by Claude through the Meshy API (concepts approved by mondo, 2026-11-03)' },
    // Meshy exports (mondo's, made on meshy.ai) — before the folder rows so a Meshy file in a pack folder still reads Meshy
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
    { re: /Assets\/animals\//, how: 'PACK_ANON', src: "Farm / zoo animals (mondo's upload)" },
    { re: /Assets\/instruments\//, how: 'PACK_ANON', src: "Instruments + orchestral (mondo's upload)" },
    { re: /Assets\/traps\//, how: 'PACK_ANON', src: "Traps pack (mondo's upload)" },
    { re: /Assets\/chess\//, how: 'PACK_ANON', src: "Low Poly Chess Set (mondo's upload, FBX)" },
    { re: /Assets\/weapons\/spear\//, how: 'PACK_ANON', src: "Spear (mondo's upload, FBX)" },
    { re: /Assets\/misc\/(eyeball|streetlamp|Pyramid)\//, how: 'PACK_ANON', src: "Authored OBJ / GLB (mondo's upload, author not recorded)" },
    { re: /_cc0_clip_ready/, how: 'PACK_ANON', src: "CC0 'clip ready' prop (mondo's upload, author not recorded)" },
    { re: /Assets\/door\/models\/(computer_chair|asteroid_)/, how: 'PACK_ANON', src: "D.O.O.R. kit upload (mondo, author not recorded)" },
    { re: /Assets\/door\/models\/[^/]*\bdoor\b[^/]*\.glb$/i, how: 'PACK_ANON', src: "Door leaves (mondo's upload, author not recorded)" },
];
function sourceOf(p) {
    for (const s of SOURCES) if (s.re.test(p)) return s;
    return null;
}

/* ── collect ── */
const rows = new Map();            // bucket path → row
function bucketPath(u) {
    let p = String(u || '');
    if (p.startsWith(CDN)) p = p.slice(CDN.length);
    p = p.replace(/\?.*$/, '');
    try { p = decodeURI(p); } catch (e) {}
    return p;
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
    traps: CDN + 'Assets/traps/', chess: CDN + 'Assets/chess/',
};
const R3 = read('three-renderer.js');
const XMAS_FILE = (R3.match(/var _XMAS_FILE = '([^']+)'/) || [, 'Christmas.dae'])[1];
const METRO_URL = (R3.match(/_R2_METRO \+ '([^']+\.glb)'/) || [, 'Models/Metro.glb'])[1];
const procRows = [];
/* a proc builder that hangs a real model over its own pieces (THE ONE MODEL: _hqCatGlb / _hqOneModel, a race model, a retro
   tree) is not a stand-in — `procWears` names what it wears, read off the builder's body in three-renderer.js */
function procWears(proc) {
    const m = new RegExp('^\\s+' + proc + ':\\s*function', 'm').exec(R3);
    if (!m) return null;
    const rest = R3.slice(m.index + m[0].length);
    const nx = /^\s+[a-z_0-9]+:\s*function/m.exec(rest);
    const body = nx ? rest.slice(0, nx.index) : rest.slice(0, 4000);
    const hits = new Set();
    for (const h of body.matchAll(/\('([a-z_]+)', U|_hqSpellUrl\('(\w+)'\)|_hqMiscUrl\('(\w+)'\)|getRace3DModel\('([^']+)'|(_nrTree)\(|_hqProcBuilders\._(conveyor)\(/g)) hits.add(h[1] || h[2] || h[3] || h[4] || (h[5] && 'a retro-pack tree') || (h[6] && 'conveyor'));
    return hits.size ? [...hits].join(', ') : null;
}
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
        if (r.pack && !r.file) { const n = +r.pack.replace(/\D/g, ''); add('props', k, CDN + 'Assets/vehicles/Car 0' + n + '/' + (n === 1 ? 'Car' : 'Car' + n) + '.obj'); }
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
const VFX = read('three-vfx-effects.js');
const wpn = block(VFX, 'var _WPN_MODELS = {');
for (const m of wpn.matchAll(/^\s+(\w+):\s*\{[^}]*?\b(file|url):\s*'([^']+)'/gm)) add('spell', m[1], m[2] === 'url' ? m[3] : BASES.weapons + m[3]);
// THE MESHY DECOR (2026-11-03): the models the procs wear (three-renderer.js _HQ_DECOR_GLB) + its three spell props
const decor = block(R3, 'var _HQ_DECOR_GLB = {');
for (const m of decor.matchAll(/(\w+):\s*'([^']+\.glb)'/g)) add('decor', m[1], CDN + 'Assets/decor/' + m[2]);
for (const m of VFX.matchAll(/_WPN_MODELS\.(\w+) = \{ url: _DECOR_BASE \+ '([^']+)'/g)) add('spell', m[1], CDN + 'Assets/decor/' + m[2]);
const ani = block(R3, 'var _ANIMALS = {');
for (const m of ani.matchAll(/^\s+(\w+):\s*\{\s*file:\s*'([^']+)'/gm)) add('animal', m[1], BASES.animals + m[2]);
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
const ewb = (SP.WEAR || []).filter(w => /^ewb_/.test(w[0]));
const hairMh = JSON.parse(read('charactercreation/hair/mh/hair_styles.json'));
const mpfbFiles = fs.readdirSync(path.join(ROOT, 'charactercreation/mpfb')).filter(f => /\.glb$/.test(f));
const ccRoot = fs.readdirSync(path.join(ROOT, 'charactercreation')).filter(f => /\.glb$/.test(f));
const wearFiles = fs.readdirSync(path.join(ROOT, 'charactercreation/wear')).filter(f => /^ewb_.*\.glb$/.test(f));
for (const f of mpfbFiles) add('creator', f.replace(/\.glb$/, ''), CDN + CC + '/mpfb/' + f);
for (const f of ccRoot) add('creator', f.replace(/\.glb$/, ''), CDN + CC + '/' + f);
for (const h of SP.HAIR || []) if (/^hair\d/.test(h.id)) add('creator', h.id + ' · ' + h.label, CDN + CC + '/hair/' + h.id + '.glb');
for (const f of wearFiles) {
    const id = f.replace(/\.glb$/, '');
    const w = ewb.find(e => e[0] === id);
    add('blender', id + (w ? ' · ' + w[1] : (/_open$|_closed$/.test(id) ? ' · (front variant)' : '')), CDN + CC + '/wear/' + f);
}

/* ── write ── */
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
L.push('Besides the catalogue, the battle maps\' near settings, horizons and monuments have procedural families too');
L.push('(the `_hz*` / `_nr*` builders): MODEL_INDEX.md §8 lists them.');
L.push('');
if (fs.existsSync(EXTRA)) { L.push(fs.readFileSync(EXTRA, 'utf8').trim()); L.push(''); }
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
