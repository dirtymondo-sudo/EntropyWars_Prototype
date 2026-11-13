# bake-eyes.py (2026-11-13, meshy-remake-batches.md batch 1): python3 -I bake-eyes.py <t2.glb> ...  (FACE_MODEL=<face_landmarker.task>) -> the EYE=x,y,z EYEW= line bake-outfit.py takes for each Meshy T2 remake (a face landmarker on a front drawing of its head). Repo-only tooling.
import bpy, sys, math, json, os, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
det=vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=os.environ.get('FACE_MODEL', 'face_landmarker.task')),num_faces=1,min_face_detection_confidence=0.15,min_face_presence_confidence=0.15))
out={}
for n in sys.argv[1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=n)
    obs=[o for o in bpy.context.scene.objects if o.type=='MESH']
    V=np.vstack([[o.matrix_world@v.co for v in o.data.vertices] for o in obs])
    zmax=V[:,2].max(); mid=V[np.abs(V[:,0])<0.04]; crown=mid[:,2].max()
    # the head box: top 22 % of the figure, on the middle line
    H=zmax-V[:,2].min(); size=0.30*H; cx=0.0; cz=crown-0.42*size
    sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=12; sc.cycles.device='CPU'; R=512; sc.render.resolution_x=sc.render.resolution_y=R
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.6,0.6,0.62,1); w.node_tree.nodes['Background'].inputs[1].default_value=1.5
    cam=bpy.data.cameras.new('c'); cam.type='ORTHO'; cam.ortho_scale=size; co=bpy.data.objects.new('c',cam); sc.collection.objects.link(co); sc.camera=co
    co.location=Vector((cx,-5,cz)); co.rotation_euler=(math.radians(90),0,0); sc.view_settings.view_transform='Standard'
    f=n[:-4]+'_head.png'; sc.render.filepath=f; bpy.ops.render.render(write_still=True)
    im=mp.Image.create_from_file(f); r=det.detect(im)
    if not r.face_landmarks: out[n]=None; print('NOFACE',n); continue
    lm=r.face_landmarks[0]; L=[33,133,159,145]; Rr=[362,263,386,374]
    def w2(ids): 
        u=np.mean([lm[i].x for i in ids]); v=np.mean([lm[i].y for i in ids]); return cx+(u-0.5)*size, cz+(0.5-v)*size
    lx,lz=w2(L); rx,rz=w2(Rr); ex=(lx+rx)/2; ez=(lz+rz)/2; ew=abs(lx-rx)/2
    dg=bpy.context.evaluated_depsgraph_get(); ys=[]
    for o in obs:
        bvh=BVHTree.FromObject(o,dg)
        for x in (lx,rx):
            h=bvh.ray_cast(o.matrix_world.inverted()@Vector((x,-5,ez)),Vector((0,1,0)))
            if h[0] is not None: ys.append((o.matrix_world@h[0]).y)
    ey=min(ys)+0.012 if ys else 0
    out[n]='EYE=%.4f,%.4f,%.4f EYEW=%.4f'%(ex,ey,ez,ew); print('EYES',n.split('/')[-1],out[n],'H=%.3f crown=%.3f'%(H,crown))
