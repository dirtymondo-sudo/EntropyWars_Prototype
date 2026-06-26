const _S = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites';

const RACE_PATH_RULES = {
  'werewolf':   { folder: 'Werewolf',   capGender: false },
  'giant':      { folder: 'Giant',      capGender: false },
  'fairy':      { folder: 'Fairy',      capGender: false },
  'nordic':     { folder: 'Nordic',     capGender: true },
  'homosapien': { folder: 'Homosapien', capGender: true },
  'pirate':     { folder: 'Homosapien', capGender: true },
  'knight':     { folder: 'Homosapien', capGender: true },
  'shaman':     { folder: 'Homosapien', capGender: true },
  'mad scientist': { folder: 'Homosapien', capGender: true },
  'cowboy':     { folder: 'Homosapien', capGender: true },
  'men in black': { folder: 'Homosapien', capGender: true },
  'telepath':   { folder: 'Homosapien', capGender: true },
  'marksman':   { folder: 'Homosapien', capGender: true },
  'priest':     { folder: 'Homosapien', capGender: true },
  'wizard':     { folder: 'Homosapien', capGender: true },
  'fortune teller': { folder: 'Homosapien', capGender: true },
  'demon':      { folder: 'Demon',      capGender: true },
  'demon prince':   { folder: 'demonprince',   capGender: false },
  'demon princess': { folder: 'demonprincess', capGender: false },
  'fallen angel':   { folder: 'fallenangel',   capGender: false },
  'cosmic wraith':  { folder: 'cosmicwraith',  capGender: false },
  'loch ness monster': { folder: 'lochnessmonster', capGender: false },

  'barbarella':     { folder: 'barbarella',    capGender: false },
  'black goo':      { folder: 'blackgoo',      capGender: false },
  'golem':          { folder: 'golem',         capGender: false },
  'honda civic':    { folder: 'hondacivic',    capGender: false },
  'ice queen':      { folder: 'icequeen',      capGender: false },
  'juggernaut':     { folder: 'juggernaut',    capGender: false },
  'ki fighter':     { folder: 'kifighter',     capGender: false },
  'king arthur':    { folder: 'king',          capGender: false },
  'king kong':      { folder: 'kingkong',      capGender: false },
  'minotaur':       { folder: 'minotaur',      capGender: false },
  'necromancer':    { folder: 'necromancer',    capGender: false },
  'occulus':        { folder: 'occulus',        capGender: false },
  'quarterback':    { folder: 'quarterback',   capGender: false },
  'robinhood':      { folder: 'robinhood',     capGender: false },
  'santa clause':   { folder: 'santaclause',   capGender: false },
  'super sentai':   { folder: 'sentai',        capGender: false },
  'symbiote':       { folder: 'symbiote',      capGender: false },
  'valkraye':       { folder: 'valkraye',      capGender: false },
  'watcher':        { folder: 'watcher',       capGender: false },
};

const RACE_SPRITE_GENDERS = {
  'homosapien': 'both',
  'pirate': 'both',
  'knight': 'both',
  'shaman': 'both',
  'mad scientist': 'both',
  'cowboy': 'both',
  'men in black': 'both',
  'telepath': 'both',
  'marksman': 'both',
  'priest': 'both',
  'wizard': 'both',
  'fortune teller': 'both',
  'nordic': 'both',
  'martian': 'both',
  'orb of light': 'both',
  'demon': 'both',
  'djinn': 'both',
  'angel': 'both',
  'ghost': 'both',
  'robot': 'both',
  'catgirl': 'female',
  'succubus': 'female',
  'ai': 'female',
  'android': 'female',
  'fairy': 'female',
  'siren': 'female',
  'gargoyle': 'both',
  'glitch': 'both',
  'mech': 'both',
  'seraphim': 'both',
  'zombie': 'both',
  'shadow entity': 'both',
  'cyborg': 'female',
  'demon prince': 'male',
  'demon princess': 'female',
  'dreameater': 'both',
  'fallen angel': 'both',
  'goatman': 'male',
  'halfdemon': 'both',
  'mermaid': 'female',
  'nephilim': 'both',
  'vampire': 'both',
  'voidweaver': 'male',
  'cosmic wraith': 'male',
  'superhero': 'both',

  'general': 'male',
  'droid': 'female',
  'antihero': 'male',
  'conspiracy theorist': 'male',
  'overlord': 'male',
  'chosen one': 'female',
  'politician': 'male',
  'atlantean': 'both',
  'dinosaur': 'male',
  'dragon': 'male',
  'ghoul': 'male',
  'gnome': 'male',
  'kaiju': 'male',
  'kraken': 'male',
  'loch ness monster': 'male',
  'yeti': 'male',

  'barbarella': 'female',
  'black goo': 'male',
  'golem': 'male',
  'honda civic': 'male',
  'ice queen': 'female',
  'juggernaut': 'male',
  'ki fighter': 'both',
  'king arthur': 'male',
  'king kong': 'male',
  'minotaur': 'male',
  'necromancer': 'both',
  'occulus': 'male',
  'quarterback': 'male',
  'robinhood': 'male',
  'santa clause': 'male',
  'super sentai': 'male',
  'symbiote': 'female',
  'valkraye': 'female',
  'watcher': 'male',

};

function getAvailableGendersForRace(race) {
  const rule = RACE_SPRITE_GENDERS[race];
  if (rule === 'both') return ['male', 'female'];
  if (rule === 'female') return ['female'];
  return ['male'];
}

const JOB_FOLDER_MAP = {
  'Warrior': 'knight',
  'Agent': 'agent',
  'Black Mage': 'blackmage',
  'White Mage': 'whitemage',
  'Gunslinger': 'gunslinger',
  'Harbinger': 'harbinger',
  'Sniper': 'sniper',
  'Psychic': 'psychic',
  'Raider': 'raider',
  'Harvester': 'harvester',
  'Engineer': 'engineer',
  'Freelancer': 'freelancer',
};

const _HERO_RACE_SPRITES = {
  'general': `${_S}/Races/maincharacters/generalvoss.png`,
  'droid': `${_S}/Races/maincharacters/aria.png`,
  'antihero': `${_S}/Races/maincharacters/epoch.png`,
  'conspiracy theorist': `${_S}/Races/maincharacters/harlanvox.png`,
  'overlord': `${_S}/Races/maincharacters/kael.png`,
  'chosen one': `${_S}/Races/maincharacters/morrigan.png`,
  'politician': `${_S}/Races/maincharacters/president.png`,
};

const _SINGLE_FILE_RACES = {
  'barbarella': 'barbarella.png',
  'black goo': 'blackgoo.png',
  'golem': 'golem.png',
  'honda civic': 'hondacivic.png',
  'ice queen': 'icequeen.png',
  'juggernaut': 'juggernaut.png',
  'king arthur': 'kingarthur.png',
  'king kong': 'kingkong.png',
  'minotaur': 'minotaur.png',
  'occulus': 'occulus.png',
  'quarterback': 'quarterback.png',
  'robinhood': 'robinhood.png',
  'santa clause': 'santaclause.png',
  'super sentai': 'sentaired.png',
  'symbiote': 'symbiote.png',
  'valkraye': 'valkraye.png',
  'watcher': 'watcher.png',
};

const HONDA_CIVIC_SPRITES = {
  idle: `${_S}/Races/hondacivic/hondacivic.png`,
  moving: `${_S}/Races/hondacivic/hondacivic_2.png`,
  combat: `${_S}/Races/hondacivic/transformer.png`,
};

const SENTAI_SPRITES = {
  red:    `${_S}/Races/sentai/sentaired.png`,
  blue:   `${_S}/Races/sentai/sentaiblue.png`,
  black:  `${_S}/Races/sentai/sentaiblack.png`,
  green:  `${_S}/Races/sentai/sentaigreen.png`,
  yellow: `${_S}/Races/sentai/sentaiyellow.png`,
  pink:   `${_S}/Races/sentai/sentaipink.png`,
  megazord: `${_S}/Races/sentai/megazord.png`,
};

const WEREWOLF_DAY_SPRITE_MALE   = `${_S}/Races/Werewolf/male/werewolf_day.png`;
const WEREWOLF_DAY_SPRITE_FEMALE = `${_S}/Races/Werewolf/female/werewolf_day.png`;

const FOOTBALL_SPRITE = `${_S}/football.png`;

function getR2RaceSpriteUrl(race, gender, cls) {
  if (!race) return null;
  if (_HERO_RACE_SPRITES[race]) return _HERO_RACE_SPRITES[race];

  if (_SINGLE_FILE_RACES[race]) {
    const rules = RACE_PATH_RULES[race];
    const raceFolder = rules ? rules.folder : race.replace(/ /g, '');
    return `${_S}/Races/${raceFolder}/${_SINGLE_FILE_RACES[race]}`;
  }

  if (race === 'ki fighter') {
    const available = getAvailableGendersForRace(race);
    const g = available.includes(gender) ? gender : available[0];
    return `${_S}/Races/kifighter/${g}/kifighter_${g}.png`;
  }
  if (race === 'necromancer') {
    const available = getAvailableGendersForRace(race);
    const g = available.includes(gender) ? gender : available[0];
    return `${_S}/Races/necromancer/${g}/necromancer_${g}.png`;
  }

  const available = getAvailableGendersForRace(race);
  const g = available.includes(gender) ? gender : available[0];
  const rules = RACE_PATH_RULES[race];

  const raceFolder = rules ? rules.folder : race.replace(/ /g, '');

  const genderFolder = (rules && rules.capGender)
    ? (g === 'male' ? 'Male' : 'Female')
    : g;

  const raceFile = race.replace(/ /g, '');

  const _HOMOSAPIEN_RACE_JOB_MAP = {
    'knight': 'knight',
    'shaman': 'harvester',
    'mad scientist': 'engineer',
    'cowboy': 'gunslinger',
    'men in black': 'agent',
    'telepath': 'psychic',
    'marksman': 'sniper',
    'priest': 'whitemage',
    'wizard': 'blackmage',
    'fortune teller': 'harbinger',
  };
  const _subRaceJob = _HOMOSAPIEN_RACE_JOB_MAP[race];
  if (race === 'homosapien' || race === 'pirate' || _subRaceJob) {
    const jobKey = _subRaceJob || JOB_FOLDER_MAP[cls] || 'freelancer';
    return `${_S}/Races/${raceFolder}/${genderFolder}/${jobKey}/homosapien_${g}_${jobKey}.png`;
  }

  return `${_S}/Races/${raceFolder}/${genderFolder}/${raceFile}_${g}.png`;
}

function getBattleMapSpriteUrl(unit) {
    if (!unit) return '';

    if (unit._spriteOverride) return unit._spriteOverride;

    if (unit.race === 'werewolf' && typeof getCurrentCyclePhase === 'function' && getCurrentCyclePhase() === 'day') {
        return unit.gender === 'female' ? WEREWOLF_DAY_SPRITE_FEMALE : WEREWOLF_DAY_SPRITE_MALE;
    }
    if (unit._heroSpriteUrl) return unit._heroSpriteUrl;
    if (unit.race) {
        const url = getR2RaceSpriteUrl(unit.race, unit.gender || 'male', unit.cls || 'Freelancer');
        if (url) return url;
    }
    return '';
}

const RACE_SPRITES = {
  'ai': `${_S}/ai.png`,
  'android': `${_S}/android.png`,
  'angel': `${_S}/angel.png`,
  'annunaki': `${_S}/annunaki.png`,
  'bigfoot': `${_S}/bigfoot.png`,
  'demon': `${_S}/demon.png`,
  'fairy': `${_S}/fairy.png`,
  'ghost': `${_S}/ghost.png`,
  'giant': `${_S}/giant.png`,
  'grey': `${_S}/grey.png`,
  'homosapien': `${_S}/homosapien.png`,
  'pirate': `${_S}/homosapien.png`,
  'knight': `${_S}/homosapien.png`,
  'shaman': `${_S}/homosapien.png`,
  'mad scientist': `${_S}/homosapien.png`,
  'cowboy': `${_S}/homosapien.png`,
  'men in black': `${_S}/homosapien.png`,
  'telepath': `${_S}/homosapien.png`,
  'marksman': `${_S}/homosapien.png`,
  'priest': `${_S}/homosapien.png`,
  'wizard': `${_S}/homosapien.png`,
  'fortune teller': `${_S}/homosapien.png`,
  'martian': `${_S}/martian.png`,
  'mech': `${_S}/mech.png`,
  'nordic': `${_S}/nordic.png`,
  'orb of light': `${_S}/orb_of_light.png`,
  'reptilian': `${_S}/reptilian.png`,
  'robot': `${_S}/robot.png`,
  'seraphim': `${_S}/seraphim.png`,
  'shadow entity': `${_S}/shadow_entity.png`,
  'skeleton': `${_S}/skeleton.png`,
  'skinwalker': `${_S}/skinwalker.png`,
  'succubus': `${_S}/succubus.png`,
  'zombie': `${_S}/zombie.png`,
  'werewolf': `${_S}/werewolf.png`,
  'gargoyle': `${_S}/gargoyle.png`,
  'djinn': `${_S}/djinn.png`,
  'anubis': `${_S}/anubis.png`,
  'catgirl': `${_S}/catgirl.png`,
  'mantid': `${_S}/mantid.png`,
  'antperson': `${_S}/antperson.png`,

  'mothman': `${_S}/mothman.png`,
  'siren': `${_S}/siren.png`,
  'scarecrow': `${_S}/scarecrow.png`,
  'glitch': `${_S}/glitch.png`,
  'machine elves': `${_S}/machine_elves.png`,
  'cyclops': `${_S}/cyclops.png`,
  'cyborg': `${_S}/cyborg.png`,
  'demon prince': `${_S}/demon_prince.png`,
  'demon princess': `${_S}/demon_princess.png`,
  'dreameater': `${_S}/dreameater.png`,
  'fallen angel': `${_S}/fallen_angel.png`,
  'goatman': `${_S}/goatman.png`,
  'halfdemon': `${_S}/halfdemon.png`,
  'mermaid': `${_S}/mermaid.png`,
  'nephilim': `${_S}/nephilim.png`,
  'vampire': `${_S}/vampire.png`,
  'voidweaver': `${_S}/voidweaver.png`,
  'cosmic wraith': `${_S}/cosmic_wraith.png`,
  'superhero': `${_S}/superhero.png`,

  'atlantean': `${_S}/atlantean.png`,
  'dinosaur': `${_S}/dinosaur.png`,
  'dragon': `${_S}/dragon.png`,
  'ghoul': `${_S}/ghoul.png`,
  'gnome': `${_S}/gnome.png`,
  'kaiju': `${_S}/kaiju.png`,
  'kraken': `${_S}/kraken.png`,
  'loch ness monster': `${_S}/loch_ness_monster.png`,
  'yeti': `${_S}/yeti.png`,

  'barbarella': `${_S}/barbarella.png`,
  'black goo': `${_S}/black_goo.png`,
  'golem': `${_S}/golem.png`,
  'honda civic': `${_S}/honda_civic.png`,
  'ice queen': `${_S}/ice_queen.png`,
  'juggernaut': `${_S}/juggernaut.png`,
  'ki fighter': `${_S}/ki_fighter.png`,
  'king arthur': `${_S}/king_arthur.png`,
  'king kong': `${_S}/king_kong.png`,
  'minotaur': `${_S}/minotaur.png`,
  'necromancer': `${_S}/necromancer.png`,
  'occulus': `${_S}/occulus.png`,
  'quarterback': `${_S}/quarterback.png`,
  'robinhood': `${_S}/robinhood.png`,
  'santa clause': `${_S}/santa_clause.png`,
  'super sentai': `${_S}/super_sentai.png`,
  'symbiote': `${_S}/symbiote.png`,
  'valkraye': `${_S}/valkraye.png`,
  'watcher': `${_S}/watcher.png`,

  'general': `${_S}/Races/maincharacters/generalvoss.png`,
  'droid': `${_S}/Races/maincharacters/aria.png`,
  'antihero': `${_S}/Races/maincharacters/epoch.png`,
  'conspiracy theorist': `${_S}/Races/maincharacters/harlanvox.png`,
  'overlord': `${_S}/Races/maincharacters/kael.png`,
  'chosen one': `${_S}/Races/maincharacters/morrigan.png`,
  'politician': `${_S}/Races/maincharacters/president.png`,
};

const EQUIP_SPRITES = {};

const RACE_HAND_GROUP = {
  'ai': null,
  'android': {
    left: `${_S}/android_hand_left.png`,
    right: `${_S}/android_hand_right.png`
  },
  'angel': {
    left: `${_S}/angel_hand_left.png`,
    right: `${_S}/angel_hand_right.png`
  },
  'annunaki': {
    left: `${_S}/annunaki_hand_left.png`,
    right: `${_S}/annunaki_hand_right.png`
  },
  'bigfoot': {
    left: `${_S}/bigfoot_hand_left.png`,
    right: `${_S}/bigfoot_hand_right.png`
  },
  'demon': {
    left: `${_S}/demon_hand_left.png`,
    right: `${_S}/demon_hand_right.png`
  },
  'fairy': {
    left: `${_S}/fairy_hand_left.png`,
    right: `${_S}/fairy_hand_right.png`
  },
  'ghost': null,
  'giant': null,
  'grey': {
    left: `${_S}/grey_hand_left.png`,
    right: `${_S}/grey_hand_right.png`
  },
  'homosapien': {
    left: `${_S}/homosapien_hand_left.png`,
    right: `${_S}/homosapien_hand_right.png`
  },
  'pirate': {
    left: `${_S}/homosapien_hand_left.png`,
    right: `${_S}/homosapien_hand_right.png`
  },
  'martian': {
    left: `${_S}/martian_hand_left.png`,
    right: `${_S}/martian_hand_right.png`
  },
  'mech': {
    left: `${_S}/mech_hand_left.png`,
    right: `${_S}/mech_hand_right.png`
  },
  'nordic': {
    left: `${_S}/nordic_hand_left.png`,
    right: `${_S}/nordic_hand_right.png`
  },
  'orb of light': null,
  'reptilian': {
    left: `${_S}/reptilian_hand_left.png`,
    right: `${_S}/reptilian_hand_right.png`
  },
  'robot': {
    left: `${_S}/robot_hand_left.png`,
    right: `${_S}/robot_hand_right.png`
  },
  'seraphim': {
    left: `${_S}/seraphim_hand_left.png`,
    right: `${_S}/seraphim_hand_right.png`
  },
  'shadow entity': null,
  'skeleton': {
    left: `${_S}/skeleton_hand_left.png`,
    right: `${_S}/skeleton_hand_right.png`
  },
  'skinwalker': {
    left: `${_S}/skinwalker_hand_left.png`,
    right: `${_S}/skinwalker_hand_right.png`
  },
  'succubus': {
    left: `${_S}/succubus_hand_left.png`,
    right: `${_S}/succubus_hand_right.png`
  },
  'zombie': {
    left: `${_S}/zombie_hand_left.png`,
    right: `${_S}/zombie_hand_right.png`
  },
  'werewolf': {
    left: `${_S}/werewolf_hand_left.png`,
    right: `${_S}/werewolf_hand_right.png`
  },
  'gargoyle': {
    left: `${_S}/gargoyle_hand_left.png`,
    right: `${_S}/gargoyle_hand_right.png`
  },
  'djinn': {
    left: `${_S}/djinn_hand_left.png`,
    right: `${_S}/djinn_hand_right.png`
  },

  'barbarella': null,
  'black goo': null,
  'golem': null,
  'honda civic': null,
  'ice queen': null,
  'juggernaut': null,
  'ki fighter': null,
  'king arthur': null,
  'king kong': null,
  'minotaur': null,
  'necromancer': null,
  'occulus': null,
  'quarterback': null,
  'robinhood': null,
  'santa clause': null,
  'super sentai': null,
  'symbiote': null,
  'valkraye': null,
  'watcher': null,
};

const RACE_WEAPON_ANCHORS = {
  'homosapien':      [10, 38, 50, 38],
  'pirate':          [10, 38, 50, 38],
  'nordic':          [10, 38, 50, 38],
  'annunaki':        [10, 38, 50, 38],
  'skinwalker':      [10, 38, 50, 38],
  'giant':           [8, 40, 52, 40],
  'bigfoot':         [8, 38, 52, 38],
  'angel':           [10, 38, 50, 38],
  'seraphim':        [10, 38, 50, 38],
  'demon':           [10, 36, 50, 36],
  'succubus':        [10, 38, 50, 38],
  'zombie':          [10, 38, 50, 38],
  'skeleton':        [10, 38, 50, 38],
  'reptilian':       [10, 38, 50, 38],
  'android':         [10, 38, 50, 38],
  'robot':           [10, 38, 50, 38],
  'mech':            [8, 38, 52, 38],
  'grey':            [14, 38, 46, 38],
  'martian':         [14, 38, 46, 38],
  'fairy':           [18, 38, 42, 38],
  'ai':              [14, 36, 46, 36],
  'ghost':           [12, 38, 48, 38],
  'shadow entity':   [12, 38, 48, 38],
  'orb of light':    [16, 36, 44, 36],
  'werewolf':        [10, 38, 50, 38],
  'gargoyle':        [8, 38, 52, 38],
  'djinn':           [12, 38, 48, 38],
};

const ICON_ATT_UP = `${_S}/icon_ATT_UP.png`;
const ICON_ATT_DOWN = `${_S}/icon_ATT_DOWN.png`;
const ICON_DEF_UP = `${_S}/icon_DEF_UP.png`;
const ICON_DEF_DOWN = `${_S}/icon_DEF_DOWN.png`;
const ICON_BLOOD_RAIN = `${_S}/icon_blood rain.png`;
const ICON_GOLD = `${_S}/icon_gold.png`;

const OBJ_INN = `${_S}/inn.png`;
const OBJ_SHOP = `${_S}/itemshop.png`;

const _T = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain';
const _O = `${_T}/objects`;

const OBJECT_SPRITES = {
    church:       { url: `${_O}/church_2.png` },
    shop:         { url: `${_O}/itemshop.png` },
    tree:         { url: `${_O}/tree.png` },
    ruins:        { url: `${_O}/ruins.png` },
    nexus:        { url: `${_O}/nexus.png` },
    nexus_cave:   { url: `${_O}/nexus.png` },
    nexus_sky:    { url: `${_O}/nexus.png` },
    mountain_top: { url: `${_O}/mountain_top.png` },
    beanstalk:    { url: `${_O}/object_beanstalk.png` },
    well:         { url: `${_O}/object_well.png` },
    cave_entrance:{ url: `${_O}/object_caveentrance .png` },
    barrier_1:    { url: `${_O}/barrier_1.png`, width: 128, height: 32 },
    barrier_2:    { url: `${_O}/barrier_2.png`, width: 128, height: 32 },
    barrier_3:    { url: `${_O}/barrier_3.png`, width: 128, height: 32 },
    barrier_4:    { url: `${_O}/barrier_4.png`, width: 128, height: 32 },
    barrier_5:    { url: `${_O}/barrier_5.png`, width: 128, height: 32 },
    column_1:     { url: `${_O}/column_1.png` },
    column_2:     { url: `${_O}/column_2.png` },
    column_3:     { url: `${_O}/column_3.png` },
    column_4:     { url: `${_O}/column_4.png` },
    building_1:   { url: `${_O}/building_1.png` },
    building_2:   { url: `${_O}/building_2.png` },
    building_3:   { url: `${_O}/building_3.png` },
    building_4:   { url: `${_O}/building_4.png` },
    building_5:   { url: `${_O}/building_5.png` },
    building_6:   { url: `${_O}/building_6.png` },
    building_7:   { url: `${_O}/building_7.png` },
    building_8:   { url: `${_O}/building_8.png` },
    building_9:   { url: `${_O}/building_9.png` },
    building_10:  { url: `${_O}/building_10.png` },
    building_11:  { url: `${_O}/building_11.png` },
    ancient_building: { url: `${_O}/ancient_building.png` },
    abandoned_building_1: { url: `${_O}/abandoned_building_1.png` },
    abandoned_building_2: { url: `${_O}/abandoned_building_2.png` },
    stairs:       { url: `${_O}/stairs.png` },
    stairs_2:     { url: `${_T}/barrier_passage.png` },
    pathway_1:    { url: `${_O}/pathway_1.png` },
    pathway_2:    { url: `${_O}/pathway_2.png` },
    church_1:     { url: `${_O}/church_1.png` },
    church_2:     { url: `${_O}/church_2.png` },
    poison_seed:  { url: `${_S}/poison_seed.png` },
    tree_2:       { url: `${_O}/tree_2.png` },
    tree_3:       { url: `${_O}/tree_3.png` },
    tree_4:       { url: `${_O}/tree_4.png` },
    tree_5:       { url: `${_O}/tree_5.png` },
    tree_6:       { url: `${_O}/tree_6.png` },
    tower_cube: { url: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/dragon-green.png' },
};

const TERRAIN_SPRITES = {
    grass:          [`${_T}/grass.png`],
    water:          [`${_T}/water.png`],
    deep_water:     [`${_T}/deep_water.png`],
    bridge:         [`${_T}/bridge.png`],
    mountain:       [`${_T}/mountain.png`],
    desert:         [`${_T}/desert.png`],
    tree:           [`${_T}/forest.png`],
    dirt:           [`${_T}/dirt.png`],
    lava:           [`${_T}/lava.png`],
    scorched:       [`${_T}/scorched.png`],
    poison:         [`${_T}/purple_grass.png`],
    cave_floor:     [`${_T}/cave_floor.png`],
    cave_wall:      [`${_T}/cave_wall.png`],
    cloud:          [`${_T}/cloud.png`],
    cloud_thick:    [`${_T}/cloud_thick.png`],
    cloud_gap:      [`${_T}/cloud_gap.png`],
    sky_ruin:       [`${_T}/sky_ruin.png`],
    barrier_passage:[`${_T}/barrier_passage.png`],
    cliff:          [`${_T}/cliff.png`],
    chasm:          [`${_T}/chasm.png`],
    void:           [`${_T}/void.png`],
    road:           [`${_T}/road.png`],
    ruins:          [`${_T}/ruins.png`],
    crystal:        [`${_T}/crystal.png`],
    obsidian:       [`${_T}/obsidian.png`],
    healing_spring: [`${_T}/healing_spring.png`],
    fog_wall:       [`${_T}/fog.png`],
    nexus:          [`${_T}/nexus.png`],
    nexus_cave:     [`${_T}/nexus.png`],
    nexus_sky:      [`${_T}/nexus.png`],
    rock:           [`${_T}/rock.png`],
    mushroom:       [`${_T}/rock.png`],
    sanctuary:        [`${_T}/sanctuary.png`],
    sanctuary_church: [`${_T}/sanctuary.png`],
    sanctuary_shop:   [`${_T}/sanctuary.png`],
    purple_grass:     [`${_T}/purple_grass.png`],
    grass_2:          [`${_T}/grass_2.png`],
    wasteland:        [`${_T}/wasteland.png`],
    mountain_top:     [`${_T}/mountain.png`],
    forest_2:         [`${_T}/forest_2.png`],
    mountain_2:       [`${_T}/mountain_2.png`],

    forest:           [`${_T}/forest.png`],
    ice:              [`${_T}/ice.png`],
    bricks_1:         [`${_T}/bricks_1.png`],
    bricks_2:         [`${_T}/bricks_2.png`],
    bricks_3:         [`${_T}/bricks_3.png`],
    wood_planks:      [`${_T}/wood_planks.png`],
    wood:             [`${_T}/wood.png`],
    rubble_1:         [`${_T}/rubble_1.png`],
    rubble_2:         [`${_T}/rubble_2.png`],
    rubble_3:         [`${_T}/rubble_3.png`],
    rubble_4:         [`${_T}/rubble_4.png`],
    poison_bog:       [`${_T}/poison_bog.png`],
    rocks_1:          [`${_T}/rocks_1.png`],
    rocks_2:          [`${_T}/rocks_2.png`],
    rocks_3:          [`${_T}/rocks_3.png`],
    rocks_4:          [`${_T}/rocks_4.png`],
    rocks_5:          [`${_T}/rocks_5.png`],
    rock_wall_1:      [`${_T}/rock_wall_1.png`],
    rock_wall_2:      [`${_T}/rock_wall_2.png`],
    dark_woods:       [`${_T}/dark_woods.png`],
    urban_wall:       [`${_T}/urban_wall.png`],
    grass_rocky:      [`${_T}/grass_rocky.png`],
    purple_bog:       [`${_T}/purple_bog.png`],
    urban_street:     [`${_T}/urban_street.png`],

    // New terrain sprites (Moon / Backrooms / Heaven map set)
    moon:             [`${_T}/moon.png`],
    carpet:           [`${_T}/carpet.png`],
    gold:             [`${_T}/gold.png`],
    metal:            [`${_T}/metal.png`],
    leaves:           [`${_T}/leaves.png`],
    wallpaper:        [`${_T}/wallpaper.png`],
    cloud_2:          [`${_T}/cloud_2.png`],

    // New terrain sprites (2026-06 R2 batch — variants + masonry)
    moon_2:           [`${_T}/moon_2.png`],
    moon_3:           [`${_T}/moon_3.png`],
    carpet_2:         [`${_T}/carpet_2.png`],
    carpet_3:         [`${_T}/carpet_3.png`],
    carpet_4:         [`${_T}/carpet_4.png`],
    gold_2:           [`${_T}/gold_2.png`],
    gold_3:           [`${_T}/gold_3.png`],
    metal_2:          [`${_T}/metal_2.png`],
    grass_3:          [`${_T}/grass_3.png`],
    grass_4:          [`${_T}/grass_4.png`],
    dirt_2:           [`${_T}/dirt_2.png`],
    dirt_3:           [`${_T}/dirt_3.png`],
    dirt_4:           [`${_T}/dirt_4.png`],
    marble:           [`${_T}/marble.png`],
    marble_2:         [`${_T}/marble_2.png`],
    cobblestone:      [`${_T}/cobblestone.png`],
    cobblestone_2:    [`${_T}/cobblestone_2.png`],
    leaves_2:         [`${_T}/leaves_2.png`],
    leaves_3:         [`${_T}/leaves_3.png`],
    leaves_4:         [`${_T}/leaves_4.png`],
    leaves_5:         [`${_T}/leaves_5.png`],
};

const TERRAIN_SIDE_SPRITES = {

    grass: 'dirt', grass_2: 'dirt', grass_rocky: 'dirt',
    purple_grass: 'dirt',

    void: null, chasm: null,

};

const BG_NEBULA = `${_S}/bg_nebula.png`;

const BAT_SPRITES = [
  `${_S}/Races/vampire/bat1.png`,
  `${_S}/Races/vampire/bat2.png`,
  `${_S}/Races/vampire/bat3.png`,
  `${_S}/Races/vampire/bat4.png`,
];

const SPIDER_SPRITE = `${_S}/spider_1.png`;
const SPIDERWEB_SPRITE = `${_S}/spiderweb_1.png`;

const MISSILE_SPRITE = `${_S}/missle.png`;
const NUCLEAR_MISSILE_SPRITE = `${_S}/nuclearmissle.png`;
const F22_SPRITE = `${_S}/f22.png`;

const BOSS_SPRITES = {
  'monster_hellspawn':   `${_S}/Monsters/monster_hellspawn.png`,
  'monster_angel':       `${_S}/Monsters/monster_angel.png`,
  'monster_abomination': `${_S}/Monsters/monster_abomination.png`
};

const TURRET_SPRITE_URL        = `${_S}/turret.png`;
const SIEGE_TURRET_SPRITE_URL  = `${_S}/siege_turret.png`;
const TURRET_2_SPRITE_URL      = `${_S}/turret_2.png`;
const TURRET_CANNON_SPRITE_URL = `${_S}/turret_arm.png`;
const FIVEG_TOWER_SPRITE_URL   = `${_S}/5g_radio_tower.png`;

const HEALING_SEED_SPRITE_URL  = `${_S}/healing_seed.png`;
const POISON_SEED_SPRITE_URL   = `${_S}/poison_seed.png`;
const LEECH_SEED_SPRITE_URL    = `${_S}/leech_seed.png`;
const POWDER_KEG_SPRITE_URL    = `${_S}/powder_keg.png`;
const BOMB_SPRITE_URL          = `${_S}/bomb.png`;
const WARD_SPRITE_URL          = `${_S}/torch.png`;
const BONE_WALL_SPRITE_URL     = `${_S}/bone_wall.png`;

const DRAGON_SPRITES = {
    green: `${_S}/dragon-green.png`,
    red:   `${_S}/dragon-red.png`
};

const UI_CURSOR_UNIT = `${_S}/ui/unit_cursor.png`;
const UI_CURSOR_MENU = `${_S}/ui/menu_cursor.png`;

const FOG_CLOUD_SPRITES = [
    `${_S}/64x64/terrain/fog.png`
];

const WEATHER_SPRITES = {
    thunderstorm: 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/object_thundercloud.png',
    bloodRain: typeof ICON_BLOOD_RAIN !== 'undefined' ? ICON_BLOOD_RAIN : 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/weather_bloodrain.png'
};

const TORNADO_FRAME_COUNT = 99;
const TORNADO_FRAME_BASE = 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/Effects/tornado/f.';
const TORNADO_FRAMES = [];
const TORNADO_IMAGES = [];
for (let i = 0; i < TORNADO_FRAME_COUNT; i++) {
    const idx = String(i).padStart(2, '0');
    const url = `${TORNADO_FRAME_BASE}${idx}.png`;
    TORNADO_FRAMES.push(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    TORNADO_IMAGES.push(img);
}

function _terrainSvg(inner) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' + inner + '</svg>'
    );
}

const SEED_TILE_SPRITES = {
    heal: [ HEALING_SEED_SPRITE_URL ],
    scorched: [ 'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/terrain/scorched.png' ],
    poison: [ POISON_SEED_SPRITE_URL ],
    leech: [ LEECH_SEED_SPRITE_URL ],
    warp: [
        _terrainSvg(
            '<defs><radialGradient id="wg1" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(160,100,255,0.3)"/><stop offset="100%" stop-color="rgba(100,60,200,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="20" fill="url(#wg1)"/>' +
            '<circle cx="32" cy="32" r="16" fill="none" stroke="rgba(160,110,255,0.5)" stroke-width="1.5" stroke-dasharray="4 3"/>' +
            '<circle cx="32" cy="32" r="10" fill="none" stroke="rgba(180,130,255,0.4)" stroke-width="1"/>' +
            '<path d="M32 16 L36 26 L32 22 L28 26 Z" fill="rgba(180,140,255,0.5)"/>' +
            '<path d="M48 32 L38 36 L42 32 L38 28 Z" fill="rgba(175,135,250,0.45)"/>' +
            '<path d="M32 48 L28 38 L32 42 L36 38 Z" fill="rgba(170,130,245,0.4)"/>' +
            '<path d="M16 32 L26 28 L22 32 L26 36 Z" fill="rgba(165,125,240,0.4)"/>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(200,160,255,0.45)"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(230,200,255,0.5)"/>'
        ),
        _terrainSvg(
            '<defs><radialGradient id="wg2" cx="32" cy="32" r="22" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(140,80,240,0.28)"/><stop offset="100%" stop-color="rgba(80,40,180,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="22" fill="url(#wg2)"/>' +
            '<polygon points="32,14 35,26 48,26 37,33 41,46 32,38 23,46 27,33 16,26 29,26" fill="none" stroke="rgba(160,110,255,0.45)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="12" fill="none" stroke="rgba(150,100,240,0.35)" stroke-width="1" stroke-dasharray="3 2"/>' +
            '<circle cx="32" cy="32" r="5" fill="rgba(180,140,255,0.4)"/>' +
            '<circle cx="32" cy="32" r="2.5" fill="rgba(220,190,255,0.5)"/>' +
            '<circle cx="24" cy="22" r="1" fill="rgba(200,170,255,0.4)"/>' +
            '<circle cx="40" cy="22" r="1" fill="rgba(200,170,255,0.35)"/>' +
            '<circle cx="24" cy="42" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="40" cy="42" r="1" fill="rgba(200,170,255,0.3)"/>'
        ),
        _terrainSvg(
            '<defs><radialGradient id="wg3" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0%" stop-color="rgba(150,90,250,0.3)"/><stop offset="100%" stop-color="rgba(90,50,190,0)"/>' +
            '</radialGradient></defs>' +
            '<circle cx="32" cy="32" r="20" fill="url(#wg3)"/>' +
            '<path d="M32 14 Q46 18 48 32 Q46 46 32 48 Q18 46 16 32 Q18 18 32 14" fill="none" stroke="rgba(160,110,255,0.4)" stroke-width="1.5"/>' +
            '<path d="M32 20 Q42 22 44 32 Q42 42 32 44 Q22 42 20 32 Q22 22 32 20" fill="none" stroke="rgba(170,125,255,0.35)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="7" fill="rgba(60,20,120,0.4)"/>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(40,10,100,0.5)"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(180,150,255,0.4)"/>' +
            '<circle cx="26" cy="18" r="1" fill="rgba(200,170,255,0.35)"/>' +
            '<circle cx="44" cy="28" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="38" cy="46" r="1" fill="rgba(200,170,255,0.3)"/>' +
            '<circle cx="18" cy="36" r="1" fill="rgba(200,170,255,0.3)"/>'
        )
    ]
};

if (typeof TERRAIN_SPRITES !== 'undefined') {
    const _legacySprites = {
        ice: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(180,220,240,0.25)"/><path d="M0 20 Q16 16 32 22 Q48 28 64 18" fill="none" stroke="rgba(220,240,255,0.4)" stroke-width="1.5"/><path d="M0 40 Q16 36 32 42 Q48 48 64 38" fill="none" stroke="rgba(200,230,250,0.35)" stroke-width="1"/><circle cx="20" cy="30" r="4" fill="rgba(240,250,255,0.2)"/>'),
            _terrainSvg('<rect width="64" height="64" fill="rgba(175,215,238,0.22)"/><path d="M0 30 Q20 24 40 32 Q56 38 64 28" fill="none" stroke="rgba(215,238,252,0.38)" stroke-width="1.5"/><circle cx="34" cy="18" r="5" fill="rgba(235,248,255,0.15)"/>'),
        ],
        well: [
            'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/object_well.png'
        ],
        beanstalk: [
            'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/object_beanstalk.png'
        ],
        cave_entrance: [
            'https://pub-c56e84829c9b4c98afb6a62ff33b2981.r2.dev/Assets/Sprites/object_caveentrance .png'
        ],
        tower_base: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(90,85,100,0.12)"/><rect x="4" y="4" width="56" height="56" rx="2" fill="rgba(100,95,110,0.08)" stroke="rgba(120,115,130,0.12)" stroke-width="0.5"/>')
        ],
        ladder_up: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(70,60,50,0.15)"/><rect x="20" y="8" width="4" height="48" fill="rgba(120,90,50,0.6)"/><rect x="40" y="8" width="4" height="48" fill="rgba(120,90,50,0.6)"/><rect x="20" y="16" width="24" height="3" fill="rgba(130,100,55,0.5)"/><rect x="20" y="28" width="24" height="3" fill="rgba(130,100,55,0.5)"/><rect x="20" y="40" width="24" height="3" fill="rgba(130,100,55,0.5)"/>')
        ],
        rope_up: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(70,60,50,0.15)"/><path d="M32 4 Q28 16 34 28 Q30 40 32 56" fill="none" stroke="rgba(160,130,80,0.6)" stroke-width="3"/><circle cx="32" cy="4" r="3" fill="rgba(140,110,60,0.5)"/>')
        ],
        mountain_top: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(160,165,175,0.15)"/><polygon points="20,52 32,12 44,52" fill="rgba(180,185,195,0.35)"/><polygon points="32,12 36,20 28,20" fill="rgba(240,245,255,0.4)"/><circle cx="14" cy="48" r="4" fill="rgba(170,175,185,0.25)"/>'),
        ],
        tree_top: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(50,120,40,0.15)"/><circle cx="32" cy="32" r="22" fill="rgba(55,140,45,0.35)"/><circle cx="22" cy="26" r="12" fill="rgba(60,150,50,0.3)"/><circle cx="42" cy="28" r="14" fill="rgba(52,135,42,0.32)"/>')
        ],
        sky_open: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(135,185,235,0.08)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.2)"/><circle cx="48" cy="44" r="1.5" fill="rgba(255,255,255,0.15)"/>')
        ],
        storm: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(80,80,110,0.2)"/><ellipse cx="32" cy="24" rx="20" ry="10" fill="rgba(100,100,140,0.25)"/><path d="M30 34 L26 44 L34 40 L28 56" fill="none" stroke="rgba(255,255,100,0.5)" stroke-width="2"/>')
        ],
        descent_point: [
            _terrainSvg('<rect width="64" height="64" fill="rgba(200,220,240,0.1)"/><ellipse cx="32" cy="32" rx="12" ry="12" fill="rgba(100,140,200,0.3)"/><ellipse cx="32" cy="32" rx="8" ry="8" fill="rgba(60,100,170,0.25)"/><path d="M28 28 L32 40 L36 28" fill="rgba(255,255,255,0.3)"/>')
        ]
    };
    for (const [k, v] of Object.entries(_legacySprites)) {
        if (!TERRAIN_SPRITES[k] || TERRAIN_SPRITES[k].length === 0) TERRAIN_SPRITES[k] = v;
    }
}
