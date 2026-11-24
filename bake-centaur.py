# THE CENTAUR BUILD (2026-11-24): a Meshy rigged human cut below the sash + the game's horse (tack, neck and head off),
# one armature (the human Hips parented to the horse chest bone spine.008), the horse's own clips kept.
# Usage (needs `pip install bpy`): python3 -I bake-centaur.py <human_rigged.glb> <out.glb> <coat: white|brown|dapple> [scale] [cutZ] [render.png|none]
#   env CENTAUR_DIR = the folder holding Horse_glb.glb + the coat sheets (default the project files' centaur-build/); DY / DZ nudge the
#   rider (horse units), RISE / NAR shape the withers. The two looks as built 2026-11-24 (DY=-0.2 DZ=0.02):
#     female: centaur_top_f_rigged.glb centaur_f.glb dapple 1.45 0.93     male: centaur_top_m_rigged.glb centaur_m.glb brown 1.35 0.98
#   The dapple-grey sheets are a COPY of the white coat with pale rings painted over (his White_Horse_Tex is untouched).
#   The game side: three-renderer.js THE CENTAUR. Notes: docs/notes/champions-combat.md "THE CENTAUR".
import bpy,sys,math,mathutils,os
A=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
HUM,OUT,COAT=A[0],A[1],A[2]
S=float(A[3]) if len(A)>3 else 1.1
CUT=float(A[4]) if len(A)>4 else 0.93
REN=A[5] if len(A)>5 else None
D=os.environ.get('CENTAUR_DIR','/mnt/project-files/centaur-build')
bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(p):
    before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p); return [o for o in bpy.data.objects if o not in before]
H=imp(D+'/Horse_glb.glb')
harm=[o for o in H if o.type=='ARMATURE'][0]
for o in H:
    if o.name.startswith('Icosphere') or o.name.startswith('Saddle') or o.name.startswith('Leash'): bpy.data.objects.remove(o,do_unlink=True)
horse=bpy.data.objects['Horse']
if harm.animation_data: harm.animation_data.action=None
for pb in harm.pose.bones: pb.location=(0,0,0); pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1); mane=bpy.data.objects['Mane']
U=imp(HUM)
uarm=[o for o in U if o.type=='ARMATURE'][0]
hum=[o for o in U if o.type=='MESH' and not o.name.startswith('Icosphere')][0]
for o in U:
    if o.name.startswith('Icosphere'): bpy.data.objects.remove(o,do_unlink=True)
hum.name='CentaurTop'; horse.name='CentaurHorse'
# --- the horse: neck + head off (verts whose weight is mostly on the neck/head bones)
NECK={'spine.009','spine.010','spine.011','spine.011_end'}
def cut_by_groups(ob,names,thr=0.5):
    gi={g.index for g in ob.vertex_groups if g.name in names}
    bpy.context.view_layer.objects.active=ob
    kill=[]
    for v in ob.data.vertices:
        w=sum(g.weight for g in v.groups if g.group in gi); t=sum(g.weight for g in v.groups) or 1
        if w/t>thr: kill.append(v.index)
    import bmesh
    bm=bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm,geom=[bm.verts[i] for i in kill],context='VERTS'); bm.to_mesh(ob.data); bm.free()
    return len(kill)
print('horse neck verts cut',cut_by_groups(horse,NECK,float(os.environ.get('NECKTHR','0.5'))))
print('mane neck verts cut',cut_by_groups(mane,NECK,0.3))
# --- the coat
def coat_tex(path):
    im=bpy.data.images.load(path); return im
mat=horse.data.materials[0]; mmat=mane.data.materials[0]
def set_tex(m,img):
    for n in m.node_tree.nodes:
        if n.type=='TEX_IMAGE': n.image=img
if COAT=='brown':
    set_tex(mat,coat_tex(D+'/Brown_Horse_Tex.png')); set_tex(mmat,coat_tex(D+'/Brown_Mane_Tex.png'))
elif COAT=='dapple':
    set_tex(mat,coat_tex(D+'/Dapple_Horse_Tex.png')); set_tex(mmat,coat_tex(D+'/Dapple_Mane_Tex.png'))
# --- the human: scaled, everything below the cut off, leg weights onto the hips
uarm.scale=(uarm.scale[0]*S,)*3
bpy.context.view_layer.update()
import bmesh
mw=hum.matrix_world
bm=bmesh.new(); bm.from_mesh(hum.data); bm.verts.ensure_lookup_table()
cutz=CUT*S
kill=[v for v in bm.verts if (mw@v.co).z<cutz]
bmesh.ops.delete(bm,geom=kill,context='VERTS'); bm.to_mesh(hum.data); bm.free()
print('human verts cut',len(kill),'left',len(hum.data.vertices))
LEGS=['LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase']
hg=hum.vertex_groups.get('Hips') or hum.vertex_groups.new(name='Hips')
lg={hum.vertex_groups[n].index:n for n in LEGS if n in hum.vertex_groups}
for v in hum.data.vertices:
    w=sum(g.weight for g in v.groups if g.group in lg)
    if w>0:
        for gi in lg: hum.vertex_groups[lg[gi]].remove([v.index])
        hg.add([v.index],w,'ADD')
# --- place: the human's waist (the hips bone) over the horse's neck base
hb=uarm.data.bones['Hips']; hipW=uarm.matrix_world@hb.head_local
nb=harm.data.bones['spine.009']; neckW=harm.matrix_world@nb.head_local
off=mathutils.Vector((float(os.environ.get('DX','0')),float(os.environ.get('DY','0')),float(os.environ.get('DZ','0.0'))))
hv=[horse.matrix_world@v.co for v in horse.data.vertices]
fronty=min(v.y for v in hv if v.z>1.2)
band=[v for v in hv if abs(v.y-(fronty+0.35))<0.12]
topz=max(v.z for v in band)
print('horse front y',round(fronty,3),'top z there',round(topz,3))
target=mathutils.Vector((0,fronty+0.35,topz))+off
# the withers rise: the front of the back swells up and in under the waist, so the torso grows out of the horse
RISE=float(os.environ.get('RISE','0.14')); NAR=float(os.environ.get('NAR','0.3'))
iw=horse.matrix_world.inverted()
for v in horse.data.vertices:
    w=horse.matrix_world@v.co
    kz=max(0,min(1,(w.z-(topz-0.4))/0.4)); ky=max(0,min(1,(target.y+0.55-w.y)/0.5))
    k=kz*ky
    if k<=0: continue
    k=k*k*(3-2*k)
    w.z+=RISE*k; w.x*=(1-NAR*k); w.y+= (target.y-w.y)*0.15*k
    v.co=iw@w
# the human faces -Y in Blender (glTF +Z), like the horse
uarm.location=uarm.location+(target-hipW)
bpy.context.view_layer.update()
print('hip at',tuple(round(x,3) for x in uarm.matrix_world@hb.head_local),'neck base',tuple(round(x,3) for x in neckW))
# --- one armature: join the human's into the horse's (Blender carries the object transforms over), Hips under spine.008
bpy.ops.object.select_all(action='DESELECT')
mwH=hum.matrix_world.copy()
harm.select_set(True); uarm.select_set(True); bpy.context.view_layer.objects.active=harm
bpy.ops.object.join()
for m in hum.modifiers:
    if m.type=='ARMATURE': m.object=harm
hum.parent=harm; hum.matrix_world=mwH
bpy.context.view_layer.objects.active=harm
bpy.ops.object.mode_set(mode='EDIT')
eb=harm.data.edit_bones
eb['Hips'].parent=eb['spine.008']; eb['Hips'].use_connect=False
bpy.ops.object.mode_set(mode='OBJECT')
harm.name='CentaurRig'
print('bones',len(harm.data.bones))
# check: human mesh world bounds
zs=[(hum.matrix_world@v.co) for v in hum.data.vertices]
print('top z',max(v.z for v in zs),'min z',min(v.z for v in zs))
if REN:
    sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=12; sc.cycles.use_denoising=False
    sc.render.resolution_x=640; sc.render.resolution_y=500
    sc.world=bpy.data.worlds.new('w'); sc.world.use_nodes=True; sc.world.node_tree.nodes['Background'].inputs[0].default_value=(0.8,0.8,0.8,1); sc.world.node_tree.nodes['Background'].inputs[1].default_value=1.2
    cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam
    import mathutils as M
    shots=[('side',M.Vector((-6.5,-0.3,2.0))),('front3q',M.Vector((-3.6,-5,2.6))),('back3q',M.Vector((3.5,4.5,3.0))),('front',M.Vector((0,-6,2.2)))]
    if os.environ.get('POSE'):
        act=bpy.data.actions.get(os.environ['POSE'])
        if act: harm.animation_data_create(); harm.animation_data.action=act; sc.frame_set(int(os.environ.get('FRAME','10')))
    for nm,p in shots:
        cam.location=p; d=M.Vector((0,-0.2,1.6))-p; cam.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
        cam.data.lens=40
        sc.render.filepath=REN.replace('.png','_'+nm+'.png'); bpy.ops.render.render(write_still=True)
if OUT!='none':
    for ac in list(bpy.data.actions):
        if ac.name not in ('Idle','Idle_2','Trot','Gallop'): bpy.data.actions.remove(ac)
    harm.animation_data_create(); harm.animation_data.action=None
    bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_yup=True,export_image_format='AUTO')
    print('wrote',OUT,os.path.getsize(OUT))
