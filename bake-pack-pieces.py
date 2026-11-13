# bake-pack-pieces.py — THE MESHY SWAP (2026-11-03): cuts single props out of Elbolilloduro PSX pack scenes into small GLBs
# for R2 Assets/world/packs/elbolilloduro/ (ebd_<pack>_<item>.glb). Repo-only dev tooling, never loaded by the game. Notes: docs/notes/models-assets.md
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
    'gasstation':    'gas-station/Gas_station/Models/Gas_station_Props.fbx',
    'buildings':     'buildings/Buildings/Models/Buildings.fbx',
    'trailerscene':  'trailer-park/Trailer_Park/Models/Trailer_Park.fbx',
    'abandonedhouse': 'abandoned-house/Abandoned_House/Models/Abandoned_House.fbx',
    'tacos':         'tacos/Tacos/Models/Tacos.fbx',
    'metro':         'metro/Metro_PSX/Models/Metro.fbx',
    'dinerscene':    'diner/DINER/Models/DINER.fbx',
    'pizzeriascene': 'pizzeria-psx/Pizzeria/Models/Pizzeria_Scene.fbx',
    'gasscene':      'gas-station/Gas_station/Models/Gas_station.fbx',
    'laundryscene':  'laundry/Laundry/Models/Laundry.fbx',
    'quequis':       'quequis-house/Quequis_House/Models/Quequis_House.fbx',
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
    # THE CODED SHAPES OUT (2026-11-03, round 2): the washroom + kitchen procs (their code is deleted)
    ('hand_dryer', 'diner', ['Hand_dryer'], 0), ('range_hood', 'diner', ['cooker_hood'], 0), ('kitchen_range', 'diner', ['Stove'], 0),
    ('sink_row', 'diner', ['Washbasin'], 180), ('urinal', 'burgerpiz', ['urinary.001'], 90),
    ('toilet_stall', 'gasstation', ['Toilet_cubicles_002', 'Toilet_cubicles', 'Toilet_cubicles_Door_001', 'Sanitary_014', 'Sanitary_015'], 0),
    ('shower_stall', 'house', ['Shower', 'Shower_Door', 'Glass_Shower', 'Glass_Shower_02'], -90),
    # THE PACK BUILDINGS (2026-11-03, mondo: "incorporate those into the game like in disaster city and the map editor"): the ten
    # photo-textured shop blocks of the Buildings pack, each its own GLB, the shop front at +Z (data.js HQ_PACK_BUILDINGS)
] + [('bld_%02d' % i, 'buildings', ['Building' if i == 0 else 'Building_%02d' % i], 0) for i in range(10)]
# THE TOWN RIM's TRAILERS (2026-11-03, mondo OK'd: Area 51 + Skinwalker Ranch's far houses = the Trailer Park scene's trailers, each placed
# on its own): the scene is flat (no groups), so a job's node may be a REGION — {'near': the trailer's shell, 'pad': metres, 'keep': a
# name regex} keeps every object whose middle stands inside that shell's footprint (+ pad) and whose name matches: the outside only
# (shell, porch railing, window frames + glass, door, AC unit, antenna, steps, fuse box), never the furniture. The door side (-X) turns to +Z.
TRAILER_KEEP = r'^(Home|railing|Frame_Windows|Mesh|Frame_Door|Door|Door_Mesh|air-conditioning|Antenna|ladders|Fuse_box)'
# THE HAUNTED HOUSE's TOWN RIM (2026-11-03, same OK): the Abandoned House pack's house from the OUTSIDE — its shell alone (`Casa!` = the
# node without its 69 children: the furniture, the cobwebs, the lamps), its windows, the balcony, the porch posts + rails. The basement
# hung 3.5 m under the yard's ground: `cut` 2.5 drops all of it but the last 1 m (the room sinks that 1 m: DOOR_HQ.catalogue
# abandoned_house `hover: -1`; the rim's `sink`), so a slope never shows stilts. Its front (the porch on its short side, +X in the file) turns to +Z.
JOBS += [('house', 'abandonedhouse', ['Casa!', 'Ventanas', 'm', 'Columnas', 'Barandal', 'Barandal.003'], -90, {'cut': 2.5})]
JOBS += [('trailer_%d' % i, 'trailerscene', [{'near': 'Home' if i == 0 else 'Home_%02d' % i, 'pad': 1.2, 'keep': TRAILER_KEEP}], 90) for i in range(6)]
# THE MESHY AUDIT (2026-11-04, mondo: "You are supposed to document every single model and try to not use meshy models"): the
# MODEL_LIST §10A stand-ins whose pack piece was named in 11-03's decor list (status `pack: …`) but never wired. Each proc WEARS its
# piece (three-renderer.js _HQ_PACK_WEAR, Assets/world/packs/elbolilloduro/ebd_…), so its light / glow / collision stay. Front at +Z like the procs.
AUDIT = [
    ('metal_shelving', 'gasstation', ['Shelf_Metal'], 0), ('washer', 'house', ['Washing_machine', 'Washing_machine_d'], -90),
    ('dryer', 'abandonedhouse', ['Secadora'], 0), ('broom', 'house', ['Broom'], 0), ('toilet_paper', 'house', ['Toilet_paper'], 0),
    ('chalkboard', 'vhsshop', ['Blackboard'], 180), ('roller_shutter', 'tacos', ['doors_garage'], 0), ('bare_bulb', 'abandonedhouse', ['Foco'], 0),
    ('turnstile', 'metro', ['automatic_ticket_gate'], 0), ('wall_shelf', 'house', ['Shelf_01'], 90), ('concrete_pillar', 'metro', ['Column'], 0),
    ('steel_table', 'dinerscene', ['Table_Metal'], 90),
]
ROT = json.loads(arg('--rot') or '{}')   # {key: degrees} overrides while fitting the fronts
JOBS += [(k, p, n, ROT.get(k, r)) for (k, p, n, r) in AUDIT]
# THE CITY'S WHOLE BUILDINGS (2026-11-13, mondo: "Isnt there a pizza resturaunt and or gast station asset pack we downlaoded? Those
# definitely need to be buildings somewhere"): each pack scene's building from the OUTSIDE (its shell, doors, windows, signs; never the
# furniture or the stock), at true size, its entrance side at +Z — data.js HQ_PACK_BUILDINGS `city_*`. A region may be a `box`
# [x0, x1, y0, y1] in the scene's metres in place of `near` (the gas station: the store, the canopy, the pumps, the price sign).
# Who places which: docs/disaster-city/pack-claims.md.
JOBS += [
    ('city_pizzeria', 'pizzeriascene', [{'near': 'building_01.001', 'pad': 1.0, 'keep': r'^(building_01\.00[12]$|Door(\.001)?$|Glass$|Decorative_Sign)'}], -90),
    ('city_gas_store', 'gasscene', [{'box': [-4, 27, 12, 31], 'keep': r'^(6twelve|Bathrooms|Door(_\d+)?$|Frame|Glass|Window_frame|ICE|Toilets_Sing|spotlight)'}], 0),
    ('city_gas_canopy', 'gasscene', [{'box': [-7, 19, -14, 6], 'keep': r'^(Pillar|Fuel_pump|The_ceiling|Lamp|Sidewalk)'}], 0),
    ('city_gas_sign', 'gasscene', [{'box': [-12, -7, -19, -14], 'keep': r'^6twelve_Sign'}], 0),
    ('city_diner', 'dinerscene', [{'near': 'DINER', 'pad': 1.5, 'keep': r'^(DINER$|Entry|Sing_DINER|Sign|Door(_\d+)?$|Door_frame|Glass|Window_frame)'}], 0, {'cut': 2.3}),
    ('city_burgerpiz', 'burgerpiz', [{'near': 'BurgerPiz', 'pad': 2.5, 'keep': r'^(BurgerPiz|RooftilesMetal|L$|Windows|Door_F|Door$|Door_01$|Wall_W)'}], -90),
    ('city_6twelve', '6twelve', [{'near': '6twelve', 'pad': 1.0, 'keep': r'^(6twelve|Glasses|Door(_0[12])?$|Door_frame|Sign)'}], 0, {'cut': 0.6}),
    ('city_taco_stand', 'tacos', [{'near': 'Taco_stand', 'pad': 1.5, 'keep': r'^(Taco_stand|Taco|Tacos)'}], 180),
    ('city_laundry', 'laundryscene', [{'near': 'Laundry_building', 'pad': 1.0, 'keep': r'^(Laundry_building|Sign_Laundry|Door$|DoorsWood|Glass|Window_frame|frame_door)'}], -90),
    ('city_vhs_shop', 'vhsshop', [{'near': 'Shop_VHS', 'pad': 0.5, 'keep': r'^(Shop_VHS$|Shop_VHS\._Windows|Door$|Frame_Door)'}], 180, {'cut': 3.6}),
    ('city_house', 'house', ['House'], 0),
    ('city_quequis_house', 'quequis', [{'near': 'Quequis_House', 'pad': 1.0, 'keep': r'^(Quequis_House|Frame$|Cube$|RooftilesMetal|Door_Q|Door_0[12]$|Frame_Door)'}], 180),
]
# THE CITY TRAFFIC (2026-11-13, mondo: "traffic lights and intersections ... Bus sections placed in each district with a bus route"): the
# Pizzeria pack's mast-arm signal (its three lit faces look -X, +Z and -Z in the GLB, the blank one +X: three-renderer.js _HQ_SIGNAL), the
# Bus stop pack's city bus with its four tyres and its four door leaves joined on (nose at -X, doors on its right) and its stop sign.
JOBS += [
    ('street_signal', 'pizzeria', ['traffic_light'], 0),
    ('transit_bus', 'busstop', ['Bus', 'Tire', 'Tire_01', 'Tire_02', 'Tire_03', 'Cube.038', 'Cube.039', 'Cube.040', 'Cube.041'], 0),
    ('bus_stop_sign', 'busstop', ['Bus_stop_sign'], 0),
]
jobs = []
for J in JOBS:
    k, p, nodes, rz = J[:4]
    if ONLY and k not in ONLY: continue
    jobs.append(dict({'file': os.path.join(PACKS, F[p]), 'search': os.path.join(PACKS, F[p].split('/')[0]), 'out': os.path.join(OUT, 'ebd_%s_%s.glb' % (p, k)), 'nodes': nodes, 'rotz': rz}, **(J[4] if len(J) > 4 else {})))
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
            if isinstance(n,dict):   # a REGION (THE TOWN RIM's TRAILERS): every matching object whose middle is inside the near node's footprint
                import re
                rx=re.compile(n['keep'])
                if n.get('box'): x0,x1,y0,y1=n['box']   # THE CITY'S WHOLE BUILDINGS: a plain box in the scene's metres
                else:
                    ref=bpy.data.objects.get(n['near'])
                    if not ref: print('MISSING NODE',n['near'],'in',f); continue
                    rp=[ref.matrix_world@v.co for v in ref.data.vertices]; pad=n.get('pad',1.0)
                    x0=min(p.x for p in rp)-pad; x1=max(p.x for p in rp)+pad; y0=min(p.y for p in rp)-pad; y1=max(p.y for p in rp)+pad
                for o in bpy.data.objects:
                    if o.type!='MESH' or not rx.search(o.name): continue
                    c=sum((o.matrix_world@v.co for v in o.data.vertices),Vector())/max(1,len(o.data.vertices))
                    if x0<=c.x<=x1 and y0<=c.y<=y1: keep.add(o); keep.update(o.children_recursive)
                continue
            alone=n.endswith('!')   # `name!` = that node without its children
            o=bpy.data.objects.get(n.rstrip('!'))
            if not o: print('MISSING NODE',n,'in',f); continue
            keep.add(o)
            if not alone: keep.update(o.children_recursive)
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
        if j.get('cut'):
            # `cut` (m over the base): everything under it goes (bisect, inner side cleared, the cut left open: it is under the ground)
            import bmesh
            for o in meshes:
                bm=bmesh.new(); bm.from_mesh(o.data)
                bmesh.ops.bisect_plane(bm,geom=bm.verts[:]+bm.edges[:]+bm.faces[:],plane_co=(0,0,j['cut']),plane_no=(0,0,1),clear_inner=True)
                bm.to_mesh(o.data); bm.free()
            meshes=[o for o in meshes if len(o.data.vertices)]
            for o in list(bpy.data.objects):
                if o.type=='MESH' and o not in meshes: bpy.data.objects.remove(o,do_unlink=True)
            for o in meshes: o.data.transform(Matrix.Translation((0,0,-j['cut'])))
            pts=[v.co for o in meshes for v in o.data.vertices]
            mn=Vector((min(p.x for p in pts),min(p.y for p in pts),min(p.z for p in pts)));mx=Vector((max(p.x for p in pts),max(p.y for p in pts),max(p.z for p in pts)))
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
        print('OUT',j['out'],'dims_m',round(d.x,2),round(d.y,2),round(d.z,2),'tris',tris,'rotz',rz)

for t in (TMP, TMP + '1'):
    if os.path.exists(t): os.remove(t)
