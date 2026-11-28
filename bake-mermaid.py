#!/usr/bin/env python3
# bake-mermaid.py -- THE MERMAID IN TWO PARTS (2026-11-28, mondo: "use meshy to make a new model", the tail "animated separately
# from her upper body so she can still have the meshy animations like how the centaurs do it").
# Joins a Meshy RIGGED woman (concept: the mermaid on human legs, A-pose) and a Meshy TAIL piece (no body) into one file:
#   the bust a little fuller (a soft swell about a point inside each breast; BUST), the legs cut below the skirt's hem (HEM) and
#   what is left of them weighed onto the Hips, the tail scaled to the hips (TW half width, LEN length, TD depth, TY nudge back),
#   its top up inside the skirt (TOPZ), the body lifted so the fluke stands on the floor, a chain ewtail_0..6 down the tail under
#   the Hips (nearest-bone weights, the top RIM fraction blended into the Hips), the leg bones kept but weighing nothing.
# three-renderer.js THE MERMAID'S TAIL swims the chain after the library clip. Needs `pip install bpy`.
#   BUST=0.28 TY=0.012 HEM=0.67 TW=0.155 LEN=1.25 python3 -I bake-mermaid.py -- <body_rigged.glb> <tail.glb> <out.glb>
# (the 11-28 build: project files mermaid-tail/models/body_rigged.glb + tail.glb -> mermaid_tail_v2.glb). Then optimize-assets.js,
# sync-zip.js --put, ASSET_MANIFEST.json rows. Notes: champions-combat.md "THE MERMAID'S TAIL".
import bpy,sys,os,numpy as np,mathutils,bmesh
A=sys.argv[sys.argv.index('--')+1:]
BODY,TAIL,OUT=A[0],A[1],A[2]
K=float(os.environ.get('BUST','0.32'))
bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(p):
    b=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p); return [o for o in bpy.data.objects if o not in b]
B=imp(BODY)
arm=[o for o in B if o.type=='ARMATURE'][0]
for o in B:
    if o.type=='MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o,do_unlink=True)
if arm.animation_data: arm.animation_data.action=None
for pb in arm.pose.bones: pb.location=(0,0,0); pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
bpy.context.view_layer.objects.active=arm
for o in bpy.data.objects: o.select_set(o==arm)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
body=[o for o in bpy.data.objects if o.type=='MESH' and o.parent==arm][0]
for o in bpy.data.objects: o.select_set(o==body)
bpy.context.view_layer.objects.active=body
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=body.data; vg={g.name:g.index for g in body.vertex_groups}
def wsum(v,names):
    ids={vg[n] for n in names if n in vg}; return sum(g.weight for g in v.groups if g.group in ids)
ARMS=[n for n in vg if any(k in n for k in ('Arm','Hand','Shoulder'))]
LEGS=[n for n in vg if any(k in n for k in ('UpLeg','Leg','Foot','Toe'))]
# 1. the bust, fuller: a soft swell about a point inside each breast (the starfish and the pearls ride along)
P=np.array([v.co[:] for v in me.vertices])
for sx in (1,-1):
    C=np.array([0.08*sx,-0.05,1.255]); R=0.15
    d=np.linalg.norm(P-C,axis=1); t=np.clip((R-d)/(R*0.45),0,1); w=t*t*(3-2*t)
    for i in np.nonzero(w>0)[0]:
        v=me.vertices[i]
        if P[i,1]>-0.02 or P[i,0]*sx<-0.01 or wsum(v,ARMS)>0.3: continue
        v.co=mathutils.Vector(C+(P[i]-C)*(1+K*w[i]))
P=np.array([v.co[:] for v in me.vertices])
# 2. the skirt's hem: the lowest z where the outline is still wider than the thighs
rad=lambda s:np.abs(P[s,0]).max() if s.any() else 0
hem=None
for z in np.arange(0.95,0.55,-0.01):
    s=(np.abs(P[:,2]-z)<0.006)&(np.abs(P[:,0])<0.3)&(np.abs(P[:,1])<0.25)
    print('slice %.2f |x|max %.3f'%(z,rad(s)))
hem=float(os.environ.get('HEM','0.74'))
bm=bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); dl=bm.verts.layers.deform.active
legi={vg[n] for n in LEGS}
kill=[v for v in bm.verts if v.co.z<hem and sum(w for g,w in v[dl].items() if g in legi)>0.5]
bmesh.ops.delete(bm,geom=kill,context='VERTS'); bm.to_mesh(me); bm.free()
print('legs cut',len(kill))
hg=body.vertex_groups['Hips']
for v in me.vertices:
    w=wsum(v,LEGS)
    if w>0:
        for n in LEGS: body.vertex_groups[n].remove([v.index])
        hg.add([v.index],w,'ADD')
# 3. the tail: top width to the hips, its top up inside the skirt
T=[o for o in imp(TAIL) if o.type=='MESH'][0]
for o in bpy.data.objects: o.select_set(o==T)
bpy.context.view_layer.objects.active=T
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
Q=np.array([v.co[:] for v in T.data.vertices]); top=Q[:,2].max(); bot=Q[:,2].min(); L0=top-bot
tw=np.abs(Q[Q[:,2]>top-0.03*L0,0]).max()
s=float(os.environ.get('TW','0.135'))/tw
TOPZ=float(os.environ.get('TOPZ','0.93'))
cx=(Q[:,0].max()+Q[:,0].min())/2; cy=np.median(Q[Q[:,2]>top-0.05*L0,1])
sz=float(os.environ.get('LEN','1.25'))/L0; L=L0*sz; lift=max(0.0,L-TOPZ)
print('tail length',L,'lift',lift)
for v in T.data.vertices:
    v.co=mathutils.Vector(((v.co.x-cx)*s,(v.co.y-cy)*s*float(os.environ.get('TD','1.0'))+float(os.environ.get('TY','0.0')),(v.co.z-top)*sz+TOPZ))
T.data.update()
# the body + bones up by `lift` so the fluke stands on the floor
for v in me.vertices: v.co.z+=lift
bpy.context.view_layer.objects.active=arm
for o in bpy.data.objects: o.select_set(o==arm)
bpy.ops.object.mode_set(mode='EDIT')
eb=arm.data.edit_bones
for e in eb: e.head.z+=lift; e.tail.z+=lift
for v in T.data.vertices: v.co.z+=lift
# the chain down the tail's middle
Q=np.array([v.co[:] for v in T.data.vertices]); zt=Q[:,2].max(); zb=Q[:,2].min()
N=7; zs=[zt-0.04*(zt-zb)]+[zt-(zt-zb)*(0.04+0.96*k/N) for k in range(1,N+1)]
def mid(z):
    s=np.abs(Q[:,2]-z)<0.02*(zt-zb); s&=np.abs(Q[:,0])<0.06
    if not s.any(): s=np.abs(Q[:,2]-z)<0.04*(zt-zb)
    return mathutils.Vector((0,float((Q[s,1].max()+Q[s,1].min())/2),z))
pts=[mid(z) for z in zs]; pts[-1].z=zb
prev=eb['Hips']
for i in range(N):
    e=eb.new('ewtail_%d'%i); e.head=pts[i]; e.tail=pts[i+1]; e.parent=prev; e.use_connect=(i>0); e.roll=0; prev=e
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.data.bones:
    if b.name in LEGS or any(k in b.name for k in ('UpLeg','Leg','Foot','Toe')): b.use_deform=False
# tail weights: nearest chain bones (1/d^4, top two), the top rim blended into the Hips
DB=[arm.data.bones['ewtail_%d'%i] for i in range(N)]
for b in DB+[arm.data.bones['Hips']]: T.vertex_groups.new(name=b.name)
Q=np.array([v.co[:] for v in T.data.vertices])
W=np.zeros((len(Q),N))
for k,b in enumerate(DB):
    h=np.array(b.head_local[:]); t=np.array(b.tail_local[:]); d=t-h
    u=np.clip(((Q-h)@d)/d.dot(d),0,1); dist=np.linalg.norm(Q-(h+u[:,None]*d),axis=1); W[:,k]=1/(dist+0.01)**4
W/=W.sum(1,keepdims=True)
RIM=float(os.environ.get('RIM','0.2')); rim=np.clip((Q[:,2]-(zt-RIM*(zt-zb)))/(0.1*(zt-zb)),0,1)
for i in range(len(Q)):
    o=np.argsort(-W[i])[:2]; ws=W[i,o]/W[i,o].sum()*(1-rim[i])
    for k,w in zip(o,ws):
        if w>0.01: T.vertex_groups[DB[k].name].add([i],float(w),'REPLACE')
    if rim[i]>0.01: T.vertex_groups['Hips'].add([i],float(rim[i]),'REPLACE')
# one skinned mesh
for o in bpy.data.objects: o.select_set(o in (body,T))
bpy.context.view_layer.objects.active=body
bpy.ops.object.join()
body.name='char1'
print('verts',len(body.data.vertices))
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_animations=False,export_yup=True,export_image_format='AUTO',export_skins=True,export_def_bones=False)
print('WROTE',OUT)
