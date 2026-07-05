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

const FLYING_ALTITUDE_CONFIG = {
    apCost: 1,
    maxPerTurn: 3,
    minClearance: 2,
    maxAltitudeAboveGround: 8,
};

const EQUIPMENT_SLOTS = ['accessory1', 'accessory2'];

const EQUIP_DEFS = {
    'binoculars': { slot: 'accessory1', label: 'Binoculars', desc: '+2 vision range. See further across the battlefield.', stat: 'awr', statVal: 2 },
    'walkie_talkie': { slot: 'accessory1', label: 'Walkie Talkie', desc: 'Extends communication range with allies.', stat: 'awr', statVal: 1 },
    'flair': { slot: 'accessory1', label: 'Signal Flare', desc: 'One-use flare to reveal an area of the map.', stat: 'awr', statVal: 1 },
    'ward': { slot: 'accessory1', label: 'Ward Totem', desc: 'Deployable ward that grants vision in an area.', stat: 'awr', statVal: 1 },
    'telescope': { slot: 'accessory1', label: 'Telescope', desc: 'Long-range scouting tool. Reveals distant tiles.', stat: 'awr', statVal: 2 },
    'jetpack': { slot: 'accessory1', label: 'Jetpack', desc: 'Fly to the sky without nexus control. Ignores terrain movement cost.', stat: 'move', statVal: 1 },
    'spelunking_gear': { slot: 'accessory1', label: 'Spelunking Gear', desc: 'Descend underground without nexus control. +1 AWR.', stat: 'awr', statVal: 1 },
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
    crystal:'rgba(160,120,220,0.46)', poison:'rgba(95,170,70,0.46)', poison_bog:'rgba(70,140,80,0.5)',
    // ── Cave ──
    cave_floor:'rgba(80,70,60,0.46)', cave_wall:'rgba(60,50,45,0.56)', cave_entrance:'rgba(70,60,50,0.5)',
    // ── Built / urban ──
    bricks_1:'rgba(150,100,70,0.46)', bricks_2:'rgba(140,90,65,0.46)', wood_planks:'rgba(160,120,70,0.45)',
    wood:'rgba(140,100,60,0.42)', urban_wall:'rgba(100,95,100,0.5)', urban_street:'rgba(130,125,120,0.42)',
    marble:'rgba(226,222,214,0.46)', marble_2:'rgba(210,206,198,0.46)', cobblestone:'rgba(120,116,110,0.46)',
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
    flesh_3:'rgba(150,60,70,0.46)',
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
                    clearStatus(unit, 'lava_burn');
                }
                return null;
            }

            if (canFly(unit)) return null;

            unit._lavaBurnStacks = (unit._lavaBurnStacks || 0) + 1;
            const status = ensureUnitStatus(unit);
            status.lava_burn = 3;
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
    drywall:    { label: 'Drywall',     short: 'DRY', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_2:  { label: 'Drywall II',  short: 'DY2', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_3:  { label: 'Drywall III', short: 'DY3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    drywall_4:  { label: 'Drywall IV',  short: 'DY4', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } },
    metal_3:    { label: 'Metal Grate III', short: 'MT3', passable: true, moveCost: 1, blocksRanged: false, healMultiplier: 1, endTurn(unit) { return null; } }
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
        types: ['human', 'divine']
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
        label: 'Honda Civic',
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

const AVAILABLE_RACES = ['homosapien', 'pirate', 'knight', 'shaman', 'mad scientist', 'cowboy', 'men in black', 'telepath', 'marksman', 'priest', 'wizard', 'fortune teller', 'giant', 'fairy', 'martian', 'nordic', 'grey', 'bigfoot', 'shadow entity', 'reptilian', 'ai', 'robot', 'android', 'angel', 'seraphim', 'orb of light', 'demon', 'succubus', 'skeleton', 'mech', 'ghost', 'zombie', 'annunaki', 'skinwalker', 'werewolf', 'gargoyle', 'djinn', 'anubis', 'catgirl', 'mantid', 'antperson', 'mothman', 'siren', 'scarecrow', 'glitch', 'machine elves', 'cyclops', 'cyborg', 'demon prince', 'demon princess', 'dreameater', 'fallen angel', 'goatman', 'halfdemon', 'mermaid', 'nephilim', 'vampire', 'voidweaver', 'cosmic wraith', 'superhero', 'general', 'droid', 'antihero', 'conspiracy theorist', 'overlord', 'chosen one', 'politician', 'atlantean', 'dinosaur', 'dragon', 'ghoul', 'gnome', 'kaiju', 'kraken', 'loch ness monster', 'yeti', 'barbarella', 'black goo', 'golem', 'honda civic', 'ice queen', 'juggernaut', 'ki fighter', 'king arthur', 'king kong', 'minotaur', 'necromancer', 'occulus', 'quarterback', 'robinhood', 'santa clause', 'super sentai', 'symbiote', 'valkraye', 'watcher'];

const RACE_DEFAULT_JOBS = {
    'giant': 'Warrior',
    'skeleton': 'Warrior',
    'robot': 'Warrior',
    'nordic': 'Warrior',
    'angel': 'White Mage',
    'fairy': 'White Mage',
    'ghost': 'White Mage',
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
    'pirate': 'Raider',
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
    'cyclops': 'Raider',
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
    'loch ness monster': 'Warrior',
    'yeti': 'Harvester',

    'barbarella': 'Agent',
    'black goo': 'Psychic',
    'golem': 'Warrior',
    'honda civic': 'Engineer',
    'ice queen': 'Black Mage',
    'juggernaut': 'Raider',
    'ki fighter': 'Raider',
    'king arthur': 'Warrior',
    'king kong': 'Harvester',
    'minotaur': 'Raider',
    'necromancer': 'Black Mage',
    'occulus': 'Harbinger',
    'quarterback': 'Sniper',
    'robinhood': 'Sniper',
    'santa clause': 'White Mage',
    'super sentai': 'Warrior',
    'symbiote': 'Agent',
    'valkraye': 'Warrior',
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
    'ghost': 'healer',
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
    'juggernaut': 'bruiser',
    'ki fighter': 'bruiser',
    'king arthur': 'tank',
    'king kong': 'bruiser',
    'minotaur': 'bruiser',
    'necromancer': 'caster',
    'occulus': 'support',
    'quarterback': 'ranged',
    'robinhood': 'ranged',
    'santa clause': 'support',
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

const RACE_BASE_STATS = {

    'giant':         { hp: 635, mp: 60,  atk: 40, def: 48, mdef: 16, move: 2, awr: 2, int: 10, spd: 3 },
    'robot':         { hp: 620, mp: 65,  atk: 44, def: 55, mdef: 14, move: 2, awr: 3, int: 8,  spd: 3 },
    'mech':          { hp: 630, mp: 68,  atk: 38, def: 50, mdef: 14, move: 2, awr: 2, int: 8,  spd: 2 },
    'gargoyle':      { hp: 585, mp: 90,  atk: 48, def: 44, mdef: 20, move: 2, awr: 3, int: 18, spd: 4 },
    'zombie':        { hp: 660, mp: 50,  atk: 36, def: 44, mdef: 13, move: 2, awr: 1, int: 5,  spd: 2 },
    'cyclops':       { hp: 630, mp: 62,  atk: 48, def: 45, mdef: 14, move: 2, awr: 3, int: 8,  spd: 6 },

    'skeleton':      { hp: 570, mp: 95,  atk: 72, def: 28, mdef: 22, move: 3, awr: 2, int: 22, spd: 8 },
    'demon':         { hp: 580, mp: 90,  atk: 72, def: 28, mdef: 22, move: 2, awr: 2, int: 22, spd: 4 },
    'bigfoot':       { hp: 605, mp: 78,  atk: 68, def: 30, mdef: 17, move: 2, awr: 2, int: 12, spd: 3 },
    'antperson':     { hp: 565, mp: 105, atk: 64, def: 28, mdef: 24, move: 2, awr: 3, int: 26, spd: 7 },
    'werewolf':      { hp: 575, mp: 95,  atk: 76, def: 24, mdef: 18, move: 3, awr: 3, int: 15, spd: 9 },

    'angel':         { hp: 480, mp: 195, atk: 22, def: 30, mdef: 42, move: 2, awr: 4, int: 59, spd: 8 },
    'ghost':         { hp: 485, mp: 192, atk: 22, def: 28, mdef: 42, move: 3, awr: 4, int: 58, spd: 8 },

    'nordic':        { hp: 535, mp: 142, atk: 44, def: 34, mdef: 29, move: 2, awr: 3, int: 35, spd: 5 },
    'fairy':         { hp: 466, mp: 208, atk: 24, def: 22, mdef: 44, move: 4, awr: 5, int: 62, spd: 9 },
    'scarecrow':     { hp: 530, mp: 152, atk: 36, def: 33, mdef: 32, move: 2, awr: 2, int: 40, spd: 5 },
    'grey':          { hp: 465, mp: 208, atk: 22, def: 24, mdef: 46, move: 2, awr: 6, int: 65, spd: 8 },
    'succubus':      { hp: 492, mp: 182, atk: 32, def: 26, mdef: 40, move: 2, awr: 3, int: 55, spd: 8 },
    'orb of light':  { hp: 445, mp: 228, atk: 20, def: 22, mdef: 49, move: 2, awr: 6, int: 70, spd: 7 },
    'mothman':       { hp: 502, mp: 178, atk: 28, def: 26, mdef: 38, move: 2, awr: 6, int: 50, spd: 8 },
    'siren':         { hp: 488, mp: 190, atk: 28, def: 25, mdef: 41, move: 2, awr: 3, int: 56, spd: 8 },

    'android':       { hp: 518, mp: 142, atk: 60, def: 24, mdef: 31, move: 3, awr: 5, int: 39, spd: 9 },
    'shadow entity': { hp: 496, mp: 162, atk: 58, def: 20, mdef: 35, move: 4, awr: 5, int: 45, spd: 10 },
    'reptilian':     { hp: 535, mp: 128, atk: 68, def: 26, mdef: 27, move: 2, awr: 4, int: 30, spd: 7 },
    'catgirl':       { hp: 508, mp: 152, atk: 62, def: 24, mdef: 31, move: 3, awr: 4, int: 38, spd: 9 },
    'mantid':        { hp: 490, mp: 168, atk: 60, def: 22, mdef: 34, move: 3, awr: 5, int: 44, spd: 8 },
    'skinwalker':    { hp: 508, mp: 152, atk: 62, def: 30, mdef: 31, move: 3, awr: 5, int: 39, spd: 9 },

    'seraphim':      { hp: 445, mp: 228, atk: 22, def: 22, mdef: 48, move: 2, awr: 4, int: 69, spd: 8 },
    'djinn':         { hp: 462, mp: 208, atk: 26, def: 28, mdef: 45, move: 2, awr: 3, int: 63, spd: 8 },
    'anubis':        { hp: 458, mp: 212, atk: 24, def: 28, mdef: 46, move: 2, awr: 4, int: 66, spd: 6 },

    'martian':       { hp: 505, mp: 155, atk: 62, def: 27, mdef: 31, move: 2, awr: 4, int: 38, spd: 7 },
    'annunaki':      { hp: 510, mp: 158, atk: 48, def: 32, mdef: 28, move: 2, awr: 3, int: 32, spd: 5 },

    'ai':            { hp: 470, mp: 198, atk: 28, def: 24, mdef: 46, move: 2, awr: 6, int: 65, spd: 7 },
    'machine elves': { hp: 488, mp: 185, atk: 32, def: 27, mdef: 40, move: 2, awr: 4, int: 55, spd: 7 },
    'glitch':        { hp: 490, mp: 180, atk: 36, def: 24, mdef: 39, move: 3, awr: 5, int: 53, spd: 9 },

    'homosapien':    { hp: 525, mp: 148, atk: 48, def: 32, mdef: 30, move: 2, awr: 3, int: 36, spd: 6 },
    'pirate':        { hp: 560, mp: 120, atk: 62, def: 30, mdef: 23, move: 2, awr: 3, int: 24, spd: 7 },

    'knight':        { hp: 610, mp: 80,  atk: 52, def: 45, mdef: 17, move: 2, awr: 2, int: 12, spd: 3 },
    'shaman':        { hp: 545, mp: 165, atk: 38, def: 30, mdef: 36, move: 2, awr: 3, int: 48, spd: 5 },
    'mad scientist': { hp: 480, mp: 185, atk: 30, def: 22, mdef: 44, move: 2, awr: 5, int: 62, spd: 8 },
    'cowboy':        { hp: 540, mp: 125, atk: 64, def: 28, mdef: 23, move: 2, awr: 4, int: 24, spd: 8 },
    'men in black':  { hp: 520, mp: 140, atk: 58, def: 28, mdef: 31, move: 3, awr: 5, int: 38, spd: 9 },
    'telepath':      { hp: 465, mp: 210, atk: 22, def: 24, mdef: 47, move: 2, awr: 6, int: 68, spd: 7 },
    'marksman':      { hp: 505, mp: 130, atk: 66, def: 22, mdef: 22, move: 2, awr: 6, int: 22, spd: 8 },
    'priest':        { hp: 490, mp: 195, atk: 24, def: 30, mdef: 41, move: 2, awr: 4, int: 56, spd: 7 },
    'wizard':        { hp: 455, mp: 220, atk: 22, def: 22, mdef: 49, move: 2, awr: 3, int: 70, spd: 6 },
    'fortune teller':{ hp: 500, mp: 178, atk: 28, def: 26, mdef: 39, move: 2, awr: 5, int: 52, spd: 7 },

    'nephilim':      { hp: 618, mp: 70,  atk: 42, def: 50, mdef: 17, move: 2, awr: 3, int: 12, spd: 3 },

    'demon prince':  { hp: 585, mp: 88,  atk: 74, def: 26, mdef: 21, move: 2, awr: 2, int: 20, spd: 3 },
    'goatman':       { hp: 590, mp: 82,  atk: 70, def: 30, mdef: 20, move: 2, awr: 2, int: 18, spd: 6 },

    'mermaid':       { hp: 478, mp: 198, atk: 20, def: 28, mdef: 44, move: 2, awr: 4, int: 62, spd: 8 },

    'demon princess':{ hp: 495, mp: 185, atk: 30, def: 26, mdef: 39, move: 2, awr: 3, int: 52, spd: 7 },
    'dreameater':    { hp: 490, mp: 190, atk: 22, def: 22, mdef: 44, move: 2, awr: 5, int: 62, spd: 7 },

    'halfdemon':     { hp: 515, mp: 145, atk: 64, def: 24, mdef: 30, move: 3, awr: 4, int: 36, spd: 9 },
    'vampire':       { hp: 510, mp: 158, atk: 66, def: 22, mdef: 25, move: 3, awr: 5, int: 28, spd: 8 },

    'fallen angel':  { hp: 452, mp: 218, atk: 24, def: 24, mdef: 47, move: 2, awr: 4, int: 68, spd: 8 },
    'voidweaver':    { hp: 505, mp: 155, atk: 64, def: 22, mdef: 31, move: 3, awr: 5, int: 38, spd: 8 },

    'cosmic wraith': { hp: 498, mp: 162, atk: 60, def: 26, mdef: 32, move: 2, awr: 4, int: 40, spd: 8 },

    'cyborg':        { hp: 575, mp: 90,  atk: 70, def: 30, mdef: 22, move: 2, awr: 3, int: 22, spd: 8 },

    'superhero':     { hp: 538, mp: 136, atk: 52, def: 34, mdef: 25, move: 3, awr: 3, int: 28, spd: 6 },

    'general':       { hp: 568, mp: 125, atk: 50, def: 38, mdef: 27, move: 2, awr: 3, int: 30, spd: 6 },
    'droid':         { hp: 468, mp: 215, atk: 24, def: 22, mdef: 46, move: 2, awr: 6, int: 66, spd: 7 },
    'antihero':      { hp: 558, mp: 118, atk: 58, def: 36, mdef: 23, move: 3, awr: 3, int: 24, spd: 7 },
    'conspiracy theorist':{ hp: 522, mp: 162, atk: 42, def: 28, mdef: 32, move: 2, awr: 5, int: 40, spd: 6 },
    'overlord':      { hp: 625, mp: 72,  atk: 76, def: 32, mdef: 18, move: 2, awr: 2, int: 14, spd: 4 },
    'chosen one':    { hp: 452, mp: 225, atk: 32, def: 24, mdef: 48, move: 2, awr: 5, int: 72, spd: 9 },
    'politician':    { hp: 548, mp: 138, atk: 42, def: 34, mdef: 30, move: 2, awr: 4, int: 36, spd: 5 },

    'atlantean':     { hp: 524, mp: 155, atk: 36, def: 34, mdef: 33, move: 2, awr: 3, int: 42, spd: 4 },
    'dinosaur':      { hp: 595, mp: 80,  atk: 74, def: 26, mdef: 18, move: 2, awr: 2, int: 14, spd: 7 },
    'dragon':        { hp: 514, mp: 165, atk: 30, def: 28, mdef: 40, move: 2, awr: 3, int: 55, spd: 3 },
    'ghoul':         { hp: 545, mp: 130, atk: 60, def: 22, mdef: 25, move: 3, awr: 3, int: 28, spd: 9 },
    'gnome':         { hp: 520, mp: 160, atk: 40, def: 28, mdef: 31, move: 2, awr: 4, int: 38, spd: 8 },
    'kaiju':         { hp: 610, mp: 72,  atk: 76, def: 30, mdef: 13, move: 2, awr: 1, int: 6,  spd: 3 },
    'kraken':        { hp: 544, mp: 138, atk: 42, def: 36, mdef: 29, move: 2, awr: 3, int: 34, spd: 1 },
    'loch ness monster':{ hp: 635, mp: 65,  atk: 40, def: 46, mdef: 14, move: 2, awr: 2, int: 8,  spd: 2 },
    'yeti':          { hp: 600, mp: 82,  atk: 70, def: 32, mdef: 16, move: 2, awr: 2, int: 10, spd: 2 },

    'barbarella':    { hp: 524, mp: 142, atk: 56, def: 28, mdef: 31, move: 3, awr: 3, int: 38, spd: 8 },
    'black goo':     { hp: 540, mp: 140, atk: 38, def: 32, mdef: 33, move: 2, awr: 4, int: 42, spd: 5 },
    'golem':         { hp: 660, mp: 55,  atk: 42, def: 54, mdef: 13, move: 2, awr: 1, int: 6,  spd: 2 },
    'honda civic':   { hp: 560, mp: 110, atk: 48, def: 38, mdef: 21, move: 3, awr: 2, int: 20, spd: 6 },
    'ice queen':     { hp: 470, mp: 200, atk: 22, def: 28, mdef: 44, move: 2, awr: 4, int: 62, spd: 7 },
    'juggernaut':    { hp: 640, mp: 60,  atk: 72, def: 36, mdef: 14, move: 2, awr: 1, int: 8,  spd: 3 },
    'ki fighter':    { hp: 545, mp: 120, atk: 68, def: 28, mdef: 23, move: 3, awr: 3, int: 24, spd: 9 },
    'king arthur':   { hp: 600, mp: 100, atk: 48, def: 48, mdef: 25, move: 2, awr: 3, int: 28, spd: 5 },
    'king kong':     { hp: 650, mp: 58,  atk: 74, def: 32, mdef: 14, move: 2, awr: 2, int: 8,  spd: 3 },
    'minotaur':      { hp: 590, mp: 80,  atk: 70, def: 30, mdef: 17, move: 3, awr: 2, int: 12, spd: 6 },
    'necromancer':   { hp: 475, mp: 195, atk: 24, def: 26, mdef: 42, move: 2, awr: 3, int: 58, spd: 6 },
    'occulus':       { hp: 466, mp: 180, atk: 20, def: 24, mdef: 38, move: 3, awr: 5, int: 50, spd: 7 },
    'quarterback':   { hp: 558, mp: 118, atk: 60, def: 30, mdef: 22, move: 3, awr: 3, int: 22, spd: 8 },
    'robinhood':     { hp: 535, mp: 122, atk: 66, def: 26, mdef: 25, move: 3, awr: 4, int: 28, spd: 9 },
    'santa clause':  { hp: 510, mp: 185, atk: 22, def: 32, mdef: 36, move: 2, awr: 4, int: 48, spd: 5 },
    'super sentai':  { hp: 620, mp: 90,  atk: 46, def: 44, mdef: 20, move: 2, awr: 3, int: 18, spd: 4 },
    'symbiote':      { hp: 520, mp: 120, atk: 64, def: 26, mdef: 25, move: 3, awr: 3, int: 28, spd: 8 },
    'valkraye':      { hp: 560, mp: 110, atk: 56, def: 34, mdef: 27, move: 3, awr: 3, int: 30, spd: 7 },
    'watcher':       { hp: 480, mp: 178, atk: 22, def: 28, mdef: 39, move: 2, awr: 5, int: 52, spd: 6 },
};

const JOB_MODIFIERS = {
    'Warrior': {
        hp: 120,
        mp: -15,
        atk: 16,
        def: 20,
        mdef: 4,
        move: 1,
        awr: -1,
        int: -10,
        spd: -1,
        range: 1,
        inspect: 1
    },
    'Gunslinger': {
        hp: 30,
        mp: -10,
        atk: 24,
        def: 5,
        mdef: 2,
        move: 0,
        awr: 0,
        int: 0,
        spd: +1,
        range: 2,
        inspect: 1
    },
    'Black Mage': {
        hp: -80,
        mp: 60,
        atk: -24,
        def: -10,
        mdef: 12,
        move: 0,
        awr: 0,
        int: 20,
        spd: 0,
        range: 1,
        inspect: 1
    },
    'White Mage': {
        hp: -30,
        mp: 50,
        atk: -24,
        def: 0,
        mdef: 14,
        move: 0,
        awr: 0,
        int: 15,
        spd: 0,
        range: 1,
        inspect: 1
    },
    'Agent': {
        hp: 0,
        mp: 15,
        atk: 8,
        def: 0,
        mdef: 6,
        move: +1,
        awr: +2,
        int: 10,
        spd: +2,
        range: 2,
        inspect: 2
    },
    'Psychic': {
        hp: -10,
        mp: 70,
        atk: -16,
        def: -5,
        mdef: 18,
        move: 0,
        awr: +1,
        int: 30,
        spd: 0,
        range: 2,
        inspect: 1
    },
    'Harvester': {
        hp: 80,
        mp: 20,
        atk: 16,
        def: 10,
        mdef: 6,
        move: 0,
        awr: 0,
        int: 5,
        spd: -1,
        range: 1,
        inspect: 1
    },

    'Engineer': {
        hp: 50,
        mp: 10,
        atk: 0,
        def: 10,
        mdef: 8,
        move: 0,
        awr: 0,
        int: 5,
        spd: 0,
        range: 1,
        inspect: 1
    },

    'Harbinger': {
        hp: -50,
        mp: 40,
        atk: -32,
        def: -5,
        mdef: 10,
        move: 0,
        awr: +1,
        int: 15,
        spd: +1,
        range: 1,
        inspect: 1
    },

    'Freelancer': {
        hp: 20,
        mp: 10,
        atk: 8,
        def: 5,
        mdef: 5,
        move: 0,
        awr: +1,
        int: 5,
        spd: +1,
        range: 1,
        inspect: 1
    },
    'Raider': {
        hp: 60,
        mp: 0,
        atk: 24,
        def: 5,
        mdef: 2,
        move: 1,
        awr: 0,
        int: -5,
        spd: +1,
        range: 1,
        inspect: 1
    },
    'Sniper': {
        hp: -20,
        mp: -5,
        atk: 22,
        def: -15,
        mdef: -5,
        move: -1,
        awr: +3,
        int: 0,
        spd: +1,
        range: 4,
        inspect: 2
    }
};

function computeUnitStats(race, cls) {
    const base = RACE_BASE_STATS[race] || RACE_BASE_STATS['homosapien'];
    const job = JOB_MODIFIERS[cls] || JOB_MODIFIERS['Gunslinger'];
    return {
        hp: Math.max(200, base.hp + job.hp),
        mp: Math.max(25, base.mp + job.mp),
        atk: Math.max(8, base.atk + job.atk),
        def: Math.max(0, base.def + job.def),
        mdef: Math.max(0, (base.mdef || 0) + (job.mdef || 0)),
        move: Math.max(1, base.move + job.move),
        awr: Math.max(1, base.awr + job.awr),
        int: Math.max(0, base.int + job.int),
        spd: Math.max(1, (base.spd || 5) + (job.spd || 0)),
        range: job.range,
        inspect: job.inspect
    };
}

function computeSecJobBonuses(secJobName) {
    const bonuses = { hp: 0, mp: 0, atk: 0, def: 0, mdef: 0, move: 0, awr: 0, int: 0, spd: 0 };
    if (!secJobName) return bonuses;
    const mods = JOB_MODIFIERS[secJobName];
    if (!mods) return bonuses;
    const RATIO = 0.25;
    for (const k of ['hp', 'mp', 'atk', 'def', 'mdef', 'move', 'awr', 'int', 'spd']) {
        if (mods[k]) bonuses[k] = Math.round(mods[k] * RATIO);
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
        mp: 110,
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
        hp: 670,
        mp: 105,
        atk: 80,
        def: 60,
        mdef: 21,
        range: 1,
        move: 2,
        inspect: 1,
        awr: 2,
        int: 20
    },
    'Black Mage': {
        cls: 'Black Mage',
        job: 'Black Mage',
        hp: 470,
        mp: 180,
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
        mp: 170,
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
        mp: 135,
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
        mp: 190,
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
        mp: 140,
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
        mp: 130,
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
        mp: 160,
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
        mp: 130,
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
        mp: 120,
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
        mp: 115,
        atk: 72,
        def: 25,
        mdef: 27,
        range: 5,
        move: 2,
        inspect: 2,
        awr: 6,
        int: 30
    },
};

let DEFAULT_BUILDS = {
    1: ['Gunslinger', 'Warrior', 'Black Mage', 'White Mage'],
    2: ['Gunslinger', 'Warrior', 'Agent', 'White Mage']
};

const DEFAULT_PARTY_NAMES = {
    1: ['P1 Gunslinger', 'P1 Knight', 'P1 Black Mage', 'P1 White Mage'],
    2: ['P2 Gunslinger', 'P2 Knight', 'P2 Agent', 'P2 White Mage']
};

const ITEM_RULES = {
    healPotion: {
        name: 'Healing Potion',
        icon: '🧪',
        max: 6,
        desc: 'Target any living ally. Restores 96 HP.'
    },
    manaPotion: {
        name: 'Mana Potion',
        icon: '🔹',
        max: 6,
        desc: 'Target any living ally. Restores 40 MP.'
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
    }
};

// ── Job passives ──────────────────────────────────────────────────────────
// Innate, always-on identity abilities that shape each primary job's playstyle.
// These are SEPARATE from the flat stat deltas in JOB_MODIFIERS — a passive is a
// rule, not a number. This registry is the single source of truth for the name +
// description surfaced in the party builder and unit panels; the mechanics for
// the focus jobs are wired in battle.js (Sniper / Harvester) and map.js
// (Freelancer). `id` lets combat code branch on a passive without matching text.
const JOB_PASSIVES = {
    Gunslinger:  { id: 'deadeye',        name: 'Deadeye',         desc: '+1 SPD. Always ready to draw first.' },
    Warrior:     { id: 'bulwark',        name: 'Bulwark',         desc: 'Reduces incoming damage by 8. Fortify shields cap at 25% max HP.' },
    'Black Mage':{ id: 'arcaneSurge',    name: 'Arcane Surge',    desc: '+8 spell damage on every cast.' },
    'White Mage':{ id: 'grace',          name: 'Grace',           desc: 'Heal and revive spells gain +2 range and +24 healing power.' },
    Agent:       { id: 'fieldOperative', name: 'Field Operative', desc: 'Can equip up to 2 scanners and has longer inspect reach.' },
    Psychic:     { id: 'thirdEye',       name: 'Third Eye',       desc: 'Glare debuffs this unit applies last +1 turn. Teleport costs 1 less MP.' },
    Harvester:   { id: 'greenThumb',     name: 'Green Thumb',     desc: 'Trees this unit plants buff its ATK & spell power (+7 each, up to 6 living trees), and felled lumber powers Timber Strike. Life Drain heals 20% more. Enemies can chop or burn the forest to shut it down.' },
    Engineer:    { id: 'tinker',         name: 'Tinker',          desc: 'Turrets have +1 range and Repair heals 20% more.' },
    Harbinger:   { id: 'crescendo',      name: 'Crescendo',       desc: "This unit's buffs last +1 turn. Lullaby has +1 range." },
    Freelancer:  { id: 'adaptable',      name: 'Adaptable',       desc: 'No school restrictions — can learn and equip spells from ANY job pool. A blank slate that borrows every playstyle.' },
    Raider:      { id: 'bruteForce',     name: 'Brute Force',     desc: 'Basic attacks deal +20% damage. Gains +8 DEF while below 50% HP.' },
    Sniper:      { id: 'bulletDrop',     name: 'Bullet Drop',     desc: 'Attacks, abilities and spells scale with range to the target: −40% at point-blank, climbing to +20% from 5+ tiles away. Reward the long shot; never get cornered.' },
};
// Back-compat: some older lookups expect a flat "Name: desc" string map.
const CLASS_PASSIVES = Object.fromEntries(
    Object.entries(JOB_PASSIVES).map(([job, p]) => [job, `${p.name}: ${p.desc}`])
);
function getJobPassive(job) { return JOB_PASSIVES[job] || null; }

const JOB_DISPLAY_NAMES = {
    'Raider': 'Bruiser'
};
function getJobDisplayName(job) { return JOB_DISPLAY_NAMES[job] || job; }

function getRaceLabel(race, gender) {
    const p = RACE_PROFILES[race];
    if (!p) return race || '?';
    if (gender === 'female' && p.labelFemale) return p.labelFemale;
    if (gender === 'male' && p.labelMale) return p.labelMale;
    return p.label || race;
}

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
        school: 'Warrior',
        classRestriction: 'Warrior',
        jobPreference: ['Warrior'],
        shield: 96,
        shieldCapPct: 0.25,
        desc: 'Grant yourself or an ally a shield, capped at 25% of max HP.'
    },
    {
        id: 'mark1',
        spellType: 'tech',
        name: 'Suppressing Fire',
        type: 'debuff',
        cost: 20,
        equipCost: 15,
        range: 4,
        kind: 'debuff',
        tier: 'I',
        school: 'Tactics',
        classRestrictions: ['Agent', 'Sniper'],
        jobPreference: ['Agent', 'Gunslinger'],
        statStageBoost: { atk: -2 },
        desc: 'Rake the target\'s position with disciplined covering fire. Pinned down and rattled, they fight at -2 ATK for 3 turns.'
    },
    {
        id: 'heal1',
        spellType: 'divine',
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
        desc: 'Restore a strong chunk of HP. Heals more on allies below 40% HP.'
    },
    {
        id: 'fire1',
        spellType: 'unholy',
        name: 'Fireball',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 144,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        jobPreference: ['Black Mage'],
        projectileOverride: 'proj-fire',
        statusEffects: [{
            id: 'burn',
            duration: 2
        }],
        desc: 'Reliable single-target fire burst that also burns.'
    },

    {
        id: 'guardSlash',
        spellType: 'human',
        name: 'Brave Charge',
        type: 'damage',
        cost: 20,
        equipCost: 15,
        dmg: 96,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Warrior',
        classRestriction: 'Warrior',
        chargeToTarget: true,
        statusEffects: [],
        desc: 'Charge at an enemy up to 3 tiles away, dealing damage and landing adjacent to them.'
    },
    {
        id: 'shieldBash',
        spellType: 'human',
        name: 'Phalanx',
        type: 'buff',
        cost: 45,
        equipCost: 15,
        apCost: 1,
        heal: 0,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'Warrior',
        classRestriction: 'Warrior',
        jobPreference: ['Warrior'],
        statStageBoost: { def: 1 },
        desc: 'Bellow the old legion drill — SHIELDS UP! Your entire team locks formation, gaining +1 DEF for 3 turns.'
    },
    {
        id: 'dragonSlash',
        spellType: 'unholy',
        name: 'Dragon Slash',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 224,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        ignoreArmor: true,
        tier: 'II',
        school: 'Warrior',
        classRestriction: 'Warrior',
        desc: 'A devastating melee strike that cleaves through armor. Massive single-target damage.'
    },

    {
        id: 'radiantBolt',
        spellType: 'divine',
        name: 'Veil of Light',
        type: 'buff',
        cost: 45,
        equipCost: 15,
        apCost: 1,
        heal: 0,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        jobPreference: ['White Mage'],
        statStageBoost: { mdef: 1 },
        desc: 'Drape your entire team in a shimmering curtain of holy light: +1 MDEF for 3 turns. Enemy spells break against it like waves.'
    },
    {
        id: 'revive1',
        spellType: 'divine',
        name: 'Revive',
        type: 'heal',
        cost: 25,
        equipCost: 15,
        range: 4,
        kind: 'revive',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        revivePct: 0.45,
        oneRevivePerUnitPerMatch: true,
        desc: 'Revive one fallen ally at 45% HP. Each unit can only be revived once per match.'
    },
    {
        id: 'protect1',
        spellType: 'divine',
        name: 'Protect',
        type: 'buff',
        cost: 30,
        equipCost: 10,
        apCost: 1,
        range: 3,
        kind: 'buff',
        tier: 'I',
        school: 'White Mage',
        classRestriction: 'White Mage',
        statusEffects: [{
            id: 'protect',
            duration: 1
        }],
        desc: 'Shield an ally from all damage during the next enemy turn. Costs significant mana.'
    },
    {
        id: 'healAll',
        spellType: 'divine',
        name: 'Heal All',
        type: 'heal',
        cost: 60,
        equipCost: 20,
        heal: 128,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        desc: 'Restore HP to all living allies. Lower base heal but hits the entire team.'
    },

    {
        id: 'thunder1',
        spellType: 'anomaly',
        name: 'Thunderbolt',
        type: 'damage',
        cost: 40,
        equipCost: 15,
        dmg: 120,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        chainProfile: [120, 80, 48],
        chainRadius: 1,
        desc: 'Lightning that punishes clumped enemies with heavy falloff.'
    },
    {
        id: 'thunderstorm',
        spellType: 'anomaly',
        name: 'Thunderstorm',
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
        desc: 'Summon a homing thunderstorm at the target area. Each round it chases the nearest enemy, blasting anyone it catches with lightning.'
    },
    {
        id: 'wallOfFire',
        spellType: 'unholy',
        name: 'Wall of Fire',
        type: 'damage',
        cost: 50,
        equipCost: 20,
        dmg: 112,
        range: 3,
        kind: 'terrainCreate',
        terrainType: 'scorched',
        tileCount: 3,
        orientable: true,
        damageType: 'magic',
        tier: 'II',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        projectileOverride: 'proj-fire',
        statusEffects: [{
            id: 'burn',
            duration: 2
        }],
        desc: 'Conjure a 3-tile wall of flame in a line (horizontal or vertical). Damages enemies caught, burns them for 2 turns, and leaves scorched terrain behind.'
    },
    {
        id: 'darkPact',
        spellType: 'unholy',
        name: 'Dark Pact',
        type: 'buff',
        cost: 25,
        equipCost: 15,
        apCost: 1,
        range: 0,
        kind: 'buff',
        tier: 'II',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        jobPreference: ['Black Mage'],
        statStageBoost: { int: 2 },
        desc: 'Whisper a bargain to something that whispers back. +2 INT for 3 turns — your next spells hit like the debt is due.'
    },

    {
        id: 'doubleShot',
        spellType: 'tech',
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
        hitDamages: [64, 64],
        markedSecondHitBonus: 3,
        desc: 'Two quick shots. The second hits harder against Marked targets.'
    },
    {
        id: 'ricochet1',
        spellType: 'anomaly',
        name: 'Ricochet',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 88,
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
        desc: 'Hits one enemy, then bounces to another nearby target.'
    },
    {
        id: 'shootout',
        spellType: 'human',
        name: 'Bullet Rain',
        type: 'damage',
        cost: 40,
        equipCost: 20,
        dmg: 80,
        range: 3,
        kind: 'aoe',
        aoeRadius: 1,
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'II',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        desc: 'Mark a tile and rain bullets onto it. Hits every enemy in the 3×3 area for moderate damage.'
    },
    {
        id: 'pistolWhip',
        spellType: 'human',
        name: 'Pistol Whip',
        type: 'damage',
        cost: 10,
        equipCost: 10,
        dmg: 144,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        jobPreference: ['Gunslinger'],
        desc: 'Crack an adjacent enemy across the face with your pistol. Cheap, reliable close-range physical damage.'
    },

    {
        id: 'placeBomb',
        spellType: 'tech',
        name: 'Place Bomb',
        type: 'buff',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        dmg: 144,
        range: 2,
        kind: 'bomb',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        maxActivePerCaster: 3,
        blastRadius: 1,
        desc: 'Place a bomb on any tile without allies (1 AP). Each Agent can maintain up to 3. Use Detonate to trigger them.'
    },
    {
        id: 'taser',
        spellType: 'tech',
        name: 'Neuralyzer',
        type: 'debuff',
        cost: 20,
        equipCost: 10,
        range: 3,
        kind: 'debuff',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        statStageBoost: { int: -2 },
        desc: 'Look right here, please. A blinding flash scrambles the target\'s mind: -2 INT for 3 turns — weaker spells, sloppier ailments.'
    },

    {
        id: 'glare',
        spellType: 'alien',
        name: 'Glare',
        type: 'debuff',
        cost: 15,
        equipCost: 10,
        range: 4,
        kind: 'debuff',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        statusEffects: [{
            id: 'glare',
            duration: 2
        }],
        desc: 'Psychic stare that lowers the target\'s defense. Stacks with itself for crushing armor reduction. Psychic-only.'
    },

    {
        id: 'healingSeed',
        spellType: 'divine',
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
        desc: 'Plant a restorative seed; it grows its own grass tile underneath. Heals allies standing on it each turn. Blooms instantly in rain. Persists until destroyed by enemy attack or drought.'
    },

    {
        id: 'poisonSeed',
        spellType: 'unholy',
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
        desc: 'Plant a toxic seed; it grows its own grass tile underneath. Damages enemies standing on it each turn. Persists until destroyed by enemy attack or drought.'
    },

    {
        id: 'teleport',
        spellType: 'alien',
        name: 'Teleport',
        type: 'utility',
        cost: 40,
        equipCost: 15,
        range: 3,
        kind: 'teleport',
        teleportAnyUnit: true,
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        desc: 'Warp any unit — self, ally, or enemy — to any unoccupied tile within range. Costs 1 less MP for Psychics.'
    },
    {
        id: 'warpRune',
        spellType: 'alien',
        name: 'Warp Rune',
        type: 'utility',
        cost: 25,
        equipCost: 15,
        apCost: 1,
        range: 3,
        kind: 'warpRune',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        maxActivePerCaster: 2,
        desc: 'Place a hidden warp rune on a tile. Any unit stepping on it is teleported to a random location. Max 2 active per Psychic.'
    },
    {
        id: 'psychosis',
        spellType: 'alien',
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
        desc: 'Unravel the target\'s sense of what is real. Their fractured mind lies open: -2 MDEF against all magic for 3 turns.'
    },

    {
        id: 'lifeDrain',
        spellType: 'unholy',
        name: 'Life Drain',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 144,
        range: 3,
        kind: 'lifeDrain',
        tier: 'I',
        school: 'Harvester',
        classRestriction: 'Harvester',
        drainPct: 0.70,
        desc: 'Siphon life force from an enemy. Heals self for 70% of damage dealt. Harvesters heal 20% more.'
    },
    {
        id: 'leechSeed',
        spellType: 'unholy',
        name: 'Leech Seed',
        type: 'utility',
        cost: 35,
        equipCost: 20,
        range: 3,
        kind: 'leechSeed',
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        desc: 'Infest a tile with parasitic roots; it grows its own grass tile underneath. Enemies crossing it take damage; allies crossing it are healed. Persists until destroyed by enemy attack or drought.'
    },
    {
        id: 'wildGrowth',
        spellType: 'divine',
        name: 'Healing Spring',
        type: 'utility',
        cost: 25,
        equipCost: 15,
        apCost: 2,
        range: 3,
        kind: 'terrainCreate',
        terrainType: 'healing_spring',
        tileCount: 3,
        orientable: true,
        tier: 'I',
        school: 'Harvester',
        classRestriction: 'Harvester',
        desc: 'Convert terrain into a 3-tile healing spring in a line (horizontal or vertical). Any unit standing on the spring recovers HP each turn.'
    },
    {
        id: 'wildwood',
        spellType: 'divine',
        name: 'Wildwood',
        type: 'utility',
        cost: 30,
        equipCost: 20,
        apCost: 1,
        range: 3,
        kind: 'plantTree',
        maxActivePerCaster: 4,
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Grow a living tree on fertile ground. Each tree you keep alive grants this unit +7 ATK & spell power (up to 6 trees). Enemies must chop or burn your grove down to shut it off.'
    },
    {
        id: 'timberStrike',
        spellType: 'anomaly',
        name: 'Timber Strike',
        type: 'damage',
        cost: 40,
        equipCost: 25,
        dmg: 120,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        lumberScale: true,
        lumberPerTree: 30,
        lumberCap: 120,
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Hurl a felled trunk at an enemy. Damage grows by +30 for every tree your team has chopped down this match (up to +120). Chop the forest, then swing it.'
    },

    {
        id: 'knifeThrow',
        spellType: 'human',
        name: 'Knife Throw',
        type: 'damage',
        cost: 15,
        equipCost: 10,
        dmg: 128,
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
        desc: 'Hurl a knife at a distant enemy. Marks the target, making them vulnerable to follow-up attacks.'
    },
    {
        id: 'sneakSlash',
        spellType: 'human',
        name: 'Sneak Slash',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 176,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-knife',
        tier: 'II',
        school: 'Agent',
        classRestriction: 'Agent',
        equipReq: 'knife',
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }],
        sneakBonus: true,
        desc: 'A devastating close-range slash from the shadows. Deals +50% damage when cast while invisible.'
    },

    {
        id: 'remoteView',
        spellType: 'alien',
        name: 'Remote View',
        type: 'utility',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        range: 99,
        kind: 'remoteView',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        equipReq: 'tarot',
        desc: 'Peer through the cards to reveal a 5x5 area anywhere on the map. Grants vision for 3 turns.'
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
        turretHp: 20,
        turretDmg: 64,
        turretRange: 2,
        desc: 'Deploy a turret on an empty tile (1 AP). It paints the nearest enemy within 2 tiles with a targeting laser — the shot lands at the end of the round for 64 damage. Max 2 per Engineer. Enemies can destroy turrets.'
    },
    {
        id: 'overclock',
        spellType: 'divine',
        name: 'Overclock',
        type: 'buff',
        cost: 40,
        equipCost: 20,
        range: 3,
        kind: 'buff',
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statusEffects: [{
            id: 'overclock',
            duration: 2
        }],
        desc: 'Supercharge an allied unit for 2 turns: +16 ATK, +1 Move. Tech-type units also gain +1 Range.'
    },
    {
        id: 'plasmaGun',
        spellType: 'alien',
        name: 'Plasma Gun',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 112,
        range: 4,
        kind: 'line',
        damageType: 'magic',
        lineWidth: 1,
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        desc: 'Fire a beam of superheated plasma in a straight line, damaging all enemies in its path.'
    },
    {
        id: 'freeEnergy',
        spellType: 'divine',
        name: 'Free Energy',
        type: 'heal',
        cost: 50,
        equipCost: 20,
        mpRestore: 20,
        range: 0,
        kind: 'manaRestoreAll',
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        desc: 'Tap into zero-point energy to restore 20 MP to every OTHER living ally. The engineer keeps none for themself.'
    },

    {
        id: 'warCry',
        spellType: 'human',
        name: 'War Cry',
        type: 'buff',
        cost: 30,
        equipCost: 15,
        apCost: 1,
        range: 0,
        kind: 'warCry',
        tier: 'I',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        auraRadius: 3,
        desc: 'Rally all allies within 3 tiles. Grants Inspired for 2 turns: +24 ATK, +10 DEF. The Harbinger receives a weaker version (+8 ATK, +5 DEF).'
    },
    {
        id: 'discordance',
        spellType: 'anomaly',
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
        desc: 'Disharmonize an enemy for 2 turns: -24 ATK, -10 DEF, and their spells cost +10 MP. More interactive than a hard stun.'
    },
    {
        id: 'encore',
        spellType: 'anomaly',
        name: 'Encore',
        type: 'buff',
        cost: 35,
        equipCost: 20,
        range: 3,
        kind: 'encore',
        tier: 'II',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        desc: 'Grant a friendly unit that already acted this turn 1 bonus AP, letting them take one more action. Each unit can only receive Encore once per round.'
    },
    {
        id: 'lullaby',
        spellType: 'anomaly',
        name: 'Lullaby',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 112,
        range: 4,
        kind: 'damage',
        damageType: 'magic',
        tier: 'II',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statusEffects: [{
            id: 'slow',
            duration: 2
        }, {
            id: 'drowsy',
            duration: 2
        }],
        desc: 'Sing a soothing melody that lulls an enemy: magic damage, slowed for 2 turns, and a drowsy, dulled mind (-1 INT).'
    },

    {
        id: 'haymaker',
        spellType: 'human',
        name: 'Haymaker',
        type: 'damage',
        cost: 25,
        equipCost: 10,
        dmg: 136,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        statusEffects: [{ id: 'stagger', duration: 1, chance: 0.5 }],
        desc: 'A devastating overhand punch. 50% chance to stagger the target.'
    },
    {
        id: 'groundSlam',
        spellType: 'human',
        name: 'Ground Slam',
        type: 'damage',
        cost: 35,
        equipCost: 15,
        dmg: 96,
        range: 0,
        aoeRadius: 1,
        kind: 'aoe',
        damageType: 'physical',
        tier: 'II',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        selfCenter: true,
        statusEffects: [{ id: 'stagger', duration: 1, chance: 0.5 }],
        desc: 'Slam the ground with brute force. Damages all adjacent enemies in a 3x3 area. 50% chance to stagger each target.'
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
        statusEffects: [{ id: 'stun', duration: 1 }],
        desc: 'Grab an adjacent enemy in an unbreakable hold, stunning them so they cannot act next turn.'
    },
    {
        id: 'rampage',
        spellType: 'human',
        name: 'Rampage',
        type: 'damage',
        cost: 40,
        equipCost: 20,
        dmg: 144,
        range: 4,
        kind: 'dash',
        damageType: 'physical',
        tier: 'III',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        dashDamage: 56,
        desc: 'Charge through enemy lines up to 4 tiles, dealing 56 damage to everything in your path. Full damage to primary target.'
    },
    {
        id: 'skullCrack',
        spellType: 'human',
        name: 'Skull Crack',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 112,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'II',
        school: 'Raider',
        classRestriction: 'Raider',
        jobPreference: ['Raider'],
        statusEffects: [{ id: 'guardBreak', duration: 2 }],
        desc: 'A crushing blow to the skull. Breaks the target\'s guard for 2 turns, reducing DEF.'
    },

    {
        id: 'precisionShot',
        spellType: 'tech',
        name: 'Precision Shot',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 128,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        actedTargetBonus: 32,
        tier: 'II',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        desc: 'A carefully aimed long-range shot. Deals +4 bonus damage to targets that already acted. Range 5.'
    },
    {
        id: 'headshot',
        spellType: 'tech',
        name: 'Headshot',
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
        desc: 'Paint a target with a laser sight instead of firing. The lethal armor-piercing shot lands at the end of the round — but ONLY if your team still has eyes on the target. Break their line of sight and the shot is wasted.'
    },
    {
        id: 'spotter',
        spellType: 'tech',
        name: 'Spotter',
        type: 'debuff',
        cost: 15,
        equipCost: 10,
        apCost: 1,
        range: 5,
        kind: 'debuff',
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{
            id: 'marked',
            duration: 3,
            bonusDamage: 40
        }],
        desc: 'Call out an enemy at extreme range. Marks them for 3 turns — next hit deals +40 bonus damage.'
    },
    {
        id: 'camouflage',
        spellType: 'human',
        name: 'Camouflage',
        type: 'buff',
        cost: 20,
        equipCost: 10,
        range: 0,
        kind: 'buff',
        tier: 'II',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{
            id: 'invisible',
            duration: 1
        }],
        desc: 'Blend into the environment. Enemies cannot target this unit for 1 turn or until it attacks. +1 range while camouflaged.'
    },
    {
        id: 'steadyAim',
        spellType: 'human',
        name: 'Steady Aim',
        type: 'buff',
        cost: 15,
        equipCost: 10,
        range: 0,
        kind: 'buff',
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{ id: 'steadyAim', duration: 1 }],
        desc: 'Brace and focus. +1 Range for your next turn. Self-target only.'
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
        desc: 'Self-buff: +16 ATK, +12 INT, +5 DEF & MDEF, +1 MOVE, +1 Range for 3 turns. Modest but universal.'
    },
    {
        id: 'improvise',
        spellType: 'human',
        name: 'Improvise',
        type: 'damage',
        cost: 20,
        equipCost: 10,
        dmg: 96,
        range: 2,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Freelancer',
        classRestriction: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'An unorthodox attack using whatever is on hand. Damage type matches job.'
    },
    {
        id: 'reallyGoodPunch',
        spellType: 'human',
        name: 'A Really Good Punch',
        type: 'damage',
        cost: 15,
        equipCost: 10,
        dmg: 112,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Freelancer',
        classRestriction: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'A surprisingly effective melee punch.'
    },

    {
        id: 'judgment',
        spellType: 'divine',
        name: 'Judgment',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 176,
        range: 1,
        kind: 'aoe',
        damageType: 'physical',
        tier: 'III',
        school: 'Warrior',
        classRestriction: 'Warrior',
        aoeRadius: 1,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Slam the ground with divine fury. Deals heavy physical damage in a 3x3 area and stuns all enemies hit for 1 turn.'
    },

    {
        id: 'deadEye',
        spellType: 'tech',
        name: 'Dead Eye',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 200,
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
        desc: 'Take careful aim and fire a single devastating shot. Always crits. Marks the target on hit.'
    },

    {
        id: 'meteor',
        spellType: 'unholy',
        name: 'Meteor',
        type: 'damage',
        cost: 70,
        equipCost: 25,
        dmg: 192,
        range: 4,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        aoeRadius: 1,
        leaveTerrain: 'scorched',
        projectileOverride: 'proj-fire',
        statusEffects: [{
            id: 'burn',
            duration: 3
        }],
        terrainDeform: { centerDelta: -2, edgeDelta: -1 },
        demolishesBuildings: true,
        desc: 'Call down a meteor strike on a 3x3 area. Massive magic damage, applies a 3-turn burn, scorches the impact site, and levels any building it hits.'
    },


    {
        id: 'empBurst',
        spellType: 'tech',
        name: 'EMP Burst',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 96,
        range: 0,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Agent',
        classRestriction: 'Agent',
        aoeRadius: 2,
        aoeOriginSelf: true,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }, {
            id: 'jammed',
            duration: 1
        }],
        desc: 'Emit a massive EMP pulse centered on self. Damages all enemies within 2 tiles and silences + jams them for 1 turn.'
    },

    {
        id: 'mindShatter',
        spellType: 'alien',
        name: 'Mind Shatter',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 200,
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
        desc: 'Tear apart an enemy\'s mind. Heavy magic damage and silences for 1 turn. Total shutdown.'
    },

    {
        id: 'overgrowth',
        spellType: 'anomaly',
        name: 'Overgrowth',
        type: 'damage',
        cost: 50,
        equipCost: 25,
        dmg: 112,
        range: 3,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Harvester',
        classRestriction: 'Harvester',
        aoeRadius: 1,
        leaveTerrain: 'dark_woods',
        statusEffects: [{
            id: 'slow',
            duration: 2
        }, {
            id: 'poison',
            duration: 3
        }],
        desc: 'Erupt thorny vines in a 3x3 area. Damages, poisons for 3 turns, and slows all enemies caught for 2 turns. Leaves dark woods in its wake.'
    },


    {
        id: 'fiveGTower',
        spellType: 'tech',
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
        desc: 'Deploy a 5G radio tower (3 hits to destroy). Its signal scrambles thought — enemies within 4 tiles lose 8 MDEF while it stands. Max 1 per Engineer.'
    },
    {
        id: 'tinFoilHat',
        spellType: 'tech',
        name: 'Tin Foil Hat',
        type: 'buff',
        cost: 20,
        equipCost: 10,
        apCost: 1,
        range: 2,
        kind: 'buff',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statStageBoost: { mdef: 2 },
        desc: 'Fit an ally with a precision-folded foil helmet: +2 MDEF for 3 turns. They called it a conspiracy theory. They were wrong.'
    },

    {
        id: 'requiem',
        spellType: 'unholy',
        name: 'Requiem',
        type: 'damage',
        cost: 60,
        equipCost: 25,
        dmg: 80,
        range: 4,
        kind: 'barrage',
        damageType: 'magic',
        tier: 'III',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statusEffects: [{
            id: 'discord',
            duration: 2
        }],
        desc: 'Play a devastating requiem that damages all enemies within range and applies Discord for 2 turns. The ultimate debuff anthem.'
    },


    {
        id: 'voidRush',
        spellType: 'anomaly',
        name: 'Void Rush',
        type: 'damage',
        cost: 30,
        equipCost: 20,
        dmg: 112,
        range: 4,
        kind: 'teleport',
        damageType: 'magic',
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        teleportDistance: 4,
        aoeRadius: 1,
        aoeOnArrival: true,
        desc: 'Warp through spacetime up to 4 tiles. Enemies within 1 tile of destination take 112 anomaly damage.'
    },
    {
        id: 'rocketCharge',
        spellType: 'tech',
        name: 'Rocket Charge',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 112,
        range: 3,
        kind: 'dash',
        damageType: 'physical',
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        dashDamage: 40,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }],
        desc: 'Ignite jetpack boosters and slam into a target up to 3 tiles away. Path enemies take 40 damage. Staggers primary target.'
    },
    {
        id: 'shadowLunge',
        spellType: 'tech',
        name: 'Shadow Lunge',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 80,
        range: 3,
        kind: 'dash',
        damageType: 'physical',
        tier: 'II',
        school: 'Agent',
        classRestriction: 'Agent',
        dashDamage: 24,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 40
        }, {
            id: 'slow',
            duration: 1
        }],
        desc: 'Cloak-dash up to 3 tiles through enemy lines, grazing units in your path. Tags and slows the primary target — a painted, slowed mark your team can collapse on.'
    },

    {
        id: 'sonicCharge',
        spellType: 'anomaly',
        name: 'Harmonize',
        type: 'buff',
        cost: 30,
        equipCost: 15,
        apCost: 1,
        range: 3,
        kind: 'buff',
        tier: 'II',
        school: 'Harbinger',
        classRestriction: 'Harbinger',
        statStageBoost: { int: 2 },
        desc: 'Attune an ally to the resonant frequency of the battlefield: +2 INT for 3 turns — stronger spells, truer ailments.'
    },


    {
        id: 'cleanse',
        spellType: 'divine',
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
        desc: 'Remove all debuffs from one ally. Pure divine purification.'
    },

    {
        id: 'exorcism',
        spellType: 'divine',
        name: 'Exorcism',
        type: 'damage',
        cost: 35,
        equipCost: 20,
        dmg: 160,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        unholyBonus: 80,
        desc: 'A purifying blast of holy energy. Deals massive bonus damage (+80) to Unholy-type targets.'
    },

    {
        id: 'nuke',
        spellType: 'tech',
        name: 'Nuke',
        type: 'damage',
        cost: 80,
        equipCost: 25,
        dmg: 224,
        range: 4,
        kind: 'delayed',
        delayTurns: 2,
        damageType: 'magic',
        aoeRadius: 2,
        tier: 'III',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statusEffects: [{ id: 'burn', duration: 3 }],
        friendlyFire: true,
        leaveTerrain: 'scorched',
        terrainDeform: { centerDelta: -3, edgeDelta: -1 },
        demolishesBuildings: true,
        desc: 'Mark a 5x5 area for a tactical nuke. Detonates after 2 rounds for devastating damage — hits EVERYONE including allies, and levels every building in the blast. Everyone sees it coming.'
    },

    {
        id: 'kneecapShot',
        spellType: 'tech',
        name: 'Kneecap Shot',
        type: 'damage',
        cost: 25,
        equipCost: 15,
        dmg: 96,
        range: 6,
        kind: 'damage',
        damageType: 'physical',
        projectileOverride: 'proj-bullet',
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{ id: 'stun', duration: 1 }],
        desc: 'A precise long-range shot to the legs. Deals damage and stuns the target for 1 turn.'
    },

    {
        id: 'kineticHurl',
        spellType: 'alien',
        name: 'Kinetic Hurl',
        type: 'damage',
        cost: 30,
        equipCost: 15,
        dmg: 128,
        range: 3,
        kind: 'displacement',
        damageType: 'magic',
        tier: 'I',
        school: 'Psychic',
        classRestriction: 'Psychic',
        displaceDistance: 2,
        collisionBonus: 64,
        arcThrow: true,
        desc: 'Grab an enemy with telekinesis and fling them 2 tiles. +64 bonus if they hit a wall, obstacle, or another unit.'
    },

    {
        id: 'bubble',
        spellType: 'alien',
        name: 'Bubble',
        type: 'buff',
        cost: 45,
        equipCost: 20,
        range: 3,
        kind: 'aoeShield',
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        aoeRadius: 1,
        shieldHp: 200,
        desc: 'Project a psychic bubble over a 3x3 area. Allies inside gain a shared shield (200 HP) that absorbs incoming damage until destroyed.'
    }
];
const SPELL_BY_ID = Object.fromEntries(SPELL_LIBRARY.map(spell => [spell.id, spell]));

const SPELL_EQUIP_REQUIREMENTS = {};

function equipmentMeetsSpellReq(equipment, spellId) { return true; }
function unitMeetsSpellEquipReq(unit, spellId) { return true; }

const SHARED_FLASH_FREEZE = {
    id: 'sharedFlashFreeze', spellType: 'anomaly', name: 'Flash Freeze',
    type: 'damage', cost: 25, dmg: 70, range: 4, apCost: 1,
    kind: 'terrainCreate', terrainType: 'ice', tileCount: 3, orientable: true,
    damageType: 'magic',
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Freeze 3 tiles in a line. Enemies caught take damage and are slowed. Leaves slippery ice terrain.'
};

const SHARED_TIDAL_SURGE = {
    id: 'sharedTidalSurge', spellType: 'anomaly', name: 'Tidal Surge',
    type: 'damage', cost: 30, dmg: 90, range: 5,
    kind: 'linePush', damageType: 'magic', lineWidth: 1, pushDistance: 2,
    leaveTerrain: 'water',
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Crashing wave in a line. Damages and pushes enemies 2 tiles back, leaving shallow water.'
};

const SHARED_GLACIAL_TOMB = {
    id: 'sharedGlacialTomb', spellType: 'anomaly', name: 'Glacial Tomb',
    type: 'debuff', cost: 30, range: 3, apCost: 1,
    kind: 'debuff',
    statusEffects: [{ id: 'stun', duration: 1 }],
    statStageBoost: { def: -1 },
    desc: 'Encase an enemy in ice. Stunned 1 turn and -1 DEF stage.'
};

const SHARED_MAELSTROM = {
    id: 'sharedMaelstrom', spellType: 'anomaly', name: 'Maelstrom',
    type: 'damage', cost: 35, dmg: 80, range: 4, apCost: 2,
    kind: 'terrainCreate', terrainType: 'deep_water', tileCount: 5, orientable: false,
    aoeRadius: 1,
    damageType: 'magic',
    desc: 'Flood a 3×3 area with deep water. Enemies caught take damage and risk drowning.'
};

const SHARED_RAMPART = {
    id: 'sharedRampart', spellType: 'human', name: 'Rampart',
    type: 'utility', cost: 30, range: 3, apCost: 1,
    kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
    dmg: 60, damageType: 'physical',
    terrainDeform: { centerDelta: 2, edgeDelta: 0 },
    desc: 'Raise a 3-tile wall of impassable mountain terrain. Enemies on targeted tiles take damage and are pushed aside.'
};

const SHARED_FISSURE = {
    id: 'sharedFissure', spellType: 'anomaly', name: 'Fissure',
    type: 'damage', cost: 30, dmg: 100, range: 4, apCost: 1,
    kind: 'terrainCreate', terrainType: 'chasm', tileCount: 3, orientable: true,
    damageType: 'physical',
    statusEffects: [{ id: 'stagger', duration: 1 }],
    terrainDeform: { centerDelta: -2, edgeDelta: 0 },
    desc: 'Crack open the earth in a 3-tile line. Enemies caught take heavy damage and are staggered.'
};

const SHARED_SCORCHED_EARTH = {
    id: 'sharedScorchedEarth', spellType: 'unholy', name: 'Scorched Earth',
    type: 'damage', cost: 25, dmg: 70, range: 4,
    kind: 'terrainCreate', terrainType: 'scorched', tileCount: 3, orientable: true,
    damageType: 'magic',
    desc: 'Scorch 3 tiles in a line. Enemies caught take damage. Scorched tiles punish anyone who lingers.'
};

const SHARED_POISON_SWAMP = {
    id: 'sharedPoisonSwamp', spellType: 'unholy', name: 'Poison Swamp',
    type: 'damage', cost: 25, dmg: 60, range: 3, apCost: 1,
    kind: 'terrainCreate', terrainType: 'poison', tileCount: 3, orientable: true,
    damageType: 'magic',
    desc: 'Spread 3 poison tiles in a line. Enemies caught take damage. Toxic terrain poisons anyone who walks through.'
};

const SHARED_TERRAFORM = {
    id: 'sharedTerraform', spellType: 'divine', name: 'Terraform',
    type: 'utility', cost: 15, range: 3, apCost: 1,
    kind: 'terrainCreate', terrainType: 'grass', tileCount: 3, orientable: true,
    dmg: 0, damageType: 'magic',
    desc: 'Purify 3 tiles in a line, converting hazard terrain (lava, poison, scorched) into grass.'
};

const SHARED_SUMMON_BLIZZARD = {
    id: 'sharedSummonBlizzard', spellType: 'anomaly', name: 'Summon Blizzard',
    type: 'utility', cost: 35, range: 4, apCost: 2,
    kind: 'summonWeather',
    weatherType: 'blizzard',
    weatherDuration: [3, 4],
    weatherTiles: [4, 6],
    desc: 'Summon a homing blizzard. Each round it chases the nearest enemy, freezing a trail of ice and damaging any non-Anomaly it catches.'
};

const SHARED_SUMMON_SANDSTORM = {
    id: 'sharedSummonSandstorm', spellType: 'alien', name: 'Summon Sandstorm',
    type: 'utility', cost: 30, range: 4, apCost: 1,
    kind: 'summonWeather',
    weatherType: 'sandstorm',
    weatherDuration: [3, 5],
    weatherTiles: [5, 7],
    desc: 'Summon a homing sandstorm. Each round it chases the nearest enemy, scouring any non-Human it catches.'
};

const SHARED_SUMMON_BLOOD_RAIN = {
    id: 'sharedSummonBloodRain', spellType: 'unholy', name: 'Summon Blood Rain',
    type: 'utility', cost: 35, range: 4, apCost: 2,
    kind: 'summonWeather',
    weatherType: 'bloodRain',
    weatherDuration: [3, 5],
    weatherTiles: [5, 8],
    desc: 'Call down blood rain. Damages Divine units, heals Unholy units inside the zone.'
};

const SHARED_CALL_LIGHTNING = {
    id: 'sharedCallLightning', spellType: 'alien', name: 'Call Lightning',
    type: 'utility', cost: 30, range: 4, apCost: 1,
    kind: 'summonWeather',
    weatherType: 'thunderstorm',
    weatherDuration: [2, 3],
    weatherTiles: [3, 4],
    desc: 'Call down a homing thunderstorm. Each round it chases the nearest enemy, blasting anyone it catches with lightning.'
};

const SHARED_NUKE = {
    id: 'sharedNuke', spellType: 'tech', name: 'Nuke',
    type: 'damage', cost: 45, dmg: 180, range: 5, apCost: 2,
    kind: 'delayed', damageType: 'magic', aoeRadius: 2, delayTurns: 1,
    leaveTerrain: 'scorched',
    terrainDeform: { centerDelta: -3, edgeDelta: -1 },
    demolishesBuildings: true,
    desc: 'Launch a nuclear strike at target area. After 1 turn, 5×5 devastation. Enemies see the warning. Levels buildings and leaves scorched earth.'
};


const SHARED_SMOKE_SCREEN = {
    id: 'sharedSmokeScreen', spellType: 'human', name: 'Smoke Screen',
    type: 'utility', cost: 20, range: 3, apCost: 1,
    kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
    smokeConcealment: true,
    statusEffects: [],
    allyStatusEffects: [{ id: 'invisible', duration: 1 }],
    desc: 'Blanket a 3×3 area in smoke for 2 turns. Allies inside are hidden and stay invisible only while they remain in the cloud.'
};


const SHARED_VORTEX_SLAM = {
    id: 'sharedVortexSlam', spellType: 'anomaly', name: 'Vortex Slam',
    type: 'damage', cost: 35, dmg: 90, range: 4, apCost: 2,
    kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
    statusEffects: [{ id: 'slow', duration: 1 }],
    desc: 'Create a crushing vortex at target tile. 3×3 damage, pulls enemies toward center, slows.'
};

const RACE_ABILITIES = {

    'seraphim': [
        { id: 'raceDivineJudgment', spellType: 'divine', name: 'Divine Judgment',
          type: 'damage', cost: 40, dmg: 155, range: 4, apCost: 2,
          kind: 'cross', damageType: 'magic', crossRadius: 2,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Six-winged judgment. Cross-shaped divine blast incinerates enemies in cardinal lines.' },
        { id: 'raceAbsolution', spellType: 'divine', name: 'Absolution',
          type: 'heal', cost: 35, range: 0, apCost: 2,
          kind: 'healAll', healAmt: 130,
          cleanse: true,
          desc: 'Absolve all allies of harm. Heals all allied units 130 HP and cleanses 1 debuff each.' },
        { id: 'raceRapture', spellType: 'divine', name: 'Rapture',
          type: 'utility', cost: 40, range: 4, apCost: 2,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 2 }, { id: 'protect', duration: 1 }],
          desc: 'Radiate divine transcendence. All allies within 2 tiles gain Inspired 2 turns and Protect 1 turn.' },
        SHARED_TERRAFORM,
    ],
    'orb of light': [
        { id: 'racePrismBurst', spellType: 'divine', name: 'Prism Burst',
          type: 'damage', cost: 30, dmg: 112, range: 4,
          kind: 'ricochet', damageType: 'magic',
          bounceDamage: 80, bounceRadius: 2, wallBounce: true,
          desc: 'Beam of light ricochets off first target or wall into a nearby enemy.' },
        { id: 'raceLuminousShield', spellType: 'divine', name: 'Luminous Shield',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 140,
          desc: 'Envelop an ally in crystallized light. Grants a 140 HP damage shield.' },
        { id: 'racePhotonScatter', spellType: 'divine', name: 'Photon Scatter',
          type: 'damage', cost: 30, dmg: 80, range: 0,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          desc: 'Burst of pure light in all directions. Damages all enemies within 2 tiles.' },
        SHARED_TERRAFORM,
    ],
    'ghost': [
        { id: 'raceColdSpot', spellType: 'divine', name: 'Cold Spot',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Haunt a 3x3 area for 2 turns. Enemies inside are slowed and cannot counterattack.' },
        { id: 'racePossession', spellType: 'divine', name: 'Possession',
          type: 'debuff', cost: 35, range: 3, apCost: 2,
          kind: 'debuff',
          statusEffects: [{ id: 'jammed', duration: 2 }, { id: 'burn', duration: 2 }],
          desc: 'Invade an enemy\'s mind. Jammed for 2 turns and take burning psychic damage.' },
        { id: 'raceSpectralPassage', spellType: 'divine', name: 'Spectral Passage',
          type: 'utility', cost: 20, range: 5, apCost: 1,
          kind: 'teleport', teleportDistance: 5, requiresLineOfSight: false,
          desc: 'Phase through walls and terrain up to 5 tiles. Walls mean nothing to the dead.' },
        SHARED_FLASH_FREEZE,
        SHARED_TERRAFORM
    ],
    'angel': [
        { id: 'raceSanctuary', spellType: 'divine', name: 'Sanctuary',
          type: 'utility', cost: 35, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 48,
          desc: 'Consecrate a 3x3 area for 2 turns. Allies standing in it heal each round.' },
        { id: 'raceDivineSmite', spellType: 'divine', name: 'Divine Smite',
          type: 'damage', cost: 30, dmg: 128, range: 3,
          kind: 'damage', damageType: 'magic',
          chargeToTarget: true,
          desc: 'Descend upon an enemy in a flash of holy light. Dash up to 3 tiles dealing divine damage.' },
        { id: 'raceWingsOfMercy', spellType: 'divine', name: 'Wings of Mercy',
          type: 'utility', cost: 20, range: 4, apCost: 1,
          kind: 'swap', allyOnly: true, healOnSwap: 60,
          desc: 'Swap with an ally up to 4 tiles away. The ally heals 60 HP on arrival.' },
        SHARED_TERRAFORM,
    ],
    'gargoyle': [
        { id: 'racePerchForm', spellType: 'unholy', name: 'Perch Form',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          statStageBoost: { atk: 1 },
          desc: 'Petrify in place 1 turn (protected). Next attack deals boosted damage.' },
        { id: 'raceStonefall', spellType: 'unholy', name: 'Stonefall',
          type: 'damage', cost: 30, dmg: 115, range: 4,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Dive-bomb from above. Ignores line of sight. Staggers on impact.' },
        { id: 'raceGothicRampart', spellType: 'unholy', name: 'Gothic Rampart',
          type: 'utility', cost: 25, range: 2, apCost: 1,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 2, orientable: true,
          dmg: 50, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Raise 2 tiles of stone wall. Cheaper than Rampart but smaller. The cathedral grows.' },
        { id: 'raceStoneDrop', spellType: 'unholy', name: 'Stone Drop',
          type: 'damage', cost: 25, dmg: 60, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          requiresFlight: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Grab an adjacent enemy and release them from above. Damage scales with elevation delta. Staggers on landing.' },
        SHARED_RAMPART,
        SHARED_FISSURE
    ],

    'demon': [
        { id: 'raceContract', spellType: 'unholy', name: 'Contract',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff', statusEffects: [{ id: 'contract', duration: 3 }],
          desc: 'Forge a demonic contract. For 3 turns, caster heals 40% of all damage the target takes from any source.' },
        { id: 'raceHellmouth', spellType: 'unholy', name: 'Hellmouth',
          type: 'damage', cost: 35, dmg: 112, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          leaveTerrain: 'lava',
          desc: 'Tear open a fissure in a line. Damages enemies and leaves burning tiles behind.' },
        { id: 'raceVoidContract', spellType: 'unholy', name: 'Void Contract',
          type: 'damage', cost: 40, dmg: 165, range: 3, apCost: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.50,
          desc: 'Seal a contract in void-ink. Massive magic damage, heals 50% of damage dealt.' },
        { id: 'raceInfernalHurl', spellType: 'unholy', name: 'Infernal Hurl',
          type: 'damage', cost: 30, dmg: 70, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          requiresFlight: true,
          desc: 'Seize an adjacent enemy, lift them skyward, and hurl them up to 3 tiles. Collision damage if they hit another unit.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_BLOOD_RAIN
    ],
    'succubus': [
        { id: 'raceSoulSuck', spellType: 'unholy', name: 'Soul Suck',
          type: 'damage', cost: 30, dmg: 144, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.60,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Drain life from nearby enemy. Heals 60% of damage dealt, slows target.' },
        { id: 'raceCharm', spellType: 'unholy', name: 'Charm',
          type: 'debuff', cost: 30, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'charm', duration: 1 }],
          desc: 'Bewitch an enemy. Charmed targets cannot attack the caster for 1 turn. Removes 1 buff.' },
        { id: 'raceDrainingEmbrace', spellType: 'unholy', name: 'Draining Embrace',
          type: 'damage', cost: 35, dmg: 160, range: 1, apCost: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.60,
          desc: 'Devastating close-range life drain. 160 damage, heals 60%. Come closer, darling.' },
        SHARED_POISON_SWAMP,
    ],
    'zombie': [
        { id: 'raceInfectiousBite', spellType: 'unholy', name: 'Infectious Bite',
          type: 'damage', cost: 20, dmg: 128, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 3 }, { id: 'slow', duration: 1 }],
          desc: 'Savage melee bite. Poisons for 3 turns and slows.' },
        { id: 'raceShamblingHorde', spellType: 'unholy', name: 'Shambling Horde',
          type: 'utility', cost: 25, range: 2, apCost: 1,
          kind: 'deployObject', objectHp: 2, blocksMovement: true,
          maxActivePerCaster: 1,
          drawsRangedAttack: true, drawsMeleeAttack: true,
          desc: 'Summon a zombie decoy. Blocks movement, absorbs 2 hits. They just keep coming.' },
        { id: 'raceUndyingGrip', spellType: 'unholy', name: 'Undying Grip',
          type: 'damage', cost: 20, dmg: 64, range: 3,
          kind: 'pull', damageType: 'physical', pullDistance: 2, lineOfSight: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Reach out and drag an enemy 2 tiles toward you. Slows on arrival. Braaains...' },
        SHARED_POISON_SWAMP,
        SHARED_SCORCHED_EARTH
    ],
    'anubis': [
        { id: 'raceWeighTheHeart', spellType: 'unholy', name: 'Weigh the Heart',
          type: 'damage', cost: 35, dmg: 96, range: 4,
          kind: 'damage', damageType: 'magic', executeBonusPct: 0.5,
          desc: 'Curse-based attack that hits harder the lower the target HP. Execute finisher.' },
        { id: 'raceGravePassage', spellType: 'unholy', name: 'Grave Passage',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'deployPair', maxActivePerCaster: 1,
          desc: 'Place paired tomb-gate tiles. Allies can teleport between them once each.' },
        { id: 'raceCanopicCurse', spellType: 'unholy', name: 'Canopic Curse',
          type: 'debuff', cost: 30, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'jammed', duration: 2 }],
          desc: 'Seal a target\'s vital essence. Jammed for 2 turns — abilities cost more MP.' },
        SHARED_SUMMON_SANDSTORM,
        SHARED_FISSURE
    ],
    'skeleton': [
        { id: 'raceBoneToss', spellType: 'unholy', name: 'Bone Toss',
          type: 'damage', cost: 15, dmg: 96, range: 3,
          kind: 'damage', damageType: 'physical', ignoreArmor: true,
          desc: 'Hurl a bone at an enemy. Pierces armor completely. Low cost, reliable poke.' },
        { id: 'raceBoneWall', spellType: 'unholy', name: 'Bone Wall',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'deployObject', objectHp: 2, blocksMovement: true,
          maxActivePerCaster: 1,
          desc: 'Summon a wall of bones at a target tile. Blocks movement and absorbs 2 hits before crumbling.' },
        { id: 'raceReassemble', spellType: 'unholy', name: 'Reassemble',
          type: 'heal', cost: 25, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.30,
          desc: 'Pull yourself back together. Heal 30% max HP. You can\'t kill what\'s already dead.' },
        SHARED_POISON_SWAMP,
        SHARED_FISSURE
    ],
    'mothman': [
        { id: 'raceDreadAura', spellType: 'unholy', name: 'Dread Aura',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Emit a wave of dread. All enemies within 2 tiles suffer Discord for 2 turns.' },
        { id: 'raceProphecyOfDisaster', spellType: 'unholy', name: 'Prophecy of Disaster',
          type: 'damage', cost: 35, dmg: 130, range: 5, apCost: 2,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          desc: 'Mark a 3×3 area for disaster. Detonates after 1 turn. He tried to warn them about the bridge.' },
        { id: 'raceRedEyes', spellType: 'unholy', name: 'Red Eyes',
          type: 'debuff', cost: 20, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 30 }, { id: 'discord', duration: 2 }],
          desc: 'Lock onto a target with piercing red eyes. Marked for +30 damage and discord 2 turns.' },
        { id: 'raceAbduction', spellType: 'unholy', name: 'Abduction',
          type: 'damage', cost: 25, dmg: 60, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 5, dmgPerLevel: 25,
          requiresFlight: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Snatch an adjacent enemy into the sky and release them. Damage scales with height. They never speak of what they saw up there.' },
        SHARED_SUMMON_SANDSTORM
    ],
    'shadow entity': [
        { id: 'racePhaseShift', spellType: 'anomaly', name: 'Phase Shift',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }, { id: 'invisible', duration: 1 }],
          desc: 'Phase out of reality. Protected and invisible for 1 turn.' },
        { id: 'raceShadowBind', spellType: 'anomaly', name: 'Shadow Bind',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'slow', duration: 2 }, { id: 'glare', duration: 2 }],
          desc: 'Pin a target\'s shadow to the ground. Slowed and DEF reduced for 2 turns.' },
        { id: 'raceVoidStep', spellType: 'anomaly', name: 'Void Step',
          type: 'utility', cost: 15, range: 4, apCost: 1,
          kind: 'teleport', teleportDistance: 4, requiresLineOfSight: false,
          desc: 'Cheapest teleport in the game. It doesn\'t walk. It simply isn\'t, then is.' },
        SHARED_SMOKE_SCREEN,
    ],
    'werewolf': [
        { id: 'racePounce', spellType: 'human', name: 'Pounce',
          type: 'damage', cost: 25, dmg: 144, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          desc: 'Leap up to 3 tiles and maul the target on landing.' },
        { id: 'raceHowl', spellType: 'human', name: 'Howl',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          desc: 'Throw back your head and howl. +2 ATK stages. The beast is unleashed.' },
        { id: 'raceBloodFrenzy', spellType: 'unholy', name: 'Blood Frenzy',
          type: 'damage', cost: 20, apCost: 2, range: 6,
          kind: 'damage', damageType: 'physical', dmg: 150,
          chargeToTarget: true, autoTargetLowestHp: true,
          desc: 'Smell blood. Charge the visible enemy with the least health and savage them. Cannot be cast if no enemies are visible.' },
        { id: 'raceSavageRend', spellType: 'human', name: 'Savage Rend',
          type: 'damage', cost: 30, range: 1,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [50, 50, 50],
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Claw, claw, bite. 3-hit combo for 150 total. Bleeds the target.' },
        { id: 'raceFeralDive', spellType: 'human', name: 'Feral Dive',
          type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Leap from high ground onto an enemy below. Damage scales with elevation drop. The wolf descends.' }
    ],

    'fairy': [
        { id: 'raceGlitterburst', spellType: 'anomaly', name: 'Glitterburst',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'glare', duration: 1 }],
          desc: 'Sparkling dust explosion in a 3x3. Damages and dazzles (DEF down) enemies.' },
        { id: 'racePixieDustTrail', spellType: 'anomaly', name: 'Pixie Dust Trail',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Sprinkle enchanted dust on an ally. Inspired for 2 turns. Follow the sparkles!' },
        { id: 'raceTrickRoom', spellType: 'anomaly', name: 'Trick Room',
          type: 'utility', cost: 30, range: 0, apCost: 2,
          kind: 'trickRoom', trickRoomDuration: 3,
          desc: 'Warp the flow of time for 3 rounds. Turn order is reversed — the slowest units act first and the fastest act last.' }
    ],
    'reptilian': [
        { id: 'raceShedSkin', spellType: 'anomaly', name: 'Shed Skin',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', cleanse: 1, teleportDistance: 2, spawnDecoy: true,
          desc: 'Leave a decoy, cleanse 1 debuff, teleport 2 tiles away. Decoy draws 1 attack.' },
        { id: 'raceTailWhip', spellType: 'anomaly', name: 'Tail Whip',
          type: 'damage', cost: 20, dmg: 96, range: 1,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Whip an adjacent enemy with a powerful tail strike. Pushes 2 tiles and slows.' },
        { id: 'raceConspiracyOfScales', spellType: 'anomaly', name: 'Conspiracy of Scales',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'invisible', duration: 2 }],
          statStageBoost: { atk: 1 },
          desc: 'Blend into the environment. Invisible 2 turns, +1 ATK. They\'re already among us.' },
        SHARED_POISON_SWAMP,
        SHARED_SMOKE_SCREEN
    ],
    'skinwalker': [
        { id: 'raceBorrowedClaw', spellType: 'anomaly', name: 'Borrowed Claw',
          type: 'damage', cost: 25, dmg: 144, range: 1,
          kind: 'damage', damageType: 'physical', stealSpell: true,
          desc: 'Savage melee strike that rips a spell from the target — they lose it, you learn it.' },
        { id: 'raceSkinSwap', spellType: 'anomaly', name: 'Skin Swap',
          type: 'utility', cost: 25, range: 4, apCost: 1,
          kind: 'swap', requiresLineOfSight: true,
          desc: 'Swap positions with a target enemy in line of sight. No damage.' },
        { id: 'raceMimicry', spellType: 'anomaly', name: 'Mimicry',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 2 }],
          statStageBoost: { atk: 1, def: 1 },
          desc: 'Study visible enemies and adapt. +1 ATK, +1 DEF stages and Inspired for 2 turns.' },
        SHARED_SMOKE_SCREEN,
        SHARED_POISON_SWAMP
    ],
    'antperson': [
        { id: 'raceFormicAcid', spellType: 'anomaly', name: 'Formic Acid',
          type: 'damage', cost: 30, dmg: 96, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'glare', duration: 2 }],
          leaveTerrain: 'poison',
          desc: 'Spit a corrosive line. Damages, shreds DEF 2 turns, leaves poison tiles.' },
        { id: 'raceTunnelNetwork', spellType: 'anomaly', name: 'Tunnel Network',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployPair', maxActivePerCaster: 1,
          desc: 'Place paired tunnel entrances. Any allied unit can teleport between them once. The colony is everywhere.' },
        { id: 'raceSwarmSignal', spellType: 'anomaly', name: 'Swarm Signal',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 1 },
          desc: 'Release attack pheromones. All allies within 2 tiles gain +1 ATK stage.' },
        SHARED_POISON_SWAMP,
        SHARED_RAMPART
    ],
    'scarecrow': [
        { id: 'raceHarvestHook', spellType: 'anomaly', name: 'Harvest Hook',
          type: 'damage', cost: 25, dmg: 64, range: 4,
          kind: 'pull', damageType: 'physical',
          pullDistance: 4, pullThroughHazards: true,
          desc: 'Hook an enemy and drag them through hazard tiles toward you.' },
        { id: 'raceStuffedDouble', spellType: 'anomaly', name: 'Stuffed Double',
          type: 'utility', cost: 15, range: 1, apCost: 1,
          kind: 'deployObject', objectHp: 1, blocksMovement: true,
          drawsRangedAttack: true, drawsMeleeAttack: true, maxActivePerCaster: 1,
          desc: 'Place a scarecrow decoy. Blocks movement, absorbs 1 hit.' },
        { id: 'raceCrowStorm', spellType: 'anomaly', name: 'Crow Storm',
          type: 'damage', cost: 30, dmg: 80, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'A murder of crows descends on a 3×3 area. Damages and discords enemies. The crows remember.' },
        SHARED_SUMMON_SANDSTORM,
    ],
    'bigfoot': [
        { id: 'raceTremorStomp', spellType: 'anomaly', name: 'Tremor Stomp',
          type: 'damage', cost: 30, dmg: 96, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Stomp the ground. 3x3 physical damage to all enemies around you.' },
        { id: 'raceRealityShift', spellType: 'anomaly', name: 'Reality Shift',
          type: 'buff', cost: 25, range: 0, apCost: 1,
          kind: 'buff', cleanse: 99,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'Step sideways out of reality. Cleanse all debuffs and turn invisible for 2 turns.' },
        { id: 'raceTrunkThrow', spellType: 'anomaly', name: 'Trunk Throw',
          type: 'damage', cost: 25, dmg: 130, range: 4,
          kind: 'damage', damageType: 'physical',
          desc: 'Rip a tree from the ground and hurl it. Heavy physical damage to a single target.' },
        SHARED_RAMPART
    ],
    'siren': [
        { id: 'raceSonicBreaker', spellType: 'anomaly', name: 'Sonic Breaker',
          type: 'damage', cost: 30, dmg: 112, range: 4,
          kind: 'linePush', damageType: 'magic', lineWidth: 1, pushDistance: 2,
          desc: 'Piercing soundwave in a line. Damages and pushes enemies 2 tiles back.' },
        { id: 'raceCallOfTheDeep', spellType: 'anomaly', name: 'Call of the Deep',
          type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 2,
          kind: 'terrainCreate', terrainType: 'deep_water', tileCount: 3, orientable: true,
          damageType: 'magic',
          desc: 'Drown 3 tiles in a line under deep water, damaging enemies caught in the flood.' },
        { id: 'raceDeafeningWail', spellType: 'anomaly', name: 'Deafening Wail',
          type: 'damage', cost: 30, dmg: 70, range: 0,
          kind: 'aoe', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'Ear-splitting scream. Damages all enemies within 2 tiles and silences them. The last thing sailors hear.' },
        SHARED_TIDAL_SURGE,
        SHARED_MAELSTROM
    ],

    'mech': [
        { id: 'raceMortarSalvo', spellType: 'tech', name: 'Mortar Salvo',
          type: 'damage', cost: 40, dmg: 128, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          ignoresLineOfSight: true,
          desc: 'Long-range indirect 3x3 bombardment. Can fire over walls and obstacles.' },
        { id: 'raceSiegeMode', spellType: 'tech', name: 'Siege Mode',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          statStageBoost: { atk: 2, def: 1 },
          desc: 'Lock down into siege configuration. +2 ATK, +1 DEF stages and Protected for 1 turn.' },
        { id: 'raceEject', spellType: 'tech', name: 'Eject!',
          type: 'utility', cost: 15, range: 0, apCost: 1,
          kind: 'escape', teleportDistance: 3,
          desc: 'EJECT EJECT EJECT! Emergency teleport 3 tiles away.' },
        SHARED_NUKE,
        SHARED_SCORCHED_EARTH
    ],
    'glitch': [
        { id: 'raceCrashLoop', spellType: 'tech', name: 'Crash Loop',
          type: 'damage', cost: 30, dmg: 112, range: 3,
          kind: 'damage', damageType: 'magic',
          repeatOnStay: true, repeatDmg: 112,
          desc: 'Corrupt a target. Damage now, then again if they end next turn on the same tile.' },
        { id: 'raceMemoryLeak', spellType: 'tech', name: 'Memory Leak',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff', statusEffects: [{ id: 'jammed', duration: 2 }, { id: 'slow', duration: 1 }],
          desc: 'Corrupt target\'s systems. Jammed for 2 turns and slowed.' },
        { id: 'raceBlueScreen', spellType: 'tech', name: 'Blue Screen',
          type: 'debuff', cost: 35, range: 3, apCost: 2,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }, { id: 'silence', duration: 1 }],
          desc: 'Target\'s consciousness encounters a fatal error. Stunned and silenced 1 turn.' },
        SHARED_FISSURE
    ],
    'ai': [
        { id: 'raceOvercalculate', spellType: 'tech', name: 'Overcalculate',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Run predictive algorithms. Inspired for 2 turns (+ATK, +DEF).' },
        { id: 'racePredictiveModel', spellType: 'tech', name: 'Predictive Model',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 35 }],
          desc: 'Calculate a target\'s next 47 moves. Marked for +35 bonus damage for 3 turns.' },
        { id: 'raceRecursiveLoop', spellType: 'tech', name: 'Recursive Loop',
          type: 'damage', cost: 30, dmg: 80, range: 3,
          kind: 'damage', damageType: 'magic',
          bonusVsDebuffed: 0.50,
          desc: 'While (alive) { suffer(); } — 80 damage, +50% bonus if target already has a debuff.' },
    ],
    'robot': [
        { id: 'raceChassisSlan', spellType: 'tech', name: 'Chassis Slam',
          type: 'damage', cost: 25, dmg: 96, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          pushDistance: 1,
          desc: 'Full-body slam. 3x3 around self, damages and pushes enemies 1 tile outward.' },
        { id: 'raceIronGuard', spellType: 'tech', name: 'Iron Guard',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 2 }],
          desc: 'Activate defensive plating. Protected for 2 turns, absorbing reduced damage.' },
        { id: 'raceRocketFist', spellType: 'tech', name: 'Rocket Fist',
          type: 'damage', cost: 25, dmg: 110, range: 3,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          desc: 'Launch a detachable fist. 110 damage, pushes target 2 tiles. Reusable.' },
    ],
    'android': [
        { id: 'raceNeuralHack', spellType: 'tech', name: 'Neural Hack',
          type: 'debuff', cost: 25, range: 3,
          kind: 'debuff', statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Hack enemy neural pathways. Staggers them (lose 1 AP).' },
        { id: 'raceSelfRepairProtocol', spellType: 'tech', name: 'Self-Repair Protocol',
          type: 'heal', cost: 25, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.35, cleanse: 1,
          desc: 'Running diagnostic... damage repaired. Heal 35% max HP and cleanse 1 debuff.' },
        { id: 'raceSyntheticBlade', spellType: 'tech', name: 'Synthetic Blade',
          type: 'damage', cost: 25, dmg: 130, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'Precision melee strike faster than human reflexes. Shreds DEF for 2 turns.' },
        SHARED_SMOKE_SCREEN,
    ],

    'giant': [
        { id: 'raceTitanStep', spellType: 'human', name: 'Titan Step',
          type: 'damage', cost: 30, dmg: 112, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Stomp the ground with titanic force. 3x3 AoE, damages and staggers enemies.' },
        { id: 'raceBoulderHurl', spellType: 'human', name: 'Boulder Hurl',
          type: 'damage', cost: 30, dmg: 120, range: 5,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          desc: 'Hurl a massive boulder. Ignores line of sight (arcing projectile). Fee fi fo fum.' },
        { id: 'raceEarthenGrasp', spellType: 'human', name: 'Earthen Grasp',
          type: 'damage', cost: 20, dmg: 64, range: 3,
          kind: 'pull', damageType: 'physical', pullDistance: 2, lineOfSight: true,
          desc: 'Reach out and yank an enemy 2 tiles toward you. Come down here.' },
        SHARED_RAMPART,
    ],
    'catgirl': [
        { id: 'raceNinefoldScratch', spellType: 'human', name: 'Ninefold Scratch',
          type: 'damage', cost: 30, range: 1,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [32, 32, 32, 32, 32],
          desc: 'Furious 5-hit melee combo. 160 total damage. Shreds through shields.' },
        { id: 'raceNimbleDodge', spellType: 'human', name: 'Nimble Dodge',
          type: 'utility', cost: 15, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 2,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Gracefully dash 2 tiles away and vanish for 1 turn. Perfect evasive maneuver.' },
        { id: 'raceMeow', spellType: 'anomaly', name: 'Meow',
          type: 'debuff', cost: 18, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'An adorable, disarming meow. All enemies within 2 tiles have their DEF lowered for 2 turns.' },
        { id: 'raceLoveBite', spellType: 'anomaly', name: 'Love Bite',
          type: 'damage', cost: 22, dmg: 90, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'A flirtatious nibble that draws blood. Damages an adjacent enemy and lowers their DEF for 2 turns.' },
        SHARED_SMOKE_SCREEN
    ],
    'homosapien': [
        { id: 'raceAdrenalineRush', spellType: 'human', name: 'Adrenaline Rush',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'selfHeal', selfHealPct: 0.30, cleanse: 2,
          statStageBoost: { spd: 1 },
          desc: 'Tap into survival instincts. Heal 30% max HP, cleanse 2 debuffs, and gain +1 SPD. Humanity refuses to die.' }
    ],
    'pirate': [
        { id: 'raceCannonball', spellType: 'tech', name: 'Cannonball',
          type: 'damage', cost: 28, dmg: 130, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Fire a heavy iron cannonball that explodes on impact. Damages all enemies in a 3×3 blast and sets them ablaze.' },
        { id: 'raceWalkThePlank', spellType: 'human', name: 'Walk the Plank',
          type: 'damage', cost: 35, dmg: 90, range: 3, apCost: 2,
          kind: 'terrainCreate', terrainType: 'deep_water', tileCount: 9, orientable: false,
          aoeRadius: 1, squareFlood: true, damageType: 'physical', executePct: 0.20,
          desc: 'Force enemies overboard. Floods a 3×3 area with deep water, drowning all caught. Executes any enemy below 20% HP.' },
        { id: 'racePlunder', spellType: 'human', name: 'Plunder',
          type: 'utility', cost: 18, dmg: 70, apCost: 1, range: 1,
          kind: 'utility', damageType: 'physical',
          desc: 'Strike an adjacent enemy and steal a random item or 1 hourglass from them.' },
        { id: 'raceYoHo', spellType: 'human', name: 'Yo Ho',
          type: 'heal', cost: 35, range: 0, apCost: 2,
          kind: 'healAll', healAmt: 110, cleanse: 2,
          statStageBoost: { atk: 1, int: -1 },
          desc: 'Pass the rum! Heals all allies 110 HP, cleanses 2 debuffs each, and rallies the crew with +1 ATK / -1 INT.' },
        { id: 'raceBoardingRush', spellType: 'human', name: 'Land Ho',
          type: 'damage', cost: 25, dmg: 128, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true, swapOnHit: true,
          desc: 'Land ho! Charge an enemy, strike them, and swap positions if the tile behind them is open.' },
        { id: 'raceAnchor', spellType: 'human', name: 'Anchor',
          type: 'debuff', cost: 25, range: 2, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Drop a massive anchor on an enemy, pinning them in place. Stunned for 1 turn. Deals no damage.' },
        { id: 'raceGrapple', spellType: 'human', name: 'Grapple',
          type: 'utility', cost: 20, apCost: 1, range: 3,
          kind: 'utility',
          desc: 'Fire a grappling hook. Pull target enemy 2 tiles toward you and reel them in for a hit, or pull yourself toward a wall.' },
    ],

    'knight': [
        { id: 'raceShieldWall', spellType: 'human', name: 'Castle Fortress',
          type: 'utility', cost: 25, apCost: 1, range: 3,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
          dmg: 40, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Raise a 3-tile brick wall of fortress stone. Impassable rampart that walls off the battlefield.' },
        { id: 'raceOathOfValor', spellType: 'divine', name: 'Oath of Valor',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'warCry', auraRadius: 2,
          statStageBoost: { atk: 1, def: 1 },
          desc: 'Swear an oath that inspires nearby allies. +1 ATK and +1 DEF to allies within 2 tiles for 2 turns.' },
        { id: 'raceChivalry', spellType: 'human', name: 'Chivalry',
          type: 'utility', cost: 15, apCost: 1, range: 4,
          kind: 'guard',
          desc: 'Pledge to protect an ally. The next time that ally is targeted by an attack, you dash to their side and take the hit in their place.' }
    ],
    'shaman': [
        { id: 'raceSpiritWalk', spellType: 'anomaly', name: 'Spirit Walk',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Enter the spirit world briefly. Teleport up to 3 tiles and become invisible for 1 turn.' },
        { id: 'raceHerbalRemedy', spellType: 'anomaly', name: 'Herbal Remedy',
          type: 'heal', cost: 25, range: 3, apCost: 1,
          kind: 'heal', healAmt: 120, cleanse: 2,
          desc: 'Apply ancient plant medicine. Heal 120 HP and cleanse 2 debuffs from an ally.' },
        { id: 'raceTotemDrop', spellType: 'anomaly', name: 'Totem Drop',
          type: 'utility', cost: 25, apCost: 1, range: 2,
          kind: 'deployObject',
          objectHp: 40, maxActivePerCaster: 1,
          auraHeal: 30, auraRadius: 2,
          desc: 'Place a spirit totem. Allies within 2 tiles regenerate 30 HP per turn. Lasts until destroyed.' },
        { id: 'raceAyahuascaRetreat', spellType: 'anomaly', name: 'Ayahuasca Retreat',
          type: 'buff', cost: 35, apCost: 2, range: 0,
          kind: 'buff',
          selfHealPct: 0.50, cleanse: 99,
          statStageBoost: { atk: 1, def: 1 },
          desc: 'Enter a deep trance. Heal 50% max HP, cleanse ALL debuffs, and gain +1 ATK/DEF. Costs 2 AP.' },
    ],
    'mad scientist': [
        { id: 'raceTeslaTrap', spellType: 'tech', name: 'Tesla Coil',
          type: 'utility', cost: 20, apCost: 1, range: 2,
          kind: 'deployObject',
          objectHp: 20, blastRadius: 1, blastDmg: 100,
          detonateOnStep: true, maxActivePerCaster: 3,
          desc: 'Deploy an electrified coil. Detonates when an enemy steps on it. 3×3 shock damage.' },
        { id: 'racePlandemic', spellType: 'tech', name: 'Plandemic',
          type: 'damage', cost: 30, dmg: 90, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Release an engineered contagion. 3×3 magic damage and poisons everyone hit for 3 turns.' },
        { id: 'raceCloneDecoy', spellType: 'tech', name: 'Cloning Machine',
          type: 'utility', cost: 20, apCost: 1, range: 1,
          kind: 'deployObject',
          objectHp: 60, maxActivePerCaster: 1,
          drawsRangedAttack: true, drawsMeleeAttack: true,
          desc: 'Print a decoy clone on an adjacent tile. It draws enemy attention but cannot attack.' },
        { id: 'raceOvercharge', spellType: 'tech', name: 'Chemical Bath',
          type: 'damage', cost: 30, dmg: 100, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Douse a 3×3 area in caustic chemicals. Magic damage and burns everyone hit for 2 turns.' }
    ],
    'cowboy': [
        { id: 'raceFanTheHammer', spellType: 'human', name: 'Fan the Hammer',
          type: 'damage', cost: 25, dmg: 60, range: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          projectileOverride: 'proj-bullet',
          desc: 'Fire wildly at everything nearby. 3×3 physical damage around the target.' },
        { id: 'raceLasso', spellType: 'human', name: 'Lasso',
          type: 'utility', cost: 15, apCost: 1, range: 3,
          kind: 'pull', pullDistance: 2,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Rope an enemy and yank them 2 tiles toward you. Staggers on hit.' },
        { id: 'raceHighNoon', spellType: 'human', name: 'High Noon',
          type: 'damage', cost: 35, dmg: 200, range: 4,
          kind: 'damage', damageType: 'physical',
          guaranteedCrit: true,
          projectileOverride: 'proj-bullet',
          desc: 'Draw. One shot, guaranteed critical hit. The fastest gun in the west.' },
        { id: 'raceTumbleweed', spellType: 'human', name: 'Tumbleweed Roll',
          type: 'utility', cost: 10, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 2,
          desc: 'Dodge-roll 2 tiles in any direction. Quick repositioning.' },
    ],
    'men in black': [
        { id: 'raceDeneuralizer', spellType: 'tech', name: 'Deneuralizer',
          type: 'debuff', cost: 30, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'jammed', duration: 2 }],
          desc: 'Flash the deneuralizer. Jams the target\'s abilities — they cannot cast their last used ability for 2 turns.' },
        { id: 'raceClassifiedWeapon', spellType: 'alien', name: 'Classified Weapon',
          type: 'damage', cost: 30, dmg: 150, range: 4,
          kind: 'damage', damageType: 'magic',
          desc: 'Fire an alien-tech sidearm. High single-target magic damage.' },
        { id: 'raceAgentVanish', spellType: 'tech', name: 'Agent Vanish',
          type: 'utility', cost: 15, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'You didn\'t see anything. Teleport 3 tiles and go invisible for 2 turns.' },
        SHARED_SMOKE_SCREEN
    ],
    'telepath': [
        { id: 'raceMindCrush', spellType: 'anomaly', name: 'Mind Crush',
          type: 'damage', cost: 30, dmg: 130, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Psychic assault that overwhelms the target\'s mind. Magic damage and staggers.' },
        { id: 'raceTelepathicLink', spellType: 'anomaly', name: 'Telepathic Link',
          type: 'buff', cost: 20, range: 3, apCost: 1,
          kind: 'warCry', auraRadius: 2,
          statStageBoost: { atk: 1 },
          desc: 'Link minds with nearby allies. All allies within 2 tiles gain +1 ATK stage.' },
        { id: 'racePsychicBarrier', spellType: 'anomaly', name: 'Psychic Barrier',
          type: 'buff', cost: 25, range: 3, apCost: 1,
          kind: 'buff',
          shield: 150,
          desc: 'Project a telekinetic shield onto an ally. Absorbs 150 damage before breaking.' },
        { id: 'raceBrainwash', spellType: 'anomaly', name: 'Brainwash',
          type: 'debuff', cost: 35, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Rewire an enemy\'s neural pathways. Discorded for 2 turns — they may attack their own allies.' },
    ],
    'marksman': [
        { id: 'raceSuppressiveFire', spellType: 'human', name: 'Bullet Skewer',
          type: 'damage', cost: 25, dmg: 60, range: 4,
          kind: 'line', damageType: 'physical', lineWidth: 1,
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Skewer everything in a line with rapid fire. Damages and slows all enemies hit for 2 turns.' },
        SHARED_SMOKE_SCREEN
    ],
    'priest': [
        { id: 'raceDivineLight', spellType: 'divine', name: 'Divine Light',
          type: 'heal', cost: 25, range: 3, apCost: 1,
          kind: 'heal', healAmt: 140,
          desc: 'Channel holy light to heal an ally for 140 HP.' },
        { id: 'raceAbsolution', spellType: 'divine', name: 'Absolution',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'heal', healAmt: 80, cleanse: 99,
          desc: 'Forgive all sins. Heal 80 HP and cleanse ALL debuffs from an ally.' },
        { id: 'raceSanctuary', spellType: 'divine', name: 'Sanctuary',
          type: 'buff', cost: 30, range: 0, apCost: 1,
          kind: 'warCry', auraRadius: 2,
          healAmt: 60,
          desc: 'Create a sanctified zone. All allies within 2 tiles are healed 60 HP.' },
        { id: 'raceSmite', spellType: 'divine', name: 'Smite',
          type: 'damage', cost: 25, dmg: 110, range: 3,
          kind: 'damage', damageType: 'magic',
          bonusVsUnholy: 0.50,
          desc: 'Strike with holy wrath. 110 magic damage, +50% bonus against Unholy type units.' },
    ],
    'wizard': [
        { id: 'raceArcaneBlast', spellType: 'unholy', name: 'Arcane Blast',
          type: 'damage', cost: 30, dmg: 120, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          desc: 'Unleash raw arcane energy. 3×3 area magic damage.' },
        { id: 'raceSpellsteal', spellType: 'unholy', name: 'Spellsteal',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff', stealSpell: true,
          desc: 'Reach into an enemy\'s mind and rip out a spell. Steal one of the target\'s spells — they lose it, you learn it.' },
        { id: 'raceManaShield', spellType: 'unholy', name: 'Mana Shield',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'shield',
          shield: 200,
          desc: 'Convert mana into a protective barrier. Absorb 200 damage.' }
    ],
    'fortune teller': [
        { id: 'raceTarotDraw', spellType: 'anomaly', name: 'Tarot Draw',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'buff',
          statStageBoost: { int: 2 },
          desc: 'Draw from the deck of fate. Grant a unit +2 INT stages — sharpen their magic.' },
        { id: 'raceCurseOfMisfortune', spellType: 'anomaly', name: 'Family Curse',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statStageBoost: { atk: -1, def: -1 },
          desc: 'Lay a generational hex of bad luck. Target loses -1 ATK and -1 DEF stages.' },
        { id: 'raceCrystalBall', spellType: 'anomaly', name: 'Crystal Ball',
          type: 'damage', cost: 25, dmg: 150, range: 5, apCost: 1,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          desc: 'Foresee a death. Mark a spot — destiny strikes the target (and any enemies beside them) for heavy magic damage 1 round later.' },
        { id: 'raceSpiritChannel', spellType: 'anomaly', name: 'Palm Read',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'heal', healAmt: 100, cleanse: 1,
          desc: 'Read an ally\'s fate in their palm. Heal 100 HP and cleanse 1 debuff.' }
    ],

    'martian': [
        { id: 'raceHeatRay', spellType: 'alien', name: 'Heat Ray',
          type: 'damage', cost: 30, dmg: 120, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          leaveTerrain: 'scorched',
          desc: 'Long straight beam that damages all units in a line and scorches the ground.' },
        { id: 'raceTractorBeam', spellType: 'alien', name: 'Tractor Beam',
          type: 'utility', cost: 20, range: 4, apCost: 1,
          kind: 'pull', pullDistance: 3, lineOfSight: true,
          desc: 'Pull one enemy up to 3 tiles toward you in a straight line.' },
        { id: 'raceWarOfTheWorlds', spellType: 'alien', name: 'War of the Worlds',
          type: 'utility', cost: 35, range: 2, apCost: 1,
          kind: 'deployTurret', turretDmg: 75, turretRange: 3, turretHp: 80,
          maxActivePerCaster: 1,
          desc: 'Deploy a tripod turret. Auto-fires at nearest enemy each round. 75 damage, 3 range.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_SANDSTORM
    ],
    'annunaki': [
        { id: 'raceStarDecree', spellType: 'alien', name: 'Star Decree',
          type: 'damage', cost: 40, dmg: 176, range: 3,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          desc: 'Mark a tile for orbital judgment. Explodes 3x3 at end of next round.' },
        { id: 'raceGravityWell', spellType: 'alien', name: 'Gravity Well',
          type: 'damage', cost: 30, dmg: 80, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Gravitational singularity. 3x3 damage, pulls enemies inward, slows.' },
        { id: 'raceZigguratProtocol', spellType: 'alien', name: 'Ziggurat Protocol',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
          dmg: 60, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Raise a 3-tile wall of stone. They didn\'t build the pyramids. They grew them.' },
        SHARED_NUKE,
        SHARED_CALL_LIGHTNING,
        SHARED_FISSURE
    ],
    'nordic': [
        { id: 'raceThunderclap', spellType: 'alien', name: 'Thunderclap',
          type: 'damage', cost: 25, dmg: 96, range: 0,
          kind: 'cross', damageType: 'physical', crossRadius: 1, aoeOriginSelf: true,
          pushDistance: 1,
          desc: 'Hammer slam in cross pattern around self. Damages and pushes enemies 1 tile.' },
        { id: 'raceRunicWard', spellType: 'alien', name: 'Runic Ward',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 120,
          statusEffects: [{ id: 'inspired', duration: 1 }],
          desc: 'Inscribe a runic ward on an ally. Grants 120 HP shield and Inspired for 1 turn.' },
        { id: 'raceMjolnirsEcho', spellType: 'alien', name: 'Mjolnir\'s Echo',
          type: 'damage', cost: 35, dmg: 120, range: 4,
          kind: 'ricochet', damageType: 'magic',
          bounceDamage: 80, bounceRadius: 2, wallBounce: true,
          desc: 'Throw a thunderous hammer that ricochets to a nearby enemy. 120 + 80 bounce.' },
        SHARED_CALL_LIGHTNING,
        SHARED_SUMMON_BLIZZARD,
        SHARED_FLASH_FREEZE
    ],
    'grey': [
        { id: 'raceProbe', spellType: 'alien', name: 'Probe',
          type: 'damage', cost: 20, range: 4, apCost: 2,
          kind: 'damage', damageType: 'magic', dmg: 110,
          desc: 'Probe an enemy with invasive psychic instruments. Direct magic damage.' },
        { id: 'raceAbductionBeam', spellType: 'alien', name: 'Abduction Beam',
          type: 'damage', cost: 30, dmg: 60, range: 4, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 5, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          desc: 'Lift an enemy into your craft with a tractor beam, then drop them. Fall damage scales with the drop; bonus damage if they land on another unit.' },
        { id: 'raceImplant', spellType: 'alien', name: 'Implant',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 30 }],
          desc: 'Plant a psychic implant. Marked for +30 bonus damage for 3 turns. You won\'t remember this.' },
        { id: 'raceCropCircle', spellType: 'alien', name: 'Crop Circle',
          type: 'damage', cost: 30, dmg: 80, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'magic', aoeRadius: 2,
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Burn a 5×5 crop circle into the battlefield. Magic damage and presses the terrain into a concentric ringed depression.' }
    ],
    'mantid': [
        { id: 'raceMandibleStrike', spellType: 'alien', name: 'Mandible Strike',
          type: 'damage', cost: 25, range: 1,
          kind: 'multiHit', damageType: 'physical', hitDamages: [48, 48, 48],
          desc: 'Vicious 3-hit melee combo with razor mandibles. 144 total.' },
        { id: 'raceChitinArmor', spellType: 'alien', name: 'Chitin Armor',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          statStageBoost: { def: 2 },
          desc: 'Harden exoskeleton. Protected for 1 turn and +2 DEF stages.' },
        { id: 'raceAmbushLunge', spellType: 'alien', name: 'Ambush Lunge',
          type: 'damage', cost: 25, dmg: 120, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          desc: 'Lightning-fast lunge up to 3 tiles. You never see the mantis strike.' },
        SHARED_POISON_SWAMP,
    ],
    'djinn': [
        { id: 'raceDustDevil', spellType: 'alien', name: 'Dust Devil',
          type: 'damage', cost: 35, dmg: 96, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          desc: 'Swirling vortex at target tile. 3x3 damage, pulls enemies toward center.' },
        { id: 'raceWishGranted', spellType: 'divine', name: 'Wish Granted',
          type: 'buff', cost: 30, apCost: 1, range: 3,
          kind: 'buff', cleanse: 2,
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Grant an ally\'s wish. Cleanse 2 debuffs and grant Inspired for 2 turns.' },
        { id: 'raceSandglassPrison', spellType: 'alien', name: 'Sandglass Prison',
          type: 'debuff', cost: 30, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Trap a target in a sandglass. Stunned 1 turn. Your time has run out.' },
        SHARED_SUMMON_SANDSTORM,
        SHARED_CALL_LIGHTNING,
    ],
    'machine elves': [
        { id: 'raceFractalNeedle', spellType: 'alien', name: 'Fractal Needle',
          type: 'damage', cost: 35, dmg: 96, range: 4,
          kind: 'splitBeam', damageType: 'magic',
          splitCount: 2, splitDmg: 64, splitRadius: 2,
          desc: 'Beam hits first target, then splits into 2 smaller beams hitting nearby enemies.' },
        { id: 'raceDimensionalFold', spellType: 'alien', name: 'Dimensional Fold',
          type: 'utility', cost: 25, range: 5, apCost: 1,
          kind: 'swap', requiresLineOfSight: false,
          desc: 'Fold spacetime to swap positions with any unit within 5 tiles. Ignores line of sight.' },
        { id: 'raceSacredGeometry', spellType: 'alien', name: 'Sacred Geometry',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'terrainCreate', terrainType: 'crystal', tileCount: 3, orientable: true,
          dmg: 0, damageType: 'magic',
          desc: 'Create 3 crystal tiles in a line. Crystal terrain boosts DEF and blocks ranged. The pattern is the message.' },
        SHARED_CALL_LIGHTNING
    ],
    'cyclops': [
        { id: 'raceBalefulGaze', spellType: 'alien', name: 'Baleful Gaze',
          type: 'damage', cost: 30, dmg: 144, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1, destroysObstacles: true,
          desc: 'Devastating eye beam in a straight line. Destroys cover and obstacles in path.' },
        { id: 'raceGiantSmash', spellType: 'alien', name: 'Giant Smash',
          type: 'damage', cost: 30, dmg: 128, range: 2,
          kind: 'dash', damageType: 'physical',
          dashDamage: 56,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Barrel forward up to 2 tiles, crushing everything in path. Stuns enemies hit.' },
        { id: 'raceStoneThrow', spellType: 'alien', name: 'Stone Throw',
          type: 'damage', cost: 25, dmg: 110, range: 5,
          kind: 'damage', damageType: 'physical', ignoresLineOfSight: true,
          desc: 'Hurl a massive stone. Ignores line of sight. One eye. Perfect aim.' },
        SHARED_RAMPART,
        { id: 'raceTitanDrop', spellType: 'anomaly', name: 'Titan Drop',
          type: 'damage', cost: 25, dmg: 90, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 25,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Leap from elevation and crush an enemy below with one-eyed fury. Damage scales with height delta.' }
    ],

    'cyborg': [
        { id: 'raceOverclock', spellType: 'tech', name: 'Overclock',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'inspired', duration: 2 }],
          statStageBoost: { spd: 1 },
          desc: 'Push augmented systems past safe limits. Inspired 2 turns and +1 SPD stage.' },
        { id: 'raceEMPGrenade', spellType: 'tech', name: 'EMP Grenade',
          type: 'damage', cost: 30, dmg: 96, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'jammed', duration: 2 }],
          desc: 'Toss an EMP grenade. 3x3 blast damages and jams enemies for 2 turns.' },
        { id: 'raceHydraulicPunch', spellType: 'tech', name: 'Hydraulic Punch',
          type: 'damage', cost: 25, dmg: 135, range: 1,
          kind: 'damage', damageType: 'physical',
          pushDistance: 2,
          desc: 'Augmented fist, unaugmented face. 135 damage, pushes target 2 tiles.' },
        { id: 'raceRocketToss', spellType: 'tech', name: 'Rocket Toss',
          type: 'damage', cost: 30, dmg: 65, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 50,
          requiresFlight: true,
          desc: 'Engage thrusters, grab an adjacent enemy, and launch them up to 3 tiles. Jet-powered precision delivery.' },
    ],
    'demon prince': [
        { id: 'raceDarkDominion', spellType: 'unholy', name: 'Dark Dominion',
          type: 'damage', cost: 35, dmg: 128, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Unleash infernal authority in a 3x3 blast. Burns all enemies caught within.' },
        { id: 'raceDemonicRoar', spellType: 'unholy', name: 'Demonic Roar',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'aoe', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Terrifying roar. All enemies within 2 tiles are staggered, losing 1 AP.' },
        { id: 'raceThroneOfCinders', spellType: 'unholy', name: 'Throne of Cinders',
          type: 'buff', cost: 30, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 1 }],
          statStageBoost: { atk: 1 },
          desc: 'Claim a throne of burning rubble. Protected 1 turn and +1 ATK stage.' },
        { id: 'raceInfernalConscription', spellType: 'unholy', name: 'Infernal Conscription',
          type: 'debuff', cost: 35, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }, { id: 'glare', duration: 2 }],
          desc: 'Conscript an enemy\'s soul. Marked +40 damage and DEF reduced for 2 turns.' },
        { id: 'raceMeteorSlam', spellType: 'unholy', name: 'Meteor Slam',
          type: 'damage', cost: 35, dmg: 80, range: 1, apCost: 2,
          kind: 'skySlam', damageType: 'physical', carryHeight: 5, dmgPerLevel: 30,
          requiresFlight: true, aoeRadius: 1, aoeDmgPct: 0.50,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Seize an adjacent enemy, rocket skyward, and slam them into the earth. Caster lands with them. 3×3 shockwave on impact.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SUMMON_BLOOD_RAIN
    ],
    'demon princess': [
        { id: 'raceHexOfAgony', spellType: 'unholy', name: 'Hex of Agony',
          type: 'debuff', cost: 30, range: 4, apCost: 1,
          kind: 'debuff', statusEffects: [{ id: 'poison', duration: 3 }, { id: 'slow', duration: 2 }],
          desc: 'Lay a wasting hex on a target. Poison 3 turns and slow 2 turns.' },
        { id: 'raceDarkLullaby', spellType: 'unholy', name: 'Dark Lullaby',
          type: 'damage', cost: 35, dmg: 96, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'Sing a corrupted melody in a 3x3 area. Damages and briefly silences enemies.' },
        { id: 'raceKissOfDecay', spellType: 'unholy', name: 'Kiss of Decay',
          type: 'damage', cost: 30, dmg: 110, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'A kiss to die for. Literally. Life drain + poison.' },
        SHARED_POISON_SWAMP,
        SHARED_SUMMON_BLOOD_RAIN
    ],
    'dreameater': [
        { id: 'raceDreamSiphon', spellType: 'alien', name: 'Dream Siphon',
          type: 'damage', cost: 30, dmg: 112, range: 3,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          desc: 'Feast on psychic energy. Deals damage and heals 40% of damage dealt.' },
        { id: 'raceNightmarePulse', spellType: 'alien', name: 'Nightmare Pulse',
          type: 'damage', cost: 35, dmg: 80, range: 0,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }, { id: 'slow', duration: 1 }],
          desc: 'Emit a wave of psychic dread around self. 3x3 damage, staggers and slows.' },
        { id: 'raceLucidTrap', spellType: 'alien', name: 'Lucid Trap',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployObject', objectHp: 1, blocksMovement: false,
          detonateOnStep: true, blastRadius: 0, blastDmg: 0,
          maxActivePerCaster: 1,
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Place a dream snare. First enemy to step on it is stunned 1 turn. You\'re still dreaming.' },
        SHARED_GLACIAL_TOMB
    ],
    'fallen angel': [
        { id: 'raceFallenGrace', spellType: 'divine', name: 'Fallen Grace',
          type: 'damage', cost: 35, dmg: 120, range: 4,
          kind: 'cross', damageType: 'magic', crossRadius: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Corrupted holy light in a cross pattern. Burns enemies caught in the radiance.' },
        { id: 'raceAbyssalWings', spellType: 'unholy', name: 'Abyssal Wings',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', statusEffects: [{ id: 'protect', duration: 1 }],
          statStageBoost: { atk: 1, def: 1 },
          desc: 'Unfurl dark wings. Protected for 1 turn, boosted ATK and DEF.' },
        { id: 'raceCorruptedSanctuary', spellType: 'unholy', name: 'Corrupted Sanctuary',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 30,
          desc: 'Consecrate a twisted 3×3 area. Allies heal 30/turn. A church built on lies still has a congregation.' },
        { id: 'raceDescendingWrath', spellType: 'unholy', name: 'Descending Wrath',
          type: 'damage', cost: 35, dmg: 75, range: 1, apCost: 2,
          kind: 'skySlam', damageType: 'magic', carryHeight: 5, dmgPerLevel: 25,
          requiresFlight: true,
          statusEffects: [{ id: 'burn', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Seize an adjacent enemy and plummet from the heavens. Caster lands with them. Burns on impact.' },
        SHARED_SUMMON_BLOOD_RAIN,
        SHARED_SCORCHED_EARTH,
        SHARED_TERRAFORM
    ],
    'goatman': [
        { id: 'raceGoreCharge', spellType: 'unholy', name: 'Gore Charge',
          type: 'damage', cost: 30, dmg: 144, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Lower horns and charge up to 3 tiles. Massive impact damage and stagger.' },
        { id: 'raceBloodRitual', spellType: 'anomaly', name: 'Blood Ritual',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff', selfDamagePct: 0.10,
          statStageBoost: { atk: 2 },
          desc: 'Sacrifice 10% HP in a dark ritual. Gain +2 ATK stages.' },
        { id: 'raceBlackPhillipsGaze', spellType: 'unholy', name: 'Black Phillip\'s Gaze',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'discord', duration: 2 }, { id: 'slow', duration: 1 }],
          desc: 'Wouldst thou like to live deliciously? Discord 2 turns and slow 1 turn.' },
        { id: 'raceCliffCharge', spellType: 'unholy', name: 'Cliff Charge',
          type: 'damage', cost: 25, dmg: 80, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Leap from elevated terrain onto lower prey with horns-first impact. Damage scales with height.' }
    ],
    'halfdemon': [
        { id: 'raceShadowStep', spellType: 'unholy', name: 'Shadow Step',
          type: 'utility', cost: 20, range: 4, apCost: 1,
          kind: 'teleport', teleportDistance: 4, requiresLineOfSight: false,
          desc: 'Blink through shadow up to 4 tiles. Ignores line of sight.' },
        { id: 'raceDemonicClaw', spellType: 'human', name: 'Demonic Claw',
          type: 'damage', cost: 25, dmg: 128, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'marked', duration: 2, bonusDamage: 30 }],
          desc: 'Savage claw strike. Marks the target for 2 turns (+30 bonus damage).' },
        { id: 'raceShadowInfiltration', spellType: 'unholy', name: 'Shadow Infiltration',
          type: 'damage', cost: 25, dmg: 105, range: 3, apCost: 2,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Dash through shadows to strike a target. Poisons on hit for 3 turns.' },
        { id: 'raceInnerDemon', spellType: 'unholy', name: 'Inner Demon',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff', selfDamagePct: 0.15,
          statStageBoost: { atk: 2 },
          statusEffects: [{ id: 'inspired', duration: 1 }],
          desc: 'Let the other half out. -15% HP, +2 ATK stages and Inspired 1 turn.' },
        SHARED_SCORCHED_EARTH,
        SHARED_SMOKE_SCREEN
    ],
    'mermaid': [
        { id: 'raceTidalBlessing', spellType: 'anomaly', name: 'Tidal Blessing',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 52,
          desc: 'Summon healing waters in a 3x3 area for 2 turns. Allies inside heal each round.' },
        { id: 'raceWhirlpool', spellType: 'anomaly', name: 'Whirlpool',
          type: 'damage', cost: 35, dmg: 96, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          leaveTerrain: 'deep_water',
          desc: 'Create a vortex at target tile. 3x3 damage, pulls enemies inward, leaves deep water.' },
        { id: 'raceSirenSong', spellType: 'anomaly', name: 'Siren Song',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'sirenSong', duration: 1 }],
          desc: 'Bewitch an enemy with an irresistible melody. Target walks 1 tile toward caster.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE,
        SHARED_MAELSTROM
    ],
    'nephilim': [
        { id: 'raceHolyBulwark', spellType: 'divine', name: 'Holy Bulwark',
          type: 'buff', cost: 25, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 160,
          desc: 'Project a divine shield over a 3x3 area. Allies gain a 160 HP shared shield.' },
        { id: 'raceSmite', spellType: 'human', name: 'Smite',
          type: 'damage', cost: 30, dmg: 136, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Channel divine wrath through a mighty strike. Heavy damage and stuns 1 turn.' },
        { id: 'raceWrathOfTheWatchers', spellType: 'divine', name: 'Wrath of the Watchers',
          type: 'damage', cost: 35, dmg: 120, range: 4,
          kind: 'cross', damageType: 'magic', crossRadius: 2,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Biblical wrath in a cross pattern. Burns enemies. The Nephilim were on the earth in those days.' },
        SHARED_RAMPART,
        SHARED_FISSURE
    ],
    'vampire': [
        { id: 'raceLifetap', spellType: 'unholy', name: 'Lifetap',
          type: 'damage', cost: 25, dmg: 120, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.50,
          desc: 'Drain the lifeforce from an enemy. Heals 50% of damage dealt.' },
        { id: 'raceBatSwarm', spellType: 'unholy', name: 'Bat Swarm',
          type: 'damage', cost: 30, dmg: 80, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'Unleash a swarm of bats in a 3x3 area. Damages and shreds DEF for 2 turns.' },
        { id: 'raceMistForm', spellType: 'unholy', name: 'Mist Form',
          type: 'utility', cost: 20, range: 0, apCost: 1,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Dissolve into mist. Teleport 3 tiles and become invisible for 1 turn.' },
        { id: 'raceBloodThrall', spellType: 'unholy', name: 'Blood Thrall',
          type: 'debuff', cost: 30, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }],
          desc: 'Mark a target as your thrall. +40 bonus damage for 3 turns. Your blood calls to me.' },
        { id: 'racePredatorDrop', spellType: 'unholy', name: 'Predator Drop',
          type: 'damage', cost: 25, dmg: 60, range: 1, apCost: 1,
          kind: 'skyDrop', damageType: 'physical', carryHeight: 4, dmgPerLevel: 25,
          requiresFlight: true, drainPct: 0.30,
          desc: 'Swoop down, grab a nearby enemy, and release them from above. Heals 30% of damage dealt. The night hunts.' },
        SHARED_SUMMON_BLOOD_RAIN,
        SHARED_SMOKE_SCREEN
    ],
    'voidweaver': [
        { id: 'raceWebSnare', spellType: 'alien', name: 'Web Snare',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          projectileOverride: 'proj-spiderweb',
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Launch a web trap at target tile. 3x3 area damages and ensnares enemies for 2 turns.' },
        { id: 'raceVenomFang', spellType: 'alien', name: 'Venom Fang',
          type: 'damage', cost: 30, dmg: 144, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Sink massive fangs into adjacent prey. Heavy damage and lethal poison for 3 turns.' },
        { id: 'raceDimensionalWeb', spellType: 'alien', name: 'Dimensional Web',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Weave a web between dimensions over 3×3 for 2 turns. Enemies inside are heavily slowed.' },
        SHARED_POISON_SWAMP,
    ],
    'cosmic wraith': [
        { id: 'raceEntropicBeam', spellType: 'alien', name: 'Entropic Beam',
          type: 'damage', cost: 35, dmg: 128, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'Fire a beam of entropic energy in a line. Damages and shreds DEF 2 turns.' },
        { id: 'racePhaseWalk', spellType: 'tech', name: 'Phase Walk',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'teleport', teleportDistance: 3,
          desc: 'Phase through reality up to 3 tiles. Repositioning tool.' },
        { id: 'raceHeatDeath', spellType: 'alien', name: 'Heat Death',
          type: 'utility', cost: 35, range: 4, apCost: 2,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 1 }, { id: 'glare', duration: 1 }],
          desc: 'Impose entropy on a 3×3 area for 2 turns. All energy tends toward entropy.' },
        SHARED_FISSURE,
        SHARED_SUMMON_BLIZZARD
    ],
    'superhero': [
        { id: 'raceHeroicLeap', spellType: 'human', name: 'Heroic Leap',
          type: 'damage', cost: 25, dmg: 112, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          desc: 'Leap up to 3 tiles and slam into a target with superhuman force.' },
        { id: 'raceLaserBeam', spellType: 'alien', name: 'Laser Beam',
          type: 'damage', cost: 35, dmg: 136, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'burn', duration: 1 }],
          desc: 'Fire a devastating laser beam in a straight line. Burns all enemies in its path.' },
        { id: 'raceShockwaveClap', spellType: 'human', name: 'Shockwave Clap',
          type: 'damage', cost: 25, dmg: 90, range: 4,
          kind: 'linePush', damageType: 'physical', lineWidth: 1, pushDistance: 2,
          desc: 'Thunderous clap sends a shockwave in a line. Pushes enemies 2 tiles. Stand back, citizens.' },
        { id: 'raceInvulnerable', spellType: 'human', name: 'Invulnerable',
          type: 'buff', cost: 30, apCost: 2, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 2 }, { id: 'inspired', duration: 1 }],
          desc: 'Activate superhuman durability. Protected 2 turns, Inspired 1 turn. Bullets bounce off.' },
        SHARED_CALL_LIGHTNING
    ],
    'general': [
        { id: 'raceRallyCommand', spellType: 'human', name: 'Rally Command',
          type: 'buff', cost: 30, range: 0, apCost: 2,
          kind: 'warCry', aoeRadius: 2,
          statusEffects: [{ id: 'inspired', duration: 2 }],
          statStageBoost: { atk: 1, def: 1 },
          desc: 'Rally all allies within 2 tiles. Grants +ATK, +DEF stages and Inspired for 2 turns.' },
        { id: 'raceIronBulwark', spellType: 'human', name: 'Iron Bulwark',
          type: 'buff', cost: 20, range: 0, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 2 }],
          statStageBoost: { def: 2 },
          desc: 'Brace for impact. Grants Protect and +2 DEF stages for 2 turns.' },
        { id: 'raceArtilleryStrike', spellType: 'human', name: 'Artillery Strike',
          type: 'damage', cost: 40, dmg: 160, range: 6, apCost: 2,
          kind: 'delayed', damageType: 'physical', aoeRadius: 1, delayTurns: 1,
          leaveTerrain: 'scorched',
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Call in an artillery barrage. After 1 turn, 3×3 devastation. Fire for effect.' },
        SHARED_NUKE,
        SHARED_RAMPART,
    ],
    'droid': [
        { id: 'raceSystemAnalysis', spellType: 'tech', name: 'System Analysis',
          type: 'debuff', cost: 20, range: 5, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }, { id: 'scanner', duration: 2 }],
          desc: 'Deep-scan a target. Marks them for +40 bonus damage and reveals for 2 turns.' },
        { id: 'raceFirewallProtocol', spellType: 'tech', name: 'Firewall Protocol',
          type: 'buff', cost: 35, range: 3, apCost: 2,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 120,
          desc: 'Deploy digital firewalls. Shields all allies in a 3×3 area for 120 HP.' },
        { id: 'raceTaserBolt', spellType: 'tech', name: 'Taser Bolt',
          type: 'damage', cost: 20, dmg: 90, range: 3,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Quick electric bolt. 90 damage, staggers target. Bzzt.' },
    ],
    'antihero': [
        { id: 'raceCosmicSlam', spellType: 'human', name: 'Cosmic Slam',
          type: 'damage', cost: 35, dmg: 130, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          selfCenter: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Slam the ground with cosmic force. Damages and staggers all adjacent enemies.' },
        { id: 'raceTimeSurge', spellType: 'alien', name: 'Time Surge',
          type: 'buff', cost: 30, range: 0, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'overclock', duration: 1 }, { id: 'inspired', duration: 2 }],
          statStageBoost: { spd: 2 },
          desc: 'Dilate time around yourself. Grants Overclock, Inspired, and +2 SPD stages.' },
        { id: 'raceDarkJustice', spellType: 'human', name: 'Dark Justice',
          type: 'damage', cost: 30, dmg: 120, range: 3,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          bonusVsDebuffed: 0.40,
          desc: 'I\'m not the hero. Charge up to 3 tiles. +40% damage if target has a debuff.' },
    ],
    'conspiracy theorist': [
        { id: 'raceVOXBroadcast', spellType: 'human', name: 'VOX Broadcast',
          type: 'buff', cost: 30, range: 0, apCost: 2,
          kind: 'warCry', aoeRadius: 2,
          statusEffects: [{ id: 'inspired', duration: 2 }],
          statStageBoost: { atk: 1 },
          desc: 'Go live on the underground signal. Inspires all allies within 2 tiles and boosts ATK.' },
        { id: 'raceDeadAir', spellType: 'human', name: 'Dead Air',
          type: 'utility', cost: 30, range: 3, apCost: 2,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'Kill the signal in a 3×3 area for 2 turns. Enemies inside are silenced.' },
        { id: 'raceTinfoilFortress', spellType: 'human', name: 'Tinfoil Fortress',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 100,
          desc: 'They can\'t get in if you\'re wrapped tight enough. Grants a 100 HP damage shield.' },
        SHARED_SUMMON_SANDSTORM
    ],
    'overlord': [
        { id: 'raceInfernalDecree', spellType: 'unholy', name: 'Infernal Decree',
          type: 'damage', cost: 40, dmg: 145, range: 3, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Royal demonic proclamation. Scorches a 3×3 area with hellfire, burning survivors.' },
        { id: 'raceHellfireCrown', spellType: 'unholy', name: 'Hellfire Crown',
          type: 'buff', cost: 30, range: 0, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 2 }, { id: 'protect', duration: 1 }],
          statStageBoost: { atk: 2 },
          desc: 'Ignite the infernal crown. +2 ATK stages, Inspired 2 turns, Protect 1 turn.' },
        { id: 'raceVassalage', spellType: 'unholy', name: 'Vassalage',
          type: 'debuff', cost: 25, range: 4, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'marked', duration: 3, bonusDamage: 40 }],
          desc: 'Claim an enemy as vassal. Marked for +40 bonus damage for 3 turns. You serve ME now.' },
        { id: 'raceCataclysmDecree', spellType: 'unholy', name: 'Cataclysm Decree',
          type: 'damage', cost: 40, dmg: 150, range: 5, apCost: 2,
          kind: 'delayed', damageType: 'magic', aoeRadius: 1, delayTurns: 1,
          leaveTerrain: 'lava',
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'The overlord decrees annihilation. 3×3 delayed blast, leaves lava.' },
        SHARED_SCORCHED_EARTH,
        SHARED_NUKE
    ],
    'chosen one': [
        { id: 'racePhantomDouble', spellType: 'anomaly', name: 'Phantom Double',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'deployObject', maxActivePerCaster: 1, objectHp: 3,
          blocksMovement: false,
          drawsRangedAttack: true, drawsMeleeAttack: true,
          desc: 'Conjure an illusory double at target tile. Draws enemy attention.' },
        { id: 'raceDarkFeather', spellType: 'unholy', name: 'Dark Feather',
          type: 'damage', cost: 30, dmg: 115, range: 3, apCost: 2,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Glide through shadows on dark wings. Dash to target, dealing damage and poisoning.' },
        { id: 'raceProphecyFulfilled', spellType: 'divine', name: 'Prophecy Fulfilled',
          type: 'buff', cost: 30, apCost: 2, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'overclock', duration: 1 }, { id: 'inspired', duration: 1 }, { id: 'protect', duration: 1 }],
          desc: 'This was always how it was going to end. Overclock + Inspired + Protect for 1 turn.' },
        SHARED_TERRAFORM
    ],
    'politician': [
        { id: 'raceExecutiveOrder', spellType: 'human', name: 'Executive Order',
          type: 'debuff', cost: 35, range: 4, apCost: 2,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Issue a presidential directive. Target is stunned 1 turn — no actions, no appeals.' },
        { id: 'raceBlackBudget', spellType: 'human', name: 'Black Budget',
          type: 'buff', cost: 25, range: 3, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'overclock', duration: 1 }, { id: 'inspired', duration: 2 }],
          desc: 'Funnel classified resources to an ally. Grants Overclock and Inspired.' },
        { id: 'raceFilibuster', spellType: 'human', name: 'Filibuster',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'silence', duration: 1 }],
          desc: 'I yield the floor to NO ONE. 3×3 zone for 2 turns. Enemies inside are silenced.' },
        SHARED_NUKE,
    ],

    'atlantean': [
        { id: 'raceTemporalTide', spellType: 'anomaly', name: 'Temporal Tide',
          type: 'heal', cost: 30, range: 3, apCost: 1,
          kind: 'zoneHeal', aoeRadius: 1, zoneDuration: 2, healPerTurn: 55,
          desc: 'Summon time-shifted waters in a 3×3 area for 2 turns. Allies inside heal each round.' },
        { id: 'raceRiptide', spellType: 'anomaly', name: 'Riptide',
          type: 'damage', cost: 30, dmg: 105, range: 4,
          kind: 'aoePull', damageType: 'magic', aoeRadius: 1, pullToCenter: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Crushing vortex at target tile. 3×3 damage, pulls enemies toward center, slows.' },
        { id: 'raceOrichalcumBarrier', spellType: 'anomaly', name: 'Orichalcum Barrier',
          type: 'utility', cost: 25, range: 2, apCost: 1,
          kind: 'deployObject', objectHp: 3, blocksMovement: true,
          maxActivePerCaster: 1,
          desc: 'Deploy an Atlantean barrier. 3 HP, blocks movement and ranged. Built to last 10,000 years.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE,
    ],
    'dinosaur': [
        { id: 'raceApexCharge', spellType: 'anomaly', name: 'Apex Charge',
          type: 'damage', cost: 30, dmg: 135, range: 3, apCost: 2,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Charge up to 3 tiles and slam into the target. Massive physical damage, staggers on hit.' },
        { id: 'racePrimalRoar', spellType: 'anomaly', name: 'Primal Roar',
          type: 'debuff', cost: 20, range: 0, apCost: 1,
          kind: 'aoe', aoeRadius: 1, aoeOriginSelf: true,
          damageType: 'physical', dmg: 0,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Ear-splitting roar. All enemies in 3×3 around self are discorded for 2 turns.' },
        { id: 'raceJurassicJaw', spellType: 'anomaly', name: 'Jurassic Jaw',
          type: 'damage', cost: 25, dmg: 140, range: 1,
          kind: 'damage', damageType: 'physical', ignoreArmor: true,
          desc: 'Life finds a way. Death finds it faster. Armor-piercing bite for 140 damage.' },
        { id: 'raceApexPounce', spellType: 'anomaly', name: 'Apex Pounce',
          type: 'damage', cost: 25, dmg: 85, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 25,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: '65 million years of predatory instinct. Leap from high ground onto prey below. Damage scales with the drop.' },
        SHARED_FISSURE,
    ],
    'dragon': [
        { id: 'raceDragonfire', spellType: 'unholy', name: 'Dragonfire',
          type: 'damage', cost: 35, dmg: 130, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          leaveTerrain: 'lava',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Breathe a line of dragonfire. Burns enemies and leaves lava tiles behind.' },
        { id: 'raceWingGust', spellType: 'anomaly', name: 'Wing Gust',
          type: 'damage', cost: 25, dmg: 80, range: 0, apCost: 1,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          pushDistance: 2,
          desc: 'Beat massive wings. 3×3 around self, damages and pushes enemies 2 tiles outward.' },
        { id: 'raceDragonfear', spellType: 'unholy', name: 'Dragonfear',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 3, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }, { id: 'glare', duration: 1 }],
          desc: 'Ancient terror. All enemies within 3 tiles: discord 2 turns and DEF down 1 turn.' },
        { id: 'raceDragonToss', spellType: 'anomaly', name: 'Dragon Toss',
          type: 'damage', cost: 30, dmg: 70, range: 1, apCost: 1,
          kind: 'skyThrow', damageType: 'physical', carryHeight: 5, dmgPerLevel: 25,
          throwRange: 3, collisionBonus: 60,
          requiresFlight: true,
          desc: 'Snatch an adjacent enemy in massive claws, soar upward, and hurl them up to 3 tiles. Devastating if they hit another unit.' },
        SHARED_SCORCHED_EARTH,
        SHARED_FISSURE,
    ],
    'ghoul': [
        { id: 'raceGhoulishBite', spellType: 'unholy', name: 'Ghoulish Bite',
          type: 'damage', cost: 25, dmg: 110, range: 1,
          kind: 'lifeDrain', damageType: 'physical', drainPct: 0.40,
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Sink rotting fangs into a target. Heals 40% of damage dealt and poisons 2 turns.' },
        { id: 'raceCorpseCrawl', spellType: 'unholy', name: 'Corpse Crawl',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'invisible', duration: 1 }],
          desc: 'Burrow through the earth up to 3 tiles away, turning invisible for 1 turn.' },
        { id: 'raceCarrionFeast', spellType: 'unholy', name: 'Carrion Feast',
          type: 'heal', cost: 20, range: 0, apCost: 1,
          kind: 'selfHeal', selfHealPct: 0.25,
          desc: 'Feed on the fallen. Heal 25% max HP. Waste not, want not.' },
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
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Plant a proximity mine. Detonates when stepped on — 3×3 blast, damages and staggers.' },
        { id: 'raceTinkersContraption', spellType: 'anomaly', name: 'Tinker\'s Contraption',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 100,
          desc: 'Strap a clockwork shield onto an ally. 100 HP shield. Perfectly safe. Probably.' },
        SHARED_RAMPART,
    ],
    'kaiju': [
        { id: 'raceCataclysmStomp', spellType: 'unholy', name: 'Cataclysm Stomp',
          type: 'damage', cost: 35, dmg: 105, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -2, edgeDelta: -1 },
          desc: 'Shake the entire battlefield. 5×5 around self, damages and staggers all enemies.' },
        { id: 'raceAtomicBreath', spellType: 'tech', name: 'Atomic Breath',
          type: 'damage', cost: 40, dmg: 140, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          leaveTerrain: 'scorched',
          desc: 'Devastating beam in a straight line. Damages all enemies and scorches the ground.' },
        { id: 'raceSkyscraperToss', spellType: 'unholy', name: 'Skyscraper Toss',
          type: 'damage', cost: 35, dmg: 130, range: 5,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, ignoresLineOfSight: true,
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Hurl a building at the target area. 3×3 physical devastation. Ignores line of sight.' },
        { id: 'raceSeismicLeap', spellType: 'anomaly', name: 'Seismic Leap',
          type: 'damage', cost: 30, dmg: 90, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 30,
          aoeRadius: 1, aoeDmgPct: 0.40,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Leap from elevation and crash down with city-leveling force. 3×3 shockwave on landing. Damage scales with height.' },
        SHARED_FISSURE,
        SHARED_NUKE
    ],
    'kraken': [
        { id: 'raceTentacleLash', spellType: 'anomaly', name: 'Tentacle Lash',
          type: 'damage', cost: 25, dmg: 95, range: 3,
          kind: 'pull', damageType: 'physical', pullDistance: 2, lineOfSight: true,
          desc: 'Lash out with a massive tentacle. Damages and pulls the target 2 tiles toward you.' },
        { id: 'raceInkCloud', spellType: 'anomaly', name: 'Ink Cloud',
          type: 'debuff', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'slow', duration: 1 }, { id: 'discord', duration: 2 }],
          desc: 'Spray blinding ink over a 3×3 area for 2 turns. Enemies are slowed and disoriented.' },
        { id: 'raceDepthCharge', spellType: 'anomaly', name: 'Depth Charge',
          type: 'damage', cost: 35, dmg: 100, range: 4,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'Explosive pressure wave in a 3×3 area. From the depths.' },
        SHARED_TIDAL_SURGE,
        SHARED_MAELSTROM,
        SHARED_VORTEX_SLAM
    ],
    'loch ness monster': [
        { id: 'raceDeepDive', spellType: 'anomaly', name: 'Deep Dive',
          type: 'utility', cost: 20, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 3,
          statusEffects: [{ id: 'protect', duration: 1 }],
          desc: 'Submerge and resurface up to 3 tiles away. Protected 1 turn upon emerging.' },
        { id: 'raceTidalSlam', spellType: 'anomaly', name: 'Tidal Slam',
          type: 'damage', cost: 30, dmg: 100, range: 0,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          leaveTerrain: 'deep_water',
          statusEffects: [{ id: 'slow', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Slam the ground. 3×3 around self, damages, slows, and floods tiles with deep water.' },
        { id: 'raceCryptidVanish', spellType: 'anomaly', name: 'Cryptid Vanish',
          type: 'utility', cost: 15, apCost: 1, range: 0,
          kind: 'escape', teleportDistance: 2,
          statusEffects: [{ id: 'invisible', duration: 2 }],
          desc: 'Was it real? The photo\'s blurry... Teleport 2 tiles, invisible 2 turns.' },
        SHARED_FLASH_FREEZE,
        SHARED_TIDAL_SURGE,
        SHARED_GLACIAL_TOMB
    ],
    'yeti': [
        { id: 'raceAvalancheSlam', spellType: 'anomaly', name: 'Avalanche Slam',
          type: 'damage', cost: 30, dmg: 115, range: 0, apCost: 2,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          statusEffects: [{ id: 'slow', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: -1 },
          desc: 'Bring down an avalanche. 3×3 around self, damages and slows enemies 2 turns.' },
        { id: 'racePermafrost', spellType: 'anomaly', name: 'Permafrost',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          statStageBoost: { def: -1 },
          desc: 'Encase a target in ice. Stunned 1 turn and -1 DEF stage. Frozen solid.' },
        { id: 'raceWhiteout', spellType: 'anomaly', name: 'Whiteout',
          type: 'utility', cost: 30, range: 3, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Blinding snow over 3×3 for 2 turns. Enemies inside lose all sense of direction.' },
        SHARED_FLASH_FREEZE,
        SHARED_SUMMON_BLIZZARD,
        SHARED_GLACIAL_TOMB,
        { id: 'raceAvalancheDive', spellType: 'anomaly', name: 'Avalanche Dive',
          type: 'damage', cost: 25, dmg: 80, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          statusEffects: [{ id: 'slow', duration: 2 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Leap from the heights like an avalanche. Damage scales with elevation delta. Slows on impact.' }
    ],

    'barbarella': [
        { id: 'raceStunRay', spellType: 'tech', name: 'Stun Ray',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Retro ray-gun blast. Zaps a target for damage and stuns 1 turn. Groovy.' },
        { id: 'raceSpaceDisco', spellType: 'anomaly', name: 'Space Disco',
          type: 'damage', cost: 30, dmg: 80, range: 0, apCost: 1,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Dazzling disco burst around self. All enemies within 2 tiles take damage and are confused.' },
        { id: 'raceGravityBoots', spellType: 'tech', name: 'Gravity Boots',
          type: 'utility', cost: 15, range: 4, apCost: 1,
          kind: 'teleport', teleportDistance: 4,
          desc: 'Activate anti-gravity boots to reposition up to 4 tiles. Far out.' },
        { id: 'raceCharmBeam', spellType: 'anomaly', name: 'Charm Beam',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'discord', duration: 2 }],
          statStageBoost: { atk: -1 },
          desc: 'Irresistible charm ray. Target is confused 2 turns and ATK reduced.' },
        { id: 'racePlasmaWhip', spellType: 'tech', name: 'Plasma Whip',
          type: 'damage', cost: 30, dmg: 130, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Crack a plasma whip at close range. Heavy damage and burning for 2 turns.' }
    ],

    'black goo': [
        { id: 'raceCorrosiveSplash', spellType: 'unholy', name: 'Corrosive Splash',
          type: 'damage', cost: 25, dmg: 90, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Hurl a glob of caustic goo in a 3x3 area. Poisons enemies for 2 turns.' },
        { id: 'raceAbsorb', spellType: 'unholy', name: 'Absorb',
          type: 'damage', cost: 30, dmg: 120, range: 1,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          desc: 'Engulf an adjacent enemy. Deals damage and absorbs 40% as HP.' },
        { id: 'raceMitosisSplit', spellType: 'anomaly', name: 'Mitosis',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'protect', duration: 2 }, { id: 'regen', duration: 2 }],
          desc: 'Split and reform. Gain Protect and Regen for 2 turns as mass redistributes.' },
        { id: 'raceOozeTrail', spellType: 'unholy', name: 'Ooze Trail',
          type: 'utility', cost: 25, range: 4, apCost: 1,
          kind: 'terrainCreate', terrainType: 'swamp', tileCount: 3, orientable: true,
          statusEffects: [{ id: 'slow', duration: 1 }],
          desc: 'Leave a trail of toxic ooze. 3 tiles become swamp. Enemies caught are slowed.' },
        SHARED_POISON_SWAMP,
        { id: 'raceToxicNova', spellType: 'unholy', name: 'Toxic Nova',
          type: 'damage', cost: 35, dmg: 70, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'magic', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'poison', duration: 3 }],
          desc: 'Detonate in a toxic explosion. All enemies within 2 tiles take damage and 3-turn poison.' }
    ],

    'golem': [
        { id: 'raceBoulderHurl', spellType: 'human', name: 'Boulder Hurl',
          type: 'damage', cost: 25, dmg: 130, range: 3,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Rip a chunk of earth and hurl it. Heavy physical damage, staggers the target.' },
        { id: 'raceStoneSkin', spellType: 'divine', name: 'Stone Skin',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          statusEffects: [{ id: 'protect', duration: 2 }],
          desc: 'Harden to living stone. +2 DEF stages and Protect for 2 turns.' },
        { id: 'raceQuake', spellType: 'human', name: 'Quake',
          type: 'damage', cost: 35, dmg: 90, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Slam the ground. All enemies within 2 tiles take damage and are staggered. Lowers terrain.' },
        SHARED_RAMPART,
        SHARED_FISSURE,
        { id: 'raceAvalancheSmash', spellType: 'human', name: 'Avalanche Smash',
          type: 'damage', cost: 30, dmg: 80, range: 2, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 25,
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Leap and crash down like an avalanche. Damage scales with elevation drop. Slows on impact.' }
    ],

    'honda civic': [
        { id: 'raceRamCharge', spellType: 'tech', name: 'Ram Charge',
          type: 'damage', cost: 25, dmg: 140, range: 3,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Floor it. Charge up to 3 tiles and slam into the target. Transforms to robot on impact.' },
        { id: 'raceExhaustCloud', spellType: 'tech', name: 'Exhaust Cloud',
          type: 'utility', cost: 20, range: 0, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Pump toxic exhaust in a 3x3 cloud for 2 turns. Enemies inside are confused.' },
        { id: 'raceRoboPunch', spellType: 'tech', name: 'Robo Punch',
          type: 'damage', cost: 25, dmg: 150, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Transform and deliver a devastating robot uppercut. Heavy melee damage.' },
        { id: 'raceMissileBarrage', spellType: 'tech', name: 'Missile Barrage',
          type: 'damage', cost: 35, dmg: 80, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          desc: 'Transform and launch a volley of mini-missiles at target area. 3x3 tech explosion.' },
        { id: 'raceNitroBoost', spellType: 'tech', name: 'Nitro Boost',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { spd: 2 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Hit the nitrous. +2 SPD stages and Inspired for 2 turns. VTEC kicked in, yo.' },
    ],

    'ice queen': [
        { id: 'raceIceSpear', spellType: 'anomaly', name: 'Ice Spear',
          type: 'damage', cost: 25, dmg: 120, range: 5,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Hurl a crystalline ice spear at long range. Slows for 2 turns.' },
        { id: 'raceFrostThrone', spellType: 'anomaly', name: 'Frost Throne',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2, atk: 1 },
          statusEffects: [{ id: 'protect', duration: 2 }],
          desc: 'Conjure a throne of ice. +2 DEF, +1 ATK stages, and Protect for 2 turns. Bow before your queen.' },
        { id: 'raceDiamondDust', spellType: 'anomaly', name: 'Diamond Dust',
          type: 'damage', cost: 35, dmg: 95, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'slow', duration: 2 }],
          leaveTerrain: 'ice',
          desc: 'Shower of ice crystals over 3x3. Damages, slows, and freezes the ground.' },
        SHARED_FLASH_FREEZE,
        SHARED_GLACIAL_TOMB,
        SHARED_SUMMON_BLIZZARD,
        { id: 'raceAbsoluteZero', spellType: 'anomaly', name: 'Absolute Zero',
          type: 'damage', cost: 40, dmg: 160, range: 3, apCost: 2,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'stun', duration: 1 }, { id: 'slow', duration: 2 }],
          desc: 'Flash-freeze a single target to absolute zero. Massive damage, stunned 1 turn, slowed 2. Temperature: 0 Kelvin.' }
    ],

    'juggernaut': [
        { id: 'raceUnstoppableCharge', spellType: 'unholy', name: 'Unstoppable Charge',
          type: 'damage', cost: 25, dmg: 150, range: 4,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Charge in a straight line. Nothing stops the Juggernaut. Staggers on impact.' },
        { id: 'raceBrutalSlam', spellType: 'human', name: 'Brutal Slam',
          type: 'damage', cost: 30, dmg: 90, range: 0, apCost: 1,
          kind: 'barrage', damageType: 'physical', aoeRadius: 1, aoeOriginSelf: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Slam fists into the ground. All adjacent enemies take damage and are staggered.' },
        { id: 'raceThickHide', spellType: 'human', name: 'Thick Hide',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          statusEffects: [{ id: 'protect', duration: 3 }],
          desc: 'Flex and harden. +2 DEF stages and Protect for 3 turns. Too dumb to feel pain.' },
        { id: 'raceBodyCheck', spellType: 'human', name: 'Body Check',
          type: 'damage', cost: 20, dmg: 100, range: 1,
          kind: 'displacement', damageType: 'physical', pushDistance: 2,
          desc: 'Shoulder-check an adjacent enemy. Deals damage and pushes them 2 tiles back.' },
        { id: 'raceRampage', spellType: 'unholy', name: 'Rampage',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          statusEffects: [{ id: 'inspired', duration: 3 }],
          desc: 'Enter a mindless rampage. +2 ATK stages and Inspired for 3 turns. JUGGERNAUT SMASH.' }
    ],

    'ki fighter': [
        { id: 'raceKiBlast', spellType: 'human', name: 'Ki Blast',
          type: 'damage', cost: 20, dmg: 110, range: 4,
          kind: 'damage', damageType: 'magic',
          desc: 'Channel ki energy into a focused blast. Medium-range energy projectile.' },
        { id: 'raceFlurryOfBlows', spellType: 'human', name: 'Flurry of Blows',
          type: 'damage', cost: 30, range: 1,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [40, 40, 40, 40],
          desc: 'Lightning-fast 4-hit combo. Punch, punch, kick, uppercut. 160 total damage.' },
        { id: 'raceKiCharge', spellType: 'human', name: 'Ki Charge',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Channel inner ki. +2 ATK stages and Inspired for 2 turns. Power up!' },
        { id: 'raceKiWave', spellType: 'human', name: 'Ki Wave',
          type: 'damage', cost: 35, dmg: 130, range: 5, apCost: 2,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          desc: 'Unleash a devastating beam of ki energy in a line. The signature move.' },
        { id: 'raceDragonFist', spellType: 'human', name: 'Dragon Fist',
          type: 'damage', cost: 30, dmg: 160, range: 2,
          kind: 'damage', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Charge with a ki-infused fist. Close to max single-target physical damage.' },
        { id: 'raceInstantTransmission', spellType: 'anomaly', name: 'Instant Transmission',
          type: 'utility', cost: 15, range: 5, apCost: 1,
          kind: 'teleport', teleportDistance: 5,
          desc: 'Lock onto a ki signature and teleport up to 5 tiles instantly.' }
    ],

    'king arthur': [
        { id: 'raceExcaliburStrike', spellType: 'divine', name: 'Excalibur Strike',
          type: 'damage', cost: 30, dmg: 155, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: 'Strike with the holy sword Excalibur. Devastating melee damage with divine fire.' },
        { id: 'raceRoyalDecree', spellType: 'divine', name: 'Royal Decree',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 1, def: 1 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Issue a royal decree. All allies within 2 tiles gain +1 ATK/DEF stages and Inspired.' },
        { id: 'raceShieldWall', spellType: 'human', name: 'Walls of Camelot',
          type: 'utility', cost: 25, apCost: 1, range: 3,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
          dmg: 40, damageType: 'physical',
          terrainDeform: { centerDelta: 2, edgeDelta: 0 },
          desc: 'Raise the walls of Camelot — a 3-tile brick rampart of fortress stone. Impassable wall that takes damage on enemies caught in it.' },
        { id: 'raceHolyAvenger', spellType: 'divine', name: 'Holy Avenger',
          type: 'damage', cost: 35, dmg: 120, range: 3, apCost: 2,
          kind: 'cross', damageType: 'magic', crossRadius: 2,
          desc: 'Call upon divine judgment. Cross-shaped holy blast in cardinal directions.' },
        SHARED_TERRAFORM,
        { id: 'raceKnightsOath', spellType: 'divine', name: "Knight's Oath",
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'swap',
          desc: 'Swap positions with an ally. A king protects his people.' }
    ],

    'king kong': [
        { id: 'raceChestPound', spellType: 'anomaly', name: 'Chest Pound',
          type: 'debuff', cost: 20, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'slow', duration: 1 }, { id: 'glare', duration: 1 }],
          desc: 'Pound chest with terrifying fury. All enemies within 2 tiles are slowed and DEF shredded.' },
        { id: 'racePrimalSmash', spellType: 'human', name: 'Primal Smash',
          type: 'damage', cost: 30, dmg: 160, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          terrainDeform: { centerDelta: -1, edgeDelta: 0 },
          desc: 'Bring both fists down on a single target. Massive damage, staggers, cracks the earth.' },
        { id: 'raceBoulderThrow', spellType: 'human', name: 'Boulder Throw',
          type: 'damage', cost: 25, dmg: 110, range: 4,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Rip a boulder from the ground and hurl it. Long-range physical bombardment.' },
        { id: 'raceApeFury', spellType: 'anomaly', name: 'Ape Fury',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Enter a primal fury. +2 ATK stages and Inspired. The king of the jungle awakens.' },
        { id: 'raceGroundSlam', spellType: 'human', name: 'Ground Slam',
          type: 'damage', cost: 35, dmg: 80, range: 0, apCost: 2,
          kind: 'barrage', damageType: 'physical', aoeRadius: 2, aoeOriginSelf: true,
          terrainDeform: { centerDelta: -2, edgeDelta: 0 },
          desc: 'Slam the ground with apocalyptic force. 2-tile AoE, craters the terrain.' }
    ],

    'minotaur': [
        { id: 'raceBullRush', spellType: 'human', name: 'Bull Rush',
          type: 'damage', cost: 25, dmg: 140, range: 4,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Lower the horns and charge. Up to 4 tiles in a line. Devastating on impact.' },
        { id: 'raceGore', spellType: 'unholy', name: 'Gore',
          type: 'damage', cost: 20, dmg: 130, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Impale with massive horns. Heavy damage and the wound bleeds for 2 turns.' },
        { id: 'raceLabyrinthRoar', spellType: 'unholy', name: 'Labyrinth Roar',
          type: 'debuff', cost: 25, range: 0, apCost: 1,
          kind: 'barrage', aoeRadius: 2, aoeOriginSelf: true,
          statusEffects: [{ id: 'discord', duration: 2 }],
          desc: 'Terrifying roar echoing through the labyrinth. All enemies within 2 tiles confused 2 turns.' },
        { id: 'raceMazeWard', spellType: 'human', name: 'Maze Ward',
          type: 'utility', cost: 25, range: 3, apCost: 1,
          kind: 'terrainCreate', terrainType: 'mountain', tileCount: 3, orientable: true,
          dmg: 50, damageType: 'physical',
          desc: 'Raise labyrinth walls. 3 impassable mountain tiles. Enemies on them take damage.' },
        { id: 'raceHornToss', spellType: 'human', name: 'Horn Toss',
          type: 'damage', cost: 25, dmg: 90, range: 1,
          kind: 'displacement', damageType: 'physical', pushDistance: 3,
          desc: 'Catch an enemy on the horns and hurl them 3 tiles. Sends them flying.' }
    ],

    'necromancer': [
        { id: 'raceSoulDrain', spellType: 'unholy', name: 'Soul Drain',
          type: 'damage', cost: 30, dmg: 120, range: 3,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.35,
          desc: 'Rip the soul from a living target. Deals damage and heals 35% as HP.' },
        { id: 'raceBoneBarrage', spellType: 'unholy', name: 'Bone Barrage',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'glare', duration: 1 }],
          desc: 'Summon a rain of bone shards over 3x3. Damages and shreds DEF.' },
        { id: 'raceCurseOfDecay', spellType: 'unholy', name: 'Curse of Decay',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'poison', duration: 3 }],
          statStageBoost: { def: -2, atk: -1 },
          desc: 'Wither the target with necrotic energy. -2 DEF, -1 ATK stages, and poison for 3 turns.' },
        { id: 'raceDeathPact', spellType: 'unholy', name: 'Death Pact',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { atk: 2 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Sacrifice vitality for power. +2 ATK stages and Inspired 2 turns. The dead demand their due.' },
        { id: 'racePlaguefield', spellType: 'unholy', name: 'Plaguefield',
          type: 'utility', cost: 30, range: 4, apCost: 1,
          kind: 'zoneDebuff', aoeRadius: 1, zoneDuration: 3,
          statusEffects: [{ id: 'poison', duration: 1 }],
          desc: 'Curse a 3x3 area with pestilence for 3 turns. Enemies inside are continually poisoned.' },
        { id: 'raceDarkResurrection', spellType: 'unholy', name: 'Dark Resurrection',
          type: 'heal', cost: 40, range: 4, apCost: 2,
          kind: 'revive', reviveHpPct: 0.50, oneRevivePerUnitPerMatch: true,
          desc: 'Raise a fallen ally from death with 50% HP. Each ally can only be raised once per match — even the necromancer cannot cheat death twice.' }
    ],

    'occulus': [
        { id: 'raceDeathGaze', spellType: 'anomaly', name: 'Death Gaze',
          type: 'damage', cost: 30, dmg: 130, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: "Lock eyes with the target. Psychic damage and DEF shredded for 2 turns. Don't look directly at it." },
        { id: 'raceOmniVision', spellType: 'divine', name: 'Omni-Vision',
          type: 'utility', cost: 20, range: 5, apCost: 1,
          kind: 'scan', scanRadius: 3,
          desc: 'The all-seeing eye reveals. Scan a massive area, revealing fog and hidden units within 3 tiles.' },
        { id: 'racePsychicBeam', spellType: 'anomaly', name: 'Psychic Beam',
          type: 'damage', cost: 30, dmg: 100, range: 5,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Fire a beam of psychic energy in a line. Damages and confuses all enemies in path.' },
        { id: 'raceHypnoticPulse', spellType: 'anomaly', name: 'Hypnotic Pulse',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'stun', duration: 1 }],
          desc: 'Mesmerizing pulse from the iris. Stuns target for 1 turn. You cannot look away.' },
        { id: 'racePupilShield', spellType: 'divine', name: 'Pupil Shield',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 130,
          desc: 'Project a protective lens over an ally. 130 HP damage shield.' },
    ],

    'quarterback': [
        { id: 'raceHailMary', spellType: 'human', name: 'Hail Mary',
          type: 'damage', cost: 30, dmg: 140, range: 5,
          kind: 'damage', damageType: 'physical',
          projectileOverride: 'proj-football',
          desc: 'Launch a deep bomb downfield. Maximum range, maximum damage. Touchdown!' },
        { id: 'raceBulletPass', spellType: 'human', name: 'Bullet Pass',
          type: 'damage', cost: 20, dmg: 100, range: 4,
          kind: 'line', damageType: 'physical', lineWidth: 1,
          projectileOverride: 'proj-football',
          desc: 'Laser-accurate bullet pass in a line. Hits all enemies in the route.' },
        { id: 'raceBlitz', spellType: 'human', name: 'Blitz',
          type: 'damage', cost: 25, dmg: 130, range: 3,
          kind: 'dash', damageType: 'physical',
          chargeToTarget: true,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Quarterback sneak. Charge up to 3 tiles and truck the target. Staggers on impact.' },
        { id: 'raceAudible', spellType: 'human', name: 'Audible',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 1, spd: 1 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Call an audible at the line. All allies within 2 tiles gain +1 ATK/SPD and Inspired.' },
        { id: 'raceSpikeTheBall', spellType: 'human', name: 'Spike the Ball',
          type: 'damage', cost: 25, dmg: 80, range: 3,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          projectileOverride: 'proj-football',
          statusEffects: [{ id: 'stagger', duration: 1 }],
          desc: 'Spike a football into the ground at target. 3x3 impact zone. Unsportsmanlike conduct.' },
        { id: 'raceEndZoneDance', spellType: 'human', name: 'End Zone Dance',
          type: 'buff', cost: 15, apCost: 1, range: 0,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 3 }],
          desc: 'Celebration dance in the end zone. Inspired for 3 turns. Excessive celebration penalty? Worth it.' }
    ],

    'robinhood': [
        { id: 'racePrecisionShot', spellType: 'human', name: 'Precision Shot',
          type: 'damage', cost: 20, dmg: 130, range: 5,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'glare', duration: 1 }],
          desc: 'A perfectly aimed arrow. Long range, high damage, shreds DEF.' },
        { id: 'raceArrowRain', spellType: 'human', name: 'Arrow Rain',
          type: 'damage', cost: 30, dmg: 80, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'physical', aoeRadius: 1,
          desc: 'Loose a volley of arrows over 3x3. Death from above.' },
        { id: 'raceStealFromRich', spellType: 'human', name: 'Steal from the Rich',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'debuff',
          statStageBoost: { atk: -1, def: -1 },
          desc: 'Rob the enemy of their strength. Target loses -1 ATK and -1 DEF stages. Redistribution.' },
        { id: 'raceForestAmbush', spellType: 'human', name: 'Forest Ambush',
          type: 'utility', cost: 15, range: 0, apCost: 1,
          kind: 'buff',
          statusEffects: [{ id: 'inspired', duration: 2 }],
          statStageBoost: { spd: 1 },
          desc: 'Meld into the surroundings. Inspired 2 turns and +1 SPD stage. The outlaw vanishes.' },
        { id: 'raceSplittingArrow', spellType: 'human', name: 'Splitting Arrow',
          type: 'damage', cost: 30, dmg: 100, range: 4,
          kind: 'ricochet', damageType: 'physical',
          bounceDamage: 70, bounceRadius: 2,
          desc: 'Arrow splits on first hit, striking a second nearby enemy. Two birds, one arrow.' },
    ],

    'santa clause': [
        { id: 'raceGiftOfHealing', spellType: 'divine', name: 'Gift of Healing',
          type: 'heal', cost: 25, range: 4,
          kind: 'heal', healAmt: 160,
          desc: 'Deliver a gift of restoration. Heals a single ally for 160 HP. Ho ho ho.' },
        { id: 'raceLumpOfCoal', spellType: 'unholy', name: 'Lump of Coal',
          type: 'damage', cost: 25, dmg: 120, range: 4,
          kind: 'damage', damageType: 'magic',
          statusEffects: [{ id: 'burn', duration: 2 }],
          desc: "Hurl a blazing lump of coal at a naughty enemy. Burns for 2 turns. You're on the list." },
        { id: 'raceNaughtyList', spellType: 'anomaly', name: 'Naughty List',
          type: 'debuff', cost: 25, range: 3, apCost: 1,
          kind: 'debuff',
          statusEffects: [{ id: 'discord', duration: 2 }],
          statStageBoost: { atk: -1, def: -1 },
          desc: 'Put an enemy on the naughty list. -1 ATK, -1 DEF, confused for 2 turns.' },
        { id: 'raceChristmasSpirit', spellType: 'divine', name: 'Christmas Spirit',
          type: 'heal', cost: 35, range: 0, apCost: 2,
          kind: 'healAll', healAmt: 100,
          cleanse: true,
          desc: 'Spread the Christmas spirit. Heals ALL allies 100 HP and cleanses 1 debuff each.' },
        { id: 'raceSleighDash', spellType: 'divine', name: 'Sleigh Dash',
          type: 'utility', cost: 15, range: 4, apCost: 1,
          kind: 'teleport', teleportDistance: 4,
          desc: 'Dash through the sky on the sleigh. Teleport up to 4 tiles.' },
        { id: 'raceBlizzardPresent', spellType: 'anomaly', name: 'Blizzard Present',
          type: 'damage', cost: 30, dmg: 80, range: 4, apCost: 1,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'slow', duration: 2 }],
          leaveTerrain: 'ice',
          desc: 'Drop a present that explodes into a blizzard. 3x3 ice damage, slows, and freezes ground.' }
    ],

    'super sentai': [
        { id: 'sentaiRedSlash', spellType: 'human', name: 'Red Slash',
          type: 'damage', cost: 20, dmg: 130, range: 1,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'burn', duration: 1 }],
          _sentaiColor: 'red',
          desc: 'The Red Ranger leads with a fiery blade slash. Burns on contact.' },
        { id: 'sentaiBlueWave', spellType: 'anomaly', name: 'Blue Wave',
          type: 'damage', cost: 25, dmg: 100, range: 4,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'slow', duration: 1 }],
          _sentaiColor: 'blue',
          desc: 'Blue Ranger unleashes a water wave in a line. Slows enemies.' },
        { id: 'sentaiBlackGuard', spellType: 'human', name: 'Black Guard',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 2 },
          statusEffects: [{ id: 'protect', duration: 2 }],
          _sentaiColor: 'black',
          desc: 'Black Ranger takes defensive stance. +2 DEF and Protect for 2 turns.' },
        { id: 'sentaiGreenArrow', spellType: 'human', name: 'Green Arrow',
          type: 'damage', cost: 25, dmg: 110, range: 5,
          kind: 'damage', damageType: 'physical',
          _sentaiColor: 'green',
          desc: 'Green Ranger fires a precision energy arrow. Long range accuracy.' },
        { id: 'sentaiYellowThunder', spellType: 'tech', name: 'Yellow Thunder',
          type: 'damage', cost: 30, dmg: 90, range: 3,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'stagger', duration: 1 }],
          _sentaiColor: 'yellow',
          desc: 'Yellow Ranger calls down lightning over 3x3 area.' },
        { id: 'sentaiPinkHeal', spellType: 'divine', name: 'Pink Healing',
          type: 'heal', cost: 25, range: 4,
          kind: 'heal', healAmt: 140,
          _sentaiColor: 'pink',
          desc: 'Pink Ranger channels healing energy. Restores 140 HP to an ally.' },
        { id: 'sentaiTeamStrike', spellType: 'human', name: 'Team Strike',
          type: 'damage', cost: 35, range: 1, apCost: 2,
          kind: 'multiHit', damageType: 'physical',
          hitDamages: [30, 30, 30, 30, 30],
          _sentaiColor: 'megazord',
          desc: 'All 5 Rangers strike in sequence! 5-hit combo for 150 total damage. GO GO!' },
        { id: 'sentaiMegazordBlast', spellType: 'tech', name: 'Megazord Blast',
          type: 'damage', cost: 40, dmg: 100, range: 4, apCost: 2,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          _sentaiColor: 'megazord',
          desc: 'Combine into the Megazord and fire a devastating energy blast. 3x3 annihilation.' }
    ],

    'symbiote': [
        { id: 'raceTendrilStrike', spellType: 'unholy', name: 'Tendril Strike',
          type: 'damage', cost: 25, dmg: 140, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'poison', duration: 2 }],
          desc: 'Lash out with symbiotic tendrils. Heavy close-range damage with venom.' },
        { id: 'raceSymbioticDrain', spellType: 'unholy', name: 'Symbiotic Drain',
          type: 'damage', cost: 30, dmg: 110, range: 2,
          kind: 'lifeDrain', damageType: 'magic', drainPct: 0.40,
          desc: 'The symbiote feeds. Drain an enemy and absorb 40% as health.' },
        { id: 'raceWebLaunch', spellType: 'unholy', name: 'Web Launch',
          type: 'damage', cost: 25, dmg: 80, range: 4,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'slow', duration: 2 }],
          desc: 'Launch a tendril web at range. Ensnares and slows for 2 turns.' },
        { id: 'raceSymbioteArmor', spellType: 'unholy', name: 'Symbiote Armor',
          type: 'buff', cost: 20, apCost: 1, range: 0,
          kind: 'buff',
          statStageBoost: { def: 1, atk: 1 },
          statusEffects: [{ id: 'regen', duration: 2 }],
          desc: 'The symbiote hardens into armor. +1 ATK/DEF and Regen for 2 turns.' },
        { id: 'racePredatorLeap', spellType: 'unholy', name: 'Predator Leap',
          type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Leap from high ground onto prey. Damage scales with elevation.' },
    ],

    'valkraye': [
        { id: 'raceValkyrieSpear', spellType: 'divine', name: 'Valkyrie Spear',
          type: 'damage', cost: 25, dmg: 140, range: 2,
          kind: 'damage', damageType: 'physical',
          statusEffects: [{ id: 'glare', duration: 1 }],
          desc: 'Thrust with a divine spear. Heavy damage and DEF shred.' },
        { id: 'raceDivineSwoop', spellType: 'divine', name: 'Divine Swoop',
          type: 'damage', cost: 25, dmg: 80, range: 3, apCost: 1,
          kind: 'leapStrike', damageType: 'physical', dmgPerLevel: 20,
          desc: 'Dive from the heavens. Damage scales with elevation delta. Wings of judgment.' },
        { id: 'raceChooserOfSlain', spellType: 'divine', name: 'Chooser of the Slain',
          type: 'heal', cost: 35, range: 4, apCost: 2,
          kind: 'revive', reviveHpPct: 0.60, oneRevivePerUnitPerMatch: true,
          desc: 'Choose a fallen warrior and return them from Valhalla with 60% HP. Valhalla releases each warrior only once per match.' },
        { id: 'raceShieldMaiden', spellType: 'divine', name: 'Shield Maiden',
          type: 'buff', cost: 20, apCost: 1, range: 3,
          kind: 'aoeShield', aoeRadius: 0, shieldHp: 120,
          desc: 'Grant divine protection to an ally. 120 HP damage shield.' },
        { id: 'raceNordicWarcry', spellType: 'divine', name: 'Nordic War Cry',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'warCry', aoeRadius: 2,
          statStageBoost: { atk: 1, def: 1 },
          statusEffects: [{ id: 'inspired', duration: 2 }],
          desc: 'Battle cry of the Valkyries. All allies within 2 tiles gain +1 ATK/DEF and Inspired.' },
    ],

    'watcher': [
        { id: 'raceCosmicSight', spellType: 'divine', name: 'Cosmic Sight',
          type: 'utility', cost: 15, range: 6, apCost: 1,
          kind: 'scan', scanRadius: 4,
          desc: 'See all. Reveal a massive area through fog within 4 tiles. Nothing is hidden from The Watcher.' },
        { id: 'raceRealityPulse', spellType: 'anomaly', name: 'Reality Pulse',
          type: 'damage', cost: 30, dmg: 100, range: 4,
          kind: 'aoe', damageType: 'magic', aoeRadius: 1,
          statusEffects: [{ id: 'discord', duration: 1 }],
          desc: 'Pulse of warped reality over 3x3. Damages and confuses enemies.' },
        { id: 'raceTemporalShift', spellType: 'anomaly', name: 'Temporal Shift',
          type: 'utility', cost: 20, range: 3, apCost: 1,
          kind: 'swap',
          desc: 'Shift an ally through time-space. Swap positions with a friendly unit.' },
        { id: 'raceJudgmentBeam', spellType: 'divine', name: 'Judgment Beam',
          type: 'damage', cost: 35, dmg: 130, range: 5, apCost: 2,
          kind: 'line', damageType: 'magic', lineWidth: 1,
          statusEffects: [{ id: 'glare', duration: 2 }],
          desc: 'The Watcher passes judgment. Beam of cosmic energy in a line. DEF shred 2 turns.' },
        { id: 'raceAstralBarrier', spellType: 'divine', name: 'Astral Barrier',
          type: 'buff', cost: 25, apCost: 1, range: 0,
          kind: 'aoeShield', aoeRadius: 1, shieldHp: 90,
          desc: 'Project an astral barrier over all allies within 1 tile. 90 HP shields each.' },
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
// MANA ECONOMY — unified spell-cost formula
// ---------------------------------------------------------------------------
// Every spell's mana `cost` is DERIVED from what the spell actually does, so a
// devastating area nuke costs well over half a caster's pool while a cheap
// utility stays affordable. This makes mana a real resource: you can't spam
// your best spell, and restoring mana (potions, end-of-round regen, recalling
// to your spawn zone) becomes a genuine strategic decision.
//
// The cost is the sum of weighted "power" contributions — damage, healing,
// shields, mana restored, status effects, buffs/debuffs, displacement, range,
// zone control — scaled by how many units the spell can realistically hit.
// Tune the constants below to reshape the whole economy from one place. Any
// spell may opt out by setting an explicit numeric `manaCostOverride`.
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

const _MF_HARD_CC = { stun:13, freeze:13, sleep:13, charm:13, silence:12, jammed:11, drowning:10, hourglass:11, sirenSong:11, guardBreak:8 };
const _MF_SOFT_CC = { slow:6, stagger:6, root:6, blockMove:6, snare:6 };
const _MF_DOT     = { burn:7, poison:7, bleed:7, lava_burn:7 };
const _MF_DEBUFF  = { marked:5, discord:6, inspiredWeak:5, vulnerable:5, weak:5, glare:6 };
const _MF_BUFF    = { protect:20, invulnerable:15, invisible:12, untargetable:12, regen:6, inspired:7,
                      guarding:6, guard:6, steadyAim:6, overclock:8, encore:9, warpRune:5, scanner:3,
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
    if (s.cross || s.kind === 'cross' || s.crossRadius) E = Math.max(E, 2.8);
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
    if (s.lumberScale) dmg += (s.lumberCap || 0) * 0.25;
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

    // --- Range = safety (no penalty for short-range support; small melee discount) ---
    const r = Math.min(s.range != null ? s.range : 3, 8);
    P += Math.max(0, r - 3) * 2.5;
    if (s.type === 'damage' && s.range != null && s.range <= 1) P -= 3;

    // --- Whole-spell modifiers (downsides discount, free actions cost more) ---
    if (s.delayTurns || k === 'delayed') P *= 0.9;   // telegraphed
    if (s.friendlyFire) P *= 0.92;                   // can catch your own team
    if (s.requiresFlight) P *= 0.95;                 // conditional
    if (s.recoilPct) P *= (1 - Math.min(0.15, s.recoilPct));
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
// Every unit has SPELL_SLOT_MAX (8) spell slots, and a spell occupies 1-3 of
// them based on its power — the derived mana cost above is the power proxy.
// So a build is "8 cheap tricks" or "a few premium bombs", never both.
// 3-slot territory is reserved for the marquee spell(s) of each type
// (Nuke, Meteor, EMP Burst, Judgment, Overgrowth, Dragonfire...).
// An explicit spell.slotCost (1-3) overrides the derivation.
const SLOT_COST_2_MIN_MANA = 35;
const SLOT_COST_3_MIN_MANA = 60;

function _spellGrantsPremiumBuff(s) {
    const eff = [...(s.statusEffects || []), ...(s.allyStatusEffects || [])];
    return eff.some(e => e && (e.id === 'protect' || e.id === 'invisible'));
}

function getSpellSlotCost(spell, cls, secJob) {
    if (!spell) return 0;
    if (spell.kind === 'basicAttack') return 0;
    let slots;
    if (typeof spell.slotCost === 'number') {
        slots = spell.slotCost;
    } else {
        const mana = spell.cost || 0;
        slots = mana >= SLOT_COST_3_MIN_MANA ? 3 : mana >= SLOT_COST_2_MIN_MANA ? 2 : 1;
        // Mana under-prices game-warping utility (invulnerability, stealth,
        // revives, extra actions, spell theft) — floor those at 2 slots.
        if (slots < 2 && (spell.kind === 'revive' || spell.revivePct || spell.reviveHpPct ||
            spell.kind === 'encore' || spell.stealSpell || _spellGrantsPremiumBuff(spell))) {
            slots = 2;
        }
    }
    // Cross-class picks (not from your job, secondary job, or race) take an
    // extra slot to master. Freelancer counts everything as native.
    if (cls && typeof isSpellNativeToClass === 'function') {
        const native = isSpellNativeToClass(spell, cls) || (secJob && isSpellNativeToClass(spell, secJob));
        if (!native) slots += 1;
    }
    return Math.max(1, Math.min(3, slots));
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
    const cap = budget || (typeof SPELL_SLOT_MAX !== 'undefined' ? SPELL_SLOT_MAX : 8);
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
            applyDamageToUnit(unit, 24, `Burn sears ${unitDisplayName(unit)}: `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                flashColor: 'burn'
            });
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
        iconSrc: createStatusIconDataUri('☠', '#1c3421', '#d8ffd7', '#68d36f'),
        onRoundEnd(unit) {
            applyDamageToUnit(unit, 32, `Poison harms ${unitDisplayName(unit)}: `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                flashColor: 'poison'
            });
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
        blockMove: true,
        spriteName: 'stun',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/stun.png',
        iconSrc: createStatusIconDataUri('⚡', '#3e2218', '#ffe6da', '#ff9c71')
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
        iconSrc: createStatusIconDataUri('💫', '#3e2e18', '#fff2da', '#ffb871'),
        onRoundEnd(unit) {
            const maxAP = typeof getUnitMaxAP === 'function' ? getUnitMaxAP(unit) : (unit.maxAp || 2);
            const newAP = Math.max(0, (unit.ap || 0) - 1);
            unit.ap = newAP;
            if (typeof addLog === 'function') addLog(`${typeof unitDisplayName === 'function' ? unitDisplayName(unit) : 'Unit'} is staggered! (-1 AP)`);
        }
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
    lasered: {
        icon: '🔴',
        glyph: '🔴',
        short: 'LZR',
        label: 'Laser Sighted',
        colorText: 'laser-sighted',
        // 'marker' (not 'debuff') so the paint is never resisted — the laser
        // always lands; the counterplay is breaking line of sight, not a dice roll.
        kind: 'marker',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('🔴', '#3a0a0a', '#ffd9d9', '#ff2b2b')
    },
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
                flashColor: 'drowning'
            });
        }
    },
    lava_burn: {
        icon: '🌋',
        glyph: '🌋',
        short: 'LVB',
        label: 'Lava Burn',
        colorText: 'burning in lava',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        moveDelta: -1,
        spriteName: 'burn',
        spriteSrc: 'https://cdn.entropywars.net/Assets/Sprites/Status/burn.png',
        iconSrc: createStatusIconDataUri('🌋', '#4a1f16', '#ffd3a8', '#ff4500'),
        onRoundEnd(unit) {
            if (unitIsLavaAdapted(unit)) return;
            const stacks = unit._lavaBurnStacks || 1;
            const dmg = Math.min(200, 32 + stacks * 32);
            applyDamageToUnit(unit, dmg, `${typeof unitDisplayName === 'function' ? unitDisplayName(unit) : 'Unit'} is burning in lava (×${stacks}): `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false,
                flashColor: 'burn'
            });
        }
    },
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

    guardBreak: {
        icon: '💔',
        glyph: '💔',
        short: 'GBR',
        label: 'Guard Break',
        colorText: 'guard broken',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        armorDelta: -10,
        iconSrc: createStatusIconDataUri('💔', '#423010', '#fff1c9', '#f0bb42')
    },
    glare: {
        icon: '👁',
        glyph: '👁',
        short: 'GLR',
        label: 'Glare',
        colorText: 'glared',
        kind: 'debuff',
        category: 'debuff',
        stack: 'add',
        armorDelta: -10,
        iconSrc: createStatusIconDataUri('👁', '#3d1242', '#ffe6ff', '#c789ff')
    },
    discord: {
        icon: '🔻',
        glyph: '🔻',
        short: 'DIS',
        label: 'Discord',
        colorText: 'discordant',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        atkDelta: -24,
        armorDelta: -10,
        mpCostDelta: 10,
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
    drowsy: {
        icon: '💤',
        glyph: '💤',
        short: 'DRZ',
        label: 'Drowsy',
        colorText: 'drowsy',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        // Stage-based: -1 INT stage while active (see getStatStageCount).
        stageMod: { int: -1 },
        iconSrc: createStatusIconDataUri('💤', '#2a2440', '#e8e2ff', '#9a8ad4')
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
        atkDelta: 16,
        moveDelta: 1,
        iconSrc: createStatusIconDataUri('⚙', '#2a3a18', '#e8ffd6', '#8fd44a')
    },
    inspired: {
        icon: '🎵',
        glyph: '🎵',
        short: 'INS',
        label: 'Inspired',
        colorText: 'inspired',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        atkDelta: 24,
        armorDelta: 10,
        iconSrc: createStatusIconDataUri('🎵', '#3a2a18', '#fff0d6', '#d4a44a')
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
    inspiredWeak: {
        icon: '🎶',
        glyph: '🎶',
        short: 'INS',
        label: 'Inspired (Self)',
        colorText: 'inspired',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        atkDelta: 8,
        armorDelta: 5,
        iconSrc: createStatusIconDataUri('🎶', '#3a2a18', '#fff0d6', '#d4a44a')
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
        // Guard braces against everything: armorDelta soaks physical hits,
        // mdefDelta soaks magic.
        armorDelta: 15,
        mdefDelta: 15,
        iconSrc: createStatusIconDataUri('🛡', '#1a2a3a', '#c8e8ff', '#5a9ad4')
    },

    // Carrier statuses for stat-stage buffs/debuffs (statStageBoost). The actual
    // ATK/DEF/SPD/INT magnitude lives on unit.statStages; these only provide the
    // duration tick, icon, and "empowered/weakened" label.
    statUp: {
        icon: '⬆️',
        glyph: '⬆',
        short: 'PWR',
        label: 'Empowered',
        colorText: 'empowered',
        kind: 'buff',
        category: 'buff',
        stack: 'replace',
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
        atkDelta: 16,
        intDelta: 12,
        armorDelta: 5,
        mdefDelta: 5,
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
    steadyAim: {
        icon: '🎯',
        glyph: '🎯',
        short: 'AIM',
        label: 'Steady Aim',
        colorText: 'steady-aim',
        kind: 'buff',
        category: 'buff',
        stack: 'replace',
        rangeDelta: 1,
        iconSrc: createStatusIconDataUri('🎯', '#1a2a3a', '#d6e8ff', '#5a8ad4')
    },
    charm: {
        icon: '💋',
        glyph: '💋',
        short: 'CHM',
        label: 'Charm',
        colorText: 'charm',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('💋', '#3a1a2a', '#ffd6e8', '#d45a8a')
    },
    sirenSong: {
        icon: '🎵',
        glyph: '🎵',
        short: 'SNG',
        label: 'Siren Song',
        colorText: 'siren-song',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('🎵', '#1a2a3a', '#d6e8ff', '#5a8ad4')
    },
    contract: {
        icon: '📜',
        glyph: '📜',
        short: 'CTR',
        label: 'Contract',
        colorText: 'contract',
        kind: 'debuff',
        category: 'status',
        stack: 'replace',
        iconSrc: createStatusIconDataUri('📜', '#2a1a1a', '#ffd6d6', '#d45a5a')
    }
};
const STATUS_META = STATUS_DEFS;

const GOLD_PER_KILL = 10;
const GOLD_PER_ASSIST = 5;
const GOLD_PER_HOURGLASS = 5;
const GOLD_PASSIVE_PER_ROUND = 2;

const NEXUS_GOLD_PER_ROUND = 5;
const NEXUS_CHANNEL_COST_AP = 1;
const NEXUS_CAPTURE_THRESHOLD = 6;
const NEXUS_ZONE_SIZE = 2;

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
  // NOTE: every race with a rigged 3D model in sprites.js RACE_MODELS_3D is a
  // starter EXCEPT 'martian', which is intentionally left locked (earn/buy it).
];

// PvP modes that bank account gold. Gauntlet/Challenge route through their own
// campaign economy and are intentionally excluded here.
const ACCT_PVP_MODES = ['arena', 'tdm', 'ffa', 'domination', 'hotspot', 'ctf'];

// One ownership check everything routes through. View-layer only — purchasing is
// always server-authoritative; this just decides what shows as owned/selectable.
function isUnitUnlocked(raceKey) {
  if (typeof window !== 'undefined' && window._DEV_UNLOCK_ALL) return true; // dev override, view-layer only
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

const MAP_LAYOUT_PRESETS = {
    prebuilt_custommap: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'grass_2' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    // Natural-landscape map: smooth rolling heightfield terrain (see three-renderer
    // BEVEL/natural path). naturalTerrain flag opts this map into the beveled,
    // sloped-ground rendering; all other maps keep the classic flat-cube voxels.
    prebuilt_entropy_vale: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, naturalTerrain: true
    },

    prebuilt_moon: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'moon' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_heaven: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'cloud_thick' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_backrooms: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'carpet' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_stonehenge: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_giza: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'desert' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_atlantis: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 23, label: 'Earth', baseTerrain: 'water' }, buffer2: null, below: null },
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

    prebuilt_skirmish: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_compound: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },

    prebuilt_crossroads: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },

    prebuilt_citadel: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_apocalypse: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 29, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_battlefield: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_ravine: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_highlands: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_caldera: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_bastion: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_mountain: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'mountain' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_crater: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'lava' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_tundra: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'ice' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_oasis: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'desert' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_quarry: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'dirt' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_fungal_hollow: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'cave_floor' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_fortress: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_volcanic_rift: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'scorched' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_babel: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'urban_street' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_archipelago: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'water' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_dark_forest: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'dark_woods' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_skybridge: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_toxic_marsh: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'poison' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_temple_ruins: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'grass_2' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_wasteland: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 13, label: 'Earth', baseTerrain: 'scorched' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_frozen_citadel: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'ice' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_mushroom_grove: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'purple_grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_canyon: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'desert' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_obsidian_spire: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'lava' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_village_siege: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_crystal_cavern: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'cave_floor' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_divided_city: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 13, label: 'Earth', baseTerrain: 'urban_street' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_caldera_summit: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 13, label: 'Earth', baseTerrain: 'dirt' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },

    prebuilt_apartment: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 3, label: 'Earth', baseTerrain: 'urban_street' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_suburb: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_rift_plaza: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'urban_street' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_bunker: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 7, label: 'Earth', baseTerrain: 'cave_floor' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_cavern: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'cave_floor' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_workshop: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'rocks_1' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_killbox: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'cave_floor' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_dreamscape: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 11, label: 'Earth', baseTerrain: 'purple_grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_bleed_arena: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 9, label: 'Earth', baseTerrain: 'purple_grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_lattice: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'desert' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_palimpsest: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'urban_street' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false, streetLamps: true
    },
    prebuilt_pyramid: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 15, label: 'Earth', baseTerrain: 'desert' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    },
    prebuilt_nexus_core: {
        sections: { above: null, buffer1: null, earth: { startRow: 0, endRow: 19, label: 'Earth', baseTerrain: 'purple_grass' }, buffer2: null, below: null },
        barrierRows: [], barrierOpeningsX: [], hasFloors: false
    }
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
    prebuilt_moon: {
        name: 'Moon', w: 16, h: 16,
        grid: [
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,15,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,15,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,15,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,15,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],
            [75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75]
        ],
        heightMap: [
            [2,2,2,2,2,2,3,3,3,2,2,2,2,2,2,2],
            [2,2,2,2,2,2,3,3,3,2,2,2,2,2,2,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
            [2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2],
            [2,2,2,1,1,1,2,2,2,2,1,1,1,2,2,2],
            [2,2,2,2,1,2,2,3,3,2,2,1,2,2,2,2],
            [2,2,2,2,2,2,3,3,3,3,2,2,2,2,3,3],
            [3,3,2,2,2,3,3,3,3,3,3,2,2,2,3,3],
            [3,3,2,2,2,3,3,3,3,3,3,2,2,2,3,3],
            [3,3,2,2,2,2,3,3,3,3,2,2,2,2,2,2],
            [2,2,2,2,1,2,2,3,3,2,2,1,2,2,2,2],
            [2,2,2,1,1,1,2,2,2,2,1,1,1,2,2,2],
            [2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
            [2,2,2,2,2,2,2,3,3,3,2,2,2,2,2,2],
            [2,2,2,2,2,2,2,3,3,3,2,2,2,2,2,2]
        ],
        objects: [
            [[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[]],
            [[],[],[],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[],[],[],[{"oid":51,"leaf":"rocks_1"}],[{"oid":51,"leaf":"rocks_2"}]],
            [[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[{"oid":51,"leaf":"rocks_3"}]],
            [[{"oid":51,"leaf":"rocks_4"}],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}]],
            [[{"oid":51,"leaf":"rocks_5"}],[{"oid":51,"leaf":"rocks_1"}],[],[],[],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[],[],[]],
            [[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_2"}],[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{"oid":51,"leaf":"rocks_3"}],[{"oid":51,"leaf":"rocks_4"}],[{"oid":51,"leaf":"rocks_5"}],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"monolith","x":8,"y":8,"foot":2,"maxH":7,"seed":42},{"kind":"flag","x":6,"y":9,"foot":1.6,"maxH":3.6,"seed":7},{"kind":"rover","x":9,"y":6,"foot":2.2,"maxH":1.7,"seed":3},{"kind":"crystal","x":2,"y":12,"foot":2,"maxH":4,"seed":11},{"kind":"crystal","x":12,"y":2,"foot":2,"maxH":4,"seed":19},{"kind":"obelisk","x":13,"y":13,"foot":1.6,"maxH":5,"seed":5},{"kind":"obelisk","x":2,"y":2,"foot":1.6,"maxH":5,"seed":6}],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":15,"y":15},{"x":14,"y":15},{"x":15,"y":14},{"x":14,"y":14}]}
    },
    prebuilt_heaven: {
        name: 'Heaven', w: 20, h: 20,
        grid: [
            [26,26,26,26,26,26,23,23,23,77,77,23,23,23,26,26,26,26,26,26],
            [26,26,26,26,23,23,23,23,23,77,77,23,23,23,23,23,26,26,26,26],
            [26,26,26,26,23,23,23,23,23,77,77,23,23,23,23,23,26,26,26,26],
            [26,26,26,26,26,54,54,54,23,77,77,23,54,54,54,26,26,26,26,26],
            [26,23,23,26,54,54,54,54,23,77,77,23,54,54,54,54,26,23,23,26],
            [26,23,23,54,54,54,54,54,23,77,77,23,54,54,54,54,54,23,23,26],
            [23,23,23,54,54,54,54,54,77,77,77,77,54,54,54,54,54,23,23,23],
            [23,23,23,54,54,54,54,54,81,81,81,81,54,54,54,54,54,23,23,23],
            [23,23,23,23,23,23,77,81,77,77,77,77,81,77,23,23,23,23,23,23],
            [77,77,77,77,77,77,77,81,77,77,77,77,81,77,77,77,77,77,77,77],
            [77,77,77,77,77,77,77,81,77,77,77,77,81,77,77,77,77,77,77,77],
            [23,23,23,23,23,23,77,81,77,77,77,77,81,77,23,23,23,23,23,23],
            [23,23,23,54,54,54,54,54,81,81,81,81,54,54,54,54,54,23,23,23],
            [23,23,23,54,54,54,54,54,77,77,77,77,54,54,54,54,54,23,23,23],
            [26,23,23,54,54,54,54,54,23,77,77,23,54,54,54,54,54,23,23,26],
            [26,23,23,26,54,54,54,54,23,77,77,23,54,54,54,54,26,23,23,26],
            [26,26,26,26,26,54,54,54,23,77,77,23,54,54,54,26,26,26,26,26],
            [26,26,26,26,23,23,23,23,23,77,77,23,23,23,23,23,26,26,26,26],
            [26,26,26,26,23,23,23,23,23,77,77,23,23,23,23,23,26,26,26,26],
            [26,26,26,26,26,26,23,23,23,77,77,23,23,23,26,26,26,26,26,26]
        ],
        heightMap: [
            [0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0],
            [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
            [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
            [0,0,0,0,0,5,5,5,4,4,4,4,5,5,5,0,0,0,0,0],
            [0,4,4,0,5,5,5,5,4,4,4,4,5,5,5,5,0,4,4,0],
            [0,4,4,5,5,5,5,5,4,4,4,4,5,5,5,5,5,4,4,0],
            [4,4,4,5,5,5,5,5,4,4,4,4,5,5,5,5,5,4,4,4],
            [4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4],
            [4,4,4,4,4,4,4,5,6,6,6,6,5,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,5,6,6,6,6,5,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,5,6,6,6,6,5,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,5,6,6,6,6,5,4,4,4,4,4,4,4],
            [4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4],
            [4,4,4,5,5,5,5,5,4,4,4,4,5,5,5,5,5,4,4,4],
            [0,4,4,5,5,5,5,5,4,4,4,4,5,5,5,5,5,4,4,0],
            [0,4,4,0,5,5,5,5,4,4,4,4,5,5,5,5,0,4,4,0],
            [0,0,0,0,0,5,5,5,4,4,4,4,5,5,5,0,0,0,0,0],
            [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
            [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
            [0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"lightpillar","x":9,"y":9,"foot":2.2,"maxH":20,"seed":99},{"kind":"goldgate","x":9,"y":5,"foot":5,"maxH":8,"seed":21},{"kind":"goldgate","x":10,"y":14,"foot":5,"maxH":8,"seed":22},{"kind":"greek","x":5,"y":5,"foot":5,"maxH":6,"seed":31},{"kind":"greek","x":14,"y":5,"foot":5,"maxH":6,"seed":32},{"kind":"greek","x":5,"y":14,"foot":5,"maxH":6,"seed":33},{"kind":"greek","x":14,"y":14,"foot":5,"maxH":6,"seed":34},{"kind":"lightpillar","x":5,"y":5,"foot":1.4,"maxH":16,"seed":41},{"kind":"lightpillar","x":14,"y":5,"foot":1.4,"maxH":16,"seed":42},{"kind":"lightpillar","x":5,"y":14,"foot":1.4,"maxH":16,"seed":43},{"kind":"lightpillar","x":14,"y":14,"foot":1.4,"maxH":16,"seed":44},{"kind":"obelisk","x":2,"y":9,"foot":1.6,"maxH":7,"seed":51},{"kind":"obelisk","x":17,"y":10,"foot":1.6,"maxH":7,"seed":52}],
        spawns: {"1":[{"x":9,"y":18},{"x":10,"y":18},{"x":8,"y":18},{"x":11,"y":18},{"x":9,"y":17},{"x":10,"y":17}],"2":[{"x":10,"y":1},{"x":9,"y":1},{"x":11,"y":1},{"x":8,"y":1},{"x":10,"y":2},{"x":9,"y":2}]}
    },
    prebuilt_backrooms: {
        name: 'Backrooms', w: 16, h: 16,
        grid: [
            [80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80],
            [80,76,76,76,76,80,76,76,76,76,80,76,76,76,76,80],
            [80,76,76,76,76,78,76,76,76,76,78,76,76,76,76,80],
            [80,76,76,76,76,78,76,76,76,76,78,76,76,76,76,80],
            [80,76,76,76,76,80,76,76,76,76,80,76,76,76,76,80],
            [80,80,78,78,80,80,80,78,78,80,80,80,78,78,80,80],
            [80,2,2,2,2,80,76,76,76,76,80,2,2,2,2,80],
            [80,2,2,2,2,78,76,76,76,76,78,2,2,2,2,80],
            [80,2,2,2,2,78,76,76,76,76,78,2,2,2,2,80],
            [80,2,2,2,2,80,76,76,76,76,80,2,2,2,2,80],
            [80,80,78,78,80,80,80,78,78,80,80,80,78,78,80,80],
            [80,76,76,76,76,80,76,76,76,76,80,76,76,76,76,80],
            [80,76,76,76,76,78,76,76,76,76,78,76,76,76,76,80],
            [80,76,76,76,76,78,76,76,76,76,78,76,76,76,76,80],
            [80,76,76,76,76,80,76,76,76,76,80,76,76,76,76,80],
            [80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80]
        ],
        heightMap: [
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,4,1,1,4,4,4,1,1,4,4,4,1,1,4,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,4,1,1,4,4,4,1,1,4,4,4,1,1,4,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4],
            [4,1,1,1,1,4,1,1,1,1,4,1,1,1,1,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"exitsign","x":2,"y":2,"foot":1,"maxH":2.4,"seed":100,"solid":false},{"kind":"exitsign","x":12,"y":2,"foot":1,"maxH":2.4,"seed":101,"solid":false},{"kind":"exitsign","x":7,"y":7,"foot":1,"maxH":2.4,"seed":102,"solid":false},{"kind":"exitsign","x":2,"y":12,"foot":1,"maxH":2.4,"seed":103,"solid":false},{"kind":"exitsign","x":12,"y":12,"foot":1,"maxH":2.4,"seed":104,"solid":false}],
        spawns: {"1":[{"x":1,"y":1},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"2":[{"x":14,"y":14},{"x":13,"y":14},{"x":14,"y":13},{"x":13,"y":13}]}
    },
    prebuilt_stonehenge: {
        name: "Stonehenge", w: 16, h: 16,
        grid: [
            [1,48,1,48,1,1,1,1,1,1,1,48,1,1,1,1],
            [1,1,1,1,53,8,1,1,1,1,8,1,1,53,1,1],
            [1,1,53,1,8,8,1,8,8,1,8,8,1,1,1,48],
            [1,1,1,8,1,1,1,8,8,1,1,1,8,1,53,1],
            [1,53,8,1,1,1,1,8,8,1,48,1,1,8,1,1],
            [48,8,8,1,1,1,63,8,8,63,1,1,1,8,8,1],
            [53,8,1,1,1,63,64,54,54,64,63,48,1,48,8,1],
            [1,8,1,1,1,1,54,54,54,54,1,48,1,1,8,1],
            [1,8,1,1,1,1,54,54,54,54,1,1,1,1,8,1],
            [1,8,1,1,1,63,64,54,54,64,63,1,1,1,8,53],
            [1,8,8,1,1,1,63,8,8,63,1,1,48,8,8,1],
            [1,1,8,1,1,48,1,8,8,1,1,1,1,8,1,1],
            [1,53,1,8,1,1,1,8,8,1,1,1,8,1,1,1],
            [1,48,1,48,8,8,1,8,8,1,8,8,1,1,53,1],
            [1,1,1,53,1,8,1,1,1,1,8,1,53,48,1,48],
            [1,1,1,1,1,1,1,1,1,1,48,1,1,1,1,1]
        ],
        heightMap: [
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0],
            [0,0,1,0,1,1,0,1,0,0,1,1,1,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
            [1,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0],
            [0,1,1,0,0,1,3,0,0,3,0,1,0,1,1,1],
            [0,1,0,0,0,3,4,1,1,4,3,0,0,0,1,1],
            [0,1,0,0,0,0,1,1,1,1,0,0,0,0,1,0],
            [0,1,1,0,0,1,1,1,1,1,0,0,0,0,1,1],
            [0,1,0,0,0,3,4,1,1,4,3,0,0,0,1,0],
            [0,1,1,0,1,0,3,0,0,3,0,0,0,1,1,0],
            [0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0],
            [0,0,0,1,0,1,0,1,0,0,0,0,1,1,0,1],
            [0,0,0,0,1,1,0,0,0,0,1,1,1,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"monolith","x":10,"y":9,"foot":1.6,"maxH":4.2,"seed":139},{"kind":"monolith","x":9,"y":10,"foot":1.6,"maxH":4.2,"seed":137},{"kind":"monolith","x":6,"y":10,"foot":1.6,"maxH":4.2,"seed":128},{"kind":"monolith","x":5,"y":9,"foot":1.6,"maxH":4.2,"seed":124},{"kind":"monolith","x":5,"y":6,"foot":1.6,"maxH":4.2,"seed":121},{"kind":"monolith","x":6,"y":5,"foot":1.6,"maxH":4.2,"seed":123},{"kind":"monolith","x":9,"y":5,"foot":1.6,"maxH":4.2,"seed":132},{"kind":"monolith","x":10,"y":6,"foot":1.6,"maxH":4.2,"seed":136},{"kind":"monolith","x":9,"y":9,"foot":1.4,"maxH":5,"seed":254},{"kind":"monolith","x":9,"y":6,"foot":1.4,"maxH":5,"seed":251},{"kind":"monolith","x":6,"y":9,"foot":1.4,"maxH":5,"seed":239},{"kind":"monolith","x":6,"y":6,"foot":1.4,"maxH":5,"seed":236},{"kind":"rings","x":8,"y":8,"foot":5,"maxH":5,"seed":42},{"kind":"crystal","x":8,"y":8,"foot":1.4,"maxH":3,"seed":77}],
        spawns: {"1":[{"x":7,"y":14},{"x":8,"y":14},{"x":6,"y":14},{"x":9,"y":14},{"x":7,"y":15},{"x":8,"y":15}],"2":[{"x":8,"y":1},{"x":7,"y":1},{"x":9,"y":1},{"x":6,"y":1},{"x":8,"y":0},{"x":7,"y":0}]}
    },
    prebuilt_giza: {
        name: "Pyramids of Giza", w: 20, h: 20,
        grid: [
            [6,6,6,6,6,6,6,6,6,6,6,64,6,6,6,6,6,6,6,6],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,64,6,6,6,6,6],
            [6,6,6,6,6,8,6,6,6,6,6,6,6,6,8,6,6,6,6,6],
            [6,8,6,6,6,6,6,6,6,6,6,6,6,8,64,2,2,2,6,6],
            [6,6,6,6,6,64,6,6,6,64,6,6,64,6,6,2,18,2,6,8],
            [8,6,6,6,6,6,6,8,6,6,6,6,6,6,6,2,2,2,6,6],
            [6,64,8,6,6,6,6,6,6,58,6,58,6,6,64,6,6,6,6,6],
            [64,8,8,6,13,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [6,64,6,6,6,13,64,14,6,6,6,6,14,64,6,6,6,64,6,6],
            [6,6,6,6,8,58,13,6,6,6,6,6,6,14,8,58,64,6,6,6],
            [6,6,6,6,6,64,6,13,6,6,64,6,6,6,6,6,6,6,6,6],
            [6,6,6,6,6,64,58,6,13,6,6,6,6,6,58,6,64,6,6,6],
            [6,6,6,6,6,6,6,6,14,13,64,6,6,6,8,13,6,6,6,6],
            [6,6,6,6,6,64,6,6,64,6,13,6,6,13,13,6,6,6,6,6],
            [6,6,2,2,2,6,6,6,6,6,13,6,6,6,8,6,6,6,6,6],
            [6,6,2,18,2,6,6,6,6,6,13,6,6,6,6,6,6,6,6,6],
            [64,6,2,2,2,6,6,64,64,6,13,6,6,6,6,6,6,6,6,6],
            [6,6,6,64,6,6,6,6,6,6,6,6,6,6,6,64,6,6,6,6],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,8,6,6],
            [8,6,6,6,6,6,6,6,6,6,6,8,6,6,6,6,6,64,6,64]
        ],
        heightMap: [
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
            [1,1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,1,1,1,1],
            [1,1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,1,1,1,1],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
            [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":36}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{"oid":2}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":2}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{"oid":36}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"pyramid","x":4,"y":4,"foot":5,"maxH":5,"seed":301},{"kind":"pyramid","x":10,"y":10,"foot":7,"maxH":9,"seed":302},{"kind":"pyramid","x":15,"y":15,"foot":6,"maxH":7,"seed":303},{"kind":"colossus","x":10,"y":15,"foot":3,"maxH":4,"seed":310},{"kind":"obelisk","x":8,"y":14,"foot":1.6,"maxH":6,"seed":320},{"kind":"obelisk","x":12,"y":14,"foot":1.6,"maxH":6,"seed":321}],
        spawns: {"1":[{"x":1,"y":18},{"x":2,"y":18},{"x":1,"y":17},{"x":2,"y":17},{"x":0,"y":18},{"x":3,"y":18}],"2":[{"x":18,"y":1},{"x":17,"y":1},{"x":18,"y":2},{"x":17,"y":2},{"x":19,"y":1},{"x":16,"y":1}]}
    },
    prebuilt_atlantis: {
        name: "Atlantis", w: 24, h: 24,
        grid: [
            [2,2,3,2,2,2,2,3,2,3,2,3,3,2,2,2,2,2,55,55,55,55,55,55],
            [3,3,3,2,2,3,2,2,2,2,2,3,3,2,2,2,2,2,55,55,55,55,55,55],
            [2,2,2,2,2,2,2,2,2,54,54,54,54,54,54,2,2,2,55,55,55,55,55,55],
            [2,2,2,2,2,2,2,2,2,54,54,54,54,54,54,2,2,2,55,55,55,55,55,55],
            [2,2,3,14,14,2,2,2,2,54,54,54,54,54,54,2,2,2,55,14,14,55,55,55],
            [2,2,2,14,14,2,2,2,2,54,54,54,54,54,54,2,2,54,55,14,14,55,55,55],
            [3,3,2,2,2,2,2,2,2,2,2,4,4,2,2,2,54,2,55,55,55,55,55,55],
            [2,2,3,2,2,2,2,2,2,3,3,4,4,3,3,54,2,54,2,2,2,2,2,3],
            [2,2,3,2,2,2,2,2,3,3,2,55,55,2,3,3,2,2,2,2,2,2,3,2],
            [2,2,54,54,54,54,2,3,3,55,55,55,55,55,55,3,3,2,54,54,54,54,2,2],
            [2,2,54,54,54,54,2,3,2,55,55,15,15,55,55,2,3,2,54,54,54,54,2,2],
            [2,2,54,54,54,54,4,4,55,55,15,15,15,15,55,55,4,4,54,54,54,54,2,2],
            [2,3,54,54,54,54,4,4,55,55,15,15,15,15,55,55,4,4,54,54,54,54,2,2],
            [2,2,54,54,54,54,2,3,2,55,55,15,15,55,55,2,3,2,54,54,54,54,2,2],
            [3,2,54,54,54,54,2,3,3,55,55,55,55,55,55,3,3,2,54,54,54,54,2,2],
            [2,2,3,2,2,2,2,2,3,3,2,55,55,2,3,3,2,2,2,2,2,3,2,2],
            [2,2,2,2,2,2,54,2,54,3,3,4,4,3,3,2,2,2,2,2,3,2,2,2],
            [55,55,55,55,55,55,2,54,2,2,2,4,4,2,2,2,2,2,2,2,2,2,2,2],
            [55,55,55,55,55,55,54,2,2,54,54,54,54,54,54,2,2,2,2,2,2,2,2,2],
            [55,55,55,55,55,55,2,2,2,54,54,54,54,54,54,2,2,2,2,2,14,14,3,2],
            [55,55,55,55,14,14,3,2,2,54,54,54,54,54,54,2,2,2,2,2,14,14,2,2],
            [55,55,55,55,14,14,2,2,3,54,54,54,54,54,54,2,2,2,2,2,2,2,2,2],
            [55,55,55,55,55,55,2,2,2,3,2,2,2,2,2,3,2,2,3,2,2,2,2,2],
            [55,55,55,55,55,55,3,2,2,2,2,2,2,2,2,3,2,2,2,3,2,2,2,2]
        ],
        heightMap: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0],
            [0,0,1,1,1,1,0,0,0,1,1,2,2,1,1,0,0,0,1,1,1,1,0,0],
            [0,0,1,1,1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,1,1,1,1,1,2,2,2,2,1,1,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,1,0,0,0,1,1,2,2,1,1,0,0,0,1,1,1,1,0,0],
            [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{"oid":20}],[],[],[],[],[{"oid":17}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{"oid":20}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":20}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{"oid":20}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":19}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{"oid":17}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":20}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{"oid":20}],[],[],[]],
            [[],[],[],[],[{"oid":17}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{"oid":19}],[],[],[],[],[{"oid":20}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        monuments: [{"kind":"lightpillar","x":11,"y":11,"foot":2.2,"maxH":22,"seed":501},{"kind":"crystal","x":12,"y":12,"foot":2.4,"maxH":6,"seed":502},{"kind":"crystal","x":11,"y":12,"foot":1.6,"maxH":4,"seed":503},{"kind":"colossus","x":11,"y":8,"foot":3,"maxH":5,"seed":510},{"kind":"greek","x":11,"y":3,"foot":4,"maxH":5,"seed":601},{"kind":"greek","x":12,"y":20,"foot":4,"maxH":5,"seed":602},{"kind":"greek","x":3,"y":12,"foot":4,"maxH":5,"seed":603},{"kind":"greek","x":20,"y":11,"foot":4,"maxH":5,"seed":604},{"kind":"obelisk","x":0,"y":23,"foot":1.6,"maxH":6,"seed":701},{"kind":"obelisk","x":23,"y":0,"foot":1.6,"maxH":6,"seed":702}],
        spawns: {"1":[{"x":1,"y":22},{"x":2,"y":22},{"x":1,"y":21},{"x":2,"y":21},{"x":3,"y":22},{"x":1,"y":20},{"x":3,"y":21},{"x":4,"y":22}],"2":[{"x":22,"y":1},{"x":21,"y":1},{"x":22,"y":2},{"x":21,"y":2},{"x":20,"y":1},{"x":22,"y":3},{"x":20,"y":2},{"x":19,"y":1}]}
    },
    prebuilt_entropy_vale: {
        name: 'Entropy Vale', w: 16, h: 16,
        grid: [
            [1,1,1,1,1,1,1,50,8,11,5,5,5,5,11,50],
            [1,1,1,50,50,50,50,1,8,5,28,28,28,28,5,8],
            [1,1,1,50,50,1,1,8,11,28,28,28,28,28,28,5],
            [1,50,1,1,1,8,8,5,5,28,28,28,28,28,28,5],
            [1,1,1,1,14,5,11,5,28,28,28,28,28,28,28,5],
            [1,1,1,50,50,8,11,28,28,28,28,28,28,28,28,5],
            [1,1,1,1,1,5,11,5,28,28,28,28,28,28,5,5],
            [50,1,1,1,50,1,8,5,5,5,5,5,5,5,5,5],
            [1,1,1,1,1,8,8,8,74,74,5,5,5,5,5,1],
            [1,1,2,2,2,8,8,8,74,74,11,5,5,5,5,1],
            [1,2,3,3,3,8,74,74,8,50,8,11,5,5,1,1],
            [1,2,3,3,3,3,74,74,1,1,1,1,1,50,50,50],
            [1,2,3,3,3,3,2,15,1,1,1,1,50,1,1,1],
            [50,2,3,3,3,3,2,1,1,1,1,8,5,1,1,1],
            [50,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,50,1,1,1,1,1]
        ],
        heightMap: [
            [3,3,3,5,6,6,4,6,7,9,10,10,10,10,8,6],
            [3,3,3,5,6,6,6,6,7,9,11,11,11,11,9,7],
            [3,3,3,4,6,6,6,7,9,11,11,11,11,11,11,9],
            [5,4,4,4,6,7,7,9,10,11,11,11,11,11,11,10],
            [3,3,4,4,6,7,9,10,11,11,11,11,11,11,11,10],
            [3,3,3,4,6,7,9,11,11,11,11,11,11,11,11,10],
            [4,3,3,3,4,6,8,10,11,11,11,11,11,11,10,9],
            [4,3,3,3,4,6,7,9,10,10,10,10,10,10,9,7],
            [3,3,3,3,3,5,6,6,6,6,10,10,10,10,8,6],
            [3,3,3,3,3,5,6,6,6,6,8,10,10,9,7,6],
            [3,3,3,3,3,5,6,6,5,6,7,8,8,7,6,4],
            [3,3,3,3,3,3,6,6,3,4,6,6,6,6,4,4],
            [3,3,3,3,3,3,3,3,3,4,6,6,6,5,4,4],
            [4,3,3,3,3,3,3,3,3,4,6,7,7,3,3,3],
            [4,3,3,3,3,3,3,3,4,4,6,6,5,3,3,3],
            [3,3,3,3,3,3,3,4,6,6,6,6,5,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[{oid:38,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:1,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:38,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:38,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'center',alignY:'bottom'}],[{oid:2,alignX:'center',alignY:'bottom'}],[{oid:18,alignX:'center',alignY:'bottom'}],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:19,alignX:'center',alignY:'bottom'}],[{oid:25,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}]],
            [[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:1,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":14,"y":14},{"x":15,"y":14},{"x":14,"y":15},{"x":15,"y":15},{"x":13,"y":15},{"x":15,"y":13}],"2":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":0,"y":2}]}
    },
    prebuilt_entropy_monuments: {
        name: 'Monument Proving Grounds', w: 16, h: 16,
        // FLAT voxel map: solid grass columns with the standard z=3 ground floor
        // (heightMap all 3, voxels z0..z3). No naturalTerrain bevel. Every landmark
        // is a real 3D mesh (state.monuments) reusing the esoteric-background _hz*
        // geometry, scaled up to read at map scale and seated on the z=3 surface.
        // foot = footprint width in tiles; maxH caps height in tiles; seed = RNG.
        monuments: [
            { kind: 'pyramid',  x: 4,  y: 4,  foot: 6, maxH: 7, seed: 7 },
            { kind: 'ziggurat', x: 11, y: 4,  foot: 6, maxH: 6, seed: 3 },
            { kind: 'greek',    x: 4,  y: 11, foot: 7, maxH: 5, seed: 4 },
            { kind: 'arch',     x: 10, y: 10, foot: 5, maxH: 6, seed: 5 },
            { kind: 'obelisk',  x: 8,  y: 8,  foot: 2, maxH: 8, seed: 9 },
            { kind: 'stairway', x: 8,  y: 2,  foot: 6, maxH: 8, seed: 2 },
            { kind: 'colossus', x: 13, y: 8,  foot: 5, maxH: 3, seed: 6 }
        ],
        grid: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]],
            [[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:1},{z:3,tid:1}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":14,"y":14},{"x":15,"y":14},{"x":14,"y":15},{"x":15,"y":15},{"x":13,"y":15},{"x":15,"y":13}],"2":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":0,"y":2}]}
    },
    prebuilt_skirmish: {
        name: 'Skirmish', w: 8, h: 8,
        grid: [
            [54,54,54,0,74,0,48,48],
            [54,54,35,74,74,74,74,48],
            [54,54,35,74,74,74,58,48],
            [74,74,74,13,13,74,74,74],
            [74,74,74,13,13,74,74,74],
            [48,58,74,74,74,35,54,54],
            [48,74,74,74,74,35,54,54],
            [48,48,0,74,0,54,54,54]
        ],
        heightMap: [
            [6,6,6,0,6,0,6,6],
            [6,5,3,5,5,5,5,6],
            [6,5,3,5,5,5,5,6],
            [6,5,4,3,4,4,5,6],
            [6,5,4,3,4,4,5,6],
            [6,5,4,5,5,3,5,6],
            [6,5,5,5,5,3,5,6],
            [6,6,0,6,0,6,6,6]
        ],
        voxels: [
            [[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[],[{z:0,tid:74},{z:6,tid:74}],[],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:48},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:48},{z:6,tid:48}]],
            [[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:8},{z:3,tid:13}],[{z:0,tid:8},{z:4,tid:13}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:6,tid:74}]],
            [[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:8},{z:3,tid:13}],[{z:0,tid:8},{z:4,tid:13}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:6,tid:74}]],
            [[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}]],
            [[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}]],
            [[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[],[{z:0,tid:74},{z:6,tid:74}],[],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}]]
        ],
        objects: [
            [[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[]],
            [[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}]],
            [[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}]],
            [[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[]],
            [[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":6,"y":6},{"x":7,"y":6},{"x":6,"y":7},{"x":7,"y":7}],"2":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}]}
    },
    prebuilt_compound: {
        name: 'Compound', w: 12, h: 12,
        grid: [
            [54,54,54,54,48,48,48,48,48,48,48,48],
            [54,54,54,54,35,74,74,48,48,48,48,48],
            [54,35,54,54,54,58,74,48,48,48,48,58],
            [48,48,48,48,48,0,74,48,48,48,58,58],
            [19,19,48,48,48,74,74,48,48,48,58,58],
            [19,19,48,48,13,13,13,13,48,48,48,58],
            [19,48,48,48,13,13,13,13,48,48,48,58],
            [19,48,48,48,48,74,74,48,48,48,58,58],
            [19,19,48,48,48,74,0,48,48,48,58,58],
            [19,19,48,48,48,74,58,54,54,54,35,54],
            [48,48,48,48,48,74,74,35,54,54,54,54],
            [48,48,48,48,48,48,48,48,54,54,54,54]
        ],
        heightMap: [
            [3,3,3,3,3,3,4,4,3,4,4,3],
            [4,4,4,4,3,4,4,4,4,4,4,4],
            [4,3,4,4,4,4,4,4,4,4,4,4],
            [6,6,5,5,5,0,6,6,5,5,5,5],
            [6,6,6,6,6,6,6,6,6,6,6,6],
            [7,7,7,7,7,7,7,7,7,7,7,7],
            [7,7,7,7,7,7,7,7,7,7,7,7],
            [6,6,6,7,7,6,6,6,6,7,7,6],
            [5,5,5,5,5,5,0,5,5,5,5,5],
            [4,4,4,4,4,4,4,4,4,4,3,4],
            [4,4,4,4,4,4,4,3,4,4,4,4],
            [3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}]],
            [[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:58},{z:4,tid:58}]],
            [[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:58},{z:5,tid:58}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:58},{z:6,tid:58}]],
            [[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:8},{z:7,tid:13}],[{z:0,tid:8},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:58},{z:7,tid:58}]],
            [[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:8},{z:7,tid:13}],[{z:0,tid:8},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:58},{z:7,tid:58}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:58},{z:7,tid:58}],[{z:0,tid:58},{z:6,tid:58}]],
            [[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:74},{z:5,tid:74}],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:58},{z:5,tid:58}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:19},{z:4,tid:54}]],
            [[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}]],
            [[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}]]
        ],
        objects: [
            [[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}]],
            [[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}]],
            [[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[{oid:39,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":9,"y":10},{"x":10,"y":10},{"x":9,"y":11},{"x":10,"y":11}],"2":[{"x":1,"y":0},{"x":2,"y":0},{"x":1,"y":1},{"x":2,"y":1}]}
    },
    prebuilt_crossroads: {
        name: 'Crossroads', w: 16, h: 16,
        grid: [
            [0,0,0,0,0,0,46,46,46,46,0,0,0,0,0,0],
            [0,0,0,0,0,0,54,54,54,54,0,0,0,0,0,0],
            [0,74,74,74,74,0,0,35,35,0,0,49,49,49,49,0],
            [0,74,58,74,74,0,48,48,48,48,0,49,49,48,49,0],
            [0,74,74,58,74,58,48,48,48,48,58,49,49,48,49,0],
            [0,74,58,74,74,48,48,48,48,48,49,49,48,49,49,0],
            [0,74,74,74,74,0,48,48,48,48,0,49,49,49,49,0],
            [0,54,54,35,74,0,48,13,13,48,0,49,35,19,19,0],
            [0,54,54,35,74,58,48,13,13,48,58,49,35,19,19,0],
            [0,74,74,74,74,0,48,48,48,48,0,49,49,49,49,0],
            [0,74,74,58,74,48,48,48,48,48,49,49,48,49,49,0],
            [0,74,58,74,74,58,48,48,48,48,58,49,49,48,49,0],
            [0,74,74,58,74,0,48,48,48,48,0,49,49,48,49,0],
            [0,74,74,74,74,0,0,35,35,0,0,49,49,49,49,0],
            [0,0,0,0,0,0,54,54,54,54,0,0,0,0,0,0],
            [0,0,0,0,0,0,46,46,46,46,0,0,0,0,0,0]
        ],
        heightMap: [
            [0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0],
            [0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0],
            [0,4,4,5,5,0,0,3,3,0,0,5,5,4,4,0],
            [0,5,5,5,5,0,5,5,5,5,0,5,5,5,5,0],
            [0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0],
            [0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0],
            [0,8,8,7,7,0,7,7,7,7,0,7,7,8,8,0],
            [0,8,8,3,8,0,8,8,8,8,0,8,3,8,8,0],
            [0,8,8,3,8,8,8,8,8,8,8,8,3,8,8,0],
            [0,7,7,7,7,0,7,7,7,7,0,7,7,7,7,0],
            [0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0],
            [0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0],
            [0,5,5,5,5,0,5,5,5,5,0,5,5,5,5,0],
            [0,4,4,5,5,0,0,3,3,0,0,5,5,4,4,0],
            [0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0],
            [0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0]
        ],
        voxels: [
            [[],[],[],[],[],[],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[],[],[],[],[],[]],
            [[],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[]],
            [[],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:49},{z:5,tid:49}],[]],
            [[],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[]],
            [[],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[]],
            [[],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[],[{z:0,tid:49},{z:7,tid:49}],[{z:0,tid:49},{z:7,tid:49}],[{z:0,tid:49},{z:8,tid:49}],[{z:0,tid:49},{z:8,tid:49}],[]],
            [[],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:74},{z:8,tid:74}],[],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:48},{z:8,tid:48}],[],[{z:0,tid:49},{z:8,tid:49}],[{z:0,tid:35},{z:3,tid:35}],[{z:0,tid:19},{z:8,tid:19}],[{z:0,tid:19},{z:8,tid:19}],[]],
            [[],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:58},{z:8,tid:58}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:58},{z:8,tid:58}],[{z:0,tid:49},{z:8,tid:49}],[{z:0,tid:35},{z:3,tid:35}],[{z:0,tid:19},{z:8,tid:19}],[{z:0,tid:19},{z:8,tid:19}],[]],
            [[],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[],[{z:0,tid:49},{z:7,tid:49}],[{z:0,tid:49},{z:7,tid:49}],[{z:0,tid:49},{z:7,tid:49}],[{z:0,tid:49},{z:7,tid:49}],[]],
            [[],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[]],
            [[],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[]],
            [[],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:74},{z:5,tid:74}],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:49},{z:5,tid:49}],[]],
            [[],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[]],
            [[],[],[],[],[],[],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[],[],[],[],[],[]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":7,"y":14},{"x":8,"y":14},{"x":7,"y":15},{"x":8,"y":15}],"2":[{"x":7,"y":0},{"x":8,"y":0},{"x":7,"y":1},{"x":8,"y":1}]}
    },
    prebuilt_citadel: {
        name: 'Citadel', w: 20, h: 20,
        grid: [
            [18,54,54,54,54,54,53,53,53,48,48,48,19,19,19,19,19,19,19,19],
            [18,46,46,46,46,54,1,1,48,48,48,48,19,19,19,19,19,19,15,15],
            [54,46,46,46,46,35,48,48,48,48,48,48,19,19,19,19,19,19,15,15],
            [54,46,46,46,46,35,48,0,0,48,48,48,19,19,19,13,13,19,19,19],
            [54,54,35,35,54,54,48,0,48,48,48,48,19,19,19,13,13,19,19,19],
            [48,48,48,48,48,35,48,74,48,48,48,13,13,13,19,19,19,19,19,19],
            [48,48,48,48,48,48,74,74,48,48,48,13,13,13,19,19,19,19,19,19],
            [48,48,48,48,48,48,74,74,3,56,56,13,13,13,19,19,0,19,19,0],
            [48,48,48,48,48,48,48,3,56,56,56,56,13,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,56,56,13,13,56,56,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,56,56,13,13,56,56,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,13,56,56,56,56,3,48,48,48,48,48,48,48],
            [0,19,19,0,19,19,13,13,13,56,56,3,74,74,48,48,48,48,48,48],
            [19,19,19,19,19,19,13,13,13,48,48,48,74,74,48,48,48,48,48,48],
            [19,19,19,19,19,19,13,13,13,48,48,48,74,35,35,48,48,48,48,48],
            [19,19,19,13,13,19,19,19,48,48,48,0,0,48,49,49,35,35,49,49],
            [19,19,19,13,13,19,19,19,48,48,48,48,0,48,35,46,46,46,46,49],
            [15,19,19,19,19,19,19,19,48,48,48,48,48,48,35,46,46,46,46,49],
            [15,15,19,19,19,19,19,19,22,22,48,48,1,1,49,46,46,46,46,49],
            [19,15,19,19,19,19,19,19,22,22,48,53,53,53,49,49,49,49,49,49]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3],
            [3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,4,4,3],
            [3,3,3,3,3,3,5,0,0,5,5,5,5,5,5,5,5,4,4,3],
            [3,4,3,3,5,5,5,0,5,5,5,5,6,6,5,5,5,4,4,3],
            [3,4,4,5,5,3,6,6,6,6,6,6,6,6,6,5,5,4,4,3],
            [3,4,4,5,5,6,6,6,5,6,6,6,6,6,6,5,5,4,4,3],
            [4,4,4,5,5,6,6,5,3,5,7,7,7,6,6,5,0,4,4,0],
            [4,4,4,5,5,6,5,3,5,7,7,7,7,6,6,5,5,4,4,3],
            [3,4,4,5,5,6,6,5,7,8,8,7,7,6,6,5,5,4,4,3],
            [4,4,4,5,5,6,6,7,7,8,8,7,5,6,6,5,5,4,4,3],
            [4,4,4,5,5,6,6,7,7,7,7,5,3,5,6,5,5,4,4,3],
            [0,4,4,0,5,6,6,7,7,7,5,3,5,6,6,5,5,4,4,3],
            [3,4,4,5,5,6,6,6,6,6,6,5,6,6,6,5,5,4,4,3],
            [3,4,4,5,5,6,6,6,6,6,6,6,6,3,3,5,5,4,4,3],
            [3,4,4,5,5,5,5,5,5,5,5,0,0,5,5,5,3,3,4,3],
            [4,4,4,5,5,5,5,5,5,5,5,5,0,5,3,3,3,3,3,3],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,3,3,3,3,3,3],
            [3,4,4,4,4,4,4,4,3,3,4,4,4,4,4,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:18},{z:3,tid:18}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:18},{z:3,tid:18}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:15},{z:4,tid:15}],[{z:0,tid:15},{z:3,tid:15}]],
            [[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:15},{z:4,tid:15}],[{z:0,tid:15},{z:3,tid:15}]],
            [[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:48},{z:5,tid:48}],[],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:54}],[{z:0,tid:19},{z:4,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:48},{z:5,tid:48}],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[]],
            [[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:56},{z:7,tid:56}],[{z:0,tid:56},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[],[],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:49}],[{z:0,tid:8},{z:5,tid:49}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:8},{z:4,tid:49}],[{z:0,tid:8},{z:3,tid:49}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:8},{z:3,tid:49}]],
            [[{z:0,tid:15},{z:4,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'N'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:8},{z:3,tid:49}]],
            [[{z:0,tid:15},{z:3,tid:15}],[{z:0,tid:15},{z:4,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:22},{z:3,tid:22}],[{z:0,tid:22},{z:3,tid:22}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:8},{z:4,tid:49}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:8},{z:3,tid:49}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:15},{z:3,tid:15}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:22},{z:3,tid:22}],[{z:0,tid:22},{z:3,tid:22}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:8},{z:3,tid:49}],[{z:0,tid:8},{z:3,tid:49}],[{z:0,tid:8},{z:3,tid:49}],[{z:0,tid:8},{z:3,tid:49}],[{z:0,tid:8},{z:3,tid:49}],[{z:0,tid:8},{z:3,tid:49}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'top'}],[],[],[{oid:17,alignX:'right',alignY:'top'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":16,"y":17},{"x":17,"y":17},{"x":16,"y":18},{"x":17,"y":18}],"2":[{"x":2,"y":1},{"x":3,"y":1},{"x":2,"y":2},{"x":3,"y":2}]}
    },
    prebuilt_apocalypse: {
        name: 'Apocalypse', w: 36, h: 30,
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,13,53,53,53,53,53,53,53,19,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,58,1,13,1,48,48,48,48,48,48,48,19,19,19,19,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,48,48,48,48,48,48,48,48,48,48,48,48,48,48,19,19,19,48,19,19,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,58,1,1,13,1,1,1,48,48,48,48,48,48,48,19,19,13,19,13,13,19,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,58,2,1,1,13,1,1,1,1,48,48,48,48,48,48,48,19,13,19,19,13,13,19,10,0,0,0,0,0,0],
            [0,0,0,0,58,1,1,2,2,0,1,1,1,1,1,48,48,48,48,48,48,48,13,19,10,10,19,19,10,10,19,19,0,0,0,0],
            [0,0,0,0,1,1,1,1,13,2,58,1,0,1,1,48,48,48,48,48,48,13,19,19,10,19,19,19,19,19,19,19,0,0,0,0],
            [0,0,0,1,1,1,1,13,1,1,1,1,1,1,1,48,48,48,48,48,13,48,19,19,19,19,19,19,19,19,19,19,19,0,0,0],
            [0,0,1,1,1,1,13,1,1,1,1,1,1,1,1,48,48,48,48,13,48,48,19,19,19,19,19,19,19,19,19,19,19,19,0,0],
            [0,0,54,54,54,54,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,19,0,69,19,0,69,19,0,19,19,0,19,0,0],
            [0,0,54,54,54,35,48,48,48,48,48,48,48,48,48,2,2,48,48,2,2,48,48,48,48,48,48,48,48,48,35,54,54,54,0,0],
            [0,54,46,46,46,35,48,48,48,48,48,48,48,48,2,3,3,56,56,3,3,2,48,48,48,48,48,48,48,48,35,46,46,46,54,0],
            [0,54,46,46,46,35,48,48,48,48,48,48,48,48,2,3,56,56,56,56,3,2,48,48,48,48,48,48,48,48,35,46,46,46,54,0],
            [0,54,46,46,46,35,74,74,74,0,74,74,74,74,74,56,56,13,13,56,56,74,74,74,74,74,0,74,74,74,35,46,46,46,54,0],
            [0,54,46,46,46,35,74,74,74,74,0,74,74,74,74,56,56,13,13,56,56,74,74,74,74,0,74,74,74,74,35,46,46,46,54,0],
            [0,54,46,46,46,35,48,48,48,48,48,48,48,48,2,3,56,56,56,56,3,2,48,48,48,48,48,48,48,48,35,46,46,46,54,0],
            [0,54,46,46,46,35,48,48,48,48,48,48,48,48,2,3,3,56,56,3,3,2,48,48,48,48,48,48,48,48,35,46,46,46,54,0],
            [0,0,54,54,54,35,48,48,48,48,48,48,48,48,48,2,2,48,48,2,2,48,48,48,48,48,48,48,48,48,35,54,54,54,0,0],
            [0,0,49,0,49,69,0,49,69,0,49,49,0,49,48,48,13,48,48,48,13,48,74,74,74,74,74,74,74,74,74,74,74,74,0,0],
            [0,0,49,49,49,49,49,49,49,49,49,49,49,49,48,13,48,48,48,48,48,13,74,74,74,74,74,74,74,74,74,74,74,74,0,0],
            [0,0,0,49,49,49,49,49,48,49,49,49,49,49,13,48,48,48,48,48,48,48,13,74,74,74,74,74,74,58,74,74,74,0,0,0],
            [0,0,0,0,49,48,49,49,49,48,10,10,49,13,48,48,48,48,48,48,48,48,74,0,74,58,2,2,74,74,74,74,0,0,0,0],
            [0,0,0,0,49,49,48,49,49,49,49,10,13,49,48,48,48,48,48,48,48,48,74,74,13,74,0,2,2,74,74,74,0,0,0,0],
            [0,0,0,0,0,0,49,49,13,13,49,13,49,49,48,48,48,48,48,48,48,48,74,74,58,13,74,74,74,74,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,48,13,13,13,49,49,49,48,48,48,48,48,48,48,48,74,74,74,74,13,74,74,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,49,49,49,49,49,49,48,48,48,48,48,48,48,48,48,48,48,48,48,48,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,49,49,49,49,48,48,48,48,48,48,48,48,74,74,74,74,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,49,53,53,53,53,53,53,53,53,74,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        heightMap: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,5,3,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,3,0,0,0,0,0,0],
            [0,0,0,0,5,5,5,3,3,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,3,3,5,5,3,3,5,5,0,0,0,0],
            [0,0,0,0,5,5,5,5,5,3,5,5,0,5,5,5,5,5,5,5,5,5,5,5,3,5,5,5,5,5,5,5,0,0,0,0],
            [0,0,0,6,6,6,6,6,6,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,5,6,6,6,6,6,6,6,6,0,0,0],
            [0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,5,6,6,5,6,6,6,6,6,6,0,0],
            [0,0,6,6,6,6,6,6,6,6,6,6,6,6,6,5,5,6,6,5,5,6,6,0,3,5,0,3,5,0,6,6,1,6,0,0],
            [0,0,5,5,5,3,7,7,7,7,7,7,7,7,5,3,3,5,5,3,3,5,7,7,5,7,7,7,7,7,3,5,5,5,0,0],
            [0,5,3,3,3,3,7,7,7,7,7,7,7,5,3,3,3,5,5,3,3,3,5,7,7,7,7,7,7,7,3,3,3,3,5,0],
            [0,5,3,3,3,3,7,7,7,7,7,7,7,5,3,3,5,7,7,5,3,3,5,7,7,7,7,7,7,7,3,3,3,3,5,0],
            [0,5,3,3,3,3,8,8,8,0,8,8,8,7,5,5,7,8,8,7,5,7,7,8,8,8,0,8,8,8,3,3,3,3,5,0],
            [0,5,3,3,3,3,8,8,8,8,0,8,8,7,5,5,7,8,8,7,5,7,7,8,8,0,8,8,8,8,3,3,3,3,5,0],
            [0,5,3,3,3,3,7,7,7,7,7,7,7,5,3,3,5,7,7,5,3,3,5,7,7,7,7,7,7,7,3,3,3,3,5,0],
            [0,5,3,3,3,3,7,7,7,7,7,7,7,5,3,3,3,5,5,3,3,3,5,7,7,7,7,7,7,7,3,3,3,3,5,0],
            [0,1,5,5,5,3,7,7,5,7,7,7,7,7,5,3,3,5,5,3,3,5,7,7,7,7,7,7,7,7,3,5,5,5,1,0],
            [0,1,6,1,5,3,0,5,3,0,6,6,0,6,6,5,5,6,6,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,1,0],
            [0,0,6,6,6,5,6,6,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,0,0],
            [0,0,0,6,6,6,6,6,6,6,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,5,6,6,6,6,6,6,0,0,0],
            [0,0,0,0,5,5,5,5,5,5,3,3,5,5,5,5,5,5,5,5,5,5,5,0,5,5,3,3,5,5,5,5,0,0,0,0],
            [0,0,0,0,5,5,5,5,5,5,5,3,5,5,5,5,5,5,5,5,5,5,5,5,5,5,0,3,3,5,5,5,0,0,0,0],
            [0,0,0,0,0,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        voxels: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{z:0,tid:1},{z:3,tid:1}],[{z:0,tid:13},{z:3,tid:13}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:19},{z:3,tid:19}],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:1},{z:4,tid:1}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:19}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[],[],[],[],[],[]],
            [[],[],[],[],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[],[],[],[]],
            [[],[],[],[],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:1},{z:5,tid:1}],[],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[],[],[],[]],
            [[],[],[],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:5,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[],[],[]],
            [[],[],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:1},{z:6,tid:1}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[],[]],
            [[],[],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:19}],[],[{z:0,tid:69},{z:3,tid:69}],[{z:0,tid:19},{z:5,tid:19}],[],[{z:0,tid:69},{z:3,tid:69}],[{z:0,tid:19},{z:5,tid:19}],[],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[],[{z:0,tid:19},{z:6,tid:19}],[],[]],
            [[],[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'S'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[],[]],
            [[],[{z:0,tid:54},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:54},{z:5,tid:54}],[]],
            [[],[{z:0,tid:54},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:54},{z:5,tid:54}],[]],
            [[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:54}],[]],
            [[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:8,tid:13}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:7,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:74},{z:8,tid:74}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:54}],[]],
            [[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:7,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:54}],[]],
            [[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:8},{z:5,tid:56}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:3},{z:3,tid:3}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:54}],[]],
            [[],[],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:35},{z:3,tid:35,sd:'E'}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:35},{z:3,tid:35,sd:'W'}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[],[]],
            [[],[],[{z:0,tid:8},{z:6,tid:49}],[],[{z:0,tid:8},{z:5,tid:49}],[{z:0,tid:69},{z:3,tid:69}],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:69},{z:3,tid:69}],[],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:13}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[],[]],
            [[],[],[{z:0,tid:8},{z:6,tid:49}],[{z:0,tid:8},{z:6,tid:49}],[{z:0,tid:8},{z:6,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[],[]],
            [[],[],[],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:49},{z:6,tid:49}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:58},{z:6,tid:58}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[{z:0,tid:74},{z:6,tid:74}],[],[],[]],
            [[],[],[],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:74},{z:5,tid:74}],[],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[],[],[]],
            [[],[],[],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:74},{z:5,tid:74}],[],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[],[],[]],
            [[],[],[],[],[],[],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:49},{z:5,tid:49}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:58},{z:5,tid:58}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[{z:0,tid:74},{z:5,tid:74}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:49},{z:4,tid:49}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[{z:0,tid:74},{z:4,tid:74}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{z:0,tid:49},{z:3,tid:49}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:53},{z:3,tid:53}],[{z:0,tid:74},{z:3,tid:74}],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:14,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[{oid:14,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'top'}],[],[],[{oid:17,alignX:'right',alignY:'top'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'right',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:14,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[{oid:14,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[{oid:29,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":2,"y":11},{"x":1,"y":12},{"x":2,"y":12},{"x":1,"y":13},{"x":2,"y":13},{"x":1,"y":14},{"x":2,"y":14},{"x":1,"y":15},{"x":2,"y":15},{"x":1,"y":16}],"2":[{"x":33,"y":11},{"x":34,"y":12},{"x":33,"y":12},{"x":34,"y":13},{"x":33,"y":13},{"x":34,"y":14},{"x":33,"y":14},{"x":34,"y":15},{"x":33,"y":15},{"x":34,"y":16}]}
    },
    prebuilt_battlefield: {
        name: 'Battlefield', w: 12, h: 12,
        grid: [
            [46,46,46,46,35,74,74,5,5,5,5,5],
            [46,46,46,46,74,58,48,48,5,2,2,5],
            [35,74,74,71,74,49,49,2,2,2,2,5],
            [58,74,71,58,48,48,48,2,2,2,5,5],
            [71,74,74,48,48,2,2,2,2,2,48,5],
            [74,58,49,48,49,2,2,2,48,48,48,74],
            [74,19,48,48,2,2,2,49,48,48,58,74],
            [19,19,19,19,2,2,49,48,48,74,74,71],
            [19,10,10,10,19,48,48,48,74,58,71,74],
            [19,10,10,10,19,48,48,74,71,74,74,35],
            [19,10,10,10,19,19,71,74,46,46,46,46],
            [19,19,19,19,19,74,58,35,46,46,46,46]
        ],
        heightMap: [
            [7,7,7,7,6,6,6,6,7,7,9,9],
            [7,7,7,7,6,6,4,4,6,7,9,9],
            [6,6,6,6,6,4,4,6,6,7,7,7],
            [6,6,6,6,4,4,4,4,6,6,6,7],
            [6,6,6,4,4,4,4,4,4,6,4,6],
            [6,6,4,4,4,4,4,4,4,4,6,6],
            [6,6,4,4,4,4,4,4,4,4,6,6],
            [3,3,3,3,4,4,4,4,6,6,6,6],
            [3,3,3,3,3,4,4,4,6,6,6,6],
            [3,3,3,3,4,4,4,6,6,6,6,6],
            [3,3,3,3,4,4,5,6,7,7,7,7],
            [3,3,3,3,3,5,6,6,7,7,7,7]
        ],
        voxels: [
            [[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:6,tid:35,sd:'E'}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:5}],[{z:0,tid:19},{z:7,tid:5}],[{z:0,tid:19},{z:7,tid:5}],[{z:0,tid:19},{z:9,tid:5}],[{z:0,tid:19},{z:9,tid:5}]],
            [[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:5}],[{z:0,tid:19},{z:7,tid:2}],[{z:0,tid:19},{z:9,tid:2}],[{z:0,tid:19},{z:9,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:35,sd:'S'}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:49}],[{z:0,tid:19},{z:4,tid:49}],[{z:0,tid:19},{z:6,tid:2}],[{z:0,tid:19},{z:6,tid:2}],[{z:0,tid:19},{z:7,tid:2}],[{z:0,tid:19},{z:7,tid:2}],[{z:0,tid:19},{z:7,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:6,tid:2}],[{z:0,tid:19},{z:6,tid:2}],[{z:0,tid:19},{z:6,tid:5}],[{z:0,tid:19},{z:7,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:6,tid:2}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:49}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:1},{z:4,tid:49}],[{z:0,tid:1},{z:4,tid:2}],[{z:0,tid:1},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:1},{z:4,tid:2}],[{z:0,tid:1},{z:4,tid:2}],[{z:0,tid:1},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:49}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:2}],[{z:0,tid:19},{z:4,tid:49}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:71}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:1},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:35,sd:'N'}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:5,tid:71}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:6,tid:35,sd:'W'}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:38,alignX:'center',alignY:'bottom'}],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:3,alignX:'center',alignY:'bottom'}],[],[{oid:35,alignX:'center',alignY:'bottom'}],[{oid:34,alignX:'center',alignY:'bottom'}],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[{oid:4,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[{oid:38,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":9,"y":11},{"x":10,"y":11}],"2":[{"x":1,"y":0},{"x":2,"y":0}]},
        sanctuaryZones: [[2,2,2,2,0,0,0,0,0,0,0,0],[2,2,2,2,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,1,1,1],[0,0,0,0,0,0,0,0,1,1,1,1]]
    },
    prebuilt_ravine: {
        name: 'Ravine', w: 10, h: 10,
        grid: [
            [54,54,54,48,48,48,72,72,48,48],
            [54,46,46,48,72,72,48,48,48,58],
            [48,48,48,48,72,2,2,48,48,48],
            [72,48,48,48,4,2,2,48,48,72],
            [72,72,48,48,4,2,4,48,72,72],
            [72,72,48,4,2,4,48,48,72,72],
            [72,48,48,2,2,4,48,48,48,72],
            [48,48,48,2,2,72,48,48,48,48],
            [58,48,48,48,72,72,48,46,46,54],
            [48,48,72,72,48,48,48,54,54,54]
        ],
        heightMap: [
            [7,7,7,7,7,6,7,7,6,6],
            [7,7,7,7,7,7,5,6,6,4],
            [6,6,6,6,6,3,3,5,6,6],
            [7,6,6,6,4,3,3,5,6,7],
            [7,7,6,6,6,5,4,6,7,7],
            [7,7,6,4,5,6,6,6,7,7],
            [7,6,5,3,3,4,6,6,6,7],
            [6,6,5,3,3,6,6,6,6,6],
            [4,6,6,5,7,7,7,7,7,7],
            [6,6,7,7,6,7,7,7,7,7]
        ],
        voxels: [
            [[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:58}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:72}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}]],
            [[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:4}],[{z:0,tid:2},{z:5,tid:2}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}]],
            [[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:2},{z:5,tid:2}],[{z:0,tid:8},{z:6,tid:4}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}]],
            [[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:6,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:54}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:7,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}]]
        ],
        objects: [
            [[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[]],
            [[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[{oid:37,alignX:'center',alignY:'bottom'}]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}]],
            [[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":7,"y":8},{"x":8,"y":8},{"x":7,"y":9},{"x":8,"y":9}],"2":[{"x":1,"y":0},{"x":2,"y":0},{"x":1,"y":1},{"x":2,"y":1}]},
        sanctuaryZones: [[2,2,2,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,1,1,1]]
    },
    prebuilt_highlands: {
        name: 'Highlands', w: 16, h: 16,
        grid: [
            [54,54,54,48,48,48,48,48,48,48,48,48,48,48,48,2],
            [54,54,54,53,48,48,48,48,48,48,48,48,48,48,2,2],
            [54,54,54,48,48,48,48,48,48,48,48,48,48,2,2,48],
            [48,53,48,18,48,48,48,48,48,48,48,48,2,2,48,48],
            [48,48,48,48,48,48,48,48,48,48,48,2,2,48,48,48],
            [48,48,48,48,48,48,48,48,48,48,4,2,48,48,48,48],
            [48,48,48,48,48,48,48,58,48,2,2,48,48,48,48,48],
            [13,13,13,13,13,13,14,13,2,2,13,13,13,13,13,13],
            [13,13,13,13,13,13,13,2,2,14,13,13,13,13,13,13],
            [48,48,48,48,48,48,2,2,58,48,48,48,48,48,48,48],
            [48,48,48,48,48,4,2,48,48,48,48,48,48,48,48,48],
            [48,48,48,48,2,2,48,48,48,48,48,48,48,48,48,48],
            [48,48,48,2,2,48,48,48,48,48,48,48,18,48,53,48],
            [48,48,2,2,48,48,48,48,48,48,48,48,48,54,54,54],
            [48,2,2,48,48,48,48,48,48,48,48,48,53,54,54,54],
            [2,2,48,48,48,48,48,48,48,48,48,48,48,54,54,54]
        ],
        heightMap: [
            [8,8,8,8,8,8,8,8,8,8,8,8,8,7,5,3],
            [8,7,7,7,8,8,7,7,7,7,7,7,7,5,3,3],
            [8,7,7,5,7,7,7,7,7,7,7,7,5,3,3,5],
            [8,7,5,3,7,7,6,6,6,6,6,5,3,3,5,7],
            [8,7,7,5,5,5,5,5,5,5,5,3,3,5,7,8],
            [8,7,7,6,5,5,5,5,5,5,5,3,5,7,7,8],
            [8,7,7,6,6,5,4,4,4,3,3,5,6,7,7,8],
            [8,7,7,6,6,5,4,3,3,3,5,5,6,7,7,8],
            [8,7,7,6,5,5,4,3,3,4,5,6,6,7,7,8],
            [8,7,7,6,5,5,3,3,4,4,5,6,6,7,7,8],
            [8,7,7,6,5,5,3,5,5,5,5,5,7,7,7,8],
            [8,7,7,5,3,3,5,5,5,5,5,5,7,7,7,8],
            [8,7,5,3,3,5,6,6,6,6,7,7,3,5,7,8],
            [7,5,3,3,5,7,7,7,7,7,7,7,5,7,7,8],
            [5,3,3,5,7,7,7,7,7,7,7,7,7,7,7,8],
            [3,3,5,7,8,8,8,8,8,8,8,8,8,8,8,8]
        ],
        voxels: [
            [[{z:0,tid:54},{z:8,tid:54}],[{z:0,tid:54},{z:8,tid:54}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}]],
            [[{z:0,tid:54},{z:8,tid:54}],[{z:0,tid:54},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:8},{z:7,tid:53}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}]],
            [[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}]],
            [[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:7,tid:53}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:18},{z:3,tid:18}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}]],
            [[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:8,tid:48}]],
            [[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:4}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:8,tid:48}]],
            [[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:8,tid:48}]],
            [[{z:0,tid:13},{z:8,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:14},{z:4,tid:14}],[{z:0,tid:13},{z:3,tid:13}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:13}],[{z:0,tid:8},{z:5,tid:13}],[{z:0,tid:8},{z:6,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:8,tid:13}]],
            [[{z:0,tid:13},{z:8,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:4,tid:13}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:14},{z:4,tid:14}],[{z:0,tid:13},{z:5,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:6,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:7,tid:13}],[{z:0,tid:13},{z:8,tid:13}]],
            [[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:58},{z:4,tid:58}],[{z:0,tid:48},{z:4,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:8,tid:48}]],
            [[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:4}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:8,tid:48}]],
            [[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:5,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:8,tid:48}]],
            [[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:6,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:18},{z:3,tid:18}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:53}],[{z:0,tid:8},{z:8,tid:48}]],
            [[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:8,tid:54}]],
            [[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:48},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:7,tid:53}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:54},{z:7,tid:54}],[{z:0,tid:54},{z:8,tid:54}]],
            [[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:5,tid:48}],[{z:0,tid:8},{z:7,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:48},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:8},{z:8,tid:48}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:54},{z:8,tid:54}],[{z:0,tid:54},{z:8,tid:54}]]
        ],
        objects: [
            [[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":13,"y":14},{"x":14,"y":14},{"x":13,"y":15},{"x":14,"y":15}],"2":[{"x":1,"y":0},{"x":2,"y":0},{"x":1,"y":1},{"x":2,"y":1}]},
        sanctuaryZones: [[2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1]]
    },
    prebuilt_caldera: {
        name: 'Caldera', w: 20, h: 20,
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,66,66,66,66,66,66,0,0,0,0,0,0,0],
            [0,0,0,0,0,66,66,66,66,66,66,66,66,66,66,0,0,0,0,0],
            [0,0,0,0,46,66,63,63,63,63,63,63,63,63,66,66,0,0,0,0],
            [0,0,0,46,46,63,63,63,19,18,19,19,63,63,63,66,66,0,0,0],
            [0,0,66,66,63,15,19,19,19,19,19,19,19,19,15,63,66,66,0,0],
            [0,0,66,63,63,19,19,11,11,11,11,11,11,19,19,63,63,66,0,0],
            [0,66,66,63,63,19,11,11,10,10,4,10,11,11,19,63,63,66,66,0],
            [0,66,66,63,19,19,11,10,10,10,4,10,10,11,19,19,63,66,66,0],
            [0,66,66,63,19,19,11,10,10,66,66,10,10,11,19,19,63,66,66,0],
            [0,66,66,63,18,19,11,4,4,66,66,4,4,11,19,18,63,66,66,0],
            [0,66,66,63,19,19,11,10,10,10,4,10,10,11,19,19,63,66,66,0],
            [0,66,66,63,63,19,11,11,10,10,4,10,11,11,19,63,63,66,66,0],
            [0,0,66,63,63,19,19,11,11,11,11,11,11,19,19,63,63,66,0,0],
            [0,0,66,66,63,15,19,19,19,19,19,19,19,19,15,63,66,66,0,0],
            [0,0,0,66,66,63,63,63,19,19,18,19,63,63,63,46,46,0,0,0],
            [0,0,0,0,66,66,63,63,63,63,63,63,63,63,66,46,0,0,0,0],
            [0,0,0,0,0,66,66,66,66,66,66,66,66,66,66,0,0,0,0,0],
            [0,0,0,0,0,0,0,66,66,66,66,66,66,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        heightMap: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,10,10,10,10,10,10,0,0,0,0,0,0,0],
            [0,0,0,0,0,10,10,10,9,9,9,9,10,10,10,0,0,0,0,0],
            [0,0,0,0,10,10,10,9,7,7,7,7,9,9,10,10,0,0,0,0],
            [0,0,0,10,10,9,9,7,6,6,6,6,7,7,9,10,10,0,0,0],
            [0,0,10,10,9,9,9,6,6,6,6,6,6,6,7,9,10,10,0,0],
            [0,0,10,9,7,6,6,4,4,4,4,4,4,6,6,7,9,10,0,0],
            [0,10,10,9,7,6,4,4,3,3,4,3,4,4,6,7,9,10,10,0],
            [0,10,9,7,6,6,4,3,3,3,4,3,3,4,6,6,7,9,10,0],
            [0,10,9,7,6,6,4,3,3,5,5,3,3,4,6,6,7,9,10,0],
            [0,10,9,7,6,6,4,4,4,5,6,4,4,4,6,6,7,9,10,0],
            [0,10,9,7,6,6,4,3,3,3,4,3,3,4,6,6,7,9,10,0],
            [0,10,10,9,7,6,4,4,3,3,4,3,4,4,6,7,9,10,10,0],
            [0,0,10,9,7,6,6,4,4,4,4,4,4,6,6,10,10,10,0,0],
            [0,0,10,10,9,7,6,6,6,6,6,6,6,9,9,10,10,10,0,0],
            [0,0,0,10,10,9,7,7,6,6,6,6,7,9,9,10,10,0,0,0],
            [0,0,0,0,10,10,9,9,7,7,7,7,9,9,10,10,0,0,0,0],
            [0,0,0,0,0,10,10,10,9,9,9,9,10,10,10,0,0,0,0,0],
            [0,0,0,0,0,0,0,10,10,10,10,10,10,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        voxels: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[],[],[]],
            [[],[],[],[],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[],[]],
            [[],[],[],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:8},{z:6,tid:18}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[]],
            [[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:15}],[{z:0,tid:19},{z:9,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[]],
            [[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:66}],[{z:0,tid:19},{z:5,tid:66}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:8},{z:6,tid:18}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:19},{z:5,tid:66}],[{z:0,tid:19},{z:6,tid:66}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:8},{z:6,tid:18}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:10},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[]],
            [[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[],[]],
            [[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:9,tid:19}],[{z:0,tid:19},{z:9,tid:15}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[]],
            [[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:8},{z:6,tid:18}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[],[],[]],
            [[],[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:7,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:46}],[],[],[],[]],
            [[],[],[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:9,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[{z:0,tid:19},{z:10,tid:66}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":15,"y":16},{"x":16,"y":16},{"x":15,"y":17},{"x":16,"y":17}],"2":[{"x":3,"y":2},{"x":4,"y":2},{"x":3,"y":3},{"x":4,"y":3}]},
        sanctuaryZones: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
    },
    prebuilt_bastion: {
        name: 'Bastion', w: 12, h: 12,
        grid: [
            [54,54,48,48,48,48,48,48,48,48,48,48],
            [46,46,48,48,48,72,72,48,48,48,58,48],
            [48,48,48,72,2,4,4,2,72,48,48,48],
            [48,48,72,2,2,71,71,2,2,72,48,48],
            [48,48,2,2,71,74,74,71,2,2,48,48],
            [48,72,4,71,74,13,13,74,71,4,72,48],
            [48,72,4,71,74,13,13,74,71,4,72,48],
            [48,48,2,2,71,74,74,71,2,2,48,48],
            [48,48,72,2,2,71,71,2,2,72,48,48],
            [48,48,48,72,2,4,4,2,72,48,48,48],
            [48,58,48,48,48,72,72,48,48,48,46,46],
            [48,48,48,48,48,48,48,48,48,54,54,54]
        ],
        heightMap: [
            [7,7,6,6,4,4,4,4,4,6,6,6],
            [7,7,6,6,3,3,3,3,4,6,4,6],
            [6,6,4,3,3,4,4,3,3,4,6,6],
            [4,4,3,3,3,6,6,3,3,3,4,4],
            [4,4,3,3,7,8,8,7,3,3,4,4],
            [4,3,4,6,8,10,10,8,6,4,3,4],
            [4,3,4,6,8,10,10,8,6,4,3,4],
            [4,4,3,3,7,8,8,7,3,3,4,4],
            [4,4,3,3,3,6,6,3,3,3,4,4],
            [6,6,4,3,3,4,4,3,6,6,6,6],
            [6,4,6,4,3,3,3,3,6,6,7,7],
            [6,6,6,4,4,4,4,4,4,6,7,7]
        ],
        voxels: [
            [[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:19},{z:7,tid:71}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:7,tid:71}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:8},{z:10,tid:13}],[{z:0,tid:8},{z:10,tid:13}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:8},{z:10,tid:13}],[{z:0,tid:8},{z:10,tid:13}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:19},{z:7,tid:71}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:7,tid:71}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:19},{z:6,tid:71}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:8},{z:4,tid:4}],[{z:0,tid:2},{z:3,tid:2}],[{z:0,tid:72},{z:6,tid:72}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:72},{z:3,tid:72}],[{z:0,tid:48},{z:3,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:7,tid:46}]],
            [[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:6,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:8},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}]]
        ],
        objects: [
            [[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[{oid:39,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[{oid:39,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:34,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":10,"y":10},{"x":11,"y":10},{"x":10,"y":11},{"x":11,"y":11}],"2":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}]},
        sanctuaryZones: [[2,2,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,1,1]]
    },
    prebuilt_mountain: {
        name: 'Mountain', w: 12, h: 12,
        grid: [
            [46,46,46,46,13,48,5,5,5,5,5,5],
            [46,46,46,46,13,48,5,5,5,10,10,5],
            [35,35,13,13,13,48,48,5,5,10,10,5],
            [13,13,13,13,50,50,50,48,5,5,5,5],
            [48,48,48,50,48,48,48,50,48,5,5,5],
            [48,48,48,48,48,48,48,50,48,48,5,5],
            [6,48,48,48,50,48,48,48,48,48,48,48],
            [6,6,48,48,50,48,48,48,50,48,48,48],
            [3,6,6,48,48,50,50,50,13,13,13,13],
            [3,3,6,6,48,48,48,13,13,13,35,35],
            [3,3,3,6,6,48,48,13,46,46,46,46],
            [3,3,3,3,6,6,48,13,46,46,46,46]
        ],
        heightMap: [
            [11,11,11,10,8,6,10,22,22,25,25,26],
            [11,11,10,10,8,6,8,22,25,23,23,25],
            [9,9,8,8,8,6,6,22,25,23,23,25],
            [8,8,8,8,12,12,12,6,22,25,25,22],
            [6,6,6,12,6,6,6,12,6,22,26,22],
            [6,6,6,6,6,6,6,12,6,6,22,11],
            [5,6,6,6,12,6,6,6,6,6,6,6],
            [5,5,6,6,12,6,6,6,12,6,6,6],
            [5,5,5,6,6,12,12,12,8,8,8,8],
            [5,5,5,5,6,6,6,8,8,8,9,9],
            [5,5,5,5,5,6,6,8,10,10,11,11],
            [5,5,5,5,5,5,6,8,10,11,11,11]
        ],
        voxels: [
            [[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:10,tid:5}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:26,tid:5}]],
            [[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:8,tid:5}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:23,tid:10}],[{z:0,tid:19},{z:23,tid:10}],[{z:0,tid:19},{z:25,tid:5}]],
            [[{z:0,tid:19},{z:9,tid:35}],[{z:0,tid:19},{z:9,tid:35}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:23,tid:10}],[{z:0,tid:19},{z:23,tid:10}],[{z:0,tid:19},{z:25,tid:5}]],
            [[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:25,tid:5}],[{z:0,tid:19},{z:22,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:26,tid:5}],[{z:0,tid:19},{z:22,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:22,tid:5}],[{z:0,tid:19},{z:11,tid:5}]],
            [[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}]],
            [[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:12,tid:50}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}]],
            [[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:9,tid:35}],[{z:0,tid:19},{z:9,tid:35}]],
            [[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}]],
            [[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:3}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:10,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}],[{z:0,tid:19},{z:11,tid:46}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":1,"y":1},{"x":1,"y":0},{"x":0,"y":0},{"x":0,"y":1}],"2":[{"x":10,"y":11},{"x":10,"y":10},{"x":11,"y":10},{"x":11,"y":11}]},
        sanctuaryZones: [[1,1,1,1,0,0,0,0,0,0,0,0],[1,1,1,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,2,2,2,2],[0,0,0,0,0,0,0,0,2,2,2,2]]
    },
    prebuilt_crater: {
        name: 'Crater', w: 16, h: 16,
        grid: [
            [10,10,10,10,10,10,10,10,10,10,10,10,10,10,46,46],
            [10,19,19,19,19,19,19,19,19,19,19,19,19,19,46,46],
            [10,19,50,50,50,50,50,74,74,10,10,10,10,10,46,46],
            [10,19,50,50,50,74,74,74,74,74,74,10,10,10,46,46],
            [10,19,50,50,74,74,13,13,13,13,74,74,10,10,74,74],
            [10,19,50,74,74,13,13,13,13,13,13,74,74,10,74,74],
            [10,19,50,74,13,13,13,13,13,13,13,13,74,10,74,74],
            [74,74,74,74,13,13,13,13,13,13,13,13,74,74,74,74],
            [74,74,74,74,13,13,13,13,13,13,13,13,74,74,74,74],
            [74,74,10,74,13,13,13,13,13,13,13,13,74,48,19,10],
            [74,74,10,74,74,13,13,13,13,13,13,74,74,48,19,10],
            [74,74,10,10,74,74,13,13,13,13,74,74,48,48,19,10],
            [46,74,10,10,10,74,74,74,74,74,74,48,48,48,19,10],
            [46,46,10,10,10,10,10,74,74,48,48,48,48,48,19,10],
            [46,46,19,19,19,19,19,19,19,19,19,19,19,19,19,10],
            [46,46,10,10,10,10,10,10,10,10,10,10,10,10,10,10]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,5,6],
            [3,3,3,3,3,3,3,7,7,3,3,3,3,3,5,6],
            [3,3,5,5,5,5,5,7,7,3,3,3,3,3,5,6],
            [3,3,5,6,6,7,7,9,9,7,7,3,3,3,5,6],
            [3,3,5,6,7,7,7,9,9,7,7,7,3,3,5,6],
            [3,3,5,7,7,11,11,15,15,9,9,7,7,3,5,6],
            [3,3,5,7,7,11,11,15,15,9,9,7,7,3,5,6],
            [5,7,7,9,9,10,10,17,17,15,15,9,9,7,7,6],
            [6,7,7,9,9,10,10,17,17,15,15,9,9,7,7,5],
            [6,5,3,7,7,9,9,9,9,9,9,7,7,5,5,3],
            [6,5,3,7,7,9,9,9,9,9,9,7,7,5,5,3],
            [6,5,3,3,7,7,7,9,9,7,7,7,7,5,5,3],
            [6,5,3,3,3,7,7,9,9,7,7,7,7,5,5,3],
            [6,5,3,3,3,3,3,7,7,5,5,5,5,5,5,3],
            [6,5,3,3,3,3,3,7,7,5,5,5,5,5,5,3],
            [6,5,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:6,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:6,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:6,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:6,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:50}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:17,tid:13}],[{z:0,tid:19},{z:17,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:17,tid:13}],[{z:0,tid:19},{z:17,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:15,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:5,tid:74}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:9,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:46}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:48}],[{z:0,tid:19},{z:7,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:46}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:46}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:19},{z:7,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:46}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":15},{"x":0,"y":14},{"x":1,"y":14},{"x":1,"y":15},{"x":1,"y":13},{"x":0,"y":13}],"2":[{"x":15,"y":0},{"x":15,"y":1},{"x":14,"y":1},{"x":14,"y":0},{"x":14,"y":2},{"x":15,"y":2}]},
        sanctuaryZones: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
    },
    prebuilt_tundra: {
        name: 'Tundra', w: 8, h: 8,
        grid: [
            [9,9,9,48,48,9,9,9],
            [9,48,48,48,48,48,48,9],
            [9,48,2,2,2,2,48,9],
            [48,48,2,9,9,2,48,48],
            [48,48,2,9,9,2,48,48],
            [9,48,2,2,2,2,48,9],
            [9,48,48,48,48,48,48,9],
            [9,9,9,48,48,9,9,9]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3],
            [3,4,4,4,4,4,4,3],
            [3,4,3,3,3,3,4,3],
            [3,4,3,3,3,3,4,3],
            [3,4,3,3,3,3,4,3],
            [3,4,3,3,3,3,4,3],
            [3,4,4,4,4,4,4,3],
            [3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}]],
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:9}]],
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:9}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:9}]],
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:9}]],
            [[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}],[{z:0,tid:19},{z:3,tid:9}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[]],
            [[],[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":6,"y":7},{"x":7,"y":7},{"x":6,"y":6},{"x":7,"y":6}]}
    },
    prebuilt_oasis: {
        name: 'Oasis', w: 10, h: 10,
        grid: [
            [6,6,6,6,6,6,6,6,6,6],
            [6,6,6,6,48,48,6,6,6,6],
            [6,6,6,48,48,48,48,6,6,6],
            [6,6,48,48,2,2,48,48,6,6],
            [6,48,48,2,18,18,2,48,48,6],
            [6,48,48,2,18,18,2,48,48,6],
            [6,6,48,48,2,2,48,48,6,6],
            [6,6,6,48,48,48,48,6,6,6],
            [6,6,6,6,48,48,6,6,6,6],
            [6,6,6,6,6,6,6,6,6,6]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3],
            [3,4,4,4,4,4,4,4,4,3],
            [3,4,5,5,5,5,5,5,4,3],
            [3,4,5,5,3,3,5,5,4,3],
            [3,4,5,3,3,3,3,5,4,3],
            [3,4,5,3,3,3,3,5,4,3],
            [3,4,5,5,3,3,5,5,4,3],
            [3,4,5,5,5,5,5,5,4,3],
            [3,4,4,4,4,4,4,4,4,3],
            [3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:5,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:3,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}],[{z:0,tid:19},{z:3,tid:6}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:35,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":8,"y":9},{"x":9,"y":9},{"x":8,"y":8},{"x":9,"y":8}]}
    },
    prebuilt_quarry: {
        name: 'Quarry', w: 12, h: 12,
        grid: [
            [13,63,63,63,63,63,63,63,63,63,63,63],
            [63,13,72,72,72,72,72,72,72,72,72,63],
            [63,72,13,8,8,8,8,8,8,8,72,63],
            [63,72,8,13,13,13,13,13,13,8,72,63],
            [63,72,8,13,13,19,19,19,13,8,72,63],
            [63,72,8,13,19,13,15,19,13,8,72,63],
            [63,72,8,13,19,15,13,19,13,8,72,63],
            [63,72,8,13,19,19,19,13,13,8,72,63],
            [63,72,8,13,13,13,13,13,13,8,72,63],
            [63,72,8,8,8,8,8,8,8,13,72,63],
            [63,72,72,72,72,72,72,72,72,72,13,63],
            [63,63,63,63,63,63,63,63,63,63,63,13]
        ],
        heightMap: [
            [11,11,11,10,10,10,10,10,10,10,11,11],
            [11,10,9,8,8,8,8,8,8,8,9,11],
            [11,9,8,6,6,6,6,6,6,6,8,10],
            [10,8,6,6,4,4,4,4,4,6,8,10],
            [10,8,6,4,5,3,3,3,4,6,8,10],
            [10,8,6,4,3,4,3,3,4,6,8,10],
            [10,8,6,4,3,3,4,3,4,6,8,10],
            [10,8,6,4,3,3,3,5,4,6,8,10],
            [10,8,6,4,4,4,4,4,6,6,8,10],
            [10,8,6,6,6,6,6,6,6,8,9,11],
            [11,9,8,8,8,8,8,8,8,9,10,11],
            [11,11,10,10,10,10,10,10,10,11,11,11]
        ],
        voxels: [
            [[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}]],
            [[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:11,tid:63}]],
            [[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:6,tid:8}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:11,tid:63}]],
            [[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:8,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:11,tid:63}]],
            [[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:13}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":10,"y":11},{"x":11,"y":11},{"x":10,"y":10},{"x":11,"y":10}]}
    },
    prebuilt_fungal_hollow: {
        name: 'Fungal Hollow', w: 8, h: 8,
        grid: [
            [19,19,19,19,19,19,19,19],
            [19,16,19,52,52,19,16,19],
            [19,19,47,47,47,47,19,19],
            [19,52,47,18,15,47,52,19],
            [19,52,47,15,18,47,52,19],
            [19,19,47,47,47,47,19,19],
            [19,16,19,52,52,19,16,19],
            [19,19,19,19,19,19,19,19]
        ],
        heightMap: [
            [6,6,6,5,5,6,6,6],
            [6,5,5,3,3,5,5,6],
            [6,5,4,4,4,4,5,6],
            [5,3,4,3,3,4,3,5],
            [5,3,4,3,3,4,3,5],
            [6,5,4,4,4,4,5,6],
            [6,5,5,3,3,5,5,6],
            [6,6,6,5,5,6,6,6]
        ],
        voxels: [
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:6,tid:19}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}]],
            [[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}]],
            [[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:6,tid:19}]],
            [[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}],[{z:0,tid:19},{z:6,tid:19}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":6,"y":7},{"x":7,"y":7},{"x":6,"y":6},{"x":7,"y":6}]}
    },
    prebuilt_fortress: {
        name: 'Fortress', w: 16, h: 16,
        grid: [
            [46,46,48,48,48,48,48,48,48,48,48,48,48,48,48,48],
            [46,46,48,48,48,48,48,48,48,48,48,48,48,48,48,48],
            [48,48,2,2,2,2,2,4,4,2,2,2,2,2,48,48],
            [48,48,2,54,54,54,54,13,13,54,54,54,54,2,48,48],
            [48,48,2,54,54,74,74,74,74,74,74,54,54,2,48,48],
            [48,48,2,54,74,74,74,74,74,74,74,74,54,2,48,48],
            [48,48,2,54,74,74,74,74,74,74,74,74,54,2,48,48],
            [48,48,2,54,74,74,74,54,54,74,74,74,54,2,48,48],
            [48,48,2,54,74,74,74,54,54,74,74,74,54,2,48,48],
            [48,48,2,54,74,74,74,74,74,74,74,74,54,2,48,48],
            [48,48,2,54,74,74,74,74,74,74,74,74,54,2,48,48],
            [48,48,2,54,54,74,74,74,74,74,74,54,54,2,48,48],
            [48,48,2,54,54,54,54,13,13,54,54,54,54,2,48,48],
            [48,48,2,2,2,2,2,4,4,2,2,2,2,2,48,48],
            [48,48,48,48,48,48,48,48,48,48,48,48,48,48,46,46],
            [48,48,48,48,48,48,48,48,48,48,48,48,48,48,46,46]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,4,4,3,3,3,3,3,3,3],
            [3,3,3,9,9,9,9,4,4,9,9,9,9,3,3,3],
            [3,3,3,9,11,4,4,4,4,4,4,11,9,3,3,3],
            [3,3,3,9,4,4,4,4,4,4,4,4,9,3,3,3],
            [3,3,3,9,4,4,4,4,4,4,4,4,9,3,3,3],
            [3,3,3,9,4,4,4,14,14,4,4,4,9,3,3,3],
            [3,3,3,9,4,4,4,14,14,4,4,4,9,3,3,3],
            [3,3,3,9,4,4,4,4,4,4,4,4,9,3,3,3],
            [3,3,3,9,4,4,4,4,4,4,4,4,9,3,3,3],
            [3,3,3,9,11,4,4,4,4,4,4,11,11,3,3,3],
            [3,3,3,9,9,9,9,4,4,9,9,11,11,3,3,3],
            [3,3,3,3,3,3,3,4,4,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:14,tid:54}],[{z:0,tid:19},{z:14,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:14,tid:54}],[{z:0,tid:19},{z:14,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:11,tid:54}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}]]
        ],
        objects: [
            [[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":0,"y":2}],"2":[{"x":15,"y":15},{"x":14,"y":15},{"x":15,"y":14},{"x":14,"y":14},{"x":13,"y":15},{"x":15,"y":13}]},
        sanctuaryZones: [[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2]]
    },
    prebuilt_volcanic_rift: {
        name: 'Volcanic Rift', w: 12, h: 12,
        grid: [
            [10,10,11,17,63,63,63,63,63,63,63,63],
            [11,10,10,11,17,63,63,63,63,63,63,63],
            [11,11,10,10,11,17,63,63,63,63,63,63],
            [17,11,11,10,10,4,17,63,63,63,63,63],
            [63,17,11,11,10,10,11,17,63,63,63,63],
            [63,63,17,11,11,10,10,11,17,63,63,63],
            [63,63,63,17,11,11,10,10,11,17,63,63],
            [63,63,63,63,17,11,11,10,10,11,17,63],
            [63,63,63,63,63,17,4,11,10,10,11,17],
            [63,63,63,63,63,63,17,11,11,10,10,11],
            [63,63,63,63,63,63,63,17,11,11,10,10],
            [63,63,63,63,63,63,63,63,17,11,11,10]
        ],
        heightMap: [
            [3,3,5,7,9,10,10,10,10,10,10,10],
            [5,3,3,5,7,9,10,10,10,10,10,10],
            [6,5,3,3,5,7,9,10,10,10,10,10],
            [8,6,5,3,3,5,7,9,10,10,10,10],
            [10,8,6,5,3,3,5,7,9,10,10,10],
            [10,10,8,6,5,3,3,5,7,9,10,10],
            [10,10,10,8,6,5,3,3,5,7,9,10],
            [10,10,10,10,8,6,5,3,3,5,7,9],
            [10,10,10,10,10,8,6,5,3,3,5,7],
            [10,10,10,10,10,10,8,6,5,3,3,5],
            [10,10,10,10,10,10,10,8,6,5,3,3],
            [10,10,10,10,10,10,10,10,8,6,5,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:4}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:10,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}],[{z:0,tid:19},{z:9,tid:63}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:4}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:7,tid:17}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:10,tid:63}],[{z:0,tid:19},{z:8,tid:17}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":8},{"x":0,"y":9},{"x":1,"y":9},{"x":1,"y":10}],"2":[{"x":11,"y":1},{"x":11,"y":2},{"x":10,"y":2},{"x":10,"y":1}]}
    },
    prebuilt_babel: {
        name: 'Ruins of Babel', w: 20, h: 20,
        grid: [
            [46,46,46,58,74,74,74,74,58,74,74,74,74,74,74,74,74,74,74,74],
            [46,46,46,54,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [46,46,46,54,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,54,54,48,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,74,74,74,74,74,74,58,74,74,74,74,74,74,74,74,74,74,74,74],
            [74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
            [74,54,54,54,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,54,54,54,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,54,54,54,74,74,54,54,13,13,13,13,54,54,74,74,54,54,54,74],
            [74,74,74,74,74,74,74,74,13,17,17,13,74,74,74,74,74,74,74,74],
            [74,74,74,74,74,74,74,74,13,17,17,13,74,74,74,74,74,74,74,74],
            [74,54,54,54,74,74,54,54,13,13,13,13,54,54,74,74,54,54,54,74],
            [74,54,54,54,74,74,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,54,54,54,74,58,54,54,54,74,74,54,54,54,74,74,54,54,54,74],
            [74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
            [74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74],
            [74,54,54,54,74,74,54,54,54,74,74,54,54,54,74,74,48,54,54,74],
            [58,54,54,54,74,74,54,54,54,74,74,54,54,54,74,74,54,46,46,46],
            [74,54,54,54,74,74,54,54,54,74,74,54,54,54,58,74,54,46,46,46],
            [74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,74,58,46,46,46]
        ],
        heightMap: [
            [3,3,3,5,5,3,3,3,4,3,3,3,3,3,3,3,3,3,3,3],
            [3,5,7,5,5,3,10,5,6,3,3,5,9,5,3,3,10,10,5,3],
            [4,9,7,9,9,3,5,6,5,3,3,7,7,7,3,3,5,6,5,3],
            [3,9,7,9,9,3,7,7,5,3,3,9,7,9,3,3,7,9,7,3],
            [3,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,7,9,10,3,3,9,7,5,3,3,9,9,7,3,3,5,5,7,3],
            [3,7,9,9,3,3,7,9,7,3,3,7,9,7,3,3,5,9,5,3],
            [3,9,9,7,3,3,5,7,3,3,3,3,9,7,3,3,7,7,5,3],
            [3,3,3,3,3,3,3,3,3,16,16,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,16,16,3,3,3,3,3,3,3,3,3],
            [3,5,7,9,3,3,9,8,3,3,3,3,5,7,3,3,7,5,5,3],
            [3,7,7,7,3,3,10,6,9,3,3,10,6,9,3,3,5,9,7,3],
            [3,7,7,5,3,4,10,9,7,3,3,5,7,9,3,3,5,7,9,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,9,9,3],
            [3,5,7,7,3,3,7,9,7,3,3,7,7,5,3,5,5,9,9,3],
            [4,6,8,9,3,3,5,7,7,3,3,9,9,7,3,5,5,9,9,3],
            [3,5,7,7,3,3,7,5,5,3,3,9,7,5,4,3,6,8,7,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:58}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:5,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:4,tid:46}],[{z:0,tid:19},{z:9,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:48}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:16,tid:17}],[{z:0,tid:19},{z:16,tid:17}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:16,tid:17}],[{z:0,tid:19},{z:16,tid:17}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:10,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:9,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:8,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:9,tid:46}],[{z:0,tid:19},{z:9,tid:46}],[{z:0,tid:19},{z:3,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:9,tid:54}],[{z:0,tid:19},{z:7,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:8,tid:46}],[{z:0,tid:19},{z:7,tid:46}],[{z:0,tid:19},{z:3,tid:46}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:58}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}],[{z:0,tid:19},{z:3,tid:46}]]
        ],
        objects: [
            [[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":0,"y":2}],"2":[{"x":19,"y":19},{"x":18,"y":19},{"x":19,"y":18},{"x":18,"y":18},{"x":17,"y":19},{"x":19,"y":17}]},
        sanctuaryZones: [[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2]]
    },
    prebuilt_archipelago: {
        name: 'Archipelago', w: 16, h: 16,
        grid: [
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,4,13,13,13,13,4,48,48,48,48,2],
            [2,2,2,2,2,13,4,13,13,4,2,2,2,2,2,2],
            [2,2,2,2,2,13,13,5,13,13,2,2,2,2,2,2],
            [48,48,48,48,48,13,13,13,13,13,48,48,48,48,48,2],
            [48,48,48,48,48,13,4,13,13,4,48,48,48,48,48,2],
            [48,48,48,48,48,4,2,2,48,48,4,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [48,48,48,48,48,48,2,2,48,48,48,48,48,48,48,2],
            [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,4,4,4,3,3,3,3,3,3,4,4,4,3,3,3],
            [3,4,6,4,3,3,3,3,3,3,4,6,4,3,3,3],
            [3,4,4,4,3,3,3,3,3,3,4,4,4,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,4,5,5,5,5,4,3,3,3,3,3],
            [3,3,3,3,3,5,4,6,6,4,3,3,3,3,3,3],
            [3,3,3,3,3,5,6,8,7,5,3,3,3,3,3,3],
            [3,3,3,3,3,5,6,7,7,5,3,3,3,3,3,3],
            [3,3,3,3,3,5,4,5,5,4,3,3,3,3,3,3],
            [3,4,4,4,3,4,3,3,3,3,4,4,4,3,3,3],
            [3,4,6,4,3,3,3,3,3,3,4,6,4,3,3,3],
            [3,4,4,4,3,3,3,3,3,3,4,4,4,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:8,tid:5}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:35,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":1,"y":1},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"2":[{"x":13,"y":13},{"x":12,"y":13},{"x":13,"y":12},{"x":12,"y":12}]}
    },
    prebuilt_dark_forest: {
        name: 'Dark Forest', w: 10, h: 10,
        grid: [
            [70,70,50,50,48,48,50,50,70,70],
            [70,50,50,48,48,48,48,50,50,70],
            [50,50,48,48,13,13,48,48,50,50],
            [50,48,48,13,13,13,13,48,48,50],
            [48,48,13,13,18,18,13,13,48,48],
            [48,48,13,13,18,18,13,13,48,48],
            [50,48,48,13,13,13,13,48,48,50],
            [50,50,48,48,13,13,48,48,50,50],
            [70,50,50,48,48,48,48,50,50,70],
            [70,70,50,50,48,48,50,50,70,70]
        ],
        heightMap: [
            [7,7,6,6,4,4,6,6,7,7],
            [7,6,6,4,4,4,4,6,6,7],
            [6,6,4,4,3,3,4,4,6,6],
            [6,4,4,3,3,3,3,4,4,6],
            [4,4,3,3,3,3,3,3,4,4],
            [4,4,3,3,3,3,3,3,4,4],
            [6,4,4,3,3,3,3,4,4,6],
            [6,6,4,4,3,3,4,4,6,6],
            [7,6,6,4,4,4,4,6,6,7],
            [7,7,6,6,4,4,6,6,7,7]
        ],
        voxels: [
            [[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:7,tid:70}]],
            [[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:70}]],
            [[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}]],
            [[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}]],
            [[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}]],
            [[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}]],
            [[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:3,tid:13}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}]],
            [[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:70}]],
            [[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:6,tid:50}],[{z:0,tid:19},{z:7,tid:70}],[{z:0,tid:19},{z:7,tid:70}]]
        ],
        objects: [
            [[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}]],
            [[],[{oid:38,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:38,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[]],
            [[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1}],"2":[{"x":8,"y":9},{"x":9,"y":9},{"x":8,"y":8},{"x":9,"y":8}]}
    },
    prebuilt_skybridge: {
        name: 'Skybridge', w: 20, h: 20,
        grid: [
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,4,48,48,48,48,72,72,4,72,72,72,72,72,72],
            [48,48,48,48,48,48,48,4,48,48,48,48,4,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,48,13,13,13,13,48,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,48,13,17,17,13,48,48,48,48,48,48,48,48],
            [48,48,48,48,48,48,48,48,13,17,17,13,48,48,48,48,48,48,48,48],
            [72,72,72,72,72,72,72,48,13,13,13,13,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,4,48,48,48,72,4,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,4,48,48,48,48,72,72,4,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72],
            [72,72,72,72,72,72,72,48,48,48,48,72,72,72,72,72,72,72,72,72]
        ],
        heightMap: [
            [9,9,9,10,10,7,5,3,3,3,3,5,7,9,9,9,9,9,7,6],
            [9,10,10,10,10,7,5,3,3,3,3,5,7,9,10,10,10,9,7,6],
            [9,10,11,11,9,7,5,3,3,3,3,5,7,9,10,11,10,9,7,6],
            [9,10,11,11,9,7,5,3,3,3,3,5,7,9,10,10,10,9,7,6],
            [9,9,9,9,9,7,5,3,3,3,3,5,7,9,9,9,9,9,7,6],
            [7,7,7,7,7,7,5,3,3,3,3,5,7,7,7,7,7,7,7,6],
            [5,5,5,5,5,5,7,3,3,3,3,5,6,7,5,5,5,5,5,5],
            [3,3,3,3,3,3,3,9,3,3,3,3,8,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,14,14,14,14,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,14,20,20,14,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,14,20,20,14,3,3,3,3,3,3,3,3],
            [5,5,5,5,5,5,5,3,14,14,14,14,5,5,5,5,5,5,5,5],
            [7,7,7,7,7,7,6,8,3,3,3,5,7,7,7,7,7,7,7,6],
            [9,9,9,9,9,7,7,3,3,3,3,5,7,9,9,9,9,9,7,6],
            [9,10,10,10,9,7,5,3,3,3,3,5,7,9,10,10,10,9,7,6],
            [9,10,11,10,9,7,5,3,3,3,3,5,7,9,10,11,10,9,9,6],
            [9,10,10,10,9,7,5,3,3,3,3,5,7,9,10,10,10,9,9,6],
            [9,9,9,9,9,7,5,3,3,3,3,5,7,9,9,10,10,9,7,6],
            [7,7,7,7,7,7,5,3,3,3,3,5,7,7,7,7,7,7,7,6],
            [6,6,6,6,6,6,5,3,3,3,3,5,6,6,6,6,6,6,6,6]
        ],
        voxels: [
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:7,tid:4}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:9,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:8,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:20,tid:17}],[{z:0,tid:19},{z:20,tid:17}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:20,tid:17}],[{z:0,tid:19},{z:20,tid:17}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}]],
            [[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:14,tid:13}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:5,tid:72}]],
            [[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:8,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:4}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:4}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:4}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:11,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:10,tid:72}],[{z:0,tid:19},{z:9,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:7,tid:72}],[{z:0,tid:19},{z:6,tid:72}]],
            [[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}],[{z:0,tid:19},{z:6,tid:72}]]
        ],
        objects: [
            [[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:3,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[{oid:4,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":0},{"x":0,"y":2},{"x":2,"y":1},{"x":1,"y":2}],"2":[{"x":19,"y":19},{"x":18,"y":19},{"x":19,"y":18},{"x":18,"y":18},{"x":17,"y":19},{"x":19,"y":17},{"x":17,"y":18},{"x":18,"y":17}]},
        sanctuaryZones: [[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2]]
    },
    prebuilt_toxic_marsh: {
        name: 'Toxic Marsh', w: 12, h: 12,
        grid: [
            [73,52,52,73,52,52,73,52,52,73,52,52],
            [52,47,47,47,52,73,52,52,47,47,47,73],
            [52,47,47,13,13,52,52,73,47,47,47,52],
            [73,47,13,47,52,52,73,52,47,47,47,52],
            [52,52,13,52,47,47,47,52,73,52,52,73],
            [52,73,52,52,47,47,47,47,52,52,73,52],
            [73,52,52,73,47,47,47,47,52,73,52,52],
            [52,52,73,52,52,47,47,47,73,13,52,73],
            [52,47,47,47,73,52,52,73,47,13,47,52],
            [73,47,47,47,52,52,73,13,13,47,47,52],
            [52,47,47,47,52,73,52,52,47,47,47,73],
            [52,73,52,52,73,52,52,73,52,52,73,52]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3],
            [3,4,4,4,3,4,3,3,4,4,4,3],
            [3,4,4,4,4,3,3,4,4,4,4,3],
            [3,4,4,5,3,3,5,3,5,4,4,3],
            [3,3,4,3,5,5,5,3,5,3,3,3],
            [3,4,3,3,5,7,7,5,3,3,4,3],
            [3,3,3,5,5,7,7,5,3,4,3,3],
            [3,3,4,3,3,5,5,6,5,4,3,3],
            [3,4,4,5,5,3,3,5,5,4,4,3],
            [3,4,4,4,3,3,4,4,4,4,4,3],
            [3,4,4,4,3,4,3,3,4,4,4,3],
            [3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:7,tid:47}],[{z:0,tid:19},{z:7,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:7,tid:47}],[{z:0,tid:19},{z:7,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:6,tid:47}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:5,tid:19}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:3,tid:19}]],
            [[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:52}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:52}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:37,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":1,"y":1},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":2}],"2":[{"x":9,"y":10},{"x":10,"y":10},{"x":9,"y":9},{"x":10,"y":9}]}
    },
    prebuilt_temple_ruins: {
        name: 'Temple Ruins', w: 10, h: 10,
        grid: [
            [50,50,50,50,50,50,50,50,50,50],
            [50,48,48,48,35,48,48,48,48,50],
            [50,48,48,48,15,48,48,48,48,50],
            [50,48,48,54,54,54,54,48,48,50],
            [50,48,48,54,18,18,54,15,15,50],
            [50,15,15,54,18,18,54,48,48,50],
            [50,48,48,54,54,54,54,48,48,50],
            [50,48,48,48,48,15,48,48,48,50],
            [50,48,48,48,48,15,48,48,48,50],
            [50,50,50,50,50,50,50,50,50,50]
        ],
        heightMap: [
            [4,4,4,4,4,4,4,4,4,4],
            [4,3,3,3,3,3,3,3,3,4],
            [4,3,3,3,4,3,3,3,3,4],
            [4,3,3,5,6,5,5,3,3,4],
            [4,3,3,5,7,7,6,4,4,4],
            [4,4,4,6,7,7,5,3,3,4],
            [4,3,3,5,5,6,5,3,3,4],
            [4,3,3,3,3,4,3,3,3,4],
            [4,3,3,3,3,4,3,3,3,4],
            [4,4,4,4,4,4,4,4,4,4]
        ],
        voxels: [
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:35}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:7,tid:18}],[{z:0,tid:19},{z:7,tid:18}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:7,tid:18}],[{z:0,tid:19},{z:7,tid:18}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:6,tid:54}],[{z:0,tid:19},{z:5,tid:54}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:15}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:3,tid:48}],[{z:0,tid:19},{z:4,tid:50}]],
            [[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}],[{z:0,tid:19},{z:4,tid:50}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:44,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:45,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":8,"y":8},{"x":9,"y":9},{"x":8,"y":9},{"x":9,"y":8}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1}]},
        sanctuaryZones: [[2,2,2,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,1,1,1]]
    },
    prebuilt_wasteland: {
        name: 'Wasteland', w: 14, h: 14,
        grid: [
            [10,11,11,11,11,11,11,11,11,11,11,11,11,11],
            [11,10,11,11,11,11,11,8,11,11,11,11,11,11],
            [11,11,10,11,11,58,11,11,11,11,11,11,11,11],
            [11,11,11,74,74,11,11,11,11,58,11,11,11,11],
            [11,11,11,74,74,11,11,11,11,11,11,11,11,11],
            [11,11,58,11,11,10,11,11,11,11,11,11,11,11],
            [11,8,11,11,11,11,10,11,11,11,11,11,8,11],
            [11,11,13,13,13,13,13,13,13,13,13,13,11,11],
            [11,11,11,11,11,11,11,11,10,11,11,11,11,11],
            [11,11,11,11,11,11,58,11,11,74,74,11,11,11],
            [11,11,11,11,58,11,11,11,11,74,74,11,11,11],
            [11,11,11,11,11,11,11,11,58,11,11,10,11,11],
            [11,11,11,11,11,11,8,11,11,11,11,11,10,11],
            [11,11,11,11,11,11,11,11,11,11,11,11,11,10]
        ],
        heightMap: [
            [3,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,3,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,3,4,4,6,4,4,4,4,4,4,4,4],
            [4,4,4,6,6,4,4,4,4,6,4,4,4,4],
            [4,4,4,6,6,4,4,4,4,4,4,4,4,4],
            [4,4,6,4,4,3,4,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,3,4,4,6,6,4,4,4],
            [4,4,6,6,6,6,5,6,5,6,6,6,4,4],
            [4,4,4,4,4,4,4,4,3,4,4,4,4,4],
            [4,4,4,4,4,4,6,6,4,6,6,4,4,4],
            [4,4,4,4,6,4,6,6,4,6,6,4,4,4],
            [4,4,4,4,4,4,4,4,6,4,4,3,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,3,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:8}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:8}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:8}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:58}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:8}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}]]
        ],
        objects: [
            [[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":12,"y":12},{"x":13,"y":13},{"x":12,"y":13},{"x":13,"y":12},{"x":11,"y":13},{"x":13,"y":11}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":2,"y":0},{"x":0,"y":2}]},
        sanctuaryZones: [[2,2,2,0,0,0,0,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0,0,0,0,0],[2,2,2,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,1,1,1]]
    },
    prebuilt_frozen_citadel: {
        name: 'Frozen Citadel', w: 12, h: 12,
        grid: [
            [9,9,9,9,9,9,9,9,9,9,9,9],
            [9,9,9,9,9,9,9,9,9,9,9,9],
            [9,9,3,3,3,4,4,3,3,3,9,9],
            [9,9,3,15,15,15,15,15,15,3,9,9],
            [9,9,3,15,15,15,15,15,15,3,9,9],
            [9,9,4,15,15,17,17,15,15,4,9,9],
            [9,9,4,15,15,17,17,15,15,4,9,9],
            [9,9,3,15,15,15,15,15,15,3,9,9],
            [9,9,3,15,15,15,15,15,15,3,9,9],
            [9,9,3,3,3,4,4,3,3,3,9,9],
            [9,9,9,9,9,9,9,9,9,9,9,9],
            [9,9,9,9,9,9,9,9,9,9,9,9]
        ],
        heightMap: [
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,3,3,3,4,4,3,3,3,4,4],
            [4,4,3,7,7,6,6,7,7,3,4,4],
            [4,4,3,7,7,7,7,7,7,3,4,4],
            [4,4,4,6,7,11,11,7,6,4,4,4],
            [4,4,4,6,7,11,11,7,6,4,4,4],
            [4,4,3,7,7,7,7,7,7,3,4,4],
            [4,4,3,7,7,6,6,7,7,3,4,4],
            [4,4,3,3,3,4,4,3,3,3,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4]
        ],
        voxels: [
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:11,tid:17}],[{z:0,tid:19},{z:11,tid:17}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:11,tid:17}],[{z:0,tid:19},{z:11,tid:17}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:7,tid:15}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]],
            [[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}],[{z:0,tid:19},{z:4,tid:9}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":10,"y":10},{"x":11,"y":11},{"x":10,"y":11},{"x":11,"y":10}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1}]},
        sanctuaryZones: [[2,2,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,1,1]]
    },
    prebuilt_mushroom_grove: {
        name: 'Mushroom Grove', w: 8, h: 8,
        grid: [
            [73,73,73,73,73,73,73,73],
            [73,47,47,16,16,47,47,73],
            [73,47,16,47,47,16,47,73],
            [73,16,47,52,52,47,16,73],
            [73,16,47,52,52,47,16,73],
            [73,47,16,47,47,16,47,73],
            [73,47,47,16,16,47,47,73],
            [73,73,73,73,73,73,73,73]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3],
            [4,4,4,4,4,4,4,4],
            [5,5,5,5,5,5,5,5],
            [6,6,5,3,3,5,6,6],
            [6,6,5,3,3,5,6,6],
            [5,5,5,5,5,5,5,5],
            [4,4,4,4,4,4,4,4],
            [3,3,3,3,3,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:4,tid:10}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:16}],[{z:0,tid:19},{z:4,tid:16}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:10}]],
            [[{z:0,tid:19},{z:5,tid:10}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:10}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:6,tid:10}]],
            [[{z:0,tid:19},{z:6,tid:10}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:6,tid:10}]],
            [[{z:0,tid:19},{z:5,tid:10}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:16}],[{z:0,tid:19},{z:5,tid:47}],[{z:0,tid:19},{z:5,tid:10}]],
            [[{z:0,tid:19},{z:4,tid:10}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:16}],[{z:0,tid:19},{z:4,tid:16}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:47}],[{z:0,tid:19},{z:4,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:34,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":6,"y":6},{"x":7,"y":7},{"x":6,"y":7}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0}]},
        sanctuaryZones: [[2,2,0,0,0,0,0,0],[2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1],[0,0,0,0,0,0,1,1]]
    },
    prebuilt_canyon: {
        name: 'Canyon', w: 18, h: 10,
        grid: [
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
            [63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63,63],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [6,6,65,6,6,6,6,65,6,6,6,18,6,6,6,65,6,6],
            [2,2,2,2,4,2,2,2,2,4,2,2,2,4,2,2,2,2],
            [2,2,2,2,4,2,2,2,2,4,2,2,2,4,2,2,2,2],
            [6,6,65,6,6,6,18,6,6,6,65,6,6,6,6,65,6,6],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64],
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]
        ],
        heightMap: [
            [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,6,4,4,4,4,6,4,4,4,5,4,4,4,6,4,4],
            [3,3,3,3,4,3,3,3,3,4,3,3,3,4,3,3,3,3],
            [3,3,3,3,4,3,3,3,3,4,3,3,3,4,3,3,3,3],
            [4,4,6,4,4,4,5,4,4,4,6,4,4,4,4,6,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11]
        ],
        voxels: [
            [[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}]],
            [[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}],[{z:0,tid:19},{z:6,tid:63}]],
            [[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}]],
            [[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:18}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:5,tid:18}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:6,tid:65}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}]],
            [[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}],[{z:0,tid:19},{z:4,tid:6}]],
            [[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}],[{z:0,tid:19},{z:6,tid:64}]],
            [[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}],[{z:0,tid:19},{z:11,tid:5}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":16,"y":6},{"x":17,"y":7},{"x":16,"y":7},{"x":17,"y":6},{"x":16,"y":5},{"x":17,"y":5}],"2":[{"x":1,"y":3},{"x":0,"y":2},{"x":1,"y":2},{"x":0,"y":3},{"x":1,"y":4},{"x":0,"y":4}]},
        sanctuaryZones: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]
    },
    prebuilt_obsidian_spire: {
        name: 'Obsidian Spire', w: 10, h: 10,
        grid: [
            [11,11,10,10,17,17,10,10,11,11],
            [11,11,10,10,17,17,10,10,11,11],
            [10,10,10,10,17,17,10,10,10,10],
            [10,10,10,17,17,17,17,10,10,10],
            [17,17,17,17,15,15,17,17,17,17],
            [17,17,17,17,15,15,17,17,17,17],
            [10,10,10,17,17,17,17,10,10,10],
            [10,10,10,10,17,17,10,10,10,10],
            [11,11,10,10,17,17,10,10,11,11],
            [11,11,10,10,17,17,10,10,11,11]
        ],
        heightMap: [
            [4,4,3,3,5,5,3,3,4,4],
            [4,4,3,3,5,5,3,3,4,4],
            [3,3,3,3,5,5,3,3,3,3],
            [3,3,3,10,10,10,10,3,3,3],
            [5,5,5,10,14,14,10,5,5,5],
            [5,5,5,10,14,14,10,5,5,5],
            [3,3,3,10,10,10,10,3,3,3],
            [3,3,3,3,5,5,3,3,3,3],
            [4,4,3,3,5,5,3,3,4,4],
            [4,4,3,3,5,5,3,3,4,4]
        ],
        voxels: [
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:14,tid:15}],[{z:0,tid:19},{z:14,tid:15}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}]],
            [[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:14,tid:15}],[{z:0,tid:19},{z:14,tid:15}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:10,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:5,tid:17}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":8,"y":8},{"x":9,"y":9},{"x":8,"y":9},{"x":9,"y":8}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1}]},
        sanctuaryZones: [[2,2,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,1,1]]
    },
    prebuilt_village_siege: {
        name: 'Village Siege', w: 16, h: 12,
        grid: [
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,10,11,11,11,11,11],
            [53,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
            [53,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,10,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,10,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11],
            [53,48,48,48,48,48,48,13,13,11,11,11,11,11,11,11]
        ],
        heightMap: [
            [6,4,4,4,4,4,6,6,6,6,4,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,6,4,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,4,4,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,4,4,4,4,4,4,4],
            [6,4,6,6,4,4,6,6,6,4,3,4,6,6,6,6],
            [7,6,6,6,6,6,6,6,6,6,5,6,6,6,6,6],
            [7,6,6,6,6,6,6,6,6,6,6,6,6,5,6,6],
            [6,4,4,4,6,6,6,6,6,4,6,6,4,3,6,6],
            [6,4,4,4,4,4,6,6,6,4,4,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,4,3,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,6,4,4,4,4,4,4],
            [6,4,4,4,4,4,6,6,6,6,4,4,4,4,4,4]
        ],
        voxels: [
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}]],
            [[{z:0,tid:19},{z:7,tid:53}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}]],
            [[{z:0,tid:19},{z:7,tid:53}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:6,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:6,tid:53}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:4,tid:48}],[{z:0,tid:19},{z:6,tid:48}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:13}],[{z:0,tid:19},{z:6,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]]
        ],
        objects: [
            [[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[]],
            [[],[{oid:1,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:34,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:3,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[]],
            [[],[{oid:36,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:38,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":1,"y":0},{"x":2,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":0,"y":0},{"x":0,"y":1}],"2":[{"x":14,"y":11},{"x":13,"y":11},{"x":14,"y":10},{"x":13,"y":10},{"x":15,"y":11},{"x":15,"y":10}]},
        sanctuaryZones: [[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2]]
    },
    prebuilt_crystal_cavern: {
        name: 'Crystal Cavern', w: 12, h: 8,
        grid: [
            [63,63,63,63,63,63,63,63,63,63,63,63],
            [19,19,19,15,19,19,19,19,15,19,19,19],
            [19,16,19,19,19,15,19,19,19,19,19,19],
            [19,19,15,2,2,4,2,2,4,15,19,19],
            [19,19,19,2,2,4,2,2,4,19,19,19],
            [19,19,19,15,19,19,19,19,15,19,16,19],
            [19,19,19,19,19,15,19,19,19,19,15,19],
            [64,64,64,64,64,64,64,64,64,64,64,64]
        ],
        heightMap: [
            [9,9,9,8,9,9,9,9,8,9,9,9],
            [4,4,4,6,4,4,4,4,6,4,4,4],
            [4,6,4,4,4,6,4,4,4,4,4,4],
            [4,4,6,3,3,4,3,3,4,6,4,4],
            [4,4,4,3,3,4,3,3,4,4,4,4],
            [4,4,4,6,4,4,4,4,6,4,6,4],
            [4,4,4,4,4,6,4,4,4,4,6,4],
            [9,9,9,9,9,8,9,9,9,9,8,9]
        ],
        voxels: [
            [[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:8,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:8,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}],[{z:0,tid:19},{z:9,tid:63}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:3,tid:19}],[{z:0,tid:19},{z:4,tid:4}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:16}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:4,tid:19}],[{z:0,tid:19},{z:6,tid:15}],[{z:0,tid:19},{z:4,tid:19}]],
            [[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:8,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:9,tid:64}],[{z:0,tid:19},{z:8,tid:64}],[{z:0,tid:19},{z:9,tid:64}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:17,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:18,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":1},{"x":1,"y":1},{"x":0,"y":2},{"x":1,"y":2}],"2":[{"x":11,"y":6},{"x":10,"y":6},{"x":11,"y":5},{"x":10,"y":5}]},
        sanctuaryZones: [[0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,2,2],[0,0,0,0,0,0,0,0,0,0,0,0]]
    },
    prebuilt_divided_city: {
        name: 'Divided City', w: 20, h: 14,
        grid: [
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,48,48,2,2,48,48,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,48,48,2,2,48,48,13,74,74,13,74,74,74],
            [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74],
            [74,74,74,13,74,74,13,74,74,2,2,74,74,13,74,74,13,74,74,74]
        ],
        heightMap: [
            [3,3,3,4,4,4,4,4,4,3,3,4,4,4,4,4,4,4,4,3],
            [4,4,4,4,4,4,4,4,4,3,3,4,4,4,4,4,4,4,4,4],
            [5,5,5,5,5,5,5,5,5,3,3,5,5,5,5,5,5,5,5,5],
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
            [6,7,7,7,7,7,7,6,5,3,3,5,6,7,7,7,7,7,7,6],
            [7,7,7,7,7,7,7,7,5,3,3,5,7,7,7,7,7,7,7,7],
            [8,8,8,8,8,8,8,8,8,3,3,8,8,8,8,8,8,8,8,8],
            [8,8,8,8,8,8,8,8,8,5,5,8,8,8,8,8,8,8,8,8],
            [7,7,7,7,7,7,7,7,7,3,3,7,7,7,7,7,7,7,7,7],
            [6,7,7,7,7,7,7,7,7,3,3,7,7,7,7,7,7,7,7,6],
            [5,5,5,5,5,5,5,5,5,3,3,5,5,5,5,5,5,5,5,5],
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
            [4,4,4,4,4,4,4,4,4,3,3,4,4,4,4,4,4,4,4,4],
            [3,4,4,4,4,4,4,4,4,3,3,4,4,4,4,4,4,3,3,3]
        ],
        voxels: [
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:3,tid:74}]],
            [[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}]],
            [[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}]],
            [[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:48}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:48}],[{z:0,tid:19},{z:7,tid:48}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}]],
            [[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:48}],[{z:0,tid:19},{z:8,tid:48}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:8,tid:48}],[{z:0,tid:19},{z:8,tid:48}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}],[{z:0,tid:19},{z:8,tid:74}]],
            [[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}],[{z:0,tid:19},{z:8,tid:13}]],
            [[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}]],
            [[{z:0,tid:19},{z:6,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:13}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:7,tid:74}],[{z:0,tid:19},{z:6,tid:74}]],
            [[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}],[{z:0,tid:19},{z:5,tid:74}]],
            [[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}],[{z:0,tid:19},{z:5,tid:13}]],
            [[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}]],
            [[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:74}],[{z:0,tid:19},{z:4,tid:13}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}],[{z:0,tid:19},{z:3,tid:74}]]
        ],
        objects: [
            [[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[{oid:1,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[{oid:34,alignX:'center',alignY:'bottom',rot:0,flipX:false,flipY:false}],[],[],[],[],[],[],[]],
            [[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:28,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":0,"y":2},{"x":1,"y":2}],"2":[{"x":19,"y":13},{"x":18,"y":13},{"x":17,"y":13},{"x":19,"y":12},{"x":18,"y":12},{"x":17,"y":12},{"x":19,"y":11},{"x":18,"y":11}]},
        sanctuaryZones: [[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2]]
    },
    prebuilt_caldera_summit: {
        name: 'Caldera Summit', w: 14, h: 14,
        grid: [
            [11,11,10,10,10,10,10,10,10,10,10,10,10,10],
            [11,11,11,11,11,11,11,11,11,11,11,11,11,10],
            [10,11,63,63,63,63,18,13,63,63,63,63,11,10],
            [10,11,63,63,63,63,13,13,63,63,63,63,11,10],
            [10,11,63,63,17,17,13,13,17,17,63,63,11,10],
            [10,11,63,63,17,17,17,17,17,17,63,63,11,10],
            [10,11,18,13,13,17,15,15,17,13,13,13,11,10],
            [10,11,13,13,13,17,15,15,17,13,13,18,11,10],
            [10,11,63,63,17,17,17,17,17,17,63,63,11,10],
            [10,11,63,63,17,17,13,13,17,17,63,63,11,10],
            [10,11,63,63,63,63,13,13,63,63,63,63,11,10],
            [10,11,63,63,63,63,13,18,63,63,63,63,11,10],
            [10,11,11,11,11,11,11,11,11,11,11,11,11,11],
            [10,10,10,10,10,10,10,10,10,10,10,10,11,11]
        ],
        heightMap: [
            [4,4,3,3,3,3,3,3,3,3,3,3,3,3],
            [4,4,5,5,5,5,5,5,5,5,5,5,5,3],
            [3,5,13,13,13,12,10,10,12,13,13,13,5,3],
            [3,5,13,11,11,11,11,11,11,11,11,13,5,3],
            [3,5,13,11,13,13,13,13,13,13,11,13,5,3],
            [3,5,12,11,13,14,14,14,14,13,11,12,5,3],
            [3,5,10,11,13,14,20,20,14,13,11,10,5,3],
            [3,5,10,11,13,14,20,20,14,13,11,10,5,3],
            [3,5,12,11,13,14,14,14,14,13,11,12,5,3],
            [3,5,13,11,13,13,13,13,13,13,11,13,5,3],
            [3,5,13,11,11,11,11,11,11,11,11,13,5,3],
            [3,5,13,13,13,12,10,10,12,13,13,13,5,3],
            [3,5,5,5,5,5,5,5,5,5,5,5,4,4],
            [3,3,3,3,3,3,3,3,3,3,3,3,4,4]
        ],
        voxels: [
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:10,tid:18}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:10,tid:18}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:20,tid:15}],[{z:0,tid:19},{z:20,tid:15}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:20,tid:15}],[{z:0,tid:19},{z:20,tid:15}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:10,tid:18}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:14,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:13,tid:13}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:13,tid:17}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:13}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:11,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:10,tid:13}],[{z:0,tid:19},{z:10,tid:18}],[{z:0,tid:19},{z:12,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:13,tid:63}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:3,tid:10}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:5,tid:11}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]],
            [[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:3,tid:10}],[{z:0,tid:19},{z:4,tid:11}],[{z:0,tid:19},{z:4,tid:11}]]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":12,"y":12},{"x":13,"y":13},{"x":12,"y":13},{"x":13,"y":12},{"x":12,"y":11},{"x":13,"y":11}],"2":[{"x":1,"y":1},{"x":0,"y":0},{"x":1,"y":0},{"x":0,"y":1},{"x":1,"y":2},{"x":0,"y":2}]},
        sanctuaryZones: [[2,2,0,0,0,0,0,0,0,0,0,0,0,0],[2,2,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,1,1]]
    },
    prebuilt_apartment: {
        name: 'Apartment', w: 4, h: 4,
        grid: [
            [54,74,74,54],
            [74,74,58,74],
            [74,58,74,74],
            [54,74,74,54]
        ],
        heightMap: [
            [3,3,3,3],
            [3,4,4,3],
            [3,4,4,3],
            [3,4,4,3]
        ],
        objects: [
            [[],[],[],[]],
            [[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[]],
            [[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":2},{"x":0,"y":3}],"2":[{"x":3,"y":0},{"x":3,"y":1}]}
    },
    prebuilt_suburb: {
        name: 'Suburb', w: 8, h: 8,
        grid: [
            [48,48,74,74,74,54,54,48],
            [48,74,74,13,13,74,54,48],
            [74,74,58,13,13,58,74,74],
            [74,13,13,74,74,13,13,74],
            [74,13,13,74,74,13,13,74],
            [74,74,58,13,13,59,74,74],
            [48,54,74,13,13,74,74,48],
            [48,54,54,74,74,74,48,48]
        ],
        heightMap: [
            [3,3,3,3,4,4,3,3],
            [4,4,4,4,4,4,4,4],
            [5,5,5,5,6,6,5,5],
            [6,6,6,6,6,6,6,6],
            [6,6,6,6,6,6,6,6],
            [6,6,6,6,6,6,5,5],
            [4,4,4,4,4,4,4,4],
            [3,3,4,4,3,3,3,3]
        ],
        objects: [
            [[{oid:36,alignX:'center',alignY:'bottom'}],[{oid:37,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:35,alignX:'center',alignY:'bottom'}]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[{oid:35,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:36,alignX:'center',alignY:'bottom'}],[{oid:37,alignX:'center',alignY:'bottom'}]]
        ],
        spawns: {"1":[{"x":0,"y":6},{"x":1,"y":6},{"x":0,"y":7},{"x":1,"y":7}],"2":[{"x":6,"y":0},{"x":7,"y":0},{"x":6,"y":1},{"x":7,"y":1}]}
    },
    prebuilt_rift_plaza: {
        name: 'Rift Plaza', w: 12, h: 12,
        grid: [
            [54,54,74,74,74,74,74,74,74,74,54,54],
            [54,74,74,13,13,74,74,13,13,74,74,54],
            [74,74,58,13,74,74,74,74,13,59,74,74],
            [74,13,13,74,74,15,15,74,74,13,13,74],
            [74,13,74,74,15,31,31,15,74,74,13,74],
            [74,74,74,15,31,15,15,31,15,74,74,74],
            [74,74,74,15,31,15,15,31,15,74,74,74],
            [74,13,74,74,15,31,31,15,74,74,13,74],
            [74,13,13,74,74,15,15,74,74,13,13,74],
            [74,74,60,13,74,74,74,74,13,58,74,74],
            [54,74,74,13,13,74,74,13,13,74,74,54],
            [54,54,74,74,74,74,74,74,74,74,54,54]
        ],
        heightMap: [
            [6,6,3,3,3,3,3,3,3,3,5,6],
            [6,6,3,3,3,3,3,3,3,3,3,5],
            [3,3,4,3,3,3,3,3,3,4,3,3],
            [3,3,3,4,4,4,4,3,3,3,3,3],
            [3,3,3,4,4,6,6,4,3,3,3,3],
            [3,3,3,4,6,7,7,6,4,3,3,3],
            [3,3,3,4,6,7,7,6,4,3,3,3],
            [3,3,3,3,4,6,6,4,3,3,3,3],
            [3,3,3,3,3,4,4,3,3,3,3,3],
            [3,3,4,3,3,3,3,3,3,4,3,3],
            [5,3,3,3,3,3,3,3,3,3,3,5],
            [6,5,3,3,3,3,3,3,3,3,5,6]
        ],
        objects: [
            [[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:23,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:25,alignX:'center',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[{oid:26,alignX:'center',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":9},{"x":1,"y":9},{"x":0,"y":10},{"x":1,"y":10},{"x":0,"y":11},{"x":1,"y":11}],"2":[{"x":10,"y":0},{"x":11,"y":0},{"x":10,"y":1},{"x":11,"y":1},{"x":10,"y":2},{"x":11,"y":2}]}
    },
    prebuilt_bunker: {
        name: 'Bunker', w: 8, h: 8,
        grid: [
            [20,20,19,19,19,19,20,20],
            [20,19,19,68,68,19,19,20],
            [19,19,19,19,19,19,19,19],
            [19,68,19,13,13,19,68,19],
            [19,68,19,13,13,19,68,19],
            [19,19,19,19,19,19,19,19],
            [20,19,19,68,68,19,19,20],
            [20,20,19,19,19,19,20,20]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3],
            [3,4,4,3,3,4,4,3],
            [5,5,5,5,5,5,5,5],
            [5,3,5,6,6,5,3,5],
            [5,3,5,6,6,5,3,5],
            [5,5,5,5,5,5,5,5],
            [3,4,4,3,3,4,4,3],
            [3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[]],
            [[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":6},{"x":1,"y":6},{"x":0,"y":7},{"x":1,"y":7}],"2":[{"x":6,"y":0},{"x":7,"y":0},{"x":6,"y":1},{"x":7,"y":1}]}
    },
    prebuilt_cavern: {
        name: 'Cavern', w: 12, h: 12,
        grid: [
            [20,20,20,19,19,19,19,19,19,20,20,20],
            [20,19,19,19,15,19,19,15,19,19,19,20],
            [20,19,19,19,19,19,19,19,19,19,19,20],
            [19,19,19,63,19,19,19,19,64,19,19,19],
            [19,15,19,19,19,2,2,19,19,19,15,19],
            [19,19,19,19,2,3,3,2,19,19,19,19],
            [19,19,19,19,2,3,3,2,19,19,19,19],
            [19,15,19,19,19,2,2,19,19,19,15,19],
            [19,19,19,65,19,19,19,19,63,19,19,19],
            [20,19,19,19,19,19,19,19,19,19,19,20],
            [20,19,19,19,15,19,19,15,19,19,19,20],
            [20,20,20,19,19,19,19,19,19,20,20,20]
        ],
        heightMap: [
            [9,8,8,6,6,4,4,6,6,8,8,9],
            [8,6,6,4,6,4,4,6,4,6,6,8],
            [8,6,4,4,4,4,4,4,4,4,6,8],
            [6,4,4,6,4,4,4,4,6,4,4,6],
            [6,6,4,4,4,3,3,4,4,4,6,6],
            [4,4,4,4,3,4,4,3,4,4,4,4],
            [4,4,4,4,3,4,4,3,4,4,4,4],
            [6,6,4,4,4,3,3,4,4,4,6,6],
            [6,4,4,6,4,4,4,4,6,4,4,6],
            [8,6,4,4,4,4,4,4,4,4,6,8],
            [8,6,6,4,6,4,4,6,4,6,6,8],
            [9,8,8,6,6,4,4,6,6,8,8,9]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":1,"y":9},{"x":2,"y":9},{"x":1,"y":10},{"x":2,"y":10},{"x":1,"y":11},{"x":2,"y":11}],"2":[{"x":9,"y":0},{"x":10,"y":0},{"x":9,"y":1},{"x":10,"y":1},{"x":9,"y":2},{"x":10,"y":2}]}
    },
    prebuilt_workshop: {
        name: 'Workshop', w: 12, h: 12,
        grid: [
            [63,63,15,63,63,15,15,63,63,15,63,63],
            [63,15,15,15,63,15,15,63,15,15,15,63],
            [15,15,63,15,15,15,15,15,15,63,15,15],
            [63,15,15,15,15,63,63,15,15,15,15,63],
            [63,63,15,15,15,15,15,15,15,15,63,63],
            [15,15,15,63,15,15,15,15,63,15,15,15],
            [15,15,15,63,15,15,15,15,63,15,15,15],
            [63,63,15,15,15,15,15,15,15,15,63,63],
            [63,15,15,15,15,63,63,15,15,15,15,63],
            [15,15,63,15,15,15,15,15,15,63,15,15],
            [63,15,15,15,63,15,15,63,15,15,15,63],
            [63,63,15,63,63,15,15,63,63,15,63,63]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [5,5,5,5,5,5,5,5,5,5,5,5],
            [6,6,6,6,6,6,6,6,6,6,6,6],
            [7,7,7,7,7,7,7,7,7,7,7,7],
            [7,7,7,7,7,7,7,7,7,7,7,7],
            [6,6,6,6,6,6,6,6,6,6,6,6],
            [5,5,5,5,5,5,5,5,5,5,5,5],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [4,4,4,4,4,4,4,4,4,4,4,4],
            [3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":9},{"x":1,"y":9},{"x":0,"y":10},{"x":1,"y":10},{"x":0,"y":11},{"x":1,"y":11}],"2":[{"x":10,"y":0},{"x":11,"y":0},{"x":10,"y":1},{"x":11,"y":1},{"x":10,"y":2},{"x":11,"y":2}]}
    },
    prebuilt_killbox: {
        name: 'Kill Box', w: 12, h: 12,
        grid: [
            [19,19,19,68,19,19,19,19,68,19,19,19],
            [19,74,74,19,74,74,74,74,19,74,74,19],
            [19,74,58,19,74,74,74,74,19,59,74,19],
            [68,19,19,19,19,74,74,19,19,19,19,68],
            [19,74,74,19,74,74,74,74,19,74,74,19],
            [19,74,74,74,74,13,13,74,74,74,74,19],
            [19,74,74,74,74,13,13,74,74,74,74,19],
            [19,74,74,19,74,74,74,74,19,74,74,19],
            [68,19,19,19,19,74,74,19,19,19,19,68],
            [19,74,60,19,74,74,74,74,19,58,74,19],
            [19,74,74,19,74,74,74,74,19,74,74,19],
            [19,19,19,68,19,19,19,19,68,19,19,19]
        ],
        heightMap: [
            [7,7,5,3,5,7,7,5,3,5,7,7],
            [7,6,6,5,6,6,6,6,5,6,6,7],
            [5,6,6,6,6,6,6,6,6,6,6,5],
            [3,5,6,5,5,5,5,5,5,6,5,3],
            [5,6,6,5,4,4,4,4,5,6,6,5],
            [7,6,6,5,4,3,3,4,5,6,6,7],
            [7,6,6,5,4,3,3,4,5,6,6,7],
            [5,6,6,5,4,4,4,4,5,6,6,5],
            [3,5,6,5,5,5,5,5,5,6,5,3],
            [5,6,6,6,6,6,6,6,6,6,6,5],
            [7,6,6,5,6,6,6,6,5,6,6,7],
            [7,7,5,3,5,7,7,5,3,5,7,7]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":4,"y":4},{"x":5,"y":4},{"x":6,"y":4},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5}],"2":[{"x":0,"y":0},{"x":11,"y":0},{"x":0,"y":11},{"x":11,"y":11},{"x":0,"y":5},{"x":11,"y":5}]}
    },
    prebuilt_dreamscape: {
        name: 'Dreamscape', w: 12, h: 12,
        grid: [
            [47,47,73,47,47,31,31,47,47,73,47,47],
            [47,47,47,47,31,47,47,31,47,47,47,47],
            [73,47,15,47,47,47,47,47,47,15,47,73],
            [47,47,47,47,47,47,47,47,47,47,47,47],
            [47,31,47,47,15,47,47,15,47,47,31,47],
            [31,47,47,47,47,15,15,47,47,47,47,31],
            [31,47,47,47,47,15,15,47,47,47,47,31],
            [47,31,47,47,15,47,47,15,47,47,31,47],
            [47,47,47,47,47,47,47,47,47,47,47,47],
            [73,47,15,47,47,47,47,47,47,15,47,73],
            [47,47,47,47,31,47,47,31,47,47,47,47],
            [47,47,73,47,47,31,31,47,47,73,47,47]
        ],
        heightMap: [
            [6,6,4,6,5,3,3,5,6,4,6,6],
            [6,6,6,6,4,5,5,4,6,6,6,6],
            [4,6,8,6,6,6,6,6,6,8,6,4],
            [6,6,6,6,6,6,6,6,6,6,6,6],
            [5,4,6,6,7,6,6,7,6,6,4,5],
            [3,5,6,6,6,10,10,6,6,6,5,3],
            [3,5,6,6,6,10,10,6,6,6,5,3],
            [5,4,6,6,7,6,6,7,6,6,4,5],
            [6,6,6,6,6,6,6,6,6,6,6,6],
            [4,6,8,6,6,6,6,6,6,8,6,4],
            [6,6,6,6,4,5,5,4,6,6,6,6],
            [6,6,4,6,5,3,3,5,6,4,6,6]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":9},{"x":1,"y":9},{"x":0,"y":10},{"x":1,"y":10},{"x":0,"y":11},{"x":1,"y":11}],"2":[{"x":10,"y":0},{"x":11,"y":0},{"x":10,"y":1},{"x":11,"y":1},{"x":10,"y":2},{"x":11,"y":2}]}
    },
    prebuilt_bleed_arena: {
        name: 'Bleed Arena', w: 10, h: 10,
        grid: [
            [73,47,47,47,15,15,47,47,47,73],
            [47,47,47,47,47,47,47,47,47,47],
            [47,47,15,47,47,47,47,15,47,47],
            [47,47,47,47,47,47,47,47,47,47],
            [15,47,47,47,47,47,47,47,47,15],
            [15,47,47,47,47,47,47,47,47,15],
            [47,47,47,47,47,47,47,47,47,47],
            [47,47,15,47,47,47,47,15,47,47],
            [47,47,47,47,47,47,47,47,47,47],
            [73,47,47,47,15,15,47,47,47,73]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3],
            [3,4,4,4,4,4,4,4,4,3],
            [3,4,5,5,5,5,5,5,4,3],
            [3,4,5,6,6,6,6,5,4,3],
            [3,4,5,6,7,7,6,5,4,3],
            [3,4,5,6,7,7,6,5,4,3],
            [3,4,5,6,6,6,6,5,4,3],
            [3,4,5,5,5,5,5,5,4,3],
            [3,4,4,4,4,4,4,4,4,3],
            [3,3,3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[]],
            [[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":4},{"x":0,"y":5},{"x":1,"y":4},{"x":1,"y":5}],"2":[{"x":8,"y":4},{"x":8,"y":5},{"x":9,"y":4},{"x":9,"y":5}]}
    },
    prebuilt_lattice: {
        name: 'Lattice Temple', w: 16, h: 16,
        grid: [
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6],
            [6,6,6,6,6,8,8,6,6,8,8,6,6,6,6,6],
            [6,6,15,6,8,8,13,13,13,13,8,8,6,15,6,6],
            [6,6,6,8,8,13,13,15,15,13,13,8,8,6,6,6],
            [6,6,8,8,13,13,15,15,15,15,13,13,8,8,6,6],
            [6,8,8,13,13,15,15,55,55,15,15,13,13,8,8,6],
            [6,8,13,13,15,15,55,55,55,55,15,15,13,13,8,6],
            [6,6,13,15,15,55,55,15,15,55,55,15,15,13,6,6],
            [6,6,13,15,15,55,55,15,15,55,55,15,15,13,6,6],
            [6,8,13,13,15,15,55,55,55,55,15,15,13,13,8,6],
            [6,8,8,13,13,15,15,55,55,15,15,13,13,8,8,6],
            [6,6,8,8,13,13,15,15,15,15,13,13,8,8,6,6],
            [6,6,6,8,8,13,13,15,15,13,13,8,8,6,6,6],
            [6,6,15,6,8,8,13,13,13,13,8,8,6,15,6,6],
            [6,6,6,6,6,8,8,6,6,8,8,6,6,6,6,6],
            [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,4,3,3,3,4,4,4,4,3,3,3,4,3,3],
            [3,3,3,3,3,4,4,6,6,4,4,3,3,3,3,3],
            [3,3,3,3,4,4,6,6,6,6,4,4,3,3,3,3],
            [3,3,3,4,4,6,6,7,7,6,6,4,4,3,3,3],
            [3,3,4,4,6,6,7,7,7,7,6,6,4,4,3,3],
            [3,3,4,6,6,7,7,9,9,7,7,6,6,4,3,3],
            [3,3,4,6,6,7,7,9,9,7,7,6,6,4,3,3],
            [3,3,4,4,6,6,7,7,7,7,6,6,4,4,3,3],
            [3,3,3,4,4,6,6,7,7,6,6,4,4,3,3,3],
            [3,3,3,3,4,4,6,6,6,6,4,4,3,3,3,3],
            [3,3,3,3,3,4,4,6,6,4,4,3,3,3,3,3],
            [3,3,4,3,3,3,4,4,4,4,3,3,3,4,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":13},{"x":1,"y":13},{"x":0,"y":14},{"x":1,"y":14},{"x":0,"y":15},{"x":1,"y":15},{"x":2,"y":14},{"x":2,"y":15}],"2":[{"x":14,"y":0},{"x":15,"y":0},{"x":14,"y":1},{"x":15,"y":1},{"x":14,"y":2},{"x":15,"y":2},{"x":13,"y":0},{"x":13,"y":1}]}
    },
    prebuilt_palimpsest: {
        name: 'Palimpsest', w: 16, h: 16,
        grid: [
            [54,54,74,74,31,31,49,49,49,49,31,31,74,74,54,54],
            [54,74,74,13,74,31,49,49,49,49,31,74,13,74,74,54],
            [74,74,58,13,74,74,31,49,49,31,74,74,13,59,74,74],
            [74,13,13,74,74,74,74,31,31,74,74,74,74,13,13,74],
            [31,74,74,74,74,15,74,74,74,74,15,74,74,74,74,31],
            [31,31,74,74,15,15,74,74,74,74,15,15,74,74,31,31],
            [49,49,31,74,74,74,47,47,47,47,74,74,74,31,49,49],
            [49,49,49,31,74,74,47,15,15,47,74,74,31,49,49,49],
            [49,49,49,31,74,74,47,15,15,47,74,74,31,49,49,49],
            [49,49,31,74,74,74,47,47,47,47,74,74,74,31,49,49],
            [31,31,74,74,15,15,74,74,74,74,15,15,74,74,31,31],
            [31,74,74,74,74,15,74,74,74,74,15,74,74,74,74,31],
            [74,13,13,74,74,74,74,31,31,74,74,74,74,13,13,74],
            [74,74,60,13,74,74,31,49,49,31,74,74,13,58,74,74],
            [54,74,74,13,74,31,49,49,49,49,31,74,13,74,74,54],
            [54,54,74,74,31,31,49,49,49,49,31,31,74,74,54,54]
        ],
        heightMap: [
            [9,8,6,5,3,3,4,4,4,4,3,3,5,6,8,9],
            [8,6,6,6,5,4,4,4,4,4,4,5,6,6,6,8],
            [6,7,7,6,6,6,4,4,4,4,6,6,6,7,6,6],
            [6,7,7,6,6,6,6,4,4,6,6,6,6,6,6,6],
            [4,6,6,6,6,7,6,6,6,6,7,6,6,6,6,4],
            [4,4,6,6,8,8,6,6,6,6,8,8,6,6,4,4],
            [4,4,4,6,8,8,6,6,6,6,8,8,6,4,4,4],
            [4,4,4,4,6,6,6,8,8,6,6,6,4,4,4,4],
            [4,4,4,4,6,6,6,8,8,6,6,6,4,4,4,4],
            [4,4,4,6,6,6,6,8,8,6,6,6,6,4,4,4],
            [4,4,6,6,7,8,6,6,6,6,8,7,6,6,4,4],
            [4,6,6,6,6,7,6,6,6,6,7,7,6,6,6,4],
            [6,6,6,6,6,6,6,4,4,6,7,7,6,6,6,6],
            [6,6,7,6,6,6,4,4,4,4,6,6,6,7,6,6],
            [8,6,6,6,5,4,4,4,4,4,4,5,6,6,6,8],
            [9,8,6,5,3,3,4,4,4,4,3,3,5,6,8,9]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[{oid:24,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[{oid:23,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:25,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[{oid:26,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[{oid:22,alignX:'center',alignY:'bottom'}],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:21,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":13},{"x":1,"y":13},{"x":0,"y":14},{"x":1,"y":14},{"x":0,"y":15},{"x":1,"y":15},{"x":2,"y":14},{"x":2,"y":15}],"2":[{"x":14,"y":0},{"x":15,"y":0},{"x":14,"y":1},{"x":15,"y":1},{"x":14,"y":2},{"x":15,"y":2},{"x":13,"y":0},{"x":13,"y":1}]}
    },
    prebuilt_pyramid: {
        name: 'Pyramid Fortress', w: 16, h: 16,
        grid: [
            [6,6,6,6,6,6,6,49,49,6,6,6,6,6,6,6],
            [6,6,6,6,6,6,49,49,49,49,6,6,6,6,6,6],
            [6,6,6,6,6,8,8,49,49,8,8,6,6,6,6,6],
            [6,6,6,6,8,8,13,13,13,13,8,8,6,6,6,6],
            [6,6,6,8,8,13,13,54,54,13,13,8,8,6,6,6],
            [6,6,8,8,13,13,54,54,54,54,13,13,8,8,6,6],
            [6,6,8,13,13,54,54,54,54,54,54,13,13,8,6,6],
            [6,8,8,13,54,54,54,15,15,54,54,54,13,8,8,6],
            [6,8,8,13,54,54,54,15,15,54,54,54,13,8,8,6],
            [6,6,8,13,13,54,54,54,54,54,54,13,13,8,6,6],
            [6,6,8,8,13,13,54,54,54,54,13,13,8,8,6,6],
            [6,6,6,8,8,13,13,54,54,13,13,8,8,6,6,6],
            [6,6,6,6,8,8,13,13,13,13,8,8,6,6,6,6],
            [6,6,6,6,6,8,8,49,49,8,8,6,6,6,6,6],
            [6,6,6,6,6,6,49,49,49,49,6,6,6,6,6,6],
            [6,6,6,6,6,6,6,49,49,6,6,6,6,6,6,6]
        ],
        heightMap: [
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,4,4,4,4,3,3,3,3,3,3],
            [3,3,3,3,3,4,4,6,6,4,4,3,3,3,3,3],
            [3,3,3,3,4,4,6,7,7,6,4,4,3,3,3,3],
            [3,3,3,4,4,6,7,7,7,7,6,4,4,3,3,3],
            [3,3,3,4,6,7,7,9,9,7,7,6,4,3,3,3],
            [3,3,3,4,6,7,7,9,9,7,7,6,4,3,3,3],
            [3,3,3,4,4,6,7,7,7,7,6,4,4,3,3,3],
            [3,3,3,3,4,4,6,7,7,6,4,4,3,3,3,3],
            [3,3,3,3,3,4,4,6,6,4,4,3,3,3,3,3],
            [3,3,3,3,3,3,4,4,4,4,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
            [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[{oid:18,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":6},{"x":0,"y":7},{"x":0,"y":8},{"x":0,"y":9},{"x":1,"y":6},{"x":1,"y":7},{"x":1,"y":8},{"x":1,"y":9}],"2":[{"x":6,"y":6},{"x":7,"y":6},{"x":8,"y":6},{"x":9,"y":6},{"x":6,"y":9},{"x":7,"y":9},{"x":8,"y":9},{"x":9,"y":9}]}
    },
    prebuilt_nexus_core: {
        name: 'Nexus Core', w: 20, h: 20,
        grid: [
            [31,31,31,49,49,49,47,47,47,47,47,47,47,47,49,49,49,31,31,31],
            [31,31,49,49,47,47,47,15,15,47,47,15,15,47,47,47,49,49,31,31],
            [31,49,49,47,47,15,47,47,47,47,47,47,47,47,15,47,47,49,49,31],
            [49,49,47,47,15,47,47,47,47,47,47,47,47,47,47,15,47,47,49,49],
            [49,47,47,15,47,47,47,47,47,15,15,47,47,47,47,47,15,47,47,49],
            [49,47,15,47,47,47,47,15,15,15,15,15,15,47,47,47,47,15,47,49],
            [47,47,47,47,47,47,15,15,31,31,31,31,15,15,47,47,47,47,47,47],
            [47,15,47,47,47,15,15,31,31,15,15,31,31,15,15,47,47,47,15,47],
            [47,15,47,47,47,15,31,31,15,15,15,15,31,31,15,47,47,47,15,47],
            [47,47,47,47,15,15,31,15,15,15,15,15,15,31,15,15,47,47,47,47],
            [47,47,47,47,15,15,31,15,15,15,15,15,15,31,15,15,47,47,47,47],
            [47,15,47,47,47,15,31,31,15,15,15,15,31,31,15,47,47,47,15,47],
            [47,15,47,47,47,15,15,31,31,15,15,31,31,15,15,47,47,47,15,47],
            [47,47,47,47,47,47,15,15,31,31,31,31,15,15,47,47,47,47,47,47],
            [49,47,15,47,47,47,47,15,15,15,15,15,15,47,47,47,47,15,47,49],
            [49,47,47,15,47,47,47,47,47,15,15,47,47,47,47,47,15,47,47,49],
            [49,49,47,47,15,47,47,47,47,47,47,47,47,47,47,15,47,47,49,49],
            [31,49,49,47,47,15,47,47,47,47,47,47,47,47,15,47,47,49,49,31],
            [31,31,49,49,47,47,47,15,15,47,47,15,15,47,47,47,49,49,31,31],
            [31,31,31,49,49,49,47,47,47,47,47,47,47,47,49,49,49,31,31,31]
        ],
        heightMap: [
            [3,3,3,4,4,4,6,6,6,6,6,6,6,6,4,4,4,3,3,3],
            [3,3,4,4,6,6,6,7,7,6,6,7,7,6,6,6,4,4,3,3],
            [3,4,4,6,6,7,6,6,6,6,6,6,6,6,7,6,6,4,4,3],
            [4,4,6,6,7,6,6,6,8,8,8,8,6,6,6,7,6,6,4,4],
            [4,6,6,7,6,6,8,8,9,10,10,9,8,8,6,6,7,6,6,4],
            [4,6,7,6,6,8,9,10,10,10,10,10,10,9,8,6,6,7,6,4],
            [6,6,6,6,8,9,10,10,11,11,11,11,10,10,9,8,6,6,6,6],
            [6,7,6,6,8,10,10,11,11,13,13,11,11,10,10,8,6,6,7,6],
            [6,7,6,8,9,10,11,11,13,13,13,13,11,11,10,9,8,6,7,6],
            [6,6,6,8,10,10,11,13,13,14,14,13,13,11,10,10,8,6,6,6],
            [6,6,6,8,10,10,11,13,13,14,14,13,13,11,10,10,8,6,6,6],
            [6,7,6,8,9,10,11,11,13,13,13,13,11,11,10,9,8,6,7,6],
            [6,7,6,6,8,10,10,11,11,13,13,11,11,10,10,8,6,6,7,6],
            [6,6,6,6,8,9,10,10,11,11,11,11,10,10,9,8,6,6,6,6],
            [4,6,7,6,6,8,9,10,10,10,10,10,10,9,8,6,6,7,6,4],
            [4,6,6,7,6,6,8,8,9,10,10,9,8,8,6,6,7,6,6,4],
            [4,4,6,6,7,6,6,6,8,8,8,8,6,6,6,7,6,6,4,4],
            [3,4,4,6,6,7,6,6,6,6,6,6,6,6,7,6,6,4,4,3],
            [3,3,4,4,6,6,6,7,7,6,6,7,7,6,6,6,4,4,3,3],
            [3,3,3,4,4,4,6,6,6,6,6,6,6,6,4,4,4,3,3,3]
        ],
        objects: [
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[{oid:5,alignX:'center',alignY:'bottom'}],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[{oid:17,alignX:'left',alignY:'bottom'}],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],
            [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
        ],
        spawns: {"1":[{"x":0,"y":8},{"x":0,"y":9},{"x":0,"y":10},{"x":0,"y":11},{"x":1,"y":8},{"x":1,"y":9},{"x":1,"y":10},{"x":1,"y":11},{"x":2,"y":9},{"x":2,"y":10}],"2":[{"x":19,"y":8},{"x":19,"y":9},{"x":19,"y":10},{"x":19,"y":11},{"x":18,"y":8},{"x":18,"y":9},{"x":18,"y":10},{"x":18,"y":11},{"x":17,"y":9},{"x":17,"y":10}]}
    }
};

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
        mp: 30, maxMp: 30,
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

const SPELL_SLOT_MAX = 8;

const CLASS_SPELL_LEARN_ORDER = {

    'Gunslinger':  ['pistolWhip', 'doubleShot', 'ricochet1', 'shootout', 'deadEye'],
    'Warrior':      ['fortify', 'guardSlash', 'shieldBash', 'dragonSlash', 'judgment'],
    'Black Mage':  ['fire1', 'thunder1', 'wallOfFire', 'meteor', 'thunderstorm'],
    'White Mage':  ['heal1', 'radiantBolt', 'cleanse', 'exorcism', 'healAll'],
    'Agent':       ['knifeThrow', 'placeBomb', 'sneakSlash', 'taser', 'empBurst'],
    'Psychic':     ['kineticHurl', 'glare', 'warpRune', 'psychosis', 'mindShatter'],
    'Harvester':   ['lifeDrain', 'healingSeed', 'poisonSeed', 'wildwood', 'timberStrike', 'leechSeed', 'overgrowth'],
    'Engineer':    ['plasmaGun', 'deployTurret', 'freeEnergy', 'fiveGTower', 'overclock'],
    'Harbinger':   ['lullaby', 'warCry', 'discordance', 'encore', 'requiem'],
    'Freelancer':  ['improvise', 'jackOfAll', 'reallyGoodPunch'],
    'Raider':      ['haymaker', 'ironGrip', 'skullCrack', 'groundSlam', 'rampage'],
    'Sniper':      ['kneecapShot', 'spotter', 'steadyAim', 'precisionShot', 'headshot'],
};

const SPELL_SHOP_PRICES = {
    'I':   40,
    'II':  80,
    'III': 140,
};

const LEVEL_UP_GAINS = {
    2:  { hp: 30, mp:  8, atk: 5, def: 4, mdef: 3, int: 3 },
    3:  { hp: 30, mp:  8, atk: 5, def: 4, mdef: 3, int: 3 },
    4:  { hp: 35, mp: 10, atk: 6, def: 5, mdef: 4, int: 4 },
    5:  { hp: 35, mp: 10, atk: 6, def: 5, mdef: 4, int: 4 },
    6:  { hp: 40, mp: 12, atk: 7, def: 6, mdef: 5, int: 5 },
    7:  { hp: 40, mp: 12, atk: 7, def: 6, mdef: 5, int: 5 },
    8:  { hp: 45, mp: 14, atk: 8, def: 7, mdef: 6, int: 6 },
    9:  { hp: 50, mp: 16, atk: 9, def: 8, mdef: 7, int: 7 },
    10: { hp: 55, mp: 18, atk: 10, def: 9, mdef: 8, int: 8 }
};

const _CHAL_MAP_POOL_SMALL  = ['normal'];
const _CHAL_MAP_POOL_MED    = ['medium', 'prebuilt_apartment', 'prebuilt_skirmish', 'prebuilt_bunker'];
const _CHAL_MAP_POOL_LARGE  = ['large', 'prebuilt_suburb', 'prebuilt_compound', 'prebuilt_crossroads',
                               'prebuilt_workshop', 'prebuilt_battlefield', 'prebuilt_cavern',
                               'prebuilt_killbox', 'prebuilt_rift_plaza'];
const _CHAL_MAP_POOL_XLARGE = ['xlarge', 'prebuilt_citadel', 'prebuilt_apocalypse',
                                'prebuilt_dreamscape', 'prebuilt_bleed_arena', 'prebuilt_lattice',
                                'prebuilt_nexus_core', 'prebuilt_caldera', 'prebuilt_highlands'];

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
  if (n <= 2) {
    teamSize = 1; mapPool = _CHAL_MAP_POOL_SMALL;  enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [1, 1]; aiMult = 0.4;
  } else if (n <= 5) {
    teamSize = 2; mapPool = _CHAL_MAP_POOL_SMALL;  enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [1, 1]; aiMult = 0.5;
  } else if (n <= 10) {
    teamSize = 4; mapPool = _CHAL_MAP_POOL_MED;    enemyPool = _CHAL_ENEMY_TIER_EASY;  levelRange = [1, 2]; aiMult = 0.7;
  } else if (n <= 18) {
    teamSize = 4; mapPool = _CHAL_MAP_POOL_MED;    enemyPool = _CHAL_ENEMY_TIER_MID;   levelRange = [2, 3]; aiMult = 1.0;
  } else if (n <= 28) {
    teamSize = 6; mapPool = _CHAL_MAP_POOL_LARGE;  enemyPool = _CHAL_ENEMY_TIER_MID;   levelRange = [3, 4]; aiMult = 1.0;
  } else if (n <= 40) {
    teamSize = 6; mapPool = _CHAL_MAP_POOL_LARGE;  enemyPool = _CHAL_ENEMY_TIER_HARD;  levelRange = [4, 5]; aiMult = 1.1;
  } else if (n <= 60) {
    teamSize = 8; mapPool = _CHAL_MAP_POOL_XLARGE; enemyPool = _CHAL_ENEMY_TIER_HARD;  levelRange = [5, 6]; aiMult = 1.15;
  } else {
    teamSize = 8; mapPool = _CHAL_MAP_POOL_XLARGE; enemyPool = _CHAL_ENEMY_TIER_BOSS;
    const extra = Math.floor((n - 61) / 5);
    levelRange = [Math.min(6 + extra, 9), Math.min(7 + extra, 10)];
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

Object.assign(window, {
  CONFIG, EQUIP_DEFS, RACE_PROFILES, AVAILABLE_RACES, RACE_DEFAULT_JOBS,
  AVAILABLE_ZODIACS, ZODIAC_ICONS, JOB_MODIFIERS, CLASS_TEMPLATES,
  JOB_PASSIVES, CLASS_PASSIVES, getJobPassive,
  DEFAULT_BUILDS, ITEM_RULES, SPELL_LIBRARY, SPELL_SLOT_MAX,
  getSpellSlotCost, getSpellIdsSlotCost, trimSpellIdsToSlotBudget,
  CLASS_SPELL_LEARN_ORDER, RACE_ABILITIES, CAMPAIGN_REGION_THEMES,
  getRaceLabel, GAUNTLET_MAX_LEVEL, getGauntletRetryCost,
  computeSecJobBonuses, computeEquipBonuses,
  ACCT_UNIT_PRICE, ACCT_BASE_COMPLETE, ACCT_WIN_MULT, ACCT_FLAWLESS_MULT,
  ACCT_WIPEOUT_MULT, ACCT_STARTING_GOLD, ACCT_FREE_TOKENS, ACCT_MATCH_GOLD_CAP,
  ACCT_STARTER_UNITS, ACCT_PVP_MODES, isUnitUnlocked, computeAccountMatchGold,
});
