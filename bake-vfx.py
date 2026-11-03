"""bake-vfx.py - spell VFX FLIPBOOKS baked in cloud Blender (repo-only tooling, 2026-11-03, the Blender pilot).

A real fire + smoke simulation (Blender Mantaflow) rendered by Cycles to transparent frames, then cut into one sheet
(8 x 8 cells of 128 px) that three-vfx.js THE FLIPBOOKS plays over a particle's life. Output used by the game:
Assets/Sprites/vfx/fb_explosion.png (R2: Assets/Sprites/vfx/). Notes: docs/notes/spells-vfx.md "THE FLIPBOOKS".

  1. sim + render (needs the FULL Blender build: pip's `bpy` module crashes in Mantaflow):
       curl -O https://download.blender.org/release/Blender5.2/blender-5.2.3-linux-x64.tar.xz && tar xf ...
       RES=120 NOISE=1 PX=256 SPP=24 DEN=16 EMI=60 VEL=14 \
         blender-5.2.3-linux-x64/blender -b --factory-startup -P bake-vfx.py -- render /tmp/boom
     (~3 min sim + ~2 min render on 4 cores; writes /tmp/boom/frames/f001..f064.png and boom.blend)
  2. sheet (plain python3 + Pillow): python3 bake-vfx.py sheet /tmp/boom/frames Assets/Sprites/vfx/fb_explosion.png
     (drops the first 4 near-identical frames, keeps 60; the blast centre lands 0.82 down each cell = `lift` 0.32)
"""
import os, sys

def render(OUT):
    import bpy, math, time, bmesh
    os.makedirs(OUT + '/frames', exist_ok=True)
    NF = 64
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, NF
    def link(o): sc.collection.objects.link(o); return o
    # emitter
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.45, subdivisions=3, location=(0, 0, 0.75))
    em = bpy.context.view_layer.objects.active if bpy.context.view_layer.objects.active else [o for o in sc.objects][-1]
    em = [o for o in sc.objects if o.type == 'MESH'][-1]
    em.hide_render = True
    f = em.modifiers.new('Fluid', 'FLUID'); f.fluid_type = 'FLOW'
    fs = f.flow_settings
    fs.flow_type = 'BOTH'; fs.flow_behavior = 'INFLOW'; fs.flow_source = 'MESH'
    fs.surface_distance = 0.8; fs.fuel_amount = 3.0; fs.temperature = 3.0; fs.density = 2.0
    fs.use_initial_velocity = True; fs.velocity_normal = float(os.environ.get('VEL','14')); fs.velocity_factor = 0.0
    fs.use_inflow = True; fs.keyframe_insert('use_inflow', frame=1)
    fs.keyframe_insert('use_inflow', frame=8)
    fs.use_inflow = False; fs.keyframe_insert('use_inflow', frame=9)
    # domain
    me = bpy.data.meshes.new('dom')
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    dom = link(bpy.data.objects.new('Domain', me))
    dom.location = (0, 0, 2.3); dom.scale = (3.6, 3.6, 5.0)
    d = dom.modifiers.new('Fluid', 'FLUID'); d.fluid_type = 'DOMAIN'
    ds = d.domain_settings
    ds.domain_type = 'GAS'; ds.resolution_max = int(os.environ.get('RES', '120')); ds.cfl_condition = 4.0
    ds.use_noise = os.environ.get('NOISE', '1') == '1'; ds.noise_scale = 2; ds.noise_strength = 1.2
    ds.vorticity = 0.35; ds.alpha = 0.4; ds.beta = 2.0
    ds.burning_rate = 0.6; ds.flame_smoke = 2.0; ds.flame_vorticity = 0.6; ds.flame_ignition = 1.25; ds.flame_max_temp = 1.75
    ds.use_dissolve_smoke = True; ds.dissolve_speed = 110; ds.use_dissolve_smoke_log = False
    ds.cache_type = os.environ.get('CT','REPLAY'); ds.cache_directory = OUT + '/cache'; ds.cache_frame_start = 1; ds.cache_frame_end = NF
    ds.cache_data_format = 'OPENVDB'
    # material
    mat = bpy.data.materials.new('boom'); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); pv = nt.nodes.new('ShaderNodeVolumePrincipled')
    nt.links.new(pv.outputs['Volume'], out.inputs['Volume'])
    pv.inputs['Color'].default_value = (0.16, 0.14, 0.13, 1)
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
    dom.data.materials.append(mat)
    # light + camera
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.5
    so = link(bpy.data.objects.new('sun', sun)); so.rotation_euler = (math.radians(50), math.radians(25), math.radians(20))
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = 4.0
    co = link(bpy.data.objects.new('cam', cam)); co.location = (0, -12, 2.05); co.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = co
    w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.15; sc.world = w
    r = sc.render; r.engine = 'CYCLES'; r.film_transparent = True
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

def sheet(src, out):
    import glob
    from PIL import Image
    fr = sorted(glob.glob(src + '/f*.png'))[4:64]
    S = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        S.paste(Image.open(f).convert('RGBA').resize((128, 128), Image.LANCZOS), ((i % 8) * 128, (i // 8) * 128))
    S.save(out, optimize=True)
    print('wrote', out, len(fr), 'frames')

if __name__ == '__main__':
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    if a and a[0] == 'render': render(os.path.abspath(a[1] if len(a) > 1 else 'out'))
    elif a and a[0] == 'sheet': sheet(a[1], a[2])
    else: print(__doc__)
