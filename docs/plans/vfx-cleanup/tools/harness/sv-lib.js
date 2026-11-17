/* Spell VFX audit in-page helpers (on top of SA from the spell-audit harness). Visuals ON: devAutoSim off. */
(function () {
  const SV = window.SV = {};
  /* set up one cast: board back to baseline, standard layout, the caster holds only this spell; returns the aim */
  SV.prep = function (id, opts) {
    opts = opts || {};
    const def = SPELL_BY_ID[id]; if (!def) return { err: 'no such spell' };
    state.devAutoSim = false;
    SA.reset(opts.layout || SA.layoutFor(def, opts));
    const c = SA.caster();
    for (const u of state.units) if (u.player === 1 && u !== c) u.hp = Math.round(u.maxHp * 0.6);
    c.hp = Math.round(c.maxHp * 0.7);
    const sp = JSON.parse(JSON.stringify(def));
    c.spells = [sp]; c._spellSlots = [id]; c._raceAbilities = [];
    const E = state.units.filter(u => u.player === 2), A = state.units.filter(u => u.player === 1 && u !== c);
    if (opts.pre) { try { (new Function('c', 'sp', 'E', 'A', 'G', opts.pre))(c, sp, E, A, GAME); } catch (e) { return { err: 'pre ' + e.message }; } }
    if (GAME.seedEngineRng) { try { GAME.seedEngineRng(opts.seed || 27); } catch (e) {} }
    SA.tick(); try { selectUnit(c.id); } catch (e) {}
    let cands;
    if (opts.target && typeof opts.target === 'object') cands = [Object.assign({ src: 'given' }, opts.target)];
    else if (opts.target === 'self') cands = [{ x: c.x, y: c.y, src: 'self' }];
    else cands = SA.candidates(c, sp);
    // legal first: drop aims the engine itself calls out
    const ok = cands.filter(t => { try { return !(window.spellAimProblem && window.spellAimProblem(c, sp, t.x, t.y, t.z == null ? GAME.getHeightAt(t.x, t.y) : t.z)); } catch (e) { return true; } });
    SV.cands = ok.length ? ok : cands; SV.sp = sp; SV.c = c; SV.ci = 0;
    try { SV.snap0 = SA.snap(); } catch (e) {}
    SV.e0 = SA.errs.length;
    try { if (window.ThreeRenderer || typeof ThreeRenderer !== 'undefined') {} } catch (e) {}
    return { name: def.name, kind: def.kind, el: def.element, vfx: def.vfxElement || null, aim: SV.cands[0], n: SV.cands.length, caster: [c.x, c.y], race: c.race };
  };
  /* arm the spell like the HUD does (targeting preview on the board) */
  SV.arm = function () {
    const c = SV.c, sp = SV.sp, t = SV.cands[SV.ci] || SV.cands[0];
    state.selectedUnitId = c.id; state.actionMode = 'spell'; state.selectedTool = sp.name;
    try { state.hoverTile = { x: t.x, y: t.y }; } catch (e) {}
    try { GAME.markDirty(); } catch (e) {}
    return t;
  };
  /* the real cast (GAME.doSpell = what CONFIRM ends in); tries the next aim when the engine refuses */
  SV.cast = function () {
    const c = SV.c, sp = SV.sp;
    for (; SV.ci < SV.cands.length; SV.ci++) {
      const t = Object.assign({}, SV.cands[SV.ci]);
      if (t.z == null) { try { t.z = GAME.getHeightAt(t.x, t.y); } catch (e) { t.z = 0; } }
      SA.tick(); try { selectUnit(c.id); } catch (e) {}
      state.actionMode = 'spell'; state.selectedTool = sp.name;
      let cx = t.x, cy = t.y, cz = t.z;
      if (t.partner != null) { const p1 = state.units.find(u => u.id === t.targetId); if (p1) state._spellPick1 = { id: p1.id, spellId: sp.id, x: p1.x, y: p1.y }; const pp = state.units.find(u => u.id === t.partner); if (pp) { cx = pp.x; cy = pp.y; cz = pp.z; } }
      const mp0 = c.mp, u0 = state.units.map(u => u.id + ':' + u.x + ',' + u.y + ':' + u.hp).join(';');
      let d = 0, thr = null;
      try { d = GAME.doSpell(c, cx, cy, cz) || 0; } catch (e) { thr = String(e && e.message || e).slice(0, 200); }
      state._spellPick1 = null;
      let busy = false; try { busy = GAME.boardBusy(); } catch (e) {}
      if (d > 0 || c.mp !== mp0 || busy || state.units.map(u => u.id + ':' + u.x + ',' + u.y + ':' + u.hp).join(';') !== u0 || thr) { SV.t0 = performance.now(); return { at: t, delay: d, thr, tried: SV.ci + 1 }; }
    }
    return { rejected: true, tried: SV.cands.length };
  };
  /* close the pause menu if something opened it */
  SV.unpause = function () {
    const els = [...document.querySelectorAll('button,div,span,a')].filter(e => /^RESUME\b/.test((e.innerText || '').trim()) && e.getBoundingClientRect().width > 0);
    if (els.length) { els[els.length - 1].click(); return true; }
    return false;
  };
  SV.status = function () {
    let busy = null; try { busy = GAME.boardBusy(); } catch (e) {}
    let cam = null;
    try { const TR = ThreeRenderer; const cm = TR.hq && TR.hq.dev && TR.hq.dev.camera && TR.hq.dev.camera(); if (cm) cam = [cm.position.x, cm.position.y, cm.position.z].map(v => +v.toFixed(2)); } catch (e) {}
    return { busy, t: Math.round(performance.now() - (SV.t0 || 0)), log: SA.logSince(SV.snap0 ? SV.snap0.log : 0).slice(-6), errs: SA.errs.slice(SV.e0 || 0, (SV.e0 || 0) + 8), cam };
  };
})();
