/* THE EARNED DOORS + THE ROSTER LOCK (2026-09-20)
   The user: no door in DOOR HQ leads straight to a battle site (Room 64 excepted) until the
   site is STABILIZED (every win condition filed from inside it) — then Otto builds its
   threshold in the ring. And the roster is LOCKED outside online play / the classic VS CPU
   / Room 64's range: you field what you own. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData();
const g = name => vm.runInContext(name, D);
const MP = fs.readFileSync(__dirname + '/map.js', 'utf8');
const TR = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');
const MS = fs.readFileSync(__dirname + '/match-select.js', 'utf8');
const UI = fs.readFileSync(__dirname + '/ui.js', 'utf8');
const SV = fs.readFileSync(__dirname + '/server.js', 'utf8');
const conds = D.DOOR_HQ.masteryConditions;
const mastered = (ids) => { const un = {}; ids.forEach(id => conds.forEach(c => { un['site:' + id + ':' + c] = true; })); return { username: 'MONDO', account: { gold: 0, unlockedUnits: [] }, door: { clearance: 1, hq: {} }, progress: { v: 2, unlocked: un } }; };

test('THE RULE: a threshold is earned only for a stabilized site; Room 64 is free; every other door is earned', () => {
    const fresh = mastered([]);
    assert.equal(g('hqSiteEarned')('prebuilt_training', fresh), true, 'Room 64 is the exception');
    assert.equal(g('hqSiteEarned')('prebuilt_moon', fresh), false, 'no door straight to the moon');
    assert.equal(g('hqSiteEarned')('prebuilt_moon_delta', fresh), false, 'the Δ id reads its site');
    assert.equal(g('hqSiteEarned')('prebuilt_moon', null), false, 'no profile = nothing earned');
    const p = mastered(['prebuilt_moon']);
    assert.equal(g('hqSiteEarned')('prebuilt_moon', p), true, 'every win condition on file = earned');
    const two = { progress: { v: 2, unlocked: { ['site:prebuilt_moon:' + conds[0]]: true, ['site:prebuilt_moon:' + conds[1]]: true } } };
    assert.equal(g('hqSiteEarned')('prebuilt_moon', two), false, 'two of three is not stabilized');
    assert.equal(g('hqDoorEarned')({ action: { room: 'medical' } }, fresh), true, 'a room door is never gated by this rule');
    assert.equal(g('hqDoorEarned')({ action: { mission: 'prebuilt_mars' } }, fresh), false);
    assert.ok(g('hqThresholdSites')().length >= 30 && g('hqThresholdSites')().indexOf('prebuilt_training') < 0, 'the thresholds are the bays\' maps; Room 64 has none');
});

test('THE APPLY: every threshold row in the rings is hidden for a fresh officer, un-hidden once earned, the free site never hidden; the flag is the renderer\'s and the panels\' read', () => {
    const rooms = D.DOOR_HQ.rooms;
    const thresholds = [];
    Object.keys(rooms).forEach(rid => (rooms[rid].doors || []).forEach(d => { if (d && d.action && d.action.mission) thresholds.push({ rid, d }); }));
    assert.ok(thresholds.length >= 30, 'the rings carry the thresholds');
    const r0 = g('hqApplyEarnedDoors')(mastered([]));
    assert.equal(r0.hidden.length, thresholds.length, 'a fresh officer sees no threshold');
    assert.ok(thresholds.every(t => t.d.hidden === true));
    const r1 = g('hqApplyEarnedDoors')(mastered(['prebuilt_moon', 'prebuilt_haunted']));
    const moon = thresholds.filter(t => t.d.action.mission === 'prebuilt_moon');
    assert.ok(moon.length && moon.every(t => !t.d.hidden), 'the moon\'s threshold stands once stabilized');
    assert.equal(r1.earned.length, thresholds.filter(t => ['prebuilt_moon', 'prebuilt_haunted'].includes(t.d.action.mission)).length);
    D.window.EW_HQ_ALL_DOORS = true;
    const r2 = g('hqApplyEarnedDoors')(mastered([]));
    assert.equal(r2.hidden.length, 0, 'the dev switch stands every threshold');
    D.window.EW_HQ_ALL_DOORS = false;
    g('hqApplyEarnedDoors')(mastered([]));
    /* the renderer builds nothing for a hidden row; the entry applies the flags before the room builds; the panels + the chart read the rule */
    assert.ok(/if \(door\.hidden\) return;/.test(TR), 'three-renderer _hqBuildDoors skips a hidden threshold');
    assert.ok(/window\.hqApplyEarnedDoors\(_hqProfile\(\)\)/.test(MP), '_hqEnter applies the flags');
    assert.ok(/_hqCheckEarnedDoors\(profile\)/.test(MP) && /OTTO HAS BUILT A DOOR/.test(MP), 'the ceremony');
    assert.ok(/earnedIds = sec\.maps\.filter/.test(MP), 'the bay door\'s panel lists earned thresholds only');
    assert.ok(/st-uncharted/.test(MP) && /NO DOOR YET/.test(MP), 'the star chart\'s three states');
    assert.ok(/o\.variant !== 'full' && typeof window\.hqSiteEarned === 'function'/.test(MP) && /hereSite !== site/.test(MP), '_hqLaunchMission refuses a wild site from the hall, never from inside it');
    assert.ok(/allowSites/.test(MS) && /pre\.allow/.test(MS), 'the desk deals only allowed sites');
    assert.ok(/window\.hqThresholdSites\(\)\.filter\(id => window\.hqSiteEarned\(id, _hqProfile\(\)\)\)/.test(MP), 'DISPATCH\'s desk deals earned sites');
});

test('THE CEREMONY: hqEarnedDoorsNew lists the stabilized sites not yet stamped; the stamp writes door.hq.earned once', () => {
    const p = mastered(['prebuilt_moon', 'prebuilt_mars']);
    const fresh = g('hqEarnedDoorsNew')(p);
    assert.deepEqual(JSON.parse(JSON.stringify(fresh)).sort(), ['prebuilt_mars', 'prebuilt_moon']);
    const r = g('hqEarnedDoorsStamp')(p, fresh);
    assert.equal(r.ok, true); assert.equal(r.stamped.length, 2);
    assert.ok(p.door.hq.earned.prebuilt_moon && p.door.hq.earned.prebuilt_mars);
    assert.equal(g('hqEarnedDoorsNew')(p).length, 0, 'stamped once');
    assert.equal(g('hqEarnedDoorsNew')(mastered([])).length, 0);
});

test('THE MAP: an unearned threshold is a secret edge — no ? behind it, no leg until both rooms are stood in; the chart names only what is charted', () => {
    const p = mastered([]);
    const G = g('hqMapGraph')();
    const thr = G.edges.filter(e => e.threshold);
    assert.ok(thr.length >= 30, 'the map graph carries the threshold on the edge');
    const ring = thr[0].a.indexOf('ring_') === 0 ? thr[0].a : thr[0].b;
    const far = thr[0].a === ring ? thr[0].b : thr[0].a;
    const seen = { foyer: '2026-09-20', central_egress: '2026-09-20' }; seen[ring] = '2026-09-20';
    const M = g('hqMapModel')(p, ring, { seen });
    assert.ok(!M.nodes.some(n => n.id === far), 'the site behind an unbuilt threshold is not a question mark');
    assert.ok(!M.edges.some(e => e.key === thr[0].key), 'no leg through an unbuilt threshold');
    const site = thr[0].threshold;
    const M2 = g('hqMapModel')(mastered([site]), ring, { seen });
    assert.ok(M2.nodes.some(n => n.id === far && n.st === 'q'), 'once Otto built the door the site is a ? behind it');
    const W = g('hqWorldOverview')(p, 'central_egress', { seen });
    /* a site joined to the building ONLY by bay thresholds (Mars, the Moon, Saturn) is no question; one behind a facility SEAM (the natatorium's bilge → the Dutchman, the barbershop's mirror → the Looking-Glass) still is — that is the exploration */
    assert.ok(!['site:prebuilt_mars', 'site:prebuilt_moon', 'site:prebuilt_saturn'].some(id => W.nodes.some(n => n.id === id)), 'the world overview poses no threshold-only site as a question');
    assert.ok(W.nodes.some(n => n.id === 'site:prebuilt_revenge' && n.st === 'q'), 'a seam off the building still poses its far place');
    const Wm = g('hqWorldOverview')(mastered(['prebuilt_mars']), 'central_egress', { seen });
    assert.ok(Wm.nodes.some(n => n.id === 'site:prebuilt_mars' && n.st === 'q'), 'once Otto built the door the site is posed');
    const chart = g('hqStarChart')(p);
    assert.ok(chart.stars.every(st => st.chart === 'uncharted'), 'a fresh officer\'s sky is nameless dots');
    const c2 = g('hqStarChart')(mastered(['prebuilt_moon']));
    assert.ok(c2.stars.find(st => st.id === 'prebuilt_moon').chart === 'earned');
    const pSeen = mastered([]); pSeen.door.hq.rooms = { seen: { site_prebuilt_moon_mare: '2026-09-20' } };
    const c3 = g('hqStarChart')(pSeen);
    assert.equal(c3.stars.find(st => st.id === 'prebuilt_moon').chart, 'charted', 'a room of the site stood in = charted, no door');
});

test('THE ROSTER LOCK: five starters on both sides; the ledger read never opens by scope; the scope opens the roster online / classic VS CPU / the range; the shop reads the ledger', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(D.ACCT_STARTER_UNITS)).sort(), ['bigfoot', 'catgirl', 'door agent', 'homosapien', 'honda civic']);
    const sv = SV.match(/const ACCT_STARTER_UNITS = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g).map(x => x.replace(/'/g, ''));
    assert.deepEqual(sv.sort(), ['bigfoot', 'catgirl', 'door agent', 'homosapien', 'honda civic'], 'server.js mirrors the starters');
    const W = D.window;
    const prev = { PS: W.ProfileSystem, scope: W._ewRosterScope, dev: W._DEV_UNLOCK_ALL, net: W._NET, iom: W.isOnlineMatch };
    try {
        W._DEV_UNLOCK_ALL = false; W._NET = null; W.isOnlineMatch = () => false; W._ewRosterScope = 'owned';
        W.ProfileSystem = { getActiveProfile: () => ({ account: { unlockedUnits: ['door agent', 'homosapien', 'knight'] } }) };
        assert.equal(g('unitRosterScope')(), 'owned');
        assert.equal(g('isUnitOwned')('knight'), true); assert.equal(g('isUnitOwned')('wizard'), false);
        assert.equal(g('isUnitUnlocked')('wizard'), false, 'in the building you field what you own');
        W._ewRosterScope = 'all';
        assert.equal(g('isUnitUnlocked')('wizard'), true, 'the classic VS CPU / the range opens the roster');
        assert.equal(g('isUnitOwned')('wizard'), false, 'the ledger never reads the scope');
        W._ewRosterScope = 'owned'; W.isOnlineMatch = () => true;
        assert.equal(g('unitRosterScope')(), 'all', 'an online seat opens the roster');
        W.isOnlineMatch = () => false; W._NET = { online: true };
        assert.equal(g('unitRosterScope')(), 'all', 'the online lobby opens the roster');
        W._NET = null; W.ProfileSystem = null;
        assert.equal(g('isUnitUnlocked')('homosapien'), true, 'offline: the starters');
        assert.equal(g('isUnitUnlocked')('knight'), false);
    } finally { W.ProfileSystem = prev.PS; W._ewRosterScope = prev.scope; W._DEV_UNLOCK_ALL = prev.dev; W._NET = prev.net; W.isOnlineMatch = prev.iom; }
    /* the launchers set the scope; the shop + the codex read the ledger */
    assert.ok(/_goToVsCpu = function\(\) \{[\s\S]{0,400}_ewRosterScope = 'all'/.test(MP), 'classic VS CPU = all');
    assert.ok(/_goToQuickPlay = function\(\) \{[\s\S]{0,200}_ewRosterScope = 'all'/.test(MP) && /_goToFriendlyMatch = function\(\) \{[\s\S]{0,200}_ewRosterScope = 'all'/.test(MP), 'online = all');
    assert.ok(/scope: 'all',\s*\/\/ THE ROSTER LOCK/.test(MP), 'the RANGE console = all');
    assert.ok(/window\._ewRosterScope = \(o\.scope === 'all'\) \? 'all' : 'owned';/.test(MP), '_hqLaunchMission sets the scope');
    assert.ok(/window\._ewRosterScope = 'owned';   \/\/ THE ROSTER LOCK \(2026-09-20\): in the building/.test(MP), '_hqEnter = owned');
    const shop = UI.slice(UI.indexOf('function _shopBuyable'), UI.indexOf('function _shopGridHtml') + 2000);
    assert.ok(!/isUnitUnlocked/.test(shop) && /isUnitOwned/.test(shop), 'the shop reads the ledger');
});
