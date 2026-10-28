#!/usr/bin/env node
// bake-setup.js — bake a SAVE EVERYTHING file (UI Maker > Share > Save everything, or Settings > HUD Theme) into the
// shipped defaults, so a fresh browser looks exactly like the browser that saved it (2026-10-28, mondo: "Every single
// change to the game needs to be exported so you can bake it, i cant sell a game to people and realize too late that
// they are all running a different experience than i intended").
//
//   node bake-setup.js <Entropy_Wars_Setup_….json> [--keys k1,k2,…|all] [--dry-run]
//
// · ui   (the whole UI Maker store, every value as made) → hud.js, between /* SHIPPED-UI:BEGIN */ and /* SHIPPED-UI:END */
//        (const UIM_SHIPPED). hud.js THE SHIPPED SETUP lays it under each browser's own store.
// · keys (every other setting the browser keeps, by localStorage key, as stored) → index.html, between
//        /* SHIPPED-KEYS:BEGIN */ and /* SHIPPED-KEYS:END */ (THE SHIPPED SETTINGS, seeded before any script reads one).
//        Baked without asking: the look keys (LOOK_KEYS: the theme the game wears, the nameplate style, the ring vitals).
//        The rest only with --keys (a list, or `all` = every key except the device / progress / dev ones): his standing
//        rules ship some Settings OFF (bloom, fog, light rays, filmic, auto exposure ...), so a thread asks him first.
//        The editors' stores (Race Editor, Spell Library, Data Panel, audio mix, music tags) bake through their own
//        route, printed per key.
// Prints every key with its value and where it goes, then node --checks hud.js. Zero dependencies. Repo-only tooling,
// never loaded by the game. Notes: docs/notes/ui-menus-audio.md "THE SHIPPED SETUP".

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const HUD = path.join(ROOT, 'hud.js');
const INDEX = path.join(ROOT, 'index.html');
const UI_BEGIN = '/* SHIPPED-UI:BEGIN */', UI_END = '/* SHIPPED-UI:END */';
const K_BEGIN = '/* SHIPPED-KEYS:BEGIN */', K_END = '/* SHIPPED-KEYS:END */';

/* the look keys: baked with the UI Maker store */
const LOOK_KEYS = ['ew_hud_theme', 'ew_plateStyle', 'ew_ringVitals'];
/* [pattern, kind, where it bakes] — first match wins */
const KINDS = [
    [/^ew_hud_theme$|^ew_plateStyle$|^ew_ringVitals$/, 'look', 'index.html SHIPPED-KEYS (baked)'],
    [/^ew_(gpu|perfMode|pixelRatio|fpsCap|showFps|fpsCounter|mobileFit|uiScalePref|terrainBatch|fxbatch|perfLens|perfLensSeen)$/, 'device', 'stays per computer (never baked)'],
    [/^ew_spell_mods/, 'editor', 'Spell Library > EXPORT, then node bake-spell-mods.js'],
    [/^ew_race_mods/, 'editor', 'Race Editor > EXPORT, then data.js by hand (its instructions)'],
    [/^ew_data_mods/, 'editor', 'Data Panel > EXPORT, then data.js by hand (its instructions)'],
    [/^ew_audio_mix$/, 'editor', 'audio.js AUDIO_MIX_SHIPPED (paste the mixer export)'],
    [/^ew_music_tags$/, 'editor', 'audio.js MUSIC_TAGS_SHIPPED (MusicTags.exportJs())'],
    [/^ew_custom_maps$/, 'editor', 'custom maps: ask him which ship'],
    [/^ew_editor/, 'dev', 'map editor own prefs (its rooms ship through FILE > EXPORT)'],
    [/^ew-dev$|^ew_hqdev$|^ew_hq$|^ew_hq_foyer$|^ew_hq_encounter|^ew_area_units$|^ew_me_hud_w$|^ew_rce_frame$|^ew_rack_group$|^ew_clog_folded$|^ew_data_panel$|^ew_training_match$|^ew_reserves$|^ew_held_|^ew-ai-difficulty|^ew_rejoin|^ew_match_pad/, 'dev', 'a dev switch / a window spot / a last pick (not baked)'],
    [/^ew_(cameraPreset|menu_cam|cinematicActionCam)$/, 'camera', 'index.html SHIPPED-KEYS with --keys'],
    [/^ew_(audioVolumes)$/, 'audio', 'index.html SHIPPED-KEYS with --keys'],
    [/^ew_(padBindings|padOpts|strikeBinds|strikeOpts)$/, 'controls', 'index.html SHIPPED-KEYS with --keys'],
    [/^ew_/, 'settings', 'index.html SHIPPED-KEYS with --keys (graphics / display: check his OFF-by-default rules first)'],
    [/./, 'other', 'index.html SHIPPED-KEYS with --keys'],
];
const NEVER = { device: 1, dev: 1, editor: 1 };

function kindOf(k) { const r = KINDS.find(([re]) => re.test(k)); return { kind: r[1], where: r[2] }; }
function short(v) { v = String(v); return v.length > 70 ? v.slice(0, 67) + '...' : v; }
function between(src, a, b, file) {
    const i = src.indexOf(a), j = src.indexOf(b);
    if (i < 0 || j < 0 || j < i || src.indexOf(a, i + 1) >= 0) throw new Error(file + ': the markers ' + a + ' / ' + b + ' are missing or doubled');
    return [i + a.length, j];
}
/* JSON a <script> or a JS file can hold as is: no </script>, no line separators */
function jsJson(v, indent) {
    return JSON.stringify(v, null, indent).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function main() {
    const args = process.argv.slice(2);
    const dry = args.includes('--dry-run');
    const ki = args.indexOf('--keys'), pick = ki >= 0 ? String(args[ki + 1] || '') : '';
    const file = args.find((a, i) => !a.startsWith('--') && !(ki >= 0 && i === ki + 1));
    if (!file) { console.error('usage: node bake-setup.js <Entropy_Wars_Setup_….json> [--keys k1,k2|all] [--dry-run]'); process.exit(2); }
    const f = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!f || f.format !== 'entropy-wars-setup' || !f.ui || typeof f.ui !== 'object') {
        console.error(file + ' is not a SAVE EVERYTHING file (format entropy-wars-setup).' + (f && f.ewTheme ? ' It is a one-theme file (Save theme).' : ''));
        process.exit(2);
    }
    const keys = f.keys && typeof f.keys === 'object' ? f.keys : {};
    const named = pick === 'all' ? null : new Set(pick.split(',').map(s => s.trim()).filter(Boolean));

    /* the UI Maker store, every value as made */
    const ui = f.ui;
    let hud = fs.readFileSync(HUD, 'utf8');
    const [ua, ub] = between(hud, UI_BEGIN, UI_END, 'hud.js');
    hud = hud.slice(0, ua) + '\nconst UIM_SHIPPED = ' + jsJson(ui, 1) + ';\n' + hud.slice(ub);

    /* the settings */
    const ship = {}, rows = [];
    Object.keys(keys).sort().forEach(k => {
        const { kind, where } = kindOf(k), v = keys[k];
        const bake = kind === 'look' || (!NEVER[kind] && (pick === 'all' || (named && named.has(k))));
        if (bake && typeof v === 'string') ship[k] = v;
        rows.push([bake ? 'BAKED' : '-', kind, k, short(v), bake ? 'index.html SHIPPED-KEYS' : where]);
    });
    if (named) named.forEach(k => { if (!(k in keys)) rows.push(['MISSING', '?', k, '', 'not in the file']); });
    let idx = fs.readFileSync(INDEX, 'utf8');
    const [ka, kb] = between(idx, K_BEGIN, K_END, 'index.html');
    idx = idx.slice(0, ka) + jsJson(ship, 0) + idx.slice(kb);

    /* what it is */
    const n = o => Object.keys(o || {}).length;
    console.log('SAVE EVERYTHING file: ' + path.basename(file) + ' (saved ' + (f.exportedAt || '?') + ', build ' + (f.build || '?') + ')');
    (f.summary || []).forEach(l => console.log('  ' + l));
    console.log('\nUI Maker store → hud.js UIM_SHIPPED: ' + (ui.themes || []).length + ' themes, ' + n(ui.ux) + ' ux settings, ' + n(ui.layout)
        + ' layout pieces, ' + n(ui.hero) + ' hero, ' + n(ui.bars) + ' bars, ' + n(ui.icons) + ' icons, ' + n(ui.words) + ' words, '
        + (ui.picks || []).length + ' picks, ' + n(ui.faces && ui.faces.u) + ' portraits, ' + n(ui.btns) + ' buttons, ' + (ui.slices || []).length + ' 9-slices');
    const wear = keys.ew_hud_theme || f.wear;
    if (wear && /^c_/.test(wear) && !(ui.themes || []).some(t => t && t.id === wear)) console.log('  ! the game wears ' + wear + ', a theme that is not in the file');
    console.log('\nSettings (' + n(keys) + ' keys; ' + n(ship) + ' → index.html SHIPPED-KEYS):');
    rows.forEach(r => console.log('  ' + r[0].padEnd(7) + ' ' + r[1].padEnd(9) + ' ' + r[2].padEnd(26) + ' ' + r[3].padEnd(72) + ' ' + r[4]));
    if (dry) { console.log('\n--dry-run: nothing written'); return; }

    fs.writeFileSync(HUD, hud);
    fs.writeFileSync(INDEX, idx);
    const c = spawnSync(process.execPath, ['--check', HUD], { stdio: 'inherit' });
    if (c.status !== 0) { console.error('hud.js does not parse: NOT a delivery'); process.exit(1); }
    console.log('\nwrote hud.js + index.html (node --check hud.js ok). Bump the ?v= token, merge, write the sync zip.');
}

main();
