# Authoring tool: pip install Pillow; python tools/crop-friend-nest.py
from PIL import Image,ImageDraw
from collections import deque
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=Image.open(root.parent/'source/UI/好友小窝UI.png').convert('RGBA')
out=root/'public/assets/friend-nest'
out.mkdir(parents=True,exist_ok=True)
boxes={'window':(697,210,1066,382),'cat-scholar':(683,22,878,204),'cat-winter':(879,34,1085,202),'branch':(683,383,891,491),'lantern':(876,447,952,579),'signboard':(946,447,1071,611),'versus':(867,1226,987,1316),'nav-home':(40,1231,153,1324),'nav-duel':(156,1229,269,1324),'nav-diary':(273,1229,382,1324),'nav-prank':(398,1231,500,1324),'nav-wallet':(505,1229,635,1324),'bell':(673,1222,759,1308),'refresh':(770,1225,861,1308),'egg':(798,1314,871,1380),'fish':(703,1310,795,1383),'stat-level':(713,1138,760,1180),'stat-total':(806,1137,852,1180),'stat-today':(900,1137,946,1180),'stat-week':(991,1137,1042,1180),'flowers-left':(0,1335,178,1448),'flowers-right':(939,1318,1086,1448)}
def transparent(im):
 pix=im.load();w,h=im.size;seen=set();queue=deque()
 def bg(x,y):
  r,g,b,a=pix[x,y];return a and min(r,g,b)>218 and max(r,g,b)-min(r,g,b)<11
 for x in range(w):
  for y in [0,h-1]:
   if bg(x,y):queue.append((x,y));seen.add((x,y))
 for y in range(h):
  for x in [0,w-1]:
   if bg(x,y):queue.append((x,y));seen.add((x,y))
 while queue:
  x,y=queue.popleft();r,g,b,a=pix[x,y];pix[x,y]=(r,g,b,0)
  for xx,yy in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=xx<w and 0<=yy<h and (xx,yy) not in seen and bg(xx,yy):seen.add((xx,yy));queue.append((xx,yy))
 return im
sheet=Image.new('RGB',(700,((len(boxes)+4)//5)*150),'#faf4f1');draw=ImageDraw.Draw(sheet)
for i,(name,box) in enumerate(boxes.items()):
 im=transparent(src.crop(box));im.save(out/(name+'.webp'),quality=94,method=6);thumb=im.copy();thumb.thumbnail((126,115));x=(i%5)*140+(140-thumb.width)//2;y=(i//5)*150;sheet.paste(thumb,(x,y),thumb);draw.text(((i%5)*140+5,y+120),name,fill='#5c4351')
sheet.save('/tmp/friend-assets-contact.png')
print('cropped',len(boxes),'assets',sum(p.stat().st_size for p in out.iterdir()),'bytes')
