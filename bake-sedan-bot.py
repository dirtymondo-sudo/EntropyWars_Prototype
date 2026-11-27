#!/usr/bin/env python3
"""THE SEDAN BOT (2026-11-27): Meshy sedan + robot core + interior + steering wheel -> one GLB the game transforms.
Run: python3 -I bake-sedan-bot.py <models dir> <out.glb> [--shots <prefix>] [--unit <prefix>]      (needs `pip install bpy`)
In : <models dir>/sedan_car.glb, sedan_interior.glb, steering_wheel.glb, robot_core_rigged.glb, robot_core_walking.glb, robot_core_running.glb
Out: nodes  p_<part>  a car panel, its origin on its hinge, standing in car mode
            o_<part>  the same panel swung open on its hinge (an empty)
            r_<part>  the same panel on the robot, a child of the bone that carries it (an empty)
            p_interior, p_swheel, seat_driver (an empty at the driver's hips), Armature + char1 (the core, clips walk / run)
Bake frame (Blender): metres, nose -Y, up Z, the car's left +X, ground z = 0. Exported: nose +Z, up Y.
Meshy makes one closed shell a model: the sedan is CUT here into panels by planes, the glass is found by its place and colour
(material `ew_glass`, the game makes it see-through). Notes: docs/notes/door-gun-skate-vehicles.md "THE SEDAN BOT"."""
import bpy, bmesh, sys, math, os
from mathutils import Matrix, Vector

A = [a for a in sys.argv[1:] if not a.startswith('-')]
SRC, OUT = A[0], A[1]
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
UNIT = sys.argv[sys.argv.index('--unit') + 1] if '--unit' in sys.argv else None      # also write <UNIT>_car.glb (the panels as a car, no bones) + <UNIT>_robot.glb (the core with the panels skinned to its bones: a unit the shared animation library moves)
K = 1.45                                   # the core's scale: 3.2 m rigged -> 4.64 m
WH = {'wheelFL': (1, -1.37), 'wheelFR': (-1, -1.37), 'wheelRL': (1, 1.17), 'wheelRR': (-1, 1.17)}
WZ, WR, WX = 0.31, 0.335, 0.80
def T(x, y, z): return Matrix.Translation((x, y, z))
def R(ax, deg): return Matrix.Rotation(math.radians(deg), 4, ax)
def about(p, m): return T(*p) @ m @ T(-p[0], -p[1], -p[2])
def imp(name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, name))
    return [o for o in bpy.data.objects if o not in before]
def bake_xf(o, M):
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.data.transform(M); o.data.update()
    if M.determinant() < 0: o.data.flip_normals()

# ---------------------------------------------------------------- the cut
def side_x(z): return 0.74 - (min(max(z, 0.97), 1.36) - 0.97) * 0.50
def part_of(c, n):
    x, y, z = c; ax = abs(x); s = 'L' if x > 0 else 'R'
    for k, (sx, wy) in WH.items():
        if x * sx > 0.50 and (y - wy) ** 2 + (z - WZ) ** 2 < WR * WR: return k
    if y < -1.85: return 'floor' if (z < 0.22 and n.z < -0.5) else 'chest'
    if y < -1.02:
        if z < 0.22 and n.z < -0.3: return 'floor'
        if ax > 0.74: return 'fender' + s
        return 'chest' if z > 0.55 else 'floor'
    if y < 1.0:
        if z > 0.97:
            if z < 1.36 and ax > side_x(z):
                if -0.80 < y < 0.95: return ('doorF' if y < 0.17 else 'doorR') + s
                return ('fender' if y < 0 else 'leg') + s
            return 'roof'
        if z < 0.25 or ax < 0.5: return 'floor'
        if y < -0.78: return 'fender' + s
        if y < 0.17: return 'doorF' + s
        if y < 0.92: return 'doorR' + s
        return 'leg' + s
    if z > 1.0 and y < 1.56 and ax < 0.62: return 'roof'
    if z < 0.25 and n.z < -0.3 and ax < 0.5: return 'floor'
    return 'leg' + s
PLANES = [((0, y, 0), (0, 1, 0)) for y in (-1.85, -1.02, -0.78, 0.17, 0.92, 1.0, 1.56)] + \
         [((0, 0, z), (0, 0, 1)) for z in (0.25, 0.97, 1.36)] + \
         [((x, 0, 0), (1, 0, 0)) for x in (0, 0.74, -0.74, 0.62, -0.62)] + \
         [((0.74, 0, 0.97), (1, 0, 0.5)), ((-0.74, 0, 0.97), (-1, 0, 0.5))]
def is_glass(part, c):
    # by place only: Meshy paints reflections on its glass, and its flat panes are a few big triangles (PLANES cut them on these lines)
    x, y, z = c
    if part == 'roof': return (y < -0.40 or y > 1.06) and z < 1.405 and abs(x) < 0.66 - max(0, z - 1.0) * 0.28   # the windscreen + the rear glass
    if part.startswith('door'):
        if z < 0.975 or 0.10 < y < 0.26: return False                                   # (the B pillar stays)
        return (y + 0.73) * 0.40 - (z - 0.97) * 0.43 > 0.02 and (1.10 - y) * 0.39 - (z - 0.97) * 0.27 > 0.02   # behind the A pillar's line, before the C pillar's
    return False
PLANES += [((0, y, 0), (0, 1, 0)) for y in (-0.40, 1.06, 0.10, 0.26)] + \
          [((0.66, 0, 1.0), (1, 0, 0.28)), ((-0.66, 0, 1.0), (-1, 0, 0.28)),
           ((0, -0.73 + 0.05, 0.97), (0, 0.40, -0.43)), ((0, 1.10 - 0.051, 0.97), (0, -0.39, -0.27))]

bpy.ops.wm.read_factory_settings(use_empty=True)
car = [o for o in imp('sedan_car.glb') if o.type == 'MESH'][0]
S = 4.5 / 1.903
bake_xf(car, T(0, 0, 0.308 * S) @ R('Z', 90) @ Matrix.Scale(S, 4))
bm = bmesh.new(); bm.from_mesh(car.data)
for co, no in PLANES:
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=co, plane_no=Vector(no).normalized())
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.to_mesh(car.data); bm.free()
mat = car.data.materials[0]; mat.name = 'ew_sedan_paint'
glass = mat.copy(); glass.name = 'ew_glass'; car.data.materials.append(glass)
bsdf = next(n for n in glass.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); bsdf.inputs['Alpha'].default_value = 0.3
groups = {}
for f in car.data.polygons:
    c = f.center; k = part_of(c, f.normal)
    if is_glass(k, c): f.material_index = 1
    groups.setdefault(k, []).append(f.index)
parts = {}
for name, idx in groups.items():
    p = car.copy(); p.data = car.data.copy(); p.name = 'p_' + name; bpy.context.scene.collection.objects.link(p)
    b = bmesh.new(); b.from_mesh(p.data); keep = set(idx)
    bmesh.ops.delete(b, geom=[f for f in b.faces if f.index not in keep], context='FACES'); b.to_mesh(p.data); b.free()
    parts[name] = p

# ---------------------------------------------------------------- the plates: DOOR (mondo 11-27), a white plate with raised dark letters, on the car's own skin
from mathutils.bvhtree import BVHTree
def flat(name, rgb, rough=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = 0
    return m
M_PLATE, M_INK = flat('ew_plate', (0.90, 0.90, 0.86), 0.45), flat('ew_plate_ink', (0.02, 0.05, 0.22), 0.35)
M_PFRAME, M_PBOLT, M_PTAG = flat('ew_plate_frame', (0.025, 0.025, 0.03), 0.55), flat('ew_plate_bolt', (0.62, 0.63, 0.65), 0.3), flat('ew_plate_tag', (0.72, 0.08, 0.06), 0.5)
_bvh = BVHTree.FromObject(car, bpy.context.evaluated_depsgraph_get())
# THE PLATE, REMADE (mondo 11-27: "looks really bad ... add more details ... cover up the original one fully"). A long plate, PW x PH: the plate
# Meshy painted between the tail lamps measures 0.655 x 0.16 at z 0.775 (ortho render, 1 mm a pixel), so 0.70 x 0.205 hides all of it.
# Built facing local -Y: a dark raised frame, the pale face sunk inside it, a ruled line, a navy band with a small door on it, DOOR pressed out
# thick, DISASTER CITY small over it, two bolt heads, a year tag. Six small materials; no texture.
PW, PH = 0.70, 0.22
def _box(w, d, h, cx, cy, cz, mat, bev=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.active_object; o.data.transform(T(cx, cy, cz) @ Matrix.Diagonal((w, d, h, 1)))
    if bev:
        m = o.modifiers.new('b', 'BEVEL'); m.width = bev; m.segments = 2; bpy.ops.object.modifier_apply(modifier='b')
    o.data.materials.append(mat); return o
def _text(body, size, ext, cx, cy, cz, mat, bold=0.0, space=1.0):
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = body; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.size = size; cu.extrude = ext; cu.space_character = space; cu.offset = bold
    cu.bevel_depth = min(0.0012, ext * 0.4); cu.bevel_resolution = 1
    to = bpy.data.objects.new('t', cu); bpy.context.scene.collection.objects.link(to); bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(to.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(to)
    tx = bpy.data.objects.new('tm', me); bpy.context.scene.collection.objects.link(tx); me.transform(T(cx, cy, cz) @ R('X', 90)); me.materials.append(mat); return tx
def plate(tag, z, sy):
    hit, nrm, _, _ = _bvh.ray_cast(Vector((0, sy * 4, z)), Vector((0, -sy, 0)))
    n = Vector((0, nrm.y, nrm.z)).normalized(); n = n if n.y * sy > 0 else Vector((0, sy, 0))
    right = Vector((0, 0, 1)).cross(n).normalized(); up = n.cross(right)
    M = Matrix((( right.x, -n.x, up.x, hit.x + n.x * 0.012), (right.y, -n.y, up.y, hit.y + n.y * 0.012), (right.z, -n.z, up.z, hit.z + n.z * 0.012), (0, 0, 0, 1)))
    fw, band = 0.017, 0.072                                         # the frame's width; the navy band at the left
    cxT = band / 2                                                  # the lettering's middle (the band pushes it right)
    bits = [_box(PW - 0.004, 0.016, PH - 0.004, 0, 0.002, 0, M_PLATE)]                                   # the face, sunk
    for sx in (-1, 1): bits.append(_box(fw, 0.026, PH, sx * (PW - fw) / 2, -0.001, 0, M_PFRAME, 0.004))  # the frame: four raised bars
    for sz in (-1, 1): bits.append(_box(PW, 0.026, fw, 0, -0.001, sz * (PH - fw) / 2, M_PFRAME, 0.004))
    iw, ih = PW - 2 * fw - 0.014, PH - 2 * fw - 0.014                                                   # the ruled line inside the frame
    for sx in (-1, 1): bits.append(_box(0.0035, 0.004, ih, sx * iw / 2, -0.007, 0, M_INK))
    for sz in (-1, 1): bits.append(_box(iw, 0.004, 0.0035, 0, -0.007, sz * ih / 2, M_INK))
    bx = -PW / 2 + fw + band / 2
    bits.append(_box(band, 0.004, PH - 2 * fw, bx, -0.0065, 0, M_INK))                                   # the band
    bits.append(_box(0.030, 0.004, 0.058, bx, -0.0095, -0.006, M_PLATE, 0.001))                          # a small door on it
    bits.append(_box(0.022, 0.003, 0.021, bx, -0.0115, 0.008, M_INK)); bits.append(_box(0.022, 0.003, 0.021, bx, -0.0115, -0.020, M_INK))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0032, segments=8, ring_count=5, location=(bx + 0.010, -0.012, -0.006)); k = bpy.context.active_object; k.data.materials.append(M_PBOLT); bits.append(k)
    bits.append(_text('DOOR', 0.118, 0.0055, cxT, -0.006, -0.017, M_INK, bold=0.0035, space=1.16))       # the word, pressed out
    bits.append(_text('DISASTER CITY', 0.021, 0.002, cxT, -0.006, 0.058, M_INK, bold=0.0006, space=1.25))
    for sx in (-1, 1):                                                                                   # two bolt heads, a washer under each
        bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.0115, depth=0.004, location=(cxT + sx * 0.205, -0.008, 0.058), rotation=(math.radians(90), 0, 0)); w = bpy.context.active_object; w.data.materials.append(M_PFRAME); bits.append(w)
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.0078, depth=0.008, location=(cxT + sx * 0.205, -0.012, 0.058), rotation=(math.radians(90), 0, 0)); w = bpy.context.active_object; w.data.materials.append(M_PBOLT); bits.append(w)
    bits.append(_box(0.036, 0.003, 0.028, PW / 2 - fw - 0.030, -0.0065, -0.058, M_PTAG))                 # the year tag
    bpy.ops.object.select_all(action='DESELECT')
    for o in bits: o.select_set(True)
    pl = bits[0]; bpy.context.view_layer.objects.active = pl; bpy.ops.object.join()
    pl.data.transform(M); pl.name = 'p_' + tag
    print('PLATE', tag, [round(v, 3) for v in hit], [round(v, 2) for v in n])
    return pl, hit + n * 0.012
pf, _ = plate('plateF', 0.45, -1)
bpy.ops.object.select_all(action='DESELECT'); pf.select_set(True); parts['chest'].select_set(True); bpy.context.view_layer.objects.active = parts['chest']; bpy.ops.object.join()
pr, PLATE_R = plate('plate', 0.782, 1); parts['plate'] = pr      # (over the plate Meshy painted between the tail lamps)
bpy.data.objects.remove(car)

# ---------------------------------------------------------------- the interior + the steering wheel
it = [o for o in imp('sedan_interior.glb') if o.type == 'MESH'][0]
bake_xf(it, T(0, 0.05, 0.20 + 0.358 * 1.33) @ Matrix.Diagonal((1.18, 1.156, 1.33, 1)) @ R('Z', 90))   # (the dash at the nose, its dials on the driver's side; -90 stood it back to front)
it.data.materials[0].name = 'ew_sedan_interior'; parts['interior'] = it; it.name = 'p_interior'
sw = [o for o in imp('steering_wheel.glb') if o.type == 'MESH'][0]
SWP = (0.37, -0.52, 0.93)
bake_xf(sw, T(*SWP) @ R('X', -22) @ R('Z', 180) @ Matrix.Scale(0.2, 4))
sw.data.materials[0].name = 'ew_sedan_swheel'; parts['swheel'] = sw; sw.name = 'p_swheel'

# ---------------------------------------------------------------- hinges (car frame) + the robot layout (core frame = car frame)
MIR = Matrix.Diagonal((-1, 1, 1, 1))
PIV = {'chest': (0, -1.02, 0.95), 'roof': (0, 1.5, 1.0), 'floor': (0, 0, 0.2), 'interior': (0, 0, 0.3), 'swheel': SWP,
       'doorFL': (0.86, -0.78, 0.6), 'doorRL': (0.86, 0.17, 0.6), 'fenderL': (0.80, -1.37, 0.31), 'legL': (0.45, 1.0, 0.3),
       'wheelFL': (WX, -1.37, WZ), 'wheelRL': (WX, 1.17, WZ), 'plate': tuple(PLATE_R)}
OPEN = {'chest': about(PIV['chest'], R('X', -38)), 'roof': about(PIV['roof'], R('X', -28)) @ T(0, 0, 0.05), 'floor': Matrix(),
        'interior': Matrix(), 'swheel': Matrix(), 'plate': Matrix(),
        'doorFL': about(PIV['doorFL'], R('Z', -68)), 'doorRL': about(PIV['doorRL'], R('Z', -62)),
        'fenderL': T(0.28, -0.05, 0.1), 'wheelFL': T(0.28, -0.05, 0.1), 'legL': T(0.16, 0.3, 0), 'wheelRL': T(0.16, 0.3, 0)}
SH = T(1.02, 0.05, 3.95) @ R('Y', -18) @ T(-0.80, 1.37, -0.31)
LG = T(-0.04, 0.0, 0.05) @ R('Z', 180) @ T(0, -1.72, 0)          # the car's right rear half turns round onto the LEFT shin: the tail lamps face front
ROBOT = {'chest': ('Spine', T(0, -0.34, 4.02) @ R('X', 56) @ T(0, 1.02, -0.95)),
         'roof': ('Spine01', T(0, -0.72, 3.15) @ R('X', -90)),
         'floor': ('Spine01', T(0, -0.34, 3.0) @ R('X', -90) @ Matrix.Scale(0.6, 4)),
         'interior': ('Spine01', T(0, 0.30, 3.0) @ R('X', -90) @ Matrix.Scale(0.05, 4)),
         'swheel': ('Spine01', T(0, 0.30, 3.0) @ R('X', -90) @ Matrix.Scale(0.05, 4)),
         'fenderL': ('LeftShoulder', SH), 'wheelFL': ('LeftShoulder', SH),
         'doorFL': ('Spine', T(0.55, 0.62, 3.35) @ R('Z', -62) @ R('Y', -12) @ T(-0.84, 0.78, -0.25)),
         'doorRL': ('Hips', T(0.80, 0.10, 1.72) @ R('Y', -8) @ T(-0.84, -0.55, -0.25)),
         'legR': ('LeftLeg', LG), 'wheelRR': ('LeftLeg', LG),
         'plate': ('Spine01', T(0, 0.735, 3.30) @ T(-PLATE_R[0], -PLATE_R[1], -PLATE_R[2]))}      # the rear plate: high on the robot's back, on the roof's skin
def swn(n): return n[:-1] + ('R' if n[-1] == 'L' else 'L')
def swb(b): return b.replace('Left', '#').replace('Right', 'Left').replace('#', 'Right')
for d in (PIV, OPEN):
    for k, v in list(d.items()):
        if k[-1] == 'L': d[swn(k)] = (-v[0], v[1], v[2]) if d is PIV else MIR @ v @ MIR
for k, (b, m) in list(ROBOT.items()):
    if k[-1] in 'LR' and k not in ('floor', 'interior'): ROBOT[swn(k)] = (swb(b), MIR @ m @ MIR)

# ---------------------------------------------------------------- the core, its clips
core = imp('robot_core_rigged.glb')
arm = next(o for o in core if o.type == 'ARMATURE'); body = next(o for o in core if o.type == 'MESH' and o.parent == arm)
for o in core:
    if o not in (arm, body): bpy.data.objects.remove(o)
arm.scale = [v * K for v in arm.scale]
body.data.materials[0].name = 'ew_sedan_core'
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
arm.animation_data_clear()
for pb in arm.pose.bones: pb.matrix_basis.identity()
bpy.context.view_layer.update()
# ---------------------------------------------------------------- origins on the hinges, the empties
def empty(name, M, bone=None):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e); e.empty_display_size = 0.1
    if bone:
        e.parent = arm; e.parent_type = 'BONE'; e.parent_bone = bone; bpy.context.view_layer.update()
        e.matrix_world = M
    else: e.matrix_world = M
    return e
for name, p in parts.items():
    pv = PIV[name]; p.data.transform(T(-pv[0], -pv[1], -pv[2])); p.matrix_world = T(*pv)
    empty('o_' + name, OPEN[name] @ T(*pv))
    b, m = ROBOT[name]; empty('r_' + name, m @ T(*pv), b)
empty('seat_driver', T(0.37, 0.02, 0.52))
bpy.context.view_layer.update()
for name, p in parts.items():
    r = 0.3 if name.startswith('wheel') else 0.45 if name == 'interior' else 0.6 if name == 'swheel' else 0
    if r:
        md = p.modifiers.new('d', 'DECIMATE'); md.ratio = r
        bpy.context.view_layer.objects.active = p; bpy.ops.object.modifier_apply(modifier='d')
print('PARTS', {k: len(p.data.polygons) for k, p in sorted(parts.items())})

if SHOTS:
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 12; sc.cycles.device = 'CPU'
    try: sc.view_settings.view_transform = 'Standard'
    except Exception: pass
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.75, .78, .85, 1); bg.inputs[1].default_value = 1.3
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 4; sun.rotation_euler = (0.7, 0.2, 0.6); sc.collection.objects.link(sun)
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.type = 'ORTHO'
    for m in bpy.data.materials: m.use_backface_culling = False
    def shot(tag, d, c, scale, res=(900, 700)):
        d = Vector(d).normalized(); cam.data.ortho_scale = scale; sc.render.resolution_x, sc.render.resolution_y = res
        cam.location = Vector(c) + d * 30; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = SHOTS + '_' + tag + '.png'; bpy.ops.render.render(write_still=True)
    def pose(which):
        for name, p in parts.items():
            p.matrix_world = bpy.data.objects[('o_' if which == 'open' else 'r_') + name].matrix_world.copy() if which != 'car' else T(*PIV[name])
        body.hide_render = which != 'robot'
    pose('car'); shot('car_a', (1, -1.2, .6), (0, 0, .7), 5.6); shot('car_b', (1, 0.15, .12), (0, 0, .8), 5.2); shot('car_top', (0.01, 0.3, 1), (0, 0, .7), 5.2); shot('car_r', (0.35, 1, .3), (0, 0, .7), 5.2); shot('plate_r', (0.3, 1, .15), (0, 2.1, .75), 1.5); shot('plate_f', (0.3, -1, .15), (0, -2.1, .5), 1.5)
    pose('open'); shot('open', (1, -1.2, .8), (0, 0, .8), 6.6)
    pose('robot')
    for n, d in [('f', (0, -1, .05)), ('q', (1, -1.3, .4)), ('s', (1, 0, 0)), ('b', (-.7, 1, .3))]: shot('bot_' + n, d, (0, 0, 2.4), 6.0, (700, 900))
    pose('car'); body.hide_render = False

arm.animation_data_create()
for clip, f in (('walk', 'robot_core_walking.glb'), ('run', 'robot_core_running.glb')):
    have = set(bpy.data.actions); obs = imp(f)
    act = next(a for a in bpy.data.actions if a not in have); act.name = clip; act.use_fake_user = True
    for o in obs:
        if o.type == 'ARMATURE' and o.animation_data: o.animation_data.action = None
    for o in obs: bpy.data.objects.remove(o)
    tr = arm.animation_data.nla_tracks.new(); tr.name = clip
    st = tr.strips.new(clip, 1, act); st.name = clip
    try:
        if act.slots: st.action_slot = act.slots[0]
    except Exception as e: print('slot', e)

for m in bpy.data.materials:                     # Meshy's metal maps read black with no sky to mirror (the rooms have none): lacquer + dull steel
    if not m.node_tree: continue
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not b: continue
    for l in list(b.inputs['Metallic'].links): m.node_tree.links.remove(l)
    b.inputs['Metallic'].default_value = 0.2 if m.name == 'ew_sedan_core' else 0.0
    if m.name == 'ew_sedan_paint':
        for l in list(b.inputs['Roughness'].links): m.node_tree.links.remove(l)
        b.inputs['Roughness'].default_value = 0.4
    if m.name == 'ew_glass':
        for l in list(b.inputs['Base Color'].links): m.node_tree.links.remove(l)
        b.inputs['Base Color'].default_value = (0.62, 0.71, 0.75, 1); b.inputs['Alpha'].default_value = 0.22; b.inputs['Roughness'].default_value = 0.12
        for l in list(b.inputs['Roughness'].links) + list(b.inputs['Normal'].links): m.node_tree.links.remove(l)
        try: m.blend_method = 'BLEND'
        except Exception: pass
for im in bpy.data.images:                      # the sheets: 2K PNG a map from Meshy -> 1K WebP (the paint + the core keep 2K colour)
    if not im.size[0]: continue
    keep = any(im == n.image for m in bpy.data.materials if m.name in ('ew_sedan_paint', 'ew_glass', 'ew_sedan_core') and m.node_tree
               for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.outputs[0].links and n.outputs[0].links[0].to_socket.name == 'Base Color')
    w = 2048 if keep else 1024
    if im.size[0] > w: im.scale(w, w)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_yup=True, export_apply=False, export_skins=True, export_extras=False,
                          export_image_format='WEBP', export_image_quality=82)
print('WROTE', OUT, os.path.getsize(OUT))

# ---------------------------------------------------------------- the unit's two forms (--unit): the battle unit `honda civic`
if UNIT:
    GL = dict(export_format='GLB', export_yup=True, export_apply=False, export_extras=False, export_image_format='WEBP', export_image_quality=82, use_selection=True)
    def pick(obs):
        bpy.ops.object.select_all(action='DESELECT')
        for o in obs: o.select_set(True)
    pick(list(parts.values()))
    bpy.ops.export_scene.gltf(filepath=UNIT + '_car.glb', export_animations=False, export_skins=False, **GL)
    print('WROTE', UNIT + '_car.glb', os.path.getsize(UNIT + '_car.glb'))
    arm.animation_data_clear()
    for pb in arm.pose.bones: pb.matrix_basis.identity()
    bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
    worn = []
    for name, p in parts.items():
        if name in ('interior', 'swheel'): continue
        p.matrix_world = bpy.data.objects['r_' + name].matrix_world.copy(); bpy.context.view_layer.update()
        p.data.transform(p.matrix_world); p.matrix_world = Matrix()
        if p.matrix_world.determinant() < 0: p.data.flip_normals()
        vg = p.vertex_groups.new(name=ROBOT[name][0]); vg.add(range(len(p.data.vertices)), 1.0, 'REPLACE')
        p.parent = arm; p.matrix_parent_inverse = arm.matrix_world.inverted()
        md = p.modifiers.new('a', 'ARMATURE'); md.object = arm
        worn.append(p)
    pick(worn); bpy.context.view_layer.objects.active = worn[0]; bpy.ops.object.join(); worn[0].name = 'panels'
    pick([arm, body, worn[0]])
    bpy.ops.export_scene.gltf(filepath=UNIT + '_robot.glb', export_animations=False, export_skins=True, **GL)
    print('WROTE', UNIT + '_robot.glb', os.path.getsize(UNIT + '_robot.glb'))
