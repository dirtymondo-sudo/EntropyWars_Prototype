# THE 100STYLE TAKES (2026-11-05): a 100STYLE BVH (Ian Mason, CC BY 4.0, https://www.ianxmason.com/100style; Xsens, 60 fps, cm)
# -> a BVH with the CMU joint names in CMU units, so bake-mocap.py reads it like a CMU take.
#   python3 -I mocap-100style.py <100STYLE/Style/Style_ID.bvh> <out_dir/9NN/9NN_01.bvh>
# The takes used (bake-mocap.py --cmu <out_dir> --base 901_01 --clips mocap-clips-100style.json --out MOC2_100STYLE.glb):
#   901 Neutral, 902 ArmsBySide, 903 ArmsBehindBack, 904 ArmsFolded, 905 Proud, 906 Heavyset, 907 Old, 908 HandsInPockets,
#   909 Strutting, 910 Stiff; _01 = the style's ID (idle) file, _02 = its FW (forward walk) file. The dataset zip is 1.5 GB: pull
#   single files with an HTTP-range zip reader from https://zenodo.org/api/records/8127870/files/100STYLE.zip/content.
import sys, os, re
REN = {'Chest': 'LowerBack', 'Chest2': 'Spine', 'Chest3': 'Spine1', 'Chest4': 'Spine1b', 'Neck': 'Neck1',
       'LeftCollar': 'LeftShoulder', 'LeftShoulder': 'LeftArm', 'LeftElbow': 'LeftForeArm', 'LeftWrist': 'LeftHand',
       'RightCollar': 'RightShoulder', 'RightShoulder': 'RightArm', 'RightElbow': 'RightForeArm', 'RightWrist': 'RightHand',
       'LeftHip': 'LeftUpLeg', 'LeftKnee': 'LeftLeg', 'LeftAnkle': 'LeftFoot', 'LeftToe': 'LeftToeBase',
       'RightHip': 'RightUpLeg', 'RightKnee': 'RightLeg', 'RightAnkle': 'RightFoot', 'RightToe': 'RightToeBase'}
K = 0.01 / 0.056444
src, dst = sys.argv[1], sys.argv[2]
txt = open(src).read()
head, motion = txt.split('MOTION', 1)
def fix_line(l):
    m = re.match(r'(\s*)(ROOT|JOINT)\s+(\S+)', l)
    if m: return m.group(1) + m.group(2) + ' ' + REN.get(m.group(3), m.group(3))
    m = re.match(r'(\s*)OFFSET\s+(\S+)\s+(\S+)\s+(\S+)', l)
    if m: return m.group(1) + 'OFFSET ' + ' '.join('%.6f' % (float(x) * K) for x in m.group(2, 3, 4))
    return l
head = '\n'.join(fix_line(l) for l in head.split('\n'))
lines = motion.strip().split('\n')
out = [lines[0], lines[1]]
for l in lines[2:]:
    v = l.split()
    if not v: continue
    for i in range(3): v[i] = '%.5f' % (float(v[i]) * K)
    out.append(' '.join(v))
os.makedirs(os.path.dirname(dst), exist_ok=True)
open(dst, 'w').write(head + 'MOTION\n' + '\n'.join(out) + '\n')
