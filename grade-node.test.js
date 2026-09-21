/* THE GRADE NODE (2026-09-21) — the ONE letter-grade widget at every stat
   display site: data.js statGradeNode / statGradeNodeHtml (the gauge from
   the bottom clockwise + the grade's gradient face + the white letter),
   the `.ew-grade` CSS, and the five sites that draw it. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGameData } = require('./load-data.js');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

test('data.js: the node, its share of the ring, the markup', () => {
    const D = loadGameData();
    assert.equal(D.statGrade('atk', 89), 'S', 'the ruler: S from 81');
    const n = D.statGradeNode('atk', 70);
    assert.equal(n.g, 'A'); assert.equal(n.pct, 70); assert.equal(n.cls, 'ew-grade grade-a');
    assert.equal(D.statGradePct('hp', 700), 100, 'HP fills against its S band');
    assert.equal(D.statGradePct('hp', 350), 50);
    assert.equal(D.statGradePct('spd', 140), 100, 'capped');
    assert.equal(D.statGradeNode('move', 4), null, 'MOV is ungraded');
    assert.equal(D.statGradeNodeHtml('move', 4), '');
    const html = D.statGradeNodeHtml('def', 15, { size: 'lg', label: 'DEF' });
    assert.ok(html.includes('class="ew-grade grade-f lg"'), html);
    assert.ok(html.includes('--pct:15') && html.includes('<i>F</i>') && html.includes('DEF GRADE F'));
    assert.equal(D.statGradeChipHtml('def', 15), D.statGradeNodeHtml('def', 15), 'the old chip name is the node');
    for (const g of ['S', 'A', 'B', 'C', 'F']) assert.ok(D.STAT_GRADE_FACE[g] && D.STAT_GRADE_COLORS[g], g);
});

test('the CSS: the ring is a conic gradient FROM THE BOTTOM (180deg), one face per grade, the chip is gone', () => {
    const css = read('styles-base.css');
    assert.ok(css.includes('.ew-grade {'), 'the node block');
    assert.ok(css.includes('conic-gradient(from 180deg, var(--gc) calc(var(--pct) * 1%)'), 'the gauge fills from 6 o\'clock clockwise');
    for (const g of ['s', 'a', 'b', 'c', 'f']) assert.ok(css.includes('.ew-grade.grade-' + g + ' {'), 'face ' + g);
    assert.ok(css.includes('.ew-grade.sm {') && css.includes('.ew-grade.lg {'), 'the two sizes');
    assert.ok(!/\.stat-grade\s*\{/.test(css), 'the old chip CSS is gone');
});

test('every display site draws the node', () => {
    const pb = read('party-builder.js');
    assert.ok(pb.includes('window.statGradeNode(statKey, val)'), 'the forge GradeChip reads statGradeNode');
    assert.ok(pb.includes("className: 'pb-grade-ring ' + n.cls"), 'the forge node wears .ew-grade');
    const hud = read('hud.js');
    assert.ok(hud.includes("window.statGradeNode(c.g, c.v)") && hud.includes("className: n.cls + ' sm'"), 'the battle quick stats');
    assert.ok(!hud.includes("'stat-grade grade-'"), 'no chip left in hud.js');
    const ui = read('ui.js');
    assert.equal((ui.match(/statGradeNodeHtml\(gradeKey, val, \{ label \}\)/g) || []).length, 2, 'the inspect card + the codex / shop dossier');
    const map = read('map.js');
    assert.ok(map.includes("window.statGradeNodeHtml(gradeKey, val, { size: 'lg', label })"), 'the pause menu party sheet');
    for (const k of ["'atk')", "'int')", "'def')", "'mdef')", "'spd')", "'awr')"]) assert.ok(map.includes(", null, " + k), 'the sheet grades ' + k);
});
