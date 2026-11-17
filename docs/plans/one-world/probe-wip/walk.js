// walk lengths door to door over each room's open squares (the shortest line a walker can take), and the time at 2.4 m/s (walk) and 4.6 m/s (run)
const path = require('path'), REPO = '/home/user/EntropyWars_Prototype';
const D = require(path.join(REPO, 'load-data.js')).loadGameData(), R = D.DOOR_HQ.rooms, CAT = D.DOOR_HQ.catalogue, C = 3.5;
function grid(id, avoid) { const r = R[id], hw = r.shell.w / 2, hd = r.shell.d / 2, W = Math.round(r.shell.w / C), Dn = Math.round(r.shell.d / C), open = new Uint8Array(W * Dn);
  r.terrain.features.filter(f => f.k === 'space').forEach(f => { for (let x = Math.round((f.x - f.w / 2 + hw) / C); x < Math.round((f.x + f.w / 2 + hw) / C); x++) for (let z = Math.round((f.z - f.d / 2 + hd) / C); z < Math.round((f.z + f.d / 2 + hd) / C); z++) open[z * W + x] = 1; });
  r.props.forEach(p => { if (CAT[p.key] && CAT[p.key].block && !p.noBlock) { const x = Math.floor((p.x + hw) / C), z = Math.floor((p.z + hd) / C); if (x >= 0 && z >= 0 && x < W && z < Dn) open[z * W + x] = 2; } });
  r.terrain.features.forEach(f => { if (f.k === 'texbuilding' || f.k === 'tree') { const w = (f.rot % 180 ? f.d : f.w) || 1, d = (f.rot % 180 ? f.w : f.d) || 1; for (let x = Math.floor((f.x - w / 2 + hw + 0.1) / C); x <= Math.floor((f.x + w / 2 + hw - 0.1) / C); x++) for (let z = Math.floor((f.z - d / 2 + hd + 0.1) / C); z <= Math.floor((f.z + d / 2 + hd - 0.1) / C); z++) if (x >= 0 && z >= 0 && x < W && z < Dn && open[z * W + x]) open[z * W + x] = 2; } });
  return { r, hw, hd, W, Dn, open, avoid }; }
const doorAt = (G, id) => { const d = G.r.doors.find(q => q.id === id) || (id === 'spawn' ? Object.assign({ wall: 'free' }, G.r.spawn) : null); if (!d) throw new Error(G.r.label + ': no door ' + id);
  const x = d.wall === 'w' ? -G.hw + 1 : d.wall === 'e' ? G.hw - 1 : d.x, z = d.wall === 'n' ? -G.hd + 1 : d.wall === 's' ? G.hd - 1 : d.z; return [x, z]; };
function walk(G, from, to, cost) { const { W, Dn, open } = G, sq = p => [Math.max(0, Math.min(W - 1, Math.floor((p[0] + G.hw) / C))), Math.max(0, Math.min(Dn - 1, Math.floor((p[1] + G.hd) / C)))];
  const near = p => { const [x0, z0] = sq(p); let best = null; for (let r = 0; r < 6 && !best; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x = x0 + dx, z = z0 + dz; if (x >= 0 && z >= 0 && x < W && z < Dn && open[z * W + x] === 1 && !best) best = [x, z]; } return best; };
  const a = near(from), b = near(to); if (!a || !b) return null;
  const dist = new Float64Array(W * Dn).fill(1e18), len = new Float64Array(W * Dn), done = new Uint8Array(W * Dn); dist[a[1] * W + a[0]] = 0;
  const heap = [[0, a[0], a[1]]];
  while (heap.length) { let bi = 0; for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i; const [d0, x, z] = heap.splice(bi, 1)[0]; const k = z * W + x; if (done[k]) continue; done[k] = 1; if (x === b[0] && z === b[1]) break;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= W || Z >= Dn || open[Z * W + X] !== 1) continue; if (dx && dz && (open[z * W + X] !== 1 || open[Z * W + x] !== 1)) continue;
      const st = Math.hypot(dx, dz) * C, c = st * (cost ? cost(X, Z) : 1), n = Z * W + X; if (d0 + c < dist[n]) { dist[n] = d0 + c; len[n] = len[k] + st; heap.push([dist[n], X, Z]); } } }
  const e = b[1] * W + b[0]; return dist[e] > 1e17 ? null : Math.round(len[e]); }
const G = {}; ['site_prebuilt_fairy_forest_ow_clearing', 'site_prebuilt_fairy_forest_ow_creek', 'site_prebuilt_skinwalker_ow_corn', 'site_ow_r7_3_14', 'site_ow_l8', 'site_prebuilt_skinwalker_ow_lake'].forEach(id => { G[id.replace('site_prebuilt_fairy_forest_ow_', '').replace('site_prebuilt_skinwalker_ow_', '').replace('site_ow_', '')] = grid(id); });
const leg = (g, a, b, cost) => { const m = walk(G[g], doorAt(G[g], a), doorAt(G[g], b), cost); return { room: g, from: a, to: b, m }; };
const laneCost = (x, z) => (x >= 10 && x <= 13 && z < 62) ? 6 : 1;   // "by the corn": the lane's squares cost six times (the walk keeps to the corn's own tracks; the last plot's lane is the way out)
const ROUTES = {
  'Stair to the Lake by County Lane': [leg('clearing', 'spawn', 'ow_h_m14_5'), leg('corn', 'ow_h_m14_5', 'ow_h_m14_11'), leg('r7_3_14', 'ow_h_m14_11', 'ow_h_m12_15')],
  'Stair to the Lake by the corn and the footpath': [leg('clearing', 'spawn', 'ow_h_m14_5'), leg('corn', 'ow_h_m14_5', 'ow_h_m14_11', laneCost), leg('r7_3_14', 'ow_h_m14_11', 'ow_h_m13_12'), leg('l8', 'ow_h_m13_12', 'ow_v_m12_15')],
  'Stair to the Storm Drain by the creek': [leg('clearing', 'spawn', 'ow_v_m12_1'), leg('creek', 'ow_v_m12_1', 'link_streets_drain')],
  'the creek alone, the Culvert to the Storm Drain': [leg('creek', 'ow_v_m12_1', 'link_streets_drain')],
  'the creek to the sewer mouth (the cave)': [leg('creek', 'ow_v_m12_1', 'link_sewers_drain')],
  'the Lake, the lane door to the far (south) shore door': [leg('lake', 'ow_h_m12_15', 'ow_h_m11_18')],
  'the Clearing end to end, Camelot trail to the creek': [leg('clearing', 'link_woods_camelot', 'ow_v_m12_1')],
};
const t = (m, v) => { const s = Math.round(m / v); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
Object.keys(ROUTES).forEach(n => { const L = ROUTES[n], tot = L.reduce((a, l) => a + (l.m || 0), 0); console.log(n + ': ' + tot + ' m, walk ' + t(tot, 2.4) + ', run ' + t(tot, 4.6) + ', rooms ' + L.length + ' (loads ' + (L.length - 1) + ')'); L.forEach(l => console.log('    ' + l.room + ' ' + l.from + ' -> ' + l.to + ': ' + (l.m == null ? 'NO WAY' : l.m + ' m'))); });
