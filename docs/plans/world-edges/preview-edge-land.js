// preview-edge-land.js — THE LAND PAST A ROOM'S EDGE, FROM ABOVE, WITHOUT A BROWSER (2026-11-16, the edges thread).
// It runs three-renderer.js's own `_hqEdgeLandFn` in Node (the room's ground is taken as flat 0) and writes a PPM picture: the room is the dark box,
// sea blue, sand, scrub olive, forest green, rock grey, mesa tops red, snow white, with a little hill shade. Use it to try a room's `terrain.edges`
// before a bake and a browser run:
//   node docs/plans/world-edges/preview-edge-land.js <room id> <out.ppm> ['<edges as JSON, to try other numbers>']
//   python3 -c "from PIL import Image; Image.open('out.ppm').save('out.png')"
const fs = require('fs'), path = require('path'); const REPO = path.join(__dirname, '../../..');
const src = fs.readFileSync(path.join(REPO, 'three-renderer.js'), 'utf8');
const a = src.indexOf('    var HQ_EDGE_ROWS = '), b = src.indexOf('    function _hqEdgeLandOn(');
const D = require(path.join(REPO, 'load-data.js')).loadGameData(); const DOOR_HQ = D.DOOR_HQ;
const room = JSON.parse(JSON.stringify(DOOR_HQ.rooms[process.argv[2]]));
if (process.argv[4]) room.terrain.edges = JSON.parse(process.argv[4]);
const info = { halfW: room.shell.w / 2, halfD: room.shell.d / 2, sea: room.terrain.sea || null };
const hqTerrainHeight = () => 0, window = {};
const F = new Function('room', 'info', 'DOOR_HQ', 'hqTerrainHeight', 'window', 'atob', src.slice(a, b) + '\nreturn _hqEdgeLandFn(room, info);')(room, info, DOOR_HQ, hqTerrainHeight, window, s => Buffer.from(s, 'base64').toString('binary'));
const R = F.reach, hw = info.halfW + R, hd = info.halfD + R, res = 3, nx = Math.floor(2 * hw / res), nz = Math.floor(2 * hd / res);
const buf = Buffer.alloc(nx * nz * 3); const H = new Float32Array(nx * nz), P = new Array(nx * nz);
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = -hw + i * res, z = -hd + j * res; const p = (Math.abs(x) < info.halfW - 0.5 && Math.abs(z) < info.halfD - 0.5) ? null : F.at(x, z); P[j * nx + i] = p; H[j * nx + i] = p ? p.y : 0; }
const COL = { mountain: [150, 145, 140], forest: [70, 120, 60], desert: [225, 200, 150], coast: [60, 110, 170], scrub: [175, 165, 110], mesa: [225, 200, 150] };
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const p = P[j * nx + i], o = (j * nx + i) * 3; if (!p) { buf[o] = 40; buf[o + 1] = 40; buf[o + 2] = 46; continue; }
  let c = [0, 0, 0]; for (const k in p.W) if (p.W[k] > 0 && COL[k]) { c[0] += p.W[k] * COL[k][0]; c[1] += p.W[k] * COL[k][1]; c[2] += p.W[k] * COL[k][2]; }
  if (p.mesa > 0.25) c = [200, 110, 75]; if (p.y < F.seaY) c = [50, 100, 165]; else if (p.W.coast > 0.5) c = [215, 195, 150];
  if (p.y - p.eH > 150) c = [245, 245, 250];
  const hl = H[j * nx + Math.max(0, i - 1)], hu = H[Math.max(0, j - 1) * nx + i], sh = Math.max(0.45, Math.min(1.35, 1 + ((p.y - hl) + (p.y - hu)) / res * 0.5));
  buf[o] = Math.min(255, c[0] * sh); buf[o + 1] = Math.min(255, c[1] * sh); buf[o + 2] = Math.min(255, c[2] * sh); }
fs.writeFileSync(process.argv[3], Buffer.concat([Buffer.from('P6\n' + nx + ' ' + nz + '\n255\n'), buf]));
let cnt = 0, tot = 0; for (const p of P) if (p) { tot++; if (p.mesa > 0.25) cnt++; } console.log('size', nx, nz, 'mesa share', (cnt / tot).toFixed(3));
