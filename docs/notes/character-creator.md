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

## CHARACTER CREATOR rev 12 — THE CLOTHES (the jagged edges, the clipping, the hanging skirt and coat, the prints) (2026-09-30)
mondo: "improve the character creator, especially the clothes models. Lots of weird jagged edges and clipping
through the body. Want the clothes and other accessories to look as good and realistic as possible." Every
outfit was captured POSED (idle + walk, close views of every hem, waist, collar, cuff and pocket, Playwright +
swiftshader) and each defect traced to its cause; the poke counts are rays whose first hit is an under layer
with the layer meant to cover it within 3 cm behind. All in three-renderer.js (`rebuildGeometry`), no data change.
- **THE FILLED BASE** (`filledBase(K)`, cached per rebuild): each layer hangs on the relaxed skin with its
  VALLEYS FILLED first (K passes of an outward-only normal relaxation) — an offset along the normals of a concave
  crease (neck/shoulder, armpit, navel, groin, seat) folded over itself: 1-2 % of every shell's triangles were
  FLIPPED (dark scratches, the layer under a jacket showing through as white slivers). The offset is now 3D along
  the filled base's normals (the cloth used to keep the skin's height: a jacket z-fought the tank on the shoulders).
- **THE LAYERS IN ORDER** (`orderOver`, `clearance`, `untangle`): every layer is pushed 3 mm past each layer worn
  under it wherever both cover a vertex (order: gloves < bottoms < bottoms2 < shoes < top < top2 < belt < outer),
  coverage from `cutVals` (every cut evaluated once, up front); the clearance is MEASURED (not the catalogue's
  eases); `untangle` relaxes any triangle still facing away from the skin under it. **THE FLY** relaxes the
  trousers' front; **THE COLLAR HUGS THE NECK** (a layer over another eases in to 7 mm within 3.5 cm(q) of the
  neckline).
- **THE RIMS ARE ONE FOLD** (`finishRims`): every collar, cuff and hem fold used to be a quad per edge with its
  own inward direction (a sawtooth inner edge); the rim edges are joined into nodes by position, each with ONE
  inward direction and normal, depth = the measured clearance − 1.5 mm. Every triangle is classified ONCE up front
  (`CLS`, `part.triNbr` for the T-junction fillers of a refined garment).
- **A LEVEL LINE** (`levelCut`): hems, waists, shoe tops and the belt's edges are cut at the CLOTH's height
  (`q[4]` on every record, carried by `mix` / `split`), not the skin's — the cloth hangs up to 2 cm off its
  skin's height over the belly and a skin-height cut came out as teeth (the hoodie's hem). The body under a
  garment is cut with THAT garment's cloth height per skin vertex (`ct`, `bodyRec`); `levelVals` re-reads the
  coverage once the cloth exists (a tee drawn a centimetre under its line came through the hoodie's side).
- **THE CUT PATCH** (`cutPatch`): pockets, flaps and welts are the layer's own triangles clipped by a
  superellipse in arc length round the body's axis (the thigh's for a side pocket), raised 3-4 mm with a puff and
  a wall round the edge — the old fans were flat cards that cut into the body. (`surfacePatch` stays for the
  tie knot and the bow tie.)
- **THE HANGING SKIRT** (`buildLathe` + `hangFrame` / `hangLathe` / `collideSkirt` every frame): below the
  waistband a lathe rides the HIPS (`rigid`) and the legs only PUSH it (the columns used to ride the legs and
  linear skinning pulled a V up between the spread legs of the idle stance); folds ripple every hem (`folds`).
  The coat, trench and parka shells stop at the hips (`hem` 0.50) and a TAIL lathe hangs from there (`tail`,
  open front `gapW`, the edges turned in, `flush` under the shell's hem, `noRim` on the shell's hem).
- **UNDER / OVER a lathe**: a skirt under a coat is held 6 mm inside it down to 1.2 cm(q) under its hem, with a
  3 mm-off-the-skin floor (`map0`), and widens as a cone below; the coat's fold over the lathe is held to 5 mm. A
  dress's skirt starts 1.2 cm(q) up its bodice, 4 mm off the trousers under it; the under layers are cleared AS
  DRAWN (every triangle sampled ~3 mm apart, each sample lifting its NEAREST grid point — lifting the four round
  each vertex stepped the ring on the waist's slope).
- **A TOP TUCKED INTO A SKIRT** (`tuckT`): every top's hem and every skirt's waist are 0.565, so the tank ended
  exactly at the lathe's top ring 9 mm(q) off the skin — a peach strip round the back. A top reaching the
  waistband runs on 2 cm(q) inside the skirt and the waistband HUGS it (`hug` 1.5 mm(q), `hugBuf`). A copy of
  the def (the defs are shared).
- **THE LATHE'S GRID**: empty bins take the straight line between the bins either side (`fillRuns`; the old fill
  copied the left one along the run — a plateau then a cliff, a bump at the back of every waistband); the seam
  column's normal no longer reads column −2 when there is no back split (`half` −1: a NaN normal — a black sliver
  at the top of every skirt's front seam, a tilted one down it).
- **THE COAT HANGS** (`hangBack`, the coat, the trench, the parka — the rows with a `tail`): the shell rode the skin into
  the small of the back and the seat's cleft (a long coat wrapped each buttock; a print on it came out as a heart).
  Each 5 mm row from 0.47 to 0.82 is pushed out, radially round the pelvis axis only, to a TAUT LINE: the row's convex
  hull (all of it within 60° of the back, eased out by 90°) and down each of 96 columns the least concave line over the
  rows (85 % of it, eased out from 125° round the back), pinned at the belt (`beltBand.t`). What moved within 60° of the
  back is left out of `untangle` (it bridged the notch over the join). Every patch there that ends up facing IN or on
  edge is relaxed over its new surface with three rings round it until every triangle faces out (bright and dark specks,
  a crack over the tail's join); a whole-back relaxation was tried and tore every print (the uv stayed with the skin).
  Flipped triangles on the long coats stay at the old counts (coat 21, trench 25, parka 18 of ~15k).
- **A COAT HANGS FROM THE HIPS** (`hipsBand`, `hipsBack`, `hipsTop`): the shell's back weights (and the trim's) are all
  the hips' up to 2 cm(q) over its hem, eased back to the skin's by 8 cm(q), over the back half only (the front panels
  follow the thighs); the tail's top band rides the hips too and sits 2 mm(q) inside the shell (`flush`), so the two meet
  in any pose. A vertex an arm bone owns is left alone (the cuff tore off the wrist in a walk).
- **THE PRINTS** (stripes, plaid, hearts…): every cloth layer's uv frame is read off its OWN cloth (`clothFrame`; the
  skin's, FR0, is the fallback) — the base vertices kept the skin's uv while the cut vertices were re-projected from
  the cloth, and a print kinked along every cut and tore over the fly, the seat and a hung back. The tops and the belt
  use `clothRegionTop` (one torso cylinder down to 0.46: the jacket's band switched to the leg cylinders at 0.565).
  A polygon across two cylinders is CUT along the line between them (`frameLines` in `emit`), a polygon across the
  wrap seam is cut at the angle π (`fixClothUv` returns the pieces) — both used to switch along triangle edges, torn
  into teeth. `limbUv` rounds every joint of a limb's polyline into an arc of 4 R (`limbPath`; `limbNearest`, the arm's
  capsule, keeps the sharp polyline): v jumped by 2 r tan(θ/2) across each elbow in a staircase. The torso and the legs
  take v = the HEIGHT (`level`: plaid runs level round a shirt, across a seat), every limb's print stands upright
  (`flipU` / `flipV` — hearts stood on their heads on sleeves, trousers and skirts), and a cylinder whose turn is near a
  whole half metre (torso 0.94 m, legs 0.53 m) is scaled to it (`uvS`): every fabric tile is 1/16 … 1/6 m, so the print
  meets itself at the back and the inseam. The lathes (skirts, the coat's tail, a dress's skirt) wear the torso's uv, so
  a tail and a dress's skirt run on from the body's print. The arms keep a seam under the arm, the trousers at the fly
  and the seat. Still: a cylinder over the flat top of the shoulder stretches a plaid's lines there (as before).
- **THE TRENCH'S BELT** is one level loop: the layer's triangles cut by the belt's plane, the outermost crossing per
  3.75° round the pelvis axis (two halves met at x = ±0.144 and stood off the hip as flags; nearest-vertex samples made
  the edges wave). Every ribbon (belt, plackets, sandal straps) takes the frame's uv at both edges (a 4 cm belt had its
  weave squeezed into streaks), and its walls turn from the side toward the top (the belt's lower wall was a black line).
- **BUTTONS** are domed (`disc(…, dome)`: the rim 30 % lower, normals leaning out) — a flat dark button read as a hole.
Checked posed (idle, walk 0.3) front and back for every outfit and every print above. Probe: a Playwright page on the
creator (swiftshader), `/shots` with the look and the views; a same-look `update` does not rebuild, so every capture
first nudges `width` by 3e-6.
Results (posed): trousers through a dress 0 pokes (idle, walk 0.3 / 0.8, front + back); tee through a hoodie 0;
tank through a skirt 0 (four sides, idle + walk); the skirt's waistband top row |Δ²| mean 0.2 mm in walk.
Not done: a skirt worn OVER trousers (bottoms2) still stands its big ease (2 cm(q)) off the body at the waist.

## CHARACTER CREATOR — THE WINGS (2026-10-27)
mondo's wings upload (Assets/misc/wings.glb, the Occulus's wings) is an ACCESSORIES part: `wings` none / feathered +
`wingsColor`. Not skinned: each wing is a plain mesh on a hinge, the pair a child of Spine02 through boneInverse ×
bindMatrix, beaten in tick(). Full notes: docs/notes/models-assets.md "THE OCCULUS WINGS".
- 2026-10-27 later: Feathered = mondo's single ANGEL wing (Assets/misc/wings/…angel…), doubled and mirrored by three-renderer.js
  `_ewWingPair` (models-assets.md "THE SINGLE WINGS").

## CHARACTER CREATOR — THE RACE LOOKS (2026-11-01, cowboy + cowgirl test; character-models-plan.md row 17)
mondo: "eventually I want every character to have a new version made from the character creator, and for me to be able to
edit it and export to bake the default looks into the game". A race look = a creator appearance that REPLACES that race's
Meshy model as its default (battle, forge, party builder, hub, cutscene viewer).
- **Data**: sprites.js `RACE_CREATOR_LOOKS` = `{ race: { male, female } }` (full normalized appearances), between the
  `// RACE_CREATOR_LOOKS:BEGIN` / `:END` markers — written ONLY by bake-looks.js. `RACE_CREATOR_LOOK_DEFS[race]` holds the
  def extras the Meshy def carried (cowboy: `basicAttackKind: 'ranged'`, `hold` = the R2 revolver on RightHand).
  `getRaceCreatorLook(race, gender)` (cached, a copy), `hasRaceCreatorLook(race)`. `EW_CREATOR_LOOK_RACES` now also
  lists every baked race, so `getCharacterAppearanceModel` builds the creator body for them: a unit's own appearance
  wins, else the race look. The returned def carries `raceLook` (the look it was built from); three-renderer.js uses
  `def.raceLook || unit.appearance` for the rig + the appearance key (units, plates, party members, `_cvSetCharacter`).
  The race def's own library overrides (the cowboy's quick-draw cast) carry over.
- **Original model**: appearance `model` enum `creator` / `original`. `{ model: 'original' }` on a slot = that slot
  wears the old Meshy model (nothing deleted). `window.EW_DISABLE_RACE_LOOKS = true` = every race back to Meshy.
- **Forge** (a slot of a baked race > GEAR > CHARACTER CREATOR): the creator opens on the race look; edits save on the
  slot as usual. Footer: RESET TO DEFAULT LOOK (drops the slot's own look), USE ORIGINAL MODEL / USE THE CREATOR LOOK,
  ⇩ EXPORT DEFAULT LOOK (gold) → `Entropy_Wars_Race_Look_<race>_<gender>_<yyyymmdd-hhmm>.json`
  (`{ kind: 'entropy-wars-race-looks', v: 1, looks: { race: { gender: appearance } } }`, `pbExportRaceLook`).
  The export shows only on a race that has a baked look: a new race starts with a Claude thread baking a first look
  (bake-looks.js on a hand-written export), then mondo edits + exports it like the cowboy.
- **Bake**: `node bake-looks.js <export.json …> [--dry-run]`, `--list`, `--remove race[:gender]`. Runs each look through
  the game's own normalizeCharacterAppearance (sprites.js in a vm), refuses a non-race / an 'original' look, rewrites
  the block (later files win), reloads sprites.js. Then node --check, bump ?v=, PR + zip.
- **Online**: nothing relayed — every screen resolves the same race look from sprites.js; a slot's own look rides in
  the unit's appearance as before.
- Cowboy (male): MPFB classic male, short hair, red work shirt, denim, the Blender duster (row 12), high boots, belt, scruffy beard,
  cowboy hat. Cowgirl: MPFB classic female, long red hair, cream shirt, denim, boots, gloves, belt, cowboy hat.
- Known: the classic male's body logs "computeBoundingSphere NaN" in the creator (its 16 morph attributes keep 15464
  entries after writeGeometry cuts positions to 15112) — pre-existing, harmless, not the hat.
- The viewer (forge / party builder) now also attaches a def's `hold` (`_cvSetCharacter`, at the board's gun-to-body ratio),
  so the cowboy holds his revolver there too (and the Door Agent his gun). The MPFB hands idle OPEN, so the revolver hangs in
  the fingers (rot [0, 0, 0] read best of eight tried); a gripping hand pose is not done.

## CHARACTER CREATOR — THE REFERENCE (2026-11-01)
mondo: "a button or toggle ... that lets me see the original mesh model of the race im working on in the character creator so
i can reference it". USE ORIGINAL MODEL was not that: it writes `{ model: 'original' }` on the slot and the slot's own edits go.
- party-builder.js: while the creator is open on GEAR (a race look or the DOOR Agent, a look on screen, the race has a
  RACE_MODELS_3D entry) the stage's top pill is a button: **◐ SHOW ORIGINAL MODEL** → the stage (HeroViewer3D) gets
  `{ model: 'original' }` (a race-look race) or no appearance (the DOOR Agent), so the race's own Meshy model stands there;
  the pill reads **◑ ORIGINAL MODEL · BACK TO MY LOOK** (gold) and a press goes back. Nothing on the slot changes; the
  export still writes the look being edited.
- State `creatorRef` = the `player:slot:race:gender` it was pressed on, so another slot / race / gender, or leaving the
  creator, is back on the look. Any creator edit (`changeAppearance`) turns it off so the change shows at once. A move
  preview's pill takes the spot while it runs. UI only, nothing online.

## CHARACTER CREATOR — THE FACIAL HAIR + THE GRIP (2026-11-01, mondo on the cowboy)
- **Facial hair on an MPFB body**: the classic painted beard (`beard`) paints the classic face only, so FACE hid it on every
  MPFB body. Now an MPFB body's FACE lists **Facial hair**: Clean + the pack's beards and moustaches (sprites.js
  `EW_MH_FACIAL_HAIR` = the Body parts rows named beard / moustache / goatee / stubble; one at a time, kept in `wear`), then
  **Facial hair colour**: `beardTint` 'hair' (default: the hair colour), 'pick' (`beardColor`, the hair swatches) or 'own'
  (the piece's own texture). three-renderer.js `paintFacial`: the piece's texture through `_ccPackHairTexture` (the pack
  hair's grey levels) × the colour × 1.22, like `paintHair`. The same pieces still show under MakeHuman clothes > Body parts.
- **The grip** (mondo: "how do we get the hands with the fingers?"): the MPFB classic rig ALREADY has skinned finger bones
  (index / middle / ring / pinky / thumb _01-_03 _l / _r) — no hand graft needed. No animation drives them (the library
  retarget, `_ANIMLIB_MAP`, stops at the hand), so they sit open. three-renderer.js `_gripHand` (called by
  `_unitAttachHeld`, board + viewer) curls the holding hand's fingers once about each finger's hinge (its direction × the
  palm normal, from the bind pose); no clip touches them, so the curl holds under every clip. `GRIP_CURL` = degrees per
  joint (index lighter: the trigger finger). A `hold` with `open: true` skips it. Meshy rigs (no finger bones): nothing.
  Not done: fingers animated by the clips (the UAL library has finger tracks; mapping them is a retarget change).

## THE FACE CAMERA (2026-11-01)
mondo: "when editing facial features or hair or headwear in the character creator, please make the camera zoom into the
face closeup". A press or a focus anywhere in the creator controls (party-builder.js CreatorControls, both homes: the
forge GEAR panel and Occam's mirror) calls `EWCharViewer.frameCreator('face' | 'body')`; the stage camera glides there.
- Zones: each control's own `data-cc-cam-own`, else the nearest `data-cc-cam` section marker above it in the panel.
  FACE (sliders, eye / lip colour, facial hair, MakeHuman Eyes / Brows / Lashes), HAIR (styles, colours), Glasses, and the
  MakeHuman clothes Hats / Glasses / Masks (+ any pack beard, moustache, horns, antlers, head mirror, headset) = face.
  BODY, MakeHuman Skin, the Chest row, SKIN, CLOTHES, LAYERS, Neckwear, Wings, the footer (RANDOMIZE…) = body. The name /
  locker row moves nothing. A new face-type control = put it under a face marker or give it `data-cc-cam-own: 'face'`.
- three-renderer.js `_cvFrame`: in face mode the camera height, look point, depth and side follow the middle of the head
  (`_cvHeadPoint`: halfway between `Head` and `head_end` on the classic Meshy bases; `Head` + 1% of the height on the MPFB
  rigs, which put Head mid-skull), every value eased (the same 4.5/s ease as the distance), so the move in and out is one
  glide. The close-up shows `CV_FACE_FRAME` (38%) of the model's height; the head sits `CV_FACE_LIFT` above the canvas middle
  (the forge tray covers the canvas bottom). Scales with the Height slider and every body (classic, MPFB, MPFB classic).
- Only a zone CHANGE moves the camera, so wheel zoom / drag inside a zone stays. Entering the face turns the turntable to
  the nearest front and ends a running preview. A body swap while on the face stays on the face. Closing the creator
  (unmount) returns to the full body. FACE CLOSE-UP / FULL BODY buttons share the same state.
- rev 2 (2026-11-01, mondo: "the characters heads are pointed down in their idle pose ... more zoomed in and pointed up at
  their face in clear view"): the close-up is tighter (`CV_FACE_FRAME` 26% of the height) and sits BELOW the face looking up
  (`CV_FACE_POLAR` -0.34 rad), so a bowed idle head and a hat brim no longer hide the face. The tilt eases in and out
  (`polarTo`); dragging takes over at once; a double-click on the face close-up returns to the upward look.
- **THE SEAT** (2026-11-01, mondo: "fix the positioning of the revolver ... make his hand wrap around the handle"): a hold's
  `grip` = the prop GLB's handle in its own coordinates (`c` its centre, `down` the way down the handle, `barrel`), measured
  from the file (the Meshy revolver: c [0.657, -0.215, 0], down [0.404, -0.915, 0], barrel -X). three-renderer.js
  `_gripFrame` seats it from the hand's bones: the handle runs down the knuckle line (index -> pinky knuckle), the flat side
  on the palm, the barrel forward (wrist -> knuckles); its centre `depth` 0.25 hand-lengths (wrist -> knuckle line) into the
  palm and `back` 0.22 toward the wrist from the knuckles — inside the curled fingers (`GRIP_CURL`), the index at the trigger
  guard. `pos` / `rot` stay the fallback for a rig without finger bones. The cowboy's revolver is `h: 0.21` (~25 cm on a
  1.8 m body; the catalogue's 0.3 was too fat for the fist). Tuned on close-up renders of the hand (a probe camera on the
  forge stage's own renderer: EWCharViewer.dev.state()), male and female.
  2026-11-02: the door gun uses it too (door-gun-skate-vehicles.md "THE DOOR GUN IN THE FIST"); a hold's `turn` is kept and the
  grip vectors turn with it; a rig with no finger bones seats the handle on the palm read off its skin (`_gripFrameMesh`).

## THE COAT OVER THE CLOTHES + THE HAIR ON THE SHOULDERS (2026-11-01)
mondo: "adding an outer layer makes the lower clothes layers clip through the outer layer. and the cowgirl's hair clips through her
shoulder". Checked in the creator stage (Playwright + swiftshader, EWCharViewer.snapshot, posed idle + bind pose) on the Cowgirl and
Cowboy (MPFB classic female / male) and MPFB female; shots /mnt/project-files/creator-clipping/. All in three-renderer.js.
- **The coat over the clothes**: a Blender Outer pick (EW_BLENDER_COATS, the trench, the duster ...) is a real mesh; the coded top under
  it stood 1-2 cm off the skin and came through its sleeves, shoulders and back (white patches on the Cowgirl's sleeves). The coat already
  hides the skin it covers (its `del`, `wearHide`); `part.outerHide` = the same mask from the outer garment alone (`wearMask(part, only)`),
  and rebuildGeometry leaves every coded layer's triangle out where it touches that skin (the `oHid` check in the garments loop). Coded
  outers (cardigan, coat ...) were already clean (orderOver) and are unchanged. Skirt lathes under a Blender coat are not touched.
- **The hair on the shoulders**: a style is fitted to the skull only (fitHair), so long pack hair hung where it hung on the body it was
  made for: into the shoulders, the chest and the shirt / coat. Two fixes. `hairClear` (end of fitHair, before the sway): every hair
  vertex under the jaw is held `HAIR_CLEAR.gap` (4 mm) over the outermost thing worn at the skin nearest it (the skin as built,
  `part.collP` / `collN`; every coded shell; every pack / Blender garment but a beard), pushed along that skin's normal, smoothed over
  the hair (spaceSmooth) and topped up. And `swayHair`: the chains hang from the **neck** bone (the Head bone if a rig has none) and the
  face-side strands under the jaw blend onto it: on the Head bone the idle's bowed head swung the hair back through the shoulders it
  cleared in the bind pose. Tried and dropped: shoulder / upper-arm capsules on HAIR_SWAY (they pushed the side chains back and pulled
  the front strands into the chest).
- **Rev 2 (same day, mondo: "the hair is still going through the outer layer" in the after shot)**: posed, the hair still sank up to
  4 cm into the duster (a posed check: every hair vertex skinned with applyBoneTransform against the coat's posed surface; 132 of ~1,000
  near it inside before, 55 after, median 2 mm, the rest at the back sides behind the arms). The bind clearance held only in the bind pose:
  the hair hung from the head / neck + chains while the coat moved with the spine. **`hairRide`** (after swayHair): a hair vertex under the
  jaw within `HAIR_RIDE.near` (3 cm) of what is worn takes the weights of the GARMENT it lies on (the pack / Blender wear's own weights
  within 4 cm; else the skin's), arm bones left out, fading back to the head / neck / chains by `far` (8 cm) and over 4 cm under the jaw,
  smoothed over the hair; free tips still swing. fitHair resets the hair to the head's weights first (hairRide blends once). Also found
  in the same shots: the Cowgirl's coded BELT came through the duster's back and its BUCKLE through the closed front (the coat hides no
  skin there). `coatIn` = the coat's inner surface over each skin vertex (nearest of its vertices over that skin, 2 rings run-on); a coded
  layer within 6 mm of it is left out there, and the buckle is skipped under a closed coat. Close-ups:
  creator-clipping/cowgirl_duster_hair_closeup.jpg (before / last fix / now), cowgirl_duster_belt_before_after.jpg.
- Known: hair strand tips are ragged by the texture itself (alpha cut), on any body.


## THE POSES AUDIT: HATS, LAYERS, NAPE, SHOULDERS (2026-11-01)
mondo: "can you check to make sure all the clothes and hairs and accesorries etc also move out the way for all poses/idles?" (the
tint half of that message went to its own thread). A posed clip check (a scratch Playwright page: every creator mesh skinned with
applyBoneTransform at 2-4 frames of each clip - idle, walk, run, castMagic, castAOE, castKick, hit, climbWall, castSupport - and every
pair tested: the body against each garment, each lower layer against each upper one, the hair against the body / clothes / hats; a
point counts when it sits more than 4 mm on the wrong side of the other surface within 1.2 cm of it) ran over 80 pack outfits (all 476
pack pieces in 161 combinations were queued; 80 done, then the coats, capes and coded wardrobe, 52 looks). What it found, and the fixes
(all three-renderer.js):
- **Hair through hats (static, every pose)**: a hat or helmet was laid over the style fitted to the skull, so every style fuller than the
  hat stood out through its crown and sides (a pixie through the cycling helmet, any style through the knight's helm; 133k points over
  97 looks, the worst static problem). **`hairUnderHats`** (fitHair, before hairClear): every hair vertex under a hat's OUTER shell (hat
  vertices facing away from the skull centre, `HAIR_HAT.lat` 2.5 cm to the side) is pulled to `gap` (3 mm) under it, smoothed over
  the hair, topped up; what hangs below the rim or under a brim stays. A garment's part ON the scalp counts as a hat too (its vertices
  whose nearest skin is above ear level, within `onHead` 5 cm: a hood worn up, a habit, a mask over the crown like the luchador's). **`hatRide`** (after the sway): those vertices
  take the hat's own weights, so the hair under a helmet whose rim rides the neck stays under it. wear entries now carry `cat` + `z`.
- **Pack clothes through each other (static)**: two pack / Blender garments were each fitted to the bare body; the lower one (MakeHuman
  z_depth) stood out through the upper one wherever it was fuller (trousers through an untucked tank: 2,263 points -> 97; a bikini
  through swim trunks 402 -> 160). **`wearLayers`** (replaces the rebuild's wearFollow call; also at the end of setWear's apply): top
  down by z, each lower garment's vertices under an upper one (within 1.5 cm to the side of its nearest vertex) are pulled `gap` inside
  it along the upper one's outward normal (turned away from the skin it sits on), smoothed over the lower garment, topped up; kept as
  `w.lay` and added in wearFollow. Underwear always goes under the rest whatever its z, then shoes + gloves (`zOf` z - 500: the trousers
  come down over over-knee boots, a sleeve over a long glove); a cape is only ever the upper one and is over every other garment whatever its z (the police coat stood through the hooded
  cape's front), and what lies under a cape goes
  `capeGap` 1.2 cm in (the cape rides its own chains, the coat the body: they slid through each other in stripes on the Overlord cape's
  back). Not for hats, glasses, masks, props, body parts. Equal z: neither moves.
- **The side reach grows with the garment's spacing (`wearSpan`)**: pack / Blender garments have vertices 2-4 cm apart, so a point
  between them was more than the fixed 1.5 cm from the nearest one and was skipped (patches of coat through the hooded cape, skin
  through the t-shirt). Per vertex, 0.75 x its longest edge (capped at `latMax` 3.5 cm), only 1.5 cm on an open edge (hem / cuff /
  neck), welded by position, cached per geometry; used by wearLayers and skinPokes.
- **Skin through tight pack clothes (static, worse posed)**: a pack garment hides only the skin MakeHuman listed (its delete_verts; a
  tucked t-shirt lists none), so on the classic MPFB bodies the skin came through in patches (the back of a t-shirt). **`skinPokes`**
  (rebuild, after wearLayers; MPFB bodies): a skin vertex under a garment that is not at least `SKIN_POKE.gap` 1 cm inside it is marked
  (the margin covers the few mm a garment on its own weights slides over the skin when posed); a skin triangle with all three marked is
  not drawn, so no hole opens at a hem. Hats use 1.5 mm (the face camera looks up under a brim); cut-out garments (`_ew_noTwin`: lace,
  fishnet), capes and open shoes (cat shoes with no delete list: sandals, the toes show between the straps) are skipped. The Blender
  shoes (row 12c, cat shoes) fold under trousers like the pack shoes.
- **Coded clothes through pack clothes (static)**: the coded trousers' waistband came through a pack tunic / sweater (they were only hidden
  under a Blender coat). `wearCovers(w)` = a Blender coat or any pack garment but underwear / hats / props: `part.outerHide` and `coatIn`
  (THE COAT OVER THE CLOTHES) now come from all of them, so every coded layer is left out under any pack garment the way it is under a coat.
- **Short hair into the nape (run, hits)**: hair on the Head bone alone sank into the back of the neck when a clip turned the head on the
  neck (the skin there rides the neck too). **`hairSkin`** (last in fitHair): a hair vertex still on head / neck bones only, within 1 cm of
  head-or-neck skin (fading out by 2.5 cm), takes that skin's own weights.
- **Long hair into the raised shoulders (castMagic and the arm-raising casts)**: hairRide left the arm bones out entirely, so a shoulder
  lifting under the hair came up through it. The upper arm (Left/RightArm only) now counts at `HAIR_RIDE.upperArm` 0.5 of its weight;
  forearm / hand still out. Partly fixed: an arm swung up THROUGH a strand hanging in front of the shoulder still passes through it (no
  arm collision on the front strands; the arm capsules tried in rev 1 pulled the strands into the chest).
- **Hair through a coat's collar / trims**: hairClear only read a garment's main mesh; its accents (a cassock's collar, fur trims) share the
  vertices but have their own triangles. It now takes the accents too.
- Not changed (by design or not a clip): props held in the hand (guns, a guitar, a hammer) meet the hand; open shoes / sandals show the toes;
  a long Blender skirt still lets a high kick's thigh through (its spring chains follow the thighs; no cloth collision); a cape's front
  flaps hang on their chains, so a coat under them can still show at the chest when the idle leans into them (the hooded cape over
  the police coat, better than before but not gone).
Shots: /mnt/project-files/creator-clipping/poses_hats.jpg, poses_layers.jpg, poses_skin.jpg, poses_capes.jpg (before / after, posed).

## THE WEAR TINT (2026-11-01)
mondo: "add a way to change the tint/color of the cowboy hat, and other clothes/accessories that were from the asset packs since they
have their own textures". CLOTHES > under the MakeHuman clothes tiles, "Colours of the clothes you wear" lists every worn pack piece
(the 476 MakeHuman garments incl. the 65 shoes, the hats / masks / glasses / equipment, his cowboy hat, the Blender costume pieces that
keep their own texture: mummy, ghost, do-rag, suspenders, coin belt, luchador). Each: ORIGINAL COLOURS (default) or PICK A COLOUR
(swatches + custom). Data: `appearance.wearTint = { <worn wear id>: '#rrggbb' }`; sprites.js `normalizeWearTint` keeps worn, tintable
ids only (`wearTintable`: not the facial hair, which has its own beardTint row, nor `EW_WEAR_LAYER_PIECES`, the Blender pieces that
take the Top / Bottoms colour + fabric). Renderer: three-renderer.js `paintWear` (called beside paintFacial in setWear's apply and in
update): a tinted piece wears `_ccPackHairTexture`'s grey mask of its own texture (the pack hair / beard levels: folds, seams, stripes
and the hat band stay as shading) x the colour x1.22; no entry = its own texture + material colour (`w.tint.own` / `c0`). Accent
primitives keep their colours. Works on the board too (same rig). EXPORT DEFAULT LOOK carries `wearTint` (it is part of the
normalized appearance) and bake-looks.js writes it into RACE_CREATOR_LOOKS (its log line counts the tinted pieces). Checked in the
forge on the Cowboy (Chromium + swiftshader): hat original / black / red / brown / custom / original again, a pack striped shirt +
ankle boots tinted green / red.

## THE SECOND OUTER LAYER (2026-11-01)
mondo: "i want to be able to add another outer layer in the character creator, it will only let me add another top layer but i want
another outer layer with the coats and stuff. And the layers and clothes beneath it shouldn't clip through it". CLOTHES > LAYERS >
＋ ADD LAYER > SECOND OUTER LAYER: the Outer layer's whole catalogue (coded jacket / blazer / vest / coat / cardigan / hoodie / trench /
parka + every Blender coat, robe, uniform, costume), with its own fabric / colour / print (`outer2`, `outer2Fabric`, `outer2Color`,
`outer2Pattern`, `outer2Color2`; sprites.js EW_APPEARANCE_LAYERS row `outer2`, extra: true; starts as a Coat; a Blender pick starts at
its own `look`). It is worn OVER the Outer layer (and under a cape). Normalized like every key, so EXPORT DEFAULT LOOK / bake-looks.js
carry it (bake-looks.js prints it). Renderer (three-renderer.js), one path per kind of pick:
- **Coded over anything**: shell `outer2` (CC_LAYER_NAMES[15]), `OUT2` = the catalogue row through `_ccOverDef` (+8 mm over a first
  outer), cut + built LAST of the cut layers, so the layer order (orderOver) pushes it past the first outer and everything under; its
  details (buttons, pockets, the trench belt) come from layerRow; its own lapel (`lapelOf`). Over pack / Blender garments (a Blender
  coat as the first outer, a pack shirt) `wearOverLayer()` puts their outermost surface over each skin vertex (+9 mm, they ride other
  weights once posed) in ORDERED as a stand-in layer, so the coded coat is pushed out past them; the `outer2` shell is never left out by
  outerHide / coatIn (it is over them). Its tail (coat / trench / parka) is a lathe on the `outer2` shell, hung first and over the
  skirts + `wearOver`; the first outer's tail is held inside it (`over` / `overLathe`, the skirt-inside-a-coat path), a skirt inside the
  innermost outer; `tail2G.under` = the first tail, the lathes sorted inside out; hipsBand on `outer2`.
- **Blender over anything (MPFB bodies)**: setWear `@outer2` -> buildWear `outer2_<id>`, `layer: 'outer2'` (painted by the outer2 keys
  through the `outer2` shell's material), `z: 200`, so THE LAYERS (wearLayers) fold a Blender first coat in under it; coded layers under
  it (the first outer included) are left out by outerHide / coatIn like under any coat; a coded first outer's TAIL is dropped when the
  Blender coat reaches within 3 cm of its hem (a lathe is not cut by the skin the coat hides). A classic base wears the coded twin.

- **What else keeps it clean** (found in the browser checks, idle pose, 16 combos):
  - `hidAt` in buildDetails: a coded layer's pockets / placket / buttons / zip tape / belt band are skipped where the skin under them is
    hidden by a Blender / pack coat (outerHide, coatIn): a blazer's welt pockets stood through a Blender greatcoat.
  - `wearUnderBufs()`: a coded outer2 tail's lathe also rides over the Blender / pack garments (their triangles pushed 8 mm out, arms
    skipped) as fake under-buffers.
  - `tail2Off`: a coded outer2 TAIL is dropped (the coat stops at the hips) when a Blender / pack garment under it (outer, dress, skirt,
    suit) hangs more than 3 cm below its hem: a cassock came through the coded trench's lathe. Known limit: a coded long coat over a
    long Blender robe reads as a short coat.
  - `wearUnderOuter2(part)` (Blender over Blender / pack): every triangle of a garment under the Blender outer2 whose 3 vertices are all
    under it (nearest non-open coat vertex within 6 cm along its normal and within max(1.5 cm, min(0.75 x spacing, 3.5 cm)) to the
    side, or within 6 cm anywhere when the vertex sits on skin the coat hides) is dropped from the index (`mesh._ewIx0` keeps the full
    one; wearSpan reads `_ewIx0`). A duster's lapels came through a police coat, a gi's wide sleeves through a leather coat. Runs after
    wearLayers in the rebuild and in setWear's apply.
- Pre-existing, not from this pass: the coded coat's back has a diamond-shaped hole on mpfb_female; a Blender greatcoat's own front hem
  shows a light patch.

## THE IDLE POSE (2026-11-01)
mondo: "can we also add an option to change their idle pose in the character creator?". BODY > "Idle pose" (under the body
sliders): **Default** (the body's / race's own idle, unchanged) + 13 standing idles that were already in the shared animation
library (nothing new made): Wide stance (MAL1 Idle_5, the creator bodies' own), Upright (Idle_11), Relaxed (UAL1 Idle_Loop),
Brawler sway (Idle_10), Arms folded (UAL2 Idle_FoldArms_Loop), Talking (Idle_Talking_Loop), Shaking head (Idle_No_Loop), Sword
ready (Sword_Idle), Pistol ready (Pistol_Idle_Loop), Shield guard (Idle_Shield_Loop), Spell ready (Spell_Simple_Idle_Loop), Crouch
(Crouch_Idle_Loop), Zombie (Zombie_Idle_Loop). Left out: the prop idles (torch, lantern, phone: no prop in the hand), the sit /
rail / swim / ninja-jump loops (no seat, no rail, mid-air) and Block3 (a two-hand guard over the head that covers the face + hat).
- **Data**: sprites.js `EW_IDLE_POSES` (id, label, clip, lib, ts); `appearance.idle` is an EW_APPEARANCE_ENUMS key ('default' first),
  so normalizeCharacterAppearance keeps it, EXPORT DEFAULT LOOK carries it and bake-looks.js writes it (its log line names the idle).
  RANDOMIZE keeps 'default'. `getCharacterAppearanceModel` turns a pick into `def.idlePick = { clip, lib }` (+ libTimeScales.idle);
  a pick that is the def's own idle clip is no pick.
- **Renderer** (three-renderer.js): the shared per-model bake (`_libBaked`, keyed by the model, shared by every unit on that body)
  is never changed. `_animLibBakeForModel` is now a wrapper over `_animLibBakeForModel0`: with a `def.idlePick` it bakes the pick on
  demand as the synthetic slot `'clip:<clip>'` (`_libIdlePickClip` -> `_libBakeSlotNow`, synchronous once the libraries are resident)
  and hands THAT caller a copy of the bake whose `idle` is the pick. So the board, the forge stage, exploration and the party
  line-up all stand in the picked idle, and two looks on the same body can idle differently. The stage swaps the idle without a
  reload when only the pick changed (`_cvSwapIdle`, 0.25 s crossfade; during a MOVE PREVIEW the new idle is what it hands back to).
- Online: the look rides the slot's appearance like every other key, so the guest builds the same def and plays the same idle.
- Checked in the forge (Chromium + swiftshader) on the Cowboy (cardigan, gloves, hat, revolver) and the Cowgirl (long pack hair,
  suit, hat): every idle front + back at two moments. Shots: /mnt/project-files/idle-pose/.
- **Pass 2 (2026-11-02, mondo: "Still getting some layers clipping through for the second outer layer")**. 26 combos x 15 poses
  (default idle, walk, cast, attack, hit + the idle picker's FoldArms / Crouch / Sword / Pistol / Shield / Zombie / Idle_10 / Spell /
  Talking), under layer painted red:
  - **The opening stays on the front** (`torsoMid` / `frontnessMid` in topCuts): `frontness` counts z > -0.03 q as front, but the MPFB
    bodies' backs sit only 1-3 cm behind the q origin, so every coded coat's front opening was ALSO cut down the spine: a diamond
    on mpfb_female's back (the "pre-existing hole" of pass 1), a slit on mpfb_male's, the layer under it showing through. The opening
    is now also held to the front half of the torso at its height (the middle of its front + back, |x| < 0.03 q, per 0.01 t, cached
    as part._torsoMid). This fixes the single Outer coat too.
  - **Coded under coded**: every coded layer is left out of a body triangle the coded outer2 covers whole (`g2i`, CLS === 1) and its
    details too (hidAt reads part.out2Cov): posed, the spine + armpits fold and the jacket came through the coat's back.
  - **Blender under coded** (wearUnderOuter2 with no Blender top): a garment vertex on skin the coded outer2 covers whole
    (part.out2Cov, welded) and no further off the skin than the coat + 3 cm is hidden; part.out2Cov is set in the cut build, and
    wearUnderOuter2 runs again right after it.
  - **Blender under Blender**: a vertex within 3 cm of the coat's OPEN edges (hem, vent, front split) that stands less than 4 mm
    inside the edge is hidden too (`pokesAtOpening`, OUTER2_HIDE.openReach / openOut): the duster under a leather coat came out
    through its back vent and front split; what lies behind the edge still shows through the opening. Each mesh of a garment (its
    body AND its accents) is tested on its own vertices (`eachMesh`, accents anchored with nearestBody): the accents were cut with
    the body's flags and a Robin Hood tunic's belt came through a cassock as a red ring. A mesh left with under 5% of its triangles
    (`OUTER2_HIDE.rest`) is hidden whole: a duster's hem stayed as red teeth in a leather coat's back vent.
  - **Coded tail under a coded tail** (`hideBehind` in buildLathe, from the outer2 tail's `gap` + hem): the first coat's tail
    draws only the columns within the second tail's open front (+0.05 rad) and the rows below its hem; held inside per bin it
    still came through the trench's tail in red patches once the legs pushed them. Its edge strips go too when its opening is
    wider than the second tail's.
  - **Sleeves + neck under a coded outer2** (`tuck` -> topCuts `sleeveIn` 3 cm, `neckUnder` = the coat's back neckline - 7 mm):
    the jacket's / hoodie's cuff showed as a red ring at the coat's wrist, a vest's straps over a blazer's shoulders.
- **Pass 3, THE SUPPORT HAND (2026-11-02, mondo: "Can we fix the pistol ready pose? The other hand just awkwardly crosses over
  their arm")**. UAL1 Pistol_Idle_Loop is a two-handed aim: the left hand cups under the gun hand. The retarget copies bone
  ROTATIONS, so on a body with other arm lengths / shoulder width (the MPFB bodies, the classic ones less) the left hand landed a
  hand's width past the gun hand, open, over the gun arm's wrist. three-renderer.js `_LIB_SUPPORT_HAND` (source clip -> off-hand
  side, only Pistol_Idle_Loop) makes `_libBakeClips` re-reach that arm on every baked sample (`_libSupportHand`: a two-bone reach of
  upper arm + forearm, elbow kept on its own side, the hand keeps the clip's own world turn) so the off wrist sits where the source
  holds it RELATIVE TO THE GUN HAND (source offset x the hips-height scale). On MPFB bodies the off hand's fingers also close part-way
  (`_libSupportCurl`, THE GRIP's hinges, lighter angles) as constant tracks on that clip only: the mixer hands the fingers back
  open when another idle plays (checked: Pistol ready -> Relaxed). Every body + every caller (board, forge, exploration) gets it, it
  is part of the clip's bake. Meshy-hand note: on the CLASSIC bodies the door gun is still seated across the palm in this pose
  (the mesh-palm seat, `_gripFrameMesh`), unchanged here. Shots: /mnt/project-files/pistol-ready/.
- **Pass 4, THE CLASSIC HANDS (2026-11-02, mondo: "Yes go ahead and fix that", the door gun lying across the palm on the classic
  bodies)**. Two causes, both on the classic (Meshy base mesh) bodies only:
  - `_gripHandSkin` read "along the hand" as the skin's longest spread; the classic hands are modelled open with the fingers
    spread, as wide as they are long, so it took a diagonal 44 deg off and the gun sat across the palm. Now, when that axis is more
    than 30 deg off the forearm's way into the hand (bind space), the hand runs along the forearm. The cast's hands (13-16 deg off)
    keep their skin read: Belle / the Player unchanged (checked side by side).
  - The retarget matches each arm bone's direction, never its roll, and the classic bodies' palms are turned ~68 deg from the
    library mannequin's, so every UAL clip played them rolled (Pistol ready: palm up under the gun). `def.palmTwist` (sprites.js
    EW_CHARACTER_BASES only) makes `_libRetargetSetup` call `_libPalmTwist`: the palm read off the skin is rolled onto the
    library's rest palm (`_libEnsureSrc` src.palm, from UAL's finger bones) by turning the forearm AND the hand about their length
    (no twist at the wrist). MAL1 (Meshy-named, no finger bones) has no palm data, so the default Wide stance idle is unchanged.
    MPFB bodies + every race model untouched. Checked Pistol ready, Relaxed, Arms folded, default: shots
    /mnt/project-files/pistol-ready/classic_body_grip_before_after.jpg.

## THE RETIRED CLASSIC CLOTHES + THE CLASSIC FIT (2026-11-02, character-models-plan row 12f)
mondo: "Can we go ahead and get rid of any "classic" clothes and shoes ... I just want to get rid of the old stuff and make sure we
have a replacement, except for the classic male and female bodies, make sure those stay". Then, on the card asking what the classic
MALE / FEMALE bodies wear: "Fit the new clothes to them".
- **The swap.** sprites.js `EW_RETIRED_CLOTHES` (slot -> retired id -> replacement) + `retireClassicClothes`, called by
  normalizeCharacterAppearance, so every look (saved characters, the locker, RACE_CREATOR_LOOKS, online snapshots) wears the
  replacement and nothing is ever blank. A slot missing from an old look = the old default (tee, trousers, sneakers). A tinted pack
  piece takes the layer's old colour only when the look had that colour (`wearTint`). A denim trousers / shorts pick -> jeans. A
  suit / dress already worn keeps the swapped top + bottoms off it. Coded slots end at 'none' (outfit, bottoms, gloves, belt,
  neckwear, glasses, outfit2, bottoms2) or a Blender pick (outer / outer2 `b*`, feet `b*`). The cowboy race looks were re-baked through it.
- **The creator.** party-builder.js: the Top / Bottoms / Gloves / Belt / Neckwear / Glasses rows are gone; "MakeHuman clothes" is
  "Clothes" and shows on every body; Outer + Feet + the second outer list only live picks (`ccLive`); a worn Blender top / bottoms /
  belt (sprites.js `EW_WEAR_LAYER_OF`) shows that layer's fabric / colour / print rows (`ccLayerWorn`). The second top / bottoms
  layers are gone (only the second outer stays). Wings row = Feathered, Bat (the Occulus's wing), Dragon (the dragon spell's wing).
- **The renderer.** three-renderer.js keeps the coded shells (their materials hold the fabric tiles the Blender pieces borrow),
  `_ccBottomDef('none')` = no coded bottoms, and new CC_MESH_OUTER twins for bjacket / bblazer / bvest / bcardigan.
- **THE CLASSIC FIT.** The classic bases (Meshy mesh, not hm08) wear the pack + Blender clothes through the MPFB CLASSIC body of their
  gender (bake-mpfb-classic.py reshaped it onto that very base, same metres + frame): `node bake-classic-fit.js` writes
  charactercreation/mpfb/mpfb_classic_fit_<male|female>.glb (fit base = the MPFB body it came from, _FIT_D, _BASE_INDEX; extras
  ewFit {from, base {count, probe}}). `ensureClassicFit` loads it the first time a classic base wears a garment (vertex count picks the
  gender, the probe vertex confirms), sets `part.fit` + `part.fitBase`; buildWear then fits exactly as on an MPFB classic body, a
  classic skin vertex takes the base index of the nearest MPFB-classic vertex (`part.fit.idx`, read by wearMask), a glove's finger
  bones ride the hand (the classic rig has no fingers). `_ccWearBody(part)` (= part.stock || part.fit) replaced the wear-side
  `part.stock` checks (mesh coat / feet instead of the coded twin, boot tuck, second outer, skin pokes, coded layers under wear).
- **Fit fixes on every reshaped body** (MPFB classic + classic): a garment's normals are rebuilt after the reshape (the baked MPFB
  normals were tilted on the classic arms, so THE LAYERS left a shirt sleeve out through a coat sleeve: 55 -> 16 vertices, none
  visible); every Blender piece takes the averaged reshape (nearSet, 2 cm, was 5 cm on coats only) and the spatial smoothing only
  below the hips (round a forearm it cancelled the classic arm's girth).
- **THE BELT LAYER.** A worn Blender belt (ewWear.layer 'belt') joins THE LAYERS, so a shirt folds in under it.
- Known: shirt specks at the shoulder tops under a coat (also on MPFB male); classic MALE crotch skin under pack trousers in the wide
  stance; a long Blender shirt under an open coat on the classic bases shows a few dark specks at its hem.

## THE OPEN + CLOSED FRONTS + THE BLENDER SHIRTS (2026-11-02, character-models-plan row 12g)
mondo: "a lot of collars are missing when some of these shirt types should definitely have them. Second any coat or jacket etc option
needs to have an open and closed option ... i deally i want there to be a longsleeve collared shirt that is tucked in but with no tie".
- **Fronts.** bake-clothes.py `front_alt` + `FRONTS`: every COATS pick with a front (not the pullovers in FRONT_SKIP, not a `cat`
  piece, not a skirt) gets its other front. A closed coat opens (gap 6.5 cm long coats / 5 cm jackets, wider toward the hem
  `gap_hem` -> coat_sheet `splay`; buttons ride the left front's edge `buttons_edge`; belt / sash / harness dropped; bands stop at the
  opening edges - coat_band clamps to the sheet, not closed). An open coat closes (single-breasted with 3 buttons; the pirate
  double-breasted; the fringe jacket closed, no buttons). Output `ewb_<coat>_open.glb` / `ewb_<coat>_closed.glb`
  (`--only fronts` or e.g. `--only duster_open`). sprites.js `EW_OUTER_FRONT` (the native front) + `EW_OUTER_FRONT_ALT` (picks
  with the other GLB), `outerHasFronts`, `outerFrontWorn`, `getOuterMeshUrl(id, front)`; appearance `outerFront` / `outer2Front`
  ('auto' | 'open' | 'closed'). party-builder.js ccLayer: a "Front" OPEN / CLOSED row under the Outer + second outer picks.
- **Shirts.** bake-clothes.py `SHIRTS` (built on the coat sheet; `--only tops` -> `ewb_top_<key>.glb`), wear rows in sprites.js
  EW_MH_WEAR + EW_WEAR_LAYER_OF 'top' (painted by the Top layer, like the Henley): Collared shirt (tucked, buttoned to the collar,
  no tie), Open-collar shirt (tucked), Work shirt (tucked, flap chest pockets, horn buttons), Collared shirt (untucked), Short-sleeve
  shirt, Polo shirt (placket + knit collar). `shirt_collar`: a band hugging the neck + the fold turned down over it with points at
  the front (profile rows in the code), kept outside the neckline so skinPokes leaves the neck skin. `neck_dip` lowers the front
  neckline. `tuck`: below the blousing the rows follow the skin's own outline (`star_of`), the hem 1.2 cm under the waist line,
  z 46 so THE LAYERS fold it under the trousers + belt; bake-garment.py hidden_skin `zlo` hides the waist skin down to the hem
  (the band within 10 cm of the hem whole: the tucked hem sits inside the skin's hollows). Polo: `placket_rel`, `buttons_top`.
- **Cowboy.** Matched look (vs SHOW ORIGINAL MODEL) as a bake-looks export, not baked:
  /mnt/project-files/clothes-fronts-shirts/Entropy_Wars_Race_Look_cowboy_MATCHED_20261102.json (+ his look before, + shots).
  Missing pieces: gun belt + holster (Meshy list #2), worn leather, silver buckle.
- Known: the shirt collar on the MPFB classic body looks a little crumpled in the bind pose (the reshape round the neck); shirt
  specks at the shoulder tops under a coat (as row 12f).

## THE JOINED BEARDS (2026-11-02, character-models-plan row 12h)
mondo: "i cant find a full beard that has a mustache too. the one that says full beard doesnt have a mustache connected. Use
blender to edit some of the existing ones into new ones?" The pack's Full beard (grinsegold) is a jaw + chin beard with a bare
upper lip; the pack's moustaches are separate pieces and the creator's Facial hair pick wears one piece at a time.
- **bake-beards.py** (repo tooling, cloud Blender: bpy 5.2.3 + MPFB2 + the bodyparts packs) makes ONE piece of a pack beard + a
  pack moustache: one .obj / .mhclo (the beard's vertices, then the moustache's), their two textures side by side on one sheet
  (each in a padded 1024 cell -> 1024 x 512 at WEAR_PX), then baked with bake-mpfb.py `bake_one_wear` on all five MPFB bodies
  (fitted + weighted by MPFB, the compact layout) -> `charactercreation/wear/ewb_beard_<key>.glb`.
- **THE JOIN** (on the male fit): each end of the moustache is turned down along the mouth corner (a smoothstep over the last
  `span` = 16 mm of its width), past the first beard surface below it by `into` (10-12 mm, so it reaches the beard's dense hair, not
  its wispy top edge), both ends by the same amount; a ray from the front lays each moved vertex 1.5 mm in front of the beard.
  The move is written back into the moustache's .mhclo offsets (MPFB's own fit: offset = (d0·x_size, -d2·z_size, d1·y_size)), so
  every body wears the same joined piece.
- Picks (sprites.js EW_MH_WEAR push before EW_MH_FACIAL_HAIR, cat bodyparts, z 50; the 'beard' in the id puts them in Facial
  hair): `ewb_beard_full` Full beard with moustache, `ewb_beard_fullbushy` Full beard with bushy moustache (viking moustache),
  `ewb_beard_viking` Viking beard with moustache, `ewb_beard_scruffy` Scruffy beard with moustache (WDG). A faun beard +
  moustache (a circle beard) was tried and dropped: its ends had to stretch ~5 cm to the narrow goatee and the texture's
  pointed tips thinned to strings. No renderer change: paintFacial tints the whole sheet; beardTint 'own' shows each half's own colour.
- Checked in the real creator stage (Playwright + swiftshader, EWCharViewer.mount with the look, frameCreator('face')) on MPFB
  male / heavy / thin and MPFB classic male, front + three-quarter, the idle running: /mnt/project-files/joined-beards/.
- Authors are the pack pieces' own (grinsegold CC-BY, RehmanPolanski CC0, WDG CC0), already in CREDITS.json.

## THE FACE SLIDERS (2026-11-02, plan row 25)
mondo: "a standard AAA video game character creator where you can control the size of the eyes and the lips and everything".
An MPFB head (the five MPFB bodies + the MPFB classic bodies) takes 45 more MakeHuman face modifiers, the same way as the
body sliders (PR #739): bake-mpfb.py SHAPE_TARGETS -> `python3 -I bake-mpfb.py --mpfb <mpfb2 checkout> --shapes` (needs no
Blender: the stub `import bpy` aside, bake_shapes only reads .target.gz files) -> mpfb/mpfb_shapes.glb (54 sliders, 1.75 MB).
sprites.js EW_MPFB_FACE_SLIDERS = the FACE tabs (Eyes, Brows, Nose, Mouth, Jaw + chin, Cheeks, Head, Ears + neck), keys go
into EW_APPEARANCE_LIMITS at -1..1 (head / jaw / nose / cheeks / eyeSize were already keys; a classic base keeps their old
meaning, eyeSize still paints the classic face). three-renderer.js FACE_KEYS joins SHAPE_KEYS + the shape key; shapeTables
now cached per body mesh (_ccShapeTableCache). party-builder.js: tab row + the open tab's sliders + RESET <TAB>; a dot marks
a moved tab. RANDOM keeps faces within +-0.35. Range = MakeHuman's own +-1: at 2x the lids gap, the nose bridge creases and
the forehead flattens (project files aaa-creator/face_sliders_proof.png). Plan for the rest: character-models-plan.md section 7.

## THE FEMALE PRESETS + THE BODY DETAILS (2026-11-02, plan row 26; mondo picked "Both")
- Presets: bake-mpfb.py BODIES female_heavy / female_thin / female_short (macros at the top; KITS = the female's kit), built with
  `python3 -I bake-mpfb.py --mpfb <mpfb2> --out <dir holding mpfb_female.glb> --bodies female_heavy,female_thin,female_short --packs <mhpacks>`.
  FIT_FROM: after export add_fit() writes _FIT_D (this body minus mpfb_female.glb, same hm08 vertex order, checked by _BASE_INDEX)
  + mesh extras ewFit {from:'female'}, so buildWear dresses them in the female's pack-clothes fit (the classic bodies' path):
  no garment rebake. sprites.js EW_MPFB_BODIES rows with kit 'female' (labels MPFB FEMALE HEAVY / TALL THIN / SHORT).
- Sliders: sprites.js EW_MPFB_BODY_SLIDERS (BODY > Body shape, MPFB bodies only). Weight / Muscle = MakeHuman's universal
  macro targets for a young body as deltas off average (bake-mpfb.py MACRO_SHAPES -> weight_f / weight_m / muscle_f / muscle_m in
  mpfb_shapes.glb; three-renderer.js picks _f on a female body), SHAPE_GAIN 1.4 / 1.25. The rest are plain SHAPE_TARGETS.
  Bones stay put (row 27 = proportions that move the skeleton). mpfb_shapes.glb is now 3 MB raw (~580 KB gzip).


## THE SKIN UNDER THE CLOTHES + THE CLOTHES UNDER THE CLOTHES + THE CLASSIC RESHAPE (2026-11-02, plan row 12i)
mondo: "this tucked in shirt makes a hole in my waist. and adding the cowboy hat puts holes in my head near my hair ... Any
clothes with collars look pretty bad. Holes around the shoulders, armpits, back." Checked on his own cowboy export
(/mnt/project-files/clothes-holes/Entropy_Wars_Race_Look_cowboy_MONDO_20261102-0754.json: open greatcoat, collared shirt, belt,
cowboy hat, joined full beard, pack jeans + ankle boots, MPFB classic male, Idle_11) from 12 angles (front / back / sides, head
close-ups, chest 3/4, low side views into the armpits), with a hole detector: the body's inside drawn magenta, every magenta
pixel = a look into the hollow body. Before / after sheets: /mnt/project-files/clothes-holes/.
- THE SKIN UNDER THE CLOTHES (three-renderer.js SKIN_COVER / coverGrid / skinCover, in rebuildGeometry): replaces the old rule
  (a skin triangle with ONE vertex on a garment's delete list hidden + skinPokes hiding skin 1.5 cm past an open edge). Each skin
  vertex casts along its normal; covered when cloth crosses it between `dIn` (2 cm) under the skin and `reach` (4.5 cm) out
  (`reachDel` 15 cm / `dInDel` 3 cm for a vertex a delete list names; hats + masks only 7 mm under, 1.2 cm out). Cloth further
  out than `tiltFrom` also needs 8 lines tilted `tilt` (1 rad) off the normal to hit cloth: at an open edge (a tank top's armhole,
  a strap, a hat brim) one gets out, so the skin stays drawn. A skin triangle is hidden only when all 3 corners are covered; a
  covered corner of a drawn triangle is pulled in under the cloth (`push`, to `gap` behind it). Alpha-cut garments (lace, a pack
  top's ragged hem) cover only through solid texels (wearAlpha reads the texture's alpha at 128 px).
- THE CLOTHES UNDER THE CLOTHES (wearUnderCover, after every wearUnderOuter2): a garment under a higher one (zOf order; belt,
  outer, WEAR_LAYER cats) loses every triangle above `hipT` of its own height whose 3 corners lie under the upper one (cast along
  its outward normal, `underIn` in to `under` out), after a 2-ring erosion so its edges stay; the shirt's collar points / chest no
  longer come through an open coat's lapels. `_ewIx0` keeps the full index.
- THE CLASSIC RESHAPE (nearSet): the MPFB classic bodies re-fit Blender garments from the nearest skin; a vertex with no skin
  within R fell back to ONE nearest skin vertex and neighbours jumped to different ones (shredded collars + shoulders on the
  cowboy). Now every skin vertex within d0 + R (d0 = the nearest) counts, weight (1 - (d - d0) / R)^2. Also used by hairRide.
- Numbers (magenta px per view, mondo's look): before 9 20 21 6 0 1275 0 1225 74 78 0 0, after ~2 1 7 3 6 32 0 3 17 39 6 8.
  Tucked shirt alone: waist 367 -> ~2. Hat look: temples under the brim 1301 / 1279 -> ~20. Keyhole tank on MPFB male: armhole
  420 / 1370 -> 49 / 141.
- Known, not fixed here: pack tank tops on the MPFB CLASSIC bodies still show a torn strap at one shoulder (the pack piece's
  classic fit); a tucked shirt worn with no trousers shows dark specks of its tuck below the hem; hair003's hard temple edge is its
  own texture; a little magenta at a coat cuff looking up the sleeve.
- Then baked mondo's export as the Cowboy (male) race look on his decision-card pick (`node bake-looks.js <export>`); cowgirl unchanged.

## THE RACE LOOKS, BATCH 1 (2026-11-02, character-models-plan row 20)
mondo: "make new character models for a batch of about 15, using the character creator. Do the ones where you know all the
necessary parts of the outfit and sliders will allow you to make it look good and accurate to the original model."
- **Baked** (bake-looks.js on a hand-written export, the same path as the cowboy): 19 looks over 17 races, each replacing that
  race + gender's Meshy model. men in black, politician, professor, priest (M), mad scientist (M + F), conspiracy theorist,
  chef, gangster (MPFB heavy), telepath (M + F), vampire (F), halfdemon (M + F), superhero (M + F), ringmaster, santa clause
  (MPFB heavy), cult leader. All on the MPFB classic bodies except the two heavy ones; existing pack / Blender / coded pieces
  only (nothing new made). A gender without a look (priest F = the nun) keeps
  its Meshy model. The race's own basic-attack kind, held prop and library clip overrides carry over as before.
- **The export file** used: project files `race-looks-batch1/Entropy_Wars_Race_Looks_batch1.json` (the `entropy-wars-race-looks`
  shape; mondo can edit any of them in the forge and EXPORT DEFAULT LOOK over it).
- **Idles**: the long coats and robes (priest's cassock, cult robe, lab coats, conspiracy theorist's overcoat, telepath's
  leather coat, halfdemon's overcoat) idle on Idle_11 (Upright), like mondo's cowboy: in the wide-stance idles a long coat's
  front splits between the legs and the lining / trousers show through. The rest keep the Default idle.
- **Choices that fixed clipping** (checked front / back / sides / armpits in Idle_11, Default, FoldArms, Talking, Spell idle):
  a tucked Blender shirt over the pack male trousers left a skin gap at the belt in Idle_11, so the open-coat looks wear pack
  classic jeans tinted dark + the belt instead; the short-sleeve shirt flared out under a blazer (left on the long-sleeve
  shirt); the closed blazer showed a red line of the politician's tie at its edge (blazer OPEN); the pack tee showed through
  the lab coat at the armpits (Blender long-sleeve tee); hair under the pack chef hat left dark patches at the nape (chef is
  bald under the hat); the white tie under the ringmaster's vest broke up (bow tie kept).
- **Known, not fixed**: small shirt specks at blazer shoulders and a dark speck or two at a lab coat's shoulder with folded
  arms; long coats still split in the wide-stance battle clips (walk / hit / cast are the race's own animation, only the
  idle is picked); long hair cut with a jagged edge where it meets bare shoulders (telepath F, superhero F, halfdemon F); the
  halfdemon's minotaur horns are wider than the Meshy horns (the closest pack horns; the Toriel horns render invisible).
- **Skipped**: popstar (no clean white top or white heels), luchador (the mask + singlet don't match his prints), the nun
  (needs the Meshy cross pendant, 4a #28), wizard M + F (no hooded robe; her frock coat + mini skirt), demon princess (corset
  + slit gown), and every creature race (plan row 18).
- Side-by-sides (Meshy row on top, the look below) + the 5-pose clipping sheets: project files `race-looks-batch1/`.

## THE TUCK + THE BELT HEIGHT (2026-11-02, character-models-plan row 12j)
mondo (on the baked Cowboy, row 12i): "his shirt still doesnt tuck all the way into these jeans and his belt is too low on his
waist. Anyway we can add a height slider to the belt so it fits with many different pants?" Runtime only (three-renderer.js), no
GLB rebake, no new art. Before / after sheets (front, side, back; the Cowboy with his coat + close waist views without it):
/mnt/project-files/cowboy-tuck-belt/.
- Why the shirt showed: a Blender tucked shirt is baked with a crumpled tuck band that sits just inside the SKIN at the hips, while a
  pack's jeans stand 1-5 cm off the body with a waistband higher than the shirt's tuck line; the band came out between the jeans'
  top and the skin (front, sides) and, with the chest bones it was weighted to, out through the back of the jeans when posed.
- THE TUCK (wearTuckIn, after wearBeltLift, before the layering pass; `TUCK`): a tucked top (`w.tuck` in buildWear: the GLB's
  `ex.tuck` from bake-clothes.py, or a pack id with `tucked`, not `untucked`) under trousers / a skirt (`TUCK.cats`, higher z) finds the trousers' waistband
  top yT per angle (`waistband()`, 36 bins) and lays its band inside: the hem is stretched down to yT - `depth` (7 cm); from
  yT + `lift` down to yT + `flat` it fades onto the smooth skin girth (+ `off`), below the waistband it is clamped inside the
  trousers' INNER girth (`girthGrid`, minus `inGap`) and the belt's (minus 2 inGap + WEAR_LAYER.gap), never deeper than the skin
  near the top (the waistband dips between its loops), under the skin (- `onSkin`) only `deep` (3.5 cm) down where the trousers
  hide it. Its normals turn outward (the crumple's shading is gone), and inside the waistband it takes the skin's own bone
  weights (nearSet, 2 cm) so an idle that bends the back no longer swings it out through the jeans. `t.tuckW` marks the band:
  the layering pass folds it only under the OTHER garments (a coat), not along the trousers' / belt's edge normals (that dragged
  it out in shards), and wearUnderCover no longer lets the trousers / belt eat the shirt just inside the waistband (above yT - `keep` only the
  other garments, a coat, still hide it: skipping the cover there outright let the sleeves show through the coat). A sleeve is never
  tucked (a vertex whose nearest skin is arm, part.arm > 0.3: the hanging elbow is within reach of the waistband at the back).
- THE BELT HEIGHT: appearance.beltHeight (-1..1, sprites.js EW_APPEARANCE_LIMITS; random looks 0), creator CLOTHES > Belt row >
  "Belt height" slider (party-builder.js, shown when a belt is worn). wearBeltLift (`BELT_LIFT`, first step of wearLayers) lifts
  every vertex of a worn belt-layer piece by beltHeight x `range` (8 cm, x body height) and moves it in / out by the skin girth
  difference between its old and new height (skinGirth, 36 bins), smoothed round the belt; then pushes it out so its inside
  clears the trousers' outermost surface by `clear` (4 mm) at each angle + height; then gives it the skin's bone weights where it
  now lies (faded in over the first quarter of the slider; restored when back at 0). Over a skirt / no trousers it still follows
  the body. shapeKey carries it so the slider rebuilds live.
- The Cowboy (RACE_CREATOR_LOOKS.cowboy.male) wears beltHeight 0.7: the belt sits in the jeans' loops just under the waistband
  top (0.55 still showed waistband above, at 0.6-0.7 without the trousers push the jeans came out through it at the back).
- Known: the pack jeans' own waistband shows a small crumple at the right hip at 0.7 (its geometry), the shirt specks at the coat
  sleeve backs / shoulder tops are the row 12f known issue.
