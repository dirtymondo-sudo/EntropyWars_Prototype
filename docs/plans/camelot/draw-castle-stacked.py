# CAMELOT CASTLE as ONE stacked building (mondo 11-15: "can we make the 3 rooms stacked like part of the same building, but the castle can be
# its own loading screen" + "real architecture/floor plan"). A plan for his OK, nothing built. python3 draw-castle-stacked.py
import math
from PIL import Image, ImageDraw, ImageFont
def font(n,b=False):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
    except: return ImageFont.load_default()
W,H=1900,3080
PAPER=(244,240,230);INK=(34,34,40);GRID=(226,220,206);STONE=(226,220,206);WOOD=(222,198,158);MARB=(238,236,230);BLUEF=(206,216,236);DARKF=(196,190,184);WATER=(150,190,226);VOID=(244,240,230);GOLD=(190,130,20);RED=(170,44,50);ROOF=(110,128,172);GREEN=(190,214,170);PURP=(214,202,232)
IMG=Image.new('RGB',(W,H),PAPER); d=ImageDraw.Draw(IMG)
S=26
class Plan:
    def __init__(s,ox,oy,title,sub): s.ox=ox; s.oy=oy; d.text((ox,oy-44),title,font=font(17,True),fill=INK); d.text((ox,oy-22),sub,font=font(11),fill=(90,90,96))
    def X(s,x): return s.ox+(x+9.4)*S
    def Y(s,y): return s.oy+(y+1.4)*S
    def grid(s,x0,y0,x1,y1):
        for i in range(int(x0),int(x1)+1): d.line([s.X(i),s.Y(y0),s.X(i),s.Y(y1)],fill=GRID)
        for j in range(int(y0),int(y1)+1): d.line([s.X(x0),s.Y(j),s.X(x1),s.Y(j)],fill=GRID)
    def room(s,x0,y0,x1,y1,fill,name=None,sub=None,n=10,wall=4):
        d.rectangle([s.X(x0),s.Y(y0),s.X(x1),s.Y(y1)],fill=fill)
        if wall: d.rectangle([s.X(x0),s.Y(y0),s.X(x1),s.Y(y1)],outline=INK,width=wall)
        if name: s.label((x0+x1)/2,(y0+y1)/2-(0.28 if sub else 0),name,n,True)
        if sub: s.label((x0+x1)/2,(y0+y1)/2+0.32,sub,8)
    def label(s,x,y,t,n=10,b=False,fill=INK):
        f=font(n,b); lines=t.split('\n'); yy=s.Y(y)-len(lines)*(n+2)/2
        for l in lines: w=d.textlength(l,font=f); d.text((s.X(x)-w/2,yy),l,font=f,fill=fill); yy+=n+2
    def shell(s,x0,y0,x1,y1): d.rectangle([s.X(x0),s.Y(y0),s.X(x1),s.Y(y1)],outline=INK,width=9)
    def door(s,x,y,o,w=0.55,fill=STONE,arc=True):   # o: 'h' = a door in a wall running east-west, 'v' = north-south
        if o=='h': d.rectangle([s.X(x-w/2),s.Y(y)-6,s.X(x+w/2),s.Y(y)+6],fill=fill); 
        else: d.rectangle([s.X(x)-6,s.Y(y-w/2),s.X(x)+6,s.Y(y+w/2)],fill=fill)
        if arc:
            r=w*S
            if o=='h': d.arc([s.X(x-w/2)-r,s.Y(y)-r,s.X(x-w/2)+r,s.Y(y)+r],0,90,fill=INK); d.line([s.X(x-w/2),s.Y(y),s.X(x-w/2),s.Y(y)+r],fill=INK)
            else: d.arc([s.X(x)-r,s.Y(y-w/2)-r,s.X(x)+r,s.Y(y-w/2)+r],0,90,fill=INK); d.line([s.X(x),s.Y(y-w/2),s.X(x)+r,s.Y(y-w/2)],fill=INK)
    def stair(s,x0,y0,x1,y1,up,txt='UP'):   # up: 'N','S','E','W' = the way it climbs
        d.rectangle([s.X(x0),s.Y(y0),s.X(x1),s.Y(y1)],fill=(250,248,242),outline=INK,width=2)
        if up in 'NS':
            n=int((y1-y0)*4)
            for i in range(1,n): yy=s.Y(y0+(y1-y0)*i/n); d.line([s.X(x0),yy,s.X(x1),yy],fill=INK)
            a,b=(s.Y(y1)-5,s.Y(y0)+5) if up=='N' else (s.Y(y0)+5,s.Y(y1)-5); xm=s.X((x0+x1)/2); d.line([xm,a,xm,b],fill=GOLD,width=2); k=6 if up=='N' else -6; d.polygon([(xm,b),(xm-5,b+k),(xm+5,b+k)],fill=GOLD)
        else:
            n=int((x1-x0)*4)
            for i in range(1,n): xx=s.X(x0+(x1-x0)*i/n); d.line([xx,s.Y(y0),xx,s.Y(y1)],fill=INK)
            a,b=(s.X(x0)+5,s.X(x1)-5) if up=='E' else (s.X(x1)-5,s.X(x0)+5); ym=s.Y((y0+y1)/2); d.line([a,ym,b,ym],fill=GOLD,width=2); k=-6 if up=='E' else 6; d.polygon([(b,ym),(b+k,ym-5),(b+k,ym+5)],fill=GOLD)
        if txt: s.label((x0+x1)/2,(y0+y1)/2,txt,8,True,GOLD)
    def tower(s,cx,cy,r,fill=STONE,spiral=True,t=None):
        d.ellipse([s.X(cx-r),s.Y(cy-r),s.X(cx+r),s.Y(cy+r)],fill=fill,outline=INK,width=5)
        if spiral:
            for i in range(10): a=i*math.pi/5; d.line([s.X(cx),s.Y(cy),s.X(cx+math.cos(a)*(r-0.18)),s.Y(cy+math.sin(a)*(r-0.18))],fill=INK)
            d.ellipse([s.X(cx)-4,s.Y(cy)-4,s.X(cx)+4,s.Y(cy)+4],fill=INK)
        if t: s.label(cx,cy+r+0.35,t,8)
    def col(s,cx,cy,r=0.2): d.ellipse([s.X(cx-r),s.Y(cy-r),s.X(cx+r),s.Y(cy+r)],fill=INK)
    def dash(s,x0,y0,x1,y1):
        def seg(ax,ay,bx,by):
            L=math.hypot(bx-ax,by-ay); n=max(1,int(L/10))
            for i in range(0,n,2): d.line([ax+(bx-ax)*i/n,ay+(by-ay)*i/n,ax+(bx-ax)*(i+1)/n,ay+(by-ay)*(i+1)/n],fill=INK,width=2)
        A=[(s.X(x0),s.Y(y0)),(s.X(x1),s.Y(y0)),(s.X(x1),s.Y(y1)),(s.X(x0),s.Y(y1))]
        for i in range(4): seg(*A[i],*A[(i+1)%4])
    def dot(s,x,y,t,dx=0,dy=0.55): d.ellipse([s.X(x)-7,s.Y(y)-7,s.X(x)+7,s.Y(y)+7],fill=GOLD,outline=INK,width=2); s.label(x+dx,y+dy,t,9,True,GOLD)
    def dim(s,x0,x1,y,t): d.line([s.X(x0),s.Y(y),s.X(x1),s.Y(y)],fill=(120,120,126)); 
    def dims(s,x0,x1,y,t):
        d.line([s.X(x0),s.Y(y),s.X(x1),s.Y(y)],fill=(110,110,116))
        for x in (x0,x1): d.line([s.X(x),s.Y(y)-5,s.X(x),s.Y(y)+5],fill=(110,110,116))
        s.label((x0+x1)/2,y+0.32,t,9,False,(90,90,96))
def towers(p,keep=True,wing=True,spiral=('nw','ne'),fill=STONE):
    if keep:
        for k,(cx,cy) in {'nw':(0,0),'ne':(14,0),'sw':(0,12),'se':(14,12)}.items(): p.tower(cx,cy,1.0,fill,k in spiral)
    if wing:
        for (cx,cy,r) in ((-8,2,1.05),(22,2,1.05),(-8,10,1.2),(22,10,1.2)): p.tower(cx,cy,r,fill,False)
d.text((40,22),'CAMELOT CASTLE  ·  ONE BUILDING, EVERY FLOOR STACKED  ·  floor plans for your OK',font=font(26,True),fill=INK)
d.text((40,58),'Nothing on this page is built. One faint square = 3.5 m. North is up. Gold dots = ways in and out. Gold arrows = the way a stair climbs.',font=font(13),fill=(80,80,86))
d.text((40,78),'The castle becomes its own room with its own loading screen: you walk in through the portal on the upper court. Inside there are no more loading screens from the cellar to the clouds.',font=font(13),fill=(80,80,86))
COLA,COLB=40,970
# ───────── L0 GROUND ─────────
p=Plan(COLA,170,'FLOOR 0 · THE GROUND FLOOR  (+0 m, the upper court\'s level)','The Throne Hall is 14 m high (two floors). Kitchen wing west, Barracks wing east: mirror images.')
p.grid(-9,-1,23,13)
p.room(0,3,14,12,MARB)
p.room(5.5,3.2,8.5,4.6,(232,206,150),None,None,10,2); p.label(7,3.9,'DAIS · THRONE',9,True)
d.rectangle([p.X(6.6),p.Y(4.6),p.X(7.4),p.Y(11.9)],fill=(200,150,150)); d.ellipse([p.X(5.9),p.Y(6.0),p.X(8.1),p.Y(7.6)],fill=MARB,outline=INK,width=3); p.label(7,6.8,'Round Table',8)
p.label(7,8.6,'THE THRONE HALL',13,True); p.label(7,9.3,'49 x 31 m · 14 m high',9)
for y in (4.2,5.6,7.0,8.4,9.8,11.0):
    for x in (3.2,10.8): p.col(x,y)
p.room(0,0,4.5,3,WOOD,'ROBING ROOM','the king\'s way in'); p.room(4.5,0,9.5,3,STONE); p.label(7,0.45,'THE GREAT STAIR HALL',9,True); p.room(9.5,0,14,3,WOOD,'CHANCERY','scribes, seals, maps')
p.stair(5.0,1.0,6.4,2.6,'N','UP'); p.stair(7.6,1.0,9.0,2.6,'N','UP'); p.stair(6.5,1.2,7.5,2.6,'S','DOWN')
p.room(-8,2,-3,10,STONE,'THE GREAT KITCHEN','two hearths, the bread ovens'); p.room(-3,2,0,4.6,WOOD,'BUTTERY','ale, wine'); p.room(-3,4.6,0,7.2,WOOD,'PANTRY','bread, the stores'); p.room(-3,7.2,0,10,STONE,'SERVERY','to the hall')
p.room(17,2,22,10,STONE,'THE BARRACKS','the Knights\' beds and mess'); p.room(14,2,17,4.6,WOOD,'ARMS STORE','racks, harness'); p.room(14,4.6,17,7.2,WOOD,"CAPTAIN'S\nROOM"); p.room(14,7.2,17,10,STONE,'GUARD\nROOM')
p.shell(0,0,14,12); p.shell(-8,2,0,10); p.shell(14,2,22,10)
towers(p)
for x in (5,9): p.tower(x,12.35,0.62,STONE,False)
p.door(7,12,'h',1.2,MARB,False); p.door(4.8,3,'h',0.6,MARB); p.door(9.2,3,'h',0.6,MARB); p.door(2,3,'h',0.5,MARB); p.door(12,3,'h',0.5,MARB)
p.door(0,8.6,'v',0.7,STONE); p.door(14,8.6,'v',0.7,STONE); p.door(-3,6,'v',0.5,STONE); p.door(-3,3.3,'v',0.5,STONE); p.door(-3,8.6,'v',0.6,STONE); p.door(17,6,'v',0.5,STONE); p.door(17,3.3,'v',0.5,STONE); p.door(17,8.6,'v',0.6,STONE)
p.door(-1.5,10,'h',0.6,STONE); p.door(15.5,10,'h',0.6,STONE)
p.dot(7,12.9,'THE PORTAL: in from the upper court (the loading screen)',0,0.6); p.dot(-1.5,10.7,'kitchen door',0,0.5); p.dot(15.5,10.7,'guard door',0,0.5)
p.dims(0,14,-1.0,'the Keep 49 m'); p.dims(-8,0,0.8,'wing 28 m'); p.dims(14,22,0.8,'wing 28 m')
# ───────── SECTION ─────────
SX,SY,SM=COLB+430,950,6.5
d.text((COLB,126),'THE CUT · through the middle, looking west (south is left)',font=font(17,True),fill=INK); d.text((COLB,148),'Every floor at its height. One room, one building: no loading screen between any two of these.',font=font(11),fill=(90,90,96))
X=lambda m:SX+m*SM; Y=lambda m:SY-m*SM
def sbox(x0,x1,y0,y1,c,w=2): d.rectangle([X(x0),Y(y1),X(x1),Y(y0)],fill=c,outline=INK,width=w)
def slab(x0,x1,y): d.rectangle([X(x0),Y(y)-3,X(x1),Y(y)+3],fill=INK)
def stx(x,y,t,n=10,b=False,fill=INK): f=font(n,b); w=d.textlength(t,font=f); d.text((X(x)-w/2,Y(y)-n/2),t,font=f,fill=fill)
d.rectangle([COLB,Y(0),COLB+880,Y(-12)],fill=(206,198,186)); d.line([COLB,Y(0),COLB+880,Y(0)],fill=INK,width=2)
sbox(-22,22,-7,0,DARKF); sbox(-21,21,-6.6,-0.5,(214,206,198),1); d.rectangle([X(-6),Y(-4.6),X(6),Y(-6.6)],fill=WATER); stx(0,-3,"UNDERCROFT  −7 m",11,True); stx(-34,-3.5,'the sally port',9,True,GOLD); d.line([X(-21),Y(-5),X(-44),Y(-5)],fill=GOLD,width=3)
sbox(-21,21,0,28,(250,248,242),4)
sbox(-12,21,0.3,13.7,MARB,1); stx(4,7,'THE THRONE HALL',11,True); stx(4,4.6,'14 m high',9)
sbox(-21,-12,0.3,6.7,STONE,1); pass; sbox(-21,-12,7.3,13.7,STONE,1); pass
slab(-21,-12,7); slab(-21,21,14); slab(-21,21,21); slab(-21,21,28)
for x in (-12,2,12): d.line([X(x),Y(14.3),X(x),Y(20.7)],fill=INK,width=2)
for x in (-12,): d.line([X(x),Y(21.3),X(x),Y(27.7)],fill=INK,width=2)
stx(-5,17.5,'LONG GALLERY',8); stx(7,17.5,'SOLAR',8); stx(16.5,17.5,'window',8)
stx(4,24.5,'THE LIBRARY',10,True)
ZZ=[(-17,0.4),(-12.6,7),(-17,14),(-12.6,21),(-17,28)]
for i in range(4): d.line([X(ZZ[i][0]),Y(ZZ[i][1]),X(ZZ[i+1][0]),Y(ZZ[i+1][1])],fill=GOLD,width=3)
stx(36,3.5,'+0  FLOOR 0',10,True); stx(36,10.5,'+7  FLOOR 1',10,True); stx(36,17.5,'+14 FLOOR 2',10,True); stx(36,24.5,'+21 FLOOR 3',10,True); stx(42,30.5,'+28 THE BATTLEMENTS',10,True); stx(-36,14,'the Great Stair',9,True,GOLD)
d.polygon([(X(-19),Y(28.4)),(X(19),Y(28.4)),(X(9),Y(39)),(X(-9),Y(39))],fill=ROOF,outline=INK)
for s in (-1,1): sbox(s*21-3.4,s*21+3.4,0,34,(250,248,242),3); d.polygon([(X(s*21-4.4),Y(34)),(X(s*21+4.4),Y(34)),(X(s*21),Y(46))],fill=ROOF,outline=INK)
sbox(-5.5,5.5,30,52,(250,248,242),3); slab(-5.5,5.5,44); stx(0,48,'SPIRE ROOM',8,True); stx(18,48,'+44',10,True); d.polygon([(X(-6.5),Y(52)),(X(6.5),Y(52)),(X(0),Y(72))],fill=ROOF,outline=INK)
d.line([X(-3),Y(28.4),X(3),Y(44)],fill=GOLD,width=3); stx(-22,43,'spiral up the Spire',9,True,GOLD)
for i,(x,y) in enumerate(((-12,50),(-19,56),(-26,62),(-19,68),(-12,74),(-5,80))): d.rectangle([X(x),Y(y+1),X(x+6),Y(y)],fill=STONE,outline=INK)
d.line([X(-5.5),Y(46),X(-9),Y(51)],fill=GOLD,width=3); stx(-40,60,'the floating flights',9,True,GOLD)
for cx,cy,r in ((-30,86,14),(-10,84,18),(14,85,18),(34,87,13)): d.ellipse([X(cx-r),Y(cy+r*0.35),X(cx+r),Y(cy-r*0.35)],fill=(250,250,255),outline=(170,180,200))
sbox(-12,12,88,100,(250,248,242),3); stx(0,94,'THE KEEP IN THE AIR',9,True)
for s in (-1,1): sbox(s*12-2.4,s*12+2.4,88,105,(250,248,242),2); d.polygon([(X(s*12-3.2),Y(105)),(X(s*12+3.2),Y(105)),(X(s*12),Y(112))],fill=ROOF,outline=INK)
d.polygon([(X(-4),Y(100)),(X(4),Y(100)),(X(0),Y(113))],fill=ROOF,outline=INK)
stx(40,96,'+88 THE CASTLE IN THE SKY',10,True); d.line([X(14.4),Y(89),X(44),Y(89)],fill=GOLD,width=3); stx(36,86.5,'the Sky Bridge (to Heaven\'s stair)',9,True,GOLD)
stx(-40,1.6,'upper court',9); d.ellipse([X(-21)-7,Y(1.2)-7,X(-21)+7,Y(1.2)+7],fill=GOLD,outline=INK,width=2); stx(-33,-1.6,'',9)
stx(-38,5,'THE PORTAL',9,True,GOLD)
# ───────── L1 ─────────
p=Plan(COLA,640,'FLOOR 1 · THE GALLERY FLOOR  (+7 m)','A walk all round the Throne Hall, looking down into it. The wings\' upper floors.')
p.grid(-9,-1,23,13)
p.room(0,3,14,12,(232,228,220)); p.room(1.6,4.6,12.4,10.4,VOID,None,None,10,0); p.dash(1.6,4.6,12.4,10.4); p.label(7,7.2,'open to the Throne Hall below',10,True); p.label(7,7.9,'(the chandeliers hang here)',8)
p.label(7,11.2,'THE GALLERY',10,True); p.label(0.8,7.5,'gallery',8); p.label(13.2,7.5,'gallery',8); p.label(7,3.8,"MINSTRELS' GALLERY (over the dais)",9,True)
p.room(0,0,4.5,3,WOOD,"KING'S OFFICE"); p.room(4.5,0,9.5,3,STONE); p.label(7,0.45,'THE GREAT STAIR',9,True); p.room(9.5,0,14,3,WOOD,'TREASURY','the strong room')
p.stair(5.0,1.0,6.4,2.6,'S','UP'); p.stair(7.6,1.0,9.0,2.6,'S','UP'); 
p.room(-8,2,0,10,BLUEF); p.label(-4,5.6,'THE CHAPEL ROYAL',11,True); p.label(-4,6.3,'nave, altar at the west end, coloured glass',8)
for y in (3.4,8.6):
    for x in (-6.5,-4.5,-2.5): p.col(x,y,0.16)
p.room(-7.6,5.0,-6.6,7.0,(232,206,150),None,None,8,2)
p.room(14,2,22,10,WOOD); p.label(18,5.6,"THE KNIGHTS' HALL",11,True); p.label(18,6.3,'trophies, the tourney shields, a long table',8)
d.rectangle([p.X(15.5),p.Y(7.2),p.X(20.5),p.Y(7.9)],outline=INK,width=2)
p.shell(0,0,14,12); p.shell(-8,2,0,10); p.shell(14,2,22,10); towers(p)
p.door(4.8,3,'h',0.6,STONE); p.door(9.2,3,'h',0.6,STONE); p.door(0,6,'v',0.7,STONE); p.door(14,6,'v',0.7,STONE); p.door(2,3,'h',0.5,STONE); p.door(12,3,'h',0.5,STONE)
# ───────── L2 ─────────
p=Plan(COLA,1110,'FLOOR 2 · THE ROYAL FLOOR  (+14 m)','Over the Throne Hall. The wings stop below this floor: their roofs are walked on.')
p.grid(-9,-1,23,13)
p.room(-8,2,0,10,(214,214,210),None,None,10,0); p.room(14,2,22,10,(214,214,210),None,None,10,0)
p.room(-6.6,3.4,-1.4,8.6,ROOF,None,None,10,2); p.room(15.4,3.4,20.6,8.6,ROOF,None,None,10,2); p.label(-4,9.3,'THE WEST LEADS (roof walk)',9,True); p.label(18,9.3,'THE EAST LEADS (roof walk)',9,True); p.label(-4,6,'roof',9,False,(255,255,255)); p.label(18,6,'roof',9,False,(255,255,255))
p.room(0,5,14,7,MARB,'THE LONG GALLERY','portraits of the kings, armour, the windows at both ends')
p.room(0,7,5,12,WOOD,"THE KING'S SOLAR",'bed, hearth, map table'); p.room(5,7,9,12,MARB,'THE PRESENCE\nCHAMBER'); p.label(7,11.3,'behind the great window',8); p.room(9,7,14,12,WOOD,"THE QUEEN'S\nCHAMBER")
p.room(0,0,4.5,5,WOOD,'THE WARDROBE','robes, crowns'); p.room(4.5,0,9.5,5,STONE); p.label(7,0.45,'THE GREAT STAIR',9,True); p.room(9.5,0,14,5,WOOD,'THE NURSERY','a rocking horse')
p.stair(5.0,1.0,6.4,2.6,'N','UP'); p.stair(7.6,1.0,9.0,2.6,'N','UP')
p.shell(0,0,14,12); d.rectangle([p.X(-8),p.Y(2),p.X(0),p.Y(10)],outline=INK,width=5); d.rectangle([p.X(14),p.Y(2),p.X(22),p.Y(10)],outline=INK,width=5); towers(p)
p.door(7,5,'h',0.8,MARB); p.door(2.5,7,'h',0.5,MARB); p.door(7,7,'h',0.7,MARB); p.door(11.5,7,'h',0.5,MARB); p.door(2.5,5,'h',0.5,MARB); p.door(11.5,5,'h',0.5,MARB); p.door(0,6,'v',0.6,STONE); p.door(14,6,'v',0.6,STONE); p.door(5,9.5,'v',0.5,WOOD); p.door(9,9.5,'v',0.5,WOOD)
# ───────── L3 ─────────
p=Plan(COLB,1110,'FLOOR 3 · THE LIBRARY FLOOR  (+21 m)','The top floor under the roof.')
p.grid(-1,-1,15,13)
p.room(0,5,14,12,WOOD); p.label(7,8.3,'THE GREAT LIBRARY',13,True); p.label(7,9.0,'shelves to the ceiling, rolling ladders, reading desks, the globe',9)
for x in (1.5,3.5,5.5,8.5,10.5,12.5): d.rectangle([p.X(x-0.2),p.Y(5.8),p.X(x+0.2),p.Y(7.6)],fill=(150,110,70),outline=INK); d.rectangle([p.X(x-0.2),p.Y(9.8),p.X(x+0.2),p.Y(11.4)],fill=(150,110,70),outline=INK)
p.room(0,0,4.5,5,PURP,"MERLIN'S STUDY",'star charts, the owl'); p.room(4.5,0,9.5,5,STONE); p.label(7,0.45,'THE GREAT STAIR',9,True); p.label(7,4.2,'up to the Battlements',8); p.room(9.5,0,14,5,WOOD,'THE WAR ROOM','the kingdom in sand on a table')
p.stair(5.0,1.0,6.4,2.6,'S','UP'); p.stair(7.6,1.0,9.0,2.6,'S','UP')
p.shell(0,0,14,12); towers(p,True,False)
p.door(7,5,'h',0.8,WOOD); p.door(2.5,5,'h',0.5,WOOD); p.door(11.5,5,'h',0.5,WOOD)
# ───────── L4 battlements ─────────
p=Plan(COLA,1580,'THE BATTLEMENTS  (+28 m)  and THE SPIRE','The roof walk all round, the blue roof in the middle, the Spire out of it.')
p.grid(-1,-1,15,13)
p.room(0,0,14,12,(214,214,210)); p.room(1.6,1.6,12.4,10.4,ROOF,None,None,10,2)
d.rectangle([p.X(6.5),p.Y(0.2),p.X(7.5),p.Y(4.5)],fill=(214,214,210),outline=INK,width=2); p.label(9.7,3.2,'the bridge walk\nto the Spire',8,False,(255,255,255))
p.tower(7,6,1.6,STONE,True); p.label(7,8.2,'THE SPIRE: spiral up 16 m\nto the Spire Room',9,True,(255,255,255))
p.label(7,11.2,'the roof walk · the kingdom below · the ballista',9,True); p.label(0.8,6,'walk',8); p.label(13.2,6,'walk',8)
p.shell(0,0,14,12); towers(p,True,False,('nw','ne','sw','se'))
p.dot(7,0.9,'the Great Stair comes up here',0,-0.55)
q=Plan(COLA+470,1580,'THE SPIRE ROOM  (+44 m)','Round, 11 m across.')
q.ox=COLA+470-9.4*S+150; q.tower(4,5,2.6,PURP,False); q.label(4,4.3,'THE SPIRE ROOM',10,True); q.label(4,5.0,'the orrery, eight windows',8); q.stair(3.3,6.0,4.7,7.2,'N',''); q.dot(1.9,3.4,'the door to the sky:\nfloating flights go up',-0.2,-1.2)
# ───────── B1 undercroft ─────────
p=Plan(COLB,1580,"FLOOR −1 · MERLIN'S UNDERCROFT  (−7 m)",'Under the whole palace, the same outline. Vaulted stone, low, dark.')
p.grid(-9,-1,23,17)
p.room(3,4,11,10,PURP); p.label(7,5.0,"MERLIN'S WORKSHOP",11,True); d.ellipse([p.X(6),p.Y(6),p.X(8),p.Y(8)],fill=(170,226,255),outline=INK,width=3); p.label(7,8.6,'THE ORB (right under the throne)',9,True)
p.room(0,4,3,10,DARKF,'THE\nCELLS'); p.room(11,4,14,10,DARKF,'THE\nOSSUARY')
for y in (5.5,7,8.5): d.line([p.X(0),p.Y(y),p.X(3),p.Y(y)],fill=INK,width=2)
p.room(0,0,4.5,4,DARKF,"THE GAOLER'S\nROOM"); p.room(4.5,0,9.5,4,STONE); p.label(7,0.45,'THE GREAT STAIR (foot)',9,True); p.room(9.5,0,14,4,DARKF,'THE CRYPT\nOF KINGS'); p.stair(6.5,1.2,7.5,2.6,'N','UP')
p.room(0,10,14,12,STONE,'THE UNDERCROFT HALL','a row of fat pillars, torches')
for x in (2,4.5,9.5,12): p.col(x,11,0.25)
p.room(-8,2,0,10,WOOD); p.label(-4,5.2,'THE VAULTS',11,True); p.label(-4,5.9,'barrels, the stores (under the Kitchen)',8)
for y in (3.2,7.6):
    for x in (-7,-5.6,-4.2,-2.8,-1.4): d.ellipse([p.X(x-0.5),p.Y(y),p.X(x+0.5),p.Y(y+1)],outline=INK,width=2)
p.room(14,2,22,10,STONE); d.rectangle([p.X(15.2),p.Y(3.2),p.X(20.8),p.Y(8.8)],fill=WATER,outline=INK,width=2); p.label(18,5.6,'THE CISTERN',11,True); p.label(18,6.3,'waded, knee deep',8)
p.room(6,12,8,16.5,STONE,None,None,8,4); p.label(7,14.2,'THE SALLY\nPORT\ntunnel',8,True)
p.shell(0,0,14,12); p.shell(-8,2,0,10); p.shell(14,2,22,10)
p.door(7,4,'h',0.7,STONE); p.door(7,10,'h',0.7,STONE); p.door(3,7,'v',0.5,PURP); p.door(11,7,'v',0.5,PURP); p.door(0,6,'v',0.7,STONE); p.door(14,6,'v',0.7,STONE); p.door(2.2,4,'h',0.5,DARKF); p.door(11.8,4,'h',0.5,DARKF); p.door(7,12,'h',0.7,STONE)
p.dot(7,16.9,'out at the hill\'s foot, beside the Grand Stair',0,0.55); p.dot(18,8.2,'the well comes down here',0,1.2)
# ───────── SKY ─────────
p=Plan(COLA,2180,'THE CASTLE IN THE SKY  (+88 m, straight over the Spire)','The palace\'s small twin on the clouds. Every fall lands on the cloud deck.')
d.rectangle([p.X(-9),p.Y(-1),p.X(23),p.Y(13)],fill=(214,228,246))
for cx,cy,rx,ry in ((-3,9,6,3),(5,10.5,7,2.6),(14,10,7,3),(20,7,3.5,2.4),(-5,4,4,2.4),(7,6,9,5),(18,3,4,2)): d.ellipse([p.X(cx-rx),p.Y(cy-ry),p.X(cx+rx),p.Y(cy+ry)],fill=(252,252,255),outline=(190,200,220))
p.label(4,11.2,'THE CLOUD DECK (walked on)',10,True)
for i,(x,y) in enumerate(((-6,8),(-4.6,6.2),(-2.6,4.8))): p.stair(x,y,x+1.6,y+1.0,'E','')
p.label(-5,9.6,'the floating flights\ncome up from the Spire',8,True,GOLD)
p.room(2,3,12,9,MARB); p.label(7,5.2,'THE HALL IN THE AIR',11,True); p.label(7,5.9,'open colonnade, the dragon\'s perch over it',8)
for x in (3.2,5.2,8.8,10.8):
    for y in (3.8,8.2): p.col(x,y,0.16)
p.room(-1,4.5,2,7.5,GREEN,'CLOUD\nGARDEN'); p.room(12,4.5,15,7.5,PURP,'STAR\nCHAMBER')
p.shell(2,3,12,9); 
for cx,cy in ((2,3),(12,3),(2,9),(12,9)): p.tower(cx,cy,0.8,STONE,False)
p.tower(7,1.9,1.1,STONE,True,None); p.label(7,0.4,'THE SKY SPIRE (the tape)',9,True)
p.door(7,9,'h',1.0,MARB,False); p.door(2,6,'v',0.6,MARB); p.door(12,6,'v',0.6,MARB); p.door(7,3,'h',0.6,MARB)
d.line([p.X(15),p.Y(6),p.X(22.5),p.Y(6)],fill=INK,width=5); p.dot(22.2,6,'THE SKY BRIDGE\nto the stairway to heaven',-2.6,0.9)
# ───────── notes ─────────
nx,ny=COLB,2140
def note(t,b=False,c=INK):
    global ny
    d.text((nx,ny),t,font=font(13,b),fill=c); ny+=22
note('WHAT CHANGES IF YOU SAY YES',True)
for t in ('· A new room, CAMELOT CASTLE, holds all of this. The old Keep, Undercroft and Sky Castle rooms',
          '  are retired (their natives, lines and tapes move in).',
          '· In the kingdom the palace keeps its outside exactly as built. Its portal becomes the door',
          '  with the loading screen. The Throne Hall, Kitchen and Barracks you can walk into today in',
          '  the kingdom room move inside the castle room.',
          '· Ways in: the portal, the kitchen and guard doors (upper court), the sally port (hill foot),',
          '  the well (lower court), the Sky Bridge. The wardrobe stays on the upper court.',
          '· Who stands where: King Arthur at the throne, Merlin in his workshop, knights in the',
          '  barracks and on the battlements, skeleton + ghost in the Ossuary and Crypt, the dragon and',
          '  the fairy in the sky.'): note(t)
ny+=10; note('WHAT YOU SHOULD KNOW',True)
for t in ('· Rooms on top of rooms is the part of the engine used least so far (two road bridges in the',
          '  city). I build one stair and two floors first, check them, then the rest. If the engine',
          '  needs a fix for furniture or doors on an upper floor, that fix comes with it.',
          '· 5 floors + spire + sky in one room is big. If it loads too slowly I would split only the',
          '  sky off behind the Spire door, and tell you before I do.',
          '· Nothing here was seen in the game. These are plans.'): note(t)
ny+=10; note('I NEED FROM YOU',True,RED)
for t in ('1  Yes / no / change on this building as drawn.',
          '2  Should the sky castle really be in the same room (as drawn), or behind the Spire door?',
          '3  Any room you want added, removed or renamed.',
          '4  The village houses (five kinds, earlier picture) still wait for your yes or no.'): note(t)
IMG=IMG.crop((0,0,W,2700)); IMG.save('camelot_castle_stacked_plan.png'); print(IMG.size)
