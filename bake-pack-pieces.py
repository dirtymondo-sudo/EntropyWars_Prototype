# bake-pack-pieces.py — THE MESHY SWAP (2026-11-03): cuts single props out of Elbolilloduro PSX pack scenes into small GLBs
# for R2 Assets/misc/ (ebd_<pack>_<item>.glb). Repo-only dev tooling, never loaded by the game. Notes: docs/notes/models-assets.md
# "THE MESHY SWAP"; the list of swaps: MODEL_LIST.md 10F.
#
#   blender -b -P bake-pack-pieces.py -- --packs <dir with the unzipped packs, one folder per itch slug> --out <dir> [--only key,key]
#
# Each job keeps the named scene nodes (+ their children), bakes their world transforms, recentres the piece (x/z centre 0,
# base on y = 0), turns it `rotz` degrees about up so its front faces the way the Meshy model it replaces faced, packs every
# texture it can find in the pack folder (the FBXs point at the author's C:/ paths), drops the FBX's fake alpha links
# (an all-opaque texture wired to Alpha exports as BLEND), makes Glass/Vidrio 35 % see-through, and writes a Y-up GLB.
# Packs (all CC0): https://elbolilloduro.itch.io/<slug>
import bpy, sys, json, os
from mathutils import Vector, Matrix
argv = sys.argv[sys.argv.index('--') + 1:]
def arg(n, d=None): return argv[argv.index(n) + 1] if n in argv else d
PACKS = arg('--packs'); OUT = arg('--out', '.'); ONLY = set((arg('--only') or '').split(',')) - {''}
F = {
    'pizzeria':      'pizzeria-psx/Pizzeria/Models/Pizzeria_Props.fbx',
    'diner':         'diner/DINER/Models/Objects.fbx',
    'trailerpark':   'trailer-park/Trailer_Park/Models/Trailer_Park_Props.fbx',
    '6twelve':       '6twelve/6twelve/Models/6twelve.fbx',
    'psx3':          'paquete-de-modelos-psx-3/Electronics_kitchen/Models/Electronics_kitchen.fbx',
    'laundry':       'laundry/Laundry/Models/Laundry_Props.fbx',
    'house':         'house/House/Models/House.fbx',
    'vhsshop':       'vhs-shop/VHS_Shop/Models/Shop_VHS.fbx',
    'busstop':       'bus-stop/Bus_stop/Models/Props/Props.fbx',
    'survival':      'survival-psx/Survival/Models/Survival.fbx',
    'vegetation':    'vegetation/Vegetation/Models/Vegetation.fbx',
    'housesonwater': 'houses-on-the-water/Houses_on_the_water/Models/houses_on_the_water.fbx',
    'mine':          'mine/Minas/Models/Mines.fbx',
    'burgerpiz':     'burgerpiz/BurgerPiz/Models/BurgerPiz.fbx',
}
# (catalogue key, pack, scene nodes, rotz degrees)
JOBS = [
    ('cash_register', 'pizzeria', ['cash_register'], -90), ('dumpster', 'diner', ['Dumpster', 'Dumpster_D', 'Dumpster_D_01'], 0),
    ('trash_bin', 'trailerpark', ['trash_can_metal', 'trash_can_metal_top'], 0), ('city_bin', '6twelve', ['trash_can'], 0),
    ('fire_extinguisher', '6twelve', ['extinguisher'], -90), ('coffee_maker', 'psx3', ['Coffee_maker', 'Coffee_maker_cup'], 180),
    ('microwave', 'psx3', ['Microwave_01'], 180), ('water_cooler', 'laundry', ['Water_dispenser'], -90), ('mop', 'house', ['Mop_01'], 0),
    ('tube_tv', 'trailerpark', ['TV'], 90), ('retro_radio', 'trailerpark', ['Radio'], 90), ('rotary_phone', 'vhsshop', ['Telefono'], 45),
    ('wall_clock', 'trailerpark', ['Clock'], 90), ('filing_cabinet', 'laundry', ['Archivists'], -90), ('bus_shelter', 'busstop', ['Bus_stop'], 0),
    ('campfire', 'survival', ['bonfire'], 0), ('camping_tent', 'survival', ['Shelter_tent'], -90), ('lantern', 'survival', ['Farol_G'], 0),
    ('fallen_log', 'vegetation', ['Trunk'], 90), ('stump', 'vegetation', ['Trunk.001'], 0), ('rowboat', 'housesonwater', ['Boat_01'], 0),
    ('locker', 'mine', ['Locker'], 180), ('vending_machine', 'laundry', ['Vending_machine'], -90), ('sink', 'burgerpiz', ['Washbasin.003'], -90),
    ('table_lamp', 'trailerpark', ['Lamp'], 0), ('desk_lamp', 'house', ['Lamp_01'], 0),
]
jobs = []
for k, p, nodes, rz in JOBS:
    if ONLY and k not in ONLY: continue
    jobs.append({'file': os.path.join(PACKS, F[p]), 'search': os.path.join(PACKS, F[p].split('/')[0]), 'out': os.path.join(OUT, 'ebd_%s_%s.glb' % (p, k)), 'nodes': nodes, 'rotz': rz})
byfile = {}
for j in jobs: byfile.setdefault(j['file'], []).append(j)
def load(f):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=f)
TMP = os.path.join(OUT, '_scene.blend')
for f,js in byfile.items():
    load(f)
    srch=js[0].get('search') or os.path.dirname(os.path.dirname(f))
    idx={}
    for r,ds,fs in os.walk(srch):
        for fn in fs: idx.setdefault(fn.lower(),os.path.join(r,fn))
    for im in bpy.data.images:
        if im.source!='FILE' or im.packed_file: continue
        p=bpy.path.abspath(im.filepath)
        if os.path.exists(p): continue
        bn=os.path.basename(p.replace('\\','/')).lower()
        cand=idx.get(bn) or idx.get(bn+'.png') or idx.get(bn+'.jpg') or idx.get(os.path.splitext(bn)[0]+'.png') or idx.get(os.path.splitext(bn)[0]+'.jpg')
        if cand: im.filepath=cand
        else: print('UNRESOLVED',im.name,bn)
    for im in bpy.data.images:
        if im.source=='FILE' and not im.packed_file:
            try: im.pack()
            except Exception as ex: print('NOPACK',im.name,im.filepath)
    base_state=bpy.data.filepath
    tmp=TMP; bpy.ops.wm.save_as_mainfile(filepath=tmp)
    for j in js:
        bpy.ops.wm.open_mainfile(filepath=tmp)
        keep=set()
        for n in j['nodes']:
            o=bpy.data.objects.get(n)
            if not o: print('MISSING NODE',n,'in',f); continue
            keep.add(o); keep.update(o.children_recursive)
        if not keep: continue
        for o in list(bpy.data.objects):
            if o not in keep: bpy.data.objects.remove(o,do_unlink=True)
        # bake world transforms into meshes, flatten hierarchy
        meshes=[o for o in bpy.data.objects if o.type=='MESH']
        for o in list(bpy.data.objects):
            if o.type!='MESH': bpy.data.objects.remove(o,do_unlink=True)
        for o in meshes:
            mw=o.matrix_world.copy(); o.parent=None; o.matrix_world=mw
        bpy.ops.object.select_all(action='DESELECT')
        for o in meshes: o.select_set(True)
        bpy.context.view_layer.objects.active=meshes[0]
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        pts=[v.co for o in meshes for v in o.data.vertices]
        mn=Vector((min(p.x for p in pts),min(p.y for p in pts),min(p.z for p in pts)));mx=Vector((max(p.x for p in pts),max(p.y for p in pts),max(p.z for p in pts)))
        off=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
        rz=j.get('rotz',0)
        R=Matrix.Rotation(rz*3.14159265/180,4,'Z')
        for o in meshes: o.data.transform(R@Matrix.Translation(-off))
        if len(meshes)>1 and j.get('join',True):
            bpy.ops.object.join()
        for mat in bpy.data.materials:
            if not mat.use_nodes: continue
            nt=mat.node_tree; bsdf=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
            if not bsdf: continue
            ain=bsdf.inputs['Alpha']; glass=any(w in mat.name.lower() for w in ('glass','vidrio','cristal'))
            if ain.is_linked:
                src=ain.links[0].from_node; img=getattr(src,'image',None); mina=1.0
                if img is not None and len(img.pixels)>=4:
                    px=img.pixels[:]; mina=min(px[3::4])
                if mina>0.95:
                    nt.links.remove(ain.links[0]); ain.default_value=1.0; mat.blend_method='OPAQUE'
                else:
                    mat.blend_method='CLIP'; mat.alpha_threshold=0.5
                print('ALPHA',mat.name,round(mina,2),mat.blend_method)
            elif glass:
                ain.default_value=0.35; mat.blend_method='BLEND'; print('GLASS',mat.name)
            else:
                mat.blend_method='OPAQUE'
        tris=sum(len(p.vertices)-2 for o in bpy.data.objects if o.type=='MESH' for p in o.data.polygons)
        os.makedirs(os.path.dirname(j['out']),exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=j['out'],export_format='GLB',use_selection=False,export_apply=True,export_yup=True,export_image_format='AUTO',export_materials='EXPORT',export_animations=False,export_skins=False)
        d=mx-mn
        print('OUT',j['out'],'dims_m',round(d.x,2),round(d.y,2),round(d.z,2),'tris',tris)

for t in (TMP, TMP + '1'):
    if os.path.exists(t): os.remove(t)
