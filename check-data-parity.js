// tools/check-data-parity.js — client/server canonical-data drift detector.
//
// server.js keeps a hand-synced copy of the data.js economy constants + race
// list ("Keep these in sync with data.js" — server.js §ACCOUNT ECONOMY). That
// sync has already broken once (2026-07-13 batch missing server-side). This
// tool reads BOTH sides — data.js via the headless vm loader, server.js via
// literal extraction — and diffs them, so drift fails `npm test` instead of
// surfacing as a mid-match unlock bug.
//
// Usage: node tools/check-data-parity.js
// Exit code 0 = in sync, 1 = drift found (each problem printed).

'use strict';

const { loadGameData, loadServerEconomy } = require('./load-data');

function asSet(v) { return new Set(v instanceof Set ? [...v] : v); }

function setDiff(a, b) { return [...a].filter(x => !b.has(x)); }

// Returns an array of human-readable problem strings (empty = fully in sync).
function runParityChecks() {
    const client = loadGameData();
    const server = loadServerEconomy();
    const problems = [];

    // 1. Scalar economy constants must match exactly.
    for (const k of ['ACCT_UNIT_PRICE', 'ACCT_STARTING_GOLD', 'ACCT_FREE_TOKENS', 'ACCT_MATCH_GOLD_CAP']) {
        if (client[k] !== server[k]) {
            problems.push(`${k}: client=${client[k]} server=${server[k]}`);
        }
    }

    // 2. PvP mode lists (which modes bank account gold) must agree.
    const cModes = asSet(client.ACCT_PVP_MODES), sModes = asSet(server.ACCT_PVP_MODES);
    for (const m of setDiff(cModes, sModes)) problems.push(`ACCT_PVP_MODES: '${m}' on client only`);
    for (const m of setDiff(sModes, cModes)) problems.push(`ACCT_PVP_MODES: '${m}' on server only`);

    // 3. Starter roster must be identical — the server unions ITS list into
    //    accounts on login, the client uses ITS list as the offline fallback,
    //    so a one-sided entry shows as owned on one side and locked-or-illegal
    //    on the other.
    const cStart = asSet(client.ACCT_STARTER_UNITS), sStart = asSet(server.ACCT_STARTER_UNITS);
    for (const r of setDiff(cStart, sStart)) problems.push(`ACCT_STARTER_UNITS: '${r}' in data.js but missing from server.js`);
    for (const r of setDiff(sStart, cStart)) problems.push(`ACCT_STARTER_UNITS: '${r}' in server.js but missing from data.js`);

    // 4. Purchasable race list must be identical — the server rejects
    //    /api/economy/purchase for races outside ITS copy.
    const cRaces = asSet(client.AVAILABLE_RACES), sRaces = asSet(server.AVAILABLE_RACES);
    for (const r of setDiff(cRaces, sRaces)) problems.push(`AVAILABLE_RACES: '${r}' in data.js but missing from server.js (purchases would 4xx)`);
    for (const r of setDiff(sRaces, cRaces)) problems.push(`AVAILABLE_RACES: '${r}' in server.js but missing from data.js`);

    // 5. Starters must be a subset of the known race list on both sides.
    for (const r of setDiff(cStart, cRaces)) problems.push(`starter '${r}' is not in data.js AVAILABLE_RACES`);
    for (const r of setDiff(sStart, sRaces)) problems.push(`starter '${r}' is not in server.js AVAILABLE_RACES`);

    return problems;
}

module.exports = { runParityChecks };

if (require.main === module) {
    const problems = runParityChecks();
    if (problems.length) {
        console.error(`CLIENT/SERVER DATA DRIFT — ${problems.length} problem(s):`);
        for (const p of problems) console.error('  • ' + p);
        process.exit(1);
    }
    console.log('client/server canonical data in sync (economy constants, PvP modes, starters, race list)');
}
