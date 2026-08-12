/* build_mal2.js — consolidate Meshy withSkin animation exports into ONE
   animation-only library GLB (MAL2_Sniper.glb), same recipe as MAL1
   (PLAYTEST_NOTES "MAL library"): keep ONE skeleton node hierarchy, strip
   meshes/skins/textures/materials, copy each file's single clip in and
   RENAME it to its file stem (Meshy_AI_Animation_<Stem>_withSkin.glb →
   <Stem>). Uses @gltf-transform/core ONLY (never install
   @gltf-transform/functions — its sharp dep 403s behind the proxy; core's
   Document.merge is likewise functions-gated, so clips are copied by hand:
   new accessors/samplers/channels retargeted onto the base skeleton by
   NODE NAME — all Meshy sniper exports share the same 26-joint rig).

   Usage: node build_mal2.js <src-dir> <out.glb> [refLib.glb]
     src-dir   directory of Meshy_AI_Animation_*_withSkin.glb files
     out.glb   output path (e.g. MAL2_Sniper.glb at the repo root)
     refLib    optional existing library (MAL1_Sniper.glb) — verifies the
               source rigs carry the same joint names.
   Setup: npm install --no-save @gltf-transform/core
*/
const fs = require('fs');
const path = require('path');
const { NodeIO } = require('@gltf-transform/core');

const [, , srcDir, outPath, refLibPath] = process.argv;
if (!srcDir || !outPath) {
  console.error('usage: node build_mal2.js <src-dir> <out.glb> [refLib.glb]');
  process.exit(1);
}
const io = new NodeIO();

const stemOf = (f) => {
  const m = f.match(/Meshy_AI_(?:[A-Za-z0-9_]*?_)?Animation_(.+?)_withSkin\.glb$/);
  return m ? m[1] : path.basename(f, '.glb');
};

const jointNames = (doc) =>
  doc.getRoot().listNodes().map((n) => n.getName()).filter(Boolean).sort();

const clipDur = (anim) => {
  let dur = 0;
  anim.listSamplers().forEach((s) => {
    const inp = s.getInput();
    if (inp) dur = Math.max(dur, inp.getMax([0])[0]);
  });
  return dur;
};

/* Copy srcDoc's first animation into outDoc as `name`, retargeting every
   channel onto outDoc's skeleton by node name. */
function copyClip(outDoc, srcDoc, name, buffer) {
  const nodeByName = new Map();
  outDoc.getRoot().listNodes().forEach((n) => {
    if (n.getName() && !nodeByName.has(n.getName())) nodeByName.set(n.getName(), n);
  });
  const srcAnim = srcDoc.getRoot().listAnimations()[0];
  const anim = outDoc.createAnimation(name);
  const accCache = new Map();
  const copyAcc = (srcAcc) => {
    let a = accCache.get(srcAcc);
    if (!a) {
      a = outDoc.createAccessor(srcAcc.getName() || '', buffer)
        .setType(srcAcc.getType())
        .setArray(srcAcc.getArray().slice());
      accCache.set(srcAcc, a);
    }
    return a;
  };
  let dropped = 0;
  for (const ch of srcAnim.listChannels()) {
    const t = ch.getTargetNode();
    const home = t && nodeByName.get(t.getName());
    if (!home) { dropped++; continue; }
    const s = ch.getSampler();
    const sampler = outDoc.createAnimationSampler()
      .setInput(copyAcc(s.getInput()))
      .setOutput(copyAcc(s.getOutput()))
      .setInterpolation(s.getInterpolation());
    anim.addSampler(sampler);
    anim.addChannel(outDoc.createAnimationChannel()
      .setTargetNode(home)
      .setTargetPath(ch.getTargetPath())
      .setSampler(sampler));
  }
  if (dropped) console.warn(`  ⚠ ${name}: ${dropped} channel(s) had no matching node — dropped`);
}

(async () => {
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('_withSkin.glb')).sort();
  if (!files.length) { console.error('no *_withSkin.glb files in ' + srcDir); process.exit(1); }

  let refJoints = null;
  if (refLibPath) {
    refJoints = new Set(jointNames(await io.read(refLibPath)));
  }

  let outDoc = null, outBuffer = null;
  for (const f of files) {
    const doc = await io.read(path.join(srcDir, f));
    const root = doc.getRoot();
    const stem = stemOf(f);
    const anims = root.listAnimations();
    if (anims.length !== 1) console.warn(`⚠ ${f}: ${anims.length} animations (expected 1) — using [0]`);

    if (refJoints) {
      const missing = jointNames(doc).filter((n) => !refJoints.has(n));
      console.log(`${f} → "${stem}" dur=${clipDur(anims[0]).toFixed(2)}s` +
        (missing.length ? `  ⚠ joints not in ref: ${missing.slice(0, 5).join(',')}` : ' rig✓'));
    }

    if (!outDoc) {
      /* Base document: first file stripped to skeleton + its (renamed) clip. */
      anims.forEach((a, i) => { if (i === 0) a.setName(stem); else a.dispose(); });
      root.listMeshes().forEach((m) => m.dispose());
      root.listSkins().forEach((s) => s.dispose());
      root.listMaterials().forEach((m) => m.dispose());
      root.listTextures().forEach((t) => t.dispose());
      root.listCameras().forEach((c) => c.dispose());
      // Mesh-attribute accessors are orphaned by the strips; animation
      // samplers keep theirs referenced.
      root.listAccessors().forEach((a) => { if (a.listParents().length <= 1) a.dispose(); });
      root.listBuffers().forEach((b) => b.setURI(''));
      outDoc = doc;
      outBuffer = root.listBuffers()[0] || outDoc.createBuffer();
      continue;
    }
    copyClip(outDoc, doc, stem, outBuffer);
  }

  await io.write(outPath, outDoc);
  const outRoot = outDoc.getRoot();
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`\nWrote ${outPath} (${kb} KB) — clips: ` +
    outRoot.listAnimations().map((a) => `${a.getName()} ${clipDur(a).toFixed(2)}s`).join(', '));
})().catch((e) => { console.error(e); process.exit(1); });
