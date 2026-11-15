# The next four Camelot pieces after castle redesign 2, drawn for mondo's OK. Nothing here is built. python3 draw-castle2-next.py
from PIL import Image, ImageDraw, ImageFont
def font(n,b=True):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',n)
    except: return ImageFont.load_default()
IMG=Image.new('RGB',(1900,2050),(22,24,22)); d=ImageDraw.Draw(IMG)
STONE=(196,192,184);STONE2=(170,166,160);PALE=(220,214,202);BLUE=(74,92,140);DK=(50,48,56);GLOW=(250,214,120);RED=(176,44,54);ROCK=(92,84,78);WATER=(70,120,170);CLOUD=(236,240,248);GOLD=(255,196,70)
def lab(x,y,t,n=12,fill=(255,255,255),bg=(0,0,0)):
    f=font(n); w=d.textlength(t,font=f); d.rectangle([x-w/2-4,y-2,x+w/2+4,y+n+4],fill=bg); d.text((x-w/2,y),t,font=f,fill=fill)
def txt(x,y,t,n=13,fill=(215,215,215),b=False): d.text((x,y),t,font=font(n,b),fill=fill)
d.text((30,14),'CAMELOT  ·  what comes next, for your OK  ·  nothing on this page is built',font=font(24),fill=(255,255,255))
txt(30,50,'A = one cut through the castle from the side, showing the three rooms that are still the old ones. B = their floor plans. C = richer village houses.',14,(190,190,190))
# ============ A: THE CUT ============
OX,GY,M=560,1000,6.2
X=lambda m:OX+m*M; Y=lambda m:GY-m*M
d.rectangle([30,90,1090,1290],fill=(150,190,235))
d.rectangle([30,Y(0),1090,1290],fill=ROCK)                         # under the ground
d.rectangle([30,Y(0)-6,1090,Y(0)],fill=(98,150,74))
def box(x0,x1,y0,y1,c,o=DK,w=1): d.rectangle([X(x0),Y(y1),X(x1),Y(y0)],fill=c,outline=o,width=w)
def cone(cx,r,y,h,c=BLUE): d.polygon([(X(cx-r),Y(y)),(X(cx+r),Y(y)),(X(cx),Y(y+h))],fill=c,outline=DK)
# the hill (cut south = left, north = right): lower court 3.5, upper 7
box(-52,39,0,3.5,STONE2); box(-31,32,3.5,7,STONE2)
d.polygon([(X(-63),Y(0)),(X(-52),Y(0)),(X(-52),Y(3.5))],fill=PALE,outline=DK); d.polygon([(X(-41),Y(3.5)),(X(-31),Y(3.5)),(X(-31),Y(7))],fill=PALE,outline=DK)
# the keep, cut: throne hall 7..21 (built), floor 2 21..28, floor 3 28..35 (roof walk at 35), spire
box(-21,21,7,35,PALE,DK,2)
box(-20,20,7.6,20.4,(96,70,58)); lab(X(0),Y(15),'THRONE HALL (built)',11,(255,255,255),(60,40,30))
box(-20,20,21.4,27.6,(120,92,70)); box(-20,20,28.6,34.6,(120,92,70))
for x in (-7,7): d.line([X(x),Y(21.4),X(x),Y(27.6)],fill=DK,width=2); d.line([X(x),Y(28.6),X(x),Y(34.6)],fill=DK,width=2)
lab(X(-13.5),Y(25.6),'SOLAR',10); lab(X(0),Y(25.6),'STAIR',10); lab(X(13.5),Y(25.6),'LIBRARY',10)
lab(X(-13.5),Y(32.8),'QUEEN',10); lab(X(0),Y(32.8),'GALLERY',10); lab(X(13.5),Y(32.8),'WAR ROOM',10)
for s in (-1,1): box(s*21-3.4,s*21+3.4,7,41,PALE); cone(s*21,4.4,41,12)
box(-21,21,35,36.2,STONE2); lab(X(-44),Y(38.5),'THE BATTLEMENTS (the roof walk)',11)
box(-5.5,5.5,37,59,PALE,DK,2); cone(0,6.5,59,20); box(-4.5,4.5,50,58,(120,92,70)); lab(X(22),Y(56.5),'THE SPIRE ROOM',10)
d.ellipse([X(0)-7,Y(52)-7,X(0)+7,Y(52)+7],fill=GOLD,outline=(0,0,0)); 
# the great stair: zig-zag inside the stair hall
pts=[(X(16),Y(8)),(X(4),Y(21.4)),(X(-4),Y(28.6)),(X(4),Y(35)),(X(0),Y(50))]
d.line(pts,fill=GOLD,width=3)
lab(X(34),Y(47),'THE KEEP room',14,(0,0,0),GOLD); 
# the undercroft under the hill
box(-50,30,-9,-2,(60,56,60),DK,2)
box(-49,-36,-8.4,-2.6,(84,74,66)); box(-35,-22,-8.4,-2.6,(84,74,66)); box(-21,-8,-8.4,-2.6,(84,74,66)); box(-7,29,-8.4,-2.6,(84,74,66))
box(-34.5,-22.5,-8.4,-6.2,WATER)
lab(X(-42.5),Y(-3.2),'THE VAULTS',10); lab(X(-28.5),Y(-3.2),'THE CISTERN',10); lab(X(-14.5),Y(-3.2),'THE CELLS',10); lab(X(11),Y(-3.2),"MERLIN'S WORKSHOP · THE ORB",10)
d.ellipse([X(11)-9,Y(-6.6)-9,X(11)+9,Y(-6.6)+9],fill=(150,220,255),outline=(0,0,0))
d.line([X(-56),Y(0.5),X(-49),Y(-5)],fill=GOLD,width=3); lab(X(-63),Y(-2),'the sally port',10,GOLD)
d.line([X(-28.5),Y(3.5),X(-28.5),Y(-6)],fill=GOLD,width=3); lab(X(-28.5),Y(9.5),'the well',10,GOLD)
d.line([X(20),Y(8),X(24),Y(-5)],fill=GOLD,width=3); lab(X(41),Y(-1),'the stair down from the Keep',10,GOLD)
lab(X(34),Y(-12.5),"MERLIN'S UNDERCROFT room",14,(0,0,0),GOLD)
# the sky castle over it
for cx,cy,r in ((-40,104,16),(-18,100,20),(8,101,22),(34,104,16),(-30,108,12),(22,108,14)): d.ellipse([X(cx-r),Y(cy+r*0.45),X(cx+r),Y(cy-r*0.45)],fill=CLOUD)
box(-14,14,104,118,PALE,DK,2); 
for s in (-1,1): box(s*14-2.6,s*14+2.6,104,124,PALE); cone(s*14,3.4,124,8)
box(-3.6,3.6,118,132,PALE); cone(0,4.6,132,13)
for x0,y0 in ((-38,104),(-30,108),(-22,111)): box(x0,x0+6,y0,y0+1,STONE)
lab(X(0),Y(113),'THE KEEP IN THE AIR',11); lab(X(-30),Y(118),'floating flights',10); lab(X(36),Y(112),'the Sky Bridge',10,GOLD); d.line([X(17),Y(108),X(48),Y(108)],fill=GOLD,width=3)
lab(X(-52),Y(128),'THE CASTLE IN THE SKY room',14,(0,0,0),GOLD)
d.line([X(0),Y(79),X(0),Y(100)],fill=GOLD,width=2); lab(X(0),Y(92),'the spire door opens on the cloud deck',10,GOLD)
lab(X(-70),Y(8),'the Market',10); lab(X(-46),Y(9.5),'lower court',10); lab(X(-27),Y(13),'upper court',10)
txt(40,1300,'A · THE CUT (south is left). Gold lines = the ways between the rooms. All three rooms take the new palace\'s size and shapes.',13,(255,255,255),True)
# ============ B: FLOOR PLANS ============
def plan(px,py,s,title):
    R=lambda x0,y0,x1,y1,c,o=DK,w=1: d.rectangle([px+x0*s,py+y0*s,px+x1*s,py+y1*s],fill=c,outline=o,width=w)
    C=lambda cx,cy,r,c: d.ellipse([px+(cx-r)*s,py+(cy-r)*s,px+(cx+r)*s,py+(cy+r)*s],fill=c,outline=DK)
    L=lambda x,y,t,n=10,fill=(255,255,255): lab(px+x*s,py+y*s-n/2,t,n,fill)
    txt(px,py-24,title,13,(255,255,255),True); return R,C,L
# B1 the keep's upper floors (49 x 42 m = 14 x 12 squares)
R,C,L=plan(1130,130,16,'B1 · THE KEEP, floors 2 and 3')
R(0,0,14,12,PALE,DK,2); R(0.3,0.3,4.7,11.7,(150,110,84)); R(5,0.3,9,11.7,(170,150,120)); R(9.3,0.3,13.7,11.7,(150,110,84))
for cx,cy in ((0,0),(14,0),(0,12),(14,12)): C(cx,cy,1.0,BLUE)
R(5.6,4,8.4,8,(214,208,196)); L(7,6,'GREAT STAIR',9); L(2.5,3,'THE SOLAR',10); L(2.5,4.2,"the king's bed, the map table",8); L(2.5,9,'THE ARMS',9)
L(11.5,3,'THE LIBRARY',10); L(11.5,4.2,'shelves two storeys, ladders',8); L(11.5,9,'reading alcoves',8); L(7,10.6,'balcony over the Throne Hall',8); L(7,1.4,'the great window',8)
# B2 battlements
R,C,L=plan(1560,130,16,'B2 · THE BATTLEMENTS and the Spire')
R(0,0,14,12,STONE2,DK,2); R(1.6,1.6,12.4,10.4,BLUE)
for cx,cy in ((0,0),(14,0),(0,12),(14,12)): C(cx,cy,1.0,BLUE)
C(7,6,1.7,PALE); C(7,6,0.4,GOLD); L(7,7.4,'the Spire: spiral up to the door to the sky',8); L(7,11.2,'roof walk all round, the kingdom below',8); L(7,3,'the ballista',8)
# B3 the undercroft (the hill 40 x 26 squares)
R,C,L=plan(1130,430,16,"B3 · MERLIN'S UNDERCROFT (under the whole hill, same outline)")
R(0,0,40,26,(60,56,60),DK,2)
R(1,18,12,25,(84,74,66)); L(6.5,21.5,'THE VAULTS'); L(6.5,22.8,'barrels, the stores',8)
R(13,18,27,25,(84,74,66)); R(15,19.5,25,23.5,WATER); L(20,21.5,'THE CISTERN (waded)'); L(22,18.6,'the well comes down here',8,GOLD)
R(28,18,39,25,(84,74,66)); L(33.5,21.5,'THE CELLS'); L(33.5,22.8,'skeletons, the gaoler',8)
R(13,5,27,17,(100,84,110)); C(20,11,2.2,(150,220,255)); L(20,7,"MERLIN'S WORKSHOP",11); L(20,14.4,'THE ORB under the throne',9)
R(1,5,12,17,(84,74,66)); L(6.5,11,'THE OSSUARY'); R(28,5,39,17,(84,74,66)); L(33.5,11,'THE CRYPT OF KINGS')
R(17,1,23,4,(84,74,66)); L(20,2.5,'stair up to the Keep',8,GOLD); L(15,25.6,'the sally port (beside the Grand Stair)',8,GOLD)
for x0,y0,x1,y1 in ((12,21,13,22),(27,21,28,22),(19,17,21,18),(12,10,13,12),(27,10,28,12),(19,4,21,5)): R(x0,y0,x1,y1,(214,208,196),None)
# B4 the sky castle
R,C,L=plan(1130,920,13,'B4 · THE CASTLE IN THE SKY (the palace\'s twin on the clouds)')
d.rectangle([1130,920,1130+52*13,920+30*13],fill=(150,190,235))
for cx,cy,r in ((8,24,6),(20,25,7),(34,24,7),(46,25,6),(26,27,8)): d.ellipse([1130+(cx-r)*13,920+(cy-r*0.5)*13,1130+(cx+r)*13,920+(cy+r*0.5)*13],fill=CLOUD)
L(26,27.5,'THE CLOUD DECK (arrive here from the Spire; every fall lands here)',9)
for x0,y0 in ((8,20),(13,17),(18,14)): R(x0,y0,x0+4,y0+2,STONE)
R(19,4,33,13,PALE,DK,2); R(12,6,19,11,STONE); R(33,6,40,11,STONE)
for cx,cy in ((19,4),(33,4),(19,13),(33,13),(12,6),(12,11),(40,6),(40,11)): C(cx,cy,1.0,BLUE)
C(26,8.5,1.6,BLUE); L(26,10.6,'THE KEEP IN THE AIR'); L(26,6,"the dragon's roost on the Spire",8); L(11,15,'three floating flights',8); L(46,8.5,'THE SKY BRIDGE',9,GOLD); d.line([1130+40*13,920+8.5*13,1130+51*13,920+8.5*13],fill=GOLD,width=3)
L(15.5,8.5,'cloud garden',8); L(36.5,8.5,'star chamber',8)
# ============ C: HOUSES ============
txt(40,1350,'C · THE VILLAGE HOUSES. Today all 43 are one shape (plaster box, four posts, a gable). New: five kinds, picked by plot size and street.',13,(255,255,255),True)
HY=1700; HM=11
def hx(o,m): return o+m*HM
def hy(m): return HY-m*HM
def hbox(o,x0,x1,y0,y1,c,ol=DK): d.rectangle([hx(o,x0),hy(y1),hx(o,x1),hy(y0)],fill=c,outline=ol)
def gable(o,x0,x1,y,h,c): d.polygon([(hx(o,x0),hy(y)),(hx(o,x1),hy(y)),(hx(o,(x0+x1)/2),hy(y+h))],fill=c,outline=DK)
def win(o,x,y,w=1.0,h=1.3): hbox(o,x-w/2,x+w/2,y,y+h,GLOW)
def door(o,x): hbox(o,x-0.6,x+0.6,0,2.1,(90,60,38))
def frame(o,x0,x1,y0,y1,n):
    for i in range(n+1): x=x0+(x1-x0)*i/n; d.line([hx(o,x),hy(y0),hx(o,x),hy(y1)],fill=(74,54,38),width=3)
    d.line([hx(o,x0),hy(y0),hx(o,x1),hy(y0)],fill=(74,54,38),width=3); d.line([hx(o,x0),hy(y1),hx(o,x1),hy(y1)],fill=(74,54,38),width=3)
d.rectangle([30,1385,1870,HY+20],fill=(150,190,235)); d.rectangle([30,HY,1870,HY+20],fill=(120,116,108))
PL=(232,220,192)
o=60;  hbox(o,0,10,0,4.2,PL); hbox(o,0,10,0,0.9,STONE2); gable(o,-0.6,10.6,4.2,3.2,(168,74,60)); door(o,3); win(o,7,1.6); hbox(o,8,9,4.2,8.4,STONE2)
lab(hx(o,5),HY+30,'TODAY: every house',12,(255,180,180))
o=250; hbox(o,0,9,0,3.2,STONE); hbox(o,-0.5,9.5,3.2,6.6,PL); frame(o,-0.5,9.5,3.2,6.6,5); gable(o,-1.1,10.1,6.6,4.2,(122,90,60)); door(o,2.2); win(o,6,1.2); win(o,2,4.2); win(o,7,4.2); hbox(o,7.4,8.4,6.6,11.5,(184,106,84))
d.line([hx(o,-0.5),hy(3.2),hx(o,-0.5),hy(2.4)],fill=(74,54,38),width=3); d.line([hx(o,9.5),hy(3.2),hx(o,9.5),hy(2.4)],fill=(74,54,38),width=3)
lab(hx(o,4.5),HY+30,'1 · JETTIED TOWNHOUSE',12); lab(hx(o,4.5),HY+50,'upper floor overhangs on beams',10)
o=470; hbox(o,0,12,0,3.4,PL); frame(o,0,12,0.9,3.4,6); hbox(o,0,12,0,0.9,STONE2); gable(o,-0.6,12.6,3.4,3.4,(74,92,140)); door(o,2); hbox(o,5,11,1.1,2.6,(60,44,34)); hbox(o,4.6,11.4,2.6,2.9,(176,44,54)); hbox(o,5,11,0.9,1.1,(150,110,70))
d.polygon([(hx(o,4.4),hy(3.0)),(hx(o,11.6),hy(3.0)),(hx(o,12),hy(2.2)),(hx(o,4),hy(2.2))],fill=(200,160,90),outline=DK)
lab(hx(o,6),HY+30,'2 · SHOP HOUSE',12); lab(hx(o,6),HY+50,'open counter, awning, hanging sign',10)
o=730; hbox(o,0,8,0,3.0,PL); hbox(o,0,8,0,0.8,STONE2); d.polygon([(hx(o,-0.8),hy(3.0)),(hx(o,8.8),hy(3.0)),(hx(o,6.5),hy(7.2)),(hx(o,1.5),hy(7.2))],fill=(196,170,96),outline=DK); door(o,4); win(o,1.6,1.3,0.9,1.0); win(o,6.4,1.3,0.9,1.0); hbox(o,6,7,6.2,8.6,STONE2)
lab(hx(o,4),HY+30,'3 · THATCHED COTTAGE',12); lab(hx(o,4),HY+50,'low, steep straw roof, small plots',10)
o=950; hbox(o,0,9,0,7,STONE); hbox(o,0,9,0,1.0,STONE2); gable(o,-0.5,9.5,7,3.6,(74,92,140)); door(o,4.5); hbox(o,3.6,5.4,2.1,2.5,PALE); win(o,2,1.4); win(o,7,1.4); win(o,2,4.6,1.0,1.6); win(o,4.5,4.6,1.0,1.6); win(o,7,4.6,1.0,1.6); hbox(o,0.5,1.5,7,11,STONE2); hbox(o,7.5,8.5,7,11,STONE2)
lab(hx(o,4.5),HY+30,'4 · STONE BURGHER HOUSE',12); lab(hx(o,4.5),HY+50,'by the Market: dressed stone, slate',10)
o=1180; hbox(o,0,7,0,3.4,PL); frame(o,0,7,0.9,3.4,3); hbox(o,0,7,0,0.9,STONE2); gable(o,-0.5,7.5,3.4,3.0,(168,74,60)); door(o,2); win(o,5,1.5)
hbox(o,7,12,0,2.6,(150,110,70)); d.polygon([(hx(o,7),hy(3.4)),(hx(o,12.5),hy(2.4)),(hx(o,12.5),hy(2.6)),(hx(o,7),hy(3.6))],fill=(122,90,60),outline=DK); hbox(o,12.6,16,0,1.1,(122,90,60)); 
for i in range(5): d.line([hx(o,12.6+i*0.85),hy(0),hx(o,12.6+i*0.85),hy(1.1)],fill=DK)
lab(hx(o,8),HY+30,'5 · YARD HOUSE',12); lab(hx(o,8),HY+50,'lean-to shed, fenced yard, by the wall',10)
txt(1420,1400,'On every house:',13,(20,20,20),True)
for i,t in enumerate(('a real door leaf and a step','shutters on the windows','a chimney that fits the roof','flower boxes, barrels, firewood','lit windows at night','same plots, same doors on the street')): txt(1420,1424+i*22,'·  '+t,13,(20,20,20))
# ============ the asks ============
y=1790
for t in ('WHAT I NEED FROM YOU:  yes / no / change on each of the four.',
          '1 THE KEEP room: floors 2 and 3 over the Throne Hall (Solar, Library, Queen\'s Room, War Room), the Battlements, the Spire room with the door to the sky. Same outline as the built Keep.',
          '2 MERLIN\'S UNDERCROFT: under the whole hill. Vaults, Cistern (under the well), Cells, Ossuary, Crypt of Kings, Merlin\'s Workshop with the Orb under the throne.',
          '3 THE CASTLE IN THE SKY: the palace\'s twin floating on the clouds, reached from the Spire. Cloud deck, floating flights, the Keep in the Air, the Sky Bridge.',
          '4 THE HOUSES: five kinds in place of one. All still solid (not walked into); say if some should be walked into.',
          'Kept in every room: its doors, its natives and their lines, its tape. My guesses, say if wrong: the three rooms stay separate rooms behind doors (not one stacked room).'):
    txt(30,y,t,14,(235,235,235),t.startswith('WHAT')); y+=27
IMG.save('camelot_castle2_next_plan.png'); print(IMG.size)
