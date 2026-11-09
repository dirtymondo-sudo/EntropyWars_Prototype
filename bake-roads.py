# bake-roads.py — THE PACK ROADS (2026-11-09, mondo: "the only road in the editor is the messed up meshy road. Werent there some roads in
# some of the asset packs we have now?"). Cuts every piece of Elbolilloduro's free "Roads" pack (CC0, https://elbolilloduro.itch.io/roads-procedural,
# project files asset-packs/elbolilloduro/roads-procedural/Roads.rar) into its own GLB for R2 Assets/world/packs/elbolilloduro/roads/<name>.glb.
# Repo-only dev tooling, never loaded by the game. The rows that place them: data.js HQ_CATALOGUE_ROADS (palette group "Roads").
#
#   python3 -I bake-roads.py -- --blend <unpacked>/Roads/Models/Roads.blend --out <dir> [--json <sizes.json>]
#   (the bpy module: pip install bpy==5.2.3 in a venv; Blender 5 has no COLLADA importer, so the .blend is the source)
#
# The .blend points at the author's original texture names (Asphalt010_2K_Color.jpg ...) but the pack ships them renamed (T (1).jpg ...);
# the pack's Roads.dae names the renamed file per material, so each material's image node is re-pointed by the .dae's material -> effect ->
# image table. Each piece: its world transform applied, recentred (x / z centre 0, base on y = 0), the textures packed in, Y-up GLB.
# Kept: road.000-071 (straights, ramps, bends, junctions), Bridge.* (bridge spans), Sign.* (road signs). Skipped: the tree cards (the game
# has its own trees) and the stray "Dots Stroke" annotation.
import bpy, sys, os, re, json, urllib.parse
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return argv[argv.index(n) + 1] if n in argv else d
BLEND = arg('--blend'); OUT = arg('--out', '.'); JS = arg('--json')
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=BLEND)
MODELS = os.path.dirname(BLEND)

def relink():
    s = open(os.path.join(MODELS, 'Roads.dae'), encoding='utf8').read()
    imgs = dict(re.findall(r'<image id="([^"]+)"[^>]*>\s*<init_from>([^<]+)</init_from>', s))
    eff = {}
    for eid, body in re.findall(r'<effect id="([^"]+)">(.*?)</effect>', s, re.S):
        f = [imgs.get(x, x) for x in re.findall(r'<init_from>([^<]+)</init_from>', body)]
        if f: eff[eid] = urllib.parse.unquote(f[0])
    table = {name: eff.get(e) for _, name, e in re.findall(r'<material id="([^"]+)" name="([^"]+)">\s*<instance_effect url="#([^"]+)"', s)}
    for m in bpy.data.materials:
        f = table.get(m.name)
        if not f or not m.node_tree: continue
        p = os.path.join(MODELS, f)
        if not os.path.exists(p): print('MISSING texture', p); continue
        im = bpy.data.images.load(p, check_existing=True)
        for nd in m.node_tree.nodes:
            if nd.type == 'TEX_IMAGE': nd.image = im
relink()

KEEP = re.compile(r'^(road(\.\d+)?|Bridge(\.\d+)?|Sign(\.\d+)?)$')
pieces = [o for o in bpy.context.scene.objects if o.type == 'MESH' and KEEP.match(o.name)]
sizes = {}
for o in pieces:
    name = o.name.lower().replace('.', '_')
    if name in ('road', 'bridge', 'sign'): name += '_000'
    sc = bpy.data.scenes.new('cut_' + name)
    c = o.copy(); c.data = o.data.copy(); c.parent = None
    c.matrix_world = o.matrix_world.copy()
    sc.collection.objects.link(c)
    c.data.transform(c.matrix_world); c.matrix_world = Matrix.Identity(4)
    vs = [v.co for v in c.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    c.data.transform(Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))))
    win = bpy.context.window
    if win: win.scene = sc
    bpy.ops.object.select_all(action='DESELECT') if bpy.context.view_layer.objects.active else None
    path = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_active_scene=True, export_yup=True, export_apply=True,
                              export_image_format='AUTO', export_animations=False, export_cameras=False, export_lights=False)
    # glTF is Y-up: Blender X stays X (the length), Blender Y (across) becomes -Z, Blender Z (up) becomes Y
    sizes[name] = {'x': round(mx.x - mn.x, 2), 'z': round(mx.y - mn.y, 2), 'h': round(mx.z - mn.z, 2), 'src': o.name}
    print('wrote', path, sizes[name])
if JS: json.dump(sizes, open(JS, 'w'), indent=1)
