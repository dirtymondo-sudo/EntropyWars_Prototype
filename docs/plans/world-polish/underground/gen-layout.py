import random, json
import sys, os
random.seed(int(sys.argv[1]) if len(sys.argv) > 1 else 2)   # seed 2 = the layout mondo saw on 11-20
HERE = os.path.dirname(os.path.abspath(__file__))
D = {  # key: (name, x0,y0,x1,y1, entry, tile, colour, low rgb, high rgb)
 'S': ('The Sewers', 10,0,17,5, (13,0), 's', '#7fd0a0', [30,70,50],[170,235,190]),
 'C': ('The Catacombs', 6,0,9,2, (7,0), 'c', '#d8c7a0', [80,70,50],[236,222,186]),
 'A': ('Agartha', 0,0,4,3, (0,0), 'a', '#c58cff', [60,40,90],[214,180,255]),
 'T': ('The Tunnel-Way', 5,3,9,7, (7,3), 't', '#ffb347', [90,60,20],[255,214,150]),
 'L': ('The Long Tunnel', 2,4,4,8, (3,4), 'l', '#c9a36a', [70,56,40],[226,200,160]),
 'W': ('The West Tunnel', 1,9,4,11, (3,9), 'e', '#9ad0ff', [30,60,90],[180,220,255]),
 'K': ('The Cavern', 5,8,10,10, (7,8), 'v', '#ff8a5c', [90,40,24],[255,190,160]),
 'H': ('Hollow Earth', 5,11,10,14, (8,11), 'h', '#ffe14a', [90,80,10],[255,240,150]),
}
order = ['S','C','A','T','L','W','K','H']
hi = {'S':0,'C':-4,'A':-10}
links = [('C',(7,2),'T',(7,3),'primary'),('A',(3,3),'L',(3,4),'primary'),('L',(3,8),'W',(3,9),'primary'),('T',(7,7),'K',(7,8),'primary'),('K',(8,10),'H',(8,11),'primary'),
         ('L',(4,6),'T',(5,6),'ladder'),('S',(10,5),'T',(9,5),'ladder'),('W',(4,10),'K',(5,10),'ladder')]
level = {}; dist = {}; tree = {}; extra = {}; where = {}; parent = {}; wt = {}
STEP = {'S':[1,1,1,2],'C':[1,1,2],'A':[1,2,2,3],'T':[1,2,2,3],'L':[2,2,3],'W':[1,2,2],'K':[3,4,5,6],'H':[4,5,6,8,10]}
SHAFT = {'T':6,'L':8,'W':5,'K':12,'H':16}
def carve(k):
    name,x0,y0,x1,y1,entry,*_ = D[k]; cells=[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]
    seen={entry:0}; act=[entry]; edges=[]
    while act:
        i = len(act)-1 if random.random()<0.55 else random.randrange(len(act)); c=act[i]
        nb=[(c[0]+dx,c[1]+dy) for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)) if (c[0]+dx,c[1]+dy) in cells and (c[0]+dx,c[1]+dy) not in seen]
        if not nb: act.pop(i); continue
        n=random.choice(nb); seen[n]=seen[c]+1; edges.append((c,n)); act.append(n); parent[n]=c
    return cells, seen, edges
for k in order:
    cells, seen, edges = carve(k); dist[k]=seen; tree[k]=edges
    for c in cells: where[c]=k
for k in order:
    if k not in hi:
        l=[q for q in links if q[2]==k and q[4]=='primary'][0]; hi[k]=level[l[1]]-SHAFT[k]
    level[D[k][5]]=hi[k]; wt[D[k][5]]=1
    for a,b in tree[k]:   # in carve order: a parent is always set before its child
        w = 0 if (wt[a] != 0 and random.random() < 0.22) else random.choice(STEP[k]); wt[b]=w; level[b]=level[a]-w
    ex=[]; ts=set(tree[k])|set((b,a) for a,b in tree[k])
    for c in dist[k]:
        for dx,dy in ((1,0),(0,1)):
            n=(c[0]+dx,c[1]+dy)
            if n in dist[k] and (c,n) not in ts and abs(level[c]-level[n])>=2 and random.random()<0.45: ex.append((c,n))
    extra[k]=ex
base=min(level.values())
for c in level: level[c]-=base
for k in hi: hi[k]-=base
DUMBL=level[(14,5)]-12
# the side joins: the pair of touching plots whose levels are nearest
def best(ka,xa,kb,xb,ys): y=min(ys,key=lambda y: abs(level[(xa,y)]-level[(xb,y)])); return (ka,(xa,y),kb,(xb,y),'ladder')
links=[q for q in links if q[4]=='primary']+[best('L',4,'T',5,range(4,8)),best('S',10,'T',9,range(3,6)),best('W',4,'K',5,range(9,11))]
steps=[]; stairs=[]; labels=[]; plots=[]; branches=[]
ctr=lambda c:(3*c[0]+1,3*c[1]+1)
def arm(a,b):
    ax,ay=ctr(a); dx,dy=b[0]-a[0],b[1]-a[1]; return (ax+dx,ay+dy)
chamber=set()
for k in order:
    chamber.add(D[k][5])
for l in links: chamber.add(l[1]); chamber.add(l[3])
sun=min(dist['H'], key=lambda c: level[c]); chamber.add(sun)
for k in order:
    t=D[k][6]
    for c in dist[k]:
        x,y=ctr(c)
        if c in chamber: steps.append("['area', %d, %d, %d, %d, '%s', %d]"%(x-1,y-1,x+1,y+1,t,level[c]))
        else: steps.append("['set', %d, %d, '%s', %d]"%(x,y,t,level[c]))
        plots.append("[%d, %d, '%s %d', '%s', null, %d]"%(c[0],c[1],D[k][0],dist[k][c]+1,k,level[c]))
    for a,b in tree[k]:
        p,q=arm(a,b),arm(b,a); steps.append("['set', %d, %d, '%s', %d]"%(p[0],p[1],t,level[a])); steps.append("['set', %d, %d, '%s', %d]"%(q[0],q[1],t,level[b]))
        if level[a]!=level[b]: stairs.append("[[%d, %d], [%d, %d]]"%(p[0],p[1],q[0],q[1]))
    for a,b in extra[k]:
        p,q=arm(a,b),arm(b,a); steps.append("['set', %d, %d, '%s', %d]"%(p[0],p[1],t,level[a])); steps.append("['set', %d, %d, '%s', %d]"%(q[0],q[1],t,level[b]))
        h,lo=(a,b) if level[a]>level[b] else (b,a); hp=arm(h,lo)
        branches.append("{ at: [%d, %d], kind: 'drop', to: 'a cliff or a waterfall in %s: %d levels straight down, one way' }"%(hp[0],hp[1],D[k][0],abs(level[a]-level[b])))
    leaves=[c for c in dist[k] if sum(1 for e in tree[k] if c in e)==1 and c!=D[k][5] and c not in chamber]
    for c in leaves[:4]:
        x,y=ctr(c); branches.append("{ at: [%d, %d], kind: 'dead end', to: 'a dead end in %s with something in it (a secret, bones, a nest, a flooded sump)' }"%(x,y,D[k][0]))
    x0,y0,x1,y1=D[k][1:5]; labels.append("['label', %s, %s, '%s', 'mark']"%((x0+x1)*1.5+1, 3*y1+2.6, D[k][0].upper()+' · %d to %d'%(min(level[c] for c in dist[k]), hi[k])))
for a_k,a,b_k,b,kind in links:
    p,q=arm(a,b),arm(b,a); steps.append("['set', %d, %d, '%s', %d]"%(p[0],p[1],D[a_k][6],level[a])); steps.append("['set', %d, %d, '%s', %d]"%(q[0],q[1],D[b_k][6],level[b]))
    if level[a]!=level[b]: stairs.append("[[%d, %d], [%d, %d]]"%(p[0],p[1],q[0],q[1]))
    branches.append("{ at: [%d, %d], kind: 'ladder', to: '%s from %s (%d levels)' }"%(p[0],p[1],D[b_k][0],D[a_k][0],abs(level[a]-level[b])))
sx,sy=ctr(sun); labels.append("['label', %d, %s, 'THE INNER SUN', 'mark']"%(sx,sy+2.3))
# the D.U.M.B. (thread 8 holds it): a block, as it is
for x in range(11,18):
    for y in range(6,13): plots.append("[%d, %d, 'The D.U.M.B.', 'D', 0, %d, { flat: DUMB }]"%(x,y,DUMBL))
steps.append("['area', 33, 18, 53, 38, 'd', %d]"%DUMBL); labels.append("['label', 43, 28, 'THE D.U.M.B.', 'place']"); labels.append("['label', 43, 29.4, 'thread 8 holds it: its own plan', 'note']")
# links to the D.U.M.B.
for (a,pa,b) in [('S',(14,5),(14,6))]:
    p=arm(pa,b); q=(p[0]+(b[0]-pa[0]),p[1]+(b[1]-pa[1])); steps.append("['set', %d, %d, '%s', %d]"%(p[0],p[1],D[a][6],level[pa])); stairs.append("[[%d, %d], [%d, %d]]"%(p[0],p[1],q[0],q[1]))
    branches.append("{ at: [%d, %d], kind: 'ladder', to: 'the D.U.M.B. from %s' }"%(p[0],p[1],D[a][0]))
def door(c,side,to):
    x,y=ctr(c); return "[%d, %d, '%s', %s, %d]"%(x,y,side,json.dumps(to),level[c])
doors=[door((13,0),'N','Disaster City (the Culverts)'),door((16,2),'E','Disaster City (a manhole)'),door((11,3),'N','Disaster City (the Holding Cells)'),door((7,0),'N','the Vatican (the Basilica\'s stair)'),door((9,1),'E','Hell (the warm wall)'),
 door((0,0),'N','the Mountains (the Lemuria adit)'),door((6,4),'N','The Woods (the shaft under Dead Man\'s Cave)'),door((1,10),'W','The Estate (the well)'),door((10,9),'E','Hell (the cave)')]
tiles=', '.join("%s: ['%s', true, %s, %s]"%(D[k][6],D[k][0].replace("'","\\'"),D[k][8],D[k][9]) for k in order)+", d: ['The D.U.M.B. (its own plan)', true, [90,96,104],[150,156,164]]"
dists=', '.join("%s: { name: '%s', color: '%s' }"%(k,D[k][0].replace("'","\\'"),D[k][7]) for k in order)+", D: { name: 'The D.U.M.B. (thread 8)', color: '#9aa0a6', skip: DUMB }"
n=sum(len(dist[k]) for k in order)
head = '''/* THE WHOLE UNDERGROUND: THE LAYOUT OF EVERY DISTRICT AS ONE LABYRINTH (threads 7, 9, 10). A LAYOUT, plot by plot: not yet square by square.
   A PROPOSAL: nothing is built from it until mondo says so.
       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/underground.js
   mondo 2026-11-20: "The entire underground needs to be like a labyrinth. Make the layout for the entire underground, all districts",
   and on the tunnels: "Does it have to be so long? 10 rows?". And before: "we need victory road. labyrinth, height diffs, cliffs, drops
   waterfalls, underground horror like the descent movie".
   WHAT CHANGES. Today the underground is %d plots of which about 100 are straight corridor (the Long Tunnel 10 in a line, the West Tunnel
   18, the Tunnel-Way 34, the walks under the city 35). In this layout THE CORRIDORS ARE GONE: every tunnel is a compact maze district,
   and the eight districts lock together as ONE labyrinth of %d plots that goes DOWN from the city to the Inner Sun.
   HOW TO READ IT. One plot = 3 x 3 boxes. A lone box in a plot is a passage junction; a full 3 x 3 is a chamber (an entrance, a join
   between two districts, the Inner Sun). The number is the LEVEL (1.75 m each): the Sewers are the top (@TOP@), the Inner Sun the bottom (0): @M@ m deep.
   An ORANGE BAR is a climb you can do both ways (a ladder, a stair, a scramble). A WHITE BAR with a tooth is a CLIFF or a WATERFALL: down
   only. Two boxes side by side at one level are a walk. No passage runs straight for three plots.
   EACH DISTRICT IS ENTERED AT ITS TOP AND GOES DOWN AS YOU GO IN, so in any of them "down" means "deeper in". The drops are the short
   cuts; the dead ends each hold something. The square-by-square plan of each district is drawn from this, in the pattern of
   plans/tunnel-long.js (which shrinks to this layout's 15 plots).
   HOW DEEP (mondo 11-20). A first layout was 42 m deep: "That's only 1 plot. This is the CAVERN ... The most Cavernous cave to ever exist.
   Yes it should be deeper ... As long as its possible to climb back out from the bottom". A second was 752 m with climbs of 100 m: "100 m ladder
   seems very excessive. that is more than the football field ... pick number somewhere in between 1 plot and 18 plots deep. Do like 6 or 7".
   So: about 6 to 7 plots deep (roughly 270 m). The Sewers step down a level at a time; the tunnels 1 to 3; the Cavern 3 to 6; Hollow Earth 4 to 10.
   The shafts between districts are 5 to 16 levels, so NO SINGLE CLIMB IS OVER 16 LEVELS (28 m). Every climb (orange) is two-way: you can always
   climb back out from the Inner Sun to the city, and the tool checks it.
   THIS LAYOUT WAS LAID BY A SEEDED MAZE RULE (docs/plans/world-polish/underground/gen-layout.py; it also writes graph.json): it is the SHAPE that is proposed; a district's
   own thread may redraw its maze as long as its joins and its levels at the joins stay. */
'use strict';
const DUMB = 'the D.U.M.B. is thread 8\\'s: its own plan; shown as a block with its join to the Sewers (its deeper joins are decided by its own plan)';
module.exports = {
    zone: 'The Underground (all districts)', thread: '7 + 9 + 10', maze: true,
    schematic: 'A LAYOUT: one plot = 3 x 3 boxes (not battle squares). The number is the LEVEL (1 level = 1.75 m) ABOVE THE INNER SUN: the Sewers under the city are @TOP@ (@M@ m up), the Inner Sun is 0. ORANGE BAR = a climb, both ways (ladder, stair). WHITE BAR with a tooth = a cliff or a waterfall, DOWN only. Orange dots = the ways in from the surface and from Hell. Each district is entered at its top and goes down as you go in. A PROPOSAL.',
    title: 'THE WHOLE UNDERGROUND: every district as one labyrinth, @M@ m deep, from the Sewers (@TOP@) down to the Inner Sun (0) (a proposal)',
    noBuildings: 'a layout', mass: 'rock', massHeight: 6,
    tiles: { %s },
    grid: { w: 54, h: 45, n: 3 }, start: [40, 1],
    districts: { %s },
    plots: [
        %s],
    steps: [
        %s],
    stairs: [%s],
    branches: [
        %s],
    doors: [%s],
    flats: [{ name: 'The Inner Sun', rect: [%d, %d, %d, %d], why: 'the chamber of the Inner Sun: the lowest place in the underground' }], buildings: [], landmarks: [], lookouts: [], found: [],
    picture: { S: 30 },
};
''' % (166, n, tiles, dists, ',\n        '.join(plots), ',\n        '.join(steps+labels), ', '.join(stairs), ',\n        '.join(branches), ', '.join(doors), sx-1, sy-1, sx+1, sy+1)
head=head.replace('@TOP@',str(hi['S'])).replace('@M@',str(round(hi['S']*1.75)))
open(os.path.join(HERE, '..', 'plans', 'underground.js'),'w').write(head)
# the graph, for the square-by-square district plans (gen-district.py reads it)
G = { 'districts': {k: {'name': D[k][0], 'rect': list(D[k][1:5]), 'entry': list(D[k][5]), 'tile': D[k][6], 'color': D[k][7], 'lo': D[k][8], 'hi': D[k][9]} for k in order},
      'plots': [{'x': c[0], 'y': c[1], 'd': where[c], 'level': level[c], 'chamber': c in chamber} for c in level],
      'edges': [{'a': list(a), 'b': list(b), 'kind': 'walk' if level[a]==level[b] else 'climb'} for k in order for a,b in tree[k]] + [{'a': list(a), 'b': list(b), 'kind': 'drop'} for k in order for a,b in extra[k]],
      'links': [{'a': list(a), 'b': list(b), 'da': ka, 'db': kb} for ka,a,kb,b,_ in links] + [{'a': [14,5], 'b': [14,6], 'da': 'S', 'db': 'D'}],
      'doors': [{'plot': list(p), 'to': t} for p,t in [((13,0),'Disaster City (the Culverts)'),((16,2),'Disaster City (a manhole)'),((11,3),'Disaster City (the Holding Cells)'),((7,0),"the Vatican (the Basilica's stair)"),((9,1),'Hell (the warm wall)'),((0,0),'the Mountains (the Lemuria adit)'),((6,4),"The Woods (the shaft under Dead Man's Cave)"),((1,10),'The Estate (the well)'),((10,9),'Hell (the cave)')]],
      'sun': list(sun), 'dumbLevel': DUMBL }
json.dump(G, open(os.path.join(HERE, 'graph.json'),'w'), indent=0)
print(n, {k:(hi[k], min(level[c] for c in dist[k])) for k in order}, 'drops', sum(len(extra[k]) for k in order), 'sun', sun, level[sun])
