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
  const src = useMemo(() => {
    if (!unit) return '';
    if (typeof getUnitSprite === 'function') return getUnitSprite(unit.cls, unit.player, unit);
    if (typeof getR2RaceSpriteUrl === 'function') {
      return getR2RaceSpriteUrl(unit.race, unit.gender || 'male', unit.cls || 'Freelancer') || '';
    }
    return '';
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
      backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center bottom',
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
        fontFamily: mono, fontSize: 10, letterSpacing: '0.14em',
        color: EW.ink, fontWeight: 600, whiteSpace: 'nowrap',
      }}, name),
      sub != null && !showTower && h('span', { style: {
        fontFamily: mono, fontSize: 8, color: EW.inkMute, letterSpacing: '0.06em', whiteSpace: 'nowrap',
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
        fontFamily: mono, fontSize: 7, color: EW.inkDim, letterSpacing: '0.08em',
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
        fontFamily: mono, fontSize: 7, letterSpacing: '0.26em', color: EW.inkMute,
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
        fontFamily: mono, fontSize: 7, letterSpacing: '0.24em', lineHeight: 1,
        color: isSuddenDeath ? EW.bad : EW.inkDim,
        textShadow: isSuddenDeath ? '0 0 8px ' + EW.bad : 'none',
      }}, isSuddenDeath ? '⚡ SUDDEN DEATH' : scoreCaption),

      h('div', { style: {
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 3,
        paddingTop: 4, borderTop: '1px solid ' + EW.panelEdge,
        width: '100%', justifyContent: 'center',
      }},
        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, lineHeight: 1 }},
          h('span', { style: { fontFamily: mono, fontSize: 6, letterSpacing: '0.2em', color: EW.inkDim }}, 'TIME'),
          h('span', { style: { fontFamily: mono, fontSize: 13, fontWeight: 700, color: EW.ink }}, mins + ':' + secs),
        ),
        h('span', { style: { width: 1, height: 22, background: EW.panelEdge }}),
        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, lineHeight: 1 }},
          h('span', { style: { fontFamily: mono, fontSize: 6, letterSpacing: '0.2em', color: EW.inkDim }}, 'ROUND'),
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 1 }},
            h('span', { style: {
              fontFamily: serif, fontSize: 19, fontWeight: 600, color: EW.time, lineHeight: 1,
              textShadow: '0 0 10px ' + EW.time + '55',
            }}, round),
            roundLimit > 0 && h('span', { style: {
              fontFamily: mono, fontSize: 9, color: EW.inkMute,
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

  const matchNum = st.matchNumber || 1;
  const p1Score = st.record ? (st.record[1] || 0) : 0;
  const p2Score = st.record ? (st.record[2] || 0) : 0;

  return h('div', { style: {
    position: 'absolute', top: 12, right: 12,
    display: 'flex', flexDirection: 'column', gap: 6,
    alignItems: 'flex-end', zIndex: 10,
  }},
    h('div', { style: {
      display: 'flex', alignItems: 'center', gap: 10,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      padding: '6px 12px',
      fontFamily: '"DotGothic16", monospace', fontSize: 9,
      letterSpacing: '0.14em', color: EW.inkMute,
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
    }},
      h('span', { style: { color: EW.ink }}, weatherText),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
        h('span', { style: {
          fontFamily: '"Cinzel", serif', fontStyle: 'italic',
          fontSize: 13, color: EW.time,
        }}, zodiacIcon),
        h('span', { style: { color: EW.ink }}, zodiacLabel),
      ),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', null, 'MATCH'),
      h('span', { style: { color: EW.ink, fontWeight: 600 }}, p1Score + ' — ' + p2Score),
      h('span', { style: { width: 1, height: 10, background: EW.panelEdge }}),
      h('span', {
        style: { cursor: 'pointer', color: EW.inkMute, fontSize: 14 },
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
      fontFamily: '"DotGothic16", monospace', fontSize: 7,
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

  return h('div', { style: {
    position: 'absolute', right: 90, top: 140, width: 280,
    padding: '8px 12px 0', background: 'rgba(8,10,18,0.55)',
    borderLeft: '2px solid ' + EW.panelEdge,
    display: 'flex', flexDirection: 'column',
    fontFamily: '"DotGothic16", monospace', fontSize: 9,
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
            lineHeight: 1.3, fontSize: 9,
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

function ActionMenu({ st }) {
  if (!st || st.phase !== 'battle') return null;

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

  const attackAction = {
    id: 'attack', label: 'Attack', icon: '×', cost: 1,
    available: !!apc.hasAttack,
    sub: apc.hasAttack ? null : 'No target',
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
    available: hasSpells || hasAnySpells,
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

  const actions = [moveAction, attackAction, abilAction, comboAction, itemsAction, moreAction];

  const tileTargetModes = ['combo', 'inspect', 'ward', 'flair', 'trade', 'warpStone'];
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

  if (inTileTarget) {
    const modeLabels = {
      move: '⬆ Moving…', jump: '🦘 Jumping…', combo: '⚔ Combo…',
      inspect: '🔍 Inspect…', ward: '👁 Ward…', flair: '🔥 Flair…',
      trade: '🔄 Trade…', warpStone: '⚡ Warp…',
    };
    return h(ClipPanel, {
      factionColor: fc,
      style: {
        position: 'absolute', bottom: 16, left: 16, width: 220, zIndex: 12,
      },
    },

      h('div', { style: {
        padding: '8px 12px', borderBottom: '1px solid ' + EW.panelEdge,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, ' + fc + '10, transparent)',
      }},
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 6 }},
          h('span', { style: { fontFamily: '"Cinzel", serif', fontStyle: 'italic', fontSize: 13, color: fc }}, roman),
          h('span', { style: { fontFamily: '"Cinzel", serif', fontSize: 16, color: EW.ink, letterSpacing: '0.04em' }}, unitName),
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 3, fontFamily: '"DotGothic16", monospace', fontSize: 8, letterSpacing: '0.14em' }},
          h('span', { style: { color: EW.time, fontWeight: 600 }}, (unit.ap || 0) + '/' + maxAP),
          h('span', { style: { color: EW.inkMute }}, 'AP'),
        ),
      ),

      h('div', { style: {
        padding: '6px 12px',
        fontFamily: '"DotGothic16", monospace', fontSize: 9,
        letterSpacing: '0.1em', color: EW.inkMute,
      }}, modeLabels[am] || am),

      h('div', { style: { padding: '4px 6px 8px', borderTop: '1px solid ' + EW.panelEdge }},
        h('div', {
          className: 'rhud-back',
          style: {
            padding: '6px 10px', cursor: 'pointer',
            fontFamily: '"DotGothic16", monospace', fontSize: 10,
            letterSpacing: '0.14em', color: EW.inkMute,
          },
          onClick: onCancel,
        }, '← Cancel'),
      ),
    );
  }

  return h(ClipPanel, {
    factionColor: fc,
    style: {
      position: 'absolute', bottom: 16, left: 16, width: 220, zIndex: 12,
    },
  },

    h('div', { style: {
      padding: '8px 12px', borderBottom: '1px solid ' + EW.panelEdge,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'linear-gradient(180deg, ' + fc + '10, transparent)',
    }},
      h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 6 }},
        h('span', { style: { fontFamily: '"Cinzel", serif', fontStyle: 'italic', fontSize: 13, color: fc }}, roman),
        h('span', { style: { fontFamily: '"Cinzel", serif', fontSize: 16, color: EW.ink, letterSpacing: '0.04em' }}, unitName),
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 3, fontFamily: '"DotGothic16", monospace', fontSize: 8, letterSpacing: '0.14em' }},
        h('span', { style: { color: EW.time, fontWeight: 600 }}, (unit.ap || 0) + '/' + maxAP),
        h('span', { style: { color: EW.inkMute }}, 'AP'),
      ),
    ),

    h('div', { style: { padding: '4px 0' }},
      actions.map(a =>
        h(ActionRow, { key: a.id, a: a, accent: fc, active: am === a.id || a.selected, onClick: () => onAction(a) })
      ),
    ),

    (() => {
      const btnColor = EW.bad;
      const btnLabel = '■ END TURN';
      const btnHint = 'SPACE';
      return h('div', { style: { padding: '4px 6px 8px', borderTop: '1px solid ' + EW.panelEdge, marginTop: 2 }},
        h('div', {
          className: 'rhud-end-turn',
          style: {
            padding: '7px 10px',
            background: 'linear-gradient(180deg, ' + btnColor + '22, ' + btnColor + '08)',
            border: '1px solid ' + btnColor + '66',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          },
          onClick: onEndTurn,
        },
          h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 10,
            letterSpacing: '0.18em', color: btnColor, fontWeight: 600,
          }}, btnLabel),
          h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 8,
            color: EW.inkDim, letterSpacing: '0.14em',
          }}, btnHint),
        ),
      );
    })(),
  );
}

function ActionRow({ a, accent, active, onClick }) {

  const visuallyDisabled = !a.available || (a.sub && a.id !== 'more');
  const cls = 'rhud-row' + (visuallyDisabled ? ' rhud-disabled' : '');

  let onEnter, onLeave;
  if (a.id === 'attack' && a.available) {
    onEnter = () => { if (typeof previewAttackRange === 'function') previewAttackRange(); };
    onLeave = () => { if (typeof clearAttackRangePreview === 'function') clearAttackRangePreview(); };
  }
  return h('div', {
    className: cls,
    style: {
      padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
      cursor: a.available || a.id === 'abil' ? 'pointer' : 'default',
      background: active ? 'linear-gradient(90deg, ' + accent + '1f, transparent)' : 'transparent',
      borderLeft: active ? '2px solid ' + accent : '2px solid transparent',
      opacity: visuallyDisabled ? 0.5 : 1,
    },
    onClick: a.available || a.id === 'abil' ? onClick : undefined,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
  },
    h('span', { className: 'rhud-row-icon', style: {
      width: 16, color: active ? accent : EW.inkMute, fontSize: 13, fontWeight: 600,
      textAlign: 'center',
    }}, a.icon),
    h('span', { className: 'rhud-row-label', style: {
      flex: 1, fontFamily: '"Cinzel", serif', fontSize: 15,
      color: active ? EW.ink : EW.inkMute, letterSpacing: '0.02em',
    }}, a.label),
    a.cost !== null && a.cost !== undefined && !a.sub && h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 8,
      color: a.available ? (active ? accent : EW.inkMute) : EW.inkDim,
      letterSpacing: '0.1em',
    }}, typeof a.cost === 'number' ? a.cost + ' AP' : a.cost),
    a.sub && h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 10, fontWeight: 600,
      color: EW.bad, letterSpacing: '0.06em',
    }}, a.sub),
  );
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

// Primary power stat for the header (red PWR / green HP / cyan SHLD …).
function spellPowerStat(sp) {
  if (sp.dmg) return { value: sp.dmg, unit: 'PWR', color: '#ee6655' };
  if (sp.hitDamages && sp.hitDamages.length) return { value: sp.hitDamages.reduce((s, v) => s + v, 0), unit: 'PWR', color: '#ee6655' };
  if (sp.dotDamage) return { value: sp.dotDamage, unit: 'DOT', color: '#ee6655' };
  if (sp.heal) return { value: sp.heal, unit: 'HP', color: '#55cc66' };
  if (sp.shield) return { value: sp.shield, unit: 'SHLD', color: '#5fd6ff' };
  return null;
}

function SubMenu({ st }) {
  if (!st || st.phase !== 'battle') return null;

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

  const menuView = st.actionMenuView || 'root';
  const am = st.actionMode;

  if (menuView === 'root' && am !== 'attack') return null;

  const fc = getFactionColor(unit);

  if (menuView === 'spells') {
    if (am === 'spell' && st.selectedTool) {

      const allSp = [...(unit.spells || []), ...(unit._raceAbilities || [])].filter(Boolean);
      const selSp = allSp.find(s => s.name === st.selectedTool);
      const selDesc = selSp ? spellTagline(selSp) : '';
      const selVal = selSp && typeof getSpellPowerLabel === 'function' ? getSpellPowerLabel(selSp) : '';
      const selRng = selSp ? (selSp.range || 0) : 0;
      const selAoe = selSp ? (selSp.aoeRadius || 0) : 0;
      let selRangeStr = selRng > 0 ? selRng + ' range' : 'self';
      if (selAoe > 0) selRangeStr += ' · ' + selAoe + ' aoe';
      return h(SubMenuPanel, { title: st.selectedTool + ' · Click target', fc: fc },
        selDesc && h('div', { style: {
          padding: '4px 12px 6px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
          color: EW.inkMute, letterSpacing: '0.02em', lineHeight: '1.4',
        }}, selDesc),
        (selVal || selRng) && h('div', { style: {
          padding: '0 12px 6px', fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: EW.inkDim, letterSpacing: '0.08em', display: 'flex', gap: 8,
        }},
          selVal && h('span', { style: { color: '#ee6655', fontWeight: 700 }}, selVal),
          h('span', null, selRangeStr),
        ),
        h(SubMenuRow, { label: '← Cancel', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
      );
    }

    const spells = [...(unit.spells || []), ...(unit._raceAbilities || [])].filter(Boolean);
    const allAbilities = spells;
    const tierOrder = { 'I': 1, 'II': 2, 'III': 3 };

    const mpPenalty = typeof unitHasStatus === 'function' && unitHasStatus(unit, 'silence') ? 999 : 0;

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
    allAbilities.sort((a, b) => {
      const aAvail = _availOf(a) ? 0 : 1;
      const bAvail = _availOf(b) ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
    });

    return h(SubMenuPanel, {
      title: 'Abilities',
      fc: fc,
      wide: true,
      count: allAbilities.filter(sp => {
        const cost = sp.cost || 0;
        const canAfford = unit.mp >= (cost + mpPenalty) && (typeof canAffordSpell === 'function' ? canAffordSpell(unit, sp) : true);
        return canAfford;
      }).length + '/' + allAbilities.length,
    },
      allAbilities.map((sp, i) => {
        const cost = sp.cost || 0;
        const apCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 1;
        const isSilenced = mpPenalty > 0;
        const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(unit, sp) : true;
        const canAfford = !isSilenced && tierOk && unit.mp >= cost && (typeof canAffordSpell === 'function' ? canAffordSpell(unit, sp) : true);
        const hasTarget = typeof hasSpellTargetInRange === 'function' ? hasSpellTargetInRange(unit, sp) : true;
        // No target in range from here, but reachable by stepping into range and
        // still casting this turn → castable via move-then-cast (not greyed).
        const canReach = canAfford && !hasTarget && typeof spellHasReachableTarget === 'function' && spellHasReachableTarget(unit, sp);
        const canCast = canAfford && (hasTarget || canReach);
        const needsMove = canCast && !hasTarget && canReach;
        const active = am === 'spell' && st.selectedTool === sp.name;

        let spellReason = '';
        if (!canCast) {
          if (isSilenced) spellReason = 'Silenced';
          else if (!tierOk) { const trl = sp.tier === 'II' ? 2 : sp.tier === 'III' ? 3 : 1; spellReason = 'Req Lv.' + trl; }
          else if (unit.mp < cost) spellReason = 'No MP';
          else if ((unit.ap || 0) < apCost) spellReason = 'No AP';
          else if (!hasTarget) spellReason = 'No target';
        }

        const elemColors = {
          divine: EW.divine, unholy: EW.unholy, anomaly: EW.anomaly,
          tech: EW.tech, human: EW.human, alien: EW.alien,
        };
        const tc = elemColors[sp.spellType] || EW.inkMute;

        const cat = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
        const catConfig = {
          damage: { icon: '⚔', label: 'DMG', color: '#ee6655', bg: 'rgba(238,102,85,' },
          heal:   { icon: '♥', label: 'HEAL', color: '#55cc66', bg: 'rgba(85,204,102,' },
          buff:   { icon: '▲', label: 'BUFF', color: '#55aaff', bg: 'rgba(85,170,255,' },
          debuff: { icon: '▼', label: 'DEBUF', color: '#cc77dd', bg: 'rgba(204,119,221,' },
          utility:{ icon: '◎', label: 'UTIL', color: '#ccaa55', bg: 'rgba(204,170,85,' },
        };
        const cc = catConfig[cat] || catConfig.damage;

        const val = typeof getSpellPowerLabel === 'function' ? getSpellPowerLabel(sp) : '';

        const rng = sp.range || 0;
        const aoeR = sp.aoeRadius || 0;
        let rangeStr = rng > 0 ? rng + 'rng' : 'self';
        if (aoeR > 0) rangeStr += ' · ' + aoeR + 'aoe';

        const isPhysical = sp.damageType === 'physical';

        const powerStat = spellPowerStat(sp);
        const targetMode = spellTargetMode(sp);
        const delivery = spellDeliveryBadge(sp, cat);
        const desc = sp.desc || spellTagline(sp);
        const accent = active ? cc.color : tc;

        // Small color-coded stat chip: big number + tiny unit label (PWR / MP / AP).
        const statChip = (v, u, col) => h('span', {
          style: { display: 'inline-flex', alignItems: 'baseline', gap: 2, flexShrink: 0, fontFamily: '"DotGothic16", monospace' },
        },
          h('span', { style: { fontSize: 13, fontWeight: 700, color: col, letterSpacing: '0.01em' }}, v),
          h('span', { style: { fontSize: 8, fontWeight: 700, color: col, opacity: 0.78, letterSpacing: '0.05em' }}, u),
        );

        return h('div', {
          key: sp.name || i,
          className: 'rhud-move-slot' + (active ? ' is-focused' : '') + (canCast ? '' : ' is-disabled'),
          style: { position: 'relative', margin: '5px 8px' },
        },

          // Soft radial bloom that lives BEHIND the card (outside its clip), so the
          // glow reads as a cloud of light rather than a hard rim.
          h('div', { className: 'rhud-move-glow', 'aria-hidden': 'true' }),

          h('div', {
          className: 'rhud-move-card' + (canCast ? '' : ' rhud-disabled') + (active ? ' rhud-move-card-active' : ''),
          style: {
            position: 'relative', zIndex: 1, overflow: 'hidden',
            cursor: canCast ? 'pointer' : 'default',
            opacity: canCast ? 1 : 0.5,
            background: 'linear-gradient(135deg, rgba(13,15,24,0.96) 0%, rgba(9,11,18,0.93) 100%)',
            border: '1px solid ' + (active ? 'rgba(255,224,150,0.9)' : 'rgba(120,140,180,0.16)'),
            borderLeft: '3px solid ' + (active ? '#ffcf7a' : (canCast ? accent : EW.inkDim)),
            clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
          },
          onClick: canCast ? () => { hideSpellTooltip(); if (typeof setTool === 'function') setTool('spell', sp.name); } : undefined,
          onMouseEnter: (e) => { showSpellTooltip(sp, e.nativeEvent || e); if (canCast && typeof previewSpellRange === 'function') previewSpellRange(sp.name); },
          onMouseMove: (e) => { moveSpellTooltip(e.nativeEvent || e); },
          onMouseLeave: () => { hideSpellTooltip(); if (canCast && typeof clearSpellRangePreview === 'function') clearSpellRangePreview(); },
        },

          // ── Header bar: NAME + red PWR / blue MP / gold AP ──
          h('div', { style: {
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 11px 6px 12px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 100%)',
            borderBottom: '1px solid rgba(120,140,180,0.12)',
          }},
            h('span', { style: {
              flex: 1, fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700,
              color: canCast ? EW.ink : EW.inkMute, letterSpacing: '0.04em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}, sp.name),
            powerStat && statChip(powerStat.value, powerStat.unit, powerStat.color),
            statChip(cost, 'MP', EW.space),
            statChip(apCost, 'AP', EW.time),
          ),

          // ── Body: element badge (ALIEN…) + description ──
          h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 11px 4px' }},
            h('span', { style: typeBadgeStyleFor(sp.spellType) }, (sp.spellType || '').toUpperCase()),
            desc && h('span', { style: {
              flex: 1, fontFamily: '"DotGothic16", monospace', fontSize: 9, lineHeight: '1.45',
              color: canCast ? EW.inkMute : EW.inkDim, letterSpacing: '0.01em',
            }}, desc),
          ),

          // ── Footer: targeting mode · range  +  delivery pill / reason ──
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '2px 11px 8px' }},
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: EW.inkMute,
            }}, targetMode),
            rangeStr && h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 8, letterSpacing: '0.06em', color: EW.inkDim,
            }}, '· ' + rangeStr),
            h('span', { style: { flex: 1 }}),
            spellReason
              ? h('span', { style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                  color: EW.bad, flexShrink: 0,
                }}, spellReason)
              : needsMove
              ? h('span', { style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                  color: '#1a1206', background: '#ffcc44', border: '1px solid #ffcc44',
                  borderRadius: '9px', padding: '1px 9px', flexShrink: 0,
                  boxShadow: '0 0 7px #ffcc4470',
                }}, 'MOVE → CAST')
              : h('span', { style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                  color: '#fff', background: delivery.color, border: '1px solid ' + delivery.color,
                  borderRadius: '9px', padding: '1px 9px', flexShrink: 0,
                  boxShadow: '0 0 7px ' + delivery.color + '70',
                }}, delivery.label),
          ),
          )
        );
      }),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'items') {
    if (am === 'item' && st.selectedTool) {
      return h(SubMenuPanel, { title: st.selectedTool + ' · Click target', fc: fc },
        h(SubMenuRow, { label: '← Cancel', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
      );
    }
    const heldKeys = typeof ITEM_RULES !== 'undefined'
      ? Object.keys(ITEM_RULES).filter(k => (unit.items?.[k] || 0) > 0) : [];
    return h(SubMenuPanel, { title: 'Items', fc: fc },
      heldKeys.map(itemKey => {
        const count = unit.items?.[itemKey] || 0;
        const rules = typeof ITEM_RULES !== 'undefined' ? ITEM_RULES[itemKey] : null;
        const canUse = typeof canUseItemNow === 'function' ? canUseItemNow(unit, itemKey) : true;
        const active = am === 'item' && st.selectedTool === itemKey;

        let itemReason = '';
        if (!canUse) {
          if (itemKey === 'healPotion') itemReason = 'HP full';
          else if (itemKey === 'manaPotion') itemReason = 'No ally needs MP';
          else itemReason = 'Can\'t use';
        }
        return h('div', {
          key: itemKey,
          className: 'rhud-row' + (canUse ? '' : ' rhud-disabled'),
          style: {
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
            cursor: canUse ? 'pointer' : 'default',
            background: active ? 'linear-gradient(90deg, ' + EW.time + '1a, transparent)' : 'transparent',
            borderLeft: active ? '2px solid ' + EW.time : '2px solid transparent',
            opacity: canUse ? 1 : 0.5,
          },
          onClick: canUse ? () => { if (typeof chooseItemAction === 'function') chooseItemAction(itemKey); } : undefined,
        },
          h('span', { className: 'rhud-row-icon', style: { fontSize: 12, width: 14, textAlign: 'center' }}, '❖'),
          h('span', { className: 'rhud-row-label', style: {
            flex: 1, fontFamily: '"Cinzel", serif', fontSize: 14,
            color: active ? EW.ink : EW.inkMute, letterSpacing: '0.02em',
          }}, rules?.name || itemKey),
          itemReason
            ? h('span', { style: {
                fontFamily: '"DotGothic16", monospace', fontSize: 10, fontWeight: 600,
                color: EW.bad, letterSpacing: '0.04em',
              }}, itemReason)
            : h('span', { style: {
                fontFamily: '"DotGothic16", monospace', fontSize: 8,
                color: EW.inkMute, letterSpacing: '0.06em',
              }}, '×' + count),
        );
      }),
      heldKeys.length === 0 && h('div', { style: {
        padding: '6px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkDim, letterSpacing: '0.1em',
      }}, 'No items'),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'more') {
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

    /* Recall: teleport back to spawn zone */
    if (typeof RECALL_AP_COST !== 'undefined' && typeof RECALL_COOLDOWN_ROUNDS !== 'undefined') {
      const canRecall = (unit.ap || 0) >= RECALL_AP_COST && (unit._recallCooldown || 0) <= 0;
      const cdLeft = unit._recallCooldown || 0;
      const sub = cdLeft > 0 ? `CD: ${cdLeft}` : `${RECALL_AP_COST} AP`;
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

    return h(SubMenuPanel, { title: 'More Actions', fc: fc },
      moreItems.map((item, i) =>
        h('div', {
          key: i,
          className: 'rhud-row',
          style: {
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            background: item.active ? 'linear-gradient(90deg, ' + EW.time + '1a, transparent)' : 'transparent',
            borderLeft: item.active ? '2px solid ' + EW.time : '2px solid transparent',
          },
          onClick: item.onClick,
        },
          h('span', { className: 'rhud-row-label', style: {
            flex: 1, fontFamily: '"Cinzel", serif', fontSize: 14,
            color: EW.inkMute, letterSpacing: '0.02em',
          }}, item.label),
          item.sub && h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 8,
            color: EW.inkDim, letterSpacing: '0.06em',
          }}, item.sub),
        ),
      ),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'switch') {
    const reserves = typeof _gauntletReserves === 'function' ? _gauntletReserves(unit.player) : [];
    const switchCost = (typeof getActiveMultiplayerMode === 'function' && getActiveMultiplayerMode()?.switchApCost) || 2;
    return h(SubMenuPanel, { title: 'Switch In Reserve', fc: fc, count: reserves.length + '' },
      reserves.map((r, i) => {
        const hpPct = r.maxHp > 0 ? Math.round((r.hp / r.maxHp) * 100) : 0;
        const statusKeys = (typeof getActiveStatusKeys === 'function')
          ? getActiveStatusKeys(r).filter(k => typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[k]?.category === 'status')
          : [];
        return h('div', {
          key: r.id,
          className: 'rhud-row',
          style: { padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
          onClick: () => {
            if (typeof doSwitch === 'function') doSwitch(unit, r.id);
          },
        },
          h(UnitSprite, { unit: r, size: 22 }),
          h('div', { style: { flex: 1, minWidth: 0 }},
            h('div', { style: {
              fontFamily: '"Cinzel", serif', fontSize: 13, color: EW.ink,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}, typeof unitDisplayName === 'function' ? unitDisplayName(r) : (r.name || r.cls)),
            h('div', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 7,
              color: EW.inkMute, letterSpacing: '0.06em',
            }}, (r.cls || '').toUpperCase() + (statusKeys.length ? ' · ' + statusKeys.map(k => STATUS_DEFS[k]?.short || k).join(' ') : '')),
          ),
          h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 9,
            color: hpPct <= 30 ? EW.bad : EW.good, fontWeight: 600,
          }}, hpPct + '%'),
        );
      }),
      reserves.length === 0 && h('div', { style: {
        padding: '8px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9, color: EW.inkMute,
      }}, 'No reserves left.'),
      h('div', { style: {
        padding: '4px 12px 6px', fontFamily: '"DotGothic16", monospace', fontSize: 7,
        color: EW.inkDim, letterSpacing: '0.06em', borderTop: '1px solid ' + EW.panelEdge,
      }}, `Costs ${switchCost} AP · reserve enters with leftover AP · stat buffs reset`),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'attackTargets') {
    const targets = typeof _getAttackValidTargets === 'function' ? _getAttackValidTargets(unit) : [];
    return h(SubMenuPanel, { title: 'Attack Targets', fc: fc, count: targets.length + '' },
      targets.map((t, i) => {
        const isPending = st.pendingTarget && st.pendingTarget.x === t.x && st.pendingTarget.y === t.y;
        let label = '', hpVal = 0, hpMax = 1, tUnit = null, typeAdv = '';
        if (t.kind === 'unit') {
          tUnit = t.unit;
          label = typeof unitDisplayName === 'function' ? unitDisplayName(tUnit) : (tUnit.name || tUnit.cls);
          hpVal = tUnit.hp; hpMax = tUnit.maxHp;
          if (typeof getTypeEffectSummary === 'function') {
            const adv = getTypeEffectSummary(unit.types || [], tUnit.types || []);
            typeAdv = adv.hasStrong && !adv.hasWeak ? '▲' : adv.hasWeak && !adv.hasStrong ? '▼' : '';
          }
        } else if (t.kind === 'tower') { label = '⬡ Cube'; hpVal = t.tower.hp; hpMax = t.tower.maxHp || t.tower.hp; }
        else if (t.kind === 'turret') { label = '🔧 Turret'; hpVal = t.turret.hp; hpMax = t.turret.maxHp || t.turret.hp; }
        else if (t.kind === 'deployedObj') { label = '📦 ' + (t.deployedObj.spellName || 'Object'); hpVal = t.deployedObj.hp; hpMax = t.deployedObj.maxHp || t.deployedObj.hp; }
        else if (t.kind === 'seed') { label = '🌱 ' + (t.seedName || 'Seed'); }

        return h(TargetRow, {
          key: i, tUnit: tUnit, label: label, typeAdv: typeAdv,
          hpVal: hpVal, hpMax: hpMax, dist: t.dist,
          isPending: isPending,
          onClick: () => { if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(t.x, t.y); },
        });
      }),
      targets.length === 0 && h('div', { style: {
        padding: '8px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkDim, letterSpacing: '0.1em',
      }}, 'No targets in range'),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'spellTargets') {
    const spell = (unit.spells || []).find(s => s.name === st.selectedTool) || (unit._raceAbilities || []).find(s => s.name === st.selectedTool);
    const targets = spell && typeof _getSpellValidTargets === 'function' ? _getSpellValidTargets(unit, spell) : [];
    const isOffensive = spell && !['heal', 'shield', 'buff', 'scan'].includes(spell.kind);
    const spellName = spell ? spell.name : (st.selectedTool || 'Spell');

    return h(SubMenuPanel, { title: spellName + ' Targets', fc: fc, count: targets.length + '' },
      targets.map((t, i) => {
        const isPending = st.pendingTarget && st.pendingTarget.x === t.x && st.pendingTarget.y === t.y;
        const tUnit = t.unit;
        const label = tUnit
          ? (typeof unitDisplayName === 'function' ? unitDisplayName(tUnit) : (tUnit.name || tUnit.cls))
          : (typeof coordLabel === 'function' ? coordLabel(t.x, t.y) : (t.x + ',' + t.y));
        let typeAdv = '';
        if (tUnit && isOffensive && typeof getTypeEffectSummary === 'function') {
          const adv = getTypeEffectSummary(unit.types || [], tUnit.types || []);
          typeAdv = adv.hasStrong && !adv.hasWeak ? '▲' : adv.hasWeak && !adv.hasStrong ? '▼' : '';
        }

        return h(TargetRow, {
          key: i, tUnit: tUnit, label: label, typeAdv: typeAdv,
          hpVal: tUnit ? tUnit.hp : 0, hpMax: tUnit ? tUnit.maxHp : 1,
          dist: t.dist, isPending: isPending,
          onClick: () => { if (typeof selectTargetFromMenu === 'function') selectTargetFromMenu(t.x, t.y); },
        });
      }),
      targets.length === 0 && h('div', { style: {
        padding: '8px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkDim, letterSpacing: '0.1em',
      }}, 'No targets in range'),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'pings') {
    const pingKeys = typeof PING_TYPES !== 'undefined' ? Object.keys(PING_TYPES) : [];
    return h(SubMenuPanel, { title: 'Ping', fc: fc },
      pingKeys.map(pk => {
        const pt = PING_TYPES[pk];
        return h('div', {
          key: pk,
          className: 'rhud-row',
          style: {
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            borderLeft: '2px solid ' + (pt.color || EW.inkMute),
          },
          onClick: () => { if (typeof setTool === 'function') setTool('ping', pk); },
        },
          h('span', { className: 'rhud-row-icon', style: { fontSize: 12, width: 14 }}, pt.icon),
          h('span', { className: 'rhud-row-label', style: {
            flex: 1, fontFamily: '"Cinzel", serif', fontSize: 14,
            color: EW.inkMute, letterSpacing: '0.02em',
          }}, pt.label),
        );
      }),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

  if (menuView === 'spellOrientation') {
    return h(SubMenuPanel, { title: (st.selectedTool || 'Spell') + ' · Orientation', fc: fc },
      h('div', {
        className: 'rhud-row',
        style: { padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
        onClick: () => { if (typeof setSpellOrientation === 'function') setSpellOrientation('horizontal'); },
      },
        h('span', { className: 'rhud-row-label', style: { fontFamily: '"Cinzel", serif', fontSize: 14, color: EW.inkMute }}, '↔ Horizontal'),
      ),
      h('div', {
        className: 'rhud-row',
        style: { padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
        onClick: () => { if (typeof setSpellOrientation === 'function') setSpellOrientation('vertical'); },
      },
        h('span', { className: 'rhud-row-label', style: { fontFamily: '"Cinzel", serif', fontSize: 14, color: EW.inkMute }}, '↕ Vertical'),
      ),
      h(SubMenuRow, { label: '← Back', onClick: () => { if (typeof handleBackAction === 'function') handleBackAction(); } }),
    );
  }

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

  const offensiveKinds = new Set([
    'damage', 'ricochet', 'multiHit', 'lifeDrain', 'debuff', 'splitBeam',
    'aoe', 'barrage', 'line', 'linePush', 'cross', 'aoePull', 'leapStrike', 'dash',
    'displacement', 'pull',
  ]);
  for (const sp of allSpells) {
    const cls = typeof classifySpell === 'function' ? classifySpell(sp) : (sp.type || 'damage');
    if (cls !== 'damage' && cls !== 'debuff') continue;
    if (!offensiveKinds.has(sp.kind)) continue;

    if (cls === 'damage' && !sp.dmg && !(sp.hitDamages && sp.hitDamages.length) && !sp.dotDamage) continue;

    const spellApCost = typeof getSpellApCost === 'function' ? getSpellApCost(sp) : 2;
    const mpPenalty = typeof getStatusMpCostDelta === 'function' ? getStatusMpCostDelta(actingUnit) : 0;
    const mpCost = (sp.cost || 0) + mpPenalty;
    const canAfford = unitAP >= spellApCost && actingUnit.mp >= mpCost && !(typeof unitHasStatus === 'function' && unitHasStatus(actingUnit, 'silence'));
    const tierOk = typeof unitMeetsSpellTierReq === 'function' ? unitMeetsSpellTierReq(actingUnit, sp) : true;

    const spRange = typeof getEffectiveSpellRange === 'function' ? getEffectiveSpellRange(actingUnit, sp) : (sp.range || 1);
    const spLos = typeof isRangeBlockedByTerrain === 'function' && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

    let inSpellRange = false;
    const isBarrage = sp.kind === 'barrage';
    const isAoeOriginSelf = sp.aoeOriginSelf;
    const isLine = sp.kind === 'line' || sp.kind === 'linePush' || sp.kind === 'splitBeam';
    const isCross = sp.kind === 'cross';
    const isDash = sp.kind === 'dash';
    const isLeap = sp.kind === 'leapStrike';

    if (isBarrage) {

      inSpellRange = true;
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

      inSpellRange = dist >= 1 && dist <= spRange && !spLos;
    } else {

      const minRange = ['aoe', 'cross', 'aoePull'].includes(sp.kind) ? 0 : 1;
      inSpellRange = dist >= minRange && dist <= spRange && !spLos;
    }

    const canCast = canAfford && tierOk && inSpellRange;

    let spMoveTile = null;
    if (canAfford && tierOk && !inSpellRange && !isBarrage) {
      if (isAoeOriginSelf) {

        const selfRadius = isCross ? (sp.crossRadius || 1) : (sp.aoeRadius || 1);
        spMoveTile = findMoveIntoRange(selfRadius, spellApCost);
      } else if (isLine || isDash) {

        spMoveTile = null;
      } else {
        spMoveTile = findMoveIntoRange(spRange, spellApCost);
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

  actions.sort((a, b) => {
    const dmgA = _actionSortDamage(a);
    const dmgB = _actionSortDamage(b);
    if (dmgB !== dmgA) return dmgB - dmgA;

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

function EnemyActionMenu({ st }) {
  if (!st || st.phase !== 'battle') return null;
  const targetId = st._enemyActionTargetId;
  if (!targetId) return null;

  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const activeId = st._blitzActiveUnitId || st.selectedUnitId;
  const actingUnit = (st.units || []).find(u => u.id === activeId && !u.dead);
  const targetUnit = (st.units || []).find(u => u.id === targetId && !u.dead);
  if (!actingUnit || !targetUnit) return null;
  if (actingUnit.player !== viewer) return null;

  const humanTurn = !st.autoPlayers?.[st.activePlayer];
  const canControl = humanTurn && actingUnit.player === st.activePlayer
    && (typeof canUnitAct === 'function' ? canUnitAct(actingUnit) : true)
    && !st.winner;
  if (!canControl) return null;

  if (st.actionMode) return null;

  if (st.actionMenuView && st.actionMenuView !== 'root') return null;

  if ((st.units || []).some(u => u._dying)) return null;

  const fc = getFactionColor(actingUnit);
  const tc = getTypeColor(targetUnit);
  const actions = _computeEnemyActions(actingUnit, targetUnit);
  const dist = Math.abs(actingUnit.x - targetUnit.x) + Math.abs(actingUnit.y - targetUnit.y);
  const targetName = typeof unitDisplayName === 'function' ? unitDisplayName(targetUnit) : (targetUnit.name || targetUnit.cls);
  const hpPct = targetUnit.maxHp > 0 ? Math.max(0, (targetUnit.hp / targetUnit.maxHp) * 100) : 0;

  const dismiss = () => {
    state._enemyActionTargetId = null;
    _clearMoveArrowPreview();
    if (typeof markDirty === 'function') { markDirty('hud'); }
    if (typeof renderIfDirty === 'function') { renderIfDirty(); }
  };

  const _showMoveArrowPreview = (mt, action) => {
    _clearMoveArrowPreview();
    if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
    const tx = targetUnit.x, ty = targetUnit.y;

    const actingY = ThreeRenderer.unitSurfaceY(actingUnit);

    const targetY = ThreeRenderer.unitSurfaceY(targetUnit);

    if (mt) {

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

      if (mt.via) {

        const viaY = ThreeRenderer.tileTopY(mt.via.x, mt.via.y);
        ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, mt.via.x, mt.via.y, 0xffcc44, true, actingY, viaY);
        ThreeRenderer.drawArrow3D(mt.via.x, mt.via.y, mt.x, mt.y, 0xffcc44, true, viaY, destY);

        ThreeRenderer.setOverlay('movePreview', [
          { x: mt.via.x, y: mt.via.y, color: 0xffcc44, opacity: 0.3 },
          { x: mt.x, y: mt.y, color: 0xffcc44, opacity: 0.45 },
        ], 0xffcc44, 0.45);
      } else {
        ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, mt.x, mt.y, 0xffcc44, true, actingY, destY);

        ThreeRenderer.setOverlay('movePreview', [{ x: mt.x, y: mt.y, color: 0xffcc44, opacity: 0.45 }], 0xffcc44, 0.45);
      }

      ThreeRenderer.showGhostUnit(actingUnit, mt.x, mt.y, destY);

      const arrowColor = _actionPlanArrowColor(action);
      ThreeRenderer.drawArrow3D(mt.x, mt.y, tx, ty, arrowColor, false, destY, targetY);
    } else {

      const arrowColor = _actionPlanArrowColor(action);
      ThreeRenderer.drawArrow3D(actingUnit.x, actingUnit.y, tx, ty, arrowColor, false, actingY, targetY);
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
  };

  const _actionPlanArrowColor = (action) => {
    if (!action) return 0xff4444;
    if (action.id === 'attack' || action.id === 'combo') return 0xff4444;

    const spType = (action.spellType || '').toLowerCase();
    const cssColor = TYPE_COLORS[spType] || '';
    if (cssColor) {

      return parseInt(cssColor.replace('#', ''), 16) || 0xff4444;
    }
    return 0xff4444;
  };

  const _clearMoveArrowPreview = () => {
    if (typeof ThreeRenderer === 'undefined' || !ThreeRenderer.isActive()) return;
    ThreeRenderer.clearArrows3D();
    ThreeRenderer.clearGhostUnit();
    ThreeRenderer.clearOverlay('movePreview');
    ThreeRenderer.clearOverlay('actionPlanTarget');
    ThreeRenderer.clearOverlay('actionPlanAoe');
  };

  return h('div', {
    style: {
      position: 'absolute', bottom: 16, left: 252, width: 344, zIndex: 14,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
    },
  },

    h('div', { style: {
      padding: '8px 12px', borderBottom: '1px solid ' + EW.panelEdge,
      display: 'flex', alignItems: 'center', gap: 8,
    }},
      h(UnitSprite, { unit: targetUnit, size: 28 }),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }},
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
          h('span', { style: {
            fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 600,
            color: EW.ink, letterSpacing: '0.02em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}, targetName),
          h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 7,
            letterSpacing: '0.1em', color: tc, padding: '0px 3px',
            background: tc + '1f', border: '1px solid ' + tc + '44',
            flexShrink: 0,
          }}, (getTypeName(targetUnit) || '').toUpperCase()),
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
          h('div', { style: { flex: 1, height: 3, background: 'rgba(255,255,255,0.06)' }},
            h('div', { style: {
              height: '100%', width: hpPct + '%',
              background: hpPct <= 30 ? EW.bad : EW.good,
            }}),
          ),
          h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 7,
            color: EW.inkDim, letterSpacing: '0.04em', flexShrink: 0,
          }}, targetUnit.hp + '/' + targetUnit.maxHp),
        ),
      ),
      h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkDim, letterSpacing: '0.06em', flexShrink: 0,
      }}, dist + 't'),
    ),

    h('div', { style: { padding: '4px 0', maxHeight: 280, overflowY: 'auto' }},
      actions.map((a, i) => {
        const isAvail = a.available;
        const isMove = !!a.moveTile;
        const moveCostLabel = isMove ? a.moveTile.moveCost + ' mv + ' : '';
        const costLabel = a.mpCost
          ? moveCostLabel + a.mpCost + 'mp · ' + a.apCost + 'ap'
          : moveCostLabel + a.apCost + 'ap';

        let dmgText = '';
        if (a.preview) {
          if (a.preview.min != null && a.preview.max != null) {
            dmgText = a.preview.min + '–' + a.preview.max;
          } else if (a.preview.amount) {
            dmgText = '~' + a.preview.amount;
          }
        } else if (a.powerLabel) {
          dmgText = a.powerLabel;
        }

        let typeAdv = '';
        if (a.typeNote) {
          if (a.typeNote.includes('Strong') || a.typeNote.includes('strong') || a.typeNote.includes('super effective')) typeAdv = '▲';
          else if (a.typeNote.includes('Weak') || a.typeNote.includes('weak') || a.typeNote.includes('not very')) typeAdv = '▼';
        }

        const spType = a.spellType || '';
        const spTypeColor = spType ? (TYPE_COLORS[(spType || '').toLowerCase()] || EW.inkMute) : EW.inkMute;

        const handleClick = () => {
          if (!isAvail) return;
          hideSpellTooltip();
          _clearMoveArrowPreview();

          const _executeAction = (actionId, spell, tx, ty, tz) => {

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
            } else if (actionId.startsWith('spell:') && spell) {

              state.selectedTool = spell.name;
              state.actionMode = 'spell';
              if (typeof doSpell === 'function') doSpell(actingUnit, tx, ty, tz);
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

            if (mt.via) {

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
        };

        const sp = a.spell || null;
        const cat = sp && typeof classifySpell === 'function' ? classifySpell(sp) : null;

        // Element / kind badge (top-left) — spell type for spells, action kind otherwise.
        let badgeText, badgeColor;
        if (spType) { badgeText = spType.toUpperCase(); badgeColor = spTypeColor; }
        else if (a.id === 'attack') { badgeText = 'ATTACK'; badgeColor = fc; }
        else if (a.id === 'combo') { badgeText = 'COMBO'; badgeColor = EW.time; }
        else if (a.id && a.id.indexOf('item:') === 0) { badgeText = 'BANE'; badgeColor = '#e0944a'; }
        else { badgeText = 'ACTION'; badgeColor = EW.inkMute; }

        let cardDesc;
        if (sp) cardDesc = sp.desc || spellTagline(sp);
        else if (a.id === 'attack') cardDesc = 'Basic weapon strike on the target.';
        else if (a.id === 'combo') cardDesc = 'Linked assault — team up with a nearby ally.';
        else if (a.id && a.id.indexOf('item:') === 0) cardDesc = 'Hurl a bane weapon' + (a.typeNote ? ' — ' + a.typeNote : '.');
        else cardDesc = '';

        const tMode = sp ? spellTargetMode(sp) : 'Single Target';
        const dlv = sp ? spellDeliveryBadge(sp, cat)
                  : (a.id === 'combo' ? { label: 'COMBO', color: EW.time }
                  : { label: 'PHYSICAL', color: '#e0944a' });

        // Power chip — prefer the live damage estimate vs THIS target.
        let powerChip = null;
        if (a.preview && a.preview.min != null && a.preview.max != null) powerChip = { value: a.preview.min + '–' + a.preview.max, unit: 'PWR', color: '#ee6655' };
        else if (a.preview && a.preview.amount) powerChip = { value: '~' + a.preview.amount, unit: 'PWR', color: '#ee6655' };
        else if (sp) powerChip = spellPowerStat(sp);

        const statChip = (v, u, col) => h('span', {
          style: { display: 'inline-flex', alignItems: 'baseline', gap: 2, flexShrink: 0, fontFamily: '"DotGothic16", monospace' },
        },
          h('span', { style: { fontSize: 13, fontWeight: 700, color: col, letterSpacing: '0.01em' }}, v),
          h('span', { style: { fontSize: 8, fontWeight: 700, color: col, opacity: 0.78, letterSpacing: '0.05em' }}, u),
        );

        const cardAccent = isAvail
          ? (a.id === 'combo' ? EW.time : (spTypeColor !== EW.inkMute ? spTypeColor : fc))
          : EW.inkDim;

        return h('div', {
          key: a.id,
          className: 'rhud-move-slot' + (isAvail ? '' : ' is-disabled'),
          style: { position: 'relative', margin: '5px 8px' },
        },

          h('div', { className: 'rhud-move-glow', 'aria-hidden': 'true' }),

          h('div', {
          className: 'rhud-move-card' + (isAvail ? '' : ' rhud-disabled'),
          style: {
            position: 'relative', zIndex: 1, overflow: 'hidden',
            cursor: isAvail ? 'pointer' : 'default',
            opacity: isAvail ? 1 : 0.45,
            background: 'linear-gradient(135deg, rgba(13,15,24,0.96) 0%, rgba(9,11,18,0.93) 100%)',
            border: '1px solid rgba(120,140,180,0.16)',
            borderLeft: '3px solid ' + cardAccent,
            clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
          },
          onClick: isAvail ? handleClick : undefined,
          onMouseEnter: (e) => { if (a.spell) showSpellTooltip(a.spell, e.nativeEvent || e); if (isAvail && typeof _showMoveArrowPreview === 'function') _showMoveArrowPreview(a.moveTile, a); },
          onMouseMove: (e) => { if (a.spell) moveSpellTooltip(e.nativeEvent || e); },
          onMouseLeave: () => { hideSpellTooltip(); if (isAvail && typeof _clearMoveArrowPreview === 'function') _clearMoveArrowPreview(); },
        },

          // ── Header: icon + NAME + type-advantage + power / MP / AP ──
          h('div', { style: {
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 11px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 100%)',
            borderBottom: '1px solid rgba(120,140,180,0.12)',
          }},
            h('span', { style: { fontSize: 12, fontWeight: 700, flexShrink: 0,
              color: isAvail ? (a.id === 'combo' ? EW.time : fc) : EW.inkDim }}, a.icon),
            h('span', { style: {
              flex: 1, fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700,
              color: isAvail ? EW.ink : EW.inkMute, letterSpacing: '0.03em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}, a.label),
            typeAdv && h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 12, fontWeight: 700,
              color: typeAdv === '▲' ? EW.good : EW.bad, flexShrink: 0,
            }}, typeAdv),
            powerChip && statChip(powerChip.value, powerChip.unit, powerChip.color),
            a.mpCost ? statChip(a.mpCost, 'MP', EW.space) : null,
            statChip(a.apCost, 'AP', EW.time),
          ),

          // ── Body: kind badge + description ──
          h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 11px 4px' }},
            h('span', { style: spType
              ? typeBadgeStyleFor(spType)
              : typeBadgeStyle(badgeColor) }, badgeText),
            cardDesc && h('span', { style: {
              flex: 1, fontFamily: '"DotGothic16", monospace', fontSize: 9, lineHeight: '1.45',
              color: isAvail ? EW.inkMute : EW.inkDim, letterSpacing: '0.01em',
            }}, cardDesc),
          ),

          // ── Footer: target mode · move-first + delivery / reason ──
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '2px 11px 8px' }},
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: EW.inkMute,
            }}, tMode),
            isMove && h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
              color: EW.warn, flexShrink: 0,
            }}, '· ↳ MOVE ' + a.moveTile.moveCost + 'mv'),
            h('span', { style: { flex: 1 }}),
            (!isAvail && a.reason)
              ? h('span', { style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                  color: EW.bad, flexShrink: 0,
                }}, a.reason)
              : h('span', { style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                  color: '#fff', background: dlv.color, border: '1px solid ' + dlv.color,
                  borderRadius: '9px', padding: '1px 9px', flexShrink: 0,
                  boxShadow: '0 0 7px ' + dlv.color + '70',
                }}, dlv.label),
          ),
          )
        );
      }),
      actions.length === 0 && h('div', { style: {
        padding: '8px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkDim, letterSpacing: '0.1em',
      }}, 'No actions available'),
    ),

    h('div', { style: {
      padding: '4px 12px 8px', borderTop: '1px solid ' + EW.panelEdge,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }},
      h('span', {
        className: 'rhud-back',
        style: {
          cursor: 'pointer',
          fontFamily: '"DotGothic16", monospace', fontSize: 9,
          letterSpacing: '0.14em', color: EW.inkMute,
        },
        onClick: dismiss,
      }, '← DISMISS'),
      h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkDim, letterSpacing: '0.14em',
      }}, 'CLICK TO CONFIRM'),
    ),
  );
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
    const inRange = dist <= spRange;
    const losBlocked = typeof isRangeBlockedByTerrain === 'function' && dist > 0 && isRangeBlockedByTerrain(actingUnit.x, actingUnit.y, tx, ty);

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

function TileActionMenu({ st }) {
  if (!st || st.phase !== 'battle') return null;
  const target = st._tileActionTarget;
  if (!target) return null;

  const tx = target.x, ty = target.y;
  const viewer = typeof getViewerPlayer === 'function' ? getViewerPlayer() : 1;
  const activeId = st._blitzActiveUnitId || st.selectedUnitId;
  const actingUnit = (st.units || []).find(u => u.id === activeId && !u.dead);
  if (!actingUnit || actingUnit.player !== viewer) return null;

  const humanTurn = !st.autoPlayers?.[st.activePlayer];
  const canControl = humanTurn && actingUnit.player === st.activePlayer
    && (typeof canUnitAct === 'function' ? canUnitAct(actingUnit) : true)
    && !st.winner;
  if (!canControl) return null;

  if (st.actionMode) return null;

  if (st.actionMenuView && st.actionMenuView !== 'root') return null;

  if ((st.units || []).some(u => u._dying)) return null;

  const fc = getFactionColor(actingUnit);
  const actions = _computeTileActions(actingUnit, tx, ty);
  const dist = Math.abs(actingUnit.x - tx) + Math.abs(actingUnit.y - ty);

  const terrain = typeof getTerrainAt === 'function' ? getTerrainAt(tx, ty) : 'grass';
  const tRule = typeof getTerrainRule === 'function' ? getTerrainRule(terrain) : { label: terrain };
  const height = typeof getHeightAt === 'function' ? getHeightAt(tx, ty) : 0;
  const posLabel = typeof coordLabel === 'function' ? coordLabel(tx, ty) : tx + ',' + ty;

  const tileObjects = [];
  const seeds = (st.plantedSeeds || []).filter(s => s.x === tx && s.y === ty);
  seeds.forEach(s => { const t = s.type || 'seed'; tileObjects.push((t === 'heal' ? '🌱' : t === 'poison' ? '☠️' : '🪱') + ' ' + t + ' seed'); });
  const bombs = (st.bombs || []).filter(b => b.x === tx && b.y === ty);
  if (bombs.length) tileObjects.push('💣 Bomb ×' + bombs.length);
  const wards = (st.wards || []).filter(w => w.x === tx && w.y === ty);
  if (wards.length) tileObjects.push('👁 Ward (P' + wards[0].owner + ')');
  const turret = (st.turrets || []).find(t => t && t.x === tx && t.y === ty && t.hp > 0);
  if (turret) tileObjects.push('🗼 Turret ' + turret.hp + '/' + turret.maxHp);
  const deploy = (st._deployedObjects || []).find(o => o.x === tx && o.y === ty && o.hp > 0);
  // An enemy decoy must read like an ordinary unit — naming it here would give it
  // away the moment the player inspects the tile. The player's own decoys still show.
  if (deploy && !(deploy.isDecoy && deploy.ownerPlayer !== viewer)) {
    tileObjects.push('📦 ' + (deploy.spellName || 'Object'));
  }
  const corpses = (st.units || []).filter(u => u.dead && u.x === tx && u.y === ty);
  corpses.forEach(c => tileObjects.push('💀 ' + (c.name || c.cls)));
  const visHG = (st.hourglasses || []).filter(hg => hg.carriedBy === null && hg.x === tx && hg.y === ty && hg.visibleTo[viewer]);
  if (visHG.length) tileObjects.push('⏳ Hourglass');

  const dismiss = () => {
    state._tileActionTarget = null;
    if (typeof markDirty === 'function') { markDirty('hud'); }
    if (typeof renderIfDirty === 'function') { renderIfDirty(); }
  };

  const movementActions = actions.filter(a => a.category === 'movement');
  const spellActions = actions.filter(a => a.category === 'spells');
  const attackActions = actions.filter(a => a.category === 'attack');
  const otherActions = actions.filter(a => a.category === 'actions' || a.category === 'utility');

  const renderRow = (a) => {
    const isAvail = a.available;
    const spType = a.spellType || '';
    const spTypeColor = spType ? (TYPE_COLORS[(spType).toLowerCase()] || EW.inkMute) : '';
    const costParts = [];
    if (a.apCost) costParts.push(a.apCost + 'ap');
    if (a.mpCost) costParts.push(a.mpCost + 'mp');
    const costLabel = costParts.join(' · ') || '';

    return h('div', {
      key: a.id,
      className: 'rhud-row' + (isAvail ? '' : ' rhud-disabled'),
      style: {
        padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8,
        cursor: isAvail ? 'pointer' : 'default',
        opacity: isAvail ? 1 : 0.38,
        borderLeft: '2px solid transparent',
      },
      onClick: isAvail && a.handler ? () => { hideSpellTooltip(); if (typeof playSfx === 'function') playSfx('uiButtonConfirm'); a.handler(); } : undefined,
      onMouseEnter: (e) => { if (a.spell) showSpellTooltip(a.spell, e.nativeEvent || e); },
      onMouseMove: (e) => { if (a.spell) moveSpellTooltip(e.nativeEvent || e); },
      onMouseLeave: () => { hideSpellTooltip(); },
    },
      h('span', { style: {
        width: 14, textAlign: 'center', fontSize: 12, fontWeight: 600,
        color: isAvail ? (a.category === 'attack' ? '#ee6655' : fc) : EW.inkDim,
      }}, a.icon),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }},
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
          h('span', { style: {
            fontFamily: '"Cinzel", serif', fontSize: 13,
            color: isAvail ? EW.ink : EW.inkDim, letterSpacing: '0.02em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}, a.label),
          spType && h('span', { style: typeBadgeStyleFor(spType, { fontSize: 7, padding: '1px 4px' }) },
            spType.toUpperCase()),
        ),

        ((!isAvail && a.reason) || a.spell) && h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
          !isAvail && a.reason && h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 10, fontWeight: 600,
            color: EW.bad, letterSpacing: '0.06em',
          }}, a.reason),
          isAvail && a.spell && h('span', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 8,
            color: EW.inkDim, letterSpacing: '0.02em', lineHeight: '1.3',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          }}, spellTagline(a.spell)),
        ),

        a.powerLabel && h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: '#ee6655', letterSpacing: '0.04em', flexShrink: 0,
        }}, a.powerLabel),
      ),
      costLabel && h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkMute, letterSpacing: '0.06em', flexShrink: 0, minWidth: 36, textAlign: 'right',
      }}, costLabel),
    );
  };

  const divider = (label) => h('div', {
    style: {
      padding: '4px 12px 2px', fontFamily: '"DotGothic16", monospace',
      fontSize: 8, letterSpacing: '0.14em', color: EW.inkDim,
      borderTop: '1px solid ' + EW.panelEdge, marginTop: 2,
    },
  }, label);

  return h('div', {
    style: {
      position: 'absolute', bottom: 16, left: 252, width: 300, zIndex: 14,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
    },
  },

    h('div', { style: {
      padding: '8px 12px', borderBottom: '1px solid ' + EW.panelEdge,
      display: 'flex', flexDirection: 'column', gap: 2,
    }},
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }},
        h('span', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 600,
          color: EW.ink, letterSpacing: '0.02em',
        }}, tRule.label || terrain),
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: EW.inkDim, letterSpacing: '0.06em',
        }}, posLabel + (height > 0 ? ' · h' + height : '') + ' · ' + dist + 't'),
      ),
      tRule.moveCost > 1 && h('div', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.warn, letterSpacing: '0.04em',
      }}, 'Move cost ×' + tRule.moveCost),
      tRule.blocksRanged && h('div', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.bad, letterSpacing: '0.04em',
      }}, 'Blocks ranged'),
      tileObjects.length > 0 && h('div', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkMute, letterSpacing: '0.02em', lineHeight: '1.4',
      }}, tileObjects.join(' · ')),
    ),

    h('div', { style: { padding: '2px 0', maxHeight: 320, overflowY: 'auto' }},
      movementActions.length > 0 && movementActions.map(renderRow),
      spellActions.length > 0 && divider('SPELLS'),
      spellActions.length > 0 && spellActions.map(renderRow),
      attackActions.length > 0 && divider('ATTACK'),
      attackActions.length > 0 && attackActions.map(renderRow),
      otherActions.length > 0 && divider('OTHER'),
      otherActions.length > 0 && otherActions.map(renderRow),
      actions.length === 0 && h('div', { style: {
        padding: '8px 12px', fontFamily: '"DotGothic16", monospace', fontSize: 9,
        color: EW.inkDim, letterSpacing: '0.1em',
      }}, 'No actions available for this tile'),
    ),

    h('div', { style: {
      padding: '4px 12px 8px', borderTop: '1px solid ' + EW.panelEdge,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }},
      h('span', {
        className: 'rhud-back',
        style: {
          cursor: 'pointer',
          fontFamily: '"DotGothic16", monospace', fontSize: 9,
          letterSpacing: '0.14em', color: EW.inkMute,
        },
        onClick: dismiss,
      }, '← DISMISS'),
      h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkDim, letterSpacing: '0.14em',
      }}, 'CLICK TO ACT'),
    ),
  );
}

let _spellTooltip = { visible: false, spell: null, x: 0, y: 0 };
let _tooltipEl = null;

function _ensureTooltipEl() {
  if (_tooltipEl) return _tooltipEl;
  _tooltipEl = document.createElement('div');
  _tooltipEl.id = 'ew-spell-tooltip';
  _tooltipEl.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.15s ease;';
  document.body.appendChild(_tooltipEl);
  return _tooltipEl;
}

function showSpellTooltip(sp, evt) {
  if (!sp) return;
  const el = _ensureTooltipEl();
  const desc = sp.desc || '';
  if (!desc) { hideSpellTooltip(); return; }

  const k = sp.kind || '';
  const tc = TYPE_COLORS[sp.spellType] || EW.inkMute;
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

  let statusLine = '';
  if (sp.statusEffects && sp.statusEffects.length > 0) {
    statusLine = sp.statusEffects.map(s => {
      const id = s.id || '';
      const label = (typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[id]?.label) ? STATUS_DEFS[id].label : id.replace(/_/g, ' ');
      return label + (s.duration ? ' (' + s.duration + 't)' : '');
    }).join(', ');
  }

  el.innerHTML = '<div style="' +
    'background:rgba(6,7,12,0.95);border:1px solid ' + tc + '55;' +
    'padding:10px 14px;max-width:260px;min-width:180px;' +
    'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
    'box-shadow:0 4px 20px rgba(0,0,0,0.6);' +
    '">' +
    '<div style="font-family:Cinzel,serif;font-size:13px;font-weight:600;color:' + EW.ink + ';letter-spacing:0.04em;margin-bottom:4px;">' +
      sp.name +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
      '<span style="font-family:DotGothic16,monospace;font-size:7px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:' + tcText + ';background:linear-gradient(' + tc + '22,' + tc + '22),rgba(9,11,17,0.82);border:1px solid ' + tc + 'aa;padding:1px 5px;text-shadow:0 1px 2px rgba(0,0,0,0.85);clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);">' +
        (sp.spellType || '').toUpperCase() +
      '</span>' +
      (sp.tier ? '<span style="font-family:DotGothic16,monospace;font-size:7px;color:' + EW.inkDim + ';">T' + sp.tier + '</span>' : '') +
      (sp.damageType === 'physical' ? '<span style="font-family:DotGothic16,monospace;font-size:7px;color:#c89050;">PHY</span>' : '') +
    '</div>' +
    '<div style="font-family:DotGothic16,monospace;font-size:10px;line-height:1.5;color:' + EW.inkMute + ';margin-bottom:8px;">' +
      desc +
    '</div>' +
    '<div style="font-family:DotGothic16,monospace;font-size:8px;color:' + EW.inkDim + ';letter-spacing:0.06em;line-height:1.6;">' +
      details.join(' · ') +
    '</div>' +
    (statusLine ? '<div style="font-family:DotGothic16,monospace;font-size:8px;color:#c89ee0;letter-spacing:0.04em;margin-top:3px;">⤷ ' + statusLine + '</div>' : '') +
  '</div>';

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  el.style.opacity = '1';

  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    let left = evt.clientX + 12;
    let top = evt.clientY - r.height - 8;
    if (left + r.width > vw - 8) left = evt.clientX - r.width - 12;
    if (top < 8) top = evt.clientY + 16;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  });
}

function moveSpellTooltip(evt) {
  if (!_tooltipEl || _tooltipEl.style.opacity === '0') return;
  const vw = window.innerWidth;
  const r = _tooltipEl.getBoundingClientRect();
  let left = evt.clientX + 12;
  let top = evt.clientY - r.height - 8;
  if (left + r.width > vw - 8) left = evt.clientX - r.width - 12;
  if (top < 8) top = evt.clientY + 16;
  _tooltipEl.style.left = left + 'px';
  _tooltipEl.style.top = top + 'px';
}

function hideSpellTooltip() {
  if (_tooltipEl) _tooltipEl.style.opacity = '0';
}

function SubMenuPanel({ title, fc, count, wide, children }) {
  return h('div', {
    style: {
      position: 'absolute', bottom: 16, left: 252, width: wide ? 360 : 280, zIndex: 12,
      background: EW.panel, border: '1px solid ' + EW.panelEdge,
      clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
    },
  },

    h('div', { style: {
      padding: '8px 12px', borderBottom: '1px solid ' + EW.panelEdge,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }},
      h('span', { style: {
        fontFamily: '"Cinzel", serif', fontSize: 13,
        letterSpacing: '0.2em', textTransform: 'uppercase', color: EW.ink,
      }}, title),
      count && h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkMute, letterSpacing: '0.14em',
      }}, count),
    ),

    h('div', { style: {
      padding: '4px 0', maxHeight: wide ? 440 : 340,
      // overflowY:'auto' alone makes the browser compute overflow-x to 'auto'
      // too. The hover "pop" (transform: scale(1.02) on .rhud-target/.rhud-row)
      // makes a row a few px wider than the panel, which would then spawn a
      // horizontal scrollbar → the scrollbar steals layout space → the row
      // reflows out from under the cursor → :hover drops → scale reverts →
      // scrollbar vanishes → re-hover … an infinite flicker loop that made
      // targets nearly impossible to click. Pin overflow-x hidden and reserve
      // the vertical scrollbar gutter so a hover-scale can never toggle either
      // scrollbar and reflow the list.
      overflowY: 'auto', overflowX: 'hidden', scrollbarGutter: 'stable',
    }}, children),

    h('div', { style: {
      padding: '4px 12px 8px', borderTop: '1px solid ' + EW.panelEdge,
      display: 'flex', justifyContent: 'space-between',
    }},
      h('span', { style: {
        fontFamily: '"DotGothic16", monospace', fontSize: 8,
        color: EW.inkDim, letterSpacing: '0.14em',
      }}, '↑↓ NAVIGATE · ↵ SELECT'),
    ),
  );
}

function SubMenuRow({ label, onClick }) {
  return h('div', {
    className: 'rhud-back',
    style: {
      padding: '6px 12px', cursor: 'pointer',
      fontFamily: '"DotGothic16", monospace', fontSize: 9,
      letterSpacing: '0.14em', color: EW.inkMute,
    },
    onClick: onClick,
  }, label);
}

function TargetRow({ tUnit, label, typeAdv, hpVal, hpMax, dist, isPending, onClick }) {
  const tc = tUnit ? getTypeColor(tUnit) : EW.inkMute;
  const fc = tUnit ? getFactionColor(tUnit) : EW.inkMute;
  const hpPct = hpMax > 0 ? Math.max(0, (hpVal / hpMax) * 100) : 0;
  const typeName = tUnit ? getTypeName(tUnit) : '';
  const confirmMark = isPending ? ' ✓' : '';

  return h('div', {
    className: 'rhud-target',
    style: {
      padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer',
      background: isPending ? 'linear-gradient(90deg, ' + EW.time + '1a, transparent)' : 'transparent',
      borderLeft: isPending ? '2px solid ' + EW.time : '2px solid transparent',
    },
    onClick: onClick,
  },

    tUnit
      ? h(UnitSprite, { unit: tUnit, size: 26 })
      : h('div', { style: {
          width: 26, height: 36, flexShrink: 0,
          background: 'rgba(255,255,255,0.04)', border: '1px solid ' + EW.panelEdge,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"DotGothic16", monospace', fontSize: 10, color: EW.inkDim,
        }}, '?'),

    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }},

      h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
        typeAdv && h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 10, fontWeight: 700,
          color: typeAdv === '▲' ? EW.good : EW.bad,
        }}, typeAdv),
        h('span', { className: 'rhud-target-name', style: {
          fontFamily: '"Cinzel", serif', fontSize: 13,
          color: isPending ? EW.ink : EW.inkMute, letterSpacing: '0.02em',
          lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}, label + confirmMark),
        typeName && h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 7,
          letterSpacing: '0.1em', color: tc, padding: '0px 3px',
          background: tc + '1f', border: '1px solid ' + tc + '44',
          flexShrink: 0,
        }}, typeName.toUpperCase()),
      ),

      hpMax > 0 && h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 }},
        h('div', { style: { flex: 1, height: 3, background: 'rgba(255,255,255,0.06)' }},
          h('div', { style: {
            height: '100%', width: hpPct + '%',
            background: hpPct <= 30 ? EW.bad : EW.good,
          }}),
        ),
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 7,
          color: EW.inkDim, letterSpacing: '0.04em', flexShrink: 0,
        }}, hpVal + '/' + hpMax),
      ),
    ),

    h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 8,
      color: EW.inkDim, letterSpacing: '0.06em', flexShrink: 0,
    }}, dist + 't'),
  );
}

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
    h('div', { style: { pointerEvents: 'auto' }},
      h(ActionMenu, { st }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(SubMenu, { st }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(EnemyActionMenu, { st }),
    ),
    h('div', { style: { pointerEvents: 'auto' }},
      h(TileActionMenu, { st }),
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
}

// ── Click juice: press pop + ripple burst + SFX for every pressable HUD element ──
let _hudJuiceLayer = null;
let _hudJuiceContainer = null;
let _hudJuicePressHandler = null;

const _HUD_PRESSABLE_SELECTOR = '.rhud-row, .rhud-move-card, .rhud-end-turn, .rhud-back, .rhud-target';

function _hudJuiceFindPressable(target, container) {
  if (!(target instanceof Element)) return null;
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
