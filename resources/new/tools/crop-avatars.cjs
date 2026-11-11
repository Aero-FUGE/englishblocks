// Extract complete portrait tiles at their actual bounds; contain inside a square canvas.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({args:['--no-sandbox']});try{
 const page=await browser.newPage();
 for(let sheet=0;sheet<2;sheet++){
 const data=fs.readFileSync(path.resolve('../source/UI',sheet?'头像2.png':'头像.png')).toString('base64');
 const bounds=sheet?{cols:[[14,386],[392,768],[773,1142],[1149,1526]],rows:[[10,344],[350,670],[678,1015]]}:{cols:[[19,381],[397,758],[777,1137],[1153,1517]],rows:[[10,336],[350,664],[678,1006]]};
 const tiles=await page.evaluate(async({data,bounds})=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const tiles=[];
 for(const [top,bottom]of bounds.rows)for(const[left,right]of bounds.cols){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const ctx=canvas.getContext('2d');
 const width=right-left,height=bottom-top,scale=312/Math.max(width,height);
 ctx.drawImage(img,left,top,width,height,(320-width*scale)/2,(320-height*scale)/2,width*scale,height*scale);
 tiles.push(canvas.toDataURL('image/png').split(',')[1]);}return tiles;},{data,bounds});
 tiles.forEach((data,i)=>fs.writeFileSync('public/assets/avatars/'+String(sheet*12+i+1).padStart(2,'0')+'.png',Buffer.from(data,'base64')));
 }console.log('Cropped 24 complete portraits, centered with padding on 320×320 canvases.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
