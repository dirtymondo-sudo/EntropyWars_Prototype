// Injected into every game page (addInitScript). Read-only recorder + draw on demand. Nothing here changes a rule.
(function () {
  if (window.__ph) return;
  var P = window.__ph = { q: [], draw: { mode: '__DRAW__', frames: 0, drawn: 0 }, seenLog: 0, round: null, logRef: null };
  function push(kind, o) { o = o || {}; o.kind = kind; o.t = Date.now(); P.q.push(o); }
  P.drain = function () { var q = P.q; P.q = []; return q; };

  /* DRAW ON DEMAND: the 3D draw is skipped unless a screenshot asked for frames. The game loop, camera, timers, picking
     (raycasts) and the HUD all keep running; only the GPU pass is dropped. Matrices are still updated so worldToScreen /
     pickAtScreen / nameplates stay right. */
  function wrap() {
    try {
      var TRr = (typeof ThreeRenderer !== 'undefined') ? ThreeRenderer : null;   // a top-level const in the game, never window.ThreeRenderer
      var r = TRr && TRr.hq && TRr.hq.dev && TRr.hq.dev.renderer();
      if (!r || r.__phWrapped) return;
      var o = r.render;
      r.render = function (s, c) {
        if (P.draw.mode === 'demand' && P.draw.frames <= 0) {
          try { if (s && s.matrixWorldAutoUpdate !== false) s.updateMatrixWorld(); if (c && !c.parent && c.matrixWorldAutoUpdate !== false) c.updateMatrixWorld(); } catch (e) {}
          return;
        }
        P.draw.drawn++;
        return o.apply(this, arguments);
      };
      r.__phWrapped = true;
    } catch (e) {}
  }
  (function raf() { if (P.draw.frames > 0 && P.draw.frames < 1e8) P.draw.frames--; requestAnimationFrame(raf); })();

  function plain(e) {
    try { if (typeof _ctPlain === 'function' && typeof _logMsg === 'function') return _ctPlain(_logMsg(e)); } catch (x) {}
    return typeof e === 'string' ? e : (e && (e.m || e.msg || e.text)) || JSON.stringify(e);
  }
  P.units = function () {
    var st = window.GAME && GAME.state; if (!st || !st.units) return [];
    return st.units.map(function (u) { return { id: u.id, name: u.name, p: u.player, hp: u.hp, maxHp: u.maxHp, mp: u.mp, ap: u.ap, x: u.x, y: u.y, z: u.z, dead: !!u.dead }; });
  };
  P.ctx = function () {
    var st = window.GAME && GAME.state; if (!st) return null;
    var act = st.units && st.units.find(function (u) { return u.id === st._blitzActiveUnitId; });
    var prev = null; try { prev = typeof getPendingDamagePreview === 'function' ? getPendingDamagePreview() : null; } catch (e) {}
    var txt = ''; try { txt = document.body.innerText || ''; } catch (e) {}
    var fc = (txt.match(/[-−]\s?\d{1,5}\s?\(\d{1,5}\s?[-–]\s?\d{1,5}\)|≈\s?[-−]\d{1,5}/g) || []).slice(0, 12);
    return { round: st.round, phase: st.phase, active: act ? { id: act.id, name: act.name, p: act.player, ap: act.ap } : null,
             tool: st.selectedTool || null, pending: st.pendingTarget ? { x: st.pendingTarget.x, y: st.pendingTarget.y, unitId: st.pendingTarget.unitId || null, tool: st.pendingTarget.tool || null } : null,
             preview: prev ? { unitId: prev.unitId, dmg: prev.dmg, lethal: !!prev.lethal } : null, forecastText: fc, units: P.units() };
  };
  P.record = function () {
    try { if (typeof buildMatchRecord === 'function') return buildMatchRecord(); } catch (e) {}
    var st = GAME.state;
    return { round: st.round, winner: st.winner, matchKills: st.matchKills, matchScores: st.matchScores, units: P.units() };
  };
  P.busy = function () {
    try { if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive && ThreeRenderer.isActive()) {
      if (typeof ThreeRenderer.hasBlockingAnims === 'function') return !!ThreeRenderer.hasBlockingAnims();
      if (typeof ThreeRenderer.hasActiveAnims === 'function') return !!ThreeRenderer.hasActiveAnims(); } } catch (e) {}
    return false;
  };
  setInterval(function () {
    wrap();
    var st = window.GAME && GAME.state; if (!st) return;
    var L = st._fullLogEntries || st.logEntries;
    if (L) {
      /* _fullLogEntries is newest-first in some builds: count growth, read the new ones from whichever end moved */
      if (P.logRef !== L) { P.logRef = L; P.seenLog = 0; P.logHead = L[0]; }
      var n = L.length;
      if (n > P.seenLog) {
        var fresh = n - P.seenLog, newestFirst = P.logHead !== undefined && L[0] !== P.logHead;
        var items = newestFirst ? L.slice(0, fresh).reverse() : L.slice(n - fresh);
        items.forEach(function (e) { push('log', { round: st.round, m: plain(e) }); });
        P.seenLog = n; P.logHead = L[0];
      } else if (n < P.seenLog) { P.seenLog = n; P.logHead = L[0]; }
    }
    if (st.phase === 'battle' && st.round !== P.round) {
      push('round', { from: P.round, to: st.round, record: P.round === null ? null : P.record() });
      P.round = st.round;
    }
    if (st.winner && !P.won) { P.won = true; push('end', { winner: st.winner, record: P.record() }); }
    if (!st.winner) P.won = false;
    if (st.phase !== 'battle') P.round = null;
  }, 500);
})();
