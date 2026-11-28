#!/usr/bin/env python3
# bake-mermaid.py -- THE MERMAID'S TAIL (2026-11-28, mondo: "I want the mermaid tail to be animated separately from her upper body
# so she can still have the meshy animations like how the centaurs do it").
# Rigs an UNRIGGED Meshy mermaid (a T-pose, tail straight down) with Meshy's own skeleton taken from a rigged Meshy file (the old
# mermaid f2: same bone names, so the shared animation library retargets onto it), every joint refitted to the new body, the legs
# left in the file but weighing nothing (use_deform off) and a chain ewtail_0..6 laid down the tail under the Hips
# (three-renderer.js THE MERMAID'S TAIL swims it after the clip). Blender's heat weights fail on Meshy's open mesh, so the weights
# are the nearest bones' (1/d^4, the four strongest), gated by region: arms only out at the side and not behind the back (the
# hair never rides an arm), tail bones only below the frill, head + neck only above the shoulders.
# The joint heights below are the 2026-11-28 model's (measured from slices, height scaled to 1.75 m); another mermaid needs them
# measured again. Needs `pip install bpy`.
#   python3 -I bake-mermaid.py -- <new mermaid texture.glb> <rigged Meshy file for the skeleton> <out.glb>
# Then node optimize-assets.js <dir> (the .opt.glb), sync-zip.js --put both, ASSET_MANIFEST.json rows. Notes: champions-combat.md
# "THE MERMAID'S TAIL".
# THE MERMAID'S TAIL build: Meshy's own skeleton (from the old mermaid file) refitted to mondo's new mesh, a chain of tail bones
# down the tail, the legs left in the file but weighing nothing. Blender's heat weights.
import bpy,sys,mathutils
A=sys.argv[sys.argv.index('--')+1:]
NEW,OLD,OUT=A[0],A[1],A[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(p):
    before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p); return [o for o in bpy.data.objects if o not in before]
O=imp(OLD)
arm=[o for o in O if o.type=='ARMATURE'][0]
for o in O:
    if o.type=='MESH': bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.objects.active=arm; arm.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
N=imp(NEW)
mesh=[o for o in N if o.type=='MESH'][0]
bpy.context.view_layer.objects.active=mesh
for o in bpy.data.objects: o.select_set(o==mesh)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
zs=[v.co.z for v in mesh.data.vertices]; z0=min(zs); H=max(zs)-z0; s=1.75/H
for v in mesh.data.vertices: v.co=mathutils.Vector(((v.co.x)*s,(v.co.y)*s,(v.co.z-z0)*s))
mesh.data.update()
mesh.name='char1'
V=lambda x,y,z:mathutils.Vector((x,y,z))
# (glTF x, y up, z front) -> Blender (x, -z, y)
G=lambda x,y,z:V(x,-z,y)
J={'Hips':(G(0,1.17,-0.02),G(0,1.25,-0.02)),'Spine02':(G(0,1.25,-0.02),G(0,1.32,-0.02)),'Spine01':(G(0,1.32,-0.02),G(0,1.40,-0.02)),
   'Spine':(G(0,1.40,-0.02),G(0,1.52,-0.01)),'neck':(G(0,1.52,-0.01),G(0,1.585,0.0)),'Head':(G(0,1.585,0.0),G(0,1.75,0.01)),
   'LeftShoulder':(G(0.03,1.47,-0.01),G(0.12,1.495,0.0)),'LeftArm':(G(0.12,1.495,0.0),G(0.31,1.495,0.0)),
   'LeftForeArm':(G(0.31,1.495,0.0),G(0.49,1.49,0.0)),'LeftHand':(G(0.49,1.49,0.0),G(0.58,1.49,0.0)),
   'LeftUpLeg':(G(0.07,1.09,-0.02),G(0.07,0.75,-0.02)),'LeftLeg':(G(0.07,0.75,-0.02),G(0.07,0.35,-0.03)),
   'LeftFoot':(G(0.07,0.35,-0.03),G(0.07,0.30,0.06)),'LeftToeBase':(G(0.07,0.30,0.06),G(0.07,0.30,0.14))}
for k in list(J):
    if k.startswith('Left'):
        a,b=J[k]; J['Right'+k[4:]]=(V(-a.x,a.y,a.z),V(-b.x,b.y,b.z))
bpy.context.view_layer.objects.active=arm
for o in bpy.data.objects: o.select_set(o==arm)
bpy.ops.object.mode_set(mode='EDIT')
eb=arm.data.edit_bones
for n,(h,t) in J.items():
    e=eb[n]; r=e.roll; e.use_connect=False; e.head=h; e.tail=t; e.roll=r
for n in ('head_end','headfront'):
    if n in eb:
        e=eb[n]; d=e.tail-e.head
        if n=='head_end': e.head=G(0,1.75,0.01); e.tail=e.head+V(0,0,0.05)
        else: e.head=G(0,1.585,0.0); e.tail=G(0,1.585,0.12)
TL=[(1.10,-0.02),(0.93,0.0),(0.77,-0.02),(0.61,-0.035),(0.46,-0.04),(0.31,-0.055),(0.16,-0.055),(-0.02,-0.055)]
prev=eb['Hips']
for i in range(len(TL)-1):
    e=eb.new('ewtail_%d'%i); e.head=G(0,TL[i][0],TL[i][1]); e.tail=G(0,TL[i+1][0],TL[i+1][1]); e.parent=prev; e.use_connect=(i>0); e.roll=0; prev=e
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones:
    if 'Leg' in b.name or 'Foot' in b.name or 'Toe' in b.name or b.name in ('head_end','headfront'): b.use_deform=False
# heat weights fail on Meshy's open mesh (40 pieces): weights by the nearest bones, gated by region (the hair never on an arm)
import numpy as np
for o in bpy.data.objects: o.select_set(o in (mesh,arm))
bpy.context.view_layer.objects.active=arm
bpy.ops.object.parent_set(type='ARMATURE_NAME')
P=np.array([v.co[:] for v in mesh.data.vertices])
gx,gy,gz=P[:,0],P[:,2],-P[:,1]   # glTF frame
DB=[b for b in arm.data.bones if b.use_deform]
W=np.zeros((len(P),len(DB)))
for k,bn in enumerate(DB):
    h=np.array(bn.head_local[:]); t=np.array(bn.tail_local[:]); d=t-h; L2=d.dot(d)
    u=np.clip(((P-h)@d)/L2,0,1); q=h+u[:,None]*d; dist=np.linalg.norm(P-q,axis=1)
    n=bn.name
    if any(x in n for x in ('Shoulder','Arm','Hand')):
        ok=(np.abs(gx)>0.085)&(gz>-0.065)&(gy>1.40)&(np.sign(gx)==(1 if n.startswith('Left') else -1))
        if 'Shoulder' not in n: ok&=(np.abs(gx)>0.11)
    elif n.startswith('ewtail_'): ok=gy<1.13
    elif n in ('Head','neck'): ok=gy>1.44
    else: ok=gy>0.98
    W[:,k]=np.where(ok,1.0/(dist+0.012)**4,0)
# keep the 4 strongest
idx=np.argsort(-W,axis=1)[:,:4]
for i in range(len(P)):
    ws=W[i,idx[i]]; t=ws.sum()
    if t<=0: continue
    for k,w in zip(idx[i],ws/t):
        if w>0.01: mesh.vertex_groups[DB[k].name].add([i],float(w),'REPLACE') if DB[k].name in mesh.vertex_groups else mesh.vertex_groups.new(name=DB[k].name).add([i],float(w),'REPLACE')
# no vertex left without a weight
vg={g.index:g.name for g in mesh.vertex_groups}
bad=[v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups)<1e-4]
print('UNWEIGHTED',len(bad),'of',len(mesh.data.vertices))
if bad:
    # nearest weighted vertex's weights
    from mathutils import kdtree
    good=[v for v in mesh.data.vertices if sum(g.weight for g in v.groups)>=1e-4]
    kd=kdtree.KDTree(len(good))
    for i,v in enumerate(good): kd.insert(v.co,i)
    kd.balance()
    for bi in bad:
        v=mesh.data.vertices[bi]; co,i,d=kd.find(v.co)
        for g in good[i].groups: mesh.vertex_groups[g.group].add([bi],g.weight,'REPLACE')
cnt={}
for v in mesh.data.vertices:
    if v.groups:
        g=max(v.groups,key=lambda g:g.weight); cnt[mesh.vertex_groups[g.group].name]=cnt.get(mesh.vertex_groups[g.group].name,0)+1
print('TOP BONE COUNTS',sorted(cnt.items(),key=lambda x:-x[1]))
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_animations=False,export_yup=True,export_image_format='AUTO',export_skins=True,export_def_bones=False)
print('WROTE',OUT)
