'use strict';
// Controlled production-boundary observations, never a match simulation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('./load-data').loadGameData();
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const battle = fs.readFileSync(process.env.EW_BATTLE_TEST_SOURCE || path.join(__dirname, 'battle.js'), 'utf8');
const map = fs.readFileSync(process.env.EW_MAP_TEST_SOURCE || path.join(__dirname, 'map.js'), 'utf8'), ai = read('ai.js');
function fn(src, name) {
    const start = src.indexOf('        function ' + name + '(');
    if (start < 0) throw Error('Missing function: ' + name);
    const lineEnd = src.indexOf('\n', start);
    if (src.slice(start, lineEnd).trimEnd().endsWith('}')) return src.slice(start, lineEnd);
    const end = src.indexOf('\n        }', lineEnd);
    if (end < 0) throw Error('Missing function end: ' + name);
    const code = src.slice(start, end + '\n        }'.length);
    new vm.Script(code); // Fail closed if source boundaries have changed.
    return code;
}
const mapNames = ['getLinePoints', 'isRangeBlockedByTerrain', 'verticalSightBlocked',
    '_inferStandingZ', '_hasBlockAt', '_towerBodyBlocksCell', '_isRayBlocked3D',
    'getColumn', 'getBlockAt', 'setBlockAt', 'removeBlockAt', '_syncColumnToLegacy',
    'getTerrainAt', 'setTerrainAt', 'getTerrainAt3D', 'getBaseHeightAt', 'getFloorBelowZ',
    'getTerrainRule', 'getObjectAt', 'setObjectAt', 'getObjectRule', 'isTerrainPassable'];
const battleNames = ['getTerrainMaterial', 'getTerrainHardness', 'spellBreachPower',
    '_breachWindowCheck', '_breachWallAt', '_tileHasTree', '_fellTreeAt', '_removePlantedTreeAt',
    '_doors', 'doorAt', 'doorBlocksSightBetween', 'damageDoorAt', 'breakDoorPair',
    '_lineLosBlocked', 'getLineSpellLaneOffsets'];
const prefix = fn(battle, '_applyLineDamage').split('            /* Phase 5 wave C')[0]
    + 'return {cells:_lineCells,hits:hitTargets.map(t=>t.id),bores:_bores};}';
const LIMITS = 'Actual map LOS, columns, hardness, breach/tree removal and door damage; controlled board. '
    + 'Stops before unit damage/aftermath. Water settling, turret/building/mirror damage, rendering, '
    + 'rewards and RNG are doubled; no deployed explosions, authored edge walls or full-match acceptance.';
function setup(options = {}) {
    const matrix = value => Array.from({length:9}, () => Array.from({length:9}, () => value));
    const unit = {id:'caster',player:options.player || 1,x:4,y:4,z:options.z || 0};
    const dx = options.dx ?? 1, dy = options.dy ?? 0;
    const target = {id:'target',player:3-unit.player,x:4+4*dx,y:4+4*dy,z:0,hp:100};
    const state = {units:[unit,target], doors:[],boardTerrain:matrix('grass'),boardObjects:matrix(null),boardHeights:matrix(0)};
    if (options.voxels) state.boardColumns = Array.from({length:9}, () => Array.from({length:9}, () => [{z:0,terrain:'grass'}]));
    const c = {state,window:{},console:{log(){},warn(){}},TERRAIN_RULES:vm.runInContext('TERRAIN_RULES',data),
        OBJECT_RULES:vm.runInContext('OBJECT_RULES',data), BREACH_CONFIG:vm.runInContext('BREACH_CONFIG',data),
        ENTROPY_PTS:{destructTerrain:1},bw:()=>9,bh:()=>9,
        isInside:(x,y)=>x>=0&&x<9&&y>=0&&y<9,
        unitAt:(x,y)=>state.units.find(u=>!u.dead&&u.x===x&&u.y===y)||null,
        isTowerTile:()=>false,engineRandInt:()=>0,liquidFamilyOf:()=>null,
        _skipVisuals:()=>true,coordLabel:(x,y)=>`${x},${y}`};
    for (const name of ['settleWaterAround','spawnMaterialDrops','addEntropy','_invalidateBoardGrid',
        'scheduleBoardRender','addLog','showFloatingTextAtTile','shakeBoard','damageTurretAt',
        'playSfx','_doorTouched','trackTilesChanged']) c[name] = () => {};
    vm.createContext(c);
    vm.runInContext(mapNames.map(n=>fn(map,n)).join('\n')+'\n'+battleNames.map(n=>fn(battle,n)).join('\n')+'\n'+prefix,c);
    const g = {state,bw:c.bw,bh:c.bh,isTerrainPassable:c.isTerrainPassable,isRangeBlockedByTerrain:c.isRangeBlockedByTerrain};
    c.window.GAME=g;
    const end = ai.lastIndexOf('})();');
    vm.runInContext(ai.slice(0,end)+'window.footprint=_lineFootprintAI;'+ai.slice(end),c);
    const spell = {...data.SPELL_BY_ID.racePlasmaCannon,...options.spell};
    function tile(step, terrain, height = 0) {
        const x=unit.x+step*dx,y=unit.y+step*dy;
        state.boardTerrain[y][x]=terrain;state.boardHeights[y][x]=height;
        if (state.boardColumns) state.boardColumns[y][x]=Array.from({length:height+1},(_,z)=>({z,terrain}));
        return {x,y};
    }
    function door(step,hp=3,owner=3-unit.player,open=false) {
        const d={id:'door'+step,pairId:'pair'+step,x:unit.x+step*dx,y:unit.y+step*dy,hp,maxHp:3,owner,open};
        state.doors.push(d); return d;
    }
    function run() {
        const before=JSON.stringify(state);
        const predicted=c.window.footprint(g,unit,spell,dx,dy);
        if (JSON.stringify(state)!==before) throw Error('Forecast mutated fixture');
        const actual=c._applyLineDamage(unit,spell,dx,dy,0,0);
        return {aiSeesTarget:predicted.some(t=>t.x===target.x&&t.y===target.y),
            engineHitsTarget:actual.hits.includes(target.id),engineBores:actual.bores,
            predicted:JSON.parse(JSON.stringify(predicted)),actual:JSON.parse(JSON.stringify(actual)),
            after:JSON.parse(JSON.stringify(state))};
    }
    return {c,state,unit,target,spell,tile,door,run};
}
function observations() {
    const cases = [
        ['clear flat',{},h=>{}],
        ['flat tree',{},h=>h.tile(1,'tree')],
        ['flat hard border',{},h=>h.tile(1,'wall')],
        ['voxel earth wall',{voxels:true},h=>h.tile(1,'grass',2)],
        ['voxel stone wall',{voxels:true},h=>h.tile(1,'cave_wall',2)],
        ['voxel earth tunnel lintel',{voxels:true},h=>h.tile(1,'grass',4)],
        ['two voxel earth walls',{voxels:true},h=>{h.tile(1,'grass',2);h.tile(2,'grass',2);}],
        ['three voxel earth walls',{voxels:true},h=>{for(let i=1;i<=3;i++)h.tile(i,'grass',2);}],
        ['adjacent shut enemy door',{},h=>h.door(1)],
        ['adjacent final-hit enemy door',{},h=>h.door(1,1)],
        ['second-cell shut enemy door',{},h=>h.door(2)],
        ['second-cell final-hit enemy door',{},h=>h.door(2,1)],
        ['adjacent friendly shut door',{},h=>h.door(1,3,h.unit.player)],
    ];
    return cases.map(([name,options,prepare])=>{const h=setup(options);prepare(h);const r=h.run();return {name,...r};});
}
if (require.main===module) console.log(JSON.stringify({baseline:'ed196c9e9ae1f47be0d870befd373f045adc4585',limitations:LIMITS,observations:observations()},null,2));
module.exports={setup,observations,LIMITS};
