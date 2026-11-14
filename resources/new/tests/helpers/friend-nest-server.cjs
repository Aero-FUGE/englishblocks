// Automated regression fixture only. Do not expose this seeded server as a user preview.
const express=require('express'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCloudService}=require('../../server/cloud.cjs'),catalog=require('../../server/social-catalog.json');
const port=Number(process.env.EB_PREVIEW_PORT||4174),dir=fs.mkdtempSync(path.join(os.tmpdir(),'eb-friend-preview-'));
const service=createCloudService({dataDir:dir,socialOptions:{minStudyMs:5}}),app=express();
app.disable('x-powered-by');app.use('/api/cloud/mimi',(_q,r)=>r.status(503).json({error:'此独立预览不连接 AI 服务'}));app.use(service.middleware);
let accounts=[];
app.get('/preview/friends/:index?',(q,r)=>{const a=accounts[Number(q.params.index)||0];if(!a)return r.status(503).send('预览准备中');r.set('Cache-Control','no-store').type('html').send(`<!doctype html><meta charset="utf-8"><title>好友小窝 · 独立体验</title><script>const a=${JSON.stringify(a).replace(/</g,'\\u003c')};localStorage.clear();localStorage.setItem('englishblocks_cloud_session_v1:'+location.origin,JSON.stringify(a.session));localStorage.setItem('word_candy_single_profile_v3',JSON.stringify(a.snapshot.profile));localStorage.setItem('english_blocks_cat_collection_v1',JSON.stringify(a.snapshot.collection));location.replace('/#friends');</script>`);});
app.use('/api',(_q,r)=>r.status(404).json({error:'找不到此接口'}));app.use(express.static(path.resolve(__dirname,'../../dist')));app.get('*',(_q,r)=>r.sendFile(path.resolve(__dirname,'../dist/index.html')));
const server=app.listen(port,'0.0.0.0',async()=>{try{
 const call=async(route,body,token,method=body?'POST':'GET')=>{const r=await fetch(`http://127.0.0.1:${port}/api/cloud`+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error(route+': '+JSON.stringify(d));return d;};
 for(const [i,name] of ['小窝体验员','雪','团团'].entries()){
  const session=await call('/register',{username:'nest_preview_'+i,password:'NestPreview2026!'});
  const snapshot={profile:{id:'user_main',name,avatar:['cat-avatar-05','cat-avatar-24','cat-avatar-01'][i],themeColor:'green',currentLevelIndex:i?10:15,completedLevelIds:[],masteredWordIds:[],starredWordIds:[],mistakeHistory:[],streakDays:1,totalAttempts:0,correctAttempts:0,totalWordGoal:2004,totalSentenceGoal:1190},collection:{fish:500,activeCat:i?'tuanzhang':'mimi',owned:['wizard-hat'],equipped:{mimi:{hat:'wizard-hat'},tuanzhang:{hat:'wizard-hat'}},bestHints:{},unlockedThemes:['spring','summer','autumn','winter'],selectedSeason:'spring'}};
  await call('/save',{expectedRevision:0,snapshot},session.token,'PUT');accounts.push({session,snapshot});
  for(const level of catalog.levels.slice(0,i===0?13:i===1?10:1)){
   const start=await call('/learning/start',{levelId:level.id},session.token),phases=level.phases?.length?level.phases:[null];
   for(let phase=0;phase<phases.length;phase++){await new Promise(r=>setTimeout(r,12));const pool=[...level.words],norm=s=>s.toLowerCase().replace(/[,.?!]|[’']$/g,'');const wordIds=phases[phase]?level.words.filter(w=>phases[phase].includes(w.id)).map(w=>w.id):level.sequence.map(text=>{const index=pool.findIndex(w=>norm(w.clean)===norm(text));return pool.splice(index,1)[0].id;});await call('/learning/complete',{attemptId:start.attemptId,phase,wordIds},session.token);}
  }
 }
 const [a,b,c]=accounts.map(a=>a.session.token),code=(await call('/social',null,b)).code;await call('/social/request',{code},a);let requests=(await call('/social',null,b)).requests;await call('/social/requests/'+requests[0].id,{action:'accept'},b);
 await call('/social/request',{code:(await call('/social',null,a)).code},c);
 await call('/social/throw',{receiverId:accounts[0].session.user.id,key:'preview-incoming-egg'},b);
 console.log(`READY isolated friend preview http://127.0.0.1:${port}/preview/friends (0 self / 1 friend / 2 applicant)`);
 }catch(e){console.error(e);server.close();service.close();process.exitCode=1;}});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>{service.close();fs.rmSync(dir,{recursive:true,force:true});process.exit();}));
