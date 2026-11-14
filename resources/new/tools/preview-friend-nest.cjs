// User-facing isolated preview: no seeded accounts, progress, friendships or pranks.
// Does not read production data, dotenv or AI credentials.
const express=require('express'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCloudService}=require('../server/cloud.cjs');
const port=Number(process.env.EB_PREVIEW_PORT||4174),dir=fs.mkdtempSync(path.join(os.tmpdir(),'eb-friend-preview-'));
const service=createCloudService({dataDir:dir}),app=express();
app.disable('x-powered-by');
app.use('/api/cloud/mimi',(_q,r)=>r.status(503).json({error:'此独立预览不连接 AI 服务'}));
app.use(service.middleware);
app.get('/preview/friends/:index?',(_q,r)=>r.set('Cache-Control','no-store').type('html').send(`<!doctype html><meta charset="utf-8"><title>好友小窝</title><script>
const key='englishblocks_cloud_session_v1:'+location.origin;
try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old?.user?.username?.startsWith('nest_preview_')){
for(const k of [key,'word_candy_single_profile_v3','english_blocks_cat_collection_v1','englishblocks_cloud_binding_v1','englishblocks_cloud_backups_v1'])localStorage.removeItem(k);
}}catch{}
location.replace('/#friends');</script>`));
app.use('/api',(_q,r)=>r.status(404).json({error:'找不到此接口'}));
app.use(express.static(path.resolve(__dirname,'../dist')));
app.get('*',(_q,r)=>r.sendFile(path.resolve(__dirname,'../dist/index.html')));
const server=app.listen(port,'0.0.0.0',()=>console.log(`READY empty friend preview http://127.0.0.1:${port}/preview/friends`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>{service.close();fs.rmSync(dir,{recursive:true,force:true});process.exit();}));
