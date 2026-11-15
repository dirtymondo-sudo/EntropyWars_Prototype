# draw-insides.py — the plan picture for the Desert's redesigned insides (Hangar 18, the White Rooms, inside the Great Pyramid).
# One square = 3.5 m. Each room: (name, x, y, w, h, colour, level label). Run: python3 draw-insides.py
from PIL import Image, ImageDraw, ImageFont
S=34; F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; FB='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f9=ImageFont.truetype(F,11); f11=ImageFont.truetype(FB,12); f16=ImageFont.truetype(FB,20); f12=ImageFont.truetype(F,13)
FLOOR=(196,198,200); DECK=(150,178,206); CELL=(236,236,230); SHOP=(206,186,150); DARK=(120,124,130); RED=(214,120,104); STONE=(214,196,150); DEEP=(168,146,104); GOLD=(232,200,96); GLASS=(170,214,224); GREEN=(160,200,150)
PANELS=[
 ('HANGAR 18', '22 x 14 squares (77 x 49 m), 14 m to the roof trusses. Mezzanine and catwalk 3.5 m up.', 22, 14, [
   ('THE FLOOR',4,0,14,10,FLOOR,''),
   ('THE SAUCER\non its rig',8,2,6,6,RED,'tape ring'),
   ('ENGINE SHOP',0,0,4,4,SHOP,'jet engine stand'),('PARTS CAGE',0,4,4,3,SHOP,'chain-link'),('FUEL STORE',0,7,4,3,SHOP,'tanks'),
   ('CRASH TENDER',18,0,4,4,SHOP,'fire truck'),('CRATES',18,4,4,3,SHOP,'stacks, a way over'),('FLOOR LIFT',18,7,4,3,DARK,'to the D.U.M.B.'),
   ('LOCKERS',0,10,4,4,CELL,''),('BRIEFING',4,10,5,4,CELL,'screen, chairs'),('OFFICE',9,10,4,4,CELL,'Room 51 door'),('LAB',13,10,5,4,CELL,'the grey, the tables'),('WHITE DOOR',18,10,4,4,CELL,'to the White Rooms'),
   ('CONTROL ROOM (up)',14,8,4,2,GLASS,'glass, over the floor'),('CATWALK (up)',10,0,2,10,DECK,'crosses over the saucer'),
  ], [('THE BIG DOOR · the apron',11,-0.45),('man-door · Room 51',11,14.1)]),
 ('THE WHITE ROOMS', '16 x 12 squares (56 x 42 m), two floors. Everything white; the observation floor looks down through glass.', 16, 12, [
   ('INTAKE',6,0,4,3,CELL,'desk, scale, lockers'),('YARD LANE',10,0,2,3,FLOOR,''),
   ('NURSES\' STATION',6,4,4,3,GLASS,'glass, sees every hall'),
   ('CELL ROW',0,0,5,8,CELL,'8 padded cells, one open'),
   ('THE DAYROOM',5,8,7,4,GREEN,'TV, tables, the plant'),
   ('TREATMENT',12,3,4,3,RED,'the chair, the EEG'),('RECORDS',12,0,4,3,SHOP,'files on everyone who saw it'),
   ('SHOWERS',12,6,2,3,DECK,''),('SERVICE',14,6,2,3,DARK,'storm drain grate'),
   ('QUIET ROOM',0,8,5,4,CELL,'the telepath'),('DOCTOR',12,9,4,3,SHOP,'office, the vent'),
   ('OBSERVATION (up)',5,7,7,1,GLASS,'one-way glass'),('',5,0,1,7,GLASS,''),
  ], [('yard gate',11,-0.45),('Hangar 18',16.1,10.5)]),
 ('INSIDE THE GREAT PYRAMID', '14 x 14 squares in plan, three levels: the Pit below, the Queen\'s Chamber, the King\'s Chamber at the top. Hidden: the Robbers\' Cut (a rough way in from the west) and the Relieving Chambers. The Tomb Door on the west face stays Room 444\'s door.', 14, 14, [
   ('ENTRANCE',6,0,2,2,STONE,'north face'),('DESCENT',6,2,2,7,DEEP,'down to the Pit'),
   ('THE PIT',4,9,6,2,DEEP,'level -1: unfinished, a well'),
   ('ASCENT',8,3,2,2,STONE,'up'),
   ('THE GRAND GALLERY',10,2,2,9,GOLD,'a ramp, 8 m high, level 1 up to level 2'),
   ('QUEEN\'S CHAMBER',1,4,4,3,STONE,'level 1: gabled roof, a niche'),('',5,5,1,1,STONE,''),
   ('ANTE- CHAMBER',10,11,2,3,STONE,'three stone gates'),
   ('KING\'S CHAMBER',5,11,5,3,GOLD,'level 2: the sarcophagus'),
   ('RELIEVING CHAMBERS',1,12,4,2,DARK,'hidden: a climb over the King'),
   ('ROBBERS\' CUT',0,2,6,1,DARK,''),
   ('TOMB DOOR',0,8,3,1,RED,''),
  ], [('north face, by the North Stair',7,-0.45)]),
]
PAD=40; H=PAD*2+60+16*S+70; W=sum(p[2] for p in PANELS)*S+PAD*4
im=Image.new('RGB',(W,H),(250,248,242)); d=ImageDraw.Draw(im)
d.text((PAD,14),'THE DESERT · THE INSIDES · plan for approval (not built)',font=f16,fill=(40,40,40))
ox=PAD
for name,sub,gw,gh,rooms,doors in PANELS:
    oy=PAD+70
    d.text((ox,oy-44),name,font=f16,fill=(30,30,30)); 
    # wrap sub
    words=sub.split(' '); line=''; yy=oy+gh*S+26
    for w in words:
        if d.textlength(line+' '+w,font=f12)>gw*S: d.text((ox,yy),line,font=f12,fill=(70,70,70)); yy+=16; line=w
        else: line=(line+' '+w).strip()
    d.text((ox,yy),line,font=f12,fill=(70,70,70))
    d.rectangle([ox,oy,ox+gw*S,oy+gh*S],fill=(226,224,216),outline=(40,40,40),width=3)
    for i in range(gw+1): d.line([ox+i*S,oy,ox+i*S,oy+gh*S],fill=(210,208,200))
    for j in range(gh+1): d.line([ox,oy+j*S,ox+gw*S,oy+j*S],fill=(210,208,200))
    for n,x,y,w,h,c,note in rooms:
        d.rectangle([ox+x*S+2,oy+y*S+2,ox+(x+w)*S-2,oy+(y+h)*S-2],fill=c,outline=(60,60,60),width=2)
        ty=oy+y*S+5
        for part in n.split('\n'):
            ln=''
            for w2 in part.split(' '):
                if ln and d.textlength(ln+' '+w2,font=f11)>w*S-10: d.text((ox+x*S+6,ty),ln,font=f11,fill=(20,20,20)); ty+=14; ln=w2
                else: ln=(ln+' '+w2).strip()
            if ln: d.text((ox+x*S+6,ty),ln,font=f11,fill=(20,20,20)); ty+=14
        if note and h>1:
            ln=''; 
            for w2 in note.split(' '):
                if d.textlength(ln+' '+w2,font=f9)>w*S-12: d.text((ox+x*S+6,ty),ln,font=f9,fill=(60,60,60)); ty+=12; ln=w2
                else: ln=(ln+' '+w2).strip()
            d.text((ox+x*S+6,ty),ln,font=f9,fill=(60,60,60))
    for lab,x,y in doors:
        px=ox+x*S; py=oy+y*S
        d.rectangle([px-10,py-4,px+10,py+4],fill=(200,40,40)); d.text((min(px+14,ox+gw*S-d.textlength(lab,font=f9)),py-(16 if y<0 else -6)),lab,font=f9,fill=(160,30,30))
    ox+=gw*S+PAD
d.text((PAD,H-30),'Red tabs = ways in. "(up)" = the upper floor over what is below it. One square = 3.5 m.',font=f12,fill=(70,70,70))
im.save('/mnt/project-files/desert-plots/insides/insides_plan.png'); print(im.size)
