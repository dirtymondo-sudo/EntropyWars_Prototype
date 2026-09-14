/* THE MAP-BUILDER BUILDINGS IN THE LANDSCAPE + THE FOLIAGE EVERYWHERE (2026-09-14)
   Source guards for three-renderer.js:
   - building_1..8 stand in the urban settings (cyberpunk / the strip /
     downtown) and on every `city` world rim as _nrSpriteBuilding prisms
   - the world rim's tree line and the site room's board trees are the
     foliage OBJ models (_nrTree), never the procedural trunk + sphere
   - Bohemian Grove's redwoods are foliage models
   - the async fills (foliage swap, sprite trim) join the world haze */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
function block(startMarker, len) { const i = TR.indexOf(startMarker); assert.ok(i >= 0, 'source has ' + startMarker); return TR.slice(i, i + (len || 6000)); }

test('the sprite-building kit: building_1..8, the prism, the street, the trim poll', () => {
    assert.match(TR, /var _NR_BUILDING_KEYS = \['building_1', 'building_2', 'building_3', 'building_4', 'building_5', 'building_6', 'building_7', 'building_8'\];/);
    const b = block('function _nrSpriteBuilding(K, key, x, z, o) {', 7000);
    assert.match(b, /window\._alphaScanSprite\(oSpr\)/, 'the prism asks for the sprite alpha trim like the board');
    assert.match(b, /getObjectTexture\(key\)/, 'the faces wear the object sprite');
    assert.match(b, /for \(var st = 0; st < stack; st\+\+\)/, 'a tower stacks whole-sprite storeys (no RepeatWrapping on NPOT sprites)');
    assert.doesNotMatch(b, /RepeatWrapping/, 'no RepeatWrapping on the sprite faces');
    assert.match(b, /_nrPending\.push\(\{ g: g, spr: oSpr, fill: build \}\)/, 'the prism is rebuilt when the trim lands');
    assert.match(b, /_nrInjectWorld\(K, g\)/, 'a rim prism joins the world haze on every (re)build');
    assert.ok(TR.includes('function _nrSpriteBlocks(K, o) {'), 'the street walk exists');
    const poll = block('function _nrPollPending() {', 1600);
    assert.match(poll, /if \(pe\.spr\) \{/, 'the poll handles the sprite-trim entries');
    assert.match(poll, /else if \(!pe\.spr\._trimScanning\) _nrPending\.splice\(pi, 1\);/, 'a failed scan leaves the untrimmed prism standing');
});

test('the urban settings stand the map-builder buildings, not the neon boxes', () => {
    for (const key of ['cyberpunk', 'strip', 'downtown']) {
        const nb = block('_NR_BUILDERS.' + key + ' = function (group, ctx) {', 5000);
        const body = nb.slice(0, nb.indexOf('\n    };') + 1);
        assert.match(body, /_nrSpriteBlocks\(K, \{/, key + ' uses _nrSpriteBlocks');
        assert.doesNotMatch(body, /_nrBlocks\(K, \{/, key + ' no longer builds the procedural blocks');
    }
});

test('the world rim: the city is the map-builder buildings, the tree line is the foliage models', () => {
    const rim = block('var _WD_RIM = {', 12000);
    const city = rim.slice(rim.indexOf('city: function (K, s, c) {'), rim.indexOf('spires: function'));
    assert.match(city, /_nrSpriteBuilding\(K, keys\[\(rng\(\) \* keys\.length\) \| 0\], x, z, \{/, 'the skyline is _nrSpriteBuilding prisms');
    assert.match(city, /s\.proc !== true/, 'proc: true keeps the old boxes as an opt-in');
    const trees = rim.slice(rim.indexOf('trees: function (K, s, c) {'), rim.indexOf('town: function'));
    assert.match(trees, /_nrTree\(K, kinds\[\(rng\(\) \* kinds\.length\) \| 0\], \{ h: h \}\)/, 'the tree line plants _nrTree (the OBJ)');
    assert.doesNotMatch(trees, /_nrTreeProc\(/, 'no procedural rim trees');
    assert.match(TR, /K\._wdFog = \{ r0: fogR0, r1: fogR1 \};/, '_worldBuild hands the rims the haze radii for late fills');
    const nt = block('function _nrTree(K, kind, o) {', 2600);
    assert.match(nt, /_nrInjectWorld\(K, model\);/, 'a swapped-in rim tree joins the haze');
});

test('Bohemian Grove: the redwoods and the room\'s board trees are the foliage models', () => {
    const bg = block('_NR_BUILDERS.bohemian_grove = function (group, ctx) {', 4000);
    const body = bg.slice(0, bg.indexOf('\n    };') + 1);
    assert.match(body, /_nrTree\(K, rng\(\) < 0\.5 \? 'tree' : 'tree_4', \{ h: 4\.2 \+ rng\(\) \* 2\.0 \}\)/, 'the redwoods are _nrTree');
    assert.doesNotMatch(body, /new THREE\.SphereGeometry\(ts \* \(0\.9 \+ rng\(\) \* 0\.5\), 8, 6\)/, 'no sphere canopies');
    const sb = block('function _hqBuildSiteBoard(room) {', 40000);
    assert.match(sb, /var t = _nrTree\(treeKit, o\.kind, \{ h: 1\.9 \}\);/, 'the site board plants _nrTree per board tree');
    assert.match(TR, /function _hqTickWorld\(dt, now\) \{[\s\S]*?\n\s*_nrPollPending\(\);/, 'the HQ loop polls the foliage swaps unconditionally');
});
