#!/usr/bin/env node
/* bake-cutscenes.js (2026-11-15) — bakes a CUTSCENE EDITOR export (the game: Settings > Developer > Open Cutscene Editor >
   EXPORT FOR CLAUDE; data.js sceneEdExport) into data.js STORY_CUTSCENES.
     node bake-cutscenes.js <Entropy_Wars_Cutscene_Notes_….json> [--dry-run]
   It writes HIS CHANGED LINES word for word (the `text:` literal of that scene's row, found by its shipped words), and
   PRINTS everything a person has to do by hand: cut lines, added lines (each needs its own shot) and every note.
   A line it cannot place exactly once is listed, never guessed. Once a line is baked, the editor drops his edit by itself
   (the edit's `was` no longer matches the row). Repo-only tooling; notes: docs/notes/story-party-progression.md
   "THE CUTSCENE EDITOR". */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), dry = args.includes('--dry-run'), file = args.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: node bake-cutscenes.js <export.json> [--dry-run]'); process.exit(1); }
const X = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!X || X.kind !== 'entropy_wars_cutscene_notes' || !Array.isArray(X.scenes)) { console.error('not a cutscene editor export: ' + file); process.exit(1); }
const DATA = path.join(__dirname, 'data.js');
let src = fs.readFileSync(DATA, 'utf8');
const lit = (t, q) => q + t.replace(/\\/g, '\\\\').split(q).join('\\' + q) + q;
const best = (t) => lit(t, t.includes("'") && !t.includes('"') ? '"' : "'");
/* the text of one scene's row: from its opening to the next row (or storyCutsceneShipped) */
function block(id) {
    let a = src.indexOf('\nSTORY_CUTSCENES.' + id + ' = {');
    if (a < 0) { const m = new RegExp('\\n {4}' + id + ': \\{').exec(src); a = m ? m.index : -1; }
    if (a < 0) return null;
    const ends = ['\nSTORY_CUTSCENES.', '\nfunction storyCutsceneShipped', '\n/* '].map(e => src.indexOf(e, a + 10)).filter(i => i > 0);
    return { a, b: Math.min.apply(null, ends) };
}
let baked = 0; const todo = [], failed = [];
X.scenes.forEach(sc => {
    if (sc.note) todo.push('[' + sc.title + '] WHOLE SCENE: ' + sc.note);
    (sc.shots || []).forEach(s => {
        const at = '[' + sc.title + ' · shot ' + s.shot + '] ';
        if (s.line) {
            const B = block(sc.id);
            const hits = [];
            if (B) ['\'', '"'].forEach(q => { const needle = 'text: ' + lit(s.line.was, q); let i = src.indexOf(needle, B.a); while (i >= 0 && i < B.b) { hits.push({ i, len: needle.length }); i = src.indexOf(needle, i + 1); } });
            if (hits.length !== 1) failed.push(at + 'the line "' + s.line.was + '" was found ' + hits.length + ' times in the row; change it by hand to: "' + s.line.now + '"');
            else { src = src.slice(0, hits[0].i) + 'text: ' + best(s.line.now) + src.slice(hits[0].i + hits[0].len); baked++; console.log('baked  ' + at + '"' + s.line.was + '"  ->  "' + s.line.now + '"'); }
        }
        if (s.cut) todo.push(at + 'CUT THE LINE: ' + (s.shipped ? s.shipped.who + ': "' + s.shipped.text + '"' : ''));
        (s.add || []).forEach(a => todo.push(at + 'ADD A LINE AFTER IT (give it a shot): ' + a.who + ': "' + a.text + '"'));
        (s.notes || []).forEach(n => todo.push(at + 'NOTE [' + n.tag + '] ' + n.text + '   (' + s.is + '; camera ' + JSON.stringify(s.camera) + (s.cameraTo ? ' to ' + JSON.stringify(s.cameraTo) : '') + ')'));
    });
});
if (baked && !dry) { fs.writeFileSync(DATA, src); execFileSync(process.execPath, ['--check', DATA], { stdio: 'inherit' }); }
console.log('\n' + baked + ' line(s) ' + (dry ? 'would be baked (dry run)' : 'baked into data.js'));
if (failed.length) { console.log('\nNOT BAKED, BY HAND:'); failed.forEach(f => console.log('  ' + f)); }
if (todo.length) { console.log('\nTO DO BY HAND (' + todo.length + '):'); todo.forEach(t => console.log('  ' + t)); }
