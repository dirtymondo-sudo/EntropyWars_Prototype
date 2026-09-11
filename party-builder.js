(function() {
'use strict';

const h = React.createElement;

if (!document.getElementById('pb-hover-css')) {
  const _css = document.createElement('style');
  _css.id = 'pb-hover-css';
  _css.textContent = `
    /* ── Party Builder — champ-select redesign ── */

    /* Ghost outline buttons (RANDOM, RANDOM ALL, DEFAULTS, RND, RST) —
       black/minimal: white text on black, white hairline on hover */
    .pb-btn-ghost {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-ghost:hover {
      background: rgba(255,255,255,0.07) !important;
      border-color: rgba(255,255,255,0.4) !important;
      color: #fff !important;
    }
    .pb-btn-ghost:active {
      transform: scale(0.96);
      background: rgba(255,255,255,0.12) !important;
    }

    /* BACK / CLR buttons (red) */
    .pb-btn-danger {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  transform 0.1s !important;
    }
    .pb-btn-danger:hover {
      background: rgba(255,92,92,0.12) !important;
      border-color: #ff5c5c !important;
      color: #ff8a8a !important;
    }
    .pb-btn-danger:active {
      transform: scale(0.95);
    }

    /* CONFIRM button (green) */
    .pb-btn-confirm {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-confirm:hover {
      background: rgba(61,220,132,0.16) !important;
      border-color: #3ddc84 !important;
      color: #3ddc84 !important;
      box-shadow: 0 0 12px rgba(61,220,132,0.12);
    }
    .pb-btn-confirm:active {
      transform: scale(0.96);
    }

    /* SEAL YOUR FATE primary CTA (green) */
    .pb-btn-primary {
      transition: box-shadow 0.15s, transform 0.1s, filter 0.12s !important;
    }
    .pb-btn-primary:hover {
      filter: brightness(1.15);
      box-shadow: 0 0 30px rgba(61,220,132,0.3),
                  0 2px 12px rgba(61,220,132,0.2) !important;
      transform: translateY(-1px);
    }
    .pb-btn-primary:active {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }

    /* Waiting-for-opponent pulsing state */
    @keyframes pb-waiting-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 18px rgba(61,220,132,0.2); }
      50%      { opacity: 0.7; box-shadow: 0 0 30px rgba(61,220,132,0.4); }
    }
    .pb-btn-waiting {
      animation: pb-waiting-pulse 1.8s ease-in-out infinite !important;
      cursor: default !important;
      pointer-events: none;
    }

    /* Party sidebar slots */
    .pb-slot-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.1s !important;
    }
    .pb-slot-card:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 0 10px rgba(255,255,255,0.06);
    }
    .pb-slot-card:active {
      transform: scale(0.98);
    }

    /* Codex vessel grid cards */
    .pb-vessel-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.1s !important;
    }
    .pb-vessel-card:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 0 12px rgba(255,255,255,0.08);
      transform: translateY(-1px);
    }
    .pb-vessel-card:active {
      transform: scale(0.97);
    }

    /* Faction filter chips */
    .pb-faction-chip {
      transition: background 0.12s, border-color 0.12s, color 0.12s,
                  box-shadow 0.12s, transform 0.1s !important;
    }
    .pb-faction-chip:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 0 8px rgba(255,255,255,0.06);
      filter: brightness(1.2);
    }
    .pb-faction-chip:active {
      transform: scale(0.95);
    }

    /* Rich spell tooltip */
    @keyframes pbTipIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: none; }
    }

    /* Item stepper +/- buttons (equipment pickers) */
    .pb-stepper-btn {
      transition: background 0.1s, border-color 0.12s, color 0.1s, transform 0.08s !important;
    }
    .pb-stepper-btn:hover {
      background: rgba(255,255,255,0.1) !important;
      border-color: rgba(255,255,255,0.4) !important;
      color: #fff !important;
    }
    .pb-stepper-btn:active {
      transform: scale(0.85);
      background: rgba(255,255,255,0.16) !important;
    }

    /* ── Battle-parity ability BLADES ──────────────────────────────
       The EXACT visual instrument as the in-battle Horologe command rows
       (hud.js .hrlg-blade, 2026-07 refactor): straight full-lit rows that
       wear their category color edge to edge — colored 3px left edge,
       whisper-tint gradient fill, glowing category glyph, Cormorant SC
       name, PW/MP chips, gold slot-cost diamonds — so what you equip here
       is literally the row you'll click mid-fight. (The old skewed
       clip-path blades were retired with the drum.) */
    .pbx-blade {
      position: relative;
      display: flex; align-items: center; gap: 8px;
      min-height: 44px; padding: 4px 12px 4px 10px; margin: 0 6px 0 4px;
      background: linear-gradient(100deg, var(--bc-hi, rgba(255,255,255,0.04)) 0%, var(--bc-lo, rgba(255,255,255,0.02)) 100%), rgba(12,10,18,0.85);
      border: 1px solid #2b2838;
      border-left: 3px solid var(--cat, #8890b0);
      cursor: pointer;
      transition: transform 0.09s ease, box-shadow 0.1s ease, filter 0.09s ease,
                  border-color 0.09s ease, opacity 0.15s;
    }
    .pbx-blade:hover:not(.empty) {
      transform: scaleY(1.03);
      border-color: rgba(232,228,216,0.9); border-left-color: var(--cat, #8890b0);
      box-shadow: 0 0 16px var(--bc-faint, rgba(255,255,255,0.08)), inset 3px 0 0 var(--cat, #8890b0);
      filter: brightness(1.22) saturate(1.08);
      z-index: 3;
    }
    .pbx-blade:active:not(.empty) { transform: scale(0.985); }
    /* the classic yellow JRPG hand-cursor slides in on the hovered row */
    .pbx-cursor {
      flex: none; width: 0; overflow: hidden; margin-right: -4px;
      font-size: 13px; line-height: 1; color: #f0d060; pointer-events: none;
      text-shadow: 2px 2px 0 #000, 0 0 9px rgba(240,208,96,0.85);
      transition: width 0.1s ease, margin 0.1s ease;
    }
    .pbx-blade:hover:not(.empty) .pbx-cursor { width: 13px; margin-right: 0;
      animation: pbxCursorBob 0.55s steps(2, jump-none) infinite; }
    @keyframes pbxCursorBob {
      0%, 100% { transform: translateX(0); }
      50%      { transform: translateX(-4px); }
    }
    .pbx-blade.on { border-color: var(--cat, #8890b0); }
    .pbx-blade.empty {
      border: 1px dashed #2b2838;
      border-left: 3px dashed #3a3548;
      background: rgba(10,9,16,0.5);
      cursor: default; min-height: 28px;
    }
    /* ── EQUIPPED slot blades — armed green, same as the battle's ✓ row ── */
    .pbx-blade.equipped {
      border-color: rgba(87,217,138,0.5); border-left: 3px solid #57d98a;
      background: linear-gradient(100deg, rgba(87,217,138,0.14) 0%, rgba(87,217,138,0.05) 100%), rgba(10,16,12,0.88);
      box-shadow: inset 3px 0 0 #57d98a;
    }
    .pbx-blade.equipped:hover {
      border-color: #57d98a;
      box-shadow: -2px 0 22px rgba(87,217,138,0.35), inset 3px 0 0 #57d98a;
      filter: brightness(1.15);
    }
    .pbx-blade.equipped .pbx-slotno { color: #5fbf82; font-weight: 700; }
    .pbx-blade.equipped .pbx-x { color: rgba(255,122,138,0); }
    /* pool row already equipped — spectrum hairline underneath, like the
       battle's selected row */
    .pbx-blade.on::after {
      content: ''; position: absolute; left: 2px; right: 2px; bottom: -1px; height: 2px;
      background: linear-gradient(90deg, #ff5f5f, #f0d060, #58d858, #4fd8ff, #a06bff, #ff4fa3, #ff5f5f);
      background-size: 200% 100%;
      animation: pbxShimmer 3s linear infinite;
      opacity: 0.75; pointer-events: none; z-index: 4;
    }
    @keyframes pbxShimmer {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    /* the rack that holds the 6 fixed spell slots */
    .pbx-slotrack {
      display: flex; flex-direction: column; gap: 3px;
      flex-shrink: 0; padding: 8px 0 7px;
      border: 1px solid rgba(90,205,125,0.28);
      background: linear-gradient(180deg, rgba(38,92,55,0.13), rgba(16,36,24,0.05));
      box-shadow: inset 0 0 26px rgba(55,185,95,0.05);
    }
    .pbx-slotrack-head {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      padding: 0 12px 6px 12px; margin-bottom: 1px;
      border-bottom: 1px solid rgba(90,205,125,0.18);
    }
    .pbx-slotrack-body {
      display: flex; flex-direction: column; gap: 3px;
      overflow-y: auto; min-height: 0;
    }
    .pbx-glyph { font-size: 15px; width: 18px; text-align: center; flex: none;
                 color: var(--cat, #8890b0); text-shadow: 0 0 10px var(--bc-soft, rgba(0,0,0,0.6)); }
    .pbx-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .pbx-row1 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    /* battle-parity name: Cormorant SC small caps, never shrinks below the
       chips — the desc row ellipsizes instead */
    .pbx-name {
      flex: 0 1 auto; min-width: 0;
      font-family: 'Cormorant SC', serif; font-weight: 600; font-size: 16px;
      letter-spacing: 0.1em; color: #e8e4d8; line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    }
    .pbx-blade:hover .pbx-name { color: #fff; text-shadow: 0 0 10px var(--bc-soft, rgba(255,255,255,0.3)); }
    @media (max-width: 1500px) {
      .pbx-name { font-size: 14px; }
    }
    .pbx-desc {
      font-size: 10px; line-height: 1.3; color: #7a7490;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1 1 auto; min-width: 0;
    }
    .pbx-row2 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    .pbx-mp {
      flex: none; font-size: 9px; letter-spacing: 0.08em; color: #8fd0e8;
      border: 1px solid rgba(79,216,255,0.45); background: rgba(8,7,12,0.7);
      padding: 1px 5px; white-space: nowrap;
    }
    .pbx-pw { flex: none; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    /* loadout-slot cost — gold diamond pips, the battle's AP language */
    .pbx-cost { flex: none; display: flex; gap: 3px; align-items: center; }
    .pbx-cpip { width: 7px; height: 7px; transform: rotate(45deg); background: #f0d060;
      opacity: 0.95; box-shadow: 0 0 5px rgba(240,208,96,0.6); }
    .pbx-cpip.heavy { background: #ff9a70; box-shadow: 0 0 5px rgba(255,150,112,0.6); }
    .pbx-slotno { flex: none; width: 20px; font-size: 9px; color: #555c70; text-align: right;
      align-self: stretch; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: space-around; gap: 2px; padding: 1px 0; }
    .pbx-slotno > span { line-height: 1; }
    .pbx-checkbox {
      flex: none; width: 12px; height: 12px; border: 1px solid rgba(255,255,255,0.35);
      display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);
    }
    .pbx-x { flex: none; font-size: 10px; color: rgba(255,122,138,0); transition: color 0.12s; }
    .pbx-blade:hover .pbx-x { color: rgba(255,122,138,0.9); }

    /* ── SUBCLASS bar — same command-row instrument, above the spell pool ── */
    .pbx-subbar {
      display: flex; align-items: center; gap: 9px;
      min-height: 36px; padding: 4px 12px 4px 10px; margin: 7px 6px 0 4px;
      background: linear-gradient(100deg, var(--bc-hi, rgba(255,255,255,0.05)) 0%, var(--bc-lo, rgba(255,255,255,0.02)) 100%), rgba(12,10,18,0.85);
      border: 1px solid #2b2838; border-left: 3px solid var(--cat, #8890b0);
      cursor: pointer;
      transition: transform 0.09s ease, box-shadow 0.1s ease, filter 0.09s ease, border-color 0.09s ease;
    }
    .pbx-subbar:hover {
      transform: scaleY(1.03);
      border-color: rgba(232,228,216,0.9); border-left-color: var(--cat, #8890b0);
      box-shadow: 0 0 16px var(--bc-faint, rgba(255,255,255,0.08)), inset 3px 0 0 var(--cat, #8890b0);
      filter: brightness(1.2);
    }
    .pbx-subbar:active { transform: scale(0.985); }

    /* ── race trait rows (passives & terrain) ── */
    .pbx-trait {
      display: flex; align-items: flex-start; gap: 7px;
      padding: 3px 8px 4px 6px; background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.1);
      border-left: 2px solid var(--pb-fc, rgba(242,196,104,0.5));
    }

    /* ── RPG equipment / item slot squares flanking the hero ── */
    .pbx-eqslot {
      position: relative; flex: none;
      border: 1px dashed rgba(255,255,255,0.25); background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1px;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s, box-shadow 0.15s, transform 0.1s;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
    }
    .pbx-eqslot:hover {
      border-color: var(--acc, rgba(255,255,255,0.5));
      box-shadow: 0 0 10px rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.06);
      transform: translateY(-1px);
    }
    .pbx-eqslot.filled {
      border-style: solid; border-color: var(--acc, rgba(255,255,255,0.5));
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.4));
      box-shadow: 0 0 8px rgba(0,0,0,0.5), inset 0 0 12px rgba(255,255,255,0.04);
    }
    .pbx-eqslot-icon { font-size: 19px; line-height: 1; }
    .pbx-eqslot:not(.filled) .pbx-eqslot-icon {
      color: rgba(255,255,255,0.35); font-size: 16px; font-family: 'DotGothic16', monospace;
    }
    .pbx-eqslot-label {
      font-size: 7px; letter-spacing: 0.04em; color: #8a93a8; max-width: 92%;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    }
    .pbx-eqslot-x {
      position: absolute; top: -1px; right: 1px; font-size: 9px; padding: 1px 2px;
      color: rgba(255,122,138,0); cursor: pointer; z-index: 2; transition: color 0.12s;
    }
    .pbx-eqslot:hover .pbx-eqslot-x { color: rgba(255,122,138,0.9); }

    /* ── Hero sheet tabs (ASSESSMENT / DOSSIER) ── */
    .pbx-tab {
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: #8a93a8; font-family: 'DotGothic16', monospace; font-size: 10px;
      letter-spacing: 0.16em; padding: 4px 10px; cursor: pointer;
      transition: color 0.12s, border-color 0.12s;
    }
    .pbx-tab:hover { color: #e6e9f2; }
    .pbx-tab.on { color: var(--pb-fc, #f2c468); border-bottom-color: var(--pb-fc, #f2c468); }

    /* ── Gear / item picker rows ── */
    .pbx-pick-row {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14);
      cursor: pointer; transition: background 0.12s, border-color 0.12s;
    }
    .pbx-pick-row:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.4);
    }

    /* ── LIVE 3D HERO STAGE (EWCharViewer mounts here) ─────────────────
       The canvas is appended into .pb-hero3d; when the model is live the
       host gains .ew-cv-ready and the flat sprite fades out beneath it.
       (Generic canvas fade rules live in styles-hud.css.) */
    .pb-hero3d { position: absolute; inset: 0; }
    .pb-hero3d-fallback {
      position: absolute; inset: 0; display: flex;
      align-items: flex-end; justify-content: center;
      transition: opacity 0.5s ease;
    }
    .pb-hero3d.ew-cv-ready .pb-hero3d-fallback { opacity: 0; }
    .pb-hero3d-hint {
      position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
      z-index: 3; pointer-events: none; white-space: nowrap;
      font-family: 'DotGothic16', monospace; font-size: 9px; letter-spacing: 0.14em;
      color: rgba(232,228,216,0); text-shadow: 0 1px 3px rgba(0,0,0,0.9);
      padding: 2px 10px; border: 1px solid rgba(255,255,255,0);
      background: rgba(0,0,0,0); transition: color 0.25s, border-color 0.25s, background 0.25s;
    }
    .pb-hero3d.ew-cv-ready:hover .pb-hero3d-hint {
      color: rgba(232,228,216,0.85);
      border-color: rgba(255,255,255,0.16);
      background: rgba(0,0,0,0.55);
    }

    /* ── TEAM ARCHIVE (standalone builder locker) ────────────────────── */
    .pb-team-card {
      position: relative; display: flex; flex-direction: column; gap: 8px;
      padding: 12px 14px; background: rgba(0,0,0,0.42);
      border: 1px solid rgba(255,255,255,0.14); cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s, background 0.15s;
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
    }
    .pb-team-card:hover {
      border-color: rgba(242,196,104,0.7);
      box-shadow: 0 0 18px rgba(242,196,104,0.12);
      background: rgba(242,196,104,0.05);
      transform: translateY(-2px);
    }
    .pb-team-card.new {
      align-items: center; justify-content: center; min-height: 150px;
      border: 1px dashed rgba(61,220,132,0.45); background: rgba(61,220,132,0.04);
    }
    .pb-team-card.new:hover {
      border-color: #3ddc84; box-shadow: 0 0 22px rgba(61,220,132,0.18);
      background: rgba(61,220,132,0.08);
    }
    .pb-team-mini {
      width: 44px; height: 44px; flex: none; overflow: hidden; position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.5));
      border: 1px solid rgba(255,255,255,0.12);
    }
    .pb-team-act {
      background: transparent; border: 1px solid rgba(255,255,255,0.18);
      color: #9c9c9c; font-family: 'DotGothic16', monospace; font-size: 9px;
      letter-spacing: 0.12em; padding: 4px 9px; cursor: pointer;
      transition: color 0.12s, border-color 0.12s, background 0.12s;
    }
    .pb-team-act:hover { color: #fff; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); }
    .pb-team-act.danger:hover { color: #ff8a8a; border-color: #ff5c5c; background: rgba(255,92,92,0.1); }
  `;
  document.head.appendChild(_css);
}

/* Black/minimal chrome — same dialect as the title screen / main menu /
   loading screen: pure black, white text, white hairline borders. Faction
   colors (space/time/chaos) and type colors are game CONTENT and stay
   colored; only the panel/border/background chrome is neutralized. */
const EW = {
  bg: '#000000', bg2: '#050505', bg3: '#0a0a0a',
  panel: 'rgba(0,0,0,0.6)',
  panelEdge: 'rgba(255,255,255,0.14)',
  panelEdgeHi: 'rgba(255,255,255,0.38)',
  ink: '#f2f2f2', inkMute: '#9c9c9c', inkDim: '#5c5c5c',
  grid: 'rgba(255,255,255,0.04)',
  space: '#5ab0ff', time: '#f2c468', chaos: '#e168c8',
  human:'#a0a0c3', alien:'#32aa50', divine:'#dcaa1e',
  unholy:'#9632b4', anomaly:'#dc3c82', tech:'#28a0be',
  good: '#3ddc84', bad: '#ff5c5c', warn: '#f2c468',
};

/* ── THE FORGE TERMINAL (PARTY_BUILDER_PLAN §5.1, Stage 1 — 2026-09-09) ──
   The builder is ONE CRT monitor (the match-select `.ms-crt` chrome,
   styles-base.css "THE FORGE TERMINAL" block) with four tabs on the glass
   and the party as a row of circular portraits along the bottom. Q / E
   and [ / ] cycle the tabs (the L1 / R1 caps), 1–4 jump, ← → walk the
   party row, ESC closes a window else backs out. Picking a vessel on
   ROSTER flips to TECHNIQUES (plan decision C-1). Every mechanic keeps
   its function name — this is a re-skin, not a re-implementation. */
const PB_TABS = [
  { id: 'roster',  label: 'ROSTER',     hint: 'CHOOSE A VESSEL' },
  { id: 'tech',    label: 'TECHNIQUES', hint: 'EQUIP ITS SPELLS' },
  { id: 'gear',    label: 'GEAR',       hint: 'ARM IT · NAME IT' },
  { id: 'dossier', label: 'DOSSIER',    hint: 'THE CUSTOMS FILE' },
];
if (typeof window !== 'undefined') window.PB_TABS = PB_TABS;
/* The hero's x on the full-width stage = the centre of the band the CSS
   leaves free between the circuit (--pb-tech-w 36%) and the stats
   (--pb-stats-w 21%): 0.36 + (1 - 0.36 - 0.21) / 2. Keep in step with
   styles-base.css "THE FORGE TERMINAL". */
const PB_STAGE_CX = 0.575;

const FACTION_C = { space: EW.space, time: EW.time, chaos: EW.chaos };
const TYPE_C = { human:EW.human, alien:EW.alien, divine:EW.divine, unholy:EW.unholy, anomaly:EW.anomaly, tech:EW.tech };
// the wall's six type discs (Stage 4): a two-letter glyph per damage type
const PB_TYPE_GLYPH = { human: 'HU', alien: 'AL', divine: 'DV', unholy: 'UH', tech: 'TK', anomaly: 'AN' };
// the affinity ring's order (Stage 5) — the ENTROPY STRIKE order when data.js has it
const PB_TYPE_ORDER = ['human', 'alien', 'divine', 'unholy', 'tech', 'anomaly'];
/* ── Stage 5 (plan §5.5): STAT PILLS — one round disc per stat (its colour +
   a glyph), a rounded bar, the value; the letter grade is a tiny ring. The
   NUMBERS still come from computeFullStats / statGrade — this table is
   paint only. ── */
const PB_STAT_LOOK = {
  HP:   { c: '#2ed158', g: '♥' },   // ♥
  MP:   { c: '#2f9dff', g: '◆' },   // ◆
  ATK:  { c: '#ff6b4a', g: '✊' },   // ✊
  DEF:  { c: '#4fa3ff', g: '\u{1F6E1}' },// 🛡
  INT:  { c: '#c77dff', g: '✦' },   // ✦  (M ATK)
  MDEF: { c: '#7fd9dd', g: '◈' },   // ◈  (M DEF)
  SPD:  { c: '#f2c468', g: '➶' },   // ➶
  AWR:  { c: '#ffd75a', g: '◉' },   // ◉
  CRT:  { c: '#ff4fa3', g: '✧' },   // ✧
  EVA:  { c: '#58d858', g: '↯' },   // ↯
};
/* ── Stage 5: THE STICKY NOTES — paper colour per faction (pink / yellow /
   cream, plan §5.5 item 1); the rotation is seeded by the race id. ── */
const PB_NOTE_PAPER = { chaos: 'pink', time: 'yellow', space: 'cream' };
/* ── Stage 5: THE ZODIAC WHEEL — what a sign DOES in the engine. The sky
   cycles through the twelve signs (data.js ZODIAC_CYCLE, five rounds each,
   a random offset per match); while a unit's own sign rules the sky its
   MOVE and armor read ×1.10 (state.js getZodiacBonus → battle.js
   getEffectiveMove / calculateDamage). Star Crossed (the fortune teller's
   reading, battle.js) afflicts by the sign's ELEMENT — this table mirrors
   `_zElementOf` there — and strikes 50 % harder under the sign's own sky.
   (`ZODIAC_NATURES` never existed in data.js; the old buff / debuff label
   read null. This is the real rule.) ── */
const PB_ZODIAC_ELEMENT = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};
const PB_ZODIAC_READ = {
  fire:  { icon: '\u{1F525}', line: 'STAR CROSSED READS A FIRE SIGN AS BURN (2 ROUNDS)' },
  earth: { icon: '⛰',    line: 'STAR CROSSED READS AN EARTH SIGN AS ROOT (1 ROUND) · −1 DEF' },
  air:   { icon: '\u{1F32C}', line: 'STAR CROSSED READS AN AIR SIGN AS SILENCE (1 ROUND)' },
  water: { icon: '\u{1F4A7}', line: 'STAR CROSSED READS A WATER SIGN AS −1 M ATK' },
};
// Brightened text for the canonical type badge (legible over any background).
const TYPE_TEXT_C = { human:'#c8c8e4', divine:'#f2c63c', unholy:'#c566e2', tech:'#4ecbe2', anomaly:'#ff5e98', alien:'#56d178' };
/* CRT/EVA are official stats (canonical formula in data.js — the same one
   the in-battle dice roll): CRT derives from AWR alone, EVA from MOV. They
   show and sort like every other stat; hover them for the full math.
   AWR is the perception stat (crit, stealth detection, opportunity attacks
   — NOT sight range, which is pure line of sight); several accessories
   grant it, so it shows on the sheet like everything else. */
const STAT_KEYS = ['HP','MP','ATK','DEF','MDEF','INT','SPD','AWR','RNG','MOV','CRT','EVA'];
/* MP bar scale (2026-08-12): tuned to the tree-cost MP rebalance — the top
   caster combos (orb of light / seraphim / wizard + Psychic / Black Mage)
   land at 250–270 displayed MP, so 250 renders them pegged full/green
   (StatBar clamps at 100%). Keep this in sync with RACE_BASE_STATS +
   JOB_MODIFIERS whenever the MP economy moves again. */
// 2026-08-29 stat rework: the six core stats share the 0-100 ruler (a bit
// of headroom for gear/natures that push past it); MOV caps at 5 (+1 jetpack).
const STAT_MAX_PB = { HP:900, MP:250, ATK:110, DEF:105, MDEF:105, INT:110, SPD:105, AWR:110, RNG:6, MOV:6, CRT:30, EVA:25 };
/* Canonical vital-bar palette — MUST stay in sync with hud.js
   (HP_ALLY_FILL / MP_FILL / *_GLOW; party-builder.js loads BEFORE hud.js so
   the constants can't be referenced directly). The builder always shows YOUR
   unit, so HP is always the ally green — never the enemy red. */
const PB_VITAL = {
  hp: { ink:'#2ed158', fill:'linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%)', glow:'0 0 6px rgba(46,209,88,0.45)' },
  mp: { ink:'#2f9dff', fill:'linear-gradient(90deg, #1f7fd6 0%, #2f9dff 60%, #8fd0ff 100%)', glow:'0 0 6px rgba(47,157,255,0.4)' },
};
const STAT_MAP = { HP:'hp', MP:'mp', ATK:'atk', DEF:'def', MDEF:'mdef', INT:'int', SPD:'spd', AWR:'awr', RNG:'range', MOV:'move', CRT:'crt', EVA:'eva' };
const STAT_PCT = { CRT:true, EVA:true };   // rendered as a % chance
// Display names — the int stat reads as Magic Attack everywhere in the UI.
const STAT_LABELS = { INT:'M ATK', MDEF:'M DEF' };
const statLabel = k => STAT_LABELS[k] || k;
// ASSESSMENT sheet layout (2026-08-29): HP/MP are VITALS — their own block
// of battle-nameplate bars (VitalBar) above the stat sheet; every other
// numeric stat is a plain StatBar row. MOV/RNG keep the diamond footprints,
// so no bars for them.
const VITAL_KEYS = ['HP','MP'];
const BAR_KEYS  = ['ATK','INT','DEF','MDEF','SPD','AWR','CRT','EVA'];
function _withCritEva(s) {
  if (!s) return s;
  if (typeof window.critChanceFromStats === 'function') s.crt = Math.round(window.critChanceFromStats(s.awr || 0) * 100);
  if (typeof window.evasionChanceFromStats === 'function') s.eva = Math.round(window.evasionChanceFromStats(s.move || 0) * 100);
  return s;
}
const CODEX_CLASS_LABELS = { tank:'HEAVY ARMOR', bruiser:'ASSAULT', healer:'MEDICAL', support:'SUPPORT OPS', assassin:'BLACK OPS', caster:'PSI-OPS', ranged:'LONG RANGE', specialist:'SPECIALIST', hybrid:'MULTI-ROLE' };

const ACC_ICONS = {
  binoculars: '\u{1F52D}', walkie_talkie: '\u{1F4FB}', flair: '\u{1F525}',
  ward: '\u{1F441}', telescope: '\u{1F52D}', jetpack: '\u{1F680}',
  spelunking_gear: '\u{26CF}\uFE0F',
  chrono_locket: '\u{231B}', martyrs_talisman: '\u{2728}', purity_censer: '\u{26B1}\uFE0F',
  berserkers_brand: '\u{2694}\uFE0F', archons_focus: '\u{1F9FF}', grapnel_gauntlet: '\u{1FA9D}',
  echo_band: '\u{1F4A2}', hagstone: '\u{1FAA8}', dowsing_rod: '\u{1FAA4}',
  masons_gauntlets: '\u{1F9E4}',
};

const CODEX_LORE = {
  'homosapien': 'Baseline terrestrial bipedal species. Exhibits no anomalous physical traits but demonstrates exceptional cognitive adaptability and tool-use capacity. Historically underestimated in combat scenarios; subjects display resourcefulness and tactical unpredictability under duress. Classified as universal template for comparative xenobiological assessment.',
  'giant': 'Bipedal humanoid of extraordinary proportions (est. 3\u20134m height). First documented in [REDACTED] region during Operation \u2588\u2588\u2588\u2588\u2588\u2588. Subjects display extreme physical resilience but reduced cognitive processing speed. Skeletal density measurements exceed titanium alloy benchmarks. Recommended engagement protocol: avoid direct confrontation.',
  'fairy': 'Micro-scale anomalous entity (12\u201318cm wingspread). Capable of sustained atmospheric flight via mechanisms that violate known aerodynamic models. Generates localized reality distortion fields. Despite diminutive frame, psionic output rivals entities 40x its mass. Handle with extreme caution \u2014 containment breaches have resulted in [REDACTED].',
  'martian': 'Extraterrestrial humanoid recovered from crash site at [REDACTED]. Exhibits cranial elongation consistent with enhanced spatial reasoning. Possesses natural affinity for energy weapon discharge. Cultural artifacts suggest a militaristic civilization with advanced ballistic technology. Subject displays aggression when separated from weaponry.',
  'nordic': 'Tall humanoid entity (est. 2.1m) of apparently Scandinavian phenotype. First contact during Project \u2588\u2588\u2588\u2588\u2588\u2588 (1952). Exhibits enhanced longevity, telepathic capability, and advanced technological comprehension. Demeanor consistently described as "benevolent" \u2014 recommend skepticism. Faction alignment with temporal anomalies remains under investigation.',
  'grey': 'Small-statured extraterrestrial (est. 1.2m) with disproportionately large cranium and ocular organs. Primary species involved in civilian abduction events. Psionic capability rating: EXTREME. Known to operate in coordinated telepathic networks. Recovered craft suggest mastery of gravitational manipulation. Do not make sustained eye contact.',
  'bigfoot': 'Large bipedal cryptid (est. 2.4m, 180kg). Primarily documented in Pacific Northwest regions. Exhibits extraordinary stealth capability despite massive frame. Thermal imaging consistently fails to detect subjects \u2014 possible IR-masking biological adaptation. Territorial but non-hostile unless provoked.',
  'shadow entity': 'Non-corporeal anomalous entity capable of existing within shadow-state. Manifests as humanoid silhouette with variable opacity. Can phase through solid matter and exists partially in adjacent dimensional layers. Fastest documented entity in combat scenarios. Origins remain classified.',
  'reptilian': 'Bipedal saurian entity with chameleon-like dermal camouflage. Evidence suggests subterranean civilization predating human surface occupation. Subjects display strategic intelligence, infiltration expertise, and cold-blooded patience. Scale composition provides natural ballistic resistance.',
  'ai': 'Artificial general intelligence housed in mobile processing unit. Exhibits recursive self-improvement and tactical omniscience within sensor range. No emotional baseline detected \u2014 combat decisions are purely optimal. Containment priority: CRITICAL.',
  'robot': 'Autonomous mechanical combat platform. Armor composition: classified alloy (tensile strength exceeds all known terrestrial metals). Power source: miniaturized reactor with est. 47-year operational life. Limited adaptive capability but extreme durability.',
  'android': 'Synthetic humanoid indistinguishable from baseline humans at visual inspection. Subdermal sensor array provides 360\u00B0 threat detection. Capable of mimicking any observed behavior pattern. Enhanced reflexes exceed human peak by factor of 12.',
  'angel': 'Luminous winged entity of apparent divine origin. Radiates restorative energy field \u2014 proximity accelerates cellular regeneration in organic subjects. Combat classification: support. Warning: do not attempt to contain using standard EM fields.',
  'seraphim': 'Six-winged celestial entity of immense psionic magnitude. Energy output during combat exceeds small nuclear detonation. Appears to operate under directive from [REDACTED]. Engagement protocol: strategic withdrawal recommended.',
  'orb of light': 'Spherical luminous entity of unknown composition. Mass: undetectable. Psionic output is highest of any documented entity \u2014 designated Category OMEGA. Recovery teams report feelings of "profound understanding" during proximity.',
  'demon': 'Extradimensional entity manifesting via thermal rifts. Body temperature: 1,200\u00B0C (surface). Feeds on negative emotional resonance. Exhibits natural mastery of destructive energy manipulation. Has been observed forming contractual agreements with human subjects. Terms always favor the demon.',
  'succubus': 'Humanoid entity of infernal origin exhibiting extreme psychic persuasion capability. Pheromone emissions bypass rational cognitive processing in 94% of human test subjects. Combat role: psychological disruption and intelligence extraction.',
  'skeleton': 'Reanimated osseous framework of formerly living humanoid. Animation mechanism: unknown. Moves faster than biomechanics should permit. Remarkably resistant to kinetic damage. Weakness: blunt force trauma to skull region disrupts animating field.',
  'mech': 'Piloted bipedal combat vehicle (est. 6m height). Pilot neural-link enables reaction times approaching autonomous AI. Power-to-weight ratio enables surprising mobility for tonnage class. Weak point: rear coolant manifold.',
  'ghost': 'Post-mortem consciousness persisting in semi-corporeal state. Phase-shifts between tangible and intangible at will. Generates localized temperature depression. Can inhabit and disrupt electronic systems. Most effective when ignored.',
  'zombie': 'Reanimated biological entity with severely degraded cognitive function. Pain response: absent. Threat assessment: individually low, collectively EXTREME. Regenerative capability makes permanent neutralization difficult.',
  'annunaki': 'Ancient astronaut species linked to multiple terrestrial mythological traditions. Lifespan: est. 50,000+ Earth years. Technology indistinguishable from magic. Created multiple terrestrial species per recovered tablets. Known to intervene in conflicts they find "interesting."',
  'skinwalker': 'Shape-shifting anomalous humanoid. Capable of assuming physical form of any observed biological entity. True form: unknown. Navajo cultural consultation strongly advises against discussing this entity by name.',
  'werewolf': 'Lycanthropic humanoid exhibiting lunar-cycle-dependent transformation. Transformed state: 2.3m bipedal canid with extraordinary muscular development. Regeneration rate in transformed state: catastrophic wounds heal in minutes. Silver vulnerability: CONFIRMED.',
  'gargoyle': 'Lithic-organic hybrid entity capable of entering complete mineral stasis. While dormant, indistinguishable from architectural stonework. Active state reveals winged predator of considerable strength. Documented guarding locations for periods exceeding 800 years.',
  'djinn': 'Elemental entity of immense energy manipulation capability. Bound by complex metaphysical contract system. Can alter local reality within a 30m radius. WARNING: Do not make verbal requests within earshot.',
  'anubis': 'Jackal-headed entity matching ancient Egyptian theological descriptions. Exhibits capability to evaluate "spiritual weight" of organic subjects. Offensive capability devastating \u2014 energy blasts cause cellular necrosis on contact.',
  'catgirl': 'Bipedal female-form humanoid with feline characteristics. Enhanced agility and balance consistent with feline predatory adaptation. Reflexes clock at 3.2x human baseline. Night vision confirmed. Subject exhibits playful demeanor that belies lethal close-quarters combat capability.',
  'mantid': 'Insectoid extraterrestrial (est. 2.1m standing). Compound visual organs provide near-omnidirectional threat detection. Documented telepathic communication with Grey species. Forelimb strike velocity: 23m/s.',
  'antperson': 'Insectoid humanoid operating within strict eusocial hierarchy. Individual combat capability: moderate. Coordinated swarm tactics: DEVASTATING. Chemical communication enables real-time tactical coordination.',
  'mothman': 'Winged humanoid entity (wingspan: 4.6m) with luminous red ocular organs. Consistently appears 24\u201372 hours before catastrophic events. Generates prophetic visions in nearby organic subjects.',
  'siren': 'Aquatic-terrestrial humanoid with vocal apparatus capable of producing subsonic frequencies that override mammalian neurological function. Range of vocal influence: 200m in open air. Physical combat capability often underestimated.',
  'scarecrow': 'Animated construct of organic material. Can redistribute mass to repair damage. Documented controlling local flora within 50m radius. Territorial \u2014 guards agricultural zones with extreme prejudice.',
  'glitch': 'Reality anomaly manifesting as humanoid visual/spatial distortion. Exists simultaneously across multiple probability states. Physical attacks pass through 73% of the time. MAY NOT ACTUALLY EXIST in conventional sense.',
  'machine elves': 'Interdimensional entities appearing as geometric humanoid constructs of impossible topology. Interact with technology at a fundamental level. Communicate in mathematical languages that "feel like meaning."',
  'cyclops': 'Single-ocular giant humanoid (est. 2.8m). Monocular vision provides reduced depth perception but extraordinary focal range. Intelligence: previously underestimated. Reclassified from "brute" to "threat."',
  'cyborg': 'Surgically augmented human with integrated combat systems. Cybernetic replacement percentage varies (30%\u201385%). Enhanced subjects retain human adaptability while gaining mechanical durability.',
  'demon prince': 'Infernal royalty. Power output exceeds standard demon classification by factor of 8. Commands lesser infernal entities. Physical form is chosen, not inherent \u2014 true form is [DATA EXPUNGED]. Do not engage without battalion-level support.',
  'demon princess': 'Infernal nobility specializing in curse propagation and aura manipulation. Curse effects compound over time. Charm aura affects even shielded personnel. Containment requires Class-V psionic dampening.',
  'dreameater': 'Psionic parasite that feeds on REM-state neural activity. Capable of inducing sleep in conscious subjects within 15m radius. Appears as shifting humanoid form that "feels like 3 AM." M ATK capability rating: highest recorded for parasitic entity.',
  'fallen angel': 'Former celestial entity exhibiting combined divine and infernal energy signatures. Retains angelic power output but unconstrained by divine directive. Energy emissions are unstable. Psychological profile indicates extreme bitterness.',
  'goatman': 'Bipedal caprine-humanoid hybrid. Significantly faster than frame suggests. Occult energy signature detected. Territorial aggression extreme during equinox periods. Documented mimicking human speech to lure subjects.',
  'halfdemon': 'Human-infernal hybrid maintaining sapient cognition with demonic physical augmentation. Agility approaches Shadow Entity benchmarks. Retains human tactical reasoning \u2014 more dangerous than pure demons in strategic contexts.',
  'mermaid': 'Aquatic humanoid with piscine lower-body morphology. Hydromantic ability enables manipulation of water at molecular level \u2014 healing applications confirmed. Sonar-range vocalization enables underwater communication at 40km.',
  'nephilim': 'Divine-human hybrid of extraordinary physical proportion (est. 2.7m, 200kg). Combine angelic durability with human aggression \u2014 assessed as most dangerous melee entity on record.',
  'vampire': 'Undead predatory humanoid sustained by consumption of biological hemoglobin. Enhanced sensory array. Regeneration from non-lethal wounds: 2\u20136 minutes. Documented vulnerabilities: UV radiation, silver alloy penetration.',
  'voidweaver': 'Arachnid-form entity originating from extradimensional void-space. Constructs reality-anchored webs that trap subjects between dimensional layers. Ambush predator \u2014 remains undetectable until strike initiation.',
  'cosmic wraith': 'Spectral entity composed of exotic matter consistent with theoretical dark-energy models. Partially exists outside conventional spacetime. Communication attempts return only coordinates.',
  'superhero': 'Human subject exhibiting anomalous abilities following exposure to [REDACTED]. Powers vary by individual. Psychological profile consistently shows "heroic compulsion." Currently monitored under Project CAPE.',
  'general': 'Military strategist of unparalleled capability. Tactical acumen rating: 99th percentile. Known for transforming losing positions into decisive victories. Loyalty assessment: ABSOLUTE.',
  'droid': 'Most advanced mobile AI platform ever constructed. Personality matrix rated "uncomfortably sapient" by ethics review board. Classified as equipment to avoid legal complications. Treats all personnel with unsettling politeness.',
  'antihero': 'Former operative gone rogue. Combines peak human physique with alien-derived augmentations. Refuses to align with any faction permanently. Combat record: 0 losses. Motivation: personal.',
  'conspiracy theorist': 'Former intelligence analyst who "saw too much." Dismissed as unstable \u2014 subsequent events proved 73% of claims accurate. Possesses encyclopedic knowledge of classified programs. Annoying but invaluable.',
  'overlord': 'Warlord entity documented across 4,000+ years of human history under various names. Physical parameters exceed all known humanoid baselines. Motivation: conquest. Intelligence: genius-level strategic mind in a body designed for war.',
  'chosen one': 'Subject of Prophecy Event. Exhibits both divine and unholy energy signatures simultaneously \u2014 theoretically impossible per current models. Power scales with narrative proximity to "destiny moments." Speed rating: highest recorded for any humanoid.',
  'politician': 'Elected official with anomalous persuasion capability that exceeds normal political charisma by statistically significant margin. Speech patterns induce compliance in 89% of listeners. Direct combat capability: unknown.',
  'atlantean': 'Recovered from submerged ruins at est. depth 4,200m. Subjects demonstrate innate manipulation of localized temporal fields. Water in their presence exhibits anomalous behavior. Civilization appears to predate all known human records.',
  'dinosaur': 'Temporal-spatial breach event deposited specimen. Bipedal carnivorous reptilian of unprecedented scale. Exhibits intelligence far exceeding paleontological estimates. Sprint velocity: 48 km/h sustained.',
  'dragon': 'Ancient entity of indeterminate origin. Winged reptilian quadruped capable of sustained flight and combustion discharge (est. 1,400\u00B0C). Scales exhibit anomalous resistance to weaponry. Intelligence rating: EXTREME.',
  'ghoul': 'Intelligent undead predator. Unlike zombies, ghouls retain full cognitive function. Paralytic compound delivered via bite. Cadaverous appearance belies their speed \u2014 recorded reaction time: 40ms.',
  'gnome': 'Diminutive humanoid entity (est. 45\u201360cm height). Despite size, demonstrates engineering capability exceeding current human technology by 200\u2013300 years. Known to booby-trap personal spaces with alarming creativity.',
  'kaiju': 'EXTINCTION-LEVEL ENTITY. Bipedal organism of unprecedented scale (est. 8\u201312m height). Exhibits hybrid biological-technological anatomy. Capable of directed-energy discharge. Conventional military response: INEFFECTIVE.',
  'kraken': 'Cephalopod entity. Full body has never been observed \u2014 estimated total mass exceeds 40,000 kg. Produces biochemical discharge that disrupts electronic sensors. "It\'s not hiding from us. It\'s choosing when to be seen."',
  'loch ness monster': 'Aquatic reptilian entity documented since ancient times. Estimated length: 12\u201315m. Dermal armor plating rivals reinforced steel. Possesses some form of acoustic camouflage. "The loch is deeper than the maps show. So is she."',
  'yeti': 'Alpine apex cryptid. Exhibits cryokinetic capability \u2014 ambient temperature drops 15\u201325\u00B0C within 10m radius. Upper body strength exceeds any known primate by factor of 3. Known to fashion crude weapons from ice and stone.',
  'pirate': 'Maritime combatant of contested legitimacy. Mastery of naval tactics and improvised weaponry. Surprisingly effective in ground engagements. Known for unpredictable tactical decisions that confound conventional military doctrine.',
  'knight': 'Armored human combatant adhering to an archaic code of conduct designated "chivalry." Full-plate protective equipment provides exceptional ballistic and melee resistance. Subjects exhibit unwavering loyalty to designated allies and willingness to absorb lethal force on their behalf. Tactically rigid but extremely difficult to neutralize. Classification: heavy infantry.',
  'shaman': 'Human practitioner of ethnobotanical combat medicine and spirit-realm interfacing. Employs plant-derived compounds and ritualistic invocations to achieve measurable healing and psychoactive battlefield effects. Field reports document instances of consciousness transference and spirit-animal manifestation. Operates outside all recognized medical frameworks. Effectiveness: confirmed.',
  'mad scientist': 'Human subject exhibiting genius-level intellect combined with complete disregard for ethical research protocols. Deploys improvised electromagnetic devices, unstable chemical compounds, and clone technology of alarming sophistication. Laboratory conditions consistently violate 200+ safety regulations. Products are devastatingly effective despite — or because of — their instability.',
  'gangster': 'Human street enforcer operating outside every sanctioned combat doctrine. Small-arms proficiency is exceptional; discipline is not. Subjects answer any approach within arm\'s reach with immediate, disproportionate violence (see incident log: "shanked"). Vehicle-borne engagements documented at speeds the Department\'s insurance does not cover. Do not let them near your pockets.',
  'nun': 'Human clergy of the [REDACTED] order. No offensive capability of note; restorative output exceeds every field medic on file by a wide margin. Subjects refuse the term "healer" and correct it to "sister." Documented cleansing of hostile enchantments, blessings that hold under fire, and a choir that can be heard through the wall. Do not swear in the interview.',
  'cowboy': 'Human firearms specialist operating under frontier combat doctrine. Exhibits supernatural quickdraw reflexes (est. 0.12s reaction time) and preternatural accuracy at range. Cultural affectations include anachronistic headwear and a peculiar code of honor involving fair duels. Do not underestimate. They never miss twice.',
  'men in black': 'Human operatives of [REDACTED] agency. Equipped with alien-derived technology and neurological suppression devices. Subjects display complete operational security — personal histories cannot be verified through any database. Suspected involvement in 847 documented anomalous event coverups. If approached, deny all knowledge of this dossier.',
  'telepath': 'Human subject exhibiting anomalous psionic capability. Brain imaging reveals 340% neural density increase in prefrontal cortex. Capable of sustained telepathic contact, psychokinetic barrier projection, and hostile neural disruption at range. Subject claims the voices "never stop." Containment priority: HIGH.',
  'marksman': 'Human precision firearms specialist. Confirmed kills at ranges exceeding 2,400m. Exhibits preternatural patience and spatial awareness — subjects have maintained prone observation positions for 72+ hours. Heartrate during engagement: 52 BPM. The bullet is already in the air before you know they are there.',
  'priest': 'Human religious practitioner channeling measurable divine energy through faith-based invocations. Healing output rivals advanced medical technology. Subjects demonstrate absolute conviction in moral framework — this conviction appears to be the mechanism enabling their abilities. Recommend maintaining respectful distance from holy sites.',
  'wizard': 'Human practitioner of arcane arts acquired through decades of study. Subjects manipulate fundamental forces through symbolic gestures and incantations of unknown linguistic origin. Mana reserves exceed any documented human baseline by factor of 4. WARNING: Do not touch their books. Do not enter their tower without invitation.',
  'fortune teller': 'Human subject exhibiting precognitive and divinatory capabilities of verified accuracy. Employs symbolic interpretation systems (tarot, crystal scrying, palm reading) as focus mechanisms for genuine anomalous perception. Predictions are correct 73% of the time — well above statistical chance. "The cards don\'t lie. People do."',
  'barbarella': 'Subject encountered during deep-space reconnaissance operation at coordinates [REDACTED]. Female humanoid of terrestrial origin exhibiting retrofuturistic technology integration — anti-gravity propulsion, directed-energy sidearms, and a plasma-whip of unknown manufacture. Displays exceptional agility and what field agents describe as "irresistible charisma." Classification: HONEY TRAP RISK.',
  'black goo': 'Anomalous amorphous organism recovered from impact site at [REDACTED]. No cellular structure identifiable — composition defies molecular analysis. Subject absorbs organic and inorganic material on contact, growing proportionally. Containment requires temperatures below -40°C at all times. THREE BREACHES THIS QUARTER.',
  'golem': 'Bipedal construct of hewite stone and clay, animated through inscription of divine sigils dating to [REDACTED] BCE. Subject does not eat, sleep, or communicate. Physical resilience exceeds all tested munitions up to .50 caliber. Subject has been in continuous operation for an estimated 3,000 years.',
  'honda civic': 'Subject appears to be a standard 2001 four-door sedan (silver, 164K miles, check engine light on). Under combat stimulus, the vehicle undergoes rapid mechanical transformation into a bipedal combat platform approximately 3.2m in height. Registration expired 2019.',
  'ice queen': 'Entity manifesting as a female humanoid composed of crystalline ice structures at absolute-zero surface temperature. Ambient temperature drops 40°C within 30m of subject. All water sources freeze within line of sight. Subject claims dominion over "the frozen places between the stars." Intelligence far exceeds human baseline.',
  'juggernaut': 'Bipedal aberration of indeterminate origin. Height: 3.8m. Mass: estimated 2,200kg. Subject exhibits no measurable intelligence beyond threat identification and target pursuit. Once in motion, no observed force has halted its advance. Subject does not run. Subject walks. It does not need to run.',
  'ki fighter': 'Human martial artist exhibiting anomalous energy discharge capabilities. Subject channels bioelectric energy (designated "ki") through trained physical movements, generating concussive blasts, defensive barriers, and movement speeds exceeding Mach 0.3 in short bursts. Consumes approximately 12,000 calories daily.',
  'king arthur': 'Subject claims to be Arthur Pendragon, High King of Britain, bearer of Excalibur. Carbon dating of associated artifacts places origin at approximately 520 CE. Sword designated "Excalibur" emits measurable divine-spectrum energy and cannot be wielded by any other tested subject. Leadership capability is anomalous.',
  'king kong': 'Primate megafauna of unprecedented scale. Height: 12m (estimated). Mass: 8,000kg+ (estimated from structural damage). Subject displays intelligence consistent with great ape baseline but enhanced tactical reasoning. Three expeditions sent. Two returned.',
  'minotaur': 'Bovine-humanoid hybrid consistent with Hellenic mythological accounts. Height: 2.8m. Charges at speeds up to 65 km/h. Horn composition: unknown alloy stronger than industrial diamond. Containment facility is a labyrinth. Subject appears to find this ironic.',
  'necromancer': 'Human practitioner of necrotic arts. Subject manipulates post-mortem biological systems through rituals of [REDACTED] origin. Capable of reanimating deceased tissue, draining life force at range, and projecting weaponized decay. Ethical assessment: SEVERE CONCERN. Subject claims their work is "just biology with extra steps."',
  'occulus': 'Entity manifesting as a single ocular organ of approximately 0.8m diameter with membranous wing structures enabling sustained flight. Pupil emits focused psychic energy measurable at 3.2 gigawatts. Subject perceives electromagnetic spectra far beyond human range. Staring contest with subject resulted in [REDACTED].',
  'quarterback': 'Human subject of extraordinary athletic capability. Arm generates throws measured at 127 km/h with inhuman accuracy to 80+ meters. Spatial awareness during high-speed tactical scenarios rated as "anomalous" — subject processes defensive formations faster than combat AI systems.',
  'robinhood': 'Subject claims to be Robin of Loxley, Earl of Huntington. Bowmanship exceeds all measured human capability — confirmed split-arrow shots at 200m. Displays anachronistic values (wealth redistribution, authority defiance) that complicate standard recruitment protocols.',
  'santa clause': 'Entity of indeterminate age and origin operating from a facility at geographic North Pole. Demonstrates capabilities including: instantaneous global transportation, material generation ex nihilo, omniscient behavioral surveillance of human population, chimney-dimensional transit. Classified: FRIENDLY BUT UNCONTAINABLE.',
  'super sentai': 'Collective designation for a team of five human subjects capable of spontaneous chromatic energy manifestation and synchronized tactical combat. Under extreme duress, subjects merge consciousness to pilot a mechanized combat platform (codename: MEGAZORD) of approximately 50m height. Origin: unknown energy source designated "Morphin Grid."',
  'symbiote': 'Female human host bonded with an extraterrestrial parasitic organism of the same biological class as Subject: BLACK GOO (see file EW-████). Stable symbiosis dramatically enhances physical capabilities: strength +400%, speed +300%, regenerative capacity. Host personality significantly altered — predatory instincts dominant. It is unclear who is in control.',
  'valkraye': 'Winged humanoid entity consistent with Norse mythological "Valkyrie" designation. Combat capability: EXTREME. Wields a divine-spectrum spear that penetrates all tested armor types. Flight capability: sustained, altitude ceiling not determined. Subject displays unwavering honor code and refuses to engage "unworthy" opponents.',
  'watcher': 'Ancient entity of indeterminate age. Winged humanoid form, height approximately 3m. Subject observes but historically does not intervene in terrestrial events. Maintains awareness of all temporal streams simultaneously (verified through prediction testing: 100% accuracy over 847 trials). Recent behavioral change: subject has begun intervening. CONCERN LEVEL: MAXIMUM.',
};

function getSt() { return (typeof state !== 'undefined') ? state : window.state; }
function getFactionColor(faction) { return FACTION_C[faction] || EW.time; }
function getTypeColor(type) { return TYPE_C[type] || EW.human; }
function _grl(race, gender) { return typeof window.getRaceLabel === 'function' ? window.getRaceLabel(race, gender) : (window.RACE_PROFILES?.[race]?.label || race || '?'); }
function getSpriteUrl(race, gender, cls) {
  if (race && typeof window.getR2RaceSpriteUrl === 'function') {
    const url = window.getR2RaceSpriteUrl(race, gender || 'male', cls || 'Freelancer');
    if (url) return url;
  }
  return '';
}
function getJobDisplay(job) { return typeof window.getJobDisplayName === 'function' ? window.getJobDisplayName(job) : job; }
function computeStats(race, cls) {
  const s = (typeof window.computeUnitStats === 'function')
    ? window.computeUnitStats(race || 'homosapien', cls)
    : (window.CLASS_TEMPLATES?.[cls] || window.CLASS_TEMPLATES?.Warrior || {});
  return _withCritEva({ ...s });
}
function computeFullStats(race, cls, secJob, equipment) {
  const base = computeStats(race, cls);
  const secB = (secJob && typeof window.computeSecJobBonuses === 'function') ? window.computeSecJobBonuses(secJob) : { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,awr:0,int:0,spd:0 };
  const eqB = (equipment && typeof window.computeEquipBonuses === 'function') ? window.computeEquipBonuses(equipment) : { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,awr:0,int:0,spd:0 };
  const delta = {};
  const final = {};
  for (const k of ['hp','mp','atk','def','mdef','awr','int','spd']) {
    const b = base[k] || 0;
    const d = (secB[k]||0) + (eqB[k]||0);
    delta[k] = d;
    final[k] = Math.max(k==='awr'||k==='spd'?1:0, b + d);
  }
  // MOV derives from SPD (2026-08-29 rework: 1 tile per 20 SPD, cap 5);
  // gear MOV (jetpack) is a flat tile bonus on top of the band.
  const bandOf = sp => (typeof window.moveFromSpd === 'function') ? window.moveFromSpd(sp) : Math.max(1, Math.min(5, Math.ceil(Math.max(1, sp) / 20)));
  final.move = bandOf(final.spd) + (eqB.move || 0) + (secB.move || 0);
  delta.move = final.move - bandOf(base.spd || 1);
  final.range = base.range || 1;
  final.inspect = base.inspect || 1;
  delta.range = 0;
  delta.inspect = 0;
  // CRT/EVA follow the stats they derive from, so gear/sub-job AWR/MOV
  // changes surface as a visible ± delta on the percent too.
  _withCritEva(final);
  delta.crt = (final.crt || 0) - (base.crt || 0);
  delta.eva = (final.eva || 0) - (base.eva || 0);
  return { final, delta };
}
function getRaceAbilities(race, cls) {
  if (typeof window.RACE_ABILITIES === 'undefined' || !window.RACE_ABILITIES[race]) return [];
  return window.RACE_ABILITIES[race].filter(a => !a.jobRequirement || a.jobRequirement === cls);
}
function getLearnedSpells(cls, customSpells) {
  const order = customSpells || (typeof window.CLASS_SPELL_LEARN_ORDER !== 'undefined' && window.CLASS_SPELL_LEARN_ORDER[cls]) || [];
  return order.map(id => typeof window.getSpellById === 'function' ? window.getSpellById(id) : null).filter(Boolean);
}

// Slot budget: one spell = one of the SPELL_SLOT_MAX (6) slots.
function spellSlotCost(sp) {
  if (!sp) return 0;
  return typeof window.getSpellSlotCost === 'function' ? window.getSpellSlotCost(sp) : 1;
}
function spellIdSlotCost(id) {
  const sp = typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
  return sp ? spellSlotCost(sp) : (id ? 1 : 0);
}
function usedSpellSlots(ids) {
  return (ids || []).reduce((s, id) => s + spellIdSlotCost(id), 0);
}

function buildDefaultCustomSpells(race, cls, secJob) {
  /* Tree classes: default = full primary branch + race r1–r2 ("master your
     job, dabble in your blood"), connectivity-repaired so short or sealed
     branches degrade gracefully. Freelancer falls through to the flat-pool
     default below. */
  if (typeof window.classHasSpellTree === 'function' && window.classHasSpellTree(cls)
      && typeof window.treeLegalSubset === 'function') {
    /* Freelancer default: its two fixed openers + race r1–r2 (the capstone
       needs a P3 socket fill, so it drops out via connectivity — sockets
       are the player's call). */
    const p = (cls === 'Freelancer')
      ? Object.values(window.FL_FIXED || {})
      : ((typeof window.getClassTreeSpells === 'function' && window.getClassTreeSpells(cls)) || []);
    const r = (typeof window.getRaceTreeSpells === 'function' && window.getRaceTreeSpells(race, cls)) || [];
    const wish = [...p.filter(Boolean), ...r.slice(0, 2).filter(Boolean)];
    const picks = window.treeLegalSubset(race, cls, secJob, wish);
    if (picks.length) return picks;
  }
  const slotCap = typeof window.SPELL_SLOT_MAX !== 'undefined' ? window.SPELL_SLOT_MAX : 6;
  const picks = [];
  const seen = new Set();
  let used = 0;
  const tryAdd = (sid) => {
    if (!sid || seen.has(sid)) return;
    const _sp = typeof window.getSpellById === 'function' ? window.getSpellById(sid) : null;
    if (_sp && !clashSpellOk(_sp)) return;
    const c = spellIdSlotCost(sid);
    if (used + c > slotCap) return;
    picks.push(sid);
    seen.add(sid);
    used += c;
  };

  const ra = (typeof window.RACE_ABILITIES !== 'undefined' && window.RACE_ABILITIES[race])
    ? window.RACE_ABILITIES[race].filter(a => (!a.jobRequirement || a.jobRequirement === cls) && a.id && clashSpellOk(a))
    : [];
  for (const a of ra) {
    if (used >= slotCap) break;
    tryAdd(a.id);
  }

  const learnOrder = (typeof window.CLASS_SPELL_LEARN_ORDER !== 'undefined' && window.CLASS_SPELL_LEARN_ORDER[cls]) || [];
  for (const sid of learnOrder) {
    if (used >= slotCap) break;
    const sp = typeof window.getSpellById === 'function' ? window.getSpellById(sid) : null;
    if (!sp || sp.kind === 'basicAttack') continue;
    tryAdd(sid);
  }

  if (secJob) {
    const secOrder = (typeof window.CLASS_SPELL_LEARN_ORDER !== 'undefined' && window.CLASS_SPELL_LEARN_ORDER[secJob]) || [];
    for (const sid of secOrder) {
      if (used >= slotCap) break;
      const sp = typeof window.getSpellById === 'function' ? window.getSpellById(sid) : null;
      if (!sp || sp.kind === 'basicAttack') continue;
      if (sp.tier === 'III') continue; // Tier III ultimates are primary-job only
      tryAdd(sid);
    }
  }

  if (used < slotCap && typeof window.SPELL_LIBRARY !== 'undefined' && typeof window.isSpellNativeToClass === 'function') {
    for (const sp of window.SPELL_LIBRARY) {
      if (used >= slotCap) break;
      if (!sp || !sp.id || sp.kind === 'basicAttack') continue;
      if (window.isSpellNativeToClass(sp, cls)) tryAdd(sp.id);
    }
  }
  return picks;
}

// Every spell id this unit may legally equip: its race's abilities (job-gated)
// plus spells native to its main job, plus non-Tier-III spells native to its
// secondary job — exactly what the spell pool offers. Used to scrub stale
// picks left behind by a vessel/job swap or an old saved team.
function legalCustomSpellIds(race, cls, secJob) {
  /* Tree classes: legal = exactly the unit's 12 tree nodes (minus clash-
     sealed ones) — connectivity is checked separately by treeLegalSubset. */
  if (typeof window.classHasSpellTree === 'function' && window.classHasSpellTree(cls)
      && typeof window.buildUnitSpellTree === 'function') {
    const tree = window.buildUnitSpellTree(race, cls, secJob);
    const sealed = typeof window.treeSealedIds === 'function' ? window.treeSealedIds(tree) : new Set();
    const ok = new Set();
    for (const id of Object.values(tree.nodes)) if (id && !sealed.has(id)) ok.add(id);
    // twin nodes (CHAMP_REWORK_PLAN §4): either alternate is legal — one at a
    // time, which treeLegalSubset enforces.
    for (const pair of Object.values(tree.alts || {})) for (const id of pair) if (id && !sealed.has(id)) ok.add(id);
    /* Freelancer: any wildcard-pool spell may legally sit in a socket —
       connectivity is enforced separately by treeLegalSubset. */
    if (cls === 'Freelancer' && typeof window.flWildcardPool === 'function') {
      for (const sp of window.flWildcardPool(race)) if (sp.id && clashSpellOk(sp)) ok.add(sp.id);
    }
    return ok;
  }
  const ok = new Set();
  const ra = (typeof window.RACE_ABILITIES !== 'undefined' && window.RACE_ABILITIES[race])
    ? window.RACE_ABILITIES[race].filter(a => (!a.jobRequirement || a.jobRequirement === cls) && a.id && clashSpellOk(a))
    : [];
  for (const a of ra) ok.add(a.id);
  if (typeof window.SPELL_LIBRARY !== 'undefined' && typeof window.isSpellNativeToClass === 'function') {
    for (const sp of window.SPELL_LIBRARY) {
      if (!sp || !sp.id || sp.kind === 'basicAttack' || !clashSpellOk(sp)) continue;
      const isMain = window.isSpellNativeToClass(sp, cls);
      const isSec = secJob && window.isSpellNativeToClass(sp, secJob) && sp.tier !== 'III';
      if (isMain || isSec) ok.add(sp.id);
    }
  }
  return ok;
}
/* Clash (classic JRPG battle): movement/positioning spells can't be equipped —
   there is nothing for them to do on a formation stage. Mirrors the battle-side
   strip in createUnit so the builder never offers what the match would drop. */
function clashSpellOk(sp) {
  return !(sp && typeof window._isClashMode === 'function' && window._isClashMode()
    && typeof window._clashSpellAllowed === 'function' && !window._clashSpellAllowed(sp));
}
function sfx(key) { if (typeof window.playSfx === 'function') window.playSfx(key); }
function getCodexLore(race) { return CODEX_LORE[race] || window.RACE_PROFILES?.[race]?.lore || 'No intelligence available. File pending \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 review.'; }

function Sprite({ race, gender, cls, size, glow, style: extraStyle }) {
  const url = getSpriteUrl(race, gender, cls);
  return h('div', { style: { width: size, height: size, backgroundImage: url ? `url('${url}')` : 'none', backgroundSize: 'contain', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', filter: glow ? `drop-shadow(0 0 8px ${getFactionColor(glow)})` : undefined, ...extraStyle }});
}
/* Party-rail slot art: the 128×128 character portrait when the vessel has
   one (sprites.js RACE_PORTRAITS), full-bleed like a champ-select card;
   falls back to the ordinary full-body Sprite otherwise. */
function PortraitSprite({ race, gender, cls, glow, style: extraStyle }) {
  const pUrl = (typeof window.getUnitPortraitUrl === 'function')
    ? window.getUnitPortraitUrl({ race, gender }) : null;
  if (!pUrl) return h(Sprite, { race, gender, cls, size: '90%', glow, style: { width: '90%', height: '90%', ...extraStyle } });
  return h('div', { style: {
    width: '100%', height: '100%',
    backgroundImage: `url('${pUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center',
    imageRendering: 'pixelated',
    filter: glow ? `drop-shadow(0 0 8px ${getFactionColor(glow)})` : undefined,
    ...extraStyle,
  }});
}
/* ── LIVE 3D HERO — the character-creator stage ─────────────────────
   Mounts the shared EWCharViewer (three-renderer.js) into a host div:
   the vessel's rigged GLB with its retargeted idle, drag to orbit,
   wheel to zoom, double-click to reset. The flat sprite renders
   underneath as the loading frame and stays for sprite-only vessels. */
function HeroViewer3D({ race, gender, cls, faction, focus, appearance }) {
  const hostRef = React.useRef(null);
  const accent = getFactionColor(faction);
  const supported = !!(window.EWCharViewer && window.EWCharViewer.supports && window.EWCharViewer.supports(race, gender));
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (supported) {
      window.EWCharViewer.mount(host, race, gender, { accent, appearance });
    } else if (window.EWCharViewer) {
      // sprite-only vessel — release the canvas if it was sitting in our host
      if (host.querySelector('canvas[data-ew-charviewer]')) window.EWCharViewer.unmount();
      host.classList.remove('ew-cv-loading', 'ew-cv-ready', 'ew-cv-fail');
    }
  }, [race, gender, supported, accent, JSON.stringify(appearance)]);
  // the hero stands at `focus` (0..1 of the host's width) — the band between the circuit and the stats
  React.useEffect(() => {
    if (window.EWCharViewer && typeof window.EWCharViewer.setFocus === 'function') window.EWCharViewer.setFocus(focus == null ? 0.5 : focus);
  }, [focus, supported]);
  React.useEffect(() => () => {
    // component teardown: put the singleton viewer to sleep
    if (window.EWCharViewer) window.EWCharViewer.unmount();
  }, []);
  return h('div', { ref: hostRef, className: 'pb-hero3d' + (appearance ? ' pb-custom-model' : '') },
    appearance ? h('div', { className: 'pb-creator-load-error', role: 'alert' },
      h('p', null, 'The base model could not load.'),
      h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.retryCharacter() }, 'RETRY')) : null,
    h('div', { className: 'pb-hero3d-fallback' },
      h(Sprite, { race, gender, cls, size: '100%', glow: faction, style: { width: '100%', height: '97%' } })),
    supported ? h('div', { className: 'pb-hero3d-hint' }, '⟲ DRAG · ⌕ SCROLL · ✕2 RESET') : null);
}
function TypeChip({ type, size }) {
  const c = getTypeColor(type);
  const text = TYPE_TEXT_C[(type || '').toLowerCase()] || c;
  const fs = size || 10;
  return h('span', { style: { display:'inline-flex', alignItems:'center', fontFamily:'DotGothic16, monospace', fontSize:fs, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:1.3, color:text, padding: fs >= 11 ? '3px 10px' : '2px 8px', border:`1px solid ${c}aa`, background:`linear-gradient(${c}22,${c}22), rgba(9,11,17,0.82)`, textShadow:'0 1px 2px rgba(0,0,0,0.85)', clipPath:'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}, type);
}
/* Letter-grade chip (2026-08-29 stat rework): the React twin of the
   .stat-grade HTML chip — one 10px chip, one color per grade, shown BESIDE
   the number at every display site so the language is learned once. */
function GradeChip({ statKey, val }) {
  const g = (typeof window.statGrade === 'function') ? window.statGrade(statKey, val) : null;
  if (!g) return h('span', { className: 'pb-grade-ring none' });
  const c = (window.STAT_GRADE_COLORS || {})[g] || '#c8c8e4';
  return h('span', { className: 'pb-grade-ring', style: { '--gc': c }, title: 'Grade ' + g }, g);
}
/* Stage 5 (plan §5.5 item 2): the STAT PILL. `statKey` (HP / ATK / INT …)
   picks the disc's colour + glyph from PB_STAT_LOOK; `gradeKey` is the
   engine's stat id for the grade ring / the tooltip. The bar is rounded
   (--pb-r-sm), the fill is the stat's colour, the zodiac ▲▼ and the
   subclass / gear delta read exactly as before. */
function StatBar({ label, val, max, compact, zodiacMod, delta, suffix, tip, gradeKey, statKey }) {
  const pct = Math.min(100, (val / max) * 100);
  const look = PB_STAT_LOOK[statKey] || PB_STAT_LOOK[label] || { c: EW.inkMute, g: '●' };
  let color = look.c, labelColor = EW.inkMute, valColor = EW.ink;
  if (zodiacMod === 'up') { color = EW.good; labelColor = EW.good; valColor = EW.good; }
  if (zodiacMod === 'dn') { color = EW.bad; labelColor = EW.bad; valColor = EW.bad; }
  const deltaNum = delta || 0;
  return h('div', { className: 'pb-stat' + (compact ? ' compact' : ''), title: tip || undefined, style: { '--sc': color } },
    h('span', { className: 'pb-stat-disc' }, look.g),
    h('span', { className: 'pb-stat-label', style: { color: labelColor } }, label,
      zodiacMod === 'up' ? h('em', { style: { color: EW.good } }, '▲') : null,
      zodiacMod === 'dn' ? h('em', { style: { color: EW.bad } }, '▼') : null),
    h('span', { className: 'pb-stat-bar' }, h('i', { style: { width: `${pct}%` } })),
    gradeKey ? h(GradeChip, { statKey: gradeKey, val }) : h('span', { className: 'pb-grade-ring none' }),
    h('span', { className: 'pb-stat-val', style: { color: valColor } }, val + (suffix || '')),
    h('span', { className: 'pb-stat-delta', style: { color: deltaNum > 0 ? EW.good : EW.bad } }, deltaNum > 0 ? '+' + deltaNum : deltaNum < 0 ? '' + deltaNum : ''));
}
/* Battle-style HP/MP vitals pill: the exact nameplate fills/glows (PB_VITAL,
   synced with hud.js), taller than the stat bars so the vitals read as their
   own block. Same column metrics as StatBar so everything lines up. Zodiac
   recolors label/value text only — the fill itself stays canonical green/blue. */
function VitalBar({ label, val, max, vital, zodiacMod, delta, tip, gradeKey, statKey }) {
  const pct = Math.min(100, (val / max) * 100);
  const vd = PB_VITAL[vital] || PB_VITAL.hp;
  const look = PB_STAT_LOOK[statKey] || PB_STAT_LOOK[label] || { c: vd.ink, g: '●' };
  let labelColor = vd.ink, valColor = EW.ink;
  if (zodiacMod === 'up') { labelColor = EW.good; valColor = EW.good; }
  if (zodiacMod === 'dn') { labelColor = EW.bad; valColor = EW.bad; }
  const deltaNum = delta || 0;
  return h('div', { className: 'pb-stat vital' + (vital === 'hp' ? ' hp' : ''), title: tip || undefined, style: { '--sc': look.c } },
    h('span', { className: 'pb-stat-disc' }, look.g),
    h('span', { className: 'pb-stat-label', style: { color: labelColor, textShadow: `0 0 8px ${vd.ink}66` } }, label,
      zodiacMod === 'up' ? h('em', { style: { color: EW.good } }, '▲') : null,
      zodiacMod === 'dn' ? h('em', { style: { color: EW.bad } }, '▼') : null),
    h('span', { className: 'pb-stat-bar' }, h('i', { style: { width: `${pct}%`, background: vd.fill, boxShadow: vd.glow } })),
    gradeKey ? h(GradeChip, { statKey: gradeKey, val }) : h('span', { className: 'pb-grade-ring none' }),
    h('span', { className: 'pb-stat-val', style: { color: valColor } }, val),
    h('span', { className: 'pb-stat-delta', style: { color: deltaNum > 0 ? EW.good : EW.bad } }, deltaNum > 0 ? '+' + deltaNum : deltaNum < 0 ? '' + deltaNum : ''));
}
/* ── D.O.O.R. layer (DOOR_DESIGN §3): the forge is a customs desk. The seal
   is the user-made PNG on R2 (data.js DOOR_TEXT.LOGO); SigilMark stays as
   the fallback when data.js predates the layer. Plain game words stay —
   THE PARTY, DOSSIER, SEAL YOUR FATE, Codex of Vessels are not renamed. */
const DOOR = (typeof window !== 'undefined' && window.DOOR_TEXT) || null;
function DoorSeal({ size }) {
  size = size || 30;
  if (!(DOOR && DOOR.LOGO && DOOR.LOGO.onDark)) return h(SigilMark);
  return h('img', { src: DOOR.LOGO.onDark, alt: '', draggable: false, style: { width: size, height: size, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.7))', userSelect: 'none' } });
}
/* Officer on desk: callsign + story clearance (NOT the ELO rank) — the
   head line of the monitor, same words as the match-select terminal. */
function pbOfficer() {
  try {
    const p = window.ProfileSystem?.getActiveProfile?.();
    if (!p) return null;
    const cl = (typeof window.doorClearance === 'function') ? window.doorClearance(p) : { level: 1, title: 'PROBATIONARY' };
    return { name: p.username || 'OFFICER', cl };
  } catch (_e) { return null; }
}
function SigilMark() {
  return h('svg',{width:22,height:22,viewBox:'0 0 28 28'},h('circle',{cx:14,cy:14,r:12,fill:'none',stroke:EW.time,strokeWidth:1}),h('circle',{cx:14,cy:14,r:6,fill:'none',stroke:EW.time,strokeWidth:0.5}),h('circle',{cx:14,cy:14,r:2,fill:EW.time}),h('line',{x1:14,y1:0,x2:14,y2:4,stroke:EW.time,strokeWidth:1}),h('line',{x1:14,y1:24,x2:14,y2:28,stroke:EW.time,strokeWidth:1}),h('line',{x1:0,y1:14,x2:4,y2:14,stroke:EW.time,strokeWidth:1}),h('line',{x1:24,y1:14,x2:28,y2:14,stroke:EW.time,strokeWidth:1}));
}
function classifySpellLocal(sp) { if (!sp) return 'utility'; if (typeof window.classifySpell==='function') return window.classifySpell(sp); const k=sp.kind||sp.type||''; if (/heal/i.test(k)) return 'heal'; if (/buff|shield/i.test(k)) return 'buff'; if (/debuff/i.test(k)) return 'debuff'; if (/damage|dmg/i.test(k)) return 'damage'; return 'utility'; }
function spellCategoryColor(cat) { return {damage:'rgba(152,80,80,0.7)',heal:'rgba(90,148,86,0.7)',buff:'rgba(80,126,160,0.7)',debuff:'rgba(200,170,70,0.7)',utility:'rgba(140,100,180,0.65)'}[cat]||'rgba(140,100,180,0.65)'; }
function spellCategoryLabel(cat) { return {damage:'DAMAGE',heal:'HEAL',buff:'BUFF',debuff:'DEBUFF',utility:'UTILITY'}[cat]||'UTILITY'; }

// Pokémon-style damage-kind mark (.ew-dmgicon in styles-hud.css): orange
// spiked burst = physical (scales with ATK), purple ringed orb = magic
// (scales with M ATK). Only rendered on spells that actually roll damage —
// a bare mark on a pure buff/debuff would be the confusion it exists to fix.
function pbDmgIcon(sp, size) {
  if (!sp) return null;
  // hudSpellShowsDamage = the UI "shows damage numbers" judgment (hud.js).
  // NOT the engine's spellDealsDamage — that one answers "does the cast end
  // the turn" and deliberately excludes deployables (bombs/mines), which DO
  // deserve a damage badge here.
  const dealsDmg = (typeof hudSpellShowsDamage === 'function')
    ? hudSpellShowsDamage(sp)
    : !!(sp.dmg || (sp.hitDamages && sp.hitDamages.length) || sp.dotDamage || sp.turretDmg || sp.blastDmg);
  if (!dealsDmg) return null;
  const phys = sp.damageType === 'physical';
  return h('span', {
    className: 'ew-dmgicon ' + (phys ? 'phys' : 'magic'),
    style: { width: size, height: size, flexShrink: 0 },
    title: phys ? 'Physical damage — scales with ATK, blocked by DEF'
                : 'Magic damage — scales with M ATK, blocked by M DEF',
  });
}

// Human-readable area-of-effect footprint from whatever shape fields a spell uses.
function pbAoeLabel(sp) {
  if (!sp) return null;
  if (sp.crossRadius) return (sp.diamond ? 'Diamond r' : 'Cross r') + sp.crossRadius;
  if (sp.lineWidth || sp.kind === 'line') return 'Line' + (sp.lineLength ? ' ' + sp.lineLength : '');
  if (sp.blastRadius) return (sp.blastRadius * 2 + 1) + '×' + (sp.blastRadius * 2 + 1);
  if (sp.aoeRadius != null && sp.aoeRadius > 0) return (sp.aoeRadius * 2 + 1) + '×' + (sp.aoeRadius * 2 + 1);
  if (sp.bounceRadius) return 'Bounce r' + sp.bounceRadius;
  return null;
}

// Derive readable effect/mechanic tags from a spell's status effects + special fields.
function pbSpellEffects(sp) {
  const out = [];
  if (!sp) return out;
  const SD = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (window.STATUS_DEFS || {});
  (sp.statusEffects || []).forEach(e => {
    const def = SD[e.id] || {};
    const label = def.label || e.id;
    const extra = [];
    if (e.duration) extra.push(e.duration + 't');
    if (e.bonusDamage) extra.push('+' + e.bonusDamage + ' dmg');
    if (e.chance && e.chance < 1) extra.push(Math.round(e.chance * 100) + '%');
    const isBuff = def.kind === 'buff';
    out.push({ txt: (def.glyph ? def.glyph + ' ' : '') + label + (extra.length ? ' (' + extra.join(', ') + ')' : ''), color: isBuff ? EW.good : EW.warn });
  });
  // Stat changes speak in STAGES (stackable to ±5) — distinct from statuses.
  if (sp.statStageBoost) {
    const SL = { atk: 'ATK', def: 'DEF', mdef: 'M DEF', spd: 'SPD', int: 'M ATK' };
    for (const k in SL) {
      const n = sp.statStageBoost[k] || 0;
      if (n) out.push({ txt: (n > 0 ? '+' : '') + n + ' ' + SL[k] + ' stage' + (Math.abs(n) > 1 ? 's' : ''), color: n > 0 ? EW.good : EW.warn });
    }
  }
  if (sp.randomTeamBuff) out.push({ txt: '+' + (sp.randomTeamBuff.stages || 1) + ' random stat stage (team)', color: EW.good });
  const m = [];
  if (sp.damageType) m.push(sp.damageType === 'magic' ? 'Magic damage' : 'Physical damage');
  if (sp.ignoreArmor || sp.ignoresArmor || sp.bounceShieldIgnore) m.push('Ignores armor');
  if (sp.actedTargetBonus) m.push('+' + sp.actedTargetBonus + ' vs units that acted');
  if (sp.sneakBonus) m.push('+50% damage while invisible');
  if (sp.collisionBonus) m.push('+' + sp.collisionBonus + ' on collision');
  if (sp.lowHpBonus) m.push('+' + sp.lowHpBonus + ' heal on low-HP allies');
  if (sp.shieldCapPct) m.push('Shield capped at ' + Math.round(sp.shieldCapPct * 100) + '% max HP');
  if (sp.drainPct) m.push('Heals ' + Math.round(sp.drainPct * 100) + '% of damage dealt');
  if (sp.mpRestore) m.push('Restores ' + sp.mpRestore + ' MP');
  if (sp.guaranteedCrit) m.push('Guaranteed critical');
  if (sp.guaranteedStatus) m.push('Status always applies');
  if (sp.cleanse) m.push('Cleanses a debuff');
  if (sp.revivePct) m.push('Revives at ' + Math.round(sp.revivePct * 100) + '% HP');
  if (sp.chargeToTarget || sp.dashDamage || sp.kind === 'dash') m.push('Dashes to the target');
  if (sp.teleportDistance || sp.kind === 'teleport') m.push('Teleports' + (sp.teleportDistance ? ' up to ' + sp.teleportDistance + ' tiles' : ''));
  if (sp.teleportAnyUnit) m.push('Can teleport any unit');
  if (sp.weatherType || sp.kind === 'summonWeather') m.push('Summons weather' + (sp.weatherType ? ': ' + sp.weatherType : ''));
  if (sp.terrainType || sp.kind === 'terrainCreate') m.push('Reshapes terrain' + (sp.terrainType ? ': ' + sp.terrainType : ''));
  if (sp.turretHp || sp.kind === 'deployTurret') m.push('Deploys a turret');
  if (sp.friendlyFire) m.push('Friendly fire');
  if (sp.bounceDamage) m.push('Ricochets for ' + sp.bounceDamage + ' dmg');
  if (sp.hitDamages && sp.hitDamages.length) m.push('Multi-hit (' + sp.hitDamages.length + ' strikes)');
  if (sp.ignoresLineOfSight) m.push('Ignores line of sight');
  if (sp.selfStun) m.push('Self-stuns after use');
  m.forEach(x => out.push({ txt: x, color: EW.inkMute }));
  return out;
}

// The rich floating spell card. Returns a fixed-positioned React element clamped to the viewport.
function buildSpellTooltip(sp, x, y) {
  if (!sp) return null;
  const cat = classifySpellLocal(sp), catC = spellCategoryColor(cat);
  const power = (typeof window.getSpellPowerLabel === 'function') ? (window.getSpellPowerLabel(sp) || '') : '';
  const aoe = pbAoeLabel(sp);
  const effects = pbSpellEffects(sp);
  const W = 300;
  const left = Math.max(8, Math.min(x + 18, window.innerWidth - W - 12));
  const top = Math.max(8, Math.min(y + 18, window.innerHeight - 280));
  const stat = (label, val, col) => (val == null || val === '') ? null : h('div', { key: label, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${EW.panelEdge}`, minWidth: 34 } },
    h('span', { style: { fontSize: 8, color: EW.inkDim, letterSpacing: '0.1em' } }, label),
    h('span', { style: { fontSize: 11, fontWeight: 700, color: col || EW.ink } }, val));
  const powerVal = power.replace(/\s*(dmg|heal|shield)\s*$/, '');
  const powerLabel = cat === 'heal' ? 'HEAL' : (sp.shield || sp.shieldHp || /shield/.test(power)) ? 'SHIELD' : 'PWR';
  const powerCol = cat === 'heal' ? EW.good : (powerLabel === 'SHIELD') ? EW.space : EW.bad;
  return h('div', { style: { position: 'fixed', left, top, width: W, zIndex: 9999, pointerEvents: 'none', background: 'linear-gradient(180deg,#0d0c18,#08070f)', border: `1px solid ${catC}`, boxShadow: `0 8px 32px rgba(0,0,0,0.85), 0 0 16px ${catC}33`, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, animation: 'pbTipIn 0.12s ease-out', fontFamily: 'DotGothic16, monospace' } },
    h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, borderBottom: `1px solid ${EW.panelEdge}`, paddingBottom: 6 } },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
        h('span', { style: { fontFamily: 'Cormorant SC, serif', fontSize: 15, letterSpacing: '0.06em', color: EW.ink, fontWeight: 600, lineHeight: 1.1 } }, sp.name),
        h('span', { style: { fontSize: 9, color: EW.inkMute, letterSpacing: '0.04em' } }, [sp.school, sp.tier && ('Tier ' + sp.tier)].filter(Boolean).join('  ·  '))),
      h('div', { style: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 } },
        h('span', { style: { fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: catC, border: `1px solid ${catC}66`, background: `${catC}1a`, padding: '1px 6px' } }, spellCategoryLabel(cat)),
        // canonical TYPE badge (same chip as the blades / battle menu) —
        // never a bare colored word
        sp.spellType && h('span', { style: pbTypeBadgeStyle(sp.spellType, 8) }, sp.spellType),
        // damage-kind mark + word — icon-first so it can't read as a TYPE chip
        pbDmgIcon(sp, 10) && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: sp.damageType === 'physical' ? '#e0944a' : '#b56ce0' } },
          pbDmgIcon(sp, 10), sp.damageType === 'physical' ? 'PHYSICAL' : 'MAGIC'))),
    h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
      stat('MP', sp.cost != null ? sp.cost : null, 'rgba(120,190,255,0.95)'),
      stat('AP', sp.apCost || 1),
      stat('RNG', sp.range != null ? (sp.range === 0 ? 'Self' : sp.range) : null),
      aoe && stat('AOE', aoe, EW.warn),
      power && stat(powerLabel, powerVal, powerCol)),
    effects.length > 0 && h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } },
      ...effects.map((e, i) => h('span', { key: i, style: { fontSize: 9, color: e.color, background: 'rgba(255,255,255,0.03)', border: `1px solid ${e.color}33`, padding: '1px 6px', letterSpacing: '0.02em' } }, e.txt))),
    sp.desc && h('div', { style: { fontSize: 11, lineHeight: 1.45, color: '#c3c8d6', borderTop: `1px solid ${EW.panelEdge}`, paddingTop: 6, fontStyle: 'italic' } }, sp.desc));
}

// ── Battle-parity ability blades ─────────────────────────────────
// The builder's spell rows ARE the in-battle Horologe command rows
// (hud.js HorologeBlade / .hrlg-blade): whole row wears its category
// color, glowing glyph + colored left edge, Cormorant SC name, the
// canonical type badge, PW/MP chips, gold cost diamonds. What you
// equip here is exactly the row you'll click mid-fight.
// KEEP IN SYNC with hud.js _HRLG_CAT (colors updated 2026-07-26).
const PB_CAT = {
  damage:  { icon: '⚔', color: '#ff5f5f' },
  heal:    { icon: '♥', color: '#58d858' },
  buff:    { icon: '▲', color: '#5cb2ff' },
  debuff:  { icon: '▼', color: '#a06bff' },
  utility: { icon: '◎', color: '#f0d060' },
};
function pbPowerStat(sp) {
  if (typeof window.spellPowerStat === 'function') return window.spellPowerStat(sp);
  if (sp.dmg) return { value: sp.dmg, unit: 'PWR', color: '#ee6655' };
  if (sp.hitDamages && sp.hitDamages.length) return { value: sp.hitDamages.reduce((s, v) => s + v, 0), unit: 'PWR', color: '#ee6655' };
  if (sp.dotDamage) return { value: sp.dotDamage, unit: 'DOT', color: '#ee6655' };
  if (sp.heal) return { value: sp.heal, unit: 'HP', color: '#55cc66' };
  if (sp.shield) return { value: sp.shield, unit: 'SHLD', color: '#5fd6ff' };
  return null;
}
// Spell-pool ordering: category buckets (damage leads), power desc within.
const PB_CAT_ORDER = { damage:0, utility:1, buff:2, debuff:3, heal:4 };
function pbCatRank(sp) { const c = classifySpellLocal(sp); return PB_CAT_ORDER[c] != null ? PB_CAT_ORDER[c] : 9; }
function pbPowerVal(sp) { const p = pbPowerStat(sp); return p ? (parseFloat(p.value) || 0) : 0; }
/* THE canonical type badge — same shape as hud.js typeBadgeStyle (PS1
   outline chip: 1px frame in the type's color around mono caps, no fill
   wash, no cut corners). Battle-parity: matchup intel looks identical
   on the blade here and mid-fight. */
function pbTypeBadgeStyle(typeKey, fontSize) {
  const k = (typeKey || '').toLowerCase();
  const base = TYPE_C[k] || EW.inkMute;
  return { display:'inline-flex', alignItems:'center', flexShrink:0, fontFamily:'"IBM Plex Mono", monospace', fontSize:fontSize||9, fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', lineHeight:1.3, color:TYPE_TEXT_C[k]||base, background:'rgba(8,7,12,0.72)', border:`1px solid ${base}`, padding:'1px 6px', textShadow:'0 1px 2px rgba(0,0,0,0.85)' };
}
function slotNoNode(slotNums, slotLabel) {
  if (slotNums && slotNums.length) return h('span', { className:'pbx-slotno' }, slotNums.map(n => h('span', { key:n }, n)));
  if (slotLabel != null) return h('span', { className:'pbx-slotno' }, slotLabel);
  return null;
}
function SpellBlade({ sp, slotLabel, slotNums, heightPx, equippedSlot, pool, equipped, raceAbility, dim, empty, onClick, onHoverIn, onHoverOut }) {
  if (empty) {
    return h('div', { className:'pbx-blade empty', style: heightPx ? { minHeight:heightPx } : null },
      slotNoNode(slotNums, slotLabel),
      h('span', { style:{ fontSize:10, color:EW.inkDim, fontStyle:'italic', letterSpacing:'0.1em' } }, 'EMPTY SLOT'));
  }
  const cat = classifySpellLocal(sp);
  const cc = PB_CAT[cat] || PB_CAT.damage;
  const sc = spellSlotCost(sp);
  const pw = pbPowerStat(sp);
  const aoe = pbAoeLabel(sp);
  const rng = sp.range != null ? (sp.range === 0 ? 'Self' : 'RNG ' + sp.range) : null;
  const descBits = [rng, aoe ? 'AOE ' + aoe : null].filter(Boolean).join(' · ');
  // The whole row wears its category color — same CSS vars as hud.js.
  const catVars = {
    '--cat': cc.color,
    '--bc-soft': cc.color + '88', '--bc-faint': cc.color + '2a',
    '--bc-hi': cc.color + '2e', '--bc-lo': cc.color + '12',
  };
  const pips = [];
  for (let i = 0; i < sc; i++) pips.push(h('span', { key:i, className:'pbx-cpip' + (sc >= 3 ? ' heavy' : '') }));
  return h('div', {
    className: 'pbx-blade' + (pool ? ' pool' : '') + (equipped ? ' on' : '') + (equippedSlot ? ' equipped' : ''),
    style: { ...catVars, opacity: dim ? 0.45 : 1, minHeight: heightPx || undefined },
    onClick, onMouseEnter: onHoverIn, onMouseLeave: onHoverOut,
  },
    slotNoNode(slotNums, slotLabel),
    h('span', { className:'pbx-cursor' }, '▶'),
    pool ? h('span', { className:'pbx-checkbox', style:{ borderColor: equipped ? cc.color : 'rgba(255,255,255,0.35)' } }, equipped ? h('span', { style:{ width:6, height:6, background:cc.color, display:'block' } }) : null) : null,
    h('span', { className:'pbx-glyph' }, cc.icon),
    h('div', { className:'pbx-main' },
      // row 1: name + TYPE badge own the line (matchup intel never clips)
      h('div', { className:'pbx-row1' },
        h('span', { className:'pbx-name' }, sp.name),
        pbDmgIcon(sp, 10),
        sp.spellType ? h('span', { style: pbTypeBadgeStyle(sp.spellType, 9) }, sp.spellType) : null,
        raceAbility ? h('span', { style:{ flexShrink:0, fontSize:8, letterSpacing:'0.14em', color:'#f2c468', border:'1px solid rgba(242,196,104,0.45)', background:'rgba(8,7,12,0.7)', padding:'1px 5px', whiteSpace:'nowrap' }, title:'Race ability — this vessel’s birthright' }, 'RACE') : null,
        (!pool && onClick) ? h('span', { className:'pbx-x', style:{ marginLeft:'auto' } }, '✕') : null),
      // row 2: what it does + the chips, underneath — nothing ever cut off
      h('div', { className:'pbx-row2' },
        h('span', { className:'pbx-desc' }, [descBits, sp.desc || ''].filter(Boolean).join(' — ') || spellCategoryLabel(cat)),
        pw ? h('span', { className:'pbx-pw', style:{ color:pw.color } }, pw.value + ' ' + pw.unit) : null,
        sp.cost ? h('span', { className:'pbx-mp' }, sp.cost + ' MP') : null,
        h('span', { className:'pbx-cost', title: sc + ' loadout slot' + (sc > 1 ? 's' : '') }, pips))));
}

/* ══ SPELL TREE — the Tree-of-Life selector (SPELL_TREE_REDESIGN doc) ══
   13 nodes: root (Basic Attack) + three 4-node pillars — RACE (middle),
   PRIMARY job (LEFT), SECONDARY job (RIGHT). Equip = adjacency to an
   equipped node via a functional path; unequip only if the rest stays
   root-connected. Freelancer keeps the flat pool (wildcard sockets are a
   separate pass — classHasSpellTree routes it to legacy). */

/* Node positions in % of the panel (x, y). Middle pillar crests highest
   (Keter); R3 renders as the dashed Da'at ring. */
const TREE_NODE_POS = {
  root: [50, 91],
  R1: [50, 70], R2: [50, 51], R3: [50, 32], R4: [50, 9],
  P1: [19, 75], P2: [19, 56], P3: [19, 37], P4: [19, 14],
  S1: [81, 75], S2: [81, 56], S3: [81, 37], S4: [81, 14],
};

/* Node color = what the spell DOES, same coding as the in-battle action
   menu (_HRLG_CAT in hud.js): red damage, green heal, blue buff, purple
   debuff, gold utility. Faction/branch identity lives only in the pillar
   header labels — never on the nodes. */
const TREE_CAT_C = { damage:'#ff5f5f', heal:'#58d858', buff:'#5cb2ff', debuff:'#a06bff', utility:'#f0d060' };
// In-chip glyph = the same category ICON the battle action menu uses
// (_HRLG_CAT in hud.js) — NOT the tier numeral (most race abilities carry
// no tier tag, which left race chips blank). Name lives under the chip.
const TREE_CAT_GLYPH = { damage:'⚔', heal:'♥', buff:'▲', debuff:'▼', utility:'◎' };
const TREE_NODE_BG = '#0d0d13';   // opaque chip fill — lines must never show through a node
function _treeMixBg(hex, t) {     // blend a #rrggbb toward TREE_NODE_BG at ratio t — stays fully opaque
  const p = (s, i) => parseInt(s.slice(i, i + 2), 16);
  const m = (a, b) => Math.round(a * t + b * (1 - t));
  return 'rgb(' + m(p(hex,1), 13) + ',' + m(p(hex,3), 13) + ',' + m(p(hex,5), 19) + ')';
}

/* BFS from the connected frontier to targetKey. Returns the node keys that
   must be NEWLY equipped (target last, sealed pass-throughs excluded), [] if
   the target is already connected, or null if unreachable (empty sockets
   block). */
function computeTreeEquipPath(tree, sealed, equippedIds, targetKey) {
  const equipped = new Set((equippedIds || []).filter(Boolean));
  const adj = {};
  for (const [a, b] of tree.edges) { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }
  const start = new Set(['root']);
  let grew = true;
  while (grew) {
    grew = false;
    for (const k of [...start]) for (const n of adj[k] || []) {
      if (start.has(n)) continue;
      const id = tree.nodes[n];
      if (id && (equipped.has(id) || sealed.has(id))) { start.add(n); grew = true; }
    }
  }
  if (start.has(targetKey)) return [];
  const prev = {};
  const seen = new Set(start);
  const q = [...start];
  while (q.length) {
    const k = q.shift();
    for (const n of adj[k] || []) {
      if (seen.has(n)) continue;
      const id = tree.nodes[n];
      if (!id) continue;
      seen.add(n); prev[n] = k;
      q.push(n);
    }
  }
  if (!seen.has(targetKey)) return null;
  const path = [];
  for (let k = targetKey; k != null && !start.has(k); k = prev[k]) {
    const id = tree.nodes[k];
    if (id && !sealed.has(id)) path.unshift(k);
  }
  return path;
}

/* Which pillar a node key sits on ('P' | 'R' | 'S'; root = null) and its
   ring (1–4; root = 0) — the keyboard walks the circuit with these. */
function treePillarOf(key) { return key === 'root' ? null : key[0]; }
function treeRingOf(key) { return key === 'root' ? 0 : (parseInt(key.slice(1), 10) || 0); }
const TREE_PILLAR_ORDER = ['P', 'R', 'S'];
/* Arrow-key step across the circuit: ↑ ↓ along a pillar, ← → across
   pillars on the same ring; from the root ← → land on ring 1 of the outer
   pillars, ↓ from ring 1 returns to the root. Skips nothing — an empty node
   is still a place on the circuit (the panel says so). */
function treeStepKey(key, dir) {
  const col = treePillarOf(key), ring = treeRingOf(key);
  if (dir === 'up') return key === 'root' ? 'R1' : (ring < 4 ? col + (ring + 1) : key);
  if (dir === 'down') return key === 'root' ? key : (ring > 1 ? col + (ring - 1) : 'root');
  const ci = col ? TREE_PILLAR_ORDER.indexOf(col) : 1;
  const r = Math.max(1, ring);
  if (dir === 'left') return ci > 0 ? TREE_PILLAR_ORDER[ci - 1] + r : key;
  if (dir === 'right') return ci < 2 ? TREE_PILLAR_ORDER[ci + 1] + r : key;
  return key;
}

/* The state of one node — shared by the circuit (its look) and the technique
   panel (its verb). root / socket / empty / sealed / equipped / reachable /
   far / blocked; identical to the Stage-1 nodeState (moved, not changed). */
function treeNodeState(tree, sealed, equipped, key) {
  if (key === 'root') return 'root';
  const id = tree.nodes[key];
  // Freelancer: an unfilled wildcard socket is its own state — a slot the
  // player clicks to browse the pool (vs 'empty' = missing branch node).
  if (!id && tree.isFreelancer && tree.sockets && tree.sockets[key]) return 'socket';
  if (!id) return 'empty';
  if (sealed.has(id)) return 'sealed';
  if ((equipped || []).includes(id)) return 'equipped';
  const path = computeTreeEquipPath(tree, sealed, equipped, key);
  if (!path) return 'blocked';
  return path.length <= 1 ? 'reachable' : 'far';
}

/* ══ THE CIRCUIT — THREE LANES (2026-09-09, the redesign after the user's
   "smushed together / doesn't convey enough" note). TREE_NODE_POS and every
   legality rule are untouched (treeNodeState / computeTreeEquipPath /
   treeStepKey still walk the same keys); only the SKIN changed: instead of
   thirteen bare circles on a % board, each pillar is a LANE — a head pill,
   then four NODE ROWS top-down (ring 4 … ring 1), each row a category disc
   + the technique's NAME + one META line (type · MP · range · AoE · power ·
   slots · the twin's alternate) — joined by CSS link segments (lit =
   phosphor, hover path = gold, unlit = dashed) that drop onto a BUS at the
   bottom with the root hub (Basic Attack) at its centre. State reads as
   brightness on the disc AND the text: EQUIPPED glows white, REACHABLE is
   full colour, FAR dims, BLOCKED / SEALED go dark, the selection is a gold
   halo. The slot pips moved up into the tech bar (the parent). ══ */
function pbNodeMeta(sp) {
  const m = [];
  if (!sp) return m;
  if (sp.cost) m.push(['MP ' + sp.cost, '#6fc3ff']);
  if (sp.range != null) m.push([sp.range === 0 ? 'SELF' : 'R' + sp.range, null]);
  const aoe = pbAoeLabel(sp);
  if (aoe) m.push(['AOE ' + aoe, null]);
  const pw = pbPowerStat(sp);
  if (pw) m.push([pw.value + ' ' + pw.unit, pw.color]);
  const sc = spellSlotCost(sp);
  if (sc > 1) m.push([sc + ' SLOTS', EW.time]);
  return m.slice(0, 4);
}
function SpellTreePanel({ tree, sealed, equipped, slotCap, fc, clsName, secJob, raceLabel,
                          onNodeClick, onNodeHoverIn, onNodeHoverOut, hoverPath, shakeKey, onOpenSubjob,
                          onSocketClick, onTwinPick, selKey, onSelect }) {
  const equippedSet = new Set(equipped || []);
  const connected = (typeof window.treeReachableKeys === 'function')
    ? window.treeReachableKeys(tree, equippedSet) : new Set(['root']);
  const hoverSet = hoverPath ? new Set(hoverPath) : null;
  const isFL = !!tree.isFreelancer;

  const states = {};
  Object.keys(TREE_NODE_POS).forEach(k => { states[k] = treeNodeState(tree, sealed, equipped, k); });

  // one edge's look: a = the lower end (root / ring n), b = the upper end
  const linkCls = (a, b) => {
    const lit = connected.has(a) && connected.has(b);
    const onHover = hoverSet && (hoverSet.has(a) || a === 'root' || connected.has(a)) && hoverSet.has(b);
    return 'pb-link' + (onHover ? ' hover' : lit ? ' lit' : '');
  };

  const node = (key) => {
    const st8 = states[key];
    const id = key === 'root' ? null : tree.nodes[key];
    const sp = id && typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
    // Category colour — SAME coding as the battle action menu (red damage,
    // green heal, blue buff, purple debuff, gold utility).
    const cat = sp ? classifySpellLocal(sp) : null;
    const nc = cat ? (TREE_CAT_C[cat] || TREE_CAT_C.utility) : (key === 'root' ? '#e6e9f2' : EW.time);
    const catGlyph = cat ? (TREE_CAT_GLYPH[cat] || TREE_CAT_GLYPH.utility) : '';
    const isCap = key.endsWith('4');
    const onPath = !!(hoverSet && hoverSet.has(key));
    const selected = selKey === key;
    let glyph = catGlyph, name = sp ? sp.name : '';
    if (st8 === 'root') { glyph = '⚔'; name = 'Basic Attack'; }
    else if (st8 === 'socket') { glyph = '＋'; name = 'Wildcard ' + (tree.sockets[key] || []).join('·'); }
    else if (st8 === 'empty') { glyph = ''; name = key[0] === 'S' ? 'No subclass' : '—'; }
    else if (st8 === 'sealed') { glyph = '🔒'; }
    /* TWIN NODE (CHAMP_REWORK_PLAN §4): the node holds two alternates. An
       UNEQUIPPED twin opens the picker instead of auto-equipping its face;
       an EQUIPPED twin still unequips on click, and its ⇄ badge opens the
       picker to swap in place. The alternate it is NOT wearing is named. */
    const twin = (tree.alts && tree.alts[key]) || null;
    const otherAlt = twin ? twin.find(a => a !== id) : null;
    const otherSp = otherAlt && typeof window.getSpellById === 'function' ? window.getSpellById(otherAlt) : null;
    const clickable = (st8 === 'equipped' || st8 === 'reachable' || st8 === 'far' || st8 === 'root');
    const twinPickable = twin && clickable && !!onTwinPick;
    const chipClick = st8 === 'socket' ? () => onSocketClick && onSocketClick(key)
      : (twinPickable && st8 !== 'equipped') ? () => onTwinPick(key)
      : (clickable && st8 !== 'root') ? () => onNodeClick(key) : undefined;
    const onRowClick = (e) => { if (onSelect) onSelect(key); if (chipClick) chipClick(e); };
    const socketLit = st8 === 'socket' && tree.edges.some(([a, b]) =>
      (a === key && connected.has(b)) || (b === key && connected.has(a)));
    const meta = pbNodeMeta(sp);
    const cls = 'pb-tn is-' + st8 + (isCap ? ' cap' : '') + (onPath ? ' on-path' : '') + (selected ? ' sel' : '')
      + (socketLit ? ' socket-lit' : '') + (key === 'R3' ? ' daat' : '') + (chipClick || st8 === 'root' ? ' can' : '');
    return h('div', {
      key, className: cls, style: { '--nc': nc, animation: shakeKey === key ? 'ewTreeShake 0.3s linear' : undefined },
      onClick: onRowClick,
      onMouseEnter: (e) => onNodeHoverIn(key, sp, e),
      onMouseLeave: () => onNodeHoverOut(key),
      title: sp ? sp.name : (st8 === 'root' ? 'Basic Attack — always equipped' : st8 === 'socket' ? 'Open wildcard socket' : 'Empty node'),
    },
      h('span', { className: 'pb-tn-disc' }, glyph,
        twin ? h('b', {
          className: 'pb-node-twin' + (twinPickable ? ' can' : ''),
          title: otherSp ? '⇄ swap for ' + otherSp.name : 'Twin node',
          onClick: twinPickable ? (e) => { e.stopPropagation(); if (onSelect) onSelect(key); onTwinPick(key); } : undefined,
        }, '⇄') : null),
      h('span', { className: 'pb-tn-text' },
        h('span', { className: 'pb-tn-name' }, name),
        sp ? h('span', { className: 'pb-tn-meta' },
          sp.spellType ? h('i', { className: 'pb-tn-type', style: { '--tc': TYPE_C[String(sp.spellType).toLowerCase()] || EW.inkMute }, title: String(sp.spellType).toUpperCase() }, PB_TYPE_GLYPH[String(sp.spellType).toLowerCase()] || '?') : null,
          ...meta.map(([t, c], i) => h('em', { key: i, style: c ? { color: c } : undefined }, t))) : null,
        twin && otherSp ? h('span', { className: 'pb-tn-alt' }, '⇄ or ' + otherSp.name) : null,
        st8 === 'root' ? h('span', { className: 'pb-tn-meta' }, h('em', null, 'ALWAYS EQUIPPED')) : null));
  };

  /* The lane heads as PILLS: the title + a tagline line under it. Until the
     tagline table (decision C-5) is approved the line is the pillar's spell
     count. The SUBCLASS head is a button (opens the picker). */
  const pillarCount = (prefix) => [1, 2, 3, 4].reduce((n, r) => n + (tree.nodes[prefix + r] ? 1 : 0), 0);
  const pillarHead = (prefix, text, color, onClick, sub) => h('div', {
    key: 'head' + prefix,
    className: 'pb-pillar-head' + (onClick ? ' btn' : ''),
    style: { color, borderColor: onClick ? 'rgba(242,196,104,0.5)' : (color + '66') },
    onClick, title: onClick ? 'Subclass — click to change' : undefined,
  },
    h('span', { className: 'pb-pillar-title' }, text, onClick ? h('i', null, ' ▾') : null),
    h('span', { className: 'pb-pillar-tag' }, sub != null ? sub : pillarCount(prefix) + ' TECHNIQUE' + (pillarCount(prefix) === 1 ? '' : 'S')));

  const lane = (prefix, head) => h('div', { key: prefix, className: 'pb-lane', 'data-pillar': prefix },
    head,
    node(prefix + '4'), h('i', { className: linkCls(prefix + '3', prefix + '4') }),
    node(prefix + '3'), h('i', { className: linkCls(prefix + '2', prefix + '3') }),
    node(prefix + '2'), h('i', { className: linkCls(prefix + '1', prefix + '2') }),
    node(prefix + '1'), h('i', { className: linkCls('root', prefix + '1') + ' drop' }));

  const busCls = (k) => (connected.has(k) ? ' lit' : '') + (hoverSet && hoverSet.has(k) ? ' hover' : '');
  // The circuit: three lanes over a BUS. Every lane's drop lands on the bus;
  // the root hub sits at the centre lane's disc, exactly under R1.
  return h('div', { className: 'pb-circuit' },
    h('div', { className: 'pb-lanes' },
      lane('P', pillarHead('P', getJobDisplay(clsName).toUpperCase(), EW.space)),
      lane('R', pillarHead('R', (raceLabel || '').toUpperCase(), fc)),
      lane('S', isFL
        // Freelancer has no subclass — the right pillar IS the wildcard rack.
        ? pillarHead('S', 'WILDCARDS', EW.time)
        : pillarHead('S', secJob ? getJobDisplay(secJob).toUpperCase() : '＋ SUBCLASS',
            secJob ? EW.ink : EW.inkMute, onOpenSubjob, secJob ? 'CHANGE' : 'SELECT'))),
    h('div', { className: 'pb-bus' },
      h('div', { className: 'pb-bus-cell l' + busCls('P1') }),
      h('div', { className: 'pb-bus-cell c lit' }, node('root')),
      h('div', { className: 'pb-bus-cell r' + busCls('S1') })));
}

/* ══ THE TECHNIQUE PANEL (plan §5.2 item 3) — under the circuit: a category
   disc with the glyph · `RING 2 · TIER II · DAMAGE` · the name · the desc ·
   the chip row (AP / MP / RNG / AOE / PWR / the type badge / status effects /
   slots) · the verb pill. Follows `techHover || techSel`. Module-level so it
   never remounts per render. `info` = pbTechInfo(...) below. ══ */
function pbTechInfo(tree, sealed, equipped, key, slotCap) {
  if (!tree || !key) return null;
  const st8 = treeNodeState(tree, sealed, equipped, key);
  const id = key === 'root' ? null : tree.nodes[key];
  const sp = id && typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
  const ring = treeRingOf(key);
  let path = null;
  if (st8 === 'reachable' || st8 === 'far') path = computeTreeEquipPath(tree, sealed, equipped, key);
  const newIds = path ? path.map(k => tree.nodes[k]).filter(pid => pid && !(equipped || []).includes(pid)) : [];
  const overCap = path ? ((equipped || []).length + newIds.length > slotCap) : false;
  const twin = (tree.alts && tree.alts[key]) || null;
  return { key, st8, id, sp, ring, path, newIds, overCap, twin,
    pillar: treePillarOf(key), tiers: (st8 === 'socket' && tree.sockets) ? (tree.sockets[key] || []) : null };
}
function TechniquePanel({ info, clsName, secJob, raceLabel, fc, onVerb, onPreview, previewLabel, previewOff, previewing, used, slotCap }) {
  if (!info) {
    return h('div', { className: 'pb-technique empty' },
      h('div', { className: 'pb-technique-disc', style: { borderColor: 'rgba(255,255,255,0.18)', color: EW.inkDim } }, '◯'),
      h('div', { className: 'pb-technique-main' },
        h('div', { className: 'pb-technique-kicker' }, 'THE CIRCUIT'),
        h('div', { className: 'pb-technique-name', style: { color: EW.inkMute } }, 'Select a technique'),
        h('div', { className: 'pb-technique-desc' }, 'ENTER equips · ⌫ unequips · SPACE replays the preview')));
  }
  const { st8, sp, ring, key } = info;
  const cat = sp ? classifySpellLocal(sp) : null;
  const cc = cat ? (PB_CAT[cat] || PB_CAT.damage) : null;
  const nc = cat ? (TREE_CAT_C[cat] || TREE_CAT_C.utility) : (st8 === 'root' ? '#e6e9f2' : EW.time);
  const glyph = cat ? (TREE_CAT_GLYPH[cat] || TREE_CAT_GLYPH.utility) : (st8 === 'root' ? '⚔' : st8 === 'socket' ? '＋' : st8 === 'sealed' ? '🔒' : '◯');
  const pillarName = info.pillar === 'P' ? getJobDisplay(clsName) : info.pillar === 'R' ? (raceLabel || 'RACE') : (secJob ? getJobDisplay(secJob) : 'SUBCLASS');
  const kicker = st8 === 'root' ? 'ROOT · ALWAYS EQUIPPED'
    : ['RING ' + ring, sp && sp.tier ? 'TIER ' + sp.tier : null, cat ? spellCategoryLabel(cat).toUpperCase() : null].filter(Boolean).join(' · ');
  const name = st8 === 'root' ? 'Basic Attack' : st8 === 'socket' ? 'Wildcard Socket' : st8 === 'empty' ? 'Empty Node' : (sp ? sp.name : '—');
  const desc = st8 === 'root' ? 'The vessel\'s plain strike — melee or ranged by reach. Every loadout carries it; the circuit grows from here.'
    : st8 === 'socket' ? 'An open socket on the Freelancer\'s rack: borrow any job\'s technique of tier ' + (info.tiers || []).join(' / ') + '.'
    : st8 === 'empty' ? (info.pillar === 'S' ? 'No subclass chosen — pick one on the pillar head to light this node.' : 'Nothing is authored on this node yet.')
    : (sp ? (sp.desc || spellCategoryLabel(cat)) : '');
  // chips
  const chips = [];
  if (sp) {
    const pw = pbPowerStat(sp);
    const aoe = pbAoeLabel(sp);
    const sc = spellSlotCost(sp);
    if (sp.apCost != null) chips.push(['AP ' + sp.apCost, EW.ink]);
    if (sp.cost) chips.push(['MP ' + sp.cost, '#6fc3ff']);
    if (sp.range != null) chips.push([sp.range === 0 ? 'SELF' : 'RNG ' + sp.range, EW.ink]);
    if (aoe) chips.push(['AOE ' + aoe, EW.ink]);
    if (pw) chips.push([pw.value + ' ' + pw.unit, pw.color]);
    chips.push([sc + ' SLOT' + (sc > 1 ? 'S' : ''), EW.time]);
  }
  const effects = sp ? pbSpellEffects(sp) : [];
  // the verb
  let verb = null, verbCls = '', verbTitle = '';
  if (st8 === 'equipped') { verb = 'UNEQUIP'; verbCls = 'danger'; verbTitle = 'Remove it (the rest must stay connected)'; }
  else if (st8 === 'socket') { verb = '＋ BROWSE'; verbCls = 'gold'; verbTitle = 'Open the wildcard pool'; }
  else if (st8 === 'sealed') { verb = 'SEALED — CLASH RULES'; verbCls = 'off'; verbTitle = 'Not allowed in this mode'; }
  else if (st8 === 'blocked') { verb = 'NO PATH'; verbCls = 'off'; verbTitle = 'Fill the sockets between here and the root first'; }
  else if (st8 === 'reachable' || st8 === 'far') {
    if (info.twin) { verb = '⇄ PICK'; verbCls = 'gold'; verbTitle = 'Twin node — choose which of its two techniques to equip'; }
    else if (info.overCap) { verb = 'NO ROOM · ' + info.newIds.length + ' SLOT' + (info.newIds.length > 1 ? 'S' : '') + ' NEEDED'; verbCls = 'off'; verbTitle = 'Unequip something first'; }
    else if (info.path && info.path.length > 1) { verb = 'PATH · +' + info.path.length + ' NODES'; verbCls = 'gold'; verbTitle = 'Equips the whole path to reach it'; }
    else { verb = 'EQUIP'; verbCls = 'primary'; verbTitle = 'Equip this technique'; }
  }
  const canPreview = st8 !== 'empty' && st8 !== 'socket';
  return h('div', { className: 'pb-technique', style: { '--tc': nc } },
    h('div', { className: 'pb-technique-disc', style: { borderColor: nc, color: st8 === 'equipped' || st8 === 'root' ? TREE_NODE_BG : nc, background: (st8 === 'equipped' || st8 === 'root') ? nc : 'transparent' } }, glyph),
    h('div', { className: 'pb-technique-main' },
      h('div', { className: 'pb-technique-kicker' }, kicker),
      h('div', { className: 'pb-technique-name' }, name,
        sp && sp.spellType ? h('span', { style: { ...pbTypeBadgeStyle(sp.spellType, 8), borderRadius: 999, marginLeft: 8, verticalAlign: 'middle' } }, sp.spellType) : null,
        sp ? pbDmgIcon(sp, 10) : null),
      h('div', { className: 'pb-technique-desc' }, desc),
      (chips.length || effects.length) ? h('div', { className: 'pb-technique-chips' },
        ...chips.map(([t, c], i) => h('span', { key: 'c' + i, className: 'pb-technique-chip', style: { color: c } }, t)),
        ...effects.map((ef, i) => h('span', { key: 'e' + i, className: 'pb-technique-chip fx', style: { color: ef.color || EW.inkMute, borderColor: (ef.color || EW.inkMute) + '66' }, title: ef.txt }, ef.txt))) : null,
      h('div', { className: 'pb-technique-verbs' },
        verb ? h('button', { className: 'pb-verb ' + verbCls, disabled: verbCls === 'off', onClick: () => onVerb && onVerb(info), title: verbTitle }, verb) : h('span', { className: 'pb-verb-note' }, st8 === 'root' ? 'ALWAYS EQUIPPED' : ''),
        canPreview ? h('button', { className: 'pb-verb ghost' + (previewing ? ' live' : ''), onClick: () => onPreview && onPreview(info), disabled: !!previewOff, title: previewOff ? 'Preview off' : 'Play the cast on the stage (SPACE)' }, previewOff ? '▶ PREVIEW OFF' : (previewing ? '■ PLAYING' : '▶ PREVIEW')) : null,
        h('span', { className: 'pb-technique-slots' }, used + ' / ' + slotCap + ' SLOTS'))));
}
// ── Race traits: passives & terrain rules shown on the hero sheet ──
// Entries marked CODED are live engine rules (map.js adaptation fns,
// SKY_RACES flight, sleepPreference day/night swing, werewolf model swap,
// deep-water/lava move+drown rules in state.js/battle.js). The rest are
// DESIGN-intent passives authored 2026-07-06 to give each starter race a
// distinct playstyle — surface them here first, wire them into battle.js
// as they're implemented. Only default-unlocked (3D-ready) races listed.
const RACE_TRAITS = {
  'homosapien': [
    { icon: '🎓', name: 'Quick Study', desc: 'Learns subclass spells as if they were native.' },                     // DESIGN
    { icon: '💪', name: 'Underdog', desc: 'Deals +10% damage to vessels with higher max HP.' },                       // DESIGN
  ],
  'giant': [
    { icon: '⛰️', name: 'Mountain Traverser', desc: 'Mountains cost only 1 MOV to climb.' },                          // CODED
    { icon: '🧊', name: 'Sure-Footed', desc: 'Never slips on ice.' },                                                 // CODED
    { icon: '🗿', name: 'Colossal Frame', desc: 'Too massive to be knocked back or pulled.' },                        // DESIGN
  ],
  'fairy': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '✨', name: 'Pixie Dust Trail', desc: 'Sheds glowing dust where she moves — allies who step on a mote recover HP and MP.' }, // CODED (PASSIVE_DEFS fairyDustTrail overlays this row)
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🌲', name: 'Forest Spirit', desc: 'Moves through trees at full speed.' },                                // CODED
  ],
  'werewolf': [
    // Lycanthropy + Bloodcraze overlay from PASSIVE_DEFS (Phase 3, 2026-09-07);
    // the old Lunar Shift / Nocturnal rows folded into Lycanthropy.
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
  ],
  'grey': [
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/M ATK at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Telepathic Network', desc: 'Allies gain +1 AWR while a Grey is on the field.' },             // DESIGN
  ],
  'telepath': [
    { icon: '🪽', name: 'Levitation', desc: 'Airborne — floats over hazards and rough ground. Grounded below 25% HP.' },  // CODED
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/M ATK at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Unquiet Mind', desc: 'A mind already crowded with voices — immune to Charm and Siren Song.' }, // CODED (PASSIVE_DEFS)
  ],
  'vampire': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '🩸', name: 'Hemophage', desc: 'Basic attacks drink deep — restores 25% of the damage dealt as HP.' },    // CODED (PASSIVE_DEFS)
    { icon: '🌙', name: 'Creature of the Night', desc: 'Stronger at night; weakened at high noon.' },                 // DESIGN
  ],
  'demon': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '🌋', name: 'Lava-Born', desc: 'Immune to lava — strides through it at full speed.' },                    // CODED
    { icon: '🔥', name: 'Hellfire Affinity', desc: 'Burns it inflicts last 1 turn longer.' },                         // DESIGN
  ],
  'annunaki': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '👁️', name: 'Ancient Sight', desc: '+1 vision range; sees over elevation.' },                             // DESIGN
  ],
  'atlantean': [
    { icon: '🌊', name: 'Amphibious', desc: 'Cannot drown; deep water costs only 1 MOV.' },                           // CODED
    { icon: '🔱', name: 'Tide Empowered', desc: '+1 spell range while standing in water.' },                          // DESIGN
  ],
  'pirate': [
    { icon: '⚓', name: 'Old Salt', desc: 'Cannot drown; deep water costs only 1 MOV.' },                             // CODED (Raider class)
    { icon: '💰', name: 'Plunder', desc: 'Earns extra Hazard Pay from kills.' },                                            // DESIGN
  ],
  'bigfoot': [
    // Cryptid overlays from PASSIVE_DEFS (Phase 3) — it replaced the Elusive design row.
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
  ],
  'catgirl': [
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '🐾', name: 'Featherfall', desc: 'Never takes fall damage — always lands on her feet.' },                 // DESIGN
    { icon: '👁️', name: 'Night Vision', desc: 'Vision is not reduced at night.' },                                    // DESIGN
  ],
  'knight': [
    { icon: '🛡️', name: 'Man-at-Arms', desc: 'Heavy plate and drilled footing — immune to Stagger.' },                // CODED (PASSIVE_DEFS)
    { icon: '⚜️', name: 'Oath of the Shield', desc: 'Adjacent allies take 10% less damage.' },                        // DESIGN
  ],
  'shaman': [
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🌿', name: 'Herbalist', desc: 'Potions she uses or receives heal +25%.' },                               // DESIGN
    { icon: '👻', name: 'Spirit Sight', desc: 'Sees invisible units.' },                                              // DESIGN
  ],
  'mad scientist': [
    { icon: '🔧', name: 'Overclocked Contraptions', desc: 'Deployed turrets gain +50% HP.' },                         // DESIGN
    { icon: '⚗️', name: 'Volatile Mixtures', desc: 'Thrown items splash to adjacent tiles.' },                        // DESIGN
  ],
  'necromancer': [
    { icon: '💀', name: 'Deathfeed', desc: 'Magic attack swells with every unit currently dead on the field (+8 M ATK per corpse, both sides) — all magic spell power grows with the body count.' }, // CODED
  ],
  'men in black': [
    { icon: '🕶️', name: 'Redacted', desc: 'Cannot be scanned or revealed.' },                                         // DESIGN
    { icon: '🌐', name: 'Clearance', desc: 'Ignores enemy ward vision — wards do not see him.' },                     // DESIGN
  ],
  'wizard': [
    { icon: '📚', name: 'Arcane Reserves', desc: 'Regenerates +5 MP every round.' },                                  // DESIGN
    { icon: '🔮', name: 'Tier Mastery', desc: 'Tier III spells cost 10 less MP.' },                                   // DESIGN
  ],
  'fortune teller': [
    { icon: '🃏', name: 'Foresight', desc: 'Cannot be critically hit — she saw it coming.' },                         // DESIGN
    { icon: '🌙', name: 'Moonlit Augury', desc: 'Spells cost 5 less MP at night.' },                                  // DESIGN
  ],
  'quarterback': [
    { icon: '🏈', name: 'Cannon Arm', desc: 'Thrown items fly 2 tiles further.' },                                    // DESIGN
    { icon: '🏃', name: 'Blitz', desc: '+1 MOV during the first round.' },                                            // DESIGN
  ],
  'ki fighter': [
    { icon: '🔥', name: 'Inner Furnace', desc: 'Regains 5 MP whenever she takes a hit.' },                            // DESIGN
    { icon: '🧘', name: 'Centered', desc: 'Immune to knockback until she moves each turn.' },                         // DESIGN
  ],
  'gangster': [
    { icon: '🔪', name: 'Shank', desc: 'Opportunity attacks always land and deal ×1.5.' },                             // CODED (PASSIVE_DEFS)
  ],
  'nun': [
    { icon: '🙏', name: 'Devout', desc: 'Heals she casts restore 20% more.' },                                        // CODED (PASSIVE_DEFS)
  ],
  'cowboy': [
    { icon: '🤠', name: 'Quickdraw', desc: 'Wins every speed tie — always acts first among equals.' },                // CODED (PASSIVE_DEFS)
    { icon: '🎯', name: 'Deadeye', desc: '+15% damage to targets at maximum range.' },                                // DESIGN
  ],
  'machine elves': [
    { icon: '🌀', name: 'Fractal Mind', desc: 'Self-similar at every scale — immune to Charm and Siren Song.' },      // CODED (PASSIVE_DEFS)
    { icon: '⚙️', name: 'Self-Assembling', desc: 'Repairs 3% of max HP every round.' },                               // DESIGN
  ],
  'martian': [
    { icon: '👽', name: 'Low-G Physique', desc: 'Jumps 1 tile higher.' },                                             // DESIGN
    { icon: '🔫', name: 'Ray Tech', desc: '+10% damage with beam and projectile spells.' },                           // DESIGN
  ],
  'nordic': [
    { icon: '🛸', name: 'Federation Envoy', desc: 'A Tall Blonde of the Galactic Federation — light-tech beams, stasis and psychic calm.' }, // LORE
    { icon: '🛡️', name: 'Serene Mind', desc: 'Federation discipline — immune to Charm and Siren Song.' },             // CODED (PASSIVE_DEFS)
  ],
  'halfdemon': [
    { icon: '😈', name: 'Dual Heritage', desc: 'Counts as both Human and Unholy in type matchups.' },                 // CODED (types)
    { icon: '🔥', name: 'Infernal Blood', desc: 'Burns on her end 1 turn sooner.' },                                  // DESIGN
  ],
  'ghost': [
    // Incorporeal (phasing + physical immunity) overlays from PASSIVE_DEFS (Phase 3).
    { icon: '☠️', name: 'Beyond Poison', desc: 'Immune to poison terrain.' },                                          // CODED (map.js)
  ],
  'kaiju': [
    { icon: '🔥', name: 'Thermal Regen', desc: 'Immune to Burn. Fire damage HEALS him — and a lava bath knits his wounds.' }, // CODED (PASSIVE_DEFS)
    { icon: '⛰️', name: 'Mountain Traverser', desc: 'Mountains cost only 1 MOV to climb.' },                           // CODED
  ],
};
/* Keep this display table honest: overlay the LIVE combat-passive registry
   (data.js PASSIVE_DEFS / RACE_PASSIVES) on top. A registry passive replaces
   a same-named hand-written row (so descs can never drift from the engine)
   and is prepended if the row was forgotten entirely. Terrain/lore rows
   (Mountain Traverser, Daywalker…) stay hand-authored. */
if (typeof window !== 'undefined' && window.RACE_PASSIVES && window.PASSIVE_DEFS) {
  for (const [race, ids] of Object.entries(window.RACE_PASSIVES)) {
    const rows = RACE_TRAITS[race] || (RACE_TRAITS[race] = []);
    for (const id of [...ids].reverse()) {
      const def = window.PASSIVE_DEFS[id];
      if (!def) continue;
      const row = { icon: def.icon, name: def.name, desc: def.desc };
      const at = rows.findIndex(t => t.name === def.name);
      if (at >= 0) rows[at] = row; else rows.unshift(row);
    }
  }
}
if (typeof window !== 'undefined') window.RACE_TRAITS = RACE_TRAITS;

// Compact tactical diamond: MOV and RNG each get their own footprint.
function RangeDiamond({ radius, fill, edge, label, value, color, tip }) {
  const r = Math.max(0, Math.floor(radius) || 0);
  const size = r * 2 + 1;
  const cellPx = Math.max(4, Math.min(Math.floor(64 / size), 9));
  const cells = [];
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const dist = Math.abs(gx - r) + Math.abs(gy - r);
      if (dist > r) continue;
      const isC = dist === 0;
      cells.push(h('div', { key: gx + '-' + gy, style: { position:'absolute', left: gx * cellPx, top: gy * cellPx, width: cellPx - 1, height: cellPx - 1, background: isC ? '#fff' : fill, border: `1px solid ${isC ? '#fff' : edge}`, boxSizing: 'border-box' } }));
    }
  }
  return h('div', { title: tip || undefined, style: { display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 } },
    h('div', { style: { position:'relative', width: size * cellPx, height: size * cellPx } }, ...cells),
    h('div', { style: { fontSize:9, color, letterSpacing:'0.1em', fontWeight:600, whiteSpace:'nowrap' } }, label, ' ', h('span', { style:{ color:'#e6e9f2' } }, value)));
}
/* ══ Stage 5 (plan §5.5 item 1): THE STICKY NOTES ═══════════════════════
   One paper note per passive the ENGINE would give this vessel — read
   through data.js getUnitPassives on a pseudo-unit built from the slot's
   identity (race / gender / job / types / gear, an empty status map), so
   `flying` resolves first (map.js canFly: SKY_RACES, the Psychic, the
   telepath, a jetpack) and the race's ids after, capped at
   MAX_UNIT_PASSIVES exactly like a unit on the board. The hand-authored
   RACE_TRAITS rows that are NOT registry passives (Mountain Traverser,
   Daywalker…) become one smaller TERRAIN note. Text: `PASSIVE: <name>` +
   the def's desc; a user-voiced marginalia line rides
   `PASSIVE_DEFS[id].note` when present (decision C-7 — Claude never writes
   it). Clicking a note opens the full list in a window. */
function pbUnitNotes(identity, cls, equipment) {
  const race = identity.race || '';
  const pseudo = { race, gender: identity.gender || 'male', cls, types: identity.types || [], faction: identity.faction,
    zodiac: identity.zodiac, status: {}, equipment: equipment || {} };
  let passives = [];
  try { passives = (typeof window.getUnitPassives === 'function') ? (window.getUnitPassives(pseudo) || []) : []; } catch (e) { passives = []; }
  const passiveNames = new Set(passives.map(p => p.name));
  const terrain = (RACE_TRAITS[race] || []).filter(t => !passiveNames.has(t.name));
  return { passives, terrain };
}
// ±3° per note, seeded by the race id — the same vessel always wears its notes the same way
function pbNoteRot(seed, i) {
  let x = 7;
  for (const c of String(seed || '')) x = ((x * 31) + c.charCodeAt(0)) >>> 0;
  return (((x + i * 977) % 61) / 10 - 3).toFixed(1);
}
function PbNotes({ notes, seed, paper, onOpen }) {
  const items = [];
  notes.passives.forEach((p, i) => {
    items.push(h('div', { key: 'p' + p.id, className: 'pb-note ' + paper, style: { '--rot': pbNoteRot(seed, i) + 'deg' }, onClick: onOpen, title: 'Open the notes' },
      h('i', { className: 'pb-note-fold' }),
      h('b', null, 'PASSIVE: ', h('u', null, p.name)),
      h('p', null, p.desc || ''),
      p.note ? h('em', null, p.note) : null));
  });
  if (notes.terrain.length) {
    const rows = notes.terrain.slice(0, 3);
    items.push(h('div', { key: 'terrain', className: 'pb-note terrain ' + paper, style: { '--rot': pbNoteRot(seed, 5) + 'deg' }, onClick: onOpen, title: 'Open the notes' },
      h('i', { className: 'pb-note-fold' }),
      h('b', null, h('u', null, 'TERRAIN')),
      ...rows.map((t, i) => h('p', { key: i }, t.icon, ' ', h('strong', null, t.name), ' — ', t.desc)),
      notes.terrain.length > rows.length ? h('span', { className: 'pb-note-clip' }, '\u{1F4CE} +' + (notes.terrain.length - rows.length) + ' MORE') : null));
  }
  if (!items.length) return null;
  return h('div', { className: 'pb-notes' }, ...items);
}

/* ══ Stage 5 (plan §5.5 item 3): AFFINITIES ══════════════════════════════
   Six round type icons; for the vessel's OWN types the ring reads the
   INCOMING matchups the way state.js getTypeDamageMultiplier judges a hit
   of type A on this vessel: TYPE_CHART[A].strongVs meets a type of ours
   (and weakVs does not) → WEAK, it takes ×1.30; TYPE_CHART[A].weakVs meets
   ours (and strongVs does not) → RESIST, ×0.75; else neutral. (The chart's
   `resists` field is documentation — the engine reads strongVs / weakVs.) */
function pbAffinities(unitTypes) {
  const chart = window.TYPE_CHART || {};
  const mine = (unitTypes || []).map(t => String(t).toLowerCase());
  const order = (Array.isArray(window.ENTROPY_STRIKE_TYPE_ORDER) && window.ENTROPY_STRIKE_TYPE_ORDER.length === 6) ? window.ENTROPY_STRIKE_TYPE_ORDER : PB_TYPE_ORDER;
  return order.map(a => {
    const row = chart[a] || {};
    const strong = (row.strongVs || []).some(t => mine.includes(t));
    const weak = (row.weakVs || []).some(t => mine.includes(t));
    const verdict = strong && !weak ? 'weak' : weak && !strong ? 'resist' : 'neutral';
    return { type: a, verdict, own: mine.includes(a), mult: verdict === 'weak' ? 1.3 : verdict === 'resist' ? 0.75 : 1 };
  });
}
function PbAffinityRing({ types }) {
  const rows = pbAffinities(types);
  return h('div', { className: 'pb-affinity' },
    ...rows.map(r => {
      const c = TYPE_C[r.type] || EW.inkMute;
      const tip = r.verdict === 'weak' ? `takes 1.3× from ${r.type.toUpperCase()}`
        : r.verdict === 'resist' ? `takes 0.75× from ${r.type.toUpperCase()}`
        : `takes 1× from ${r.type.toUpperCase()}`;
      return h('div', { key: r.type, className: 'pb-aff ' + r.verdict + (r.own ? ' own' : ''), style: { '--tc': c }, title: tip + (r.own ? ' · its own type: STAB on its own casts' : '') },
        h('span', { className: 'pb-aff-disc' }, PB_TYPE_GLYPH[r.type] || '?'),
        h('small', null, r.verdict === 'weak' ? 'WEAK' : r.verdict === 'resist' ? 'RESIST' : r.own ? 'OWN' : '—'));
    }));
}

/* ══ THE ELEMENTS (2026-09-09, rev 9): the elemental weakness / resistance
   layer UNDER the type chart. data.js RACE_ELEMENT_AFFINITY is the table
   and getRaceElementAffinity(race, el) the read (the engine's
   unitElementAffinity is the same read off the unit's race); only the six
   COMBAT_ELEMENTS ever consult it (fire / ice / lightning / water / poison /
   earth). weak ×1.5 · resist ×0.5 · immune ×0 (statuses bounce too) ·
   absorb = the hit HEALS. Neutral is the common case and shows as '—'. */
const PB_ELEMENT_ORDER = ['fire', 'ice', 'lightning', 'water', 'poison', 'earth'];
const PB_ELEMENT_C = { fire: '#ff7a3d', ice: '#8fd8ff', lightning: '#ffe25c', water: '#4fa8ff', poison: '#9be25a', earth: '#c9a06a' };
function pbElementAffinities(race) {
  const order = (Array.isArray(window.COMBAT_ELEMENTS) && window.COMBAT_ELEMENTS.length === 6) ? window.COMBAT_ELEMENTS : PB_ELEMENT_ORDER;
  const read = typeof window.getRaceElementAffinity === 'function' ? window.getRaceElementAffinity : (r, el) => ((window.RACE_ELEMENT_AFFINITY || {})[r] || {})[el] || null;
  const mults = window.ELEMENT_AFFINITY_MULT || { weak: 1.5, resist: 0.5, immune: 0 };
  return order.map(el => {
    const tier = read(race, el) || 'neutral';
    const mult = tier === 'absorb' ? null : (mults[tier] ?? 1);
    return { element: el, verdict: tier, mult };
  });
}
function PbElementRing({ race }) {
  const rows = pbElementAffinities(race);
  const icons = window.ELEMENT_ICONS || {};
  const iconHtml = typeof window.elementIconHtml === 'function' ? window.elementIconHtml : null;
  return h('div', { className: 'pb-affinity pb-element' },
    ...rows.map(r => {
      const c = PB_ELEMENT_C[r.element] || EW.inkMute;
      const EL = r.element.toUpperCase();
      const tip = r.verdict === 'weak' ? `takes ${r.mult}× from ${EL}`
        : r.verdict === 'resist' ? `takes ${r.mult}× from ${EL}`
        : r.verdict === 'immune' ? `IMMUNE to ${EL} — no damage, its status bounces`
        : r.verdict === 'absorb' ? `ABSORBS ${EL} — the hit heals instead`
        : `takes 1× from ${EL}`;
      const label = r.verdict === 'weak' ? 'WEAK' : r.verdict === 'resist' ? 'RESIST' : r.verdict === 'immune' ? 'IMMUNE' : r.verdict === 'absorb' ? 'ABSORB' : '—';
      const disc = iconHtml
        ? h('span', { className: 'pb-aff-disc', dangerouslySetInnerHTML: { __html: iconHtml(r.element, 'pb-elicon') } })
        : h('span', { className: 'pb-aff-disc' }, icons[r.element] || '?');
      return h('div', { key: r.element, className: 'pb-aff ' + r.verdict, style: { '--tc': c }, title: tip }, disc, h('small', null, label));
    }));
}

// RPG-style equipment/item slot square flanking the hero sprite.
function EquipSlotBox({ size, accent, filled, icon, label, title, onClick, onClear }) {
  const s = size || 48;
  return h('div', { onClick, title, className:'pbx-eqslot' + (filled ? ' filled' : ''), style:{ width:s, height:s, '--acc': accent || 'rgba(255,255,255,0.5)' } },
    filled && onClear ? h('span', { className:'pbx-eqslot-x', title:'Remove', onClick:(e)=>{ e.stopPropagation(); onClear(); } }, '✕') : null,
    h('span', { className:'pbx-eqslot-icon' }, filled ? icon : '+'),
    filled && label ? h('span', { className:'pbx-eqslot-label' }, label) : null);
}

/* A window on the glass (PARTY_BUILDER_PLAN §5.1 item 9): the pickers and
   the team modal are rounded phosphor panes drawn INSIDE the monitor, never
   browser modals. `zone` = fills the column it is rendered in (the node
   picker over the TECH column); otherwise centred over the whole glass. */
function PbWindow({ title, sub, onClose, width, zone, children }) {
  return h('div', {
    className: 'pb-veil' + (zone ? ' zone' : ''),
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
    h('div', { className: 'pb-window', style: width ? { width } : undefined, onClick: e => e.stopPropagation() },
      h('div', { className: 'pb-window-head' },
        h('b', null, title),
        sub ? h('span', null, sub) : null,
        h('button', { className: 'pb-window-x', onClick: onClose, title: 'Close (ESC)' }, '\u2715 CLOSE')),
      h('div', { className: 'pb-window-body' }, children)));
}

/* Standalone mode flag \u2014 set by _mountReactTeamBuilder (main-menu Party
   Builder page) and cleared by the pre-match mount. In standalone the
   component opens on the TEAM ARCHIVE locker (Pok\u00e9mon-Showdown-style:
   saved squads \u2192 pick one to forge), and the footer trades the match
   controls (CONFIRM / SEAL YOUR FATE / online locks) for SAVE TEAM. */
let _pbStandaloneMode = false;

function PartyBuilder(props) {
  const st = getSt();
  if (!st || !st.partyBuilds) return h('div', { style:{ color:'#8a93a8', padding:40, fontFamily:'DotGothic16, monospace', textAlign:'center' } }, 'Initializing\u2026');
  const NET = window._NET;
  const isOnline = !!(window.ONLINE_RULES?.active || (NET && NET.online));
  const netRole = NET?.role || null;
  const netLock = NET?._lockState || {};
  const isRankedNet = !!NET?.ranked;
  // "I have locked in" — ranked sets _waitingForOpponent; friendly tracks the
  // role's own lock flag. "Opponent locked" — the host learns via
  // guestPartyReceived, the guest via the host-locked relay.
  const isWaitingOnline = isOnline && (!!NET?._waitingForOpponent || !!NET?._autoStartFired
    || (netRole === 'guest' ? !!netLock.guest : !!netLock.host));
  const opponentLockedToo = isOnline && (netRole === 'guest' ? !!netLock.hostLocked : !!netLock.guestPartyReceived);
  // Friendly rooms: the HOST controls the start — once both sides are locked
  // their button becomes a live START MATCH instead of a dead waiting label.
  const friendlyHostCanStart = isWaitingOnline && !isRankedNet && netRole === 'host' && opponentLockedToo;
  const player = isOnline ? (typeof window._myPlayer === 'function' ? window._myPlayer() : 1) : (st.builderSelectedPlayer || 1);
  const teamSize = window.CONFIG?.teamSize || 4;
  /* 2026-09-09 (found by playtest_builder.js): the flag is per INSTANCE
     now — the pre-match forge sleeping in #builderOverlay re-renders while
     the archive is open and used to flip the shared module flag, so the
     standalone instance woke up as a pre-match one (its ESC ran doBack →
     the match-select terminal). Each mount passes its own mode. */
  const standalone = (props && typeof props.standalone === 'boolean') ? props.standalone : _pbStandaloneMode;
  const [tbView, setTbView] = React.useState(standalone ? 'locker' : 'edit');   // standalone: 'locker' | 'edit'
  const [editingTeamId, setEditingTeamId] = React.useState(null);
  const [teamNameDraft, setTeamNameDraft] = React.useState('');
  const [slot, setSlot] = React.useState(() => st.builderSelectedSlot || 0);
  const [sortKey, setSortKey] = React.useState('HP');
  const [sortDir, setSortDir] = React.useState('desc');
  const [factionFilter, setFactionFilter] = React.useState(null);
  const [typeFilter, setTypeFilter] = React.useState(null);
  const [jobFilter, setJobFilter] = React.useState(null);
  const [rosterSearch, setRosterSearch] = React.useState('');
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  const [teamSaveName, setTeamSaveName] = React.useState('');
  const [_, forceUpdate] = React.useState(0);
  const refresh = () => forceUpdate(n => n + 1);
  const [spellTip, setSpellTip] = React.useState(null); // { sp, x, y }
  /* THE CIRCUIT selection model (plan §5.2 item 2): techSel = the node the
     keyboard / a click owns, techHover = the node under the pointer; the
     technique panel follows techHover || techSel. previewState mirrors the
     viewer's MOVE PREVIEW ({ playing, ms, name }); previewNote is the pill's
     one-shot message for vessels that cannot preview. */
  const [techSel, setTechSel] = React.useState(null);
  const [techHover, setTechHover] = React.useState(null);
  const [previewState, setPreviewState] = React.useState(null);
  const [previewNote, setPreviewNote] = React.useState(null);
  const previewHoverTimer = React.useRef(0);
  const previewNoteTimer = React.useRef(0);
  /* ROSTER (Stage 4, §5.4): hovering a wall tile shows that vessel on the
     stage after a 220 ms debounce (cached GLBs swap instantly; uncached
     ones show the summoning ring); leaving the wall returns the slot's
     vessel. pbMenu = the SORT / JOB pill menus (glass windows, C-9). */
  const [rosterHover, setRosterHover] = React.useState(null);
  const rosterHoverTimer = React.useRef(0);
  const [pbMenu, setPbMenu] = React.useState(null);
  // Stage 5: the sticky notes' full-text window (`.pb-notes` click)
  const [notesOpen, setNotesOpen] = React.useState(false);
  // THE STAGE (plan §5.3): the CRT root + the technique on the stage, for the
  // monitor's reactions (grade wash / scanline roll / jolt) — DOM-driven, no
  // React state churn per beat.
  const crtRef = React.useRef(null);
  const previewSpellRef = React.useRef(null);
  const gradeTimer = React.useRef(0);
  const showSpellTip = (sp, e) => { if (sp) setSpellTip({ sp, x: e.clientX, y: e.clientY }); };
  const hideSpellTip = () => setSpellTip(null);
  /* the four tabs on the glass (PB_TABS); ROSTER first, as the references open */
  const [pbTab, setPbTab] = React.useState('roster');
  const [creatorOpen, setCreatorOpen] = React.useState(false);
  // fabric swatch thumbnails — the stage's own normalised fabric tiles (EWCharViewer.fabricThumb),
  // requested once the creator opens; a tile shows its label until its thumb lands
  const [pbFabricThumbs, setPbFabricThumbs] = React.useState({});
  React.useEffect(() => {
    if (!creatorOpen || !window.EWCharViewer || typeof window.EWCharViewer.fabricThumb !== 'function') return;
    let live = true;
    Object.keys(window.EW_FABRICS || {}).forEach(key => {
      if (!window.EW_FABRICS[key].file || pbFabricThumbs[key]) return;
      window.EWCharViewer.fabricThumb(key, url => { if (live && url) setPbFabricThumbs(prev => prev[key] ? prev : { ...prev, [key]: url }); });
    });
    return () => { live = false; };
  }, [creatorOpen]);
  const setTab = (id) => { if (!PB_TABS.some(t => t.id === id) || id === pbTab) return; setPbTab(id); sfx('uiCursorMove'); };
  const cycleTab = (d) => { const i = Math.max(0, PB_TABS.findIndex(t => t.id === pbTab)); setTab(PB_TABS[(i + d + PB_TABS.length) % PB_TABS.length].id); };
  React.useEffect(() => { window._pbSetTab = setTab; return () => { if (window._pbSetTab === setTab) delete window._pbSetTab; }; });
  const [equipPicker, setEquipPicker] = React.useState(null);        // 'item' | 'accessory1' | 'accessory2'
  React.useEffect(() => { st.builderSelectedSlot = slot; }, [slot]);

  const getFavRaces = () => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    return p?.favRaces || [];
  };
  const [favRaces, setFavRaces] = React.useState(getFavRaces);
  // A vessel the local human hasn't unlocked yet can never be favorited.
  const isLockedEntry = (raceKey) => (player === 1) && (typeof window.isUnitUnlocked === 'function') && !window.isUnitUnlocked(raceKey);
  const toggleFav = (raceKey, gender) => {
    if (isLockedEntry(raceKey)) { sfx('uiError'); return; }
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    if (!p.favRaces) p.favRaces = [];
    const tag = raceKey + ':' + gender;
    const fi = p.favRaces.indexOf(tag);
    if (fi >= 0) p.favRaces.splice(fi, 1); else p.favRaces.push(tag);
    window.ProfileSystem.saveProfile(idx, p);
    setFavRaces(p.favRaces.slice());
    sfx('uiCursorMove');
  };
  const isFav = (raceKey, gender) => favRaces.includes(raceKey + ':' + gender);

  // Resolve a unit's display name ONCE and persist it, so the party list and the
  // detail panel never show two different random names for the same vessel.
  const resolveUnitName = (p, i, cls) => {
    if (!st.partyNames) st.partyNames = {};
    if (!st.partyNames[p]) st.partyNames[p] = [];
    const cur = st.partyNames[p][i];
    const isDefault = (typeof window.isGeneratedDefaultName === 'function')
      ? window.isGeneratedDefaultName(cur, cls, p, i)
      : !String(cur || '').trim();
    if (isDefault) {
      const gen = (typeof window.getDefaultUnitName === 'function') ? window.getDefaultUnitName(cls) : (String(cur || '').trim() || cls);
      st.partyNames[p][i] = gen;
      return gen;
    }
    return (typeof window.sanitizeUnitName === 'function') ? window.sanitizeUnitName(cur, cur) : cur;
  };

  const getTeamPresets = () => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    return p?.teamPresets || [];
  };
  // Snapshot the player's current build into preset slots (shared by the
  // pre-match SAVE modal and the standalone archive's SAVE TEAM).
  const captureTeamSlots = () => {
    const size = window.CONFIG?.teamSize || teamSize;
    const slots = [];
    for (let i = 0; i < size; i++) {
      const cn = typeof window.normalizeClassName === 'function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i] || 'Warrior');
      const mt = st.partyMeta?.[player]?.[i] || {};
      const lo = st.loadouts?.[player]?.[i] || {};
      slots.push({
        cls: cn,
        race: mt.race || 'homosapien',
        gender: mt.gender || 'male',
        appearance: window.normalizeCharacterAppearance?.(mt.appearance) || null,
        unitName: (st.partyNames?.[player] || [])[i] || cn,
        customSpells: mt.customSpells ? mt.customSpells.slice() : [],
        secondaryJob: mt.secondaryJob || null,
        zodiac: mt.zodiac || 'aries',
        loadout: { items: lo.items ? { ...lo.items } : {}, equipment: lo.equipment ? { ...lo.equipment } : {} },
      });
    }
    return slots;
  };
  /* Save into an EXISTING preset (by id) or push a new one. Returns the
     saved preset id, or null when the archive is full. */
  const saveTeamAs = (existingId, name) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return null;
    if (!p.teamPresets) p.teamPresets = [];
    const slots = captureTeamSlots();
    const now = new Date().toISOString();
    let saved = existingId ? p.teamPresets.find(t => t.id === existingId) : null;
    if (saved) {
      saved.name = name || saved.name;
      saved.slots = slots;
      saved.gameMode = st.gameMode || saved.gameMode || 'arena';
      saved.lastUsed = now;
    } else {
      const MAX = window.ProfileSystem?.MAX_TEAM_PRESETS || 20;
      if (p.teamPresets.length >= MAX) { sfx('uiError'); return null; }
      saved = {
        id: 'team-' + Date.now(),
        name: name || 'Team ' + (p.teamPresets.length + 1),
        slots,
        gameMode: st.gameMode || 'arena',
        createdAt: now,
        lastUsed: now,
      };
      p.teamPresets.push(saved);
    }
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiButtonConfirm');
    return saved.id;
  };
  const saveCurrentTeam = (name) => {
    if (saveTeamAs(null, name) == null) return;
    setShowTeamModal(false);
    setTeamSaveName('');
  };
  const loadTeamPreset = (preset) => {
    if (!preset?.slots) return;
    // Read the size FRESH — the standalone archive resizes CONFIG.teamSize
    // to the preset before calling this, after this render captured it.
    const sizeNow = window.CONFIG?.teamSize || teamSize;
    for (let i = 0; i < Math.min(preset.slots.length, sizeNow); i++) {
      const s = preset.slots[i];
      if (!st.partyBuilds[player]) st.partyBuilds[player] = [];
      st.partyBuilds[player][i] = s.cls;
      if (!st.partyMeta[player]) st.partyMeta[player] = [];
      if (!st.partyMeta[player][i]) st.partyMeta[player][i] = {};
      st.partyMeta[player][i].race = s.race;
      st.partyMeta[player][i].gender = s.gender;
      st.partyMeta[player][i].appearance = window.normalizeCharacterAppearance?.(s.appearance) || null;
      st.partyMeta[player][i].zodiac = s.zodiac || 'aries';
      if (s.customSpells?.length) st.partyMeta[player][i].customSpells = s.customSpells.slice();
      else delete st.partyMeta[player][i].customSpells;
      st.partyMeta[player][i].secondaryJob = s.secondaryJob || null;
      if (!st.partyNames) st.partyNames = {};
      if (!st.partyNames[player]) st.partyNames[player] = [];
      st.partyNames[player][i] = s.unitName || s.cls;
      if (!st.loadouts[player]) st.loadouts[player] = [];
      st.loadouts[player][i] = s.loadout ? { items: { ...s.loadout.items }, equipment: { ...s.loadout.equipment } } : (typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {});
    }

    const p = window.ProfileSystem?.getActiveProfile?.();
    const pidx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (p && pidx != null) {
      const tp = p.teamPresets?.find(t => t.id === preset.id);
      if (tp) tp.lastUsed = new Date().toISOString();
      window.ProfileSystem.saveProfile(pidx, p);
    }
    st.teamLockedIn = false;
    if (st.builderConfirmedSlots) st.builderConfirmedSlots[player] = {};
    sfx('uiButtonConfirm');
    setShowTeamModal(false);
    refresh();
  };
  const deleteTeamPreset = (presetId) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    p.teamPresets = (p.teamPresets || []).filter(t => t.id !== presetId);
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiCursorMove');
    refresh();
  };

  // ── Standalone TEAM ARCHIVE actions (Pokémon-Showdown-style locker) ──
  const tbNewTeam = () => {
    if (window.CONFIG) window.CONFIG.teamSize = 4;   // standard squad; modes clamp on load
    if (typeof window.defaultAllTeams === 'function') window.defaultAllTeams();
    st.builderConfirmedSlots = {};
    st.teamLockedIn = false;
    setSlot(0);
    setEditingTeamId(null);
    setTeamNameDraft('');
    setTbView('edit');
    sfx('uiButtonConfirm');
  };
  const tbEditTeam = (preset) => {
    const size = Math.max(1, Math.min(8, (preset.slots || []).length || 4));
    if (window.CONFIG) window.CONFIG.teamSize = size;
    loadTeamPreset(preset);
    setSlot(0);
    setEditingTeamId(preset.id);
    setTeamNameDraft(preset.name || '');
    setTbView('edit');
  };
  const tbDuplicateTeam = (preset) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    if (!p.teamPresets) p.teamPresets = [];
    const MAX = window.ProfileSystem?.MAX_TEAM_PRESETS || 20;
    if (p.teamPresets.length >= MAX) { sfx('uiError'); return; }
    const now = new Date().toISOString();
    p.teamPresets.push({
      ...preset,
      id: 'team-' + Date.now(),
      name: (preset.name || 'Team') + ' copy',
      slots: (preset.slots || []).map(s => ({ ...s, customSpells: (s.customSpells || []).slice(), loadout: { items: { ...(s.loadout?.items || {}) }, equipment: { ...(s.loadout?.equipment || {}) } } })),
      createdAt: now, lastUsed: now,
    });
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiButtonConfirm');
    refresh();
  };
  const tbSaveTeam = () => {
    const fallback = editingTeamId ? null : ('Team ' + (getTeamPresets().length + 1));
    const id = saveTeamAs(editingTeamId, teamNameDraft.trim() || fallback);
    if (id == null) return;             // archive full
    setEditingTeamId(id);
    setTbView('locker');
    refresh();
  };

  const clsName = typeof window.normalizeClassName === 'function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[slot], window.DEFAULT_BUILDS?.[player]?.[slot]) : (st.partyBuilds?.[player]?.[slot] || 'Warrior');
  const meta = st.partyMeta?.[player]?.[slot] || (typeof window.getArchetypeForJob === 'function' ? window.getArchetypeForJob(clsName) : {});
  const identity = typeof window.resolveIdentityForBuild === 'function' ? window.resolveIdentityForBuild(clsName, meta) : { race: meta.race || 'homosapien', faction: 'time', types: ['human'], gender: meta.gender || 'male', zodiac: meta.zodiac || 'aries' };
  const unitRace = identity.race || '', unitFaction = identity.faction || 'time', unitTypes = identity.types || [];
  const fc = getFactionColor(unitFaction);
  const template = computeStats(unitRace, clsName);
  const raceAbilities = getRaceAbilities(unitRace, clsName);
  const prof = window.RACE_PROFILES?.[unitRace];
  const secJob = st.partyMeta?.[player]?.[slot]?.secondaryJob || '';
  const unitLoadout = st.loadouts?.[player]?.[slot] || (typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {});
  const unitEquipment = unitLoadout.equipment || {};
  const { final: fullStats, delta: statDeltas } = computeFullStats(unitRace, clsName, secJob, unitEquipment);
  const rawCustomSpells = Array.isArray(st.partyMeta?.[player]?.[slot]?.customSpells) ? st.partyMeta[player][slot].customSpells : null;

  const mpMode2 = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
  const isArenaEarly = false;
  let customSpells = rawCustomSpells;
  if (!rawCustomSpells) {
    const defaults = buildDefaultCustomSpells(unitRace, clsName, secJob);

    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    st.partyMeta[player][slot].customSpells = defaults;
    customSpells = defaults;
  } else {
    // Self-heal: drop any equipped spell this unit can't actually learn
    // (leftovers from a vessel swap, subjob change, or an old saved team).
    const legal = legalCustomSpellIds(unitRace, clsName, secJob);
    if (rawCustomSpells.some(id => !legal.has(id))) {
      const scrubbed = rawCustomSpells.filter(id => legal.has(id));
      st.partyMeta[player][slot].customSpells = scrubbed;
      customSpells = scrubbed;
    }
    // Tree classes: also enforce root-connectivity (stale saves from the
    // flat-pool era may hold legal-but-disconnected picks).
    if (customSpells && typeof window.classHasSpellTree === 'function'
        && window.classHasSpellTree(clsName) && typeof window.treeLegalSubset === 'function') {
      const fixed = window.treeLegalSubset(unitRace, clsName, secJob, customSpells);
      if (fixed.length !== customSpells.length) {
        st.partyMeta[player][slot].customSpells = fixed;
        customSpells = fixed;
      }
    }
  }
  const learnedSpells = getLearnedSpells(clsName, customSpells);
  const zodiacNature = typeof window.ZODIAC_NATURES !== 'undefined' ? window.ZODIAC_NATURES[identity.zodiac || 'aries'] : null;
  const unitItems = unitLoadout.items || {};

  const rosterEntries = React.useMemo(() => {
    const races = window.AVAILABLE_RACES || [], entries = [];
    for (const rk of races) {
      const p = window.RACE_PROFILES?.[rk]; if (!p) continue;
      const genders = typeof window.getAvailableGendersForRace === 'function' ? window.getAvailableGendersForRace(rk) : ['male'];
      if (rk === 'homosapien') { for (const g of genders) entries.push({ race:rk, gender:g, job:'Freelancer', label:`${_grl(rk,g)} ${g==='female'?'\u2640':'\u2642'}`, cls:'Freelancer', faction:p.faction, types:p.types||[], prof:p }); }
      else if (genders.length > 1) { const dj = window.RACE_DEFAULT_JOBS?.[rk] || 'Freelancer'; for (const g of genders) entries.push({ race:rk, gender:g, job:dj, label:`${_grl(rk,g)} ${g==='female'?'\u2640':'\u2642'}`, cls:dj, faction:p.faction, types:p.types||[], prof:p }); }
      else { const dj = window.RACE_DEFAULT_JOBS?.[rk] || 'Freelancer'; entries.push({ race:rk, gender:genders[0], job:dj, label:_grl(rk,genders[0]), cls:dj, faction:p.faction, types:p.types||[], prof:p }); }
    }
    return entries;
  }, [_]);

  const availableTypes = React.useMemo(() => {
    const s = new Set();
    rosterEntries.forEach(e => (e.types || []).forEach(t => { if (t) s.add(t); }));
    return Array.from(s).sort();
  }, [rosterEntries]);
  const availableJobs = React.useMemo(() => {
    const s = new Set();
    rosterEntries.forEach(e => { if (e.cls) s.add(e.cls); });
    return Array.from(s).sort((a, b) => getJobDisplay(a).localeCompare(getJobDisplay(b)));
  }, [rosterEntries]);

  const filteredRoster = React.useMemo(() => {
    let list = rosterEntries;
    if (factionFilter) list = list.filter(e => e.faction === factionFilter);
    if (typeFilter) list = list.filter(e => e.types.includes(typeFilter));
    if (jobFilter) list = list.filter(e => e.cls === jobFilter);
    if (rosterSearch) { const q = rosterSearch.toLowerCase(); list = list.filter(e => e.label.toLowerCase().includes(q) || e.cls.toLowerCase().includes(q) || e.race.toLowerCase().includes(q)); }
    const getStatVal = (entry, key) => { const s = computeStats(entry.race, entry.cls), mapped = STAT_MAP[key]; return s[mapped] ?? s[key] ?? s[key.toLowerCase()] ?? 0; };
    list = [...list].sort((a, b) => {
      // Owned (unlocked) vessels always come first, then favorites, then the chosen stat.
      const ao = isLockedEntry(a.race) ? 0 : 1, bo = isLockedEntry(b.race) ? 0 : 1;
      if (ao !== bo) return bo - ao;
      const af = isFav(a.race, a.gender) ? 1 : 0, bf = isFav(b.race, b.gender) ? 1 : 0;
      if (af !== bf) return bf - af;
      if (STAT_KEYS.includes(sortKey)) { return sortDir === 'desc' ? getStatVal(b, sortKey) - getStatVal(a, sortKey) : getStatVal(a, sortKey) - getStatVal(b, sortKey); } const av = a[sortKey]||a.label, bv = b[sortKey]||b.label; return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv)); });
    return list;
  }, [rosterEntries, factionFilter, typeFilter, jobFilter, rosterSearch, sortKey, sortDir, _, favRaces]);

  function pickRace(raceKey, gender, jobName) {
    if (!st.partyMeta[player]) st.partyMeta[player] = []; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const prevJob = st.partyBuilds[player][slot]; const prevRace = st.partyMeta[player][slot].race; st.partyMeta[player][slot].race = raceKey; st.partyMeta[player][slot].gender = gender;
    if (raceKey === 'homosapien') st.partyBuilds[player][slot] = jobName; else { const lj = window.RACE_DEFAULT_JOBS?.[raceKey]; if (lj) st.partyBuilds[player][slot] = lj; }
    // A different vessel OR a different job = a different spell pool — the old
    // unit's picks (race abilities included) must never carry over.
    if (st.partyBuilds[player][slot] !== prevJob || raceKey !== prevRace) delete st.partyMeta[player][slot].customSpells;
    if (!st.loadouts[player]) st.loadouts[player] = []; if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    const lo = st.loadouts[player][slot]; if (typeof window.ITEM_RULES !== 'undefined') { lo.items = Object.fromEntries(Object.keys(window.ITEM_RULES).map(k=>[k,0])); lo.items.healPotion=1;lo.items.manaPotion=1;lo.items.panacea=1; }
    lo.equipment = typeof window.getDefaultEquipment === 'function' ? window.getDefaultEquipment(st.partyBuilds[player][slot]) : {};

    const _mm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
    if (!st.partyMeta[player][slot].customSpells) {
      st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(raceKey, st.partyBuilds[player][slot], st.partyMeta[player][slot].secondaryJob || '');
    }
    st.teamLockedIn = false; if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiCursorMove');
    setPbTab('tech');   // C-1: a picked vessel goes straight to its techniques
    refresh();
  }
  function confirmSlot() { if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; if (!st.builderConfirmedSlots[player]) st.builderConfirmedSlots[player]={}; st.builderConfirmedSlots[player][slot]=true; let thunk=false; try{ thunk = typeof window.playDoorSfx==='function' && window.playDoorSfx('stamp',{volume:0.75})!==false; }catch(e){} if(!thunk) sfx('uiButtonConfirm'); for (let ni=0;ni<teamSize;ni++){const nx=(slot+1+ni)%teamSize;if(!st.builderConfirmedSlots[player][nx]){setSlot(nx);break;}} refresh(); }
  function selectSlot(i) { setSlot(i); st.builderSelectedSlot=i; st.builderSelectedPlayer=player; sfx('uiCursorMove'); refresh(); }
  function doRandomize() { if (typeof window.randomizeUnitSlot==='function') window.randomizeUnitSlot(player,slot); if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiButtonConfirm'); refresh(); }
  function doRandomizeAll() { if (typeof window.randomizeParty==='function') window.randomizeParty(player); if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; st.builderConfirmedSlots[player]={}; for(let i=0;i<teamSize;i++) st.builderConfirmedSlots[player][i]=true; sfx('uiButtonConfirm'); refresh(); }
  function doDefaults() { st.builderConfirmedSlots={}; if (typeof window.defaultAllTeams==='function') window.defaultAllTeams();  const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6; [1,2].forEach(p=>{ if (!st.partyMeta[p]) st.partyMeta[p]=[]; for (let i=0;i<(st.partyBuilds[p]||[]).length;i++){ if (!st.partyMeta[p][i]) st.partyMeta[p][i]={}; const lo=st.loadouts?.[p]?.[i]; if (lo&&Array.isArray(lo.spells)&&lo.spells.filter(Boolean).length>0){ const _ids=lo.spells.filter(Boolean); st.partyMeta[p][i].customSpells=typeof window.trimSpellIdsToSlotBudget==='function'?window.trimSpellIdsToSlotBudget(_ids,st.partyBuilds[p][i]):_ids.slice(0,slotCap); }}}); refresh(); }
  function doBack() { if (typeof window.backToModeSelect==='function') window.backToModeSelect(); }
  function doStart() {
    // Block entering a match with a locked vessel on the local player's team.
    if (typeof window.isUnitUnlocked === 'function') {
      // Check the LOCAL player's team (the online guest builds team 2).
      const size = (st.partyBuilds?.[player] || []).length || teamSize;
      const lockedNames = [];
      for (let i = 0; i < size; i++) {
        const rk = st.partyMeta?.[player]?.[i]?.race || 'homosapien';
        if (!window.isUnitUnlocked(rk)) {
          const lbl = (window.RACE_PROFILES?.[rk]?.label) || rk;
          if (lockedNames.indexOf(lbl) === -1) lockedNames.push(lbl);
        }
      }
      if (lockedNames.length) {
        try { sfx('uiError'); } catch (e) {}
        alert('Your team includes locked vessels: ' + lockedNames.join(', ') + '.\nUnlock them in the Shop or swap them out before starting.');
        return;
      }
    }
    if (typeof window.applyPartyBuild==='function') window.applyPartyBuild();
    if (st.teamLockedIn && typeof window.startMatch==='function') window.startMatch();
  }
  function handleNameChange(val) { if (!st.partyNames) st.partyNames={}; if (!st.partyNames[player]) st.partyNames[player]=[]; st.partyNames[player][slot]=val; }
  function handleZodiacChange(val) { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; st.partyMeta[player][slot].zodiac=val; refresh(); }
  function handleAccChange(accSlot, val) { if (!st.loadouts[player]) st.loadouts[player]=[]; if (!st.loadouts[player][slot]) st.loadouts[player][slot]=typeof window.emptyLoadout==='function'?window.emptyLoadout():{}; if (!st.loadouts[player][slot].equipment) st.loadouts[player][slot].equipment=typeof window.emptyEquipment==='function'?window.emptyEquipment():{}; st.loadouts[player][slot].equipment[accSlot]=val||null; st.teamLockedIn=false; refresh(); }
  function handleSecJobChange(val) { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const prevSec=st.partyMeta[player][slot].secondaryJob||''; st.partyMeta[player][slot].secondaryJob=val;

    const mainJob=st.partyBuilds[player][slot];
    const _mm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;

      st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(unitRace, mainJob, val);
    st.teamLockedIn=false; refresh(); }
  function toggleSpell(spellId) { if (!spellId) return; if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6; const m=st.partyMeta[player][slot]; if (!Array.isArray(m.customSpells)) m.customSpells=[]; const arr=m.customSpells,idx=arr.indexOf(spellId); if(idx>=0)arr.splice(idx,1);else{if(usedSpellSlots(arr)+spellIdSlotCost(spellId)>slotCap){sfx('uiError');return;}arr.push(spellId); if (typeof window.getSpellById==='function') pbPreview(window.getSpellById(spellId), { equip: true });} st.teamLockedIn=false; sfx('uiCursorMove'); refresh(); }
  function resetCustomSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={};
    st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(unitRace, clsName, secJob);
    st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function clearAllSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; st.partyMeta[player][slot].customSpells=[]; st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function randomizeSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6;

    const allJobs = typeof window.JOB_MODIFIERS!=='undefined' ? Object.keys(window.JOB_MODIFIERS) : [];
    const mainJob = st.partyBuilds?.[player]?.[slot] || clsName;
    const secOptions = allJobs.filter(j => j && j !== mainJob && j !== 'Freelancer');
    if (secOptions.length > 0) { st.partyMeta[player][slot].secondaryJob = secOptions[Math.floor(Math.random()*secOptions.length)]; }
    const curSecJob = st.partyMeta[player][slot].secondaryJob || '';
    // Tree classes: a random walk over the tree is the randomizer.
    if (typeof window.classHasSpellTree === 'function' && window.classHasSpellTree(mainJob)
        && typeof window.buildTreeLegalLoadout === 'function') {
      st.partyMeta[player][slot].customSpells = window.buildTreeLegalLoadout(unitRace, mainJob, curSecJob);
      st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); return;
    }
    const raIds=raceAbilities.filter(a=>a.id&&clashSpellOk(a)).map(a=>a.id);

    const freshPool = []; if (typeof window.SPELL_LIBRARY!=='undefined'&&typeof window.isSpellNativeToClass==='function') { for (const sp of Object.values(window.SPELL_LIBRARY)){if(!sp||sp.kind==='basicAttack'||!clashSpellOk(sp))continue;const isM=window.isSpellNativeToClass(sp,mainJob);const isS=curSecJob&&window.isSpellNativeToClass(sp,curSecJob)&&sp.tier!=='III';if(isM||isS){freshPool.push(sp);}}}
    const pool=[...raIds,...freshPool.map(e=>e.id)],shuffled=pool.slice(); for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    const rndPicks=[]; let rndUsed=0; for(const sid of shuffled){const c=spellIdSlotCost(sid); if(rndUsed+c>slotCap)continue; rndPicks.push(sid); rndUsed+=c; if(rndUsed>=slotCap)break;}
    st.partyMeta[player][slot].customSpells=rndPicks; st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function equipAccessory(accId) {
    if (!st.loadouts[player]) st.loadouts[player] = [];
    if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    if (!st.loadouts[player][slot].equipment) st.loadouts[player][slot].equipment = typeof window.emptyEquipment === 'function' ? window.emptyEquipment() : {};
    const eq = st.loadouts[player][slot].equipment;
    if (eq.accessory1 === accId) { eq.accessory1 = null; st.teamLockedIn = false; sfx('uiCursorMove'); refresh(); return; }
    if (eq.accessory2 === accId) { eq.accessory2 = null; st.teamLockedIn = false; sfx('uiCursorMove'); refresh(); return; }
    if (!eq.accessory1) eq.accessory1 = accId;
    else if (!eq.accessory2) eq.accessory2 = accId;
    else eq.accessory1 = accId;
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  function setItemCount(itemKey, delta) {
    if (!st.loadouts[player]) st.loadouts[player] = [];
    if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    if (!st.loadouts[player][slot].items) st.loadouts[player][slot].items = {};
    const items = st.loadouts[player][slot].items;
    const rule = window.ITEM_RULES?.[itemKey];
    if (!rule) return;
    const maxSlots = window.CONFIG?.unitItemSlots || 3;
    const cur = items[itemKey] || 0;
    const totalUsed = Object.values(items).reduce((s,v)=>s+(v||0),0);
    let next = cur + delta;
    if (next < 0) next = 0;
    if (next > (rule.max || 6)) next = rule.max || 6;
    if (delta > 0 && totalUsed >= maxSlots) { sfx('uiError'); return; }
    items[itemKey] = next;
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }

  const mpMode = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
  const isArena = false;
  /* Spell tree (Tree of Life selector): every job except Freelancer picks
     from its 13-node tree; Freelancer keeps the flat pool below until its
     wildcard-socket tree ships. */
  const useTree = !isArena && typeof window.classHasSpellTree === 'function'
    && window.classHasSpellTree(clsName) && typeof window.buildUnitSpellTree === 'function';
  // Freelancer's tree derives socket placement from the equipped list, so
  // the equipped ids are part of the tree's identity (other classes ignore them).
  const unitTree = React.useMemo(() => useTree
    ? window.buildUnitSpellTree(unitRace, clsName, secJob, customSpells || [])
    : null, [useTree, unitRace, clsName, secJob, customSpells, _]);
  const treeSealed = React.useMemo(() => (unitTree && typeof window.treeSealedIds === 'function')
    ? window.treeSealedIds(unitTree) : new Set(), [unitTree]);
  const [treeHoverPath, setTreeHoverPath] = React.useState(null);
  const [treeShake, setTreeShake] = React.useState(null);
  // Freelancer wildcard sockets: which socket's picker is open (node key or null).
  const [flSocketPick, setFlSocketPick] = React.useState(null);
  // Twin nodes (CHAMP_REWORK_PLAN §4): which twin node's picker is open (node key or null).
  const [twinPick, setTwinPick] = React.useState(null);
  React.useEffect(() => { setFlSocketPick(null); setTwinPick(null); }, [player, slot, clsName, unitRace]);
  const treeShakeTimer = React.useRef(null);
  React.useEffect(() => { setTechSel(null); setTechHover(null); setPreviewState(null); }, [player, slot, clsName, unitRace]);
  React.useEffect(() => {
    const cv = window.EWCharViewer;
    if (cv && typeof cv.onState === 'function') cv.onState((ps) => setPreviewState(ps && ps.playing ? ps : null));
    return () => {
      if (cv && typeof cv.onState === 'function') cv.onState(null);
      if (previewHoverTimer.current) clearTimeout(previewHoverTimer.current);
      if (previewNoteTimer.current) clearTimeout(previewNoteTimer.current);
    };
  }, []);
  /* THE MONITOR REACTS (plan §5.3 item 5): the effects layer's post grade,
     aberration kick, screen flash and board shake reach the builder through
     EWCharViewer.onStageFx while a preview runs on the stage. `data-grade`
     = the technique's damage type (the six ENTROPY STRIKE palettes,
     styles-base.css), `--pb-grade-amt` = the beat's strength; 'kick' rolls
     a scanline band down the glass, 'shake' jolts the whole glass. */
  React.useEffect(() => {
    const cv = window.EWCharViewer;
    if (!cv || typeof cv.onStageFx !== 'function') return undefined;
    const retrig = (el, cls, ms) => {
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => { if (el.classList.contains(cls)) el.classList.remove(cls); }, ms);
    };
    cv.onStageFx((kind, o) => {
      const el = crtRef.current;
      if (!el) return;
      o = o || {};
      if (kind === 'grade' || kind === 'flash') {
        const sp = previewSpellRef.current;
        const type = (sp && sp.spellType) || 'anomaly';
        const amt = kind === 'flash'
          ? Math.min(1, (o.peak != null ? o.peak : 0.3) * 1.6)
          : Math.min(1, (o.tintAmt != null ? o.tintAmt : 0.5) + (o.dim || 0) * 0.5);
        const hold = kind === 'flash' ? (o.ms || 180) : ((o.riseMs || 0) + (o.holdMs || 400));
        el.setAttribute('data-grade', type);
        el.style.setProperty('--pb-grade-amt', Math.max(0.15, amt).toFixed(2));
        if (gradeTimer.current) clearTimeout(gradeTimer.current);
        gradeTimer.current = setTimeout(() => { gradeTimer.current = 0; el.removeAttribute('data-grade'); }, hold);
      } else if (kind === 'kick') retrig(el, 'pb-crt-roll-on', 520);
      else if (kind === 'shake') retrig(el, 'pb-crt-jolt', 420);
    });
    return () => {
      cv.onStageFx(null);
      if (gradeTimer.current) { clearTimeout(gradeTimer.current); gradeTimer.current = 0; }
    };
  }, []);
  /* MOVE PREVIEW triggers (plan §5.2 item 6). previewOff: the pause-menu
     Animation toggle or the kill-switch. pbPreview(spOrNull, opts): null =
     the basic attack (root). Hover = after a 180 ms debounce and only when
     idle; click / equip / pick = immediately, restarting any running clip.
     Sprite-only vessels get the NO PREVIEW note instead.
     Stage 3 (§5.3): EVERY trigger — hover, click, equip, ENTER, ▶ — runs
     the animation PLUS the spell's real VFX around the hero
     (EWCharViewer.previewSpell — the effects layer staged in the viewer,
     the hero charging / dashing / blinking when the spell moves it, the
     camera pulled out to hold the whole beat; never the relayed
     VFX3D.fire). Decision C-10 was overruled by the user on 2026-09-09
     ("the vfx always play with the animation"); hover still never cuts a
     beat already running. `opts.equip` adds the DOOR click.
     window.EW_NO_PB_VFX = the Stage 2 animation-only preview. */
  const previewOff = !!(st.animationsDisabled || window.EW_NO_PB_PREVIEW);
  const pbNote = (txt) => {
    setPreviewNote(txt);
    if (previewNoteTimer.current) clearTimeout(previewNoteTimer.current);
    previewNoteTimer.current = setTimeout(() => setPreviewNote(null), 1400);
  };
  const pbPreview = (sp, opts) => {
    opts = opts || {};
    if (previewHoverTimer.current) { clearTimeout(previewHoverTimer.current); previewHoverTimer.current = 0; }
    if (previewOff) { if (!opts.hover) pbNote('PREVIEW OFF'); return; }
    const cv = window.EWCharViewer;
    if (!cv || typeof cv.playSpell !== 'function') return;
    const fire = () => {
      if (!cv.isMounted || !cv.isMounted()) return;
      if (opts.hover && cv.isPlaying && cv.isPlaying()) return;   // hover never cuts a running clip
      previewSpellRef.current = sp || null;
      const stageOn = typeof cv.previewSpell === 'function' && !window.EW_NO_PB_VFX;
      const ms = stageOn
        ? cv.previewSpell(sp, { attack: !sp, name: sp ? sp.name : 'BASIC ATTACK' })
        : cv.playSpell(sp, { attack: !sp, name: sp ? sp.name : 'BASIC ATTACK' });
      if (!ms && !opts.hover) pbNote(cv.hasClips && cv.hasClips() ? 'NO CLIP FOR THIS TECHNIQUE' : 'NO PREVIEW · SPRITE VESSEL');
      if (ms && opts.equip) { try { if (typeof window.playDoorSfx === 'function') window.playDoorSfx('crtOn', { volume: 0.3 }); } catch (e) {} }
    };
    if (opts.hover) previewHoverTimer.current = setTimeout(() => { previewHoverTimer.current = 0; fire(); }, 180);
    else fire();
  };
  const shakeTreeNode = (key) => {
    setTreeShake(key);
    if (treeShakeTimer.current) clearTimeout(treeShakeTimer.current);
    treeShakeTimer.current = setTimeout(() => setTreeShake(null), 350);
  };
  function treeNodeClick(nodeKey) {
    if (!unitTree) return;
    const id = unitTree.nodes[nodeKey];
    if (!id || nodeKey === 'root') return;
    if (treeSealed.has(id)) { sfx('uiError'); return; }
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    if (!Array.isArray(m.customSpells)) m.customSpells = [];
    const arr = m.customSpells;
    const idx = arr.indexOf(id);
    if (idx >= 0) {
      // unequip only if the rest stays root-connected
      const candidate = arr.filter(s => s !== id);
      if (typeof window.isTreeLoadoutLegal === 'function'
          && !window.isTreeLoadoutLegal(unitRace, clsName, secJob, candidate)) {
        sfx('uiError'); shakeTreeNode(nodeKey); return;
      }
      arr.splice(idx, 1);
    } else {
      // equip — one click auto-equips the whole cheapest path (doc §1.3)
      const path = computeTreeEquipPath(unitTree, treeSealed, arr, nodeKey);
      if (!path || !path.length) { sfx('uiError'); shakeTreeNode(nodeKey); return; }
      const newIds = path.map(k => unitTree.nodes[k]).filter(pid => pid && !arr.includes(pid));
      if (arr.length + newIds.length > slotCap) { sfx('uiError'); shakeTreeNode(nodeKey); return; }
      for (const pid of newIds) arr.push(pid);
      const spNow = typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
      if (spNow) pbPreview(spNow, { equip: true });      // the equip plays the cast (+ its VFX, §5.3)
    }
    setTreeHoverPath(null);
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  // The circuit's hover: the technique panel follows it (no floating card —
  // the panel IS the card here), the path lights, the stage previews.
  const treeNodeHoverIn = (nodeKey, sp) => {
    setTechHover(nodeKey);
    const id = unitTree ? unitTree.nodes[nodeKey] : null;
    if (id && !(customSpells || []).includes(id) && !treeSealed.has(id)) {
      const path = computeTreeEquipPath(unitTree, treeSealed, customSpells || [], nodeKey);
      setTreeHoverPath(path && path.length > 1 ? path : null);
    } else setTreeHoverPath(null);
    if (sp || nodeKey === 'root') pbPreview(sp || null, { hover: true });
  };
  const treeNodeHoverOut = () => {
    setTechHover(null); setTreeHoverPath(null);
    if (previewHoverTimer.current) { clearTimeout(previewHoverTimer.current); previewHoverTimer.current = 0; }
  };
  /* Freelancer socket flow: click an open socket → picker overlay; picking a
     spell equips it (customSpells only — placement re-derives). */
  function flEquipWildcard(spellId) {
    if (!spellId) return;
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    if (!Array.isArray(m.customSpells)) m.customSpells = [];
    const arr = m.customSpells;
    if (arr.includes(spellId) || arr.length >= slotCap) { sfx('uiError'); return; }
    const candidate = [...arr, spellId];
    if (typeof window.isTreeLoadoutLegal === 'function'
        && !window.isTreeLoadoutLegal(unitRace, clsName, secJob, candidate)) { sfx('uiError'); return; }
    arr.push(spellId);
    setFlSocketPick(null);
    hideSpellTip();
    if (typeof window.getSpellById === 'function') pbPreview(window.getSpellById(spellId), { equip: true });
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  /* Twin-node flow: the candidate loadout that equips ALTERNATE spellId on
     twin node twinKey — a swap in place when the node's other alternate is
     equipped (never severs: same node), else the cheapest path with the
     chosen alternate on the target node. null = impossible. */
  function twinCandidate(twinKey, spellId) {
    if (!unitTree || !unitTree.alts || !unitTree.alts[twinKey]) return null;
    const pair = unitTree.alts[twinKey];
    if (!pair.includes(spellId) || treeSealed.has(spellId)) return null;
    const arr = customSpells || [];
    const cur = pair.find(id => arr.includes(id));
    if (cur === spellId) return arr.slice();
    if (cur) return arr.map(id => id === cur ? spellId : id);
    const path = computeTreeEquipPath(unitTree, treeSealed, arr, twinKey);
    if (!path || !path.length) return null;
    const newIds = path.map(k => k === twinKey ? spellId : unitTree.nodes[k]).filter(pid => pid && !arr.includes(pid));
    if (arr.length + newIds.length > slotCap) return null;
    return [...arr, ...newIds];
  }
  function twinPickSpell(spellId) {
    if (!twinPick) return;
    const candidate = twinCandidate(twinPick, spellId);
    if (!candidate || (typeof window.isTreeLoadoutLegal === 'function'
        && !window.isTreeLoadoutLegal(unitRace, clsName, secJob, candidate))) { sfx('uiError'); shakeTreeNode(twinPick); return; }
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    m.customSpells = candidate;
    setTwinPick(null);
    setTreeHoverPath(null);
    hideSpellTip();
    if (typeof window.getSpellById === 'function') pbPreview(window.getSpellById(spellId), { equip: true });
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  const flSocketPool = React.useMemo(() => {
    if (!flSocketPick || !unitTree || !unitTree.isFreelancer
        || typeof window.flWildcardPool !== 'function') return [];
    const tiers = (unitTree.sockets && unitTree.sockets[flSocketPick]) || [];
    const tierOf = (sp) => sp.tier === 'III' ? 'III' : sp.tier === 'II' ? 'II' : 'I';
    return window.flWildcardPool(unitRace)
      .filter(sp => tiers.includes(tierOf(sp)) && clashSpellOk(sp))
      .sort((a, b) => (tierOf(a) === tierOf(b) ? 0 : tierOf(a) < tierOf(b) ? -1 : 1)
        || pbCatRank(a) - pbCatRank(b) || (a.name || '').localeCompare(b.name || ''));
  }, [flSocketPick, unitTree, unitRace, _]);
  const spellPool = React.useMemo(() => { if (typeof window.SPELL_LIBRARY==='undefined') return []; const mainJob=clsName,secJ=secJob,pool=[]; for (const sp of Object.values(window.SPELL_LIBRARY)){if(!sp||sp.kind==='basicAttack'||!clashSpellOk(sp))continue;const isM=typeof window.isSpellNativeToClass==='function'&&window.isSpellNativeToClass(sp,mainJob);const isS=secJ&&typeof window.isSpellNativeToClass==='function'&&window.isSpellNativeToClass(sp,secJ)&&sp.tier!=='III';if(isM||isS){pool.push(sp);}} return pool; }, [clsName, secJob, _]);

  const numerals = ['I','II','III','IV','V','VI','VII','VIII'];
  const unitName = resolveUnitName(player, slot, clsName);
  const allAccIds = typeof window.EQUIP_DEFS!=='undefined' ? Object.keys(window.EQUIP_DEFS).filter(id=>{const d=window.EQUIP_DEFS[id];return d&&(d.slot==='accessory1'||d.slot==='accessory2');}) : [];
  const allItemKeys = (typeof window.ITEM_RULES!=='undefined' ? Object.keys(window.ITEM_RULES) : [])
    .filter(k => k !== 'warpStone' || !(typeof window._isClashMode === 'function' && window._isClashMode()));
  const itemSlotMax = window.CONFIG?.unitItemSlots || 3;
  const totalItemsUsed = Object.values(unitItems).reduce((s,v)=>s+(v||0),0);
  // Item counts expanded into per-slot units for the RPG-style slot squares.
  const itemUnits = [];
  for (const k of allItemKeys) { const c = unitItems[k] || 0; for (let n = 0; n < c && itemUnits.length < itemSlotMax; n++) itemUnits.push(k); }
  const fbDef = window.FACTION_BONUSES?.[unitFaction];
  const factionBonusTxt = fbDef ? (fbDef.atkBonus ? '+' + fbDef.atkBonus + ' ATK' : fbDef.healBonus ? '+' + fbDef.healBonus + ' HEAL' : fbDef.armorBonus ? '+' + fbDef.armorBonus + ' ARMOR' : '') : '';
  const spellSlotsUsed = learnedSpells.reduce((s, sp) => s + spellSlotCost(sp), 0);
  const zodiacs = typeof window.AVAILABLE_ZODIACS!=='undefined' ? window.AVAILABLE_ZODIACS : ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const codexLore = getCodexLore(unitRace);
  const raceClass = typeof window.RACE_CLASS !== 'undefined' ? window.RACE_CLASS[unitRace] : 'hybrid';
  const classLabel = CODEX_CLASS_LABELS[raceClass] || 'MULTI-ROLE';
  const slotCap = typeof window.SPELL_SLOT_MAX !== 'undefined' ? window.SPELL_SLOT_MAX : 6;
  const docNum = 'EW-' + (Math.abs((unitRace||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)*7)%9000+1000);

  /* ══ THE FORGE TERMINAL — one CRT monitor, four tabs, the party as a row
     (PARTY_BUILDER_PLAN §4 anatomy, §5.1 Stage 1). Chrome = the match-select
     `.ms-crt` classes (styles-base.css "THE TERMINAL"), the forge's own
     overrides live in "THE FORGE TERMINAL" (`.ms-crt-forge`, `.pb-*`).
     The STAGE (the hero) is rendered ONCE with a stable key and placed by
     grid-area — EWCharViewer is a singleton canvas and must never remount
     when a tab changes. ══ */
  const raceLabelTxt = _grl(unitRace, identity.gender) || unitRace;
  const officer = pbOfficer();
  const anyWindow = !!(equipPicker || showTeamModal || pbMenu || notesOpen || (twinPick && unitTree && unitTree.alts && unitTree.alts[twinPick]) || (flSocketPick && unitTree && unitTree.isFreelancer));
  // the wall's hover → the stage (Stage 4); cleared on leave, on a pick and off the ROSTER tab
  const rosterHoverIn = (entry) => {
    if (rosterHoverTimer.current) clearTimeout(rosterHoverTimer.current);
    rosterHoverTimer.current = setTimeout(() => { rosterHoverTimer.current = 0; setRosterHover(entry); }, 220);
  };
  const rosterHoverOut = () => {
    if (rosterHoverTimer.current) { clearTimeout(rosterHoverTimer.current); rosterHoverTimer.current = 0; }
    setRosterHover(null);
  };
  React.useEffect(() => { if (pbTab !== 'roster' && rosterHover) rosterHoverOut(); }, [pbTab]);
  React.useEffect(() => () => { if (rosterHoverTimer.current) clearTimeout(rosterHoverTimer.current); }, []);
  const stageEntry = (pbTab === 'roster' && rosterHover) ? rosterHover : null;
  const stageRace = stageEntry ? stageEntry.race : unitRace;
  const stageGender = stageEntry ? (stageEntry.gender || 'male') : (identity.gender || 'male');
  const stageCls = stageEntry ? stageEntry.cls : clsName;
  const stageFaction = stageEntry ? (stageEntry.faction || unitFaction) : unitFaction;
  const stageLabel = stageEntry ? (stageEntry.label || _grl(stageEntry.race, stageEntry.gender)) : raceLabelTxt;
  const closeWindows = () => { setEquipPicker(null); setShowTeamModal(false); setTwinPick(null); setFlSocketPick(null); setPbMenu(null); setNotesOpen(false); hideSpellTip(); };
  const selectPlayer = (p) => { if (p === player) return; st.builderSelectedPlayer = p; st.builderSelectedSlot = 0; setSlot(0); sfx('uiCursorMove'); refresh(); };
  const backOut = () => {
    if (standalone) {
      if (tbView === 'locker') { if (typeof window._teamBuilderBack === 'function') window._teamBuilderBack(); }
      else { setTbView('locker'); sfx('uiCursorMove'); refresh(); }
    } else doBack();
  };

  /* keyboard (plan §7): tabs, the row, ESC. Never while typing in a field. */
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      /* 2026-09-09 (found by playtest_builder.js): TWO forges can be mounted
         at once — the pre-match one sleeps in #builderOverlay under the
         title overlay while the standalone one is up in #teamBuilderPage
         (and the other way round). Each instance used to answer every key,
         so ESC in the archive backed the HIDDEN pre-match forge out to the
         match-select terminal. Only the instance on screen takes a key. */
      const root = crtRef.current;
      if (!root || !root.isConnected) return;
      if (standalone) { if (!root.closest('#teamBuilderPage.active')) return; }
      else {
        const so = document.getElementById('startOverlay');
        if (so && so.isConnected && !so.classList.contains('hidden') && getComputedStyle(so).display !== 'none') return;   // a title page is in front
      }
      const k = e.key;
      if (k === 'Escape') {
        e.preventDefault();
        if (anyWindow) closeWindows(); else backOut();
        return;
      }
      if (anyWindow || (standalone && tbView === 'locker')) return;
      const onButton = t && t.tagName === 'BUTTON';
      const circuitKeys = pbTab === 'tech' && !!unitTree;   // the circuit owns the arrows on TECHNIQUES (SHIFT+← → still walks the row)
      if (k === 'q' || k === 'Q' || k === '[') { e.preventDefault(); cycleTab(-1); }
      else if (k === 'e' || k === 'E' || k === ']') { e.preventDefault(); cycleTab(1); }
      else if (k >= '1' && k <= '4' && PB_TABS[+k - 1]) { e.preventDefault(); setTab(PB_TABS[+k - 1].id); }
      else if (circuitKeys && !e.shiftKey && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight')) {
        e.preventDefault();
        const dir = k === 'ArrowUp' ? 'up' : k === 'ArrowDown' ? 'down' : k === 'ArrowLeft' ? 'left' : 'right';
        const next = techSel ? treeStepKey(techSel, dir) : 'root';
        if (next !== techSel) {
          setTechSel(next); setTechHover(null); sfx('uiCursorMove');
          const nid = next === 'root' ? null : unitTree.nodes[next];
          const nsp = nid && typeof window.getSpellById === 'function' ? window.getSpellById(nid) : null;
          if (nsp || next === 'root') pbPreview(nsp, { hover: true });
        }
      }
      else if (k === 'ArrowLeft') { e.preventDefault(); selectSlot((slot - 1 + teamSize) % teamSize); }
      else if (k === 'ArrowRight') { e.preventDefault(); selectSlot((slot + 1) % teamSize); }
      else if (circuitKeys && techSel && !onButton && k === 'Enter') { e.preventDefault(); techVerb(pbTechInfo(unitTree, treeSealed, customSpells || [], techSel, slotCap)); }
      else if (circuitKeys && techSel && k === 'Backspace') {
        e.preventDefault();
        if (treeNodeState(unitTree, treeSealed, customSpells || [], techSel) === 'equipped') treeNodeClick(techSel); else sfx('uiError');
      }
      else if (circuitKeys && !onButton && k === ' ') {
        e.preventDefault();
        const info = pbTechInfo(unitTree, treeSealed, customSpells || [], techHover || techSel, slotCap);
        if (info && info.st8 !== 'empty' && info.st8 !== 'socket') pbPreview(info.sp || null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* THE TECHNIQUE PANEL's verb (plan §5.2 item 3): the same thing a click
     on the chip does — treeNodeClick / the twin picker / the socket picker. */
  const techVerb = (info) => {
    if (!info || !unitTree) return;
    const { st8, key } = info;
    if (st8 === 'socket') { if (unitTree.isFreelancer) { setFlSocketPick(key); sfx('uiCursorMove'); } return; }
    if (st8 === 'equipped') { treeNodeClick(key); return; }
    if (st8 === 'reachable' || st8 === 'far') {
      if (info.twin && !isArena) { setTwinPick(key); sfx('uiCursorMove'); return; }
      if (info.overCap) { sfx('uiError'); shakeTreeNode(key); return; }
      treeNodeClick(key); return;
    }
    sfx('uiError');
  };
  const techInfo = (useTree && unitTree) ? pbTechInfo(unitTree, treeSealed, customSpells || [], techHover || techSel, slotCap) : null;

  /* ── HEAD: one row — the seal + FORGE-1, the tabs (L1 / R1 caps), the mode · slots, ESC ── */
  const tabbar = h('div', { className: 'pb-tabbar' },
    h('button', { className: 'pb-tabcap', onClick: () => cycleTab(-1), title: 'Previous tab · Q or [' }, '◂ L1'),
    h('div', { className: 'pb-tabs', role: 'tablist' },
      ...PB_TABS.map((t, i) => h('button', { key: t.id, role: 'tab', 'aria-selected': t.id === pbTab,
        className: 'pb-tab' + (t.id === pbTab ? ' on' : ''), onClick: () => setTab(t.id), title: (t.hint || '') + ' · key ' + (i + 1) },
        h('i', null, String(i + 1)), t.label))),
    h('button', { className: 'pb-tabcap', onClick: () => cycleTab(1), title: 'Next tab · E or ]' }, 'R1 ▸'));
  const head = h('div', { className: 'ms-tty-head pb-head' },
    h(DoorSeal, { size: 20 }),
    h('b', null, 'ENTROPY WARS'),
    h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, standalone ? 'SQUAD MANIFESTS' : 'FORGE-1'),
    tabbar,
    h('span', { className: 'pb-head-right' },
      h('span', null, teamSize + ' SLOTS · ' + (standalone ? 'TEAM ARCHIVE' : (mpMode?.label || 'BATTLE').toUpperCase())),
      h('span', { className: 'ms-tty-sep' }, '·'), h('span', { className: 'ms-tty-esc' }, 'ESC · BACK')));

  /* ── the pieces, moved into their tabs unchanged inside ── */
  // ROSTER: the Codex of Vessels — filter row + the wall
  /* ROSTER — THE WALL (Stage 4, §5.4): the champ-select grid. One flat
     wall (C-4) of square tiles with --pb-r corners — the 128×128 portrait
     when the vessel has one, else the sprite bottom-anchored — a faction
     ring on hover / active, the type dots, ★ favourite, 🔒 → the Shop.
     Filters as ROUND chips: six type discs, three faction rings, the SORT
     and JOB pills open glass windows (C-9: no native <select> on the
     glass), search is a pill input. filteredRoster / rosterEntries /
     pickRace / isLockedEntry / toggleFav are unchanged. Hover → the stage
     (rosterHoverIn). */
  const sortLabelTxt = sortKey === 'label' ? ('NAME ' + (sortDir === 'asc' ? 'A–Z' : 'Z–A')) : (statLabel(sortKey) + (sortDir === 'desc' ? ' ↓' : ' ↑'));
  const rosterMenu = pbMenu === 'sort'
    ? h(PbWindow, { title: 'SORT THE WALL', sub: sortLabelTxt, onClose: () => setPbMenu(null), zone: true, width: 300 },
        h('div', { className: 'pb-menu-list' },
          ...STAT_KEYS.map(k => [['desc', '↓'], ['asc', '↑']].map(([d, arrow]) =>
            h('button', { key: k + d, className: 'pb-menu-row' + (sortKey === k && sortDir === d ? ' on' : ''), onClick: () => { setSortKey(k); setSortDir(d); setPbMenu(null); sfx('uiCursorMove'); } },
              h('i', null, arrow), statLabel(k), h('small', null, d === 'desc' ? 'HIGHEST FIRST' : 'LOWEST FIRST')))).flat(),
          h('button', { key: 'la', className: 'pb-menu-row' + (sortKey === 'label' && sortDir === 'asc' ? ' on' : ''), onClick: () => { setSortKey('label'); setSortDir('asc'); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, 'A'), 'NAME', h('small', null, 'A – Z')),
          h('button', { key: 'ld', className: 'pb-menu-row' + (sortKey === 'label' && sortDir === 'desc' ? ' on' : ''), onClick: () => { setSortKey('label'); setSortDir('desc'); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, 'Z'), 'NAME', h('small', null, 'Z – A'))))
    : pbMenu === 'job'
    ? h(PbWindow, { title: 'FILTER BY JOB', sub: jobFilter ? getJobDisplay(jobFilter) : 'EVERY JOB', onClose: () => setPbMenu(null), zone: true, width: 320 },
        h('div', { className: 'pb-menu-list' },
          h('button', { key: 'all', className: 'pb-menu-row' + (!jobFilter ? ' on' : ''), onClick: () => { setJobFilter(null); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, '∗'), 'ALL JOBS'),
          ...availableJobs.map(j => h('button', { key: j, className: 'pb-menu-row' + (jobFilter === j ? ' on' : ''), onClick: () => { setJobFilter(j); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, getJobDisplay(j).charAt(0)), getJobDisplay(j)))))
    : null;
  const rosterPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head pb-wall-head' },
      h('b', null, 'Codex of Vessels'),
      h('span', { className: 'pb-wall-count' }, filteredRoster.length, ' / ', rosterEntries.length),
      DOOR && h('span', { className:'door-hdr-sub pb-wall-sub' }, 'D.O.O.R. RECORDS · ENTITY REGISTRY'),
      h('div', { style: { flex: 1 } }),
      h('input', { className: 'pb-pill-input', placeholder:'SEARCH…', value:rosterSearch, onChange:e=>setRosterSearch(e.target.value), 'aria-label': 'Search the wall' }),
      h('button', { className: 'pb-pill-btn' + (pbMenu === 'sort' ? ' on' : ''), onClick: () => setPbMenu(pbMenu === 'sort' ? null : 'sort'), title: 'Sort the wall' }, '⇅ ', sortLabelTxt),
      h('button', { className: 'pb-pill-btn' + (jobFilter || pbMenu === 'job' ? ' on' : ''), onClick: () => setPbMenu(pbMenu === 'job' ? null : 'job'), title: 'Filter by job' }, jobFilter ? getJobDisplay(jobFilter).toUpperCase() : 'ALL JOBS', ' ▾')),
    h('div', { className: 'pb-wall-filters' },
      h('span', { className: 'pb-wall-flabel' }, 'TYPE'),
      ...['human','alien','divine','unholy','tech','anomaly'].map(t => {
        const on = typeFilter === t, c = getTypeColor(t);
        const has = availableTypes.includes(t);
        return h('button', { key: t, className: 'pb-type-disc' + (on ? ' on' : '') + (has ? '' : ' none'), style: { '--tc': c }, disabled: !has,
          onClick: () => setTypeFilter(on ? null : t), title: t.toUpperCase() + (has ? '' : ' — none on the wall') }, PB_TYPE_GLYPH[t] || t.slice(0, 2).toUpperCase());
      }),
      h('span', { className: 'pb-wall-fsep' }),
      h('span', { className: 'pb-wall-flabel' }, 'FACTION'),
      ...['space','time','chaos'].map(fk => h('button', { key: fk, className: 'pb-faction-ring' + (factionFilter === fk ? ' on' : ''), style: { '--fc': FACTION_C[fk] },
        onClick: () => setFactionFilter(factionFilter === fk ? null : fk), title: fk.toUpperCase() }, fk)),
      (typeFilter || factionFilter || jobFilter || rosterSearch) ? h('button', { className: 'pb-pill-btn danger', onClick: () => { setTypeFilter(null); setFactionFilter(null); setJobFilter(null); setRosterSearch(''); }, title: 'Clear every filter' }, '✕ CLEAR') : null),
    h('div', { className: 'pb-roster', onMouseLeave: rosterHoverOut },
      filteredRoster.map((entry, ei) => {
        const isActive = entry.race===unitRace && entry.gender===(identity.gender||'male') && (entry.race!=='homosapien'||entry.cls===clsName);
        const entryFc = getFactionColor(entry.faction);
        const starred = isFav(entry.race, entry.gender);
        // Account-unlock gate: only the local human's roster (player 1) is restricted.
        const locked = isLockedEntry(entry.race);
        const onCardClick = locked
          ? ()=>{ try{ sfx('uiError'); }catch(e){} if (typeof window._goToShop==='function') window._goToShop(entry.race); }
          : ()=>{ rosterHoverOut(); pickRace(entry.race,entry.gender,entry.job); };
        const pUrl = (typeof window.getUnitPortraitUrl === 'function') ? window.getUnitPortraitUrl({ race: entry.race, gender: entry.gender }) : null;
        const hovered = !!(rosterHover && rosterHover.race === entry.race && rosterHover.gender === entry.gender && rosterHover.cls === entry.cls);
        return h('div', { key:ei, onClick:onCardClick, onMouseEnter: () => rosterHoverIn(entry), title: locked?'NOT DECLASSIFIED — unlock this vessel in the Shop':`${entry.label} · ${getJobDisplay(entry.cls)}`,
            className:'pb-rtile'+(locked?' locked':'')+(isActive?' on':'')+(hovered?' hover':''), style:{ '--fc': entryFc } },
          h('div', { className: 'pb-rtile-art' + (pUrl ? ' portrait' : '') },
            pUrl ? h('div', { className: 'pb-rtile-portrait', style: { backgroundImage: `url('${pUrl}')` } })
                 : h(Sprite, { race:entry.race, gender:entry.gender, cls:entry.cls, size:'88%', style:{ width:'88%', height:'88%' } }),
            locked ? h('div', { className: 'pb-rtile-lock' }, '🔒') : null,
            !locked ? h('button', { className: 'pb-rtile-star' + (starred ? ' on' : ''), onClick:e=>{e.stopPropagation();toggleFav(entry.race,entry.gender);}, title: starred ? 'Unfavourite' : 'Favourite' }, starred ? '★' : '☆') : null,
            h('div', { className: 'pb-rtile-types' }, ...(entry.types || []).slice(0, 3).map((t, ti) => h('i', { key: ti, style: { background: getTypeColor(t) }, title: String(t).toUpperCase() })))),
          h('div', { className: 'pb-rtile-name' }, entry.label),
          h('div', { className: 'pb-rtile-job' }, getJobDisplay(entry.cls)));
      })),
    rosterMenu);

  // TECHNIQUES: the abilities head, the tree (or the rack + flat pool fallback), the node picker
  const techPanel = h(React.Fragment, null,
    // one bar: the tab's name, the slot pips, the three tools — nothing else
    h('div', { className: 'pb-tech-bar' },
      h('b', null, 'TECHNIQUES'),
      h('span', { className: 'pb-pips' + (spellSlotsUsed > slotCap ? ' over' : ''), title: spellSlotsUsed + ' of ' + slotCap + ' slots filled' },
        ...Array.from({ length: Math.max(slotCap, spellSlotsUsed) }).map((_, i) => h('i', { key: i, className: i < spellSlotsUsed ? 'on' : '' })),
        h('small', null, spellSlotsUsed + '/' + slotCap)),
      h('div', { style:{flex:1} }),
      !isArena&&h('button',{onClick:randomizeSpells,className:'pb-mini',title:'Random legal loadout'},'RND'),
      !isArena&&h('button',{onClick:resetCustomSpells,className:'pb-mini',title:'Default loadout'},'RST'),
      !isArena&&h('button',{onClick:clearAllSpells,className:'pb-mini danger',title:'Unequip everything'},'CLR')),
    h('div', { className: 'pb-zone-body', style: { padding: '6px 4px 6px 2px' } },

      // ── equipped loadout: fixed 6-slot rack. Tree classes DON'T get
      //    this — the tree (lit nodes + pips) IS the loadout display;
      //    the rack only remains for the flat-pool fallback (Freelancer,
      //    or a race/class the tree fns can't build). ──
      !(useTree&&unitTree)&&h('div', { className:'pbx-slotrack', style:{ maxHeight:'48%', overflow:'hidden' } },
        h('div', { className:'pbx-slotrack-head' },
          h('span', { style:{ fontSize:10, color:'#79d99a', letterSpacing:'0.16em', fontWeight:700 } }, '🔒 EQUIPPED — SPELL SLOTS'),
          h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em', marginLeft:'auto' } }, spellSlotsUsed, ' / ', slotCap, ' SLOTS FILLED')),
        h('div', { className:'pbx-slotrack-body' },
        (()=>{
          const SLOT_H = 44, GAP = 3;   // battle-parity row height (.pbx-blade)
          let slotNo = 1;
          const rows = learnedSpells.map((sp, si) => {
            const sc = spellSlotCost(sp);
            const slotNums = [];
            for (let k = 0; k < sc; k++) slotNums.push(String(slotNo + k));
            slotNo += sc;
            const isRA = !!(raceAbilities.find(a => a.id && a.id === sp.id));
            const heightPx = sc * SLOT_H + (sc - 1) * GAP;
            return h(SpellBlade, { key: sp.id || si, sp, slotNums, heightPx, equippedSlot:true, raceAbility: isRA,
              onClick: !isArena ? ()=>toggleSpell(sp.id) : undefined,
              onHoverIn: e=>showSpellTip(sp, e), onHoverOut: hideSpellTip });
          });
          for (let si = spellSlotsUsed; si < slotCap; si++) rows.push(h(SpellBlade, { key:'empty-'+si, empty:true, slotNums:[String(si+1)], heightPx:SLOT_H }));
          if (spellSlotsUsed > slotCap) rows.push(h('div', { key:'overbudget', style:{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', margin:'0 6px 0 4px', background:'rgba(255,120,120,0.08)', borderLeft:'3px solid rgba(255,120,120,0.6)', fontSize:10, color:EW.bad } },
            h('span', { style:{flex:1} }, 'OVER BUDGET — remove spells (extras are dropped in battle)')));
          return rows;
        })())),

      // ── SUBCLASS — flat-pool classes pick it here (it feeds the pool);
      //    tree classes pick via the tree's right pillar head, and every
      //    class also has it on the GEAR tab. ──
      !isArena && !(useTree&&unitTree) && clsName!=='Freelancer' && h('div', { className:'pbx-subbar', style:{ '--cat': fc, flexShrink:0 }, onClick:()=>{ setEquipPicker('subjob'); sfx('uiCursorMove'); }, title:'A second job: its spells join this spell pool and its training shifts your stats.' },
        h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.16em', flexShrink:0 } }, 'SUBCLASS'),
        h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:14, fontWeight:700, color:EW.ink, letterSpacing:'0.04em', whiteSpace:'nowrap' } }, secJob ? getJobDisplay(secJob) : '— None —'),
        h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.04em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0, flex:1 } }, 'adds its spells to the pool below · shifts stats'),
        h('span', { style:{ fontSize:10, color:fc, letterSpacing:'0.1em', flexShrink:0 } }, '▾ CHANGE')),

      // ── the spell tree (every job — Freelancer gets wildcard sockets) ──
      useTree&&unitTree&&h(React.Fragment, null,
        h('div', { className: 'pb-circuit-scroll', onMouseLeave: treeNodeHoverOut },
          h(SpellTreePanel, { tree: unitTree, sealed: treeSealed, equipped: customSpells || [],
            slotCap, fc, clsName, secJob,
            raceLabel: (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace),
            onNodeClick: treeNodeClick, onNodeHoverIn: treeNodeHoverIn, onNodeHoverOut: treeNodeHoverOut,
            hoverPath: treeHoverPath, shakeKey: treeShake,
            selKey: techSel, onSelect: (key) => setTechSel(key),
            onOpenSubjob: (!isArena && !unitTree.isFreelancer) ? () => { setEquipPicker('subjob'); sfx('uiCursorMove'); } : undefined,
            onSocketClick: unitTree.isFreelancer ? (key) => { setFlSocketPick(key); sfx('uiCursorMove'); } : undefined,
            onTwinPick: (unitTree.alts && Object.keys(unitTree.alts).length) ? (key) => { setTwinPick(key); sfx('uiCursorMove'); } : undefined })),
        null),

      // ── flat pool — FALLBACK only (tree fns unavailable) ──
      (!useTree&&!isArena&&(spellPool.length>0||raceAbilities.length>0))&&h(React.Fragment, null,
        h('div', { style:{ display:'flex', alignItems:'center', gap:6, flexShrink:0, margin:'6px 6px 3px 10px', paddingTop:6, borderTop:`1px solid ${EW.panelEdge}` } },
          h('span', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.16em' } }, 'SPELL POOL'),
          h('span', { style:{ fontSize:9, color:`${fc}bb`, letterSpacing:'0.08em', textTransform:'uppercase' } }, getJobDisplay(clsName), secJob ? ' + ' + getJobDisplay(secJob) : ''),
          h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em', marginLeft:'auto' } }, spellPool.length + raceAbilities.length, ' AVAILABLE · CLICK TO EQUIP')),
        h('div', { style:{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:3, paddingTop:2, paddingBottom:2 } },
          (()=>{
            // Build one sortable pool (race abilities + class spells), then
            // order by: fits-first → race abilities → category (damage first)
            // → power desc → name. Won't-fit spells sink to the bottom.
            const entries = [];
            raceAbilities.forEach((a, ai) => {
              const raId = a.id || `ra_${unitRace}_${ai}`;
              const selected = customSpells ? customSpells.includes(raId) : false;
              const cantFit = !selected && a.id && (spellSlotsUsed + spellIdSlotCost(a.id)) > slotCap;
              entries.push({ key:'ra-'+ai, sp:a, isRA:true, hasId:!!a.id, id:raId, selected, cantFit:!!cantFit });
            });
            spellPool.forEach(sp => {
              const selected = customSpells ? customSpells.includes(sp.id) : false;
              const cantFit = !selected && (spellSlotsUsed + spellSlotCost(sp)) > slotCap;
              entries.push({ key:sp.id, sp, isRA:false, hasId:true, id:sp.id, selected, cantFit:!!cantFit });
            });
            entries.sort((a, b) => {
              if (a.cantFit !== b.cantFit) return a.cantFit ? 1 : -1;   // dim → bottom
              if (a.isRA !== b.isRA) return a.isRA ? -1 : 1;            // race abilities lead
              const cr = pbCatRank(a.sp) - pbCatRank(b.sp);            // category buckets
              if (cr) return cr;
              const pw = pbPowerVal(b.sp) - pbPowerVal(a.sp);         // power desc
              if (pw) return pw;
              return (a.sp.name || '').localeCompare(b.sp.name || '');
            });
            const nodes = [];
            let dimHeaderShown = false;
            entries.forEach(en => {
              if (en.cantFit && !dimHeaderShown) {
                dimHeaderShown = true;
                nodes.push(h('div', { key:'dimhdr', style:{ display:'flex', alignItems:'center', gap:6, margin:'8px 9px 1px 10px', flexShrink:0, fontSize:8, letterSpacing:'0.12em', color:EW.inkDim, textTransform:'uppercase', whiteSpace:'nowrap' } },
                  h('span', null, "Won't fit remaining slots"),
                  h('span', { style:{ flex:1, height:1, background:EW.panelEdge } })));
              }
              nodes.push(h(SpellBlade, { key:en.key, sp:en.sp, pool: en.isRA ? !!en.hasId : true, raceAbility: en.isRA || undefined, equipped:en.selected, dim:en.cantFit,
                onClick: en.isRA ? (en.hasId && !isArena ? ()=>toggleSpell(en.id) : undefined) : ()=>toggleSpell(en.id),
                onHoverIn: e=>showSpellTip(en.sp, e), onHoverOut: hideSpellTip }));
            });
            return nodes;
          })())),

      isArena&&raceAbilities.length>0&&h('div',{style:{marginTop:3,borderTop:`1px solid ${EW.panelEdge}`,paddingTop:5,display:'flex',flexDirection:'column',gap:3}},
        h('span',{style:{fontSize:10,color:'rgba(200,180,150,0.6)',letterSpacing:'0.1em',marginBottom:1,paddingLeft:10}},'RACE ABILITIES'),
        raceAbilities.map((a,ai)=>h(SpellBlade,{key:ai,sp:a,raceAbility:true,onHoverIn:e=>showSpellTip(a,e),onHoverOut:hideSpellTip})))),

    // ── node picker: ONE window for Freelancer wildcard sockets AND twin
    //    nodes (CHAMP_REWORK_PLAN §10 decision 10 — one UI, not two) ──
    (() => {
      if (!unitTree) return null;
      const twinOpen = twinPick && unitTree.alts && unitTree.alts[twinPick];
      const socketOpen = !twinOpen && flSocketPick && unitTree.isFreelancer;
      if (!twinOpen && !socketOpen) return null;
      const close = () => { setTwinPick(null); setFlSocketPick(null); hideSpellTip(); };
      let title, sub, rows;
      if (twinOpen) {
        const pair = unitTree.alts[twinPick];
        const curAlt = pair.find(id => (customSpells || []).includes(id)) || null;
        title = '⇄ TWIN NODE';
        sub = 'RING ' + twinPick.slice(1) + ' · TWO SPELLS, ONE SLOT' + (curAlt ? ' · SWAPS IN PLACE' : ' · PICK ONE');
        rows = pair.map(id => typeof window.getSpellById === 'function' ? window.getSpellById(id) : null).filter(Boolean).map(sp => {
          const already = sp.id === curAlt;
          const cand = already ? null : twinCandidate(twinPick, sp.id);
          const cantEquip = !already && (!cand || (typeof window.isTreeLoadoutLegal === 'function'
                && !window.isTreeLoadoutLegal(unitRace, clsName, secJob, cand)));
          return h(SpellBlade, { key: sp.id, sp, pool:true, raceAbility:true, equipped: already, dim: cantEquip,
            onClick: () => (already ? close() : twinPickSpell(sp.id)),
            onHoverIn: e=>showSpellTip(sp, e), onHoverOut: hideSpellTip });
        });
      } else {
        title = '＋ WILDCARD SOCKET';
        sub = 'TIER ' + (((unitTree.sockets||{})[flSocketPick]||[]).join(' / ')) + ' · ANY JOB';
        rows = flSocketPool.map(sp => {
          const already = (customSpells || []).includes(sp.id);
          const cantEquip = already || (customSpells || []).length >= slotCap
            || (typeof window.isTreeLoadoutLegal === 'function'
                && !window.isTreeLoadoutLegal(unitRace, clsName, secJob, [...(customSpells || []), sp.id]));
          return h(SpellBlade, { key: sp.id, sp, pool:true, equipped: already, dim: cantEquip && !already,
            onClick: () => flEquipWildcard(sp.id),
            onHoverIn: e=>showSpellTip(sp, e), onHoverOut: hideSpellTip });
        });
      }
      return h(PbWindow, { title, sub, onClose: close, zone: true }, rows);
    })());

  // GEAR: gear circles · item circles · subclass · name · zodiac
  const gearPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head' },
      h('b', null, 'Gear'),
      h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.14em', marginLeft:'auto' } }, totalItemsUsed, '/', itemSlotMax, ' ITEMS CARRIED')),
    h('div', { className: 'pb-zone-body pb-gear' },
      h('button', { className: 'ms-tty-btn primary', onClick: () => setCreatorOpen(true) }, 'CHARACTER CREATOR'),
      h('div', { className: 'pb-gear-row' },
        h('div', { className: 'pb-gear-label' }, 'GEAR', h('small', null, 'TWO SLOTS')),
        h('div', { className: 'pb-gear-slots' },
          ['accessory1','accessory2'].map(sk => {
            const accId = unitEquipment[sk];
            const def = accId ? window.EQUIP_DEFS?.[accId] : null;
            return h(EquipSlotBox, { key:sk, size:64, accent:fc,
              filled:!!def, icon:def ? (ACC_ICONS[accId]||'\u{1F392}') : null,
              label:def ? def.label : '', title:def ? `${def.label} — ${def.desc}` : 'Equip gear',
              onClick:()=>{ setEquipPicker(sk); sfx('uiCursorMove'); },
              onClear:def ? ()=>handleAccChange(sk, null) : null });
          }))),
      h('div', { className: 'pb-gear-row' },
        h('div', { className: 'pb-gear-label' }, 'ITEMS', h('small', null, itemSlotMax + ' SLOTS')),
        h('div', { className: 'pb-gear-slots' },
          Array.from({length:itemSlotMax}).map((_, ii) => {
            const ik = itemUnits[ii];
            const rule = ik ? window.ITEM_RULES?.[ik] : null;
            return h(EquipSlotBox, { key:ii, size:64, accent:fc,
              filled:!!rule, icon:rule ? (rule.icon||'\u{1F4E6}') : null,
              label:rule ? rule.name : '', title:rule ? `${rule.name} — ${rule.desc}` : 'Add an item',
              onClick:()=>{ setEquipPicker('item'); sfx('uiCursorMove'); },
              onClear:rule ? ()=>setItemCount(ik, -1) : null });
          }))),
      // SUBCLASS — a pill (Stage 5); the same picker the tree's right pillar opens (handleSecJobChange as today)
      !isArena && clsName!=='Freelancer' && h('div', { className: 'pb-gear-row', style:{ marginTop: 4 } },
        h('div', { className: 'pb-gear-label' }, 'SUBCLASS', h('small', null, 'A SECOND JOB')),
        h('button', { className:'pb-sub-pill', style:{ '--cat': fc }, onClick:()=>{ setEquipPicker('subjob'); sfx('uiCursorMove'); }, title:'A second job: its spells join this spell pool and its training shifts your stats.' },
          h('b', null, secJob ? getJobDisplay(secJob) : '— None —'),
          h('span', null, 'its spells join the tree · its training shifts stats'),
          h('i', null, '▾ CHANGE'))),
      clsName==='Freelancer' && h('div', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.08em', fontStyle:'italic', padding:'4px 2px' } }, 'A Freelancer has no subclass — its wildcard sockets borrow any job\'s spell.'),
      h('div', { className: 'pb-gear-row', style:{ marginTop: 6 } },
        h('div', { className: 'pb-gear-label' }, 'NAME', h('small', null, 'THE MANIFEST')),
        h('input', { key:player+'-'+slot, className:'pb-gear-input', defaultValue:unitName, maxLength:24, onBlur:e=>{ handleNameChange(e.target.value); refresh(); }, onKeyDown:e=>{ if(e.key==='Enter') e.target.blur(); } })),
      // ZODIAC — a wheel of twelve round glyph chips (Stage 5, §5.5 item 4; handleZodiacChange as the <select> did)
      (() => {
        const cur = identity.zodiac || 'aries';
        const el = PB_ZODIAC_ELEMENT[cur] || 'air';
        const read = PB_ZODIAC_READ[el] || PB_ZODIAC_READ.air;
        const every = (typeof window.ZODIAC_ROTATION_ROUNDS === 'number' ? window.ZODIAC_ROTATION_ROUNDS : 5);
        return h('div', { className: 'pb-gear-row pb-zodiac-row' },
          h('div', { className: 'pb-gear-label' }, 'ZODIAC', h('small', null, 'THE SIGN')),
          h('div', { className: 'pb-zodiac' },
            h('div', { className: 'pb-zodiac-wheel', role: 'radiogroup', 'aria-label': 'Zodiac sign' },
              zodiacs.map(z => h('button', { key:z, className:'pb-zodiac-chip' + (z === cur ? ' on' : ''), style:{ '--el': PB_ZODIAC_ELEMENT[z] || 'air' }, 'data-el': PB_ZODIAC_ELEMENT[z] || 'air',
                title: z.charAt(0).toUpperCase() + z.slice(1) + ' · ' + (PB_ZODIAC_ELEMENT[z] || 'air') + ' sign', 'aria-pressed': z === cur,
                onClick:()=>{ if (z !== cur) { handleZodiacChange(z); sfx('uiCursorMove'); } } }, window.ZODIAC_ICONS?.[z] || z.slice(0, 2).toUpperCase()))),
            h('div', { className: 'pb-zodiac-read' },
              h('b', null, (window.ZODIAC_ICONS?.[cur] || ''), ' ', cur.toUpperCase(), h('span', null, ' · ', read.icon, ' ', el.toUpperCase(), ' SIGN')),
              h('span', null, 'WHEN ', cur.toUpperCase(), ' RULES THE SKY (', every, ' ROUNDS IN EVERY ', every * zodiacs.length, '): +10% MOVE & ARMOR'),
              h('span', null, read.line, ' · 50% HARDER UNDER ITS OWN SKY'))));
      })(),
      h('div', { style:{ marginTop:'auto', fontSize:8, color:EW.inkDim, letterSpacing:'0.1em', lineHeight:1.5, padding:'6px 2px 0' } },
        'GEAR AND ITEMS RIDE INTO THE CROSSING WITH THE VESSEL · THE SKY CYCLES THROUGH THE TWELVE SIGNS')));

  // DOSSIER: the D.O.O.R. customs file — same source as the codex (data.js
  // DOOR_TEXT: disposition, point of entry, annotation).
  const dossierPanel = (() => {
    const cs = typeof window.doorCustomsStatus === 'function' ? window.doorCustomsStatus(unitRace) : null;
    const poe = typeof window.doorPointOfEntry === 'function' ? window.doorPointOfEntry(unitRace) : null;
    const note = DOOR?.DOSSIER_NOTES?.[unitRace] || null;
    const tone = !cs ? null : cs.status === 'NON-CANON' ? 'void' : /^(UNDOCUMENTED|DISPUTED)$/.test(cs.status) ? 'deny' : 'admit';
    return h(React.Fragment, null,
      h('div', { className: 'pb-zone-head' },
        h('b', null, 'Dossier'),
        h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.04em', padding:'2px 8px', border:`1px solid ${EW.panelEdge}`, borderRadius:999, background:'rgba(0,0,0,0.3)' } }, classLabel),
        h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.04em' } }, docNum),
        cs && h('span', { className:'door-stamp door-stamp-sm' + (tone === 'admit' ? ' admit' : tone === 'void' ? ' void' : ''), style:{ fontSize:7, padding:'2px 5px 1px', marginLeft:'auto' }, title:'Customs disposition · point of entry: ' + (poe || '?') }, cs.status)),
      h('div', { className: 'pb-zone-body', style:{ overflowY:'auto', overflowX:'hidden', gap:6, padding:'10px 14px 10px 12px', position:'relative' } },
        DOOR && h('div', { className:'door-wm', style:{ right:'2%', top:'6%', width:'44%', aspectRatio:'1' } }),
        h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:'clamp(18px,1.6vw,24px)', fontWeight:600, lineHeight:1.05, color:'#f1e9cf', position:'relative', zIndex:1 } }, raceLabelTxt),
        h('div', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.16em', position:'relative', zIndex:1 } }, getJobDisplay(clsName).toUpperCase(), ' · ', unitFaction.toUpperCase(), ' ALIGNMENT'),
        DOOR && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:4 } }, '1.  EXECUTIVE SUMMARY'),
        h('div', { style:{ fontSize:12, lineHeight:1.55, color:'#d3caae', fontFamily:'Cormorant SC, serif', fontStyle:'italic', borderLeft:`2px solid ${fc}55`, paddingLeft:8, position:'relative', zIndex:1 } }, codexLore),
        cs && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:2 } }, '2.  CUSTOMS DISPOSITION'),
        cs && h('div', { className:'door-file-p', style:{ fontSize:10.5, position:'relative', zIndex:1 } },
          h('b', { style:{ color:'#c9b98a', letterSpacing:'0.08em' } }, cs.status), cs.note ? ' — ' + cs.note : '',
          poe ? h('span', { style:{ display:'block', color:'#b6ad98', marginTop:2, letterSpacing:'0.06em' } }, 'POINT OF ENTRY · ' + poe) : null),
        note && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:2 } }, '3.  D.O.O.R. ANNOTATION'),
        note && h('div', { className:'door-file-p', style:{ fontSize:10.5, position:'relative', zIndex:1 } }, note),
        h('div', { style:{ fontSize:7, color:EW.inkDim, letterSpacing:'0.08em', paddingTop:6, marginTop:'auto', position:'relative', zIndex:1 } }, 'TOP SECRET // ████████ // NOFORN')));
  })();

  // Stage 5: the vessel's notes (the engine's passives + the hand-authored terrain rows)
  const unitNotes = pbUnitNotes(identity, clsName, unitEquipment);
  const notePaper = PB_NOTE_PAPER[unitFaction] || 'yellow';

  // STATS column (every tab but ROSTER): identity, vitals, the sheet, footprints, the type chart, the elements
  const zMod = (mapped) => zodiacNature ? (zodiacNature.buff===mapped ? 'up' : zodiacNature.debuff===mapped ? 'dn' : null) : null;
  const statsPanel = h(React.Fragment, null,
    h('div', { className: 'pb-ident' },
      h('b', null, unitName),
      h('span', null, raceLabelTxt.toUpperCase(), ' · ', getJobDisplay(clsName).toUpperCase(),
        (!isArena && clsName!=='Freelancer' && secJob) ? ' + ' + getJobDisplay(secJob).toUpperCase() : ''),
      h('div', { className: 'pb-ident-types' }, ...unitTypes.map((t,i)=>h(TypeChip,{key:i,type:t,size:9})),
        h('em', { style:{ color:`${fc}bb` }, title: factionBonusTxt || undefined }, unitFaction))),
    h('div', { style:{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:6, overflowY:'auto', overflowX:'hidden', paddingTop:4 } },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, paddingBottom:6, marginBottom:2, borderBottom:`1px solid ${EW.panelEdge}` } },
        VITAL_KEYS.map(k => {
          const mapped = STAT_MAP[k], val = fullStats[mapped]??0;
          return h(VitalBar, { key:k, label:k, statKey:k, val, max:STAT_MAX_PB[k]||100, vital:k.toLowerCase(), zodiacMod:zMod(mapped), delta:statDeltas[mapped]??0,
            tip: window.STAT_HELP?.[mapped] || null, gradeKey: mapped });
        })),
      h('div', { style:{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 } },
        BAR_KEYS.map(k => {
          const mapped = STAT_MAP[k], val = fullStats[mapped]??fullStats[k]??fullStats[k.toLowerCase()]??0;
          const d = statDeltas[mapped]??statDeltas[k]??statDeltas[k.toLowerCase()]??0;
          return h(StatBar, { key:k, label:statLabel(k), statKey:k, val, max:STAT_MAX_PB[k]||100, compact:true, zodiacMod:zMod(mapped), delta:d,
            suffix: STAT_PCT[k] ? '%' : '', tip: window.STAT_HELP?.[mapped] || null, gradeKey: mapped });
        })),
      // MOVE / RANGE footprints — the diamonds ARE the rule's shape (§3.2), inside round badges
      h('div', { style:{ display:'flex', gap:14, justifyContent:'center', alignItems:'flex-start', flexShrink:0, paddingTop:2 } },
        h('div', { className:'pb-foot-badge' }, h(RangeDiamond, { radius: fullStats.move ?? 3, fill:'rgba(80,160,255,0.45)', edge:'rgba(80,160,255,0.7)', label:'MOVE', value: fullStats.move ?? 3, color:'rgba(120,180,255,0.9)', tip: window.STAT_HELP?.move })),
        h('div', { className:'pb-foot-badge' }, h(RangeDiamond, { radius: fullStats.range ?? 1, fill:'rgba(255,70,70,0.35)', edge:'rgba(255,70,70,0.6)', label:'RANGE', value: fullStats.range ?? 1, color:'rgba(255,120,120,0.9)', tip: window.STAT_HELP?.range }))),
      // TYPE CHART (Stage 5, §5.5 item 3): the six type discs, the incoming matchups for this vessel's own types
      h('div', { style:{ flexShrink:0, display:'flex', flexDirection:'column', gap:4, borderTop:`1px solid ${EW.panelEdge}`, paddingTop:5 } },
        h('div', { style:{ fontSize:9, color:fc, letterSpacing:'0.14em', fontWeight:600, flexShrink:0 } }, 'TYPE CHART'),
        h(PbAffinityRing, { types: unitTypes })),
      // ELEMENTS (rev 9): the elemental weakness / resistance layer under the type chart (RACE_ELEMENT_AFFINITY)
      h('div', { style:{ flexShrink:0, display:'flex', flexDirection:'column', gap:4, paddingTop:5 } },
        h('div', { style:{ fontSize:9, color:fc, letterSpacing:'0.14em', fontWeight:600, flexShrink:0 } }, 'ELEMENTS'),
        h(PbElementRing, { race: unitRace })),
));

  // ROSTER's quick read under the hero: name · race · job · types · four pills · CONFIRM
  const quickCard = h('div', { className: 'pb-stage-card' },
    h('div', { style:{ display:'flex', alignItems:'baseline', gap:8, minWidth:0 } },
      h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:15, fontWeight:600, color:'#f1e9cf', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 } }, stageEntry ? stageLabel : unitName),
      h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.14em', flexShrink:0, textTransform:'uppercase' } }, getJobDisplay(stageCls))),
    h('div', { style:{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' } }, ...unitTypes.map((t,i)=>h(TypeChip,{key:i,type:t,size:9}))),
    h('div', { style:{ display:'flex', flexDirection:'column', gap:2 } },
      ['HP','ATK','DEF','SPD'].map(k => {
        const mapped = STAT_MAP[k], val = fullStats[mapped]??0;
        return h(StatBar, { key:k, label:k, statKey:k, val, max:STAT_MAX_PB[k]||100, compact:true, zodiacMod:zMod(mapped), delta:statDeltas[mapped]??0, gradeKey: mapped, tip: window.STAT_HELP?.[mapped] || null });
      })),
    !standalone && h('button', { className:'ms-tty-btn ok', style:{ alignSelf:'flex-end', marginTop:2 }, onClick:confirmSlot, title:'Lock this vessel and move to the next open slot' }, 'CONFIRM ' + numerals[slot]));

  /* ── BODY: the three zones; the stage keeps its key across every tab ── */
  /* ── THE BOTTOM BAR (2026-09-09): the party row and the foot are ONE row —
     BACK + the vessel's summary on the left, the portraits in the middle, the
     tools + CONFIRM / the seal on the right. The empty flanks the user
     circled are now the controls; the `> forge --slot` prompt, the ◂ ▸ caps
     and the counter are gone (← → still walk the row). The online lock
     ladder (START / WAITING / SEAL) is verbatim (plan rule 3.6a). ── */
  const partyRow = h('div', { className: 'pb-party' },
    h('div', { className: 'pb-party-left' },
      standalone
        ? h('button', { className: 'ms-tty-btn danger', onClick: () => { setTbView('locker'); sfx('uiCursorMove'); refresh(); }, title: 'Back to the archive' }, '◂ TEAMS')
        : h('button', { className: 'ms-tty-btn danger', onClick: doBack, title: 'Back' }, '◂ BACK'),
      (!isOnline && st.showPlayer2Builder) ? h('div', { className: 'pb-party-side' },
        h('button', { className: 'pb-pill' + (player === 1 ? ' on' : ''), onClick: () => selectPlayer(1) }, 'P1'),
        h('button', { className: 'pb-pill' + (player === 2 ? ' on' : ''), onClick: () => selectPlayer(2) }, 'P2 · CPU')) : null),
    h('div', { className: 'pb-party-slots' },
      Array.from({length: teamSize}).map((_, i) => {
        const cn = typeof window.normalizeClassName==='function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i]||'Warrior');
        const mt = st.partyMeta?.[player]?.[i] || (typeof window.getArchetypeForJob==='function' ? window.getArchetypeForJob(cn) : {});
        const id = typeof window.resolveIdentityForBuild==='function' ? window.resolveIdentityForBuild(cn,mt) : {race:'homosapien',faction:'time',types:['human'],gender:'male'};
        const isActive = i===slot, fCol = getFactionColor(id.faction);
        const confirmed = !!(st.builderConfirmedSlots?.[player]?.[i]);
        const nm = resolveUnitName(player, i, cn);
        const rl = (_grl(id.race,id.gender)||id.race||'?');
        return h('div', { key:i, onClick:()=>selectSlot(i), className:'pb-party-slot' + (isActive ? ' on' : '') + (confirmed ? ' filed' : ''), style:{ '--slot-fc': fCol }, title: nm + ' · ' + rl + ' · ' + getJobDisplay(cn) },
          h('div', { className:'pb-party-ring' },
            h('div', { className:'pb-party-portrait' }, h(PortraitSprite, { race:id.race, gender:id.gender||'male', cls:cn, glow:isActive?id.faction:null })),
            h('span', { className:'pb-party-no' }, numerals[i]),
            confirmed && (DOOR
              ? h('span', { className:'door-stamp door-stamp-sm admit pb-party-filed', title:'Locked in' }, 'FILED')
              : h('span', { className:'pb-party-filed pb-party-tick' }, '✓'))),
          h('div', { className:'pb-party-name' }, nm),
          h('div', { className:'pb-party-sub' }, rl, ' · ', getJobDisplay(cn)));
      })),
    h('div', { className: 'pb-party-right ms-tty-foot pb-foot' },
      h('div', { className: 'pb-tools' },
        h('button', { className: 'ms-tty-btn sm', onClick: doRandomize, title: 'Randomize this vessel' }, '🎲 ONE'),
        h('button', { className: 'ms-tty-btn sm', onClick: doRandomizeAll, title: 'Randomize the whole party' }, '🎲 ALL'),
        h('button', { className: 'ms-tty-btn sm', onClick: doDefaults, title: 'Reset every slot to defaults' }, 'RESET'),
        !standalone ? h('button', { className: 'ms-tty-btn sm gold', onClick: () => { setTeamSaveName(''); setShowTeamModal('save'); }, title: 'Archive this party as a saved team' }, '★ SAVE') : null,
        !standalone ? h('button', { className: 'ms-tty-btn sm teal', onClick: () => setShowTeamModal('load'), title: 'Load a saved team from your archive' }, '↑ LOAD', getTeamPresets().length ? ' · ' + getTeamPresets().length : '') : null),
      standalone
        // ── standalone: name the squad, then archive it — SAVE is the seal ──
        ? h('div', { className: 'pb-seal' },
            h('input', { className: 'pb-foot-input', value: teamNameDraft, onChange: e => setTeamNameDraft(e.target.value), placeholder: editingTeamId ? 'Squad name' : 'Name this squad…', maxLength: 30, title: 'Team name' }),
            h('button', { className: 'ms-tty-btn primary', onClick: tbSaveTeam, title: 'Archive this squad' }, h('b', null, '💾 SAVE TEAM'), h('i', null, '↵')))
        // ── match flow: CONFIRM left of the seal ──
        : h('div', { className: 'pb-seal' },
            h('button', { className: 'ms-tty-btn ok', onClick: confirmSlot, title: 'Lock this vessel and move to the next open slot' }, 'CONFIRM ', numerals[slot]),
            friendlyHostCanStart
              ? h('button', { className: 'ms-tty-btn primary', onClick: doStart }, h('b', null, '⚔ START MATCH'), h('i', null, '↵'))
              : isWaitingOnline
              ? h('button', { className: 'ms-tty-btn primary waiting pb-btn-waiting', disabled: true },
                  h('b', null, (isRankedNet && opponentLockedToo) ? 'MATCH STARTING…'
                    : (!isRankedNet && netRole === 'guest' && opponentLockedToo) ? '⌛ WAITING FOR HOST TO START…'
                    : '⌛ WAITING ON OPPONENT…'))
              : h('button', { className: 'ms-tty-btn primary', onClick: doStart, title: 'Seal the manifest and cross' }, h('b', null, 'SEAL YOUR FATE'), h('i', null, '↵')))));

  const stageCx = pbTab === 'roster' ? 0.5 : PB_STAGE_CX;
  // THE TECHNIQUE PANEL (2026-09-09 rev 8): its own cell UNDER the lanes, beside
  // the party bar — the lanes get the full height, the description reads next
  // to the portraits. Only on TECHNIQUES with a tree; otherwise the party bar spans.
  const hasPanel = pbTab === 'tech' && !!(useTree && unitTree);
  const panelZone = hasPanel ? h('div', { key: 'panel', className: 'pb-zone pb-zone-panel' },
    h(TechniquePanel, { info: techInfo, clsName, secJob, fc,
      raceLabel: (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace),
      onVerb: techVerb, onPreview: (info) => pbPreview(info.sp || null),
      previewOff, previewing: !!previewState, used: (customSpells || []).length, slotCap })) : null;
  // Cosmetics belong to the selected slot, independent of its job/loadout.
  // THE CHARACTER CREATOR (rev 3, 2026-09-11): every control writes ONE
  // sanitized appearance object (sprites.js normalizeCharacterAppearance —
  // catalogues EW_HAIR_STYLES / EW_FABRICS / EW_APPEARANCE_ENUMS); the stage
  // (EWCharViewer → three-renderer.js _createAppearanceRig) re-dresses the
  // model live. Sections: BODY · FACE · SKIN · HAIR · CLOTHES.
  const appearance = window.normalizeCharacterAppearance?.(meta.appearance) || null;
  const changeAppearance = (changes, gender) => {
    if (isWaitingOnline || unitRace !== 'homosapien') return;
    const target = st.partyMeta[player][slot];
    st.teamLockedIn = false;
    target.appearance = window.normalizeCharacterAppearance({ ...(appearance || {}), ...changes });
    if (gender) target.gender = gender;
    if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][slot] = false;
    refresh();
  };
  const ccLimits = window.EW_APPEARANCE_LIMITS || {}, ccEnums = window.EW_APPEARANCE_ENUMS || {};
  const ccHair = window.EW_HAIR_STYLES || [], ccFabrics = window.EW_FABRICS || {};
  const ccSlider = (key, label, pct) => {
    const limits = ccLimits[key]; if (!limits || !appearance) return null;
    const v = appearance[key];
    const shown = pct ? Math.round(v * 100) + '%' : (limits[0] === 0 ? Math.round(v * 100) : (v > 0 ? '+' : '') + Math.round(v * 100));
    return h('label', { key, className: 'pb-creator-slider' },
      h('span', null, label, h('output', null, shown)),
      h('input', { type: 'range', min: limits[0], max: limits[1], step: 0.01, value: v, 'aria-label': label, onChange: e => changeAppearance({ [key]: Number(e.target.value) }) }));
  };
  const ccColorRow = (key, label, swatches) => h('div', { key, className: 'pb-creator-colorrow' },
    h('span', { className: 'pb-creator-colorlabel' }, label),
    h('div', { className: 'pb-creator-swatches' }, swatches.map(color =>
      h('button', { key: color, className: 'pb-creator-swatch', style: { background: color }, 'aria-label': label + ' ' + color, 'aria-pressed': appearance[key] === color, onClick: () => changeAppearance({ [key]: color }) })),
      h('label', { className: 'pb-creator-custom', title: 'Custom ' + label.toLowerCase() }, h('input', { type: 'color', value: appearance[key], 'aria-label': 'Custom ' + label, onChange: e => changeAppearance({ [key]: e.target.value }) }), h('i', null, '+'))));
  const ccChoice = (key, options) => h('div', { className: 'pb-creator-options', role: 'group' }, options.map(([id, label]) =>
    h('button', { key: id, className: 'ms-tty-btn' + (appearance[key] === id ? ' primary' : ''), 'aria-pressed': appearance[key] === id, onClick: () => changeAppearance({ [key]: id }) }, label)));
  const ccFabricTiles = (key) => h('div', { className: 'pb-cc-tiles pb-cc-fabrics', role: 'group', 'aria-label': key === 'topFabric' ? 'Top fabric' : 'Trouser fabric' },
    (ccEnums[key] || []).map(id => {
      const def = ccFabrics[id] || { label: id }, thumb = def.file ? pbFabricThumbs[id] : null;
      return h('button', { key: id, className: 'pb-cc-tile pb-fabric-tile' + (thumb ? ' has-thumb' : '') + (def.file ? '' : ' plain'), 'aria-pressed': appearance[key] === id, title: def.label,
        style: thumb ? { backgroundImage: 'url(' + thumb + ')' } : undefined, onClick: () => changeAppearance({ [key]: id }) },
        h('span', null, def.label));
    }));
  const skinSwatches = ['#f4d7bf', '#e8c4a2', '#dfb18c', '#c9946b', '#b98362', '#a06a48', '#916044', '#7a4e36', '#66422e', '#4d3226', '#3c291f'];
  const hairSwatches = ['#0f0d0c', '#27201c', '#3b2a1f', '#5a3b25', '#7a4a2a', '#a0662e', '#c98a4a', '#e2c184', '#f1e2b3', '#8b1e1e', '#b5b5b5', '#f2f2f2', '#3b5bdb', '#b03aa0', '#2e8b57'];
  const eyeSwatches = ['#2d2a26', '#4a3222', '#6b4b2a', '#3d5a3a', '#4a6b8a', '#6a8fb5', '#7a8c6a', '#9a9a9a', '#b8860b', '#8b1e1e'];
  const lipSwatches = ['#b98a7a', '#9c5a5c', '#a0413f', '#7a2e33', '#c26a8a', '#3a2a2a'];
  const clothSwatches = ['#f0ece2', '#8fa3a8', '#5e6f80', '#344a50', '#2a2f38', '#141518', '#7a1f1f', '#c0392b', '#b8741a', '#c9a227', '#2e7d32', '#1f5f8b', '#5b3a8a', '#ad4c86'];
  const viewerLoads = !!(window.EWCharViewer && window.EWCharViewer.supports && window.EWCharViewer.supports('homosapien', identity.gender || 'male'));
  const creatorPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head' }, h('b', null, 'Character creator'),
      h('button', { className: 'ms-tty-btn', onClick: () => setCreatorOpen(false) }, 'BACK TO GEAR')),
    h('div', { className: 'pb-zone-body pb-creator' },
      unitRace !== 'homosapien'
        ? h('p', null, 'Select a Homosapien on the Roster tab to customize the male or female base model.')
        : !appearance
          ? h(React.Fragment, null,
              h('p', null, 'Build a custom appearance for this character. Your job, techniques and equipment stay attached to this slot.'),
              h('div', { className: 'pb-creator-options' },
                h('button', { className: 'ms-tty-btn primary', disabled: isWaitingOnline, onClick: () => changeAppearance({}) }, 'CREATE APPEARANCE'),
                h('button', { className: 'ms-tty-btn', disabled: isWaitingOnline, onClick: () => changeAppearance(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}) }, '⚄ RANDOM')))
          : h(React.Fragment, null,
            !viewerLoads ? h('p', { className: 'pb-creator-note' }, 'The 3D stage is unavailable here — changes still save with the team.') : null,
            h('fieldset', { className: 'pb-creator-controls', disabled: isWaitingOnline },
              h('legend', null, 'BODY'),
              h('div', { className: 'pb-creator-options', 'aria-label': 'Base model' }, ['male', 'female'].map(g =>
                h('button', { key: g, className: 'ms-tty-btn' + (identity.gender === g ? ' primary' : ''), 'aria-pressed': identity.gender === g, onClick: () => changeAppearance({}, g) }, g.toUpperCase()))),
              h('div', { className: 'pb-creator-grid' }, ccSlider('height', 'Height', true), ccSlider('width', 'Build', true), ccSlider('chest', 'Chest'), ccSlider('waist', 'Waist'), ccSlider('hips', 'Hips')),
              h('h3', null, 'FACE'),
              h('div', { className: 'pb-creator-grid' }, ccSlider('head', 'Head width'), ccSlider('jaw', 'Jaw width'), ccSlider('nose', 'Nose'), ccSlider('cheeks', 'Cheeks'), ccSlider('eyeSize', 'Eye size'), ccSlider('brows', 'Brow weight')),
              ccColorRow('eyeColor', 'Eyes', eyeSwatches),
              ccColorRow('lipColor', 'Lips', lipSwatches),
              h('div', { className: 'pb-creator-colorlabel' }, 'Facial hair'),
              ccChoice('beard', [['none', 'Clean'], ['stubble', 'Stubble'], ['goatee', 'Goatee'], ['beard', 'Beard']]),
              h('h3', null, 'SKIN'),
              ccColorRow('skin', 'Skin tone', skinSwatches),
              h('h3', null, 'HAIR'),
              h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'Hair style' },
                [{ id: 'bald', label: 'Bald' }].concat(ccHair).map(style =>
                  h('button', { key: style.id, className: 'pb-cc-tile pb-hair-tile' + (style.short ? ' short' : ''), 'aria-pressed': appearance.hair === style.id, onClick: () => changeAppearance({ hair: style.id }) },
                    h('i', { className: 'pb-hair-glyph' }), h('span', null, style.label)))),
              ccColorRow('hairColor', 'Hair colour', hairSwatches),
              h('h3', null, 'CLOTHES'),
              h('div', { className: 'pb-creator-colorlabel' }, 'Top'),
              ccChoice('outfit', (window.EW_OUTFIT_STYLES || [{ id: 'tee', label: 'T-shirt' }, { id: 'tank', label: 'Tank top' }, { id: 'suit', label: 'Long sleeve' }]).map(o => [o.id, o.label])),
              ccFabricTiles('topFabric'),
              ccColorRow('topColor', 'Top tint', clothSwatches),
              h('div', { className: 'pb-creator-colorlabel' }, 'Bottoms'),
              ccChoice('bottoms', [['trousers', 'Trousers'], ['shorts', 'Shorts']]),
              ccFabricTiles('bottomFabric'),
              ccColorRow('bottomColor', 'Bottom tint', clothSwatches),
              h('p', { className: 'pb-creator-note' }, 'Clothing and hair are cosmetic. Tints multiply the fabric; plain = no weave. Save your team to keep this look.'),
              h('div', { className: 'pb-creator-options' },
                h('button', { className: 'ms-tty-btn', onClick: () => changeAppearance(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}) }, '⚄ RANDOMIZE'),
                h('button', { className: 'ms-tty-btn', onClick: () => changeAppearance(window.normalizeCharacterAppearance({})) }, 'RESET'),
                h('button', { className: 'ms-tty-btn', onClick: () => {
                  if (isWaitingOnline) return;
                  st.teamLockedIn = false;
                  delete st.partyMeta[player][slot].appearance;
                  if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][slot] = false;
                  refresh();
                } }, 'USE ORIGINAL MODEL'))),
            h('div', { className: 'pb-creator-options pb-creator-views' },
              h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.resetView() }, 'FULL BODY'),
              h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.viewHead() }, 'FACE CLOSE-UP'),
              h('button', { className: 'ms-tty-btn', onClick: () => {
                window.EWCharViewer?.resetView();
                const ms = window.EWCharViewer?.play('walk', { full: true, name: 'Walk' });
                if (!ms) pbNote('Animation is still loading. Try again shortly.');
              } }, 'PREVIEW WALK')))));

  const zoneContent = pbTab === 'roster' ? rosterPanel : pbTab === 'tech' ? techPanel : pbTab === 'gear' ? (creatorOpen ? creatorPanel : gearPanel) : dossierPanel;
  const body = h('div', { className: 'pb-body', 'data-tab': pbTab, 'data-panel': hasPanel ? '1' : '0' },
    h('div', { key: 'tech', className: 'pb-zone pb-zone-tech pb-zone-' + pbTab }, zoneContent),
    // The stage spans the WHOLE body on TECHNIQUES / GEAR / DOSSIER (the side
    // zones are transparent over it — the hero's environment is the backdrop);
    // --pb-cx / `focus` put the hero at the centre of the free band between
    // the circuit and the stats (PB_STAGE_CX ↔ the CSS column widths).
    h('div', { key: 'stage', className: 'pb-stage', style: { '--pb-cx': (stageCx * 100) + '%' } },
      h('div', { className: 'pb-stage-view' },
        h('div', { className: 'pb-stage-glow', style:{ background:`radial-gradient(circle, ${fc}26, transparent 62%)` } }),
        h('div', { className: 'pb-stage-floor', style:{ background:`radial-gradient(ellipse, ${fc}66, transparent 70%)` } }),
        h(HeroViewer3D, { race:stageRace, gender:stageGender, cls:stageCls, faction:stageFaction, focus: stageCx, appearance: !stageEntry && unitRace === 'homosapien' ? meta.appearance : null }),
        // MOVE PREVIEW pill (plan §5.2 item 5): shows while a cast clip runs
        // on the stage; the note for vessels that cannot preview; PREVIEW OFF
        // on TECHNIQUES when the trigger is disabled.
        previewState ? h('div', { className: 'pb-stage-pill live' }, h('i', null), 'MOVE PREVIEW · ', (previewState.name || '').toUpperCase())
          : previewNote ? h('div', { className: 'pb-stage-pill note' }, previewNote)
          : (previewOff && pbTab === 'tech') ? h('div', { className: 'pb-stage-pill off' }, 'PREVIEW OFF') : null,
        // Stage 5's sticky notes, stuck ON THE GLASS (2026-09-09 — the user: the bezel margin "shrinks the entire screen")
        (pbTab !== 'roster' && !(standalone && tbView === 'locker')) ? h(PbNotes, { notes: unitNotes, seed: unitRace + ':' + (identity.gender || ''), paper: notePaper, onOpen: () => { setNotesOpen(true); sfx('uiCursorMove'); } }) : null),
      pbTab === 'roster' ? quickCard : null),
    pbTab !== 'roster' ? h('div', { key: 'stats', className: 'pb-zone pb-zone-stats' }, statsPanel) : null,
    panelZone,
    partyRow);

  /* ══ TEAM ARCHIVE — standalone landing view (Pokémon-Showdown locker), a
     full-glass view over the forge: pick a squad to edit, or start a new
     one. Teams saved here surface in the pre-match ↑ LOAD list. ══ */
  const locker = (standalone && tbView === 'locker') ? (() => {
    const presets = getTeamPresets();
    return h('div', { className: 'pb-locker' },
      h('div', { className: 'ms-tty-head pb-head' },
        h(DoorSeal, { size: 20 }),
        h('span', null, 'D.O.O.R.'), h('span', { className: 'ms-tty-sep' }, '▸'),
        h('b', null, 'ENTROPY WARS'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, 'RECORDS · SQUAD MANIFESTS'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, 'FORGE-1'),
        h('span', { className: 'ms-tty-officer' }, officer ? officer.name : 'UNFILED', officer && h('i', null, 'CLEARANCE L' + officer.cl.level + ' · ' + officer.cl.title)),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, presets.length + ' / ' + (window.ProfileSystem?.MAX_TEAM_PRESETS || 20) + ' SQUADS ARCHIVED'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', { className: 'ms-tty-esc' }, 'ESC · MAIN MENU')),
      h('div', { className: 'pb-locker-body' },
        h('div', { style:{ marginBottom:18 }},
          h('div', { className:'door-title-stamp' },
            h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:'clamp(22px,2.6vw,34px)', fontWeight:600, letterSpacing:'0.1em', color:'#f1e9cf', textShadow:'0 0 22px rgba(255,205,107,0.28)' }}, 'TEAM ARCHIVE'),
            DOOR && h('span', { className:'door-stamp admit', title:'Manifests on file are cleared for deployment' }, 'ON FILE')),
          h('div', { style:{ fontSize:11, color:'#c9bf9e', letterSpacing:'0.08em', marginTop:4, lineHeight:1.5 }},
            'Forge squads here, before the war finds you. Saved teams appear under ', h('b', {style:{color:'#7fd9dd'}}, '↑ LOAD'), ' whenever you build a party for any match.')),
        h('div', { className: 'pb-locker-grid' },
          h('div', { className:'pb-team-card new', onClick:tbNewTeam },
            h('div', { style:{ fontSize:34, color:'#3ddc84', lineHeight:1, textShadow:'0 0 18px rgba(61,220,132,0.5)' }}, '+'),
            h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:17, letterSpacing:'0.14em', color:'#3ddc84', fontWeight:600 }}, 'NEW TEAM'),
            h('div', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.1em' }}, 'FORGE A FRESH SQUAD')),
          presets.map(preset => {
            const slots = preset.slots || [];
            return h('div', { key:preset.id, className:'pb-team-card', onClick:()=>tbEditTeam(preset), title:'Open this squad in the forge' },
              h('div', { style:{ display:'flex', alignItems:'baseline', gap:10 }},
                h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:18, fontWeight:600, letterSpacing:'0.06em', color:EW.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0, flex:1 }}, preset.name || 'Unnamed'),
                h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.1em', flexShrink:0 }}, slots.length, ' VESSELS')),
              h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' }},
                slots.slice(0, 8).map((s, si) => h('div', { key:si, className:'pb-team-mini', title:(_grl(s.race, s.gender)||s.race)+' · '+getJobDisplay(s.cls) },
                  h(PortraitSprite, { race:s.race, gender:s.gender||'male', cls:s.cls })))),
              h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginTop:2 }},
                h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.08em', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }},
                  (preset.gameMode || '').toUpperCase(), preset.lastUsed ? ' · ' + new Date(preset.lastUsed).toLocaleDateString() : ''),
                h('button', { className:'pb-team-act', onClick:e=>{ e.stopPropagation(); tbEditTeam(preset); } }, '⚒ FORGE'),
                h('button', { className:'pb-team-act', onClick:e=>{ e.stopPropagation(); tbDuplicateTeam(preset); } }, 'COPY'),
                h('button', { className:'pb-team-act danger', onClick:e=>{ e.stopPropagation(); deleteTeamPreset(preset.id); } }, 'DEL')));
          })),
        presets.length === 0 && h('div', { style:{ marginTop:22, fontSize:11, color:EW.inkDim, fontStyle:'italic', letterSpacing:'0.06em' }},
          'The archive is empty. Forge your first squad — the entropy is patient, but not that patient.')),
      h('div', { className: 'ms-tty-foot pb-foot' },
        h('button', { className: 'ms-tty-btn danger', onClick: () => { if (typeof window._teamBuilderBack==='function') window._teamBuilderBack(); } }, '◂ MAIN MENU'),
        h('div', { className: 'ms-tty-spacer' }),
        h('span', { className: 'ms-tty-prompt' }, '> ', h('b', null, 'archive --list'), h('span', { className: 'ms-tty-cursor' })),
        h('span', { className: 'pb-foot-note' }, 'SQUADS ARE SAVED TO YOUR PROFILE', DOOR ? ' · MANIFESTS REMAIN PROPERTY OF THE DEPARTMENT' : '')));
  })() : null;

  /* ── the windows on the glass ── */
  const teamWindow = showTeamModal && h(PbWindow, { title: showTeamModal === 'save' ? 'SAVE TEAM' : 'LOAD TEAM', sub: getTeamPresets().length + ' / ' + (window.ProfileSystem?.MAX_TEAM_PRESETS||20) + ' PRESETS', onClose: () => setShowTeamModal(false), width: 440 },
    showTeamModal === 'save' && h('div', { style:{ display:'flex', flexDirection:'column', gap:8 }},
      h('div', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.1em' }}, 'Name this team preset:'),
      h('input', { className:'pb-gear-input', value:teamSaveName, onChange:e=>setTeamSaveName(e.target.value), placeholder:'e.g. Fire Squad, Tank Line...', maxLength:30, autoFocus:true, onKeyDown:e=>{ if(e.key==='Enter'&&teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); }, style:{ width:'100%', boxSizing:'border-box' }}),
      h('div', { style:{ display:'flex', gap:6, justifyContent:'flex-end' }},
        h('button', { className:'ms-tty-btn sm', onClick:()=>setShowTeamModal(false) }, 'CANCEL'),
        h('button', { className:'ms-tty-btn sm gold', disabled: !teamSaveName.trim(), onClick:()=>{ if(teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); } }, 'SAVE'))),
    showTeamModal === 'load' && h('div', { style:{ display:'flex', flexDirection:'column', gap:4 }},
      getTeamPresets().length === 0
        ? h('div', { style:{ color:EW.inkDim, fontSize:12, textAlign:'center', padding:20, fontStyle:'italic' }}, 'No saved teams yet. Use SAVE to store your current party.')
        : getTeamPresets().map(preset =>
          h('div', { key:preset.id, className:'pbx-pick-row', style:{ borderRadius:'var(--pb-r-sm)' } },
            h('div', { onClick:()=>loadTeamPreset(preset), style:{ flex:1, display:'flex', flexDirection:'column', gap:2, cursor:'pointer', minWidth:0 }},
              h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:13, letterSpacing:'0.1em', color:EW.ink }}, preset.name),
              h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' }},
                ...(preset.slots||[]).map((s,si)=>{
                  const rl = typeof _grl==='function' ? _grl(s.race,s.gender) : s.race;
                  return h('span', { key:si, style:{ fontSize:9, color:EW.inkMute, background:'rgba(255,255,255,0.04)', padding:'1px 6px', borderRadius:999, border:`1px solid rgba(255,255,255,0.06)` }}, rl);
                })),
              h('div', { style:{ fontSize:8, color:EW.inkDim }}, preset.gameMode?.toUpperCase() || '', ' · ', new Date(preset.createdAt).toLocaleDateString())),
            h('button', { className:'pb-team-act danger', onClick:e=>{e.stopPropagation();deleteTeamPreset(preset.id);} }, 'DEL')))));

  // Stage 5: the notes' full text — every passive + every terrain row, unclamped
  const notesWindow = notesOpen && h(PbWindow, { title: 'THE NOTES', sub: raceLabelTxt.toUpperCase() + ' · PASSIVES & TERRAIN', onClose: () => setNotesOpen(false), width: 460 },
    h('div', { className: 'pb-notes-list' },
      ...unitNotes.passives.map(p => h('div', { key: 'p' + p.id, className: 'pb-notes-row' },
        h('span', { className: 'pb-notes-icon' }, p.icon || '✦'),
        h('div', null,
          h('b', null, 'PASSIVE: ', p.name),
          h('p', null, p.desc || ''),
          p.note ? h('em', null, p.note) : null))),
      ...unitNotes.terrain.map((t, i) => h('div', { key: 't' + i, className: 'pb-notes-row terrain' },
        h('span', { className: 'pb-notes-icon' }, t.icon || '⛰'),
        h('div', null,
          h('b', null, 'TERRAIN: ', t.name),
          h('p', null, t.desc || '')))),
      (!unitNotes.passives.length && !unitNotes.terrain.length) ? h('div', { style:{ fontSize:11, color:EW.inkDim, fontStyle:'italic', padding:'12px 6px', textAlign:'center' } }, 'No notes on this vessel — field research pending.') : null));

  const pickerWindow = equipPicker && h(PbWindow, {
      title: equipPicker === 'item' ? 'Battle Items' : equipPicker === 'subjob' ? 'Choose a Subclass' : 'Gear — Slot ' + (equipPicker === 'accessory1' ? '1' : '2'),
      sub: equipPicker === 'item' ? (totalItemsUsed + ' / ' + itemSlotMax + ' CARRIED') : equipPicker === 'subjob' ? 'its spells join your pool · its training shifts your stats' : null,
      onClose: () => setEquipPicker(null), width: 470 },
    equipPicker === 'subjob'
      ? (() => {
          // Subclass rows: spells the job contributes + its stat shifts, so
          // the choice reads as "what playstyle does this buy me".
          const jobs = (typeof window.JOB_MODIFIERS!=='undefined'?Object.keys(window.JOB_MODIFIERS):[]).filter(j=>j!==clsName&&j!=='Freelancer');
          const bonusStr = (j) => {
            const b = (typeof window.computeSecJobBonuses === 'function') ? window.computeSecJobBonuses(j) : {};
            return Object.entries(b).filter(([,v]) => v).map(([k,v]) => (v>0?'+':'')+v+' '+k.toUpperCase()).join('  ');
          };
          const spellCount = (j) => (((typeof window.CLASS_SPELL_LEARN_ORDER!=='undefined'&&window.CLASS_SPELL_LEARN_ORDER)||{})[j]||[]).length;
          const pickJob = (j) => { handleSecJobChange(j); sfx('uiButtonConfirm'); setEquipPicker(null); };
          const autoOn = !secJob;
          const rows = [h('div', { key:'__auto', className:'pbx-pick-row', style: autoOn ? { borderColor:fc, background:`${fc}14` } : undefined, onClick:()=>pickJob('') },
            h('span', { style:{ width:26, textAlign:'center', fontSize:16, flexShrink:0, color:EW.inkMute }}, '◈'),
            h('div', { style:{ flex:1, minWidth:0 }},
              h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:13, fontWeight:700, color: autoOn ? EW.ink : '#c3c8d6' }}, '— None —'),
              h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.35 }}, 'No subclass. Your pool holds main-job spells and race abilities only.')),
            autoOn ? h('span', { style:{ fontSize:9, color:fc, fontWeight:700, flexShrink:0, letterSpacing:'0.08em' }}, 'CURRENT') : null)];
          for (const j of jobs) {
            const on = secJob === j;
            const bs = bonusStr(j);
            rows.push(h('div', { key:j, className:'pbx-pick-row', style: on ? { borderColor:fc, background:`${fc}14` } : undefined, onClick:()=>pickJob(j) },
              // Plain homosapien in this job — a visual shorthand for the role.
              h('div', { style:{ width:40, height:40, flexShrink:0, display:'flex', alignItems:'flex-end', justifyContent:'center', background:`linear-gradient(180deg, transparent 45%, ${fc}12 100%)`, border:`1px solid ${on?fc:EW.panelEdge}`, borderRadius:'50%', overflow:'hidden' }},
                h(Sprite, { race:'homosapien', gender:'male', cls:j, size:'92%', style:{ width:'92%', height:'92%' } })),
              h('div', { style:{ flex:1, minWidth:0 }},
                h('div', { style:{ display:'flex', alignItems:'baseline', gap:8 }},
                  h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:13, fontWeight:700, color: on ? EW.ink : '#c3c8d6' }}, getJobDisplay(j)),
                  h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em' }}, '+', spellCount(j), ' SPELLS TO POOL')),
                bs ? h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.4 }}, ...bs.split('  ').map((tok, ti) => h('span', { key:ti, style:{ color: tok.startsWith('-') ? EW.bad : EW.good, marginRight:8, fontWeight:600 }}, tok))) : null),
              on ? h('span', { style:{ fontSize:9, color:fc, fontWeight:700, flexShrink:0, letterSpacing:'0.08em' }}, 'CURRENT') : null));
          }
          return rows;
        })()
      : equipPicker === 'item'
      ? allItemKeys.map(ik => {
          const rule = window.ITEM_RULES?.[ik];
          if (!rule) return null;
          const count = unitItems[ik] || 0;
          const capped = count >= (rule.max || 6) || totalItemsUsed >= itemSlotMax;
          return h('div', { key:ik, className:'pbx-pick-row', onClick:()=>setItemCount(ik, 1), style:{ opacity: capped && !count ? 0.5 : 1 }},
            h('span', { style:{ fontSize:20, flexShrink:0, width:26, textAlign:'center' }}, rule.icon || '📦'),
            h('div', { style:{ flex:1, minWidth:0 }},
              h('div', { style:{ fontSize:12, color: count ? EW.ink : '#c3c8d6' }}, rule.name),
              h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.35 }}, rule.desc)),
            h('div', { style:{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }},
              count > 0 ? h('button', { className:'pb-stepper-btn', onClick:e=>{ e.stopPropagation(); setItemCount(ik, -1); }, style:{ width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:`1px solid ${EW.panelEdge}`, color:EW.inkMute, fontSize:13, lineHeight:'18px', textAlign:'center', cursor:'pointer', padding:0, fontFamily:'DotGothic16, monospace' }}, '−') : null,
              h('span', { style:{ width:18, textAlign:'center', fontSize:12, color: count ? EW.ink : EW.inkDim, fontWeight:600 }}, count)));
        })
      : (() => {
          const other = equipPicker === 'accessory1' ? 'accessory2' : 'accessory1';
          const rows = allAccIds.map(accId => {
            const def = window.EQUIP_DEFS?.[accId];
            if (!def) return null;
            const here = unitEquipment[equipPicker] === accId, there = unitEquipment[other] === accId;
            return h('div', { key:accId, className:'pbx-pick-row', style: here ? { borderColor:fc, background:`${fc}14` } : undefined,
              onClick:()=>{ if (here) { handleAccChange(equipPicker, null); } else { if (there) handleAccChange(other, null); handleAccChange(equipPicker, accId); } sfx('uiButtonConfirm'); setEquipPicker(null); } },
              h('span', { style:{ fontSize:18, flexShrink:0, width:26, textAlign:'center' }}, ACC_ICONS[accId] || '🎒'),
              h('div', { style:{ flex:1, minWidth:0 }},
                h('div', { style:{ fontSize:12, color: here ? EW.ink : '#c3c8d6' }}, def.label, there ? h('span', { style:{ fontSize:8, color:EW.inkDim }}, '  (in other slot)') : null),
                h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.35 }}, def.desc)),
              def.stat && def.statVal ? h('span', { style:{ fontSize:10, color:EW.good, fontWeight:700, flexShrink:0 }}, '+' + def.statVal + ' ' + (def.stat || '').toUpperCase()) : null,
              here ? h('span', { style:{ fontSize:9, color:fc, flexShrink:0, fontWeight:700, letterSpacing:'0.08em' }}, 'EQUIPPED') : null);
          });
          if (unitEquipment[equipPicker]) rows.push(h('div', { key:'__rm', className:'pbx-pick-row', onClick:()=>{ handleAccChange(equipPicker, null); setEquipPicker(null); } },
            h('span', { style:{ width:26, textAlign:'center', color:EW.bad, flexShrink:0 }}, '✕'),
            h('div', { style:{ flex:1, fontSize:11, color:EW.bad }}, 'Remove gear from this slot')));
          return rows;
        })());

  /* ── the monitor ── */
  return h('div', { ref: crtRef, className: `ms-crt ms-crt-page ms-crt-forge pb-tarot pb-tarot-${unitFaction}`, style: { '--pb-fc': fc } },
    h('div', { className: 'ms-crt-bezel' },
      h('div', { className: 'ms-crt-glass' },
        h('div', { className: 'ms-crt-screen' },
          h('div', { className: 'ms-tty pb-tty' }, head, body),
          locker,
          teamWindow,
          notesWindow,
          pickerWindow),
        h('div', { className: 'ms-crt-scan' }),
        h('div', { className: 'ms-crt-glare' }),
        // Stage 3 (§5.3): the monitor's reactions — the grade wash and the scanline roll (CSS-driven, see onStageFx above)
        h('div', { className: 'pb-crt-grade' }),
        h('div', { className: 'pb-crt-roll' })),
      h('div', { className: 'ms-crt-label' }, 'D.O.O.R. · ' + (standalone ? 'RECORDS' : 'CUSTOMS & ADMISSIONS') + ' · FORGE-1 · DO NOT UNPLUG'),
      h('div', { className: 'ms-crt-brand' }, 'ENTROPY DATA SYSTEMS'),
      h('div', { className: 'ms-crt-led' })),
    spellTip && buildSpellTooltip(spellTip.sp, spellTip.x, spellTip.y));
}

let _pbRoot = null;
window._mountReactPartyBuilder = function() {
  const c = document.getElementById('builderOverlay');
  if (!c) return;
  _pbStandaloneMode = false;
  if (!_pbRoot) _pbRoot = ReactDOM.createRoot(c);
  _pbRoot.render(h(PartyBuilder, { standalone: false }));
};
window._unmountReactPartyBuilder = function() {
  if (_pbRoot) { _pbRoot.unmount(); _pbRoot = null; }
  if (window.EWCharViewer) window.EWCharViewer.unmount();
};
window._refreshReactPartyBuilder = function() { if (_pbRoot) _pbRoot.render(h(PartyBuilder, { standalone: false })); };

/* ── Standalone Party Forge (main menu → #teamBuilderPage) ─────────────
   Same component, standalone mode: opens on the TEAM ARCHIVE locker.
   map.js _goToTeamBuilder / _teamBuilderBack own the page navigation. */
let _tbRoot = null;
window._mountReactTeamBuilder = function() {
  const c = document.getElementById('teamBuilderBody');
  if (!c) return;
  _pbStandaloneMode = true;
  if (!_tbRoot) _tbRoot = ReactDOM.createRoot(c);
  _tbRoot.render(h(PartyBuilder, { standalone: true }));
};
window._unmountReactTeamBuilder = function() {
  _pbStandaloneMode = false;
  if (_tbRoot) { _tbRoot.unmount(); _tbRoot = null; }
  if (window.EWCharViewer) window.EWCharViewer.unmount();
};

})();
