/* anim-sheets.js — render a frame CONTACT SHEET of every clip in the
   animation libraries so Claude can LOOK at an animation before wiring it
   (PLAYTEST_NOTES "THE STRIKE FRAME"). Repo tooling, never shipped to R2.

   Usage:  node anim-sheets.js [outDir] [--only=<substring>] [--view=q|side|front]
     outDir   default shots/anim-sheets/ — one PNG per library (UAL1 / UAL2,
              8 clips a sheet) and one per 7 Meshy withSkin exports, plus
              stats.json: per clip the duration, the hand / foot peak-speed
              time (a first guess at the strike frame), hips Y range, travel.
     --only   only files whose name contains the substring
     --view   camera: q = ¾ front-left (default), side, front
   Setup:  npm install --no-save playwright three@0.128.0   (Chromium is
           preinstalled at /opt/pw-browsers; PW_CHROMIUM overrides the path)
   Reads:  rigged_animations/*.glb (the user's 2026-09-09 commit: the UAL
           libraries carry a mannequin mesh; the MAL libraries are
           skeleton-only, so their clips are rendered from the Meshy
           withSkin exports that sit beside them).
   Gotchas handled here: the Meshy exports put a METRE-scale skinned mesh
   under a 0.01-scale armature (Box3.setFromObject sees a 1.7 cm model —
   frame on BONE world positions instead) and carry Armature / .scale tracks
   that must be stripped before the clip plays. */
const fs = require('fs');
const path = require('path');
const http = require('http');

const args = process.argv.slice(2);
const outDir = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, 'shots', 'anim-sheets'));
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7);
const view = (args.find((a) => a.startsWith('--view=')) || '--view=q').slice(7);
const ANIM_DIR = path.join(__dirname, 'rigged_animations');
const THREE_DIR = path.join(__dirname, 'node_modules', 'three');
if (!fs.existsSync(ANIM_DIR)) { console.error('rigged_animations/ not found'); process.exit(1); }
if (!fs.existsSync(path.join(THREE_DIR, 'build', 'three.min.js'))) { console.error('run: npm install --no-save playwright three@0.128.0'); process.exit(1); }
const { chromium } = require('playwright');
fs.mkdirSync(outDir, { recursive: true });

const PAGE = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#111">
<canvas id=sheet></canvas>
<script src="/three/build/three.min.js"></script><script src="/three/examples/js/loaders/GLTFLoader.js"></script>
<script>
const FW=190, FH=250, COLS=12;
const R = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
R.setSize(FW,FH); R.setClearColor(0x202830);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x334455,1.1));
const dl=new THREE.DirectionalLight(0xffffff,0.9); dl.position.set(2,4,3); scene.add(dl);
scene.add(new THREE.GridHelper(4,8,0x556677,0x334455));
const cam = new THREE.PerspectiveCamera(32,FW/FH,0.05,100);
const loader=new THREE.GLTFLoader();
window.renderClips = async function(jobs, view){
  const sheet=document.getElementById('sheet'); let rowsTotal=0; const loaded=[];
  for(const jb of jobs){
    const g=await new Promise((res,rej)=>loader.load(jb.url,res,undefined,rej));
    g.animations.forEach(c=>{ c.tracks=c.tracks.filter(t=>!/^(Armature|char1|Mannequin|RootNode|Scene)\\./.test(t.name) && !/\\.scale$/.test(t.name)); c.resetDuration(); });
    const cl=g.animations.filter(c=>!jb.clips||jb.clips.includes(c.name));
    loaded.push({g,cl,label:jb.label||''}); rowsTotal+=cl.length;
  }
  sheet.width=FW*COLS; sheet.height=(FH+22)*rowsTotal;
  const ctx=sheet.getContext('2d'); ctx.fillStyle='#000'; ctx.fillRect(0,0,sheet.width,sheet.height);
  const stats=[]; let rowBase=0;
  for(const L of loaded){ renderOne(L.g, L.cl, view, ctx, rowBase, stats, L.label); rowBase+=L.cl.length; }
  return stats;
};
function renderOne(g, clips, view, ctx, rowBase, stats, label){
  const root=g.scene; scene.add(root);
  const mixer0=new THREE.AnimationMixer(root); if(clips[0]){ const a0=mixer0.clipAction(clips[0]); a0.play(); mixer0.update(0.01); a0.stop(); }
  root.updateMatrixWorld(true);
  const boneBox=()=>{ const b=new THREE.Box3(); root.traverse(o=>{ if(o.isBone) b.expandByPoint(o.getWorldPosition(new THREE.Vector3())); }); return b; };
  let box=boneBox(); const h=(box.max.y-box.min.y)*1.12;
  root.scale.multiplyScalar(1.8/h); root.updateMatrixWorld(true);
  box=boneBox(); root.position.y-=box.min.y; root.position.x-=(box.min.x+box.max.x)/2; root.position.z-=(box.min.z+box.max.z)/2;
  root.updateMatrixWorld(true);
  const mixer=new THREE.AnimationMixer(root);
  const hands=[], feet=[]; root.traverse(o=>{ if(!o.isBone) return; const n=o.name.toLowerCase(); if(/^hand_[lr]$|lefthand$|righthand$/.test(n)) hands.push(o); if(/^foot_[lr]$|leftfoot$|rightfoot$/.test(n)) feet.push(o);});
  let hips=null; root.traverse(o=>{ if(!hips && o.isBone && /^(pelvis|hips)$/i.test(o.name)) hips=o; });
  for(let rr=0;rr<clips.length;rr++){ const r=rowBase+rr; const clip=clips[rr];
    const act=mixer.clipAction(clip); mixer.stopAllAction(); act.reset().play(); act.paused=true;
    const N=60; let prevH=null, prevF=null; const hs=[], fs=[], hipsY=[], hipsXZ=[];
    for(let i=0;i<=N;i++){ const t=clip.duration*i/N; act.time=t; mixer.update(0); root.updateMatrixWorld(true);
      const hp=hands.map(b=>b.getWorldPosition(new THREE.Vector3())); const fp=feet.map(b=>b.getWorldPosition(new THREE.Vector3()));
      if(prevH){ hs.push(Math.max(...hp.map((p,k)=>p.distanceTo(prevH[k])))); fs.push(Math.max(...fp.map((p,k)=>p.distanceTo(prevF[k])))); }
      prevH=hp; prevF=fp;
      if(hips){ const p=hips.getWorldPosition(new THREE.Vector3()); hipsY.push(p.y); hipsXZ.push(Math.hypot(p.x,p.z)); }
    }
    const argmax=a=>a.indexOf(Math.max(...a)); const hi=argmax(hs), fi=argmax(fs);
    const st={src:label, clip:clip.name, dur:+clip.duration.toFixed(2), handPeakT:+(clip.duration*(hi+0.5)/N).toFixed(2), footPeakT:+(clip.duration*(fi+0.5)/N).toFixed(2), hipsYmin:+Math.min(...hipsY).toFixed(2), hipsYmax:+Math.max(...hipsY).toFixed(2), hipsTravel:+Math.max(...hipsXZ).toFixed(2)};
    stats.push(st);
    const dist=(view==='side')?4.2:4.0; const ang=(view==='side')?Math.PI/2:(view==='front'?0:Math.PI/4);
    cam.position.set(Math.sin(ang)*dist, 1.55, Math.cos(ang)*dist); cam.lookAt(0,1.0,0);
    for(let c=0;c<COLS;c++){ const t=clip.duration*c/(COLS-1); act.time=Math.min(t,clip.duration-0.001); mixer.update(0);
      R.render(scene,cam); ctx.drawImage(R.domElement, c*FW, r*(FH+22)+22);
      ctx.fillStyle='#ddd'; ctx.font='12px monospace'; ctx.fillText(t.toFixed(2)+'s', c*FW+4, r*(FH+22)+22+FH-6);
    }
    ctx.fillStyle='#ffd866'; ctx.font='bold 14px monospace';
    ctx.fillText(clip.name+'  '+clip.duration.toFixed(2)+'s  handPeak@'+st.handPeakT+'s footPeak@'+st.footPeakT+'s  hipsY '+st.hipsYmin+'-'+st.hipsYmax+' travel '+st.hipsTravel+'  ['+label+']', 8, r*(FH+22)+16);
    act.stop();
  }
  scene.remove(root);
}
</script>`;

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); return; }
  const p = u.startsWith('/three/') ? path.join(THREE_DIR, u.slice(7)) : u.startsWith('/anims/') ? path.join(ANIM_DIR, u.slice(7)) : null;
  if (!p) { res.writeHead(404); res.end(); return; }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});

const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const stem = (f) => f.replace(/^Assets_Models_|_withSkin\.glb$|\.glb$/g, '');
function clipNames(file) {
  const b = fs.readFileSync(file); const jl = b.readUInt32LE(12);
  return (JSON.parse(b.slice(20, 20 + jl).toString()).animations || []).map((a) => a.name);
}

(async () => {
  await new Promise((r) => srv.listen(0, r));
  const port = srv.address().port;
  const files = fs.readdirSync(ANIM_DIR).filter((f) => f.endsWith('.glb') && (!only || f.includes(only))).sort();
  const jobs = [];
  for (const f of files) {
    if (/UAL\d_Standard/.test(f)) {
      chunk(clipNames(path.join(ANIM_DIR, f)), 8).forEach((c, i) => jobs.push({ out: stem(f) + '-' + i, files: [{ file: f, clips: c }] }));
    }
  }
  chunk(files.filter((f) => f.includes('withSkin')), 7).forEach((c, i) => jobs.push({ out: 'meshy-' + i, files: c.map((f) => ({ file: f })) }));
  if (!jobs.length) { console.error('nothing to render'); process.exit(1); }
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 2300, height: 1200 } });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(`http://127.0.0.1:${port}/`);
  const all = {};
  for (const j of jobs) {
    const stats = await page.evaluate(({ fs, v }) => renderClips(fs, v), { fs: j.files.map((f) => ({ url: '/anims/' + f.file, clips: f.clips || null, label: stem(f.file) })), v: view });
    all[j.out] = stats;
    await (await page.$('#sheet')).screenshot({ path: path.join(outDir, j.out + '.png') });
    console.log(j.out + '.png  ' + stats.map((s) => s.clip.replace(/^Armature\||\|baselayer$/g, '') + ' ' + s.dur + 's').join(' · '));
  }
  fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(all, null, 1));
  await browser.close(); srv.close();
  console.log('wrote ' + jobs.length + ' sheets + stats.json to ' + outDir);
})().catch((e) => { console.error(e); process.exit(1); });
