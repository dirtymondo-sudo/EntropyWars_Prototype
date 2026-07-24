const h = React.createElement;
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const EW = {
  // Neutral bone-on-black base — the old navy/gold "hologram" chrome is
  // gone; color now means something (faction, spell job, danger).
  bg:       '#070706',
  panel:    'rgba(10,10,9,0.85)',
  panelEdge:'rgba(200,192,165,0.16)',
  panelEdgeHi:'rgba(228,220,196,0.32)',
  ink:      '#eceadd',
  inkMute:  '#979181',
  inkDim:   '#6a665a',
  space:    '#5fd6ff',
  time:     '#f2c468',
  chaos:    '#e168c8',
  human:    '#a0a0c3',
  alien:    '#32aa50',
  divine:   '#dcaa1e',
  unholy:   '#9632b4',
  anomaly:  '#dc3c82',
  tech:     '#28a0be',
  good:     '#6ee2a8',
  bad:      '#ff7a8a',
  warn:     '#f2c468',
};

// ── Canonical vital-bar palette (shared with the 3D nameplates in
// three-renderer.js and the inspect card in styles-base.css): ally HP is
// ALWAYS green, enemy HP is ALWAYS red — no low-health hue swap — and MP
// is always the same blue. Fills fade to a pale tip at the leading edge.
const HP_ALLY = '#2ed158';
const HP_ENEMY = '#ff4a56';
const MP_BLUE = '#2f9dff';
const HP_ALLY_FILL = 'linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%)';
const HP_ENEMY_FILL = 'linear-gradient(90deg, #d92f3c 0%, #ff4a56 60%, #ff96a0 100%)';
const MP_FILL = 'linear-gradient(90deg, #1f7fd6 0%, #2f9dff 60%, #8fd0ff 100%)';
const HP_ALLY_GLOW = '0 0 6px rgba(46,209,88,0.45)';
const HP_ENEMY_GLOW = '0 0 6px rgba(255,74,86,0.45)';
const MP_GLOW = '0 0 6px rgba(47,157,255,0.4)';

const FACTION_COLORS = { space: EW.space, time: EW.time, chaos: EW.chaos };
const TYPE_COLORS = { human: EW.human, alien: EW.alien, divine: EW.divine, unholy: EW.unholy, anomaly: EW.anomaly, tech: EW.tech };
// Brightened text colors for the canonical type badge (legible over any background).
const TYPE_TEXT_COLORS = { human: '#c8c8e4', divine: '#f2c63c', unholy: '#c566e2', tech: '#4ecbe2', anomaly: '#ff5e98', alien: '#56d178' };

// ── THE single, canonical type/kind badge used EVERYWHERE ──
// Cut-corner chip: bright colored text on a tinted-over-dark fill + colored
// border. `base` drives the tint/border; pass a type key to `typeBadgeStyle`
// via opts.text for the brightened reading color. Non-type kinds (ATTACK,
// COMBO, …) just pass their own color as base and reuse the same shape.
function typeBadgeStyle(base, opts) {
  opts = opts || {};
  return {
    display: 'inline-flex', alignItems: 'center', flexShrink: 0,
    fontFamily: '"DotGothic16", monospace', fontSize: opts.fontSize || 9, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.3,
    color: opts.text || base,
    background: 'linear-gradient(' + base + '22,' + base + '22), rgba(10,10,9,0.82)',
    border: '1px solid ' + base + 'aa',
    padding: opts.padding || '2px 7px',
    textShadow: '0 1px 2px rgba(0,0,0,0.85)',
    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
  };
}
function typeBadgeStyleFor(typeKey, opts) {
  const k = (typeKey || '').toLowerCase();
  const base = TYPE_COLORS[k] || EW.inkMute;
  return typeBadgeStyle(base, Object.assign({ text: TYPE_TEXT_COLORS[k] || base }, opts || {}));
}

const ALLY_COLOR  = '#4a9eff';
const ENEMY_COLOR = '#ff4a5a';

function getAllianceColor(unit) {
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  if (!unit) return ALLY_COLOR;
  return unit.player === viewer ? ALLY_COLOR : ENEMY_COLOR;
}

function getFactionColor(unit) {
  if (!unit) return EW.space;

  if (unit.faction && FACTION_COLORS[unit.faction]) return FACTION_COLORS[unit.faction];

  const race = (unit.race || '').toLowerCase();
  if (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[race]) {
    const f = RACE_PROFILES[race].faction;
    if (f && FACTION_COLORS[f]) return FACTION_COLORS[f];
  }
  return EW.space;
}

function getTypeColor(unit) {
  if (!unit) return EW.human;
  const types = unit.types || [];
  const first = types[0];
  return TYPE_COLORS[first] || EW.human;
}

function getTypeName(unit) {
  if (!unit) return '';
  const types = unit.types || [];
  return types[0] ? types[0].charAt(0).toUpperCase() + types[0].slice(1) : '';
}

function getUnitFaction(unit) {
  if (!unit) return 'space';
  if (unit.faction) return unit.faction;
  const race = (unit.race || '').toLowerCase();
  if (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[race]) {
    return RACE_PROFILES[race].faction || 'space';
  }
  return 'space';
}

function useGameState() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let pending = false;
    function handler() {

      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        setTick(t => t + 1);
      });
    }
    window.addEventListener('ew-state-change', handler);
    // Status effects / stat stages can land or wear off outside a markDirty()
    // (DoT ticks, duration expiry, censer purges) — battle.js announces those
    // on the RenderBus, so listen there too and repaint the same frame. The
    // handler is rAF-coalesced above, so bursts cost one render.
    const bus = window.RenderBus;
    if (bus) {
      bus.on('unit:statusChanged', handler);
      bus.on('unit:damaged', handler);
    }
    return () => {
      window.removeEventListener('ew-state-change', handler);
      if (bus) {
        bus.off('unit:statusChanged', handler);
        bus.off('unit:damaged', handler);
      }
    };
  }, []);

  const G = window.GAME;
  if (!G) return [null, tick];
  return [G.state, tick];
}

/* ⚛ battle.js addEntropy() pokes this so gauge changes repaint immediately
   (the HUD re-renders on 'ew-state-change'). */
window._updateEntropyGaugeHUD = function() {
  try { window.dispatchEvent(new Event('ew-state-change')); } catch (e) {}
};

/* ── Menu visibility gate ─────────────────────────────────────────
   The action menu (and every sub/quick panel) must VANISH the instant
   the board goes live — walk animations, spell VFX, camera travel,
   projectiles, deaths — and only return once the dust settles. This
   mirrors the exact signals the engine's own _waitForAnimationsThen
   turn loop watches, surfaced via GAME.boardBusy(). */
function _hudBoardBusy(st) {
  if (!st) return false;
  if (st._walkAnimActive) return true;          // set by battle.js + online.js walks
  // CAMERA-ONLY motion (unit-select pan, back-out reset, turn-start glide,
  // the caster→target preview while browsing a ✓ pick) must NEVER hide the
  // menu while the player is free to act — waiting out a 400–700ms glide
  // for the command list to pop back was the single biggest "the menu feels
  // laggy" complaint. Real action playback still hides it through the
  // walk / VFX / projectile / dying flags plus _actionExecuting.
  const _camIgnorable = !st._actionExecuting;
  const G = window.GAME;
  try {
    if (G && typeof G.boardBusy === 'function') return !!G.boardBusy({ ignoreCamera: _camIgnorable });
    // Fallbacks for an older battle.js that doesn't export boardBusy yet:
    if (st.units && st.units.some(u => u._dying)) return true;
    if (!_camIgnorable && G && G._camera && typeof G._camera.isBusy === 'function' && G._camera.isBusy()) return true;
    if (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.isActive()
        && typeof ThreeRenderer.hasActiveAnims === 'function' && ThreeRenderer.hasActiveAnims()) return true;
    if (typeof ThreeVFX !== 'undefined' && typeof ThreeVFX.hasActiveParticles === 'function'
        && ThreeVFX.hasActiveParticles()) return true;
  } catch (_) {}
  return false;
}

/* Confirm-click hold: any handler that fires an animated action calls
   window._hrlgNoteAction() in the same tick — the menus drop on the very
   next render (forced via ew-state-change), before the engine's own busy
   flags even flip. Zero-delay "your input registered" feedback. */
window._hrlgNoteAction = function (ms) {
  // 300ms default: just long enough to bridge click → the engine's own busy
  // flags flipping. Animated actions keep the menu down via those flags; a
  // longer fixed hold only added dead air before the menu came back.
  window._hrlgHoldUntil = performance.now() + (ms || 300);
  try { window.dispatchEvent(new Event('ew-state-change')); } catch (_) {}
};

// True while menus should hide. Re-renders only on hidden↔shown
// transitions; a light 50ms boolean poll catches animations that start
// or end without dispatching a state-change event.
function useMenusHidden(st) {
  const [, setN] = useState(0);
  const ref = useRef({ lastBusy: 0, hidden: false, hiddenSince: 0 });
  const LINGER = 100;   // debounce so back-to-back anims don't strobe the menu
  /* Failsafe: menu visibility hangs off busy FLAGS — if one ever sticks
     (a VFX that never reports done, a camera that never settles), the whole
     command UI vanishes with no recovery. If we've been hidden for > 4 s
     while it's a local human's turn and nothing is executing, a flag has
     stuck: show the menus anyway. */
  const FAILSAFE_MS = 4000;
  const compute = (t, stArg) => {
    let hid = (t - ref.current.lastBusy < LINGER) || (window._hrlgHoldUntil || 0) > t;
    if (hid) {
      if (!ref.current.hiddenSince) ref.current.hiddenSince = t;
      if (t - ref.current.hiddenSince > FAILSAFE_MS
          && stArg && stArg.phase === 'battle' && !stArg.winner
          && !stArg._actionExecuting && !stArg.autoPlayers?.[stArg.activePlayer]) {
        hid = false;
      }
    } else {
      ref.current.hiddenSince = 0;
    }
    return hid;
  };
  const now = performance.now();
  if (_hudBoardBusy(st)) ref.current.lastBusy = now;
  const hidden = compute(now, st);
  ref.current.hidden = hidden;
  useEffect(() => {
    const iv = setInterval(() => {
      const t = performance.now();
      const _st = window.GAME && window.GAME.state;
      if (_hudBoardBusy(_st)) ref.current.lastBusy = t;
      const next = compute(t, _st);
      if (next !== ref.current.hidden) setN(n => n + 1);
    }, 50);
    return () => clearInterval(iv);
  }, []);
  return hidden;
}

function ClipPanel({ children, style, factionColor, corner = 14, ...props }) {
  const fc = factionColor || EW.space;
  return h('div', {
    style: {
      position: 'relative',
      background: EW.panel,
      border: '1px solid ' + EW.panelEdge,
      clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${corner}px), calc(100% - ${corner}px) 100%, 0 100%)`,
      ...style,
    },
    ...props,
  },

    h('div', { style: {
      position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
      background: fc, boxShadow: '0 0 10px ' + fc,
    }}),
    children
  );
}

function HudBar({ label, val, max, color, pip, small, pressFlash }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  const fontSize = small ? 7 : 8;
  const barH = small ? 3 : 5;
  return h('div', { className: pressFlash ? 'hud-ap-press' : undefined, style: { display: 'flex', alignItems: 'center', gap: small ? 4 : 6 }},
    h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: fontSize,
      color: EW.inkDim, letterSpacing: '0.16em', width: small ? 10 : 14,
    }}, label),
    pip
      ? h('div', { style: { flex: 1, display: 'flex', gap: 3 }},
          Array.from({ length: max }).map((_, i) =>
            h('div', { key: i, style: {
              flex: 1, height: barH,
              background: i < val ? color : 'rgba(255,255,255,0.08)',
              boxShadow: i < val ? '0 0 6px ' + color + '88' : 'none',
            }})
          )
        )
      : h('div', { style: {
          flex: 1, height: barH, background: 'rgba(255,255,255,0.05)', position: 'relative',
        }},
          h('div', { style: {
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: pct + '%',
            background: 'linear-gradient(90deg, ' + color + ', ' + color + 'aa)',
            boxShadow: '0 0 6px ' + color + '55',
            transition: 'width 0.35s ease-out',
          }})
        ),
    !small && h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: small ? 8 : 10,
      color: EW.ink, fontWeight: 600, width: 62, textAlign: 'right',
    }}, val + '/' + max)
  );
}

function TypeChip({ name, color }) {
  const k = (name || '').toLowerCase();
  const base = color || TYPE_COLORS[k] || EW.inkMute;
  return h('span', { style: typeBadgeStyle(base, { text: TYPE_TEXT_COLORS[k] || base, fontSize: 8 }) },
    (name || '').toUpperCase());
}

function UnitSprite({ unit, size, glow }) {
  // Races with dedicated close-up portrait art (sprites.js RACE_PORTRAITS)
  // show it in every HUD slot (active-unit panel, turn-clock flanks, lists)
  // instead of the full-body map sprite. Portraits are square face crops, so
  // they fill the frame (cover/center) rather than sitting on its floor.
  const [src, isPortrait] = useMemo(() => {
    if (!unit) return ['', false];
    if (typeof getUnitPortraitUrl === 'function') {
      const p = getUnitPortraitUrl(unit);
      if (p) return [p, true];
    }
    if (typeof getUnitSprite === 'function') return [getUnitSprite(unit.cls, unit.player, unit), false];
    if (typeof getR2RaceSpriteUrl === 'function') {
      return [getR2RaceSpriteUrl(unit.race, unit.gender || 'male', unit.cls || 'Freelancer') || '', false];
    }
    return ['', false];
  }, [unit?.id, unit?.race, unit?.cls, unit?.gender, unit?.player]);

  const fc = getFactionColor(unit);
  return h('div', { style: {
    width: size, height: size * 1.4,
    background: 'linear-gradient(180deg, ' + fc + '1a, rgba(0,0,0,0.5))',
    border: '1px solid ' + EW.panelEdge,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative', flexShrink: 0,
  }},
    src && h('div', { style: {
      width: '100%', height: '100%',
      backgroundImage: 'url(' + src + ')',
      backgroundSize: isPortrait ? 'cover' : 'contain', backgroundRepeat: 'no-repeat',
      backgroundPosition: isPortrait ? 'center' : 'center bottom',
      imageRendering: 'pixelated',
      filter: glow ? 'drop-shadow(0 0 4px ' + fc + ')' : 'none',
    }})
  );
}

/* ActiveUnitPanel (the top-left unit card) is GONE — the horologe action
   menu now carries everything it showed: the clock face wears the active
   unit's portrait, the core line reads slot + name, a sub-line adds
   Lv · race · job, and HP/MP/AP live in the vitals under the watch. One
   instrument, zero duplicated chrome. */

function _getMultiplayerMode() {
  if (typeof getActiveMultiplayerMode === 'function') {
    try { return getActiveMultiplayerMode(); } catch(e) {}
  }
  return null;
}

function _getModeInfo(st) {
  const mpMode = _getMultiplayerMode();
  const id = mpMode ? mpMode.id : 'arena';
  const units = st.units || [];
  const p1Units = units.filter(u => u.player === 1);
  const p2Units = units.filter(u => u.player === 2);

  const p1Alive = p1Units.filter(u => !u.dead).length;
  const p2Alive = p2Units.filter(u => !u.dead).length;
  const p1Total = p1Units.length;
  const p2Total = p2Units.length;

  const p1Hp = p1Units.reduce((s, u) => s + Math.max(0, u.hp || 0), 0);
  const p1MaxHp = p1Units.reduce((s, u) => s + (u.maxHp || 1), 0);
  const p2Hp = p2Units.reduce((s, u) => s + Math.max(0, u.hp || 0), 0);
  const p2MaxHp = p2Units.reduce((s, u) => s + (u.maxHp || 1), 0);

  const p1Kills = st.matchKills ? (st.matchKills[1] || 0) : 0;
  const p2Kills = st.matchKills ? (st.matchKills[2] || 0) : 0;

  const p1Pts = st.matchScores ? (st.matchScores[1] || 0) : 0;
  const p2Pts = st.matchScores ? (st.matchScores[2] || 0) : 0;

  const p1Wins = st.record ? (st.record[1] || 0) : 0;
  const p2Wins = st.record ? (st.record[2] || 0) : 0;

  /* No "N/M ALIVE" text for kill modes — dead units stay in the turn-clock
     flank as skull chips, which says the same thing without a text row. */
  if (id === 'tdm' || id === 'ffa') {
    return {
      id, label: mpMode.label,
      p1Score: p1Kills, p2Score: p2Kills,
      scoreLabel: 'KILLS',
      p1Wins, p2Wins,
    };
  }
  if (id === 'gauntlet') {
    return {
      id, label: mpMode.label,
      p1Score: p1Kills, p2Score: p2Kills,
      scoreLabel: 'KILLS',
      p1Wins, p2Wins,
    };
  }
  if (id === 'domination' || id === 'hotspot') {
    return {
      id, label: mpMode.label,
      p1Score: p1Pts, p2Score: p2Pts,
      scoreLabel: 'PTS',
      p1Sub: p1Kills + '', p2Sub: p2Kills + '',
      subLabel: 'KILLS',
      p1Wins, p2Wins,
    };
  }
  if (id === 'ctf') {
    return {
      id, label: mpMode.label,
      p1Score: p1Pts, p2Score: p2Pts,
      scoreLabel: 'CAPS',
      p1Sub: p1Kills + '', p2Sub: p2Kills + '',
      subLabel: 'KILLS',
      p1Wins, p2Wins,
    };
  }

  const ARENA_PTS = window.ARENA_PTS || { kill: 15, towerDmgPer10: 1, towerDmgCap: 150, hourglass: 35, nexusRound: 6 };
  function _arenaScore(p) {
    const enemy = p === 1 ? 2 : 1;
    let pts = 0;
    pts += p1Kills * ARENA_PTS.kill;
    const eTw = st.towers && st.towers[enemy];
    let tDmg = 0;
    if (eTw) tDmg = Math.max(0, (eTw.maxHp || 1500) - eTw.hp);
    pts += Math.min(Math.floor(tDmg / ((eTw && eTw.maxHp) || 1500) * 250) * ARENA_PTS.towerDmgPer10, ARENA_PTS.towerDmgCap || Infinity);
    let hgCount = 0;
    if (st.hourglasses) {
      hgCount = st.hourglasses.filter(hg => {
        if (!hg.carriedBy) return false;
        const c = (st.units || []).find(u => u.id === hg.carriedBy);
        return c && !c.dead && c.player === p;
      }).length;
    }
    pts += hgCount * ARENA_PTS.hourglass;
    pts += (st._arenaNexusControl && st._arenaNexusControl[p] || 0) * ARENA_PTS.nexusRound;
    pts += (st._arenaBountyPts && st._arenaBountyPts[p] || 0);
    return pts;
  }

  const p1ArenaKills = p1Kills * ARENA_PTS.kill;
  const p2ArenaKills = p2Kills * ARENA_PTS.kill;
  function _fullArenaScore(p) {
    const enemy = p === 1 ? 2 : 1;
    const kills = (st.matchKills ? (st.matchKills[p] || 0) : 0);
    let pts = kills * ARENA_PTS.kill;
    const eTw = st.towers && st.towers[enemy];
    if (eTw) pts += Math.min(Math.floor(Math.max(0, (eTw.maxHp || 1500) - eTw.hp) / (eTw.maxHp || 1500) * 250) * ARENA_PTS.towerDmgPer10, ARENA_PTS.towerDmgCap || Infinity);
    if (st.hourglasses) {
      pts += st.hourglasses.filter(hg => {
        if (!hg.carriedBy) return false;
        const c = (st.units || []).find(u => u.id === hg.carriedBy);
        return c && !c.dead && c.player === p;
      }).length * ARENA_PTS.hourglass;
    }
    pts += (st._arenaNexusControl && st._arenaNexusControl[p] || 0) * ARENA_PTS.nexusRound;
    pts += (st._arenaBountyPts && st._arenaBountyPts[p] || 0);
    return pts;
  }

  const p1Tower = st.towers && st.towers[1];
  const p2Tower = st.towers && st.towers[2];
  const p1TowerHp = p1Tower ? Math.max(0, p1Tower.hp) : 0;
  const p1TowerMax = p1Tower ? (p1Tower.maxHp || 1500) : 0;
  const p2TowerHp = p2Tower ? Math.max(0, p2Tower.hp) : 0;
  const p2TowerMax = p2Tower ? (p2Tower.maxHp || 1500) : 0;

  /* Nexus ownership pips — one per zone (cave/earth/sky). Owning ALL zones
     on a 3-zone map is an instant win, so the scoreboard shows live zone
     control and screams when one team is a single zone from victory. */
  let nexusPips = null, nexusAlertPlayer = 0;
  if (st.nexusPoints) {
    const labels = window.NEXUS_LABELS || {};
    nexusPips = Object.keys(st.nexusPoints).filter(k => st.nexusPoints[k]).map(k => ({
      key: k, name: labels[k] || k, icon: '⬡',
      owner: st.nexusPoints[k].owner || 0,
      progress: st.nexusPoints[k].progress || 0,
    }));
    if (nexusPips.length >= 3) {
      for (const p of [1, 2]) {
        const owned = nexusPips.filter(z => z.owner === p).length;
        if (owned === nexusPips.length - 1) nexusAlertPlayer = p;
      }
    } else if (nexusPips.length === 0) {
      nexusPips = null;
    }
  }

  return {
    id: 'arena', label: 'Arena',
    p1Score: _fullArenaScore(1), p2Score: _fullArenaScore(2),
    scoreLabel: 'ARENA',
    showTowerHp: true,
    p1TowerHp, p1TowerMax, p2TowerHp, p2TowerMax,
    p1Wins, p2Wins,
    nexusPips, nexusAlertPlayer,
  };
}

/* ── Unified scoreboard turn-order data ──────────────────────────────────────
   Build one entry per ALIVE unit, tagged with where it sits in the blitz turn
   queue (`sortKey`: active first, then pending by queue index, then units that
   already acted this round — they go to the outer edge of each flank). This is
   what folds the old right-side TURN ORDER clock and the bottom-right roster
   into the scoreboard. */
function _scoreboardTurnData(st) {
  const units = (st.units || []).filter(u => !u.dead);
  const activeId = st._blitzActiveUnitId;
  /* Dead units stay on the clock as greyed skull chips pinned to the outer
     edge of each flank — that IS the alive-count readout (replaces the old
     "3/4 ALIVE" text row). */
  const DEAD_KEY = 9999 * 3;
  const deadChips = (st.units || []).filter(u => u.dead).map(u => ({
    id: u.id, unit: u, active: false, finished: false, dead: true, sortKey: DEAD_KEY,
  }));
  /* SIMUL mode: units idle at 0 AP between orders, so the blitz "finished"
     dimming would grey the whole roster. Nobody is ever spent (any unit can
     be ordered every turn) — rank the flanks by SPD instead, which IS the
     resolution order, so the display doubles as a who-acts-first chart. */
  const simul = typeof window._isSimulMode === 'function' && window._isSimulMode();
  if (simul) {
    return units.map(u => ({
      id: u.id, unit: u,
      active: u.id === activeId,
      finished: false,
      sortKey: u.id === activeId ? -1 : (1000 - (u.spd || 0)),
    })).concat(deadChips);
  }
  const G = window.GAME;
  const orderIds = (G && G.blitzTurnOrderIds) ? G.blitzTurnOrderIds : null;
  const idx = {};
  if (orderIds && orderIds.length) {
    orderIds.forEach((id, i) => { if (idx[id] == null) idx[id] = i; });
  }
  const BIG = 9999;
  return units.map(u => {
    const acted = typeof unitFinished === 'function' ? unitFinished(u) : ((u.ap || 0) <= 0);
    const active = u.id === activeId;
    const finished = acted && !active;
    let ti = idx[u.id]; if (ti == null) ti = BIG;
    const sortKey = active ? -1 : (finished ? BIG * 2 + ti : ti);
    return { id: u.id, unit: u, active, finished, sortKey };
  }).concat(deadChips);
}

/* One unit in a flank: sprite + tiny HP/MP bars. The unit acting soonest on
   each side sits closest to centre and is drawn biggest; the active unit also
   gets the glowing NOW frame. `size` is decided by the flank so a team of 8
   packs tighter than a team of 2. Friendly chips are clickable to select
   (replaces the old roster click target). */
function TurnChip({ entry, size }) {
  const u = entry.unit;
  const ac = getAllianceColor(u);
  const active = entry.active;
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const friendly = u.player === viewer;
  const hpPct = u.maxHp > 0 ? Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100)) : 0;
  const mpPct = u.maxMp > 0 ? Math.max(0, Math.min(100, (u.mp / u.maxMp) * 100)) : 0;
  const name = typeof unitDisplayName === 'function' ? unitDisplayName(u) : (u.name || u.cls);

  /* Dead: greyed portrait with a skull stamped over it — the flank's silent
     alive-counter. No bars, no click, no labels. */
  if (entry.dead) {
    return h('div', {
      className: 'ew-turn-chip ew-turn-chip-dead',
      title: name + ' — DOWN',
      style: {
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        opacity: 0.5, filter: 'saturate(0.08) brightness(0.8)', padding: '0 1px',
      },
    },
      h('div', { style: { width: size, height: 2, background: ac, opacity: 0.3 }}),
      h('div', { style: { position: 'relative' }},
        h(UnitSprite, { unit: u, size }),
        h('div', { style: {
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.max(11, Math.round(size * 0.62)), lineHeight: 1, color: '#e8e4d8',
          textShadow: '0 0 4px #000, 0 1px 2px #000', background: 'rgba(0,0,0,0.45)',
          pointerEvents: 'none',
        }}, '☠'),
      ),
      h('div', { style: { height: 6 }}),
    );
  }

  return h('div', {
    className: active ? 'ew-turn-chip ew-turn-chip-active' : 'ew-turn-chip',
    title: name + '  ' + Math.max(0, Math.round(u.hp || 0)) + '/' + (u.maxHp || 0) +
      (u.maxMp > 0 ? '  ·  MP ' + Math.max(0, Math.round(u.mp || 0)) + '/' + u.maxMp : ''),
    onClick: () => { if (friendly && typeof selectUnit === 'function') selectUnit(u.id); },
    style: {
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      cursor: friendly ? 'pointer' : 'default',
      opacity: entry.finished ? 0.42 : 1,
      filter: entry.finished ? 'saturate(0.45)' : 'none',
      padding: '0 1px',
    },
  },

    h('div', { style: {
      width: size, height: 2, background: ac, opacity: active ? 1 : 0.6,
      boxShadow: active ? '0 0 7px ' + ac : 'none',
    }}),

    h('div', { style: { position: 'relative' }},
      h(UnitSprite, { unit: u, size, glow: active }),
      active && h('div', { style: {
        position: 'absolute', inset: -2, border: '1px solid ' + ac,
        boxShadow: '0 0 10px ' + ac + ', inset 0 0 7px ' + ac + '55', pointerEvents: 'none',
      }}),
    ),

    h('div', { style: { width: size, display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }},
      h('div', { style: {
        height: 3, background: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden',
      }},
        h('div', { style: {
          position: 'absolute', top: 0, left: 0, bottom: 0, width: hpPct + '%',
          background: friendly ? HP_ALLY_FILL : HP_ENEMY_FILL,
          boxShadow: friendly ? HP_ALLY_GLOW : HP_ENEMY_GLOW,
          transition: 'width 0.35s ease-out',
        }}),
      ),
      u.maxMp > 0 && h('div', { style: {
        height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden',
      }},
        h('div', { style: {
          position: 'absolute', top: 0, left: 0, bottom: 0, width: mpPct + '%',
          background: MP_FILL, boxShadow: MP_GLOW, transition: 'width 0.35s ease-out',
        }}),
      ),
    ),

    h('div', { style: { height: 9, display: 'flex', alignItems: 'center' }},
      active
        ? h('span', { style: {
            fontFamily: '"Cinzel", serif', fontStyle: 'italic', fontSize: 8, lineHeight: 1,
            color: ac, letterSpacing: '0.04em', textShadow: '0 0 6px ' + ac + '88',
          }}, 'NOW')
        : entry.next
          ? h('span', { style: {
              fontFamily: '"Cinzel", serif', fontStyle: 'italic', fontSize: 8, lineHeight: 1,
              color: EW.ink, letterSpacing: '0.04em', opacity: 0.8,
              textShadow: '0 0 5px rgba(236,234,221,0.45)',
            }}, 'NEXT')
          : null,
    ),
  );
}

function TurnFlank({ st, player, side, nextId }) {
  const data = _scoreboardTurnData(st).filter(e => e.unit.player === player);
  data.sort((a, b) => (a.sortKey - b.sortKey) || ((b.unit.spd || 0) - (a.unit.spd || 0)));
  if (data.length === 0) return null;
  data.forEach(e => { e.next = !!nextId && e.id === nextId; });

  // Show every unit up to a hard cap; beyond that, summarise the tail (acting
  // last) as a "+N" tile so the bar never grows unbounded.
  const CAP = 10;
  let visible = data, overflow = 0;
  if (data.length > CAP) { overflow = data.length - (CAP - 1); visible = data.slice(0, CAP - 1); }

  // Scale sizes down as the team grows so the flank stays a sane width.
  const n = visible.length;
  const small = n >= 7 ? 18 : (n >= 5 ? 21 : 24);
  const inner = small + 6;
  const active = small + 10;

  // `visible` runs inner→outer (soonest first). chips carry their size.
  const chips = visible.map((e, i) => ({
    e, size: e.active ? active : (i === 0 && !e.dead ? inner : small),
  }));

  let nodes = chips.map(({ e, size }) => h(TurnChip, { key: e.id, entry: e, size }));
  if (overflow > 0) {
    nodes.push(h('div', {
      key: 'overflow',
      title: overflow + ' more',
      style: {
        alignSelf: 'center', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkMute, letterSpacing: '0.04em', padding: '0 3px',
        border: '1px solid ' + EW.panelEdge, background: 'rgba(0,0,0,0.3)',
        minWidth: small, height: small, display: 'flex', alignItems: 'center', justifyContent: 'center',
      },
    }, '+' + overflow));
  }

  // Left flank mirrors so "soonest" stays adjacent to the centre score.
  const display = side === 'left' ? nodes.slice().reverse() : nodes;
  return h('div', { style: {
    display: 'flex', alignItems: 'flex-start', gap: 3,
    justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
  }}, display);
}

/* One team's side of the strip: a slim stacked name block (dot + name, plus
   tower HP / kills sub when the mode has one) sitting BESIDE the turn-ordered
   portrait flank — everything vertically centred in one thin row. */
function ScoreSideColumn({ st, mode, player, side, color, nextId }) {
  const isRight = side === 'right';
  const mono = '"DotGothic16", monospace';
  const name = (st._teamNames && st._teamNames[player]) || ('P' + player);
  const sub = player === 1 ? mode.p1Sub : mode.p2Sub;
  const showTower = mode.showTowerHp;
  const towerHp = player === 1 ? mode.p1TowerHp : mode.p2TowerHp;
  const towerMax = player === 1 ? mode.p1TowerMax : mode.p2TowerMax;
  const towerPct = towerMax > 0 ? (towerHp / towerMax) * 100 : 0;
  const _towerViewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const towerColor = player === _towerViewer ? HP_ALLY : HP_ENEMY;

  return h('div', { style: {
    display: 'flex', alignItems: 'center', gap: 9,
    flexDirection: isRight ? 'row' : 'row-reverse',
    padding: '5px 10px', minWidth: 92, justifyContent: 'flex-end',
  }},

    h('div', { style: {
      display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 118,
      alignItems: isRight ? 'flex-start' : 'flex-end',
    }},
      h('div', { style: {
        display: 'flex', alignItems: 'center', gap: 5,
        flexDirection: isRight ? 'row' : 'row-reverse',
      }},
        h('span', { style: {
          width: 5, height: 5, background: color, borderRadius: '50%',
          boxShadow: '0 0 7px ' + color, flexShrink: 0,
        }}),
        h('span', { style: {
          fontFamily: mono, fontSize: 12, letterSpacing: '0.12em',
          color: EW.ink, fontWeight: 600, whiteSpace: 'nowrap',
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6)',
        }}, name),
      ),
      sub != null && !showTower && h('span', { style: {
        fontFamily: mono, fontSize: 9, color: EW.inkMute, letterSpacing: '0.08em', whiteSpace: 'nowrap',
        textShadow: '0 1px 3px rgba(0,0,0,0.95)',
      }}, sub + (mode.subLabel ? ' ' + mode.subLabel : '')),
      showTower && towerMax > 0 && h('div', { style: {
        width: 74, display: 'flex', flexDirection: 'column', gap: 2,
        alignItems: isRight ? 'flex-start' : 'flex-end',
      }},
        h('div', { style: { width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', position: 'relative' }},
          h('div', { style: {
            position: 'absolute', top: 0, bottom: 0, [isRight ? 'left' : 'right']: 0,
            width: towerPct + '%',
            background: player === _towerViewer ? HP_ALLY_FILL : HP_ENEMY_FILL,
            boxShadow: '0 0 6px ' + towerColor + '55',
          }}),
        ),
        h('span', { style: {
          fontFamily: mono, fontSize: 8, color: EW.inkMute, letterSpacing: '0.08em',
          textShadow: '0 1px 3px rgba(0,0,0,0.95)',
        }}, '🏰 ' + towerHp + '/' + towerMax),
      ),
    ),

    h(TurnFlank, { st, player, side, nextId }),
  );
}

/* ⚛ ENTROPY WINGS — one blade-shaped gauge per team FLANKING the scoreboard
   (P1 left, P2 right), tapering to a point outward with the ⚛ core glyph at
   the tip. The fill charges from the scoreboard outward as flowing violet
   plasma (animated gradient + shimmer sweep + pulsing leading-edge flare);
   past 70% the whole blade starts to bloom, and at full it blazes with a
   READY label + spinning glyph. Fed by battle.js addEntropy via glowing orbs
   (_entropyOrbsFly below — ids ewEntropyMeterP1/2 unchanged). */
function EntropyWing({ st, player, side }) {
  const max = window.ENTROPY_GAUGE_MAX || 100;
  const val = (st.entropyGauge && st.entropyGauge[player]) || 0;
  const pct = Math.max(0, Math.min(100, (val / max) * 100));
  const full = val >= max;
  const surging = !full && pct >= 70;
  const team = player === 1 ? EW.space : EW.chaos;
  const left = side === 'left';
  const mono = '"DotGothic16", monospace';

  /* long sleek PS1 energy line: a thin skewed groove that DISSOLVES toward
     the outer tip (mask fade — no hard cut), growing out of a bright
     team-colored socket at the inner end, ⚛ + tiny caps label riding above. */
  const innerEdge = left ? 'right' : 'left';
  const fadeDir = left ? 'to left' : 'to right';
  const skew = left ? 'skewX(20deg)' : 'skewX(-20deg)';
  const tailMask = 'linear-gradient(' + fadeDir + ', black 58%, rgba(0,0,0,0.5) 84%, transparent 99%)';
  const fillGrad = full
    ? 'linear-gradient(' + (left ? 270 : 90) + 'deg, #5c33a8, #a36cff 45%, #e8dcff 80%, #ffffff)'
    : 'linear-gradient(' + (left ? 270 : 90) + 'deg, ' + team + '59, #6a3fd0 40%, #a36cff 78%, #d9c2ff)';

  return h('div', {
    id: 'ewEntropyMeterP' + player,
    className: 'ew-entropy-wing' + (full ? ' ew-entropy-wing-full' : (surging ? ' ew-entropy-wing-surge' : '')),
    title: 'ENTROPY GAUGE — P' + player + ': ' + Math.round(val) + '/' + max +
      (full ? '  ⚛ TEAM ATTACK READY!' : '  (press-turn overflow, kills, bounties and destruction charge it)'),
    style: {
      position: 'relative', width: 'clamp(180px, 22vw, 320px)', flexShrink: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: left ? 'flex-end' : 'flex-start',
    },
  },

    /* ⚛ + tiny caps label above the line, hugging the inner end */
    h('div', { style: {
      display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1, marginBottom: 3,
      flexDirection: left ? 'row' : 'row-reverse',
      [left ? 'paddingRight' : 'paddingLeft']: 8,
    }},
      h('span', {
        className: full ? 'ew-entropy-glyph-ready' : 'ew-entropy-glyph-idle',
        style: {
          fontFamily: mono, fontSize: 11, lineHeight: 1, flexShrink: 0,
          color: full ? '#f0e8ff' : '#c9a5ff',
          textShadow: '0 0 7px rgba(163,108,255,0.9), 0 1px 3px rgba(0,0,0,0.9)',
        },
      }, '⚛'),
      h('span', {
        className: full ? 'ew-entropy-ready-label' : undefined,
        style: {
          fontFamily: mono, fontSize: 7, fontWeight: 700, letterSpacing: '0.34em',
          textIndent: left ? 0 : '0.34em',
          color: full ? '#ffffff' : 'rgba(190,170,235,0.8)',
          textShadow: full
            ? '0 0 6px #c9a5ff, 0 0 12px #a36cff, 0 1px 3px rgba(0,0,0,0.9)'
            : '0 0 6px rgba(120,80,220,0.55), 0 1px 3px rgba(0,0,0,0.9)',
        },
      }, full ? 'READY' : 'ENTROPY'),
    ),

    /* the line itself — thin skewed groove, hairline top/bottom edges,
       fading out toward the battlefield edge of the screen */
    h('div', { className: 'ew-entropy-vessel', style: {
      position: 'relative', width: '100%', height: 8, overflow: 'hidden',
      transform: skew,
      background: 'linear-gradient(180deg, rgba(14,8,30,0.78), rgba(34,20,64,0.72) 55%, rgba(10,5,22,0.82))',
      borderTop: '1px solid ' + (full ? 'rgba(201,165,255,0.9)' : 'rgba(150,120,220,0.5)'),
      borderBottom: '1px solid ' + (full ? 'rgba(201,165,255,0.9)' : 'rgba(150,120,220,0.5)'),
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
      WebkitMaskImage: tailMask, maskImage: tailMask,
    }},
      /* flowing plasma fill (grows inner → outer) */
      h('div', {
        className: 'ew-entropy-fill ' + (left ? 'ew-entropy-flow-l' : 'ew-entropy-flow-r') + (full ? ' ew-entropy-full' : ''),
        style: {
          position: 'absolute', top: 0, bottom: 0, [innerEdge]: 0,
          width: pct + '%', overflow: 'hidden',
          background: fillGrad,
          boxShadow: full ? '0 0 14px rgba(201,165,255,1)' : '0 0 8px rgba(163,108,255,0.6)',
          transition: 'width 0.45s ease',
        },
      }),
      /* leading-edge flare riding the fill front */
      !full && pct > 3 && h('div', { className: 'ew-entropy-tip', style: {
        [innerEdge]: 'calc(' + pct + '% - 6px)',
      }}),
      /* quarter ticks (measured from the inner edge, like the fill) */
      [25, 50, 75].map(t => h('div', { key: t, style: {
        position: 'absolute', top: 1, bottom: 1, [innerEdge]: t + '%',
        width: 1, background: 'rgba(0,0,0,0.55)',
      }})),
      /* bright team-colored socket cap at the inner end */
      h('div', { style: {
        position: 'absolute', top: 0, bottom: 0, [innerEdge]: 0, width: 2,
        background: team, boxShadow: '0 0 8px ' + team,
      }}),
    ),
  );
}

/* ⚛ Orb flight: little glowing motes stream from the earning unit's board
   position (or screen centre for unit-less gains) into that team's gauge.
   Called by battle.js addEntropy. Pure chrome — fixed-position divs above the
   HUD, removed on arrival with a brightness kick on the meter. */
function _entropySourceScreenPos(sourceUnit) {
  try {
    if (sourceUnit && typeof ThreeCamera !== 'undefined' && ThreeCamera.getCamera
        && typeof THREE !== 'undefined' && typeof CONFIG !== 'undefined') {
      const cam = ThreeCamera.getCamera();
      const canvas = document.querySelector('#mapRow canvas');
      if (cam && canvas) {
        const ts = CONFIG.tileSize || 64;
        const v = new THREE.Vector3(
          sourceUnit.x * ts + ts / 2,
          ((sourceUnit.z || 0) + 1.4) * ts * 0.55,
          sourceUnit.y * ts + ts / 2);
        v.project(cam);
        if (v.z < 1 && v.x >= -1.2 && v.x <= 1.2 && v.y >= -1.2 && v.y <= 1.2) {
          const r = canvas.getBoundingClientRect();
          return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
        }
      }
    }
  } catch (e) {}
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
}

window._entropyOrbsFly = function(player, amount, sourceUnit) {
  if (!amount || amount <= 0) return;
  const meter = document.getElementById('ewEntropyMeterP' + player);
  if (!meter) return;
  const mr = meter.getBoundingClientRect();
  if (!mr.width) return;
  const src = _entropySourceScreenPos(sourceUnit);
  const n = Math.max(1, Math.min(8, Math.ceil(amount / 2)));
  for (let i = 0; i < n; i++) {
    const orb = document.createElement('div');
    const size = 7 + Math.random() * 5;
    const jx = (Math.random() - 0.5) * 46, jy = (Math.random() - 0.5) * 36;
    orb.style.cssText =
      'position:fixed;z-index:5100;pointer-events:none;border-radius:50%;' +
      'width:' + size + 'px;height:' + size + 'px;' +
      'left:' + (src.x + jx - size / 2) + 'px;top:' + (src.y + jy - size / 2) + 'px;' +
      'background:radial-gradient(circle at 35% 35%, #ffffff, #c9a5ff 45%, rgba(163,108,255,0) 72%);' +
      'box-shadow:0 0 8px rgba(201,165,255,0.95), 0 0 16px rgba(163,108,255,0.6);' +
      'opacity:0;transform:scale(0.4);' +
      'transition:opacity 0.14s ease-out, transform 0.14s ease-out;';
    document.body.appendChild(orb);
    const tx = mr.left + mr.width * (0.15 + Math.random() * 0.7);
    const ty = mr.top + mr.height / 2;
    const delay = i * 55;
    // pop in…
    setTimeout(() => { orb.style.opacity = '1'; orb.style.transform = 'scale(1)'; }, 16 + delay);
    // …then arc into the gauge
    setTimeout(() => {
      orb.style.transition = 'left 0.62s cubic-bezier(0.45,-0.25,0.55,1), top 0.62s cubic-bezier(0.3,0.1,0.2,1), transform 0.62s ease-in, opacity 0.62s ease-in';
      orb.style.left = (tx - size / 2) + 'px';
      orb.style.top = (ty - size / 2) + 'px';
      orb.style.transform = 'scale(0.45)';
    }, 170 + delay);
    // arrival: kill the orb, kick the meter
    setTimeout(() => {
      orb.remove();
      const m = document.getElementById('ewEntropyMeterP' + player);
      if (m) {
        m.classList.add('ew-entropy-hit');
        setTimeout(() => m.classList.remove('ew-entropy-hit'), 200);
      }
    }, 170 + delay + 640);
  }
};

function Scoreboard({ st }) {
  if (!st) return null;

  /* ── Mystery Dungeon ─────────────────────────────────────────────────────
     Hub: no scoreboard at all (it's a town, not a match). Floors: a compact
     badge showing the dungeon name + current floor instead of score/round. */
  const mdMode = (typeof window._isDungeonMode === 'function') && window._isDungeonMode();
  if (mdMode) {
    if (st._mdPhase !== 'floor' || !st._mdRun) return null;
    const mdD = (typeof MD_DUNGEONS !== 'undefined' && st._mdRun.dungeonId && MD_DUNGEONS[st._mdRun.dungeonId]) || null;
    const mdTotal = mdD ? mdD.floors : 10;
    const mdAlive = (st.units || []).filter(u => u.player === 2 && !u.dead && !u._dying).length;
    const mdMono = '"DotGothic16", monospace';
    const mdSerif = '"Cinzel", serif';

    /* party in slot order — slot 0 (or the first survivor) is the leader */
    const mdParty = (st.units || [])
      .filter(u => u.player === 1 && !u._mdNpc && !u.dead && !u._dying)
      .sort((a, b) => (parseInt(String(a.id).split('-')[1], 10) || 0) - (parseInt(String(b.id).split('-')[1], 10) || 0));
    const mdLeader = mdParty[0] || null;
    const mdStairs = st._mdStairs;
    const mdOnStairs = !!(mdLeader && mdStairs && mdLeader.x === mdStairs.x && mdLeader.y === mdStairs.y
      && !st._mdTransitioning && !st._mdEnded);

    const TACTIC_META = {
      manual: { icon: '🎮', label: 'MANUAL', hint: 'You control this unit. Click to switch to ⚔ Auto.' },
      auto:   { icon: '⚔', label: 'AUTO',   hint: 'The AI fights for this unit. Click to switch to 🛡 Stay Close.' },
      guard:  { icon: '🛡', label: 'CLOSE',  hint: 'Auto, but regroups toward the leader. Click to switch to 🎮 Manual.' },
    };

    return h('div', {
      className: 'ew-scoreboard',
      style: {
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 10,
      },
    },
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 14,
          background: EW.panel, border: '1px solid ' + EW.panelEdge,
          boxShadow: '0 6px 28px rgba(0,0,0,0.5)', padding: '7px 20px 8px',
          clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
        },
      },
        h('span', { style: { fontFamily: mdMono, fontSize: 10, letterSpacing: '0.18em', color: EW.inkMute, textTransform: 'uppercase' } },
          (mdD ? mdD.label : 'Mystery Dungeon')),
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 3 } },
          h('span', { style: { fontFamily: mdMono, fontSize: 9, letterSpacing: '0.2em', color: EW.inkMute } }, 'FLOOR'),
          h('span', { style: { fontFamily: mdSerif, fontSize: 24, fontWeight: 600, color: EW.time, lineHeight: 1, textShadow: '0 0 10px ' + EW.time + '55', marginLeft: 4 } },
            st._mdRun.floor),
          h('span', { style: { fontFamily: mdMono, fontSize: 12, color: EW.inkMute } }, '/' + mdTotal),
        ),
        h('span', { style: { width: 1, height: 22, background: EW.panelEdge } }),
        h('span', { style: { fontFamily: mdMono, fontSize: 11, color: mdAlive ? EW.chaos : '#7fdc9a' } },
          mdAlive ? ('☠ ' + mdAlive + ' foe' + (mdAlive === 1 ? '' : 's')) : '✓ floor clear'),
        mdOnStairs
          ? h('button', {
              className: 'md-descend-btn',
              title: 'Your leader is on the stairs — descend to the next floor',
              onClick: () => { if (window._mdConfirmDescend) window._mdConfirmDescend(); },
            }, '⬇ DESCEND')
          : h('span', { style: { fontFamily: mdMono, fontSize: 10, color: EW.inkMute } }, '🗝 find the stairs'),
      ),

      /* tactic chips — one per party member; click cycles Manual → Auto → Stay Close */
      mdParty.length > 1 && h('div', { style: { display: 'flex', gap: 5, justifyContent: 'center' } },
        mdParty.map(u => {
          const t = (typeof window._mdUnitTactic === 'function' && window._mdUnitTactic(u)) || 'manual';
          const tm = TACTIC_META[t] || TACTIC_META.manual;
          const isLead = mdLeader && u.id === mdLeader.id;
          const isActive = st._blitzActiveUnitId === u.id;
          const nm = (typeof unitDisplayName === 'function' ? unitDisplayName(u) : (u.name || u.cls)) || '';
          return h('button', {
            key: u.id,
            className: 'md-tactic-chip' + (t === 'manual' ? ' manual' : '') + (isActive ? ' acting' : ''),
            title: (isLead ? 'LEADER · ' : '') + tm.hint,
            onClick: () => { if (window._mdCycleTactic) window._mdCycleTactic(u.id); },
          },
            (isLead ? '👑 ' : '') + (nm.length > 10 ? nm.slice(0, 9) + '…' : nm) + ' ' + tm.icon + ' ' + tm.label
          );
        }),
      ),
    );
  }

  const mode = _getModeInfo(st);

  const elapsed = st.startTime ? Math.floor((Date.now() - st.startTime) / 1000) : 0;
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const round = st.round || 1;
  const roundLimit = st.matchClock && st.matchClock.roundLimit ? st.matchClock.roundLimit : 0;

  const isSuddenDeath = !!st.suddenDeathActive;

  // Caption under the score = what the number counts. Avoid echoing the mode
  // name (e.g. Arena's score label is literally "ARENA") — fall back to SCORE.
  let scoreCaption = mode.scoreLabel || '';
  if (scoreCaption && mode.label && scoreCaption.toUpperCase() === mode.label.toUpperCase()) {
    scoreCaption = 'SCORE';
  }

  const mono = '"DotGothic16", monospace';
  const serif = '"Cinzel", serif';

  /* Global NEXT unit — the pending (not active, not spent, not dead) entry
     with the lowest queue key across BOTH teams; its chip gets the NEXT tag. */
  let nextId = null, _bestKey = Infinity, _bestSpd = -1;
  for (const e of _scoreboardTurnData(st)) {
    if (e.active || e.finished || e.dead) continue;
    const spd = e.unit.spd || 0;
    if (e.sortKey < _bestKey || (e.sortKey === _bestKey && spd > _bestSpd)) {
      _bestKey = e.sortKey; _bestSpd = spd; nextId = e.id;
    }
  }

  return h('div', {
    className: 'ew-scoreboard',
    style: {
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
    },
  },

    /* ⚛ ENTROPY WINGS — long sleek energy lines flanking the strip */
    h(EntropyWing, { st, player: 1, side: 'left' }),

    /* No panel box — the strip floats straight over the battlefield; each
       element carries its own contrast (chip frames, text shadows, a soft
       scrim behind the centre score only). */
    h('div', { style: {
      position: 'relative', display: 'flex', alignItems: 'center',
      filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65))',
    }},

      h(ScoreSideColumn, { st, mode, player: 1, side: 'left', color: EW.space, nextId }),

      /* centre cluster — three thin lines: mode / score / caption·time·round,
         on a side-fading scrim with hairline top/bottom edges (PS1 help-strip
         style) instead of a boxed panel. */
      h('div', { style: {
        position: 'relative', padding: '6px 18px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 116,
        background: 'linear-gradient(90deg, rgba(7,7,6,0), rgba(7,7,6,0.68) 16%, rgba(7,7,6,0.68) 84%, rgba(7,7,6,0))',
      }},
        h('div', { className: 'ew-scoreboard-sheen', style: {
          position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, ' + EW.space + '88 30%, ' + EW.chaos + '88 70%, transparent)',
        }}),
        h('div', { style: {
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(200,192,165,0.4) 30%, rgba(200,192,165,0.4) 70%, transparent)',
        }}),

        h('span', { className: isSuddenDeath ? 'ew-sudden-death' : undefined, style: {
          fontFamily: mono, fontSize: 8, letterSpacing: '0.2em', lineHeight: 1,
          color: isSuddenDeath ? EW.bad : EW.inkMute, textTransform: 'uppercase',
          textShadow: isSuddenDeath ? '0 0 8px ' + EW.bad : 'none', whiteSpace: 'nowrap',
        }}, isSuddenDeath ? '⚡ SUDDEN DEATH' : (mode.label || '')),

        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 7 }},
          h('span', { style: {
            fontFamily: serif, fontSize: 23, fontWeight: 400, lineHeight: 1,
            color: EW.ink, textShadow: '0 0 14px ' + EW.space + '66',
            minWidth: 18, textAlign: 'right',
          }}, mode.p1Score),
          h('span', { style: {
            fontFamily: serif, fontSize: 13, color: EW.inkDim, fontStyle: 'italic', lineHeight: 1,
          }}, '–'),
          h('span', { style: {
            fontFamily: serif, fontSize: 23, fontWeight: 400, lineHeight: 1,
            color: EW.ink, textShadow: '0 0 14px ' + EW.chaos + '66',
            minWidth: 18, textAlign: 'left',
          }}, mode.p2Score),
        ),

        h('div', { style: {
          display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1, whiteSpace: 'nowrap',
          fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', color: EW.inkMute,
        }},
          scoreCaption && h('span', { style: { color: EW.inkDim, letterSpacing: '0.16em' }}, scoreCaption),
          scoreCaption && h('span', { style: { color: EW.inkDim }}, '·'),
          h('span', { style: { fontWeight: 700, color: EW.ink }}, mins + ':' + secs),
          h('span', { style: { color: EW.inkDim }}, '·'),
          h('span', null,
            'R', h('span', { style: {
              fontFamily: serif, fontSize: 12, fontWeight: 600, color: EW.time,
              textShadow: '0 0 8px ' + EW.time + '55',
            }}, round),
            roundLimit > 0 ? '/' + roundLimit : '',
          ),
        ),

        /* Nexus zone control pips (Arena) — cave/earth/sky ownership at a
           glance; pulses red-hot when a team is ONE zone from an instant win. */
        mode.nexusPips && h('div', { style: {
          display: 'flex', alignItems: 'center', gap: 7, lineHeight: 1,
        }},
          mode.nexusPips.map(z => {
            const zColor = z.owner === 1 ? EW.space : z.owner === 2 ? EW.chaos : 'rgba(255,255,255,0.28)';
            const contested = z.owner === 0 && z.progress !== 0;
            return h('span', {
              key: z.key,
              title: z.name + ' Nexus — ' + (z.owner ? 'Player ' + z.owner : contested ? 'contested' : 'unclaimed'),
              className: mode.nexusAlertPlayer && z.owner === mode.nexusAlertPlayer ? 'ew-sudden-death' : undefined,
              style: {
                fontFamily: mono, fontSize: 11, color: zColor,
                textShadow: z.owner ? '0 0 7px ' + zColor : 'none',
              },
            }, z.owner ? '⬢' : '⬡');
          }),
          mode.nexusAlertPlayer > 0 && h('span', { className: 'ew-sudden-death', style: {
            fontFamily: mono, fontSize: 8, letterSpacing: '0.14em', color: EW.bad,
            textShadow: '0 0 8px ' + EW.bad,
          }}, 'P' + mode.nexusAlertPlayer + ' NEEDS 1 NEXUS!'),
        ),
      ),

      h(ScoreSideColumn, { st, mode, player: 2, side: 'right', color: EW.chaos, nextId }),
    ),

    h(EntropyWing, { st, player: 2, side: 'right' }),
  );
}

function MatchMeta({ st }) {
  if (!st) return null;

  const weather = (st.activeWeather || []);
  const weatherText = weather.length > 0 && typeof WEATHER_REGISTRY !== 'undefined'
    ? weather.map(w => {
        const def = WEATHER_REGISTRY[w.type];
        return def ? (def.icon + ' ' + def.label) : w.type;
      }).join(' ')
    : '☀ Clear';

  const zodiac = st.activeZodiac || 'aries';
  const zodiacIcon = typeof ZODIAC_ICONS !== 'undefined' ? (ZODIAC_ICONS[zodiac] || '✦') : '✦';
  const zodiacLabel = zodiac.charAt(0).toUpperCase() + zodiac.slice(1);
  // Ignite the chip while at least one living unit carries the reigning sign
  // (i.e. someone on the field is actually receiving the zodiac blessing).
  const zodiacBlessed = (st.units || []).some(u => u && !u.dead && u.zodiac === zodiac);

  const matchNum = st.matchNumber || 1;
  const p1Score = st.record ? (st.record[1] || 0) : 0;
  const p2Score = st.record ? (st.record[2] || 0) : 0;

  // the battlefield's name (same source as the loading-screen title)
  const mapName = (typeof window._lsMapTitle === 'function') ? window._lsMapTitle() : null;

  return h('div', { className: 'ew-matchmeta', style: {
    position: 'absolute', top: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 6,
    alignItems: 'flex-end', zIndex: 10,
  }},
    mapName && h('div', { style: {
      fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 600,
      letterSpacing: '0.18em', lineHeight: 1, color: EW.ink,
      textShadow: '0 0 12px rgba(214,178,255,0.35), 0 1px 3px rgba(0,0,0,0.8)',
      padding: '2px 2px 0 0', pointerEvents: 'none',
    }}, '◈ ' + mapName),
    h('div', { style: {
      display: 'flex', alignItems: 'center', gap: 10,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      padding: '6px 12px',
      fontFamily: '"DotGothic16", monospace', fontSize: 11,
      letterSpacing: '0.12em', color: EW.inkMute,
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
    }},
      h('span', { style: { color: EW.ink }}, weatherText),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', { style: { display: 'flex', alignItems: 'center', gap: 4 },
        title: zodiacBlessed ? zodiacLabel + ' reigns — matching units gain +10%' : zodiacLabel + ' reigns' },
        h('span', { className: zodiacBlessed ? 'ew-zodiac-blessed' : undefined, style: {
          fontFamily: '"Cinzel", serif', fontStyle: 'italic',
          fontSize: 15, color: zodiacBlessed ? '#ffd866' : EW.time,
          textShadow: zodiacBlessed ? '0 0 8px rgba(255,200,80,0.9), 0 0 16px rgba(255,170,40,0.5)' : undefined,
        }}, zodiacIcon),
        h('span', { style: { color: EW.ink }}, zodiacLabel),
      ),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', null, 'MATCH'),
      h('span', { style: { color: EW.ink, fontWeight: 600 }}, p1Score + ' — ' + p2Score),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', {
        style: { cursor: 'pointer', color: EW.inkMute, fontSize: 16 },
        onClick: () => { if (typeof togglePauseMenu === 'function') togglePauseMenu(); },
      }, '☰'),
    ),
  );
}

/* The old right-side TURN ORDER clock is gone — its turn-queue is now folded
   into the scoreboard flanks (see ScoreSideColumn / TurnFlank above). */

function CombatLog({ st }) {
  if (!st) return null;

  const [visible, setVisible] = useState(true);
  const [extraHeight, setExtraHeight] = useState(0);
  const scrollRef = useRef(null);
  const autoScrollRef = useRef(true);
  const resizingRef = useRef(false);
  const startYRef = useRef(0);
  const startExtraRef = useRef(0);

  const all = (st.logEntries || []);
  const visibleAll = (typeof ONLINE_RULES !== 'undefined' && ONLINE_RULES.active) || st.fogOfWar
    ? all.filter(e => typeof _logVisible === 'function' ? _logVisible(e) : true)
    : all;

  const entries = visibleAll.map(e => {
    const msg = typeof _logMsg === 'function' ? _logMsg(e) : (e.msg || e.text || '');
    const formatted = typeof formatCombatLogLine === 'function' ? formatCombatLogLine(msg) : msg;
    const isRound = /^⚡ Round|^Round /i.test(msg);
    return { msg, formatted, isRound };
  }).filter(e => e.msg);

  useEffect(() => {
    if (scrollRef.current && autoScrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  }, []);

  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    startYRef.current = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    startExtraRef.current = extraHeight;
    const onMove = (ev) => {
      if (!resizingRef.current) return;
      const clientY = ev.clientY || (ev.touches && ev.touches[0].clientY) || 0;
      const delta = clientY - startYRef.current;
      setExtraHeight(Math.max(-100, Math.min(500, startExtraRef.current + delta)));
    };
    const onEnd = () => {
      resizingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [extraHeight]);

  const baseMaxHeight = 140;
  const totalMaxHeight = baseMaxHeight + extraHeight;

  const header = h('div', {
    onClick: () => setVisible(v => !v),
    style: {
      display: 'flex', alignItems: 'center', gap: 6,
      cursor: 'pointer', padding: '0 2px 2px',
      userSelect: 'none',
    },
  },
    h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 9,
      letterSpacing: '0.22em', color: EW.inkMute,
    }}, 'COMBAT LOG'),
    h('div', { style: {
      flex: 1, height: 1,
      background: 'linear-gradient(90deg, ' + EW.panelEdge + ', transparent)',
    }}),
    h('span', { style: {
      fontSize: 8, color: EW.inkDim, cursor: 'pointer',
      transform: visible ? 'none' : 'rotate(180deg)',
      transition: 'transform 0.2s',
    }}, '▼'),
  );

  return h('div', { className: 'ew-combatlog', style: {
    position: 'absolute', right: 90, top: 140, width: 280,
    padding: '8px 12px 0', background: 'rgba(8,10,18,0.55)',
    borderLeft: '2px solid ' + EW.panelEdge,
    display: 'flex', flexDirection: 'column',
    fontFamily: '"DotGothic16", monospace', fontSize: 10,
    zIndex: 8, pointerEvents: 'auto',
  }},
    header,
    visible && h('div', {
      ref: scrollRef,
      onScroll: handleScroll,
      style: {
        maxHeight: Math.max(40, totalMaxHeight),
        overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 4,
        maskImage: 'linear-gradient(180deg, transparent 0%, black 12%, black 100%)',
        scrollbarWidth: 'thin',
        scrollbarColor: EW.panelEdge + ' transparent',
        paddingBottom: 4,
      },
    },
      entries.map((e, i) => {
        const isOld = i < entries.length - 8;
        return h('div', {
          key: i,
          style: {
            lineHeight: 1.3, fontSize: 10,
            color: e.isRound ? EW.warn : EW.inkMute,
            fontWeight: e.isRound ? 700 : 400,
            letterSpacing: e.isRound ? '0.06em' : 'normal',
            textTransform: e.isRound ? 'uppercase' : 'none',
            opacity: e.isRound ? 0.7 : (isOld ? 0.55 : 1),
            marginTop: e.isRound ? 4 : 0,
          },
          dangerouslySetInnerHTML: { __html: e.formatted || e.msg },
        });
      }),
    ),

    visible && h('div', {
      onMouseDown: onResizeStart,
      onTouchStart: onResizeStart,
      style: {
        height: 7, cursor: 'ns-resize',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginTop: 2,
      },
    },
      h('div', { style: {
        width: 28, height: 2, borderRadius: 1,
        background: EW.panelEdge, opacity: 0.7,
      }}),
    ),
  );
}

/* The viewer's party is now shown in the scoreboard turn-order flank, so the
   old bottom-right roster is gone. This panel survives only to surface Gauntlet
   RESERVES (units not yet deployed), which the scoreboard can't represent. */
function PartyRoster({ st }) {
  if (!st) return null;

  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;

  const isGaunt = typeof _isGauntlet === 'function' && _isGauntlet();
  if (!isGaunt) return null;
  const reserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(viewer) : [];

  return h('div', { style: {
    position: 'absolute', bottom: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
  }},

    (() => {
      return h('div', { style: {
        display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end',
        background: EW.panel, border: '1px solid ' + EW.panelEdge, padding: '5px 8px',
        clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)',
      }},
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 7, color: EW.inkMute,
          letterSpacing: '0.14em', marginRight: 2,
        }}, 'RESERVES'),
        reserves.length === 0 && h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8, color: EW.inkDim,
        }}, '—'),
        reserves.map(r => {
          const fc = getFactionColor(r);
          const hpPct = r.maxHp > 0 ? (r.hp / r.maxHp) * 100 : 0;
          return h('div', {
            key: r.id,
            title: (typeof unitDisplayName === 'function' ? unitDisplayName(r) : r.name) + ' · ' + Math.round(hpPct) + '% HP',
            style: {
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '2px', opacity: 0.85,
              border: '1px solid ' + EW.panelEdge, background: 'rgba(0,0,0,0.3)',
            },
          },
            h(UnitSprite, { unit: r, size: 20 }),
            h('div', { style: { width: 22, height: 3, background: 'rgba(255,255,255,0.12)' }},
              h('div', { style: {
                width: hpPct + '%', height: '100%',
                background: HP_ALLY_FILL, boxShadow: HP_ALLY_GLOW,
              }}),
            ),
          );
        }),
      );
    })(),
  );
}

/* Gauntlet: when one of YOUR deployed units falls (no respawns), pick which
   reserve to send into the empty slot. The engine is paused until you choose. */
function GauntletReplaceModal({ st }) {
  if (!st || st.phase !== 'battle') return null;
  const pending = st._gauntletPendingReplace;
  if (!pending) return null;
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  if (pending.player !== viewer) return null;
  const reserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(pending.player) : [];
  if (reserves.length === 0) return null;
  const fc = EW.time;

  return h('div', { style: {
    position: 'absolute', inset: 0, zIndex: 80, pointerEvents: 'auto',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)',
  }},
    h(ClipPanel, { factionColor: fc, style: { width: 340, maxWidth: '92%' }},
      h('div', { style: {
        padding: '10px 14px', borderBottom: '1px solid ' + EW.panelEdge,
        background: 'linear-gradient(180deg, ' + fc + '18, transparent)',
      }},
        h('div', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 16, color: EW.ink, letterSpacing: '0.04em',
        }}, '⚔️ Unit Down — Send In a Reserve'),
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8, color: EW.inkMute,
          letterSpacing: '0.1em', marginTop: 3,
        }}, 'No respawns. Choose who enters the fray.'),
      ),
      h('div', { style: { padding: '6px 0', maxHeight: 320, overflowY: 'auto' }},
        reserves.map(r => {
          const hpPct = r.maxHp > 0 ? Math.round((r.hp / r.maxHp) * 100) : 0;
          const statusKeys = (typeof getActiveStatusKeys === 'function')
            ? getActiveStatusKeys(r).filter(k => typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[k]?.category === 'status')
            : [];
          return h('div', {
            key: r.id,
            className: 'rhud-row',
            style: { padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
            onClick: () => {
              if (typeof _gauntletDeployReserve === 'function') _gauntletDeployReserve(pending.player, r.id, pending, true);
            },
          },
            h(UnitSprite, { unit: r, size: 30 }),
            h('div', { style: { flex: 1, minWidth: 0 }},
              h('div', { style: {
                fontFamily: '"Cinzel", serif', fontSize: 14, color: EW.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}, typeof unitDisplayName === 'function' ? unitDisplayName(r) : (r.name || r.cls)),
              h('div', { style: {
                fontFamily: '"DotGothic16", monospace', fontSize: 8,
                color: EW.inkMute, letterSpacing: '0.06em', marginTop: 2,
              }}, (r.cls || '').toUpperCase() + (statusKeys.length ? ' · ' + statusKeys.map(k => STATUS_DEFS[k]?.short || k).join(' ') : '')),
            ),
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 11,
              color: HP_ALLY, fontWeight: 600,
            }}, hpPct + '%'),
          );
        }),
      ),
    ),
  );
}

/* ════════════════════════ THE HOROLOGE ════════════════════════
   The action menu is a living watch. Blades (verbs) fan out from a clock
   hub anchored bottom-left; the minute hand swings to aim at whatever
   blade is hovered, and confirming an action strikes the hour — both
   hands slam onto the blade's angle with a chime + tick cascade. The
   second hand carries the faction's pulse: quartz-tick for Space, a
   smooth sweep for Time, an erratic stutter for Chaos. */

const HRLG_REST = { min: 60, hour: 305 };   // idle 10:10 pose
const _hrlgToClock = (a) => 90 + a;         // blade angle → watch angle (0 = 12 o'clock)
const _hrlgNearest = (cur, target) => cur + (((target - cur) % 360 + 540) % 360 - 180);
function _hrlgPol(r, deg) {
  const rad = deg * Math.PI / 180;
  return [100 + r * Math.sin(rad), 100 - r * Math.cos(rad)];
}

// Stylised flat world map etched into the dial (equirectangular ~300×150,
// scaled into the inner disc). Decorative cartography, not geography.
const HRLG_MAP = 'M28,32 L46,22 L72,20 L88,26 L84,34 L70,38 L66,50 L54,58 L46,72 L40,58 L30,46 Z'
  + ' M92,12 L106,10 L110,20 L98,24 Z'
  + ' M56,78 L70,74 L80,86 L78,104 L68,122 L60,106 L54,90 Z'
  + ' M138,28 L154,20 L170,24 L166,34 L152,40 L142,38 Z'
  + ' M138,48 L160,44 L176,52 L174,72 L162,92 L152,90 L142,68 Z'
  + ' M172,22 L210,14 L248,20 L262,34 L252,48 L232,44 L216,56 L206,72 L198,58 L184,44 L172,36 Z'
  + ' M232,74 L242,72 L246,80 L236,82 Z M250,84 L260,82 L262,90 L252,92 Z'
  + ' M252,102 L272,98 L284,108 L276,120 L258,118 Z';

// The watch itself. `api` is a plain object the parent owns; the hub fills
// it with imperative hand controls (aim / rest / strike / wind) so blade
// hover/click handlers can drive the hands without re-rendering the SVG.
function HorologeHub({ factionKey, api, portraitUrl, portraitIsFace, portraitTitle, onPortraitClick, unitKey, burning, poisoned }) {
  const minRef = useRef(null), hourRef = useRef(null), secRef = useRef(null);
  const ticksRef = useRef(null), chimeARef = useRef(null), chimeBRef = useRef(null);
  const hitRef = useRef(null);
  const A = useRef({ min: HRLG_REST.min, hour: HRLG_REST.hour, sec: 0, paused: false });

  // one-shot white blink on the face when THIS unit takes hit damage
  // (applyDamageToUnit emits 'unit:damaged' on the RenderBus)
  useEffect(() => {
    if (!window.RenderBus || !unitKey) return;
    const onHit = (ev) => {
      if (!ev || !ev.unit || ev.unit.id !== unitKey) return;
      const el = hitRef.current; if (!el) return;
      el.classList.remove('go'); void el.getBoundingClientRect(); el.classList.add('go');
    };
    window.RenderBus.on('unit:damaged', onHit);
    return () => { window.RenderBus.off('unit:damaged', onHit); };
  }, [unitKey]);

  const _setHand = (ref, deg) => { if (ref.current) ref.current.style.transform = 'rotate(' + deg + 'deg)'; };

  api.aim = (deg) => { A.current.min = _hrlgNearest(A.current.min, deg); _setHand(minRef, A.current.min); };
  api.rest = () => api.aim(HRLG_REST.min);
  api.wind = (extra) => { A.current.min += extra; _setHand(minRef, A.current.min); };
  api.strike = (deg) => {
    const a = A.current;
    a.min = _hrlgNearest(a.min, deg); a.hour = _hrlgNearest(a.hour, deg);
    _setHand(minRef, a.min); _setHand(hourRef, a.hour);
    // second hand swings onto the struck hour; the heartbeat resumes after
    a.paused = true;
    if (secRef.current) {
      secRef.current.classList.remove('snap'); secRef.current.classList.add('aim');
      a.sec = _hrlgNearest(a.sec, deg);
      secRef.current.style.transform = 'rotate(' + a.sec + 'deg)';
    }
    setTimeout(() => { a.paused = false; }, 900);
    [chimeARef.current, chimeBRef.current].forEach((el, k) => {
      if (!el) return;
      el.classList.remove('go', 'go2'); void el.offsetWidth; el.classList.add(k ? 'go2' : 'go');
    });
    // minute-track ticks light up radiating out from the struck angle
    if (ticksRef.current) {
      const start = Math.round((((deg % 360) + 360) % 360) / 6);
      ticksRef.current.querySelectorAll('.hrlg-mtick').forEach(tk => {
        const i = +tk.dataset.i;
        const d = Math.min((i - start + 60) % 60, (start - i + 60) % 60);
        setTimeout(() => { tk.classList.add('lit'); setTimeout(() => tk.classList.remove('lit'), 240); }, d * 12);
      });
    }
  };

  // rest pose on mount (hand transforms live outside React's render)
  useEffect(() => {
    _setHand(minRef, A.current.min); _setHand(hourRef, A.current.hour); _setHand(secRef, A.current.sec);
  }, []);

  // the heartbeat — faction-flavoured second hand
  useEffect(() => {
    let t = null, raf = null, alive = true;
    const a = A.current;
    const setSec = (deg, cls) => {
      const el = secRef.current; if (!el) return;
      el.classList.remove('snap', 'aim'); if (cls) el.classList.add(cls);
      a.sec = deg; el.style.transform = 'rotate(' + deg + 'deg)';
    };
    if (factionKey === 'time') {          // silk sweep
      let last = performance.now();
      const loop = (now) => {
        if (!alive) return;
        if (!a.paused && secRef.current) {
          a.sec += (now - last) * 0.006;
          secRef.current.classList.remove('snap', 'aim');
          secRef.current.style.transform = 'rotate(' + a.sec + 'deg)';
        }
        last = now; raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      const chaos = factionKey === 'chaos';
      const tick = () => {
        if (!alive) return;
        if (!a.paused) {
          if (chaos) {                     // palsied stutter, occasionally backwards
            const back = Math.random() < 0.16;
            setSec(a.sec + (back ? -1 : 1) * (2 + Math.random() * 13), 'snap');
          } else setSec(a.sec + 6, 'snap'); // quartz tick
        }
        t = setTimeout(tick, chaos ? 220 + Math.random() * 640 : 1000);
      };
      t = setTimeout(tick, chaos ? 300 : 1000);
    }
    return () => { alive = false; clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [factionKey]);

  // static plate: bezel ticks, numerals, and the etched world map
  const plate = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const maj = i % 5 === 0;
      const [x1, y1] = _hrlgPol(maj ? 87 : 90.5, i * 6);
      const [x2, y2] = _hrlgPol(95, i * 6);
      ticks.push(h('line', {
        key: i, x1, y1, x2, y2, className: 'hrlg-mtick', 'data-i': i,
        stroke: 'var(--hfc)', strokeWidth: maj ? 1.5 : 0.7, opacity: maj ? 0.75 : 0.3,
      }));
    }
    const numerals = [];
    const ROM = { 0: 'XII', 3: 'III', 6: 'VI', 9: 'IX' };
    for (let hr = 0; hr < 12; hr++) {
      if (ROM[hr]) {
        const [x, y] = _hrlgPol(76, hr * 30);
        numerals.push(h('text', {
          key: hr, x, y: y + 5, textAnchor: 'middle',
          fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: 13.5,
          fill: EW.ink, opacity: 0.92,
        }, ROM[hr]));
      } else {
        const [x, y] = _hrlgPol(78, hr * 30);
        numerals.push(h('path', {
          key: hr,
          d: 'M' + x + ',' + (y - 2.6) + ' L' + (x + 2) + ',' + y + ' L' + x + ',' + (y + 2.6) + ' L' + (x - 2) + ',' + y + ' Z',
          fill: 'var(--hfc)', opacity: 0.7,
        }));
      }
    }
    // flat-earth chart: graticule + continents, clipped to the inner disc
    const grid = [];
    for (let gy = -42; gy <= 42; gy += 21) grid.push(h('line', {
      key: 'la' + gy, x1: 44, y1: 100 + gy, x2: 156, y2: 100 + gy,
      stroke: 'var(--hfc)', strokeWidth: 0.5, opacity: gy === 0 ? 0.16 : 0.08,
    }));
    for (let gx = -42; gx <= 42; gx += 21) grid.push(h('line', {
      key: 'lo' + gx, x1: 100 + gx, y1: 44, x2: 100 + gx, y2: 156,
      stroke: 'var(--hfc)', strokeWidth: 0.5, opacity: gx === 0 ? 0.12 : 0.08,
    }));
    return h(React.Fragment, null,
      h('defs', null,
        h('radialGradient', { id: 'hrlgFaceG', cx: '42%', cy: '36%' },
          h('stop', { offset: '0%', stopColor: '#131311' }),
          h('stop', { offset: '70%', stopColor: '#0b0b09' }),
          h('stop', { offset: '100%', stopColor: '#070706' }),
        ),
        h('radialGradient', { id: 'hrlgPortraitVig', cx: '50%', cy: '50%', r: '50%' },
          h('stop', { offset: '0%', stopColor: '#070706', stopOpacity: 0 }),
          h('stop', { offset: '70%', stopColor: '#070706', stopOpacity: 0.06 }),
          h('stop', { offset: '100%', stopColor: '#070706', stopOpacity: 0.8 }),
        ),
        h('clipPath', { id: 'hrlgMapClip' }, h('circle', { cx: 100, cy: 100, r: 56 })),
      ),
      h('circle', { cx: 100, cy: 100, r: 96, fill: 'url(#hrlgFaceG)', stroke: 'var(--hfc-soft)', strokeWidth: 1 }),
      h('circle', { cx: 100, cy: 100, r: 98, fill: 'none', stroke: 'var(--hfc)', strokeWidth: 0.8, opacity: 0.5 }),
      h('circle', { cx: 100, cy: 100, r: 57, fill: 'none', stroke: 'var(--hfc)', strokeWidth: 0.6, opacity: 0.22 }),
      // The inner disc: the etched flat-earth chart when the unit has no
      // face art. (The portrait itself is rendered OVER the hands — see
      // the svg composition in the return below.)
      !portraitUrl && h('g', { clipPath: 'url(#hrlgMapClip)' },
        grid,
        h('path', {
          d: HRLG_MAP, transform: 'translate(44,72) scale(0.3733)',
          fill: 'var(--hfc)', opacity: 0.13,
          stroke: 'var(--hfc)', strokeWidth: 1.2, strokeOpacity: 0.35, strokeLinejoin: 'round',
        }),
      ),
      h('g', { ref: ticksRef }, ticks),
      h('g', null, numerals),
    );
  }, [portraitUrl]);

  return h('div', { className: 'hrlg-hub' },
    h('svg', { viewBox: '0 0 200 200' },
      plate,
      h('g', { ref: hourRef, className: 'hrlg-hour' },
        h('path', { d: 'M100,111 L96.9,100 L98.9,62 L100,56 L101.1,62 L103.1,100 Z', fill: 'var(--hfc)', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 0.5 }),
        h('path', { d: 'M99.3,96 L99.3,68 L100.7,68 L100.7,96 Z', fill: '#080807', opacity: 0.8 }),
      ),
      h('g', { ref: minRef, className: 'hrlg-min' },
        h('path', { d: 'M100,113 L97.8,100 L99.4,30 L100,24 L100.6,30 L102.2,100 Z', fill: EW.ink, stroke: 'rgba(255,255,255,0.35)', strokeWidth: 0.4 }),
        h('path', { d: 'M99.4,95 L99.4,38 L100.6,38 L100.6,95 Z', fill: '#080807', opacity: 0.8 }),
      ),
      h('g', { ref: secRef, className: 'hrlg-sec' },
        h('line', { x1: 100, y1: 118, x2: 100, y2: 18, stroke: EW.bad, strokeWidth: 1.1 }),
        h('circle', { cx: 100, cy: 113, r: 3.2, fill: 'none', stroke: EW.bad, strokeWidth: 1.1 }),
      ),
      h('circle', { cx: 100, cy: 100, r: 4.6, fill: '#0c0c0a', stroke: 'var(--hfc)', strokeWidth: 1.3 }),
      h('circle', { cx: 100, cy: 100, r: 1.7, fill: 'var(--hfc)' }),
      // The ACTIVE UNIT'S PORTRAIT rides ON TOP of the hands (this menu only
      // renders on the local player's turn, so the face on the clock is
      // always YOUR unit — never the enemy's). Status flashes tint the disc:
      // red while burning, purple while poisoned, a white blink on hits.
      // The disc doubles as a BUTTON: clicking it re-centers the camera on
      // this unit (the same selectUnit pan a scoreboard chip click does).
      h('g', {
        clipPath: 'url(#hrlgMapClip)',
        onClick: onPortraitClick || undefined,
        style: onPortraitClick ? { cursor: 'pointer' } : undefined,
      },
        onPortraitClick && h('title', null, portraitTitle || 'Center the camera on this unit'),
        // invisible hit target so the disc stays clickable even with no art
        // (the flash circles below are pointer-events:none)
        onPortraitClick && h('circle', { cx: 100, cy: 100, r: 56.5, fill: '#000', opacity: 0 }),
        portraitUrl && h('image', {
          href: portraitUrl, x: 44, y: 44, width: 112, height: 112,
          // dedicated face art fills the disc edge to edge; a map-sprite
          // fallback fits whole so heads/feet don't get cropped away
          preserveAspectRatio: portraitIsFace === false ? 'xMidYMid meet' : 'xMidYMid slice',
          opacity: 0.94,
          style: { imageRendering: 'pixelated' },
        }),
        portraitUrl && h('circle', { cx: 100, cy: 100, r: 56.5, fill: 'url(#hrlgPortraitVig)' }),
        burning && h('circle', { cx: 100, cy: 100, r: 56.5, className: 'hrlg-flash hrlg-flash-burn' }),
        poisoned && h('circle', { cx: 100, cy: 100, r: 56.5, className: 'hrlg-flash hrlg-flash-poison' }),
        h('circle', { ref: hitRef, cx: 100, cy: 100, r: 56.5, className: 'hrlg-hitflash' }),
      ),
    ),
    h('div', { ref: chimeARef, className: 'hrlg-chime' }),
    h('div', { ref: chimeBRef, className: 'hrlg-chime' }),
  );
}

// ── Command panels ──────────────────────────────────────────────
// The menu is a plain vertical COLUMN of command rows (classic JRPG),
// docked beside the watch. Every row is fully lit and ONE click fires;
// hovering (or ↑/↓ / wheel) moves the yellow cursor. Long lists scroll
// inside their panel. Sub-menus CASCADE: the parent list stays on
// screen, dimmed, to the left of the open child (root → abilities →
// targets), so "where am I" never needs remembering — and clicking a
// dimmed panel backs up to it. The old rotating drum (focus window,
// faded overflow rows, click-to-rotate) is gone: it looked great and
// navigated badly.

// One command row. EVERY menu — root verbs, abilities, items, targets,
// quick actions — renders through this, so they all read as one
// instrument. A row wears its job's color EDGE TO EDGE (spell category /
// faction tint / danger red) and answers hover with glow + growth — the
// color never washes out on interaction. Item fields beyond the basics:
//   power {v,color}  colored damage/heal chip      mp     MP cost chip
//   cost             AP cost as diamond pips       count  stack (×2)
//   meta {text,color} dim right-side info (hp%/dist)
//   note             amber chip (MOVE→CAST)        sub    red reason tag
//   check            pending-confirm ✓             hint   key hint (SPACE)
//   iconColor        glyph tint override           forceLive  clickable though !available
//   badges           inline chips [{label,style,title,plain}] after the
//                    name — the spell TYPE badge only; delivery/range
//                    detail lives in the bottom description bar now
function HorologeBlade({ b, idx, sel, active, muted, fireId, onFire, onHover, confirmBtn }) {
  const dead = !b.available && !b.forceLive;         // truly inert
  const ghost = !b.available;                        // greyed look (may still be clickable)
  const port = (b.portrait && b.portrait.url) ? b.portrait : null;   // JRPG target row
  const right = [];
  if (b.check && !confirmBtn) right.push(h('span', { key: 'ck', className: 'hrlg-check' }, '✓ TARGET'));
  if (!dead && b.power) right.push(h('span', { key: 'pw', className: 'hrlg-pw', style: { color: b.power.color } }, b.power.v));
  if (!dead && b.mp) right.push(h('span', { key: 'mp', className: 'hrlg-chip' }, b.mp + ' MP'));
  if (!dead && typeof b.cost === 'number' && !b.sub) {
    const pips = []; for (let i = 0; i < b.cost; i++) pips.push(h('span', { key: i, className: 'hrlg-cpip' }));
    right.push(h('span', { key: 'ap', className: 'hrlg-cost' }, pips));
  }
  if (b.count) right.push(h('span', { key: 'ct', className: 'hrlg-cfree' }, b.count));
  if (b.meta) right.push(h('span', { key: 'mt', className: 'hrlg-meta', style: b.meta.color ? { color: b.meta.color } : undefined }, b.meta.text));
  if (!dead && !b.sub && b.hint) right.push(h('span', { key: 'hn', className: 'hrlg-cfree' }, b.hint));
  if (!dead && b.note) right.push(h('span', { key: 'nt', className: 'hrlg-note' }, b.note));
  if (b.sub && !b.subBelow) right.push(h('span', { key: 'sb', className: 'hrlg-tag' }, b.sub));
  // ⤵ DROP chip (Mystery Dungeon item rows): its own click target — the row
  // click still USES the item; stopPropagation keeps the two apart.
  if (b.drop) right.push(h('span', {
    key: 'dr',
    title: b.drop.title || 'Drop on the floor',
    style: {
      cursor: 'pointer', pointerEvents: 'auto', flex: 'none',
      fontFamily: '"DotGothic16", monospace', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.08em', lineHeight: 1.2, padding: '2px 6px',
      color: '#f2c468', border: '1px solid #f2c46888',
      background: 'rgba(242,196,104,0.12)',
    },
    onClick: (e) => { e.stopPropagation(); b.drop.fire(); },
  }, b.drop.label || '⤵ DROP'));
  // Green !-circle: this action is SUPER EFFECTIVE against its target. Leads
  // the right-hand chips so it reads first on quick-menu and target rows.
  if (b.superEff) right.unshift(h('span', {
    key: 'se', className: 'hrlg-supereff', title: 'Super effective against this target!',
  }, '!'));
  // THE CONFIRM BUTTON rides the END of the pending (✓) row itself — a green
  // seal right where the player's eye already is, instead of floating on top
  // of the panel. stopPropagation: the row's own click ALSO confirms, and
  // both firing would double-execute the action.
  if (confirmBtn) right.push(h('span', {
    key: 'cf', className: 'hrlg-confirm-inline',
    onClick: (e) => { e.stopPropagation(); confirmBtn.fire(); },
  },
    h('span', { className: 'hrlg-confirm-inline-check' }, '✓'),
    'CONFIRM',
  ));
  // TYPE badge rides inline next to the name — it's the matchup intel.
  const badgeRow = (b.badges && b.badges.length) ? h('span', { className: 'hrlg-badges' },
    b.badges.map((bd, k) => bd.plain
      ? h('span', { key: k, className: 'hrlg-cfree', title: bd.title || undefined }, bd.label)
      : h('span', { key: k, style: bd.style, title: bd.title || undefined }, bd.label)),
  ) : null;
  // portrait target rows: face chip + name over a real HP (and optional MP)
  // bar — the classic JRPG "who am I hitting / healing" readout.
  let portCol = null;
  if (port) {
    const hpPct = port.maxHp > 0 ? Math.max(0, Math.min(100, (port.hp / port.maxHp) * 100)) : 0;
    const shPct = (port.maxHp > 0 && port.shield > 0)
      ? Math.min(100, Math.round((port.shield / port.maxHp) * 100)) : 0;
    // Confirm forecast: the slice of HP the armed action would take blinks
    // white at the leading edge of the fill (lethal → the whole fill blinks).
    const prevPct = (b.previewDmg > 0 && port.maxHp > 0)
      ? Math.max(0, Math.min(hpPct, (b.previewDmg / port.maxHp) * 100)) : 0;
    // Heal forecast: projected restore grows green FROM the fill's edge —
    // heals/potions browsing the target drum show the outcome, not just "♥".
    const healPct = (b.previewHeal > 0 && port.maxHp > 0)
      ? Math.max(0, Math.min(100 - hpPct, (b.previewHeal / port.maxHp) * 100)) : 0;
    // Numbers ride the strip ABOVE the bar — identity left, numbers right —
    // the exact same layout as the 3D nameplates; the bar itself stays clean.
    portCol = h('span', { className: 'hrlg-tcol' },
      h('span', { className: 'hrlg-trow-top' },
        h('span', { className: 'hrlg-blabel' }, b.label),
        h('span', { className: 'hrlg-thp-num' }, port.hp + '/' + port.maxHp),
      ),
      h('span', { className: 'hrlg-thp' },
        h('span', { className: 'hrlg-thp-fill', style: {
          // canonical fill — ally green / enemy red, same as the nameplates
          width: hpPct + '%',
          background: port.ally ? HP_ALLY_FILL : HP_ENEMY_FILL,
          boxShadow: port.ally ? HP_ALLY_GLOW : HP_ENEMY_GLOW,
        }}),
        prevPct > 0 && h('span', {
          className: 'hrlg-thp-preview' + (b.previewDmg >= port.hp ? ' dmg-preview-lethal' : ''),
          style: { left: (hpPct - prevPct) + '%', width: prevPct + '%' },
        }),
        healPct > 0 && h('span', {
          className: 'hrlg-thp-preview dmg-preview-heal',
          style: { left: hpPct + '%', width: healPct + '%' },
        }),
        shPct > 0 && h('span', { className: 'hrlg-thp-shield', style: { width: shPct + '%' } }),
      ),
      port.showMp && port.maxMp > 0 && h(React.Fragment, null,
        h('span', { className: 'hrlg-trow-top mp' },
          h('span', { className: 'hrlg-thp-num' }, port.mp + '/' + port.maxMp),
        ),
        h('span', { className: 'hrlg-thp mp' },
          h('span', { className: 'hrlg-thp-fill', style: {
            width: Math.max(0, Math.min(100, (port.mp / port.maxMp) * 100)) + '%',
            background: MP_FILL, boxShadow: MP_GLOW,
          }}),
        ),
      ),
    );
  }
  // Category tint (spell rows): the WHOLE row wears its job's color —
  // red damage, green heal, blue buff, purple debuff, amber utility.
  const catVars = (b.catColor && !dead && !ghost) ? {
    '--bc': b.catColor, '--bc-soft': b.catColor + '88',
    '--bc-faint': b.catColor + '2a',
    '--bc-hi': b.catColor + '5c', '--bc-lo': b.catColor + '30',
  } : null;
  return h('div', {
    className: 'hrlg-blade'
      + (dead ? ' dead' : '')
      + (ghost && !dead ? ' ghost' : '')
      + (port ? ' trow' + (port.showMp && port.maxMp > 0 ? ' has-mp' : '') : '')
      + (badgeRow && !port ? ' two' : '')
      + (sel ? ' sel' : '')
      + (muted ? ' muted' : '')
      + (catVars ? ' catc' : '')
      + (b.check ? ' pend' : '')
      + (active ? ' active' : '')
      + (fireId === b.id ? ' fire' : ''),
    style: {
      ...(catVars || {}),
      animationDelay: (Math.min(idx, 9) * 14) + 'ms',
    },
    // Rows in a DIMMED parent panel stay clickable: LIVE rows jump straight
    // to their submenu/action (the handler stops propagation), dead rows
    // bubble to the panel-level click which backs up to that menu.
    onClick: (dead && !muted) ? undefined : (e) => onFire(b, e),
    onMouseEnter: muted ? undefined : (e) => onHover(b, true, e),
    onMouseLeave: muted ? undefined : (e) => onHover(b, false, e),
  },
    h('div', { className: 'hrlg-body' + (b.danger ? ' danger' : '') },
      // the classic yellow JRPG hand-cursor leading the selected row
      sel && h('span', { className: 'hrlg-cursor' }, '▶'),
      h('span', { className: 'hrlg-glyph', style: b.iconColor ? { color: b.iconColor, textShadow: 'none' } : undefined }, b.icon),
      port
        ? h(React.Fragment, null,
            h('span', {
              className: 'hrlg-tport'
                + (port.isFace ? '' : ' sprite')
                + (port.ally ? ' ally' : ' enemy')
                + (port.ko ? ' ko' : ''),
              style: { backgroundImage: 'url("' + port.url + '")' },
            }),
            portCol,
            h('span', { className: 'hrlg-spacer' }),
            right,
          )
        : badgeRow
        ? h('span', { className: 'hrlg-lblcol', style: { gap: 4 } },
            // Two lines: the name + TYPE badge own the top row (so neither is
            // ever cut off), damage/MP/AP/reason chips read underneath.
            h('span', { className: 'hrlg-brow1' },
              h('span', { className: 'hrlg-blabel', style: { flex: '0 1 auto' } }, b.label),
              badgeRow,
            ),
            h('span', { className: 'hrlg-brow2' }, right),
          )
        : (b.subBelow && b.sub)
        ? h(React.Fragment, null,
            // root verbs: the grey-out reason reads UNDER the name, so the
            // blade can stay narrow without the reason tag fighting for width
            h('span', { className: 'hrlg-lblcol' },
              h('span', { className: 'hrlg-blabel' }, b.label),
              h('span', { className: 'hrlg-subline' }, b.sub),
            ),
            right,
          )
        : h(React.Fragment, null,
            h('span', { className: 'hrlg-blabel' }, b.label),
            right,
          ),
      h('span', { className: 'hrlg-flash' }),
    ),
  );
}

// Tiny mouse glyph with the RIGHT button lit — the "right-click goes back"
// hint riding the sub-menu BACK chips (pads show their B button instead).
function _HrlgRmbIcon() {
  return h('svg', { width: 11, height: 15, viewBox: '0 0 12 16', style: { flex: 'none', display: 'block' } },
    h('rect', { x: 0.75, y: 0.75, width: 10.5, height: 14.5, rx: 5.25, fill: 'rgba(0,0,0,0.45)', stroke: 'currentColor', strokeWidth: 1.1 }),
    h('path', { d: 'M6,1.2 A4.9,4.9 0 0 1 11.2,6.2 L11.2,7 L6,7 Z', fill: 'currentColor' }),
    h('line', { x1: 1, y1: 7, x2: 11, y2: 7, stroke: 'currentColor', strokeWidth: 0.8, opacity: 0.7 }),
  );
}

// Stateful shell for the whole menu — ActionMenu computes WHAT can be done
// (as a stack of panels) and hands it to this component, which owns HOW it
// looks and moves. (Separate component so its hooks never sit behind
// ActionMenu's early returns.)
/* ── Status / stat-change chips for the Horologe's portrait column ──
   The same read the nameplate badge row gives, mirrored under the watch so
   the active unit's afflictions and buffs are visible without hunting the
   board. Recomputed on every HUD render (which 'unit:statusChanged' /
   'unit:damaged' RenderBus events force immediately). */
const _HRLG_SB_COLORS = {
  burn:'#c0392b',poison:'#9b59b6',silence:'#7f8c8d',stun:'#f39c12',
  stagger:'#e67e22',marked:'#e74c6f',lasered:'#ff2b2b',jammed:'#8e44ad',drowning:'#2980b9',
  lava_burn:'#d35400',protect:'#3498db',charm:'#e84393',sirenSong:'#6c5ce7',
  invisible:'#1a7a4a',regen:'#2ecc71',
  taunt:'#ff8a50',minimize:'#5ab0d4',statLock:'#a88ae0',hexed:'#b06ad3',
  frozen:'#7fd7ff',blind:'#9aa8b5'
};
function _hrlgStatusChips(unit) {
  const chips = [];
  if (!unit || typeof getActiveStatusKeys !== 'function' || typeof _STATUS_EFFECT_IDS === 'undefined') return chips;
  for (const sk of getActiveStatusKeys(unit)) {
    if (!_STATUS_EFFECT_IDS.has(sk) && sk !== 'invisible') continue;
    const sDef = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS[sk] : null;
    if (!sDef) continue;
    const turns = (typeof getStatusValue === 'function') ? getStatusValue(unit, sk) : 0;
    chips.push({
      key: 'st-' + sk, label: sDef.short || sk, bg: _HRLG_SB_COLORS[sk] || '#555',
      title: (sDef.label || sk) + (turns > 0 ? ' — ' + turns + ' turn' + (turns > 1 ? 's' : '') + ' left' : ''),
    });
  }
  // Stat stages — same ±5 stage read as the nameplate badges.
  if (typeof getStatStageCount === 'function') {
    for (const [stat, lbl] of [['atk','ATK'],['def','DEF'],['int','INT'],['mdef','MDEF'],['spd','SPD']]) {
      const n = getStatStageCount(unit, stat);
      if (!n) continue;
      chips.push({
        key: 'stg-' + stat, label: (n > 0 ? '+' : '') + n + ' ' + lbl, kind: n > 0 ? 'up' : 'dn',
        title: n + ' ' + lbl + ' stage' + (Math.abs(n) > 1 ? 's' : '') + ' (max ±5)',
      });
    }
  }
  const movD = (typeof getStatusMoveDelta === 'function') ? getStatusMoveDelta(unit) : 0;
  const hgBuff = unit.hourglassBuff || 0;
  const totalMov = movD + (hgBuff > 0 ? Math.floor(hgBuff / 2) : 0);
  if (hgBuff > 0) chips.push({ key: 'hg', label: '⏳+' + hgBuff, kind: 'up', title: 'Hourglass power: +' + hgBuff + ' ATK/DEF points' });
  if (totalMov) chips.push({
    key: 'mov', label: 'MOV' + (totalMov > 0 ? '+' : '') + totalMov, kind: totalMov > 0 ? 'up' : 'dn',
    title: 'Movement ' + (totalMov > 0 ? 'bonus' : 'penalty') + ' from active effects',
  });
  const ks = unit._killStreak || 0;
  if (ks >= 3) chips.push({ key: 'ks', label: '🌀 FLOW STATE', kind: 'fire', title: 'FLOW STATE — ' + ks + ' kill streak' });
  else if (ks === 2) chips.push({ key: 'ks', label: '♨️ HOT', kind: 'fire', title: 'HEATING UP — 2 kill streak' });
  return chips;
}

// ── Quick-menu header vitals ────────────────────────────────────────
// The clicked unit's real HP/MP bars ride the quick-menu header, right
// under the name tab (the panel key carries the unit: 'enemy|<id>' /
// 'ally|<id>'). Hovering an action row blinks that action's forecast on
// the HP fill — damage as a white slice off the leading edge (lethal
// warms to kill-red), heals growing from it — plus a ±N chip naming the
// number. Reads getPendingDamagePreview (ui.js): the SAME channel the 3D
// nameplates paint, so hover and confirm forecasts stay in lock-step.
// Rendered inside HorologeMenu (not baked into the title element) so the
// hover re-render actually refreshes the slice. Viewer-local by
// construction — the forecast globals never sync online.
function _hrlgQuickVitals(panelKey) {
  const m = /^(enemy|ally)\|(.+)$/.exec(panelKey || '');
  if (!m) return null;
  const u = ((typeof state !== 'undefined' && state.units) || []).find(x => String(x.id) === m[2] && !x.dead);
  if (!u || !(u.maxHp > 0)) return null;
  const ally = m[1] === 'ally';
  const hpPct = Math.max(0, Math.min(100, (u.hp / u.maxHp) * 100));
  const shPct = (u.shield > 0) ? Math.min(100, Math.round((u.shield / u.maxHp) * 100)) : 0;
  // Hovered-row (or armed-confirm) forecast aimed at THIS unit.
  let dmg = 0, heal = 0, lethal = false;
  const fc = (typeof getPendingDamagePreview === 'function') ? getPendingDamagePreview() : null;
  if (fc && fc.unitId === u.id) {
    if (fc.dmg > 0) { dmg = fc.dmg; lethal = !!fc.lethal; }
    else if (fc.heal > 0) heal = fc.heal;
  }
  const dmgPct = dmg > 0 ? Math.max(0, Math.min(hpPct, (dmg / u.maxHp) * 100)) : 0;
  const healPct = heal > 0 ? Math.max(0, Math.min(100 - hpPct, (heal / u.maxHp) * 100)) : 0;
  return h('div', { key: 'qv', className: 'hrlg-qvitals' + (ally ? ' ally' : ' enemy') },
    h('div', { className: 'hrlg-qv-row' },
      h('span', { className: 'hrlg-qv-lbl' }, 'HP'),
      h('span', { className: 'hrlg-thp' },
        h('span', { className: 'hrlg-thp-fill', style: {
          width: hpPct + '%',
          background: ally ? HP_ALLY_FILL : HP_ENEMY_FILL,
          boxShadow: ally ? HP_ALLY_GLOW : HP_ENEMY_GLOW,
        }}),
        dmgPct > 0 && h('span', {
          className: 'hrlg-thp-preview' + (lethal ? ' dmg-preview-lethal' : ''),
          style: { left: (hpPct - dmgPct) + '%', width: dmgPct + '%' },
        }),
        healPct > 0 && h('span', {
          className: 'hrlg-thp-preview dmg-preview-heal',
          style: { left: hpPct + '%', width: healPct + '%' },
        }),
        shPct > 0 && h('span', { className: 'hrlg-thp-shield', style: { width: shPct + '%' } }),
      ),
      h('span', { className: 'hrlg-qv-num' }, Math.max(0, Math.round(u.hp)) + '/' + u.maxHp),
      dmg > 0 && h('span', { className: 'hrlg-qv-fc dmg' + (lethal ? ' lethal' : '') },
        (lethal ? '💀 ' : '') + '−' + dmg),
      heal > 0 && h('span', { className: 'hrlg-qv-fc heal' }, '+' + heal),
    ),
    (u.maxMp > 0) && h('div', { className: 'hrlg-qv-row' },
      h('span', { className: 'hrlg-qv-lbl mp' }, 'MP'),
      h('span', { className: 'hrlg-thp mp' },
        h('span', { className: 'hrlg-thp-fill', style: {
          width: Math.max(0, Math.min(100, (u.mp / u.maxMp) * 100)) + '%',
          background: MP_FILL, boxShadow: MP_GLOW,
        }}),
      ),
      h('span', { className: 'hrlg-qv-num mp' }, Math.max(0, Math.round(u.mp)) + '/' + u.maxMp),
    ),
  );
}

// ── Quick-menu header stats ─────────────────────────────────────────
// The clicked unit's full effective stat sheet rides the SAME header
// blade as the name + HP/MP bars — plain numbers, two columns, no bars
// (the old ⓘ stat-card button is gone; this replaces it). Values are
// LIVE (buffs/statuses/terrain/zodiac folded in) and tint green/red
// when they differ from the unit's base. CRT/EVA are the official
// crit/evasion stats — same data.js formula the combat dice roll —
// with the full math spelled out in their hover tooltip (STAT_HELP).
function _hrlgQuickStats(panelKey) {
  const m = /^(enemy|ally)\|(.+)$/.exec(panelKey || '');
  if (!m) return null;
  const u = ((typeof state !== 'undefined' && state.units) || []).find(x => String(x.id) === m[2] && !x.dead);
  if (!u) return null;
  const atk  = (u.atk || 0) + (typeof getEffectiveAttackBonus === 'function' ? getEffectiveAttackBonus(u) : 0);
  const def  = (u.def || 0) + (typeof getEffectiveArmor === 'function' ? getEffectiveArmor(u, 'none') : 0);
  const mdef = (u.mdef || 0) + (typeof getStatusMdefDelta === 'function' ? getStatusMdefDelta(u) : 0);
  const intV = typeof getEffectiveInt === 'function' ? getEffectiveInt(u) : (u.intStat || 0);
  const mov  = typeof getEffectiveMove === 'function' ? getEffectiveMove(u) : (u.move || 0);
  const rng  = typeof getEffectiveRange === 'function' ? getEffectiveRange(u) : (u.range || 0);
  const crt  = Math.round((typeof getCritChance === 'function' ? getCritChance(u) : 0) * 100);
  const eva  = Math.round((typeof getEvasionChance === 'function' ? getEvasionChance(u) : 0) * 100);
  const HELP = (typeof window !== 'undefined' && window.STAT_HELP) || {};
  const cells = [
    { k: 'ATK',  v: atk,        base: u.atk || 0 },
    { k: 'DEF',  v: def,        base: u.def || 0 },
    { k: 'MDEF', v: mdef,       base: u.mdef || 0 },
    { k: 'INT',  v: intV,       base: u.intStat || 0 },
    { k: 'MOV',  v: mov,        base: u.move || 0 },
    { k: 'RNG',  v: rng,        base: u.range || 0 },
    { k: 'CRT',  v: crt + '%',  tip: HELP.crt },
    { k: 'EVA',  v: eva + '%',  tip: HELP.eva },
  ];
  return h('div', { key: 'qs', className: 'hrlg-qstats' },
    cells.map(c => {
      const cls = (typeof c.v === 'number' && c.base != null)
        ? (c.v > c.base ? ' up' : c.v < c.base ? ' dn' : '') : '';
      return h('span', { key: c.k, className: 'hrlg-qstat' + cls, title: c.tip || undefined },
        h('span', { className: 'hrlg-qstat-lbl' }, c.k),
        h('span', { className: 'hrlg-qstat-val' }, String(c.v)));
    }),
  );
}

function HorologeMenu({ view, panels, fc, factionKey, roman, unitName, subLine, portraitUrl, portraitIsFace, onPortraitClick, infoOpen, onInfo, unitKey, burning, poisoned, statusChips, ap, maxAP, hp, maxHp, mp, maxMp, xp, mats, buildCharge, modeLabel, am, pushers, build, items, confirm, onItem, onAction, onEndTurn, onCancel }) {
  const clockApi = useRef({}).current;
  const rigRef = useRef(null);
  const listRef = useRef(null);
  const [fireId, setFireId] = useState(null);
  const [hoverCost, setHoverCost] = useState(0);
  const inputDev = useInputDevice();

  // the ACTIVE panel is the last one in the cascade — it owns the cursor,
  // the keyboard, the wheel and the description bar
  const _panels = panels || [];
  const activePanel = _panels.length ? _panels[_panels.length - 1] : null;
  const blades = activePanel ? activePanel.blades : [];
  const viewKey = activePanel ? activePanel.key : 'none';

  // ── cursor selection: tracked by row ID so the list keeps its heading
  // when availability re-sorts costs or AP ticks re-render us.
  const [selId, setSelId] = useState(null);
  let selIdx = blades.findIndex(b => b.id === selId);
  if (selIdx < 0) {
    // default heading: the item the engine pre-targeted (pending ✓), else
    // the first live entry; nothing left to do → END TURN for a one-click finish
    selIdx = blades.findIndex(b => b.check);
    if (selIdx < 0) selIdx = blades.findIndex(b => b.available && b.id !== 'end');
    if (selIdx < 0) selIdx = blades.findIndex(b => b.id === 'end');
    if (selIdx < 0) selIdx = 0;
  }
  const selBlade = blades[selIdx] || null;

  // a fresh unit or a different menu view takes the wheel → reset the cursor
  useEffect(() => { setSelId(null); }, [unitKey, viewKey]);

  // keep the cursor row in view when the keyboard/wheel drives a long list
  useEffect(() => {
    const root = listRef.current;
    const el = root && root.querySelector('.hrlg-blade.sel');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [selIdx, viewKey]);

  // entering a sub-menu winds the minute hand a full revolution
  const prevView = useRef(viewKey);
  useEffect(() => {
    if (viewKey !== prevView.current) {
      if (view === 'root') { if (clockApi.rest) clockApi.rest(); }
      else if (clockApi.wind) clockApi.wind(360);
      prevView.current = viewKey;
    }
  }, [viewKey]);

  const hoverBlade = (b, on, e) => {
    const dead = !b.available && !b.forceLive;
    if (on) {
      // the cursor FOLLOWS the mouse — hover IS selection (one mental model)
      if (b.id !== (selBlade && selBlade.id)) setSelId(b.id);
      if (!dead && clockApi.aim) clockApi.aim(90);
      setHoverCost(!dead && typeof b.cost === 'number' ? b.cost : 0);
      if (b.hoverIn) b.hoverIn(e && e.nativeEvent || e);
      else if (b.id === 'attack' && b.available && typeof previewAttackRange === 'function') previewAttackRange();
    } else {
      if (clockApi.rest) clockApi.rest();
      setHoverCost(0);
      if (b.hoverOut) b.hoverOut();
      else if (b.id === 'attack' && typeof clearAttackRangePreview === 'function') clearAttackRangePreview();
    }
  };

  const fireBlade = (b) => {
    if (!b.available && !b.forceLive) return;
    // firing a row also moves the cursor there, so ENTER / the desc bar
    // keep tracking the row the player actually used
    if (b.id !== 'end' && b.id !== 'cancel') setSelId(b.id);
    if (clockApi.strike) clockApi.strike(90);
    if (typeof playSfx === 'function') playSfx(b.id === 'end' ? 'uiConfirm' : b.id === 'cancel' ? 'uiCursorMove' : 'uiButtonConfirm');
    setFireId(b.id); setTimeout(() => setFireId(null), 240);
    // Ending the turn kicks off camera + banner travel — drop the menu NOW
    // so the click visibly registered (it re-appears with the next unit).
    if (b.id === 'end' && typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(700);
    if (b.id === 'end') onEndTurn();
    else if (b.id === 'cancel') onCancel();
    else if (b.fire) b.fire();
    else onAction(b);
  };

  // ── SMT-style description bar: the bottom bar always describes the
  // SELECTED row's spell; hover elsewhere overrides it briefly.
  // Driven straight from render (the bar is a plain DOM node outside React,
  // and _setSpellDescBase no-ops when the spell hasn't changed).
  const selSpell = selBlade && selBlade.spell ? selBlade.spell : null;
  if (typeof _setSpellDescBase === 'function') _setSpellDescBase(selSpell);
  useEffect(() => () => { if (typeof _setSpellDescBase === 'function') _setSpellDescBase(null); }, []);

  // ↑/↓ move the cursor; hard stops at both ends with a physical "bump".
  const cycle = (dir) => {
    if (blades.length < 2) return;
    const next = selIdx + dir;
    if (next < 0 || next >= blades.length) {
      if (rigRef.current && rigRef.current.animate) {
        rigRef.current.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (dir > 0 ? 4 : -4) + 'px)' }, { transform: 'translateY(0)' }],
          { duration: 130, easing: 'ease-out' });
      }
      return;
    }
    const b = blades[next];
    setSelId(b.id);
    if (typeof playSfx === 'function') playSfx('uiCursorMove');
    if (clockApi.wind) clockApi.wind(30);   // the minute hand ticks with the cursor
    if (typeof clearAttackRangePreview === 'function') clearAttackRangePreview();
    setHoverCost(0);
  };

  // Scroll on/near the menu moves the cursor — and must NEVER fall through
  // to the board's camera-zoom wheel. Bound on WINDOW in the capture phase
  // with passive:false: any wheel event whose pointer sits inside the rig's
  // box is the menu's. Deltas ACCUMULATE so trackpads glide one row per
  // ~80px instead of one row per micro-event.
  const cycleRef = useRef(cycle); cycleRef.current = cycle;
  useEffect(() => {
    let acc = 0, lastT = 0;
    const onWheel = (e) => {
      const el = rigRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      // don't hijack scrolling inside real overlays (pause menu, dialogs…)
      const t = e.target;
      if (t && t.closest && t.closest('.pause-card, .ew-dialog, .modal, select, textarea')) return;
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (now - lastT > 400) acc = 0;   // stale gesture → fresh accumulator
      lastT = now;
      acc += (e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY);
      const STEP = 80;                  // one mouse notch (~100) = one row
      while (acc >= STEP)  { acc -= STEP; cycleRef.current(1); }
      while (acc <= -STEP) { acc += STEP; cycleRef.current(-1); }
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  // ↑/↓ move the cursor, ENTER fires the selected row — full keyboard
  // play without stealing keys the game already uses (WASD/SPACE/ESC).
  // Arrow OWNERSHIP: while the drum is browsable the arrows belong to the
  // menu cursor and the board keeps WASD (ui.js consults this flag) — one
  // press must never move the menu cursor AND start a provisional board
  // step. While AIMING the arrows go back to the board.
  const _arrowsOwned = view !== 'aim';
  useEffect(() => {
    window._hrlgArrowsOwned = _arrowsOwned;
    return () => { window._hrlgArrowsOwned = false; };
  }, [_arrowsOwned]);
  const fireSelRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (!window._hrlgArrowsOwned) return;   // aiming → arrows steer the board
        e.preventDefault();
        cycleRef.current(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter') {
        if (fireSelRef.current) fireSelRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // ENTER only confirms while browsing menus — never while aiming on the
  // board (there the click on a tile is the confirm; ESC/crown backs out).
  fireSelRef.current = (view === 'aim') ? null : () => { if (selBlade) fireBlade(selBlade); };

  const pips = [];
  const shown = Math.min(maxAP, 8);
  const baseAP = (typeof UNIT_MAX_AP !== 'undefined') ? UNIT_MAX_AP : 2;   // pips past this are level-up bonus AP
  for (let i = 0; i < shown; i++) {
    const on = i < ap;
    const spend = on && hoverCost > 0 && i >= ap - hoverCost;
    pips.push(h('span', {
      key: i,
      className: 'hrlg-pip' + (on ? ' on' : '') + (spend ? ' spend' : '') + (i >= baseAP ? ' bonus' : ''),
    }));
  }

  // the crown — the big bar on top of the identity column. It is ALWAYS
  // END TURN now; backing out of sub-menus moved to the ↩ chip riding the
  // corner of the active panel (plus right-click / ESC / B, unchanged).
  const backable = view !== 'root' || !!am;
  const pressEndTurn = () => {
    if (typeof playSfx === 'function') playSfx('uiConfirm');
    if (clockApi.strike) clockApi.strike(90);
    if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(700);
    onEndTurn();
  };
  const pressBack = () => {
    if (typeof playSfx === 'function') playSfx('uiBack');
    if (clockApi.wind) clockApi.wind(-360);   // unwind what the sub-menu wound
    onCancel();
  };
  // pad B / right-click keep the old dual behavior: back when backable,
  // end turn at the bare root.
  const pressCrown = () => { if (backable) pressBack(); else pressEndTurn(); };

  // ── gamepad bridge: EWPad (state.js) steers the cursor through this hook —
  // same cycle/fire/crown paths the keyboard and mouse use, plus the view
  // name so the pad router knows when the menu owns the left stick.
  const crownRef = useRef(null); crownRef.current = pressCrown;
  window._hrlgPad = {
    view: view,
    blades: blades.length,
    cycle: (d) => cycleRef.current(d),
    fire: () => { if (fireSelRef.current) fireSelRef.current(); },
    crown: () => { if (crownRef.current) crownRef.current(); },
  };
  useEffect(() => () => { window._hrlgPad = null; }, []);

  // ⚒ BUILD + situational one-shots (CHANNEL / DETONATE / ENTROPY…) render
  // as full-size tool rows at the bottom of the identity column — no more
  // tiny overlapping bezel studs. Root view only; presence == opportunity.
  const toolRows = [];
  if (view === 'root' && build) {
    toolRows.push(h('div', {
      key: 'build',
      className: 'hrlg-push' + (build.available ? ' live' : ' off') + (build.active ? ' armed' : ''),
      style: { '--pc': '#c9a24b', '--pc-soft': '#c9a24b88', '--pc-faint': '#c9a24b22' },
      title: build.available
        ? 'Build — dig / place blocks (' + (build.hint || 'B') + ')'
        : 'Build — ' + (build.sub || 'Unavailable'),
      onClick: () => {
        if (!build.available && !build.active) return;
        if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
        if (clockApi.strike) clockApi.strike(-60);
        build.fire();
      },
    },
      h('span', { className: 'hrlg-push-glyph' }, '⚒'),
      h('span', { className: 'hrlg-push-lbl' }, 'BUILD'),
      h('span', { className: 'hrlg-push-sub' }, build.available ? (build.hint || 'B') : (build.sub || '')),
    ));
  }
  if (view === 'root') {
    // Pushers may now be PERMANENT (Channel / Land / Take Off): they carry
    // `available:false` + a `sub` reason instead of vanishing, exactly like
    // the BUILD row above.
    (pushers || []).slice(0, 4).forEach(p => {
      const live = p.available !== false;
      toolRows.push(h('div', {
        key: p.id,
        className: 'hrlg-push' + (live ? ' live pulse' : ' off') + (p.active ? ' armed' : ''),
        style: { '--pc': p.color, '--pc-soft': p.color + '88', '--pc-faint': p.color + '22' },
        title: live ? (p.title || p.label) : ((p.title || p.label) + ' — ' + (p.sub || 'Unavailable')),
        onClick: () => {
          if (!live) return;
          if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
          if (clockApi.strike) clockApi.strike(-60);
          p.fire();
        },
      },
        h('span', { className: 'hrlg-push-glyph' }, p.glyph),
        h('span', { className: 'hrlg-push-lbl' }, p.label),
        h('span', { className: 'hrlg-push-sub' }, live ? (p.hint || '') : (p.sub || '')),
      ));
    });
  }

  return h('div', {
    ref: rigRef, className: 'hrlg-rig',
    style: { '--hfc': fc, '--hfc-soft': fc + '55', '--hfc-faint': fc + '1a' },
    // right-click ANYWHERE on the menu = BACK one level (same as the crown/
    // ESC — never END TURN). The board's own right-click back doesn't fire
    // over the HUD, which is why back "randomly didn't work" over the menu.
    onContextMenu: (e) => {
      e.preventDefault(); e.stopPropagation();
      if (backable) pressBack();
    },
  },
    /* ── the IDENTITY COLUMN: end turn/back, the watch, name, vitals,
       AP, item slots, materials, tool rows — one straight stack, nothing
       absolute, nothing overlapping. */
    h('div', { className: 'hrlg-side' },
      h('div', {
        className: 'hrlg-crown live endturn' + (ap <= 1 ? ' lastap' : ''),
        title: inputDev === 'pad' ? 'End Turn (' + _hintKey('endTurn', 'SPACE') + ' twice)' : 'End Turn (SPACE)',
        onClick: pressEndTurn,
      },
        h('span', { className: 'hrlg-crown-cap' },
          h('span', { className: 'hrlg-crown-arrow' }, '■'),
          h('span', { className: 'hrlg-crown-text' },
            (typeof window._isSimulMode === 'function' && window._isSimulMode()
              && window.GAME?.state?._simulPhase === 'plan') ? 'COMMIT ORDER' : 'END TURN'),
          inputDev === 'pad' && window.EWPad ? h('span', {
            className: 'ew-padbtn ew-padbtn-face ew-padbtn-inline',
          }, _hintKey('endTurn', '')) : null,
        ),
      ),
      h('div', { className: 'hrlg-hubwrap' },
        h(HorologeHub, {
          factionKey: factionKey, api: clockApi,
          portraitUrl: portraitUrl, portraitIsFace: portraitIsFace,
          portraitTitle: 'Center the camera on ' + unitName,
          onPortraitClick: onPortraitClick,
          unitKey: unitKey, burning: burning, poisoned: poisoned,
        }),
      ),
      /* status / stat-change chips — right under the watch portrait, the
         same read as the unit's nameplate badge row */
      (statusChips && statusChips.length) ? h('div', { className: 'hrlg-status-row' },
        statusChips.map(c => h('span', {
          key: c.key,
          className: 'hrlg-schip' + (c.kind ? ' ' + c.kind : ''),
          style: c.bg ? { background: c.bg } : undefined,
          title: c.title || undefined,
        }, c.label)),
      ) : null,
      h('div', { className: 'hrlg-core' },
        h('span', { className: 'hrlg-roman' }, roman + ' · '),
        h('span', { className: 'hrlg-name' }, unitName),
        /* ⓘ INFO — the full stat card (ATK/DEF/MDEF/INT + attack reach).
           Used to be an "Inspect" blade inside the action menu; it's a free
           look, not an action, so it lives with the portrait now. */
        onInfo && h('span', {
          className: 'hrlg-infobtn' + (infoOpen ? ' on' : ''),
          title: infoOpen ? 'Close the stat card (I)' : ('Info — ' + unitName + '’s full stat card (I)'),
          onClick: (e) => { e.stopPropagation(); onInfo(); },
        }, 'ⓘ'),
      ),
      /* identity sub-line — Lv · race · job, in real type, in flow */
      subLine ? h('div', { className: 'hrlg-core-sub' }, subLine) : null,
      /* HP/MP vitals directly under the portrait, then AP under those —
         the reading order the player actually wants. */
      maxHp > 0 && h('div', { className: 'hrlg-vitals' },
        (() => {
          const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
          // canonical ally green — the Horologe always shows YOUR unit
          return h('div', { className: 'hrlg-vbar' },
            h('span', { className: 'hrlg-vfill', style: { width: hpPct + '%', background: HP_ALLY_FILL, boxShadow: HP_ALLY_GLOW } }),
            h('span', { className: 'hrlg-vlbl' }, 'HP'),
            h('span', { className: 'hrlg-vnum' }, Math.max(0, Math.round(hp)) + '/' + maxHp),
          );
        })(),
        maxMp > 0 && (() => {
          const mpPct = Math.max(0, Math.min(100, (mp / maxMp) * 100));
          // Projected MP spend: while the cursor sits on a castable ability
          // row (hover IS selection) — or while a spell is armed and aiming —
          // the cost blinks as a bright slice off the fill's leading edge,
          // with a −N chip on the number. Same read as the HP damage forecast.
          let mpSpend = 0;
          if (selBlade && (selBlade.available || selBlade.check)
              && typeof selBlade.mp === 'number' && selBlade.mp > 0) {
            mpSpend = selBlade.mp;
          } else if (am === 'spell' && typeof state !== 'undefined' && state.selectedTool
              && typeof getSelectedUnit === 'function') {
            const _su = getSelectedUnit();
            const _sp = _su && [...(_su.spells || []), ...(_su._raceAbilities || [])]
              .filter(Boolean).find(s => s.name === state.selectedTool);
            if (_sp) mpSpend = (typeof getSpellMpCostFor === 'function')
              ? getSpellMpCostFor(_su, _sp) : (_sp.cost || 0);
          }
          const spendPct = mpSpend > 0 ? Math.max(0, Math.min(mpPct, (mpSpend / maxMp) * 100)) : 0;
          return h('div', { className: 'hrlg-vbar mp' },
            h('span', { className: 'hrlg-vfill', style: { width: mpPct + '%', background: MP_FILL, boxShadow: MP_GLOW } }),
            spendPct > 0 && h('span', {
              className: 'hrlg-vspend' + (mpSpend > mp ? ' short' : ''),
              style: { left: (mpPct - spendPct) + '%', width: spendPct + '%' },
            }),
            h('span', { className: 'hrlg-vlbl' }, 'MP'),
            h('span', { className: 'hrlg-vnum' }, Math.max(0, Math.round(mp)) + '/' + maxMp,
              mpSpend > 0 ? h('span', { className: 'hrlg-vspendnum' }, ' −' + mpSpend) : null),
          );
        })(),
        /* XP to next level — progression modes only (Mystery Dungeon /
           Challenge / campaign); PvP passes xp:null and shows nothing */
        xp && (() => {
          const xpPct = Math.max(0, Math.min(100, xp.pct || 0));
          return h('div', { className: 'hrlg-vbar mp', style: { height: 7 } },
            h('span', { className: 'hrlg-vfill', style: {
              width: xpPct + '%',
              background: 'linear-gradient(90deg, #b98a1e 0%, #f2c468 60%, #ffe9b0 100%)',
              boxShadow: '0 0 6px rgba(242,196,104,0.45)',
            } }),
            h('span', { className: 'hrlg-vlbl', style: { color: '#f2c468' } }, 'XP'),
            h('span', { className: 'hrlg-vnum', style: { fontSize: 10, color: '#f2c468' } },
              xp.max ? 'MAX' : (Math.floor(xpPct) + '%')),
          );
        })(),
      ),
      h('div', { className: 'hrlg-ap' },
        h('span', { className: 'hrlg-ap-lbl' }, 'AP'),
        pips,
        h('span', { className: 'hrlg-ap-num' }, ap + '/'),
        h('span', { className: 'hrlg-ap-num' + (maxAP > baseAP ? ' bonus' : '') }, maxAP),
      ),
      /* 3 item slots — one-click item use straight from the column
         (the Items submenu still lists everything) */
      items && h('div', { className: 'hrlg-items' },
        [0, 1, 2].map(i => {
          const it = items[i];
          if (!it) return h('div', { key: 'empty' + i, className: 'hrlg-item-slot empty' },
            h('span', { className: 'hrlg-item-glyph' }, '·'));
          return h('div', {
            key: it.key,
            className: 'hrlg-item-slot' + (it.canUse ? '' : ' off') + (it.selected ? ' armed' : ''),
            // healing potion slot reads green like every other heal control
            style: (it.key === 'healPotion' && it.canUse)
              ? { borderColor: '#57d97ecc', boxShadow: '0 0 9px #57d97e44' } : undefined,
            title: it.name + ' ×' + it.count
              + (it.desc ? ' — ' + it.desc : '')
              + (it.canUse ? '' : ' (can’t use right now)'),
            onClick: () => {
              if (!it.canUse) return;
              if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
              if (clockApi.strike) clockApi.strike(150);
              onItem(it.key);
            },
          },
            h('span', { className: 'hrlg-item-glyph' }, it.icon),
            h('span', { className: 'hrlg-item-count' }, '×' + it.count),
          );
        }),
      ),
      /* Team building-material bank — always in view so "can I afford to
         build?" never needs a menu dive. 🧤 marks a banked free build op. */
      mats && h('div', {
        className: 'hrlg-mats',
        title: 'Team building materials — dig terrain, chop trees and wreck structures to bank more. Spent by the Build action and construction spells.',
      },
        h('span', { className: 'hrlg-mats-lbl' }, 'MAT'),
        mats.map(m => h('span', { key: m.k, className: 'hrlg-mat' + (m.n > 0 ? '' : ' none') }, m.icon + ' ' + m.n)),
        buildCharge > 0 ? h('span', { className: 'hrlg-mat free' }, '🧤 +' + buildCharge) : null,
      ),
      toolRows,
    ),
    /* ── the CASCADING COMMAND PANELS — at most TWO on screen: the active
       panel plus its immediate (dimmed) parent; deeper ancestors hide so
       the cascade never sprawls across the board. Clicking the dimmed
       parent backs up to it. */
    h('div', { className: 'hrlg-panels' },
      _panels.slice(-2).map((p) => {
        const isOn = p === activePanel;
        // CONFIRM rides the END of the pending (✓) row itself; only when the
        // pending pick has no matching row (free board-click aim) does the
        // big standalone button appear above the list as a fallback.
        const _ckIdx = (isOn && confirm) ? p.blades.findIndex(b => b.check) : -1;
        return h('div', {
          key: p.key,
          className: 'hrlg-panel' + (isOn ? ' on' : ' bg') + (p.key === 'root' ? ' root' : ''),
          style: { zIndex: isOn ? 5 : 4 },
          title: isOn ? undefined : 'Back to this menu',
          onClick: isOn ? undefined : () => pressBack(),
        },
          isOn && confirm && _ckIdx < 0 && h('div', {
            className: 'hrlg-confirm',
            onClick: () => {
              if (typeof playSfx === 'function') playSfx('uiConfirm');
              if (clockApi.strike) clockApi.strike(90);
              confirm.fire();
            },
          },
            h('span', { className: 'hrlg-confirm-check' }, '✓'),
            h('span', { className: 'hrlg-confirm-lbl' },
              'CONFIRM', confirm.label ? h('span', { className: 'hrlg-confirm-tgt' }, ' — ' + confirm.label) : null),
          ),
          isOn && modeLabel && h('div', { className: 'hrlg-mode' }, modeLabel),
          /* ↩ BACK chip — corner of every sub-menu: arrow pointing at the
             (dimmed) parent to the left + the input that triggers it
             (right-click, or B on a pad). */
          isOn && backable && h('div', {
            className: 'hrlg-backchip',
            title: inputDev === 'pad'
              ? 'Back to the previous menu (' + _hintKey('cancel', 'ESC') + ')'
              : 'Back to the previous menu (right-click or ESC)',
            onClick: (e) => { e.stopPropagation(); pressBack(); },
          },
            h('span', { className: 'hrlg-backchip-arrow' }, '◀'),
            h('span', { className: 'hrlg-backchip-lbl' }, 'BACK'),
            inputDev === 'pad' && window.EWPad
              ? h('span', { className: 'ew-padbtn ew-padbtn-face' }, _hintKey('cancel', ''))
              : h(_HrlgRmbIcon),
          ),
          /* panel header: ONE cohesive blade — the menu name, and for a
             clicked unit its live HP/MP bars + full stat readout, all in
             the same parallelogram of blade material. Vitals/stats are
             built HERE (not in the prebuilt title node) so the hover-
             driven re-render refreshes the blinking forecast slice. */
          (() => {
            const _qv = _hrlgQuickVitals(p.key);
            if (!p.title && !_qv) return null;
            const _side = /^(enemy|ally)\|/.exec(p.key || '');
            return h('div', { className: 'hrlg-thead' + (_side ? ' ' + _side[1] : '') },
              p.title && h('div', { className: 'hrlg-view-tab' },
                p.title.node || h(React.Fragment, null,
                  p.title.icon && h('span', { className: 'hrlg-view-tab-icon' }, p.title.icon),
                  h('span', { className: 'hrlg-view-tab-text' }, p.title.text),
                  p.title.count && h('span', { className: 'hrlg-view-tab-count' }, p.title.count),
                ),
              ),
              _qv,
              _qv && _hrlgQuickStats(p.key),
            );
          })(),
          h('div', { className: 'hrlg-list', ref: isOn ? listRef : undefined },
            p.blades.map((b, i) => h(HorologeBlade, {
              key: b.id, b: b, idx: i,
              sel: isOn && i === selIdx,
              active: b.id !== 'end' && b.id !== 'cancel' && (am === b.id || b.selected),
              muted: !isOn,
              fireId: isOn ? fireId : null,
              confirmBtn: (isOn && i === _ckIdx) ? confirm : null,
              // Dimmed-parent rows are LIVE SHORTCUTS: clicking a usable row
              // switches straight to that submenu/action (chooseActionMenu /
              // setActionMode / setTool all re-arm cleanly from any view) —
              // no more back-up-then-click-again two-step. Unusable rows
              // still bubble to the panel click = plain back-up.
              onFire: isOn ? fireBlade : (b2, e) => {
                // END TURN / CANCEL never fire from a dimmed panel — a click
                // meant as "back" must not end the turn. They bubble = back.
                if (b2.id === 'end' || b2.id === 'cancel') return;
                if (!b2.available && !b2.forceLive) return;
                if (e && e.stopPropagation) e.stopPropagation();
                fireBlade(b2);
              },
              onHover: isOn ? hoverBlade : () => {},
            })),
          ),
        );
      }),
      /* aim modes with no panel (move/jump) still explain themselves —
         and still carry the corner BACK chip */
      (!_panels.length && modeLabel) ? h('div', { className: 'hrlg-lone' },
        backable && h('div', {
          className: 'hrlg-backchip lone',
          title: inputDev === 'pad'
            ? 'Back (' + _hintKey('cancel', 'ESC') + ')'
            : 'Back (right-click or ESC)',
          onClick: (e) => { e.stopPropagation(); pressBack(); },
        },
          h('span', { className: 'hrlg-backchip-arrow' }, '◀'),
          h('span', { className: 'hrlg-backchip-lbl' }, 'BACK'),
          inputDev === 'pad' && window.EWPad
            ? h('span', { className: 'ew-padbtn ew-padbtn-face' }, _hintKey('cancel', ''))
            : h(_HrlgRmbIcon),
        ),
        h('div', { className: 'hrlg-mode lone' }, modeLabel),
      ) : null,
    ),
  );
}

/* ═══ Carousel item builders ══════════════════════════════════════
   EVERY menu view — abilities, items, more, switch, pings, targets,
   the enemy/tile quick menus — builds plain blade items and renders
   through the SAME Horologe drum as the root verbs. One instrument,
   one look, one interaction (scroll to cycle, click center to fire,
   crown/ESC to back out). Rich spell detail lives in the hover
   tooltip, not a side panel. */

const _HRLG_CAT = {
  damage: { icon: '⚔', color: '#ff5340' },
  heal:   { icon: '♥', color: '#57d97e' },
  buff:   { icon: '▲', color: '#4aa8ff' },
  debuff: { icon: '▼', color: '#b06ae0' },
  utility:{ icon: '◎', color: '#c9a24b' },
};

// The TYPE badge (HUMAN/TECH/…) rides the name row — it's the matchup
// intel. Delivery (PHYSICAL/MAGIC/UTILITY), range class (MELEE/RANGED) and
// the target chip moved DOWN into the bottom description bar
// (_renderSpellDescBar) so ability rows stay one clean line each.
const _HRLG_TYPE_FS = 10;
const _HRLG_TYPE_PAD = '2px 7px';
// What kind of thing does this spell AIM at? One glanceable chip so the player
// knows BEFORE clicking whether they'll be picking a tile, an enemy, an ally,
// or nothing at all — the #1 source of "why is it asking me for an enemy?"
// confusion with the terraforming spells.
function spellTargetChip(sp) {
  if (typeof isSpellSelfCast === 'function' && isSpellSelfCast(sp)) {
    return { label: '⟳ SELF', color: '#9aa4b0', title: 'Casts on/around the caster — no aiming needed' };
  }
  const k = sp.kind || '';
  if (k === 'raiseDead') {
    return { label: '🪦 REMAINS', color: '#b8a2d8', title: "Select a fallen unit's remains — ally gravestone or enemy bones" };
  }
  if (['heal', 'shield', 'buff', 'cleanse', 'revive', 'guard', 'healAll', 'manaRestoreAll', 'warCry', 'encore'].includes(k)) {
    return { label: '♥ ALLY', color: '#57d98a', title: 'Select an allied unit' };
  }
  if (typeof isSpellTileTargeted === 'function' && isSpellTileTargeted(sp)) {
    return { label: '⬚ TILE', color: '#57c7ff', title: 'Select a tile on the board — units optional' };
  }
  return { label: '◎ ENEMY', color: '#ff8a7a', title: 'Select an enemy unit' };
}

function _hrlgSpellBadges(sp) {
  const badges = [];
  if (sp.spellType) badges.push({
    label: sp.spellType.toUpperCase(),
    style: typeBadgeStyleFor(sp.spellType, { fontSize: _HRLG_TYPE_FS, padding: _HRLG_TYPE_PAD }),
    title: 'Spell type — drives type advantage',
  });
  return badges;
}

function _hrlgSpellBlades(unit, st) {
  const am = st.actionMode;
  const spells = [...(unit.spells || []), ...(unit._raceAbilities || [])].filter(Boolean);
  const mpPenalty = typeof unitHasStatus === 'function' && unitHasStatus(unit, 'silence') ? 999 : 0;
  const tierOrder = { 'I': 1, 'II': 2, 'III': 3 };

  const _isAvail = (sp) => {
    const cost = (typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(unit, sp) : (sp.cost || 0);
    const canAfford = unit.mp >= (cost + mpPenalty) && (typeof canAffordSpell === 'function' ? canAffordSpell(unit, sp) : true);
    if (!canAfford) return false;
    const hasTarget = typeof hasSpellTargetInRange === 'function' ? hasSpellTargetInRange(unit, sp) : true;
    // No target where it stands, but it could step into range and still cast
    // this turn → keep it usable (move-then-cast), don't grey it out.
    const canReach = !hasTarget && typeof spellHasReachableTarget === 'function' && spellHasReachableTarget(unit, sp);
    return hasTarget || canReach;
  };
  // Memoize availability — _isAvail can run a move-into-range probe, and a
  // sort comparator would otherwise call it O(n log n) times per spell.
  const _availCache = new Map();
  const _availOf = (sp) => {
    if (!_availCache.has(sp)) _availCache.set(sp, _isAvail(sp));
    return _availCache.get(sp);
  };
  // The list reads by JOB: damage first, then debuffs, heals, buffs, utility
  // — castable before blocked, cheapest tier first inside each group.
  const _catRank = { damage: 0, debuff: 1, heal: 2, buff: 3, utility: 4 };
  const _catOf = (sp) => (typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage'));
  spells.sort((a, b) => {
    const aAvail = _availOf(a) ? 0 : 1;
    const bAvail = _availOf(b) ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    const cr = (_catRank[_catOf(a)] ?? 5) - (_catRank[_catOf(b)] ?? 5);
    if (cr !== 0) return cr;
    return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
  });

  let castableCount = 0;
  const blades = spells.map((sp, i) => {
    const cost = (typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(unit, sp) : (sp.cost || 0);
    const apCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
    const isSilenced = mpPenalty > 0;
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(unit, sp) : true;
    const canAfford = !isSilenced && tierOk && unit.mp >= cost && (typeof canAffordSpell === 'function' ? canAffordSpell(unit, sp) : true);
    const hasTarget = typeof hasSpellTargetInRange === 'function' ? hasSpellTargetInRange(unit, sp) : true;
    const canReach = canAfford && !hasTarget && typeof spellHasReachableTarget === 'function' && spellHasReachableTarget(unit, sp);
    const canCast = canAfford && (hasTarget || canReach);
    const needsMove = canCast && !hasTarget && canReach;
    if (canAfford) castableCount++;

    const cdLeft = typeof getSpellCooldownRemaining === 'function' ? getSpellCooldownRemaining(unit, sp) : 0;
    let reason = '';
    if (!canCast) {
      // The UNIVERSAL guard (battle.js getSpellBlockReason) speaks first —
      // silence/tier/cooldown/MP/AP/materials/prisms AND hard locks like the
      // Berserker's Brand. New block rules added there grey out here for free.
      const _why = (typeof getSpellBlockReason === 'function') ? getSpellBlockReason(unit, sp) : null;
      if (_why) reason = _why;
      else if (isSilenced) reason = 'Silenced';
      else if (!tierOk) { const trl = sp.tier === 'II' ? 2 : sp.tier === 'III' ? 3 : 1; reason = 'Req Lv.' + trl; }
      else if (cdLeft > 0) reason = '⏳ CD ' + cdLeft;
      else if (unit.mp < cost) reason = 'No MP';
      else if ((unit.ap || 0) < apCost) reason = 'No AP';
      else if (sp.materialCost && typeof canAffordMaterials === 'function' && !canAffordMaterials(unit.player, sp.materialCost)) {
        reason = 'Need ' + (typeof materialCostLabel === 'function' ? materialCostLabel(sp.materialCost) : 'materials');
      }
      else if (typeof _mirrorSpellBlockReason === 'function' && _mirrorSpellBlockReason(unit, sp)) reason = _mirrorSpellBlockReason(unit, sp);
      // Pure-status spells also grey out when every target in range already
      // carries the status (statuses don't stack) — say so.
      else if (!hasTarget) reason = (typeof spellIsPureStatus === 'function' && spellIsPureStatus(sp)) ? 'No valid target' : 'No target';
    }

    const cat = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
    const cc = _HRLG_CAT[cat] || _HRLG_CAT.damage;
    const powerStat = spellPowerStat(sp);

    // ── badge row: the spell's TYPE (anomaly/tech/…) is critical intel —
    // it drives strong/weak matchups — so it rides ON the blade next to the
    // name at name size, with small delivery/range chips after it. Exact
    // range + tier live in the bottom description bar, not on the blade.
    const badges = _hrlgSpellBadges(sp, cat);

    return {
      id: 'sp:' + (sp.name || i),
      icon: cc.icon, iconColor: cc.color,
      catColor: cc.color,   // tints the whole blade — red damage, green heal…
      label: sp.name,
      badges: badges,
      spell: sp,
      available: canCast,
      selected: am === 'spell' && st.selectedTool === sp.name,
      power: powerStat ? { v: powerStat.value, color: powerStat.color } : null,
      mp: cost, cost: apCost,
      note: needsMove ? 'MOVE→CAST' : null,
      sub: reason || null,
      fire: () => { hideSpellTooltip(); if (canCast && typeof setTool === 'function') setTool('spell', sp.name); },
      hoverIn: (e) => { showSpellTooltip(sp, e); if (canCast && typeof previewSpellRange === 'function') previewSpellRange(sp.name); },
      hoverOut: () => { hideSpellTooltip(); if (canCast && typeof clearSpellRangePreview === 'function') clearSpellRangePreview(); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '✦', label: 'No abilities', available: false });

  return { title: { icon: '✦', text: 'Abilities', count: castableCount + '/' + spells.length }, blades };
}

function _hrlgItemBlades(unit, st) {
  const am = st.actionMode;
  const heldKeys = typeof ITEM_RULES !== 'undefined'
    ? Object.keys(ITEM_RULES).filter(k => (unit.items?.[k] || 0) > 0) : [];
  // Greyed-out (currently unusable) items sink to the bottom so usable ones lead.
  if (typeof canUseItemNow === 'function') {
    heldKeys.sort((a, b) => (canUseItemNow(unit, a) ? 0 : 1) - (canUseItemNow(unit, b) ? 0 : 1));
  }
  // Mystery Dungeon floors: every row grows a ⤵ DROP chip — one click puts
  // the item on the unit's tile (state._mdItems) for a teammate to scoop up.
  const mdFloor = typeof window._isDungeonMode === 'function' && window._isDungeonMode()
    && st._mdPhase === 'floor' && !!st._mdRun;
  const blades = heldKeys.map(itemKey => {
    const count = unit.items?.[itemKey] || 0;
    const rules = typeof ITEM_RULES !== 'undefined' ? ITEM_RULES[itemKey] : null;
    const canUse = typeof canUseItemNow === 'function' ? canUseItemNow(unit, itemKey) : true;
    let reason = '';
    if (!canUse) {
      if (itemKey === 'healPotion') reason = 'HP full';
      else if (itemKey === 'manaPotion') reason = 'No ally needs MP';
      else reason = 'Can\'t use';
    }
    // healing items wear heal-green edge to edge, like heal spells do
    const isHealItem = itemKey === 'healPotion';
    return {
      id: 'it:' + itemKey,
      icon: rules?.icon || '❖',
      iconColor: isHealItem ? '#57d97e' : undefined,
      catColor: isHealItem ? '#57d97e' : undefined,
      label: rules?.name || itemKey,
      available: canUse,
      // dungeon rows stay clickable even when unusable — the DROP chip works
      forceLive: mdFloor && !canUse,
      selected: am === 'item' && st.selectedTool === itemKey,
      count: '×' + count,
      sub: reason || null,
      drop: mdFloor ? {
        label: '⤵ DROP',
        title: 'Drop one ' + (rules?.name || itemKey) + ' on this tile — walk over it later to pick it back up',
        fire: () => { if (typeof window._mdDropItem === 'function') window._mdDropItem(unit.id, itemKey); },
      } : null,
      fire: () => { if (canUse && typeof chooseItemAction === 'function') chooseItemAction(itemKey); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '❖', label: 'No items', available: false });
  return { title: { icon: '❖', text: 'Items', count: heldKeys.length + '' }, blades };
}

/* ── Build-mode hotbar (2026-07-10): ⛏ Dig + one blade per placeable
   material — a Minecraft hotbar rendered as Horologe blades. Clicking a
   blade arms that tool; board clicks then dig/place instantly (no confirm
   step — the hover ghost IS the preview). Counts read the TEAM bank. */
function _hrlgBuildBlades(unit, st) {
  const tool = st._buildTool || 'dig';
  const mats = (typeof getMaterials === 'function') ? getMaterials(unit.player) : {};
  const armTool = (t) => {
    st._buildTool = t;
    if (typeof playSfx === 'function') playSfx('uiCursorFocus');
    // Tool swap changes which tiles are valid → repaint reach highlights.
    if (window._ewHlCache) { window._ewHlCache = { key: '', map: new Map(), zMap: new Map() }; }
    if (typeof markDirty === 'function') { markDirty('hud', 'board'); renderIfDirty(); }
    if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
  };
  const blades = [{
    id: 'bld:dig', icon: '⛏', label: 'Dig',
    available: true, selected: tool === 'dig',
    hint: '+salvage',
    fire: () => armTool('dig'),
  }];
  const defs = (typeof BUILD_MATERIALS !== 'undefined') ? BUILD_MATERIALS : {};
  for (const k of Object.keys(defs)) {
    const n = mats[k] || 0;
    blades.push({
      id: 'bld:' + k, icon: defs[k].icon, label: defs[k].label,
      count: n > 0 ? '×' + n : null,
      available: n > 0, selected: tool === k,
      sub: n > 0 ? null : 'None banked',
      fire: () => { if (n > 0) armTool(k); },
    });
  }
  return blades;
}

function _hrlgSwitchBlades(unit, st) {
  const reserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(unit.player) : [];
  const switchCost = (typeof getActiveMultiplayerMode === 'function' && getActiveMultiplayerMode()?.switchApCost) || 2;
  const canPay = (unit.ap || 0) >= switchCost;
  const blades = reserves.map(r => {
    const hpPct = r.maxHp > 0 ? Math.round((r.hp / r.maxHp) * 100) : 0;
    return {
      id: 'sw:' + r.id,
      icon: '⇄',
      label: typeof unitDisplayName === 'function' ? unitDisplayName(r) : (r.name || r.cls),
      available: canPay,
      cost: switchCost,
      meta: { text: hpPct + '%', color: HP_ALLY },
      sub: canPay ? null : 'No AP',
      fire: () => { if (canPay && typeof doSwitch === 'function') doSwitch(unit, r.id); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '⇄', label: 'No reserves left', available: false });
  return { title: { icon: '🔄', text: 'Switch', count: reserves.length + '' }, blades };
}

function _hrlgPingBlades() {
  const pingKeys = typeof PING_TYPES !== 'undefined' ? Object.keys(PING_TYPES) : [];
  const blades = pingKeys.map(pk => {
    const pt = PING_TYPES[pk];
    return {
      id: 'ping:' + pk, icon: pt.icon, iconColor: pt.color || undefined,
      label: pt.label, available: true,
      fire: () => { if (typeof setTool === 'function') setTool('ping', pk); },
    };
  });
  return { title: { icon: '📍', text: 'Ping', count: pingKeys.length + '' }, blades };
}

function _hrlgOrientationBlades(st) {
  const mk = (dir, icon, label) => ({
    id: 'or:' + dir, icon, label, available: true,
    fire: () => { if (typeof setSpellOrientation === 'function') setSpellOrientation(dir); },
  });
  return {
    title: { icon: '✦', text: st.selectedTool || 'Orientation' },
    blades: [mk('horizontal', '↔', 'Horizontal'), mk('vertical', '↕', 'Vertical')],
  };
}

// Attack / spell target pickers. First click centers + marks ✓ (the
// engine pre-marks the nearest target), second click confirms and the
// menus drop instantly.
/* Face-art payload for a target blade: portrait URL (map-sprite fallback),
   ally/enemy framing relative to the ACTING unit, KO state (revive targets)
   and the live HP/shield numbers the row's bar renders. */
function _hrlgPortraitData(u, actingUnit) {
  let url = typeof getUnitPortraitUrl === 'function' ? getUnitPortraitUrl(u) : null;
  const isFace = !!url;
  if (!url && typeof getBattleMapSpriteUrl === 'function') url = getBattleMapSpriteUrl(u);
  if (!url && typeof getUnitSprite === 'function') url = getUnitSprite(u.cls, u.player, u);
  if (!url) return null;
  return {
    url, isFace,
    ally: actingUnit ? u.player === actingUnit.player : false,
    ko: !!u.dead,
    hp: Math.max(0, Math.round(u.hp || 0)), maxHp: u.maxHp || 0,
    shield: u.shield || 0,
  };
}

function _hrlgTargetBlades(unit, st, mode) {
  let targets = [], titleText = 'Targets', titleIcon = '⌖';
  let spell = null;
  if (mode === 'attack') {
    /* Terrain cubes are destroyed by right-click-HOLDING them on the board
       (see beginTileDemolishHold in battle.js) — listing every smashable
       column here buried the real targets under "Smash Terrain" rows. */
    targets = (typeof _getAttackValidTargets === 'function' ? _getAttackValidTargets(unit) : [])
      .filter(t => t.kind !== 'terrain');
    titleText = 'Attack'; titleIcon = '×';
  } else {
    spell = (unit.spells || []).find(s => s.name === st.selectedTool) || (unit._raceAbilities || []).find(s => s.name === st.selectedTool);
    targets = spell && typeof _getSpellValidTargets === 'function' ? _getSpellValidTargets(unit, spell) : [];
    titleText = st.selectedTool || 'Spell'; titleIcon = '✦';
  }
  const isOffensive = mode === 'attack' || (spell && !['heal', 'shield', 'buff', 'scan'].includes(spell.kind));

  const blades = targets.map((t, i) => {
    const isPending = st.pendingTarget && st.pendingTarget.x === t.x && st.pendingTarget.y === t.y;
    let label = '', hpVal = 0, hpMax = 0, tUnit = t.unit || null;
    if (tUnit) {
      label = typeof unitDisplayName === 'function' ? unitDisplayName(tUnit) : (tUnit.name || tUnit.cls);
      hpVal = tUnit.hp; hpMax = tUnit.maxHp;
    } else if (t.kind === 'tower') { label = '⬡ Cube'; hpVal = t.tower.hp; hpMax = t.tower.maxHp || t.tower.hp; }
    else if (t.kind === 'turret') { label = '🔧 Turret'; hpVal = t.turret.hp; hpMax = t.turret.maxHp || t.turret.hp; }
    else if (t.kind === 'deployedObj') { label = '📦 ' + (t.deployedObj.spellName || 'Object'); hpVal = t.deployedObj.hp; hpMax = t.deployedObj.maxHp || t.deployedObj.hp; }
    else if (t.kind === 'seed') { label = '🌱 ' + (t.seedName || 'Seed'); }
    else if (t.kind === 'tree') { label = '🪓 Chop Tree'; }
    else if (t.kind === 'building') {
      label = '🏢 ' + (typeof buildingDisplayName === 'function' ? buildingDisplayName(t.building) : 'Building');
      hpVal = t.building.hp; hpMax = t.building.maxHp || t.building.hp;
    } else { label = typeof coordLabel === 'function' ? coordLabel(t.x, t.y) : (t.x + ',' + t.y); }

    // Type matchup vs THIS target — judged by the spell's own type when a
    // spell is being aimed (not the caster's types), STAB factored out so
    // "super effective" always means the actual weak/resist matchup.
    let superEff = false, typeAdv = '';
    // Matchup markers only make sense for casts that actually DEAL damage —
    // a pure debuff/utility can't be "super effective".
    if (tUnit && isOffensive && (mode === 'attack' || (spell && spellDealsDamage(spell)))
        && typeof getTypeDamageMultiplier === 'function'
        && typeof isEnemyUnit === 'function' && isEnemyUnit(unit, tUnit)) {
      const _spType = spell ? (spell.spellType || null) : null;
      const _stab = (_spType && (unit.types || []).includes(_spType))
        ? ((typeof STAB_MULTIPLIER !== 'undefined') ? STAB_MULTIPLIER : 1.25) : 1;
      const _eff = getTypeDamageMultiplier(unit, tUnit, _spType) / _stab;
      if (_eff > 1.001) superEff = true;
      else if (_eff < 0.999) typeAdv = '▼';
    }
    const hpPct = hpMax > 0 ? Math.max(0, Math.round((hpVal / hpMax) * 100)) : null;
    const tz = (tUnit && tUnit.z != null) ? tUnit.z : undefined;

    // Unit targets get the JRPG treatment (face + live HP bar on the blade);
    // structures keep the old hp% text since they have no face art.
    const portrait = tUnit ? _hrlgPortraitData(tUnit, unit) : null;

    // Damage forecast: EVERY offensive unit row blinks the projected damage
    // in white on its HP bar — same read as the nameplate forecast — so the
    // player sees the outcome while browsing targets, not only after arming
    // (predictDamageToUnit, ui.js — mid estimate IF it lands; dodge/counter/
    // crit stay a gamble).
    const previewDmg = (tUnit && isOffensive
        && typeof predictDamageToUnit === 'function'
        && typeof isEnemyUnit === 'function' && isEnemyUnit(unit, tUnit))
      ? predictDamageToUnit(unit, tUnit, spell || null) : 0;
    // Heal forecast: support casts on allies show the projected restore in
    // green on the row's HP bar (same estimator as the nameplate forecast).
    const previewHeal = (tUnit && !isOffensive && spell
        && typeof _estimateSpellHeal === 'function'
        && !(typeof isEnemyUnit === 'function' && isEnemyUnit(unit, tUnit)))
      ? _estimateSpellHeal(unit, tUnit, spell) : 0;

    return {
      id: 'tg:' + i + ':' + t.x + ',' + t.y,
      icon: typeAdv || '⌖',
      iconColor: typeAdv === '▼' ? EW.bad : undefined,
      label: label,
      available: true,
      check: !!isPending,
      superEff: superEff,
      previewDmg: previewDmg,
      previewHeal: previewHeal,
      // Forecast chip on the armed row: "≈−34" / "≈+34" (reuses the power chip slot).
      power: previewDmg > 0 ? { v: '≈−' + previewDmg, color: EW.bad }
        : previewHeal > 0 ? { v: '≈+' + previewHeal, color: '#57d97e' } : undefined,
      portrait: portrait,
      meta: portrait
        ? { text: t.dist + 't' }
        : { text: (hpPct != null ? hpPct + '% · ' : '') + t.dist + 't' },
      // Pass the target's own elevation so an airborne unit (or the upper
      // unit of a stack) is hit — not whoever stands on the ground below.
      // Second (confirming) click fires the action → hide the menus NOW.
      fire: () => {
        if (isPending && typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction();
        if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(t.x, t.y, tz);
      },
    };
  });
  // (The ×1/×2/×3 multi-strike picker is gone: an attack ENDS the turn, so
  // extra swings only exist via a press refund — never pre-promisable. The
  // repeat queue itself survives for click-again-while-animating chains,
  // which re-validate AP per swing and so continue exactly when a press
  // handed the AP back.)

  if (!blades.length) {
    blades.push({
      id: 'none', icon: titleIcon, available: false,
      label: (mode === 'attack' && typeof attackHasReachableTarget === 'function' && attackHasReachableTarget(unit))
        ? 'Click an enemy to move + attack' : 'No targets in range',
    });
  }
  return { title: { icon: titleIcon, text: titleText, count: targets.length + '' }, blades };
}

/* Unit-targeted ITEMS (potions on allies, banes thrown at enemies) get the
   same portrait + HP-bar target drum as attacks and spells — no more blind
   board-click aiming. Validity mirrors doItem: potions reach ANY living
   ally, banes need a living enemy within effective range + 2 (chebyshev). */
function _hrlgItemTargetBlades(unit, st) {
  const key = st.selectedTool;
  const rule = (typeof ITEM_RULES !== 'undefined') ? ITEM_RULES[key] : null;
  const isBane = !!(rule && rule.baneType);
  const isHeal = key === 'healPotion';
  const isMana = key === 'manaPotion';

  let targets = [];
  const living = (st.units || []).filter(u => !u.dead);
  if (isBane) {
    const range = (typeof getEffectiveRange === 'function' ? getEffectiveRange(unit) : 1) + 2;
    targets = living
      .filter(u => (typeof isEnemyUnit === 'function' ? isEnemyUnit(u, unit) : u.player !== unit.player))
      .map(u => ({ unit: u, dist: Math.max(Math.abs(u.x - unit.x), Math.abs(u.y - unit.y)) }))
      .filter(t => t.dist <= range);
  } else {
    targets = living
      .filter(u => u.player === unit.player)
      .map(u => ({ unit: u, dist: Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y) }));
  }
  targets.sort((a, b) => a.dist - b.dist);

  const blades = targets.map((t, i) => {
    const u = t.unit;
    const isPending = st.pendingTarget && st.pendingTarget.x === u.x && st.pendingTarget.y === u.y;
    let available = true, sub = null;
    if (isHeal && u.hp >= u.maxHp) { available = false; sub = 'Full HP'; }
    else if (isMana && !(u.maxMp > 0)) { available = false; sub = 'No MP pool'; }
    else if (isMana && u.mp >= u.maxMp) { available = false; sub = 'Full MP'; }
    const baneHit = isBane && (u.types || []).includes(rule.baneType);
    // Healing Potion rows: projected restore in green on the row's HP bar
    // (percent-of-max × terrain, clamped — mirrors doItem via ui.js).
    const previewHeal = (isHeal && available && typeof _estimateHealPotionHeal === 'function')
      ? _estimateHealPotionHeal(u) : 0;
    const portrait = _hrlgPortraitData(u, unit);
    if (portrait && isMana) {
      portrait.showMp = true;
      portrait.mp = Math.max(0, Math.round(u.mp || 0));
      portrait.maxMp = u.maxMp || 0;
    }
    return {
      id: 'it:' + i + ':' + u.x + ',' + u.y,
      icon: isBane ? (baneHit ? '▲' : '⌖') : '♥',
      iconColor: isBane ? (baneHit ? EW.good : undefined) : '#57d97e',
      catColor: isHeal ? '#57d97e' : undefined,
      label: typeof unitDisplayName === 'function' ? unitDisplayName(u) : (u.name || u.cls),
      available: available,
      sub: sub,
      check: !!isPending,
      portrait: portrait,
      previewHeal: previewHeal,
      power: previewHeal > 0 ? { v: '≈+' + previewHeal, color: '#57d97e' } : undefined,
      meta: { text: t.dist + 't' },
      fire: () => {
        if (isPending && typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction();
        if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(u.x, u.y, u.z);
      },
    };
  });
  if (!blades.length) {
    blades.push({
      id: 'none', icon: '❖', available: false,
      label: isBane ? 'No enemies in throw range' : 'No valid allies',
    });
  }
  return { title: { icon: '❖', text: (rule && rule.name) || key, count: targets.length + '' }, blades };
}

/* ── Combo drum: the two-step team-attack picker, LISTED like every other
   targeting flow (it used to be blind board-clicking only). Step 1 lists
   the adjacent ALLY partners (portrait rows + the combo each pair unlocks);
   step 2 lists the units in the combo's range. Board clicks still work in
   parallel — this is the same state machine the click path drives. */
function _hrlgComboBlades(unit, st) {
  const partner = st.comboPartner || null;
  const _refresh = () => {
    if (typeof markDirty === 'function') { markDirty('hud', 'board'); renderIfDirty(); }
    if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
  };

  if (!partner) {
    const partners = (typeof getComboPartners === 'function') ? getComboPartners(unit) : [];
    const blades = partners.map(p => {
      const combo = typeof getComboForUnits === 'function' ? getComboForUnits(unit, p) : null;
      const syn = typeof getComboTypeSynergy === 'function' ? getComboTypeSynergy(unit, p) : { label: null };
      return {
        id: 'cp:' + p.id,
        icon: '◆', iconColor: '#ffd23e',
        label: typeof unitDisplayName === 'function' ? unitDisplayName(p) : (p.name || p.cls),
        available: true,
        portrait: _hrlgPortraitData(p, unit),
        meta: combo ? { text: combo.name, color: '#ffd23e' } : null,
        hint: syn.label ? '×1.3 SYNERGY' : null,
        fire: () => {
          state.comboPartner = p;
          state.pendingTarget = null;
          if (typeof playSfx === 'function') playSfx('uiConfirm');
          if (typeof addLog === 'function' && combo) {
            addLog('Partner selected: ' + (typeof unitDisplayName === 'function' ? unitDisplayName(p) : p.cls)
              + '. Combo: ' + combo.name + (syn.label ? ' (' + syn.label + ')' : '') + '. Now choose a target.');
          }
          _refresh();
        },
      };
    });
    if (!blades.length) blades.push({ id: 'none', icon: '◆', label: 'No combo partner adjacent', available: false });
    return { title: { icon: '◆', text: 'Combo', count: partners.length + '' }, blades };
  }

  // partner locked in → list everything the combo can actually reach
  const combo = typeof getComboForUnits === 'function' ? getComboForUnits(unit, partner) : null;
  const comboRange = (combo && combo.range) || 3;
  const isOffensive = !combo || ['damage', 'multiHit', 'aoe'].includes(combo.kind);
  const G = window.GAME;
  const _dist = (u) => (G && typeof G.combatDist === 'function')
    ? G.combatDist(unit.x, unit.y, unit.z ?? 0, u.x, u.y, u.z ?? 0)
    : Math.abs(unit.x - u.x) + Math.abs(unit.y - u.y);
  const targets = (st.units || [])
    .filter(u => !u.dead && u.id !== unit.id
      && (isOffensive ? u.player !== unit.player : u.player === unit.player))
    .map(u => ({ u, d: _dist(u) }))
    .filter(t => t.d >= 1 && t.d <= comboRange)
    .filter(t => !(typeof isRangeBlockedByTerrain === 'function'
      && (Math.abs(unit.x - t.u.x) + Math.abs(unit.y - t.u.y)) >= 1
      && isRangeBlockedByTerrain(unit.x, unit.y, t.u.x, t.u.y, unit.z)))
    // Fog parity with getComboPartners / the engine's vision gates: an enemy
    // the initiator can't see must not be listed (it would leak positions and
    // the board-click path could never have picked it anyway).
    .filter(t => !isOffensive || !state.fogOfWar || !!state.autoPlayers?.[unit.player]
      || typeof isInVision !== 'function' || isInVision(unit, t.u.x, t.u.y))
    .sort((a, b) => a.d - b.d);

  const blades = targets.map(t => {
    let typeAdv = '';
    if (isOffensive && typeof getTypeEffectSummary === 'function') {
      const adv = getTypeEffectSummary([...(unit.types || []), ...(partner.types || [])], t.u.types || []);
      typeAdv = adv.hasStrong && !adv.hasWeak ? '▲' : adv.hasWeak && !adv.hasStrong ? '▼' : '';
    }
    return {
      id: 'ct:' + t.u.id,
      icon: typeAdv || '◆',
      iconColor: typeAdv === '▲' ? EW.good : typeAdv === '▼' ? EW.bad : '#ffd23e',
      label: typeof unitDisplayName === 'function' ? unitDisplayName(t.u) : (t.u.name || t.u.cls),
      available: true,
      portrait: _hrlgPortraitData(t.u, unit),
      meta: { text: t.d + 't' },
      fire: () => {
        if (st._actionExecuting) return;
        if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction();
        state.pendingTarget = null;
        if (typeof doComboAttack === 'function') doComboAttack(unit, partner, t.u.x, t.u.y, t.u.z);
        _refresh();
      },
    };
  });
  if (!blades.length) {
    blades.push({
      id: 'none', icon: '◆', available: false,
      label: isOffensive ? 'No enemy in combo range' : 'No ally in combo range',
    });
  }
  return {
    title: { icon: '◆', text: combo ? combo.name : 'Combo', count: targets.length + '' },
    blades,
  };
}


function ActionMenu({ st, hidden }) {
  if (!st || st.phase !== 'battle') return null;
  if (hidden) return null;   // board is animating — input already registered

  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const activeId = st._blitzActiveUnitId || st.selectedUnitId;
  const unit = (st.units || []).find(u => u.id === activeId);
  if (!unit || unit.dead) return null;

  /* Mystery Dungeon: an AUTO/GUARD companion's turn belongs to the AI —
     rendering the command menu for it read as "the game wants my input". */
  if (typeof _mdUnitAuto === 'function' && _mdUnitAuto(unit)) return null;

  const humanTurn = !st.autoPlayers?.[st.activePlayer];
  /* Viewer gate: online, both seats are human — without this the drum renders
     the OPPONENT's active unit (spell list, vitals) on the idle client and
     lets the host click verbs on the guest's unit. Hotseat is unaffected:
     getViewerPlayer() returns st.activePlayer when both controllers are local. */
  const canControl = humanTurn && unit.player === st.activePlayer
    && st.activePlayer === viewer
    && (typeof canUnitAct === 'function' ? canUnitAct(unit) : true)
    && !st.winner;
  if (!canControl) return null;

  if (st.units.some(u => u._dying)) return null;

  if (st.battleDialogueQueue && st.battleDialogueQueue.length > 0) return null;

  const fc = getFactionColor(unit);
  const maxAP = typeof getUnitMaxAP === 'function' ? getUnitMaxAP(unit) : 2;
  const slot = unit._partySlot || unit.slot || 1;
  const roman = ['I','II','III','IV','V','VI','VII','VIII'][slot - 1] || slot;
  const unitName = typeof unitDisplayName === 'function' ? unitDisplayName(unit) : (unit.name || unit.cls);

  const am = st.actionMode;
  const menuView = st.actionMenuView || 'root';

  const apc = typeof getActionPanelCache === 'function' ? getActionPanelCache(unit) : {};

  const isStunned = unit.status && typeof getActiveStatusKeys === 'function'
    && getActiveStatusKeys(unit).some(k => typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[k]?.blockMove);
  const movesUsed = unit.movesThisTurn || 0;
  const _isNotAirborne = !(typeof canFly !== 'undefined' && canFly(unit) && typeof isUnitAirborne !== 'undefined' && isUnitAirborne(unit));
  const _hasJumpFuncs = typeof canJump === 'function' && typeof getJumpTiles === 'function';
  // Show jump button when: (a) max moves exhausted but can still act, OR (b) can't regular-move but can jump
  const showJump = _hasJumpFuncs && _isNotAirborne
    && ((typeof UNIT_MAX_MOVES !== 'undefined' && movesUsed >= UNIT_MAX_MOVES)
        || (!apc.canMove && (typeof canUnitAct === 'function' ? canUnitAct(unit) : (unit.ap || 0) > 0)));

  let moveAction;
  if (isStunned) {
    moveAction = { id: 'move', label: 'Move', icon: '↑', cost: null, available: false, sub: 'Stunned' };
  } else if (showJump) {
    const jumpTiles = getJumpTiles(unit);
    const jumpOk = jumpTiles.length > 0 && (typeof canUnitAct === 'function' ? canUnitAct(unit) : true);
    // Say WHY it's greyed — "Blocked" explained nothing when the real reason
    // was the one-leap-per-turn rule (teal tiles vanish after the first hop).
    const jumpSub = jumpOk ? null
      : unit._jumpedThisTurn ? 'Jumped'
      : !(typeof canUnitAct === 'function' ? canUnitAct(unit) : (unit.ap || 0) > 0) ? 'No AP'
      : 'No landing';
    moveAction = { id: 'jump', label: 'Jump', icon: '↑', cost: 1, available: jumpOk, sub: jumpSub };
  } else if (apc.canMove) {
    // Second move of the turn consumes ALL remaining AP (moving twice = the
    // whole turn) — show the real price on the pips.
    const _mvCost = movesUsed >= 1 ? Math.max(1, unit.ap || 0) : 1;
    moveAction = { id: 'move', label: 'Move', icon: '↑', cost: _mvCost, available: true,
      sub: movesUsed >= 1 ? 'Ends turn' : null };
  } else {
    const mvReason = (unit.ap || 0) < 1 ? 'No AP'
      : (typeof UNIT_MAX_MOVES !== 'undefined' && movesUsed >= UNIT_MAX_MOVES) ? 'Max moves' : 'Blocked';
    moveAction = { id: 'move', label: 'Move', icon: '↑', cost: 1, available: false, sub: mvReason };
  }

  // Attack stays live if the unit can STEP into range and still swing this
  // turn (move→attack) — only grey it when even that won't reach anything.
  const atkNow = !!apc.hasAttack;
  const atkReach = atkNow || (typeof attackHasReachableTarget === 'function' && attackHasReachableTarget(unit, { combatOnly: true }));
  const attackAction = {
    id: 'attack', label: 'Attack', icon: '×', cost: 1,
    available: atkReach,
    note: !atkNow && atkReach ? 'MOVE→ATK' : null,
    sub: atkReach ? null : 'No target',
  };

  // anyCastableSpellNow (battle.js) is the SAME probe chooseActionMenu gates
  // on — cooldown/guard-aware and covering race abilities + move-then-cast —
  // so the button's lit state always agrees with whether the menu will open.
  const hasSpells = typeof anyCastableSpellNow === 'function' ? anyCastableSpellNow(unit)
    : (typeof canCastAnySpellWithTargets === 'function' ? canCastAnySpellWithTargets(unit) : false);
  const hasAnySpells = (unit.spells || []).some(Boolean) || (unit._raceAbilities || []).some(Boolean);
  let abilSub = null;
  if (!hasAnySpells) {
    abilSub = 'None';
  } else if (!hasSpells) {
    // Nothing castable from here — work out the most actionable single reason
    // instead of defaulting to "No target". A unit can have MP > 0 yet still be
    // unable to afford any spell, and a spell with no target in range may be
    // castable by stepping into range (move-then-cast) — both used to read
    // "No target" misleadingly.
    if (typeof unitHasStatus === 'function' && unitHasStatus(unit, 'silence')) {
      abilSub = 'Silenced';
    } else {
      const _abilList = [...(unit.spells || []), ...(unit._raceAbilities || [])].filter(Boolean);
      let anyCastable = false, mpBlocked = false, apBlocked = false, targetBlocked = false, mpShort = false;
      for (const sp of _abilList) {
        const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(unit, sp) : true;
        if (!tierOk) continue; // locked by level — never the headline reason
        const apOk = (unit.ap || 0) >= (typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1);
        const mpOk = (unit.mp || 0) >= (typeof getSpellMpCostFor === 'function'
      ? getSpellMpCostFor(unit, sp) : (sp.cost || 0));
        const tgt = (typeof hasSpellTargetInRange === 'function' ? hasSpellTargetInRange(unit, sp) : true)
                 || (typeof spellHasReachableTarget === 'function' && spellHasReachableTarget(unit, sp));
        // canAffordSpell folds in cooldown/materials/hard locks — without it a
        // cooldown-blocked spell could light the button for a menu that then
        // refuses to open (chooseActionMenu gates on the same full check).
        const guardOk = typeof canAffordSpell !== 'function' || canAffordSpell(unit, sp);
        if (apOk && mpOk && tgt && guardOk) { anyCastable = true; break; }
        if (!mpOk) mpShort = true;
        if (apOk && tgt && !mpOk) mpBlocked = true;        // would cast if it had MP
        else if (mpOk && tgt && !apOk) apBlocked = true;   // would cast if it had AP
        else if (apOk && mpOk && !tgt) targetBlocked = true; // would cast if a target were reachable
      }
      if (!anyCastable) {
        abilSub = mpBlocked ? 'No MP'
                : apBlocked ? 'No AP'
                : targetBlocked ? 'No target'
                : mpShort ? 'No MP'
                : 'No target';
      }
    }
  }
  const abilAction = {
    id: 'abil', label: 'Abilities', icon: '✦', cost: '—',
    // abilSub is only set when nothing is castable (even via move→cast), so
    // it doubles as the grey-out signal. The blade itself carries the reason
    // (No MP / No AP / No target / Silenced); the all-grey list behind it is
    // NOT opened anymore — a menu with zero live rows is just wasted clicks.
    available: hasSpells || (hasAnySpells && !abilSub),
    selected: menuView === 'spells',
    sub: abilSub,
  };

  let comboSub = null;
  if (!apc.hasCombo) {
    const _cbCdLeft = (typeof COMBO_COOLDOWN_ROUNDS !== 'undefined')
      ? COMBO_COOLDOWN_ROUNDS - ((st.round || 0) - (unit._lastComboRound || -99)) : 0;
    if (typeof unitCanCombo === 'function' && !unitCanCombo(unit)) {
      const lvl = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
      comboSub = 'Lv' + lvl + '/7';
    } else if ((unit.ap || 0) < (typeof COMBO_AP_COST_INITIATOR !== 'undefined' ? COMBO_AP_COST_INITIATOR : 2)) {
      comboSub = 'No AP';
    } else if (_cbCdLeft > 0) {
      comboSub = '⏳ CD ' + _cbCdLeft;
    } else if (typeof getComboPartners === 'function' && getComboPartners(unit, false).length === 0) {
      comboSub = 'No partner';
    } else {
      // Partners exist but none of their combos can reach anything from here.
      comboSub = 'No target';
    }
  }
  const comboAction = {
    id: 'combo', label: 'Combo', icon: '◆', cost: 2,
    available: !!apc.hasCombo,
    sub: apc.hasCombo ? null : comboSub,
  };

  // Items greys out not just when the bag is EMPTY but when nothing in it is
  // usable right now (e.g. only a heal potion and everyone's at full HP) —
  // opening a list of all-grey rows would just cost clicks to back out of.
  const _heldItemKeys = (typeof ITEM_RULES !== 'undefined')
    ? Object.keys(ITEM_RULES).filter(k => (unit.items?.[k] || 0) > 0) : [];
  const _anyItemUsable = typeof canUseItemNow === 'function'
    ? _heldItemKeys.some(k => canUseItemNow(unit, k)) : _heldItemKeys.length > 0;
  // Mystery Dungeon floors: a non-empty bag always opens — even when nothing
  // is USABLE right now, every row still offers its ⤵ DROP chip.
  const _mdItemMenu = _heldItemKeys.length > 0
    && typeof window._isDungeonMode === 'function' && window._isDungeonMode()
    && st._mdPhase === 'floor' && !!st._mdRun;
  const itemsAction = {
    id: 'items', label: 'Items', icon: '❖', cost: null,
    available: (!!apc.hasAnyItem && _anyItemUsable) || _mdItemMenu,
    selected: menuView === 'items',
    sub: !apc.hasAnyItem ? 'Empty' : ((_anyItemUsable || _mdItemMenu) ? null : 'Nothing usable'),
  };

  // 🧱 Build — the universal place/dig block verb (1 AP per block; Mason's
  // Gauntlets = 2 per AP). Lives OUTSIDE the drum now: a permanent bezel
  // button beside the crown (see HorologeMenu), greyed with the exact reason.
  const buildProblem = typeof _buildActionProblem === 'function' ? _buildActionProblem(unit) : 'Unavailable';
  const buildBtn = {
    available: !buildProblem,
    active: am === 'build',
    sub: buildProblem,
    hint: _hintKey('build', 'B'),
    fire: () => {
      // Toggle like Move: hitting BUILD while already building backs out.
      if (am === 'build') { if (typeof handleBackAction === 'function') handleBackAction(); }
      else if (typeof setActionMode === 'function') setActionMode('build');
    },
  };

  // 🛡 GUARD — defensive stance + Overwatch (one reaction shot at the first
  // enemy that stops inside attack range). Promoted from the retired More
  // menu to a root verb: it's a core "spend the rest of my turn" play.
  // Guard ends the turn whatever AP is left — it needs only 1 AP, so it's
  // always a live way to spend a leftover point.
  const _guardOk = (unit.ap || 0) >= 1 && typeof doGuard === 'function';
  const guardAction = {
    id: 'guard', label: 'Guard', icon: '🛡', cost: Math.max(1, unit.ap || 0),
    available: _guardOk,
    sub: _guardOk ? 'Ends turn' : 'No AP',
  };

  // Canonical verb order, top to bottom: Move › Attack › Abilities › Combo ›
  // Items › Guard (END TURN docks at the very bottom of the ladder; Build
  // rides the bezel as its own pusher). The old More drawer is GONE — its
  // contents live on the tool rows, the root ladder, and the tile/ally
  // quick menus (click a tile / unit to reach Inspect, Ward, Ping, Trade,
  // Recall, Enter Building…).
  // Clash (classic JRPG battle): there is no Move verb at all — the ladder
  // reads Attack › Abilities › Combo › Items › Guard, like a proper JRPG
  // command menu.
  const actions = (typeof _isClashMode === 'function' && _isClashMode())
    ? [attackAction, abilAction, comboAction, itemsAction, guardAction]
    : [moveAction, attackAction, abilAction, comboAction, itemsAction, guardAction];

  // ⇄ SWITCH — gauntlet modes only: swap in a benched reserve.
  if (typeof _isGauntlet === 'function' && _isGauntlet()) {
    const _swReserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(unit.player) : [];
    const _swCost = (typeof getActiveMultiplayerMode === 'function' && getActiveMultiplayerMode()?.switchApCost) || 2;
    const _swOk = _swReserves.length > 0 && (unit.ap || 0) >= _swCost;
    actions.push({
      id: 'switch', label: 'Switch', icon: '⇄', cost: _swCost,
      available: _swOk,
      selected: menuView === 'switch',
      sub: _swOk ? null : (_swReserves.length === 0 ? 'No reserves' : 'No AP'),
    });
  }

  // ── special-action pushers: situational one-shots surfaced as extra
  // stopwatch buttons on the bezel (the tile quick menu mirrors most of
  // them). Only built when usable right now — presence == opportunity.
  const pushers = [];
  // ⚛ Full Entropy Gauge → the team attack is live on ANY of your units.
  if (typeof window.canUseEntropyStrike === 'function' && window.canUseEntropyStrike(unit)) {
    pushers.push({
      id: 'entropyStrike', glyph: '⚛', label: 'ENTROPY', color: '#c9a5ff',
      title: 'ENTROPY STRIKE — the whole team hammers every visible enemy (1 AP, drains the gauge)',
      fire: () => { if (typeof window.doEntropyStrike === 'function' && typeof getSelectedUnit === 'function') window.doEntropyStrike(getSelectedUnit()); },
    });
  }
  // ⬡ CHANNEL is a PERMANENT tool row now — always on the column, greyed
  // with the reason whenever it can't fire (matches BUILD's behavior).
  if (typeof getNexusAtUnit === 'function') {
    const _nex = getNexusAtUnit(unit);
    const _chCost = typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1;
    const _capturable = _nex && (!_nex.nexus.owner || _nex.nexus.owner !== unit.player);
    const _chOk = _capturable && (unit.ap || 0) >= _chCost;
    pushers.push({
      id: 'nexus', glyph: '⬡', label: 'CHANNEL', color: '#5fd6ff',
      available: _chOk,
      sub: !_nex ? 'Not on a nexus' : (!_capturable ? 'Already yours' : 'No AP'),
      hint: _chCost + ' AP',
      title: 'Channel this Nexus (' + _chCost + ' AP)',
      fire: () => { if (typeof channelNexus === 'function' && typeof getSelectedUnit === 'function') channelNexus(getSelectedUnit()); },
    });
  }
  // ⬆/⬇ flyers get a permanent LAND / TAKE OFF tool row the same way.
  if (typeof canFly === 'function' && canFly(unit) && typeof canChangeAltitude === 'function') {
    const _groundZ = typeof getHeightAt === 'function' ? getHeightAt(unit.x, unit.y) : 0;
    const _airborne = (unit.z ?? 0) > _groundZ;
    const _alt = canChangeAltitude(unit, _airborne ? 'descend' : 'ascend');
    const _altOk = !!(_alt && _alt.ok);
    pushers.push({
      id: 'fly',
      glyph: _airborne ? '⬇' : '⬆',
      label: _airborne ? 'LAND' : 'TAKE OFF',
      color: '#8fd3ff',
      available: _altOk,
      sub: (_alt && _alt.reason) || ((unit.ap || 0) < 1 ? 'No AP' : 'Blocked'),
      hint: '1 AP',
      title: (_airborne ? 'Land — drop to the ground' : 'Take off — climb into the air') + ' (1 AP)',
      fire: () => {
        if (typeof doAltitudeChange === 'function' && typeof getSelectedUnit === 'function') {
          doAltitudeChange(getSelectedUnit(), _airborne ? 'land' : 'ascend');
        }
      },
    });
  }
  if (st.bombs && st.bombs.some(b => b.ownerUnitId === unit.id)) {
    pushers.push({
      id: 'detonate', glyph: '💣', label: 'DETONATE', color: '#ff5e70',
      title: 'Detonate your planted bomb',
      fire: () => { if (typeof doDetonate === 'function' && typeof getSelectedUnit === 'function') doDetonate(getSelectedUnit()); },
    });
  }
  if (typeof getEnterableBuilding === 'function' && getEnterableBuilding(unit)
      && (unit.ap || 0) >= (typeof BUILDING_ENTER_AP_COST !== 'undefined' ? BUILDING_ENTER_AP_COST : 1)) {
    pushers.push({
      id: 'lift', glyph: '🛗', label: 'ENTER', color: '#f2c468',
      title: 'Enter Building — ride the lift to the roof (ends turn)',
      fire: () => { if (typeof doEnterBuilding === 'function' && typeof getSelectedUnit === 'function') doEnterBuilding(getSelectedUnit()); },
    });
  }

  // 'move'/'jump' collapse the drum too: while picking a destination tile the
  // full verb ladder used to stay up and cover the reachable tiles on the left
  // half of the board. Aim view = lone CANCEL blade + "MOVING — CLICK A TILE".
  // (WASD walking keeps the ladder — the keyboard IS the picker there.)
  const tileTargetModes = ['move', 'jump', 'combo', 'inspect', 'ward', 'flair', 'trade', 'warpStone', 'build'];
  const isWasdWalking = am === 'move' && typeof _wasdOrigin !== 'undefined' && _wasdOrigin && !_wasdCommitted;
  const inTileTarget = am && tileTargetModes.includes(am) && menuView === 'root' && !isWasdWalking;

  function onAction(a) {
    if (!a.available) return;
    switch (a.id) {
      case 'move':

        if (am === 'move') { if (typeof handleBackAction === 'function') handleBackAction(); }
        else if (typeof setActionMode === 'function') setActionMode('move');
        break;
      case 'jump':
        if (am === 'jump') { if (typeof handleBackAction === 'function') handleBackAction(); }
        else if (typeof setActionMode === 'function') setActionMode('jump');
        break;
      case 'attack': if (typeof setActionMode === 'function') setActionMode('attack'); break;
      case 'abil': if (typeof chooseActionMenu === 'function') chooseActionMenu('spells'); break;
      case 'combo': if (typeof setActionMode === 'function') setActionMode('combo'); break;
      case 'items': if (typeof chooseActionMenu === 'function') chooseActionMenu('items'); break;
      case 'guard': if (typeof doGuard === 'function' && typeof getSelectedUnit === 'function') doGuard(getSelectedUnit()); break;
      case 'switch': if (typeof chooseActionMenu === 'function') chooseActionMenu('switch'); break;
    }
  }

  function onEndTurn() {
    if (typeof triggerEndTurn === 'function') triggerEndTurn();
  }

  function onCancel() {
    if (typeof handleBackAction === 'function') handleBackAction();
  }

  const modeLabels = {
    move: 'MOVING — CLICK A TILE', jump: 'JUMPING — CLICK A TILE', combo: 'COMBO — CLICK A PARTNER',
    inspect: 'INSPECT — CLICK A TILE', ward: 'WARD — CLICK A TILE', flair: 'FLAIR — CLICK A TILE',
    trade: 'TRADE — CLICK AN ALLY', warpStone: 'WARP — CLICK A TILE',
    attack: 'ATTACK — CLICK A TARGET', build: 'BUILD — CLICK A TILE',
  };

  // ── the command PANEL STACK. Standard JRPG cascade: the root verb list
  // is always the base; opening a sub-menu (abilities / items / more) lays
  // its panel to the RIGHT of the dimmed parent, and a target pick lays a
  // third panel next to THAT — the spell list stays on screen while you
  // pick who to hit. Every list renders through the same HorologeBlade
  // rows: one instrument, one look, one interaction.
  const cancelBlade = { id: 'cancel', label: 'CANCEL', icon: '‹', available: true, danger: true, hint: _hintKey('cancel', 'ESC') };
  // root verbs are short words → the root panel is narrow; the grey-out
  // reason renders UNDER the name (subBelow) instead of as a right-side tag
  const rootBlades = actions.map(a => ({ ...a, subBelow: true }));   // declared order IS the menu order
  // (The old ⓘ Inspect blade is gone — the unit stat card is the INFO
  // button riding beside the name under the clock now, not an action.)
  rootBlades.push({ id: 'end', label: 'END TURN', icon: '■', available: true, danger: true, hint: _hintKey('endTurn', 'SPACE') });
  const rootPanel = { key: 'root', title: null, blades: rootBlades };
  const _mkPanel = (key, built, extra) => ({
    key, title: built.title || null,
    blades: extra ? [...built.blades, extra] : built.blades,
  });

  let view = 'root', modeLabel = null;
  let panels = [rootPanel];
  let inItemTargets = false;
  if (inTileTarget) {
    view = 'aim';
    modeLabel = modeLabels[am] || String(am).toUpperCase();
    if (am === 'build') {
      // Build mode: the panel becomes a Minecraft hotbar — ⛏ Dig + one row
      // per banked material. Click a row to swap tools, click the board to
      // work, right-click/ESC/B to put the tools away.
      const _bt = st._buildTool || 'dig';
      panels.push({ key: 'build|' + _bt, title: { icon: '⚒', text: 'Build' }, blades: [..._hrlgBuildBlades(unit, st), cancelBlade] });
      modeLabel = _bt === 'dig'
        ? 'DIG — CLICK A BLOCK IN REACH'
        : 'PLACE ' + ((typeof BUILD_MATERIALS !== 'undefined' && BUILD_MATERIALS[_bt]) ? BUILD_MATERIALS[_bt].label.toUpperCase() : 'BLOCK') + ' — CLICK A TILE';
    } else if (am === 'combo') {
      // Combo keeps its REAL two-step picker: adjacent ally partners first,
      // then the units in combo range — board clicks keep working alongside.
      const _stage = st.comboPartner ? 'target' : 'partner';
      panels.push(_mkPanel('combo|' + _stage + (st.comboPartner ? '|' + st.comboPartner.id : ''), _hrlgComboBlades(unit, st), cancelBlade));
      modeLabel = _stage === 'partner'
        ? 'COMBO — PICK AN ALLY PARTNER'
        : 'COMBO — PICK A TARGET';
    } else if (am === 'move' || am === 'jump') {
      // Move/jump picking shows NO panel at all — the lists sat right over
      // the reachable tiles, and the crown (◀ BACK) already cancels.
      panels = [];
    } else {
      panels.push({ key: 'aim|' + am, title: null, blades: [cancelBlade] });
    }
  } else if (menuView === 'spells' && am === 'spell' && st.selectedTool) {
    // tile-targeted / free-aim spell armed from the abilities panel. The
    // SPELL LIST STAYS UP (dimmed) with the aim panel beside it, and —
    // whenever units are legitimate targets — the same portrait target list
    // as unit-target spells rides alongside the free board aim, so BOTH
    // paths (list pick / map click) always exist.
    const _aimSp = (unit.spells || []).find(s => s.name === st.selectedTool)
      || (unit._raceAbilities || []).find(s => s.name === st.selectedTool);
    // Placement / terrain / self-repositioning kinds genuinely aim at TILES —
    // a unit list would just mislead. Everything else lists units too.
    const _tileOnlyKinds = ['placeTrap', 'placeBlock', 'buildStructure', 'terrainCreate',
      'deployObject', 'deployPair', 'deployTurret', 'warpRune', 'summonWeather', 'placeMirror',
      'teleport', 'dash', 'escape', 'leechSeed', 'seedHeal', 'seedPoison'];
    const _listUnits = _aimSp && !_tileOnlyKinds.includes(_aimSp.kind || '')
      && typeof _getSpellValidTargets === 'function'
      && _getSpellValidTargets(unit, _aimSp).length > 0;
    view = 'aim';
    panels.push(_mkPanel('spells', _hrlgSpellBlades(unit, st)));
    if (_listUnits) {
      modeLabel = (st.selectedTool + ' — PICK FROM LIST OR CLICK THE BOARD').toUpperCase();
      panels.push(_mkPanel('aim|spell|' + st.selectedTool, _hrlgTargetBlades(unit, st, 'spell'), cancelBlade));
    } else {
      modeLabel = (st.selectedTool + ' — CLICK A TARGET').toUpperCase();
      panels.push({ key: 'aim|spell|' + st.selectedTool, title: { icon: '✦', text: st.selectedTool }, blades: [cancelBlade] });
    }
  } else if (menuView === 'items' && am === 'item' && st.selectedTool) {
    const itRule = (typeof ITEM_RULES !== 'undefined') ? ITEM_RULES[st.selectedTool] : null;
    const itName = (itRule && itRule.name) || st.selectedTool;
    panels.push(_mkPanel('items', _hrlgItemBlades(unit, st)));
    if (itRule && (st.selectedTool === 'healPotion' || st.selectedTool === 'manaPotion' || itRule.baneType)) {
      // unit-targeted item → the same portrait target list as attacks/spells,
      // cascading off the still-visible items panel
      inItemTargets = true; view = 'sub';
      modeLabel = (itName + ' — PICK A TARGET').toUpperCase();
      panels.push(_mkPanel('itemTargets|' + st.selectedTool, _hrlgItemTargetBlades(unit, st), cancelBlade));
    } else {
      // tile-targeted item (warp stone): keep free board aim
      view = 'aim';
      modeLabel = (itName + ' — CLICK A TARGET').toUpperCase();
      panels.push({ key: 'aim|item|' + st.selectedTool, title: { icon: '❖', text: itName }, blades: [cancelBlade] });
    }
  } else if (menuView === 'spells') {
    panels.push(_mkPanel('spells', _hrlgSpellBlades(unit, st))); view = 'sub';
  } else if (menuView === 'items') {
    panels.push(_mkPanel('items', _hrlgItemBlades(unit, st))); view = 'sub';
  } else if (menuView === 'switch') {
    panels.push(_mkPanel('switch', _hrlgSwitchBlades(unit, st))); view = 'sub';
  } else if (menuView === 'pings') {
    panels.push(_mkPanel('pings', _hrlgPingBlades())); view = 'sub';
  } else if (menuView === 'spellOrientation') {
    panels.push(_mkPanel('spells', _hrlgSpellBlades(unit, st)));
    panels.push(_mkPanel('orient', _hrlgOrientationBlades(st))); view = 'sub';
  } else if (menuView === 'attackTargets') {
    panels.push(_mkPanel('atkTargets', _hrlgTargetBlades(unit, st, 'attack'), cancelBlade)); view = 'sub';
    modeLabel = 'ATTACK — PICK A TARGET';
  } else if (menuView === 'spellTargets') {
    panels.push(_mkPanel('spells', _hrlgSpellBlades(unit, st)));
    panels.push(_mkPanel('spTargets|' + (st.selectedTool || ''), _hrlgTargetBlades(unit, st, 'spell'), cancelBlade)); view = 'sub';
    modeLabel = ((st.selectedTool || 'SPELL') + ' — PICK A TARGET').toUpperCase();
  } else if (menuView !== 'root') {
    view = 'sub';   // unknown view: bare root + crown
  } else if (st._enemyActionTargetId && !am) {
    // One anchor field, two menus: clicking an ENEMY opens the offensive
    // playbook, clicking an ALLY opens the quick-cast support menu
    // (heals / buffs / potions / trade) — decided here by team.
    const _qtU = (st.units || []).find(u => u.id === st._enemyActionTargetId && !u.dead);
    const _qtAlly = !!(_qtU && _qtU.id !== unit.id
      && !(typeof isEnemyUnit === 'function' ? isEnemyUnit(unit, _qtU) : _qtU.player !== unit.player));
    panels.push(_qtAlly
      ? _mkPanel('ally|' + st._enemyActionTargetId, _hrlgAllyBlades(unit, st))
      : _mkPanel('enemy|' + st._enemyActionTargetId, _hrlgEnemyBlades(unit, st)));
    view = 'quick';
  } else if (st._tileActionTarget && !am) {
    panels.push(_mkPanel('tile|' + st._tileActionTarget.x + ',' + st._tileActionTarget.y, _hrlgTileBlades(unit, st))); view = 'quick';
  } else {
    view = 'root';
    if (am) modeLabel = modeLabels[am] || null;
  }

  // ── the big green CONFIRM: armed whenever a target pick (✓) is pending in
  // any targeting view — sealing it is one unmissable click instead of
  // re-finding the row with the tiny checkmark. Fires the exact same
  // selectTargetFromMenu confirm the ✓ row itself uses.
  let confirmObj = null;
  const _pt = st.pendingTarget;
  const _inTargetingView = menuView === 'attackTargets' || menuView === 'spellTargets'
    || inItemTargets
    || (view === 'aim' && (am === 'attack' || am === 'spell' || am === 'item'));
  if (_pt && _inTargetingView && !st._actionExecuting) {
    const _ptUnit = (typeof unitAt === 'function')
      ? ((_pt.z != null ? unitAt(_pt.x, _pt.y, _pt.z) : null) || unitAt(_pt.x, _pt.y))
      : null;
    // Multi-strike count picked on the list rides the label ("— Cowboy ×3")
    const _repSuffix = (menuView === 'attackTargets' && _pt._repeatN > 1) ? ' ×' + _pt._repeatN : '';
    confirmObj = {
      label: (_ptUnit
        ? (typeof unitDisplayName === 'function' ? unitDisplayName(_ptUnit) : (_ptUnit.name || _ptUnit.cls))
        : (typeof coordLabel === 'function' ? coordLabel(_pt.x, _pt.y) : (_pt.x + ',' + _pt.y))) + _repSuffix,
      fire: () => {
        if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction();
        if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(_pt.x, _pt.y, _pt.z);
      },
    };
  }

  // ── clock-HUD item slots: the unit's held items ride under the watch
  // vitals as 3 one-click slots. Clicking one either uses the item on the
  // spot (scanner/panacea/warp stone) or arms its target picker — the same
  // chooseItemAction the Items submenu rows fire, and the submenu keeps
  // listing everything.
  const hudItems = [];
  if (typeof ITEM_RULES !== 'undefined') {
    for (const k of Object.keys(ITEM_RULES)) {
      const n = unit.items?.[k] || 0;
      if (n <= 0) continue;
      hudItems.push({
        key: k, icon: ITEM_RULES[k].icon || '❖', name: ITEM_RULES[k].name || k,
        desc: ITEM_RULES[k].desc || '', count: n,
        canUse: typeof canUseItemNow === 'function' ? canUseItemNow(unit, k) : true,
        selected: am === 'item' && st.selectedTool === k,
      });
      if (hudItems.length >= 3) break;
    }
  }
  const onItem = (key) => { if (typeof chooseItemAction === 'function') chooseItemAction(key); };

  // Identity readout replacing the retired top-left panel: portrait on the
  // clock face, Lv · race · job under the name (race skipped when the name
  // already IS the race label — the default nametag mode).
  const _lvl = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
  const _raceLbl = (unit.race && typeof getRaceLabel === 'function')
    ? getRaceLabel(unit.race, unit.gender)
    : (unit.race ? unit.race.charAt(0).toUpperCase() + unit.race.slice(1) : '');
  const _jobLbl = typeof getJobDisplayName === 'function' ? getJobDisplayName(unit.cls) : (unit.cls || '');
  const subLine = 'Lv' + _lvl
    + (_raceLbl && _raceLbl !== unitName ? ' · ' + String(_raceLbl).toUpperCase() : '')
    + (_jobLbl ? ' · ' + String(_jobLbl).toUpperCase() : '');

  // Clock-face art: dedicated face portrait when the race has one, else the
  // unit's map sprite — the disc must never sit empty (races without a
  // RACE_PORTRAITS entry used to silently fall back to the etched map,
  // which read as "my portrait disappeared").
  let _portUrl = typeof getUnitPortraitUrl === 'function' ? getUnitPortraitUrl(unit) : null;
  const _portIsFace = !!_portUrl;
  if (!_portUrl && typeof getBattleMapSpriteUrl === 'function') _portUrl = getBattleMapSpriteUrl(unit);
  if (!_portUrl && typeof getUnitSprite === 'function') _portUrl = getUnitSprite(unit.cls, unit.player, unit);

  return h(HorologeMenu, {
    view: view, panels: panels, fc: fc,
    factionKey: (typeof getUnitFaction === 'function' ? getUnitFaction(unit) : null) || 'space',
    roman: roman, unitName: unitName, unitKey: unit.id,
    subLine: subLine,
    portraitUrl: _portUrl,
    portraitIsFace: _portIsFace,
    // clicking the clock portrait re-centers the camera on the unit — the
    // same selectUnit pan a scoreboard chip click performs
    onPortraitClick: () => { if (typeof selectUnit === 'function') selectUnit(unit.id); },
    infoOpen: !!st.showUnitInfo && ((st.focusedUnitId || st.selectedUnitId) === unit.id),
    onInfo: () => {
      // toggle rules: closed → open on THIS unit; open on this unit →
      // close; open on some other unit → retarget to this unit.
      const _wasOpenHere = !!state.showUnitInfo && ((state.focusedUnitId || state.selectedUnitId) === unit.id);
      if (typeof focusUnitPanel === 'function') focusUnitPanel(unit.id);
      if (_wasOpenHere || !state.showUnitInfo) { if (typeof toggleUnitInfo === 'function') toggleUnitInfo(); }
    },
    burning: typeof unitHasStatus === 'function' && unitHasStatus(unit, 'burn'),
    poisoned: typeof unitHasStatus === 'function' && unitHasStatus(unit, 'poison'),
    statusChips: _hrlgStatusChips(unit),
    ap: unit.ap || 0, maxAP: maxAP,
    // XP readout — progression modes only (PvP is level-normalized, XP inert)
    xp: (typeof xpProgressionActive === 'function' && xpProgressionActive()
      && typeof getXPProgressPct === 'function')
      ? { pct: getXPProgressPct(unit), lvl: _lvl,
          max: typeof XP_MAX_LEVEL !== 'undefined' ? _lvl >= XP_MAX_LEVEL : false }
      : null,
    mats: (typeof getMaterials === 'function' && typeof BUILD_MATERIALS !== 'undefined')
      ? (() => { const _m = getMaterials(unit.player); return Object.keys(BUILD_MATERIALS).map(k => ({ k, icon: BUILD_MATERIALS[k].icon, n: _m[k] || 0 })); })()
      : null,
    buildCharge: unit._buildCharges || 0,
    hp: unit.hp || 0, maxHp: unit.maxHp || 0, mp: unit.mp || 0, maxMp: unit.maxMp || 0,
    modeLabel: modeLabel, am: am, pushers: pushers, build: buildBtn,
    items: hudItems, onItem: onItem, confirm: confirmObj,
    onAction: onAction, onEndTurn: onEndTurn, onCancel: onCancel,
  });
}

function spellTagline(sp) {
  const parts = [];
  const k = sp.kind || '';

  if (['selfHeal', 'escape'].includes(k)) {
    if (k === 'escape') {
      const dist = sp.teleportDistance || 2;
      parts.push('Self · leaps ' + dist + ' tiles');
    } else {
      parts.push('Self');
    }
  }
  else if (k === 'aoe' || k === 'aoePull' || k === 'aoeShield') parts.push('AOE');
  else if (k === 'line' || k === 'linePush') parts.push('Line');
  else if (k === 'cross') parts.push('Cross');
  else if (k === 'barrage') parts.push('Barrage');
  else if (k === 'zoneHeal' || k === 'zoneDebuff') parts.push('Zone');
  else if (k === 'warCry' || k === 'healAll' || k === 'manaRestoreAll') parts.push('All allies');
  else if (k === 'ricochet') parts.push('Bouncing');
  else if (k === 'splitBeam') parts.push('Split beam');
  else if (k === 'multiHit') {
    const n = sp.hitDamages ? sp.hitDamages.length : 0;
    parts.push(n > 1 ? n + '-hit' : 'Multi-hit');
  } else if (k === 'delayed' || k === 'bomb') parts.push('Delayed');
  else if (k === 'dash' || k === 'leapStrike') {
    const rng = sp.range || 1;
    parts.push('Dash ' + rng + (sp.dashDamage ? ' · hits path' : ''));
  }
  else if (k === 'teleport' || k === 'swap') parts.push(k === 'swap' ? 'Swap' : 'Teleport');
  else if (k === 'pull' || k === 'aoePull' || k === 'displacement') parts.push('Displacement');
  else if (k === 'deployObject' || k === 'deployPair') parts.push('Deploy');
  else if (k === 'deployTurret') parts.push('Turret');
  else if (k === 'terrainCreate') parts.push('Terrain');
  else if (k === 'placeBlock') parts.push('Build block');
  else if (k === 'buildStructure') parts.push('Structure');
  else if (k === 'placeTrap') parts.push('Hidden trap');
  else if (k === 'summonWeather') parts.push('Weather');
  else if (k === 'scan' || k === 'remoteView') parts.push('Vision');
  else if (k === 'warpRune') parts.push('Warp rune');
  else if (k === 'leechSeed' || k === 'seedHeal' || k === 'seedPoison') parts.push('Seed');
  else if (k === 'skyThrow' || k === 'skyDrop' || k === 'skySlam') parts.push('Aerial');
  else if (k === 'encore') parts.push('Copy');
  else if (k === 'revive') parts.push('Revive');
  else if (k === 'raiseDead') parts.push('Raise zombie');
  else if (k === 'rallyPull') parts.push('Rally allies');
  else if (k === 'cleanse') parts.push('Cleanse');
  else parts.push('Single target');

  if (sp.damageType === 'physical') parts.push('physical');

  if (sp.aoeRadius && !['aoe', 'aoePull', 'aoeShield'].includes(k)) parts.push('r' + sp.aoeRadius + ' AOE');

  if (k === 'linePush' || k === 'aoePull') parts.push(k === 'aoePull' ? 'pulls' : 'pushes');

  if (sp.statusEffects && sp.statusEffects.length > 0) {
    const names = sp.statusEffects.map(s => {
      const id = s.id || '';
      if (typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[id]?.label) return STATUS_DEFS[id].label.toLowerCase();
      return id.replace(/_/g, ' ');
    });
    parts.push('applies ' + names.join(', '));
  }

  if (k === 'lifeDrain') parts.push('drains HP');

  if (sp.shield) parts.push('shields');

  if (k === 'heal' || k === 'healAll') parts.push('heals');

  return parts.join(' · ');
}

// ── Move-card helpers: turn raw spell data into glanceable badges ──

// Concise targeting mode shown under the description (Single Target / AOE / Line …).
function spellTargetMode(sp) {
  const k = sp.kind || '';
  if (['selfHeal', 'escape'].includes(k)) return 'Self Target';
  if (['warCry', 'encore'].includes(k)) return 'Self Target';
  if (['healAll', 'manaRestoreAll'].includes(k)) return 'All Allies';
  if (['aoe', 'aoePull', 'aoeShield'].includes(k)) return 'Area · AOE';
  if (['line', 'linePush', 'splitBeam'].includes(k)) return 'Line';
  if (k === 'cross') return 'Cross';
  if (k === 'barrage') return 'Barrage';
  if (['zoneHeal', 'zoneDebuff', 'terrainCreate', 'deployObject', 'deployPair',
       'deployTurret', 'warpRune', 'summonWeather', 'leechSeed', 'seedHeal', 'seedPoison',
       'placeBlock', 'buildStructure', 'placeTrap', 'placeMirror'].includes(k)) return 'Tile Target';
  if (k === 'pulseLattice') return 'Self · AOE';
  if (k === 'tuneFrequency') return 'Self Target';
  if (['dash', 'leapStrike'].includes(k)) return 'Dash Line';
  if (['teleport', 'swap', 'pull', 'displacement'].includes(k)) return k === 'swap' ? 'Swap' : 'Reposition';
  if (['scan', 'remoteView'].includes(k)) return 'Vision';
  if (k === 'multiHit') { const n = sp.hitDamages ? sp.hitDamages.length : 0; return n > 1 ? n + '-Hit Target' : 'Single Target'; }
  if (sp.aoeRadius) return 'Single + Splash';
  return 'Single Target';
}

// Does this spell actually deal damage? PHYSICAL/MAGIC and MELEE/RANGED
// badges only make sense for spells that hit something — a pure debuff or
// utility labeled "MELEE" or "MAGIC" is just confusing.
function spellDealsDamage(sp) {
  if (sp.noDamage) return false;
  if (sp.dmg || (sp.hitDamages && sp.hitDamages.length) || sp.dotDamage || sp.turretDmg || sp.blastDmg) return true;
  // Kinds that always roll damage even without an explicit dmg field.
  return ['barrage', 'skyDrop', 'skyThrow', 'skySlam'].includes(sp.kind || '');
}

// Physical / Magic / Utility delivery badge (the purple "MAGIC" pill in the mockup).
function spellDeliveryBadge(sp, cat) {
  if (!spellDealsDamage(sp)) return { label: 'UTILITY', color: '#d8b24a' };
  if (sp.damageType === 'physical') return { label: 'PHYSICAL', color: '#e0944a' };
  return { label: 'MAGIC', color: '#b56ce0' };
}

// Long-range (gravity-assisted) vs close-range delivery class. A RANGED ability
// (projectile / beam / bolt / blast / psychic / thrown) drops onto targets that
// sit BELOW the caster for free; a MELEE/close ability is capped to its
// elevation band. Mirrors isLongRangeSpell() in battle.js; falls back to a light
// heuristic only if that engine helper hasn't loaded yet.
function spellRangeClass(sp) {
  if (typeof isLongRangeSpell === 'function') return isLongRangeSpell(sp) ? 'ranged' : 'melee';
  if (sp.delivery === 'ranged' || sp.longRange === true) return 'ranged';
  if (sp.delivery === 'melee' || sp.longRange === false) return 'melee';
  if (sp.projectileOverride || sp.damageType === 'magic') return 'ranged';
  return (sp.range || 0) >= 2 ? 'ranged' : 'melee';
}
// Small footer chip describing that delivery class. Cyan ⤢ = long range / falls
// on targets below; amber ⚔ = close range / same-band only.
function spellRangeBadge(sp) {
  return spellRangeClass(sp) === 'ranged'
    ? { label: 'RANGED', glyph: '⤢', color: '#5fd6ff', title: 'Long range — projectile/beam/thrown; drops onto targets below for free (ignores downward height limit)' }
    : { label: 'MELEE',  glyph: '⚔', color: '#d99a55', title: 'Close range — capped to its elevation band; cannot reach far below' };
}

// Primary power stat for the header (red PWR / green HP / cyan SHLD …).
/* Effect readout for buff/debuff/status spells — the button-level answer to
   "what does this DO?": stat stages ("+1 ATK", stackable to ±5) and status
   applications ("🔥 Burn"), the same way damage spells wear their number. */
const _FX_STAT_LBL = [['atk', 'ATK'], ['def', 'DEF'], ['mdef', 'MDEF'], ['spd', 'SPD'], ['int', 'INT']];
function spellEffectLabel(sp) {
  const parts = [];
  let pos = false, neg = false;
  if (sp.statStageBoost) {
    for (const [k, lbl] of _FX_STAT_LBL) {
      const n = sp.statStageBoost[k] || 0;
      if (!n) continue;
      if (n > 0) pos = true; else neg = true;
      parts.push((n > 0 ? '+' : '') + n + ' ' + lbl);
    }
  }
  if (sp.randomTeamBuff) { pos = true; parts.push('+' + (sp.randomTeamBuff.stages || 1) + ' RANDOM'); }
  if (Array.isArray(sp.statusEffects)) {
    for (const fx of sp.statusEffects) {
      if (!fx || !fx.id) continue;
      const def = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS[fx.id] : null;
      if (def && def.kind === 'debuff') neg = true; else pos = true;
      parts.push((def && def.glyph ? def.glyph + ' ' : '') + ((def && def.label) || fx.id));
    }
  }
  if (!parts.length) return null;
  const color = neg && !pos ? '#ff9a66' : (pos && !neg ? '#55cc66' : '#c9b465');
  return { text: parts.slice(0, 3).join(' · '), color };
}

function spellPowerStat(sp) {
  if (sp.dmg) return { value: sp.dmg, unit: 'PWR', color: '#ee6655' };
  if (sp.hitDamages && sp.hitDamages.length) return { value: sp.hitDamages.reduce((s, v) => s + v, 0), unit: 'PWR', color: '#ee6655' };
  if (sp.dotDamage) return { value: sp.dotDamage, unit: 'DOT', color: '#ee6655' };
  if (sp.heal) return { value: sp.heal, unit: 'HP', color: '#55cc66' };
  if (sp.shield) return { value: sp.shield, unit: 'SHLD', color: '#5fd6ff' };
  // No number to show — say what the spell does instead ("+1 ATK", "🔥 Burn").
  const fx = spellEffectLabel(sp);
  if (fx) return { value: fx.text, unit: 'FX', color: fx.color };
  return null;
}

function _computeEnemyActions(actingUnit, targetUnit) {
  if (!actingUnit || !targetUnit || targetUnit.dead) return [];
  const actions = [];
  const G = window.GAME;
  if (!G) return actions;

  const tx = targetUnit.x, ty = targetUnit.y;
  const unitAP = actingUnit.ap || 0;
  const targetZ = targetUnit.z ?? 0;

  // 3D combat distance: elevation difference to the target counts toward range
  // (matches the engine's combatDist), so the action menu grays out attacks /
  // spells aimed at a target that's out of reach vertically — e.g. a flyer far
  // overhead or an enemy atop a tall cliff — even when it's adjacent on the grid.
  const _cd = (fx, fy, fz, gx, gy, gz) => (typeof G.combatDist === 'function')
    ? G.combatDist(fx, fy, fz ?? 0, gx, gy, gz ?? 0)
    : Math.abs(fx - gx) + Math.abs(fy - gy);
  const _distFromTo = (fx, fy, fz) => {
    let d = _cd(fx, fy, fz, tx, ty, targetZ);
    if (targetUnit._isBoss && targetUnit._bossSize === 2) {
      d = Math.min(d,
        _cd(fx, fy, fz, targetUnit.x + 1, targetUnit.y, targetZ),
        _cd(fx, fy, fz, targetUnit.x, targetUnit.y + 1, targetZ),
        _cd(fx, fy, fz, targetUnit.x + 1, targetUnit.y + 1, targetZ)
      );
    }
    return d;
  };

  const dist = _distFromTo(actingUnit.x, actingUnit.y, actingUnit.z ?? 0);

  // Spell-aware reach: a long-range (gravity-assisted) delivery drops DOWNWARD
  // for free, so a target sitting BELOW the caster ignores the downward
  // elevation gap — only horizontal distance (and any UPWARD gap) limits it.
  // This mirrors combatReach() in the engine (used by doSpell + the board
  // range highlight); without it the spell cards would gray out a cast that
  // the engine would actually allow (e.g. a mage atop a building casting down
  // onto an enemy one tile away on the ground).
  const _reach = (fx, fy, fz, gx, gy, gz, longRange) => (typeof G.combatReach === 'function')
    ? G.combatReach(fx, fy, fz ?? 0, gx, gy, gz ?? 0, longRange)
    : _cd(fx, fy, fz, gx, gy, gz);
  const _spellDistFromTo = (fx, fy, fz, longRange) => {
    let d = _reach(fx, fy, fz, tx, ty, targetZ, longRange);
    if (targetUnit._isBoss && targetUnit._bossSize === 2) {
      d = Math.min(d,
        _reach(fx, fy, fz, targetUnit.x + 1, targetUnit.y, targetZ, longRange),
        _reach(fx, fy, fz, targetUnit.x, targetUnit.y + 1, targetZ, longRange),
        _reach(fx, fy, fz, targetUnit.x + 1, targetUnit.y + 1, targetZ, longRange)
      );
    }
    return d;
  };

  const distFrom = (fx, fy, fz) => _distFromTo(fx, fy, fz);

  const findMoveIntoRange = (requiredRange, actionApCost, longRange) => {
    if (typeof getMoveTiles !== 'function' || typeof canUnitMove !== 'function') return null;
    if (!canUnitMove(actingUnit)) return null;
    const movesLeft = (typeof G.UNIT_MAX_MOVES !== 'undefined' ? G.UNIT_MAX_MOVES : 2) - (actingUnit.movesThisTurn || 0);
    if (movesLeft <= 0) return null;

    /* Spell approaches measure with the engine's combatReach (long-range
       casts drop downward for free); combatDist alone hid legal barrage
       approach tiles. combatReach with longRange=false === combatDist, so
       attacks are unchanged. */
    const _dm = longRange ? ((fx, fy, fz) => _spellDistFromTo(fx, fy, fz, true)) : distFrom;

    const ring1 = getMoveTiles(actingUnit);
    let bestTile = null;
    let bestDist = -1;

    // AP after the walk leg. The SECOND move of a turn consumes ALL remaining
    // AP (finishMoveAt) — once the unit has moved, no move-then-act plan can
    // ever act, so the walk budget drops to zero. (The jump branch below keeps
    // its own gate: a jump is always a flat 1 AP, move counter or not.)
    const _mirAltAp = (typeof FLYING_ALTITUDE_CONFIG !== 'undefined' && FLYING_ALTITUDE_CONFIG.apCost) || 1;
    const apAfter1Move = (actingUnit.movesThisTurn || 0) >= 1 ? -999 : unitAP - 1;
    if (apAfter1Move >= actionApCost) {
      for (const t of ring1) {
        // Double-check tile is actually vacant at this z (ground+air dual occupancy guard)
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        // Takeoff-and-glide tiles cost takeoff AP + move AP, not 1 — skip them
        // unless the unit can pay that AND the action afterward.
        if (t._takeoff && (unitAP - (_mirAltAp + 1)) < actionApCost) continue;

        const dFromTile = _dm(t.x, t.y, t.z);
        if (dFromTile >= 1 && dFromTile <= requiredRange) {

          // Pass the LANDING z as sourceZ — omitting it makes the LOS ray
          // infer a z from the (still empty) tile's column, which can differ
          // from where the unit will actually stand. That mismatch is what
          // produced "moves into position, then: Terrain blocks the path".
          if (typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(t.x, t.y, tx, ty, t.z)) continue;

          if (!bestTile || dFromTile > bestDist) {
            bestTile = { moveCost: t._takeoff ? (_mirAltAp + 1) : 1, x: t.x, y: t.y, z: t.z };
            bestDist = dFromTile;
          }
        }
      }
    }

    // Jump counts as movement for the range approach too (1 AP, exactly like
    // a step): a leap over the gap/ledge that blocks the walk ring can be
    // what puts the target in range. Unlike a second WALK, a jump stays a
    // flat 1 AP even after the unit has moved, so it gets its own AP gate.
    if (!bestTile && (unitAP - 1) >= actionApCost
        && typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
      for (const t of getJumpTiles(actingUnit)) {
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const dFromTile = _dm(t.x, t.y, t.z);
        if (dFromTile >= 1 && dFromTile <= requiredRange) {
          if (typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(t.x, t.y, tx, ty, t.z)) continue;
          if (!bestTile || dFromTile > bestDist) {
            bestTile = { moveCost: 1, x: t.x, y: t.y, z: t.z, _jump: true };
            bestDist = dFromTile;
          }
        }
      }
    }

    // NO two-step (move+move) approach: the second move of a turn drains ALL
    // remaining AP (finishMove), so a move+move+act plan could never act.

    return bestTile;
  };

  const effRange = typeof getEffectiveRange === 'function' ? getEffectiveRange(actingUnit) : (actingUnit.range || 1) + 1;
  const losBlocked = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);
  // Fog parity with the engine gates (doAttack / doSpell / getSpellRangeTiles):
  // a target the caster can't see must not be offered — clicking it would just
  // bounce off the engine's own vision check after the move.
  const _fogSees = !state.fogOfWar || !!state.autoPlayers?.[actingUnit.player]
    || typeof isInVision !== 'function' || isInVision(actingUnit, tx, ty);
  const inAttackRange = dist >= 1 && dist <= effRange && !losBlocked && _fogSees;
  const canAttack = inAttackRange && unitAP >= (G.AP_COST_ACTION || 1);

  let atkPreview = null;
  if (typeof getPreviewEffect === 'function') {

    const savedPending = state.pendingTarget;
    state.pendingTarget = { x: tx, y: ty, mode: 'attack' };
    atkPreview = getPreviewEffect(actingUnit, targetUnit);
    state.pendingTarget = savedPending;
  }

  let atkMoveTile = null;
  if (!canAttack) {
    atkMoveTile = findMoveIntoRange(effRange, G.AP_COST_ACTION || 1);
  }

  // 🗯 Provoke: while the challenger is attackable from here, doAttack refuses
  // every other target — grey the row with the real reason instead of letting
  // the click (or the move-then-attack) bounce off the engine.
  let atkTauntLock = null;
  if (typeof getTauntTargeter === 'function') {
    const _aT = getTauntTargeter(actingUnit);
    if (_aT && _aT.id !== targetUnit.id) {
      const _aTd = (typeof combatDist === 'function')
        ? combatDist(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, _aT.x, _aT.y, _aT.z ?? 0)
        : Math.abs(actingUnit.x - _aT.x) + Math.abs(actingUnit.y - _aT.y);
      if (_aTd >= 1 && _aTd <= effRange
          && !(typeof isRangeBlockedByTerrain === 'function'
            && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, _aT.x, _aT.y, actingUnit.z))) {
        atkTauntLock = _aT;
      }
    }
  }
  if (atkTauntLock) {
    actions.push({
      id: 'attack',
      label: 'Attack',
      icon: '⚔',
      apCost: G.AP_COST_ACTION || 1,
      moveTile: null,
      preview: null,
      typeNote: '',
      available: false,
      reason: '🗯 Provoked — attack ' + (typeof unitDisplayName === 'function' ? unitDisplayName(atkTauntLock) : 'the challenger'),
    });
  } else if (canAttack || atkMoveTile) {

    let moveAtkPreview = atkPreview;
    if (atkMoveTile && !canAttack) {

      const minRoll = -2, maxRoll = 2;
      let minDmg = Math.max(24, Math.floor(actingUnit.atk * 0.65) + minRoll);
      let maxDmg = Math.max(24, Math.floor(actingUnit.atk * 0.65) + maxRoll);
      const effectiveArmor = typeof getEffectiveArmor === 'function' ? getEffectiveArmor(targetUnit) : 0;
      if (effectiveArmor) { minDmg = Math.max(1, minDmg - effectiveArmor); maxDmg = Math.max(1, maxDmg - effectiveArmor); }
      if (targetUnit.shield > 0) { minDmg = Math.max(0, minDmg - targetUnit.shield); maxDmg = Math.max(0, maxDmg - targetUnit.shield); }
      moveAtkPreview = { type: 'damage', min: minDmg, max: maxDmg };
    }
    actions.push({
      id: 'attack',
      label: 'Attack',
      icon: '⚔',
      apCost: G.AP_COST_ACTION || 1,
      moveTile: canAttack ? null : atkMoveTile,
      preview: canAttack ? atkPreview : moveAtkPreview,
      typeNote: typeof getTypeCombatNote === 'function' ? getTypeCombatNote(actingUnit, targetUnit) : '',
      available: true,
    });
    // (No "Attack ×N" rows anymore: an attack ENDS the turn, so a second
    // swing only exists when the first one presses — never guaranteed.)
  } else {
    actions.push({
      id: 'attack',
      label: 'Attack',
      icon: '⚔',
      apCost: G.AP_COST_ACTION || 1,
      moveTile: null,
      preview: null,
      typeNote: '',
      available: false,
      reason: losBlocked ? 'No line of sight' : 'Out of range',
    });
  }

  const allSpells = [...(actingUnit.spells || []), ...(actingUnit._raceAbilities || [])].filter(Boolean);

  // (The "Grapple + Strike" one-click combo is gone: casting Grapple now ENDS
  // the turn, so the follow-up swing can never fire. Grapple itself still
  // shows below as a normal spell row.)

  // Anything that can land on the clicked enemy belongs in this menu: damage
  // and debuffs, but also target-focused utility — poison/leech seeds, terrain
  // walls and floods, summoned weather, swaps, artillery marks, Grapple,
  // Plunder… Each flows through the normal range + move-into-range logic below
  // and is cast AT the enemy's tile. Only casts that cannot affect an
  // enemy-occupied tile are filtered out here; the sort at the end keeps the
  // damaging moves on top.
  const nonEnemyTargetKinds = new Set([
    // ally / self support (kind-level — also catches healers typed 'utility')
    'heal', 'selfHeal', 'healAll', 'zoneHeal', 'seedHeal', 'revive', 'cleanse',
    'manaRestoreAll', 'buff', 'warCry', 'encore', 'shield', 'aoeShield', 'guard',
    // caster repositioning / global field effects with no aim point
    'teleport', 'escape', 'trickRoom',
    // placements the engine rejects on occupied tiles, or that never touch the target
    'warpRune', 'buildBridge', 'plantTree',
    'deployObject', 'deployPair', 'deployTurret', 'remoteView',
    // traps need an EMPTY tile — casting one AT an enemy always fails
    'placeTrap',
    // Machine Elves: prisms need an empty tile; tune/pulse are self-cast
    'placeMirror', 'tuneFrequency', 'pulseLattice',
  ]);
  for (const sp of allSpells) {
    const cls = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
    // Payload-based team check beats the coarse class: Sticky Bomb is
    // type:'buff' but dmg:144 (belongs here), Smoke Screen is kind
    // 'zoneDebuff' but cloaks ALLIES (does not belong on an enemy).
    const _tt = typeof spellTileTeam === 'function' ? spellTileTeam(sp) : 'both';
    if ((cls === 'heal' || cls === 'buff') && _tt !== 'enemy') continue;
    if (_tt === 'ally') continue;
    if (nonEnemyTargetKinds.has(sp.kind)) continue;
    // Flight-gated grabs (Sky Drop / Sky Throw) are dead rows for grounded casters.
    if (sp.requiresFlight && !(typeof canFly === 'function' && canFly(actingUnit))) continue;
    // …and for flyers that can't actually get airborne right now: too wounded
    // to swoop-takeoff (below 25% HP) or pinned by super gravity. doSpell
    // rejects both AFTER the approach move — never offer the row.
    if (sp.requiresFlight && !(typeof isUnitAirborne === 'function' && isUnitAirborne(actingUnit))
        && ((typeof isFlightCrippled === 'function' && isFlightCrippled(actingUnit))
          || (typeof getGravityFieldAt === 'function' && getGravityFieldAt(actingUnit.x, actingUnit.y) === 'super'))) continue;
    // Pure-status casts that would do NOTHING on this target (it already
    // carries every status the spell applies) — doSpell rejects them with
    // "would have no effect"; drop the dead row instead.
    if (targetUnit && typeof spellIsPureStatus === 'function' && spellIsPureStatus(sp)
        && typeof spellTargetUsableOn === 'function' && !spellTargetUsableOn(actingUnit, sp, targetUnit)) continue;
    // Seeds can't root on mountain/lava — the engine rejects the plant outright.
    if ((sp.kind === 'seedPoison' || sp.kind === 'leechSeed') && typeof getTerrainAt === 'function') {
      const seedGround = getTerrainAt(tx, ty);
      if (seedGround === 'mountain' || seedGround === 'lava') continue;
    }

    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
    const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
    const mpCost = (typeof getSpellMpCostFor === 'function')
      ? getSpellMpCostFor(actingUnit, sp) : (sp.cost || 0) + mpPenalty;
    // canAffordSpell folds in cooldown + banked materials, so a quick-cast row
    // never lights up for a spell doSpell would reject.
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost
      && !(typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence'))
      && (typeof canAffordSpell !== 'function' || canAffordSpell(actingUnit, sp));
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;
    // placeBlock aimed at the enemy's tile = the block-shove play; grey the row
    // when the erupting block can't actually form there (colossal target, max
    // height, nowhere to shove them).
    if (sp.kind === 'placeBlock' && typeof _placeBlockProblem === 'function'
        && _placeBlockProblem(actingUnit, sp, tx, ty)) continue;
    // buildStructure rows on an enemy only make sense when a plan exists
    // (fort ring around them, tower beside them); drop dead rows.
    if (sp.kind === 'buildStructure' && typeof _structurePlanFor === 'function'
        && !_structurePlanFor(actingUnit, sp, tx, ty)) continue;

    const spRange = typeof getEffectiveSpellRange === 'function' ? getEffectiveSpellRange(actingUnit, sp) : (sp.range || 1);
    const spLos = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

    // 🗯 Provoke: a taunted caster's UNIT-targeted offensive casts are locked
    // to the challenger while the challenger is castable-at — doSpell rejects
    // any other enemy (after the approach move, too). Mirror its gate and drop
    // the row instead of letting the click bounce.
    if (targetUnit && typeof getTauntTargeter === 'function' && typeof _kindMeta === 'function') {
      const _qTaunter = getTauntTargeter(actingUnit);
      if (_qTaunter && _qTaunter.id !== targetUnit.id) {
        const _tm = _kindMeta(sp);
        if (_tm.offensive && !_tm.tileTargeted && !_tm.directional) {
          const _tLong = (typeof isLongRangeSpell === 'function') && isLongRangeSpell(sp);
          const _td = (typeof combatReach === 'function')
            ? combatReach(actingUnit.x, actingUnit.y, actingUnit.z ?? 0,
                _qTaunter.x, _qTaunter.y, _qTaunter.z ?? 0, _tLong)
            : Math.abs(actingUnit.x - _qTaunter.x) + Math.abs(actingUnit.y - _qTaunter.y);
          const _tVis = !state.fogOfWar
            || (typeof isInVision === 'function' && isInVision(actingUnit, _qTaunter.x, _qTaunter.y));
          if (_td >= (_tm.minRange ?? 1) && _td <= spRange && _tVis
              && (sp.ignoresLineOfSight
                || !(typeof isRangeBlockedByTerrain === 'function'
                  && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, _qTaunter.x, _qTaunter.y, actingUnit.z ?? 0)))) continue;
        }
      }
    }

    // Distance with the long-range downward-gravity rule applied for THIS spell,
    // so casting down onto a lower target isn't blocked by the vertical gap.
    const spLongRange = (typeof isLongRangeSpell === 'function') && isLongRangeSpell(sp);
    const dist = _spellDistFromTo(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, spLongRange);

    let inSpellRange = false;
    const isBarrage = sp.kind === 'barrage';
    const isAoeOriginSelf = sp.aoeOriginSelf;
    // splitBeam is a unit-target spell in the engine (generic range+LOS rules),
    // NOT a direction beam — it goes through the generic branch below.
    const isLine = sp.kind === 'line' || sp.kind === 'linePush';
    const isCross = sp.kind === 'cross';
    const isDash = sp.kind === 'dash';
    const isLeap = sp.kind === 'leapStrike';

    // Engine beams (line/linePush) are DIRECTION casts: the click only picks a
    // heading — orthogonal OR diagonal — and the ray walks the whole board,
    // stopping only at impassable terrain (doSpell skips the range/LOS gates
    // entirely; see _applyLineDamage). So "castable on this enemy from (sx,sy)"
    // = enemy sits on one of the 8 ray headings and the ray reaches them.
    const beamRayHits = (sxx, syy) => {
      const ddx = Math.sign(tx - sxx), ddy = Math.sign(ty - syy);
      if (ddx === 0 && ddy === 0) return false;
      const adx = Math.abs(tx - sxx), ady = Math.abs(ty - syy);
      if (!(ddx === 0 || ddy === 0 || adx === ady)) return false;
      let cx2 = sxx + ddx, cy2 = syy + ddy;
      const maxSteps = Math.max(adx, ady);
      for (let i = 0; i < maxSteps; i++) {
        if (typeof isTerrainPassable === 'function' && !isTerrainPassable(cx2, cy2) && !sp.destroysObstacles) return false;
        if (cx2 === tx && cy2 === ty) return true;
        cx2 += ddx; cy2 += ddy;
      }
      return false;
    };

    if (isBarrage) {
      // Barrage novae (Meow, Quake, Requiem…) center on the CASTER and auto-hit
      // every enemy inside their radius — aoeRadius for self-origin bursts, else
      // the spell's range. The clicked enemy is reachable only if it actually
      // sits inside that radius; if it doesn't, the cast fires and hits nothing,
      // so treat it as out of range (a move-into-range step is offered below).
      const barrageRadius = isAoeOriginSelf ? (sp.aoeRadius || 1) : spRange;
      inSpellRange = dist >= 1 && dist <= barrageRadius && (sp.ignoresLineOfSight || !spLos);
    } else if (isAoeOriginSelf) {

      const selfRadius = isCross ? (sp.crossRadius || 1) : (sp.aoeRadius || 1);
      inSpellRange = dist <= selfRadius;
    } else if (isLine) {

      inSpellRange = dist >= 1 && beamRayHits(actingUnit.x, actingUnit.y);
    } else if (isDash) {

      // Engine parity (doSpell 'dash'): the gate is plain 2D Manhattan range +
      // passable landing terrain — there is NO cardinal-axis requirement, and
      // no elevation term. The old axis check hid perfectly legal diagonal /
      // off-axis dashes from the quick menu.
      const _dashD = Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);
      inSpellRange = _dashD >= 1 && _dashD <= spRange
        && (typeof isTerrainPassable !== 'function' || isTerrainPassable(tx, ty));
    } else if (isLeap) {
      // Leap-strikes can only hit a target the caster stands ABOVE. From here that
      // needs an in-range enemy standing lower than us; if we're level/below it's not
      // castable from this tile — but a jump up can fix it (offered via spMoveTile).
      const _csh = typeof getUnitStandingHeight === 'function' ? getUnitStandingHeight(actingUnit) : (actingUnit.z ?? 0);
      // Engine parity: getSpellRangeTiles/doSpell compare the caster's standing
      // height against the target's RAW z (its _tileStandZ), NOT its roof-boosted
      // getUnitStandingHeight — the mismatch made leap-strike appear/disappear
      // incorrectly whenever the target stood on a walkable-roof object.
      const _tsh = targetUnit
        ? (targetUnit.z ?? (typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0))
        : 0;
      inSpellRange = !!targetUnit && dist >= 1 && dist <= spRange && !spLos && _csh > _tsh;
    } else {

      const minRange = ['aoe', 'cross', 'aoePull'].includes(sp.kind) ? 0 : 1;
      // _fogSees: the engine's cast gate rejects fogged targets — mirror it in
      // the primary check so the menu never offers a cast that will bounce.
      inSpellRange = dist >= minRange && dist <= spRange && !spLos && _fogSees;
      // Authoritative fallback: trust the engine's own range set (the same one the
      // board highlight + doSpell use — fog-aware) so a spell is never greyed here
      // when it's actually castable from where the unit stands.
      if (!inSpellRange && typeof getSpellRangeTiles === 'function'
          && getSpellRangeTiles(actingUnit, sp).some(t => t.x === tx && t.y === ty)) {
        inSpellRange = true;
      }
    }

    const canCast = canAfford && tierOk && inSpellRange;

    let spMoveTile = null;
    if (canAfford && tierOk && !inSpellRange) {
      if (isBarrage) {
        // Walk the caster close enough that the clicked enemy falls inside the
        // self-centered blast, so the player gets a one-click "move then nova".
        const barrageRadius = isAoeOriginSelf ? (sp.aoeRadius || 1) : spRange;
        spMoveTile = findMoveIntoRange(barrageRadius, spellApCost, spLongRange);
      } else if (isAoeOriginSelf) {

        const selfRadius = isCross ? (sp.crossRadius || 1) : (sp.aoeRadius || 1);
        spMoveTile = findMoveIntoRange(selfRadius, spellApCost, spLongRange);
      } else if (isLine) {
        // Beam move-then-cast: step (or jump) to any reachable tile that puts
        // the enemy on one of the 8 ray headings with the ray unobstructed —
        // beams were previously never offered as MOVE→CAST at all.
        spMoveTile = null;
        if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function'
            && (unitAP - 1) >= spellApCost) {
          const cand = [];
          // Walk legs only BEFORE the first move: the second move of a turn
          // drains ALL AP (finishMoveAt), so a walk-then-beam after moving
          // could never cast. Takeoff tiles cost 2 AP — excluded outright.
          if (canUnitMove(actingUnit) && (actingUnit.movesThisTurn || 0) < 1) {
            try { cand.push(...getMoveTiles(actingUnit).filter(t => !t._takeoff)); } catch (e) {}
          }
          if (typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
            // Tag leap candidates so the executor fires doJump — a raw jump
            // tile is not a legal doMove destination and would just "Block!".
            try { cand.push(...getJumpTiles(actingUnit).map(t => ({ x: t.x, y: t.y, z: t.z, _jumpVerb: true }))); } catch (e) {}
          }
          let best = null, bestD = Infinity;
          for (const t of cand) {
            if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
            if (t.x === tx && t.y === ty) continue;
            if (!beamRayHits(t.x, t.y)) continue;
            const d = Math.abs(t.x - actingUnit.x) + Math.abs(t.y - actingUnit.y);
            if (d < bestD) { bestD = d; best = { moveCost: 1, x: t.x, y: t.y, z: t.z, _jump: !!t._jumpVerb }; }
          }
          spMoveTile = best;
        }
      } else if (isDash) {

        spMoveTile = null;
      } else if (isLeap) {
        // A leap onto a level/higher enemy needs the caster to JUMP up first so the
        // target ends up below them. findMoveIntoRange only walks; the engine's
        // jump-aware finder returns a {_jump:true} approach when a leap-up enables it.
        spMoveTile = (targetUnit && typeof findSpellApproachTile === 'function')
          ? findSpellApproachTile(actingUnit, sp, tx, ty, targetUnit.z) : null;
      } else {
        // Use the engine's authoritative approach finder (walk + jump + take-off /
        // land / raise-terrain) so the quick-cast menu offers the SAME move-then-cast
        // the ability menu and board-click already do — no more spells greyed here
        // that you can actually cast after repositioning first.
        spMoveTile = (typeof findSpellApproachTile === 'function')
          ? findSpellApproachTile(actingUnit, sp, tx, ty, targetUnit.z)
          : findMoveIntoRange(spRange, spellApCost);
      }
      if (spMoveTile && (unitAP - spMoveTile.moveCost) < spellApCost) spMoveTile = null;
    }

    let dmgEstimate = null;
    if (typeof _estimateSpellDamage === 'function') {
      dmgEstimate = _estimateSpellDamage(actingUnit, targetUnit, sp);
    }
    const powerLabel = typeof getSpellPowerLabel === 'function' ? getSpellPowerLabel(sp) : '';

    if (canCast || spMoveTile) {
      actions.push({
        id: 'spell:' + sp.name,
        label: sp.name,
        icon: '✦',
        spellType: sp.spellType || '',
        apCost: spellApCost,
        mpCost: mpCost,
        moveTile: canCast ? null : spMoveTile,
        preview: dmgEstimate ? { type: 'damage', amount: dmgEstimate } : null,
        powerLabel: powerLabel,
        // Matchup note only for damaging casts — a debuff can't be
        // "super effective" (no damage), so no green ! / ▼ on those rows.
        typeNote: (spellDealsDamage(sp) && typeof getTypeCombatNote === 'function')
          ? getTypeCombatNote(actingUnit, targetUnit, sp.spellType) : '',
        available: true,
        spell: sp,
      });
    } else if (canAfford && tierOk) {

      actions.push({
        id: 'spell:' + sp.name,
        label: sp.name,
        icon: '✦',
        spellType: sp.spellType || '',
        apCost: spellApCost,
        mpCost: mpCost,
        moveTile: null,
        preview: dmgEstimate ? { type: 'damage', amount: dmgEstimate } : null,
        powerLabel: powerLabel,
        typeNote: '',
        available: false,
        reason: spLos ? 'No line of sight' : 'Out of range',
        spell: sp,
      });
    }

  }

  if (typeof unitCanCombo === 'function' && unitCanCombo(actingUnit) && typeof getComboPartners === 'function') {
    const comboApCost = G.COMBO_AP_COST_INITIATOR || 2;
    const onCooldown = typeof COMBO_COOLDOWN_ROUNDS !== 'undefined' &&
      ((state.round || 0) - (actingUnit._lastComboRound || -99)) < COMBO_COOLDOWN_ROUNDS;

    // The row is only real if SOME partner's combo can reach THIS enemy from
    // where the initiator stands — doComboAttack validates the initiator's
    // range with the COMBO's own range (default 3), not the unit's attack
    // range, so measuring with effRange here let dead-on-arrival combos
    // through ("Combo target is out of range").
    let comboOk = false;
    if (!onCooldown && unitAP >= comboApCost && !losBlocked && _fogSees) {
      for (const p of getComboPartners(actingUnit)) {
        const pCombo = typeof getComboForUnits === 'function' ? getComboForUnits(actingUnit, p) : null;
        if (!pCombo || !['damage', 'multiHit', 'aoe'].includes(pCombo.kind)) continue;
        const pRange = pCombo.range || 3;
        if (dist >= 1 && dist <= pRange) { comboOk = true; break; }
      }
    }

    if (comboOk) {
      actions.push({
        id: 'combo',
        label: 'Combo',
        icon: '◆',
        apCost: comboApCost,
        moveTile: null,
        preview: null,
        typeNote: '',
        available: true,
      });
    }
  }

  if (typeof ITEM_RULES !== 'undefined' && actingUnit.items) {
    const baneRange = typeof getEffectiveRange === 'function' ? getEffectiveRange(actingUnit) + 1 : 2;
    const itemApCost = G.AP_COST_ACTION || 1;
    const baneKeys = Object.keys(ITEM_RULES).filter(k => ITEM_RULES[k].baneType && (actingUnit.items[k] || 0) > 0);
    for (const bKey of baneKeys) {
      const bRule = ITEM_RULES[bKey];
      const bLos = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

      const bDist = Math.max(Math.abs(actingUnit.x - tx), Math.abs(actingUnit.y - ty));
      const inBaneRange = bDist >= 1 && bDist <= baneRange && !bLos;
      const canThrow = inBaneRange && unitAP >= itemApCost;

      const isBaneEffective = (targetUnit.types || []).includes(bRule.baneType);
      let baneDmg = (bRule.baseDmg || 48) + (isBaneEffective ? (bRule.baneDmg || 120) : 0);
      baneDmg = Math.max(1, baneDmg - (typeof getEffectiveArmor === 'function' ? getEffectiveArmor(targetUnit, 'magic') : 0));

      let bMoveTile = null;
      if (!canThrow && unitAP >= itemApCost) {
        bMoveTile = findMoveIntoRange(baneRange, itemApCost);
      }

      if (canThrow || bMoveTile) {
        actions.push({
          id: 'item:' + bKey,
          label: bRule.name,
          icon: bRule.icon || '🗡️',
          apCost: itemApCost,
          moveTile: canThrow ? null : bMoveTile,
          preview: { type: 'damage', amount: baneDmg },
          typeNote: isBaneEffective ? 'Super effective!' : '',
          available: true,
          itemKey: bKey,
        });
      }
    }
  }

  // "Move Towards" — a one-click step toward the clicked enemy, for when
  // nothing in this menu can reach them and you just want to close the
  // distance without backing out through the menus. Jump / take-off / raise
  // all count as movement here: if a plain step can't make progress (cliff,
  // chasm, grounded flyer) the action falls through to whichever 1-AP
  // mobility verb actually gets the unit closer, instead of stranding it.
  if (unitAP >= 1 && dist > 1) {
    const mtMovesLeft = (typeof G.UNIT_MAX_MOVES !== 'undefined' ? G.UNIT_MAX_MOVES : 2) - (actingUnit.movesThisTurn || 0);
    // Approach progress is measured FLAT (2D Manhattan). The old 3D combatDist
    // scoring counted the elevation gap to the target, so on bumpy maps every
    // genuinely-closer tile up/down a slope looked "no closer" and Move Towards
    // degenerated into a 1-tile shuffle. Ties prefer the smaller elevation gap.
    const _flatD = (fx, fy) => {
      let d = Math.abs(fx - tx) + Math.abs(fy - ty);
      if (targetUnit._isBoss && targetUnit._bossSize === 2) {
        d = Math.min(d,
          Math.abs(fx - (tx + 1)) + Math.abs(fy - ty),
          Math.abs(fx - tx) + Math.abs(fy - (ty + 1)),
          Math.abs(fx - (tx + 1)) + Math.abs(fy - (ty + 1)));
      }
      return d;
    };
    const _zGap = (fz) => Math.abs((fz ?? 0) - targetZ);
    let towardTile = null;
    let towardDist = _flatD(actingUnit.x, actingUnit.y);
    let towardZGap = _zGap(actingUnit.z);
    let towardLabel = 'Move Towards';
    let towardIcon = '➜';
    if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function'
        && canUnitMove(actingUnit) && mtMovesLeft > 0) {
      for (const t of getMoveTiles(actingUnit)) {
        if (t._takeoff) continue;   // altitude changes cost extra AP — plain steps only
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const d = _flatD(t.x, t.y);
        const zg = _zGap(t.z);
        if (d < towardDist || (d === towardDist && towardTile && zg < towardZGap)) {
          towardTile = { moveCost: 1, x: t.x, y: t.y, z: t.z }; towardDist = d; towardZGap = zg;
        }
      }
    }
    // A leap that lands strictly closer than the best walk step wins (same
    // 1 AP) — this is what carries the approach across gaps and up ledges
    // that stopped the plain step after one tile.
    if (typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
      for (const t of getJumpTiles(actingUnit)) {
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const d = _flatD(t.x, t.y);
        if (d < towardDist) {
          towardTile = { moveCost: 1, x: t.x, y: t.y, z: t.z, _jump: true };
          towardDist = d;
          towardZGap = _zGap(t.z);
          towardLabel = 'Jump Towards';
          towardIcon = '↷';
        }
      }
    }
    if (!towardTile) {
      // No step or leap makes progress. Offer the 1-AP height verb that
      // unblocks movement instead of nothing: a grounded flyer takes off;
      // a walker facing a too-tall wall raises the ground underfoot.
      if (typeof canFly === 'function' && canFly(actingUnit)
          && typeof isUnitAirborne === 'function' && !isUnitAirborne(actingUnit)
          && (typeof canChangeAltitude !== 'function' || canChangeAltitude(actingUnit, 'ascend'))) {
        towardTile = { moveCost: 1, x: actingUnit.x, y: actingUnit.y, z: actingUnit.z, _heightApproach: 'takeoff' };
        towardLabel = 'Take Off (unblock path)';
        towardIcon = '⬆';
      } else if (typeof canReshapeTile === 'function' && canReshapeTile(actingUnit, 'raise')
          && typeof getHeightAt === 'function') {
        // Only offer the raise when the direct neighbour toward the target
        // really is a wall the unit can't climb — raising for its own sake
        // would just burn AP.
        const stepX = actingUnit.x + Math.sign(tx - actingUnit.x);
        const stepY = actingUnit.y + Math.sign(ty - actingUnit.y);
        const wallH = getHeightAt(stepX, stepY);
        const selfH = actingUnit.z ?? getHeightAt(actingUnit.x, actingUnit.y);
        if (wallH - selfH >= 2) {
          towardTile = { moveCost: 1, x: actingUnit.x, y: actingUnit.y, z: actingUnit.z, _heightApproach: 'raise' };
          towardLabel = 'Raise Ground (climb)';
          towardIcon = '🔺';
        }
      }
    }
    if (towardTile) {
      // Dry-run the full chase chain so the blade + hover preview can show
      // the tile the unit will ACTUALLY stop on, not just the first step.
      const towardPath = towardTile._heightApproach
        ? null
        : _predictMoveTowardsPath(actingUnit, targetUnit, towardTile);
      actions.push({
        id: 'moveTowards',
        label: towardLabel,
        icon: towardIcon,
        apCost: 1,
        moveTile: towardTile,
        _towardPath: towardPath && towardPath.length ? towardPath : null,
        preview: null,
        typeNote: '',
        available: true,
      });
    }
  }

  actions.sort((a, b) => {
    // Greyed-out (unavailable) actions sink to the bottom so the player never
    // has to scroll past things they can't do to reach something they can.
    const availA = a.available ? 0 : 1;
    const availB = b.available ? 0 : 1;
    if (availA !== availB) return availA - availB;

    // Damaging moves first, highest expected damage on top…
    const dmgA = _actionSortDamage(a);
    const dmgB = _actionSortDamage(b);
    if (dmgB !== dmgA) return dmgB - dmgA;

    // …then, among the non-damaging rest, debuffs before pure utility.
    const clsA = _actionSortClass(a);
    const clsB = _actionSortClass(b);
    if (clsA !== clsB) return clsA - clsB;

    const orderA = a.id === 'attack' ? 0 : a.id.startsWith('spell:') ? 1 : a.id.startsWith('item:') ? 2 : 3;
    const orderB = b.id === 'attack' ? 0 : b.id.startsWith('spell:') ? 1 : b.id.startsWith('item:') ? 2 : 3;
    return orderA - orderB;
  });

  return actions;
}

function _actionSortDamage(action) {
  if (action._sortDamage != null) return action._sortDamage;
  if (!action.preview) return 0;
  if (action.preview.amount) return action.preview.amount;
  if (action.preview.min != null && action.preview.max != null) return (action.preview.min + action.preview.max) / 2;
  return 0;
}

// Tiebreak for zero-damage rows: attacks/combos (0) and damage-class spells
// with no listed numbers sort ahead of debuffs (1), which sort ahead of pure
// utility casts like seeds / terrain / weather (2).
function _actionSortClass(action) {
  if (!action.spell) return 0;
  const cls = typeof classifySpell === 'function' ? classifySpell(action.spell) : 'damage';
  return cls === 'damage' ? 0 : cls === 'debuff' ? 1 : 2;
}


/* ── Quick-menu machinery (module scope — used by the blade builders) ── */

// Predict where a spell will SHOVE its target so we can preview it: a push
// spell flings the target away from the cast tile, a pull drags it toward the
// caster. Walks tile-by-tile and stops at the board edge / an obstacle / an
// occupied tile, mirroring the engine's displacement loop. Returns the landing
// tile + mode, or null when the spell doesn't move the target (or can't).
function _predictTargetShove(spell, target, castX, castY) {
  if (!spell || !target) return null;
  const k = spell.kind;
  const isGrapple = spell.id === 'grapple' || spell.id === 'raceGrapple';
  const isPull = k === 'pull' || k === 'aoePull' || !!spell.pullDistance || isGrapple;
  const isPush = !isPull && (k === 'displacement' || k === 'linePush' || k === 'aoePush'
                  || !!spell.pushDistance || !!spell.displaceDistance);
  if (!isPull && !isPush) return null;

  let dx, dy, dist, mode;
  if (isPull) {
    dx = Math.sign(castX - target.x); dy = Math.sign(castY - target.y);
    dist = spell.pullDistance || (isGrapple ? 2 : 3); mode = 'pull';
  } else {
    dx = Math.sign(target.x - castX) || 1; dy = Math.sign(target.y - castY);
    dist = spell.displaceDistance || spell.pushDistance || 2; mode = 'push';
  }
  if (dx === 0 && dy === 0) return null;

  let px = target.x, py = target.y;
  for (let i = 0; i < dist; i++) {
    const nx = px + dx, ny = py + dy;
    if (typeof isInside === 'function' && !isInside(nx, ny)) break;
    if (typeof isTerrainPassable === 'function' && !isTerrainPassable(nx, ny)) break;
    if (typeof unitAt === 'function' && unitAt(nx, ny)) break;
    px = nx; py = ny;
  }
  if (px === target.x && py === target.y) return null;
  return { x: px, y: py, mode };
}

// Simple, consistent arrow palette (2026-07-20 — was per-spell-type
// TYPE_COLORS, which read as random): red = it damages the target, green =
// it heals/helps, blue = movement, purple = the target being force-moved,
// white = neutral utility.
function _actionPlanArrowColor(action) {
  if (!action) return 0xff3333;
  if (action.id === 'attack' || action.id === 'combo') return 0xff3333;
  const k = action.spell ? action.spell.kind : null;
  if (k && _QA_SUP_KINDS[k]) return 0x33dd66;   // heal / support → green
  if (k && !_QA_DMG_KINDS[k]) return 0xeeeeee;  // neutral utility → white
  return 0xff3333;                              // damage → red
}

function _clearMoveArrowPreview() {
  // Hover forecast off with the arrows (see _showMoveArrowPreview).
  window._hoverActionForecast = null;
  if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
  ThreeRenderer.clearArrows3D();
  ThreeRenderer.clearGhostUnit();
  ThreeRenderer.clearOverlay('movePreview');
  ThreeRenderer.clearOverlay('actionPlanTarget');
  ThreeRenderer.clearOverlay('actionPlanAoe');
  ThreeRenderer.clearOverlay('actionPlanShove');
  ThreeRenderer.clearOverlay('actionPlanRange');
}

/* ── TILE-MENU "MOVE TOWARDS" HOVER (2026-07-22) ──────────────────────
   Hovering the tile quick menu's Move Towards blade shows the unit's
   whole walkable range (blue wash), the route arrow to the approach
   tile the chase will actually stop on, a ghost there, and a dim
   marker on the clicked goal tile. Mirrors the in-move-mode hover
   preview in battle.js; cleared by _clearMoveArrowPreview. */
function _showTileMoveTowardsPreview(actingUnit, action) {
  _clearMoveArrowPreview();
  if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
  const approach = action.moveTile;
  const goal = action._towardGoal;
  if (!actingUnit || !approach || !goal) return;
  try {
    const towardsColor = 0x3399ff; // movement = blue
    // Movement range wash: every tile the unit can walk to right now.
    if (typeof getMoveTiles === 'function') {
      const mts = getMoveTiles(actingUnit).filter(t => !t._takeoff);
      if (mts.length) ThreeRenderer.setOverlay('movePreview',
        mts.map(t => ({ x: t.x, y: t.y, opacity: 0.22 })), towardsColor, 0.22);
    }
    const actingY = ThreeRenderer.unitSurfaceY(actingUnit);
    const wps = [{ x: actingUnit.x, y: actingUnit.y, yOverride: actingY }];
    if (typeof findMovePath === 'function') {
      const path = findMovePath(actingUnit, approach.x, approach.y, approach.z) || [];
      for (const s of path) wps.push({ x: s.x, y: s.y, yOverride: ThreeRenderer.tileTopY(s.x, s.y) });
    }
    if (wps.length >= 2) ThreeRenderer.drawPathArrow3D(wps, towardsColor);
    else ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, approach.x, approach.y,
      towardsColor, false, actingY, ThreeRenderer.tileTopY(approach.x, approach.y), { flow: true });
    // Bright stop tile + dim marker on the clicked goal.
    const marks = [{ x: approach.x, y: approach.y, opacity: 0.6 }];
    if (!(goal.x === approach.x && goal.y === approach.y)) {
      marks.push({ x: goal.x, y: goal.y, opacity: 0.25 });
    }
    ThreeRenderer.setOverlay('actionPlanTarget', marks, towardsColor, 0.5);
    const ghostTint = (typeof getFactionColor === 'function')
      ? (parseInt(String(getFactionColor(actingUnit) || '#66ddff').replace('#', ''), 16) || 0x66ddff)
      : 0x66ddff;
    ThreeRenderer.showGhostUnit(actingUnit, approach.x, approach.y,
      ThreeRenderer.tileTopY(approach.x, approach.y), { tag: 'caster', color: ghostTint, opacity: 0.85 });
  } catch (e) { /* preview is cosmetic — never let it break hover */ }
}

// Kind buckets for the quick-cast range wash: red = the spell damages what it
// lands on, green = it helps allies, white = neutral utility. Basic attack /
// combo reach is red too — same "this hurts" palette as the strike arrows.
const _QA_DMG_KINDS = { damage:1, aoe:1, barrage:1, multiHit:1, ricochet:1,
  splitBeam:1, bomb:1, delayed:1, cross:1, leapStrike:1, lifeDrain:1,
  zoneDebuff:1, debuff:1, seedPoison:1, leechSeed:1, pull:1, aoePull:1,
  aoePush:1, displacement:1, skySlam:1 };
const _QA_SUP_KINDS = { heal:1, healAll:1, selfHeal:1, seedHeal:1, revive:1,
  cleanse:1, shield:1, aoeShield:1, buff:1, guard:1, warCry:1, encore:1 };

// Semi-transparent reach field for the hovered quick-menu blade, drawn from
// the tile the action will actually be cast FROM (the move destination on a
// move-then-cast). The solid target/AoE tiles stay the loud layer on top —
// this quietly answers "how far could this reach?", which the quick menus
// never showed before.
function _showQuickActionRange(actingUnit, castX, castY, action) {
  if (!action || typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
  const sp = action.spell;
  let r = 0, color = 0xff3333; // basic attack reach = damage red (same palette as the arrows)
  if (action.id === 'attack' || action.id === 'combo') {
    r = (typeof getEffectiveRange === 'function') ? (getEffectiveRange(actingUnit) || 1) : (actingUnit.range || 1);
  } else if (sp) {
    // Board-length beams (line kinds / directional) already read from the
    // strike arrow + swept footprint — a range field would just paint the map.
    if (sp.kind === 'line' || sp.kind === 'linePush') return;
    r = (typeof getEffectiveSpellRange === 'function') ? getEffectiveSpellRange(actingUnit, sp) : (sp.range || 0);
    color = _QA_DMG_KINDS[sp.kind] ? 0xff3333 : _QA_SUP_KINDS[sp.kind] ? 0x33dd66 : 0xeeeeee;
  } else {
    return;
  }
  if (!r || r > 14) return;
  const skipLOS = !!(sp && (sp.ignoresLineOfSight || sp.kind === 'teleport'
    || sp.kind === 'skyDrop' || sp.kind === 'skyThrow' || sp.kind === 'skySlam'));
  const _W = (typeof bw === 'function') ? bw() : (window.GAME ? GAME.bw() : 16);
  const _H = (typeof bh === 'function') ? bh() : (window.GAME ? GAME.bh() : 8);
  const tiles = [];
  for (let ty = Math.max(0, castY - r); ty <= Math.min(_H - 1, castY + r); ty++) {
    for (let tx = Math.max(0, castX - r); tx <= Math.min(_W - 1, castX + r); tx++) {
      const d = Math.abs(tx - castX) + Math.abs(ty - castY);
      if (d < 1 || d > r) continue;
      if (!skipLOS && typeof isRangeBlockedByTerrain === 'function'
          && isRangeBlockedByTerrain(castX, castY, tx, ty)) continue;
      tiles.push({ x: tx, y: ty });
    }
  }
  if (tiles.length) ThreeRenderer.setOverlay('actionPlanRange', tiles, color, 0.4);
}

function _showMoveArrowPreview(actingUnit, targetUnit, mt, action) {
  _clearMoveArrowPreview();
  // Hover forecast: while this row's arrows are up, the hovered action's
  // projected damage (or heal) blinks white on the target's nameplate HP
  // bar — same channel as the confirm-step forecast (ui.js
  // getPendingDamagePreview reads it; three-renderer paints it). Cleared
  // with the arrows in _clearMoveArrowPreview.
  if (actingUnit && targetUnit && targetUnit.id != null) {
    window._hoverActionForecast = {
      attackerId: actingUnit.id,
      targetId: targetUnit.id,
      spellName: (action && action.spell) ? action.spell.name : null,
      isAttack: !!(action && (action.id === 'attack' || action.id === 'combo')),
      // Potion rows (ally quick menu): forecast the item's heal the same way.
      itemKey: (action && action.itemKey) || null,
    };
  }
  if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
  const tx = targetUnit.x, ty = targetUnit.y;

  const actingY = ThreeRenderer.unitSurfaceY(actingUnit);

  const targetY = ThreeRenderer.unitSurfaceY(targetUnit);

  // Team-tinted hologram + a colour for the strike arrow that matches the action.
  const ghostTint = (typeof getFactionColor === 'function')
    ? (parseInt(String(getFactionColor(actingUnit) || '#66ddff').replace('#', ''), 16) || 0x66ddff)
    : 0x66ddff;
  const arrowColor = _actionPlanArrowColor(action);
  // Casting position (where the strike/shove is measured from): the move
  // destination when repositioning, else the unit's current tile.
  let castX = actingUnit.x, castY = actingUnit.y;

  // "Move Towards" spends the unit's WHOLE remaining movement chasing (see
  // _chainMoveTowards) — preview the REAL chained route and end tile, not
  // just the first step, so hovering the blade shows exactly where the unit
  // will stop. No strike arrow: this action is pure movement.
  if (action && action.id === 'moveTowards' && action._towardPath && action._towardPath.length
      && mt && !mt._heightApproach) {
    const steps = action._towardPath;
    const dest = steps[steps.length - 1];
    const ts = CONFIG.tileSize || BASE_TILE;
    const _isAir = typeof canFly === 'function' && canFly(actingUnit)
      && typeof isUnitAirborne === 'function' && isUnitAirborne(actingUnit);
    const _stepY = (s) => {
      if (_isAir && typeof getHeightAt === 'function') {
        // Airborne flyers keep their clearance over the terrain below.
        const curGnd = getHeightAt(actingUnit.x, actingUnit.y);
        const clearance = (actingUnit.z || 0) - curGnd;
        const sz = getHeightAt(s.x, s.y) + clearance;
        const elev = (typeof window._getElevationPx === 'function') ? window._getElevationPx(sz) : sz * ts;
        return Math.max(ts * 0.04, elev);
      }
      return ThreeRenderer.tileTopY(s.x, s.y);
    };
    const wps = [{ x: actingUnit.x, y: actingUnit.y, yOverride: actingY }];
    for (const s of steps) wps.push({ x: s.x, y: s.y, yOverride: _stepY(s) });
    const routeColor = 0x3399ff; // movement = blue
    ThreeRenderer.drawPathArrow3D(wps, routeColor);
    // Intermediate tiles faint, the ACTUAL destination bright.
    ThreeRenderer.setOverlay('movePreview',
      steps.map((s, i) => ({ x: s.x, y: s.y, color: routeColor, opacity: i === steps.length - 1 ? 0.6 : 0.25 })),
      routeColor, 0.45);
    ThreeRenderer.showGhostUnit(actingUnit, dest.x, dest.y, _stepY(dest), { tag: 'caster', color: ghostTint, opacity: 0.85 });
    ThreeRenderer.setOverlay('actionPlanTarget', [{ x: tx, y: ty, color: 0xff3333, opacity: 0.4 }], 0xff3333, 0.4);
    return;
  }

  // A height approach (take off / land / raise) casts from the caster's own tile,
  // so there's no walk arrow to draw — fall through to the direct caster→target arrow.
  if (mt && !mt._heightApproach) {

    let destY;
    if (typeof canFly === 'function' && canFly(actingUnit) &&
        typeof isUnitAirborne === 'function' && isUnitAirborne(actingUnit)) {

      const ts = CONFIG.tileSize || BASE_TILE;
      const curGnd = typeof getHeightAt === 'function' ? getHeightAt(actingUnit.x, actingUnit.y) : 0;
      const clearance = (actingUnit.z || 0) - curGnd;
      const destGnd = typeof getHeightAt === 'function' ? getHeightAt(mt.x, mt.y) : 0;
      const destZ = destGnd + clearance;
      const destElev = (typeof window._getElevationPx === 'function')
        ? window._getElevationPx(destZ) : destZ * ts;
      destY = Math.max(ts * 0.04, destElev);
    } else {
      destY = ThreeRenderer.tileTopY(mt.x, mt.y);
    }
    castX = mt.x; castY = mt.y;

    // One continuous bending walk-route arrow through any waypoint, plus tile
    // markers so the destination reads even head-on.
    const routeColor = 0x3399ff; // movement = blue (walk and jump legs alike)
    if (mt.via) {
      const viaY = ThreeRenderer.tileTopY(mt.via.x, mt.via.y);
      ThreeRenderer.drawPathArrow3D([
        { x: actingUnit.x, y: actingUnit.y, yOverride: actingY },
        { x: mt.via.x, y: mt.via.y, yOverride: viaY },
        { x: mt.x, y: mt.y, yOverride: destY },
      ], routeColor);

      ThreeRenderer.setOverlay('movePreview', [
        { x: mt.via.x, y: mt.via.y, color: routeColor, opacity: 0.3 },
        { x: mt.x, y: mt.y, color: routeColor, opacity: 0.45 },
      ], routeColor, 0.45);
    } else {
      ThreeRenderer.drawPathArrow3D([
        { x: actingUnit.x, y: actingUnit.y, yOverride: actingY },
        { x: mt.x, y: mt.y, yOverride: destY },
      ], routeColor);

      ThreeRenderer.setOverlay('movePreview', [{ x: mt.x, y: mt.y, color: routeColor, opacity: 0.45 }], routeColor, 0.45);
    }

    // Hologram of the caster standing where it will end up.
    ThreeRenderer.showGhostUnit(actingUnit, mt.x, mt.y, destY, { tag: 'caster', color: ghostTint, opacity: 0.85 });

    // Arced strike arrow lobbing from the move destination onto the target.
    ThreeRenderer.drawArrow3D(mt.x, mt.y, tx, ty, arrowColor, false, destY, targetY, { arc: 0.35, flow: true });
  } else {

    // Arced strike arrow straight from the unit's current tile onto the target.
    ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, tx, ty, arrowColor, false, actingY, targetY, { arc: 0.35, flow: true });
  }

  // Quiet reach field under the loud target/AoE layer (red damage / green
  // support / white utility), measured from the actual cast tile.
  _showQuickActionRange(actingUnit, castX, castY, action);

  ThreeRenderer.setOverlay('actionPlanTarget', [{ x: tx, y: ty, color: 0xff3333, opacity: 0.4 }], 0xff3333, 0.4);

  if (action && action.spell && typeof getSpellAoeFootprint === 'function') {
    const sp = action.spell;
    const hasAoe = sp.aoeRadius || sp.crossRadius || sp.kind === 'cross' || sp.kind === 'aoe'
                 || sp.kind === 'barrage' || sp.kind === 'aoePull' || sp.kind === 'aoePush';
    if (hasAoe) {
      const aoeTiles = getSpellAoeFootprint(sp, tx, ty, actingUnit);
      if (aoeTiles && aoeTiles.length > 0) {
        const overlayTiles = aoeTiles.map(t => ({
          x: t.x, y: t.y,
          color: (t.x === tx && t.y === ty) ? 0xff4444 : 0xcc2222,
          opacity: (t.x === tx && t.y === ty) ? 0.5 : 0.35,
        }));
        ThreeRenderer.setOverlay('actionPlanAoe', overlayTiles, 0xff3333, 0.35);
      }
    }
  }

  // Displacement preview: show a ghost of the target where it will be shoved,
  // with a bent arrow tracing the knockback/pull — so the player sees exactly
  // what the spell will DO in this scenario, not just where it aims.
  if (action && action.spell) {
    const shove = _predictTargetShove(action.spell, targetUnit, castX, castY);
    if (shove) {
      // Arrow palette: purple = target being force-moved (push AND pull).
      const shoveColor = 0xbb66ff;
      const shY = ThreeRenderer.tileTopY(shove.x, shove.y);
      ThreeRenderer.showGhostUnit(targetUnit, shove.x, shove.y, shY, { tag: 'target', color: shoveColor, opacity: 0.8 });
      ThreeRenderer.drawArrow3D(tx, ty, shove.x, shove.y, shoveColor, false, targetY, shY,
        { arc: shove.mode === 'pull' ? 0.18 : 0.3, flow: true });
      ThreeRenderer.setOverlay('actionPlanShove', [{ x: shove.x, y: shove.y, color: shoveColor, opacity: 0.4 }], shoveColor, 0.4);
    }
  }
}

// Execute one quick-menu action against the clicked enemy — including the
// one-click move/jump/take-off + strike combos. Ported verbatim from the old
// EnemyActionMenu card click handler.
// ── "Move Towards" chase chain ─────────────────────────────────────────────
// One click on Move Towards should spend the unit's WHOLE remaining movement
// closing the distance (walk, walk again, jump — it's all movement), not a
// single ring-1 step that strands the player back in the menus.
function _bestTowardStep(actingUnit, targetUnit) {
  // FLAT (2D Manhattan) progress metric, matching the Move Towards blade: 3D
  // combatDist folded the elevation gap into the score, which starved the
  // chase chain of "closer" tiles on hilly maps (the 1-tile-shuffle bug).
  // Ties prefer landing nearer the target's elevation.
  const tz = targetUnit.z ?? 0;
  const flat = (fx, fy) => Math.abs(fx - targetUnit.x) + Math.abs(fy - targetUnit.y);
  const zGap = (fz) => Math.abs((fz ?? 0) - tz);
  let best = null;
  let bestD = flat(actingUnit.x, actingUnit.y);
  let bestZ = zGap(actingUnit.z);
  if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function' && canUnitMove(actingUnit)) {
    for (const t of getMoveTiles(actingUnit)) {
      if (t._takeoff) continue;
      if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
      const d = flat(t.x, t.y);
      const zg = zGap(t.z);
      if (d < bestD || (d === bestD && best && zg < bestZ)) { best = { x: t.x, y: t.y, z: t.z }; bestD = d; bestZ = zg; }
    }
  }
  if (typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
    for (const t of getJumpTiles(actingUnit)) {
      if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
      const d = flat(t.x, t.y);
      if (d < bestD) { best = { x: t.x, y: t.y, z: t.z, _jump: true }; bestD = d; bestZ = zGap(t.z); }
    }
  }
  return best;
}

// Dry-run the whole Move Towards chase chain (first step included) and return
// the list of steps the unit would actually take, so the menu/hover preview
// can show the REAL end tile instead of just the first step. Mirrors
// _chainMoveTowards: keep stepping/leaping while AP, moves and distance allow.
// The unit is mutated only inside the try and always restored — pure preview.
function _predictMoveTowardsPath(actingUnit, targetUnit, firstStep) {
  const saved = {
    x: actingUnit.x, y: actingUnit.y, z: actingUnit.z,
    moves: actingUnit.movesThisTurn, ap: actingUnit.ap,
    jumped: actingUnit._jumpedThisTurn,
  };
  const apCost = (window.GAME && window.GAME.AP_COST_ACTION) || 1;
  const steps = [];
  const _apply = (step) => {
    steps.push(step);
    actingUnit.x = step.x; actingUnit.y = step.y;
    if (step.z !== undefined && step.z !== null) actingUnit.z = step.z;
    if (step._jump) {
      actingUnit._jumpedThisTurn = true;
      actingUnit.ap = Math.max(0, (actingUnit.ap || 0) - apCost);
    } else {
      actingUnit.movesThisTurn = (actingUnit.movesThisTurn || 0) + 1;
      // Mirror finishMoveAt: the second move of a turn drains ALL remaining AP
      const maxMoves = (window.GAME && window.GAME.UNIT_MAX_MOVES) || 2;
      if ((actingUnit.movesThisTurn || 0) >= maxMoves) actingUnit.ap = 0;
      else actingUnit.ap = Math.max(0, (actingUnit.ap || 0) - apCost);
    }
  };
  try {
    if (firstStep) _apply(firstStep);
    let guard = 12;
    while (guard-- > 0) {
      if ((actingUnit.ap || 0) < 1) break;
      const dist = Math.abs(actingUnit.x - targetUnit.x) + Math.abs(actingUnit.y - targetUnit.y);
      if (dist <= 1) break;
      const step = _bestTowardStep(actingUnit, targetUnit);
      if (!step) break;
      // The real chain's doJump refuses a second leap — stop where it would.
      if (step._jump && actingUnit._jumpedThisTurn) break;
      _apply(step);
    }
  } catch (e) { /* preview is cosmetic — never let it break the menu */ }
  finally {
    actingUnit.x = saved.x; actingUnit.y = saved.y; actingUnit.z = saved.z;
    actingUnit.movesThisTurn = saved.moves; actingUnit.ap = saved.ap;
    actingUnit._jumpedThisTurn = saved.jumped;
  }
  return steps;
}

function _chainMoveTowards(actingUnit, targetUnit) {
  const _finish = () => {
    state._enemyActionTargetId = null;
    state.pendingTarget = null;
    if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
    if (typeof renderIfDirty === 'function') renderIfDirty();
    if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
  };
  if (!actingUnit || actingUnit.dead || !targetUnit || targetUnit.dead) return _finish();
  if ((actingUnit.ap || 0) < 1) return _finish();
  const dist = Math.abs(actingUnit.x - targetUnit.x) + Math.abs(actingUnit.y - targetUnit.y);
  if (dist <= 1) return _finish();
  const step = _bestTowardStep(actingUnit, targetUnit);
  if (!step) return _finish();
  if (step._jump) {
    const jr = typeof doJump === 'function' ? doJump(actingUnit, step.x, step.y, step.z) : false;
    if (jr === false) return _finish();
    // doJump's post-jump settle runs at ~650ms; chain just after it.
    setTimeout(() => _chainMoveTowards(actingUnit, targetUnit), 700);
  } else {
    const mr = typeof doMove === 'function' ? doMove(actingUnit, step.x, step.y, step.z) : false;
    if (mr === false) return _finish();
    const delay = typeof mr === 'number' ? mr : 450;
    setTimeout(() => _chainMoveTowards(actingUnit, targetUnit), delay + 60);
  }
}

function _fireEnemyAction(actingUnit, targetUnit, a) {
  if (!a.available) return;
  hideSpellTooltip();
  _clearMoveArrowPreview();
  // Sweep every lingering targeting visual (range overlays from blade hover,
  // AoE preview, terrain ghost, arrows) the moment the quick-cast fires —
  // doSpell/doAttack sweep again post-validation, but the walk of a
  // move-then-cast happens BEFORE those run.
  if (typeof clearAllTargetingVisuals === 'function') clearAllTargetingVisuals();
  // Quick-cast fires (or walks-then-fires) immediately — drop the menus
  // in this same tick so the click visibly registered.
  if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(550);
  const isMove = !!a.moveTile;

  const _executeAction = (actionId, spell, tx, ty, tz) => {
    // "Move Towards" is pure movement — the FIRST step already happened in the
    // moveTile branch below. Keep chasing: chain further walk/jump steps until
    // the unit's movement is spent or it's adjacent to the target.
    if (actionId === 'moveTowards') {
      _chainMoveTowards(actingUnit, targetUnit);
      return;
    }

    const target = tz != null
      ? (state.units || []).find(u => !u.dead && u.x === tx && u.y === ty && u.z === tz)
      : (state.units || []).find(u => !u.dead && u.x === tx && u.y === ty);
    if (!target && actionId !== 'combo') {
      if (typeof addLog === 'function') addLog('Target is no longer there.');
      state._actionExecuting = false;
      state.actionMode = null;
      state.selectedTool = null;
      if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
      if (typeof renderIfDirty === 'function') renderIfDirty();
      return;
    }
    state._actionExecuting = true;
    // Funnel every engine call through _execAction (battle.js): it clears the
    // executing latch when the action rejects synchronously and arms the 8 s
    // stuck-input watchdog when it commits — a bare doSpell/doAttack that
    // early-returned here used to wedge ALL input with no recovery.
    const _run = (fn) => (typeof _execAction === 'function') ? _execAction(fn) : fn();
    if (actionId === 'attack') {
      if (typeof doAttack === 'function') {
        const _atkQr = _run(() => doAttack(actingUnit, tx, ty, tz));
        // "Attack ×N" row → pre-load the repeat queue with the remaining
        // swings (drained back-to-back by endUnitIfDone, each re-validated).
        // Armed only when the first swing actually fired.
        if (a.repeat > 1 && _atkQr !== 0 && _atkQr !== false) {
          state._repeatQueue = { unitId: actingUnit.id, mode: 'attack', tool: null,
            x: tx, y: ty, z: tz, queued: a.repeat - 1 };
        }
      }
    } else if (actionId === 'grappleAttack' && spell) {
      // Fire the grapple to reel the target into melee, then swing once the
      // reel settles. `target` is the live unit object, so its x/y reflect
      // the post-pull tile by the time the strike fires.
      state.selectedTool = spell.name;
      state.actionMode = 'spell';
      const _combTarget = target;
      let _grCd = 0;
      if (typeof doSpell === 'function') _grCd = _run(() => doSpell(actingUnit, tx, ty, tz)) || 0;
      if (_grCd) {
        window.setTimeout(() => {
          if (!_combTarget || _combTarget.dead) return;
          if (typeof doAttack === 'function') doAttack(actingUnit, _combTarget.x, _combTarget.y, _combTarget.z);
        }, _grCd + 140);
      }
    } else if (actionId.startsWith('spell:') && spell) {

      state.selectedTool = spell.name;
      state.actionMode = 'spell';
      // Self-centered casts (barrage novae like Meow, auras, self-buffs)
      // originate ON the caster — the clicked enemy is only how the player
      // picked the spell, not where it's aimed. Cast on our own tile (after
      // any move-into-range above) so the engine's caster-range gate, which
      // measures distance to the *target* tile, doesn't reject a range-0
      // nova as "out of range" — exactly as the spellbook flow does when
      // you click your own tile.
      const _selfCast = typeof isSpellSelfCast === 'function' && isSpellSelfCast(spell);
      if (typeof doSpell === 'function') {
        if (_selfCast) _run(() => doSpell(actingUnit, actingUnit.x, actingUnit.y, actingUnit.z));
        else _run(() => doSpell(actingUnit, tx, ty, tz));
      }
    } else if (actionId.startsWith('item:')) {

      const _itemKey = actionId.substring(5);
      state.selectedTool = _itemKey;
      state.actionMode = 'item';
      if (typeof doItem === 'function') _run(() => doItem(actingUnit, tx, ty, tz));
    } else if (actionId === 'combo') {
      if (typeof setActionMode === 'function') setActionMode('combo');

      // Fire with a partner whose combo actually REACHES the clicked tile —
      // partners[0] could hold a shorter-range combo than the one the row's
      // availability check found, and doComboAttack validates the initiator's
      // distance against that specific combo's range.
      const partners = typeof getComboPartners === 'function' ? getComboPartners(actingUnit) : [];
      const _gg = window.GAME;
      const _cDist = (_gg && typeof _gg.combatDist === 'function')
        ? _gg.combatDist(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, tx, ty, tz ?? 0)
        : Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);
      let _cbPick = null;
      for (const p of partners) {
        const pCombo = typeof getComboForUnits === 'function' ? getComboForUnits(actingUnit, p) : null;
        if (!pCombo || !['damage', 'multiHit', 'aoe'].includes(pCombo.kind)) continue;
        if (_cDist >= 1 && _cDist <= (pCombo.range || 3)) { _cbPick = p; break; }
      }
      if (!_cbPick && partners.length > 0) _cbPick = partners[0];
      if (_cbPick) {
        state.comboPartner = _cbPick;
        if (typeof doComboAttack === 'function') _run(() => doComboAttack(actingUnit, _cbPick, tx, ty, tz));
      }
    }

    state._enemyActionTargetId = null;
    state.pendingTarget = null;
    if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
    if (typeof renderIfDirty === 'function') renderIfDirty();
    if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
  };

  state._enemyActionTargetId = null;

  if (isMove) {

    const mt = a.moveTile;
    const _pendingActionId = a.id;
    const _pendingSpell = a.spell || null;
    const _targetX = targetUnit.x, _targetY = targetUnit.y, _targetZ = targetUnit.z;

    if (mt._jump) {
      // Jump-then-cast (e.g. leap up to get above the target, then leap-strike).
      const jumpResult = typeof doJump === 'function' ? doJump(actingUnit, mt.x, mt.y, mt.z) : false;
      if (jumpResult === false) {
        if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(actingUnit, 'Blocked!', 'status', { color: '#ff4444' });
        state._actionExecuting = false;
        state.actionMode = null;
        state.selectedTool = null;
        if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
        if (typeof renderIfDirty === 'function') renderIfDirty();
        return;
      }
      // doJump returns true (not a duration); wait for the jump arc (~650ms) to land.
      setTimeout(() => {
        _executeAction(_pendingActionId, _pendingSpell, _targetX, _targetY, _targetZ);
      }, 680);
    } else if (mt._heightApproach) {
      // Take off / land (flyers) or raise the ground underfoot (non-flyers) in
      // place, then cast — mirrors the engine's _moveThenCast height branch.
      let hr;
      if (mt._heightApproach === 'raise') {
        hr = typeof doReshape === 'function' ? doReshape(actingUnit, 'raise') : 0;
      } else {
        hr = typeof doAltitudeChange === 'function'
          ? doAltitudeChange(actingUnit, mt._heightApproach === 'takeoff' ? 'ascend' : 'descend') : 0;
      }
      if (hr === 0 || hr === false) {
        if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(actingUnit, 'Blocked!', 'status', { color: '#ff4444' });
        state._actionExecuting = false;
        state.actionMode = null;
        state.selectedTool = null;
        if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
        if (typeof renderIfDirty === 'function') renderIfDirty();
        return;
      }
      setTimeout(() => {
        _executeAction(_pendingActionId, _pendingSpell, _targetX, _targetY, _targetZ);
      }, 560);
    } else if (mt.via) {

      const moveResult1 = typeof doMove === 'function' ? doMove(actingUnit, mt.via.x, mt.via.y, mt.via.z) : false;
      if (moveResult1 === false) {
        if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(actingUnit, 'Blocked!', 'status', { color: '#ff4444' });
        state._actionExecuting = false;
        state.actionMode = null;
        state.selectedTool = null;
        if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
        if (typeof renderIfDirty === 'function') renderIfDirty();
        return;
      }
      const walkDelay1 = typeof moveResult1 === 'number' ? moveResult1 : 450;
      setTimeout(() => {
        const moveResult2 = typeof doMove === 'function' ? doMove(actingUnit, mt.x, mt.y, mt.z) : false;
        if (moveResult2 === false) {
          if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(actingUnit, 'Blocked!', 'status', { color: '#ff4444' });
          state._actionExecuting = false;
          state.actionMode = null;
          state.selectedTool = null;
          if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
          if (typeof renderIfDirty === 'function') renderIfDirty();
          return;
        }
        const walkDelay2 = typeof moveResult2 === 'number' ? moveResult2 : 450;
        setTimeout(() => {
          _executeAction(_pendingActionId, _pendingSpell, _targetX, _targetY, _targetZ);
        }, walkDelay2);
      }, walkDelay1);
    } else {

      const moveResult = typeof doMove === 'function' ? doMove(actingUnit, mt.x, mt.y, mt.z) : false;
      if (moveResult === false) {
        if (typeof showFloatingTextForUnit === 'function') showFloatingTextForUnit(actingUnit, 'Blocked!', 'status', { color: '#ff4444' });
        state._actionExecuting = false;
        state.actionMode = null;
        state.selectedTool = null;
        if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
        if (typeof renderIfDirty === 'function') renderIfDirty();
        return;
      }

      const walkDelay = typeof moveResult === 'number' ? moveResult : 450;
      setTimeout(() => {
        _executeAction(_pendingActionId, _pendingSpell, _targetX, _targetY, _targetZ);
      }, walkDelay);
    }
  } else {

    _executeAction(a.id, a.spell || null, targetUnit.x, targetUnit.y, targetUnit.z);
  }
}

// The clicked enemy's whole playbook as drum blades: live damage estimate,
// costs, one-click move+strike combos, unavailability reasons. The view tab
// carries the target's sprite / name / HP so you always know who you're
// lining up against.
function _hrlgEnemyBlades(actingUnit, st) {
  const targetUnit = (st.units || []).find(u => u.id === st._enemyActionTargetId && !u.dead);
  if (!targetUnit) return { title: null, blades: [] };
  const actions = _computeEnemyActions(actingUnit, targetUnit);
  const dist = Math.abs(actingUnit.x - targetUnit.x) + Math.abs(actingUnit.y - targetUnit.y);
  const targetName = typeof unitDisplayName === 'function' ? unitDisplayName(targetUnit) : (targetUnit.name || targetUnit.cls);

  const blades = actions.map((a, i) => {
    const isMove = !!a.moveTile;
    const _mvVerb = isMove
      ? (a.moveTile._heightApproach === 'takeoff' ? 'TAKE OFF'
        : a.moveTile._heightApproach === 'land' ? 'LAND'
        : a.moveTile._heightApproach === 'raise' ? 'RAISE'
        : a.moveTile._jump ? 'JUMP' : 'MOVE')
      : null;

    let power = null;
    if (a.preview && a.preview.min != null && a.preview.max != null) power = { v: a.preview.min + '–' + a.preview.max, color: '#ee6655' };
    else if (a.preview && a.preview.amount) power = { v: '~' + a.preview.amount, color: '#ee6655' };
    else if (a.powerLabel) power = { v: a.powerLabel, color: '#ee6655' };

    let typeAdv = '';
    if (a.typeNote) {
      const _tn = a.typeNote.toLowerCase();
      if (_tn.includes('strong') || _tn.includes('super effective')) typeAdv = '▲';
      else if (_tn.includes('weak') || _tn.includes('not very')) typeAdv = '▼';
    }

    return {
      id: 'ea:' + a.id + ':' + i,
      icon: a.icon, label: a.label,
      available: a.available,
      spell: a.spell || null,
      catColor: a.spell ? (_HRLG_CAT[typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage'] || _HRLG_CAT.damage).color : undefined,
      badges: a.spell ? _hrlgSpellBadges(a.spell, typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage', true) : undefined,
      power: power,
      mp: a.mpCost || null,
      cost: a.available ? a.apCost : null,
      superEff: typeAdv === '▲',
      meta: typeAdv === '▼' ? { text: '▼', color: EW.bad } : null,
      note: isMove
        ? (a.id === 'moveTowards'
          // "Move Towards" chains the whole approach — name the tile the
          // unit will actually stop on so the click is never a surprise.
          ? (a._towardPath && a._towardPath.length
            ? '↳ ' + (typeof coordLabel === 'function'
                ? coordLabel(a._towardPath[a._towardPath.length - 1].x, a._towardPath[a._towardPath.length - 1].y)
                : a._towardPath[a._towardPath.length - 1].x + ',' + a._towardPath[a._towardPath.length - 1].y)
            : null)
          : '↳ ' + _mvVerb)
        : null,
      sub: !a.available ? (a.reason || 'Unavailable') : null,
      fire: () => _fireEnemyAction(actingUnit, targetUnit, a),
      hoverIn: (e) => { if (a.spell) showSpellTooltip(a.spell, e); if (a.available) _showMoveArrowPreview(actingUnit, targetUnit, a.moveTile, a); },
      hoverOut: () => { hideSpellTooltip(); _clearMoveArrowPreview(); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '⚔', label: 'No actions available', available: false });

  // The clicked enemy's face rides the view tab — instant "who am I on".
  // The ⓘ INFO button next to the name opens their full stat card
  // (DEF/MDEF/INT + attack reach) — judge physical-vs-magic before committing.
  const tabPort = _hrlgPortraitData(targetUnit, actingUnit);
  const title = { node: h(React.Fragment, null,
    tabPort
      ? h('span', {
          className: 'hrlg-tport enemy' + (tabPort.isFace ? '' : ' sprite'),
          style: { width: 34, height: 34, backgroundImage: 'url("' + tabPort.url + '")' },
        })
      : h('span', { className: 'hrlg-view-tab-icon', style: { color: EW.bad } }, '⌖'),
    h('span', { className: 'hrlg-view-tab-text' }, targetName),
    /* the old ⓘ stat-card button is gone — the target's full stat
       readout now rides this same header blade (_hrlgQuickStats) */
    h('span', { className: 'hrlg-view-tab-count' }, dist + 't'),
  ) };
  return { title, blades };
}

/* ── ALLY QUICK-CAST ─────────────────────────────────────────────────
   The clicked ally's support playbook: every heal / buff / shield /
   cleanse the acting unit can land on them (move-then-cast included,
   through the same engine approach finder the enemy menu uses), the
   bag's potions used ON them, Trade when adjacent, Move Towards to
   regroup. Everything fires through the same _fireEnemyAction funnel
   as the enemy quick menu, so walk→cast chains, validation and online
   relay behave identically. */
function _computeAllyActions(actingUnit, targetUnit) {
  if (!actingUnit || !targetUnit || targetUnit.dead) return [];
  const actions = [];
  const G = window.GAME;
  if (!G) return actions;

  const tx = targetUnit.x, ty = targetUnit.y;
  const unitAP = actingUnit.ap || 0;
  const dist = (typeof G.combatDist === 'function')
    ? G.combatDist(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, tx, ty, targetUnit.z ?? 0)
    : Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);

  // Caster-origin team casts: no aiming — the engine casts them on the
  // caster's own tile and they wash over every ally, the clicked one included.
  const _teamKinds = new Set(['healAll', 'manaRestoreAll', 'warCry']);
  // Unit-target support kinds, aimed AT the ally.
  const _allyKinds = new Set(['heal', 'shield', 'buff', 'cleanse', 'encore',
    'zoneHeal', 'seedHeal', 'aoeShield', 'guard', 'swap', 'rallyPull']);

  const allSpells = [...(actingUnit.spells || []), ...(actingUnit._raceAbilities || [])].filter(Boolean);
  for (const sp of allSpells) {
    const cls = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
    const _tt = typeof spellTileTeam === 'function' ? spellTileTeam(sp) : 'both';
    const isTeamCast = _teamKinds.has(sp.kind);
    const isAllySpell = isTeamCast || _allyKinds.has(sp.kind)
      || ((cls === 'heal' || cls === 'buff') && _tt !== 'enemy');
    if (!isAllySpell || _tt === 'enemy') continue;
    // Self-only casts can't be aimed at someone else; revives need remains.
    if (sp.kind === 'selfHeal' || sp.kind === 'revive' || sp.kind === 'raiseDead') continue;
    if (!isTeamCast && typeof isSpellSelfCast === 'function' && isSpellSelfCast(sp)) continue;
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;
    if (!tierOk) continue;   // level-locked — not quick-cast material

    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
    const mpCost = (typeof getSpellMpCostFor === 'function')
      ? getSpellMpCostFor(actingUnit, sp)
      : (sp.cost || 0) + (typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0);
    const canAfford = unitAP >= spellApCost && (actingUnit.mp || 0) >= mpCost
      && !(typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence'))
      && (typeof canAffordSpell !== 'function' || canAffordSpell(actingUnit, sp));

    const healAmt = sp.heal || sp.healAmt || 0;
    const isHealish = cls === 'heal' || !!healAmt;
    const fullHp = (targetUnit.hp || 0) >= (targetUnit.maxHp || 0);

    // Castable on THIS ally from where we stand? The engine's own
    // valid-target list is authoritative (range, LOS, full-HP heal
    // filtering, already-applied statuses…).
    let validHere;
    if (isTeamCast) {
      validHere = sp.kind === 'healAll' ? !fullHp
        : sp.kind === 'manaRestoreAll' ? ((targetUnit.maxMp || 0) > 0 && (targetUnit.mp || 0) < targetUnit.maxMp)
        : true;
    } else {
      validHere = typeof _getSpellValidTargets === 'function'
        && _getSpellValidTargets(actingUnit, sp)
          .some(t => (t.unit && t.unit.id === targetUnit.id) || (t.x === tx && t.y === ty));
    }

    let reason = '';
    let moveTile = null;
    if (!canAfford) {
      reason = (typeof getSpellBlockReason === 'function' && getSpellBlockReason(actingUnit, sp))
        || ((actingUnit.mp || 0) < mpCost ? 'No MP' : unitAP < spellApCost ? 'No AP' : 'Unavailable');
    } else if (!validHere) {
      if (isHealish && fullHp) reason = 'Full HP';
      else if (isTeamCast) reason = 'No effect';
      else {
        // Same authoritative walk/jump/take-off approach finder the enemy
        // quick menu uses → one-click MOVE→CAST onto the ally.
        moveTile = (typeof findSpellApproachTile === 'function')
          ? findSpellApproachTile(actingUnit, sp, tx, ty, targetUnit.z) : null;
        if (moveTile && (unitAP - (moveTile.moveCost || 1)) < spellApCost) moveTile = null;
        if (!moveTile) reason = 'Out of range';
      }
    }

    actions.push({
      id: 'spell:' + sp.name,
      label: sp.name,
      icon: (typeof _HRLG_CAT !== 'undefined' && _HRLG_CAT[cls]) ? _HRLG_CAT[cls].icon : '✦',
      spellType: sp.spellType || '',
      apCost: spellApCost,
      mpCost: mpCost,
      moveTile: validHere ? null : moveTile,
      preview: healAmt ? { type: 'heal', amount: healAmt } : null,
      powerLabel: typeof getSpellPowerLabel === 'function' ? getSpellPowerLabel(sp) : '',
      typeNote: '',
      available: !!(canAfford && (validHere || moveTile)),
      reason: reason || null,
      spell: sp,
      _teamCast: isTeamCast,
    });
  }

  // Potions from the bag, used ON the ally — the same doItem the Items menu
  // fires (potions reach any living ally, mirroring _hrlgItemTargetBlades).
  if (typeof ITEM_RULES !== 'undefined' && actingUnit.items) {
    const itemApCost = G.AP_COST_ACTION || 1;
    const _pushPotion = (key, usable, why) => {
      if ((actingUnit.items[key] || 0) <= 0) return;
      const rule = ITEM_RULES[key] || {};
      const ok = usable && unitAP >= itemApCost;
      actions.push({
        id: 'item:' + key,
        label: rule.name || key,
        icon: rule.icon || '❖',
        apCost: itemApCost,
        moveTile: null,
        preview: null,
        typeNote: '',
        available: ok,
        reason: ok ? null : (!usable ? why : 'No AP'),
        itemKey: key,
        _count: actingUnit.items[key] || 0,
      });
    };
    _pushPotion('healPotion', (targetUnit.hp || 0) < (targetUnit.maxHp || 0), 'Full HP');
    _pushPotion('manaPotion',
      (targetUnit.maxMp || 0) > 0 && (targetUnit.mp || 0) < targetUnit.maxMp,
      (targetUnit.maxMp || 0) > 0 ? 'Full MP' : 'No MP pool');
  }

  // Trade — hand items across when adjacent (opens the trade dialog, free).
  if (typeof canTradeWithUnit === 'function' && typeof doTrade === 'function') {
    const adj = canTradeWithUnit(actingUnit, targetUnit);
    actions.push({
      id: 'trade', label: 'Trade', icon: '🔄',
      apCost: 0, moveTile: null, preview: null, typeNote: '',
      available: !!adj,
      reason: adj ? null : 'Not adjacent',
    });
  }

  // Move Towards — close the distance to regroup / carry the healer in.
  if (unitAP >= 1 && dist > 1) {
    const movesLeft = (typeof G.UNIT_MAX_MOVES !== 'undefined' ? G.UNIT_MAX_MOVES : 2) - (actingUnit.movesThisTurn || 0);
    const _flatD = (fx, fy) => Math.abs(fx - tx) + Math.abs(fy - ty);
    let towardTile = null;
    let towardDist = _flatD(actingUnit.x, actingUnit.y);
    let towardLabel = 'Move Towards', towardIcon = '➜';
    if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function'
        && canUnitMove(actingUnit) && movesLeft > 0) {
      for (const t of getMoveTiles(actingUnit)) {
        if (t._takeoff) continue;   // altitude changes cost extra AP — plain steps only
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const d = _flatD(t.x, t.y);
        if (d < towardDist) { towardTile = { moveCost: 1, x: t.x, y: t.y, z: t.z }; towardDist = d; }
      }
    }
    if (typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
      for (const t of getJumpTiles(actingUnit)) {
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const d = _flatD(t.x, t.y);
        if (d < towardDist) {
          towardTile = { moveCost: 1, x: t.x, y: t.y, z: t.z, _jump: true };
          towardDist = d; towardLabel = 'Jump Towards'; towardIcon = '↷';
        }
      }
    }
    if (towardTile) {
      const towardPath = _predictMoveTowardsPath(actingUnit, targetUnit, towardTile);
      actions.push({
        id: 'moveTowards', label: towardLabel, icon: towardIcon,
        apCost: 1, moveTile: towardTile,
        _towardPath: towardPath && towardPath.length ? towardPath : null,
        preview: null, typeNote: '', available: true,
      });
    }
  }

  actions.sort((a, b) => {
    // Usable rows lead; heals before buffs/utility, then potions, then the
    // togglers (trade / move towards) — the "patch them up" verbs on top.
    const availA = a.available ? 0 : 1, availB = b.available ? 0 : 1;
    if (availA !== availB) return availA - availB;
    const rank = (x) => x.id.startsWith('spell:')
      ? ((x.spell && (typeof classifySpell === 'function' ? classifySpell(x.spell) : x.spell.type) === 'heal') ? 0 : 1)
      : x.id.startsWith('item:') ? 2 : x.id === 'trade' ? 3 : 4;
    return rank(a) - rank(b);
  });
  return actions;
}

// The clicked ALLY's support playbook as drum blades — same layout as the
// enemy quick menu, healer-green: heal amounts, MP/AP costs, one-click
// move+cast approaches, unavailability reasons, and the ally's face + HP
// (and MP) riding the view tab.
function _hrlgAllyBlades(actingUnit, st) {
  const targetUnit = (st.units || []).find(u => u.id === st._enemyActionTargetId && !u.dead);
  if (!targetUnit) return { title: null, blades: [] };
  const actions = _computeAllyActions(actingUnit, targetUnit);
  const dist = Math.abs(actingUnit.x - targetUnit.x) + Math.abs(actingUnit.y - targetUnit.y);
  const targetName = typeof unitDisplayName === 'function' ? unitDisplayName(targetUnit) : (targetUnit.name || targetUnit.cls);

  const blades = actions.map((a, i) => {
    const isMove = !!a.moveTile;
    const cls = a.spell ? (typeof classifySpell === 'function' ? classifySpell(a.spell) : 'heal') : null;
    const cc = cls ? (_HRLG_CAT[cls] || _HRLG_CAT.heal) : null;
    let power = null;
    if (a.preview && a.preview.amount) power = { v: '+' + a.preview.amount, color: '#57d97e' };
    else if (a.powerLabel) power = { v: a.powerLabel, color: '#57d97e' };
    return {
      id: 'aa:' + a.id + ':' + i,
      icon: a.icon,
      iconColor: a.id.startsWith('item:') ? '#57d97e' : undefined,
      label: a.label,
      available: a.available,
      spell: a.spell || null,
      catColor: cc ? cc.color : (a.id === 'item:healPotion' ? '#57d97e' : undefined),
      badges: a.spell ? _hrlgSpellBadges(a.spell, cls, true) : undefined,
      power: power,
      mp: a.mpCost || null,
      cost: a.available && a.apCost ? a.apCost : null,
      count: a._count ? '×' + a._count : null,
      note: isMove
        ? (a.id === 'moveTowards'
          ? (a._towardPath && a._towardPath.length
            ? '↳ ' + (typeof coordLabel === 'function'
                ? coordLabel(a._towardPath[a._towardPath.length - 1].x, a._towardPath[a._towardPath.length - 1].y)
                : a._towardPath[a._towardPath.length - 1].x + ',' + a._towardPath[a._towardPath.length - 1].y)
            : null)
          : '↳ ' + (a.moveTile._jump ? 'JUMP' : 'MOVE'))
        : (a._teamCast ? '↳ ALL ALLIES' : null),
      sub: !a.available ? (a.reason || 'Unavailable') : null,
      fire: () => {
        if (a.id === 'trade') {
          if (!a.available) return;
          hideSpellTooltip();
          if (typeof doTrade === 'function') doTrade(actingUnit, targetUnit.x, targetUnit.y, targetUnit.z);
          state._enemyActionTargetId = null;
          if (typeof markDirty === 'function') { markDirty('hud'); renderIfDirty(); }
          return;
        }
        _fireEnemyAction(actingUnit, targetUnit, a);
      },
      hoverIn: (e) => { if (a.spell) showSpellTooltip(a.spell, e); if (a.available) _showMoveArrowPreview(actingUnit, targetUnit, a.moveTile, a); },
      hoverOut: () => { hideSpellTooltip(); _clearMoveArrowPreview(); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '♥', label: 'Nothing to cast on this ally', available: false });

  // The ally's face rides the view tab, same as the enemy quick menu —
  // vitals + the full stat readout share this header blade below it.
  const tabPort = _hrlgPortraitData(targetUnit, actingUnit);
  const title = { node: h(React.Fragment, null,
    tabPort
      ? h('span', {
          className: 'hrlg-tport ally' + (tabPort.isFace ? '' : ' sprite'),
          style: { width: 34, height: 34, backgroundImage: 'url("' + tabPort.url + '")' },
        })
      : h('span', { className: 'hrlg-view-tab-icon', style: { color: '#57d97e' } }, '♥'),
    h('span', { className: 'hrlg-view-tab-text' }, targetName),
    h('span', { className: 'hrlg-view-tab-count' }, dist + 't'),
  ) };
  return { title, blades };
}

// The clicked tile's actions (move here / cast here / smash / inspect …)
// as drum blades, grouped movement → spells → attack → other with the
// unavailable ones sinking within each group.
function _hrlgTileBlades(actingUnit, st) {
  const target = st._tileActionTarget;
  if (!target) return { title: null, blades: [] };
  const tx = target.x, ty = target.y;
  const actions = _computeTileActions(actingUnit, tx, ty, target.z);
  const dist = Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);

  const terrain = typeof getTerrainAt === 'function' ? getTerrainAt(tx, ty) : 'grass';
  const tRule = typeof getTerrainRule === 'function' ? getTerrainRule(terrain) : { label: terrain };
  const height = typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0;
  const posLabel = typeof coordLabel === 'function' ? coordLabel(tx, ty) : tx + ',' + ty;

  const _availFirst = (a, b) => (a.available ? 0 : 1) - (b.available ? 0 : 1);
  const ordered = [
    ...actions.filter(a => a.category === 'movement').sort(_availFirst),
    ...actions.filter(a => a.category === 'spells').sort(_availFirst),
    ...actions.filter(a => a.category === 'attack').sort(_availFirst),
    ...actions.filter(a => a.category === 'actions' || a.category === 'utility').sort(_availFirst),
  ];

  const blades = ordered.map((a, i) => ({
    id: 'ta:' + a.id + ':' + i,
    icon: a.icon,
    iconColor: a.category === 'attack' ? '#ff5340' : undefined,
    label: a.label,
    available: a.available,
    spell: a.spell || null,
    catColor: a.spell ? (_HRLG_CAT[typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage'] || _HRLG_CAT.damage).color : undefined,
    badges: a.spell ? _hrlgSpellBadges(a.spell, typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage', true) : undefined,
    mp: a.mpCost || null,
    cost: a.available && a.apCost ? a.apCost : null,
    sub: !a.available ? (a.reason || 'Unavailable') : null,
    fire: () => {
      hideSpellTooltip();
      if (a.id === 'moveTowards') _clearMoveArrowPreview();
      if (a.available && a.handler) a.handler();
    },
    hoverIn: (e) => {
      if (a.spell) showSpellTooltip(a.spell, e);
      if (a.id === 'moveTowards' && a.available) _showTileMoveTowardsPreview(actingUnit, a);
    },
    hoverOut: () => {
      hideSpellTooltip();
      if (a.id === 'moveTowards') _clearMoveArrowPreview();
    },
  }));
  if (!blades.length) blades.push({ id: 'none', icon: '⬚', label: 'Nothing to do here', available: false });

  const title = { node: h(React.Fragment, null,
    h('span', { className: 'hrlg-view-tab-icon' }, '⬚'),
    h('span', { className: 'hrlg-view-tab-text' }, tRule.label || terrain),
    h('span', { className: 'hrlg-view-tab-count' }, posLabel + (height > 0 ? ' · h' + height : '') + ' · ' + dist + 't'),
  ) };
  return { title, blades };
}


function _computeTileActions(actingUnit, tx, ty, tz) {
  if (!actingUnit || actingUnit.dead) return [];
  const actions = [];
  const G = window.GAME;
  if (!G) return actions;

  const unitAP = actingUnit.ap || 0;
  const onSelf = tx === actingUnit.x && ty === actingUnit.y;
  // 3D distance to the targeted tile: elevation gap to the tile's ground/roof
  // counts toward range (matches combatDist), so tile-targeted spell cards gray
  // out when the destination is too far above/below to reach. Multi-floor: the
  // clicked SURFACE (tz, from the click raycast) wins over the column top —
  // targeting a cave floor must not measure range to the roof above it.
  const _tileZ = (tz !== undefined && tz !== null) ? tz
    : (typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0);
  const dist = (typeof G.combatDist === 'function')
    ? G.combatDist(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, tx, ty, _tileZ)
    : Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);
  // Spell-aware distance to this tile: a long-range (gravity-assisted) spell
  // drops DOWNWARD for free, so aiming at a lower tile ignores the downward
  // elevation gap (matches combatReach() / doSpell in the engine). Without this
  // a tile-targeted spell card grays out a cast the engine would allow.
  const _spellTileDist = (sp) => {
    const lr = (typeof isLongRangeSpell === 'function') && isLongRangeSpell(sp);
    return (typeof G.combatReach === 'function')
      ? G.combatReach(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, tx, ty, _tileZ, lr)
      : dist;
  };

  if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function' && canUnitMove(actingUnit) && !onSelf) {
    const moveTiles = getMoveTiles(actingUnit);
    /* Multi-floor: "Move here" goes to the CLICKED surface when reachable,
       else the reachable floor closest to it — never an arbitrary first match
       (which could quietly pick the tunnel under the tile the player meant). */
    const _mvAll = moveTiles.filter(t => t.x === tx && t.y === ty);
    const _mvZRef = (tz !== undefined && tz !== null) ? tz : (actingUnit.z ?? 0);
    const moveTile = _mvAll.find(t => (t.z ?? 0) === _mvZRef)
      || _mvAll.slice().sort((a, b) => Math.abs((a.z ?? 0) - _mvZRef) - Math.abs((b.z ?? 0) - _mvZRef))[0];
    if (moveTile) {
      if (moveTile._takeoff) {

        const takeoffApCost = (typeof FLYING_ALTITUDE_CONFIG !== 'undefined' ? FLYING_ALTITUDE_CONFIG.apCost : 1) + 1;
        actions.push({
          id: 'takeoff-move', label: 'Take Off + Move', icon: '🕊', category: 'movement',
          apCost: takeoffApCost, available: (unitAP >= takeoffApCost),
          reason: (unitAP >= takeoffApCost) ? '' : 'No AP',
          handler: (unitAP >= takeoffApCost) ? () => {
            state._tileActionTarget = null;
            if (typeof setActionMode === 'function') setActionMode('move');
            // doMove performs the takeoff itself (one action, one online
            // relay — the old two-step ran the ascend guest-locally online
            // and desynced).
            if (typeof doMove === 'function') doMove(actingUnit, tx, ty, moveTile.z);
          } : null,
        });
      } else {
        actions.push({
          id: 'move', label: 'Move here', icon: '⬆', category: 'movement',
          apCost: 1, available: true,
          handler: () => {
            state._tileActionTarget = null;
            if (typeof setActionMode === 'function') setActionMode('move');
            if (typeof doMove === 'function') doMove(actingUnit, tx, ty, moveTile.z);
          },
        });
      }
    } else if (typeof findMoveTowardsTile === 'function') {
      // Tile beyond this turn's reach → offer the chase: walk the reachable
      // step that gets closest (same engine path as clicking far ground in
      // move mode). Hovering the blade previews range + route (see
      // _showTileMoveTowardsPreview).
      const _twApproach = findMoveTowardsTile(actingUnit, tx, ty, tz);
      if (_twApproach) {
        actions.push({
          id: 'moveTowards', label: 'Move towards', icon: '➜', category: 'movement',
          apCost: 1, available: true,
          moveTile: _twApproach, _towardGoal: { x: tx, y: ty, z: tz },
          handler: () => {
            state._tileActionTarget = null;
            if (typeof setActionMode === 'function') setActionMode('move');
            if (typeof _moveTowards === 'function') _moveTowards(actingUnit, _twApproach);
            else if (typeof doMove === 'function') doMove(actingUnit, _twApproach.x, _twApproach.y, _twApproach.z);
          },
        });
      }
    }
  }

  // Jump is its own movement verb, not just a fallback for when walking
  // fails: whenever the clicked tile is a legal landing spot, offer the leap
  // ALONGSIDE "Move here" (a jump arcs over hazards/gaps a walk would step
  // through, and it still works after the turn's walks are spent).
  if (!onSelf && typeof canJump === 'function' && typeof getJumpTiles === 'function' && canJump(actingUnit)) {
    const _jpAll = getJumpTiles(actingUnit).filter(t => t.x === tx && t.y === ty);
    const _jpZRef = (tz !== undefined && tz !== null) ? tz : (actingUnit.z ?? 0);
    const jumpTile = _jpAll.find(t => (t.z ?? 0) === _jpZRef)
      || _jpAll.slice().sort((a, b) => Math.abs((a.z ?? 0) - _jpZRef) - Math.abs((b.z ?? 0) - _jpZRef))[0];
    if (jumpTile && !(typeof unitAt === 'function' && unitAt(tx, ty, jumpTile.z))) {
      // Damaging drop? Put the price ON the button — the board already tints
      // the landing hazard-crimson; this is the exact number (predictFallDamage
      // mirrors applyFallDamage: threshold, splash, physique, zodiac).
      const _jpDropDmg = (typeof predictFallDamage === 'function')
        ? predictFallDamage(actingUnit, actingUnit.z ?? 0, jumpTile.z ?? 0, tx, ty) : 0;
      actions.push({
        id: 'jump', label: _jpDropDmg > 0 ? `Jump here (−${_jpDropDmg} HP)` : 'Jump here',
        icon: '↷', category: 'movement',
        apCost: 1, available: true,
        handler: () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('jump');
          if (typeof doJump === 'function') doJump(actingUnit, tx, ty, jumpTile.z);
        },
      });
    }
  }

  const movementKinds = new Set(['dash', 'teleport', 'escape', 'warpRune']);
  const allSpells = [...(actingUnit.spells || []), ...(actingUnit._raceAbilities || [])].filter(Boolean);
  const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
  const isSilenced = typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence');

  for (const sp of allSpells) {
    if (!movementKinds.has(sp.kind)) continue;
    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
    const mpCost = (typeof getSpellMpCostFor === 'function')
      ? getSpellMpCostFor(actingUnit, sp) : (sp.cost || 0) + mpPenalty;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !isSilenced
      && (typeof canAffordSpell !== 'function' || canAffordSpell(actingUnit, sp));
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;

    const spRange = sp.teleportDistance || sp.dashDistance || sp.range || 3;
    const inRange = dist >= 1 && dist <= spRange;

    const tileOccupied = (() => {
      if (typeof unitAt !== 'function') return false;
      // Determine the z-level this unit would land at
      const _isFlying = typeof isUnitAirborne === 'function' && isUnitAirborne(actingUnit);
      let landZ;
      if (_isFlying && typeof getMinFlyingZ === 'function') {
        landZ = getMinFlyingZ(tx, ty);
      } else {
        landZ = typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0;
      }
      const occ = unitAt(tx, ty, landZ);
      return occ && occ.id !== actingUnit.id;
    })();
    const terrain = typeof getTerrainAt === 'function' ? getTerrainAt(tx, ty) : 'grass';
    const tRule = typeof getTerrainRule === 'function' ? getTerrainRule(terrain) : { passable: true };
    const passable = tRule.passable !== false && !tileOccupied;

    let reason = '';
    if (!canAfford) reason = isSilenced ? 'Silenced' : actingUnit.mp < mpCost ? 'No MP' : 'No AP';
    else if (!tierOk) reason = 'Level req';
    else if (!inRange) reason = 'Out of range';
    else if (!passable) reason = tileOccupied ? 'Tile occupied' : 'Impassable';

    const canCast = canAfford && tierOk && inRange && passable;

    actions.push({
      id: 'spell:' + sp.name, label: sp.name, icon: '✦', category: 'movement',
      spellType: sp.spellType || '', apCost: spellApCost, mpCost: mpCost,
      available: canCast, reason: canCast ? '' : reason, spell: sp,
      handler: canCast ? () => {
        state._tileActionTarget = null;
        if (typeof setTool === 'function') setTool('spell', sp.name);
        state.pendingTarget = { x: tx, y: ty, mode: 'spell', tool: sp.name, viaHover: false };
        if (typeof markDirty === 'function') { markDirty('board', 'hud'); }
        if (typeof renderIfDirty === 'function') { renderIfDirty(); }
        if (typeof scheduleBoardRender === 'function') { scheduleBoardRender(); }
      } : null,
    });
  }

  const tileTargetKinds = new Set([
    'aoe', 'aoePull', 'aoeShield', 'barrage', 'bomb', 'cross',
    'delayed', 'deployObject', 'deployPair', 'deployTurret',
    'displacement', 'line', 'linePush', 'terrainCreate',
    'zoneDebuff', 'zoneHeal', 'seedHeal', 'seedPoison', 'leechSeed',
    'remoteView', 'summonWeather',
    'placeBlock', 'buildStructure', 'placeTrap', 'placeMirror',
  ]);

  // 🗺️ Elemental tile casts (HM-style): a damage spell whose element reacts
  // with THIS tile (lightning→water/metal, fire→grass/trees/ice, frost→water)
  // is offered on the tile menu like a tile-target spell would be.
  const _elemTileOk = (sp) => sp.kind === 'damage'
    && !(typeof G.unitAt === 'function' && G.unitAt(tx, ty))
    && typeof G._elementalTileCastInfo === 'function'
    && !!G._elementalTileCastInfo(sp, tx, ty);

  // Team sanity for the occupied-tile menu: clicking an ALLY must not offer
  // damage/debuff zones aimed at them, and an enemy's tile must not offer
  // healing/buff zones. The caster's OWN tile keeps offensive AoEs (centering
  // a burst on yourself to catch adjacent enemies is a legit play), and empty
  // tiles keep free aim untouched.
  const _tileOcc = (typeof G.unitAt === 'function') ? G.unitAt(tx, ty) : null;
  const _occLive = _tileOcc && !_tileOcc.dead;
  const _occAlly = _occLive && (typeof isAllyUnit === 'function'
    ? isAllyUnit(_tileOcc, actingUnit) : _tileOcc.player === actingUnit.player);
  const _occEnemy = _occLive && (typeof isEnemyUnit === 'function'
    ? isEnemyUnit(_tileOcc, actingUnit) : _tileOcc.player !== actingUnit.player);

  for (const sp of allSpells) {
    if (!tileTargetKinds.has(sp.kind) && !_elemTileOk(sp)) continue;
    if (_occLive && typeof spellTileTeam === 'function') {
      const _tt = spellTileTeam(sp);
      if (_tt === 'enemy' && _occAlly && _tileOcc.id !== actingUnit.id) continue;
      if (_tt === 'ally' && _occEnemy) continue;
    }
    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
    const mpCost = (typeof getSpellMpCostFor === 'function')
      ? getSpellMpCostFor(actingUnit, sp) : (sp.cost || 0) + mpPenalty;
    // Full engine gate — AP, MP, silence, tier, COOLDOWN and MATERIALS — so a
    // spell this menu offers can never bounce off doSpell's own checks.
    const engineOk = typeof canAffordSpell === 'function' ? canAffordSpell(actingUnit, sp) : true;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !isSilenced && engineOk;
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;
    const spRange = sp.range || 3;
    const spDist = _spellTileDist(sp);
    // Direction beams (line/linePush) have NO range or LOS gate in the engine —
    // the clicked tile only picks a heading (orthogonal or diagonal) and the ray
    // walks the whole board. Offer them on any aligned tile.
    const _isDirBeam = sp.kind === 'line' || sp.kind === 'linePush';
    const _beamAligned = _isDirBeam && spDist > 0
      && (actingUnit.x === tx || actingUnit.y === ty
          || Math.abs(actingUnit.x - tx) === Math.abs(actingUnit.y - ty));
    const inRange = _isDirBeam ? _beamAligned : spDist <= spRange;
    const losBlocked = !_isDirBeam && typeof isRangeBlockedByTerrain === 'function' && spDist > 0 && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);
    // Placement kinds: validate THIS tile so the row is greyed with the real
    // reason ("Needs an empty tile", "Max height", "No room here"…).
    let placeReason = '';
    if (sp.kind === 'placeTrap' && typeof _placeTrapProblem === 'function') {
      placeReason = _placeTrapProblem(tx, ty) || '';
    } else if (sp.kind === 'placeBlock' && typeof _placeBlockProblem === 'function') {
      placeReason = _placeBlockProblem(actingUnit, sp, tx, ty) || '';
    } else if (sp.kind === 'buildStructure' && typeof _structurePlanFor === 'function') {
      if (!_structurePlanFor(actingUnit, sp, tx, ty)) placeReason = sp.structure === 'bridgeSpan' ? 'Needs a gap to span' : 'No room here';
    } else if (sp.kind === 'placeMirror') {
      if (typeof G.unitAt === 'function' && G.unitAt(tx, ty)) placeReason = 'Needs an empty tile';
      else if ((G.state && G.state.mirrors ? G.state.mirrors : []).some(m => m.x === tx && m.y === ty)) placeReason = 'Prism already here';
    }

    const cdLeft = typeof getSpellCooldownRemaining === 'function' ? getSpellCooldownRemaining(actingUnit, sp) : 0;
    const needMats = sp.materialCost && typeof canAffordMaterials === 'function' && !canAffordMaterials(actingUnit.player, sp.materialCost);
    let reason = '';
    if (isSilenced) reason = 'Silenced';
    else if (!tierOk) reason = 'Level req';
    else if (cdLeft > 0) reason = '⏳ CD ' + cdLeft;
    else if (actingUnit.mp < mpCost) reason = 'No MP';
    else if (unitAP < spellApCost) reason = 'No AP';
    else if (needMats) reason = 'Need ' + (typeof materialCostLabel === 'function' ? materialCostLabel(sp.materialCost) : 'materials');
    else if (!inRange) reason = _isDirBeam ? 'Not in line with caster' : 'Out of range';
    else if (losBlocked) reason = 'No line of sight';
    else if (placeReason) reason = placeReason;

    const canCast = canAfford && tierOk && inRange && !losBlocked && !placeReason;

    actions.push({
      id: 'spell:' + sp.name, label: sp.name, icon: '✦', category: 'spells',
      spellType: sp.spellType || '', apCost: spellApCost, mpCost: mpCost,
      available: canCast, reason: canCast ? '' : reason, spell: sp,
      powerLabel: typeof getSpellPowerLabel === 'function' ? getSpellPowerLabel(sp) : '',
      handler: canCast ? () => {
        state._tileActionTarget = null;
        if (typeof setTool === 'function') setTool('spell', sp.name);
        state.pendingTarget = { x: tx, y: ty, mode: 'spell', tool: sp.name, viaHover: false };
        if (typeof markDirty === 'function') { markDirty('board', 'hud'); }
        if (typeof renderIfDirty === 'function') { renderIfDirty(); }
        if (typeof scheduleBoardRender === 'function') { scheduleBoardRender(); }
      } : null,
    });
  }

  if (typeof doWard === 'function' && unitAP >= 1 && !onSelf) {
    const awrRange = typeof getEffectiveAwr === 'function' ? getEffectiveAwr(actingUnit) : 3;
    const inWardRange = dist <= awrRange;
    const hasWard = typeof unitHasWard === 'function' && unitHasWard(actingUnit) && !actingUnit._usedWard;
    if (hasWard) {
      actions.push({
        id: 'ward', label: 'Ward', icon: '👁', category: 'actions',
        apCost: 1, available: inWardRange,
        reason: inWardRange ? '' : 'Out of range',
        handler: inWardRange ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('ward');
          doWard(actingUnit, tx, ty);
        } : null,
      });
    }
  }

  if (typeof doInspect === 'function' && unitAP >= 1) {
    const inspectReach = typeof getEffectiveInspect === 'function' ? getEffectiveInspect(actingUnit) : 0;
    if (inspectReach > 0) {
      const inInspect = dist <= inspectReach;
      actions.push({
        id: 'inspect', label: 'Inspect', icon: '🔍', category: 'actions',
        apCost: 1, available: inInspect,
        reason: inInspect ? '' : 'Out of range',
        handler: inInspect ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('inspect');
          doInspect(actingUnit, tx, ty);
        } : null,
      });
    }
  }

  if (unitAP >= 1) {
    const effRange = typeof getEffectiveRange === 'function' ? getEffectiveRange(actingUnit) : (actingUnit.range || 1) + 1;
    // Structures (turret / deployed object / seed) occupy a tile and can sit directly
    // BELOW a flying unit — i.e. on the unit's own tile (dist 0). Allow dist 0 here so
    // a flyer can attack straight down; only enemy UNITS require dist >= 1.
    const inRange = dist <= effRange;
    const inRangeUnit = dist >= 1 && dist <= effRange;
    const losBlocked = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

    // Enemy base tower / Cube — give it the same one-click "Attack" entry as turrets.
    const tower = (state.towers && typeof enemyOf === 'function') ? state.towers[enemyOf(actingUnit.player)] : null;
    if (tower && tower.hp > 0 && tower.x === tx && tower.y === ty) {
      const canAtk = inRangeUnit && !losBlocked;
      actions.push({
        id: 'attack:tower', label: 'Attack Cube', icon: '⚔', category: 'attack',
        apCost: 1, available: canAtk, reason: canAtk ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canAtk ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

    const turret = (state.turrets || []).find(t => t.x === tx && t.y === ty && t.owner !== actingUnit.player && t.hp > 0);
    if (turret) {
      const canAtk = inRange && !losBlocked;
      actions.push({
        id: 'attack:turret', label: 'Attack Turret', icon: '⚔', category: 'attack',
        apCost: 1, available: canAtk, reason: canAtk ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canAtk ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

    const deploy = (state._deployedObjects || []).find(o => o.x === tx && o.y === ty && o.hp > 0 && (o.ownerPlayer !== actingUnit.player || (o.detonateOnAttack && o.blastRadius > 0)));
    if (deploy) {
      const canAtk = inRange && !losBlocked;
      actions.push({
        id: 'attack:deploy', label: 'Attack ' + (deploy.spellName || 'Object'), icon: '⚔', category: 'attack',
        apCost: 1, available: canAtk, reason: canAtk ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canAtk ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

    const seed = (state.plantedSeeds || []).find(s => s.x === tx && s.y === ty && s.owner !== actingUnit.player);
    if (seed) {
      const seedName = seed.type === 'heal' ? 'Healing Seed' : seed.type === 'poison' ? 'Poison Seed' : 'Leech Seed';
      const canAtk = inRange && !losBlocked;
      actions.push({
        id: 'attack:seed', label: 'Attack ' + seedName, icon: '⚔', category: 'attack',
        apCost: 1, available: canAtk, reason: canAtk ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canAtk ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

    // 🪓 Chop a tree: any unit can fell a tree with a basic attack (banks
    // lumber / clears cover). Only offered when no unit occupies the tile —
    // otherwise the swing hits the unit, not the trunk.
    const hasTree = !onSelf && typeof _tileHasTree === 'function' && _tileHasTree(tx, ty)
      && !(typeof G.unitAt === 'function' && G.unitAt(tx, ty));
    if (hasTree) {
      const canChop = inRangeUnit && !losBlocked;
      actions.push({
        id: 'attack:tree', label: 'Chop Tree', icon: '🪓', category: 'attack',
        apCost: 1, available: canChop, reason: canChop ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canChop ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

    // 🔨 Smash terrain moved OFF the menus: an exposed raised column is now
    // destroyed by right-click-HOLDING it on the board (1 AP, same range/LOS
    // rules — see beginTileDemolishHold in battle.js).

    // 🏢 Buildings can't be attacked directly anymore — only area damage
    // (AOE / bombs / beams / earthquakes) chips them, so no attack row here.
    const bldg = !onSelf && typeof getBuildingAt === 'function' ? getBuildingAt(tx, ty) : null;

    // 🛗 Enter Building: offered on a building tile the acting unit stands
    // right next to — rides the lift, ends the turn, emerges on the roof
    // at the start of its next turn.
    if (bldg && typeof getEnterableBuilding === 'function' && typeof doEnterBuilding === 'function') {
      const ent = getEnterableBuilding(actingUnit);
      if (ent && ent.building.id === bldg.id) {
        actions.push({
          id: 'enterBuilding', label: 'Enter Building', icon: '🛗', category: 'actions',
          apCost: 1, available: true, reason: '',
          handler: () => {
            state._tileActionTarget = null;
            doEnterBuilding(actingUnit);
          },
        });
      }
    }
  }

  // ⚒ Build here: one-tap dig/place straight from the tile quick menu —
  // the Minecraft "click the block you're looking at" path. Rows appear
  // only when the op would actually land (same _buildProblem the engine
  // uses). Executes via doBuildAction (online-relayed) and re-enters
  // nothing — the quick menu closes and the block changes.
  if (typeof _buildProblem === 'function' && typeof doBuildAction === 'function'
      && typeof _buildActionProblem === 'function' && !_buildActionProblem(actingUnit)) {
    if (!_buildProblem(actingUnit, 'dig', tx, ty)) {
      actions.push({
        id: 'build:dig', label: onSelf ? 'Dig Underfoot' : 'Dig Block', icon: '⛏', category: 'actions',
        apCost: 1, available: true, reason: '',
        handler: () => {
          state._tileActionTarget = null;
          doBuildAction(actingUnit, tx, ty, 'dig');
        },
      });
    }
    if (typeof defaultBuildTool === 'function' && typeof BUILD_MATERIALS !== 'undefined') {
      const _qbTool = defaultBuildTool(actingUnit);
      if (_qbTool !== 'dig' && BUILD_MATERIALS[_qbTool] && !_buildProblem(actingUnit, _qbTool, tx, ty)) {
        actions.push({
          id: 'build:place', label: (onSelf ? 'Block Underfoot ' : 'Place Block ') + BUILD_MATERIALS[_qbTool].icon,
          icon: '🧱', category: 'actions',
          apCost: 1, available: true, reason: '',
          handler: () => {
            state._tileActionTarget = null;
            doBuildAction(actingUnit, tx, ty, _qbTool);
          },
        });
      }
    }
  }

  if (onSelf && typeof getNexusAtUnit === 'function' && typeof channelNexus === 'function') {
    const nex = getNexusAtUnit(actingUnit);
    if (nex && (!nex.nexus.owner || nex.nexus.owner !== actingUnit.player) && unitAP >= (typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1)) {
      const prog = actingUnit.player === 1 ? Math.max(0, nex.nexus.progress) : Math.max(0, -nex.nexus.progress);
      const thresh = typeof NEXUS_CAPTURE_THRESHOLD !== 'undefined' ? NEXUS_CAPTURE_THRESHOLD : 3;
      actions.push({
        id: 'channel', label: 'Channel (' + prog + '/' + thresh + ')', icon: '⬡', category: 'actions',
        apCost: 1, available: true,
        handler: () => {
          state._tileActionTarget = null;
          channelNexus(actingUnit);
        },
      });
    }
  }

  /* 🔵 Recall — teleport home from your OWN tile (clicking your own unit
     opens this menu, so self-verbs live here; moved from the retired More
     menu). Greyed with the real reason while on cooldown or spotted. */
  if (onSelf && typeof RECALL_AP_COST !== 'undefined' && typeof doRecall === 'function') {
    const _rcSpotted = typeof isUnitSeenByAnyEnemy === 'function' && isUnitSeenByAnyEnemy(actingUnit);
    const _rcCd = actingUnit._recallCooldown || 0;
    const _rcOk = unitAP >= RECALL_AP_COST && _rcCd <= 0 && !_rcSpotted;
    actions.push({
      id: 'recall', label: 'Recall to Spawn', icon: '🔵', category: 'actions',
      apCost: RECALL_AP_COST, available: _rcOk,
      reason: _rcOk ? '' : (_rcCd > 0 ? '⏳ CD ' + _rcCd : (_rcSpotted ? 'Spotted' : 'No AP')),
      handler: _rcOk ? () => {
        state._tileActionTarget = null;
        doRecall(actingUnit);
      } : null,
    });
  }

  actions.push({
    id: 'ping', label: 'Ping', icon: '📍', category: 'utility',
    apCost: 0, available: true,
    handler: () => {
      state._tileActionTarget = null;
      if (typeof chooseActionMenu === 'function') chooseActionMenu('pings');
      if (typeof setTool === 'function') setTool('ping', Object.keys(typeof PING_TYPES !== 'undefined' ? PING_TYPES : { caution: true })[0]);
    },
  });

  return actions.filter(a => a.available || (a.reason && a.reason !== 'No AP' && a.reason !== 'No MP' && a.reason !== 'Silenced' && a.reason !== 'Level req'));
}

/* ── SMT-style spell description bar ─────────────────────────────
   The old mouse-follow tooltip is gone. Spell details now live in ONE
   long, thin bar pinned to the bottom-center of the screen — black,
   with gold/holo-blue hairline edges that fade out at the ends. It
   always describes the drum's SELECTED blade (fed by HorologeMenu via
   _setSpellDescBase); hovering a spell row temporarily overrides it.
   showSpellTooltip / hideSpellTooltip keep their names so every
   existing hoverIn/hoverOut call site keeps working unchanged. */
let _descBarEl = null;
let _descBarBase = null;    // spell of the currently selected blade
let _descBarHover = null;   // hover override (cleared on mouse-out)
let _descBarShown;          // last spell actually rendered (no-op guard)

function _ensureDescBarEl() {
  if (_descBarEl && document.body.contains(_descBarEl)) return _descBarEl;
  _descBarEl = document.createElement('div');
  _descBarEl.id = 'ew-spell-descbar';
  document.body.appendChild(_descBarEl);
  return _descBarEl;
}

function _renderSpellDescBar() {
  const sp = _descBarHover || _descBarBase;
  if (_descBarEl && sp === _descBarShown) return;   // cheap: called every HUD render
  _descBarShown = sp;
  const el = _ensureDescBarEl();
  if (!sp || !sp.name) { el.classList.remove('show'); return; }

  const tc = TYPE_COLORS[(sp.spellType || '').toLowerCase()] || EW.inkMute;
  const tcText = TYPE_TEXT_COLORS[(sp.spellType || '').toLowerCase()] || tc;

  // The bar describes the acting (blitz-active) unit's blade. Damage/heal/
  // shield numbers are level-compressed at the engine chokepoints, so the
  // bar scales them by the same curve — what it shows is what actually
  // lands. MP cost is flat at all levels (getSpellMpCostFor only folds in
  // zodiac/status modifiers, never level).
  let _dbUnit = null;
  try {
    if (typeof state !== 'undefined' && state && state.units && state._blitzActiveUnitId != null) {
      _dbUnit = state.units.find(u => u && u.id === state._blitzActiveUnitId) || null;
    }
  } catch (e) {}
  const _dbLs = (_dbUnit && typeof levelScale === 'function' && typeof getUnitLevel === 'function')
    ? levelScale(getUnitLevel(_dbUnit)) : 1;
  const _dbNum = (n) => Math.max(1, Math.round(n * _dbLs));
  const details = [];
  if (sp.dmg) details.push('DMG ' + _dbNum(sp.dmg));
  if (sp.dashDamage) details.push('Path DMG ' + _dbNum(sp.dashDamage));
  if (sp.heal) details.push('Heal ' + _dbNum(sp.heal));
  if (sp.shield) details.push('Shield ' + _dbNum(sp.shield));
  const rng = sp.range || 0;
  details.push(rng > 0 ? 'Range ' + rng : 'Self-cast');
  if (sp.aoeRadius) details.push('AOE ' + sp.aoeRadius);
  if (sp.teleportDistance) details.push('Leap ' + sp.teleportDistance);
  const cost = (_dbUnit && typeof getSpellMpCostFor === 'function') ? getSpellMpCostFor(_dbUnit, sp) : (sp.cost || 0);
  const apCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
  details.push(cost + ' MP · ' + apCost + ' AP');
  if (sp.tier) details.push('T·' + sp.tier);

  let statusLine = '';
  const _fxParts = [];
  // Stat changes speak in STAGES (stackable to ±5) — "+2 ATK stages".
  if (sp.statStageBoost) {
    for (const [k, lbl] of (typeof _FX_STAT_LBL !== 'undefined' ? _FX_STAT_LBL : [])) {
      const n = sp.statStageBoost[k] || 0;
      if (n) _fxParts.push((n > 0 ? '+' : '') + n + ' ' + lbl + ' stage' + (Math.abs(n) > 1 ? 's' : ''));
    }
  }
  if (sp.randomTeamBuff) _fxParts.push('+' + (sp.randomTeamBuff.stages || 1) + ' random stat stage (team)');
  if (sp.statusEffects && sp.statusEffects.length > 0) {
    for (const s of sp.statusEffects) {
      const id = s.id || '';
      const label = (typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[id]?.label) ? STATUS_DEFS[id].label : id.replace(/_/g, ' ');
      _fxParts.push('Applies ' + label + (s.duration ? ' (' + s.duration + 't)' : ''));
    }
  }
  statusLine = _fxParts.join(', ');

  const badge = sp.spellType
    ? '<span style="display:inline-flex;align-items:center;flex:none;' +
      'font-family:DotGothic16,monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;' +
      'color:' + tcText + ';background:linear-gradient(' + tc + '22,' + tc + '22),rgba(10,10,9,0.82);' +
      'border:1px solid ' + tc + 'aa;padding:2px 8px;text-shadow:0 1px 2px rgba(0,0,0,0.85);' +
      'clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);">' +
      sp.spellType.toUpperCase() + '</span>'
    : '';

  // Targeting / delivery / range chips (⬚ TILE · PHYSICAL · ⚔ MELEE …) —
  // moved here OFF the ability rows, so the buttons stay one clean line and
  // the bar is the single place to read a spell's fine print.
  const _chip = (label, color, title) =>
    '<span style="display:inline-flex;align-items:center;flex:none;' +
    'font-family:DotGothic16,monospace;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;' +
    'color:' + color + ';background:rgba(10,10,9,0.82);border:1px solid ' + color + '66;padding:2px 7px;' +
    'text-shadow:0 1px 2px rgba(0,0,0,0.85);white-space:nowrap;' +
    'clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);"' +
    (title ? ' title="' + String(title).replace(/"/g, '&quot;') + '"' : '') + '>' + label + '</span>';
  let chips = '';
  try {
    const _tc2 = spellTargetChip(sp);
    chips += _chip(_tc2.label, _tc2.color, _tc2.title);
    const _db = spellDeliveryBadge(sp);
    chips += _chip(_db.label, _db.color, null);
    if (spellDealsDamage(sp)) {
      const _rb = spellRangeBadge(sp);
      chips += _chip(_rb.glyph + ' ' + _rb.label, _rb.color, _rb.title);
    }
  } catch (_) {}

  el.innerHTML =
    '<div class="ew-descbar-inner">' +
      '<span class="ew-descbar-name">' + (sp.name || '') + '</span>' +
      badge + chips +
      (sp.desc ? '<span class="ew-descbar-desc">' + sp.desc + '</span>' : '') +
      '<span class="ew-descbar-stats">' + details.join(' · ') + '</span>' +
      (statusLine ? '<span class="ew-descbar-status">⤷ ' + statusLine + '</span>' : '') +
    '</div>';
  el.classList.add('show');
}

// Called by HorologeMenu whenever the drum's selected blade changes.
function _setSpellDescBase(sp) {
  _descBarBase = sp || null;
  _renderSpellDescBar();
}

function showSpellTooltip(sp, evt) {
  _descBarHover = sp || null;
  _renderSpellDescBar();
}

function moveSpellTooltip(evt) { /* bar is fixed — nothing tracks the mouse */ }

function hideSpellTooltip() {
  _descBarHover = null;
  _renderSpellDescBar();
}

// Every sub/quick panel wears the Horologe's own material: the blade
// gradient, a faction spine, the same angled cuts — and a "stem" tying it
// back to the clock so it reads as part of one instrument. `onBack`
// (default handleBackAction) drives the header ‹ chip; the clock's crown
// and ESC do the same thing.
function FrameCorners() {
  const c = EW.panelEdgeHi;
  const s = { position: 'absolute', width: 20, height: 20 };
  return h(React.Fragment, null,
    h('div', { style: { ...s, top: 6, left: 6, borderTop: '1px solid ' + c, borderLeft: '1px solid ' + c }}),
    h('div', { style: { ...s, top: 6, right: 6, borderTop: '1px solid ' + c, borderRight: '1px solid ' + c }}),
    h('div', { style: { ...s, bottom: 6, left: 6, borderBottom: '1px solid ' + c, borderLeft: '1px solid ' + c }}),
    h('div', { style: { ...s, bottom: 6, right: 6, borderBottom: '1px solid ' + c, borderRight: '1px solid ' + c }}),
  );
}

/* ── Input-device awareness ──────────────────────────────────────────────
   window.EWInput (state.js) tracks the LAST device the player touched
   ('kbm' | 'pad') and fires 'ew-input-device' on change; the HUD swaps its
   button hints accordingly. window.EWPad supplies the live (rebindable)
   button glyph for each logical action.                                    */
function useInputDevice() {
  const [dev, setDev] = useState(() => (window.EWInput && window.EWInput.device) || 'kbm');
  useEffect(() => {
    const on = (e) => setDev((e && e.detail) || (window.EWInput && window.EWInput.device) || 'kbm');
    window.addEventListener('ew-input-device', on);
    return () => window.removeEventListener('ew-input-device', on);
  }, []);
  return dev;
}

// Non-hook variant for components that early-return before hooks may run.
function _hintKey(action, kbLabel) {
  return (window.EWInput && window.EWInput.device === 'pad' && window.EWPad)
    ? window.EWPad.glyphForAction(action).text : kbLabel;
}

// One controller-button chip (glyph follows the live binding + pad vendor).
function PadBtn({ action, text, kind }) {
  const g = text ? { text, kind: kind || 'stick' }
    : (window.EWPad ? window.EWPad.glyphForAction(action) : { text: '?', kind: 'face' });
  return h('span', { className: 'ew-padbtn ew-padbtn-' + (g.kind || 'face') }, g.text);
}
function KeyCap({ k }) { return h('span', { className: 'ew-keycap' }, k); }

/* ── Contextual control-hints bar (FE3H-style) ───────────────────────────
   A slim strip under the scoreboard listing exactly the inputs that work
   RIGHT NOW, with controller glyphs or key caps per the active device. The
   camera-mode chip is live — clicking it cycles tactical/follow/cinematic. */
function ControlHints({ st }) {
  const dev = useInputDevice();
  const [, setBump] = useState(0);
  useEffect(() => {
    const f = () => setBump(n => n + 1);
    window.addEventListener('ew-camera-mode', f);
    return () => window.removeEventListener('ew-camera-mode', f);
  }, []);
  if (!st || st.phase !== 'battle' || st.winner) return null;

  const humanTurn = !st.autoPlayers?.[st.activePlayer];
  const myTurn = humanTurn
    && (typeof getViewerPlayer !== 'function' || st.activePlayer === getViewerPlayer())
    /* MD auto-companion turns are the AI's — no MENU/SELECT hints */
    && !(typeof _mdAutoTurnActive === 'function' && _mdAutoTurnActive());
  const aiming = !!(st.actionMode || st.selectedTool);
  // (camera mode buttons removed — the camera is contextual now, battle.js)

  const hints = [];
  const add = (chip, label, cls, onClick) => hints.push(
    h('span', { key: hints.length, className: 'ew-hint' + (cls ? ' ' + cls : ''), onClick },
      chip, h('span', { className: 'ew-hint-lbl' }, label)));

  if (dev === 'pad') {
    if (myTurn && aiming) {
      add(h(PadBtn, { text: 'LS', kind: 'stick' }), 'CURSOR');
      add(h(PadBtn, { action: 'confirm' }), 'CONFIRM');
      add(h(PadBtn, { action: 'cancel' }), 'CANCEL');
    } else if (myTurn) {
      add(h(PadBtn, { text: '✚', kind: 'dpad' }), 'MENU');
      add(h(PadBtn, { action: 'confirm' }), 'SELECT');
      add(h(PadBtn, { action: 'cancel' }), 'BACK');
      add(h(PadBtn, { action: 'endTurn' }), 'END TURN');
    }
    add(h(PadBtn, { text: 'RS', kind: 'stick' }), 'CAMERA');
    add(h(PadBtn, { action: 'pause' }), 'PAUSE');
  } else {
    if (myTurn && aiming) {
      add(h(KeyCap, { k: 'WASD' }), 'CURSOR');
      add(h(KeyCap, { k: 'ENTER' }), 'CONFIRM');
      add(h(KeyCap, { k: 'ESC' }), 'CANCEL');
    } else if (myTurn) {
      add(h(KeyCap, { k: '↑↓·ENTER' }), 'MENU');
      add(h(KeyCap, { k: 'WASD' }), 'MOVE');
      add(h(KeyCap, { k: 'SPACE' }), 'END TURN');
    }
    add(h(KeyCap, { k: 'MMB' }), 'ORBIT');
    add(h(KeyCap, { k: 'RMB' }), 'PAN');
  }

  return h('div', { className: 'ew-hints-bar' }, hints);
}

function ReactHUD() {
  const [st, tick] = useGameState();
  const menusHidden = useMenusHidden(st);
  if (!st || st.phase !== 'battle') return null;

  return h('div', {
    id: 'reactHudLayer',
    style: {
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 50,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: EW.ink,
    },
  },

    h('div', { style: { pointerEvents: 'auto' }},
      h(Scoreboard, { st }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(MatchMeta, { st }),
    ),
    // Combat log, control-hints strip, and minimap are hidden from the HUD
    // (minimap suppressed via CSS on #battleMinimap in the injected styles).
    // ONE menu system: the Horologe drum renders the root verbs, every
    // submenu, the target pickers, and the enemy/tile quick menus.
    h('div', { style: { pointerEvents: 'auto' }},
      h(ActionMenu, { st, hidden: menusHidden }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(PartyRoster, { st }),
    ),
    h(GauntletReplaceModal, { st }),
    h(FrameCorners),
  );
}

let _reactHudRoot = null;

function mountReactHUD() {
  const mapRow = document.getElementById('mapRow');
  if (!mapRow) return;
  if (document.getElementById('reactHudRoot')) return;

  const container = document.createElement('div');
  container.id = 'reactHudRoot';
  container.style.cssText = 'position:absolute;inset:0;z-index:50;pointer-events:none;overflow:hidden;';
  mapRow.appendChild(container);

  _reactHudRoot = ReactDOM.createRoot(container);
  _reactHudRoot.render(h(ReactHUD));

  _injectHudHideStyles();
  _initHudJuice(container);
}

function unmountReactHUD() {
  if (_reactHudRoot) {
    _reactHudRoot.unmount();
    _reactHudRoot = null;
  }
  _teardownHudJuice();
  const el = document.getElementById('reactHudRoot');
  if (el) el.remove();
  _removeHudHideStyles();
  // battle over → drop the spell description bar with the rest of the HUD
  _descBarBase = null; _descBarHover = null;
  _renderSpellDescBar();
}

// ── Click juice: press pop + ripple burst + SFX for every pressable HUD element ──
let _hudJuiceLayer = null;
let _hudJuiceContainer = null;
let _hudJuicePressHandler = null;

const _HUD_PRESSABLE_SELECTOR = '.rhud-row, .rhud-move-card, .rhud-end-turn, .rhud-back, .rhud-target';

function _hudJuiceFindPressable(target, container) {
  if (!(target instanceof Element)) return null;
  // Horologe blades own their confirm feedback (strike + flash + chime) and
  // sit rotated via `transform` — the juice press animation would overwrite
  // that rotation and yank the blade out from under the cursor mid-click.
  if (target.closest && target.closest('.hrlg-blade')) return null;
  const explicit = target.closest(_HUD_PRESSABLE_SELECTOR);
  if (explicit && container.contains(explicit)) return explicit;

  // Generic fallback: topmost contiguous cursor:pointer element — covers the
  // pause ☰, party roster cards, combat log toggle, etc. (cursor inherits, so
  // walk up until it stops being 'pointer' to land on the button root).
  let el = target, found = null;
  while (el && el !== container) {
    if (getComputedStyle(el).cursor === 'pointer') found = el;
    else if (found) break;
    el = el.parentElement;
  }
  if (!found) return null;
  const r = found.getBoundingClientRect();
  if (r.width > 460 || r.height > 260) return null;
  return found;
}

function _hudJuiceBurst(el, clientX, clientY, color, deny) {
  const layer = _hudJuiceLayer;
  if (!layer) return;
  const lr = layer.getBoundingClientRect();
  if (lr.width <= 0) return;
  // Convert client px → layer-local px in case an ancestor is scaled
  const s = layer.offsetWidth > 0 ? layer.offsetWidth / lr.width : 1;
  const r = el.getBoundingClientRect();
  const left = (r.left - lr.left) * s, top = (r.top - lr.top) * s;
  const w = r.width * s, ht = r.height * s;

  const flash = document.createElement('div');
  flash.className = 'hud-juice-flash';
  flash.style.cssText = 'position:absolute;pointer-events:none;overflow:hidden;'
    + 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + ht + 'px;'
    + 'background:linear-gradient(90deg,' + color + '2e,' + color + '14);'
    + 'box-shadow:0 0 14px ' + color + '44, inset 0 0 10px ' + color + '22;';

  if (!deny && typeof clientX === 'number') {
    const d = Math.max(w, ht) * 2.3;
    const rx = (clientX - r.left) * s - d / 2;
    const ry = (clientY - r.top) * s - d / 2;
    const ripple = document.createElement('div');
    ripple.className = 'hud-juice-ripple';
    ripple.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;'
      + 'left:' + rx + 'px;top:' + ry + 'px;width:' + d + 'px;height:' + d + 'px;'
      + 'background:radial-gradient(circle,' + color + '7a 0%,' + color + '26 45%,transparent 70%);';
    flash.appendChild(ripple);
  }

  const ring = document.createElement('div');
  ring.className = 'hud-juice-ring';
  ring.style.cssText = 'position:absolute;pointer-events:none;box-sizing:border-box;'
    + 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + ht + 'px;'
    + 'border:1px solid ' + color + 'cc;';

  layer.appendChild(flash);
  layer.appendChild(ring);
  setTimeout(() => { flash.remove(); ring.remove(); }, 450);
}

function _hudJuicePress(el, clientX, clientY) {
  // rhud-disabled but still cursor:pointer = inspectable (e.g. greyed Abilities) — treat as a normal press
  const denied = el.classList.contains('rhud-disabled')
    && getComputedStyle(el).cursor !== 'pointer';

  if (denied) {
    try {
      el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(2px)' },
        { transform: 'translateX(0)' },
      ], { duration: 230, easing: 'ease-out' });
    } catch (err) {}
    _hudJuiceBurst(el, clientX, clientY, '#ff7a8a', true);
    if (typeof playSfx === 'function') playSfx('uiError');
    return;
  }

  try {
    el.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.96)', offset: 0.3 },
      { transform: 'scale(1.02)', offset: 0.65 },
      { transform: 'scale(1)' },
    ], { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  } catch (err) {}

  const isEndTurn = el.classList.contains('rhud-end-turn');
  const color = isEndTurn ? '#ff7a8a' : '#f2c468';
  _hudJuiceBurst(el, clientX, clientY, color, false);

  let sfx = 'uiButtonConfirm';
  if (isEndTurn) sfx = 'uiConfirm';
  else if (el.classList.contains('rhud-back')) sfx = 'uiCursorMove';
  if (typeof playSfx === 'function') playSfx(sfx);
}

function _initHudJuice(container) {
  const mapRow = document.getElementById('mapRow');
  if (!mapRow || _hudJuicePressHandler) return;

  _hudJuiceLayer = document.createElement('div');
  _hudJuiceLayer.id = 'hudJuiceLayer';
  _hudJuiceLayer.style.cssText = 'position:absolute;inset:0;z-index:60;pointer-events:none;overflow:hidden;';
  mapRow.appendChild(_hudJuiceLayer);

  _hudJuicePressHandler = (e) => {
    const el = _hudJuiceFindPressable(e.target, container);
    if (el) _hudJuicePress(el, e.clientX, e.clientY);
  };
  container.addEventListener('pointerdown', _hudJuicePressHandler, true);
  _hudJuiceContainer = container;
}

function _teardownHudJuice() {
  if (_hudJuiceContainer && _hudJuicePressHandler) {
    _hudJuiceContainer.removeEventListener('pointerdown', _hudJuicePressHandler, true);
  }
  _hudJuicePressHandler = null;
  _hudJuiceContainer = null;
  if (_hudJuiceLayer) { _hudJuiceLayer.remove(); _hudJuiceLayer = null; }
}

function _injectHudHideStyles() {
  if (document.getElementById('reactHudHideStyles')) return;
  const style = document.createElement('style');
  style.id = 'reactHudHideStyles';
  style.textContent = `
    /* Hide old HUD elements replaced by React HUD */
    .battle-hud-scoreboard { display: none !important; }
    .battle-hud-roster { display: none !important; }
    .turn-clock { display: none !important; }
    .float-combat-log { display: none !important; }

    /* Hide the persistent turn banner (top-left unit card) — replaced by React ActiveUnitPanel */
    .turn-banner-overlay.visible { display: none !important; }

    /* Keep float-settings-panel + battle-subtitle-bar visible */
    /* Hide old float-action-menu — replaced by React ActionMenu */
    .float-action-menu { display: none !important; }

    /* ── Gamepad glyphs + input hints (device-aware controls) ── */
    .ew-padbtn {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 16px; height: 16px; padding: 0 3px; border-radius: 50%;
      font-family: Inter, system-ui, sans-serif; font-size: 10px; font-weight: 800;
      color: #0b0d14; background: linear-gradient(180deg, #eef2fc, #b8c2dc);
      border: 1px solid rgba(16, 20, 34, 0.9); line-height: 1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(0,0,0,0.28);
    }
    .ew-padbtn-shoulder, .ew-padbtn-stick { border-radius: 5px; padding: 0 5px; }
    .ew-padbtn-sys  { border-radius: 4px; padding: 0 5px; }
    .ew-padbtn-dpad { border-radius: 4px; }
    .ew-padbtn-inline { margin-left: 7px; transform: scale(0.92); vertical-align: middle; }
    .ew-keycap {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 16px; height: 16px; padding: 0 5px; border-radius: 3px;
      font-family: Inter, system-ui, sans-serif; font-size: 9px; font-weight: 700;
      color: #dbe3f8; background: linear-gradient(180deg, #2a3148, #171c2c);
      border: 1px solid rgba(140, 160, 220, 0.4); line-height: 1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }
    .ew-hints-bar {
      position: absolute; top: calc(8px + 94px * var(--ew-hud-scale, 1));
      left: 50%; transform: translateX(-50%);
      display: flex; gap: 15px; align-items: center; z-index: 58;
      pointer-events: none;
      font-family: DotGothic16, monospace; font-size: 10px; letter-spacing: 0.13em;
      color: rgba(198, 208, 235, 0.8);
      background: rgba(8, 10, 18, 0.6);
      border: 1px solid rgba(120, 140, 180, 0.18);
      padding: 4px 13px; white-space: nowrap;
      clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
    }
    .ew-hint { display: inline-flex; align-items: center; gap: 5px; }
    .ew-hint-lbl { padding-top: 1px; }
    .ew-hint.cam { pointer-events: auto; cursor: pointer; }
    .ew-hint.cam:hover .ew-hint-lbl { color: #ffe9b8; }
    @media (max-width: 1150px) { .ew-hints-bar { display: none; } }
    /* controller focus ring for the DOM-nav contexts (pause menu, settings) */
    body[data-input-device="pad"] .pause-card :focus,
    body[data-input-device="pad"] #mmSettingsBody :focus {
      outline: 2px solid rgba(255, 214, 128, 0.9) !important; outline-offset: 2px;
    }

    /* ── React HUD hover states ── */
    /* Action-menu rows now share the warm-gold "bloom" focus the spell/ability
       cards use: a brighter gold wash, a warm rim light + soft bloom, a warm
       left-edge accent and a gentle scale pop that pulses while hovered. */
    .rhud-row {
      transition: background 0.16s ease, box-shadow 0.18s ease,
                  transform 0.16s cubic-bezier(0.22,1,0.36,1), filter 0.08s ease;
      border-radius: 3px;
    }
    .rhud-row:hover:not(.rhud-disabled) {
      background: linear-gradient(90deg, rgba(255,214,128,0.16), rgba(255,176,64,0.03)) !important;
      transform: scale(1.02);
      animation: rhudRowGlow 1.5s ease-in-out infinite;
    }
    .rhud-row:hover:not(.rhud-disabled) .rhud-row-icon {
      color: #ffcf7a !important;
    }
    .rhud-row:hover:not(.rhud-disabled) .rhud-row-label {
      color: #fff6e6 !important;
    }
    @keyframes rhudRowGlow {
      0%, 100% {
        box-shadow: inset 0 0 0 1px rgba(255,236,176,0.55),
                    inset 3px 0 0 0 rgba(255,207,122,0.95),
                    0 0 6px rgba(255,242,206,0.45),
                    0 0 13px rgba(255,206,108,0.30);
      }
      50% {
        box-shadow: inset 0 0 0 1px rgba(255,244,206,0.70),
                    inset 3px 0 0 0 rgba(255,224,150,1),
                    0 0 9px rgba(255,248,222,0.60),
                    0 0 19px rgba(255,214,120,0.42);
      }
    }
    /* ── Move cards (ability buttons) ── */
    /* Hover == focus == selection — one single, unmistakable AAA focus state, built from
       three layers: (1) a soft radial BLOOM behind the card (real glow cloud, lives outside
       the card's clip), (2) a crisp warm RIM light on the card edge, (3) a subtle scale pop. */
    .rhud-move-slot { transform-origin: center; }
    /* Lift the focused card above its neighbours so the bloom spills over them
       instead of being occluded by their opaque backgrounds. */
    .rhud-move-slot:not(.is-disabled):hover,
    .rhud-move-slot.is-focused { z-index: 5; }

    .rhud-move-glow {
      position: absolute; inset: -12px -14px; z-index: 0; pointer-events: none;
      border-radius: 18px; opacity: 0; transform: scale(0.86);
      background:
        radial-gradient(58% 76% at 50% 46%,
          rgba(255,248,224,0.62) 0%,
          rgba(255,214,128,0.46) 34%,
          rgba(255,186,78,0.26) 58%,
          rgba(255,176,64,0) 78%);
      filter: blur(11px);
      transition: opacity 0.22s ease, transform 0.22s ease;
      will-change: opacity, transform;
    }
    .rhud-move-slot:not(.is-disabled):hover .rhud-move-glow,
    .rhud-move-slot.is-focused .rhud-move-glow {
      opacity: 1;
      animation: rhudGlowPulse 1.5s ease-in-out infinite;
    }
    @keyframes rhudGlowPulse {
      0%, 100% { opacity: 0.85; transform: scale(1.0); }
      50%      { opacity: 1;    transform: scale(1.12); }
    }

    .rhud-move-card {
      transition: transform 0.16s cubic-bezier(0.22,1,0.36,1), border-color 0.16s ease, filter 0.18s ease;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.55));
      transform-origin: center;
    }
    .rhud-move-slot:not(.is-disabled):hover .rhud-move-card,
    .rhud-move-card-active {
      border-color: rgba(255,236,176,0.98) !important;
      transform: scale(1.025);
      animation: rhudRimPulse 1.5s ease-in-out infinite;
    }
    .rhud-move-slot:not(.is-disabled):active .rhud-move-card {
      transform: scale(0.992);
    }
    @keyframes rhudRimPulse {
      0%, 100% {
        filter:
          brightness(1.08)
          drop-shadow(0 0 1px rgba(255,255,255,0.95))
          drop-shadow(0 0 6px rgba(255,242,206,0.9))
          drop-shadow(0 0 13px rgba(255,206,108,0.7));
      }
      50% {
        filter:
          brightness(1.14)
          drop-shadow(0 0 2px rgba(255,255,255,1))
          drop-shadow(0 0 10px rgba(255,248,222,1))
          drop-shadow(0 0 20px rgba(255,214,120,0.85));
      }
    }
    /* End turn keeps its red danger identity but matches the bloom feel:
       a pulsing red glow + the same gentle scale pop. */
    .rhud-end-turn {
      transition: background 0.1s ease, border-color 0.1s ease,
                  transform 0.16s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease, filter 0.08s ease;
    }
    .rhud-end-turn:hover {
      background: linear-gradient(180deg, rgba(255,122,138,0.28), rgba(255,122,138,0.08)) !important;
      border-color: rgba(255,150,150,0.85) !important;
      transform: scale(1.02);
      animation: rhudEndTurnGlow 1.5s ease-in-out infinite;
    }
    @keyframes rhudEndTurnGlow {
      0%, 100% { box-shadow: 0 0 6px rgba(255,150,150,0.40), 0 0 13px rgba(255,90,110,0.28); }
      50%      { box-shadow: 0 0 9px rgba(255,170,170,0.55), 0 0 20px rgba(255,100,120,0.42); }
    }
    /* Target-selection rows + back rows share the same warm bloom. */
    .rhud-target {
      transition: background 0.16s ease, box-shadow 0.18s ease,
                  transform 0.16s cubic-bezier(0.22,1,0.36,1), filter 0.08s ease;
      border-radius: 3px;
    }
    .rhud-target:hover {
      background: linear-gradient(90deg, rgba(255,214,128,0.18), rgba(255,176,64,0.03)) !important;
      transform: scale(1.02);
      animation: rhudRowGlow 1.5s ease-in-out infinite;
    }
    .rhud-target:hover .rhud-target-name {
      color: #fff6e6 !important;
    }
    .rhud-back {
      transition: color 0.1s ease, box-shadow 0.18s ease, filter 0.08s ease;
      border-radius: 3px;
    }
    .rhud-back:hover {
      color: #fff6e6 !important;
      box-shadow: inset 0 0 0 1px rgba(255,236,176,0.40),
                  inset 3px 0 0 0 rgba(255,207,122,0.85),
                  0 0 8px rgba(255,214,120,0.25);
    }

    /* ── Click juice: instant press states + burst layer animations ── */
    .rhud-row:active:not(.rhud-disabled),
    .rhud-target:active,
    .rhud-back:active {
      filter: brightness(1.45) saturate(1.15);
    }
    .rhud-end-turn:active {
      filter: brightness(1.5);
    }
    @keyframes hudJuiceFlash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes hudJuiceRipple {
      0% { transform: scale(0.12); opacity: 1; }
      100% { transform: scale(1); opacity: 0; }
    }
    @keyframes hudJuiceRing {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(1.12); opacity: 0; }
    }
    .hud-juice-flash { animation: hudJuiceFlash 0.3s ease-out forwards; }
    .hud-juice-ripple { animation: hudJuiceRipple 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .hud-juice-ring { animation: hudJuiceRing 0.32s ease-out forwards; }

    /* ── Unified scoreboard: turn-order flank chips + polish ── */
    .ew-turn-chip {
      transition: opacity .3s ease, filter .3s ease, transform .18s cubic-bezier(.22,1,.36,1);
    }
    .ew-turn-chip:hover { transform: translateY(-2px); filter: brightness(1.18) !important; }
    .ew-turn-chip-dead:hover { transform: none; filter: saturate(0.08) brightness(0.8) !important; }
    .ew-turn-chip-active { animation: ewTurnActive 1.7s ease-in-out infinite; }
    @keyframes ewTurnActive {
      0%, 100% { filter: brightness(1.0); }
      50%      { filter: brightness(1.15); }
    }
    .ew-sudden-death { animation: ewSuddenBlink 1s steps(1, end) infinite; }
    @keyframes ewSuddenBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .ew-zodiac-blessed { animation: ewZodiacGlow 1.8s ease-in-out infinite; display: inline-block; }
    @keyframes ewZodiacGlow {
      0%, 100% { filter: brightness(1); transform: scale(1); }
      50%      { filter: brightness(1.55); transform: scale(1.12); }
    }
    .ew-scoreboard-sheen { animation: ewSheen 5s ease-in-out infinite; }
    @keyframes ewSheen { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }

    /* Hide Sky Shader debug GUI */
    .lil-gui.root { display: none !important; }

    /* ── Restyle unit nameplates on the board to match Codex design ── */
    .unit-plate {
      background: rgba(8,10,18,0.4) !important;
      border-radius: 0 !important;
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%) !important;
      padding: 0 !important;
      min-width: 86px !important;
      border: none !important;
      box-shadow: none !important;
      overflow: visible !important;
    }
    /* Selected unit plate inherits the same zoom/scale crisp-text trick as all others */
    .p1 > .unit-plate,
    .p2 > .unit-plate,
    body.is-p2-viewer .p1 > .unit-plate,
    body.is-p2-viewer .p2 > .unit-plate {
      border: none !important;
      box-shadow: none !important;
    }
    /* Faction accent stripe on left edge */
    .p1 > .unit-plate::before,
    .p2 > .unit-plate::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important; left: 0 !important; bottom: 0 !important;
      width: 2px !important;
      z-index: 1 !important;
    }
    .p1 > .unit-plate::before { background: #f2c468 !important; box-shadow: 0 0 6px #f2c468 !important; }
    .p2 > .unit-plate::before { background: #ff7a8a !important; box-shadow: 0 0 6px #ff7a8a !important; }
    body.is-p2-viewer .p1 > .unit-plate::before { background: #ff7a8a !important; box-shadow: 0 0 6px #ff7a8a !important; }
    body.is-p2-viewer .p2 > .unit-plate::before { background: #f2c468 !important; box-shadow: 0 0 6px #f2c468 !important; }

    .plate-header {
      background: transparent !important;
      padding: 2px 6px 1px 8px !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      border-bottom: 1px solid rgba(120,140,180,0.12) !important;
    }
    .plate-level {
      font-family: 'DotGothic16', monospace !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      min-width: 14px !important;
      text-align: center !important;
      padding: 1px 3px !important;
      border-radius: 0 !important;
      line-height: 1.2 !important;
    }
    .p1 > .unit-plate .plate-level { background: rgba(242,196,104,0.2) !important; color: #f2c468 !important; border: none !important; }
    .p2 > .unit-plate .plate-level { background: rgba(255,122,138,0.2) !important; color: #ff7a8a !important; border: none !important; }
    body.is-p2-viewer .p1 > .unit-plate .plate-level { background: rgba(255,122,138,0.2) !important; color: #ff7a8a !important; }
    body.is-p2-viewer .p2 > .unit-plate .plate-level { background: rgba(242,196,104,0.2) !important; color: #f2c468 !important; }

    .plate-name {
      font-family: 'Cinzel', serif !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      letter-spacing: 0.02em !important;
      text-shadow: none !important;
    }
    .p1 > .unit-plate .plate-name { color: #4ea8ff !important; }
    .p2 > .unit-plate .plate-name { color: #ff4c4c !important; }
    body.is-p2-viewer .p1 > .unit-plate .plate-name { color: #ff4c4c !important; }
    body.is-p2-viewer .p2 > .unit-plate .plate-name { color: #4ea8ff !important; }

    .plate-stats {
      padding: 2px 6px 3px 8px !important;
      gap: 2px !important;
    }
    /* Canonical type badge (see styles-base.css) — only size tuned for the plate. */
    .plate-types .type-badge {
      font-size: 7px !important;
      padding: 1px 4px !important;
    }

    .plate-bars {
      gap: 1px !important;
      padding-bottom: 1px !important;
    }
    .hp-bar, .mp-bar {
      border-radius: 0 !important;
      background: rgba(0,0,0,0.62) !important;
      border: 1px solid rgba(255,255,255,0.13) !important;
      overflow: hidden !important;
      position: relative !important;
    }
    .hp-bar {
      height: 10px !important;
    }
    .mp-bar {
      height: 9px !important;
    }
    /* canonical fills: ally green / enemy red, no low-health hue swap */
    .hp-fill { background: linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%) !important; border-radius: 0 !important; box-shadow: 0 0 6px rgba(46,209,88,0.45) !important; }
    .hp-fill.hp-mid, .hp-fill.hp-low { background: linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%) !important; }
    .p2 > .unit-plate .hp-fill { background: linear-gradient(90deg, #d92f3c 0%, #ff4a56 60%, #ff96a0 100%) !important; box-shadow: 0 0 6px rgba(255,74,86,0.45) !important; }
    body.is-p2-viewer .p1 > .unit-plate .hp-fill { background: linear-gradient(90deg, #d92f3c 0%, #ff4a56 60%, #ff96a0 100%) !important; box-shadow: 0 0 6px rgba(255,74,86,0.45) !important; }
    body.is-p2-viewer .p2 > .unit-plate .hp-fill { background: linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%) !important; box-shadow: 0 0 6px rgba(46,209,88,0.45) !important; }
    .mp-fill { background: linear-gradient(90deg, #1f7fd6 0%, #2f9dff 60%, #8fd0ff 100%) !important; border-radius: 0 !important; box-shadow: 0 0 6px rgba(47,157,255,0.4) !important; }

    /* HP/MP numbers: centered inside their bar */
    .hp-bar .bar-num, .mp-bar .bar-num {
      font-family: 'DotGothic16', monospace !important;
      font-size: 7px !important;
      letter-spacing: 0.04em !important;
      color: #fff !important;
      text-shadow: 0 1px 1px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7) !important;
      justify-content: center !important;
      line-height: 1 !important;
      padding: 0 !important;
    }

    /* Settings panel restyle */
    .float-settings-panel {
      background: rgba(8,10,18,0.92) !important;
      border: 1px solid rgba(120,140,180,0.16) !important;
      border-radius: 0 !important;
    }
    .float-settings-panel .nine-slice-bg { display: none !important; }

    /* ══════════════ THE HOROLOGE — clock + command panels ══════════════ */
    /* The whole instrument scales with --ew-ui-scale (set by _applyUIScale
       in ui.js: device auto-fit × the pause-menu HUD Size preference).
       Layout is ONE flex row: the identity column (watch, vitals, AP,
       items, tools) on the left, cascading command panels to its right —
       nothing absolutely positioned against magic offsets, so nothing
       can overlap. */
    .hrlg-rig {
      /* lifted so the bottom-center spell description bar has the floor
         to itself — bar is ~62px tall and scales with --ew-ui-scale */
      position: absolute; left: 10px; bottom: calc(14px + 66px * var(--ew-ui-scale, 1));
      display: flex; align-items: flex-end; gap: 12px;
      z-index: 12; pointer-events: none; font-family: 'DotGothic16', monospace;
      transform: scale(var(--ew-ui-scale, 1));
      transform-origin: 0 100%;
    }
    /* ── the IDENTITY COLUMN ── */
    .hrlg-side {
      position: relative; width: 206px; z-index: 10;
      display: flex; flex-direction: column; gap: 7px;
      pointer-events: auto;
    }
    .hrlg-hubwrap { display: flex; justify-content: center; padding-top: 2px; }
    /* the watch — smaller now; the command panels are the star */
    .hrlg-hub {
      position: relative; width: 126px; height: 126px;
      pointer-events: auto; filter: drop-shadow(0 0 14px var(--hfc-soft));
      animation: hrlgStamp 0.35s cubic-bezier(0.16,1.4,0.3,1) both;
    }
    .hrlg-hub svg { width: 100%; height: 100%; overflow: visible; display: block; }
    /* face-disc status tints: red pulse while burning, purple while
       poisoned; a one-shot white blink when the unit takes hit damage */
    .hrlg-flash, .hrlg-hitflash { pointer-events: none; }
    .hrlg-flash-burn { fill: #ff4a30; opacity: 0; animation: hrlgFlashBurn 1.5s ease-in-out infinite; }
    .hrlg-flash-poison { fill: #a44dff; opacity: 0; animation: hrlgFlashPoison 2.1s ease-in-out infinite; }
    @keyframes hrlgFlashBurn { 0%, 100% { opacity: 0; } 50% { opacity: 0.42; } }
    @keyframes hrlgFlashPoison { 0%, 100% { opacity: 0; } 50% { opacity: 0.4; } }
    .hrlg-hitflash { fill: #fff; opacity: 0; }
    .hrlg-hitflash.go { animation: hrlgHitFlash 0.45s ease-out; }
    @keyframes hrlgHitFlash { 0% { opacity: 0.85; } 100% { opacity: 0; } }
    @keyframes hrlgStamp {
      0%   { opacity: 0; transform: scale(0.5) rotate(-40deg); }
      70%  { opacity: 1; transform: scale(1.06) rotate(4deg); }
      100% { opacity: 1; transform: scale(1) rotate(0); }
    }
    /* hands — rotation is set imperatively; the transitions live here */
    .hrlg-hour { transform-origin: 100px 100px; transition: transform 0.75s cubic-bezier(0.3,1.5,0.4,1); }
    .hrlg-min  { transform-origin: 100px 100px; transition: transform 0.5s cubic-bezier(0.22,1.6,0.36,1); }
    .hrlg-sec  { transform-origin: 100px 100px; }
    .hrlg-sec.snap { transition: transform 0.13s cubic-bezier(0.3,2.1,0.4,1); }
    .hrlg-sec.aim  { transition: transform 0.4s cubic-bezier(0.22,1.5,0.36,1); }
    .hrlg-mtick { transition: stroke 0.12s, opacity 0.12s; }
    .hrlg-mtick.lit { stroke: #fff !important; opacity: 1 !important; filter: drop-shadow(0 0 3px var(--hfc)); }
    /* strike shockwave rings */
    .hrlg-chime {
      position: absolute; inset: 0; border: 1px solid var(--hfc); border-radius: 50%;
      opacity: 0; pointer-events: none;
    }
    .hrlg-chime.go  { animation: hrlgChime 0.7s cubic-bezier(0.2,0.8,0.3,1) forwards; }
    .hrlg-chime.go2 { animation: hrlgChime 0.9s 0.1s cubic-bezier(0.2,0.8,0.3,1) forwards; }
    @keyframes hrlgChime {
      0%   { opacity: 0.8; transform: scale(0.4); }
      100% { opacity: 0;   transform: scale(1.3); }
    }
    /* the crown — ONE full-width bar on top of the column: the universal
       BACK control (END TURN at the root, where there's nothing to back
       out of). Big, labelled, impossible to miss. */
    .hrlg-crown {
      position: relative; width: 100%; height: 40px;
      pointer-events: none; opacity: 0.25; cursor: default;
      transition: opacity 0.15s ease, transform 0.12s cubic-bezier(0.3,1.5,0.4,1);
    }
    .hrlg-crown-cap {
      width: 100%; height: 100%;
      background: linear-gradient(180deg, #3a120c, #140605);
      border: 1px solid #ff4a3c;
      clip-path: polygon(9px 0, 100% 0, calc(100% - 9px) 100%, 0 100%);
      box-shadow: 0 0 12px rgba(255,74,60,0.35), inset 0 1px 0 rgba(255,255,255,0.16);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .hrlg-crown-arrow {
      font-size: 14px; line-height: 1; color: #ff9184;
      text-shadow: 0 0 8px rgba(255,74,60,0.8);
    }
    .hrlg-crown-text {
      font-size: 13px; font-weight: 700; letter-spacing: 0.2em; line-height: 1;
      color: #ffb3a8; text-shadow: 0 0 10px rgba(255,74,60,0.7); white-space: nowrap;
    }
    .hrlg-crown.live {
      opacity: 1; pointer-events: auto; cursor: pointer;
      animation: hrlgCrownPulse 1.6s ease-in-out infinite;
    }
    @keyframes hrlgCrownPulse {
      0%, 100% { filter: brightness(1); }
      50%      { filter: brightness(1.45); }
    }
    .hrlg-crown.live:hover  { transform: translateY(-2px) scale(1.03); }
    .hrlg-crown.live:active { transform: translateY(2px); }
    /* root view: nothing to back out of → the crown is END TURN instead.
       Calm by default; when the unit is down to its LAST AP it pulses hard
       so "wrap it up" is impossible to miss. */
    .hrlg-crown.endturn { animation: none; }
    .hrlg-crown.endturn.lastap { animation: hrlgCrownLastAP 0.9s ease-in-out infinite; }
    @keyframes hrlgCrownLastAP {
      0%, 100% { filter: brightness(1);   transform: scale(1); }
      50%      { filter: brightness(1.6); transform: scale(1.04); }
    }
    .hrlg-crown.endturn.lastap:hover  { animation: none; transform: translateY(-2px) scale(1.03); }
    .hrlg-crown.endturn.lastap:active { animation: none; transform: translateY(2px); }
    /* ── tool rows: ⚒ BUILD + situational one-shots (CHANNEL / DETONATE /
       ENTROPY…) — full-width rows at the bottom of the column. They used to
       be tiny overlapping bezel studs; now they're real buttons. */
    .hrlg-push {
      position: relative; width: 100%; height: 34px; flex: none;
      display: flex; align-items: center; gap: 9px; padding: 0 13px;
      cursor: pointer; pointer-events: auto;
      background: linear-gradient(100deg, var(--pc-faint), rgba(10,10,9,0.6)), #0c0c0a;
      border: 1px solid var(--pc-soft); border-left: 3px solid var(--pc);
      clip-path: polygon(7px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      transition: transform 0.1s ease, box-shadow 0.12s ease, filter 0.1s ease;
      animation: hrlgRowIn 0.16s cubic-bezier(0.2,1,0.3,1) backwards;
    }
    .hrlg-push-glyph { font-size: 16px; line-height: 1; color: var(--pc); text-shadow: 0 0 8px var(--pc-soft); flex: none; }
    .hrlg-push-lbl { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; line-height: 1; color: #eceadd; white-space: nowrap; }
    .hrlg-push-sub {
      margin-left: auto; font-size: 9px; letter-spacing: 0.08em; color: #979181;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .hrlg-push.live:hover  { transform: translateX(3px); filter: brightness(1.3); box-shadow: 0 0 14px var(--pc-soft); }
    .hrlg-push.live:active { transform: scale(0.98); }
    .hrlg-push.off { opacity: 0.4; cursor: default; filter: grayscale(0.8); }
    .hrlg-push.pulse { animation: hrlgPushPulse 1.5s ease-in-out infinite; }
    .hrlg-push.armed {
      box-shadow: 0 0 16px var(--pc-soft), inset 0 0 10px var(--pc-faint);
      animation: hrlgPushPulse 1.4s ease-in-out infinite;
    }
    @keyframes hrlgPushPulse {
      0%, 100% { box-shadow: 0 0 4px var(--pc-faint); }
      50%      { box-shadow: 0 0 16px var(--pc-soft); }
    }
    /* unit name + identity under the watch — real flow, no overlaps */
    /* status / stat-change chips under the watch — nameplate badge palette */
    .hrlg-status-row {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 3px;
      margin-top: -4px; pointer-events: auto;
    }
    .hrlg-schip {
      font-size: 9px; font-weight: 700; letter-spacing: 0.06em; line-height: 1;
      padding: 3px 5px; border-radius: 3px; color: #fff; white-space: nowrap;
      background: #555; border: 1px solid rgba(255,255,255,0.22);
      text-shadow: 0 1px 1px rgba(0,0,0,0.85); box-shadow: 0 1px 3px rgba(0,0,0,0.6);
      animation: hrlgChipIn 0.22s cubic-bezier(0.2,1.4,0.36,1) both;
    }
    .hrlg-schip.up { background: rgba(34,140,60,0.92); border-color: rgba(110,226,168,0.55); }
    .hrlg-schip.dn { background: rgba(165,45,45,0.92); border-color: rgba(255,122,138,0.55); }
    .hrlg-schip.fire { background: rgba(120,50,10,0.92); border-color: rgba(255,150,60,0.6); }
    @keyframes hrlgChipIn {
      0% { opacity: 0; transform: scale(0.6); }
      100% { opacity: 1; transform: scale(1); }
    }
    .hrlg-core {
      text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      line-height: 1.15; pointer-events: none; margin-top: -2px;
    }
    .hrlg-roman { font-family: 'Cinzel', serif; font-style: italic; font-size: 12px; color: var(--hfc); }
    .hrlg-name  { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 0.08em; color: #eceadd; }
    /* Lv · race · job identity line */
    .hrlg-core-sub {
      text-align: center; font-size: 10px; letter-spacing: 0.14em; color: #a49e8c;
      pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-top: -4px;
    }
    /* ⓘ INFO — the little stat-card button beside the unit name on the
       clock column, and next to the target's name on quick-cast tabs */
    .hrlg-infobtn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 19px; height: 19px; margin-left: 7px; flex: none;
      border-radius: 50%; border: 1px solid var(--hfc-soft);
      background: rgba(0,0,0,0.55); color: var(--hfc);
      font-size: 12px; line-height: 1; cursor: pointer; pointer-events: auto;
      vertical-align: -3px;
      transition: transform 0.1s ease, box-shadow 0.12s ease, border-color 0.12s ease;
    }
    .hrlg-infobtn:hover { border-color: var(--hfc); box-shadow: 0 0 9px var(--hfc-soft); transform: scale(1.12); }
    .hrlg-infobtn:active { transform: scale(0.94); }
    .hrlg-infobtn.on {
      background: var(--hfc); color: #0d0d0b; border-color: var(--hfc);
      box-shadow: 0 0 10px var(--hfc-soft);
    }
    /* HP/MP vitals right under the portrait — the numbers are the POINT
       here, so they get real size instead of fine print. Label + numbers
       ride the strip ABOVE the bar (identity left, numbers right), the
       same layout as the nameplates and target rows; the bar stays clean. */
    .hrlg-vitals {
      display: flex; flex-direction: column; gap: 5px; pointer-events: none;
    }
    .hrlg-vbar {
      position: relative; height: 12px; margin-top: 15px;
      background: rgba(0,0,0,0.62);
      border: 1px solid rgba(255,255,255,0.13);
    }
    .hrlg-vbar.mp { height: 10px; }
    .hrlg-vfill {
      position: absolute; left: 0; top: 0; bottom: 0;
      transition: width 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .hrlg-vlbl {
      position: absolute; left: 1px; bottom: calc(100% + 3px);
      font-size: 10px; letter-spacing: 0.18em; line-height: 1;
      color: rgba(255,255,255,0.85); text-shadow: 0 1px 1px rgba(0,0,0,0.9);
    }
    .hrlg-vnum {
      position: absolute; right: 1px; bottom: calc(100% + 2px);
      font-size: 13px; line-height: 1;
      color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8);
    }
    .hrlg-vbar.mp .hrlg-vnum { font-size: 11px; }
    /* Projected MP spend: the hovered/armed spell's cost blinks as a bright
       slice off the MP fill's leading edge (same read as the HP forecast;
       dmgPreviewBlink keyframes live in styles-animations.css). */
    .hrlg-vspend {
      position: absolute; top: 0; bottom: 0;
      background: #cfe9ff; pointer-events: none;
      animation: dmgPreviewBlink 0.85s ease-in-out infinite;
    }
    .hrlg-vspend.short { background: #ffb3bc; }
    .hrlg-vspendnum {
      color: #8fd0ff; font-weight: 900;
      text-shadow: 0 0 6px rgba(120,190,255,0.7), 0 1px 2px #000;
      animation: dmgPreviewBlink 0.85s ease-in-out infinite;
    }
    /* AP row — under the vitals, sized to be READ, not squinted at */
    .hrlg-ap {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      pointer-events: none;
    }
    .hrlg-ap-lbl { font-size: 12px; letter-spacing: 0.24em; color: #85816f; }
    .hrlg-ap-num { font-size: 14px; letter-spacing: 0.1em; color: #e4dfd0; margin-left: 3px; }
    .hrlg-ap-num + .hrlg-ap-num { margin-left: 0; }
    /* bonus (level-up) AP reads GREEN — both the extra pips and the /4, /5 max */
    .hrlg-ap-num.bonus { color: #6ee2a8; text-shadow: 0 0 7px rgba(110,226,168,0.55); }
    .hrlg-pip {
      width: 11px; height: 11px; transform: rotate(45deg);
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18);
    }
    /* AP diamonds — ALWAYS yellow/gold, never the faction tint */
    .hrlg-pip.on { background: #ffd23e; border-color: #ffd23e; box-shadow: 0 0 8px rgba(255,210,62,0.75); }
    .hrlg-pip.bonus { border-color: rgba(255,210,62,0.5); }
    .hrlg-pip.bonus.on { background: #ffd23e; border-color: #ffd23e; box-shadow: 0 0 9px rgba(255,210,62,0.8); }
    .hrlg-pip.spend { animation: hrlgSpend 0.7s ease-in-out infinite; }
    @keyframes hrlgSpend { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    /* ── 3 item slots — one-click item use, big enough to hit ── */
    .hrlg-items {
      display: flex; justify-content: center; gap: 10px;
      pointer-events: auto;
    }
    .hrlg-item-slot {
      position: relative; width: 48px; height: 48px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.66); border: 1px solid var(--hfc-soft);
      clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
      transition: border-color 0.12s, box-shadow 0.12s, transform 0.12s;
    }
    .hrlg-item-slot:hover:not(.empty):not(.off) {
      border-color: var(--hfc); box-shadow: 0 0 12px var(--hfc-soft);
      transform: translateY(-2px) scale(1.05);
    }
    .hrlg-item-slot.armed {
      border-color: var(--hfc);
      box-shadow: 0 0 12px var(--hfc-soft), inset 0 0 8px var(--hfc-faint);
    }
    .hrlg-item-slot.off { cursor: default; filter: grayscale(1); opacity: 0.45; }
    .hrlg-item-slot.empty { cursor: default; opacity: 0.28; border-style: dashed; }
    .hrlg-item-glyph { font-size: 22px; line-height: 1; }
    .hrlg-item-count {
      position: absolute; right: 3px; bottom: 1px; font-size: 11px; color: #e4dfd0;
      text-shadow: 0 1px 2px #000, 0 0 3px #000; letter-spacing: 0.04em;
    }
    /* Team material bank strip (🪵🪨⚙️) — build affordability at a glance */
    .hrlg-mats {
      display: flex; align-items: center; justify-content: center; gap: 9px;
      font-size: 11px; letter-spacing: 0.06em; color: #d4cfc0;
      pointer-events: auto; white-space: nowrap;
    }
    .hrlg-mats-lbl { font-size: 9px; letter-spacing: 0.24em; color: #6a665a; }
    .hrlg-mat.none { color: #5a564a; opacity: 0.75; }
    .hrlg-mat.free { color: #6ee2a8; text-shadow: 0 0 7px rgba(110,226,168,0.55); animation: hrlgSpend 1.4s ease-in-out infinite; }

    /* ── the CASCADING COMMAND PANELS ─────────────────────────────
       Plain vertical lists of full-color rows. The ACTIVE panel is lit;
       parent panels stay on screen to its left, dimmed — click one to
       back up to it. Long lists scroll inside their panel. */
    .hrlg-panels { position: relative; display: flex; align-items: flex-end; gap: 10px; pointer-events: none; }
    .hrlg-panel {
      position: relative; width: 316px; flex: none;
      display: flex; flex-direction: column; gap: 6px;
      pointer-events: auto;
      animation: hrlgPanelIn 0.15s cubic-bezier(0.2,1,0.3,1) backwards;
    }
    @keyframes hrlgPanelIn {
      0%   { opacity: 0; transform: translateX(-16px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    .hrlg-panel.bg {
      opacity: 0.45; filter: saturate(0.7) brightness(0.85);
      transform: scale(0.96); transform-origin: 0 100%;
      cursor: pointer; transition: opacity 0.12s ease, filter 0.12s ease;
      animation: none;
    }
    .hrlg-panel.bg:hover { opacity: 0.7; filter: saturate(0.9) brightness(1); }
    .hrlg-panel.bg .hrlg-blade, .hrlg-panel.bg .hrlg-blade .hrlg-body { cursor: pointer; }
    /* the root verb panel: short words, narrow blades — the reason a verb is
       greyed out reads UNDER its name (hrlg-subline), not as a side tag */
    .hrlg-panel.root { width: 224px; }
    /* the ARMED verb in a dimmed parent panel grows TALL and keeps its full
       color, so "which sub-menu am I in" is answered at a glance */
    .hrlg-panel.bg .hrlg-blade.active { height: 58px; }
    .hrlg-panel.bg .hrlg-blade.active .hrlg-body {
      filter: none; opacity: 1;
      border-color: var(--bc, var(--hfc));
      box-shadow: -2px 0 16px var(--bc-soft, var(--hfc-soft)), inset 3px 0 0 var(--bc, var(--hfc));
    }
    .hrlg-panel.bg .hrlg-blade.active .hrlg-blabel { color: #fff; font-size: 16px; }
    .hrlg-panel.bg .hrlg-blade.active .hrlg-glyph { font-size: 18px; }
    .hrlg-list {
      display: flex; flex-direction: column; gap: 0;
      max-height: 400px; overflow-y: auto; overflow-x: hidden;
      padding: 5px 12px 5px 6px;
      scrollbar-width: thin; scrollbar-color: var(--hfc-soft) rgba(255,255,255,0.05);
      overscroll-behavior: contain;
    }
    .hrlg-list::-webkit-scrollbar { width: 5px; }
    .hrlg-list::-webkit-scrollbar-thumb { background: var(--hfc-soft); }
    .hrlg-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
    /* ── panel header: ONE cohesive blade ──
       The menu name and, for a clicked unit, its HP/MP bars + stat
       readout all live inside this single parallelogram of blade
       material — no more separate name tab / vitals strip. */
    .hrlg-thead {
      position: relative; margin: 0 7px 0 5px; flex: none;
      display: flex; flex-direction: column;
      background: linear-gradient(100deg, var(--hfc-faint), rgba(11,11,10,0.55)), #101010;
      border: 1px solid var(--hfc-soft); border-left: 4px solid var(--hfc);
      clip-path: polygon(8px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      transform: skewX(-8deg);
      box-shadow: -2px 0 18px var(--hfc-faint);
      pointer-events: none; z-index: 2;
    }
    .hrlg-thead > * { transform: skewX(8deg); }
    .hrlg-thead.enemy { border-left-color: #ff4a56; }
    .hrlg-thead.ally  { border-left-color: #2ed158; }
    /* the name row inside the header blade */
    .hrlg-view-tab {
      position: relative; height: 40px; flex: none;
      display: flex; align-items: center; gap: 9px; padding: 0 18px 0 13px;
      pointer-events: none;
    }
    .hrlg-view-tab-icon { color: var(--hfc); font-size: 16px; flex: none; text-shadow: 0 0 8px var(--hfc-soft); }
    .hrlg-view-tab-text {
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px;
      letter-spacing: 0.14em; text-transform: uppercase; color: #f2efe4;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .hrlg-view-tab-count { font-size: 11px; letter-spacing: 0.1em; color: #979181; flex: none; white-space: nowrap; margin-left: auto; }
    /* ── clicked unit's vitals inside the header blade ──
       HP/MP bars reuse the canonical .hrlg-thp bar, forecast slices
       reuse .hrlg-thp-preview (blink keyframes live in
       styles-animations.css). Material/skew comes from .hrlg-thead. */
    .hrlg-qvitals {
      position: relative; padding: 2px 18px 6px 13px; flex: none;
      display: flex; flex-direction: column; gap: 4px;
      pointer-events: none;
    }
    .hrlg-qv-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .hrlg-qv-row .hrlg-thp { flex: 1 1 auto; min-width: 60px; }
    .hrlg-qv-lbl {
      flex: none; width: 18px; font-size: 9px; font-weight: 700;
      letter-spacing: 0.12em; color: #cfc9b8;
    }
    .hrlg-qv-lbl.mp { color: #9fc6ef; }
    .hrlg-qv-num {
      flex: none; font-size: 10px; line-height: 1; color: #fff;
      text-shadow: 0 1px 1px #000, 0 0 3px rgba(0,0,0,0.85);
    }
    .hrlg-qv-num.mp { font-size: 9px; color: #aebfff; }
    /* forecast chip: the hovered action's projected ±HP, blinking in step
       with the bar slice */
    .hrlg-qv-fc {
      flex: none; font-size: 11px; font-weight: 900; letter-spacing: 0.04em;
      line-height: 1; animation: dmgPreviewBlink 0.85s ease-in-out infinite;
    }
    .hrlg-qv-fc.dmg { color: #ff8d97; text-shadow: 0 0 6px rgba(255,74,86,0.7), 0 1px 2px #000; }
    .hrlg-qv-fc.dmg.lethal { color: #ffd0d5; }
    .hrlg-qv-fc.heal { color: #7df0a5; text-shadow: 0 0 6px rgba(46,209,88,0.7), 0 1px 2px #000; }
    /* ── clicked unit's stat readout: plain numbers, two columns, no
       bars — the last section of the header blade (replaced the ⓘ
       stat-card button). CRT/EVA tooltips carry the full formula. */
    .hrlg-qstats {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1px 16px;
      padding: 4px 18px 7px 13px; margin-top: 1px;
      border-top: 1px solid var(--hfc-faint);
      pointer-events: auto;
    }
    .hrlg-qstat { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
    .hrlg-qstat-lbl {
      flex: none; width: 34px; font-size: 9px; font-weight: 700;
      letter-spacing: 0.12em; color: #979181;
    }
    .hrlg-qstat-val {
      font-size: 12px; line-height: 1.3; font-weight: 700; color: #eceadd;
      text-shadow: 0 1px 1px #000; font-variant-numeric: tabular-nums;
    }
    .hrlg-qstat.up .hrlg-qstat-val { color: #7df0a5; }
    .hrlg-qstat.dn .hrlg-qstat-val { color: #ff8d97; }
    /* aiming-state instruction ("MOVING — CLICK A TILE") */
    .hrlg-mode {
      position: relative; margin: 0 7px 0 5px; padding: 6px 14px; flex: none;
      text-align: center; font-size: 11px; letter-spacing: 0.16em; color: #ffd9a8;
      background: rgba(22,15,6,0.9); border: 1px solid rgba(255,204,110,0.45);
      clip-path: polygon(7px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      text-shadow: 0 1px 2px rgba(0,0,0,0.9); pointer-events: none;
    }
    .hrlg-mode.lone { min-width: 250px; margin: 0; }
    /* ── COMMAND ROW ────────────────────────────────────────────────
       Full-color parallelogram rows. A row wears its job's color EDGE TO
       EDGE (--bc* from the spell category, faction tint otherwise) and
       hovering makes it GLOW AND GROW — the color never disappears. */
    .hrlg-blade {
      position: relative; flex: none; height: 40px;
      display: flex; align-items: stretch; cursor: pointer; pointer-events: auto;
      animation: hrlgRowIn 0.15s cubic-bezier(0.2,1,0.3,1) backwards;
    }
    @keyframes hrlgRowIn {
      0%   { opacity: 0; transform: translateX(-14px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    /* portrait target row: face chip + name over a real HP bar (JRPG style) */
    .hrlg-blade.trow { height: 54px; }
    .hrlg-blade.trow.has-mp { height: 70px; }
    /* the armed (✓) row grows a CONFIRM seal — drop the dist chip there so
       the name + HP bar never get crowded out */
    .hrlg-blade.trow.pend .hrlg-meta { display: none; }
    .hrlg-body {
      position: relative; height: 100%; flex: 1; min-width: 0;
      display: flex; align-items: center; gap: 8px; padding: 0 13px 0 12px;
      background: linear-gradient(100deg, var(--bc-hi, var(--hfc-faint)) 0%, var(--bc-lo, rgba(255,255,255,0.03)) 100%), #0d0d0b;
      border: 1px solid var(--bc-soft, var(--hfc-soft)); border-left: 3px solid var(--bc, var(--hfc));
      clip-path: polygon(8px 0, 100% 0, calc(100% - 11px) 100%, 0 100%);
      transform: skewX(-8deg);
      transform-origin: 0 50%;
      transition: transform 0.09s ease, box-shadow 0.1s ease, filter 0.09s ease, border-color 0.09s ease;
    }
    .hrlg-body > * { transform: skewX(8deg); }
    /* danger rows (END TURN / CANCEL) wear red the same way */
    .hrlg-body.danger {
      --bc: #ff4a3c; --bc-soft: #ff4a3c88; --bc-faint: #ff4a3c22;
      --bc-hi: #ff4a3c3a; --bc-lo: #ff4a3c18;
    }
    .hrlg-blade.catc .hrlg-glyph { color: var(--bc); text-shadow: 0 0 10px var(--bc-soft); }
    .hrlg-glyph {
      font-size: 15px; color: var(--hfc); width: 18px; text-align: center; flex: none;
      text-shadow: 0 0 10px var(--hfc-soft);
    }
    .hrlg-body.danger .hrlg-glyph { color: #ff4a3c; text-shadow: 0 0 10px rgba(255,74,60,0.4); }
    .hrlg-blabel {
      flex: 1; min-width: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px;
      letter-spacing: 0.05em; color: #f0ede0; line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    }
    /* ── the classic yellow JRPG cursor leading the selected row ── */
    .hrlg-cursor {
      flex: none; margin: 0 -2px 0 -5px;
      font-size: 14px; line-height: 1; color: #ffd23e; pointer-events: none;
      text-shadow: 2px 2px 0 #000, 0 0 9px rgba(255,210,62,0.85);
      animation: hrlgCursorBob 0.55s steps(2, jump-none) infinite;
    }
    @keyframes hrlgCursorBob {
      0%, 100% { transform: skewX(8deg) translateX(0); }
      50%      { transform: skewX(8deg) translateX(-4px); }
    }
    .hrlg-tport {
      flex: none; width: 42px; height: 42px;
      background-size: cover; background-position: center;
      background-color: rgba(0,0,0,0.55); image-rendering: pixelated;
      border: 1px solid rgba(255,255,255,0.25);
      box-shadow: 0 1px 5px rgba(0,0,0,0.7);
    }
    .hrlg-tport.sprite { background-size: contain; background-repeat: no-repeat; background-position: center bottom; }
    .hrlg-tport.ally  { border-color: rgba(90,170,255,0.75); }
    .hrlg-tport.enemy { border-color: rgba(255,90,90,0.75); }
    .hrlg-tport.ko { filter: grayscale(1) brightness(0.65); }
    /* min-width guarantees the HP bar NEVER collapses when the right-hand
       chips (forecast / dist / CONFIRM) crowd the row. */
    .hrlg-tcol {
      flex: 1 1 auto; min-width: 92px;
      display: flex; flex-direction: column; gap: 2px; justify-content: center;
    }
    .hrlg-tcol .hrlg-blabel { font-size: 13px; }
    /* the strip above each bar: identity left, numbers right — same layout
       as the 3D nameplates */
    .hrlg-trow-top {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 6px; min-width: 0;
    }
    .hrlg-trow-top.mp { justify-content: flex-end; }
    .hrlg-thp {
      position: relative; height: 10px;
      background: rgba(0,0,0,0.62); border: 1px solid rgba(255,255,255,0.13);
    }
    .hrlg-thp.mp { height: 8px; }
    .hrlg-thp-fill {
      position: absolute; left: 0; top: 0; bottom: 0;
      transition: width 0.3s ease-out;
    }
    .hrlg-thp-shield {
      position: absolute; top: 0; right: 0; bottom: 0;
      background: rgba(130,200,255,0.6);
    }
    .hrlg-thp-num {
      flex: none;
      font-size: 10px; line-height: 1; color: #fff;
      text-shadow: 0 1px 1px #000, 0 0 3px rgba(0,0,0,0.85);
    }
    .hrlg-trow-top.mp .hrlg-thp-num { font-size: 9px; }
    /* type badges NEVER clip — they're the matchup intel; the name
       ellipsizes first instead (see the flex settings on hrlg-blabel) */
    .hrlg-badges { display: flex; align-items: center; gap: 5px; flex: none; }
    /* two-line ability/quick-menu rows: name + TYPE badge on top,
       damage/MP/AP/reason chips underneath — nothing ever cut off */
    .hrlg-blade.two { height: 56px; }
    .hrlg-brow1 { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .hrlg-brow2 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    /* green !-circle = super effective vs this target */
    .hrlg-supereff {
      flex: none; width: 16px; height: 16px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: #2ecc71; color: #06130a;
      font-family: Inter, system-ui, sans-serif; font-weight: 900; font-size: 12px; line-height: 1;
      box-shadow: 0 0 8px rgba(46,204,113,0.75);
    }
    .hrlg-spacer { flex: 1 1 6px; min-width: 6px; }
    .hrlg-cost { display: flex; gap: 3px; align-items: center; flex: none; }
    /* AP cost diamonds — always gold, matching the big AP row */
    .hrlg-cpip { width: 7px; height: 7px; transform: rotate(45deg); background: #ffd23e; opacity: 0.95; box-shadow: 0 0 5px rgba(255,210,62,0.6); }
    .hrlg-cfree { font-size: 9px; letter-spacing: 0.16em; color: #a8a391; flex: none; white-space: nowrap; }
    .hrlg-tag {
      flex: none; font-size: 8px; letter-spacing: 0.14em; color: #ff8a97;
      border: 1px solid rgba(255,122,138,0.55); padding: 1px 4px;
      background: rgba(20,4,6,0.75); white-space: nowrap;
    }
    /* right-side detail chips shared by every row */
    .hrlg-pw   { flex: none; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    .hrlg-chip {
      flex: none; font-size: 9px; letter-spacing: 0.08em; color: #a5dcf2;
      border: 1px solid rgba(95,214,255,0.4); background: rgba(8,20,26,0.7);
      padding: 1px 5px; white-space: nowrap;
    }
    .hrlg-meta { flex: none; font-size: 10px; letter-spacing: 0.06em; color: #cdc8b8; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    .hrlg-note {
      flex: none; font-size: 7px; font-weight: 700; letter-spacing: 0.1em;
      color: #1a1206; background: #ffcc44; padding: 1px 5px; white-space: nowrap;
      box-shadow: 0 0 6px rgba(255,204,68,0.4);
    }
    .hrlg-check {
      flex: none; font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
      color: #0d1a10; background: #57d98a; padding: 2px 6px; white-space: nowrap;
      box-shadow: 0 0 10px rgba(87,217,138,0.6);
    }
    /* SELECTED (cursor) row + hover: it GLOWS, GROWS and juts toward the
       player — in ITS OWN color, never a generic wash. */
    .hrlg-blade.sel .hrlg-body,
    .hrlg-blade:hover:not(.dead):not(.muted) .hrlg-body {
      /* grow in place — no sideways shove, so the row's right edge (badges,
         chips) is never pushed out of the panel and clipped */
      transform: skewX(-8deg) scaleY(1.05);
      border-color: rgba(255,255,255,0.85); border-left-color: var(--bc, var(--hfc));
      box-shadow: 0 0 18px var(--bc-soft, var(--hfc-soft)), inset 0 0 16px var(--bc-faint, var(--hfc-faint)), inset 3px 0 0 var(--bc, var(--hfc));
      z-index: 3;
    }
    .hrlg-blade.sel .hrlg-body { animation: hrlgSelGlow 1.4s ease-in-out infinite; }
    @keyframes hrlgSelGlow {
      0%, 100% { filter: brightness(1.18) saturate(1.1); }
      50%      { filter: brightness(1.42) saturate(1.2); }
    }
    .hrlg-blade:hover:not(.dead):not(.muted) .hrlg-body { filter: brightness(1.3) saturate(1.15); }
    .hrlg-blade.sel .hrlg-blabel,
    .hrlg-blade:hover:not(.dead):not(.muted) .hrlg-blabel { color: #fff; text-shadow: 0 0 10px var(--bc-soft, var(--hfc-soft)); }
    .hrlg-blade:active:not(.dead):not(.muted) .hrlg-body { transform: skewX(-8deg) scale(0.985); }
    /* armed verb keeps pulsing while aiming */
    .hrlg-blade.active .hrlg-body { border-color: var(--bc, var(--hfc)); animation: hrlgActive 1.5s ease-in-out infinite; }
    @keyframes hrlgActive {
      0%, 100% { box-shadow: -2px 0 10px var(--bc-soft, var(--hfc-soft)), inset 3px 0 0 var(--bc, var(--hfc)); }
      50%      { box-shadow: -2px 0 24px var(--bc, var(--hfc)), inset 3px 0 0 var(--bc, var(--hfc)); }
    }
    /* the PENDING (✓ picked) target row reads unmistakably armed: green
       edge + glow, whatever else is going on in the list */
    .hrlg-blade.pend .hrlg-body {
      border-color: #57d98a; border-left-color: #57d98a;
      box-shadow: -2px 0 22px rgba(87,217,138,0.4), inset 3px 0 0 #57d98a;
      animation: hrlgPendPulse 1.2s ease-in-out infinite;
    }
    @keyframes hrlgPendPulse {
      0%, 100% { box-shadow: -2px 0 14px rgba(87,217,138,0.3), inset 3px 0 0 #57d98a; }
      50%      { box-shadow: -2px 0 28px rgba(87,217,138,0.65), inset 3px 0 0 #57d98a; }
    }
    .hrlg-blade.dead { cursor: default; }
    /* .dead = inert; .ghost = greyed but still clickable (opens the list so
       it can explain itself). Disabled rows are flat, desaturated,
       DASHED-edged and carry a red reason tag — categorically different
       from live rows, which always keep their color. */
    .hrlg-blade.dead .hrlg-body, .hrlg-blade.ghost .hrlg-body {
      background: #0a0a09; border-color: rgba(200,192,165,0.12);
      border-left: 3px dashed #55524a;
      filter: grayscale(1); opacity: 0.55;
    }
    .hrlg-blade.dead .hrlg-glyph, .hrlg-blade.dead .hrlg-blabel,
    .hrlg-blade.ghost .hrlg-glyph, .hrlg-blade.ghost .hrlg-blabel { color: #6a665a; text-shadow: none; }
    /* the red reason tag/subline stays readable even inside the washed-out row */
    .hrlg-blade.dead .hrlg-tag, .hrlg-blade.ghost .hrlg-tag,
    .hrlg-blade.dead .hrlg-subline, .hrlg-blade.ghost .hrlg-subline { filter: none; opacity: 1; color: #ff8a97; }
    /* ghost rows the cursor sits on still show they're interactive */
    .hrlg-blade.ghost.sel .hrlg-body { opacity: 0.75; border-color: rgba(255,255,255,0.35); }
    /* confirm flash sweeping along the row */
    .hrlg-flash {
      position: absolute; inset: 0; background: var(--bc, var(--hfc)); mix-blend-mode: screen;
      opacity: 0; pointer-events: none; clip-path: inherit;
    }
    .hrlg-blade.fire .hrlg-flash { animation: hrlgFire 0.35s ease-out; }
    @keyframes hrlgFire {
      0%   { opacity: 0.85; transform: translateX(0); }
      100% { opacity: 0;    transform: translateX(26px); }
    }
    /* ── THE CONFIRM BUTTON — big, green, impossible to miss. Docks on top
       of the active panel; clicking it fires the armed target pick. */
    .hrlg-confirm {
      position: relative; margin: 0 7px 0 5px; height: 46px; flex: none;
      display: flex; align-items: center; gap: 10px; padding: 0 22px 0 14px;
      pointer-events: auto; cursor: pointer; z-index: 3;
      background: linear-gradient(100deg, #123720 0%, #0c2414 100%);
      border: 1px solid #57d98a; border-left: 4px solid #57d98a;
      clip-path: polygon(9px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      transform: skewX(-8deg);
      animation: hrlgConfirmPulse 1.1s ease-in-out infinite;
    }
    .hrlg-confirm > * { transform: skewX(8deg); }
    .hrlg-confirm:hover { animation: none; filter: brightness(1.35); }
    .hrlg-confirm:active { transform: skewX(-8deg) translateY(2px); }
    @keyframes hrlgConfirmPulse {
      0%, 100% { box-shadow: -2px 0 14px rgba(87,217,138,0.35); }
      50%      { box-shadow: -2px 0 30px rgba(87,217,138,0.8); }
    }
    .hrlg-confirm-check {
      flex: none; width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #57d98a; color: #06130a; font-size: 15px; font-weight: 700;
      box-shadow: 0 0 12px rgba(87,217,138,0.8);
    }
    .hrlg-confirm-lbl {
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px;
      letter-spacing: 0.12em; color: #b8f5d0; white-space: nowrap;
      text-shadow: 0 0 12px rgba(87,217,138,0.6);
      overflow: hidden; text-overflow: ellipsis; max-width: 260px;
    }
    .hrlg-confirm-tgt { color: #fff; font-size: 12px; letter-spacing: 0.06em; }
    /* inline CONFIRM — the green seal at the END of the pending (✓) row */
    .hrlg-confirm-inline {
      flex: none; display: inline-flex; align-items: center; gap: 6px;
      height: 26px; padding: 0 10px; margin-right: -4px;
      cursor: pointer; pointer-events: auto;
      font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #b8f5d0;
      background: linear-gradient(100deg, #123720 0%, #0c2414 100%);
      border: 1px solid #57d98a;
      clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
      text-shadow: 0 0 8px rgba(87,217,138,0.6); white-space: nowrap;
      animation: hrlgConfirmPulse 1.1s ease-in-out infinite;
    }
    .hrlg-confirm-inline:hover { animation: none; filter: brightness(1.4); }
    .hrlg-confirm-inline:active { transform: translateY(1px); }
    .hrlg-confirm-inline-check {
      flex: none; width: 15px; height: 15px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: #57d98a; color: #06130a; font-size: 10px; font-weight: 700;
      box-shadow: 0 0 8px rgba(87,217,138,0.8);
    }
    /* ↩ BACK chip — corner of every sub-menu: ◀ pointing at the dimmed
       parent + the input glyph (right-click mouse / pad B) */
    .hrlg-backchip {
      align-self: flex-start; margin: 0 0 2px 6px; flex: none;
      display: inline-flex; align-items: center; gap: 6px;
      height: 24px; padding: 0 10px;
      cursor: pointer; pointer-events: auto; z-index: 3;
      font-size: 10px; font-weight: 700; letter-spacing: 0.16em; color: #ff9184;
      background: rgba(26,8,7,0.88);
      border: 1px solid rgba(255,74,60,0.55);
      clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
      text-shadow: 0 0 8px rgba(255,74,60,0.5);
      transition: filter 0.1s ease, transform 0.1s ease;
    }
    .hrlg-backchip:hover { filter: brightness(1.45); transform: translateX(-2px); }
    .hrlg-backchip:active { transform: translateX(-4px); }
    .hrlg-backchip-arrow { font-size: 11px; line-height: 1; animation: hrlgBackNudge 1.3s ease-in-out infinite; }
    @keyframes hrlgBackNudge {
      0%, 100% { transform: translateX(0); }
      50%      { transform: translateX(-2px); }
    }
    .hrlg-backchip-lbl { line-height: 1; padding-top: 1px; }
    .hrlg-backchip svg { color: #ffb3a8; }
    .hrlg-backchip .ew-padbtn { transform: scale(0.85); }
    .hrlg-backchip.lone { align-self: flex-end; margin: 0 0 4px 0; }
    /* panel-less aim states (move/jump): mode label + back chip column */
    .hrlg-lone { display: flex; flex-direction: column; align-items: stretch; pointer-events: auto; }
    /* root verbs: name + grey-out reason stacked inside one blade */
    .hrlg-lblcol {
      flex: 1; min-width: 0; display: flex; flex-direction: column;
      justify-content: center; gap: 2px;
    }
    .hrlg-lblcol .hrlg-blabel { flex: none; }
    .hrlg-subline {
      font-size: 8px; letter-spacing: 0.12em; color: #ff8a97; line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      text-shadow: 0 1px 1px rgba(0,0,0,0.8);
    }
    /* NOTE: device-size scaling folds into --ew-ui-scale via _applyUIScale()
       in ui.js. */

    /* ── whole-HUD fit: fixed panels shrink together on small screens ──
       --ew-hud-scale is 1 on desktop (panels stay their designed size) and
       drops toward ~0.5 on phones so the scoreboard / unit panel / log /
       minimap stop eating the battlefield. Corner-anchored transforms keep
       every panel pinned where it belongs. */
    .ew-unitpanel  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 0 0; }
    .ew-scoreboard { transform: translateX(-50%) scale(var(--ew-hud-scale, 1)) !important; transform-origin: 50% 0; }
    .ew-matchmeta  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 100% 0; }
    .ew-combatlog  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 100% 0; }
    #battleMinimap { display: none !important; }
    .battle-subtitle-text { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 50% 100%; }

    /* ══════════ SPELL DESCRIPTION BAR — SMT-style HELP strip ══════════
       One long, thin black bar pinned bottom-center. Gold/holo-blue
       hairline edges that fade out toward the ends; the black fill fades
       too. Describes the drum's selected (or hovered) ability. */
    /* Anchored bottom-CENTER, spanning the width of the screen like a classic
       SMT help strip. The Horologe rig is lifted above it (see .hrlg-rig)
       so the two never overlap. */
    #ew-spell-descbar {
      position: fixed; left: 50%; bottom: 10px; z-index: 60;
      width: min(1100px, 92vw);
      transform: translateX(-50%) scale(var(--ew-ui-scale, 1));
      transform-origin: 50% 100%;
      pointer-events: none; opacity: 0;
      transition: opacity 0.16s ease;
      font-family: 'DotGothic16', monospace;
    }
    #ew-spell-descbar.show { opacity: 1; }
    #ew-spell-descbar::before, #ew-spell-descbar::after {
      content: ''; position: absolute; left: 0; right: 0; height: 1px; z-index: 1;
      background: linear-gradient(90deg,
        rgba(216,210,190,0) 0%, rgba(216,210,190,0.65) 16%,
        rgba(255,74,60,0.9) 50%,
        rgba(216,210,190,0.65) 84%, rgba(216,210,190,0) 100%);
      filter: drop-shadow(0 0 5px rgba(255,74,60,0.35));
    }
    #ew-spell-descbar::before { top: 0; }
    #ew-spell-descbar::after  { bottom: 0; }
    .ew-descbar-inner {
      min-height: 46px; padding: 8px 30px;
      display: flex; align-items: center; justify-content: center;
      gap: 14px; flex-wrap: wrap; row-gap: 4px;
      background: linear-gradient(90deg,
        rgba(7,7,6,0) 0%, rgba(7,7,6,0.9) 6%,
        rgba(7,7,6,0.94) 94%, rgba(7,7,6,0) 100%);
    }
    .ew-descbar-name {
      font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700;
      color: #eceadd; letter-spacing: 0.06em; white-space: nowrap;
      text-shadow: 0 0 10px rgba(255,74,60,0.3), 0 1px 2px rgba(0,0,0,0.9);
    }
    .ew-descbar-desc {
      font-size: 12px; line-height: 1.45; color: #d9d5c6;
      text-shadow: 0 1px 2px rgba(0,0,0,0.85);
      max-width: 52%;
    }
    .ew-descbar-stats {
      font-size: 10px; letter-spacing: 0.08em; color: #979181; white-space: nowrap;
    }
    .ew-descbar-status { font-size: 10px; color: #c89ee0; white-space: nowrap; }
    @media (max-width: 760px) {
      .ew-descbar-inner { padding: 6px 26px; gap: 8px; }
      .ew-descbar-desc { max-width: 100%; }
    }

    /* ── Combat subtitles: lifted to the TOP (under the scoreboard) so they
       never cover the command panels at the bottom of the screen. */
    .battle-subtitle-bar {
      bottom: auto !important;
      top: calc(14px + 104px * var(--ew-hud-scale, 1)) !important;
      align-items: flex-start !important;
    }
  `;
  document.head.appendChild(style);
}

function _removeHudHideStyles() {
  const el = document.getElementById('reactHudHideStyles');
  if (el) el.remove();
}

let _hudPhaseObserver = null;
function _watchPhaseForHud() {

  setInterval(() => {
    const G = window.GAME;
    if (!G) return;
    const phase = G.state.phase;
    const mounted = !!document.getElementById('reactHudRoot');
    if (phase === 'battle' && !mounted) {
      mountReactHUD();
    } else if (phase !== 'battle' && mounted) {
      unmountReactHUD();
    }
  }, 500);
}

_watchPhaseForHud();
