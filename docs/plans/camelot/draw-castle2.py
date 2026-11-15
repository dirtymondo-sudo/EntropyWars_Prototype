from PIL import Image, ImageDraw, ImageFont
def font(n,b=True):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
    except: return ImageFont.load_default()
IMG=Image.new('RGB',(1800,1960),(22,24,22)); d=ImageDraw.Draw(IMG)
d.text((30,16),'CAMELOT CASTLE  ·  redesign 2 for your OK  ·  one palace on a hill, dead centre, symmetrical',font=font(24),fill=(255,255,255))
d.text((30,52),'Not built yet. Top: the front, seen from the Market (south). Bottom: the plan, north up, one small square = 3.5 m.',font=font(14,False),fill=(190,190,190))
# ================= FRONT VIEW =================
OX,GY,M=900,790,7.6   # centre x, ground y, px per metre
def X(m): return OX+m*M
def Y(m): return GY-m*M
d.rectangle([30,90,1770,GY],fill=(150,190,235)); d.rectangle([30,GY,1770,GY+50],fill=(98,150,74))
STONE=(196,192,184);STONE2=(170,166,160);STONE3=(214,208,196);BLUE=(74,92,140);DK=(60,58,66);GLASS=(250,214,120);RED=(176,44,54)
def box(x0,x1,y0,y1,c,o=DK): d.rectangle([X(x0),Y(y1),X(x1),Y(y0)],fill=c,outline=o)
def merl(x0,x1,y,c,step=2.0):
    x=x0
    while x<x1-0.5: d.rectangle([X(x),Y(y+1.0),X(x+1.1),Y(y)],fill=c,outline=DK); x+=step
def cone(cx,r,y,h,c=BLUE): d.polygon([(X(cx-r),Y(y)),(X(cx+r),Y(y)),(X(cx),Y(y+h))],fill=c,outline=DK)
def flag(cx,y): d.line([X(cx),Y(y),X(cx),Y(y+4)],fill=DK,width=2); d.polygon([(X(cx),Y(y+4)),(X(cx+3.2),Y(y+3.2)),(X(cx),Y(y+2.4))],fill=RED)
def tower(cx,r,y0,h,ch,c=STONE):
    box(cx-r,cx+r,y0,y0+h,c); box(cx-r-0.5,cx+r+0.5,y0+h,y0+h+1.2,STONE2); merl(cx-r-0.5,cx+r+0.5,y0+h+1.2,STONE2,1.6)
    cone(cx,r+0.9,y0+h+1.2,ch); flag(cx,y0+h+1.2+ch)
    for yy in range(int(y0+5),int(y0+h-2),6): d.rectangle([X(cx-0.35),Y(yy+2.2),X(cx+0.35),Y(yy)],fill=DK)
def wins(x0,x1,y,n,w=1.2,h=3.0):
    for i in range(n):
        cx=x0+(x1-x0)*(i+0.5)/n; d.rectangle([X(cx-w/2),Y(y+h),X(cx+w/2),Y(y)],fill=GLASS,outline=DK); d.pieslice([X(cx-w/2),Y(y+h+w/2),X(cx+w/2),Y(y+h-w/2)],180,360,fill=GLASS,outline=DK)
# village + town wall for scale (far left / right)
for s in (-1,1):
    box(s*100-6,s*100+6,0,7,(232,220,192)); d.polygon([(X(s*100-7),Y(7)),(X(s*100+7),Y(7)),(X(s*100),Y(11))],fill=(168,74,60),outline=DK)
    box(s*84-5,s*84+5,0,4.2,(216,200,168)); d.polygon([(X(s*84-6),Y(4.2)),(X(s*84+6),Y(4.2)),(X(s*84),Y(7.4))],fill=(122,90,60),outline=DK)
# tier 1: the hill's lower terrace (+3.5), tier 2 (+7)
box(-63,63,0,3.5,STONE2); merl(-63,63,3.5,STONE2)
box(-49,49,3.5,7,STONE2); merl(-49,49,7,STONE2)
# grand stair (centre) through both tiers
d.polygon([(X(-12),Y(0)),(X(12),Y(0)),(X(7),Y(7)),(X(-7),Y(7))],fill=STONE3,outline=DK)
for i in range(1,14): yy=i*0.5; w=12-5*yy/7; d.line([X(-w),Y(yy),X(w),Y(yy)],fill=(150,146,140))
# back row: rear towers (behind), drawn first
for s in (-1,1): tower(s*30,3.2,7,30,10,STONE2)
# wings (two storeys of hall, steep roofs)
for s in (-1,1):
    x0,x1=sorted((s*21,s*46)); box(x0,x1,7,21,STONE); merl(x0,x1,21,STONE)
    d.polygon([(X(x0+1),Y(22)),(X(x1-1),Y(22)),(X(x1-4),Y(30)),(X(x0+4),Y(30))],fill=BLUE,outline=DK)
    wins(x0+2,x1-2,9.5,5); wins(x0+2,x1-2,15.5,5,1.0,2.4)
# corner towers on the wings' ends
for s in (-1,1): tower(s*46,4.2,7,24,11)
# the central keep: tall block, great window, twin front turrets, the great spire
box(-21,21,7,35,STONE3); merl(-21,21,35,STONE3)
d.polygon([(X(-19),Y(36)),(X(19),Y(36)),(X(12),Y(46)),(X(-12),Y(46))],fill=BLUE,outline=DK)
tower(0,5.5,36,22,20,STONE3)       # the great spire on the roof
for s in (-1,1): tower(s*21,3.4,7,34,12,STONE3)
for s in (-1,1): tower(s*8,2.2,7,22,8,STONE)   # the door's twin turrets
box(-5.8,5.8,7,20,STONE); d.rectangle([X(-3),Y(13),X(3),Y(7)],fill=(74,54,38),outline=DK); d.pieslice([X(-3),Y(16),X(3),Y(10)],180,360,fill=(74,54,38),outline=DK)
d.ellipse([X(-3.4),Y(31.5),X(3.4),Y(24.7)],fill=GLASS,outline=DK)   # the rose window
wins(-19,-10,10,2); wins(10,19,10,2); wins(-19,-10,18,2); wins(10,19,18,2); wins(-19,-10,26,2,1.0,2.4); wins(10,19,26,2,1.0,2.4)
# banners
for s in (-1,1): d.rectangle([X(s*5.2-0.7),Y(19),X(s*5.2+0.7),Y(14)],fill=RED,outline=DK)
# scale + labels
def lab(x,y,t,n=13,fill=(255,255,255)):
    f=font(n); w=d.textlength(t,font=f); d.rectangle([x-w/2-4,y-2,x+w/2+4,y+n+4],fill=(0,0,0)); d.text((x-w/2,y),t,font=f,fill=fill)
for h,t in ((42,'keep roof 42 m'),(78,'spire 78 m')):
    d.line([X(-112),Y(h),X(-106),Y(h)],fill=(255,255,255),width=2); d.text((X(-104),Y(h)-8),t,font=font(12,False),fill=(20,20,20))
d.line([X(-112),Y(0),X(-112),Y(78)],fill=(255,255,255),width=2)
lab(X(-92),Y(13)-10,'village houses, 4 to 11 m',11); lab(X(92),Y(13)-10,'village houses',11)
lab(X(0),GY+12,'THE GRAND STAIR (from the Market)',13); lab(X(0),Y(60),'THE GREAT SPIRE',12); lab(X(0),Y(21.5),'THE THRONE HALL',12)
lab(X(-33),Y(32),'THE WEST WING',12); lab(X(33),Y(32),'THE EAST WING',12); lab(X(-56),Y(6.5),'THE LOWER COURT',11); lab(X(56),Y(6.5),'THE LOWER COURT',11)
# ================= PLAN =================
S=22; PX,PY=900-22*S,900   # castle hill 44 x 34 squares, shown with 3 squares of village round it
def R(x0,y0,x1,y1,c,o=None): d.rectangle([PX+x0*S,PY+y0*S,PX+x1*S,PY+y1*S],fill=c,outline=o)
def C(cx,cy,r,c,o=DK): d.ellipse([PX+(cx-r)*S,PY+(cy-r)*S,PX+(cx+r)*S,PY+(cy+r)*S],fill=c,outline=o)
GR=(98,150,74);COB=(146,142,134);T1=(168,172,150);T2=(196,196,176);BLD=(150,84,58);ROOF=BLUE
R(-4,-2,48,38,GR)                                 # village ground round the hill
R(-4,36,48,38,COB); R(20,34,24,38,COB)            # the market street
R(0,0,44,34,T1,DK)                                # tier 1: the lower court (36..)  -> hill 44 x 34 squares
R(6,3,38,25,T2,DK)                                # tier 2: the upper court
# stairs
def stair(x0,y0,x1,y1,vert=True):
    R(x0,y0,x1,y1,STONE3,DK)
    n=int((y1-y0)*3) if vert else int((x1-x0)*3)
    for i in range(1,n):
        if vert: d.line([PX+x0*S,PY+(y0+i/3)*S,PX+x1*S,PY+(y0+i/3)*S],fill=(150,146,140))
        else: d.line([PX+(x0+i/3)*S,PY+y0*S,PX+(x0+i/3)*S,PY+y1*S],fill=(150,146,140))
stair(19,34,25,36); stair(20,25,24,27); stair(21,-2,23,0); stair(21,1,23,3)
# palace
R(15,7,29,21,BLD,DK)                               # the keep / throne hall 14 x 14
R(7,10,15,18,BLD,DK); R(29,10,37,18,BLD,DK)        # wings 8 x 8
for cx,cy,r in ((7,10,1.6),(7,18,1.6),(37,10,1.6),(37,18,1.6),(15,7,1.4),(29,7,1.4),(15,21,1.4),(29,21,1.4),(20,21.6,0.9),(24,21.6,0.9)): C(cx,cy,r,ROOF)
C(22,14,2.4,ROOF); C(22,14,0.5,RED)
# lower court buildings (symmetrical pair), lists, orchard, sword
R(2,27,9,32,BLD,DK); R(35,27,42,32,BLD,DK)
for i in range(5):
    C(2.5+i*0,6+i*3.2,0.45,(40,110,40),None); C(41.5,6+i*3.2,0.45,(40,110,40),None)
R(12,29.2,18,29.5,(200,56,56)); R(26,29.2,32,29.5,(200,56,56))
C(22,30,0.5,(240,220,120)); C(13,3.2+25,0.0,GR)
for cx,cy in ((0,0),(44,0),(0,34),(44,34),(18,34),(26,34)): C(cx,cy,1.3,STONE2)
def plab(x,y,t,n=12,fill=(255,255,255)): lab(PX+x*S,PY+y*S-n/2,t,n,fill)
GOLD=(255,196,70);PINK=(255,120,210)
plab(22,11,'THE THRONE HALL',13); plab(22,12.4,'Round Table, the throne, King Arthur',10)
plab(22,16.6,'the Great Spire over it',10); plab(11,13,'WEST WING',11); plab(11,14.4,'Kitchen',10); plab(33,13,'EAST WING',11); plab(33,14.4,'Barracks',10)
plab(22,23.4,'THE UPPER COURT  (+7 m)',12); plab(22,32.4,'THE LOWER COURT  (+3.5 m)',12); plab(22,30.9,'the Sword in the Stone',10,(255,236,150))
plab(5.5,29.5,'Stables',10); plab(38.5,29.5,'your call',10); plab(15,28.4,'the Lists',10); plab(29,28.4,'the Lists',10)
plab(22,35,'THE GRAND STAIR',11); plab(22,37.3,'THE MARKET',12); plab(22,-1,'the back stair (the postern)',10)
def dot(x,y,t,c): px,py=PX+x*S,PY+y*S; d.ellipse([px-8,py-8,px+8,py+8],fill=c,outline=(0,0,0),width=2); lab(px,py+11,t,11,c)
dot(22,8.2,"the Great Stair: the Keep's floors, the Sky Castle",GOLD); dot(16.5,33.2,"Merlin's Undercroft (under the stair)",GOLD); dot(9,16.8,'The Estate (the wardrobe)',PINK); dot(30,26.2,'the well',GOLD)
# notes
nx,ny=30,1766
for t in ('WHAT CHANGES:  the inner curtain wall and its yard are gone. The castle is ONE building: a tall keep with the throne hall in it, two matching wings, eight towers under blue cones, a great spire.',
          'It stands on a two-step stone hill in the exact centre of the kingdom (3.5 m, then 7 m), so its doors are above every village roof and it shows over the town wall from the woods.',
          'Left and right are mirror images. You climb the Grand Stair from the Market; a small back stair comes down to the north street.',
          'Kept from today: the Throne Hall pieces (Round Table, throne, King Arthur), Kitchen, Barracks, Stables, the Lists, the orchard, the Sword in the Stone, the well, every door out.',
          'My guesses, say if wrong: the second lower-court building (marked "your call") only balances the Stables; the village Smithy stays where it is. The village streets shift a little to centre the hill.'):
    d.text((nx,ny),t,font=font(14,False),fill=(215,215,215)); ny+=26
IMG.save('camelot_castle_redesign_2.png'); print(IMG.size)
