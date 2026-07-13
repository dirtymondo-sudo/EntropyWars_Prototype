const _S = 'https://cdn.entropywars.net/Assets/Sprites';

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
  'swordfighter': 'female',
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

// Genders of `race` that have a rigged 3D model wired in RACE_MODELS_3D
// below. (The werewolf day form borrows the homosapien male model at render
// time, but his OWN male entry is what makes him 3D-ready here.)
function race3DGenders(race) {
  if (typeof RACE_MODELS_3D === 'undefined') return [];
  const set = RACE_MODELS_3D[race];
  return set ? Object.keys(set) : [];
}

// True when the race can appear on the board as a 3D model at all. The
// roster gates (isUnitUnlocked in data.js, the CPU pools in state.js, the
// shop in ui.js) all route through this so matches stay 3D vs 3D.
function isRace3DReady(race) {
  return race3DGenders(race).length > 0;
}

function getAvailableGendersForRace(race) {
  const rule = RACE_SPRITE_GENDERS[race];
  let list;
  if (rule === 'both') list = ['male', 'female'];
  else if (rule === 'female') list = ['female'];
  else list = ['male'];
  // 3D-ONLY ROSTER RULE (2026-07-06): if this race has any rigged 3D model,
  // only the genders that actually have one are playable — e.g. 'wizard'
  // offers only the witch until a male model ships. Races with no models at
  // all keep their sprite genders here; they are locked wholesale by
  // isUnitUnlocked() / the CPU pools instead (and campaign still renders
  // their sprites via this unfiltered list).
  const g3d = race3DGenders(race);
  if (g3d.length) {
    const only3d = list.filter(g => g3d.includes(g));
    if (only3d.length) list = only3d;
  }
  return list;
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
  // No homosapien swordmaster sprite set on R2 yet — the knight art is the
  // closest sword-and-armor stand-in for homosapiens who take the job.
  'Swordmaster': 'knight',
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

// ───────────────────────────────────────────────────────────────────────────
// Animated unit sprite sheets.
// Grid sheets (frames read left→right, top→bottom) played on a unit's battle
// billboard during actions. `attack` = damaging actions (basic attack +
// damaging spells); `spell` = non-damaging spells (e.g. Catgirl "Meow").
//   cols / rows = grid dimensions; frames = how many cells are actually used
//   (trailing cells may be empty — e.g. a 3×3 sheet with 8 frames).
// Frame stepping / texture handling lives in three-renderer.js; this is just
// the lookup table. Add a race here (and upload the sheets to R2) to give it
// animations — no other wiring needed.
// ───────────────────────────────────────────────────────────────────────────
// cols/rows/frames describe the `attack` sheet. When the `spell` sheet uses a
// different grid, add spellCols/spellRows/spellFrames to override it.
const RACE_SPRITE_ANIMATIONS = {
  'catgirl': {
    female: {
      // 1152×1152 sheets, 3×3 grid (384px cells); 8 frames used, last cell blank.
      attack: `${_S}/Races/catgirl/female/attack_animation_1.png`,
      spell:  `${_S}/Races/catgirl/female/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'bigfoot': {
    male: {
      // 3×3 grid; 8 frames used, last cell blank.
      attack: `${_S}/Races/bigfoot/male/attack_animation_1.png`,
      spell:  `${_S}/Races/bigfoot/male/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'grey': {
    male: {
      // 3×3 grid; 8 frames used, last cell blank.
      attack: `${_S}/Races/grey/male/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  'quarterback': {
    male: {
      // attack: 4×2 grid (8 cells, all used).
      attack: `${_S}/Races/quarterback/attack_animation_1.png`,
      // spell: 3×3 grid; 8 frames used, last cell blank.
      spell:  `${_S}/Races/quarterback/attack_animation_2.png`,
      cols: 4, rows: 2, frames: 8,
      spellCols: 3, spellRows: 3, spellFrames: 8,
    },
  },
  // Female Black Mage (Witch): 4×2 grid (8 cells). Male Wizard: 3×3 grid.
  'wizard': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/blackmage/attack_animation_1.png`,
      cols: 4, rows: 2, frames: 8,
    },
    male: {
      attack: `${_S}/Races/Homosapien/Male/blackmage/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Female Psychic (Telepath): 3×3 grid; 8 frames used, last cell blank.
  'telepath': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/psychic/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Female Knight: 3×3 grid; 8 frames used, last cell blank.
  'knight': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/knight/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Engineer (Mad Scientist), both genders: 3×3 grids; 8 frames, last cell blank.
  'mad scientist': {
    female: {
      attack: `${_S}/Races/Homosapien/Female/engineer/attack_animation_1.png`,
      spell:  `${_S}/Races/Homosapien/Female/engineer/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
    male: {
      attack: `${_S}/Races/Homosapien/Male/engineer/attack_animation_1.png`,
      spell:  `${_S}/Races/Homosapien/Male/engineer/attack_animation_2.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Male Agent (Men in Black): 3×3 grid; 8 frames used, last cell blank.
  'men in black': {
    male: {
      attack: `${_S}/Races/Homosapien/Male/agent/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Male Harbinger (Fortune Teller): 3×3 grid; 8 frames used, last cell blank.
  'fortune teller': {
    male: {
      attack: `${_S}/Races/Homosapien/Male/harbinger/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
  // Fairy (female): 3×3 grid; 8 frames used, last cell blank.
  'fairy': {
    female: {
      attack: `${_S}/Races/Fairy/female/attack_animation_1.png`,
      cols: 3, rows: 3, frames: 8,
    },
  },
};

function getRaceSpriteAnimations(race, gender) {
  const set = RACE_SPRITE_ANIMATIONS[race];
  if (!set) return null;
  // A race may define sheets for only some genders (e.g. only Female Knight).
  // Match the unit's gender exactly; never substitute another gender's sheet.
  if (gender) return set[gender] || null;
  return set[Object.keys(set)[0]] || null;
}

// ───────────────────────────────────────────────────────────────────────────
// Rigged 3D unit models (GLB).
// Races registered here render on the battle board as a real skinned 3D model
// instead of the flat sprite slab. Each entry names a base GLB (the rigged,
// textured character) plus one GLB per animation clip. Clips must be exported
// from the SAME character as the model — see the rig-mismatch warning at
// ANIM_CLIPS_3D below.
//   model        base GLB (mesh + skin + texture). We use the Idle export so
//                the idle clip ships with the mesh in one download.
//   clips        idle / walk / cast / death → GLB whose first animation is
//                that clip. `cast` also plays for basic attacks.
//   heightRatio  model height in tiles (1.0 = same height as the 128px
//                sprite slabs, i.e. identical to the non-3D characters).
//   yawOffset    radians added if the model doesn't face +Z at rest.
//   moveTimeScale / castTimeScale / deathTimeScale
//                clip speed multipliers (board moves are fast — the walk
//                cycle needs ~2x to keep up with the tween).
// The 2D sprite stays as the loading placeholder, the ghost-preview art and
// the fallback when GLTFLoader is unavailable. Set window.EW_DISABLE_3D_UNITS
// = true (console) to force sprites for A/B comparison.
// ───────────────────────────────────────────────────────────────────────────
// ⚠ HARD RULE (verified 2026-07): Meshy auto-rigs EVERY character with its
// own unique skeleton rest pose (same bone NAMES, different bone positions/
// orientations), and each clip bakes absolute bone transforms for the ONE
// character it was exported with. A clip only animates correctly on the
// character it was exported FROM — DIRECT cross-character playback warps the
// mesh. Two ways around it:
//   1. (preferred, 2026-07-10) the shared UAL animation library below —
//      three-renderer.js mathematically RETARGETS its clips onto each
//      character's own skeleton at load time, so unique rest poses are fine.
//   2. (legacy fallback) per-character Meshy exports: in Meshy, open the
//      character → apply each library animation → export "with skin" →
//      upload into that race's folder alongside its Character_output.
//
// Also: a `model` GLB must be the RIGGED export ("Character output" or any
// "withSkin" — it has bones + skin weights). The generate/texture stage
// GLBs are boneless static meshes that nothing can animate.
//
// ── ANIMATION ROLE GUIDE (Meshy library clip → game slot) ──────────────────
// Standard slot set every character should aim for. Meshy file names are
// `Meshy_AI_<character>_biped_Animation_<Clip>_withSkin.glb`; durations are
// library-wide constants (same for every character):
//   idle        Idle_N (any numbered idle; ~5–8s loops)
//   walk        Running (0.67s — preferred; board tweens are fast) or
//               Walking (1.07s) at a higher moveTimeScale
//   run         (animation-library only) multi-tile dash sprint + hub
//               free-roam run; Meshy sets fall back to a boosted walk
//   dodge       (animation-library only) evade roll during dodge tweens;
//               falls back to idle
//   jump        Regular_Jump (1.93s) — plays during jump arcs
//   hit         Hit_Reaction / Hit_Reaction_1 (1.67s) — damage flinch
//   death       Dead (3.0s, stays down — preferred) or Knock_Down (2.53s)
//   cast        REQUIRED generic fallback for every action animation
//   castMagic   Charged_Spell_Cast (2.7s) — damaging magic (damageType:'magic')
//   castSupport mage_soell_cast (2.3s) — heals/buffs/debuffs (staff wave)
//   castRanged  Cowboy_Quick_Draw_Shooting (7.33s) — guns/rifles/ray-guns and
//               any physical ranged hit; also basic attacks beyond melee reach
//   castMelee   sword slash / punch clips (none uploaded yet) — adjacent
//               physical strikes; falls back to `cast` + the engine lunge
//   castThrow   throw/pitch clips (none uploaded yet) — lobbed projectiles
//               (Quarterback footballs, grenades); falls back → castRanged
// Which slot plays for a given spell is decided by classifySpellAnimKind()
// below (called from battle.js triggerCastAnim). Missing slots fall back
// per-chain, ultimately to `cast`, then to the plain lunge/glow tween.
//
// BASIC ATTACKS (2026-07-11d): rigged models play their attack clip INSTEAD
// of the legacy lunge tween (the lunge only survives as the sprite/fallback
// path — see _syncCombatAnims). The clip family defaults to castMelee
// (adjacent) / castRanged (reach > 1), but a def can claim a character-
// appropriate flavor with `basicAttackKind: 'magic' | 'arrow' | 'punch' |
// 'claw' | 'throw' | 'ranged' | 'melee'` — casters zap, archers loose,
// brawlers punch, beasts rake, Santa lobs a present. battle.js
// triggerAttackAnim reads it off the unit's 3D def ('chop' overrides win).
// ─────────────────────────────────────────────────────────────────────────

// Spell/ability → animation category. Returns 'magic' | 'support' |
// 'ranged' | 'melee' | 'throw' | 'plant'. Keep this the single source of truth so
// secondary jobs stay consistent: a Warrior who learns Fireball still plays
// castMagic; a Black Mage swinging a wrench plays castMelee.
function classifySpellAnimKind(spell) {
  if (!spell) return 'melee';
  const text = ((spell.id || '') + ' ' + (spell.name || '') + ' '
              + (spell.projectileOverride || '')).toLowerCase();
  // Potions / consumables (battle.js item use fires a synthetic spell) —
  // UAL2 Consume swig via castConsume.
  if (/potion|elixir|panacea|stim\b|consume|drink/.test(text)) return 'consume';
  // Deployable traps / mines / turrets kneel and rig the device (UAL1
  // Fixing_Kneeling via castTrap). Runes (warpRune…) intentionally DON'T
  // match — they stay magic-cast flavored.
  if (/trap|snare|\bmine\b|contraption|deploy|sentry/.test(text)) return 'deploy';
  // Ramparts, every "…Slam" and stomps (Tremor/Cataclysm Stomp) — two-hand
  // charged ground slam.
  if (/rampart|slam\b|slan\b|stomp/.test(text)) return 'slam';   // raceChassisSlan typo is real
  // Seed/planting spells (Healing Seed, Poison Seed, Leech Seed…) kneel and
  // plant — the animation library's Farm_PlantSeed via the castPlant slot.
  if (/seed|sapling|sprout|plant(?!ation)/.test(text)) return 'plant';
  // Lobbed-object actions (footballs, grenades, bombs) read as a throw no
  // matter the damage type — the QB "just throws".
  if (/football|grenade|bomb(?!ard)|throw|toss|hurl|lob|spike/.test(text)) return 'throw';
  // Bow shots draw and loose (MAL Archery_Shot_1) whatever the damage type.
  if (/arrow|\bbow\b|archer/.test(text)) return 'arrow';
  // Kicks (Spartan_Kick) — check before the melee bucket.
  if (/\bkick\b/.test(text)) return 'kick';
  // Punches (UAL1 Punch_Cross) — jabs/hooks/uppercuts/fists read as a strike
  // whatever the damage type ("Rocket Fist", "Hydraulic Punch", "Robo Punch",
  // "Dragon Fist"…). 'hook' deliberately excluded (Harvest Hook is a pull).
  if (/punch|\bjab\b|uppercut|fist|knuckle|pummel|haymaker/.test(text)) return 'punch';
  // Claws / bites / scratches (UAL2 Zombie_Scratch rake) — bestial strikes
  // ("Demonic Claw", "Venom Fang", "Ninefold Scratch", "Pounce", bites…).
  if (/claw|scratch|\bbite\b|fang|talon|maul|pounce/.test(text)) return 'claw';
  const damaging = !!(spell.type === 'damage' || spell.dmg ||
      (Array.isArray(spell.hitDamages) && spell.hitDamages.length));
  if (!damaging) {
    // Heals/revives get the staff wave (castHeal) — before the raise check
    // so "Raise Dead"-style revives never read as terrain shaping.
    if (spell.type === 'heal'
        || /heal|cure|mend|regen|restor|revive|resurrect/.test(text)) return 'heal';
    // Terrain shaping — watchtowers, walls, raised ground → charged AOE cast.
    if (/watchtower|lookout|terraform|raise|wall of|bone wall|shield wall|fortress/.test(text)) return 'aoe';
    return 'support';                        // buffs, debuffs, marks
  }
  if (spell.damageType === 'magic') return 'magic';
  if (spell.damageType === 'physical') {
    if (/shot|shoot|gun|bullet|snipe|rifle|pistol|revolver|barrage|quick.?draw|dead.?eye/.test(text)
        || (spell.range || 1) >= 3) return 'ranged';
    return 'melee';
  }
  return 'magic';                            // damaging, untyped → magic burst
}

// ── SHARED ANIMATION LIBRARIES (Quaternius UAL + Meshy sniper MAL) ─────────
// THREE library GLBs animate every Meshy biped — three-renderer.js RETARGETS
// their clips onto each character's own rig at load time (world-rotation
// transfer + rest-pose direction calibration — see _libBakeClips there):
//   lib 0/1 — Quaternius Universal Animation Library (CC0, UE5-style rig,
//     NON-root-motion exports). Board tweens move the unit group; root motion
//     would double the travel.
//   lib 2 — MAL1_Sniper.glb: the 20 Meshy animations exported ONCE from the
//     male sniper (Assets/Models/Meshy_AI_sniper_biped_Animation_*_withSkin
//     .glb, 2026-07-11), consolidated offline into one 1.4MB animation-only
//     GLB (skeleton + clips, meshes/textures stripped; clip names = the R2
//     file stems). The retargeter treats a Meshy-named source rig exactly
//     like a UAL one (see _libEnsureSrc), so ONE Meshy character's exports
//     now animate EVERY character — download animations for one model,
//     never per character. In-place loops verified (no root drift).
//   • Adding a new 3D character = upload its Meshy `..._Character_output.glb`
//     and add a one-line `_mkUAL(folder, prefix, {heightRatio: …})` entry
//     below. NO per-character animation exports needed anymore.
//   • Existing characters keep their old Meshy clip URLs as an automatic
//     FALLBACK: if the library GLB fails to load or the bake throws, the
//     renderer silently loads the per-character clips exactly as before.
//   • Kill-switches: window.EW_DISABLE_ANIM_LIB = true (console) forces the
//     Meshy-clip fallback globally; per character pass { noAnimLib: true }.
// The library files live OUTSIDE the sprites folder at Assets/Models/.
// A slot's `lib` index picks the file.
const EW_ANIM_LIB_URLS = [
  'https://cdn.entropywars.net/Assets/Models/UAL1_Standard.glb',
  'https://cdn.entropywars.net/Assets/Models/UAL2_Standard.glb',
  'https://cdn.entropywars.net/Assets/Models/MAL1_Sniper.glb',
];

// Game slot → library clip (+ which library file) + timeScale. Durations are
// library constants, so the scales live here once instead of per character
// (played ≈ dur / ts). 2026-07-11 remap: the Meshy sniper clips (lib 2) are
// the new defaults for body language (idle/walk/run/jump/dodge/hit/death +
// the mage-cast trio); weapon actions (gun/sword/throw/plant) stay UAL.
//   idle Idle_5 1.9s (male; females get Idle_11 via _FEM_SLOT_DEFAULTS)
//   walk Walking 1.07s (→~0.52s ≈ 150ms/tile pace) · run Running 0.67s
//   jump Regular_Jump 1.93s (→0.6s hop) · dodge Block3 1.53s (→0.51s evade)
//   hit Hit_Reaction_1 1.27s (→0.6s flinch) · death Dead 3.0s (→1.58s,
//   stays down) · cast Spell_Simple_Shoot 0.5s (→1.0s generic fallback)
//   castMagic mage_soell_cast_3 3.37s (→1.3s damage cast) · castSupport
//   mage_soell_cast_7 2.73s (→1.19s buff/debuff) · castHeal mage_soell_cast
//   2.3s (→1.15s staff wave) · castRanged Pistol_Shoot 0.63s (→1.05s) ·
//   castMelee Sword_Attack 1.53s (→1.28s swing) · castThrow OverhandThrow
//   (UAL2) 1.33s (→1.1s) · castPlant Farm_PlantSeed (UAL2) 2.77s kneel
//   (→1.2s) · castArrow Archery_Shot_1 1.07s (→0.89s) · castKick
//   Spartan_Kick 1.47s (→0.73s) · castAOE Charged_Spell_Cast 2.7s (→1.23s
//   raise-terrain / big AOE) · castSlam Charged_Ground_Slam 3.03s (→1.26s
//   rampart / ground slams) · castConsume Consume (UAL2) 1.33s (→1.1s
//   potion swig). Spare lib-2 clips (wired per character or future slots):
//   Idle_10 (male brawler idle), Idle_11 / Walking_Woman (female defaults),
//   Cowboy_Quick_Draw_Shooting (cowboy castRanged), Face_Punch_Reaction
//   (heavy-hit, no engine hook yet), Fall3 (falling, no engine hook yet).
const UAL_SLOTS = {
  idle:        { clip: 'Idle_5',                 lib: 2, ts: 1.0  },
  walk:        { clip: 'Walking',                lib: 2, ts: 2.05 },
  run:         { clip: 'Running',                lib: 2, ts: 1.3  },
  jump:        { clip: 'Regular_Jump',           lib: 2, ts: 3.2  },
  dodge:       { clip: 'Block3',                 lib: 2, ts: 3.0  },
  hit:         { clip: 'Hit_Reaction_1',         lib: 2, ts: 2.1  },
  death:       { clip: 'Dead',                   lib: 2, ts: 1.9  },
  cast:        { clip: 'Spell_Simple_Shoot',     lib: 0, ts: 0.5  },
  castMagic:   { clip: 'mage_soell_cast_3',      lib: 2, ts: 2.6  },
  castSupport: { clip: 'mage_soell_cast_7',      lib: 2, ts: 2.3  },
  castHeal:    { clip: 'mage_soell_cast',        lib: 2, ts: 2.0  },
  castRanged:  { clip: 'Pistol_Shoot',           lib: 0, ts: 0.6  },
  castMelee:   { clip: 'Sword_Attack',           lib: 0, ts: 1.2  },
  castThrow:   { clip: 'OverhandThrow',          lib: 1, ts: 1.2  },
  castPlant:   { clip: 'Farm_PlantSeed',         lib: 1, ts: 2.3  },
  castArrow:   { clip: 'Archery_Shot_1',         lib: 2, ts: 1.2  },
  castKick:    { clip: 'Spartan_Kick',           lib: 2, ts: 2.0  },
  castAOE:     { clip: 'Charged_Spell_Cast',     lib: 2, ts: 2.2  },
  castSlam:    { clip: 'Charged_Ground_Slam',    lib: 2, ts: 2.4  },
  castConsume: { clip: 'Consume',                lib: 1, ts: 1.2  },
  // 2026-07-11b: castChop TreeChopping_Loop (UAL2) 0.97s (→0.81s — tree
  // chops + dig-tool ops, attack kind 'chop') · castTrap Fixing_Kneeling
  // (UAL1) 5.2s kneel-and-rig (→1.3s — deployable traps/mines/turrets,
  // spell kind 'deploy'; runes intentionally excluded) · block
  // Shield_OneShot (UAL2) 0.83s (→0.52s — zero-damage "blocks the hit",
  // hitFlash kind 'block').
  castChop:    { clip: 'TreeChopping_Loop',      lib: 1, ts: 1.2  },
  castTrap:    { clip: 'Fixing_Kneeling',        lib: 0, ts: 4.0  },
  block:       { clip: 'Shield_OneShot',         lib: 1, ts: 1.6  },
  // 2026-07-11c: hitHeavy Face_Punch_Reaction 2.87s (→0.87s reel — crits
  // ≥60 dmg / super-effective hits, hitFlash kind 'hitHeavy') · fall Fall3
  // 1.33s (→1.1s flail — forced groundings + enemy-caused fall damage).
  // pinHips: Fall3 bakes a 1.5×hips-height plunge into the clip; the board
  // tween owns the actual drop, so the bake pins the hips at rest height
  // and keeps only the flailing rotations.
  hitHeavy:    { clip: 'Face_Punch_Reaction',    lib: 2, ts: 3.3  },
  fall:        { clip: 'Fall3',                  lib: 2, ts: 1.2, pinHips: true },
  // 2026-07-11d: castPunch Punch_Cross (UAL1) 1.0s (→0.83s jab-cross) —
  // punch/fist/uppercut spells + 'punch'-flavored basic attacks · castClaw
  // Zombie_Scratch (UAL2) 1.3s (→0.87s rake) — claw/bite/scratch spells +
  // bestial basic attacks (kinds 'punch'/'claw' via classifySpellAnimKind /
  // def.basicAttackKind).
  castPunch:   { clip: 'Punch_Cross',            lib: 0, ts: 1.2  },
  castClaw:    { clip: 'Zombie_Scratch',         lib: 1, ts: 1.5  },
};
// Female body-language defaults — applied to every `female:` def after
// RACE_MODELS_3D is built (see _applyFemaleSlotDefaults) unless the
// character's own opts.lib already claims the slot.
const _FEM_SLOT_DEFAULTS = {
  idle: { clip: 'Idle_11',       lib: 2, ts: 1.0 },
  walk: { clip: 'Walking_Woman', lib: 2, ts: 1.9 },
};
// Shared per-def field objects (read-only in the renderer).
const _UAL_CLIPS = {}, _UAL_TS = {};
for (const _slot in UAL_SLOTS) {
  _UAL_CLIPS[_slot] = { clip: UAL_SLOTS[_slot].clip, lib: UAL_SLOTS[_slot].lib || 0 };
  if (UAL_SLOTS[_slot].pinHips) _UAL_CLIPS[_slot].pinHips = true;
  _UAL_TS[_slot] = UAL_SLOTS[_slot].ts;
}

// Registry entry builder. `anims` maps slot → Meshy library clip name; URLs
// become `<folder>/Meshy_AI_<prefix>_biped_Animation_<Clip>_withSkin.glb`.
// Defaults tuned to the library durations above (board action windows:
// move ~150ms/tile, cast ~1.2s, death 1.6s). Override per character via opts.
// Every entry also carries the shared-animation-library fields (animLib /
// libClips / libTimeScales) unless opts.noAnimLib — the renderer prefers the
// retargeted library clips and keeps `anims` as the fallback set.
function _mk3d(folder, prefix, anims, opts) {
  const F = `${_S}/Races/${folder}`;
  const clips = {};
  for (const slot in anims) {
    clips[slot] = `${F}/Meshy_AI_${prefix}_biped_Animation_${anims[slot]}_withSkin.glb`;
  }
  const def = Object.assign({
    model: `${F}/Meshy_AI_${prefix}_biped_Character_output.glb`,
    clips,
    animLib: EW_ANIM_LIB_URLS,
    libClips: _UAL_CLIPS,
    libTimeScales: _UAL_TS,
    // Relative on-board size. The renderer NORMALIZES every model to the same
    // rendered height (ts * UNIT_SPRITE_SIZE_RATIO * heightRatio), so a raw
    // Meshy bigfoot and fairy come out identical unless heightRatio differs.
    // Scale is RELATIVE, anchored to the male fortune teller = 1.0 (a normal
    // adult human male). Set per character via opts.heightRatio: humans ~1.0
    // (females a touch shorter ~0.94), small creatures < 1 (fairy 0.6, grey
    // 0.78), big ones > 1 (bigfoot 1.4, werewolf 1.3). Nameplate top + the
    // click pillar both derive from heightRatio, so plates float and clicks
    // land at the right height automatically.
    heightRatio: 1.0,
    yawOffset: 0,
    moveTimeScale: 1.3,   // Running 0.67s → ~0.52s/cycle
    castTimeScale: 2.0,   // Charged 2.7s → 1.35s; soell 2.3s → 1.15s
    deathTimeScale: 1.9,  // Dead 3.0s → ~1.58s (death window is 1.6s)
    hitTimeScale: 2.8,    // Hit_Reaction 1.67s → ~0.6s flinch
    jumpTimeScale: 3.2,   // Regular_Jump 1.93s → ~0.6s
  }, opts || {});
  if (def.noAnimLib) { delete def.animLib; delete def.libClips; delete def.libTimeScales; }
  // Per-character library flavor: opts.lib = { slot: {clip, lib, ts} }
  // overrides individual UAL_SLOTS entries (e.g. a knight idling with
  // Sword_Idle, the werewolf walking with Zombie_Walk_Fwd_Loop) while every
  // unlisted slot keeps the shared defaults.
  if (def.lib && def.libClips) {
    const lc = Object.assign({}, def.libClips), lt = Object.assign({}, def.libTimeScales);
    for (const slot in def.lib) {
      const o = def.lib[slot];
      lc[slot] = { clip: o.clip, lib: o.lib || 0 };
      if (o.pinHips) lc[slot].pinHips = true;
      if (o.ts) lt[slot] = o.ts;
    }
    def.libClips = lc; def.libTimeScales = lt;
  }
  // Remember which slots the character claimed itself so the gendered
  // defaults pass (_applyFemaleSlotDefaults) never stomps flavor overrides.
  def._libOverridden = def.lib ? Object.keys(def.lib) : [];
  delete def.lib;
  return def;
}

// Minimal builder for library-animated characters: the character only needs
// its rigged `..._Character_output.glb` on R2 — every animation comes from
// the shared library. Adding a new 3D character is ONE line:
//   'newrace': { male: _mkUAL('newrace/male', 'meshy_file_prefix', { heightRatio: 1.1 }) },
function _mkUAL(folder, prefix, opts) {
  return _mk3d(folder, prefix, {}, opts);
}

// Full uploaded-clip inventory per character lives in PLAYTEST_NOTES.md
// ("Rigged 3D unit models"). Slots not listed for a character below simply
// don't exist in its R2 folder yet — fallback chains cover them.
const _PSY_3D = `${_S}/Races/Homosapien/Female/psychic`;
const RACE_MODELS_3D = {
  // ── Homosapien sub-races (Races/Homosapien/<Gender>/<job folder>/) ──
  'fortune teller': {
    // "male_fortune_teller" — new 2026-07 model (replaced Fortune_teller_with_r).
    // ★ HEIGHT ANCHOR: heightRatio 1.0 = this character. All others scale from here.
    male: _mk3d('Homosapien/Male/harbinger', 'male_fortune_teller', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.0, basicAttackKind: 'magic' }),
    female: _mk3d('Homosapien/Female/harbinger', 'hot_attractive_fortun', {
      idle: 'Idle_3', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.95, basicAttackKind: 'magic' }),
  },
  'men in black': {
    female: _mk3d('Homosapien/Female/agent', 'beautiful_attractive_', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.95, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),   // quick-draw is 7.33s; show draw+shot fast
    // New male model (the old Men_in_Black_CIA_age files were deleted).
    male: _mk3d('Homosapien/Male/agent', 'men_in_black_male_ag', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.02, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),   // tall agent
  },
  // Female Psychic (Telepath) — pilot wiring + the 2026-07-05 Running/Hit
  // uploads (generic Meshy_AI_Animation_* names, no character prefix — her
  // folder predates the prefixed convention). Thoughtful_Walk stays on R2 as
  // a spare if the run doesn't suit her.
  'telepath': {
    female: {
      model: `${_PSY_3D}/Meshy_AI_psychic_female_with_d_biped_Character_output.glb`,
      clips: {
        idle:  `${_PSY_3D}/Meshy_AI_Animation_Idle_4_withSkin.glb`,
        walk:  `${_PSY_3D}/Meshy_AI_Animation_Running_withSkin.glb`,
        hit:   `${_PSY_3D}/Meshy_AI_Animation_Hit_Reaction_withSkin.glb`,
        cast:  `${_PSY_3D}/Meshy_AI_Animation_Charged_Spell_Cast_withSkin.glb`,
        death: `${_PSY_3D}/Meshy_AI_Animation_Knock_Down_withSkin.glb`,
      },
      animLib: EW_ANIM_LIB_URLS,
      libClips: _UAL_CLIPS,
      libTimeScales: _UAL_TS,
      heightRatio: 0.95,    // female human, a touch shorter than the anchor
      basicAttackKind: 'magic',   // psychic — basic attacks zap, never sword-slash
      yawOffset: 0,
      moveTimeScale: 1.3,   // Running 0.67s
      castTimeScale: 2.2,
      hitTimeScale: 2.8,
      deathTimeScale: 1.6,  // Knock_Down 2.53s
    },
    // Male Psychic (Telepath) — "male_psychic_trench" (2026-07-05 upload). Note
    // the doubled underscore in the file stem (…_trench__biped_…) → the _mk3d
    // prefix keeps a trailing underscore. Full standard clip set; no Face_Punch
    // hit export on R2 yet, so `hit` is omitted (falls back to the flinch tween).
    male: _mk3d('Homosapien/Male/psychic', 'male_psychic_trench_', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.0, basicAttackKind: 'magic' }),   // adult human male, at the anchor height
  },
  // Female Black Mage (Witch).
  'wizard': {
    female: _mk3d('Homosapien/Female/blackmage', 'young_female_witch', {
      idle: 'Idle_9', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast',
    }, { heightRatio: 0.94, basicAttackKind: 'magic' }),
  },
  // Female Shaman (Harvester) — "beautiful_attractive_" (note the doubled
  // underscore in her file stem …_attractive__biped_… → the _mk3d prefix keeps a
  // trailing underscore). A support/magic caster: Charged_Spell_Cast is her one
  // cast clip, serving generic + magic + (via fallback) support. No Regular_Jump
  // export on R2 yet, so `jump` is omitted (falls back to the arc tween).
  'shaman': {
    female: _mk3d('Homosapien/Female/harvester', 'beautiful_attractive_', {
      idle: 'Idle_7', walk: 'Running', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.94, basicAttackKind: 'magic' }),   // human female, a touch shorter than the anchor
  },
  // Engineers (Mad Scientist) — their "gun" cast is the ray-gun quick-draw.
  'mad scientist': {
    female: _mk3d('Homosapien/Female/engineer', 'female_hot_asian_scie', {
      idle: 'Idle_3', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.93, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),
    male: _mk3d('Homosapien/Male/engineer', 'mad_scientist', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.0, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),
  },
  // Gunslingers — the high-noon quick-draw (MAL lib 2) is their gun action,
  // per the 2026-07-11 slot spec ("Cowboy/Cowgirl/High Noon Shoot Gun").
  'cowboy': {
    female: _mk3d('Homosapien/Female/gunslinger', 'hot_attractive_cowgir', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.95,
         lib: { idle: { clip: 'Pistol_Idle_Loop' },
                castRanged: { clip: 'Cowboy_Quick_Draw_Shooting', lib: 2, ts: 5.0 } }, }),
    male: _mk3d('Homosapien/Male/gunslinger', 'gunslinger_cowboy', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.0,
         lib: { idle: { clip: 'Pistol_Idle_Loop' },
                castRanged: { clip: 'Cowboy_Quick_Draw_Shooting', lib: 2, ts: 5.0 } }, }),
  },
  // Female Knight — Thrust_Slash is the basic strike, Triple_Combo_Attack
  // the bigger generic cast flourish (spare alt idle on R2: Idle_8).
  'knight': {
    female: _mk3d('Homosapien/Female/knight', 'hot_attractive_female', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Triple_Combo_Attack', castMelee: 'Thrust_Slash',
    }, { castTimeScale: 2.2, heightRatio: 0.96,      // armored, sturdy
         lib: { idle: { clip: 'Sword_Idle' },        // fencer ready stance
                castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } } })
  },
  // Female Pirate — flintlock = quick-draw. (Same files are duplicated in
  // …/Female/raider; the pirate/ copies are wired.)
  'pirate': {
    female: _mk3d('Homosapien/Female/pirate', 'hot_female_pirate', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 0.95, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),
    // "Dashingly handsome swashbuckler" — same file set mirrored in
    // …/Male/raider.
    male: _mk3d('Homosapien/Male/pirate', 'dashingly_handsome_sw', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting', castRanged: 'Cowboy_Quick_Draw_Shooting',
    }, { castTimeScale: 5.0, heightRatio: 1.02, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),
  },
  // Homosapien (Freelancer) — also the werewolf's DAY form: getRace3DModel()
  // returns this male entry for any werewolf while getCurrentCyclePhase() is
  // 'day', and the beast model below at night. No cast/hit exports yet —
  // engine lunge/glow tweens cover actions.
  'homosapien': {
    male: _mk3d('Homosapien/Male/freelancer', 'normal_man', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', death: 'Dead',
    }, { heightRatio: 1.0 }),
  },

  // ── Non-homosapien races (Races/<race folder>/<gender>/) ──
  // Martian (Gunslinger, ranged) — "Green_martian". Ray-gun quick-draw is the
  // ranged cast; Charged_Spell_Cast covers any psychic/magic hit. Little green
  // man, so a touch taller than the classic grey (0.78) but well below humans.
  'martian': {
    male: _mk3d('martian/male', 'Green_martian', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting',
      castRanged: 'Cowboy_Quick_Draw_Shooting', castMagic: 'Charged_Spell_Cast',
    }, { castTimeScale: 5.0, heightRatio: 0.82, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),   // little green man
  },
  // Machine Elf (Engineer, specialist caster) — "DMT_clockwork_elf". A tiny
  // psychedelic clockwork entity: Charged_Spell_Cast is the generic/magic
  // burst, the ray-gun quick-draw covers ranged/tech hits.
  'machine elves': {
    male: _mk3d('machineelves/male', 'DMT_clockwork_elf', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castRanged: 'Cowboy_Quick_Draw_Shooting',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScales: { castRanged: 5.0 }, heightRatio: 0.72,
         basicAttackKind: 'magic' }),   // small clockwork elf — psychedelic zaps, not sword swings
  },
  // Nordic (Warrior, support) — "nordic_alien_male". His only action export
  // is the quick-draw, wired to castRanged ONLY so melee swings keep the
  // engine lunge tween instead of a gun draw.
  'nordic': {
    male: _mk3d('Nordic/Male', 'nordic_alien_male', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', castRanged: 'Cowboy_Quick_Draw_Shooting',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScales: { castRanged: 5.0 }, heightRatio: 1.08 }),   // tall blond alien
  },
  // Annunaki (Sniper, ranged) — "annunaki". Quick-draw is his basic/ranged
  // shot, Charged_Spell_Cast the magic burst, mage_soell_cast_3 (note the _3)
  // the support wave. No hit export → flinch tween.
  'annunaki': {
    male: _mk3d('annunaki/male', 'annunaki', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting',
      castRanged: 'Cowboy_Quick_Draw_Shooting', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast_3',
      // spare on R2: Walking, Knock_Down
    }, { castTimeScale: 5.0, castTimeScales: { castMagic: 2.0, castSupport: 2.0 },
         heightRatio: 1.35, lib: { idle: { clip: 'Pistol_Idle_Loop' } }, }),   // towering Sumerian god
  },
  // Demon (Black Mage, bruiser) — "red_demon". Charged_Spell_Cast covers the
  // generic + magic cast. MALE ONLY so far — the female demon has no model
  // and is filtered out by the 3D-only gender rule above.
  'demon': {
    male: _mk3d('Demon/Male', 'red_demon', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      // spare on R2: Walking, Knock_Down
    }, { heightRatio: 1.18,      // hulking horned demon
         basicAttackKind: 'claw',   // basic attacks rake with talons (castClaw)
         lib: { castMelee: { clip: 'Sword_Heavy_Combo', lib: 1, ts: 3.5 } } }),
  },
  // Half-Demon (Assassin, melee) — "hot_attractive_rich_f". No magic exports;
  // her strikes are brawler clips (uppercut / kick). Left_Uppercut is the
  // generic + melee cast. Imposing demonic woman → a hair taller than a plain
  // human female.
  'halfdemon': {
    female: _mk3d('halfdemon/female', 'hot_attractive_rich_f', {
      idle: 'Idle_7', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Left_Uppercut_from_Guard', castMelee: 'Left_Uppercut_from_Guard',
    }, { castTimeScale: 2.2, heightRatio: 0.98,      // statuesque half-demon
         lib: { castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  'fairy': {
    female: _mk3d('Fairy/female', 'young_fairy', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast',
      // spare emotes on R2: Mirror_Viewing, Wave_for_Help_1 (future victory/emote slots)
    }, { heightRatio: 0.6, basicAttackKind: 'magic' }),   // tiny winged sprite
  },
  'bigfoot': {
    male: _mk3d('bigfoot/male', 'bigfoot', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 1.4,      // towering cryptid
         lib: { idle: { clip: 'Idle_10', lib: 2 },                    // brawler sway
                castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  // Giant (Warrior, melee tank) — "ancient_giant". A brawler with charged
  // smash clips: Charged_Upward_Slash is the generic cast, Charged_Ground_Slam
  // the melee strike; Face_Punch_Reaction is the hit flinch. The tallest unit
  // on the board — well above bigfoot (1.4) and the werewolf (1.3).
  'giant': {
    male: _mk3d('Giant/male', 'ancient_giant', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Charged_Upward_Slash', castMelee: 'Charged_Ground_Slam',
    }, { castTimeScale: 2.2, heightRatio: 1.7,      // colossal ancient giant
         lib: { idle: { clip: 'Idle_10', lib: 2 },                    // brawler sway
                castMelee: { clip: 'Punch_Cross', ts: 0.9 } } }),
  },
  'grey': {
    male: _mk3d('grey/male', 'grey_alien', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      // spare on R2: Idle_15 (alt idle)
    }, { heightRatio: 0.78, basicAttackKind: 'magic' }),   // short classic grey alien
  },
  // Quarterback — Right_Hand_Sword_Slash doubles as his throwing motion
  // (footballs classify as 'throw'); Face_Punch_Reaction is the hit flinch.
  // Still no death export → death falls back to the sprite-style fade.
  'quarterback': {
    male: _mk3d('quarterback', 'football_quarterback', {
      idle: 'Idle_11', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      cast: 'Right_Hand_Sword_Slash', castThrow: 'Right_Hand_Sword_Slash',
    }, { castTimeScale: 2.2, heightRatio: 1.1,      // big athlete + pads
         basicAttackKind: 'throw',  // he just throws — footballs ARE his basic attack
         lib: { idle: { clip: 'Idle_10', lib: 2 } } }),                // brawler sway
  },
  // Female Atlantean — Swim_Idle as her resting loop (aquatic flavor).
  'atlantean': {
    female: _mk3d('atlantean/female', 'hot_attractive_atlant', {
      idle: 'Swim_Idle', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
    }, { heightRatio: 0.98,      // statuesque sea-dweller
         basicAttackKind: 'magic',  // tide-caller — basic attacks surge, no blades
         lib: { idle: { clip: 'Swim_Idle_Loop' } } }),
  },
  // Werewolf NIGHT form (the beast). The DAY form is the Homosapien Freelancer
  // male model — see getRace3DModel(), which swaps this out for the human model
  // while getCurrentCyclePhase() === 'day'.
  'werewolf': {
    male: _mk3d('Werewolf/male', 'werewolf', {
      idle: 'Idle_10', walk: 'Running', jump: 'Regular_Jump', hit: 'Face_Punch_Reaction',
      death: 'Dead', cast: 'Right_Hand_Sword_Slash', castMelee: 'Right_Hand_Sword_Slash',
      // spare on R2: Idle_11, Knock_Down
    }, { castTimeScale: 2.2, heightRatio: 1.3,      // large hulking beast
         lib: { idle: { clip: 'Zombie_Idle_Loop', lib: 1 },        // feral sway
                walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 },
                castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } } }),
  },
  // Catgirl — gun for ranged (native Gunslinger), left hook for melee,
  // backflip jump. Spare on R2: Right_Hand_Sword_Slash, Hit_Reaction, Regular_Jump.
  'catgirl': {
    female: _mk3d('catgirl/female', 'young_female_catgirl', {
      idle: 'Idle_5', walk: 'Running', jump: 'Backflip_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Cowboy_Quick_Draw_Shooting',
      castRanged: 'Cowboy_Quick_Draw_Shooting', castMelee: 'Left_Hook_from_Guard',
    }, { castTimeScale: 5.0, castTimeScales: { castMelee: 2.0 }, heightRatio: 0.88,   // petite
         lib: { idle: { clip: 'Pistol_Idle_Loop' },
                jump: { clip: 'NinjaJump_Start', lib: 1, ts: 1.6 },   // nimble leap
                castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  // Female Ki Fighter — punch combo as the generic cast, kung-fu punch for
  // melee, mage_soell_cast_3 (note the _3) for ki blasts / support, backflip
  // jump. Spare on R2: Punch_Forward_… (exact name unconfirmed).
  'ki fighter': {
    female: _mk3d('kifighter/female', 'attractive_beautiful_', {
      idle: 'Idle_6', walk: 'Running', jump: 'Backflip_Jump', hit: 'Hit_Reaction_1',
      death: 'Dead', cast: 'Punch_Combo_5', castMelee: 'Kung_Fu_Punch',
      castMagic: 'mage_soell_cast_3', castSupport: 'mage_soell_cast_3',
    }, { castTimeScale: 2.2, heightRatio: 0.93,
         lib: { jump: { clip: 'NinjaJump_Start', lib: 1, ts: 1.6 },   // nimble leap
                castMelee: { clip: 'Melee_Hook', lib: 1, ts: 0.45 } } }),
  },
  // Female Vampire (humanoid form only — bat-swarm form keeps its particle
  // build, the renderer skips models for it).
  'vampire': {
    female: _mk3d('vampire/female', 'beautiful_attractive_', {
      idle: 'Idle_6', walk: 'Running', jump: 'Regular_Jump', hit: 'Hit_Reaction',
      death: 'Dead', cast: 'Charged_Spell_Cast', castMagic: 'Charged_Spell_Cast',
      castSupport: 'mage_soell_cast_1',
    }, { heightRatio: 0.97,      // tall, elegant
         basicAttackKind: 'claw',   // fangs and nails, never a sword
         lib: { idle: { clip: 'Idle_FoldArms_Loop', lib: 1 },
                castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } } }),
  },
  // ── Sniper (marksman) — 2026-07-11. The male sniper IS the MAL library's
  // source character (MAL1_Sniper.glb was consolidated from his 20 clip
  // exports in Assets/Models/), so his model is his Idle_5 _withSkin export
  // there — no separate Character_output upload needed, and the library
  // clips retarget onto him 1:1. Wiring this entry is also what UNLOCKS the
  // race: 'marksman' has sat in ACCT_STARTER_UNITS behind the 3D-only gate.
  'marksman': {
    male: _mkUAL('marksman/male', 'sniper', {
      model: 'https://cdn.entropywars.net/Assets/Models/Meshy_AI_sniper_biped_Animation_Idle_5_withSkin.glb',
      heightRatio: 1.02,     // long-coat rifleman, a hair over the anchor
    }),
    // Female sniper (2026-07-11d batch) — lives in the race's SPRITE folder
    // (Homosapien/Female/sniper), unlike the male whose model sits in
    // marksman/male. Gun-user idle; rifle shots via the default castRanged.
    female: _mkUAL('Homosapien/Female/sniper', 'female_sniper_beauti', {
      heightRatio: 0.96,
      lib: { idle: { clip: 'Pistol_Idle_Loop' } },
    }),
  },

  // ── 2026-07-11d wave (user batch upload — HEAD-verified on R2) ────────────
  // Scarecrow (Harvester, support) — creepy field guardian: zombie sway idle,
  // raking claws for basic attacks (castClaw).
  'scarecrow': {
    male: _mkUAL('scarecrow/male', 'scarecrow', {
      heightRatio: 1.12,          // lanky, on a frame
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Zombie_Idle_Loop', lib: 1 },
             castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } },
    }),
  },
  // Santa Clause (White Mage, support) — jolly gift-lobber: the basic attack
  // is an overhand present toss (castThrow); staff waves cover the support kit.
  'santa clause': {
    male: _mkUAL('santaclause', 'Santa_Clause', {
      heightRatio: 1.08,          // big-bellied but human-scale
      basicAttackKind: 'throw',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },   // broad jolly sway
    }),
  },
  // Mermaid (White Mage, healer) — aquatic: swim-idle like the atlantean;
  // magic surges for basic attacks (no weapon on a tail).
  'mermaid': {
    female: _mkUAL('mermaid/female', 'hot_mermaid_girl', {
      heightRatio: 0.95,
      basicAttackKind: 'magic',
      lib: { idle: { clip: 'Swim_Idle_Loop', lib: 1 } },
    }),
  },
  // Anubis (Black Mage, caster) — "Anubis_Egyptian_dog_" (trailing _ is real:
  // the prompt ended with a space → doubled underscore in …dog__biped_…).
  // Towering jackal god; basic attacks zap (castMagic).
  'anubis': {
    male: _mkUAL('anubis/male', 'Anubis_Egyptian_dog_', {
      heightRatio: 1.15,
      basicAttackKind: 'magic',
    }),
  },
  // ── 2026-07-11e: the rest of the batch (file names user-provided from the
  // R2 dashboard, all HEAD-verified). Models live in each race's SPRITE
  // folder; prefixes are the Meshy prompt text. Trailing underscores are
  // real (prompt truncation → doubled underscore before _biped_).
  // Robin Hood (Sniper) — bow, not gun: basic attacks + ranged spells loose
  // arrows (MAL Archery_Shot_1).
  'robinhood': {
    male: _mkUAL('robinhood', 'archer_robin_hood_r', {
      heightRatio: 1.0,
      basicAttackKind: 'arrow',
      lib: { castRanged: { clip: 'Archery_Shot_1', lib: 2, ts: 1.2 } },
    }),
  },
  // Antperson (Harvester, bruiser) — mandible/claw strikes.
  'antperson': {
    male: _mkUAL('antperson/male', 'giant_ant_realistic', {
      heightRatio: 1.0,
      basicAttackKind: 'claw',
    }),
  },
  // Necromancer (Black Mage, caster) — death magic zaps.
  'necromancer': {
    female: _mkUAL('necromancer/female', 'hot_girl_necromancer', {
      heightRatio: 0.95,
      basicAttackKind: 'magic',
    }),
  },
  // Succubus (Psychic, support) — charm/psychic zaps.
  'succubus': {
    female: _mkUAL('succubus/female', 'hot_seductive_pink_su', {
      heightRatio: 0.98,
      basicAttackKind: 'magic',
    }),
  },
  // Barbarella (Agent, assassin) — retro ray-gun: shoots even point-blank.
  'barbarella': {
    female: _mkUAL('barbarella', 'hot_space_agent_girl_', {
      heightRatio: 0.95,
      basicAttackKind: 'ranged',
      lib: { idle: { clip: 'Pistol_Idle_Loop' } },
    }),
  },
  // King Arthur (Warrior, tank) — fencer stance + sword combos, like the
  // knight. Sprite folder is 'king'.
  'king arthur': {
    male: _mkUAL('king', 'king_arthur_king_of_', {
      heightRatio: 1.05,
      lib: { idle: { clip: 'Sword_Idle' },
             castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } },
    }),
  },
  // Mantid (Psychic, assassin) — raking forelimb strikes.
  'mantid': {
    male: _mkUAL('mantid/male', 'mantid_realistic', {
      heightRatio: 1.05,
      basicAttackKind: 'claw',
    }),
  },
  // Mech (Gunslinger, tank) — 3.5m walking weapons platform: shoots at any
  // range, towers over humans (giant is 1.7).
  'mech': {
    male: _mkUAL('mech/male', 'mecha_mech_battle_m', {
      heightRatio: 1.5,
      basicAttackKind: 'ranged',
    }),
  },
  // Minotaur (Raider, bruiser) — brawler sway + heavy fists.
  'minotaur': {
    male: _mkUAL('minotaur', 'minotaur_realistic', {
      heightRatio: 1.25,
      basicAttackKind: 'punch',
      lib: { idle: { clip: 'Idle_10', lib: 2 } },
    }),
  },
  // Mothman (Harbinger, support) — eerie psychic zaps.
  'mothman': {
    male: _mkUAL('mothman/male', 'mothman_cryptid_gian', {
      heightRatio: 1.15,
      basicAttackKind: 'magic',
    }),
  },
  // Reptilian (Agent, assassin) — in a business suit, strikes with claws.
  'reptilian': {
    male: _mkUAL('reptilian/male', 'reptilian_in_a_busine', {
      heightRatio: 1.1,
      basicAttackKind: 'claw',
    }),
  },
  // Nun / Priestess (homosapien White Mage) — holy zaps; heals get the
  // castHeal staff wave from the shared slots.
  'priest': {
    female: _mkUAL('Homosapien/Female/whitemage', 'sexy_nun_girl_realis', {
      heightRatio: 0.94,
      basicAttackKind: 'magic',
    }),
  },
  // Robot (Warrior, tank) — hydraulic haymakers.
  'robot': {
    male: _mkUAL('robot/male', 'futuristic_robot_rea', {
      heightRatio: 1.05,
      basicAttackKind: 'punch',
    }),
  },
  // Cyborg (Raider, bruiser) — augmented strikes.
  'cyborg': {
    female: _mkUAL('cyborg/female', 'hot_girl_futuristic_', {
      heightRatio: 0.97,
      basicAttackKind: 'punch',
    }),
  },
  // ── 2026-07-13 batch ──
  // Zombie (Raider/Bruiser, tank archetype) — shambles with the undead gait,
  // rakes with rotten nails.
  'zombie': {
    female: _mkUAL('zombie/female', 'female_zombie_pretty', {
      heightRatio: 0.96,
      basicAttackKind: 'claw',
      lib: { idle: { clip: 'Zombie_Idle_Loop', lib: 1 },
             walk: { clip: 'Zombie_Walk_Fwd_Loop', lib: 1, ts: 2.5 },
             castMelee: { clip: 'Zombie_Scratch', lib: 1, ts: 1.5 } },
    }),
  },
  // Swordfighter (Swordmaster, new race 2026-07-13) — pop-idol duelist:
  // fencer ready stance, real sword combos for melee strikes.
  'swordfighter': {
    female: _mkUAL('swordfighter/female', 'hot_girl_pop_idol_s', {
      heightRatio: 0.94,
      lib: { idle: { clip: 'Sword_Idle' },
             castMelee: { clip: 'Sword_Regular_Combo', lib: 1, ts: 2.4 } },
    }),
  },
  // Fallen Angel (Harbinger, caster) — corrupted grace, magic zaps.
  'fallen angel': {
    female: _mkUAL('fallenangel/female', 'fallen_angel_r', {
      heightRatio: 1.0,
      basicAttackKind: 'magic',
    }),
  },
};

// ── Gendered library defaults (2026-07-11) ─────────────────────────────────
// Every `female:` def idles/walks with the female Meshy clips (Idle_11 /
// Walking_Woman) unless the character claimed the slot itself via opts.lib
// (agent/cowgirl Pistol_Idle_Loop, vampire folded arms, atlantean swim…).
(function _applyFemaleSlotDefaults() {
  for (const race in RACE_MODELS_3D) {
    const def = RACE_MODELS_3D[race] && RACE_MODELS_3D[race].female;
    if (!def || !def.libClips) continue;
    const own = def._libOverridden || [];
    const lc = Object.assign({}, def.libClips), lt = Object.assign({}, def.libTimeScales);
    for (const slot in _FEM_SLOT_DEFAULTS) {
      if (own.indexOf(slot) >= 0) continue;
      const o = _FEM_SLOT_DEFAULTS[slot];
      lc[slot] = { clip: o.clip, lib: o.lib };
      lt[slot] = o.ts;
    }
    def.libClips = lc; def.libTimeScales = lt;
  }
})();

function getRace3DModel(race, gender) {
  if (typeof window !== 'undefined' && window.EW_DISABLE_3D_UNITS) return null;
  // Werewolf transformation: a human (Homosapien Freelancer male) by day,
  // the beast by night. The _computeUnitStructuralSerial() serial tags the
  // werewolf's tod, so the entry rebuilds — and re-resolves this model — on
  // every phase flip. Always the male freelancer, regardless of the unit's
  // gender, per the day-form design.
  if (race === 'werewolf' && typeof getCurrentCyclePhase === 'function'
      && getCurrentCyclePhase() === 'day') {
    const dayForm = RACE_MODELS_3D['homosapien'];
    if (dayForm && dayForm.male) return dayForm.male;
  }
  const set = RACE_MODELS_3D[race];
  if (!set) return null;
  // Exact gender match only — never put the male model on a female unit.
  if (gender) return set[gender] || null;
  return set[Object.keys(set)[0]] || null;
}

// ───────────────────────────────────────────────────────────────────────────
// HUD portraits — close-up 128×128 face art shown in the HUD panels, the
// turn-clock flanks, the horologe clock face + target menus, the far-zoom
// nameplates and the party-builder rail. Same exact-gender rule as the
// model/sheet registries; units without an entry fall back to their map
// sprite wherever portraits render.
//
// Art lives in the shared folder Assets/Sprites/character_portraits/
// <male|female>/<name>.png. Some file names are slang/gendered variants of
// the race ("glowie" = female men in black, "cowgirl", "witch", …) — every
// URL below was HEAD-verified live on R2 2026-07-07. To add one: upload a
// 128×128 png into that folder and list it here.
// ───────────────────────────────────────────────────────────────────────────
const _PORT = `${_S}/character_portraits`;
const _pm = (f) => `${_PORT}/male/${f}.png`;
const _pf = (f) => `${_PORT}/female/${f}.png`;
const RACE_PORTRAITS = {
  // ── homosapien sub-races ──
  'homosapien':     { female: _pf('freelancer') },          // no male file yet
  'pirate':         { male: _pm('pirate'),       female: _pf('pirate') },
  'knight':         { female: _pf('knight') },
  'shaman':         { male: _pm('harvester'),    female: _pf('harvester') },
  'mad scientist':  { male: _pm('madscientist'), female: _pf('madscientist') },
  'cowboy':         { male: _pm('cowboy'),       female: _pf('cowgirl') },
  'men in black':   { male: _pm('meninblack'),   female: _pf('glowie') },
  'telepath':       { female: _pf('psychic') },
  'marksman':       { male: _pm('sniper'),       female: _pf('sniper') },
  'priest':         { male: _pm('priest') },                // no priestess file yet
  'wizard':         { female: _pf('witch') },               // no male wizard file yet
  'fortune teller': {
    // ⚠ character_portraits has no male fortuneteller yet — he keeps his
    // original harbinger-folder portrait until one is uploaded.
    male: `${_S}/Races/Homosapien/Male/harbinger/portrait.png`,
    female: _pf('fortuneteller'),
  },

  // ── everyone else with art in the folder ──
  'nordic':      { male: _pm('nordic') },
  'djinn':       { male: _pm('djinn') },
  'demon':       { male: _pm('devil') },
  'quarterback': { male: _pm('quarterback') },
  'bigfoot':     { male: _pm('bigfoot') },
  'grey':        { male: _pm('grey') },
  'giant':       { male: _pm('giant') },
  'werewolf':    { male: _pm('werewolf') },
  'reptilian':   { male: _pm('reptilian') },
  'anubis':      { male: _pm('anubis') },
  'mantid':      { male: _pm('mantid') },
  'antperson':   { male: _pm('antperson') },
  'zombie':      { female: _pf('zombie') },
  'catgirl':     { female: _pf('catgirl') },
  'succubus':    { female: _pf('succubus') },
  'fairy':       { female: _pf('fairy') },
  'halfdemon':   { female: _pf('halfdemon') },
  'ki fighter':  { female: _pf('kifighter') },
  'valkraye':    { female: _pf('valkraye') },
};

function getUnitPortraitUrl(unit) {
  if (!unit || !unit.race) return null;
  const set = RACE_PORTRAITS[unit.race];
  if (!set) return null;
  return set[unit.gender || 'male'] || null;
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

const _T = 'https://cdn.entropywars.net/Assets/Sprites/terrain';
const _O = `${_T}/objects`;

/* Inline SVG thumbnail for the lamp-post object (editor palette only — the real
   in-game render is the authored 3D street-lamp model). Kept inline so the
   editor needs no extra uploaded asset. */
const _LAMP_POST_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<circle cx="32" cy="14" r="11" fill="rgba(255,214,130,0.30)"/>' +
    '<rect x="29" y="20" width="6" height="38" rx="2" fill="#2c303a"/>' +
    '<rect x="21" y="56" width="22" height="6" rx="2.5" fill="#1b1e24"/>' +
    '<path d="M25 20 H39 L36 12 H28 Z" fill="#3a404b"/>' +
    '<rect x="26.5" y="6" width="11" height="11" rx="2.5" fill="#ffe6a8" stroke="#b8893a" stroke-width="1.5"/>' +
    '<line x1="29" y1="8.5" x2="29" y2="14.5" stroke="#b8893a" stroke-width="0.8"/>' +
    '<line x1="35" y1="8.5" x2="35" y2="14.5" stroke="#b8893a" stroke-width="0.8"/>' +
    '</svg>'
);

/* Inline SVG thumbnail for the traffic-light object (editor palette only — the
   in-game render is the procedural 3D signal built by _buildTrafficLight3D in
   three-renderer.js: yellow pole + mast arm, lamps cycle between rounds). */
const _TRAFFIC_LIGHT_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<rect x="14" y="56" width="24" height="6" rx="2.5" fill="#3a3e46"/>' +
    '<rect x="23" y="18" width="6" height="40" rx="2" fill="#8b9098"/>' +
    '<rect x="26" y="12" width="20" height="5" rx="2.5" fill="#8b9098"/>' +
    '<rect x="38" y="14" width="16" height="34" rx="4" fill="#e0af2e" stroke="#8a6a1c" stroke-width="1.5"/>' +
    '<circle cx="46" cy="22" r="4.2" fill="#ff3b30"/>' +
    '<circle cx="46" cy="31" r="4.2" fill="#ffcc00"/>' +
    '<circle cx="46" cy="40" r="4.2" fill="#34c759"/>' +
    '</svg>'
);

/* Emoji-on-SVG palette thumbnails for 3D-only spell props (editor palette
   only — the in-game render is the procedural 3D builder in three-renderer.js).
   Inline data URIs, so no extra asset upload is needed. */
const _emojiPropIcon = (emoji) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">' +
    '<rect width="64" height="64" rx="10" fill="#2a2438"/>' +
    '<text x="32" y="45" font-size="34" text-anchor="middle">' + emoji + '</text></svg>'
);

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
    /* Lamp posts render in-game as the authored 3D street-lamp model
       (Assets/misc/streetlamp/Street Lamp.obj) — see _buildLampPostObj in
       three-renderer.js. These url icons are only the editor palette thumbnails
       (inline SVG, so no extra asset upload is needed). */
    lamp_post:    { url: _LAMP_POST_ICON, model3d: true },
    lamp_post_2:  { url: _LAMP_POST_ICON, model3d: true },
    /* Cosmetic traffic light — rendered in-game as a procedural 3D signal by
       _buildTrafficLight3D (three-renderer.js); its red/yellow/green lamps
       cycle between rounds. The url is only the editor palette thumbnail. */
    traffic_light:{ url: _TRAFFIC_LIGHT_ICON, model3d: true },
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
    tower_cube: { url: 'https://cdn.entropywars.net/Assets/Sprites/dragon-green.png' },
    /* Cosmetic grass tuft — rendered in-game as 3D billboard blades by
       _buildGrassTuft3D (three-renderer.js). The url is only the editor palette
       thumbnail; we reuse the grass_2 terrain sprite the blades are textured with. */
    grass_tuft:   { url: `${_T}/grass_2.png`, model3d: true },
    /* Cosmetic rock/boulder — rendered in-game as a 3D textured boulder by
       _buildRock3D (three-renderer.js). Per-placement texture variant
       (rocks_1..rocks_5) authored in the editor, like leaves for trees. The url
       is only the editor palette thumbnail (defaults to the rocks_1 sprite). */
    rock:         { url: `${_T}/rocks_1.png`, model3d: true },
    /* Cosmetic torch — rendered in-game as a real 3D wood-and-rope torch with a
       live flame + flickering point light by _buildTorch3D (three-renderer.js).
       The url is only the editor palette thumbnail (the legacy flat torch
       sprite). The mount variant lives in the object entry's generic texture
       slot (entry.leaf): 'floor' stands on the tile top, 'wall' hangs off the
       side of the neighbouring tile the entry's rot points at, Minecraft-style. */
    torch:        { url: `${_S}/torch.png`, model3d: true },
    /* 2026-07-08 — spell-prop 3D models exposed as placeable editor objects.
       In-game renders are the SAME procedural builders the spells use
       (three-renderer.js: _buildGravestone3D, _buildBonePile3D, _buildBoneWall3D,
       _buildAtlantisPillar3D, _buildTotemPole3D, _buildFederationBeacon3D).
       The urls are editor palette thumbnails only. */
    gravestone:        { url: _emojiPropIcon('🪦'), model3d: true },
    bone_pile:         { url: _emojiPropIcon('💀'), model3d: true },
    bone_wall:         { url: _emojiPropIcon('🦴'), model3d: true },
    atlantis_pillar:   { url: _emojiPropIcon('🏛️'), model3d: true },
    totem_pole:        { url: _emojiPropIcon('🪶'), model3d: true },
    federation_beacon: { url: _emojiPropIcon('🗼'), model3d: true },
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
    // Castle Fortress (knight spell) — impassable-height wall wearing the
    // brick texture instead of raw mountain rock.
    castle_wall:      [`${_T}/bricks_2.png`],
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
    /* Pale polished marble — texture-only key (not a placeable terrain);
       used by the 3D prop builders (thrones, statues, basilicas) which
       looked muddy wearing plain marble.png. */
    marble_light:     [`${_T}/marble_light.png`],
    cobblestone:      [`${_T}/cobblestone.png`],
    cobblestone_2:    [`${_T}/cobblestone_2.png`],
    leaves_2:         [`${_T}/leaves_2.png`],
    leaves_3:         [`${_T}/leaves_3.png`],
    leaves_4:         [`${_T}/leaves_4.png`],
    leaves_5:         [`${_T}/leaves_5.png`],

    // New terrain sprites (aluminium + checkerboard floor)
    aluminium:        [`${_T}/aluminium.png`],
    checkerboard:     [`${_T}/checkerboard.png`],

    // New terrain sprites (2026-06 R2 batch — dungeon / flesh / drywall + metal_3)
    dungeon:          [`${_T}/dungeon.png`],
    dungeon_2:        [`${_T}/dungeon_2.png`],
    dungeon_3:        [`${_T}/dungeon_3.png`],
    dungeon_4:        [`${_T}/dungeon_4.png`],
    flesh:            [`${_T}/flesh.png`],
    flesh_2:          [`${_T}/flesh_2.png`],
    flesh_3:          [`${_T}/flesh_3.png`],
    plague_flesh:     [`${_T}/flesh_2.png`],   // necromancer Plaguefield — spell-made pestilent meat
    drywall:          [`${_T}/drywall.png`],
    drywall_2:        [`${_T}/drywall_2.png`],
    drywall_3:        [`${_T}/drywall_3.png`],
    drywall_4:        [`${_T}/drywall_4.png`],
    metal_3:          [`${_T}/metal_3.png`],

    // 2026-07-08 full R2 terrain-folder registration — texture-only keys (not
    // placeable terrains) so _hzTex()/prop builders can wear any of them.
    // Textures are lazy-loaded on first use, so unused keys cost nothing.
    leather:          [`${_T}/leather.png`],
    leather_2:        [`${_T}/leather_2.png`],
    enamel_2:         [`${_T}/enamel_2.png`],
    mars:             [`${_T}/mars.png`],
    mars_2:           [`${_T}/mars_2.png`],
    fur:              [`${_T}/fur.png`],
    fur_2:            [`${_T}/fur_2.png`],
    fur_3:            [`${_T}/fur_3.png`],
    skin:             [`${_T}/skin.png`],
    rubber:           [`${_T}/rubber.png`],
    rubber_2:         [`${_T}/rubber_2.png`],
    damask:           [`${_T}/damask.png`],
    damask_2:         [`${_T}/damask_2.png`],
    damask_3:         [`${_T}/damask_3.png`],
    damask_4:         [`${_T}/damask_4.png`],
    floral:           [`${_T}/floral.png`],
    floral_2:         [`${_T}/floral_2.png`],
    diamond:          [`${_T}/diamond.png`],
    brokenglass:      [`${_T}/brokenglass.png`],
    gunmetal:         [`${_T}/gunmetal.png`],
    gunmetal_2:       [`${_T}/gunmetal_2.png`],
    copper:           [`${_T}/copper.png`],
    concrete_floor:   [`${_T}/concrete_floor.png`],
    checkerboard_2:   [`${_T}/checkerboard_2.png`],
    checkerboard_3:   [`${_T}/checkerboard_3.png`],
    drywall_5:        [`${_T}/drywall_5.png`],
    dirt_slope:       [`${_T}/dirt_slope.png`],
    grass_dark_fantasy: [`${_T}/grass_dark_fantasy.png`],
    rocks_dark_fantasy: [`${_T}/rocks_dark_fantasy.png`],
    ice_1:            [`${_T}/ice_1.png`],
    igloo:            [`${_T}/igloo.png`],
    latticegarden:    [`${_T}/latticegarden.png`],
    noise:            [`${_T}/noise.png`],
    tigerfur:         [`${_T}/tigerfur.png`],
    tigerfur_2:       [`${_T}/tigerfur_2.png`],
    tilefloor:        [`${_T}/tilefloor.png`],
    tilefloor_2:      [`${_T}/tilefloor_2.png`],
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
/* Twisted-rope strip (128×32) — wrapped around the 3D torch's lashing rings
   by _buildTorch3D (three-renderer.js). */
const ROPE_SPRITE_URL          = `${_S}/rope.png`;
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
    thunderstorm: 'https://cdn.entropywars.net/Assets/Sprites/object_thundercloud.png',
    bloodRain: typeof ICON_BLOOD_RAIN !== 'undefined' ? ICON_BLOOD_RAIN : 'https://cdn.entropywars.net/Assets/Sprites/weather_bloodrain.png'
};

const TORNADO_FRAME_COUNT = 99;
const TORNADO_FRAME_BASE = 'https://cdn.entropywars.net/Assets/Sprites/Effects/tornado/f.';
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
    scorched: [ 'https://cdn.entropywars.net/Assets/Sprites/terrain/scorched.png' ],
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

/* Trap sigils (2026-07-07 placeTrap arsenal) — inline SVG ground decals,
   rendered only for the trap's owner (same rule as warp runes). Keyed by
   trapType: spike / frost / tremor / magnet. */
const TRAP_TILE_SPRITES = {
    spike: [
        _terrainSvg(
            '<circle cx="32" cy="32" r="18" fill="none" stroke="rgba(180,180,170,0.4)" stroke-width="1.5" stroke-dasharray="5 4"/>' +
            '<path d="M32 20 L36 32 L28 32 Z" fill="rgba(200,200,190,0.55)"/>' +
            '<path d="M20 36 L30 38 L24 44 Z" fill="rgba(185,185,175,0.5)"/>' +
            '<path d="M44 36 L38 44 L34 37 Z" fill="rgba(185,185,175,0.5)"/>' +
            '<path d="M26 26 L38 26 L32 33 Z" fill="none" stroke="rgba(160,160,150,0.45)" stroke-width="1.2"/>' +
            '<circle cx="32" cy="32" r="2.5" fill="rgba(220,220,210,0.5)"/>'
        )
    ],
    frost: [
        _terrainSvg(
            '<g stroke="rgba(160,220,255,0.55)" stroke-width="1.6" fill="none">' +
            '<path d="M32 14 L32 50 M14 32 L50 32 M19 19 L45 45 M45 19 L19 45"/>' +
            '<path d="M32 18 L28 23 M32 18 L36 23 M32 46 L28 41 M32 46 L36 41"/>' +
            '<path d="M18 32 L23 28 M18 32 L23 36 M46 32 L41 28 M46 32 L41 36"/>' +
            '</g>' +
            '<circle cx="32" cy="32" r="4" fill="rgba(190,235,255,0.45)"/>'
        )
    ],
    tremor: [
        _terrainSvg(
            '<g stroke="rgba(235,150,60,0.55)" stroke-width="1.8" fill="none">' +
            '<path d="M32 32 L20 18 M32 32 L47 22 M32 32 L44 46 M32 32 L18 42"/>' +
            '<path d="M26 25 L23 26 M39 27 L40 30 M38 39 L35 41 M25 37 L26 40"/>' +
            '</g>' +
            '<circle cx="32" cy="32" r="5" fill="none" stroke="rgba(250,180,90,0.5)" stroke-width="1.6"/>' +
            '<circle cx="32" cy="32" r="2" fill="rgba(255,200,120,0.55)"/>'
        )
    ],
    magnet: [
        _terrainSvg(
            '<path d="M22 40 L22 26 A10 10 0 0 1 42 26 L42 40" fill="none" stroke="rgba(230,80,80,0.6)" stroke-width="5"/>' +
            '<rect x="19" y="38" width="6" height="6" fill="rgba(220,225,235,0.6)"/>' +
            '<rect x="39" y="38" width="6" height="6" fill="rgba(220,225,235,0.6)"/>' +
            '<path d="M18 20 L22 16 M46 20 L42 16 M32 12 L32 17" stroke="rgba(140,200,255,0.5)" stroke-width="1.5" fill="none"/>'
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
            'https://cdn.entropywars.net/Assets/Sprites/object_well.png'
        ],
        beanstalk: [
            'https://cdn.entropywars.net/Assets/Sprites/object_beanstalk.png'
        ],
        cave_entrance: [
            'https://cdn.entropywars.net/Assets/Sprites/object_caveentrance .png'
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
