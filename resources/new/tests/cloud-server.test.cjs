const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {createCloudService}=require('../server/cloud.cjs');
function snapshot(fish=16){return {profile:{id:'user_main',name:'测试玩家',avatar:'🐱',themeColor:'green',currentLevelIndex:1,completedLevelIds:[1],masteredWordIds:[],starredWordIds:['word_1'],mistakeHistory:[],streakDays:1,totalAttempts:1,correctAttempts:1,totalWordGoal:2004,totalSentenceGoal:1190,timingRecords:{'1':{bestMs:14000}}},collection:{fish,activeCat:'mimi',owned:[],equipped:{mimi:{},tuanzhang:{}},bestHints:{}},preferences:{bgm:.25}};}
async function fixture(t,options={}){
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'englishblocks-cloud-test-'));
 let service=createCloudService({dataDir,...options});
 const server=http.createServer((req,res)=>service.middleware(req,res,()=>{res.statusCode=404;res.end();}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));service.close();fs.rmSync(dataDir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+server.address().port;
 const call=async(route,method='GET',body,token,headers={})=>{
  const res=await fetch(base+'/api/cloud'+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,data:res.status===204?null:await res.json(),headers:res.headers};
 };
 const auth=(username,register=true)=>call(register?'/register':'/login','POST',{username,password:'test-password-only-123'});
 return {call,auth,dataDir,reopen:()=>{service.close();service=createCloudService({dataDir,...options});}};
}
test('accounts, persistence, CAS conflicts, isolation, history and logout',async t=>{
 const {call,auth,dataDir,reopen}=await fixture(t);
 assert.equal((await call('/save')).status,401);
 assert.equal((await call('/social')).status,401);
 assert.equal((await call('/learning/start','POST',{levelId:1})).status,401);
 assert.equal((await call('/mimi','POST',{})).status,401);
 const a=await auth('player_a'),b=await auth('player_b');
 assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.data.user.id,b.data.user.id);
 assert.equal((await auth('player_a')).status,409);
 assert.equal((await call('/login','POST',{username:'player_a',password:'incorrect-password'})).status,401);
 const alice=a.data.token,bob=b.data.token;
 assert.equal((await call('/mimi','POST',{},alice)).status,400);
 assert.equal((await call('/save','PUT',{expectedRevision:0,snapshot:snapshot()},alice)).status,200);
 assert.equal((await call('/save','GET',undefined,bob)).data.snapshot,null);
 assert.equal((await call('/save','GET',undefined,alice)).data.snapshot.collection.fish,16);
 const updates=await Promise.all([17,18].map(fish=>call('/save','PUT',{expectedRevision:1,snapshot:snapshot(fish)},alice)));
 assert.deepEqual(updates.map(r=>r.status).sort(),[200,409]);
 const cloud=(await call('/save','GET',undefined,alice)).data;
 assert.equal(cloud.revision,2);assert.ok([17,18].includes(cloud.snapshot.collection.fish));
 const conflict=updates.find(r=>r.status===409);assert.equal(conflict.data.revision,2);
 assert.equal((await call('/history','GET',undefined,alice)).data.history.length,1);
 assert.equal((await call('/history/1','GET',undefined,alice)).data.snapshot.collection.fish,16);
 assert.equal((await call('/history/1','GET',undefined,bob)).status,404);
 const broken=snapshot();broken.collection.fish=-1;
 assert.equal((await call('/save','PUT',{expectedRevision:2,snapshot:broken},alice)).status,400);
 assert.equal((await call('/save','PUT',null,alice)).status,400);
 assert.equal((await call('/login','POST',null)).status,400);
 reopen();
 assert.equal((await call('/save','GET',undefined,alice)).data.revision,2,'session and save survive reopening the database');
 assert.equal((await call('/save','PUT',{expectedRevision:2,snapshot:{profile:[],collection:{}}},alice)).status,400);
 const db=new DatabaseSync(path.join(dataDir,'accounts.sqlite'));
 const user=db.prepare('SELECT * FROM users WHERE id=?').get(a.data.user.id);
 assert.ok(!user.password.includes('test-password-only-123'));assert.equal(db.prepare('SELECT * FROM sessions WHERE token=?').get(alice),undefined);
 db.close();
 const second=await auth('player_a',false);assert.equal(second.status,200);
 assert.equal((await call('/save','GET',undefined,second.data.token)).data.revision,2);
 assert.equal((await call('/logout','POST',{},alice)).status,200);
 assert.equal((await call('/save','GET',undefined,alice)).status,401);
 assert.equal((await call('/save','GET',undefined,second.data.token)).status,200);
});
test('origin restrictions and desktop preflight',async t=>{
 const {call}=await fixture(t,{allowedOrigins:'englishblocks://app'});
 assert.equal((await call('/health','GET',undefined,undefined,{Origin:'https://untrusted.invalid'})).status,403);
 const preflight=await call('/save','OPTIONS',undefined,undefined,{Origin:'englishblocks://app'});
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'englishblocks://app');
});
test('expired sessions and disabled registration',async t=>{
 const {call,auth,dataDir}=await fixture(t);
 const a=await auth('expired_player');
 const db=new DatabaseSync(path.join(dataDir,'accounts.sqlite'));db.prepare('UPDATE sessions SET expires=0').run();db.close();
 assert.equal((await call('/me','GET',undefined,a.data.token)).status,401);
 const disabled=await fixture(t,{registration:false});assert.equal((await disabled.auth('no_signup')).status,403);
});
test('auth requests are rate limited',async t=>{
 const {call}=await fixture(t);
 for(let i=0;i<15;i++)assert.equal((await call('/login','POST',{username:'none',password:'not-the-password'})).status,401);
 assert.equal((await call('/login','POST',{username:'none',password:'not-the-password'})).status,429);
});

test('music history cloud saves remain separate from English progress and other accounts',async t=>{
 const {call,auth,reopen}=await fixture(t);const a=(await auth('music_player_a')).data,b=(await auth('music_player_b')).data;
 const saved=snapshot(177),english=structuredClone(saved.profile);saved.collection.musicHistory={version:1,questions:{'music-genres-01':{organizeComplete:true,retrieveComplete:false,lastStudiedAt:100,attempts:[{at:100,mode:'organize',correct:true,answer:'测试答案',version:'v1'}],drafts:{retrieve:{version:'v1',paragraph:0,slots:[[null,'music-genres-01-p0-s1']]}}}}};
 saved.collection.musicHistory.edits={'music-genres-01':{updatedAt:101,paragraphs:[[{role:'framework',text:'悲剧起源于'},{role:'knowledge',text:'古希腊时代'},{role:'framework',text:'。'}]]}};
 assert.equal((await call('/save','PUT',{expectedRevision:0,snapshot:saved},a.token)).status,200);reopen();const restored=(await call('/save','GET',undefined,a.token)).data.snapshot;assert.deepEqual(restored.profile,english);assert.deepEqual(restored.collection.musicHistory,saved.collection.musicHistory);assert.equal(restored.collection.fish,177);assert.equal((await call('/save','GET',undefined,b.token)).data.snapshot,null);
 const malformed=structuredClone(saved);malformed.collection.musicHistory.questions['music-genres-01'].organizeComplete=false;malformed.collection.musicHistory.questions['music-genres-01'].retrieveComplete=true;assert.equal((await call('/save','PUT',{expectedRevision:1,snapshot:malformed},a.token)).status,400);
 const invalidEdit=structuredClone(saved);invalidEdit.collection.musicHistory.edits['music-genres-01'].paragraphs[0][1].text='';assert.equal((await call('/save','PUT',{expectedRevision:1,snapshot:invalidEdit},a.token)).status,400);
 // Old saves without this optional field are still valid.
 assert.equal((await call('/save','PUT',{expectedRevision:1,snapshot:snapshot(178)},a.token)).status,200);
});
