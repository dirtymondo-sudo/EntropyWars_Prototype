(function() {
'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   MATCH SELECT — THE TERMINAL (2026-09-08)
   The screen is a CRT monitor: the console's own tube, full frame (bezel,
   glass, scanlines, the phosphor's warm black), styled by styles-base.css
   `.ms-crt` / `.ms-tty-*`. It lives in two homes:
   · #hqTerminal inside the D.O.O.R. headquarters — the camera has pushed
     onto the desk's CRT (three-renderer.js hq.focusScreen) and map.js
     _hqOpenTerminal powers it on; the building waits underneath, paused.
     STEP AWAY pulls the camera back into the room, FILE leaves for the
     party builder.
   · #modePage — the classic route (?nohq, VS CPU from the play hub): the
     same monitor on black.
   Two VARIANTS of the content:
   · FULL  — MODE · every SITE (map cards, filters) · CONFIG. The Training
     Room's RANGE console and DISPATCH open it (any site, any mode).
   · SITE  — the site is the room you stand in (a walkable site's CROSSING
     console, a bay threshold's CROSS / DEEP): the site file, then BOARD
     (Δ 8×8 / the full site) · MODE · TEAM · ROUNDS · TEMPO. No map grid.
   The launch contract is unchanged: the module globals _msSelected* are
   mirrored during render and map.js _msConfirm reads them; a D.O.O.R.
   crossing rides window._hqPreselect (map.js _hqLaunchMission), whose
   `locked` flag picks the SITE variant. Plain game words stay: MODE / MAP /
   CONFIG / CONFIRM are not renamed in the code.
   ═══════════════════════════════════════════════════════════════════════ */

const h = React.createElement;
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ── D.O.O.R. layer (DOOR_DESIGN §3): every map is a SITE FILE (data.js
   DOOR_TEXT.SITE_FILES: status stamp, jurisdiction, executive summary) and
   the roster's POINT OF ENTRY table tells you who crossed there. Everything
   degrades to the plain screen if data.js predates the layer. ── */
const DOOR = (typeof window !== 'undefined' && window.DOOR_TEXT) || null;
const STAMP_INK = { admit: '#4fc07a', deny: '#e0554a', void: '#8f8f8f' };
function siteFileFor(mp) {
  if (!mp || typeof window.doorSiteFile !== 'function') return null;
  return window.doorSiteFile(mp.modeId);
}
function siteCaseNo(mp) {
  return (mp && typeof window.doorCaseNo === 'function') ? window.doorCaseNo(mp.modeId) : '';
}
/* the room register (HQ plan 7.1): the number on the plate over this site's door */
function siteRoomNo(mp) {
  return (mp && typeof window.hqRoomNo === 'function') ? (window.hqRoomNo(mp.modeId) || '') : '';
}
function siteFirstCrossing(mp) {
  return (mp && typeof window.doorSiteCanonDate === 'function') ? window.doorSiteCanonDate(mp.modeId) : '';
}
function siteCrossings(mp) {
  if (!mp || typeof window.doorSiteCrossings !== 'function') return [];
  return window.doorSiteCrossings(mp.name).map(r => ({
    key: r,
    label: (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(r, 'male') : null)
      || (window.RACE_PROFILES && window.RACE_PROFILES[r] && window.RACE_PROFILES[r].label) || r,
  }));
}
function siteMeta(mp) {
  try {
    if (!mp || typeof EW_MAP_META === 'undefined') return null;
    const id = (typeof window.hqSiteId === 'function') ? window.hqSiteId(mp.modeId) : String(mp.modeId).replace(/_delta$/, '');
    return EW_MAP_META.find(m => m.id === id) || null;
  } catch (_e) { return null; }
}
function activeProfile() {
  try { return (window.ProfileSystem && window.ProfileSystem.getActiveProfile && window.ProfileSystem.getActiveProfile()) || null; } catch (_e) { return null; }
}
function officerInfo() {
  const p = activeProfile();
  if (!p) return null;
  const cl = (typeof window.doorClearance === 'function') ? window.doorClearance(p) : { level: 1, title: 'PROBATIONARY' };
  return { name: p.username || 'OFFICER', clearance: cl };
}
function canonDate() {
  try { return (typeof window.doorCanonDate === 'function') ? window.doorCanonDate() : ''; } catch (_e) { return ''; }
}
function playUi() { if (typeof playSfx === 'function') playSfx('uiButtonConfirm'); }
function doorSfx(key, opts) { try { if (typeof window.playDoorSfx === 'function') window.playDoorSfx(key, opts || {}); } catch (_e) {} }

function DoorStamp({ text, tone, size, style, title }) {
  return h('span', {
    className: 'door-stamp' + (tone === 'admit' ? ' admit' : tone === 'void' ? ' void' : '')
      + (size === 'sm' ? ' door-stamp-sm' : size === 'lg' ? ' door-stamp-lg' : ''),
    style: style, title: title,
  }, text);
}

const _TERRAIN_COLORS_FALLBACK = {
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
  dungeon:'rgba(85,80,75,0.5)', dungeon_2:'rgba(80,75,70,0.5)', dungeon_3:'rgba(75,70,68,0.5)', dungeon_4:'rgba(70,66,64,0.5)',
  flesh:'rgba(170,70,80,0.45)', flesh_2:'rgba(160,65,75,0.45)', flesh_3:'rgba(150,60,70,0.45)',
  plague_flesh:'rgba(150,140,55,0.5)',
  drywall:'rgba(200,195,185,0.4)', drywall_2:'rgba(195,190,180,0.4)', drywall_3:'rgba(190,185,175,0.4)', drywall_4:'rgba(185,180,170,0.4)',
  metal_3:'rgba(120,125,130,0.45)',
};
// Prefer the shared, all-terrain palette (data.js); fall back to the inline set above.
const TERRAIN_COLORS = Object.assign({}, _TERRAIN_COLORS_FALLBACK,
  (typeof window !== 'undefined' && window.EW_TERRAIN_COLORS) || {});

/* the minimap: the board's terrain from PREBUILT_MAPS.grid, the spawn dots */
function MapPreview({ mp, size, mini }) {
  size = size || 200;
  const w = mp.w || mp.boardWidth || 8;
  const ht = mp.h || mp.boardHeight || 8;
  const maxDim = Math.max(w, ht);
  const cell = (size - 4) / maxDim;
  const offX = Math.floor((maxDim - w) / 2);
  const offY = Math.floor((maxDim - ht) / 2);
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
        out.push(h('rect', {
          key: r + ',' + c,
          x: c * cell, y: r * cell,
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
          out.push(h('circle', {
            key: 'sp' + team + '-' + si,
            cx: (sp.x + offX) * cell + cell / 2, cy: (sp.y + offY) * cell + cell / 2,
            r: cell * 0.3, fill: clr, opacity: 0.8,
          }));
        });
      });
    }
    return out;
  }, [mp.modeId, size]);

  return h('div', { className: 'ms-tty-preview', style: { width: size + 8, height: size + 8 } },
    h('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size },
      h('rect', { width: size, height: size, fill: '#050604' }),
      ...rects,
      !mini && h('g', { opacity: 0.6 },
        h('text', { x: 6, y: size - 6, fill: '#9a8f6e', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.16em' }, w + '×' + ht),
        h('text', { x: size - 26, y: size - 6, fill: '#9a8f6e', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.16em' }, 'N↑')
      )
    )
  );
}

/* ── the parts ─────────────────────────────────────────────────────── */
function ModeRow({ m, selected, onClick }) {
  return h('div', { className: 'ms-tty-row' + (selected ? ' sel' : '') + (m.locked ? ' locked' : ''), onClick: onClick },
    h('em', null, '▸'),
    h('b', null, m.icon ? m.icon + ' ' : '', m.label, m.tag && h('i', null, m.tag)),
    h('p', null, m.desc)
  );
}

function MapCard({ mp, selected, onClick }) {
  const sf = siteFileFor(mp);
  return h('div', { className: 'ms-tty-card' + (selected ? ' sel' : ''), onClick: onClick, title: sf ? sf.status + ' · ' + sf.juris : undefined },
    h(MapPreview, { mp: mp, size: 56, mini: true }),
    h('div', null,
      h('b', null, mp.name),
      h('span', null, h('em', null, mp.size), h('span', { style: { color: sf ? (STAMP_INK[sf.tone] || undefined) : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, sf ? sf.status : (mp.isPrebuilt ? 'PRESET' : 'RANDOM'))),
      h('small', null, (mp.team || 4) + ' SPAWNS')
    )
  );
}

function Chip({ on, teal, big, disabled, onClick, title, children }) {
  return h('button', { className: 'ms-tty-chip' + (on ? ' on' : '') + (teal ? ' teal' : '') + (big ? ' big' : ''), disabled: !!disabled, onClick: onClick, title: title }, children);
}

function Seg({ options, value, onChange }) {
  return h('div', { className: 'ms-tty-seg' },
    ...options.map(o => h('div', {
      key: o.id, className: (value === o.id ? 'on' : '') + (o.off ? ' off' : ''), title: o.title,
      onClick: () => { if (!o.off) onChange(o.id); },
    }, o.label, o.sub && h('small', null, o.sub)))
  );
}

function Field({ label, hint, children }) {
  return h('div', { className: 'ms-tty-field' }, h('label', null, label, hint && h('i', null, hint)), children);
}

function Stepper({ value, min, max, unit, onChange }) {
  return h('div', { className: 'ms-tty-step' },
    h('button', { onClick: () => onChange(Math.max(min, value - 1)) }, '−'),
    h('b', null, value, h('small', null, unit)),
    h('button', { onClick: () => onChange(Math.min(max, value + 1)) }, '+')
  );
}

/* the mastery checklist on file for a site (HQ plan 3.1) */
function SiteChecks({ siteId }) {
  const sm = (typeof window.hqSiteMastery === 'function') ? window.hqSiteMastery(siteId, activeProfile()) : null;
  const HQ = (typeof window !== 'undefined' && window.DOOR_HQ) || null;
  if (!sm || !HQ || !Array.isArray(HQ.masteryConditions)) return null;
  const labels = HQ.masteryLabels || {};
  return h('div', { className: 'ms-tty-chips' },
    h('span', null, 'ON FILE FOR THIS THRESHOLD · ' + sm.done + '/' + sm.total),
    ...HQ.masteryConditions.map(c => h('i', { key: c, className: 'hq-check ' + (sm.have[c] ? 'ok' : 'no'), title: c }, (sm.have[c] ? '☑ ' : '☐ ') + (labels[c] || c)))
  );
}

/* the day's Code Red on this site (HQ plan 3.3): who, where from, what it pays */
function CodeRedBrief({ siteId }) {
  const cr = (typeof window.hqCodeRed === 'function') ? window.hqCodeRed(activeProfile()) : null;
  if (!cr || cr.cleared || cr.site !== siteId) return null;
  const ent = String(cr.race || '').toUpperCase();
  return h('div', { className: 'hq-codered', style: { flexShrink: 0 } },
    h('b', null, 'CODE RED · ACTIVE BREACH'),
    h('p', null, 'This morning the ' + cr.label + ' threshold — STABILIZED, on file, green — reported ',
      h('i', { className: 'hq-chip' }, ent), ' on the far side. ' + ent + ' is filed at ',
      h('em', null, String(cr.from).toUpperCase()), ' and has no business being here. Cross, put it back, and the Department pays ',
      h('em', { className: 'pay' }, '💰 +' + (cr.bonus | 0) + ' Hazard Pay'), ' on top of the match. The entity leads the CPU roster.')
  );
}

/* the site file: the dossier voice of the codex, numbered sections */
function SiteFile({ mp, variant, pre, gameModes, multiplayerModes, gmId }) {
  const sf = siteFileFor(mp);
  const caseNo = siteCaseNo(mp);
  const roomNo = siteRoomNo(mp);
  const firstCrossing = siteFirstCrossing(mp);
  const crossings = siteCrossings(mp);
  const meta = siteMeta(mp);
  const siteId = (typeof window.hqSiteId === 'function') ? window.hqSiteId(mp.modeId) : String(mp.modeId).replace(/_delta$/, '');
  const boardSizeLabel = mp.size || (mp.w + '×' + mp.h);
  const L = (DOOR && DOOR.SITE_FILE_LABELS) || {};
  /* the pinned CPU pool (data.js hqMissionPool): the first `natives` are the
     site's own entities, the rest its bay's neighbours; [] = a free draw */
  const roster = (pre && Array.isArray(pre.roster)) ? pre.roster : null;
  const nativeN = roster ? (roster.natives | 0) : 0;
  const natives = roster ? (nativeN ? roster.slice(0, nativeN) : roster.slice()) : null;
  const nativesLabel = !roster ? '' : nativeN ? 'ENTITIES ON FILE · THE CPU FIELDS THEM' : (roster.length ? 'NO ENTITY ON FILE · THE BAY FIELDS ITS NEIGHBOURS' : 'ENTITIES ON FILE');
  return h('div', { className: 'ms-tty-file' },
    h('div', { className: 'ms-tty-kicker' },
      h('b', null, DOOR ? 'SITE FILE' : 'MAP DOSSIER'),
      caseNo && h('span', null, caseNo),
      /* the room register (HQ plan 7.1): the number on the plate over this site's door */
      roomNo && h('span', { className: 'ms-tty-no', title: 'The number on the plate over this threshold in the D.O.O.R. headquarters' }, (((DOOR && DOOR.SITE_FILE_LABELS) || {}).room || 'ROOM') + ' ' + roomNo),
      h('span', { className: 'ms-tty-fill' }),
      firstCrossing && h('span', { title: (DOOR && DOOR.CANON_DATE_LABEL) || 'CANON DATE · SUBJECT TO REVISION' }, 'FIRST CROSSING · ' + firstCrossing)
    ),
    h('div', { className: 'ms-tty-title' },
      h('h1', null, mp.name),
      sf && h(DoorStamp, { text: sf.status, tone: sf.tone, title: 'Customs status · ' + sf.juris })
    ),
    h('div', { className: 'ms-tty-sub' }, mp.isDelta ? '· Δ map · hand-authored 8×8 board' : (mp.isPrebuilt ? '· full site · ' + boardSizeLabel : '· procedural')),
    h('div', { className: 'ms-tty-meta' },
      h('span', null, h('em', null, 'SIZE'), boardSizeLabel),
      h('span', null, h('em', null, 'SPAWNS'), (mp.team || 4) + ' per side'),
      pre && pre.doorLabel && h('span', null, h('em', null, 'VIA'), pre.doorLabel)
    ),
    sf && h('div', { className: 'ms-tty-kv' }, h('b', null, L.juris || 'JURISDICTION'), sf.juris),
    sf && sf.summary && h('div', null,
      h('div', { className: 'door-file-h' }, '1.  ' + (L.summary || 'EXECUTIVE SUMMARY')),
      h('p', { className: 'ms-tty-p' }, sf.summary)
    ),
    meta && meta.desc && h('div', { className: 'ms-tty-note' }, 'FIELD: ' + meta.desc),
    variant === 'site' && h(CodeRedBrief, { siteId: siteId }),
    variant === 'site' && natives && h('div', { className: 'ms-tty-chips' },
      h('span', null, nativesLabel),
      ...(natives.length ? natives.map((r, i) => h('i', { key: r + i, className: 'hq-chip' }, String(r).toUpperCase())) : [h('i', { key: 'none', className: 'hq-chip dim' }, 'NONE — FREE DRAW')])
    ),
    variant === 'site' && h(SiteChecks, { siteId: siteId }),
    crossings.length > 0 && h('div', null,
      h('div', { className: 'door-file-h' }, (variant === 'site' ? '2.  ' : '2.  ') + (L.crossings || 'KNOWN CROSSINGS'), h('b', null, crossings.length + ' ON FILE · point of entry')),
      h('div', { style: { display: 'flex', flexWrap: 'wrap' } },
        ...crossings.slice(0, 10).map(c => h('span', { key: c.key, className: 'door-file-chip', title: 'Codex: ' + c.label }, c.label)),
        crossings.length > 10 && h('span', { className: 'door-file-chip more' }, '+' + (crossings.length - 10) + ' redacted')
      )
    ),
    variant !== 'site' && h('div', { className: 'ms-tty-supports' }, 'SUPPORTS',
      ...gameModes.filter(mo => { const mm = multiplayerModes[mo.id]; return mm && mm.compatibleMaps && mm.compatibleMaps.includes(mp.modeId); })
        .map(mo => h('i', { key: mo.id, className: mo.id === gmId ? 'on' : '' }, mo.label.toUpperCase()))
    )
  );
}

/* ── the screen ────────────────────────────────────────────────────── */
function MatchSelect(props) {
  props = props || {};
  const gameModes = typeof MS_GAME_MODES !== 'undefined' ? MS_GAME_MODES : [];
  const mapList = typeof MS_MAP_LIST !== 'undefined' ? MS_MAP_LIST : [];
  const multiplayerModes = typeof MULTIPLAYER_MODES !== 'undefined' ? MULTIPLAYER_MODES : {};

  /* A crossing launched from the headquarters (map.js _hqLaunchMission,
     DOOR_HQ_BUILD_PLAN §3.7) pre-selects mode / map / team size here and,
     with `locked`, fixes the SITE (the room you stand in). The object stays
     on window until CONFIRM (_msConfirm reads its pinned CPU roster) or
     BACK clears it; the root is remounted per visit so this initial state
     IS the consumption. */
  const pre = props.pre || ((typeof window !== 'undefined' && window._hqPreselect && typeof window._hqPreselect === 'object') ? window._hqPreselect : null);
  const frame = props.frame || 'page';
  let variant = props.variant || ((pre && pre.locked) ? 'site' : 'full');
  const siteId = (pre && pre.mapId) ? pre.mapId : null;
  const deltaIdx = siteId ? mapList.findIndex(m => m.modeId === siteId + '_delta') : -1;
  const fullIdx = siteId ? mapList.findIndex(m => m.modeId === siteId) : -1;
  if (variant === 'site' && deltaIdx < 0 && fullIdx < 0) variant = 'full';   // no launch entry for the site: the whole desk
  const isSite = variant === 'site';

  const [gmIdx, setGmIdx] = useState(() => {
    if (pre && pre.gm) { const i = gameModes.findIndex(m => m.id === pre.gm); if (i >= 0) return i; }
    return 0;
  });
  // Default to the first Δ map — 4v4 8×8 delta maps are the competitive default.
  const [mapIdx, setMapIdx] = useState(() => {
    if (pre && pre.launchId) { const i = mapList.findIndex(m => m.modeId === pre.launchId); if (i >= 0) return i; }
    if (isSite) return deltaIdx >= 0 ? deltaIdx : fullIdx;
    const di = mapList.findIndex(m => m.isDelta);
    return di >= 0 ? di : 7;
  });
  const [sizeFilter, setSizeFilter] = useState(null);
  /* the Δ filter opens on the pre-selected board's own kind (the Training
     Room / Holo Sim have no Δ cut — the range must not hide its own board) */
  const [deltaOnly, setDeltaOnly] = useState(() => {
    const preMap = (pre && pre.launchId) ? mapList.find(m => m.modeId === pre.launchId) : null;
    if (preMap) return !!preMap.isDelta;
    return pre ? !!pre.delta : true;
  });
  const mountedRef = useRef(false);
  const [query, setQuery] = useState('');
  const [teamSize, setTeamSize] = useState(() => (pre && pre.teamSize > 0) ? pre.teamSize : 0);
  const [rounds, setRounds] = useState(15);
  /* CPU TEMPO (2026-09-07): ⚡ TRAINING = the CPU's turns resolve instantly
     (no animations, no camera, no banners — battle.js _setAiTurbo); the
     player's own turns are untouched. Sticky across visits (localStorage). */
  const [training, setTraining] = useState(() => {
    try { return localStorage.getItem('ew_training_match') === '1'; } catch (_e) { return false; }
  });
  function pickTraining(on) {
    setTraining(on);
    try { localStorage.setItem('ew_training_match', on ? '1' : '0'); } catch (_e) {}
    playUi();
  }
  // CONFIRM = the form goes through: a FILED stamp thunks onto the button,
  // then the existing launch path runs. filedRef blocks a double-click
  // during the 420 ms beat; both reset after launch.
  const [filed, setFiled] = useState(false);
  const filedRef = useRef(false);

  const gm = gameModes[gmIdx] || { id: 'arena', icon: '🏰', label: 'Arena', desc: '' };
  const mpMode = multiplayerModes[gm.id] || {};
  const isFFA = !!mpMode.isFFA;
  /* A mode pinned to a single map (Clash) always shows that map — the Δ /
     size filters would otherwise hide it and empty the map grid. */
  const pinnedMap = !!(mpMode.compatibleMaps && mpMode.compatibleMaps.length === 1);

  const maxTeamForMap = useCallback((mi) => {
    const mp = mapList[mi];
    if (!mp) return 2;
    const mode = typeof GAME_MODES !== 'undefined' ? GAME_MODES[mp.modeId] : null;
    if (!mode) return mp.team || 2;
    const spawnCount = mode.spawns[1].length;
    const areaCap = Math.floor(((mp.w || 8) * (mp.h || 8)) / 4);
    let cap = Math.min(Math.max(spawnCount, areaCap), 16);
    if (mpMode.isClash) cap = Math.min(cap, spawnCount);
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
    // Clash is locked to 4v4 — snap the stepper so the display matches launch.
    if (mpMode.isClash) setTeamSize(4);
  }, [gmIdx, mapIdx]);

  const compatibleMapIndices = useMemo(() => {
    if (!mpMode.compatibleMaps) return mapList.map((_, i) => i);
    return mapList.map((m, i) => mpMode.compatibleMaps.includes(m.modeId) ? i : -1).filter(i => i >= 0);
  }, [gmIdx]);

  const filteredMaps = useMemo(() => {
    if (pinnedMap) return compatibleMapIndices;
    return compatibleMapIndices.filter(i => {
      const m = mapList[i];
      if (!m) return false;
      if (deltaOnly && !m.isDelta) return false;
      const w = m.w || 8;
      if (sizeFilter === 'sm' && w > 8) return false;
      if (sizeFilter === 'md' && (w < 10 || w > 14)) return false;
      if (sizeFilter === 'lg' && w < 16) return false;
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [compatibleMapIndices, sizeFilter, deltaOnly, query, pinnedMap]);

  // When the Δ toggle flips, keep the selection valid: if the current map is
  // filtered out, jump to the first map that still matches.
  useEffect(() => {
    if (isSite) return;
    if (!mountedRef.current) { mountedRef.current = true; return; }   // not on mount: the pre-selection stands
    if (filteredMaps.length > 0 && !filteredMaps.includes(mapIdx)) setMapIdx(filteredMaps[0]);
  }, [deltaOnly]);

  useEffect(() => {
    if (isSite) return;
    if (compatibleMapIndices.length > 0 && !compatibleMapIndices.includes(mapIdx)) setMapIdx(compatibleMapIndices[0]);
  }, [compatibleMapIndices]);

  /* SITE variant: the modes this board can play (Clash is pinned to its own
     stage — not this site; Gauntlet keeps the full boards). A board switch
     that leaves the mode behind snaps back to the first legal one. */
  const siteModes = useMemo(() => {
    if (!isSite) return gameModes;
    const mp = mapList[mapIdx];
    return gameModes.filter(m => m.id !== 'clash' && !m.locked && (!multiplayerModes[m.id] || !multiplayerModes[m.id].compatibleMaps || multiplayerModes[m.id].compatibleMaps.includes(mp && mp.modeId)));
  }, [isSite, mapIdx]);
  useEffect(() => {
    if (!isSite || !siteModes.length) return;
    if (!siteModes.some(m => m.id === gm.id)) setGmIdx(gameModes.indexOf(siteModes[0]));
  }, [siteModes]);

  // Mirror the live selection into the module globals during render (NOT in a
  // deferred useEffect): _msConfirm reads these synchronously on CONFIRM, and
  // an effect-based mirror can be outrun by a fast click.
  _msSelectedGM = gmIdx;
  _msSelectedMap = mapIdx;
  _msSelectedTeamSize = teamSize;
  _msRanked = false;
  _msOnline = false;
  _msSelectedRounds = rounds;
  _msTraining = training;

  const mp = mapList[mapIdx] || { name: '—', size: '8×8', w: 8, h: 8, team: 4 };
  const caseNo = siteCaseNo(mp);
  const sf = siteFileFor(mp);
  const boardSizeLabel = mp.size || (mp.w + '×' + mp.h);
  const maxT = maxTeamForMap(mapIdx);
  const teamDisplay = isFFA ? '' + teamSize : teamSize + 'v' + teamSize;
  const winLabel = mpMode.isClash ? 'Wipeout' :
    mpMode.hasTowers ? 'Tower/Elim' :
    mpMode.scoringType === 'kills' ? 'Most Kills' : 'Composite';
  const officer = officerInfo();
  const canon = useMemo(() => canonDate(), []);   // the canon date is rolled once per visit (it is "subject to revision", not per click)
  const consoleLabel = isSite ? 'CROSSING CONSOLE' : 'FIELD ASSIGNMENT TERMINAL';
  let whereLabel = (pre && pre.doorLabel) ? pre.doorLabel : (frame === 'room' ? 'HEADQUARTERS' : 'CUSTOMS & ADMISSIONS');
  if (String(whereLabel).toUpperCase() === consoleLabel) { const rn = siteRoomNo(mp); whereLabel = 'ON SITE' + (rn ? ' · ROOM ' + rn : ''); }

  function handleConfirm() {
    if (typeof window._msConfirm !== 'function') return;
    if (filedRef.current) return;
    filedRef.current = true;
    setFiled(true);
    doorSfx('stamp', { volume: 0.8 });
    setTimeout(() => {
      filedRef.current = false;
      setFiled(false);
      window._msConfirm();
    }, 420);
  }
  function handleBack() {
    if (typeof window._msBack === 'function') window._msBack();
  }
  function handleRandomize() {
    playUi();
    setGmIdx(Math.floor(Math.random() * gameModes.length));
    if (filteredMaps.length > 0) setMapIdx(filteredMaps[Math.floor(Math.random() * filteredMaps.length)]);
  }
  function selectMode(m) {
    if (!m || m.locked) return;
    const i = gameModes.indexOf(m);
    if (i < 0) return;
    playUi();
    setGmIdx(i);
  }
  function selectMap(i) { playUi(); setMapIdx(i); }
  /* SITE: Δ board ↔ the full site; the team size follows the board (4v4 on
     the Δ board, the site's own size for a deep crossing — HQ plan §3.7) */
  function pickBoard(b) {
    const idx = b === 'delta' ? deltaIdx : fullIdx;
    if (idx < 0 || idx === mapIdx) return;
    playUi();
    setMapIdx(idx);
    const target = mapList[idx];
    setTeamSize(b === 'delta' ? ((pre && pre.delta && pre.teamSize > 0) ? pre.teamSize : 4) : ((target && target.team) || 4));
  }
  /* FULL: a console's presets (the RANGE console's ORIENTATION / PRACTICE) */
  function pickPreset(p) {
    const idx = mapList.findIndex(m => m.modeId === p.launchId);
    if (idx < 0) return;
    playUi();
    if (p.gm) { const gi = gameModes.findIndex(m => m.id === p.gm); if (gi >= 0) setGmIdx(gi); }
    setMapIdx(idx);
    if (p.teamSize > 0) setTeamSize(p.teamSize);
  }

  /* keys: ENTER files, ESC steps away (in the building ESC belongs to the
     walker's own listener, which closes the terminal — map.js) */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      /* 2026-09-09: the terminal stays MOUNTED in #modePage after a visit
         (the root is kept), so its listener used to fire from every other
         screen — ESC in the standalone forge stepped the hidden terminal
         "back" and re-showed it, ENTER would have FILED a crossing from the
         party builder. The monitor must be on screen to take a key. */
      const hostEl = document.getElementById(props.hostId || 'modePage');
      if (!hostEl || !hostEl.isConnected || hostEl.getClientRects().length === 0) return;
      if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
      else if (e.key === 'Escape' && frame === 'page') { e.preventDefault(); handleBack(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* ── the head line ── */
  const head = h('div', { className: 'ms-tty-head' },
    h('span', null, 'D.O.O.R.'), h('span', { className: 'ms-tty-sep' }, '▸'),
    h('b', null, consoleLabel),
    h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, whereLabel),
    h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, 'TTY-1'),
    canon && h('span', { className: 'ms-tty-sep' }, '·'), canon && h('span', null, canon),
    h('span', { className: 'ms-tty-officer' }, officer ? (officer.name) : 'UNFILED', officer && h('i', null, 'CLEARANCE L' + officer.clearance.level + ' · ' + officer.clearance.title)),
    h('span', { className: 'ms-tty-sep' }, '·'), h('span', { className: 'ms-tty-esc' }, 'ESC · STEP AWAY')
  );

  /* ── the config form (both variants) ── */
  const teamField = h(Field, { label: isFFA ? 'PLAYERS' : 'TEAM SIZE', hint: mpMode.isClash ? 'CLASH · 4v4' : ('MAX ' + maxT) },
    h('div', { className: 'ms-tty-chips' },
      ...(() => { const opts = []; for (let t = 1; t <= maxT; t++) opts.push(h(Chip, { key: t, on: teamSize === t, onClick: () => { setTeamSize(t); playUi(); } }, isFFA ? t + ' Players' : t + 'v' + t)); return opts; })()
    )
  );
  const roundsField = h(Field, { label: 'ROUNDS', hint: mpMode.roundLimit ? 'MODE DEFAULT ' + mpMode.roundLimit : null },
    h(Stepper, { value: rounds, min: 3, max: 100, unit: 'R', onChange: setRounds })
  );
  const winField = h(Field, { label: 'WIN CONDITION' }, h('div', { className: 'ms-tty-ro' }, h('span', null, winLabel), h('em', null, 'FROM MODE')));
  const tempoField = h(Field, { label: 'CPU TEMPO' },
    h(Seg, { value: training ? 'training' : 'cinematic', onChange: (v) => pickTraining(v === 'training'), options: [
      { id: 'cinematic', label: 'Cinematic' }, { id: 'training', label: '⚡ Training' },
    ] }),
    h('div', { className: 'ms-tty-tempo' + (training ? ' on' : '') }, training
      ? 'CPU turns resolve instantly — no animations, no camera — and the CPU learns from your decisions, re-tuning its weights toward how you play.'
      : 'CPU turns play out with full animations and action camera.')
  );
  const assignBlock = h('div', { className: 'ms-tty-assign' },
    h('div', { className: 'ms-tty-kicker' }, h('b', null, DOOR ? 'FIELD ASSIGNMENT' : 'SELECTED'), caseNo && h('span', null, 'CASE ' + caseNo)),
    h('h2', null, mp.name, h('span', null, boardSizeLabel)),
    h('div', { className: 'ms-tty-line' }, gm.label.toUpperCase() + ' · ' + teamDisplay + ' · ' + rounds + 'R' + (training ? ' · ⚡ TRAINING' : '')),
    sf && h('div', { className: 'ms-tty-line' }, 'SITE STATUS  ', h('span', { style: { color: STAMP_INK[sf.tone] || undefined } }, sf.status)),
    pre && h('div', { className: 'ms-tty-dispatch' }, 'DISPATCHED FROM ' + (pre.doorLabel || 'HEADQUARTERS') + ' · '
      + (mp.isDelta ? '4v4 Δ BOARD' : 'DEEP CROSSING') + ' · '
      + (Array.isArray(pre.roster) && pre.roster.length ? 'CPU FIELDS THE SITE’S NATIVE ENTITIES' : 'FREE CPU DRAW · NOTHING FILED'))
  );

  /* ── the body ── */
  let body;
  if (isSite) {
    const boards = [
      { id: 'delta', label: 'Δ BOARD', sub: '8×8 · hand-authored · 4v4', off: deltaIdx < 0, title: 'Arena-ready 8×8 cut of the site, the CPU fielding the entities on file' },
      { id: 'full', label: 'FULL SITE', sub: (mapList[fullIdx] ? mapList[fullIdx].size + ' · ' + (mapList[fullIdx].team || 4) + 'v' + (mapList[fullIdx].team || 4) : 'deep crossing'), off: fullIdx < 0, title: 'Deep crossing: the whole site at its own team size' },
    ];
    body = h('div', { className: 'ms-tty-body ms-tty-site' },
      h('div', { className: 'ms-tty-col ms-tty-dossier' },
        h('div', { className: 'ms-tty-h' }, 'THE SITE', h('span', null, 'YOU ARE STANDING ON THE BOARD · THE CONSOLE FILES THE CROSSING')),
        h('div', { className: 'ms-tty-filebox' },
          h(SiteFile, { mp: mp, variant: 'site', pre: pre, gameModes: gameModes, multiplayerModes: multiplayerModes, gmId: gm.id }),
          h(MapPreview, { mp: mp, size: 230 })
        )
      ),
      h('div', { className: 'ms-tty-col' },
        h('div', { className: 'ms-tty-h' }, 'CROSSING FORM', h('span', null, 'BOARD · MODE · CONFIG')),
        h('div', { className: 'ms-tty-form' },
          h(Field, { label: 'BOARD' }, h(Seg, { options: boards, value: mp.isDelta ? 'delta' : 'full', onChange: pickBoard })),
          h(Field, { label: 'GAME MODE', hint: siteModes.length + ' ON THIS BOARD' },
            h('div', { className: 'ms-tty-list', style: { maxHeight: 250 } },
              ...siteModes.map(m => h(ModeRow, { key: m.id, m: m, selected: m.id === gm.id, onClick: () => selectMode(m) }))
            )
          ),
          teamField, roundsField, winField, tempoField, assignBlock
        )
      )
    );
  } else {
    const presets = (pre && Array.isArray(pre.presets)) ? pre.presets : null;
    body = h('div', { className: 'ms-tty-body ms-tty-full' },
      h('div', { className: 'ms-tty-col ms-tty-modes' },
        h('div', { className: 'ms-tty-h' }, 'GAME MODE'),
        h('div', { className: 'ms-tty-list' },
          ...gameModes.map(m => h(ModeRow, { key: m.id, m: m, selected: m.id === gm.id, onClick: () => selectMode(m) }))
        )
      ),
      h('div', { className: 'ms-tty-col' },
        h('div', { className: 'ms-tty-band' },
          h(MapPreview, { mp: mp, size: 220 }),
          h(SiteFile, { mp: mp, variant: 'full', pre: pre, gameModes: gameModes, multiplayerModes: multiplayerModes, gmId: gm.id })
        ),
        presets && presets.length > 0 && h('div', { className: 'ms-tty-presets' }, 'PRESETS ▸',
          ...presets.map(p => h(Chip, { key: p.id || p.launchId, teal: true, on: mp.modeId === p.launchId, onClick: () => pickPreset(p), title: p.title }, p.label))
        ),
        h('div', { className: 'ms-tty-filters' },
          h('div', { className: 'ms-tty-h' }, 'SITES', h('span', null, filteredMaps.length + '/' + compatibleMapIndices.length)),
          h('div', { className: 'ms-tty-input' }, h('span', null, '⌕'),
            h('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: 'search sites', spellCheck: false })),
          h(Chip, { on: deltaOnly, onClick: () => { setDeltaOnly(d => !d); playUi(); } }, 'Δ MAPS'),
          h('span', { className: 'ms-tty-note', style: { letterSpacing: '0.18em' } }, 'SIZE'),
          ...([['sm', '4–8'], ['md', '10–14'], ['lg', '16+']]).map(([k, l]) => h(Chip, { key: k, on: sizeFilter === k, onClick: () => setSizeFilter(sizeFilter === k ? null : k) }, l))
        ),
        h('div', { className: 'ms-tty-cards' },
          ...filteredMaps.map(i => h(MapCard, { key: mapList[i].modeId, mp: mapList[i], selected: i === mapIdx, onClick: () => selectMap(i) })),
          filteredMaps.length === 0 && h('div', { className: 'ms-tty-empty' }, 'NO SITES MATCH FILTERS')
        )
      ),
      h('div', { className: 'ms-tty-col' },
        h('div', { className: 'ms-tty-h' }, 'CONFIGURATION'),
        h('div', { className: 'ms-tty-form' },
          teamField,
          h(Field, { label: 'BOARD SIZE' }, h('div', { className: 'ms-tty-ro' }, h('span', null, boardSizeLabel), h('em', null, 'FROM SITE'))),
          roundsField, winField, tempoField, assignBlock
        )
      )
    );
  }

  /* ── the foot: the summary line + the buttons ── */
  const foot = h('div', { className: 'ms-tty-foot' },
    h('button', { className: 'ms-tty-btn danger', onClick: handleBack, title: frame === 'room' ? 'Back into the room' : 'Back' }, frame === 'room' ? '◂ STEP AWAY' : '◂ BACK'),
    h('div', { className: 'ms-tty-sum' },
      h('small', null, 'CROSSING ON FILE'),
      h('b', null, gm.label + ' ', h('i', null, '· on '), mp.name),
      h('span', null,
        h('em', { className: 'gold' }, boardSizeLabel), ' · ', h('em', null, teamDisplay), ' · ', h('em', null, rounds + ' ROUNDS'), ' · ',
        h('em', null, winLabel.toUpperCase()), ' · ', h('em', null, 'VS CPU'),
        training && ' · ', training && h('em', { className: 'green' }, '⚡ TRAINING'),
        caseNo && ' · ', caseNo && ('CASE ' + caseNo)
      )
    ),
    h('div', { className: 'ms-tty-spacer' }),
    h('span', { className: 'ms-tty-prompt' }, '> ', h('b', null, 'file ' + (isSite ? '--site' : '--any') + ' --mode ' + gm.id + (mp.isDelta ? ' --delta' : '')), h('span', { className: 'ms-tty-cursor' })),
    !isSite && h('button', { className: 'ms-tty-btn', onClick: handleRandomize, title: 'Let the Department assign the site' }, 'RANDOMIZE'),
    h('button', { className: 'ms-tty-btn primary' + (filed ? ' filed' : ''), onClick: handleConfirm, title: DOOR ? 'File the crossing' : undefined },
      h('b', null, isSite ? 'FILE THE CROSSING' : 'CONFIRM'), h('i', null, '↵'),
      /* the FILED stamp thunks onto the form (styles-base.css .door-stamp.thunk) */
      filed && h('span', { className: 'ms-tty-filed' }, h(DoorStamp, { text: 'FILED', tone: 'admit', size: 'lg', style: { animation: 'doorThunk 0.45s cubic-bezier(0.2, 1.4, 0.3, 1) forwards', opacity: 0 } }))
    )
  );

  /* ── the monitor ── */
  return h('div', { className: 'ms-crt ms-crt-' + frame + ' ms-crt-' + variant },
    h('div', { className: 'ms-crt-bezel' },
      h('div', { className: 'ms-crt-glass' },
        h('div', { className: 'ms-crt-screen' }, h('div', { className: 'ms-tty' }, head, body, foot)),
        h('div', { className: 'ms-crt-scan' }),
        h('div', { className: 'ms-crt-glare' })
      ),
      h('div', { className: 'ms-crt-label' }, 'D.O.O.R. · ' + consoleLabel + ' · TTY-1 · DO NOT UNPLUG'),
      h('div', { className: 'ms-crt-brand' }, 'ENTROPY DATA SYSTEMS'),
      h('div', { className: 'ms-crt-led' })
    )
  );
}

/* ── mounting: one React root per host (the page, the building's console) ── */
const _msRoots = {};

/* opts: { host: 'modePage' | 'hqTerminal', variant: 'full' | 'site' | null,
   frame: 'page' | 'room', pre: the crossing record (else window._hqPreselect) } */
window._mountReactMatchSelect = function(opts) {
  opts = opts || {};
  const hostId = opts.host || 'modePage';
  const container = document.getElementById(hostId);
  if (!container) return false;
  if (!_msRoots[hostId]) _msRoots[hostId] = ReactDOM.createRoot(container);
  _msRoots[hostId].render(h(MatchSelect, {
    variant: opts.variant || null,
    frame: opts.frame || (hostId === 'modePage' ? 'page' : 'room'),
    pre: opts.pre || null,
    hostId: hostId,
  }));
  return true;
};

window._unmountReactMatchSelect = function(hostId) {
  hostId = hostId || 'modePage';
  if (_msRoots[hostId]) {
    _msRoots[hostId].unmount();
    delete _msRoots[hostId];
  }
};

window._refreshReactMatchSelect = function(hostId) {
  hostId = hostId || 'modePage';
  if (_msRoots[hostId]) _msRoots[hostId].render(h(MatchSelect, { frame: hostId === 'modePage' ? 'page' : 'room' }));
};

})();
