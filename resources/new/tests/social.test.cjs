const {test}=require('node:test');const assert=require('node:assert/strict');const {DatabaseSync}=require('node:sqlite');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {createSocial,dayAt,weekAt}=require('../server/social.cjs');const catalog=require('../server/social-catalog.json');
function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'englishblocks-social-'));let db=new DatabaseSync(path.join(directory,'db.sqlite'));db.exec('PRAGMA foreign_keys=ON;CREATE TABLE users(id TEXT PRIMARY KEY);CREATE TABLE saves(user_id TEXT PRIMARY KEY,snapshot TEXT);INSERT INTO users VALUES(\'alice\'),(\'bob\'),(\'eve\')');let clock=Date.parse('2026-11-09T04:00:00Z');let service=createSocial(db,{now:()=>clock,minStudyMs:10});const api=(id,route,data)=>service.handle(id,route,data===undefined?'GET':'POST',data);t.after(()=>{db.close();fs.rmSync(directory,{recursive:true,force:true});});return {get db(){return db;},api,tick:(ms)=>clock+=ms,reopen:()=>{db.close();db=new DatabaseSync(path.join(directory,'db.sqlite'));db.exec('PRAGMA foreign_keys=ON');service=createSocial(db,{now:()=>clock,minStudyMs:10});},now:()=>clock};}
async function makeFriends(f){const a=await f.api('alice','/social'),b=await f.api('bob','/social');await f.api('alice','/social/request',{code:b.code});const incoming=(await f.api('bob','/social')).requests[0];await f.api('bob','/social/requests/'+incoming.id,{action:'accept'});return {a,b};}
async function solve(f,id,level){const started=await f.api(id,'/learning/start',{levelId:level.id});const phases=level.phases?.length?level.phases:[level.words.map(w=>w.id)];let result;for(let phase=0;phase<phases.length;phase++){f.tick(20);const ids=level.phases?.length?level.words.filter(w=>phases[phase].includes(w.id)).map(w=>w.id):(()=>{const unused=[...level.words];return level.sequence.map(text=>{const i=unused.findIndex(w=>w.text.toLowerCase().replace(/[,.?!]|[’']$/g,'')===text.toLowerCase().replace(/[,.?!]|[’']$/g,''));assert.ok(i>=0);return unused.splice(i,1)[0].id;});})();result=await f.api(id,'/learning/complete',{attemptId:started.attemptId,phase,wordIds:ids});}return {started,result};}
test('friend codes, consent, rejection, authorization, public wardrobe, delete and persistence',async t=>{
 const f=fixture(t),a=await f.api('alice','/social'),b=await f.api('bob','/social');assert.notEqual(a.code,b.code);assert.equal(a.code.length,12);assert.equal((await f.api('alice','/social')).code,a.code);
 await assert.rejects(f.api('alice','/social/friends/bob'),e=>e.status===403);await assert.rejects(f.api('alice','/social/request',{code:a.code}));await assert.rejects(f.api('alice','/social/request',{code:'NO'}));
 await f.api('alice','/social/request',{code:b.code});await f.api('alice','/social/request',{code:b.code});assert.equal((await f.api('bob','/social')).requests.length,1);
 const r=(await f.api('bob','/social')).requests[0];await assert.rejects(f.api('eve','/social/requests/'+r.id,{action:'accept'}),e=>e.status===403);
 await f.api('bob','/social/requests/'+r.id,{action:'reject'});assert.equal((await f.api('bob','/social')).friends.length,0);
 await f.api('alice','/social/request',{code:b.code});const fresh=(await f.api('bob','/social')).requests[0];await f.api('bob','/social/requests/'+fresh.id,{action:'accept'});await f.api('bob','/social/requests/'+fresh.id,{action:'accept'});assert.equal((await f.api('alice','/social')).friends.length,1);
 f.db.prepare('INSERT INTO saves VALUES(?,?)').run('bob',JSON.stringify({profile:{name:'妹妹',currentLevelIndex:30,mistakeHistory:[{secret:'private mistake'}],completedLevelIds:Array.from({length:1190},(_,i)=>i)},collection:{activeCat:'tuanzhang',owned:['wizard-hat','not-real'],equipped:{tuanzhang:{hat:'wizard-hat',glasses:'not-owned'}},fish:999999},preferences:{secret:'private chat'}}));
 const space=await f.api('alice','/social/friends/bob');assert.equal(space.player.name,'妹妹');assert.equal(space.player.cat,'tuanzhang');assert.equal(space.player.equipped.hat,'wizard-hat');assert.equal(space.player.equipped.glasses,undefined);assert.equal(space.player.completed,0);assert.equal(space.player.level,1);assert.equal((await f.api('bob','/social')).wallet.balance,0);assert.ok(!JSON.stringify(space).includes('private'));assert.ok(!JSON.stringify(space).includes('999999'));
 f.reopen();assert.equal((await f.api('alice','/social')).code,a.code);assert.equal((await f.api('alice','/social')).friends.length,1);
 await f.api('alice','/social/friends/bob',{action:'remove'});await assert.rejects(f.api('alice','/social/friends/bob'),e=>e.status===403);assert.equal((await f.api('bob','/social')).friends.length,0);
});
test('server lessons reject forged, early, cross-account, duplicate and out-of-phase completions',async t=>{
 const f=fixture(t),l=catalog.levels[0];await f.api('alice','/social');const ticket=await f.api('alice','/learning/start',{levelId:l.id});
 await assert.rejects(f.api('bob','/learning/complete',{attemptId:ticket.attemptId,phase:0,wordIds:l.words.map(w=>w.id)}),e=>e.status===403);
 await assert.rejects(f.api('alice','/learning/complete',{attemptId:ticket.attemptId,phase:0,wordIds:l.words.map(w=>w.id)}),e=>e.status===425);f.tick(20);
 await assert.rejects(f.api('alice','/learning/complete',{attemptId:ticket.attemptId,phase:0,wordIds:l.words.map(()=>l.words[0].id)}));
 const {result}=await solve(f,'alice',l);assert.equal(result.counted,true);assert.equal(result.wallet.today,1);const again=await f.api('alice','/learning/complete',{attemptId:ticket.attemptId,phase:0,wordIds:[]});assert.equal(again.duplicate,true);await solve(f,'alice',l);assert.equal((await f.api('alice','/social')).self.completed,1);
 const phased=catalog.levels[1],oldPhases=phased.phases;phased.phases=[phased.words.slice(0,2).map(w=>w.id),phased.words.slice(2).map(w=>w.id)];t.after(()=>{phased.phases=oldPhases;});const p=await f.api('alice','/learning/start',{levelId:phased.id});f.tick(20);await assert.rejects(f.api('alice','/learning/complete',{attemptId:p.attemptId,phase:1,wordIds:[]}),e=>e.status===409);await solve(f,'alice',phased);assert.equal((await f.api('alice','/social')).self.completed,2);
});
test('earned wallet, daily caps, offline delivery, counter, idempotency, no balance or save damage',async t=>{
 const f=fixture(t);await makeFriends(f);
 await assert.rejects(f.api('alice','/social/throw',{receiverId:'bob',key:'request-no-balance'}));
 for(const l of catalog.levels.slice(0,31))await solve(f,'alice',l);
 let a=await f.api('alice','/social');assert.equal(a.wallet.balance,3);assert.equal(a.wallet.earnedToday,3);assert.equal(a.self.level,4);assert.equal(a.self.week,31);
 await assert.rejects(f.api('alice','/social/throw',{receiverId:'eve',key:'request-not-friend'}),e=>e.status===403);
 f.tick(180001);const egg=await f.api('alice','/social/throw',{receiverId:'bob',key:'request-egg-0001'});const same=await f.api('alice','/social/throw',{receiverId:'bob',key:'request-egg-0001'});assert.equal(same.id,egg.id);assert.equal(same.duplicate,true);assert.equal((await f.api('alice','/social')).wallet.balance,2);
 await assert.rejects(f.api('eve','/social/pranks/'+egg.id,{action:'handle'}),e=>e.status===403);
 f.reopen();let inbox=await f.api('bob','/social/notifications');assert.equal(inbox.pendingCount,1);assert.equal(inbox.inbox[0].seen,false);
 await f.api('bob','/social/pranks/'+egg.id,{action:'seen'});assert.equal((await f.api('bob','/social/notifications')).inbox[0].seen,true);
 for(const l of catalog.levels.slice(0,10))await solve(f,'bob',l);
 await f.api('bob','/social/pranks/'+egg.id,{action:'counter',key:'counter-request-1'});await f.api('bob','/social/pranks/'+egg.id,{action:'counter',key:'counter-request-2'});assert.equal((await f.api('bob','/social')).wallet.balance,0);assert.equal((await f.api('alice','/social/notifications')).pendingCount,1);assert.equal((await f.api('bob','/social/notifications')).pendingCount,0);
 await f.api('alice','/social/throw',{receiverId:'bob',key:'request-egg-0002'});await f.api('alice','/social/throw',{receiverId:'bob',key:'request-egg-0003'});
 f.db.prepare('UPDATE prank_wallet SET balance=5 WHERE user_id=?').run('alice'); // Only test fixture grants stock to isolate the separate per-friend cap.
 await assert.rejects(f.api('alice','/social/throw',{receiverId:'bob',key:'request-egg-0004'}),e=>e.status===429);
 const before=(await f.api('alice','/social')).self.completed;f.tick(86400000);assert.equal((await f.api('alice','/social')).wallet.earnedToday,0);await f.api('alice','/social/throw',{receiverId:'bob',key:'request-next-day'});assert.equal((await f.api('alice','/social')).self.completed,before);
});
test('China midnight and Monday boundaries, attendance and expiry',async t=>{
 assert.equal(dayAt(Date.parse('2026-11-08T16:00:00Z')),'2026-11-09');assert.equal(weekAt(Date.parse('2026-11-08T16:00:00Z')),'2026-11-09');assert.equal(weekAt(Date.parse('2026-11-08T15:59:59Z')),'2026-11-02');
 const f=fixture(t);await makeFriends(f);f.db.prepare('UPDATE social_profiles SET last_active=? WHERE user_id=?').run(f.now(),'bob');assert.equal((await f.api('alice','/social')).friends[0].online,true);f.tick(180001);assert.equal((await f.api('alice','/social')).friends[0].online,false);
 const ticket=await f.api('alice','/learning/start',{levelId:catalog.levels[0].id});f.tick(3600001);await assert.rejects(f.api('alice','/learning/complete',{attemptId:ticket.attemptId,phase:0,wordIds:[]}),e=>e.status===409);
});

 test('all shipped lesson answers can be represented by their real word IDs, including possessives',()=>{
  const normalize=s=>s.toLowerCase().replace(/[,.?!]|[’']$/g,'');
  for(const level of catalog.levels){const pool=[...level.words];for(const word of level.sequence){const index=pool.findIndex(w=>normalize(w.clean)===normalize(word));assert.ok(index>=0,'unmatchable lesson '+level.id);pool.splice(index,1);}}
 });

 test('public avatars accept only built-in IDs and follow the latest cloud save',async t=>{
 const f=fixture(t);await makeFriends(f);
 const setAvatar=avatar=>f.db.prepare('INSERT INTO saves VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET snapshot=excluded.snapshot').run('bob',JSON.stringify({profile:{name:'妹妹',avatar},collection:{}}));
 setAvatar('cat-avatar-24');assert.equal((await f.api('alice','/social/friends/bob')).player.avatar,'cat-avatar-24');
 setAvatar('cat-avatar-01');assert.equal((await f.api('alice','/social')).friends[0].avatar,'cat-avatar-01');
 for(const unsafe of ['https://example.com/private.png','javascript:alert(1)','cat-avatar-25','🐰']){setAvatar(unsafe);assert.equal((await f.api('alice','/social/friends/bob')).player.avatar,null);}
 });
