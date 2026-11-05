#!/usr/bin/env python3
"""bake-meshy.py - THE MESHY PIECES in the character creator (2026-11-03, docs/notes/character-models-plan.md row 16; repo-only tooling).

mondo 11-03: "now how do we put these models both in the character creator and in the game for spells". The Meshy list pieces
(plan section 4a #2-46 + 6b/6c #47-72, made by Claude through the Meshy API: /mnt/project-files/meshy/models/<num>_<name>.glb)
become creator picks the way his cowboy hat did (bake-clothes.py SOLIDS): each piece goes in AS MESHY MADE IT (its mesh, UVs and
texture; nothing generated), worn rigidly (one uniform scale + a turn + a move per body, no bending), fitted on each of the five
MPFB bodies and written as a pack-wear GLB in the compact layout (bake-clothes.py write_glb: POSITION = the male fit, _D_<BODY>
the other four's offsets), skinned 100 % to the bone it rides (limb pieces blend two bones across the joint they cover).

THE FIT (per body, in the body's bind pose; the skin = MPFB's body group as a BVH; a piece CLEARS the skin when every vertex
tested is at least `ease` outside it, read by the nearest skin point's face normal):
  hat      dropped onto the head from above until its outer shell (the vertices facing away from the skull centre, not the
           ones facing down: the inside of the crown, the brim's underside) touches: it rests on the skull like a real hat.
           Grown 4 % at a time while its band would sit below `line` (between the eyes 0 and the crown 1).
  float    held above the crown (the broken halo)
  head     a creature head (33-39): sized to the head, the MPFB head + whatever of the neck it covers hidden under it
           (ewWear.del = hm08 indices, ewWear.hideHead: the hair, the facial hair, the eye proxy go too)
  back / front / side
           a ray from behind / in front / the side finds the skin at the anchor; the piece comes in from there until it
           touches (backpacks, the quiver, the jetpack, the katana / badges, pendants, the walkie-talkie / the flare gun,
           the spyglass, the ears, the neck bolts)
  drop     lowered onto the shoulders until it touches (the pauldrons, the football shoulder pads, the Egyptian collar)
  ring     round the torso's vertical axis, grown from a little too small until its outer surface clears (belts, the
           breastplate)
  limb     round a limb (bone a -> bone b), its up axis to the limb, grown until it clears (greaves, the gauntlet, the arm
           band, the grapple gauntlet, the thigh holster)
  foot     stands on the floor round the ankle, grown until the shin clears (hoof, clawed foot); the foot's skin is hidden
  tail     comes in from behind at the tailbone until it touches; THE SWAY's spring chains run root -> tip (ewWear.sway)
  mermaid  the waist to the floor, the hips cleared; the legs + hips below the band are hidden; a spring chain down it
  hand     held in the right hand: the long axis across the palm (index side up), in front of the palm
Pairs (ears, neck bolts, pauldrons, gauntlets, greaves, hooves, clawed feet, moth wings) are fitted on the left and mirrored
(each half on its own side's bones) into ONE pick. #19 (Meshy made the two pauldrons as one piece, joined by a strap) is cut
at the middle and its left half used for both.

THE LOOK: Meshy's base colour (2 K PNG) as a 1024 / 512 JPEG; its metallic-roughness map averaged into the material's
factors. The creator tints any of them (THE WEAR TINT: the texture's grey levels x the picked colour) or keeps the colours.

Usage: pip install bpy==5.2.3 scipy ; git clone --depth 1 https://github.com/makehumancommunity/mpfb2 /tmp/mpfb2
       python3 -I bake-meshy.py --mpfb /tmp/mpfb2 [--src /mnt/project-files/meshy/models] [--only ewm_beret,...] [--views DIR]
Output: charactercreation/wear/ewm_<key>.glb (R2 Assets/characters/creator/wear/) + the EW_MH_WEAR rows to paste
(printed). --views writes a front / side / back sheet per piece on the five bodies. Notes: docs/notes/models-assets.md
"THE MESHY PIECES".
"""
import argparse, importlib.util, io, json, math, os, struct, sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_sp = importlib.util.spec_from_file_location('bake_clothes', os.path.join(HERE, 'bake-clothes.py'))
BC = importlib.util.module_from_spec(_sp)
_argv, sys.argv = sys.argv, [sys.argv[0]]
_sp.loader.exec_module(BC)            # (+ bake-garment.py as BC.PG, bake-mpfb.py as BC.bm)
sys.argv = _argv
PG, bm, bpy = BC.PG, BC.bm, BC.bpy
from mathutils import Vector  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402

TAU = 2 * math.pi
MALE_H = None          # the male body's height (sizes in metres are for him; each body scales them by its own height)


# ═══════════════════════════════ THE PIECES ═══════════════════════════════
# key: (Meshy file stem, label, creator category, z, fit spec). Categories: hats / heads (one each) and equipment / bodyparts
# (several at once; the creator's shelves place them, sprites.js EW_WEAR_SHELF_MOVE). rot = turns applied to the piece as Meshy
# made it (glTF +Z front -> the body's -Y front already), [axis, degrees] in order. size = metres along `dim` on the male.
P = {}
def piece(key, src, label, cat, z, **spec):
    P[key] = dict(src=src, label=label, cat=cat, z=z, **spec)


# ── on the head (hats + helmets: dropped on until the outer shell touches) ──
piece('tricorn', '03_pirate-tricorn', 'Pirate tricorn', 'hats', 56, mode='hat', k=2.3, line=0.30)
piece('officercap', '04_officer-cap', 'Officer cap', 'hats', 56, mode='hat', k=1.55, line=0.38)
piece('firehelmet', '05_firefighter-helmet', 'Firefighter helmet', 'hats', 56, mode='hat', k=2.05, line=0.20)
piece('footballhelmet', '07_football-helmet', 'Football helmet', 'hats', 56, mode='helm', k=1.5, top=0.10, yalign='back', gap=0.02)
piece('astrohelmet', '09_astronaut-helmet', 'Astronaut helmet', 'hats', 56, mode='helm', k=2.0, top=0.16, dy=0.01)
piece('royalcrown', '11_royal-crown', 'Royal crown', 'hats', 56, mode='helm', k=1.2, sink=0.34)
piece('icecrown', '12_ice-crown', 'Ice crown', 'hats', 56, mode='helm', k=1.18, sink=0.32)
piece('anunnakihat', '13_annunaki-headdress', 'Anunnaki headdress', 'hats', 56, mode='helm', k=1.2, sink=0.36)
piece('overlordhelm', '14_overlord-helmet', 'Overlord helmet', 'hats', 56, mode='helm', k=3.1, top=0.10, yalign='back', gap=0.02)
piece('mushroomcap', '15_mushroom-cap-hat', 'Mushroom cap', 'hats', 56, mode='helm', k=2.1, sink=0.66, rot=[['x', 22]])
piece('beret', '16_beret', 'Beret', 'hats', 56, mode='helm', k=1.3, sink=0.16, rot=[['x', -8]])
piece('strawhat', '17_straw-hat', 'Floppy straw hat', 'hats', 56, mode='hat', k=2.7, line=0.30)
piece('brokenhalo', '57_broken-halo', 'Broken halo', 'equipment', 60, mode='float', size=0.24, lift=0.07, rot=[['x', -12]], shelf='hats')

# ── creature heads (the MPFB head hidden under them) ──
piece('greyalien', '33_grey-alien-head', 'Grey alien head', 'heads', 58, mode='head', k=1.6, eye=(0.12, 0.62))
piece('jackalhead', '34_jackal-head', 'Jackal head', 'heads', 58, mode='head', k=1.75, eye=(0.30, 0.52))
piece('goathead', '35_goat-head', 'Goat head', 'heads', 58, mode='head', k=1.7, eye=(0.30, 0.74))
piece('eaglehead', '36_eagle-head', 'Eagle head', 'heads', 58, mode='head', k=1.4, eye=(0.33, 0.62))
piece('sharkhead', '37_shark-head', 'Shark head', 'heads', 58, mode='head', k=1.6, eye=(0.18, 0.74))
piece('lizardhead', '38_lizard-head', 'Lizard head', 'heads', 58, mode='head', k=1.45, eye=(0.30, 0.62))
piece('mothhead', '39_moth-head', 'Moth head', 'heads', 58, mode='head', k=1.7, eye=(0.08, 0.50))

# ── the chest (from in front until it touches) ──
piece('sheriffstar', '23_sheriff-star', 'Sheriff star', 'equipment', 61, mode='front', size=0.085, fx=0.45, fz=0.70, bone='spine_03', shelf='jewellery')
piece('policebadge', '24_police-badge', 'Police badge', 'equipment', 61, mode='front', size=0.085, fx=0.45, fz=0.70, bone='spine_03', shelf='jewellery')
piece('crosspendant', '28_cross-pendant', 'Cross pendant', 'equipment', 61, mode='front', size=0.11, fx=0.0, fz=0.62, bone='spine_03', shelf='jewellery')
piece('talisman', '67_talisman-pendant', 'Talisman pendant', 'equipment', 61, mode='front', size=0.085, fx=0.0, fz=0.66, bone='spine_03', shelf='jewellery')
piece('hagstone', '71_hagstone', 'Hagstone', 'equipment', 61, mode='front', size=0.06, fx=0.0, fz=0.68, bone='spine_03', shelf='jewellery')
piece('binoculars', '62_binoculars', 'Binoculars', 'equipment', 61, mode='front', size=0.17, fx=0.0, fz=0.48, bone='spine_03', rot=[['x', -90]])
piece('walkietalkie', '63_walkie-talkie', 'Walkie-talkie', 'equipment', 61, mode='front', size=0.17, fx=0.62, fz=0.86, bone='spine_03')
piece('egyptcollar', '22_egyptian-collar', 'Egyptian collar', 'equipment', 61, mode='drop', size=0.30, bone='spine_03', rot=[['x', -90]], cone=28, shelf='jewellery')

# ── the back (from behind until it touches) ──
piece('airtank', '06_firefighter-air-tank', 'Firefighter air tank', 'equipment', 62, mode='back', size=0.62, fz=0.55, bone='spine_03', rot=[['z', 180]], shelf='back')
piece('astropack', '10_astronaut-backpack', 'Astronaut backpack', 'equipment', 62, mode='back', size=0.62, fz=0.55, bone='spine_03', rot=[['z', 180]], shelf='back')
piece('backpack', '26_small-backpack', 'Small backpack', 'equipment', 62, mode='back', size=0.42, fz=0.55, bone='spine_03', rot=[['z', 180]], shelf='back')
piece('jetpack', '61_jetpack', 'Jetpack', 'equipment', 62, mode='back', size=0.62, fz=0.50, bone='spine_03', shelf='back')
piece('quiver', '25_quiver', 'Quiver', 'equipment', 62, mode='back', size=0.78, fz=0.55, bone='spine_03', rot=[['y', -12]], shelf='back')
piece('katana', '29_katana-back-sheath', 'Katana in a back sheath', 'equipment', 62, mode='back', size=1.0, fz=0.55, bone='spine_03', rot=[['y', 50]], shelf='back')
piece('dowsingrod', '72_dowsing-rod', 'Dowsing rod', 'equipment', 62, mode='back', size=0.45, fz=0.08, fx=-0.45, bone='pelvis', rot=[['y', 18]], shelf='back')
piece('dorsalfin', '42b_shark-dorsal-fin', 'Shark dorsal fin', 'bodyparts', 62, mode='back', size=0.30, fz=0.62, bone='spine_03', axes=('-z', '-x', 'y'), shelf='creature')
piece('mothwings', '40_moth-wing', 'Moth wings', 'bodyparts', 63, mode='back', size=0.62, fz=0.66, fx=0.18, bone='spine_03', mirror_src=True, rot=[['z', -18], ['y', -22]], at='inner', pair=True, shelf='wings')

# ── the hips + belt ──
piece('gunbelt', '02_gun-belt', 'Gun belt', 'equipment', 59, mode='ring', fz=-0.10, zat='top', k=1.0, bone='pelvis', rot=[['z', -80]], shelf='belts')
piece('toolbelt', '27_tool-belt', 'Tool belt', 'equipment', 59, mode='ring', fz=0.02, zat='top', k=1.0, bone='pelvis', shelf='belts')
piece('thighholster', '02b_thigh-holster', 'Thigh holster', 'equipment', 59, mode='limb', a='thigh_r', b='calf_r', t=0.38, kl=0.45, rot=[['z', -90]], face='out', shelf='belts')
piece('flaregun', '64_flare-gun', 'Flare gun (hip)', 'equipment', 60, mode='side', size=0.22, fz=-0.12, side='r', bone='pelvis', rot=[['z', 90], ['x', 95]])
piece('spyglass', '66_spyglass', 'Spyglass (hip)', 'equipment', 60, mode='side', size=0.34, fz=-0.10, side='l', bone='pelvis', rot=[['y', 60], ['z', 10]])
piece('wardtotem', '65_ward-totem', 'Ward totem (belt)', 'equipment', 60, mode='front', size=0.15, fx=0.62, fz=-0.16, bone='pelvis')
piece('censer', '68_censer', 'Censer (hip)', 'equipment', 60, mode='front', size=0.15, fx=-0.75, fz=-0.18, bone='pelvis')

# ── armour + limbs ──
piece('breastplate', '18_armor-breastplate', 'Armour breastplate', 'equipment', 64, mode='ring', fz=0.52, k=1.0, size=1.08, bone='spine_03', q=0.002, hide='cover', shelf='armour')
piece('shoulderpads', '08_football-shoulder-pads', 'Football shoulder pads', 'equipment', 65, mode='pads', size=1.10, bone='spine_03', shelf='armour')
piece('pauldrons', '19_armor-pauldron', 'Armour pauldrons', 'equipment', 65, mode='cap', size=0.24, bone='upperarm_l', split=True, pair=True, shelf='armour')
piece('gauntlets', '20_armor-gauntlet', 'Armour gauntlets', 'equipment', 63, mode='limb', a='hand_l', b='middle_03_l', t=0.05, kl=1.9, blend=('lowerarm_l', 'hand_l'), pair=True, face='thumb', shelf='armour')
piece('greaves', '21_armor-greave', 'Armour greaves', 'equipment', 63, mode='limb', a='calf_l', b='foot_l', t=0.48, kl=0.92, pair=True, face='front', shelf='armour')
piece('armband', '70_arm-band', 'Arm band', 'equipment', 63, mode='limb', a='upperarm_l', b='lowerarm_l', t=0.55, kl=0.20, face='front')
piece('grapplegauntlet', '69_grapple-gauntlet', 'Grapple gauntlet', 'equipment', 63, mode='limb', a='lowerarm_r', b='hand_r', t=0.55, kl=0.60, rot=[['y', 90]], face='out')

# ── creature parts ──
piece('elfears', '32_elf-ear', 'Elf ears', 'bodyparts', 57, mode='side', size=0.11, anchor='ear', bone='head', mirror_src=True, rot=[['z', 90]], pair=True, shelf='creature')
piece('neckbolts', '31_neck-bolt', 'Neck bolts', 'bodyparts', 57, mode='side', size=0.045, anchor='neck', bone='neck_01', rot=[['y', 90]], pair=True, shelf='creature')
piece('hooves', '45_hoof', 'Hooves', 'bodyparts', 47, mode='foot', size=0.24, pair=True, shelf='creature')
piece('beastfeet', '46_clawed-beast-foot', 'Clawed beast feet', 'bodyparts', 47, mode='foot', size=0.20, pair=True, shelf='creature')
piece('lizardtail', '41_lizard-tail', 'Lizard tail', 'bodyparts', 62, mode='tail', size=1.0, droop=38, chains=7)
piece('sharktail', '42a_shark-tail', 'Shark tail', 'bodyparts', 62, mode='tail', size=0.62, droop=20, rot=[['x', -90], ['y', 90]], chains=5)
# (2026-11-03, mondo: "the tail is visibly disconnected from his body ... the tail has a flat cut off"): the root narrowed + sunk deeper
piece('wolftail', '44_wolf-tail', 'Wolf tail', 'bodyparts', 62, mode='tail', size=0.55, droop=12, rot=[['z', 90]], chains=5, taper=(0.25, 0.22), sink=0.05)
# THE WEREWOLF FUR (2026-11-03, mondo: "retexture all three in meshy so they all have a consistent fur texture"): the same Meshy pieces
# wearing a Meshy Retexture base colour (meshy/retexture/werewolf/, the body's fur skin made with the same prompt), as their own picks
for _k, _v in (('A', 'werewolf fur'), ('B', 'werewolf fur, dark')):
    piece('wolftail_fur' + _k.lower(), '44_wolf-tail', 'Wolf tail, ' + _v, 'bodyparts', 62, mode='tail', size=0.55, droop=12, rot=[['z', 90]], chains=5,
          taper=(0.25, 0.22), sink=0.05, tex='../retexture/werewolf/tail%s_base.jpg' % _k)
    piece('beastfeet_fur' + _k.lower(), '46_clawed-beast-foot', 'Clawed beast feet, ' + _v, 'bodyparts', 47, mode='foot', size=0.20, pair=True,
          shelf='creature', tex='../retexture/werewolf/feet%s_base.jpg' % _k)
piece('mermaidtail', '43_mermaid-tail', 'Mermaid tail', 'bodyparts', 48, mode='mermaid')

# ── held in the right hand ──
piece('trident', '30_trident', 'Trident', 'equipment', 60, mode='hand', size=1.75, grip=0.42)
piece('potionflask', '47_potion-flask', 'Potion flask', 'equipment', 60, mode='hand', size=0.18, grip=0.5)
piece('scalpel', '48_scalpel', 'Scalpel', 'equipment', 60, mode='hand', size=0.16, grip=0.30, rot=[['y', -90]])
piece('wrench', '50_wrench', 'Wrench', 'equipment', 60, mode='hand', size=0.30, grip=0.35, rot=[['y', -90]])
piece('blowpipe', '51_blowpipe', 'Blowpipe', 'equipment', 60, mode='hand', size=1.0, grip=0.35, rot=[['y', -90]])
piece('smartphone', '52_smartphone', 'Smartphone', 'equipment', 60, mode='hand', size=0.15, grip=0.5)
piece('handmirror', '53_hand-mirror', 'Hand mirror', 'equipment', 60, mode='hand', size=0.28, grip=0.18)
piece('camera', '54_old-camera-flash', 'Old camera with flash', 'equipment', 60, mode='hand', size=0.26, grip=0.45)
piece('milkcookies', '55_milk-and-cookies', 'Milk and cookies', 'equipment', 60, mode='hand', size=0.24, grip=0.5, flat=True)
piece('cup', '56_drinking-cup', 'Drinking cup', 'equipment', 60, mode='hand', size=0.12, grip=0.5)
piece('magicwand', '59_magic-wand', 'Magic wand', 'equipment', 60, mode='hand', size=0.36, grip=0.20)
piece('wizardstaff', '60_wizard-staff', 'Wizard staff', 'equipment', 60, mode='hand', size=1.7, grip=0.50)


# ═══════════════════════════════ LOADING A MESHY GLB ═══════════════════════════════
def read_glb(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    g = json.loads(b[20:20 + jl]); binb = b[20 + jl + 8:]
    def view(vi):
        v = g['bufferViews'][vi]; o = v.get('byteOffset', 0); return binb[o:o + v['byteLength']]
    def acc(i):
        a = g['accessors'][i]; v = g['bufferViews'][a['bufferView']]
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        dt = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}[a['componentType']]
        o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        r = np.frombuffer(binb, dt, a['count'] * n, o)
        return r.reshape(-1, n) if n > 1 else r
    return g, acc, view


def load_meshy(path):
    """the piece in the body's frame (glTF Y up, +Z front -> Z up, -Y front), its texture, metal + roughness"""
    from PIL import Image
    g, acc, view = read_glb(path)
    Ps, Ns, UVs, Fs, off = [], [], [], [], 0
    mat = None
    for m in g['meshes']:
        for pr in m['primitives']:
            p = acc(pr['attributes']['POSITION']).astype(np.float64)
            n = acc(pr['attributes']['NORMAL']).astype(np.float64) if 'NORMAL' in pr['attributes'] else None
            uv = acc(pr['attributes']['TEXCOORD_0']).astype(np.float64)
            ix = acc(pr['indices']).astype(np.int64).reshape(-1, 3)
            Ps.append(p); Ns.append(n if n is not None else np.zeros_like(p)); UVs.append(uv); Fs.append(ix + off); off += len(p)
            if mat is None and 'material' in pr:
                mat = g['materials'][pr['material']]
    gl2b = lambda a: np.stack([a[:, 0], -a[:, 2], a[:, 1]], 1)
    Pp = gl2b(np.concatenate(Ps)); Nn = gl2b(np.concatenate(Ns)); UV = np.concatenate(UVs); F = np.concatenate(Fs)
    if not np.any(Nn):
        Nn = PG.vertex_normals(Pp, F)
    pbr = mat.get('pbrMetallicRoughness', {}) if mat else {}
    def image(ti):
        t = g['textures'][ti]; im = g['images'][t['source']]
        return Image.open(io.BytesIO(view(im['bufferView']))).convert('RGB')
    base = image(pbr['baseColorTexture']['index']) if 'baseColorTexture' in pbr else Image.new('RGB', (8, 8), (200, 200, 200))
    metal, rough = float(pbr.get('metallicFactor', 0.0)), float(pbr.get('roughnessFactor', 0.9))
    if 'metallicRoughnessTexture' in pbr:
        mr = np.asarray(image(pbr['metallicRoughnessTexture']['index']).resize((128, 128))).astype(np.float32) / 255.0
        rough *= float(mr[:, :, 1].mean()); metal *= float(mr[:, :, 2].mean())
    return dict(P=Pp, N=Nn / np.maximum(1e-9, np.linalg.norm(Nn, axis=1))[:, None], UV=UV, F=F, img=base,
                metal=round(min(0.8, metal), 3), rough=round(max(0.3, min(1.0, rough)), 3))


def rot_m(axis, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return {'x': np.array([[1, 0, 0], [0, c, -s], [0, s, c]]), 'y': np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]),
            'z': np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[axis]


def frame_to(u_from, v_from, u_to, v_to):
    """the turn taking the orthonormal pair (u_from, v_from) onto (u_to, v_to)"""
    def basis(u, v):
        u = u / np.linalg.norm(u); v = v - u * (v @ u); v /= np.linalg.norm(v); return np.stack([u, v, np.cross(u, v)], 1)
    return basis(u_to, v_to) @ basis(u_from, v_from).T


# ═══════════════════════════════ THE BODY ═══════════════════════════════
class Body:
    def __init__(self, name, f):
        self.name, self.f = name, f
        co, dom, inb, h = f['co'], f['dom'], f['inbody'], f['h']
        self.co, self.dom, self.inb, self.pts = co, dom, inb, f['pts']
        polys = [tuple(p.vertices) for p in h.data.polygons if all(inb[v] for v in p.vertices)]
        self.polys = polys
        self.bvh = BVHTree.FromPolygons([tuple(x) for x in co], polys)
        names = {g.index: g.name for g in h.vertex_groups}
        eye = [v.index for v in h.data.vertices if any(names[g.group] in ('helper-l-eye', 'helper-r-eye') and g.weight > 0.5 for g in v.groups)]
        self.eye_z = float(co[eye, 2].mean())
        Hm = np.array([inb[i] and dom[i] == 'head' for i in range(len(co))])
        self.H = co[Hm]
        self.crown = float(self.H[:, 2].max())
        self.height = float(co[inb, 2].max() - co[inb, 2].min())
        self.floor = float(co[inb, 2].min())
        S = self.H[np.abs(self.H[:, 2] - self.eye_z) < 0.01]
        self.head_y = 0.5 * (S[:, 1].min() + S[:, 1].max()) + 0.012     # (the skull's middle: a little behind the face's)
        self.chin = float(self.H[self.H[:, 1] < self.head_y - 0.02, 2].min())
        self.K, self.sx = f['K'], f['sx']
        self.scale = self.height / MALE_H if MALE_H else 1.0

    def dom_mask(self, names):
        return np.array([self.inb[i] and self.dom[i] in names for i in range(len(self.co))])

    def bvh_without(self, prefixes):
        """the skin without the parts whose bones start so (the hanging arms not in a breastplate's way, the head not in a collar's)"""
        key = tuple(prefixes)
        if not hasattr(self, '_bv'):
            self._bv = {}
        if key not in self._bv:
            ok = [not str(d).startswith(key) for d in self.dom]
            self._bv[key] = BVHTree.FromPolygons([tuple(x) for x in self.co], [p for p in self.polys if all(ok[v] for v in p)])
        return self._bv[key]

    def bvh_only(self, prefixes):
        key = ('only',) + tuple(prefixes)
        if not hasattr(self, '_bv'):
            self._bv = {}
        if key not in self._bv:
            ok = [str(d).startswith(tuple(prefixes)) for d in self.dom]
            self._bv[key] = BVHTree.FromPolygons([tuple(x) for x in self.co], [p for p in self.polys if all(ok[v] for v in p)])
        return self._bv[key]

    def trunk_bvh(self):
        return self.bvh_without(('upperarm', 'lowerarm', 'hand', 'thumb', 'index', 'middle', 'ring', 'pinky'))

    def clearance(self, Q, sel=None, bvh=None):
        """per point: its signed distance to the skin (+ outside)"""
        idx = range(len(Q)) if sel is None else sel
        out = np.full(len(Q), 9.0)
        bvh = bvh or self.bvh
        for i in idx:
            p = Vector(Q[i]); loc, n, _, d = bvh.find_nearest(p, 0.5)
            if loc is None:
                continue
            out[i] = d if (p - loc).dot(n) >= 0 else -d
        return out

    def ray(self, o, d):
        loc, n, _, _ = self.bvh.ray_cast(Vector(o), Vector(d), 3.0)
        return None if loc is None else np.array(loc)

    def slice_(self, z, mask=None, tol=0.008):
        C = self.co[self.inb if mask is None else mask]
        return C[np.abs(C[:, 2] - z) < tol]

    def z_at(self, fz):
        """fz: 0 = the waist, 1 = the neck base (below 0: down the hips)"""
        return self.K[2] + fz * (self.K[3] - self.K[2])


# ═══════════════════════════════ THE FIT ═══════════════════════════════
class Fit:
    """the piece's vertices (oriented, centred, unit-free) placed on one body: Q = s * R0 + t"""
    def __init__(self, R0, N0):
        self.R0, self.N0 = R0, N0

    def at(self, s, t):
        return self.R0 * s + t


def sub(idx, n=1600, seed=1):
    idx = np.asarray(idx)
    if len(idx) <= n:
        return idx
    return np.random.default_rng(seed).choice(idx, n, replace=False)


def first_contact(body, place, sel, ease, dmax, step=0.004, bvh=None):
    """moves d = 0..dmax (place(d) -> vertices) until the vertices `sel` come within ease of the skin; returns the last clear d"""
    prev = 0.0
    d = 0.0
    while d <= dmax:
        if body.clearance(place(d), sel, bvh)[sel].min() < ease:
            lo, hi = prev, d
            for _ in range(6):
                mid = 0.5 * (lo + hi)
                if body.clearance(place(mid), sel, bvh)[sel].min() < ease:
                    hi = mid
                else:
                    lo = mid
            return lo, True
        prev = d; d += step
    return dmax, False


def outward(Q, N, c, axis=None):
    """vertices facing away from c (a point) or from the line through c along axis"""
    D = Q - c
    if axis is not None:
        D = D - np.outer(D @ axis, axis)
    return np.nonzero(np.einsum('ij,ij->i', D, N) > 0)[0]


def fit_piece(spec, body, R0, N0, ext):
    """-> (Q vertices on this body, the bone weights per vertex, notes, normals)"""
    Q, W, note, *rest = _fit(spec, body, R0, N0)
    if len(rest) > 1 and rest[1]:          # (fitted on the left, worn on the right: the faces turned)
        spec['_flip'] = True
    return Q, W, note, (rest[0] if rest else N0)


def _fit(spec, body, R0, N0):
    mode = spec['mode']; ease = spec.get('ease', 0.006) * body.scale; sc = body.scale
    lo, hi = R0.min(0), R0.max(0); dims = hi - lo
    dm = dims.max() if spec.get('dim', 'max') == 'max' else dims['xyz'.index(spec['dim'])]
    bone = spec.get('bone')
    W = None
    hh = body.crown - body.chin
    if mode == 'float':
        s = spec['size'] * sc / dm
        Q = R0 * s; Q += np.array([0.0, body.head_y, body.crown + spec.get('lift', 0.06) * sc]) - np.array([0, 0, Q[:, 2].min()])
        return Q, [{'head': 1.0}] * len(Q), ''
    if mode == 'hat':
        line = body.eye_z + spec.get('line', 0.4) * (body.crown - body.eye_z)
        S = body.slice_(max(line, body.eye_z), body.dom_mask(('head',)), 0.006)
        hw = S[:, 0].max() - S[:, 0].min()
        c = np.array([0.0, body.head_y, body.eye_z])
        s = spec['k'] * hw / dims[0]
        cen = np.nonzero((np.abs(R0[:, 0]) < 0.3 * dims[0]) & (np.abs(R0[:, 1] - 0.5 * (lo[1] + hi[1])) < 0.3 * dims[1]))[0]
        for it in range(40):
            Q0 = R0 * s
            top = body.crown + 0.10 * sc - Q0[:, 2].min()
            base = np.array([0.0, body.head_y - 0.5 * (Q0[:, 1].min() + Q0[:, 1].max()) + spec.get('dy', 0.0) * sc, top])
            sel = outward(Q0 + base, N0, c)
            sel = sub(sel[N0[sel, 2] > -0.5])
            place = lambda d: Q0 + base - np.array([0, 0, d])
            d, hit = first_contact(body, place, sel, ease, 0.6 * sc)
            Q = place(d)
            rim = Q[cen, 2].min() if len(cen) else Q[:, 2].min()
            if rim >= line - 1e-4 or it == 39:
                break
            s *= spec.get('grow', 1.04)
        return Q, [{'head': 1.0}] * len(Q), 'scale %.3f rest %s' % (s, hit)
    if mode == 'helm':      # a helmet / a crown closed inside: sized to the head, its bottom `sink` head-heights under the crown
        S = body.slice_(body.eye_z + 0.3 * (body.crown - body.eye_z), body.dom_mask(('head',)), 0.006)
        hw = S[:, 0].max() - S[:, 0].min()
        s = spec['k'] * hw / dims[0]
        Hb = body.H[:, 1].max()
        hc = np.array([0.0, body.head_y, 0.5 * (body.crown + body.eye_z)])

        def put(s):
            Q = R0 * s
            if spec.get('yalign') == 'back':
                ty = Hb + spec.get('gap', 0.012) * sc - Q[:, 1].max()
            else:
                ty = body.head_y + spec.get('dy', 0.0) * sc - 0.5 * (Q[:, 1].min() + Q[:, 1].max())
            if 'top' in spec:
                tz = body.crown + spec['top'] * hh - Q[:, 2].max()
            else:
                tz = body.crown - spec.get('sink', 0.3) * hh - Q[:, 2].min()
            return Q + np.array([0.0, ty, tz])
        Q = put(s); it = 0
        if spec.get('grow'):           # a shell round the skull (its horns no guide to its size): grown until it clears the head
            for it in range(40):
                sel = outward(Q, N0, hc)
                sel = sub(sel[(Q[sel, 2] > body.eye_z) & (np.linalg.norm(Q[sel] - hc, axis=1) < 0.16 * sc)])
                if not len(sel) or np.quantile(body.clearance(Q, sel)[sel], 0.03) >= ease * 0.5:
                    break
                s *= 1.03; Q = put(s)
        return Q, [{'head': 1.0}] * len(Q), 'scale %.3f grown %d' % (s, it)
    if mode == 'head':
        s = spec['k'] * hh / dims[2]
        Q = R0 * s
        ey, ez = spec.get('eye', (0.15, 0.6))
        E = np.array([0.5 * (Q[:, 0].min() + Q[:, 0].max()), Q[:, 1].min() + ey * (Q[:, 1].max() - Q[:, 1].min()), Q[:, 2].min() + ez * (Q[:, 2].max() - Q[:, 2].min())])
        Hf = body.H[np.abs(body.H[:, 2] - body.eye_z) < 0.012]
        tgt = np.array([0.0, Hf[:, 1].min() + spec.get('dy', 0.015) * sc, body.eye_z + spec.get('dz', 0.0) * sc])
        Q = Q - E + tgt
        return Q, [{'head': 1.0}] * len(Q), 'scale %.3f' % s
    if mode in ('back', 'front'):
        s = spec['size'] * sc / dm
        Q0 = R0 * s
        x = spec.get('fx', 0.0) * body.sx
        z = body.z_at(spec.get('fz', 0.5))
        sgn = 1.0 if mode == 'back' else -1.0
        hitp = body.ray([x, sgn * 1.5, z], [0, -sgn, 0])
        y0 = hitp[1] if hitp is not None else 0.0
        at = spec.get('at', 'center')
        ax = 0.5 * (Q0[:, 0].min() + Q0[:, 0].max()) if at != 'inner' else Q0[:, 0].min()
        az = 0.5 * (Q0[:, 2].min() + Q0[:, 2].max())
        face = Q0[:, 1].min() if mode == 'back' else Q0[:, 1].max()
        start = np.array([x - ax, y0 - face + sgn * 0.12 * sc, z - az])
        place = lambda d: Q0 + start - np.array([0, sgn * d, 0])
        d, hit = first_contact(body, place, sub(np.arange(len(Q0))), ease if mode == 'back' else 0.002 * sc, 0.5 * sc)
        return place(d), [{bone: 1.0}] * len(Q0), 'scale %.3f touch %s' % (s, hit)
    if mode == 'side':
        s = spec['size'] * sc / dm
        Q0 = R0 * s
        if spec.get('anchor') == 'ear':
            Hd = body.H; z = body.eye_z - 0.025 * sc
            B = Hd[(np.abs(Hd[:, 2] - z) < 0.012) & (Hd[:, 0] > 0)]
            p = B[np.argmax(B[:, 0])]
            o = np.array(spec.get('off', (-0.006, 0.0, 0.012))) * sc
            Q = Q0 - 0.5 * (Q0.min(0) + Q0.max(0)) + p + o
            return Q, [{bone: 1.0}] * len(Q0), 'scale %.3f' % s
        if spec.get('anchor') == 'neck':
            z = 0.5 * (body.pts['neck_01'][2] + body.pts['head'][2])
            Nk = body.slice_(z, body.dom_mask(('neck_01',)), 0.01)
            y = 0.5 * (Nk[:, 1].min() + Nk[:, 1].max())
        else:
            z = body.z_at(spec.get('fz', 0.0))
            Sl = body.slice_(z, body.dom_mask(('pelvis', 'spine_01', 'thigh_l', 'thigh_r')), 0.01)
            y = 0.5 * (Sl[:, 1].min() + Sl[:, 1].max()) + spec.get('fy', 0.0) * sc
        hitp = body.ray([1.5, y, z], [-1, 0, 0])
        x0 = hitp[0] if hitp is not None else body.sx
        start = np.array([x0 - Q0[:, 0].min() + 0.1 * sc, y - 0.5 * (Q0[:, 1].min() + Q0[:, 1].max()), z - 0.5 * (Q0[:, 2].min() + Q0[:, 2].max())])
        place = lambda d: Q0 + start - np.array([d, 0, 0])
        d, hit = first_contact(body, place, sub(np.arange(len(Q0))), 0.002 * sc, 0.4 * sc)
        Q = place(d)
        if spec.get('side', 'l') == 'r':
            Q = Q * np.array([-1.0, 1.0, 1.0])
            return Q, [{bone: 1.0}] * len(Q0), 'scale %.3f touch %s' % (s, hit), N0 * np.array([-1.0, 1.0, 1.0]), True
        return Q, [{bone: 1.0}] * len(Q0), 'scale %.3f touch %s' % (s, hit)
    if mode == 'drop':      # a collar: round the neck first (grown until it clears the neck), then lowered onto the shoulders
        s = spec['size'] * sc / dm
        nz = body.pts['neck_01'][2] + 0.45 * (body.pts['head'][2] - body.pts['neck_01'][2])
        Nk = body.slice_(nz, body.dom_mask(('neck_01',)), 0.01)
        cxy = np.array([0.0, 0.5 * (Nk[:, 1].min() + Nk[:, 1].max())])
        allv = sub(np.arange(len(R0)))
        it = 0; rN = [N0]

        R0c, N0c = R0, N0
        if spec.get('cone'):          # a flat collar draped: sloped down from its hole over the shoulders
            t = np.tan(np.radians(spec['cone']))
            rr = np.linalg.norm(R0[:, :2], axis=1); r0 = np.quantile(rr, 0.02)
            rh = R0[:, :2] / np.maximum(1e-9, rr)[:, None]
            R0c = R0.copy(); R0c[:, 2] -= np.maximum(0, rr - r0) * t
            N0c = N0.copy(); N0c[:, :2] += rh * (N0[:, 2:3] * t); N0c /= np.linalg.norm(N0c, axis=1)[:, None]
        rN[0] = N0c

        def at(s):
            Q0 = R0c * s
            return Q0, np.array([cxy[0] - 0.5 * (Q0[:, 0].min() + Q0[:, 0].max()), cxy[1] - 0.5 * (Q0[:, 1].min() + Q0[:, 1].max()) + spec.get('dy', 0.0) * sc,
                                 nz + spec.get('up', 0.0) * sc - (Q0[:, 2].max() if spec.get('cone') else 0.5 * (Q0[:, 2].min() + Q0[:, 2].max()))])
        Q0, start = at(s)
        rx = 0.5 * (Nk[:, 0].max() - Nk[:, 0].min()) + ease; ry = 0.5 * (Nk[:, 1].max() - Nk[:, 1].min()) + ease
        for it in range(40):           # (its hole wider than the neck's oval)
            P = Q0 + start
            if (((P[:, 0] - cxy[0]) / rx) ** 2 + ((P[:, 1] - cxy[1]) / ry) ** 2).min() >= 1.0:
                break
            s *= 1.03; Q0, start = at(s)
        place = lambda d: Q0 + start - np.array([0, 0, d])
        d, hit = first_contact(body, place, allv, ease, 0.6 * sc, bvh=body.bvh_without(('head', 'neck')))
        return place(d), [{bone: 1.0}] * len(Q0), 'scale %.3f grown %d rest %s' % (s, it, hit), rN[0]
    if mode == 'cap':       # a pauldron: its dome over the shoulder joint (tilted half way down the arm), pushed out until clear
        a = body.pts['upperarm_l']; e = body.pts['lowerarm_l'] - a
        th = -0.5 * np.degrees(np.arctan2(e[0], -e[2]))
        Rt = rot_m('y', th)
        R1, N1 = R0 @ Rt.T, N0 @ Rt.T
        s = spec['size'] * sc / dm
        Q0 = R1 * s
        top = Q0[:, 2] > Q0[:, 2].max() - 0.35 * (Q0[:, 2].max() - Q0[:, 2].min())
        anc = np.array([Q0[top, 0].mean(), Q0[top, 1].mean(), Q0[:, 2].max() - spec.get('dome', 0.3) * (Q0[:, 2].max() - Q0[:, 2].min())])
        dr = np.array([np.cos(np.radians(spec.get('up', 50))), 0.0, np.sin(np.radians(spec.get('up', 50)))])
        sel = sub(outward(Q0 - anc + a, N1, a))
        bv = body.bvh_without(('head', 'neck'))
        d = 0.0
        while d < 0.3 * sc and np.quantile(body.clearance(Q0 - anc + a + dr * d, sel, bv)[sel], 0.03) < ease:
            d += 0.003 * sc
        return Q0 - anc + a + dr * d, [{bone: 1.0}] * len(Q0), 'scale %.3f tilt %.0f out %.3f' % (s, th, d), N1
    if mode == 'pads':      # shoulder pads: across the shoulders, the arch's top a little over the trapezius, as deep as the chest needs
        Sh = body.slice_(body.pts['upperarm_l'][2], None, 0.01)
        s = spec['size'] * (Sh[:, 0].max() - Sh[:, 0].min()) / dims[0]
        T = body.slice_(body.pts['spine_03'][2], body.dom_mask(('spine_03', 'spine_02', 'clavicle_l', 'clavicle_r')), 0.012)
        cy = 0.5 * (T[:, 1].min() + T[:, 1].max())
        tr = body.ray([0.11 * sc, cy, 3.0], [0, 0, -1]); zt = tr[2] if tr is not None else body.pts['neck_01'][2]
        bv = body.bvh_without(('head', 'neck'))      # (the arms kept: the sign test goes wrong next to a cut-away part's rim)
        sf = sb = s; it = 0          # (the front half and the back half each as deep as they need: a bust only pushes the front out)
        fr = R0[:, 1] < 0
        for it in range(60):
            Q = R0 * s
            Q[:, 1] = R0[:, 1] * np.where(fr, sf, sb)
            Q = Q + np.array([0.0, cy, zt + spec.get('top', 0.07) * sc - Q[:, 2].max()])
            sel = outward(Q, N0, np.array([0.0, cy, zt]), np.array([1.0, 0, 0]))
            zq = Q[:, 2].min() + 0.3 * (Q[:, 2].max() - Q[:, 2].min())
            sel = sub(sel[(np.abs(Q[sel, 0]) > 0.09 * sc) & (Q[sel, 2] > zq) & (N0[sel, 2] > -0.35)])  # (not round the neck hole, not the straps under the arms)
            cl = body.clearance(Q, sel, bv)
            bad_f = (cl[sel] < ease) & fr[sel]; bad_b = (cl[sel] < ease) & ~fr[sel]
            if bad_f.sum() <= 0.015 * len(sel) and bad_b.sum() <= 0.015 * len(sel):
                break
            if bad_f.sum() > 0.015 * len(sel):
                sf *= 1.03
            if bad_b.sum() > 0.015 * len(sel):
                sb *= 1.03
        Nn = N0 / np.stack([np.full(len(R0), s), np.where(fr, sf, sb), np.full(len(R0), s)], 1)
        Nn /= np.maximum(1e-9, np.linalg.norm(Nn, axis=1))[:, None]
        return Q, [{bone: 1.0}] * len(Q), 'scale %.3f deep front x%.2f back x%.2f' % (s, sf / s, sb / s), Nn
    if mode in ('ring', 'limb', 'foot', 'mermaid'):
        # a wrap: its length set, then widened (across the axis only) until its outer surface clears the skin; the faces
        # turned along the axis (a closed top / bottom, the cuffs' rims) are not tested
        if mode == 'ring':
            z = body.z_at(spec.get('fz', 0.0))
            T = body.slice_(z, body.dom_mask(('pelvis', 'spine_01', 'spine_02', 'spine_03', 'thigh_l', 'thigh_r')), 0.01)
            u = np.array([0, 0, -1.0]); Rm = np.eye(3)
            band = R0[R0[:, 2] > R0[:, 2].max() - 0.2 * dims[2]] if spec.get('zat') == 'top' else R0
            anc = np.array([0.5 * (band[:, 0].min() + band[:, 0].max()), 0.5 * (band[:, 1].min() + band[:, 1].max()), R0[:, 2].max() if spec.get('zat') == 'top' else 0.5 * (lo[2] + hi[2])])
            c = np.array([0.0, 0.5 * (T[:, 1].min() + T[:, 1].max()), z])
            if spec.get('size'):
                sL = spec['size'] * (body.K[3] - body.K[2]) / dims[2]
            else:
                sL = 0.85 * (T[:, 0].max() - T[:, 0].min()) / dims[0]
            sR = sL
            test_lo, test_hi = -9, 9
        elif mode == 'limb':
            a, b = body.pts[spec['a']], body.pts[spec['b']]
            L = np.linalg.norm(b - a); u = (b - a) / L
            side = 1.0 if spec['a'].endswith('_l') else -1.0
            face = spec.get('face', 'front')
            ref = (body.pts[spec['a'].replace('hand', 'thumb_02')] - a) if face == 'thumb' else np.array([side, 0.0, 0.0]) if face == 'out' else np.array([0.0, -1.0, 0.0])
            Rm = frame_to(np.array([0, 0, 1.0]), np.array([0, -1.0, 0]), -u, ref)
            Rr = R0 @ Rm.T
            ext = (Rr @ u).max() - (Rr @ u).min()
            sL = spec.get('kl', 1.0) * L / ext
            sR = sL * spec.get('kr', 0.6)
            c = a + spec.get('t', 0.5) * (b - a)
            anc = 0.5 * (Rr.max(0) + Rr.min(0)) @ Rm   # (in R0 coordinates)
            test_lo, test_hi = -9, 9
        elif mode == 'foot':
            ank = body.pts['foot_l']
            u = np.array([0, 0, -1.0]); Rm = np.eye(3)
            sL = spec['size'] * sc / dims[2]; sR = sL * 0.6
            topm = R0[:, 2] > hi[2] - 0.15 * dims[2]
            anc = np.array([R0[topm, 0].mean(), R0[topm, 1].mean(), lo[2]])
            c = np.array([ank[0], ank[1], body.floor])
            test_lo, test_hi = ank[2] + 0.02 * sc, 9
        else:
            u = np.array([0, 0, -1.0]); Rm = np.eye(3)
            sL = (body.K[2] + 0.02 * sc - body.floor) / dims[2]; sR = sL * 0.5
            T = body.slice_(body.pts['thigh_l'][2], body.dom_mask(('pelvis', 'thigh_l', 'thigh_r', 'spine_01')), 0.012)
            anc = np.array([0.5 * (lo[0] + hi[0]), 0.5 * (lo[1] + hi[1]), lo[2]])
            c = np.array([0.0, 0.5 * (T[:, 1].min() + T[:, 1].max()), body.floor])
            test_lo, test_hi = body.K[2] - 0.07 * sc, 9      # (the legs are hidden under it: only the waist band clears)
        Rr = (R0 - anc) @ Rm.T; Nr = N0 @ Rm.T
        al = Rr @ u; perp = Rr - np.outer(al, u)
        e1 = np.cross(u, [0, 1.0, 0]) if abs(u[1]) < 0.9 else np.cross(u, [1.0, 0, 0])
        e1 /= np.linalg.norm(e1); e2 = np.cross(u, e1)
        p1, p2 = perp @ e1, perp @ e2
        keep = np.abs(Nr @ u) < 0.6

        tb = body.trunk_bvh() if mode in ('ring', 'mermaid') else None

        def place(s1, s2, o1, o2):
            return c + np.outer(al * sL, u) + np.outer(p1 * s1 + o1, e1) + np.outer(p2 * s2 + o2, e2)

        def clear(s1, s2, o1, o2):
            Q = place(s1, s2, o1, o2)
            sel = outward(Q, Nr, c + o1 * e1 + o2 * e2, u)
            sel = sel[keep[sel] & (Q[sel, 2] > test_lo) & (Q[sel, 2] < test_hi)]
            sel = sub(sel)
            # (a few may stay under the skin: a greave's straps round the calf, a cuff's back edge - hidden there)
            return not len(sel) or np.quantile(body.clearance(Q, sel, tb)[sel], spec.get('q', 0.03)) >= ease * 0.6

        s1 = s2 = sR; o1 = o2 = 0.0
        for it in range(80):          # widened all round until clear ...
            if clear(s1, s2, o1, o2):
                break
            s1 *= 1.02; s2 *= 1.02
        # ... then each way across taken in (and the centre slid) while it stays clear: a belt is an oval, a greave sits on the shin
        st = 0.004 * sc; shrunk = 0
        for _ in range(60):
            moved = False
            for t1, t2, d1, d2 in ((0.98, 1, 0, 0), (1, 0.98, 0, 0), (0.98, 1, st, 0), (0.98, 1, -st, 0), (1, 0.98, 0, st), (1, 0.98, 0, -st)):
                n1, n2 = s1 * t1, s2 * t2
                if min(n1, n2) < 0.3 * sL:
                    continue
                if clear(n1, n2, o1 + d1, o2 + d2):
                    s1, s2, o1, o2 = n1, n2, o1 + d1, o2 + d2; moved = True; shrunk += 1
                    break
            if not moved:
                break
        Q = place(s1, s2, o1, o2); sR = 0.5 * (s1 + s2)
        note = 'scale %.3f x %.2f/%.2f grown %d shrunk %d' % (sL, s1 / sL, s2 / sL, it, shrunk)
        if mode == 'limb':
            bw = {spec.get('bone', spec['a']): 1.0}
            if spec.get('blend'):     # two bones across the joint: before the wrist -> the forearm, after -> the hand
                b0, b1 = spec['blend']; j = body.pts[b1]
                tt = np.clip(((Q - j) @ u) / (0.03 * sc) + 0.5, 0, 1)
                W = [{b0: float(1 - x), b1: float(x)} for x in tt]
            return Q, W or [bw] * len(Q), note, Nr
        if mode == 'foot':
            t = np.clip((Q[:, 2] - body.pts['foot_l'][2]) / (0.05 * sc) + 0.3, 0, 1)
            return Q, [{'calf_l': float(x), 'foot_l': float(1 - x)} for x in t], note
        if mode == 'mermaid':
            return Q, None, note
        return Q, [{bone: 1.0}] * len(Q), note
    if mode == 'tail':
        s = spec['size'] * sc / dm
        Q0 = R0 * s
        z = body.pts['pelvis'][2] + spec.get('dz', 0.02) * sc
        hitp = body.ray([0, 1.5, z], [0, -1, 0]); y0 = hitp[1] if hitp is not None else 0.1
        r = np.argmin(Q0[:, 1])
        near = Q0[np.linalg.norm(Q0 - Q0[r], axis=1) < 0.05 * sc]
        rc = near.mean(0)
        start = np.array([-rc[0], y0 - rc[1] + 0.10 * sc, z - rc[2]])
        place = lambda d: Q0 + start - np.array([0, d, 0])
        d, hit = first_contact(body, place, sub(np.arange(len(Q0))), ease, 0.4 * sc)
        Q = place(d) - np.array([0, spec.get('sink', 0.012) * sc, 0])   # (the root sunk into the skin: no gap at the base)
        return Q, None, 'scale %.3f touch %s' % (s, hit)
    if mode == 'hand':      # THE GRIP's seat (three-renderer.js _gripFrame): the handle down the knuckle line, in the closed palm
        W_, I_, P_ = body.pts['hand_r'], body.pts['index_01_r'], body.pts['pinky_01_r']
        K_ = 0.5 * (I_ + P_); f = K_ - W_; ln = np.linalg.norm(f); f /= ln
        t = I_ - P_; t = t - f * (t @ f); t /= np.linalg.norm(t)
        nrm = np.cross(t, f); nrm /= np.linalg.norm(nrm)
        seat = K_ + nrm * 0.3 * ln - f * 0.12 * ln
        s = spec['size'] * sc / dm
        # the piece: its long axis (Z) up the index side (t), its front (-Y) along the fingers (f)
        Rm = frame_to(np.array([0, 0, 1.0]), np.array([0, -1.0, 0]), t, f)
        Rr = R0 @ Rm.T
        al = Rr @ t; g = spec.get('grip', 0.5)
        gp = t * (al.min() + g * (al.max() - al.min()))
        Q = (Rr - gp) * s + seat
        return Q, [{'hand_r': 1.0}] * len(Q), 'scale %.3f' % s, N0 @ Rm.T
    raise ValueError(mode)


def hide_ranges(idx):
    rng = []
    for i in sorted(set(int(x) for x in idx)):
        if rng and rng[-1][1] == i - 1:
            rng[-1][1] = i
        else:
            rng.append([i, i])
    return rng


def hidden_for(spec, body, Q, F):
    """hm08 indices of the skin the piece takes the place of (creature heads, hooves, the mermaid tail, the elf ears)"""
    mode = spec['mode']; co, dom = body.co, body.dom
    out = []
    if mode == 'head':
        out = [i for i in range(len(co)) if dom[i] == 'head']
        bvh = BVHTree.FromPolygons([tuple(x) for x in Q], [tuple(int(v) for v in t) for t in F])
        for i in range(len(co)):
            if dom[i] == 'neck_01' and body.inb[i]:
                hit = 0
                for d in ((0, 0, 1), (1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0)):
                    hit += bvh.ray_cast(Vector(co[i]), Vector(d), 0.5)[0] is not None
                if hit == 5:
                    out.append(i)
    elif mode == 'foot':
        z = body.pts['foot_l'][2] + 0.01 * body.scale
        out = [i for i in range(len(co)) if dom[i] in ('foot_l', 'foot_r', 'ball_l', 'ball_r') and co[i, 2] < z + 0.03]
    elif mode == 'mermaid':
        out = [i for i in range(len(co)) if dom[i] in ('thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r', 'ball_l', 'ball_r')
               or (dom[i] in ('pelvis',) and co[i, 2] < body.K[2] - 0.02)]
    elif spec.get('hide') == 'cover':      # the skin inside a closed piece (a breastplate): rays four ways across all hit it
        bvh = BVHTree.FromPolygons([tuple(x) for x in Q], [tuple(int(v) for v in t) for t in F])
        z0, z1 = Q[:, 2].min(), Q[:, 2].max()
        for i in range(len(co)):
            if body.inb[i] and z0 < co[i, 2] < z1:
                if all(bvh.ray_cast(Vector(co[i]), Vector(d), 0.6)[0] is not None for d in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0))):
                    out.append(i)
    elif spec.get('hide') == 'ear':
        Hd = np.nonzero(np.array([body.inb[i] and dom[i] == 'head' for i in range(len(co))]))[0]
        C = co[Hd]
        for side in (1, -1):
            m = (np.abs(C[:, 2] - (body.eye_z - 0.02)) < 0.035) & (C[:, 0] * side > 0)
            if not m.any():
                continue
            xm = np.abs(C[m, 0]).max()
            sel = m & (np.abs(C[:, 0]) > xm - 0.016) & (C[:, 1] > body.head_y - 0.035)
            out += Hd[sel].tolist()
    return out


def mirror_pair(Q, F, W, N):
    """the left fit + its mirror (x -> -x, the faces turned, the _l bones -> _r)"""
    n = len(Q)
    Qm = Q * np.array([-1.0, 1.0, 1.0])
    Fm = F[:, ::-1] + n
    swap = lambda d: {(k[:-2] + '_r' if k.endswith('_l') else k[:-2] + '_l' if k.endswith('_r') else k): w for k, w in d.items()}
    return np.concatenate([Q, Qm]), np.concatenate([F, Fm]), W + [swap(w) for w in W], np.concatenate([N, N * np.array([-1.0, 1.0, 1.0])])


def tail_chains(Q, F, nj, parent):
    """THE SWAY on a tail: joints from the root to the tip (garment vertex indices), each vertex on its segment"""
    root = Q[np.argmin(Q[:, 1] - 0.0 * Q[:, 2])]
    return path_chains(Q, root, nj, parent)


def path_chains(Q, root, nj, parent):
    d = np.linalg.norm(Q - root, axis=1)
    qs = np.quantile(d, np.linspace(0.06, 0.98, nj))
    joints = []
    for q in qs:
        band = np.nonzero(np.abs(d - q) < 0.6 * (qs[1] - qs[0]))[0]
        cen = Q[band].mean(0)
        joints.append(int(band[np.argmin(np.linalg.norm(Q[band] - cen, axis=1))]))
    W = []
    for i in range(len(Q)):
        if d[i] < qs[0]:
            f = d[i] / qs[0]
            W.append({parent: float(1 - f), 'sw0_0': float(f)} if f > 0.02 else {parent: 1.0})
            continue
        seg = int(np.searchsorted(qs, d[i]) - 1); seg = max(0, min(nj - 2, seg))
        W.append({'sw0_%d' % seg: 1.0})
    return {'parent': parent, 'joints': [joints]}, W


# ═══════════════════════════════ BAKE ═══════════════════════════════
def orient(spec, mesh):
    Pp, Nn, F = mesh['P'].copy(), mesh['N'].copy(), mesh['F'].copy()
    if spec.get('split'):          # #19: the two pauldrons in one piece -> the left one (x > 0, the strap's middle cut away)
        w = Pp[:, 0].max() - Pp[:, 0].min()
        keep = Pp[:, 0] > 0.10 * w
        fk = keep[F].all(1)
        F = F[fk]
        used = np.unique(F); remap = -np.ones(len(Pp), int); remap[used] = np.arange(len(used))
        Pp, Nn, F = Pp[used], Nn[used], remap[F]
        mesh = dict(mesh, UV=mesh['UV'][used])
    if spec.get('mirror_src'):
        Pp[:, 0] *= -1; Nn[:, 0] *= -1; F = F[:, ::-1].copy()
    R = np.eye(3)
    if spec.get('axes'):           # where the piece's x, y, z go ('-z' = to -Z ...)
        R = np.zeros((3, 3))
        for i, t in enumerate(spec['axes']):
            R['xyz'.index(t[-1]), i] = -1.0 if t[0] == '-' else 1.0
    for ax, deg in spec.get('rot', []):
        R = rot_m(ax, deg) @ R
    if spec.get('droop'):          # a tail (its tip toward +Y, the back): the tip lowered
        R = rot_m('x', -spec['droop']) @ R
    Pp = Pp @ R.T; Nn = Nn @ R.T
    if spec.get('taper'):          # THE TAIL ROOT (2026-11-03): the flat cut end narrowed into the body
        Pp = taper_root(Pp, *spec['taper'])
    Pp -= 0.5 * (Pp.min(0) + Pp.max(0))
    return Pp, Nn, F, mesh['UV']


def taper_root(Pp, frac, k0):
    """a tail's root (its -Y end) narrowed toward its centre line: k0 x its width at the cut, full width `frac` of the length
    in (smoothstep), so a flat cut end grows out of the body instead of standing off it as a disc (mondo 11-03, the wolf tail)"""
    y = Pp[:, 1]; y0 = y.min(); L = y.max() - y0; Lz = frac * L
    edges = np.linspace(y0, y0 + 1.6 * Lz, 17); mids, cs = [], []
    for a, b in zip(edges[:-1], edges[1:]):
        m = (y >= a) & (y < b)
        if m.sum() >= 3:
            mids.append(0.5 * (a + b)); cs.append(Pp[m][:, [0, 2]].mean(0))
    mids = np.array(mids); cs = np.array(cs)
    cx = np.interp(y, mids, cs[:, 0]); cz = np.interp(y, mids, cs[:, 1])
    t = np.clip((y - y0) / Lz, 0, 1); f = k0 + (1 - k0) * t * t * (3 - 2 * t)
    Q = Pp.copy()
    Q[:, 0] = cx + (Pp[:, 0] - cx) * f
    Q[:, 2] = cz + (Pp[:, 2] - cz) * f
    return Q


def bake(key, spec, bodies, src, out, views=None):
    from PIL import Image
    mesh = load_meshy(os.path.join(src, spec['src'] + '.glb'))
    if spec.get('tex'):            # THE RETEXTURES (2026-11-03): a Meshy Retexture base colour (on the piece's own UVs) in place of its own
        mesh['img'] = Image.open(os.path.join(src, spec['tex'])).convert('RGB')
    R0, N0, F, UV = orient(spec, mesh)
    Ps, notes, W, dels, chains = {}, {}, None, {}, None
    for bname, body in bodies.items():
        Q, Wb, note, Nq = fit_piece(spec, body, R0, N0, None)
        Fb, Nb = (F[:, ::-1].copy() if spec.get('_flip') else F), Nq
        if spec.get('pair'):
            Q, Fb, Wb, Nb = mirror_pair(Q, F, Wb, Nq)
        Ps[bname] = Q; notes[bname] = note
        if bname == 'male':
            W, Fm, Nm = Wb, Fb, Nb
        hid = hidden_for(spec, body, Q, Fb)
        if hid:
            dels[bname] = hide_ranges(hid)
    if spec['mode'] == 'tail':
        chains, W = tail_chains(Ps['male'], Fm, spec.get('chains', 5), 'pelvis')
    elif spec['mode'] == 'mermaid':      # (rigid on the hips: chains inside the leg capsules would be pushed out of them)
        W = [{'pelvis': 1.0}] * len(Ps['male'])
    UVf = UV if not spec.get('pair') else np.concatenate([UV, UV])
    FUV = [[tuple(UVf[v]) for v in tri] for tri in Fm]
    # the texture: 1024 (512 for a small piece)
    small = spec.get('size', 1.0) < 0.2 and spec['mode'] not in ('hat', 'head', 'ring', 'limb', 'foot', 'mermaid', 'tail', 'drop')
    px = 512 if small else 1024
    im = mesh['img'].resize((px, px), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=88)
    name = 'ewm_' + key
    mats = [{'color': [1, 1, 1], 'rough': mesh['rough'], 'metal': mesh['metal'], 'tile': key}]
    wear = {'name': name, 'pack': 'entropywars', 'cat': spec['cat'], 'z': spec['z'], 'del': [], 'solid': True, 'meshy': spec['src'],
            'accents': [dict(color=[1, 1, 1], rough=mesh['rough'], metal=mesh['metal'])]}
    if dels:
        wear['delBy'] = dels
        wear['del'] = dels.get('male', [])
    if spec['mode'] == 'head':
        wear['hideHead'] = True
    if spec['mode'] == 'mermaid':
        wear['hideLegs'] = True
    if spec['mode'] == 'hand':           # (three-renderer.js wearGrip: the hand closes round it)
        wear['grip'] = 'RightHand'
    path = os.path.join(out, name + '.glb')
    keep_vn = PG.vertex_normals
    PG.vertex_normals = lambda V, Fx, _N=Nm: _N          # (Meshy's own normals, turned with the piece: no hard seams)
    try:
        ntri, bones = BC.write_glb(path, Ps, Fm, FUV, W, np.ones(len(Ps['male'])), [0] * len(Ps['male']), wear, [(key, buf.getvalue())], mats, chains)
    finally:
        PG.vertex_normals = keep_vn
    kb = os.path.getsize(path) // 1024
    print('[bake-meshy] %-26s %6d tris %5d KB  %s  bones %s  hide %s' % (name, ntri, kb, '; '.join('%s %s' % kv for kv in notes.items()), ','.join(bones),
          ' '.join('%s:%d' % (b, sum(r[1] - r[0] + 1 for r in d)) for b, d in dels.items()) or '-'), flush=True)
    if views:
        draw_views(views, key, bodies, Ps, Fm, UVf, mesh['img'], dels,
                   root=(np.argsort(R0[:, 1])[:max(20, len(R0) // 50)] if spec['mode'] == 'tail' else None))
    return {'id': name, 'label': spec['label'], 'cat': spec['cat'], 'z': spec['z'], 'shelf': spec.get('shelf'), 'tris': ntri, 'kb': kb}


# ═══════════════════════════════ VIEWS (a quick look: painter's triangles) ═══════════════════════════════
def draw_views(views, key, bodies, Ps, F, UV, img, dels=None, root=None):
    from PIL import Image, ImageDraw
    os.makedirs(views, exist_ok=True)
    T = np.asarray(img.resize((256, 256))).astype(np.float32)
    uvc = UV[F].mean(1); tx = (np.clip(uvc[:, 0], 0, 0.999) * 256).astype(int); ty = (np.clip(uvc[:, 1], 0, 0.999) * 256).astype(int)
    pcol = T[ty, tx]
    S = 300
    shots = [('male', 'front', 'full'), ('male', 'side', 'full'), ('male', 'back', 'full'), ('male', 'front', 'zoom'), ('male', 'side', 'zoom'),
             ('female', 'front', 'zoom'), ('heavy', 'front', 'zoom'), ('short', 'side', 'zoom'), ('thin', 'front', 'zoom')]
    if root is not None:   # a tail: where it meets the body, from the side + three-quarter behind, on every body
        shots = [('male', 'side', 'full'), ('male', 'side', 'root'), ('male', 'back3q', 'root'), ('heavy', 'side', 'root'), ('heavy', 'back3q', 'root'),
                 ('female', 'side', 'root'), ('female', 'back3q', 'root'), ('thin', 'back3q', 'root'), ('short', 'side', 'root')]
    sheet = Image.new('RGB', (S * 3, (S + 16) * 3), (16, 16, 16))
    dr0 = ImageDraw.Draw(sheet)
    for j, (bn, view, zm) in enumerate(shots):
        body = bodies[bn]; Q = Ps[bn]
        R = {'front': np.array([[1, 0, 0], [0, 0, 1], [0, 1, 0]]), 'back': np.array([[-1, 0, 0], [0, 0, 1], [0, -1, 0]]),
             'side': np.array([[0, 1, 0], [0, 0, 1], [-1, 0, 0]]),
             'back3q': np.array([[-0.7071, 0.7071, 0], [0, 0, 1], [-0.7071, -0.7071, 0]])}[view]   # -> (screen x, screen up, depth toward the viewer = -)
        bt = []
        for p in body.polys:
            for k in range(1, len(p) - 1):
                bt.append((p[0], p[k], p[k + 1]))
        bt = np.array(bt)
        if dels and dels.get(bn):
            hid = np.zeros(len(body.co), bool)
            for r0, r1 in dels[bn]:
                hid[r0:r1 + 1] = True
            bt = bt[~hid[bt].any(1)]
        V = np.concatenate([body.co, Q]); nb = len(body.co)
        tris = np.concatenate([bt, F + nb])
        cols = np.concatenate([np.tile([175, 160, 150], (len(bt), 1)), pcol])
        X = V @ R.T
        if zm == 'root':
            c = Q[root].mean(0) @ R.T; half = 0.13 * body.scale
        elif zm == 'zoom':
            c = Q.mean(0) @ R.T; half = max(0.22 * body.scale, 0.6 * np.abs(Q @ R.T - c)[:, :2].max())
        else:
            c = np.array([0, 0.5 * (body.floor + body.crown + 0.15), 0]) @ R.T * 0 + np.array([0, 0.5 * (body.floor + body.crown), 0])
            half = 1.05
        sx_ = (X[:, 0] - c[0]) / half * S / 2 + S / 2; sy_ = S / 2 - (X[:, 1] - c[1]) / half * S / 2
        tri = X[tris]; n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]); n /= np.maximum(1e-12, np.linalg.norm(n, axis=1))[:, None]
        sh = 0.4 + 0.6 * np.abs(n @ np.array([0.3, 0.5, -0.8]) / np.linalg.norm([0.3, 0.5, -0.8]))
        col = (cols * sh[:, None]).clip(0, 255).astype(int)
        depth = X[tris][:, :, 2].mean(1)
        order = np.argsort(-depth)
        im = Image.new('RGB', (S, S), (44, 48, 58)); d = ImageDraw.Draw(im)
        for k in order:
            a, b, cc = tris[k]
            pts = [(sx_[a], sy_[a]), (sx_[b], sy_[b]), (sx_[cc], sy_[cc])]
            if max(p[0] for p in pts) < 0 or min(p[0] for p in pts) > S or max(p[1] for p in pts) < 0 or min(p[1] for p in pts) > S:
                continue
            d.polygon(pts, fill=tuple(col[k]))
        gx, gy = (j % 3) * S, (j // 3) * (S + 16)
        sheet.paste(im, (gx, gy + 16))
        dr0.text((gx + 4, gy + 2), '%s %s %s' % (bn, view, zm) + ('   ' + key if j == 0 else ''), fill=(255, 255, 0))
    sheet.save(os.path.join(views, key + '.jpg'), quality=82)


def main():
    global MALE_H
    ap = argparse.ArgumentParser()
    ap.add_argument('--mpfb', required=True)
    ap.add_argument('--src', default='/mnt/project-files/meshy/models')
    ap.add_argument('--out', default=os.path.join(HERE, 'charactercreation', 'wear'))
    ap.add_argument('--only', default='')
    ap.add_argument('--views', default='')
    a = ap.parse_args()
    PG.M_ = bm.install_mpfb(a.mpfb)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = {b: PG.body_frame(PG.make_human(b)) for b in bm.WEAR_BODIES}
    f = frames['male']; MALE_H = float(f['co'][f['inbody'], 2].max() - f['co'][f['inbody'], 2].min())
    bodies = {b: Body(b, fr) for b, fr in frames.items()}
    os.makedirs(a.out, exist_ok=True)
    only = set(x.replace('ewm_', '') for x in a.only.split(',') if x)
    rows = []
    for key, spec in P.items():
        if only and key not in only:
            continue
        try:
            rows.append(bake(key, spec, bodies, a.src, a.out, a.views or None))
        except Exception as e:  # noqa: BLE001
            import traceback; traceback.print_exc()
            print('[bake-meshy] FAILED', key, e, flush=True)
    print(json.dumps(rows, indent=1))


if __name__ == '__main__':
    main()
