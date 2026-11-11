const {findAvatar}=require('../shared/avatars.mjs');
const {randomBytes,randomUUID}=require('node:crypto');
const catalog=require('./social-catalog.json');
const levels=new Map(catalog.levels.map(l=>[l.id,l]));
const labels=['初中基础','高中进阶','大学英语','考研冲刺'];
const bad=(message,status=400)=>Object.assign(new Error(message),{status});
const clean=s=>s.toLowerCase().replace(/[,.?!]|[’']$/g,'');
const code=()=>randomBytes(6).toString('hex').toUpperCase();
const dayAt=t=>new Date(t+8*3600000).toISOString().slice(0,10);
function weekAt(t){const d=new Date(dayAt(t)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
function createSocial(db,{now=Date.now,minStudyMs=3000}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS social_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id),friend_code TEXT UNIQUE NOT NULL,last_active INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS friend_requests(id TEXT PRIMARY KEY,sender TEXT NOT NULL REFERENCES users(id),receiver TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected')),created_at INTEGER NOT NULL,UNIQUE(sender,receiver),CHECK(sender<>receiver));
 CREATE TABLE IF NOT EXISTS friendships(low_id TEXT NOT NULL REFERENCES users(id),high_id TEXT NOT NULL REFERENCES users(id),created_at INTEGER NOT NULL,PRIMARY KEY(low_id,high_id),CHECK(low_id<high_id));
 CREATE TABLE IF NOT EXISTS learning_attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),level_id INTEGER NOT NULL,next_phase INTEGER NOT NULL DEFAULT 0,started_at INTEGER NOT NULL,ready_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,finished INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS learning_completions(user_id TEXT NOT NULL REFERENCES users(id),level_id INTEGER NOT NULL,completed_at INTEGER NOT NULL,day TEXT NOT NULL,PRIMARY KEY(user_id,level_id));
 CREATE TABLE IF NOT EXISTS prank_wallet(user_id TEXT PRIMARY KEY REFERENCES users(id),balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0));
 CREATE TABLE IF NOT EXISTS prank_grants(user_id TEXT NOT NULL REFERENCES users(id),day TEXT NOT NULL,threshold INTEGER NOT NULL,PRIMARY KEY(user_id,day,threshold));
 CREATE TABLE IF NOT EXISTS pranks(id TEXT PRIMARY KEY,sender TEXT NOT NULL REFERENCES users(id),receiver TEXT NOT NULL REFERENCES users(id),item TEXT NOT NULL CHECK(item='stink_egg'),created_at INTEGER NOT NULL,day TEXT NOT NULL,seen_at INTEGER,handled_at INTEGER,request_key TEXT NOT NULL,UNIQUE(sender,request_key));
 CREATE TABLE IF NOT EXISTS learning_events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,title TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS requests_inbox ON friend_requests(receiver,status);
 CREATE INDEX IF NOT EXISTS pranks_inbox ON pranks(receiver,handled_at,created_at);
 CREATE INDEX IF NOT EXISTS pranks_daily ON pranks(sender,receiver,day);
 CREATE INDEX IF NOT EXISTS completions_day ON learning_completions(user_id,day);
 CREATE INDEX IF NOT EXISTS learning_feed ON learning_events(user_id,created_at);
 CREATE INDEX IF NOT EXISTS attempts_user ON learning_attempts(user_id,level_id);`);
 const get=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
 function ensure(id){if(!get('SELECT user_id FROM social_profiles WHERE user_id=?',id)){
  for(let i=0;i<5;i++){try{run('INSERT INTO social_profiles(user_id,friend_code) VALUES(?,?)',id,code());break;}catch(e){if(i===4)throw e;}}
 }run('INSERT OR IGNORE INTO prank_wallet(user_id) VALUES(?)',id);}
 function touch(id){ensure(id);run('UPDATE social_profiles SET last_active=? WHERE user_id=?',now(),id);}
 const pair=(a,b)=>a<b?[a,b]:[b,a];
 function friends(a,b){return a!==b&&!!get('SELECT 1 FROM friendships WHERE low_id=? AND high_id=?',...pair(a,b));}
 function requireFriend(a,b){if(!friends(a,b))throw bad('只有互相确认的好友才能访问或恶作剧',403);}
 const count=(id,from,to)=>Number(get('SELECT COUNT(*) AS n FROM learning_completions WHERE user_id=? AND day>=? AND day<=?',id,from,to).n);
 function wallet(id){ensure(id);const today=count(id,dayAt(now()),dayAt(now()));return {balance:get('SELECT balance FROM prank_wallet WHERE user_id=?',id).balance,today,earnedToday:Number(get('SELECT COUNT(*) AS n FROM prank_grants WHERE user_id=? AND day=?',id,dayAt(now())).n),dailyMaximum:3,nextIn:today>=30?0:10-today%10};}
 function publicProfile(id){ensure(id);const row=get('SELECT snapshot FROM saves WHERE user_id=?',id);let snapshot;try{snapshot=JSON.parse(row?.snapshot||'null');}catch{}
  const p=snapshot?.profile||{},c=snapshot?.collection||{};
  const selected=catalog.levels[Number.isSafeInteger(p.currentLevelIndex)?p.currentLevelIndex:0]||catalog.levels[0];
  const owned=catalog.items.filter(i=>i.price===0||Array.isArray(c.owned)&&c.owned.includes(i.id));
  const cat=['mimi','tuanzhang'].includes(c.activeCat)?c.activeCat:'mimi';const equipped={};
  for(const [slot,id]of Object.entries(c.equipped?.[cat]||{}))if(owned.some(i=>i.id===id&&i.slot===slot&&i.cats.includes(cat)))equipped[slot]=id;
  const total=Number(get('SELECT COUNT(*) AS n FROM learning_completions WHERE user_id=?',id).n);
  const last=get('SELECT last_active FROM social_profiles WHERE user_id=?',id).last_active;
  return {id,avatar:findAvatar(p.avatar)?.id||null,name:typeof p.name==='string'?p.name.slice(0,40):'学习小伙伴',cat,equipped,pose:['peek','half','stand','sit'].includes(c.poses?.[cat])?c.poses[cat]:'peek',expression:['smile','focus','proud','shy'].includes(c.expressions?.[cat])?c.expressions[cat]:'smile',level:1+Math.floor(total/10),stage:labels[Math.min(3,Math.max(0,selected.tier-1))],currentLevel:selected.levelNumber,completed:total,totalLevels:catalog.levels.length,today:count(id,dayAt(now()),dayAt(now())),week:count(id,weekAt(now()),dayAt(now())),online:now()-last<180000,owned:owned.map(i=>({id:i.id,name:i.name})),lastActive:last||null};
 }
 function incoming(id){return all('SELECT * FROM pranks WHERE receiver=? AND handled_at IS NULL ORDER BY created_at,id LIMIT 30',id).map(p=>({id:p.id,senderId:p.sender,senderName:publicProfile(p.sender).name,item:p.item,sentAt:p.created_at,seen:!!p.seen_at,handled:false,canCounter:friends(id,p.sender)}));}
 function dashboard(id){ensure(id);const ids=all('SELECT CASE WHEN low_id=? THEN high_id ELSE low_id END AS id FROM friendships WHERE low_id=? OR high_id=?',id,id,id);
  const pending=all("SELECT * FROM friend_requests WHERE (sender=? OR receiver=?) AND status='pending' ORDER BY created_at DESC",id,id);
  return {self:publicProfile(id),code:get('SELECT friend_code FROM social_profiles WHERE user_id=?',id).friend_code,wallet:wallet(id),friends:ids.map(r=>publicProfile(r.id)),requests:pending.map(r=>{const p=publicProfile(r.sender===id?r.receiver:r.sender);return {id:r.id,incoming:r.receiver===id,player:{id:p.id,name:p.name,cat:p.cat,avatar:p.avatar},createdAt:r.created_at};}),inbox:incoming(id),pendingCount:Number(get('SELECT COUNT(*) AS n FROM pranks WHERE receiver=? AND handled_at IS NULL',id).n),weekStart:weekAt(now())};
 }
 function throwEgg(sender,receiver,key){
  if(typeof receiver!=='string'||receiver.length>100)throw bad('好友账号不正确');
  if(typeof key!=='string'||!/^[\w-]{8,100}$/.test(key))throw bad('请重新点击投掷按钮');
  const previous=get('SELECT * FROM pranks WHERE sender=? AND request_key=?',sender,key);
  if(previous){if(previous.receiver!==receiver)throw bad('重复请求内容不一致',409);return {id:previous.id,duplicate:true};}
  requireFriend(sender,receiver);ensure(sender);
  const sent=Number(get('SELECT COUNT(*) AS n FROM pranks WHERE sender=? AND receiver=? AND day=?',sender,receiver,dayAt(now())).n);
  if(sent>=3)throw bad('今天已经向这位好友投过3次啦，明天再玩喵',429);
  if(get('SELECT balance FROM prank_wallet WHERE user_id=?',sender).balance<1)throw bad('恶作剧机会不足：每天完成10道有效题目可获得1次');
  run('UPDATE prank_wallet SET balance=balance-1 WHERE user_id=? AND balance>0',sender);
  const id=randomUUID();run('INSERT INTO pranks(id,sender,receiver,item,created_at,day,request_key) VALUES(?,?,?,?,?,?,?)',id,sender,receiver,'stink_egg',now(),dayAt(now()),key);
  return {id,duplicate:false};
 }
 function event(id,kind,title){run('INSERT INTO learning_events VALUES(?,?,?,?,?)',randomUUID(),id,kind,title,now());}
 async function handle(id,route,method,data){
  ensure(id);
  if(route==='/social'&&method==='GET')return dashboard(id);
  if(route==='/social/notifications'&&method==='GET')return {inbox:incoming(id),pendingCount:Number(get('SELECT COUNT(*) AS n FROM pranks WHERE receiver=? AND handled_at IS NULL',id).n),wallet:wallet(id)};
  if(route==='/social/request'&&method==='POST')return transaction(()=>{
   const friendCode=typeof data?.code==='string'?data.code.trim().toUpperCase():'';
   const target=get('SELECT user_id FROM social_profiles WHERE friend_code=?',friendCode)?.user_id;
   if(!target||target===id)throw bad('好友码不存在，或这是你自己的好友码');
   if(friends(id,target))throw bad('你们已经是好友啦');
   if(all('SELECT 1 FROM friendships WHERE low_id=? OR high_id=?',id,id).length>=100||all('SELECT 1 FROM friendships WHERE low_id=? OR high_id=?',target,target).length>=100)throw bad('好友数量达到上限');
   const existing=get("SELECT * FROM friend_requests WHERE ((sender=? AND receiver=?) OR (sender=? AND receiver=?)) AND status='pending'",id,target,target,id);
   if(existing)return {ok:true,pending:true,incoming:existing.receiver===id};
   if(Number(get("SELECT COUNT(*) n FROM friend_requests WHERE receiver=? AND status='pending'",target).n)>=50)throw bad('对方待处理申请太多，请稍后再试',429);
   run("INSERT INTO friend_requests VALUES(?,?,?,'pending',?) ON CONFLICT(sender,receiver) DO UPDATE SET id=excluded.id,status='pending',created_at=excluded.created_at",randomUUID(),id,target,now());return {ok:true};
  });
  const req=/^\/social\/requests\/([\w-]+)$/.exec(route);
  if(req&&method==='POST')return transaction(()=>{const r=get('SELECT * FROM friend_requests WHERE id=?',req[1]);if(!r||r.receiver!==id)throw bad('无权处理该申请',403);
   if(!['accept','reject'].includes(data?.action))throw bad('申请操作不正确');
   if(r.status!=='pending')return {ok:true};
   if(data.action==='accept'){
    for(const user of [id,r.sender])if(Number(get('SELECT COUNT(*) n FROM friendships WHERE low_id=? OR high_id=?',user,user).n)>=100)throw bad('好友数量达到上限');
    run('INSERT OR IGNORE INTO friendships VALUES(?,?,?)',...pair(id,r.sender),now());
   }
   run('UPDATE friend_requests SET status=? WHERE id=?',data.action==='accept'?'accepted':'rejected',r.id);return {ok:true};});
  const friend=/^\/social\/friends\/([\w-]+)$/.exec(route);
  if(friend&&method==='GET'){requireFriend(id,friend[1]);return {player:publicProfile(friend[1]),events:all('SELECT id,kind,title,created_at AS createdAt FROM learning_events WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 20',friend[1])};}
  if(friend&&method==='POST')return transaction(()=>{if(data?.action!=='remove')throw bad('好友操作不正确');requireFriend(id,friend[1]);run('DELETE FROM friendships WHERE low_id=? AND high_id=?',...pair(id,friend[1]));run("UPDATE friend_requests SET status='rejected' WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)",id,friend[1],friend[1],id);return {ok:true};});
  if(route==='/social/throw'&&method==='POST')return transaction(()=>throwEgg(id,data?.receiverId,data?.key));
  const prank=/^\/social\/pranks\/([\w-]+)$/.exec(route);
  if(prank&&method==='POST')return transaction(()=>{const p=get('SELECT * FROM pranks WHERE id=?',prank[1]);if(!p||p.receiver!==id)throw bad('无权处理这个通知',403);
   if(!['seen','handle','counter'].includes(data?.action))throw bad('通知操作不正确');
   if(p.handled_at)return {ok:true,alreadyHandled:true};
   let result;
   if(data.action==='counter')result=throwEgg(id,p.sender,data.key);
   run('UPDATE pranks SET seen_at=COALESCE(seen_at,?),handled_at=? WHERE id=?',now(),data.action==='seen'?null:now(),p.id);return {ok:true,counter:result};});
  if(route==='/learning/start'&&method==='POST')return transaction(()=>{
   const level=levels.get(data?.levelId);if(!level)throw bad('不存在的学习关卡');
   run('DELETE FROM learning_attempts WHERE user_id=? AND expires_at<?',id,now());
   const active=get('SELECT * FROM learning_attempts WHERE user_id=? AND level_id=? AND finished=0 ORDER BY started_at DESC LIMIT 1',id,level.id);
   if(active)return {attemptId:active.id,nextPhase:active.next_phase,readyAt:active.ready_at};
   if(Number(get('SELECT COUNT(*) n FROM learning_attempts WHERE user_id=? AND finished=0',id).n)>=8)run('DELETE FROM learning_attempts WHERE id=(SELECT id FROM learning_attempts WHERE user_id=? AND finished=0 ORDER BY started_at LIMIT 1)',id);
   const attempt=randomUUID();run('INSERT INTO learning_attempts VALUES(?,?,?,0,?,?,?,0)',attempt,id,level.id,now(),now()+minStudyMs,now()+3600000);return {attemptId:attempt,nextPhase:0,readyAt:now()+minStudyMs};
  });
  if(route==='/learning/complete'&&method==='POST')return transaction(()=>{
   const a=get('SELECT * FROM learning_attempts WHERE id=? AND user_id=?',typeof data?.attemptId==='string'?data.attemptId:'',id);if(!a)throw bad('学习凭证无效，请重新进入本关',403);
   if(a.finished)return {ok:true,duplicate:true,wallet:wallet(id)};
   if(a.expires_at<now())throw bad('学习凭证已过期，请重新进入本关',409);
   const level=levels.get(a.level_id),phases=level.phases?.length?level.phases:[level.words.map(w=>w.id)];
   if(!Number.isInteger(data.phase)||data.phase<0||data.phase>=phases.length)throw bad('学习阶段不正确');
   if(data.phase<a.next_phase)return {ok:true,duplicate:true,nextPhase:a.next_phase,readyAt:a.ready_at};
   if(data.phase!==a.next_phase)throw bad('请按顺序完成本关各阶段',409);
   if(now()<a.ready_at)throw bad('学习凭证还在准备中，请稍后重试',425);
   if(!Array.isArray(data.wordIds)||data.wordIds.length!==phases[data.phase].length||new Set(data.wordIds).size!==data.wordIds.length)throw bad('请提交完整且不重复的词块');
   const bank=new Map(level.words.map(w=>[w.id,w]));
   const target=level.phases?.length?level.words.filter(w=>phases[data.phase].includes(w.id)).map(w=>w.text):level.sequence;
   if(!data.wordIds.every((wid,i)=>phases[data.phase].includes(wid)&&bank.has(wid)&&clean(bank.get(wid).clean)===clean(target[i])))throw bad('服务器核对发现句子还没拼对');
   const finished=data.phase===phases.length-1;
   run('UPDATE learning_attempts SET next_phase=?,ready_at=?,finished=? WHERE id=?',data.phase+1,now()+Math.min(1000,minStudyMs),finished?1:0,a.id);
   if(!finished)return {ok:true,nextPhase:data.phase+1,readyAt:now()+Math.min(1000,minStudyMs)};
   const inserted=run('INSERT OR IGNORE INTO learning_completions VALUES(?,?,?,?)',id,level.id,now(),dayAt(now())).changes;
   if(inserted){
    const total=Number(get('SELECT COUNT(*) n FROM learning_completions WHERE user_id=?',id).n);event(id,'complete',`完成第${level.levelNumber}关 · ${labels[Math.min(3,level.tier-1)]}`);
    if(total%10===0)event(id,'level',`学习等级提升到 Lv.${1+Math.floor(total/10)}`);
    if([1,10,30,100,300,1000].includes(total))event(id,'achievement',`获得成就：累计完成${total}道有效题目`);
    const today=count(id,dayAt(now()),dayAt(now()));
    for(let threshold=10;threshold<=Math.min(today,30);threshold+=10){if(run('INSERT OR IGNORE INTO prank_grants VALUES(?,?,?)',id,dayAt(now()),threshold).changes)run('UPDATE prank_wallet SET balance=balance+1 WHERE user_id=?',id);}
   }
   return {ok:true,counted:!!inserted,wallet:wallet(id)};
  });
  throw bad('找不到好友或学习接口',404);
 }
 return {handle,touch};
}
module.exports={createSocial,dayAt,weekAt};
