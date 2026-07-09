(function() {
'use strict';

const h = React.createElement;

if (!document.getElementById('pb-hover-css')) {
  const _css = document.createElement('style');
  _css.id = 'pb-hover-css';
  _css.textContent = `
    /* ── Party Builder — champ-select redesign ── */

    /* Ghost outline buttons (BACK, RANDOM, RANDOM ALL, DEFAULTS, RND, RST) */
    .pb-btn-ghost {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-ghost:hover {
      background: rgba(180,200,240,0.08) !important;
      border-color: rgba(180,200,240,0.35) !important;
      color: #e6e9f2 !important;
    }
    .pb-btn-ghost:active {
      transform: scale(0.96);
      background: rgba(180,200,240,0.14) !important;
    }

    /* CLR button (red-ish ghost) */
    .pb-btn-danger {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  transform 0.1s !important;
    }
    .pb-btn-danger:hover {
      background: rgba(255,120,120,0.1) !important;
      border-color: rgba(255,120,120,0.45) !important;
      color: rgba(255,120,120,0.95) !important;
    }
    .pb-btn-danger:active {
      transform: scale(0.95);
    }

    /* CONFIRM button (green tint) */
    .pb-btn-confirm {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-confirm:hover {
      background: rgba(100,200,120,0.16) !important;
      border-color: rgba(100,200,120,0.45) !important;
      color: rgba(100,200,120,1) !important;
      box-shadow: 0 0 12px rgba(100,200,120,0.12);
    }
    .pb-btn-confirm:active {
      transform: scale(0.96);
    }

    /* SEAL THE PARTY primary CTA */
    .pb-btn-primary {
      transition: box-shadow 0.15s, transform 0.1s, filter 0.12s !important;
    }
    .pb-btn-primary:hover {
      filter: brightness(1.2) saturate(1.1);
      box-shadow: 0 0 30px var(--pb-fc, rgba(242,196,104,0.3)),
                  0 2px 12px var(--pb-fc, rgba(242,196,104,0.2)) !important;
      transform: translateY(-1px);
    }
    .pb-btn-primary:active {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }

    /* Waiting-for-opponent pulsing state */
    @keyframes pb-waiting-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 18px rgba(100,200,120,0.2); }
      50%      { opacity: 0.7; box-shadow: 0 0 30px rgba(100,200,120,0.4); }
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
      border-color: rgba(180,200,240,0.4) !important;
      box-shadow: 0 0 10px rgba(180,200,240,0.08);
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
      border-color: rgba(180,200,240,0.4) !important;
      box-shadow: 0 0 12px rgba(180,200,240,0.1);
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
      border-color: rgba(180,200,240,0.4) !important;
      box-shadow: 0 0 8px rgba(180,200,240,0.08);
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
      background: rgba(180,200,240,0.12) !important;
      border-color: rgba(180,200,240,0.35) !important;
      color: #e6e9f2 !important;
    }
    .pb-stepper-btn:active {
      transform: scale(0.85);
      background: rgba(180,200,240,0.2) !important;
    }

    /* ── Battle-parity ability BLADES ──────────────────────────────
       Same visual instrument as the in-battle Horologe menu (hud.js):
       skewed dark body with angled ends, colored category left edge,
       glyph, Cinzel name, chips on the right — plus an always-visible
       one-line description (no hover required to learn a spell). */
    .pbx-blade {
      position: relative;
      display: flex; align-items: center; gap: 8px;
      min-height: 40px; padding: 3px 14px 4px 8px; margin: 0 9px 0 5px;
      background: linear-gradient(100deg, #0c101f 0%, #0a0c15 55%, rgba(10,12,21,0.55) 100%);
      border: 1px solid rgba(120,140,180,0.2);
      border-left: 3px solid var(--cat, #8890b0);
      clip-path: polygon(8px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      transform: skewX(-6deg); transform-origin: 0 50%;
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s, box-shadow 0.15s,
                  transform 0.12s, opacity 0.15s;
    }
    .pbx-blade > * { transform: skewX(6deg); }
    .pbx-blade:hover {
      background: linear-gradient(100deg, #16203a 0%, #0e1326 65%, rgba(14,19,38,0.6) 100%);
      border-color: var(--cat, #8890b0);
      box-shadow: -2px 0 14px rgba(120,150,220,0.14), inset 3px 0 0 var(--cat, #8890b0);
      transform: skewX(-6deg) translateX(3px);
    }
    .pbx-blade:active { filter: brightness(0.85); }
    .pbx-blade.on {
      background: linear-gradient(100deg, #121a30 0%, #0d1222 65%, rgba(13,18,34,0.6) 100%);
      border-color: var(--cat, #8890b0);
      box-shadow: inset 3px 0 0 var(--cat, #8890b0), -1px 0 10px rgba(0,0,0,0.4);
    }
    .pbx-blade.empty {
      border: 1px dashed rgba(120,140,180,0.22);
      border-left: 3px solid rgba(120,140,180,0.12);
      background: rgba(255,255,255,0.015);
      cursor: default; min-height: 26px;
    }
    .pbx-blade.empty:hover {
      transform: skewX(-6deg); box-shadow: none;
      background: rgba(255,255,255,0.015);
      border-color: rgba(120,140,180,0.22);
    }
    /* ── EQUIPPED slot blades — green = locked into a spell slot ── */
    .pbx-blade.equipped {
      border-color: rgba(90,205,125,0.45);
      border-left: 3px solid #4fd07a;
      background: linear-gradient(100deg, rgba(20,52,33,0.92) 0%, rgba(12,30,20,0.85) 55%, rgba(11,26,17,0.5) 100%);
      box-shadow: inset 3px 0 0 #4fd07a, -1px 0 10px rgba(0,0,0,0.4);
    }
    .pbx-blade.equipped:hover {
      border-color: #62e290;
      background: linear-gradient(100deg, rgba(26,66,42,0.95) 0%, rgba(15,38,25,0.9) 65%, rgba(14,34,22,0.6) 100%);
      box-shadow: inset 3px 0 0 #62e290, -2px 0 14px rgba(70,205,115,0.2);
    }
    .pbx-blade.equipped .pbx-slotno { color: #5fbf82; font-weight: 700; }
    .pbx-blade.equipped .pbx-x { color: rgba(255,122,138,0); }
    /* the rack that holds the 8 fixed spell slots */
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
                 text-shadow: 0 0 10px rgba(0,0,0,0.6); }
    .pbx-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .pbx-row1 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    /* the NAME never shrinks — chips clip at the right edge if space runs out
       (same rule as the battle blades) */
    .pbx-name {
      flex: 0 0 auto; max-width: 50%;
      font-family: 'Cinzel', serif; font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; color: #e6e9f2; line-height: 1.15;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    @media (max-width: 1500px) {
      .pbx-name { font-size: 12px; }
    }
    .pbx-desc {
      font-size: 10px; line-height: 1.3; color: #77809a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pbx-mp {
      flex: none; font-size: 9px; letter-spacing: 0.08em; color: #7fc9e8;
      border: 1px solid rgba(95,214,255,0.35); background: rgba(95,214,255,0.08);
      padding: 1px 5px; white-space: nowrap;
    }
    .pbx-pw { flex: none; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; }
    .pbx-cost { flex: none; font-size: 8px; letter-spacing: 0.14em; }
    .pbx-slotno { flex: none; width: 20px; font-size: 9px; color: #555c70; text-align: right;
      align-self: stretch; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: space-around; gap: 2px; padding: 1px 0; }
    .pbx-slotno > span { line-height: 1; }
    .pbx-checkbox {
      flex: none; width: 12px; height: 12px; border: 1px solid rgba(140,160,200,0.4);
      display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);
    }
    .pbx-x { flex: none; font-size: 10px; color: rgba(255,122,138,0); transition: color 0.12s; }
    .pbx-blade:hover .pbx-x { color: rgba(255,122,138,0.9); }

    /* ── SUBCLASS bar — same blade instrument, sits above the spell pool ── */
    .pbx-subbar {
      display: flex; align-items: center; gap: 9px;
      min-height: 34px; padding: 4px 14px 4px 10px; margin: 7px 9px 0 5px;
      background: linear-gradient(100deg, #121a30 0%, #0d1222 65%, rgba(13,18,34,0.6) 100%);
      border: 1px solid var(--cat, #8890b0); border-left: 3px solid var(--cat, #8890b0);
      clip-path: polygon(8px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
      transform: skewX(-6deg); transform-origin: 0 50%;
      cursor: pointer;
      transition: background 0.12s, box-shadow 0.15s, transform 0.12s;
    }
    .pbx-subbar > * { transform: skewX(6deg); }
    .pbx-subbar:hover {
      background: linear-gradient(100deg, #1a2542 0%, #101731 65%, rgba(16,23,49,0.6) 100%);
      box-shadow: -2px 0 16px rgba(120,150,220,0.16), inset 3px 0 0 var(--cat, #8890b0);
      transform: skewX(-6deg) translateX(3px);
    }
    .pbx-subbar:active { filter: brightness(0.85); }

    /* ── race trait rows (passives & terrain) ── */
    .pbx-trait {
      display: flex; align-items: flex-start; gap: 7px;
      padding: 3px 8px 4px 6px; background: rgba(0,0,0,0.25);
      border: 1px solid rgba(120,140,180,0.12);
      border-left: 2px solid var(--pb-fc, rgba(242,196,104,0.5));
    }

    /* ── RPG equipment / item slot squares flanking the hero ── */
    .pbx-eqslot {
      position: relative; flex: none;
      border: 1px dashed rgba(140,160,200,0.3); background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1px;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s, box-shadow 0.15s, transform 0.1s;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
    }
    .pbx-eqslot:hover {
      border-color: var(--acc, rgba(180,200,240,0.55));
      box-shadow: 0 0 10px rgba(160,190,255,0.12);
      background: rgba(20,26,44,0.5);
      transform: translateY(-1px);
    }
    .pbx-eqslot.filled {
      border-style: solid; border-color: var(--acc, rgba(180,200,240,0.55));
      background: linear-gradient(180deg, rgba(20,26,44,0.5), rgba(0,0,0,0.4));
      box-shadow: 0 0 8px rgba(0,0,0,0.5), inset 0 0 12px rgba(120,150,220,0.06);
    }
    .pbx-eqslot-icon { font-size: 19px; line-height: 1; }
    .pbx-eqslot:not(.filled) .pbx-eqslot-icon {
      color: rgba(140,160,200,0.4); font-size: 16px; font-family: 'DotGothic16', monospace;
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
      background: rgba(0,0,0,0.3); border: 1px solid rgba(120,140,180,0.16);
      cursor: pointer; transition: background 0.12s, border-color 0.12s;
    }
    .pbx-pick-row:hover {
      background: rgba(120,150,220,0.08);
      border-color: rgba(180,200,240,0.4);
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
  space: '#5ab0ff', time: '#f2c468', chaos: '#e168c8',
  human:'#a0a0c3', alien:'#32aa50', divine:'#dcaa1e',
  unholy:'#9632b4', anomaly:'#dc3c82', tech:'#28a0be',
  good: '#6ee2a8', bad: '#ff7a8a', warn: '#f2c468',
};

const FACTION_C = { space: EW.space, time: EW.time, chaos: EW.chaos };
const TYPE_C = { human:EW.human, alien:EW.alien, divine:EW.divine, unholy:EW.unholy, anomaly:EW.anomaly, tech:EW.tech };
// Brightened text for the canonical type badge (legible over any background).
const TYPE_TEXT_C = { human:'#c8c8e4', divine:'#f2c63c', unholy:'#c566e2', tech:'#4ecbe2', anomaly:'#ff5e98', alien:'#56d178' };
const STAT_KEYS = ['HP','MP','ATK','DEF','MDEF','INT','SPD','RNG','MOV'];
const STAT_MAX_PB = { HP:900, MP:300, ATK:110, DEF:75, MDEF:75, INT:100, SPD:11, RNG:6, MOV:6 };
const STAT_MAP = { HP:'hp', MP:'mp', ATK:'atk', DEF:'def', MDEF:'mdef', INT:'int', SPD:'spd', RNG:'range', MOV:'move' };
const CODEX_CLASS_LABELS = { tank:'HEAVY ARMOR', bruiser:'ASSAULT', healer:'MEDICAL', support:'SUPPORT OPS', assassin:'BLACK OPS', caster:'PSI-OPS', ranged:'LONG RANGE', specialist:'SPECIALIST', hybrid:'MULTI-ROLE' };

const ACC_ICONS = {
  binoculars: '\u{1F52D}', walkie_talkie: '\u{1F4FB}', flair: '\u{1F525}',
  ward: '\u{1F441}', telescope: '\u{1F52D}', jetpack: '\u{1F680}',
  spelunking_gear: '\u{26CF}\uFE0F',
  chrono_locket: '\u{231B}', martyrs_talisman: '\u{2728}', purity_censer: '\u{26B1}\uFE0F',
  berserkers_brand: '\u{2694}\uFE0F', archons_focus: '\u{1F9FF}', grapnel_gauntlet: '\u{1FA9D}',
  echo_band: '\u{1F4A2}', hagstone: '\u{1FAA8}', dowsing_rod: '\u{1FAA4}',
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
  'dreameater': 'Psionic parasite that feeds on REM-state neural activity. Capable of inducing sleep in conscious subjects within 15m radius. Appears as shifting humanoid form that "feels like 3 AM." INT capability rating: highest recorded for parasitic entity.',
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
  'honda civic': 'Subject appears to be a standard 2001 Honda Civic DX (silver, 4-door, 164K miles, check engine light on). Under combat stimulus, the vehicle undergoes rapid mechanical transformation into a bipedal combat platform approximately 3.2m in height. Registration expired 2019.',
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
  if (typeof window.computeUnitStats === 'function') return window.computeUnitStats(race || 'homosapien', cls);
  return window.CLASS_TEMPLATES?.[cls] || window.CLASS_TEMPLATES?.Warrior || {};
}
function computeFullStats(race, cls, secJob, equipment) {
  const base = computeStats(race, cls);
  const secB = (secJob && typeof window.computeSecJobBonuses === 'function') ? window.computeSecJobBonuses(secJob) : { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,awr:0,int:0,spd:0 };
  const eqB = (equipment && typeof window.computeEquipBonuses === 'function') ? window.computeEquipBonuses(equipment) : { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,awr:0,int:0,spd:0 };
  const delta = {};
  const final = {};
  for (const k of ['hp','mp','atk','def','mdef','move','awr','int','spd']) {
    const b = base[k] || 0;
    const d = (secB[k]||0) + (eqB[k]||0);
    delta[k] = d;
    final[k] = Math.max(k==='move'||k==='awr'||k==='spd'?1:0, b + d);
  }
  final.range = base.range || 1;
  final.inspect = base.inspect || 1;
  delta.range = 0;
  delta.inspect = 0;
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

// Slot budget: a spell occupies 1-3 of the SPELL_SLOT_MAX slots based on power.
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
  const slotCap = typeof window.SPELL_SLOT_MAX !== 'undefined' ? window.SPELL_SLOT_MAX : 8;
  const picks = [];
  const seen = new Set();
  let used = 0;
  const tryAdd = (sid) => {
    if (!sid || seen.has(sid)) return;
    const c = spellIdSlotCost(sid);
    if (used + c > slotCap) return;
    picks.push(sid);
    seen.add(sid);
    used += c;
  };

  const ra = (typeof window.RACE_ABILITIES !== 'undefined' && window.RACE_ABILITIES[race])
    ? window.RACE_ABILITIES[race].filter(a => (!a.jobRequirement || a.jobRequirement === cls) && a.id)
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
function TypeChip({ type, size }) {
  const c = getTypeColor(type);
  const text = TYPE_TEXT_C[(type || '').toLowerCase()] || c;
  const fs = size || 10;
  return h('span', { style: { display:'inline-flex', alignItems:'center', fontFamily:'DotGothic16, monospace', fontSize:fs, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:1.3, color:text, padding: fs >= 11 ? '3px 10px' : '2px 8px', border:`1px solid ${c}aa`, background:`linear-gradient(${c}22,${c}22), rgba(9,11,17,0.82)`, textShadow:'0 1px 2px rgba(0,0,0,0.85)', clipPath:'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}, type);
}
function StatBar({ label, val, max, compact, zodiacMod, delta }) {
  const pct = Math.min(100, (val / max) * 100);
  const tone = pct >= 70 ? EW.good : pct >= 40 ? EW.warn : EW.bad;
  let barColor = tone, labelColor = EW.inkMute, valColor = EW.ink;
  if (zodiacMod === 'up') { barColor = EW.good; labelColor = EW.good; valColor = EW.good; }
  if (zodiacMod === 'dn') { barColor = EW.bad; labelColor = EW.bad; valColor = EW.bad; }
  const deltaNum = delta || 0;
  return h('div', { style:{ display:'flex', alignItems:'center', gap:4, fontFamily:'DotGothic16, monospace', fontSize:11 } },
    h('span', { style:{ width:30, color:labelColor, letterSpacing:'0.04em', fontSize:10 } }, label,
      zodiacMod === 'up' ? h('span', { style:{color:EW.good, fontSize:'0.7em'} }, ' \u25B2') : null,
      zodiacMod === 'dn' ? h('span', { style:{color:EW.bad, fontSize:'0.7em'} }, ' \u25BC') : null),
    h('div', { style:{ flex:1, position:'relative', height: compact?5:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(120,140,180,0.08)' } },
      h('div', { style:{ position:'absolute', inset:0, width:`${pct}%`, background:`linear-gradient(90deg, ${barColor}, ${barColor}aa)` } })),
    h('span', { style:{ width:32, textAlign:'right', color:valColor, fontWeight:600, fontSize:11 } }, val),
    deltaNum !== 0 ? h('span', { style:{ width:28, textAlign:'right', fontSize:9, fontWeight:700, color: deltaNum > 0 ? EW.good : EW.bad } }, deltaNum > 0 ? '+'+deltaNum : ''+deltaNum) : h('span', { style:{ width:28 } }));
}
function StarField() {
  const stars = React.useMemo(() => {
    const arr = []; let s = 9*9301+49297;
    for (let i = 0; i < 120; i++) { s=(s*9301+49297)%233280; const x=(s/233280)*100; s=(s*9301+49297)%233280; const y=(s/233280)*100; s=(s*9301+49297)%233280; const sz=((s/233280)*1.4)+0.3; s=(s*9301+49297)%233280; const o=((s/233280)*0.6)+0.1; arr.push(h('div',{key:i,style:{position:'absolute',left:`${x}%`,top:`${y}%`,width:sz,height:sz,background:`rgba(220,230,255,${o})`,borderRadius:'50%',pointerEvents:'none'}})); }
    return arr;
  }, []);
  return h('div',{style:{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}},
    h('div',{style:{position:'absolute',inset:0,backgroundImage:`linear-gradient(${EW.grid} 1px, transparent 1px), linear-gradient(90deg, ${EW.grid} 1px, transparent 1px)`,backgroundSize:'56px 56px',maskImage:'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 80%)',WebkitMaskImage:'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 80%)'}}), stars);
}
function SigilMark() {
  return h('svg',{width:22,height:22,viewBox:'0 0 28 28'},h('circle',{cx:14,cy:14,r:12,fill:'none',stroke:EW.time,strokeWidth:1}),h('circle',{cx:14,cy:14,r:6,fill:'none',stroke:EW.time,strokeWidth:0.5}),h('circle',{cx:14,cy:14,r:2,fill:EW.time}),h('line',{x1:14,y1:0,x2:14,y2:4,stroke:EW.time,strokeWidth:1}),h('line',{x1:14,y1:24,x2:14,y2:28,stroke:EW.time,strokeWidth:1}),h('line',{x1:0,y1:14,x2:4,y2:14,stroke:EW.time,strokeWidth:1}),h('line',{x1:24,y1:14,x2:28,y2:14,stroke:EW.time,strokeWidth:1}));
}
function classifySpellLocal(sp) { if (!sp) return 'utility'; if (typeof window.classifySpell==='function') return window.classifySpell(sp); const k=sp.kind||sp.type||''; if (/heal/i.test(k)) return 'heal'; if (/buff|shield/i.test(k)) return 'buff'; if (/debuff/i.test(k)) return 'debuff'; if (/damage|dmg/i.test(k)) return 'damage'; return 'utility'; }
function spellCategoryColor(cat) { return {damage:'rgba(152,80,80,0.7)',heal:'rgba(90,148,86,0.7)',buff:'rgba(80,126,160,0.7)',debuff:'rgba(200,170,70,0.7)',utility:'rgba(140,100,180,0.65)'}[cat]||'rgba(140,100,180,0.65)'; }
function spellCategoryLabel(cat) { return {damage:'DAMAGE',heal:'HEAL',buff:'BUFF',debuff:'DEBUFF',utility:'UTILITY'}[cat]||'UTILITY'; }

// Human-readable area-of-effect footprint from whatever shape fields a spell uses.
function pbAoeLabel(sp) {
  if (!sp) return null;
  if (sp.crossRadius) return 'Cross r' + sp.crossRadius;
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
  const typeC = getTypeColor(sp.spellType || 'human');
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
        h('span', { style: { fontFamily: 'Cinzel, serif', fontSize: 15, letterSpacing: '0.06em', color: EW.ink, fontWeight: 600, lineHeight: 1.1 } }, sp.name),
        h('span', { style: { fontSize: 9, color: EW.inkMute, letterSpacing: '0.04em' } }, [sp.school, sp.tier && ('Tier ' + sp.tier)].filter(Boolean).join('  ·  '))),
      h('div', { style: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 } },
        h('span', { style: { fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: catC, border: `1px solid ${catC}66`, background: `${catC}1a`, padding: '1px 6px' } }, spellCategoryLabel(cat)),
        sp.spellType && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8, color: typeC, letterSpacing: '0.08em', textTransform: 'uppercase' } }, h('span', { style: { width: 4, height: 4, background: typeC, borderRadius: '50%' } }), sp.spellType))),
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
// The builder's spell rows mirror the in-battle Horologe blades
// (hud.js): category glyph + colored left edge, Cinzel name, the
// canonical type badge, power/MP chips. What you equip here is what
// you'll recognize mid-fight. Category map matches hud.js _HRLG_CAT.
const PB_CAT = {
  damage:  { icon: '⚔', color: '#ee6655' },
  heal:    { icon: '♥', color: '#55cc66' },
  buff:    { icon: '▲', color: '#55aaff' },
  debuff:  { icon: '▼', color: '#cc77dd' },
  utility: { icon: '◎', color: '#ccaa55' },
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
function pbTypeBadgeStyle(typeKey, fontSize) {
  const k = (typeKey || '').toLowerCase();
  const base = TYPE_C[k] || EW.inkMute;
  return { display:'inline-flex', alignItems:'center', flexShrink:0, fontFamily:'DotGothic16, monospace', fontSize:fontSize||9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', lineHeight:1.3, color:TYPE_TEXT_C[k]||base, background:`linear-gradient(${base}22,${base}22), rgba(9,11,17,0.82)`, border:`1px solid ${base}aa`, padding:'1px 6px', textShadow:'0 1px 2px rgba(0,0,0,0.85)', clipPath:'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' };
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
  const costColor = sc >= 3 ? 'rgba(255,150,120,0.9)' : sc === 2 ? 'rgba(240,200,110,0.85)' : 'rgba(160,170,200,0.65)';
  const aoe = pbAoeLabel(sp);
  const rng = sp.range != null ? (sp.range === 0 ? 'Self' : 'RNG ' + sp.range) : null;
  const descBits = [rng, aoe ? 'AOE ' + aoe : null].filter(Boolean).join(' · ');
  return h('div', {
    className: 'pbx-blade' + (pool ? ' pool' : '') + (equipped ? ' on' : '') + (equippedSlot ? ' equipped' : ''),
    style: { '--cat': cc.color, opacity: dim ? 0.45 : 1, minHeight: heightPx || undefined },
    onClick, onMouseEnter: onHoverIn, onMouseLeave: onHoverOut,
  },
    slotNoNode(slotNums, slotLabel),
    pool ? h('span', { className:'pbx-checkbox', style:{ borderColor: equipped ? cc.color : 'rgba(140,160,200,0.4)' } }, equipped ? h('span', { style:{ width:6, height:6, background:cc.color, display:'block' } }) : null) : null,
    h('span', { className:'pbx-glyph', style:{ color:cc.color } }, cc.icon),
    h('div', { className:'pbx-main' },
      h('div', { className:'pbx-row1' },
        h('span', { className:'pbx-name' }, sp.name),
        sp.spellType ? h('span', { style: pbTypeBadgeStyle(sp.spellType, 8) }, sp.spellType) : null,
        h('span', { style:{ flex:1, minWidth:4 } }),
        h('span', { className:'pbx-cost', title: sc + ' loadout slot' + (sc > 1 ? 's' : ''), style:{ color:costColor } }, '◆'.repeat(sc)),
        pw ? h('span', { className:'pbx-pw', style:{ color:pw.color } }, pw.value + ' ' + pw.unit) : null,
        sp.cost ? h('span', { className:'pbx-mp' }, sp.cost + ' MP') : null,
        (!pool && onClick) ? h('span', { className:'pbx-x' }, '✕') : null),
      h('div', { className:'pbx-desc' }, [descBits, sp.desc || ''].filter(Boolean).join(' — ') || spellCategoryLabel(cat))));
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
    { icon: '✨', name: 'Pixie Dust Trail', desc: 'Sheds glowing dust where she moves — allies who step on a mote recover HP and MP.' }, // CODED
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🌲', name: 'Forest Spirit', desc: 'Moves through trees at full speed.' },                                // CODED
  ],
  'werewolf': [
    { icon: '🌕', name: 'Lunar Shift', desc: 'Walks as a human by day — becomes the beast at night.' },               // CODED
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/INT at night; penalized in daylight.' },                         // CODED
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
  ],
  'grey': [
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/INT at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Telepathic Network', desc: 'Allies gain +1 AWR while a Grey is on the field.' },             // DESIGN
  ],
  'telepath': [
    { icon: '🪽', name: 'Levitation', desc: 'Airborne — floats over hazards and rough ground. Grounded below 25% HP.' },  // CODED
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/INT at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Unquiet Mind', desc: 'Immune to sleep and charm.' },                                         // DESIGN
  ],
  'vampire': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '🩸', name: 'Hemophage', desc: 'Basic attacks drain a portion of the damage as HP.' },                    // DESIGN
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
    { icon: '💰', name: 'Plunder', desc: 'Earns extra gold from kills.' },                                            // DESIGN
  ],
  'bigfoot': [
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🦶', name: 'Elusive', desc: 'Hidden while in forest until it acts.' },                                   // DESIGN
  ],
  'catgirl': [
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '🐾', name: 'Featherfall', desc: 'Never takes fall damage — always lands on her feet.' },                 // DESIGN
    { icon: '👁️', name: 'Night Vision', desc: 'Vision is not reduced at night.' },                                    // DESIGN
  ],
  'knight': [
    { icon: '🛡️', name: 'Man-at-Arms', desc: 'Heavy plate — immune to stagger.' },                                    // DESIGN
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
  'cowboy': [
    { icon: '🤠', name: 'Quickdraw', desc: 'Wins every speed tie — always acts first among equals.' },                // DESIGN
    { icon: '🎯', name: 'Deadeye', desc: '+15% damage to targets at maximum range.' },                                // DESIGN
  ],
  'machine elves': [
    { icon: '🌀', name: 'Fractal Mind', desc: 'Immune to psychic debuffs — charm and confusion.' },                   // DESIGN
    { icon: '⚙️', name: 'Self-Assembling', desc: 'Repairs 3% of max HP every round.' },                               // DESIGN
  ],
  'martian': [
    { icon: '👽', name: 'Low-G Physique', desc: 'Jumps 1 tile higher.' },                                             // DESIGN
    { icon: '🔫', name: 'Ray Tech', desc: '+10% damage with beam and projectile spells.' },                           // DESIGN
  ],
  'nordic': [
    { icon: '🛸', name: 'Federation Envoy', desc: 'A Tall Blonde of the Galactic Federation — light-tech beams, stasis and psychic calm.' }, // LORE
    { icon: '🛡️', name: 'Serene Mind', desc: 'Immune to fear and charm.' },                                           // DESIGN
  ],
  'halfdemon': [
    { icon: '😈', name: 'Dual Heritage', desc: 'Counts as both Human and Unholy in type matchups.' },                 // CODED (types)
    { icon: '🔥', name: 'Infernal Blood', desc: 'Burns on her end 1 turn sooner.' },                                  // DESIGN
  ],
};
if (typeof window !== 'undefined') window.RACE_TRAITS = RACE_TRAITS;

// Compact tactical diamond: MOV and RNG each get their own footprint.
function RangeDiamond({ radius, fill, edge, label, value, color }) {
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
  return h('div', { style: { display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 } },
    h('div', { style: { position:'relative', width: size * cellPx, height: size * cellPx } }, ...cells),
    h('div', { style: { fontSize:9, color, letterSpacing:'0.1em', fontWeight:600, whiteSpace:'nowrap' } }, label, ' ', h('span', { style:{ color:'#e6e9f2' } }, value)));
}
// RPG-style equipment/item slot square flanking the hero sprite.
function EquipSlotBox({ size, accent, filled, icon, label, title, onClick, onClear }) {
  const s = size || 48;
  return h('div', { onClick, title, className:'pbx-eqslot' + (filled ? ' filled' : ''), style:{ width:s, height:s, '--acc': accent || 'rgba(180,200,240,0.55)' } },
    filled && onClear ? h('span', { className:'pbx-eqslot-x', title:'Remove', onClick:(e)=>{ e.stopPropagation(); onClear(); } }, '✕') : null,
    h('span', { className:'pbx-eqslot-icon' }, filled ? icon : '+'),
    filled && label ? h('span', { className:'pbx-eqslot-label' }, label) : null);
}

function PartyBuilder() {
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
  const showSpellTip = (sp, e) => { if (sp) setSpellTip({ sp, x: e.clientX, y: e.clientY }); };
  const hideSpellTip = () => setSpellTip(null);
  const [heroTab, setHeroTab] = React.useState('stats');            // 'stats' | 'lore'
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
  const saveCurrentTeam = (name) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    if (!p.teamPresets) p.teamPresets = [];
    const MAX = window.ProfileSystem?.MAX_TEAM_PRESETS || 20;
    if (p.teamPresets.length >= MAX) { sfx('uiError'); return; }
    const slots = [];
    for (let i = 0; i < teamSize; i++) {
      const cn = typeof window.normalizeClassName === 'function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i] || 'Warrior');
      const mt = st.partyMeta?.[player]?.[i] || {};
      const lo = st.loadouts?.[player]?.[i] || {};
      slots.push({
        cls: cn,
        race: mt.race || 'homosapien',
        gender: mt.gender || 'male',
        unitName: (st.partyNames?.[player] || [])[i] || cn,
        customSpells: mt.customSpells ? mt.customSpells.slice() : [],
        secondaryJob: mt.secondaryJob || null,
        zodiac: mt.zodiac || 'aries',
        loadout: { items: lo.items ? { ...lo.items } : {}, equipment: lo.equipment ? { ...lo.equipment } : {} },
      });
    }
    p.teamPresets.push({
      id: 'team-' + Date.now(),
      name: name || 'Team ' + (p.teamPresets.length + 1),
      slots,
      gameMode: st.gameMode || 'arena',
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    });
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiButtonConfirm');
    setShowTeamModal(false);
    setTeamSaveName('');
  };
  const loadTeamPreset = (preset) => {
    if (!preset?.slots) return;
    for (let i = 0; i < Math.min(preset.slots.length, teamSize); i++) {
      const s = preset.slots[i];
      if (!st.partyBuilds[player]) st.partyBuilds[player] = [];
      st.partyBuilds[player][i] = s.cls;
      if (!st.partyMeta[player]) st.partyMeta[player] = [];
      if (!st.partyMeta[player][i]) st.partyMeta[player][i] = {};
      st.partyMeta[player][i].race = s.race;
      st.partyMeta[player][i].gender = s.gender;
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
    const prevJob = st.partyBuilds[player][slot]; st.partyMeta[player][slot].race = raceKey; st.partyMeta[player][slot].gender = gender;
    if (raceKey === 'homosapien') st.partyBuilds[player][slot] = jobName; else { const lj = window.RACE_DEFAULT_JOBS?.[raceKey]; if (lj) st.partyBuilds[player][slot] = lj; }
    if (st.partyBuilds[player][slot] !== prevJob) delete st.partyMeta[player][slot].customSpells;
    if (!st.loadouts[player]) st.loadouts[player] = []; if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    const lo = st.loadouts[player][slot]; if (typeof window.ITEM_RULES !== 'undefined') { lo.items = Object.fromEntries(Object.keys(window.ITEM_RULES).map(k=>[k,0])); lo.items.healPotion=1;lo.items.manaPotion=1;lo.items.panacea=1; }
    lo.equipment = typeof window.getDefaultEquipment === 'function' ? window.getDefaultEquipment(st.partyBuilds[player][slot]) : {};

    const _mm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
    if (!st.partyMeta[player][slot].customSpells) {
      st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(raceKey, st.partyBuilds[player][slot], st.partyMeta[player][slot].secondaryJob || '');
    }
    st.teamLockedIn = false; if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiCursorMove'); refresh();
  }
  function confirmSlot() { if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; if (!st.builderConfirmedSlots[player]) st.builderConfirmedSlots[player]={}; st.builderConfirmedSlots[player][slot]=true; sfx('uiButtonConfirm'); for (let ni=0;ni<teamSize;ni++){const nx=(slot+1+ni)%teamSize;if(!st.builderConfirmedSlots[player][nx]){setSlot(nx);break;}} refresh(); }
  function selectSlot(i) { setSlot(i); st.builderSelectedSlot=i; st.builderSelectedPlayer=player; sfx('uiCursorMove'); refresh(); }
  function doRandomize() { if (typeof window.randomizeUnitSlot==='function') window.randomizeUnitSlot(player,slot); if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiButtonConfirm'); refresh(); }
  function doRandomizeAll() { if (typeof window.randomizeParty==='function') window.randomizeParty(player); if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; st.builderConfirmedSlots[player]={}; for(let i=0;i<teamSize;i++) st.builderConfirmedSlots[player][i]=true; sfx('uiButtonConfirm'); refresh(); }
  function doDefaults() { st.builderConfirmedSlots={}; if (typeof window.defaultAllTeams==='function') window.defaultAllTeams();  const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:8; [1,2].forEach(p=>{ if (!st.partyMeta[p]) st.partyMeta[p]=[]; for (let i=0;i<(st.partyBuilds[p]||[]).length;i++){ if (!st.partyMeta[p][i]) st.partyMeta[p][i]={}; const lo=st.loadouts?.[p]?.[i]; if (lo&&Array.isArray(lo.spells)&&lo.spells.filter(Boolean).length>0){ const _ids=lo.spells.filter(Boolean); st.partyMeta[p][i].customSpells=typeof window.trimSpellIdsToSlotBudget==='function'?window.trimSpellIdsToSlotBudget(_ids,st.partyBuilds[p][i]):_ids.slice(0,slotCap); }}}); refresh(); }
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
  function toggleSpell(spellId) { if (!spellId) return; if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:8; const m=st.partyMeta[player][slot]; if (!Array.isArray(m.customSpells)) m.customSpells=[]; const arr=m.customSpells,idx=arr.indexOf(spellId); if(idx>=0)arr.splice(idx,1);else{if(usedSpellSlots(arr)+spellIdSlotCost(spellId)>slotCap){sfx('uiError');return;}arr.push(spellId);} st.teamLockedIn=false; sfx('uiCursorMove'); refresh(); }
  function resetCustomSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={};
    st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(unitRace, clsName, secJob);
    st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function clearAllSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; st.partyMeta[player][slot].customSpells=[]; st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function randomizeSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:8;

    const allJobs = typeof window.JOB_MODIFIERS!=='undefined' ? Object.keys(window.JOB_MODIFIERS) : [];
    const mainJob = st.partyBuilds?.[player]?.[slot] || clsName;
    const secOptions = allJobs.filter(j => j && j !== mainJob && j !== 'Freelancer');
    if (secOptions.length > 0) { st.partyMeta[player][slot].secondaryJob = secOptions[Math.floor(Math.random()*secOptions.length)]; }
    const curSecJob = st.partyMeta[player][slot].secondaryJob || '';
    const raIds=raceAbilities.filter(a=>a.id).map(a=>a.id);

    const freshPool = []; if (typeof window.SPELL_LIBRARY!=='undefined'&&typeof window.isSpellNativeToClass==='function') { for (const sp of Object.values(window.SPELL_LIBRARY)){if(!sp||sp.kind==='basicAttack')continue;const isM=window.isSpellNativeToClass(sp,mainJob);const isS=curSecJob&&window.isSpellNativeToClass(sp,curSecJob)&&sp.tier!=='III';if(isM||isS){freshPool.push(sp);}}}
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
  const spellPool = React.useMemo(() => { if (typeof window.SPELL_LIBRARY==='undefined') return []; const mainJob=clsName,secJ=secJob,pool=[]; for (const sp of Object.values(window.SPELL_LIBRARY)){if(!sp||sp.kind==='basicAttack')continue;const isM=typeof window.isSpellNativeToClass==='function'&&window.isSpellNativeToClass(sp,mainJob);const isS=secJ&&typeof window.isSpellNativeToClass==='function'&&window.isSpellNativeToClass(sp,secJ)&&sp.tier!=='III';if(isM||isS){pool.push(sp);}} return pool; }, [clsName, secJob, _]);

  const numerals = ['I','II','III','IV','V','VI','VII','VIII'];
  const unitName = resolveUnitName(player, slot, clsName);
  const allAccIds = typeof window.EQUIP_DEFS!=='undefined' ? Object.keys(window.EQUIP_DEFS).filter(id=>{const d=window.EQUIP_DEFS[id];return d&&(d.slot==='accessory1'||d.slot==='accessory2');}) : [];
  const allItemKeys = typeof window.ITEM_RULES!=='undefined' ? Object.keys(window.ITEM_RULES) : [];
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

  return h('div', { className: `pb-tarot pb-tarot-${unitFaction}`, style:{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background: `radial-gradient(ellipse 900px 700px at 65% 35%, ${fc}12, transparent 60%), radial-gradient(ellipse 1200px 900px at 20% 50%, #12101e 0%, ${EW.bg} 60%, #02030a 100%)`, color: EW.ink, fontFamily:'DotGothic16, monospace', display:'flex', flexDirection:'column', '--pb-fc': fc }},
    h(StarField),

    h('div', { style:{ display:'flex', alignItems:'center', height:46, padding:'0 14px 0 8px', gap:10, borderBottom:`1px solid ${EW.panelEdge}`, flexShrink:0, position:'relative', zIndex:2 }},
      h(SigilMark),
      h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:15, letterSpacing:'0.14em', fontWeight:500 } }, 'ENTROPY WARS'),
      h('span', { style:{ width:1, height:16, background:EW.panelEdge } }),
      h('span', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.2em' } }, 'CHOOSE YOUR VESSEL'),
      h('div', { style:{flex:1} }),
      h('span', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.14em' } }, teamSize, ' SLOTS \u00B7 ',
        h('span', { style:{color:EW.ink} }, (mpMode?.label || 'BATTLE').toUpperCase())),
    ),

    h('div', { style:{ display:'grid', gridTemplateColumns:'112px minmax(0,1fr) clamp(340px,28vw,470px)', flex:1, minHeight:0, position:'relative', zIndex:1 } },

      h('div', { style:{ display:'flex', flexDirection:'column', gap:6, padding:'10px 6px 10px 8px', borderRight:`1px solid ${EW.panelEdge}`, background:'linear-gradient(90deg, rgba(0,0,0,0.35), transparent)', overflowY:'auto' }},
        h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:11, letterSpacing:'0.16em', color:EW.inkMute, marginBottom:2, flexShrink:0 } }, 'THE PARTY'),
        Array.from({length: teamSize}).map((_, i) => {
          const cn = typeof window.normalizeClassName==='function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i]||'Warrior');
          const mt = st.partyMeta?.[player]?.[i] || (typeof window.getArchetypeForJob==='function' ? window.getArchetypeForJob(cn) : {});
          const id = typeof window.resolveIdentityForBuild==='function' ? window.resolveIdentityForBuild(cn,mt) : {race:'homosapien',faction:'time',types:['human'],gender:'male'};
          const pf = window.RACE_PROFILES?.[id.race], isActive = i===slot, fCol = getFactionColor(id.faction);
          const confirmed = !!(st.builderConfirmedSlots?.[player]?.[i]);
          const nm = resolveUnitName(player, i, cn);
          return h('div', { key:i, onClick:()=>selectSlot(i), className:'pb-slot-card', style:{ position:'relative', cursor:'pointer', flex:1, minHeight:0, background:isActive?`linear-gradient(180deg,${fCol}18,rgba(0,0,0,0.3))`:'rgba(0,0,0,0.3)', border:`1px solid ${isActive?fCol+'99':EW.panelEdge}`, padding:'4px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, clipPath:'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }},
            isActive && h('div', { style:{ position:'absolute', top:0, bottom:0, left:0, width:3, background:fCol, boxShadow:`0 0 10px ${fCol}` } }),
            confirmed && h('div', { style:{ position:'absolute', top:3, right:4, fontSize:10, color:'rgba(100,200,120,0.7)', fontWeight:700 } }, '✓'),
            h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:10, fontStyle:'italic', color:isActive?fCol:EW.inkDim, opacity:isActive?0.85:0.45, alignSelf:'flex-end', marginRight:4 } }, numerals[i]),
            /* Portraits are 128×128 art — the box stays a SQUARE no matter the
               party size (the outer flex row absorbs the leftover space). */
            h('div', { style:{ width:'100%', flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }},
              h('div', { style:{ height:'100%', maxWidth:'100%', aspectRatio:'1 / 1', display:'flex', alignItems:'flex-end', justifyContent:'center', background:`linear-gradient(180deg,${fCol}08,rgba(0,0,0,0.4))`, position:'relative', overflow:'hidden' }},
                h('div', { style:{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'120%', height:'30%', background:`radial-gradient(ellipse,${fCol}40,transparent 70%)`, filter:'blur(4px)', pointerEvents:'none' } }),
                h(PortraitSprite, { race:id.race, gender:id.gender||'male', cls:cn, glow:isActive?id.faction:null }),
              ),
            ),
            h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:10, fontWeight:500, lineHeight:1.1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textAlign:'center', width:'100%', padding:'0 2px' } }, nm),
            h('div', { style:{ fontSize:7, color:EW.inkMute, letterSpacing:'0.06em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textAlign:'center', paddingBottom:1 } }, (_grl(id.race,id.gender)||id.race||'?').toUpperCase(),' · ',getJobDisplay(cn).toUpperCase()),
          );
        }),
      ),

      h('div', { style:{ display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' } },

        // ══ HERO SHOWCASE — the selected vessel, staged like it matters ══
        h('div', { style:{ display:'flex', height:'54%', minHeight:0, flexShrink:0, borderBottom:`1px solid ${EW.panelEdge}` } },

          // ── the stage: gear rail · big sprite · item rail ──
          h('div', { style:{ flex:'0 0 46%', minWidth:0, display:'flex', flexDirection:'column', padding:'8px 4px 8px 10px', position:'relative' } },
            h('div', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.18em', flexShrink:0 } }, '· SLOT ', numerals[slot], ' · ', getJobDisplay(clsName).toUpperCase()),
            h('div', { style:{ flex:1, minHeight:0, display:'flex', gap:8, alignItems:'stretch' } },
              h('div', { style:{ display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:7, paddingBottom:12, flexShrink:0 } },
                h('div', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.16em', textAlign:'center' } }, 'GEAR'),
                ['accessory1','accessory2'].map(sk => {
                  const accId = unitEquipment[sk];
                  const def = accId ? window.EQUIP_DEFS?.[accId] : null;
                  return h(EquipSlotBox, { key:sk, size:52, accent:fc,
                    filled:!!def, icon:def ? (ACC_ICONS[accId]||'\u{1F392}') : null,
                    label:def ? def.label : '', title:def ? `${def.label} — ${def.desc}` : 'Equip gear',
                    onClick:()=>{ setEquipPicker(sk); sfx('uiCursorMove'); },
                    onClear:def ? ()=>handleAccChange(sk, null) : null });
                })),
              h('div', { style:{ flex:1, minWidth:0, position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'center' } },
                h('div', { style:{ position:'absolute', left:'50%', top:'52%', transform:'translate(-50%,-50%)', width:'88%', aspectRatio:'1', background:`radial-gradient(circle, ${fc}26, transparent 62%)`, filter:'blur(18px)', pointerEvents:'none' } }),
                h('div', { style:{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', width:'70%', height:12, background:`radial-gradient(ellipse, ${fc}66, transparent 70%)`, filter:'blur(3px)', pointerEvents:'none' } }),
                h(Sprite, { race:unitRace, gender:identity.gender||'male', cls:clsName, size:'100%', glow:unitFaction, style:{ position:'relative', zIndex:1, width:'100%', height:'97%' } }),
              ),
              h('div', { style:{ display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:7, paddingBottom:12, flexShrink:0, paddingRight:4 } },
                h('div', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.16em', textAlign:'center' } }, 'ITEMS'),
                Array.from({length:itemSlotMax}).map((_, ii) => {
                  const ik = itemUnits[ii];
                  const rule = ik ? window.ITEM_RULES?.[ik] : null;
                  return h(EquipSlotBox, { key:ii, size:52, accent:fc,
                    filled:!!rule, icon:rule ? (rule.icon||'\u{1F4E6}') : null,
                    label:rule ? rule.name : '', title:rule ? `${rule.name} — ${rule.desc}` : 'Add an item',
                    onClick:()=>{ setEquipPicker('item'); sfx('uiCursorMove'); },
                    onClear:rule ? ()=>setItemCount(ik, -1) : null });
                })),
            ),
          ),

          // ── identity + assessment sheet ──
          h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:5, padding:'10px 12px 8px 10px', borderLeft:`1px solid ${EW.panelEdge}` } },
            h('div', { style:{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', flexShrink:0 } },
              h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:'clamp(20px,2.2vw,32px)', fontWeight:600, lineHeight:1, textShadow:`0 0 26px ${fc}33` } }, _grl(unitRace, identity.gender) || unitRace),
              h('span', { style:{ fontFamily:'Cinzel, serif', fontStyle:'italic', fontSize:'clamp(10px,1vw,14px)', fontWeight:300, color:EW.inkMute } }, 'the ', getJobDisplay(clsName).toLowerCase())),
            h('div', { style:{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', flexShrink:0 } },
              ...unitTypes.map((t,i)=>h(TypeChip,{key:i,type:t,size:11})),
              h('span', { style:{ fontSize:9, color:`${fc}99`, letterSpacing:'0.14em', marginLeft:4, textTransform:'uppercase' } }, unitFaction, ' alignment', factionBonusTxt ? ' · ' + factionBonusTxt : '')),
            h('div', { style:{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', flexShrink:0, fontSize:10 } },
              h('span', { style:{ color:EW.inkDim, letterSpacing:'0.08em' } }, 'NAME'),
              h('input', { key:player+'-'+slot, defaultValue:unitName, style:{ background:'rgba(0,0,0,0.3)', border:`1px solid ${EW.panelEdge}`, color:EW.ink, fontFamily:'DotGothic16, monospace', fontSize:10, padding:'3px 6px', width:110, minWidth:0 }, onBlur:e=>handleNameChange(e.target.value), onKeyDown:e=>{ if(e.key==='Enter') e.target.blur(); } }),
              h('span', { style:{ color:EW.inkDim, letterSpacing:'0.08em' } }, 'ZODIAC'),
              h('select', { value:identity.zodiac||'aries', onChange:e=>handleZodiacChange(e.target.value), style:{ background:'rgba(0,0,0,0.3)', border:`1px solid ${EW.panelEdge}`, color:EW.ink, fontFamily:'DotGothic16, monospace', fontSize:10, padding:'3px 4px', maxWidth:96 } },
                zodiacs.map(z=>h('option',{key:z,value:z,style:{background:'#0c0b16',color:'#ccc'}}, (window.ZODIAC_ICONS?.[z]||'')+' '+z.charAt(0).toUpperCase()+z.slice(1)))),
              // Subclass selection lives on the ABILITIES panel (it drives the
              // spell pool); this echo just keeps it visible on the sheet.
              !isArena && clsName!=='Freelancer' && secJob && h('span', { style:{ fontSize:9, color:`${fc}bb`, letterSpacing:'0.1em', textTransform:'uppercase' } }, '◈ SUB: ', getJobDisplay(secJob))),
            h('div', { style:{ display:'flex', gap:2, borderBottom:`1px solid ${EW.panelEdge}`, flexShrink:0, marginTop:2 } },
              h('button', { className:'pbx-tab'+(heroTab==='stats'?' on':''), onClick:()=>setHeroTab('stats') }, 'COMBAT ASSESSMENT'),
              h('button', { className:'pbx-tab'+(heroTab==='lore'?' on':''), onClick:()=>setHeroTab('lore') }, 'CODEX DOSSIER')),
            heroTab === 'stats'
              ? h('div', { style:{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:6, overflow:'hidden', paddingTop:2 } },
                  // stat bars (short) + separate MOVE / RANGE footprints
                  h('div', { style:{ display:'flex', gap:14, flexShrink:0 } },
                    h('div', { style:{ flex:'0 1 54%', minWidth:0, display:'flex', flexDirection:'column', gap:2 } },
                      STAT_KEYS.map(k => {
                        const mapped = STAT_MAP[k], val = fullStats[mapped]??fullStats[k]??fullStats[k.toLowerCase()]??0;
                        const d = statDeltas[mapped]??statDeltas[k]??statDeltas[k.toLowerCase()]??0;
                        let zMod = null;
                        if (zodiacNature && mapped !== 'range' && mapped !== 'move') { if (zodiacNature.buff===mapped) zMod='up'; else if (zodiacNature.debuff===mapped) zMod='dn'; }
                        return h(StatBar, { key:k, label:k, val, max:STAT_MAX_PB[k]||100, compact:true, zodiacMod:zMod, delta:d });
                      })),
                    h('div', { style:{ flex:1, display:'flex', gap:14, justifyContent:'center', alignItems:'flex-start', paddingTop:2 } },
                      h(RangeDiamond, { radius: fullStats.move ?? 3, fill:'rgba(80,160,255,0.45)', edge:'rgba(80,160,255,0.7)', label:'MOVE', value: fullStats.move ?? 3, color:'rgba(120,180,255,0.9)' }),
                      h(RangeDiamond, { radius: fullStats.range ?? 1, fill:'rgba(255,70,70,0.35)', edge:'rgba(255,70,70,0.6)', label:'RANGE', value: fullStats.range ?? 1, color:'rgba(255,120,120,0.9)' }))),
                  // race traits: passives & terrain rules unique to this vessel
                  h('div', { style:{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:3, overflow:'hidden' } },
                    h('div', { style:{ fontSize:9, color:fc, letterSpacing:'0.14em', fontWeight:600, flexShrink:0, borderTop:`1px solid ${EW.panelEdge}`, paddingTop:5 } }, 'RACE TRAITS ', h('span', { style:{ color:EW.inkDim, fontWeight:400 } }, '· PASSIVES & TERRAIN')),
                    h('div', { style:{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:3, paddingRight:2 } },
                      (RACE_TRAITS[unitRace] && RACE_TRAITS[unitRace].length)
                        ? RACE_TRAITS[unitRace].map((t, ti) => h('div', { key:ti, className:'pbx-trait' },
                            h('span', { style:{ fontSize:13, lineHeight:1.2, flexShrink:0, width:18, textAlign:'center' } }, t.icon),
                            h('div', { style:{ minWidth:0, fontSize:10, lineHeight:1.4 } },
                              h('span', { style:{ color:EW.ink, fontWeight:700, letterSpacing:'0.04em' } }, t.name),
                              h('span', { style:{ color:EW.inkMute } }, ' — ', t.desc))))
                        : h('div', { style:{ fontSize:10, color:EW.inkDim, fontStyle:'italic', padding:'4px 6px' } }, 'No documented traits — field research pending.'))))
              : h('div', { style:{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:5, paddingTop:4 } },
                  h('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
                    h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.04em', padding:'2px 6px', border:`1px solid ${EW.panelEdge}`, background:'rgba(0,0,0,0.3)' } }, classLabel),
                    h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.04em' } }, docNum)),
                  h('div', { style:{ fontSize:11, lineHeight:1.55, color:EW.inkMute, fontFamily:'Cinzel, serif', fontStyle:'italic', borderLeft:`2px solid ${fc}55`, paddingLeft:8 } }, codexLore),
                  h('div', { style:{ fontSize:7, color:EW.inkDim, letterSpacing:'0.08em', paddingTop:2 } }, 'TOP SECRET // ████████ // NOFORN')),
          ),
        ),

        // ══ ROSTER — compact codex grid; the hero + abilities lead ══
        h('div', { style:{ display:'flex', flexDirection:'column', gap:4, padding:'6px 10px', flex:1, minHeight:0, background:'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.45))', overflow:'hidden' }},
          h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flexShrink:0 } },
            h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:'clamp(12px,1vw,15px)', letterSpacing:'0.14em', textTransform:'uppercase', color:EW.inkMute } }, 'Codex of Vessels'),
            h('span', { style:{ fontSize:10, color:EW.inkDim, letterSpacing:'0.1em', marginRight:6 } }, filteredRoster.length,'/',rosterEntries.length),
            h('input', { placeholder:'Search...', value:rosterSearch, onChange:e=>setRosterSearch(e.target.value), style:{ background:'rgba(0,0,0,0.3)', border:`1px solid ${EW.panelEdge}`, color:EW.ink, fontFamily:'DotGothic16, monospace', fontSize:11, padding:'3px 10px', width:130 }}),
            h('select', { value:`${sortKey}-${sortDir}`, onChange:e=>{const[k,d]=e.target.value.split('-');setSortKey(k);setSortDir(d);}, style:{ background:'rgba(0,0,0,0.4)', border:`1px solid ${EW.panelEdge}`, color:EW.time, fontFamily:'DotGothic16, monospace', fontSize:11, padding:'3px 7px', appearance:'none', WebkitAppearance:'none' }},
              ...STAT_KEYS.map(k=>[h('option',{key:`${k}-desc`,value:`${k}-desc`,style:{background:'#0c0b16'}},`${k} ↓`),h('option',{key:`${k}-asc`,value:`${k}-asc`,style:{background:'#0c0b16'}},`${k} ↑`)]).flat(),
              h('option',{value:'label-asc',style:{background:'#0c0b16'}},'Name A-Z'), h('option',{value:'label-desc',style:{background:'#0c0b16'}},'Name Z-A')),
            h('select', { value:typeFilter||'', onChange:e=>setTypeFilter(e.target.value||null), title:'Filter by Type', style:{ background:'rgba(0,0,0,0.4)', border:`1px solid ${typeFilter?getTypeColor(typeFilter):EW.panelEdge}`, color:typeFilter?getTypeColor(typeFilter):EW.inkMute, fontFamily:'DotGothic16, monospace', fontSize:11, padding:'3px 7px', appearance:'none', WebkitAppearance:'none', cursor:'pointer' }},
              h('option',{value:'',style:{background:'#0c0b16',color:'#ccc'}},'All Types'),
              ...availableTypes.map(t=>h('option',{key:t,value:t,style:{background:'#0c0b16',color:'#ccc'}}, t.toUpperCase()))),
            h('select', { value:jobFilter||'', onChange:e=>setJobFilter(e.target.value||null), title:'Filter by Job', style:{ background:'rgba(0,0,0,0.4)', border:`1px solid ${jobFilter?EW.time:EW.panelEdge}`, color:jobFilter?EW.time:EW.inkMute, fontFamily:'DotGothic16, monospace', fontSize:11, padding:'3px 7px', appearance:'none', WebkitAppearance:'none', cursor:'pointer' }},
              h('option',{value:'',style:{background:'#0c0b16',color:'#ccc'}},'All Jobs'),
              ...availableJobs.map(j=>h('option',{key:j,value:j,style:{background:'#0c0b16',color:'#ccc'}}, getJobDisplay(j)))),
            h('span', { style:{ width:1, height:14, background:EW.panelEdge } }),
            ...['space','time','chaos'].map(fk=>h('button',{key:fk,onClick:()=>setFactionFilter(factionFilter===fk?null:fk),className:'pb-faction-chip',style:{ background:factionFilter===fk?`${FACTION_C[fk]}18`:'rgba(0,0,0,0.3)', border:`1px solid ${factionFilter===fk?FACTION_C[fk]:EW.panelEdge}`, color:factionFilter===fk?FACTION_C[fk]:EW.inkDim, padding:'2px 8px', fontFamily:'DotGothic16, monospace', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}, fk)),
          ),
          h('div', { style:{ flex:1, minHeight:0, overflow:'auto', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(72px, 1fr))', gap:4, padding:'4px 0', alignContent:'start' }},
            filteredRoster.map((entry, ei) => {
              const isActive = entry.race===unitRace && entry.gender===(identity.gender||'male') && (entry.race!=='homosapien'||entry.cls===clsName);
              const entryFc = getFactionColor(entry.faction);
              const starred = isFav(entry.race, entry.gender);
              // Account-unlock gate: only the local human's roster (player 1) is restricted.
              const locked = isLockedEntry(entry.race);
              const onCardClick = locked
                ? ()=>{ try{ sfx('uiError'); }catch(e){} if (typeof window._goToShop==='function') window._goToShop(entry.race); }
                : ()=>pickRace(entry.race,entry.gender,entry.job);
              return h('div', { key:ei, onClick:onCardClick, title: locked?'Locked — unlock this vessel in the Shop':`${entry.label} · ${getJobDisplay(entry.cls)}`, className:'pb-vessel-card'+(locked?' pb-vessel-locked':''), style:{ cursor:'pointer', position:'relative', background:isActive?`${entryFc}18`:'rgba(0,0,0,0.3)', border:`1px solid ${isActive?entryFc:EW.panelEdge}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'3px 2px 2px', gap:1, opacity: locked?0.55:1 }},
                h('div', { style:{ width:'100%', aspectRatio:'1', display:'flex', alignItems:'flex-end', justifyContent:'center', position:'relative', overflow:'hidden', background:`linear-gradient(180deg, transparent 40%, ${entryFc}10 100%)` }},
                  h(Sprite, { race:entry.race, gender:entry.gender, cls:entry.cls, size:'85%', style:{width:'85%',height:'85%', filter: locked?'brightness(0.18) grayscale(1)':'none'} }),
                  locked && h('div', { style:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'rgba(255,216,106,0.9)', textShadow:'0 1px 4px #000' } }, '🔒'),
                  !locked && h('div', { onClick:e=>{e.stopPropagation();toggleFav(entry.race,entry.gender);}, style:{ position:'absolute', top:0, left:0, width:15, height:15, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:11, color:starred?'#dcaa1e':'rgba(255,255,255,0.15)', textShadow:starred?'0 0 6px rgba(220,170,30,0.6)':'none', transition:'color 0.15s, text-shadow 0.15s', zIndex:1 } }, starred?'★':'☆')),
                h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:9, fontWeight:500, textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%', color:isActive?EW.ink:EW.inkMute, lineHeight:1.2 }}, entry.label),
                h('div', { style:{ fontSize:7, color:EW.inkDim, letterSpacing:'0.04em', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' } }, getJobDisplay(entry.cls)),
                isActive && h('div', { style:{ position:'absolute', inset:-1, border:`1px solid ${entryFc}`, boxShadow:`0 0 8px ${entryFc}44`, pointerEvents:'none' } }),
              );
            }),
          ),
        ),
      ),

      h('div', { style:{ display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden', padding:'8px 6px 8px 4px', borderLeft:`1px solid ${EW.panelEdge}`, background:'linear-gradient(270deg, rgba(0,0,0,0.3), transparent)' }},
        h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexShrink:0, padding:'0 6px 6px 10px', borderBottom:`1px solid ${fc}33` } },
          h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:17, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 } }, 'Abilities'),
          h('span', { style:{ fontSize:10, color: spellSlotsUsed>slotCap ? EW.bad : EW.time, letterSpacing:'0.12em', border:`1px solid ${spellSlotsUsed>slotCap?'rgba(255,122,138,0.45)':'rgba(242,196,104,0.35)'}`, background:'rgba(0,0,0,0.35)', padding:'2px 8px', whiteSpace:'nowrap' } }, spellSlotsUsed, '/', slotCap, ' SLOTS'),
          h('div', { style:{flex:1} }),
          !isArena&&h('button',{onClick:randomizeSpells,className:'pb-btn-ghost',style:{background:'transparent',border:`1px solid ${EW.panelEdge}`,color:EW.inkMute,fontSize:9,padding:'3px 8px',fontFamily:'DotGothic16, monospace',cursor:'pointer',letterSpacing:'0.1em'}},'RND'),
          !isArena&&h('button',{onClick:resetCustomSpells,className:'pb-btn-ghost',style:{background:'transparent',border:`1px solid ${EW.panelEdge}`,color:EW.inkMute,fontSize:9,padding:'3px 8px',fontFamily:'DotGothic16, monospace',cursor:'pointer',letterSpacing:'0.1em'}},'RST'),
          !isArena&&h('button',{onClick:clearAllSpells,className:'pb-btn-danger',style:{background:'transparent',border:`1px solid rgba(255,120,120,0.25)`,color:'rgba(255,120,120,0.7)',fontSize:9,padding:'3px 8px',fontFamily:'DotGothic16, monospace',cursor:'pointer',letterSpacing:'0.1em'}},'CLR')),

        // ── equipped loadout: fixed 8-slot rack; each spell physically occupies
        //    its cost in slots (taller blade = more slots), green = locked in ──
        h('div', { className:'pbx-slotrack', style:{ maxHeight:'48%', overflow:'hidden' } },
          h('div', { className:'pbx-slotrack-head' },
            h('span', { style:{ fontSize:10, color:'#79d99a', letterSpacing:'0.16em', fontWeight:700 } }, '🔒 EQUIPPED — SPELL SLOTS'),
            h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em', marginLeft:'auto' } }, spellSlotsUsed, ' / ', slotCap, ' SLOTS FILLED')),
          h('div', { className:'pbx-slotrack-body' },
          (()=>{
            const SLOT_H = 34, GAP = 3;
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
            if (spellSlotsUsed > slotCap) rows.push(h('div', { key:'overbudget', style:{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', margin:'0 9px 0 5px', background:'rgba(255,120,120,0.08)', borderLeft:'3px solid rgba(255,120,120,0.6)', fontSize:10, color:EW.bad } },
              h('span', { style:{flex:1} }, 'OVER BUDGET — remove spells (extras are dropped in battle)')));
            return rows;
          })())),

        // ── SUBCLASS — a second job that feeds the pool below and shifts stats ──
        !isArena && clsName!=='Freelancer' && h('div', { className:'pbx-subbar', style:{ '--cat': fc, flexShrink:0 }, onClick:()=>{ setEquipPicker('subjob'); sfx('uiCursorMove'); }, title:'A second job: its spells join this spell pool and its training shifts your stats.' },
          h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.16em', flexShrink:0 } }, 'SUBCLASS'),
          h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:14, fontWeight:700, color:EW.ink, letterSpacing:'0.04em', whiteSpace:'nowrap' } }, secJob ? getJobDisplay(secJob) : '— None —'),
          h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.04em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0, flex:1 } }, 'adds its spells to the pool below · shifts stats'),
          h('span', { style:{ fontSize:10, color:fc, letterSpacing:'0.1em', flexShrink:0 } }, '▾ CHANGE')),

        // ── the pool ──
        (!isArena&&(spellPool.length>0||raceAbilities.length>0))&&h(React.Fragment, null,
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
            })()),
        ),

        isArena&&raceAbilities.length>0&&h('div',{style:{marginTop:3,borderTop:`1px solid ${EW.panelEdge}`,paddingTop:5,display:'flex',flexDirection:'column',gap:3}},
          h('span',{style:{fontSize:10,color:'rgba(200,180,150,0.6)',letterSpacing:'0.1em',marginBottom:1,paddingLeft:10}},'RACE ABILITIES'),
          raceAbilities.map((a,ai)=>h(SpellBlade,{key:ai,sp:a,raceAbility:true,onHoverIn:e=>showSpellTip(a,e),onHoverOut:hideSpellTip}))),
      ),
    ),

    h('div', { style:{ display:'flex', alignItems:'center', padding:'0 16px', height:52, gap:8, borderTop:`1px solid ${EW.panelEdge}`, background:'linear-gradient(0deg, rgba(8,10,18,0.8), rgba(8,10,18,0.3))', flexShrink:0, position:'relative', zIndex:2 }},
      // One command row: exit · party tools · presets ─ status ─ commit
      h('button',{onClick:doBack,className:'pb-btn-danger',style:{background:'rgba(255,120,120,0.08)',color:'rgba(255,130,140,0.95)',border:'1px solid rgba(255,120,120,0.45)',padding:'9px 20px',fontFamily:'DotGothic16, monospace',fontSize:12,letterSpacing:'0.16em',cursor:'pointer',fontWeight:600}},'← BACK'),
      h('div',{style:{width:1,height:24,background:EW.panelEdge,margin:'0 4px'}}),
      h('button',{onClick:doRandomize,className:'pb-btn-ghost',style:{background:'transparent',color:EW.inkMute,border:`1px solid ${EW.panelEdge}`,padding:'9px 14px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.16em',cursor:'pointer'}},'RANDOM'),
      h('button',{onClick:doRandomizeAll,className:'pb-btn-ghost',style:{background:'transparent',color:EW.inkMute,border:`1px solid ${EW.panelEdge}`,padding:'9px 14px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.16em',cursor:'pointer'}},'RANDOM ALL'),
      h('button',{onClick:doDefaults,className:'pb-btn-ghost',style:{background:'transparent',color:EW.inkMute,border:`1px solid ${EW.panelEdge}`,padding:'9px 14px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.16em',cursor:'pointer'}},'DEFAULTS'),
      h('div',{style:{width:1,height:24,background:EW.panelEdge,margin:'0 4px'}}),
      h('button',{onClick:()=>{setTeamSaveName('');setShowTeamModal('save');},className:'pb-btn-ghost',style:{background:'rgba(220,170,30,0.06)',color:'#dcaa1e',border:'1px solid rgba(220,170,30,0.25)',padding:'9px 14px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.16em',cursor:'pointer'}},'\u2605 SAVE'),
      h('button',{onClick:()=>setShowTeamModal('load'),className:'pb-btn-ghost',style:{background:'rgba(100,180,255,0.06)',color:'rgba(100,180,255,0.9)',border:'1px solid rgba(100,180,255,0.25)',padding:'9px 14px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.16em',cursor:'pointer'}},'\u2191 LOAD'),
      h('div',{style:{flex:1}}),
      h('span',{style:{fontSize:10,color:EW.inkMute,letterSpacing:'0.12em'}}, 'SLOT ', numerals[slot], ' · ', unitName),
      h('div',{style:{width:1,height:24,background:EW.panelEdge,margin:'0 4px'}}),
      h('button',{onClick:confirmSlot,className:'pb-btn-confirm',style:{background:'rgba(100,200,120,0.08)',color:'rgba(100,200,120,0.9)',border:'1px solid rgba(100,200,120,0.25)',padding:'9px 16px',fontFamily:'DotGothic16, monospace',fontSize:11,letterSpacing:'0.12em',cursor:'pointer',fontWeight:600}},'CONFIRM'),
      friendlyHostCanStart
        ? h('button',{onClick:doStart,className:'pb-btn-primary',style:{background:'linear-gradient(180deg,rgba(100,200,120,0.25),rgba(100,200,120,0.08))',color:'rgba(140,240,160,0.95)',border:'1px solid rgba(100,200,120,0.6)',padding:'10px 28px',fontFamily:'Cinzel, serif',fontSize:16,letterSpacing:'0.22em',fontWeight:500,cursor:'pointer',boxShadow:'0 0 18px rgba(100,200,120,0.25)',display:'flex',alignItems:'center',gap:10}},
            '⚔ START MATCH')
        : isWaitingOnline
        ? h('button',{disabled:true,className:'pb-btn-primary pb-btn-waiting',style:{background:'linear-gradient(180deg,rgba(100,200,120,0.15),rgba(100,200,120,0.04))',color:'rgba(100,200,120,0.9)',border:'1px solid rgba(100,200,120,0.4)',padding:'10px 28px',fontFamily:'Cinzel, serif',fontSize:14,letterSpacing:'0.18em',fontWeight:500,display:'flex',alignItems:'center',gap:10,cursor:'default',opacity:0.9}},
            (isRankedNet && opponentLockedToo) ? 'MATCH STARTING…'
            : (!isRankedNet && netRole === 'guest' && opponentLockedToo) ? '⌛ WAITING FOR HOST TO START…'
            : '⌛ WAITING ON OPPONENT…')
        : h('button',{onClick:doStart,className:'pb-btn-primary',style:{background:`linear-gradient(180deg,${fc}28,${fc}0a)`,color:fc,border:`1px solid ${fc}`,padding:'10px 28px',fontFamily:'Cinzel, serif',fontSize:16,letterSpacing:'0.22em',fontWeight:500,cursor:'pointer',boxShadow:`0 0 18px ${fc}33`,display:'flex',alignItems:'center',gap:10}},
            'SEAL YOUR FATE',h('span',{style:{fontFamily:'DotGothic16, monospace',fontSize:10,opacity:0.7}},'\u21B5')),
    ),

    showTeamModal && h('div', { onClick:()=>setShowTeamModal(false), style:{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }},
      h('div', { onClick:e=>e.stopPropagation(), style:{ background:'#0e0d1a', border:`1px solid ${EW.panelEdge}`, padding:'20px 24px', minWidth:340, maxWidth:480, maxHeight:'70vh', display:'flex', flexDirection:'column', gap:12, boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }},
        h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' }},
          h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:16, letterSpacing:'0.16em' }}, showTeamModal === 'save' ? 'SAVE TEAM' : 'LOAD TEAM'),
          h('button', { onClick:()=>setShowTeamModal(false), style:{ background:'transparent', border:'none', color:EW.inkMute, fontSize:18, cursor:'pointer', lineHeight:1 }}, '\u2715')),

        showTeamModal === 'save' && h('div', { style:{ display:'flex', flexDirection:'column', gap:8 }},
          h('div', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.1em' }}, 'Name this team preset:'),
          h('input', { value:teamSaveName, onChange:e=>setTeamSaveName(e.target.value), placeholder:'e.g. Fire Squad, Tank Line...', maxLength:30, autoFocus:true, onKeyDown:e=>{ if(e.key==='Enter'&&teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); }, style:{ background:'rgba(0,0,0,0.4)', border:`1px solid ${EW.panelEdge}`, color:EW.ink, fontFamily:'DotGothic16, monospace', fontSize:13, padding:'8px 12px', width:'100%', boxSizing:'border-box' }}),
          h('div', { style:{ display:'flex', gap:6, justifyContent:'flex-end' }},
            h('button', { onClick:()=>setShowTeamModal(false), className:'pb-btn-ghost', style:{ background:'transparent', border:`1px solid ${EW.panelEdge}`, color:EW.inkMute, padding:'6px 14px', fontFamily:'DotGothic16, monospace', fontSize:11, cursor:'pointer' }}, 'CANCEL'),
            h('button', { onClick:()=>{ if(teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); }, className:'pb-btn-confirm', style:{ background:'rgba(220,170,30,0.1)', border:'1px solid rgba(220,170,30,0.35)', color:'#dcaa1e', padding:'6px 14px', fontFamily:'DotGothic16, monospace', fontSize:11, cursor:'pointer', fontWeight:600, opacity:teamSaveName.trim()?1:0.4 }}, 'SAVE')),
          h('div', { style:{ fontSize:9, color:EW.inkDim }}, getTeamPresets().length, '/', (window.ProfileSystem?.MAX_TEAM_PRESETS||20), ' presets used')),

        showTeamModal === 'load' && h('div', { style:{ display:'flex', flexDirection:'column', gap:4, maxHeight:'50vh', overflow:'auto' }},
          getTeamPresets().length === 0
            ? h('div', { style:{ color:EW.inkDim, fontSize:12, textAlign:'center', padding:20, fontStyle:'italic' }}, 'No saved teams yet. Use SAVE to store your current party.')
            : getTeamPresets().map(preset =>
              h('div', { key:preset.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(0,0,0,0.3)', border:`1px solid ${EW.panelEdge}`, cursor:'pointer' }},
                h('div', { onClick:()=>loadTeamPreset(preset), style:{ flex:1, display:'flex', flexDirection:'column', gap:2, cursor:'pointer' }},
                  h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:13, letterSpacing:'0.1em', color:EW.ink }}, preset.name),
                  h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' }},
                    ...(preset.slots||[]).map((s,si)=>{
                      const rl = typeof _grl==='function' ? _grl(s.race,s.gender) : s.race;
                      return h('span', { key:si, style:{ fontSize:9, color:EW.inkMute, background:'rgba(255,255,255,0.04)', padding:'1px 5px', border:`1px solid rgba(255,255,255,0.06)` }}, rl);
                    })),
                  h('div', { style:{ fontSize:8, color:EW.inkDim }}, preset.gameMode?.toUpperCase() || '', ' \u00B7 ', new Date(preset.createdAt).toLocaleDateString())),
                h('button', { onClick:e=>{e.stopPropagation();deleteTeamPreset(preset.id);}, style:{ background:'transparent', border:'1px solid rgba(255,100,100,0.2)', color:'rgba(255,100,100,0.5)', fontSize:9, padding:'3px 8px', fontFamily:'DotGothic16, monospace', cursor:'pointer' }}, 'DEL'),
              ))),
      )),

    equipPicker && h('div', { onClick:()=>setEquipPicker(null), style:{ position:'absolute', inset:0, background:'rgba(0,0,0,0.72)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }},
      h('div', { onClick:e=>e.stopPropagation(), style:{ background:'#0e0d1a', border:`1px solid ${EW.panelEdgeHi}`, padding:'16px 18px', width:430, maxWidth:'92vw', maxHeight:'72vh', display:'flex', flexDirection:'column', gap:10, boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }},
        h('div', { style:{ display:'flex', alignItems:'center', gap:10 }},
          h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:15, letterSpacing:'0.14em', textTransform:'uppercase' }},
            equipPicker === 'item' ? 'Battle Items' : equipPicker === 'subjob' ? 'Choose a Subclass' : 'Gear — Slot ' + (equipPicker === 'accessory1' ? '1' : '2')),
          equipPicker === 'item' && h('span', { style:{ fontSize:10, color: totalItemsUsed >= itemSlotMax ? EW.warn : EW.inkMute, letterSpacing:'0.1em' }}, totalItemsUsed, '/', itemSlotMax, ' CARRIED'),
          equipPicker === 'subjob' && h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.04em' }}, 'its spells join your pool · its training shifts your stats'),
          h('div', { style:{flex:1} }),
          h('button', { onClick:()=>setEquipPicker(null), style:{ background:'transparent', border:'none', color:EW.inkMute, fontSize:18, cursor:'pointer', lineHeight:1 }}, '✕')),
        h('div', { style:{ display:'flex', flexDirection:'column', gap:5, overflowY:'auto' }},
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
                    h('div', { style:{ fontFamily:'Cinzel, serif', fontSize:13, fontWeight:700, color: autoOn ? EW.ink : '#c3c8d6' }}, '— None —'),
                    h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.35 }}, 'No subclass. Your pool holds main-job spells and race abilities only.')),
                  autoOn ? h('span', { style:{ fontSize:9, color:fc, fontWeight:700, flexShrink:0, letterSpacing:'0.08em' }}, 'CURRENT') : null)];
                for (const j of jobs) {
                  const on = secJob === j;
                  const bs = bonusStr(j);
                  rows.push(h('div', { key:j, className:'pbx-pick-row', style: on ? { borderColor:fc, background:`${fc}14` } : undefined, onClick:()=>pickJob(j) },
                    // Plain homosapien in this job — a visual shorthand for the role.
                    h('div', { style:{ width:40, height:40, flexShrink:0, display:'flex', alignItems:'flex-end', justifyContent:'center', background:`linear-gradient(180deg, transparent 45%, ${fc}12 100%)`, border:`1px solid ${on?fc:EW.panelEdge}`, overflow:'hidden' }},
                      h(Sprite, { race:'homosapien', gender:'male', cls:j, size:'92%', style:{ width:'92%', height:'92%' } })),
                    h('div', { style:{ flex:1, minWidth:0 }},
                      h('div', { style:{ display:'flex', alignItems:'baseline', gap:8 }},
                        h('span', { style:{ fontFamily:'Cinzel, serif', fontSize:13, fontWeight:700, color: on ? EW.ink : '#c3c8d6' }}, getJobDisplay(j)),
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
                    count > 0 ? h('button', { className:'pb-stepper-btn', onClick:e=>{ e.stopPropagation(); setItemCount(ik, -1); }, style:{ width:20, height:20, background:'rgba(0,0,0,0.4)', border:`1px solid ${EW.panelEdge}`, color:EW.inkMute, fontSize:13, lineHeight:'18px', textAlign:'center', cursor:'pointer', padding:0, fontFamily:'DotGothic16, monospace' }}, '−') : null,
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
              })()),
      )),

    spellTip && buildSpellTooltip(spellTip.sp, spellTip.x, spellTip.y),
  );
}

let _pbRoot = null;
window._mountReactPartyBuilder = function() { const c=document.getElementById('builderOverlay'); if(!c)return; if(!_pbRoot)_pbRoot=ReactDOM.createRoot(c); _pbRoot.render(h(PartyBuilder)); };
window._unmountReactPartyBuilder = function() { if(_pbRoot){_pbRoot.unmount();_pbRoot=null;} };
window._refreshReactPartyBuilder = function() { if(_pbRoot)_pbRoot.render(h(PartyBuilder)); };

})();
