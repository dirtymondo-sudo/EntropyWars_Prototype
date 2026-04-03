// ============================================================
// ENTROPY WARS — DATA.JS
// All game data constants extracted from the main game file.
// This file must load BEFORE the main game script.
// ============================================================

// ── GAME CONFIG ──
const CONFIG = {
    boardSize: 8, // legacy square fallback
    boardWidth: 16, // horizontal tiles (columns)
    boardHeight: 8, // vertical tiles (rows)
    winHourglasses: 2,
    hiddenItemSpawns: 7,
    tileSize: 58,
    tileGap: 0,
    boardPadding: 2,
    teamSize: 4,
    unitSkillSlots: 6,
    unitSpellBudget: 12,
    maxCrossClassSpells: 6,
    unitItemSlots: 6
};

// ── EQUIPMENT SLOTS ──
const EQUIPMENT_SLOTS = ['head', 'torso', 'legs', 'boots', 'handL', 'handR', 'accessory1', 'accessory2'];

// ── EQUIPMENT DEFINITIONS ──
const EQUIP_DEFS = {
    'plate_helm': {
        slot: 'head',
        label: 'Plate Helm',
        desc: 'Heavy steel helm. High defense, limits peripheral vision.',
        stat: 'def', statVal: 2
    },
    'wide_brim_hat': {
        slot: 'head',
        label: 'Wide Brim Hat',
        desc: 'Dusty leather hat. Keeps the sun out and the bullets flying.',
        stat: 'awr', statVal: 1
    },
    'arcane_hood': {
        slot: 'head',
        label: 'Arcane Hood',
        desc: 'Dark hood pulsing with runes. Amplifies magical focus.',
        stat: 'int', statVal: 2
    },
    'gold_circlet': {
        slot: 'head',
        label: 'Gold Circlet',
        desc: 'Blessed golden band. Channels divine healing energy.',
        stat: 'int', statVal: 1
    },
    'tactical_visor': {
        slot: 'head',
        label: 'Tactical Visor',
        desc: 'HUD overlay visor. Marks targets and boosts awareness.',
        stat: 'awr', statVal: 2
    },
    'crystal_tiara': {
        slot: 'head',
        label: 'Crystal Tiara',
        desc: 'Psionic crystal crown. Enhances telepathic abilities.',
        stat: 'mp', statVal: 4
    },
    'harvest_hood': {
        slot: 'head',
        label: 'Harvest Hood',
        desc: 'Tattered hood of the reaper. Smells faintly of soil and decay.',
        stat: 'hp', statVal: 3
    },

    // ── TORSO ──
    'plate_cuirass': {
        slot: 'torso',
        label: 'Plate Cuirass',
        desc: 'Full steel breastplate. Maximum protection for the frontline.',
        stat: 'def', statVal: 3
    },
    'duster_coat': {
        slot: 'torso',
        label: 'Duster Coat',
        desc: 'Long leather duster. Looks cool, hides weapons.',
        stat: 'def', statVal: 1
    },
    'arcane_robes': {
        slot: 'torso',
        label: 'Arcane Robes',
        desc: 'Embroidered robes crackling with arcane residue.',
        stat: 'int', statVal: 3
    },
    'holy_vestments': {
        slot: 'torso',
        label: 'Holy Vestments',
        desc: 'White and gold priestly garments. Radiates calm.',
        stat: 'mp', statVal: 5
    },
    'tactical_vest': {
        slot: 'torso',
        label: 'Tactical Vest',
        desc: 'Kevlar vest with MOLLE webbing. Pockets for days.',
        stat: 'def', statVal: 2
    },
    'mystic_robes': {
        slot: 'torso',
        label: 'Mystic Robes',
        desc: 'Flowing indigo robes threaded with starlight patterns.',
        stat: 'mp', statVal: 6
    },
    'leather_garb': {
        slot: 'torso',
        label: 'Leather Garb',
        desc: 'Worn leather tunic. Flexible and stained with hard work.',
        stat: 'hp', statVal: 4
    },

    // ── LEGS ──
    'plate_greaves': {
        slot: 'legs',
        label: 'Plate Greaves',
        desc: 'Steel leg armor. Protects thighs and knees.',
        stat: 'def', statVal: 2
    },
    'denim_pants': {
        slot: 'legs',
        label: 'Denim Pants',
        desc: 'Faded blue jeans. Comfortable for long rides.',
        stat: 'move', statVal: 1
    },
    'cargo_pants': {
        slot: 'legs',
        label: 'Cargo Pants',
        desc: 'Tactical pants with many pockets. Utility over fashion.',
        stat: 'hp', statVal: 3
    },
    'harvest_pants': {
        slot: 'legs',
        label: 'Harvest Pants',
        desc: 'Rough-spun trousers. Stained with earth and sap.',
        stat: 'hp', statVal: 2
    },

    // ── BOOTS ──
    'plate_sabatons': {
        slot: 'boots',
        label: 'Plate Sabatons',
        desc: 'Steel foot armor. Heavy but nearly indestructible.',
        stat: 'def', statVal: 1
    },
    'cowboy_boots': {
        slot: 'boots',
        label: 'Cowboy Boots',
        desc: 'Pointed-toe leather boots with spurs.',
        stat: 'move', statVal: 1
    },
    'combat_boots': {
        slot: 'boots',
        label: 'Combat Boots',
        desc: 'Laced tactical boots. Ankle support for any terrain.',
        stat: 'hp', statVal: 2
    },
    'field_boots': {
        slot: 'boots',
        label: 'Field Boots',
        desc: 'Mud-caked work boots. Built for long days in the field.',
        stat: 'move', statVal: 1
    },
    'climbing_boots': {
        slot: 'boots',
        label: 'Climbing Boots',
        desc: 'Grippy soles for mountain and cliff terrain.',
        stat: 'move', statVal: 1
    },

    // ── HAND RIGHT (dominant) ──
    'iron_sword': {
        slot: 'handR',
        label: 'Iron Sword',
        desc: 'Reliable straight blade. The backbone of any knight.',
        stat: 'atk', statVal: 3
    },
    'revolver_r': {
        slot: 'handR',
        label: 'Revolver (R)',
        desc: 'Six-shot wheelgun. Loud, accurate, deadly.',
        stat: 'atk', statVal: 2
    },
    'wand_r': {
        slot: 'handR',
        label: 'Wand (R)',
        desc: 'Slender focus wand. Channels spells with precision.',
        stat: 'int', statVal: 2
    },
    'healing_staff': {
        slot: 'handR',
        label: 'Healing Staff',
        desc: 'White oak staff topped with a warm crystal.',
        stat: 'int', statVal: 3
    },
    'combat_knife': {
        slot: 'handR',
        label: 'Combat Knife',
        desc: 'Fixed-blade tactical knife. Quick and silent.',
        stat: 'atk', statVal: 1
    },
    'tarot_cards': {
        slot: 'handR',
        label: 'Tarot Cards',
        desc: 'Enchanted tarot deck. Each draw bends fate.',
        stat: 'int', statVal: 2
    },
    'scythe_r': {
        slot: 'handR',
        label: 'Scythe (R)',
        desc: 'Curved reaping blade. Harvests life force.',
        stat: 'atk', statVal: 3
    },
    'arcane_staff_r': {
        slot: 'handR',
        label: 'Arcane Staff (R)',
        desc: 'Gnarled staff humming with stored spells.',
        stat: 'int', statVal: 3
    },
    'iron_shield_r': {
        slot: 'handR',
        label: 'Iron Shield (R)',
        desc: 'Heavy kite shield. Can bash as well as block.',
        stat: 'def', statVal: 3
    },
    'frag_bomb_r': {
        slot: 'handR',
        label: 'Frag Bomb (R)',
        desc: 'Timed explosive. Pull pin, throw, take cover.',
        stat: 'atk', statVal: 2
    },

    // ── HAND LEFT (off-hand) ──
    'iron_shield': {
        slot: 'handL',
        label: 'Iron Shield',
        desc: 'Sturdy kite shield. Blocks blows and projectiles.',
        stat: 'def', statVal: 3
    },
    'revolver_l': {
        slot: 'handL',
        label: 'Revolver (L)',
        desc: 'Off-hand revolver. Twice the firepower.',
        stat: 'atk', statVal: 1
    },
    'arcane_staff': {
        slot: 'handL',
        label: 'Arcane Staff',
        desc: 'Staff of condensed mana. Boosts spell potency.',
        stat: 'int', statVal: 2
    },
    'wand_l': {
        slot: 'handL',
        label: 'Wand (L)',
        desc: 'Off-hand focus wand. Doubles channeling speed.',
        stat: 'int', statVal: 1
    },
    'frag_bomb': {
        slot: 'handL',
        label: 'Frag Bomb',
        desc: 'Primed explosive grenade. Handle with care.',
        stat: 'atk', statVal: 1
    },
    'scythe_l': {
        slot: 'handL',
        label: 'Scythe (L)',
        desc: 'Left-hand reaping blade. Dual-wield harvesting.',
        stat: 'atk', statVal: 2
    },
    'iron_sword_l': {
        slot: 'handL',
        label: 'Iron Sword (L)',
        desc: 'Off-hand blade for dual-wielding knights.',
        stat: 'atk', statVal: 2
    },
    'healing_staff_l': {
        slot: 'handL',
        label: 'Healing Staff (L)',
        desc: 'Off-hand healing focus. Boosts restorative magic.',
        stat: 'int', statVal: 2
    },
    'combat_knife_l': {
        slot: 'handL',
        label: 'Combat Knife (L)',
        desc: 'Off-hand blade for close-quarters combos.',
        stat: 'atk', statVal: 1
    },
    'tarot_cards_l': {
        slot: 'handL',
        label: 'Tarot Cards (L)',
        desc: 'Second tarot deck. Double the fate manipulation.',
        stat: 'int', statVal: 1
    },

    // ── ACCESSORIES ──
    'binoculars': {
        slot: 'accessory1',
        label: 'Binoculars',
        desc: '+2 vision range. See further across the battlefield.',
        stat: 'awr', statVal: 2
    },
    'walkie_talkie': {
        slot: 'accessory1',
        label: 'Walkie Talkie',
        desc: 'Extends communication range with allies.',
        stat: 'awr', statVal: 1
    },
    'flair': {
        slot: 'accessory1',
        label: 'Signal Flare',
        desc: 'One-use flare to reveal an area of the map.',
        stat: 'awr', statVal: 1
    },
    'ward': {
        slot: 'accessory1',
        label: 'Ward Totem',
        desc: 'Deployable ward that grants vision in an area.',
        stat: 'awr', statVal: 1
    },
    'telescope': {
        slot: 'accessory1',
        label: 'Telescope',
        desc: 'Long-range scouting tool. Reveals distant tiles.',
        stat: 'awr', statVal: 2
    },
    'jetpack': {
        slot: 'accessory1',
        label: 'Jetpack',
        desc: 'Fly to the sky without nexus control. Ignores terrain movement cost.',
        stat: 'move', statVal: 1
    },
    'spelunking_gear': {
        slot: 'accessory1',
        label: 'Spelunking Gear',
        desc: 'Descend underground without nexus control. +1 AWR.',
        stat: 'awr', statVal: 1
    },

    // ── ENGINEER WEAPONS ──
    'wrench_r': {
        slot: 'handR',
        label: 'Wrench (R)',
        desc: 'Heavy-duty wrench. Builds, repairs, and bashes.',
        stat: 'atk', statVal: 2
    },
    'wrench_l': {
        slot: 'handL',
        label: 'Wrench (L)',
        desc: 'Off-hand wrench. Doubles construction speed.',
        stat: 'atk', statVal: 1
    },

    // ── NEW WEAPONS ──
    'plasma_gun_r': {
        slot: 'handR',
        label: 'Plasma Gun (R)',
        desc: 'Superheated plasma rounds. High-tech firepower.',
        stat: 'atk', statVal: 3
    },
    'plasma_gun_l': {
        slot: 'handL',
        label: 'Plasma Gun (L)',
        desc: 'Off-hand plasma sidearm.',
        stat: 'atk', statVal: 2
    },
    'sniper_rifle_r': {
        slot: 'handR',
        label: 'Sniper Rifle (R)',
        desc: 'Long-range precision rifle with scope. Deadly at distance.',
        stat: 'atk', statVal: 4
    },
    'sniper_rifle_l': {
        slot: 'handL',
        label: 'Sniper Rifle (L)',
        desc: 'Off-hand marksman carbine.',
        stat: 'atk', statVal: 2
    },
    'laser_sword_r': {
        slot: 'handR',
        label: 'Laser Sword (R)',
        desc: 'Energy blade that cuts through armor. Elegant and lethal.',
        stat: 'atk', statVal: 3
    },
    'laser_sword_l': {
        slot: 'handL',
        label: 'Laser Sword (L)',
        desc: 'Off-hand energy blade for dual wielding.',
        stat: 'atk', statVal: 2
    },
};

// ── EQUIPMENT RACE COMPATIBILITY ──
const EQUIP_RACE_COMPAT = {
    'nordic': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'annunaki': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'skinwalker': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'zombie': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'skeleton': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'demon': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'succubus': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'angel': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'seraphim': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'android': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'robot': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'mech': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'bigfoot': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'giant': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'reptilian': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'ai': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'fairy': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'ghost': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'grey': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'martian': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'orb of light': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'shadow entity': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'werewolf': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'gargoyle': {
        fallback: 'homosapien',
        slots: 'all'
    },
    'djinn': {
        fallback: 'homosapien',
        slots: 'all'
    },
};

// ── DEFAULT JOB EQUIPMENT ──
const DEFAULT_JOB_EQUIPMENT = {
    'Knight': {
        head: 'plate_helm',
        torso: 'plate_cuirass',
        legs: 'plate_greaves',
        boots: 'plate_sabatons',
        handR: 'iron_sword',
        handL: 'iron_shield',
    },
    'Gunslinger': {
        head: 'wide_brim_hat',
        torso: 'duster_coat',
        legs: 'denim_pants',
        boots: 'cowboy_boots',
        handR: 'revolver_r',
        handL: 'revolver_l',
    },
    'Black Mage': {
        head: 'arcane_hood',
        torso: 'arcane_robes',
        handL: 'arcane_staff',
        handR: 'wand_r',
    },
    'White Mage': {
        head: 'gold_circlet',
        torso: 'holy_vestments',
        handR: 'healing_staff',
        handL: 'wand_l',
    },
    'Agent': {
        head: 'tactical_visor',
        torso: 'tactical_vest',
        legs: 'cargo_pants',
        boots: 'combat_boots',
        handR: 'combat_knife',
        handL: 'frag_bomb',
    },
    'Psychic': {
        head: 'crystal_tiara',
        torso: 'mystic_robes',
        handR: 'tarot_cards',
        handL: 'wand_l',
    },
    'Harvester': {
        head: 'harvest_hood',
        torso: 'leather_garb',
        legs: 'harvest_pants',
        boots: 'field_boots',
        handR: 'scythe_r',
        handL: 'wand_l',
    },
    'Engineer': {
        head: 'tactical_visor',
        torso: 'tactical_vest',
        legs: 'cargo_pants',
        boots: 'combat_boots',
        handR: 'wrench_r',
        handL: 'iron_shield',
    },
    'Bard': {
        head: 'gold_circlet',
        torso: 'mystic_robes',
        handR: 'wand_r',
        handL: 'healing_staff_l',
    },
    'Freelancer': {
        head: 'wide_brim_hat',
        torso: 'duster_coat',
        legs: 'denim_pants',
        boots: 'combat_boots',
        handR: 'iron_sword',
        handL: 'iron_shield',
    },
    'Pirate': {
        head: 'wide_brim_hat',
        torso: 'leather_garb',
        legs: 'denim_pants',
        boots: 'cowboy_boots',
        handR: 'iron_sword',
        handL: 'iron_sword_l',
    },
    'Sniper': {
        head: 'tactical_visor',
        torso: 'tactical_vest',
        legs: 'cargo_pants',
        boots: 'combat_boots',
        handR: 'sniper_rifle_r',
        handL: 'combat_knife_l',
    }
};

// Jobs with multiple allowed main-hand (handR) weapons

// ── JOB ALLOWED MAIN-HAND WEAPONS ──
const JOB_ALLOWED_HANDR = {
    'Agent': ['combat_knife', 'frag_bomb_r'],
    'Engineer': ['wrench_r', 'iron_shield_r'],
    'Freelancer': ['iron_sword', 'revolver_r', 'combat_knife', 'wand_r', 'scythe_r', 'arcane_staff_r', 'healing_staff', 'tarot_cards', 'frag_bomb_r', 'wrench_r', 'plasma_gun_r', 'sniper_rifle_r', 'laser_sword_r'],
    'Pirate': ['iron_sword', 'revolver_r', 'combat_knife', 'laser_sword_r'],
    'Sniper': ['sniper_rifle_r', 'revolver_r', 'combat_knife', 'plasma_gun_r'],
};

function getDefaultEquipment(cls) {
    const equip = emptyEquipment();
    const defaults = DEFAULT_JOB_EQUIPMENT[cls] || {};
    for (const slot of EQUIPMENT_SLOTS) {
        if (defaults[slot]) equip[slot] = defaults[slot];
    }
    return equip;
}

// resolveEquipSprite is defined in sprite_atlas.js

// ── TYPE EFFECTIVENESS CHART ──
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

// ── FACTION BONUSES ──
const FACTION_BONUSES = {
    space: {
        label: 'Space Alignment',
        armorBonus: 1
    },
    time: {
        label: 'Time Alignment',
        healBonus: 3
    },
    chaos: {
        label: 'Chaos Alignment',
        atkBonus: 2
    }
};

// ── TERRAIN RULES ──
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
        moveCost: 2,
        blocksRanged: false,
        healMultiplier: 1,
        endTurn(unit) {
            return null;
        }
    },
    deep_water: {
        label: 'Deep Water',
        short: 'DPW',
        passable: false,
        moveCost: 3,
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
            // Escalate drowning stacks each turn spent in deep water
            unit._drowningStacks = (unit._drowningStacks || 0) + 1;
            const status = ensureUnitStatus(unit);
            status.drowning = 3; // refreshes each turn in water; expires naturally when out
            return null; // damage handled by the drowning status onTurnStart
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
        passable: false,
        moveCost: 99,
        blocksRanged: true,
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
        }
    },
    // ── GROUND FLOOR NEW TERRAIN ──
    tree: {
        label: 'Forest',
        short: 'TRE',
        passable: true,
        moveCost: 2,
        blocksRanged: true,
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
        passable: false,
        moveCost: 99,
        blocksRanged: false,
        healMultiplier: 0,
        endTurn(unit) {
            return null;
        }
    },
    well: {
        label: 'Well',
        short: 'WEL',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isDoor: true,
        doorTarget: 'underground',
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
        isDoor: true,
        doorTarget: 'sky',
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
        isDoor: true,
        doorTarget: 'underground',
        endTurn(unit) {
            return null;
        }
    },
    tower_base: {
        label: 'Tower',
        short: 'TWR',
        passable: false,
        moveCost: 99,
        blocksRanged: true,
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
    // ── UNDERGROUND TERRAIN ──
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
        passable: false,
        moveCost: 99,
        blocksRanged: true,
        healMultiplier: 0,
        endTurn(unit) {
            return null;
        }
    },
    ladder_up: {
        label: 'Ladder Up',
        short: 'LDR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isDoor: true,
        doorTarget: 'ground',
        endTurn(unit) {
            return null;
        }
    },
    rope_up: {
        label: 'Rope Up',
        short: 'RPE',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isDoor: true,
        doorTarget: 'ground',
        endTurn(unit) {
            return null;
        }
    },
    fog_wall: {
        label: 'Darkness',
        short: 'FOG',
        passable: false,
        moveCost: 99,
        blocksRanged: true,
        healMultiplier: 0,
        endTurn(unit) {
            return null;
        }
    },
    // ── SKY TERRAIN ──
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
        blocksRanged: true,
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
        isDoor: true,
        doorTarget: 'ground',
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
        isDoor: true,
        doorTarget: 'ground',
        endTurn(unit) {
            return null;
        }
    },
    // ── NEXUS TERRAIN (capturable objectives) ──
    nexus: {
        label: 'Ley Line Nexus',
        short: 'NEX',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isNexus: true,
        nexusFloor: 'ground',
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
        nexusFloor: 'underground',
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
        nexusFloor: 'sky',
        endTurn(unit) { return null; }
    },
    // ── SANCTUARY TERRAIN (homebase) ──
    sanctuary_church: {
        label: 'Sanctuary Church',
        short: 'CHR',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1.5,
        isSanctuary: true,
        sanctuaryType: 'church',
        endTurn(unit) { return null; }
    },
    sanctuary_shop: {
        label: 'Sanctuary Shop',
        short: 'SHP',
        passable: true,
        moveCost: 1,
        blocksRanged: false,
        healMultiplier: 1,
        isSanctuary: true,
        sanctuaryType: 'shop',
        endTurn(unit) { return null; }
    }
};

// ── JOB ARCHETYPES ──
const JOB_ARCHETYPES = {
    'Gunslinger': {
        race: 'homosapien',
        faction: 'space',
        types: ['human'],
        gender: 'other',
        zodiac: 'aries',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Knight': {
        race: 'homosapien',
        faction: 'space',
        types: ['human'],
        gender: 'other',
        zodiac: 'taurus',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Black Mage': {
        race: 'martian',
        faction: 'space',
        types: ['alien'],
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
        types: ['anomaly'],
        gender: 'other',
        zodiac: 'aquarius',
        sleepPreference: 'nocturnal',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Harvester': {
        race: 'bigfoot',
        faction: 'time',
        types: ['human'],
        gender: 'other',
        zodiac: 'virgo',
        sleepPreference: 'daywalker',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Engineer': {
        race: 'robot',
        faction: 'space',
        types: ['tech'],
        gender: 'other',
        zodiac: 'capricorn',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    },
    'Bard': {
        race: 'fairy',
        faction: 'chaos',
        types: ['human'],
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
    'Pirate': {
        race: 'werewolf',
        faction: 'chaos',
        types: ['human', 'unholy'],
        gender: 'other',
        zodiac: 'scorpio',
        sleepPreference: 'nocturnal',
        terrainPreference: 'water',
        weatherPreference: 'none'
    },
    'Sniper': {
        race: 'gargoyle',
        faction: 'space',
        types: ['unholy'],
        gender: 'other',
        zodiac: 'capricorn',
        sleepPreference: 'none',
        terrainPreference: 'grass',
        weatherPreference: 'none'
    }
};

// ── RACE PROFILES ──
const RACE_PROFILES = {
    homosapien: {
        label: 'Homosapien',
        faction: 'space',
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
        types: ['human']
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
    }
};


// ── AVAILABLE OPTIONS ──
const AVAILABLE_RACES = ['homosapien', 'giant', 'fairy', 'martian', 'nordic', 'grey', 'bigfoot', 'shadow entity', 'reptilian', 'ai', 'robot', 'android', 'angel', 'seraphim', 'orb of light', 'demon', 'succubus', 'skeleton', 'mech', 'ghost', 'zombie', 'annunaki', 'skinwalker', 'werewolf', 'gargoyle', 'djinn'];
const AVAILABLE_GENDERS = ['male', 'female', 'other'];
const AVAILABLE_ZODIACS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const AVAILABLE_SLEEP_PREFERENCES = ['none', 'nocturnal', 'daywalker'];
const AVAILABLE_TERRAIN_PREFERENCES = ['grass', 'water', 'deep_water', 'mountain', 'desert'];
const AVAILABLE_ITEM_TYPES = ['', 'healPotion', 'manaPotion', 'scanner'];


// ── ZODIAC & SKY EVENTS ──
const ZODIAC_CYCLE = AVAILABLE_ZODIACS; // 12 signs
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

// ── RACE BASE STATS ──
const RACE_BASE_STATS = {
    // Humanoid — balanced
    'homosapien': {
        hp: 55,
        mp: 24,
        atk: 7,
        def: 7,
        move: 3,
        awr: 3,
        int: 6,
        spd: 5
    },
    'nordic': {
        hp: 60,
        mp: 22,
        atk: 8,
        def: 8,
        move: 3,
        awr: 2,
        int: 5,
        spd: 4
    },
    'skinwalker': {
        hp: 52,
        mp: 26,
        atk: 8,
        def: 6,
        move: 3,
        awr: 4,
        int: 7,
        spd: 7
    },
    'annunaki': {
        hp: 58,
        mp: 28,
        atk: 7,
        def: 7,
        move: 3,
        awr: 4,
        int: 8,
        spd: 5
    },
    // Divine — magical, fragile
    'angel': {
        hp: 48,
        mp: 34,
        atk: 5,
        def: 6,
        move: 3,
        awr: 4,
        int: 10,
        spd: 6
    },
    'seraphim': {
        hp: 44,
        mp: 38,
        atk: 4,
        def: 5,
        move: 3,
        awr: 5,
        int: 12,
        spd: 7
    },
    'orb of light': {
        hp: 35,
        mp: 40,
        atk: 3,
        def: 4,
        move: 3,
        awr: 5,
        int: 13,
        spd: 8
    },
    // Unholy — aggressive
    'demon': {
        hp: 62,
        mp: 22,
        atk: 10,
        def: 8,
        move: 3,
        awr: 2,
        int: 5,
        spd: 4
    },
    'succubus': {
        hp: 50,
        mp: 30,
        atk: 7,
        def: 6,
        move: 3,
        awr: 5,
        int: 10,
        spd: 7
    },
    'skeleton': {
        hp: 48,
        mp: 22,
        atk: 8,
        def: 6,
        move: 4,
        awr: 2,
        int: 5,
        spd: 8
    },
    'zombie': {
        hp: 70,
        mp: 14,
        atk: 7,
        def: 9,
        move: 2,
        awr: 1,
        int: 3,
        spd: 2
    },
    // Alien — high int/awr
    'grey': {
        hp: 38,
        mp: 36,
        atk: 3,
        def: 4,
        move: 3,
        awr: 5,
        int: 12,
        spd: 6
    },
    'martian': {
        hp: 45,
        mp: 32,
        atk: 5,
        def: 5,
        move: 3,
        awr: 4,
        int: 10,
        spd: 5
    },
    'reptilian': {
        hp: 58,
        mp: 20,
        atk: 9,
        def: 9,
        move: 3,
        awr: 3,
        int: 5,
        spd: 4
    },
    // Tech — durable, systematic
    'ai': {
        hp: 46,
        mp: 36,
        atk: 4,
        def: 5,
        move: 3,
        awr: 5,
        int: 13,
        spd: 6
    },
    'android': {
        hp: 54,
        mp: 26,
        atk: 7,
        def: 8,
        move: 3,
        awr: 3,
        int: 7,
        spd: 6
    },
    'robot': {
        hp: 62,
        mp: 20,
        atk: 8,
        def: 9,
        move: 2,
        awr: 2,
        int: 7,
        spd: 3
    },
    'mech': {
        hp: 75,
        mp: 16,
        atk: 9,
        def: 12,
        move: 2,
        awr: 2,
        int: 4,
        spd: 2
    },
    // Nature / Cryptid
    'bigfoot': {
        hp: 62,
        mp: 18,
        atk: 8,
        def: 7,
        move: 3,
        awr: 3,
        int: 4,
        spd: 3
    },
    'giant': {
        hp: 68,
        mp: 16,
        atk: 9,
        def: 8,
        move: 2,
        awr: 2,
        int: 3,
        spd: 2
    },
    'fairy': {
        hp: 32,
        mp: 38,
        atk: 3,
        def: 3,
        move: 4,
        awr: 5,
        int: 11,
        spd: 9
    },
    // Anomaly
    'ghost': {
        hp: 46,
        mp: 30,
        atk: 5,
        def: 5,
        move: 4,
        awr: 5,
        int: 11,
        spd: 8
    },
    'shadow entity': {
        hp: 42,
        mp: 32,
        atk: 6,
        def: 5,
        move: 3,
        awr: 5,
        int: 10,
        spd: 7
    },
    // New races
    'werewolf': {
        hp: 65,
        mp: 18,
        atk: 10,
        def: 6,
        move: 4,
        awr: 4,
        int: 3,
        spd: 7
    },
    'gargoyle': {
        hp: 70,
        mp: 16,
        atk: 8,
        def: 10,
        move: 2,
        awr: 3,
        int: 4,
        spd: 3
    },
    'djinn': {
        hp: 48,
        mp: 36,
        atk: 5,
        def: 5,
        move: 3,
        awr: 4,
        int: 12,
        spd: 6
    }
};

// ── JOB STAT MODIFIERS ──
// Additive bonuses/penalties applied on top of race base stats.

// ── JOB STAT MODIFIERS ──
const JOB_MODIFIERS = {
    'Knight': {
        hp: +12,
        mp: -3,
        atk: +2,
        def: +4,
        move: 0,
        awr: -1,
        int: -2,
        spd: -1,
        range: 1,
        inspect: 1
    },
    'Gunslinger': {
        hp: +3,
        mp: -2,
        atk: +3,
        def: +1,
        move: 0,
        awr: 0,
        int: 0,
        spd: +1,
        range: 2,
        inspect: 1
    },
    'Black Mage': {
        hp: -8,
        mp: +12,
        atk: -3,
        def: -2,
        move: 0,
        awr: 0,
        int: +4,
        spd: 0,
        range: 3,
        inspect: 1
    },
    'White Mage': {
        hp: -3,
        mp: +10,
        atk: -3,
        def: 0,
        move: 0,
        awr: 0,
        int: +3,
        spd: 0,
        range: 3,
        inspect: 1
    },
    'Agent': {
        hp: 0,
        mp: +3,
        atk: +1,
        def: 0,
        move: +1,
        awr: +2,
        int: +2,
        spd: +2,
        range: 3,
        inspect: 2
    },
    'Psychic': {
        hp: -4,
        mp: +14,
        atk: -4,
        def: -1,
        move: 0,
        awr: +1,
        int: +6,
        spd: 0,
        range: 3,
        inspect: 1
    },
    'Harvester': {
        hp: +8,
        mp: +4,
        atk: +2,
        def: +2,
        move: 0,
        awr: 0,
        int: +1,
        spd: -1,
        range: 1,
        inspect: 1
    },
    // Bug fix: Engineer was missing — fell back to Gunslinger
    'Engineer': {
        hp: +5,
        mp: +2,
        atk: 0,
        def: +2,
        move: 0,
        awr: 0,
        int: +1,
        spd: 0,
        range: 2,
        inspect: 1
    },
    // Bug fix: Bard was missing — fell back to Gunslinger
    'Bard': {
        hp: -5,
        mp: +8,
        atk: -4,
        def: -1,
        move: 0,
        awr: +1,
        int: +3,
        spd: +1,
        range: 3,
        inspect: 1
    },
    // New jobs
    'Freelancer': {
        hp: +2,
        mp: +2,
        atk: +1,
        def: +1,
        move: 0,
        awr: +1,
        int: +1,
        spd: +1,
        range: 2,
        inspect: 1
    },
    'Pirate': {
        hp: +6,
        mp: 0,
        atk: +3,
        def: +1,
        move: 0,
        awr: 0,
        int: -1,
        spd: +1,
        range: 1,
        inspect: 1
    },
    'Sniper': {
        hp: -2,
        mp: -1,
        atk: +4,
        def: -1,
        move: 0,
        awr: +3,
        int: 0,
        spd: +1,
        range: 4,
        inspect: 2
    }
};

// ── STAT COMPUTATION UTILITIES ──
// Compute final stats from race base + job modifiers
function computeUnitStats(race, cls) {
    const base = RACE_BASE_STATS[race] || RACE_BASE_STATS['homosapien'];
    const job = JOB_MODIFIERS[cls] || JOB_MODIFIERS['Gunslinger'];
    return {
        hp: Math.max(20, base.hp + job.hp),
        mp: Math.max(5, base.mp + job.mp),
        atk: Math.max(1, base.atk + job.atk),
        def: Math.max(0, base.def + job.def),
        move: Math.max(1, base.move + job.move),
        awr: Math.max(1, base.awr + job.awr),
        int: Math.max(0, base.int + job.int),
        spd: Math.max(1, (base.spd || 5) + (job.spd || 0)),
        range: job.range,
        inspect: job.inspect
    };
}

// Compute total stat bonuses from all equipped items
function computeEquipBonuses(equipment) {
    const bonuses = { hp: 0, mp: 0, atk: 0, def: 0, move: 0, awr: 0, int: 0, spd: 0 };
    if (!equipment) return bonuses;
    for (const slot of Object.keys(equipment)) {
        const itemId = equipment[slot];
        if (!itemId) continue;
        const def = EQUIP_DEFS[itemId];
        if (def && def.stat && def.statVal) {
            bonuses[def.stat] = (bonuses[def.stat] || 0) + def.statVal;
        }
    }
    return bonuses;
}

// Format a stat bonus tag like "+2 DEF" for display
function formatEquipStat(itemId) {
    const def = EQUIP_DEFS[itemId];
    if (!def || !def.stat || !def.statVal) return '';
    return '+' + def.statVal + ' ' + def.stat.toUpperCase();
}

// CLASS_TEMPLATES kept for job metadata (cls, job, backward compat).

// ── CLASS TEMPLATES (fallback stats) ──
const CLASS_TEMPLATES = {
    Gunslinger: {
        cls: 'Gunslinger',
        job: 'Gunslinger',
        hp: 58,
        mp: 22,
        atk: 10,
        def: 8,
        range: 2,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 6
    },
    Knight: {
        cls: 'Knight',
        job: 'Knight',
        hp: 67,
        mp: 21,
        atk: 10,
        def: 12,
        range: 1,
        move: 3,
        inspect: 1,
        awr: 2,
        int: 4
    },
    'Black Mage': {
        cls: 'Black Mage',
        job: 'Black Mage',
        hp: 47,
        mp: 36,
        atk: 4,
        def: 5,
        range: 3,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 10
    },
    'White Mage': {
        cls: 'White Mage',
        job: 'White Mage',
        hp: 52,
        mp: 34,
        atk: 4,
        def: 7,
        range: 3,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 9
    },
    Agent: {
        cls: 'Agent',
        job: 'Agent',
        hp: 55,
        mp: 27,
        atk: 8,
        def: 7,
        range: 3,
        move: 4,
        inspect: 2,
        awr: 5,
        int: 8
    },
    Psychic: {
        cls: 'Psychic',
        job: 'Psychic',
        hp: 47,
        mp: 38,
        atk: 3,
        def: 5,
        range: 3,
        move: 3,
        inspect: 1,
        awr: 4,
        int: 11
    },
    Harvester: {
        cls: 'Harvester',
        job: 'Harvester',
        hp: 63,
        mp: 28,
        atk: 9,
        def: 9,
        range: 1,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 7
    },
    Engineer: {
        cls: 'Engineer',
        job: 'Engineer',
        hp: 60,
        mp: 26,
        atk: 7,
        def: 9,
        range: 2,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 7
    },
    Bard: {
        cls: 'Bard',
        job: 'Bard',
        hp: 55,
        mp: 32,
        atk: 6,
        def: 7,
        range: 3,
        move: 3,
        inspect: 1,
        awr: 4,
        int: 9
    },
    Freelancer: {
        cls: 'Freelancer',
        job: 'Freelancer',
        hp: 57,
        mp: 26,
        atk: 8,
        def: 8,
        range: 2,
        move: 3,
        inspect: 1,
        awr: 4,
        int: 7
    },
    Pirate: {
        cls: 'Pirate',
        job: 'Pirate',
        hp: 61,
        mp: 24,
        atk: 10,
        def: 8,
        range: 1,
        move: 3,
        inspect: 1,
        awr: 3,
        int: 5
    },
    Sniper: {
        cls: 'Sniper',
        job: 'Sniper',
        hp: 50,
        mp: 23,
        atk: 9,
        def: 5,
        range: 3,
        move: 3,
        inspect: 2,
        awr: 6,
        int: 6
    },
};


// ── DEFAULT BUILDS ──
let DEFAULT_BUILDS = {
    1: ['Gunslinger', 'Knight', 'Black Mage', 'White Mage'],
    2: ['Gunslinger', 'Knight', 'Agent', 'White Mage']
};

const DEFAULT_PARTY_NAMES = {
    1: ['P1 Gunslinger', 'P1 Knight', 'P1 Black Mage', 'P1 White Mage'],
    2: ['P2 Gunslinger', 'P2 Knight', 'P2 Agent', 'P2 White Mage']
};


// ── ITEM RULES ──
const ITEM_RULES = {
    healPotion: {
        name: 'Healing Potion',
        icon: '🧪',
        max: 6,
        desc: 'Self only. Restores 12 HP.'
    },
    manaPotion: {
        name: 'Mana Potion',
        icon: '🔹',
        max: 6,
        desc: 'Target any living ally. Restores 8 MP.'
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
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Human types.',
        baneType: 'human',
        baneDmg: 15,
        baseDmg: 6
    },
    divineBane: {
        name: 'Divine Bane',
        icon: '🌑',
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Divine types.',
        baneType: 'divine',
        baneDmg: 15,
        baseDmg: 6
    },
    unholyBane: {
        name: 'Unholy Bane',
        icon: '✝️',
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Unholy types.',
        baneType: 'unholy',
        baneDmg: 15,
        baseDmg: 6
    },
    techBane: {
        name: 'Tech Bane',
        icon: '⚡',
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Tech types.',
        baneType: 'tech',
        baneDmg: 15,
        baseDmg: 6
    },
    anomalyBane: {
        name: 'Anomaly Bane',
        icon: '🔮',
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Anomaly types.',
        baneType: 'anomaly',
        baneDmg: 15,
        baseDmg: 6
    },
    alienBane: {
        name: 'Alien Bane',
        icon: '☄️',
        max: 3,
        desc: 'Throw at an enemy. Deals 15 bonus damage to Alien types.',
        baneType: 'alien',
        baneDmg: 15,
        baseDmg: 6
    },
    panacea: {
        name: 'Panacea',
        icon: '💊',
        max: 1,
        desc: 'Self only. Cures all negative status effects.',
        shopPrice: 12
    },
    warpStone: {
        name: 'Warp Stone',
        icon: '🌀',
        max: 1,
        desc: 'Teleport to any tile within 3 range. Ignores terrain.',
        shopPrice: 15
    }
};

// ── ITEM META ──
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

// ── CLASS PASSIVES ──
const CLASS_PASSIVES = {
    Gunslinger: 'Deadeye: +1 SPD.',
    Knight: 'Bulwark: reduces incoming damage by 1 and Fortify shields cap at 25% max HP.',
    'Black Mage': 'Arcane Surge: +1 spell damage.',
    'White Mage': 'Grace: heal and revive spells gain +2 range and +3 healing power.',
    Agent: 'Field Operative: can equip up to 2 scanners and has longer inspect reach.',
    Psychic: 'Third Eye: Glare debuffs applied by this unit have +1 duration. Teleport costs 1 less MP.',
    Harvester: 'Green Thumb: Planted seeds last 1 extra turn. Life Drain heals 20% more.',
    Engineer: 'Tinker: Turrets have +1 range and Repair heals 20% more.',
    Bard: 'Crescendo: buff durations from this unit last 1 extra turn. Lullaby has +1 range.',
    Freelancer: 'Adaptable: no equipment or spell restrictions. Can equip any weapon and learn spells from any school.',
    Pirate: 'Sea Legs: +2 ATK on water tiles. Cannon spells deal +50% damage when fired from water.',
    Sniper: 'Marksman: +1 basic attack range. Critical hit chance +10% at max range.'
};

// ── SPELL LIBRARY ──
const SPELL_LIBRARY = [
    // ── Cross-class spells (available to all) ──
    {
        id: 'shoot',
        name: 'Shoot',
        type: 'damage',
        cost: 2,
        equipCost: 2,
        dmg: 13,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Gunslinger',
        jobPreference: ['Gunslinger'],
        actedTargetBonus: 2,
        desc: 'Reliable ranged poke. Deals extra damage to targets that already acted.'
    },
    {
        id: 'fortify',
        name: 'Fortify',
        type: 'buff',
        cost: 5,
        equipCost: 3,
        apCost: 1,
        range: 2,
        kind: 'shield',
        tier: 'I',
        school: 'Knight',
        jobPreference: ['Knight'],
        shield: 12,
        shieldCapPct: 0.25,
        desc: 'Grant yourself or an ally a shield, capped at 25% of max HP.'
    },
    {
        id: 'mark1',
        name: 'Mark',
        type: 'debuff',
        cost: 4,
        equipCost: 3,
        range: 4,
        kind: 'debuff',
        tier: 'I',
        school: 'Tactics',
        jobPreference: ['Agent', 'Gunslinger'],
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }],
        desc: 'Mark an enemy, causing the next physical hit to deal +5 bonus damage.'
    },
    {
        id: 'heal1',
        name: 'Heal I',
        type: 'heal',
        cost: 5,
        equipCost: 4,
        apCost: 1,
        heal: 24,
        range: 3,
        kind: 'heal',
        tier: 'I',
        school: 'White Mage',
        jobPreference: ['White Mage'],
        lowHpBonus: 6,
        desc: 'Restore a strong chunk of HP. Heals more on allies below 40% HP.'
    },
    {
        id: 'fire1',
        name: 'Fire I',
        type: 'damage',
        cost: 6,
        equipCost: 4,
        dmg: 18,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        jobPreference: ['Black Mage'],
        statusEffects: [{
            id: 'burn',
            duration: 2
        }],
        desc: 'Reliable single-target fire burst that also burns.'
    },

    // ── Knight-only ──
    {
        id: 'guardSlash',
        name: 'Brave Charge',
        type: 'damage',
        cost: 4,
        equipCost: 3,
        dmg: 12,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Knight',
        classRestriction: 'Knight',
        chargeToTarget: true,
        statusEffects: [],
        desc: 'Charge at an enemy up to 3 tiles away, dealing damage and landing adjacent to them.'
    },
    {
        id: 'shieldBash',
        name: 'Shield Bash',
        type: 'damage',
        cost: 4,
        equipCost: 3,
        dmg: 10,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Knight',
        classRestriction: 'Knight',
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Close-range bash that stuns the target, preventing them from acting next turn.'
    },
    {
        id: 'dragonSlash',
        name: 'Dragon Slash',
        type: 'damage',
        cost: 6,
        equipCost: 4,
        dmg: 28,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        ignoreArmor: true,
        tier: 'II',
        school: 'Knight',
        desc: 'A devastating melee strike that cleaves through armor. Massive single-target damage.'
    },

    // ── White Mage-only ──
    {
        id: 'radiantBolt',
        name: 'Radiant Bolt',
        type: 'damage',
        cost: 5,
        equipCost: 3,
        dmg: 16,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'White Mage',
        classRestriction: 'White Mage',
        jobPreference: ['White Mage'],
        unholyBonus: 6,
        desc: 'A bolt of purifying light. Deals bonus damage (+6) to Unholy and Anomaly type targets.'
    },
    {
        id: 'revive1',
        name: 'Revive I',
        type: 'heal',
        cost: 5,
        equipCost: 3,
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
        name: 'Protect I',
        type: 'buff',
        cost: 6,
        equipCost: 2,
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
        name: 'Heal All',
        type: 'heal',
        cost: 12,
        equipCost: 4,
        heal: 16,
        range: 0,
        kind: 'healAll',
        tier: 'II',
        school: 'White Mage',
        classRestriction: 'White Mage',
        desc: 'Restore HP to all living allies. Lower base heal but hits the entire team.'
    },

    // ── Black Mage-only ──
    {
        id: 'thunder1',
        name: 'Thunder I',
        type: 'damage',
        cost: 8,
        equipCost: 3,
        dmg: 15,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        chainProfile: [15, 10, 6],
        chainRadius: 1,
        desc: 'Lightning that punishes clumped enemies with heavy falloff.'
    },
    {
        id: 'thunderstorm',
        name: 'Thunderstorm',
        type: 'utility',
        cost: 6,
        equipCost: 3,
        range: 4,
        kind: 'summonWeather',
        tier: 'I',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        weatherType: 'thunderstorm',
        weatherDuration: [3, 5],
        weatherTiles: [3, 5],
        desc: 'Summon a roaming thunderstorm at the target area. Deals lightning damage and reduces DEF.'
    },
    {
        id: 'wallOfFire',
        name: 'Wall of Fire',
        type: 'damage',
        cost: 10,
        equipCost: 4,
        dmg: 14,
        range: 3,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'II',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        aoeRadius: 1,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }],
        desc: 'Engulf a 3x3 area in flames, damaging all enemies caught and burning them for 2 turns.'
    },

    // ── Gunslinger-only ──
    {
        id: 'doubleShot',
        name: 'Double Shot',
        type: 'damage',
        cost: 5,
        equipCost: 2,
        range: 3,
        kind: 'multiHit',
        damageType: 'physical',
        tier: 'I',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        hitDamages: [8, 8],
        markedSecondHitBonus: 3,
        desc: 'Two quick shots. The second hits harder against Marked targets.'
    },
    {
        id: 'ricochet1',
        name: 'Ricochet I',
        type: 'damage',
        cost: 6,
        equipCost: 3,
        dmg: 11,
        range: 3,
        kind: 'ricochet',
        damageType: 'physical',
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
        name: 'Shootout',
        type: 'damage',
        cost: 8,
        equipCost: 4,
        dmg: 10,
        range: 3,
        kind: 'barrage',
        damageType: 'physical',
        tier: 'II',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        desc: 'Unload on all enemies within range. Hits each for moderate damage.'
    },

    // ── Agent-only ──
    {
        id: 'placeBomb',
        name: 'Place Bomb',
        type: 'buff',
        cost: 4,
        equipCost: 2,
        apCost: 1,
        dmg: 18,
        range: 2,
        kind: 'bomb',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        maxActivePerCaster: 3,
        blastRadius: 1,
        desc: 'Place a bomb on an empty tile (1 AP). Each Agent can maintain up to 3. Use Detonate to trigger them.'
    },
    {
        id: 'scanPulse',
        name: 'Scan Pulse',
        type: 'utility',
        cost: 4,
        equipCost: 2,
        apCost: 1,
        range: 0,
        kind: 'scan',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        desc: 'Scan the nearby field. Marks the whole area, but only reveals the nearest hidden objective and item.'
    },
    {
        id: 'electroDart',
        name: 'Electro Dart',
        type: 'damage',
        cost: 3,
        equipCost: 3,
        dmg: 16,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Agent',
        classRestriction: 'Agent',
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Quick ranged strike that stuns the target for 1 turn.'
    },
    {
        id: 'taser',
        name: 'Taser',
        type: 'damage',
        cost: 6,
        equipCost: 4,
        dmg: 22,
        range: 2,
        kind: 'damage',
        damageType: 'physical',
        tier: 'II',
        school: 'Agent',
        classRestriction: 'Agent',
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Heavy close-range shock that deals strong damage and stuns the target.'
    },

    // ── Cross-class: Glare (Psychic school, restricted to Psychic or high-INT units) ──
    {
        id: 'glare',
        name: 'Glare',
        type: 'debuff',
        cost: 3,
        equipCost: 2,
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

    // ── Cross-class: Healing Seed (Harvester school, available to all) ──
    {
        id: 'healingSeed',
        name: 'Healing Seed',
        type: 'utility',
        cost: 4,
        equipCost: 3,
        apCost: 1,
        range: 3,
        kind: 'seedHeal',
        tier: 'I',
        school: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Plant a restorative seed on a grass tile. Heals allies standing on it each turn. Blooms instantly in rain. Persists until destroyed by enemy attack, drought, or terrain change.'
    },

    // ── Cross-class: Poison Seed (Harvester school, available to all) ──
    {
        id: 'poisonSeed',
        name: 'Poison Seed',
        type: 'utility',
        cost: 4,
        equipCost: 3,
        apCost: 1,
        range: 3,
        kind: 'seedPoison',
        tier: 'I',
        school: 'Harvester',
        jobPreference: ['Harvester'],
        desc: 'Plant a toxic seed on a grass tile. Damages enemies standing on it each turn. Persists until destroyed by enemy attack, drought, or terrain change.'
    },

    // ── Psychic-only ──
    {
        id: 'teleport',
        name: 'Teleport',
        type: 'utility',
        cost: 8,
        equipCost: 3,
        range: 3,
        kind: 'teleport',
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        desc: 'Warp any unit — self, ally, or enemy — to any unoccupied tile within range. Costs 1 less MP for Psychics.'
    },
    {
        id: 'warpRune',
        name: 'Warp Rune',
        type: 'utility',
        cost: 5,
        equipCost: 3,
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
        name: 'Psychosis',
        type: 'damage',
        cost: 5,
        equipCost: 4,
        dmg: 26,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'II',
        school: 'Psychic',
        classRestriction: 'Psychic',
        statusEffects: [{
            id: 'silence',
            duration: 1
        }],
        desc: 'Assault a target\'s mind with raw psychic force. May silence the victim.'
    },

    // ── Harvester-only ──
    {
        id: 'lifeDrain',
        name: 'Life Drain',
        type: 'damage',
        cost: 6,
        equipCost: 4,
        dmg: 18,
        range: 3,
        kind: 'lifeDrain',
        tier: 'I',
        school: 'Harvester',
        classRestriction: 'Harvester',
        drainPct: 0.50,
        desc: 'Siphon life force from an enemy. Heals self for 50% of damage dealt. Harvesters heal 20% more.'
    },
    {
        id: 'leechSeed',
        name: 'Leech Seed',
        type: 'utility',
        cost: 7,
        equipCost: 4,
        range: 3,
        kind: 'leechSeed',
        tier: 'II',
        school: 'Harvester',
        classRestriction: 'Harvester',
        desc: 'Infest a tile with parasitic roots. Enemies crossing it take damage; allies crossing it are healed. Persists until destroyed by enemy attack, drought, or terrain change.'
    },

    // ── Dagger abilities ──
    {
        id: 'knifeThrow',
        name: 'Knife Throw',
        type: 'damage',
        cost: 3,
        equipCost: 2,
        dmg: 16,
        range: 4,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Agent',
        equipReq: 'knife',
        statusEffects: [{
            id: 'marked',
            duration: 1,
            bonusDamage: 3
        }],
        desc: 'Hurl a knife at a distant enemy. Marks the target, making them vulnerable to follow-up attacks.'
    },
    {
        id: 'sneakSlash',
        name: 'Sneak Slash',
        type: 'damage',
        cost: 5,
        equipCost: 3,
        dmg: 28,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'II',
        school: 'Agent',
        equipReq: 'knife',
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }],
        sneakBonus: true,
        desc: 'A devastating close-range slash from the shadows. Deals +50% damage if attacking from behind (adjacent + target already acted this round).'
    },

    // ── Tarot abilities ──
    {
        id: 'remoteView',
        name: 'Remote View',
        type: 'utility',
        cost: 4,
        equipCost: 2,
        apCost: 1,
        range: 99,
        kind: 'remoteView',
        tier: 'I',
        school: 'Psychic',
        equipReq: 'tarot',
        desc: 'Peer through the cards to reveal a 5x5 area anywhere on any floor. Grants vision for 3 turns.'
    },

    // ── Engineer-only ──
    {
        id: 'deployTurret',
        name: 'Deploy Turret',
        type: 'utility',
        cost: 7,
        equipCost: 3,
        apCost: 1,
        range: 2,
        kind: 'deployTurret',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        maxActivePerCaster: 2,
        turretHp: 20,
        turretDmg: 8,
        turretRange: 2,
        desc: 'Deploy a turret on an empty tile (1 AP). Auto-attacks the nearest enemy within 2 tiles each round for 8 damage. Max 2 per Engineer. Enemies can destroy turrets.'
    },
    {
        id: 'buildBridge',
        name: 'Build Bridge',
        type: 'utility',
        cost: 5,
        equipCost: 2,
        apCost: 1,
        range: 2,
        kind: 'buildBridge',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        desc: 'Convert a deep water tile into a bridge. Bridge is passable terrain with move cost 1. Creates new flanking routes across the map.'
    },
    {
        id: 'overclock',
        name: 'Overclock',
        type: 'buff',
        cost: 8,
        equipCost: 4,
        range: 3,
        kind: 'buff',
        tier: 'II',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statusEffects: [{
            id: 'overclock',
            duration: 2
        }],
        desc: 'Supercharge an allied unit for 2 turns: +2 ATK, +1 Move. Tech-type units also gain +1 Range.'
    },
    {
        id: 'wrenchToss',
        name: 'Wrench Toss',
        type: 'damage',
        cost: 4,
        equipCost: 2,
        dmg: 10,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Engineer',
        classRestriction: 'Engineer',
        statusEffects: [{ id: 'stagger', duration: 1, chance: 0.35 }],
        desc: 'Hurl a wrench at an enemy. 35% chance to stagger the target for 1 turn.'
    },

    // ── Bard-only ──
    {
        id: 'warCry',
        name: 'War Cry',
        type: 'buff',
        cost: 6,
        equipCost: 3,
        apCost: 1,
        range: 0,
        kind: 'warCry',
        tier: 'I',
        school: 'Bard',
        classRestriction: 'Bard',
        auraRadius: 3,
        desc: 'Rally all allies within 3 tiles. Grants Inspired for 2 turns: +3 ATK, +2 DEF. The Bard receives a weaker version (+1 ATK, +1 DEF).'
    },
    {
        id: 'discordance',
        name: 'Discordance',
        type: 'debuff',
        cost: 5,
        equipCost: 3,
        range: 3,
        kind: 'debuff',
        tier: 'I',
        school: 'Bard',
        classRestriction: 'Bard',
        statusEffects: [{
            id: 'discord',
            duration: 2
        }],
        desc: 'Disharmonize an enemy for 2 turns: -3 ATK, -2 DEF, and their spells cost +2 MP. More interactive than a hard stun.'
    },
    {
        id: 'encore',
        name: 'Encore',
        type: 'buff',
        cost: 7,
        equipCost: 4,
        range: 3,
        kind: 'encore',
        tier: 'II',
        school: 'Bard',
        classRestriction: 'Bard',
        desc: 'Grant a friendly unit that already acted this turn 1 bonus AP, letting them take one more action. Each unit can only receive Encore once per round.'
    },
    {
        id: 'lullaby',
        name: 'Lullaby',
        type: 'damage',
        cost: 5,
        equipCost: 3,
        dmg: 14,
        range: 4,
        kind: 'damage',
        damageType: 'magic',
        tier: 'II',
        school: 'Bard',
        classRestriction: 'Bard',
        statusEffects: [{
            id: 'slow',
            duration: 2
        }],
        desc: 'Sing a soothing melody that lulls an enemy, dealing magic damage and slowing them for 2 turns.'
    },
    // ── Pirate spells ──
    {
        id: 'cannonBlast',
        name: 'Cannon Blast',
        type: 'damage',
        cost: 6,
        equipCost: 3,
        dmg: 18,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        waterBonus: true,
        tier: 'II',
        school: 'Pirate',
        classRestriction: 'Pirate',
        jobPreference: ['Pirate'],
        desc: 'Fire a cannon shot. Deals +50% damage if the caster is standing on a water tile.'
    },
    {
        id: 'grapple',
        name: 'Grapple',
        type: 'utility',
        cost: 4,
        equipCost: 2,
        apCost: 1,
        range: 3,
        kind: 'utility',
        tier: 'I',
        school: 'Pirate',
        classRestriction: 'Pirate',
        jobPreference: ['Pirate'],
        desc: 'Throw a grappling hook. Pull target enemy 2 tiles toward you, or pull yourself 2 tiles toward a wall/obstacle.'
    },
    {
        id: 'broadside',
        name: 'Broadside',
        type: 'damage',
        cost: 10,
        equipCost: 4,
        dmg: 14,
        aoeRadius: 1,
        range: 3,
        kind: 'aoe',
        damageType: 'physical',
        waterBonus: true,
        tier: 'III',
        school: 'Pirate',
        classRestriction: 'Pirate',
        jobPreference: ['Pirate'],
        desc: 'Unleash a devastating broadside in a 3x3 area. Deals +50% damage from water tiles.'
    },
    {
        id: 'plunder',
        name: 'Plunder',
        type: 'utility',
        cost: 3,
        equipCost: 2,
        apCost: 1,
        range: 1,
        kind: 'utility',
        tier: 'I',
        school: 'Pirate',
        classRestriction: 'Pirate',
        jobPreference: ['Pirate'],
        desc: 'Steal a random item or 1 hourglass from an adjacent enemy.'
    },
    {
        id: 'anchorToss',
        name: 'Anchor Toss',
        type: 'damage',
        cost: 5,
        equipCost: 2,
        dmg: 12,
        range: 3,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Pirate',
        classRestriction: 'Pirate',
        jobPreference: ['Pirate'],
        statusEffects: [{ id: 'slow', duration: 2, chance: 0.5 }],
        desc: 'Throw a heavy anchor at an enemy. 50% chance to slow for 2 turns.'
    },
    // ── Sniper spells ──
    {
        id: 'precisionShot',
        name: 'Precision Shot',
        type: 'damage',
        cost: 5,
        equipCost: 3,
        dmg: 16,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        actedTargetBonus: 4,
        tier: 'II',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        desc: 'A carefully aimed long-range shot. Deals +4 bonus damage to targets that already acted. Range 5.'
    },
    {
        id: 'headshot',
        name: 'Headshot',
        type: 'damage',
        cost: 10,
        equipCost: 5,
        dmg: 28,
        range: 5,
        kind: 'damage',
        damageType: 'physical',
        ignoreArmor: true,
        selfStun: 1,
        tier: 'III',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        desc: 'A lethal armor-piercing shot at extreme range. The recoil staggers the Sniper — skip next turn.'
    },
    {
        id: 'spotter',
        name: 'Spotter',
        type: 'debuff',
        cost: 3,
        equipCost: 2,
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
            bonusDamage: 5
        }],
        desc: 'Call out an enemy at extreme range. Marks them for 3 turns — next hit deals +5 bonus damage.'
    },
    {
        id: 'camouflage',
        name: 'Camouflage',
        type: 'buff',
        cost: 4,
        equipCost: 2,
        range: 0,
        kind: 'buff',
        tier: 'II',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{
            id: 'invisible',
            duration: 2
        }],
        desc: 'Blend into the environment. Enemies cannot target this unit for 2 turns or until it attacks. +1 range while camouflaged.'
    },
    {
        id: 'steadyAim',
        name: 'Steady Aim',
        type: 'buff',
        cost: 3,
        equipCost: 2,
        range: 0,
        kind: 'buff',
        tier: 'I',
        school: 'Sniper',
        classRestriction: 'Sniper',
        jobPreference: ['Sniper'],
        statusEffects: [{ id: 'steadyAim', duration: 1 }],
        desc: 'Brace and focus. +2 Range for your next turn. Self-target only.'
    },
    // ── Freelancer spells (no classRestriction — they can learn anything, but these are their own) ──
    {
        id: 'mimic',
        name: 'Mimic',
        type: 'utility',
        cost: 6,
        equipCost: 3,
        range: 3,
        kind: 'utility',
        tier: 'II',
        school: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'Copy the last spell cast by any unit on the field and cast it immediately at reduced power (75% damage/healing).'
    },
    {
        id: 'jackOfAll',
        name: 'Jack of All',
        type: 'buff',
        cost: 5,
        equipCost: 3,
        apCost: 1,
        range: 0,
        kind: 'buff',
        tier: 'I',
        school: 'Freelancer',
        jobPreference: ['Freelancer'],
        statusEffects: [{
            id: 'jackOfAll',
            duration: 3
        }],
        desc: 'Self-buff: +2 ATK, +1 DEF, +1 MOVE for 3 turns. Modest but universal.'
    },
    {
        id: 'improvise',
        name: 'Improvise',
        type: 'damage',
        cost: 4,
        equipCost: 2,
        dmg: 12,
        range: 2,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'An unorthodox attack using whatever is on hand. Damage type matches equipped weapon. No equipment restriction.'
    },
    {
        id: 'reallyGoodPunch',
        name: 'A Really Good Punch',
        type: 'damage',
        cost: 3,
        equipCost: 2,
        dmg: 14,
        range: 1,
        kind: 'damage',
        damageType: 'physical',
        tier: 'I',
        school: 'Freelancer',
        jobPreference: ['Freelancer'],
        desc: 'A surprisingly effective melee punch. No equipment restriction.'
    },

    // ══════════════════════════════════════
    // ── TIER III SPELLS (one per class) ──
    // ══════════════════════════════════════

    // ── Knight T3 ──
    {
        id: 'judgment',
        name: 'Judgment',
        type: 'damage',
        cost: 10,
        equipCost: 5,
        dmg: 22,
        range: 1,
        kind: 'aoe',
        damageType: 'physical',
        tier: 'III',
        school: 'Knight',
        classRestriction: 'Knight',
        aoeRadius: 1,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Slam the ground with divine fury. Deals heavy physical damage in a 3x3 area and stuns all enemies hit for 1 turn.'
    },

    // ── Gunslinger T3 ──
    {
        id: 'deadEye',
        name: 'Dead Eye',
        type: 'damage',
        cost: 10,
        equipCost: 5,
        dmg: 32,
        range: 4,
        kind: 'damage',
        damageType: 'physical',
        tier: 'III',
        school: 'Gunslinger',
        classRestriction: 'Gunslinger',
        guaranteedCrit: true,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }],
        desc: 'Take careful aim and fire a single devastating shot. Always crits. Marks the target on hit.'
    },

    // ── Black Mage T3 ──
    {
        id: 'meteor',
        name: 'Meteor',
        type: 'damage',
        cost: 14,
        equipCost: 5,
        dmg: 24,
        range: 4,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Black Mage',
        classRestriction: 'Black Mage',
        aoeRadius: 1,
        statusEffects: [{
            id: 'burn',
            duration: 3
        }],
        desc: 'Call down a meteor strike on a 3x3 area. Massive magic damage and applies a 3-turn burn to all enemies hit.'
    },

    // ── White Mage T3 ──
    {
        id: 'divineIntervention',
        name: 'Divine Intervention',
        type: 'heal',
        cost: 14,
        equipCost: 5,
        heal: 22,
        range: 0,
        kind: 'healAll',
        tier: 'III',
        school: 'White Mage',
        classRestriction: 'White Mage',
        cleanse: true,
        desc: 'Channel divine power to heal all living allies for 22 HP and cleanse all debuffs. The ultimate save.'
    },

    // ── Agent T3 ──
    {
        id: 'empBurst',
        name: 'EMP Burst',
        type: 'damage',
        cost: 10,
        equipCost: 5,
        dmg: 12,
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
            duration: 2
        }, {
            id: 'jammed',
            duration: 2
        }],
        desc: 'Emit a massive EMP pulse centered on self. Damages all enemies within 2 tiles and silences + jams them for 2 turns.'
    },

    // ── Psychic T3 ──
    {
        id: 'mindShatter',
        name: 'Mind Shatter',
        type: 'damage',
        cost: 12,
        equipCost: 5,
        dmg: 20,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'III',
        school: 'Psychic',
        classRestriction: 'Psychic',
        statusEffects: [{
            id: 'silence',
            duration: 2
        }, {
            id: 'slow',
            duration: 2
        }],
        desc: 'Tear apart an enemy\'s mind. Heavy magic damage, silences for 2 turns, and slows for 2 turns. Total shutdown.'
    },

    // ── Harvester T3 ──
    {
        id: 'overgrowth',
        name: 'Overgrowth',
        type: 'damage',
        cost: 10,
        equipCost: 5,
        dmg: 14,
        range: 3,
        kind: 'aoe',
        damageType: 'magic',
        tier: 'III',
        school: 'Harvester',
        classRestriction: 'Harvester',
        aoeRadius: 1,
        statusEffects: [{
            id: 'slow',
            duration: 2
        }, {
            id: 'poison',
            duration: 3
        }],
        desc: 'Erupt thorny vines in a 3x3 area. Damages, poisons for 3 turns, and slows all enemies caught for 2 turns.'
    },

    // ── Engineer T3 ──
    {
        id: 'siegeTurret',
        name: 'Siege Turret',
        type: 'utility',
        cost: 12,
        equipCost: 5,
        range: 2,
        kind: 'deployTurret',
        tier: 'III',
        school: 'Engineer',
        classRestriction: 'Engineer',
        maxActivePerCaster: 1,
        turretHp: 40,
        turretDmg: 14,
        turretRange: 3,
        desc: 'Deploy a heavily armored siege turret (40 HP, 14 dmg, 3 range). Max 1 per Engineer. A dominant area-denial weapon.'
    },

    // ── Bard T3 ──
    {
        id: 'requiem',
        name: 'Requiem',
        type: 'damage',
        cost: 12,
        equipCost: 5,
        dmg: 10,
        range: 4,
        kind: 'barrage',
        damageType: 'magic',
        tier: 'III',
        school: 'Bard',
        classRestriction: 'Bard',
        statusEffects: [{
            id: 'discord',
            duration: 2
        }],
        desc: 'Play a devastating requiem that damages all enemies within range and applies Discord for 2 turns. The ultimate debuff anthem.'
    },

    // ── Freelancer T3 ──
    {
        id: 'wildcard',
        name: 'Wildcard',
        type: 'damage',
        cost: 8,
        equipCost: 5,
        dmg: 20,
        range: 3,
        kind: 'damage',
        damageType: 'magic',
        tier: 'III',
        school: 'Freelancer',
        jobPreference: ['Freelancer'],
        statusEffects: [{
            id: 'stun',
            duration: 1
        }],
        desc: 'Unleash a chaotic blast of unstable energy. Deals heavy magic damage with a chance to stun. Embraces the chaos.'
    }
];
const SPELL_BY_ID = Object.fromEntries(SPELL_LIBRARY.map(spell => [spell.id, spell]));

// ── SPELL EQUIPMENT REQUIREMENTS ──

// ── SPELL EQUIPMENT REQUIREMENTS ──
// Each entry: spell ID → array of requirement groups.
// ── SPELL EQUIP REQUIREMENTS — REMOVED ──
// Spells are now gated by job/classRestriction only. No weapon requirements.
// Kept as empty stubs so callers don't break.
const SPELL_EQUIP_REQUIREMENTS = {};

function equipmentMeetsSpellReq(equipment, spellId) { return true; }
function unitMeetsSpellEquipReq(unit, spellId) { return true; }


// ── WEAPON CATEGORIES ──
const WEAPON_CATEGORIES = {
    'iron_sword': 'sword',
    'iron_sword_l': 'sword',
    'revolver_r': 'revolver',
    'revolver_l': 'revolver',
    'arcane_staff': 'arcane_staff',
    'arcane_staff_r': 'arcane_staff',
    'healing_staff': 'healing_staff',
    'healing_staff_l': 'healing_staff',
    'combat_knife': 'knife',
    'combat_knife_l': 'knife',
    'frag_bomb': 'bomb',
    'frag_bomb_r': 'bomb',
    'iron_shield': 'shield',
    'iron_shield_r': 'shield',
    'tarot_cards': 'tarot',
    'tarot_cards_l': 'tarot',
    'wand_r': 'wand',
    'wand_l': 'wand',
    'scythe_r': 'scythe',
    'scythe_l': 'scythe',
    'wrench_r': 'wrench',
    'wrench_l': 'wrench',
    'sniper_rifle_r': 'sniper_rifle',
    'sniper_rifle_l': 'sniper_rifle',
    'plasma_gun_r': 'plasma_gun',
    'plasma_gun_l': 'plasma_gun',
    'laser_sword_r': 'laser_sword',
    'laser_sword_l': 'laser_sword'
};

function getUnitDominantWeapon(unit) {
    if (!unit?.equipment) return null;
    const hand = unit.dominantHand || 'right';
    const slot = hand === 'left' ? 'handL' : 'handR';
    const fallbackSlot = hand === 'left' ? 'handR' : 'handL';
    const itemId = unit.equipment[slot] || unit.equipment[fallbackSlot] || null;
    return itemId ? (WEAPON_CATEGORIES[itemId] || null) : null;
}


// ── COMBO ATTACK REGISTRY ──

// ── COMBO ATTACK REGISTRY ──
const COMBO_REGISTRY = {
    // ── Same-weapon combos (naturally strong) ──
    'sword|sword': {
        name: 'Cross Slash',
        desc: 'Two blades strike in an X pattern.',
        dmg: 32,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }]
    },
    'revolver|revolver': {
        name: 'Hail of Bullets',
        desc: 'A storm of lead from two gunslingers.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 3,
        hitDamages: [10, 10, 8]
    },
    'arcane_staff|arcane_staff': {
        name: 'Arcane Convergence',
        desc: 'Twin staves amplify a devastating spell.',
        dmg: 36,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }, {
            id: 'silence',
            duration: 1
        }]
    },
    'healing_staff|healing_staff': {
        name: 'Sanctified Wave',
        desc: 'Divine energy washes over the battlefield.',
        kind: 'healAll',
        heal: 28,
        range: 0
    },
    'knife|knife': {
        name: 'Dual Ambush',
        desc: 'Two agents strike from both sides.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }]
    },
    'bomb|bomb': {
        name: 'Cluster Bomb',
        desc: 'Combined explosives devastate an area.',
        dmg: 24,
        kind: 'aoe',
        damageType: 'physical',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'shield|shield': {
        name: 'Phalanx Guard',
        desc: 'An impenetrable shield wall.',
        kind: 'buff',
        range: 0,
        statusEffects: [{
            id: 'protect',
            duration: 2
        }]
    },

    // ── Cross-weapon combos ──
    'arcane_staff|revolver': {
        name: 'Bullet Storm',
        desc: 'Enchanted bullets rain down on the enemy.',
        dmg: 14,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'burn',
            duration: 1
        }]
    },
    'arcane_staff|healing_staff': {
        name: 'Life Siphon',
        desc: 'Drain an enemy\'s vitality and restore allies.',
        dmg: 20,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        comboHeal: 14
    },
    'arcane_staff|sword': {
        name: 'Spellblade',
        desc: 'A magic-infused melee strike.',
        dmg: 30,
        kind: 'damage',
        damageType: 'magic',
        range: 1,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }]
    },
    'arcane_staff|knife': {
        name: 'Shadow Bolt',
        desc: 'Dark magic guided by assassin precision.',
        dmg: 26,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }]
    },
    'arcane_staff|bomb': {
        name: 'Inferno Mine',
        desc: 'Arcane fire supercharges an explosive.',
        dmg: 22,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }]
    },
    'arcane_staff|shield': {
        name: 'Mana Barrier',
        desc: 'A protective arcane shield.',
        kind: 'shield',
        range: 2,
        shield: 20,
        shieldCapPct: 0.35
    },
    'healing_staff|revolver': {
        name: 'Holy Shot',
        desc: 'A blessed bullet that purifies.',
        dmg: 22,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        comboHeal: 10
    },
    'healing_staff|sword': {
        name: 'Crusader Strike',
        desc: 'A holy blade cleaves the unworthy.',
        dmg: 26,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        comboHeal: 12
    },
    'healing_staff|knife': {
        name: 'Mercy Kill',
        desc: 'Precise strike that channels life force.',
        dmg: 24,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        comboHeal: 8
    },
    'healing_staff|bomb': {
        name: 'Purifying Blast',
        desc: 'An explosion imbued with cleansing light.',
        dmg: 18,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        comboHeal: 8
    },
    'healing_staff|shield': {
        name: 'Blessed Aegis',
        desc: 'An unbreakable holy barrier.',
        kind: 'shield',
        range: 2,
        shield: 22,
        shieldCapPct: 0.40,
        comboHeal: 10
    },
    'knife|revolver': {
        name: 'Execute',
        desc: 'A lethal point-blank combination.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        statusEffects: [{
            id: 'marked',
            duration: 1,
            bonusDamage: 5
        }]
    },
    'bomb|revolver': {
        name: 'Blast & Shoot',
        desc: 'Detonate then pick off survivors.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 3,
        hitDamages: [16, 10]
    },
    'bomb|knife': {
        name: 'Sabotage',
        desc: 'Plant and detonate at close range.',
        dmg: 20,
        kind: 'aoe',
        damageType: 'physical',
        range: 2,
        aoeRadius: 1,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }]
    },
    'bomb|sword': {
        name: 'Breach & Clear',
        desc: 'Blast the defenses, then charge in.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }, {
            id: 'stagger',
            duration: 1
        }]
    },
    'bomb|shield': {
        name: 'Controlled Blast',
        desc: 'A shielded detonation for area denial.',
        dmg: 16,
        kind: 'aoe',
        damageType: 'physical',
        range: 2,
        aoeRadius: 1
    },
    'revolver|sword': {
        name: 'Gun & Blade',
        desc: 'Shoot then slash in one fluid motion.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 1,
        hitDamages: [14, 14]
    },
    'revolver|shield': {
        name: 'Cover Fire',
        desc: 'Suppressive fire from behind cover.',
        dmg: 20,
        kind: 'damage',
        damageType: 'physical',
        range: 3,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'shield|sword': {
        name: 'Shield Charge',
        desc: 'Bash with shield then slash with blade.',
        dmg: 24,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }]
    },
    'shield|knife': {
        name: 'Parry & Riposte',
        desc: 'Block the blow then counter-strike.',
        dmg: 22,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }]
    },

    // ── New weapon combos (Tarot, Wand, Scythe) ──
    'tarot|tarot': {
        name: 'Fate Unbound',
        desc: 'Two readers channel the threads of destiny.',
        dmg: 30,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'glare',
            duration: 2
        }]
    },
    'scythe|scythe': {
        name: "Reaper's Harvest",
        desc: 'Twin blades reap everything in their path.',
        dmg: 34,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        comboHeal: 16
    },
    'wand|wand': {
        name: 'Prismatic Surge',
        desc: 'Dual wands unleash a rainbow of restorative force.',
        kind: 'healAll',
        heal: 26,
        range: 0
    },
    'tarot|wand': {
        name: 'Arcane Reading',
        desc: 'Mystic cards guide destructive energy.',
        dmg: 18,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1
    },
    'tarot|scythe': {
        name: 'Death Card',
        desc: 'The reaper draws the final card.',
        dmg: 32,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'scythe|wand': {
        name: "Nature's Wrath",
        desc: 'Life and death magic intertwined.',
        dmg: 26,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'poison',
            duration: 2
        }]
    },
    'tarot|sword': {
        name: 'Fate Cleave',
        desc: 'The sword strikes where the cards foretell.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }]
    },
    'tarot|revolver': {
        name: 'Lucky Shot',
        desc: 'Fortune guides the bullet.',
        dmg: 24,
        kind: 'damage',
        damageType: 'physical',
        range: 3,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'tarot|healing_staff': {
        name: 'Fortune Heal',
        desc: 'Cards of fate mend the wounded.',
        kind: 'healAll',
        heal: 22,
        range: 0
    },
    'tarot|arcane_staff': {
        name: 'Astral Bolt',
        desc: 'Psychic energy amplified through arcane channels.',
        dmg: 30,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }]
    },
    'tarot|knife': {
        name: 'Phantom Blade',
        desc: 'The knife strikes from an impossible angle.',
        dmg: 26,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        statusEffects: [{
            id: 'glare',
            duration: 2
        }]
    },
    'tarot|shield': {
        name: 'Fate Shield',
        desc: 'The cards weave a barrier of probability.',
        kind: 'shield',
        range: 2,
        shield: 20,
        shieldCapPct: 0.35
    },
    'tarot|bomb': {
        name: 'Wild Card',
        desc: 'An explosive surprise drawn from the deck.',
        dmg: 20,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'scythe|sword': {
        name: 'Harvest Slash',
        desc: 'Two blades tear through defenses.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }],
        comboHeal: 8
    },
    'scythe|healing_staff': {
        name: 'Life Reap',
        desc: 'Harvest vitality and redistribute it.',
        dmg: 22,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        comboHeal: 18
    },
    'scythe|arcane_staff': {
        name: 'Soul Rend',
        desc: 'Arcane energy rips along the scythe arc.',
        dmg: 28,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }]
    },
    'scythe|revolver': {
        name: 'Grim Volley',
        desc: 'Reap and shoot in deadly rhythm.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 2,
        hitDamages: [14, 12]
    },
    'scythe|knife': {
        name: 'Shank & Reap',
        desc: 'A quick stab followed by a harvesting arc.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'poison',
            duration: 2
        }]
    },
    'scythe|shield': {
        name: 'Bulwark Harvest',
        desc: 'Defend and drain in one motion.',
        dmg: 20,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        comboHeal: 12
    },
    'scythe|bomb': {
        name: 'Blight Bomb',
        desc: 'Pestilent explosion from a cursed reaping.',
        dmg: 18,
        kind: 'aoe',
        damageType: 'physical',
        range: 2,
        aoeRadius: 1,
        statusEffects: [{
            id: 'poison',
            duration: 2
        }]
    },
    'wand|sword': {
        name: 'Enchanted Blade',
        desc: 'The wand empowers the sword with magic.',
        dmg: 28,
        kind: 'damage',
        damageType: 'magic',
        range: 1,
        comboHeal: 6
    },
    'wand|revolver': {
        name: 'Arcane Bullet',
        desc: 'Magic-charged rounds pierce through.',
        dmg: 24,
        kind: 'damage',
        damageType: 'magic',
        range: 3
    },
    'wand|healing_staff': {
        name: 'Twin Restoration',
        desc: 'Double the healing channels.',
        kind: 'healAll',
        heal: 30,
        range: 0
    },
    'wand|arcane_staff': {
        name: 'Mana Cascade',
        desc: 'Overwhelming arcane force.',
        dmg: 34,
        kind: 'damage',
        damageType: 'magic',
        range: 3
    },
    'wand|knife': {
        name: 'Venom Hex',
        desc: 'Cursed blade dripping with hex magic.',
        dmg: 24,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'poison',
            duration: 2
        }]
    },
    'wand|shield': {
        name: 'Ward Wall',
        desc: 'Magical barrier reinforced by steel.',
        kind: 'shield',
        range: 2,
        shield: 24,
        shieldCapPct: 0.40
    },
    'wand|bomb': {
        name: 'Hex Mine',
        desc: 'A magically primed explosive.',
        dmg: 20,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }]
    },

    // ── Wrench combos (Engineer) ──
    'wrench|wrench': {
        name: 'Double Build',
        desc: 'Two engineers construct a fortified turret.',
        kind: 'deployTurret',
        range: 2,
        turretHp: 35,
        turretDmg: 12,
        turretRange: 3
    },
    'wrench|sword': {
        name: 'Forge Strike',
        desc: 'A white-hot wrench blow.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }]
    },
    'wrench|shield': {
        name: 'Reinforce',
        desc: 'Hammer the shield into shape.',
        kind: 'shield',
        range: 2,
        shield: 22,
        shieldCapPct: 0.40
    },
    'wrench|revolver': {
        name: 'Rivet Gun',
        desc: 'Rapid-fire industrial projectiles.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 3,
        hitDamages: [12, 10]
    },
    'wrench|arcane_staff': {
        name: 'Mana Engine',
        desc: 'Mechanical magic amplification.',
        dmg: 28,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'wrench|healing_staff': {
        name: 'Field Repair',
        desc: 'Mend flesh and steel alike.',
        kind: 'healAll',
        heal: 22,
        range: 0
    },
    'wrench|knife': {
        name: 'Booby Trap',
        desc: 'A rigged blade surprises the enemy.',
        dmg: 24,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }]
    },
    'wrench|bomb': {
        name: 'Shaped Charge',
        desc: 'Precision-engineered explosion.',
        dmg: 26,
        kind: 'aoe',
        damageType: 'physical',
        range: 3,
        aoeRadius: 1
    },
    'wrench|tarot': {
        name: 'Fate Machine',
        desc: 'A device that bends probability.',
        dmg: 22,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'glare',
            duration: 2
        }]
    },
    'wrench|scythe': {
        name: 'Mechanical Harvest',
        desc: 'Industrial reaping.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        comboHeal: 10
    },
    'wrench|wand': {
        name: 'Arcane Spanner',
        desc: 'Magic-infused tools of creation.',
        dmg: 24,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'overclock',
            duration: 2
        }]
    },

    // ── Sniper Rifle combos ──
    'sniper_rifle|sniper_rifle': {
        name: 'Crossfire',
        desc: 'Two snipers triangulate a devastating shot.',
        dmg: 38,
        kind: 'damage',
        damageType: 'physical',
        range: 4,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }]
    },
    'sniper_rifle|revolver': {
        name: 'Overwatch',
        desc: 'Long and short range fire in perfect sync.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 4,
        hitDamages: [16, 12]
    },
    'sniper_rifle|knife': {
        name: 'Spotter Strike',
        desc: 'The spotter marks, the assassin finishes.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 3,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }]
    },
    'sniper_rifle|arcane_staff': {
        name: 'Enchanted Round',
        desc: 'A magically guided precision shot.',
        dmg: 32,
        kind: 'damage',
        damageType: 'magic',
        range: 4
    },
    'sniper_rifle|sword': {
        name: 'Bayonet Charge',
        desc: 'Close the distance with rifle and blade.',
        dmg: 26,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'sniper_rifle|shield': {
        name: 'Fortified Position',
        desc: 'Fire from behind an impenetrable shield.',
        dmg: 22,
        kind: 'damage',
        damageType: 'physical',
        range: 4,
        statusEffects: [{
            id: 'slow',
            duration: 1
        }]
    },
    'sniper_rifle|healing_staff': {
        name: 'Mercy Shot',
        desc: 'A blessed bullet that heals allies on hit.',
        dmg: 20,
        kind: 'damage',
        damageType: 'physical',
        range: 4,
        comboHeal: 14
    },
    'sniper_rifle|bomb': {
        name: 'Artillery Strike',
        desc: 'A planted charge detonated by precision shot.',
        dmg: 20,
        kind: 'aoe',
        damageType: 'physical',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'stagger',
            duration: 1
        }]
    },
    'sniper_rifle|tarot': {
        name: 'Fate Bullet',
        desc: 'Destiny guides the impossible shot.',
        dmg: 30,
        kind: 'damage',
        damageType: 'magic',
        range: 4,
        statusEffects: [{
            id: 'glare',
            duration: 2
        }]
    },
    'sniper_rifle|scythe': {
        name: 'Death From Afar',
        desc: 'The reaper marks from range, the scythe finishes.',
        dmg: 32,
        kind: 'damage',
        damageType: 'physical',
        range: 2,
        comboHeal: 10
    },
    'sniper_rifle|wand': {
        name: 'Hexed Scope',
        desc: 'Magical sight reveals and punishes.',
        dmg: 26,
        kind: 'damage',
        damageType: 'magic',
        range: 4,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }]
    },
    'sniper_rifle|wrench': {
        name: 'Jury-Rigged Shot',
        desc: 'A field-modified rifle fires a devastating round.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 3,
        statusEffects: [{
            id: 'jammed',
            duration: 2
        }]
    },

    // ── Plasma Gun combos ──
    'plasma_gun|plasma_gun': {
        name: 'Plasma Storm',
        desc: 'Twin plasma guns create an ionized maelstrom.',
        dmg: 18,
        kind: 'aoe',
        damageType: 'magic',
        range: 3,
        aoeRadius: 1,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }]
    },
    'plasma_gun|revolver': {
        name: 'Rapid Barrage',
        desc: 'Plasma and lead in rapid succession.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 3,
        hitDamages: [14, 12]
    },
    'plasma_gun|sniper_rifle': {
        name: 'Ionized Round',
        desc: 'A plasma-charged sniper round.',
        dmg: 34,
        kind: 'damage',
        damageType: 'magic',
        range: 4,
        statusEffects: [{
            id: 'burn',
            duration: 1
        }]
    },
    'plasma_gun|sword': {
        name: 'Plasma Edge',
        desc: 'Superheated blade cuts through anything.',
        dmg: 28,
        kind: 'damage',
        damageType: 'magic',
        range: 1,
        statusEffects: [{
            id: 'burn',
            duration: 2
        }]
    },
    'plasma_gun|arcane_staff': {
        name: 'Mana Cannon',
        desc: 'Arcane energy channeled through a plasma barrel.',
        dmg: 32,
        kind: 'damage',
        damageType: 'magic',
        range: 3,
        statusEffects: [{
            id: 'silence',
            duration: 1
        }]
    },
    'plasma_gun|knife': {
        name: 'EMP Stab',
        desc: 'Close-range plasma discharge after a knife strike.',
        dmg: 26,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'jammed',
            duration: 2
        }]
    },
    'plasma_gun|shield': {
        name: 'Energy Barrier',
        desc: 'Shield absorbs and redirects plasma energy.',
        kind: 'shield',
        range: 2,
        shield: 22,
        shieldCapPct: 0.35,
        statusEffects: [{
            id: 'protect',
            duration: 1
        }]
    },
    'plasma_gun|wrench': {
        name: 'Overcharged Turret',
        desc: 'Engineer overclocks a plasma-powered turret.',
        kind: 'deployTurret',
        range: 2,
        turretHp: 30,
        turretDmg: 14,
        turretRange: 3
    },

    // ── Laser Sword combos ──
    'laser_sword|laser_sword': {
        name: 'Twin Sabers',
        desc: 'Dual laser blades in a devastating flurry.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'magic',
        range: 1,
        hitDamages: [14, 14, 10]
    },
    'laser_sword|sword': {
        name: 'Blade Duel',
        desc: 'Steel and energy clash in a brutal exchange.',
        dmg: 30,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'guardBreak',
            duration: 1
        }]
    },
    'laser_sword|revolver': {
        name: 'Gun Kata',
        desc: 'Shoot and slash in a deadly dance.',
        dmg: 12,
        kind: 'multiHit',
        damageType: 'physical',
        range: 2,
        hitDamages: [14, 12]
    },
    'laser_sword|knife': {
        name: 'Shadow Cut',
        desc: 'A flickering blade and silent knife.',
        dmg: 28,
        kind: 'damage',
        damageType: 'physical',
        range: 1,
        statusEffects: [{
            id: 'marked',
            duration: 2,
            bonusDamage: 5
        }]
    },
    'laser_sword|shield': {
        name: 'Energy Parry',
        desc: 'Block with shield, riposte with laser.',
        dmg: 24,
        kind: 'damage',
        damageType: 'magic',
        range: 1,
        statusEffects: [{
            id: 'stun',
            duration: 1
        }]
    },
    'laser_sword|arcane_staff': {
        name: 'Force Blade',
        desc: 'Telekinetically wielded energy sword.',
        dmg: 32,
        kind: 'damage',
        damageType: 'magic',
        range: 2,
        statusEffects: [{
            id: 'burn',
            duration: 1
        }]
    }
};

// ── STATUS EFFECT DEFINITIONS ──
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
    // ════════════════════════════════════════════════════════════════
    // STATUS EFFECTS — unique icon/badge + animation above unit head
    // ════════════════════════════════════════════════════════════════
    burn: {
        icon: '🔥',
        glyph: '🔥',
        short: 'BRN',
        label: 'Burn',
        colorText: 'burning',
        kind: 'debuff',
        category: 'status',       // status | debuff | buff | display
        stack: 'max',
        dot: 3,
        spriteName: 'burn',       // R2 sprite: set full URL once uploaded
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/burn.png',
        iconSrc: createStatusIconDataUri('🔥', '#4a1f16', '#ffd3a8', '#ff7b4d'),
        onTurnStart(unit) {
            applyDamageToUnit(unit, 3, `Burn sears ${unitDisplayName(unit)}: `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false
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
        dot: 4,
        spriteName: 'poison',
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/poison.png',
        iconSrc: createStatusIconDataUri('☠', '#1c3421', '#d8ffd7', '#68d36f'),
        onTurnStart(unit) {
            applyDamageToUnit(unit, 4, `Poison harms ${unitDisplayName(unit)}: `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false
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
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/silence.png',
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
        skipTurn: true,
        spriteName: 'stun',
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/stun.png',
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
        apDrain: 1,               // lose 1 AP at turn start (not full skip)
        spriteName: 'stagger',
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/stagger.png',
        iconSrc: createStatusIconDataUri('💫', '#3e2e18', '#fff2da', '#ffb871'),
        onTurnStart(unit) {
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
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/marked.png',
        iconSrc: createStatusIconDataUri('🎯', '#4b1a24', '#ffe4e8', '#ff6d8d')
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
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/jammed.png',
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
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/drowning.png',
        iconSrc: createStatusIconDataUri('🌊', '#0a2540', '#c8e8ff', '#4a9eff'),
        onTurnStart(unit) {
            if (unitIsDeepWaterAdapted(unit)) return;
            const stacks = unit._drowningStacks || 1;
            const dmg = Math.min(20, 3 + stacks * 3);
            applyDamageToUnit(unit, dmg, `${typeof unitDisplayName === 'function' ? unitDisplayName(unit) : 'Unit'} is drowning (×${stacks}): `, {
                ignoreArmor: true,
                damageType: 'dot',
                consumeMarked: false
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
        spriteSrc: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Status/protect.png',
        iconSrc: createStatusIconDataUri('🛡', '#1b344d', '#ddf2ff', '#5fc7ff')
    },

    // ════════════════════════════════════════════════════════════════
    // DEBUFFS — stat arrow ▼ on affected stats, no unique icon
    // ════════════════════════════════════════════════════════════════
    guardBreak: {
        icon: '💔',
        glyph: '💔',
        short: 'GBR',
        label: 'Guard Break',
        colorText: 'guard broken',
        kind: 'debuff',
        category: 'debuff',
        stack: 'max',
        armorDelta: -2,
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
        armorDelta: -2,
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
        atkDelta: -3,
        armorDelta: -2,
        mpCostDelta: 2,
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

    // ════════════════════════════════════════════════════════════════
    // BUFFS — stat arrow ▲ on affected stats, no unique icon
    // ════════════════════════════════════════════════════════════════
    overclock: {
        icon: '⚙️',
        glyph: '⚙',
        short: 'OVR',
        label: 'Overclock',
        colorText: 'overclocked',
        kind: 'buff',
        category: 'buff',
        stack: 'max',
        atkDelta: 2,
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
        atkDelta: 3,
        armorDelta: 2,
        iconSrc: createStatusIconDataUri('🎵', '#3a2a18', '#fff0d6', '#d4a44a')
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
        atkDelta: 1,
        armorDelta: 1,
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
        armorDelta: 3,
        iconSrc: createStatusIconDataUri('🛡', '#1a2a3a', '#c8e8ff', '#5a9ad4')
    },

    // ════════════════════════════════════════════════════════════════
    // DISPLAY-ONLY — icons for combat log / UI, not real statuses
    // ════════════════════════════════════════════════════════════════
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
        atkDelta: 2,
        armorDelta: 1,
        moveDelta: 1,
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
        rangeDelta: 2,
        iconSrc: createStatusIconDataUri('🎯', '#1a2a3a', '#d6e8ff', '#5a8ad4')
    }
};
const STATUS_META = STATUS_DEFS;

// ── GOLD ECONOMY ──
const GOLD_PER_KILL = 10;
const GOLD_PER_ASSIST = 5;
const GOLD_PER_HOURGLASS = 5;
const GOLD_PASSIVE_PER_ROUND = 2;   // everyone gets a trickle

// ── NEXUS SYSTEM ──
const NEXUS_GOLD_PER_ROUND = 5;     // per captured nexus, per round
const NEXUS_CHANNEL_COST_AP = 1;
const NEXUS_CAPTURE_THRESHOLD = 6;   // progress needed to capture (tug-of-war: -6 to +6)
const NEXUS_ZONE_SIZE = 2;           // 2x2 tile zone (scales with map size in initFloors)

// ── SANCTUARY SYSTEM ──
const CHURCH_HEAL_PCT = 0.5;         // 50% HP/MP restored
const CHURCH_HEAL_PCT_FREE = 0.25;   // 25% if unit has no gold
const CHURCH_COST = 8;
const CHURCH_COST_AP = 1;

const SHOP_PRICES = {
    healPotion: 5,
    manaPotion: 5,
    scanner: 8,
    panacea: 12,
    warpStone: 15,
    humanBane: 6,
    divineBane: 6,
    unholyBane: 6,
    techBane: 6,
    anomalyBane: 6,
    alienBane: 6
};
const SHOP_SWAP_WEAPON_COST = 10;
const SHOP_SWAP_SPELL_COST = 8;

// ══════════════════════════════════════════════════════════════
// ── BOSS SYSTEM ──
// Three hidden bosses — one per floor. Neutral (player 0),
// hostile to both teams. 2×2 tile footprint. Killing blow
// team gets gold + a team-wide Slayer buff.
// ══════════════════════════════════════════════════════════════
const BOSS_DEFS = {
    hellspawn: {
        id: 'boss_hellspawn',
        name: 'Hellspawn',
        floor: 'underground',
        spawnRound: 5,
        types: ['unholy'],
        hp: 200, maxHp: 200,
        mp: 0, maxMp: 0,
        atk: 12, def: 10,
        move: 2, spd: 3,
        range: 1, awr: 3, int: 4,
        inspect: 0,
        goldReward: 50,        // split across killing team
        xpReward: 40,          // to killing unit
        buffId: 'bossSlayerMinor',
        spriteKey: 'monster_hellspawn',
        desc: 'A hulking abomination from the depths. Radiates hellfire.',
        passiveAbility: 'hellfire',   // AoE fire damage to adjacent units each round
        passiveDmg: 8
    },
    angel: {
        id: 'boss_angel',
        name: 'Celestial Guardian',
        floor: 'sky',
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
        passiveAbility: 'divineSmite',  // ranged holy blast on nearest unit each round
        passiveDmg: 10
    },
    abomination: {
        id: 'boss_abomination',
        name: 'The Abomination',
        floor: 'ground',
        spawnRound: 30,
        requiresOtherBossesDead: true,
        types: ['anomaly', 'unholy'],
        hp: 350, maxHp: 350,
        mp: 0, maxMp: 0,
        atk: 16, def: 14,
        move: 2, spd: 3,
        range: 2, awr: 4, int: 6,
        inspect: 0,
        goldReward: 100,
        xpReward: 60,
        buffId: 'bossSlayerMajor',
        spriteKey: 'monster_abomination',
        desc: 'The final horror. Born from the convergence of slain guardians.',
        passiveAbility: 'voidPulse',   // AoE damage in radius 2 each round
        passiveDmg: 12,
        passiveRadius: 2
    }
};

// Boss team buff status effects (applied to ALL living units on the killing team)
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
        duration: 999,   // effectively permanent
        stack: 'replace'
    },
    bossSlayerMajor: {
        label: 'Abomination Slayer',
        icon: '👹',
        short: 'Apex Slayer',
        kind: 'buff',
        category: 'buff',
        desc: '+4 ATK, +4 DEF, +1 MOV for the rest of the match.',
        atkBonus: 4,
        defBonus: 4,
        moveBonus: 1,
        duration: 999,
        stack: 'replace'
    }
};

// Gold reward for boss kill per team member (total / alive count)
const BOSS_GOLD_SPLIT_MODE = 'equal'; // 'equal' splits evenly, 'killer' gives all to killer

// ══════════════════════════════════════════════════════════════
// ── LEVELING V2 — SPELL LEARN ORDERS & SHOP PRICES ──────────
// ══════════════════════════════════════════════════════════════

const SPELL_SLOT_MAX = 6;

// Fixed auto-learn order per class (5 spells from main job).
// [Lv1a, Lv1b, Lv2, Lv3, Lv5] — Lv4 spell comes from secondary job.
const CLASS_SPELL_LEARN_ORDER = {
    'Gunslinger':  ['shoot', 'doubleShot', 'ricochet1', 'shootout', 'deadEye'],
    'Knight':      ['fortify', 'guardSlash', 'shieldBash', 'dragonSlash', 'judgment'],
    'Black Mage':  ['fire1', 'thunder1', 'thunderstorm', 'wallOfFire', 'meteor'],
    'White Mage':  ['heal1', 'radiantBolt', 'revive1', 'healAll', 'divineIntervention'],
    'Agent':       ['placeBomb', 'scanPulse', 'knifeThrow', 'sneakSlash', 'empBurst'],
    'Psychic':     ['glare', 'warpRune', 'teleport', 'psychosis', 'mindShatter'],
    'Harvester':   ['healingSeed', 'poisonSeed', 'lifeDrain', 'leechSeed', 'overgrowth'],
    'Engineer':    ['deployTurret', 'buildBridge', 'wrenchToss', 'overclock', 'siegeTurret'],
    'Bard':        ['warCry', 'discordance', 'lullaby', 'encore', 'requiem'],
    'Freelancer':  ['jackOfAll', 'improvise', 'reallyGoodPunch', 'mimic', 'wildcard'],
    'Pirate':      ['grapple', 'plunder', 'anchorToss', 'cannonBlast', 'broadside'],
    'Sniper':      ['spotter', 'steadyAim', 'precisionShot', 'camouflage', 'headshot'],
};

// Gold cost to buy spells from the Spell Shop (by tier)
const SPELL_SHOP_PRICES = {
    'I':   15,
    'II':  25,
    'III': 40,
};
