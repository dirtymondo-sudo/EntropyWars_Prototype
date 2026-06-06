(function() {
'use strict';

const h = React.createElement;
const { useState, useEffect, useRef, useMemo, useCallback } = React;

if (!document.getElementById('ms-hover-css')) {
  const _css = document.createElement('style');
  _css.id = 'ms-hover-css';
  _css.textContent = `
    /* ── Match Select hover feedback ── */
    .ms-btn {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s, filter 0.12s !important;
    }
    .ms-btn:hover {
      filter: brightness(1.25);
      box-shadow: 0 0 10px rgba(180,200,240,0.12);
    }
    .ms-btn:active {
      transform: scale(0.97);
      filter: brightness(0.9);
    }

    /* Ghost outline buttons (BACK, RANDOMIZE) */
    .ms-btn-ghost {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .ms-btn-ghost:hover {
      background: rgba(180,200,240,0.08) !important;
      border-color: rgba(180,200,240,0.35) !important;
      color: #e6e9f2 !important;
    }
    .ms-btn-ghost:active {
      transform: scale(0.96);
      background: rgba(180,200,240,0.14) !important;
    }

    /* Primary CTA (CONFIRM) */
    .ms-btn-primary {
      transition: box-shadow 0.15s, transform 0.1s, filter 0.12s !important;
    }
    .ms-btn-primary:hover {
      filter: brightness(1.15) saturate(1.1);
      box-shadow: 0 0 40px rgba(242,196,104,0.35), 0 2px 12px rgba(242,196,104,0.25) !important;
      transform: translateY(-1px);
    }
    .ms-btn-primary:active {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }

    /* Mode cards */
    .ms-mode-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.12s !important;
    }
    .ms-mode-card:hover {
      background: linear-gradient(180deg, rgba(242,196,104,0.1), rgba(0,0,0,0.4)) !important;
      border-color: rgba(242,196,104,0.4) !important;
      box-shadow: 0 0 14px rgba(242,196,104,0.08);
      transform: translateX(2px);
    }
    .ms-mode-card:active {
      transform: translateX(2px) scale(0.99);
    }
    .ms-mode-card.selected:hover {
      box-shadow: 0 0 20px rgba(242,196,104,0.15);
      transform: none;
    }

    /* Map cards */
    .ms-map-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.12s !important;
    }
    .ms-map-card:hover {
      border-color: rgba(180,200,240,0.4) !important;
      box-shadow: 0 0 14px rgba(180,200,240,0.08);
      transform: translateY(-1px);
    }
    .ms-map-card:active {
      transform: scale(0.98);
    }

    /* Segmented control options */
    .ms-seg-opt {
      transition: background 0.12s, color 0.12s, border-color 0.12s !important;
    }
    .ms-seg-opt:hover {
      background: linear-gradient(180deg, rgba(242,196,104,0.12), transparent) !important;
      color: #e6e9f2 !important;
    }

    /* Chip buttons (size filters, team size picks) */
    .ms-chip {
      transition: background 0.12s, border-color 0.12s, color 0.12s,
                  box-shadow 0.12s, transform 0.1s !important;
    }
    .ms-chip:hover {
      border-color: rgba(242,196,104,0.5) !important;
      color: #f2c468 !important;
      background: rgba(242,196,104,0.1) !important;
      box-shadow: 0 0 8px rgba(242,196,104,0.1);
    }
    .ms-chip:active {
      transform: scale(0.95);
    }

    /* Stepper +/- buttons */
    .ms-stepper-btn {
      transition: background 0.1s, border-color 0.12s, color 0.1s, transform 0.08s !important;
    }
    .ms-stepper-btn:hover {
      background: rgba(180,200,240,0.1) !important;
      border-color: rgba(180,200,240,0.35) !important;
      color: #e6e9f2 !important;
    }
    .ms-stepper-btn:active {
      transform: scale(0.9);
      background: rgba(180,200,240,0.18) !important;
    }
  `;
  document.head.appendChild(_css);
}

const EW = {
  bg: '#06070c', bg2: '#0b0d16', bg3: '#11141f',
  panel: 'rgba(20,24,38,0.72)',
  panelEdge: 'rgba(120,140,180,0.16)',
  panelEdgeHi: 'rgba(180,200,240,0.32)',
  ink: '#e6e9f2', inkMute: '#8a93a8', inkDim: '#555c70',
  grid: 'rgba(120,140,180,0.06)',
  space: '#5fd6ff', time: '#f2c468', chaos: '#e168c8',
  good: '#6ee2a8', bad: '#ff7a8a', warn: '#f2c468',
  unholy: '#b88cff',
};

const LORE = {
  Skirmish:     '"First blood, fastest drawn." — tight quarters, no cover.',
  Apartment:    '"The walls remember everything." — cold open tutorial.',
  Outpost:      '"Built to watch. Repurposed to fight." — elevated corners.',
  Suburb:       '"Picket fences make bad cover." — suburban apocalypse.',
  Bunker:       '"Three feet of concrete between you and regret." — hard cover.',
  Ravine:       '"The river forgot which direction it was going." — deep canyon with bridges.',
  'Bleed Arena':'"They painted it red before it earned the name." — open kill floor.',
  Compound:     '"Where the first oath was sworn and the first broken." — city ruins.',
  Battlefield:  '"Salt and oxide. Nothing else now." — dramatic elevation.',
  Bastion:      '"The moat is decorative now." — castle siege.',
  'Rift Plaza': '"The ground split. People kept shopping." — urban void.',
  Cavern:       '"Stalactites are the only audience." — underground echo.',
  Workshop:     '"Gears still turn if you listen." — industrial forge.',
  'Kill Box':   '"No one remembers who named it." — symmetrical death.',
  Dreamscape:   '"It only looks safe." — shifting reality.',
  Crossroads:   '"Every direction leads to trouble." — four-way engagement.',
  Highlands:    '"Rolling hills hide rolling ambushes." — elevation play.',
  'Lattice Temple':'"Prayer beads or tripwires — hard to tell." — temple grid.',
  Palimpsest:   '"Every match here has been played before." — layered history.',
  'Pyramid Fortress':'"Built to outlast gods." — tiered defense.',
  Citadel:      '"Where champions are unmade." — sprawling fortress.',
  Caldera:      '"The forge that never cooled." — volcanic crater.',
  'Nexus Core': '"Pure energy, poorly contained." — objective-dense.',
  Apocalypse:   '"The end, but bigger." — maximum scale.',
};

const TERRAIN_COLORS = {
  blank:'transparent', grass:'rgba(80,140,60,0.45)', grass_2:'rgba(90,150,70,0.4)',
  grass_rocky:'rgba(100,130,70,0.35)', water:'rgba(50,100,200,0.5)', deep_water:'rgba(30,60,160,0.6)',
  lava:'rgba(220,80,20,0.55)', desert:'rgba(180,160,80,0.4)', dirt:'rgba(130,100,60,0.35)',
  mountain:'rgba(120,110,100,0.5)', mountain_2:'rgba(110,100,90,0.45)', cave_floor:'rgba(80,70,60,0.4)',
  cave_wall:'rgba(60,50,45,0.5)', ice:'rgba(160,210,240,0.45)', bridge:'rgba(140,110,70,0.4)',
  forest:'rgba(40,100,40,0.5)', forest_2:'rgba(50,110,50,0.45)', dark_woods:'rgba(30,60,30,0.55)',
  healing_spring:'rgba(100,220,180,0.45)', sanctuary:'rgba(200,180,120,0.4)',
  crystal:'rgba(160,120,220,0.45)', ruins:'rgba(140,130,110,0.35)',
  bricks_1:'rgba(150,100,70,0.45)', bricks_2:'rgba(140,90,65,0.4)',
  wood_planks:'rgba(160,120,70,0.4)', wood:'rgba(140,100,60,0.35)',
  rubble_1:'rgba(120,110,95,0.35)', rubble_2:'rgba(115,105,90,0.35)',
  rock_wall_1:'rgba(90,85,80,0.5)', rock_wall_2:'rgba(85,80,75,0.5)',
  urban_wall:'rgba(100,95,100,0.5)', urban_street:'rgba(130,125,120,0.35)',
  wasteland:'rgba(140,120,80,0.35)', cave_entrance:'rgba(70,60,50,0.45)',
  barrier_passage:'rgba(140,140,200,0.2)', cloud:'rgba(200,210,230,0.3)',
  purple_grass:'rgba(120,60,140,0.4)', purple_bog:'rgba(100,50,120,0.45)',
  scorched:'rgba(60,50,40,0.45)', poison:'rgba(80,160,60,0.45)',
  mushroom:'rgba(160,80,120,0.4)', obsidian:'rgba(40,35,50,0.5)',
  well:'rgba(70,130,180,0.4)', road:'rgba(150,140,120,0.35)',
  rocks_1:'rgba(110,105,100,0.4)', rocks_2:'rgba(105,100,95,0.4)',
  rocks_3:'rgba(100,95,90,0.4)', rocks_4:'rgba(95,90,85,0.4)', rocks_5:'rgba(90,85,80,0.4)',
};

function accentForMap(mp) {
  const name = (mp.name || '').toLowerCase();
  if (name.includes('caldera') || name.includes('inferno')) return '#ff7a4a';
  if (name.includes('cathedral') || name.includes('bastion') || name.includes('lattice') || name.includes('pyramid')) return '#f4d36b';
  if (name.includes('tower') || name.includes('drift') || name.includes('nexus')) return '#5fd6ff';
  if (name.includes('necropolis') || name.includes('crypt') || name.includes('rift') || name.includes('dreamscape')) return '#b88cff';
  if (name.includes('garden') || name.includes('bloom') || name.includes('highlands') || name.includes('battlefield')) return '#6ee2a8';
  if (name.includes('workshop') || name.includes('forge') || name.includes('kill')) return '#ff7a8a';
  if (name.includes('archive') || name.includes('codex') || name.includes('palimpsest')) return '#f2c468';
  if (name.includes('wasteland') || name.includes('ruin') || name.includes('suburb')) return '#d9c39a';
  if (name.includes('cavern') || name.includes('bunker') || name.includes('cave')) return '#8a93a8';
  if (name.includes('apocalypse')) return '#e168c8';

  const w = mp.w || 8;
  if (w >= 20) return '#ff7a8a';
  if (w >= 16) return '#b88cff';
  if (w >= 12) return '#6ee2a8';
  if (w >= 8) return '#5fd6ff';
  return '#f2c468';
}

function StarField() {
  const stars = useMemo(() => {
    const out = [];
    let s = 11 * 9301 + 49297;
    for (let i = 0; i < 120; i++) {
      s = (s * 9301 + 49297) % 233280;
      const x = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const y = (s / 233280) * 100;
      s = (s * 9301 + 49297) % 233280;
      const r = ((s / 233280) * 1.6) + 0.2;
      s = (s * 9301 + 49297) % 233280;
      const o = ((s / 233280) * 0.7) + 0.1;
      out.push(h('div', { key: i, style: {
        position: 'absolute', left: x + '%', top: y + '%',
        width: r, height: r,
        background: 'rgba(220,230,255,' + o + ')',
        borderRadius: '50%',
      }}));
    }
    return out;
  }, []);

  return h('div', { style: {
    position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
  }},
    h('div', { style: {
      position: 'absolute', inset: 0,
      backgroundImage: 'linear-gradient(' + EW.grid + ' 1px, transparent 1px), linear-gradient(90deg, ' + EW.grid + ' 1px, transparent 1px)',
      backgroundSize: '56px 56px',
      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
    }}),
    ...stars
  );
}

function MapPreview({ mp, size, mini }) {
  size = size || 200;
  const w = mp.w || mp.boardWidth || 8;
  const ht = mp.h || mp.boardHeight || 8;
  const maxDim = Math.max(w, ht);
  const cell = (size - 4) / maxDim;
  const offX = Math.floor((maxDim - w) / 2);
  const offY = Math.floor((maxDim - ht) / 2);
  const accent = accentForMap(mp);
  const pbData = (mp.isPrebuilt && typeof PREBUILT_MAPS !== 'undefined') ? PREBUILT_MAPS[mp.modeId] : null;

  const rects = useMemo(() => {
    const out = [];
    for (let r = 0; r < maxDim; r++) {
      for (let c = 0; c < maxDim; c++) {
        const mr = r - offY;
        const mc = c - offX;
        if (mr < 0 || mr >= ht || mc < 0 || mc >= w) continue;
        let color = 'rgba(80,140,60,0.18)';
        if (pbData) {
          const tid = pbData.grid[mr]?.[mc] || 0;
          const tKey = (typeof ME_TERRAIN_IDS !== 'undefined' && ME_TERRAIN_IDS[tid]) ? ME_TERRAIN_IDS[tid] : null;
          color = (tKey && TERRAIN_COLORS[tKey]) ? TERRAIN_COLORS[tKey] : (tid === 0 ? 'transparent' : 'rgba(80,140,60,0.3)');
        }
        const xx = c * cell;
        const yy = r * cell;
        out.push(h('rect', {
          key: r + ',' + c,
          x: xx, y: yy,
          width: cell - 0.5, height: cell - 0.5,
          fill: color, stroke: '#000', strokeOpacity: 0.25, strokeWidth: 0.5,
        }));
      }
    }

    if (pbData && pbData.spawns) {
      [1, 2].forEach(team => {
        const spawns = pbData.spawns[team] || [];
        const clr = team === 1 ? '#5fd6ff' : '#e168c8';
        spawns.forEach((sp, si) => {
          const sx = (sp.x + offX) * cell + cell / 2;
          const sy = (sp.y + offY) * cell + cell / 2;
          out.push(h('circle', {
            key: 'sp' + team + '-' + si,
            cx: sx, cy: sy, r: cell * 0.3,
            fill: clr, opacity: 0.8,
          }));
        });
      });
    }
    return out;
  }, [mp.modeId, size]);

  return h('div', { style: {
    width: size + 8, height: size + 8, padding: 4, position: 'relative',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7))',
    border: '1px solid ' + EW.panelEdge,
    boxShadow: '0 0 30px ' + accent + '22, inset 0 0 20px rgba(0,0,0,0.5)',
  }},
    h('svg', {
      width: size, height: size,
      viewBox: '0 0 ' + size + ' ' + size,
      style: { display: 'block' },
    },
      h('rect', { width: size, height: size, fill: '#04060c' }),
      ...rects,
      !mini && h('g', { opacity: 0.6 },
        h('text', {
          x: 6, y: size - 6,
          fill: EW.inkDim,
          fontFamily: 'DotGothic16, monospace',
          fontSize: 9, letterSpacing: '0.16em',
        }, w + '×' + ht),
        h('text', {
          x: size - 26, y: size - 6,
          fill: EW.inkDim,
          fontFamily: 'DotGothic16, monospace',
          fontSize: 9, letterSpacing: '0.16em',
        }, 'N↑')
      )
    )
  );
}

function ModeCard({ m, selected, onClick }) {
  return h('div', {
    onClick: onClick,
    className: 'ms-mode-card' + (selected ? ' selected' : ''),
    style: {
      position: 'relative', cursor: 'pointer', padding: '12px 14px',
      background: selected
        ? 'linear-gradient(180deg, ' + EW.time + '1a, rgba(0,0,0,0.4))'
        : 'rgba(0,0,0,0.35)',
      border: '1px solid ' + (selected ? EW.time + 'aa' : EW.panelEdge),
      display: 'flex', gap: 12, alignItems: 'flex-start',
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
    },
  },
    selected && h('div', { style: {
      position: 'absolute', top: 0, bottom: 0, left: 0, width: 2,
      background: EW.time, boxShadow: '0 0 10px ' + EW.time,
    }}),
    h('div', { style: {
      flexShrink: 0, width: 36, height: 36,
      background: 'linear-gradient(180deg, ' + (selected ? EW.time : EW.inkMute) + '22, rgba(0,0,0,0.4))',
      border: '1px solid ' + (selected ? EW.time + '66' : EW.panelEdge),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: selected ? EW.time : EW.inkMute, fontSize: 18,
    }}, m.icon),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('div', { style: {
        fontFamily: '"Cinzel", serif',
        fontSize: 18, color: EW.ink, lineHeight: 1, letterSpacing: '0.02em',
      }}, m.label),
      h('div', { style: {
        fontFamily: 'Inter, sans-serif', fontSize: 11,
        color: EW.inkMute, lineHeight: 1.4, marginTop: 5,
      }}, m.desc)
    )
  );
}

function MapCard({ mp, selected, onClick, accent }) {
  return h('div', {
    onClick: onClick,
    className: 'ms-map-card',
    style: {
      position: 'relative', cursor: 'pointer',
      background: selected
        ? 'linear-gradient(180deg, ' + accent + '22, rgba(0,0,0,0.4))'
        : 'rgba(0,0,0,0.35)',
      border: '1px solid ' + (selected ? accent : EW.panelEdge),
      padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
    },
  },
    selected && h('div', { style: {
      position: 'absolute', top: 0, bottom: 0, left: 0, width: 2,
      background: accent, boxShadow: '0 0 10px ' + accent,
    }}),
    h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 10 } },
      h('div', { style: { flexShrink: 0 } },
        h(MapPreview, { mp: mp, size: 72, mini: true })
      ),
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 } },
        h('div', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 15,
          color: EW.ink, lineHeight: 1, letterSpacing: '0.02em',
        }}, mp.name),
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 9,
          color: EW.inkMute, letterSpacing: '0.12em',
          display: 'flex', justifyContent: 'space-between', gap: 6,
        }},
          h('span', { style: { color: accent, fontWeight: 600 } }, mp.size),
          h('span', null, mp.isPrebuilt ? 'PRESET' : 'RANDOM')
        ),
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 8,
          color: EW.inkDim, letterSpacing: '0.12em',
        }}, (mp.team || 4) + ' SPAWNS')
      )
    )
  );
}

function Meta({ label, val, accent }) {
  return h('div', { style: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
    background: 'rgba(0,0,0,0.35)', border: '1px solid ' + EW.panelEdge,
  }},
    h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 8,
      color: EW.inkDim, letterSpacing: '0.2em',
    }}, label),
    h('span', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 11,
      color: accent || EW.ink, fontWeight: 600, letterSpacing: '0.05em',
    }}, val)
  );
}

function CfgRow({ label, children }) {
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
    h('div', { style: {
      fontFamily: '"DotGothic16", monospace', fontSize: 9,
      color: EW.inkDim, letterSpacing: '0.22em',
    }}, label),
    children
  );
}

function Segmented({ options, value, onChange }) {
  return h('div', { style: {
    display: 'flex', border: '1px solid ' + EW.panelEdge,
    background: 'rgba(0,0,0,0.3)',
  }},
    ...options.map((o, i) =>
      h('div', {
        key: o, onClick: () => onChange(o),
        className: 'ms-seg-opt',
        style: {
          flex: 1, padding: '9px 12px', textAlign: 'center', cursor: 'pointer',
          fontFamily: '"DotGothic16", monospace', fontSize: 10,
          letterSpacing: '0.2em',
          color: value === o ? EW.ink : EW.inkMute,
          background: value === o ? 'linear-gradient(180deg, ' + EW.time + '1a, transparent)' : 'transparent',
          borderRight: i < options.length - 1 ? '1px solid ' + EW.panelEdge : 'none',
          borderBottom: value === o ? '2px solid ' + EW.time : '2px solid transparent',
          fontWeight: 600,
        },
      }, o.toUpperCase())
    )
  );
}

function ChipBtn({ on, color, onClick, children }) {
  return h('button', {
    onClick: onClick,
    className: 'ms-chip',
    style: {
      background: on ? (color ? color + '22' : 'rgba(242,196,104,0.14)') : 'rgba(0,0,0,0.3)',
      border: '1px solid ' + (on ? (color || EW.time) : EW.panelEdge),
      color: on ? (color || EW.time) : EW.inkMute,
      padding: '4px 9px',
      fontFamily: '"DotGothic16", monospace', fontSize: 9,
      letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
    },
  }, children);
}

function ChipPick({ on, onClick, children }) {
  return h('button', {
    onClick: onClick,
    className: 'ms-chip',
    style: {
      background: on ? EW.time + '1a' : 'rgba(0,0,0,0.3)',
      border: '1px solid ' + (on ? EW.time : EW.panelEdge),
      color: on ? EW.time : EW.inkMute,
      padding: '8px 14px',
      fontFamily: '"DotGothic16", monospace', fontSize: 11,
      letterSpacing: '0.16em', fontWeight: 600, cursor: 'pointer',
    },
  }, children);
}

function MatchSelect() {

  const gameModes = typeof MS_GAME_MODES !== 'undefined' ? MS_GAME_MODES : [];
  const mapList = typeof MS_MAP_LIST !== 'undefined' ? MS_MAP_LIST : [];
  const multiplayerModes = typeof MULTIPLAYER_MODES !== 'undefined' ? MULTIPLAYER_MODES : {};

  const [gmIdx, setGmIdx] = useState(0);
  const [mapIdx, setMapIdx] = useState(7);
  const [sizeFilter, setSizeFilter] = useState(null);
  const [query, setQuery] = useState('');
  const [teamSize, setTeamSize] = useState(0);
  const [ranked, setRanked] = useState(false);
  const [opponent, setOpponent] = useState('CPU');
  const [rounds, setRounds] = useState(15);

  const gm = gameModes[gmIdx] || { id: 'arena', icon: '🏰', label: 'Arena', desc: '' };
  const mpMode = multiplayerModes[gm.id] || {};
  const isFFA = !!mpMode.isFFA;

  const maxTeamForMap = useCallback((mi) => {
    const mp = mapList[mi];
    if (!mp) return 2;
    const mode = typeof GAME_MODES !== 'undefined' ? GAME_MODES[mp.modeId] : null;
    if (!mode) return mp.team || 2;
    const spawnCount = mode.spawns[1].length;
    const areaCap = Math.floor(((mp.w || 8) * (mp.h || 8)) / 4);
    let cap = Math.min(Math.max(spawnCount, areaCap), 16);
    if (isFFA && mpMode.maxPlayers) cap = Math.min(mpMode.maxPlayers, cap);
    return cap;
  }, [gmIdx, isFFA]);

  useEffect(() => {
    const mp = mapList[mapIdx];
    if (!mp) return;
    const maxT = maxTeamForMap(mapIdx);
    const defaultT = mp.team || maxT;
    setTeamSize(ts => {
      if (ts < 1 || ts > maxT) return Math.max(1, Math.min(defaultT, maxT));
      return ts;
    });

    if (mpMode.roundLimit) setRounds(mpMode.roundLimit);
  }, [gmIdx, mapIdx]);

  const compatibleMapIndices = useMemo(() => {
    if (!mpMode.compatibleMaps) return mapList.map((_, i) => i);
    return mapList.map((m, i) => mpMode.compatibleMaps.includes(m.modeId) ? i : -1).filter(i => i >= 0);
  }, [gmIdx]);

  const filteredMaps = useMemo(() => {
    return compatibleMapIndices.filter(i => {
      const m = mapList[i];
      if (!m) return false;
      const w = m.w || 8;
      if (sizeFilter === 'sm' && w > 8) return false;
      if (sizeFilter === 'md' && (w < 10 || w > 14)) return false;
      if (sizeFilter === 'lg' && w < 16) return false;
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [compatibleMapIndices, sizeFilter, query]);

  useEffect(() => {
    if (compatibleMapIndices.length > 0 && !compatibleMapIndices.includes(mapIdx)) {
      setMapIdx(compatibleMapIndices[0]);
    }
  }, [compatibleMapIndices]);

  useEffect(() => {
    _msSelectedGM = gmIdx;
    _msSelectedMap = mapIdx;
    _msSelectedTeamSize = teamSize;
    _msRanked = false;
    _msOnline = false;
    _msSelectedRounds = rounds;
  }, [gmIdx, mapIdx, teamSize, ranked, opponent]);

  const mp = mapList[mapIdx] || { name: '—', size: '8×8', w: 8, h: 8, team: 4 };
  const accent = accentForMap(mp);
  const maxT = maxTeamForMap(mapIdx);
  const teamDisplay = isFFA ? '' + teamSize : teamSize + 'v' + teamSize;
  const winLabel = mpMode.hasTowers ? 'Tower/Elim' :
    mpMode.scoringType === 'kills' ? 'Most Kills' :
    mpMode.scoringType === 'domination' || mpMode.scoringType === 'hotspot' ? 'Most Pts' :
    mpMode.scoringType === 'ctf' ? 'Captures' : 'Composite';

  function handleConfirm() {
    if (typeof window._msConfirm === 'function') window._msConfirm();
  }

  function handleBack() {
    if (typeof window._msBack === 'function') window._msBack();
  }

  function handleRandomize() {
    if (typeof playSfx === 'function') playSfx('uiButtonConfirm');

    const randomGM = Math.floor(Math.random() * gameModes.length);
    setGmIdx(randomGM);

    if (filteredMaps.length > 0) {
      setMapIdx(filteredMaps[Math.floor(Math.random() * filteredMaps.length)]);
    }
  }

  function selectMode(i) {
    if (gameModes[i] && gameModes[i].locked) return;
    if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
    setGmIdx(i);
  }

  function selectMap(i) {
    if (typeof playSfx === 'function') playSfx('uiButtonConfirm');
    setMapIdx(i);
  }

  return h('div', { style: {
    width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
    background: 'radial-gradient(ellipse 1200px 800px at 50% 30%, #14182a 0%, ' + EW.bg + ' 60%, #02030a 100%)',
    color: EW.ink, fontFamily: 'Inter, system-ui, sans-serif',
  }},
    h(StarField),

    h('div', { style: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 64, zIndex: 2,
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 24,
      borderBottom: '1px solid ' + EW.panelEdge,
      background: 'linear-gradient(180deg, rgba(15,18,32,0.85), rgba(15,18,32,0))',
    }},
      h('button', { onClick: handleBack, className: 'ms-btn-ghost', style: {
        background: 'transparent', color: EW.inkMute,
        border: '1px solid ' + EW.panelEdge, padding: '10px 16px',
        fontFamily: '"DotGothic16", monospace', fontSize: 10,
        letterSpacing: '0.22em', cursor: 'pointer',
      }}, '← BACK'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },

        h('svg', { width: 28, height: 28, viewBox: '0 0 28 28' },
          h('circle', { cx: 14, cy: 14, r: 12, fill: 'none', stroke: EW.time, strokeWidth: 1 }),
          h('circle', { cx: 14, cy: 14, r: 6, fill: 'none', stroke: EW.time, strokeWidth: 0.5 }),
          h('circle', { cx: 14, cy: 14, r: 2, fill: EW.time }),
          h('line', { x1: 14, y1: 0, x2: 14, y2: 4, stroke: EW.time, strokeWidth: 1 }),
          h('line', { x1: 14, y1: 24, x2: 14, y2: 28, stroke: EW.time, strokeWidth: 1 }),
          h('line', { x1: 0, y1: 14, x2: 4, y2: 14, stroke: EW.time, strokeWidth: 1 }),
          h('line', { x1: 24, y1: 14, x2: 28, y2: 14, stroke: EW.time, strokeWidth: 1 }),
        ),
        h('div', { style: {
          fontFamily: '"Cinzel", serif',
          fontSize: 18, letterSpacing: '0.16em', fontWeight: 500,
        }}, 'ENTROPY WARS'),
        h('div', { style: { width: 1, height: 18, background: EW.panelEdge } }),
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 10,
          color: EW.inkMute, letterSpacing: '0.28em',
        }}, 'SELECT MATCH'),
      ),

      h('div', { style: { flex: 1, display: 'flex', justifyContent: 'center', gap: 24 } },
        ...[
          { n: 'I', label: 'MODE', done: gmIdx >= 0 },
          { n: 'II', label: 'MAP', done: mapIdx >= 0 },
          { n: 'III', label: 'CONFIG', done: false },
        ].map((s, i) =>
          h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8 } },
            h('span', { style: {
              fontFamily: '"Cinzel", serif', fontStyle: 'italic',
              fontSize: 18, color: EW.time, lineHeight: 1,
            }}, s.n),
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 10,
              letterSpacing: '0.24em', color: EW.ink,
            }}, s.label),
            s.done && h('span', { style: {
              width: 5, height: 5, background: EW.good, borderRadius: '50%',
              boxShadow: '0 0 6px ' + EW.good,
            }})
          )
        )
      ),
    ),

    h('div', { style: {
      position: 'absolute', top: 64, bottom: 96, left: 0, right: 0,
      display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 18,
      padding: '18px 22px', zIndex: 1,
    }},

      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 } },
        h('div', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 15,
          letterSpacing: '0.22em', textTransform: 'uppercase', color: EW.inkMute,
        }}, 'Game Mode'),
        h('div', { style: {
          display: 'flex', flexDirection: 'column', gap: 8,
          overflow: 'auto', minHeight: 0, paddingRight: 4,
        }},
          ...gameModes.map((m, i) =>
            h(ModeCard, { key: m.id, m: m, selected: i === gmIdx, onClick: () => selectMode(i) })
          )
        )
      ),

      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 } },

        h('div', { style: {
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(20,24,40,0.6), rgba(8,10,18,0.85)), radial-gradient(ellipse at 50% 30%, ' + accent + '22, transparent 60%)',
          border: '1px solid ' + EW.panelEdge,
          padding: '18px 22px', display: 'flex', gap: 24, minHeight: 280,
        }},

          ...[
            { top: -1, left: -1, rot: 0 },
            { top: -1, right: -1, rot: 90 },
            { bottom: -1, right: -1, rot: 180 },
            { bottom: -1, left: -1, rot: 270 },
          ].map((p, i) =>
            h('div', { key: 'br' + i, style: {
              position: 'absolute', width: 16, height: 16,
              top: p.top, bottom: p.bottom, left: p.left, right: p.right,
              borderTop: '2px solid ' + accent, borderLeft: '2px solid ' + accent,
              transform: 'rotate(' + p.rot + 'deg)',
            }})
          ),

          h('div', { style: {
            flex: '0 0 280px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }},
            h(MapPreview, { mp: mp, size: 250 })
          ),

          h('div', { style: {
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: 12, minWidth: 0,
          }},
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('span', { style: {
                fontFamily: '"DotGothic16", monospace', fontSize: 10,
                letterSpacing: '0.3em', color: EW.inkMute,
              }}, 'MAP · ' + (mp.modeId || '').toUpperCase()),
              h('div', { style: {
                flex: 1, height: 1,
                background: 'linear-gradient(90deg, ' + EW.panelEdge + ', transparent)',
              }})
            ),
            h('div', null,
              h('div', { style: {
                fontFamily: '"Cinzel", serif',
                fontSize: 48, fontWeight: 400, margin: 0, lineHeight: 0.95,
                color: EW.ink, textShadow: '0 0 24px ' + accent + '44',
                letterSpacing: '-0.01em',
              }}, mp.name),
              h('div', { style: {
                fontFamily: '"Cinzel", serif', fontStyle: 'italic',
                fontSize: 18, color: EW.inkMute, marginTop: 2,
              }}, mp.isPrebuilt ? '· preset map' : '· procedural'),
            ),
            h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
              h(Meta, { label: 'SIZE', val: mp.size || (mp.w + '×' + mp.h), accent: accent }),
              h(Meta, { label: 'SPAWNS', val: (mp.team || 4) + ' per side' }),
            ),
            LORE[mp.name] && h('div', { style: {
              fontFamily: '"Cinzel", serif', fontSize: 14, lineHeight: 1.5,
              color: EW.inkMute, fontStyle: 'italic',
              borderLeft: '2px solid ' + accent + '88', paddingLeft: 12, maxWidth: 520,
            }}, LORE[mp.name]),

            h('div', { style: {
              display: 'flex', gap: 6, marginTop: 'auto', alignItems: 'center',
            }},
              h('span', { style: {
                fontFamily: '"DotGothic16", monospace', fontSize: 9,
                letterSpacing: '0.22em', color: EW.inkDim,
              }}, 'SUPPORTS'),
              ...gameModes.filter(mo => {
                const mm = multiplayerModes[mo.id];
                return mm && mm.compatibleMaps && mm.compatibleMaps.includes(mp.modeId);
              }).map(mo =>
                h('span', { key: mo.id, style: {
                  fontFamily: '"DotGothic16", monospace', fontSize: 9,
                  letterSpacing: '0.16em', padding: '3px 7px',
                  border: '1px solid ' + (mo.id === gm.id ? EW.time + 'aa' : EW.panelEdge),
                  color: mo.id === gm.id ? EW.time : EW.inkMute,
                  background: mo.id === gm.id ? EW.time + '14' : 'transparent',
                }}, mo.label.toUpperCase())
              )
            ),
          ),
        ),

        h('div', { style: {
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }},
          h('div', { style: {
            fontFamily: '"Cinzel", serif', fontSize: 15,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: EW.inkMute,
          }},
            'Maps ',
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 10,
              color: EW.inkDim, marginLeft: 6, letterSpacing: '0.16em',
            }}, filteredMaps.length + '/' + compatibleMapIndices.length)
          ),
          h('div', { style: { flex: 1 } }),

          h('div', { style: {
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px', border: '1px solid ' + EW.panelEdge,
            background: 'rgba(0,0,0,0.4)', width: 200,
          }},
            h('span', { style: {
              color: EW.inkDim, fontFamily: '"DotGothic16", monospace', fontSize: 11,
            }}, '⌕'),
            h('input', {
              value: query, onChange: e => setQuery(e.target.value),
              placeholder: 'search maps',
              style: {
                background: 'transparent', border: 'none', outline: 'none',
                color: EW.ink, fontFamily: '"DotGothic16", monospace',
                fontSize: 11, flex: 1, letterSpacing: '0.05em',
              },
            })
          ),

          h('div', { style: { display: 'flex', gap: 5, alignItems: 'center' } },
            h('span', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 9,
              color: EW.inkDim, letterSpacing: '0.18em',
            }}, 'SIZE'),
            ...([['sm', '4–8'], ['md', '10–14'], ['lg', '16+']]).map(([k, l]) =>
              h(ChipBtn, {
                key: k, on: sizeFilter === k,
                onClick: () => setSizeFilter(sizeFilter === k ? null : k),
              }, l)
            )
          ),
        ),

        h('div', { style: {
          flex: 1, minHeight: 0, overflow: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10, paddingRight: 4, alignContent: 'start',
        }},
          ...filteredMaps.map(i => {
            const m = mapList[i];
            return h(MapCard, {
              key: m.modeId, mp: m, selected: i === mapIdx,
              accent: accentForMap(m), onClick: () => selectMap(i),
            });
          }),
          filteredMaps.length === 0 && h('div', { style: {
            gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center',
            color: EW.inkDim, fontFamily: '"DotGothic16", monospace',
            fontSize: 11, letterSpacing: '0.2em',
          }}, 'NO MAPS MATCH FILTERS')
        )
      ),

      h('div', { style: {
        background: 'rgba(8,10,18,0.55)', border: '1px solid ' + EW.panelEdge,
        padding: '18px 18px', display: 'flex', flexDirection: 'column',
        gap: 14, minHeight: 0,
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }},
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
          h('div', { style: {
            fontFamily: '"Cinzel", serif', fontSize: 18,
            letterSpacing: '0.2em', textTransform: 'uppercase', color: EW.ink,
          }}, 'Configuration'),
          h('div', { style: {
            flex: 1, height: 1,
            background: 'linear-gradient(90deg, ' + EW.panelEdge + ', transparent)',
          }})
        ),

        h(CfgRow, { label: isFFA ? 'PLAYERS' : 'TEAM SIZE' },
          h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
            ...(() => {
              const opts = [];
              for (let t = 1; t <= maxT; t++) {
                const label = isFFA ? t + ' Players' : t + 'v' + t;
                opts.push(h(ChipPick, {
                  key: t, on: teamSize === t,
                  onClick: () => { setTeamSize(t); if (typeof playSfx === 'function') playSfx('uiButtonConfirm'); },
                }, label));
              }
              return opts;
            })()
          )
        ),

        h(CfgRow, { label: 'BOARD SIZE' },
          h('div', { style: {
            padding: '9px 12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid ' + EW.panelEdge,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: '"DotGothic16", monospace', fontSize: 12, color: EW.ink,
          }},
            h('span', { style: { fontWeight: 600 } }, mp.size || (mp.w + '×' + mp.h)),
            h('span', { style: {
              color: EW.inkDim, fontSize: 9, letterSpacing: '0.16em',
            }}, 'FROM MAP')
          )
        ),

        h(CfgRow, { label: 'ROUNDS' },
          h('div', { style: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.35)', border: '1px solid ' + EW.panelEdge,
            padding: '4px 6px',
          }},
            h('button', {
              onClick: () => setRounds(Math.max(3, rounds - 1)),
              className: 'ms-stepper-btn',
              style: {
                background: 'transparent', border: '1px solid ' + EW.panelEdge,
                color: EW.inkMute, padding: '4px 12px',
                fontFamily: '"DotGothic16", monospace', fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
              },
            }, '−'),
            h('div', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 18,
              fontWeight: 700, color: EW.ink,
              display: 'flex', alignItems: 'baseline', gap: 4,
            }},
              rounds,
              h('span', { style: {
                fontSize: 11, color: EW.inkMute, fontWeight: 400, letterSpacing: '0.1em',
              }}, 'R')
            ),
            h('button', {
              onClick: () => setRounds(Math.min(99, rounds + 1)),
              className: 'ms-stepper-btn',
              style: {
                background: 'transparent', border: '1px solid ' + EW.panelEdge,
                color: EW.inkMute, padding: '4px 12px',
                fontFamily: '"DotGothic16", monospace', fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
              },
            }, '+'),
          )
        ),

        h(CfgRow, { label: 'WIN CONDITION' },
          h('div', { style: {
            padding: '9px 12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid ' + EW.panelEdge,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: EW.ink,
          }},
            h('span', { style: { fontWeight: 600 } }, winLabel),
            h('span', { style: {
              color: EW.inkDim, fontSize: 9, letterSpacing: '0.16em',
              fontFamily: '"DotGothic16", monospace',
            }}, 'FROM MODE')
          )
        ),

        h('div', { style: {
          marginTop: 'auto', padding: '12px 14px',
          background: 'linear-gradient(180deg, ' + accent + '14, transparent)',
          borderLeft: '2px solid ' + accent,
        }},
          h('div', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 9,
            color: EW.inkMute, letterSpacing: '0.22em',
          }}, 'SELECTED'),
          h('div', { style: {
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginTop: 4,
          }},
            h('div', { style: {
              fontFamily: '"Cinzel", serif', fontSize: 20,
              color: EW.ink, lineHeight: 1,
            }}, mp.name),
            h('div', { style: {
              fontFamily: '"DotGothic16", monospace', fontSize: 11,
              color: accent,
            }}, mp.size || (mp.w + '×' + mp.h))
          ),
          h('div', { style: {
            fontFamily: '"DotGothic16", monospace', fontSize: 9,
            color: EW.inkDim, letterSpacing: '0.16em', marginTop: 2,
          }}, gm.label.toUpperCase() + ' · ' + teamDisplay + ' · ' + rounds + 'R')
        ),
      ),
    ),

    h('div', { style: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 96, zIndex: 2,
      display: 'flex', alignItems: 'center', padding: '0 28px', gap: 18,
      borderTop: '1px solid ' + EW.panelEdge,
      background: 'linear-gradient(0deg, rgba(8,10,18,0.85), rgba(8,10,18,0.2))',
    }},

      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 9,
          color: EW.inkDim, letterSpacing: '0.24em',
        }}, 'MATCH SUMMARY'),
        h('div', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 22,
          color: EW.ink, lineHeight: 1, letterSpacing: '0.01em',
        }},
          gm.label + ' ',
          h('span', { style: { color: EW.inkMute, fontStyle: 'italic' } }, '· on '),
          mp.name
        ),
        h('div', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 10,
          color: EW.inkMute, letterSpacing: '0.18em', marginTop: 2,
        }},
          h('span', { style: { color: accent } }, mp.size || (mp.w + '×' + mp.h)),
          h('span', { style: { color: EW.inkDim } }, ' · '),
          h('span', { style: { color: EW.ink } }, teamDisplay),
          h('span', { style: { color: EW.inkDim } }, ' · '),
          h('span', { style: { color: EW.ink } }, rounds + ' ROUNDS'),
          h('span', { style: { color: EW.inkDim } }, ' · '),
          h('span', { style: { color: EW.ink } }, winLabel.toUpperCase()),
          h('span', { style: { color: EW.inkDim } }, ' · '),
          h('span', { style: { color: EW.ink } }, 'VS CPU')
        ),
      ),
      h('div', { style: { flex: 1 } }),
      h('button', {
        onClick: handleRandomize,
        className: 'ms-btn-ghost',
        style: {
          background: 'transparent', color: EW.inkMute,
          border: '1px solid ' + EW.panelEdge, padding: '10px 16px',
          fontFamily: '"DotGothic16", monospace', fontSize: 10,
          letterSpacing: '0.22em', cursor: 'pointer',
        },
      }, 'RANDOMIZE'),
      h('button', {
        onClick: handleConfirm,
        className: 'ms-btn-primary',
        style: {
          background: 'linear-gradient(180deg, ' + EW.time + ', #c89545)',
          color: '#1a1305', border: '1px solid ' + EW.time,
          padding: '18px 40px', display: 'flex', alignItems: 'center', gap: 16,
          cursor: 'pointer', boxShadow: '0 0 32px ' + EW.time + '44',
        },
      },
        h('span', { style: {
          fontFamily: '"Cinzel", serif', fontSize: 20,
          letterSpacing: '0.24em', fontWeight: 600,
        }}, 'CONFIRM'),
        h('span', { style: {
          fontFamily: '"DotGothic16", monospace', fontSize: 11,
          opacity: 0.7, fontWeight: 700,
        }}, '↵')
      ),
    ),

  );
}

let _msReactRoot = null;

window._mountReactMatchSelect = function() {
  const container = document.getElementById('modePage');
  if (!container) return;
  if (!_msReactRoot) {
    _msReactRoot = ReactDOM.createRoot(container);
  }
  _msReactRoot.render(h(MatchSelect));
};

window._unmountReactMatchSelect = function() {
  if (_msReactRoot) {
    _msReactRoot.unmount();
    _msReactRoot = null;
  }
};

window._refreshReactMatchSelect = function() {
  if (_msReactRoot) {
    _msReactRoot.render(h(MatchSelect));
  }
};

})();
