#!/usr/bin/env node
'use strict';
/* check-spell-presentation.js — THE SPELL CENSUS (SPELL_DIRECTOR_PLAN.md §11).
   Repo tooling. Reads the LIVE files and prints how every playable spell is
   presented: its camera director (bespoke / family / none), its cast clip,
   its VFX identity (a signature of its own, a bespoke director, recipes it
   shares with nobody — or none at all), and the bare capstones.

     node check-spell-presentation.js              the summary
     node check-spell-presentation.js --json       every spell as JSON
     node check-spell-presentation.js --list <b>   one bucket's ids:
        none · bespoke · family:<key> · clip:<slot> · shared · rowless ·
        signature · bareCapstones

   The numbers are the acceptance lines of the plan's §9 — re-run it at the
   end of every phase. Also exported as a module (census()) for the tests. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData, extractConst } = require('./load-data.js');

const R = __dirname;
const read = (f) => fs.readFileSync(path.join(R, f), 'utf8');

/* the runtime SPELL_MAP: the hydrated table + every later assignment, in
   file order (the capstone-vfx / new-race-vfx tests' reader) */
function runtimeSpellMap(FX) {
    const m = FX.match(/var _EFX_DATA = (\{.*?\});\n/s);
    const D = JSON.parse(m[1]);
    const S = Object.assign({}, D.S);
    const ctx = { SPELL_MAP: S, Object };
    let x;
    const re = /SPELL_MAP\['([^']+)'\]\s*=\s*([\s\S]*?);\s*(?:\/\*[^\n]*)?\n/g;
    while ((x = re.exec(FX))) { try { S[x[1]] = vm.runInNewContext('(' + x[2] + ')', ctx); } catch (e) { /* multi-line */ } }
    const re2 = /SPELL_MAP\['([^']+)'\]\.([a-zA-Z]+)\s*=\s*'([^']+)';/g;
    while ((x = re2.exec(FX))) { (S[x[1]] = S[x[1]] || {})[x[2]] = x[3]; }
    const re3 = /SPELL_MAP\.([a-zA-Z0-9_]+)\s*=\s*(\{[^;]*?\});/g;
    while ((x = re3.exec(FX))) { try { S[x[1]] = vm.runInNewContext('(' + x[2] + ')', ctx); } catch (e) {} }
    return S;
}

/* the geometry registry's keys (a key is the spell id, or id:phase) */
function geometryKeys(FX) {
    const keys = new Set();
    const gs = FX.indexOf('var _spell3DGeometry = {');
    const src = FX.slice(gs);
    const re = /['"]?([a-zA-Z][A-Za-z0-9_]*)(:[A-Za-z]+)?['"]?\s*:\s*function\s*\(/g;
    let x;
    while ((x = re.exec(src))) keys.add(x[1]);
    return keys;
}

/* the bespoke directors' keys (the CINE_SEQUENCES block + later adds) */
function sequenceKeys(BT) {
    const keys = new Set();
    const cs = BT.indexOf('const CINE_SEQUENCES = {');
    const ce = BT.indexOf('\n        };', cs);
    const blk = BT.slice(cs, ce);
    let x;
    const re = /^            ([A-Za-z0-9_]+)\s*(?:\(ctx\)|:)/gm;
    while ((x = re.exec(blk))) keys.add(x[1]);
    const re2 = /CINE_SEQUENCES(?:\.([A-Za-z0-9_]+)|\['([^']+)'\])\s*=/g;
    while ((x = re2.exec(BT))) keys.add(x[1] || x[2]);
    return keys;
}

function census() {
    const BT = read('battle.js'), FX = read('three-vfx-effects.js'), SP = read('sprites.js');
    const W = loadGameData();
    const FAM = extractConst(BT, 'CINE_FAMILY_BY_KIND');
    const ROWS = extractConst(BT, 'SPELL_DIRECTOR_ROWS');
    const SEQ = sequenceKeys(BT);
    const S = runtimeSpellMap(FX);
    const GEOM = geometryKeys(FX);
    const capSet = new Set(typeof W.capstoneSpellIds === 'function' ? W.capstoneSpellIds() : []);
    const fsrc = SP.slice(SP.indexOf('function classifySpellAnimKind'), SP.indexOf('// ── SHARED ANIMATION LIBRARIES'));
    const classify = vm.runInNewContext('(function(){ function _isCapstoneSpellForAnim(s){ return CAP.has(s.id); } '
        + fsrc + ' return classifySpellAnimKind; })()', { CAP: capSet });
    /* the chain's first slot per anim kind (three-renderer.js _castChainFor) */
    const RT = read('three-renderer.js');
    const chainSrc = RT.slice(RT.indexOf('function _castChainFor(kind)'), RT.indexOf('/* THE STRIKE FRAME (2026-09-09)'));
    const castChainFor = vm.runInNewContext('(' + chainSrc.replace(/^function _castChainFor/, 'function') + ')');
    const slotClip = {};
    const slotRe = /^\s{2}([A-Za-z0-9]+):\s*\{\s*clip:\s*'([^']+)'/gm;
    let x;
    const slotsSrc = SP.slice(SP.indexOf('const UAL_SLOTS = {'), SP.indexOf('const _FEM_SLOT_DEFAULTS'));
    while ((x = slotRe.exec(slotsSrc))) slotClip[x[1]] = x[2];

    const seen = new Set(), spells = [];
    const push = (s, src, race) => { if (!s || !s.id || seen.has(s.id)) return; seen.add(s.id); spells.push(Object.assign({ _src: src, _race: race || '' }, s)); };
    for (const s of W.SPELL_LIBRARY) push(s, 'job');
    for (const r of Object.keys(W.RACE_ABILITIES)) for (const s of W.RACE_ABILITIES[r]) push(s, 'race', r);

    /* effect ids used by more than one spell = shared */
    const use = {};
    for (const id in S) { const row = S[id] || {}; for (const k in row) { const e = row[k]; if (typeof e === 'string') (use[e] = use[e] || new Set()).add(id); } }

    const out = spells.map(s => {
        const row = S[s.id] || null;
        const effs = row ? Object.values(row).filter(e => typeof e === 'string') : [];
        const own = effs.filter(e => use[e] && use[e].size === 1).length;
        const dr = ROWS[s.id] || null;
        const family = (dr && dr.family) || FAM[s.kind] || null;
        const bespoke = SEQ.has(s.id);
        let anim = '?';
        try { anim = classify(s); } catch (e) { anim = 'ERR'; }
        const slot = (castChainFor(anim) || ['cast'])[0];
        return {
            id: s.id, name: s.name, kind: s.kind, src: s._src, race: s._race,
            capstone: capSet.has(s.id),
            director: bespoke ? 'bespoke' : (family ? 'family:' + family : null),
            family, bespoke, row: !!dr,
            anim, slot, clip: slotClip[slot] || '?',
            vfxRow: !!row, ownEffects: own, sharedOnly: !!row && own === 0,
            signature: GEOM.has(s.id)
        };
    });
    return { spells: out, families: FAM, rows: ROWS, sequences: SEQ };
}

function summary(C) {
    const u = C.spells, n = u.length;
    const c = (f) => u.filter(f).length;
    const pct = (k) => Math.round(100 * k / n) + '%';
    const lines = [];
    lines.push('THE SPELL CENSUS — ' + n + ' spells');
    lines.push('');
    lines.push('DIRECTORS');
    lines.push('  bespoke  ' + c(s => s.bespoke));
    lines.push('  family   ' + c(s => !s.bespoke && s.family));
    lines.push('  NONE     ' + c(s => !s.director) + (c(s => !s.director) ? '   ← ' + u.filter(s => !s.director).map(s => s.id + '/' + s.kind).join(', ') : ''));
    const byFam = {};
    u.forEach(s => { if (s.family) byFam[s.family] = (byFam[s.family] || 0) + 1; });
    lines.push('  by family: ' + Object.entries(byFam).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
    lines.push('');
    lines.push('THE BODY — cast clip spread (target: no clip over 15%)');
    const byClip = {};
    u.forEach(s => { const k = s.clip + ' (' + s.slot + ')'; byClip[k] = (byClip[k] || 0) + 1; });
    const clipsByName = {};
    u.forEach(s => { clipsByName[s.clip] = (clipsByName[s.clip] || 0) + 1; });
    Object.entries(byClip).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => lines.push('  ' + String(v).padStart(4) + '  ' + pct(v).padStart(4) + '  ' + k));
    const worst = Object.entries(clipsByName).sort((a, b) => b[1] - a[1])[0];
    lines.push('  the most-played clip: ' + worst[0] + ' — ' + worst[1] + ' spells (' + pct(worst[1]) + ')');
    lines.push('');
    lines.push('THE LOOK — VFX identity');
    lines.push('  a registered signature        ' + c(s => s.signature));
    lines.push('  a bespoke director             ' + c(s => s.bespoke));
    lines.push('  SHARED-ONLY effects (no own)   ' + c(s => s.sharedOnly));
    lines.push('  no SPELL_MAP row               ' + c(s => !s.vfxRow));
    lines.push('  BARE CAPSTONES (no signature, no bespoke)  ' + c(s => s.capstone && !s.signature && !s.bespoke));
    return lines.join('\n');
}

function bucket(C, name) {
    const u = C.spells;
    if (name === 'none') return u.filter(s => !s.director);
    if (name === 'bespoke') return u.filter(s => s.bespoke);
    if (name.startsWith('family:')) return u.filter(s => !s.bespoke && s.family === name.slice(7));
    if (name.startsWith('clip:')) return u.filter(s => s.slot === name.slice(5) || s.clip === name.slice(5));
    if (name === 'shared') return u.filter(s => s.sharedOnly);
    if (name === 'rowless') return u.filter(s => !s.vfxRow);
    if (name === 'signature') return u.filter(s => s.signature);
    if (name === 'bareCapstones') return u.filter(s => s.capstone && !s.signature && !s.bespoke);
    return [];
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const C = census();
    if (args.includes('--json')) {
        process.stdout.write(JSON.stringify(C.spells, null, 1) + '\n');
    } else if (args.includes('--list')) {
        const b = args[args.indexOf('--list') + 1] || 'none';
        const rows = bucket(C, b);
        process.stdout.write(b + ' (' + rows.length + ')\n' + rows.map(s => '  ' + s.id + '  [' + s.kind + ' · ' + s.slot + ']' + (s.race ? '  ' + s.race : '')).join('\n') + '\n');
    } else {
        process.stdout.write(summary(C) + '\n');
    }
}

module.exports = { census, summary, bucket };
