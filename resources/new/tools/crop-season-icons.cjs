// Extract the 32 background-removed icons without adding a geometric mask.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({args:['--no-sandbox']});try{
 const page=await browser.newPage();
 const data=fs.readFileSync(path.resolve('tools/assets/season-icons-transparent.png')).toString('base64');
 const seasons=['spring','summer','autumn','winter'];
 const names=['progress','wardrobe','friends','music','cloud','settings','profile','season'];
 const tiles=await page.evaluate(async data=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const out=[];
 for(let s=0;s<4;s++)for(let i=0;i<8;i++){
 const cols=s%2?[792,975,1154,1336]:[28,211,392,570];
 const x=cols[i%4],y=(s<2?[81,281]:[554,757])[Math.floor(i/4)];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');
 ctx.drawImage(img,x,y,174,180,0,0,192,192);
 out.push(canvas.toDataURL('image/png').split(',')[1]);}return out;},data);
 tiles.forEach((tile,i)=>{const dir='public/assets/season-icons/'+seasons[Math.floor(i/8)];fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+names[i%8]+'.png',Buffer.from(tile,'base64'));});console.log('Cropped 32 seasonal icons.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
