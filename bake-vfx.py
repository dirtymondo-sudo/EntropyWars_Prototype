"""bake-vfx.py - spell VFX FLIPBOOKS baked in cloud Blender (repo-only tooling, 2026-11-03, the Blender pilot).

RETIRED 2026-11-08 (mondo): the game no longer loads any flipbook; the Blender fire + smoke was removed (Riot VFX
style guide p.28). Kept as history only. Notes: docs/notes/spells-vfx.md "THE BLENDER FIRE + SMOKE REVERTED".

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

# ---------------------------------------------------------------------------------------------------------------------
# THE SPELL SIMS (2026-11-05): four distinct sims for Fireball + Meteor, each rendered in TWO passes from one cached sim:
#   smoke/ = the lit smoke (normal blend, film transparent), glow/ = the fire's own light on black (additive; the sheet
#   turns brightness into alpha). Calm forces + BALLOONING emitters (the emitter's own scale grows over the first frames):
#   a big initial push sweeps the gas out of the box in a few frames, a growing emitter fills the box like a real
#   fireball. Dissolve times are SHORT so the gas is gone by the last frame (the old 110-frame dissolve never thinned).
#     fbhit  = Fireball hit: a compact yellow-orange fireball that balloons, licks out and rolls up into thin grey smoke
#     mblast = Meteor ground blast: a wide red-orange dome on the ground, a brown dust ring rolling out along the floor,
#              a dark column rising (mushroom); longer and heavier
#     fbfly  = Fireball in flight (loop): a flame ball in a head wind, flames streaming back (trail toward -X)
#     mtail  = Meteor tail (loop): a lumpy burning rock in a strong head wind, red flames + thick dark smoke streaming back
# Run: PRESET=fbhit blender -b --factory-startup -P bake-vfx.py -- sim /tmp/fbhit   (QUICK=1 = a low-res framing check)
# then: python3 bake-vfx.py sheet2 /tmp/fbhit <out prefix> <first> <n> <cols> <cell> <step> [loop]
SIMS = {
    # NF frames, domain (loc, scale), camera (ortho, z, tilt deg), res, dissolve frames
    'fbhit':  dict(NF=44, dom=((0, 0, 1.5), (3.4, 3.4, 3.6)), cam=(3.2, 1.45, 0), res=128, dis=16),
    'mblast': dict(NF=64, dom=((0, 0, 2.4), (6.4, 6.4, 4.8)), cam=(6.4, 2.25, 12), res=144, dis=22),
    'fbfly':  dict(NF=80, dom=((-0.6, 0, 0.0), (2.6, 1.6, 1.6)), cam=(2.6, 0.0, 0), res=112, dis=10),
    'mtail':  dict(NF=80, dom=((-1.3, 0, 0.0), (4.4, 3.0, 3.0)), cam=(4.4, 0.0, 0), res=128, dis=22),
}

def sim(OUT):
    import bpy, math, time, random
    P = os.environ.get('PRESET', 'fbhit'); S = SIMS[P]
    quick = os.environ.get('QUICK') == '1'
    random.seed(int(os.environ.get('SEED', '11')))
    NF = S['NF']
    for d in ('smoke', 'glow'): os.makedirs(OUT + '/' + d, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.frame_start, sc.frame_end = 1, NF
    def link(o): sc.collection.objects.link(o); return o
    def lumps(n, spread, rmin, rmax, loc, flat=1.0):
        """a cluster of balls joined into one mesh: the gas billows into lobes, not a pom-pom"""
        objs = []
        for i in range(n):
            a = random.uniform(0, 6.283); r = random.uniform(0, spread); e = random.uniform(-1, 1)
            bpy.ops.mesh.primitive_ico_sphere_add(radius=random.uniform(rmin, rmax), subdivisions=2,
                location=(loc[0] + math.cos(a) * r, loc[1] + math.sin(a) * r, loc[2] + e * spread * flat))
            objs.append(bpy.context.active_object)
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.hide_render = True
        return o
    def flow(o, kind, fuel=1.0, temp=1.0, dens=1.0, col=(0.5, 0.5, 0.5), vel=0.0, on=None, sd=0.6):
        f = o.modifiers.new('Fluid', 'FLUID'); f.fluid_type = 'FLOW'; fs = f.flow_settings
        fs.flow_type = kind; fs.flow_behavior = 'INFLOW'; fs.flow_source = 'MESH'; fs.surface_distance = sd
        fs.fuel_amount = fuel; fs.temperature = temp; fs.density = dens; fs.smoke_color = col
        if vel: fs.use_initial_velocity = True; fs.velocity_normal = vel; fs.velocity_factor = 0.0
        if on:   # inflow only for frames on[0]..on[1]
            fs.use_inflow = False; fs.keyframe_insert('use_inflow', frame=1)
            fs.use_inflow = True; fs.keyframe_insert('use_inflow', frame=on[0])
            fs.keyframe_insert('use_inflow', frame=on[1])
            fs.use_inflow = False; fs.keyframe_insert('use_inflow', frame=on[1] + 1)
        return fs
    def balloon(o, s0, s1, f0, f1):
        if os.environ.get('NOBAL'): return
        o.scale = (s0, s0, s0); o.keyframe_insert('scale', frame=f0)
        o.scale = (s1, s1, s1); o.keyframe_insert('scale', frame=f1)
    def field(kind, loc, strength, size=0.5, rot=(0, 0, 0)):
        if os.environ.get('NOFIELD'): return
        e = link(bpy.data.objects.new(kind, None)); e.location = loc; e.rotation_euler = rot
        bpy.context.view_layer.objects.active = e; bpy.ops.object.forcefield_toggle()
        e.field.type = kind; e.field.strength = strength
        if kind == 'TURBULENCE': e.field.size = size; e.field.flow = 0.0
        return e
    # ---- the emitters + forces of each sim
    if P == 'fbhit':
        em = lumps(7, 0.22, 0.12, 0.2, (0, 0, 0.75))
        balloon(em, 0.35, 1.9, 1, 8)
        flow(em, 'BOTH', fuel=2.6, temp=2.2, dens=0.9, col=(0.6, 0.57, 0.54), vel=1.5, on=(1, 7))
        field('TURBULENCE', (0, 0, 1.3), 2.5, 0.32)
    elif P == 'mblast':
        core = lumps(9, 0.4, 0.18, 0.32, (0, 0, 0.32), flat=0.45)
        balloon(core, 0.4, 2.3, 1, 7)
        flow(core, 'BOTH', fuel=3.5, temp=3.5, dens=1.6, col=(0.45, 0.4, 0.37), vel=1.0, on=(1, 7))
        # the stem: a fire ball that rides up out of the blast and feeds the rising column / cap
        stem = lumps(4, 0.12, 0.14, 0.22, (0, 0, 0))
        stem.location = (0, 0, 0.4); stem.keyframe_insert('location', frame=4)
        stem.location = (0, 0, 2.3); stem.keyframe_insert('location', frame=22)
        flow(stem, 'BOTH', fuel=1.8, temp=3.0, dens=1.0, col=(0.4, 0.35, 0.32), on=(4, 20))
        # the dust ring: lumps on a circle at the floor; scaling the joined mesh from the centre rolls them outward
        objs = []
        for i in range(12):
            a_ = i * 6.283 / 12 + random.uniform(-0.2, 0.2); r_ = random.uniform(0.55, 0.75)
            bpy.ops.mesh.primitive_ico_sphere_add(radius=random.uniform(0.12, 0.2), subdivisions=2,
                                                  location=(math.cos(a_) * r_, math.sin(a_) * r_, 0.15))
            objs.append(bpy.context.active_object)
        bpy.ops.object.select_all(action='DESELECT')
        for o_ in objs: o_.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
        ring = bpy.context.view_layer.objects.active; ring.hide_render = True
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        ring.scale = (0.6, 0.6, 1.0); ring.keyframe_insert('scale', frame=2)
        ring.scale = (3.4, 3.4, 1.6); ring.keyframe_insert('scale', frame=16)
        flow(ring, 'SMOKE', dens=0.8, col=(0.62, 0.5, 0.38), temp=0.15, on=(2, 15), sd=0.4)
        field('TURBULENCE', (0, 0, 0.4), 4.0, 0.3)
        field('TURBULENCE', (0, 0, 2.2), 3.0, 0.45)
    elif P in ('fbfly', 'mtail'):
        big = P == 'mtail'
        if big:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, subdivisions=3, location=(0, 0, 0))
            em = bpy.context.active_object; em.hide_render = True
            for v in em.data.vertices: v.co *= random.uniform(0.82, 1.15)
        else:
            em = lumps(5, 0.08, 0.13, 0.19, (0, 0, 0))
        flow(em, 'BOTH', fuel=2.2 if big else 2.0, temp=2.5, dens=1.6 if big else 0.25,
             col=(0.14, 0.12, 0.11) if big else (0.4, 0.38, 0.36), sd=0.5)
        field('WIND', (0.6, 0, 0), 3.0 if big else 2.2, rot=(0, math.radians(-90), 0))   # the head wind blows toward -X
        field('TURBULENCE', (-0.5, 0, 0), 4.0, 0.2)
        if big: field('TURBULENCE', (-2.0, 0, 0), 7.0, 0.5)   # the meteor's smoke billows out wide behind the flames
    # ---- the domain
    me = bpy.data.meshes.new('dom'); import bmesh
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    dom = link(bpy.data.objects.new('Domain', me)); dom.location, dom.scale = S['dom']
    d = dom.modifiers.new('Fluid', 'FLUID'); d.fluid_type = 'DOMAIN'; ds = d.domain_settings
    ds.domain_type = 'GAS'; ds.resolution_max = 48 if quick else int(os.environ.get('RES', S['res'])); ds.cfl_condition = 4.0
    ds.use_noise = not quick; ds.noise_scale = 2; ds.noise_strength = 1.0
    ds.vorticity = 0.2; ds.alpha = 0.15; ds.beta = 1.1
    ds.burning_rate = 0.75; ds.flame_smoke = 1.0; ds.flame_vorticity = 0.5; ds.flame_ignition = 1.25; ds.flame_max_temp = 1.75
    ds.use_dissolve_smoke = True; ds.dissolve_speed = S['dis']; ds.use_dissolve_smoke_log = True
    if P == 'fbhit': ds.alpha = 0.05; ds.beta = 1.6
    if P == 'mblast': ds.alpha = 0.2; ds.beta = 2.2; ds.flame_smoke = 1.4; ds.burning_rate = 0.6
    if P in ('fbfly', 'mtail'): ds.alpha = 0.0; ds.beta = 0.0; ds.flame_vorticity = 1.2; ds.burning_rate = 1.4 if P == 'fbfly' else 1.0
    if P == 'fbfly': ds.flame_smoke = 0.25
    if P == 'mtail': ds.burning_rate = 1.7; ds.flame_smoke = 2.2; ds.vorticity = 0.5   # short flames at the rock, a lot of dark smoke
    if not os.environ.get('NOBORDER'):
      for side in ('front', 'back', 'right', 'left', 'top'): setattr(ds, 'use_collision_border_' + side, False)
    ds.use_collision_border_bottom = P == 'mblast'
    if P in ('fbfly', 'mtail'): ds.use_collision_border_bottom = False
    ds.cache_type = 'REPLAY'; ds.cache_directory = OUT + '/cache'; ds.cache_frame_start = 1; ds.cache_frame_end = NF
    ds.cache_data_format = 'OPENVDB'
    # ---- camera + light (a sun from the upper left front, a weak sky)
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.2
    so = link(bpy.data.objects.new('sun', sun)); so.rotation_euler = (math.radians(50), math.radians(25), math.radians(20))
    ortho, cz, tilt = S['cam']
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = ortho
    co = link(bpy.data.objects.new('cam', cam)); t = math.radians(tilt)
    cx = S['dom'][0][0] if P in ('fbfly', 'mtail') else 0
    co.location = (cx, -12 * math.cos(t), cz + 12 * math.sin(t)); co.rotation_euler = (math.radians(90) - t, 0, 0); sc.camera = co
    w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
    r = sc.render; r.engine = 'CYCLES'; px = 96 if quick else int(os.environ.get('PX', '256'))
    r.resolution_x = r.resolution_y = px; r.resolution_percentage = 100
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    sc.cycles.device = 'CPU'; sc.cycles.samples = 8 if quick else int(os.environ.get('SPP', '24')); sc.cycles.use_denoising = True
    sc.cycles.volume_step_rate = 1.0; sc.cycles.max_bounces = 2; sc.cycles.volume_bounces = 0
    sc.view_settings.view_transform = 'Standard'
    # ---- the fire ramp of each sim (Fireball: yellow-white core, orange body; Meteor: deep red body, white-hot core)
    ramp_pts = {'fbhit': [(0, (0, 0, 0)), (0.18, (0.6, 0.08, 0.0)), (0.45, (1.0, 0.42, 0.04)), (0.75, (1.0, 0.78, 0.25)), (1, (1, 0.97, 0.85))],
                'fbfly': [(0, (0, 0, 0)), (0.18, (0.6, 0.08, 0.0)), (0.45, (1.0, 0.45, 0.05)), (0.75, (1.0, 0.8, 0.3)), (1, (1, 0.97, 0.88))],
                'mblast': [(0, (0, 0, 0)), (0.2, (0.45, 0.03, 0.0)), (0.5, (0.95, 0.2, 0.02)), (0.8, (1.0, 0.55, 0.12)), (1, (1, 0.92, 0.8))],
                'mtail': [(0, (0, 0, 0)), (0.2, (0.45, 0.03, 0.0)), (0.5, (0.95, 0.22, 0.02)), (0.8, (1.0, 0.6, 0.15)), (1, (1, 0.93, 0.8))]}[P]
    EMI = float(os.environ.get('EMI', {'fbhit': 3, 'mblast': 3, 'fbfly': 3.5, 'mtail': 3}[P]))
    def mat(kind):
        m = bpy.data.materials.new(kind); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        fa = nt.nodes.new('ShaderNodeAttribute'); fa.attribute_name = 'flame'
        rp = nt.nodes.new('ShaderNodeValToRGB'); cr = rp.color_ramp
        cr.elements[0].position = ramp_pts[0][0]; cr.elements[0].color = ramp_pts[0][1] + (1,)
        cr.elements[1].position = ramp_pts[-1][0]; cr.elements[1].color = ramp_pts[-1][1] + (1,)
        for p_, c_ in ramp_pts[1:-1]: e_ = cr.elements.new(p_); e_.color = c_ + (1,)
        nt.links.new(fa.outputs['Fac'], rp.inputs['Fac'])
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        nt.links.new(fa.outputs['Fac'], mul.inputs[0])
        pv = nt.nodes.new('ShaderNodeVolumePrincipled'); nt.links.new(pv.outputs['Volume'], out.inputs['Volume'])
        ca = nt.nodes.new('ShaderNodeAttribute'); ca.attribute_name = 'color'
        if kind == 'smoke':   # lit smoke, a faint warm under-glow from the fire inside it
            # one smoke colour per sim: Mantaflow's 'color' grid renders near-black in Cycles 5.2 (tested), so no attribute
            pv.inputs['Color Attribute'].default_value = ''
            pv.inputs['Color'].default_value = {'fbhit': (0.62, 0.6, 0.58), 'mblast': (0.52, 0.45, 0.39),
                                                'fbfly': (0.6, 0.58, 0.55), 'mtail': (0.36, 0.32, 0.29)}[P] + (1,)
            pv.inputs['Density'].default_value = float(os.environ.get('DEN', {'fbhit': 8, 'mblast': 7, 'fbfly': 6, 'mtail': 9}[P]))
            pv.inputs['Blackbody Intensity'].default_value = 0.0
            mul.inputs[1].default_value = EMI * (0.015 if P == 'mtail' else 0.06)
            nt.links.new(rp.outputs['Color'], pv.inputs['Emission Color']); nt.links.new(mul.outputs[0], pv.inputs['Emission Strength'])
        else:   # the glow: emission only, the smoke in front absorbs a little of it (depth), rendered on black
            pv.inputs['Color'].default_value = (0, 0, 0, 1)
            pv.inputs['Density'].default_value = float(os.environ.get('GDEN', '2.5'))
            pv.inputs['Absorption Color'].default_value = (0, 0, 0, 1)
            mul.inputs[1].default_value = EMI
            nt.links.new(rp.outputs['Color'], pv.inputs['Emission Color']); nt.links.new(mul.outputs[0], pv.inputs['Emission Strength'])
        return m
    dom.data.materials.append(bpy.data.materials.new('base'))   # a slot for the view-layer override to fill
    t0 = time.time()
    for fr in range(1, NF + 1):
        sc.frame_set(fr)
        if fr % 10 == 0: print('sim', fr, '%.0fs' % (time.time() - t0)); sys.stdout.flush()
    print('sim done %.0fs' % (time.time() - t0)); sys.stdout.flush()
    passes = os.environ.get('PASSES', 'smoke,glow').split(',')
    mats = dict((k, mat(k)) for k in ('smoke', 'glow'))
    for kind in passes:
        # the pass swaps the VIEW LAYER's material override: editing the domain's own materials would free the replay cache
        sc.view_layers[0].material_override = mats[kind]
        r.film_transparent = kind == 'smoke'
        w.node_tree.nodes['Background'].inputs['Strength'].default_value = float(os.environ.get('SKY', '0.7')) if kind == 'smoke' else 0.0
        t0 = time.time()
        step = 4 if quick else 1
        for fr in range(1, NF + 1, step):
            sc.frame_set(fr); r.filepath = OUT + '/%s/f%03d.png' % (kind, fr)
            bpy.ops.render.render(write_still=True)
        print(kind, 'rendered %.0fs' % (time.time() - t0)); sys.stdout.flush()
    bpy.ops.wm.save_as_mainfile(filepath=OUT + '/%s.blend' % P)
    print('done')

def sheet2(src, out, first=1, n=36, cols=6, cell=128, step=1, loop=0):
    """the two passes of a sim -> <out>_smoke.png (normal blend) + <out>_glow.png (additive, brightness = alpha).
    A one-shot sheet ends EMPTY: the last 25% of the frames ease the alpha to 0 on top of the sim's own dissolve.
    loop=k: a looping sheet; the last k frames cross-fade into the first k so the loop has no seam."""
    import glob
    from PIL import Image
    first, n, cols, cell, step, loop = int(first), int(n), int(cols), int(cell), int(step), int(loop)
    rows = (n + cols - 1) // cols
    for kind in ('smoke', 'glow'):
        fr = sorted(glob.glob(src + '/%s/f*.png' % kind))
        if not fr: continue
        fr = fr[first - 1::step][:n + loop]
        ims = []
        for f in fr:
            im = Image.open(f).convert('RGBA').resize((cell, cell), Image.LANCZOS)
            if kind == 'glow': im = _glow_alpha(im)
            ims.append(_edge_fade(im, 0.72))
        if loop:   # frame i (i < loop) = blend of frame n+i (the run past the end) into frame i
            for i in range(loop):
                k = (i + 0.5) / loop
                ims[i] = Image.blend(ims[n + i], ims[i], k)
            ims = ims[:n]
        else:
            t0 = int(n * 0.75)
            for i in range(t0, n):
                k = 1 - (i - t0 + 1) / float(n - t0); k = k * k * (3 - 2 * k)
                a = ims[i].getchannel('A').point(lambda v: int(v * k)); ims[i].putalpha(a)
        S = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
        for i, im in enumerate(ims): S.paste(im, ((i % cols) * cell, (i // cols) * cell))
        o = out + '_' + kind + '.png'; S.save(o, optimize=True)
        last = ims[-1].getchannel('A'); cov = sum(1 for v in last.getdata() if v > 20) / float(cell * cell)
        print('wrote', o, len(ims), 'frames, last frame max alpha', max(last.getdata()), 'coverage %.3f' % cov)

if __name__ == '__main__':
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if a and a[0] == 'render': render(os.path.abspath(a[1] if len(a) > 1 else 'out'))
    elif a and a[0] == 'sim': sim(os.path.abspath(a[1] if len(a) > 1 else 'out'))
    elif a and a[0] == 'sheet2': sheet2(*a[1:])
    elif a and a[0] == 'sheet': sheet(a[1], a[2], *[int(v) for v in a[3:]])
    else: print(__doc__)
