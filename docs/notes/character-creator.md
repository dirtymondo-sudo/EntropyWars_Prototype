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
- **THE ZOOM PATH** (2026-11-05, mondo: "in the character creator, make zooming in always zoom in on the character's face, and
  zooming out centered on their full body, from both views (full body and face closeup)"): the wheel now moves one DISTANCE between
  the full body (`dist0`) and the face close-up (`faceD`, the frame loop's CV_FACE_FRAME distance, kept on `v.faceD`). `_cvFrame`
  reads `s` = where that distance sits between them (log scale, smoothstepped) and slides the look point, camera height, depth and
  side from the body's middle (s 0) to `_cvHeadPoint` (s 1), plus the close-up's upward tilt (`camPo`, eased; `v.polar` stays the
  player's drag on top of the view's home tilt). So from the full body, in = onto the face; from the close-up, out = back to the
  whole body, level and centered. Limits: `faceD / 2.8` in, `dist0 / 0.55` out (the old ones). A beat's frame (frameTo) keeps the body
  framing. Firefox line-mode wheel steps (deltaMode 1/2) count as 16 / 400 px. Shots: project files creator-zoom/zoom_path_body_and_face.jpg.
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
2026-11-03 THE BAND TINT: a hat in sprites.js EW_WEAR_BANDS shows a second block under its colour row, "Band" (wearTint['<id>:band']);
the band is its own primitive now and keeps its own colours unless picked. Notes: models-assets.md "THE SOLID PIECES".

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
- **Pass 5, THE WRAP (2026-11-03, mondo: "the pistol ready idle is still not quite right. Their left hand goes under their other
  wrist and is holding nothing, it looks weird")**. Pass 3 kept the SOURCE clip's off-hand spot (a cup under the gun hand), which on
  our bodies read as a hand under the gun wrist gripping nothing. three-renderer.js `_libSupportHand` now lays the off hand on the
  gun hand in the GUN HAND'S OWN FRAME (`_libHandFrame`: along the hand, to the thumb, out of the palm, read from the hand's finger
  bones on MPFB, else off its skin like THE GRIP ON A MESHY HAND, else the library mannequin's through the retarget offset):
  off palm on the grip's open side over the gun hand's fingertips, off fingers tilted 38 deg down round the front of the gun
  hand's fingers, the off forearm taking half the hand's roll. `SUPPORT_WRAP` holds the numbers in hand lengths. `SUPPORT_CURL`
  closes the MPFB off fingers further (they wrap the gun hand now). Classic bodies (fingerless, modelled open): the off palm is
  pressed flat on the handle's open side where `_gripFrameMesh` seats it (`SUPPORT_WRAP.flat`), fingers laid along the gun hand's;
  their fingers cannot close. Skin read for the bake uses a throwaway userData (caching on the shared GLB root broke the gun seat:
  clones copy userData as JSON). Shots: /mnt/project-files/pistol-ready/pistol_ready_wrap_before_after.jpg.

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


## THE SLIDER STRENGTH (2026-11-02, plan row 26b)
mondo: "It seems most of the sliders dont really work for the mpfb body, only the mpfb classic body?". Measured in the real
creator (and rig.update straight) on all ten MPFB bodies: every one of the 66 shape sliders moved the skin by the SAME millimetres
on every body, clothes following; nothing was broken per body. Two real problems: (1) MakeHuman's own +-1 step is tiny for most
of the face (eye size 2.4 mm, upper lip 3 mm, nose width 3.4 mm on a 1.86 m body) and 2-5 cm for weight / muscle / the body
details, so at +-100 the stage showed next to nothing; (2) the offsets are absolute millimetres while the stage shrinks the tall
MPFB bodies (heavy 2.42 m, thin 2.40 m, female tall thin 2.30 m local) to their board height, so they moved ~25 % less than the
MPFB classic bodies (1.70 m). three-renderer.js shapeBody (stock path): SHAPE_GAIN per slider (a number or [+ end, - end] where
one end tears first: eye size, nose width / length / height / tip) x the body's height / SHAPE_REF_H (1.70, the classic MPFB
bodies, unchanged for them). Tuned by eye on MPFB male + female faces and male / heavy bodies: too far = the nose tip into the
lip, nostrils crossing (width -), eye slits / the red inner lid (eye size), a pinched jaw (jaw width), lumpy cheekbones.
Bust stays 1 (mondo liked it at 100). The classic MALE / FEMALE bases (their own shaping) are untouched. Before/after sheets:
project files creator-sliders/. Probe: a copy of playtest_creator.js's routes, EWCharViewer.mount on a fixed div, then
dev.state().appearanceRig.update(...) per slider; face = frameCreator('face'); TR_FILE swaps three-renderer.js for the old one.

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

## THE SHELVES (2026-11-02, the creator menus organized)
mondo: "Can we organize the character creator better? Like there are wings at the bottom but then there are wings in equipment or
another tab or something. There are male and female clothes scattered all throughout, it should be separated by male and female.
Just organize all of the models better". DISPLAY ONLY: no piece was removed or renamed in data, EW_MH_WEAR's categories (the
renderer layers by them; normalizeWearList's one-per-category rule) are untouched, so every saved / locker / baked look loads as it did.
- sprites.js THE SHELVES: `EW_WEAR_SHELVES` = the creator's tabs [id, label, section, many]; `wearShelfOf(id)` = the tab a pack /
  Blender piece shows on (data category, except `EW_WEAR_SHELF_MOVE`: the Blender skirts -> Skirts, the Winter coat (filed under
  Dresses) + the EMT jackets -> Coats + capes, the Viking boots / pants / tunic + EMT pants -> Shoes / Bottoms / Tops, the Blender
  belt / tie / bow tie / suspenders / coin belt -> Belts + ties; Equipment -> Held items + gear; Body parts -> Wings / Horns + antlers
  / Tails / Nails; the facial hair -> null, it is only under FACE now). `wearMadeFor(id)` = 'male' | 'female' | 'both' from the pack
  name (female / male / ladies / heroine / f_ / m_), explicit lists (EW_WEAR_FOR_FEMALE / _MALE / EW_WEAR_BOTH), then the kind
  (dresses, skirts, underwear, blouses ... = women's). `outerMadeFor` (habit, silk robe, leaf dress = women's). `EW_OUTER_GROUPS`
  = the Outer picks in kinds (Coats + jackets, Robes, Uniforms, Costumes).
- party-builder.js CreatorControls: CLOTHES = "Made for MEN / WOMEN" (starts on the body's gender, femaleBody) + TAKE ALL OFF (the
  clothes tabs only: pack pieces on them + Outer / second outer / Cape / Feet; facial hair + accessories stay) + the tabs Tops,
  Bottoms, Skirts, Dresses, Suits, Coats + capes (Outer layer in kinds, + ADD LAYER second outer, Cape, More coats), Shoes (Feet
  layer + More shoes), Underwear, Gloves, Belts + ties (+ the Belt fabric / height rows), Hats, Glasses, Masks. Each tab lists this
  side's pieces, then "Fits anyone", then any worn from the other side; any piece can be picked on any body. A Blender piece's
  Top / Bottoms / Belt fabric rows and the wear-tint rows show on the tab the piece is on. One pick per tab (several on Underwear,
  Belts + ties and every accessory tab), on top of the pack's own rule. ACCESSORIES = Wings (Flapping wings = appearance.wings +
  Costume wings = the pack's), Horns + antlers, Tails, Nails, Held items + gear. The LAYERS heading is gone (its rows moved to the
  tabs). BODY: the bases in two rows, Men's bodies / Women's bodies. FACE > skins: Women's / Men's / Other skins, the body's own first. Tile names drop the "male" / "female" they are now
  listed under (title = the full pack name); name tiles (.pb-cc-hair: hair, clothes, skins) are 96 px wide columns at 9 px so a
  pack name fits instead of being cut.
- Before / after shots of every tab: /mnt/project-files/creator-shelves/.


## THE LIP COLOUR + THE ONE EYES TAB (2026-11-03, plan row 26c)
mondo: "what if i just want to change the lips specifically?" + "there is an eyes tab, but then there is another make human
skin and face eyes tab, all of those settings need to appear together".
- LIP COLOUR (MPFB bodies): FACE > MOUTH > Lip colour: Skin's own (default, `lipTint: 'own'`) or Pick a colour (`lipTint:
  'pick'`, colour = the existing `lipColor`, swatches + custom picker; 5 lipstick swatches added). sprites.js `EW_MH_LIPS` = the
  lips' outline on the hm08 1024 sheet (the same UV on every MPFB body + skin), traced off the pack's lipstick skins (toigo ...
  with makeup / goth makeup). getMhLookLayers adds `out.lips`; three-renderer.js setLook -> `tintLips` paints the colour inside
  the outline (feathered 1.6 px), each pixel scaled by its brightness against the lips' average, so the lines / shine / corners
  stay and a makeup skin's lipstick is replaced, not mixed. The classic face keeps its own Lips row (unchanged).
- ONE EYES TAB: party-builder.js `mhTiles` renders a MakeHuman pick row; FACE > EYES = eye sliders + Eye colour (mhEyes) +
  Lashes (mhLashes); FACE > BROWS = brow sliders + Brows (mhBrows); a FACE tab's dot also lights for those picks. The old
  "MakeHuman skin and face" block (Skin / Eyes / Brows / Lashes tabs) is now SKIN (skins + Chest) after the facial hair.
  Each FACE tab's reset button says "RESET <TAB> SLIDERS" (it only ever reset the sliders).
- Shots: /mnt/project-files/creator-lips-eyes/ (before_after.jpg, lip_colours_closeup.jpg).

### Pass 2: THE LOOK COLOURS (2026-11-03)
mondo: "There are still 2 brows tabs [the live game ran the pre-#810 files]. And why can i not just pick a skin color under the skin
tab? ... there is no color picker?? Everything that can possibly have one needs a tint/color picker".
- MPFB bodies, each with Original colours / Pick a colour (+ swatches + custom picker): SKIN > Skin colour (first row; `skinTint`,
  colour = `skin`), FACE > EYES > Iris colour (`eyeTint`, colour = `eyeColor`), Lash colour (`lashTint` / `lashColor`), FACE > BROWS
  > Brow colour (`browTint` 'own' | 'hair' | 'pick' / `browColor`). Same keys as the classic face where one existed.
- three-renderer.js `tintSheet`: the skin sheet x (picked / the torso patch's average, sprites.js EW_MH_SKIN_SAMPLE) per channel;
  the mouth's inside (EW_MH_SKIN_KEEP) left as is; drawn before the eye / brow / lash layers. `tintLayer`: brows + lashes take the
  colour at half their own contrast; eyes only inside the irises (EW_MH_IRIS, found where the 9 eye pictures differ, r 3.8 px).
- "MakeHuman hair" row renamed "More hair styles". Every other colourable piece already had a picker (hair, second hair colour,
  facial hair, clothes layers + "Colours of the pieces you wear", wings, accessories once worn).
- Every tab shot: /mnt/project-files/creator-usability/.
- THE BACK STRIP FIX (2026-11-05, mondo: "what is this random white spot down this person's back?? It's just a normal mpfb body that
  i made the skin red"): EW_MH_SKIN_KEEP was two boxes ([0,360,170,120] + [760,870,200,154]) put back untinted after the tint. The
  first box also held the torso island's left edge (x 145-170, y 360-480 = one side of the spine seam, mid back to waist) and the
  second the right hand's fingertips, so under any picked colour those stayed the stock skin. Now 3 outlines (2 cheek pieces +
  tongue, traced off mpfb_female/mpfb_male UVs, 2 px out, checked: no other UV triangle inside); tintSheet clips to them and
  draws the pre-tint copy back. Before/after (red, from behind): /mnt/project-files/skin-colour-back-strip/.

## THE MESHY DEFAULT + THE CREATOR ON EVERY UNIT (2026-11-03, character-models-plan row 20b)
mondo 11-03: "Let the character creator be available to all units so i can make custom models for them. Don't get rid of the
old models, the old models should stay the default until i say so or we have all new characters models through the character
creator. So even the cowboy, its default model should still be the meshy model" + "make sure that custom cowboy is still saved
and there as an option".
- sprites.js `EW_RACE_LOOKS_ARE_DEFAULT = false` (above the RACE_CREATOR_LOOKS block): the baked rows are SAVED looks now. Only
  'homosapien' + 'door agent' stay in EW_CREATOR_LOOK_RACES (their look is the default); with the flag on (or
  `window.EW_RACE_LOOKS_ARE_DEFAULT = true` before boot) the old rule comes back. Flipping it is mondo's call only.
- `ewCreatorLookRace(race)` = every race may WEAR a slot's look (state.js team build + repair, three-renderer.js preload warm).
  getCharacterAppearanceModel: a slot look (model 'creator') dresses any race; no look = the race's own model.
- Forge creator panel (party-builder.js): a slot without a look shows "wears the <race>'s original model/sprite" +
  USE THE SAVED <RACE> LOOK (races with a saved look; copies the row onto the slot) + CREATE APPEARANCE + RANDOM. In the
  controls: RESET TO SAVED LOOK (saved races) or RESET, USE ORIGINAL MODEL (deletes the slot look), EXPORT RACE LOOK (every race
  but the DOOR Agent / human base). bake-looks.js accepts any race in RACE_MODELS_3D or RACE_SPRITES.
- Sprite-only races (android, skinwalker, siren, cyclops, demon prince, super sentai, watcher, droid, chosen one) stand on the
  forge stage in a creator look: EWCharViewer.supports / mount take the appearance (three-renderer.js _cvSupports).
  battle.js `_unitAttacksWithClip` + `basicAttackKindOf` pass unit.appearance, so such a unit attacks with clips.
- Proof shots: /mnt/project-files/meshy-default/ (cowboy Meshy default → saved look → back; werewolf + cyclops CREATE APPEARANCE).

## THE DEFAULT FACES (2026-11-03, plan row 29a)
- mondo: "Can you make male and female faces on the mpfb bodies that are good looking that we can use as a default?"
- sprites.js `EW_MPFB_DEFAULT_FACES` = one male + one female face, made only from the FACE sliders (THE FACE SLIDERS keys, -1..1,
  SHAPE_GAIN applies as usual). Male: jaw 0.35 / jaw angle 0.3, chin forward 0.35, cheekbones 0.45, face fat -0.35, brow ridge 0.3,
  narrower nose, almond eyes. Female: jaw -0.4, head width -0.25 / height -0.15, chin forward 0.4 + shorter, cheekbones 0.35, nose
  smaller + slightly up, almond eyes (tilt 0.35, opening -0.3, lid 0.3), cupid's bow 0.3, mouth set back -0.6 (the base pouts in
  profile otherwise), age -0.5. Tuned over six rounds of front / three-quarter / profile renders on every MPFB body.
- `mpfbFacePatch(appearance, body, force)` (sprites.js, window): the face keys to merge when a look moves onto `body`. An untouched
  face (all 0) or a face still equal to either default takes the body gender's default; a classic base wearing a default face goes
  back to 0 (head / jaw / nose / cheeks / eye size also shape the classic head); a face the player changed is left alone. Used by
  the team builder's CREATE APPEARANCE + body buttons, the mirror / intake's first look + RESET, and FACE > DEFAULT FACE (force).
  FACE > NEUTRAL FACE sets every face slider to 0 (MakeHuman's own face).
- NOT in normalizeCharacterAppearance: saved looks, the officer's look on file and every RACE_CREATOR_LOOKS row keep their faces.
  RANDOM / RANDOMIZE still roll faces round 0.
- Known, outside the sliders: the MPFB bases rest with the lips slightly parted (a teeth line shows), and the stock skin / eyes.
- Shots (before = all face sliders 0): /mnt/project-files/default-faces/ (male_default_face.jpg, female_default_face.jpg,
  every_mpfb_body.jpg). Probe = a stage mounted straight on window.EWCharViewer with the bind pose held (skeleton.pose(), mixer
  stopped, EW_DISABLE_FACE_IDLE) so every face is shot in the same head pose.

## THE FACE PRESETS (2026-11-03, plan row 29b)
- mondo: "can you point me to some resources or websites or asset packs where i can get makehuman face presets? Or download a few
  yourself?" A MakeHuman face preset = a saved character (.mhm, MakeHuman 1.x / the community asset repository; or an MPFB human
  preset .json). None ship in the 64 asset packs or in MPFB.
- `bake-faces.js` (repo root): `node bake-faces.js <file.mhm|preset.json> [more…] [--label ..] [--gender male|female] [--author ..]
  [--license CC0|CC-BY ..] [--source URL] [--dry-run]`, `--list`, `--remove <id>`. .mhm lines `modifier <group>/<neg>|<pos suffix>
  <v>` become target weights; each FACE slider = the mean (over the pairs the file sets) of plus - minus weight / its SHAPE_GAIN end
  (three-renderer.js, read live), clamped -1..1. FACE_TARGETS in the tool = bake-mpfb.py SHAPE_TARGETS face keys (keep in step).
  Prints the body macros it could not carry and the face modifiers with no slider (dropped).
- Writes sprites.js `EW_MPFB_FACE_PRESETS` (between the BEGIN / END markers): rows { id: 'mh_<label>', label, gender, author,
  license, source, face }. party-builder.js FACE: one button per row after DEFAULT FACE / NEUTRAL FACE (♀ / ♂ = the character's
  gender; a pick sets every face slider, the rest to 0). map.js credits, MakeHuman section: "Creator face presets" lists every row's
  author · licence · source. EW_MPFB_DEFAULT_FACES is never touched.
- After a bake: node --check sprites.js, bump ?v=, merge, sync zip.
- THE FIRST PRESETS (2026-11-03, full-network thread): the MakeHuman community asset repository (makehumancommunity.org) was
  OFFLINE ("Community services offline", only static.makehumancommunity.org up; no Wayback from the cloud). Free .mhm found:
  - BAKED: Warrior ♀ (OpenGameArt "warrior-female-3d-model", DREAM_SEARCH_REPEAT, CC0, 11 sliders) and Gnome ♂ (OpenGameArt
    "gnome-0", Cheb Gonaz, CC0, thin + aged face: faceFat -0.83, faceAge 0.33).
  - SKIPPED (nothing to carry): Sam (frontlinestudios.itch.io/asset-sam, CC0): 0 face modifiers, his look is all body macros +
    an expression; Syl (archive.org thingiverse-1657065, Micah Scott, CC0): 2 tiny sliders; Female Dwarf (OpenGameArt
    "female-dwarf-0", CC0): MakeHuman 1.0 file (`face head-age-less-more` lines, no `modifier` lines), bake-faces.js reads 1.1+.
  - FaReT (github.com/fsotoc/FaReT, model-database/identities: 12 male + 12 female + 3 averages) is GPL-3, not CC0/CC-BY. mondo
    was told the GPL question (copied slider values may count as their work; he wants a paid game) and said "i'll take the risk"
    (11-03): BAKED as FaReT F01-F12 ♀, M01-M12 ♂, Avg F ♀, Avg M ♂, Avg ♂ (19-48 sliders each), first with author "FaReT",
    license GPL-3.0. Then (11-03, mondo: "take out the gpl3 credit, this game is NOT open source. i will take the risk of not
    crediting"): renamed Face F01-F12 / M01-M12 / Avg F / Avg M / Avg (ids mh_face_*), author/license/source blank, so the
    credits page does not list them. Don't re-add a FaReT credit. About 70 modifiers per file, the finer nose / eyelid / lip shapes + the macros drop, so each is a near copy.
  - Most free .mhm files carry their look in the body macros (gender / age / ethnic mix), which our fixed MPFB bodies drop, so
    a file with few `modifier <face group>` lines makes a near-default preset. Check with --dry-run before baking.
  - Files + LICENSES.txt: project files mhm-faces/.

## THE HIDDEN PICKS (2026-11-03, the creator's dev item hider; character-models-plan row 12m)
mondo: "Can we also add a devtool that let's me remove models like certain clothes and hairstyles from the character creator? Like
there are some hairstyles that are not as high quality as the others, and it would be easier for me to manually exclude them then
tell you which ones they are".
- **Turn on**: Settings > Developer > **Creator Item Hider: ON** (map.js `_toggleCreatorHider`; localStorage `ew_creator_hider` = '1').
  Off by default, so players never see it. While on, the creator (forge GEAR > CHARACTER CREATOR and the mirror / intake, all one
  CreatorControls) shows the purple **DEV · ITEM HIDER** bar under the name / locker.
- **Hide**: every pick tile / button gets a corner mark: ✕ hides it, SHOW (green) brings it back; a hidden pick stays on its list dimmed
  + struck through while the marks are on. Covered: Hair (classic + pack), Facial hair, every wear tile on every CLOTHES / ACCESSORIES
  tab, the Outer layer + second outer picks (kind `outer`), Feet layer, Cape, Flapping wings, Idle pose, MPFB skins, eye colours,
  brows, lashes. Not hideable: None / Clean / Bald / Body's own / Default (the "nothing" picks), bodies, fabrics, prints, colours.
- **The bar**: MARKS: ON / OFF (PLAYER VIEW) = the lists as players see them; HIDDEN LIST (n) = every hidden pick (kind · name, "(baked)"
  for a shipped one) with SHOW each + SHOW ALL (confirm); **⇩ EXPORT HIDDEN LIST** -> `Entropy_Wars_Creator_Hidden_<yyyymmdd-hhmm>.json`
  = `{ kind: 'entropy-wars-creator-hidden', v: 1, made, hidden: { '<kind>:<id>': label } }` (the WHOLE list as his browser shows it).
- **Never deletes**: the lists only leave a hidden pick out; normalizeCharacterAppearance never reads the list, so a saved / locker /
  race / baked look wearing one loads + renders as before, and a WORN hidden pick keeps its tile (shown, pressed) so it can be seen +
  taken off. RANDOM (randomCharacterAppearance) never rolls a hidden pick (`_ewHidPickable`).
- **Data**: sprites.js THE HIDDEN PICKS: `EW_CREATOR_HIDDEN` (shipped, `{ key: label }`, between `// EW_CREATOR_HIDDEN:BEGIN` / `:END`,
  written ONLY by bake-hidden.js) + this browser's `ew_creator_hidden_v1` = `{ hide: { key: label }, show: { key: label } }` (show =
  a shipped one shown again here). `creatorHidden(kind, id)`, `setCreatorHidden(kind, id, hide, label)`, `creatorHiddenList()`,
  `creatorHiddenShowAll()`, `creatorHiddenExport()`, `creatorHiderOn()` / `setCreatorHiderOn(on)`; a change fires window
  'ew-creator-hidden' (the creator re-renders). party-builder.js CreatorControls: `keepPick` (the filter), `devTile` (the corner mark
  wrapper `.pb-cc-devwrap`), `ccChoice(key, options, lookOf, hideKind)`, `ccDevBar`, `pbExportHidden`. CSS styles-base.css THE HIDDEN PICKS.
- **Bake**: `node bake-hidden.js <Entropy_Wars_Creator_Hidden_….json> [--dry-run]` (or his SAVE EVERYTHING file: it reads that file's
  `ew_creator_hidden_v1` on top of the shipped list), `--list`. Replaces the block with the export (later exports supersede: give the
  newest one); unknown kind = refused, an id no catalogue has any more = dropped with a warning. Then node --check, bump ?v=, PR + zip.
- **Online**: nothing relayed; the creator lists are local UI and every look still travels whole in the unit's appearance.
- Shots: /mnt/project-files/creator-hider/.


## THE RENAMED PICKS (2026-11-03; character-models-plan row 12o)
mondo: "maybe somewhere in the ui maker, can i change the names of the models of the character creator? Or maybe in the same place
where i can hide models in the creator? How do i get to that again?" then "there is no settings button in the character creator, i need
to access it from the character creator obviously".
- **Open it from the creator**: **F2** while the creator's controls are up (forge GEAR > CHARACTER CREATOR, the Mirror, the intake; on a
  race slot after CREATE APPEARANCE) opens / closes the item hider (party-builder.js CreatorControls keydown; first creator answers,
  `defaultPrevented` stops a second). No button for players. Settings > Developer > Creator Item Hider still flips the same setting.
  The UI Maker (F4) only themes / lays out the creator (surface `forge`); it never edits its picks.
- **Rename**: with the marks on, every pick the hider covers (same kinds + keys as THE HIDDEN PICKS) gets a ✎ on its top-left corner
  (the ✕ stays top-right). ✎ opens a rename box under it, the whole row of the grid / flex row: its own name, the input (40 chars, Enter
  = SAVE NAME, Esc = CANCEL, the key never reaches the creator), SAVE NAME / ORIGINAL NAME / CANCEL. A row button (Outer, Cape, Wings,
  Idle) pads 26 px each side while marked so the marks never cover its words.
- **The bar**: DEV · ITEM HIDER + NAMES, `n hidden · n renamed`; + ▸ RENAMED (n) = each `kind · own name → his name` with ✎ RENAME (the
  box under the row) + ORIGINAL NAME, then ALL ORIGINAL NAMES (confirm); CLOSE (F2); ⇩ EXPORT HIDDEN + NAMES ->
  `Entropy_Wars_Creator_Picks_<yyyymmdd-hhmm>.json` = `{ kind: 'entropy-wars-creator-hidden', v: 2, made, hidden, names: { key: name } }`
  (both WHOLE lists as his browser shows them).
- **Display only**: a tile shows `creatorName(kind, id, label)`; the catalogues keep their pack names, because rules read them (a skin's
  men's / women's side, a beard's face camera, the "male" / "female" trim of a tile). A rename shows as typed (soft-wrapped, no trim).
  Also the "Colours of the pieces you wear" heads and the HIDDEN LIST rows. Players see baked names; his browser shows his.
- **Data**: sprites.js THE RENAMED PICKS: `EW_CREATOR_NAMES` (shipped `{ key: name }`, between `// EW_CREATOR_NAMES:BEGIN` / `:END`,
  written ONLY by bake-hidden.js, each line commented with the pick's own name) + this browser's `ew_creator_names_v1` = `{ key: name }`
  ('' = its own name again over a shipped one). `creatorName`, `creatorRenamed`, `setCreatorName(kind, id, name)` ('' / its own name =
  original), `creatorNamesList()`, `creatorNamesReset()`, `creatorPickLabel(kind, id)` (the catalogue name); a change fires
  'ew-creator-hidden'. SAVE EVERYTHING carries `ew_creator_names_v1` (any ew_* key).
- **Bake**: `node bake-hidden.js <Entropy_Wars_Creator_Picks_….json>` bakes both blocks; a v 1 file (no `names`) leaves the shipped names;
  a SAVE EVERYTHING file bakes its ew_creator_names_v1 on top of the shipped names. Same checks: unknown kind refused, a gone id dropped
  with a warning, a name equal to the pick's own left out. `--list` prints both lists.
- **Online**: nothing relayed; names never travel (a look stores ids).
- Shots: /mnt/project-files/creator-rename/.

## THE EYE PACK (2026-11-03, PR "eye pack")
mondo uploaded the MakeHuman Eye Texture Pack (36 PNGs: 19 plain/bloodshot colours, 12 cat eyes, All black, 5 normal maps) to R2
`Assets/Models/charactercreation/mpfb/looks/eyes/eyetextures/` + `MakeHumanEyeTexturePack.unitypackage` (not needed: the PNGs use
MakeHuman's own eye layout, the two eyeball discs of the stock `*_eye.png`). "please add them to the character creator".
- **Why not the sheet:** drawn into the hm08 skin sheet like the stock eye colours (bake-mpfb.py bake_looks) an iris is ~6 texels
  across (the eyeball islands are 0.08 of the sheet and the iris is a small cap of them) and a cat eye's slit is gone. First tried
  that (bake path reproduced in numpy, matched the shipped eyes_brown.png to <1/255) and dropped it.
- **What ships:** FACE > EYES > "Eye textures" (31 tiles, same key `mhEyes`, ids `mhp_*`, sprites.js EW_MH_EYE_PACK =
  [id, label, colour PNG, normal PNG]). On an MPFB body (classic MPFB too) three-renderer.js THE EYE PACK draws MakeHuman's
  HIGH-POLY eye proxy (makehuman_system_assets eyes/high-poly, CC0, 1064 verts) as its own shell `EWCreator_eyes`, wearing the
  pack PNG itself (1024 px) + its normal map (normalScale (1,-1): an OpenGL map on glTF's v-down UVs), roughness 0.3, alphaTest 0.5
  (its cornea dome sits on the PNG's clear corner; opaque it hid the iris). The body's own eyeball triangles are left out while it
  shows (rebuildGeometry `eyeTri`, shape key `+e`). Stock "Eye colour" picks are unchanged (still the sheet).
- **The fit:** `charactercreation/mpfb/looks/eyes/eye_proxy.json` (bake-eyes.py, numpy only): per proxy vertex 3 hm08 vertices x
  weights + an offset x the head scale (its .mhclo), the proxy UVs/triangles, the iris centres, every eyeball-helper UV. The hm08
  vertices are named by UV (each MPFB GLB keeps hm08's sheet with build_body's eye-island blow-up), so ONE file fits all 10 MPFB
  GLBs (`--check` matched 102/102 on each). Fitted from the rebuilt bind positions every geometry pass, so the face sliders move it;
  the idle face's morphs are carried over (weighted ref deltas) and share the body's influences array (glances turn it).
- **Iris colour** works on these: three-renderer.js _ccTintIris recolours the two irises of the PNG (EW_MH_EYE_PACK_IRIS: pupils at
  (297,733) / (723,311), r 124 px, measured by bake-eyes.py), pupil + slit stay dark. Textures are cached per pick+tint, shared.
- **Board:** the shell exists from the start so the board's Lambert swap covers it; setEyePack copies the body's emissive glow to it.
  The Lambert copy drops the normal map if the swap happens after the pick loaded (cosmetic, battle distance).
- **Online:** nothing new to relay; the pick travels in the unit's appearance like every look key.
- New R2 file: `mpfb/looks/eyes/eye_proxy.json` (in the sync zip by hand). Shots: /mnt/project-files/creator-eye-pack/.

## THE COAT HANG + THE HAIR AT THE NAPE (2026-11-03, character-models-plan row 9)
mondo 11-03 on his Cowboy (open Blender long coat over pack jeans): "Still getting pants clipping through coats. Why is this so
prevalent and hard for you to fix? Surely this is a known issue in the 3D model community ... it looks like the coat or the collar
is making the hair stick up in the back."
- **Why it kept coming back**: the coat's skirt and the trousers ride DIFFERENT bones. Pack trousers follow each thigh + shin
  (MakeHuman weights); a Blender coat skirt is one sheet over both legs (bake-garment.py skin_weights: 90 % the thigh on its side,
  the thigh all the way past the knee), so any stride / bent knee / wide stance moves the leg out through it. Every earlier pass
  (THE COAT OVER THE CLOTHES, THE POSES AUDIT, THE CLOTHES UNDER THE CLOTHES) fixed the BIND pose only.
- **The fix = the standard game one** (spring / dynamic bones + colliders: VRM spring bones, Unity Dynamic Bone, Kawaii skirts).
  three-renderer.js THE COAT HANG: `coatHang` (buildWear) gives any Blender Outer pick whose skirt hangs >= `minDrop` below the hip
  joints and has no sway chains of its own (capes, tailcoat keep theirs) 16 chains x 6 bones `ewhang_<c>_<j>` round the skirt,
  rooted on Hips, each following the cloth's own drape; the skirt (below the hips, faded over `fade`) is reweighted onto the two
  nearest chains (only the nearest across an open front). Each joint keeps the coat's OWN baked weights there (`C.t`: its follow
  target). `hangFit` (after wearLayers, on every rebuild / setWear) fits a tapered capsule per thigh + shin to what is worn there
  (skin + trousers + boots, 96th percentile, in the leg bone's bind frame), the rest allowance per chain sample (a capsule never
  pushes further than the coat stood off the leg at bind, so at rest nothing moves) and which side of the leg each sample lies on
  at bind (`C.side`). `hangTick` (rig tick, before the cape sway): the first bone of each chain springs toward the hips' hang, the
  rest toward where the coat's baked weights would put the next joint (so the coat keeps its A-line + stride exactly as before), then
  every sample along the bone is pushed out of every capsule on its bind side (front panel stays in front of the thigh, never wraps
  behind it). wearLayers holds the trousers 1.2 cm (`gap`) inside a hanging coat near the hips (the seat rides the thighs, the coat
  the pelvis).
- **Tried + dropped** (each looked at in shaded shots, not only counted): hanging straight on from a pushed joint (`fall` 0: a bell
  flare in the wide idle, a stiff board in a kneel / kick); falling toward the ground (`fall` 0.6: clean on the Cowboy but a boxy
  barrel on the cowgirl's wide hips); aiming at the cloth's rest hang in the hips' frame (`drape`: pulled it back into the leg,
  70 -> 1,000-1,800 px); pushing to the bone head's side (the front panel ended up behind a bent thigh); `maxRoot` 85 (the side
  panels stood out in a ledge at the hip).
- **Hair**: nape-length hair (hair003) rode the HEAD bone alone, so an idle that bows the head (the Cowboy's) swung the hair under
  the skull back and up over the collar. `hairNape` (fitHair, after hairSkin) paints a gradient of the head weight onto the neck
  behind the ears below ear level (`HAIR_NAPE`), as hand-made rigs do. The collar tuck (`HAIR_CLEAR.secs/neckR/tuck`) holds hair
  that ends just under a collar inside the innermost garment; hair003 never reaches it.
- **Measured** (harness: Playwright + swiftshader, flat ID colours, jeans pixels enclosed by coat pixels, 4 views; sims run 30
  steps a frame so the chains settle at swiftshader's ~2 fps): mondo's Cowboy look (idle / walk / high kick / hit x 4 views)
  785 -> 64 px of jeans showing through the coat; the baked telepath (leather coat) 1,260 -> 91. The priest's cassock and the cult
  robe no longer shred at the hem in the hit / kick (shaded shots). The count is unreliable on OPEN coats (it also counts trousers
  seen through the opening), so overcoat / lab coat / cowgirl duster were judged on shaded shots: same shape, fewer pokes. Hair
  close-ups: the nape spikes in the idle are gone, the hit pose keeps a couple of tiny tips.
- **Known**: a few specks remain in extreme poses (the cowgirl's wide idle at the open front); on curvy female bodies (lab coat)
  the seat shows a soft crease where the skirt leaves the hips. Not on Meshy models, coded coats or the classic Meshy bases.
- **Online**: cosmetic + local (each screen runs its own chains, like the cape sway); nothing relayed. `window.EW_DISABLE_SWAY = true`
  keeps the coat on its baked weights.
- Shots: /mnt/project-files/coat-hang/.


## THE FLAPS FIX (2026-11-03, character-models-plan row 9 pass 2)
mondo on his Cowboy (closed Blender coat, Wide stance idle): "all of the coats have these 2 parts sticking up and out of the
sides ... when the coats are closed the legs still clip through, and there is a bunch of flickering between the coat and the leg".
Also his rule from the same message: clothes are fitted to the MPFB bodies only from now on, not the MPFB classic bodies.
- **Cause** (reproduced in the creator stage, Playwright + swiftshader, MPFB male, the pose frozen with mixer.setTime): THE COAT
  HANG chains, not the coat. With `EW_DISABLE_SWAY` the baked coat had no flaps (only a jeans spot). Four things in the chains:
  the first bone was held on the hips' hang while the coat's own weights carry that cloth with the thighs, so in any stance the
  thighs came out through it and the leg push shoved it out from right under its root (a straight bone swung far = a flap); the
  chains were rooted at the hip joints, but the bake blends the thigh in from ~10-15 cm higher (0.1 at +10 cm, 0.6 at the joint),
  so the cloth over the root rode the thighs up while the chain under it hinged (a corner at the waist); the thigh capsule began
  at the hip ball, which sweeps out where no flesh goes; gravity 0.6 sagged the skirt ~13 deg into the legs at rest so the push
  always fought it, and the push left the cloth exactly on the jeans (the flicker).
- **Fix** (three-renderer.js COAT_HANG + coatHang / hangFit / hangTick, runtime only, no GLB rebake): `rootFollow` (bone 0 aims at
  the coat's own follow target like the rest); `rootUp` 0.25 / `rootW` 0.01 (the chain root `yR` = the top of the band over the hip
  joints where the cloth's thigh weight is still >= 1 %; the skirt fade starts there); `thighTop` 0.25 + THE SEAT (an extra capsule
  from the hip ball to a quarter down the thigh, `seat: true`, whose allowance is 0 for every chain sample in front of the hip
  joints, so it only holds the back panel off the jeans' seat); `maxPush` [30, 40] (after the push, a bone never ends more than
  that off the coat's own direction); `gravity` 0.2; `rad` 0.03 + `limExtra` 0.008 (clearance; the rest allowance may push 8 mm
  past where the cloth stood at bind).
- **Measured** (flat ID colours, jeans px enclosed by coat px, front / side / side / back): his closed greatcoat, Wide stance
  1,325 / 1,834 / 83 / 557 -> 54 / 0 / 1 / 7; walk (frozen at 0.25 s) 12 / 1 / 15 / 49 -> 3 / 0 / 0 / 0 and the big front flap gone;
  duster 2,199 / 2,243 -> 15 / 0; cult robe 2,922 / 3,223 -> 619 / 3; female lab coat 832 / 2,420 -> 1 / 5; open long coat side
  bulges gone. Upright (Idle_11): the two saddlebag bulges at the hips are gone (they showed in every idle).
- **Tried + dropped**: `fade` 0.12 (a peak at the side); chain root at +5 cm (flaps stay); thighTop without the seat part (the
  jeans' seat through the duster's back); thighTop 0 with rootUp (side-back shelves); maxPush 20 / 35 (a jeans spot at the front
  pocket in the walk).
- **Known**: a small jeans spot can still show at the back vent / under the hem in the wide stance (the vent opening itself);
  the cult robe's wide hem still lets a shin through at the front in the Wide stance.
- Shots: /mnt/project-files/coat-flaps/ (before / after: wide stance, upright, walk, duster, cult robe, female lab coat, open long coat).

## THE BUMPS FIX (2026-11-05, character-models-plan row 9 pass 3)
mondo: "all of the coats still have these 2 weird bumbs on the side. Some have the 2 bumps on the back side ... Is this bc we were
trying to get the clothes to fit to the mpfb + classic body? ... Weren't the clothes made for mpfb? How are they messing up?"
- **Cause** (reproduced in the creator stage, Playwright + swiftshader, MPFB male greatcoat in Upright): THE COAT HANG leg push, not
  the coats and not the classic fit. With `EW_DISABLE_SWAY`, or the chains kept but the push off, no bumps. The flaps fix's clearance
  (`limExtra` 8 mm past where the cloth stood at bind, `rad` 3 cm off the fitted leg) was applied in full at every sample along a chain
  bone; a straight bone hinged at its head must swing 1 / t as far at its tail to clear the sample at t, so 6 mm at the sample 0.15 down
  bone 0 stood its tail ~4 cm out, on every chain round the hips, even in the bind pose: the two saddlebags at the sides, the two lobes
  over the seat (where the seat capsule pushes). The upright idles turn the thighs 10-18 deg off their bind direction, so the 3 cm
  clearance pushed the same way.
- **Fix** (three-renderer.js COAT_HANG / hangFit / hangTick, runtime only): `limT` (the extra past the bind distance x t along the bone:
  the tail never stands out more than limExtra; C.lim now holds the bind distance alone, the extra is added in `push`); `poseA` [15, 35]:
  per capsule, the angle of the leg bone off its bind direction carried by the Hips (`K.kb`, measured: Upright 10-18, Wide stance ~40);
  the 3 cm clearance is x (t + (1 - t) k), k = 0 under 15 deg, 1 from 35 deg, so it is full in the Wide stance / a stride and only at
  the bone tails in a standing pose. The non-penetration push (the fitted leg + the bind distance) is unchanged.
- **Tried + dropped**: rad x t always (the seat jeans came through in the Wide stance, 262 -> 967 px); a 0.5 floor on it (same);
  gravity 0 (bigger lobes: gravity is what holds them in); maxBend 20 / 30 (no change: the shape comes from the push, not the bend).
- **Measured** (jeans px through the coat, front / side / back / side, red coat): MPFB male greatcoat Upright 0 -> 0, Wide stance 262 -> 280,
  walk (frozen at 0.6 s) 27 -> 18; MPFB female greatcoat walk 248 -> 73.
- **Known**: mid-stride in the walk the swinging thigh still stands one side of the seat out a little (clearance is full there; 9 / 12
  joints per chain were tried and let 2-3x the jeans through). MPFB short: the lab coat's back still shows the jeans' seat in Upright and the push stands the sides out in a shelf; it is
  there with the push off too (the coat's own fit on that body), not from this fix. A small dark gap at the centre back of the seat
  (the vent top) shows on the greatcoat / long coat with or without the chains.
- Shots: /mnt/project-files/coat-bumps/.

### THE BAKED SHAPE (2026-11-05, pass 2 of THE BUMPS FIX)
mondo on the first after shots: "do you not see these parts of the coat awkwardly sticking out? The before and after literally look
the exact same ... all the wide stances cause these weird horizontal lines on the lower half of the coat ... the pointy side of the
coat are still literally in every after shot, every body"; "why is there a hole in the back of the coat" (female heavy cassock).
- **He was right**: pass 1 only fixed the upright idles. With the hang off (EW_DISABLE_SWAY) the coat is a clean A-line in the Wide
  stance with only the thighs coming through, so the bands and points were all the hang's doing.
- **The lines**: each chain bone aimed from wherever its joint had got to back at where the coat's weights carry the next joint, so a
  joint a little off turned the next bone back and the chain zig-zagged. Fix `tdir` 1: each bone lies along the coat's own baked
  segment (both joints carried by the coat's weights), so the chain reproduces the bake and the legs only push it out.
- **The point at the hips**: the top bone pivots at the waist, ~15 cm over the hip joints, so swung fully onto the thighs it stood the
  cloth out in a corner under the belt. Fix `follow` [0.5] + `followSide` (side / back chains' top bone half way, the front panels
  full: half there let a thigh lifting forward out through the front pocket) and `poseA` null (push clearance `rad` x t in every pose;
  the full 3 cm at the top sample kept for the Wide stance in pass 1 swung the hip out 1/t as far).
- **The slab** the baked shape showed at the side of the duster / long coat: THE SLEEVES OUT - the sleeve cuffs hang by the hips and
  were counted in as skirt (pulled the side chains' joints out to the hands; the fade then gave the cuffs skirt weights). Vertices
  with > 0.3 arm / hand / shoulder weight are now left out of the chains and the fade.
- `jsym` + `jblend` 0.5: the cloth either side of a joint shares both bones.
- **Tried + dropped**: chains rooted at the hip joints with the cloth over them on the pelvis (a shelf + jeans through); a per-direction
  leg radius (no change); follow 0.3 (jeans at the front pocket); a "never tuck in under the widest point" rule on the lower bones (no
  change to the cassock seat, more jeans through on the lab coat); a longer fade onto the chains (no change); tdir faded by how far a
  joint is off its baked place (it switched itself off in the Wide stance; the slab was the sleeves).
- **Measured** (jeans px through, red coat, 4 views, live PR #921 -> this): male greatcoat Wide 358 -> 144 (the 130 left = the jeans
  seen under the front hem between the legs, not through), walk 19 -> 1, Upright 0 -> 0; female lab coat Wide 174 -> 26; heavy duster
  Wide 1015 -> 115; thin long coat Upright 35 -> 0; female heavy cassock Upright 41 -> 0 (the seat hole). Sheets
  /mnt/project-files/coat-bumps/coats_pass2_C..F.jpg.
- **Known**: a soft shadow under the seat at the back of the heavy cassock / greatcoat (the coat's own bake has that fold there); the
  MPFB female lab coat still shows a little of the jeans' seat in the Wide stance back view; the thin long coat shows a bit of the tee at
  the waist side (above the skirt, its own fit, same as before).

## THE TABS + THE BODY SLOTS (2026-11-03, character-models-plan row 12n)
mondo: "In the character creator, can we have tabs instead of one long list where i have to scroll through everything. And I want the
clothes+accessories organized by body part like a typical rpg; head, torso, left arm, right arm, legs, footwear, etc."
- **The tabs** (party-builder.js CreatorControls): under the name + locker (+ the dev hider bar), one tab open at a time: BODY (bodies,
  shape, jiggle, idle pose), FACE (face sliders / presets, eyes, brows, mouth, facial hair; the classic face's eye / lip / beard rows),
  SKIN (skin colour, skins, chest; the classic Skin tone), HAIR, OUTFIT. Each tab's rows are the ones it had in the old list
  (ccBodyTab / ccFaceTab / ccSkinTab / ccHairTab / ccOutfit). `.pb-cc-maintabs` is sticky, so the bar stays at the top while a tab
  scrolls. The open tab / body part / kinds live in `_pbCcTab` / `_pbCcSlot` / `_pbCcKinds` (kept while the page lives). The FACE
  CAMERA reads each tab's `data-cc-cam-own` (FACE, HAIR, OUTFIT > Head / Face = face; the rest = body). The old list was 7,721 px tall
  in the forge; a tab is 800-2,700 px.
- **The body slots** (sprites.js THE BODY SLOTS): `EW_WEAR_SLOTS` = Head, Face, Neck, Torso, Back, Left arm, Right arm, Waist, Legs,
  Footwear; `EW_WEAR_GROUPS` = the kinds inside each (Head: Hats + helmets, Creature heads, Horns + antlers, Ears, Headsets / Face:
  Glasses + goggles, Masks + hoods / Neck: Ties + neckwear, Pendants / Torso: Tops, Dresses, Suits + bodysuits, Coats + jackets (the
  Outer layer + second outer + More coats), Underwear + swimwear, Armour + vests, Badges + straps / Back: Capes (the Cape layer),
  Wings (flapping + costume), Back gear, Tails + fins / Right arm: In the hand, Weapons + tools, Bags, On the arm / Left arm: Weapons +
  tools, Bags, On the arm / both arms: Gloves + claws, Nails, Arm sleeves, Shoulder + arm armour / Waist: Belts, On the hip / Legs:
  Bottoms, Skirts, Socks + stockings, Holsters + greaves / Footwear: Shoes + boots (the Feet layer + More shoes), Hooves + claws,
  Toenails). `wearGroupOf(id)` = the piece's kind: its shelf's (`EW_WEAR_GROUP_OF_SHELF`), the underwear split by name (arm
  sleeves -> arms, stockings / socks / pantyhose / leg warmers -> legs), toenails -> feet, else `EW_WEAR_GROUP_MOVE` (gear, armour,
  badges, belts, creature parts placed one by one). All 568 shelved pieces land in a kind; the 13 facial hairs stay under FACE.
- **Left / right** = the side the piece sits on in the MPFB bind pose (GLB bounds, +x = the character's left): left = the pack's
  "left hand" gun + kalistick, the wooden bow, the shopping bag, the arm band; right = the In the hand props, the pack's other
  weapons + tools, the handbag / sling purse / suitcase, the grapple gauntlet. A pair (`slot 'arms'`) shows on both arm tabs under
  BOTH ARMS with "A pair: worn on both arms".
- **Rules kept**: a pick still follows its SHELF's one-at-a-time rule (`toggleWear(shelfOf(id), id)`: one hat, one top, one held prop;
  several on the many shelves), EW_MH_WEAR categories untouched, every saved / locker / race / baked look loads as before. The MEN /
  WOMEN switch shows only on a kind it lists by (clothes; accessories list everything). TAKE ALL OFF = the clothes shelves + Outer /
  second outer / Cape / Feet, as before. The dev hider marks work on every tab. A dot on a tab / body part / kind = something worn there.
- **Text**: tab + body-part labels never wrap mid-word; a word of 11+ letters in a tile (COLLABERATION, ORKIFYHEADTARGET,
  HOUNDSTOOTH) gets a soft hyphen at its middle (`_pbSoftWrap`); name tiles 96 -> 112 px, fabric / print tiles 56 / 50 -> 84 px at
  8 px (CHAINMAIL, PINSTRIPE broke mid-word before). Checked in the forge at 1600x900 + 1600x2000: no button overflows, no sideways scroll.
- **Online**: nothing relayed; the creator is local UI and the look travels whole in the unit's appearance.
- Shots: /mnt/project-files/creator-tabs/.

## THE ASSIGNED LOOKS (2026-11-03)
mondo: "if i go in and make created characters for a bunch of units, do i have to export them individually ... one button should be to
assign the created character to the character (not the same as saving the character) and one button should be to export all newly
assigned created characters so i can give to you to bake in". Before this, EXPORT RACE LOOK wrote ONE race + gender per file.
- party-builder.js `AssignedLooks` box under the forge creator (every race but the DOOR Agent / human base; also on a slot with no look):
  **⇨ ASSIGN TO <RACE> ♂/♀** files the look on the stage as that race + gender's look in localStorage `ew_assigned_looks`
  (`{ v: 1, looks: { race: { gender: { appearance, at, exportedAt } } } }`, one per race + gender; a re-assign reads UPDATE and
  replaces it; ✓ ASSIGNED when the stage equals it). **⇩ EXPORT ALL ASSIGNED (n)** writes every assigned look that is not already
  the baked RACE_CREATOR_LOOKS row as ONE file `Entropy_Wars_Race_Looks_<n>_assigned_<stamp>.json`, the same
  `entropy-wars-race-looks` shape (+ an `assigned` list), so `node bake-looks.js <file>` bakes them all at once.
- Chips: NEW / EXPORTED / IN THE GAME (equal to the baked row, model key ignored; skipped by the export, nothing deleted); ✕ unassigns.
- SAVE CHARACTER (the locker) and EXPORT RACE LOOK are unchanged. window._ewAssignedLooks = { list, assign, unassign, exportAll }.
- A baked look is still a SAVED look (THE MESHY DEFAULT): the Meshy model stays the unit default until mondo says.
- Proof: /mnt/project-files/assigned-looks/ (3 units assigned, exported file, bake-looks.js --dry-run read all 3).
- **THE ASSIGNED LOOKS, LOADED (2026-11-05)**, mondo: "there's no way for me to select the assigned looks i have made ... I need the
  buttons at the bottom that have the assigned looks to switch to that look when i press them". The chips were plain labels. Now each
  chip's name is a button (`data-load-assigned="race:gender"`) and the forge's `loadAssignedLook` puts that whole look (no merge) on:
  this slot when it is that race; else the team's slot of that race (selected); else that race goes on THIS slot (pickRace(race, g,
  stay) = the roster pick without the jump to ABILITIES, so the creator stays open). Gender follows the look. The store is untouched.
  The chip of the look on the stage is outlined gold with ON THE STAGE. Proof: /mnt/project-files/assigned-looks/load_*.png.
- **BAKED 2026-11-05 (export 10:33, `Entropy_Wars_Race_Looks_4_assigned_20261105-1033.json`)**: `node bake-looks.js` on mondo's file,
  values exactly as exported (normalize changed nothing): Santa Clause ♂ + Cowboy ♂ rows REPLACED, Catgirl ♀ + Demon ♀ ADDED; every
  other row untouched (Cowboy ♀ too). Still saved looks (EW_RACE_LOOKS_ARE_DEFAULT false). Proof: the forge's USE THE SAVED <RACE>
  LOOK on all four, /mnt/project-files/assigned-looks-1033/.

## THE EYE + HAIR MATERIALS (2026-11-03, PR "MakeHuman eye and hair materials")
mondo: "can we download the system_eyes_materials 1 through 3 and system_hair_materials 1 and 2 from this page
(static.makehumancommunity.org/assets/assetpacks), if we havent already, and implement them in the character creator?"
- Packs: system_eye_materials01 (13, CC0), 02 (19, CC0), 03 (20, CC-BY), system_hair_materials01 (38, CC0, was already in
  mhpacks but never wired) + 02 (29, CC0). All five zips in project files mhpacks/; ASSET_PACKS_CATALOGUE.json lists them.
- EYES: sprites.js EW_MH_EYE_MATS rows [id mhm_<asset>, label, PNG, null, folder, group] are PUSHED onto EW_MH_EYE_PACK, so
  they are THE EYE PACK in every way (same key mhEyes, same eye mesh, Iris colour, hider, renames, preload). row[4] = their
  folder (mpfb/looks/eyes/materials/<asset>.png, 1024 px as shipped; the two maid-san ones 512). party-builder FACE > EYES:
  "Eye textures" shows only the pack (rows without a group), then "Eye materials: human / non-human / various".
  5 PNGs (anime navy, maid-san blue/red, snake, target) were opaque where the cornea dome samples, so the dome painted over
  the iris (white / yellow eyes): their alpha there was copied from a stock eye PNG (alpha < 128 = the cornea).
- HAIR: sprites.js EW_MH_HAIR_MATS [id mhh_<asset>, label, style id, PNG] (hair/mh/materials/<asset>.png, 2048 -> 1024).
  appearance.hairMat ('own' | id, EW_APPEARANCE_ENUMS); getHairMaterial(a) = the material only while its style is worn.
  three-renderer.js setHairMat (THE HAIR MATERIALS): the cards wear the PNG as painted (flipY etc. from the style's own
  texture, white vertex colours: its OWN colours, no grey mask); 'own' puts h.ownMap back and paintHair tints again.
  Called from setHair + buildHair (dropHair clears hairMatKey). The builder's HAIR tab: "Hair texture" row (Style's own +
  the style's recolours) only on Bob 01/02, Braid 01, Long 01, Ponytail 01, Short 01/02/04; while one is worn the Hair
  colour row is replaced by a note (it would do nothing to the hair).
- CREDITS: mpfb/CREDITS.json creator_eye_materials + creator_hair_materials (author, licence, source per asset); the CREDITS
  page groups them with the other MakeHuman authors (checked: Elvaerwyn's eye 03 assets, Hatshj, MargaretToigo show).
- Hider kind 'hairMat' ("Hair texture"), bake-hidden.js knows it.
- Proof: /mnt/project-files/creator-mh-materials/ (12 + 4 eyes, 19 hair textures, back to Style's own + colour, the panel).

## THE FUR + THE ANIMAL HEADS (2026-11-03, plan rows 18 + 28)
mondo: "go ahead and get it [the MPFB hair editor] and try on the werewolf, make a new created character for the werewolf to put fur on it".
- THE TOOL: `bake-fur.py` (repo root, offline Blender: `pip install bpy==5.2.3`, MPFB 2.0.18 clone). `python3 -I bake-fur.py --mpfb <mpfb2> [--haireditor <zip|dir>] [--only ewf_fur]`.
  It installs the hair editor templates (files.makehumancommunity.org/functional/haireditor.zip, copy in project files mhpacks/haireditor.zip) into MPFB's data/hair/haireditor,
  grows the editor's fur grooms on a FRESH unbaked male (grooms land wrong on a human whose targets were baked), then "Bake hair cards" BODY_SHELL = a copy of the skin faces
  with the fur baked into a 1024 texture. The shell is anchored to the nearest SKIN vertex (helpers are masked) and written in the bake-mpfb.py wear layout
  (5 bodies' offsets, top-4 bone weights) as `charactercreation/wear/ewf_fur.glb`, cat 'underwear' (under every garment), pack 'haireditor', extras fur:true. FUR_ALPHA 1.5.
- Tried and DROPPED: the editor's CLUSTER_RIBBON tufts (cards) looked like flat dark flakes/squares on the body. Only the shell ships.
- THE CREATOR: wear pick "Fur (whole body)" on the new shelf Fur (torso group), both genders (EW_WEAR_BOTH). Tint works like any wear.
- THE ANIMAL HEAD: bake-mpfb.py ANIMAL_SHAPES fetches jaldmic's wolf head target (makehumancommunity.org/node/3009, CC-BY, CREDITS.json creator_animal) into mpfb_shapes.glb
  as `wolfHead`; face slider group "Animal head" (0..1). More heads = one ANIMAL_SHAPES row + `--shapes --packs` rerun.
- THE WEREWOLF LOOK: RACE_CREATOR_LOOKS werewolf male (heavy body, wolf head 1, pointed ears, bald, dark skin, fur + wolf tail + beast feet + hand claws), bake input
  /mnt/project-files/werewolf-fur/Entropy_Wars_Race_Looks_werewolf_fur.json. A SAVED look: the Meshy werewolf stays the unit default (THE MESHY DEFAULT).
- Honest state: a short-fur suit with a smooth outline, not the Meshy model's shaggy volume; shell flakes stand off the ears when the wolf head reshapes them;
  the wolf head reads a bit feline. Next ideas: runtime stacked shell layers for volume, a better head target. Pictures: /mnt/project-files/werewolf-fur/.
- ROUND 2 (2026-11-03, mondo: "add the werewolf head to the creature heads ... retexture all three in meshy so they all have a consistent
  fur texture ... the tail is visibly disconnected"):
  - THE SHAPED HEADS: the Animal head group is `inHeads` (sprites.js EW_SHAPE_HEADS): OUTFIT > Head > Creature heads shows "Wolf head" as a
    pick (+ a strength slider while on); it is gone from the FACE tabs. One head at a time with the model heads (party-builder.js ccShapeHeads,
    toggleWear). Same saved key wolfHead.
  - THE WEREWOLF FUR SKINS: Meshy Retexture (meshy-6, enable_original_uv, remove_lighting) of the MPFB heavy body + Wolf head 1 (positions
    from mpfb_heavy.glb + the wolfHead offsets, its own hm08 UVs) -> base colour 2048 -> mpfb/looks/skin_ew_werewolf_fur.jpg (A, text prompt)
    + skin_ew_werewolf_fur_dark.jpg (B, image style = a render of the Meshy werewolf); EW_MH_LOOKS.skins.push after the generated block.
    Sources + prompts' inputs: project files meshy/retexture/werewolf/. The hm08 sheet has the same orientation as the body GLB's own texture.
  - Tail + feet to match: bake-meshy.py `tex=` (a Retexture base colour on the piece's own UVs in place of its Meshy one): ewm_wolftail_fura/b,
    ewm_beastfeet_fura/b (Tails / Creature shelves).
  - Fur shell in those colours: `bake-fur.py --from-skin <skin.jpg> --name ewf_fur_werewolf` (no Blender): each shell texel takes the skin
    colour under its nearest body vertex, strand shading + alpha kept. Pick "Fur (whole body), werewolf colours".
  - THE TAIL ROOT: bake-meshy.py taper=(frac, k0) narrows a tail's flat cut end toward its centre line, sink= sinks it deeper; the wolf tail
    taper (0.25, 0.22), sink 0.05 (was a disc standing off the lower back). --views on a tail = root close-ups on every body.
    2026-11-05 (mondo: "yes"): the lizard tail taper (0.18, 0.3) + shark tail taper (0.2, 0.25), both sink 0.05. Pictures werewolf-fur/06.
  - The saved werewolf look (bake-looks.js, input werewolf-fur/Entropy_Wars_Race_Looks_werewolf_meshy_fur.json): heavy, Wolf head, fur skin A,
    tail + feet A, hand claws, no shell. Still a SAVED look; the Meshy werewolf stays the unit default.

## THE PACK'S MIS-FILED PIECES + THE PACK FABRICS (2026-11-03, character-models-plan row 12p)
mondo: "putting on the viking boots removed my viking pants, and vice versa. Also can we add the option to change the pants textures
like cotton and leather and all that? Im not seeing that option anywhere in the pants section".
- CAUSE: the MakeHuman pack files the viking boots / pants / tunic and the EMT uniform pants / jackets under `suits` (the winter coat
  under `dresses`). THE SHELVES only moved their tab; normalizeWearList's one-per-category rule still took one off.
- FIX (sprites.js): `EW_WEAR_KIND` = what such a piece is (`wearKindOf(id)`); normalizeWearList keys its one-pick rule by
  `wearPickKindOf` (EW_WEAR_KIND, then 'outer' for EW_WEAR_PICK_AS_COAT, then the pack category). three-renderer.js buildWear reads
  EW_WEAR_KIND before the GLB's own `ex.cat`, so the viking boots layer as shoes (trouser legs over them, zOf -500) and the pants as
  bottoms. A new mis-filed separate = one EW_WEAR_KIND line. Every other boot / trouser is in its right category (Domsjeans1 under
  Shoes is a shoe, 12 cm tall).
- FABRICS: `appearance.wearFabric = { id: EW_FABRICS key }` (normalizeWearFabric; `wearFabricable` = tintable + kind bottoms, so
  only pack trousers; Blender bottoms keep the Bottoms fabric row). The creator shows "<piece> fabric" (Original texture + the
  Bottoms layer's fabric tiles, 'plain' left out) under the piece's colour block in ccWearTints. Renderer paintWear: the fabric
  tile (as a canvas pattern) x the piece's grey mask (_ccPackHairTexture), the piece's alpha kept, cached in _ccWearFabricCache;
  tiles per UV unit = the fabric's tiles per metre x the garment's metres per UV (wearUvMetres, from its triangle areas); colour =
  wearTint or the texture's own average (wearOwnColour); fabric roughness / metalness, restored on Original texture. The tile's own
  colour multiplies in (as on the coded layers): leather browns, denim blues.
- Known: the viking boots' fur wraps show through TIGHT jeans at the shin (they are wider than the jeans' leg); fine with the
  viking / EMT / loose trousers. Shots /mnt/project-files/pack-fabrics/.


## THE LID LASHES (2026-11-03)
mondo: "im not seeing lashes 1 -4 show up in the character creator/ they are there and i click them but i dont see any lashes".
- CAUSE: MakeHuman's stock eyelashes01-04 (makehuman_system_assets) are fitted to hm08's eyelash HELPER (helper-l/r-eyelashes-1/2,
  their own UV island at the top of the sheet). bake-mpfb.py cuts that helper from every MPFB body, and bake_looks drew the four lash
  layers through the helper's UVs (box ~673,15): a patch of the sheet no visible triangle uses. Same for every body's OWN lashes (the
  kits wear eyelashes01 / 02, baked into each GLB's stock sheet in the same dead spot). The pack's mindfront "Mesh lashes" are fitted to
  the lid itself, so they always showed.
- FIX: `bake-lashes.py` (numpy, no Blender: an mpfb2 clone's base.obj + the system eyelashes) drops each proxy vertex's rest point onto
  the nearest point of the body's own skin round the eye and draws the lash there (bake_looks' rasteriser, alpha 0.8). New PNGs on R2
  (same keys `mpfb/looks/eyelash_eyelashes0N.png`, ASSET_MANIFEST shas updated) + new boxes in sprites.js EW_MH_LOOKS.lashes
  (~843-849, 475-482). `--check <eyelashes01_cc0>` re-draws the mindfront lashes and must print the boxes already in sprites.js (it
  does: proves the tool's UVs are the game sheet's).
- Body's own: sprites.js `getMhOwnLashLayer(body)` = the kit's lash layer; three-renderer.js setLook with every pick 'own' wears
  `_ccOwnLashMap` = the stock sheet + that layer, ONE shared canvas texture per stock map (not per unit); the stock sheet until it is
  ready / if it fails. getCharacterAppearanceAssets warms the PNG.
- A re-run of `bake-mpfb.py --looks` writes the helper-drawn lash PNGs + boxes again: run bake-lashes.py after it.
- Shots (MPFB male + female, every lash pick, close-up): /mnt/project-files/creator-lashes/.

## THE PANTS IN THE BOOTS (2026-11-03, character-models-plan row 12q)
mondo: "Can we make pants fit inside boots or have the option for them to be inside or outside?" (thread
cmsg_01XWpxyTn3nnw98znVzKdFjsAX2ogSpgP9tAuNgyFenVtL). MPFB bodies only (pack + Blender clothes; not MPFB classic).
- THE CHOICE: `appearance.pantsTuck` 'out' (default) / 'in' (sprites.js EW_APPEARANCE_ENUMS). The creator shows a "Pants + boots"
  OUTSIDE / TUCKED IN row on OUTFIT > LEGS > Bottoms AND FOOTWEAR > Shoes + boots, only while `pantsBootsWorn(a)` finds a worn boot
  whose shaft top is over the lowest worn trouser hem (+2 cm). party-builder.js ccPantsTuck.
- THE TABLES (sprites.js): EW_BOOT_TOPS = 29 pack boots + the Blender bboots / bhighboots / bcowboy by the 90th-percentile height
  of their male fit (m); EW_PANT_HEMS = 20 long trousers by the 1st-percentile hem height. Skirts, shorts, Scale leggings and
  Football pants are left out (no hem over a boot). A new long trouser / boot = add its row (measure the fitted GLB).
- THE FIT (three-renderer.js wearBootFit, run in wearLayers after THE TUCK; kill-switch `window.EW_DISABLE_BOOT_FIT = true`):
  legFrame = each leg's centre per 1 cm slice from the skin; legGrid = a garment's radius per (leg, 2 cm row, 15 degrees) +
  its top (morphologically opened so a cowboy pull tab is not the top) and its bottom.
  - OUTSIDE: the trouser leg's last 6 cm flares out to clear the boot (max 2 cm), then the boot under the trouser leg is drawn in
    4 mm inside it (above the ankle), and 3 cm under the hem its triangles leave the index (the viking fur no longer pokes
    through jeans when posed).
  - TUCKED IN: the trouser leg is drawn in 4 mm inside the shaft, never nearer than 1 cm to the skin (0.7 cm deep in the boot),
    narrowing over 3 cm above the opening. Its bones there: the nearest boot vertex's (inside) / the skin's (over the opening,
    fading over 5 cm) - on its own bones the idle's knee bend lifted the jeans 3 cm out of a cowboy boot. Triangles 2.5 cm under
    the LOWEST top within +-2 angles leave the index (a 3 cm jeans triangle spans 2 angles; cut by its own angle's top it left a
    hole to the shin over the cowboy boot's dips). THE LAYERS lay the boot over the trousers (`bootOver` = trousers' z + 0.5, so a
    coat still goes over the boot) and never pull a tucked trouser leg along a boot again.
  - TRIED + DROPPED: letting the boot's opening out round the trousers (per vertex it pushed a biker boot's lining through its
    collar; per cell it flared every opening into a funnel); a whole-shaft push (sawtooth boots).
- CHECKED (idle + walk, 4 angles, both modes): jeans x viking / ankle / Blender boots / high boots / cowboy, cargo x biker boots,
  tight jeans x female knee boots, female trousers x riding boots, viking pants x viking boots, sweatpants x high boots; the real
  creator clicks (OUTFIT > LEGS > Male classic jeans, FOOTWEAR > Viking boots, TUCKED IN). Shots: /mnt/project-files/pants-boots/.
- KNOWN: a fleck of jeans can show at the cowboy boot's stitched band when posed; outside mode leaves a speck of viking fur at the
  jeans' hem on one side; the white spots on the viking boot's foot are in the pack texture (there with the fit off).

## THE SHAPED EARS (2026-11-03, plan row 28: cat ears)
mondo: "Where are the cat ears in the editor? DO we not have any?" Before this the creator had NO cat ears: Ears (OUTFIT > Head) held
only the Meshy Elf ears; the Catgirl's ears exist only inside her own Meshy model (one mesh, can't be lifted off). The MakeHuman packs
already in project files mhpacks/ carried two cat-ear TARGETS nobody had baked:
- `catEars` = titleknown_catgirl_ears (animal01, CC0): tall pointed ears. `felineEars` = jaldmic_feline_ears_v2 (animal02, CC-BY,
  credited in CREDITS.json creator_animal, part "animal ears"): rounder ears. Both grow the body's OWN ears up the sides of the head
  (~12 cm), so they wear the skin + skin colour and follow every slider (the plan's 4b guess that they would not reach the top was wrong).
- Baked like the wolf head: two ANIMAL_SHAPES rows, `bake-mpfb.py --shapes --packs` (the shapes step needs no Blender: a stub `bpy`
  module is enough). The new keys are appended, so the old 222109 offsets are byte-identical (the old file re-baked byte for byte
  from MPFB 2.0.18 first). mpfb_shapes.glb 3114088 -> 3141064 bytes.
- THE CREATOR: OUTFIT > Head > Ears shows "Cat ears" + "Cat ears, round" as picks (party-builder.js ccShapeEars, sprites.js
  EW_SHAPE_EARS = the `inEars` face-slider group; not on the FACE tabs) + a strength slider while on. One pair of ears at a time: a cat-ear
  pick takes the Elf ears off and the Elf ears take the cat ears off. MPFB bodies (and an MPFB classic body's MPFB head) only, like every
  face slider.
- Face resets keep the shaped picks: DEFAULT FACE / NEUTRAL FACE / a face preset / a body swap / RANDOM use sprites.js
  EW_FACE_RESET_KEYS (every face key but the shaped heads + ears), so they no longer wipe the cat ears or the wolf head; RANDOM sets them 0.
- THE HAIR STAYS OFF THEM (on-screen check, same day): the first build hid them. The hair's skull box + skull map (fitHair) were
  measured with the grown ears in, so the hair scaled wider and was pushed out over the ears. three-renderer.js shapeBody now keeps
  the ear offsets apart (part.earD) and the skull is measured without them. Checked in the real creator (catgirl slot, MPFB female,
  OUTFIT > HEAD > EARS: both picks, both sliders, Elf ears swapping them off): /mnt/project-files/cat-ears/cat_ears_in_creator.jpg.
- Known: a long / big hair style can still cover the ears (its cards hang there).
  Proof (mesh render, front / 3/4 / side): /mnt/project-files/cat-ears/. More ears (bunny, canine, dropped) = one ANIMAL_SHAPES row each.

## THE LAYERS 1 2 3 (2026-11-04, character-models-plan row 12r)
mondo: "there really needs to be some sort of layer system in the character creator. Like layer 1, 2, and 3. I dont like how i can only
add an outer layer of coats". Before this the torso had a Tops kind (one shirt), a Coats + jackets kind (the Outer layer, a hidden
＋ ADD LAYER for the second outer, More coats) and nothing for a shirt over a shirt.
- **The UI** (party-builder.js ccTorsoLayers): OUTFIT > TORSO opens on LAYERS 1 · 2 · 3 (sprites.js EW_WEAR_GROUPS row 'layers'; the
  'tops' + 'coats' rows are gone, their pieces keep those groups and show inside the layers). Three tabs side by side, each with its
  number, what it is for and what it holds now ("Nothing" in italics), then one line on the layer + ✕ TAKE LAYER n OFF:
  - LAYER 1 · Shirt / top = the Tops shelf pick (pack + Blender), its Top fabric rows (a Blender one) and tints.
  - LAYER 2 · Shirt, vest or jacket = one of: a second shirt / top over Layer 1 (`appearance.wear2`, the Layer 1 piece not offered
    again), any Outer pick (`outer`, kinds Vests + jackets first: EW_OUTER_GROUPS split 'Coats + jackets' into 'Vests + jackets' and
    'Coats', display only), or a pack coat ('coats' group). A pick takes the other two off. A Blender wear2 shirt has "Layer 2 shirt
    fabric" + print + colour (the top2Fabric / top2Color / top2Pattern / top2Color2 keys of the retired coded second top; top2Color
    default now slate #5e6f80), a pack one its own tint row.
  - LAYER 3 · Coat = the second outer layer (`outer2`), Coats listed first.
  - Text wraps in the tabs (overflow-wrap), never cut; grid of 3 at any width. Layer tab kept while the page lives (_pbCcLayer).
- **The data** (sprites.js): `wear2` = a Tops piece id (wearPickKindOf 'tops') not in `wear`, else 'none' (normalizeWear2);
  wearTint / wearFabric keep it; getCharacterAppearanceAssets warms it; TAKE ALL OFF clears it. Every old look loads unchanged
  (Layer 1 = its top, Layer 2 = its outer, Layer 3 = its second outer). Online: nothing to relay, the look travels whole.
- **The renderer** (three-renderer.js setWear): wear2 loads with the pack clothes; built after them with z = min(69, max(own z,
  highest Layer 1 top z + 3)) so THE LAYERS fold every Layer 1 top in under it and it stays under the Blender coats (70) and the second
  outer (200); a Blender one paints through the top2 shell (layer 'top2', paintMeshOuter / setFabric).
- **The clipping found + fixed** (browser, MPFB male + female, posed idle + bind, 4 views each):
  - Collared shirt (Blender) under a pack knitted sweater: blue specks along the sweater's sleeve seams + armpits. Cause: shirt points
    there whose lines meet no sweater triangle grew 2-ring holes (the erosion in wearUnderCover). Now a point also counts as covered
    when it sits on skin the garments over it delete (their del lists, `delUp`; inside a waistband only the non-trouser ones) or when
    3+ of its 4 tilted lines (`lineHits`, LINE_TILT 0.55 rad) hit them (a crack between unwelded pieces).
  - Hoodie / sweater under an OPEN Blender long coat (the old second outer too): the chest cut full of holes, skin showing. Cause:
    wearUnderOuter2's opening rule (within 3 cm of an open edge and not 4 mm behind it) + the side rule caught everything in the
    opening. Now a point whose outward line and tilted lines all miss the coat (it looks out through the opening) stays, unless it
    stands more than 8 mm in front of the coat (OUTER2_HIDE.standOut: a duster's lapel through a police coat still goes).
  - Rechecked: shirt + waistcoat + open duster, henley + duster + police uniform, henley + jacket + closed greatcoat, collared shirt +
    open duster (no teeth at the lapels), tank + hoodie + long coat, tee + untucked shirt; female camisole + cardigan + trench,
    camisole + lace-up blouse + long coat.
- Known, not from the layers: an untucked Blender shirt shows a dark patch of the pack jeans' seat at the back (same when worn alone).
- Shots: /mnt/project-files/creator-layers/.

## THE CREATOR ICONS (2026-11-04, character-models-plan row 12s)
mondo: "i want to redesign the character creator a little bit, basically i just want to add icons for the different tabs and wear to
make it easier to navigate" + "try to find icons from this asset pack" (https://sungraphica.itch.io/minimal-game-icons-pack). His three
reference shots (an equipment screen with HEAD / UPPER BODY / LOWER BODY icon slots, a DS-style item tab bar) were for the layout only.
- **The pack**: the free download is 90 menu icons (no clothes / body icons); mondo owns the full 600-icon pack and dropped its zip in
  R2 (sha 9bd12d1c); it now lives ONLY in the private bucket dirtymondo `inbox/Minimal icons(1).zip` (moved out of the public
  ewmusicsfx CDN bucket on his word, 11-04; not kept in project files). The free part's contact sheet:
  /mnt/project-files/asset-packs/other/sungraphica_minimal-game-icons/free_90_icons_sheet.png. Licence: free for commercial use, editing allowed, no reselling / redistributing the
  ORIGINAL files, "please credit SunGraphica" -> data.js EW_CREDITS section ICONS. The pack never goes in the repo.
- **The icons** (`python3 -I bake-creator-icons.py <the zip> <out>`, its ICONS table): 15 PNGs, 128 px, white + alpha (an emoji's black
  eyes / mouth become holes), on R2 `Assets/Icons/creator/<key>.png` (uploaded with `node sync-zip.js --put`). Tabs: BODY = Human,
  FACE = the relax emoji, SKIN = Drop, HAIR = Head full (the pack has no comb / hair icon), OUTFIT = T shirt. Body parts: Head = Hat,
  Face = mask 2 (a hood + eye mask), Neck = Necklece, Torso = Armor, Back = Bag (backpack), Left / Right arm = Glove (left mirrored),
  Waist = Bag2 (a pouch; no belt icon in the pack), Legs = Pants, Footwear = Shoe_ (a boot).
- **The look** (party-builder.js CC_ICONS / ccIcon, styles-base.css "THE CREATOR ICONS"): each icon is a CSS mask filled with the
  button's text colour (`currentColor`), so it dims and lights gold with its label and follows the UI Maker's colours; the CDN sends
  CORS (needed for a mask). The five tabs = icon over the name. OUTFIT's body parts = icon tiles in two even rows (Head, Face, Neck,
  Torso, Back over Left arm, Right arm, Waist, Legs, Footwear: `--cc-cols` = half the parts shown), a gold dot in the corner = something
  worn there (the old " •"; the tile's title says how many). The kinds chips, the LAYERS 1 · 2 · 3 tabs and every pick are unchanged.
  A key missing from CC_ICONS draws no icon (text only), a missing file draws nothing.
- **Checked in the browser** (Occam's mirror, 1600 x 900 and 600 x 900): no cut labels, no sideways scroll, OUTFIT > TORSO > LAYERS 1 · 2 · 3
  switches layers as before, LEFT ARM / FOOTWEAR open their kinds. Shots: /mnt/project-files/creator-icons/.

## THE TAKE ALL OFF SPLIT (2026-11-05)
mondo: "the button that says "take all off", can it only take off the category of clothes you have selected? And there should be
another button that says "Clear All" and it should be red and that should do what take all off does now".
- OUTFIT row (beside MEN / WOMEN): TAKE ALL OFF now takes off only what is worn in the OPEN KIND (the chip under the body part:
  Hats + helmets, Layers 1 · 2 · 3, Bottoms, Capes, Wings ...), the same pieces that kind's gold dot counts (party-builder.js
  `kindOff`): its pack pieces + its layer key (layers = Layer 1 tops, pack coats, wear2, outer, outer2; cape; wings; feet; shaped
  heads / ears). Shown only while that kind has something on.
- CLEAR ALL (red, `.pb-cc-clearall`) = the old TAKE ALL OFF: every piece of clothing on every body part off (facial hair + accessories stay).
- Checked by clicking in Chromium: hat + jeans + tee on, TORSO > TAKE ALL OFF took only the tee, CLEAR ALL took the rest. Shot
  /mnt/project-files/creator-take-off/two_buttons.png.

## THE PENDANT CORDS (2026-11-05, plan row 12u)
mondo 11-05: "all of the pendants in teh character creator need strings in attached to them that hang around the character's
neck, make the string yourself". three-renderer.js `wearCords` / `wearCord`, run at the end of `wearLayers` (renamed body:
`wearLayers0`), so the cord is rebuilt on every wear change and every slider move.
- WHICH: every worn solid piece whose `wearGroupOf(id) === 'pendants'` (OUTFIT > Neck > Pendants: ewm_crosspendant,
  ewm_talisman, ewm_hagstone). A pendant added to that group later gets a cord with no code change. Colours: WEAR_CORD.colors
  (cross black, talisman brown leather, hagstone twine), else WEAR_CORD.color.
- NO MODEL FILE: the cord is a tube (radius WEAR_CORD.r x height/1.7, 7 sides) one of the pendant's accents (`w.cordMesh`,
  mesh `EWCreator_wear_<id>_cord`), so it comes off / hides with the pendant. MODEL_LIST §5e says so (list-models.js).
- THE SOLVE (in the bind pose, on the body as the sliders shaped it = src + shapeD): a rope pinned at the bail (the pendant's
  top 4 mm), started as a loop round the neck (WEAR_CORD.ring of neck -> Head bone) + two lines down to the bail; each step the
  points move toward their neighbours' middle (tension, `pull`), a little down (`fall`), then out of the skin and the garments
  (nearest TRIANGLE via `triField`, Ericson closest point; skin clearance WEAR_CORD.skin, cloth WEAR_CORD.cloth). Coarse to fine
  (`levels` 12/24/48/72), then `finish` passes of [1 2 1] smoothing + collide (the cord wavered on bare skin without it).
- CLOTHES: a garment is a collider only when the pendant hangs OVER it (the bail is outside it or past its rim): the cord then
  goes over a tee's collar. Under a closed coat the pendant is under too, so the cord stays under it. A point past an OPEN edge
  (a collar rim, wearSpan open) is not pushed (a push off the rim's normal made steps where the cord crossed the collar).
- WEIGHTS: each point takes the weights of the triangle it lies on (the garment's, or the skin's welded siW/swW), so posed it
  moves with the collar under it (nearest-skin-vertex weights left kinks at the collar in the idle); evened along the cord
  (4 passes) and blended into the pendant's own bone within WEAR_CORD.bone of the bail. Capes / hung coats (own chain
  skeletons) never lend weights.
- Checked on screen (Chromium, Playwright EWCharViewer.mount, front / 3-4 / back at the bust): mpfb male / female / heavy / thin /
  short / female heavy / female thin, weight + muscle + neck sliders both ways, bare chest, a tee, a closed leather jacket, an
  open blazer. Shots /mnt/project-files/pendant-cords/.

## THE COLOURS ON THE VERTICES (2026-11-05)
mondo: "tinted clothes appear white" on Select Your Team (his assigned Demon / Cowboy / Santa Clause / Catgirl looks).
- Cause: every stage that shows a unit (the team room `_trAddMember`, the board `_attachUnitModel`, the race actors) swaps
  the rig's materials for its own Lambert copy whose colour is the light level (+ the AP-spent grey / hit flash, reset every
  frame on the board). The rig kept the wear tint (paintWear), the Blender coat / layer colour (paintMeshOuter), the beard
  colour (paintFacial), the wings colour (paintWings), a piece's own base colour and the pendant cord's colour on the MATERIAL colour, so all of them came
  out white wherever the swap ran. It ran on them when the garment GLBs were already cached (after the creator / a team
  swap); on a cold load the garments landed after the swap and kept the creator material (tinted, but lit unlike the body).
- Fix (three-renderer.js rig `wearVC` / `wearMap`): every worn piece's colour rides its own vertex-colour attribute (x its
  baked shade `_g`, kept in mesh.userData._ewShade), its material colour stays white; accents get their own colour attribute
  (no longer shared with the main piece); the wings get a colour attribute on a rig-owned wrapper of the cached wing file's
  attributes (x the file's own vertex colours). The swaps already keep vertexColors and tint the glow with them
  (_ewVColorEmissiveHook), so the colour survives on every stage. wearMap moves the stage copy's glow map with its map.
- The team room sweeps each member every half second for meshes still on a creator material (`_trLookMats`: THE LATE
  PIECES), so a garment that lands after the body is lit like the body.
- Checked in Chromium (team room, his 4 assigned looks, cold + cached garments): before/after shots in
  /mnt/project-files/team-room-tints/.

## THE COAT TRIMS + THE COLLAR (2026-11-05, character-models-plan row 12v)
mondo's Santa Clause race look (MPFB heavy, weight 0.6, belly 0.8, width 1.13; outer `bsanta`; pack trousers TUCKED IN medieval
boots): "His coat is all fucked up, the head opening is wayyyyy too wide and there is red clipping through the belt. I have pants
tucked in toggles but the pants are still clipping through the boots." Runtime only (no GLB rebake), every Blender coat, MPFB bodies.
three-renderer.js `wearCoatFit` (right after the first wearFollow in wearLayers0; kill-switch `window.EW_DISABLE_COAT_FIT = true`):
- **THE SKIN FLOOR**: a coat vertex with nothing of the coat (cloth or trim) over it, straight out from the skin as fitted
  (`w.floorFree`), stays `floorGap` outside the skin (skin normal, at most `floorMax`, smoothed). The heavy body's shoulder tips
  stood out through the notch where the body piece meets the sleeve cap (it is there on the bind pose too, not a weights thing).
- **THE SLEEVES UNDER THE BODY** (`coatPieces`: welded pieces, body = most triangles, sleeves = >= 100 tris off the middle): a
  sleeve vertex the body piece lies over stays behind it (the cover mechanism below, hide eroded 1 ring).
- **THE TRIMS** (`coverFit('trims', cloth, accents, 0)`): per cloth vertex under an accent as fitted (outward normal, else straight
  out from the skin, within `under`), held `gap` behind EACH accent separately (the cloth runs inside the belt box, the buckle sits
  on the belt) as it now lies; takes the bones of the nearest accent vertex (with the belly's own bones it slid out through the
  belt + front band once posed); a cloth triangle wholly under trims leaves the drawn index (`wearTrimHide`, in wearUnderCover) and
  the skin under it is hidden too (`w.trimSkin` -> skinCover; it showed as a cream strip beside the band at an angle). NOT eroded:
  one drawn ring under the band came out through the belt + band when posed (tried, worse).
- **THE COLLAR**: over the coat's top `h`, per angle round the neck axis, the coat's innermost radius comes to `neck` off the
  outermost skin AND off the garments worn under it (girthGrid of their points; the cowboy's shirt collar came out through the
  greatcoat's stand), every layer by the same amount; the pulled collar takes the skin's bones and rebuilt normals (it shaded grey).
- **THE TIGHT BOOT** (wearBootFit, TUCKED IN): inside a boot whose inside hugs the skin (the medieval boot: 0-5 mm, sometimes inside
  the skin), the trouser's floor drops from the usual stand-off to `BOOT_FIT.onSkinTight` over `tightDeep` below the boot top, never
  deeper than the boot's own inside; trouser points outside the boot went 36 / 85 -> 0 (plain male) and 4 tiny ones at the rim (Santa).
Checked in a real browser (idle pose + rest): his Santa, the same coat on plain MPFB male, his cowboy (greatcoat looks as before),
demon, catgirl. Shots: /mnt/project-files/santa-coat/. Known: small skin specks through the pack trousers at the heavy shins
just over the boot (there with OUTSIDE too, and before this change).

## THE CLOTH COLLISION (2026-11-05, plan row 12w)
mondo: "Can you not just add collision to all the mpfb bodies and clothes?" (thread cmsg_01XWpxyTn3nnw98znVzKdFjsRJYzgHjRXtmeoBaW2t94T1).
Before this, every fit-time system (skin cover, coat fit, coat hang, layer push) only fixed the REST shape; once posed, cloth and body ride
different bone weights and drift into each other. THE CLOTH COLLISION is a per-vertex body collision in the vertex shader:
- FIT (rig `collideFit(part)`, after `update()`, garment loads (`part.colDirty`) and jiggle re-weights; throttled 150 ms in tick; slider drags
  defer it): for every cloth vertex of every visible garment (`collideList`: coded shells incl. lathe pieces via `mesh._ewColBase`, pack /
  Blender wear, accents; not solid / grip / hideHead) find the nearest skin vertex on the CURRENT body (sliders + jiggle weights in),
  store it as the anchor (position, smoothed normal, body bone indices packed j1 + 256*j2, weights) + its rest stand-off c0. The band is
  [c0 - min(1.5 mm, half the gap to the layer below), c0 + min(4 mm, half the gap to the layer above)], gaps from 2 cm anchor cells of the
  other garments. Fades out for c0 3-5 cm (loose cloth hangs free) and when the vertex slides 3-6 cm off its anchor. A SECOND ANCHOR (the
  nearest skin vertex of another bone within 4 cm) only pushes outward and is gated off when its posed normal faces the first one (a crease:
  pushing off one skin would push into the other). Attributes: ewColA/N/J/W (+ ewColA2/N2/W2). `collideGuard` drops stale ones.
- FRAME (GLSL `_ewColPatch` after `#include <skinning_vertex>` under `EW_COL`; node twin `_ewNodeCol` via `_ewNodeDress` when `m.ewCol==='on'`):
  skin the anchor with the body's own bone matrices (every garment skeleton starts with the body's bones), push the cloth along the anchor
  normal back into its band, at most 3 cm. Uniform `_EW_COL` = window.EW_CLOTH_COLLIDE {x on, y/z slide fade, w cap}.
- LAYER ORDER: garments ranked by median c0; `_ewColMark` gives rank r a polygonOffset (factor -min(3, 0.5r), units -2r) so the outer
  layer wins the depth test where two layers touch = no flicker.
- Board / team room / spell doubles keep it: `_ewColMark(lm, n)` on the Lambert swaps (unit build, `_trLookMats`, `_raceActor` lit).
- Cost: fit 5-43 ms per clothes change (22k cloth points); frame time unchanged within noise (cowboy 127 vs 129 ms/frame, Santa 120 vs 123 on
  swiftshader). Node renderer: checked on ?ew_gpu=webgl2 (same TSL; headless WebGPU loads no models even on main): 20 materials dressed, no errors.
- Measured (cloth points inside the posed skin, off -> on, same frame): cowboy pockets idle 213 -> 136, Santa pockets 139 -> 121, Santa tough
  89 -> 78, vampire 18 -> 7, coded sword swing 233 -> 162, cowboy crouch 602 -> 589. Tight creases (sitting seat, folded inner elbow) don't
  improve: a fold can't be cleared by pushing. Probe: Playwright + EWCharViewer.mount, freeze the clip, toggle EW_CLOTH_COLLIDE.x in one frame,
  CPU replica of the push to count points (scratch only). Kill-switch: EW_DISABLE_CLOTH_COLLIDE / ?ew_collide=0.
## THE HAIR SHADER + THE HAIR TEXTURES (2026-11-05, character-models-plan row 29e)
mondo: "why do so many of the hairstyles look like shit? They look like shiny rubber gloves. Are they missing textures or something?"
- **Textures:** bake-mpfb.py --hair-styles wrote the 70 pack styles with the diffuse cut to 512 px (HAIR_STYLE_PX; the packs ship
  1024-3600 px) and no normal map (30 styles ship one). `python3 -I bake-hair-tex.py --packs <unzipped mhpacks>` re-packs every
  charactercreation/hair/mh/*.glb with the pack's own diffuse at up to 1024 px (PNG, alpha) and its normal map (JPEG,
  material.normalTexture); mesh, UVs, extras untouched. 47 -> 95 MB on R2 (listed in ASSET_MANIFEST.json, so ?h= refetches them).
  buildHair keeps the loader's normalScale sign (was a fixed +0.6, the green ran the wrong way).
- **Material (three-renderer.js THE HAIR SHADER, hairMaterial + _ccHairHook):** a MeshPhysicalMaterial (CC_HAIR_LOOK: roughness 0.42,
  anisotropy 0.82, specularIntensity 0.38, highlight tinted 85 % to the hair colour) whose anisotropic highlight runs along each
  vertex's strand direction (from the crown, part.skull, leaning down; skinned with the hair so it follows the sway chains) instead
  of the UV tangent; alpha-to-coverage on the cards. The old MeshStandard 0.55 gave every style the same round plastic highlight and
  took the stage's lilac rim light as a sheen.
- **The flat shells:** Hair 05 / 06 / 11 / 12 / 13 / 14, Bobcut hair, Wavy bob (+ Anime hair at 0.7) are one sculpted mesh painted a
  flat colour with collapsed / overlapping UVs, so no texture can draw strands on them. sprites.js EW_HAIR_STYLES `strands: <depth>`
  draws strands in 3D from the bind-pose position round the crown (periodic value noise in the angle, 5 octaves, each faded where a
  pixel would alias it): darker gaps in the albedo + a bump across them. Add `strands` to any other style that reads as a helmet.
- Classic WebGL only (the creator stage's own renderer). The board / team room keep their Lambert copy (map only), unchanged.
- Debug: `window.EW_CC_DEBUG_UNLIT` still swaps hair to unlit. Probe: a page mounting EWCharViewer on a fixed div with
  `{appearance:{body:'mpfb_female', hair:<id>, model:'creator'}}`, frameCreator('face'), screenshot the stage (shots in
  /mnt/project-files/hair-look/).

## THE QUICK PICKS (2026-11-05)
mondo: "i click one item or piece of clothing and the game freezes and takes like 5 seconds to unfreeze". Measured in headless Chromium
(swiftshader, cowboy race look on mpfb_classic_male, EWCharViewer.mount + the same setCharacter the creator calls): every pick held ONE
5-6 s main-thread task, even for a garment already loaded. Causes (CPU profile) and fixes, all in three-renderer.js `_createAppearanceRig`:
- Spatial grids keyed by "x,y,z" strings (nearestBody / nearSet / spaceSmooth / THE LAYERS / THE HAIR UNDER THE HAT / coat fit ...):
  now one integer per cell (`_ccK`, same cells). Nearest-point searches walk the cells ring by ring and stop early (`_ccRings`), the hair
  under a hat skips points outside the hat's box. Same nearest every time.
- Every fit pass ran 2-3x per pick (setWear's apply, then rebuildGeometry, then again). `wearFits(part, strict, twice)`: apply defers
  (`part.fitLater` / `part.fitTwice`) to the rebuild / update. A NEW garment set still settles twice the cheap way (THE LAYERS once, the
  cords + hang + hides twice) because the old double run is what every look has always looked like: fingerprints of every garment /
  body / hair (positions, index, weights, normals, collision anchors) are IDENTICAL before vs after (cowboy male: coat, hair, boots,
  pendant picks; female body: coat, hair, Blender boots, pendant, cape), with THE JIGGLE off (it re-weights by timing).
- buildWear's per-garment fit (the _d_ offsets, THE CLASSIC FIT's averaged reshape, nearestBody / nearSet / spaceSmooth) is cached per
  rig + garment geometry (`part.wearPre`, 24 kept); the coat collar's nearSet runs on the collar vertices only.
- dropWear / dropHair disposed every material, freeing its shader program, so the next frame recompiled the same programs (1-2 s in
  WebGL; WebGPU pipelines too). Dropped materials are now kept (textures let go) - the last 48 - and disposed with the rig.
- A pack hair's first pick read its texture back off a GPU canvas (3 s): those canvases are `willReadFrequently`.
Before -> after on the same box (click to the piece on screen; longest frame): coat (cached) 5.6 s -> 0.9 s, boots (cached) 5.2 -> 0.9-1.2 s,
pendant (cached) 5.8 -> 1.1-1.5 s, hair (cached) 0.9 -> 0.3 s, new hair 4.4 -> 1.2-1.6 s, new boots 6.5 -> 1.3 s, new coat 7.8 -> 2.5-3 s
(download included). What is left is one body rebuild + one fit per pick. Probe (scratch only): Playwright, EWCharViewer.mount, a
`__rig` accessor patched into a copy, PerformanceObserver longtask + CDP Profiler.
