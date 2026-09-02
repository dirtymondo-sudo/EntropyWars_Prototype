// Canonical tile size, in pixels. The terrain sprites are 128×128, so the
// in-play board renders one sprite per tile 1:1 with no stretching. Every
// runtime `CONFIG.tileSize || BASE_TILE` fallback resolves here, so this is
// the single source of truth for tile size.
const BASE_TILE = 128;
// The non-battle menu / party-preview board uses a smaller tile so the whole
// grid fits on screen. It is the only place that intentionally differs from
// BASE_TILE.
const MENU_TILE = 58;

const CONFIG = {
    boardSize: 8,
    boardWidth: 16,
    boardHeight: 8,
    winHourglasses: 2,
    hiddenItemSpawns: 7,
    tileSize: MENU_TILE,
    tileGap: 0,
    boardPadding: 2,
    teamSize: 4,
    unitSkillSlots: 8,
    unitSpellBudget: 200,
    maxCrossClassSpells: 6,
    unitItemSlots: 3
};

const TERRAIN_RESHAPE_CONFIG = {
    apCost: 1,
    maxDeltaPerTurn: 3,
    minHeight: 0,
    maxHeight: 12,
};

/* ── BUILD action (universal Minecraft-style place/dig verb) ─────────────
   Every grounded unit can enter Build mode: 1 AP places one block of a
   banked material (or digs the top block off a column, salvaging its
   material) on any tile within `reach` (chebyshev, own tile included).
   `vReach` caps how far above the unit's feet the affected surface may
   be — you can't work a ledge 4 stories overhead. Digging is the
   anti-softlock valve: dug earth banks as stone, so a unit stuck in a
   pit can always quarry the walls and stack its way out. */
const BUILD_ACTION_CONFIG = {
    apCost: 1,
    reach: 1,
    vReach: 3,
    minHeight: 0,
    maxHeight: 12,
    eruptDamage: 22,   // crash damage when a block erupts under an enemy
};

// Placeable block types — keyed by the material they spend. Terrain
// identity matters downstream: timber burns/shatters, stone holds,
// steel conducts lightning across connected metal.
const BUILD_MATERIALS = {
    wood:  { terrain: 'wood_planks', icon: '🪵', label: 'Timber' },
    stone: { terrain: 'cobblestone', icon: '🪨', label: 'Stone' },
    metal: { terrain: 'metal',       icon: '⚙️', label: 'Steel' },
};

/* ── 💥 Breach & debris (2026-07-17 breach pass) ──────────────────────────
   Every BLOCK has a hardness tier (battle.js getTerrainHardness, keyed by
   the block's terrain):
     1 = brittle (wood family / ice / crystal)      2 = packed earth (plain
     terrain)      3 = masonry (stone family)       4 = plate (metal family)
     Infinity = the map-border 'wall' (indestructible).
   Impact power is tested against hardness; power ≥ hardness breaks the
   block and scatters collectible debris cubes (MAT_DROP_CONFIG below):
     · a hurled / knocked-back BODY → its weight class (bodyPower table)
     · a deliberate CHARGE (dash kinds) → weight class + dashPowerBonus
     · a BEAM (line kinds) → floor(spell.dmg / beamDmgPerPower), overridable
       per-spell with an explicit `breachPower` field. */
const BREACH_CONFIG = {
    bodyPower: { feather: 0, light: 1, medium: 1, heavy: 3, colossal: 4 },
    dashPowerBonus: 1,      // a deliberate charge rams harder than a tossed body
    beamDmgPerPower: 60,    // beam breach power = floor(spell.dmg / this)
    beamMaxBores: 2,        // walls one beam can drill through per cast
};

/* ── 🎱 Collision physics (2026-07-26 bounce pass) ────────────────────────
   A body hurled into something it cannot break no longer stops dead — it
   takes SLAM damage and REBOUNDS off the barrier pool-ball style, momentum
   conserved (a 3-tile throw travels 3 tiles unless something eats them).
   A body hurled into another UNIT is a bowling strike: both take crash
   damage and the unspent momentum transfers (weight-scaled) to the struck
   unit, which slides on under the same rules. Mystery Dungeon masonry is
   absolute — it never breaks, bodies always rebound. Consumed by
   battle.js resolveForcedSlide (every push / pull / hurl path). */
const COLLISION_CONFIG = {
    wallSlamDmg: 16,        // flat slam damage on hitting any unbreakable barrier
    wallSlamPerTile: 7,     // + per tile of unspent momentum at the moment of impact
    unitCrashDmg: 12,       // bowling-pin crash: BOTH bodies take this…
    unitCrashPerTile: 6,    // …+ per tile of unspent momentum
    maxBounces: 2,          // cushion rebounds per throw (a corner pocket ends it)
    maxChain: 3,            // momentum transfers per throw (A→B→C→D, then it stops)
};

/* 🧱 Mini material cubes (Minecraft-style debris). Violently destroyed
   blocks scatter these onto nearby walkable tiles; ANY grounded unit that
   walks over / lands on / stands under the scatter banks the pile for its
   team (gainMaterial). Deliberate BUILD-dig / tree-chop salvage still
   banks instantly — the worker is standing right there. */
const MAT_DROP_CONFIG = {
    scatterRadius: 2,    // how far debris can bounce from the break tile
    maxPerTile: 5,       // qty cap per cube pile (same-material piles merge)
    maxOnBoard: 80,      // oldest piles crumble beyond this
    deformDropCap: 10,   // one crater/nuke can't carpet the map in cubes
};

const FLYING_ALTITUDE_CONFIG = {
    apCost: 1,
    maxPerTurn: 3,
    minClearance: 2,
    // 2026-07-27: was 8 — flyers parked 8 tiles up were unreadable at a
    // glance (constant camera work to see the board) and nearly untouchable
    // (3D range is Chebyshev, so altitude 8 needed range-8 attacks). At 4 a
    // deliberate double-Ascend still buys real height advantage, but any
    // range-4 attack can reach a max-altitude flyer. Movement now tracks
    // clearance over terrain, so this cap is the only way that high.
    maxAltitudeAboveGround: 4,
    // Wounded flyers are grounded: below this fraction of max HP a flyer
    // crashes out of the air and cannot take off until healed above it.
    woundedGroundPct: 0.25,
};

const EQUIPMENT_SLOTS = ['accessory1', 'accessory2'];

const EQUIP_DEFS = {
    'binoculars': { slot: 'accessory1', label: 'Binoculars', desc: '+28 AWR. Sharper perception: higher crit chance, and at AWR 84+ senses hidden enemies from 2 tiles.', stat: 'awr', statVal: 28 },
    'walkie_talkie': { slot: 'accessory1', label: 'Walkie Talkie', desc: 'Shares line of sight with allied Walkie Talkie carriers. +14 AWR.', stat: 'awr', statVal: 14 },
    'flair': { slot: 'accessory1', label: 'Signal Flare', desc: 'One-use flare that reveals an area of the map. +14 AWR.', stat: 'awr', statVal: 14 },
    'ward': { slot: 'accessory1', label: 'Ward Totem', desc: 'Deployable ward (place within 3 tiles) that grants vision in an area. +14 AWR.', stat: 'awr', statVal: 14 },
    'telescope': { slot: 'accessory1', label: 'Telescope', desc: 'Spot and target enemies in the sky from the ground (range 5). +28 AWR.', stat: 'awr', statVal: 28 },
    'jetpack': { slot: 'accessory1', label: 'Jetpack', desc: 'Fly to the sky without nexus control. Ignores terrain movement cost. +1 MOV.', stat: 'move', statVal: 1 },
    'spelunking_gear': { slot: 'accessory1', label: 'Spelunking Gear', desc: 'Descend underground without nexus control. +14 AWR.', stat: 'awr', statVal: 14 },
    // ── Combat & utility accessories (held-item effects, hooked in battle.js/map.js) ──
    'chrono_locket': { slot: 'accessory1', label: 'Chrono Locket', desc: 'A sliver of borrowed time. Regenerates an extra 5% max HP at the end of every round.' },
    'martyrs_talisman': { slot: 'accessory1', label: "Martyr's Talisman", desc: 'Defies the first killing blow each life — survive at 1 HP. Recharges on respawn.' },
    'purity_censer': { slot: 'accessory1', label: 'Censer of Purity', desc: 'Once per round, instantly purges an enemy-inflicted debuff and lashes back at the culprit for 40% of ATK.' },
    'berserkers_brand': { slot: 'accessory1', label: "Berserker's Brand", desc: '+16 ATK, but each life this unit is locked to the first spell it casts until it falls.', stat: 'atk', statVal: 16 },
    'archons_focus': { slot: 'accessory1', label: "Archon's Focus", desc: '+14 M ATK, but each life this unit is locked to the first spell it casts until it falls.', stat: 'int', statVal: 14 },
    'grapnel_gauntlet': { slot: 'accessory1', label: 'Grapnel Gauntlet', desc: 'Built-in grappling hook: grants the Grapple ability — pull an enemy 2 tiles toward you and reel them in for a hit.' },
    'echo_band': { slot: 'accessory1', label: 'Echo Band', desc: 'Basic attacks strike twice — the echo hits for 50% damage.' },
    'hagstone': { slot: 'accessory1', label: 'Hagstone', desc: 'Peer through the veil: at the end of each round, invisible enemies within 4 tiles of the bearer are revealed.' },
    'masons_gauntlets': { slot: 'accessory1', label: "Mason's Gauntlets", desc: 'A master builder’s grip: every AP spent on the Build action places or digs 2 blocks instead of 1.' },
    'dowsing_rod': { slot: 'accessory1', label: 'Dowsing Rod', desc: 'Twitches over buried danger: at the end of each round, enemy traps within 3 tiles of the bearer are revealed to your team.' },
};

const DEFAULT_JOB_EQUIPMENT = {};
const JOB_ALLOWED_HANDR = {};
function getDefaultEquipment(cls) { return { accessory1: null, accessory2: null }; }

const TYPE_CHART = {
    divine: {
        strongVs: ['unholy'],
        weakVs: ['alien'],
        resists: ['unholy']
    },
    unholy: {
        strongVs: ['anomaly'],
        weakVs: ['divine'],
        resists: ['anomaly']
    },
    anomaly: {
        strongVs: ['tech'],
        weakVs: ['unholy'],
        resists: ['tech']
    },
    tech: {
        strongVs: ['human'],
        weakVs: ['anomaly'],
        resists: ['human']
    },
    human: {
        strongVs: ['alien'],
        weakVs: ['tech'],
        resists: ['alien']
    },
    alien: {
        strongVs: ['divine'],
        weakVs: ['human'],
        resists: ['divine']
    }
};

const STAB_MULTIPLIER = 1.25;

/* ═══ ELEMENTAL AFFINITIES (2026-09-01 — see ELEMENTAL_TYPES_PLAN.md) ═══
   A SECOND, spell-side layer under the type chart above — never a
   replacement for it. Spells carry an optional `element:` tag (doc block
   above SPELL_LIBRARY); the six COMBAT_ELEMENTS below also consult
   RACE_ELEMENT_AFFINITY when they strike a unit:
     weak ×1.5 · resist ×0.5 · immune ×0 (statuses bounce too) ·
     absorb → the damage HEALS the target (Thermal Regen, generalized).
   Everything else — the other nine tags AND untagged spells — is
   elementally NEUTRAL and skips this layer entirely. The type-chart
   matchup + STAB above ALWAYS apply regardless of element; both layers
   multiply inside the capped offensive product (battle.js).
   Design rules (keep these when adding rows):
   - The table is SPARSE: most races carry 0–2 rows, neutral is the
     default and must stay the common case. Max 2 weaknesses per race;
     immune/absorb are signature-only.
   - Basic attacks are elementless — always neutral.
   - 'arcane' is deliberately never a combat element (raw magic nothing
     resists or drinks) — the escape valve vs resist stacking.
   - 'metal' is a weapon tag, never promote it (it would be stealth
     physical-resist on top of DEF and gut the gun/blade classes).
   - Mechanical races stay lightning-NEUTRAL on purpose: the dry-tech
     Overclock / soaked short-circuit combo (calcElementComboMult) is
     already their lightning story — water is their weakness instead. */
const SPELL_ELEMENTS = ['fire', 'ice', 'lightning', 'water', 'earth', 'wind',
    'poison', 'nature', 'shadow', 'light', 'psychic', 'sonic', 'arcane',
    'blood', 'metal'];
const COMBAT_ELEMENTS = ['fire', 'ice', 'lightning', 'water', 'poison', 'earth'];
const ELEMENT_AFFINITY_TIERS = ['weak', 'resist', 'immune', 'absorb'];
const ELEMENT_AFFINITY_MULT = { weak: 1.5, resist: 0.5, immune: 0 };
const ELEMENT_ICONS = {
    fire: '🔥', ice: '❄️', lightning: '⚡', water: '💧', poison: '☠️',
    earth: '⛰️', wind: '🌪️', nature: '🌿', shadow: '🌑', light: '✨',
    psychic: '🌀', sonic: '🔊', arcane: '🔮', blood: '🩸', metal: '⚙️'
};

// Statuses that ARE an element: the target's affinity for that element
// governs every application, whatever the source (immune/absorb bounces
// the status, resist halves its stick chance — getStatusApplyChance).
const ELEMENTAL_STATUS = { burn: 'fire', frozen: 'ice', poison: 'poison' };
// Statuses an element merely USES: coupled only when the applying hit
// itself carried that element (lightning's paralysis — a psychic stun is
// not electricity and ignores lightning affinity). `wet` stays a marker
// with no resist roll by design (see its STATUS_DEFS note).
const ELEMENT_RIDER_STATUS = { stun: 'lightning' };
function statusAffinityElement(statusId, hitElement) {
    if (ELEMENTAL_STATUS[statusId]) return ELEMENTAL_STATUS[statusId];
    if (ELEMENT_RIDER_STATUS[statusId] && hitElement === ELEMENT_RIDER_STATUS[statusId]) return hitElement;
    return null;
}

const RACE_ELEMENT_AFFINITY = {
    // ── polar ──
    'yeti':              { ice: 'resist', fire: 'weak' },
    'ice queen':         { ice: 'immune', fire: 'weak' },
    'santa clause':      { ice: 'resist' },
    'loch ness monster': { ice: 'resist', water: 'resist', lightning: 'weak' },
    // ── deep sea ── (stacks with soaked-shock on purpose: storm bait)
    'siren':             { water: 'resist', lightning: 'weak' },
    'mermaid':           { water: 'resist', lightning: 'weak' },
    'atlantean':         { water: 'resist', lightning: 'weak' },
    'kraken':            { water: 'resist', lightning: 'weak' },
    // ── infernal ──
    'demon':             { fire: 'resist', poison: 'resist', ice: 'weak' },
    'demon prince':      { fire: 'resist', ice: 'weak' },
    'demon princess':    { fire: 'resist', ice: 'weak' },
    'halfdemon':         { fire: 'resist' },
    'fallen angel':      { fire: 'resist', ice: 'weak' },
    'overlord':          { fire: 'resist', ice: 'weak' },
    'goatman':           { fire: 'resist' },
    // ── undead & bloodless ──
    'skeleton':          { poison: 'immune', fire: 'weak' },
    'zombie':            { poison: 'resist', fire: 'weak' },
    'ghost':             { poison: 'immune' },
    'vampire':           { fire: 'weak' },
    'necromancer':       { poison: 'resist' },
    'ghoul':             { poison: 'resist' },
    'gargoyle':          { poison: 'immune', earth: 'resist' },
    // ── mechanical ── (lightning-neutral: the Overclock combo is their story)
    'robot':             { poison: 'immune', water: 'weak' },
    'android':           { poison: 'immune', water: 'weak' },
    'droid':             { poison: 'immune', water: 'weak' },
    'ai':                { poison: 'immune', water: 'weak' },
    'honda civic':       { poison: 'immune', water: 'weak' },
    'mech':              { poison: 'immune', water: 'weak' },
    'cyborg':            { poison: 'resist' },
    'super sentai':      { poison: 'resist' },
    // ── stone & earth ──
    'golem':             { poison: 'immune', earth: 'resist', water: 'weak' },
    'giant':             { earth: 'resist' },
    'cyclops':           { earth: 'resist' },
    // ── beasts & wilds ──
    'dragon':            { fire: 'resist', ice: 'weak' },
    'dinosaur':          { ice: 'weak' },
    'kaiju':             { fire: 'absorb' },   // Thermal Regen, generalized
    'king kong':         { earth: 'resist' },
    'bigfoot':           { earth: 'resist' },
    // everyone else: elementally neutral (deliberately no row)
};

function getRaceElementAffinity(race, element) {
    const t = race ? RACE_ELEMENT_AFFINITY[race] : null;
    return (t && t[element]) || null;
}
/* Live per-hit read (same pattern as unitPassiveValue): nothing is stamped
   on the unit instance, so serialization/state-sync is untouched and a
   data.js retune applies everywhere at once. Returns 'weak'|'resist'|
   'immune'|'absorb'|null. */
function unitElementAffinity(unit, element) {
    if (!unit || !element) return null;
    return getRaceElementAffinity(unit.race, element);
}

const FACTION_BONUSES = {
    space: {
        label: 'Space Alignment',
        armorBonus: 8
    },
    time: {
        label: 'Time Alignment',
        healBonus: 32
    },
    chaos: {
        label: 'Chaos Alignment',
        atkBonus: 12
    }
};

/* ──────────────────────────────────────────────────────────────────────────
 * EW_TERRAIN_COLORS — simplified, semi-transparent overhead colors for EVERY
 * terrain type in the editor (ME_TERRAIN_IDS in map.js). This is the single
 * source of truth for the flat "overhead map" look used by:
 *   • the match-select map preview (match-select.js / map.js)
 *   • the in-battle minimap (three-renderer.js)
 * Colors are rgba over a dark panel so they read like the match-select grid.
 * Add a new terrain's color here once and every overhead view picks it up.
 * ────────────────────────────────────────────────────────────────────────── */
window.EW_TERRAIN_COLORS = window.EW_TERRAIN_COLORS || {
    blank:'transparent', void:'transparent', chasm:'rgba(18,18,26,0.66)',
    // ── Ground / grass ──
    grass:'rgba(80,140,60,0.45)', grass_2:'rgba(90,150,70,0.42)', grass_3:'rgba(70,135,55,0.45)',
    grass_4:'rgba(100,160,75,0.42)', grass_rocky:'rgba(100,130,70,0.4)', purple_grass:'rgba(120,60,140,0.42)',
    wasteland:'rgba(140,120,80,0.4)',
    // ── Dirt / road ──
    dirt:'rgba(130,100,60,0.4)', dirt_2:'rgba(124,95,58,0.4)', dirt_3:'rgba(118,90,55,0.4)',
    dirt_4:'rgba(112,86,52,0.4)', road:'rgba(150,140,120,0.4)', desert:'rgba(190,168,90,0.42)',
    // ── Water ──
    water:'rgba(50,100,200,0.5)', deep_water:'rgba(30,60,160,0.6)', bridge:'rgba(140,110,70,0.45)',
    ice:'rgba(160,210,240,0.45)', well:'rgba(70,130,180,0.45)', healing_spring:'rgba(100,220,180,0.45)',
    // ── Trees / foliage ──
    tree:'rgba(45,105,45,0.5)', tree_top:'rgba(55,120,55,0.5)', forest:'rgba(40,100,40,0.5)',
    forest_2:'rgba(50,110,50,0.46)', dark_woods:'rgba(30,60,30,0.55)', leaves:'rgba(62,122,52,0.46)',
    leaves_2:'rgba(70,130,58,0.46)', leaves_3:'rgba(54,112,46,0.46)', leaves_4:'rgba(80,140,64,0.46)',
    leaves_5:'rgba(48,104,42,0.46)', mushroom:'rgba(160,80,120,0.42)',
    // ── Rock / mountain ──
    mountain:'rgba(120,110,100,0.5)', mountain_2:'rgba(110,100,90,0.46)', mountain_top:'rgba(155,150,144,0.5)',
    cliff:'rgba(100,92,84,0.5)', rocks_1:'rgba(110,105,100,0.42)', rocks_2:'rgba(105,100,95,0.42)',
    rocks_3:'rgba(100,95,90,0.42)', rocks_4:'rgba(95,90,85,0.42)', rocks_5:'rgba(90,85,80,0.42)',
    rock_wall_1:'rgba(90,85,80,0.52)', rock_wall_2:'rgba(85,80,75,0.52)',
    rubble_1:'rgba(120,110,95,0.42)', rubble_2:'rgba(115,105,90,0.42)', rubble_3:'rgba(110,100,86,0.42)',
    rubble_4:'rgba(105,96,82,0.42)', ruins:'rgba(140,130,110,0.42)',
    // ── Volcanic ──
    lava:'rgba(220,80,20,0.58)', scorched:'rgba(62,52,42,0.5)', obsidian:'rgba(40,35,50,0.55)',
    /* poison bogs read as PURPLE WATER, ooze/oil as BLACK WATER (2026-07-14 —
       matches the tinted-water fluid rendering in three-renderer.js) */
    crystal:'rgba(160,120,220,0.46)', poison:'rgba(150,70,205,0.52)', poison_bog:'rgba(130,58,190,0.54)',
    purple_bog:'rgba(112,50,175,0.54)', swamp:'rgba(30,28,38,0.64)', oil:'rgba(22,22,28,0.64)',
    // ── Cave ──
    cave_floor:'rgba(80,70,60,0.46)', cave_wall:'rgba(60,50,45,0.56)', cave_entrance:'rgba(70,60,50,0.5)',
    // ── Built / urban ──
    bricks_1:'rgba(150,100,70,0.46)', bricks_2:'rgba(140,90,65,0.46)', castle_wall:'rgba(130,95,75,0.55)', wood_planks:'rgba(160,120,70,0.45)',
    wood:'rgba(140,100,60,0.42)', urban_wall:'rgba(100,95,100,0.5)', urban_street:'rgba(130,125,120,0.42)',
    marble:'rgba(226,222,214,0.46)', marble_2:'rgba(210,206,198,0.46)', marble_light:'rgba(236,234,228,0.46)', cobblestone:'rgba(120,116,110,0.46)',
    cobblestone_2:'rgba(112,108,102,0.46)', checkerboard:'rgba(180,180,186,0.42)', wallpaper:'rgba(172,150,172,0.42)',
    carpet:'rgba(150,60,60,0.46)', carpet_2:'rgba(60,90,150,0.46)', carpet_3:'rgba(60,140,90,0.46)',
    carpet_4:'rgba(140,120,60,0.46)', drywall:'rgba(200,195,185,0.42)', drywall_2:'rgba(195,190,180,0.42)',
    drywall_3:'rgba(190,185,175,0.42)', drywall_4:'rgba(185,180,170,0.42)',
    // ── Metal / gold ──
    gold:'rgba(222,186,72,0.52)', gold_2:'rgba(212,176,62,0.52)', gold_3:'rgba(202,166,56,0.52)',
    metal:'rgba(130,135,140,0.46)', metal_2:'rgba(120,125,132,0.46)', metal_3:'rgba(120,125,130,0.46)',
    aluminium:'rgba(182,186,190,0.46)',
    // ── Lunar ──
    moon:'rgba(150,150,160,0.46)', moon_2:'rgba(140,140,150,0.46)', moon_3:'rgba(130,130,142,0.46)',
    // ── Dungeon / flesh ──
    dungeon:'rgba(85,80,75,0.5)', dungeon_2:'rgba(80,75,70,0.5)', dungeon_3:'rgba(75,70,68,0.5)',
    dungeon_4:'rgba(70,66,64,0.5)', flesh:'rgba(170,70,80,0.46)', flesh_2:'rgba(160,65,75,0.46)',
    flesh_3:'rgba(150,60,70,0.46)', plague_flesh:'rgba(150,140,55,0.5)',
    // ── Sky ──
    cloud:'rgba(200,210,230,0.35)', cloud_2:'rgba(190,200,222,0.35)', cloud_thick:'rgba(210,218,235,0.46)',
    cloud_gap:'rgba(170,185,210,0.22)', sky_open:'rgba(120,170,230,0.26)', sky_ruin:'rgba(150,160,190,0.42)',
    storm:'rgba(90,100,130,0.46)', beanstalk:'rgba(70,150,60,0.5)', beanstalk_top:'rgba(90,170,70,0.5)',
    // ── Special / structures ──
    barrier:'rgba(150,150,205,0.42)', barrier_passage:'rgba(140,140,200,0.22)', fog_wall:'rgba(120,120,130,0.42)',
    descent_point:'rgba(122,100,160,0.46)', tower_base:'rgba(150,140,130,0.5)', home_base:'rgba(162,150,135,0.5)',
    sanctuary:'rgba(204,184,124,0.46)', sanctuary_church:'rgba(212,196,150,0.46)', sanctuary_shop:'rgba(200,170,110,0.46)',
    // ── Nexus (objective) tiles ──
    nexus:'rgba(255,215,90,0.55)', nexus_cave:'rgba(230,180,80,0.55)', nexus_sky:'rgba(190,225,255,0.55)',
};

const TERRAIN_RULES = {
    grass: {
        label: 'Grassland',
        short: 'GRS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    water: {
        label: 'Shallow Water',
        short: 'SHW',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    deep_water: {
        label: 'Deep Water',
        short: 'DPW',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            if (unitIsDeepWaterAdapted(unit)) {
                if (unit._drowningStacks) {
                    unit._drowningStacks = 0;
                    clearStatus(unit, 'drowning');
                }
                return null;
            }

            if (canFly(unit)) return null;

            unit._drowningStacks = (unit._drowningStacks || 0) + 1;
            const status = ensureUnitStatus(unit);
            status.drowning = 3;
            return null;
        }
    },
    bridge: {
        label: 'Bridge',
        short: 'BRG',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    mountain: {
        label: 'Mountain',
        short: 'MTN',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    desert: {
        label: 'Desert',
        short: 'DST',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.7,
        endTurn(unit) {
            return null;
        },

    },

    tree: {
        label: 'Forest',
        short: 'TRE',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    dirt: {
        label: 'Dirt Path',
        short: 'DRT',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    ice: {
        label: 'Ice',
        short: 'ICE',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        slide: true,
        endTurn(unit) {
            return null;
        }
    },
    lava: {
        label: 'Lava',
        short: 'LVA',
        passable: true,
        moveCost: 3,
        blocksRanged: false,
        healMultiplier: 0,
        endTurn(unit) {
            if (unitIsLavaAdapted(unit)) {
                if (unit._lavaBurnStacks) {
                    unit._lavaBurnStacks = 0;
                    clearStatus(unit, 'burn');
                }
                return null;
            }

            // 🔥 Thermal Regen (PASSIVE_DEFS healedByElement:'fire'): lava is
            // a hot spring — a kaiju wading in HEALS instead of stacking burn.
            // (2026-07-23: lava is fire-element now, matching the fire→heal
            // rule in the damage pipeline.)
            if (typeof unitPassiveValue === 'function' && unitPassiveValue(unit, 'healedByElement') === 'fire') {
                unit._lavaBurnStacks = 0;
                if (unit.hp >= unit.maxHp) return null;
                return { type: 'heal', amount: 40, text: `🔥 ${unitDisplayName(unit)}'s Thermal Regen basks in the lava for` };
            }

            if (canFly(unit)) return null;

            // Lava applies the ONE burn status (there is no separate "lava
            // burn"); standing in it stacks up _lavaBurnStacks, which escalates
            // the burn tick damage (see burn.onRoundEnd).
            unit._lavaBurnStacks = (unit._lavaBurnStacks || 0) + 1;
            const status = ensureUnitStatus(unit);
            status.burn = Math.max(status.burn || 0, 3);
            return null;
        }
    },
    scorched: {
        label: 'Scorched',
        short: 'SCH',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    poison: {
        label: 'Poison Bog',
        short: 'PSN',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.5,
        endTurn(unit) {
            if (unitIsPoisonTerrainImmune(unit)) return null;
            return { type: 'damage', amount: 12, text: `${unitDisplayName(unit)} is sickened by poison terrain for` };
        }
    },
    well: {
        label: 'Well',
        short: 'WEL',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    beanstalk: {
        label: 'Beanstalk',
        short: 'BST',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    cave_entrance: {
        label: 'Cave Entrance',
        short: 'CVE',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    tower_base: {
        label: 'Tower',
        short: 'TWR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isTower: true,
        endTurn(unit) {
            return null;
        }
    },
    home_base: {
        label: 'Home Base',
        short: 'HB',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1.25,
        endTurn(unit) {
            return null;
        }
    },

    cave_floor: {
        label: 'Cave Floor',
        short: 'CVF',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    cave_wall: {
        label: 'Cave Wall',
        short: 'CVW',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    barrier: {
        label: 'Barrier',
        short: 'BAR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isBarrier: true,
        endTurn(unit) {
            return null;
        }
    },
    barrier_passage: {
        label: 'Passage',
        short: 'PAS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isBarrierPassage: true,
        endTurn(unit) {
            return null;
        }
    },
    fog_wall: {
        label: 'Darkness',
        short: 'FOG',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        reducesVision: 2,
        endTurn(unit) {
            return null;
        }
    },

    cloud: {
        label: 'Cloud',
        short: 'CLD',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    cloud_thick: {
        label: 'Storm Cloud',
        short: 'STM',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        reducesVision: 1,
        endTurn(unit) {
            return null;
        }
    },
    mountain_top: {
        label: 'Mountain Peak',
        short: 'PKT',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        rangeBonus: 1,
        endTurn(unit) {
            return null;
        }
    },
    tree_top: {
        label: 'Treetop',
        short: 'TTP',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    sky_open: {
        label: 'Open Sky',
        short: 'SKY',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        flyingOnly: true,
        endTurn(unit) {
            return null;
        }
    },
    storm: {
        label: 'Storm Zone',
        short: 'ZAP',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.5,
        endTurn(unit) {
            return null;
        }
    },
    beanstalk_top: {
        label: 'Beanstalk Top',
        short: 'BSP',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    descent_point: {
        label: 'Descent',
        short: 'DSC',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },

    nexus: {
        label: 'Ley Line Nexus',
        short: 'NEX',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'earth',
        endTurn(unit) { return null; }
    },
    nexus_cave: {
        label: 'Abyssal Wellspring',
        short: 'NXC',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'below',
        endTurn(unit) { return null; }
    },
    nexus_sky: {
        label: 'Celestial Observatory',
        short: 'NXS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'above',
        endTurn(unit) { return null; }
    },

    sanctuary_church: {
        label: 'Sanctuary Church',
        short: 'CHR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    sanctuary_shop: {
        label: 'Sanctuary Shop',
        short: 'SHP',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    sanctuary: {
        label: 'Sanctuary',
        short: 'SAN',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    blank: {
        label: 'Blank',
        short: '   ',
        passable: false,
        moveCost: 99,
        blocksRanged: false,
        healMultiplier: 0,
        isBlank: true,
        endTurn(unit) { return null; }
    },
    purple_grass: {
        label: 'Purple Grass',
        short: 'PGR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    grass_2: {
        label: 'Tall Grass',
        short: 'GR2',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    wasteland: {
        label: 'Wasteland',
        short: 'WST',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.5,
        endTurn(unit) { return null; }
    },
    forest_2: {
        label: 'Dense Forest',
        short: 'FR2',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    mountain_2: {
        label: 'Mountain Range',
        short: 'MT2',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },

    forest: {
        label: 'Forest',
        short: 'FOR',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    bricks_1: {
        label: 'Brick Floor',
        short: 'BK1',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    bricks_2: {
        label: 'Brick Floor Alt',
        short: 'BK2',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    /* Spell-made castle masonry (knight's Castle Fortress). Mountain rules —
       the wall effect comes from the terrainDeform height raise — but wears
       the brick texture so it reads as built stone, not raw rock. */
    castle_wall: {
        label: 'Castle Wall',
        short: 'CWL',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    wood_planks: {
        label: 'Wood Planks',
        short: 'WPL',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    wood: {
        label: 'Wood Floor',
        short: 'WOD',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rubble_1: {
        label: 'Rubble',
        short: 'RB1',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rubble_2: {
        label: 'Rubble Alt',
        short: 'RB2',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rubble_3: {
        label: 'Dense Rubble',
        short: 'RB3',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rubble_4: {
        label: 'Heavy Rubble',
        short: 'RB4',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    poison_bog: {
        label: 'Poison Bog',
        short: 'PBG',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.5,
        endTurn(unit) {
            if (unitIsPoisonTerrainImmune(unit)) return null;
            return { type: 'damage', amount: 12, text: `${unitDisplayName(unit)} is sickened by the poison bog for` };
        }
    },
    rocks_1: {
        label: 'Rocky Ground',
        short: 'RK1',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rocks_2: {
        label: 'Rocky Ground Alt',
        short: 'RK2',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rocks_3: {
        label: 'Stony Ground',
        short: 'RK3',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rocks_4: {
        label: 'Boulder Field',
        short: 'RK4',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rocks_5: {
        label: 'Craggy Rocks',
        short: 'RK5',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rock_wall_1: {
        label: 'Rock Wall',
        short: 'RW1',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    rock_wall_2: {
        label: 'Rock Wall Alt',
        short: 'RW2',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    dark_woods: {
        label: 'Dark Woods',
        short: 'DKW',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.8,
        reducesVision: 1,
        endTurn(unit) { return null; }
    },
    urban_wall: {
        label: 'Urban Wall',
        short: 'URW',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    urban_street: {
        label: 'Urban Street',
        short: 'UST',
        passable: true,
        moveCost: 0,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    grass_rocky: {
        label: 'Rocky Grass',
        short: 'GRK',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    purple_bog: {
        label: 'Purple Bog',
        short: 'PBO',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.7,
        endTurn(unit) { return null; }
    },
    /* Black liquid family (2026-07-14): 'swamp' is the Black Goo Ooze Trail's
       toxic slick (it previously had NO rule and fell back to grass), 'oil' is
       the paintable oil slick. Both render as black tinted water and DETONATE
       when hit by fire/lightning (see battle.js _reactFireOil). */
    swamp: {
        label: 'Black Ooze',
        short: 'OOZ',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 0.7,
        endTurn(unit) { return null; }
    },
    oil: {
        label: 'Oil Slick',
        short: 'OIL',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },

    void: {
        label: 'Void',
        short: 'VOD',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    cliff: {
        label: 'Cliff Face',
        short: 'CLF',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    chasm: {
        label: 'Rift Chasm',
        short: 'CSM',
        passable: true,
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    cloud_gap: {
        label: 'Open Sky',
        short: 'GAP',
        passable: false,
        moveCost: 99,
        blocksRanged: false,
        healMultiplier: 0,
        isVoid: true,
        endTurn(unit) { return null; }
    },
    sky_ruin: {
        label: 'Celestial Ruins',
        short: 'SRN',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        rangeBonus: 1,
        endTurn(unit) { return null; }
    },
    road: {
        label: 'Road',
        short: 'RD',
        passable: true,
        moveCost: 0,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    ruins: {
        label: 'Ruins',
        short: 'RNS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        defBonus: 2,
        endTurn(unit) { return null; }
    },
    crystal: {
        label: 'Crystal Formation',
        short: 'CRY',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        visionBonus: 1,
        endTurn(unit) {
            if (!unit.maxMp || unit.mp >= unit.maxMp) return null;
            const restore = Math.max(1, Math.floor(unit.maxMp * 0.15));
            return { type: 'mana', amount: restore, text: `${unitDisplayName(unit)} draws power from the crystal formation:` };
        }
    },
    mushroom: {
        label: 'Giant Mushroom',
        short: 'MSH',
        passable: true,
        moveCost: 2,
        blocksRanged: true,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    obsidian: {
        label: 'Obsidian Floor',
        short: 'OBS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    healing_spring: {
        label: 'Healing Spring',
        short: 'SPR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 2.0,
        endTurn(unit) {
            if (unit.hp >= unit.maxHp) return null;
            const heal = Math.max(1, Math.floor(unit.maxHp * 0.15));
            return { type: 'heal', amount: heal, text: `${unitDisplayName(unit)} is soothed by the healing spring for` };
        }
    },

    // ── New terrains (Moon / Backrooms / Heaven map set) ──────────────────
    moon: {
        label: 'Lunar Regolith',
        short: 'MUN',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    carpet: {
        label: 'Damp Carpet',
        short: 'CRP',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    gold: {
        label: 'Gilded Floor',
        short: 'GLD',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    metal: {
        label: 'Metal Grate',
        short: 'MTL',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    leaves: {
        label: 'Leafy Bower',
        short: 'LVS',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    wallpaper: {
        label: 'Yellow Wallpaper',
        short: 'WLP',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },
    cloud_2: {
        label: 'Cloud',
        short: 'CL2',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) { return null; }
    },

    // ── New terrain variants (2026-06 R2 batch) ───────────────────────────
    moon_2:  { label: 'Lunar Regolith II',  short: 'MN2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    moon_3:  { label: 'Lunar Regolith III', short: 'MN3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    carpet_2: { label: 'Carpet II',  short: 'CP2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    carpet_3: { label: 'Carpet III', short: 'CP3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    carpet_4: { label: 'Carpet IV',  short: 'CP4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    gold_2:  { label: 'Gilded Floor II',  short: 'GL2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    gold_3:  { label: 'Gilded Floor III', short: 'GL3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    metal_2: { label: 'Metal Grate II',   short: 'MT2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    grass_3: { label: 'Grass III', short: 'GR3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    grass_4: { label: 'Grass IV',  short: 'GR4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dirt_2:  { label: 'Dirt II',  short: 'DR2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dirt_3:  { label: 'Dirt III', short: 'DR3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dirt_4:  { label: 'Dirt IV',  short: 'DR4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    marble:   { label: 'Marble',    short: 'MRB', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    marble_2: { label: 'Marble II', short: 'MR2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    cobblestone:   { label: 'Cobblestone',    short: 'CBL', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    cobblestone_2: { label: 'Cobblestone II', short: 'CB2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leaves_2: { label: 'Leafy Bower II',  short: 'LV2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leaves_3: { label: 'Leafy Bower III', short: 'LV3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leaves_4: { label: 'Leafy Bower IV',  short: 'LV4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leaves_5: { label: 'Leafy Bower V',   short: 'LV5', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    aluminium:    { label: 'Aluminium',    short: 'ALU', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    checkerboard: { label: 'Checkerboard', short: 'CHK', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dungeon:    { label: 'Dungeon',     short: 'DNG', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dungeon_2:  { label: 'Dungeon II',  short: 'DN2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dungeon_3:  { label: 'Dungeon III', short: 'DN3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dungeon_4:  { label: 'Dungeon IV',  short: 'DN4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    flesh:      { label: 'Flesh',       short: 'FLS', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    flesh_2:    { label: 'Flesh II',    short: 'FL2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    flesh_3:    { label: 'Flesh III',   short: 'FL3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    /* Spell-made pestilent meat (necromancer's Plaguefield). A PERMANENT
       plague mass: ending a turn on it poisons anyone but a necromancer —
       the plague does not bite its master. */
    plague_flesh: {
        label: 'Plague Flesh',
        short: 'PLF',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 0.5,
        endTurn(unit) {
            if (!unit || unit.race === 'necromancer') return null;
            const status = ensureUnitStatus(unit);
            if (!status.poison || status.poison < 2) status.poison = 2;
            return null;
        }
    },
    drywall:    { label: 'Drywall',     short: 'DRY', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_2:  { label: 'Drywall II',  short: 'DY2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_3:  { label: 'Drywall III', short: 'DY3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_4:  { label: 'Drywall IV',  short: 'DY4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    metal_3:    { label: 'Metal Grate III', short: 'MT3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    tilefloor:   { label: 'Tile Floor',    short: 'TIL', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    tilefloor_2: { label: 'Tile Floor II', short: 'TI2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    /* 2026-07-08 — the full R2 terrain-folder batch promoted from texture-only
       keys to placeable editor terrains. All plain passable floors. */
    bricks_3:       { label: 'Bricks III',      short: 'BR3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    marble_light:   { label: 'Pale Marble',     short: 'MBL', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leather:        { label: 'Leather',         short: 'LTH', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    leather_2:      { label: 'Leather II',      short: 'LT2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    enamel_2:       { label: 'Enamel',          short: 'ENM', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    mars:           { label: 'Mars Regolith',   short: 'MRS', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    mars_2:         { label: 'Mars Rock',       short: 'MR2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    fur:            { label: 'Fur',             short: 'FUR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    fur_2:          { label: 'Fur II',          short: 'FR2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    fur_3:          { label: 'Fur III',         short: 'FR3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    skin:           { label: 'Skin',            short: 'SKN', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    rubber:         { label: 'Rubber',          short: 'RBR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    rubber_2:       { label: 'Rubber II',       short: 'RB2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    damask:         { label: 'Damask',          short: 'DMK', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    damask_2:       { label: 'Damask II',       short: 'DM2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    damask_3:       { label: 'Damask III',      short: 'DM3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    damask_4:       { label: 'Damask IV',       short: 'DM4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    floral:         { label: 'Floral',          short: 'FLR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    floral_2:       { label: 'Floral II',       short: 'FL2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    diamond:        { label: 'Diamond Plate',   short: 'DIA', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    brokenglass:    { label: 'Broken Glass',    short: 'GLS', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    gunmetal:       { label: 'Gunmetal',        short: 'GUN', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    gunmetal_2:     { label: 'Gunmetal II',     short: 'GN2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    copper:         { label: 'Copper',          short: 'CPR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    concrete_floor: { label: 'Concrete',        short: 'CNC', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    checkerboard_2: { label: 'Checkerboard II', short: 'CH2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    checkerboard_3: { label: 'Checkerboard III',short: 'CH3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_5:      { label: 'Drywall V',       short: 'DY5', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    dirt_slope:     { label: 'Dirt Slope',      short: 'DSL', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    grass_dark_fantasy: { label: 'Dark Grass',  short: 'DGR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    rocks_dark_fantasy: { label: 'Dark Rocks',  short: 'DRK', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    ice_1:          { label: 'Ice II',          short: 'IC2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    igloo:          { label: 'Igloo Block',     short: 'IGL', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    latticegarden:  { label: 'Garden Lattice',  short: 'LAT', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    noise:          { label: 'Static Noise',    short: 'NSE', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    tigerfur:       { label: 'Tiger Fur',       short: 'TGR', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    tigerfur_2:     { label: 'Tiger Fur II',    short: 'TG2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } }
};

const OBJECT_RULES = {
    /* Cosmetic grass tuft — purely decorative billboard grass blades (rendered
       by _buildGrassTuft3D in three-renderer). Fully passable, no collision,
       no height, no effect on ranged/landing/pathing. */
    grass_tuft: {
        label: 'Grass Tuft',
        short: 'GRS',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    /* Cosmetic rock/boulder — purely decorative 3D boulder (rendered by
       _buildRock3D in three-renderer). Fully passable, no collision, no height,
       no effect on ranged/landing/pathing. Supports a per-placement texture
       variant (entry.rockTex = 'rocks_1'..'rocks_5'), like leaves for trees. */
    rock: {
        label: 'Rock',
        short: 'RCK',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    /* Cosmetic torch — 3D wood-and-rope torch with a live flame + flickering
       point light (rendered by _buildTorch3D in three-renderer). Fully
       passable, no collision, no height. The mount lives in the placed
       entry's generic variant slot (entry.leaf): 'floor' stands on the tile
       top, 'wall' hangs Minecraft-style off the tile side the entry's rot
       points at. */
    torch: {
        label: 'Torch',
        short: 'TCH',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    church: {
        label: 'Church',
        short: 'CHR',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    shop: {
        label: 'Item Shop',
        short: 'SHP',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1.0,
    },
    tree: {
        label: 'Tree',
        short: 'TRE',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    tree_2: {
        label: 'Tree',
        short: 'TR2',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    tree_3: {
        label: 'Tree',
        short: 'TR3',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    tree_4: {
        label: 'Tree',
        short: 'TR4',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    tree_5: {
        label: 'Tree',
        short: 'TR5',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    tree_6: {
        label: 'Tree',
        short: 'TR6',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    ruins: {
        label: 'Ruins',
        short: 'RNS',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        defBonus: 2,
    },
    nexus: {
        label: 'Ley Line Nexus',
        short: 'NEX',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'earth',
    },
    nexus_cave: {
        label: 'Abyssal Wellspring',
        short: 'NXC',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'below',
    },
    nexus_sky: {
        label: 'Celestial Observatory',
        short: 'NXS',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        isNexus: true,
        nexusSection: 'above',
    },
    mountain_top: {
        label: 'Mountain Peak',
        short: 'PKT',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 1,
        healMultiplier: 1,
        rangeBonus: 1,
    },
    beanstalk: {
        label: 'Beanstalk',
        short: 'BNS',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        moveCostAdd: 1,
        healMultiplier: 1,
    },
    well: {
        label: 'Well',
        short: 'WEL',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    cave_entrance: {
        label: 'Cave Entrance',
        short: 'CAV',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    barrier_1: {
        label: 'Barrier 1',
        short: 'BR1',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        edgeBlock: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    barrier_2: {
        label: 'Barrier 2',
        short: 'BR2',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        edgeBlock: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    barrier_3: {
        label: 'Barrier 3',
        short: 'BR3',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        edgeBlock: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    barrier_4: {
        label: 'Barrier 4',
        short: 'BR4',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        edgeBlock: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    barrier_5: {
        label: 'Barrier 5',
        short: 'BR5',
        passable: true,
        blocksLanding: false,
        blocksRanged: true,
        edgeBlock: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    column_1: {
        label: 'Column 1',
        short: 'CL1',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    column_2: {
        label: 'Column 2',
        short: 'CL2',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    column_3: {
        label: 'Column 3',
        short: 'CL3',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    column_4: {
        label: 'Column 4',
        short: 'CL4',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_1: {
        label: 'Building 1',
        short: 'BD1',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_2: {
        label: 'Building 2',
        short: 'BD2',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_3: {
        label: 'Building 3',
        short: 'BD3',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_4: {
        label: 'Building 4',
        short: 'BD4',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_5: {
        label: 'Building 5',
        short: 'BD5',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_6: {
        label: 'Building 6',
        short: 'BD6',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_7: {
        label: 'Building 7',
        short: 'BD7',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_8: {
        label: 'Building 8',
        short: 'BD8',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_9: {
        label: 'Building 9',
        short: 'BD9',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    building_10: {
        label: 'Building 10',
        short: 'B10',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    church_1: {
        label: 'Church 1',
        short: 'CH1',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    church_2: {
        label: 'Church 2',
        short: 'CH2',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    tower_cube: {
        label: 'Tower (Cube)',
        short: 'CUB',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 0,
    },
    building_11: {
        label: 'Building 11',
        short: 'B11',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    ancient_building: {
        label: 'Ancient Building',
        short: 'ANC',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    abandoned_building_1: {
        label: 'Abandoned Building 1',
        short: 'AB1',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    abandoned_building_2: {
        label: 'Abandoned Building 2',
        short: 'AB2',
        passable: true,
        roofWalkable: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    stairs: {
        label: 'Stairs',
        short: 'STR',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    stairs_2: {
        label: 'Stairs (Wide)',
        short: 'ST2',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        overridesGround: true,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    pathway_1: {
        label: 'Pathway 1',
        short: 'PW1',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    pathway_2: {
        label: 'Pathway 2',
        short: 'PW2',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    lamp_post: {
        label: 'Lamp Post',
        short: 'LMP',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    lamp_post_2: {
        label: 'Lamp Post 2',
        short: 'LP2',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
    },
    /* Cosmetic 3D traffic light — a galvanized-grey pole + mast arm carrying
       a yellow-housed signal head whose red / yellow / green lamps cycle
       BETWEEN ROUNDS (green → yellow → red, keyed off state.round; see
       _buildTrafficLight3D / _updateTrafficLights in three-renderer.js).
       Purely cosmetic: fully passable, no collision, no height. */
    traffic_light: {
        label: 'Traffic Light',
        short: 'TFL',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    /* 2026-07-08 — spell-prop 3D models as placeable map decorations (the same
       builders the spells use in three-renderer.js). Graves are walk-over
       cosmetics; the wall/pillar/totem/beacon are solid obstacles. */
    gravestone: {
        label: 'Gravestone',
        short: 'GRV',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    bone_pile: {
        label: 'Bone Pile',
        short: 'BNP',
        passable: true,
        blocksLanding: false,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 0,
        cosmetic: true,
    },
    bone_wall: {
        label: 'Bone Wall',
        short: 'BNW',
        passable: false,
        blocksLanding: true,
        blocksRanged: true,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    atlantis_pillar: {
        label: 'Atlantis Pillar',
        short: 'ATP',
        passable: false,
        blocksLanding: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    totem_pole: {
        label: 'Totem Pole',
        short: 'TTM',
        passable: false,
        blocksLanding: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
    federation_beacon: {
        label: 'Beacon Pylon',
        short: 'BCN',
        passable: false,
        blocksLanding: true,
        blocksRanged: false,
        moveCostAdd: 0,
        healMultiplier: 1,
        gameHeight: 2,
    },
};
const JOB_ARCHETYPES = {
    'Gunslinger': {
        race: 'martian',
        faction: 'space',
        types: ['alien'],
        gender: 'other',
        zodiac: 'aries',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Warrior': {
        race: 'knight',
        faction: 'time',
        types: ['human'],
        gender: 'other',
        zodiac: 'aries',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Tank': {
        race: 'giant',
        faction: 'time',
        types: ['human'],
        gender: 'other',
        zodiac: 'taurus',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Black Mage': {
        race: 'seraphim',
        faction: 'time',
        types: ['divine'],
        gender: 'other',
        zodiac: 'scorpio',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'White Mage': {
        race: 'angel',
        faction: 'time',
        types: ['divine'],
        gender: 'other',
        zodiac: 'pisces',
        sleepPreference: 'daywalker',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Agent': {
        race: 'android',
        faction: 'space',
        types: ['tech'],
        gender: 'other',
        zodiac: 'gemini',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Psychic': {
        race: 'grey',
        faction: 'chaos',
        types: ['alien'],
        gender: 'other',
        zodiac: 'aquarius',
        sleepPreference: 'nocturnal',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Harvester': {
        race: 'bigfoot',
        faction: 'space',
        types: ['anomaly'],
        gender: 'other',
        zodiac: 'virgo',
        sleepPreference: 'daywalker',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Engineer': {
        race: 'ai',
        faction: 'space',
        types: ['tech'],
        gender: 'other',
        zodiac: 'capricorn',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Harbinger': {
        race: 'orb of light',
        faction: 'time',
        types: ['divine'],
        gender: 'other',
        zodiac: 'libra',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Freelancer': {
        race: 'homosapien',
        faction: 'space',
        types: ['human'],
        gender: 'other',
        zodiac: 'sagittarius',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Raider': {
        race: 'werewolf',
        faction: 'chaos',
        types: ['human', 'unholy'],
        gender: 'other',
        zodiac: 'scorpio',
        sleepPreference: 'nocturnal',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Sniper': {
        race: 'annunaki',
        faction: 'space',
        types: ['human', 'alien'],
        gender: 'other',
        zodiac: 'capricorn',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Swordmaster': {
        race: 'swordfighter',
        faction: 'time',
        types: ['human'],
        gender: 'other',
        zodiac: 'leo',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    }
};

const RACE_PROFILES = {
    homosapien: {
        label: 'Homosapien',
        faction: 'space',
        types: ['human']
    },
    pirate: {
        label: 'Pirate',
        faction: 'chaos',
        types: ['human']
    },
    swordfighter: {
        label: 'Swordfighter',
        faction: 'time',
        types: ['human']
    },
    giant: {
        label: 'Giant',
        faction: 'time',
        types: ['human']
    },
    fairy: {
        label: 'Fairy',
        faction: 'chaos',
        types: ['anomaly']
    },
    martian: {
        label: 'Martian',
        faction: 'space',
        types: ['alien']
    },
    nordic: {
        label: 'Nordic',
        faction: 'time',
        types: ['alien']
    },
    grey: {
        label: 'Grey',
        faction: 'chaos',
        types: ['alien']
    },
    bigfoot: {
        label: 'Bigfoot',
        faction: 'space',
        types: ['anomaly']
    },
    'shadow entity': {
        label: 'Shadow Entity',
        faction: 'time',
        types: ['anomaly']
    },
    reptilian: {
        label: 'Reptilian',
        faction: 'chaos',
        types: ['anomaly']
    },
    ai: {
        label: 'AI',
        faction: 'space',
        types: ['tech']
    },
    robot: {
        label: 'Robot',
        faction: 'space',
        types: ['tech']
    },
    android: {
        label: 'Android',
        faction: 'space',
        types: ['tech']
    },
    angel: {
        label: 'Angel',
        faction: 'time',
        types: ['divine']
    },
    seraphim: {
        label: 'Seraphim',
        faction: 'time',
        types: ['divine']
    },
    'orb of light': {
        label: 'Orb of Light',
        faction: 'time',
        types: ['divine']
    },
    demon: {
        label: 'Demon',
        faction: 'chaos',
        types: ['unholy']
    },
    succubus: {
        label: 'Succubus',
        faction: 'chaos',
        types: ['unholy']
    },
    skeleton: {
        label: 'Skeleton',
        faction: 'chaos',
        types: ['unholy']
    },
    mech: {
        label: 'Mech',
        faction: 'space',
        types: ['human', 'tech']
    },
    ghost: {
        label: 'Ghost',
        faction: 'time',
        types: ['human', 'anomaly']
    },
    zombie: {
        label: 'Zombie',
        faction: 'chaos',
        types: ['human', 'unholy']
    },
    annunaki: {
        label: 'Annunaki',
        faction: 'space',
        types: ['human', 'alien']
    },
    skinwalker: {
        label: 'Skinwalker',
        faction: 'chaos',
        types: ['human', 'anomaly']
    },
    werewolf: {
        label: 'Werewolf',
        faction: 'chaos',
        types: ['human', 'unholy']
    },
    gargoyle: {
        label: 'Gargoyle',
        faction: 'space',
        types: ['unholy']
    },
    djinn: {
        label: 'Djinn',
        faction: 'time',
        types: ['divine']
    },
    anubis: {
        label: 'Anubis',
        faction: 'time',
        types: ['divine', 'unholy']
    },
    catgirl: {
        label: 'Catgirl',
        faction: 'chaos',
        types: ['human', 'anomaly']
    },
    mantid: {
        label: 'Mantid',
        faction: 'time',
        types: ['alien']
    },
    antperson: {
        label: 'Antperson',
        faction: 'space',
        types: ['alien', 'anomaly']
    },
    mothman: {
        label: 'Mothman',
        faction: 'time',
        types: ['anomaly']
    },
    siren: {
        label: 'Siren',
        faction: 'space',
        types: ['unholy']
    },
    scarecrow: {
        label: 'Scarecrow',
        faction: 'chaos',
        types: ['unholy']
    },
    glitch: {
        label: 'Glitch',
        faction: 'space',
        types: ['tech', 'anomaly']
    },
    'machine elves': {
        label: 'Machine Elves',
        faction: 'chaos',
        types: ['alien', 'tech']
    },
    cyclops: {
        label: 'Cyclops',
        faction: 'time',
        types: ['anomaly']
    },
    cyborg: {
        label: 'Cyborg',
        faction: 'space',
        types: ['tech']
    },
    'demon prince': {
        label: 'Demon Prince',
        faction: 'chaos',
        types: ['unholy']
    },
    'demon princess': {
        label: 'Demon Princess',
        faction: 'chaos',
        types: ['unholy']
    },
    dreameater: {
        label: 'Dreameater',
        faction: 'time',
        types: ['alien']
    },
    'fallen angel': {
        label: 'Fallen Angel',
        faction: 'chaos',
        types: ['divine', 'unholy']
    },
    goatman: {
        label: 'Goatman',
        faction: 'chaos',
        types: ['anomaly', 'unholy']
    },
    halfdemon: {
        label: 'Halfdemon',
        faction: 'chaos',
        types: ['unholy', 'human']
    },
    mermaid: {
        label: 'Mermaid',
        faction: 'time',
        types: ['anomaly']
    },
    nephilim: {
        label: 'Nephilim',
        faction: 'time',
        types: ['divine', 'human']
    },
    vampire: {
        label: 'Vampire',
        faction: 'chaos',
        types: ['unholy']
    },
    voidweaver: {
        label: 'Voidweaver',
        faction: 'space',
        types: ['alien']
    },
    'cosmic wraith': {
        label: 'Cosmic Wraith',
        faction: 'space',
        types: ['alien', 'tech']
    },
    superhero: {
        label: 'Superhero',
        faction: 'space',
        types: ['human', 'alien']
    },
    'general': {
        label: 'General',
        faction: 'time',
        types: ['human']
    },
    'droid': {
        label: 'Droid',
        faction: 'space',
        types: ['tech']
    },
    'antihero': {
        label: 'Antihero',
        faction: 'space',
        types: ['human', 'alien']
    },
    'conspiracy theorist': {
        label: 'Conspiracy Theorist',
        faction: 'time',
        types: ['human']
    },
    'overlord': {
        label: 'Overlord',
        faction: 'chaos',
        types: ['unholy']
    },
    'chosen one': {
        label: 'Chosen One',
        faction: 'time',
        types: ['unholy', 'divine']
    },
    'politician': {
        label: 'Politician',
        faction: 'time',
        types: ['human']
    },
    'atlantean': {
        label: 'Atlantean',
        faction: 'time',
        types: ['human', 'anomaly']
    },
    'dinosaur': {
        label: 'Dinosaur',
        faction: 'space',
        types: ['anomaly']
    },
    'dragon': {
        label: 'Dragon',
        faction: 'chaos',
        types: ['unholy', 'anomaly']
    },
    'ghoul': {
        label: 'Ghoul',
        faction: 'chaos',
        types: ['unholy']
    },
    'gnome': {
        label: 'Gnome',
        faction: 'time',
        types: ['anomaly']
    },
    'kaiju': {
        label: 'Kaiju',
        faction: 'chaos',
        types: ['unholy', 'tech']
    },
    'kraken': {
        label: 'Kraken',
        faction: 'space',
        types: ['anomaly']
    },
    'loch ness monster': {
        label: 'Loch Ness Monster',
        faction: 'space',
        types: ['anomaly']
    },
    'yeti': {
        label: 'Yeti',
        faction: 'time',
        types: ['anomaly']
    },

    'knight': {
        label: 'Knight',
        faction: 'time',
        types: ['human', 'divine']
    },
    'shaman': {
        label: 'Shaman',
        faction: 'time',
        types: ['human', 'anomaly']
    },
    'mad scientist': {
        label: 'Mad Scientist',
        faction: 'space',
        types: ['human', 'tech']
    },
    'cowboy': {
        label: 'Cowboy',
        labelMale: 'Cowboy',
        labelFemale: 'Cowgirl',
        faction: 'space',
        types: ['human']
    },
    'men in black': {
        label: 'Men in Black',
        labelMale: 'Man in Black',
        // A woman can't very well be a Man in Black — she's an Intel Spy.
        // (Portrait art file is still named "glowie" on R2 — path only.)
        labelFemale: 'Intel Spy',
        faction: 'space',
        types: ['human', 'tech']
    },
    'telepath': {
        label: 'Telepath',
        faction: 'chaos',
        types: ['human', 'anomaly']
    },
    'marksman': {
        label: 'Marksman',
        faction: 'space',
        types: ['human', 'tech']
    },
    'priest': {
        label: 'Priest',
        labelMale: 'Priest',
        labelFemale: 'Nun',
        faction: 'time',
        types: ['human', 'divine']
    },
    'wizard': {
        label: 'Wizard',
        labelMale: 'Wizard',
        labelFemale: 'Witch',
        faction: 'chaos',
        types: ['human', 'unholy']
    },
    'fortune teller': {
        label: 'Fortune Teller',
        faction: 'time',
        types: ['human', 'anomaly']
    },

    'barbarella': {
        label: 'Barbarella',
        faction: 'space',
        types: ['human', 'anomaly']
    },
    'black goo': {
        label: 'Black Goo',
        faction: 'chaos',
        types: ['anomaly', 'unholy']
    },
    'golem': {
        label: 'Golem',
        faction: 'time',
        types: ['human', 'divine']
    },
    'honda civic': {
        label: 'Sedan',
        faction: 'space',
        types: ['tech']
    },
    'ice queen': {
        label: 'Ice Queen',
        faction: 'time',
        types: ['divine', 'anomaly']
    },
    'juggernaut': {
        label: 'Juggernaut',
        faction: 'chaos',
        types: ['unholy', 'human']
    },
    'ki fighter': {
        label: 'Ki Fighter',
        labelMale: 'Ki Fighter',
        labelFemale: 'Ki Fighter',
        faction: 'time',
        types: ['human']
    },
    'king arthur': {
        label: 'King Arthur',
        faction: 'time',
        types: ['human', 'divine']
    },
    'king kong': {
        label: 'King Kong',
        faction: 'chaos',
        types: ['anomaly']
    },
    'minotaur': {
        label: 'Minotaur',
        faction: 'chaos',
        types: ['unholy', 'human']
    },
    'necromancer': {
        label: 'Necromancer',
        labelMale: 'Necromancer',
        labelFemale: 'Necromancer',
        faction: 'chaos',
        types: ['unholy']
    },
    'occulus': {
        label: 'Occulus',
        faction: 'time',
        types: ['anomaly', 'divine']
    },
    'quarterback': {
        label: 'Quarterback',
        faction: 'space',
        types: ['human']
    },
    'robinhood': {
        label: 'Robin Hood',
        faction: 'time',
        types: ['human']
    },
    'santa clause': {
        label: 'Santa Clause',
        faction: 'time',
        types: ['divine', 'anomaly']
    },
    'super sentai': {
        label: 'Super Sentai',
        faction: 'space',
        types: ['tech', 'human']
    },
    'symbiote': {
        label: 'Symbiote',
        faction: 'chaos',
        types: ['unholy', 'anomaly']
    },
    'valkraye': {
        label: 'Valkraye',
        faction: 'time',
        types: ['divine']
    },
    'watcher': {
        label: 'The Watcher',
        faction: 'time',
        types: ['divine', 'anomaly']
    }
};

/* ══════════ UNIT PASSIVE REGISTRY (2026-07-23) ══════════
   Single source of truth for combat passives. Replaces the pile of one-off
   `race === 'kaiju'` checks that used to live in battle.js — the engine now
   reads HOOK FLAGS off these defs instead of matching race strings, so the
   next passive is a data entry, not an engine patch.

   Hook flags the engine understands today:
     healedByElement: 'fire'     damage of that element HEALS instead of hurts
                                 (applyDamageToUnit, battle.js)
     immuneStatus: ['stagger']   these statuses simply never land
                                 (applyStatusPayload, battle.js)
     phasing: true               moves through walls/enemies/barricades
                                 (unitIsPhasing, map.js → getMoveTiles/findMovePath)
     basicAttackLifesteal: 0.25  basic attacks drain this fraction of damage
                                 dealt as HP (performBasicAttack, battle.js)
   `flying` has no flag — being a SKY_RACE (canFly/isUnitAirborne, map.js) IS
   the hook; the registry entry exists so flight shows up, and counts, as a
   passive.

   RULES: a unit has AT MOST MAX_UNIT_PASSIVES (2). Flying units get `flying`
   automatically and it always occupies one of the two slots. While airborne a
   flyer is untouchable by anything ground-bound: terrain tick effects, terrain
   spells/deforms, seeds, traps — and it cannot channel a Nexus (all enforced
   engine-side via isUnitAirborne gates).

   party-builder.js RACE_TRAITS is DISPLAY ONLY — it merges these registry
   entries in at render time, so this table can never drift from the UI. */
const MAX_UNIT_PASSIVES = 2;

const PASSIVE_DEFS = {
    flying: {
        id: 'flying', icon: '🕊️', name: 'Flying',
        desc: 'Airborne — crosses chasms, lava and deep water. While flying: immune to terrain effects, terrain spells and deforms, seeds and traps, but cannot channel a Nexus. Grounded below 25% HP.',
    },
    thermalRegen: {
        id: 'thermalRegen', icon: '🔥', name: 'Thermal Regen',
        healedByElement: 'fire',
        immuneStatus: ['burn'],
        desc: 'Fire feeds it: fire damage heals instead of harming, Burn never takes hold, and a lava bath knits its wounds.',
    },
    spectralPassage: {
        id: 'spectralPassage', icon: '👻', name: 'Spectral Passage',
        phasing: true,
        desc: 'Moves through walls, enemies and barricades as if they were not there (must still stop on an open tile).',
    },
    manAtArms: {
        id: 'manAtArms', icon: '🛡️', name: 'Man-at-Arms',
        immuneStatus: ['stagger'],
        desc: 'Heavy plate and drilled footing — immune to Stagger.',
    },
    unquietMind: {
        id: 'unquietMind', icon: '🧠', name: 'Unquiet Mind',
        immuneStatus: ['charm'],
        desc: 'A mind already crowded with voices — immune to Charm.',
    },
    fractalMind: {
        id: 'fractalMind', icon: '🔮', name: 'Fractal Mind',
        immuneStatus: ['charm'],
        desc: 'Self-similar at every scale — psychic lures find no single self to seduce. Immune to Charm.',
    },
    sereneMind: {
        id: 'sereneMind', icon: '❄️', name: 'Serene Mind',
        immuneStatus: ['charm'],
        desc: 'Federation discipline — immune to Charm.',
    },
    hemophage: {
        id: 'hemophage', icon: '🩸', name: 'Hemophage',
        basicAttackLifesteal: 0.25,
        desc: 'Basic attacks drink deep — restores 25% of the damage dealt as HP.',
    },
};

/* race → up to 2 passive ids. For SKY_RACES `flying` is inserted
   automatically as the FIRST passive (do not list it here) — so a flying
   race gets at most ONE entry from this table. */
const RACE_PASSIVES = {
    'kaiju':         ['thermalRegen'],
    'ghost':         ['spectralPassage'],     // ghost also flies → slots full
    'knight':        ['manAtArms'],
    'telepath':      ['unquietMind'],         // telepath levitates → slots full
    'machine elves': ['fractalMind'],
    'nordic':        ['sereneMind'],
    'vampire':       ['hemophage'],           // vampire also flies → slots full
};

function getUnitPassives(unit) {
    if (!unit) return [];
    const out = [];
    const flies = (typeof window !== 'undefined' && typeof window.canFly === 'function')
        ? window.canFly(unit) : false;
    if (flies) out.push(PASSIVE_DEFS.flying);
    for (const id of (RACE_PASSIVES[unit.race] || [])) {
        if (out.length >= MAX_UNIT_PASSIVES) break;
        const def = PASSIVE_DEFS[id];
        if (def && out.indexOf(def) === -1) out.push(def);
    }
    return out;
}

function unitHasPassive(unit, id) {
    const list = getUnitPassives(unit);
    for (const p of list) if (p.id === id) return true;
    return false;
}

/* First defined value of `key` across the unit's passives (undefined if none).
   e.g. unitPassiveValue(u, 'basicAttackLifesteal') → 0.25 for vampires. */
function unitPassiveValue(unit, key) {
    const list = getUnitPassives(unit);
    for (const p of list) if (p[key] !== undefined) return p[key];
    return undefined;
}

/* Does any of the unit's passives grant immunity to this status id? */
function unitPassiveBlocksStatus(unit, statusId) {
    const list = getUnitPassives(unit);
    for (const p of list) {
        if (p.immuneStatus && p.immuneStatus.indexOf(statusId) !== -1) return p;
    }
    return null;
}

const AVAILABLE_RACES = ['homosapien', 'pirate', 'swordfighter', 'knight', 'shaman', 'mad scientist', 'cowboy', 'men in black', 'telepath', 'marksman', 'priest', 'wizard', 'fortune teller', 'giant', 'fairy', 'martian', 'nordic', 'grey', 'bigfoot', 'shadow entity', 'reptilian', 'ai', 'robot', 'android', 'angel', 'seraphim', 'orb of light', 'demon', 'succubus', 'skeleton', 'mech', 'ghost', 'zombie', 'annunaki', 'skinwalker', 'werewolf', 'gargoyle', 'djinn', 'anubis', 'catgirl', 'mantid', 'antperson', 'mothman', 'siren', 'scarecrow', 'glitch', 'machine elves', 'cyclops', 'cyborg', 'demon prince', 'demon princess', 'dreameater', 'fallen angel', 'goatman', 'halfdemon', 'mermaid', 'nephilim', 'vampire', 'voidweaver', 'cosmic wraith', 'superhero', 'general', 'droid', 'antihero', 'conspiracy theorist', 'overlord', 'chosen one', 'politician', 'atlantean', 'dinosaur', 'dragon', 'ghoul', 'gnome', 'kaiju', 'kraken', 'loch ness monster', 'yeti', 'barbarella', 'black goo', 'golem', 'honda civic', 'ice queen', 'juggernaut', 'ki fighter', 'king arthur', 'king kong', 'minotaur', 'necromancer', 'occulus', 'quarterback', 'robinhood', 'santa clause', 'super sentai', 'symbiote', 'valkraye', 'watcher'];

const RACE_DEFAULT_JOBS = {
    // NOTE (2026-07-18): 'Warrior' and 'Tank' are now SEPARATE jobs (the old
    // single 'Warrior' job used to display as "Tank"). 'Agent' still displays
    // as "Assassin" and 'Raider' as "Bruiser" (JOB_DISPLAY_NAMES).
    'giant': 'Tank',
    'skeleton': 'Swordmaster',
    'robot': 'Warrior',
    'nordic': 'Harbinger',
    'angel': 'White Mage',
    'fairy': 'White Mage',
    'ghost': 'Psychic',
    'seraphim': 'Black Mage',
    'djinn': 'Black Mage',
    'demon': 'Black Mage',
    'anubis': 'Black Mage',
    'android': 'Agent',
    'shadow entity': 'Agent',
    'reptilian': 'Agent',
    'martian': 'Gunslinger',
    'mech': 'Gunslinger',
    'catgirl': 'Gunslinger',
    'annunaki': 'Sniper',
    'gargoyle': 'Sniper',
    'bigfoot': 'Harvester',
    'antperson': 'Harvester',
    'scarecrow': 'Harvester',
    'mantid': 'Psychic',
    'grey': 'Psychic',
    'succubus': 'Psychic',
    'skinwalker': 'Psychic',
    'ai': 'Engineer',
    'machine elves': 'Engineer',
    'glitch': 'Engineer',
    'orb of light': 'Harbinger',
    'mothman': 'Harbinger',
    'siren': 'Harbinger',
    'homosapien': 'Freelancer',
    'pirate': 'Swordmaster',
    'swordfighter': 'Swordmaster',
    'knight': 'Warrior',
    'shaman': 'Harvester',
    'mad scientist': 'Engineer',
    'cowboy': 'Gunslinger',
    'men in black': 'Agent',
    'telepath': 'Psychic',
    'marksman': 'Sniper',
    'priest': 'White Mage',
    'wizard': 'Black Mage',
    'fortune teller': 'Harbinger',
    'zombie': 'Raider',
    'werewolf': 'Raider',
    'cyclops': 'Warrior',
    'cyborg': 'Raider',
    'demon prince': 'Black Mage',
    'demon princess': 'Harbinger',
    'dreameater': 'Psychic',
    'fallen angel': 'Harbinger',
    'goatman': 'Raider',
    'halfdemon': 'Agent',
    'mermaid': 'White Mage',
    'nephilim': 'Warrior',
    'vampire': 'Agent',
    'voidweaver': 'Black Mage',
    'cosmic wraith': 'Sniper',
    'superhero': 'Freelancer',
    'general': 'Warrior',
    'droid': 'Engineer',
    'antihero': 'Freelancer',
    'conspiracy theorist': 'Harbinger',
    'overlord': 'Warrior',
    'chosen one': 'Agent',
    'politician': 'Freelancer',
    'atlantean': 'White Mage',
    'dinosaur': 'Raider',
    'dragon': 'Black Mage',
    'ghoul': 'Agent',
    'gnome': 'Engineer',
    'kaiju': 'Raider',
    'kraken': 'Harbinger',
    'loch ness monster': 'Tank',
    'yeti': 'Raider',

    'barbarella': 'Agent',
    'black goo': 'Psychic',
    'golem': 'Tank',
    'honda civic': 'Engineer',
    'ice queen': 'Black Mage',
    'juggernaut': 'Tank',
    'ki fighter': 'Raider',
    'king arthur': 'Swordmaster',
    'king kong': 'Harvester',
    'minotaur': 'Raider',
    'necromancer': 'Black Mage',
    'occulus': 'Harbinger',
    'quarterback': 'Sniper',
    'robinhood': 'Sniper',
    'santa clause': 'Tank',
    'super sentai': 'Freelancer',
    'symbiote': 'Agent',
    'valkraye': 'Swordmaster',
    'watcher': 'Harbinger'
};

const RACE_CLASS = {
    'giant': 'tank',
    'robot': 'tank',
    'mech': 'tank',
    'gargoyle': 'tank',
    'zombie': 'tank',
    'cyclops': 'tank',
    'skeleton': 'bruiser',
    'demon': 'bruiser',
    'bigfoot': 'bruiser',
    'antperson': 'bruiser',
    'werewolf': 'bruiser',
    'angel': 'healer',
    'ghost': 'caster',
    'nordic': 'support',
    'fairy': 'support',
    'scarecrow': 'support',
    'grey': 'support',
    'succubus': 'support',
    'orb of light': 'support',
    'mothman': 'support',
    'siren': 'support',
    'android': 'assassin',
    'shadow entity': 'assassin',
    'reptilian': 'assassin',
    'catgirl': 'assassin',
    'mantid': 'assassin',
    'skinwalker': 'assassin',
    'seraphim': 'caster',
    'djinn': 'caster',
    'anubis': 'caster',
    'martian': 'ranged',
    'annunaki': 'ranged',
    'ai': 'specialist',
    'machine elves': 'specialist',
    'glitch': 'specialist',
    'homosapien': 'hybrid',
    'pirate': 'bruiser',
    'swordfighter': 'bruiser',
    'knight': 'tank',
    'shaman': 'support',
    'mad scientist': 'specialist',
    'cowboy': 'ranged',
    'men in black': 'assassin',
    'telepath': 'caster',
    'marksman': 'ranged',
    'priest': 'healer',
    'wizard': 'caster',
    'fortune teller': 'support',
    'cyborg': 'bruiser',
    'demon prince': 'bruiser',
    'demon princess': 'support',
    'dreameater': 'support',
    'fallen angel': 'caster',
    'goatman': 'bruiser',
    'halfdemon': 'assassin',
    'mermaid': 'healer',
    'nephilim': 'tank',
    'vampire': 'assassin',
    'voidweaver': 'assassin',
    'cosmic wraith': 'ranged',
    'superhero': 'hybrid',
    'general': 'tank',
    'droid': 'specialist',
    'antihero': 'hybrid',
    'conspiracy theorist': 'support',
    'overlord': 'bruiser',
    'chosen one': 'assassin',
    'politician': 'support',
    'atlantean': 'support',
    'dinosaur': 'bruiser',
    'dragon': 'caster',
    'ghoul': 'assassin',
    'gnome': 'specialist',
    'kaiju': 'bruiser',
    'kraken': 'support',
    'loch ness monster': 'tank',
    'yeti': 'bruiser',

    'barbarella': 'assassin',
    'black goo': 'specialist',
    'golem': 'tank',
    'honda civic': 'specialist',
    'ice queen': 'caster',
    'juggernaut': 'tank',
    'ki fighter': 'bruiser',
    'king arthur': 'tank',
    'king kong': 'bruiser',
    'minotaur': 'bruiser',
    'necromancer': 'caster',
    'occulus': 'support',
    'quarterback': 'ranged',
    'robinhood': 'ranged',
    'santa clause': 'tank',
    'super sentai': 'tank',
    'symbiote': 'assassin',
    'valkraye': 'bruiser',
    'watcher': 'support'
};
const AVAILABLE_GENDERS = ['male', 'female', 'other'];
const AVAILABLE_ZODIACS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const AVAILABLE_SLEEP_PREFERENCES = ['none', 'nocturnal', 'daywalker'];
const AVAILABLE_TERRAIN_PREFERENCES = ['grass', 'water', 'deep_water', 'mountain', 'desert'];
const AVAILABLE_ITEM_TYPES = ['', 'healPotion', 'manaPotion', 'scanner'];

const ZODIAC_CYCLE = AVAILABLE_ZODIACS;
const ZODIAC_ROTATION_ROUNDS = 5;
const ZODIAC_ICONS = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓'
};

const SKY_EVENTS = {
    bloodMoon: {
        label: 'Blood Moon',
        icon: '🌑',
        faction: 'chaos',
        desc: 'Chaos units gain +10% ATK',
        atkMult: 1.10
    },
    solarEclipse: {
        label: 'Black Sun',
        icon: '🌘',
        faction: 'time',
        desc: 'Time units gain +15% healing',
        healMult: 1.15
    },
    lunarEclipse: {
        label: 'Lunar Eclipse',
        icon: '🌒',
        faction: 'space',
        desc: 'Space units gain +10% DEF',
        defMult: 1.10
    }
};
const SKY_EVENT_KEYS = Object.keys(SKY_EVENTS);
const SKY_EVENT_START_ROUND = 6;
const SKY_EVENT_CHANCE = 0.15;
const SKY_EVENT_DURATION = 2;

// ── RACE BASE STATS (2026-08-14 stat identity rework) ──────────────────────
// These are FINAL base statlines — each race's locked primary job
// (RACE_DEFAULT_JOBS) is already baked in. computeUnitStats applies NO
// primary-job stat delta anymore; JOB_MODIFIERS below is now the
// secondary-job "training" system (Pokémon-nature-style).
// Rules of the rework:
//   • Every race has 2–3 clearly HIGH stats and 2–3 clearly LOW stats —
//     no good-at-everything statlines. ATK and INT (M.ATK) are mutually
//     exclusive peaks, except a few deliberate glass hybrids (chosen one)
//     and magic-knights (overlord, demon) whose off-stat sits MID — never
//     high — and who pay for it with paper defenses.
//   • Every race kept its pre-rework total power budget (value-weighted:
//     1 ATK/INT ≈ 12.5 HP ≈ 6.7 MP ≈ 1.25 DEF/MDEF ≈ ¼ of a SPD/AWR
//     point), so the CAMPAIGN_RACE_PRICES / XP-yield tier list still holds.
//   • Kit alignment preserved: a race whose racials deal physical damage
//     keeps the ATK to use them (and vice versa); an all-magic kit on a
//     martial race keeps INT ≥ 45 (magic-knight floor) — kit-vs-stat pass
//     2026-08-09 stays honored.
// ── 2026-08-29 STAT REWORK (STAT_REWORK.md) ────────────────────────────────
// The six core stats (ATK/INT/DEF/MDEF/SPD/AWR) live on ONE 0–100 ruler:
// letter grade = ceil(stat/20) → F 1–20 · C 21–40 · B 41–60 · A 61–80 ·
// S 81–100 (see STAT_GRADE_BANDS). HP/MP stay raw pools with bespoke bands.
// This was a mechanical rescale, NOT a rebalance: DEF ×1.2, MDEF ×1.6,
// AWR ×14 (battle/state formulas carry inverse compensators, so combat math
// is unchanged). MOVE is no longer stored — it derives from SPD via
// moveFromSpd(): 1 tile per 20 SPD (F walks 1, S walks 5). The migration
// preserved every race's exact tile count: newSpd = bandFloor(oldMove) +
// round((oldSpd−2)/8·19), so act order within a band follows old SPD, and
// tiles-outrank-raw-speed is the one accepted initiative change.
const RACE_BASE_STATS = {
    'giant':              { hp: 795, mp:  40, atk:  58, def:  94, mdef:  52, int:   0, awr: 14, spd: 26 },
    'robot':              { hp: 700, mp:  50, atk:  74, def:  83, mdef:  35, int:   3, awr: 42, spd: 43 },
    'mech':               { hp: 625, mp:  90, atk:  52, def:  63, mdef:  26, int:  30, awr: 28, spd: 23 },
    'gargoyle':           { hp: 580, mp:  75, atk:  66, def:  44, mdef:  24, int:  18, awr: 84, spd:  8 },
    'zombie':             { hp: 720, mp:  45, atk:  60, def:  66, mdef:  24, int:   0, awr: 14, spd: 43 },
    'cyclops':            { hp: 710, mp:  75, atk:  76, def:  71, mdef:  35, int:  25, awr: 42, spd: 51 },
    'skeleton':           { hp: 615, mp:  85, atk:  96, def:  46, mdef:  42, int:  22, awr: 42, spd: 60 },
    'demon':              { hp: 520, mp: 145, atk:  36, def:  22, mdef:  54, int:  52, awr: 28, spd: 26 },
    'bigfoot':            { hp: 710, mp:  95, atk:  90, def:  48, mdef:  37, int:  24, awr: 28, spd: 21 },
    'antperson':          { hp: 730, mp: 120, atk:  94, def:  46, mdef:  53, int:  31, awr: 42, spd: 31 },
    'werewolf':           { hp: 635, mp:  85, atk:  94, def:  42, mdef:  32, int:  10, awr: 42, spd: 58 },
    'angel':              { hp: 450, mp: 220, atk:   8, def:  36, mdef:  90, int:  74, awr: 56, spd: 35 },
    'ghost':              { hp: 500, mp: 240, atk:   8, def:  28, mdef:  90, int:  92, awr: 70, spd: 53 },
    'nordic':             { hp: 590, mp: 210, atk:  22, def:  31, mdef:  80, int:  88, awr: 56, spd: 31 },
    'fairy':              { hp: 435, mp: 230, atk:   8, def:  26, mdef:  93, int:  79, awr: 70, spd: 53 },
    'scarecrow':          { hp: 660, mp: 160, atk:  84, def:  58, mdef:  54, int:  30, awr: 28, spd: 23 },
    'grey':               { hp: 480, mp: 250, atk:   8, def:  23, mdef:  96, int:  99, awr: 98, spd: 33 },
    'succubus':           { hp: 505, mp: 230, atk:  16, def:  25, mdef:  86, int:  87, awr: 56, spd: 35 },
    'orb of light':       { hp: 475, mp: 255, atk:   8, def:  20, mdef:  98, int: 104, awr: 98, spd: 33 },
    'mothman':            { hp: 490, mp: 215, atk:   8, def:  25, mdef:  74, int:  84, awr: 98, spd: 38 },
    'siren':              { hp: 520, mp: 220, atk:   8, def:  24, mdef:  85, int:  88, awr: 56, spd: 38 },
    'android':            { hp: 480, mp: 145, atk:  77, def:  29, mdef:  59, int:  31, awr: 98, spd: 60 },
    'shadow entity':      { hp: 455, mp: 160, atk:  44, def:  24, mdef:  66, int:  70, awr: 98, spd: 60 },
    'reptilian':          { hp: 470, mp: 130, atk:  86, def:  31, mdef:  42, int:  31, awr: 84, spd: 55 },
    'catgirl':            { hp: 485, mp: 110, atk:  88, def:  30, mdef:  42, int:  26, awr: 70, spd: 60 },
    'mantid':             { hp: 480, mp: 220, atk:  30, def:  20, mdef:  58, int:  94, awr: 84, spd: 58 },
    'skinwalker':         { hp: 480, mp: 190, atk:  34, def:  26, mdef:  64, int:  88, awr: 84, spd: 60 },
    'seraphim':           { hp: 385, mp: 260, atk:   8, def:  15, mdef:  96, int:  89, awr: 56, spd: 35 },
    'djinn':              { hp: 400, mp: 240, atk:   8, def:  22, mdef:  91, int:  83, awr: 42, spd: 35 },
    'anubis':             { hp: 400, mp: 245, atk:   8, def:  22, mdef:  93, int:  86, awr: 56, spd: 31 },
    'martian':            { hp: 515, mp: 140, atk:  88, def:  31, mdef:  48, int:  30, awr: 84, spd: 35 },
    'annunaki':           { hp: 555, mp: 135, atk:  80, def:  29, mdef:  37, int:  31, awr: 84, spd: 11 },
    'ai':                 { hp: 545, mp: 230, atk:  18, def:  44, mdef:  96, int:  92, awr: 84, spd: 28 },
    'machine elves':      { hp: 580, mp: 240, atk:  18, def:  26, mdef:  86, int:  92, awr: 70, spd: 33 },
    'glitch':             { hp: 520, mp: 200, atk:  30, def:  31, mdef:  74, int:  84, awr: 70, spd: 60 },
    'homosapien':         { hp: 595, mp: 140, atk:  70, def:  50, mdef:  45, int:  28, awr: 70, spd: 33 },
    'pirate':             { hp: 605, mp: 110, atk:  86, def:  48, mdef:  43, int:  24, awr: 56, spd: 58 },
    'swordfighter':       { hp: 595, mp: 105, atk:  88, def:  50, mdef:  45, int:  26, awr: 56, spd: 60 },
    'knight':             { hp: 655, mp: 115, atk:  78, def:  68, mdef:  48, int:  31, awr: 28, spd: 46 },
    'shaman':             { hp: 650, mp: 240, atk:  36, def:  39, mdef:  86, int:  84, awr: 56, spd: 26 },
    'mad scientist':      { hp: 480, mp: 205, atk:  20, def:  34, mdef:  86, int:  90, awr: 98, spd: 33 },
    'cowboy':             { hp: 560, mp: 105, atk:  78, def:  40, mdef:  40, int:  24, awr: 56, spd: 35 },
    'men in black':       { hp: 450, mp: 155, atk:  40, def:  29, mdef:  61, int:  66, awr: 98, spd: 60 },
    'telepath':           { hp: 505, mp: 265, atk:   8, def:  23, mdef:  98, int: 103, awr: 98, spd: 33 },
    'marksman':           { hp: 500, mp: 110, atk:  80, def:  17, mdef:  27, int:  22, awr: 98, spd: 18 },
    'priest':             { hp: 460, mp: 220, atk:   8, def:  36, mdef:  88, int:  71, awr: 56, spd: 33 },
    'wizard':             { hp: 415, mp: 255, atk:   8, def:  17, mdef:  98, int:  90, awr: 42, spd: 31 },
    'fortune teller':     { hp: 545, mp: 210, atk:   8, def:  25, mdef:  82, int:  90, awr: 98, spd: 33 },
    'nephilim':           { hp: 700, mp: 110, atk:  72, def:  77, mdef:  40, int:  31, awr: 42, spd: 43 },
    'demon prince':       { hp: 525, mp: 135, atk:  28, def:  20, mdef:  53, int:  66, awr: 28, spd: 23 },
    'goatman':            { hp: 650, mp: 100, atk:  94, def:  42, mdef:  35, int:  31, awr: 28, spd: 53 },
    'mermaid':            { hp: 450, mp: 225, atk:   8, def:  34, mdef:  93, int:  77, awr: 56, spd: 35 },
    'demon princess':     { hp: 525, mp: 215, atk:   8, def:  25, mdef:  82, int:  84, awr: 56, spd: 35 },
    'dreameater':         { hp: 505, mp: 235, atk:   8, def:  20, mdef:  93, int:  94, awr: 84, spd: 33 },
    'halfdemon':          { hp: 495, mp: 145, atk:  79, def:  29, mdef:  58, int:  31, awr: 84, spd: 60 },
    'vampire':            { hp: 440, mp: 155, atk:  61, def:  26, mdef:  50, int:  31, awr: 98, spd: 55 },
    'fallen angel':       { hp: 480, mp: 245, atk:   8, def:  23, mdef:  94, int: 102, awr: 56, spd: 38 },
    'voidweaver':         { hp: 445, mp: 195, atk:  40, def:  15, mdef:  69, int:  58, awr: 70, spd: 55 },
    'cosmic wraith':      { hp: 540, mp: 140, atk:  83, def:  22, mdef:  43, int:  31, awr: 98, spd: 18 },
    'cyborg':             { hp: 635, mp:  80, atk:  89, def:  42, mdef:  39, int:  17, awr: 42, spd: 58 },
    'superhero':          { hp: 580, mp: 120, atk:  68, def:  50, mdef:  45, int:  26, awr: 56, spd: 53 },
    'general':            { hp: 650, mp: 105, atk:  80, def:  63, mdef:  56, int:  25, awr: 42, spd: 51 },
    'droid':              { hp: 555, mp: 250, atk:  15, def:  44, mdef:  96, int:  90, awr: 70, spd: 28 },
    'antihero':           { hp: 580, mp: 115, atk:  66, def:  49, mdef:  45, int:  29, awr: 56, spd: 55 },
    'conspiracy theorist':{ hp: 550, mp: 195, atk:  18, def:  28, mdef:  71, int:  72, awr: 84, spd: 33 },
    'overlord':           { hp: 705, mp: 105, atk:  90, def:  55, mdef:  42, int:  45, awr: 28, spd: 46 },
    'chosen one':         { hp: 430, mp: 200, atk:  68, def:  24, mdef:  71, int:  68, awr: 98, spd: 60 },
    'politician':         { hp: 570, mp: 165, atk:  22, def:  46, mdef:  64, int:  66, awr: 84, spd: 28 },
    'atlantean':          { hp: 495, mp: 200, atk:  22, def:  41, mdef:  75, int:  63, awr: 42, spd: 31 },
    'dinosaur':           { hp: 655, mp:  70, atk:  98, def:  37, mdef:  32, int:   9, awr: 28, spd: 55 },
    'dragon':             { hp: 440, mp: 205, atk:  40, def:  22, mdef:  84, int:  70, awr: 42, spd: 23 },
    'ghoul':              { hp: 505, mp: 130, atk:  66, def:  26, mdef:  50, int:  31, awr: 70, spd: 60 },
    'gnome':              { hp: 580, mp: 205, atk:  34, def:  72, mdef:  90, int:  36, awr: 70, spd: 28 },
    'kaiju':              { hp: 655, mp: 110, atk: 100, def:  42, mdef:  24, int:  25, awr: 14, spd: 46 },
    'kraken':             { hp: 555, mp: 205, atk:  40, def:  37, mdef:  71, int:  69, awr: 56, spd: 21 },
    'loch ness monster':  { hp: 770, mp:  95, atk:  54, def:  92, mdef:  48, int:  31, awr: 14, spd: 21 },
    'yeti':               { hp: 660, mp:  75, atk:  94, def:  44, mdef:  29, int:   5, awr: 28, spd: 43 },
    'barbarella':         { hp: 485, mp: 145, atk:  72, def:  34, mdef:  59, int:  31, awr: 70, spd: 58 },
    'black goo':          { hp: 555, mp: 190, atk:  22, def:  32, mdef:  75, int:  74, awr: 70, spd: 28 },
    'golem':              { hp: 820, mp:  40, atk:  54, def: 101, mdef:  46, int:   0, awr: 14, spd: 21 },
    'honda civic':        { hp: 640, mp: 110, atk:  62, def:  65, mdef:  50, int:  25, awr: 28, spd: 51 },
    'ice queen':          { hp: 410, mp: 235, atk:   8, def:  22, mdef:  90, int:  82, awr: 56, spd: 33 },
    'juggernaut':         { hp: 800, mp:  40, atk:  84, def:  79, mdef:  48, int:   0, awr: 14, spd: 23 },
    'ki fighter':         { hp: 665, mp: 115, atk:  96, def:  40, mdef:  40, int:  31, awr: 42, spd: 60 },
    'king arthur':        { hp: 645, mp:  90, atk:  72, def:  70, mdef:  46, int:  28, awr: 56, spd: 53 },
    'king kong':          { hp: 755, mp:  75, atk: 100, def:  50, mdef:  32, int:  20, awr: 28, spd: 21 },
    'minotaur':           { hp: 675, mp:  70, atk:  94, def:  42, mdef:  37, int:   7, awr: 28, spd: 53 },
    'necromancer':        { hp: 425, mp: 230, atk:   8, def:  20, mdef:  86, int:  78, awr: 42, spd: 31 },
    'occulus':            { hp: 495, mp: 210, atk:   8, def:  23, mdef:  80, int:  84, awr: 84, spd: 53 },
    'quarterback':        { hp: 535, mp: 100, atk:  72, def:  26, mdef:  27, int:  22, awr: 84, spd: 35 },
    'robinhood':          { hp: 530, mp: 105, atk:  84, def:  22, mdef:  32, int:  28, awr: 98, spd: 40 },
    'santa clause':       { hp: 805, mp: 110, atk:  52, def:  82, mdef:  84, int:  31, awr: 42, spd: 26 },
    'super sentai':       { hp: 640, mp:  90, atk:  54, def:  59, mdef:  40, int:  23, awr: 56, spd: 28 },
    'symbiote':           { hp: 480, mp: 125, atk:  70, def:  31, mdef:  50, int:  31, awr: 70, spd: 58 },
    'valkraye':           { hp: 605, mp: 100, atk:  80, def:  53, mdef:  50, int:  30, awr: 56, spd: 58 },
    'watcher':            { hp: 510, mp: 210, atk:   8, def:  28, mdef:  82, int:  84, awr: 84, spd: 33 },
};

/* ── RACE_PHYSIQUE (2026-07-07 physique pass) ──────────────────────────────
   Official height (m) and weight (kg) for every race — canonical values used
   in CALCULATIONS, not just flavor. Weight class derives from kg in battle.js
   getUnitWeightClass:
     feather < 30 ≤ light < 80 ≤ medium < 250 ≤ heavy < 1000 ≤ colossal
   and feeds: push/pull distance (feather +1, heavy −1, colossal immovable),
   fall damage (×0.5 feather … ×1.5 colossal), and crash-through (feathers
   bounce off blocks, heavies also smash through stone). Armored/equipped
   races list their fighting weight, gear included. */
const RACE_PHYSIQUE = {
    'homosapien':          { h: 1.75, w: 75 },
    'pirate':              { h: 1.80, w: 85 },
    'swordfighter':        { h: 1.68, w: 58 },   // pop-idol duelist, light on her feet
    'knight':              { h: 1.90, w: 140 },   // full plate included
    'shaman':              { h: 1.70, w: 70 },
    'mad scientist':       { h: 1.75, w: 72 },
    'cowboy':              { h: 1.80, w: 82 },
    'men in black':        { h: 1.85, w: 80 },
    'telepath':            { h: 1.70, w: 65 },
    'marksman':            { h: 1.80, w: 80 },
    'priest':              { h: 1.75, w: 74 },
    'wizard':              { h: 1.70, w: 68 },
    'fortune teller':      { h: 1.65, w: 60 },
    'giant':               { h: 7.50, w: 3800 },
    'fairy':               { h: 0.25, w: 1.5 },
    'martian':             { h: 1.50, w: 48 },
    'nordic':              { h: 2.10, w: 105 },
    'grey':                { h: 1.20, w: 35 },
    'bigfoot':             { h: 2.60, w: 380 },
    'shadow entity':       { h: 1.90, w: 2 },     // barely tethered to matter
    'reptilian':           { h: 2.00, w: 110 },
    'ai':                  { h: 1.20, w: 25 },    // a floating core
    'robot':               { h: 1.90, w: 350 },
    'android':             { h: 1.80, w: 150 },
    'angel':               { h: 1.90, w: 80 },
    'seraphim':            { h: 2.40, w: 95 },
    'orb of light':        { h: 0.60, w: 0.5 },
    'demon':               { h: 2.20, w: 160 },
    'succubus':            { h: 1.75, w: 62 },
    'skeleton':            { h: 1.75, w: 28 },    // bones only — flies when hit
    'mech':                { h: 3.50, w: 2200 },
    'ghost':               { h: 1.80, w: 0.1 },
    'zombie':              { h: 1.75, w: 70 },
    'annunaki':            { h: 2.50, w: 140 },
    'skinwalker':          { h: 1.90, w: 90 },
    'werewolf':            { h: 2.10, w: 130 },
    'gargoyle':            { h: 1.90, w: 400 },   // living stone
    'djinn':               { h: 2.30, w: 40 },    // smoke below the waist
    'anubis':              { h: 2.10, w: 110 },
    'catgirl':             { h: 1.60, w: 52 },
    'mantid':              { h: 1.90, w: 75 },
    'antperson':           { h: 1.50, w: 55 },
    'mothman':             { h: 2.20, w: 85 },
    'siren':               { h: 1.70, w: 60 },
    'scarecrow':           { h: 1.85, w: 25 },    // straw and burlap
    'glitch':              { h: 1.70, w: 10 },
    'machine elves':       { h: 1.40, w: 30 },
    'cyclops':             { h: 3.20, w: 520 },
    'cyborg':              { h: 1.90, w: 160 },
    'demon prince':        { h: 2.30, w: 180 },
    'demon princess':      { h: 2.10, w: 120 },
    'dreameater':          { h: 2.00, w: 90 },
    'fallen angel':        { h: 1.95, w: 85 },
    'goatman':             { h: 2.00, w: 115 },
    'halfdemon':           { h: 1.90, w: 95 },
    'mermaid':             { h: 1.70, w: 65 },
    'nephilim':            { h: 2.80, w: 280 },
    'vampire':             { h: 1.85, w: 75 },
    'voidweaver':          { h: 2.00, w: 70 },
    'cosmic wraith':       { h: 2.20, w: 5 },
    'superhero':           { h: 1.90, w: 100 },
    'general':             { h: 1.80, w: 85 },
    'droid':               { h: 1.40, w: 90 },
    'antihero':            { h: 1.85, w: 88 },
    'conspiracy theorist': { h: 1.75, w: 78 },
    'overlord':            { h: 2.40, w: 190 },
    'chosen one':          { h: 1.80, w: 75 },
    'politician':          { h: 1.80, w: 90 },
    'atlantean':           { h: 2.00, w: 95 },
    'dinosaur':            { h: 4.50, w: 4000 },
    'dragon':              { h: 6.00, w: 4500 },
    'ghoul':               { h: 1.80, w: 65 },
    'gnome':               { h: 0.90, w: 25 },
    'kaiju':               { h: 50.0, w: 20000 },
    'kraken':              { h: 12.0, w: 6000 },
    'loch ness monster':   { h: 10.0, w: 5000 },
    'yeti':                { h: 2.50, w: 320 },
    'barbarella':          { h: 1.70, w: 62 },
    'black goo':           { h: 1.50, w: 260 },   // dense amorphous mass
    'golem':               { h: 2.60, w: 900 },
    'honda civic':         { h: 1.45, w: 1300 },  // it is, in fact, a car
    'ice queen':           { h: 1.80, w: 64 },
    'juggernaut':          { h: 2.40, w: 1100 },  // unstoppable ≈ immovable
    'ki fighter':          { h: 1.75, w: 80 },
    'king arthur':         { h: 1.85, w: 130 },   // crown, plate, Excalibur
    'king kong':           { h: 15.0, w: 8000 },
    'minotaur':            { h: 2.40, w: 280 },
    'necromancer':         { h: 1.80, w: 65 },
    'occulus':             { h: 1.50, w: 40 },    // floating eye
    'quarterback':         { h: 1.90, w: 110 },
    'robinhood':           { h: 1.80, w: 75 },
    'santa clause':        { h: 1.80, w: 120 },
    'super sentai':        { h: 1.80, w: 78 },
    'symbiote':            { h: 1.90, w: 95 },
    'valkraye':            { h: 1.90, w: 85 },
    'watcher':             { h: 2.00, w: 50 },
};

/* ── JOB KITS ── the job's weapon profile ───────────────────────────────
   Absolute values, not balance modifiers: attack range and inspect
   strength describe what the job IS (a sniper shoots far, an agent cases
   a room). Applied for the PRIMARY job only, in computeUnitStats. */
const JOB_KITS = {
    'Warrior':     { range: 1, inspect: 1 },
    'Tank':        { range: 1, inspect: 1 },
    'Gunslinger':  { range: 2, inspect: 1 },
    'Black Mage':  { range: 1, inspect: 1 },
    'White Mage':  { range: 1, inspect: 1 },
    'Agent':       { range: 2, inspect: 2 },
    'Psychic':     { range: 2, inspect: 1 },
    'Harvester':   { range: 1, inspect: 1 },
    'Engineer':    { range: 1, inspect: 1 },
    'Harbinger':   { range: 1, inspect: 1 },
    'Freelancer':  { range: 1, inspect: 1 },
    'Raider':      { range: 1, inspect: 1 },
    'Sniper':      { range: 3, inspect: 2 },
    'Swordmaster': { range: 1, inspect: 1 }
};

/* ── JOB MODIFIERS (2026-08-14 rework) — secondary-job training ─────────
   Pokémon-nature-style: every job boosts EXACTLY two stats and cuts two
   stats of equal worth — never all-positive, never a ±1 rounding error.
   One grade = ±80 HP / ±40 MP / ±12 ATK / ±14 DEF / ±19 MDEF / ±12 INT /
   ±20 SPD / ±28 AWR (the 2026-08-29 stat rework rescaled DEF ×1.2,
   MDEF ×1.6, SPD ×10, AWR ×14 — same felt strength as the old
   ±12/±12/±2/±2: 12 ATK ≈ +8 dmg per basic attack, 40 MP = an extra
   ring-1 cast + change, 14 DEF ≈ 3 armor soak per hit, 28 AWR = +4% crit.
   NOTE the one real change the rework brings: ±20 SPD is exactly one
   letter band, so a SPD-modifying nature now also means ±1 movement tile
   — SPD *is* movement now).
   These apply ONLY through the secondary job (applySecondaryJob /
   computeSecJobBonuses, at FULL value) — the primary job is identity, not
   a modifier: its influence is baked into RACE_BASE_STATS. MOVE is never
   modified directly (it derives from SPD). Freelancer is the neutral nature.
   2026-07-18 note still applies: 'Warrior' is the offensive front-liner,
   'Tank' the wall; 'Agent' displays as "Assassin", 'Raider' as "Bruiser"
   (JOB_DISPLAY_NAMES). */
const JOB_MODIFIERS = {
    'Warrior':     { atk: 12, hp: 80,  mp: -40, int: -12 },
    'Tank':        { def: 14, hp: 80,  spd: -20, int: -12 },
    'Gunslinger':  { atk: 12, spd: 20,  def: -14, mp: -40 },
    'Black Mage':  { int: 12, mp: 40,  atk: -12, hp: -80 },
    'White Mage':  { mdef: 19, mp: 40, atk: -12, def: -14 },
    'Agent':       { spd: 20,  awr: 28,  hp: -80, def: -14 },
    'Psychic':     { int: 12, mdef: 19, atk: -12, def: -14 },
    'Harvester':   { hp: 80,  mp: 40,  spd: -20, awr: -28 },
    'Engineer':    { def: 14, mdef: 19, atk: -12, spd: -20 },
    'Harbinger':   { int: 12, spd: 20,  hp: -80, def: -14 },
    'Freelancer':  {},
    'Raider':      { atk: 12, hp: 80,  mdef: -19, awr: -28 },
    'Sniper':      { atk: 12, awr: 28,  hp: -80, mdef: -19 },
    'Swordmaster': { atk: 12, spd: 20,  int: -12, mdef: -19 }
};

/* ── SPD → MOVE (2026-08-29 stat rework, phase 3) ──────────────────────────
   Movement range is no longer a stored stat: one letter of SPD = one tile.
     SPD 1–20 (F) → 1 · 21–40 (C) → 2 · 41–60 (B) → 3 · 61–80 (A) → 4 ·
     81–100 (S) → 5.
   The old move-3 hard cap (2026-07-13: move 4+ crossed an 8×8 map in one
   turn) is replaced by a move-5 ceiling plus a halved SECOND move
   (ceil(move/2) tiles — see getMoveTiles in battle.js), so baseline A/S
   speedsters are allowed without restoring the map-crossing double-move. */
function moveFromSpd(spd) {
    return Math.max(1, Math.min(5, Math.ceil(Math.max(1, spd || 1) / 20)));
}

function computeUnitStats(race, cls) {
    const base = RACE_BASE_STATS[race] || RACE_BASE_STATS['homosapien'];
    const kit = JOB_KITS[cls] || JOB_KITS['Freelancer'];
    const spd = Math.max(1, Math.min(100, base.spd || 50));
    return {
        // Base stats are FINAL — the primary job is baked into
        // RACE_BASE_STATS (2026-08-14 rework); only the job's kit
        // (range/inspect) comes from the class.
        hp: base.hp,
        mp: base.mp,
        atk: base.atk,
        def: base.def,
        mdef: base.mdef || 0,
        // Derived, never stored: base tiles from the SPD band (rework 2026-08-29).
        move: moveFromSpd(spd),
        awr: Math.max(1, base.awr),
        int: base.int,
        spd,
        range: kit.range,
        inspect: kit.inspect
    };
}

function computeSecJobBonuses(secJobName) {
    const bonuses = { hp: 0, mp: 0, atk: 0, def: 0, mdef: 0, move: 0, awr: 0, int: 0, spd: 0 };
    if (!secJobName) return bonuses;
    const mods = JOB_MODIFIERS[secJobName];
    if (!mods) return bonuses;
    // FULL value since the 2026-08-14 rework — JOB_MODIFIERS is already the
    // nature-sized training shift (it used to be a primary-job stat delta
    // applied here at 25%, which rounded to meaningless ±1s).
    for (const k of ['hp', 'mp', 'atk', 'def', 'mdef', 'move', 'awr', 'int', 'spd']) {
        if (mods[k]) bonuses[k] = mods[k];
    }
    return bonuses;
}

function computeEquipBonuses(equipment) {
    const bonuses = { hp: 0, mp: 0, atk: 0, def: 0, mdef: 0, move: 0, awr: 0, int: 0, spd: 0 };
    if (!equipment) return bonuses;
    for (const slot of ['accessory1', 'accessory2']) {
        const itemId = equipment[slot];
        if (!itemId) continue;
        const def = EQUIP_DEFS[itemId];
        if (def && def.stat && def.statVal) {
            bonuses[def.stat] = (bonuses[def.stat] || 0) + def.statVal;
        }
    }
    return bonuses;
}

function formatEquipStat(itemId) {
    const def = EQUIP_DEFS[itemId];
    if (!def || !def.stat || !def.statVal) return '';
    return '+' + def.statVal + ' ' + def.stat.toUpperCase();
}

const CLASS_TEMPLATES = {
    Gunslinger: {
        cls: 'Gunslinger',
        job: 'Gunslinger',
        hp: 580,
        mp: 100,
        atk: 80,
        def: 40,
        mdef: 27,
        range: 2,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 30
    },
    Warrior: {
        cls: 'Warrior',
        job: 'Warrior',
        hp: 620,
        mp: 100,
        atk: 92,
        def: 45,
        mdef: 22,
        range: 1,
        move: 3,
        inspect: 1,
        awr: 2,
        int: 20
    },
    Tank: {
        cls: 'Tank',
        job: 'Tank',
        hp: 720,
        mp: 90,
        atk: 64,
        def: 65,
        mdef: 26,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 2,
        int: 18
    },
    'Black Mage': {
        cls: 'Black Mage',
        job: 'Black Mage',
        hp: 470,
        mp: 160,
        atk: 32,
        def: 25,
        mdef: 38,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 50
    },
    'White Mage': {
        cls: 'White Mage',
        job: 'White Mage',
        hp: 520,
        mp: 155,
        atk: 32,
        def: 35,
        mdef: 35,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 45
    },
    Agent: {
        cls: 'Agent',
        job: 'Agent',
        hp: 550,
        mp: 120,
        atk: 64,
        def: 35,
        mdef: 32,
        range: 2,
        move: 3,
        inspect: 2,
        awr: 5,
        int: 40
    },
    Psychic: {
        cls: 'Psychic',
        job: 'Psychic',
        hp: 470,
        mp: 170,
        atk: 24,
        def: 25,
        mdef: 40,
        range: 2,
        move: 2,
        inspect: 1,
        awr: 4,
        int: 55
    },
    Harvester: {
        cls: 'Harvester',
        job: 'Harvester',
        hp: 630,
        mp: 125,
        atk: 72,
        def: 45,
        mdef: 29,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 35
    },
    Engineer: {
        cls: 'Engineer',
        job: 'Engineer',
        hp: 600,
        mp: 115,
        atk: 56,
        def: 45,
        mdef: 29,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 35
    },
    Harbinger: {
        cls: 'Harbinger',
        job: 'Harbinger',
        hp: 550,
        mp: 145,
        atk: 48,
        def: 35,
        mdef: 35,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 4,
        int: 45
    },
    Freelancer: {
        cls: 'Freelancer',
        job: 'Freelancer',
        hp: 570,
        mp: 115,
        atk: 64,
        def: 40,
        mdef: 29,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 4,
        int: 35
    },
    Raider: {
        cls: 'Raider',
        job: 'Raider',
        hp: 610,
        mp: 110,
        atk: 80,
        def: 40,
        mdef: 24,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 3,
        int: 25
    },
    Sniper: {
        cls: 'Sniper',
        job: 'Sniper',
        hp: 500,
        mp: 105,
        atk: 72,
        def: 25,
        mdef: 27,
        range: 5,
        move: 2,
        inspect: 2,
        awr: 6,
        int: 30
    },
    Swordmaster: {
        cls: 'Swordmaster',
        job: 'Swordmaster',
        hp: 595,
        mp: 105,
        atk: 88,
        def: 42,
        mdef: 28,
        range: 1,
        move: 3,
        inspect: 1,
        awr: 4,
        int: 26
    },
};

let DEFAULT_BUILDS = {
    1: ['Gunslinger', 'Warrior', 'Black Mage', 'White Mage'],
    2: ['Gunslinger', 'Warrior', 'Agent', 'White Mage']
};

const DEFAULT_PARTY_NAMES = {
    1: ['P1 Gunslinger', 'P1 Knight', 'P1 Black Mage', 'P1 White Mage'],
    2: ['P2 Gunslinger', 'P2 Knight', 'P2 Assassin', 'P2 White Mage']
};

const ITEM_RULES = {
    healPotion: {
        name: 'Healing Potion',
        icon: '🧪',
        max: 6,
        // Level 100: potions heal a PERCENT of max HP so they stay useful as HP
        // scales from ~500 to ~15k. 30% ≈ the old ~96/~320 feel at low level.
        healPct: 0.30,
        desc: 'Target any living ally. Restores 30% of max HP.'
    },
    manaPotion: {
        name: 'Mana Potion',
        icon: '🔹',
        max: 6,
        mpPct: 0.35,
        desc: 'Target any living ally. Restores 35% of max MP.'
    },
    scanner: {
        name: 'Scanner',
        icon: '📡',
        max: 1,
        desc: 'Self only. Reveals hidden objects in a 3x3 area.'
    },
    humanBane: {
        name: 'Human Bane',
        icon: '🗡️',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_human_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Human types.',
        baneType: 'human',
        baneDmg: 120,
        baseDmg: 48
    },
    divineBane: {
        name: 'Divine Bane',
        icon: '🌑',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_divine_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Divine types.',
        baneType: 'divine',
        baneDmg: 120,
        baseDmg: 48
    },
    unholyBane: {
        name: 'Unholy Bane',
        icon: '✝️',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_unholy_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Unholy types.',
        baneType: 'unholy',
        baneDmg: 120,
        baseDmg: 48
    },
    techBane: {
        name: 'Tech Bane',
        icon: '⚡',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_tech_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Tech types.',
        baneType: 'tech',
        baneDmg: 120,
        baseDmg: 48
    },
    anomalyBane: {
        name: 'Anomaly Bane',
        icon: '🔮',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_anomaly_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Anomaly types.',
        baneType: 'anomaly',
        baneDmg: 120,
        baseDmg: 48
    },
    alienBane: {
        name: 'Alien Bane',
        icon: '☄️',
        sprite: 'https://cdn.entropywars.net/Assets/Sprites/projectiles/proj_alien_bane.png',
        max: 3,
        desc: 'Throw at an enemy. Deals 120 bonus damage to Alien types.',
        baneType: 'alien',
        baneDmg: 120,
        baseDmg: 48
    },
    panacea: {
        name: 'Panacea',
        icon: '💊',
        max: 1,
        desc: 'Self only. Cures all negative status effects.',
        shopPrice: 60
    },
    warpStone: {
        name: 'Warp Stone',
        icon: '🌀',
        max: 1,
        desc: 'Teleport to any tile within 3 range. Ignores terrain.',
        shopPrice: 75
    },
    entropyGrenade: {
        name: 'Entropy Grenade',
        icon: '💣',
        max: 2,
        desc: 'Throw at an enemy. 60 magic damage, plus 36 splash damage to every other unit — friend or foe — in the 3x3 blast.',
        // Rides the bane throw pipeline (targeting, range, AI). baneType 'none'
        // never matches a unit type, so it is always neutral damage.
        baneType: 'none',
        baneDmg: 0,
        baseDmg: 60,
        aoeDmg: 36,
        aoeRadius: 1,
        proj: 'proj-grenade',
        shopPrice: 70
    },
    adrenalStim: {
        name: 'Adrenal Stim',
        icon: '💉',
        max: 2,
        desc: 'Self only. +2 ATK stages for 3 rounds.',
        selfBoost: { atk: 2 },
        shopPrice: 55
    },
    bulwarkStim: {
        name: 'Bulwark Stim',
        icon: '🧱',
        max: 2,
        desc: 'Self only. +2 DEF and +2 M DEF stages for 3 rounds.',
        selfBoost: { def: 2, mdef: 2 },
        shopPrice: 55
    },
    psiStim: {
        name: 'Psi Stim',
        icon: '🧠',
        max: 2,
        desc: 'Self only. +2 M ATK stages for 3 rounds.',
        selfBoost: { int: 2 },
        shopPrice: 55
    }
};

const ITEM_META = {
    healPotion: {
        icon: '🧪',
        short: 'HP'
    },
    manaPotion: {
        icon: '🔹',
        short: 'MP'
    },
    scanner: {
        icon: '📡',
        short: 'AWR'
    },
    humanBane: {
        icon: '🗡️',
        short: 'H-Bane'
    },
    divineBane: {
        icon: '🌑',
        short: 'D-Bane'
    },
    unholyBane: {
        icon: '✝️',
        short: 'U-Bane'
    },
    techBane: {
        icon: '⚡',
        short: 'T-Bane'
    },
    anomalyBane: {
        icon: '🔮',
        short: 'A-Bane'
    },
    alienBane: {
        icon: '☄️',
        short: 'X-Bane'
    },
    panacea: {
        icon: '💊',
        short: 'PAN'
    },
    warpStone: {
        icon: '🌀',
        short: 'WARP'
    },
    entropyGrenade: {
        icon: '💣',
        short: 'NADE'
    },
    adrenalStim: {
        icon: '💉',
        short: 'ATK+'
    },
    bulwarkStim: {
        icon: '🧱',
        short: 'DEF+'
    },
    psiStim: {
        icon: '🧠',
        short: 'MATK+'
    }
};

// ── Job passives ──────────────────────────────────────────────────────────
// Innate, always-on identity abilities that shape each primary job's playstyle.
// These are SEPARATE from the flat stat deltas in JOB_MODIFIERS — a passive is a
// rule, not a number. This registry is the single source of truth for the name +
// description surfaced in the party builder and unit panels; the mechanics for
// the focus jobs are wired in battle.js (Harvester) and map.js (Freelancer).
// `id` lets combat code branch on a passive without matching text.
// 2026-08-15: Sniper's "Bullet Drop" passive was REMOVED — the range curve is
// now the same universal close-range falloff for every job (battle.js
// calcRangeMult), so Snipers no longer invert it. Sniper has no job passive.
const JOB_PASSIVES = {
    Gunslinger:  { id: 'deadeye',        name: 'Deadeye',         desc: '+1 SPD. Always ready to draw first.' },
    Warrior:     { id: 'warpath',        name: 'Warpath',         desc: 'Basic attacks hit +15% harder, and the Warrior counterattacks at a hardened 30% rate. Born for the front line.' },
    Tank:        { id: 'bulwark',        name: 'Bulwark',         desc: 'Reduces incoming damage by 8. Fortify shields cap at 25% max HP.' },
    'Black Mage':{ id: 'arcaneSurge',    name: 'Arcane Surge',    desc: '+8 spell damage on every cast.' },
    'White Mage':{ id: 'grace',          name: 'Grace',           desc: 'Heal and revive spells gain +2 range and +24 healing power.' },
    Agent:       { id: 'fieldOperative', name: 'Field Operative', desc: 'Can equip up to 2 scanners and has longer inspect reach.' },
    Psychic:     { id: 'thirdEye',       name: 'Third Eye',       desc: 'Debuff statuses this unit applies last +1 turn. Teleport costs 1 less MP.' },
    Harvester:   { id: 'greenThumb',     name: 'Green Thumb',     desc: 'Trees grown from this unit\'s seeds buff its ATK & spell power (+7 each, up to 6 living trees) and fuel Trunk Throw (+30 damage each). Life Sap heals 20% more. Enemies can chop or burn the forest to shut it down.' },
    Engineer:    { id: 'tinker',         name: 'Tinker',          desc: 'Turrets have +1 range and Repair heals 20% more.' },
    Harbinger:   { id: 'crescendo',      name: 'Crescendo',       desc: "This unit's buffs last +1 turn. Lullaby has +1 range." },
    Freelancer:  { id: 'adaptable',      name: 'Adaptable',       desc: 'No school restrictions — can learn and equip spells from ANY job pool. A blank slate that borrows every playstyle.' },
    Raider:      { id: 'bruteForce',     name: 'Brute Force',     desc: 'Basic attacks deal +20% damage. Gains +8 DEF while below 50% HP.' },
    Swordmaster: { id: 'riposte',        name: 'Riposte',         desc: '35% chance to counterattack when struck in melee, and counters swing at full sword strength (60% ATK instead of 40%).' },
};
// Back-compat: some older lookups expect a flat "Name: desc" string map.
const CLASS_PASSIVES = Object.fromEntries(
    Object.entries(JOB_PASSIVES).map(([job, p]) => [job, `${p.name}: ${p.desc}`])
);
function getJobPassive(job) { return JOB_PASSIVES[job] || null; }

const JOB_DISPLAY_NAMES = {
    // Display-only renames (2026-07-13). Internal ids ('Agent', 'Raider') are
    // load-bearing — saves, the online protocol, AI role tables and battle.js
    // cls checks all key on them — so renames happen HERE, the same way
    // Raider→Bruiser did. Everything player-facing routes through
    // getJobDisplayName().
    // 2026-07-18: the 'Warrior'→"Tank" display rename is GONE — Warrior and
    // Tank are two real jobs now.
    'Raider': 'Bruiser',
    'Agent': 'Assassin'
};
function getJobDisplayName(job) { return JOB_DISPLAY_NAMES[job] || job; }

function getRaceLabel(race, gender) {
    const p = RACE_PROFILES[race];
    if (!p) return race || '?';
    if (gender === 'female' && p.labelFemale) return p.labelFemale;
    if (gender === 'male' && p.labelMale) return p.labelMale;
    return p.label || race;
}

/* ── Spell `element` tags ─────────────────────────────────────────────────
   Optional field on any spell: element: 'fire'|'ice'|'lightning'|'water'|
   'earth'|'wind'|'poison'|'nature'|'shadow'|'light'|'psychic'|'sonic'|
   'arcane'|'blood'|'metal'  (canonical list: SPELL_ELEMENTS, near TYPE_CHART).
   Since 2026-09-01 the six COMBAT_ELEMENTS (fire/ice/lightning/water/poison/
   earth) are a real combat layer: damage of those elements consults
   RACE_ELEMENT_AFFINITY (weak ×1.5 / resist ×0.5 / immune / absorb),
   water-element damage Soaks the target, and elemental statuses couple to
   affinities — see the ELEMENTAL AFFINITIES block + ELEMENTAL_TYPES_PLAN.md.
   The other nine tags stay flavor-only (VFX theming via _resolveTheme, SFX,
   library filters) and are elementally neutral — as is every untagged spell.
   The element layer is SECONDARY: the type chart + STAB always apply on top.
   The tag is authoritative for battle.js getSpellElement — the legacy
   name-keyword sweep only guesses for UNTAGGED spells now (a tag can no
   longer be overridden by an unlucky name like Radiant "Bolt").
   RULE for new content: every new DAMAGE spell either carries an element:
   tag or a deliberate `// element: none` note. A combat-element spell that
   applies a status should apply its paired one (fire→burn, ice→frozen,
   poison→poison, lightning→stun; water soaks automatically). */
const SPELL_LIBRARY = [

    {
        id: 'fortify',
        spellType: 'divine',
        name: 'Fortify',
        type: 'buff',
        cost: 25,
        equipCost: 15,
        apCost: 1,
        range: 2,
        kind: 'shield',
        tier: 'I',
        school: 'Tank',
        classRestriction: 'Tank',
        jobPreference: ['Tank'],
        shield: 96,
        shieldCapPct: 0.25,
        desc: 'Grants a damage-absorbing shield to a Single Ally.'
    },
    {
        /* 2026-07-18 Warrior/Tank split: the Tank raises real fortifications.
           2026-08-03: THE canonical Rampart — the duplicate SHARED_RAMPART
           race ability was merged into this one (races borrow it by id via
           the movepool-share table below; legacy id 'sharedRampart' aliases
           here). Spell display names must be unique: parts of the UI resolve
           the selected spell by name. */
        id: 'rampart',
        spellType: 'human',
        element: 'earth',
        name: 'Rampart',
        type: 'utility',
        cost: 30,
        equipCost: 15,
        apCost: 1,
        range: 3,
        kind: 'terrainCreate',
        terrainType: 'mountain',
        tileCount: 3,
        orientable: true,
        dmg: 60,
        damageType: 'physical',
        terrainDeform: { centerDelta: 2, edgeDelta: 0 },
        /* Tank capstone (ring 4 = tier III, spell-tree redesign). */
        tier: 'III',
        school: 'Tank',
        classRestriction: 'Tank',
        jobPreference: ['Tank'],
        desc: 'Raise a 3-tile wall of impassable mountain terrain. Enemies on targeted tiles take damage and are pushed aside. Hold the line — build the line.'
    },
    /* (mark1 / Suppressing Fire was CUT 2026-07-26 via the Spell Library.) */
    {
        id: 'heal1',
        spellType: 'divine',
        element: 'light',
        name: 'Heal',
        type: 'heal',
        cost: 25,
        equipCost: 20,
        apCost: 1,
        heal: 192,
        range: 3,
        kind: 'heal',
        tier: 'I',
        school: 'White Mage',
        classRestriction: 'White Mage',
        jobPreference: ['White Mage'],
        lowHpBonus: 48,
        desc: 'Restores a LARGE amount of HP to a Single Ally. Heals more on allies below 40% HP.'
    },
    {
        id: 'fire1',
        spellType: 'unholy',
        element: 'fire',
        name: 'Fireball',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 80,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        jobPreference: ['Black Mage'],
        projectileOverride: 'proj-fire',
        /* 2026-08-09 balance pass: weak poke, no Burn — Wall of Fire is the
           kit's Burn setup now. */
        statusEffects: [],
        desc: 'Deals WEAK magic damage to a Single Enemy.'
    },

    {
        id: 'guardSlash',
        spellType: 'human',
        name: 'Brave Charge',
        type: 'damage',
        cost: 20,
        equipCost: 15,
        dmg: 100,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Warrior',
        classRestriction: 'Warrior',
        jobPreference: ['Warrior'],
        chargeToTarget: true,
        statusEffects: [],
        desc: 'Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.'
    },
    {
        /* 2026-07-18: renamed Phalanx → Iron Dome (Warrior/Tank split). */
        id: 'shieldBash',
        spellType: 'human',
        name: 'Iron Dome',
        type: 'buff',
        cost: 45,
        equipCost: 15,
        apCost: 1,
        heal: 0,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'Tank',
        classRestriction: 'Tank',
        jobPreference: ['Tank'],
        statStageBoost: { def: 1 },
        desc: 'Empowers All Allies. Raises DEF by 1 stage.'
    },
    {
        /* 2026-07-18: moved from the old Warrior/Tank kit to Swordmaster —
           the armor-cleaving greatslash belongs with the duelists. */
        id: 'dragonSlash',
        spellType: 'unholy',
        name: 'Dragon Slash',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 180,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        ignoreArmor: true,
        /* Swordmaster capstone — already had capstone stats at tier II; the
           III tag makes the label honest (spell-tree audit). */
        tier: 'III',
        school: 'Swordmaster',
        classRestriction: 'Swordmaster',
        jobPreference: ['Swordmaster'],
        bonusVsStatus: { status: 'burn', mult: 1.5 },
        desc: 'Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to targets with Burn.'
    },

    {
        id: 'radiantBolt',
        spellType: 'divine',
        element: 'light',
        name: 'Radiant Bolt',
        type: 'damage',
        cost: 25,
        equipCost: 12,
        dmg: 100,
        range: 4,
        kind: 'damage',
        damageType: 'magic',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        jobPreference: ['White Mage'],
        unholyBonus: 40,
        desc: 'Deals MEDIUM magic damage to a Single Enemy.'
    },
    {
        id: 'revive1',
        spellType: 'divine',
        element: 'light',
        name: 'Revive',
        type: 'heal',
        cost: 25,
        equipCost: 15,
        range: 4,
        kind: 'revive',
        /* White Mage capstone (ring 4 = tier III) — the classic white ultimate. */
        tier: 'III',
        school: 'White Mage',
        classRestriction: 'White Mage',
        revivePct: 0.45,
        oneRevivePerUnitPerMatch: true,
        desc: 'Revives a fallen ally. Works once per unit per match.'
    },
    {
        id: 'protect1',
        spellType: 'divine',
        element: 'light',
        name: 'Protect',
        type: 'buff',
        cost: 30,
        equipCost: 10,
        apCost: 1,
        cooldownRounds: 3,
        range: 3,
        kind: 'buff',
        tier: 'I',
        school: 'White Mage',
        classRestriction: 'White Mage',
        statusEffects: [{
            id: 'protect',
            duration: 1
        }],
        desc: 'Empowers a Single Ally. Applies Protect. Cooldown: 3 rounds.'
    },
    {
        id: 'healAll',
        spellType: 'divine',
        element: 'light',
        name: 'Heal All',
        type: 'heal',
        cost: 60,
        equipCost: 20,
        heal: 140,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        desc: 'Restores a MEDIUM amount of HP to All Allies.'
    },

    {
        id: 'thunder1',
        spellType: 'anomaly',
        element: 'lightning',
        name: 'Thunderbolt',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 130,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        chainProfile: [125, 82, 50],
        chainRadius: 1,
        desc: 'Deals MEDIUM magic damage to a Single Enemy.'
    },
    {
        id: 'thunderstorm',
        spellType: 'anomaly',
        element: 'lightning',
        name: 'Summon Thunderstorm',
        type: 'utility',
        cost: 30,
        equipCost: 15,
        range: 4,
        kind: 'summonWeather',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        weatherType: 'thunderstorm',
        weatherDuration: [3, 5],
        weatherTiles: [3, 5],
        desc: 'Summons thunderstorm weather over the battlefield.'
    },
    {
        id: 'wallOfFire',
        spellType: 'unholy',
        element: 'fire',
        name: 'Wall of Fire',
        type: 'damage',
        cost: 35,
        equipCost: 20,
        dmg: 80,
        range: 3,
        kind: 'terrainCreate',
        terrainType: 'scorched',
        tileCount: 3,
        orientable: true,
        burningRounds: 3,
        damageType: 'magic',
        tier: 'II',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        projectileOverride: 'proj-fire',
        statusEffects: [{
            id: 'burn',
            duration: 2
        }],
        desc: 'Conjure a 3-tile wall of flame in a line (horizontal or vertical). Damages enemies caught, burns them for 2 turns — and the wall KEEPS BURNING for 3 rounds: it scorches anyone standing in or crossing it, and the fire can spread through grass and trees.'
    },

    {
        id: 'doubleShot',
        spellType: 'tech',
        element: 'metal',
        name: 'Double Pump',
        type: 'damage',
        cost: 25,
        equipCost: 10,
        range: 3,
        kind: 'multiHit',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'I',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        hitDamages: [60, 60],
        markedSecondHitBonus: 3,
        desc: 'Deals MEDIUM physical damage to a Single Enemy across 2 hits. Hits harder on Marked targets.'
    },
    {
        id: 'ricochet1',
        spellType: 'anomaly',
        element: 'metal',
        name: 'Ricochet',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 100,
        range: 3,
        kind: 'ricochet',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'I',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        bounceDamage: 8,
        bounceRadius: 2,
        bounceShieldIgnore: 2,
        desc: 'Deals MEDIUM physical damage to a Single Enemy, then bounces to nearby enemies.'
    },
    {
        /* NEW 2026-07-17: Gunslinger's replacement for Pistol Whip — the
           duelist surrounded in the saloon. First X-shaped (diagonal cross)
           footprint in the class kits. */
        id: 'crossfire',
        spellType: 'human',
        element: 'metal',
        name: 'Crossfire',
        type: 'damage',
        cost: 30,
        equipCost: 16,
        dmg: 125,
        range: 0,
        kind: 'cross',
        diagonal: true,
        crossRadius: 2,
        aoeOriginSelf: true,
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'II',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        jobPreference: ['Gunslinger'],
        desc: 'Deals MEDIUM physical damage to All Enemies in an X-shaped AOE.'
    },

    {
        id: 'placeBomb',
        spellType: 'tech',
        element: 'fire',
        name: 'Place Bomb',
        type: 'buff',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        dmg: 130,
        range: 2,
        kind: 'bomb',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        maxActivePerCaster: 3,
        blastRadius: 1,
        desc: 'Places a bomb. Detonate it to deal MEDIUM magic damage in an AOE.'
    },

    {
        id: 'healingSeed',
        spellType: 'divine',
        element: 'nature',
        name: 'Healing Seed',
        type: 'utility',
        cost: 10,
        equipCost: 15,
        apCost: 1,
        range: 3,
        kind: 'seedHeal',
        tier: 'I',
        school: 'Harvester',
        classRestriction: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Plants a seed that heals nearby allies each turn.'
    },

    {
        id: 'poisonSeed',
        spellType: 'unholy',
        element: 'poison',
        name: 'Poison Seed',
        type: 'utility',
        cost: 20,
        equipCost: 15,
        apCost: 1,
        range: 3,
        kind: 'seedPoison',
        tier: 'I',
        school: 'Harvester',
        classRestriction: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Plants a seed that poisons nearby enemies each turn.'
    },

    {
        id: 'teleport',
        spellType: 'alien',
        element: 'arcane',
        name: 'Teleport',
        type: 'utility',
        cost: 25,
        equipCost: 15,
        range: 4,
        kind: 'teleport',
        teleportAnyUnit: true,
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        desc: 'Warp any unit — self, ally, or enemy — to any unoccupied tile within range. Costs 1 less MP for Psychics.'
    },
    /* (warpRune was CUT 2026-07-26 via the Spell Library; the kind:'warpRune'
       engine branch stays for anything that recreates one.) */
    {
        id: 'psychosis',
        spellType: 'alien',
        element: 'psychic',
        name: 'Psychosis',
        type: 'debuff',
        cost: 20,
        equipCost: 15,
        range: 4,
        kind: 'debuff',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        statStageBoost: { mdef: -2 },
        desc: 'Weakens a Single Enemy. Lowers M DEF by 2 stages.'
    },

    {
        id: 'lifeDrain',
        spellType: 'unholy',
        element: 'shadow',
        name: 'Life Sap',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 135,
        range: 3,
        kind: 'lifeDrain',
        /* Harvester ring-3 payoff (tier II): Poison Seed sets up, this cashes in. */
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        drainPct: 0.70,
        bonusVsStatus: { status: 'poison', mult: 1.5 },
        desc: 'Deals MEDIUM magic damage to a Single Enemy. Heals the caster for part of the damage dealt. Deals bonus damage to targets with Poison.'
    },
    {
        id: 'leechSeed',
        spellType: 'unholy',
        element: 'nature',
        name: 'Leech Seed',
        type: 'utility',
        cost: 35,
        equipCost: 20,
        range: 3,
        kind: 'leechSeed',
        /* Harvester capstone (ring 4 = tier III). */
        tier: 'III',
        school: 'Harvester',
        classRestriction: 'Harvester',
        desc: 'Plants a seed on a Single Enemy: drains HP each turn and heals the caster.'
    },
    {
        id: 'trunkThrow',
        spellType: 'anomaly',
        element: 'nature',
        name: 'Trunk Throw',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 100,
        range: 4,
        kind: 'damage',
        damageType: 'physical',
        treeScale: true,
        treePerTree: 30,
        treeCap: 180,
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Deals MEDIUM physical damage to a Single Enemy.'
    },

    {
        id: 'knifeThrow',
        spellType: 'human',
        element: 'metal',
        name: 'Knife Throw',
        type: 'damage',
        cost: 15,
        equipCost: 10,
        dmg: 100,
        range: 4,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-knife',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        equipReq: 'knife',
        statusEffects: [{
            id: 'marked',
            duration: 1,
            bonusDamage: 24
        }],
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Marked.'
    },
    {
        id: 'sneakSlash',
        spellType: 'human',
        name: 'Sneak Slash',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 160,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-knife',
        tier: 'III',
        school: 'Agent',
        classRestriction: 'Agent',
        equipReq: 'knife',
        sneakBonus: true,
        bonusVsStatus: { status: 'poison', mult: 1.5 },
        desc: 'Deals HEAVY physical damage to a Single Enemy. Deals bonus damage while invisible. Deals bonus damage to Poisoned targets.'
    },


    {
        id: 'deployTurret',
        spellType: 'tech',
        name: 'Deploy Turret',
        type: 'utility',
        cost: 35,
        equipCost: 15,
        apCost: 1,
        range: 2,
        kind: 'deployTurret',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        maxActivePerCaster: 2,
        turretHp: 60,
        turretDmg: 110,
        turretRange: 3,
        desc: 'Deploy a turret on an empty tile (1 AP). It paints the nearest enemy within 3 tiles with a targeting laser — the shot lands at the end of the round for 110 damage. Max 2 per Engineer. Enemies can destroy turrets.'
    },
    {
        id: 'overclock',
        spellType: 'tech',
        element: 'lightning',
        name: 'Overclock',
        type: 'buff',
        cost: 40,
        equipCost: 20,
        range: 3,
        kind: 'buff',
        /* Was the cyborg race capstone after the tree audit; demoted in the
           2026-08-12 capstone pass (Rocket Toss is the capstone now) — sits
           at cyborg ring 3 / robot ring 2, so tier II. */
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statusEffects: [{
            id: 'overclock',
            duration: 2
        }],
        desc: 'Empowers a Single Ally. Raises ATK by 1 stage and MOV by 1.'
    },
    {
        id: 'railgun',
        spellType: 'tech',
        element: 'metal',
        name: 'Railgun',
        type: 'damage',
        cost: 55,
        equipCost: 25,
        dmg: 160,
        range: 5,
        kind: 'line',
        damageType: 'physical',
        lineWidth: 1,
        ignoreArmor: true,
        tier: 'III',
        school: 'Engineer',
        classRestriction: 'Engineer',
        bonusVsStatus: { status: 'jammed', mult: 1.5 },
        desc: 'Deals HEAVY physical damage to All Enemies in a line. Ignores DEF. Deals bonus damage to Jammed targets.'
    },
    /* freeEnergy moved to the Mad Scientist RACE kit (2026-07-23) — only he
       cracked zero-point energy. See RACE_ABILITIES['mad scientist']. */

    {
        id: 'warCry',
        spellType: 'human',
        element: 'sonic',
        name: 'War Cry',
        type: 'buff',
        cost: 30,
        equipCost: 15,
        apCost: 1,
        range: 0,
        kind: 'warCry',
        tier: 'I',
        school: 'Warrior',
        classRestriction: 'Warrior',
        jobPreference: ['Warrior'],
        auraRadius: 3,
        desc: 'Rally all allies within 3 tiles: +2 ATK stages each. The Warrior himself gains +1 ATK stage.'
    },
    {
        /* NEW 2026-07-17: the Tank finally tanks. Taunt is enforced by the
           engine (doAttack/doSpell gates + AI target priority): a provoked
           enemy can only aim single-target attacks and spells at the caster
           while the caster is reachable. */
        id: 'provoke',
        spellType: 'human',
        element: 'sonic',
        name: 'Provoke',
        type: 'debuff',
        cost: 20,
        equipCost: 12,
        range: 3,
        kind: 'debuff',
        tier: 'I',
        school: 'Tank',
        classRestriction: 'Tank',
        jobPreference: ['Tank'],
        statusEffects: [{
            id: 'taunt',
            duration: 2
        }],
        desc: 'Weakens a Single Enemy. Applies Provoked.'
    },
    {
        id: 'discordance',
        spellType: 'anomaly',
        element: 'sonic',
        name: 'Discordance',
        type: 'debuff',
        cost: 25,
        equipCost: 15,
        range: 3,
        kind: 'debuff',
        tier: 'I',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statusEffects: [{
            id: 'discord',
            duration: 2
        }],
        desc: 'Sows dissonance in a Single Enemy: lowers ATK by 2 stages and DEF by 1 stage for 2 turns.'
    },
    {
        id: 'encore',
        spellType: 'anomaly',
        element: 'sonic',
        name: 'Encore',
        type: 'buff',
        cost: 50,
        equipCost: 20,
        range: 3,
        kind: 'encore',
        /* Harbinger ring-2 tool since 2026-08-16 (swapped with Lullaby). */
        tier: 'I',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        desc: 'Grant a friendly unit that already acted this turn 1 bonus AP, letting them take one more action. Each unit can only receive Encore once per round.'
    },
    {
        id: 'lullaby',
        spellType: 'anomaly',
        element: 'sonic',
        name: 'Lullaby',
        type: 'damage',
        cost: 75,
        equipCost: 15,
        dmg: 130,
        range: 4,
        kind: 'damage',
        damageType: 'magic',
        /* Harbinger ring-3 payoff since 2026-08-16 (was ring 2 — stats18
           showed it as the game's most-cast spell at 50 MP): the Slow that
           feeds Cross Slash now costs a real 75 MP. */
        tier: 'II',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statusEffects: [{
            id: 'slow',
            duration: 2
        }],
        desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Slow.'
    },

    {
        id: 'haymaker',
        spellType: 'human',
        name: 'Haymaker',
        type: 'damage',
        cost: 25,
        equipCost: 10,
        dmg: 100,
        range: 1,
        kind: 'displacement',
        damageType: 'physical',
        displaceDistance: 2,
        collisionBonus: 40,
        tier: 'I',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        statusEffects: [],
        /* Retuned vs-Stagger → vs-Rooted (SPELL_TREE_REDESIGN §2.2): can't
           slip a haymaker while rooted — Iron Grip sets it up in-kit.
           (2026-08-10: fixed the status id — it's 'root', not 'rooted';
           the bonus never fired before.) */
        bonusVsStatus: { status: 'root', mult: 1.5 },
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Shoves the target sideways. Deals bonus damage to targets with Rooted.'
    },
    {
        id: 'groundSlam',
        spellType: 'human',
        element: 'earth',
        name: 'Ground Slam',
        type: 'damage',
        cost: 35,
        equipCost: 15,
        dmg: 125,
        range: 0,
        aoeRadius: 1,
        kind: 'aoe',
        damageType: 'physical',
        tier: 'II',
        /* 2026-07-18: moved Raider → Warrior (Warrior/Tank split). */
        school: 'Warrior',
        classRestriction: 'Warrior',
        jobPreference: ['Warrior'],
        selfCenter: true,
        terrainDeform: { centerDelta: -1, edgeDelta: 0 },
        statusEffects: [{ id: 'slow', duration: 2 }],
        desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Applies Slow.'
    },
    {
        id: 'ironGrip',
        spellType: 'human',
        name: 'Iron Grip',
        type: 'debuff',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        range: 1,
        kind: 'debuff',
        tier: 'I',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        groundsFlyers: true,
        statusEffects: [{ id: 'root', duration: 2 }],
        desc: 'Weakens a Single Enemy. Applies Rooted.'
    },
    {
        id: 'rampage',
        spellType: 'human',
        name: 'Rampage',
        type: 'damage',
        cost: 40,
        equipCost: 20,
        dmg: 160,
        range: 4,
        kind: 'dash',
        damageType: 'physical',
        tier: 'III',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        dashDamage: 64,
        desc: 'Charges at a Single Enemy, dealing HEAVY physical damage. Enemies along the path also take damage.'
    },
    {
        id: 'skullCrack',
        spellType: 'unholy',
        name: 'Skull Crack',
        type: 'damage',
        cost: 26,
        equipCost: 15,
        dmg: 125,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'II',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        statusEffects: [{ id: 'silence', duration: 1 }],
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Silence.'
    },

    {
        id: 'precisionShot',
        spellType: 'tech',
        element: 'metal',
        name: 'Precision Shot',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 125,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        actedTargetBonus: 32,
        tier: 'II',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        bonusVsStatus: { status: 'root', mult: 1.5 },
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Rooted.'
    },
    {
        id: 'headshot',
        spellType: 'tech',
        element: 'metal',
        name: 'Take Aim',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 180,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        ignoreArmor: true,
        delayedMark: true,
        markDelayRounds: 1,
        requireVision: true,
        tier: 'III',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        bonusVsStatus: { status: 'stun', mult: 1.5 },
        desc: 'Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to targets with Stun. Marks the target: the hit lands at the end of the round, but only while your team can still see them.'
    },
    {
        id: 'camouflage',
        spellType: 'human',
        element: 'nature',
        name: 'Camouflage',
        type: 'buff',
        cost: 20,
        equipCost: 10,
        range: 0,
        kind: 'buff',
        /* Sniper ring-2 tool (tier I): repositioning stealth. */
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{
            id: 'invisible',
            duration: 1
        }],
        desc: 'Empowers the caster. Applies Invisible. Cooldown: 2 rounds.'
    },

    {
        id: 'jackOfAll',
        spellType: 'human',
        name: 'Pep Talk',
        type: 'buff',
        cost: 25,
        equipCost: 15,
        apCost: 1,
        range: 0,
        kind: 'buff',
        tier: 'I',
        school: 'Freelancer',
        classRestriction: 'Freelancer',
        jobPreference: ['Freelancer'],
        statusEffects: [{
            id: 'jackOfAll',
            duration: 3
        }],
        desc: 'Psyches the caster up: raises ATK, DEF, M.ATK and M.DEF by 1 stage each, plus MOV and RNG by 1, for 3 turns.'
    },
    {
        id: 'improvise',
        spellType: 'human',
        name: 'Improvise',
        type: 'damage',
        cost: 20,
        equipCost: 10,
        dmg: 80,
        range: 2,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Freelancer',
        classRestriction: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'Deals WEAK physical damage to a Single Enemy.'
    },
    {
        id: 'reallyGoodPunch',
        spellType: 'human',
        name: 'A Really Good Punch',
        type: 'damage',
        cost: 15,
        equipCost: 10,
        dmg: 180,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'III',
        school: 'Freelancer',
        classRestriction: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'Deals HEAVY physical damage to a Single Enemy.'
    },

    {
        /* 2026-07-17 shape pass: was a 3×3 like every other slam. Now a
           literal CROSS of light — 3 tiles down each cardinal arm — so the
           Warrior ult reads on the board like nothing else in the game. */
        id: 'judgment',
        spellType: 'divine',
        element: 'light',
        name: 'Judgment',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 160,
        range: 1,
        kind: 'cross',
        crossRadius: 3,
        damageType: 'physical',
        tier: 'III',
        school: 'Warrior',
        classRestriction: 'Warrior',
        /* 2026-08-09 balance pass: HEAVY, Stun rider removed — raw damage is
           the capstone's whole budget now. */
        statusEffects: [],
        bonusVsStatus: { status: 'slow', mult: 1.5 },
        desc: 'Deals HEAVY physical damage to All Enemies in a cross-shaped AOE. Cooldown: 2 rounds. Deals bonus damage to Slowed targets.'
    },

    {
        id: 'deadEye',
        spellType: 'tech',
        element: 'metal',
        name: 'Dead Eye',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 180,
        range: 4,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'III',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        guaranteedCrit: true,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 40
        }],
        desc: 'Deals HEAVY physical damage to a Single Enemy. Applies Marked. Always lands a critical hit.'
    },

    {
        /* 2026-08-09 balance pass: back to a tight 3×3 (the 5×5 round blast
           covered a quarter of a medium map), typed ALIEN — meteors come from
           space — and it now slams flyers out of the sky (groundsFlyers). */
        id: 'meteor',
        spellType: 'alien',
        element: 'fire',
        name: 'Meteor',
        type: 'damage',
        cost: 80,
        equipCost: 25,
        dmg: 160,
        range: 4,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        aoeRadius: 1,
        groundsFlyers: true,
        leaveTerrain: 'scorched',
        projectileOverride: 'proj-fire',
        statusEffects: [{
            id: 'burn',
            duration: 3
        }],
        terrainDeform: { centerDelta: -2, edgeDelta: -1 },
        demolishesBuildings: true,
        bonusVsStatus: { status: 'burn', mult: 1.5 },
        desc: 'Deals HEAVY magic damage to All Enemies in a 3×3 AOE. Applies Burn. Knocks flying targets out of the sky. Destroys buildings. Leaves scorched tiles behind. Reshapes the ground on impact. Cooldown: 2 rounds. Deals bonus damage to Burning targets.'
    },


    {
        id: 'empBurst',
        spellType: 'tech',
        element: 'lightning',
        name: 'EMP Burst',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        /* android/droid race capstone — heavy band since the 2026-08-12
           capstone pass (robot's capstone is Kill Mode now). */
        dmg: 160,
        range: 0,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        // 2026-07-13: moved out of the shared Assassin pool (a vampire with an
        // EMP made no sense) — now Engineer school + a racial for tech races.
        school: 'Engineer',
        classRestriction: 'Engineer',
        aoeRadius: 2,
        aoeOriginSelf: true,
        statusEffects: [{
            id: 'jammed',
            duration: 1
        }],
        desc: 'Deals HEAVY magic damage to All Enemies around the caster (AOE). Applies Jammed.'
    },

    {
        id: 'mindShatter',
        spellType: 'alien',
        element: 'psychic',
        name: 'Mind Shatter',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 180,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'III',
        school: 'Psychic',
        classRestriction: 'Psychic',
        statusEffects: [{
            id: 'silence',
            duration: 1
        }],
        bonusVsStatus: { status: 'silence', mult: 1.5 },
        desc: 'Deals HEAVY magic damage to a Single Enemy. Applies Silence. Deals bonus damage to targets with Silence.'
    },

    {
        id: 'fiveGTower',
        spellType: 'tech',
        element: 'lightning',
        name: '5G Tower',
        type: 'utility',
        cost: 45,
        equipCost: 20,
        range: 2,
        kind: 'deployTurret',
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        maxActivePerCaster: 1,
        turretHp: 3,
        hitsToKill: 3,
        turretDmg: 0,
        turretRange: 4,
        auraDebuff: true,
        auraDefReduction: 8,
        desc: 'Deploy a 5G radio tower (3 hits to destroy). Its signal scrambles thought — enemies within 4 tiles lose 8 M DEF while it stands. Max 1 per Engineer.'
    },
    {
        id: 'repair',
        spellType: 'tech',
        element: 'metal',
        name: 'Repair',
        type: 'heal',
        cost: 25,
        equipCost: 15,
        apCost: 1,
        heal: 155,
        range: 2,
        kind: 'heal',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        jobPreference: ['Engineer'],
        desc: 'Restores a MEDIUM amount of HP to a Single Ally.'
    },

    {
        id: 'requiem',
        spellType: 'unholy',
        element: 'sonic',
        name: 'Requiem',
        type: 'damage',
        cost: 100,
        equipCost: 25,
        dmg: 160,
        /* 2026-08-16 (stats18 whiff audit): normalized to the self-origin
           nova shape every other barrage uses (aoeOriginSelf + aoeRadius)
           instead of leaning on the range-fallback path — Requiem was the
           only barrage without it. Radius 4 keeps its old reach. NOTE: the
           77% whiff rate in stats17/18 could NOT be reproduced against the
           current repo engine (forced-Requiem sim: 0 whiffs) — it is almost
           certainly a stale battle.js on R2; redeploy with a cache-bust. */
        range: 0,
        aoeOriginSelf: true,
        aoeRadius: 4,
        kind: 'barrage',
        damageType: 'magic',
        tier: 'III',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statusEffects: [{
            id: 'discord',
            duration: 2
        }],
        bonusVsStatus: { status: 'discord', mult: 1.5 },
        desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to targets with Discord. Cooldown: 2 rounds.'
    },


    {
        id: 'voidRush',
        spellType: 'anomaly',
        element: 'arcane',
        name: 'Void Rush',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 160,
        range: 4,
        kind: 'teleport',
        damageType: 'magic',
        /* Shadow-entity race capstone since the tree audit (race-only now;
           not in the Psychic tree) — ring 4 = tier III. */
        tier: 'III',
        school: 'Psychic',
        classRestriction: 'Psychic',
        teleportDistance: 4,
        aoeRadius: 1,
        aoeOnArrival: true,
        desc: 'Teleports the caster, then deals HEAVY magic damage to All Enemies around the arrival tile (AOE).'
    },



    {
        id: 'cleanse',
        spellType: 'divine',
        element: 'light',
        name: 'Cleanse',
        type: 'utility',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        range: 3,
        kind: 'cleanse',
        tier: 'I',
        school: 'White Mage',
        classRestriction: 'White Mage',
        desc: 'Removes harmful status effects from a Single Ally.'
    },

    /* exorcism moved to the Priest/Nun RACE kit (2026-07-23) — the rite of
       exorcism belongs to the clergy, not the whole White Mage school. See
       RACE_ABILITIES['priest']. */

    {
        id: 'kneecapShot',
        spellType: 'tech',
        element: 'metal',
        name: 'Kneecap Shot',
        type: 'damage',
        cost: 32,
        equipCost: 15,
        dmg: 80,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{ id: 'root', duration: 1 }],
        desc: 'Deals WEAK physical damage to a Single Enemy. Applies Rooted.'
    },

    {
        id: 'kineticHurl',
        spellType: 'alien',
        element: 'psychic',
        name: 'Kinetic Hurl',
        type: 'damage',
        cost: 24,
        equipCost: 15,
        dmg: 100,
        range: 3,
        kind: 'displacement',
        damageType: 'magic',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        displaceDistance: 2,
        collisionBonus: 64,
        arcThrow: true,
        desc: 'Deals MEDIUM magic damage to a Single Enemy. Shoves the target sideways.'
    },


    /* ── Terraforming pass (2026-07-07): block building ──────────────────
       The single-block spells (Timber/Stone/Steel Block) were RETIRED on
       2026-07-10: placing or digging one voxel is now the universal BUILD
       action every grounded unit gets on the Horologe (1 AP + 1 banked
       material per block — see BUILD_ACTION_CONFIG / doBuildAction).
       Only multi-block prefab structures remain spells. */

    /* ── Terraforming pass: prebuilt voxel structures ─────────────────────
       (fieldBridge and watchtower were CUT 2026-07-23 — free-build voxel
       placement covers bridge/tower construction now. STRUCTURE_TEMPLATES
       stays for map prefabs.) */

    /* ── Terraforming pass: trap arsenal ──────────────────────────────────
       kind 'placeTrap' hides a charge on an empty tile (visible only to
       your team). The first ENEMY to step on it springs it; airborne units
       glide over. Each trap warps the fight a different way. */
    /* (tremorCharge and magnetMine were CUT 2026-07-23 — the Engineer trap
       arsenal is retired. snareTrap and frostMine followed 2026-07-26 via
       the Spell Library; kind:'placeTrap' plumbing stays.) */

    /* ── Assassin (job id 'Agent') kit fillers (2026-07-13) — replace the two
       tech spells (EMP Burst / Magnet Mine) that moved to Engineer. ── */
    {
        id: 'poisonDart',
        spellType: 'human',
        element: 'poison',
        name: 'Poison Dart',
        type: 'damage',
        cost: 25,
        equipCost: 12,
        dmg: 125,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-knife',
        tier: 'II',
        school: 'Agent',
        classRestriction: 'Agent',
        statusEffects: [{
            id: 'poison',
            duration: 3
        }],
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Poison.'
    },

    /* ── Swordmaster kit (2026-07-13) — new job. Duelists: Swordfighter,
       Pirate, King Arthur, Skeleton, Valkraye. ── */
    {
        id: 'crossSlash',
        spellType: 'human',
        element: 'metal',
        name: 'Cross Slash',
        type: 'damage',
        cost: 20,
        equipCost: 12,
        dmg: 100,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Swordmaster',
        classRestriction: 'Swordmaster',
        jobPreference: ['Swordmaster'],
        bonusVsStatus: { status: 'slow', mult: 1.5 },
        desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Slow.'
    },
    {
        id: 'swordBeam',
        spellType: 'human',
        element: 'metal',
        name: 'Sword Beam',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 100,
        range: 3,
        kind: 'line',
        damageType: 'physical',
        lineWidth: 1,
        tier: 'I',
        school: 'Swordmaster',
        classRestriction: 'Swordmaster',
        desc: 'Deals MEDIUM physical damage to All Enemies in a line.'
    },
    {
        /* 2026-07-17 shape pass: was one of NINE identical 3×3 self-slams.
           Now a Manhattan DIAMOND, radius 2 — the waltz steps carry the
           blades two full tiles out in every cardinal direction. Damage
           trimmed 126→118 for the extra reach. */
        id: 'bladeWaltz',
        spellType: 'human',
        element: 'metal',
        name: 'Blade Waltz',
        type: 'damage',
        cost: 30,
        equipCost: 18,
        dmg: 125,
        range: 0,
        kind: 'cross',
        diamond: true,
        crossRadius: 2,
        aoeOriginSelf: true,
        damageType: 'physical',
        tier: 'II',
        school: 'Swordmaster',
        classRestriction: 'Swordmaster',
        desc: 'Deals MEDIUM physical damage to All Enemies in an X-shaped AOE.'
    },
];
const SPELL_BY_ID = Object.fromEntries(SPELL_LIBRARY.map(spell => [spell.id, spell]));

const SPELL_EQUIP_REQUIREMENTS = {};

function equipmentMeetsSpellReq(equipment, spellId) { return true; }
function unitMeetsSpellEquipReq(unit, spellId) { return true; }

/* ── STRUCTURE_TEMPLATES (2026-07-07 terraforming pass) ────────────────────
   Voxel prefabs for kind:'buildStructure' spells. Local frame: +x = away
   from the caster (through the target tile), +y = caster's right; battle.js
   _structurePlanFor rotates the footprint to the cast direction and the
   ghost preview shows the exact resulting blocks.
   - kind 'bridge': a walkable deck at the caster's standing height, extending
     up to `length` tiles over water/chasm until it meets the far shore.
   - kind 'blocks': each entry stacks `dz` levels of `terrain` on the tile's
     current top (optional `topTerrain` for the crowning block). Tiles holding
     units are skipped — structures never crush or trap a body. */
const STRUCTURE_TEMPLATES = {
    bridgeSpan: {
        name: 'Field Bridge',
        kind: 'bridge',
        length: 4,
        deckTerrain: 'wood_planks'
    },
    watchtower: {
        name: 'Watchtower',
        kind: 'blocks',
        blocks: [
            { dx: 0,  dy: 0, dz: 2, terrain: 'cobblestone', topTerrain: 'mountain_top' },
            { dx: -1, dy: 0, dz: 1, terrain: 'cobblestone' }   // climbing step, caster side
        ]
    },
};

const SHARED_FLASH_FREEZE = {
    id: 'sharedFlashFreeze', spellType: 'anomaly', element: 'ice', name: 'Flash Freeze',
    type: 'damage', cost: 25, dmg: 90, range: 4, apCost: 1,
    kind: 'terrainCreate', terrainType: 'ice', tileCount: 3, orientable: true,
    damageType: 'magic',
    statusEffects: [{ id: 'frozen', duration: 1 }],
    desc: 'Reshapes the battlefield — creates ice across 3 tiles (pick the orientation). Applies Frozen.'
};

const SHARED_TIDAL_SURGE = {
    id: 'sharedTidalSurge', spellType: 'anomaly', element: 'water', name: 'Water Pulse',
    type: 'damage', cost: 30, dmg: 100, range: 5,
    kind: 'linePush', damageType: 'magic', lineWidth: 1, pushDistance: 2,
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Deals MEDIUM magic damage to All Enemies in a line. Pushes them back. Applies Slow. Knocks the target back 2 tiles.'
};

/* ── 2026-07-17 spell/status pass: new shared kits ──────────────────────
   Shrink Ray (mad scientist / martian) — the classic B-movie beam; applies
   `minimize` (-2 ATK stages + the model physically shrinks).
   Hex of Agony (shaman / fortune teller / scarecrow / demon princess) —
   punish-action curse: the victim takes damage every time they MOVE or CAST
   while hexed, AND rots under Poison. 2026-07-25: the old separate "Hex of
   Toil" (hexed only) and demon-princess "Hex of Agony" (poison only) were
   two halves of the same curse — merged into this single shared hex (id
   kept as sharedHexOfToil so saves/AI wiring survive).
   Gravity fields (annunaki / grey / martian) — persistent physics zones:
   super gravity kills jumps+flight and triples fall damage; low gravity
   grants +2 jump and erases fall damage. Both are indiscriminate — they
   bend physics for EVERYONE inside, both teams. */
const SHARED_SHRINK_RAY = {
    id: 'sharedShrinkRay', spellType: 'tech', element: 'metal', name: 'Shrink Ray',
    type: 'debuff', cost: 25, range: 4, apCost: 1,
    kind: 'debuff',
    statusEffects: [{ id: 'minimize', duration: 3 }],
    desc: 'Weakens a Single Enemy. Applies Minimized.'
};

const SHARED_HEX_OF_TOIL = {
    id: 'sharedHexOfToil', spellType: 'unholy', element: 'shadow', name: 'Hex of Agony',
    type: 'debuff', cost: 30, range: 4, apCost: 1,
    kind: 'debuff',
    /* Single-status rule (SPELL_TREE_REDESIGN §2.1): the Poison rider is
       gone — Hexed alone (hurts on move AND cast) is already a full effect. */
    statusEffects: [{ id: 'hexed', duration: 3 }],
    desc: 'Weakens a Single Enemy. Applies Hexed.'
};

/* One sanctuary, one name (2026-07-25): the angel's healing zone, the
   priest's war-cry variant and the fallen angel's "Corrupted Sanctuary"
   were three copies of the same idea — and two of them even SHARED the id
   raceSanctuary (a SPELL_BY_ID collision, same bug as the old Walls of
   Camelot). Single shared zoneHeal object now; Corrupted Sanctuary is
   deleted everywhere. */
const SHARED_SANCTUARY = {
    id: 'raceSanctuary', spellType: 'divine', name: 'Sanctuary',
    type: 'utility', cost: 35, range: 3, apCost: 1,
    kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 48,
    desc: 'Consecrate a 3x3 area for 2 turns. Allies standing in it heal each round.'
};

const SHARED_GRAVITY_CRUSH = {
    id: 'sharedGravityCrush', spellType: 'alien', element: 'arcane', name: 'Gravity Crush',
    type: 'utility', cost: 35, range: 4, apCost: 1,
    kind: 'zoneDebuff', gravityField: 'super', aoeRadius: 1, zoneDuration: 3,
    statusEffects: [],
    desc: 'Crush a 3×3 area under triple gravity for 3 rounds. Inside the field NOBODY (yours included) can jump, flyers are slammed from the sky and stay grounded, and falls hit 3× harder. Cast it under a ledge and start shoving.'
};

const SHARED_LOW_GRAVITY = {
    id: 'sharedLowGravity', spellType: 'alien', element: 'arcane', name: 'Low Gravity',
    type: 'utility', cost: 20, range: 4, apCost: 1,
    kind: 'zoneDebuff', gravityField: 'weak', aoeRadius: 1, zoneDuration: 3,
    statusEffects: [],
    desc: 'Loosen gravity over a 3×3 area for 3 rounds. EVERYONE inside (both teams) jumps +2 tiles further and higher, and takes zero fall damage. Moon-bounce your bruisers up a cliff — just remember the enemy can bounce too.'
};

/* One wall spell, one name. The knight's old "Castle Fortress" and King
   Arthur's "Walls of Camelot" were two copies of the same spell sharing the
   id `raceShieldWall`, so the party-builder pool showed one name and the
   equipped slot resolved (via SPELL_BY_ID) to the other. Single shared
   object — both races raise the Walls of Camelot. */
const SHARED_WALLS_OF_CAMELOT = {
    id: 'raceShieldWall', spellType: 'human', element: 'earth', name: 'Walls of Camelot',
    type: 'utility', cost: 25, apCost: 1, range: 3,
    kind: 'terrainCreate', terrainType: 'castle_wall', tileCount: 3, orientable: true,
    dmg: 60, damageType: 'physical',
    terrainDeform: { centerDelta: 2, edgeDelta: 0 },
    desc: 'Reshapes the battlefield — creates castle_wall across 3 tiles (pick the orientation).'
};

/* (SHARED_MAELSTROM was CUT 2026-07-26 via the Spell Library.) */

/* (SHARED_RAMPART merged into the Tank class spell 'rampart' 2026-08-03 —
   it was a same-name duplicate. Races borrow 'rampart' by id via the
   movepool-share table; 'sharedRampart' lives on as an id alias.) */

const SHARED_FISSURE = {
    id: 'sharedFissure', spellType: 'divine', element: 'earth', name: 'Fissure',
    type: 'damage', cost: 30, dmg: 100, range: 4, apCost: 1,
    kind: 'terrainCreate', terrainType: 'chasm', tileCount: 3, orientable: true,
    damageType: 'physical',
    statusEffects: [{ id: 'stagger', duration: 1 }],
    terrainDeform: { centerDelta: -2, edgeDelta: 0 },
    desc: 'Reshapes the battlefield — creates chasm across 3 tiles (pick the orientation). Applies Stagger.'
};

const SHARED_SCORCHED_EARTH = {
    id: 'sharedScorchedEarth', spellType: 'unholy', element: 'fire', name: 'Scorched Earth',
    type: 'damage', cost: 25, dmg: 70, range: 4,
    kind: 'terrainCreate', terrainType: 'scorched', tileCount: 3, orientable: true,
    damageType: 'magic',
    desc: 'Scorch 3 tiles in a line. Enemies caught take damage. Scorched tiles punish anyone who lingers.'
};

const SHARED_POISON_SWAMP = {
    id: 'sharedPoisonSwamp', spellType: 'unholy', element: 'poison', name: 'Poison Swamp',
    type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 1,
    kind: 'terrainCreate', terrainType: 'poison', tileCount: 1,
    damageType: 'magic',
    desc: 'Conjure a poison spring on one tile. The toxin overflows onto the surrounding ground and runs downhill. Enemies caught in the spreading poison take damage; the terrain poisons anyone who wades through.'
};

const SHARED_INFECTIOUS_BITE = {
    id: 'raceInfectiousBite', element: 'poison', spellType: 'unholy', name: 'Infectious Bite',
    type: 'damage', cost: 20, dmg: 100, range: 1,
    kind: 'damage', damageType: 'physical',
    statusEffects: [{ id: 'poison', duration: 3 }],
    desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Poison.'
};

/* (SHARED_TERRAFORM was CUT 2026-07-23 — terrain purification is gone from
   the game; hazard tiles stay until something else overwrites them.) */

/* Universal wing buffet (2026-07-23) shared by every winged race. Keeps the
   old raceWingGust id so the existing 3D gust VFX fires unchanged. */
const SHARED_WING_ATTACK = {
    id: 'raceWingGust', spellType: 'anomaly', element: 'wind', name: 'Wing Attack',
    type: 'damage', cost: 25, dmg: 80, range: 0, apCost: 1,
    kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
    pushDistance: 2,
    desc: 'A sweeping blow with both wings. Deals WEAK physical damage to All Enemies around the caster (AOE) and knocks them back.'
};

/* THE one Smite (2026-07-23). Divine Smite and the two duplicate race
   Smites were consolidated into this single shared spell (priest / angel /
   nephilim). */
const SHARED_SMITE = {
    id: 'raceSmite', spellType: 'divine', element: 'light', name: 'Smite',
    type: 'damage', cost: 25, dmg: 100, range: 3,
    kind: 'damage', damageType: 'magic',
    bonusVsUnholy: 0.50,
    desc: 'Deals MEDIUM magic damage to a Single Enemy.'
};

const SHARED_SUMMON_BLIZZARD = {
    id: 'sharedSummonBlizzard', spellType: 'anomaly', element: 'ice', name: 'Summon Blizzard',
    type: 'utility', cost: 35, range: 4, apCost: 2,
    kind: 'summonWeather',
    weatherType: 'blizzard',
    weatherDuration: [3, 4],
    weatherTiles: [4, 6],
    desc: 'Summons blizzard weather that chases units, BLINDING those it batters. Frozen victims take extra damage.'
};

const SHARED_SUMMON_SANDSTORM = {
    id: 'sharedSummonSandstorm', spellType: 'alien', element: 'wind', name: 'Summon Sandstorm',
    type: 'utility', cost: 30, range: 4, apCost: 1,
    kind: 'summonWeather',
    weatherType: 'sandstorm',
    weatherDuration: [3, 5],
    weatherTiles: [5, 7],
    desc: 'Summons sandstorm weather over the battlefield.'
};

const SHARED_SUMMON_BLOOD_RAIN = {
    id: 'sharedSummonBloodRain', spellType: 'unholy', element: 'blood', name: 'Summon Blood Rain',
    type: 'utility', cost: 35, range: 4, apCost: 2,
    kind: 'summonWeather',
    weatherType: 'bloodRain',
    weatherDuration: [3, 5],
    weatherTiles: [5, 8],
    desc: 'Summons bloodRain weather over the battlefield.'
};

/* (SHARED_CALL_LIGHTNING / Summon Storm was CUT 2026-07-26 via the Spell
   Library.) */

const SHARED_NUKE = {
    id: 'sharedNuke', spellType: 'tech', element: 'fire', name: 'Nuke',
    type: 'damage', tier: 'III', cost: 45, dmg: 160, range: 5, apCost: 2,
    kind: 'delayed', damageType: 'magic', aoeRadius: 2, delayTurns: 1,
    leaveTerrain: 'scorched',
    terrainDeform: { centerDelta: -3, edgeDelta: -1 },
    demolishesBuildings: true,
    desc: 'Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Destroys buildings. Leaves scorched tiles behind. Reshapes the ground on impact. Cooldown: 2 rounds.'
};


const SHARED_SMOKE_SCREEN = {
    id: 'sharedSmokeScreen', spellType: 'human', element: 'wind', name: 'Smoke Screen',
    type: 'utility', cost: 20, range: 3, apCost: 1,
    kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
    smokeConcealment: true,
    statusEffects: [],
    allyStatusEffects: [{ id: 'invisible', duration: 1 }],
    desc: 'Blanket a 3×3 area in smoke for 2 turns. Allies inside are hidden and stay invisible only while they remain in the cloud.'
};

/* ── 2026-07-26 psychedelic/cosmic spell drop ────────────────────────────
   Ego Death — the trip grade at full tilt (shaman capstone, machine elves
   too: they ARE the entities on the other side of the trip).
   Black Hole — cosmic wraith + voidweaver: a 5×5 event horizon aoePull.
   Nebula — cosmic wraith + superhero: the star-cloud concealment field. */
const SHARED_EGO_DEATH = {
    id: 'sharedEgoDeath', spellType: 'alien', element: 'psychic', name: 'Ego Death',
    type: 'damage', tier: 'III', cost: 50, dmg: 180, range: 3, apCost: 2, cooldownRounds: 2,
    kind: 'damage', damageType: 'magic',
    statusEffects: [{ id: 'stun', duration: 1 }],
    desc: 'Dissolve the target\'s sense of self entirely. The world drains away, the colour wheel spins, and what is left of "them" implodes into white light. Deals HEAVY magic damage to a Single Enemy and Stuns them while the pieces reassemble. Cooldown: 2 rounds.'
};

const SHARED_BLACK_HOLE = {
    id: 'sharedBlackHole', spellType: 'alien', element: 'shadow', name: 'Black Hole',
    type: 'damage', tier: 'III', cost: 45, dmg: 160, range: 4, apCost: 2, cooldownRounds: 2,
    kind: 'aoePull', damageType: 'magic', aoeRadius: 2, pullToCenter: true,
    groundsFlyers: true,
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Collapse a singularity: everything in a 5×5 event horizon is dragged screaming toward the center and crushed for HEAVY magic damage. Applies Slow. Knocks flying enemies out of the sky. Cooldown: 2 rounds.'
};

const SHARED_NEBULA = {
    id: 'sharedNebula', spellType: 'alien', element: 'light', name: 'Nebula',
    type: 'damage', cost: 50, dmg: 135, range: 4, apCost: 2, cooldownRounds: 2,
    kind: 'aoe', aoeRadius: 2, damageType: 'magic',
    statusEffects: [{ id: 'burn', duration: 2 }],
    desc: 'Birth a star over the battlefield and detonate it. The newborn sun swells, collapses, and goes SUPERNOVA — MEDIUM magic damage to All Enemies in a 5×5 blast and Burns everything the starfire touches. The nebula left hanging in the air is what remains of them. Cooldown: 2 rounds.'
};

/* (SHARED_EMP_PULSE merged into the Engineer class spell 'empBurst'
   2026-08-03 — it was a same-name near-identical duplicate. The machine
   races borrow 'empBurst' by id via the movepool-share table; the legacy
   id 'raceEmpPulse' lives on as an alias.) */


const SHARED_VORTEX_SLAM = {
    id: 'sharedVortexSlam', spellType: 'anomaly', element: 'wind', name: 'Vortex Slam',
    type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4, apCost: 2,
    kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Deals HEAVY magic damage to All Enemies in an AOE and pulls them toward the center. Applies Slow.'
};

/* ══════════ SHARED SPELL ARCHETYPES (2026-07-23 dedup pass) ══════════
   Same treatment as the beams/SHARED_SMITE: near-identical race spells now
   draw their NUMBERS from one shared stat block, while keeping their own
   id/name/element/desc (VFX maps key on ids; flavor stays per-race). A
   balance pass edits ONE line here instead of hunting six copies.

   ── Blinks: seven "teleport N tiles" spells → THREE flavors ──
     short  — 3 tiles, LoS, 15 MP           (the cheap reposition)
     shadow — 4 tiles, ignores LoS, 20 MP,  2-round cooldown (the wall-cheat)
     long   — 5 tiles, LoS, 25 MP           (the map-crosser)
   (warpRune keeps its own kind; Grave Passage is a deployPair gate — both
   are genuinely different mechanics and stay untouched.) */
const _BLINK_ARCHETYPES = {
    short:  { type: 'utility', cost: 15, range: 3, apCost: 1,
              kind: 'teleport', teleportDistance: 3 },
    shadow: { type: 'utility', cost: 20, range: 4, apCost: 1, cooldownRounds: 2,
              kind: 'teleport', teleportDistance: 4, requiresLineOfSight: false },
    long:   { type: 'utility', cost: 25, range: 5, apCost: 1,
              kind: 'teleport', teleportDistance: 5 },
};
const _mkBlink = (arch, over) => Object.assign({}, _BLINK_ARCHETYPES[arch], over);

/* ── Single-target debuff bolts ("Weakens a Single Enemy, applies X") ──
   One stat block per status; per-race identity via _mkBolt overrides. */
const _JAM_BOLT = {
    type: 'debuff', cost: 30, range: 3, apCost: 1,
    kind: 'debuff', statusEffects: [{ id: 'jammed', duration: 2 }],
    desc: 'Weakens a Single Enemy. Applies Jammed.'
};
const _DISCORD_BOLT = {
    type: 'debuff', cost: 25, range: 3, apCost: 1,
    kind: 'debuff', statusEffects: [{ id: 'discord', duration: 2 }],
    desc: 'Sows dissonance in a Single Enemy: lowers ATK by 2 stages and DEF by 1 stage for 2 turns.'
};
const _mkBolt = (base, over) => Object.assign({}, base, over);

/* ── Charges: the "rush a Single Enemy" family shares ONE base ──
   Default: 120 physical, range 3, 25 MP, kind 'damage' + chargeToTarget.
   Variants override only what makes them distinct (dash kind, stagger,
   dmg tier, swap/poison/bonus riders) — descs stay explicit per spell. */
const _mkCharge = (over) => Object.assign({
    spellType: 'human',
    type: 'damage', cost: 25, dmg: 120, range: 3,
    kind: 'damage', damageType: 'physical', chargeToTarget: true,
    desc: 'Deals MEDIUM physical damage to a Single Enemy.'
}, over);
const _STAGGER_1 = [{ id: 'stagger', duration: 1 }];

const RACE_ABILITIES = {

    'seraphim': [
        { id: 'raceDivineJudgment', spellType: 'divine', name: 'Divine Judgment',
          type: 'damage', cost: 40, dmg: 135, range: 4, apCost: 2,
          kind: 'cross', damageType: 'magic', crossRadius: 2,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in a cross-shaped AOE. Applies Burn.' },
        { id: 'raceAbsolution', spellType: 'divine', name: 'Absolution',
          type: 'heal', cost: 35, range: 0, apCost: 2,
          kind: 'healAll', healAmt: 130,
          cleanse: true,
          desc: 'Restores a SMALL amount of HP to a Single Ally.' },
        { id: 'raceRapture', spellType: 'divine', name: 'Rapture',
          type: 'utility', cost: 40, range: 4, apCost: 2,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 1 }],
          desc: 'Empowers a Single Ally. Applies Protect. Cooldown: 2 rounds.' },
        { id: 'raceMerkaba', spellType: 'divine', element: 'light', name: 'Merkaba',
          type: 'damage', tier: 'III', cost: 45, dmg: 160, range: 4, apCost: 2, cooldownRounds: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Summon the sacred chariot: counter-rotating star tetrahedra spin up over the battlefield, gather three rings of light, and collapse into a detonation. Deals HEAVY magic damage to All Enemies in an AOE. Cooldown: 2 rounds. Deals bonus damage to Burning targets.' },
    ],
    'orb of light': [
        { id: 'racePrismBurst', spellType: 'divine', name: 'Prism Burst',
          type: 'damage', cost: 30, dmg: 125, range: 4,
          kind: 'ricochet', damageType: 'magic',
          bounceDamage: 80, bounceRadius: 2, wallBounce: true,
          desc: 'Deals MEDIUM magic damage to a Single Enemy, then bounces to nearby enemies.' },
        { id: 'raceLuminousShield', spellType: 'divine', name: 'Luminous Shield',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 140,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        { id: 'racePhotonScatter', spellType: 'divine', name: 'Photon Scatter',
          type: 'damage', cost: 30, dmg: 80, range: 0,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          desc: 'Deals WEAK magic damage to All Enemies around the caster (AOE).' },
        { id: 'raceSupernova', spellType: 'divine', element: 'light', name: 'Supernova',
          type: 'damage', cost: 55, dmg: 170, range: 0, apCost: 2, tier: 'III',
          kind: 'aoe', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statStageBoost: { def: -1 },
          desc: 'The orb goes supernova. Deals HEAVY magic damage to All Enemies around the caster (AOE) and sears their armor, lowering DEF by 1 stage.' },
    ],
    /* 2026-07-23 ghost rework: Human+Anomaly Psychic now. Spectral Passage
       stopped being a spell and became the race PASSIVE (ghosts phase through
       walls, enemies and barricades while moving — see unitIsPhasing in
       map.js + the getMoveTiles/findMovePath hooks in battle.js). Boo is the
       new jump-scare nuke. */
    'ghost': [
        /* Ghost capstone since the 2026-08-12 capstone pass (was Possession). */
        { id: 'raceBoo', spellType: 'anomaly', element: 'psychic', name: 'Boo',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 2,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Deals HEAVY magic damage to a Single Enemy. Lowers ATK by 2 stages and DEF by 1 stage.' },
        { id: 'raceColdSpot', element: 'ice', spellType: 'anomaly', name: 'Cold Spot',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'frozen', duration: 1 }],
          desc: 'Creates a hostile zone that weakens enemies inside for 2 rounds. Applies Frozen.' },
        _mkBolt(_JAM_BOLT, { id: 'racePossession', spellType: 'anomaly', name: 'Possession' }),
        SHARED_FLASH_FREEZE
    ],
    'angel': [
        SHARED_SANCTUARY,
        SHARED_SMITE,
        /* 2026-07-23: renamed from Wings of Mercy (id kept for VFX/saves). */
        { id: 'raceWingsOfMercy', spellType: 'divine', name: 'Miracle',
          type: 'utility', cost: 20, range: 4, apCost: 1,
          kind: 'swap', allyOnly: true, healOnSwap: 60,
          desc: 'Swaps positions with the target unit. The ally heals on arrival.' },
        /* Angel capstone (tree redesign §4). The doc suggested promoting the
           shared Smite, but that id sits at ring 1/3 for nephilim/priest —
           promoting it would break ring=tier. Angel gets its own heavy smite. */
        { id: 'raceDivineSmite', spellType: 'divine', element: 'light', name: 'Divine Smite',
          type: 'damage', cost: 50, dmg: 180, range: 4, apCost: 2, tier: 'III',
          kind: 'damage', damageType: 'magic',
          unholyBonus: 80,
          desc: 'Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Unholy targets. The full weight of heaven, delivered.' },
        SHARED_WING_ATTACK,
    ],
    'gargoyle': [
        { id: 'racePerchForm', spellType: 'unholy', name: 'Perch Form',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          desc: 'Empowers the caster. Applies Protect. Cooldown: 2 rounds.' },
        { id: 'raceStonefall', element: 'earth', spellType: 'unholy', name: 'Stonefall',
          type: 'damage', cost: 30, dmg: 100, range: 4,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Stagger. Fires through cover.' },
        { id: 'raceGothicRampart', spellType: 'unholy', name: 'Gothic Rampart',
          type: 'utility', cost: 25, range: 2, apCost: 1,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 2, orientable: true,
          dmg: 50, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Raise 2 tiles of stone wall. Cheaper than Rampart but smaller. The cathedral grows.' },
        { id: 'raceStoneDrop', element: 'earth', spellType: 'unholy', name: 'Stone Drop',
          type: 'damage', tier: 'III', cost: 25, dmg: 150, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          requiresFlight: true,
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Lifts the target high and drops it. Deals HEAVY physical damage plus fall damage. Deals bonus damage to targets with Stagger. Caster must be flying.' },
        { id: 'raceCalcify', spellType: 'unholy', element: 'earth', name: 'Calcify',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statStageBoost: { int: -3 },
          desc: 'Turn the target\'s thoughts to stone. Grey creeps up from their skull as the mind petrifies — lowers M ATK by 3 stages.' },
        SHARED_FISSURE,
        SHARED_WING_ATTACK
    ],

    'demon': [
        { id: 'raceContract', spellType: 'unholy', element: 'shadow', name: 'Contract',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff', statusEffects: [{ id: 'contract', duration: 3 }],
          desc: 'Binds a Single Enemy in an infernal contract for 3 turns: every time they deal damage, the demon collects 40% of it as healing. The fine print always favors the fiend.' },
        { id: 'raceHellmouth', spellType: 'unholy', element: 'fire', name: 'Hellmouth',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          leaveTerrain: 'lava',
          desc: 'Deals HEAVY magic damage to All Enemies in a line. Leaves lava tiles behind.' },
        { id: 'raceVoidContract', spellType: 'unholy', element: 'shadow', name: 'Devour Soul',
          type: 'damage', cost: 40, dmg: 125, range: 3, apCost: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.50,
          bonusVsStatus: { status: 'contract', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Contract. Heals the caster for part of the damage dealt.' },
        { id: 'raceInfernalHurl', spellType: 'unholy', element: 'fire', name: 'Infernal Hurl',
          type: 'damage', cost: 30, dmg: 90, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          requiresFlight: true,
          desc: 'Grabs the target, carries it skyward and hurls it up to 3 tiles. Deals WEAK physical damage, more if they crash into another unit. Caster must be flying.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_BLOOD_RAIN,
        SHARED_WING_ATTACK
    ],
    'succubus': [
        { id: 'raceSoulSuck', spellType: 'unholy', name: 'Soul Suck',
          type: 'damage', cost: 30, dmg: 100, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.60,
          statusEffects: [{ id: 'charm', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Charm. Heals the caster for part of the damage dealt.' },
        { id: 'raceCharm', spellType: 'unholy', name: 'Charm',
          type: 'debuff', cost: 30, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'charm', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Charm.' },
        { id: 'raceDrainingEmbrace', spellType: 'unholy', name: 'Draining Embrace',
          type: 'damage', tier: 'III', cost: 35, dmg: 180, range: 1, apCost: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.60,
          bonusVsStatus: { status: 'charm', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Heals the caster for part of the damage dealt. Deals bonus damage to Charmed targets.' },
        /* 2026-07-23: Poison Swamp out, Sleep Paralysis in — she sits on
           your chest and you cannot move. */
        { id: 'raceSleepParalysis', spellType: 'unholy', element: 'shadow', name: 'Sleep Paralysis',
          type: 'damage', cost: 30, dmg: 125, range: 3,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'root', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Rooted.' },
    ],
    /* 2026-07-18 zombie kit rework: Poison Swamp / Scorched Earth / Undying
       Grip are GONE. Shambling Horde is now an AoE stampede (the horde
       tramples the target area), and Zombie Rush is the new gap closer. */
    'zombie': [
        SHARED_INFECTIOUS_BITE,
        /* Zombie capstone since the 2026-08-12 capstone pass (was Outbreak). */
        { id: 'raceShamblingHorde', spellType: 'unholy', name: 'Shambling Horde',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 3, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'The horde descends. Deals HEAVY physical damage to All Enemies in an AOE.' },
        _mkCharge({ id: 'raceZombieRush', spellType: 'unholy', name: 'Zombie Rush', dmg: 130, desc: 'Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.' }),
        { id: 'raceOutbreak', spellType: 'unholy', element: 'poison', name: 'Outbreak',
          type: 'debuff', cost: 55, range: 4, apCost: 2,
          kind: 'zoneDebuff', aoeRadius: 2, zoneDuration: 3,
          statusEffects: [{ id: 'poison', duration: 2 }],
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Patient zero hits the ground. Blights a 5×5 area for 3 rounds — enemies inside are Poisoned, and the infection reapplies every round they linger. Deals bonus damage to Poisoned targets.' },
    ],
    'anubis': [
        { id: 'raceWeighTheHeart', spellType: 'unholy', name: 'Weigh the Heart',
          type: 'damage', tier: 'III', cost: 40, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic', executeBonusPct: 0.5,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Deals more damage the lower the target\'s HP. Deals bonus damage to Staggered targets.' },
        { id: 'raceGravePassage', spellType: 'unholy', name: 'Grave Passage',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'deployPair', maxActivePerCaster: 1,
          desc: 'Place paired tomb-gate tiles. Allies can teleport between them once each. Placing never uses your spell slot.' },
        SHARED_SUMMON_SANDSTORM,
        SHARED_FISSURE
    ],
    'skeleton': [
        { id: 'raceBoneToss', spellType: 'unholy', name: 'Bone Toss',
          type: 'damage', cost: 15, dmg: 80, range: 3,
          kind: 'damage', damageType: 'physical', ignoreArmor: true,
          desc: 'Deals WEAK physical damage to a Single Enemy. Ignores DEF.' },
        { id: 'raceReassemble', spellType: 'unholy', name: 'Reassemble',
          type: 'heal', cost: 25, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.30,
          desc: 'Restores 30% of the caster\'s max HP.' },
        SHARED_POISON_SWAMP,
        SHARED_FISSURE,
        { id: 'raceMarrowstorm', spellType: 'unholy', name: 'Marrowstorm',
          type: 'damage', cost: 50, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'aoe', damageType: 'physical', aoeRadius: 2, ignoreArmor: true,
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE. Ignores DEF. Deals bonus damage to targets with Poison. Cooldown: 2 rounds.' },
    ],
    'mothman': [
        { id: 'raceDreadAura', spellType: 'unholy', name: 'Dread Aura',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Emit a wave of dread. For 2 turns, all enemies within 2 tiles have their ATK lowered by 2 stages and DEF by 1 stage.' },
        { id: 'raceProphecyOfDisaster', spellType: 'anomaly', name: 'Prophecy of Disaster',
          type: 'damage', tier: 'III', cost: 50, dmg: 160, range: 5, apCost: 2,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          bonusVsStatus: { status: 'discord', mult: 1.5 },
          desc: 'Marks the target tile — the strike lands after 1 round, dealing HEAVY magic damage in an AOE. Deals bonus damage to targets with Discord.' },
        { id: 'raceRedEyes', spellType: 'unholy', name: 'Red Eyes',
          type: 'debuff', cost: 20, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 30 }],
          desc: 'Weakens a Single Enemy. Applies Marked.' },
        { id: 'raceAbduction', spellType: 'unholy', name: 'Abduction',
          type: 'damage', cost: 25, dmg: 60, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 5, dmgPerLevel: 25,
          requiresFlight: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Snatch an adjacent enemy into the sky and release them. Damage scales with height. They never speak of what they saw up there.' },
        SHARED_SUMMON_SANDSTORM,
        SHARED_WING_ATTACK
    ],
    'shadow entity': [
        { id: 'racePhaseShift', spellType: 'anomaly', name: 'Phase Shift',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Empowers the caster. Applies Invisible. Cooldown: 2 rounds.' },
        { id: 'raceShadowBind', spellType: 'anomaly', name: 'Shadow Crush',
          type: 'damage', cost: 25, dmg: 100, range: 3, apCost: 1,
          kind: 'damage', damageType: 'magic', vfxWeight: 'standard',
          statusEffects: [{ id: 'slow', duration: 2 }],
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Slow. Deals bonus damage to targets with Slow.' },
        SHARED_SMOKE_SCREEN,
    ],
    'werewolf': [
        _mkCharge({ id: 'racePounce', spellType: 'human', element: 'nature', name: 'Pounce' }),
        { id: 'raceHowl', spellType: 'human', element: 'sonic', name: 'Howl',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        _mkCharge({ id: 'raceBloodFrenzy', spellType: 'unholy', element: 'blood', name: 'Blood Frenzy',
          tier: 'III', cost: 45, dmg: 180, apCost: 2, range: 6, autoTargetLowestHp: true,
          desc: 'Deals HEAVY physical damage to a Single Enemy. Automatically strikes the visible enemy with the lowest HP.' }),
        { id: 'raceBite', spellType: 'human', element: 'blood', name: 'Bite',
          type: 'damage', cost: 30, dmg: 100, range: 1,
          kind: 'lifeDrain', damageType: 'physical', drainPct: 0.30,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Heals the caster for part of the damage dealt.' },
        { id: 'raceFeralDive', spellType: 'human', element: 'nature', name: 'Feral Dive',
          type: 'damage', cost: 25, dmg: 125, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Leaps to a Single Enemy, dealing MEDIUM physical damage.' }
    ],

    'fairy': [
        { id: 'raceGlitterburst', spellType: 'anomaly', element: 'light', name: 'Glitterburst',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statStageBoost: { def: -1 },
          desc: 'Deals WEAK magic damage to All Enemies in an AOE. Lowers the target\'s DEF by 1 stage.' },
        /* Pixie Dust Trail is now a PASSIVE (battle.js): the fairy sheds
           glowing dust on tiles she moves across; allies who step on a mote
           collect it for HP+MP. No spell slot needed. */
        { id: 'raceTrickRoom', spellType: 'anomaly', element: 'arcane', name: 'Trick Room',
          type: 'utility', cost: 30, range: 0, apCost: 2,
          kind: 'trickRoom', trickRoomDuration: 3,
          desc: 'Warp the flow of time for 3 rounds. Turn order is reversed — the slowest units act first and the fastest act last.' },
        { id: 'racePixieDust', spellType: 'anomaly', element: 'light', name: 'Pixie Dust',
          type: 'buff', cost: 18, range: 3, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'pixieDust', duration: 2 }],
          desc: 'Sprinkle an ally with pixie dust. For 2 turns they move 2 tiles further — a happy thought and off the ground they go.' },
        /* 2026-08-12: reworked from a heal zone into the fairy's damage
           capstone — a ring-shaped blast (aoeShape 'ring': only the 16
           perimeter tiles of the 5×5, the inside is spared). */
        { id: 'raceFaeRing', spellType: 'anomaly', element: 'nature', name: 'Fae Ring',
          type: 'damage', cost: 55, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'aoe', aoeShape: 'ring', aoeRadius: 2, damageType: 'magic',
          desc: 'A ring of toadstools erupts. Deals HEAVY magic damage to All Enemies standing on the ring (the rim of a 5×5 — the center is spared). Never step inside a fairy ring; never stand on one either.' }
    ],
    'reptilian': [
        { id: 'raceShedSkin', spellType: 'anomaly', name: 'Shed Skin',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', cleanse: 1, teleportDistance: 2, spawnDecoy: true,
          desc: 'Leave a decoy, cleanse 1 debuff, teleport 2 tiles away. Decoy draws 1 attack.' },
        { id: 'raceTailWhip', spellType: 'anomaly', name: 'Tail Whip',
          type: 'damage', tier: 'III', cost: 45, dmg: 180, range: 1,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Deals HEAVY physical damage to a Single Enemy. Applies Slow.' },
        SHARED_POISON_SWAMP,
        SHARED_SMOKE_SCREEN
    ],
    'skinwalker': [
        { id: 'raceBorrowedClaw', spellType: 'anomaly', name: 'Borrowed Claw',
          type: 'damage', cost: 25, dmg: 100, range: 1,
          kind: 'damage', damageType: 'physical', stealSpell: true,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Cooldown: 3 rounds.' },
        { id: 'raceSkinSwap', spellType: 'anomaly', name: 'Skin Swap',
          type: 'utility', cost: 25, range: 4, apCost: 1,
          kind: 'swap', requiresLineOfSight: true,
          desc: 'Swaps positions with the target unit.' },
        { id: 'raceMimicry', spellType: 'anomaly', name: 'Mimicry',
          type: 'buff', tier: 'III', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2, def: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages and DEF by 2 stages.' },
        SHARED_SMOKE_SCREEN,
        SHARED_POISON_SWAMP
    ],
    'antperson': [
        { id: 'raceFormicAcid', element: 'poison', spellType: 'alien', name: 'Formic Acid',
          type: 'damage', cost: 22, dmg: 80, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statStageBoost: { def: -1 },
          leaveTerrain: 'poison',
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals WEAK magic damage to All Enemies in a line. Lowers DEF by 1 stage. Deals bonus damage to targets with Poison. Leaves poison behind.' },
        { id: 'raceTunnelNetwork', spellType: 'alien', name: 'Tunnel Network',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployPair', maxActivePerCaster: 1,
          desc: 'Deploys a linked pair of objects.' },
        { id: 'raceSwarmSignal', spellType: 'anomaly', name: 'Swarm Signal',
          type: 'buff', tier: 'III', cost: 20, range: 0, apCost: 1,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 2 },
          desc: 'Empowers All Allies nearby. Raises ATK by 1 stage.' },
        SHARED_POISON_SWAMP,
        SHARED_INFECTIOUS_BITE
    ],
    'scarecrow': [
        { id: 'raceHarvestHook', spellType: 'unholy', name: 'Harvest Hook',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'pull', damageType: 'physical',
          pullDistance: 4, pullThroughHazards: true,
          desc: 'Deals WEAK physical damage to a Single Enemy. Pulls the target toward the caster.' },
        { id: 'raceStuffedDouble', spellType: 'unholy', name: 'Stuffed Double',
          type: 'utility', cost: 15, range: 1, apCost: 1,
          kind: 'deployObject', objectHp: 1, blocksMovement: true,
          drawsRangedAttack: true, drawsMeleeAttack: true, maxActivePerCaster: 1,
          desc: 'Deploys an object on an empty tile.' },
        { id: 'raceCrowStorm', spellType: 'unholy', name: 'Crow Storm',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'discord', duration: 2 }],
          bonusVsStatus: { status: 'hexed', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE and lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to Hexed targets.' },
        SHARED_HEX_OF_TOIL,
        SHARED_SUMMON_SANDSTORM,
    ],
    'bigfoot': [
        { id: 'raceTremorStomp', spellType: 'anomaly', element: 'earth', name: 'Tremor Stomp',
          type: 'damage', cost: 30, dmg: 125, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.' },
        { id: 'raceRealityShift', spellType: 'anomaly', element: 'arcane', name: 'Blurry Photo',
          type: 'buff', cost: 25, range: 0, apCost: 1,
          kind: 'buff', cleanse: 99,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'Empowers the caster. Applies Invisible. Cooldown: 2 rounds.' },
        { id: 'raceBigKick', spellType: 'anomaly', element: 'earth', name: 'Big Kick',
          type: 'damage', cost: 20, dmg: 120, range: 1,
          kind: 'damage', damageType: 'physical',
          desc: 'Deals MEDIUM physical damage to a Single Enemy.' },
        { id: 'raceSasquatchSmash', spellType: 'anomaly', element: 'earth', name: 'Sasquatch Smash',
          type: 'damage', cost: 45, dmg: 180, range: 1, apCost: 2, tier: 'III',
          kind: 'damage', damageType: 'physical',
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. The photo would have been blurry anyway. Deals bonus damage to Staggered targets.' }
    ],
    'siren': [
        { id: 'raceSonicBreaker', element: 'sonic', spellType: 'anomaly', name: 'Sonic Breaker',
          type: 'damage', cost: 30, dmg: 120, range: 4,
          kind: 'linePush', damageType: 'magic', lineWidth: 1, pushDistance: 2,
          bonusVsStatus: { status: 'silence', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to All Enemies in a line and pushes them back. Deals bonus damage to Silenced targets.' },
        { id: 'raceCallOfTheDeep', element: 'water', spellType: 'unholy', name: 'Call of the Deep',
          type: 'damage', tier: 'III', cost: 40, dmg: 160, range: 3, apCost: 2,
          kind: 'terrainCreate', terrainType: 'deep_water', tileCount: 1,
          damageType: 'magic',
          bonusVsStatus: { status: 'silence', mult: 1.5 },
          desc: 'Reshapes the battlefield — creates deep_water across 1 tiles. Deals bonus damage to targets with Silence.' },
        { id: 'raceDeafeningWail', element: 'sonic', spellType: 'anomaly', name: 'Deafening Wail',
          type: 'damage', cost: 30, dmg: 125, range: 0,
          kind: 'aoe', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Silence.' },
        { id: 'raceSonicBoomerang', element: 'sonic', spellType: 'anomaly', name: 'Sonic Boomerang',
          type: 'damage', cost: 35, dmg: 80, range: 4, apCost: 1,
          kind: 'line', damageType: 'magic', lineWidth: 1, boomerang: true,
          desc: 'Hurl a scything crescent of sound down a line — then it comes BACK. Every enemy in its path takes WEAK magic damage on the way out AND again on the return.' },
        SHARED_TIDAL_SURGE
    ],

    'mech': [
        { id: 'raceMortarSalvo', spellType: 'tech', name: 'Mortar Salvo',
          type: 'damage', cost: 40, dmg: 100, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          ignoresLineOfSight: true,
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Fires through cover.' },
        { id: 'raceSiegeMode', spellType: 'tech', name: 'Siege Mode',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'raceEject', spellType: 'tech', name: 'Eject!',
          type: 'utility', cost: 15, range: 0, apCost: 1,
          kind: 'escape', teleportDistance: 3,
          desc: 'EJECT EJECT EJECT! Emergency teleport 3 tiles away.' },
        SHARED_NUKE,
        SHARED_SCORCHED_EARTH
    ],
    'glitch': [
        { id: 'raceCrashLoop', spellType: 'tech', name: 'Crash Loop',
          type: 'damage', cost: 30, dmg: 100, range: 3,
          kind: 'damage', damageType: 'magic',
          repeatOnStay: true, repeatDmg: 112,
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Jammed.' },
        { id: 'raceMemoryLeak', spellType: 'tech', name: 'Memory Leak',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff', statusEffects: [{ id: 'jammed', duration: 2 }],
          desc: 'Weakens a Single Enemy. Applies Jammed.' },
        { id: 'raceBlueScreen', spellType: 'tech', name: 'Blue Screen',
          type: 'debuff', cost: 35, range: 3, apCost: 2,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Stun.' },
        { id: 'raceTimeRewind', spellType: 'tech', element: 'psychic', name: 'Time Rewind',
          type: 'damage', tier: 'III', cost: 35, dmg: 160, range: 4, apCost: 1,
          kind: 'damage', damageType: 'magic',
          echoLastDealt: true,
          desc: 'Deals HEAVY magic damage to a Single Enemy.' },
        SHARED_FISSURE
    ],
    'ai': [
        { id: 'raceOvercalculate', spellType: 'tech', name: 'Overcalculate',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'racePredictiveModel', spellType: 'tech', name: 'Predictive Model',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 35 }],
          desc: 'Weakens a Single Enemy. Applies Marked.' },
        { id: 'raceRecursiveLoop', spellType: 'tech', name: 'Recursive Loop',
          type: 'damage', cost: 30, dmg: 125, range: 3,
          kind: 'damage', damageType: 'magic',
          bonusVsDebuffed: 0.50,
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to debuffed targets.' },
        { id: 'raceSingularity', spellType: 'tech', name: 'Singularity',
          type: 'damage', cost: 60, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'aoePull', damageType: 'magic', aoeRadius: 2, pullToCenter: true, cooldownRounds: 2,
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE and drags them toward the center. The model converged. You were in the gradient.' },
    ],
    /* 2026-07-18: Chassis Slam reworked into Kill Mode (360° weapons-free
       barrage) + new Hydraulic Crush — the robot fights like a Warrior now. */
    'robot': [
        /* id typo raceChassisSlan → raceChassisSlam fixed in the spell-tree
           audit (§7.6); the old id aliases here via the legacy-alias table. */
        /* Robot capstone since the 2026-08-12 capstone pass (empBurst moved to
           the android/droid capstone slot only; robot borrows overclock for
           its ring 2 instead). */
        { id: 'raceChassisSlam', spellType: 'tech', element: 'metal', name: 'Kill Mode',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          desc: 'Weapons free. Deals HEAVY physical damage to All Enemies around the caster (AOE).' },
        { id: 'raceHydraulicCrush', spellType: 'tech', element: 'metal', name: 'Hydraulic Crush',
          type: 'damage', cost: 25, dmg: 135, range: 1,
          kind: 'damage', damageType: 'physical',
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to Jammed targets.' },
        { id: 'raceRocketFist', spellType: 'tech', name: 'Rocket Fist',
          type: 'damage', cost: 25, dmg: 100, range: 3,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Knocks the target back 2 tiles.' },
    ],
    'android': [
        { id: 'raceNeuralHack', spellType: 'tech', name: 'Neural Hack',
          type: 'debuff', cost: 25, range: 3,
          kind: 'debuff', statusEffects: [{ id: 'jammed', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Jammed.' },
        { id: 'raceSelfRepairProtocol', spellType: 'tech', name: 'Self-Repair Protocol',
          type: 'heal', cost: 25, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.35, cleanse: 1,
          desc: 'Restores 35% of the caster\'s max HP.' },
        { id: 'raceSyntheticBlade', spellType: 'tech', name: 'Synthetic Blade',
          type: 'damage', cost: 25, dmg: 100, range: 1,
          kind: 'damage', damageType: 'physical',
          statStageBoost: { def: -1 },
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Lowers DEF by 1 stage. Deals bonus damage to targets with Jammed.' },
        SHARED_SMOKE_SCREEN,
    ],

    /* 2026-07-18: Bulwark Ring deleted from the giant kit (the golem/minotaur
       keep theirs) and Titan Step renamed Fee Fi Fo Fum — the giant is the
       Tank job's flagship race now. */
    'giant': [
        { id: 'raceTitanStep', spellType: 'human', element: 'earth', name: 'Fee Fi Fo Fum',
          type: 'damage', cost: 30, dmg: 125, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.' },
        { id: 'raceBoulderHurl', spellType: 'human', element: 'earth', name: 'Boulder Hurl',
          type: 'damage', cost: 30, dmg: 100, range: 5,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Stagger.' },
        { id: 'raceEarthenGrasp', spellType: 'human', element: 'earth', name: 'Earthen Grasp',
          type: 'damage', cost: 20, dmg: 80, range: 3,
          kind: 'pull', damageType: 'physical', pullDistance: 2, lineOfSight: true,
          groundsFlyers: true,
          statusEffects: [{ id: 'root', duration: 1 }],
          desc: 'Deals WEAK physical damage to a Single Enemy and pulls it toward you. Applies Rooted. Knocks flying enemies out of the sky.' },
        /* SHARED_RAMPART removed 2026-07-18 — the giant's default Tank job
           now carries the class-spell Rampart; the race copy was a duplicate. */
        { id: 'raceColossalCrush', spellType: 'human', element: 'earth', name: 'Colossal Crush',
          type: 'damage', cost: 45, dmg: 180, range: 1, apCost: 2, tier: 'III',
          kind: 'damage', damageType: 'physical',
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy and stamps the ground flat where they stood. Deals bonus damage to Staggered targets.' },
    ],
    'catgirl': [
        { id: 'raceNinefoldScratch', spellType: 'human', element: 'metal', name: 'Ninefold Scratch',
          type: 'damage', tier: 'III', cost: 40, range: 1,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [32, 32, 32, 32, 32],
          desc: 'Deals WEAK physical damage to a Single Enemy across 5 hits.' },
        { id: 'raceNimbleDodge', spellType: 'human', element: 'wind', name: 'Nimble Dodge',
          type: 'utility', cost: 20, apCost: 1, range: 0, cooldownRounds: 3,
          kind: 'escape', teleportDistance: 2,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Gracefully dash 2 tiles away and vanish for 1 turn. Perfect evasive maneuver. Needs 3 rounds between dodges.' },
        { id: 'raceMeow', spellType: 'anomaly', element: 'sonic', name: 'Meow',
          type: 'debuff', cost: 18, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true, noDamage: true,
          statStageBoost: { def: -1 },
          desc: 'An adorable, disarming meow. All enemies within 2 tiles have their DEF lowered for 2 turns. Deals no damage.' },
        { id: 'raceLoveBite', spellType: 'anomaly', element: 'blood', name: 'Love Bite',
          type: 'damage', cost: 22, dmg: 80, range: 1,
          kind: 'damage', damageType: 'physical',
          statStageBoost: { def: -1 },
          desc: 'Deals WEAK physical damage to a Single Enemy. Lowers the target\'s DEF by 1 stage.' },
        SHARED_SMOKE_SCREEN
    ],
    'homosapien': [
        { id: 'raceElbowGrease', spellType: 'human', element: 'metal', name: 'Elbow Grease',
          type: 'damage', cost: 12, dmg: 90, range: 1,
          kind: 'damage', damageType: 'physical',
          desc: 'Deals WEAK physical damage to a Single Enemy. No tricks, no magic — just honest work.' },
        { id: 'raceAdrenalineRush', spellType: 'human', element: 'blood', name: 'Adrenaline Rush',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'selfHeal', selfHealPct: 0.55, cleanse: 2,
          statStageBoost: { spd: 1 },
          desc: 'Restores 55% of the caster\'s max HP. Raises SPD by 1 stage.' },
        { id: 'raceUnderdogSpirit', spellType: 'human', element: 'blood', name: 'Underdog Spirit',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages. Nobody believed in you — good.' },
        { id: 'raceIndomitableWill', spellType: 'human', element: 'blood', name: 'Indomitable Will',
          type: 'buff', cost: 40, apCost: 2, range: 0, tier: 'III',
          kind: 'buff', cooldownRounds: 3,
          statusEffects: [{ id: 'indomitable', duration: 3 }],
          desc: 'Empowers the caster. For 3 rounds, the first blow that would kill you leaves you at 1 HP instead. Humanity\'s only superpower: refusing to die.' }
    ],
    'pirate': [
        { id: 'raceCannonball', spellType: 'tech', element: 'fire', name: 'Cannonball',
          type: 'damage', tier: 'III', cost: 60, dmg: 170, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE. Applies Burn.' },
        { id: 'raceWalkThePlank', spellType: 'human', element: 'water', name: 'Walk the Plank',
          type: 'damage', cost: 35, dmg: 90, range: 3, apCost: 2,
          kind: 'terrainCreate', terrainType: 'deep_water', tileCount: 1, orientable: false,
          damageType: 'physical', executePct: 0.25,
          desc: 'Force enemies overboard. Deep water erupts on one tile, overflowing the ground around it and drowning all caught in the spread. Executes any enemy below 25% HP.' },
        { id: 'racePlunder', spellType: 'human', element: 'metal', name: 'Plunder',
          type: 'utility', cost: 18, dmg: 70, apCost: 1, range: 1,
          kind: 'utility', damageType: 'physical',
          desc: 'Strike an adjacent enemy and steal a random item or 1 hourglass from them.' },
        { id: 'raceYoHo', spellType: 'human', element: 'water', name: 'Yo Ho',
          type: 'heal', cost: 35, range: 0, apCost: 2,
          kind: 'healAll', healAmt: 130, cleanse: 2,
          statStageBoost: { atk: 1, int: -1 },
          desc: 'Restores a MEDIUM amount of HP to All Allies. Lowers M ATK by 1 stage. Raises ATK by 1 stage.' },
        _mkCharge({ id: 'raceBoardingRush', spellType: 'human', element: 'metal', name: 'Land Ho',
          swapOnHit: true,
          bonusVsStatus: { status: 'root', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Rooted. The caster charges into melee first.', dmg: 130 }),
        { id: 'raceAnchor', spellType: 'human', element: 'metal', name: 'Anchor',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          groundsFlyers: true,
          statusEffects: [{ id: 'root', duration: 2 }],
          desc: 'Weakens a Single Enemy. Applies Rooted.' },
        { id: 'raceGrapple', spellType: 'human', element: 'metal', name: 'Grapple',
          type: 'utility', cost: 20, apCost: 1, range: 3,
          kind: 'utility',
          desc: 'Fire a grappling hook. Pull target enemy 2 tiles toward you and reel them in for a hit, or pull yourself toward a wall.' },
    ],
    // Swordfighter (2026-07-13, reworked same day) — the anime-protagonist
    // duelist: a tragic past, an unkillable narrative, and a blade the story
    // itself has blessed. The Swordmaster job's flagship vessel.
    'swordfighter': [
        { id: 'raceSadBackstory', spellType: 'human', element: 'psychic', name: 'Sad Backstory',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'racePlotArmor', spellType: 'human', element: 'light', name: 'Plot Armor',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { def: 2 },
          desc: 'Empowers the caster. Raises DEF by 2 stages.' },
        { id: 'raceToBeContinued', spellType: 'human', element: 'metal', name: 'To Be Continued',
          type: 'damage', cost: 35, dmg: 135, range: 3, apCost: 1,
          kind: 'damage', damageType: 'physical',
          delayedMark: true, markDelayRounds: 1, requireVision: false,
          projectileOverride: 'proj-knife',
          impactSfx: 'physicalAbility',
          markFloatText: '➡ TO BE CONTINUED',
          markLogText: 'freezes the frame on {target} — the episode resumes at the end of the round, and the finishing strike lands with it.',
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Marks the target: the hit lands at the end of the round, but only while your team can still see them.' },
        { id: 'raceBlessedBlade', spellType: 'divine', element: 'light', name: 'Blessed Blade',
          type: 'damage', tier: 'III', cost: 55, dmg: 170, range: 1,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE.' },
    ],

    'knight': [
        SHARED_WALLS_OF_CAMELOT,
        { id: 'raceOathOfValor', spellType: 'divine', element: 'light', name: 'Oath of Valor',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'warCry', auraRadius: 2,
          statStageBoost: { atk: 2 },
          desc: 'Empowers All Allies nearby. Raises ATK by 2 stages.' },
        { id: 'raceChivalry', spellType: 'human', element: 'light', name: 'Chivalry',
          type: 'utility', cost: 15, apCost: 1, range: 4,
          kind: 'guard', cooldownRounds: 2,
          desc: 'Pledge to protect an ally. The next time that ally is targeted by an attack, you dash to their side and take the hit in their place.' },
        { id: 'raceCrusade', spellType: 'divine', element: 'light', name: 'Crusade',
          type: 'damage', cost: 60, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'cross', crossRadius: 2, damageType: 'magic',
          unholyBonus: 60,
          desc: 'Deals HEAVY magic damage to All Enemies in a cross-shaped AOE. Deals bonus damage to Unholy targets. Deus vult.' }
    ],
    'shaman': [
        { id: 'raceSpiritWalk', spellType: 'anomaly', element: 'psychic', name: 'Spirit Walk',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 4,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Enter the spirit world briefly. Teleport up to 4 tiles and become invisible for 1 turn.' },
        { id: 'raceHerbalRemedy', spellType: 'human', element: 'nature', name: 'Herbal Remedy',
          type: 'heal', cost: 25, range: 3, apCost: 1,
          kind: 'heal', healAmt: 160, cleanse: 2,
          desc: 'Restores a MEDIUM amount of HP to a Single Ally.' },
        /* Demoted from capstone 2026-08-12 (Bad Trip is the capstone now) —
           single-stat per §2.1, the heal+cleanse stays its identity. */
        { id: 'raceAyahuascaRetreat', spellType: 'anomaly', element: 'nature', name: 'Ayahuasca Retreat',
          type: 'buff', cost: 35, apCost: 2, range: 0,
          kind: 'buff',
          selfHealPct: 0.50, cleanse: 99,
          statStageBoost: { mdef: 2 },
          desc: 'Empowers the caster. Raises M DEF by 2 stages.' },
        /* Shaman capstone since the 2026-08-12 capstone pass. */
        { id: 'raceBadTrip', spellType: 'anomaly', element: 'psychic', name: 'Bad Trip',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 3,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'slow', duration: 1 }],
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Applies Slow. Deals bonus damage to targets with Slow.' },
        SHARED_HEX_OF_TOIL,
        SHARED_EGO_DEATH,
    ],
    'mad scientist': [
        { id: 'raceTeslaTrap', spellType: 'tech', element: 'lightning', name: 'Tesla Coil',
          type: 'utility', cost: 20, apCost: 1, range: 2,
          kind: 'deployObject',
          objectHp: 20, blastRadius: 1, blastDmg: 130,
          detonateOnStep: true, maxActivePerCaster: 3,
          desc: 'Deploy an electrified coil. Detonates when an enemy steps on it. 3×3 shock damage. Placing on an empty tile never ends your turn or uses your spell slot; throwing it directly onto an enemy shocks them on contact and ends your turn.' },
        { id: 'racePlandemic', spellType: 'tech', element: 'poison', name: 'Plandemic',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Applies Poison.' },
        { id: 'raceCloneDecoy', spellType: 'tech', element: 'metal', name: 'Cloning Machine',
          type: 'utility', cost: 20, apCost: 1, range: 1,
          kind: 'deployObject',
          objectHp: 100, maxActivePerCaster: 1,
          drawsRangedAttack: true, drawsMeleeAttack: true,
          desc: 'Print a decoy clone on an adjacent tile. It draws enemy attention but cannot attack. Placing never uses your spell slot.' },
        { id: 'raceOvercharge', spellType: 'tech', element: 'poison', name: 'Chemical Bath',
          type: 'damage', cost: 75, dmg: 125, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Burn. Deals bonus damage to targets with Poison.' },
        SHARED_SHRINK_RAY,
        /* 2026-07-23: Free Energy left the Engineer school — only the Mad
           Scientist cracked zero-point energy. (Same id: VFX/saves intact.) */
        { id: 'freeEnergy', spellType: 'divine', element: 'lightning', name: 'Free Energy',
          type: 'heal', cost: 40, mpRestore: 35, range: 0,
          kind: 'manaRestoreAll',
          desc: 'Restores MP to All Allies.' }
    ],
    'cowboy': [
        { id: 'raceFanTheHammer', spellType: 'human', element: 'metal', name: 'Fan the Hammer',
          type: 'damage', cost: 28, dmg: 100, range: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          projectileOverride: 'proj-bullet',
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE.' },
        { id: 'raceLasso', spellType: 'human', element: 'metal', name: 'Lasso',
          type: 'utility', cost: 15, apCost: 1, range: 3,
          kind: 'pull', pullDistance: 2,
          groundsFlyers: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Rope an enemy and yank them 2 tiles toward you. Staggers on hit, and hauls flyers down to the dirt where they belong.' },
        { id: 'raceQuickDraw', spellType: 'human', element: 'metal', name: 'Quick Draw',
          type: 'damage', cost: 20, dmg: 125, range: 3,
          kind: 'damage', damageType: 'physical',
          projectileOverride: 'proj-bullet',
          desc: 'Deals MEDIUM physical damage to a Single Enemy.' },
        { id: 'raceHighNoon', spellType: 'human', element: 'metal', name: 'High Noon',
          type: 'damage', cost: 50, dmg: 180, range: 4, apCost: 2, tier: 'III',
          kind: 'damage', damageType: 'physical',
          guaranteedCrit: true,
          projectileOverride: 'proj-bullet',
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. Always lands a critical hit. The clock strikes twelve. Deals bonus damage to Staggered targets.' },
    ],
    'men in black': [
        _mkBolt(_JAM_BOLT, { id: 'raceDeneuralizer', spellType: 'tech', element: 'psychic', name: 'Deneuralizer' }),
        { id: 'raceClassifiedWeapon', spellType: 'tech', element: 'lightning', name: 'Classified Weapon',
          type: 'damage', tier: 'III', cost: 50, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Jammed targets.' },
        { id: 'raceAgentVanish', spellType: 'tech', element: 'shadow', name: 'Agent Vanish',
          type: 'utility', cost: 15, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'You didn\'t see anything. Teleport 3 tiles and go invisible for 2 turns.' },
        SHARED_SMOKE_SCREEN
    ],
    'telepath': [
        { id: 'raceMindCrush', spellType: 'anomaly', element: 'psychic', name: 'Migraine',
          type: 'damage', tier: 'III', cost: 50, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          statStageBoost: { int: -1 },
          bonusVsStatus: { status: 'discord', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Lowers M ATK by 1 stage. Deals bonus damage to targets with Discord.' },
        { id: 'raceTelepathicLink', spellType: 'human', element: 'psychic', name: 'Telepathic Link',
          type: 'buff', cost: 20, range: 3, apCost: 1,
          kind: 'warCry', auraRadius: 3,
          statStageBoost: { int: 2 },
          desc: 'Empowers All Allies nearby. Raises M ATK by 2 stages.' },
        { id: 'racePsychicBarrier', spellType: 'anomaly', element: 'psychic', name: 'Psychic Barrier',
          type: 'buff', cost: 25, range: 3, apCost: 1,
          kind: 'buff',
          shield: 150,
          desc: 'Project a telekinetic shield onto an ally. Absorbs 150 damage before breaking.' },
        _mkBolt(_DISCORD_BOLT, { id: 'raceBrainwash', spellType: 'anomaly', element: 'psychic', name: 'Brainwash' }),
    ],
    /* raceSuppressingFire (near-duplicate id of raceSuppressiveFire) was
       MERGED into this one line spell (spell-tree audit §7.6); the old id
       aliases here via the legacy-alias table below. */
    'marksman': [
        { id: 'raceSuppressiveFire', spellType: 'human', element: 'metal', name: 'Suppressive Fire',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'line', damageType: 'physical', lineWidth: 1,
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Deals WEAK physical damage to All Enemies in a line. Applies Slow.' },
        SHARED_SMOKE_SCREEN,
        { id: 'raceRangefinder', spellType: 'human', element: 'metal', name: 'Rangefinder',
          type: 'utility', cost: 20, range: 8, apCost: 1,
          kind: 'remoteView',
          desc: 'Glass a distant area of the map, granting vision for several turns. Every barrage starts with a spotter.' },
        { id: 'raceFireForEffect', spellType: 'human', element: 'fire', name: 'Fire for Effect',
          type: 'damage', cost: 60, dmg: 160, range: 6, apCost: 2, tier: 'III',
          kind: 'delayed', damageType: 'physical', aoeRadius: 2, delayTurns: 1,
          leaveTerrain: 'scorched',
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Calls in the whole battery on a marked grid. After 1 turn, deals HEAVY physical damage to All Enemies inside (AOE). Leaves scorched tiles behind. Reshapes the ground on impact. Deals bonus damage to Slowed targets.' }
    ],
    'priest': [
        { id: 'raceDivineLight', spellType: 'divine', name: 'Divine Light',
          type: 'heal', cost: 25, range: 3, apCost: 1,
          kind: 'heal', healAmt: 140,
          desc: 'Restores a MEDIUM amount of HP to a Single Ally.' },
        { id: 'raceAbsolution', spellType: 'divine', name: 'Absolution',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'heal', healAmt: 80, cleanse: 99,
          desc: 'Restores a SMALL amount of HP to a Single Ally.' },
        SHARED_SANCTUARY,
        SHARED_SMITE,
        /* 2026-07-23: Exorcism is Priest/Nun-only now (was White Mage school).
           Same id — VFX, sounds and old loadouts keep working. */
        { id: 'exorcism', spellType: 'divine', element: 'light', name: 'Exorcism',
          type: 'damage', tier: 'III', cost: 35, dmg: 160, range: 3,
          kind: 'damage', damageType: 'magic',
          unholyBonus: 80,
          /* 2026-08-10: the anti-curse finisher — Exorcism collects on
             infernal Contracts and Hexes (list = either status triggers). */
          bonusVsStatus: { status: ['contract', 'hexed'], mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Contracted or Hexed targets — the rite burns the curse out of them. Deals bonus damage to Unholy targets.' },
    ],
    'wizard': [
        /* 2026-07-17 shape pass: was the 16th identical 3×3 nuke. Now the
           wizard paints an X-shaped sigil — diagonal arms 3 tiles each way,
           the user-requested "X, 3 tiles in each direction". */
        { id: 'raceArcaneBlast', spellType: 'unholy', element: 'arcane', name: 'Arcane Sigil',
          type: 'damage', cost: 38, dmg: 100, range: 4,
          kind: 'cross', diagonal: true, crossRadius: 3, damageType: 'magic',
          desc: 'Deals MEDIUM magic damage to All Enemies in an X-shaped AOE.' },
        { id: 'raceSpellsteal', spellType: 'unholy', element: 'arcane', name: 'Spellsteal',
          type: 'debuff', cost: 25, range: 4, apCost: 1, cooldownRounds: 3,
          kind: 'debuff', stealSpell: true,
          desc: 'Reach into an enemy\'s mind and rip out a spell. Steal one of the target\'s spells — they lose it, you learn it.' },
        /* (Mana Shield deleted 2026-08-12 — Hocus Pocus took its tree slot.) */
        { id: 'racePolymorph', spellType: 'unholy', element: 'arcane', name: 'Polymorph',
          type: 'debuff', cost: 55, range: 4, apCost: 2,
          kind: 'debuff', cooldownRounds: 3,
          statStageBoost: { atk: -2, int: -2 },
          desc: 'Transmute an enemy into something small and harmless. Lowers the target\'s ATK by 2 stages and M ATK by 2 stages. Ribbit.' },
        /* Wizard capstone since the 2026-08-12 capstone pass (was Polymorph). */
        { id: 'raceHocusPocus', spellType: 'unholy', element: 'arcane', name: 'Hocus Pocus',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          desc: 'The old words, spoken like they mean it. Deals HEAVY magic damage to a Single Enemy.' }
    ],
    'fortune teller': [
        { id: 'raceTarotDraw', spellType: 'anomaly', element: 'arcane', name: 'Tarot Draw',
          type: 'buff', cost: 25, apCost: 1, range: 0, cooldownRounds: 3,
          kind: 'warCry', auraRadius: 99,
          randomTeamBuff: { stats: ['atk', 'int', 'def', 'mdef'], stages: 1 },
          desc: 'Empowers All Allies nearby. Raises a random stat of every ally by 1 stage. Cooldown: 3 rounds.' },
        { id: 'raceStarCrossed', spellType: 'anomaly', element: 'arcane', name: 'Star Crossed',
          type: 'debuff', cost: 25, dmg: 70, range: 4, apCost: 1,
          kind: 'debuff', damageType: 'magic', zodiacReading: true,
          desc: 'Read the target\'s birth chart and turn their own stars against them. Magic damage plus an affliction by their zodiac: Fire signs burn, Earth signs are rooted and exposed, Air signs are silenced, Water signs grow drowsy. +50% damage if their sign rules the sky.' },
        { id: 'raceCurseOfMisfortune', spellType: 'anomaly', element: 'shadow', name: 'Family Curse',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'hexed', duration: 3 }],
          desc: 'Weakens a Single Enemy. Applies Hexed.' },
        { id: 'raceCrystalBall', spellType: 'anomaly', element: 'arcane', name: 'Crystal Ball',
          type: 'damage', tier: 'III', cost: 100, dmg: 160, range: 5, apCost: 1,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          bonusVsStatus: { status: 'hexed', mult: 1.5 },
          desc: 'Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Deals bonus damage to Hexed targets.' },
        { id: 'raceSpiritChannel', spellType: 'anomaly', element: 'psychic', name: 'Palm Read',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'heal', healAmt: 190, cleanse: 2,
          desc: 'Restores a LARGE amount of HP to a Single Ally.' },
        SHARED_HEX_OF_TOIL
    ],

    'martian': [
        /* 2026-07-23 beam de-duplication: no longer the 4th identical line
           spell — now a focused single-target death ray that burns. */
        { id: 'raceHeatRay', spellType: 'alien', element: 'fire', name: 'Heat Ray',
          type: 'damage', cost: 30, dmg: 100, range: 5,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Burn.' },
        /* 2026-08-12: reworked from a tripod turret deploy into the UFO-swarm
           strike the name always promised (round 5×5-minus-corners AOE). */
        { id: 'raceWarOfTheWorlds', spellType: 'alien', element: 'metal', name: 'War of the Worlds',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4, apCost: 2,
          kind: 'aoe', aoeShape: 'round', aoeRadius: 2, damageType: 'magic',
          desc: 'The sky fills with saucers. A UFO swarm strafes the zone, dealing HEAVY magic damage to All Enemies in a wide AOE. No one would have believed it.' },
        SHARED_SHRINK_RAY,
        SHARED_LOW_GRAVITY,
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_SANDSTORM
    ],
    'annunaki': [
        { id: 'raceStarDecree', spellType: 'alien', element: 'light', name: 'Star Decree',
          type: 'damage', tier: 'III', cost: 40, dmg: 160, range: 3,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Deals bonus damage to Slowed targets.' },
        { id: 'raceGravityWell', spellType: 'alien', element: 'arcane', name: 'Gravity Well',
          type: 'damage', cost: 30, dmg: 80, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          groundsFlyers: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Deals WEAK magic damage to All Enemies in an AOE and pulls them toward the center. Applies Slow. Knocks flying enemies out of the sky.' },
        { id: 'raceZigguratProtocol', spellType: 'alien', element: 'earth', name: 'Ziggurat Protocol',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
          dmg: 80, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Reshapes the battlefield — creates mountain across 3 tiles (pick the orientation).' },
        SHARED_GRAVITY_CRUSH,
        SHARED_FISSURE
    ],
    /* Nordic = Nordic ALIENS (Tall Blondes / Galactic Federation), not Norse
       myth. Kit theme: light-tech, psychic calm, stasis — benevolent but
       unsettling. Playstyle: a frontline Warrior who trades raw damage for
       precise light beams, hard single-target lockdown, and team serenity. */
    'nordic': [
        { id: 'raceAuroraRay', spellType: 'alien', element: 'light', name: 'Aurora Ray',
          // 2026-07-10 rework: was a 1-wide line beam that rarely caught more
          // than one target (20% win rate in the sim stats). Now a ranged
          // 3×3 sky-strike — a curtain of aurora descends on the marked area.
          type: 'damage', cost: 25, dmg: 100, range: 5,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statStageBoost: { def: -1 },
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Lowers DEF by 1 stage. Deals bonus damage to targets with Stun.' },
        { id: 'raceResonancePulse', spellType: 'alien', element: 'sonic', name: 'Resonance Pulse',
          // 2026-07-10 rework: full diamond nova (Manhattan radius 2, 12 tiles)
          // instead of the old 4-tile cross — `diamond: true` flips the shape.
          type: 'damage', cost: 25, dmg: 135, range: 0,
          kind: 'cross', damageType: 'magic', crossRadius: 2, diamond: true, aoeOriginSelf: true,
          pushDistance: 1,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in a diamond-shaped AOE. Applies Slow.' },
        { id: 'raceStasisBeam', spellType: 'alien', element: 'light', name: 'Stasis Beam',
          type: 'debuff', cost: 30, range: 4, apCost: 1,
          kind: 'debuff',
          groundsFlyers: true,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Stun.' },
        { id: 'raceFederationBeacon', spellType: 'alien', element: 'light', name: 'Federation Beacon',
          // 2026-07-10 rework: regen now pulses at the START of each ally's
          // turn (healOnTurnStart, see _continueBlitzWithUnit_impl) instead of
          // end-of-round, and the radius grew 2 → 4.
          type: 'utility', cost: 25, apCost: 1, range: 2,
          kind: 'deployObject',
          objectHp: 70, maxActivePerCaster: 1,
          auraHeal: 40, auraRadius: 4, healOnTurnStart: true,
          desc: 'Plant a pylon of Pleiadian light. At the start of each ally\'s turn within 4 tiles, the beacon pulses 40 HP of regeneration into them. Placing never uses your spell slot. The mothership is watching.' },
        { id: 'racePleiadianShield', spellType: 'alien', element: 'light', name: 'Pleiadian Shield',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 220,
          statStageBoost: { def: 2 },
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE. Raises DEF by 2 stages.' },
        { id: 'raceNordicAccord', spellType: 'alien', element: 'psychic', name: 'Nordic Accord',
          type: 'buff', tier: 'III', cost: 40, apCost: 1, heal: 0, range: 0,
          kind: 'healAll',
          statStageBoost: { mdef: 1, int: 1 },
          desc: 'Empowers All Allies. Raises M DEF by 1 stage and M ATK by 1 stage.' }
    ],
    'grey': [
        { id: 'raceProbe', spellType: 'alien', element: 'psychic', name: 'Probe',
          type: 'damage', cost: 20, range: 4, apCost: 1,
          kind: 'damage', damageType: 'magic', dmg: 100,
          desc: 'Deals MEDIUM magic damage to a Single Enemy.' },
        { id: 'raceAbductionBeam', spellType: 'alien', element: 'light', name: 'Abduction Beam',
          type: 'damage', cost: 30, dmg: 110, range: 4, apCost: 1,
          kind: 'skyThrow', damageType: 'magic', carryHeight: 5, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          desc: 'Lift an enemy into your craft with a telekinetic tractor beam, then drop them. Fall damage scales with the drop; bonus damage if they land on another unit.' },
        { id: 'raceImplant', spellType: 'alien', element: 'metal', name: 'Implant',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 30 }],
          desc: 'Weakens a Single Enemy. Applies Marked.' },
        { id: 'raceCropCircle', spellType: 'alien', element: 'nature', name: 'Crop Circle',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'magic', aoeRadius: 2,
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Reshapes the ground on impact.' },
        SHARED_GRAVITY_CRUSH,
        SHARED_LOW_GRAVITY
    ],
    'mantid': [
        { id: 'raceMandibleStrike', spellType: 'alien', name: 'Mandible Strike',
          type: 'damage', cost: 25, range: 1,
          kind: 'multiHit', damageType: 'physical', hitDamages: [45, 45, 45],
          desc: 'Deals MEDIUM physical damage to a Single Enemy across 3 hits.' },
        { id: 'raceChitinArmor', spellType: 'alien', name: 'Chitin Armor',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          desc: 'Empowers the caster. Raises DEF by 2 stages.' },
        _mkCharge({ id: 'raceAmbushLunge', spellType: 'alien', name: 'Ambush Lunge', dmg: 125, desc: 'Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.' }),
        { id: 'raceFractalNeedle', spellType: 'alien', element: 'arcane', name: 'Fractal Needle',
          type: 'damage', tier: 'III', cost: 45, dmg: 170, range: 4,
          kind: 'splitBeam', damageType: 'magic',
          splitCount: 2, splitDmg: 84, splitRadius: 2,
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in a line. Splits into smaller beams that seek nearby enemies. Deals bonus damage to Stunned targets.' },
        SHARED_POISON_SWAMP,
    ],
    'djinn': [
        { id: 'raceDustDevil', spellType: 'alien', name: 'Dust Devil',
          type: 'damage', cost: 35, dmg: 80, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals WEAK magic damage to All Enemies in an AOE and pulls them toward the center. Deals bonus damage to Stunned targets.' },
        /* Demoted from capstone 2026-08-12 (Ancient Magic is the capstone now)
           — single-stat per §2.1. */
        { id: 'raceWishGranted', spellType: 'divine', name: 'Wish Granted',
          type: 'buff', cost: 30, apCost: 1, range: 3,
          kind: 'buff', cleanse: 2,
          statStageBoost: { atk: 2 },
          desc: 'Empowers a Single Ally. Raises ATK by 2 stages.' },
        /* (Sandglass Prison deleted 2026-08-12 — Ancient Magic took its tree
           slot.) Djinn capstone since the 2026-08-12 capstone pass. */
        { id: 'raceAncientMagic', spellType: 'divine', name: 'Ancient Magic',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          desc: 'Magic older than the lamp, older than the sands. Deals HEAVY magic damage to a Single Enemy.' },
        SHARED_SUMMON_SANDSTORM,
    ],
    /* Machine Elves = the clockwork "machine elves" of DMT hyperspace, who
       refract reality through a lattice of laser-reflecting prism mirrors.
       Kit theme: place prism mirrors that auto-connect with light beams, tune
       the beams' frequency, then discharge the whole lattice. A zoning/combo
       engineer that shapes space with light rather than out-nuking. (Inspired
       by the "DMT laser" experiment and mirror-and-laser science kits.)
       His old kit was rehomed so nothing is wasted: Fractal Needle → mantid,
       Dimensional Fold → voidweaver, Bad Trip → shaman, Sacred Geometry →
       occulus. */
    'machine elves': [
        { id: 'racePrismMirror', spellType: 'tech', element: 'arcane', name: 'Prism Mirror',
          type: 'utility', cost: 16, range: 4, apCost: 1,
          kind: 'placeMirror', maxActivePerCaster: 8, mirrorHp: 2,
          desc: 'Fold a laser-reflecting prism into being on an empty tile (up to 8) for just 1 AP. Folding never ends your turn or uses your spell slot, so you can fold another, Pulse Lattice, move or attack with the AP you have left. Beams auto-connect any of your prisms that share a row or column — enemies that path through a beam are seared, and enemies still standing in one at end of round take burn damage. A prism is sturdy glass: it takes two hits to shatter.' },
        { id: 'raceTuneFrequency', spellType: 'tech', element: 'arcane', name: 'Tune Frequency',
          type: 'utility', cost: 8, range: 0, apCost: 1, cooldownRounds: 1,
          kind: 'tuneFrequency',
          desc: 'Shift your whole lattice to the next light frequency — Infrared (fire, burns), Ultraviolet (arcane, shreds DEF), or Gamma (charged, slows) — changing what every one of your beams does. Only once per round.' },
        { id: 'racePulseLattice', spellType: 'tech', element: 'arcane', name: 'Pulse Lattice',
          type: 'damage', cost: 30, range: 0, apCost: 2, cooldownRounds: 2,
          kind: 'pulseLattice',
          desc: 'Discharge the lattice (needs 3+ prisms): every enemy caught on a beam takes a burst in the current frequency. 4+ prisms across 2+ elevations enclose a 3-D volume — everyone inside is hit and the burst is amplified. 8 prisms in a perfect rectangular prism unleash a massive detonation through the whole volume.' },
        /* (Refract Beam was CUT 2026-07-23 in the beam de-duplication pass —
           the prism lattice already IS the machine elves' laser identity.) */
        _mkBlink('short', { id: 'raceMirrorBlink', spellType: 'alien', element: 'arcane', name: 'Mirror Blink',
          desc: 'Fold through the light and blink to any tile within 3 — reposition inside your own lattice, or slip out of a collapsing trap.' }),
        SHARED_EGO_DEATH,
    ],
    'cyclops': [
        { id: 'raceBalefulGaze', spellType: 'alien', name: 'Baleful Gaze',
          type: 'damage', cost: 30, dmg: 130, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1, destroysObstacles: true,
          desc: 'Deals MEDIUM magic damage to All Enemies in a line.' },
        { id: 'raceGiantSmash', spellType: 'alien', name: 'Giant Smash',
          type: 'damage', tier: 'III', cost: 50, dmg: 170, range: 2,
          kind: 'dash', damageType: 'physical',
          dashDamage: 56,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Charges at a Single Enemy, dealing HEAVY physical damage. Enemies along the path also take damage. Applies Stun.' },
        { id: 'raceStoneThrow', element: 'earth', spellType: 'alien', name: 'Stone Throw',
          type: 'damage', cost: 25, dmg: 100, range: 5,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Stun. Fires through cover.' },
        { id: 'raceTitanDrop', spellType: 'anomaly', name: 'Titan Drop',
          type: 'damage', cost: 25, dmg: 125, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 25,
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Leaps to a Single Enemy, dealing MEDIUM physical damage.' }
    ],

    'cyborg': [
        /* (raceOverclock merged into the Engineer class spell 'overclock'
           2026-08-03 — same-name duplicate. Cyborg borrows 'overclock' via
           the movepool-share table; old id aliases to it.) */
        { id: 'raceEMPGrenade', element: 'lightning', spellType: 'tech', name: 'EMP Grenade',
          type: 'damage', cost: 30, dmg: 100, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'jammed', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Jammed.' },
        { id: 'raceHydraulicPunch', spellType: 'tech', name: 'Synthetic Punch',
          type: 'damage', cost: 25, dmg: 100, range: 1,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Jammed. Knocks the target back 2 tiles.' },
        /* Cyborg capstone since the 2026-08-12 capstone pass (was overclock). */
        { id: 'raceRocketToss', spellType: 'tech', name: 'Rocket Toss',
          type: 'damage', tier: 'III', cost: 55, dmg: 150, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          requiresFlight: true,
          desc: 'Grabs the target, carries it skyward and hurls it up to 3 tiles. Deals HEAVY physical damage, more if they crash into another unit. Caster must be flying.' },
    ],
    'demon prince': [
        { id: 'raceDarkDominion', spellType: 'unholy', name: 'Dark Dominion',
          type: 'damage', tier: 'III', cost: 35, dmg: 170, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Applies Burn. Deals bonus damage to Staggered targets.' },
        { id: 'raceDemonicRoar', spellType: 'unholy', name: 'Demonic Roar',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'aoe', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Terrifying roar. All enemies within 2 tiles are staggered, losing 1 AP.' },
        { id: 'raceInfernalConscription', spellType: 'unholy', name: 'Infernal Conscription',
          type: 'debuff', cost: 35, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }],
          desc: 'Weakens a Single Enemy. Applies Marked.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_BLOOD_RAIN
    ],
    'demon princess': [
        SHARED_HEX_OF_TOIL,
        { id: 'raceDarkLullaby', spellType: 'unholy', name: 'Dark Lullaby',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'silence', duration: 1 }],
          bonusVsStatus: { status: 'silence', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Applies Silence. Deals bonus damage to targets with Silence.' },
        /* Ring-3 payoff since 2026-08-16 (was ring 1 — top-10 dmg/MP in
           stats18 at 25 MP): the drain kiss now prices as tier II. */
        { id: 'raceKissOfDecay', element: 'poison', spellType: 'unholy', name: 'Kiss of Decay',
          type: 'damage', cost: 75, dmg: 100, range: 2, tier: 'II',
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          statusEffects: [{ id: 'poison', duration: 2 }],
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Poison. Deals bonus damage to targets with Poison. Heals the caster for part of the damage dealt.' },
        SHARED_POISON_SWAMP,
        SHARED_SUMMON_BLOOD_RAIN
    ],
    'dreameater': [
        { id: 'raceDreamSiphon', spellType: 'alien', name: 'Dream Siphon',
          type: 'damage', cost: 30, dmg: 100, range: 3,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Stun. Heals the caster for part of the damage dealt.' },
        { id: 'raceNightmarePulse', spellType: 'alien', name: 'Nightmare Pulse',
          type: 'damage', cost: 35, dmg: 125, range: 0,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1, aoeOriginSelf: true,
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE.' },
        { id: 'raceLucidTrap', spellType: 'alien', name: 'Lucid Trap',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployObject', objectHp: 1, blocksMovement: false,
          detonateOnStep: true, blastRadius: 0, blastDmg: 0,
          maxActivePerCaster: 1,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Place a dream snare. First enemy to step on it is stunned 1 turn. Placing on an empty tile never ends your turn or uses your spell slot; placing it directly onto an enemy springs it instantly and ends your turn. You\'re still dreaming.' },
        { id: 'raceEternalSlumber', spellType: 'alien', element: 'psychic', name: 'Eternal Slumber',
          type: 'damage', cost: 60, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'aoe', damageType: 'magic', aoeRadius: 2, cooldownRounds: 2,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE and drags them under — Stunned for 1 turn. Sleep now. The dream will finish eating on its own.' }
    ],
    'fallen angel': [
        { id: 'raceFallenGrace', spellType: 'divine', name: 'Fallen Grace',
          type: 'damage', cost: 35, dmg: 100, range: 4,
          kind: 'cross', damageType: 'magic', crossRadius: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an X-shaped AOE. Applies Burn.' },
        { id: 'raceAbyssalWings', spellType: 'unholy', name: 'Abyssal Wings',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          desc: 'Empowers the caster. Applies Protect. Cooldown: 2 rounds.' },
        SHARED_SANCTUARY,
        { id: 'raceDescendingWrath', spellType: 'unholy', name: 'Descending Wrath',
          type: 'damage', tier: 'III', cost: 35, dmg: 160, range: 1, apCost: 2,
          kind: 'skySlam', damageType: 'magic', carryHeight: 5, dmgPerLevel: 25,
          requiresFlight: true,
          statusEffects: [{ id: 'burn', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Dives from the sky onto the target, dealing HEAVY magic damage. Applies Burn. Deals bonus damage to targets with Burn. Caster must be flying.' },
        SHARED_SUMMON_BLOOD_RAIN,
        SHARED_SCORCHED_EARTH,
        SHARED_WING_ATTACK
    ],
    'goatman': [
        _mkCharge({ id: 'raceGoreCharge', spellType: 'unholy', name: 'Gore Charge',
          cost: 30, statusEffects: _STAGGER_1,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Stagger. The caster charges into melee first.', dmg: 100 }),
        { id: 'raceBloodRitual', spellType: 'anomaly', name: 'Blood Ritual',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', selfDamagePct: 0.10,
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages. Costs a portion of your HP.' },
        { id: 'raceCliffCharge', spellType: 'unholy', name: 'Cliff Charge',
          type: 'damage', cost: 25, dmg: 100, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Leaps to a Single Enemy, dealing MEDIUM physical damage.' },
        { id: 'raceBaphometsRite', spellType: 'unholy', element: 'fire', name: 'Baphomet\'s Rite',
          type: 'damage', cost: 45, dmg: 160, range: 4, apCost: 2, tier: 'III',
          kind: 'aoe', damageType: 'magic', aoeRadius: 1, selfDamagePct: 0.15,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Offer your own blood and speak the name. Deals HEAVY magic damage to All Enemies in an AOE. Costs a portion of your HP — the goat always collects. Deals bonus damage to Staggered targets.' }
    ],
    'halfdemon': [
        _mkBlink('shadow', { id: 'raceShadowStep', spellType: 'unholy', element: 'shadow', name: 'Shadow Step',
          desc: 'Blink through shadow up to 4 tiles. Ignores line of sight. Needs 2 rounds to gather shadow between blinks.' }),
        /* Halfdemon capstone since the 2026-08-12 capstone pass (was Inner
           Demon). */
        { id: 'raceDemonicClaw', spellType: 'human', element: 'shadow', name: 'Demonic Claw',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 30 }],
          desc: 'Deals HEAVY physical damage to a Single Enemy. Applies Marked.' },
        _mkCharge({ id: 'raceShadowInfiltration', spellType: 'unholy', element: 'shadow', name: 'Shadow Infiltration',
          kind: 'dash', apCost: 2, statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Charges at a Single Enemy, dealing MEDIUM physical damage. Applies Poison.' }),
        /* Demoted from capstone 2026-08-12 (Demonic Claw is the capstone now)
           — single-stat per §2.1. */
        { id: 'raceInnerDemon', spellType: 'unholy', element: 'shadow', name: 'Inner Demon',
          type: 'buff', cost: 25, apCost: 1, range: 0, cooldownRounds: 2,
          kind: 'buff', selfDamagePct: 0.20,
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages. Costs a portion of your HP. Cooldown: 2 rounds.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SMOKE_SCREEN
    ],
    'mermaid': [
        { id: 'raceTidalBlessing', spellType: 'anomaly', name: 'Tidal Blessing',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 52,
          desc: 'Creates a zone that heals allies standing inside it each turn.' },
        { id: 'raceSirenSong', spellType: 'anomaly', name: 'Siren Song',
          type: 'utility', cost: 25, range: 4, apCost: 1,
          kind: 'pull', pullDistance: 3, pullThroughHazards: true, lineOfSight: true,
          groundsFlyers: true,
          desc: 'An irresistible melody hooks a Single Enemy and drags it up to 3 tiles toward the siren — straight through any hazards on the way, and flyers are sung right out of the sky.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE
    ],
    'nephilim': [
        { id: 'raceHolyBulwark', spellType: 'divine', name: 'Holy Bulwark',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 160,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        SHARED_SMITE,
        { id: 'raceWrathOfTheWatchers', spellType: 'divine', name: 'Wrath of the Watchers',
          type: 'damage', tier: 'III', cost: 60, dmg: 180, range: 4,
          kind: 'cross', damageType: 'magic', crossRadius: 2,
          statusEffects: [{ id: 'burn', duration: 1 }],
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in a cross-shaped AOE. Applies Burn. Deals bonus damage to Staggered targets.' },
        SHARED_FISSURE,
        SHARED_WING_ATTACK
    ],
    'vampire': [
        { id: 'raceLifetap', spellType: 'unholy', element: 'blood', name: 'Lifetap',
          type: 'damage', cost: 25, dmg: 80, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          desc: 'Deals WEAK magic damage to a Single Enemy. Heals the caster for part of the damage dealt.' },
        { id: 'raceBatSwarm', spellType: 'unholy', element: 'shadow', name: 'Bat Swarm',
          type: 'damage', cost: 30, dmg: 125, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statStageBoost: { def: -1 },
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Lowers DEF by 1 stage.' },
        { id: 'raceMistForm', spellType: 'unholy', element: 'wind', name: 'Mist Form',
          type: 'utility', cost: 20, range: 0, apCost: 1,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Dissolve into mist. Teleport 3 tiles and become invisible for 1 turn.' },
        { id: 'racePredatorDrop', spellType: 'unholy', element: 'blood', name: 'Predator Drop',
          type: 'damage', tier: 'III', cost: 25, dmg: 150, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 4, dmgPerLevel: 15,
          requiresFlight: true, drainPct: 0.20,
          desc: 'Lifts the target high and drops it. Deals HEAVY physical damage plus fall damage. Heals the caster for part of the damage dealt. Caster must be flying.' },
        SHARED_SUMMON_BLOOD_RAIN,
        SHARED_SMOKE_SCREEN
    ],
    'voidweaver': [
        { id: 'raceWebSnare', spellType: 'alien', name: 'Web Snare',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          projectileOverride: 'proj-spiderweb',
          statusEffects: [{ id: 'root', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Rooted.' },
        { id: 'raceVenomFang', element: 'poison', spellType: 'alien', name: 'Venom Fang',
          type: 'damage', cost: 30, dmg: 100, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 3 }],
          bonusVsStatus: { status: 'root', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Poison. Deals bonus damage to targets with Rooted.' },
        { id: 'raceDimensionalWeb', spellType: 'alien', name: 'Dimensional Web',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Weave a web between dimensions over 3×3 for 2 turns. Enemies inside are heavily slowed.' },
        { id: 'raceDimensionalFold', spellType: 'alien', element: 'arcane', name: 'Dimensional Fold',
          type: 'utility', cost: 25, range: 5, apCost: 1,
          kind: 'swap', requiresLineOfSight: false,
          desc: 'Swaps positions with the target unit.' },
        SHARED_POISON_SWAMP,
        SHARED_BLACK_HOLE,
    ],
    'cosmic wraith': [
        { id: 'raceEntropicBeam', spellType: 'alien', name: 'Entropic Beam',
          type: 'damage', cost: 35, dmg: 100, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statStageBoost: { def: -1 },
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to All Enemies in a line. Lowers DEF by 1 stage. Deals bonus damage to targets with Slow.' },
        _mkBlink('short', { id: 'racePhaseWalk', spellType: 'tech', name: 'Phase Walk',
          desc: 'Phase through reality up to 3 tiles. Repositioning tool.' }),
        { id: 'raceHeatDeath', spellType: 'alien', name: 'Heat Death',
          type: 'damage', tier: 'III', cost: 100, dmg: 180, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Impose entropy on a 3×3 area for 2 turns — everything inside takes HEAVY damage.' },
        SHARED_FISSURE,
        SHARED_SUMMON_BLIZZARD,
        SHARED_BLACK_HOLE,
        SHARED_NEBULA
    ],
    'superhero': [
        _mkCharge({ id: 'raceHeroicLeap', spellType: 'human', name: 'Heroic Leap', dmg: 100, desc: 'Deals MEDIUM physical damage to a Single Enemy. The caster charges into melee first.' }),
        { id: 'raceLaserBeam', spellType: 'alien', name: 'Laser Beam',
          type: 'damage', tier: 'III', cost: 60, dmg: 160, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in a line. Applies Burn. Deals bonus damage to Burning targets.' },
        { id: 'raceShockwaveClap', element: 'sonic', spellType: 'human', name: 'Shockwave Clap',
          type: 'damage', cost: 25, dmg: 125, range: 4,
          kind: 'linePush', damageType: 'physical', lineWidth: 1, pushDistance: 2,
          desc: 'Deals MEDIUM physical damage to All Enemies in a line. Pushes them back. Knocks the target back 2 tiles.' },
        { id: 'raceInvulnerable', spellType: 'human', name: 'Invulnerable',
          type: 'buff', cost: 30, apCost: 2, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 2 }],
          desc: 'Empowers the caster. Applies Protect. Cooldown: 2 rounds.' },
        SHARED_NEBULA,
    ],
    'general': [
        { id: 'raceRallyCommand', spellType: 'human', name: 'Rally Command',
          type: 'buff', cost: 30, range: 0, apCost: 2,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 2 },
          desc: 'Empowers All Allies nearby. Raises ATK by 2 stages.' },
        { id: 'raceIronBulwark', spellType: 'human', name: 'Iron Bulwark',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { def: 2 },
          desc: 'Empowers the caster. Raises DEF by 2 stages.' },
        { id: 'raceArtilleryStrike', spellType: 'human', name: 'Artillery Strike',
          type: 'damage', cost: 40, dmg: 135, range: 6, apCost: 2,
          kind: 'delayed', damageType: 'physical', aoeRadius: 1, delayTurns: 1,
          leaveTerrain: 'scorched',
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Marks a zone. After 1 turn, deals MEDIUM physical damage to All Enemies inside (AOE). Leaves scorched tiles behind. Reshapes the ground on impact.' },
        SHARED_NUKE,
    ],
    'droid': [
        { id: 'raceSystemAnalysis', spellType: 'tech', name: 'System Analysis',
          type: 'debuff', cost: 20, range: 5, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'scanner', duration: 2 }],
          desc: 'Weakens a Single Enemy. Applies Scanner.' },
        { id: 'raceFirewallProtocol', spellType: 'tech', name: 'Firewall Protocol',
          type: 'buff', cost: 35, range: 3, apCost: 2,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 120,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        { id: 'raceTaserBolt', element: 'lightning', spellType: 'tech', name: 'Taser Bolt',
          type: 'damage', cost: 20, dmg: 80, range: 3,
          kind: 'damage', damageType: 'magic',
          bonusVsStatus: { status: 'jammed', mult: 1.5 },
          desc: 'Deals WEAK magic damage to a Single Enemy. Deals bonus damage to Jammed targets.' },
    ],
    'antihero': [
        { id: 'raceCosmicSlam', spellType: 'human', name: 'Cosmic Slam',
          type: 'damage', cost: 35, dmg: 125, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          selfCenter: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.' },
        _mkCharge({ id: 'raceDarkJustice', spellType: 'human', name: 'Dark Justice',
          cost: 30, bonusVsDebuffed: 0.40,
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to debuffed targets. The caster charges into melee first.', dmg: 100 }),
        { id: 'raceGrimResolve', spellType: 'human', element: 'shadow', name: 'Grim Resolve',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages. Heroes make speeches. You make a list.' },
        { id: 'raceNoMercy', spellType: 'human', element: 'shadow', name: 'No Mercy',
          type: 'damage', cost: 45, dmg: 180, range: 1, apCost: 2, tier: 'III',
          kind: 'damage', damageType: 'physical', executeBonusPct: 0.75,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. Deals far more damage the lower the target\'s HP. They had it coming. Deals bonus damage to Staggered targets.' },
    ],
    /* 2026-08-12 kit rework: VOX Broadcast, Dead Air and the borrowed
       Summon Sandstorm are GONE. The new kit is a status-combo engine —
       poison them (Chemtrails), silence them (Fluoride Water), then drop
       the Truth Bomb on anyone carrying either status. */
    'conspiracy theorist': [
        { id: 'raceTinFoilHat', spellType: 'human', element: 'metal', name: 'Tin Foil Hat',
          type: 'buff', cost: 20, apCost: 1, range: 2,
          kind: 'buff',
          statStageBoost: { mdef: 2 },
          desc: 'Empowers a Single Ally. Raises M DEF by 2 stages.' },
        { id: 'raceChemtrails', spellType: 'human', element: 'poison', name: 'Chemtrails',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'poison', duration: 2 }],
          leaveTerrain: 'poison',
          desc: 'Deals MEDIUM magic damage to All Enemies in a line. Applies Poison. Leaves poison behind.' },
        { id: 'raceFluorideWater', spellType: 'human', element: 'water', name: 'Fluoride Water',
          type: 'damage', cost: 50, dmg: 125, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'silence', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Silence.' },
        /* Conspiracy theorist capstone since the 2026-08-12 kit rework. */
        { id: 'raceTruthBomb', spellType: 'human', name: 'Truth Bomb',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          bonusVsStatus: { status: ['silence', 'poison'], mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Deals bonus damage to Silenced or Poisoned targets. The truth hurts.' },
    ],
    'overlord': [
        { id: 'raceInfernalDecree', spellType: 'unholy', name: 'Infernal Decree',
          type: 'damage', cost: 40, dmg: 130, range: 3, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Burn.' },
        { id: 'raceHellfireCrown', spellType: 'unholy', name: 'Hellfire Crown',
          type: 'buff', cost: 30, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'raceCataclysmDecree', spellType: 'unholy', name: 'Cataclysm Decree',
          type: 'damage', tier: 'III', cost: 40, dmg: 160, range: 5, apCost: 2,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          leaveTerrain: 'lava',
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Marks a zone. After 1 turn, deals HEAVY magic damage to All Enemies inside (AOE). Leaves lava tiles behind. Reshapes the ground on impact. Deals bonus damage to Burning targets.' },
        SHARED_SCORCHED_EARTH,
        SHARED_NUKE
    ],
    'chosen one': [
        { id: 'racePhantomDouble', spellType: 'divine', name: 'Phantom Double',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployObject', maxActivePerCaster: 1, objectHp: 3,
          blocksMovement: false,
          drawsRangedAttack: true, drawsMeleeAttack: true,
          desc: 'Deploys an object on an empty tile.' },
        _mkCharge({ id: 'raceDarkFeather', spellType: 'unholy', name: 'Dark Feather',
          kind: 'dash', cost: 30, apCost: 2, statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Dashes through the battlefield. Applies Poison. The caster charges into melee first.', dmg: 100 }),
        { id: 'raceProphecyFulfilled', spellType: 'divine', name: 'Prophecy Fulfilled',
          type: 'buff', cost: 30, apCost: 2, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'overclock', duration: 1 }],
          desc: 'Overclocks the caster: raises ATK by 1 stage and MOV by 1 (tech units also gain +1 RNG).' },
        { id: 'raceAwakening', spellType: 'divine', element: 'light', name: 'Awakening',
          type: 'buff', cost: 50, apCost: 2, range: 0, tier: 'III',
          kind: 'buff', cooldownRounds: 3,
          selfHealPct: 0.30, cleanse: 99,
          statStageBoost: { atk: 2, spd: 2 },
          desc: 'The prophecy stops being about you and starts being you. Cleanses everything, restores 30% HP, and raises ATK and SPD by 2 stages.' },
    ],
    'politician': [
        { id: 'raceExecutiveOrder', spellType: 'human', name: 'Executive Order',
          type: 'debuff', cost: 35, range: 4, apCost: 2,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Stun.' },
        { id: 'raceBlackBudget', spellType: 'human', name: 'Black Budget',
          type: 'buff', cost: 25, range: 3, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'overclock', duration: 1 }],
          desc: 'Overclocks a Single Ally: raises ATK by 1 stage and MOV by 1 (tech units also gain +1 RNG).' },
        { id: 'raceFilibuster', spellType: 'human', name: 'Filibuster',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'I yield the floor to NO ONE. 3×3 zone for 2 turns. Enemies inside are silenced.' },
        SHARED_NUKE,
    ],

    'atlantean': [
        { id: 'raceTemporalTide', spellType: 'anomaly', element: 'water', name: 'Temporal Tide',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 100,
          desc: 'Creates a zone that heals allies standing inside it each turn.' },
        { id: 'raceRiptide', spellType: 'anomaly', element: 'water', name: 'Whirlpool',
          type: 'damage', cost: 30, dmg: 100, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Drags everything caught toward the center. Applies Slow.' },
        { id: 'raceFlood', spellType: 'anomaly', element: 'water', name: 'Great Flood',
          type: 'damage', tier: 'III', cost: 45, dmg: 160, range: 4, apCost: 2, cooldownRounds: 2,
          kind: 'terrainCreate', terrainType: 'water', tileCount: 12, elevationFlood: true,
          damageType: 'magic',
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Call the drowned deep. Water pours into the target tile and RISES to fill the surrounding basin (up to 12 tiles) — meteor craters and trenches flood to the rim, chasms become deep water. Enemies caught take HEAVY magic damage, are slowed, and can start to drown.' },
        /* Atlantean capstone since the 2026-08-12 capstone pass (Pillar of
           Atlantis deleted to make room). kind 'barrage' + hitsWetOnly: hits
           every enemy standing in water/deep water or the wet spread-flow at
           a pool's edge (battle.js _isWetTile), anywhere on the map. */
        { id: 'racePoseidonsWrath', spellType: 'anomaly', element: 'water', name: 'Poseidon\'s Wrath',
          type: 'damage', tier: 'III', cost: 55, dmg: 170, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'magic', aoeOriginSelf: true, aoeRadius: 99,
          hitsWetOnly: true, ignoresLineOfSight: true,
          desc: 'The sea rises in judgment. Deals HEAVY magic damage to ALL Enemies standing in water, anywhere on the battlefield. The deep remembers what it is owed.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE,
    ],
    'dinosaur': [
        _mkCharge({ id: 'raceApexCharge', spellType: 'anomaly', name: 'Apex Charge',
          kind: 'dash', cost: 30, apCost: 2, statusEffects: _STAGGER_1,
          desc: 'Dashes through the battlefield. Applies Stagger. The caster charges into melee first.', dmg: 130 }),
        { id: 'racePrimalRoar', spellType: 'anomaly', name: 'Primal Roar',
          type: 'debuff', cost: 20, range: 0, apCost: 1,
          kind: 'aoe', aoeRadius: 1, aoeOriginSelf: true,
          damageType: 'physical', dmg: 0,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Ear-splitting roar. All enemies in 3×3 around self have their ATK lowered by 2 stages and DEF by 1 stage for 2 turns.' },
        /* Dinosaur capstone since the 2026-08-12 capstone pass (was Primal Roar). */
        { id: 'raceJurassicJaw', spellType: 'anomaly', name: 'Jurassic Jaw',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 1,
          kind: 'damage', damageType: 'physical', ignoreArmor: true,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. Ignores DEF. Deals bonus damage to Staggered targets.' },
        SHARED_FISSURE,
    ],
    'dragon': [
        { id: 'raceDragonfire', element: 'fire', spellType: 'unholy', name: 'Dragonfire',
          type: 'damage', tier: 'III', cost: 60, dmg: 160, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Exhale a roaring column of dragonfire, dealing HEAVY magic damage to All Enemies in a line. Applies Burn.' },
        SHARED_WING_ATTACK,
        { id: 'raceDragonfear', spellType: 'unholy', name: 'Dragonfear',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 3, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Ancient terror. All enemies within 3 tiles have their ATK lowered by 2 stages and DEF by 1 stage for 2 turns.' },
        { id: 'raceDragonToss', spellType: 'anomaly', name: 'Dragon Toss',
          type: 'damage', cost: 30, dmg: 70, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 5, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 60,
          requiresFlight: true,
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Snatch an adjacent enemy in massive claws, soar upward, and hurl them up to 3 tiles. Devastating if they hit another unit. Deals bonus damage to Burning targets.' },
        SHARED_SCORCHED_EARTH,
        SHARED_FISSURE,
    ],
    'ghoul': [
        { id: 'raceGhoulishBite', element: 'poison', spellType: 'unholy', name: 'Ghoulish Bite',
          type: 'damage', cost: 25, dmg: 100, range: 1,
          kind: 'lifeDrain', damageType: 'physical', drainPct: 0.40,
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Poison. Heals the caster for part of the damage dealt.' },
        { id: 'raceCorpseCrawl', spellType: 'unholy', name: 'Corpse Crawl',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Burrow through the earth up to 3 tiles away, turning invisible for 1 turn.' },
        { id: 'raceCarrionFeast', spellType: 'unholy', name: 'Carrion Feast',
          type: 'heal', tier: 'III', cost: 20, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.25,
          desc: 'Restores 25% of the caster\'s max HP.' },
        SHARED_POISON_SWAMP,
    ],
    'gnome': [
        { id: 'raceClockworkTurret', spellType: 'anomaly', name: 'Clockwork Turret',
          type: 'utility', cost: 30, range: 2, apCost: 1,
          kind: 'deployTurret', turretDmg: 65, turretRange: 3, turretHp: 80,
          maxActivePerCaster: 1,
          desc: 'Deploy a clockwork turret. Auto-fires at nearest enemy each round. 65 damage, 3 range.' },
        { id: 'raceFlashbangMine', spellType: 'anomaly', name: 'Flashbang Mine',
          type: 'damage', cost: 25, dmg: 90, range: 3, apCost: 1,
          kind: 'deployObject', objectHp: 10, blastRadius: 1, blastDmg: 90,
          detonateOnStep: true, maxActivePerCaster: 2,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Deploys an object on an empty tile. Applies Stun.' },
        { id: 'raceTinkersContraption', spellType: 'anomaly', name: 'Tinker\'s Contraption',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 100,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        { id: 'raceOvertinker', spellType: 'anomaly', element: 'metal', name: 'Overtinker',
          type: 'buff', cost: 45, apCost: 2, range: 0, tier: 'III',
          kind: 'aoeShield', aoeRadius: 2, shieldHp: 160, aoeOriginSelf: true,
          desc: 'One more adjustment. One MORE. Grants a heavy damage-absorbing shield to All Allies (and contraptions) around the caster.' },
    ],
    'kaiju': [
        { id: 'raceCataclysmStomp', spellType: 'unholy', name: 'Cataclysm Stomp',
          type: 'damage', cost: 35, dmg: 100, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Applies Stagger.' },
        // element: none (deliberate — nuclear, not fire: keeps kaiju mirror
        // matches honest, since kaiju ABSORBS fire via its affinity row).
        { id: 'raceAtomicBreath', spellType: 'tech', name: 'Atomic Breath',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Unleash a searing torrent of blue atomic fire, dealing HEAVY magic damage to All Enemies in a line. Deals bonus damage to Staggered targets.' },
        { id: 'raceSkyscraperToss', spellType: 'unholy', name: 'Skyscraper Toss',
          type: 'damage', cost: 35, dmg: 125, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, ignoresLineOfSight: true,
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Fires through cover.' },
        { id: 'raceSeismicLeap', spellType: 'unholy', name: 'Seismic Leap',
          type: 'damage', cost: 30, dmg: 100, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 30,
          aoeRadius: 1, aoeDmgPct: 0.40,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Leaps to a Single Enemy, dealing MEDIUM physical damage. Applies Stagger.' },
        SHARED_FISSURE
        /* (SHARED_NUKE removed 2026-07-23 — Thermal Regen made him the
           anti-fire monster, not the nuke platform.) */
    ],
    'kraken': [
        { id: 'raceTentacleLash', spellType: 'anomaly', name: 'Tentacle Lash',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'pull', damageType: 'physical', pullDistance: 2, lineOfSight: true,
          desc: 'Deals WEAK physical damage to a Single Enemy and pulls it toward you.' },
        { id: 'raceInkCloud', spellType: 'anomaly', name: 'Ink Cloud',
          type: 'debuff', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Spray blinding ink over a 3×3 area for 2 turns. Enemies inside are disoriented — ATK lowered by 2 stages and DEF by 1 stage for 2 turns.' },
        { id: 'raceDepthCharge', element: 'water', spellType: 'anomaly', name: 'Depth Charge',
          type: 'damage', cost: 35, dmg: 125, range: 4,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          bonusVsStatus: { status: 'discord', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE. Deals bonus damage to targets with Discord.' },
        SHARED_TIDAL_SURGE,
        SHARED_VORTEX_SLAM
    ],
    'loch ness monster': [
        { id: 'raceDeepDive', spellType: 'anomaly', name: 'Deep Dive',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'protect', duration: 1 }],
          desc: 'Submerge and resurface up to 3 tiles away. Protected 1 turn upon emerging.' },
        { id: 'raceTidalSlam', element: 'water', spellType: 'anomaly', name: 'Tidal Slam',
          type: 'damage', tier: 'III', cost: 30, dmg: 170, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          leaveTerrain: 'deep_water',
          statusEffects: [{ id: 'slow', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE. Applies Slow. Deals bonus damage to targets with Slow. Leaves deep_water behind. Cooldown: 2 rounds.' },
        { id: 'raceCryptidVanish', spellType: 'anomaly', name: 'Cryptid Vanish',
          type: 'utility', cost: 15, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 2,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'Was it real? The photo\'s blurry... Teleport 2 tiles, invisible 2 turns.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE
    ],
    /* Yeti (reworked 2026-07-23) — full frost kit built around the new Frozen
       status and slippery ice terrain. */
    'yeti': [
        /* 2026-08-16 balance (stats18): 1 cast in 362 matches — the AI's
           terrainCreate scorer only values raw dmg (40 read as worthless next
           to the ring-3 75 MP + 2 AP price). Damage raised to MEDIUM so the
           freeze actually gets cast; tier stamped to match its ring. */
        { id: 'racePermafrost', spellType: 'anomaly', element: 'ice', name: 'Permafrost',
          type: 'damage', cost: 75, dmg: 120, range: 3, apCost: 2, tier: 'II',
          kind: 'terrainCreate', terrainType: 'ice', squareFlood: true, aoeRadius: 1,
          damageType: 'magic', witherTrees: true,
          statusEffects: [{ id: 'frozen', duration: 2 }],
          desc: 'Deep-freezes a 3×3 area into ice terrain. Enemies caught take MEDIUM magic damage and are FROZEN solid. Seeds and deployables in the area are destroyed; living trees die on the spot.' },
        /* 2026-08-16 balance (stats18): yeti sat at 28.9% WR and this capstone
           had ZERO casts in 362 matches — kind 'leapStrike' requires standing
           STRICTLY ABOVE the target (AI + engine both gate on it), which never
           happens on flat rotation maps. Reworked into the bruiser charge the
           kit wanted (Gore Charge / Bull Rush family) and it now APPLIES
           Frozen, so Frozen Punch's 1.5× rider finally has an in-kit setup. */
        _mkCharge({ id: 'raceAvalancheStrike', spellType: 'anomaly', element: 'ice', name: 'Avalanche Strike',
          tier: 'III', cost: 100, dmg: 180, range: 3, apCost: 1,
          statusEffects: [{ id: 'frozen', duration: 1 }],
          bonusVsStatus: { status: 'frozen', mult: 1.5 },
          desc: 'Charges into melee in a wall of snow, dealing HEAVY physical damage to a Single Enemy and freezing it solid for 1 turn. Deals bonus damage to targets already Frozen.' }),
        /* 2026-08-16 balance (stats18): at its ring-2 ladder price (50 MP)
           this was ~2 dmg/MP, bottom of the game — numbers raised to earn
           the slot. */
        { id: 'raceIceSlide', spellType: 'anomaly', element: 'ice', name: 'Ice Slide',
          type: 'damage', cost: 50, dmg: 140, range: 4, apCost: 1,
          kind: 'dash', damageType: 'physical', dashDamage: 70,
          leaveTerrain: 'ice',
          desc: 'Dashes through the battlefield, dealing MEDIUM physical damage to enemies along the path. Leaves ice behind.' },
        { id: 'raceFrozenPunch', spellType: 'anomaly', element: 'ice', name: 'Frozen Punch',
          type: 'damage', cost: 15, dmg: 90, range: 1, apCost: 1,
          kind: 'damage', damageType: 'physical',
          bonusVsStatus: { status: 'frozen', mult: 1.5 },
          desc: 'A frostbitten haymaker on a Single Enemy — MEDIUM physical damage. Deals bonus damage to Frozen targets.' },
        SHARED_SUMMON_BLIZZARD
    ],

    'barbarella': [
        { id: 'raceStunRay', element: 'lightning', spellType: 'tech', name: 'Stun Ray',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Stun.' },
        { id: 'raceSpaceDisco', spellType: 'anomaly', name: 'Space Disco',
          type: 'damage', tier: 'III', cost: 50, dmg: 160, range: 0, apCost: 1,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 1 }],
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies around the caster (AOE) and lowers ATK by 2 stages and DEF by 1 stage. Deals bonus damage to Stunned targets.' },
        _mkBlink('short', { id: 'raceGravityBoots', spellType: 'tech', name: 'Gravity Boots',
          desc: 'Activate anti-gravity boots to reposition up to 3 tiles. Far out.' }),
        { id: 'racePlasmaWhip', element: 'fire', spellType: 'tech', name: 'Plasma Whip',
          type: 'damage', cost: 30, dmg: 125, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Burn.' }
        /* Lava Lamp DELETED (§2.1 double-status offender, and cut from
           barbarella's final 4 in the spell-tree audit). */
    ],

    'black goo': [
        { id: 'raceCorrosiveSplash', element: 'poison', spellType: 'unholy', name: 'Corrosive Splash',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Deals WEAK magic damage to All Enemies in an AOE. Applies Poison.' },
        { id: 'raceAbsorb', spellType: 'unholy', name: 'Absorb',
          type: 'damage', cost: 30, dmg: 130, range: 1,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Poison. Heals the caster for part of the damage dealt.' },
        { id: 'raceMitosisSplit', spellType: 'anomaly', name: 'Mitosis',
          type: 'buff', tier: 'III', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'regen', duration: 2 }],
          desc: 'Empowers the caster. Applies Regen.' },
        { id: 'raceOozeTrail', spellType: 'unholy', name: 'Ooze Trail',
          type: 'utility', cost: 25, range: 4, apCost: 1,
          kind: 'terrainCreate', terrainType: 'swamp', tileCount: 1,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Spit a glob of black ooze onto one tile. It oozes outward over the ground and downhill. Enemies caught in the slick are slowed.' },
        SHARED_POISON_SWAMP,
        { id: 'raceToxicNova', element: 'poison', spellType: 'unholy', name: 'Toxic Nova',
          type: 'damage', cost: 35, dmg: 125, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Applies Poison.' }
    ],

    'golem': [
        /* NOTE: duplicate id with the giant's Boulder Hurl (a known dup —
           see the EWSpellMods refsFor note). Keep the element tags in sync
           so whichever copy wins SPELL_BY_ID, the affinity layer agrees. */
        { id: 'raceBoulderHurl', spellType: 'human', element: 'earth', name: 'Boulder Hurl',
          type: 'damage', cost: 25, dmg: 100, range: 3,
          kind: 'damage', damageType: 'physical',
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to targets with Stagger.' },
        { id: 'raceStoneSkin', spellType: 'divine', name: 'Stone Skin',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          desc: 'Empowers the caster. Raises DEF by 2 stages.' },
        { id: 'raceQuake', element: 'earth', spellType: 'human', name: 'Quake',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Deals HEAVY physical damage to All Enemies around the caster (AOE). Applies Stagger. Reshapes the ground on impact.' },
        SHARED_FISSURE,
    ],

    'honda civic': [
        _mkCharge({ id: 'raceRamCharge', spellType: 'tech', name: 'Ram Charge',
          kind: 'dash', statusEffects: _STAGGER_1,
          desc: 'Dashes through the battlefield. Applies Stagger. The caster charges into melee first.', dmg: 100 }),
        { id: 'raceExhaustCloud', spellType: 'tech', name: 'Exhaust Cloud',
          type: 'utility', cost: 20, range: 0, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Pump toxic exhaust in a 3x3 cloud for 2 turns. Enemies inside are confused.' },
        { id: 'raceRoboPunch', spellType: 'tech', name: 'Robo Punch',
          type: 'damage', cost: 25, dmg: 135, range: 1,
          kind: 'damage', damageType: 'physical',
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Deals bonus damage to Staggered targets.' },
        /* 2026-08-12: renamed from Missile Barrage (id kept for VFX/saves). */
        { id: 'raceMissileBarrage', spellType: 'tech', name: 'Vehicular Manslaughter',
          type: 'damage', tier: 'III', cost: 50, dmg: 160, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          bonusVsStatus: { status: 'discord', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE. Deals bonus damage to targets with Discord.' },
        { id: 'raceNitroBoost', spellType: 'tech', name: 'Nitro Boost',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { spd: 2 },
          desc: 'Empowers the caster. Raises SPD by 2 stages.' },
    ],

    'ice queen': [
        { id: 'raceIceSpear', element: 'ice', spellType: 'anomaly', name: 'Ice Spear',
          type: 'damage', cost: 25, dmg: 100, range: 5,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Slow.' },
        /* 2026-07-17 shape pass: Diamond Dust now falls in a literal DIAMOND
           (Manhattan radius 2, 13 tiles) instead of another 3×3. */
        { id: 'raceDiamondDust', element: 'ice', spellType: 'divine', name: 'Diamond Dust',
          type: 'damage', cost: 35, dmg: 125, range: 4, apCost: 2,
          kind: 'cross', diamond: true, crossRadius: 2, damageType: 'magic',
          statusEffects: [{ id: 'slow', duration: 2 }],
          leaveTerrain: 'ice',
          desc: 'Deals MEDIUM magic damage to All Enemies in an X-shaped AOE. Applies Slow. Leaves ice behind.' },
        SHARED_FLASH_FREEZE,
        SHARED_SUMMON_BLIZZARD,
        { id: 'raceAbsoluteZero', spellType: 'anomaly', element: 'ice', name: 'Absolute Zero',
          type: 'damage', tier: 'III', cost: 40, dmg: 180, range: 3, apCost: 2, cooldownRounds: 2,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'frozen', duration: 2 }],
          desc: 'Stop every molecule in the target\'s body. The world whites out, a crystal lattice locks around them, and time itself freezes before the shatter. Deals HEAVY magic damage to a Single Enemy and FREEZES them solid. Cooldown: 2 rounds.' }
    ],

    'juggernaut': [
        _mkCharge({ id: 'raceUnstoppableCharge', spellType: 'unholy', name: 'Unstoppable Charge',
          kind: 'dash', tier: 'III', dmg: 180, range: 4, statusEffects: _STAGGER_1,
          desc: 'Charges at a Single Enemy, dealing HEAVY physical damage. Applies Stagger.' }),
        { id: 'raceBrutalSlam', spellType: 'human', name: 'Brutal Slam',
          type: 'damage', cost: 30, dmg: 125, range: 0, apCost: 1,
          kind: 'barrage', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          desc: 'Deals MEDIUM physical damage to All Enemies in an AOE.' },
        { id: 'raceThickHide', spellType: 'human', name: 'Thick Hide',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          desc: 'Empowers the caster. Raises DEF by 2 stages.' },
        { id: 'raceBodyCheck', spellType: 'human', name: 'Body Check',
          type: 'damage', cost: 20, dmg: 100, range: 1,
          kind: 'displacement', damageType: 'physical', pushDistance: 2,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Shoves the target sideways. Deals bonus damage to targets with Stagger. Knocks the target back 2 tiles.' },
        /* (raceRampage merged into the Raider class dash 'rampage'
           2026-08-03 — same-name duplicate. The juggernaut borrows the real
           'rampage' via the movepool-share table; old id aliases to it.) */
    ],

    'ki fighter': [
        { id: 'raceKiBlast', spellType: 'human', element: 'light', name: 'Ki Volley',
          type: 'damage', cost: 20, range: 3,
          kind: 'multiHit', damageType: 'magic',
          hitDamages: [45, 45, 45],
          desc: 'Deals MEDIUM magic damage to a Single Enemy across 3 hits.' },
        { id: 'raceFlurryOfBlows', spellType: 'human', element: 'wind', name: 'Flurry of Blows',
          type: 'damage', cost: 30, range: 1,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [33, 33, 33, 33],
          desc: 'Deals MEDIUM physical damage to a Single Enemy across 4 hits.' },
        { id: 'raceKiCharge', spellType: 'human', element: 'light', name: 'Ki Charge',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'raceKiWave', spellType: 'human', element: 'light', name: 'Ki Wave',
          type: 'damage', cost: 35, dmg: 135, range: 5, apCost: 2,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          desc: 'Deals MEDIUM magic damage to All Enemies in a line.' },
        _mkCharge({ id: 'raceDragonFist', spellType: 'human', element: 'fire', name: 'Dragon Fist',
          tier: 'III', cost: 45, dmg: 180, range: 2,
          desc: 'Deals HEAVY physical damage to a Single Enemy.' }),
        _mkBlink('long', { id: 'raceInstantTransmission', spellType: 'human', element: 'arcane', name: 'Instant Transmission',
          desc: 'Teleports the caster to an unoccupied tile within range.' })
    ],

    'king arthur': [
        /* King Arthur capstone since the 2026-08-12 capstone pass (was Knights
           of Round). */
        { id: 'raceExcaliburStrike', spellType: 'divine', name: 'Excalibur Strike',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals HEAVY physical damage to a Single Enemy. Applies Burn.' },
        { id: 'raceRoyalDecree', spellType: 'divine', name: 'Royal Decree',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 2 },
          desc: 'Empowers All Allies nearby. Raises ATK by 2 stages.' },
        SHARED_WALLS_OF_CAMELOT,
        { id: 'raceKnightsOfRound', spellType: 'divine', name: 'Knights of Round',
          type: 'utility', cost: 30, range: 0, apCost: 1,
          kind: 'rallyPull',
          desc: 'Convene the Round Table — every ally on the field is pulled to the King\'s side. Rooted knights cannot answer the call.' }
    ],

    'king kong': [
        { id: 'raceChestPound', spellType: 'anomaly', name: 'Chest Pound',
          type: 'debuff', cost: 20, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statStageBoost: { def: -1 },
          desc: 'Pound chest with terrifying fury. All enemies within 2 tiles cower — -1 DEF stage.' },
        /* 2026-08-12: capstone renamed Primal Smash → Ape Fury (id kept for
           VFX/saves); the old Ape Fury buff below is Monkey Business now. */
        { id: 'racePrimalSmash', spellType: 'anomaly', name: 'Ape Fury',
          type: 'damage', tier: 'III', cost: 45, dmg: 180, range: 1,
          kind: 'damage', damageType: 'physical',
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          bonusVsStatus: { status: 'slow', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. Reshapes the ground on impact. Deals bonus damage to Slowed targets.' },
        { id: 'raceApeFury', spellType: 'anomaly', name: 'Monkey Business',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
    ],

    'minotaur': [
        _mkCharge({ id: 'raceBullRush', spellType: 'human', name: 'Bull Rush',
          kind: 'dash', tier: 'III', cost: 45, dmg: 170, range: 4,
          bonusVsStatus: { status: 'discord', mult: 1.5 },
          desc: 'Dashes through the battlefield. Deals bonus damage to targets with Discord. The caster charges into melee first.' }),
        { id: 'raceLabyrinthRoar', spellType: 'unholy', name: 'Labyrinth Roar',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Terrifying roar echoing through the labyrinth. All enemies within 2 tiles confused 2 turns.' },
        { id: 'raceHornToss', spellType: 'human', name: 'Horn Toss',
          type: 'damage', cost: 25, dmg: 80, range: 1,
          kind: 'displacement', damageType: 'physical', pushDistance: 3,
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals WEAK physical damage to a Single Enemy and knocks it back. Deals bonus damage to Staggered targets.' }
    ],

    'necromancer': [
        { id: 'raceSoulDrain', spellType: 'unholy', name: 'Soul Drain',
          type: 'damage', cost: 30, dmg: 100, range: 3,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.35,
          bonusVsStatus: { status: 'root', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Rooted. Heals the caster for part of the damage dealt.' },
        { id: 'raceBoneBarrage', spellType: 'unholy', name: 'Bone Barrage',
          type: 'damage', cost: 25, dmg: 125, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statStageBoost: { def: -1 },
          desc: 'Deals MEDIUM magic damage to All Enemies in an AOE. Lowers DEF by 1 stage.' },
        { id: 'raceRigormortis', spellType: 'unholy', name: 'Rigormortis',
          type: 'damage', cost: 25, range: 4, dmg: 80,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'root', duration: 2 }],
          desc: 'Deals WEAK magic damage to All Enemies in an AOE. Applies Rooted.' },
        { id: 'raceDeathPact', spellType: 'unholy', name: 'Death Pact',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'racePlaguefield', spellType: 'unholy', name: 'Plaguefield',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'terrainCreate', terrainType: 'plague_flesh', squareFlood: true, aoeRadius: 1,
          desc: 'Corrupt a 3x3 area into a PERMANENT mass of plague-ridden flesh. Anyone (except the necromancer) who ends their turn standing on it is poisoned.' },
        { id: 'raceRaiseDead', spellType: 'unholy', name: 'Raise the Dead',
          type: 'utility', tier: 'III', cost: 40, range: 4, apCost: 2,
          kind: 'raiseDead', zombieDmg: 60,
          desc: 'Reanimate the remains of the fallen — target an ally\'s gravestone or an enemy\'s pile of bones to raise a mindless flesh abomination. At the end of every round it attacks the nearest unit, friend or foe, until destroyed (3 hits). The consumed corpse can never be revived.' }
    ],

    'occulus': [
        { id: 'raceDeathGaze', spellType: 'anomaly', name: 'Death Gaze',
          type: 'damage', tier: 'III', cost: 50, dmg: 180, range: 4,
          kind: 'damage', damageType: 'magic',
          statStageBoost: { def: -1 },
          bonusVsStatus: { status: 'stun', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to a Single Enemy. Lowers the target\'s DEF by 1 stage. Deals bonus damage to Stunned targets.' },
        { id: 'raceOmniVision', spellType: 'divine', name: 'Omni-Vision',
          type: 'utility', cost: 20, range: 5, apCost: 1,
          kind: 'scan', scanRadius: 3,
          desc: 'The all-seeing eye reveals. Scan a massive area, revealing fog and hidden units within 3 tiles.' },
        { id: 'racePsychicBeam', spellType: 'anomaly', name: 'Psychic Beam',
          type: 'damage', cost: 30, dmg: 100, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Deals MEDIUM magic damage to All Enemies in a line. Lowers ATK by 2 stages and DEF by 1 stage.' },
        { id: 'raceHypnoticPulse', spellType: 'anomaly', name: 'Hypnotic Pulse',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Weakens a Single Enemy. Applies Stun.' },
        { id: 'racePupilShield', spellType: 'divine', name: 'Pupil Shield',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 130,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        { id: 'raceSacredGeometry', spellType: 'divine', element: 'arcane', name: 'Sacred Geometry',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'terrainCreate', terrainType: 'crystal', tileCount: 3, orientable: true,
          dmg: 0, damageType: 'magic',
          desc: 'Sing 3 crystal tiles into being in a line. Crystal terrain boosts DEF and blocks ranged. The all-seeing eye draws the pattern.' },
        SHARED_WING_ATTACK,
    ],

    'quarterback': [
        { id: 'raceHailMary', spellType: 'human', element: 'wind', name: 'Hail Mary',
          type: 'damage', tier: 'III', cost: 45, dmg: 180, range: 5,
          kind: 'damage', damageType: 'physical',
          projectileOverride: 'proj-football',
          bonusVsStatus: { status: 'stagger', mult: 1.5 },
          desc: 'Deals HEAVY physical damage to a Single Enemy. Deals bonus damage to Staggered targets.' },
        { id: 'raceBulletPass', spellType: 'human', element: 'wind', name: 'Bullet Pass',
          type: 'damage', cost: 20, dmg: 80, range: 4,
          kind: 'line', damageType: 'physical', lineWidth: 1,
          projectileOverride: 'proj-football',
          desc: 'Deals WEAK physical damage to All Enemies in a line.' },
        _mkCharge({ id: 'raceBlitz', spellType: 'human', element: 'earth', name: 'Blitz',
          kind: 'dash', dmg: 100, statusEffects: _STAGGER_1,
          desc: 'Dashes through the battlefield. Applies Stagger. The caster charges into melee first.' }),
        { id: 'raceAudible', spellType: 'human', element: 'sonic', name: 'Audible',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { spd: 2 },
          desc: 'Empowers All Allies nearby. Raises SPD by 2 stages.' },
        { id: 'raceSpikeTheBall', spellType: 'human', element: 'earth', name: 'Spike the Ball',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          projectileOverride: 'proj-football',
          desc: 'Deals WEAK physical damage to All Enemies in an AOE.' },
        { id: 'raceEndZoneDance', spellType: 'human', element: 'sonic', name: 'End Zone Dance',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' }
    ],

    /* 2026-07-23: racePrecisionShot CUT (duplicate of the Sniper-school
       precisionShot). In its place: a proper trick-arrow quiver. */
    'robinhood': [
        { id: 'raceBombArrow', spellType: 'human', element: 'fire', name: 'Bomb Arrow',
          type: 'damage', cost: 30, dmg: 80, range: 4,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'An arrow with a powder charge lashed to the head. Deals WEAK physical damage to All Enemies in an AOE.' },
        { id: 'raceFireArrow', spellType: 'human', element: 'fire', name: 'Fire Arrow',
          type: 'damage', cost: 25, dmg: 80, range: 5,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals WEAK physical damage to a Single Enemy. Applies Burn.' },
        { id: 'racePoisonArrow', spellType: 'human', element: 'poison', name: 'Poison Arrow',
          type: 'damage', cost: 25, dmg: 80, range: 5,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Deals WEAK physical damage to a Single Enemy. Applies Poison.' },
        { id: 'raceArrowRain', spellType: 'human', name: 'Arrow Rain',
          type: 'damage', tier: 'III', cost: 50, dmg: 160, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'Deals HEAVY physical damage to All Enemies in an AOE.' },
        { id: 'raceStealFromRich', spellType: 'human', name: 'Steal from the Rich',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'debuff',
          statStageBoost: { atk: -2 },
          desc: 'Weakens a Single Enemy. Lowers ATK by 2 stages.' },
        { id: 'raceForestAmbush', spellType: 'human', name: 'Forest Ambush',
          type: 'utility', cost: 15, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Empowers the caster. Raises ATK by 2 stages.' },
        { id: 'raceSplittingArrow', spellType: 'human', name: 'Splitting Arrow',
          type: 'damage', cost: 30, dmg: 125, range: 4,
          kind: 'ricochet', damageType: 'physical',
          bounceDamage: 70, bounceRadius: 2,
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy, then bounces to nearby enemies. Deals bonus damage to targets with Burn.' },
    ],

    /* Santa Clause (reworked 2026-07-13) — no more support kit. He checks the
       list, he runs you over with the sleigh, he leaves coal and one very
       dangerous present. */
    'santa clause': [
        { id: 'raceSleighDash', spellType: 'divine', name: 'Sleigh Dash',
          type: 'damage', cost: 25, dmg: 130, range: 4, apCost: 1,
          kind: 'dash', damageType: 'physical', dashDamage: 70,
          bonusVsStatus: { status: 'frozen', mult: 1.5 },
          desc: 'Dashes through the battlefield, dealing WEAK physical damage to enemies along the path. Deals bonus damage to targets with Frozen.' },
        { id: 'raceLumpOfCoal', element: 'fire', spellType: 'divine', name: 'Lump of Coal',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Applies Burn.' },
        { id: 'raceNaughtyList', spellType: 'anomaly', name: 'Naughty List',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statStageBoost: { atk: -2 },
          desc: 'Weakens a Single Enemy. Lowers ATK by 2 stages.' },
        { id: 'raceBlizzardPresent', element: 'ice', spellType: 'anomaly', name: 'Blizzard Present',
          type: 'damage', tier: 'III', cost: 55, dmg: 160, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'frozen', duration: 2 }],
          leaveTerrain: 'ice',
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Applies Frozen. Leaves ice behind. Cooldown: 2 rounds.' }
    ],

    'super sentai': [
        { id: 'sentaiRedSlash', element: 'fire', spellType: 'human', name: 'Red Slash',
          type: 'damage', cost: 20, dmg: 100, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 1 }],
          _sentaiColor: 'red',
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Applies Burn.' },
        { id: 'sentaiBlueWave', spellType: 'anomaly', name: 'Blue Wave',
          type: 'damage', cost: 25, dmg: 120, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'slow', duration: 1 }],
          _sentaiColor: 'blue',
          desc: 'Deals MEDIUM magic damage to All Enemies in a line. Applies Slow.' },
        { id: 'sentaiBlackGuard', spellType: 'human', name: 'Black Guard',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 2 }],
          _sentaiColor: 'black',
          desc: 'Empowers the caster. Applies Protect. Cooldown: 2 rounds.' },
        { id: 'sentaiGreenArrow', spellType: 'human', name: 'Green Arrow',
          type: 'damage', cost: 25, dmg: 120, range: 5,
          kind: 'damage', damageType: 'physical',
          _sentaiColor: 'green',
          desc: 'Deals MEDIUM physical damage to a Single Enemy.' },
        { id: 'sentaiYellowThunder', element: 'lightning', spellType: 'tech', name: 'Yellow Thunder',
          type: 'damage', cost: 30, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          _sentaiColor: 'yellow',
          desc: 'Deals WEAK magic damage to All Enemies in an AOE. Applies Stagger.' },
        { id: 'sentaiPinkHeal', spellType: 'divine', name: 'Pink Healing',
          type: 'heal', cost: 25, range: 4,
          kind: 'heal', healAmt: 140,
          _sentaiColor: 'pink',
          desc: 'Restores a MEDIUM amount of HP to a Single Ally.' },
        { id: 'sentaiTeamStrike', spellType: 'human', name: 'Team Strike',
          type: 'damage', cost: 35, range: 1, apCost: 2,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [27, 27, 27, 27, 27],
          _sentaiColor: 'megazord',
          desc: 'Deals MEDIUM physical damage to a Single Enemy across 5 hits.' },
        { id: 'sentaiMegazordBlast', spellType: 'tech', name: 'Megazord Blast',
          type: 'damage', tier: 'III', cost: 55, dmg: 180, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          _sentaiColor: 'megazord',
          bonusVsStatus: { status: 'burn', mult: 1.5 },
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE. Deals bonus damage to targets with Burn.' }
    ],

    'symbiote': [
        { id: 'raceTendrilStrike', element: 'poison', spellType: 'unholy', name: 'Tendril Strike',
          type: 'damage', tier: 'III', cost: 45, dmg: 180, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Deals HEAVY physical damage to a Single Enemy. Applies Poison.' },
        { id: 'raceSymbioticDrain', spellType: 'unholy', name: 'Symbiotic Drain',
          type: 'damage', cost: 30, dmg: 125, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          bonusVsStatus: { status: 'poison', mult: 1.5 },
          desc: 'Deals MEDIUM magic damage to a Single Enemy. Deals bonus damage to targets with Poison. Heals the caster for part of the damage dealt.' },
        { id: 'raceWebLaunch', spellType: 'unholy', name: 'Web Shoot',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'root', duration: 1 }],
          desc: 'Deals WEAK physical damage to a Single Enemy. Applies Rooted.' },
        { id: 'raceSymbioteArmor', spellType: 'unholy', name: 'Symbiote Armor',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'regen', duration: 2 }],
          desc: 'Empowers the caster. Applies Regen.' },
        { id: 'racePredatorLeap', spellType: 'unholy', name: 'Predator Leap',
          type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Leaps onto a Single Enemy, dealing WEAK physical damage.' },
    ],

    'valkraye': [
        { id: 'raceValkyrieSpear', spellType: 'divine', name: 'Valkyrie Spear',
          type: 'damage', cost: 25, dmg: 100, range: 2,
          kind: 'damage', damageType: 'physical',
          statStageBoost: { def: -1 },
          desc: 'Deals MEDIUM physical damage to a Single Enemy. Lowers DEF by 1 stage.' },
        { id: 'raceDivineSwoop', spellType: 'divine', name: 'Divine Swoop',
          type: 'damage', cost: 25, dmg: 125, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Leaps to a Single Enemy, dealing MEDIUM physical damage.' },
        { id: 'raceChooserOfSlain', spellType: 'divine', name: 'Chooser of the Slain',
          type: 'heal', tier: 'III', cost: 35, range: 4, apCost: 2,
          kind: 'revive', reviveHpPct: 0.60, oneRevivePerUnitPerMatch: true,
          desc: 'Revives a fallen ally. Works once per unit per match.' },
        { id: 'raceShieldMaiden', spellType: 'divine', name: 'Shield Maiden',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 120,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        SHARED_WING_ATTACK,
    ],

    'watcher': [
        { id: 'raceCosmicSight', spellType: 'divine', name: 'Cosmic Sight',
          type: 'utility', cost: 15, range: 6, apCost: 1,
          kind: 'scan', scanRadius: 4,
          desc: 'See all. Reveal a massive area through fog within 4 tiles. Nothing is hidden from The Watcher.' },
        { id: 'raceRealityPulse', spellType: 'anomaly', name: 'Reality Pulse',
          type: 'damage', tier: 'III', cost: 30, dmg: 170, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Deals HEAVY magic damage to All Enemies in an AOE and lowers ATK by 2 stages and DEF by 1 stage.' },
        { id: 'raceTemporalShift', spellType: 'anomaly', name: 'Temporal Shift',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'swap',
          desc: 'Swaps positions with the target unit.' },
        { id: 'raceJudgmentBeam', spellType: 'divine', name: 'Judgment Beam',
          type: 'damage', cost: 35, dmg: 100, range: 5, apCost: 2,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statStageBoost: { def: -1 },
          desc: 'Deals MEDIUM magic damage to All Enemies in a line. Lowers DEF by 1 stage.' },
        { id: 'raceAstralBarrier', spellType: 'divine', name: 'Astral Barrier',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 90,
          desc: 'Grants a damage-absorbing shield to All Allies in an AOE.' },
        SHARED_WING_ATTACK,
    ]
};

const RACE_ABILITY_BY_ID = {};
for (const [race, abilities] of Object.entries(RACE_ABILITIES)) {
    for (const ability of abilities) {
        ability._race = race;
        ability._isRaceAbility = true;
        RACE_ABILITY_BY_ID[ability.id] = ability;

        SPELL_BY_ID[ability.id] = ability;
    }
}

/* ── Baked movepool shares (2026-07-26, from the Spell Library editor) ────
   These races borrow spells DEFINED elsewhere (another race's array or the
   job spell library) by id, instead of duplicating the literals. Runs AFTER
   the _race stamping loop above so a borrowed def keeps its home identity
   (library spells stay job spells; giant/golem keep Boulder Hurl) — the
   same wiring the EWSpellMods layer uses for exported movepool edits. */
for (const [race, ids] of [
    ['king kong',         ['raceBoulderHurl', 'groundSlam']],
    ['barbarella',        ['raceCharm']],
    ['shadow entity',     ['voidRush']],
    ['siren',             ['raceRiptide', 'raceFlood']],
    ['mermaid',           ['raceRiptide', 'raceFlood']],
    ['loch ness monster', ['raceRiptide', 'raceFlood']],
    ['kraken',            ['raceRiptide', 'raceFlood']],
    ['vampire',           ['raceBite']],
    ['machine elves',     ['raceFractalNeedle']],
    ['ice queen',         ['raceFrozenPunch']],
    ['minotaur',          ['raceGoreCharge']],
    /* 2026-08-03 twin merges — these races used to carry same-name
       DUPLICATES of class spells (sharedRampart / raceEmpPulse /
       raceOverclock / raceRampage). The duplicates are gone; the races now
       borrow the ONE canonical spell by id, king-kong-groundSlam style. */
    ['gargoyle',          ['rampart']],
    ['cyclops',           ['rampart']],
    ['nephilim',          ['rampart']],
    ['general',           ['rampart']],
    ['gnome',             ['rampart']],
    ['golem',             ['rampart']],
    /* robot borrows overclock for its tree's ring 2 since 2026-08-12 (Kill
       Mode took the capstone; empBurst stays an off-tree extra). */
    ['robot',             ['empBurst', 'overclock']],
    ['android',           ['empBurst']],
    ['droid',             ['empBurst']],
    ['cyborg',            ['overclock']],
    ['juggernaut',        ['rampage']],
    /* 2026-08-07 Phase-B rehomes (tree redesign §4): job spells cut from
       their class trees move to the race that owns the lore — mothman
       sightings precede storms, radiant bolts are angel staples, Protect is
       clergy work, and a sasquatch hurling trees needs no explanation.
       Borrowed by id, so the defs keep their job identity (no _isRaceAbility). */
    ['mothman',           ['thunderstorm']],
    ['angel',             ['radiantBolt']],
    ['priest',            ['protect1']],
    ['bigfoot',           ['trunkThrow']],
]) {
    for (const id of ids) {
        const def = RACE_ABILITY_BY_ID[id] || SPELL_BY_ID[id];
        if (!def) { console.warn(`[MovepoolShare] unknown spell id '${id}' for race ${race}`); continue; }
        if (!RACE_ABILITIES[race].some(a => a.id === id)) RACE_ABILITIES[race].push(def);
    }
}

/* Legacy id aliases for the 2026-08-03 twin merges: saved parties, replays
   and exported movepool edits that reference a deleted duplicate id resolve
   to the surviving canonical spell. */
for (const [oldId, survivorId] of [
    ['sharedRampart', 'rampart'],
    ['raceEmpPulse',  'empBurst'],
    ['raceOverclock', 'overclock'],
    ['raceRampage',   'rampage'],
    /* 2026-08-07 spell-tree audit merges/renames */
    ['raceSuppressingFire', 'raceSuppressiveFire'],
    ['raceChassisSlan',     'raceChassisSlam'],
    ['raceLavaLamp',        'racePlasmaWhip'],
]) {
    if (SPELL_BY_ID[survivorId] && !SPELL_BY_ID[oldId]) {
        SPELL_BY_ID[oldId] = SPELL_BY_ID[survivorId];
    }
}

const SIM_DEFAULTS = {

    damage:       { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },
    multiHit:     { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },
    ricochet:     { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },
    lifeDrain:    { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },
    leapStrike:   { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },

    heal:         { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    shield:       { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },
    buff:         { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },
    debuff:       { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'redirect' },
    cleanse:      { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },
    pull:         { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    swap:         { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    displacement: { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },

    aoe:          { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    cross:        { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    aoePull:      { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    splitBeam:    { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    bomb:         { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    warpRune:     { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    deployObject: { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    deployPair:   { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    deployTurret: { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    seedHeal:     { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    seedPoison:   { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    leechSeed:    { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    zoneDebuff:   { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    zoneHeal:     { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },

    line:         { simTargeting: 'line',  simPhase: 'standard', simFallback: null },
    linePush:     { simTargeting: 'line',  simPhase: 'standard', simFallback: null },
    barrage:      { simTargeting: 'self',  simPhase: 'slow',     simFallback: null },

    healAll:      { simTargeting: 'self',  simPhase: 'standard', simFallback: null },
    warCry:       { simTargeting: 'self',  simPhase: 'fast',     simFallback: null },
    selfHeal:     { simTargeting: 'self',  simPhase: 'fast',     simFallback: null },
    scan:         { simTargeting: 'self',  simPhase: 'fast',     simFallback: null },
    escape:       { simTargeting: 'self',  simPhase: 'fast',     simFallback: null },
    encore:       { simTargeting: 'self',  simPhase: 'standard', simFallback: null },
    revive:       { simTargeting: 'tile',  simPhase: 'slow',     simFallback: null },
    manaRestoreAll:{ simTargeting: 'self', simPhase: 'standard', simFallback: null },
    remoteView:   { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },

    aoeShield:    { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },

    dash:         { simTargeting: 'tile',  simPhase: 'fast',     simFallback: null },
    teleport:     { simTargeting: 'tile',  simPhase: 'fast',     simFallback: null },

    delayed:      { simTargeting: 'tile',  simPhase: 'slow',     simFallback: null },
    terrainCreate:{ simTargeting: 'tile',  simPhase: 'slow',     simFallback: null },
    summonWeather:{ simTargeting: 'self',  simPhase: 'slow',     simFallback: null },
    placeBlock:   { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },
    buildStructure:{ simTargeting: 'tile', simPhase: 'slow',     simFallback: null },
    placeTrap:    { simTargeting: 'tile',  simPhase: 'standard', simFallback: null },

    skyDrop:      { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    skyThrow:     { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    skySlam:      { simTargeting: 'unit',  simPhase: 'slow',     simFallback: 'fizzle' },

    utility:      { simTargeting: 'unit',  simPhase: 'standard', simFallback: 'fizzle' },
    guard:        { simTargeting: 'unit',  simPhase: 'fast',     simFallback: 'fizzle' },
    trickRoom:    { simTargeting: 'self',  simPhase: 'fast',     simFallback: 'fizzle' },
};

(function _applySimTurnDefaults() {
    const allSpells = [];
    for (const sp of SPELL_LIBRARY) allSpells.push(sp);
    for (const abilities of Object.values(RACE_ABILITIES)) {
        for (const ab of abilities) allSpells.push(ab);
    }
    let applied = 0, skippedNoKind = 0, skippedShared = 0;
    const seen = new Set();
    for (const spell of allSpells) {

        if (seen.has(spell)) { skippedShared++; continue; }
        seen.add(spell);
        const kind = spell.kind;
        if (!kind) { skippedNoKind++; continue; }
        const defaults = SIM_DEFAULTS[kind];
        if (!defaults) {
            console.warn(`[SimTurn] No SIM_DEFAULTS for kind="${kind}" (spell: ${spell.id})`);
            continue;
        }
        if (!spell.simTargeting) spell.simTargeting = defaults.simTargeting;
        if (!spell.simPhase)     spell.simPhase     = defaults.simPhase;
        if (spell.simFallback === undefined) spell.simFallback = defaults.simFallback;

        if (kind === 'aoeShield' && spell.aoeOriginSelf) {
            spell.simTargeting = 'self';
        }
        applied++;
    }
    console.log(`[SimTurn] Applied sim-turn defaults: ${applied} spells, ${skippedNoKind} without kind, ${skippedShared} shared refs`);
})();

// ===========================================================================
// MANA ECONOMY — power formula (OFF-TREE FALLBACK ONLY since 2026-08-12)
// ---------------------------------------------------------------------------
// Spell MP costs are now TREE-POSITION based: ring 1 = 25, ring 2 = 50,
// ring 3 = 75, capstone = 100 (see applyTreeRingCosts, defined with the
// tree tables below — it runs AFTER this pass and overwrites tree spells).
// This formula still stamps a power-derived cost on every spell first, but
// it only survives on OFF-TREE spells (extra race abilities / legacy pool),
// and even those get snapped to the 25/50/75/100 ladder. Any spell may
// still opt out entirely with an explicit numeric `manaCostOverride`.
// ===========================================================================
const MANA_FORMULA = {
    BASE: 8,            // floor a spell starts from before its power is added
    MIN: 10, MAX: 120,  // hard clamps (rounded to nearest 5)
    DMG_PER_PT: 0.11,   // mana per point of (target-scaled) damage
    HEAL_PER_PT: 0.09,  // mana per point of healing/shield-equivalent
    SHIELD_PER_PT: 0.075,
    MANA_GIVEN_PER_PT: 0.18,
    AVG_HP: 520,        // reference max-HP for converting % heals/revives
    MAX_TARGETS: 4.0,   // a spell never realistically hits more than ~4 of 6 enemies
};

const _MF_HARD_CC = { stun:13, freeze:13, frozen:14, sleep:13, charm:13, silence:12, jammed:11, drowning:10, hourglass:11 };
const _MF_SOFT_CC = { slow:6, stagger:6, root:6, blockMove:6, snare:6, blind:7 };
const _MF_DOT     = { burn:7, poison:7, bleed:7 };
const _MF_DEBUFF  = { marked:5, discord:6, vulnerable:5, weak:5 };
const _MF_BUFF    = { protect:20, invulnerable:15, invisible:12, untargetable:12, regen:6,
                      guarding:6, guard:6, overclock:8, encore:9, warpRune:5, scanner:3,
                      remoteView:3, warCry:7 };

function _mfSumArr(a){ return Array.isArray(a) ? a.reduce((x, y) => x + (+y || 0), 0) : 0; }

function _mfStatusPoints(list, isAlly, areaMult){
    if (!Array.isArray(list)) return 0;
    let p = 0;
    for (const st of list){
        const id = st && st.id; if (!id) continue;
        const dur = Math.max(1, st.duration || 1);
        // Hard CC gets steeper duration scaling: a 2-turn stun is far more than
        // 1.55x as oppressive as a 1-turn stun (it spans two whole activations).
        const durFactor = (!isAlly && _MF_HARD_CC[id] != null) ? 0.9 : 0.55;
        const durScale = 1 + durFactor * (dur - 1);
        let base;
        if (isAlly) base = _MF_BUFF[id] != null ? _MF_BUFF[id] : 6;
        else if (_MF_HARD_CC[id] != null) base = _MF_HARD_CC[id];
        else if (_MF_SOFT_CC[id] != null) base = _MF_SOFT_CC[id];
        else if (_MF_DOT[id] != null) base = _MF_DOT[id];
        else if (_MF_DEBUFF[id] != null) base = _MF_DEBUFF[id];
        else if (_MF_BUFF[id] != null) base = _MF_BUFF[id];
        else base = 5;
        if (st.bonusDamage) base += st.bonusDamage * 0.05;
        // A status with an apply chance is only worth its expected value.
        const chance = (st.chance > 0 && st.chance < 1) ? st.chance : 1;
        p += base * durScale * chance;
    }
    return p * areaMult;
}

function _mfEffectiveTargets(s){
    let E = 1;
    if (s.aoeRadius)   E = s.aoeRadius >= 2 ? 3.6 : 2.6;
    if (s.tileCount)   E = Math.max(E, 1 + (s.tileCount - 1) * 0.6);
    if (s.blastRadius) E = Math.max(E, s.blastRadius >= 2 ? 3.2 : 2.5);
    if (s.splitCount)  E = Math.max(E, s.splitCount);
    if (s.kind === 'healAll' || s.healAll || s.manaRestoreAll || s.auraHeal) E = Math.max(E, 3.5);
    if (s.kind === 'summonWeather') E = Math.max(E, 2.6);
    if (s.cross || s.kind === 'cross' || s.crossRadius) E = Math.max(E, s.diamond ? 3.4 : 2.8);
    // Line and barrage kinds hit multiple units but carried no area fields, so
    // they were priced single-target — the biggest historical underpricing.
    if (s.kind === 'line' || s.kind === 'linePush' || s.lineWidth) E = Math.max(E, 2.4);
    if (s.kind === 'barrage') E = Math.max(E, 3.2);
    return Math.min(E, MANA_FORMULA.MAX_TARGETS);
}

function computeSpellManaCost(s){
    if (!s || typeof s !== 'object') return 0;
    if (typeof s.manaCostOverride === 'number') return s.manaCostOverride;
    const MF = MANA_FORMULA;
    const E = _mfEffectiveTargets(s);
    const k = s.kind;
    const areaDmg = !!(s.aoeRadius || s.tileCount || s.blastRadius || s.cross || s.crossRadius || s.lineWidth
        || k === 'summonWeather' || k === 'cross' || k === 'line' || k === 'linePush' || k === 'barrage');
    const areaMult = areaDmg ? 1.3 : 1;

    // --- Damage (every form, target-scaled for area effects) ---
    let dmg = (s.dmg || 0) * (areaDmg ? E : 1);
    dmg += _mfSumArr(s.hitDamages);
    dmg += _mfSumArr(s.chainProfile);
    dmg += (s.bounceDamage || 0) + (s.dashDamage || 0) + (s.collisionBonus || 0) * 0.5;
    if (s.dmgPerLevel) dmg += s.dmgPerLevel * (s.carryHeight || 2) * 0.5;
    if (s.dot) dmg += s.dot * 2;
    // Conditional damage riders count at partial weight — they don't always
    // apply, but a spell that can hit harder must cost more than one that can't.
    dmg += (s.unholyBonus || 0) * 0.5 + (s.actedTargetBonus || 0) * 0.5 + (s.repeatDmg || 0) * 0.7;
    // Status-combo spells (bonusVsStatus) hit ×mult against an ailment the
    // team set up — conditional, so the extra counts at half weight.
    if (s.bonusVsStatus) dmg += (s.dmg || 0) * ((s.bonusVsStatus.mult || 1.5) - 1) * 0.5;
    if (s.treeScale) dmg += (s.treeCap || 0) * 0.25;
    let dmgMod = 1;
    if (s.ignoreArmor || s.piercing || s.bounceShieldIgnore) dmgMod *= 1.25;
    if (s.guaranteedCrit) dmgMod *= 1.6;
    if (s.sneakBonus) dmgMod *= 1.15;
    if (s.consumeMarked || s.markedSecondHitBonus) dmgMod *= 1.08;
    let P = dmg * MF.DMG_PER_PT * dmgMod;
    // Executes are binary kill pressure no damage number captures.
    if (s.executePct) P += s.executePct * 60;

    // --- Healing / revives ---
    let heal = (s.heal || 0) + (s.healAmt || 0) + (s.auraHeal || 0) + (s.comboHeal || 0) + (s.seedHeal || 0) + (s.selfHeal || 0);
    if (s.selfHealPct) heal += s.selfHealPct * MF.AVG_HP;
    if (s.lowHpBonus)  heal += s.lowHpBonus * 0.6;
    if (s.healPerTurn) heal += s.healPerTurn * (s.zoneDuration || s.regenTurns || 2);
    if (s.regen)       heal += (typeof s.regen === 'number' ? s.regen : 40);
    if (k === 'healAll' || s.healAll) heal *= 3.5;
    else if (k === 'zoneHeal' || k === 'auraHeal') heal *= 2.4;
    if (s.drainPct) heal += (s.dmg || 0) * s.drainPct;
    P += heal * MF.HEAL_PER_PT;
    const revPct = s.revivePct || s.reviveHpPct;
    if (revPct) P += (revPct * MF.AVG_HP) * MF.HEAL_PER_PT * 1.4;

    // --- Shields ---
    let shield = (s.shield || 0) + (s.shieldHp || 0) + (s.comboShield || 0);
    if (k === 'aoeShield' && (s.aoeRadius || 0) > 0) shield *= E;
    P += shield * MF.SHIELD_PER_PT;

    // --- Mana restoration (refunding a resource has value) ---
    let manaGiven = (s.mpRestore || 0) + (s.mana || 0);
    if (s.manaRestoreAll || k === 'manaRestoreAll') manaGiven *= 3.5;
    P += manaGiven * MF.MANA_GIVEN_PER_PT;

    // --- Status effects & stat modifiers ---
    P += _mfStatusPoints(s.statusEffects, false, areaMult);
    P += _mfStatusPoints(s.allyStatusEffects, true, areaMult);
    if (s.statStageBoost){ let st = 0; for (const kk in s.statStageBoost) st += Math.abs(s.statStageBoost[kk] || 0); P += st * 5; }
    for (const f of ['atkDelta', 'armorDelta', 'rangeDelta']) if (s[f]) P += Math.abs(s[f]) * 0.22;
    if (s.auraDefReduction) P += Math.abs(s.auraDefReduction) * 0.3;
    if (s.auraDebuff || s.auraRadius) P += 6;

    // --- Movement / displacement / control ---
    P += (s.pushDistance || 0) * 3;
    P += (s.pullDistance || 0) * 3;
    P += (s.displaceDistance || 0) * 3;
    P += (s.teleportDistance || 0) * 2;
    // Forcibly warping ENEMIES (into hazards, off objectives) is worth far
    // more than a self-blink of the same range.
    if (s.teleportAnyUnit) P += 12;
    if (s.chargeToTarget || k === 'leapStrike' || k === 'dash' || k === 'teleport' || k === 'skyThrow' || k === 'skySlam') P += 5;
    if (k === 'swap' || s.swap) P += 5;
    if (s.moveDelta) P += Math.abs(s.moveDelta) * 4;
    if ((s.pull || k === 'aoePull') && !s.pullDistance) P += 5;

    // --- Zone control / terrain / summons / deploys ---
    if (k === 'terrainCreate') P += 8;
    if (s.leaveTerrain) P += 4;
    if (s.terrainDeform) P += 4;
    if (k === 'summonWeather') P += 14;
    if (k === 'deployTurret') P += 11 + (s.turretDmg || 0) * 0.06 + (s.turretRange || 0) * 1.4 + (s.turretHp || 0) * 0.03;
    if (k === 'deployObject' || k === 'deployPair' || s.objectHp) P += 8;
    if (s.detonateOnStep || k === 'bomb') P += 6;
    if (k === 'zoneDebuff') P += 6;
    if (k === 'seedPoison' || k === 'leechSeed') P += 6;
    if (k === 'seedHeal') P += 5;
    if (k === 'cleanse' || s.cleanse || s.comboCleanse) P += 6;
    if (k === 'escape' || s.escape) P += 5;
    if (k === 'guard') P += 5;
    if (k === 'warpRune') P += 8;
    if (k === 'encore') P += 20;          // grants an extra action — premium tempo
    if (k === 'trickRoom') P += 12;       // global speed inversion
    if (s.stealSpell) P += 18;            // permanently strip a buff/spell off the target
    if (s.apDrain) P += 8;
    if (k === 'scan' || s.scanner || k === 'remoteView' || s.untargetable) P += 4;
    // Tarot Draw: one random stat stage for the WHOLE team — price it like a
    // team-wide statStageBoost (stage worth 5 pts × ~3.5 effective targets).
    if (s.randomTeamBuff) P += ((s.randomTeamBuff.stages || 1) * 5) * 3.5;
    // Star Crossed: applies one zodiac-dependent affliction (burn / root+glare
    // / silence / drowsy) — price the expected value of that status package.
    if (s.zodiacReading) P += 10;

    // --- Range = safety (no penalty for short-range support; small melee discount) ---
    const r = Math.min(s.range != null ? s.range : 3, 8);
    P += Math.max(0, r - 3) * 2.5;
    if (s.type === 'damage' && s.range != null && s.range <= 1) P -= 3;

    // --- Whole-spell modifiers (downsides discount, free actions cost more) ---
    if (s.delayTurns || k === 'delayed') P *= 0.9;   // telegraphed
    if (s.friendlyFire) P *= 0.92;                   // can catch your own team
    if (s.requiresFlight) P *= 0.95;                 // conditional
    const _recoil = s.recoilPct || s.selfDamagePct;
    if (_recoil) P *= (1 - Math.min(0.15, _recoil));
    if (s.selfStun) P *= 0.9;
    if (s.apCost >= 2) P *= 0.92;                    // already eats your whole turn
    if (s.apCost === 0) P *= 1.12;                   // free-action premium

    let mana = Math.max(MF.MIN, Math.min(MF.MAX, MF.BASE + P));
    return Math.round(mana / 5) * 5;
}

// Apply the formula to every defined spell (library + race abilities, which
// include the shared SHARED_* spells by reference). Runs at load, before any
// unit/match is created, so every cast and every HUD readout uses the new cost.
(function _applyManaCostFormula(){
    const all = [];
    const seen = new Set();
    for (const sp of SPELL_LIBRARY) if (!seen.has(sp)) { seen.add(sp); all.push(sp); }
    for (const abilities of Object.values(RACE_ABILITIES)) {
        for (const ab of abilities) if (!seen.has(ab)) { seen.add(ab); all.push(ab); }
    }
    let changed = 0, maxCost = 0, maxName = '';
    for (const spell of all){
        const newCost = computeSpellManaCost(spell);
        if (newCost !== spell.cost) changed++;
        spell.cost = newCost;
        if (newCost > maxCost) { maxCost = newCost; maxName = spell.name; }
    }
    console.log(`[ManaEconomy] Derived mana costs for ${all.length} spells (${changed} changed); priciest: ${maxName} @ ${maxCost} MP`);
})();

// --- Spell SLOT costs (the loadout budget) ---
// Every unit has SPELL_SLOT_MAX (6) spell slots and every spell occupies
// exactly ONE of them: one spell = one slot. The power-scaled 1-3 slot
// costs were retired 2026-08-03; legacy spell.slotCost fields are ignored.
// (cls/secJob params kept for call-site compatibility.)
function getSpellSlotCost(spell, cls, secJob) {
    if (!spell) return 0;
    if (spell.kind === 'basicAttack') return 0;
    return 1;
}

function getSpellIdsSlotCost(spellIds, cls, secJob) {
    let total = 0;
    for (const id of (spellIds || [])) {
        if (!id) continue;
        const sp = (typeof getSpellById === 'function') ? getSpellById(id) : null;
        if (sp) total += getSpellSlotCost(sp, cls, secJob);
    }
    return total;
}

// --- Sparse spell cooldowns ---
// MP + AP remain the everyday limiters; cooldownRounds exists ONLY for spells
// that would be broken on repeat: invulnerability (protect) and stealth
// (invisible) can't be maintained every round, spell theft and encore can't
// be spammed, and the apex nukes (Nuke/Meteor, >= 80 MP) land as moments, not
// maintenance. Checked in canAffordSpell/doSpell (battle.js); a cast stamps
// unit._spellCooldowns[spell.id] with the round it becomes ready again.
// Explicit spell.cooldownRounds in a definition wins over these baselines.
(function _applyBaselineCooldowns(){
    const all = [];
    const seen = new Set();
    for (const sp of SPELL_LIBRARY) if (!seen.has(sp)) { seen.add(sp); all.push(sp); }
    for (const abilities of Object.values(RACE_ABILITIES)) {
        for (const ab of abilities) if (!seen.has(ab)) { seen.add(ab); all.push(ab); }
    }
    let stamped = 0;
    for (const s of all) {
        if (typeof s.cooldownRounds === 'number') continue;
        const eff = [...(s.statusEffects || []), ...(s.allyStatusEffects || [])];
        if (eff.some(e => e && (e.id === 'protect' || e.id === 'invisible'))) s.cooldownRounds = 2;
        else if (s.stealSpell) s.cooldownRounds = 3;
        else if (s.kind === 'encore') s.cooldownRounds = 2;
        else if ((s.cost || 0) >= 80) s.cooldownRounds = 2;
        if (s.cooldownRounds) stamped++;
    }
    console.log(`[Cooldowns] ${stamped} spells carry a cooldown (protect/invis granters, spell theft, encore, apex nukes).`);
})();

// Trim a wish-list of spell ids to the slot budget, keeping earlier picks and
// skipping (not truncating at) anything that no longer fits — the graceful
// "over budget" path for saved parties built before the budget existed.
function trimSpellIdsToSlotBudget(spellIds, cls, secJob, budget) {
    const cap = budget || (typeof SPELL_SLOT_MAX !== 'undefined' ? SPELL_SLOT_MAX : 6);
    const kept = [];
    const seen = new Set();
    let used = 0;
    for (const id of (spellIds || [])) {
        if (!id || seen.has(id)) continue;
        const sp = (typeof getSpellById === 'function') ? getSpellById(id) : null;
        if (!sp || sp.kind === 'basicAttack') continue;
        const c = getSpellSlotCost(sp, cls, secJob);
        if (used + c > cap) continue;
        seen.add(id);
        kept.push(id);
        used += c;
    }
    return kept;
}

const WEAPON_CATEGORIES = {};
function getUnitDominantWeapon(unit) { return null; }

const COMBO_REGISTRY = {

    'divine|divine': {
        name: 'Celestial Chorus',
        desc: 'Twin divine forces heal allies and smite enemies in a radiant burst.',
        dmg: 128,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'divine',
        range: 3,
        aoeRadius: 1,
        comboHeal: 96
    },
    'unholy|unholy': {
        name: 'Abyssal Pact',
        desc: 'Two dark souls channel abyssal energy into a devastating life-siphoning strike.',
        dmg: 224,
        kind: 'lifeDrain',
        damageType: 'magic',
        spellType: 'unholy',
        range: 3,
        drainPct: 0.40
    },
    'anomaly|anomaly': {
        name: 'Reality Fracture',
        desc: 'Twin anomalies tear the fabric of reality, warping everything nearby.',
        dmg: 144,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'anomaly',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{ id: 'stagger', duration: 1 }]
    },
    'tech|tech': {
        name: 'System Override',
        desc: 'Synchronized tech assault that overwhelms enemy systems.',
        dmg: 192,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'tech',
        range: 3,
        statusEffects: [{ id: 'silence', duration: 1 }, { id: 'jammed', duration: 2 }]
    },
    'human|human': {
        name: 'Combined Arms',
        desc: 'Coordinated human precision — a perfectly timed double strike.',
        dmg: 176,
        kind: 'damage',
        damageType: 'physical',
        spellType: 'human',
        range: 2,
        guaranteedCrit: true,
        statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }]
    },
    'alien|alien': {
        name: 'Cosmic Convergence',
        desc: 'Alien minds merge to project a devastating beam through all in its path.',
        dmg: 160,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'alien',
        range: 4,
        piercing: true
    },

    'divine|unholy': {
        name: 'Twilight Reckoning',
        desc: 'Light and darkness collide in a cataclysmic explosion. Power has a price.',
        dmg: 256,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'anomaly',
        range: 3,
        recoilPct: 0.10
    },
    'anomaly|divine': {
        name: 'Purifying Pulse',
        desc: 'Holy energy cleanses allies and scours enemies in a purifying wave.',
        dmg: 112,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'divine',
        range: 3,
        aoeRadius: 1,
        comboCleanse: true
    },
    'divine|tech': {
        name: 'Holy Ordnance',
        desc: 'Blessed munitions rain from above, smiting foes and mending allies.',
        dmg: 144,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'divine',
        range: 4,
        aoeRadius: 1,
        comboHeal: 64
    },
    'divine|human': {
        name: "Crusader's Charge",
        desc: 'A divinely empowered warrior charges the enemy with righteous fury.',
        dmg: 176,
        kind: 'damage',
        damageType: 'physical',
        spellType: 'divine',
        range: 2,
        comboShield: 128
    },
    'alien|divine': {
        name: 'Astral Judgment',
        desc: 'Cosmic and divine forces converge to mark an area for delayed devastation.',
        dmg: 160,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'alien',
        range: 4,
        aoeRadius: 1,
        statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }]
    },
    'anomaly|unholy': {
        name: 'Chaos Eruption',
        desc: 'Dark corruption meets anomalous energy in a toxic eruption.',
        dmg: 128,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'unholy',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{ id: 'burn', duration: 2 }, { id: 'poison', duration: 2 }]
    },
    'tech|unholy': {
        name: 'Dark Protocol',
        desc: 'Corrupted technology delivers a payload of darkness and decay.',
        dmg: 160,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'unholy',
        range: 3,
        statusEffects: [{ id: 'discord', duration: 2 }, { id: 'poison', duration: 3 }]
    },
    'human|unholy': {
        name: 'Blood Pact',
        desc: 'A blood sacrifice fuels a devastating armor-piercing strike.',
        dmg: 240,
        kind: 'damage',
        damageType: 'physical',
        spellType: 'unholy',
        range: 2,
        ignoreArmor: true,
        recoilPct: 0.15
    },
    'alien|unholy': {
        name: 'Void Rift',
        desc: 'A rift between dimensions tears the target apart and hurls them elsewhere.',
        dmg: 160,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'alien',
        range: 3,
        statusEffects: [{ id: 'silence', duration: 1 }]
    },
    'anomaly|tech': {
        name: 'Glitch Bomb',
        desc: 'Reality-warping technology scrambles everything in the blast zone.',
        dmg: 112,
        kind: 'aoe',
        damageType: 'magic',
        spellType: 'anomaly',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{ id: 'stagger', duration: 1 }]
    },
    'anomaly|human': {
        name: 'Primal Surge',
        desc: 'Anomalous energy supercharges human combatants and blasts the nearest foe.',
        dmg: 128,
        kind: 'damage',
        damageType: 'physical',
        spellType: 'anomaly',
        range: 2,
        comboInspire: true
    },
    'alien|anomaly': {
        name: 'Dimensional Tear',
        desc: 'A rift cuts through space, ignoring all obstacles in its path.',
        dmg: 144,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'alien',
        range: 4,
        ignoreObstacles: true
    },
    'human|tech': {
        name: 'Tactical Strike',
        desc: 'Technology-assisted precision — a perfectly calculated armor-piercing hit.',
        dmg: 176,
        kind: 'damage',
        damageType: 'physical',
        spellType: 'tech',
        range: 3,
        ignoreArmor: true,
        statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 40 }]
    },
    'alien|tech': {
        name: 'Plasma Cascade',
        desc: 'Alien-enhanced plasma arcs between multiple targets.',
        dmg: 128,
        kind: 'damage',
        damageType: 'magic',
        spellType: 'tech',
        range: 3,
        chainProfile: [128, 96, 96],
        chainRadius: 2
    },
    'alien|human': {
        name: 'Hybrid Assault',
        desc: 'Human ferocity meets alien precision in a relentless multi-hit barrage.',
        dmg: 48,
        kind: 'multiHit',
        damageType: 'physical',
        spellType: 'human',
        range: 2,
        hitDamages: [48, 48, 48, 48, 48]
    }
}

function createStatusIconDataUri(symbol, bg = '#223047', fg = '#ffffff', stroke = '#a9c6ff') {
    const plain = String(symbol || '').replace(/<[^>]+>/g, '').trim();
    const isLikelyEmoji = /[\u2190-\u2BFF\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF]/.test(plain);
    const fontSize = plain.length <= 1 ? (isLikelyEmoji ? 10.5 : 9.4) : 7.1;
    const fontFamily = isLikelyEmoji ? 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' : 'Verdana,Arial,sans-serif';
    const fontWeight = isLikelyEmoji ? '400' : '700';
    const y = isLikelyEmoji ? 11.2 : 10.2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="1" width="14" height="14" rx="3" fill="${bg}" stroke="${stroke}"/><text x="8" y="${y}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fg}">${symbol}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
const STATUS_DEFS = {

    burn: {
        icon: '🔥',
        glyph: '🔥',
        short: 'BRN',
        label: 'Burn',
        colorText: 'burning',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        dot: 24,
        spriteName: 'burn',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/burn.png',
        iconSrc: createStatusIconDataUri('🔥', '#4a1f16', '#ffd3a8', '#ff7b4d'),
        onRoundEnd(unit) {
            // 💧 Standing in water or under rain-type weather puts the fire
            // out INSTEAD of ticking — belt-and-braces for any burn that
            // slipped past the soak/application gates mid-round.
            if ((typeof _unitIsSoaked === 'function' && _unitIsSoaked(unit))
                || (typeof _unitInRain === 'function' && _unitInRain(unit))) {
                if (typeof _douseBurnOnUnit === 'function' && _douseBurnOnUnit(unit)) return;
            }
            // One burn status for everything. A burn picked up from lava
            // escalates with the rounds spent standing in it (_lavaBurnStacks,
            // set by the lava terrain endTurn); a spell burn ticks flat 24.
            const stacks = unit._lavaBurnStacks || 0;
            if (stacks > 0 && typeof unitIsLavaAdapted === 'function' && unitIsLavaAdapted(unit)) return;
            const dmg = stacks > 0 ? Math.min(200, 32 + stacks * 32) : 24;
            const label = stacks > 0
                ? `${unitDisplayName(unit)} is burning in lava (×${stacks}): `
                : `Burn sears ${unitDisplayName(unit)}: `;
            // Spell-applied burns credit their applier (lava burns stay
            // environmental). Credit-only: damage math stays source-less.
            const _srcId = stacks === 0 && unit._statusSrc ? unit._statusSrc.burn : null;
            const _src = (_srcId && typeof unitFromId === 'function') ? unitFromId(_srcId) : null;
            if (_src && !_src.dead && _src.player !== unit.player) unit._lastDamageSource = _src;
            const _hpB = unit.hp;
            applyDamageToUnit(unit, dmg, label, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                // 50→1000 HP curve: source-less ticks scale by the victim's
                // level so a flat 24 doesn't gut a ~50-HP dungeon rookie.
                scaleByTargetLevel: true,
                flashColor: 'burn',
                // Burn is fire-element (2026-07-23): a healedByElement:'fire'
                // passive (Thermal Regen) turns any stray tick into healing.
                element: 'fire'
            });
            const _dealt = _hpB - unit.hp;
            if (_src && !_src.dead && _src.player !== unit.player && _dealt > 0) {
                _src._trackDmgDealt = (_src._trackDmgDealt || 0) + _dealt;
            }
        }
    },
    poison: {
        icon: '☠️',
        glyph: '☠',
        short: 'PSN',
        label: 'Poison',
        colorText: 'poisoned',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        dot: 32,
        spriteName: 'poison',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/poison.png',
        iconSrc: createStatusIconDataUri('☠', '#2a1c34', '#efdcff', '#b06ad3'),
        onRoundEnd(unit) {
            // Credit the applier (tracked in battle.js applyStatusPayload):
            // _lastDamageSource routes a tick kill to them; damage math stays
            // source-less on purpose (no atk/type multipliers on DOTs).
            const _srcId = unit._statusSrc && unit._statusSrc.poison;
            const _src = (_srcId && typeof unitFromId === 'function') ? unitFromId(_srcId) : null;
            if (_src && !_src.dead && _src.player !== unit.player) unit._lastDamageSource = _src;
            const _hpB = unit.hp;
            applyDamageToUnit(unit, 32, `Poison harms ${unitDisplayName(unit)}: `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                scaleByTargetLevel: true,
                flashColor: 'poison',
                spellElement: 'poison'   // affinity: resist halves the tick
            });
            const _dealt = _hpB - unit.hp;
            if (_src && !_src.dead && _src.player !== unit.player && _dealt > 0) {
                _src._trackDmgDealt = (_src._trackDmgDealt || 0) + _dealt;
            }
        }
    },
    silence: {
        icon: '🔇',
        glyph: '🔇',
        short: 'SIL',
        label: 'Silence',
        colorText: 'silenced',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        spriteName: 'silence',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/silence.png',
        iconSrc: createStatusIconDataUri('🔇', '#303543', '#f0f4ff', '#9aa8c7')
    },
    stun: {
        icon: '⚡',
        glyph: '⚡',
        short: 'STN',
        label: 'Stun',
        colorText: 'stunned',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        // Hard CC (2026-08-10 status pass): a stunned unit can't move OR act —
        // its blitz activation is skipped outright (getNextBlitzUnit, state.js),
        // same as frozen. Rooted is the move-only lockdown.
        blockMove: true,
        blockAction: true,
        spriteName: 'stun',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/stun.png',
        iconSrc: createStatusIconDataUri('⚡', '#3e2218', '#ffe6da', '#ff9c71')
    },
    root: {
        icon: '⛓️',
        glyph: '⛓️',
        short: 'RTD',
        label: 'Rooted',
        colorText: 'rooted',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        blockMove: true,
        iconSrc: createStatusIconDataUri('⛓️', '#2e2a1a', '#fff4d6', '#d4b45a')
    },
    stagger: {
        icon: '💫',
        glyph: '💫',
        short: 'STG',
        label: 'Stagger',
        colorText: 'staggered',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        apDrain: 1,
        spriteName: 'stagger',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/stagger.png',
        iconSrc: createStatusIconDataUri('💫', '#3e2e18', '#fff2da', '#ffb871')
        // The -1 AP happens the moment the status lands (see applyStatusPayload
        // in battle.js). Draining here in onRoundEnd never worked: the
        // round-start loop refills every unit to max AP right after the
        // end-of-round ticks, silently undoing the drain.
    },
    marked: {
        icon: '🎯',
        glyph: '🎯',
        short: 'MRK',
        label: 'Marked',
        colorText: 'marked',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        spriteName: 'marked',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/marked.png',
        iconSrc: createStatusIconDataUri('🎯', '#4b1a24', '#ffe4e8', '#ff6d8d')
    },
    /* (lasered deleted 2026-08-10 — it was a badge with no gameplay effect.
       The tracked shot (Headshot / turret paint) lives in state._delayedSpells
       and the on-screen red laser beam IS the indicator; no badge needed.) */
    jammed: {
        icon: '📵',
        glyph: '📵',
        short: 'JAM',
        label: 'Jammed',
        colorText: 'jammed',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        awrSet: 0,
        spriteName: 'jammed',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/jammed.png',
        iconSrc: createStatusIconDataUri('📵', '#2c183d', '#f6e6ff', '#c789ff')
    },
    drowning: {
        icon: '🌊',
        glyph: '🌊',
        short: 'DRW',
        label: 'Drowning',
        colorText: 'drowning',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        moveDelta: -1,
        spriteName: 'drowning',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/drowning.png',
        iconSrc: createStatusIconDataUri('🌊', '#0a2540', '#c8e8ff', '#4a9eff'),
        onRoundEnd(unit) {
            if (unitIsDeepWaterAdapted(unit)) return;
            // A unit only keeps drowning while it is actually standing in deep
            // water. If the ground beneath it changed (e.g. Rampart raised the
            // tile out of the water), the drowning ends instead of ticking.
            const _terr = typeof getTerrainAt === 'function' ? getTerrainAt(unit.x, unit.y) : 'deep_water';
            if (_terr !== 'deep_water') {
                unit._drowningStacks = 0;
                if (typeof clearStatus === 'function') clearStatus(unit, 'drowning');
                return;
            }
            const stacks = unit._drowningStacks || 1;
            const dmg = Math.min(160, 24 + stacks * 24);
            applyDamageToUnit(unit, dmg, `${typeof unitDisplayName === 'function' ? unitDisplayName(unit) : 'Unit'} is drowning (×${stacks}): `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                scaleByTargetLevel: true,
                flashColor: 'drowning'
            });
        }
    },
    wet: {
        icon: '💧',
        glyph: '💧',
        short: 'WET',
        label: 'Soaked',
        colorText: 'soaked',
        // 'marker' (not 'debuff') — standing in water makes you wet, period;
        // no resist roll, no Censer purge. Whether it helps or hurts depends
        // on what hits you next: lightning ×1.5, fire ×0.75, frost = frozen
        // solid, and a soaked unit can't be set on fire (see the elemental
        // combo layer in battle.js applyDamageToUnit).
        kind: 'marker',
        category: 'status',
        stack: 'max',
        iconSrc: createStatusIconDataUri('💧', '#0a2a45', '#d5ecff', '#5ab4ff')
    },
    // (lava_burn was merged into plain 'burn' — one burn status; lava just
    // escalates its tick via _lavaBurnStacks.)
    protect: {
        icon: '🛡️',
        glyph: '🛡',
        short: 'PRO',
        label: 'Protect',
        colorText: 'protected',
        kind: 'buff',
        category: 'status',
        stack: 'max',
        invulnerable: true,
        spriteName: 'protect',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/protect.png',
        iconSrc: createStatusIconDataUri('🛡', '#1b344d', '#ddf2ff', '#5fc7ff')
    },

    spawnGuard: {
        icon: '🛡️',
        glyph: '⛨',
        short: 'SPW',
        label: 'Spawn Guard',
        colorText: 'under spawn protection',
        kind: 'buff',
        category: 'status',
        stack: 'max',
        // General incoming-damage multiplier (see getStatusDamageTakenMultiplier
        // in battle.js). Granted for 1 round on respawn so fresh spawns can't
        // be instantly deleted at the spawn zone.
        damageTakenMult: 0.5,
        iconSrc: createStatusIconDataUri('⛨', '#1b3d2a', '#ddffe9', '#5fe0a0')
    },

    /* Removed: guardBreak / glare / drowsy / inspired / inspiredWeak. They were
       "statuses" whose only effect was a stat change — that's a stat CHANGE,
       not a status effect. Every former applier now uses statStageBoost
       (stackable ±5 stages) instead.

       2026-08-10 status pass: `statChange: true` marks the survivors of that
       family that still need an internal carrier (timed MOV/RNG deltas and
       stageMods have to live SOMEWHERE) but are NOT status effects. A
       statChange carrier never renders a badge, never lists in the pause-menu
       Status Library, and never shows a "Discord 2"-style panel entry — its
       effects surface purely through the existing stat-change chips
       (+1 ATK / MOV+2 / …) like every other stat change. */
    discord: {
        icon: '🔻',
        glyph: '🔻',
        short: 'DIS',
        label: 'Discord',
        colorText: 'discordant — ATK and DEF lowered',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        statChange: true,
        // Pure stat change, spoken in STAGES (see getStatStageCount). The old
        // +10 MP spell-cost tax was cut with the badge — a hidden tax nobody
        // could see was flavor pretending to be mechanics.
        stageMod: { atk: -2, def: -1 },
        iconSrc: createStatusIconDataUri('🔻', '#40182a', '#ffe6f0', '#d44a7a')
    },
    slow: {
        icon: '🐢',
        glyph: '🐢',
        short: 'SLW',
        label: 'Slow',
        colorText: 'slowed',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        moveDelta: -2,
        iconSrc: createStatusIconDataUri('🐢', '#2f2a40', '#efe7ff', '#b89cff')
    },
    overclock: {
        icon: '⚙️',
        glyph: '⚙',
        short: 'OVR',
        label: 'Overclock',
        colorText: 'overclocked',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        statChange: true,
        // Stat change, not a status: +1 ATK stage, +1 MOV, and +1 RNG for
        // tech races (battle.js getEffectiveRange). Shown via the stat chips.
        stageMod: { atk: 1 },
        moveDelta: 1,
        iconSrc: createStatusIconDataUri('⚙', '#2a3a18', '#e8ffd6', '#8fd44a')
    },
    regen: {
        icon: '💚',
        glyph: '💚',
        short: 'RGN',
        label: 'Regen',
        colorText: 'regenerating',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        iconSrc: createStatusIconDataUri('💚', '#173920', '#ddffe6', '#68d98a'),
        onRoundEnd(unit) {
            if (!unit || unit.dead) return;
            applyHealingToUnit(unit, 40, null);
        }
    },
    /* Homosapien capstone (Indomitable Will). The survive-lethal check lives
       in battle.js applyDamageToUnit: the first killing blow while this is
       active leaves the unit at 1 HP and consumes the status. */
    indomitable: {
        icon: '💢',
        glyph: '💢',
        short: 'IND',
        label: 'Indomitable',
        colorText: 'indomitable — the next killing blow leaves 1 HP',
        kind: 'buff',
        category: 'status',
        stack: 'max',
        iconSrc: createStatusIconDataUri('💢', '#3d2a10', '#fff3d6', '#ffb84a')
    },
    /* Fairy r2 (Pixie Dust) — pure movement buff, mirror image of Slow.
       statChange: no badge; the MOV+2 stat chip is the read. */
    pixieDust: {
        icon: '✨',
        glyph: '✨',
        short: 'PIX',
        label: 'Pixie Dust',
        colorText: 'dusted — moving 2 tiles further',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        statChange: true,
        moveDelta: 2,
        iconSrc: createStatusIconDataUri('✨', '#33301a', '#fffbe0', '#ffe45f')
    },
    guarding: {
        icon: '🛡️',
        glyph: '🛡',
        short: 'GRD',
        label: 'Guarding',
        colorText: 'guarding',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        // Guard braces against everything, in STAGES: +2 DEF soaks physical
        // hits, +2 MDEF soaks magic — for exactly the 1-turn Guard stance.
        stageMod: { def: 2, mdef: 2 },
        iconSrc: createStatusIconDataUri('🛡', '#1a2a3a', '#c8e8ff', '#5a9ad4')
    },

    // Carrier statuses for stat-stage buffs/debuffs (statStageBoost). The actual
    // ATK/DEF/SPD/INT magnitude lives on the unit.statStageMods ledger (each
    // application its own entry + countdown — battle.js applyStatStageBoost);
    // these carriers are DERIVED badges: visible while any entry of their sign
    // is live, providing only the icon/VFX and "empowered/weakened" wording.
    // statChange: they are stat changes, not status effects — the ±N stat
    // chips are the display.
    statUp: {
        icon: '⬆️',
        glyph: '⬆',
        short: 'PWR',
        label: 'Empowered',
        colorText: 'empowered',
        kind: 'buff',
        category: 'buff',
        stack: 'replace',
        statChange: true,
        iconSrc: createStatusIconDataUri('⬆', '#1f3a18', '#e6ffd6', '#7ad44a')
    },
    statDown: {
        icon: '⬇️',
        glyph: '⬇',
        short: 'WKN',
        label: 'Weakened',
        colorText: 'weakened',
        kind: 'debuff',
        category: 'debuff',
        stack: 'replace',
        statChange: true,
        iconSrc: createStatusIconDataUri('⬇', '#3a1818', '#ffd6d6', '#d44a4a')
    },

    shield: {
        icon: '🛡',
        glyph: '🛡',
        short: 'SHD',
        label: 'Shield',
        category: 'display',
        iconSrc: createStatusIconDataUri('🛡', '#163042', '#dff5ff', '#63d0ff')
    },
    hourglass: {
        icon: '⏳',
        glyph: '⏳',
        short: 'HGL',
        label: 'Hourglass',
        category: 'display',
        iconSrc: createStatusIconDataUri('⏳', '#3d3212', '#fff0bb', '#f1d15d')
    },
    scanner: {
        icon: '📡',
        glyph: '📡',
        short: 'AWR',
        label: 'Scanner',
        category: 'display',
        iconSrc: createStatusIconDataUri('📡', '#173844', '#d7fbff', '#65eaff')
    },
    heal: {
        icon: '💚',
        glyph: '💚',
        short: 'HEAL',
        label: 'Heal',
        category: 'display',
        iconSrc: createStatusIconDataUri('💚', '#173920', '#ddffe6', '#68d98a')
    },
    mana: {
        icon: '🔹',
        glyph: '🔹',
        short: 'MP',
        label: 'Mana',
        category: 'display',
        iconSrc: createStatusIconDataUri('🔹', '#1b2745', '#e4ebff', '#84a2ff')
    },
    damage: {
        icon: '⚔️',
        glyph: '⚔',
        short: 'DMG',
        label: 'Damage',
        category: 'display',
        iconSrc: createStatusIconDataUri('⚔', '#42201f', '#ffe2df', '#ff8f87')
    },
    jackOfAll: {
        icon: '🃏',
        glyph: '🃏',
        short: 'JAK',
        label: 'Jack of All',
        colorText: 'versatile',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        statChange: true,
        // A spread of small stat changes (stages + MOV + RNG) — shown via the
        // stat chips, not a badge.
        stageMod: { atk: 1, int: 1, def: 1, mdef: 1 },
        moveDelta: 1,
        rangeDelta: 1,
        iconSrc: createStatusIconDataUri('🃏', '#2a2a3a', '#e8e0ff', '#9a8ad4')
    },
    invisible: {
        icon: '🌿',
        glyph: '🌿',
        short: 'INV',
        label: 'Invisible',
        colorText: 'invisible',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        untargetable: true,
        rangeDelta: 1,
        iconSrc: createStatusIconDataUri('🌿', '#1a3a1a', '#d6ffd6', '#5ad45a')
    },
    /* (steadyAim status deleted 2026-08-07 with its only applier, the cut
       Sniper spell of the same id — tree redesign §3.) */
    charm: {
        icon: '💋',
        glyph: '💋',
        short: 'CHM',
        label: 'Charm',
        colorText: 'charmed',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        // Head over heels: a charmed unit can't move or act (its AI valuation
        // and resist entry always treated it as hard CC — now it actually is).
        blockMove: true,
        iconSrc: createStatusIconDataUri('💋', '#3a1a2a', '#ffd6e8', '#d45a8a')
    },
    /* (sirenSong deleted 2026-08-10 — the "lured 1 tile at end of round"
       status was mush. Siren Song is now an honest hook: the mermaid ability
       raceSirenSong is a kind:'pull' spell that drags the target in on cast.) */
    contract: {
        icon: '📜',
        glyph: '📜',
        short: 'CTR',
        label: 'Contract',
        colorText: 'bound by an infernal contract — their violence feeds the fiend',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('📜', '#2a1a1a', '#ffd6d6', '#d45a5a')
        // The payoff lives in battle.js applyDamageToUnit: every time the
        // contracted unit DEALS damage, the contract-holder (tracked as
        // _contractCasterId) siphons 40% of it as healing.
    },

    /* ── 2026-07-17 spell/status pass ─────────────────────────────────────
       taunt    — Provoke: the victim may only aim single-target attacks and
                  spells at the taunter while the taunter is reachable.
                  Enforced in battle.js (doAttack/doSpell gates, target drum)
                  and steered in ai.js getTargetPriority. Caster is tracked
                  on the victim as _tauntCasterId (applyStatusPayload).
       minimize — Shrink Ray: -2 ATK stages via stageMod, and the 3D model
                  physically shrinks (three-renderer reads this status).
       statLock — Fermata: while live, applyStatStageBoost no-ops on this
                  unit and stageMod-carrying statuses are rejected — stats
                  can't be raised OR lowered by anyone.
       hexed    — Hex of Toil: the victim takes damage every time they move,
                  jump or cast (battle.js _procHexedOnAction). Caster tracked
                  as _hexCasterId for kill credit. */
    taunt: {
        icon: '🗯️',
        glyph: '🗯️',
        short: 'PRV',
        label: 'Provoked',
        colorText: 'provoked — forced to fight the challenger',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('🗯️', '#3a1c14', '#ffe0cc', '#ff8a50')
    },
    minimize: {
        icon: '🤏',
        glyph: '🤏',
        short: 'MIN',
        label: 'Minimized',
        colorText: 'shrunk down to size',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        stageMod: { atk: -2 },
        iconSrc: createStatusIconDataUri('🤏', '#1c2a34', '#d6f0ff', '#5ab0d4')
    },
    statLock: {
        icon: '🔏',
        glyph: '🔏',
        short: 'LCK',
        label: 'Stat Lock',
        colorText: 'stat-locked — no stat can change',
        kind: 'buff',
        category: 'status',
        stack: 'max',
        iconSrc: createStatusIconDataUri('🔏', '#2a2440', '#e8dcff', '#a88ae0')
    },
    hexed: {
        icon: '🕯️',
        glyph: '🕯️',
        short: 'HEX',
        label: 'Hexed',
        colorText: 'hexed — acting feeds the curse',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        iconSrc: createStatusIconDataUri('🕯️', '#241a2e', '#f0dcff', '#b06ad3')
    },
    frozen: {
        icon: '🧊',
        glyph: '🧊',
        short: 'FRZ',
        label: 'Frozen',
        colorText: 'frozen solid',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        blockMove: true,
        blockAction: true,
        iconSrc: createStatusIconDataUri('🧊', '#16303e', '#e0f6ff', '#7fd7ff')
        // Thawing is handled engine-side (battle.js _thawFrozenUnit /
        // _checkFrozenThaws): standing on/next to lava, taking a fire-element
        // hit, an adjacent ward (torch) being placed, or drought weather all
        // clear it early.
    },
    blind: {
        icon: '🌫️',
        glyph: '🌫️',
        short: 'BLD',
        label: 'Blind',
        colorText: 'blinded',
        kind: 'debuff',
        category: 'status',
        stack: 'max',
        iconSrc: createStatusIconDataUri('🌫️', '#2a2e33', '#eef2f6', '#9aa8b5')
        // Attack accuracy penalty is rolled in doAttack (battle.js): a blind
        // attacker misses 50% of the time.
    }
};
const STATUS_META = STATUS_DEFS;

/* Player-facing descriptions for the pause-menu Status Effect Library
   (ui.js _buildPauseStatusLibrary). Kept in one map so it doubles as the
   design-side inventory of every status in the game.
   RULE (2026-08-10): pure stat changes are NOT status effects and do not
   belong here — anything whose whole story is "a stat goes up/down" shows
   through the stat-change chips instead (statChange carriers: discord,
   overclock, pixieDust, jackOfAll, statUp, statDown). */
const STATUS_LIBRARY_DESCS = {
    burn:      'Takes fire damage at the end of every round. Standing in water or getting soaked puts it out.',
    poison:    'Takes poison damage at the end of every round.',
    silence:   'Cannot cast spells.',
    stun:      'Knocked senseless: cannot move OR act — the unit\'s next activation is skipped. Evasion drops to zero.',
    root:      'Bound in place: cannot move (flyers are dragged to the ground), but can still attack and cast. Evasion drops to zero.',
    stagger:   'Immediately loses 1 AP (or starts the next round with 1 less AP).',
    marked:    'The next hit against this unit consumes the mark for bonus damage.',
    jammed:    'Tech systems scrambled — abilities and targeting are disrupted.',
    drowning:  'Struggling in deep water: takes damage each round and can barely act.',
    wet:       'Soaked through. Immune to burn, but vulnerable to lightning and cold.',
    protect:   'Shielded — incoming damage is greatly reduced.',
    spawnGuard:'Fresh off a respawn: briefly protected from damage.',
    slow:      'Movement reduced by 2 while it lasts.',
    regen:     'Recovers HP at the end of every round.',
    guarding:  'Braced for impact — bonus defense until the next turn.',
    shield:    'A damage-absorbing barrier soaks incoming hits until it breaks.',
    hourglass: 'Time-locked by hourglass magic.',
    scanner:   'Scanned — this unit is revealed and tracked.',
    invisible: 'Cannot be seen or directly targeted by enemies until it acts.',
    charm:     'Beguiled — cannot move against the charmer.',
    indomitable: 'Refuses to die: the next killing blow leaves this unit at 1 HP.',
    contract:  'Bound by an infernal contract: 40% of any damage this unit deals is siphoned to the contract-holder as healing.',
    taunt:     'Provoked — must direct attacks at the taunter.',
    minimize:  'Shrunk down to toy size: weaker, but much harder to hit.',
    statLock:  'Stats are locked and cannot be raised or lowered.',
    hexed:     'Cursed — every action taken feeds the hex and hurts.',
    frozen:    'Encased in ice: cannot move or act. Thaws early on or next to lava, when hit by fire, when a ward (torch) is placed adjacent, or in drought weather.',
    blind:     'Vision whited out — attacks miss 50% of the time.'
};

const GOLD_PER_KILL = 10;
const GOLD_PER_ASSIST = 5;
const GOLD_PER_HOURGLASS = 5;
const GOLD_PASSIVE_PER_ROUND = 2;

const NEXUS_GOLD_PER_ROUND = 5;
const NEXUS_CHANNEL_COST_AP = 1;
const NEXUS_CAPTURE_THRESHOLD = 6;
const NEXUS_ZONE_SIZE = 2;

// ── ARENA COMPOSITE SCORING — single source of truth ──────────────────
// Read by the timer-expiry resolver + victory screen (battle.js) and the
// live scoreboard (hud.js). Tower damage is CAPPED so chip-poking the Cube
// can't outscore playing the objectives (destroying it outright is still
// an instant win); nexus control is the strongest per-round engine, and
// accrual doubles in the final rounds (see tickMatchClock) so a trailing
// team holding zones can close the gap.
// Display names for nexus zone keys (zones are placed on a diagonal across
// the fully-3D board: one always dead-center, one toward each corner).
window.NEXUS_LABELS = {
    earth: 'Central', nw: 'Northern', se: 'Southern',
    west: 'Western', east: 'Eastern', north: 'Northern', south: 'Southern',
    above: 'Sky', below: 'Cave', roaming: 'Hotspot',
    spawn1: 'P1 Spawn', spawn2: 'P2 Spawn',
};

window.ARENA_PTS = {
    kill: 15,           // per kill
    towerDmgPer10: 1,   // per 10 HP of damage to the enemy Cube…
    towerDmgCap: 150,   // …capped here (≈10 kills' worth)
    hourglass: 35,      // per hourglass carried at the buzzer
    nexusRound: 6,      // per nexus-control round accrued
    surgeLastRounds: 5, // final N rounds: nexus accrual is doubled ("Nexus Surge")
    bounty: 10,         // per bounty claimed (killing an ON FIRE unit) — on top of the kill's 15
};

// ── ACCOUNT ECONOMY (PvP) ──────────────────────────────────────────────
// Single source of truth for the persistent, account-level unlock economy.
// Challenge mode keeps its OWN separate wallet (state.campaignSave / save.gold)
// and must never read from or write to anything below.
const ACCT_UNIT_PRICE        = 5000;  // flat cost of EVERY unit. Same for all, intentionally.
const ACCT_BASE_COMPLETE     = 50;    // flat gold for finishing a PvP match (win OR loss)
const ACCT_WIN_MULT          = 1.5;   // multiplier applied to (base + collected) on a win
const ACCT_FLAWLESS_MULT     = 1.25;  // win-only: no friendly unit died. STACKS.
const ACCT_WIPEOUT_MULT      = 1.25;  // win-only: all enemy units dead. STACKS.
const ACCT_STARTING_GOLD     = 0;     // wallet balance for a brand-new account
const ACCT_FREE_TOKENS       = 1;     // free-unlock tokens granted at account creation
const ACCT_MATCH_GOLD_CAP    = 5000;  // server-side sanity cap on banked gold per match (anti-cheat)

// New accounts own these race keys (each playable in its default job).
// 2026-07-05: expanded to cover every race with a rigged 3D model wired (or
// planned) in sprites.js RACE_MODELS_3D.
const ACCT_STARTER_UNITS = [
  'men in black',   // Agent
  'wizard',         // Black Mage
  'werewolf',       // Raider
  'mad scientist',  // Engineer
  'homosapien',     // Freelancer
  'catgirl',        // Gunslinger
  'fortune teller', // Harbinger
  'bigfoot',        // Harvester
  'grey',           // Psychic
  'marksman',       // Sniper
  'knight',         // Warrior
  'fairy',          // White Mage
  'telepath',       // Psychic (human)
  'quarterback',    // QB — throws footballs
  'ki fighter',     // Ki Fighter
  'cowboy',         // Gunslinger (human)
  'atlantean',      // Atlantean
  'pirate',         // Raider (human)
  'vampire',        // Vampire
  'shaman',         // Harvester (human female 3D)
  'giant',          // Warrior (colossal 3D)
  'halfdemon',      // Agent/Assassin (3D)
  'martian',        // Gunslinger (3D — unlocked 2026-07-06)
  'machine elves',  // Engineer (3D — DMT clockwork elf)
  'nordic',         // Harbinger (3D — nordic alien male)
  'annunaki',       // Sniper (3D — Sumerian god)
  'demon',          // Black Mage (3D — red demon, male only)
  'scarecrow',      // Harvester (3D — 2026-07-11 batch, male only)
  'santa clause',   // White Mage (3D — 2026-07-11 batch, male only)
  'mermaid',        // White Mage (3D — 2026-07-11 batch, female only)
  'anubis',         // Black Mage (3D — 2026-07-11 batch, male only)
  'robinhood',      // Sniper (3D — archer)
  'antperson',      // Harvester (3D)
  'necromancer',    // Black Mage (3D — female only)
  'succubus',       // Psychic (3D — female only)
  'barbarella',     // Agent (3D — female only)
  'king arthur',    // Warrior (3D)
  'mantid',         // Psychic (3D)
  'mech',           // Gunslinger (3D — walking tank)
  'minotaur',       // Raider (3D)
  'mothman',        // Harbinger (3D)
  'reptilian',      // Agent (3D)
  'robot',          // Warrior/Tank (3D)
  'cyborg',         // Raider (3D — female only)
  'swordfighter',   // Swordmaster (3D — female only, 2026-07-13 batch)
  'zombie',         // Raider (3D — female only, 2026-07-13 batch)
  'fallen angel',   // Harbinger (3D — female only, 2026-07-13 batch)
  'priest',         // White Mage (3D — nun, female only; was never actually
                    // listed here despite the old comment — fixed 2026-07-19)
  // 2026-07-19 batch (sprites.js RACE_MODELS_3D):
  'yeti',           // bruiser (3D — frost cryptid, male only)
  'skeleton',       // undead (3D — male only)
  'kaiju',          // city-stomper (3D — male only)
  'superhero',      // flying bruiser (3D — female only)
  'demon princess', // flying hex-caster (3D — female only)
  'voidweaver',     // giant spider (3D — quadruped rig, male only)
  'honda civic',    // the transformer (3D — sedan + robot forms)
  // 2026-07-22 batch (sprites.js RACE_MODELS_3D — divine host wave):
  'valkraye',       // Swordmaster (3D — female only)
  'angel',          // White Mage (3D — female only)
  'ghost',          // White Mage (3D — female only)
  'nephilim',       // Warrior (3D — male only)
  // 2026-07-24 batch (sprites.js RACE_MODELS_3D):
  'djinn',          // Black Mage (3D — male only)
  'orb of light',   // Harbinger (3D — female only)
  // 2026-07-25 batch (sprites.js RACE_MODELS_3D — monsters & main characters;
  // kaiju remodel + halfdemon male land in already-listed races):
  'gnome',          // Engineer (3D — male only)
  'king kong',      // Harvester (3D — male only)
  'goatman',        // Raider (3D — male only)
  'kraken',         // Harbinger (3D — male only)
  'politician',     // Freelancer (3D — male only)
  'conspiracy theorist', // Harbinger (3D — male only)
  'overlord',       // Warrior (3D — male only)
  // 2026-08-06 batch (sprites.js RACE_MODELS_3D — prehistoric predators):
  'dinosaur',       // Raider (3D — male only)
  'dragon',         // flyer (3D — male only)
  // 2026-08-13 batch (sprites.js RACE_MODELS_3D — horrors, cryptids & the general):
  'black goo',      // Psychic (3D — male only)
  'cosmic wraith',  // Sniper (3D — male only)
  'dreameater',     // Psychic (3D — male only)
  'gargoyle',       // Sniper (3D — female only)
  'ghoul',          // Agent (3D — male only)
  'glitch',         // Engineer (3D — male only)
  'golem',          // Tank (3D — male only)
  'loch ness monster', // Tank (3D — male only)
  'general',        // Warrior (3D — male only)
  // NOTE: every race with a rigged 3D model in sprites.js RACE_MODELS_3D is a
  // starter, and the 3D-only gate in isUnitUnlocked() keeps anything listed
  // here shelved until its model ships. Keep server.js ACCT_STARTER_UNITS in
  // sync — the server unions this list into existing accounts on login.
];

// PvP modes that bank account gold. Gauntlet/Challenge route through their own
// campaign economy and are intentionally excluded here.
const ACCT_PVP_MODES = ['arena', 'tdm', 'clash'];

// One ownership check everything routes through. View-layer only — purchasing is
// always server-authoritative; this just decides what shows as owned/selectable.
function isUnitUnlocked(raceKey) {
  if (typeof window !== 'undefined' && window._DEV_UNLOCK_ALL) return true; // dev override, view-layer only
  // 3D-ONLY ROSTER RULE (2026-07-06): a vessel with no rigged 3D model (any
  // gender) is locked for EVERYONE — it can't be selected, started with, or
  // bought — so PvP/VS-CPU matches are always 3D vs 3D. Overrides account
  // unlocks on purpose: owning a sprite-only race keeps it shelved until its
  // model ships. (Campaign rosters don't route through this gate.)
  if (typeof isRace3DReady === 'function' && !isRace3DReady(raceKey)) return false;
  const acct = (typeof window !== 'undefined' && window.ProfileSystem && typeof window.ProfileSystem.getActiveProfile === 'function')
    ? (window.ProfileSystem.getActiveProfile() || {}).account
    : null;
  if (!acct || !Array.isArray(acct.unlockedUnits)) return ACCT_STARTER_UNITS.includes(raceKey); // offline fallback
  return acct.unlockedUnits.includes(raceKey);
}

// Exact reward formula (§0 of the spec). Mirrors what the server clamps on /bank.
function computeAccountMatchGold(opts) {
  opts = opts || {};
  const collected = Math.max(0, Math.round(opts.collected || 0));
  const playerWon = !!opts.playerWon;
  const noFriendlyDeaths = !!opts.noFriendlyDeaths;
  const allEnemiesDead = !!opts.allEnemiesDead;

  const winMult = playerWon ? ACCT_WIN_MULT : 1.0;
  let condMult = 1.0;
  if (playerWon && noFriendlyDeaths) condMult *= ACCT_FLAWLESS_MULT;
  if (playerWon && allEnemiesDead)   condMult *= ACCT_WIPEOUT_MULT;

  const total = Math.round((ACCT_BASE_COMPLETE + collected) * winMult * condMult);
  const matchGold = Math.min(total, ACCT_MATCH_GOLD_CAP);

  return {
    collected,
    base: ACCT_BASE_COMPLETE,
    winMult,
    flawless: playerWon && noFriendlyDeaths,
    wipeout: playerWon && allEnemiesDead,
    condMult,
    matchGold,
    capped: total > ACCT_MATCH_GOLD_CAP,
  };
}

// ── ACHIEVEMENT CATALOG (2026-08-31, ACHIEVEMENTS_PLAN.md Phase 1) ────────
// Registry only — data.js is the registry home so achievements.test.js can
// validate it headlessly via load-data.js. Runtime (counter folding at match
// commit, tier evaluation, toasts) lives in battle.js; persistence
// (profile.progress) lives in profile.js.
//
// Each line: { id, metric, cat, icon, name, desc, tiers } — `metric` names a
// counter in profile.progress.counters (stored {pvp, cpu, legacy}); tiers are
// strictly-ascending thresholds evaluated against the SUM of the buckets
// (offline play is first-class). `hw: true` marks high-water metrics (best
// streak): evaluated on the MAX bucket, merged by max() instead of addition.
// Unlock keys in profile.progress.unlocked are `${id}.${tierIdx}`.
const ACH_TIER_NAMES  = ['I', 'II', 'III', 'IV', 'V', 'VI'];
// Bronze / Silver / Gold / Diamond / Entropic (+ Entropic again for 6-step)
const ACH_TIER_COLORS = ['#cd7f32', '#c0c0c0', '#ffd700', '#b9f2ff', '#b06af0', '#b06af0'];

const ACH_CATALOG = [
  // ── Combat ──────────────────────────────────────────────────────────────
  { id: 'kills',           metric: 'kills',           cat: 'combat',      icon: '⚔️', name: 'Reaper',            desc: 'Defeat enemy units',                       tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'critsLanded',     metric: 'critsLanded',     cat: 'combat',      icon: '⚡', name: 'Critical Mass',     desc: 'Land critical hits',                       tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'attacksDodged',   metric: 'attacksDodged',   cat: 'combat',      icon: '💨', name: 'Phantom Step',      desc: 'Dodge enemy attacks',                      tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'backstabs',       metric: 'backstabs',       cat: 'combat',      icon: '🗡️', name: 'Shadow Dancer',     desc: 'Strike enemies from behind',               tiers: [1, 10, 100, 500, 1000] },
  { id: 'oppStrikes',      metric: 'oppStrikes',      cat: 'combat',      icon: '⚔️', name: 'No Escape',         desc: 'Punish retreats with opportunity strikes', tiers: [1, 10, 100, 500, 1000] },
  { id: 'followUps',       metric: 'followUps',       cat: 'combat',      icon: '🤜', name: 'Pincer Attack',     desc: 'Land follow-up attacks with an ally',      tiers: [1, 10, 100, 500, 1000] },
  { id: 'combosDone',      metric: 'combosDone',      cat: 'combat',      icon: '🤝', name: 'In Concert',        desc: 'Execute combo attacks',                    tiers: [1, 10, 100, 500, 1000] },
  { id: 'superBanes',      metric: 'superBanes',      cat: 'combat',      icon: '🧪', name: 'Bane Sommelier',    desc: 'Hit type weaknesses with banes',           tiers: [1, 10, 100, 500, 1000] },
  { id: 'firstBloods',     metric: 'firstBloods',     cat: 'combat',      icon: '🩸', name: 'Pathfinder of Ruin', desc: 'Draw first blood in a match',             tiers: [1, 10, 100, 500, 1000] },
  // ── Support ─────────────────────────────────────────────────────────────
  { id: 'statusesApplied', metric: 'statusesApplied', cat: 'support',     icon: '🌀', name: 'Alchemist of Fate', desc: 'Apply status effects',                     tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'buffsApplied',    metric: 'buffsApplied',    cat: 'support',     icon: '✨', name: 'Warden',            desc: 'Grant buffs',                              tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'debuffsApplied',  metric: 'debuffsApplied',  cat: 'support',     icon: '☠️', name: 'Hexweaver',         desc: 'Land debuffs',                             tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'healsApplied',    metric: 'healsApplied',    cat: 'support',     icon: '💚', name: 'Lifeline',          desc: 'Heal allied units',                        tiers: [1, 10, 100, 500, 1000] },
  { id: 'cleansesDone',    metric: 'cleansesDone',    cat: 'support',     icon: '🕊️', name: 'Purifier',          desc: 'Cleanse debuffs from allies',              tiers: [1, 10, 100, 500, 1000] },
  // ── Battlefield manipulation (the identity category) ────────────────────
  { id: 'entropyStrikes',  metric: 'entropyStrikes',  cat: 'battlefield', icon: '🌌', name: 'Agent of Entropy',  desc: 'Unleash Entropy Strikes',                  tiers: [1, 10, 100, 500, 1000] },
  { id: 'stormsSummoned',  metric: 'stormsSummoned',  cat: 'battlefield', icon: '🌪️', name: 'Weathermancer',     desc: 'Summon weather systems',                   tiers: [1, 10, 100, 500, 1000] },
  { id: 'displacements',   metric: 'displacements',   cat: 'battlefield', icon: '🎳', name: 'Force of Nature',   desc: 'Displace enemy units',                     tiers: [1, 10, 100, 500, 1000] },
  { id: 'tilesChanged',    metric: 'tilesChanged',    cat: 'battlefield', icon: '⛰️', name: 'Landscaper',        desc: 'Reshape battlefield tiles',                tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'flyersGrounded',  metric: 'flyersGrounded',  cat: 'battlefield', icon: '🕸️', name: 'Air Traffic Control', desc: 'Slam enemy flyers out of the sky',       tiers: [1, 10, 100, 500, 1000] },
  // ── Objectives ──────────────────────────────────────────────────────────
  { id: 'tilesScanned',    metric: 'tilesScanned',    cat: 'objectives',  icon: '📡', name: 'Cartographer',      desc: 'Scan battlefield tiles',                   tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'hourglasses',     metric: 'hourglasses',     cat: 'objectives',  icon: '⏳', name: 'Sands of Time',     desc: 'Collect hourglasses',                      tiers: [1, 10, 50, 100, 500, 1000] },
  { id: 'wins_hourglass',  metric: 'wins_hourglass',  cat: 'objectives',  icon: '⏳', name: 'Timekeeper',        desc: 'Win by collecting the hourglasses',        tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_wipeout',    metric: 'wins_wipeout',    cat: 'objectives',  icon: '💀', name: 'Annihilator',       desc: 'Win by wiping the enemy team',             tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_tower',      metric: 'wins_tower',      cat: 'objectives',  icon: '🗼', name: 'Cube Breaker',      desc: 'Win by destroying the Black Cube',         tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_nexus',      metric: 'wins_nexus',      cat: 'objectives',  icon: '🔮', name: 'Nexus Sovereign',   desc: 'Win by Nexus control',                     tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_composite',  metric: 'wins_composite',  cat: 'objectives',  icon: '🏛️', name: 'On Points',         desc: 'Win by aggregate score',                   tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_suddenDeath', metric: 'wins_suddenDeath', cat: 'objectives', icon: '⚡', name: 'Clutch',           desc: 'Win in sudden death',                      tiers: [1, 10, 50, 100] },
  { id: 'wins_flags',      metric: 'wins_flags',      cat: 'objectives',  icon: '🚩', name: 'Flagbearer',        desc: 'Win by flag captures',                     tiers: [1, 10, 100, 500] },
  // ── Modes ───────────────────────────────────────────────────────────────
  { id: 'wins_total',      metric: 'wins_total',      cat: 'modes',       icon: '🏆', name: 'Conqueror',         desc: 'Win matches — any mode',                   tiers: [1, 10, 100, 500, 1000, 10000] },
  { id: 'wins_arena',      metric: 'wins_arena',      cat: 'modes',       icon: '🏰', name: 'Arena Champion',    desc: 'Win Arena matches',                        tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_tdm',        metric: 'wins_tdm',        cat: 'modes',       icon: '💀', name: 'Deathmatch Legend', desc: 'Win Team Deathmatch matches',              tiers: [1, 10, 100, 500, 1000] },
  { id: 'wins_clash',      metric: 'wins_clash',      cat: 'modes',       icon: '🎴', name: 'Clash Master',      desc: 'Win Clash battles',                        tiers: [1, 10, 100, 500] },
  { id: 'wins_simul',      metric: 'wins_simul',      cat: 'modes',       icon: '♟️', name: 'Simul Grandmaster', desc: 'Win Simul matches',                        tiers: [1, 10, 100, 500] },
  { id: 'wins_gauntlet',   metric: 'wins_gauntlet',   cat: 'modes',       icon: '⚔️', name: 'Gauntlet Runner',   desc: 'Win Gauntlet matches',                     tiers: [1, 10, 100, 500] },
  { id: 'md_clears',       metric: 'md_clears',       cat: 'modes',       icon: '🗝️', name: 'Depthdelver',       desc: 'Clear Mystery Dungeon runs',               tiers: [1, 5, 10, 25] },
  { id: 'bestStreak',      metric: 'bestStreak',      cat: 'modes',       icon: '🔥', name: 'Perpetual Motion',  desc: 'Best win streak',                          tiers: [3, 5, 10, 15, 20], hw: true },
  { id: 'comebacks',       metric: 'comebacks',       cat: 'modes',       icon: '🔄', name: 'Against the Odds',  desc: 'Win matches you were clearly losing',      tiers: [1, 10, 100, 500, 1000] },
  { id: 'challenge_runWins',    metric: 'challenge_runWins',    cat: 'modes', icon: '🛡️', name: 'Gauntlet Ironman', desc: 'Best Gauntlet run (wins in one run)',   tiers: [5, 10, 15, 20, 25], hw: true },
  { id: 'survival_bestStreak',  metric: 'survival_bestStreak',  cat: 'modes', icon: '🌊', name: 'Last Bastion',     desc: 'Best Survival streak',                  tiers: [3, 5, 10, 15, 20], hw: true },
  { id: 'md_bestFloor',    metric: 'md_bestFloor',    cat: 'modes',       icon: '🕳️', name: 'Deep Delver',       desc: 'Deepest Mystery Dungeon floor cleared',    tiers: [5, 10, 15, 20], hw: true },
  // Champion-mastery meta (§4.1): a champ is Mastered at kills ≥ ACH_MASTERY.kills
  // + wins ≥ ACH_MASTERY.wins + deathless ≥ ACH_MASTERY.deathless. This line
  // counts mastered champs (evaluated at match commit, stored high-water).
  { id: 'champsMastered',  metric: 'champsMastered',  cat: 'modes',       icon: '👑', name: 'Heat Death',        desc: 'Fully master champions (100 kills · 100 wins · 10 deathless each)', tiers: [1, 5, 10, 25, 50, 96], hw: true },
];

// What a champ must reach on each mastery ladder to count as Mastered
// (deliberately tier III / III / II — see plan §4.1: the meta-chase must not
// require the inhuman 1000-win tiers).
const ACH_MASTERY = { kills: 100, wins: 100, deathless: 10 };

// Gold paid per tier unlocked (§4.7 — Bronze/Silver/Gold/Diamond/Entropic;
// index = tierIdx). Paid through creditLocalGold at match commit; the silent
// career-seed pre-unlocks never pay (they are stamped before any commit).
const ACH_TIER_REWARDS = [100, 250, 750, 2000, 5000, 5000];

// Per-champ mastery ladders — applied to EVERY race key in AVAILABLE_RACES
// (96 lines × 3 would bloat the catalog; the spec is the source of truth).
// Progress lives in profile.progress.champs[race][metric] ({pvp,cpu,legacy});
// unlock keys are `champ.${race}.${metric}.${tierIdx}`.
const ACH_CHAMP_LINES = [
  { metric: 'kills',     name: 'Kills',           icon: '⚔️', tiers: [1, 10, 100, 500, 1000] },
  { metric: 'wins',      name: 'Wins',            icon: '🏆', tiers: [1, 10, 100, 500, 1000] },
  { metric: 'deathless', name: 'Deathless Wins',  icon: '✨', tiers: [1, 10, 50, 100] },
];

// Personal records (ACHIEVEMENTS_PLAN.md §5, Phase 3). Stored in
// profile.progress.records[id][bucket] = { value, ts, meta } with SEPARATE
// pvp and cpu boards (a best farmed vs Easy CPU never overwrites a real PvP
// best). Standard matches only — Challenge/Dungeon have their own ladders.
// `fmt: 'ms'` renders as m:ss; `min: true` = lower is better (fastest win);
// `end: true` = only measurable at match end (no mid-match fanfare — these
// get their moment on the post-match Records panel instead).
const ACH_RECORD_DEFS = [
  // Live records — can break (and celebrate) mid-match, in priority order:
  { id: 'biggestHit',      icon: '💥', name: 'Biggest Hit',      desc: 'Most damage in one action',            fmt: 'dmg' },
  { id: 'dmgTurn',         icon: '⚔️', name: 'Turn Damage',      desc: 'Most damage in one turn',              fmt: 'dmg' },
  { id: 'dmgRound',        icon: '🔥', name: 'Round Damage',     desc: 'Most damage in one round',             fmt: 'dmg' },
  { id: 'killStreak',      icon: '☠️', name: 'Kill Streak',      desc: 'Longest kill streak by one unit',      fmt: 'count' },
  { id: 'biggestOverkill', icon: '💀', name: 'Biggest Overkill', desc: 'Most excess damage on a killing blow', fmt: 'dmg' },
  // Match-end records:
  { id: 'mostKills',       icon: '🏆', name: 'Match Kills',      desc: 'Most kills in one match',              fmt: 'count', end: true },
  { id: 'mostHealing',     icon: '💚', name: 'Match Healing',    desc: 'Most healing in one match',            fmt: 'hp',    end: true },
  { id: 'towerDmg',        icon: '🗼', name: 'Cube Damage',      desc: 'Most Black Cube damage in one match',  fmt: 'dmg',   end: true },
  { id: 'fastestWin',      icon: '⚡', name: 'Fastest Win',      desc: 'Quickest victory',                     fmt: 'ms',    end: true, min: true },
  { id: 'longestMatch',    icon: '⏱️', name: 'Longest Match',    desc: 'Longest completed match',              fmt: 'ms',    end: true },
];

/* ═══ PROGRESS SYNC MERGE + REWARD HELPERS (ACHIEVEMENTS_PLAN.md §7, Phase 5)
   Shared by THREE consumers so they can never drift: profile.js (merging the
   server's sync response into the possibly-already-advanced local blob),
   server.js (merging a pushed blob into the stored one — it loads data.js
   headlessly via load-data.js, exactly like the ECON derivation), and
   achievements.test.js. profile.progress is monotonic by construction, so
   the merge is a G-counter CRDT join (plan §2.3): commutative, idempotent,
   safe under retries, offline gaps and multi-device drift.
   The merge also SANITIZES — the server feeds it untrusted client blobs —
   so both inputs are treated defensively: unknown record ids, malformed
   keys and non-finite/negative values are dropped, everything is clamped,
   and unknown top-level fields do not survive (schema is v2; a future v3
   extends this function first). ═══════════════════════════════════════ */

// Hard ceilings so a hostile blob can't balloon the stored row: key-count
// caps per section plus a universal value clamp.
const ACH_MERGE_CAPS = { counters: 256, champs: 256, unlocked: 12000, value: 1e9 };

function mergeProgressBlobs(a, b) {
  const METRIC_RE = /^[A-Za-z0-9_]{1,48}$/;                 // counter metric names
  const RACE_RE = /^[a-z0-9][a-z0-9 '&_-]{0,47}$/i;         // race keys (no '.', it delimits unlock keys)
  const KEY_RE = /^[A-Za-z0-9_][A-Za-z0-9_. '&-]{0,95}$/;   // unlock keys
  // Bracket-assigning these on a plain object mutates its prototype instead
  // of adding an own property — never let them through as keys.
  const badKey = k => k === '__proto__' || k === 'constructor' || k === 'prototype';
  const clampVal = v => {
    v = Math.round(Number(v));
    return (isFinite(v) && v > 0) ? Math.min(v, ACH_MERGE_CAPS.value) : 0;
  };
  const clampTs = v => {
    v = Math.round(Number(v));
    return (isFinite(v) && v > 0 && v < 4e12) ? v : Date.now();
  };
  const champMetrics = new Set(ACH_CHAMP_LINES.map(s => s.metric));
  const recDefs = {};
  for (const d of ACH_RECORD_DEFS) recDefs[d.id] = d;

  const out = { v: 2, counters: {}, champs: {}, records: {}, unlocked: {} };
  let nCounters = 0, nChamps = 0, nUnlocked = 0;
  for (const src of [a, b]) {
    if (!src || typeof src !== 'object') continue;
    // Counters: per-bucket max (G-counter join — correct for additive AND
    // high-water metrics alike under full-blob pushes).
    const counters = (src.counters && typeof src.counters === 'object') ? src.counters : {};
    for (const m of Object.keys(counters)) {
      if (!METRIC_RE.test(m) || badKey(m)) continue;
      let dst = out.counters[m];
      if (!dst) {
        if (nCounters >= ACH_MERGE_CAPS.counters) continue;
        dst = out.counters[m] = { pvp: 0, cpu: 0, legacy: 0 };
        nCounters++;
      }
      const bag = counters[m] || {};
      for (const bk of ['pvp', 'cpu', 'legacy']) dst[bk] = Math.max(dst[bk], clampVal(bag[bk]));
    }
    // Per-champ bags: same join, metrics restricted to the mastery ladders.
    const champs = (src.champs && typeof src.champs === 'object') ? src.champs : {};
    for (const race of Object.keys(champs)) {
      if (!RACE_RE.test(race) || badKey(race)) continue;
      let bagOut = out.champs[race];
      if (!bagOut) {
        if (nChamps >= ACH_MERGE_CAPS.champs) continue;
        bagOut = out.champs[race] = {};
        nChamps++;
      }
      const bagIn = champs[race] || {};
      for (const m of Object.keys(bagIn)) {
        if (!champMetrics.has(m)) continue;
        const dst = bagOut[m] || (bagOut[m] = { pvp: 0, cpu: 0, legacy: 0 });
        const c = bagIn[m] || {};
        for (const bk of ['pvp', 'cpu', 'legacy']) dst[bk] = Math.max(dst[bk], clampVal(c[bk]));
      }
    }
    // Records: per board (pvp/cpu) keep the BETTER value — min-is-better
    // records (fastestWin) join by min, everything else by max; a tie keeps
    // the incumbent side (earliest writer wins its metadata).
    const records = (src.records && typeof src.records === 'object') ? src.records : {};
    for (const id of Object.keys(records)) {
      const def = recDefs[id];
      if (!def) continue;
      const boards = records[id] || {};
      for (const bk of ['pvp', 'cpu']) {
        const r = boards[bk];
        if (!r || typeof r !== 'object') continue;
        const value = clampVal(r.value);
        if (!value) continue;
        const dst = out.records[id] || (out.records[id] = {});
        const cur = dst[bk];
        if (cur && !(def.min ? value < cur.value : value > cur.value)) continue;
        const meta = (r.meta && typeof r.meta === 'object' && typeof r.meta.mode === 'string')
          ? { mode: r.meta.mode.slice(0, 40) } : {};
        dst[bk] = { value, ts: clampTs(r.ts), meta };
      }
    }
    // Unlocked: union, earliest timestamp wins.
    const unlocked = (src.unlocked && typeof src.unlocked === 'object') ? src.unlocked : {};
    for (const key of Object.keys(unlocked)) {
      if (!KEY_RE.test(key) || badKey(key)) continue;
      const ts = clampTs(unlocked[key]);
      if (out.unlocked[key] !== undefined) {
        if (ts < out.unlocked[key]) out.unlocked[key] = ts;
      } else if (nUnlocked < ACH_MERGE_CAPS.unlocked) {
        out.unlocked[key] = ts;
        nUnlocked++;
      }
    }
  }
  return out;
}

/* Gold one unlock key is worth (§4.7) — mirrors what commitAchProgress pays
   through creditLocalGold: catalog-line keys `${id}.${tierIdx}` and champ
   keys `champ.${race}.${metric}.${tierIdx}` pay ACH_TIER_REWARDS[tierIdx];
   grandfathered `feat_*` one-shots and anything unrecognized pay nothing. */
let _achRaceSet = null;
function achUnlockKeyReward(key) {
  if (typeof key !== 'string' || key.startsWith('feat_')) return 0;
  const champ = key.match(/^champ\.(.+)\.([A-Za-z]+)\.(\d+)$/);
  if (champ) {
    if (!_achRaceSet) _achRaceSet = new Set(AVAILABLE_RACES);
    if (!_achRaceSet.has(champ[1])) return 0;
    const spec = ACH_CHAMP_LINES.find(s => s.metric === champ[2]);
    const tier = parseInt(champ[3], 10);
    if (!spec || tier >= spec.tiers.length) return 0;
    return ACH_TIER_REWARDS[tier] || 0;
  }
  const std = key.match(/^([A-Za-z0-9_]+)\.(\d+)$/);
  if (std) {
    const line = ACH_CATALOG.find(l => l.id === std[1]);
    const tier = parseInt(std[2], 10);
    if (!line || tier >= line.tiers.length) return 0;
    return ACH_TIER_REWARDS[tier] || 0;
  }
  return 0;
}

/* Champs meeting the full mastery bar (§4.1) — the data-side twin of
   battle.js _achCountMastered, for the server's token payout. */
function achCountMasteredChamps(prog) {
  const champs = (prog && prog.champs && typeof prog.champs === 'object') ? prog.champs : {};
  let mastered = 0;
  for (const race of Object.keys(champs)) {
    const bag = champs[race] || {};
    const tot = m => {
      const c = bag[m];
      return c ? (c.pvp || 0) + (c.cpu || 0) + (c.legacy || 0) : 0;
    };
    if (tot('kills') >= ACH_MASTERY.kills && tot('wins') >= ACH_MASTERY.wins
      && tot('deathless') >= ACH_MASTERY.deathless) mastered++;
  }
  return mastered;
}

/* What a sync merge owes the account (server-side §4.7 reconciliation):
   tier gold for every unlock key `after` carries that `before` did not,
   plus one free token per newly-mastered champ. Idempotent by construction
   — a key or mastery crossing can only be "new" once, so retries and
   re-pushes never double-pay. The caller (server.js) applies this only
   when a stored baseline exists: the FIRST sync of an account stores the
   blob silently, so a veteran's migration-seeded pre-unlocks (which the
   client deliberately never paid) don't arrive as a gold windfall. */
function achComputeSyncRewards(before, after) {
  const prevUnlocked = (before && before.unlocked) || {};
  const nextUnlocked = (after && after.unlocked) || {};
  let gold = 0;
  for (const key of Object.keys(nextUnlocked)) {
    if (prevUnlocked[key] === undefined) gold += achUnlockKeyReward(key);
  }
  const tokens = Math.max(0, achCountMasteredChamps(after) - achCountMasteredChamps(before));
  return { gold, tokens };
}

/* ═══ CURATED STEAM SCHEMA (ACHIEVEMENTS_PLAN.md §8, Phase 6) ═══════════════
   The in-game catalog is unlimited; Steam gets a curated subset that must
   stay under Valve's 100-achievement cap for new games (§2.1). This registry
   is the single source of truth for BOTH sides of the pipe:
   - the game (battle.js `_steamPushProgress`) computes stat values and earned
     achievement ids from profile.progress and asserts them through the
     4-function SteamGlue surface (§8.1 — no-op in browser builds);
   - the repo tool `steam-schema.js` prints this registry as the checklist the
     owner types into the Steamworks admin panel (stat-backed achievements get
     Valve's native progress bar for free).
   Loads headlessly via load-data.js so achievements.test.js validates it.

   Shape per achievement def:
   - { id, kind:'stat', stat, threshold, name, desc } — earned when the named
     Steam stat reaches threshold. `stat` is a STEAM_STAT_DEFS id; threshold
     MUST be one of the backing catalog line's real tier values (test-pinned)
     so Steam unlocks land at the same moment as the in-game tier.
   - { id, kind:'feat', feat, name, desc } — 1:1 mirror of a legacy one-shot
     (battle.js ACHIEVEMENT_DEFS id). Earned = present in the legacy
     achievements store (or its `feat_*` migration mirror in progress.unlocked).
   API ids are ACH_/STAT_-prefixed A-Z0-9_ — Steamworks-safe names. */

/* Two Steam tiers per curated profile-wide line (§8.2: the "everyone gets
   this" tier and the "dedication" tier); mode-spine lines expose only the
   first win. Thresholds are validated against ACH_CATALOG tiers by
   achievements.test.js — edit the catalog and this list together. */
const STEAM_LINE_PICKS = [
  ['kills',           100, 10000],
  ['wins_total',      10,  1000],
  ['critsLanded',     100, 10000],
  ['attacksDodged',   100, 10000],
  ['backstabs',       100, 1000],
  ['followUps',       100, 1000],
  ['combosDone',      100, 1000],
  ['superBanes',      100, 1000],
  ['statusesApplied', 100, 10000],
  ['buffsApplied',    100, 10000],
  ['debuffsApplied',  100, 10000],
  ['healsApplied',    100, 1000],
  ['cleansesDone',    100, 1000],
  ['entropyStrikes',  100, 1000],
  ['stormsSummoned',  100, 1000],
  ['displacements',   100, 1000],
  ['tilesChanged',    100, 10000],
  ['flyersGrounded',  10,  500],
  ['tilesScanned',    100, 10000],
  ['hourglasses',     50,  1000],
  ['comebacks',       10,  500],
  ['bestStreak',      3,   20],       // 20 = "Perpetual Motion", a designed rare
  // Mode spine (§8.2): first win in each of the five PvP modes.
  ['wins_arena',      1],
  ['wins_tdm',        1],
  ['wins_clash',      1],
  ['wins_simul',      1],
  ['wins_gauntlet',   1],
];

/* Steam stats (all INT, default 0): one per curated line (id = the catalog
   metric name, so the Steamworks panel reads like the profile store) plus two
   derived roster stats backing the collapsed champion set (§8.2 — the 96-champ
   grid can never be 1:1 Steam achievements, §2.1). */
const STEAM_STAT_DEFS = STEAM_LINE_PICKS.map(p => ({ id: p[0], metric: p[0] }))
  .concat([
    { id: 'champs_won',      derived: 'champsWon' },      // distinct champs with ≥1 win
    { id: 'champs_mastered', derived: 'champsMastered' }, // full ACH_MASTERY bar
  ]);

const STEAM_ACH_DEFS = (() => {
  const defs = [];
  // Stat-backed tiers from the picks.
  for (const pick of STEAM_LINE_PICKS) {
    const line = ACH_CATALOG.find(l => l.id === pick[0]);
    if (!line) continue;
    for (const th of pick.slice(1)) {
      const tierIdx = line.tiers.indexOf(th);
      defs.push({
        id: 'ACH_' + line.id.toUpperCase() + '_' + th,
        kind: 'stat', stat: line.metric, threshold: th,
        name: line.name + (line.tiers.length > 1 && tierIdx >= 0 ? ' ' + ACH_TIER_NAMES[tierIdx] : ''),
        desc: line.desc + ' — ' + th.toLocaleString('en-US'),
      });
    }
  }
  // Collapsed champion set (6): win with N distinct champs + mastery meta.
  const roster = AVAILABLE_RACES.length;
  defs.push(
    { id: 'ACH_CHAMPS_WON_5',    kind: 'stat', stat: 'champs_won', threshold: 5,      name: 'Talent Scout',     desc: 'Win a match with 5 different champions' },
    { id: 'ACH_CHAMPS_WON_25',   kind: 'stat', stat: 'champs_won', threshold: 25,     name: 'Headhunter',       desc: 'Win a match with 25 different champions' },
    { id: 'ACH_CHAMPS_WON_ALL',  kind: 'stat', stat: 'champs_won', threshold: roster, name: 'The Whole Roster', desc: 'Win a match with every champion' },
    { id: 'ACH_MASTER_1',        kind: 'stat', stat: 'champs_mastered', threshold: 1,      name: 'Mastered',    desc: 'Fully master a champion (100 kills · 100 wins · 10 deathless wins)' },
    { id: 'ACH_MASTER_10',       kind: 'stat', stat: 'champs_mastered', threshold: 10,     name: 'Tenfold Crown', desc: 'Fully master 10 champions' },
    { id: 'ACH_HEAT_DEATH',      kind: 'stat', stat: 'champs_mastered', threshold: roster, name: 'Heat Death',  desc: 'Fully master every champion' },
  );
  // Feats 1:1 (§8.2 — "they're the personality"). `feat` = the battle.js
  // ACHIEVEMENT_DEFS id (test-guarded against the battle.js source). Display
  // copy is duplicated here deliberately: the admin panel needs it at schema
  // time, and Steam copy may diverge from in-game copy later.
  defs.push(
    { id: 'ACH_FEAT_FIRSTBLOOD',      kind: 'feat', feat: 'firstBlood',      name: 'First Blood',     desc: 'Get the first kill in a match' },
    { id: 'ACH_FEAT_DOUBLEKILL',      kind: 'feat', feat: 'doubleKill',      name: 'Double Kill',     desc: 'Get 2 kills in the same turn with one unit' },
    { id: 'ACH_FEAT_TRIPLEKILL',      kind: 'feat', feat: 'tripleKill',      name: 'Triple Kill',     desc: 'Get 3 kills in the same turn with one unit' },
    { id: 'ACH_FEAT_RAMPAGE',         kind: 'feat', feat: 'rampage',         name: 'Rampage',         desc: 'Get 4+ kills in the same turn with one unit' },
    { id: 'ACH_FEAT_OVERKILL',        kind: 'feat', feat: 'overkill',        name: 'Overkill',        desc: 'Deal 50%+ of target max HP as excess damage' },
    { id: 'ACH_FEAT_LASTSTAND',       kind: 'feat', feat: 'lastStand',       name: 'Last Stand',      desc: 'Trigger Last Stand (drop below 20% HP)' },
    { id: 'ACH_FEAT_ACE',             kind: 'feat', feat: 'ace',             name: 'Ace',             desc: 'Win a match by elimination' },
    { id: 'ACH_FEAT_UNTOUCHABLE',     kind: 'feat', feat: 'untouchable',     name: 'Untouchable',     desc: 'Win with a unit that took 0 damage' },
    { id: 'ACH_FEAT_CRITMASTER',      kind: 'feat', feat: 'critMaster',      name: 'Crit Master',     desc: 'Land 3+ critical hits in one match' },
    { id: 'ACH_FEAT_COMBOKING',       kind: 'feat', feat: 'comboKing',       name: 'Combo King',      desc: 'Execute 3+ combo attacks in one match' },
    { id: 'ACH_FEAT_WEATHERSURVIVOR', kind: 'feat', feat: 'weatherSurvivor', name: 'Storm Survivor',  desc: 'Win a match with 2+ active weather events' },
    { id: 'ACH_FEAT_PERFECTVICTORY',  kind: 'feat', feat: 'perfectVictory',  name: 'Perfect Victory', desc: 'Win without losing any units' },
    { id: 'ACH_FEAT_WINSTREAK3',      kind: 'feat', feat: 'winStreak3',      name: 'Hot Streak',      desc: 'Win 3 matches in a row' },
    { id: 'ACH_FEAT_WINSTREAK5',      kind: 'feat', feat: 'winStreak5',      name: 'Unstoppable',     desc: 'Win 5 matches in a row' },
  );
  return defs;
})();

/* Current Steam stat values from a progress blob. Counter-backed stats sum
   the {pvp,cpu,legacy} buckets (hw lines take the max — same rule as
   battle.js `_achEvaluateTiers`, so Steam can never unlock before the
   in-game tier). Pure + cheap: safe to call at every match commit. */
function steamComputeStats(prog) {
  const out = {};
  const counters = (prog && prog.counters) || {};
  const champs = (prog && prog.champs) || {};
  for (const d of STEAM_STAT_DEFS) {
    if (d.metric) {
      const c = counters[d.metric];
      const line = ACH_CATALOG.find(l => l.metric === d.metric);
      out[d.id] = !c ? 0 : (line && line.hw
        ? Math.max(c.pvp || 0, c.cpu || 0, c.legacy || 0)
        : (c.pvp || 0) + (c.cpu || 0) + (c.legacy || 0));
    } else if (d.derived === 'champsWon') {
      let n = 0;
      for (const race of Object.keys(champs)) {
        const w = (champs[race] || {}).wins;
        if (w && ((w.pvp || 0) + (w.cpu || 0) + (w.legacy || 0)) >= 1) n++;
      }
      out[d.id] = n;
    } else if (d.derived === 'champsMastered') {
      out[d.id] = achCountMasteredChamps(prog || {});
    }
  }
  return out;
}

/* Every curated Steam achievement the local store has earned. Used by the
   boot re-assert and by each match commit — re-asserting an already-unlocked
   Steam achievement is a documented no-op (§2.1), so callers just assert the
   whole list and let local profile and Steam converge. `legacyAchievements`
   is the battle.js one-shot store (new feat unlocks land there first; the
   `feat_*` mirror in progress.unlocked only exists for migrated profiles). */
function steamEvalAchievements(prog, legacyAchievements) {
  const stats = steamComputeStats(prog);
  const legacy = legacyAchievements || {};
  const unlocked = (prog && prog.unlocked) || {};
  const out = [];
  for (const d of STEAM_ACH_DEFS) {
    if (d.kind === 'feat') {
      if (legacy[d.feat] || unlocked['feat_' + d.feat]) out.push(d.id);
    } else if ((stats[d.stat] || 0) >= d.threshold) {
      out.push(d.id);
    }
  }
  return out;
}

const MAP_LAYOUT_PRESETS = {
    prebuilt_custommap: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'grass_2' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    normal: {
        sections: {
            above:   null,
            buffer1: null,
            earth:   { startRow: 0, endRow: 3,  label: 'Earth', baseTerrain: 'grass' },
            buffer2: null,
            below:   null
        },
        barrierRows: [],
        barrierOpeningsX: [],
        hasFloors: false
    },

    medium: {
        sections: {
            above:   null,
            buffer1: null,
            earth:   { startRow: 0, endRow: 7,  label: 'Earth', baseTerrain: 'grass' },
            buffer2: null,
            below:   null
        },
        barrierRows: [],
        barrierOpeningsX: [],
        hasFloors: false
    },

    large: {
        sections: {
            above:   { startRow: 0,  endRow: 2,  label: 'Above', baseTerrain: 'cloud' },
            buffer1: { row: 3 },
            earth:   { startRow: 4,  endRow: 7,  label: 'Earth', baseTerrain: 'grass' },
            buffer2: { row: 8 },
            below:   { startRow: 9,  endRow: 11, label: 'Below', baseTerrain: 'cave_floor' }
        },
        barrierRows: [3, 8],
        barrierOpeningsX: [2, 6, 9],
        hasFloors: true
    },

    xlarge: {
        sections: {
            above:   { startRow: 0,  endRow: 4,  label: 'Above', baseTerrain: 'cloud' },
            buffer1: { row: 5 },
            earth:   { startRow: 6,  endRow: 13, label: 'Earth', baseTerrain: 'grass' },
            buffer2: { row: 14 },
            below:   { startRow: 15, endRow: 19, label: 'Below', baseTerrain: 'cave_floor' }
        },
        barrierRows: [5, 14],
        barrierOpeningsX: [3, 9, 14],
        hasFloors: true
    },

    huge: {
        sections: {
            above:   { startRow: 0,  endRow: 14, label: 'Above', baseTerrain: 'cloud' },
            buffer1: null,
            earth:   { startRow: 9,  endRow: 20, label: 'Earth', baseTerrain: 'grass' },
            buffer2: null,
            below:   { startRow: 15, endRow: 29, label: 'Below', baseTerrain: 'cave_floor' }
        },
        barrierRows: [],
        barrierOpeningsX: [],
        hasFloors: true,
        isElliptical: true
    },
};

let MAP_SECTIONS = {
    above:  { startRow: 0,  endRow: 2,  label: 'Above',  baseTerrain: 'cloud' },
    buffer1: { row: 3 },
    earth:  { startRow: 4,  endRow: 7,  label: 'Earth',  baseTerrain: 'grass' },
    buffer2: { row: 8 },
    below:  { startRow: 9,  endRow: 11, label: 'Below',  baseTerrain: 'cave_floor' }
};
let BARRIER_ROWS = [3, 8];
let BARRIER_OPENINGS_X = [2, 6, 9];
let MAP_HAS_FLOORS = true;

const PREBUILT_MAPS = {
    prebuilt_custommap: {
        name: 'Custom Map', w: 20, h: 20,
        monuments: [{"kind":"colossus","x":17,"y":18,"rot":0,"foot":2,"maxH":4,"seed":14340},{"kind":"arch","x":18,"y":17,"rot":0,"foot":3,"maxH":3,"seed":8454},{"kind":"arch","x":5,"y":0,"rot":0,"foot":3,"maxH":3,"seed":80466},{"kind":"colossus","x":7,"y":1,"rot":0,"foot":2,"maxH":4,"seed":42037},{"kind":"greek","x":17,"y":1,"rot":1,"foot":3,"maxH":2,"seed":16787},{"kind":"colossus","x":18,"y":4,"rot":90,"foot":2,"maxH":4,"seed":88471},{"kind":"exitsign","x":6,"y":12,"rot":0,"foot":1,"maxH":1,"seed":76283},{"kind":"exitsign","x":13,"y":12,"rot":0,"foot":1,"maxH":1,"seed":75886},{"kind":"exitsign","x":13,"y":7,"rot":0,"foot":1,"maxH":1,"seed":49281},{"kind":"exitsign","x":6,"y":7,"rot":0,"foot":1,"maxH":1,"seed":83192},{"kind":"exitsign","x":3,"y":11,"rot":0,"foot":1,"maxH":1,"seed":42403},{"kind":"fluorescent","x":3,"y":6,"rot":0,"foot":1,"maxH":2,"seed":88142},{"kind":"fluorescent","x":3,"y":3,"rot":0,"foot":1,"maxH":2,"seed":48235},{"kind":"fluorescent","x":3,"y":16,"rot":0,"foot":1,"maxH":2,"seed":42504},{"kind":"fluorescent","x":8,"y":6,"rot":0,"foot":1,"maxH":2,"seed":83443}],
        grid: [
            [3,3,6,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48],
            [3,3,6,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48],
            [3,3,6,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,55,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,1,1,1],
            [3,3,56,56,97,97,97,97,97,97,97,97,97,97,97,97,97,16,16,16],
            [56,56,56,56,74,74,74,74,74,71,71,74,74,71,74,74,71,74,74,74],
            [56,56,56,56,74,71,74,74,71,74,74,74,74,74,74,74,74,74,74,74],
            [3,3,56,56,97,97,97,97,97,97,97,97,97,97,97,97,97,16,16,16],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,13,13,13,13,13,13,97,97,13,13,13,13,13,13,48,48,48],
            [3,3,6,48,48,48,48,48,48,94,94,48,48,48,48,48,48,48,48,48],
            [3,3,6,48,48,48,48,48,48,94,94,48,48,48,48,48,48,48,48,48],
            [3,3,6,48,48,48,48,48,48,94,94,48,48,48,48,48,48,48,48,48]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[]],
            [[],[],[],[],[{"oid":27,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[{"oid":21,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{"oid":30,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":21,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[{"oid":24,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":25,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false},{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":3,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{"oid":48,"alignX":"center","alignY":"bottom","rot":89,"flipX":false,"flipY":false}],[{"oid":12,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":12,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":12,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":48,"alignX":"center","alignY":"bottom","rot":97,"flipX":false,"flipY":false}],[],[],[],[],[],[{"oid":12,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":12,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{"oid":12,"alignX":"center","alignY":"bottom","rot":181,"flipX":false,"flipY":false}],[{"oid":12,"alignX":"center","alignY":"bottom","rot":179,"flipX":false,"flipY":false}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{"oid":23,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":22,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[{"oid":21,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":28,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[{"oid":10,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[]],
            [[],[],[],[],[{"oid":23,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":24,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[{"oid":30,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{"oid":15,"alignX":"center","alignY":"bottom","rot":181,"flipX":false,"flipY":false}],[{"oid":15,"alignX":"center","alignY":"bottom","rot":178,"flipX":false,"flipY":false},{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false},{"oid":15,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false},{"oid":15,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":15,"alignX":"center","alignY":"bottom","rot":179,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[],[]],
            [[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":38,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[{"oid":1,"alignX":"center","alignY":"bottom","rot":0,"flipX":false,"flipY":false}],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        voxels: [
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:55}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:1}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:1}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:1}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:71}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:56}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:16}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:97}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:13}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:3}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:6}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:94}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}],[{z:0,tid:19},{z:1,tid:19},{z:2,tid:8},{z:3,tid:48}]]
        ],
        spawns: {"1":[{"x":7,"y":19},{"x":8,"y":19},{"x":9,"y":19},{"x":10,"y":19},{"x":11,"y":19},{"x":12,"y":19}],"2":[{"x":7,"y":0},{"x":8,"y":0},{"x":9,"y":0},{"x":10,"y":0},{"x":11,"y":0},{"x":12,"y":0}]}
    },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAP FORGE — procedural prebuilt-map builders (2026-07 map overhaul)
   ─────────────────────────────────────────────────────────────────────────────
   Every launch map is BUILT here at load time instead of shipping as a giant
   hand-authored literal. One builder per map ⇒ layered ground (lava / cave
   floor / dirt strata under a themed surface), sculpted height, objects,
   monuments, per-map terrain tints, and a per-map sky/fog/scenery preset
   (layout.env → state.mapEnv → three-renderer firmament dome).
   Each full map also auto-generates a 10×10 4v4 "Δ" (delta) variant — the
   competitive crop of its core, 180°-rotation-symmetric, for ranked play
   (think Smash Bros. delta stages).
   ─────────────────────────────────────────────────────────────────────────────
   ⚠ MF_TID / MF_OID MUST mirror map.js ME_TERRAIN_IDS / ME_OBJECT_IDS
   (append-only arrays; index = grid id). If a terrain/object is appended
   there, append it here.
   ═══════════════════════════════════════════════════════════════════════════ */

const MF_TID = (() => {
    const L = [null,
        'grass','water','deep_water','bridge','mountain','desert','tree','dirt','ice','lava',
        'scorched','well','road','ruins','crystal','mushroom','obsidian','healing_spring','cave_floor','cave_wall',
        'cave_entrance','cloud','cloud_thick','sky_open','storm','cloud_gap','sky_ruin','mountain_top','tree_top','cliff',
        'chasm','void','fog_wall','barrier','barrier_passage','nexus','nexus_cave','nexus_sky','sanctuary_church','sanctuary_shop',
        'tower_base','home_base','beanstalk','beanstalk_top','descent_point','sanctuary','purple_grass','grass_2','wasteland','forest_2',
        'mountain_2','poison','forest','bricks_1','bricks_2','wood_planks','wood','rubble_1','rubble_2','rubble_3',
        'rubble_4','poison_bog','rocks_1','rocks_2','rocks_3','rocks_4','rocks_5','rock_wall_1','rock_wall_2','dark_woods',
        'urban_wall','grass_rocky','purple_bog','urban_street','moon','carpet','gold','metal','leaves','wallpaper',
        'cloud_2','moon_2','moon_3','carpet_2','carpet_3','carpet_4','gold_2','gold_3','metal_2','grass_3',
        'grass_4','dirt_2','dirt_3','dirt_4','marble','marble_2','cobblestone','cobblestone_2','leaves_2','leaves_3',
        'leaves_4','leaves_5','aluminium','checkerboard','dungeon','dungeon_2','dungeon_3','dungeon_4','flesh','flesh_2',
        'flesh_3','drywall','drywall_2','drywall_3','drywall_4','metal_3',
        // 2026-07-08 — append-only mirror of map.js ME_TERRAIN_IDS
        'bricks_3','marble_light','leather','leather_2','enamel_2','mars','mars_2','fur','fur_2','fur_3',
        'skin','rubber','rubber_2','damask','damask_2','damask_3','damask_4','floral','floral_2','diamond',
        'brokenglass','gunmetal','gunmetal_2','copper','concrete_floor','checkerboard_2','checkerboard_3','drywall_5','dirt_slope','grass_dark_fantasy',
        'rocks_dark_fantasy','ice_1','igloo','latticegarden','noise','tigerfur','tigerfur_2','tilefloor','tilefloor_2'];
    const m = {}; L.forEach((k, i) => { if (k) m[k] = i; });
    return m;
})();

const MF_OID = (() => {
    const L = [null,
        'tree','ruins','church','shop','nexus','nexus_cave','nexus_sky','mountain_top','beanstalk','well',
        'cave_entrance','barrier_1','barrier_2','barrier_3','barrier_4','barrier_5','column_1','column_2','column_3','column_4',
        'building_1','building_2','building_3','building_4','building_5','building_6','building_7','building_8','building_9','building_10',
        'church_1','church_2','poison_seed','tree_2','tree_3','tree_4','tree_5','tree_6','tower_cube','building_11',
        'ancient_building','abandoned_building_1','abandoned_building_2','stairs','pathway_1','pathway_2','stairs_2','lamp_post','lamp_post_2','grass_tuft',
        'rock','torch','traffic_light',
        // 2026-07-08 — append-only mirror of map.js ME_OBJECT_IDS (spell props)
        'gravestone','bone_pile','bone_wall','atlantis_pillar','totem_pole','federation_beacon'];
    const m = {}; L.forEach((k, i) => { if (k) m[k] = i; });
    return m;
})();

function _mfRng(seed) {
    let a = (seed | 0) || 1;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* A build context. Surface baseline sits at z = baseH (3, matching the
   custommap convention: strata z0..z2 under a z3 surface). heights are TOP
   voxel z per tile; hole() makes a genuinely empty column (bottomless void). */
function _mfNew(cfg) {
    const W = cfg.w, H = cfg.h;
    const baseH = (cfg.baseH != null) ? cfg.baseH : 3;
    const M = {
        cfg, W, H, baseH,
        rng: _mfRng(cfg.seed || 1337),
        ter: [], hgt: [], objs: [], mons: [], holes: [],
        underTop: cfg.underTop || 'dirt',
        strata: cfg.strata || ['lava', 'lava', 'cave_floor'],
        tints: cfg.tints || null,
        hollow: !!cfg.hollow,
        lintels: [],            // {x,y,z,t} authored ceiling/overhang blocks (needs hollow)
        roofs: [],              // {x,y,z,t} THIN walkable roof slabs (editor Walls & Roofs tech)
        walls: {},              // "x,y,N|W" → edge-wall record (runtime state.edgeWalls shape)
        stairs: [],             // {x,y,sd} engine 1×1×1 staircases (sd = LOW-side direction)
        spawnsList: null,
        /* 2026-09-01 (DELTA FORGE): per-tile stratum overrides "x,y" → {z: tid}
           (a lake that floods a bed layer), and fillAbove = 'surface' makes
           every voxel from the baseline UP wear the tile's own surface terrain
           (a rock_wall_1 block is rock all the way down instead of dirt with
           a stone cap). Both are opt-in; the launch maps are unchanged. */
        underrides: {},
        fillAbove: cfg.fillAbove || null,
    };
    for (let y = 0; y < H; y++) {
        M.ter.push(new Array(W).fill(MF_TID[cfg.base] || MF_TID.grass_2));
        M.hgt.push(new Array(W).fill(baseH));
        const row = []; for (let x = 0; x < W; x++) row.push([]);
        M.objs.push(row);
    }
    M.in = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    M.t = (x, y, key) => { if (M.in(x, y)) M.ter[y][x] = MF_TID[key] || MF_TID.grass_2; };
    M.tk = (x, y) => { for (const k in MF_TID) if (MF_TID[k] === M.ter[y][x]) return k; return 'grass_2'; };
    M.h = (x, y, z) => { if (M.in(x, y)) M.hgt[y][x] = z; };
    M.hget = (x, y) => M.in(x, y) ? M.hgt[y][x] : baseH;
    M.rect = (x0, y0, x1, y1, key, z) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            if (!M.in(x, y)) continue;
            if (key) M.t(x, y, key);
            if (z != null) M.h(x, y, z);
        }
    };
    M.box = (x0, y0, x1, y1, key, z) => {           // outline only
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            if (!M.in(x, y)) continue;
            if (y !== y0 && y !== y1 && x !== x0 && x !== x1) continue;
            if (key) M.t(x, y, key);
            if (z != null) M.h(x, y, z);
        }
    };
    M.disc = (cx, cy, r, key, z) => {
        for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
            for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
                if (!M.in(x, y)) continue;
                const d = Math.hypot(x - cx, y - cy);
                if (d <= r + 0.001) { if (key) M.t(x, y, key); if (z != null) M.h(x, y, z); }
            }
    };
    M.ring = (cx, cy, r0, r1, key, z) => {
        for (let y = Math.floor(cy - r1); y <= Math.ceil(cy + r1); y++)
            for (let x = Math.floor(cx - r1); x <= Math.ceil(cx + r1); x++) {
                if (!M.in(x, y)) continue;
                const d = Math.hypot(x - cx, y - cy);
                if (d >= r0 - 0.001 && d <= r1 + 0.001) { if (key) M.t(x, y, key); if (z != null) M.h(x, y, z); }
            }
    };
    M.hole = (x, y, key) => {                        // bottomless void column
        if (!M.in(x, y)) return;
        M.t(x, y, key || 'cloud_gap'); M.h(x, y, 0);
        M.holes.push(x + ',' + y);
    };
    M.lintel = (x, y, z, key) => {                   // overhang block (roof/arch top)
        if (!M.in(x, y)) return;
        M.lintels.push({ x, y, z, t: MF_TID[key] || MF_TID.bricks_1 });
        M.hollow = true;
    };
    M.under = (x, y, z, key) => {                    // override ONE bed layer of a tile
        if (!M.in(x, y)) return;
        const k = x + ',' + y;
        (M.underrides[k] = M.underrides[k] || {})[z] = MF_TID[key] || MF_TID.dirt;
    };
    /* ── THIN edge walls + roof slabs (the map editor's Walls & Roofs tech) ──
       M.wall(x,y,side,opts): a thin modular wall standing ON the tile edge —
       NOT a full voxel cube. side 'N'|'S'|'E'|'W' of tile (x,y) (S/E normalize
       to the neighbour's N/W key). Record shape = runtime state.edgeWalls:
         z0 (first occupied CELL; default = standing on (x,y)'s surface),
         h (cells, default 2), tex / texIn (terrain keys), cap (null|'crenel'|
         'overhang'|'both'), see (chain-link), low (parapet), flip.
       M.roof(x,y,z,key): a THIN walkable slab hugging the TOP of cell z —
       flush with a wall whose top cell is z; real headroom beneath, its own
       top is a normal standable surface (multi-floor WYSIWYG). */
    M.wallKey = (x, y, side) => {
        if (side === 'S') { y += 1; side = 'N'; }
        if (side === 'E') { x += 1; side = 'W'; }
        return x + ',' + y + ',' + side;
    };
    M.wall = (x, y, side, o) => {
        o = o || {};
        M.walls[M.wallKey(x, y, side)] = {
            z0: (o.z0 != null) ? o.z0 : M.hget(x, y) + 1,
            h: (o.h != null) ? o.h : 2,
            tex: o.tex || 'bricks_2',
            texIn: o.texIn || null,
            cap: o.cap || null,
            see: !!o.see, low: !!o.low, flip: !!o.flip,
        };
    };
    M.roof = (x, y, z, key) => {
        if (!M.in(x, y)) return;
        M.roofs.push({ x, y, z, t: MF_TID[key] || MF_TID.wood_planks });
        M.hollow = true;                             // keep the room's air gap hollow
    };
    /* Engine staircase (the same 1×1×1 3D stairs the Mystery Dungeon exit
       uses): a barrier_passage tile whose top voxel carries an explicit
       stairDir. sd = the LOW-side direction (three-renderer _isStairTile:
       highDir = opposite of stairDir); the ramp rises ht → ht+1. */
    M.stair = (x, y, sd, z) => {
        if (!M.in(x, y)) return;
        M.t(x, y, 'barrier_passage');
        if (z != null) M.h(x, y, z);
        M.stairs.push({ x, y, sd });
    };
    M.obj = (x, y, key, o) => {
        if (!M.in(x, y)) return;
        const oid = MF_OID[key]; if (!oid) return;
        const e = { oid, alignX: 'center', alignY: 'bottom', rot: (o && o.rot) || 0, flipX: !!(o && o.flipX), flipY: !!(o && o.flipY) };
        if (o && o.leaf) e.leaf = o.leaf;
        M.objs[y][x].push(e);
    };
    M.clearObj = (x, y) => { if (M.in(x, y)) M.objs[y][x] = []; };
    M.tree = (x, y, kind) => M.obj(x, y, kind || 'tree');
    M.rock = (x, y, leaf) => M.obj(x, y, 'rock', leaf ? { leaf } : null);
    M.building = (x, y, key) => {                    // 2×2 footprint: flatten pad, clear props
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
            if (!M.in(x + dx, y + dy)) return;       // never let a building hang off-board
            M.hgt[y + dy][x + dx] = M.hgt[y][x];
            M.objs[y + dy][x + dx] = [];
        }
        M.obj(x, y, key);
    };
    M.mon = (kind, x, y, foot, maxH, o) => {
        M.mons.push(Object.assign({ kind, x, y, rot: 0, foot: foot || 3, maxH: maxH || 3, seed: Math.floor(M.rng() * 90000) + 1000 }, o || {}));
    };
    M.fence = (x0, y0, x1, y1, kind, rot) => {       // run of edge-blocking barrier slabs
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) M.obj(x, y, kind || 'barrier_1', { rot: rot || 0 });
    };
    M.scatter = (n, fn) => { for (let i = 0; i < n; i++) fn(Math.floor(M.rng() * W), Math.floor(M.rng() * H), i); };
    /* 180°-rotation symmetry: copy the authored top half (rows y < H/2) onto
       the bottom half, rotating coordinates and leaving the middle row(s) as
       authored. Objects are mirrored too (rot flipped); monuments/buildings
       must be placed via monSym/buildingSym AFTER this call. */
    M.sym180 = () => {
        const half = Math.floor(H / 2);
        const BLD = new Set(['church', 'shop', 'church_1', 'church_2', 'ancient_building', 'abandoned_building_1',
            'abandoned_building_2', 'building_11', 'building_1', 'building_2', 'building_3', 'building_4', 'building_5',
            'building_6', 'building_7', 'building_8', 'building_9', 'building_10'].map(k => MF_OID[k]));
        for (let y = 0; y < half; y++) for (let x = 0; x < W; x++) {
            const my = H - 1 - y, mx = W - 1 - x;
            M.ter[my][mx] = M.ter[y][x];
            M.hgt[my][mx] = M.hgt[y][x];
            // 2×2 building anchors don't rotate cleanly — place them via buildingSym AFTER sym180
            M.objs[my][mx] = M.objs[y][x].filter(e => !BLD.has(e.oid))
                .map(e => Object.assign({}, e, { rot: ((e.rot || 0) + 180) % 360 }));
            M.objs[y][x] = M.objs[y][x].filter(e => !BLD.has(e.oid));
        }
        // mirror authored holes/lintels from the top half as well
        const seen = new Set(M.holes);
        M.holes.slice().forEach(kk => {
            const [x, y] = kk.split(',').map(Number);
            if (y < half) { const key2 = (W - 1 - x) + ',' + (H - 1 - y); if (!seen.has(key2)) M.holes.push(key2); }
        });
        M.lintels.slice().forEach(L => {
            if (L.y < half) M.lintels.push({ x: W - 1 - L.x, y: H - 1 - L.y, z: L.z, t: L.t });
        });
        Object.keys(M.underrides).forEach(k => {
            const [x, y] = k.split(',').map(Number);
            if (y >= half) return;
            const k2 = (W - 1 - x) + ',' + (H - 1 - y);
            if (!M.underrides[k2]) M.underrides[k2] = Object.assign({}, M.underrides[k]);
        });
        M.roofs.slice().forEach(R => {
            if (R.y < half) M.roofs.push({ x: W - 1 - R.x, y: H - 1 - R.y, z: R.z, t: R.t });
        });
        /* thin edge walls: N edge of (x,y) rotates to the N edge of
           (W-1-x, H-y); W edge of (x,y) to the W edge of (W-x, H-1-y) */
        Object.keys(M.walls).forEach(k => {
            const p = k.split(','), x = +p[0], y = +p[1], side = p[2];
            if (y >= half) return;                   // author from the top half
            const mk = (side === 'N') ? ((W - 1 - x) + ',' + (H - y) + ',N')
                                      : ((W - x) + ',' + (H - 1 - y) + ',W');
            if (!M.walls[mk]) M.walls[mk] = Object.assign({}, M.walls[k]);
        });
        const _sdFlip = { N: 'S', S: 'N', E: 'W', W: 'E' };
        M.stairs.slice().forEach(s => {
            if (s.y < half) M.stairs.push({ x: W - 1 - s.x, y: H - 1 - s.y, sd: _sdFlip[s.sd] || s.sd });
        });
    };
    M.monSym = (kind, x, y, foot, maxH, o) => {      // monument + its 180° twin
        M.mon(kind, x, y, foot, maxH, o);
        M.mon(kind, W - 1 - x, H - 1 - y, foot, maxH, Object.assign({}, o || {}, { rot: (((o && o.rot) || 0) + 180) % 360 }));
    };
    M.buildingSym = (x, y, key) => {                 // building + its 180° twin (anchor shifts)
        M.building(x, y, key);
        M.building(W - 2 - x, H - 2 - y, key);
    };
    M.objSym = (x, y, key, o) => {
        M.obj(x, y, key, o);
        M.obj(W - 1 - x, H - 1 - y, key, Object.assign({}, o || {}, { rot: (((o && o.rot) || 0) + 180) % 360 }));
    };
    M.spawns = (a, b) => { M.spawnsList = { 1: a, 2: b }; };
    /* Edge spawn rows: n tiles centered on the given edge ('n'|'s'|'e'|'w'),
       team 1 on the first edge, team 2 mirrored. Pads are flattened+cleared. */
    M.spawnEdges = (edge1, n) => {
        const mk = (edge) => {
            const out = [], c = Math.floor((edge === 'n' || edge === 's' ? W : H) / 2) - Math.floor(n / 2);
            for (let i = 0; i < n; i++) {
                if (edge === 'n') out.push({ x: c + i, y: 0 });
                else if (edge === 's') out.push({ x: c + i, y: H - 1 });
                else if (edge === 'w') out.push({ x: 0, y: c + i });
                else out.push({ x: W - 1, y: c + i });
            }
            return out;
        };
        const opp = { n: 's', s: 'n', e: 'w', w: 'e' };
        M.spawns(mk(edge1), mk(opp[edge1]));
    };
    /* Make every spawn pad safe: flat baseline, passable themed terrain,
       no objects, no hazard, and a clear one-tile apron toward the board. */
    M.finishSpawns = (padKey) => {
        const HAZ = new Set([MF_TID.lava, MF_TID.deep_water, MF_TID.poison_bog, MF_TID.poison, MF_TID.cloud_gap, MF_TID.chasm].filter(Boolean));
        [1, 2].forEach(tm => {
            (M.spawnsList[tm] || []).forEach(p => {
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const x = p.x + dx, y = p.y + dy;
                    if (!M.in(x, y)) continue;
                    const idx = M.holes.indexOf(x + ',' + y); if (idx >= 0) M.holes.splice(idx, 1);
                    if (HAZ.has(M.ter[y][x]) || M.hgt[y][x] === 0) M.t(x, y, padKey);
                    if (Math.abs(M.hgt[y][x] - baseH) > 1) M.h(x, y, baseH);
                }
                M.h(p.x, p.y, baseH);
                if (HAZ.has(M.ter[p.y][p.x])) M.t(p.x, p.y, padKey);
                M.clearObj(p.x, p.y);
            });
        });
    };
    /* Assemble the PREBUILT_MAPS entry: voxel columns are strata + fill +
       surface; holes stay empty; lintels ride above with an air gap. */
    M.finish = () => {
        const holeSet = new Set(M.holes);
        const voxels = [];
        for (let y = 0; y < H; y++) {
            const row = [];
            for (let x = 0; x < W; x++) {
                const stack = [];
                if (!holeSet.has(x + ',' + y)) {
                    const top = Math.max(0, M.hgt[y][x]);
                    const ov = M.underrides[x + ',' + y] || null;
                    for (let z = 0; z <= top; z++) {
                        let t;
                        if (z === top) t = M.ter[y][x];
                        else if (ov && ov[z] != null) t = ov[z];
                        else if (M.fillAbove === 'surface' && z >= baseH) t = M.ter[y][x];
                        else if (z < M.strata.length && z < top) t = MF_TID[M.strata[z]] || MF_TID.cave_floor;
                        else t = MF_TID[M.underTop] || MF_TID.dirt;
                        stack.push({ z, tid: t });
                    }
                    if (M.hgt[y][x] < 0) stack.length = 0; // negative = explicit empty
                } else {
                    M.hgt[y][x] = 0;
                }
                row.push(stack);
            }
            voxels.push(row);
        }
        /* stamp staircase directions on the surface voxel BEFORE lintels ride
           above (map.js maps sd → stairDir on load) */
        M.stairs.forEach(s => {
            const st = M.in(s.x, s.y) ? voxels[s.y][s.x] : null;
            if (st && st.length) st[st.length - 1].sd = s.sd;
        });
        M.lintels.forEach(L => { if (M.in(L.x, L.y)) voxels[L.y][L.x].push({ z: L.z, tid: L.t }); });
        /* thin roof slabs ride in the voxel column with the editor's rf flag
           (map.js prebuilt loader maps rf → roof, same as community maps) */
        M.roofs.forEach(R => { if (M.in(R.x, R.y)) voxels[R.y][R.x].push({ z: R.z, tid: R.t, rf: 1 }); });
        const entry = {
            name: M.cfg.name, w: W, h: H,
            grid: M.ter.map(r => r.slice()),
            heightMap: M.hgt.map(r => r.slice()),
            objects: M.objs.map(r => r.map(c => c.slice())),
            voxels,
            spawns: M.spawnsList,
        };
        if (M.mons.length) entry.monuments = M.mons;
        if (Object.keys(M.walls).length) entry.edgeWalls = M.walls;
        if (M.hollow) entry.hollowVoxels = true;
        if (M.tints) entry.terrainTints = M.tints;
        return entry;
    };
    return M;
}

/* ── Δ (delta) competitive variant ──────────────────────────────────────────
   Crop a 10×10 window out of the finished full map, enforce 180°-rotation
   symmetry (terrain+heights always; objects mirrored from the top half,
   buildings dropped if their 2×2 pad no longer fits), re-seat spawns as
   two mirrored 4-tile rows, and keep monuments that fit the window. */
function _mfDelta(full, meta, S) {
    S = S || 10;
    const x0 = (meta.deltaX != null) ? meta.deltaX : Math.floor((full.w - S) / 2);
    const y0 = (meta.deltaY != null) ? meta.deltaY : Math.floor((full.h - S) / 2);
    const BUILD_OIDS = new Set(['church', 'shop', 'church_1', 'church_2', 'ancient_building', 'abandoned_building_1', 'abandoned_building_2', 'building_11',
        'building_1', 'building_2', 'building_3', 'building_4', 'building_5', 'building_6', 'building_7', 'building_8', 'building_9', 'building_10']
        .map(k => MF_OID[k]));
    const grid = [], heightMap = [], objects = [], voxels = [];
    for (let y = 0; y < S; y++) {
        grid.push(full.grid[y0 + y].slice(x0, x0 + S));
        heightMap.push(full.heightMap[y0 + y].slice(x0, x0 + S));
        objects.push(full.objects[y0 + y].slice(x0, x0 + S).map(c => c.map(e => Object.assign({}, e))));
        voxels.push(full.voxels[y0 + y].slice(x0, x0 + S).map(c => c.map(v => Object.assign({}, v))));
    }
    // deltas are the strict-fairness variants: buildings are stripped outright
    // (2×2 anchors can't cleanly rotate-mirror, and Δ boards are too tight for them)
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        objects[y][x] = objects[y][x].filter(e => !BUILD_OIDS.has(e.oid));
    }
    // enforce 180° rotational symmetry from the top half
    for (let y = 0; y < S / 2; y++) for (let x = 0; x < S; x++) {
        const my = S - 1 - y, mx = S - 1 - x;
        grid[my][mx] = grid[y][x];
        heightMap[my][mx] = heightMap[y][x];
        voxels[my][mx] = voxels[y][x].map(v => Object.assign({}, v));
        objects[my][mx] = objects[y][x].map(e => Object.assign({}, e, { rot: ((e.rot || 0) + 180) % 360 }));
    }
    // monuments: keep top-half ones that fit, mirror them
    const monuments = [];
    (full.monuments || []).forEach(m => {
        const lx = m.x - x0, ly = m.y - y0;
        const rr = Math.floor((m.foot || 3) / 2);
        if (lx - rr < 0 || ly - rr < 0 || lx + rr >= S || ly + rr >= S) return;
        if (ly > (S / 2 - 1)) return;                 // author from the top half only
        if (ly - rr <= 1) return;                     // keep the spawn rows clear
        monuments.push(Object.assign({}, m, { x: lx, y: ly }));
        const q = Object.assign({}, m, { x: S - 1 - lx, y: S - 1 - ly, rot: ((m.rot || 0) + 180) % 360 });
        // near-center piece → keep as a single centerpiece instead of doubling it
        if (Math.abs(q.x - lx) > 1 || Math.abs(q.y - ly) > 1) monuments.push(q);
    });
    // spawns: two mirrored 4-tile rows on the N/S edges, pads scrubbed safe.
    // Row is centred on the board so it works at any Δ size (8/10/12).
    const sp1 = [], sp2 = [];
    const _sx0 = Math.floor((S - 4) / 2);
    for (let i = 0; i < 4; i++) { sp1.push({ x: _sx0 + i, y: S - 1 }); sp2.push({ x: _sx0 + i, y: 0 }); }
    const HAZ = new Set([MF_TID.lava, MF_TID.deep_water, MF_TID.poison_bog, MF_TID.poison, MF_TID.cloud_gap, MF_TID.chasm]);
    const base = 3, padKey = meta.deltaPad || 'dirt';
    [sp1, sp2].forEach(list => list.forEach(p => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = p.x + dx, y = p.y + dy;
            if (x < 0 || y < 0 || x >= S || y >= S) continue;
            if (HAZ.has(grid[y][x]) || heightMap[y][x] === 0 || !voxels[y][x].length) {
                grid[y][x] = MF_TID[padKey] || MF_TID.dirt;
                heightMap[y][x] = base;
                voxels[y][x] = [{ z: 0, tid: MF_TID.lava }, { z: 1, tid: MF_TID.lava }, { z: 2, tid: MF_TID.cave_floor }, { z: 3, tid: grid[y][x] }];
            }
            if (Math.abs(heightMap[y][x] - base) > 1) {
                heightMap[y][x] = base;
                voxels[y][x] = voxels[y][x].filter(v => v.z <= base);
                while (voxels[y][x].length && voxels[y][x][voxels[y][x].length - 1].z > base) voxels[y][x].pop();
                if (!voxels[y][x].some(v => v.z === base)) voxels[y][x].push({ z: base, tid: grid[y][x] });
            }
        }
        objects[p.y][p.x] = [];
    }));
    const entry = {
        name: full.name + ' Δ', w: S, h: S,
        grid, heightMap, objects, voxels, monuments,
        spawns: { 1: sp1, 2: sp2 },
    };
    if (full.hollowVoxels) entry.hollowVoxels = true;
    if (full.terrainTints) entry.terrainTints = Object.assign({}, full.terrainTints);
    /* thin edge walls: crop into the window, then re-enforce 180° symmetry
       from the top half (same rotation rule as the builder's sym180) */
    if (full.edgeWalls) {
        const ew = {};
        Object.keys(full.edgeWalls).forEach(k => {
            const p = k.split(','), x = +p[0] - x0, y = +p[1] - y0, side = p[2];
            if (side === 'N') { if (x < 0 || x > S - 1 || y < 0 || y > S) return; }
            else { if (x < 0 || x > S || y < 0 || y > S - 1) return; }
            ew[x + ',' + y + ',' + side] = Object.assign({}, full.edgeWalls[k]);
        });
        const out = {};
        Object.keys(ew).forEach(k => {
            const p = k.split(','), x = +p[0], y = +p[1], side = p[2];
            if (side === 'N' ? (y > S / 2) : (y >= S / 2)) return;   // top half authors
            out[k] = ew[k];
            const mk = (side === 'N') ? ((S - 1 - x) + ',' + (S - y) + ',N')
                                      : ((S - x) + ',' + (S - 1 - y) + ',W');
            if (!out[mk]) out[mk] = Object.assign({}, ew[k]);
        });
        if (Object.keys(out).length) entry.edgeWalls = out;
    }
    return entry;
}

/* ═══════════════════════ THE MAPS — Tier 1 (launch core) ═══════════════════ */

const _MF_BUILDERS = {};

/* HEAVEN — 20×20 6v6. Cloud islands over the void: a gilded gate plaza at
   center, marble causeways, light-pillar daises, healing pools, and
   bottomless cloud-gap rifts shaping the islands. */
_MF_BUILDERS.prebuilt_heaven = function () {
    const M = _mfNew({
        name: 'Heaven', w: 20, h: 20, base: 'cloud_2', baseH: 3, seed: 7001,
        strata: ['cloud_thick', 'cloud_thick', 'cloud'], underTop: 'cloud_thick',
        tints: { gold: '#ffe9a0', marble_light: '#fdfdf6' },
    });
    // void rifts sculpt the island silhouette (authored top half, mirrored)
    [[0, 0, 3, 1], [0, 2, 1, 3], [16, 0, 19, 0], [18, 1, 19, 2], [8, 4, 9, 4], [0, 8, 0, 9], [14, 6, 15, 7]]
        .forEach(r => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) M.hole(x, y); });
    // marble causeway ring + golden gate plaza at center
    M.ring(9.5, 9.5, 3.2, 4.4, 'marble_light');
    M.disc(9.5, 9.5, 2.2, 'gold');
    M.rect(9, 7, 10, 12, 'marble_light');                     // N–S processional
    M.rect(7, 9, 12, 10, 'marble_light');                     // W–E processional
    // elevated daises (rangeBonus celestial ruins) — mirrored flanks
    M.rect(3, 6, 4, 7, 'sky_ruin', 4); M.rect(15, 12, 16, 13, 'sky_ruin', 4);
    M.rect(2, 12, 3, 13, 'marble_light', 4); M.rect(16, 6, 17, 7, 'marble_light', 4);
    // healing pools by each approach
    M.rect(6, 3, 7, 4, 'healing_spring'); M.rect(12, 15, 13, 16, 'healing_spring');
    // thick-cloud slow banks as soft cover lanes
    M.rect(5, 8, 6, 11, 'cloud_thick'); M.rect(13, 8, 14, 11, 'cloud_thick');
    M.sym180();
    // monuments: the Pearly Gates + light pillars + guardian columns
    M.mon('goldgate', 9, 9, 4, 3, { rot: 0, solid: false });
    M.monSym('lightpillar', 4, 4, 1, 4, { solid: false });
    M.monSym('greek', 15, 3, 3, 2, { solid: false });
    M.monSym('stairway', 2, 9, 2, 2, {});
    M.spawnEdges('s', 6);
    M.finishSpawns('cloud_2');
    return M;
};

/* HELL — 20×20 6v6. The mirror of Heaven: obsidian altar over a lava river,
   basalt spike cover, chained colossus, occult rings. */
_MF_BUILDERS.prebuilt_hell = function () {
    const M = _mfNew({
        name: 'Hell', w: 20, h: 20, base: 'scorched', baseH: 3, seed: 6661,
        strata: ['lava', 'lava', 'obsidian'], underTop: 'obsidian',
        tints: { scorched: '#e08060', rocks_3: '#b06a50', rock_wall_1: '#a05844', cave_floor: '#9a5a48' },
    });
    // lava river snakes W–E through the middle (1-step down: hazardous but escapable)
    for (let x = 0; x < 20; x++) {
        const yc = 9 + Math.round(Math.sin(x * 0.55) * 1.4);
        M.rect(x, yc, x, yc + 1, 'lava', 2);
    }
    // two obsidian causeways bridge the river; one risky lava ford mid-map
    M.rect(4, 8, 5, 11, 'obsidian', 3); M.rect(14, 8, 15, 11, 'obsidian', 3);
    // central altar: stepped obsidian ziggurat plateau (climbable +1 rings)
    M.disc(9.5, 9.5, 2.6, 'obsidian', 4);
    M.rect(9, 9, 10, 10, 'obsidian', 5);
    // basalt spike walls (mirrored cover, block ground + LoS)
    [[3, 4], [7, 2], [12, 5], [16, 3], [2, 14]].forEach(p => M.rect(p[0], p[1], p[0] + 1, p[1], 'rock_wall_1', 5));
    // bone-dry rock fields + cinder pits
    M.rect(6, 5, 8, 6, 'rocks_3'); M.rect(11, 13, 13, 14, 'rocks_3');
    M.rect(1, 1, 2, 2, 'lava', 2); M.rect(17, 17, 18, 18, 'lava', 2);
    M.sym180();
    M.monSym('monolith', 5, 3, 1, 3, {});
    M.monSym('crystal', 14, 5, 2, 2, { solid: false });
    M.mon('rings', 9, 9, 3, 3, { solid: false });
    M.monSym('brazier', 8, 8, 1, 2, { solid: false });
    M.mon('colossus', 3, 16, 2, 3, { rot: 45 });
    M.mon('colossus', 16, 3, 2, 3, { rot: 225 });
    M.scatter(8, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'scorched') M.rock(x, y, 'rocks_3'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('scorched');
    return M;
};

/* NUKETOWN — 14×14 6v6. Tight symmetric suburbia around an atomic test
   street: two facing ranch houses, picket fences, hedge cover, test flags. */
_MF_BUILDERS.prebuilt_nuketown = function () {
    const M = _mfNew({
        name: 'Nuketown', w: 14, h: 14, base: 'grass_2', baseH: 3, seed: 5501,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'dirt',
        tints: { grass_2: '#9adf7a', road: '#b8b4ac', wasteland: '#d8c890' },
    });
    // perimeter: test-site wasteland ring
    M.box(0, 0, 13, 13, 'wasteland');
    // the street: N–S road with sidewalks (kill zone)
    M.rect(6, 0, 7, 13, 'road');
    M.rect(5, 0, 5, 13, 'urban_street'); M.rect(8, 0, 8, 13, 'urban_street');
    // house yards (the homes themselves are placed after the mirror)
    M.rect(1, 3, 4, 6, 'dirt_2');                        // west yard pad
    // picket fences + hedges (authored top half, mirrored below)
    M.fence(1, 2, 4, 2, 'barrier_2', 0);
    M.rect(3, 8, 4, 8, 'leaves', 5);                     // hedge wall cover
    M.rect(9, 2, 10, 2, 'leaves', 5);
    M.obj(4, 7, 'tree_5'); M.obj(10, 5, 'traffic_light');
    M.obj(5, 1, 'lamp_post'); M.obj(9, 9, 'well');
    M.sym180();
    // the two facing ranch houses (east yard pad is the mirror of the west one)
    M.building(2, 4, 'building_2');
    M.building(10, 8, 'building_3');
    // atomic-age props: the dumpster nobody empties + the block-party flags
    M.mon('dumpster', 6, 6, 2, 1, { rot: 0 });              // solid 2×1×1: climb the lid
    M.mon('flag', 1, 12, 1, 2, { solid: false });
    M.mon('flag', 12, 1, 1, 2, { solid: false });
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* STONEHENGE — 16×16 6v6. The sarsen ring on a ley-line cross: climbing
   pillar cover, cardinal entrances, an armillary above the altar. */
_MF_BUILDERS.prebuilt_stonehenge = function () {
    const M = _mfNew({
        name: 'Stonehenge', w: 16, h: 16, base: 'grass_2', baseH: 3, seed: 4401,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'dirt',
        tints: { purple_grass: '#9a6cff', grass_2: '#8fbf78', rock_wall_1: '#b8b4a8' },
    });
    // ley lines: glowing lanes crossing at the altar
    M.rect(7, 0, 8, 15, 'purple_grass'); M.rect(0, 7, 15, 8, 'purple_grass');
    // the sarsen ring: 1-tile standing stones (h6 = hard cover) w/ 4 cardinal gaps
    const C = 7.5, R = 4.6;
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + 0.196;
        const x = Math.round(C + Math.cos(a) * R), y = Math.round(C + Math.sin(a) * R);
        if ((x >= 7 && x <= 8) || (y >= 7 && y <= 8)) continue;       // cardinal entrances
        M.t(x, y, 'rock_wall_1'); M.h(x, y, 6);
    }
    // barrow mounds (climbable vantage) + druid springs — mirrored
    M.disc(2.5, 2.5, 1.4, 'grass_2', 4);
    M.rect(12, 2, 13, 3, 'healing_spring');
    // fallen trilithon rubble (low platforms) + scattered stones
    M.rect(11, 11, 12, 11, 'ruins');
    M.rock(4, 6, 'rocks_1'); M.rock(11, 4, 'rocks_2');
    M.sym180();
    M.mon('rings', 7, 7, 2, 3, { solid: false });
    M.monSym('monolith', 2, 7, 1, 3, { solid: false });
    M.mon('colossus', 12, 12, 2, 1, { rot: 300 });
    M.mon('colossus', 3, 3, 2, 1, { rot: 120 });
    M.monSym('trilithon', 2, 6, 2, 3, { rot: 90, solid: false });
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* PYRAMIDS OF GIZA — 20×20 6v6. Three pyramids on the great diagonal, twin
   obelisks, a processional avenue, dune ridges and excavation trenches. */
_MF_BUILDERS.prebuilt_giza = function () {
    const M = _mfNew({
        name: 'Pyramids of Giza', w: 20, h: 20, base: 'desert', baseH: 3, seed: 3301,
        strata: ['lava', 'cave_floor', 'dirt_4'], underTop: 'dirt_4',
        tints: { desert: '#e8cf8f', dirt_2: '#d8b884', ruins: '#d0b890' },
    });
    // hard-packed processional avenues (desert is slow; these are the fast lanes)
    M.rect(9, 0, 10, 19, 'dirt_2'); M.rect(0, 9, 19, 10, 'dirt_2');
    // dune ridges (slow high ground) — mirrored arcs
    M.disc(4, 3, 1.6, 'desert', 4); M.disc(16, 6, 1.4, 'desert', 4);
    // excavation trenches (defBonus ruins, sunken)
    M.rect(13, 2, 15, 3, 'ruins', 2); M.rect(4, 16, 6, 17, 'ruins', 2);
    // twin oases
    M.rect(2, 8, 3, 9, 'water'); M.t(3, 8, 'healing_spring');
    M.rect(16, 10, 17, 11, 'water'); M.t(16, 11, 'healing_spring');
    M.obj(2, 7, 'tree_2'); M.obj(17, 12, 'tree_2');
    M.sym180();
    // the three pyramids on the great diagonal — center one is climbable to its crown
    M.mon('pyramid', 9, 9, 7, 3, {});
    M.mon('pyramid', 4, 4, 5, 2, {});
    M.mon('pyramid', 15, 15, 5, 2, {});
    M.monSym('obelisk', 9, 5, 1, 4, {});
    M.monSym('obelisk3d', 2, 6, 1, 3, {});   // real-GLB guardian obelisks (1×1×3 solid)
    M.spawnEdges('s', 6);
    M.finishSpawns('dirt_2');
    return M;
};

/* MOUNT SHASTA — 20×20 6v6. Terraced sacred volcano: snow crown with
   range-bonus rim, switchback ascents, pine forest ring, twin cold lakes,
   and the Lemurian crystal gates of Telos. */
_MF_BUILDERS.prebuilt_shasta = function () {
    const M = _mfNew({
        name: 'Mount Shasta', w: 20, h: 20, base: 'grass_2', baseH: 3, seed: 2201,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'rocks_1',
        tints: { mountain_top: '#e6f2ff', mountain_2: '#c8d4e0', grass_2: '#9fce85' },
    });
    // the mountain: concentric terraces up to a snowy crown (all +1 steps)
    M.disc(9.5, 9.5, 5.2, 'grass_2', 3);
    M.disc(9.5, 9.5, 4.0, 'rocks_1', 4);
    M.disc(9.5, 9.5, 2.9, 'mountain_2', 5);
    M.disc(9.5, 9.5, 1.6, 'mountain_top', 6);           // snow crown: rangeBonus perch
    // two mirrored switchback approaches cut clean +1 stairs through the terraces
    M.rect(9, 4, 10, 4, 'rocks_1', 4); M.rect(9, 5, 10, 5, 'mountain_2', 5);
    // pine forest ring with winding trails
    [[2, 2], [4, 1], [1, 5], [16, 2], [14, 1], [3, 12], [1, 15], [6, 16]].forEach(p => M.tree(p[0], p[1], 'tree_2'));
    [[5, 3], [2, 8], [17, 5], [15, 16]].forEach(p => M.tree(p[0], p[1], 'tree_3'));
    M.rect(0, 10, 2, 11, 'forest_2');
    // twin cold lakes (mirrored): shallow rim, deep heart
    M.disc(15.5, 3.5, 1.7, 'water');
    M.t(15, 3, 'deep_water'); M.t(16, 3, 'deep_water');
    M.t(14, 5, 'healing_spring');
    // Telos: the Lemurian gate into the mountain
    M.obj(6, 8, 'cave_entrance');
    M.sym180();
    M.monSym('crystal', 6, 7, 2, 2, { solid: false });
    M.monSym('lenticular', 4, 2, 3, 6, { solid: false });   // the clouds that aren't clouds
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* CYBERPUNK CITY — 24×24 8v8. Rain-slick neon grid: fast avenues, walkable
   rooftops, holo-plazas, alley chokes. */
_MF_BUILDERS.prebuilt_cyberpunk = function () {
    const M = _mfNew({
        name: 'Cyberpunk City', w: 24, h: 24, base: 'urban_wall', baseH: 3, seed: 8801,
        strata: ['lava', 'cave_floor', 'metal'], underTop: 'metal',
        tints: {
            urban_street: '#8fa8c8', urban_wall: '#6a7290', metal: '#7f9ac0',
            checkerboard: '#b06ad8', purple_grass: '#41f2d8', road: '#9aa4b8',
        },
    });
    // avenue grid (moveCost 0 = the flow lanes)
    M.rect(7, 0, 8, 23, 'urban_street'); M.rect(15, 0, 16, 23, 'urban_street');
    M.rect(0, 7, 23, 8, 'urban_street'); M.rect(0, 15, 23, 16, 'urban_street');
    // central holo-plaza (neon dance floor) + glyph lines
    M.rect(9, 9, 14, 14, 'checkerboard');
    M.rect(11, 0, 12, 23, 'purple_grass'); M.rect(0, 11, 23, 12, 'purple_grass');
    // raised service platforms (climbable cover)
    M.rect(5, 5, 6, 5, 'metal', 5); M.rect(17, 18, 18, 18, 'metal', 5);
    M.rect(10, 4, 13, 4, 'metal', 4); M.rect(10, 19, 13, 19, 'metal', 4);
    // steam-vent alleys: scorched vents + edge-blocking junk barriers
    M.t(4, 8, 'scorched'); M.t(19, 15, 'scorched');
    M.fence(9, 2, 9, 3, 'barrier_4', 90); M.fence(14, 20, 14, 21, 'barrier_4', 90);
    // parked hover-cars along the curbs
    M.objSym(6, 9, 'barrier_5', { rot: 90 });
    M.objSym(9, 6, 'barrier_5', {});
    M.objSym(17, 12, 'barrier_5', { rot: 90 });
    M.objSym(3, 17, 'traffic_light', {});
    M.objSym(6, 0, 'lamp_post_2', {});
    M.sym180();
    // city blocks: towers (2×2, roof-walkable)
    M.buildingSym(2, 2, 'building_5');
    M.buildingSym(18, 3, 'building_7');
    M.buildingSym(3, 10, 'building_11');
    M.buildingSym(19, 10, 'abandoned_building_1');
    // holographic billboards + searchlights
    M.monSym('fluorescent', 10, 7, 1, 2, { solid: false });
    M.monSym('fluorescent', 16, 11, 1, 2, { rot: 90, solid: false });
    M.monSym('lightpillar', 1, 20, 1, 4, { solid: false });
    M.monSym('holoboard', 13, 8, 2, 4, { solid: false });   // the ads never sleep
    M.mon('rings', 11, 11, 2, 2, { solid: false });
    M.spawnEdges('s', 8);
    M.finishSpawns('urban_street');
    return M;
};

/* CAMELOT — 16×16 6v6. "Castle walls": the moat-cut western lowland climbs
   two stair terraces into the walled eastern ward — thin brick curtain
   walls, parapet walks and the twin keep braziers. Hand-authored in the map
   editor (2026-07-22) and baked here verbatim, replacing the old 24×24
   procedural siege. */
_MF_BUILDERS.prebuilt_camelot = function () {
    /* Editor tids (MF_TID / map.js ME_TERRAIN_IDS): 3 deep_water (the moat),
       35 barrier_passage (E-facing engine stairs), 48 wasteland, 54 bricks_2.
       Voxel columns reconstruct the editor's export exactly: z0-3 strata
       (lava / cave_floor / road / dirt), wasteland fill at z4, bricks_2 fill
       at z5, the surface tid capping at the walk height. */
    const W = 16, H = 16;
    const _rA = [48, 48, 3, 3, 48, 48, 54, 54, 54, 54, 54, 54, 54, 54, 54, 54];
    const _rB = [48, 48, 3, 3, 48, 48, 54, 54, 54, 35, 54, 54, 54, 54, 54, 54];
    const _rC = [48, 3, 3, 48, 48, 35, 54, 54, 54, 54, 54, 54, 54, 54, 54, 54];
    const _rD = [3, 3, 3, 48, 48, 48, 54, 54, 54, 54, 54, 54, 54, 54, 54, 54];
    const grid = [_rA, _rB, _rB, _rA, _rC, _rC, _rD, _rD, _rD, _rD, _rC, _rC, _rA, _rB, _rB, _rA]
        .map(r => r.slice());
    const _hA = [4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6];
    const _hB = [4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
    const heightMap = [_hA, _hA, _hA, _hA, _hA, _hA, _hB, _hB, _hB, _hB, _hA, _hA, _hA, _hA, _hA, _hA]
        .map(r => r.slice());
    const voxels = [];
    for (let y = 0; y < H; y++) {
        const row = [];
        for (let x = 0; x < W; x++) {
            const top = heightMap[y][x];
            const col = [{ z: 0, tid: 10 }, { z: 1, tid: 19 }, { z: 2, tid: 13 }, { z: 3, tid: 8 }];
            for (let z = 4; z < top; z++) col.push({ z, tid: z === 4 ? 48 : 54 });
            const cap = { z: top, tid: grid[y][x] };
            if (cap.tid === 35) cap.sd = 'E';        // engine stair, low side E
            col.push(cap);
            row.push(col);
        }
        voxels.push(row);
    }
    const objects = [];
    for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) r.push([]); objects.push(r); }
    const _ob = (x, y, oid, rot, leaf) => {
        const e = { oid, alignX: 'center', alignY: 'bottom', rot: rot || 0, flipX: false, flipY: false };
        if (leaf) e.leaf = leaf;
        objects[y][x].push(e);
    };
    // oid 1 = tree (leaves flavor); 47 / 52 = the editor's wall-prop pieces
    [[5, 0], [1, 2], [1, 3], [3, 6], [4, 7], [5, 7], [3, 8], [5, 8], [3, 9], [4, 9], [1, 12], [1, 13], [5, 15]]
        .forEach(p => _ob(p[0], p[1], 1, 0, 'leaves'));
    [[9, 1], [9, 2], [5, 4], [5, 5], [5, 10], [5, 11], [9, 13], [9, 14]].forEach(p => _ob(p[0], p[1], 47, 90));
    _ob(9, 4, 52, 90, 'wall'); _ob(9, 11, 52, 90, 'wall');
    const edgeWalls = {};
    const _ew = (k, z0, h) => { edgeWalls[k] = { z0, h, tex: 'bricks_2', cap: 'both' }; };
    ['6,0,W', '6,1,W', '6,2,W', '6,3,W', '6,12,W', '6,13,W', '6,14,W', '6,15,W']
        .forEach(k => _ew(k, 5, 1));                 // low terrace wall, N + S wings
    ['6,6,W', '6,7,W', '6,8,W', '6,9,W'].forEach(k => _ew(k, 5, 3));   // tall mid rampart
    ['10,0,N', '11,0,N', '12,0,N', '13,0,N', '14,0,N',
     '10,16,N', '11,16,N', '12,16,N', '13,16,N', '14,16,N', '15,16,N', '10,3,W']
        .forEach(k => _ew(k, 7, 1));                 // keep parapets on the board edge
    ['15,0,N', '10,3,N', '11,3,N', '12,3,N', '13,3,N', '15,3,N',
     '10,6,N', '12,6,N', '13,6,N', '14,6,N', '15,6,N',
     '10,10,N', '12,10,N', '13,10,N', '14,10,N', '15,10,N',
     '10,13,N', '11,13,N', '12,13,N', '13,13,N', '15,13,N']
        .forEach(k => _ew(k, 7, 2));                 // keep hall walls (door gaps at x11 / x14)
    for (let i = 0; i < 16; i++) _ew('16,' + i + ',W', 7, 2);          // east boundary curtain
    ['10,0,W', '10,4,W', '10,5,W', '10,10,W', '10,11,W', '10,12,W', '10,15,W',
     '6,6,N', '7,6,N', '8,6,N', '9,6,N', '6,10,N', '7,10,N', '8,10,N', '9,10,N']
        .forEach(k => _ew(k, 6, 2));                 // mid-terrace walls
    /* the export shipped no spawns: seat both teams inside the keep, one ward
       each (map is mirror-symmetric N–S, so this is TDM-fair) */
    const spawns = { 1: [], 2: [] };
    for (let i = 10; i <= 15; i++) { spawns[1].push({ x: i, y: H - 1 }); spawns[2].push({ x: i, y: 0 }); }
    const entry = {
        name: 'Camelot', w: W, h: H,
        grid, heightMap, objects, voxels, spawns,
        edgeWalls,
        monuments: [
            { kind: 'brazier', x: 5, y: 3, rot: 0, foot: 1, maxH: 2, seed: 21357 },
            { kind: 'brazier', x: 5, y: 12, rot: 0, foot: 1, maxH: 2, seed: 93830 },
        ],
    };
    return { finish: () => entry };
};

/* FOOTBALL STADIUM — 16×28 8v8. Full gridiron under the void lights:
   chalk yard lines, team-color end zones, climbable bleacher tiers,
   goalpost gateways, midfield sigil. */
_MF_BUILDERS.prebuilt_stadium = function () {
    const M = _mfNew({
        name: 'Football Stadium', w: 16, h: 28, base: 'grass_2', baseH: 3, seed: 7707,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'urban_wall',
        tints: {
            grass_2: '#5ec46a', marble_light: '#f4f4f4', carpet_2: '#5a80ff', carpet: '#ff6a55',
            gold: '#ffd34a', urban_wall: '#9aa0ac',
        },
    });
    // end zones (team colors) + goal lines
    M.rect(2, 2, 13, 3, 'carpet_2'); M.rect(2, 24, 13, 25, 'carpet');
    // chalk yard lines every 4 rows across the field
    for (let y = 4; y <= 24; y += 4) M.rect(2, y, 13, y, 'marble_light');
    // midfield sigil + hash marks
    M.rect(7, 13, 8, 14, 'gold');
    for (let y = 5; y <= 23; y += 2) { M.t(5, y, 'marble_light'); M.t(10, y, 'marble_light'); }
    // bleacher tiers flanking the field (climbable +1 steps up to the rim)
    M.rect(0, 2, 0, 25, 'urban_wall', 5);
    M.rect(1, 2, 1, 25, 'urban_wall', 4);
    M.rect(15, 2, 15, 25, 'urban_wall', 5);
    M.rect(14, 2, 14, 25, 'urban_wall', 4);
    // north/south aprons + team tunnels (sunken walk-outs)
    M.rect(2, 0, 13, 1, 'urban_street');
    M.rect(7, 1, 8, 1, 'dungeon', 2);
    M.sym180();
    // goalposts + scoreboard + floodlight pillars
    M.mon('gateway', 7, 2, 3, 3, { solid: false });
    M.mon('gateway', 7, 25, 3, 3, { rot: 180, solid: false });
    M.mon('jumbotron', 7, 0, 3, 4, { solid: false });
    M.monSym('lightpillar', 0, 6, 1, 4, { solid: false });
    M.monSym('lightpillar', 15, 13, 1, 4, { solid: false });
    M.spawnEdges('s', 8);
    M.finishSpawns('grass_2');
    return M;
};

/* ═══════════════════════ Tier 2 — roster & lore expansion ══════════════════ */

/* ATLANTIS — 24×24 8v8. Half-sunken marble city: deep-water moat, shallow
   flooded streets, plaza islands, the crystal spire, broken colonnades. */
_MF_BUILDERS.prebuilt_atlantis = function () {
    const M = _mfNew({
        name: 'Atlantis', w: 24, h: 24, base: 'water', baseH: 3, seed: 1101,
        strata: ['lava', 'cave_floor', 'rocks_1'], underTop: 'marble_light',
        tints: { marble_light: '#bfe8ef', water: '#49c2d8', gold: '#ffe9a0' },
    });
    // deep-water moat ring around the city heart (drowning: a soft barrier)
    M.ring(11.5, 11.5, 5.0, 6.4, 'deep_water', 2);
    // four cardinal causeways over the moat
    M.rect(11, 5, 12, 7, 'bridge', 3); M.rect(11, 16, 12, 18, 'bridge', 3);
    M.rect(5, 11, 7, 12, 'bridge', 3); M.rect(16, 11, 18, 12, 'bridge', 3);
    // the city heart: marble plaza + gilded core + crystal spire dais
    M.disc(11.5, 11.5, 4.6, 'marble_light');
    M.disc(11.5, 11.5, 2.4, 'gold');
    M.rect(11, 11, 12, 12, 'crystal', 4);               // spire base: climbable, MP-rich
    // outer wards: plaza islands rising from the shallows (hop routes)
    [[3, 3, 5, 5], [18, 3, 20, 5], [2, 8, 4, 9], [19, 14, 21, 15]].forEach(r => M.rect(r[0], r[1], r[2], r[3], 'marble_light'));
    [[8, 2, 9, 3], [14, 20, 15, 21]].forEach(r => M.rect(r[0], r[1], r[2], r[3], 'marble_light', 4));
    // sunken quarters: ruins under the water (defBonus wading fights)
    M.rect(2, 14, 5, 16, 'ruins', 2); M.rect(18, 7, 21, 9, 'ruins', 2);
    // gardens of the deep: healing pools
    M.t(6, 4, 'healing_spring'); M.t(17, 19, 'healing_spring');
    // dry sand landings by the spawns
    M.rect(8, 22, 15, 23, 'dirt_3'); M.rect(8, 0, 15, 1, 'dirt_3');
    M.rect(11, 1, 12, 4, 'marble_light');
    M.sym180();
    M.mon('crystal', 11, 11, 3, 4, { solid: false });
    M.mon('rings', 11, 11, 2, 2, { solid: false });
    M.monSym('greek', 4, 4, 3, 2, {});
    M.monSym('greek', 20, 8, 3, 2, { rot: 90 });
    M.objSym(3, 8, 'column_2', {}); M.objSym(9, 4, 'column_1', {});
    M.monSym('colossus', 3, 15, 2, 2, { rot: 315 });
    M.spawnEdges('s', 8);
    M.finishSpawns('dirt_3');
    return M;
};

/* TOWER OF BABEL — 16×24 6v6. The unfinished tower: a grand climbable
   ziggurat amid brick streets, scaffolding platforms and rubble of the
   scattered tongues. */
_MF_BUILDERS.prebuilt_babel = function () {
    const M = _mfNew({
        name: 'Tower of Babel', w: 16, h: 24, base: 'bricks_1', baseH: 3, seed: 1102,
        strata: ['lava', 'cave_floor', 'dirt_4'], underTop: 'bricks_2',
        tints: { bricks_1: '#d8a878', bricks_2: '#c09468', rubble_2: '#c8a888' },
    });
    // fast roads flanking the tower
    M.rect(2, 0, 3, 23, 'road'); M.rect(12, 0, 13, 23, 'road');
    // rubble fields + ruins (defBonus digs)
    M.rect(5, 3, 7, 4, 'rubble_2'); M.rect(1, 6, 2, 7, 'ruins');
    M.rect(9, 19, 11, 20, 'rubble_3'); M.rect(13, 16, 14, 17, 'ruins');
    // scaffolding: climbable wooden work-platforms (mirrored)
    M.rect(5, 6, 6, 7, 'wood_planks', 4);
    M.obj(5, 7, 'stairs_2');
    // dry canal (the abandoned water-works)
    M.rect(0, 11, 3, 12, 'dirt_4', 2); M.rect(12, 11, 15, 12, 'dirt_4', 2);
    M.sym180();
    // the Tower: a grand stepped ziggurat you can fight up (collision-stamped)
    M.mon('ziggurat', 7, 11, 7, 3, {});
    M.monSym('babelcrane', 5, 6, 2, 4, { rot: 180, solid: false });
    M.monSym('tablet', 1, 3, 1, 2, { rot: 20, solid: false });
    M.monSym('arch', 7, 5, 3, 3, { solid: false });
    M.monSym('obelisk', 2, 3, 1, 4, {});
    M.monSym('colossus', 13, 8, 2, 2, { rot: 270 });
    M.spawnEdges('s', 6);
    M.finishSpawns('bricks_1');
    return M;
};

/* MOUNT OLYMPUS — 24×24 8v8. Marble acropolis floating over the cloud sea:
   temple terraces, stairway ascents, storm-charged flank lanes, void rifts. */
_MF_BUILDERS.prebuilt_olympus = function () {
    const M = _mfNew({
        name: 'Mount Olympus', w: 24, h: 24, base: 'cloud_2', baseH: 3, seed: 1201,
        strata: ['cloud_thick', 'cloud_thick', 'cloud'], underTop: 'marble_light',
        tints: { marble_light: '#f8f8f2', gold: '#ffe27a', cloud_2: '#e8f0ff', sky_ruin: '#d8e2f4' },
    });
    // void rifts shape the holy mountain's silhouette
    [[0, 0, 2, 1], [21, 0, 23, 2], [0, 6, 0, 8], [11, 3, 12, 3], [5, 9, 5, 10]]
        .forEach(r => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) M.hole(x, y); });
    // the acropolis: grand marble terraces rising to the sacred flame
    M.disc(11.5, 11.5, 6.5, 'marble_light');
    M.disc(11.5, 11.5, 4.4, 'marble_light', 4);
    M.disc(11.5, 11.5, 2.4, 'gold', 5);
    M.rect(11, 11, 12, 12, 'gold', 5);
    // processional stairways N/S cut the terraces (+1 steps)
    M.rect(11, 4, 12, 6, 'marble_light', 3); M.rect(11, 7, 12, 8, 'marble_light', 4);
    // storm-charged flank lanes (risky, half-heal)
    M.rect(2, 10, 3, 13, 'storm'); M.rect(20, 10, 21, 13, 'storm');
    // celestial-ruin perches (rangeBonus) on the mid flanks
    M.rect(6, 6, 7, 7, 'sky_ruin', 4); M.rect(16, 16, 17, 17, 'sky_ruin', 4);
    M.sym180();
    // temples, colossi of the gods, the eternal flame
    M.monSym('greek', 8, 8, 3, 2, {});
    M.monSym('greek', 15, 8, 3, 2, { rot: 180 });
    M.monSym('stairway', 11, 3, 2, 2, {});
    M.mon('colossus', 8, 15, 2, 4, { rot: 45 });
    M.mon('colossus', 15, 8, 2, 4, { rot: 225 });
    M.mon('lightpillar', 11, 11, 1, 4, { solid: false });
    M.objSym(9, 9, 'torch', {}); M.objSym(14, 9, 'torch', {});
    M.objSym(9, 5, 'column_3', {}); M.objSym(14, 5, 'column_3', {});
    M.spawnEdges('s', 8);
    M.finishSpawns('cloud_2');
    return M;
};

/* MARS — 20×20 6v6. Red regolith: mesa cover, twin dead rovers, the D&M
   face on its pedestal, crater dust bowls under a butterscotch sky. */
_MF_BUILDERS.prebuilt_mars = function () {
    const M = _mfNew({
        name: 'Mars', w: 20, h: 20, base: 'moon_2', baseH: 3, seed: 1301,
        strata: ['lava', 'cave_floor', 'rocks_4'], underTop: 'rocks_4',
        tints: {
            moon_2: '#d87a4a', moon_3: '#b05f38', rocks_4: '#b86844', cliff: '#a05a3a',
            rocks_2: '#c87450', metal: '#8a9098', ruins: '#c08058',
        },
    });
    // craters: sunken dust bowls with raised rims
    M.disc(9.5, 9.5, 3.4, 'moon_3', 2);
    M.ring(9.5, 9.5, 3.4, 4.3, 'rocks_2', 4);
    // rim breaches: two mirrored ways into the bowl (auto-nexus lands here)
    M.rect(9, 5, 10, 6, 'moon_3', 3); M.rect(9, 13, 10, 14, 'moon_3', 3);
    M.rect(9, 8, 10, 11, 'moon_3', 3);
    // mesas: flat-top buttes (hard cover, h6)
    M.rect(3, 3, 5, 4, 'cliff', 6); M.rect(14, 15, 16, 16, 'cliff', 6);
    M.rect(15, 4, 16, 5, 'cliff', 5); M.rect(3, 14, 4, 15, 'cliff', 5);
    // dune waves (slow-free red sand, +1 vantage arcs)
    M.disc(5, 9, 1.4, 'moon_2', 4); M.disc(14, 10, 1.4, 'moon_2', 4);
    // crash sites: twin dead rovers in debris fields (Spirit & Opportunity o7)
    M.rect(2, 7, 3, 8, 'metal'); M.rect(16, 11, 17, 12, 'metal');
    M.rect(2, 8, 2, 8, 'ruins');
    M.sym180();
    M.mon('rover', 2, 7, 1, 1, { rot: 25, solid: false });
    M.mon('rover', 17, 12, 1, 1, { rot: 205, solid: false });
    // Cydonia: the D&M pyramid formation (mirrored, for fairness lore
    // says the erosion carved twins)
    M.monSym('biodome', 7, 2, 3, 2, { solid: false });
    M.monSym('pyramid_cone', 6, 15, 4, 2, {});
    M.scatter(10, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'moon_2') M.rock(x, y, 'moon'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('moon_2');
    return M;
};

/* AREA 51 — 20×20 6v6. Fenced desert base: airstrip, floodlight towers,
   twin hangars, and the tarped saucer on its test rig at dead center. */
_MF_BUILDERS.prebuilt_area51 = function () {
    const M = _mfNew({
        name: 'Area 51', w: 20, h: 20, base: 'wasteland', baseH: 3, seed: 1401,
        strata: ['lava', 'cave_floor', 'dirt_4'], underTop: 'metal',
        tints: { wasteland: '#c8b088', metal: '#9fb2bd', aluminium: '#cfd8e0', road: '#a8a49a', scorched: '#8a7f68' },
    });
    // the airstrip: full-length runway on the east side + apron pads
    M.rect(15, 1, 16, 18, 'road');
    M.rect(14, 4, 14, 5, 'aluminium'); M.rect(17, 14, 17, 15, 'aluminium');
    // the restricted compound: warning ring + perimeter fence w/ N-S gates
    M.box(4, 4, 12, 15, 'scorched');
    for (let x = 4; x <= 12; x++) { if (x < 7 || x > 9) { M.obj(x, 4, 'barrier_1', {}); M.obj(x, 15, 'barrier_1', { rot: 180 }); } }
    for (let y = 5; y <= 14; y++) { M.obj(4, y, 'barrier_1', { rot: 270 }); M.obj(12, y, 'barrier_1', { rot: 90 }); }
    // floodlight towers on the compound corners (tall pillars + lamps on top)
    [[4, 4], [12, 4], [4, 15], [12, 15]].forEach(p => { M.t(p[0], p[1], 'metal'); M.h(p[0], p[1], 6); M.obj(p[0], p[1], 'lamp_post_2'); });
    // interior: tarmac + the saucer test rig at dead center
    M.rect(5, 5, 11, 14, 'dirt_4');
    M.rect(7, 9, 9, 10, 'aluminium', 4);                 // raised test platform
    // runway lights + HQ flag + desert scrub
    M.obj(15, 3, 'lamp_post'); M.obj(16, 16, 'lamp_post');
    M.sym180();
    // twin hangars (2×2, roof-walkable)
    M.building(5, 6, 'abandoned_building_1');
    M.building(10, 12, 'building_10');
    M.mon('saucer', 8, 9, 3, 3, { solid: false });       // the craft, de-tarped
    M.mon('flag', 8, 5, 1, 2, { solid: false });
    M.monSym('lightpillar', 1, 1, 1, 4, { solid: false });
    M.monSym('fluorescent', 15, 8, 1, 2, { rot: 90, solid: false });
    M.scatter(8, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'wasteland') M.obj(x, y, 'grass_tuft'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('wasteland');
    return M;
};

/* ANTARCTICA — 24×24 8v8. The ice wall and what's behind it: seawater
   channels with iceberg hops, slide-gap chokepoints, frozen colossus. */
_MF_BUILDERS.prebuilt_antarctica = function () {
    const M = _mfNew({
        name: 'Antarctica', w: 24, h: 24, base: 'marble_light', baseH: 3, seed: 1501,
        strata: ['lava', 'cave_floor', 'rocks_1'], underTop: 'ice',
        tints: {
            marble_light: '#e4f2fc', ice: '#bfe0ff', mountain_2: '#9fb8cc', deep_water: '#1d4e78',
            rocks_1: '#8aa4b8', cliff: '#7f98ac',
        },
    });
    // THE ICE WALL: a mid-map rampart with three gaps — every gap floored in ice
    M.rect(0, 11, 23, 12, 'ice', 7);
    [[3, 4], [11, 12], [19, 20]].forEach(g => M.rect(g[0], 11, g[1], 12, 'ice', 3));
    // seawater channels + iceberg hop-chains (mirrored quadrants)
    M.rect(15, 2, 21, 6, 'deep_water', 2);
    [[16, 3], [18, 5], [20, 3], [17, 4]].forEach(p => { M.rect(p[0], p[1], p[0], p[1], 'ice', 3); });
    // pressure ridges + nunatak peaks
    M.rect(2, 2, 4, 3, 'mountain_2', 5);
    M.rect(7, 6, 8, 6, 'cliff', 5);
    // snow trenches (sunken cover lanes)
    M.rect(5, 8, 10, 9, 'marble_light', 2);
    // research huts? no — the Old Ones' relics
    M.rect(2, 8, 3, 9, 'ruins');
    M.sym180();
    // the frozen colossus half-buried at the wall's central gap
    M.mon('colossus', 11, 10, 3, 2, { rot: 0 });
    M.mon('colossus', 12, 13, 3, 2, { rot: 180 });
    M.monSym('crystal', 4, 6, 2, 3, { solid: false });
    M.monSym('whalebones', 6, 4, 3, 2, { rot: 40, solid: false });
    M.monSym('monolith', 8, 3, 1, 3, {});
    M.spawnEdges('s', 8);
    M.finishSpawns('marble_light');
    return M;
};

/* SKINWALKER RANCH — 20×20 6v6. High-desert ranch: barn + corral, twin
   observation mesas, and the crop-circle anomaly right where the roaming
   hotspot spawns. */
_MF_BUILDERS.prebuilt_skinwalker = function () {
    const M = _mfNew({
        name: 'Skinwalker Ranch', w: 20, h: 20, base: 'grass_rocky', baseH: 3, seed: 1601,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'rocks_1',
        tints: { purple_grass: '#c07aff', wasteland: '#c4a878', grass_rocky: '#a8b06a', dirt: '#b89468' },
    });
    // the anomaly: concentric crop-circle rings at center (hotspot country)
    M.ring(9.5, 9.5, 3.6, 4.2, 'purple_grass');
    M.ring(9.5, 9.5, 2.0, 2.6, 'purple_grass');
    M.disc(9.5, 9.5, 0.9, 'purple_grass');
    // the mesa: flat-top with a range-bonus crown, mirrored SW/NE
    M.rect(14, 2, 17, 4, 'cliff', 5);
    M.rect(15, 3, 16, 3, 'mountain_top', 6);
    M.rect(13, 3, 13, 4, 'rocks_2', 4);                  // the scramble up
    // the ranch: barn, corral fence, water trough, dirt drive
    M.rect(1, 5, 6, 10, 'dirt');
    M.fence(1, 9, 5, 9, 'barrier_3', 180);
    M.fence(6, 5, 6, 8, 'barrier_3', 90);
    M.obj(5, 6, 'well');
    // the mutilation site (don't stand in it)
    M.rect(12, 7, 13, 8, 'poison_bog');
    // dead cottonwoods + sage
    M.obj(8, 2, 'tree_5'); M.obj(3, 12, 'tree_6');
    M.sym180();
    M.building(2, 6, 'abandoned_building_2');            // the weathered barn
    M.mon('rings', 9, 9, 2, 3, { solid: false });        // the thing above the field
    M.mon('windmill', 6, 4, 2, 4, { rot: 15, solid: false });
    M.monSym('monolith', 18, 6, 1, 3, {});
    M.scatter(10, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'grass_rocky') M.obj(x, y, 'grass_tuft'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_rocky');
    return M;
};

/* HOLLOW EARTH — 20×20 6v6. The world above and the world below, mirrored:
   a living forest half and its petrified cavern twin, joined by two great
   gates under a darkness veil. */
_MF_BUILDERS.prebuilt_hollow_earth = function () {
    const M = _mfNew({
        name: 'Hollow Earth', w: 20, h: 20, base: 'grass_2', baseH: 3, seed: 1701,
        strata: ['lava', 'lava', 'cave_floor'], underTop: 'rocks_3',
        tints: { cave_floor: '#8a7a9c', mushroom: '#c48ae0', crystal: '#9affe4', dark_woods: '#6a8a5a' },
    });
    // surface half (north): meadows, woods, a stream
    M.rect(0, 0, 19, 9, 'grass_2');
    [[2, 2], [5, 1], [15, 2], [17, 4], [3, 6]].forEach(p => M.tree(p[0], p[1]));
    [[8, 3], [12, 1]].forEach(p => M.tree(p[0], p[1], 'tree_3'));
    M.rect(0, 4, 3, 5, 'water');
    M.disc(15, 6, 1.4, 'grass_2', 4);
    M.rect(6, 5, 7, 6, 'dark_woods');
    // the crossing: darkness veil row with two gate lanes
    M.rect(0, 9, 19, 10, 'fog_wall');
    M.rect(4, 9, 5, 10, 'dirt_2'); M.rect(14, 9, 15, 10, 'dirt_2');
    M.sym180();
    // now re-theme the south half into the underworld (same geometry = fair)
    for (let y = 10; y < 20; y++) for (let x = 0; x < 20; x++) {
        const k = M.tk(x, y);
        if (k === 'grass_2' || k === 'grass_rocky') M.t(x, y, 'cave_floor');
        else if (k === 'grass_2') M.t(x, y, 'crystal');
        else if (k === 'water') M.t(x, y, 'water');
        else if (k === 'dark_woods') M.t(x, y, 'mushroom');
        else if (k === 'dirt_2') M.t(x, y, 'dirt_2');
        M.objs[y][x] = M.objs[y][x].map(e => {
            // living trees fossilize below (same footprint & cover — mirrored fairness)
            if (e.oid === MF_OID.tree) return Object.assign({}, e, { oid: MF_OID.tree_5 });
            if (e.oid === MF_OID.tree_3) return Object.assign({}, e, { oid: MF_OID.tree_6 });
            return e;
        });
    }
    M.mon('gateway', 4, 9, 2, 3, { solid: false });
    M.mon('gateway', 15, 10, 2, 3, { rot: 180, solid: false });
    M.mon('innersun', 9, 14, 2, 6, { solid: false });    // the sun they keep down here
    M.mon('crystal', 9, 16, 2, 3, { solid: false });
    M.mon('island', 2, 17, 3, 2, { solid: false });
    M.obj(4, 10, 'cave_entrance'); M.obj(15, 9, 'cave_entrance');
    M.spawnEdges('s', 6);
    M.finishSpawns('cave_floor');
    return M;
};

/* FAIRY FOREST — 20×20 6v6. Glowing woodland maze: mushroom-ring hedges
   that eat arrows, root paths, healing springs, crystal toadstools. */
_MF_BUILDERS.prebuilt_fairy_forest = function () {
    const M = _mfNew({
        name: 'Fairy Forest', w: 20, h: 20, base: 'grass_2', baseH: 3, seed: 1801,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'dirt',
        tints: {
            purple_grass: '#8affc8', mushroom: '#ff9ad8', leaves: '#7ae08a',
            grass_2: '#8fd47f', crystal: '#c8a8ff', healing_spring: '#8affd8',
        },
    });
    // winding fae paths (the three lanes)
    for (let y = 0; y < 20; y++) {
        const xw = 3 + Math.round(Math.sin(y * 0.5) * 1.5);
        M.t(xw, y, 'purple_grass'); M.t(xw + 1, y, 'purple_grass');
        const xe = 15 + Math.round(Math.cos(y * 0.45) * 1.5);
        M.t(xe, y, 'purple_grass'); M.t(xe + 1, y, 'purple_grass');
    }
    M.rect(9, 0, 10, 19, 'dirt_2');
    // the fairy ring: a mushroom hedge circle with an open heart (auto-nexus)
    M.ring(9.5, 9.5, 2.6, 3.4, 'mushroom');
    M.rect(9, 6, 10, 6, 'grass_2'); M.rect(9, 13, 10, 13, 'grass_2');
    // dense woods between the lanes (real blocking cover)
    [[6, 2], [7, 4], [12, 3], [13, 1], [6, 16], [12, 17], [7, 8], [12, 11]].forEach(p => M.tree(p[0], p[1]));
    [[6, 6], [13, 5], [2, 2], [17, 3]].forEach(p => M.tree(p[0], p[1], 'tree_2'));
    [[1, 8], [18, 6]].forEach(p => M.tree(p[0], p[1], 'tree_3'));
    // glades: leaves bowers + crystal toadstools + springs
    M.disc(3.5, 13.5, 1.4, 'leaves');
    M.rect(15, 15, 16, 16, 'crystal', 4);
    M.t(3, 13, 'healing_spring'); M.t(16, 6, 'healing_spring');
    M.sym180();
    M.mon('crystal', 15, 15, 2, 2, { solid: false });
    M.mon('crystal', 4, 4, 2, 2, { solid: false });
    M.monSym('toadstool', 3, 14, 2, 3, { solid: false });
    M.monSym('mushroom', 6, 13, 1, 2, {});                  // giant fae cap — solid, tree-like cover
    M.monSym('mushroom2', 13, 15, 1, 1, {});                // squat cap — clamber onto it
    M.mon('fairyring', 9, 9, 2, 2, { solid: false });       // dance at your peril
    M.monSym('island', 1, 16, 2, 2, { solid: false });   // fae islet drifting over the wood
    M.scatter(14, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'grass_2') M.obj(x, y, 'grass_tuft'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* MOON — 16×16 6v6. The sparse low-grav arena: crater bowls, the landing
   site (flag + rover), and one black monolith. */
_MF_BUILDERS.prebuilt_moon = function () {
    const M = _mfNew({
        name: 'Moon', w: 16, h: 16, base: 'moon', baseH: 3, seed: 1901,
        strata: ['lava', 'cave_floor', 'moon_3'], underTop: 'moon_3',
        tints: { moon: '#c8ccd8', moon_2: '#b0b4c4', moon_3: '#989cb0' },
    });
    // the great central crater: sunken bowl + raised rim, two breaches
    M.disc(7.5, 7.5, 3.2, 'moon_2', 2);
    M.ring(7.5, 7.5, 3.2, 4.1, 'moon_2', 4);
    M.rect(7, 3, 8, 4, 'moon', 3); M.rect(7, 11, 8, 12, 'moon', 3);
    M.rect(7, 6, 8, 9, 'moon_2', 3);
    // satellite craters (mirrored)
    M.disc(2.5, 3.5, 1.3, 'moon_3', 2);
    M.disc(12.5, 2.5, 1.1, 'moon_2', 4);
    // regolith ridges (cover)
    M.rect(4, 6, 4, 7, 'moon_3', 5); M.rect(11, 8, 11, 9, 'moon_3', 5);
    M.sym180();
    // the landing site (one per hemisphere — Apollo 11 and the one they cut)
    M.mon('flag', 3, 8, 1, 2, { solid: false });
    M.mon('rover', 4, 9, 1, 1, { rot: 120, solid: false });
    M.mon('flag', 12, 7, 1, 2, { rot: 180, solid: false });
    M.mon('rover', 11, 6, 1, 1, { rot: 300, solid: false });
    M.mon('monolith', 7, 7, 1, 3, {});                   // TMA-1
    M.scatter(9, (x, y) => { if (M.hget(x, y) === 3) M.rock(x, y, 'moon'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('moon');
    return M;
};

/* ═══════════════════════ Tier 3 — flavor & deep cuts ═══════════════════════ */

/* TECHNOTICLAN — 24×24 8v8. Neon-Aztec canal city: glowing waterways,
   stone causeways, climbable temple-ziggurats, the tech-altar. */
_MF_BUILDERS.prebuilt_technoticlan = function () {
    const M = _mfNew({
        name: 'Technoticlan', w: 24, h: 24, base: 'cobblestone', baseH: 3, seed: 2001,
        strata: ['lava', 'cave_floor', 'rocks_1'], underTop: 'bricks_2',
        tints: {
            cobblestone: '#7a8ba0', water: '#38e8ff', bricks_2: '#c07a9a',
            purple_grass: '#41f2d8', checkerboard: '#e04aff', gold: '#7affd4',
        },
    });
    // the canal grid: two glowing waterway rings (1-step down, swimmable)
    M.ring(11.5, 11.5, 7.6, 8.6, 'water', 2);
    M.ring(11.5, 11.5, 3.6, 4.5, 'water', 2);
    // stone causeways bridge both rings at the cardinals
    M.rect(11, 0, 12, 23, 'cobblestone', 3);
    M.rect(0, 11, 23, 12, 'cobblestone', 3);
    // glyph-light lanes
    M.rect(5, 5, 18, 5, 'purple_grass'); M.rect(5, 18, 18, 18, 'purple_grass');
    // the tech-altar: checkerboard dais at the heart
    M.rect(10, 10, 13, 13, 'checkerboard', 4);
    M.rect(11, 11, 12, 12, 'gold', 4);
    // plaza wards between the rings
    M.rect(5, 6, 7, 8, 'bricks_2'); M.rect(16, 15, 18, 17, 'bricks_2');
    M.sym180();
    // temple-ziggurats you can storm (collision-stamped) + neon glyph totems
    M.monSym('ziggurat', 5, 16, 5, 3, {});
    M.mon('ziggurat', 18, 5, 5, 3, {});
    M.monSym('fluorescent', 8, 11, 1, 2, { rot: 90, solid: false });
    M.monSym('fluorescent', 11, 8, 1, 2, { solid: false });
    M.mon('crystal', 11, 13, 2, 2, { solid: false });
    M.mon('holopyramid', 11, 11, 2, 4, { solid: false });   // the altar still broadcasts
    M.objSym(6, 6, 'torch', {}); M.objSym(17, 6, 'torch', {});
    M.spawnEdges('s', 8);
    M.finishSpawns('cobblestone');
    return M;
};

/* AGARTHA — 24×24 8v8. The inner-earth capital: jade terraces under the
   central sun-shaft, crystal spires, glowing rivers, mushroom groves. */
_MF_BUILDERS.prebuilt_agartha = function () {
    const M = _mfNew({
        name: 'Agartha', w: 24, h: 24, base: 'cave_floor', baseH: 3, seed: 2101,
        strata: ['lava', 'lava', 'cave_floor'], underTop: 'rocks_5',
        tints: {
            cave_floor: '#a89468', marble_light: '#bfe8c8', water: '#4ae0c8',
            crystal: '#8affd8', gold: '#ffe28a', mushroom: '#b8e07a',
        },
    });
    // glowing rivers wind from the corners toward the terraces
    for (let t = 0; t < 22; t++) {
        const x = 1 + t, y = 4 + Math.round(Math.sin(t * 0.5) * 2);
        if (x < 24) M.rect(x, y, x, y + 1, 'water', 2);
    }
    // the terraced city: three jade tiers to the sun-shaft plaza
    M.disc(11.5, 11.5, 6.2, 'marble_light', 4);
    M.disc(11.5, 11.5, 4.2, 'marble_light', 5);
    M.disc(11.5, 11.5, 2.2, 'gold', 6);
    // grand staircut approaches at the cardinals (+1 steps all the way up)
    M.rect(11, 4, 12, 5, 'marble_light', 3); M.rect(11, 6, 12, 7, 'marble_light', 4); M.rect(11, 8, 12, 9, 'marble_light', 5);
    M.rect(4, 11, 5, 12, 'marble_light', 3); M.rect(6, 11, 7, 12, 'marble_light', 4); M.rect(8, 11, 9, 12, 'marble_light', 5);
    // mushroom groves (arrow-eating flora) + crystal fields
    M.rect(3, 16, 5, 18, 'mushroom');
    M.rect(18, 3, 20, 5, 'crystal');
    M.sym180();
    // spires, gates of the deep, the inner sun
    M.mon('innersun', 11, 11, 2, 7, { solid: false });
    M.monSym('geode', 19, 4, 2, 2, { solid: false });
    M.monSym('crystal', 7, 7, 2, 3, { solid: false });
    M.monSym('crystal', 16, 7, 2, 3, { solid: false });
    M.monSym('arch', 11, 2, 3, 3, { solid: false });
    M.monSym('ziggurat', 2, 2, 4, 2, {});
    M.spawnEdges('s', 8);
    M.finishSpawns('cave_floor');
    return M;
};

/* VATICAN CITY — 20×20 6v6. The colonnade piazza: central obelisk, twin
   basilica steps, fountain pair, consecrated ground. */
_MF_BUILDERS.prebuilt_vatican = function () {
    const M = _mfNew({
        name: 'Vatican City', w: 20, h: 20, base: 'cobblestone', baseH: 3, seed: 2201,
        strata: ['lava', 'cave_floor', 'rocks_1'], underTop: 'marble_light',
        tints: { cobblestone: '#c8beab', marble_light: '#f6f3ea', gold: '#ffe9a8', sanctuary: '#ffe8c0' },
    });
    // the piazza: marble ellipse inscribed in the square
    M.disc(9.5, 9.5, 6.4, 'marble_light');
    // Bernini colonnades: raised marble arcs (hard cover) crowned with columns
    M.ring(9.5, 9.5, 5.4, 6.2, 'marble_light', 5);
    // four grand gaps open the piazza at the diagonals + cardinals
    [[9, 3, 10, 4], [9, 15, 10, 16], [3, 9, 4, 10], [15, 9, 16, 10]].forEach(r => M.rect(r[0], r[1], r[2], r[3], 'marble_light', 3));
    M.rect(2, 2, 4, 4, 'marble_light', 3); M.rect(15, 15, 17, 17, 'marble_light', 3);
    // basilica steps: gilded dais pair (mirrored) with sanctuary ground
    M.rect(8, 6, 11, 7, 'gold', 4);
    M.rect(8, 5, 11, 5, 'sanctuary', 4);
    // fountains
    M.t(6, 8, 'healing_spring'); M.t(13, 11, 'healing_spring');
    M.sym180();
    // the obelisk (a real blocker), saints in their niches, gates
    M.mon('obelisk', 9, 9, 1, 5, {});
    M.buildingSym(8, 1, 'church_1');
    M.monSym('basilicadome', 5, 1, 3, 4, { solid: false });
    M.monSym('censer', 7, 8, 1, 3, { solid: false });
    M.monSym('greek', 3, 6, 3, 2, { rot: 45 });
    M.monSym('colossus', 15, 6, 1, 2, { rot: 90 });
    M.objSym(5, 5, 'column_3', {}); M.objSym(14, 5, 'column_3', {});
    M.objSym(7, 12, 'torch', {});
    M.spawnEdges('s', 6);
    M.finishSpawns('cobblestone');
    return M;
};

/* BOHEMIAN GROVE — 20×20 6v6. Old-growth redwoods around the ritual
   clearing: the owl idol, the altar fire, lantern paths, the lake stage. */
_MF_BUILDERS.prebuilt_bohemian_grove = function () {
    const M = _mfNew({
        name: 'Bohemian Grove', w: 20, h: 20, base: 'grass_2', baseH: 3, seed: 2301,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'dirt',
        tints: { grass_2: '#6a9458', dirt: '#8a7458', dark_woods: '#4a6a48', forest_2: '#5a8450' },
    });
    // the creek + wooden footbridges
    for (let x = 0; x < 20; x++) { const y = 6 + Math.round(Math.sin(x * 0.4) * 1.2); M.t(x, y, 'water'); M.h(x, y, 2); }
    M.rect(4, 5, 4, 7, 'bridge', 3); M.rect(14, 5, 14, 7, 'bridge', 3);
    // lantern trails
    M.rect(9, 0, 10, 19, 'dirt');
    // old growth: redwood walls of trees (authored N half, mirrored)
    [[1, 1], [3, 2], [6, 1], [12, 2], [16, 1], [18, 3], [2, 8], [17, 8], [7, 3], [13, 4]].forEach(p => M.tree(p[0], p[1], 'tree_3'));
    [[5, 8], [15, 2], [11, 1]].forEach(p => M.tree(p[0], p[1], 'tree_2'));
    M.rect(0, 3, 1, 4, 'dark_woods'); M.rect(18, 6, 19, 7, 'dark_woods');
    // the ritual clearing (NE-of-center) + altar fire + the Owl
    M.disc(12.5, 12.5, 2.6, 'dirt');
    M.rect(12, 12, 13, 13, 'scorched');
    // the lakeside amphitheater (mirrored twin clearing)
    M.disc(6.5, 6.5, 1.8, 'grass_2');
    M.sym180();
    M.mon('effigy', 13, 14, 2, 1, { rot: 45, solid: false });
    M.obj(11, 12, 'torch'); M.obj(14, 13, 'torch'); M.obj(12, 14, 'torch');
    M.buildingSym(1, 15, 'building_8');                  // the lodges
    M.monSym('monolith', 6, 6, 1, 2, {});
    M.t(9, 9, 'healing_spring'); M.t(10, 10, 'healing_spring');
    M.objSym(9, 2, 'lamp_post', {});
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* GÖBEKLI TEPE — 16×16 6v6. The first temple: concentric ring walls,
   T-pillar sentinels, excavation trenches, the twin great pillars. */
_MF_BUILDERS.prebuilt_gobekli = function () {
    const M = _mfNew({
        name: 'Göbekli Tepe', w: 16, h: 16, base: 'dirt_3', baseH: 3, seed: 2401,
        strata: ['lava', 'cave_floor', 'dirt_4'], underTop: 'dirt_4',
        tints: { rock_wall_1: '#d8c098', bricks_2: '#e0d0b0', dirt_3: '#c8a878', grass_2: '#a8b070' },
    });
    // grass fringe at the tell's edge
    M.box(0, 0, 15, 15, 'grass_2');
    // outer ring wall (waist-high +1: climbable cover) with 4 gaps
    M.ring(7.5, 7.5, 5.6, 6.2, 'rock_wall_1', 4);
    [[7, 1, 8, 2], [7, 13, 8, 14], [1, 7, 2, 8], [13, 7, 14, 8]].forEach(r => M.rect(r[0], r[1], r[2], r[3], 'dirt_3', 3));
    // inner ring (offset gaps, E/W)
    M.ring(7.5, 7.5, 3.2, 3.9, 'rock_wall_1', 4);
    M.rect(4, 7, 4, 8, 'dirt_3', 3); M.rect(11, 7, 11, 8, 'dirt_3', 3);
    // T-pillar sentinels: 1-tile bone-brick pillars on the rings (hard cover)
    [[7, 4], [4, 5], [11, 5]].forEach(p => { M.t(p[0], p[1], 'bricks_2'); M.h(p[0], p[1], 6); });
    // excavation trenches (sunken defBonus digs)
    M.rect(2, 2, 4, 3, 'ruins', 2);
    M.obj(2, 3, 'stairs_2');
    M.sym180();
    // the twin great T-pillars at the sanctum — SOLID hard cover: 2 voxels
    // tall, block sight, jump on top for the high ground
    M.mon('tpillar', 7, 7, 1, 3, {});
    M.mon('tpillar', 8, 8, 1, 3, { rot: 180 });
    M.monSym('arch', 12, 2, 2, 2, { solid: false });
    M.monSym('colossus', 2, 12, 2, 1, { rot: 45 });
    M.scatter(8, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'dirt_3') M.rock(x, y, 'rocks_1'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('dirt_3');
    return M;
};

/* D.U.M.B. — 16×16 6v6. Deep Underground Military Base: concrete corridor
   grid, blast-door chokes, server-bank cover, holding cells, red light. */
_MF_BUILDERS.prebuilt_dumb = function () {
    const M = _mfNew({
        name: 'D.U.M.B.', w: 16, h: 16, base: 'tilefloor', baseH: 3, seed: 2501,
        strata: ['lava', 'cave_floor', 'dungeon'], underTop: 'dungeon_2',
        tints: { tilefloor: '#a87878', metal: '#a87878', dungeon_2: '#9a6a6a', metal_2: '#b88484', road: '#8a6a6a', dungeon: '#7a5a5a' },
    });
    // the tram rail: a fast W–E spine through the base
    M.rect(0, 7, 15, 8, 'road');
    // corridor walls carve the floor into rooms (h6 concrete)
    M.rect(3, 2, 3, 5, 'dungeon_2', 6); M.rect(4, 2, 7, 2, 'dungeon_2', 6);
    M.rect(12, 2, 12, 5, 'dungeon_2', 6); M.rect(9, 5, 12, 5, 'dungeon_2', 6);
    M.rect(6, 4, 6, 5, 'dungeon_2', 6);
    // holding cells (3-wide pods off the north corridor)
    M.rect(0, 2, 1, 3, 'dungeon_3');
    M.obj(1, 2, 'barrier_4', { rot: 90 });               // cell door
    // server banks: climbable metal blocks (cover you can mantle)
    M.rect(9, 3, 10, 3, 'metal_2', 4);
    M.rect(5, 6, 5, 6, 'metal_2', 4);
    // blast doors on the tram spine (edge-blocking slabs, mirrored)
    M.obj(4, 7, 'barrier_1', { rot: 90 }); M.obj(4, 8, 'barrier_1', { rot: 90 });
    // emergency lighting + signage
    M.sym180();
    M.monSym('greytube', 0, 3, 1, 3, { solid: false });  // specimen 0. it is awake
    M.monSym('blastdoor', 6, 6, 2, 3, { solid: false });
    M.monSym('fluorescent', 2, 7, 1, 2, { rot: 90, solid: false });
    M.monSym('fluorescent', 8, 4, 1, 2, { solid: false });
    M.monSym('exitsign', 3, 6, 1, 1, { solid: false });
    M.monSym('exitsign', 13, 2, 1, 1, { solid: false });
    M.spawnEdges('s', 6);
    M.finishSpawns('tilefloor');
    return M;
};

/* CERN — 16×16 6v6. The collider ring: circular corridor between aluminium
   wall arcs, the crackling portal anomaly at the interaction point. */
_MF_BUILDERS.prebuilt_cern = function () {
    const M = _mfNew({
        name: 'CERN', w: 16, h: 16, base: 'tilefloor_2', baseH: 3, seed: 2601,
        strata: ['lava', 'cave_floor', 'dungeon'], underTop: 'aluminium',
        tints: {
            tilefloor_2: '#9fb4c8', metal: '#9fb4c8', aluminium: '#cfd8e0', gold: '#c88a4a',
            checkerboard: '#7ae0ff', metal_3: '#8aa0b8', storm: '#6a8ac8',
        },
    });
    // beamline conduits (copper) crossing the floor
    M.rect(7, 0, 8, 15, 'gold'); M.rect(0, 7, 15, 8, 'gold');
    // the ring: outer + inner wall arcs with four access gaps
    M.ring(7.5, 7.5, 6.4, 7.1, 'aluminium', 6);
    M.ring(7.5, 7.5, 3.4, 4.1, 'aluminium', 6);
    M.rect(7, 0, 8, 15, 'gold', 3); M.rect(0, 7, 15, 8, 'gold', 3);
    // segmented tunnel floor between the walls
    M.ring(7.5, 7.5, 4.2, 6.3, 'metal_3');
    M.rect(7, 4, 8, 11, 'metal_3', 3);
    // the interaction point: portal dais + crackling containment ring
    M.rect(7, 7, 8, 8, 'checkerboard', 4);
    M.ring(7.5, 7.5, 1.4, 2.0, 'storm');
    // control terminals (mantle-height cover)
    M.rect(2, 2, 3, 2, 'metal_2', 4); M.rect(12, 13, 13, 13, 'metal_2', 4);
    M.sym180();
    M.mon('rings', 7, 7, 2, 3, { solid: false });        // the anomaly
    M.mon('lightpillar', 7, 7, 1, 4, { solid: false });
    M.monSym('beamring', 4, 11, 3, 2, { rot: 20, solid: false });
    M.monSym('fluorescent', 5, 5, 1, 2, { solid: false });
    M.monSym('exitsign', 12, 5, 1, 1, { solid: false });
    M.spawnEdges('s', 6);
    M.finishSpawns('tilefloor_2');
    return M;
};

/* BACKROOMS — 16×16 6v6. Level 0: yellow wallpaper maze on damp carpet,
   humming lights, false exits, one flooded corridor. No sky. No stars. */
_MF_BUILDERS.prebuilt_backrooms = function () {
    const M = _mfNew({
        name: 'Backrooms', w: 16, h: 16, base: 'carpet', baseH: 3, seed: 2701,
        strata: ['lava', 'cave_floor', 'carpet_4'], underTop: 'wallpaper',
        tints: { carpet: '#c8b878', wallpaper: '#e8d890', water: '#b8b060', carpet_4: '#b0a068' },
    });
    // the maze: off-kilter wallpaper walls (h6), three lanes + cross-cuts
    M.rect(3, 0, 3, 4, 'wallpaper', 6); M.rect(3, 4, 6, 4, 'wallpaper', 6);
    M.rect(9, 2, 12, 2, 'wallpaper', 6); M.rect(12, 2, 12, 5, 'wallpaper', 6);
    M.rect(6, 6, 9, 6, 'wallpaper', 6);
    M.rect(0, 10, 2, 10, 'wallpaper', 6);
    M.rect(5, 9, 5, 12, 'wallpaper', 6);
    M.rect(14, 6, 15, 6, 'wallpaper', 6);
    // identical doorless rooms (slightly different carpet — you noticed)
    M.rect(0, 0, 2, 2, 'carpet_2'); M.rect(13, 3, 15, 4, 'carpet_3');
    // the flooded corridor (almond water)
    M.rect(0, 12, 15, 12, 'water');
    M.sym180();
    // the hum: ceiling tubes + EXIT signs that lie
    M.monSym('fluorescent', 2, 5, 1, 2, { solid: false });
    M.monSym('fluorescent', 7, 1, 1, 2, { rot: 90, solid: false });
    M.monSym('fluorescent', 10, 8, 1, 2, { solid: false });
    M.monSym('exitsign', 4, 4, 1, 1, { solid: false });
    M.monSym('exitsign', 12, 3, 1, 1, { solid: false });
    M.monSym('securitycam', 10, 5, 1, 3, { rot: 200, solid: false });
    M.mon('monolith', 7, 7, 1, 2, {});                   // something is here with you
    M.spawnEdges('s', 6);
    M.finishSpawns('carpet');
    return M;
};

/* NORTH POLE — 16×16 6v6. Santa's compound: the workshop, present depots,
   a frozen slide-pond over the objective, aurora overhead. */
_MF_BUILDERS.prebuilt_northpole = function () {
    const M = _mfNew({
        name: 'North Pole', w: 16, h: 16, base: 'marble_light', baseH: 3, seed: 2801,
        strata: ['lava', 'cave_floor', 'rocks_1'], underTop: 'ice',
        tints: { marble_light: '#e8f4ff', ice: '#c8e8ff', wood_planks: '#a86848', crystal: '#bfe8ff' },
    });
    // the frozen pond: an ice slide-arena right over the center objective
    M.disc(7.5, 7.5, 2.8, 'ice');
    // the workshop compound: plank yard + twin buildings + crate depots
    M.rect(1, 2, 5, 5, 'wood_planks');
    M.obj(1, 2, 'barrier_3', {}); M.obj(2, 2, 'barrier_3', {});   // stacked presents
    M.obj(5, 3, 'barrier_3', { rot: 90 });
    // pine wind-break rows
    [[8, 1], [10, 2], [13, 1], [1, 8], [2, 11]].forEach(p => M.tree(p[0], p[1], 'tree_2'));
    // ice sculptures + snow drifts
    M.rect(12, 6, 12, 7, 'crystal', 4);
    M.disc(13.5, 12.5, 1.2, 'marble_light', 4);
    M.sym180();
    M.buildingSym(2, 3, 'building_6');                    // workshop + mirrored stable
    M.monSym('lightpillar', 7, 2, 1, 4, { solid: false }); // aurora beacons
    M.mon('sleigh', 4, 6, 2, 2, { rot: 320, solid: false });
    M.monSym('candycane', 5, 5, 1, 3, { solid: false });
    // elf housing: snow-block igloos, hearths lit
    M.monSym('igloo', 11, 3, 2, 2, { rot: 150, solid: false });
    M.mon('igloo', 1, 12, 2, 2, { rot: 40, solid: false });
    M.monSym('crystal', 12, 6, 2, 2, { solid: false });
    M.mon('flag', 7, 7, 1, 2, { solid: false });          // the actual Pole
    M.spawnEdges('s', 6);
    M.finishSpawns('marble_light');
    return M;
};

/* FLAT LANDS — 16×16 6v6. The eerie empty plane. Two shallow dips. One dead
   tree. A ring you can barely see. Nothing else. You are being watched. */
_MF_BUILDERS.prebuilt_flatlands = function () {
    const M = _mfNew({
        name: 'Flat Lands', w: 16, h: 16, base: 'grass_2', baseH: 3, seed: 2901,
        strata: ['lava', 'cave_floor', 'dirt'], underTop: 'dirt',
        tints: { grass_2: '#b8c8a8', purple_grass: '#a8b898', dirt_2: '#b0a890' },
    });
    // the circle (was it always there?)
    M.ring(7.5, 7.5, 4.4, 4.9, 'purple_grass');
    // two shallow dips — the only cover on the whole plane
    M.rect(3, 5, 4, 6, 'dirt_2', 2);
    M.rect(11, 9, 12, 10, 'dirt_2', 2);
    // one dead tree (and its twin, which you don't remember)
    M.obj(4, 2, 'tree_5');
    M.sym180();
    M.rock(7, 7, 'rocks_1');
    M.scatter(5, (x, y) => { if (M.hget(x, y) === 3 && M.tk(x, y) === 'grass_2') M.obj(x, y, 'grass_tuft'); });
    M.spawnEdges('s', 6);
    M.finishSpawns('grass_2');
    return M;
};

/* ═══════════════════════════════════════════════════════════════════════════
   DELTA FORGE — hand-authored 8×8 Δ boards (2026-09-01 delta redesign)
   ─────────────────────────────────────────────────────────────────────────────
   Every launch map's Δ used to be a blind 8×8 crop of its full map. They are
   now AUTHORED, Custom-Robo-Arena style: a flat 8×8 chess board with a few
   obstacles that break line of sight and shape lanes — and nothing else.
   House rules (validated headlessly — see PLAYTEST_NOTES "DELTA FORGE"):
     • 8×8, 4v4. P2 spawns on row 0 (x 2..5), P1 on row 7. The spawn rows,
       the egress rows behind them (rows 1 / 6, x 2..5) and the 2×2 nexus
       zone at dead centre (x 3..4, y 3..4) are ALWAYS flat at the shared
       baseline, clear of objects, and never walled off. Arena stamps the
       centre nexus from the authored `nexus` object; TDM & co. strip it.
     • 180°-rotation symmetric (terrain, heights, objects, walls, monuments).
     • At least two node-disjoint walkable routes from each spawn row to the
       nexus for a jump-1 ground unit.
     • Vocabulary (heights relative to the baseline surface z = MF_DELTA_BASE_H):
         M.step(x,y,tex)      +1 ledge — climbable cover. A 1-high bump hides
                              two flat-ground units; standing on it sees over.
         M.block(x,y,tex)     +2 solid block — a wall for jump-1 units (most),
                              jump-2 races hop onto it. Blocks sight. A step
                              beside it is a staircase onto it.
         M.block(x,y,tex,3)   +3 — a wall for everyone.
         M.wall(x,y,side,o)   THIN edge wall (h 2 = blocks walking + sight and
                              costs no floor tile; see:true = chain-link that
                              blocks walking only; h 1 = hop-over parapet).
         M.tree(x,y,kind)     tree object — blocks walking + sight.
         M.pillarSym(kind,…)  ONLY collision monuments are allowed here
                              (tpillar, greekcol, mushroom, mushroom2, obelisk3d,
                              monolith, greytube, dumpster): they stamp real
                              voxels, so what looks like cover IS cover.
         M.lake(x,y,tex,d)    1-deep pond (walkable, escapable); depth 2 also
                              floods the dirt_4 stratum so the board's cut edge
                              shows a real lake sunk into the bed.
     • Shared bed under every board: lava → cave floor → cave wall → dirt →
       dirt, then the themed surface at z5. Raised blocks wear their own
       surface texture all the way down (cfg.fillAbove = 'surface').
     • Author the TOP HALF (rows 0..3) only, then M.symAll(); monuments go
       AFTER symAll via pillarSym / mon pairs; M.finishDelta() seats spawns,
       scrubs the protected tiles and places the centre nexus.
   ═══════════════════════════════════════════════════════════════════════════ */
const MF_DELTA_S = 8;
const MF_DELTA_BASE_H = 5;
const MF_DELTA_STRATA = ['lava', 'cave_floor', 'cave_wall', 'dirt_4', 'dirt_3'];
/* monument kinds with a real collision stamp (map.js _MON_COLLISION / _MON_GRID) */
const MF_DELTA_SOLID_MONS = new Set(['tpillar', 'greekcol', 'mushroom', 'mushroom2', 'obelisk3d', 'monolith', 'greytube', 'dumpster', 'obelisk', 'colossus', 'greek']);

function _mfDeltaNew(cfg) {
    const S = MF_DELTA_S, B = MF_DELTA_BASE_H;
    const M = _mfNew({
        name: cfg.name, w: S, h: S, base: cfg.base || 'grass_2', baseH: B, seed: cfg.seed || 8008,
        strata: MF_DELTA_STRATA, underTop: 'dirt_3', fillAbove: 'surface', tints: cfg.tints || null,
    });
    M.B = B;
    M.deltaDesc = cfg.desc || '';
    M.block = (x, y, key, h) => { if (key) M.t(x, y, key); M.h(x, y, B + (h == null ? 2 : h)); };
    M.step = (x, y, key) => { if (key) M.t(x, y, key); M.h(x, y, B + 1); };
    M.lake = (x, y, key, depth) => {
        key = key || 'water';
        M.t(x, y, key); M.h(x, y, B - 1);
        if ((depth || 1) >= 2) M.under(x, y, B - 2, key);
    };
    M.treeL = (x, y, kind, leaf) => M.obj(x, y, kind || 'tree', leaf ? { leaf } : null);
    M.wrun = (x0, y0, x1, y1, side, o) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) M.wall(x, y, side, o); };
    /* strict 180° symmetry: sym180 mirrors the authored top half; the edge
       walls sitting ON the middle line (N edges at y = 4) get their twins here */
    M.symAll = () => {
        M.sym180();
        Object.keys(M.walls).forEach(k => {
            const p = k.split(','), x = +p[0], y = +p[1], side = p[2];
            const mk = (side === 'N') ? ((S - 1 - x) + ',' + (S - y) + ',N') : ((S - x) + ',' + (S - 1 - y) + ',W');
            if (!M.walls[mk]) M.walls[mk] = Object.assign({}, M.walls[k]);
        });
    };
    /* a 1×1 solid monument + its 180° twin (even-footprint kinds such as the
       dumpster do not rotate-mirror onto the same tiles — place both by hand) */
    M.pillarSym = (kind, x, y, maxH, o) => M.monSym(kind, x, y, 1, maxH || 3, o);
    M.finishDelta = (padKey) => {
        padKey = padKey || M.cfg.base || 'grass_2';
        const sp1 = [], sp2 = [];
        for (let i = 0; i < 4; i++) { sp1.push({ x: 2 + i, y: S - 1 }); sp2.push({ x: 2 + i, y: 0 }); }
        M.spawns(sp1, sp2);
        /* protected tiles: spawn rows, egress rows, nexus zone → flat baseline,
           dry passable pad, no objects, no walls on any of their edges */
        const HAZ = new Set([MF_TID.lava, MF_TID.deep_water, MF_TID.poison_bog, MF_TID.poison, MF_TID.cloud_gap, MF_TID.chasm, MF_TID.water].filter(Boolean));
        const prot = [];
        for (let x = 2; x <= 5; x++) prot.push([x, 0], [x, 1], [x, S - 2], [x, S - 1]);
        prot.push([3, 3], [4, 3], [3, 4], [4, 4]);
        prot.forEach(([x, y]) => {
            if (M.hgt[y][x] !== B) { console.warn('[DeltaForge] ' + M.cfg.name + ': protected tile ' + x + ',' + y + ' was not flat — flattened'); M.h(x, y, B); }
            if (HAZ.has(M.ter[y][x])) M.t(x, y, padKey);
            delete M.underrides[x + ',' + y];
            M.clearObj(x, y);
            ['N', 'S', 'E', 'W'].forEach(side => { delete M.walls[M.wallKey(x, y, side)]; });
        });
        /* the spawn apron: finishSpawns clamps any |Δh| > 1 tile within one
           step of a spawn tile — warn so nobody authors a +2 block there */
        [sp1, sp2].forEach(list => list.forEach(p => {
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const x = p.x + dx, y = p.y + dy;
                if (M.in(x, y) && Math.abs(M.hgt[y][x] - B) > 1) console.warn('[DeltaForge] ' + M.cfg.name + ': ' + x + ',' + y + ' is too tall beside a spawn — clamped');
            }
        }));
        M.finishSpawns(padKey);
        /* the centre nexus zone: ONE authored object at the zone's NW anchor,
           placed after symmetry so it is never doubled. Arena stamps the 2×2
           nexus terrain from it (map.js _initNexusFromObjects); every mode
           without a nexus strips it and the centre stays plain floor. */
        M.objs[3][3] = M.objs[3][3].filter(e => e.oid !== MF_OID.nexus);
        M.obj(3, 3, 'nexus');
        /* cosmetic monument kinds have no collision — never let one pretend */
        M.mons.forEach(m => { if (!MF_DELTA_SOLID_MONS.has(m.kind)) m.solid = false; });
        const entry = M.finish();
        entry.isDelta = true;
        entry.base = M.cfg.base || 'grass_2';
        entry.deltaDesc = M.deltaDesc;
        return entry;
    };
    return M;
}

/* ═══════════════════════ THE Δ BOARDS — one per launch map ═════════════════
   Coordinates: x 0..7 west→east, y 0..7 north→south. P2 row 0, P1 row 7,
   nexus x3..4 × y3..4. Author rows 0..3 only, then symAll(). Tiles (1,0),
   (1,1), (6,0), (6,1) sit on the spawn apron: trees / walls / monuments / +1
   are fine there, +2 blocks are not (finishSpawns would clamp them). */
const _MF_DELTA_BUILDERS = {};

/* Tier 1 ───────────────────────────────────────────────────────────────── */

/* MOUNT SHASTA — timberline meadow: pines, one granite boulder, a grassy
   terrace above a cold lake shore. */
_MF_DELTA_BUILDERS.prebuilt_shasta = function () {
    const M = _mfDeltaNew({ name: 'Mount Shasta', base: 'grass_2', seed: 8101,
        tints: { rocks_1: '#c0c4c8', water: '#5aa8d8' },
        desc: 'timberline meadow — pines, a granite boulder, a grassy terrace over the cold lake shore' });
    M.treeL(0, 0, 'tree_2'); M.treeL(6, 1, 'tree_3'); M.treeL(5, 3, 'tree_2');
    M.block(2, 2, 'rocks_1');                              // granite boulder
    M.step(0, 2, 'grass_2'); M.step(1, 2, 'grass_2');      // terrace
    M.lake(0, 3, 'water', 2); M.lake(1, 3, 'water', 1);    // the lake shore
    M.symAll();
    return M.finishDelta();
};

/* STONEHENGE — four sarsen stones in a diamond around the altar, corner
   sentinels, ruined ledges on the flanks, a dirt processional. */
_MF_DELTA_BUILDERS.prebuilt_stonehenge = function () {
    const M = _mfDeltaNew({ name: 'Stonehenge', base: 'grass_2', seed: 8102,
        tints: { ruins: '#b8b0a0', dirt: '#a08868' },
        desc: 'the sarsen diamond — four standing stones around the altar, ruined ledges on the flanks' });
    M.rect(3, 1, 4, 2, 'dirt');                            // processional
    M.step(1, 3, 'ruins'); M.step(6, 3, 'ruins');          // fallen lintels
    M.symAll();
    M.pillarSym('monolith', 2, 2, 3); M.pillarSym('monolith', 5, 2, 3);   // the diamond
    M.pillarSym('monolith', 0, 1, 3);                                     // sentinels
    return M.finishDelta();
};

/* PYRAMIDS OF GIZA — sand, a sandstone causeway, mastaba ledges that stair
   up onto a sandstone block, twin obelisks. */
_MF_DELTA_BUILDERS.prebuilt_giza = function () {
    const M = _mfDeltaNew({ name: 'Pyramids of Giza', base: 'dirt_2', seed: 8103,
        tints: { dirt_2: '#e0c48c', bricks_1: '#dcb880' },
        desc: 'the necropolis floor — sandstone causeway, mastaba ledges, a tomb block and twin obelisks' });
    M.rect(3, 1, 4, 2, 'bricks_1');                        // causeway
    M.step(2, 2, 'bricks_1'); M.step(5, 2, 'bricks_1');    // mastaba ledges
    M.block(1, 2, 'bricks_1');                             // tomb block (climb it from the ledge)
    M.step(6, 3, 'bricks_1');
    M.symAll();
    M.pillarSym('obelisk3d', 0, 1, 3); M.pillarSym('obelisk3d', 7, 2, 3);
    return M.finishDelta();
};

/* NUKETOWN — the street down the middle, wooden crates, dumpsters you can
   climb, a picket fence you can shoot over but not walk through. */
_MF_DELTA_BUILDERS.prebuilt_nuketown = function () {
    const M = _mfDeltaNew({ name: 'Nuketown', base: 'grass_2', seed: 8104,
        tints: { urban_street: '#b8b4ac', wood_planks: '#c8a068' },
        desc: 'suburbia — the street, wooden crates, climbable dumpsters and a picket fence you shoot over' });
    M.rect(3, 1, 4, 2, 'urban_street');                    // the street
    M.block(0, 1, 'wood_planks'); M.block(2, 3, 'wood_planks');   // crates
    M.wall(0, 3, 'N', { h: 2, tex: 'wood_planks', see: true }); // picket fence
    M.wall(1, 3, 'N', { h: 2, tex: 'wood_planks', see: true });
    M.treeL(7, 1, 'tree_5');
    M.symAll();
    M.mon('dumpster', 5, 2, 2, 1, { rot: 0 });             // (5,2)-(6,2)
    M.mon('dumpster', 1, 5, 2, 1, { rot: 180 });           // (1,5)-(2,5)
    return M.finishDelta();
};

/* HEAVEN — the gate plaza: a golden processional, the nexus sunk between
   two marble daises, pillars on the wings. */
_MF_DELTA_BUILDERS.prebuilt_heaven = function () {
    const M = _mfDeltaNew({ name: 'Heaven', base: 'cloud_2', seed: 8105,
        tints: { gold: '#ffe9a0', marble_light: '#fdfdf6', cloud_2: '#eef2ff' },
        desc: 'the gate plaza — a golden processional between marble daises, pillars on the wings' });
    M.rect(3, 1, 4, 2, 'gold');                            // processional
    M.step(2, 3, 'marble_light'); M.step(5, 3, 'marble_light');   // daises flanking the nexus
    M.step(0, 1, 'marble_light'); M.step(1, 1, 'marble_light');
    M.symAll();
    M.pillarSym('greekcol', 1, 2, 2); M.pillarSym('greekcol', 6, 2, 2);
    return M.finishDelta();
};

/* HELL — scorched rock, lava pools sunk into the bed, obsidian blocks, a
   basalt step in front of the altar, a spike. */
_MF_DELTA_BUILDERS.prebuilt_hell = function () {
    const M = _mfDeltaNew({ name: 'Hell', base: 'scorched', seed: 8106,
        tints: { scorched: '#e08060', rocks_3: '#b06a50', obsidian: '#584058' },
        desc: 'the pit floor — lava pools, obsidian blocks, a basalt step before the altar' });
    M.lake(0, 0, 'lava', 2); M.lake(7, 2, 'lava', 2);      // lava pools
    M.block(1, 2, 'obsidian'); M.block(6, 3, 'obsidian');
    M.step(3, 2, 'rocks_3');                               // basalt step in the lane
    M.symAll();
    M.pillarSym('monolith', 5, 2, 3);                      // obsidian spike
    return M.finishDelta();
};

/* CYBERPUNK CITY — alleys: concrete blocks, dumpsters, chain-link you can
   shoot through, side lanes of asphalt. */
_MF_DELTA_BUILDERS.prebuilt_cyberpunk = function () {
    const M = _mfDeltaNew({ name: 'Cyberpunk City', base: 'urban_street', seed: 8107,
        tints: { urban_street: '#8a86a0', road: '#6a6a80', urban_wall: '#9a94b0', metal_3: '#8aa0b8' },
        desc: 'back alleys — concrete blocks, dumpsters, chain-link you shoot through' });
    M.rect(0, 1, 0, 3, 'road');                            // side alley
    M.block(1, 2, 'urban_wall'); M.block(6, 2, 'urban_wall');
    M.wall(1, 3, 'N', { h: 2, tex: 'metal_3', see: true }); // chain-link
    M.wall(2, 3, 'N', { h: 2, tex: 'metal_3', see: true });
    M.symAll();
    M.mon('dumpster', 5, 3, 2, 1, { rot: 0 });             // (5,3)-(6,3)
    M.mon('dumpster', 1, 4, 2, 1, { rot: 180 });           // (1,4)-(2,4)
    return M.finishDelta();
};

/* CAMELOT — the courtyard: a crenellated curtain wall to go around, corner
   towers, a drawbridge of planks, stair terraces. */
_MF_DELTA_BUILDERS.prebuilt_camelot = function () {
    const M = _mfDeltaNew({ name: 'Camelot', base: 'bricks_2', seed: 8108,
        tints: { bricks_2: '#c8b8a8', wood_planks: '#a88458' },
        desc: 'the courtyard — a crenellated curtain wall, corner towers and a plank drawbridge' });
    M.rect(3, 1, 4, 2, 'wood_planks');                     // drawbridge
    M.wrun(0, 3, 2, 3, 'N', { h: 2, tex: 'bricks_2', cap: 'crenel' });   // curtain wall
    M.block(0, 2, 'bricks_2'); M.block(7, 1, 'bricks_2');  // towers
    M.step(5, 2, 'bricks_2'); M.step(6, 2, 'bricks_2');    // terrace
    M.symAll();
    return M.finishDelta();
};

/* FOOTBALL STADIUM — chalk lines, team end zones, sideline bleacher steps
   and equipment crates. */
_MF_DELTA_BUILDERS.prebuilt_stadium = function () {
    const M = _mfDeltaNew({ name: 'Football Stadium', base: 'grass_2', seed: 8109,
        tints: { grass_2: '#5ec46a', marble_light: '#f4f4f4', carpet_2: '#5a80ff', carpet: '#ff6a55', metal_2: '#b8bcc4' },
        desc: 'the gridiron — chalk lines, end zones, bleacher steps and equipment crates' });
    M.rect(0, 2, 7, 2, 'marble_light');                    // chalk line
    M.rect(2, 0, 5, 0, 'carpet');                          // north end zone
    M.step(0, 1, 'metal_2'); M.step(0, 2, 'metal_2'); M.step(0, 3, 'metal_2');   // bleachers
    M.block(1, 2, 'metal_2'); M.block(5, 3, 'metal_2');    // equipment crates
    M.symAll();
    M.rect(2, 7, 5, 7, 'carpet_2');                        // south end zone (other team colour)
    return M.finishDelta();
};

/* Tier 2 ───────────────────────────────────────────────────────────────── */

/* ATLANTIS — a flooded canal along one edge, marble pillars, a low
   marble wall under the east pillar. */
_MF_DELTA_BUILDERS.prebuilt_atlantis = function () {
    const M = _mfDeltaNew({ name: 'Atlantis', base: 'marble_light', seed: 8201,
        tints: { marble_light: '#c8ecf2', water: '#49c2d8', gold: '#ffe9a0' },
        desc: 'the sunken plaza — a canal along the edge, marble pillars, a low wall to hold' });
    M.lake(0, 1, 'water', 2); M.lake(0, 2, 'water', 2); M.lake(0, 3, 'water', 2); M.lake(1, 3, 'water', 1);
    M.step(6, 1, 'gold');
    M.wall(5, 3, 'N', { h: 2, tex: 'marble_light' });
    M.symAll();
    M.pillarSym('greekcol', 2, 2, 2); M.pillarSym('greekcol', 5, 2, 2);
    return M.finishDelta();
};

/* TOWER OF BABEL — brick terraces climbing toward the centre, obelisks,
   one unfinished block. */
_MF_DELTA_BUILDERS.prebuilt_babel = function () {
    const M = _mfDeltaNew({ name: 'Tower of Babel', base: 'bricks_1', seed: 8202,
        tints: { bricks_1: '#d8a878' },
        desc: 'the ziggurat base — brick terraces beside the centre, obelisks, one unfinished block' });
    M.step(2, 2, 'bricks_1'); M.step(2, 3, 'bricks_1'); M.step(5, 2, 'bricks_1');
    M.block(0, 2, 'bricks_1');
    M.symAll();
    M.pillarSym('obelisk3d', 1, 1, 3); M.pillarSym('obelisk3d', 6, 2, 3);
    return M.finishDelta();
};

/* MOUNT OLYMPUS — temple stylobates beside the centre, a golden
   processional, columns and a marble screen wall. */
_MF_DELTA_BUILDERS.prebuilt_olympus = function () {
    const M = _mfDeltaNew({ name: 'Mount Olympus', base: 'marble_light', seed: 8203,
        tints: { marble_light: '#f8f8f2', gold: '#ffe27a' },
        desc: 'the acropolis floor — temple stylobates, a golden processional, columns and a screen wall' });
    M.rect(3, 1, 4, 2, 'gold');
    M.step(5, 3, 'marble_light'); M.step(6, 3, 'marble_light');
    M.block(0, 3, 'marble_light');
    M.wall(6, 3, 'N', { h: 2, tex: 'marble_light' });
    M.symAll();
    M.pillarSym('greekcol', 1, 1, 2); M.pillarSym('greekcol', 5, 2, 2);
    return M.finishDelta();
};

/* MARS — red regolith: mesas, a western crater rim, a dust bowl in the lane. */
_MF_DELTA_BUILDERS.prebuilt_mars = function () {
    const M = _mfDeltaNew({ name: 'Mars', base: 'moon_2', seed: 8204,
        tints: { moon_2: '#c88a5a', mars: '#c07a58', mars_2: '#a86048' },
        desc: 'red regolith — mesas, a crater rim, a dust bowl sunk in the lane' });
    M.block(1, 2, 'mars_2'); M.block(6, 3, 'mars_2');      // mesas
    M.step(0, 1, 'moon_2'); M.step(0, 2, 'moon_2'); M.step(5, 2, 'moon_2');   // crater rims
    M.lake(3, 2, 'mars', 1);                               // dust bowl
    M.symAll();
    return M.finishDelta();
};

/* AREA 51 — the airstrip, a fenced compound in one corner, hangar crates,
   a specimen tank beside the centre. */
_MF_DELTA_BUILDERS.prebuilt_area51 = function () {
    const M = _mfDeltaNew({ name: 'Area 51', base: 'dirt_4', seed: 8205,
        tints: { dirt_4: '#c8b088', road: '#a8a49a', aluminium: '#cfd8e0', metal_2: '#9fb2bd' },
        desc: 'the tarmac — an airstrip, a chain-link compound, hangar crates and a specimen tank' });
    M.rect(3, 1, 4, 2, 'road');                            // airstrip
    M.wall(0, 2, 'N', { h: 2, tex: 'aluminium', see: true }); M.wall(1, 2, 'N', { h: 2, tex: 'aluminium', see: true });
    M.wall(2, 2, 'W', { h: 2, tex: 'aluminium', see: true }); M.wall(2, 3, 'W', { h: 2, tex: 'aluminium', see: true });
    M.block(6, 2, 'metal_2');                              // hangar crate
    M.symAll();
    M.pillarSym('greytube', 5, 3, 3);                      // specimen tank
    return M.finishDelta();
};

/* ANTARCTICA — pack ice: a corner of open sea sunk into the bed, iceberg
   blocks, a floe ledge. */
_MF_DELTA_BUILDERS.prebuilt_antarctica = function () {
    const M = _mfDeltaNew({ name: 'Antarctica', base: 'marble_light', seed: 8206,
        tints: { marble_light: '#e4f2fc', igloo: '#dcecf8', ice_1: '#bfe0ff', water: '#3a78b8' },
        desc: 'pack ice — open sea in one corner, iceberg blocks and a floe ledge' });
    M.lake(0, 0, 'water', 2); M.lake(1, 0, 'water', 2); M.lake(0, 1, 'water', 2);
    M.block(2, 2, 'igloo'); M.block(6, 3, 'igloo');        // icebergs
    M.step(0, 2, 'ice_1'); M.step(0, 3, 'ice_1');          // floe ledge
    M.symAll();
    return M.finishDelta();
};

/* SKINWALKER RANCH — dry pasture, a ranch fence, hay bales, the mesa
   corner, dead trees. */
_MF_DELTA_BUILDERS.prebuilt_skinwalker = function () {
    const M = _mfDeltaNew({ name: 'Skinwalker Ranch', base: 'grass_2', seed: 8207,
        tints: { grass_2: '#b8b878', dirt: '#b89468', wood: '#a88860', rocks_1: '#b09878' },
        desc: 'the pasture — a ranch fence, hay bales, a mesa corner and dead trees' });
    M.rect(3, 1, 4, 2, 'dirt');                            // ranch road
    M.wrun(5, 3, 7, 3, 'N', { h: 2, tex: 'wood_planks', see: true });   // ranch fence
    M.block(1, 2, 'wood'); M.block(6, 2, 'wood');          // hay bales
    M.step(0, 2, 'rocks_1'); M.step(0, 3, 'rocks_1');      // mesa
    M.treeL(7, 0, 'tree_5'); M.treeL(2, 3, 'tree_6');
    M.symAll();
    return M.finishDelta();
};

/* HOLLOW EARTH — cave floor under the inner sun: stalagmite walls, glowing
   mushrooms, a crystal ledge, a lit pool. */
_MF_DELTA_BUILDERS.prebuilt_hollow_earth = function () {
    const M = _mfDeltaNew({ name: 'Hollow Earth', base: 'cave_floor', seed: 8208,
        tints: { cave_floor: '#8a7a9c', cave_wall: '#6a5a7c', crystal: '#9affe4', water: '#5ae0d0' },
        desc: 'the inner-earth floor — stalagmite walls, glowing mushrooms, a crystal ledge, a lit pool' });
    M.block(0, 1, 'cave_wall'); M.block(1, 2, 'cave_wall');
    M.step(2, 2, 'crystal');
    M.lake(7, 2, 'water', 2);
    M.symAll();
    M.pillarSym('mushroom', 5, 2, 2); M.pillarSym('mushroom', 6, 3, 2);
    return M.finishDelta();
};

/* FAIRY FOREST — glowing woodland: trees, a giant mushroom, a toadstool
   platform, a spring. */
_MF_DELTA_BUILDERS.prebuilt_fairy_forest = function () {
    const M = _mfDeltaNew({ name: 'Fairy Forest', base: 'grass_2', seed: 8209,
        tints: { grass_2: '#9fd48a', water: '#7ae0ff' },
        desc: 'glowing woodland — trees, a giant mushroom, a toadstool platform and a spring' });
    M.treeL(0, 0, 'tree', 'leaves_2'); M.treeL(1, 1, 'tree_2', 'leaves_3');
    M.treeL(6, 2, 'tree_3', 'leaves_4'); M.treeL(5, 3, 'tree', 'leaves_5');
    M.lake(1, 3, 'water', 1);
    M.obj(0, 2, 'grass_tuft'); M.obj(7, 1, 'grass_tuft');
    M.symAll();
    M.pillarSym('mushroom', 2, 2, 2); M.pillarSym('mushroom2', 7, 2, 1);
    return M.finishDelta();
};

/* MOON — regolith: boulders, a crater with its rim, the black monolith. */
_MF_DELTA_BUILDERS.prebuilt_moon = function () {
    const M = _mfDeltaNew({ name: 'Moon', base: 'moon', seed: 8210,
        tints: { moon: '#c8ccd8', moon_2: '#b0b4c4', moon_3: '#989cb0' },
        desc: 'the sparse regolith — boulders, a crater and its rim, the black monolith' });
    M.block(1, 2, 'moon_3'); M.block(6, 2, 'moon_3');      // boulders
    M.lake(0, 3, 'moon_2', 1);                             // crater
    M.step(0, 2, 'moon_2'); M.step(1, 3, 'moon_2');        // rim
    M.symAll();
    M.pillarSym('monolith', 5, 2, 3);
    return M.finishDelta();
};

/* Tier 3 ───────────────────────────────────────────────────────────────── */

/* TECHNOTICLAN — neon-Aztec: a glowing canal, ziggurat steps, a stone
   block, torches. */
_MF_DELTA_BUILDERS.prebuilt_technoticlan = function () {
    const M = _mfDeltaNew({ name: 'Technoticlan', base: 'cobblestone', seed: 8301,
        tints: { cobblestone: '#8fb0b8', bricks_3: '#7aa0a8', water: '#3fe0d8' },
        desc: 'the canal quarter — a glowing canal, ziggurat steps, a stone block, torches' });
    M.lake(0, 2, 'water', 2); M.lake(1, 2, 'water', 2); M.lake(0, 3, 'water', 2);
    M.step(5, 2, 'bricks_3'); M.step(6, 2, 'bricks_3'); M.step(5, 3, 'bricks_3');
    M.block(2, 2, 'bricks_3');
    M.obj(7, 1, 'torch', { leaf: 'floor' });
    M.symAll();
    return M.finishDelta();
};

/* AGARTHA — jade floor: cave-rock blocks, mushrooms, a crystal ledge, the
   glowing river along one edge. */
_MF_DELTA_BUILDERS.prebuilt_agartha = function () {
    const M = _mfDeltaNew({ name: 'Agartha', base: 'marble_light', seed: 8302,
        tints: { marble_light: '#bfe8c8', rocks_dark_fantasy: '#8a9a88', crystal: '#9affe4', water: '#4ae0c8' },
        desc: 'the jade terrace — cave-rock blocks, mushrooms, a crystal ledge, the glowing river' });
    M.block(0, 2, 'rocks_dark_fantasy'); M.block(6, 3, 'rocks_dark_fantasy');
    M.step(2, 3, 'crystal');
    M.lake(7, 1, 'water', 2); M.lake(7, 2, 'water', 2);
    M.symAll();
    M.pillarSym('mushroom', 1, 2, 2); M.pillarSym('mushroom2', 5, 2, 1);
    return M.finishDelta();
};

/* VATICAN CITY — the piazza: a colonnade, basilica steps, an obelisk, a
   fountain. */
_MF_DELTA_BUILDERS.prebuilt_vatican = function () {
    const M = _mfDeltaNew({ name: 'Vatican City', base: 'cobblestone', seed: 8303,
        tints: { cobblestone: '#c8beab', marble_light: '#f6f3ea', water: '#8ac8e8' },
        desc: 'the piazza — a colonnade, basilica steps, an obelisk and a fountain' });
    M.step(5, 2, 'marble_light'); M.step(6, 2, 'marble_light'); M.step(5, 3, 'marble_light');   // basilica steps
    M.lake(0, 3, 'water', 1);                              // fountain
    M.symAll();
    M.pillarSym('greekcol', 1, 2, 2); M.pillarSym('greekcol', 2, 2, 2);   // colonnade
    M.pillarSym('obelisk3d', 6, 1, 3);
    return M.finishDelta();
};

/* BOHEMIAN GROVE — redwoods around the clearing, a creek, a felled log,
   the owl altar stone, torches. */
_MF_DELTA_BUILDERS.prebuilt_bohemian_grove = function () {
    const M = _mfDeltaNew({ name: 'Bohemian Grove', base: 'grass_2', seed: 8304,
        tints: { grass_2: '#6a9458', dirt: '#8a7458', wood: '#7a5838', water: '#4a8098' },
        desc: 'the clearing — redwoods, a creek, a felled log and the owl altar stone' });
    M.rect(3, 1, 4, 2, 'dirt');                            // lantern trail
    M.treeL(0, 0, 'tree_3'); M.treeL(1, 2, 'tree_3'); M.treeL(6, 2, 'tree_2'); M.treeL(5, 3, 'tree_3');
    M.lake(7, 1, 'water', 1); M.lake(7, 2, 'water', 1); M.lake(6, 3, 'water', 1);   // the creek
    M.block(2, 2, 'wood');                                 // felled log
    M.obj(0, 3, 'torch', { leaf: 'floor' });
    M.symAll();
    M.pillarSym('monolith', 0, 2, 2);                      // the altar stone (jumpable)
    return M.finishDelta();
};

/* GÖBEKLI TEPE — the compact temple: a ring of waist-high wall with N/S
   gates, T-pillars, an excavation dip, the grass fringe. */
_MF_DELTA_BUILDERS.prebuilt_gobekli = function () {
    const M = _mfDeltaNew({ name: 'Göbekli Tepe', base: 'dirt_3', seed: 8305,
        tints: { rock_wall_1: '#d8c098', bricks_2: '#e0d0b0', dirt_3: '#c8a878', grass_2: '#a8b070', ruins: '#c0a888' },
        desc: 'the first temple — a waist-high ring wall with gates, T-pillar sentinels, an excavation dip' });
    M.box(0, 0, 7, 7, 'grass_2');                          // the tell's grass fringe
    [[1, 2], [2, 2], [5, 2], [6, 2], [1, 3], [6, 3]].forEach(p => M.step(p[0], p[1], 'rock_wall_1'));   // ring wall
    M.lake(0, 3, 'ruins', 1);                              // excavation trench
    M.symAll();
    M.pillarSym('tpillar', 5, 3, 3); M.pillarSym('tpillar', 0, 1, 3); M.pillarSym('tpillar', 7, 2, 3);
    return M.finishDelta();
};

/* D.U.M.B. — the tram rail, a walled holding cell in one corner with its
   specimen, server banks, a bulkhead block. */
_MF_DELTA_BUILDERS.prebuilt_dumb = function () {
    const M = _mfDeltaNew({ name: 'D.U.M.B.', base: 'tilefloor', seed: 8306,
        tints: { tilefloor: '#a87878', dungeon_2: '#9a6a6a', metal_2: '#b88484', road: '#8a6a6a' },
        desc: 'the base floor — the tram rail, a walled holding cell, server banks, a bulkhead' });
    M.rect(3, 1, 4, 2, 'road');                            // tram rail
    M.wall(2, 2, 'W', { h: 2, tex: 'dungeon_2' }); M.wall(2, 3, 'W', { h: 2, tex: 'dungeon_2' });   // cell wall
    M.wall(0, 4, 'N', { h: 2, tex: 'dungeon_2' }); M.wall(1, 4, 'N', { h: 2, tex: 'dungeon_2' });
    M.step(5, 2, 'metal_2'); M.step(6, 2, 'metal_2');      // server banks
    M.block(6, 3, 'dungeon_2');                            // bulkhead
    M.symAll();
    M.pillarSym('greytube', 0, 2, 3);                      // specimen 0 — inside the cell
    return M.finishDelta();
};

/* CERN — the beamline crossing, tunnel-wall arcs, terminal steps, a
   containment screen, a checkerboard dais. */
_MF_DELTA_BUILDERS.prebuilt_cern = function () {
    const M = _mfDeltaNew({ name: 'CERN', base: 'tilefloor_2', seed: 8307,
        tints: { tilefloor_2: '#9fb4c8', aluminium: '#cfd8e0', gold: '#c88a4a', metal_3: '#8aa0b8', checkerboard: '#7ae0ff' },
        desc: 'the collider hall — the copper beamline, tunnel-wall arcs, terminal steps, a checkerboard dais' });
    M.rect(3, 1, 4, 2, 'gold');                            // beamline
    M.block(1, 2, 'aluminium'); M.block(6, 2, 'aluminium'); // tunnel arcs
    M.step(2, 2, 'metal_3'); M.step(5, 2, 'metal_3');      // terminals
    M.wall(6, 3, 'N', { h: 2, tex: 'aluminium' });         // containment screen
    M.step(0, 3, 'checkerboard');
    M.symAll();
    return M.finishDelta();
};

/* BACKROOMS — level 0: wallpaper partitions, a pillar, the flooded
   corridor, something in the corner. */
_MF_DELTA_BUILDERS.prebuilt_backrooms = function () {
    const M = _mfDeltaNew({ name: 'Backrooms', base: 'carpet', seed: 8308,
        tints: { carpet: '#c8b878', wallpaper: '#e8d890', water: '#b8b060' },
        desc: 'level 0 — wallpaper partitions, a pillar, the flooded corridor, something in the corner' });
    M.wall(2, 2, 'W', { h: 2, tex: 'wallpaper' }); M.wall(2, 3, 'W', { h: 2, tex: 'wallpaper' });
    M.wrun(5, 3, 7, 3, 'N', { h: 2, tex: 'wallpaper' });
    M.block(0, 1, 'wallpaper'); M.block(7, 1, 'wallpaper');
    M.lake(0, 3, 'water', 1); M.lake(1, 3, 'water', 1);    // almond water
    M.symAll();
    M.pillarSym('monolith', 5, 2, 2);                      // it is here with you
    return M.finishDelta();
};

/* NORTH POLE — snowfield: present depots, pines, a frozen pond. */
_MF_DELTA_BUILDERS.prebuilt_northpole = function () {
    const M = _mfDeltaNew({ name: 'North Pole', base: 'marble_light', seed: 8309,
        tints: { marble_light: '#e8f4ff', wood_planks: '#a86848', water: '#c8e8ff' },
        desc: 'the snowfield — present depots, pines and a frozen pond' });
    M.block(1, 2, 'wood_planks'); M.block(6, 3, 'wood_planks');   // present depots
    M.treeL(0, 0, 'tree_2'); M.treeL(7, 2, 'tree_2'); M.treeL(5, 3, 'tree_2');
    M.lake(6, 1, 'water', 2); M.lake(7, 1, 'water', 2);    // frozen pond
    M.symAll();
    return M.finishDelta();
};

/* FLAT LANDS — the eerie plane: a faint circle, one dead tree, two
   shallow dips, two low mounds. Nothing else. You are being watched. */
_MF_DELTA_BUILDERS.prebuilt_flatlands = function () {
    const M = _mfDeltaNew({ name: 'Flat Lands', base: 'grass_2', seed: 8310,
        tints: { grass_2: '#c0c8b8', dirt_2: '#b0a890' },
        desc: 'the eerie plane — a faint circle, one dead tree, two shallow dips, two low mounds' });
    M.disc(3.5, 3.5, 1.7, 'dirt_2');                       // the circle you can barely see
    M.treeL(2, 2, 'tree_5');
    M.lake(5, 2, 'dirt_2', 1); M.lake(6, 2, 'dirt_2', 1);  // shallow dips
    M.step(0, 2, 'grass_2'); M.step(7, 1, 'grass_2');      // mounds
    M.symAll();
    return M.finishDelta();
};

/* ═══════════════════════ META — roster, biomes, skies ══════════════════════
   One row per launch map. Everything downstream is generated from this table:
   PREBUILT_MAPS + MAP_LAYOUT_PRESETS here; GAME_MODES / compatibleMaps in
   state.js; MS_MAP_LIST in map.js; ranked MAP_POOL in server.js mirrors it.
   env → state.mapEnv → the firmament dome (tint/stars/nebula/fog) + the
   horizon-scenery theme ring (see three-renderer _buildHorizonScenery).    */

const EW_MAP_META = [
    // ── Tier 1 — launch core ──
    { id: 'prebuilt_shasta', label: 'Mount Shasta', w: 20, h: 20, teamSize: 6, tier: 1, base: 'grass_2',
      biomes: ['forest', 'inner_earth'], deltaPad: 'grass_2',
      desc: '20×20 prebuilt, 6v6 — the sacred volcano: snow-crown vantage, switchback terraces, pine woods, twin cold lakes & the Lemurian gate',
      env: { tint: 0x9fc4e8, tintAmt: 0.30, stars: 0.5, nebula: 0.6, fog: { color: 0xbfd8ea, amount: 0.45, top: 0.05, band: 0.5 }, scenery: 'islands' } },
    { id: 'prebuilt_stonehenge', label: 'Stonehenge', w: 16, h: 16, teamSize: 6, tier: 1, base: 'grass_2',
      biomes: ['ancient', 'arthurian'], deltaPad: 'grass_2',
      desc: '16×16 prebuilt, 6v6 — the sarsen ring on crossing ley-lines: pillar cover, cardinal entrances, an armillary over the altar',
      env: { tint: 0x241b3e, tintAmt: 0.42, stars: 1.3, nebula: 0.9, fog: { color: 0x35284f, amount: 0.5, top: 0.06, band: 0.5 }, scenery: 'ruins' } },
    { id: 'prebuilt_giza', label: 'Pyramids of Giza', w: 20, h: 20, teamSize: 6, tier: 1, base: 'desert',
      biomes: ['desert', 'ancient'], deltaPad: 'dirt_2',
      desc: '20×20 prebuilt, 6v6 — three pyramids on the great diagonal, twin obelisks, processional avenues & excavation trenches',
      env: { tint: 0xd9b46a, tintAmt: 0.35, stars: 0.5, nebula: 0.4, fog: { color: 0xd8b370, amount: 0.55, top: 0.05, band: 0.45 }, scenery: 'pyramids' } },
    { id: 'prebuilt_nuketown', label: 'Nuketown', w: 14, h: 14, teamSize: 6, tier: 1, base: 'grass_2',
      biomes: ['urban', 'clandestine'], deltaPad: 'grass_2',
      desc: '14×14 prebuilt, 6v6 — atomic-test suburbia: two facing ranch houses, picket fences, hedges & an open street kill-zone',
      env: { tint: 0xdfd6a8, tintAmt: 0.30, stars: 0.4, nebula: 0.5, fog: { color: 0xcfc290, amount: 0.5, top: 0.06, band: 0.5 }, scenery: 'orbs', density: 0.5 } },
    { id: 'prebuilt_heaven', label: 'Heaven', w: 20, h: 20, teamSize: 6, tier: 1, base: 'cloud_2',
      biomes: ['divine'], deltaPad: 'cloud_2',
      desc: '20×20 prebuilt, 6v6 — cloud islands over the void: the gilded gates, light-pillar daises, healing pools & bottomless rifts',
      env: { tint: 0xfff3d0, tintAmt: 0.38, stars: 0.15, nebula: 0.35, fog: { color: 0xfdf2d8, amount: 0.55, top: 0.05, band: 0.5 }, scenery: 'divine' } },
    { id: 'prebuilt_hell', label: 'Hell', w: 20, h: 20, teamSize: 6, tier: 1, base: 'scorched',
      biomes: ['infernal'], deltaPad: 'scorched',
      desc: '20×20 prebuilt, 6v6 — the mirror of Heaven: a lava river, obsidian altar, basalt spike cover & the chained colossi',
      env: { tint: 0x3a0505, tintAmt: 0.50, stars: 0.25, nebula: 0.55, fog: { color: 0x5a0f08, amount: 0.65, top: 0.08, band: 0.6 }, scenery: 'infernal' } },
    { id: 'prebuilt_cyberpunk', label: 'Cyberpunk City', w: 24, h: 24, teamSize: 8, tier: 1, base: 'urban_wall', streetLamps: true,
      biomes: ['neon_city', 'urban'], deltaPad: 'urban_street',
      desc: '24×24 prebuilt, 8v8 — rain-slick neon grid: fast avenues, walkable rooftops, holo-plaza & alley chokes',
      env: { tint: 0x1a0f33, tintAmt: 0.50, stars: 0.7, nebula: 1.3, fog: { color: 0x8a2fd0, amount: 0.5, top: 0.10, band: 0.55 }, scenery: 'city' } },
    { id: 'prebuilt_camelot', label: 'Camelot', w: 16, h: 16, teamSize: 6, tier: 1, base: 'bricks_2',
      biomes: ['arthurian', 'gothic'], deltaPad: 'bricks_2',
      desc: '16×16 prebuilt, 6v6 — the castle walls: a moat-cut lowland climbing stair terraces into the walled keep, parapet walks & the twin ward braziers',
      env: { tint: 0x1c2030, tintAmt: 0.45, stars: 0.8, nebula: 0.7, fog: { color: 0x39415a, amount: 0.6, top: 0.07, band: 0.55 }, scenery: 'dark' } },
    { id: 'prebuilt_stadium', label: 'Football Stadium', w: 16, h: 28, teamSize: 8, tier: 1, base: 'grass_2', streetLamps: true,
      biomes: ['stadium', 'urban'], deltaPad: 'grass_2',
      desc: '16×28 prebuilt, 8v8 — the void bowl: chalk yard lines, team end zones, climbable bleacher tiers & goalpost gateways',
      env: { tint: 0x101822, tintAmt: 0.40, stars: 0.9, nebula: 0.6, fog: { color: 0x2a3448, amount: 0.4, top: 0.06, band: 0.5 }, scenery: 'city', density: 0.6 } },
    // ── Tier 2 — roster & lore expansion ──
    { id: 'prebuilt_atlantis', label: 'Atlantis', w: 24, h: 24, teamSize: 8, tier: 2, base: 'water',
      biomes: ['deep_sea', 'ancient'], deltaPad: 'marble_light',
      desc: '24×24 prebuilt, 8v8 — the half-sunken capital: deep-water moat, flooded streets, plaza islands & the crystal spire',
      env: { tint: 0x0e3a4a, tintAmt: 0.45, stars: 0.6, nebula: 0.8, fog: { color: 0x2a8a9a, amount: 0.6, top: 0.08, band: 0.55 }, scenery: 'ruins' } },
    { id: 'prebuilt_babel', label: 'Tower of Babel', w: 16, h: 24, teamSize: 6, tier: 2, base: 'bricks_1',
      biomes: ['ancient', 'desert'], deltaPad: 'bricks_1',
      desc: '16×24 prebuilt, 6v6 — the unfinished tower: a grand climbable ziggurat, brick streets, scaffolds & the rubble of scattered tongues',
      env: { tint: 0x8a6a3a, tintAmt: 0.40, stars: 0.55, nebula: 0.6, fog: { color: 0xa8854e, amount: 0.55, top: 0.06, band: 0.5 }, scenery: 'pyramids' } },
    { id: 'prebuilt_olympus', label: 'Mount Olympus', w: 24, h: 24, teamSize: 8, tier: 2, base: 'cloud_2',
      biomes: ['divine', 'ancient'], deltaPad: 'marble_light',
      desc: '24×24 prebuilt, 8v8 — the marble acropolis over the cloud sea: temple terraces, stair ascents, storm lanes & void rifts',
      env: { tint: 0xcfe0f8, tintAmt: 0.35, stars: 0.3, nebula: 0.5, fog: { color: 0xe8ecf8, amount: 0.6, top: 0.02, band: 0.4 }, scenery: 'divine' } },
    { id: 'prebuilt_mars', label: 'Mars', w: 20, h: 20, teamSize: 6, tier: 2, base: 'moon_2',
      biomes: ['space', 'desert'], deltaPad: 'moon_2',
      desc: '20×20 prebuilt, 6v6 — red regolith: mesa cover, twin dead rovers & crater dust bowls',
      env: { tint: 0x8a3a1a, tintAmt: 0.45, stars: 0.8, nebula: 0.4, fog: { color: 0xc88a5a, amount: 0.6, top: 0.07, band: 0.55 }, scenery: 'space' } },
    { id: 'prebuilt_area51', label: 'Area 51', w: 20, h: 20, teamSize: 6, tier: 2, base: 'wasteland',
      biomes: ['clandestine', 'space', 'desert'], deltaPad: 'dirt_4',
      desc: '20×20 prebuilt, 6v6 — the fenced base: airstrip, floodlight towers, twin hangars & the tarped saucer on its test rig',
      env: { tint: 0x0d1226, tintAmt: 0.50, stars: 1.5, nebula: 0.8, fog: { color: 0x1a2340, amount: 0.5, top: 0.06, band: 0.5 }, scenery: 'orbs' } },
    { id: 'prebuilt_antarctica', label: 'Antarctica', w: 24, h: 24, teamSize: 8, tier: 2, base: 'marble_light',
      biomes: ['polar', 'deep_sea'], deltaPad: 'marble_light', deltaY: 7,
      desc: '24×24 prebuilt, 8v8 — the ice wall and what waits behind it: seawater channels, iceberg hops, slide-gap chokes & a frozen colossus',
      env: { tint: 0xdae8f2, tintAmt: 0.40, stars: 0.5, nebula: 0.9, fog: { color: 0xe6f0f8, amount: 0.7, top: 0.04, band: 0.5 }, scenery: 'islands' } },
    { id: 'prebuilt_skinwalker', label: 'Skinwalker Ranch', w: 20, h: 20, teamSize: 6, tier: 2, base: 'grass_rocky',
      biomes: ['ranch', 'clandestine'], deltaPad: 'grass_rocky',
      desc: '20×20 prebuilt, 6v6 — the ranch: barn & corral, twin observation mesas, the mutilation site & a crop-circle anomaly',
      env: { tint: 0x2a1638, tintAmt: 0.50, stars: 1.2, nebula: 1.1, fog: { color: 0x453058, amount: 0.5, top: 0.06, band: 0.5 }, scenery: 'eyes' } },
    { id: 'prebuilt_hollow_earth', label: 'Hollow Earth', w: 20, h: 20, teamSize: 6, tier: 2, base: 'grass_2',
      biomes: ['inner_earth', 'forest'], deltaPad: 'cave_floor',
      desc: '20×20 prebuilt, 6v6 — the world above and its petrified mirror below, joined by two great gates under a darkness veil',
      env: { tint: 0x1c1428, tintAmt: 0.45, stars: 0.9, nebula: 1.0, fog: { color: 0x2a2038, amount: 0.55, top: 0.08, band: 0.55 }, scenery: 'crystals' } },
    { id: 'prebuilt_fairy_forest', label: 'Fairy Forest', w: 20, h: 20, teamSize: 6, tier: 2, base: 'grass_2',
      biomes: ['forest', 'astral'], deltaPad: 'grass_2',
      desc: '20×20 prebuilt, 6v6 — glowing woodland: mushroom-ring hedges that eat arrows, winding fae paths, springs & crystal toadstools',
      env: { tint: 0x0e2a1a, tintAmt: 0.50, stars: 1.1, nebula: 1.2, fog: { color: 0x1e4a30, amount: 0.55, top: 0.07, band: 0.55 }, scenery: 'crystals' } },
    { id: 'prebuilt_moon', label: 'Moon', w: 16, h: 16, teamSize: 6, tier: 2, base: 'moon',
      biomes: ['space'], deltaPad: 'moon',
      desc: '16×16 prebuilt, 6v6 — the sparse low-grav arena: crater bowls, regolith ridges, two landing sites & one black monolith',
      env: { tint: 0x05060d, tintAmt: 0.55, stars: 1.8, nebula: 0.25, fog: { color: 0x0a0c14, amount: 0.15, top: 0.02, band: 0.3 }, scenery: 'space', density: 0.5 } },
    // ── Tier 3 — flavor & deep cuts ──
    { id: 'prebuilt_technoticlan', label: 'Technoticlan', w: 24, h: 24, teamSize: 8, tier: 3, base: 'cobblestone',
      biomes: ['ancient', 'neon_city'], deltaPad: 'cobblestone',
      desc: '24×24 prebuilt, 8v8 — neon-Aztec canal city: glowing waterways, stone causeways, storming-ziggurats & the tech-altar',
      env: { tint: 0x0d1f2a, tintAmt: 0.50, stars: 0.9, nebula: 1.4, fog: { color: 0x0fdccf, amount: 0.45, top: 0.08, band: 0.5 }, scenery: 'pyramids' } },
    { id: 'prebuilt_agartha', label: 'Agartha', w: 24, h: 24, teamSize: 8, tier: 3, base: 'cave_floor',
      biomes: ['inner_earth', 'ancient'], deltaPad: 'marble_light',
      desc: '24×24 prebuilt, 8v8 — the inner-earth capital: jade terraces under the sun-shaft, crystal spires, glowing rivers & mushroom groves',
      env: { tint: 0x2a1f0d, tintAmt: 0.40, stars: 0.3, nebula: 0.9, fog: { color: 0x8a6f3a, amount: 0.5, top: 0.08, band: 0.55 }, scenery: 'crystals' } },
    { id: 'prebuilt_vatican', label: 'Vatican City', w: 20, h: 20, teamSize: 6, tier: 3, base: 'cobblestone',
      biomes: ['holy_city', 'gothic', 'divine'], deltaPad: 'marble_light',
      desc: '20×20 prebuilt, 6v6 — the colonnade piazza: central obelisk, twin basilica steps, fountains & consecrated ground',
      env: { tint: 0xd8c090, tintAmt: 0.35, stars: 0.4, nebula: 0.5, fog: { color: 0xd8c8a0, amount: 0.5, top: 0.05, band: 0.5 }, scenery: 'divine' } },
    { id: 'prebuilt_bohemian_grove', label: 'Bohemian Grove', w: 20, h: 20, teamSize: 6, tier: 3, base: 'grass_2',
      biomes: ['forest', 'clandestine'], deltaPad: 'dirt',
      desc: '20×20 prebuilt, 6v6 — old-growth redwoods around the ritual clearing: the Owl, the altar fire, lantern trails & the creek',
      env: { tint: 0x0d1810, tintAmt: 0.55, stars: 0.8, nebula: 0.7, fog: { color: 0x16281a, amount: 0.65, top: 0.09, band: 0.6 }, scenery: 'eyes', density: 0.6 } },
    { id: 'prebuilt_gobekli', label: 'Göbekli Tepe', w: 16, h: 16, teamSize: 6, tier: 3, base: 'dirt_3',
      biomes: ['ancient', 'desert'], deltaPad: 'dirt_3',
      desc: '16×16 prebuilt, 6v6 — the first temple: concentric ring walls, T-pillar sentinels, excavation trenches & the twin great pillars',
      env: { tint: 0xc89058, tintAmt: 0.38, stars: 0.7, nebula: 0.5, fog: { color: 0xb08858, amount: 0.5, top: 0.05, band: 0.5 }, scenery: 'ruins' } },
    { id: 'prebuilt_dumb', label: 'D.U.M.B.', w: 16, h: 16, teamSize: 6, tier: 3, base: 'tilefloor',
      biomes: ['underground_base', 'clandestine'], deltaPad: 'tilefloor',
      desc: '16×16 prebuilt, 6v6 — deep underground military base: corridor grid, blast-door chokes, server-bank cover & red emergency light',
      env: { tint: 0x180a0a, tintAmt: 0.60, stars: 0.0, nebula: 0.15, fog: { color: 0x3a1010, amount: 0.7, top: 0.12, band: 0.7 }, scenery: 'none' } },
    { id: 'prebuilt_cern', label: 'CERN', w: 16, h: 16, teamSize: 6, tier: 3, base: 'tilefloor_2',
      biomes: ['underground_base', 'astral'], deltaPad: 'tilefloor_2',
      desc: '16×16 prebuilt, 6v6 — the collider ring: tunnel arcs, copper beamlines, control terminals & the crackling portal anomaly',
      env: { tint: 0x0a1018, tintAmt: 0.55, stars: 0.15, nebula: 0.5, fog: { color: 0x103048, amount: 0.6, top: 0.10, band: 0.6 }, scenery: 'none' } },
    { id: 'prebuilt_backrooms', label: 'Backrooms', w: 16, h: 16, teamSize: 6, tier: 3, base: 'carpet',
      biomes: ['astral'], deltaPad: 'carpet',
      desc: '16×16 prebuilt, 6v6 — level 0: yellow wallpaper maze, damp carpet, humming lights, false exits & one flooded corridor',
      env: { tint: 0xc8b25e, tintAmt: 0.80, stars: 0.0, nebula: 0.0, fog: { color: 0xd8c470, amount: 0.75, top: 0.15, band: 0.8 }, scenery: 'none' } },
    { id: 'prebuilt_northpole', label: 'North Pole', w: 16, h: 16, teamSize: 6, tier: 3, base: 'marble_light',
      biomes: ['polar'], deltaPad: 'marble_light',
      desc: '16×16 prebuilt, 6v6 — the workshop compound: present depots, pine wind-breaks, aurora beacons & a frozen slide-pond objective',
      env: { tint: 0x0d1424, tintAmt: 0.50, stars: 1.4, nebula: 1.6, fog: { color: 0x1c2c48, amount: 0.5, top: 0.05, band: 0.5 }, scenery: 'islands', density: 0.6 } },
    { id: 'prebuilt_flatlands', label: 'Flat Lands', w: 16, h: 16, teamSize: 6, tier: 3, base: 'grass_2',
      biomes: ['astral'], deltaPad: 'grass_2',
      desc: '16×16 prebuilt, 6v6 — the eerie empty plane: two shallow dips, one dead tree, a circle you can barely see. You are being watched',
      env: { tint: 0xc0c8b8, tintAmt: 0.60, stars: 0.05, nebula: 0.1, fog: { color: 0xd0d8c8, amount: 0.8, top: 0.20, band: 0.9 }, scenery: 'eyes', density: 0.35 } },
];

/* Build + register everything: full maps and their Δ variants. */
(function _mfRegisterAll() {
    const deltas = [];
    EW_MAP_META.forEach(meta => {
        let full;
        try { full = _MF_BUILDERS[meta.id]().finish(); }
        catch (e) { console.error('[MapForge] builder failed: ' + meta.id, e); return; }
        PREBUILT_MAPS[meta.id] = full;
        MAP_LAYOUT_PRESETS[meta.id] = {
            sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: meta.h - 1, label: 'Earth', baseTerrain: meta.base }, buffer2: null, below: null },
            barrierRows: [], barrierOpeningsX: [], hasFloors: false,
            env: meta.env || null, streetLamps: !!meta.streetLamps,
        };
        /* the Δ variant (2026-09-01 redesign): ONE hand-authored 8×8 board per
           launch map (DELTA FORGE above), played as-is in every mode — Arena
           included, since each carries its own centre nexus zone. The old
           hidden 12×12 "_delta_arena" crop is gone. A map without a delta
           builder falls back to the legacy 8×8 crop of its core. */
        try {
            const S = MF_DELTA_S;
            const did = meta.id + '_delta';
            const d = _MF_DELTA_BUILDERS[meta.id] ? _MF_DELTA_BUILDERS[meta.id]() : _mfDelta(full, meta, S);
            d.name = meta.label + ' Δ';
            PREBUILT_MAPS[did] = d;
            MAP_LAYOUT_PRESETS[did] = {
                sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: S - 1, label: 'Earth', baseTerrain: d.base || meta.base }, buffer2: null, below: null },
                barrierRows: [], barrierOpeningsX: [], hasFloors: false,
                env: meta.env || null, streetLamps: !!meta.streetLamps,
            };
            deltas.push({
                id: did, label: meta.label + ' Δ', w: S, h: S, teamSize: 4, tier: meta.tier,
                biomes: meta.biomes, isDelta: true, base: d.base || meta.base, env: meta.env,
                desc: S + '×' + S + ' Δ, 4v4 — ' + (d.deltaDesc || 'the flat mirror-balanced arena cut of ' + meta.label),
            });
        } catch (e) { console.error('[MapForge] delta failed: ' + meta.id, e); }
    });
    deltas.forEach(d => EW_MAP_META.push(d));
    if (typeof window !== 'undefined') window.EW_MAP_META = EW_MAP_META;
})();

/* ═══════════════════════ MYSTERY DUNGEON — DATA LAYER ══════════════════════
   PMD-style dungeon crawl. This block owns:
     • MD_DUNGEONS — the dungeon registry (theme = an existing map's aesthetic)
     • _mdBuildHub() — the 8×8 Guild Hub map (registered once at load)
     • generateMdFloor() — the procedural maze-floor generator; each floor is
       emitted as a normal PREBUILT_MAPS-shaped entry and re-registered under
       the fixed id 'md_floor', so the whole board / renderer / pathfinding
       stack treats it like any other prebuilt map.
   Runtime (stairs, floor advance, hub NPCs, run state) lives in battle.js;
   the 'dungeon' ruleset lives in state.js MULTIPLAYER_MODES; the menu entry
   is window._goToMysteryDungeon (map.js / index.html).
   Layout language: floors sit at column height 3 (the MapForge surface
   baseline); walls are height-6 columns — a +3 step blocks ground movement
   (MAX_CLIMB is 1) AND blocks line-of-sight via the 3D voxel ray, so mazes
   need no special-case rules anywhere in the engine.                       */

const MD_HUB_ID = 'md_hub';
const MD_FLOOR_ID = 'md_floor';

const MD_DUNGEONS = {
    agartha_depths: {
        id: 'agartha_depths',
        label: 'Agartha Depths',
        desc: 'Descend 10 floors into the inner-earth capital. Find the stairs on every floor; the fallen do not return until the run ends.',
        floors: 10,
        baseMapId: 'prebuilt_agartha',      // aesthetic source (tints)
        floorTerrain: 'cave_floor',
        wallTerrain: 'cave_wall',
        /* ── Building-placer architecture (see generateMdFloor) ──
           bedrockTerrain = the sealed-off rock outside the structure;
           roomFloors/wallTex = the slab + facade palette a chamber picks from
           (one per room, so no two chambers look alike); hallTerrain /
           hallWallTex dress the 2-wide hallways between them. */
        bedrockTerrain: 'rocks_dark_fantasy',
        roomFloors: ['marble_light', 'dungeon', 'dungeon_2', 'cobblestone', 'bricks_1'],
        wallTex: ['bricks_2', 'rock_wall_1', 'dungeon_3', 'marble_light', 'bricks_3'],
        wallTexIn: 'bricks_1',
        hallTerrain: 'cobblestone_2',
        hallWallTex: 'rock_wall_1',
        accentTerrains: ['dirt_3', 'rocks_1', 'marble_light'],
        poolTerrain: 'water',
        enemyRaces: ['reptilian', 'antperson', 'skeleton', 'goatman', 'annunaki', 'demon'],
        bossRace: 'annunaki',
        /* same family as prebuilt_agartha's env, darkened for the depths */
        env: { tint: 0x241a0b, tintAmt: 0.50, stars: 0.15, nebula: 0.8, fog: { color: 0x5e4a28, amount: 0.65, top: 0.10, band: 0.6 }, scenery: 'crystals', density: 0.45 },
    },
};

/* The 8×8 Guild Hub: a cozy plaza where the roster hangs out between runs.
   No enemies ever spawn here; the cave entrance on the east edge starts a
   dungeon run when a party unit steps onto it. */
function _mdBuildHub() {
    const M = _mfNew({ name: 'Guild Hub', w: 8, h: 8, base: 'grass_2', baseH: 3, seed: 4242, underTop: 'dirt', strata: ['lava', 'dirt', 'cave_floor'] });
    /* paths: an avenue running to the cave gate, a cross path north-south */
    M.rect(1, 3, 7, 4, 'road', 3);
    M.rect(3, 1, 4, 6, 'cobblestone', 3);
    /* the spring plaza at the center — free healing while you idle */
    M.t(3, 3, 'healing_spring'); M.t(4, 4, 'healing_spring');
    /* greenery + lighting */
    M.tree(1, 1); M.tree(6, 1, 'tree_3'); M.tree(1, 6, 'tree_4'); M.tree(6, 6, 'tree_2');
    M.obj(2, 2, 'torch'); M.obj(5, 2, 'torch'); M.obj(2, 5, 'torch'); M.obj(5, 5, 'torch');
    M.rock(5, 3);
    /* the dungeon gate: both east-edge tiles trigger the run. Plain dark
       stone underfoot (the 'cave_entrance' TERRAIN carries sprite art — not
       wanted); the visual is the game's own 'geode' monument: an open rock
       shell full of glowing crystals, the mouth of the Agartha crystal cave.
       'geode' has no _MON_COLLISION profile, so the tiles stay walkable. */
    M.t(7, 3, 'cave_floor'); M.t(7, 4, 'cave_floor');
    M.mon('geode', 7, 3, 3, 3);
    M.spawns(
        [{ x: 2, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 2 }, { x: 3, y: 5 }],
        [{ x: 0, y: 7 }, { x: 1, y: 7 }, { x: 0, y: 6 }, { x: 1, y: 6 }]   // unused (no enemies in the hub)
    );
    const entry = M.finish();
    entry._mdEntrance = [{ x: 7, y: 3 }, { x: 7, y: 4 }];
    /* where roster NPCs loiter (skipping spawns/paths/gate) */
    entry._mdNpcSpots = [
        { x: 1, y: 2 }, { x: 5, y: 1 }, { x: 6, y: 2 }, { x: 1, y: 5 },
        { x: 5, y: 6 }, { x: 2, y: 6 }, { x: 6, y: 5 }, { x: 4, y: 1 },
    ];
    return entry;
}

/* ── The Clash stage ───────────────────────────────────────────────────────
   The fixed battlefield for Clash (classic JRPG battle, MULTIPLAYER_MODES.
   clash in state.js). "Temple" (authored in the map editor, 2026-07-26):
   a 10×10 raised octagonal temple plateau (height 2) ringed by T-pillar
   colonnades and braziers, with N/S stairs down to the outer walkway. The
   two facing formation columns of 4 (x=3 and x=6, y=3..6) stand on the
   plateau, two tiles apart, so spell cinematics have room to play.
   Registered by hand like the Guild Hub — it must NOT be in EW_MAP_META
   (no Δ variants, no standard map-picker card). */
(function _registerClashStage() {
    const W = 10, H = 10;
    /* tid 48 = outer walkway, 55 = plateau floor, 104 = inner sanctum,
       35 = stairs, 97 = plateau riser, 1 = grass base */
    const grid = [
        [48,48,48,48,48,48,48,48,48,48],
        [48,48,48,48,35,35,48,48,48,48],
        [48,48,55,55,55,55,55,55,48,48],
        [48,55,55,55,55,55,55,55,55,48],
        [48,55,55,104,104,104,104,55,55,48],
        [48,55,55,104,104,104,104,55,55,48],
        [48,55,55,55,55,55,55,55,55,48],
        [48,48,55,55,55,55,55,55,48,48],
        [48,48,48,48,35,35,48,48,48,48],
        [48,48,48,48,48,48,48,48,48,48],
    ];
    const heightMap = [
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,2,2,2,2,2,2,1,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,1,2,2,2,2,2,2,1,1],
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1],
    ];
    /* Voxel columns rebuilt from grid + heights: grass base at z0, plateau
       tiles get a stone riser (tid 97) under their floor; the four stair
       tiles carry their climb direction. */
    const _stairDirs = { '4,1': 'N', '5,1': 'N', '4,8': 'S', '5,8': 'S' };
    const voxels = [];
    for (let y = 0; y < H; y++) {
        const vRow = [];
        for (let x = 0; x < W; x++) {
            const col = [{ z: 0, tid: 1 }];
            if (heightMap[y][x] >= 2) {
                col.push({ z: 1, tid: 97 }, { z: 2, tid: grid[y][x] });
            } else {
                const b = { z: 1, tid: grid[y][x] };
                const sd = _stairDirs[x + ',' + y];
                if (sd) b.sd = sd;
                col.push(b);
            }
            vRow.push(col);
        }
        voxels.push(vRow);
    }
    const objects = Array.from({ length: H }, () => Array.from({ length: W }, () => []));
    const _obj = (x, y, oid, extra) => { objects[y][x] = [Object.assign({ oid, alignX: 'center', alignY: 'bottom', rot: 0, flipX: false, flipY: false }, extra || {})]; };
    _obj(3, 1, 52, { leaf: 'floor' });
    _obj(4, 1, 47);
    _obj(5, 1, 47);
    _obj(6, 1, 52, { leaf: 'floor' });
    _obj(1, 2, 1, { leaf: 'leaves' });
    _obj(8, 2, 1, { leaf: 'leaves' });
    _obj(1, 7, 1, { leaf: 'leaves' });
    _obj(6, 7, 52, { leaf: 'floor' });
    _obj(8, 7, 1, { leaf: 'leaves' });
    _obj(4, 8, 47, { rot: 135 });
    _obj(5, 8, 47, { rot: 135 });
    PREBUILT_MAPS.clash_stage = {
        name: 'Temple', w: W, h: H,
        grid,
        heightMap,
        objects,
        voxels,
        monuments: [
            { kind: 'tpillar', x: 2, y: 7, rot: 0, foot: 1, maxH: 3, seed: 26020 },
            { kind: 'tpillar', x: 3, y: 7, rot: 0, foot: 1, maxH: 3, seed: 82927 },
            { kind: 'tpillar', x: 7, y: 7, rot: 0, foot: 1, maxH: 3, seed: 40083 },
            { kind: 'tpillar', x: 6, y: 7, rot: 180, foot: 1, maxH: 3, seed: 83192 },
            { kind: 'tpillar', x: 2, y: 2, rot: 0, foot: 1, maxH: 3, seed: 84389 },
            { kind: 'tpillar', x: 3, y: 2, rot: 0, foot: 1, maxH: 3, seed: 77226 },
            { kind: 'tpillar', x: 7, y: 2, rot: 0, foot: 1, maxH: 3, seed: 28950 },
            { kind: 'tpillar', x: 6, y: 2, rot: 0, foot: 1, maxH: 3, seed: 24209 },
            { kind: 'tpillar', x: 1, y: 6, rot: 90, foot: 1, maxH: 3, seed: 25704 },
            { kind: 'tpillar', x: 1, y: 5, rot: 270, foot: 1, maxH: 3, seed: 40967 },
            { kind: 'tpillar', x: 1, y: 4, rot: 90, foot: 1, maxH: 3, seed: 12546 },
            { kind: 'tpillar', x: 1, y: 3, rot: 90, foot: 1, maxH: 3, seed: 99393 },
            { kind: 'tpillar', x: 8, y: 3, rot: 90, foot: 1, maxH: 3, seed: 21686 },
            { kind: 'tpillar', x: 8, y: 4, rot: 270, foot: 1, maxH: 3, seed: 93653 },
            { kind: 'tpillar', x: 8, y: 5, rot: 90, foot: 1, maxH: 3, seed: 17300 },
            { kind: 'tpillar', x: 8, y: 6, rot: 270, foot: 1, maxH: 3, seed: 83443 },
            { kind: 'brazier', x: 3, y: 8, rot: 0, foot: 1, maxH: 2, seed: 82160 },
            { kind: 'brazier', x: 6, y: 8, rot: 0, foot: 1, maxH: 2, seed: 55447 },
        ],
        spawns: {
            1: [{ x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 }],
            2: [{ x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }],
        },
    };
    MAP_LAYOUT_PRESETS.clash_stage = {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: H - 1, label: 'Earth', baseTerrain: 'grass_2' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false,
        env: { tint: 0x2a1f4a, tintAmt: 0.35, stars: 1.1, nebula: 0.8, fog: { color: 0x3a2f5a, amount: 0.4, top: 0.05, band: 0.5 }, scenery: 'crystals' },
        streetLamps: false,
    };
})();

(function _mdRegisterHub() {
    try {
        const hub = _mdBuildHub();
        PREBUILT_MAPS[MD_HUB_ID] = hub;
        MAP_LAYOUT_PRESETS[MD_HUB_ID] = {
            sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'grass_2' }, buffer2: null, below: null },
            barrierRows: [], barrierOpeningsX: [], hasFloors: false,
            env: { tint: 0x14201a, tintAmt: 0.35, stars: 0.8, nebula: 0.5, fog: { color: 0x2a3c30, amount: 0.35, top: 0.05, band: 0.5 }, scenery: 'islands', density: 0.5 },
            streetLamps: false,
        };
    } catch (e) { console.error('[MD] hub build failed', e); }
})();

/* ── The floor generator ───────────────────────────────────────────────────
   BUILT, not carved (2026-07-25). Floors used to be a solid block of
   height-6 voxel cubes with rooms and 1-wide corridors chiselled out of it —
   cheap, but it read as a block of rock, and every room was a cube pit.
   A floor is now ARCHITECTURE, assembled the way the map editor's one-click
   building placer assembles a building:
     · the ground stays flat at the MapForge baseline (no cube walls at all);
     · chambers are ROOMS of varying size, each with its own floor slab and
       its own facade of THIN edge walls (M.wall → state.edgeWalls, the exact
       records the editor's placer writes);
     · rooms are linked by HALLS a full 2 tiles wide, so a party never has to
       file through a 1-tile pipe and two units can pass each other;
     · every wall is derived from the interior mask — masonry stands on every
       edge where the built floor meets bedrock — so the structure is
       watertight by construction, and where a hall meets a room there is
       simply no wall: that gap IS the 2-wide doorway.
   Outside the shell is untouched bedrock: walkable in principle, sealed off
   in practice, and it is what the dungeon reads as "solid rock" now.
   Jumping and flying over the masonry is refused in dungeon mode — see
   _ewAbsolute in map.js — so these thin walls are as final as the old cubes.
   Deterministic per (dungeon, seed, floor). partySize controls how many
   team-1 spawn tiles are emitted.                                         */
function generateMdFloor(dungeonId, floor, seed, partySize) {
    const D = MD_DUNGEONS[dungeonId] || MD_DUNGEONS.agartha_depths;
    partySize = Math.max(1, partySize || 4);
    const isBossFloor = floor >= D.floors;
    /* Room-and-hall architecture needs more board than the old carved maze:
       a 2-wide hall between two rooms costs real tiles. */
    const W = Math.min(16 + floor, 23);
    const H = Math.min(12 + Math.floor(floor * 0.7), 18);
    const FLOOR_Z = 3;                 // the MapForge surface baseline
    const HALL_W = 2;                  // hallway width, in tiles
    const ROOM_GAP = HALL_W;           // bedrock between two rooms = a hall's width
    const M = _mfNew({
        name: D.label + ' — F' + floor, w: W, h: H,
        base: D.bedrockTerrain || D.wallTerrain, baseH: FLOOR_Z,
        seed: (((seed | 0) || 1) * 31 + floor * 7919) | 0,
        underTop: 'dirt', strata: ['lava', 'cave_floor', 'cave_floor'],
    });
    const rng = M.rng;
    const ri = n => Math.floor(rng() * n);
    const pick = a => a[ri(a.length)];

    const ROOM_FLOORS = D.roomFloors || ['marble_light', 'dungeon', 'cobblestone'];
    const WALL_TEX = D.wallTex || ['bricks_2'];
    const HALL_TER = D.hallTerrain || 'cobblestone_2';
    const HALL_WALL = D.hallWallTex || 'rock_wall_1';

    /* The interior mask — 0 bedrock, 1 hall, 2 room. Everything downstream
       (walls, spawns, loot, the AI's room homes) reads it. A 1-tile bedrock
       rim is reserved all round so no facade ever stands on the board edge
       (a wall there would have no outside face to render against). */
    const OUT = 0, HALL = 1, ROOM = 2;
    const cell = [];
    for (let y = 0; y < H; y++) cell.push(new Array(W).fill(OUT));
    const inShell = (x, y) => x >= 1 && y >= 1 && x <= W - 2 && y <= H - 2;
    const isFloorTile = (x, y) => M.in(x, y) && cell[y][x] !== OUT;

    /* 1) rooms — placed like building footprints: assorted sizes, never
       touching, always at least ROOM_GAP tiles of rock apart, which is exactly
       the width a hall needs to run between them. */
    const rooms = [];
    const roomOf = [];
    for (let y = 0; y < H; y++) roomOf.push(new Array(W).fill(null));
    const addRoom = (rx, ry, rw, rh) => {
        const r = {
            x0: rx, y0: ry, x1: rx + rw - 1, y1: ry + rh - 1,
            cx: rx + (rw >> 1), cy: ry + (rh >> 1),
            floorTex: pick(ROOM_FLOORS), wallTex: pick(WALL_TEX),
            wallH: 3 + (rng() < 0.35 ? 1 : 0),
        };
        for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
            cell[y][x] = ROOM; roomOf[y][x] = r;
        }
        rooms.push(r);
        return r;
    };
    const fits = (rx, ry, rw, rh) => {
        if (rx < 1 || ry < 1 || rx + rw > W - 1 || ry + rh > H - 1) return false;
        for (const r of rooms) {
            if (rx <= r.x1 + ROOM_GAP && rx + rw - 1 >= r.x0 - ROOM_GAP
                && ry <= r.y1 + ROOM_GAP && ry + rh - 1 >= r.y0 - ROOM_GAP) return false;
        }
        return true;
    };
    const MIN_R = 3;                   // smallest chamber (tiles)
    if (isBossFloor) {
        /* The throne hall: one big chamber dead centre, with antechambers
           tucked into the corners the hall leaves free. */
        const bw2 = Math.max(6, Math.min(9, W - 8)), bh2 = Math.max(5, Math.min(7, H - 8));
        addRoom(Math.floor((W - bw2) / 2), Math.floor((H - bh2) / 2), bw2, bh2);
        const corners = [[1, 1], [W - 5, 1], [1, H - 5], [W - 5, H - 5]];
        for (let i = corners.length - 1; i > 0; i--) { const j = ri(i + 1); [corners[i], corners[j]] = [corners[j], corners[i]]; }
        for (const [cx0, cy0] of corners) {
            if (rooms.length >= 3) break;
            /* narrower fallbacks: on a tight board the hall's gutter leaves a
               corner too shallow for a 4×4, and an antechamber-less boss floor
               is a bare arena */
            for (const [aw, ah] of [[4, 4], [3, 4], [4, 3], [3, 3]]) {
                if (!fits(cx0, cy0, aw, ah)) continue;
                addRoom(cx0, cy0, aw, ah);
                break;
            }
        }
    } else {
        /* Footprints are laid out on a coarse partition of the board rather
           than by rejection sampling: one chamber per grid cell, sized and
           offset at random INSIDE its cell, with a 2-tile bedrock gutter kept
           BETWEEN cells — that gutter is the room a hall needs to run in.
           Unlike blind sampling this never starves (blind sampling was landing
           2 rooms out of a target of 6). A cell may also annex the neighbour
           next door, which is where the big halls come from — chambers end up
           anywhere from 3×3 to ~10×7. */
        const gx = ((W - 2) >= 18) ? 3 : 2;
        const gy = ((H - 2) >= 15) ? 3 : 2;
        /* Cell boundaries (rounded, so the partition spans the WHOLE shell —
           a floor-divided grid left the far side of the board as dead rock). */
        const colAt = i => 1 + Math.round(i * (W - 2) / gx);
        const rowAt = j => 1 + Math.round(j * (H - 2) / gy);
        const used = [];
        for (let j = 0; j < gy; j++) used.push(new Array(gx).fill(false));
        const order = [];
        for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) order.push({ i, j });
        for (let i = order.length - 1; i > 0; i--) { const j = ri(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
        /* One cell short of the partition, so there is always something left
           to annex — a floor of nothing but identical cell-sized boxes is the
           failure mode here. */
        const targetRooms = Math.min(Math.max(3, order.length - 1),
            Math.max(4, Math.min(4 + Math.floor(floor / 3), 7)));
        let freeCells = order.length;
        for (const c of order) {
            if (rooms.length >= targetRooms) break;
            if (used[c.j][c.i]) continue;
            let i1 = c.i, j1 = c.j;
            /* Annex a neighbouring cell now and then → a genuinely big hall.
               Never at the cost of the room count: the cells left over must
               still cover the chambers this floor owes. */
            const canAnnex = (freeCells - 2) >= (targetRooms - rooms.length - 1);
            if (canAnnex && rng() < 0.35) {
                const opts = [];
                if (c.i + 1 < gx && !used[c.j][c.i + 1]) opts.push([1, 0]);
                if (c.j + 1 < gy && !used[c.j + 1][c.i]) opts.push([0, 1]);
                if (opts.length) { const d = pick(opts); i1 += d[0]; j1 += d[1]; }
            }
            for (let j = c.j; j <= j1; j++) for (let i = c.i; i <= i1; i++) { used[j][i] = true; freeCells--; }
            /* The gutter is only needed between cells: a footprint in the last
               column/row may run right up to the shell rim. */
            const bx0 = colAt(c.i), by0 = rowAt(c.j);
            const bx1 = colAt(i1 + 1) - 1 - (i1 === gx - 1 ? 0 : ROOM_GAP);
            const by1 = rowAt(j1 + 1) - 1 - (j1 === gy - 1 ? 0 : ROOM_GAP);
            const availW = bx1 - bx0 + 1, availH = by1 - by0 + 1;
            if (availW < MIN_R || availH < MIN_R) continue;
            const rw = MIN_R + ri(availW - MIN_R + 1);
            const rh = MIN_R + ri(availH - MIN_R + 1);
            const rx = bx0 + ri(availW - rw + 1);
            const ry = by0 + ri(availH - rh + 1);
            if (!fits(rx, ry, rw, rh)) continue;
            addRoom(rx, ry, rw, rh);
        }
    }
    /* degenerate safety: a board that starved placement still gets one hall */
    if (!rooms.length) addRoom(1, 1, Math.max(4, W - 2), Math.max(4, H - 2));

    /* 2) halls — 2 tiles wide, L-shaped, chaining the rooms in placement
       order (already random) plus one loop so the floor is not a pure tree.
       Each leg is drawn one tile PAST its end so the elbow where they meet
       stays a full 2×2 (an L of two 2-wide bands that only touched at a
       corner would pinch the hall to a diagonal), and the run starts INSIDE
       each room, which is what punches the 2-wide doorway through its
       facade. */
    const clampX = v => Math.max(1, Math.min(v, W - 1 - HALL_W));
    const clampY = v => Math.max(1, Math.min(v, H - 1 - HALL_W));
    const paint = (x, y) => { if (inShell(x, y) && cell[y][x] === OUT) cell[y][x] = HALL; };
    const digHall = (a, b) => {
        const ax = clampX(a.cx), ay = clampY(a.cy);
        const bx = clampX(b.cx), by = clampY(b.cy);
        const runX = (row, xa, xb) => {
            const lo = Math.min(xa, xb), hi = Math.max(xa, xb) + HALL_W - 1;
            for (let x = lo; x <= hi; x++) for (let d = 0; d < HALL_W; d++) paint(x, row + d);
        };
        const runY = (col, ya, yb) => {
            const lo = Math.min(ya, yb), hi = Math.max(ya, yb) + HALL_W - 1;
            for (let y = lo; y <= hi; y++) for (let d = 0; d < HALL_W; d++) paint(col + d, y);
        };
        if (rng() < 0.5) { runX(ay, ax, bx); runY(bx, ay, by); }
        else { runY(ax, ay, by); runX(by, ax, bx); }
    };
    for (let i = 0; i + 1 < rooms.length; i++) digHall(rooms[i], rooms[i + 1]);
    if (rooms.length > 3) digHall(rooms[0], rooms[rooms.length - 2]);

    /* 3) connectivity guarantee — flood the shell from room 0 and drive a
       fresh hall to anything the chain somehow missed. */
    {
        const seen = [];
        for (let y = 0; y < H; y++) seen.push(new Array(W).fill(false));
        const flood = () => {
            for (let y = 0; y < H; y++) seen[y].fill(false);
            const st = [{ x: rooms[0].cx, y: rooms[0].cy }];
            seen[rooms[0].cy][rooms[0].cx] = true;
            while (st.length) {
                const p = st.pop();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = p.x + dx, ny = p.y + dy;
                    if (!M.in(nx, ny) || seen[ny][nx] || cell[ny][nx] === OUT) continue;
                    seen[ny][nx] = true; st.push({ x: nx, y: ny });
                }
            }
        };
        flood();
        for (let i = 1; i < rooms.length; i++) {
            if (seen[rooms[i].cy][rooms[i].cx]) continue;
            digHall(rooms[0], rooms[i]);
            flood();
        }
    }

    /* 4) the slabs: every room lays its own floor, halls are paved, and the
       whole shell sits perfectly flat (a step inside a doorway would be a
       body-span trap for the wall openings). */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (cell[y][x] === OUT) continue;
        M.h(x, y, FLOOR_Z);
        M.t(x, y, cell[y][x] === ROOM ? roomOf[y][x].floorTex : HALL_TER);
    }

    /* 5) the facades — the building placer's own output: one thin wall record
       per edge where the built floor meets bedrock, standing on that tile's
       surface. Rooms get crenellated masonry (and their own texture), halls
       get plain rock. Interior↔interior edges get nothing at all, which is
       what leaves the 2-wide hall mouths open. */
    const SIDES = [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (cell[y][x] === OUT) continue;
        const own = roomOf[y][x];
        for (const [dir, dx, dy] of SIDES) {
            const nx = x + dx, ny = y + dy;
            if (M.in(nx, ny) && cell[ny][nx] !== OUT) continue;
            M.wall(x, y, dir, {
                z0: FLOOR_Z + 1,
                h: own ? own.wallH : 3,
                tex: own ? own.wallTex : HALL_WALL,
                texIn: D.wallTexIn || null,
                cap: own ? 'crenel' : null,
            });
        }
    }

    /* 6) theming: accent slabs, crystal veins, mushrooms and wall torches
       inside the chambers; loose rock out on the bedrock so the sealed-off
       ground outside the shell reads as living cave. Nothing that blocks a
       tile is ever placed in a hall or in a doorway mouth — a 2-wide hall
       with a boulder in it is a 1-wide hall. */
    const nextToHall = (x, y) => SIDES.some(([, dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return M.in(nx, ny) && cell[ny][nx] === HALL;
    });
    const touchesRock = (x, y) => SIDES.some(([, dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return !M.in(nx, ny) || cell[ny][nx] === OUT;
    });
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const c = cell[y][x];
        if (c === OUT) {
            /* Bedrock dressing — outside the shell, purely scenic. No crystal
               veins or springs out here: a recovery tile nobody can walk to is
               only a tease. */
            const rr = rng();
            if (rr < 0.10) M.t(x, y, pick(D.accentTerrains));
            else if (rr < 0.14) M.rock(x, y);
            continue;
        }
        if (c === HALL) continue;      /* halls stay clear (torches hang below) */
        const blockedSpot = nextToHall(x, y);
        const roll = rng();
        if (roll < 0.07) M.t(x, y, pick(D.accentTerrains));
        else if (roll < 0.10 && !blockedSpot) M.t(x, y, 'crystal');
        else if (roll < 0.12 && !blockedSpot) M.t(x, y, 'mushroom');
        /* columns keep the range the old random-torch branch shared with them:
           torches have moved onto the walls (step 6b), so the chamber floor is
           free for pillars */
        else if (roll < 0.19 && !blockedSpot && !touchesRock(x, y)) M.obj(x, y, 'column_1');
    }

    /* ── 6b) WALL TORCHES — evenly spaced sconces along every masonry run ──
       The dungeon is lit by fire, not by a random scattering: every stretch
       of facade (a contiguous run of tiles carrying a wall on the SAME side)
       gets a torch every TORCH_GAP tiles, hung Minecraft-style off that wall
       ({leaf:'wall', rot} → _buildTorch3D in three-renderer.js, which reads
       the edge wall's real height to seat the sconce at mid-face).
       Torches are `passable, cosmetic` objects — they never block a tile, so
       they can stand in halls and doorway mouths too. The renderer lights the
       nearest handful of them with real point lights (see the dungeon torch
       light pool) and leaves the rest as flame + halo.                     */
    {
        const TORCH_GAP = 3;             // tiles between sconces along a run
        const TORCH_MAX = 30;            // hard cap per floor (draw-call budget)
        const ROT_OF = { N: 0, E: 90, S: 180, W: 270 };
        /* Group every wall slot into runs: N/S runs travel along X on one row,
           W/E runs travel along Y on one column. */
        const runs = new Map();
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
            if (cell[y][x] === OUT) continue;
            for (const [dir, dx, dy] of SIDES) {
                const nx = x + dx, ny = y + dy;
                if (M.in(nx, ny) && cell[ny][nx] !== OUT) continue;   // interior↔interior: no wall
                const key = (dir === 'N' || dir === 'S') ? dir + ':r' + y : dir + ':c' + x;
                if (!runs.has(key)) runs.set(key, []);
                runs.get(key).push({ x, y, dir, along: (dir === 'N' || dir === 'S') ? x : y });
            }
        }
        const torchSpots = [];
        const runKeys = Array.from(runs.keys()).sort();
        for (const key of runKeys) {
            const slots = runs.get(key).sort((a, b) => a.along - b.along);
            /* split into CONTIGUOUS stretches so two separate walls on the same
               row don't share one spacing rhythm */
            let stretch = [];
            const flush = () => {
                if (!stretch.length) return;
                const off = ri(Math.min(TORCH_GAP, stretch.length));
                for (let i = off; i < stretch.length; i += TORCH_GAP) torchSpots.push(stretch[i]);
                stretch = [];
            };
            for (const s of slots) {
                if (stretch.length && s.along !== stretch[stretch.length - 1].along + 1) flush();
                stretch.push(s);
            }
            flush();
        }
        /* deterministic shuffle, then cap — an even spread rather than "all the
           torches sit in the first room the loop happened to walk" */
        for (let i = torchSpots.length - 1; i > 0; i--) { const j = ri(i + 1); [torchSpots[i], torchSpots[j]] = [torchSpots[j], torchSpots[i]]; }
        let lit = 0;
        for (const s of torchSpots) {
            if (lit >= TORCH_MAX) break;
            if (M.objs[s.y][s.x].length) continue;         // never stack on a prop
            M.obj(s.x, s.y, 'torch', { leaf: 'wall', rot: ROT_OF[s.dir] });
            lit++;
        }
    }
    if (!isBossFloor && rooms.length > 2 && rng() < 0.6) {
        const pr = rooms[1 + ri(rooms.length - 1)];
        if (pr.x1 - pr.x0 >= 3 && pr.y1 - pr.y0 >= 2) {
            M.t(pr.cx, pr.cy, D.poolTerrain); M.t(pr.cx + 1, pr.cy, D.poolTerrain);
        }
    }
    /* 5) spawn room (first placed) + stairs in the farthest room */
    const spawnRoom = rooms[0];
    let stairsRoom = rooms[0], bestD = -1;
    for (const r of rooms) {
        const d = Math.abs(r.cx - spawnRoom.cx) + Math.abs(r.cy - spawnRoom.cy);
        if (d > bestD) { bestD = d; stairsRoom = r; }
    }
    const roomTiles = (r, excl) => {
        const out = [];
        for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
            if (!isFloorTile(x, y)) continue;
            if (excl && excl.some(p => p.x === x && p.y === y)) continue;
            out.push({ x, y });
        }
        return out;
    };
    /* The exit is the engine's OWN 1×1×1 staircase (the same 3D stairs every
       map uses): a barrier_passage tile whose top voxel carries an explicit
       stairDir — see _isStairTile/_buildStairMesh in three-renderer. No new
       geometry, no object sprite. */
    /* Set against the chamber's back wall rather than dumped in the middle
       of the room: a flight of stairs leaning on masonry reads as a way OUT,
       and the sd stamp at the bottom of this function then has a real wall to
       face. Never on a doorway mouth (a hall tile next to it would swallow
       the flight). */
    const stairs = (() => {
        const cands = roomTiles(stairsRoom).filter(p =>
            touchesRock(p.x, p.y) && !nextToHall(p.x, p.y));
        return cands.length ? cands[ri(cands.length)] : { x: stairsRoom.cx, y: stairsRoom.cy };
    })();
    M.t(stairs.x, stairs.y, 'barrier_passage');
    M.h(stairs.x, stairs.y, FLOOR_Z);
    M.clearObj(stairs.x, stairs.y);

    const p1Tiles = roomTiles(spawnRoom, [stairs]);
    /* cluster the party around the spawn-room center */
    p1Tiles.sort((a, b) =>
        (Math.abs(a.x - spawnRoom.cx) + Math.abs(a.y - spawnRoom.cy)) -
        (Math.abs(b.x - spawnRoom.cx) + Math.abs(b.y - spawnRoom.cy)));
    const spawns1 = p1Tiles.slice(0, partySize);
    while (spawns1.length < partySize) spawns1.push(spawns1[0] || { x: spawnRoom.cx, y: spawnRoom.cy });
    /* Clear the pads only — the room's own floor slab stays (repainting them
       cave_floor punched a hole in the chamber's masonry look). */
    spawns1.forEach(p => M.clearObj(p.x, p.y));

    /* 6) enemies: distributed across the non-spawn rooms, densest far away.
       Count scales with the PLAYER party size (a solo delver meets far fewer
       foes than a full squad) and with depth. */
    /* Softer curve than the original (1 + floor/2 + partySize, cap 8): the
       roam/chase AI means every enemy eventually finds you, so raw counts
       were the main difficulty knob pushing runs to die around floor 4-5. */
    const enemyCount = isBossFloor
        ? Math.min(2 + partySize, 6)
        : Math.max(2, Math.min(1 + Math.floor(floor / 3) + Math.max(1, partySize - 1), 7));
    const enemyRooms = rooms.filter(r => r !== spawnRoom);
    const spawns2 = [];
    let guard = 0;
    while (spawns2.length < enemyCount && guard++ < 200) {
        const r = enemyRooms.length ? enemyRooms[ri(enemyRooms.length)] : stairsRoom;
        const cand = roomTiles(r, [stairs].concat(spawns1, spawns2));
        if (!cand.length) continue;
        spawns2.push(cand[ri(cand.length)]);
    }
    while (spawns2.length < enemyCount) spawns2.push({ x: stairsRoom.cx, y: stairsRoom.cy });
    spawns2.forEach(p => M.clearObj(p.x, p.y));
    M.spawns(spawns1, spawns2);

    /* 7) recovery niches — every floor guarantees ONE healing spring (HP,
       15%/turn) and ONE crystal vein (MP, 15%/turn) tucked into room corners,
       the PMD "oasis" beat: end a turn standing on them to recover. Placed
       LAST so the stairs / spawn stamps above can't overwrite them; corners
       that collide with those tiles are skipped. */
    const groundItems = [];
    {
        const reserved = [stairs].concat(spawns1, spawns2);
        const free = c => isFloorTile(c.x, c.y)
            && !reserved.some(p => p.x === c.x && p.y === c.y)
            && !nooks.some(p => p.x === c.x && p.y === c.y);
        const nooks = [];
        for (const r of rooms) {
            const corners = [
                { x: r.x0 + 1, y: r.y0 + 1 }, { x: r.x1 - 1, y: r.y0 + 1 },
                { x: r.x0 + 1, y: r.y1 - 1 }, { x: r.x1 - 1, y: r.y1 - 1 },
            ];
            for (const c of corners) if (free(c)) nooks.push(c);
        }
        /* cramped floor fallback: any free room tile qualifies as a niche */
        if (nooks.length < 2) {
            for (const r of rooms) {
                for (let y = r.y0; y <= r.y1 && nooks.length < 4; y++)
                    for (let x = r.x0; x <= r.x1 && nooks.length < 4; x++)
                        if (free({ x, y })) nooks.push({ x, y });
            }
        }
        for (let i = nooks.length - 1; i > 0; i--) { const j = ri(i + 1); [nooks[i], nooks[j]] = [nooks[j], nooks[i]]; }
        const spring = nooks.pop();
        if (spring) { M.t(spring.x, spring.y, 'healing_spring'); M.clearObj(spring.x, spring.y); }
        const vein = nooks.pop();
        if (vein) {
            M.t(vein.x, vein.y, 'crystal');
            M.clearObj(vein.x, vein.y);
            /* grow the vein one tile when the neighbour is free — reads better */
            const vx2 = vein.x + 1;
            if (isFloorTile(vx2, vein.y)
                && !reserved.some(p => p.x === vx2 && p.y === vein.y)
                && !(spring && spring.x === vx2 && spring.y === vein.y)) {
                M.t(vx2, vein.y, 'crystal');
                M.clearObj(vx2, vein.y);
            }
        }

        /* ── Loose item pickups (PMD floor loot) — scattered on plain room
           tiles, scooped up by walking onto/over them (battle.js
           _mdCollectItemsOnTile; drawn by three-renderer's mdItemPickups).
           Skips stairs/spawns/spring/vein tiles and the pool. */
        const itemSpots = [];
        for (const r of rooms) {
            for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
                const c = { x, y };
                if (!free(c)) continue;
                if (spring && spring.x === x && spring.y === y) continue;
                const tk = M.tk(x, y);
                if (tk === D.poolTerrain || tk === 'crystal' || tk === 'healing_spring' || tk === 'barrier_passage') continue;
                if (itemSpots.some(p => p.x === x && p.y === y)) continue;
                itemSpots.push(c);
            }
        }
        for (let i = itemSpots.length - 1; i > 0; i--) { const j = ri(i + 1); [itemSpots[i], itemSpots[j]] = [itemSpots[j], itemSpots[i]]; }
        const rollFloorItem = () => {
            const r = rng();
            if (r < 0.30) return 'healPotion';
            if (r < 0.50) return 'manaPotion';
            if (r < 0.62) return 'entropyGrenade';
            if (r < 0.72) return 'panacea';
            if (r < 0.80) return 'adrenalStim';
            const banes = ['unholyBane', 'alienBane', 'anomalyBane', 'humanBane'];
            return banes[ri(banes.length)];
        };
        const itemCount = Math.min(itemSpots.length, 3 + ri(2) + (partySize > 2 ? 1 : 0));
        for (let i = 0; i < itemCount; i++) {
            const spot = itemSpots[i];
            M.clearObj(spot.x, spot.y);
            groundItems.push({ x: spot.x, y: spot.y, type: rollFloorItem() });
        }
    }

    const entry = M.finish();
    /* stamp the staircase direction: it ascends toward a wall neighbour when
       one exists (reads as "leading out of the floor") */
    let sdHigh = 'N';
    if (!isFloorTile(stairs.x + 1, stairs.y)) sdHigh = 'E';
    else if (!isFloorTile(stairs.x - 1, stairs.y)) sdHigh = 'W';
    else if (!isFloorTile(stairs.x, stairs.y + 1)) sdHigh = 'S';
    else if (!isFloorTile(stairs.x, stairs.y - 1)) sdHigh = 'N';
    const _sdOpp = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const _stStack = entry.voxels[stairs.y] && entry.voxels[stairs.y][stairs.x];
    if (_stStack && _stStack.length) _stStack[_stStack.length - 1].sd = _sdOpp[sdHigh];
    entry._mdStairs = stairs;
    entry._mdFloor = floor;
    entry._mdDungeonId = D.id;
    /* room rectangles (roam/chase AI homes each enemy to its spawn room)
       and the floor's loose item pickups */
    entry._mdRooms = rooms.map(r => ({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }));
    entry._mdItems = groundItems;
    /* The interior mask, one string per row ('0' bedrock, '1' hall, '2' room)
       — the vector SCANNER minimap (three-renderer _drawMdScanner) traces the
       layout straight off this instead of guessing structure from terrain
       keys (room slabs and outside accents share terrains). */
    entry._mdCells = cell.map(row => row.join(''));
    /* enemy levels shadow the delver's run level (= current floor × the
       dungeon's optional levelPerFloor, applied in _mdLoadFloor), staying a
       step behind so depth stays winnable solo. Capped at LEVEL_CAP so deep
       dungeons keep working under the level-100 system. */
    const _mdCap = (typeof LEVEL_CAP !== 'undefined') ? LEVEL_CAP : 100;
    const _mdFloorLvl = Math.min(_mdCap, Math.max(1, Math.round(floor * (D.levelPerFloor || 1))));
    const lvlLo = Math.max(1, _mdFloorLvl - 1);
    const lvlHi = _mdFloorLvl;
    /* themed enemy list, rotated per floor for variety */
    const races = [];
    for (let i = 0; i < enemyCount; i++) races.push(D.enemyRaces[(floor + i) % D.enemyRaces.length]);
    entry._mdEnemySpec = {
        count: enemyCount,
        races,
        levelRange: [lvlLo, lvlHi],
        boss: isBossFloor ? { race: D.bossRace, level: Math.min(_mdCap, _mdFloorLvl + 1) } : null,
    };
    const basePb = PREBUILT_MAPS[D.baseMapId];
    if (basePb && basePb.terrainTints) entry.terrainTints = Object.assign({}, basePb.terrainTints);
    return entry;
}

/* Register a freshly generated floor under the fixed 'md_floor' id so
   applyGameMode('md_floor') + startMatch() load it like any prebuilt map.
   GAME_MODES lives in state.js (loads after data.js), so the entry is
   (re)written here at call time — the caller always runs post-boot. */
function _mdRegisterFloor(entry) {
    const D = MD_DUNGEONS[entry._mdDungeonId] || MD_DUNGEONS.agartha_depths;
    PREBUILT_MAPS[MD_FLOOR_ID] = entry;
    MAP_LAYOUT_PRESETS[MD_FLOOR_ID] = {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: entry.h - 1, label: 'Earth', baseTerrain: D.floorTerrain }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false,
        env: D.env ? JSON.parse(JSON.stringify(D.env)) : null, streetLamps: false,
    };
    if (typeof GAME_MODES !== 'undefined') {
        GAME_MODES[MD_FLOOR_ID] = {
            id: MD_FLOOR_ID, label: entry.name, desc: entry.name,
            boardSize: Math.max(entry.w, entry.h), boardWidth: entry.w, boardHeight: entry.h,
            teamSize: (entry.spawns[1] || []).length,
            winHourglasses: 0, hiddenItemSpawns: 0,
            blitzMode: true, hasTowers: false, isPrebuilt: true,
            terrainPatches: { water: [0, 0, 0], desert: [0, 0, 0], mountain: [0, 0, 0] },
            spawns: { 1: entry.spawns[1].map(p => ({ x: p.x, y: p.y })), 2: entry.spawns[2].map(p => ({ x: p.x, y: p.y })) },
            defaultBuilds: { 1: [], 2: [] },
        };
    }
    return entry;
}

if (typeof window !== 'undefined') {
    window.MD_DUNGEONS = MD_DUNGEONS;
    window.generateMdFloor = generateMdFloor;
    window._mdRegisterFloor = _mdRegisterFloor;
}

/* ═══════════════════════ RACE BIOME TAGS ═══════════════════════════════════
   Natural-habitat tags per race, matching map `biomes` — group the roster by
   home turf (map-race affinity UI, themed rosters, future biome buffs).
   Helpers: EW_racesForBiome('forest'), EW_mapsForRace('bigfoot').          */

const EW_RACE_BIOMES = {
    'homosapien': ['urban', 'stadium'], 'pirate': ['deep_sea'], 'swordfighter': ['stadium', 'neon_city'],
    'giant': ['ancient', 'divine'],
    'fairy': ['forest', 'astral'], 'martian': ['space'], 'nordic': ['space', 'clandestine'],
    'grey': ['space', 'clandestine'], 'bigfoot': ['forest'], 'shadow entity': ['forest', 'astral'],
    'reptilian': ['inner_earth', 'clandestine'], 'ai': ['underground_base', 'neon_city'],
    'robot': ['neon_city'], 'android': ['neon_city'], 'angel': ['divine'], 'seraphim': ['divine'],
    'orb of light': ['divine', 'astral'], 'demon': ['infernal'], 'succubus': ['infernal', 'astral'],
    'skeleton': ['arthurian', 'infernal'], 'mech': ['neon_city'], 'ghost': ['gothic', 'holy_city'],
    'zombie': ['urban'], 'annunaki': ['ancient', 'desert'], 'skinwalker': ['ranch'],
    'werewolf': ['forest', 'gothic'], 'gargoyle': ['holy_city', 'gothic'], 'djinn': ['desert'],
    'anubis': ['desert', 'ancient'], 'catgirl': ['underground_base', 'neon_city'],
    'mantid': ['space', 'clandestine'], 'antperson': ['inner_earth'], 'mothman': ['forest', 'ranch'],
    'siren': ['deep_sea'], 'scarecrow': ['ranch'], 'glitch': ['astral'], 'machine elves': ['astral'],
    'cyclops': ['divine', 'ancient'], 'cyborg': ['neon_city'], 'demon prince': ['infernal'],
    'demon princess': ['infernal'], 'dreameater': ['astral'], 'fallen angel': ['infernal', 'ancient'],
    'goatman': ['forest', 'ranch'], 'halfdemon': ['infernal', 'clandestine'], 'mermaid': ['deep_sea'],
    'nephilim': ['ancient', 'divine'], 'vampire': ['gothic', 'holy_city'], 'voidweaver': ['astral'],
    'cosmic wraith': ['space', 'astral'], 'superhero': ['urban', 'stadium'], 'general': ['clandestine'],
    'droid': ['neon_city'], 'antihero': ['urban', 'neon_city'],
    'conspiracy theorist': ['clandestine', 'ranch'], 'overlord': ['infernal'], 'chosen one': ['ancient'],
    'politician': ['clandestine'], 'atlantean': ['deep_sea', 'ancient'],
    'dinosaur': ['inner_earth', 'ancient'], 'dragon': ['arthurian'], 'ghoul': ['infernal', 'gothic'],
    'gnome': ['inner_earth', 'forest'], 'kaiju': ['urban', 'deep_sea'], 'kraken': ['deep_sea'],
    'loch ness monster': ['deep_sea', 'polar'], 'yeti': ['polar'], 'knight': ['arthurian'],
    'shaman': ['forest', 'ancient'], 'mad scientist': ['underground_base'], 'cowboy': ['ranch'],
    'men in black': ['clandestine', 'underground_base'], 'telepath': ['underground_base', 'astral'],
    'marksman': ['clandestine', 'urban'], 'priest': ['holy_city'], 'wizard': ['arthurian', 'gothic'],
    'fortune teller': ['desert', 'astral'], 'barbarella': ['space'],
    'black goo': ['space', 'underground_base'], 'golem': ['ancient'],
    'honda civic': ['urban', 'neon_city'], 'ice queen': ['polar'], 'juggernaut': ['underground_base'],
    'ki fighter': ['stadium'], 'king arthur': ['arthurian'], 'king kong': ['urban', 'forest'],
    'minotaur': ['ancient', 'divine'], 'necromancer': ['gothic', 'infernal'],
    'occulus': ['divine', 'astral'], 'quarterback': ['stadium'], 'robinhood': ['forest', 'arthurian'],
    'santa clause': ['polar'], 'super sentai': ['urban', 'stadium'],
    'symbiote': ['underground_base', 'space'], 'valkraye': ['divine'], 'watcher': ['divine', 'astral'],
};

(function _mfApplyRaceBiomes() {
    try {
        Object.keys(EW_RACE_BIOMES).forEach(k => {
            if (typeof RACE_PROFILES !== 'undefined' && RACE_PROFILES[k]) RACE_PROFILES[k].biomes = EW_RACE_BIOMES[k].slice();
        });
        if (typeof window !== 'undefined') {
            window.EW_RACE_BIOMES = EW_RACE_BIOMES;
            window.EW_racesForBiome = biome => Object.keys(EW_RACE_BIOMES).filter(k => EW_RACE_BIOMES[k].includes(biome));
            window.EW_mapsForRace = race => {
                const tags = EW_RACE_BIOMES[race] || [];
                return EW_MAP_META.filter(m => !m.isDelta && m.biomes && m.biomes.some(b => tags.includes(b))).map(m => m.id);
            };
        }
    } catch (e) { console.warn('[MapForge] race biome tagging failed', e); }
})();

/* ── Spawn Zone Constants ── */
const RECALL_AP_COST = 2;
const RECALL_COOLDOWN_ROUNDS = 5;
const SPAWN_ZONE_HEAL_PCT = 0.15;       // 15% maxHP/MP regen per round for friendlies
const SPAWN_ZONE_ENEMY_DMG_PCT = 0.35;  // 35% maxHP damage per round to enemies

/* Legacy aliases kept for backward compat (old replays, etc.) — no longer functional */
const CHURCH_HEAL_PCT = 0;
const CHURCH_HEAL_PCT_FREE = 0;
const CHURCH_COST = 9999;
const CHURCH_COST_AP = 99;

const SHOP_PRICES = {};
const SHOP_SWAP_WEAPON_COST = 9999;
const SHOP_SWAP_SPELL_COST = 9999;

const BOSS_DEFS = {
    hellspawn: {
        id: 'boss_hellspawn',
        name: 'Hellspawn',
        section: 'below',
        spawnRound: 5,
        types: ['unholy'],
        hp: 200, maxHp: 200,
        mp: 0, maxMp: 0,
        atk: 12, def: 10,
        move: 2, spd: 3,
        range: 1, awr: 3, int: 4,
        inspect: 0,
        goldReward: 50,
        xpReward: 40,
        buffId: 'bossSlayerMinor',
        spriteKey: 'monster_hellspawn',
        desc: 'A hulking abomination from the depths. Radiates hellfire.',
        passiveAbility: 'hellfire',
        passiveDmg: 8
    },
    angel: {
        id: 'boss_angel',
        name: 'Celestial Guardian',
        section: 'above',
        spawnRound: 5,
        types: ['divine'],
        hp: 200, maxHp: 200,
        mp: 15, maxMp: 15,
        atk: 10, def: 8,
        move: 3, spd: 4,
        range: 3, awr: 5, int: 8,
        inspect: 0,
        goldReward: 50,
        xpReward: 40,
        buffId: 'bossSlayerMinor',
        spriteKey: 'monster_angel',
        desc: 'An ancient celestial being guarding the heavens. Smites from afar.',
        passiveAbility: 'divineSmite',
        passiveDmg: 10
    }
};

const BOSS_BUFF_DEFS = {
    bossSlayerMinor: {
        label: 'Minor Slayer',
        icon: '💀',
        short: 'Slayer',
        kind: 'buff',
        category: 'buff',
        desc: '+2 ATK, +2 DEF for the rest of the match.',
        atkBonus: 2,
        defBonus: 2,
        duration: 999,
        stack: 'replace'
    }
};

const BOSS_GOLD_SPLIT_MODE = 'equal';

const SPELL_SLOT_MAX = 6;

// ============================================================================
// Level 100 scaling — single source of truth.
// HP CURVE (owner request, 2026-07-23): a level-1 unit has ~50 HP and grows to
// ~1000 HP at level 100 (the classic level-10 statline). levelScale(L) is the
// fraction of the level-100 magnitude a level-L unit operates at: EW_L1_FRAC
// (5%) at level 1, ramping to EW_SCALE (×1, WYSIWYG) at the cap. It multiplies
// BOTH max HP and every flat damage/heal/shield/DoT amount at the resolution
// chokepoints (battle.js/ai.js/state.js/map.js), so same-level combat deals
// the same PROPORTION of HP at every level — a level-5 fight and a level-100
// fight both feel like today's game, just with smaller numbers early.
// PvP is untouched: levelScale(100) == 1 exactly, so level-cap-normalized
// modes resolve byte-identical to before.
// MP is the classic FF/DQ/SMT model (owner request, 2026-07-24 — "standard
// JRPG leveling"): spell MP costs are FLAT AT ALL LEVELS (Fire costs the
// same at level 1 and 99 — never scale costs), and the POOL compresses
// instead, from EW_MP_L1_FRAC (30%) at level 1 to full size at the cap. The
// floor is gentler than HP's 5% precisely so a fresh unit can afford its
// starter spells 2–4 times; casts-per-pool then grows with level, which is
// the standard JRPG feel. Flat MP restores (Mana Rain, Supercharge, pixie
// dust, shrines) stay FLAT for the same reason — an Ether is huge early and
// modest late. %-of-maxMp effects (potions, regen) track the pool for free.
// atk/def/mdef/int stay at classic magnitude — the engine scales the
// damage they PRODUCE (and the mitigation they provide) at resolution time.
// ============================================================================
const LEVEL_CAP = 100;
// Level-100 magnitude multiplier. 1 = WYSIWYG at the cap (displayed spell
// damage == dealt damage for level-100 units). Do NOT raise this without also
// scaling spell cards, MP costs, and every flat table.
const EW_SCALE = 1;
// Fraction of level-100 magnitude a level-1 unit has: 0.05 → a unit whose
// level-100 statline is ~1000 HP starts Mystery Dungeon at ~50 HP.
const EW_L1_FRAC = 0.05;
// Curve exponent — keeps early levels gentle, late levels meaningful.
const LEVEL_SCALE_EXP = 1.35;
function levelScale(level) {
    if (LEVEL_CAP <= 1) return EW_SCALE;
    const L = Math.max(1, Math.min(LEVEL_CAP, level || 1));
    const t = Math.pow((L - 1) / (LEVEL_CAP - 1), LEVEL_SCALE_EXP);
    return EW_SCALE * (EW_L1_FRAC + (1 - EW_L1_FRAC) * t);
}

// Stat growth. atk/def/mdef/int grow additively at classic scale (totals =
// the exact column sums of the retired Lv2–10 LEVEL_UP_GAINS table, so level
// 100 == the old level 10). HP follows the 5%→100% curve; MP follows the
// same curve SHAPE but with a 30% floor (EW_MP_L1_FRAC) because spell costs
// are flat — the floor is tuned so ring-1 spells (flat 25 MP) are castable
// 2–4 times at level 1. The gain is whatever delta brings the stat to
// (base + total) × curve(L) — NEGATIVE below the level where the curve
// crosses the race's base, which is what compresses a fresh Mystery Dungeon
// unit down to ~50 HP and a fraction of its mana.
// 2026-07-25: raised 0.20 → 0.42 (starter spells were 20–30 MP then).
// 2026-08-12: retuned 0.42 → 0.30 for the tree-position cost ladder — every
// ring-1 spell is now a flat 25 MP and pools grew ~×1.8 to match, so 30%
// keeps the same classic JRPG budget: a fresh caster opens with ~4 casts of
// its starter spell, a fresh martial gets ~2, and casts-per-pool grow with
// level. Costs stay FLAT at every level — only the pool moves.
const EW_MP_L1_FRAC = 0.30;
/* 2026-08-12 tree-cost redesign: MP pools rescaled ×1.8 across the board
   (base stats, job modifiers, class templates and this growth total) to
   match the 25/50/75/100 ring ladder — a full 4-node pillar now sums to
   250 MP vs ~133 under the old derived costs. (History: pools were halved
   2026-08-09 to make mana a real constraint; that ratio is preserved.) */
// def/mdef ride the 2026-08-29 rescale (×1.2 / ×1.6) so the armor fold's
// inverse compensators (getEffectiveArmor) keep level armor unchanged.
const LEVEL_TOTAL_STAT_GAINS = { hp: 360, mp: 100, atk: 58, def: 62, mdef: 69, int: 43 };
function levelStatGains(level, baseHp, baseMp) {
    const L = Math.max(1, Math.min(LEVEL_CAP, level || 1));
    const t = LEVEL_CAP <= 1 ? 1 : Math.pow((L - 1) / (LEVEL_CAP - 1), LEVEL_SCALE_EXP);
    const out = {};
    for (const k in LEVEL_TOTAL_STAT_GAINS) out[k] = Math.round(LEVEL_TOTAL_STAT_GAINS[k] * t);
    const b = Math.max(1, Number(baseHp) || 550);
    out.hp = Math.round((b + LEVEL_TOTAL_STAT_GAINS.hp) * levelScale(L)) - b;
    const bm = Number(baseMp);
    if (isFinite(bm)) {
        const m = Math.max(0, bm);
        const mpScale = EW_SCALE * (EW_MP_L1_FRAC + (1 - EW_MP_L1_FRAC) * t);
        out.mp = Math.round((m + LEVEL_TOTAL_STAT_GAINS.mp) * mpScale) - m;
    }
    return out;
}

// ============================================================================
// LEVEL COMBAT MATH (2026-07-25 rework) — why this exists.
//
// THE BUG. Before this pass, a flat damage number was scaled by the ATTACKER's
// levelScale() and mitigation by the DEFENDER's. That reads as "proportional",
// but it isn't, because atk/def/mdef/int grow ADDITIVELY on top of the race
// base while HP is a pure multiple of the curve. A level-1 unit therefore
// swings with only its race base ATK (82 of an eventual 140) into a fully
// compressed HP bar, so a level-1 duel needed ~2× as many hits as a level-100
// one: basic attacks landed for 2 HP out of 49, abilities for 7. Twelve rounds
// later nobody was dead. Three fixes, each with one knob:
//
//   1. levelPowerStat() — damage/armor formulas read a unit's stat at its
//      LEVEL-CAP equivalent (current stat + growth not yet earned). Now a
//      same-level fight resolves to the SAME percentage of HP at level 1, 20
//      and 100. Level advantage is expressed by (3), not by stat drift.
//   2. EW_COMBAT_PACE — a flat time-to-kill dial applied to damage AND armor
//      alike, so every relative balance ratio (class, race, spell, armor's
//      share of a hit) is preserved exactly; only the number of rounds moves.
//      A same-level nuke went from ~14% of an HP bar to ~24% (8 casts → 4).
//   3. levelGapMult() — the explicit, classic-JRPG level gap. It replaces the
//      implicit gap that (1) removed, and unlike that one it is CONSISTENT:
//      +10 levels is the same crushing multiplier at level 5 and level 80.
//
// PvP/Arena is level-normalized to the cap, where levelPowerStat adds 0 and
// levelGapMult is 1 — the only difference there is EW_COMBAT_PACE. Set it to
// 1 to restore pre-2026-07-25 PvP magnitudes byte-for-byte.
// ============================================================================

// Time-to-kill dial. 1 = the old pace. 1.75 ≈ "a good spell takes a quarter of
// an HP bar, a basic attack an eighth" — a 1v1 resolves in ~5 rounds instead of
// ~13. Applied to flat damage and to flat mitigation, so armor keeps exactly
// the same share of every hit it had before.
const EW_COMBAT_PACE = 1.75;

// Level gap. Damage is multiplied by STEP^(attackerLevel − defenderLevel):
// +5 → ×1.47, +10 → ×2.16, −10 → ×0.46. Ten levels up means you kill in a
// third of the hits and take a fifth of the damage — the gap is felt. Three
// or four levels up is a ~25% swing, which type advantage (×1.5), a flank,
// high ground or a crit can all out-play. Clamped so a runaway gap never
// becomes a literal one-shot (or a literal zero).
const EW_LEVEL_GAP_STEP = 1.08;
const EW_LEVEL_GAP_MAX  = 3.5;
const EW_LEVEL_GAP_MIN  = 0.30;

// Level of a unit without needing battle.js's getUnitLevel (data.js loads
// first, and ai.js/ui.js/hud.js can't always see it). getUnitLevel keeps
// _lvlCache fresh on every damage event, so this is a hit in practice; the
// fallback mirrors battle.js XP_THRESHOLDS = round(12 × (L−1)^1.9).
function ewUnitLevel(unit) {
    if (!unit) return 0;
    const xp = unit._xp || 0;
    if (unit._lvlCache && unit._lvlCacheXp === xp) return unit._lvlCache;
    for (let L = LEVEL_CAP; L >= 2; L--) {
        if (xp >= Math.round(12 * Math.pow(L - 1, 1.9))) return L;
    }
    return 1;
}

// Fraction of the additive stat growth a level-L unit has NOT earned yet.
// 1 at level 1, 0 at the cap — the same curve HP rides.
function levelGrowthDeficit(level) {
    if (LEVEL_CAP <= 1) return 0;
    const L = Math.max(1, Math.min(LEVEL_CAP, level || 1));
    return 1 - Math.pow((L - 1) / (LEVEL_CAP - 1), LEVEL_SCALE_EXP);
}

// A unit's stat as the DAMAGE/ARMOR formulas should see it: its level-cap
// equivalent. Race and job differences survive untouched (they live in the
// base); only the level component is flattened, because level advantage is
// levelGapMult's job. `key` is a LEVEL_TOTAL_STAT_GAINS key ('atk', 'def',
// 'mdef', 'int'); 'int' reads unit.intStat. Exact when the unit carries
// _lvlStatGains (everything built through setUnitLevel does).
function levelPowerStat(unit, key) {
    if (!unit) return 0;
    const raw = (key === 'int' ? unit.intStat : unit[key]) || 0;
    const total = LEVEL_TOTAL_STAT_GAINS[key] || 0;
    if (!total) return raw;
    const earned = unit._lvlStatGains
        ? (unit._lvlStatGains[key] || 0)
        : Math.round(total * (1 - levelGrowthDeficit(ewUnitLevel(unit))));
    return Math.max(0, raw + Math.max(0, total - earned));
}

// Classic-JRPG level gap multiplier on a hit. 1 when either side has no level
// context (towers, hazards) or the levels match — so PvP is inert.
function levelGapMult(attackerLevel, defenderLevel) {
    const a = attackerLevel | 0, d = defenderLevel | 0;
    if (!a || !d || a === d) return 1;
    return Math.max(EW_LEVEL_GAP_MIN,
        Math.min(EW_LEVEL_GAP_MAX, Math.pow(EW_LEVEL_GAP_STEP, a - d)));
}

// ── THE THREE RESOLUTION-TIME SCALES ────────────────────────────────────────
// offenseScale: a flat DAMAGE number leaving a level-`src` attacker and landing
//   on a level-`tgt` victim. Resolved in the VICTIM's magnitude space (that's
//   whose HP bar it has to eat through), paced, then multiplied by the gap.
function offenseScale(srcLevel, tgtLevel) {
    const magL = (tgtLevel | 0) || (srcLevel | 0);
    if (!magL) return 1;
    return levelScale(magL) * EW_COMBAT_PACE * levelGapMult(srcLevel, tgtLevel);
}
// defenseScale: flat MITIGATION (armor, bulwark, hourglass soak, height soak)
//   held by a level-`tgt` unit. Same pace as offense → armor's share of a hit
//   is identical to the pre-pace game.
function defenseScale(tgtLevel) {
    const L = tgtLevel | 0;
    return L ? levelScale(L) * EW_COMBAT_PACE : 1;
}
// supportScale: flat HP-SPACE numbers — heals, shields, %-of-max-HP floors.
//   These restore or absorb HP, and HP is NOT paced, so neither are they.
//   Resolved in the RECIPIENT's magnitude space; no gap (helping an ally is
//   not a contest of levels).
function supportScale(tgtLevel, srcLevel) {
    const L = (tgtLevel | 0) || (srcLevel | 0);
    return L ? levelScale(L) : 1;
}

// Spell-unlock levels mapped onto CLASS_SPELL_LEARN_ORDER indices. The engine
// only ever calls getSpellUnlockLevel(); when movesets solidify, drop in a
// data-driven CLASS_SPELL_UNLOCKS table here without touching battle.js.
const DEFAULT_SPELL_UNLOCK_LEVELS = [1, 1, 5, 15, 30, 45, 60, 75, 90];
function getSpellUnlockLevel(cls, spellIdx) {
    if (spellIdx < DEFAULT_SPELL_UNLOCK_LEVELS.length) return DEFAULT_SPELL_UNLOCK_LEVELS[spellIdx];
    return Math.min(LEVEL_CAP, 90 + (spellIdx - DEFAULT_SPELL_UNLOCK_LEVELS.length + 1) * 3);
}

// Milestone levels (single place to tune).
const SPELL_SHOP_LEVEL = 10;
const SECONDARY_JOB_LEVEL = 15;
// Units always have exactly UNIT_MAX_AP (3) AP — no bonus-AP level milestones.
const AP_BONUS_LEVELS = [];

// Mode level rules — PvP is normalized to the cap; progression modes level up
// during play. Adding "Endless" later just means adding it to progressionModes.
const MODE_LEVEL_RULES = {
    pvpNormalizedLevel: LEVEL_CAP,
    progressionModes: ['dungeon', 'challenge', 'endless', 'campaign'],
};
function isProgressionMode(modeId) {
    return !!modeId && MODE_LEVEL_RULES.progressionModes.includes(modeId);
}

// ---- Race XP yields (progression modes only — see battle.js computeKillXP) --
// Pokémon-style: every race has a base experience yield, and the payout of a
// kill grows with the VICTIM's level. The yield is derived from the race's
// campaign price (already the game's "how strong is this race" tier list):
// fodder (price 100) ≈ 45, apex (price 1000) ≈ 180 — roughly Pokémon's
// Pidgey→Mewtwo spread. Drop a race into RACE_XP_YIELD_OVERRIDES to hand-tune
// it without touching the formula.
const RACE_XP_YIELD_OVERRIDES = {};
function getRaceXpYield(race) {
    const key = (race || '').toLowerCase();
    if (RACE_XP_YIELD_OVERRIDES[key] != null) return RACE_XP_YIELD_OVERRIDES[key];
    const price = (typeof CAMPAIGN_RACE_PRICES !== 'undefined' && CAMPAIGN_RACE_PRICES[key]) || 200;
    return Math.round(30 + price * 0.15);
}

/* Spell-tree redesign (SPELL_TREE_REDESIGN doc §3/§5): each job's learn
   order IS its tree branch in ring order r1→r2→r3→r4★ (opener → tool →
   payoff → capstone). CLASS_TREE below is derived from this table.
   Freelancer is unchanged — its wildcard-socket tree is a separate pass. */
const CLASS_SPELL_LEARN_ORDER = {

    'Gunslinger':  ['doubleShot', 'ricochet1', 'crossfire', 'deadEye'],
    'Warrior':     ['guardSlash', 'warCry', 'groundSlam', 'judgment'],
    'Tank':        ['fortify', 'provoke', 'shieldBash', 'rampart'],
    'Black Mage':  ['fire1', 'thunder1', 'wallOfFire', 'meteor'],
    'White Mage':  ['heal1', 'cleanse', 'healAll', 'revive1'],
    'Agent':       ['knifeThrow', 'placeBomb', 'poisonDart', 'sneakSlash'],
    'Psychic':     ['kineticHurl', 'psychosis', 'teleport', 'mindShatter'],
    'Harvester':   ['healingSeed', 'poisonSeed', 'lifeDrain', 'leechSeed'],
    'Engineer':    ['repair', 'deployTurret', 'fiveGTower', 'railgun'],
    /* 2026-08-16 balance (stats18): Lullaby was the most-cast spell in the
       lab at ring 2 / 50 MP with a 57% pick-winrate — promoted to ring 3
       (75 MP, tier II); Encore drops to ring 2 (50 MP, tier I). */
    'Harbinger':   ['discordance', 'encore', 'lullaby', 'requiem'],
    'Freelancer':  ['improvise', 'jackOfAll', 'reallyGoodPunch'],
    'Raider':      ['haymaker', 'ironGrip', 'skullCrack', 'rampage'],
    'Sniper':      ['kneecapShot', 'camouflage', 'precisionShot', 'headshot'],
    'Swordmaster': ['crossSlash', 'swordBeam', 'bladeWaltz', 'dragonSlash'],
};

/* ═══════════════ SPELL TREE — the "Tree of Life" selector ═══════════════
   SPELL_TREE_REDESIGN doc: the party-builder spell pool is a 13-node tree —
   root (Basic Attack, always known, 0 slots) + three 4-node pillars: RACE
   (middle), PRIMARY job (right), SECONDARY job (left). A spell can be
   equipped iff its node is adjacent to an already-equipped node via a
   functional path (root counts), 1 slot each, SPELL_SLOT_MAX cap; the
   equipped set must stay connected to the root. Ring index is the tier
   (r1–2 = I, r3 = II, r4★ = III). Three capstones are impossible by
   geometry — that's the intended scarcity.
   FREELANCER IS EXEMPT for now (its wildcard-socket tree is a separate
   pass) — it keeps the flat pool, and every tree entry point must route
   through classHasSpellTree() so Freelancer falls through to legacy. */

const CLASS_TREE = {};
for (const [_job, _order] of Object.entries(CLASS_SPELL_LEARN_ORDER)) {
    if (_job === 'Freelancer') continue;
    CLASS_TREE[_job] = _order.slice(0, 4);
}

/* Curated race branches (ring order r1→r4★) from the doc's §4 audit —
   only races whose four abilities all exist today. Races that still need
   new abilities authored (homosapien, fairy, antihero, marksman, knight,
   cowboy, giant, bigfoot, zombie, skeleton, ai, wizard, orb of light,
   dreameater, goatman, chosen one, gnome, kaiju… see doc) fall back to
   their first 4 existing abilities via getRaceTreeSpells until their
   Phase-B content lands. */
const RACE_TREE = {
    /* Phase-B curated rows (2026-08-07): the 17 formerly-thin races now have
       authored final-4s — no race falls back to "first 4 abilities" anymore. */
    'homosapien':    ['raceElbowGrease', 'raceAdrenalineRush', 'raceUnderdogSpirit', 'raceIndomitableWill'],
    'knight':        ['raceChivalry', 'raceShieldWall', 'raceOathOfValor', 'raceCrusade'],
    'cowboy':        ['raceLasso', 'raceFanTheHammer', 'raceQuickDraw', 'raceHighNoon'],
    'marksman':      ['raceSuppressiveFire', 'sharedSmokeScreen', 'raceRangefinder', 'raceFireForEffect'],
    'wizard':        ['raceArcaneBlast', 'raceSpellsteal', 'racePolymorph', 'raceHocusPocus'],
    'giant':         ['raceBoulderHurl', 'raceEarthenGrasp', 'raceTitanStep', 'raceColossalCrush'],
    'fairy':         ['raceGlitterburst', 'racePixieDust', 'raceTrickRoom', 'raceFaeRing'],  // Fae Ring is a ring-shaped damage capstone since 2026-08-12
    'bigfoot':       ['trunkThrow', 'raceRealityShift', 'raceTremorStomp', 'raceSasquatchSmash'],
    'ai':            ['racePredictiveModel', 'raceOvercalculate', 'raceRecursiveLoop', 'raceSingularity'],
    'orb of light':  ['racePhotonScatter', 'raceLuminousShield', 'racePrismBurst', 'raceSupernova'],
    'skeleton':      ['raceBoneToss', 'raceReassemble', 'sharedPoisonSwamp', 'raceMarrowstorm'],
    'zombie':        ['raceInfectiousBite', 'raceZombieRush', 'raceOutbreak', 'raceShamblingHorde'],
    'dreameater':    ['raceDreamSiphon', 'raceLucidTrap', 'raceNightmarePulse', 'raceEternalSlumber'],
    'goatman':       ['raceGoreCharge', 'raceCliffCharge', 'raceBloodRitual', 'raceBaphometsRite'],
    'antihero':      ['raceDarkJustice', 'raceGrimResolve', 'raceCosmicSlam', 'raceNoMercy'],
    'chosen one':    ['raceDarkFeather', 'racePhantomDouble', 'raceProphecyFulfilled', 'raceAwakening'],
    'gnome':         ['raceFlashbangMine', 'raceTinkersContraption', 'raceClockworkTurret', 'raceOvertinker'],
    'pirate':        ['racePlunder', 'raceBoardingRush', 'raceYoHo', 'raceCannonball'],
    'swordfighter':  ['raceSadBackstory', 'racePlotArmor', 'raceToBeContinued', 'raceBlessedBlade'],
    'shaman':        ['raceHerbalRemedy', 'raceSpiritWalk', 'raceAyahuascaRetreat', 'raceBadTrip'],
    'mad scientist': ['raceTeslaTrap', 'raceCloneDecoy', 'raceOvercharge', 'racePlandemic'],
    'men in black':  ['raceDeneuralizer', 'raceAgentVanish', 'sharedSmokeScreen', 'raceClassifiedWeapon'],
    'telepath':      ['raceTelepathicLink', 'racePsychicBarrier', 'raceBrainwash', 'raceMindCrush'],
    'priest':        ['raceDivineLight', 'protect1', 'raceSmite', 'exorcism'],
    'fortune teller': ['raceTarotDraw', 'raceSpiritChannel', 'raceCurseOfMisfortune', 'raceCrystalBall'],
    'martian':       ['raceHeatRay', 'sharedLowGravity', 'sharedShrinkRay', 'raceWarOfTheWorlds'],
    'nordic':        ['raceAuroraRay', 'racePleiadianShield', 'raceStasisBeam', 'raceNordicAccord'],
    'grey':          ['raceProbe', 'raceImplant', 'raceAbductionBeam', 'raceCropCircle'],
    'shadow entity': ['raceShadowBind', 'sharedSmokeScreen', 'racePhaseShift', 'voidRush'],
    'reptilian':     ['sharedPoisonSwamp', 'raceShedSkin', 'sharedSmokeScreen', 'raceTailWhip'],
    'robot':         ['raceRocketFist', 'overclock', 'raceHydraulicCrush', 'raceChassisSlam'],
    'android':       ['raceSyntheticBlade', 'raceSelfRepairProtocol', 'raceNeuralHack', 'empBurst'],
    'angel':         ['radiantBolt', 'raceWingsOfMercy', 'raceSanctuary', 'raceDivineSmite'],
    'seraphim':      ['raceRapture', 'raceAbsolution', 'raceDivineJudgment', 'raceMerkaba'],
    'demon':         ['raceContract', 'raceInfernalHurl', 'raceVoidContract', 'raceHellmouth'],
    'succubus':      ['raceSoulSuck', 'raceCharm', 'raceSleepParalysis', 'raceDrainingEmbrace'],
    'mech':          ['raceMortarSalvo', 'raceSiegeMode', 'raceEject', 'sharedNuke'],
    'ghost':         ['racePossession', 'raceColdSpot', 'sharedFlashFreeze', 'raceBoo'],
    'annunaki':      ['raceGravityWell', 'raceZigguratProtocol', 'sharedGravityCrush', 'raceStarDecree'],
    'skinwalker':    ['raceBorrowedClaw', 'sharedSmokeScreen', 'raceSkinSwap', 'raceMimicry'],
    'werewolf':      ['raceBite', 'raceHowl', 'raceFeralDive', 'raceBloodFrenzy'],
    'gargoyle':      ['raceStonefall', 'racePerchForm', 'raceCalcify', 'raceStoneDrop'],
    'djinn':         ['raceDustDevil', 'sharedSummonSandstorm', 'raceWishGranted', 'raceAncientMagic'],
    'anubis':        ['sharedFissure', 'raceGravePassage', 'sharedSummonSandstorm', 'raceWeighTheHeart'],
    'catgirl':       ['raceLoveBite', 'raceNimbleDodge', 'raceMeow', 'raceNinefoldScratch'],
    'mantid':        ['raceMandibleStrike', 'raceChitinArmor', 'raceAmbushLunge', 'raceFractalNeedle'],
    'antperson':     ['raceFormicAcid', 'sharedPoisonSwamp', 'raceTunnelNetwork', 'raceSwarmSignal'],
    'mothman':       ['raceRedEyes', 'thunderstorm', 'raceAbduction', 'raceProphecyOfDisaster'],
    'siren':         ['raceSonicBoomerang', 'raceRiptide', 'raceDeafeningWail', 'raceCallOfTheDeep'],
    'scarecrow':     ['raceHarvestHook', 'raceStuffedDouble', 'sharedHexOfToil', 'raceCrowStorm'],
    'glitch':        ['raceCrashLoop', 'raceMemoryLeak', 'raceBlueScreen', 'raceTimeRewind'],
    'machine elves': ['racePrismMirror', 'racePulseLattice', 'raceTuneFrequency', 'sharedEgoDeath'],
    'cyclops':       ['raceStoneThrow', 'raceBalefulGaze', 'raceTitanDrop', 'raceGiantSmash'],
    'cyborg':        ['raceHydraulicPunch', 'raceEMPGrenade', 'overclock', 'raceRocketToss'],
    'demon prince':  ['raceDemonicRoar', 'raceInfernalConscription', 'sharedScorchedEarth', 'raceDarkDominion'],
    /* 2026-08-16 balance (stats18): demon princess ran +16.6 residual — Kiss
       of Decay (top-10 dmg/MP at 25 MP) moves to ring 3 (75 MP, tier II);
       Poison Swamp opens the pillar at ring 1 (it already prices as ring 1
       via its reptilian slot — shared ids take their lowest ring). */
    'demon princess': ['sharedPoisonSwamp', 'sharedHexOfToil', 'raceKissOfDecay', 'raceDarkLullaby'],
    'fallen angel':  ['raceFallenGrace', 'raceAbyssalWings', 'raceSanctuary', 'raceDescendingWrath'],
    'halfdemon':     ['raceInnerDemon', 'sharedSmokeScreen', 'raceShadowStep', 'raceDemonicClaw'],
    'mermaid':       ['raceSirenSong', 'raceTidalBlessing', 'raceRiptide', 'raceFlood'],
    'nephilim':      ['raceSmite', 'raceHolyBulwark', 'sharedFissure', 'raceWrathOfTheWatchers'],
    'vampire':       ['raceBite', 'raceMistForm', 'raceBatSwarm', 'racePredatorDrop'],
    'voidweaver':    ['raceVenomFang', 'raceWebSnare', 'raceDimensionalWeb', 'sharedBlackHole'],
    'cosmic wraith': ['raceEntropicBeam', 'racePhaseWalk', 'sharedNebula', 'raceHeatDeath'],
    'superhero':     ['raceHeroicLeap', 'raceInvulnerable', 'raceShockwaveClap', 'raceLaserBeam'],
    'general':       ['raceRallyCommand', 'raceIronBulwark', 'raceArtilleryStrike', 'sharedNuke'],
    'droid':         ['raceTaserBolt', 'raceSystemAnalysis', 'raceFirewallProtocol', 'empBurst'],
    'conspiracy theorist': ['raceTinFoilHat', 'raceChemtrails', 'raceFluorideWater', 'raceTruthBomb'],
    'overlord':      ['raceHellfireCrown', 'raceInfernalDecree', 'sharedScorchedEarth', 'raceCataclysmDecree'],
    'politician':    ['raceFilibuster', 'raceBlackBudget', 'raceExecutiveOrder', 'sharedNuke'],
    'atlantean':     ['raceRiptide', 'sharedTidalSurge', 'raceTemporalTide', 'racePoseidonsWrath'],
    'dinosaur':      ['racePrimalRoar', 'raceApexCharge', 'sharedFissure', 'raceJurassicJaw'],
    'dragon':        ['raceWingGust', 'raceDragonfear', 'raceDragonToss', 'raceDragonfire'],
    'ghoul':         ['raceGhoulishBite', 'raceCorpseCrawl', 'sharedPoisonSwamp', 'raceCarrionFeast'],
    'kaiju':         ['raceCataclysmStomp', 'raceSeismicLeap', 'raceSkyscraperToss', 'raceAtomicBreath'],
    'kraken':        ['raceTentacleLash', 'raceInkCloud', 'raceDepthCharge', 'sharedVortexSlam'],
    'loch ness monster': ['raceRiptide', 'raceDeepDive', 'raceCryptidVanish', 'raceTidalSlam'],
    'yeti':          ['raceFrozenPunch', 'raceIceSlide', 'racePermafrost', 'raceAvalancheStrike'],
    'barbarella':    ['raceStunRay', 'raceGravityBoots', 'racePlasmaWhip', 'raceSpaceDisco'],
    'black goo':     ['raceCorrosiveSplash', 'raceAbsorb', 'raceToxicNova', 'raceMitosisSplit'],
    'golem':         ['raceBoulderHurl', 'raceStoneSkin', 'sharedFissure', 'raceQuake'],
    'honda civic':   ['raceRamCharge', 'raceExhaustCloud', 'raceNitroBoost', 'raceMissileBarrage'],
    'ice queen':     ['raceIceSpear', 'sharedFlashFreeze', 'raceDiamondDust', 'raceAbsoluteZero'],
    'juggernaut':    ['raceBodyCheck', 'raceThickHide', 'raceBrutalSlam', 'raceUnstoppableCharge'],
    'ki fighter':    ['raceKiBlast', 'raceKiCharge', 'raceInstantTransmission', 'raceDragonFist'],
    'king arthur':   ['raceRoyalDecree', 'raceShieldWall', 'raceKnightsOfRound', 'raceExcaliburStrike'],
    'king kong':     ['raceChestPound', 'raceBoulderHurl', 'raceApeFury', 'racePrimalSmash'],
    'minotaur':      ['raceHornToss', 'raceLabyrinthRoar', 'raceGoreCharge', 'raceBullRush'],
    'necromancer':   ['raceSoulDrain', 'racePlaguefield', 'raceBoneBarrage', 'raceRaiseDead'],
    'occulus':       ['racePsychicBeam', 'raceOmniVision', 'raceHypnoticPulse', 'raceDeathGaze'],
    'quarterback':   ['raceBulletPass', 'raceBlitz', 'raceAudible', 'raceHailMary'],
    'robinhood':     ['raceFireArrow', 'raceStealFromRich', 'raceSplittingArrow', 'raceArrowRain'],
    'santa clause':  ['raceLumpOfCoal', 'raceSleighDash', 'raceNaughtyList', 'raceBlizzardPresent'],
    'super sentai':  ['sentaiRedSlash', 'sentaiPinkHeal', 'sentaiTeamStrike', 'sentaiMegazordBlast'],
    'symbiote':      ['raceWebLaunch', 'raceSymbioteArmor', 'raceSymbioticDrain', 'raceTendrilStrike'],
    'valkraye':      ['raceValkyrieSpear', 'raceShieldMaiden', 'raceDivineSwoop', 'raceChooserOfSlain'],
    'watcher':       ['raceJudgmentBeam', 'raceCosmicSight', 'raceTemporalShift', 'raceRealityPulse'],
};

const _JOB_TREE_IDS = new Set();
for (const _ids of Object.values(CLASS_TREE)) for (const _id of _ids) _JOB_TREE_IDS.add(_id);

/* ═══════════ TREE-POSITION MP COSTS (owner request 2026-08-12) ═══════════
   MP costs no longer derive from what a spell does — they read straight off
   the spell's NODE POSITION in its pillar:
       ring 1 = 25 · ring 2 = 50 · ring 3 = 75 · capstone = 100
   The mana formula above still runs first at load, but only as the pricer
   of OFF-TREE spells (extra race abilities, legacy pool) — and even those
   get snapped to the same 25/50/75/100 ladder so every cost in the game is
   one of four legible numbers. An explicit numeric `manaCostOverride`
   still wins everywhere (owner opt-out / editor-pinned costs). */
const TREE_RING_MP_COSTS = [25, 50, 75, 100];

function snapCostToLadder(cost) {
    const c = +cost || 0;
    if (c <= 37) return 25;
    if (c <= 62) return 50;
    if (c <= 87) return 75;
    return 100;
}

/* spellId → ring index (0–3) across every job learn order + curated race
   tree. The LAST entry of a pillar is its capstone (ring 3) — that's what
   prices Freelancer's 3-spell order improvise/jackOfAll/reallyGoodPunch as
   25/50/100, matching its P1/P2/P4 fixed nodes. A shared spell that sits
   on different rings in different trees takes its LOWEST ring — the
   cheapest node it occupies must stay affordable at that position. */
function buildTreeRingIndex() {
    const rings = {};
    const noteOrder = (order) => {
        if (!Array.isArray(order)) return;
        order.forEach((id, i) => {
            if (!id) return;
            const ring = (i >= order.length - 1) ? 3 : Math.min(i, 2);
            if (rings[id] == null || ring < rings[id]) rings[id] = ring;
        });
    };
    for (const order of Object.values(CLASS_SPELL_LEARN_ORDER)) noteOrder(order);
    for (const order of Object.values(RACE_TREE)) noteOrder(order);
    return rings;
}

// Ladder price for one spell id, or null when the id is on no tree.
function getTreeRingCost(id, rings) {
    if (!id) return null;
    const r = (rings || buildTreeRingIndex())[id];
    return r == null ? null : TREE_RING_MP_COSTS[r];
}

/* Stamp every spell with its ladder price. Re-runnable: EWSpellMods calls
   it after applying custom-content docs so learnset moves re-position
   costs (skipIds = ids whose cost the doc pinned explicitly). snapOffTree
   is only set on the boot pass — re-applies must not trample explicit
   editor costs on off-tree spells. */
function applyTreeRingCosts(skipIds, snapOffTree) {
    const rings = buildTreeRingIndex();
    const seen = new Set();
    const all = [];
    for (const sp of SPELL_LIBRARY) if (!seen.has(sp)) { seen.add(sp); all.push(sp); }
    for (const _abl of Object.values(RACE_ABILITIES)) {
        for (const ab of _abl) if (!seen.has(ab)) { seen.add(ab); all.push(ab); }
    }
    let treed = 0, snapped = 0;
    for (const sp of all) {
        if (!sp || sp.kind === 'basicAttack') continue;
        if (skipIds && sp.id && skipIds.has(sp.id)) continue;
        if (typeof sp.manaCostOverride === 'number') { sp.cost = sp.manaCostOverride; continue; }
        const ring = sp.id != null ? rings[sp.id] : null;
        if (ring != null) { sp.cost = TREE_RING_MP_COSTS[ring]; treed++; }
        else if (snapOffTree && typeof sp.cost === 'number' && sp.cost > 0) {
            sp.cost = snapCostToLadder(sp.cost); snapped++;
        }
    }
    return { treed, snapped };
}

(function _applyTreeRingCostsAtBoot() {
    const n = applyTreeRingCosts(null, true);
    console.log(`[ManaEconomy] Tree-position MP costs: ${n.treed} tree spells priced 25/50/75/100 by ring, ${n.snapped} off-tree spells snapped to the ladder`);
})();

function classHasSpellTree(cls) {
    /* Freelancer joined the tree in Phase B (wildcard sockets, see the
       FREELANCER block below) — it has no CLASS_TREE row because its
       primary branch is part-fixed, part-socket. */
    if (cls === 'Freelancer') return true;
    return !!(cls && CLASS_TREE[cls]);
}

function getClassTreeSpells(cls) {
    return CLASS_TREE[cls] ? CLASS_TREE[cls].slice() : null;
}

/* Audited races use their curated final-4; everything else falls back to
   its first 4 existing abilities (job-gated), skipping ids owned by a job
   tree (rampart/groundSlam/rampage/empBurst stay with their branch owner). */
function getRaceTreeSpells(race, cls) {
    if (RACE_TREE[race]) return RACE_TREE[race].slice();
    const abs = (typeof RACE_ABILITIES !== 'undefined' && RACE_ABILITIES[race]) || [];
    const out = [];
    for (const a of abs) {
        if (!a || !a.id || _JOB_TREE_IDS.has(a.id)) continue;
        if (a.jobRequirement && cls && a.jobRequirement !== cls) continue;
        if (!out.includes(a.id)) out.push(a.id);
        if (out.length >= 4) break;
    }
    return out;
}

/* Functional adjacency, by node key. Root connects to all three ring-1
   nodes; each pillar is a strict chain (traditional skill-tree order —
   ring N requires ring N-1 of the SAME pillar). No cross-links: reaching
   a capstone always costs its full pillar (4 slots), so a second capstone
   can never fit in the 6-slot budget (4+4 > 6). */
function getTreeEdges() {
    return [
        ['root', 'R1'], ['root', 'P1'], ['root', 'S1'],
        ['R1', 'R2'], ['R2', 'R3'], ['R3', 'R4'],
        ['P1', 'P2'], ['P2', 'P3'], ['P3', 'P4'],
        ['S1', 'S2'], ['S2', 'S3'], ['S3', 'S4'],
    ];
}

/* One unit's concrete tree: node key → spell id (null = empty socket; an
   empty socket can never be equipped OR traversed). Dedupes — if an id
   would appear on two nodes the later node goes empty (authoring rule:
   no id may live in both a job tree and a race tree). */
function buildUnitSpellTree(race, cls, secJob, equippedIds) {
    if (cls === 'Freelancer') return buildFreelancerTree(race, equippedIds);
    const nodes = { root: null };
    const seen = new Set();
    const fill = (prefix, ids) => {
        for (let i = 0; i < 4; i++) {
            const id = (ids && ids[i]) || null;
            const known = id && (typeof SPELL_BY_ID === 'undefined' || SPELL_BY_ID[id]);
            if (known && !seen.has(id)) {
                nodes[prefix + (i + 1)] = id;
                seen.add(id);
            } else {
                nodes[prefix + (i + 1)] = null;
            }
        }
    };
    fill('R', getRaceTreeSpells(race, cls));
    fill('P', getClassTreeSpells(cls) || []);
    fill('S', secJob && secJob !== cls ? (getClassTreeSpells(secJob) || []) : []);
    return { nodes, edges: getTreeEdges() };
}

/* ═══════════ FREELANCER — the wildcard-socket tree (Phase B) ═══════════
   Doc §6: the identity IS borrowing, so no new spells were authored.
   Race pillar as normal. Primary pillar: improvise → jackOfAll →
   [socket, tier I/II] → reallyGoodPunch★. Secondary pillar: FOUR wildcard
   sockets, ring-tier-capped — S1/S2 any tier I, S3 any tier II, S4 any
   tier III capstone. A socket accepts any job-tree spell of an allowed
   tier; equipping is still just customSpells ids (no save-format change) —
   buildFreelancerTree() finds a socket placement of the equipped wildcards
   that keeps the tree root-connected (backtracking over ≤6×5, trivial). */
const FL_FIXED = { P1: 'improvise', P2: 'jackOfAll', P4: 'reallyGoodPunch' };
const FL_SOCKET_TIERS = { P3: ['I', 'II'], S1: ['I'], S2: ['I'], S3: ['II'], S4: ['III'] };

function _flTierOf(sp) {
    return sp && sp.tier === 'III' ? 'III' : sp && sp.tier === 'II' ? 'II' : 'I';
}

/* Every spell a Freelancer socket may hold: the union of all job trees
   (Freelancer's own three fixed spells aren't in CLASS_TREE), minus ids on
   this race's own tree (the no-duplicate rule). */
function flWildcardPool(race) {
    const raceIds = new Set(getRaceTreeSpells(race, 'Freelancer') || []);
    const fixed = new Set(Object.values(FL_FIXED));
    const out = [];
    const seen = new Set();
    for (const ids of Object.values(CLASS_TREE)) {
        for (const id of ids) {
            const sp = SPELL_BY_ID[id];
            if (!sp || seen.has(id) || raceIds.has(id) || fixed.has(id)) continue;
            seen.add(id);
            out.push(sp);
        }
    }
    return out;
}

function buildFreelancerTree(race, equippedIds) {
    const edges = getTreeEdges();
    const nodes = { root: null };
    const seen = new Set();
    const raceIds = getRaceTreeSpells(race, 'Freelancer') || [];
    for (let i = 0; i < 4; i++) {
        const id = raceIds[i] || null;
        const known = id && SPELL_BY_ID[id];
        if (known && !seen.has(id)) { nodes['R' + (i + 1)] = id; seen.add(id); }
        else nodes['R' + (i + 1)] = null;
    }
    for (const [k, id] of Object.entries(FL_FIXED)) {
        nodes[k] = SPELL_BY_ID[id] ? id : null;
        if (nodes[k]) seen.add(id);
    }
    for (const k of Object.keys(FL_SOCKET_TIERS)) nodes[k] = null;

    const poolIds = new Set(flWildcardPool(race).map(s => s.id));
    const equipped = (equippedIds || []).filter(Boolean);
    const wild = [], unplaced = [];
    for (const id of equipped) {
        if (seen.has(id)) continue;                       // race / fixed node
        (poolIds.has(id) ? wild : unplaced).push(id);
    }

    const mkTree = (placement) => {
        const n2 = { ...nodes };
        for (const [k, id] of Object.entries(placement)) n2[k] = id;
        return { nodes: n2, edges, isFreelancer: true, sockets: FL_SOCKET_TIERS };
    };
    let firstComplete = null;
    const placed = {};
    const search = (i) => {
        if (i >= wild.length) {
            const t = mkTree(placed);
            if (!firstComplete) firstComplete = t;
            const connected = _treeConnectedEquipped(t, equipped);
            return equipped.every(id => connected.has(id)) ? t : null;
        }
        const tier = _flTierOf(SPELL_BY_ID[wild[i]]);
        for (const k of Object.keys(FL_SOCKET_TIERS)) {
            if (placed[k] != null || !FL_SOCKET_TIERS[k].includes(tier)) continue;
            placed[k] = wild[i];
            const r = search(i + 1);
            if (r) return r;
            delete placed[k];
        }
        return null;
    };
    let tree = (wild.length <= Object.keys(FL_SOCKET_TIERS).length) ? search(0) : null;
    if (!tree) {
        // No fully-connected placement — surface a best-effort tree so the
        // UI can render; the wildcards that found no socket are unplaced.
        tree = firstComplete || mkTree({});
        const inNodes = new Set(Object.values(tree.nodes).filter(Boolean));
        for (const id of wild) if (!inNodes.has(id)) unplaced.push(id);
        tree.connected = false;
    } else {
        tree.connected = true;
    }
    tree.unplaced = unplaced;
    return tree;
}

/* Clash bans movement spells. A banned node mid-branch would sever the
   chain, so banned nodes are "sealed pass-throughs" (doc §6): they cannot
   be equipped but still count as connected for adjacency. */
function _treeSealedIds(tree) {
    const sealed = new Set();
    const clash = (typeof _isClashMode === 'function' && _isClashMode());
    const allowFn = (typeof window !== 'undefined' && typeof window._clashSpellAllowed === 'function')
        ? window._clashSpellAllowed : null;
    if (!clash || !allowFn) return sealed;
    for (const id of Object.values(tree.nodes)) {
        if (!id) continue;
        const sp = SPELL_BY_ID[id];
        if (sp && !allowFn(sp)) sealed.add(id);
    }
    return sealed;
}

/* BFS from root over passable nodes (root | equipped | sealed). Returns the
   set of reached node KEYS. */
function _treeReachableKeys(tree, equippedIds, sealedIds) {
    const equipped = equippedIds instanceof Set ? equippedIds : new Set(equippedIds || []);
    const adj = {};
    for (const [a, b] of tree.edges) {
        (adj[a] = adj[a] || []).push(b);
        (adj[b] = adj[b] || []).push(a);
    }
    const passable = (key) => {
        if (key === 'root') return true;
        const id = tree.nodes[key];
        return !!id && (equipped.has(id) || (sealedIds && sealedIds.has(id)));
    };
    const reached = new Set(['root']);
    const stack = ['root'];
    while (stack.length) {
        const k = stack.pop();
        for (const n of (adj[k] || [])) {
            if (!reached.has(n) && passable(n)) { reached.add(n); stack.push(n); }
        }
    }
    return reached;
}

/* Public aliases for the UI (party-builder) — same objects, stable names. */
function treeSealedIds(tree) { return _treeSealedIds(tree); }
function treeReachableKeys(tree, equippedIds) {
    return _treeReachableKeys(tree, equippedIds, _treeSealedIds(tree));
}

/* The subset of equipped ids that are root-connected (through equipped or
   sealed nodes). Dropping the disconnected rest can never disconnect these. */
function _treeConnectedEquipped(tree, equippedIds) {
    const equipped = new Set((equippedIds || []).filter(Boolean));
    const reached = _treeReachableKeys(tree, equipped, _treeSealedIds(tree));
    const out = new Set();
    for (const [key, id] of Object.entries(tree.nodes)) {
        if (id && equipped.has(id) && reached.has(key)) out.add(id);
    }
    return out;
}

/* THE loadout legality check (builder, createUnit, online host authority):
   every id is a tree node, no duplicates, within the slot cap, nothing
   sealed, and the whole equipped set is connected to the root. Freelancer
   (no tree yet) is always legal here — flat-pool rules cover it. */
function isTreeLoadoutLegal(race, cls, secJob, spellIds) {
    if (!classHasSpellTree(cls)) return true;
    const ids = (spellIds || []).filter(Boolean);
    const cap = (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6;
    if (ids.length > cap) return false;
    if (new Set(ids).size !== ids.length) return false;
    // buildUnitSpellTree needs the equipped list for Freelancer (socket
    // placement is derived from it); other classes ignore the 4th arg.
    const tree = buildUnitSpellTree(race, cls, secJob, ids);
    if (tree.isFreelancer && (tree.unplaced.length || !tree.connected)) return false;
    const inTree = new Set(Object.values(tree.nodes).filter(Boolean));
    const sealed = _treeSealedIds(tree);
    for (const id of ids) {
        if (!inTree.has(id) || sealed.has(id)) return false;
    }
    return _treeConnectedEquipped(tree, ids).size === ids.length;
}

/* Graceful repair for stale saves / vessel swaps: keep the largest
   root-connected subset of the wish-list (earlier picks win), capped. */
function treeLegalSubset(race, cls, secJob, spellIds) {
    const cap = (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6;
    if (!classHasSpellTree(cls)) return (spellIds || []).filter(Boolean).slice(0, cap);
    if (cls === 'Freelancer') {
        /* Sockets re-place themselves per candidate set, so keep-the-largest
           is a greedy add: earlier picks win, an id stays only if the set
           is still fully legal with it in. */
        const out = [];
        const seen = new Set();
        for (const id of (spellIds || [])) {
            if (!id || seen.has(id) || out.length >= cap) continue;
            seen.add(id);
            out.push(id);
            if (!isTreeLoadoutLegal(race, cls, secJob, out)) out.pop();
        }
        return out;
    }
    const tree = buildUnitSpellTree(race, cls, secJob);
    const inTree = new Set(Object.values(tree.nodes).filter(Boolean));
    const sealed = _treeSealedIds(tree);
    const seen = new Set();
    const ids = [];
    for (const id of (spellIds || [])) {
        if (!id || seen.has(id) || !inTree.has(id) || sealed.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= cap) break;
    }
    const connected = _treeConnectedEquipped(tree, ids);
    return ids.filter(id => connected.has(id));
}

/* Random tree-legal loadout for the AI / randomize buttons: a random walk
   over currently-reachable nodes. Retries a few times to land at least one
   damage spell so CPU units never roll an all-utility kit. */
function buildTreeLegalLoadout(race, cls, secJob, budget, rng) {
    const cap = Math.min(budget || ((typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6),
        (typeof SPELL_SLOT_MAX !== 'undefined') ? SPELL_SLOT_MAX : 6);
    if (!classHasSpellTree(cls)) return [];
    const rand = (typeof rng === 'function') ? rng : Math.random;
    if (cls === 'Freelancer') {
        /* Random walk with sockets: each step picks either a concrete
           race/fixed node adjacent to the connected set, or fills an
           adjacent empty socket with a random pool spell of a fitting tier.
           Every push is legality-checked (socket placement can shuffle). */
        const pool = flWildcardPool(race);
        const attemptFL = () => {
            const picks = [];
            for (let guard = 0; picks.length < cap && guard < cap * 4; guard++) {
                const tree = buildFreelancerTree(race, picks);
                const sealed = _treeSealedIds(tree);
                const reached = _treeReachableKeys(tree, new Set(picks), sealed);
                const opts = [];
                for (const [key, id] of Object.entries(tree.nodes)) {
                    if (key === 'root') continue;
                    const adjacent = tree.edges.some(([a, b]) =>
                        (a === key && reached.has(b)) || (b === key && reached.has(a)));
                    if (!adjacent) continue;
                    if (id) {
                        if (!picks.includes(id) && !sealed.has(id)) opts.push(id);
                    } else if (FL_SOCKET_TIERS[key]) {
                        const cands = pool.filter(sp => FL_SOCKET_TIERS[key].includes(_flTierOf(sp))
                            && !picks.includes(sp.id));
                        if (cands.length) opts.push(cands[Math.floor(rand() * cands.length)].id);
                    }
                }
                if (!opts.length) break;
                picks.push(opts[Math.floor(rand() * opts.length)]);
                if (!isTreeLoadoutLegal(race, cls, secJob, picks)) picks.pop();
            }
            return picks;
        };
        const hasDmg = (ids) => ids.some(id => {
            const sp = SPELL_BY_ID[id];
            return sp && (sp.type === 'damage' || sp.kind === 'damage' || sp.dmg > 0);
        });
        let best = attemptFL();
        for (let t = 0; t < 3 && !hasDmg(best); t++) {
            const alt = attemptFL();
            if (hasDmg(alt) || alt.length > best.length) best = alt;
        }
        return best;
    }
    const tree = buildUnitSpellTree(race, cls, secJob);
    const sealed = _treeSealedIds(tree);
    const attempt = () => {
        const equipped = new Set();
        const picks = [];
        while (picks.length < cap) {
            const reached = _treeReachableKeys(tree, equipped, sealed);
            const frontier = [];
            for (const [key, id] of Object.entries(tree.nodes)) {
                if (!id || equipped.has(id) || sealed.has(id)) continue;
                // adjacent to any reached node?
                const adjacent = tree.edges.some(([a, b]) =>
                    (a === key && reached.has(b)) || (b === key && reached.has(a)));
                if (adjacent) frontier.push(id);
            }
            if (!frontier.length) break;
            const pick = frontier[Math.floor(rand() * frontier.length)];
            equipped.add(pick);
            picks.push(pick);
        }
        return picks;
    };
    const hasDamage = (ids) => ids.some(id => {
        const sp = SPELL_BY_ID[id];
        return sp && (sp.type === 'damage' || sp.kind === 'damage' || sp.dmg > 0);
    });
    let best = attempt();
    for (let t = 0; t < 3 && !hasDamage(best); t++) {
        const alt = attempt();
        if (hasDamage(alt) || alt.length > best.length) best = alt;
    }
    return best;
}

const SPELL_SHOP_PRICES = {
    'I':   40,
    'II':  80,
    'III': 140,
};

// (The old per-level LEVEL_UP_GAINS table was retired — its column sums live
// on as LEVEL_TOTAL_STAT_GAINS above, stretched across levels 1→100.)

const _CHAL_MAP_POOL_SMALL  = ['normal'];
const _CHAL_MAP_POOL_MED    = ['medium', 'prebuilt_moon_delta', 'prebuilt_stonehenge_delta', 'prebuilt_nuketown_delta',
                               'prebuilt_backrooms_delta', 'prebuilt_dumb_delta', 'prebuilt_flatlands_delta'];
const _CHAL_MAP_POOL_LARGE  = ['large', 'prebuilt_stonehenge', 'prebuilt_moon', 'prebuilt_gobekli',
                               'prebuilt_dumb', 'prebuilt_cern', 'prebuilt_backrooms',
                               'prebuilt_northpole', 'prebuilt_flatlands', 'prebuilt_nuketown'];
const _CHAL_MAP_POOL_XLARGE = ['xlarge', 'prebuilt_shasta', 'prebuilt_giza', 'prebuilt_heaven',
                                'prebuilt_hell', 'prebuilt_mars', 'prebuilt_area51',
                                'prebuilt_skinwalker', 'prebuilt_hollow_earth', 'prebuilt_fairy_forest'];

const _CHAL_ENEMY_TIER_EASY   = ['zombie', 'skeleton', 'robot', 'giant', 'bigfoot', 'goatman'];
const _CHAL_ENEMY_TIER_MID    = ['zombie', 'skeleton', 'robot', 'giant', 'demon', 'halfdemon',
                                  'reptilian', 'shadow entity', 'werewolf', 'gargoyle', 'mech',
                                  'martian', 'android'];
const _CHAL_ENEMY_TIER_HARD   = ['demon', 'halfdemon', 'angel', 'fallen angel', 'succubus', 'djinn',
                                  'anubis', 'machine elves', 'cyborg', 'vampire', 'mantid', 'siren',
                                  'voidweaver', 'cosmic wraith'];
const _CHAL_ENEMY_TIER_BOSS   = ['seraphim', 'demon prince', 'demon princess', 'annunaki',
                                  'nephilim', 'fallen angel', 'cosmic wraith', 'voidweaver',
                                  'dreameater', 'superhero'];

function _chalRng(seed) {
  let s = (seed | 0) || 1;
  return function () {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1000) / 1000;
  };
}
function _chalPick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function _chalPickN(arr, n, rng) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(rng() * arr.length)]);
  return out;
}

function generateChallengeLevel(battleNum) {
  const n = Math.max(1, battleNum | 0);
  const runSeed = (typeof state !== 'undefined' && state && state.campaignSave && state.campaignSave.runSeed) || 0;
  const rng = _chalRng(runSeed + n * 2654435761);
  let teamSize, mapPool, enemyPool, levelRange, aiMult;
  // Level 100: enemy levels track the battle number (≈ level = battleNum),
  // stretching the run's narrative arc across the full 1–100 curve. The
  // player's roster levels along via kill XP (Pokémon-style, see battle.js
  // computeKillXP), and the level-gap damper in that formula self-corrects
  // any drift, so both sides stay near parity for the whole run.
  if (n <= 2) {
    teamSize = 1; mapPool = _CHAL_MAP_POOL_SMALL;  enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [1, 2]; aiMult = 0.4;
  } else if (n <= 5) {
    teamSize = 2; mapPool = _CHAL_MAP_POOL_SMALL;  enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [2, 5]; aiMult = 0.5;
  } else if (n <= 10) {
    teamSize = 4; mapPool = _CHAL_MAP_POOL_MED;    enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [5, 11]; aiMult = 0.7;
  } else if (n <= 18) {
    teamSize = 4; mapPool = _CHAL_MAP_POOL_MED;    enemyPool = _CHAL_ENEMY_TIER_MID;   levelRange = [10, 20]; aiMult = 1.0;
  } else if (n <= 28) {
    teamSize = 6; mapPool = _CHAL_MAP_POOL_LARGE;  enemyPool = _CHAL_ENEMY_TIER_MID;   levelRange = [18, 32]; aiMult = 1.0;
  } else if (n <= 40) {
    teamSize = 6; mapPool = _CHAL_MAP_POOL_LARGE;  enemyPool = _CHAL_ENEMY_TIER_HARD;  levelRange = [30, 46]; aiMult = 1.1;
  } else if (n <= 60) {
    teamSize = 8; mapPool = _CHAL_MAP_POOL_XLARGE; enemyPool = _CHAL_ENEMY_TIER_HARD;  levelRange = [44, 66]; aiMult = 1.15;
  } else {
    teamSize = 8; mapPool = _CHAL_MAP_POOL_XLARGE; enemyPool = _CHAL_ENEMY_TIER_BOSS;
    const extra = Math.floor((n - 61) / 5);
    levelRange = [Math.min(62 + extra * 3, 96), Math.min(72 + extra * 3, 100)];
    aiMult = 1.25;
  }
  const mapId = _chalPick(mapPool, rng);
  const enemyRaces = _chalPickN(enemyPool, teamSize, rng);
  const goldReward = 40 + n * 8;
  return {
    id: n,
    name: `Battle ${n}`,
    desc: `Challenge Run · Battle ${n}`,
    mapId,
    multiplayerMode: 'tdm',
    teamSize,
    enemyRaces,
    enemyLevelRange: levelRange,
    recruitRace: null,
    recruitMessage: null,
    allyRacePool: null,
    starThresholds: null,
    goldReward,
    modifiers: [],
    winConditionOverride: null,
    _challengeAiMult: aiMult,
    _challengeBattleNum: n,
  };
}

const GAUNTLET_MAX_LEVEL = 100;

function getGauntletRetryCost(battleNum) { return 50 + 10 * (battleNum || 1); }

const CAMPAIGN_LEVELS = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'string' && /^\d+$/.test(prop)) {
      const idx = parseInt(prop, 10);
      return generateChallengeLevel(idx + 1);
    }
    if (prop === 'length') return 999;
    return undefined;
  }
});

const CAMPAIGN_RACE_PRICES = {

  'giant': 100, 'skeleton': 100, 'zombie': 100, 'robot': 100,
  'fairy': 120, 'ghost': 120, 'catgirl': 120, 'antperson': 120,
  'scarecrow': 120, 'bigfoot': 150, 'werewolf': 150,
  'android': 150, 'cyclops': 150,

  'martian': 200, 'grey': 200, 'nordic': 200, 'angel': 250,
  'demon': 250, 'reptilian': 250, 'shadow entity': 250,
  'mantid': 250, 'gargoyle': 300, 'mech': 300,
  'skinwalker': 300, 'mothman': 300, 'siren': 300,
  'goatman': 300, 'halfdemon': 300,

  'succubus': 400, 'djinn': 400, 'anubis': 400, 'ai': 400,
  'machine elves': 450, 'glitch': 450, 'orb of light': 500,
  'seraphim': 500, 'cyborg': 500, 'mermaid': 500,
  'vampire': 500, 'dreameater': 500, 'fallen angel': 550,

  'swordfighter': 450,
  'annunaki': 700, 'demon prince': 700, 'demon princess': 700,
  'nephilim': 800, 'voidweaver': 800, 'cosmic wraith': 900,
  'superhero': 1000,
  'general': 600,
  'droid': 550,
  'antihero': 950,
  'conspiracy theorist': 500,
  'overlord': 850,
  'chosen one': 700,
  'politician': 600,
};

const CAMPAIGN_REGION_THEMES = {
  1: { name: 'The Warning Was Real',     color: '#4a6741', levels: [1, 20] },
  2: { name: 'The Warning Was Ignored',  color: '#5a4a2e', levels: [21, 40] },
  3: { name: 'The Receiver Was Built',   color: '#6a3a6e', levels: [41, 60] },
  4: { name: 'The Saviors Are Rotten',   color: '#7a2a1a', levels: [61, 80] },
  5: { name: 'The Instrument Refuses',   color: '#2a1a4e', levels: [81, 100] },
};

/* ── CRT / EVA — official stats, one canonical formula ──────────────
   Critical-hit and evasion chance used to be buried inside battle.js;
   they are now first-class visible stats. This is the ONLY place the
   math lives — battle.js (combat rolls), the target quick menu, the
   INFO stat card and the party builder / codex all read these two
   functions, so the number the player sees is the number the dice use.
   Both derive from stats the player already builds around:
     CRT = 8% + 2%/AWR (max +18%), cap 30%
     EVA = 6% + 1.8%/MOV (max +10%), cap 25%
   CRT is pure perception: AWR alone drives it (2026-08-12 — the old
   +0.4%/INT rider made magic attack raise basic-attack crits, which
   made no sense when spells can't crit; casters lost that freebie).
   Combat context on top (battle.js): a crit deals ×1.8 damage
   (Gunslinger ×2.0); back-arc attacks can't be dodged; a blinded
   attacker always misses; hard CC (stun/freeze/root) sets EVA to 0;
   spells never crit and can't be dodged. */
function critChanceFromStats(awr) {
  // 2026-08-29 rescale: AWR lives on 0–100 (×14) — same curve, compensated.
  return Math.min(0.30, 0.08 + Math.min(0.18, (awr || 0) * (0.02 / 14)));
}
function evasionChanceFromStats(move) {
  return Math.min(0.25, 0.06 + Math.min(0.10, (move || 0) * 0.018));
}

/* ── STAT LETTER GRADES (2026-08-29 stat rework, STAT_REWORK.md) ───────────
   Five letters, low→high F · C · B · A · S, shown BESIDE the number (never
   replacing it). The six core stats live on one 0–100 ruler, so their letter
   is simply ceil(stat/20): F 1–20 · C 21–40 · B 41–60 · A 61–80 · S 81–100.
   HP/MP stay raw resource pools (600 HP reads better than "HP 54") and get
   bespoke absolute bands anchored on the measured roster distribution
   (B straddles the roster average, S ≈ top decile).
   Deliberate NON-grades: MOV and RNG (tiny numbers with diamond footprints),
   CRT/EVA (already a % — a grade would double-encode). Grades are computed
   from the FINAL displayed value, so gear/sub-job genuinely move letters. */
const STAT_GRADE_LETTERS = ['S', 'A', 'B', 'C'];   // high → low, else F
const STAT_GRADE_BANDS = {
  //        S     A     B     C   (else F)
  hp:    [700,  620,  540,  460],
  mp:    [235,  190,  140,   80],
  atk:   [ 81,   61,   41,   21],
  int:   [ 81,   61,   41,   21],
  def:   [ 81,   61,   41,   21],
  mdef:  [ 81,   61,   41,   21],
  spd:   [ 81,   61,   41,   21],
  awr:   [ 81,   61,   41,   21],
};
// One chip color per grade — the same visual language at every display site.
const STAT_GRADE_COLORS = { S: '#f2c63c', A: '#3ddc84', B: '#4ecbe2', C: '#c8c8e4', F: '#ff5e5e' };
function statGrade(key, val) {
  const bands = STAT_GRADE_BANDS[key];
  if (!bands) return null;                      // move/range/crt/eva: no grade
  for (let i = 0; i < bands.length; i++) if (val >= bands[i]) return STAT_GRADE_LETTERS[i];
  return 'F';
}
/* Shared HTML chip (ui.js / hud.js string-built sites; party-builder builds
   its React twin from STAT_GRADE_COLORS). Returns '' for ungraded keys. */
function statGradeChipHtml(key, val) {
  const g = statGrade(key, val);
  if (!g) return '';
  return `<span class="stat-grade grade-${g.toLowerCase()}">${g}</span>`;
}

/* Player-facing stat explainers — the ONE hover-tooltip text for every stat,
   shared by the party builder (bars, quadrant, MOVE/RANGE footprints), the
   codex dossier, the in-battle INFO stat card and the quick-menu stat grid.
   Keep the numbers in sync with battle.js when formulas move. */
const STAT_HELP = {
  hp: 'HP — hit points. The unit dies when HP reaches 0. Restored by healing spells, some terrain, and resting in your own spawn zone (15% per round). Grades: S ≥700 · A ≥620 · B ≥540 · C ≥460 · F below.',
  mp: 'MP — mana, spent to cast spells. Every unit trickles back ~3% of max MP each round (15% in your own spawn zone), so a deep pool means more casts before running dry. Grades: S ≥235 · A ≥190 · B ≥140 · C ≥80 · F below.',
  atk: 'ATK — physical power, on the 0–100 ruler (letter = each 20: S 81+ · A 61+ · B 41+ · C 21+ · F below). Basic attacks deal about 65% of ATK (minus the target’s DEF), and physical spells add 35% of ATK to their damage. Blocked by DEF, never by M DEF.',
  int: 'M ATK — magic power, on the 0–100 ruler (S 81+ · A 61+ · B 41+ · C 21+ · F below). Magic spells add 35% of M ATK to their damage, and healing spells heal more with it too. Blocked by M DEF, never by DEF.',
  def: 'DEF — physical armor, on the 0–100 ruler (S 81+ · A 61+ · B 41+ · C 21+ · F below). Soaks a flat share of every incoming basic attack and physical spell. Does nothing against magic damage.',
  mdef: 'M DEF — magic armor, on the 0–100 ruler (S 81+ · A 61+ · B 41+ · C 21+ · F below). Soaks incoming magic spell damage the way DEF soaks physical hits. Does nothing against physical damage.',
  spd: 'SPD — quickness, on the 0–100 ruler. One letter = one movement tile: F (1–20) walks 1 · C (21–40) 2 · B (41–60) 3 · A (61–80) 4 · S (81–100) 5. Faster units also act earlier each round, land (and slip away from) opportunity attacks more often, and the truly nimble (SPD 90+) can leap 2-high walls instead of 1.',
  move: 'MOV — movement range in tiles, derived from SPD (1 tile per 20 SPD: F 1 · C 2 · B 3 · A 4 · S 5), then modified by statuses, terrain and weather. The SECOND move of a turn covers only half the tiles (rounded up) and spends all remaining AP. Also feeds dodge chance (+1.8% EVA per MOV).',
  range: 'RNG — basic attack reach in tiles. 1 = melee only; higher lets the unit strike from a distance. Spells carry their own separate ranges.',
  awr: 'AWR — perception, on the 0–100 ruler (S 81+ · A 61+ · B 41+ · C 21+ · F below). Drives critical chance (+2% per 14 AWR), lets keen units (AWR 84+) sense cloaked or smoke-hidden enemies from 2 tiles instead of 1, and raises the chance to land opportunity attacks on retreating enemies. Sight itself is pure line of sight — AWR does NOT extend how far a unit sees.',
  crt: 'CRT — critical hit chance on basic attacks. 8% base + 2% per 14 AWR (max +18%), capped at 30%. A crit deals ×1.8 damage (Gunslinger passive: ×2.0). Spells never crit.',
  eva: 'EVA — chance to dodge a basic attack. 6% base + 1.8% per MOV (max +10%), capped at 25%. Back-arc attacks can’t be dodged, a blinded attacker always misses, and hard CC (stun/freeze/root) drops EVA to 0. Spells can’t be dodged.',
};

Object.assign(window, {
  critChanceFromStats, evasionChanceFromStats, STAT_HELP,
  STAT_GRADE_LETTERS, STAT_GRADE_BANDS, STAT_GRADE_COLORS, statGrade, statGradeChipHtml,
  moveFromSpd, RACE_BASE_STATS,
  CONFIG, EQUIP_DEFS, RACE_PROFILES, AVAILABLE_RACES, RACE_DEFAULT_JOBS,
  MAX_UNIT_PASSIVES, PASSIVE_DEFS, RACE_PASSIVES,
  getUnitPassives, unitHasPassive, unitPassiveValue, unitPassiveBlocksStatus,
  /* elemental affinity system (2026-09-01, ELEMENTAL_TYPES_PLAN.md) */
  SPELL_ELEMENTS, COMBAT_ELEMENTS, ELEMENT_AFFINITY_TIERS, ELEMENT_AFFINITY_MULT,
  ELEMENT_ICONS, ELEMENTAL_STATUS, ELEMENT_RIDER_STATUS, statusAffinityElement,
  RACE_ELEMENT_AFFINITY, getRaceElementAffinity, unitElementAffinity,
  AVAILABLE_ZODIACS, ZODIAC_ICONS, JOB_MODIFIERS, CLASS_TEMPLATES,
  JOB_PASSIVES, CLASS_PASSIVES, getJobPassive,
  DEFAULT_BUILDS, ITEM_RULES, SPELL_LIBRARY, SPELL_SLOT_MAX,
  SPELL_BY_ID, RACE_ABILITY_BY_ID, STATUS_DEFS,
  getSpellSlotCost, getSpellIdsSlotCost, trimSpellIdsToSlotBudget,
  CLASS_SPELL_LEARN_ORDER, RACE_ABILITIES, CAMPAIGN_REGION_THEMES,
  LEVEL_CAP, EW_SCALE, EW_L1_FRAC, LEVEL_SCALE_EXP, levelScale,
  LEVEL_TOTAL_STAT_GAINS, levelStatGains, EW_MP_L1_FRAC,
  EW_COMBAT_PACE, EW_LEVEL_GAP_STEP, EW_LEVEL_GAP_MAX, EW_LEVEL_GAP_MIN,
  ewUnitLevel, levelGrowthDeficit, levelPowerStat, levelGapMult,
  offenseScale, defenseScale, supportScale,
  getSpellUnlockLevel, SPELL_SHOP_LEVEL, SECONDARY_JOB_LEVEL, AP_BONUS_LEVELS,
  MODE_LEVEL_RULES, isProgressionMode, RACE_XP_YIELD_OVERRIDES, getRaceXpYield,
  getRaceLabel, GAUNTLET_MAX_LEVEL, getGauntletRetryCost,
  computeSecJobBonuses, computeEquipBonuses,
  ACCT_UNIT_PRICE, ACCT_BASE_COMPLETE, ACCT_WIN_MULT, ACCT_FLAWLESS_MULT,
  ACCT_WIPEOUT_MULT, ACCT_STARTING_GOLD, ACCT_FREE_TOKENS, ACCT_MATCH_GOLD_CAP,
  ACCT_STARTER_UNITS, ACCT_PVP_MODES, isUnitUnlocked, computeAccountMatchGold,
  ACH_CATALOG, ACH_CHAMP_LINES, ACH_TIER_NAMES, ACH_TIER_COLORS,
  ACH_MASTERY, ACH_TIER_REWARDS, ACH_RECORD_DEFS,
  mergeProgressBlobs, achUnlockKeyReward, achCountMasteredChamps, achComputeSyncRewards,
  STEAM_STAT_DEFS, STEAM_ACH_DEFS, steamComputeStats, steamEvalAchievements,
  /* spell tree (Tree of Life selector) */
  CLASS_TREE, RACE_TREE, classHasSpellTree, getClassTreeSpells, getRaceTreeSpells,
  TREE_RING_MP_COSTS, buildTreeRingIndex, getTreeRingCost, applyTreeRingCosts, snapCostToLadder,
  getTreeEdges, buildUnitSpellTree, isTreeLoadoutLegal, treeLegalSubset,
  buildTreeLegalLoadout, treeSealedIds, treeReachableKeys,
  /* Freelancer wildcard sockets (Phase B) */
  FL_FIXED, FL_SOCKET_TIERS, flWildcardPool, buildFreelancerTree,
});

/* ═══════════════════════════════════════════════════════════════════════════
   AUTO SPELL DESCRIPTIONS — describeSpell(def) (2026-08-02)

   Generates the house-voice tooltip text ("Deals MEDIUM magic damage to a
   Single Enemy. Applies Burn.") straight from a spell def, so the Spell
   Library editor can keep `desc` accurate automatically instead of the
   owner re-typing it after every stat tweak. Deterministic and data-driven:
   same def in → same sentence out. The editor exposes it via the AUTO-DESC
   toggle (def.descAuto !== false → desc regenerates on every field edit).
   ═══════════════════════════════════════════════════════════════════════ */
function _dscDmgWord(n) {
    // House damage scale: WEAK 80 · MEDIUM 120 · HEAVY 160 · SEVERE 210
    if (n == null) return null;
    if (n < 100) return 'WEAK';
    if (n < 140) return 'MEDIUM';
    if (n < 185) return 'HEAVY';
    return 'SEVERE';
}
function _dscHealWord(n) {
    // House heal scale: WEAK 60 · MEDIUM 100 · BIG 150
    if (n == null) return null;
    if (n < 80) return 'a WEAK amount';
    if (n < 125) return 'a MEDIUM amount';
    return 'a BIG amount';
}
function _dscStatusLabel(sid) {
    try { if (typeof STATUS_DEFS !== 'undefined' && STATUS_DEFS[sid] && STATUS_DEFS[sid].label) return STATUS_DEFS[sid].label; } catch (e) {}
    return String(sid || '').replace(/^\w/, c => c.toUpperCase());
}
/* statChange carriers (Discord, Overclock, Pixie Dust, Jack of All…) are stat
   changes, not status effects — describe WHAT the stats do instead of
   "Applies <name>". Derived straight from the def's stageMod/moveDelta/
   rangeDelta so the text can never drift from the math. */
function _dscStatChange(sid) {
    const d = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS[sid] : null;
    if (!d) return null;
    const NAMES = { atk: 'ATK', def: 'DEF', mdef: 'M.DEF', int: 'M.ATK', spd: 'SPD' };
    const up = [], down = [];
    for (const [k, v] of Object.entries(d.stageMod || {})) {
        if (!v) continue;
        (v > 0 ? up : down).push(`${NAMES[k] || k.toUpperCase()} by ${Math.abs(v)} stage${Math.abs(v) > 1 ? 's' : ''}`);
    }
    if (d.moveDelta) (d.moveDelta > 0 ? up : down).push(`MOV by ${Math.abs(d.moveDelta)}`);
    if (d.rangeDelta) (d.rangeDelta > 0 ? up : down).push(`RNG by ${Math.abs(d.rangeDelta)}`);
    const S = [];
    if (up.length) S.push(`Raises ${_dscJoin(up)}.`);
    if (down.length) S.push(`Lowers ${_dscJoin(down)}.`);
    return S.length ? S.join(' ') : null;
}
function _dscJoin(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
}
const _DSC_STAT_NAMES = { atk: 'ATK', def: 'DEF', mdef: 'M DEF', int: 'M ATK', spd: 'SPD', mov: 'MOV', awr: 'AWR', rng: 'RNG', hp: 'HP', mp: 'MP' };
function _dscStages(boost, verbUp, verbDown) {
    const ups = [], downs = [];
    Object.keys(boost || {}).forEach(k => {
        const v = boost[k];
        if (!v) return;
        const name = _DSC_STAT_NAMES[k] || k.toUpperCase();
        const amt = Math.abs(v);
        (v > 0 ? ups : downs).push(`${name} by ${amt} stage${amt === 1 ? '' : 's'}`);
    });
    const parts = [];
    if (ups.length) parts.push(`${verbUp} ${_dscJoin(ups)}.`);
    if (downs.length) parts.push(`${verbDown} ${_dscJoin(downs)}.`);
    return parts;
}

function describeSpell(def) {
    if (!def || typeof def !== 'object') return '';
    const d = def;
    const kind = d.kind || 'damage';
    const dmgType = d.damageType === 'physical' ? 'physical' : 'magic';
    const S = [];               // sentences, joined at the end
    const hits = Array.isArray(d.hitDamages) ? d.hitDamages : null;
    const totalDmg = hits ? hits.reduce((a, b) => a + (b || 0), 0) : d.dmg;
    const tier = _dscDmgWord(totalDmg);
    const radius = d.aoeRadius != null ? d.aoeRadius : d.crossRadius;

    // ── target phrase for offensive area kinds ──
    const aoeTarget = kind === 'cross' ? 'All Enemies in an X-shaped AOE'
        : (kind === 'line' || kind === 'linePush' || kind === 'splitBeam') ? 'All Enemies in a line'
        : 'All Enemies in an AOE';

    // ── main clause per kind ──
    const dmgClause = tgt => `Deals ${tier || 'MEDIUM'} ${dmgType} damage to ${tgt}.`;
    switch (kind) {
        case 'damage':      S.push(dmgClause('a Single Enemy')); break;
        case 'multiHit':    S.push(`Deals ${tier || 'MEDIUM'} ${dmgType} damage to a Single Enemy across ${hits ? hits.length : 2} hits.`); break;
        case 'ricochet':    S.push(`Deals ${tier || 'WEAK'} ${dmgType} damage to a Single Enemy, then bounces to nearby enemies.`); break;
        case 'lifeDrain':   S.push(dmgClause('a Single Enemy')); break;
        case 'aoe': case 'barrage': S.push(dmgClause(aoeTarget)); break;
        case 'cross':       S.push(dmgClause(aoeTarget)); break;
        case 'line':        S.push(dmgClause(aoeTarget)); break;
        case 'splitBeam':   S.push(`Fires a beam that splits apart. ${dmgClause(aoeTarget)}`); break;
        case 'linePush':    S.push(`${dmgClause(aoeTarget)} Pushes them back.`); break;
        case 'dash':        S.push(`Dashes through the battlefield${d.dashDamage != null ? `, dealing ${_dscDmgWord(d.dashDamage) || 'MEDIUM'} ${dmgType} damage to enemies along the path` : ''}.`); break;
        case 'leapStrike':  S.push(`Leaps to a Single Enemy, dealing ${tier || 'MEDIUM'} ${dmgType} damage.`); break;
        case 'delayed':     S.push(`Marks the target tile — the strike lands after ${d.delayTurns || 1} round${(d.delayTurns || 1) === 1 ? '' : 's'}, dealing ${tier || 'MEDIUM'} ${dmgType} damage${radius ? ' in an AOE' : ''}.`); break;
        case 'bomb':        S.push(`Places a bomb. Detonate it to deal ${tier || 'MEDIUM'} ${dmgType} damage in an AOE.`); break;
        case 'pull':        S.push(`${tier ? dmgClause('a Single Enemy') + ' ' : ''}Pulls the target toward the caster.`.trim()); break;
        case 'aoePull':     S.push(`${tier ? dmgClause(aoeTarget) + ' ' : ''}Drags everything caught toward the center.`.trim()); break;
        case 'rallyPull':   S.push('Pulls allies to the caster\'s side.'); break;
        case 'swap':        S.push(`${tier ? dmgClause('a Single Enemy') + ' ' : ''}Swaps positions with the target.`.trim()); break;
        case 'displacement':S.push(`${tier ? dmgClause('a Single Enemy') + ' ' : ''}Shoves the target sideways.`.trim()); break;
        case 'teleport':    S.push(d.teleportAnyUnit ? 'Warp any unit — self, ally, or enemy — to any unoccupied tile within range.' : 'Teleports the caster to an unoccupied tile within range.'); break;
        case 'warpRune':    S.push('Places a warp rune. Step on it to travel between linked runes.'); break;
        case 'escape':      S.push('Breaks away — the caster escapes to a safer tile.'); break;
        case 'skyThrow':    S.push(`Grabs the target, carries it skyward and hurls it${d.throwRange ? ` up to ${d.throwRange} tiles` : ''}. Deals ${tier || 'MEDIUM'} ${dmgType} damage${d.collisionBonus ? ', more if they crash into another unit' : ''}.`); break;
        case 'skyDrop':     S.push(`Lifts the target high and drops it. Deals ${tier || 'MEDIUM'} ${dmgType} damage plus fall damage.`); break;
        case 'skySlam':     S.push(`Dives from the sky onto ${radius ? aoeTarget : 'the target'}, dealing ${tier || 'MEDIUM'} ${dmgType} damage.`); break;
        case 'heal':        S.push(`Restores ${_dscHealWord(d.heal) || 'a MEDIUM amount'} of HP to a Single Ally.`); break;
        case 'healAll':     S.push(`Restores ${_dscHealWord(d.healAmt != null ? d.healAmt : d.heal) || 'a MEDIUM amount'} of HP to All Allies.`); break;
        case 'selfHeal':    S.push(d.selfHealPct ? `The caster restores ${Math.round(d.selfHealPct * 100)}% of max HP.` : `The caster restores ${_dscHealWord(d.heal) || 'a MEDIUM amount'} of HP.`); break;
        case 'zoneHeal':    S.push(`Creates a healing zone${d.healPerTurn ? ` that restores ${d.healPerTurn} HP to allies inside each turn` : ''}${d.zoneDuration ? ` for ${d.zoneDuration} rounds` : ''}.`); break;
        case 'seedHeal':    S.push('Plants a seed that heals nearby allies each turn.'); break;
        case 'seedPoison':  S.push('Plants a seed that poisons nearby enemies each turn.'); break;
        case 'leechSeed':   S.push('Plants a seed on a Single Enemy: drains HP each turn and heals the caster.'); break;
        case 'revive':      S.push(`Revives a fallen ally${d.revivePct ? ` at ${Math.round(d.revivePct * 100)}% HP` : ''}.${d.oneRevivePerUnitPerMatch ? ' Works once per unit per match.' : ''}`); break;
        case 'cleanse':     S.push('Cleanses debuffs from the target.'); break;
        case 'shield':      S.push(`Shields a Single Ally${d.shield ? ` for ${d.shield} HP` : ''}.`); break;
        case 'aoeShield':   S.push(`Shields All Allies in an AOE${d.shieldHp ? ` for ${d.shieldHp} HP` : ''}.`); break;
        case 'buff':        S.push(`Empowers ${((d.range || 0) === 0) ? 'the caster' : (d.teamStatusEffects ? 'All Allies' : 'a Single Ally')}.`); break;
        case 'warCry':      S.push('Empowers All Allies nearby.'); break;
        case 'encore':      S.push('Grant a friendly unit that already acted this turn 1 bonus AP, letting them take one more action.'); break;
        case 'guard':       S.push('The caster braces, taking reduced damage until their next turn.'); break;
        case 'debuff':      S.push('Weakens a Single Enemy.'); break;
        case 'zoneDebuff':  S.push(`Creates a hostile zone that weakens enemies inside${d.zoneDuration ? ` for ${d.zoneDuration} rounds` : ''}.`); break;
        case 'scan':        S.push(`Reveals hidden enemies${d.scanRadius ? ` within ${d.scanRadius} tiles` : ' in the area'}.`); break;
        case 'remoteView':  S.push('Reveals a distant area of the map, granting vision for several turns.'); break;
        case 'summonWeather': S.push(`Summons ${d.weatherType || 'wild'} weather over the battlefield.`); break;
        case 'terrainCreate': S.push(`Reshapes the battlefield — creates ${d.terrainType || 'new terrain'}${d.tileCount ? ` across ${d.tileCount} tiles` : ''}${d.orientable ? ' (pick the orientation)' : ''}.`); break;
        case 'deployObject': S.push('Deploys an object on an empty tile.'); break;
        case 'deployTurret': S.push(`Deploys a turret${d.turretDmg ? ` that fires for ${d.turretDmg} damage` : ''}${d.maxActivePerCaster ? ` (max ${d.maxActivePerCaster} active)` : ''}. Enemies can destroy it.`); break;
        case 'deployPair':  S.push('Deploys a linked pair of objects.'); break;
        case 'placeTrap':   S.push(`Places a hidden ${d.trapType || ''} trap that triggers when an enemy steps on it.`.replace('  ', ' ')); break;
        case 'placeMirror': S.push('Places a mirror that redirects beams.'); break;
        case 'placeBlock':  S.push('Places a solid block on the battlefield.'); break;
        case 'buildStructure': S.push('Builds a structure on the battlefield.'); break;
        case 'trickRoom':   S.push(`Inverts the turn order — slowest act first${d.trickRoomDuration ? ` for ${d.trickRoomDuration} rounds` : ''}.`); break;
        case 'manaRestoreAll': S.push('Restores MP to All Allies.'); break;
        case 'raiseDead':   S.push('Raises the fallen to fight again.'); break;
        case 'tuneFrequency': S.push('Retunes deployed prisms to a new frequency.'); break;
        case 'pulseLattice': S.push('Fires the prism lattice — every beam segment strikes enemies it crosses.'); break;
        case 'utility':     S.push('Utility effect.'); break;
        default:
            S.push(tier ? dmgClause(radius ? aoeTarget : 'a Single Enemy')
                : (d.type === 'heal' ? 'Restores HP.' : d.type === 'buff' ? 'Empowers allies.' : d.type === 'debuff' ? 'Weakens enemies.' : 'Special effect.'));
            break;
    }

    // ── riders, in house order ──
    if (d.ignoreArmor) S.push('Ignores DEF.');
    if (d.guaranteedCrit) S.push('Always crits.');
    if (Array.isArray(d.statusEffects) && d.statusEffects.length) {
        const _isStatChange = e => { try { return !!(STATUS_DEFS[e.id] && STATUS_DEFS[e.id].statChange); } catch (err) { return false; } };
        const _real = d.statusEffects.filter(e => !_isStatChange(e));
        if (_real.length) S.push(`Applies ${_dscJoin(_real.map(e => _dscStatusLabel(e.id)))}.`);
        for (const e of d.statusEffects.filter(_isStatChange)) {
            const t = _dscStatChange(e.id);
            if (t) S.push(t);
        }
    }
    if (Array.isArray(d.allyStatusEffects) && d.allyStatusEffects.length)
        S.push(`Applies ${_dscJoin(d.allyStatusEffects.map(e => _dscStatusLabel(e.id)))} to allies.`);
    if (Array.isArray(d.teamStatusEffects) && d.teamStatusEffects.length)
        S.push(`Applies ${_dscJoin(d.teamStatusEffects.map(e => _dscStatusLabel(e.id)))} to the whole team.`);
    if (d.statStageBoost) {
        const isHostile = d.type === 'debuff' || (d.type === 'damage' && Object.values(d.statStageBoost).some(v => v < 0));
        S.push(..._dscStages(d.statStageBoost, isHostile ? 'Raises the target\'s' : 'Raises', isHostile ? 'Lowers' : 'Lowers'));
    }
    if (d.bonusVsStatus && d.bonusVsStatus.status) {
        const _bvsIds = [].concat(d.bonusVsStatus.status);
        S.push(`Deals bonus damage to targets with ${_dscJoin(_bvsIds.map(_dscStatusLabel))}.`);
    }
    if (d.bonusVsDebuffed) S.push('Deals bonus damage to debuffed targets.');
    if (d.executePct) S.push(`Executes: bonus damage below ${Math.round(d.executePct * 100)}% HP.`);
    if (d.drainPct) S.push('Heals the caster for part of the damage dealt.');
    if (d.groundsFlyers) S.push('Knocks flying targets out of the sky.');
    if (d.pushDistance) S.push(`Knocks the target back ${d.pushDistance} tile${d.pushDistance === 1 ? '' : 's'}.`);
    if (d.pullDistance && kind !== 'pull' && kind !== 'aoePull') S.push(`Pulls the target ${d.pullDistance} tile${d.pullDistance === 1 ? '' : 's'} closer.`);
    if (d.leaveTerrain) S.push(`Leaves ${d.leaveTerrain} behind.`);
    if (d.chargeToTarget) S.push('The caster charges into melee first.');
    const recoil = d.selfDamagePct || d.recoilPct;
    if (recoil) S.push(`Recoil: the caster loses ${Math.round(recoil * 100)}% of max HP.`);
    if (d.selfStun) S.push('The caster is stunned afterward.');
    if (d.friendlyFire) S.push('Can catch your own team.');
    if (d.requiresFlight) S.push('Caster must be flying.');
    if (d.ignoresLineOfSight) S.push('Fires through cover.');
    if (d.cooldownRounds) S.push(`Cooldown: ${d.cooldownRounds} round${d.cooldownRounds === 1 ? '' : 's'}.`);
    return S.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
window.describeSpell = describeSpell;

/* ═══════════════════════════════════════════════════════════════════════════
   SPELL LIBRARY DEV TOOL — override patch layer (2026-07-26)

   The Spell Library screen (Settings → Developer → Spell Library, ui.js
   _renderSpellLibrary) lets the owner edit/add/delete spells and reassign
   job learnsets / race movepools. Edits live in localStorage
   ('ew_spell_mods_v1') as a sparse diff document and are applied HERE, at
   the very end of data.js — after every derivation pass
   (_applySimTurnDefaults, _applyManaCostFormula, _applyBaselineCooldowns)
   and before any other script reads the tables — so a stored edit behaves
   exactly as if it had been authored in this file.

   Document shape (also the Export format handed back to Claude):
   {
     version: 1,
     enabled: true,                 // master "apply my edits" switch
     modified: { spellId: { field: value, ... } },   // value null = delete field
     added:    { spellId: { ...full def, _home: {lib:true}|{race:'ghost'} } },
     deleted:  [spellId, ...],
     learnsets:     { jobName: [spellId, ...] },     // full replacement arrays
     raceAbilities: { raceKey: [spellId, ...] },     // full replacement arrays
     notes: ''
   }
   Parity rules applied per touched spell (mirrors the load passes above):
   - manaCostOverride set        → cost = manaCostOverride
   - spell sits on a tree        → cost = ring price (25/50/75/100) — power
     edits never move a tree spell's cost, only its node position does
   - off-tree + power fields touched, no explicit cost →
     cost = snapCostToLadder(computeSpellManaCost())
   - kind touched                → simTargeting/simPhase/simFallback restamped
   apply() is idempotent: it restores the pristine tables first, then applies
   the current doc, so the editor can re-apply live after every save.
   ═══════════════════════════════════════════════════════════════════════ */
const EW_SPELL_MODS_LS_KEY = 'ew_spell_mods_v1';

window.EWSpellMods = (function () {
    // Fields whose edit re-prices the spell through the mana formula when the
    // user did not pin the cost (same inputs computeSpellManaCost reads).
    const POWER_FIELDS = ['dmg', 'heal', 'healAmt', 'healPerTurn', 'hitDamages', 'dashDamage',
        'drainPct', 'aoeRadius', 'crossRadius', 'range', 'apCost', 'kind', 'type',
        'statusEffects', 'allyStatusEffects', 'teamStatusEffects', 'statStageBoost',
        'shield', 'shieldHp', 'cooldownRounds', 'delayTurns', 'randomTeamBuff',
        'zodiacReading', 'friendlyFire', 'requiresFlight', 'recoilPct', 'selfDamagePct', 'selfStun'];

    let doc = null;
    let pristine = null;    // exact pre-mod table snapshots (object refs, not clones)
    let fieldBase = {};     // spellId -> field -> [{ref, had, val}] originals per object ref

    function emptyDoc() {
        return { version: 1, enabled: true, modified: {}, added: {}, deleted: [],
                 learnsets: {}, raceAbilities: {}, notes: '' };
    }

    function load() {
        let d = null;
        try { d = JSON.parse(localStorage.getItem(EW_SPELL_MODS_LS_KEY) || 'null'); } catch (e) { d = null; }
        if (!d || typeof d !== 'object' || d.version !== 1) d = emptyDoc();
        ['modified', 'added', 'learnsets', 'raceAbilities'].forEach(k => { if (!d[k] || typeof d[k] !== 'object') d[k] = {}; });
        if (!Array.isArray(d.deleted)) d.deleted = [];
        if (typeof d.enabled !== 'boolean') d.enabled = true;
        doc = d;
        return doc;
    }

    function save() {
        try { localStorage.setItem(EW_SPELL_MODS_LS_KEY, JSON.stringify(doc)); } catch (e) {
            console.error('[SpellMods] save failed', e);
        }
    }

    function capturePristine() {
        if (pristine) return;
        const raceRefs = {}, raceById = {};
        Object.keys(RACE_ABILITIES).forEach(r => { raceRefs[r] = RACE_ABILITIES[r].slice(); });
        Object.keys(RACE_ABILITY_BY_ID).forEach(id => { raceById[id] = RACE_ABILITY_BY_ID[id]; });
        const byId = {};
        Object.keys(SPELL_BY_ID).forEach(id => { byId[id] = SPELL_BY_ID[id]; });
        const learn = {};
        Object.keys(CLASS_SPELL_LEARN_ORDER).forEach(j => { learn[j] = CLASS_SPELL_LEARN_ORDER[j].slice(); });
        // byId/raceById/libRefs/raceRefs hold live OBJECT REFS (for exact array
        // membership restore). defClones holds deep-copied VALUES — the editor
        // diffs against these, and they must not drift when mods mutate the
        // live objects in place.
        const defClones = {};
        Object.keys(byId).forEach(id => { try { defClones[id] = JSON.parse(JSON.stringify(byId[id])); } catch (e) {} });
        Object.keys(raceById).forEach(id => { if (!defClones[id]) { try { defClones[id] = JSON.parse(JSON.stringify(raceById[id])); } catch (e) {} } });
        pristine = { libRefs: SPELL_LIBRARY.slice(), raceRefs, byId, raceById, learn, defClones };
    }

    // Every live def object carrying this id (lib entry, race-array entries,
    // map entries) — identity-deduped. The two known duplicate-id literals
    // (raceAbsolution, raceBoulderHurl) therefore BOTH receive field mods.
    function refsFor(id) {
        const out = [];
        const seen = new Set();
        const push = o => { if (o && typeof o === 'object' && !seen.has(o)) { seen.add(o); out.push(o); } };
        pristine.libRefs.forEach(s => { if (s.id === id) push(s); });
        Object.keys(pristine.raceRefs).forEach(r => pristine.raceRefs[r].forEach(a => { if (a.id === id) push(a); }));
        if (SPELL_BY_ID[id]) push(SPELL_BY_ID[id]);
        if (RACE_ABILITY_BY_ID[id]) push(RACE_ABILITY_BY_ID[id]);
        return out;
    }

    function restoreAll() {
        if (!pristine) return;
        // 1. un-apply field mods
        Object.keys(fieldBase).forEach(id => {
            const fields = fieldBase[id];
            Object.keys(fields).forEach(f => {
                fields[f].forEach(rec => {
                    if (rec.had) rec.ref[f] = rec.val; else delete rec.ref[f];
                });
            });
        });
        fieldBase = {};
        // 2. exact array/map restore from pristine refs
        SPELL_LIBRARY.length = 0;
        pristine.libRefs.forEach(s => SPELL_LIBRARY.push(s));
        Object.keys(RACE_ABILITIES).forEach(r => { if (!pristine.raceRefs[r]) delete RACE_ABILITIES[r]; });
        Object.keys(pristine.raceRefs).forEach(r => {
            if (!RACE_ABILITIES[r]) RACE_ABILITIES[r] = [];
            RACE_ABILITIES[r].length = 0;
            pristine.raceRefs[r].forEach(a => RACE_ABILITIES[r].push(a));
        });
        Object.keys(SPELL_BY_ID).forEach(id => { if (!pristine.byId[id]) delete SPELL_BY_ID[id]; });
        Object.keys(pristine.byId).forEach(id => { SPELL_BY_ID[id] = pristine.byId[id]; });
        Object.keys(RACE_ABILITY_BY_ID).forEach(id => { if (!pristine.raceById[id]) delete RACE_ABILITY_BY_ID[id]; });
        Object.keys(pristine.raceById).forEach(id => { RACE_ABILITY_BY_ID[id] = pristine.raceById[id]; });
        Object.keys(CLASS_SPELL_LEARN_ORDER).forEach(j => { if (!pristine.learn[j]) delete CLASS_SPELL_LEARN_ORDER[j]; });
        Object.keys(pristine.learn).forEach(j => {
            if (!CLASS_SPELL_LEARN_ORDER[j]) CLASS_SPELL_LEARN_ORDER[j] = [];
            CLASS_SPELL_LEARN_ORDER[j].length = 0;
            pristine.learn[j].forEach(id => CLASS_SPELL_LEARN_ORDER[j].push(id));
        });
    }

    function reprice(sp, mod) {
        if (mod && Object.prototype.hasOwnProperty.call(mod, 'kind') && typeof SIM_DEFAULTS !== 'undefined') {
            const sd = SIM_DEFAULTS[sp.kind];
            if (sd) {
                if (!Object.prototype.hasOwnProperty.call(mod, 'simTargeting')) sp.simTargeting = sd.simTargeting;
                if (!Object.prototype.hasOwnProperty.call(mod, 'simPhase')) sp.simPhase = sd.simPhase;
                if (!Object.prototype.hasOwnProperty.call(mod, 'simFallback')) sp.simFallback = sd.simFallback;
            }
        }
        if (typeof sp.manaCostOverride === 'number') { sp.cost = sp.manaCostOverride; return; }
        const explicitCost = mod && Object.prototype.hasOwnProperty.call(mod, 'cost');
        if (explicitCost) return;
        // Tree spells are position-priced — power edits never move their cost.
        const ringCost = (typeof getTreeRingCost === 'function') ? getTreeRingCost(sp.id) : null;
        if (ringCost != null) { sp.cost = ringCost; return; }
        const touchesPower = mod && POWER_FIELDS.some(f => Object.prototype.hasOwnProperty.call(mod, f));
        if (touchesPower && typeof computeSpellManaCost === 'function') {
            sp.cost = snapCostToLadder(computeSpellManaCost(sp));
        }
    }

    function applyDoc() {
        // deletions
        doc.deleted.forEach(id => {
            for (let i = SPELL_LIBRARY.length - 1; i >= 0; i--) if (SPELL_LIBRARY[i].id === id) SPELL_LIBRARY.splice(i, 1);
            Object.keys(RACE_ABILITIES).forEach(r => {
                const arr = RACE_ABILITIES[r];
                for (let i = arr.length - 1; i >= 0; i--) if (arr[i].id === id) arr.splice(i, 1);
            });
            delete SPELL_BY_ID[id];
            delete RACE_ABILITY_BY_ID[id];
            Object.keys(CLASS_SPELL_LEARN_ORDER).forEach(j => {
                const arr = CLASS_SPELL_LEARN_ORDER[j];
                for (let i = arr.length - 1; i >= 0; i--) if (arr[i] === id) arr.splice(i, 1);
            });
        });
        // additions
        Object.keys(doc.added).forEach(id => {
            if (doc.deleted.includes(id)) return;
            const def = JSON.parse(JSON.stringify(doc.added[id]));
            def.id = id;
            const home = def._home || { lib: true };
            delete def._home;
            if (home.race) {
                def._race = home.race;
                def._isRaceAbility = true;
                if (!RACE_ABILITIES[home.race]) RACE_ABILITIES[home.race] = [];
                RACE_ABILITIES[home.race].push(def);
                RACE_ABILITY_BY_ID[id] = def;
            } else {
                SPELL_LIBRARY.push(def);
            }
            SPELL_BY_ID[id] = def;
            if (typeof SIM_DEFAULTS !== 'undefined' && SIM_DEFAULTS[def.kind]) {
                const sd = SIM_DEFAULTS[def.kind];
                if (def.simTargeting == null) def.simTargeting = sd.simTargeting;
                if (def.simPhase == null) def.simPhase = sd.simPhase;
                if (def.simFallback == null) def.simFallback = sd.simFallback;
            }
            if (typeof def.manaCostOverride === 'number') def.cost = def.manaCostOverride;
            else if (typeof def.cost !== 'number' && typeof computeSpellManaCost === 'function') def.cost = snapCostToLadder(computeSpellManaCost(def));
        });
        // field mods
        Object.keys(doc.modified).forEach(id => {
            if (doc.deleted.includes(id)) return;
            const mod = doc.modified[id];
            const refs = refsFor(id);
            if (!refs.length) return;
            const base = fieldBase[id] = fieldBase[id] || {};
            const captureField = f => {
                if (base[f]) return;
                base[f] = refs.map(ref => ({
                    ref,
                    had: Object.prototype.hasOwnProperty.call(ref, f),
                    val: (() => { try { return JSON.parse(JSON.stringify(ref[f] === undefined ? null : ref[f])); } catch (e) { return ref[f]; } })(),
                }));
            };
            // reprice() may rewrite these even when the mod doesn't name them —
            // capture their originals up front so restoreAll() can undo them.
            ['cost', 'simTargeting', 'simPhase', 'simFallback'].forEach(captureField);
            Object.keys(mod).forEach(f => {
                captureField(f);
                refs.forEach(ref => {
                    if (mod[f] === null) delete ref[f];
                    else ref[f] = JSON.parse(JSON.stringify(mod[f]));
                });
            });
            refs.forEach(ref => reprice(ref, mod));
        });
        // learnset replacement (job -> ordered spell ids)
        Object.keys(doc.learnsets).forEach(j => {
            if (!CLASS_SPELL_LEARN_ORDER[j]) CLASS_SPELL_LEARN_ORDER[j] = [];
            const arr = CLASS_SPELL_LEARN_ORDER[j];
            arr.length = 0;
            doc.learnsets[j].forEach(id => {
                if (SPELL_BY_ID[id]) arr.push(id);
                else console.warn(`[SpellMods] learnset ${j}: unknown spell id '${id}' skipped`);
            });
        });
        // race movepool replacement (race -> ability def refs, by id)
        Object.keys(doc.raceAbilities).forEach(r => {
            if (!RACE_ABILITIES[r]) RACE_ABILITIES[r] = [];
            const arr = RACE_ABILITIES[r];
            arr.length = 0;
            doc.raceAbilities[r].forEach(id => {
                const def = RACE_ABILITY_BY_ID[id] || SPELL_BY_ID[id];
                if (def) arr.push(def);
                else console.warn(`[SpellMods] race ${r}: unknown spell id '${id}' skipped`);
            });
        });
    }

    function apply() {
        capturePristine();
        restoreAll();
        if (doc && doc.enabled) applyDoc();
        // Restamp tree-position costs LAST: learnset replacements change ring
        // positions, and a disabled/emptied doc must fall back to the boot
        // pricing. Costs the doc pins explicitly (cost / manaCostOverride
        // mods) are skipped; off-tree spells are never re-snapped here.
        if (typeof applyTreeRingCosts === 'function') {
            const pinned = new Set();
            if (doc && doc.enabled) {
                Object.keys(doc.modified).forEach(id => {
                    const m = doc.modified[id];
                    if (m && (Object.prototype.hasOwnProperty.call(m, 'cost')
                        || Object.prototype.hasOwnProperty.call(m, 'manaCostOverride'))) pinned.add(id);
                });
            }
            applyTreeRingCosts(pinned, false);
        }
    }

    function counts() {
        return {
            modified: Object.keys(doc.modified).length,
            added: Object.keys(doc.added).length,
            deleted: doc.deleted.length,
            learnsets: Object.keys(doc.learnsets).length,
            raceAbilities: Object.keys(doc.raceAbilities).length,
        };
    }

    // Human-readable changelog for the export (what Claude reads first).
    function summary() {
        const lines = [];
        Object.keys(doc.modified).forEach(id => {
            const mod = doc.modified[id];
            const base = fieldBase[id] || {};
            const parts = Object.keys(mod).map(f => {
                const orig = base[f] && base[f][0] ? (base[f][0].had ? JSON.stringify(base[f][0].val) : '(absent)') : '?';
                return `${f} ${orig} → ${mod[f] === null ? '(removed)' : JSON.stringify(mod[f])}`;
            });
            lines.push(`MODIFY ${id}: ${parts.join(', ')}`);
        });
        Object.keys(doc.added).forEach(id => {
            const d = doc.added[id];
            const home = d._home && d._home.race ? `race:${d._home.race}` : 'spell library';
            lines.push(`ADD ${id} ("${d.name}", kind:${d.kind}, ${home})`);
        });
        doc.deleted.forEach(id => lines.push(`DELETE ${id}`));
        Object.keys(doc.learnsets).forEach(j => lines.push(`LEARNSET ${j}: [${doc.learnsets[j].join(', ')}]`));
        Object.keys(doc.raceAbilities).forEach(r => lines.push(`RACE MOVEPOOL ${r}: [${doc.raceAbilities[r].join(', ')}]`));
        return lines;
    }

    function exportDoc() {
        const baseline = {};
        Object.keys(doc.modified).forEach(id => {
            const base = fieldBase[id];
            if (!base) return;
            baseline[id] = {};
            Object.keys(base).forEach(f => {
                baseline[id][f] = base[f][0] && base[f][0].had ? base[f][0].val : null;
            });
        });
        return {
            format: 'entropy-wars-spell-mods',
            exportedAt: new Date().toISOString(),
            build: (typeof window !== 'undefined' && window._EW_BUILD_TOKEN) || 'unknown',
            instructions: 'Hand this file to Claude: apply these diffs to data.js '
                + '(SPELL_LIBRARY / RACE_ABILITIES / CLASS_SPELL_LEARN_ORDER). '
                + 'baseline holds the pre-edit values for sanity-checking drift. '
                + 'modified are sparse field patches (null = remove field); added are full defs '
                + '(_home says where they live); learnsets/raceAbilities are full replacement id arrays.',
            summary: summary(),
            baseline,
            ...JSON.parse(JSON.stringify(doc)),
        };
    }

    function importDoc(obj) {
        if (!obj || typeof obj !== 'object') throw new Error('not an object');
        if (obj.format && obj.format !== 'entropy-wars-spell-mods') throw new Error('unrecognized format');
        const d = emptyDoc();
        ['enabled', 'notes'].forEach(k => { if (obj[k] !== undefined) d[k] = obj[k]; });
        ['modified', 'added', 'learnsets', 'raceAbilities'].forEach(k => { if (obj[k] && typeof obj[k] === 'object') d[k] = JSON.parse(JSON.stringify(obj[k])); });
        if (Array.isArray(obj.deleted)) d.deleted = obj.deleted.slice();
        doc = d;
        save();
        apply();
        return doc;
    }

    function reset() {
        doc = emptyDoc();
        save();
        apply();
    }

    // pristine (pre-mod) def VALUES for a spell id — a deep clone frozen at
    // boot, safe to diff against. Null when the id never existed.
    function pristineDef(id) {
        if (!pristine) return null;
        return pristine.defClones[id] || null;
    }

    function pristineState() { return pristine; }

    /* ── PRUNE — auto-clear change groups already baked into data.js ─────
       The overlay lives in localStorage; when an exported change set gets
       made permanent in data.js the stored diffs used to stay behind, so
       the UI reported them as "pending" forever (the stuck counter). This
       compares every stored group against the PRISTINE tables of the
       data.js that just loaded and drops whatever the code now ships:
       - modified: per-field — a stored value that now equals the shipped
         value is baked; a group with no live fields left is dropped.
       - added: the id now ships in data.js → drift between the stored def
         and the shipped def converts to a sparse `modified` patch (post-
         export tweaks survive), then the add is dropped.
       - deleted: the id no longer ships → baked.
       - learnsets / raceAbilities: full-array equality vs shipped order.
       Runs at boot before apply() and from the Spell Library's CLEAR
       APPLIED button. Returns { groups, fields } dropped. */
    function prune() {
        capturePristine();
        let groups = 0, fields = 0;
        const eq = (a, b) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
        Object.keys(doc.modified).forEach(id => {
            const pris = pristine.defClones[id];
            if (!pris) return;                    // not shipped (mods on an added spell) — keep
            const mod = doc.modified[id];
            Object.keys(mod).forEach(f => {
                const prisVal = Object.prototype.hasOwnProperty.call(pris, f) ? pris[f] : undefined;
                const baked = (mod[f] === null) ? prisVal === undefined : eq(mod[f], prisVal);
                if (baked) { delete mod[f]; fields++; }
            });
            // manaCostOverride rides cost edits — alone and matching the
            // shipped price, it's baked too
            if (Object.keys(mod).length === 1 && mod.manaCostOverride !== undefined
                && eq(mod.manaCostOverride, pris.manaCostOverride !== undefined ? pris.manaCostOverride : pris.cost)) {
                delete mod.manaCostOverride; fields++;
            }
            if (!Object.keys(mod).length) { delete doc.modified[id]; groups++; }
        });
        Object.keys(doc.added).forEach(id => {
            const pris = pristine.defClones[id];
            if (!pris) return;                    // still overlay-only — keep
            const stored = doc.added[id];
            const skip = { _home: 1, id: 1, _race: 1, _isRaceAbility: 1, simTargeting: 1, simPhase: 1, simFallback: 1 };
            const patch = {};
            Object.keys(stored).forEach(f => {
                if (skip[f]) return;
                const prisVal = Object.prototype.hasOwnProperty.call(pris, f) ? pris[f] : undefined;
                if (f === 'manaCostOverride' && eq(stored[f], pris.manaCostOverride !== undefined ? pris.manaCostOverride : pris.cost)) return;
                if (!eq(stored[f], prisVal)) { try { patch[f] = JSON.parse(JSON.stringify(stored[f])); } catch (e) {} }
            });
            delete doc.added[id];
            groups++;
            if (Object.keys(patch).length) doc.modified[id] = Object.assign(patch, doc.modified[id] || {});
        });
        doc.deleted = doc.deleted.filter(id => {
            if (!pristine.defClones[id] && !pristine.byId[id] && !pristine.raceById[id]) { groups++; return false; }
            return true;
        });
        Object.keys(doc.learnsets).forEach(j => {
            if (eq(doc.learnsets[j], pristine.learn[j] || [])) { delete doc.learnsets[j]; groups++; }
        });
        Object.keys(doc.raceAbilities).forEach(r => {
            const prisIds = (pristine.raceRefs[r] || []).map(a => a.id);
            if (eq(doc.raceAbilities[r], prisIds)) { delete doc.raceAbilities[r]; groups++; }
        });
        if (groups || fields) save();
        return { groups, fields };
    }

    try {
        load();
        capturePristine();
        const _pruned = prune();
        apply();
        if (_pruned.groups || _pruned.fields) {
            console.log(`[SpellMods] pruned ${_pruned.groups} change group(s) / ${_pruned.fields} field(s) already baked into data.js`);
        }
        const c = counts();
        if (c.modified || c.added || c.deleted || c.learnsets || c.raceAbilities) {
            console.log(`[SpellMods] ${doc.enabled ? 'Applied' : 'Loaded (DISABLED)'} — ${c.modified} modified, ${c.added} added, ${c.deleted} deleted, ${c.learnsets} learnsets, ${c.raceAbilities} race movepools`);
        }
    } catch (e) {
        console.error('[SpellMods] failed to apply stored spell mods — running vanilla', e);
        try { doc = emptyDoc(); pristine = null; fieldBase = {}; } catch (e2) {}
    }

    return {
        get doc() { return doc; },
        load, save, apply, reset, prune,
        counts, summary,
        export: exportDoc,
        import: importDoc,
        pristineDef, pristineState,
        LS_KEY: EW_SPELL_MODS_LS_KEY,
    };
})();

// ═══════════════════════════════════════════════════════════════════════════
// D.O.O.R. — Department of Orthogonal Realities (see DOOR_DESIGN.md)
// ═══════════════════════════════════════════════════════════════════════════
// DOOR is a LAYER on top of the game, not a vocabulary swap: Victory stays
// Victory, the Shop stays the Shop, the Codex stays the Codex. Everything the
// layer adds — seals, stamps, memos, the ID card, customs dispositions — reads
// its copy from THIS object so there is exactly one place to edit it.
// Consumers: ui.js (codex/shop/onboarding), party-builder.js (dossier),
// battle.js (loading screen + result stamp), profile.js (ID card), map.js
// (menu clearance strip). data.js loads first, so all of them can rely on it.
const DOOR_TEXT = {
    NAME: 'D.O.O.R.',
    FULL_NAME: 'DEPARTMENT OF ORTHOGONAL REALITIES',
    MOTTO: 'As here, so there',
    DOCTRINE: 'Parallel lines never meet. Adjacent realities meet at right angles — at corners. Do not stand in corners.',

    // The four hand-made seal exports on R2 (Assets/door/). Pick by background:
    //   onDark  — white text, no stroke → ONLY on black / near-black surfaces
    //   onLight — black text            → paper, cream, light surfaces
    //   onMid   — black text + black cube grid → mid-tone surfaces where the
    //             white grid lines would vanish (memo paper, tinted forms)
    //   mono    — solid black → government-doc look, and the alpha MASK for
    //             ink-tinted stamps (CSS mask-image + background = ink colour)
    LOGO: {
        onDark:  'https://cdn.entropywars.net/Assets/door/DOOR_Colored_Logo_ForBlackBG.png',
        onLight: 'https://cdn.entropywars.net/Assets/door/DOOR_Colored_Logo.png',
        onMid:   'https://cdn.entropywars.net/Assets/door/DOOR_ColoredAndBlackLines_Logo.png',
        mono:    'https://cdn.entropywars.net/Assets/door/DOOR_BlackAndWhite_Logo.png',
    },

    DEPARTMENTS: {
        customs:     { label: 'CUSTOMS & ADMISSIONS',  short: 'C&A',  desc: "The player's desk. Every crossing is inspected; every entity is filed." },
        continuity:  { label: 'BUREAU OF CONTINUITY',  short: 'BoC',  desc: 'The Canon Office. Owns the Mandela Effect. Retcon is a verb.' },
        engineering: { label: 'ARCANE ENGINEERING',    short: 'AE',   desc: 'Spells.' },
        records:     { label: 'RECORDS',               short: 'REC',  desc: 'The Codex. "We only keep the file."' },
        internal:    { label: 'INTERNAL AFFAIRS',      short: 'IA',   desc: 'The ones who know.' },
    },

    // Story progress on the ID card. NOT the ELO rank (Iron→Grandmaster stays).
    // Level thresholds/directives land with the story track (DOOR_DESIGN §4);
    // until then everyone is L1 and the card simply says so.
    CLEARANCE: [
        { level: 1, title: 'PROBATIONARY' },
        { level: 2, title: 'CLERK' },
        { level: 3, title: 'OFFICER' },
        { level: 4, title: 'INSPECTOR' },
        { level: 5, title: 'AUDITOR' },
        { level: 6, title: 'KEYHOLDER' },
    ],

    // The one optional intake question. Cosmetic: the card's colour stripe.
    DESKS: {
        space: { label: 'SPACE', color: '#5a8898', ink: '#2f5f73' },
        time:  { label: 'TIME',  color: '#b8a060', ink: '#7a6320' },
        chaos: { label: 'CHAOS', color: '#985050', ink: '#6e2c2c' },
    },

    // Customs disposition by entity type (first type wins; overrides below).
    CUSTOMS_BY_TYPE: {
        human:   'DOMESTIC',
        alien:   'FOREIGN NATIONAL',
        anomaly: 'UNDOCUMENTED',
        divine:  'DIPLOMATIC',
        unholy:  'DIPLOMATIC',
        tech:    'IMPORTED',
    },
    // Per-entity dispositions where the joke is better than the rule.
    CUSTOMS_OVERRIDES: {
        'santa clause':         { status: 'NATURALIZED',       note: 'over the objections of Customs, at the insistence of everyone else' },
        'honda civic':          { status: 'IMPORTED',          note: 'registration expired 2019 — it has been told' },
        'politician':           { status: 'DOMESTIC',          note: 'unfortunately' },
        'men in black':         { status: 'DOMESTIC',          note: 'DISPUTED — the other agency claims jurisdiction and has never filed a form' },
        'glitch':               { status: 'NON-CANON',         note: 'Bureau of Continuity, Exhibit A — ruled four times, keeps arriving' },
        'watcher':              { status: 'DIPLOMATIC',        note: 'immunity claimed; immunity under review; leave cancelled' },
        'machine elves':        { status: 'UNDOCUMENTED',      note: "the Department's first documented crossing (1971)" },
        'conspiracy theorist':  { status: 'DOMESTIC',          note: 'was right' },
        'annunaki':             { status: 'DIPLOMATIC',        note: 'claims to have built the desk' },
        'atlantean':            { status: 'DOMESTIC',          note: 'predates the Department; predates the form' },
        'dinosaur':             { status: 'UNDOCUMENTED',      note: 'temporal — no point of origin on file' },
        'ghost':                { status: 'DOMESTIC',          note: 'deceased; still filing' },
        'king arthur':          { status: 'DOMESTIC',          note: 'Britain, c. 520 CE — visa long expired' },
        'super sentai':         { status: 'IMPORTED',          note: 'five entities, one form' },
        'symbiote':             { status: 'UNDOCUMENTED',      note: 'two entities, one form — "we"' },
        'droid':                { status: 'IMPORTED',          note: 'classified as equipment. It has opinions about that.' },
        'orb of light':         { status: 'DIPLOMATIC',        note: 'origin above your clearance' },
        'grey':                 { status: 'FOREIGN NATIONAL',  note: 'frequent flyer' },
        'nordic':               { status: 'FOREIGN NATIONAL',  note: '"benevolent" — Customs recommends skepticism' },
        'martian':              { status: 'FOREIGN NATIONAL',  note: 'arrived armed; leaves armed' },
        'skinwalker':           { status: 'UNDOCUMENTED',      note: 'do not say the name on the form' },
        'black goo':            { status: 'UNDOCUMENTED',      note: 'three breaches this quarter' },
        'kaiju':                { status: 'UNDOCUMENTED',      note: 'the form was not big enough' },
        'demon':                { status: 'DIPLOMATIC',        note: 'terms of entry always favor the demon' },
        'djinn':                { status: 'DIPLOMATIC',        note: 'do not phrase the interview as a request' },
        'zombie':               { status: 'DOMESTIC',          note: 'deceased; not filing' },
        'werewolf':             { status: 'DOMESTIC',          note: 'by day' },
        'pirate':               { status: 'DOMESTIC',          note: 'legitimacy contested' },
        'cowboy':               { status: 'DOMESTIC',          note: 'never misses twice' },
        'quarterback':          { status: 'DOMESTIC',          note: 'went back to the huddle' },
        'general':              { status: 'DOMESTIC',          note: 'asked to see the org chart' },
        'antihero':             { status: 'DOMESTIC',          note: 'declined to align with any desk' },
        'mech':                 { status: 'IMPORTED',          note: 'pilot filed separately' },
        'robot':                { status: 'IMPORTED',          note: '47-year operational life; 47-year visa' },
        'ai':                   { status: 'IMPORTED',          note: 'gen-7; the form was filled in before we handed it over' },
    },

    // Where each entity crossed — one of the existing site maps, so the roster
    // and the map roster point at each other for free.
    POINT_OF_ENTRY: {
        'homosapien': 'Nuketown', 'pirate': 'Atlantis', 'swordfighter': 'Camelot', 'knight': 'Camelot',
        'shaman': 'Mount Shasta', 'mad scientist': 'D.U.M.B.', 'cowboy': 'Area 51', 'men in black': 'Area 51',
        'telepath': 'D.U.M.B.', 'marksman': 'Antarctica', 'priest': 'Vatican City', 'wizard': 'Stonehenge',
        'fortune teller': 'Bohemian Grove', 'giant': 'Göbekli Tepe', 'fairy': 'Fairy Forest', 'martian': 'Mars',
        'nordic': 'Antarctica', 'grey': 'Area 51', 'bigfoot': 'Mount Shasta', 'shadow entity': 'Backrooms',
        'reptilian': 'Hollow Earth', 'ai': 'Cyberpunk City', 'robot': 'Technoticlan', 'android': 'Cyberpunk City',
        'angel': 'Heaven', 'seraphim': 'Heaven', 'orb of light': 'Mount Olympus', 'demon': 'Hell',
        'succubus': 'Hell', 'skeleton': 'Hell', 'mech': 'Technoticlan', 'ghost': 'Backrooms',
        'zombie': 'Nuketown', 'annunaki': 'Pyramids of Giza', 'skinwalker': 'Skinwalker Ranch', 'werewolf': 'Fairy Forest',
        'gargoyle': 'Vatican City', 'djinn': 'Pyramids of Giza', 'anubis': 'Pyramids of Giza', 'catgirl': 'Cyberpunk City',
        'mantid': 'Moon', 'antperson': 'Hollow Earth', 'mothman': 'Skinwalker Ranch', 'siren': 'Atlantis',
        'scarecrow': 'Flat Lands', 'glitch': 'CERN', 'machine elves': 'CERN', 'cyclops': 'Mount Olympus',
        'cyborg': 'Technoticlan', 'demon prince': 'Hell', 'demon princess': 'Hell', 'dreameater': 'Backrooms',
        'fallen angel': 'Hell', 'goatman': 'Skinwalker Ranch', 'halfdemon': 'Hell', 'mermaid': 'Atlantis',
        'nephilim': 'Göbekli Tepe', 'vampire': 'Bohemian Grove', 'voidweaver': 'Moon', 'cosmic wraith': 'Mars',
        'superhero': 'Cyberpunk City', 'general': 'Nuketown', 'droid': 'Mars', 'antihero': 'Cyberpunk City',
        'conspiracy theorist': 'Area 51', 'overlord': 'Tower of Babel', 'chosen one': 'Mount Olympus', 'politician': 'Bohemian Grove',
        'atlantean': 'Atlantis', 'dinosaur': 'Hollow Earth', 'dragon': 'Camelot', 'ghoul': 'Hell',
        'gnome': 'Fairy Forest', 'kaiju': 'Antarctica', 'kraken': 'Atlantis', 'loch ness monster': 'Agartha',
        'yeti': 'Antarctica', 'barbarella': 'Moon', 'black goo': 'D.U.M.B.', 'golem': 'Tower of Babel',
        'honda civic': 'Nuketown', 'ice queen': 'North Pole', 'juggernaut': 'D.U.M.B.', 'ki fighter': 'Mount Shasta',
        'king arthur': 'Camelot', 'king kong': 'Hollow Earth', 'minotaur': 'Mount Olympus', 'necromancer': 'Stonehenge',
        'occulus': 'Backrooms', 'quarterback': 'Football Stadium', 'robinhood': 'Camelot', 'santa clause': 'North Pole',
        'super sentai': 'Technoticlan', 'symbiote': 'D.U.M.B.', 'valkraye': 'Heaven', 'watcher': 'Göbekli Tepe',
    },

    // "D.O.O.R. ANNOTATION" — an extra paragraph on the dossiers where the
    // Department has a point of view (the rival-relevant files).
    DOSSIER_NOTES: {
        'men in black': 'Customs status DISPUTED. The other agency claims these are "their people". They have never filed a form. They have never filed anything — 847 coverups and not one carbon copy. When they arrive on a scene, officers are to hand over nothing and remember everything. They will offer to help with the second part. Decline.',
        'conspiracy theorist': 'Cleared for employment; declined it. Subject\'s 73% accuracy is the highest of any outside analyst and lower than he believes. Has correctly named the Department on three podcasts. Records has asked us to stop sending him corrections — they only make his numbers go up.',
        'politician': 'Customs status DOMESTIC, unfortunately. Subject has never crossed anything. Subject was elected here. The Bureau of Continuity has ruled this canon four times. Each ruling felt worse than the last.',
        'general': 'The only entity on file who has asked to see the org chart. Was shown it. Asked which hand was which. Was not answered. Has not stopped asking. Loyalty assessment stands at ABSOLUTE; the question is to whom.',
        'glitch': 'Bureau of Continuity, Exhibit A. Ruled NON-CANON four times. Keeps arriving. Physical attacks pass through 73% of the time; forms pass through 100%. Officers who report having "seen this one before" have not. Do not stand in its corner.',
        'watcher': 'The Watcher has cancelled all leave. Internal Affairs notes that the Watcher has no authority to do this, and that leave nevertheless remains cancelled. "It is time to act" was addressed to no one in the room. Continuity has declined to rule on who it was addressed to.',
        'machine elves': 'Project ████████ (1971): the Department\'s first documented crossing, and the reason there is a Department. Revised finding: the entities were not the visitors. We were. They are still waiting for us to complete the second page.',
        'honda civic': 'IMPORTED. Registration expired 2019. It has been told. It parallel parked itself in space 4, which is not ours. Do not wash it either.',
        'santa clause': 'NATURALIZED over the objections of Customs, at the insistence of everyone else. He knew the desk numbers. He knew the founding date — all four of them. He gave the Director socks. They were the right size.',
        'annunaki': 'DIPLOMATIC. Claims to have built the first door, the first desk, and the first form. Continuity cannot rule this non-canon: the form in question is the one they would have to rule on.',
        'grey': 'FOREIGN NATIONAL, frequent flyer. Has crossed more times than any entity on file and has never once queued. Do not make sustained eye contact at the desk; the desk will fill itself in.',
    },

    // ── SITE FILES (match select + loading screen) ────────────────────────
    // One file per map, keyed by the MapForge id (Δ boards share their
    // parent's file — doorSiteFile() strips the `_delta` suffix).
    //   tone    — stamp ink: admit (green) · deny (red) · void (grey)
    //   status  — the rubber stamp beside the site name
    //   juris   — JURISDICTION line (short; who claims the crossing)
    //   summary — EXECUTIVE SUMMARY: the real place and its lore, loosely
    //             educational, one cheeky line. Short. Not about the Department.
    SITE_FILES: {
        prebuilt_shasta: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · Siskiyou County, California',
            summary: 'A 4,300 m stratovolcano in the Cascades, last erupted around 1250 and still rated active. Since the 1880s it has collected legends faster than snow: Lemurian survivors in tunnels beneath it, lenticular clouds mistaken for saucers, and a town below that sells crystals to both. Geologists rate the eruption risk "high". The gift shop rates it "good for business".' },
        prebuilt_stonehenge: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · Salisbury Plain, Wiltshire',
            summary: 'Raised in stages between roughly 3000 and 2000 BC and aligned to the midsummer sunrise and midwinter sunset. The bluestones were hauled some 230 km from Wales, which is either a feat of Neolithic engineering or a very long argument. Druids arrived two thousand years after the last stone went up. They have not been told.' },
        prebuilt_giza: { tone: 'admit', status: 'DIPLOMATIC', juris: 'Ministry of Antiquities · Customs by treaty',
            summary: 'The Great Pyramid was the tallest structure on Earth for 3,800 years: 2.3 million blocks, built c. 2560 BC, aligned to true north within a twentieth of a degree without a compass. Every century produces a new theory about who built it. The paperwork says the Egyptians. The paperwork is usually right.' },
        prebuilt_nuketown: { tone: 'deny', status: 'CONDEMNED', juris: 'Customs & Admissions · Nevada Test Site',
            summary: 'In 1955 the U.S. built a suburb in the Nevada desert, furnished it, stocked the fridges, filled it with mannequins and dropped a 29-kiloton bomb on it to see what would happen. The footage is still used to sell fallout shelters. The mannequins never filed a complaint. Some of them are still there.' },
        prebuilt_heaven: { tone: 'admit', status: 'DIPLOMATIC', juris: 'Foreign · immunity claimed',
            summary: 'Almost every culture on record put the afterlife of the good somewhere upward: Elysium, Valhalla, the Pure Land, a New Jerusalem with twelve gates of pearl. Dante gave it nine spheres and ran out of adjectives by the seventh. Entry requirements vary by jurisdiction. Nobody has ever been refunded.' },
        prebuilt_hell: { tone: 'deny', status: 'DIPLOMATIC', juris: 'Foreign · terms of entry favour the resident',
            summary: 'Gehenna was a real valley outside Jerusalem where the refuse burned; the name did the rest. Dante mapped nine descending circles in 1320 and populated them with his enemies, still the most efficient use of a poem on record. The sulphur, the lake of fire and the frozen traitors were added over the centuries. The lawyers were there from the start.' },
        prebuilt_cyberpunk: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · disputed by the corporations',
            summary: 'A genre before it was a place. William Gibson coined "cyberspace" in 1982 on a manual typewriter, and Blade Runner put the rain, the neon and the noodle bars on screen the same year. Every city in the genre is Tokyo and Los Angeles arguing in the dark. The future arrived on schedule. It went to the wrong postcode.' },
        prebuilt_camelot: { tone: 'admit', status: 'ACTIVE CROSSING', juris: "Customs & Admissions · the Crown's claim lapsed c. 540",
            summary: "Arthur's court is first named in a 12th-century French romance, four hundred years after he supposedly ruled. Candidates for the real site include Cadbury Castle, Caerleon, Tintagel and Winchester, which keeps a Round Table on the wall that carbon-dates to the 1270s. The table is round so that no knight sits at the head. Somebody was paying attention." },
        prebuilt_stadium: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions on game day · the league otherwise',
            summary: 'A field 120 yards long, marked every five, watched by 70,000 people in the seats and a hundred million more at home. The Super Bowl is the most-watched broadcast in the United States most years, and its commercials cost more per second than most films. The ball is not shaped like a foot. Nobody has explained this.' },
        prebuilt_atlantis: { tone: 'deny', status: 'SUBMERGED', juris: 'Atlantean · predates the Department',
            summary: 'Plato invented Atlantis around 360 BC as a cautionary tale: a proud island empire sunk by the gods in a single day and night. He said it was a story. Nobody listened. Two thousand years of expeditions have placed it in the Aegean, the Atlantic, Antarctica and, briefly, Wisconsin. The moral remains undiscovered.' },
        prebuilt_babel: { tone: 'deny', status: 'CONDEMNED', juris: 'Bureau of Continuity · linguistic drift, case open',
            summary: 'Genesis 11: humanity builds a tower to reach heaven and is scattered into mutually unintelligible languages for the ambition. The likely model is Etemenanki, a 90-metre ziggurat in Babylon that Alexander the Great tried to rebuild and gave up on. Linguists count about 7,000 living languages. Every one of them has a word for "unfinished".' },
        prebuilt_olympus: { tone: 'admit', status: 'DIPLOMATIC', juris: 'Foreign · the residents claim to be the concept',
            summary: "Greece's highest mountain at 2,918 m, and the registered address of twelve gods who spent most of their time elsewhere. The first recorded ascent was in 1913, by which point the tenants had been gone for some centuries. Zeus threw lightning from the summit. The summit now has a refuge hut and a small fee." },
        prebuilt_mars: { tone: 'deny', status: 'FOREIGN TERRITORY', juris: 'Martian · treaty of 1976, photograph disputed',
            summary: 'Half the size of Earth, with a day of 24 hours 37 minutes and a year of 687 days. Percival Lowell mapped canals on it in 1895 that were not there; Viking 1 photographed a face on it in 1976 that was not there either. Rovers have been driving on it since 1997. Every one of them was left behind.' },
        prebuilt_area51: { tone: 'deny', status: 'DISPUTED', juris: 'The other agency · never filed',
            summary: 'An Air Force test range beside a dry lake bed in Nevada: home of the U-2 in 1955, then the SR-71, then the F-117. The government did not admit it existed until 2013. Roswell is 1,400 km away, which has never stopped anyone. The saucer, if there is one, has better clearance than you.' },
        prebuilt_antarctica: { tone: 'deny', status: 'SEALED · BREACHED', juris: 'Antarctic Treaty of 1959 · Customs by icebreaker',
            summary: "The coldest, driest, windiest continent, holding 70% of the world's fresh water as ice up to 4.8 km thick. Fifty-six countries have agreed since 1959 to use it only for science, the longest anyone has agreed on anything. Lovecraft put the Elder Things under the mountains in 1936. The scientists have not looked." },
        prebuilt_skinwalker: { tone: 'deny', status: 'UNDOCUMENTED', juris: 'Customs & Admissions, from the road',
            summary: "A 512-acre ranch in Utah's Uinta Basin with a résumé of cattle mutilations, orbs and things seen leaving. The Ute were warning outsiders off it long before a private research institute bought it in 1996 and installed the cameras. The cameras have seen a great deal. None of it has held up. The name is not said in full." },
        prebuilt_hollow_earth: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · disputed from below',
            summary: "Edmond Halley, of the comet, proposed in 1692 that the Earth was a set of nested shells with room to live in between. The idea outlived him by centuries: polar openings, an inner sun, Admiral Byrd's \"lost diary\" and a lizard aristocracy in the basement. The Earth is, disappointingly, solid. The basement is not on the survey." },
        prebuilt_fairy_forest: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'The Fae Court · do not agree to anything',
            summary: 'Every folklore has them: the sídhe of Ireland, the huldra of Norway, the changelings left in cradles. Rings of mushrooms mark where they danced, and stepping inside was a reliable way to lose a year. In 1917 two girls in Cottingley photographed fairies made of paper and fooled Arthur Conan Doyle. Do not give them your name.' },
        prebuilt_moon: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · the other agency claims the flag',
            summary: "384,000 km away, one-sixth of Earth's gravity, and leaving at 3.8 cm a year. Twelve people have walked on it, all between 1969 and 1972; the flags they planted have bleached white in the sun. The monolith is Arthur C. Clarke's. It has always been that size. Officers who remember otherwise are correct and should not be." },
        prebuilt_technoticlan: { tone: 'admit', status: 'IMPORTED', juris: 'Customs & Admissions · the altar files its own forms',
            summary: 'Tenochtitlan was built on a lake in 1325 with causeways, aqueducts and floating gardens, and held 200,000 people when Cortés arrived, more than any city in Spain. The Mexica ran it on a 260-day calendar and a great deal of obsidian. Someone has since added neon. The canals still work.' },
        prebuilt_agartha: { tone: 'admit', status: 'DIPLOMATIC', juris: 'The Agarthan Council · Customs by invitation',
            summary: 'A 19th-century occult invention: a kingdom inside the Earth, ruled from Shambhala by a King of the World and described in detail by people who had not been there. Its capital sits under Tibet, or Mount Shasta, or the Rockies, depending on the author. It has a sun inside it, reportedly. The postcards are lovely.' },
        prebuilt_vatican: { tone: 'admit', status: 'DIPLOMATIC', juris: 'Foreign · the smallest, by treaty of 1929',
            summary: "The world's smallest state at 0.49 km², with about 800 residents, its own post office and a Swiss army founded in 1506. Caligula hauled the obelisk from Egypt; Bernini's colonnade around it is two arms meant to embrace the crowd. The Secret Archive runs to 85 km of shelving. It was renamed \"Apostolic\" in 2019. Nothing else changed." },
        prebuilt_bohemian_grove: { tone: 'deny', status: 'MEMBERS ONLY', juris: 'Disputed · the members believe they are the jurisdiction',
            summary: 'A 2,700-acre redwood camp in Sonoma County where, since 1872, the powerful have spent two weeks each July in tents with names like "Mandalay". The opening ceremony burns an effigy of Care before a 12-metre concrete owl. The Manhattan Project was planned at one of its lodges in 1942. "Weaving spiders come not here", says the motto. They come anyway.' },
        prebuilt_gobekli: { tone: 'admit', status: 'ACTIVE CROSSING', juris: 'Customs & Admissions · predates every other claim',
            summary: 'Rings of carved T-shaped pillars in southeast Turkey raised around 9500 BC, six thousand years before Stonehenge and before anyone had invented pottery, writing or the wheel. It was deliberately buried a millennium later, which is why it survived. Hunter-gatherers built a temple before they built a farm. The Watcher has always stood here.' },
        prebuilt_dumb: { tone: 'deny', status: 'QUARANTINED', juris: 'Nobody claims it · everybody has a badge',
            summary: 'Deep Underground Military Bases: the theory that a network of secret installations runs beneath the American West, linked by tunnels and staffed by whoever is currently unpopular. Cheyenne Mountain and Raven Rock are real and admit it. Dulce, New Mexico, does not. Level 4 does not exist. Stop asking.' },
        prebuilt_cern: { tone: 'deny', status: 'DISPUTED', juris: 'Claimed by CERN · credited to the wrong one',
            summary: 'A 27 km ring of superconducting magnets 100 m under the Franco-Swiss border, colliding protons at 99.9999991% of the speed of light. It found the Higgs boson in 2012 and invented the World Wide Web in 1989, largely by accident. The internet is convinced it also opens portals. The Department does not say "portals".' },
        prebuilt_backrooms: { tone: 'void', status: 'NON-CANON', juris: 'Bureau of Continuity, who would like it back',
            summary: 'Born on a forum thread in 2019 from a single photograph of a yellow office: clip out of reality in the wrong place and you land in 600 million square miles of damp carpet, hum and fluorescent light. Level 0 has no exits. The photo was traced in 2024 to a former furniture showroom in Wisconsin, which explained nothing. You have already been here.' },
        prebuilt_northpole: { tone: 'admit', status: 'NATURALIZED', juris: 'Him · Customs by invitation, cookies provided',
            summary: 'Sea ice over 4,000 m of ocean: no land, no time zone, six months of night. Peary claimed it in 1909, Amundsen flew over it in 1926 and a nuclear submarine surfaced through it in 1959. The workshop was put here by Thomas Nast in 1866, in a cartoon, because nobody could check. Nobody has.' },
        prebuilt_flatlands: { tone: 'void', status: 'UNDER OBSERVATION', juris: 'Unknown · the eyes have not filed',
            summary: "Edwin Abbott's 1884 satire imagined a two-dimensional world where women are lines, priests are circles and a visiting sphere is arrested for heresy. Out here it is a plane, two shallow dips and a dead tree. Kansas, for reference, has been measured as flatter than a pancake. You are being watched. The tree is not." },
        clash_stage: { tone: 'deny', status: 'SEALED', juris: 'Arcane Engineering · they built the floor',
            summary: 'Consecrated flagstones and two rows of combatants who do not move, in the tradition of every turn-based battle since 1987. Temples of antiquity kept their holy ground roped off for much the same reason. Guard is a verb here.' },
        prebuilt_custommap: { tone: 'void', status: 'UNFILED', juris: 'Yours',
            summary: 'A site that exists because someone drew it in the editor. No history, no legend, no file. Either the most dangerous crossing on record or a very nice lake.' },
        // any map without a file (community maps, editor tests)
        _default: { tone: 'void', status: 'UNFILED', juris: 'Pending',
            summary: 'No file exists for this site. Either nobody has crossed here, or everyone has and nobody came back to write it up.' },
    },
    SITE_FILE_LABELS: { summary: 'EXECUTIVE SUMMARY', crossings: 'KNOWN CROSSINGS', juris: 'JURISDICTION', first: 'FIRST DOCUMENTED CROSSING' },

    // Loading-screen cards. A memo's stamp tells you which hand wrote it —
    // early on every memo is DENY; ADMIT memos (admit:true) only appear once
    // the player's clearance reaches L4 (story track, DOOR_DESIGN §3.3 / §4).
    MEMOS: [
        { q: 'The break room is not a designated crossing point. Stop using it as one.' },
        { q: 'Whoever propped the Hollow Earth door open with a fire extinguisher: we know. Put it back.' },
        { q: 'The black sedans in spaces 1–4 are not ours. Do not wash them. Do not lean on them. Do not wave.' },
        { q: "CERN's press release of the 14th is NON-CANON. Do not forward. Do not 'like'." },
        { q: "Reminder: the word is CROSSING. 'Portal' is a Swiss word. It will be red-penned." },
        { q: 'Do not stand in corners. This is not a metaphor. Facilities is aware the new wing has four of them.' },
        { q: 'Entities cannot be filed until they have been tested in the field. That is what the field is for. That is what you are for.' },
        { q: "Lost card fee is 5,000 Hazard Pay. Officers who 'found it in a different reality' still owe 5,000 Hazard Pay." },
        { q: 'The Watcher has cancelled all leave. The Watcher is not in your chain of command. Leave remains cancelled anyway.' },
        { q: 'The Santa file reads FRIENDLY BUT UNCONTAINABLE. Stop asking Records to change it to CONTAINABLE BUT FRIENDLY. It is not funnier.' },
        { q: 'Vending machine B dispenses from a reality where the snacks are slightly different. Consume at own risk. Report the bears.' },
        { q: 'Do not look directly at a corner. If you have already looked, file Form 90 and do not look again.' },
        { q: 'Orientation Tape 1 is missing. If you have it: be kind, rewind, return it to Records.' },
        { q: 'The other agency has requested our files on the Roswell crossing. They may have them. In 1947. In that order.' },
        { q: "'Parallel universe' is a comforting fiction. Parallel lines never meet. Ours do. That is the job." },
        { q: "Politician file: stop adding 'unfortunately' to the customs status. It is already on the form. It stays on the form." },
        { q: 'Re: the Honda Civic. Registration expired 2019. It has been told.' },
        { q: "Hold music is being updated. 'Your crossing is important to us' will remain." },
        { q: 'Personnel are reminded that "orthogonal" is a technical term and not an insult. Personnel are reminded to stop using it as one.' },
        { q: 'The Department was not founded to fight the war. The Department processes it. Please process it faster.' },
        { q: 'Every crossing pays a duty. Keep the doors open.', admit: true, s: '(unsigned)' },
        { q: 'The schedule is the schedule. Do not ask Continuity why the breaches are punctual.', admit: true, s: '(unsigned)' },
        { q: 'Whoever is filing the Entropy Strike residue under "weather": thank you. Continue.', admit: true, s: '(unsigned)' },
    ],
    CANON_NOTICES: [
        { q: 'Effective immediately, the Berenstein spelling is non-canon. Update your files. Do not discuss.' },
        { q: 'The Department was founded in 1954. Disregard the memo of the 3rd stating 1974.' },
        { q: 'Correction to the notice of the 9th: the Department was founded in 1947. Disregard the notice of the 9th.' },
        { q: 'Further correction: 1987. Officers who remember reading 1954 should report for re-filing, not to Optometry.' },
        { q: 'The interaction point at CERN is a door. CERN\'s account of it is a press release. Only one of these is canon.' },
        { q: 'A round room has no corners. This is why Department facilities are round. It is not a design choice. It is policy.' },
        { q: 'The Mandela Effect is DRIFT. Drift is a maintenance issue. Continuity is Maintenance. Please stop calling us Janitorial.' },
        { q: 'Entropy Strikes leave residue. Residue is drift. Drift is our problem. Strike responsibly.' },
        { q: 'The Glitch has been ruled NON-CANON four times. It keeps arriving. This is under review. The review is under review.' },
        { q: "'Retcon' is a verb, a form, and a department. Use all three correctly." },
        { q: 'The moon has always been that size. Officers who remember otherwise are correct and should not be.' },
        { q: 'Every battle happens somewhen between 12500 BC and 3333 AD. Dates outside this window are drift. Report them.' },
        { q: 'The loading screen\'s date is canon at time of printing and subject to revision at time of reading.' },
    ],

    // Copy for surfaces that already exist (voice, not renaming).
    ONBOARD: {
        kicker: 'D.O.O.R. · CUSTOMS & ADMISSIONS',
        title: 'Your First Vessel Is Issued',
        body: 'Welcome, officer. The Department issues every new hire one <b style="color:#9ad0ff">free declassification token</b> 🎟. Spend it on <i>any</i> entity in the registry — even the files we are not supposed to have — and it is reassigned to your desk.',
        go: 'Open the Registry',
        later: 'File It Later',
    },
    INTAKE: {
        kicker: 'D.O.O.R. · CUSTOMS & ADMISSIONS · NEW HIRE',
        title: 'EMPLOYEE IDENTIFICATION · NEW ISSUE',
        callsign: 'CALLSIGN',
        desk: 'DESK ASSIGNMENT',
        mandela: 'Have you experienced a Mandela Effect?',
        submit: 'ISSUE CARD',
        cancel: 'CANCEL',
        finePrint: 'LAMINATE BEFORE USE · CARD REMAINS PROPERTY OF THE DEPARTMENT · DO NOT STAND IN CORNERS',
        photoPending: 'PHOTO PENDING',
    },
    SYSTEM: {
        badCallsign: 'FORM REJECTED: callsign must be 2–16 characters (letters / numbers / underscores).',
        slotsFull: 'FORM REJECTED: all 3 card slots are issued. Surrender a card first.',
        lostCard: 'LOST CARD FEE: 5,000 Hazard Pay. The fee is never collected. The card is never found.',
    },
    RESULT_STAMP: { victory: 'CASE CLOSED', defeat: 'CASE CLOSED', noContest: 'VOID' },
    CANON_DATE_LABEL: 'CANON DATE · SUBJECT TO REVISION',
};

/* Customs disposition for a race: {status, note}. Overrides first, then the
   entity's primary type. */
function doorCustomsStatus(race) {
    const ov = DOOR_TEXT.CUSTOMS_OVERRIDES[race];
    if (ov) return { status: ov.status, note: ov.note || '' };
    const prof = (typeof RACE_PROFILES !== 'undefined') ? RACE_PROFILES[race] : null;
    const t = (prof && prof.types && prof.types[0]) || 'anomaly';
    return { status: DOOR_TEXT.CUSTOMS_BY_TYPE[t] || 'UNDOCUMENTED', note: '' };
}
function doorPointOfEntry(race) {
    return DOOR_TEXT.POINT_OF_ENTRY[race] || 'UNKNOWN';
}
/* Site file for a map (match select dossier + loading-screen card). Δ boards
   share their parent's file; unknown ids get the _default file. Returns
   {tone, status, juris, summary, id, known:boolean}. */
function doorSiteFile(modeId) {
    const S = DOOR_TEXT.SITE_FILES;
    let id = String(modeId || '').replace(/_delta$/, '');
    const f = S[id] || null;
    return Object.assign({ id: id, known: !!f }, f || S._default);
}
/* Entities whose POINT OF ENTRY is this site (by map label, Δ suffix
   stripped) — the roster and the map roster point at each other for free. */
function doorSiteCrossings(mapLabel) {
    const lbl = String(mapLabel || '').replace(/\s*Δ$/, '').trim();
    if (!lbl) return [];
    const out = [];
    for (const race in DOOR_TEXT.POINT_OF_ENTRY) {
        if (DOOR_TEXT.POINT_OF_ENTRY[race] === lbl) out.push(race);
    }
    return out;
}
/* Stable "first documented crossing" canon date per site (FNV of the id →
   the same 12500 BC … 3333 AD window as everything else). Subject to revision. */
function doorSiteCanonDate(modeId) {
    const seed = String(modeId || 'site').replace(/_delta$/, '');
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return doorCanonDate((h % (12500 + 3333 + 1)) - 12500);
}
/* Case/doc number shared by the codex, the party-builder dossier and the
   result stamp (same hash the codex has always used). */
function doorCaseNo(seed) {
    const s = String(seed || '');
    return 'EW-' + (Math.abs(s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7) % 9000 + 1000);
}
/* Employee number printed on the ID card — derived from the profile's
   createdAt (no new input). Stable for the life of the profile. */
function doorEmployeeNo(profile) {
    const seed = (profile && (profile.createdAt || profile.username)) || 'PENDING';
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const n = String(h % 1000000).padStart(6, '0');
    return n.slice(0, 3) + '-' + n.slice(3);
}
/* Story clearance from the profile's door field (L1 until the story track
   lands). Returns {level, title}. */
function doorClearance(profile) {
    const lv = Math.max(1, Math.min(DOOR_TEXT.CLEARANCE.length, (profile && profile.door && profile.door.clearance) | 0 || 1));
    return DOOR_TEXT.CLEARANCE[lv - 1];
}
/* Canon date for stamps/cards — every battle happens somewhen between
   12500 BC and 3333 AD (battle.js _lsRandomYear uses the same window). */
function doorCanonDate(seedYear) {
    const yr = (typeof seedYear === 'number') ? seedYear : Math.floor(Math.random() * (12500 + 3333 + 1)) - 12500;
    if (yr < 0) return (-yr) + ' BC';
    if (yr === 0) return '1 AD';
    return yr + ' AD';
}
if (typeof window !== 'undefined') {
    window.DOOR_TEXT = DOOR_TEXT;
    window.doorCustomsStatus = doorCustomsStatus;
    window.doorPointOfEntry = doorPointOfEntry;
    window.doorSiteFile = doorSiteFile;
    window.doorSiteCrossings = doorSiteCrossings;
    window.doorSiteCanonDate = doorSiteCanonDate;
    window.doorCaseNo = doorCaseNo;
    window.doorEmployeeNo = doorEmployeeNo;
    window.doorClearance = doorClearance;
    window.doorCanonDate = doorCanonDate;
}
