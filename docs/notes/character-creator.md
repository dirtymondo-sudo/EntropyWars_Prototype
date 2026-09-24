# Notes: character-creator

Moved verbatim from CLAUDE.md on 2026-09-24 (sections in original order). Character creator revs 3-11, cloth, wardrobe.
Append new notes for this system at the end of this file.

## CHARACTER CREATOR rev 11 — THE SKIRT HEM (the sawtooth, the collision that never ran, the skirt under a jacket) (2026-09-13, local delivery)
The user, again: "the edges of the skirt are messed up… jagged… the back looks
messed up… why is it so hard to make a skirt". Root cause, measured: the lathe
was PERFECT in the bind pose (where every headless render is made) and tore the
moment the legs posed, because every column rode the ONE skin vertex that set
its radius (`rep`) — neighbouring bins land on vertices with different bone
weights (a thigh vertex beside a hip vertex beside the OTHER thigh, worst near
the centre front / back where the ray passes between the legs), so each column
moved its own way: hem |Δ²y| 5.4 mm mean / 156 mm max in a walk. Four fixes in
three-renderer.js: **(1) THE SMOOTH WEIGHT FIELD** (`buildLathe`): the weights
are a field over the (row, azimuth) grid in three ROLES (hips + everything
else · upper leg · lower leg + foot, the two sides folded together), blurred
round each row (~10°) and down the columns, interpolated between bins per
vertex, the leg roles handed to LEFT / RIGHT by ONE smooth `wL(θ)` (a
smoothstep of sin θ over ±0.5, the left leg at +x); the old mirror blend is
gone (`sw` inside buildLathe is the SWING allowance — read the welded weights
as `part.siW / part.swW` there). Walk hem now 1.3 mm mean / 27 mm max, and the
27 is the fold between the legs, not a tooth. **(2) THE COLLISION NEVER RAN**:
`collideSkirt` scaled the leg radii by the MESH node's world scale, but the
base GLB's mesh node is scaled 0.01 while its skeleton is not (the bind matrix
carries the difference) — every capsule was 1/100 of a leg. The scale is now
THE BONES' (`S.sc` = the world length of hip → knee → ankle over its bind
length, `lg.len`); the capsule above the CROTCH holds the thigh's radius
(`firstLeg`, the profile measured from t ≤ 0.45 — the pelvis is not a leg);
**THE REST DEPTH** (`part.skirtRest`, computed at rebuild against the bind
polyline `lg.pts`) = how far inside a capsule each vertex already sits in the
bind pose, and the pass pushes only what a POSE adds (the bind pose is left
exactly as built — 0 vertices moved); **THE TENT**: the push is recorded per
vertex (`part._colBuf`), relaxed over the skirt's own grid (`part.skirtGrid`
from `opts.grid`; slope limit 6 mm / column, 4 mm / row) and only then applied
along each vertex's own outward direction — cloth tents over a knee, it does
not dimple round it. **(3) THE SKIRT UNDER AN OUTER**: `opts.over` (the outer's
surface) / `overT` (its hem) / `overLathe` (the coat tail's field — the tail is
built FIRST now and `buildLathe` returns `{ RAD, rows, tTop, tHem, NTH }`)
hold every covered row 6 mm inside the layer worn over it (`overLim`, eased in
over the 3 cm above the hem), and below the hem the skirt widens back as a
CONE (≤ 0.7 cm per 1 cm row) never a shelf — the skirt used to come through a
jacket's hem as a ragged line. **(4) THE PROBE**: `POSE=walk|idle|kick node
creator-render.js …` renders the rig POSED (CPU-skinned after the collision
tick) and prints `HEM` (the sawtooth number) + `COLLIDE` — the bind pose hides
all of this; never judge a skirt from it again. character-creator.test.js: two
rev 11 tests (source + the real rig posed: bind untouched, walk mean < 2.5 mm,
the kick pushes more than the walk). Unseen live: the browser's lit hem, the
long skirt over a raised foot (the capsule ends at the ankle).

## CHARACTER CREATOR rev 10 — the locker, the name, topless, the extra layers, the beard, the prints (2026-09-13, local delivery)
**THE NAME + THE LOCKER**: party-builder.js `SavedLooks` (rendered first
inside `CreatorControls`, which now takes `name / onName / onLoad`) — the
NAME field lives where the look is made (the forge writes `partyNames`
through `handleNameChange`; the mirror files it as `door.hq.look.name`,
data.js `hqLook` / `hqSetLook`), 💾 SAVE CHARACTER files `{ id, name,
gender, appearance, at }` in localStorage `ew_saved_looks` (`pbLooksLoad /
pbLooksSave / pbLooksDelete`, `PB_LOOKS_MAX` 40, the same name
overwrites, newest first; `window._ewSavedLooks`), a chip LOADs it
(appearance + base + name, either home), ✕ forgets it. **TOPLESS**:
`outfit: 'none'` (sprites.js EW_OUTFIT_STYLES; `_ccTopDef('none')` →
null — every TOP read in `rebuildGeometry` is guarded; neckwear then sits
on the skin). **THE EXTRA LAYERS (＋ ADD LAYER)**: `outfit2` (a second top
over the top) and `bottoms2` (a second pair of bottoms over the bottoms —
briefs over trousers) with `top2* / bottom2*` fabric / colour / pattern
keys (`EW_APPEARANCE_LAYERS` rows carry `slot` for every layer and `extra:
true` for these); renderer shells `top2` / `bottom2` (`CC_LAYER_NAMES` =
15), cut by `_ccOverDef(def, extra)` = the catalogue row at a larger
ease, `under` = the layer beneath; the belt rides up over bottoms2; ONE
lathe: a dress > a second top's dress > a skirt worn over (`bottoms2`) >
the bottoms' skirt (`part.skirtOwner` names the keys). The builder's
`ccExtraLayers` (＋ ADD LAYER menu → a full layer row with ✕ REMOVE).
**COLLARS / HOODS ARE GONE** (the ribbon read as teeth; every neckline is
the cloth's own rim fold) — no `collar` field on any row. **CONFORMING
PATCHES**: `surfacePatch(b, L, cx, t, hw, hh, mode, th, gain, { n, k,
puff, shape })` samples a rounded outline (a superellipse or a custom
`shape(s)`) ON the surface — patch pockets, the kangaroo pocket, a tie's
knot, THE BOW's two pinched wings (in the `tie` shell) — never
`placeBox` for anything wider than a welt. **THE BEARD**: styles
`moustache` + `fullbeard` (enum); VOLUME — `rebuildGeometry` pushes the
masked jaw / chin / cheeks out along the WELDED normals (4 / 3 / 6 mm,
`bPush`; the base's split normals cracked the cheek) and redoes NB; PAINT
— strands across a growth-direction field (down + outward), two octaves,
a slow noise wander, clumps, darker roots / lighter tips; stubble = the
field thresholded. `beard` is in the shape key. **THE PRINTS**: 20
patterns (+ hpinstripe · hearts · minidots · diamonds · houndstooth ·
zebra · leopard · crosshatch); feet / gloves / belt print at 2× cells
(`_ccPatternTexture(…, cellsMul)`). **THE CLOTH FRAME**: the arm region
starts at the SHOULDER JOINT (`_armRegX` = shoulder.x + 1.2 cm; a
sleeve is its own tube, the switch is the shoulder seam) and the FEET
are their own polyline (`limbs.footL/R`, a hand above the ankle → the
ankle → the toe, `qt < 0.15`; u / v continue the leg's through `uOff /
vOff`) — a shoe used to be the leg cylinder's clamped end (stripes fanned
round the ankle whatever the fabric); the seam guards compare ANGLES
(`ANG / TURN`), u stays at ONE radius per limb (a skin-radius u was tried
and fanned every stripe in at the waist — cloth hangs at one
circumference). **THE LATHE**: 96 azimuths, the radius field blurred
round and down (`fs2` below the waistband) then held ≥ the measured
maximum + the layers worn UNDER it (`opts.surface` for the bodice band,
`opts.under` for the trousers — they poked through a dress), no pockets
on covered bottoms, the collision margin 1.1 cm. `npm test`:
character-creator.test.js (two rev 10 tests, one on the real rig).
Screenshotted headlessly (`creator-render.js` renders top2 / bottom2):
the beard, the bow, briefs over trousers, the striped tee, the boots, the
dress waist — the LOOK in the browser is unseen; the hoodie's kangaroo
pocket is subtle under flat light.

## CHARACTER CREATOR rev 9 — the picker lag, the coat, the wrist, cloth collision, THE DETAILS, the wardrobe (2026-09-13, local delivery)
**THE LAG**: every colour change re-baked the 2048² face (~265 ms) and the
native colour input fires per pointer move. Now the rig's `update(value,
{ preview: true })` bakes the face at `CC_FACE_PREVIEW_TEX` (512) and a
printed tile at a quarter size; the viewer's per-frame coalesced update is
a preview and ONE full bake runs `CC_SETTLE_MS` (240) after the last change
(`v.appearanceSettle`); party-builder.js `CreatorControls` sends colour /
slider values through `queueChange` (one change per animation frame).
**THE COAT**: no lathe tail any more — the coat is ONE shell to mid-thigh
(`CC_OUTER.coat.hem` 0.40) at a larger stand-off below the hips (`hemEase`
/ `hemEaseFrom`, `layerEase` + `layerEaseAtQ`); the tail tore on every
posed stance. **THE HAND**: a 'wrist' sleeve is never cloth past the wrist
joint's plane (`armAt().past`, `wristPlane − A.past` in the sleeve cut) and
the arm profile leaves the hand out — the thumb projected before the joint
and every long sleeve capped it in cloth; a rim strip's depth reads the
layer's LOCAL ease and stays under 45 % of the limb's radius. **THE WRIST**:
the sniper's `Idle_5` (every rig's default idle) holds its right wrist bent
67° with a 51° twist; `def.wristLimit` (degrees; the creator bases wear 30,
sprites.js `EW_CHARACTER_BASES`) caps a hand bone's rotation off its rest in
`_libBakeClips` (`_lqLimit`). **CLOTH COLLISION**: a cut garment rides the
body's own topology + weights and can never clip; the LATHES (skirts) can,
so `collideSkirt(part)` runs every frame after the mixer (`rig.tick()` at
the board / HQ / viewer mixer sites): each skirt vertex is skinned on the
CPU (`SkinnedMesh.boneTransform`), pushed out of the two leg capsules
(`part.legs` — hip → knee → ankle radius profiles measured at setup, the
joints from the bones' world matrices) and carried back to bind space
through its own skin matrix. Kill-switch `EW_NO_CLOTH_COLLIDE`. No Blender
pass is needed for any of this: the cloth IS the body, offset. **THE
DETAILS** (`buildDetails`, kill-switch `EW_CC_NO_DETAILS`): trim geometry
placed on a layer's cloth surface at (|x|, t) off the nearest base vertex
(`surfaceAt` — front / back / the thigh's side / the top of the foot) and
riding that vertex's weights — `placeBox`, `disc`, `ribbon` (+ `smoothPath`,
the raw samples zigzag). Row fields: `buttons { n, x, from, to, r, double }`,
`placket { buttons, from, to, w }`, `zipTape`, `pockets [{ x, t, w, h, kind:
patch | welt, side, back, flap }]`, `collar: 'band' | 'hood'`, `beltBand`,
`straps` (sandals). Fabric pieces land in their layer's buffer (the owner
vertex's cloth UV + the corner offset); hardware in the `trim` shell,
neckwear in `tie` (`tieColor`), glasses in `glasses` (`glassesColor`) — three
new shells (`CC_LAYER_NAMES` = 13). **THE WARDROBE**: tops polo · henley;
outer cardigan · hoodie · trench · parka; bottoms baggy · cargo · sweatpants;
feet sandals; accessories `neckwear` (tie · bowtie) + `glasses` (round ·
square · shades — rims round the measured eyes, temples to the ears) with
the builder's ACCESSORIES section. `EWCharViewer.dev.state()/model()` = the
live stage record for probes; `playtest_creator.js` now serves the animation
libraries from `rigged_animations/` so its shots are POSED. On Meshy
garments: see PARTY_BUILDER_PLAN §9 (rev 9 entry) — when to model, how to
fit. `npm test`: character-creator.test.js (+ the rev 9 guard).

## CHARACTER CREATOR rev 8 — the outer layer fixed, THE PRINTS, THE MIRROR (2026-09-13, local delivery)
The 2nd layer (`CC_OUTER`: jacket · blazer · vest · coat) verified on BOTH
bases with `creator-render.js` (baseline → fix, every view): sleeved
layers' ease TAPERS to the wrist (`layerEase` / `sleeveEase` /
`part.armFrac` — the cuffs belled), NO collar cap (`neck.top` 0.848 put
the cut on the neck-base wall → a sawtooth; the 0.852 ridge is the only
collar line), the lapel is a cosine fold (`lapelRaise`, lit), the lathe
(`buildLathe`) measures the RELAXED skin R (it read P and ledged out of
the coat / the trousers), the coat tail hangs from 6 mm above the hem with
its own `swing`, the dress skirt likewise, the arm capsule's cap BEHIND
the shoulder joint is 0.45 × the deltoid's radius blended over 3 cm
(`armAt().proj` — the full sphere ate every strap; a step made bites),
the vest wears the tank's panel heights, and every rim strip is THE FOLD
(extruded toward the skin AND under the cloth, its normal leaning toward
the cloth's, gain 0.86 — the strips used to poke past the shoulder as
teeth and outline every opening in black). Probe any layer's cuts with
`window.EW_CC_DEBUG_CUTS = (garments, part) => …`. **THE PRINTS**:
sprites.js `EW_PATTERNS` (12 ids, `solid` first) + `<layer>Pattern` /
`<layer>Color2` on every `EW_APPEARANCE_LAYERS` row; three-renderer.js
`_ccPatternMask(id, u, v)` (pure, tiling) → `_ccPatternBytes` →
`_ccPatternTexture` (an instance-owned canvas = the fabric tile × colour
1 → colour 2; the printed layer's vertex tint is WHITE); the builder's
`ccPrint` rows (live swatches via `EWCharViewer.patternThumb`, COLOUR 1 /
COLOUR 2); creator-render.js prints through the same painter. Adding a
pattern = one `EW_PATTERNS` row + one `case` in `_ccPatternMask`.
**THE MIRROR** in Occam's Barbershop IS the character creator: the
counter's `fn: '_mountReactCreator'` (party-builder.js `OfficerCreator`
over the shared `CreatorControls` component — the forge's GEAR panel
uses the same one; `_HQ_MODAL` in map.js) files the officer's own look on
the profile (data.js `hqLook` / `hqSetLook` → `door.hq.look = { gender,
appearance, portrait, at }`), takes THE PHOTO (`EWCharViewer.snapshot` —
a 256 × 320 bust JPEG data URL; profile.js `doorCardPortrait` shows it on
the ID card, `.door-photo-look`) and sits you in the chair as it: the
fifth avatar mode `'look'` (only while a look is on file) → map.js
`_hqAvatar` → `{ race: 'homosapien', gender, appearance }` → the walker
is the creator rig (`_hqSpawnCharacter` passes `spec.appearance` into
`unit.appearance`); `window._hqRefreshAvatar()` swaps it at once. The
forge's creator has USE YOUR OWN LOOK. `npm test`: character-creator
.test.js (+ a headless React render of both screens — needs `npm i
--no-save three@0.128.0 react@18 react-dom@18` in ONE install),
doorhq.test.js, party-builder.test.js. Verified in the bind pose only —
photograph a posed jacket over a tee next (`playtest_creator.js
--layers`). Full log: PARTY_BUILDER_PLAN.md §9 (rev 8 entry).

## CHARACTER CREATOR rev 7 — the wardrobe: LAYERS, straps that hold, skirts (2026-09-12, local delivery)
Every garment is a LAYER shell (`CC_LAYER_NAMES` = body · top · bottom ·
face · outer · feet · gloves · belt · skirt · buckle; each a SkinnedMesh
hidden when its cut is empty) with its own cloth surface at its own ease
(`clothSurface`), cuts, t-range, shading, fabric + tint (`LAYER_KEYS`;
sprites.js `EW_APPEARANCE_LAYERS` names the keys — `outerFabric` /
`outerColor` etc.; the skirt wears the top's for a dress, else the
bottoms'). Tables in three-renderer.js: `CC_TOPS` (tee · vneck · suit ·
crop · tank · atank · racer · tube · bikini · dress · gown), `CC_OUTER`
(jacket · blazer · vest · coat — an OPEN FRONT `open` + a `lapel` band;
the coat has a lathe `tail`), `CC_BOTTOMS` (trousers · shorts ·
shortshorts · briefs · bikini — a `leg` line — · miniskirt · skirt ·
longskirt — `skirt` = the lathe only), `CC_FEET` (sneakers · boots ·
highboots + `buildSole`), `CC_GLOVES`, `CC_BELT` (+ `buildBuckle`) ↔
sprites.js `EW_*_STYLES` catalogues (character-creator.test.js diffs
every one; the rev 6 `jacket` TOP maps to `outer: 'jacket'` in
`normalizeCharacterAppearance`). **THE ARM IS GEOMETRIC** (`armMask`:
the measured radius profile `part.armR` round the arm polyline + 9 mm,
plus a 13.5 cm hand sphere round the wrist joint) — never read the skin
weights (q[3]) for a cut again: they wander to |x| 0.06 on the back and
their isoline is a sawtooth. **A SLEEVELESS TOP = two PANELS + STRAPS**:
`panelCut` (the neck U `depth` → `xIn` ≥ 0.056 — the neck base is 5
cm(q) wide, anything inside climbs the neck — the panel `top`, the
armhole `xOut` → `pit` keyed off the shoulder joint) blended front /
back and UNIONED with `strapPath` capsules (a path sampled on the
shoulder, distance measured in the unrolled (x, arc) plane so the width
never depends on the ease or the mesh) and the racerback's `spine`.
**THE LATHE** (`buildLathe`): skirts, dresses, the coat's tail — the
pelvis as a radial map off the NORMAL-offset skin, draped vertically,
flared, a SWING allowance on the front / back panels (growing below the
knee), every column weighted to the nearest leg (a 50/50 blend of both
over ±27° at the front / back centre — a split lathe gaped in the idle
stance), the flare 35 % to the Hips. Rules: a straddling triangle is
subdivided before the cut (`refine`; `thin` layers also test midpoints);
a rim strip over another layer ends 1.5 mm past it (`under`); strip
normals come from the cut's gradient; every shade is a ramp (`line` /
`band`); generated geometry indexes past the layer's base (`nBase`).
Adding a garment = a table row + a catalogue entry (+ a `ccLayer` row in
party-builder.js for a new layer); `node creator-render.js male tee tag
'{"outer":"coat","bottoms":"skirt",…}'` renders any look headlessly;
`playtest_creator.js <tag> --layers` photographs every layer posed. Full
log: PARTY_BUILDER_PLAN.md §9 (rev 7 entry).

## CHARACTER CREATOR rev 6 — the sleeves, the straps, nine tops (2026-09-11, local delivery)
The tops are `CC_TOPS` (three-renderer.js "CHARACTER CREATOR RUNTIME") ↔
sprites.js `EW_OUTFIT_STYLES` (id + label; `EW_APPEARANCE_ENUMS.outfit`
derives from it, the builder's Top row reads it): tee · vneck · suit (the
v1 long sleeve) · jacket · crop · tank · atank (the A-shirt) · racer ·
bikini. Every top is CUTS in the q frame built by the rig's `topCuts`:
`hem`; a `neck` with separate front / back depths (blended by `frontness`)
rising to 0.852 by |x| = w (quarter-ellipse or v; `top` caps a stand
collar); `sleeve` = metres ALONG THE ARM'S POLYLINE (`armAt` — the cut is a
plane normal to the arm axis gated to the arm, a ring in every pose; never
an x-plane) or `null` = sleeveless: the arm goes by the rig's SKIN WEIGHTS
(`part.arm` → q[3] ARMNESS, interpolated by `mix`) and a `scoop`
superellipse keyed off `part.shoulder.x` shapes the front armhole / strap
(front / back may differ — the racerback); `bikini` = band + triangle cups
+ straps. Adding a top = one `CC_TOPS` row + one `EW_OUTFIT_STYLES` entry
(character-creator.test.js diffs them). RULES that came with it: the cloth
relaxation moves vertices along their NORMAL only (a plain Laplacian slid
them a centimetre and every bind-frame cut came out as a sawtooth); `split`
refines each crossing with secant steps (cuts are curves) — never a
clamped constant inside a cut (it flattens the interpolation); rim edges
are found by `on` masks (`split(poly, cut, bit)`), the hem strip is planar
with its own outward normal; the bottoms hang at their own ease (`CB`).
Tooling: `creator-render.js` `VIEW='{"name","yaw","cx","ct","scale"}'`
(a custom close-up, q units) and `NO_HEMS=1`; `playtest_creator.js <tag>
--tops` photographs every top on both bases posed. Full log:
PARTY_BUILDER_PLAN.md §9 (rev 6 entry).

## CHARACTER CREATOR rev 5 — the face off the mesh, the skull map, the cloth frame, welded weights (2026-09-11, local delivery)
Four fixes to the rev 4 rig (three-renderer.js "CHARACTER CREATOR RUNTIME"):
**THE FACE IS MEASURED, NEVER TABLED** — the two bases do NOT share a face
(male mouth line t 0.8985 / nose tip 0.918, female 0.8915 / 0.912; the old
`CC_FACE` put the male's lips in his chin). `_ccFaceLandmarks(q, nz, ids)`
rasterises the head's front into a depth map and reads nose tip, mouth line,
subnasale, sulcus, chin, nasion (eyes 3 mm(q) under it), mouth width and the
BROW RIDGE off the centreline / eye-column profiles into `lm.F`; the painter
reads `lm.F || CC_FACE` (the table is the fallback only). Brows sit on the
ridge, 2.6 cm(q) long. **THE SKULL MAP** — `buildSkullMap` (a radial height
field of the head, 64 × 32 bins) and `fitHair` push every hair card ≥ 4.5 mm
off it, conform the scalp cap to +1.5 mm and tuck the cap's rim under the
nape; the fit is centred on the skull's BOX centre (the centroid leaned one
way → one temple bald). Under any style the crown is painted in the hair
colour (`scalpOn` in `_ccBakeSkin`; `paintKey` carries bald ↔ hair). **THE
CLOTH FRAME** — garment UVs are cut like cloth in METRES on five centred
polyline cylinders (torso · arms from |x| > 0.155 q · legs incl. the pelvis;
`polyline` / `limbUv` / `clothRegion` / `clothUvOf` / `centreLimb`,
`fixClothUv` re-emits seam / region straddlers with their own vertices, cut
vertices re-project from position) — the Meshy atlas's islands made every
fabric a shattered patchwork. `EW_FABRICS.repeat` = tiles PER METRE now.
**WELDED SKIN WEIGHTS** — the rigged bases give the two copies of a seam
vertex different weights (2,835 pairs, up to 0.48 apart); a posed rig tore at
every UV seam ("cracks" on the shins and the shirt — invisible in the bind
pose, so invisible to every headless render). `part.siW` / `part.swW` weld
them per position group; every shell reads those. Tooling: `creator-render.js`
now renders fabrics + hair (+ `back` / `top` / `hair*` views); a crack the
headless tool cannot reproduce is a POSE problem → the Playwright probe.
Full log: PARTY_BUILDER_PLAN.md §9 (rev 5 entry).

## CHARACTER CREATOR rev 4 — the drape, the face shell, the eyes (2026-09-11, local delivery)
Three fixes to the rev 3 rig (three-renderer.js "CHARACTER CREATOR RUNTIME"):
**THE DRAPE** — the shirt front is no longer a flat chest plank: `drapeFront`
grids the relaxed cloth's front depth, takes each row's upper convex hull
(bridges the sternum valley, keeps convex sides round) and drapes each column
downward at a max fall slope (`DR.slope`), so a shirt hangs from the bust /
pecs. **SHADING** — every shell's normals are relaxed over the welded one-ring
(`smoothNormals`; strong on body + cloth, light on the face), skin roughness
0.8. **THE FACE SHELL** — the head (t > `CC_HEAD_T`) is a FOURTH shell
(`EWCreator_face`) with its own seam-free cylindrical UVs (`_ccFaceUv`, seam
at the back, seam triangles re-emitted at u + 1) and a 2048×1024 painted
texture (`CC_FACE_TEX`, half on mobile); the body wears the skin tone as vertex
colour, no texture. Eyes are ANTHROPOMETRIC (`_ccFaceLandmarks`: ±0.53 × the
front half-width, 53 % chin → crown — the bases' sockets are too faint to
detect and the old recess search put them at the temples), almond-shaped with
the iris under the lid, soft edges; the painter `faceColor` is allocation-free
with band gates (~265 ms per repaint in the browser; the vm test harness is
~15× slower — interceptor globals — don't trust its timings); the beard mask
follows the jaw. **`node creator-render.js`** (repo tooling, needs
three@0.128.0) renders the rig headlessly — body, cloth and the painted face —
to PNG; use it before the Playwright probe (see PLAYTEST_NOTES). The test
expects four shells. Full log: PARTY_BUILDER_PLAN.md §9 (rev 4 entry).

## CHARACTER CREATOR rev 3 — the charactercreation/ assets (2026-09-11, local delivery)
The Forge's GEAR → CHARACTER CREATOR dresses Homosapien slots from the
user's `charactercreation/` folder (repo + R2 `Assets/Models/charactercreation/`).
**The bases there are UNRIGGED** (Meshy "low_poly_unwrapped", 30k tris, UVs,
no skeleton) — never wire `…_<gender>.glb` directly. `node character-rig.js`
(repo tooling, zero deps) makes the runtime assets: `bodies` transfers the
old donor exports' (`rigged_animations/…_biped_Character_output.glb`, keep
them) 24-joint skin weights onto the new meshes → `…_<gender>_rigged.glb`;
`hair` splits `hair-pack-part-1/source/HairPackPT1.glb` into
`hair/hairNNN.glb` (one static GLB per style, textures embedded, centred on
its scalp cap). A new unrigged human base or a hair-pack-part-2 goes through
the same two commands. Data model = sprites.js `normalizeCharacterAppearance`
(v2; catalogues `EW_HAIR_STYLES`, `EW_FABRICS`, `EW_APPEARANCE_ENUMS`;
URL helpers `getHairStyleUrl` / `getFabricTextureUrl`; every asset has ONE
same-origin fallback via `getCharacterModelFallback` → server.js
`/api/character-model/*`). Runtime = three-renderer.js "CHARACTER CREATOR
RUNTIME" block (`_createAppearanceRig` + `_ccBakeSkin` / `_ccFaceLandmarks` /
`_ccLoadFabric` / `_ccHairTexture` / `_ccLoadHair` / `_ccWarmAssets`): the face
(eyes / brows / lips / facial hair) is PAINTED per texel through the base's
UVs onto an instance-owned skin canvas; garments are cut shells wearing a
fabric tileable; hair is the style GLB fitted to the skull and skinned to the
Head bone; tints are VERTEX colours (the board's Lambert swap keeps map +
vertexColors + side/alpha only). Rules that came with it: relax / average
normals over position-WELDED vertices (the unwrapped base splits every UV
seam — per-index maths tears the cloth); keep geometry INDEXED (base
vertices shared, cut vertices appended — a rebuild is ~0.2 s, not 1.7 s);
mutate `mesh.material` (the CURRENT one), never a stored material; hair
meshes wear `_ew_noTwin`; `state.js resolveIdentityForBuild` keeps a creator
look's gender (the stock human model is male-only). Dev: `EW_CC_DEBUG_UNLIT`
(unlit creator materials). Verify with `NODE_USE_ENV_PROXY=1 node
playtest_creator.js [tag]` (serves the creator assets from disk; see
PLAYTEST_NOTES "THE CHARACTER CREATOR PROBE"). `npm test` runs
`character-creator.test.js` against the real files. Full history + the
asset wishlist: PARTY_BUILDER_PLAN.md §9 (2026-09-11 entry). Not deployed
until the user uploads the rigged bases + hair GLBs and the edited files.

## THE VERTEX-TINTED GLOW — the creator's clothes and hair no longer bleach in the dark (2026-09-21, local delivery)
The user: "in dark places my created character's clothes and hair are super light and faded compared to
everything else." ROOT CAUSE (three-renderer.js `_attachUnitModel`'s Lambert swap — the board AND the HQ
walker go through it): every unit model gets the self-glow `emissive` WHITE × `emissiveMap` = its diffuse
map at `_unitSelfGlowIntensity` (0.15 by day, up to 0.85 at night). A Meshy bake carries its colour IN the
map, so the glow reads as the model's own colour; the CHARACTER CREATOR's shells and hair cards carry
theirs in VERTEX COLOURS over a near-white fabric tile / a greyed hair sheet, and Lambert's emissive never
reads `vColor` — so every creator layer glowed pale grey, untinted, over a diffuse scaled to 0.65. NOW:
**`_ewVColorEmissiveHook`** (right before `_attachUnitModel`; ONE shared function — the program cache keys
on its source) patches `<emissivemap_fragment>` with `totalEmissiveRadiance *= vColor` under `USE_COLOR` /
`USE_COLOR_ALPHA`, and the swap sets it as `onBeforeCompile` on any swapped material that wears
`vertexColors`, any `_ew_creatorHair` mesh or any `EWCreator_*` shell (the garment shells get their flag
from the paint pass, so the name is the guard). A model without vertex colours compiles to the old shader.
RULE: a self-lit material whose colour lives in vertex colours takes this hook — never a bare white
emissive again. character-creator.test.js pins it. Ship three-renderer.js to R2 + the bumped index.html.
UNSEEN LIVE (RULE #1c): the officer's coat / hair against a native in a dark room at night (0.85 glow).
