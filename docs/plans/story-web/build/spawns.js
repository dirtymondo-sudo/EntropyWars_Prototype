/* THE "IN THE GAME NOW" BOARD (2026-11-18, mondo: "make another board ... that is how the game has everyone in their areas now").
   Read from data.js at build time: Disaster City's residents in their home district (HQ_CITY_RESIDENTS), every hand-placed NPC
   with a race (DOOR_HQ.rooms[*].npcSpots; in the city by the plot it stands on), every walk-in encounter table
   (HQ_AREA_ENCOUNTERS) per zone, and the story cast in DOOR HQ. Units only, no positions: the page lays it out. */
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function spawns(D) {
  const repo = path.join(__dirname, '..', '..', '..', '..');
  const { makeSandbox } = require(path.join(repo, 'load-data.js'));
  const sb = makeSandbox(); vm.runInContext(fs.readFileSync(path.join(repo, 'data.js'), 'utf8') + '\n;globalThis.__X = { HQ_AREA_ENCOUNTERS, HQ_CITY_RESIDENTS, DOOR_HQ, HQ_ZONE_MAP };', sb, { filename: 'data.js' });
  const X = sb.__X, H = X.DOOR_HQ, ZM = X.HQ_ZONE_MAP, PZ = D.places.zones;
  const RACE = Object.fromEntries(D.races.map(r => [r.k, r]));
  const raceId = (k, g) => { const r = RACE[k]; return r && r.v.length > 1 ? 'r:' + k + ':' + (r.v.some(v => v.g === g) ? g : r.dg) : 'r:' + k; };
  const zoneOf = room => { let r = room, n = 0; while (H.retired && H.retired[r] && n++ < 10) r = H.retired[r];
    for (const [k, z] of Object.entries(ZM.zones)) if (z.rooms.some(q => q.room === r)) return k;
    for (const [k, v] of Object.entries(H.hubs)) if ((v.rooms || []).includes(r) || v.room === r) return k;
    for (const [k, v] of Object.entries(H.hubs)) for (const s of v.sites || []) if (r.startsWith('site_' + s + '_')) return k;
    if (/^site_prebuilt_revenge_/.test(r)) return 'revenge';
    return r.startsWith('site_') ? null : 'hq'; };
  const nodes = {}, links = {}, has = new Set(); let li = 0;
  const grp = (id, name, src, parent, col) => { if (!nodes[id]) nodes[id] = { id, kind: 'custom', name, sub: '', shape: 'group', col, gk: 'place', faction: '', note: '', ...(src ? { src } : {}), ...(parent ? { parent } : {}) }; return id; };
  const unit = (race, g) => { if (!RACE[race]) return null; const id = raceId(race, g); if (!nodes[id]) { const r = RACE[race]; nodes[id] = { id, kind: 'race', race, ...(r.v.length > 1 ? { g: id.split(':')[2] } : {}), note: '' }; } return id; };
  const member = (u, g) => { if (!u || has.has(u + '>' + g)) return; has.add(u + '>' + g); const id = 'gm' + (li++); links[id] = { id, a: u, b: g, type: 'member', dir: 'ab', label: '', s: 1 }; };
  const zoneG = k => { if (k === 'hq') return grp('z_hq', 'DOOR HQ', 'map:hq', null, 11); if (k === 'revenge') return grp('z_revenge', 'The Revenge (pirate ship)', '', null, 1);
    const i = PZ.findIndex(q => q.k === k); return grp('z_' + k, i >= 0 ? PZ[i].n : k, 'map:' + k, null, Math.max(0, i) % 11); };
  const C0 = ZM.zones.city.rooms[0], distName = Object.fromEntries(PZ.find(z => z.k === 'city').d.map(d => [d.k, d.n])), plotDist = {};
  C0.plots.forEach(p => { plotDist[p[0]] = p[2]; });
  const distG = d => distName[d] ? grp('d_city_' + d, distName[d], 'map:city:' + d, zoneG('city'), Object.keys(distName).indexOf(d) % 11) : null;
  const plotAt = (x, z) => { const i = Math.floor((x - C0.ox) / ZM.plot), j = Math.floor((z - C0.oz) / ZM.plot); const p = C0.plots.find(q => q[3] === i && q[4] === j); return p ? p[2] : null; };
  // 1. the city's residents, in their home district
  X.HQ_CITY_RESIDENTS.list.forEach(r => { const g = distG(r.dist || plotDist[String(r.home || '').slice(0, 6)]); if (g) member(unit(r.race, r.gender), g); });
  // 2. the NPCs placed by hand
  Object.entries(H.rooms).forEach(([room, r]) => (r.npcSpots || []).forEach(sp => { if (!sp.race) return; const z = zoneOf(room); if (!z) return; const u = unit(sp.race, sp.gender); if (!u) return;
    let g = null; if (z === 'city' && Number.isFinite(sp.x) && ((H.retired && H.retired[room]) || room) === C0.room) g = distG(plotAt(sp.x, sp.z)); member(u, g || zoneG(z)); }));
  // 3. the walk-in encounter tables (a race that already lives in one of the city's districts is not added to the city again)
  const enc = {}; Object.entries(X.HQ_AREA_ENCOUNTERS).forEach(([room, t]) => { const z = zoneOf(room); if (!z) return; (t.list || []).forEach(e => { enc[z] = enc[z] || {}; enc[z][e.race] = Math.max(enc[z][e.race] || 0, e.w || 1); }); });
  Object.entries(enc).forEach(([z, rs]) => Object.entries(rs).sort((a, b) => b[1] - a[1]).forEach(([race]) => { const u = unit(race); if (!u) return; if (z === 'city' && [...has].some(k => k.startsWith(u + '>d_city_'))) return; member(u, zoneG(z)); }));
  // 4. the story cast in DOOR HQ
  Object.values(D.cast).forEach(c => { if (c.grp !== 'cast' || c.hidden) return; const id = 's:' + c.id; nodes[id] = { id, kind: 'cast', cast: c.id, note: '' }; member(id, zoneG('hq')); });
  return { nodes, links };
};
