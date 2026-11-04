#!/usr/bin/env node
/* bake-faces.js (2026-11-03, mondo: "can you point me to some resources or websites or asset packs where i can get makehuman
   face presets? Or download a few yourself?") — turns MakeHuman characters into creator FACE presets.

   A MakeHuman "face preset" is a whole saved character: a .mhm file (MakeHuman 1.x, the community asset repository) or an MPFB
   human preset (.json). Our FACE sliders ARE MakeHuman's own face modifiers (bake-mpfb.py SHAPE_TARGETS, scaled by three-renderer.js
   SHAPE_GAIN), so each face line maps across: slider = MakeHuman value / that slider's gain, clamped to -1..1. What does NOT carry:
   the body-wide macros (gender / age / weight / ethnic mix / proportions) a .mhm also sets, and face modifiers we have no slider
   for (listed when baking) — so a preset is close to the original face, not identical.

   Usage (repo tooling, like bake-looks.js):
     node bake-faces.js <file.mhm|preset.json> [more…] [--label "Name"] [--gender male|female] [--author "Who"]
                        [--license CC0|CC-BY|…] [--source URL] [--dry-run]
     node bake-faces.js --list
     node bake-faces.js --remove <id>
   --label / --gender / --author / --license / --source apply to every file named in that run (default: the .mhm `name` line or
   the file name; the gender from the .mhm Gender macro, >= 0.5 = male; author from the .mhm `author` line, else "unknown").
   Writes the sprites.js block between the EW_MPFB_FACE_PRESETS markers (one row per preset, replaced by id). The creator shows
   every row as a FACE preset button; the credits page lists the authors of CC-BY rows (map.js, the MakeHuman section).
   Never changes EW_MPFB_DEFAULT_FACES. Then: node --check sprites.js, bump the ?v= token, merge, sync zip (CLAUDE.md RULE #1). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = __dirname, SPRITES = path.join(ROOT, 'sprites.js'), RENDERER = path.join(ROOT, 'three-renderer.js');
const BEGIN = '// EW_MPFB_FACE_PRESETS:BEGIN (written by bake-faces.js)', END = '// EW_MPFB_FACE_PRESETS:END';

/* our face slider -> [plus target, minus target] pairs (bake-mpfb.py SHAPE_TARGETS, face keys; target names without the group).
   Keep in step with SHAPE_TARGETS when a face slider is added. */
const FACE_TARGETS = {"head":[["head-scale-horiz-incr","head-scale-horiz-decr"]],"jaw":[["chin-width-incr","chin-width-decr"]],"nose":[["nose-volume-incr","nose-volume-decr"]],"cheeks":[["l-cheek-volume-incr","l-cheek-volume-decr"],["r-cheek-volume-incr","r-cheek-volume-decr"]],"eyeSize":[["l-eye-scale-incr","l-eye-scale-decr"],["r-eye-scale-incr","r-eye-scale-decr"]],"eyeHeight":[["l-eye-trans-up","l-eye-trans-down"],["r-eye-trans-up","r-eye-trans-down"]],"eyeSpacing":[["l-eye-trans-out","l-eye-trans-in"],["r-eye-trans-out","r-eye-trans-in"]],"eyeTilt":[["l-eye-corner2-up","l-eye-corner2-down"],["r-eye-corner2-up","r-eye-corner2-down"],["l-eye-corner1-down","l-eye-corner1-up"],["r-eye-corner1-down","r-eye-corner1-up"]],"eyeOpen":[["l-eye-height2-incr","l-eye-height2-decr"],["r-eye-height2-incr","r-eye-height2-decr"]],"eyeDepth":[["l-eye-push1-out","l-eye-push1-in"],["r-eye-push1-out","r-eye-push1-in"]],"eyelid":[["l-eye-eyefold-down","l-eye-eyefold-up"],["r-eye-eyefold-down","r-eye-eyefold-up"]],"eyeBags":[["l-eye-bag-incr","l-eye-bag-decr"],["r-eye-bag-incr","r-eye-bag-decr"]],"epicanthus":[["l-eye-epicanthus-in","l-eye-epicanthus-out"],["r-eye-epicanthus-in","r-eye-epicanthus-out"]],"browHeight":[["eyebrows-trans-up","eyebrows-trans-down"]],"browAngle":[["eyebrows-angle-up","eyebrows-angle-down"]],"browRidge":[["eyebrows-trans-forward","eyebrows-trans-backward"]],"noseWidth":[["nose-scale-horiz-incr","nose-scale-horiz-decr"]],"noseLength":[["nose-scale-vert-incr","nose-scale-vert-decr"]],"noseDepth":[["nose-scale-depth-incr","nose-scale-depth-decr"]],"noseHeight":[["nose-trans-up","nose-trans-down"]],"noseBridge":[["nose-hump-incr","nose-hump-decr"]],"noseTip":[["nose-point-up","nose-point-down"]],"nostrils":[["nose-flaring-incr","nose-flaring-decr"]],"noseCurve":[["nose-curve-convex","nose-curve-concave"]],"mouthWidth":[["mouth-scale-horiz-incr","mouth-scale-horiz-decr"]],"mouthHeight":[["mouth-trans-up","mouth-trans-down"]],"upperLip":[["mouth-upperlip-volume-incr","mouth-upperlip-volume-decr"]],"lowerLip":[["mouth-lowerlip-volume-incr","mouth-lowerlip-volume-decr"]],"mouthCorners":[["mouth-angles-up","mouth-angles-down"]],"cupidsBow":[["mouth-cupidsbow-incr","mouth-cupidsbow-decr"]],"mouthDepth":[["mouth-trans-forward","mouth-trans-backward"]],"chinLength":[["chin-height-incr","chin-height-decr"]],"chinJut":[["chin-prominent-incr","chin-prominent-decr"]],"underbite":[["chin-prognathism-incr","chin-prognathism-decr"]],"chinCleft":[["chin-cleft-incr","chin-cleft-decr"]],"jawAngle":[["chin-bones-incr","chin-bones-decr"]],"cheekbones":[["l-cheek-bones-incr","l-cheek-bones-decr"],["r-cheek-bones-incr","r-cheek-bones-decr"]],"cheekHeight":[["l-cheek-trans-up","l-cheek-trans-down"],["r-cheek-trans-up","r-cheek-trans-down"]],"headHeight":[["head-scale-vert-incr","head-scale-vert-decr"]],"headDepth":[["head-scale-depth-incr","head-scale-depth-decr"]],"faceFat":[["head-fat-incr","head-fat-decr"]],"faceAge":[["head-age-incr","head-age-decr"]],"foreheadHeight":[["forehead-scale-vert-incr","forehead-scale-vert-decr"]],"foreheadSlope":[["forehead-trans-backward","forehead-trans-forward"]],"earSize":[["l-ear-scale-incr","l-ear-scale-decr"],["r-ear-scale-incr","r-ear-scale-decr"]],"earOut":[["l-ear-wing-incr","l-ear-wing-decr"],["r-ear-wing-incr","r-ear-wing-decr"]],"earPoint":[["l-ear-shape-pointed","l-ear-shape-round"],["r-ear-shape-pointed","r-ear-shape-round"]],"earLobe":[["l-ear-lobe-incr","l-ear-lobe-decr"],["r-ear-lobe-incr","r-ear-lobe-decr"]],"neckThick":[["neck-scale-horiz-incr","neck-scale-horiz-decr"],["neck-scale-depth-incr","neck-scale-depth-decr"]]};
const FACE_GROUPS = /^(head|chin|nose|cheek|eyes|eyebrows|mouth|forehead|ears|neck)\//;

function shapeGain() {   // three-renderer.js SHAPE_GAIN, read live
    const src = fs.readFileSync(RENDERER, 'utf8'), m = src.match(/var SHAPE_GAIN = (\{[\s\S]*?\});/);
    if (!m) throw new Error('SHAPE_GAIN not found in three-renderer.js');
    return Function('return ' + m[1])();
}

/* a character file -> { weights: target -> weight (>= 0), macros, name, author, unknown: [face modifiers with no slider] } */
function readCharacter(file) {
    const txt = fs.readFileSync(file, 'utf8'), W = {}, macros = {}, faceMods = [];
    let name = null, author = null;
    const add = (t, v) => { if (v > 0) W[t] = (W[t] || 0) + v; };
    if (/\.json$/i.test(file)) {   // MPFB human preset: { targets: [{ target, value }], gender, age, … } (MPFB 2 save human)
        const j = JSON.parse(txt);
        (j.targets || []).forEach(r => { const t = String(r.target || '').replace(/^.*\//, ''); add(t, +r.value || 0); faceMods.push(t); });
        ['gender', 'age', 'muscle', 'weight', 'height', 'proportions'].forEach(k => { if (j[k] != null) macros[k] = +j[k]; });
        name = j.name || null;
    } else {                        // .mhm: `modifier <group>/<neg target>|<pos suffix> <value>` (or a one-sided `<group>/<target>`)
        txt.split(/\r?\n/).forEach(line => {
            const p = line.trim().split(/\s+/);
            if (p[0] === 'name' && p.length > 1) name = p.slice(1).join(' ');
            if (p[0] === 'author' && p.length > 1) author = p.slice(1).join(' ');
            if (p[0] !== 'modifier' || p.length < 3) return;
            const id = p[1], v = parseFloat(p[2]); if (!isFinite(v)) return;
            if (/^macrodetails/.test(id)) { macros[id.replace(/^.*\//, '').toLowerCase()] = v; return; }
            if (!v) return;
            if (!FACE_GROUPS.test(id)) return;
            const mod = id.replace(/^[^/]+\//, '');
            if (mod.includes('|')) {
                const [neg, posSuf] = mod.split('|'), pos = neg.replace(/[^-]+$/, posSuf);
                if (v > 0) add(pos, v); else add(neg, -v);
                faceMods.push(v > 0 ? pos : neg);
            } else { add(mod, Math.abs(v)); faceMods.push(mod); }
        });
    }
    const known = new Set(); Object.values(FACE_TARGETS).forEach(ps => ps.forEach(([a, b]) => { known.add(a); known.add(b); }));
    return { weights: W, macros, name, author, unknown: faceMods.filter(t => !known.has(t)) };
}

function toFace(weights, gain) {
    const face = {};
    Object.keys(FACE_TARGETS).forEach(k => {
        const ps = FACE_TARGETS[k];
        /* the average over the pairs the file sets (a file that sets one eye, or only the outer corner, still gives its value) */
        const used = ps.filter(([plus, minus]) => weights[plus] || weights[minus]);
        if (!used.length) return;
        const c = used.reduce((s, [plus, minus]) => s + (weights[plus] || 0) - (weights[minus] || 0), 0) / used.length;
        if (Math.abs(c) < 1e-4) return;
        const gk = gain[k], g = Array.isArray(gk) ? gk[c > 0 ? 0 : 1] : (gk || 1);
        const v = Math.max(-1, Math.min(1, Math.round(c / g * 100) / 100));
        if (v) face[k] = v;
    });
    return face;
}

function readBlock() {
    const src = fs.readFileSync(SPRITES, 'utf8'), a = src.indexOf(BEGIN), b = src.indexOf(END);
    if (a < 0 || b < a) throw new Error('EW_MPFB_FACE_PRESETS markers not found in sprites.js');
    const body = src.slice(a + BEGIN.length, b), m = body.match(/=\s*(\[[\s\S]*\]);/);
    return { src, a, b, rows: m ? JSON.parse(m[1]) : [] };
}
function writeBlock(blk, rows, dry) {
    const lines = rows.map(r => '  ' + JSON.stringify(r)).join(',\n');
    const out = blk.src.slice(0, blk.a) + BEGIN + '\nconst EW_MPFB_FACE_PRESETS = [' + (rows.length ? '\n' + lines + '\n' : '') + '];\n' + blk.src.slice(blk.b);
    if (dry) { console.log('(dry run) sprites.js not written'); return; }
    fs.writeFileSync(SPRITES, out);
    console.log('wrote sprites.js EW_MPFB_FACE_PRESETS (' + rows.length + ' preset' + (rows.length === 1 ? '' : 's') + '). Next: node --check sprites.js, bump ?v=, merge, sync zip.');
}

function main() {
    const argv = process.argv.slice(2), opt = {}, files = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--dry-run' || a === '--list') opt[a.slice(2)] = true;
        else if (/^--(label|gender|author|license|source|remove)$/.test(a)) opt[a.slice(2)] = argv[++i];
        else files.push(a);
    }
    const blk = readBlock();
    if (opt.list) { blk.rows.forEach(r => console.log(r.id.padEnd(28), r.gender.padEnd(7), (r.license || '').padEnd(8), r.label, '·', r.author)); if (!blk.rows.length) console.log('(no presets yet)'); return; }
    if (opt.remove) { const rows = blk.rows.filter(r => r.id !== opt.remove); if (rows.length === blk.rows.length) { console.error('no preset ' + opt.remove); process.exit(1); } writeBlock(blk, rows, opt['dry-run']); return; }
    if (!files.length) { console.error('usage: node bake-faces.js <file.mhm|preset.json> [more…] [--label ..] [--gender male|female] [--author ..] [--license ..] [--source URL] [--dry-run] | --list | --remove <id>'); process.exit(1); }
    const gain = shapeGain(), rows = blk.rows.slice();
    files.forEach(f => {
        const c = readCharacter(f), face = toFace(c.weights, gain);
        const label = opt.label || c.name || path.basename(f).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        const g = opt.gender || (c.macros.gender != null ? (c.macros.gender >= 0.5 ? 'male' : 'female') : 'male');
        const id = 'mh_' + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const row = { id, label, gender: g, author: opt.author || c.author || 'unknown', license: opt.license || 'CC0', source: opt.source || '', face };
        const at = rows.findIndex(r => r.id === id); if (at >= 0) rows[at] = row; else rows.push(row);
        console.log('\n' + path.basename(f) + ' -> ' + id + ' (' + g + ', ' + Object.keys(face).length + ' sliders)');
        console.log('  face:', JSON.stringify(face));
        if (Object.keys(c.macros).length) console.log('  body macros NOT carried (our MPFB bodies are fixed):', JSON.stringify(c.macros));
        if (c.unknown.length) console.log('  face modifiers with no creator slider (dropped):', [...new Set(c.unknown)].join(', '));
        if (/BY/i.test(row.license) && row.author === 'unknown') console.log('  WARNING: a CC-BY preset needs --author for the credits');
    });
    writeBlock(blk, rows, opt['dry-run']);
}
main();
