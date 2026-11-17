// one probe run a line of RUNS: [tag, room, views, extra flags]; views carry the ground's own height; logs to run3_<tag>.log
const { execFileSync } = require('child_process'), path = require('path'), fs = require('fs');
const REPO = '/home/user/EntropyWars_Prototype', OUT = __dirname;
const D = require(path.join(REPO, 'load-data.js')).loadGameData();
const PERF = 'console.log("[HQ] PROBE perf " + JSON.stringify((function(){var p=ThreeRenderer.hq.perf(); return {calls:p.calls, tris:p.triangles, mem:p.mem && {misc:p.mem.misc.mb, rigs:p.mem.rigs.mb, evicted:p.mem.evicted}};})()))';
const hOf = (room, x, z) => { try { return Math.round((D.hqTerrainCompile(D.DOOR_HQ.rooms[room], room).hFn(x, z) + 0.05) * 100) / 100; } catch (e) { return 0; } };
const V = { fp: (room, name, x, z, face, o) => Object.assign({ name, x, z, y: hOf(room, x, z), face, pitch: -0.05, fp: true, settle: 5000 }, o || {}),
  tp: (room, name, x, z, face, o) => Object.assign({ name, x, z, y: hOf(room, x, z), face, pitch: -0.2, fp: false, dist: 5, settle: 4000 }, o || {}),
  perf: (room, name, x, z, face) => ({ name, x, z, y: hOf(room, x, z), face, pitch: -0.05, fp: true, settle: 500, eval: PERF }),
  top: (room, name, k) => { const R = D.DOOR_HQ.rooms[room]; return { name, x: 0, z: 0, y: Math.max(R.shell.w, R.shell.d) * (k || 0.62), face: 0, pitch: -1.5, fp: true, settle: 4000 }; },
  walk: (room, name, x, z, face, max) => ({ name, x, z, y: hOf(room, x, z), face, pitch: -0.2, fp: false, dist: 5, settle: 3000, walk: { max: max || 110000 } }) };
const RUNS = require(process.argv[2])(V, D);
const only = process.argv.slice(3);
for (const [tag, room, views, extra] of RUNS) { if (only.length && only.indexOf(tag) < 0) continue; const t0 = Date.now(); let out = '';
  try { out = execFileSync('node', ['playtest_city.js', room, JSON.stringify(views), '--loglen=1400'].concat(extra || []), { cwd: REPO, encoding: 'utf8', timeout: 1200000, maxBuffer: 64 * 1024 * 1024 }); } catch (e) { out = (e.stdout || '') + '\nFAILED ' + String(e.message).slice(0, 300); }
  fs.writeFileSync(path.join(OUT, 'run3_' + tag + '.log'), out);
  console.log(tag, ((Date.now() - t0) / 1000).toFixed(0) + ' s', (out.match(/room ready in [^\n]*/g) || []).join(' | '), (out.match(/WALK [^\n]*/g) || []).join(' | '), (out.match(/ARRIVED [^\n]*/g) || []).join(' | '), (out.match(/ERRORS [^\n]*/) || [''])[0].slice(0, 160));
  (out.match(/PROBE perf {[^\]]*?}}/g) || []).forEach(l => console.log('   ' + l.replace(/\\"/g, '"'))); }
