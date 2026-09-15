// THE PROMOTION LADDER + THE STABILIZATION CHECKLIST (2026-09-15 rev 15).
// Clearance is field work now: doorClearance reads the HIGHER of the story
// number and hqFieldClearance (stabilized thresholds + Keys against
// HQ_PROMOTION); hqRankProgress is the one "how do I rank up" read;
// hqSiteChecklist is the one "what all needs to be done" read behind
// match-select, the threshold panel, the console and the battle marker.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data.js');

const D = loadGameData(), HQ = D.DOOR_HQ;
const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const site = HQ.sectors[Object.keys(HQ.sectors).find(k => !HQ.sectors[k].locked)].maps[0];
const conds = HQ.masteryConditions;
const stabilize = (prog, ids) => { ids.forEach(id => conds.forEach(c => { prog.unlocked['site:' + id + ':' + c] = 1; })); return prog; };
const allSites = Object.keys(HQ.sectors).reduce((a, k) => a.concat(HQ.sectors[k].maps), []);
const prof = (n, keys, story) => {
    const p = { door: { clearance: story || 1, hq: { keys: keys | 0 } }, progress: { unlocked: {}, counters: {} } };
    stabilize(p.progress, allSites.slice(0, n));
    return p;
};

test('HQ_PROMOTION: six rungs, monotonic, L1 asks nothing, every rung has a title on the ladder', () => {
    assert.equal(D.HQ_PROMOTION.length, D.DOOR_TEXT.CLEARANCE.length);
    let ps = -1, pk = -1;
    D.HQ_PROMOTION.forEach((r, i) => {
        assert.equal(r.level, i + 1);
        assert.ok(r.stabilized >= ps && r.keys >= pk, 'rung ' + r.level + ' never asks less than the one below');
        ps = r.stabilized; pk = r.keys;
    });
    assert.equal(D.HQ_PROMOTION[0].stabilized, 0); assert.equal(D.HQ_PROMOTION[0].keys, 0);
    assert.ok(D.HQ_PROMOTION[5].stabilized <= allSites.length, 'THE DOORMAN is reachable on the sites that exist');
});

test('doorClearance climbs with the field record; the story number still counts; the field never demotes', () => {
    assert.equal(D.doorClearance(prof(0, 0)).level, 1, 'a recruit is a DOORMAT');
    assert.equal(D.doorClearance(prof(1, 0)).level, 2, 'one stabilized threshold = DOORSTOP');
    assert.equal(D.doorClearance(prof(3, 0)).level, 2, 'KNOCKER also wants the Keys');
    assert.equal(D.doorClearance(prof(3, 12)).level, 3);
    assert.equal(D.doorClearance(prof(6, 24)).level, 4, 'KEYHOLDER');
    assert.equal(D.doorClearance(prof(12, 48)).level, 5);
    assert.equal(D.doorClearance(prof(20, 96)).title, 'THE DOORMAN');
    assert.equal(D.doorClearance(prof(0, 999, 5)).level, 5, 'the story hook (window._doorPromote) still promotes');
    assert.equal(D.doorClearance(prof(20, 96, 2)).level, 6, 'the higher of the two');
    assert.equal(D.doorClearance(null).level, 1);
    assert.equal(D.doorClearance({ door: { clearance: 6 } }).title, 'THE DOORMAN');
});

test('hqRankProgress: the rung, the next one, what is short, the rows, a note', () => {
    const rp = D.hqRankProgress(prof(1, 5));
    assert.equal(rp.level, 2); assert.equal(rp.next.level, 3); assert.equal(rp.stabilized, 1); assert.equal(rp.keys, 5);
    assert.equal(rp.total, allSites.length);
    assert.deepEqual(rp.missing.map(m => m.what + ':' + m.short).join(','), 'stabilized:2,keys:7');
    assert.equal(rp.met, false); assert.equal(rp.rows.length, 6); assert.ok(rp.rows[1].current);
    assert.ok(/stabilize/i.test(rp.note));
    const top = D.hqRankProgress(prof(20, 96));
    assert.equal(top.next, null); assert.equal(top.missing.length, 0);
    const met = D.hqRankProgress(prof(0, 0, 1));
    assert.equal(met.next.level, 2); assert.equal(met.missing.length, 1);
});

test('hqSiteChecklist: one row per win condition with the tick, the how and the modes; the Δ id resolves to the site', () => {
    const p = prof(0, 0);
    p.progress.unlocked['site:' + site + ':wipeout'] = 1;
    const modes = { arena: { label: 'Arena', winConditions: ['tower_destroyed', 'hourglasses_collected', 'wipeout'], keysToWin: 3, keySpawnCount: 5 },
                    tdm: { label: 'Team Deathmatch', winConditions: ['most_kills', 'wipeout'] }, dungeon: { label: 'MD', winConditions: ['md_run', 'wipeout'] } };
    const ck = D.hqSiteChecklist(site + '_delta', p, { modes });
    assert.equal(ck.site, site); assert.equal(ck.total, conds.length); assert.equal(ck.done, 1); assert.equal(ck.mastered, false);
    assert.equal(ck.rows.length, conds.length);
    const w = ck.rows.find(r => r.cond === 'wipeout'), t = ck.rows.find(r => r.cond === 'tower_destroyed'), k = ck.rows.find(r => r.cond === 'hourglasses_collected');
    assert.ok(w.done && !t.done && !k.done);
    assert.equal(w.modes.join(','), 'Arena,Team Deathmatch', 'the dungeon never files a site');
    assert.equal(t.modes.join(','), 'Arena'); assert.equal(k.modes.join(','), 'Arena');
    assert.ok(/3 of the 5 Keys/.test(k.how), 'the Keys row states the real numbers: ' + k.how);
    assert.ok(/Cube/.test(t.how)); assert.ok(/enemy/i.test(w.how));
    ck.rows.forEach(r => { assert.ok(r.name && r.label); });
    assert.ok(/round cap/.test(ck.note));
    const done = D.hqSiteChecklist(site, prof(1, 0));
    assert.equal(done.mastered, true); assert.ok(/STABILIZED/.test(done.note));
    const bare = D.hqSiteChecklist(site, null);
    assert.equal(bare.done, 0); assert.ok(bare.rows.every(r => r.modes.length > 0), 'no modes table → the fallback lists');
});

test('THE DOOR GUN IS STANDARD ISSUE: hqPortalStatus reports it issued for a recruit', () => {
    assert.equal(D.HQ_PORTAL_RULES.free, true);
    assert.equal(D.hqPortalStatus(prof(0, 0)).issued, true);
});

test('THE READERS: match-select, the threshold panel (= the console + the marker), the officer sheet and the gate text read the one checklist / the one ladder', () => {
    const ms = src('match-select.js'), map = src('map.js'), css = src('styles-base.css');
    assert.ok(ms.includes('window.hqSiteChecklist(siteId, profile, { modes: multiplayerModes })'), 'match-select renders hqSiteChecklist');
    assert.ok(ms.includes("h(SiteChecks, { siteId: siteId, multiplayerModes: multiplayerModes })") && !ms.includes("variant === 'site' && h(SiteChecks"), 'the checklist shows on every variant');
    assert.ok(ms.includes('window.hqRankProgress(profile)'), 'match-select states the next rung');
    assert.ok(map.includes('function _hqChecklistHtml(id, profile)') && map.includes('html += _hqChecklistHtml(id, profile)'), 'the threshold panel renders the checklist');
    assert.ok(map.includes("let html = _hqThresholdPanelHtml({ kind: 'door', id: door.id"), 'the crossing console (and the battle marker) render the threshold panel');
    assert.ok(map.includes('window.hqRankProgress(profile)') && map.includes('window.HQ_PROMOTION'), 'the officer sheet + the gate text read the ladder');
    assert.ok(css.includes('.ms-tty-check ') && css.includes('.hq-checklist'), 'the CSS');
});
