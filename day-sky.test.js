/* THE DAY SKY (2026-09-21 — the user: "downtown's buildings look lit for daytime but the sky is still
   purple / dark; definitely need areas that are sunny and blue"). The dome shader was only ever a
   deep-space gradient; `env.day` on a map row / a shell's sky now lays a daylight atmosphere over it
   (three-renderer.js _envDomeFS), fed by the battle's _updateEnvironment and the HQ's _hqTickSky.
   These guards keep the uniform, the shader branch, both feeds and the daylight rows in step. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const renderer = read('three-renderer.js');

test('the dome has a day branch on its own uniforms', () => {
    assert.ok(/uniform float uSkyDay; uniform float uSkyClouds;/.test(renderer), 'the two uniforms are declared in _ENV_COMMON');
    assert.ok(/uSkyDay: \{ value: 0\.0 \},\s*uSkyClouds: \{ value: 0\.0 \}/.test(renderer), 'initialised at 0 (the cosmic dome as before)');
    assert.ok(/float dayK=clamp\(uSkyDay,0\.0,1\.0\)\*\(1\.0-night\*0\.9\)\*\(1\.0-uSkyAmt\*0\.7\);/.test(renderer), 'the day yields to the night cycle and to a sky event');
    assert.ok(/vec3 zen=vec3\(0\.17,0\.42,0\.88\); vec3 hor=vec3\(0\.58,0\.72,0\.92\);/.test(renderer), 'a blue zenith to a pale horizon (2026-09-22: a notch deeper — the user: "the city sky is too bright")');
    assert.ok(/float dcl=clamp\(uSkyClouds\+wStorm\*0\.85,0\.0,1\.0\);/.test(renderer), 'a storm is a full overcast');
    const dayAt = renderer.indexOf('float dayK=clamp(uSkyDay'), tintAt = renderer.indexOf("'  if(uMapTintAmt>0.001){ float ml=dot(col");
    assert.ok(dayAt > 0 && tintAt > dayAt, 'the day is laid after the tone map and before the map tint');
});

test('both feeds write the uniforms', () => {
    assert.ok(/S\.mapDay \+= \(\(\(me && me\.day\) \|\| 0\) - S\.mapDay\) \* k;/.test(renderer) && /_envUni\.uSkyDay\.value = S\.mapDay; _envUni\.uSkyClouds\.value = S\.mapClouds;/.test(renderer), 'the battle eases env.day / env.clouds in');
    assert.ok(/mapDay: 0, mapClouds: 0 \}/.test(renderer), 'the smoothing record starts at 0');
    assert.ok(/u\.uSkyDay\.value = env\.day \|\| 0; u\.uSkyClouds\.value = env\.clouds \|\| 0;/.test(renderer), 'the HQ tick reads the room sky');
});

test('the daylight rows carry day + clouds, and every hand-copied shell of them too', () => {
    const D = loadGameData();
    const META = D.EW_MAP_META;
    const DAY = ['prebuilt_downtown', 'prebuilt_stadium', 'prebuilt_shasta', 'prebuilt_giza', 'prebuilt_heaven', 'prebuilt_babel', 'prebuilt_olympus', 'prebuilt_antarctica', 'prebuilt_vatican', 'prebuilt_gobekli', 'prebuilt_flatlands', 'prebuilt_bermuda'];
    for (const id of DAY) {
        const m = META.find(r => r.id === id);
        assert.ok(m && m.env && m.env.day === 1 && typeof m.env.clouds === 'number', id + ': day: 1 + clouds');
    }
    const NIGHT = ['prebuilt_cyberpunk', 'prebuilt_strip', 'prebuilt_camelot', 'prebuilt_hell', 'prebuilt_moon', 'prebuilt_area51', 'prebuilt_haunted'];
    for (const id of NIGHT) { const m = META.find(r => r.id === id); assert.ok(m && !(m.env && m.env.day), id + ': stays the night / the void'); }
    /* a shell that copies a daylight row by hand carries its day (a test here fails BEFORE a part reads purple) */
    const byTint = {}; META.forEach(m => { if (m.env && m.env.day) byTint[m.env.tint] = m.id; });
    const missing = [];
    Object.keys(D.DOOR_HQ.rooms).forEach(id => {
        const S = D.DOOR_HQ.rooms[id].shell, sky = S && S.sky;
        if (!sky || sky.night) return;
        if (byTint[sky.tint] && !sky.day) missing.push(id + ' (' + byTint[sky.tint] + ')');
    });
    assert.deepStrictEqual(missing, [], 'a room wearing a daylight row\'s tint without its day: ' + missing.join(', '));
    assert.ok(D.hqCityShell({}).sky.day === 1 && D.hqCityShell({ neon: true }).sky.day == null, 'the plain city is a day, the neon city a night');
});
