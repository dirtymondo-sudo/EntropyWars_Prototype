// debrief-safety.test.js — THE DEBRIEF NEVER HALF-BUILDS (2026-09-25). The user: "the victory/defeat screen is missing all
// the leveling up and achievements and buttons … I get soft locked after a battle" (sometimes). Every card of the result
// screen fails on its own, the screen always shows with a way out, and a second fill of a showing screen is dropped.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const BT = fs.readFileSync(path.join(__dirname, 'battle.js'), 'utf8');

test('the result screen: the wrapper shows the overlay and its way out whatever the fill did', () => {
    const w = BT.slice(BT.indexOf('        function showResultOverlay() {'), BT.indexOf('        function _showResultOverlayBody() {'));
    assert.ok(w.length > 0 && w.length < 3000, 'the wrapper sits right before the body');
    assert.match(w, /try \{ _showResultOverlayBody\(\); \}\s*catch \(e\) \{ _vicFail\('the result screen', e\); \}/);
    assert.match(w, /resultOverlay\.classList\.remove\('hidden'\)/, 'the overlay shows');
    assert.match(w, /_encounterResultButtons\(\)\) && typeof _restoreResultOverlayButtons === 'function'\) _restoreResultOverlayButtons\(\);/, 'an empty bar gets the encounter button, else the standard bar');
    assert.match(w, /_vicShownKey === key && resultOverlay && !resultOverlay\.classList\.contains\('hidden'\)/, 'a second fill of the showing screen is dropped');
});

test('the result screen: every card fails on its own', () => {
    const body = BT.slice(BT.indexOf('        function _showResultOverlayBody() {'), BT.indexOf('        function _vicPortrait(u) {'));
    for (const label of ['the 2D lineup', 'the MVP tag', 'the fact line', 'the field report', 'performance', 'honours', 'rewards + achievements', 'the command bar', 'hazard pay', 'the sheet tabs'])
        assert.ok(body.indexOf(`_vicFail('${label}', e)`) > 0, label);
    assert.match(BT, /function _vicFail\(label, e\) \{ console\.error\('\[Debrief\] '/);
});
