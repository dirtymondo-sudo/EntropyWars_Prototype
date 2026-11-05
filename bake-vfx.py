"""bake-vfx.py - spell VFX FLIPBOOKS baked in cloud Blender (repo-only tooling, 2026-11-03, the Blender pilot).

A real fire + smoke simulation (Blender Mantaflow) rendered by Cycles to transparent frames, then cut into one sheet
(8 x 8 cells of 128 px) that three-vfx.js THE FLIPBOOKS plays over a particle's life. Output used by the game:
Assets/fx/sprites/fb_explosion.png (R2: Assets/fx/sprites/). Notes: docs/notes/spells-vfx.md "THE FLIPBOOKS".

  1. sim + render (needs the FULL Blender build: pip's `bpy` module crashes in Mantaflow):
       curl -O https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz && tar xf ...
       RES=120 NOISE=1 PX=256 SPP=24 DEN=16 EMI=60 VEL=14 \
         blender-5.2.3-linux-x64/blender -b --factory-startup -P bake-vfx.py -- render /tmp/boom
     (~3 min sim + ~2 min render on 4 cores; writes /tmp/boom/frames/f001..f064.png and boom.blend)
     PRESET=smoke (a grey puff) / PRESET=fire (a steady flame) bake the shared smoke/dust and ember sheets the same way.
  2. sheet (plain python3 + Pillow): python3 bake-vfx.py sheet /tmp/boom/frames Assets/fx/sprites/fb_explosion.png
     [first n cols cell step]: smoke = 2 16 4 128 3 -> fb_smoke.png (SHEET=whiten; to frame 47 so the sheet ends on the sim's own dissolve), fire = 40 16 4 64 1 -> fb_ember.png (SHEET=glow)
     (drops the first 4 near-identical frames, keeps 60; the blast centre lands 0.82 down each cell = `lift` 0.32)
"""
import os, sys

def render(OUT):
    import bpy, math, time, bmesh
    os.makedirs(OUT + '/frames', exist_ok=True)
    P = os.environ.get('PRESET', 'explosion')   # explosion | smoke (a grey puff, no fire) | fire (a steady flame, no smoke)
    NF = {'explosion': 64, 'smoke': 48, 'fire': 60}[P]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, NF
    def link(o): sc.collection.objects.link(o); return o
    # emitter
    bpy.ops.mesh.primitive_ico_sphere_add(radius={'explosion': 0.45, 'smoke': 0.4, 'fire': 0.22}[P], subdivisions=3,
                                          location=(0, 0, {'explosion': 0.75, 'smoke': 0.9, 'fire': 0.3}[P]))
    em = bpy.context.view_layer.objects.active if bpy.context.view_layer.objects.active else [o for o in sc.objects][-1]
    em = [o for o in sc.objects if o.type == 'MESH'][-1]
    if P == 'smoke':   # a lumpy emitter (a cluster of balls) + a turbulence field: the puff billows into lobes, not a pom-pom
        import random; random.seed(int(os.environ.get('SEED', '7')))
        for i in range(int(os.environ.get('LUMPS', '6'))):
            a_ = random.uniform(0, 6.283); r_ = random.uniform(0.18, 0.34)
            bpy.ops.mesh.primitive_ico_sphere_add(radius=random.uniform(0.16, 0.28), subdivisions=2,
                                                  location=(math.cos(a_) * r_, math.sin(a_) * r_ * 0.6, 0.9 + random.uniform(-0.2, 0.25)))
        bpy.ops.object.select_all(action='SELECT')
        bpy.context.view_layer.objects.active = em
        bpy.ops.object.join()
        em = bpy.context.view_layer.objects.active
        tf = link(bpy.data.objects.new('turb', None)); tf.location = (0, 0, 1.2)
        bpy.context.view_layer.objects.active = tf
        bpy.ops.object.forcefield_toggle()
        tf.field.type = 'TURBULENCE'; tf.field.strength = float(os.environ.get('TURB', '6')); tf.field.size = 0.45
        tf.field.flow = 0.0; tf.field.noise = 0.0
    em.hide_render = True
    f = em.modifiers.new('Fluid', 'FLUID'); f.fluid_type = 'FLOW'
    fs = f.flow_settings
    fs.flow_type = {'explosion': 'BOTH', 'smoke': 'SMOKE', 'fire': 'BOTH'}[P]; fs.flow_behavior = 'INFLOW'; fs.flow_source = 'MESH'
    fs.surface_distance = 0.8; fs.fuel_amount = 3.0; fs.temperature = 3.0; fs.density = 2.0
    fs.use_initial_velocity = True; fs.velocity_normal = float(os.environ.get('VEL','14')); fs.velocity_factor = 0.0
    if P == 'smoke': fs.velocity_normal = float(os.environ.get('VEL', '9')); fs.density = 3.0
    if P == 'fire': fs.use_initial_velocity = False; fs.fuel_amount = 1.6; fs.density = 0.4   # fire: a little smoke only so Cycles has a volume to march (kept near-invisible by DEN)
    if P != 'fire':   # a puff / a blast: the emitter shuts off after a few frames (fire burns on)
        stop = 8 if P == 'explosion' else 6
        fs.use_inflow = True; fs.keyframe_insert('use_inflow', frame=1)
        fs.keyframe_insert('use_inflow', frame=stop)
        fs.use_inflow = False; fs.keyframe_insert('use_inflow', frame=stop + 1)
    # domain
    me = bpy.data.meshes.new('dom')
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    dom = link(bpy.data.objects.new('Domain', me))
    dom.location, dom.scale = {'explosion': ((0, 0, 2.3), (3.6, 3.6, 5.0)), 'smoke': ((0, 0, 1.6), (3.2, 3.2, 3.2)),
                               'fire': ((0, 0, 1.3), (1.8, 1.8, 2.8))}[P]
    d = dom.modifiers.new('Fluid', 'FLUID'); d.fluid_type = 'DOMAIN'
    ds = d.domain_settings
    ds.domain_type = 'GAS'; ds.resolution_max = int(os.environ.get('RES', '120')); ds.cfl_condition = 4.0
    ds.use_noise = os.environ.get('NOISE', '1') == '1'; ds.noise_scale = 2; ds.noise_strength = 1.2
    ds.vorticity = 0.35; ds.alpha = 0.4; ds.beta = 2.0
    ds.burning_rate = 0.6; ds.flame_smoke = 2.0; ds.flame_vorticity = 0.6; ds.flame_ignition = 1.25; ds.flame_max_temp = 1.75
    ds.use_dissolve_smoke = True; ds.dissolve_speed = 110; ds.use_dissolve_smoke_log = False
    if P == 'smoke': ds.alpha = 0.1; ds.beta = 0.35; ds.dissolve_speed = 30; ds.vorticity = 0.6
    if P == 'fire': ds.flame_smoke = 0.3; ds.flame_vorticity = 0.8; ds.burning_rate = 0.9; ds.beta = 1.6
    ds.cache_type = os.environ.get('CT','REPLAY'); ds.cache_directory = OUT + '/cache'; ds.cache_frame_start = 1; ds.cache_frame_end = NF
    ds.cache_data_format = 'OPENVDB'
    # material
    mat = bpy.data.materials.new('boom'); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); pv = nt.nodes.new('ShaderNodeVolumePrincipled')
    nt.links.new(pv.outputs['Volume'], out.inputs['Volume'])
    pv.inputs['Color'].default_value = (0.82, 0.82, 0.82, 1) if P == 'smoke' else (0.16, 0.14, 0.13, 1)
    pv.inputs['Density'].default_value = float(os.environ.get('DEN','16'))
    pv.inputs['Blackbody Intensity'].default_value = 0.0
    fa = nt.nodes.new('ShaderNodeAttribute'); fa.attribute_name = 'flame'
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0, 0, 0, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (1.0, 0.95, 0.75, 1)
    e = cr.elements.new(0.2); e.color = (0.75, 0.06, 0.0, 1)
    e = cr.elements.new(0.5); e.color = (1.0, 0.38, 0.02, 1)
    nt.links.new(fa.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], pv.inputs['Emission Color'])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = float(os.environ.get('EMI','60'))
    nt.links.new(fa.outputs['Fac'], mul.inputs[0]); nt.links.new(mul.outputs[0], pv.inputs['Emission Strength'])
    if P == 'fire':   # pure glow: a volume EMISSION (not scaled by smoke density), rendered on black; sheet() turns brightness into alpha
        em2 = nt.nodes.new('ShaderNodeEmission')
        nt.links.new(ramp.outputs['Color'], em2.inputs['Color']); nt.links.new(mul.outputs[0], em2.inputs['Strength'])
        nt.links.new(em2.outputs['Emission'], out.inputs['Volume'])
    dom.data.materials.append(mat)
    # light + camera
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.5
    so = link(bpy.data.objects.new('sun', sun)); so.rotation_euler = (math.radians(50), math.radians(25), math.radians(20))
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = {'explosion': 4.0, 'smoke': 2.4, 'fire': 1.9}[P]
    co = link(bpy.data.objects.new('cam', cam)); co.location = (0, -12, {'explosion': 2.05, 'smoke': 1.25, 'fire': 1.0}[P]); co.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = co
    w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.15; sc.world = w
    if P == 'fire': w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    r = sc.render; r.engine = 'CYCLES'; r.film_transparent = P != 'fire'
    r.resolution_x = r.resolution_y = int(os.environ.get('PX', '256')); r.resolution_percentage = 100
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get('SPP', '32')); sc.cycles.use_denoising = True
    sc.cycles.volume_step_rate = 1.0; sc.cycles.max_bounces = 2; sc.cycles.volume_bounces = 0
    sc.view_settings.view_transform = 'Standard' if True else 'AgX' if 'AgX' in [i.identifier for i in sc.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
    t0 = time.time()
    for fr in range(1, NF + 1):
        sc.frame_set(fr)
    print('baked in %.1fs' % (time.time() - t0)); sys.stdout.flush()
    t0 = time.time()
    for fr in range(1, NF + 1):
        sc.frame_set(fr)
        r.filepath = OUT + '/frames/f%03d.png' % fr
        bpy.ops.render.render(write_still=True)
        if fr % 8 == 0: print('frame', fr, '%.1fs' % (time.time() - t0)); sys.stdout.flush()
    bpy.ops.wm.save_as_mainfile(filepath=OUT + '/boom.blend')
    print('done')

def _glow_alpha(im):
    """a glow rendered on black -> brightness becomes alpha, colour is un-premultiplied (for additive sprites)"""
    from PIL import Image
    px = im.convert('RGB').load(); w, h = im.size; o = Image.new('RGBA', (w, h)); po = o.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]; a = max(r, g, b)
            po[x, y] = (0, 0, 0, 0) if a < 2 else (min(255, r * 255 // a), min(255, g * 255 // a), min(255, b * 255 // a), a)
    return o

def _whiten(im, pct=0.97):
    """stretch a grey smoke so its lit side reaches white: the game tints it by the particle kind's colour"""
    from PIL import Image
    px = im.load(); w, h = im.size
    lum = sorted(max(px[x, y][:3]) for y in range(h) for x in range(w) if px[x, y][3] > 40)
    if not lum: return im
    k = 255.0 / max(1, lum[int(len(lum) * pct)])
    o = im.copy(); po = o.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]; po[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), a)
    return o

def _edge_fade(im, r0=0.6):
    """a round vignette (full alpha inside r0 of the half-width, gone at the rim): a puff that reached the sim box
    dissolves into a soft round edge on the sprite instead of showing the box"""
    w, h = im.size; px = im.load(); c = (w - 1) / 2.0
    for y in range(h):
        for x in range(w):
            d = (((x - c) ** 2 + (y - c) ** 2) ** 0.5) / (w / 2.0)
            if d > r0:
                k = max(0.0, 1 - (d - r0) / (1 - r0)); k = k * k * (3 - 2 * k)
                r, g, b, a = px[x, y]; px[x, y] = (r, g, b, int(a * k))
    return im

def sheet(src, out, first=4, n=60, cols=8, cell=128, step=1):
    """cut frames first, first+step, ... (n of them) into a cols x cols sheet of cell px.
    SHEET=glow (fire: brightness -> alpha) / SHEET=whiten (smoke: lit side -> white, the game tints it)"""
    import glob
    from PIL import Image
    mode = os.environ.get('SHEET', '')
    fr = sorted(glob.glob(src + '/f*.png'))[first::step][:n]
    S = Image.new('RGBA', (cols * cell, cols * cell), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        im = Image.open(f).convert('RGBA').resize((cell, cell), Image.LANCZOS)
        if mode == 'glow': im = _glow_alpha(im)
        if mode == 'whiten': im = _whiten(im)
        im = _edge_fade(im)
        S.paste(im, ((i % cols) * cell, (i // cols) * cell))
    S.save(out, optimize=True)
    print('wrote', out, len(fr), 'frames')

if __name__ == '__main__':
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if a and a[0] == 'render': render(os.path.abspath(a[1] if len(a) > 1 else 'out'))
    elif a and a[0] == 'sheet': sheet(a[1], a[2], *[int(v) for v in a[3:]])
    else: print(__doc__)
