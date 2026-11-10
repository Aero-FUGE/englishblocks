const { DatabaseSync } = require('node:sqlite');
const { randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const derive = promisify(scrypt);
const { createSocial } = require('./social.cjs');
const { createMimi } = require('./mimi.cjs');
const { validSnapshot } = require('../shared/snapshot.mjs');
const digest = token => createHash('sha256').update(token).digest('hex');
const dummySalt = randomBytes(16).toString('hex');
const dummyHash = `${dummySalt}:${scryptSync('invalid-account-password', dummySalt, 64).toString('hex')}`;
const safeInteger = n => Number.isSafeInteger(n) && n >= 0;


function createCloudService({ dataDir = process.env.CLOUD_DATA_DIR || path.resolve('cloud-data'), allowedOrigins = process.env.CLOUD_ALLOWED_ORIGINS || '', registration = process.env.CLOUD_ALLOW_REGISTRATION !== 'false', socialOptions = {} } = {}) {
  fs.mkdirSync(dataDir, { recursive:true, mode:0o700 });
  const db = new DatabaseSync(path.join(dataDir,'accounts.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS saves(user_id TEXT PRIMARY KEY REFERENCES users(id), revision INTEGER NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS history(user_id TEXT NOT NULL REFERENCES users(id), revision INTEGER NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id,revision));
    CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);`);
  const social = createSocial(db,socialOptions);
  const origins = new Set(allowedOrigins.split(',').map(s=>s.trim()).filter(Boolean));
  const limits = new Map();
  const mimi = createMimi();
  function rate(key, max, windowMs) {
    const now = Date.now();
    if (limits.size > 5000) for (const [k,v] of limits) if (v.until <= now) limits.delete(k);
    const item = limits.get(key);
    if (!item || item.until <= now) { limits.set(key,{count:1,until:now+windowMs}); return true; }
    return ++item.count <= max;
  }
  function send(res,status,body) { res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body)); }
  function remote(id) {
    const row = db.prepare('SELECT revision,snapshot,updated_at FROM saves WHERE user_id=?').get(id);
    return row ? {revision:row.revision,snapshot:JSON.parse(row.snapshot),updatedAt:row.updated_at} : {revision:0,snapshot:null};
  }
  async function body(req) {
    let size=0, chunks=[];
    for await (const chunk of req) { size+=chunk.length;if(size>2_000_000)throw Object.assign(Error('存档超过 2MB 限制'),{status:413});chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(Error('请求格式不正确'),{status:400}); }
  }
  async function middleware(req,res,next) {
    const route = (req.url || '').split('?')[0];
    if (!route.startsWith('/api/cloud/')) return next();
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const origin = req.headers.origin;
    let sameHost=false;
    try {const u=new URL(origin);sameHost=['http:','https:'].includes(u.protocol)&&u.host===req.headers.host;} catch {}
    if (origin && !sameHost && !origins.has(origin)) return send(res,403,{error:'此来源未获云服务授权'});
    if (origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS');
    if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
    try {
      if(route==='/api/cloud/health' && req.method==='GET')return send(res,200,{ok:true,registration});
      if(['/api/cloud/register','/api/cloud/login'].includes(route) && req.method==='POST') {
        if(!rate('auth:'+(req.ip||req.socket?.remoteAddress||'local'),15,15*60_000))return send(res,429,{error:'尝试过于频繁，请 15 分钟后再试'});
        const data=await body(req), username=String(data?.username||'').trim().toLowerCase(), password=data?.password;
        if(!/^[a-z0-9_]{4,32}$/.test(username)||typeof password!=='string'||password.length<10||password.length>128)return send(res,400,{error:'账号需为 4–32 位字母、数字或下划线；密码需为 10–128 位'});
        let user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
        if(route.endsWith('/register')) {
          if(!registration)return send(res,403,{error:'暂未开放注册，请联系管理员'});
          if(user)return send(res,409,{error:'该账号已被注册'});
          const salt=randomBytes(16).toString('hex');const hash=(await derive(password,salt,64)).toString('hex');
          const id=randomUUID();
          try {db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,username,salt+':'+hash,new Date().toISOString());}
          catch {return send(res,409,{error:'该账号已被注册'});}
          user={id,username};
        } else {
          const [salt,hash]=(user?.password||dummyHash).split(':');
          const actual=await derive(password,salt,64);
          if(!timingSafeEqual(actual,Buffer.from(hash,'hex'))||!user)return send(res,401,{error:'账号或密码不正确'});
        }
        const token=randomBytes(32).toString('base64url'),expiresAt=Date.now()+30*24*3600_000;
        db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),user.id,expiresAt);
        return send(res,200,{token,expiresAt,user:{id:user.id,username:user.username}});
      }
      const token=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1];
      const session=token && db.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(digest(token),Date.now());
      if(!session)return send(res,401,{error:'请重新登录云账号'});
      if(!rate('user:'+session.id,180,60_000))return send(res,429,{error:'同步过于频繁，请稍后再试'});
      social.touch(session.id);
      if(route.startsWith('/api/cloud/social')||route.startsWith('/api/cloud/learning/'))return send(res,200,await social.handle(session.id,route.slice('/api/cloud'.length),req.method,req.method==='POST'?await body(req):undefined));
      if(route==='/api/cloud/mimi'&&req.method==='POST')return send(res,200,await mimi(session.id,await body(req)));
      if(route==='/api/cloud/me'&&req.method==='GET')return send(res,200,{user:session});
      if(route==='/api/cloud/logout'&&req.method==='POST'){db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));return send(res,200,{ok:true});}
      if(route==='/api/cloud/save'&&req.method==='GET')return send(res,200,remote(session.id));
      if(route==='/api/cloud/save'&&req.method==='PUT') {
        const data=await body(req);
        if(!data||!safeInteger(data.expectedRevision)||!validSnapshot(data.snapshot))return send(res,400,{error:'存档格式不正确，请保留本机备份后重试'});
        db.exec('BEGIN IMMEDIATE');
        try {
          const current=remote(session.id);
          if(current.revision!==data.expectedRevision){db.exec('ROLLBACK');return send(res,409,current);}
          const revision=current.revision+1,updatedAt=new Date().toISOString(),json=JSON.stringify(data.snapshot);
          if(current.snapshot)db.prepare('INSERT INTO history VALUES(?,?,?,?)').run(session.id,current.revision,JSON.stringify(current.snapshot),current.updatedAt);
          db.prepare('INSERT INTO saves VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,snapshot=excluded.snapshot,updated_at=excluded.updated_at').run(session.id,revision,json,updatedAt);
          db.prepare('DELETE FROM history WHERE user_id=? AND revision < ?').run(session.id,revision-30);
          db.exec('COMMIT');return send(res,200,{revision,updatedAt,snapshot:data.snapshot});
        } catch(error) {db.exec('ROLLBACK');throw error;}
      }
      if(route==='/api/cloud/history'&&req.method==='GET') {
        const rows=db.prepare('SELECT revision,updated_at FROM history WHERE user_id=? ORDER BY revision DESC LIMIT 30').all(session.id);
        return send(res,200,{history:rows.map(r=>({revision:r.revision,updatedAt:r.updated_at}))});
      }
      const match=/^\/api\/cloud\/history\/(\d+)$/.exec(route);
      if(match&&req.method==='GET') {
        const row=db.prepare('SELECT * FROM history WHERE user_id=? AND revision=?').get(session.id,Number(match[1]));
        return row?send(res,200,{revision:row.revision,snapshot:JSON.parse(row.snapshot),updatedAt:row.updated_at}):send(res,404,{error:'找不到此历史版本'});
      }
      send(res,404,{error:'找不到此接口'});
    } catch(error) {console.error('[cloud]',error.status||error.code||'server-error');send(res,error.status||500,{error:error.status?error.message:'云服务暂时不可用，请保留本机记录稍后重试'});}
  }
  return {middleware,close:()=>db.close()};
}
module.exports={createCloudService,validSnapshot};
