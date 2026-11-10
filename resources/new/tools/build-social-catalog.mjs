import fs from 'node:fs';
import {SHOP_ITEMS} from '../src/data/catShop.ts';
const levels=JSON.parse(fs.readFileSync(new URL('../src/data/allLevels.json',import.meta.url)));
if(new Set(levels.map(l=>l.id)).size!==levels.length)throw Error('Duplicate lesson IDs');
for(const l of levels)if(new Set(l.words.map(w=>w.id)).size!==l.words.length||l.words.some(w=>typeof w.cleanWord!=='string'))throw Error('Invalid lesson word IDs: '+l.id);
const catalog={levels:levels.map(l=>({id:l.id,tier:l.tier,levelNumber:l.levelNumber,words:l.words.map(w=>({id:w.id,text:w.text,clean:w.cleanWord})),sequence:l.correctSequence,phases:l.tieredAssembly?.phases.map(p=>p.wordIds)})),items:SHOP_ITEMS.map(({id,name,slot,price,unlockTier,cats})=>({id,name,slot,price,unlockTier,cats}))};
fs.writeFileSync(new URL('../server/social-catalog.json',import.meta.url),JSON.stringify(catalog));
console.log(`Social catalog: ${catalog.levels.length} lessons, ${catalog.items.length} wardrobe items`);
