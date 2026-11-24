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
# --- THE JOIN (11-24, mondo: "a clear and visible gap"): a skin of the horse's coat lofted from inside the horse's chest up into
# the rider's waist, under the sash, so the horse grows into the human. Rigid on the chest bone (the rider's Hips is held there too).
if os.environ.get('NOLOFT')!='1':
    from mathutils.bvhtree import BVHTree
    from mathutils.kdtree import KDTree
    import bmesh as _bm
    hw=hum.matrix_world
    b=_bm.new(); b.from_mesh(hum.data); b.edges.ensure_lookup_table()
    _bw=[hw@v.co for e in b.edges if e.is_boundary for v in e.verts]
    cz=min(p.z for p in _bw)
    bnd=[p for p in _bw if p.z-cz<0.06*S]
    print('cut ring z',round(cz,3),'verts',len(bnd))
    b.free()
    cxy=mathutils.Vector((sum(p.x for p in bnd)/len(bnd),sum(p.y for p in bnd)/len(bnd)))
    NA=32
    def ring_r(pts,th):
        d=mathutils.Vector((math.cos(th),math.sin(th)));best=0
        for p in pts:
            q=mathutils.Vector((p.x-cxy.x,p.y-cxy.y))
            if q.length<1e-6: continue
            if q.normalized().dot(d)>math.cos(math.radians(14)): best=max(best,q.length)
        return best
    zA=cz+float(os.environ.get('LOFTUP','0.05'))*S
    _all=[hw@v.co for v in hum.data.vertices]
    cxy=mathutils.Vector((0.0,sum(p.y for p in _all if abs(p.z-zA)<0.03 and abs(p.x)<0.2)/max(1,len([p for p in _all if abs(p.z-zA)<0.03 and abs(p.x)<0.2]))))
    sl=[p for p in _all if abs(p.z-zA)<0.03 and (mathutils.Vector((p.x,p.y))-cxy).length<float(os.environ.get('WAISTMAX','0.26'))]
    rA=[ring_r(sl,2*math.pi*a/NA) for a in range(NA)]
    print('waist ring',[round(r,2) for r in rA])
    for a in range(NA):
        if rA[a]<=0: rA[a]=max(rA)
    zA=cz+float(os.environ.get('LOFTUP','0.05'))*S
    hbm=_bm.new(); hbm.from_mesh(horse.data); hbm.transform(horse.matrix_world); bvh=BVHTree.FromBMesh(hbm)
    zB=float(os.environ.get('LOFTZB',str(topz-float(os.environ.get('LOFTDOWN','0.45')))))
    rB=[]; PB=[]
    O=mathutils.Vector((0.0,cxy.y+float(os.environ.get('LOFTOY','0.25')),zB))
    for a in range(NA):
        th=2*math.pi*a/NA; d=mathutils.Vector((math.cos(th),math.sin(th),0))
        hit=bvh.ray_cast(O,d,3.0)
        H=hit[0] if hit[0] else O+d*0.3
        PB.append(O+(H-O)*float(os.environ.get('RBK','0.97'))); rB.append((H-O).length)
    # UVs from the nearest point of the horse's own skin
    uvl=horse.data.uv_layers.active.data
    kd=KDTree(len(horse.data.loops))
    for li,l in enumerate(horse.data.loops): kd.insert(horse.matrix_world@horse.data.vertices[l.vertex_index].co,li)
    kd.balance()
    NR=int(os.environ.get('LOFTRINGS','8'))
    verts=[];uvs=[]
    for r in range(NR+1):
        t=r/NR; e=1-(1-t)**float(os.environ.get('LOFTPOW','2'))
        for a in range(NA):
            th=2*math.pi*a/NA
            pa=mathutils.Vector((cxy.x+rA[a]*0.93*math.cos(th),cxy.y+rA[a]*0.93*math.sin(th),zA))
            verts.append(PB[a].lerp(pa,e) if r<NR else pa)
    me=bpy.data.meshes.new('CentaurJoin'); faces=[]
    for r in range(NR):
        for a in range(NA):
            a2=(a+1)%NA; faces.append((r*NA+a,r*NA+a2,(r+1)*NA+a2,(r+1)*NA+a))
    me.from_pydata([tuple(v) for v in verts],[],faces); me.update()
    _flip=0
    for p in me.polygons:
        c=p.center; out=mathutils.Vector((c.x-cxy.x,c.y-cxy.y,0))
        if p.normal.dot(out)<0: p.flip(); _flip+=1
    me.update(); print('loft faces flipped',_flip,'of',len(me.polygons))
    _co,_idx,_d=kd.find(mathutils.Vector((0.12,cxy.y+0.35,topz-0.05))); uv0=mathutils.Vector(uvl[_idx].uv)
    uv=me.uv_layers.new(name=horse.data.uv_layers.active.name)
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi=me.loops[li].vertex_index; uv.data[li].uv=uv0+mathutils.Vector(((vi%NA)/NA*0.12,(vi//NA)/NR*0.06))
    jo=bpy.data.objects.new('CentaurJoin',me); bpy.context.scene.collection.objects.link(jo)
    jo.data.materials.append(horse.data.materials[0])
    # normals outward
    jo.matrix_world=mathutils.Matrix.Identity(4)
    bpy.context.view_layer.update()
    vg=jo.vertex_groups.new(name='spine.008'); vg.add(list(range(len(verts))),1.0,'REPLACE')
    for p in me.polygons: p.use_smooth=True
    # into the horse mesh (its frame), so it shares the skin
    bpy.ops.object.select_all(action='DESELECT')
    jo.select_set(True); horse.select_set(True); bpy.context.view_layer.objects.active=horse
    bpy.ops.object.join()
    print('join loft', NR, 'rings', 'zB', round(zB,3), 'zA', round(zA,3), 'rA', round(min(rA),3), round(max(rA),3), 'rB', round(min(rB),3), round(max(rB),3))
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
