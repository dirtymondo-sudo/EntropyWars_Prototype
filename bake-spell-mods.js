#!/usr/bin/env node
// bake-spell-mods.js — bake a Spell Library export into data.js (SPELL_LIBRARY_PLAN.md §4.9, Phase 0).
//
//   node bake-spell-mods.js <export.json> [--data data.js] [--out data.js] [--notes docs/spell-notes.md]
//                                          [--dry-run] [--no-test]
//   node bake-spell-mods.js --stamp-tiers [--data data.js] [--out data.js]     (writes the explicit numeric
//                                          `tier` = spellTierOf(id) onto every shipped row — the Phase 0 migration)
//
// The export is EWSpellMods' doc (v1 or v2): sparse `modified` field patches, `added` full defs (`_home` says
// where they live), `deleted` ids, `learnsets` / `raceAbilities` full id arrays, and the v2 registries
// `families` / `upgrades` / `raceFamilies` (id → row, null = delete). The tool rewrites the LITERAL rows in
// data.js in place — field by field, so comments and formatting around them survive — appends added rows to
// their home array, removes deleted rows, rewrites the learn-order arrays, patches the registries row by row,
// turns movepool changes into the "Baked movepool shares" table, strips every `notes` field into
// docs/spell-notes.md (notes never ship to players, §7 Q12), prints what it did, and runs `npm run test:quick`.
// Zero dependencies (Node built-ins). Repo-only tooling — never loaded by the game.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadGameData, REPO_ROOT } = require('./load-data');

/* ── the scanner: every bracket span in a JS source, strings / comments / templates / regex literals aware ── */
function scanSpans(src) {
    const spans = [];          // { ch, start, end, parent, depth }
    const stack = [];          // open spans (indices into `spans`)
    const modeStack = [];      // template-literal nesting: each entry = brace depth at which the `${` opened
    let i = 0;
    const n = src.length;
    const prevSig = (pos) => {
        for (let k = pos - 1; k >= 0; k--) { const c = src[k]; if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue; return c; }
        return '';
    };
    const prevWord = (pos) => {
        let k = pos - 1;
        while (k >= 0 && /\s/.test(src[k])) k--;
        let e = k + 1;
        while (k >= 0 && /[A-Za-z0-9_$]/.test(src[k])) k--;
        return src.slice(k + 1, e);
    };
    while (i < n) {
        const c = src[i], d = src[i + 1];
        if (c === '/' && d === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e + 1; continue; }
        if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '\'' || c === '"') {
            let k = i + 1;
            while (k < n && src[k] !== c) { if (src[k] === '\\') k++; if (src[k] === '\n') break; k++; }
            i = k + 1; continue;
        }
        if (c === '`') {
            // template: scan to the closing backtick, entering `${ … }` expressions as code
            let k = i + 1;
            let done = false;
            while (k < n) {
                const t = src[k];
                if (t === '\\') { k += 2; continue; }
                if (t === '`') { done = true; k++; break; }
                if (t === '$' && src[k + 1] === '{') { modeStack.push(stack.length); k += 2; break; }
                k++;
            }
            i = k;
            if (done || k >= n) continue;
            // fell into a `${` — code mode resumes here; the matching `}` (at this bracket depth) returns to the template
            continue;
        }
        if (c === '/') {
            // regex literal?
            const p = prevSig(i), w = prevWord(i);
            const regexOk = p === '' || '(,=:[!&|?{};+-*%<>~^'.includes(p) || ['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'do', 'else'].includes(w);
            if (regexOk) {
                let k = i + 1, inClass = false;
                while (k < n) {
                    const t = src[k];
                    if (t === '\\') { k += 2; continue; }
                    if (t === '\n') break;
                    if (inClass) { if (t === ']') inClass = false; k++; continue; }
                    if (t === '[') { inClass = true; k++; continue; }
                    if (t === '/') { k++; break; }
                    k++;
                }
                while (k < n && /[a-z]/.test(src[k])) k++;
                i = k; continue;
            }
        }
        if (c === '{' || c === '[' || c === '(') {
            spans.push({ ch: c, start: i, end: -1, parent: stack.length ? stack[stack.length - 1] : -1, depth: stack.length });
            stack.push(spans.length - 1);
            i++; continue;
        }
        if (c === '}' || c === ']' || c === ')') {
            if (c === '}' && modeStack.length && modeStack[modeStack.length - 1] === stack.length) {
                // closes a `${ … }` — back into the template literal
                modeStack.pop();
                let k = i + 1, done = false;
                while (k < n) {
                    const t = src[k];
                    if (t === '\\') { k += 2; continue; }
                    if (t === '`') { done = true; k++; break; }
                    if (t === '$' && src[k + 1] === '{') { modeStack.push(stack.length); k += 2; break; }
                    k++;
                }
                i = k; continue;
            }
            const idx = stack.pop();
            if (idx != null) spans[idx].end = i + 1;
            i++; continue;
        }
        i++;
    }
    return spans;
}

/* The depth-1 properties of an object-literal span: [{ key, keyStart, valStart, valEnd, end, raw }] (`end` = after the
   trailing comma when there is one). Spread / shorthand entries come back with key = null and their text in `raw`. */
function objectProps(src, span) {
    const props = [];
    let i = span.start + 1;
    const stop = span.end - 1;
    const skipWs = () => {
        for (;;) {
            while (i < stop && /\s/.test(src[i])) i++;
            if (src[i] === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 || e > stop ? stop : e + 1; continue; }
            if (src[i] === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 || e > stop ? stop : e + 2; continue; }
            break;
        }
    };
    const valueEnd = (from) => {
        // the value runs to the next depth-0 comma or the closing bracket; nested brackets / strings / comments are opaque
        let k = from, depth = 0;
        while (k < stop) {
            const c = src[k], d = src[k + 1];
            if (c === '/' && d === '/') { const e = src.indexOf('\n', k); k = e < 0 ? stop : e + 1; continue; }
            if (c === '/' && d === '*') { const e = src.indexOf('*/', k + 2); k = e < 0 ? stop : e + 2; continue; }
            if (c === '\'' || c === '"' || c === '`') { let m = k + 1; while (m < stop && src[m] !== c) { if (src[m] === '\\') m++; m++; } k = m + 1; continue; }
            if (c === '{' || c === '[' || c === '(') depth++;
            else if (c === '}' || c === ']' || c === ')') depth--;
            else if (c === ',' && depth === 0) break;
            k++;
        }
        return k;
    };
    while (i < stop) {
        skipWs();
        if (i >= stop) break;
        const pStart = i;
        let key = null, keyStart = i;
        if (src[i] === '\'' || src[i] === '"') {
            const q = src[i]; let k = i + 1; while (k < stop && src[k] !== q) { if (src[k] === '\\') k++; k++; }
            key = src.slice(i + 1, k); i = k + 1;
        } else if (/[A-Za-z_$]/.test(src[i])) {
            let k = i; while (k < stop && /[A-Za-z0-9_$]/.test(src[k])) k++;
            key = src.slice(i, k); i = k;
        }
        skipWs();
        if (key !== null && src[i] === ':') {
            i++; skipWs();
            const valStart = i;
            let vEnd = valueEnd(i);
            let valEnd = vEnd;
            while (valEnd > valStart && /\s/.test(src[valEnd - 1])) valEnd--;
            let end = vEnd;
            if (src[end] === ',') end++;
            props.push({ key, keyStart, valStart, valEnd, end, raw: src.slice(pStart, end) });
            i = end;
        } else {
            // shorthand / spread / method — skip to the next depth-0 comma
            const vEnd = valueEnd(pStart);
            let end = vEnd; if (src[end] === ',') end++;
            props.push({ key: null, keyStart: pStart, valStart: pStart, valEnd: vEnd, end, raw: src.slice(pStart, end) });
            i = end;
        }
    }
    return props;
}

function unquote(raw) {
    const t = raw.trim();
    if ((t[0] === '\'' || t[0] === '"') && t[t.length - 1] === t[0]) return t.slice(1, -1).replace(/\\(.)/g, '$1');
    return null;
}

/* ── JS rendering of values (single-quoted strings, identifier keys, compact) ── */
function jsStr(s) { return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''; }
function jsKey(k) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : jsStr(k); }
function toJs(v, indent) {
    indent = indent || '';
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') return jsStr(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) {
        const parts = v.map(x => toJs(x, indent + '    '));
        const inline = '[' + parts.join(', ') + ']';
        if (inline.length + indent.length <= 110 || parts.every(p => p.length < 24 && !p.includes('\n'))) return inline;
        return '[\n' + parts.map(p => indent + '    ' + p).join(',\n') + '\n' + indent + ']';
    }
    if (typeof v === 'object') {
        const keys = Object.keys(v);
        if (!keys.length) return '{}';
        const parts = keys.map(k => jsKey(k) + ': ' + toJs(v[k], indent + '    '));
        const inline = '{ ' + parts.join(', ') + ' }';
        if (inline.length + indent.length <= 110 && !inline.includes('\n')) return inline;
        return '{\n' + parts.map(p => indent + '    ' + p).join(',\n') + '\n' + indent + '}';
    }
    return String(v);
}

const ROW_SKIP = { _home: 1, _race: 1, _isRaceAbility: 1, _doorWheel: 1, _legacyTier: 1, role: 1, notes: 1, descAuto: 1, simTargeting: 1, simPhase: 1, simFallback: 1 };
const ROW_FIRST = ['id', 'name', 'desc', 'tier', 'families', 'upgrades'];
/* A whole row as a literal, the plan's field order: { id, name, desc, tier, families, …rest in source order }. */
function serializeRow(def, indent) {
    indent = indent || '        ';
    const keys = ROW_FIRST.filter(k => def[k] !== undefined && !ROW_SKIP[k]).concat(Object.keys(def).filter(k => !ROW_FIRST.includes(k) && !ROW_SKIP[k]));
    const desc = keys.includes('desc');
    const head = keys.filter(k => k !== 'desc');
    const lines = [];
    let line = '{';
    for (const k of head) {
        const piece = ' ' + jsKey(k) + ': ' + toJs(def[k], indent + '  ') + ',';
        if ((line + piece).length > 118 && line !== '{') { lines.push(line); line = indent + ' ' + piece; }
        else line += piece;
    }
    if (desc) { lines.push(line); line = indent + '  desc: ' + jsStr(def.desc); }
    else line = line.replace(/,$/, '');
    lines.push(line + ' }');
    return lines.join('\n');
}

/* ── the tables: where a row literal lives ── */
function tableSpan(src, spans, decl) {
    const at = src.indexOf(decl);
    if (at < 0) return null;
    const open = at + decl.length - 1;
    return spans.find(s => s.start === open) || null;
}
function within(span, pos) { return span && pos > span.start && pos < span.end; }

function indexRows(src, spans) {
    const lib = tableSpan(src, spans, 'const SPELL_LIBRARY = [');
    const race = tableSpan(src, spans, 'const RACE_ABILITIES = {');
    const door = tableSpan(src, spans, 'const DOOR_GUN_SPELLS = [');
    const raceArrays = {};   // race → { key, span }
    if (race) for (const p of objectProps(src, race)) {
        if (p.key === null) continue;
        const arr = spans.find(s => s.start === p.valStart && s.ch === '[');
        if (arr) raceArrays[p.key] = { prop: p, span: arr };
    }
    const rows = {};   // id → [{ span, props, home, race }]
    for (const s of spans) {
        if (s.ch !== '{' || s.end < 0) continue;
        let parent = s.parent >= 0 ? spans[s.parent] : null;
        if (parent && parent.ch === '(' && parent.parent >= 0 && spans[parent.parent].ch === '[') parent = spans[parent.parent];   // a factory call in the array: _mkCharge({ … })
        if (parent && parent.ch !== '[') continue;        // a nested object (summonDef, statusEffects' owner) is not a row
        if (parent && parent.parent >= 0) {
            const gp = spans[parent.parent];
            // rows sit in SPELL_LIBRARY / DOOR_GUN_SPELLS (array at top level) or a RACE_ABILITIES race array (array in the table object)
            if (gp.ch !== '{' || gp !== race) { if (parent !== lib && parent !== door) continue; }
        }
        const props = objectProps(src, s);
        const idP = props.find(p => p.key === 'id'), nameP = props.find(p => p.key === 'name');
        if (!idP || !nameP) continue;
        const id = unquote(src.slice(idP.valStart, idP.valEnd));
        if (!id) continue;
        let home = 'shared', raceKey = null;
        if (within(lib, s.start)) home = 'lib';
        else if (within(door, s.start)) home = 'door';
        else if (within(race, s.start)) { home = 'race'; for (const k of Object.keys(raceArrays)) if (within(raceArrays[k].span, s.start)) { raceKey = k; break; } }
        (rows[id] = rows[id] || []).push({ id, span: s, props, home, race: raceKey });
    }
    return { rows, lib, race, door, raceArrays };
}

/* ── the edit list (applied back to front so offsets stay valid) ── */
function makeEditor(src) {
    const edits = [];
    return {
        replace(start, end, text) { edits.push({ start, end, text }); },
        apply() {
            edits.sort((a, b) => b.start - a.start || b.end - a.end);
            let out = src, last = Infinity;
            for (const e of edits) {
                if (e.end > last) throw new Error(`overlapping edits at ${e.start}`);
                out = out.slice(0, e.start) + e.text + out.slice(e.end);
                last = e.start;
            }
            return out;
        },
        get count() { return edits.length; },
    };
}

function lineOf(src, pos) { let n = 1; for (let i = 0; i < pos && i < src.length; i++) if (src[i] === '\n') n++; return n; }
function indentOfLine(src, pos) { const ls = src.lastIndexOf('\n', pos - 1) + 1; const m = /^[ \t]*/.exec(src.slice(ls, pos)); return m ? m[0] : ''; }

/* Set / insert one depth-1 property on a row (or registry) literal. */
function setProp(src, ed, row, key, jsText, log) {
    const p = row.props.find(q => q.key === key);
    if (p) {
        if (src.slice(p.valStart, p.valEnd) === jsText) return false;
        ed.replace(p.valStart, p.valEnd, jsText);
        log && log(`  ${row.id || ''} ${key}: ${src.slice(p.valStart, p.valEnd)} → ${jsText}`);
        return true;
    }
    // a new key lands right after `id` (a new `families` / `upgrades` after `tier` when the row has one) — readable, never after a trailing desc
    let anchor = (key !== 'tier' && row.props.find(q => q.key === 'tier')) || row.props.find(q => q.key === 'id') || row.props[row.props.length - 1];
    if (!anchor) { ed.replace(row.span.end - 1, row.span.end - 1, ` ${jsKey(key)}: ${jsText} `); return true; }
    const hasComma = src[anchor.end - 1] === ',';
    const after = anchor.end;
    const nextIsNewline = /^[ \t]*\r?\n/.test(src.slice(after, after + 8));
    if (!hasComma) {
        ed.replace(anchor.valEnd, anchor.valEnd, `, ${jsKey(key)}: ${jsText}`);
    } else if (nextIsNewline) {
        const nl = src.indexOf('\n', after);
        const ind = indentOfLine(src, src.slice(nl + 1).search(/\S/) + nl + 1) || indentOfLine(src, anchor.keyStart);
        ed.replace(after, after, `\n${ind}${jsKey(key)}: ${jsText},`);
    } else {
        ed.replace(after, after, ` ${jsKey(key)}: ${jsText},`);
    }
    log && log(`  ${row.id || ''} +${key}: ${jsText}`);
    return true;
}
function delProp(src, ed, row, key, log) {
    const p = row.props.find(q => q.key === key);
    if (!p) return false;
    let start = p.keyStart, end = p.end;
    // eat the whitespace before the property; a property that owns its line takes the line with it (no blank line left)
    while (start > row.span.start + 1 && /[ \t]/.test(src[start - 1])) start--;
    if (src[start - 1] === '\n' && /^[ \t]*\r?\n/.test(src.slice(end))) { start--; end = src.indexOf('\n', end); }
    if (src[p.end - 1] !== ',') {
        // last property: drop the comma of the previous one
        const prev = row.props[row.props.indexOf(p) - 1];
        if (prev && src[prev.end - 1] === ',') ed.replace(prev.end - 1, prev.end, '');
    }
    ed.replace(start, end, '');
    log && log(`  ${row.id || ''} −${key}`);
    return true;
}
function removeArrayElement(src, ed, span, log, what) {
    let start = span.start, end = span.end;
    while (start > 0 && /[ \t]/.test(src[start - 1])) start--;
    const ownsLine = src[start - 1] === '\n';
    if (src[end] === ',') end++;
    if (ownsLine) { const nl = src.indexOf('\n', end); if (nl >= 0 && /^[ \t]*$/.test(src.slice(end, nl))) end = nl; }
    ed.replace(start, end, '');
    log && log(`  removed ${what} (line ${lineOf(src, span.start)})`);
}

/* ── notes → docs/spell-notes.md ── */
function mergeNotesFile(existing, notes, libraryNotes, stamp) {
    const sections = {};
    let order = [];
    if (existing) {
        const parts = existing.split(/^## /m);
        for (const part of parts.slice(1)) {
            const nl = part.indexOf('\n');
            const id = part.slice(0, nl < 0 ? part.length : nl).trim();
            sections[id] = part.slice(nl + 1).replace(/\s+$/, '');
            order.push(id);
        }
    }
    const put = (id, text) => { if (!sections.hasOwnProperty(id)) order.push(id); sections[id] = String(text).replace(/\s+$/, ''); };
    if (libraryNotes && libraryNotes.trim()) put('_library', libraryNotes);
    for (const id of Object.keys(notes)) put(id, notes[id]);
    const head = '# Spell notes — the library\'s per-row notes, stripped from the export by bake-spell-mods.js\n\n'
        + 'Never shipped to players (SPELL_LIBRARY_PLAN.md §7 Q12). One `## <spell id>` section per row; `## _library` is the library-wide note.\n'
        + `Last bake: ${stamp}.\n\n`;
    return head + order.map(id => `## ${id}\n${sections[id]}\n`).join('\n');
}

/* ── THE BAKE ── */
function bakeSource(src, doc, D, opts) {
    opts = opts || {};
    const log = [], warn = [];
    const say = (s) => log.push(s);
    const spans = scanSpans(src);
    const T = indexRows(src, spans);
    const ed = makeEditor(src);
    const notes = {};
    const registryDecl = { families: 'const SPELL_FAMILIES = {', upgrades: 'const SPELL_UPGRADES = {', raceFamilies: 'const RACE_FAMILIES = {' };
    const touched = new Set();   // spans already edited as a whole (deleted rows) — field edits on them are skipped

    // 1. registries — row by row on the object literal (comments survive)
    for (const g of Object.keys(registryDecl)) {
        const group = doc[g] || {};
        const ids = Object.keys(group);
        if (!ids.length) continue;
        const span = tableSpan(src, spans, registryDecl[g]);
        if (!span) { warn.push(`${registryDecl[g]} not found in data.js — ${ids.length} ${g} row(s) NOT baked`); continue; }
        const reg = { id: g, span, props: objectProps(src, span) };
        for (const id of ids) {
            if (group[id] === null) { if (!delProp(src, ed, reg, id, null)) warn.push(`${g}: '${id}' is not shipped — delete ignored`); else say(`  ${g} −${id}`); continue; }
            let row = group[id];
            if (row && typeof row === 'object' && !Array.isArray(row)) {
                row = Object.assign({ id }, row);
                if (row.notes) { notes[`${g}:${id}`] = row.notes; delete row.notes; }
            }
            setProp(src, ed, reg, id, toJs(row, '    '), null);
            say(`  ${g} ${id}: ${toJs(row)}`);
        }
    }

    // 2. deletions
    for (const id of (doc.deleted || [])) {
        const rows = T.rows[id] || [];
        if (!rows.length) { warn.push(`DELETE ${id}: no literal row found (an alias or already gone)`); continue; }
        for (const r of rows) {
            if (r.home === 'shared') { warn.push(`DELETE ${id}: lives in a shared const (line ${lineOf(src, r.span.start)}) — remove it and its references by hand`); continue; }
            removeArrayElement(src, ed, r.span, say, `${id} from ${r.home}${r.race ? ' ' + r.race : ''}`);
            touched.add(r.span);
        }
        // the learn orders drop it (applyDoc does the same at runtime); other references are the user's to clear
        const learn = tableSpan(src, spans, 'const CLASS_SPELL_LEARN_ORDER = {');
        if (learn) for (const p of objectProps(src, learn)) {
            if (p.key === null) continue;
            const arr = spans.find(s => s.start === p.valStart && s.ch === '[');
            if (!arr) continue;
            const ids = objectProps(src, { start: arr.start, end: arr.end }).map(q => unquote(q.raw.replace(/,$/, '')));
            if (ids.includes(id)) { ed.replace(arr.start, arr.end, toJs(ids.filter(x => x && x !== id))); say(`  learn order ${p.key}: −${id}`); }
        }
        const refs = [];
        const re = new RegExp(`['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
        let m;
        while ((m = re.exec(src))) { const inRow = rows.some(r => within(r.span, m.index)); if (!inRow) refs.push(lineOf(src, m.index)); }
        if (refs.length) warn.push(`DELETE ${id}: still referenced at data.js line(s) ${refs.join(', ')} (RACE_TREE / shares / aliases) — clear them or npm test will say so`);
    }

    // 3. additions
    const insertRow = (text, arrSpan, what) => {
        const closing = arrSpan.end - 1;
        const ind = '        ';
        let before = closing;
        while (before > arrSpan.start && /[ \t\r\n]/.test(src[before - 1])) before--;
        const needComma = src[before - 1] !== ',' && src[before - 1] !== '[';
        ed.replace(before, before, `${needComma ? ',' : ''}\n${ind}${text},\n`);
        say(`  added ${what}`);
    };
    for (const id of Object.keys(doc.added || {})) {
        if ((doc.deleted || []).includes(id)) continue;
        const def = Object.assign({}, doc.added[id], { id });
        const home = def._home || { lib: true };
        if (def.notes) { notes[id] = def.notes; }
        if (T.rows[id]) { warn.push(`ADD ${id}: a row with this id already ships — skipped (edit it instead)`); continue; }
        if (home.race) {
            const ra = T.raceArrays[home.race];
            if (ra) insertRow(serializeRow(def, '        '), ra.span, `${id} to race ${home.race}`);
            else if (T.race) {
                const closing = T.race.end - 1;
                let before = closing; while (before > T.race.start && /\s/.test(src[before - 1])) before--;
                const needComma = src[before - 1] !== ',' && src[before - 1] !== '{';
                ed.replace(before, before, `${needComma ? ',' : ''}\n\n    ${jsStr(home.race)}: [\n        ${serializeRow(def, '        ')},\n    ],\n`);
                say(`  added ${id} to NEW race array ${home.race}`);
            } else warn.push(`ADD ${id}: RACE_ABILITIES not found`);
        } else if (T.lib) insertRow(serializeRow(def, '        '), T.lib, `${id} to SPELL_LIBRARY`);
        else warn.push(`ADD ${id}: SPELL_LIBRARY not found`);
    }

    // 4. field patches
    for (const id of Object.keys(doc.modified || {})) {
        if ((doc.deleted || []).includes(id)) continue;
        const mod = doc.modified[id];
        const rows = (T.rows[id] || []).filter(r => !touched.has(r.span));
        if (!rows.length) {
            if (doc.added && doc.added[id]) continue;   // patches on a row this same doc adds are already in the added def
            warn.push(`MODIFY ${id}: no literal row found${D && D.SPELL_BY_ID && D.SPELL_BY_ID[id] ? ' (an alias of ' + D.SPELL_BY_ID[id].id + '?)' : ''} — skipped`);
            continue;
        }
        for (const f of Object.keys(mod)) {
            if (f === 'notes') { if (mod[f]) notes[id] = mod[f]; continue; }
            if (ROW_SKIP[f] && f !== 'notes') { say(`  ${id} ${f}: derived / editor-only — not baked`); continue; }
            for (const r of rows) {
                if (mod[f] === null) delProp(src, ed, r, f, say);
                else setProp(src, ed, r, f, toJs(mod[f], indentOfLine(src, r.span.start) + '  '), say);
            }
        }
    }

    // 5. learn orders
    const learn = tableSpan(src, spans, 'const CLASS_SPELL_LEARN_ORDER = {');
    for (const job of Object.keys(doc.learnsets || {})) {
        if (!learn) { warn.push('CLASS_SPELL_LEARN_ORDER not found'); break; }
        const reg = { id: 'learn', span: learn, props: objectProps(src, learn) };
        setProp(src, ed, reg, job, toJs(doc.learnsets[job]), null);
        say(`  learn order ${job}: [${doc.learnsets[job].join(', ')}]`);
    }

    // 6. race movepools → the shares table / removed literals
    const sharesAt = src.indexOf('for (const [race, ids] of [');
    const sharesSpan = sharesAt >= 0 ? spans.find(s => s.start === sharesAt + 'for (const [race, ids] of ['.length - 1) : null;
    for (const race of Object.keys(doc.raceAbilities || {})) {
        const want = doc.raceAbilities[race];
        const have = (D && D.RACE_ABILITIES && D.RACE_ABILITIES[race]) ? D.RACE_ABILITIES[race].map(a => a.id) : [];
        const added = want.filter(id => !have.includes(id));
        const removed = have.filter(id => !want.includes(id));
        if (!added.length && !removed.length) { if (want.join() !== have.join()) warn.push(`RACE MOVEPOOL ${race}: only the order changed — not baked (rows keep their source order)`); continue; }
        const ownLiteral = (id) => (T.rows[id] || []).find(r => r.home === 'race' && r.race === race);
        const toShare = added.filter(id => !ownLiteral(id));
        if (toShare.length) {
            if (!sharesSpan) warn.push(`RACE MOVEPOOL ${race}: shares table not found — add ${toShare.join(', ')} by hand`);
            else {
                const closing = sharesSpan.end - 1;
                let before = closing; while (before > sharesSpan.start && /\s/.test(src[before - 1])) before--;
                const needComma = src[before - 1] !== ',' && src[before - 1] !== '[';
                ed.replace(before, before, `${needComma ? ',' : ''}\n    [${jsStr(race)}, ${toJs(toShare)}],   /* baked ${opts.stamp || 'by bake-spell-mods.js'} */`);
                say(`  movepool ${race}: shares +${toShare.join(', ')}`);
            }
        }
        for (const id of removed) {
            const lit = ownLiteral(id);
            if (lit && !touched.has(lit.span)) { removeArrayElement(src, ed, lit.span, say, `${id} from race ${race} (movepool)`); touched.add(lit.span); continue; }
            // a share: drop it from the table row(s)
            if (sharesSpan) {
                const rowsInTable = spans.filter(s => s.parent === spans.indexOf(sharesSpan) && s.ch === '[');
                let done = false;
                for (const rs of rowsInTable) {
                    const txt = src.slice(rs.start, rs.end);
                    const m = /^\[\s*(['"])([^'"]+)\1\s*,\s*(\[[^\]]*\])\s*\]$/.exec(txt);
                    if (!m || m[2] !== race) continue;
                    let ids = [];
                    try { ids = JSON.parse(m[3].replace(/'/g, '"')); } catch (e) { continue; }
                    if (!ids.includes(id)) continue;
                    const left = ids.filter(x => x !== id);
                    if (left.length) ed.replace(rs.start, rs.end, `[${jsStr(race)}, ${toJs(left)}]`);
                    else removeArrayElement(src, ed, rs, null, 'share row');
                    say(`  movepool ${race}: share −${id}`); done = true;
                }
                if (!done) warn.push(`RACE MOVEPOOL ${race}: −${id} has no literal in that race and no share row — check by hand`);
            }
        }
    }

    const out = ed.apply();
    return { src: out, changes: log, warnings: warn, notes, edits: ed.count };
}

/* ── THE STAMP (Phase 0's migration): tier = spellTierOf(id) on every shipped row literal ── */
function stampTiers(src, D) {
    const spans = scanSpans(src);
    const T = indexRows(src, spans);
    const ed = makeEditor(src);
    let stamped = 0, replaced = 0, kept = 0, unknown = 0;
    for (const id of Object.keys(T.rows)) {
        const sp = D.SPELL_BY_ID[id];
        if (!sp) { unknown++; continue; }
        const tier = D.spellTierOf(id) || 1;
        for (const r of T.rows[id]) {
            const p = r.props.find(q => q.key === 'tier');
            if (p && src.slice(p.valStart, p.valEnd) === String(tier)) { kept++; continue; }
            if (p) replaced++; else stamped++;
            setProp(src, ed, r, 'tier', String(tier), null);
        }
    }
    return { src: ed.apply(), stamped, replaced, kept, unknown, rows: Object.keys(T.rows).length };
}

/* ── CLI ── */
function main(argv) {
    const args = argv.slice(2);
    const flag = (k) => { const i = args.indexOf(k); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
    const has = (k) => { const i = args.indexOf(k); if (i < 0) return false; args.splice(i, 1); return true; };
    const dataPath = path.resolve(flag('--data') || path.join(REPO_ROOT, 'data.js'));
    const outPath = path.resolve(flag('--out') || dataPath);
    const notesPath = path.resolve(flag('--notes') || path.join(REPO_ROOT, 'docs', 'spell-notes.md'));
    const dry = has('--dry-run'), noTest = has('--no-test'), stampMode = has('--stamp-tiers');
    const src = fs.readFileSync(dataPath, 'utf8');
    const D = loadGameData({ file: dataPath });
    if (stampMode) {
        const r = stampTiers(src, D);
        console.log(`[bake] --stamp-tiers: ${r.rows} row literals — ${r.stamped} stamped, ${r.replaced} legacy strings replaced, ${r.kept} already numeric, ${r.unknown} unknown ids`);
        if (!dry) fs.writeFileSync(outPath, r.src);
        else console.log('[bake] dry run — nothing written');
        return 0;
    }
    const docPath = args.find(a => !a.startsWith('--'));
    if (!docPath) { console.error('usage: node bake-spell-mods.js <export.json> [--data data.js] [--out data.js] [--notes docs/spell-notes.md] [--dry-run] [--no-test]\n       node bake-spell-mods.js --stamp-tiers'); return 2; }
    const doc = JSON.parse(fs.readFileSync(path.resolve(docPath), 'utf8'));
    if (doc.format && doc.format !== 'entropy-wars-spell-mods') { console.error('[bake] not a spell-mods export'); return 2; }
    const stamp = new Date().toISOString().slice(0, 10);
    const r = bakeSource(src, doc, D, { stamp });
    console.log(`[bake] ${docPath} → ${outPath}: ${r.edits} edit(s)`);
    for (const l of r.changes) console.log(l);
    for (const w of r.warnings) console.log('  WARN ' + w);
    const noteIds = Object.keys(r.notes);
    if (dry) { console.log('[bake] dry run — nothing written' + (noteIds.length ? ` (${noteIds.length} note(s) would land in ${path.relative(REPO_ROOT, notesPath)})` : '')); return 0; }
    fs.writeFileSync(outPath, r.src);
    if (noteIds.length || doc.notes) {
        const existing = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf8') : '';
        fs.mkdirSync(path.dirname(notesPath), { recursive: true });
        fs.writeFileSync(notesPath, mergeNotesFile(existing, r.notes, doc.notes, stamp));
        console.log(`[bake] ${noteIds.length} note(s) → ${path.relative(REPO_ROOT, notesPath)}`);
    }
    if (doc.summary && doc.summary.length) console.log('[bake] the export said:\n  ' + doc.summary.join('\n  '));
    if (!noTest) {
        console.log('[bake] npm run test:quick …');
        const t = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'test:quick'], { cwd: REPO_ROOT, stdio: 'inherit' });
        if (t.status !== 0) { console.error('[bake] test:quick FAILED — read the output above; the bake is written, fix or revert data.js'); return 1; }
    }
    console.log('[bake] done — deliver data.js (R2 + Render) and the notes file (repo)');
    return 0;
}

module.exports = { scanSpans, objectProps, indexRows, bakeSource, stampTiers, serializeRow, toJs, mergeNotesFile };

if (require.main === module) process.exit(main(process.argv));
