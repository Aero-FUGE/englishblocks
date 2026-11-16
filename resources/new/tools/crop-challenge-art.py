"""Authoring only: Pillow. Preserve supplied transparent art; no generated artwork."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
src=root.parent/'source/UI'; out=root/'public/assets/challenge';out.mkdir(parents=True,exist_ok=True)
def save(im,name,width):
 mask=im.getchannel('A').point(lambda v:255 if v>20 else 0);box=mask.getbbox()
 if box:im=im.crop(box)
 if im.width>width:im=im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
 im.save(out/(name+'.webp'),quality=94,method=6)
for season,name in [('spring','春'),('summer','夏'),('autumn','秋'),('winter','冬')]:save(Image.open(src/(name+'按钮.png')).convert('RGBA'),'continue-'+season,1200)
save(Image.open(src/'每日挑战.png').convert('RGBA'),'daily-banner',1100)
im=Image.open(src/'每日挑战里的图标.png').convert('RGBA')
boxes={'gate':(0,145,333,490),'tea':(334,185,608,490),'tree':(609,150,895,490),'compass':(897,140,1174,490),'castle':(1176,135,1536,490),'book':(0,530,315,850),'flame':(316,530,604,850),'crown':(605,530,889,850),'dragon':(890,525,1194,850),'fish':(1195,530,1536,850)}
for name,box in boxes.items():save(im.crop(box),name,256)
print('Exported',len(list(out.glob('*.webp'))),'transparent WebP assets')
