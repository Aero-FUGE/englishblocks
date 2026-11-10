"""PNG sprite wardrobe assets. Uses approved character PNGs, not SVG cats.
Rebuild with python tools/make_wearables.py. All sprites align in a 1254² canvas.
"""
from PIL import Image,ImageDraw,ImageFilter,ImageChops
from pathlib import Path
from math import sin,cos,pi
import shutil
R=Path(__file__).resolve().parents[1];ROOT=R/'public/assets';N=1254
CATS={
('mimi','peek'):'咪咪探头卖萌猫_乐彩sy.png',
('mimi','half'):'咪咪橘猫可爱半身像.png',
('mimi','stand'):'站立橘猫咪咪角色立绘.png',
('tuanzhang','peek'):'团长探头看世界.png',
('tuanzhang','half'):'团长猫半身萌系立绘.png',
('tuanzhang','stand'):'团长灰虎斑猫立绘底图.png'}
CLOTHES={
'academy-cape':('#7E9675','#D5E2BA','#4E6B55','#E9D7A5'),
'lace-dress':('#E9B9C5','#F8E1E8','#AE7A8C','#FFF7EA'),
'star-cape':('#65557F','#AFA0CD','#403253','#E7C878'),
'pirate-coat':('#4F5968','#8E9AA0','#313A49','#EBC981'),
'travel-coat':('#C29A73','#E8D3B0','#795C48','#F4E3BD'),
'garden-dress':('#9EB68A','#DCE6CA','#708461','#FFDFB9')}
OTHERS={
'green-beret':('hat','#7C9B65','#F5E2A3'),'garden-hat':('hat','#EAC989','#E9976B'),
'wizard-hat':('hat','#63517F','#F3C66D'),'pirate-hat':('hat','#4A3D3B','#E6C077'),
'princess-crown':('hat','#E9B75E','#BA8CD3'),'detective-hat':('hat','#B48B61','#6F563F'),
'pilot-hat':('hat','#9B7654','#A8C6D2'),'steampunk-hat':('hat','#4E5155','#C9A86A'),
'graduation-cap':('hat','#44454B','#D6AE55'),'bear-hat':('hat','#F6EDE0','#D8B6A2'),
'gold-glasses':('glasses','#D4AC5E','#FFF7D9'),'silver-glasses':('glasses','#A9ADB6','#E6EDF0'),
'heart-glasses':('glasses','#E9A0A8','#FFE1DF'),
'green-bow':('bow','#7E9E6B','#E9BD61'),'cream-bow':('bow','#E8CBAF','#FFF3D7'),
'ruby-bow':('bow','#A65B62','#EAC37D'),'star-bow':('bow','#5E527C','#F1CB78'),
'pearl-charm':('accessory','#E7D4C9','#FAF6E9'),'star-charm':('accessory','#D8BD70','#FFF0BB'),
'compass-charm':('accessory','#B48A52','#F6E5B3')}
# Calibrated for the three APPROVED image-generation poses (different torso heights).
COORD={
 'peek': dict(cx=627,y=839,end=1020,shoulder=190,hem=240,eye=(453,500,790,500,87,73),hat=(627,172),bow=(627,816),charm=(787,922),paw=[(332,809,520,1000),(733,809,923,1000)]),
 'half': dict(cx=627,y=839,end=1205,shoulder=202,hem=265,eye=(463,462,788,462,83,74),hat=(627,95),bow=(627,838),charm=(789,976),paw=[(341,955,542,1166),(712,955,913,1166)]),
 'stand':dict(cx=627,y=657,end=1115,shoulder=155,hem=224,eye=(506,385,744,385,68,60),hat=(627,67),bow=(627,665),charm=(744,834),paw=[(382,855,533,1058),(724,855,874,1058)])}

def new():return Image.new('RGBA',(N,N),(0,0,0,0))
def col(hexcode):return tuple(int(hexcode[i:i+2],16) for i in (1,3,5))
def layer(shape,color,outline,width=7):
 im=new();d=ImageDraw.Draw(im);d.polygon(shape,fill=color);d.line(shape+[shape[0]],fill=outline,width=width,joint='curve');return im

def cloth(id,v,cat):
 base,light,dark,trim=CLOTHES[id];cx=v['cx']+(-8 if cat=='tuanzhang' else 0);y=v['y']+(6 if cat=='tuanzhang' else 0);end=v['end'];sw=v['shoulder'];hw=v['hem'];out=new();d=ImageDraw.Draw(out)
 if id in ('lace-dress','garden-dress'):hw=int(hw*1.13)
 if id=='pirate-coat':hw=int(hw*.85)
 if v is COORD['peek']:
  # Peeking cat has no full torso: a small fabric bib, not a skirt over the head.
  sh=[(cx-130,y+10),(cx-77,y-12),(cx,y+35),(cx+77,y-12),(cx+130,y+10),(cx+96,end-38),(cx-96,end-38)]
 else:
  sh=[(cx-83,y+10),(cx-130,y-10),(cx-sw+15,y+34),(cx-sw-20,y+117),(cx-hw,end-42),(cx-hw+48,end-13),(cx,end+6),(cx+hw-48,end-13),(cx+hw,end-42),(cx+sw+20,y+117),(cx+sw-15,y+34),(cx+130,y-10),(cx+83,y+10),(cx,y+77)]
  if id=='star-cape':sh[4]=(cx-hw-21,end-34);sh[8]=(cx+hw+21,end-34)
 d.polygon(sh,fill=base);d.line(sh+[sh[0]],fill=dark,width=9,joint='curve')
 # Soft raster folds and lapels
 d.polygon([(cx-81,y+2),(cx,y+75),(cx-22,y+111),(cx-121,y+24)],fill=light)
 d.polygon([(cx+81,y+2),(cx,y+75),(cx+22,y+111),(cx+121,y+24)],fill=light)
 d.line([(cx-81,y+2),(cx,y+75),(cx-22,y+111)],fill=dark,width=5)
 d.line([(cx+81,y+2),(cx,y+75),(cx+22,y+111)],fill=dark,width=5)
 if v is COORD['peek']:return out
 for side in (-1,1):
  d.line([(cx+side*118,y+48),(cx+side*(sw-2),y+156),(cx+side*(hw-38),end-60)],fill=light,width=10,joint='curve')
  d.line([(cx+side*131,y+65),(cx+side*(sw+2),y+163),(cx+side*(hw-49),end-70)],fill=dark,width=3,joint='curve')
 if 'dress' in id:
  waist=y+int((end-y)*.55)
  d.arc((cx-145,waist-23,cx+145,waist+28),0,180,fill=trim,width=15)
  d.arc((cx-hw+20,end-76,cx+hw-20,end+4),1,179,fill=trim,width=20)
  for i in range(21):
   xx=cx-hw+28+(2*hw-56)*i/20; yy=end-39+14*sin(i/20*pi)
   d.ellipse((xx-8,yy-5,xx+8,yy+11),fill=trim,outline=light,width=3)
  for i in range(4):d.ellipse((cx-6,y+124+i*42,cx+6,y+136+i*42),fill=trim)
 else:
  d.line([(cx,y+125),(cx,end-55)],fill=dark,width=7)
  for i in range(4):d.ellipse((cx+17,y+146+i*68,cx+36,y+166+i*68),fill=trim,outline=dark,width=2)
  if id in ('star-cape','academy-cape'):
   d.arc((cx-hw+15,end-106,cx+hw-15,end+10),0,180,fill=trim,width=15)
   for side in (-1,1):d.line([(cx+side*109,y+89),(cx+side*(sw-22),end-76)],fill=trim,width=8)
  if id=='star-cape':
   for i in range(14):
    xx=cx+int(sin(i*2.399)*hw*.68); yy=y+170+(i*43)%(end-y-250)
    points=[(xx+cos(pi*2*j/10-pi/2)*(15 if j%2==0 else 6),yy+sin(pi*2*j/10-pi/2)*(15 if j%2==0 else 6)) for j in range(10)]
    d.polygon(points,fill=trim)
  if id=='pirate-coat':
   for side in (-1,1):d.line([(cx+side*71,y+120),(cx+side*88,end-48)],fill=trim,width=11)
   for i in range(3):d.line([(cx-66,y+164+i*77),(cx+66,y+164+i*77)],fill=trim,width=6)
  if id=='travel-coat':
   yy=y+int((end-y)*.60)
   d.line([(cx-141,yy),(cx+141,yy)],fill=dark,width=22)
   d.rectangle((cx-25,yy-15,cx+25,yy+17),fill=trim,outline=dark,width=5)
 return out

def accessory(id,v,cat):
 slot,base,trim=OTHERS[id];out=new();d=ImageDraw.Draw(out);dx=-8 if cat=='tuanzhang' else 0
 if slot=='glasses':
  lx,ly,rx,ry,ww,hh=v['eye'];lx+=dx;rx+=dx
  for x,y in ((lx,ly),(rx,ry)):
   if id=='heart-glasses':
    pts=[]
    for i in range(100):
     t=2*pi*i/100;pts.append((x+16*sin(t)**3*ww/19,y-(13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t))*hh/19))
    d.polygon(pts,fill=(*col(trim),30));d.line(pts+[pts[0]],fill=base,width=10,joint='curve')
   else:d.ellipse((x-ww,y-hh,x+ww,y+hh),fill=(*col(trim),26),outline=base,width=10)
  d.arc((lx+ww-15,ly-37,rx-ww+15,ly+50),188,350,fill=base,width=8)
  d.line([(lx-ww,ly-16),(lx-ww-40,ly-30)],fill=base,width=8)
  d.line([(rx+ww,ry-16),(rx+ww+40,ry-30)],fill=base,width=8)
 elif slot=='bow':
  x,y=v['bow'];x+=dx
  d.polygon([(x-10,y),(x-125,y-55),(x-153,y+13),(x-126,y+70),(x-5,y+30)],fill=base)
  d.polygon([(x+10,y),(x+125,y-55),(x+153,y+13),(x+126,y+70),(x+5,y+30)],fill=base)
  d.line([(x-10,y),(x-125,y-55),(x-153,y+13),(x-126,y+70),(x-5,y+30)],fill='#805E51',width=7)
  d.line([(x+10,y),(x+125,y-55),(x+153,y+13),(x+126,y+70),(x+5,y+30)],fill='#805E51',width=7)
  d.ellipse((x-26,y-11,x+26,y+50),fill=trim,outline='#805E51',width=6)
 elif slot=='hat':
  x,y=v['hat'];x+=dx
  if id=='princess-crown':
   p=[(x-101,y+81),(x-88,y+11),(x-40,y+44),(x,y-31),(x+40,y+44),(x+88,y+11),(x+101,y+81)]
   d.polygon(p,fill=base);d.line(p,fill='#835E45',width=8)
   d.rounded_rectangle((x-103,y+70,x+103,y+99),radius=12,fill=trim,outline='#835E45',width=7)
  elif id=='graduation-cap':
   d.polygon([(x-140,y+44),(x,y-16),(x+140,y+44),(x,y+100)],fill=base)
   d.line([(x-140,y+44),(x,y-16),(x+140,y+44),(x,y+100),(x-140,y+44)],fill=trim,width=8)
   d.line([(x+127,y+53),(x+144,y+128)],fill=trim,width=7)
  elif id=='wizard-hat':
   d.ellipse((x-146,y+62,x+146,y+107),fill=base,outline='#75614F',width=7)
   p=[(x-90,y+76),(x+5,y-105),(x+91,y+76)]
   d.polygon(p,fill=base);d.line(p,fill='#75614F',width=7)
   d.rectangle((x-83,y+62,x+83,y+81),fill=trim)
  else:
   d.ellipse((x-141,y+66,x+141,y+102),fill=base,outline='#80624E',width=7)
   p=[(x-101,y+76),(x-82,y+6),(x-22,y-36),(x+71,y-15),(x+105,y+76)]
   d.polygon(p,fill=base);d.line(p,fill='#80624E',width=8)
   d.line([(x-103,y+66),(x+103,y+66)],fill=trim,width=10)
   if id=='bear-hat':
    for xx in (x-76,x+76):d.ellipse((xx-27,y-49,xx+27,y+8),fill=base,outline='#80624E',width=6)
 elif slot=='accessory':
  x,y=v['charm'];x+=dx
  if id=='star-charm':
   p=[(x+cos(i*pi/5-pi/2)*(43 if i%2==0 else 18),y+sin(i*pi/5-pi/2)*(43 if i%2==0 else 18)) for i in range(10)]
   d.polygon(p,fill=base);d.line(p+[p[0]],fill='#987754',width=6)
  else:
   d.line([(x,y-57),(x,y-36)],fill=trim,width=7)
   d.ellipse((x-37,y-37,x+37,y+37),fill=base,outline='#866B50',width=7)
   d.ellipse((x-22,y-22,x+22,y+22),fill=trim)
 return out

def paw_image(cat_img,v):
 mask=Image.new('L',(N,N));d=ImageDraw.Draw(mask)
 for box in v['paw']:d.ellipse(box,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(9));res=cat_img.copy();res.putalpha(ImageChops.multiply(cat_img.getchannel('A'),mask));return res

def main():
 for (cat,pose),source in CATS.items():
  d=ROOT/'cat-poses'/cat;d.mkdir(parents=True,exist_ok=True)
  original=Image.open(Path('/mnt/data')/source).convert('RGBA');original.save(d/f'{pose}.png',compress_level=1)
  d=ROOT/'cat-paws'/cat;d.mkdir(parents=True,exist_ok=True)
  paw_image(original,COORD[pose]).save(d/f'{pose}.png',compress_level=1)
  d=ROOT/'wearables'/cat/pose;d.mkdir(parents=True,exist_ok=True)
  for id in CLOTHES:cloth(id,COORD[pose],cat).save(d/f'{id}.png',compress_level=1)
  for id in OTHERS:accessory(id,COORD[pose],cat).save(d/f'{id}.png',compress_level=1)
 # Real PNG product cards, rendered from exactly the same sprites as the game.
 dst=ROOT/'shop-thumbs';dst.mkdir(parents=True,exist_ok=True)
 base=Image.open(ROOT/'cat-poses/mimi/stand.png').convert('RGBA')
 paw=Image.open(ROOT/'cat-paws/mimi/stand.png').convert('RGBA')
 for id in [*CLOTHES,*OTHERS]:
  composed=base.copy();composed.alpha_composite(Image.open(ROOT/f'wearables/mimi/stand/{id}.png').convert('RGBA'))
  if id in CLOTHES:composed.alpha_composite(paw)
  composed.thumbnail((370,370),Image.Resampling.LANCZOS)
  tile=Image.new('RGBA',(400,400));tile.alpha_composite(composed,((400-composed.width)//2,(400-composed.height)//2))
  tile.save(dst/f'{id}.png',compress_level=1)
 print('Done:',len(list((ROOT/'wearables').rglob('*.png'))),'PNG layers;',len(list(dst.glob('*.png'))),'product thumbnails')
if __name__=='__main__':main()
