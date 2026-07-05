const h = React.createElement;
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const EW = {
  bg:       '#06070c',
  panel:    'rgba(8,10,18,0.82)',
  panelEdge:'rgba(120,140,180,0.16)',
  panelEdgeHi:'rgba(180,200,240,0.32)',
  ink:      '#e6e9f2',
  inkMute:  '#8a93a8',
  inkDim:   '#555c70',
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
    background: 'linear-gradient(' + base + '22,' + base + '22), rgba(9,11,17,0.82)',
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
    return () => { window.removeEventListener('ew-state-change', handler); };
  }, []);

  const G = window.GAME;
  if (!G) return [null, tick];
  return [G.state, tick];
}

/* ── Menu visibility gate ─────────────────────────────────────────
   The action menu (and every sub/quick panel) must VANISH the instant
   the board goes live — walk animations, spell VFX, camera travel,
   projectiles, deaths — and only return once the dust settles. This
   mirrors the exact signals the engine's own _waitForAnimationsThen
   turn loop watches, surfaced via GAME.boardBusy(). */
function _hudBoardBusy(st) {
  if (!st) return false;
  if (st._walkAnimActive) return true;          // set by battle.js + online.js walks
  const G = window.GAME;
  try {
    if (G && typeof G.boardBusy === 'function') return !!G.boardBusy();
    // Fallbacks for an older battle.js that doesn't export boardBusy yet:
    if (st.units && st.units.some(u => u._dying)) return true;
    if (G && G._camera && typeof G._camera.isBusy === 'function' && G._camera.isBusy()) return true;
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
  window._hrlgHoldUntil = performance.now() + (ms || 450);
  try { window.dispatchEvent(new Event('ew-state-change')); } catch (_) {}
};

// True while menus should hide. Re-renders only on hidden↔shown
// transitions; a light 110ms boolean poll catches animations that start
// or end without dispatching a state-change event.
function useMenusHidden(st) {
  const [, setN] = useState(0);
  const ref = useRef({ lastBusy: 0, hidden: false });
  const now = performance.now();
  if (_hudBoardBusy(st)) ref.current.lastBusy = now;
  const LINGER = 180;   // debounce so back-to-back anims don't strobe the menu
  const hidden = (now - ref.current.lastBusy < LINGER) || (window._hrlgHoldUntil || 0) > now;
  ref.current.hidden = hidden;
  useEffect(() => {
    const iv = setInterval(() => {
      const t = performance.now();
      if (_hudBoardBusy(window.GAME && window.GAME.state)) ref.current.lastBusy = t;
      const next = (t - ref.current.lastBusy < LINGER) || (window._hrlgHoldUntil || 0) > t;
      if (next !== ref.current.hidden) setN(n => n + 1);
    }, 110);
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

function ActiveUnitPanel({ unit }) {
  if (!unit) return null;
  const ac = getAllianceColor(unit);
  const tc = getTypeColor(unit);
  const typeName = getTypeName(unit);
  const maxAP = typeof getUnitMaxAP === 'function' ? getUnitMaxAP(unit) : 3;
  const level = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
  const slot = unit._partySlot || unit.slot || 1;
  const roman = ['I','II','III','IV','V','VI','VII','VIII'][slot - 1] || slot;
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const isFriendly = unit.player === viewer;
  const playerTag = 'P' + (unit.player || 1);

  return h(ClipPanel, {
    factionColor: ac,
    className: 'ew-unitpanel',
    style: {
      position: 'absolute', top: 12, left: 12, width: 300,
      padding: '8px 12px 10px', display: 'flex', gap: 10, zIndex: 10,
    },
  },

    h('div', { style: { position: 'relative', flexShrink: 0 }},
      h(UnitSprite, { unit, size: 52, glow: true }),
      h('div', { style: {
        position: 'absolute', top: 1, left: 3,
        fontFamily: '"Cinzel", serif', fontStyle: 'italic',
        fontSize: 11, color: ac, letterSpacing: '0.05em',
      }}, roman),
    ),

    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }},
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }},

        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 9,
          color: '#000', letterSpacing: '0.08em', fontWeight: 700,
          background: ac, padding: '1px 5px', lineHeight: '14px',
        }}, playerTag),
        h('span', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 20,
          fontWeight: 500, lineHeight: 1, color: EW.ink, letterSpacing: '0.01em',
        }}, typeof unitDisplayName === 'function' ? unitDisplayName(unit) : (unit.name || unit.cls)),
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: EW.inkMute, letterSpacing: '0.16em',
        }}, 'Lv' + level),
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }},
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: EW.inkMute, letterSpacing: '0.12em',
        }}, ((unit.race || '').toUpperCase()) + ' · ' + ((unit.cls || '').toUpperCase())),
        typeName && h(TypeChip, { name: typeName, color: tc }),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }},
        h(HudBar, { label: 'HP', val: unit.hp || 0, max: unit.maxHp || 1, color: unit.hp <= (unit.maxHp * 0.3) ? EW.bad : EW.good }),
        h(HudBar, { label: 'MP', val: unit.mp || 0, max: unit.maxMp || 1, color: EW.space }),
        h(HudBar, { label: 'AP', val: unit.ap || 0, max: maxAP, color: EW.time, pip: true,
          pressFlash: !!(unit._pressFlashAt && (Date.now() - unit._pressFlashAt) < 900) }),
      ),
    ),
  );
}

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

  if (id === 'tdm' || id === 'ffa') {
    return {
      id, label: mpMode.label,
      p1Score: p1Kills, p2Score: p2Kills,
      scoreLabel: 'KILLS',
      p1Sub: p1Alive + '/' + p1Total, p2Sub: p2Alive + '/' + p2Total,
      subLabel: 'ALIVE',
      p1Wins, p2Wins,
    };
  }
  if (id === 'gauntlet') {
    const r1 = typeof _gauntletReservesAlive === 'function' ? _gauntletReservesAlive(1) : 0;
    const r2 = typeof _gauntletReservesAlive === 'function' ? _gauntletReservesAlive(2) : 0;
    const b1 = (st.bench && st.bench[1]) ? st.bench[1].length : 0;
    const b2 = (st.bench && st.bench[2]) ? st.bench[2].length : 0;
    return {
      id, label: mpMode.label,
      p1Score: p1Kills, p2Score: p2Kills,
      scoreLabel: 'KILLS',
      p1Sub: (p1Alive + r1) + '/' + (p1Total + b1), p2Sub: (p2Alive + r2) + '/' + (p2Total + b2),
      subLabel: 'ALIVE',
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

  const ARENA_PTS = { kill: 15, towerDmgPer10: 1, hourglass: 40, nexusRound: 3 };
  function _arenaScore(p) {
    const enemy = p === 1 ? 2 : 1;
    let pts = 0;
    pts += p1Kills * ARENA_PTS.kill;
    const eTw = st.towers && st.towers[enemy];
    let tDmg = 0;
    if (eTw) tDmg = Math.max(0, (eTw.maxHp || 1500) - eTw.hp);
    pts += Math.floor(tDmg / 10) * ARENA_PTS.towerDmgPer10;
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
    return pts;
  }

  const p1ArenaKills = p1Kills * ARENA_PTS.kill;
  const p2ArenaKills = p2Kills * ARENA_PTS.kill;
  function _fullArenaScore(p) {
    const enemy = p === 1 ? 2 : 1;
    const kills = (st.matchKills ? (st.matchKills[p] || 0) : 0);
    let pts = kills * ARENA_PTS.kill;
    const eTw = st.towers && st.towers[enemy];
    if (eTw) pts += Math.floor(Math.max(0, (eTw.maxHp || 1500) - eTw.hp) / 10) * ARENA_PTS.towerDmgPer10;
    if (st.hourglasses) {
      pts += st.hourglasses.filter(hg => {
        if (!hg.carriedBy) return false;
        const c = (st.units || []).find(u => u.id === hg.carriedBy);
        return c && !c.dead && c.player === p;
      }).length * ARENA_PTS.hourglass;
    }
    pts += (st._arenaNexusControl && st._arenaNexusControl[p] || 0) * ARENA_PTS.nexusRound;
    return pts;
  }

  const p1Tower = st.towers && st.towers[1];
  const p2Tower = st.towers && st.towers[2];
  const p1TowerHp = p1Tower ? Math.max(0, p1Tower.hp) : 0;
  const p1TowerMax = p1Tower ? (p1Tower.maxHp || 1500) : 0;
  const p2TowerHp = p2Tower ? Math.max(0, p2Tower.hp) : 0;
  const p2TowerMax = p2Tower ? (p2Tower.maxHp || 1500) : 0;

  return {
    id: 'arena', label: 'Arena',
    p1Score: _fullArenaScore(1), p2Score: _fullArenaScore(2),
    scoreLabel: 'ARENA',
    showTowerHp: true,
    p1TowerHp, p1TowerMax, p2TowerHp, p2TowerMax,
    p1Wins, p2Wins,
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
  });
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
  const hpColor = hpPct <= 30 ? EW.bad : (hpPct <= 55 ? EW.warn : EW.good);
  const name = typeof unitDisplayName === 'function' ? unitDisplayName(u) : (u.name || u.cls);

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
          background: 'linear-gradient(90deg, ' + hpColor + ', ' + hpColor + 'aa)',
          boxShadow: '0 0 4px ' + hpColor + '66', transition: 'width 0.35s ease-out',
        }}),
      ),
      u.maxMp > 0 && h('div', { style: {
        height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden',
      }},
        h('div', { style: {
          position: 'absolute', top: 0, left: 0, bottom: 0, width: mpPct + '%',
          background: EW.space, opacity: 0.75, transition: 'width 0.35s ease-out',
        }}),
      ),
    ),

    h('div', { style: { height: 9, display: 'flex', alignItems: 'center' }},
      active && h('span', { style: {
        fontFamily: '"Cinzel", serif', fontStyle: 'italic', fontSize: 8, lineHeight: 1,
        color: ac, letterSpacing: '0.04em', textShadow: '0 0 6px ' + ac + '88',
      }}, 'NOW'),
    ),
  );
}

function TurnFlank({ st, player, side }) {
  const data = _scoreboardTurnData(st).filter(e => e.unit.player === player);
  data.sort((a, b) => (a.sortKey - b.sortKey) || ((b.unit.spd || 0) - (a.unit.spd || 0)));
  if (data.length === 0) return null;

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
    e, size: e.active ? active : (i === 0 ? inner : small),
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

/* One team's column: name + live status on top, the turn-ordered portrait
   flank below (soonest-to-act nearest the centre score). */
function ScoreSideColumn({ st, mode, player, side, color }) {
  const isRight = side === 'right';
  const mono = '"DotGothic16", monospace';
  const name = (st._teamNames && st._teamNames[player]) || ('P' + player);
  const sub = player === 1 ? mode.p1Sub : mode.p2Sub;
  const showTower = mode.showTowerHp;
  const towerHp = player === 1 ? mode.p1TowerHp : mode.p2TowerHp;
  const towerMax = player === 1 ? mode.p1TowerMax : mode.p2TowerMax;
  const towerPct = towerMax > 0 ? (towerHp / towerMax) * 100 : 0;
  const towerColor = towerPct > 50 ? EW.good : towerPct > 25 ? EW.warn : EW.bad;

  return h('div', { style: {
    display: 'flex', flexDirection: 'column', gap: 5,
    padding: '7px 11px 6px', minWidth: 92,
    justifyContent: 'center',
    alignItems: isRight ? 'flex-start' : 'flex-end',
  }},

    h('div', { style: {
      display: 'flex', alignItems: 'center', gap: 6,
      flexDirection: isRight ? 'row' : 'row-reverse',
    }},
      h('span', { style: {
        width: 5, height: 5, background: color, borderRadius: '50%',
        boxShadow: '0 0 7px ' + color, flexShrink: 0,
      }}),
      h('span', { style: {
        fontFamily: mono, fontSize: 13, letterSpacing: '0.14em',
        color: EW.ink, fontWeight: 600, whiteSpace: 'nowrap',
      }}, name),
      sub != null && !showTower && h('span', { style: {
        fontFamily: mono, fontSize: 11, color: EW.inkMute, letterSpacing: '0.06em', whiteSpace: 'nowrap',
      }}, sub + (mode.subLabel ? ' ' + mode.subLabel : '')),
    ),

    showTower && towerMax > 0 && h('div', { style: {
      width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
      alignItems: isRight ? 'flex-start' : 'flex-end',
    }},
      h('div', { style: { width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', position: 'relative' }},
        h('div', { style: {
          position: 'absolute', top: 0, bottom: 0, [isRight ? 'left' : 'right']: 0,
          width: towerPct + '%',
          background: 'linear-gradient(90deg, ' + towerColor + ', ' + towerColor + '88)',
          boxShadow: '0 0 6px ' + towerColor + '55',
        }}),
      ),
      h('span', { style: {
        fontFamily: mono, fontSize: 9, color: EW.inkMute, letterSpacing: '0.08em',
      }}, '🏰 ' + towerHp + '/' + towerMax),
    ),

    h(TurnFlank, { st, player, side }),
  );
}

function Scoreboard({ st }) {
  if (!st) return null;

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

  return h('div', {
    className: 'ew-scoreboard',
    style: {
      position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'stretch', zIndex: 10,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      boxShadow: '0 6px 28px rgba(0,0,0,0.5)',
      clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
    },
  },

    h('div', { className: 'ew-scoreboard-sheen', style: {
      position: 'absolute', top: 0, left: 12, right: 12, height: 1, pointerEvents: 'none',
      background: 'linear-gradient(90deg, transparent, ' + EW.space + '66, ' + EW.chaos + '66, transparent)',
    }}),

    h(ScoreSideColumn, { st, mode, player: 1, side: 'left', color: EW.space }),

    h('div', { style: {
      padding: '6px 16px 7px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 134,
      borderLeft: '1px solid ' + EW.panelEdge, borderRight: '1px solid ' + EW.panelEdge,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0.16))',
    }},

      h('span', { style: {
        fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', color: EW.inkMute,
        textTransform: 'uppercase', lineHeight: 1,
      }}, mode.label || ''),

      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8 }},
        h('span', { style: {
          fontFamily: serif, fontSize: 30, fontWeight: 400, lineHeight: 1,
          color: EW.ink, textShadow: '0 0 14px ' + EW.space + '66',
          minWidth: 22, textAlign: 'right',
        }}, mode.p1Score),
        h('span', { style: {
          fontFamily: serif, fontSize: 16, color: EW.inkDim, fontStyle: 'italic', lineHeight: 1,
        }}, '–'),
        h('span', { style: {
          fontFamily: serif, fontSize: 30, fontWeight: 400, lineHeight: 1,
          color: EW.ink, textShadow: '0 0 14px ' + EW.chaos + '66',
          minWidth: 22, textAlign: 'left',
        }}, mode.p2Score),
      ),

      h('span', { className: isSuddenDeath ? 'ew-sudden-death' : undefined, style: {
        fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', lineHeight: 1,
        color: isSuddenDeath ? EW.bad : EW.inkMute,
        textShadow: isSuddenDeath ? '0 0 8px ' + EW.bad : 'none',
      }}, isSuddenDeath ? '⚡ SUDDEN DEATH' : scoreCaption),

      h('div', { style: {
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 3,
        paddingTop: 4, borderTop: '1px solid ' + EW.panelEdge,
        width: '100%', justifyContent: 'center',
      }},
        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1 }},
          h('span', { style: { fontFamily: mono, fontSize: 8, letterSpacing: '0.2em', color: EW.inkMute }}, 'TIME'),
          h('span', { style: { fontFamily: mono, fontSize: 16, fontWeight: 700, color: EW.ink }}, mins + ':' + secs),
        ),
        h('span', { style: { width: 1, height: 24, background: EW.panelEdge }}),
        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1 }},
          h('span', { style: { fontFamily: mono, fontSize: 8, letterSpacing: '0.2em', color: EW.inkMute }}, 'ROUND'),
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 1 }},
            h('span', { style: {
              fontFamily: serif, fontSize: 20, fontWeight: 600, color: EW.time, lineHeight: 1,
              textShadow: '0 0 10px ' + EW.time + '55',
            }}, round),
            roundLimit > 0 && h('span', { style: {
              fontFamily: mono, fontSize: 11, color: EW.inkMute,
            }}, '/' + roundLimit),
          ),
        ),
      ),
    ),

    h(ScoreSideColumn, { st, mode, player: 2, side: 'right', color: EW.chaos }),
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

  return h('div', { className: 'ew-matchmeta', style: {
    position: 'absolute', top: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 6,
    alignItems: 'flex-end', zIndex: 10,
  }},
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
                background: hpPct <= 30 ? EW.bad : EW.good,
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
              color: hpPct <= 30 ? EW.bad : EW.good, fontWeight: 600,
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
function HorologeHub({ factionKey, api }) {
  const minRef = useRef(null), hourRef = useRef(null), secRef = useRef(null);
  const ticksRef = useRef(null), chimeARef = useRef(null), chimeBRef = useRef(null);
  const A = useRef({ min: HRLG_REST.min, hour: HRLG_REST.hour, sec: 0, paused: false });

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
          h('stop', { offset: '0%', stopColor: '#10141f' }),
          h('stop', { offset: '70%', stopColor: '#080a12' }),
          h('stop', { offset: '100%', stopColor: '#05060b' }),
        ),
        h('clipPath', { id: 'hrlgMapClip' }, h('circle', { cx: 100, cy: 100, r: 56 })),
      ),
      h('circle', { cx: 100, cy: 100, r: 96, fill: 'url(#hrlgFaceG)', stroke: 'var(--hfc-soft)', strokeWidth: 1 }),
      h('circle', { cx: 100, cy: 100, r: 98, fill: 'none', stroke: 'var(--hfc)', strokeWidth: 0.8, opacity: 0.5 }),
      h('circle', { cx: 100, cy: 100, r: 57, fill: 'none', stroke: 'var(--hfc)', strokeWidth: 0.6, opacity: 0.22 }),
      h('g', { clipPath: 'url(#hrlgMapClip)' },
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
  }, []);

  return h('div', { className: 'hrlg-hub' },
    h('svg', { viewBox: '0 0 200 200' },
      plate,
      h('g', { ref: hourRef, className: 'hrlg-hour' },
        h('path', { d: 'M100,111 L96.9,100 L98.9,62 L100,56 L101.1,62 L103.1,100 Z', fill: 'var(--hfc)', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 0.5 }),
        h('path', { d: 'M99.3,96 L99.3,68 L100.7,68 L100.7,96 Z', fill: '#06070c', opacity: 0.8 }),
      ),
      h('g', { ref: minRef, className: 'hrlg-min' },
        h('path', { d: 'M100,113 L97.8,100 L99.4,30 L100,24 L100.6,30 L102.2,100 Z', fill: EW.ink, stroke: 'rgba(255,255,255,0.35)', strokeWidth: 0.4 }),
        h('path', { d: 'M99.4,95 L99.4,38 L100.6,38 L100.6,95 Z', fill: '#06070c', opacity: 0.8 }),
      ),
      h('g', { ref: secRef, className: 'hrlg-sec' },
        h('line', { x1: 100, y1: 118, x2: 100, y2: 18, stroke: EW.bad, strokeWidth: 1.1 }),
        h('circle', { cx: 100, cy: 113, r: 3.2, fill: 'none', stroke: EW.bad, strokeWidth: 1.1 }),
      ),
      h('circle', { cx: 100, cy: 100, r: 4.6, fill: '#0a0c15', stroke: 'var(--hfc)', strokeWidth: 1.3 }),
      h('circle', { cx: 100, cy: 100, r: 1.7, fill: 'var(--hfc)' }),
    ),
    h('div', { ref: chimeARef, className: 'hrlg-chime' }),
    h('div', { ref: chimeBRef, className: 'hrlg-chime' }),
  );
}

// ── Carousel slots ──────────────────────────────────────────────
// The menu is a vertical drum of STRAIGHT blades stacked against the
// clock. A sliding FOCUS WINDOW of HRLG_FOCUS_WIN rows is fully lit
// and clickable (one click fires); the SELECTED row inside it (the
// keyboard/wheel cursor) is bigger and brightest. One extra row peeks
// past each window edge, faded — clicking a faded row rotates it into
// the window (Persona-style). Each row's left edge hugs the bezel's
// curve. The drum is a LADDER with a hard top and bottom — it does
// NOT wrap around; scrolling past an end bumps.
const HRLG_ROW = 44;    // vertical pitch of the stack (spell rows pass taller)
const HRLG_HUG = 97;    // circle radius the blade edges follow
const HRLG_TUCK = 14;   // how far each blade tucks under the bezel
const HRLG_FOCUS_WIN = 4;   // rows that stay fully lit + directly clickable
function _hrlgSlot(off, rowH, focused, sel) {
  const rh = rowH || HRLG_ROW;
  const c = Math.max(-4.5, Math.min(5.5, off));
  const ty = c * rh;   // css downward+
  // Rows past the bezel circle's vertical reach ride a fixed chord so the
  // faded overflow rows don't dive underneath the clock face.
  const tyC = Math.min(Math.abs(ty), HRLG_HUG * 0.92);
  const x = Math.sqrt(Math.max(HRLG_HUG * HRLG_HUG - tyC * tyC, 0));
  const base = { tx: x - HRLG_TUCK, ty };
  if (sel)     return { ...base, op: 1, s: 1.12, z: 7 };
  if (focused) return { ...base, op: 1, s: 1.0,  z: 5 };
  // distance past the nearest window edge: 1 row peeks, the rest are gone
  const dEdge = Math.abs(off) - (HRLG_FOCUS_WIN - 1) / 2;
  if (dEdge <= 1.05) return { ...base, op: 0.35, s: 0.85, z: 3 };
  return { ...base, op: 0, s: 0.8, z: 1 };
}

// One blade of the drum. EVERY menu — root verbs, abilities, items,
// targets, quick actions — renders through this, so they all read as
// one instrument. Item fields beyond the basics:
//   power {v,color}  colored damage/heal chip      mp     MP cost chip
//   cost             AP cost as diamond pips       count  stack (×2)
//   meta {text,color} dim right-side info (hp%/dist)
//   note             amber chip (MOVE→CAST)        sub    red reason tag
//   check            pending-confirm ✓             hint   key hint (SPACE)
//   iconColor        glyph tint override           forceLive  clickable though !available
//   badges           second-line chips [{label,style,title,plain}] — the blade
//                    grows taller and shows them under the name (type badges!)
function HorologeBlade({ b, idx, off, rowH, focused, sel, active, fireId, onFire, onFocus, onHover }) {
  const dead = !b.available && !b.forceLive;         // truly inert
  const ghost = !b.available;                        // greyed look (may still be clickable)
  const tall = !!(b.badges && b.badges.length);
  const slot = _hrlgSlot(off, rowH, focused, sel);
  const right = [];
  if (b.check) right.push(h('span', { key: 'ck', className: 'hrlg-check' }, '✓'));
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
  if (b.sub) right.push(h('span', { key: 'sb', className: 'hrlg-tag' }, b.sub));
  // Type/delivery/range badges ride INLINE on the name row, sized to match
  // the ability name — they're primary intel, not fine print.
  const badgeRow = tall && h('span', { className: 'hrlg-badges' },
    b.badges.map((bd, k) => bd.plain
      ? h('span', { key: k, className: 'hrlg-cfree', title: bd.title || undefined }, bd.label)
      : h('span', { key: k, style: bd.style, title: bd.title || undefined }, bd.label)),
  );
  return h('div', {
    className: 'hrlg-blade'
      + (dead ? ' dead' : '')
      + (ghost && !dead ? ' ghost' : '')
      + (tall ? ' tall' : '')
      + (focused ? ' center' : ' dim')
      + (sel ? ' sel' : '')
      + (active ? ' active' : '')
      + (fireId === b.id ? ' fire' : ''),
    style: {
      '--tx': slot.tx + 'px', '--ty': slot.ty + 'px', '--o': slot.op, '--s': slot.s,
      zIndex: slot.z,
      pointerEvents: slot.op === 0 ? 'none' : 'auto',
      animationDelay: (40 + idx * 40) + 'ms',
    },
    // Any focus-window blade confirms with one click; a faded overflow row
    // rotates itself into the window first — no accidental END TURNs, and
    // it matches the drum feel.
    onClick: focused ? (dead ? undefined : (e) => onFire(b, e)) : () => onFocus(b),
    onMouseEnter: focused ? (e) => onHover(b, true, e) : undefined,
    onMouseLeave: focused ? (e) => onHover(b, false, e) : undefined,
  },
    h('div', { className: 'hrlg-body' + (b.danger ? ' danger' : '') },
      h('span', { className: 'hrlg-glyph', style: b.iconColor ? { color: b.iconColor, textShadow: 'none' } : undefined }, b.icon),
      tall
        ? h(React.Fragment, null,
            // the NAME never shrinks — badges/chips clip first if space runs out
            h('span', { className: 'hrlg-blabel', style: { flex: '0 0 auto', maxWidth: 220 } }, b.label),
            badgeRow,
            h('span', { className: 'hrlg-spacer' }),
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

// Stateful shell for the whole menu — ActionMenu computes WHAT can be done
// and hands it to this component, which owns HOW it looks and moves.
// (Separate component so its hooks never sit behind ActionMenu's early
// returns.)
function HorologeMenu({ view, viewKey, title, blades, fc, factionKey, roman, unitName, unitKey, ap, maxAP, hp, maxHp, mp, maxMp, modeLabel, am, pushers, items, onItem, onAction, onEndTurn, onCancel }) {
  const clockApi = useRef({}).current;
  const rigRef = useRef(null);
  const [fireId, setFireId] = useState(null);
  const [hoverCost, setHoverCost] = useState(0);

  // spell blades carry inline badges → slightly taller rows, wider pitch
  const tall = blades.some(b => b.badges && b.badges.length);
  const rowH = tall ? 52 : HRLG_ROW;

  // ── Carousel selection: tracked by blade ID so the drum keeps its
  // heading when availability re-sorts costs or AP ticks re-render us.
  const [selId, setSelId] = useState(null);
  const carousel = blades.length > 1;
  let selIdx = carousel ? blades.findIndex(b => b.id === selId) : 0;
  if (selIdx < 0) {
    // default heading: the item the engine pre-targeted (pending ✓), else
    // the first live entry (attack if it's up); nothing left to do →
    // END TURN takes the center for a one-click finish
    selIdx = blades.findIndex(b => b.check);
    if (selIdx < 0) selIdx = blades.findIndex(b => b.available && b.id !== 'end');
    if (selIdx < 0) selIdx = blades.findIndex(b => b.id === 'end');
    if (selIdx < 0) selIdx = 0;
  }

  // ── Sliding focus window: HRLG_FOCUS_WIN rows fully lit + one-click,
  // the selection cursor moves inside it and drags it along at the edges
  // (classic scrolling list). Tracked in a ref (not state) so it can be
  // reconciled during render without an extra pass.
  const WIN = Math.min(HRLG_FOCUS_WIN, blades.length);
  const winRef = useRef(0);
  const winKeyRef = useRef(null);
  const _wk = unitKey + '|' + viewKey;
  if (winKeyRef.current !== _wk) { winKeyRef.current = _wk; winRef.current = 0; }
  let winStart = winRef.current;
  if (winStart > blades.length - WIN) winStart = Math.max(0, blades.length - WIN);
  if (selIdx < winStart) winStart = selIdx;
  else if (selIdx > winStart + WIN - 1) winStart = selIdx - WIN + 1;
  winRef.current = winStart;

  // a fresh unit or a different menu view takes the wheel → reset the drum
  useEffect(() => { setSelId(null); }, [unitKey, viewKey]);

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
      if (!dead && clockApi.aim) clockApi.aim(90);   // point at the center blade
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
    // firing a window row also moves the cursor there, so ENTER / the desc
    // bar keep tracking the blade the player actually used
    if (b.id !== 'end' && b.id !== 'cancel') setSelId(b.id);
    if (clockApi.strike) clockApi.strike(90);
    if (typeof playSfx === 'function') playSfx(b.id === 'end' ? 'uiConfirm' : b.id === 'cancel' ? 'uiCursorMove' : 'uiButtonConfirm');
    setFireId(b.id); setTimeout(() => setFireId(null), 460);
    if (rigRef.current && rigRef.current.animate) {
      rigRef.current.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
        { duration: 130, easing: 'ease-out' });
    }
    // Ending the turn kicks off camera + banner travel — drop the menu NOW
    // so the click visibly registered (it re-appears with the next unit).
    if (b.id === 'end' && typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(700);
    if (b.id === 'end') onEndTurn();
    else if (b.id === 'cancel') onCancel();
    else if (b.fire) b.fire();
    else onAction(b);
  };

  // rotate a clicked/scrolled neighbour into the center slot
  const focusBlade = (b) => {
    if (!b || b.id === selBlade?.id) return;
    setSelId(b.id);
    if (typeof playSfx === 'function') playSfx('uiCursorMove');
    if (clockApi.wind) clockApi.wind(30);   // the minute hand ticks with the drum
    if (typeof clearAttackRangePreview === 'function') clearAttackRangePreview();
    setHoverCost(0);
  };
  const selBlade = carousel ? blades[selIdx] : blades[0];

  // ── SMT-style description bar: the bottom bar always describes the
  // SELECTED (center) blade's spell; hover elsewhere overrides it briefly.
  // Driven straight from render (the bar is a plain DOM node outside React,
  // and _setSpellDescBase no-ops when the spell hasn't changed) — a mount
  // useEffect can lag a full frame behind the drum here.
  const selSpell = selBlade && selBlade.spell ? selBlade.spell : null;
  if (typeof _setSpellDescBase === 'function') _setSpellDescBase(selSpell);
  useEffect(() => () => { if (typeof _setSpellDescBase === 'function') _setSpellDescBase(null); }, []);

  // No wrap-around: the drum stops hard at the first and last entry.
  // Scrolling past an end gives a physical "bump" so the stop reads as
  // intentional, not broken.
  const cycle = (dir) => {
    if (!carousel) return;
    const next = selIdx + dir;
    if (next < 0 || next >= blades.length) {
      if (rigRef.current && rigRef.current.animate) {
        rigRef.current.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(' + (dir > 0 ? 4 : -4) + 'px)' }, { transform: 'translateY(0)' }],
          { duration: 130, easing: 'ease-out' });
      }
      return;
    }
    focusBlade(blades[next]);
  };

  // Scroll on the menu cycles the drum — and must NEVER fall through to the
  // board's camera-zoom wheel. React can't guarantee a non-passive wheel
  // listener, so bind natively on the rig root with passive:false.
  const cycleRef = useRef(cycle); cycleRef.current = cycle;
  useEffect(() => {
    const el = rigRef.current; if (!el) return;
    let lastT = 0;
    const onWheel = (e) => {
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (now - lastT < 90) return;   // one notch per gesture-step
      lastT = now;
      cycleRef.current(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ↑/↓ cycle the drum, ENTER fires the centered blade — full keyboard
  // play without stealing keys the game already uses (WASD/SPACE/ESC).
  const fireSelRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
  const baseAP = 3;   // UNIT_MAX_AP — pips past this are level-up bonus AP
  for (let i = 0; i < shown; i++) {
    const on = i < ap;
    const spend = on && hoverCost > 0 && i >= ap - hoverCost;
    pips.push(h('span', {
      key: i,
      className: 'hrlg-pip' + (on ? ' on' : '') + (spend ? ' spend' : '') + (i >= baseAP ? ' bonus' : ''),
    }));
  }

  // the crown — a stopwatch pusher on top of the clock. In any sub/quick/
  // aiming state it's the one, always-visible BACK control; at the root menu
  // there's nothing to back out of, so it doubles as END TURN instead.
  const backable = view !== 'root' || !!am;
  const pressCrown = () => {
    if (!backable) {
      // root view → END TURN (same ritual as firing the END TURN blade)
      if (typeof playSfx === 'function') playSfx('uiConfirm');
      if (clockApi.strike) clockApi.strike(90);
      if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(700);
      onEndTurn();
      return;
    }
    if (typeof playSfx === 'function') playSfx('uiBack');
    if (clockApi.wind) clockApi.wind(-360);   // unwind what the sub-menu wound
    onCancel();
  };

  // how many entries sit beyond the focus window
  const hiddenUp = carousel ? winStart : 0;
  const hiddenDn = carousel ? Math.max(0, blades.length - winStart - WIN) : 0;
  // vertical spot for the ▲/▼ overflow arrows, just past the peeking row
  const _arrowTy = ((WIN - 1) / 2 + 1.55) * rowH;

  return h('div', {
    ref: rigRef, className: 'hrlg-rig',
    style: { '--hfc': fc, '--hfc-soft': fc + '55', '--hfc-faint': fc + '1a' },
  },
    h('div', { className: 'hrlg-fan', key: viewKey },
      blades.map((b, i) => h(HorologeBlade, {
        key: b.id, b: b, idx: i, rowH: rowH,
        // rows are laid out relative to the WINDOW (its middle rides the
        // clock equator), so the lit rows hold still while content scrolls
        off: carousel ? (i - winStart - (WIN - 1) / 2) : 0,
        focused: !carousel || (i >= winStart && i < winStart + WIN),
        sel: !carousel || i === selIdx,
        active: b.id !== 'end' && b.id !== 'cancel' && (am === b.id || b.selected),
        fireId: fireId, onFire: fireBlade, onFocus: focusBlade, onHover: hoverBlade,
      })),
      // clickable overflow arrows: more options above / below the window
      hiddenUp > 0 && h('div', {
        className: 'hrlg-more-ind up',
        onClick: () => cycleRef.current(-1),
        title: hiddenUp + ' more above — scroll or click',
        style: { top: (-_arrowTy - 16) + 'px' },
      }, '▲ ' + hiddenUp + ' MORE'),
      hiddenDn > 0 && h('div', {
        className: 'hrlg-more-ind dn',
        onClick: () => cycleRef.current(1),
        title: hiddenDn + ' more below — scroll or click',
        style: { top: (_arrowTy + 2) + 'px' },
      }, '▼ ' + hiddenDn + ' MORE'),
    ),
    h(HorologeHub, { factionKey: factionKey, api: clockApi }),
    /* special-action pushers — extra stopwatch buttons riding the bezel.
       Only mounted when the action is actually usable RIGHT NOW, and they
       pulse so the player can't miss the opportunity. Root view only —
       they'd distract while browsing sub-menus or aiming. */
    view === 'root' && (pushers || []).slice(0, 3).map((p, i) => {
      const slot = [[-33, 107], [-63, 105], [33, 107]][i];
      const a = slot[0] * Math.PI / 180;
      return h('div', {
        key: p.id, className: 'hrlg-pusher',
        title: p.title || p.label,
        style: {
          '--pc': p.color, '--pc-soft': p.color + '66', '--pc-faint': p.color + '22',
          '--pang': slot[0] + 'deg',
          left: (103 + slot[1] * Math.sin(a)) + 'px',
          top: (240 - slot[1] * Math.cos(a)) + 'px',
        },
        onClick: () => {
          if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
          if (clockApi.strike) clockApi.strike(slot[0]);   // hands slam onto the pusher
          p.fire();
        },
      },
        h('span', { className: 'hrlg-pusher-cap' }, h('span', { className: 'hrlg-pusher-glyph' }, p.glyph)),
        h('span', { className: 'hrlg-pusher-lbl' }, p.label),
      );
    }),
    // Where-am-I tab riding the top of the clock: names the open menu
    // (ABILITIES / ITEMS / the clicked enemy…) in the same blade material.
    title && h('div', { className: 'hrlg-view-tab', key: 'tab|' + viewKey },
      title.node || h(React.Fragment, null,
        title.icon && h('span', { className: 'hrlg-view-tab-icon' }, title.icon),
        h('span', { className: 'hrlg-view-tab-text' }, title.text),
        title.count && h('span', { className: 'hrlg-view-tab-count' }, title.count),
      ),
    ),
    h('div', {
      className: 'hrlg-crown live' + (backable ? '' : ' endturn' + (ap <= 1 ? ' lastap' : '')),
      title: backable ? 'Back (ESC)' : 'End Turn (SPACE)',
      onClick: pressCrown,
    },
      h('span', { className: 'hrlg-crown-cap' }, h('span', { className: 'hrlg-crown-arrow' }, backable ? '◀' : '■')),
      h('span', { className: 'hrlg-crown-stem' }),
      h('span', { className: 'hrlg-crown-label' }, backable ? '◀ BACK' : '■ END TURN'),
    ),
    h('div', { className: 'hrlg-core' },
      h('span', { className: 'hrlg-roman' }, roman + ' · '),
      h('span', { className: 'hrlg-name' }, unitName),
    ),
    h('div', { className: 'hrlg-ap' },
      h('span', { className: 'hrlg-ap-lbl' }, 'AP'),
      pips,
      h('span', { className: 'hrlg-ap-num' }, ap + '/'),
      h('span', { className: 'hrlg-ap-num' + (maxAP > baseAP ? ' bonus' : '') }, maxAP),
    ),
    /* HP/MP vitals under the watch — the acting unit's pools at a glance,
       right where the player's eyes already are while picking an action. */
    maxHp > 0 && h('div', { className: 'hrlg-vitals' },
      (() => {
        const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        const hpCol = hpPct <= 30 ? EW.bad : hpPct <= 60 ? EW.warn : EW.good;
        return h('div', { className: 'hrlg-vbar' },
          h('span', { className: 'hrlg-vfill', style: { width: hpPct + '%', background: hpCol, boxShadow: '0 0 6px ' + hpCol + '66' } }),
          h('span', { className: 'hrlg-vlbl' }, 'HP'),
          h('span', { className: 'hrlg-vnum' }, Math.max(0, Math.round(hp)) + '/' + maxHp),
        );
      })(),
      maxMp > 0 && (() => {
        const mpPct = Math.max(0, Math.min(100, (mp / maxMp) * 100));
        return h('div', { className: 'hrlg-vbar mp' },
          h('span', { className: 'hrlg-vfill', style: { width: mpPct + '%', background: EW.space, boxShadow: '0 0 6px ' + EW.space + '66' } }),
          h('span', { className: 'hrlg-vlbl' }, 'MP'),
          h('span', { className: 'hrlg-vnum' }, Math.max(0, Math.round(mp)) + '/' + maxMp),
        );
      })(),
    ),
    /* 3 item slots under the vitals — one-click item use straight from the
       clock (the Items submenu still lists everything) */
    items && h('div', { className: 'hrlg-items' },
      [0, 1, 2].map(i => {
        const it = items[i];
        if (!it) return h('div', { key: 'empty' + i, className: 'hrlg-item-slot empty' },
          h('span', { className: 'hrlg-item-glyph' }, '·'));
        return h('div', {
          key: it.key,
          className: 'hrlg-item-slot' + (it.canUse ? '' : ' off') + (it.selected ? ' armed' : ''),
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
    modeLabel && h('div', { className: 'hrlg-mode' }, modeLabel),
    carousel && blades.length > 3 && h('div', { className: 'hrlg-scroll-hint' },
      '⭥ ' + (selIdx + 1) + '/' + blades.length),
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
  damage: { icon: '⚔', color: '#ee6655' },
  heal:   { icon: '♥', color: '#55cc66' },
  buff:   { icon: '▲', color: '#55aaff' },
  debuff: { icon: '▼', color: '#cc77dd' },
  utility:{ icon: '◎', color: '#ccaa55' },
};

// Inline badges with a clear hierarchy: the TYPE badge (HUMAN/TECH/…)
// rides the name row at name size — it's the matchup intel. Delivery
// (PHYSICAL/MAGIC/UTILITY) and range class (MELEE/RANGED) are secondary
// and stay small, dim chips so they don't compete with the name.
const _HRLG_TYPE_FS = 11;
const _HRLG_TYPE_PAD = '2px 8px';
const _HRLG_SUB_FS = 8;
const _HRLG_SUB_PAD = '1px 5px';
function _hrlgSpellBadges(sp, cat, compact) {
  const badges = [];
  if (sp.spellType) badges.push({
    label: sp.spellType.toUpperCase(),
    style: typeBadgeStyleFor(sp.spellType, { fontSize: _HRLG_TYPE_FS, padding: _HRLG_TYPE_PAD }),
    title: 'Spell type — drives type advantage',
  });
  if (compact) return badges;   // quick menus carry lots of chips already
  const _db = spellDeliveryBadge(sp, cat);
  badges.push({ label: _db.label, style: Object.assign(typeBadgeStyle(_db.color, { fontSize: _HRLG_SUB_FS, padding: _HRLG_SUB_PAD }), { opacity: 0.85 }) });
  const _rb = spellRangeBadge(sp);
  badges.push({ label: _rb.glyph + ' ' + _rb.label, style: Object.assign(typeBadgeStyle(_rb.color, { fontSize: _HRLG_SUB_FS, padding: _HRLG_SUB_PAD }), { opacity: 0.85 }), title: _rb.title });
  return badges;
}

function _hrlgSpellBlades(unit, st) {
  const am = st.actionMode;
  const spells = [...(unit.spells || []), ...(unit._raceAbilities || [])].filter(Boolean);
  const mpPenalty = typeof unitHasStatus === 'function' && unitHasStatus(unit, 'silence') ? 999 : 0;
  const tierOrder = { 'I': 1, 'II': 2, 'III': 3 };

  const _isAvail = (sp) => {
    const cost = sp.cost || 0;
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
  spells.sort((a, b) => {
    const aAvail = _availOf(a) ? 0 : 1;
    const bAvail = _availOf(b) ? 0 : 1;
    if (aAvail !== bAvail) return aAvail - bAvail;
    return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
  });

  let castableCount = 0;
  const blades = spells.map((sp, i) => {
    const cost = sp.cost || 0;
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
      if (isSilenced) reason = 'Silenced';
      else if (!tierOk) { const trl = sp.tier === 'II' ? 2 : sp.tier === 'III' ? 3 : 1; reason = 'Req Lv.' + trl; }
      else if (cdLeft > 0) reason = '⏳ CD ' + cdLeft;
      else if (unit.mp < cost) reason = 'No MP';
      else if ((unit.ap || 0) < apCost) reason = 'No AP';
      else if (!hasTarget) reason = 'No target';
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
    return {
      id: 'it:' + itemKey,
      icon: rules?.icon || '❖',
      label: rules?.name || itemKey,
      available: canUse,
      selected: am === 'item' && st.selectedTool === itemKey,
      count: '×' + count,
      sub: reason || null,
      fire: () => { if (canUse && typeof chooseItemAction === 'function') chooseItemAction(itemKey); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '❖', label: 'No items', available: false });
  return { title: { icon: '❖', text: 'Items', count: heldKeys.length + '' }, blades };
}

// The More list items keep their existing "emoji label" convention —
// split the leading glyph off so it lands in the blade's icon slot.
function _hrlgMoreBlade(item, i, am) {
  const m = /^(\S+)\s+(.*)$/.exec(item.label || '');
  return {
    id: 'more:' + i + ':' + (item.label || ''),
    icon: m ? m[1] : '·',
    label: m ? m[2] : (item.label || ''),
    available: !item.dim,
    selected: !!item.active,
    sub: item.dim ? (item.sub || 'Unavailable') : null,
    hint: !item.dim ? item.sub : null,
    fire: item.onClick,
  };
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
      meta: { text: hpPct + '%', color: hpPct <= 30 ? EW.bad : EW.good },
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

    let typeAdv = '';
    if (tUnit && isOffensive && typeof getTypeEffectSummary === 'function') {
      const adv = getTypeEffectSummary(unit.types || [], tUnit.types || []);
      typeAdv = adv.hasStrong && !adv.hasWeak ? '▲' : adv.hasWeak && !adv.hasStrong ? '▼' : '';
    }
    const hpPct = hpMax > 0 ? Math.max(0, Math.round((hpVal / hpMax) * 100)) : null;
    const tz = (tUnit && tUnit.z != null) ? tUnit.z : undefined;

    return {
      id: 'tg:' + i + ':' + t.x + ',' + t.y,
      icon: typeAdv || '⌖',
      iconColor: typeAdv === '▲' ? EW.good : typeAdv === '▼' ? EW.bad : undefined,
      label: label,
      available: true,
      check: !!isPending,
      meta: { text: (hpPct != null ? hpPct + '% · ' : '') + t.dist + 't', color: hpPct != null && hpPct <= 30 ? EW.bad : undefined },
      // Pass the target's own elevation so an airborne unit (or the upper
      // unit of a stack) is hit — not whoever stands on the ground below.
      // Second (confirming) click fires the action → hide the menus NOW.
      fire: () => {
        if (isPending && typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction();
        if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(t.x, t.y, tz);
      },
    };
  });
  if (!blades.length) {
    blades.push({
      id: 'none', icon: titleIcon, available: false,
      label: (mode === 'attack' && typeof attackHasReachableTarget === 'function' && attackHasReachableTarget(unit))
        ? 'Click an enemy to move + attack' : 'No targets in range',
    });
  }
  return { title: { icon: titleIcon, text: titleText, count: targets.length + '' }, blades };
}

function _hrlgMoreBlades(unit, st) {
  const am = st.actionMode;
  const moreItems = [];

  if ((unit.ap || 0) >= 2) {
    moreItems.push({ label: '🛡 Guard', sub: '2 AP', onClick: () => { if (typeof doGuard === 'function' && typeof getSelectedUnit === 'function') doGuard(getSelectedUnit()); } });
  }

  if (typeof _isGauntlet === 'function' && _isGauntlet()) {
    const reserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(unit.player) : [];
    const switchCost = (typeof getActiveMultiplayerMode === 'function' && getActiveMultiplayerMode()?.switchApCost) || 2;
    const canSwitch = reserves.length > 0 && (unit.ap || 0) >= switchCost;
    moreItems.push({
      label: '🔄 Switch',
      sub: reserves.length === 0 ? 'No reserves' : `${switchCost} AP`,
      dim: !canSwitch,
      onClick: () => { if (canSwitch && typeof chooseActionMenu === 'function') chooseActionMenu('switch'); },
    });
  }

  const apc = typeof getActionPanelCache === 'function' ? getActionPanelCache(unit) : {};
  if (apc.hasInspect) {
    moreItems.push({ label: '🔍 Inspect', onClick: () => { if (typeof setActionMode === 'function') setActionMode('inspect'); }, active: am === 'inspect' });
  }
  if (apc.hasInspect && (unit.ap || 0) >= 1) {
    moreItems.push({ label: '🔍 Inspect Here', sub: '1 AP', onClick: () => { if (typeof doInspect === 'function' && typeof getSelectedUnit === 'function') doInspect(getSelectedUnit(), unit.x, unit.y); } });
  }

  if (apc.canTrade) {
    moreItems.push({ label: '🔄 Trade', onClick: () => { if (typeof setActionMode === 'function') setActionMode('trade'); }, active: am === 'trade' });
  }

  if (typeof unitHasWard === 'function' && unitHasWard(unit) && !unit._usedWard) {
    moreItems.push({ label: '👁 Ward', onClick: () => { if (typeof setActionMode === 'function') setActionMode('ward'); }, active: am === 'ward' });
  }

  moreItems.push({ label: '📍 Ping', onClick: () => { if (typeof chooseActionMenu === 'function') chooseActionMenu('pings'); } });

  if (typeof canFly === 'function' && canFly(unit)) {
    if (typeof canChangeAltitude === 'function') {
      const _groundZ = typeof getHeightAt === 'function' ? getHeightAt(unit.x, unit.y) : 0;
      const _unitZ = unit.z ?? 0;
      const _isAirborne = _unitZ > _groundZ;
      if (_isAirborne) {
        const canDesc = canChangeAltitude(unit, 'descend');
        if (canDesc.ok) moreItems.push({ label: '⬇ Land', sub: '1 AP', onClick: () => { if (typeof doAltitudeChange === 'function' && typeof getSelectedUnit === 'function') doAltitudeChange(getSelectedUnit(), 'land'); } });
      } else {
        const canAsc = canChangeAltitude(unit, 'ascend');
        if (canAsc.ok) moreItems.push({ label: '⬆ Take Off', sub: '1 AP', onClick: () => { if (typeof doAltitudeChange === 'function' && typeof getSelectedUnit === 'function') doAltitudeChange(getSelectedUnit(), 'ascend'); } });
      }
    }
  } else if (typeof canReshapeTile === 'function') {
    const canRaise = canReshapeTile(unit, 'raise');
    if (canRaise.ok) moreItems.push({ label: '🔺 Raise', sub: '1 AP', onClick: () => { if (typeof doReshape === 'function' && typeof getSelectedUnit === 'function') doReshape(getSelectedUnit(), 'raise'); } });
    const canLower = canReshapeTile(unit, 'lower');
    if (canLower.ok) moreItems.push({ label: '🔻 Lower', sub: '1 AP', onClick: () => { if (typeof doReshape === 'function' && typeof getSelectedUnit === 'function') doReshape(getSelectedUnit(), 'lower'); } });
  }

  if (st.bombs && st.bombs.some(b => b.ownerUnitId === unit.id)) {
    moreItems.push({ label: '💣 Detonate', onClick: () => { if (typeof doDetonate === 'function' && typeof getSelectedUnit === 'function') doDetonate(getSelectedUnit()); } });
  }

  if (typeof getNexusAtUnit === 'function') {
    const nex = getNexusAtUnit(unit);
    if (nex && (!nex.nexus.owner || nex.nexus.owner !== unit.player) && (unit.ap || 0) >= (typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1)) {
      moreItems.push({ label: '⬡ Channel', sub: '1 AP', onClick: () => { if (typeof channelNexus === 'function' && typeof getSelectedUnit === 'function') channelNexus(getSelectedUnit()); } });
    }
  }

  /* 🛗 Enter Building: standing beside a building rides its lift — ends the
     turn, unit hides inside and emerges on the roof next turn. */
  if (typeof getEnterableBuilding === 'function') {
    const ent = getEnterableBuilding(unit);
    if (ent) {
      const enoughAp = (unit.ap || 0) >= (typeof BUILDING_ENTER_AP_COST !== 'undefined' ? BUILDING_ENTER_AP_COST : 1);
      moreItems.push({
        label: '🛗 Enter Building',
        sub: enoughAp ? 'Ends turn' : 'No AP',
        dim: !enoughAp,
        onClick: () => {
          if (!enoughAp) return;
          if (typeof doEnterBuilding === 'function' && typeof getSelectedUnit === 'function') doEnterBuilding(getSelectedUnit());
        }
      });
    }
  }

  /* Recall: teleport back to spawn zone */
  if (typeof RECALL_AP_COST !== 'undefined' && typeof RECALL_COOLDOWN_ROUNDS !== 'undefined') {
    const spotted = typeof isUnitSeenByAnyEnemy === 'function' && isUnitSeenByAnyEnemy(unit);
    const canRecall = (unit.ap || 0) >= RECALL_AP_COST && (unit._recallCooldown || 0) <= 0 && !spotted;
    const cdLeft = unit._recallCooldown || 0;
    const sub = cdLeft > 0 ? `CD: ${cdLeft}` : (spotted ? 'Spotted' : `${RECALL_AP_COST} AP`);
    moreItems.push({
      label: '🔵 Recall',
      sub,
      dim: !canRecall,
      onClick: () => {
        if (!canRecall) return;
        if (typeof doRecall === 'function' && typeof getSelectedUnit === 'function') doRecall(getSelectedUnit());
      }
    });
  }

  if (!unit._skippedTurn && !st._skippedUnit && (unit.ap || 0) >= (typeof getUnitMaxAP === 'function' ? getUnitMaxAP(unit) : 3)) {
    moreItems.push({ label: '⏭ Skip', onClick: () => { if (typeof doSkipTurn === 'function' && typeof getSelectedUnit === 'function') doSkipTurn(getSelectedUnit()); } });
  }

  const blades = moreItems.map((it, i) => _hrlgMoreBlade(it, i, am));
  if (!blades.length) blades.push({ id: 'none', icon: '…', label: 'Nothing else here', available: false });
  return { title: { icon: '…', text: 'More', count: moreItems.length + '' }, blades };
}

function ActionMenu({ st, hidden }) {
  if (!st || st.phase !== 'battle') return null;
  if (hidden) return null;   // board is animating — input already registered

  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const activeId = st._blitzActiveUnitId || st.selectedUnitId;
  const unit = (st.units || []).find(u => u.id === activeId);
  if (!unit || unit.dead) return null;

  const humanTurn = !st.autoPlayers?.[st.activePlayer];
  const canControl = humanTurn && unit.player === st.activePlayer
    && (typeof canUnitAct === 'function' ? canUnitAct(unit) : true)
    && !st.winner;
  if (!canControl) return null;

  if (st.units.some(u => u._dying)) return null;

  if (st.battleDialogueQueue && st.battleDialogueQueue.length > 0) return null;

  const fc = getFactionColor(unit);
  const maxAP = typeof getUnitMaxAP === 'function' ? getUnitMaxAP(unit) : 3;
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
    moveAction = { id: 'jump', label: 'Jump', icon: '↑', cost: 1, available: jumpOk, sub: jumpOk ? null : 'Blocked' };
  } else if (apc.canMove) {
    moveAction = { id: 'move', label: 'Move', icon: '↑', cost: 1, available: true };
  } else {
    const mvReason = (unit.ap || 0) < 1 ? 'No AP'
      : (typeof UNIT_MAX_MOVES !== 'undefined' && movesUsed >= UNIT_MAX_MOVES) ? 'Max moves' : 'Blocked';
    moveAction = { id: 'move', label: 'Move', icon: '↑', cost: 1, available: false, sub: mvReason };
  }

  // Attack stays live if the unit can STEP into range and still swing this
  // turn (move→attack) — only grey it when even that won't reach anything.
  const atkNow = !!apc.hasAttack;
  const atkReach = atkNow || (typeof attackHasReachableTarget === 'function' && attackHasReachableTarget(unit));
  const attackAction = {
    id: 'attack', label: 'Attack', icon: '×', cost: 1,
    available: atkReach,
    note: !atkNow && atkReach ? 'MOVE→ATK' : null,
    sub: atkReach ? null : 'No target',
  };

  const hasSpells = typeof canCastAnySpellWithTargets === 'function' ? canCastAnySpellWithTargets(unit) : false;
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
        const mpOk = (unit.mp || 0) >= (sp.cost || 0);
        const tgt = (typeof hasSpellTargetInRange === 'function' ? hasSpellTargetInRange(unit, sp) : true)
                 || (typeof spellHasReachableTarget === 'function' && spellHasReachableTarget(unit, sp));
        if (apOk && mpOk && tgt) { anyCastable = true; break; }
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
    // abilSub is only set when nothing is castable (even via move→cast),
    // so it doubles as the grey-out signal; forceLive keeps the blade
    // clickable so the list can explain WHY each spell is blocked.
    available: hasSpells || (hasAnySpells && !abilSub),
    forceLive: true,
    selected: menuView === 'spells',
    sub: abilSub,
  };

  let comboSub = null;
  if (!apc.hasCombo) {
    if (typeof unitCanCombo === 'function' && !unitCanCombo(unit)) {
      const lvl = typeof getUnitLevel === 'function' ? getUnitLevel(unit) : 1;
      comboSub = 'Lv' + lvl + '/7';
    } else if ((unit.ap || 0) < (typeof COMBO_AP_COST_INITIATOR !== 'undefined' ? COMBO_AP_COST_INITIATOR : 2)) {
      comboSub = 'No AP';
    } else {
      comboSub = 'Unavailable';
    }
  }
  const comboAction = {
    id: 'combo', label: 'Combo', icon: '◆', cost: 2,
    available: !!apc.hasCombo,
    sub: apc.hasCombo ? null : comboSub,
  };

  const itemsAction = {
    id: 'items', label: 'Items', icon: '❖', cost: null,
    available: !!apc.hasAnyItem,
    selected: menuView === 'items',
    sub: apc.hasAnyItem ? null : 'Empty',
  };

  const moreAction = {
    id: 'more', label: 'More', icon: '…', cost: null,
    available: true,
    selected: menuView === 'more',
  };

  // Canonical verb order, top to bottom: Move › Attack › Abilities › Combo ›
  // Items › More (END TURN docks at the very bottom of the ladder).
  const actions = [moveAction, attackAction, abilAction, comboAction, itemsAction, moreAction];

  // ── special-action pushers: situational one-shots surfaced as extra
  // stopwatch buttons on the bezel (they also stay listed under More).
  // Only built when usable right now — presence == opportunity.
  const pushers = [];
  if (typeof getNexusAtUnit === 'function') {
    const _nex = getNexusAtUnit(unit);
    if (_nex && (!_nex.nexus.owner || _nex.nexus.owner !== unit.player)
        && (unit.ap || 0) >= (typeof NEXUS_CHANNEL_COST_AP !== 'undefined' ? NEXUS_CHANNEL_COST_AP : 1)) {
      pushers.push({
        id: 'nexus', glyph: '⬡', label: 'CHANNEL', color: '#5fd6ff',
        title: 'Channel this Nexus (1 AP)',
        fire: () => { if (typeof channelNexus === 'function' && typeof getSelectedUnit === 'function') channelNexus(getSelectedUnit()); },
      });
    }
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
  const tileTargetModes = ['move', 'jump', 'combo', 'inspect', 'ward', 'flair', 'trade', 'warpStone'];
  const isWasdWalking = am === 'move' && typeof _wasdOrigin !== 'undefined' && _wasdOrigin && !_wasdCommitted;
  const inTileTarget = am && tileTargetModes.includes(am) && menuView === 'root' && !isWasdWalking;

  function onAction(a) {
    if (!a.available && a.id !== 'abil') return;
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
      case 'more': if (typeof chooseActionMenu === 'function') chooseActionMenu('more'); break;
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
    attack: 'ATTACK — CLICK A TARGET',
  };

  // Which face the Horologe shows. EVERYTHING is the same drum — root
  // verbs, sub-menus, target pickers, quick menus — differing only in
  // which blade list is loaded and the view tab naming it:
  //  root  — the six verbs + END TURN
  //  sub   — a submenu's items (abilities / items / more / …)
  //  quick — the clicked enemy's / tile's actions
  //  aim   — board-targeting in progress: a lone CANCEL blade
  const cancelBlade = { id: 'cancel', label: 'CANCEL', icon: '‹', available: true, danger: true, hint: 'ESC' };
  let view = 'root', viewKey = 'root', blades = [], modeLabel = null, title = null;
  let built = null;
  if (inTileTarget) {
    view = 'aim'; viewKey = 'aim|' + am;
    modeLabel = modeLabels[am] || String(am).toUpperCase();
    blades = [cancelBlade];
  } else if (menuView === 'spells' && am === 'spell' && st.selectedTool) {
    // tile-targeted / free-aim spell armed from the abilities drum
    view = 'aim'; viewKey = 'aim|spell';
    title = { icon: '✦', text: 'Abilities' };
    modeLabel = (st.selectedTool + ' — CLICK A TARGET').toUpperCase();
    blades = [cancelBlade];
  } else if (menuView === 'items' && am === 'item' && st.selectedTool) {
    view = 'aim'; viewKey = 'aim|item';
    title = { icon: '❖', text: 'Items' };
    const itName = (typeof ITEM_RULES !== 'undefined' && ITEM_RULES[st.selectedTool]?.name) || st.selectedTool;
    modeLabel = (itName + ' — CLICK A TARGET').toUpperCase();
    blades = [cancelBlade];
  } else if (menuView === 'spells') {
    built = _hrlgSpellBlades(unit, st); view = 'sub'; viewKey = 'spells';
  } else if (menuView === 'items') {
    built = _hrlgItemBlades(unit, st); view = 'sub'; viewKey = 'items';
  } else if (menuView === 'more') {
    built = _hrlgMoreBlades(unit, st); view = 'sub'; viewKey = 'more';
  } else if (menuView === 'switch') {
    built = _hrlgSwitchBlades(unit, st); view = 'sub'; viewKey = 'switch';
  } else if (menuView === 'pings') {
    built = _hrlgPingBlades(); view = 'sub'; viewKey = 'pings';
  } else if (menuView === 'spellOrientation') {
    built = _hrlgOrientationBlades(st); view = 'sub'; viewKey = 'orient';
  } else if (menuView === 'attackTargets') {
    built = _hrlgTargetBlades(unit, st, 'attack'); view = 'sub'; viewKey = 'atkTargets';
    modeLabel = 'ATTACK — PICK A TARGET';
  } else if (menuView === 'spellTargets') {
    built = _hrlgTargetBlades(unit, st, 'spell'); view = 'sub'; viewKey = 'spTargets';
    modeLabel = ((st.selectedTool || 'SPELL') + ' — PICK A TARGET').toUpperCase();
  } else if (menuView !== 'root') {
    view = 'sub'; viewKey = 'sub|' + menuView;   // unknown view: bare clock + crown
  } else if (st._enemyActionTargetId && !am) {
    built = _hrlgEnemyBlades(unit, st); view = 'quick'; viewKey = 'enemy|' + st._enemyActionTargetId;
  } else if (st._tileActionTarget && !am) {
    built = _hrlgTileBlades(unit, st); view = 'quick';
    viewKey = 'tile|' + st._tileActionTarget.x + ',' + st._tileActionTarget.y;
  } else {
    view = 'root'; viewKey = 'root|' + (am || '');
    if (am) modeLabel = modeLabels[am] || null;
    blades = actions.map(a => ({ ...a }));   // declared order IS the drum order
    blades.push({ id: 'end', label: 'END TURN', icon: '■', available: true, danger: true, hint: 'SPACE' });
  }
  if (built) { blades = built.blades; title = built.title; }

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

  return h(HorologeMenu, {
    view: view, viewKey: viewKey, title: title, blades: blades, fc: fc,
    factionKey: (typeof getUnitFaction === 'function' ? getUnitFaction(unit) : null) || 'space',
    roman: roman, unitName: unitName, unitKey: unit.id,
    ap: unit.ap || 0, maxAP: maxAP,
    hp: unit.hp || 0, maxHp: unit.maxHp || 0, mp: unit.mp || 0, maxMp: unit.maxMp || 0,
    modeLabel: modeLabel, am: am, pushers: pushers,
    items: hudItems, onItem: onItem,
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
  else if (k === 'summonWeather') parts.push('Weather');
  else if (k === 'scan' || k === 'remoteView') parts.push('Vision');
  else if (k === 'warpRune') parts.push('Warp rune');
  else if (k === 'leechSeed' || k === 'seedHeal' || k === 'seedPoison') parts.push('Seed');
  else if (k === 'skyThrow' || k === 'skyDrop' || k === 'skySlam') parts.push('Aerial');
  else if (k === 'encore') parts.push('Copy');
  else if (k === 'revive') parts.push('Revive');
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
       'deployTurret', 'warpRune', 'summonWeather', 'leechSeed', 'seedHeal', 'seedPoison'].includes(k)) return 'Tile Target';
  if (['dash', 'leapStrike'].includes(k)) return 'Dash Line';
  if (['teleport', 'swap', 'pull', 'displacement'].includes(k)) return k === 'swap' ? 'Swap' : 'Reposition';
  if (['scan', 'remoteView'].includes(k)) return 'Vision';
  if (k === 'multiHit') { const n = sp.hitDamages ? sp.hitDamages.length : 0; return n > 1 ? n + '-Hit Target' : 'Single Target'; }
  if (sp.aoeRadius) return 'Single + Splash';
  return 'Single Target';
}

// Physical / Magic / Utility delivery badge (the purple "MAGIC" pill in the mockup).
function spellDeliveryBadge(sp, cat) {
  if (sp.damageType === 'physical') return { label: 'PHYSICAL', color: '#e0944a' };
  if (cat === 'heal' || cat === 'buff' || cat === 'utility') return { label: 'UTILITY', color: '#d8b24a' };
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
function spellPowerStat(sp) {
  if (sp.dmg) return { value: sp.dmg, unit: 'PWR', color: '#ee6655' };
  if (sp.hitDamages && sp.hitDamages.length) return { value: sp.hitDamages.reduce((s, v) => s + v, 0), unit: 'PWR', color: '#ee6655' };
  if (sp.dotDamage) return { value: sp.dotDamage, unit: 'DOT', color: '#ee6655' };
  if (sp.heal) return { value: sp.heal, unit: 'HP', color: '#55cc66' };
  if (sp.shield) return { value: sp.shield, unit: 'SHLD', color: '#5fd6ff' };
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

  const findMoveIntoRange = (requiredRange, actionApCost) => {
    if (typeof getMoveTiles !== 'function' || typeof canUnitMove !== 'function') return null;
    if (!canUnitMove(actingUnit)) return null;
    const movesLeft = (typeof G.UNIT_MAX_MOVES !== 'undefined' ? G.UNIT_MAX_MOVES : 2) - (actingUnit.movesThisTurn || 0);
    if (movesLeft <= 0) return null;

    const ring1 = getMoveTiles(actingUnit);
    let bestTile = null;
    let bestDist = -1;

    const apAfter1Move = unitAP - 1;
    if (apAfter1Move >= actionApCost) {
      for (const t of ring1) {
        // Double-check tile is actually vacant at this z (ground+air dual occupancy guard)
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;

        const dFromTile = distFrom(t.x, t.y, t.z);
        if (dFromTile >= 1 && dFromTile <= requiredRange) {

          if (typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(t.x, t.y, tx, ty)) continue;

          if (!bestTile || dFromTile > bestDist) {
            bestTile = { moveCost: 1, x: t.x, y: t.y, z: t.z };
            bestDist = dFromTile;
          }
        }
      }
    }

    if (!bestTile && movesLeft >= 2 && unitAP - 2 >= actionApCost) {
      const savedX = actingUnit.x, savedY = actingUnit.y, savedZ = actingUnit.z;
      for (const t1 of ring1) {
        // Skip via tiles that are occupied at this z
        if (typeof unitAt === 'function' && unitAt(t1.x, t1.y, t1.z)) continue;

        actingUnit.x = t1.x; actingUnit.y = t1.y; actingUnit.z = t1.z ?? savedZ;
        const r2 = getMoveTiles(actingUnit);
        for (const t2 of r2) {
          // Skip destination tiles that are occupied at this z
          if (typeof unitAt === 'function' && unitAt(t2.x, t2.y, t2.z)) continue;

          const dFromTile = distFrom(t2.x, t2.y, t2.z);
          if (dFromTile >= 1 && dFromTile <= requiredRange) {
            if (typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(t2.x, t2.y, tx, ty)) continue;

            if (!bestTile || dFromTile > bestDist) {
              bestTile = { moveCost: 2, x: t2.x, y: t2.y, z: t2.z ?? savedZ, via: { x: t1.x, y: t1.y, z: t1.z ?? savedZ } };
              bestDist = dFromTile;
            }
          }
        }
      }
      actingUnit.x = savedX; actingUnit.y = savedY; actingUnit.z = savedZ;
    }

    return bestTile;
  };

  const effRange = typeof getEffectiveRange === 'function' ? getEffectiveRange(actingUnit) : (actingUnit.range || 1) + 1;
  const losBlocked = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);
  const inAttackRange = dist >= 1 && dist <= effRange && !losBlocked;
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
  if (canAttack || atkMoveTile) {

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

  // --- Grapple → strike combo -------------------------------------------------
  // If a plain attack can't reach this turn but the unit carries a grappling
  // hook, check whether reeling the target in first would land it inside melee
  // range. If so, expose a one-click "Grapple + Strike" action. Only offered
  // when the pull actually brings the target into attack range from where the
  // caster currently stands (no post-grapple pathing guesswork).
  if (!canAttack && !atkMoveTile) {
    const grappleSp = allSpells.find(s => s.id === 'grapple' || s.id === 'raceGrapple');
    if (grappleSp) {
      const gApCost = typeof getSpellApCost === 'function' ? getSpellApCost(grappleSp) : 1;
      const atkApCost = G.AP_COST_ACTION || 1;
      const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
      const gMpCost = (grappleSp.cost || 0) + mpPenalty;
      const gRange = typeof getEffectiveSpellRange === 'function' ? getEffectiveSpellRange(actingUnit, grappleSp) : (grappleSp.range || 3);
      const silenced = typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence');
      const gTierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, grappleSp) : true;
      const canAffordCombo = unitAP >= (gApCost + atkApCost) && actingUnit.mp >= gMpCost && !silenced && gTierOk;
      const inGrappleRange = dist >= 1 && dist <= gRange && !losBlocked;
      if (canAffordCombo && inGrappleRange) {
        // Simulate the 2-tile reel toward the caster (stops at edge/obstacle/
        // occupied, never onto the caster) and test the landing tile.
        const gdx = Math.sign(actingUnit.x - tx), gdy = Math.sign(actingUnit.y - ty);
        let lx = tx, ly = ty;
        for (let i = 1; i <= 2; i++) {
          const nx = tx + gdx * i, ny = ty + gdy * i;
          if (typeof isInside === 'function' && !isInside(nx, ny)) break;
          if (typeof isTerrainPassable === 'function' && !isTerrainPassable(nx, ny)) break;
          if (typeof unitAt === 'function' && unitAt(nx, ny)) break;
          if (nx === actingUnit.x && ny === actingUnit.y) break;
          lx = nx; ly = ny;
        }
        const landDist = _cd(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, lx, ly, targetZ);
        const landLos = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, lx, ly);
        if ((lx !== tx || ly !== ty) && landDist >= 1 && landDist <= effRange && !landLos) {
          const minRoll = -2, maxRoll = 2;
          let minDmg = Math.max(24, Math.floor(actingUnit.atk * 0.65) + minRoll);
          let maxDmg = Math.max(24, Math.floor(actingUnit.atk * 0.65) + maxRoll);
          const effArmor = typeof getEffectiveArmor === 'function' ? getEffectiveArmor(targetUnit) : 0;
          if (effArmor) { minDmg = Math.max(1, minDmg - effArmor); maxDmg = Math.max(1, maxDmg - effArmor); }
          if (targetUnit.shield > 0) { minDmg = Math.max(0, minDmg - targetUnit.shield); maxDmg = Math.max(0, maxDmg - targetUnit.shield); }
          actions.push({
            id: 'grappleAttack',
            label: 'Grapple + Strike',
            icon: '🪝',
            spell: grappleSp,
            apCost: gApCost + atkApCost,
            moveTile: null,
            grappleThenAttack: true,
            preview: { type: 'damage', min: minDmg, max: maxDmg },
            typeNote: typeof getTypeCombatNote === 'function' ? getTypeCombatNote(actingUnit, targetUnit) : '',
            available: true,
          });
        }
      }
    }
  }

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
  ]);
  for (const sp of allSpells) {
    const cls = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
    if (cls === 'heal' || cls === 'buff') continue;
    if (nonEnemyTargetKinds.has(sp.kind)) continue;
    // Flight-gated grabs (Sky Drop / Sky Throw) are dead rows for grounded casters.
    if (sp.requiresFlight && !(typeof canFly === 'function' && canFly(actingUnit))) continue;
    // Seeds can't root on mountain/lava — the engine rejects the plant outright.
    if ((sp.kind === 'seedPoison' || sp.kind === 'leechSeed') && typeof getTerrainAt === 'function') {
      const seedGround = getTerrainAt(tx, ty);
      if (seedGround === 'mountain' || seedGround === 'lava') continue;
    }

    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 2;
    const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
    const mpCost = (sp.cost || 0) + mpPenalty;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !(typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence'));
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;

    const spRange = typeof getEffectiveSpellRange === 'function' ? getEffectiveSpellRange(actingUnit, sp) : (sp.range || 1);
    const spLos = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

    // Distance with the long-range downward-gravity rule applied for THIS spell,
    // so casting down onto a lower target isn't blocked by the vertical gap.
    const spLongRange = (typeof isLongRangeSpell === 'function') && isLongRangeSpell(sp);
    const dist = _spellDistFromTo(actingUnit.x, actingUnit.y, actingUnit.z ?? 0, spLongRange);

    let inSpellRange = false;
    const isBarrage = sp.kind === 'barrage';
    const isAoeOriginSelf = sp.aoeOriginSelf;
    const isLine = sp.kind === 'line' || sp.kind === 'linePush' || sp.kind === 'splitBeam';
    const isCross = sp.kind === 'cross';
    const isDash = sp.kind === 'dash';
    const isLeap = sp.kind === 'leapStrike';

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

      const onAxis = (actingUnit.x === tx || actingUnit.y === ty) && dist >= 1;
      inSpellRange = onAxis && dist <= spRange && !spLos;
    } else if (isDash) {

      const onAxis = (actingUnit.x === tx || actingUnit.y === ty) && dist >= 1;
      inSpellRange = onAxis && dist <= spRange;
    } else if (isLeap) {
      // Leap-strikes can only hit a target the caster stands ABOVE. From here that
      // needs an in-range enemy standing lower than us; if we're level/below it's not
      // castable from this tile — but a jump up can fix it (offered via spMoveTile).
      const _csh = typeof getUnitStandingHeight === 'function' ? getUnitStandingHeight(actingUnit) : (actingUnit.z ?? 0);
      const _tsh = targetUnit ? (typeof getUnitStandingHeight === 'function' ? getUnitStandingHeight(targetUnit) : (targetUnit.z ?? 0)) : 0;
      inSpellRange = !!targetUnit && dist >= 1 && dist <= spRange && !spLos && _csh > _tsh;
    } else {

      const minRange = ['aoe', 'cross', 'aoePull'].includes(sp.kind) ? 0 : 1;
      inSpellRange = dist >= minRange && dist <= spRange && !spLos;
      // Authoritative fallback: trust the engine's own range set (the same one the
      // board highlight + doSpell use) so a spell is never greyed here when it's
      // actually castable from where the unit stands.
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
        spMoveTile = findMoveIntoRange(barrageRadius, spellApCost);
      } else if (isAoeOriginSelf) {

        const selfRadius = isCross ? (sp.crossRadius || 1) : (sp.aoeRadius || 1);
        spMoveTile = findMoveIntoRange(selfRadius, spellApCost);
      } else if (isLine || isDash) {

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
        mpCost: sp.cost || 0,
        moveTile: canCast ? null : spMoveTile,
        preview: dmgEstimate ? { type: 'damage', amount: dmgEstimate } : null,
        powerLabel: powerLabel,
        typeNote: typeof getTypeCombatNote === 'function' ? getTypeCombatNote(actingUnit, targetUnit, sp.spellType) : '',
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
        mpCost: sp.cost || 0,
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
    const comboRange = effRange;
    const inComboRange = dist >= 1 && dist <= comboRange && !losBlocked;
    const canCombo = inComboRange && unitAP >= comboApCost && getComboPartners(actingUnit).length > 0;
    const onCooldown = typeof COMBO_COOLDOWN_ROUNDS !== 'undefined' &&
      ((state.round || 0) - (actingUnit._lastComboRound || -99)) < COMBO_COOLDOWN_ROUNDS;

    if (canCombo && !onCooldown) {
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

  // "Move Towards" — a plain one-click step toward the clicked enemy, for
  // when nothing in this menu can reach them and you just want to close the
  // distance without backing out through the menus to select MOVE.
  if (typeof getMoveTiles === 'function' && typeof canUnitMove === 'function'
      && canUnitMove(actingUnit) && unitAP >= 1 && dist > 1) {
    const mtMovesLeft = (typeof G.UNIT_MAX_MOVES !== 'undefined' ? G.UNIT_MAX_MOVES : 2) - (actingUnit.movesThisTurn || 0);
    if (mtMovesLeft > 0) {
      let towardTile = null;
      let towardDist = dist;
      for (const t of getMoveTiles(actingUnit)) {
        if (t._takeoff) continue;   // altitude changes cost extra AP — plain steps only
        if (typeof unitAt === 'function' && unitAt(t.x, t.y, t.z)) continue;
        const d = distFrom(t.x, t.y, t.z);
        if (d < towardDist) { towardTile = { moveCost: 1, x: t.x, y: t.y, z: t.z }; towardDist = d; }
      }
      if (towardTile) {
        actions.push({
          id: 'moveTowards',
          label: 'Move Towards',
          icon: '➜',
          apCost: 1,
          moveTile: towardTile,
          preview: null,
          typeNote: '',
          available: true,
        });
      }
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

function _actionPlanArrowColor(action) {
  if (!action) return 0xff4444;
  if (action.id === 'attack' || action.id === 'combo') return 0xff4444;

  const spType = (action.spellType || '').toLowerCase();
  const cssColor = TYPE_COLORS[spType] || '';
  if (cssColor) {

    return parseInt(cssColor.replace('#', ''), 16) || 0xff4444;
  }
  return 0xff4444;
}

function _clearMoveArrowPreview() {
  if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
  ThreeRenderer.clearArrows3D();
  ThreeRenderer.clearGhostUnit();
  ThreeRenderer.clearOverlay('movePreview');
  ThreeRenderer.clearOverlay('actionPlanTarget');
  ThreeRenderer.clearOverlay('actionPlanAoe');
  ThreeRenderer.clearOverlay('actionPlanShove');
}

function _showMoveArrowPreview(actingUnit, targetUnit, mt, action) {
  _clearMoveArrowPreview();
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
    const routeColor = mt._jump ? 0x66ffcc : 0xffcc44;
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
    ThreeRenderer.showGhostUnit(actingUnit, mt.x, mt.y, destY, { tag: 'caster', color: ghostTint, opacity: 0.55 });

    // Arced strike arrow lobbing from the move destination onto the target.
    ThreeRenderer.drawArrow3D(mt.x, mt.y, tx, ty, arrowColor, false, destY, targetY, { arc: 0.35, flow: true });
  } else {

    // Arced strike arrow straight from the unit's current tile onto the target.
    ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, tx, ty, arrowColor, false, actingY, targetY, { arc: 0.35, flow: true });
  }

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
      const shoveColor = shove.mode === 'pull' ? 0x66ccff : 0xff66cc;
      const shY = ThreeRenderer.tileTopY(shove.x, shove.y);
      ThreeRenderer.showGhostUnit(targetUnit, shove.x, shove.y, shY, { tag: 'target', color: shoveColor, opacity: 0.5 });
      ThreeRenderer.drawArrow3D(tx, ty, shove.x, shove.y, shoveColor, false, targetY, shY,
        { arc: shove.mode === 'pull' ? 0.18 : 0.3, flow: true });
      ThreeRenderer.setOverlay('actionPlanShove', [{ x: shove.x, y: shove.y, color: shoveColor, opacity: 0.4 }], shoveColor, 0.4);
    }
  }
}

// Execute one quick-menu action against the clicked enemy — including the
// one-click move/jump/take-off + strike combos. Ported verbatim from the old
// EnemyActionMenu card click handler.
function _fireEnemyAction(actingUnit, targetUnit, a) {
  if (!a.available) return;
  hideSpellTooltip();
  _clearMoveArrowPreview();
  // Quick-cast fires (or walks-then-fires) immediately — drop the menus
  // in this same tick so the click visibly registered.
  if (typeof window._hrlgNoteAction === 'function') window._hrlgNoteAction(550);
  const isMove = !!a.moveTile;

  const _executeAction = (actionId, spell, tx, ty, tz) => {
    // "Move Towards" is pure movement — the walk already happened in the
    // moveTile branch below; there's no follow-up strike, just tidy up.
    if (actionId === 'moveTowards') {
      state._enemyActionTargetId = null;
      state.pendingTarget = null;
      if (typeof markDirty === 'function') markDirty('board', 'hud', 'selectedUnit');
      if (typeof renderIfDirty === 'function') renderIfDirty();
      if (typeof scheduleBoardRender === 'function') scheduleBoardRender();
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
    if (actionId === 'attack') {
      if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty, tz);
    } else if (actionId === 'grappleAttack' && spell) {
      // Fire the grapple to reel the target into melee, then swing once the
      // reel settles. `target` is the live unit object, so its x/y reflect
      // the post-pull tile by the time the strike fires.
      state.selectedTool = spell.name;
      state.actionMode = 'spell';
      const _combTarget = target;
      let _grCd = 0;
      if (typeof doSpell === 'function') _grCd = doSpell(actingUnit, tx, ty, tz) || 0;
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
        if (_selfCast) doSpell(actingUnit, actingUnit.x, actingUnit.y, actingUnit.z);
        else doSpell(actingUnit, tx, ty, tz);
      }
    } else if (actionId.startsWith('item:')) {

      const _itemKey = actionId.substring(5);
      state.selectedTool = _itemKey;
      state.actionMode = 'item';
      if (typeof doItem === 'function') doItem(actingUnit, tx, ty);
    } else if (actionId === 'combo') {
      if (typeof setActionMode === 'function') setActionMode('combo');

      const partners = typeof getComboPartners === 'function' ? getComboPartners(actingUnit) : [];
      if (partners.length > 0) {
        state.comboPartner = partners[0];
        if (typeof doComboAttack === 'function') doComboAttack(actingUnit, partners[0], tx, ty);
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
  const hpPct = targetUnit.maxHp > 0 ? Math.max(0, Math.round((targetUnit.hp / targetUnit.maxHp) * 100)) : 0;

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
      if (a.typeNote.includes('Strong') || a.typeNote.includes('strong') || a.typeNote.includes('super effective')) typeAdv = '▲';
      else if (a.typeNote.includes('Weak') || a.typeNote.includes('weak') || a.typeNote.includes('not very')) typeAdv = '▼';
    }

    return {
      id: 'ea:' + a.id + ':' + i,
      icon: a.icon, label: a.label,
      available: a.available,
      spell: a.spell || null,
      badges: a.spell ? _hrlgSpellBadges(a.spell, typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage', true) : undefined,
      power: power,
      mp: a.mpCost || null,
      cost: a.available ? a.apCost : null,
      meta: typeAdv ? { text: typeAdv, color: typeAdv === '▲' ? EW.good : EW.bad } : null,
      note: isMove && a.id !== 'moveTowards' ? '↳ ' + _mvVerb : null,
      sub: !a.available ? (a.reason || 'Unavailable') : null,
      fire: () => _fireEnemyAction(actingUnit, targetUnit, a),
      hoverIn: (e) => { if (a.spell) showSpellTooltip(a.spell, e); if (a.available) _showMoveArrowPreview(actingUnit, targetUnit, a.moveTile, a); },
      hoverOut: () => { hideSpellTooltip(); _clearMoveArrowPreview(); },
    };
  });
  if (!blades.length) blades.push({ id: 'none', icon: '⚔', label: 'No actions available', available: false });

  const title = { node: h(React.Fragment, null,
    h('span', { className: 'hrlg-view-tab-icon', style: { color: EW.bad } }, '⌖'),
    h('span', { className: 'hrlg-view-tab-text' }, targetName),
    h('span', { className: 'hrlg-view-tab-count', style: { color: hpPct <= 30 ? EW.bad : EW.good } }, hpPct + '%'),
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
  const actions = _computeTileActions(actingUnit, tx, ty);
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
    iconColor: a.category === 'attack' ? '#ee6655' : undefined,
    label: a.label,
    available: a.available,
    spell: a.spell || null,
    badges: a.spell ? _hrlgSpellBadges(a.spell, typeof classifySpell === 'function' ? classifySpell(a.spell) : 'damage', true) : undefined,
    mp: a.mpCost || null,
    cost: a.available && a.apCost ? a.apCost : null,
    sub: !a.available ? (a.reason || 'Unavailable') : null,
    fire: () => { hideSpellTooltip(); if (a.available && a.handler) a.handler(); },
    hoverIn: (e) => { if (a.spell) showSpellTooltip(a.spell, e); },
    hoverOut: () => hideSpellTooltip(),
  }));
  if (!blades.length) blades.push({ id: 'none', icon: '⬚', label: 'Nothing to do here', available: false });

  const title = { node: h(React.Fragment, null,
    h('span', { className: 'hrlg-view-tab-icon' }, '⬚'),
    h('span', { className: 'hrlg-view-tab-text' }, tRule.label || terrain),
    h('span', { className: 'hrlg-view-tab-count' }, posLabel + (height > 0 ? ' · h' + height : '') + ' · ' + dist + 't'),
  ) };
  return { title, blades };
}


function _computeTileActions(actingUnit, tx, ty) {
  if (!actingUnit || actingUnit.dead) return [];
  const actions = [];
  const G = window.GAME;
  if (!G) return actions;

  const unitAP = actingUnit.ap || 0;
  const onSelf = tx === actingUnit.x && ty === actingUnit.y;
  // 3D distance to the targeted tile: elevation gap to the tile's ground/roof
  // counts toward range (matches combatDist), so tile-targeted spell cards gray
  // out when the destination is too far above/below to reach.
  const _tileZ = typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0;
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
    const moveTile = moveTiles.find(t => t.x === tx && t.y === ty);
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

            if (typeof doAltitudeChange === 'function') {
              const ascResult = doAltitudeChange(actingUnit, 'ascend');
              if (ascResult !== 0 && typeof doMove === 'function') {
                doMove(actingUnit, tx, ty, moveTile.z);
              }
            }
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
    }
  }

  const movementKinds = new Set(['dash', 'teleport', 'escape', 'warpRune']);
  const allSpells = [...(actingUnit.spells || []), ...(actingUnit._raceAbilities || [])].filter(Boolean);
  const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
  const isSilenced = typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence');

  for (const sp of allSpells) {
    if (!movementKinds.has(sp.kind)) continue;
    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 2;
    const mpCost = (sp.cost || 0) + mpPenalty;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !isSilenced;
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
      spellType: sp.spellType || '', apCost: spellApCost, mpCost: sp.cost || 0,
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
  ]);

  for (const sp of allSpells) {
    if (!tileTargetKinds.has(sp.kind)) continue;
    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 2;
    const mpCost = (sp.cost || 0) + mpPenalty;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !isSilenced;
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;
    const spRange = sp.range || 3;
    const spDist = _spellTileDist(sp);
    const inRange = spDist <= spRange;
    const losBlocked = typeof isRangeBlockedByTerrain === 'function' && spDist > 0 && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

    let reason = '';
    if (!canAfford) reason = isSilenced ? 'Silenced' : actingUnit.mp < mpCost ? 'No MP' : 'No AP';
    else if (!tierOk) reason = 'Level req';
    else if (!inRange) reason = 'Out of range';
    else if (losBlocked) reason = 'No line of sight';

    const canCast = canAfford && tierOk && inRange && !losBlocked;

    actions.push({
      id: 'spell:' + sp.name, label: sp.name, icon: '✦', category: 'spells',
      spellType: sp.spellType || '', apCost: spellApCost, mpCost: sp.cost || 0,
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

    // 🏢 Buildings: attack the structure (6 hits level it). Only offered when
    // no unit stands on the roof tile — otherwise the swing hits the unit.
    const bldg = !onSelf && typeof getBuildingAt === 'function' ? getBuildingAt(tx, ty) : null;
    if (bldg && !(typeof G.unitAt === 'function' && G.unitAt(tx, ty))) {
      const canSiege = inRangeUnit && !losBlocked;
      actions.push({
        id: 'attack:building', label: `Attack Building (${bldg.hp}/${bldg.maxHp})`, icon: '⚔', category: 'attack',
        apCost: 1, available: canSiege, reason: canSiege ? '' : (losBlocked ? 'No LOS' : 'Out of range'),
        handler: canSiege ? () => {
          state._tileActionTarget = null;
          if (typeof setActionMode === 'function') setActionMode('attack');
          if (typeof doAttack === 'function') doAttack(actingUnit, tx, ty);
        } : null,
      });
    }

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

  const details = [];
  if (sp.dmg) details.push('DMG ' + sp.dmg);
  if (sp.dashDamage) details.push('Path DMG ' + sp.dashDamage);
  if (sp.heal) details.push('Heal ' + sp.heal);
  if (sp.shield) details.push('Shield ' + sp.shield);
  const rng = sp.range || 0;
  details.push(rng > 0 ? 'Range ' + rng : 'Self-cast');
  if (sp.aoeRadius) details.push('AOE ' + sp.aoeRadius);
  if (sp.teleportDistance) details.push('Leap ' + sp.teleportDistance);
  const cost = sp.cost || 0;
  const apCost = sp.apCost != null ? sp.apCost : 2;
  details.push(cost + ' MP · ' + apCost + ' AP');
  if (sp.tier) details.push('T·' + sp.tier);

  let statusLine = '';
  if (sp.statusEffects && sp.statusEffects.length > 0) {
    statusLine = sp.statusEffects.map(s => {
      const id = s.id || '';
      const label = (typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[id]?.label) ? STATUS_DEFS[id].label : id.replace(/_/g, ' ');
      return label + (s.duration ? ' (' + s.duration + 't)' : '');
    }).join(', ');
  }

  const badge = sp.spellType
    ? '<span style="display:inline-flex;align-items:center;flex:none;' +
      'font-family:DotGothic16,monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;' +
      'color:' + tcText + ';background:linear-gradient(' + tc + '22,' + tc + '22),rgba(9,11,17,0.82);' +
      'border:1px solid ' + tc + 'aa;padding:2px 8px;text-shadow:0 1px 2px rgba(0,0,0,0.85);' +
      'clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);">' +
      sp.spellType.toUpperCase() + '</span>'
    : '';

  el.innerHTML =
    '<div class="ew-descbar-inner">' +
      '<span class="ew-descbar-name">' + (sp.name || '') + '</span>' +
      badge +
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

function ReactHUD() {
  const [st, tick] = useGameState();
  const menusHidden = useMenusHidden(st);
  if (!st || st.phase !== 'battle') return null;

  const sel = typeof getSelectedUnit === 'function' ? getSelectedUnit() : null;
  const activeId = st._blitzActiveUnitId || st.selectedUnitId;
  const activeUnit = (() => {

    if (st._blitzActiveUnitId) {
      const blitzU = (st.units || []).find(u => u.id === st._blitzActiveUnitId && !u.dead);
      if (blitzU) return blitzU;
    }

    const u = sel || (st.units || []).find(u => u.id === activeId && !u.dead);
    return u || (st.units || []).find(u => !u.dead) || null;
  })();

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
      h(ActiveUnitPanel, { unit: activeUnit }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(Scoreboard, { st }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(MatchMeta, { st }),
    ),
    h(CombatLog, { st }),
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
      border-radius: 2px !important;
      background: rgba(0,0,0,0.65) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      overflow: hidden !important;
      position: relative !important;
    }
    .hp-bar {
      height: 10px !important;
    }
    .mp-bar {
      height: 9px !important;
    }
    .hp-fill { background: #6ee2a8 !important; border-radius: 0 !important; }
    .hp-fill.hp-mid { background: #f2c468 !important; }
    .hp-fill.hp-low { background: #ff7a8a !important; }
    .mp-fill { background: #5fd6ff !important; border-radius: 0 !important; }

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

    /* ══════════════ THE HOROLOGE — clock action menu ══════════════ */
    /* The whole instrument scales with --ew-ui-scale (set by _applyUIScale
       in ui.js: device auto-fit × the pause-menu HUD Size preference), so
       it reads comfortably on a 1080p monitor and shrinks on phones. */
    .hrlg-rig {
      position: absolute; left: 8px; bottom: 8px; width: 560px; height: 485px;
      z-index: 12; pointer-events: none; font-family: 'DotGothic16', monospace;
      transform: scale(var(--ew-ui-scale, 1));
      transform-origin: 0 100%;
    }
    /* the watch — sits ABOVE the blade drum so blades slide out from
       under the bezel (no gap, no floating buttons). pointer-events on:
       scrolling over the watch cycles the drum instead of zooming. */
    .hrlg-hub {
      position: absolute; left: 8px; bottom: 150px; width: 190px; height: 190px;
      z-index: 8; pointer-events: auto; filter: drop-shadow(0 0 20px var(--hfc-soft));
      animation: hrlgStamp 0.5s cubic-bezier(0.16,1.4,0.3,1) both;
    }
    .hrlg-hub svg { width: 100%; height: 100%; overflow: visible; display: block; }
    @keyframes hrlgStamp {
      0%   { opacity: 0; transform: scale(0.3) rotate(-70deg); }
      70%  { opacity: 1; transform: scale(1.08) rotate(5deg); }
      100% { opacity: 1; transform: scale(1) rotate(0); }
    }
    /* the crown — stopwatch pusher on top of the bezel: the universal BACK.
       Big, RED, arrowed — impossible to miss when a sub-menu is open. */
    .hrlg-crown {
      position: absolute; left: 72px; bottom: 336px; width: 62px; height: 46px;
      z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      pointer-events: none; opacity: 0.25; cursor: default;
      transition: opacity 0.18s ease, transform 0.14s cubic-bezier(0.3,1.5,0.4,1);
    }
    .hrlg-crown-stem { width: 12px; height: 8px; background: linear-gradient(90deg, rgba(255,94,112,0.35), #ff5e70, rgba(255,94,112,0.35)); }
    .hrlg-crown-cap {
      width: 38px; height: 22px; border-radius: 6px 6px 2px 2px;
      background: linear-gradient(180deg, #3d141d, #14060a);
      border: 1px solid #ff5e70;
      box-shadow: 0 0 12px rgba(255,94,112,0.4), inset 0 1px 0 rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
    }
    .hrlg-crown-arrow {
      font-size: 12px; line-height: 1; color: #ff8a97;
      text-shadow: 0 0 8px rgba(255,94,112,0.8);
    }
    .hrlg-crown-label {
      position: absolute; left: 50%; top: -14px; transform: translateX(-50%);
      font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #ff8a97;
      text-shadow: 0 0 10px rgba(255,94,112,0.7); white-space: nowrap;
    }
    .hrlg-crown.live {
      opacity: 1; pointer-events: auto; cursor: pointer;
      animation: hrlgCrownPulse 1.6s ease-in-out infinite;
    }
    @keyframes hrlgCrownPulse {
      0%, 100% { filter: brightness(1); }
      50%      { filter: brightness(1.5); }
    }
    .hrlg-crown.live:hover  { transform: translateY(-2px) scale(1.06); }
    .hrlg-crown.live:active { transform: translateY(3px); }
    /* root view: nothing to back out of → the crown is END TURN instead.
       Calm by default; when the unit is down to its LAST AP it pulses hard
       so "wrap it up" is impossible to miss. */
    .hrlg-crown.endturn { animation: none; }
    .hrlg-crown.endturn.lastap { animation: hrlgCrownLastAP 0.9s ease-in-out infinite; }
    @keyframes hrlgCrownLastAP {
      0%, 100% { filter: brightness(1);   transform: scale(1); }
      50%      { filter: brightness(1.7); transform: scale(1.08); }
    }
    .hrlg-crown.endturn.lastap:hover  { animation: none; transform: translateY(-2px) scale(1.06); }
    .hrlg-crown.endturn.lastap:active { animation: none; transform: translateY(3px); }
    /* ── special-action pushers: extra chronograph buttons on the bezel.
       Mounted only while their action is usable; they pulse + ping. */
    .hrlg-pusher {
      position: absolute; width: 40px; height: 40px; margin: -20px 0 0 -20px;
      z-index: 10; pointer-events: auto; cursor: pointer;
      animation: hrlgPusherIn 0.4s cubic-bezier(0.16,1.4,0.3,1) backwards;
    }
    .hrlg-pusher::before {   /* stem rooting the button to the bezel */
      content: ''; position: absolute; left: 50%; top: 50%; width: 10px; height: 30px;
      margin: -15px 0 0 -5px;
      transform: rotate(var(--pang)) translateY(24px);
      background: linear-gradient(90deg, var(--pc-faint), var(--pc-soft), var(--pc-faint));
    }
    .hrlg-pusher::after {    /* expanding ring ping — "you can do this NOW" */
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      border: 1px solid var(--pc); opacity: 0; pointer-events: none;
      animation: hrlgPusherPing 2.4s ease-out infinite;
    }
    @keyframes hrlgPusherPing {
      0%   { opacity: 0.7; transform: scale(1); }
      45%  { opacity: 0;   transform: scale(1.85); }
      100% { opacity: 0;   transform: scale(1.85); }
    }
    @keyframes hrlgPusherIn {
      0%   { opacity: 0; transform: scale(0.3); }
      70%  { opacity: 1; transform: scale(1.15); }
      100% { opacity: 1; transform: scale(1); }
    }
    .hrlg-pusher-cap {
      position: relative; display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #202a40, #0a0c15 70%);
      border: 1px solid var(--pc);
      box-shadow: 0 0 10px var(--pc-soft), inset 0 1px 0 rgba(255,255,255,0.14);
      animation: hrlgPusherPulse 1.3s ease-in-out infinite;
      transition: transform 0.14s cubic-bezier(0.3,1.5,0.4,1);
    }
    @keyframes hrlgPusherPulse {
      0%, 100% { box-shadow: 0 0 6px var(--pc-soft), inset 0 1px 0 rgba(255,255,255,0.14); }
      50%      { box-shadow: 0 0 16px var(--pc), 0 0 30px var(--pc-soft), inset 0 1px 0 rgba(255,255,255,0.14); }
    }
    .hrlg-pusher-glyph { font-size: 17px; line-height: 1; color: var(--pc); text-shadow: 0 0 10px var(--pc-soft); }
    .hrlg-pusher:hover .hrlg-pusher-cap  { transform: scale(1.12); }
    .hrlg-pusher:active .hrlg-pusher-cap { transform: scale(0.92); }
    .hrlg-pusher-lbl {
      position: absolute; left: 50%; top: 100%; transform: translateX(-50%); margin-top: 2px;
      font-size: 8px; font-weight: 700; letter-spacing: 0.16em; color: var(--pc);
      text-shadow: 0 0 8px var(--pc-soft), 0 1px 2px rgba(0,0,0,0.9);
      white-space: nowrap; pointer-events: none;
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
      position: absolute; left: 50%; top: 50%; width: 190px; height: 190px;
      margin: -95px 0 0 -95px; border: 1px solid var(--hfc); border-radius: 50%;
      opacity: 0; pointer-events: none;
    }
    .hrlg-chime.go  { animation: hrlgChime 0.7s cubic-bezier(0.2,0.8,0.3,1) forwards; }
    .hrlg-chime.go2 { animation: hrlgChime 0.9s 0.1s cubic-bezier(0.2,0.8,0.3,1) forwards; }
    @keyframes hrlgChime {
      0%   { opacity: 0.8; transform: scale(0.4); }
      100% { opacity: 0;   transform: scale(1.3); }
    }
    /* unit name + AP pips under the watch */
    .hrlg-core {
      position: absolute; left: 8px; bottom: 122px; width: 190px; text-align: center;
      pointer-events: none; white-space: nowrap;
    }
    .hrlg-roman { font-family: 'Cinzel', serif; font-style: italic; font-size: 11px; color: var(--hfc); }
    .hrlg-name  { font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.1em; color: #e6e9f2; }
    .hrlg-ap {
      position: absolute; left: 8px; bottom: 102px; width: 190px;
      display: flex; align-items: center; justify-content: center; gap: 5px; pointer-events: none;
    }
    .hrlg-ap-lbl { font-size: 9px; letter-spacing: 0.24em; color: #555c70; }
    .hrlg-ap-num { font-size: 9px; letter-spacing: 0.1em; color: #8a93a8; margin-left: 2px; }
    .hrlg-ap-num + .hrlg-ap-num { margin-left: 0; }
    /* bonus (level-up) AP reads GREEN — both the extra pips and the /4, /5 max */
    .hrlg-ap-num.bonus { color: #6ee2a8; text-shadow: 0 0 7px rgba(110,226,168,0.55); }
    .hrlg-pip {
      width: 8px; height: 8px; transform: rotate(45deg);
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16);
    }
    .hrlg-pip.on { background: var(--hfc); border-color: var(--hfc); box-shadow: 0 0 7px var(--hfc); }
    .hrlg-pip.bonus { border-color: rgba(110,226,168,0.5); }
    .hrlg-pip.bonus.on { background: #6ee2a8; border-color: #6ee2a8; box-shadow: 0 0 8px #6ee2a8; }
    .hrlg-pip.spend { animation: hrlgSpend 0.7s ease-in-out infinite; }
    @keyframes hrlgSpend { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    /* HP/MP vitals under the watch — mirrors the top-left panel */
    .hrlg-vitals {
      position: absolute; left: 22px; bottom: 70px; width: 162px;
      display: flex; flex-direction: column; gap: 3px; pointer-events: none; z-index: 9;
    }
    .hrlg-vbar {
      position: relative; height: 12px; background: rgba(0,0,0,0.68);
      border: 1px solid rgba(255,255,255,0.1); overflow: hidden;
      clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%);
      display: flex; align-items: center;
    }
    .hrlg-vbar.mp { height: 10px; }
    .hrlg-vfill {
      position: absolute; left: 0; top: 0; bottom: 0;
      transition: width 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .hrlg-vlbl {
      position: relative; font-size: 7px; letter-spacing: 0.18em; margin-left: 4px;
      color: rgba(255,255,255,0.75); text-shadow: 0 1px 1px rgba(0,0,0,0.9);
    }
    .hrlg-vnum {
      position: relative; margin-left: auto; margin-right: 4px; font-size: 8px;
      color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.7);
    }
    /* ── 3 item slots under the watch vitals — one-click item use ── */
    .hrlg-items {
      position: absolute; left: 22px; bottom: 12px; width: 162px;
      display: flex; justify-content: center; gap: 8px;
      z-index: 9; pointer-events: auto;
    }
    .hrlg-item-slot {
      position: relative; width: 34px; height: 34px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.66); border: 1px solid var(--hfc-soft);
      clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .hrlg-item-slot:hover:not(.empty):not(.off) {
      border-color: var(--hfc); box-shadow: 0 0 10px var(--hfc-soft);
      transform: translateY(-1px);
    }
    .hrlg-item-slot.armed {
      border-color: var(--hfc);
      box-shadow: 0 0 12px var(--hfc-soft), inset 0 0 8px var(--hfc-faint);
    }
    .hrlg-item-slot.off { cursor: default; filter: grayscale(1); opacity: 0.45; }
    .hrlg-item-slot.empty { cursor: default; opacity: 0.28; border-style: dashed; }
    .hrlg-item-glyph { font-size: 16px; line-height: 1; }
    .hrlg-item-count {
      position: absolute; right: 2px; bottom: 0; font-size: 8px; color: #cfd6e4;
      text-shadow: 0 1px 2px #000, 0 0 3px #000; letter-spacing: 0.04em;
    }
    /* aiming-state line ("MOVING — CLICK A TILE") */
    .hrlg-mode {
      position: absolute; left: 8px; bottom: 56px; width: 190px; text-align: center;
      font-size: 8px; letter-spacing: 0.18em; color: var(--hfc); pointer-events: none;
    }
    /* drum position readout beside the AP row (no wrap — N of M) */
    .hrlg-scroll-hint {
      position: absolute; left: 205px; bottom: 104px; pointer-events: none;
      font-size: 8px; letter-spacing: 0.2em; color: #555c70; opacity: 0.85;
    }
    /* off-window overflow ARROWS riding the drum's top/bottom edge — they
       are buttons now: a click steps the list one row in that direction */
    .hrlg-more-ind {
      position: absolute; left: 100px; pointer-events: auto; cursor: pointer;
      white-space: nowrap; font-size: 10px; letter-spacing: 0.2em;
      color: var(--hfc); opacity: 0.9; text-shadow: 0 0 8px var(--hfc-soft);
      padding: 3px 12px 3px 9px; z-index: 8;
      background: rgba(10,12,21,0.78); border: 1px solid var(--hfc-soft);
      clip-path: polygon(6px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
      animation: hrlgMorePulse 1.6s ease-in-out infinite;
    }
    .hrlg-more-ind:hover {
      opacity: 1; color: #fff; border-color: var(--hfc);
      text-shadow: 0 0 12px var(--hfc); animation: none;
    }
    @keyframes hrlgMorePulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.55; } }
    /* ── the blade DRUM ─────────────────────────────────────────────
       STRAIGHT horizontal blades stacked against the clock; each row's
       left edge follows the bezel's curve (the center row rides the
       equator and protrudes furthest). The selected blade is larger and
       fully lit; neighbours fade above/below. Scrolling shifts every
       blade to its next slot — --tx/--ty/--o/--s animate via
       transform/opacity transitions. */
    .hrlg-fan { position: absolute; left: 103px; bottom: 245px; width: 0; height: 0; pointer-events: none; z-index: 2; }
    .hrlg-blade {
      position: absolute; left: 0; top: -19px; height: 38px; width: 288px;
      transform: translate(var(--tx), var(--ty));
      opacity: var(--o, 1);
      display: flex; align-items: center; pointer-events: auto; cursor: pointer;
      /* 'backwards' (NOT 'both'): once the eruption ends the animation must
         release transform/opacity, or the drum's scroll-glide (a transition
         on those same properties) would snap instead of slide. */
      animation: hrlgErupt 0.4s cubic-bezier(0.16,1.3,0.3,1) backwards;
      transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease;
      will-change: transform, opacity;
    }
    @keyframes hrlgErupt {
      0%   { opacity: 0; transform: translate(calc(var(--tx) - 52px), var(--ty)) scaleX(0.6); }
      60%  { opacity: var(--o, 1); transform: translate(calc(var(--tx) + 10px), var(--ty)) scaleX(1.03); }
      100% { opacity: var(--o, 1); transform: translate(var(--tx), var(--ty)) scaleX(1); }
    }
    .hrlg-body {
      position: relative; height: 100%; flex: 1; min-width: 0;
      display: flex; align-items: center; gap: 7px; padding: 0 14px 0 15px;
      background: linear-gradient(100deg, #0a0c15 0%, #0a0c15 55%, rgba(10,12,21,0.55) 100%);
      border: 1px solid var(--hfc-soft); border-left: 3px solid var(--hfc);
      clip-path: polygon(10px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
      transform: skewX(-10deg) scale(var(--s, 1));
      transform-origin: 0 50%;
      transition: transform 0.28s cubic-bezier(0.22,1,0.36,1), border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .hrlg-body > * { transform: skewX(10deg); }
    .hrlg-body.danger { border-left-color: #ff5e70; }
    .hrlg-glyph {
      font-size: 15px; color: var(--hfc); width: 18px; text-align: center; flex: none;
      text-shadow: 0 0 10px var(--hfc-soft);
    }
    .hrlg-body.danger .hrlg-glyph { color: #ff5e70; text-shadow: 0 0 10px rgba(255,94,112,0.4); }
    .hrlg-blabel {
      flex: 1; min-width: 0; font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px;
      letter-spacing: 0.05em; color: #e6e9f2; line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    /* badge blade: name + TYPE badge (name-sized) + small delivery/range
       chips share ONE row (SMT-style) — wider than a plain blade but the
       drum must never reach past mid-screen */
    .hrlg-blade.tall { height: 46px; top: -23px; width: 440px; }
    .hrlg-badges { display: flex; align-items: center; gap: 5px; flex: 0 1 auto; min-width: 0; overflow: hidden; }
    .hrlg-spacer { flex: 1 1 6px; min-width: 6px; }
    .hrlg-cost { display: flex; gap: 3px; align-items: center; flex: none; }
    .hrlg-cpip { width: 6px; height: 6px; transform: rotate(45deg); background: var(--hfc); box-shadow: 0 0 5px var(--hfc-soft); }
    .hrlg-cfree { font-size: 9px; letter-spacing: 0.16em; color: #6a7288; flex: none; white-space: nowrap; }
    .hrlg-tag {
      flex: none; font-size: 8px; letter-spacing: 0.14em; color: #ff7a8a;
      border: 1px solid rgba(255,122,138,0.55); padding: 1px 4px;
      background: rgba(255,0,0,0.06); white-space: nowrap;
    }
    /* right-side detail chips shared by every blade list */
    .hrlg-pw   { flex: none; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; }
    .hrlg-chip {
      flex: none; font-size: 9px; letter-spacing: 0.08em; color: #7fc9e8;
      border: 1px solid rgba(95,214,255,0.35); background: rgba(95,214,255,0.08);
      padding: 1px 5px; white-space: nowrap;
    }
    .hrlg-meta { flex: none; font-size: 8px; letter-spacing: 0.06em; color: #8a93a8; white-space: nowrap; }
    .hrlg-note {
      flex: none; font-size: 7px; font-weight: 700; letter-spacing: 0.1em;
      color: #1a1206; background: #ffcc44; padding: 1px 5px; white-space: nowrap;
      box-shadow: 0 0 6px rgba(255,204,68,0.4);
    }
    .hrlg-check {
      flex: none; font-size: 12px; font-weight: 700; color: #ffe096;
      text-shadow: 0 0 8px rgba(255,224,150,0.8);
    }
    /* ── view tab: names the open menu, riding the top of the clock ── */
    .hrlg-view-tab {
      position: absolute; left: 128px; bottom: 320px; max-width: 320px; height: 24px;
      display: flex; align-items: center; gap: 6px; padding: 0 16px 0 11px;
      background: linear-gradient(100deg, #0c101f 0%, rgba(10,12,21,0.88) 100%);
      border: 1px solid var(--hfc-soft); border-left: 3px solid var(--hfc);
      clip-path: polygon(8px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      transform: skewX(-10deg);
      box-shadow: -2px 0 14px var(--hfc-faint);
      pointer-events: none; z-index: 9;
      animation: hrlgTabIn 0.3s cubic-bezier(0.16,1.3,0.3,1) backwards;
    }
    .hrlg-view-tab > * { transform: skewX(10deg); }
    @keyframes hrlgTabIn {
      0%   { opacity: 0; transform: skewX(-10deg) translateX(-24px); }
      100% { opacity: 1; transform: skewX(-10deg) translateX(0); }
    }
    .hrlg-view-tab-icon { color: var(--hfc); font-size: 11px; flex: none; text-shadow: 0 0 8px var(--hfc-soft); }
    .hrlg-view-tab-text {
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 12px;
      letter-spacing: 0.14em; text-transform: uppercase; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .hrlg-view-tab-count { font-size: 8px; letter-spacing: 0.1em; color: #8a93a8; flex: none; white-space: nowrap; }
    /* the CURSOR row (keyboard/wheel selection) pops hardest inside the
       focus window — every .center row is lit and one-click live, but the
       .sel row carries the strongest glow + the 1.12 scale */
    .hrlg-blade.center.sel .hrlg-body {
      background: linear-gradient(100deg, #16203a 0%, #0e1326 65%, rgba(14,19,38,0.6) 100%);
      box-shadow: -2px 0 22px var(--hfc-soft), inset 3px 0 0 var(--hfc);
    }
    .hrlg-blade.center.sel .hrlg-body.danger {
      box-shadow: -2px 0 22px rgba(255,94,112,0.3), inset 3px 0 0 #ff5e70;
    }
    /* every focus-window blade is lit and armed */
    .hrlg-blade.center .hrlg-body {
      background: linear-gradient(100deg, #121828 0%, #0c101f 60%, rgba(12,16,31,0.6) 100%);
      border-color: var(--hfc);
      box-shadow: -2px 0 16px var(--hfc-faint), inset 3px 0 0 var(--hfc);
    }
    .hrlg-blade.center .hrlg-blabel { color: #fff; text-shadow: 0 0 12px var(--hfc-soft); }
    .hrlg-blade.center .hrlg-body.danger { box-shadow: -2px 0 16px rgba(255,94,112,0.22), inset 3px 0 0 #ff5e70; }
    /* hover on the center blade: it juts toward the player and ignites */
    .hrlg-blade.center:hover:not(.dead) .hrlg-body {
      transform: skewX(-10deg) scale(var(--s, 1)) translateX(11px);
      background: linear-gradient(100deg, #16203a 0%, #0e1326 65%, rgba(14,19,38,0.6) 100%);
      box-shadow: -2px 0 22px var(--hfc-soft), inset 3px 0 0 var(--hfc);
    }
    .hrlg-blade.center:hover:not(.dead) .hrlg-body.danger {
      border-color: #ff5e70;
      box-shadow: -2px 0 22px rgba(255,94,112,0.33), inset 3px 0 0 #ff5e70;
    }
    .hrlg-blade.center:hover:not(.dead) .hrlg-blabel { color: var(--hfc); }
    .hrlg-blade.center:hover:not(.dead) .hrlg-body.danger .hrlg-blabel { color: #ff8a97; }
    /* faded neighbours invite a click (which rotates them into the center) */
    .hrlg-blade.dim:hover { opacity: calc(var(--o, 1) + 0.25); }
    .hrlg-blade.dim:hover .hrlg-body { border-color: var(--hfc); }
    /* armed verb keeps pulsing while aiming */
    .hrlg-blade.active .hrlg-body { border-color: var(--hfc); animation: hrlgActive 1.5s ease-in-out infinite; }
    @keyframes hrlgActive {
      0%, 100% { box-shadow: -2px 0 12px var(--hfc-soft), inset 3px 0 0 var(--hfc); }
      50%      { box-shadow: -2px 0 26px var(--hfc), inset 3px 0 0 var(--hfc); }
    }
    .hrlg-blade.dead.center { cursor: default; }
    /* .dead = inert; .ghost = greyed but still clickable (opens the list so
       it can explain itself). Both share the same washed-out look. */
    .hrlg-blade.dead .hrlg-body, .hrlg-blade.ghost .hrlg-body {
      background: #0a0b11; border-color: rgba(120,140,180,0.13); border-left-color: #555c70;
      filter: grayscale(1); opacity: 0.68;
    }
    .hrlg-blade.dead .hrlg-glyph, .hrlg-blade.dead .hrlg-blabel,
    .hrlg-blade.ghost .hrlg-glyph, .hrlg-blade.ghost .hrlg-blabel { color: #555c70; text-shadow: none; }
    /* confirm flash sweeping along the blade */
    .hrlg-flash {
      position: absolute; inset: 0; background: var(--hfc); mix-blend-mode: screen;
      opacity: 0; pointer-events: none; clip-path: inherit;
    }
    .hrlg-blade.fire .hrlg-flash { animation: hrlgFire 0.4s ease-out; }
    @keyframes hrlgFire {
      0%   { opacity: 0.85; transform: translateX(0); }
      100% { opacity: 0;    transform: translateX(26px); }
    }
    /* NOTE: the old max-width media-query scales are gone — _applyUIScale()
       in ui.js now folds device size into --ew-ui-scale directly. */

    /* ── whole-HUD fit: fixed panels shrink together on small screens ──
       --ew-hud-scale is 1 on desktop (panels stay their designed size) and
       drops toward ~0.5 on phones so the scoreboard / unit panel / log /
       minimap stop eating the battlefield. Corner-anchored transforms keep
       every panel pinned where it belongs. */
    .ew-unitpanel  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 0 0; }
    .ew-scoreboard { transform: translateX(-50%) scale(var(--ew-hud-scale, 1)) !important; transform-origin: 50% 0; }
    .ew-matchmeta  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 100% 0; }
    .ew-combatlog  { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 100% 0; }
    #battleMinimap { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 100% 100%; }
    .battle-subtitle-text { transform: scale(var(--ew-hud-scale, 1)); transform-origin: 50% 100%; }

    /* ══════════ SPELL DESCRIPTION BAR — SMT-style HELP strip ══════════
       One long, thin black bar pinned bottom-center. Gold/holo-blue
       hairline edges that fade out toward the ends; the black fill fades
       too. Describes the drum's selected (or hovered) ability. */
    #ew-spell-descbar {
      position: fixed; left: 50%; bottom: 12px; z-index: 60;
      width: min(1160px, 96vw);
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
        rgba(95,214,255,0) 0%, rgba(95,214,255,0.85) 16%,
        rgba(242,196,104,0.95) 50%,
        rgba(95,214,255,0.85) 84%, rgba(95,214,255,0) 100%);
      filter: drop-shadow(0 0 5px rgba(95,214,255,0.45));
    }
    #ew-spell-descbar::before { top: 0; }
    #ew-spell-descbar::after  { bottom: 0; }
    .ew-descbar-inner {
      min-height: 46px; padding: 8px 64px;
      display: flex; align-items: center; justify-content: center;
      gap: 14px; flex-wrap: wrap; row-gap: 4px;
      background: linear-gradient(90deg,
        rgba(4,6,12,0) 0%, rgba(4,6,12,0.9) 6%,
        rgba(4,6,12,0.94) 94%, rgba(4,6,12,0) 100%);
    }
    .ew-descbar-name {
      font-family: 'Cinzel', serif; font-size: 16px; font-weight: 700;
      color: #f2c468; letter-spacing: 0.06em; white-space: nowrap;
      text-shadow: 0 0 10px rgba(242,196,104,0.35), 0 1px 2px rgba(0,0,0,0.9);
    }
    .ew-descbar-desc {
      font-size: 12px; line-height: 1.45; color: #cfd6e4;
      text-shadow: 0 1px 2px rgba(0,0,0,0.85);
      max-width: 52%;
    }
    .ew-descbar-stats {
      font-size: 10px; letter-spacing: 0.08em; color: #8a93a8; white-space: nowrap;
    }
    .ew-descbar-status { font-size: 10px; color: #c89ee0; white-space: nowrap; }
    @media (max-width: 760px) {
      .ew-descbar-inner { padding: 6px 26px; gap: 8px; }
      .ew-descbar-desc { max-width: 100%; }
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
