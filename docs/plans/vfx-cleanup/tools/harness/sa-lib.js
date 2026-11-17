/* Spell audit in-page library. Injected into a fresh game page (never mondo's browser).
   SA.boot(cfg) -> a private 12x12 flat board, P1 caster + 2 allies vs P2 4 enemies, all LOCAL controllers, no AI.
   SA.test(spellId, opts) -> one cast record (before/after snapshot, log lines, forecast, errors). */
(function () {
  const SA = window.SA = { cfg: null, errs: [], ready: false };
  const W = 12, H = 12;
  window.addEventListener('error', e => SA.errs.push(String(e.message || e).slice(0, 300)));
  window.addEventListener('unhandledrejection', e => SA.errs.push('rej ' + String(e.reason && e.reason.message || e.reason).slice(0, 300)));
  const _ce = console.error.bind(console);
  console.error = function () { try { SA.errs.push('CE ' + [...arguments].map(a => (a && a.stack) ? String(a.stack).split('\n').slice(0, 2).join(' | ') : (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ').slice(0, 400)); } catch (e) {} return _ce.apply(null, arguments); };
  const _cw = console.warn.bind(console);
  console.warn = function () { try { const s = [...arguments].map(a => (a && a.stack) ? String(a.stack).split('\n').slice(0, 2).join(' | ') : (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ').slice(0, 400); if (!/THREE\.|deprecated|GLTF|texture|WebGL|audio|font|ThreeRenderer|model load|\[asset|\[BOOT\]|preload/i.test(s)) SA.errs.push('CW ' + s); } catch (e) {} return _cw.apply(null, arguments); };

  const sleep = ms => new Promise(r => (window._ewRawSetTimeout || setTimeout)(r, ms));
  SA.sleep = sleep;

  /* ---------------- boot ---------------- */
  SA.boot = async function (cfg) {
    cfg = Object.assign({ casterRace: 'door agent', allyRace: 'homosapien', enemyRace: 'homosapien', allies: 3, enemies: 4 }, cfg || {});
    SA.cfg = cfg;
    const _t0 = performance.now(); SA.bootMarks = []; const mark = n => SA.bootMarks.push(n + ':' + Math.round(performance.now() - _t0));
    window.EW_DISABLE_INTRO_CINE = true;
    const sp1 = [{ x: 3, y: 6 }, { x: 2, y: 5 }, { x: 2, y: 7 }, { x: 3, y: 4 }];
    const sp2 = [{ x: 7, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 7 }, { x: 9, y: 6 }];
    GAME_MODES.spellaudit = {
      id: 'spellaudit', label: 'Spell Audit', desc: 'audit sandbox',
      boardSize: W, boardWidth: W, boardHeight: H, teamSize: 4,
      winHourglasses: 99, hiddenItemSpawns: 0, blitzMode: true, hasTowers: false,
      terrainPatches: { water: [0, 0, 0], desert: [0, 0, 0], mountain: [0, 0, 0] },
      spawns: { 1: sp1.slice(0, 1 + cfg.allies), 2: sp2.slice(0, cfg.enemies) },
      defaultBuilds: { 1: [UNIT_CLASS], 2: [UNIT_CLASS] },
    };
    MAP_LAYOUT_PRESETS.spellaudit = {
      sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: H - 1, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
      barrierRows: [], barrierOpeningsX: [], hasFloors: false,
    };
    applyGameMode('spellaudit');
    activeMultiplayerMode = 'tdm';
    state.controllers[1] = CTRL.LOCAL; state.controllers[2] = CTRL.LOCAL;
    state.devAutoSim = false; state.devSimSpeed = 1; state.fogOfWar = false;
    state.squadLeaderMode = false; state.isRankedMatch = false; state.trainingMatch = false; state.storyLevel = 0;
    state.reserves = false; state.noRespawns = true; state.isCampaign = false; state._customRoundLimit = 0;
    const n1 = 1 + cfg.allies, n2 = cfg.enemies;
    state.partyBuilds = { 1: Array(n1).fill(UNIT_CLASS), 2: Array(n2).fill(UNIT_CLASS) };
    state.partyNames = { 1: ['Caster', 'AllyA', 'AllyB', 'AllyC'].slice(0, n1), 2: ['EnemyA', 'EnemyB', 'EnemyC', 'EnemyD'].slice(0, n2) };
    state.loadouts = { 1: Array(n1).fill(0).map(() => emptyLoadout()), 2: Array(n2).fill(0).map(() => emptyLoadout()) };
    state.partyMeta = {
      1: [{ race: cfg.casterRace, customSpells: [] }].concat(Array(cfg.allies).fill(0).map(() => ({ race: cfg.allyRace, customSpells: [] }))),
      2: Array(n2).fill(0).map(() => ({ race: cfg.enemyRace, customSpells: [] })),
    };
    state._spellLabMode = true; window._spellLabActive = true;
    window._spellLabTick = function () { SA.tick(); };
    const ov = document.getElementById('startOverlay');
    if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; ov.style.pointerEvents = 'none'; }
    state.teamLockedIn = true;
    applyPartyBuild(false);
    mark('pre'); startMatch(); mark('start');
    for (let i = 0; i < 200; i++) { if (state.phase === 'battle' && state.units && state.units.length >= n1 + n2) break; await sleep(150); }
    if (state.phase !== 'battle') throw new Error('boot timeout phase=' + state.phase);
    if (state.matchClock) state.matchClock.roundLimit = 0;
    state.shotClock = null; mark('battle');
    await SA.settle(8000); mark('settle');
    // the opening lines ("A fight breaks out!", "Round 1") come from deferred timers: let them land before any cast
    const _r1n = SA._booted ? 6 : 40;   // (VFX audit copy: 200 -> 40, the first boot waited ~45 s for the line) SA._booted = true;
    for (let i = 0; i < _r1n; i++) { if ((state.logEntries || []).some(e => /Round 1/.test(typeof e === 'string' ? e : (e && e.m) || ''))) break; await sleep(150); }
    mark('r1'); await sleep(300);
    // idle pages stay in the sim/no-render mode: a page that draws every frame starves the other games on 4 cores
    state.devAutoSim = true;
    window._tutWeatherOff = true;
    // a fresh page's first boot is the pristine picture; later boots drop whatever an earlier match left behind
    // (the engine itself keeps e.g. state._activeZones across backToMainMenu + startMatch — see the audit notes)
    SA.leaked = [];
    const EMPTY = v => v == null || v === '' || v === 0 || v === false || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
    if (!SA.pristine) { SA.pristine = {}; for (const k of Object.keys(state)) { const v = state[k]; if (typeof v === 'function') continue; try { SA.pristine[k] = JSON.stringify(v); } catch (e) {} } }
    else for (const k of Object.keys(state)) {
      if (SA.KEEP.has(k) || k === 'units' || typeof state[k] === 'function') continue;
      const v = state[k];
      if (!(k in SA.pristine)) { if (!EMPTY(v)) SA.leaked.push(k); try { delete state[k]; } catch (e) {} continue; }
      let pv; try { pv = SA.pristine[k] === undefined ? undefined : JSON.parse(SA.pristine[k]); } catch (e) { continue; }
      if (EMPTY(pv) && !EMPTY(v)) { SA.leaked.push(k); state[k] = pv; }
    }
    SA.flatten();
    SA.base = SA.units().map(u => ({ id: u.id, player: u.player, x: u.x, y: u.y }));
    SA.terrain0 = SA.terrainGrid();
    SA.baseUnits = JSON.parse(JSON.stringify(state.units));
    SA.baseState = {};
    for (const k of Object.keys(state)) { if (SA.KEEP.has(k) || k === 'units') continue; const v = state[k]; if (typeof v === 'function') continue; try { SA.baseState[k] = JSON.stringify(v); } catch (e) {} }
    SA.ready = true;
    return { phase: state.phase, marks: SA.bootMarks.join(' '), leaked: SA.leaked, units: SA.units().map(u => [u.id, u.player, u.race, u.x, u.y, u.hp, u.maxHp]) };
  };

  /* standard layout: primary enemy E0 at (7,6), the caster d tiles west of it (d = range clamped 1..3),
     E1 behind E0 (line), E2 beside E0, E3 two rows up; allies hug the caster. */
  SA.layoutFor = function (sp, o) {
    o = o || {};
    const r = (sp && sp.range != null) ? sp.range : 3;
    let vis = 3; try { vis = GAME.getUnitVisionRange(SA.caster()) || 3; } catch (e) {}
    const d = o.dist != null ? o.dist : Math.max(1, Math.min(3, r || 1, vis));
    const cx = 7 - d, cy = 6;
    const P1 = state.units.filter(u => u.player === 1), P2 = state.units.filter(u => u.player === 2);
    const pos = {};
    const ap = [[cx, cy], [cx - 1, cy - 1], [cx - 1, cy + 1], [cx, cy - 2]];
    const ep = [[7, 6], [8, 6], [7, 7], [8, 4]];
    P1.forEach((u, i) => { if (ap[i]) pos[u.id] = { x: ap[i][0], y: ap[i][1] }; });
    P2.forEach((u, i) => { if (ep[i]) pos[u.id] = { x: ep[i][0], y: ep[i][1] }; });
    return pos;
  };
  SA.KEEP = new Set(['devAutoSim', 'devSimSpeed', 'phase', 'controllers', '_spellLabMode', 'logEntries', '_fullLogEntries', 'partyMeta', 'partyBuilds', 'loadouts', 'partyNames', 'fogOfWar', 'matchClock', 'shotClock', 'winner', '_terrainVersion']);
  SA.NOISE = /^(focusedUnitId|devAutoSim|_cam|_suppress|_spellPick1|_tileActionTarget|_repeatQueue|rngState|_trickRoomOrderRound|_blitzTurnOrderIds|matBank|_elemSeen|_terrainClock|selectedUnitId|hoverUnitId|actionMenuView|pendingTarget|_fogAnchorUnitId|_fogCameraAllowed|_prevBlitzActivePlayer|_recDmg|_lastSpellCast|_eorLive|_comebackArmed|_skippedUnit|_lastWeatherSpawnTiles|uiDialog|_hoverPreview|_spellTarget|_armed|_aim|_lastCast|lastAction|_actionStamp|_actionSeq|_undo|_ewSeq)/;
  // the floor: 'scorched' = flat, passable, no element terrain (grass is a NATURE terrain: x1.25 nature hits, and it burns)
  SA.FLOOR = 'scorched';
  SA.flatten = function () {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const col = state.boardColumns && state.boardColumns[y] && state.boardColumns[y][x];
      if (col) { col.length = 0; col.push({ z: 0, terrain: SA.FLOOR }); }
      const vc = state.boardVoxels && state.boardVoxels[y] && state.boardVoxels[y][x];
      if (vc && Array.isArray(vc)) { vc.length = 0; vc.push({ z: 0, terrain: SA.FLOOR }); }
      if (state.boardTerrain && state.boardTerrain[y]) state.boardTerrain[y][x] = SA.FLOOR;
      if (state.boardHeights && state.boardHeights[y]) state.boardHeights[y][x] = 0;
    }
    for (const k of ['paintedTiles', 'paintedFrom', 'terrainTimers', 'burningTiles']) if (state[k] && typeof state[k] === 'object') state[k] = Array.isArray(state[k]) ? [] : {};
    if (state.boardObjects) { try { for (const r of state.boardObjects) if (Array.isArray(r)) r.fill(null); } catch (e) {} }
    // no zodiac sign: its element surge / earthwork discount would skew every earth-type number (the harness re-clears it each round)
    state.activeZodiac = null;
    state._terrainVersion = (state._terrainVersion || 0) + 1;
    try { GAME.markDirty(); } catch (e) {}
  };
  SA.units = () => (state.units || []).filter(u => !u._saSummon);
  SA.caster = () => (state.units || []).find(u => u.player === 1 && u._saRole === 'caster') || (state.units || []).find(u => u.player === 1);
  SA.tick = function () {
    const c = SA.caster(); if (!c || c.dead) return;
    c.ap = (typeof UNIT_MAX_AP !== 'undefined' ? UNIT_MAX_AP : 2) + (c._xpBonusAP || 0);
    c._spellCooldowns = {}; c._spellsUsedThisTurn = {}; c._skippedTurn = false;
    if (state._blitzActiveUnitId !== c.id) { state._blitzActiveUnitId = c.id; state.activePlayer = 1; }
  };

  SA.terrainGrid = function () {
    const g = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let t = null, h = 0;
      try { t = GAME.getTerrainAt(x, y); } catch (e) {}
      try { h = GAME.getHeightAt(x, y); } catch (e) {}
      g.push(t + '@' + h);
    }
    return g;
  };

  /* wait until the board is still (the engine's own busy flag + empty sim queue + no pending advance) */
  SA.settle = async function (maxMs) {
    const t0 = performance.now(); let still = 0;
    while (performance.now() - t0 < (maxMs || 15000)) {
      let busy = false;
      try { busy = GAME.boardBusy() || state.units.some(u => u._dying); } catch (e) {}
      if (!busy) { if (++still >= 4) return performance.now() - t0; } else still = 0;
      await sleep(60);
    }
    return -1;
  };

  /* ---------------- snapshot ---------------- */
  const pick = (o, ks) => { const r = {}; for (const k of ks) if (o[k] !== undefined) r[k] = o[k]; return r; };
  function statusOf(u) {
    const s = {}; const st = u.status || {};
    for (const [k, v] of Object.entries(st)) {
      if (v == null || v === false || v === 0) continue;
      s[k] = (typeof v === 'object') ? (v.duration != null ? v.duration : (v.turns != null ? v.turns : JSON.stringify(v).slice(0, 80))) : v;
    }
    return s;
  }
  function stagesOf(u) {
    const out = {};
    try { for (const k of ['atk', 'def', 'mdef', 'int', 'spd', 'eva', 'crt', 'acc', 'vision', 'move', 'range']) { const n = GAME.getStatStageCount(u, k); if (n) out[k] = n; } } catch (e) {}
    return out;
  }
  SA.snapUnit = function (u) {
    return {
      id: u.id, p: u.player, name: u.name, race: u.race, x: u.x, y: u.y, z: u.z, hp: u.hp, maxHp: u.maxHp, mp: u.mp, maxMp: u.maxMp, ap: u.ap,
      shield: u.shield || 0, dead: !!u.dead, st: statusOf(u), stg: stagesOf(u), facing: u.facing,
      fx: pick(u, ['_hanging', 'invisible', '_flying', 'flying', 'altitude', '_possessedBy', '_shadowRealm', '_linkedTo', 'transformed', '_form', '_skyThrowGrab', 'summonedBy', '_summonOwner', 'isSummon', 'isObject', 'isTurret', 'isDecoy']),
    };
  };
  const STATE_SKIP = new Set(['units', 'logEntries', '_fullLogEntries', 'columns', 'voxels', 'board', 'terrain', 'heights', 'undoStack', '_undo', 'matchClock', 'shotClock', 'partyMeta', 'partyBuilds', 'loadouts', 'partyNames', 'controllers',
    '_blitzActiveUnitId', 'activePlayer', 'selectedUnitId', 'actionMode', 'selectedTool', 'hover', 'hoverTile', '_hover', 'aiThinking', 'camera', '_lastAction', 'round', 'turn', '_balanceTelemetry', 'combatStats', 'matchStats', '_matchStats', 'stats']);
  SA.stateKeys = function () {
    const out = {};
    for (const k of Object.keys(state)) {
      if (STATE_SKIP.has(k)) continue;
      const v = state[k];
      if (typeof v === 'function') continue;
      let s; try { s = JSON.stringify(v); } catch (e) { continue; }
      if (s && s.length > 40000) s = 'BIG:' + s.length + ':' + s.slice(0, 200);
      out[k] = s;
    }
    return out;
  };
  SA.snap = function () {
    return { units: (state.units || []).map(SA.snapUnit), terrain: SA.terrainGrid(), keys: SA.stateKeys(), log: (state.logEntries || []).length, flog: (state._fullLogEntries || []).length, round: state.round, weather: state.weather || null };
  };
  SA.diff = function (a, b) {
    const d = { units: [], newUnits: [], gone: [], terrain: [], keys: {} };
    const am = new Map(a.units.map(u => [u.id, u]));
    for (const ub of b.units) {
      const ua = am.get(ub.id);
      if (!ua) { d.newUnits.push(ub); continue; }
      const ch = {};
      for (const k of ['x', 'y', 'z', 'hp', 'maxHp', 'mp', 'maxMp', 'ap', 'shield', 'dead', 'facing']) if (ua[k] !== ub[k]) ch[k] = [ua[k], ub[k]];
      for (const k of ['st', 'stg', 'fx']) { const A = JSON.stringify(ua[k]), B = JSON.stringify(ub[k]); if (A !== B) ch[k] = [ua[k], ub[k]]; }
      if (Object.keys(ch).length) d.units.push({ id: ub.id, p: ub.p, name: ub.name, ch });
    }
    const bm = new Set(b.units.map(u => u.id));
    for (const ua of a.units) if (!bm.has(ua.id)) d.gone.push(ua.id);
    for (let i = 0; i < a.terrain.length; i++) if (a.terrain[i] !== b.terrain[i]) d.terrain.push([i % W, (i / W) | 0, a.terrain[i], b.terrain[i]]);
    for (const k of new Set([...Object.keys(a.keys), ...Object.keys(b.keys)])) if (a.keys[k] !== b.keys[k]) d.keys[k] = [(a.keys[k] || '').slice(0, 300), (b.keys[k] || '').slice(0, 600)];
    return d;
  };

  /* ---------------- reset between casts ---------------- */
  SA.reset = function (layout) {
    // board state back to the post-boot baseline (deletes keys a cast created, restores the ones it changed)
    for (const k of Object.keys(state)) {
      if (SA.KEEP.has(k) || k === 'units') continue;
      if (typeof state[k] === 'function') continue;
      if (!(k in SA.baseState)) { try { delete state[k]; } catch (e) {} continue; }
      let cur; try { cur = JSON.stringify(state[k]); } catch (e) { continue; }
      if (cur !== SA.baseState[k]) { try { state[k] = SA.baseState[k] === undefined ? undefined : JSON.parse(SA.baseState[k]); } catch (e) {} }
    }
    for (const k of Object.keys(SA.baseState)) if (!(k in state)) { try { state[k] = JSON.parse(SA.baseState[k]); } catch (e) {} }
    state._terrainVersion = (state._terrainVersion || 0) + 1;
    // units: drop anything the cast spawned, restore every original unit field-by-field
    const byId = new Map(SA.baseUnits.map(u => [u.id, u]));
    state.units = (state.units || []).filter(u => byId.has(u.id));
    for (const b of SA.baseUnits) {
      let u = state.units.find(x => x.id === b.id);
      if (!u) { u = {}; state.units.push(u); }
      const fresh = JSON.parse(JSON.stringify(b));
      for (const k of Object.keys(u)) if (!(k in fresh)) { try { delete u[k]; } catch (e) {} }
      Object.assign(u, fresh);
      const L = layout && layout[u.id];
      if (L) { u.x = L.x; u.y = L.y; }
      try { u.z = GAME.getHeightAt(u.x, u.y); } catch (e) { u.z = 0; }
      u.ap = 0;
    }
    state.winner = null;
    state._spellLabMode = true; window._spellLabActive = true;
    SA.tick();
    try { GAME.markDirty(); } catch (e) {}
  };

  /* ---------------- target pick ---------------- */
  function fcPlan(c, sp, x, y, z) {
    try { const p = window.forecastSpellPlan(c, sp, x, y, z == null ? GAME.getHeightAt(x, y) : z); return p; } catch (e) { return null; }
  }
  function fcSummary(p) {
    if (!p || !p.handled) return null;
    return {
      hits: (p.hits || []).map(h => ({ id: h.unit && h.unit.id, name: h.unit && h.unit.name, dmg: h.dmg, min: h.min, max: h.max, heal: h.heal || 0, status: h.statuses || h.status || undefined, lethal: !!h.lethal })),
      moves: (p.moves || []).map(m => ({ id: m.unit && m.unit.id, to: [m.x != null ? m.x : (m.to && m.to.x), m.y != null ? m.y : (m.to && m.to.y)], dmg: m.dmg })),
      tiles: (p.tiles || []).length, notes: (p.notes || []).slice(0, 6).map(n => typeof n === 'string' ? n : JSON.stringify(n).slice(0, 160)),
      press: p.press ? (typeof p.press === 'object' ? JSON.stringify(p.press).slice(0, 120) : p.press) : null,
    };
  }
  const EMPTY_KINDS = new Set(['teleport', 'escape', 'summonUnit', 'deployObject', 'deployTurret', 'deployPair', 'placeTrap', 'placeMirror', 'doorDeploy', 'raiseDead']);
  /* candidate aims, best first: the CPU's own pick, then a scan of the legal tiles (forecast + heuristic), diversified */
  SA.candidates = function (c, sp) {
    const out = [];
    const key = t => t.x + ',' + t.y + ',' + (t.partner || '');
    const seen = new Set();
    const push = t => { if (!t) return; const k = key(t); if (seen.has(k)) return; seen.add(k); out.push(t); };
    try {
      c.spells = [sp]; c._spellSlots = [sp.id]; c._raceAbilities = [];
      const cands = (window._aiPlanCandidates ? window._aiPlanCandidates(c) : []) || [];
      const m = cands.find(x => x.type === 'spell' && x.spell && x.spell.id === sp.id);
      if (m) {
        const ai = { x: m.target ? m.target.x : c.x, y: m.target ? m.target.y : c.y, z: m.target ? m.target.z : c.z, partner: m.partner ? m.partner.id : null, targetId: m.target && m.target.id, src: 'ai', score: Math.round(m.score) };
        if ((sp.kind === 'line' || sp.kind === 'linePush') && window._aiReaimLineSpell) { try { const a = window._aiReaimLineSpell(c, sp, ai.targetId); if (a) { ai.x = a.x; ai.y = a.y; ai.z = a.z; } } catch (e) {} }
        if (sp.kind === 'guard' && window._aiReaimChivalry) { try { const w = window._aiReaimChivalry(c, sp); if (w) { ai.x = w.x; ai.y = w.y; ai.z = w.z; } } catch (e) {} }
        push(ai);
      }
    } catch (e) { SA.errs.push('aiPick ' + e.message); }
    const self = (typeof isSpellSelfCast === 'function') && isSpellSelfCast(sp);
    if (self) push({ x: c.x, y: c.y, z: c.z, src: 'self' });
    let tiles = [];
    try { tiles = GAME.getSpellRangeTiles(c, sp) || []; } catch (e) {}
    const support = /heal|buff|shield|cleanse|revive|manaRestore|zoneHeal|aoeShield|guard|transfer|warCry/.test(sp.kind) || ['buff', 'heal', 'support', 'utility'].includes(sp.type);
    const wantEmpty = EMPTY_KINDS.has(sp.kind);
    const scored = [];
    for (const t of tiles) {
      const occ = state.units.find(u => !u.dead && u.x === t.x && u.y === t.y);
      let aim = null; try { aim = window.spellAimProblem ? window.spellAimProblem(c, sp, t.x, t.y, t.z) : null; } catch (e) {}
      if (aim) continue;
      let s = 0;
      const p = fcPlan(c, sp, t.x, t.y, t.z);
      if (p && p.handled) {
        for (const h of p.hits || []) { const foe = h.unit && h.unit.player !== c.player; s += (foe ? 1 : -1.5) * (h.dmg || 0) + (foe ? 30 : 0) + (!foe && h.heal ? h.heal : 0); }
        s += (p.moves || []).length * 15;
      }
      let cat;
      if (occ) { cat = occ === c ? 'self' : (occ.player === c.player ? 'ally' : 'enemy'); s += support ? (cat === 'ally' ? 50 : cat === 'self' ? 20 : -40) : (cat === 'enemy' ? 60 : -60); if (wantEmpty) s -= 200; }
      else { cat = 'empty'; let nd = 99; for (const e of state.units) if (!e.dead && e.player !== c.player) nd = Math.min(nd, Math.abs(e.x - t.x) + Math.abs(e.y - t.y)); s += (support ? 0 : 20 - nd * 4) + (wantEmpty ? 40 : 0); }
      scored.push({ x: t.x, y: t.y, z: t.z, src: 'scan:' + cat, score: Math.round(s), cat });
    }
    scored.sort((a, b) => b.score - a.score);
    // best overall, then best of each category so a wrong guess still gets a fair second try
    if (scored[0]) push(scored[0]);
    for (const cat of ['enemy', 'ally', 'empty', 'self']) { const t = scored.find(x => x.cat === cat); if (t) push(t); }
    for (const t of scored.slice(1, 4)) push(t);
    if (!out.length) push({ x: c.x, y: c.y, z: c.z, src: 'self-fallback' });
    return out.slice(0, 7);
  };

  /* ---------------- the test ---------------- */
  SA.logSince = function (n) { return (state.logEntries || []).slice(n).map(e => typeof e === 'string' ? e : (e && (e.m || e.msg || e.text)) || JSON.stringify(e)).map(s => String(s).replace(/<[^>]+>/g, '').slice(0, 300)); };
  SA.flogSince = function (n) { return (state._fullLogEntries || []).slice(n).map(e => (e && (e.m || e.msg || e.text)) || (typeof e === 'string' ? e : JSON.stringify(e))).map(s => String(s).replace(/<[^>]+>/g, '').slice(0, 300)); };

  /* opts: { layout:{unitId:{x,y}}, target:{x,y}|'enemy'|'ally'|'self', pre:'js run before cast (c, sp, E, A)', rounds:N, casterAt:{x,y}, seed } */
  SA.test = async function (spellId, opts) {
    opts = opts || {};
    const rec = { id: spellId, ok: false }; const _T0 = performance.now(); rec.t = {};
    const def = SPELL_BY_ID[spellId];
    if (!def) { rec.err = 'no such spell'; return rec; }
    rec.name = def.name; rec.kind = def.kind; rec.type = def.type; rec.desc = def.desc; rec.mp = def.cost; rec.ap = def.apCost; rec.range = def.range; rec.tier = def.tier;
    state.devAutoSim = true;
    SA.reset(opts.layout || SA.layoutFor(def, opts));
    const c = SA.caster();
    // allies start hurt (heals/drains show), enemies full
    for (const u of state.units) if (u.player === 1 && u !== c && opts.allyHpPct !== 1) u.hp = Math.round(u.maxHp * (opts.allyHpPct || 0.6));
    // the caster starts at 70% so self-heals / drains show (casterHpPct:1 for a full-HP caster)
    c.hp = Math.round(c.maxHp * (opts.casterHpPct || 0.7));
    const sp = JSON.parse(JSON.stringify(def));
    c.spells = [sp]; c._spellSlots = [spellId]; c._raceAbilities = [];
    const E = state.units.filter(u => u.player === 2), A = state.units.filter(u => u.player === 1 && u !== c);
    if (opts.casterAt) { c.x = opts.casterAt.x; c.y = opts.casterAt.y; c.z = GAME.getHeightAt(c.x, c.y); }
    if (opts.pre) { try { (new Function('c', 'sp', 'E', 'A', 'G', opts.pre))(c, sp, E, A, GAME); } catch (e) { rec.preErr = e.message; } }
    if (opts.seed != null && GAME.seedEngineRng) { try { GAME.seedEngineRng(opts.seed); } catch (e) {} }
    SA.tick();
    try { selectUnit(c.id); } catch (e) {}
    let cands;
    if (opts.target && typeof opts.target === 'object') cands = [Object.assign({ src: 'given' }, opts.target)];
    else if (opts.target === 'self') cands = [{ x: c.x, y: c.y, src: 'self' }];
    else cands = SA.candidates(c, sp);
    rec.attempts = [];
    let tg = null, delay = 0, before = null, e0 = SA.errs.length;
    for (const cand of cands) {
      tg = Object.assign({}, cand);
      if (tg.z == null) { try { tg.z = GAME.getHeightAt(tg.x, tg.y); } catch (e) { tg.z = 0; } }
      SA.tick();
      try { selectUnit(c.id); } catch (e) {}
      const occ = state.units.find(u => !u.dead && u.x === tg.x && u.y === tg.y);
      rec.target = tg;
      rec.targetUnit = occ ? (occ.name + '#' + occ.id + (occ.player === c.player ? (occ === c ? '(self)' : '(ally)') : '(enemy)')) : null;
      rec.casterAt = [c.x, c.y];
      rec.mpBefore = c.mp;
      rec.fc = fcSummary(fcPlan(c, sp, tg.x, tg.y, tg.z));
      try { if (occ && occ.player !== c.player && sp.statusEffects && typeof getStatusApplyChance === 'function') rec.stChance = [].concat(sp.statusEffects).map(se => (se.id || se) + ' ' + Math.round(100 * getStatusApplyChance(c, occ, typeof se === 'object' ? se : { id: se, duration: 1 })) + '%').join(', '); } catch (e) {}
      try { rec.aimProblem = window.spellAimProblem ? window.spellAimProblem(c, sp, tg.x, tg.y, tg.z) : undefined; } catch (e) {}
      state.logEntries = []; state._fullLogEntries = [];
      before = SA.snap();
      state.devAutoSim = true;   // sim clock: timers drain back-to-back; controllers stay LOCAL so the CPU never acts
      state.actionMode = 'spell'; state.selectedTool = sp.name;
      let cx = tg.x, cy = tg.y, cz = tg.z;
      if (tg.partner != null) { const p1 = state.units.find(u => u.id === tg.targetId); if (p1) state._spellPick1 = { id: p1.id, spellId: sp.id, x: p1.x, y: p1.y }; const pp = state.units.find(u => u.id === tg.partner); if (pp) { cx = pp.x; cy = pp.y; cz = pp.z; } }
      delay = 0; let thr = null;
      try { delay = GAME.doSpell(c, cx, cy, cz) || 0; } catch (e) { thr = String(e && e.stack || e).split('\n').slice(0, 3).join(' | '); rec.throw = thr; }
      state._spellPick1 = null;
      if (sp.kind === 'skyThrow' && c._skyThrowGrab) {
        await SA.settle(4000);
        const gr = state.units.find(u => u.id === c._skyThrowGrab.id);
        if (gr) { const tx = Math.min(W - 1, gr.x + 2), ty = gr.y; try { rec.throwDelay = GAME.doSpell(c, tx, ty) || 0; rec.throwAt = [tx, ty]; } catch (e) { rec.throw2 = e.message; } }
      }
      await SA.settle(1500);
      const probe = SA.snap();
      const dd = SA.diff(before, probe);
      const ck = Object.keys(dd.keys).filter(k => !SA.NOISE.test(k));
      const changed = dd.units.some(u => Object.keys(u.ch).some(k => k !== 'facing')) || dd.newUnits.length || dd.terrain.length || ck.length;
      rec.attempts.push({ x: tg.x, y: tg.y, src: tg.src, unit: rec.targetUnit, delay, changed: !!changed, keys: ck.slice(0, 6), log: SA.logSince(before.log).filter(l => !/A fight breaks out|^⚡ Round 1$/.test(l)).slice(0, 3) });
      if (delay > 0 || changed || thr) break;
    }
    rec.t.attempts = Math.round(performance.now() - _T0);
    rec.delay = delay;
    rec.settleMs = Math.round(await SA.settle(20000));
    rec.rejected = !(rec.attempts.some(a => a.delay > 0 || a.changed));
    const mid = SA.snap();
    rec.mpSpent = rec.mpBefore - (state.units.find(u => u.id === c.id) || {}).mp;
    rec.cast = SA.diff(before, mid);
    rec.log = SA.logSince(before.log).filter(l => !/A fight breaks out|^⚡ Round 1$/.test(l)).slice(0, 40);
    // optional rounds: run the end-of-round upkeep N times (DoT ticks, durations, delayed spells, terrain timers)
    rec.t.cast = Math.round(performance.now() - _T0);
    if (opts.rounds) {
      rec.roundsRun = [];
      for (let r = 0; r < opts.rounds; r++) {
        const s0 = SA.snap();
        const rr = await SA.advanceRound();
        const s1 = SA.snap();
        rec.roundsRun.push({ round: s1.round, how: rr, diff: SA.diff(s0, s1), log: SA.logSince(s0.log).slice(0, 30) });
      }
    }
    rec.t.total = Math.round(performance.now() - _T0);
    rec.errs = SA.errs.slice(e0, e0 + 12);
    rec.ok = true;
    return rec;
  };

  /* end the round the way the engine does: every unit spent, then the engine's own advance */
  SA.advanceRound = async function () {
    // every unit takes END TURN through the real button path (triggerEndTurn), so turn-start / turn-end hooks run
    const r0 = state.round;
    state._spellLabMode = false; window._spellLabActive = false;
    state.devAutoSim = true;
    let guard = 0, how = [];
    try {
      while (state.round === r0 && guard++ < 40) {
        const id = state._blitzActiveUnitId;
        const u = id && state.units.find(x => x.id === id);
        if (u && !u.dead) {
          try { selectUnit(u.id); } catch (e) {}
          state.selectedUnitId = u.id;
          try { triggerEndTurn(); } catch (e) { SA.errs.push('endTurn ' + e.message); }
        } else {
          try { GAME.maybeAdvanceTurn(); } catch (e) { SA.errs.push('advance ' + e.message); }
        }
        // the next activation is instant; only wait for the hand-off itself (visual tails don't matter here)
        for (let k = 0; k < 300 && state._blitzActiveUnitId === id && state.round === r0; k++) await sleep(10);
        await sleep(20);
        how.push(id);
      }
      await SA.settle(6000);
      if (state.activeZodiac && !SA.keepZodiac) state.activeZodiac = null;
    } finally {
      state._spellLabMode = true; window._spellLabActive = true;
      SA.tick();
    }
    return { from: r0, to: state.round, steps: guard };
  };
})();
