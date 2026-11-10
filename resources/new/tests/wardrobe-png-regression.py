from pathlib import Path
from PIL import Image
import re
P=Path(__file__).resolve().parents[1]
items=re.findall(r"\{id:'([^']+)',name:'[^']+',slot:'([^']+)'",(P/'src/data/catShop.ts').read_text())
assert len(items)==39,(len(items),items)
root=P/'public/assets'
for cat in ['mimi','tuanzhang']:
 for pose in ['peek','half','stand']:
  base=root/'cat-poses'/cat/f'{pose}.png'
  paw=root/'cat-paws'/cat/f'{pose}.png'
  for file in [base,paw]:
   im=Image.open(file)
   assert im.mode=='RGBA' and im.size==(1254,1254),file
   assert im.getchannel('A').getbbox() is not None,file
  for id,slot in items:
   layer=root/'wearables'/cat/pose/f'{id}.png'
   img=Image.open(layer)
   assert img.mode=='RGBA' and img.size==(1254,1254),layer
   assert img.getchannel('A').getbbox() is not None,layer
   assert img.getpixel((0,0))[3]==0,layer
for id,_ in items:
 f=root/'shop-thumbs'/f'{id}.png'
 im=Image.open(f);assert im.mode=='RGBA' and im.size==(400,400)
print(f'PASS: 2 cats × 3 poses × {len(items)} independently wearable RGBA PNGs, 6 real base poses and {len(items)} product previews.')
main=(P/'src/components/MainStudyBoard.tsx').read_text()
assert 'pose={catPose}' in main and 'items={catOutfit}' in main
app=(P/'src/App.tsx').read_text()
assert 'catPose={collection.poses?.[collection.activeCat]' in app
assert 'catOutfit={collection.equipped?.[collection.activeCat]' in app
assert 'catExpression={collection.expressions?.[collection.activeCat]' in app
print('PASS: floating translator shares wardrobe outfit + pose + expression state.')
